// ==========================================
// COMMAND: /bot  (admin-only) — analytics + access
// ==========================================
// Observability layer stage 3: docs/superpowers/specs/2026-08-16-observability-layer-design.md §6. `/bot analytics` is the paged read surface for the event plane stage 2 built (Health/Alerts/ Changes/Usage/Timing). `/bot access` is the admin allowlist, extracted out of /manage's former owner-only `manageadmins` page — see utils/adminAccess.js and handlers/bot.js for the permission gate itself. `/alerts` and `/audit` retire as command names; their panels became pages here (Alerts/Changes), ported with their customId prefixes renamed but their query logic untouched.
//
// This file builds every panel; handlers/bot.js owns all `bot_`-prefixed button/select/modal routing, mirroring the commands/*.js-builds + handlers/*.js-routes split every other admin surface in this bot uses.
//
// 🔴 `/bot access` is NOT gated by a permission token, on purpose — same invariant `manageadmins` always had ("no permission token at all, ever," see utils/adminAccess.js's header): the allowlist page itself is owner-only visibility, checked directly via isOwner() in execute() below and re-checked at every mutation in handlers/bot.js. `/bot analytics` IS token-gated (`hasCommandAccess`, the 'bot' token replacing the retired 'alerts'/'audit' tokens) — any admin analytics ships to should be viewable without being the owner.
const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildPaginationRow } = require('../utils/paginationRow');
const { getAlertSummary, getRecentAlerts, formatUptime } = require('../utils/alertStore');
const { getChangeSummary, getRecentChanges } = require('../utils/changeStore');
const { displayTitle } = require('../utils/alertExplain');
const { hasCommandAccess, isOwner, formatPermissions, MANAGE_PAGE_SCOPES } = require('../utils/adminAccess');
const { mentionCommand } = require('../utils/commandMentions');
const emojis = require('../utils/emojiMap');

const ALERTS_PER_PAGE = 3;
// REDUCED 8 -> 3 (bot analytics redesign, 2026-08-23 00:39 EDT): Alerts is a glance now -- the pager and full log moved to the portal. ⚠️ REDUCED 8 -> 5 (portal core Task 7, 2026-08-21 00:04 EDT): each row now renders its own Revert button (core/revert.js) — a Text Display + Action Row + Button per change instead of one line in a shared block. Measured: 8 rows + filters + a mid-pagination pager totalled 45 recursive components, over Components V2's 40-per-message cap (root CLAUDE.md's platform cheat-sheet) — a real production crash risk, not a style concern. 5 rows measured 38 in the same worst case; verified before shipping, not estimated. 🔴 3, NOT 5 -- the redesign plan's Global Constraints say so ("CHANGES_PER_PAGE becomes 3 and there is no page 2"), and it shipped at 5 because nothing asserted it. Mobile is why that matters rather than being pedantry: a Section's accessory does NOT sit to the right on iOS as it does on desktop, it stacks BELOW its own text, so five rows become ten stacked blocks and the page needs scrolling -- failing "one question, one screenful" on the primary device. Measured on a real phone 2026-08-23 09:56 EDT.
const CHANGES_PER_PAGE = 3;
// Matches utils/alertWebhook.js's LEVEL_ICON — kept in sync by hand (both are tiny, stable maps).
const LEVEL_ICON = { info: '🟢', caution: '🟡', warn: '🟠', error: '🔴' };
// discord.js's Status enum values, hardcoded rather than imported so a library rename can't silently blank this map — Health is meant to survive as "unknown code N" worst case, not throw.
const GATEWAY_STATUS_LABEL = {
    0: '🟢 Ready', 1: '🟡 Connecting', 2: '🟡 Reconnecting', 3: '🟡 Idle', 4: '🟡 Nearly ready',
    5: '🔴 Disconnected', 6: '🟡 Waiting for guilds', 7: '🟡 Identifying', 8: '🟡 Resuming',
};

// Each page's own identity color — Alerts/Changes reuse their retired commands' exact accents (continuity for anyone used to the old panels); Health/Usage/Timing/Access are new.
const PAGE_META = {
    health: { label: '🩺 Health', accent: 0x2FA88E, question: 'Is the bot okay right now?' },
    alerts: { label: '🔔 Alerts', accent: 0x546E7A, question: 'What has gone wrong, and when' },
    changes: { label: '📒 Changes', accent: 0x6C5DD3, question: 'Who edited what — and undo it' },
    usage: { label: '📊 Usage', accent: 0x4A7FE8, question: 'What people actually use' },
    timing: { label: '⏱️ Timing', accent: 0xD98A3D, question: 'Where the time goes' },
};
const ACCESS_ACCENT = 0xB33F40;
// Every analytics page ends with this. Discord is the glance; the portal is the depth (see the spec's rule 0). Route matches portal/ui/app.js's hash-based router (`location.hash`, keyed by realm name in REALM_COMPONENTS).
const PORTAL_ANALYTICS_URL = 'https://portal.dioreo.app/#/analytics';

