// ==========================================
// EVENT STORE -- the buffered writer for the event plane (observability layer, stage 2)
// ==========================================
// Stage 1 (utils/requestContext.js + utils/logger.js) made every log line say WHAT THE USER WAS DOING. This module turns that same context into one durable document per interaction. Design: docs/superpowers/specs/2026-08-16-observability-layer-design.md §2 and §5, frozen.
//
// 🔴 THE ABSOLUTE RULE: THE INTERACTION RESPONSE PATH NEVER AWAITS A WRITE. A Mongo insert is 30-80ms against Discord's 3-second budget, for zero user benefit. So:
//   · every write is fire-and-forget and swallowed, the idiom utils/alertStore.js already follows;
//   · events accumulate in an in-memory buffer and go out via one insertMany, turning hundreds of
//     round trips into one (200 events at ~400 bytes is ~80KB on a 969MB box);
//   · EXCEPT on outcome === 'error', which flushes immediately -- the moment an event is most worth
//     having is right before a crash that would discard the buffer. Errors are rare; this is free.
// Instrumentation must never be the thing that breaks a real interaction. Every public function here is written so that throwing is impossible from the caller's point of view.
//
// 🔴 NO RAW DISCORD USER ID EVER REACHES A DOCUMENT. hashUserId() from utils/requestContext.js is the only way a user identifier enters one, and buildEventDocument() additionally SCRUBS the finished document against the raw id before it is buffered -- see the comment on that function for why a schema review is not enough to catch the realistic regression.

const { getContext } = require('./requestContext');
const { VERSION, COMMIT } = require('./logger');

// --- Tunables. All of these are cheap to change and none is load-bearing on correctness. ---
const FLUSH_INTERVAL_MS = 15000;   // idle flush; the buffer also flushes at FLUSH_AT and on error
const FLUSH_AT = 25;
const MAX_BUFFER = 1000;           // hard ceiling if Mongo is unreachable for a long stretch -- drop
                                   // the OLDEST rather than grow without bound (instrumentation must never be able to OOM the bot it is observing)
const DETAIL_MAX_KEYS = 8;
const DETAIL_MAX_BYTES = 512;
const TERM_MAX_CHARS = 100;
const AUTOCOMPLETE_IDLE_MS = 3000; // one event per SEARCH SESSION, not per keystroke
const DEP_MAX_NAMES = 12;
const SIZE_GUARD_EVERY = 50;       // flushes between size checks
const SIZE_GUARD_DOCS = 400000;    // ~240MB at the measured 307-byte avgObjSize + 1.7x indexes,
                                   // i.e. comfortably before the M0 512MB wall

// `host` had three unreconciled notions in this repo (JOURNAL_STREAM in logger.js, NODE_ENV in AlertLog, os.hostname() in the retired RenderTiming). Picking AlertLog's, deliberately: it is the one an operator already reads, and 'GCP VM' vs 'local' is the distinction that actually matters when reading analytics -- an os.hostname() of "Harkirats-MacBook" answers the same question worse.
const HOST = process.env.NODE_ENV === 'development' ? 'local' : 'GCP VM';

const ADMIN_COMMANDS = new Set(['manage', 'bot', 'autobuild']);
const ADMIN_PREFIXES = new Set(['mng', 'bot', 'autobuild']);

// ==========================================
// PURE HELPERS -- no Mongo, no Discord, no clock beyond what is passed in. These are what scripts/eventStore.test.js exercises, and they are exported for exactly that reason.
// ==========================================

// Lowercased, trimmed, whitespace-collapsed, hard-capped. The cap is the part that matters: it is what stops a mis-paste into the wrong field from dumping a wall of text into a permanent record.
function normalizeTerm(text) {
    if (typeof text !== 'string') return '';
    return text.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, TERM_MAX_CHARS);
}

// The segment BEFORE the first '_', and nothing after it. This is not fussiness: custom_ids in this bot embed Mongo _ids and user snowflakes (mng_admin_<discordId>, mng_announce_<objectId>), so a looser capture is a user-id leak wearing a harmless-looking field name. A customId with no '_' at all is returned whole ONLY if it cannot itself be an id.
function customIdPrefix(customId) {
    if (typeof customId !== 'string' || !customId) return null;
    const i = customId.indexOf('_');
    const seg = i === -1 ? customId : customId.slice(0, i);
    if (!seg || seg.length > 32) return null;
    if (/^\d{5,}$/.test(seg)) return null;   // a bare snowflake is never a prefix worth keeping
    return seg;
}

