// utils/botControls.js -- the owner's bot-wide switches (B7, his asks 2026-10-30 12:47-13:21 EDT, "build it here"): the freeze, the spam ladder's numbers, exemptions, blocked people and servers, and per-server reply limits. Stored in models/BotControls.js, one document.
//
// READS ARE SYNCHRONOUS, from memory. The message listener and the router ask on every message and every interaction, so nothing here may wait on the database: load() fills the cache once at start-up (bot/lifecycle.js), and every write updates memory first and then saves. Both apps share one process, so a change from Dioreo Admin is seen by the public app on the next event. Until load() succeeds the defaults hold: nothing frozen, nobody blocked, the ladder's own numbers. A failed load is logged and leaves them; it never stops the bot.
//
// THE FREEZE (his "ok good", 2026-10-30 13:09 EDT): slash commands, buttons and pop-ups on the public app get one private line, "Dioreo is paused: <reason>"; typed commands go silent. Everything, or chosen slash commands. The owner, /bot and Dioreo Admin are never frozen, so it can always be undone.
// BLOCKED PEOPLE get the same treatment with their own line; blocked servers are left (bot/lifecycle.js) and, until the leave lands, ignored.
const { isOwnerId } = require('./owner');

const DEFAULT_SPAM = Object.freeze({ reply: 1, warning: 3, threshold: 10, rungsMin: Object.freeze([1, 5, 15, 60, 360, 720]) });
const DEFAULT_LIMITS = Object.freeze({ perChannel: 5, perServer: 30 });
// The bounds a setting is checked against before it is stored, so a typo can't switch the ladder off or make one reply a penalty.
const BOUNDS = { points: [1, 20], threshold: [2, 100], rung: [1, 24 * 60], rungs: [1, 6], perChannel: [1, 50], perServer: [1, 200] };

let state = blank();
let loaded = false;

function blank() {
    return { freeze: { all: false, commands: [], reason: '', since: null }, spam: {}, exemptUsers: new Set(), blockedUsers: new Set(), blockedGuilds: new Set(), replyLimits: new Map() };
}

const model = () => require('../models/BotControls');

function fromDoc(doc) {
    const s = blank();
    if (!doc) return s;
    const f = doc.freeze || {};
    s.freeze = { all: Boolean(f.all), commands: [...(f.commands || [])], reason: f.reason || '', since: f.since ? new Date(f.since) : null };
    const sp = doc.spam || {};
    for (const k of ['reply', 'warning', 'threshold']) if (Number.isFinite(sp[k])) s.spam[k] = sp[k];
    if (Array.isArray(sp.rungsMin) && sp.rungsMin.length) s.spam.rungsMin = [...sp.rungsMin];
    for (const k of ['exemptUsers', 'blockedUsers', 'blockedGuilds']) s[k] = new Set(doc[k] || []);
    for (const l of doc.replyLimits || []) if (l?.guildId) s.replyLimits.set(l.guildId, { perChannel: l.perChannel, perServer: l.perServer });
    return s;
}

function toDoc() {
    return {
        freeze: { ...state.freeze },
        spam: { reply: state.spam.reply ?? null, warning: state.spam.warning ?? null, threshold: state.spam.threshold ?? null, rungsMin: state.spam.rungsMin || undefined },
        exemptUsers: [...state.exemptUsers],
        blockedUsers: [...state.blockedUsers],
        blockedGuilds: [...state.blockedGuilds],
        replyLimits: [...state.replyLimits].map(([guildId, l]) => ({ guildId, ...l })),
    };
}

async function load() {
    try {
        state = fromDoc(await model().findById('global').lean());
        loaded = true;
    } catch (err) {
        console.error('Bot controls: could not load; using the defaults:', err?.message || err);
    }
    return loaded;
}

// Every write: memory first, then the database. Throws when the save fails, so the panel can say so; memory keeps the change until the next restart.
async function save() {
    await model().updateOne({ _id: 'global' }, { $set: toDoc() }, { upsert: true });
}

// --- the freeze ---
const freezeState = () => ({ ...state.freeze, commands: [...state.freeze.commands] });
const isFrozen = slashName => state.freeze.all || (Boolean(slashName) && state.freeze.commands.includes(slashName));
async function setFreeze({ all = false, commands = [], reason = '' } = {}) {
    state.freeze = { all: Boolean(all), commands: [...new Set(commands)], reason: String(reason || '').trim().slice(0, 200), since: new Date() };
    await save();
}
async function clearFreeze() {
    state.freeze = { all: false, commands: [], reason: '', since: null };
    await save();
}
function pausedLine() {
    const reason = state.freeze.reason ? `: ${state.freeze.reason}` : '. Try again a little later.';
    return `${require('./emojiMap').pending} Dioreo is paused${reason}`;
}

// --- people and servers ---
const isExempt = id => state.exemptUsers.has(id);
const isBlockedUser = id => state.blockedUsers.has(id);
const isBlockedGuild = id => Boolean(id) && state.blockedGuilds.has(id);
// A server the owner is leaving from /bot servers, so the leave feed says "Dioreo left" rather than "removed". In memory: it lasts until the gateway confirms.
const leaving = new Set();
const markLeaving = id => leaving.add(id);
const wasLeaving = id => leaving.delete(id);
const counts = () => ({ exempt: state.exemptUsers.size, blockedUsers: state.blockedUsers.size, blockedGuilds: state.blockedGuilds.size });
async function setFlag(kind, id, on) {
    const set = state[kind];
    if (!set || !id) return;
    if (on) set.add(id); else set.delete(id);
    await save();
}