// ── ANSI inside code fences ── Discord renders a ```ansi fence with a SMALL subset of SGR: styles 0/1/4, foreground 30-37, background 40-47. No 256-colour, no truecolour, no hex -- anything outside that set renders as the literal escape text, so this map is the entire palette these panels may spend. ⚠️ MEASURED 2026-08-23 09:56 EDT on real clients, and the answer is NOT what this comment first claimed: iOS Discord renders an ```ansi fence as PLAIN monospace -- it strips the codes silently rather than printing them, so there is no `[0;32m` garbage (the good failure) but also NO COLOUR AT ALL. Desktop colours correctly. 🔴 THEREFORE COLOUR IS DECORATION AND NEVER MEANING: anything a reader must tell apart needs a carrier that survives the strip -- a glyph, a word, or a number. Timing's per-row severity was colour-only when this was written and was simply invisible on the phone; it leads with an emoji now for exactly that reason. That is a WCAG 1.4.1 requirement too, not only a mobile one. Gray (fg 30) is used solely for the empty cells of a bar, where receding is the point.
const ANSI = {
    reset: '\u001b[0m',
    gray: '\u001b[0;30m',
    red: '\u001b[0;31m',
    green: '\u001b[0;32m',
    yellow: '\u001b[0;33m',
    cyan: '\u001b[0;36m',
    bold: '\u001b[1;37m',
};
const ansiBlock = (lines) => '```ansi\n' + lines.join('\n') + '\n```';
// 🔴 THE PHONE BUDGET IS 32 COLUMNS, NOT 40 -- DERIVED FROM AN OBSERVED WRAP, not from the spec's estimate. Measured off Harkirat's iPhone screenshots 2026-08-23 09:56 EDT: peaksLine() at ~46 columns broke into four ragged lines, while a 24-column Usage row and a 27-column Timing row did not break at all. The spec cited peaksLine ITSELF as "the working precedent for monospace alignment inside that budget" -- it never met the budget it was offered as evidence for, and nobody had measured it. Assume 32 and test for it.
const PHONE_COLS = 32;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
// Strips every SGR sequence -- the only honest way to measure a rendered row against the ~40-column phone budget, since the escapes cost bytes and zero columns.
const visibleWidth = (line) => line.replace(/\u001b\[[0-9;]*m/g, '').length;

// A bar whose FILLED cells carry a colour and whose empty cells recede. `cells` is fixed so every bar in a block is the same length -- the comparison lives in the fill, and a variable-length bar compares nothing.
function ansiBar(value, max, cells, colour) {
    const filled = Math.max(1, Math.min(cells, Math.round((value / (max || 1)) * cells)));
    // 🔴 THE EMPTY TRACK IS `·`, NOT `░`. Gray-30 was the first attempt at making the empty half recede and it works on desktop -- but iOS strips the colour, leaving `░`'s dense dotted texture beside a solid white slab, i.e. the exact "gray blob" this bar was redrawn to fix, still shipping on the phone. A middle dot is quiet with or without colour, which is the only property that actually matters here.
    return `${colour}${'█'.repeat(filled)}${ANSI.gray}${'·'.repeat(cells - filled)}${ANSI.reset}`;
}

function unix(d) { return Math.floor(new Date(d).getTime() / 1000); }
function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function fmtMs(ms) { return ms == null ? '—' : `${Math.round(ms)}ms`; }

function pageSelectRow(current) {
    return {
        type: 1,
        components: [{
            type: 3, custom_id: 'bot_pagesel', placeholder: 'Switch page…',
            options: Object.entries(PAGE_META).map(([key, meta]) => ({
                label: meta.label, value: key, description: meta.question, default: key === current,
            })),
        }],
    };
}

// ── Health (see docs/superpowers/specs/2026-08-16-observability-layer-design.md §6) ── Cloud Logging/Monitoring reads via ADC arrived in stage 4 (utils/cloudObservability.js), which caches its own result for 60s and never throws — computeHealthStats() awaits it alongside the existing free-to-compute facts (getAlertSummary(), live client.ws/process state, BootRecord counts).
async function computeHealthStats(client) {
    const BootRecord = require('../models/BootRecord');
    const { getHealthCloudStats } = require('../utils/cloudObservability');
    const now = Date.now();
    const since24h = new Date(now - 24 * 3600 * 1000);
    const since7d = new Date(now - 7 * 86400 * 1000);
    const [summary, boots24h, boots7d, lastBoot, cloud] = await Promise.all([
        getAlertSummary(),
        BootRecord.countDocuments({ createdAt: { $gte: since24h } }),
        BootRecord.countDocuments({ createdAt: { $gte: since7d } }),
        BootRecord.findOne().sort({ createdAt: -1 }).lean(),
        getHealthCloudStats(),
    ]);
    return {
        summary, boots24h, boots7d, lastBoot, cloud,
        gatewayStatus: client.ws.status,
        uptimeSec: process.uptime(),
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    };
}

// The three-tier error model the design's §6 calls for: what the Discord alert channel was TOLD (summary.last24h.error, from getAlertSummary() — already existed), what Cloud Logging says actually HAPPENED (cloud.errors24h — new this stage), and the gap between them, which is neither wrong nor redundant: sendAlert()'s 1/min throttle and some errors never reaching an alert threshold both produce real ERROR-severity log lines that were never announced. That gap is the "noise" tier — not noise in the sense of unimportant, but in the sense of "happened quietly, nobody was told."
function errorTiers(summary, cloud) {
    const announced = summary.last24h.error;
    if (!cloud || !cloud.available) return { announced, logged: null, noise: null };
    const logged = cloud.errors24h;
    const noise = Math.max(0, logged - announced);
    return { announced, logged, noise };
}

// A plain-language verdict line before any facts, matching the panel design rule ("Health opens with a single plain-language verdict line ... before any facts"). Not literally alertExplain.js's explain() — that explains one alert TITLE, there is no aggregate-verdict function there to reuse — but the same spirit: state the answer, not just the numbers.
function healthVerdict({ summary }) {
    if (summary.last24h.error > 0) return `🔴 **Something broke in the last 24 hours** — ${summary.last24h.error} error alert(s). See Alerts below.`;
    if (summary.last24h.warn > 0) return `🟡 **Minor hiccups in the last 24 hours** — ${summary.last24h.warn} warning(s), nothing that needed action.`;
    return `🟢 **All systems normal.** No warnings or errors in the last 24 hours.`;
}

function fmtPct(v) { return v == null ? '—' : `${v}%`; }

// CPU/RAM peaks across the trimmed 24h/7d/30d window set (see cloudObservability.js's WINDOWS for why it's three, not vmpeaks.sh's five). One compact code-fenced line per metric keeps this inside the panel design's ~40-column phone-wrap budget instead of a wide table.
function peaksLine(cloud) {
    if (!cloud.available) return `-# Cloud Monitoring unavailable right now (${truncate(cloud.error || 'unknown error', 80)}) — retrying next open.`;
    const { cpu, ram } = cloud.peaks;
    // TRANSPOSED 2026-08-23 10:00 EDT. The old row-per-metric shape repeated the window label beside every figure ("CPU peak 24h 48.1% 7d 58.8% 30d 147.3%") and ran ~46 columns, so on a phone it broke into four ragged lines -- see PHONE_COLS. Naming each window ONCE in a header row costs nothing and lands at ~26.
    const row = (label, m) => `${label.padEnd(5)}${fmtPct(m['24h']).padStart(7)}${fmtPct(m['7d']).padStart(7)}${fmtPct(m['30d']).padStart(7)}`;
    return ansiBlock([
        `${' '.repeat(5)}${'24h'.padStart(7)}${'7d'.padStart(7)}${'30d'.padStart(7)}`,
        row('CPU', cpu),
        row('RAM', ram),
    ]);
}

// One aligned monospace block rather than four prose rows. Same ~40-column budget peaksLine() already works inside -- a phone wraps a long "**Gateway:** ... · **Uptime:** ... · **Memory:** ..." line into an unreadable ribbon, and padEnd is what stops that.
function buildVitalsBlock({ gatewayStatus, uptimeSec, rssMb, boots24h, boots7d }) {
    const rows = [
        ['Gateway', GATEWAY_STATUS_LABEL[gatewayStatus] ?? `code ${gatewayStatus}`],
        ['Uptime', formatUptime(uptimeSec)],
        ['Memory', `${rssMb}MB`],
        ['Restarts', `${boots24h} in 24h · ${boots7d} in 7d`],
    ];
    // Pad LABEL+COLON as ONE unit, so the VALUE column is what lines up. ⚠️ An earlier draft padded the bare label and appended ': ' after it, to satisfy a test asserting every colon sat at the same offset -- that pins the colons but leaves them floating off the short labels (`Gateway :` beside `Restarts:`), which is what shipped and what Harkirat saw. The colon belongs to its word; the values are what an eye actually scans down. The test now asserts the VALUE column instead.
    const pad = Math.max(...rows.map(([k]) => k.length)) + 2;
    return ansiBlock(rows.map(([k, v]) => `${(k + ':').padEnd(pad)}${ANSI.bold}${v}${ANSI.reset}`));
}

async function buildHealthBody(client) {
    const stats = await computeHealthStats(client);
    const s = stats.summary;
    const line = (t) => `🟢 ${t.info} · 🟡 ${t.caution} · 🟠 ${t.warn} · 🔴 ${t.error}`;
    const lastErr = s.lastError ? `\`${s.lastError.alertId}\` · <t:${unix(s.lastError.createdAt)}:R>` : '_none recorded_ 🟢';
    const lastBootTs = stats.lastBoot ? unix(stats.lastBoot.createdAt) : null;
    const tiers = errorTiers(s, stats.cloud);
    const tierLine = tiers.logged == null
        ? `**Errors, last 24h:** ${tiers.announced} announced to Discord`
        : `**Errors, last 24h:** ${tiers.logged} logged · ${tiers.announced} announced${tiers.noise ? ` · ${tiers.noise} logged but never announced (throttled or below threshold)` : ''}`;
    return [
        { type: 10, content: healthVerdict(stats) },
        { type: 14, spacing: 1 },
        { type: 10, content: buildVitalsBlock(stats) },
        // Only rendered when there ARE any -- a permanent "0 hotpatches" row is noise on every panel view.
        ...(client.hotpatches?.length ? [{ type: 10, content: `🩹 **Hotpatched since boot:** ${client.hotpatches.length} · latest \`${client.hotpatches.at(-1).commit}\` <t:${Math.floor(client.hotpatches.at(-1).at.getTime() / 1000)}:R>` }] : []),
        { type: 14, spacing: 1 },
        { type: 10, content: `**Alerts, last 24h:** ${line(s.last24h)}\n**Alerts, last 7d:** ${line(s.last7d)}\n**Last error:** ${lastErr}` },
        { type: 10, content: tierLine },
        { type: 14, spacing: 1 },
        { type: 10, content: `### VM Resource Peaks\n${peaksLine(stats.cloud)}` },
    ];
}

// ── Alerts page (ported from the retired commands/alerts.js — query logic unchanged) ── Keeps the severity ledger line -- already this page's signature, no other page has one -- and the LEVEL_ICON-led row shape, which is the per-row colour coding that distinguishes Alerts from Changes (must NOT gain per-row buttons). Cut to the 3 most recent (ALERTS_PER_PAGE 8 -> 3); the pager and Export moved to the portal.
const ALERTS_EMPTY = '**Nothing has gone wrong.**\n-# Alerts land here when the bot crashes, loses its gateway connection, or hits a database error. An empty list is the healthy state.';

async function buildAlertsBody({ view = 'main' } = {}) {
    if (view === 'explain') return buildAlertsExplainBody();
    const [summary, recent] = await Promise.all([getAlertSummary(), getRecentAlerts({ page: 0, perPage: ALERTS_PER_PAGE })]);
    const line = (t) => `🟢 ${t.info} · 🟡 ${t.caution} · 🟠 ${t.warn} · 🔴 ${t.error}`;
    const lastErr = summary.lastError ? `\`${summary.lastError.alertId}\` · <t:${unix(summary.lastError.createdAt)}:R>` : '_none recorded_ 🟢';
    const body = [
        { type: 10, content: `-# Every alert the bot has posted — ${summary.total.toLocaleString()} recorded.` },
        { type: 10, content: `**Last 24h:** ${line(summary.last24h)}\n**Last 7d:** ${line(summary.last7d)}\n**Last error:** ${lastErr}` },
        { type: 14, spacing: 2 },
    ];
    if (recent.items.length) {
        const rows = recent.items.map(a =>
            `\`${a.alertId || '??????'}\` ${LEVEL_ICON[a.level] || '⚪'} **${truncate(displayTitle(a.title), 60)}** · <t:${unix(a.createdAt)}:R>`
        ).join('\n');
        body.push({ type: 10, content: `### Recent Alerts\n-# newest first\n${rows}` });
    } else {
        body.push({ type: 10, content: `### Recent Alerts\n${ALERTS_EMPTY}` });
    }
    body.push({ type: 14, spacing: 2 });
    body.push({
        type: 1, components: [
            { type: 2, style: 2, label: 'What do alerts mean?', custom_id: 'bot_alerts_explain' },
            { type: 2, style: 5, label: 'Full history in the portal', url: PORTAL_ANALYTICS_URL },
        ],
    });
    return body;
}

function buildAlertsExplainBody() {
    return [
        {
            type: 10, content:
                `${LEVEL_ICON.info} **Info** — routine / healthy: "Bot online", "Gateway resumed", the daily health check. **Never pings you.**\n`
                + `${LEVEL_ICON.caution} **Caution** — a self-recovering blip: reconnecting to Discord (the gateway websocket dropped, but the bot process itself is fine). **Never pings.**\n`
                + `${LEVEL_ICON.warn} **Warn** — the bot **lost** the gateway connection. **Pings you.**\n`
                + `${LEVEL_ICON.error} **Error** — a crash, uncaught exception, database failure, or shard error. **Pings you.**`,
        },
        { type: 14, spacing: 2 },
        {
            type: 10, content:
                `-# **IDs** are \`MMMDD-NN\` on the UTC day — e.g. \`Jul20-03\` is the 3rd alert on Jul 20. `
                + `Use **Export Log** for the full text record beyond what fits in Discord.`,
        },
        { type: 14, spacing: 2 },
        { type: 1, components: [{ type: 2, style: 2, label: '← Back to alerts', custom_id: 'bot_alerts_back' }] },
    ];
}

// ── Changes page (ported from the retired commands/audit.js — query logic unchanged; page tag for admin-access mutations renamed 'manageadmins' -> 'access' going forward, see handlers/bot.js) ── FILTERABLE_PAGES/encodeState/decodeState retired (bot analytics redesign, 2026-08-23 00:32 EDT) -- the page/actor filters they served moved to the portal; nothing in this file or handlers/bot.js calls them any more.
const PAGE_LABEL = {
    draws: 'Draws', calendar: 'Calendar', loadouts_mp: 'MP Loadouts', loadouts_dmz: 'DMZ Loadouts',
    patchnotes: 'Patch Notes', seasondraft: 'Next Season Draft', season: 'Season Titles/Wipe',
    announcement: 'Announcements', access: 'Bot Access', manageadmins: 'Manage Admins (legacy)',
    // 🔴 `patchnote` SINGULAR IS A REAL, REACHABLE PAGE KEY, and it is not the same string as `patchnotes`. core/changeset.js's pageForOp() falls back to `op.type.split('.')[0]` for any op with no registered /manage action, and four patchnote ops (removeSeason/restoreSeason/editSeason/addSeason) have none -- verified by enumerating listOpTypes() through pageForOp, which yields BOTH keys. Without this row those rows render their raw key. See docs/db-deferred-list.md for the wider permission consequence, which is not this file's to fix.
    patchnote: 'Patch Notes',
};

// One SECTION per change, with Revert as the row's own accessory -- rather than a Text Display followed by a full-width Action Row. Component cost is IDENTICAL (9+10+2 vs 10+1+2 = 3 either way; the first draft of the spec wrongly claimed a saving, see its audit log), so this is bought purely for identity: Changes becomes the only page whose rows carry a control, which is exactly what distinguishes it from Alerts' rows. Section+Button accessory confirmed via Discord's own API schema -- see Task 2's note in the plan.
function buildChangesRows(items) {
    const { canRevert } = require('../core/revert');
    return items.map(c => {
        const gate = canRevert(c);
        const reason = c.undone ? '' : (gate.ok ? '' : `\n-# _${gate.reason}_`);
        return {
            type: 9,
            components: [{ type: 10, content:
                // 🔴 NO changeId HERE. `Aug22-28` is an internal MMMDD-NN log id that LOOKS like a date, sitting inches from "19 hours ago" and disagreeing with it -- Harkirat: "your 'Aug22-28' timestamp or whatever is so confusing." It is a reference, not a fact about the change, so it lives in the detail panel labelled explicitly as not-a-date.
                `**${truncate(c.summary || `${c.action} on ${c.page}`, 70)}**${c.undone ? ' ↩️' : ''}`
                + `\n-# ${PAGE_LABEL[c.page] || c.page || '?'} · <@${c.actorId}> · <t:${unix(c.createdAt)}:R>${reason}` }],
            // 🔴 THIS OPENS A DETAIL PANEL, IT DOES NOT REVERT. Harkirat, 2026-08-23 10:07 EDT, on the version where it fired immediately: "what am I even doing by tapping 'revert' or am i just blindly reverting?" -- he was, and a one-line summary is not enough to decide by. The revert itself now lives behind that panel, which states exactly which record is affected and what the stored inverse will do. Still one tap to reach, which is what the spec's time-critical argument actually protected: it objected to a BROWSER round-trip, not to a confirmation step. Disabled rows keep the panel reachable on purpose -- "why can't I revert this?" is a question the detail view answers, and greying out the only way to ask it is the worse failure.
            accessory: { type: 2, style: 2, label: gate.ok ? 'Details' : 'Why not?', custom_id: `bot_changedetail_${c.changeId}` },
        };
    });
}

// There is no filtered variant any more -- filters move to the portal -- so this has exactly one cause and says it plainly.

// 🔴 THIS PANEL ANSWERS "WHAT WAS EVEN EDITED?", AND NOTHING ELSE IS ITS JOB. Harkirat, 2026-08-23 10:28 EDT, on two earlier versions of it: "i genuinely have NO greater understanding ... before OR after clicking 'detail'. I gained nothing", and then, on an edit row, "WHAT WAS EVEN EDITED? what exactly will i revert? what's different?" Both versions failed the same way. The first printed Section/Action/Record/Affected -- the summary restated in schema vocabulary (he already knew it was an add, on Draws, called "Test Draw") plus `Record: SeasonalData`, an internal Mongoose model name that leaks implementation and means nothing to a reader. The second dumped the inverse's ENTIRE stored payload for an edit -- title, date, thumbnailUrl, items -- with no indication of which of those the edit actually touched, so the one field that changed was hidden among three that did not. The fix is the diff nobody had computed: the inverse's payload holds the values as they were BEFORE the edit, so pairing it field-by-field against the record as it stands NOW yields exactly what changed, and every field where the two agree is dropped rather than listed.

// ── The change-detail panel ── 🔴 ITS ONE JOB IS TO ANSWER "WHAT WAS EVEN EDITED, AND IS IT SAFE TO UNDO?" Three rounds of live review got it here, and each round's failure is worth keeping because they were all the same failure wearing different clothes -- showing the READER something about the AUDIT SYSTEM instead of something about the DATA. v1 printed Section/Action/Record/Affected (the summary restated in schema vocabulary, plus an internal Mongoose model name). v2 dumped the inverse's whole payload, hiding the one changed field among three unchanged ones. v3 -- this one -- fixes what the screenshots then showed:
//   · a row reading "Items 2 items -> 2 items", i.e. the diff ASSERTING a change and displaying two
//     identical values, which is worse than omitting it: it teaches the reader the diff cannot be trusted;
//   · "August 13, 2026" for a date stored as 2026-08-14T00:00Z, because date-ONLY fields were rendered with
//     Discord's <t:> and localised a day backwards;
//   · a Deleted-an-announcement panel showing NOTHING, because the record is gone by definition and the
//     payload holding it was only read for edits.

// A draw's items ARE the draw -- "1 item" is a fact about an array, not about what a player would win.
function fmtItems(arr) {
    if (!Array.isArray(arr) || !arr.length) return '_(none)_';
    const names = arr.map(i => (i && (i.name || i.title)) || '?');
    const shown = names.slice(0, 3).map(n => truncate(String(n), 40)).join(', ');
    // Returns BARE text -- fmtFieldValue() applies the backticks, so ticking here would nest them.
    return names.length > 3 ? `${shown}  (+${names.length - 3} more)` : shown;
}

// 🔴 DATE-ONLY FIELDS ARE NOT INSTANTS. A draw's date is a DAY the admin typed, stored at UTC midnight (the repo's settled admin-date-UTC decision). Rendered with <t:...:D> it localises into the previous evening in EDT, so the panel told Harkirat "August 13" for a draw he had dated August 14. Genuine instants (startsAt/expiresAt/createdAt) keep <t:>, because for those the reader's own timezone IS the right frame. The resolver declares which is which; the formatter must never guess from the value's shape.
const fmtUtcDay = (v) => new Date(v).toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
// 🔴 THE VALUE CARRIES ITS OWN CODE-STYLE. Harkirat's design, 2026-08-23 12:31 EDT: a value set in backticks is visibly DATA rather than prose, and it makes leading/trailing whitespace and lookalike characters visible -- which on a diff is the difference between "Drop -> Draw" being readable and being a guess. Applied here rather than at each call site so no surface can forget it. Two things are deliberately NOT backticked: a `<t:...>` timestamp (backticks would print the raw tag) and an italic placeholder like _(empty)_, which is prose about an absence, not a value.
const tick = (text) => `\`${text}\``;
function fmtFieldValue(v, key, dateOnly = []) {
    if (v == null || v === '') return '_(empty)_';
    if (key === 'items' || key === 'attachments') return Array.isArray(v) ? tick(fmtItems(v)) : tick(String(v));
    if (dateOnly.includes(key)) return `${tick(fmtUtcDay(v))} _(UTC)_`;
    if (v instanceof Date || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v))) return `<t:${unix(v)}:f>`;
    if (typeof v === 'boolean') return tick(v ? 'yes' : 'no');
    if (typeof v === 'string' && /^https?:\/\//.test(v)) return '_(an image)_';
    if (Array.isArray(v)) return tick(plural(v.length, 'entry'));
    if (typeof v === 'object') return tick(truncate(JSON.stringify(v), 50));
    return tick(truncate(String(v), 70));
}

