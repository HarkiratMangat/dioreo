// utils/alertStore.js The persistence + query layer behind the Discord alert system (see utils/alertWebhook.js). Kept in its own module so alertWebhook.js stays lean and the "monitors the bot, must never hurt it" contract is obvious in one place: recordAlert()/pruneAlerts() are fully swallowed and are called fire-and-forget (never awaited) from sendAlert(), completely INDEPENDENT of the webhook POST. Added 2026-07-20.
//
// Read helpers (getRecentAlerts/getAlertSummary/buildAlertExport) back the admin-only /alerts command.
const AlertLog = require('../models/AlertLog');
const AlertCounter = require('../models/AlertCounter');

// Explicitly encodes chronological order: index 0 = Jan (first) ... index 11 = Dec (last). Used both to build the "MMMDD" id/counter key AND by parseAlertId() to sort ids on their own (Harkirat's ask that month order be coded, not left implicit).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RETENTION_DAYS = 30;   // delete alerts older than this...
const HARD_CAP = 1000;       // ...AND never keep more than this many (whichever bites first)
const PRUNE_THROTTLE_MS = 60 * 60 * 1000; // prune at most once/hour so an incident loop can't hammer Mongo
let lastPruneAt = 0;

function pad2(n) { return String(n).padStart(2, '0'); }

// UTC date key, e.g. "Jul20". UTC deliberately (repo-wide "stored dates are always UTC" rule; DST-proof; host-TZ-independent). The counter rolls at UTC midnight.
function dateKey(date) {
    return `${MONTHS[date.getUTCMonth()]}${pad2(date.getUTCDate())}`;
}

// parseAlertId("Jul20-03") -> { monthIndex, day, seq }, for chronological ordering independent of a stored timestamp. Returns null on anything malformed.
function parseAlertId(id) {
    const m = /^([A-Za-z]{3})(\d{2})-(\d+)$/.exec(String(id || '').trim());
    if (!m) return null;
    const monthIndex = MONTHS.indexOf(m[1]);
    if (monthIndex === -1) return null;
    return { monthIndex, day: parseInt(m[2], 10), seq: parseInt(m[3], 10) };
}

// Escalating uptime — ALWAYS the top two adjacent units, except <60min which is minutes only (Harkirat's exact spec, 2026-07-20). Units: Min/H/D/W/M/Y; minutes use "Min" so a bare "M" is unambiguously months. Fuzzy units are fixed: week=7d, month=30d, year=365d.
function formatUptime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const MIN = 60, HOUR = 3600, DAY = 86400, WEEK = 604800, MONTH = 2592000, YEAR = 31536000;
    if (sec < HOUR) return `${Math.floor(sec / MIN)}Min`;
    if (sec < DAY) return `${Math.floor(sec / HOUR)}H ${Math.floor((sec % HOUR) / MIN)}Min`;
    if (sec < WEEK) return `${Math.floor(sec / DAY)}D ${Math.floor((sec % DAY) / HOUR)}H`;
    if (sec < MONTH) return `${Math.floor(sec / WEEK)}W ${Math.floor((sec % WEEK) / DAY)}D`;
    if (sec < YEAR) return `${Math.floor(sec / MONTH)}M ${Math.floor((sec % MONTH) / WEEK)}W`;
    return `${Math.floor(sec / YEAR)}Y ${Math.floor((sec % YEAR) / MONTH)}M`;
}

// Atomic next id for the given date's UTC day, e.g. "Jul20-03". findOneAndUpdate($inc) is race-free (two same-second alerts get distinct seq) where a count()+1 would collide on AlertLog's unique alertId.
async function nextDailyAlertId(date = new Date()) {
    const key = dateKey(date);
    const doc = await AlertCounter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        // returnDocument:'after' (not the deprecated `new:true`) — mongoose 9 warns on `new:true`, which would spam journald on every alert. Returns the POST-increment doc so `seq` is the new value.
        { upsert: true, returnDocument: 'after' }
    );
    return `${key}-${pad2(doc.seq)}`;
}

// Fire-and-forget persist. NEVER throws (returns an already-swallowed promise so even a stray `await` at a call site can't surface a rejection). sendAlert() calls this WITHOUT awaiting, in parallel with the webhook POST — a Mongo outage here must never stop an alert reaching Discord, and vice versa.
function recordAlert(fields) {
    return (async () => {
        const now = new Date();
        const alertId = await nextDailyAlertId(now);
        await AlertLog.create({
            alertId,
            level: fields.level,
            title: fields.title,
            detail: fields.detail,
            pinged: !!fields.pinged,
            silent: !!fields.silent, // logged-but-not-posted (routine gateway reconnect/resume)
            host: fields.host,
            rssMb: fields.rssMb,
            uptimeSec: fields.uptimeSec,
            createdAt: now,
        });
        pruneAlerts(); // fire-and-forget; own throttle + swallow
    })().catch(() => { /* store failure must never affect the bot or the webhook */ });
}