// Bounded on THREE axes (key count, scalar-only values, serialised size) because a `detail` bag is exactly where schema discipline leaks away one convenient field at a time.
function clampDetail(detail) {
    if (!detail || typeof detail !== 'object') return undefined;
    const out = {};
    let keys = 0;
    for (const [k, v] of Object.entries(detail)) {
        if (keys >= DETAIL_MAX_KEYS) break;
        if (v === undefined || v === null) continue;
        const t = typeof v;
        if (t !== 'string' && t !== 'number' && t !== 'boolean') continue;  // scalars only
        out[k] = t === 'string' ? v.slice(0, 200) : v;
        keys++;
    }
    if (!keys) return undefined;
    let json = JSON.stringify(out);
    while (json.length > DETAIL_MAX_BYTES) {
        const last = Object.keys(out).pop();
        if (!last) return undefined;
        delete out[last];
        json = JSON.stringify(out);
    }
    return out;
}

function deriveEntry(interaction) {
    if (!interaction) return null;
    if (interaction.__dioreoSynthetic) return 'synthetic';
    const is = (name) => typeof interaction[name] === 'function' && interaction[name]();
    if (is('isAutocomplete')) return 'autocomplete';
    if (is('isModalSubmit')) return 'modal';
    if (is('isButton')) return 'button';
    if (is('isAnySelectMenu') || is('isStringSelectMenu')) return 'select';
    if (is('isChatInputCommand')) return 'slash';
    return null;
}

// ✅ VERIFIED 2026-08-16 against the INSTALLED discord.js 14.27.0 typings, not assumed: BaseInteraction carries `authorizingIntegrationOwners: AuthorizingIntegrationOwners`, whose class exposes `guildId: Snowflake | null` and `userId: Snowflake | null` (typings/index.d.ts:2546-2559), plus `context: InteractionContextType | null`. The design spec listed this as "believed available, check before the schema commits to it" -- it is available. Still written defensively (null rather than a throw) because Discord may simply omit the field on some interaction types.
function deriveInstallType(interaction) {
    const owners = interaction?.authorizingIntegrationOwners;
    if (!owners) return null;
    if (owners.guildId) return 'guild';
    if (owners.userId) return 'user';
    // Raw API shape fallback: { "0": guildId, "1": userId } keyed by ApplicationIntegrationType.
    if (owners['0']) return 'guild';
    if (owners['1']) return 'user';
    return null;
}

function isAdminSurface(command, prefix) {
    if (command && ADMIN_COMMANDS.has(command)) return true;
    if (prefix && ADMIN_PREFIXES.has(prefix)) return true;
    return false;
}

// Deep string search for a raw id anywhere in a finished document -- the exported half of the project's highest-value test. Kept here rather than in the test file so the RUNTIME uses the very same predicate the test asserts on; a guard that differs from its test is two behaviours.
function containsRawId(doc, rawId) {
    if (!rawId) return false;
    try {
        return JSON.stringify(doc).includes(String(rawId));
    } catch {
        return false;
    }
}