const FIELD_LABEL = {
    title: 'Title', date: 'Date', endDate: 'Ends', startDate: 'Starts', startsAt: 'Starts', expiresAt: 'Expires',
    thumbnailUrl: 'Picture', imageKey: 'Picture', items: 'Items', category: 'Category', text: 'Text',
    weaponName: 'Weapon', buildName: 'Build', attachments: 'Attachments', shareCode: 'Share code', mode: 'Mode',
};
const fieldLabel = (k) => FIELD_LABEL[k] || k;

// Equality that survives a Mongo round-trip. Dates arrive as a Date on one side and an ISO string on the other; subdocument arrays carry _id keys the stored inverse may not. A naive JSON.stringify on either reports a change on every edit -- which is exactly how "Items 2 items -> 2 items" reached a screenshot.
function sameValue(a, b) {
    if (a instanceof Date || b instanceof Date) return unix(a) === unix(b);
    if (Array.isArray(a) && Array.isArray(b)) {
        const names = (x) => x.map(i => (i && typeof i === 'object') ? String(i.name ?? i.title ?? JSON.stringify(i)) : String(i));
        return JSON.stringify(names(a)) === JSON.stringify(names(b));
    }
    if (typeof a === 'object' || typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b);
    return String(a ?? '') === String(b ?? '');
}

// What actually moved inside a list field, by NAME. Returning the added/removed names is the difference between "the items changed" and a reader knowing a Mythic was swapped for a Legendary.
function describeListChange(before, after) {
    const names = (x) => (Array.isArray(x) ? x : []).map(i => (i && typeof i === 'object') ? String(i.name ?? i.title ?? '?') : String(i));
    const b = names(before), a = names(after);
    const added = a.filter(n => !b.includes(n));
    const removed = b.filter(n => !a.includes(n));
    if (!added.length && !removed.length) return b.length === a.length ? '_reordered_' : null;
    // Same glyph vocabulary as a scalar diff -- one removed/added marker per line, so a list change and a field change read as the same kind of thing rather than two invented notations.
    return [
        ...removed.slice(0, 3).map(n => `${emojis.diffMinus}\`${truncate(n, 40)}\``),
        ...added.slice(0, 3).map(n => `${emojis.diffAdd}\`${truncate(n, 40)}\``),
    ].join('\n');
}