// --- the spam ladder's numbers ---
function spam() {
    return {
        reply: state.spam.reply ?? DEFAULT_SPAM.reply,
        warning: state.spam.warning ?? DEFAULT_SPAM.warning,
        threshold: state.spam.threshold ?? DEFAULT_SPAM.threshold,
        rungsMin: state.spam.rungsMin ? [...state.spam.rungsMin] : [...DEFAULT_SPAM.rungsMin],
        tuned: Object.keys(state.spam).length > 0,
    };
}
// Reads the pop-up's text. Blank means the default. Returns { spam } or { error } with a line for the person.
function parseSpam({ points = '', threshold = '', rungs = '' } = {}) {
    const out = {};
    const nums = text => String(text || '').split(/[\s,]+/).filter(Boolean).map(Number);
    const inRange = (n, [lo, hi]) => Number.isInteger(n) && n >= lo && n <= hi;
    const p = nums(points);
    if (p.length) {
        if (p.length !== 2 || !p.every(n => inRange(n, BOUNDS.points))) return { error: `Points: two whole numbers, a reply's and a warning's, each ${BOUNDS.points.join('–')} (e.g. \`1, 3\`).` };
        [out.reply, out.warning] = p;
    }
    const t = nums(threshold);
    if (t.length) {
        if (t.length !== 1 || !inRange(t[0], BOUNDS.threshold)) return { error: `Penalty at: one whole number, ${BOUNDS.threshold.join('–')}.` };
        out.threshold = t[0];
    }
    const r = nums(rungs);
    if (r.length) {
        if (!inRange(r.length, BOUNDS.rungs) || !r.every(n => inRange(n, BOUNDS.rung))) return { error: `Rungs: ${BOUNDS.rungs.join('–')} lengths in minutes, each up to ${BOUNDS.rung[1]} (e.g. \`1, 5, 15, 60, 360, 720\`).` };
        if (r.some((n, i) => i && n < r[i - 1])) return { error: 'Rungs: each one at least as long as the one before.' };
        out.rungsMin = r;
    }
    const reply = out.reply ?? DEFAULT_SPAM.reply;
    if (reply >= (out.threshold ?? DEFAULT_SPAM.threshold)) return { error: "Penalty at must be more than a reply's points, or one reply would start a penalty." };
    return { spam: out };
}
async function setSpam(values) {
    state.spam = { ...values };
    await save();
}

// --- reply limits ---
function limitsFor(guildId) {
    const own = guildId ? state.replyLimits.get(guildId) : null;
    return { perChannel: own?.perChannel ?? DEFAULT_LIMITS.perChannel, perServer: own?.perServer ?? DEFAULT_LIMITS.perServer, custom: Boolean(own) };
}
function parseLimits({ perChannel = '', perServer = '' } = {}) {
    const read = (text, bounds, label) => {
        const t = String(text || '').trim();
        if (!t) return { value: null };
        const n = Number(t);
        return Number.isInteger(n) && n >= bounds[0] && n <= bounds[1] ? { value: n } : { error: `${label}: a whole number, ${bounds.join('–')}.` };
    };
    const c = read(perChannel, BOUNDS.perChannel, 'Per channel');
    if (c.error) return c;
    const s = read(perServer, BOUNDS.perServer, 'Per server');
    if (s.error) return s;
    return { limits: { perChannel: c.value, perServer: s.value } };
}
async function setLimits(guildId, { perChannel = null, perServer = null } = {}) {
    if (perChannel == null && perServer == null) state.replyLimits.delete(guildId);
    else state.replyLimits.set(guildId, { perChannel: perChannel ?? DEFAULT_LIMITS.perChannel, perServer: perServer ?? DEFAULT_LIMITS.perServer });
    await save();
}

// --- the router's gate ---
// For an interaction on the PUBLIC app: null to let it through, or the private line to answer with. The owner, Dioreo Admin and /bot always pass.
function gateInteraction(interaction) {
    const userId = interaction?.user?.id;
    if (!userId || isOwnerId(userId)) return null;
    const { clients } = require('../bot/clients');
    if (clients.admin && interaction.client === clients.admin) return null;
    const name = interaction.commandName || null;
    if (name === 'bot' || String(interaction.customId || '').startsWith('bot_')) return null;
    if (isBlockedUser(userId)) return `${require('./emojiMap').cross} Dioreo isn't available to you.`;
    // A per-command freeze names slash commands, so it stops their slash form and their autocomplete; a click on an older panel goes through unless everything is frozen.
    if (isFrozen(name)) return pausedLine();
    return null;
}

// --- tests ---
function __reset(doc = null) {
    state = fromDoc(doc);
    loaded = Boolean(doc);
}

module.exports = {
    load, isLoaded: () => loaded,
    freezeState, isFrozen, setFreeze, clearFreeze, pausedLine,
    isExempt, isBlockedUser, isBlockedGuild, counts, setFlag, markLeaving, wasLeaving,
    spam, parseSpam, setSpam,
    limitsFor, parseLimits, setLimits,
    gateInteraction,
    DEFAULT_SPAM, DEFAULT_LIMITS, BOUNDS,
    __reset,
};