// Assembles the finished document. `rawUserId` is passed IN and never stored -- it exists only so the document can be scrubbed against it.
//
// 🔴 THE SCRUB IS NOT PARANOIA, IT IS THE REALISTIC REGRESSION. Nobody is going to add a `discordId` field; a schema review would catch that instantly. What actually happens is a `detail` value that happens to carry one, or a customIdPrefix capture that grabs a segment embedding a user snowflake. Neither survives this check, and neither would be caught by reading the schema.
function buildEventDocument(interaction, ctx, extra = {}, rawUserId = null) {
    const prefix = customIdPrefix(interaction?.customId);
    const command = ctx?.command && !String(ctx.command).includes('_')
        ? ctx.command
        : (interaction?.commandName || prefix || null);

    let subcommand = null;
    try {
        subcommand = interaction?.options?.getSubcommand?.(false) || null;
    } catch { /* not a subcommand-bearing interaction; not worth a log line */ }

    const doc = {
        userHash: ctx?.userHash || null,
        guildId: interaction?.guildId || null,
        context: interaction?.guildId ? 'guild' : 'dm',
        installType: deriveInstallType(interaction),
        isAdmin: isAdminSurface(command, prefix),
        command,
        subcommand,
        entry: extra.entry || deriveEntry(interaction),
        customIdPrefix: prefix,
        outcome: extra.outcome || 'ok',
        ackMs: typeof extra.ackMs === 'number' ? extra.ackMs : null,
        durationMs: typeof extra.durationMs === 'number' ? extra.durationMs : null,
        // COPIED, not referenced. `extra.deps` is the context's LIVE array: a noteDep() firing after this document is buffered -- the SearchTerm upsert that notePicked() triggers from the router's own finally does exactly that -- would otherwise mutate a document already queued for insert, so the stored row would include the cost of the instrumentation observing it.
        deps: extra.deps && extra.deps.length ? extra.deps.map(d => ({ ...d })) : undefined,
        detail: clampDetail(extra.detail),
        search: extra.search || undefined,
        version: VERSION,
        commit: COMMIT,
        host: HOST,
        createdAt: new Date(),
    };

    if (containsRawId(doc, rawUserId)) {
        // Drop the two fields that can realistically carry one and keep the rest of the event, rather than discarding a whole event over one bad field.
        delete doc.detail;
        delete doc.search;
        doc.customIdPrefix = null;
        if (containsRawId(doc, rawUserId)) return null;  // still leaking -> refuse to store it at all
    }
    return doc;
}

// ==========================================
// THE BUFFER
// ==========================================

const buffer = [];
let flushTimer = null;
let flushesSinceSizeCheck = SIZE_GUARD_EVERY;   // check on the first flush of a process
let sizeAlerted = false;

function scheduleFlush() {
    if (flushTimer) return;
    // .unref() so a pending flush timer can never hold the process open at shutdown -- the SIGTERM handler below is what guarantees the last buffer actually lands.
    flushTimer = setTimeout(() => { flushTimer = null; flushEvents(); }, FLUSH_INTERVAL_MS);
    if (typeof flushTimer.unref === 'function') flushTimer.unref();
}

// The size guard MUST NOT use countDocuments(): that is a full collection scan, so a guard protecting against a large collection would become a performance problem at exactly the moment it fired. estimatedDocumentCount() reads collection metadata instead.
async function checkSize(AnalyticsEvent) {
    if (sizeAlerted) return;
    if (++flushesSinceSizeCheck < SIZE_GUARD_EVERY) return;
    flushesSinceSizeCheck = 0;
    const n = await AnalyticsEvent.estimatedDocumentCount();
    if (n < SIZE_GUARD_DOCS) return;
    sizeAlerted = true;   // once per process; this is a warning, not a nag
    const { sendAlert } = require('./alertWebhook');
    sendAlert(
        'Analytics collection is large',
        `The event collection holds ~${n.toLocaleString()} documents. Atlas M0 caps at 512 MB total. Roll up and prune, or upgrade the tier — do not let writes start failing silently.`,
        'warning',
    );
}

// Fire-and-forget and swallowed, the utils/alertStore.js idiom: an IIFE returning an already-caught promise, so even a stray `await` at a call site cannot reject.
function flushEvents() {
    if (!buffer.length) return Promise.resolve();
    const batch = buffer.splice(0, buffer.length);
    return (async () => {
        const AnalyticsEvent = require('../models/AnalyticsEvent');
        // ordered:false so one bad document cannot discard the rest of the batch.
        await AnalyticsEvent.insertMany(batch, { ordered: false });
        // ⚠️ THE BATCH IS SPLICED OUT BEFORE THE AWAIT, SO A FAILED INSERT DROPS THOSE EVENTS. That is deliberate, not an oversight: re-queueing on failure turns a database that is down into an ever-growing buffer and an unbounded retry loop, inside the process whose interactions we are supposed to be leaving alone. Losing some analytics is the cheap failure; the bot is not.
        await checkSize(AnalyticsEvent);
    })().catch(() => { /* instrumentation must never affect the bot */ });
}

function pushEvent(doc) {
    if (!doc) return;
    buffer.push(doc);
    if (buffer.length > MAX_BUFFER) buffer.splice(0, buffer.length - MAX_BUFFER);
    if (doc.outcome === 'error' || buffer.length >= FLUSH_AT) flushEvents();
    else scheduleFlush();
}