// ── RECORD VIEWS ── 🔴 ONE CONTRACT PER ENTITY, NOT AN IF-ELSE OVER PAGE KEYS. Harkirat, 2026-08-23 10:56 EDT, on the previous version: "why not literally JUST RENDER the draw since it's 1 simple text+thumbnail accessory component?" and "these changes need to be trickled into other edit/add/delete database changes as well ... not just applying to draws." Both land, and the second is the deeper one. Every fix before this was a DRAWS fix wearing a general name, while the Changes log carries nine pages. And the first retires the whole approach: this file was writing a bespoke description of each record -- pick fields, label them, format them -- when the bot already owns polished renderers for these exact objects. So a view REUSES the canonical renderer (never a copy of it: a copy drifts, and a panel that quietly stops matching the real card is worse than one that never tried), and any page without one still works through the generic payload view below.
//   { noun, fetch(target, row) -> record|null, render(record) -> V2 blocks|null, visibility(record) -> string|null, dateOnly: [field] }
const RECORD_VIEWS = {
    draws: {
        noun: 'draw', dateOnly: ['date'],
        fetch: async (t) => {
            const SeasonalData = require('../models/SeasonalData');
            const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
            const path = t.category === 'returning' ? 'returningDraws' : 'newDraws';
            return (doc?.[path] || []).find(x => String(x._id) === String(t.elementId || t.id)) || null;
        },
        // The player-facing card, from commands/draws.js itself.
        render: (d) => require('./draws').buildDrawSections([{ ...d, items: d.items || [] }]),
        // 🔴 MEASURED, AND IT KILLED THE FEATURE THIS WAS PLANNED AS. The phase-2 plan assumed a draw's `date` decides whether players see it, so this panel would say "scheduled until X / already past". It does not: commands/draws.js renders seasonalDoc.newDraws / returningDraws IN FULL -- no .filter(), no Date.now(), no visibility test anywhere in the file. The date is a label it prints, nothing more. "Scheduled" would have been a confident falsehood, and the true statement is the more useful one anyway: every draw edit is live the instant it saves.
        visibility: () => `🟢 **Players can see this now.** \`/draws\` lists every draw in the season — the date is a label it shows, not a schedule that hides it.`,
    },
    calendar: {
        noun: 'event', dateOnly: ['date', 'endDate'],
        fetch: async (t) => {
            const SeasonalData = require('../models/SeasonalData');
            const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
            return (doc?.calendar || []).find(x => String(x._id) === String(t.elementId || t.id)) || null;
        },
        // /calendar's own buildEntryLine, exported rather than copied. ⚠️ NORMALISED FIRST: buildEntryLine reads endDate for any entry that is neither `dateOnly` nor `isOngoing`, and `new Date(undefined).getTime()` is NaN -- which renders as a literal `<t:NaN:D>` on screen rather than throwing, so renderRecord()'s try/catch would never have caught it. A reconstructed BEFORE state ({...now, ...inversePayload}) or a delete payload can easily lack endDate; a row with a start and no end IS a date-only entry, which is exactly what /calendar's own synthetic draw entries already are.
        render: (e) => {
            const { buildEntryLine } = require('./calendar');
            const entry = (e.dateOnly || e.isOngoing || e.endDate) ? e : { ...e, dateOnly: true };
            return [{ type: 10, content: buildEntryLine(entry, { bpEnd: null, bpEndTBD: false }) }];
        },
        // 🔴 THE ANSWER COMES FROM THE RENDER PATH, never a fresh date comparison here -- a second rule would drift from what /calendar actually shows and then state the opposite with confidence. isEventEnded() is the only thing that hides an entry, and its own header records a live bug (2026-08-07) from conflating RELEASED with ENDED.
        visibility: async (e) => {
            const { isEventEnded } = require('./calendar');
            const SeasonalData = require('../models/SeasonalData');
            // Two fields, lean, on an admin-only panel -- an `isOngoing` entry ends when the Battle Pass does, and that lives on the season doc rather than the entry.
            const doc = await SeasonalData.findOne({ docType: 'global' }).select('bpEnd bpEndTBD').lean();
            return isEventEnded(e, doc || {}, Date.now())
                ? `⚫ **This one has already ended.** It is hidden from \`/calendar\`'s Active/Upcoming view, but still listed in the default All view.`
                : `🟢 **Players can see this now.** It shows on \`/calendar\` in both the default view and Active/Upcoming.`;
        },
    },
    loadouts_mp: {
        noun: 'build', dateOnly: [],
        fetch: async (t) => { const L = require('../models/Loadout'); const id = t.id || t.elementId; return id ? L.findById(id).lean() : null; },
        // The content half of the real /gunsmiths card. NOT buildLoadoutCard -- that returns a whole Container ending in a live pagination/Copy row whose custom_ids resolve an index against a query only /gunsmiths has made, so those buttons would either mislead or misfire here, and a Container cannot nest inside the panel's own. See utils/loadoutRender.js's buildLoadoutCardBody header.
        render: (b) => require('../utils/loadoutRender').buildLoadoutCardBody(b, { index: 0, total: 1, hideBadges: false }),
        visibility: () => `🟢 **Players can see this now.** \`/gunsmiths\` serves whatever is stored — a build is live the moment it saves.`,
    },
    announcement: {
        noun: 'announcement', dateOnly: [],
        fetch: async (t) => { const A = require('../models/Announcement'); const id = t.id || t.elementId; return id ? A.findById(id).lean() : null; },
        // The same text a user is actually shown. buildAnnouncementEmbed returns an EMBED, which cannot go inside a Components V2 container -- its `description` is the canonical body, so that is what is reused rather than re-deriving the wording here.
        render: (a) => [{ type: 10, content: truncate(require('../utils/announcement').buildAnnouncementEmbed(a).description, 900) }],
    },
    patchnotes: {
        noun: 'patch note', dateOnly: [],
        fetch: async (t) => {
            const SeasonalData = require('../models/SeasonalData');
            const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
            return (doc?.patchNotes || []).find(x => String(x._id) === String(t.elementId || t.id)) || null;
        },
        render: null,
    },
    access: {
        noun: 'admin', dateOnly: [],
        // Reads row.target, not inverse.target: access changes never go through commitSet, so they carry no inverse at all (which is also why they are correctly un-revertible).
        fetch: async (_t, row) => {
            const AdminUser = require('../models/AdminUser');
            return row?.target ? AdminUser.findOne({ discordId: String(row.target) }).lean() : null;
        },
        render: null,
    },
    // season/seasondraft deliberately have NO fetch. Their ops target human labels -- 'draft', 'season snapshot', a season title -- not element ids, because the "record" is the whole global document rather than a row in it. The generic payload view is the correct and complete answer for them, not a stopgap.
    seasondraft: { noun: 'draft change', dateOnly: ['date', 'endDate', 'bpEnd'], fetch: null, render: null },
    season: { noun: 'season setting', dateOnly: ['bpEnd', 'seasonEnd'], fetch: null, render: null },
};
RECORD_VIEWS.loadouts_dmz = RECORD_VIEWS.loadouts_mp;
// See PAGE_LABEL above: pageForOp() really does emit both spellings, so both must resolve to the same view.
RECORD_VIEWS.patchnote = RECORD_VIEWS.patchnotes;

const viewFor = (page) => RECORD_VIEWS[page] || { noun: 'record', dateOnly: [], fetch: null, render: null, visibility: null };

// Every field the change actually carries, in the data's own vocabulary. Generic on purpose: it is what makes patch notes, the season draft, season settings and bot access work WITHOUT a bespoke branch each, which is the difference between "covers nine pages" and "covers whichever five I remembered".
function genericFields(obj, dateOnly, limit = 8) {
    return Object.entries(obj || {})
        .filter(([k, v]) => k !== '_id' && v != null && v !== '')
        .slice(0, limit)
        .map(([k, v]) => `**${fieldLabel(k)}:** ${fmtFieldValue(v, k, dateOnly)}`)
        .join('\n');
}

// A canonical card if the entity has a renderer AND it fits; otherwise the field list. MEASURED, never assumed: Components V2 caps at 40 counted recursively and this repo has already taken that as a production crash, so a before/after pair of rich cards has to prove it fits before it is used.
function renderRecord(page, record, dateOnly, budget) {
    const view = viewFor(page);
    if (view.render && record) {
        try {
            const blocks = view.render(record);
            if (blocks && blocks.length && countPanelComponents(blocks) <= budget) return blocks;
        } catch (renderError) {
            console.error(`Change-detail canonical render failed for ${page}:`, renderError?.message || renderError);
        }
    }
    const listed = genericFields(record, dateOnly);
    return listed ? [{ type: 10, content: listed }] : null;
}

// The same recursive walker Discord applies -- `components`, `accessory` and `items`. A walker following only `components` would miss exactly the Section accessories a draw card is made of.
const countPanelComponents = (node) => Array.isArray(node)
    ? node.reduce((n, x) => n + countPanelComponents(x), 0)
    : (node && typeof node === 'object')
        ? 1 + countPanelComponents(node.components || []) + (node.accessory ? countPanelComponents(node.accessory) : 0) + countPanelComponents(node.items || [])
        : 0;

async function fetchRecord(row) {
    const view = viewFor(row.page);
    if (!view.fetch) return null;
    // `row` is passed too because not every change HAS an inverse: /bot access grants and revokes are written straight through recordChange(), never commitSet(), so inverse is null and the only identifier available is the row's own `target`. Reading solely from inverse.target left those panels blank.
    const raw = await view.fetch((row.inverse && row.inverse.target) || {}, row);
    return raw ? { noun: view.noun, raw, dateOnly: view.dateOnly } : null;
}


function revertSentence(row, noun, changedCount) {
    const verb = String(row.inverse?.type || '').split('.')[1];
    const thing = noun || 'record';
    if (verb === 'delete') return `↩️ **Reverting deletes this ${thing}.** Nothing else is touched.`;
    if (verb === 'add' || verb === 'post') return `↩️ **Reverting puts this ${thing} back**, exactly as it was.`;
    if (verb === 'edit') return `↩️ **Reverting undoes ${changedCount === 1 ? 'that change' : changedCount ? `those ${changedCount} changes` : 'the edit'}**, putting the old values back.`;
    return `↩️ **Reverting applies the inverse** recorded when this change was made.`;
}

