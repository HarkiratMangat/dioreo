// utils/changeStore.js The persistence + query layer behind the /manage DB-change audit log (models/ChangeLog.js). Modelled directly on utils/alertStore.js -- recordChange() is fire-and-forget and NEVER throws, same contract as recordAlert(), so a logging failure can never break the admin action that triggered it. Read helpers back the admin-only /audit command. Stage 4 of docs/superpowers/specs/ 2026-08-14-manage-slash-decomposition-design.md.
const ChangeLog = require('../models/ChangeLog');
const AlertCounter = require('../models/AlertCounter');


const RETENTION_DAYS = 180;  // delete changes older than this...
const HARD_CAP = 5000;       // ...AND never keep more than this many (whichever bites first)
const PRUNE_THROTTLE_MS = 60 * 60 * 1000; // prune at most once/hour, same reasoning as alertStore
let lastPruneAt = 0;



// dateKey/pad2/MONTHS retired 2026-08-23 10:56 EDT with the MMMDD-NN change id -- nothing here builds a date-shaped identifier any more.

// Namespaced under the SAME AlertCounter collection AlertLog already uses ("chg-" prefix on the _id), rather than a second counter model -- the two logs' daily sequences never collide because their keys never collide, and there's no second collection to create/maintain for one more counter.
//
// ⚠️ `session` is OPTIONAL and forwarded to the atomic $inc so a caller running inside a Mongo transaction (core/changeset.js's commitSet) doesn't mint an id outside it -- an id minted outside a transaction that then rolls back is an id that was never actually used, but the counter still moved, which is harmless (ids are just unique labels, not a dense sequence) but worth being deliberate about since core/'s whole contract is "nothing escapes the transaction".
async function nextDailyChangeId(date = new Date(), session = undefined) {
    // 🔴 A GLOBAL SEQUENCE, NOT `MMMDD-NN`. Harkirat, 2026-08-23 10:56 EDT: "change your internal ID system to be less confusing and easier to distinguish as an internal id" -- because `Aug22-28` renders inches from a real relative timestamp ("19 hours ago") and reads as a second, contradicting date. The day inside it was pure redundancy: every surface that shows a change id also shows the actual timestamp beside it. `#284` cannot be mistaken for a date, stays short, and remains ordered. ⚠️ Rows written before this keep their `Aug22-28` ids and still resolve -- every lookup, and the bot_revert_<id>/bot_changedetail_<id> custom_ids, treat the id as an opaque string. The mixed history is deliberate and must not be "migrated": rewriting stored ids would break the custom_ids of any panel a user still has open, to correct nothing. AlertLog is UNAFFECTED and still uses MMMDD-NN -- /bot analytics' own alert explainer documents that format, and alerts are read in daily batches where the date prefix genuinely helps.
    const doc = await AlertCounter.findOneAndUpdate(
        { _id: 'chg-seq' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after', session }
    );
    return `#${doc.seq}`;
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
            inverse: fields.inverse ?? null,
            createdAt: now,
        });
        pruneChanges(); // fire-and-forget; own throttle + swallow
    })().catch((err) => { console.error('Failed to record /manage change (non-fatal):', err); });
}

// Transactional counterpart to recordChange(), for core/changeset.js's commitSet(). Unlike recordChange() this is NOT fire-and-forget: it AWAITS, it CAN THROW, and it RETURNS the created row -- because commitSet runs inside a real Mongo transaction where an audit write that silently failed (or ran outside the transaction and survived a rollback) would violate the "apply() always audits, unconditionally" invariant the whole operation core is built on.
async function recordChangeIn(session, fields) {
    const now = new Date();
    const changeId = await nextDailyChangeId(now, session);
    const [row] = await ChangeLog.create([{
        changeId, actorId: fields.actorId, page: fields.page, action: fields.action,
        model: fields.model, target: fields.target, summary: fields.summary, detail: fields.detail,
        inverse: fields.inverse ?? null, createdAt: now,
    }], { session });
    return row;
}

// One row by its human-referenceable id, for core/revert.js -- fetching a single row rather than a page of them.
async function getChange(changeId) {
    return await ChangeLog.findOne({ changeId }).lean();
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


// Every LATER change against the same record. Reverting an edit writes old values back over whatever came after it, so a panel offering a revert has to be able to say "two other changes have touched this since" -- silently clobbering a later edit is the one genuinely destructive outcome this whole surface can cause. Lives here rather than being queried from commands/bot.js: a ChangeLog read belongs behind the store, and reaching around an exported surface for one query is how a second, drifting access path starts.
async function getLaterChangesTo({ page, target, after, excludeChangeId }) {
    if (!page || !target || !after) return [];
    return ChangeLog.find({
        page, target, createdAt: { $gt: after },
        ...(excludeChangeId ? { changeId: { $ne: excludeChangeId } } : {}),
    }).sort({ createdAt: 1 }).limit(10).lean();
}

module.exports = {
    RETENTION_DAYS,
    HARD_CAP,
    nextDailyChangeId,
    recordChange,
    recordChangeIn,
    getChange,
    pruneChanges,
    markUndone,
    getRecentChanges,
    getLaterChangesTo,
    getChangeSummary,
    buildChangeExport,
};