// ==========================================
// CONTEXT-SIDE API -- what the router, the guards and the dependency wrappers call
// ==========================================

// The outcome is recorded on the SAME context object runWithContext() is already running with (it is returned by reference), so a guard deep inside a handler can report without threading a value back up to the router's finally. Guards that already exist need to REPORT, not to be re-written -- see the design's §5.
function markOutcome(outcome) {
    const ctx = getContext();
    if (ctx && !ctx.outcome) ctx.outcome = outcome;
}

function mergeDetail(fields) {
    const ctx = getContext();
    if (!ctx || !fields) return;
    ctx.detail = { ...(ctx.detail || {}), ...fields };
}

// Aggregated PER NAME rather than per call -- this is what keeps `deps` bounded without a cap that would silently drop the interesting tail. Twelve distinct dependency names is already generous.
function noteDep(name, ms, ok = true, extra = null) {
    const ctx = getContext();
    if (!ctx || !name) return;
    if (!ctx.deps) ctx.deps = [];
    let row = ctx.deps.find(d => d.name === name);
    if (!row) {
        if (ctx.deps.length >= DEP_MAX_NAMES) return;
        row = { name, ms: 0, calls: 0, ok: true };
        ctx.deps.push(row);
    }
    row.ms += Math.max(0, Math.round(ms) || 0);
    row.calls += 1;
    if (!ok) row.ok = false;
    if (extra && typeof extra.tokens === 'number') row.tokens = (row.tokens || 0) + extra.tokens;
}

// Times one external call and reports it. Rethrows -- this wraps a dependency, it does not swallow the caller's own error handling.
async function timeDependency(name, fn, extraFrom = null) {
    const started = Date.now();
    try {
        const result = await fn();
        noteDep(name, Date.now() - started, true, extraFrom ? extraFrom(result) : null);
        return result;
    } catch (err) {
        noteDep(name, Date.now() - started, false);
        throw err;
    }
}

// The first defer/reply is the 3-second-deadline measurement, so it is stamped once and never overwritten by a later edit of the same message.
function noteAck() {
    const ctx = getContext();
    if (ctx && ctx.startedAt && ctx.ackMs == null) ctx.ackMs = Date.now() - ctx.startedAt;
}

// Discord's own codes for "this interaction is no longer answerable": 10062 Unknown interaction (the token expired) and 40060 already acknowledged. This is what turns a dead click into an `expired` outcome instead of a silent nothing.
function noteResponseFailure(err) {
    const code = err && (err.code ?? err.status);
    if (code === 10062 || code === 40060) markOutcome('expired');
}

// Wraps the interaction's own response methods so ackMs and the `expired` outcome need no cooperation from any handler. ⚠️ Applied AFTER utils/guildPolicy.js's forceEphemeralResponses() so this wrapper sits OUTSIDE that one: the clamp still runs, and the stamp happens whichever path the response takes.
//
// 🔴 THIS IS WHY THERE IS NO EDIT IN ANY OF THE 45 "interaction likely expired" CATCHES. The design's §5 named seven of them in three files; the real count is 45 across 18 files, and instrumenting each by hand would be 45 edits whose coverage decays the moment somebody writes the 46th. Observing the REJECTION here catches every one of them, including the paths that have no such catch at all, and it cannot decay. The observation uses a derived promise with BOTH handlers supplied, so it can never create an unhandled rejection, and the ORIGINAL promise is what the caller receives -- their own catch is untouched.
const ACK_METHODS = ['reply', 'deferReply', 'deferUpdate', 'update', 'showModal'];
const RESPONSE_METHODS = [...ACK_METHODS, 'editReply', 'followUp'];
function instrumentAck(interaction) {
    for (const name of RESPONSE_METHODS) {
        const original = interaction[name];
        if (typeof original !== 'function') continue;
        const stampsAck = ACK_METHODS.includes(name);
        Object.defineProperty(interaction, name, {
            value: function (...args) {
                if (stampsAck) noteAck();
                const result = original.apply(this, args);
                if (result && typeof result.then === 'function') result.then(() => {}, noteResponseFailure);
                return result;
            },
            configurable: true,
            writable: true,
            // ⚠️ enumerable MATTERS and defaults to false on a NEW own property. utils/interactionContext.js's buildSyntheticInteraction() copies the interaction with Object.assign, which only sees ENUMERABLE own properties -- so without this, the three methods guildPolicy had already made own properties (reply/deferReply/followUp) would carry their wrapper onto a synthetic interaction while the other four silently reverted to the unwrapped prototype versions. Half-instrumented is the worst of the three options.
            enumerable: true,
        });
    }
}