// fieldList retired 2026-08-23 11:04 EDT -- genericFields() replaced it, and generically: it renders whatever fields the record actually carries instead of a hardcoded per-page list, which is what made patch notes / season / seasondraft / access work without a branch each.


async function buildChangeDetailBody(changeId) {
    const { getChange, getLaterChangesTo } = require('../utils/changeStore');
    const { canRevert } = require('../core/revert');
    const row = await getChange(changeId);
    if (!row) return [{ type: 10, content: `**That change no longer exists.**\n-# \`${truncate(changeId, 40)}\` is not in the log — it may have aged out of the 180-day window.` }];

    const gate = canRevert(row);
    const view = viewFor(row.page);
    const dateOnly = view.dateOnly;
    let record = null, later = [];
    try { record = await fetchRecord(row); } catch (recordError) {
        console.error(`Change-detail record lookup failed for ${changeId}:`, recordError?.message || recordError);
    }
    try { later = await getLaterChangesTo({ page: row.page, target: row.target, after: row.createdAt, excludeChangeId: row.changeId }); } catch (laterError) {
        console.error(`Change-detail later-changes lookup failed for ${changeId}:`, laterError?.message || laterError);
    }

    const verb = String(row.inverse?.type || '').split('.')[1];
    const payload = row.inverse && typeof row.inverse.payload === 'object' ? row.inverse.payload : null;
    const noun = view.noun;

    const body = [
        { type: 10, content: `### ${truncate(row.summary || `${row.action} on ${row.page}`, 90)}${row.undone ? ' ↩️' : ''}` },
        { type: 10, content: `-# by <@${row.actorId}> · <t:${unix(row.createdAt)}:f> (<t:${unix(row.createdAt)}:R>)` },
        { type: 14, spacing: 1 },
    ];

    let changed = [];
    if (verb === 'edit' && payload && record) {
        // 🔴 THE BEFORE STATE IS RECONSTRUCTABLE, AND I WAS RENDERING NEITHER HALF. The inverse holds the PREVIOUS values for exactly the fields the edit touched, so {...now, ...payload} IS the record as it was. Two canonical cards, labelled, is what "I need a better before/after" actually asks for -- and it needed no new data or query, only noticing that both halves were already in hand.
        const before = { ...record.raw, ...payload };
        const keys = Object.keys(payload).filter(k => k !== '_id');
        changed = keys.filter(k => !sameValue(record.raw[k], payload[k]));
        const untouched = keys.length - changed.length;

        // Budgeted BEFORE it is used: two rich cards plus the panel's own chrome must clear 40 counted recursively. Roughly half the remaining budget each, so neither card can crowd the other out.
        const chrome = countPanelComponents(body) + 14;
        const each = Math.max(1, Math.floor((40 - chrome) / 2));
        const beforeBlocks = renderRecord(row.page, before, dateOnly, each);
        const afterBlocks = renderRecord(row.page, record.raw, dateOnly, each);

        if (changed.length) {
            const rows = changed.slice(0, 6).map(k => {
                if (Array.isArray(payload[k]) || Array.isArray(record.raw[k])) {
                    const moved = describeListChange(payload[k], record.raw[k]);
                    return moved ? `**${fieldLabel(k)}:**\n${moved}` : null;
                }
                // 🔴 STACKED, NEVER `A → B` -- spec 2026-08-23 §2 rule G, which is Harkirat's own design. The glyphs landed on the ARRAY branch above and this scalar branch kept the inline arrow for a whole release, so the rule and the code disagreed in the COMMON case while the frozen spec asserted it had been "adopted verbatim". Two long values on one line is the same ribbon-wrap failure as the vitals row: on a 32-column phone `Drop` vs `Draw` becomes a guess. One value per line, each led by its own glyph, and the label carries the colon so it reads as a field.
                return `**${fieldLabel(k)}:**\n${emojis.diffMinus}${fmtFieldValue(payload[k], k, dateOnly)}\n${emojis.diffAdd}${fmtFieldValue(record.raw[k], k, dateOnly)}`;
            }).filter(Boolean);
            // A real `###` heading, not bold body text wearing an emoji -- structure carries the meaning (rule G). The count is code-styled so it reads as data.
            body.push({ type: 10, content: rows.length
                ? `### \`${rows.length}\` Field${rows.length === 1 ? '' : 's'} Changed\n${rows.join('\n')}`
                : `### Nothing Visible Changed\n-# The saved values differ only in ordering or internal ids.` });
            if (untouched) body.push({ type: 10, content: `-# ${plural(untouched, 'other field')} left as ${untouched === 1 ? 'it was' : 'they were'}.` });
        } else {
            body.push({ type: 10, content: `### Nothing Actually Changed\n-# Every field was saved with the value it already had — a no-op edit.` });
        }

        if (beforeBlocks && afterBlocks) {
            body.push({ type: 14, spacing: 2, divider: true });
            // The SAME glyphs as the field rows above, so the two scales read as one notation rather than two (rule G).
            body.push({ type: 10, content: `${emojis.diffMinus}**BEFORE** — the ${noun} as it was` });
            body.push(...beforeBlocks);
            body.push({ type: 14, spacing: 2, divider: true });
            body.push({ type: 10, content: `${emojis.diffAdd}**AFTER** — the ${noun} as it stands now` });
            body.push(...afterBlocks);
        }
    } else if (record) {
        // add: the record it created. delete-inverse cannot reach here (the row is gone by definition).
        const blocks = renderRecord(row.page, record.raw, dateOnly, 22);
        if (blocks) {
            body.push({ type: 10, content: `### The ${noun.replace(/^./, c => c.toUpperCase())} It Created` });
            body.push(...blocks);
        }
    } else if (payload) {
        // EVERY delete lands here -- the record is gone, and the inverse payload is that record in full. It is also the path every page without a fetcher takes, which is why it renders generically over the payload rather than from a hardcoded field list: patch notes, the season draft, season settings and bot access all work here without a bespoke branch each.
        const blocks = renderRecord(row.page, payload, dateOnly, 22);
        if (blocks) {
            body.push({ type: 10, content: `### The ${noun.replace(/^./, c => c.toUpperCase())} It ${verb === 'delete' ? 'Affected' : 'Removed'}` });
            body.push(...blocks);
        }
    } else {
        body.push({ type: 10, content: `-# The contents weren't recorded for this kind of change. Open it in the portal for the full record.` });
    }

    if (row.detail) body.push({ type: 10, content: `-# ${truncate(row.detail, 400)}` });

    // Reverting something players are looking at RIGHT NOW is a different decision from reverting something nobody can reach, and the panel used to present the two identically. Only three entities have a real answer; the rest say NOTHING rather than invent one -- which is why this is a per-entity `visibility` in the registry, not a rule applied across every page.
    if (record && view.visibility) {
        try {
            const note = await view.visibility(record.raw);
            if (note) body.push({ type: 10, content: note });
        } catch (visibilityError) {
            console.error(`Change-detail visibility check failed for ${row.page}:`, visibilityError?.message || visibilityError);
        }
    }

    // 🔴 THE ONE GENUINELY DANGEROUS CASE. Reverting an edit writes old values back over whatever came AFTER it, so a later change to the same record is silently destroyed by a button that looks isolated.
    if (later.length && !row.undone) {
        body.push({ type: 14, spacing: 1 });
        body.push({ type: 10, content: `⚠️ **${plural(later.length, 'later change')} touched this same ${noun} after this one.**\n`
            + later.slice(0, 3).map(c => `-# • ${truncate(c.summary || c.action, 60)} — <@${c.actorId}>, <t:${unix(c.createdAt)}:R>`).join('\n')
            + `\n-# Reverting this one puts the old values back over ${later.length === 1 ? 'that' : 'those'} too.` });
    }
    body.push({ type: 14, spacing: 1 });

    const reference = { type: 10, content: `-# Log entry \`${row.changeId}\`` };
    if (!gate.ok) {
        body.push({ type: 10, content: `⛔ **This one can't be reverted.**\n${gate.reason}` });
        body.push(reference);
        return body;
    }
    if (verb === 'edit' && !record && view.fetch) {
        body.push({ type: 10, content: `⚠️ **This ${noun} can't be found any more.** It was probably deleted after this change, in which case the revert will fail rather than resurrect it.` });
    }
    // 🔴 SUBTEXT, AND NO DIVIDER BEFORE THE BUTTONS (Harkirat, 2026-08-23 12:31 EDT). The hint explains the action; it is not the action, and at body weight above a divider it read as the panel's conclusion. As `-#` sitting directly on the button row it becomes a caption for those buttons, which is what it is -- and the buttons become the panel's visual anchor, which is what they are.
    body.push({ type: 10, content: `-# ${revertSentence(row, noun, changed.length)}` });
    body.push({ type: 10, content: `-# It applies the exact inverse recorded at the time — nothing is recomputed — and writes its own entry to this log.` });
    const canEditHere = MANAGE_PAGE_SCOPES.includes(row.page);
    body.push({ type: 1, components: [
        { type: 2, style: 4, label: 'Revert this change', custom_id: `bot_revert_${row.changeId}` },
        ...(canEditHere ? [{ type: 2, style: 1, label: `Edit in ${PAGE_LABEL[row.page] || row.page}`, custom_id: `bot_changeedit_${row.page}` }] : []),
        { type: 2, style: 5, label: 'Open in the portal', url: PORTAL_ANALYTICS_URL },
    ] });
    body.push(reference);
    return body;
}


const CHANGES_EMPTY = '**No edits in this window.**\n-# Every `/manage` save writes a row here with who made it and a one-click Revert. Make a change and it appears immediately.';