// Retention: >30d OR beyond a 1000 hard cap, whichever bites first. Self-throttled to ≤1/hour. Swallowed.
async function pruneAlerts() {
    const now = Date.now();
    if (now - lastPruneAt < PRUNE_THROTTLE_MS) return;
    lastPruneAt = now; // set before the work so a throw still can't cause hammering
    try {
        await AlertLog.deleteMany({ createdAt: { $lt: new Date(now - RETENTION_DAYS * 86400 * 1000) } });
        const count = await AlertLog.countDocuments();
        if (count > HARD_CAP) {
            const overflow = count - HARD_CAP;
            const oldest = await AlertLog.find().sort({ createdAt: 1 }).limit(overflow).select('_id').lean();
            if (oldest.length) {
                await AlertLog.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
            }
        }
    } catch { /* swallow — pruning is best-effort housekeeping */ }
}

// ── Read helpers (back the /alerts command) ─────────────────────────────────

// Newest-first page of alerts. perPage default 8 (fits the panel + component budget).
async function getRecentAlerts({ page = 0, perPage = 8 } = {}) {
    const total = await AlertLog.countDocuments();
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(0, page), totalPages - 1);
    const items = await AlertLog.find().sort({ createdAt: -1 }).skip(p * perPage).limit(perPage).lean();
    return { items, total, totalPages, page: p };
}

// Severity tallies for the last 24h and 7d, plus the most recent error's id/time — the /alerts summary.
async function getAlertSummary() {
    const now = Date.now();
    const since24h = new Date(now - 24 * 3600 * 1000);
    const since7d = new Date(now - 7 * 86400 * 1000);
    const [rows24, rows7, lastError, total] = await Promise.all([
        AlertLog.aggregate([{ $match: { createdAt: { $gte: since24h } } }, { $group: { _id: '$level', c: { $sum: 1 } } }]),
        AlertLog.aggregate([{ $match: { createdAt: { $gte: since7d } } }, { $group: { _id: '$level', c: { $sum: 1 } } }]),
        AlertLog.findOne({ level: 'error' }).sort({ createdAt: -1 }).lean(),
        AlertLog.countDocuments(),
    ]);
    const tally = (rows) => {
        const t = { info: 0, caution: 0, warn: 0, error: 0 };
        for (const r of rows) if (r._id in t) t[r._id] = r.c;
        return t;
    };
    return {
        total,
        last24h: tally(rows24),
        last7d: tally(rows7),
        lastError: lastError ? { alertId: lastError.alertId, createdAt: lastError.createdAt, title: lastError.title } : null,
    };
}

function fmtUtc(d) {
    return d ? new Date(d).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC') : '?';
}

// The downloadable .txt body — the fuller record beyond what the Discord embed shows. Newest first.
async function buildAlertExport() {
    const rows = await AlertLog.find().sort({ createdAt: -1 }).lean();
    const lines = [
        `Dioreo — alert log export`,
        `Generated: ${fmtUtc(new Date())}`,
        `Total alerts: ${rows.length}`,
        `Severity legend: info=🟢 caution=🟡 warn=🟠 error=🔴  (details in /bot analytics → "What alerts mean?")`,
        '='.repeat(72),
        '',
    ];
    for (const r of rows) {
        const meta = [
            (r.level || '?').toUpperCase(),
            r.pinged ? 'pinged' : 'no-ping',
            r.host || '?',
            r.rssMb != null ? `RSS ${r.rssMb}MB` : '',
            r.uptimeSec != null ? `up ${formatUptime(r.uptimeSec)}` : '',
        ].filter(Boolean).join(' | ');
        lines.push(`[${r.alertId || '??????'}] ${fmtUtc(r.createdAt)} | ${meta}`);
        lines.push(`Title:  ${r.title || ''}`);
        if (r.detail) lines.push(`Detail: ${r.detail}`);
        lines.push('─'.repeat(72));
        lines.push('');
    }
    if (!rows.length) lines.push('(no alerts recorded yet)');
    return lines.join('\n');
}

module.exports = {
    MONTHS,
    parseAlertId,
    formatUptime,
    nextDailyAlertId,
    recordAlert,
    pruneAlerts,
    getRecentAlerts,
    getAlertSummary,
    buildAlertExport,
};