// ==========================================
// AUTOCOMPLETE -- one event per SEARCH SESSION, not per keystroke
// ==========================================
// Discord fires an autocomplete interaction on EVERY keystroke, and both loadout search and /help's cmd: option use it. At equal fidelity autocomplete would be the large majority of a collection designed to grow forever, while answering nothing -- "the user typed k, ki, kil, kilo" is four rows that say one thing. So the buffer holds one open session per (user, command, field), updated as keystrokes arrive, and flushes ONE completed event carrying the keystroke count, the final query and whether the search was followed through.
const searchSessions = new Map();   // key -> { userHash, command, field, term, keystrokes, results, picked, timer, guildId, ... }

function sessionKey(userHash, command, field) {
    return `${userHash || 'anon'}|${command}|${field}`;
}

function closeSession(key) {
    const s = searchSessions.get(key);
    if (!s) return;
    searchSessions.delete(key);
    if (s.timer) clearTimeout(s.timer);
    if (!s.term) return;

    pushEvent({
        userHash: s.userHash,
        guildId: s.guildId,
        context: s.guildId ? 'guild' : 'dm',
        installType: s.installType,
        isAdmin: isAdminSurface(s.command, null),
        command: s.command,
        subcommand: null,
        entry: 'autocomplete',
        customIdPrefix: null,
        outcome: 'ok',
        ackMs: null,
        durationMs: s.lastAt - s.startedAt,
        detail: undefined,
        search: { term: s.term, field: s.field, keystrokes: s.keystrokes, results: s.results, picked: Boolean(s.picked) },
        version: VERSION,
        commit: COMMIT,
        host: HOST,
        createdAt: new Date(),
    });

    // The aggregate carries NO user linkage at all -- see models/SearchTerm.js.
    (async () => {
        const SearchTerm = require('../models/SearchTerm');
        const now = new Date();
        await SearchTerm.updateOne(
            { term: s.term, command: s.command, field: s.field },
            {
                $inc: { searches: 1, zeroResults: s.results === 0 ? 1 : 0, picked: s.picked ? 1 : 0 },
                $min: { firstSeen: now },
                $max: { lastSeen: now },
            },
            { upsert: true },
        );
    })().catch(() => { /* swallowed, as every write here is */ });
}

// Patches interaction.respond() so the session records the RESULT COUNT for free -- a zero-result search is the whole point of keeping the term, and it is only knowable at respond() time. One edit in the router's autocomplete route covers every autocomplete site in the bot.
function instrumentAutocomplete(interaction) {
    try {
        const ctx = getContext();
        const command = interaction.commandName;
        const focused = interaction.options?.getFocused?.(true);
        const field = (focused && focused.name) || 'query';
        const term = normalizeTerm(typeof focused === 'object' ? focused.value : focused);
        const key = sessionKey(ctx?.userHash, command, field);
        const now = Date.now();

        let s = searchSessions.get(key);
        if (!s) {
            s = {
                userHash: ctx?.userHash || null,
                guildId: interaction.guildId || null,
                installType: deriveInstallType(interaction),
                command, field,
                keystrokes: 0, results: null, picked: false,
                startedAt: now,
            };
            searchSessions.set(key, s);
        }
        s.keystrokes += 1;
        s.lastAt = now;
        if (term) s.term = term;   // keep the LONGEST-lived non-empty term, i.e. what they settled on
        if (s.timer) clearTimeout(s.timer);
        s.timer = setTimeout(() => closeSession(key), AUTOCOMPLETE_IDLE_MS);
        if (typeof s.timer.unref === 'function') s.timer.unref();

        const original = interaction.respond;
        if (typeof original === 'function') {
            Object.defineProperty(interaction, 'respond', {
                value: function (choices, ...rest) {
                    s.results = Array.isArray(choices) ? choices.length : null;
                    return original.call(this, choices, ...rest);
                },
                configurable: true, writable: true,
            });
        }
    } catch { /* instrumentation must never break an autocomplete */ }
}