async function buildChangesBody() {
    const [summary, recent] = await Promise.all([
        getChangeSummary(),
        getRecentChanges({ page: 0, perPage: CHANGES_PER_PAGE }),
    ]);
    // Alerts and Changes both used to render "**Last 24h:** N" in the same position at the same weight, so the eye read two identical rows even though the nouns differed. A ledger states WHO and WHAT; a severity breakdown (Alerts) states HOW BAD. Different information, therefore different shapes. getChangeSummary() does not return an undoneCount today -- this plan touches no stores, so that clause is simply omitted rather than added.
    const ledgerLine = `**${plural(summary.last24h, 'edit')}** today · **${summary.last7d}** this week`;

    const body = [
        { type: 10, content: `-# Every \`/manage\` save and access change — ${summary.total.toLocaleString()} recorded.` },
        { type: 10, content: ledgerLine },
        { type: 14, spacing: 2 },
    ];
    if (recent.items.length) {
        body.push({ type: 10, content: '### Recent Changes\n-# newest first' });
        body.push(...buildChangesRows(recent.items));
    } else {
        body.push({ type: 10, content: CHANGES_EMPTY });
    }
    body.push({ type: 14, spacing: 2 });
    body.push({ type: 1, components: [{ type: 2, style: 5, label: 'Full history in the portal', url: PORTAL_ANALYTICS_URL }] });
    return body;
}

// ── Usage page — live aggregation against AnalyticsEvent (stage 2's collection); no roll-ups exist yet (stage 4), so this queries raw rows directly, matching the design's own note that recent-window questions don't need roll-ups. Product stats only (isAdmin: false). ──
async function computeUsageStats() {
    const AnalyticsEvent = require('../models/AnalyticsEvent');
    const now = Date.now();
    const since7d = new Date(now - 7 * 86400 * 1000);
    const sincePrev7d = new Date(now - 14 * 86400 * 1000);
    const [current, previous, byCommand, byEntry, byOutcome] = await Promise.all([
        AnalyticsEvent.countDocuments({ createdAt: { $gte: since7d }, isAdmin: false }),
        AnalyticsEvent.countDocuments({ createdAt: { $gte: sincePrev7d, $lt: since7d }, isAdmin: false }),
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d }, isAdmin: false } },
            { $group: { _id: '$command', c: { $sum: 1 } } }, { $sort: { c: -1 } }, { $limit: 8 },
        ]),
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d }, isAdmin: false } },
            { $group: { _id: '$entry', c: { $sum: 1 } } }, { $sort: { c: -1 } },
        ]),
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d }, isAdmin: false } },
            { $group: { _id: '$outcome', c: { $sum: 1 } } }, { $sort: { c: -1 } },
        ]),
    ]);
    return { current, previous, byCommand, byEntry, byOutcome };
}

const BAR_CELLS = 10;
// Proportional to the TOP command, not to the total: with 8 commands, share-of-total bars are all near-empty and compare nothing. Against the leader, the shape of the distribution is readable. The bar is fixed-width and the NAME truncates -- the bar is the only part carrying the comparison, so it is the one thing that must never be the part that gives way (spec audit finding 3). ⚠️ nameWidth is measured from the ACTUAL names, capped. A fixed 18 (what first shipped) stranded every bar in a narrow right-hand strip, because real command names run 4-10 characters -- so ~9 columns of every row were pure padding and the result read as a staircase floating in whitespace rather than a chart anchored to a baseline.
function buildUsageBars(byCommand) {
    if (!byCommand.length) return '';
    const top = byCommand[0].c || 1;
    const nameWidth = Math.min(14, Math.max(...byCommand.map(c => `/${c._id || '?'}`.length)));
    const countWidth = Math.max(...byCommand.map(c => String(c.c).length));
    return ansiBlock(byCommand.map(c => {
        const name = `/${c._id || '?'}`.slice(0, nameWidth).padEnd(nameWidth);
        return `${ANSI.cyan}${name}${ANSI.reset} ${ansiBar(c.c, top, BAR_CELLS, ANSI.green)} ${ANSI.bold}${String(c.c).padStart(countWidth)}${ANSI.reset}`;
    }));
}

const USAGE_EMPTY = '**No command usage in the last 7 days.**\n-# Only public commands count — your own `/manage` and `/bot` activity is deliberately excluded.';

// The delta gets its OWN line carrying the absolute prior figure, not a parenthetical. A drop of this size is the single most important fact on the page, and "-87%" without "316 then" is unactionable -- the reader cannot tell a collapse from a quiet week off a small base.
function usageDeltaLine(current, previous) {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return `🔺 **First traffic** in this window — nothing in the previous 7 days.`;
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return `➖ **Flat** against the previous 7 days (${previous.toLocaleString()} then).`;
    return `${pct > 0 ? '🔺' : '🔻'} **${Math.abs(pct)}% ${pct > 0 ? 'up' : 'down'}** on the previous 7 days — ${previous.toLocaleString()} then, ${current.toLocaleString()} now.`;
}

async function buildUsageBody() {
    const { current, previous, byCommand } = await computeUsageStats();
    const deltaLine = usageDeltaLine(current, previous);
    const head = [
        { type: 10, content: `## ${current.toLocaleString()} interactions\n-# last 7 days` },
        ...(deltaLine ? [{ type: 10, content: deltaLine }] : []),
        { type: 14, spacing: 1 },
    ];
    if (!byCommand.length) {
        return [
            ...head,
            { type: 10, content: USAGE_EMPTY },
            { type: 14, spacing: 1 },
            { type: 1, components: [{ type: 2, style: 5, label: 'Full breakdown in the portal', url: PORTAL_ANALYTICS_URL }] },
        ];
    }
    return [
        ...head,
        { type: 10, content: `### Most Used\n${buildUsageBars(byCommand.slice(0, 5))}` },
        { type: 10, content: `-# Bars are relative to the busiest command. Your own \`/manage\` and \`/bot\` use is deliberately left out.` },
        { type: 14, spacing: 1 },
        { type: 1, components: [{ type: 2, style: 5, label: 'Full breakdown in the portal', url: PORTAL_ANALYTICS_URL }] },
    ];
}

function fmtUtc(d) { return d ? new Date(d).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC') : '?'; }

// Matches buildAlertExport()/buildChangeExport()'s downloadable-.txt shape — the fuller record beyond what fits in the panel, same convention every export button in this command uses.
async function buildUsageExport() {
    const { current, previous, byCommand, byEntry, byOutcome } = await computeUsageStats();
    const lines = [
        `Dioreo — usage export`,
        `Generated: ${fmtUtc(new Date())}`,
        `Window: last 7 days · previous 7 days: ${previous.toLocaleString()} · current: ${current.toLocaleString()}`,
        `(Admin surfaces excluded.)`,
        '='.repeat(72), '',
        'Top commands:',
        ...(byCommand.length ? byCommand.map((c, i) => `  ${i + 1}. /${c._id || '?'} — ${c.c}`) : ['  (no data yet)']),
        '',
        'Entry point breakdown:',
        ...(byEntry.length ? byEntry.map(e => `  ${e._id || '?'}: ${e.c}`) : ['  (no data yet)']),
        '',
        'Outcome breakdown:',
        ...(byOutcome.length ? byOutcome.map(o => `  ${o._id || '?'}: ${o.c}`) : ['  (no data yet)']),
    ];
    return lines.join('\n');
}

// ── Timing page — p50/p95 via Mongo's $percentile (MongoDB 8.0+, confirmed on this cluster). ──
async function computeTimingStats() {
    const AnalyticsEvent = require('../models/AnalyticsEvent');
    const since7d = new Date(Date.now() - 7 * 86400 * 1000);
    const [overallRows, byCommand, byDep] = await Promise.all([
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d } } },
            { $group: {
                _id: null,
                ackP: { $percentile: { input: '$ackMs', p: [0.5, 0.95], method: 'approximate' } },
                durP: { $percentile: { input: '$durationMs', p: [0.5, 0.95], method: 'approximate' } },
            } },
        ]),
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d }, durationMs: { $ne: null } } },
            { $group: { _id: '$command', p: { $percentile: { input: '$durationMs', p: [0.95], method: 'approximate' } }, n: { $sum: 1 } } },
            { $sort: { n: -1 } }, { $limit: 6 },
        ]),
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d }, deps: { $exists: true, $ne: [] } } },
            { $unwind: '$deps' },
            { $group: { _id: '$deps.name', totalMs: { $sum: '$deps.ms' }, calls: { $sum: '$deps.calls' } } },
            { $sort: { totalMs: -1 } }, { $limit: 6 },
        ]),
    ]);
    return { overall: overallRows[0] || null, byCommand, byDep };
}

// Discord closes the interaction window at 3,000ms. A bare "p95 2,400ms" makes a reader do that division in their head every time; stating the headroom is the page doing its own job. null is white circle, never green -- "no data" and "plenty of room" are different answers and must not share a colour. ⚠️ RETAINED ONLY AS A REGRESSION WITNESS. Nothing a reader sees calls this any more -- ackVerdict() replaced it once "headroom" turned out to be jargon its only reader could not parse. The test keeps it to prove the old path really did emit a negative percentage; do not route a panel string back through it.
function headroom(ms, budgetMs) {
    if (ms == null) return { pct: null, icon: '⚪' };
    const pct = Math.round(((budgetMs - ms) / budgetMs) * 100);
    return { pct, icon: pct >= 50 ? '🟢' : pct >= 25 ? '🟡' : pct >= 10 ? '🟠' : '🔴' };
}

// 🔴 HEADROOM APPLIES TO THE ACK AND NOTHING ELSE. Discord's 3,000ms limit is the deadline to ACKNOWLEDGE an interaction; once it is deferred the followup window is FIFTEEN MINUTES. Measuring total duration against 3,000ms is therefore not a harsh reading, it is a false one -- it shipped as "🔴 /colors -204% headroom" for a heavy image command that was working exactly as designed, i.e. the page asserted a production fault that did not exist. Duration gets a felt-speed band instead. The bands are Nielsen's published response-time thresholds (~0.1s instantaneous, ~1s uninterrupted flow, ~10s the limit of held attention), deliberately NOT a budget invented here -- inventing a second fake budget would repeat the very mistake above.
const FELT_SPEED = [
    { under: 1000, icon: '🟢', word: 'instant', headline: 'Finishes instantly', colour: ANSI.green },
    { under: 3000, icon: '🟡', word: 'quick', headline: 'Finishes quickly', colour: ANSI.yellow },
    { under: 10000, icon: '🟠', word: 'slow', headline: 'Takes a moment to finish', colour: ANSI.yellow },
    { under: Infinity, icon: '🔴', word: 'a long wait', headline: 'Some runs take a long time', colour: ANSI.red },
];
function feltSpeed(ms) {
    if (ms == null) return { icon: '⚪', word: 'no data', headline: 'Nothing measured yet', colour: ANSI.gray };
    return FELT_SPEED.find(b => ms < b.under);
}

