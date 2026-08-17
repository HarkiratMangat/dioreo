// utils/changeStore.js The persistence + query layer behind the /manage DB-change audit log (models/ChangeLog.js). Modelled directly on utils/alertStore.js -- recordChange() is fire-and-forget and NEVER throws, same contract as recordAlert(), so a logging failure can never break the admin action that triggered it. Read helpers back the admin-only /audit command. Stage 4 of docs/superpowers/specs/ 2026-08-14-manage-slash-decomposition-design.md.
const ChangeLog = require('../models/ChangeLog');
const AlertCounter = require('../models/AlertCounter');
const { MONTHS } = require('./alertStore');

const RETENTION_DAYS = 180;  // delete changes older than this...
const HARD_CAP = 5000;       // ...AND never keep more than this many (whichever bites first)
const PRUNE_THROTTLE_MS = 60 * 60 * 1000; // prune at most once/hour, same reasoning as alertStore
let lastPruneAt = 0;

function pad2(n) { return String(n).padStart(2, '0'); }

function dateKey(date) {
    return `${MONTHS[date.getUTCMonth()]}${pad2(date.getUTCDate())}`;
}

// Namespaced under the SAME AlertCounter collection AlertLog already uses ("chg-" prefix on the _id), rather than a second counter model -- the two logs' daily sequences never collide because their keys never collide, and there's no second collection to create/maintain for one more counter.
async function nextDailyChangeId(date = new Date()) {
    const key = `chg-${dateKey(date)}`;
    const doc = await AlertCounter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    return `${dateKey(date)}-${pad2(doc.seq)}`;
}

// Fire-and-forget persist -- NEVER throws (an already-swallowed promise, so even a stray `await` at a call site can't surface a rejection). Called un-awaited from every /manage operation function right after its own .save()/DB call succeeds, so a Mongo hiccup here can never turn a successful admin action into a failed one.
function recordChange(fields) {
    return (async () => {
        const now = new Date();
        const changeId = await nextDailyChangeId(now);
        await ChangeLog.create({
            changeId,
            actorId: fields.actorId,
            page: fields.page,
            action: fields.action,
            model: fields.model,
            target: fields.target,
            summary: fields.summary,
            detail: fields.detail,
            createdAt: now,
        });
        pruneChanges(); // fire-and-forget; own throttle + swallow
    })().catch((err) => { console.error('Failed to record /manage change (non-fatal):', err); });
}

// Retention: >180d OR beyond a 5000 hard cap, whichever bites first. Self-throttled to <=1/hour.
async function pruneChanges() {
    const now = Date.now();
    if (now - lastPruneAt < PRUNE_THROTTLE_MS) return;
    lastPruneAt = now; // set before the work so a throw still can't cause hammering
    try {
        await ChangeLog.deleteMany({ createdAt: { $lt: new Date(now - RETENTION_DAYS * 86400 * 1000) } });
        const count = await ChangeLog.countDocuments();
        if (count > HARD_CAP) {
            const overflow = count - HARD_CAP;
            const oldest = await ChangeLog.find().sort({ createdAt: 1 }).limit(overflow).select('_id').lean();
            if (oldest.length) {
                await ChangeLog.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
            }
        }
    } catch { /* swallow -- pruning is best-effort housekeeping */ }
}

// Flips the `undone` flag on a change row when a registered Undo consumes it. Best-effort: an undo action must never fail just because its audit row couldn't be found or updated.
async function markUndone(changeId) {
    if (!changeId) return;
    try {
        await ChangeLog.updateOne({ changeId }, { $set: { undone: true } });
    } catch (err) {
        console.error('Failed to flag change as undone (non-fatal):', err);
    }
}

// -- Read helpers (back /bot analytics' Changes page; formerly the retired /audit command) --

// Newest-first page of changes, optionally filtered by page key and/or actor id.
async function getRecentChanges({ page = 0, perPage = 8, filterPage = null, filterActor = null } = {}) {
    const query = {};
    if (filterPage) query.page = filterPage;
    if (filterActor) query.actorId = filterActor;
    const total = await ChangeLog.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(0, page), totalPages - 1);
    const items = await ChangeLog.find(query).sort({ createdAt: -1 }).skip(p * perPage).limit(perPage).lean();
    return { items, total, totalPages, page: p };
}

// Tallies for the summary tiles: total, changes in the last 24h/7d, and the most recent change.
async function getChangeSummary() {
    const now = Date.now();
    const since24h = new Date(now - 24 * 3600 * 1000);
    const since7d = new Date(now - 7 * 86400 * 1000);
    const [count24, count7, lastChange, total] = await Promise.all([
        ChangeLog.countDocuments({ createdAt: { $gte: since24h } }),
        ChangeLog.countDocuments({ createdAt: { $gte: since7d } }),
        ChangeLog.findOne().sort({ createdAt: -1 }).lean(),
        ChangeLog.countDocuments(),
    ]);
    return {
        total,
        last24h: count24,
        last7d: count7,
        lastChange: lastChange
            ? { changeId: lastChange.changeId, createdAt: lastChange.createdAt, summary: lastChange.summary, actorId: lastChange.actorId }
            : null,
    };
}

function fmtUtc(d) {
    return d ? new Date(d).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC') : '?';
}

// The downloadable .txt body -- the fuller record beyond what fits in the Discord panel. Newest first.
async function buildChangeExport({ filterPage = null, filterActor = null } = {}) {
    const query = {};
    if (filterPage) query.page = filterPage;
    if (filterActor) query.actorId = filterActor;
    const rows = await ChangeLog.find(query).sort({ createdAt: -1 }).lean();
    const lines = [
        `Dioreo -- /manage change log export`,
        `Generated: ${fmtUtc(new Date())}`,
        `Total changes: ${rows.length}${filterPage ? ` (filtered: page=${filterPage})` : ''}${filterActor ? ` (filtered: actor=${filterActor})` : ''}`,
        '='.repeat(72),
        '',
    ];
    for (const r of rows) {
        lines.push(`[${r.changeId || '??????'}] ${fmtUtc(r.createdAt)} | actor <@${r.actorId}> | ${r.page || '?'} / ${r.action || '?'}${r.undone ? ' | UNDONE' : ''}`);
        lines.push(`Target: ${r.target || '(n/a)'}`);
        lines.push(`Summary: ${r.summary || ''}`);
        if (r.detail) lines.push(`Detail: ${r.detail}`);
        lines.push('─'.repeat(72));
        lines.push('');
    }
    if (!rows.length) lines.push('(no changes recorded yet)');
    return lines.join('\n');
}

module.exports = {
    RETENTION_DAYS,
    HARD_CAP,
    nextDailyChangeId,
    recordChange,
    pruneChanges,
    markUndone,
    getRecentChanges,
    getChangeSummary,
    buildChangeExport,
};