// Closes every open search session immediately. Used by the shutdown path (a session mid-flight when systemd stops the unit would otherwise be lost) and by scripts/eventStore.test.js, which asserts the debounce invariant without waiting out a real 3-second idle timer.
function flushSearchSessions() {
    for (const key of [...searchSessions.keys()]) closeSession(key);
}

// A slash command arriving from the same user for the same command right after a search session is the only honest signal we have that the search was followed through. Cheap, and it closes the session early rather than waiting out the idle timer.
function notePicked(userHash, command) {
    for (const [key, s] of searchSessions) {
        if (s.userHash === userHash && s.command === command) {
            s.picked = true;
            closeSession(key);
        }
    }
}

// ==========================================
// EMISSION
// ==========================================

// Called from the router's finally -- ONE event per interaction, including the ones that threw, because those are the events most worth having.
function recordInteractionEvent(interaction, ctx, rawUserId) {
    try {
        if (!ctx) return;
        if (deriveEntry(interaction) === 'autocomplete') return;   // the debounced session owns those
        const doc = buildEventDocument(interaction, ctx, {
            outcome: ctx.outcome || 'ok',
            ackMs: ctx.ackMs,
            durationMs: ctx.startedAt ? Date.now() - ctx.startedAt : null,
            deps: ctx.deps,
            detail: ctx.detail,
        }, rawUserId);
        pushEvent(doc);
        if (doc && doc.entry === 'slash' && doc.command) notePicked(doc.userHash, doc.command);
    } catch { /* never */ }
}

// The RenderTiming replacement for renders that are NOT themselves an interaction (the WebP cache runners). Inside an interaction they fold into that interaction's deps; outside one -- the bulk cache runner -- they become their own small background event, which is more than RenderTiming gave us there, since it had no notion of what triggered it.
function recordRenderTiming(name, durationMs, detail = null) {
    try {
        if (getContext()) { noteDep(name, durationMs, true); mergeDetail(detail || {}); return; }
        pushEvent({
            userHash: null, guildId: null, context: null, installType: null, isAdmin: false,
            command: name, subcommand: null, entry: 'background', customIdPrefix: null,
            outcome: 'ok', ackMs: null, durationMs: Math.round(durationMs) || 0,
            detail: clampDetail(detail), version: VERSION, commit: COMMIT, host: HOST,
            createdAt: new Date(),
        });
    } catch { /* never */ }
}

function recordBoot(fields) {
    return (async () => {
        const BootRecord = require('../models/BootRecord');
        await BootRecord.create({ version: VERSION, commit: COMMIT, host: HOST, ...fields });
    })().catch(() => { /* swallowed */ });
}

// systemd sends SIGTERM on every deploy and restart, so without this the last buffer -- up to FLUSH_INTERVAL_MS of events, and the ones immediately before a restart are among the most interesting -- would be lost every single time.
let shutdownInstalled = false;
function installShutdownFlush() {
    if (shutdownInstalled) return;
    shutdownInstalled = true;
    for (const signal of ['SIGTERM', 'SIGINT']) {
        process.once(signal, () => {
            flushSearchSessions();
            const done = () => process.exit(0);
            // Bounded: a flush that hangs must not stop the process from exiting, or systemd's stop timeout turns a clean restart into a SIGKILL.
            const bail = setTimeout(done, 2000);
            if (typeof bail.unref === 'function') bail.unref();
            flushEvents().then(done, done);
        });
    }
}

module.exports = {
    // pure, exported for scripts/eventStore.test.js
    normalizeTerm, customIdPrefix, clampDetail, deriveEntry, deriveInstallType, isAdminSurface,
    containsRawId, buildEventDocument,
    // context-side
    markOutcome, mergeDetail, noteDep, timeDependency, noteAck, noteResponseFailure, instrumentAck,
    instrumentAutocomplete, notePicked, flushSearchSessions,
    // emission
    recordInteractionEvent, recordRenderTiming, recordBoot, flushEvents, installShutdownFlush,
    // constants worth asserting on
    FLUSH_AT, TERM_MAX_CHARS, DETAIL_MAX_KEYS, DETAIL_MAX_BYTES,
};