// 🔴 NO p50 / p95 / "HEADROOM" ANYWHERE A READER SEES. Harkirat, 2026-08-23 10:00 EDT, on the version that shipped an hour earlier: "literally no clue what p50, p95, 99% headroom even mean. they look like jargon to me. not intuitive." He is the ONLY user of this admin-only page, so that is not a nitpick -- the page was fluent in a dialect its sole reader does not speak, and every prior critique round (mine included) argued about WHICH threshold to compare against while taking the vocabulary itself for granted. The translations are chosen to stay TRUE, not merely simpler: p50 is the median -> "usually"; p95 is NOT the worst case (a tempting and wrong simplification) -> "slowest 1 in 20"; and a percentage of an unstated denominator becomes the rule plus what it consumes, which is something a person can actually picture.
const ACK_LIMIT_MS = 3000;
function ackVerdict(ms) {
    if (ms == null) return { icon: '⚪', headline: 'Nothing measured yet', used: null };
    const usedPct = (ms / ACK_LIMIT_MS) * 100;
    const used = usedPct < 1 ? 'under 1%' : `${Math.round(usedPct)}%`;
    if (usedPct < 10) return { icon: '🟢', headline: 'Answers instantly', used };
    if (usedPct < 50) return { icon: '🟡', headline: 'Answers well within time', used };
    if (usedPct < 90) return { icon: '🟠', headline: 'Answering later than it should', used };
    return { icon: '🔴', headline: 'Close to missing the deadline', used };
}

// Seconds above 1,000ms. "9119ms" makes a reader count digits to learn it is nine seconds.
function fmtDur(ms) { return ms == null ? '—' : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`; }

const TIMING_EMPTY = '**No timings recorded yet.**\n-# Every interaction records how long it took to acknowledge and to finish. This fills in on its own as the bot gets used.';

async function buildTimingBody() {
    const { overall, byCommand } = await computeTimingStats();
    const ackP = overall?.ackP || [null, null];
    const durP = overall?.durP || [null, null];
    if (!overall && !byCommand.length) {
        return [
            { type: 10, content: TIMING_EMPTY },
            { type: 14, spacing: 1 },
            { type: 1, components: [{ type: 2, style: 5, label: 'Full breakdown in the portal', url: PORTAL_ANALYTICS_URL }] },
        ];
    }
    const ack = ackVerdict(ackP[1]);
    const durFelt = feltSpeed(durP[1]);
    // A threshold page ranks by RISK, not by frequency -- re-sort worst p95 first. computeTimingStats() already returns the rows; the aggregation's own $sort/$limit stays untouched for the portal.
    const worst = [...byCommand].sort((a, b) => (b.p?.[0] ?? 0) - (a.p?.[0] ?? 0)).slice(0, 3);
    const slowestBlock = worst.length ? (() => {
        const top = worst[0].p?.[0] || 1;
        const nameWidth = Math.min(12, Math.max(...worst.map(c => `/${c._id || '?'}`.length)));
        const durWidth = Math.max(...worst.map(c => fmtDur(c.p?.[0]).length));
        // 8 cells here, not BAR_CELLS' 10: every row now leads with a severity glyph, which costs ~2 columns, and the phone budget is 32. The glyph is NOT decoration -- it is the only carrier of the speed band that survives iOS stripping the ANSI colour. Every row carries exactly one, so they all shift by the same amount and the columns stay aligned.
        return ansiBlock(worst.map(c => {
            const f = feltSpeed(c.p?.[0]);
            const name = `/${c._id || '?'}`.slice(0, nameWidth).padEnd(nameWidth);
            return `${f.icon} ${ANSI.cyan}${name}${ANSI.reset} ${ansiBar(c.p?.[0] ?? 0, top, 8, f.colour)} ${ANSI.bold}${fmtDur(c.p?.[0]).padStart(durWidth)}${ANSI.reset}`;
        }));
    })() : null;
    return [
        { type: 10, content: `${ack.icon} **${ack.headline}** — usually ${fmtDur(ackP[0])}, slowest 1 in 20: ${fmtDur(ackP[1])}` },
        { type: 10, content: `-# Discord throws away any command the bot doesn't answer within **3 seconds**.${ack.used ? ` Even its slowest answers use ${ack.used} of that.` : ''}` },
        { type: 14, spacing: 1 },
        { type: 10, content: `${durFelt.icon} **${durFelt.headline}** — usually ${fmtDur(durP[0])}, slowest 1 in 20: ${fmtDur(durP[1])}` },
        { type: 10, content: `-# Answering and finishing are different things. Once it has answered, the bot has 15 minutes to do the work — so nothing here is late, this is just how long you wait.` },
        { type: 14, spacing: 1 },
        ...(slowestBlock
            ? [{ type: 10, content: `### Slowest To Finish\n${slowestBlock}` },
               { type: 10, content: `-# **"Slowest 1 in 20"** means: run it twenty times and about one run will be roughly this slow. Ranked by that, not by how often each is used — and your own admin commands **are** counted here, unlike Usage.` }]
            : [{ type: 10, content: TIMING_EMPTY }]),
        { type: 14, spacing: 1 },
        { type: 1, components: [{ type: 2, style: 5, label: 'Full breakdown in the portal', url: PORTAL_ANALYTICS_URL }] },
    ];
}

async function buildTimingExport() {
    const { overall, byCommand, byDep } = await computeTimingStats();
    const ackP = overall?.ackP || [null, null];
    const durP = overall?.durP || [null, null];
    const lines = [
        `Dioreo — timing export`,
        `Generated: ${fmtUtc(new Date())}`,
        `Window: last 7 days`,
        '='.repeat(72), '',
        `Ack time p50/p95: ${fmtMs(ackP[0])} / ${fmtMs(ackP[1])} (Discord's 3,000ms deadline)`,
        `Total duration p50/p95: ${fmtMs(durP[0])} / ${fmtMs(durP[1])}`,
        '',
        'Slowest commands (p95 duration):',
        ...(byCommand.length ? byCommand.map(c => `  /${c._id || '?'} — p95 ${fmtMs(c.p?.[0])} (${c.n} samples)`) : ['  (no data yet)']),
        '',
        'Dependency time totals:',
        ...(byDep.length ? byDep.map(d => `  ${d._id} — ${d.calls} calls, ${Math.round(d.totalMs).toLocaleString()}ms total`) : ['  (no external dependency calls recorded yet)']),
    ];
    return lines.join('\n');
}

// Shared render entry point — used by execute() (slash) AND handlers/bot.js's re-render branches, so there's one render path, not a drifting copy per page (same convention /alerts and /audit each already followed on their own).
async function buildAnalyticsPanel({ page = 'health', client, alertsState = {} } = {}) {
    const meta = PAGE_META[page] || PAGE_META.health;
    let body;
    if (page === 'alerts') body = await buildAlertsBody(alertsState);
    else if (page === 'changes') body = await buildChangesBody();
    else if (page === 'usage') body = await buildUsageBody();
    else if (page === 'timing') body = await buildTimingBody();
    else body = await buildHealthBody(client);

    return [{
        type: 17,
        accent_color: meta.accent,
        components: [
            { type: 10, content: `## ${meta.label}` },
            { type: 14, spacing: 2 },
            pageSelectRow(page),
            { type: 14, spacing: 2 },
            ...body,
        ],
    }];
}

// ── Access page — the admin allowlist, extracted from /manage's former owner-only `manageadmins` page. Card rendering (buildAdminListBlocks) and both modal builders moved here verbatim from commands/manage.js; only their custom_ids changed prefix (mng_admin_/modal_admin_ -> bot_admin_/bot_adminmodal_), matching /bot's single owned prefix. ──
async function buildAdminListBlocks(adminDocs, client) {
    if (!adminDocs || adminDocs.length === 0) {
        return [{ type: 10, content: `**No additional admins granted.** Only the bot owner has admin access right now. Use Grant Admin below to add someone.` }];
    }
    const blocks = [];
    for (let i = 0; i < adminDocs.length; i++) {
        const a = adminDocs[i];
        let avatarUrl = null;
        try {
            const user = await client.users.fetch(a.discordId);
            avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
        } catch (fetchError) {
            console.error(`Failed to fetch Discord user ${a.discordId} for Bot Access card:`, fetchError?.message || fetchError);
        }
        const grantedTs = unix(a.grantedAt);
        const content = `### <@${a.discordId}>\n-# ID: \`${a.discordId}\` — granted by <@${a.grantedBy}> <t:${grantedTs}:R>\n**Permissions:** ${formatPermissions(a.permissions)}\n**Note:** ${a.note || '*(none)*'}`;
        blocks.push(avatarUrl
            ? { type: 9, components: [{ type: 10, content }], accessory: { type: 11, media: { url: avatarUrl } } }
            : { type: 10, content });
        blocks.push({
            type: 1, components: [
                { type: 2, style: 1, label: 'Edit Permissions', custom_id: `bot_admin_editperms_${a.discordId}` },
                { type: 2, style: 4, label: 'Revoke', custom_id: `bot_admin_revoke_${a.discordId}` },
            ],
        });
        if (i < adminDocs.length - 1) blocks.push({ type: 14, spacing: 1, divider: true });
    }
    return blocks;
}

function buildAdminGrantModal() {
    const modal = new ModalBuilder().setCustomId('bot_adminmodal_grant').setTitle('Grant Admin Access');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('discord_id').setLabel('Discord User ID or @mention').setStyle(TextInputStyle.Short).setPlaceholder('e.g. 123456789012345678 or @username').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('permissions').setLabel('Permissions').setStyle(TextInputStyle.Paragraph).setPlaceholder('all | manage | bot | autobuild | manage.calendar, manage.draws, ...').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('note').setLabel('Note (optional)').setStyle(TextInputStyle.Short).setPlaceholder('e.g. their name, why they were granted').setRequired(false)),
    );
    return modal;
}

function buildAdminEditPermissionsModal(adminDoc) {
    const modal = new ModalBuilder().setCustomId(`bot_adminmodal_editperms_${adminDoc.discordId}`).setTitle('Edit Permissions');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('permissions').setLabel('Permissions').setStyle(TextInputStyle.Paragraph).setPlaceholder('all | manage | bot | autobuild | manage.calendar, manage.draws, ...').setValue((adminDoc.permissions || []).join(', ')).setRequired(true)),
    );
    return modal;
}

async function buildAccessPanel(client) {
    const AdminUser = require('../models/AdminUser');
    const adminDocs = await AdminUser.find({}).sort({ grantedAt: 1 }).lean();
    const adminListBlocks = await buildAdminListBlocks(adminDocs, client);
    return [{
        type: 17,
        accent_color: ACCESS_ACCENT,
        components: [
            // Emoji read INSIDE this builder, never at require() time -- refreshEmojiIds() rewrites emojiMap at boot, after this module is loaded, so a module-level capture would freeze the PROD id and render broken on the dev bot (.claude/rules/rendering-and-ui.md).
            { type: 10, content: `## ${emojis.botAccess} Bot Access` },
            { type: 10, content: `-# Owner-only · the runtime-editable admin allowlist that supplements the hardcoded owner.` },
            { type: 14, spacing: 2 },
            ...adminListBlocks,
            { type: 14, spacing: 2 },
            { type: 1, components: [
                { type: 2, style: 3, label: 'Grant Admin', custom_id: 'bot_admin_grant' },
                { type: 2, style: 2, label: 'Guide', custom_id: 'bot_admin_guide' },
            ] },
        ],
    }];
}

// Renders one of four outcomes. The refusal cases carry the two buttons Harkirat asked for -- "refuse and say so AND *offer* to full restart or exit" -- so a refusal is never a dead end.
function buildHotpatchPanel(out) {
    const { plan, result, commit, changed } = out;
    const body = [];
    const head = t => body.push({ type: 10, content: t });

    if (!changed.length && !plan.members.length) {
        head(`### 🩹 Nothing to patch\nThe working tree is already at \`${commit.slice(0, 7)}\` — the running process is up to date.`);
        return [{ type: 17, accent_color: 0x5865F2, components: body }];
    }
    head(`### 🩹 Hotpatch · \`${commit.slice(0, 7)}\`\n**${changed.length}** changed runtime file(s), **${plan.members.length}** module(s) in the reload closure.`);

    if (plan.verdict === 'ALLOW' && result?.ok) {
        head(`✅ **Applied.** No restart, no gateway reconnect.\n${result.applied.map(f => `• \`${f}\``).join('\n')}`);
        return [{ type: 17, accent_color: 0x57F287, components: body }];
    }
    if (plan.verdict === 'ALLOW' && !result) {
        head(`🔍 **Dry run — nothing changed.** These would reload:\n${plan.members.map(f => `• \`${f}\``).join('\n')}`);
        return [{ type: 17, accent_color: 0x5865F2, components: body }];
    }
    if (plan.verdict === 'REFUSE_STRUCTURAL') {
        head(`⛔ **Can't hotpatch this — a full restart is required.**\n${plan.escaped.map(f => `• \`${f}\` — owns process lifecycle or is a Mongoose model`).join('\n')}${plan.unresolved?.length ? `\n\nNot a runtime module (deleted by the pull, or a typo): ${plan.unresolved.map(f => `\`${f}\``).join(', ')}` : ''}${plan.stray?.length ? `\n\nYou named ${plan.stray.map(f => `\`${f}\``).join(', ')}, which the pull did not change.` : ''}\n\nThis is permanent for these files, not a missing feature.`);
    } else if (plan.verdict === 'REFUSE_STATE') {
        head(`⚠️ **Refused — live state in the reload closure.**\n${Object.entries(plan.blocked).map(([f, r]) => `• \`${f}\` — ${r.join(', ')}`).join('\n')}\n\nEach of these can opt in later with a \`__hotSwap\` contract. Until then a restart is the honest option.`);
    } else if (result && !result.ok) {
        head(`❌ **Nothing was applied.**\n\`\`\`\n${String(result.error).slice(0, 800)}\n\`\`\`\nThe process is still running the code it had.`);
    }
    body.push({ type: 1, components: [
        { type: 2, style: 4, custom_id: 'bot_hp_restart', label: 'Full restart', emoji: { name: '♻️' } },
        { type: 2, style: 2, custom_id: 'bot_hp_cancel', label: 'Cancel' },
    ] });
    return [{ type: 17, accent_color: 0xFEE75C, components: body }];
}

module.exports = {
    buildAnalyticsPanel,
    buildAccessPanel,
    pageSelectRow,
    PAGE_META,
    __testables: { revertSentence, fmtFieldValue, sameValue, describeListChange, fmtItems, fmtUtcDay, RECORD_VIEWS, viewFor, genericFields, renderRecord, countPanelComponents, ackVerdict, buildVitalsBlock, buildChangesRows, CHANGES_EMPTY, ALERTS_EMPTY, buildUsageBars, headroom, feltSpeed, fmtDur, usageDeltaLine, visibleWidth },
    buildHotpatchPanel,
    buildChangeDetailBody,
    buildUsageExport,
    buildTimingExport,
    // Exported for the WEB PORTAL's Analytics dashboard, which needs the numbers rather than the rendered text. ⚠️ computeHealthStats is deliberately NOT here: it takes a discord.js `client` and reads client.ws.status plus this process's RSS, and the portal is a SEPARATE systemd unit with no gateway connection -- calling it there would report the portal's own health while looking like the bot's. portal/api/analytics.js derives health from Mongo instead and says so.
    computeUsageStats,
    computeTimingStats,
    buildAdminListBlocks,
    buildAdminGrantModal,
    buildAdminEditPermissionsModal,
    // PAGE_LABEL stays OUT of exports (v3-pre-release review, finding #47) -- confirmed dead as a CROSS-MODULE export, this file uses it itself. PAGE_META/pageSelectRow were re-added 2026-08-23 00:22 EDT (bot analytics redesign) so scripts/botAnalyticsBody.test.js can assert on the page-switcher descriptions without duplicating them. decodeState (and FILTERABLE_PAGES/encodeState alongside it) was removed entirely in the same change -- the page/actor filter branches that were its only callers, in this file and handlers/bot.js, moved to the portal.

    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription("Dioreo's own analytics and admin access management")
        .setDefaultMemberPermissions(0)
        // ADMIN-ONLY, same reasoning as /manage/autobuild: stays user-install [1] deliberately — an admin command advertised in every server's command list is noise plus needless surface.
        .setIntegrationTypes([1]).setContexts([0, 1, 2])
        .addSubcommand(sub => sub.setName('analytics').setDescription("View the bot's usage, timing and health data")
            .addStringOption(o => o.setName('page').setDescription('Jump directly to a page (defaults to Health)').addChoices(
                { name: 'Health', value: 'health' }, { name: 'Alerts', value: 'alerts' }, { name: 'Changes', value: 'changes' },
                { name: 'Usage', value: 'usage' }, { name: 'Timing', value: 'timing' },
            ))
            .addStringOption(o => o.setName('visibility').setDescription('Show this panel only to you, or publicly to everyone in the chat. (Defaults to only you.)').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })))
        .addSubcommand(sub => sub.setName('access').setDescription('View and manage the admin allowlist (owner-only)')
            .addStringOption(o => o.setName('visibility').setDescription('Show this panel only to you, or publicly to everyone in the chat. (Defaults to only you.)').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })))
        .addSubcommand(sub => sub.setName('hotpatch').setDescription('Reload changed files into the running bot without a restart (owner-only)')
            .addBooleanOption(o => o.setName('pull').setDescription('git pull first (default: yes)'))
            .addBooleanOption(o => o.setName('dry_run').setDescription('Show the plan and change nothing'))
            .addStringOption(o => o.setName('file').setDescription('Limit to one changed file (default: everything the pull brought in)').setAutocomplete(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'access') {
            if (!isOwner(interaction.user.id)) {
                return interaction.reply({ content: '🔒 **Only the bot owner can manage the admin list.**', ephemeral: true });
            }
            const visibilityChoice = interaction.options.getString('visibility');
            const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
            await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
            return sendV2Payload(interaction, await buildAccessPanel(interaction.client));
        }

        if (sub === 'hotpatch') {
            // isOwner ONLY -- this runs new code in the process. The 'bot' token is grantable to any admin.
            if (!isOwner(interaction.user.id)) {
                return interaction.reply({ content: '🔒 **Only the bot owner can hotpatch.** This one loads new code into the running process.', ephemeral: true });
            }
            await interaction.deferReply({ flags: 64 });   // always ephemeral; this is never a public panel
            const { runHotpatch } = require('../utils/hotpatch');
            const out = await runHotpatch({
                client: interaction.client,
                files: [interaction.options.getString('file')].filter(Boolean),
                pull: interaction.options.getBoolean('pull') ?? true,
                dryRun: interaction.options.getBoolean('dry_run') ?? false,
            });
            return sendV2Payload(interaction, buildHotpatchPanel(out));
        }

        // analytics
        if (!(await hasCommandAccess(interaction.user.id, 'bot'))) {
            return interaction.reply({ content: `🔒 **This one's admin-only.** ${mentionCommand(interaction.client, '/bot analytics')} shows the bot's own usage and health data — try any of the bot's public commands instead!`, ephemeral: true });
        }
        const page = interaction.options.getString('page') || 'health';
        const visibilityChoice = interaction.options.getString('visibility');
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
        await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        return sendV2Payload(interaction, await buildAnalyticsPanel({ page, client: interaction.client }));
    },
};
