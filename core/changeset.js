// core/changeset.js
//
// A changeset is N ops that commit together or not at all.
//
// ⚠️ ALL-OR-NOTHING IS NOT A NICETY. The bot re-reads SeasonalData on every single interaction (commands/draws.js, calendar.js, patchnotes.js all call findOne(...).lean() per interaction), so a half-applied set is served to real users within seconds. That is why this uses a real Mongo transaction and not a best-effort loop.
const mongoose = require('mongoose');
const { resolveOp, actionForOpType } = require('./ops');
const { recordChangeIn } = require('../utils/changeStore');

// The registry key is `page:id`, so a change's page is knowable from its op. Falls back to the op's own namespace rather than a literal, so a not-yet-registered op still records truthfully. 🔴 An op registered under MULTIPLE pages (loadouts_mp/loadouts_dmz share one op type) cannot just take index [0] -- that permanently mislabels every DMZ mutation's ChangeLog row as loadouts_mp, which breaks getRecentChanges({filterPage}) AND core/revert.js's per-page access check (utils/adminAccess.js's hasManagePageAccess) for the whole loadouts_dmz page. Resolve using the op's own mode when more than one candidate page exists.
function pageForOp(op) {
    const actions = actionForOpType(op.type);
    if (!actions?.length) return op.type.split('.')[0];
    if (actions.length > 1) {
        const mode = (op.target?.mode || op.payload?.mode || '').toLowerCase();
        const match = mode && actions.find(a => a.split(':')[0].endsWith(mode));
        if (match) return match.split(':')[0];
    }
    return actions[0].split(':')[0];
}

function validateSet(ops) {
    const failures = [];
    const normalized = [];
    let tier = 1;
    ops.forEach((op, index) => {
        let impl;
        try { impl = resolveOp(op.type); }
        catch (e) { failures.push({ index, errors: [e.message] }); return; }
        tier = Math.max(tier, impl.tier);
        const r = impl.validate(op);
        if (!r.ok) failures.push({ index, errors: r.errors });
        // 🔴 MERGED onto the original op, never substituted -- most entities' validate() (draw.add/edit, calendar.add/edit, loadout.add/edit, announcement.post/edit, all built on a shared validateOne/validateEvent/validateBuild/validatePost helper) deliberately returns ONLY `{ payload: {...} }` in `normalized`, relying on the caller to carry `type`/`target` forward from the original op. The old `r.normalized || op` was a straight OR, so any such partial result silently DISCARDED type/target -- previewSet and commitSet then both call resolveOp(op.type) on the result and throw "unknown op type \"undefined\"". Confirmed live against the real server: staging a draw.add validated fine (this bug is invisible to validateSet's own ok/failures result) and committing it 409'd with exactly that error. A handful of ops (season.*, loadout.edit/delete, most of patchnotes.js) already return the FULL op in `normalized`, so `{...op, ...r.normalized}` is a no-op for them -- spreading a full op over itself changes nothing, which is what keeps this change backward compatible.
        else normalized.push(r.normalized ? { ...op, ...r.normalized } : op);
    });
    return { ok: failures.length === 0, failures, normalized, tier };
}

// 🔴 MUST BE ASYNC AND AWAITED -- loadouts' and announcements' edit/delete preview() implementations are themselves async (they self-fetch via Loadout.findById/Announcement.findById rather than reading the `live` param). A prior, synchronous version of this function called impl.preview(...) without awaiting it: for those entities it silently spread a Promise's own (zero) enumerable properties into the result -- every preview came back as bare {index}, no before/after -- and worse, a preview() that THROWS before its first await (e.g. a malformed op with no `target`) produced a rejected promise nobody ever awaited or .catch()ed. An unhandled rejection crashes the whole Node process by default, bypassing portal/api/changesets.js's own try/catch around this call (that catch can only see a promise IT awaits) and portal/server.js's per-request crash net (which had already returned by the time the rejection fired asynchronously). Found live: staging a malformed loadout.edit/calendar.edit op took down the entire portal server, not just that request.
async function previewSet(ops, live) {
    // 🔴 NORMALIZED, not raw -- a bulk op's preview() reads fields (e.g. payload.parsed) that only exist after validate() normalizes the payload. Previewing a raw un-normalized op threw; falls back to the raw op only when validation itself fails, matching what apply() would do anyway.
    return Promise.all(ops.map(async (op, index) => {
        const impl = resolveOp(op.type);
        const v = impl.validate(op);
        return { index, ...(await impl.preview(v.normalized || op, live)) };
    }));
}

async function commitSet(ops, { actorId }) {
    // 🔴 FLATTEN BEFORE VALIDATING, not just before applying. A single-element `ops` array whose one element is ITSELF an array (any op's invert() may return an array -- draw.bulkDelete/purge and loadout.bulkAdd/bulkReplace all do) used to reach validateSet un-flattened: resolveOp(op.type) on an array has op.type === undefined, throws "unknown op type", and commitSet returned {ok:false} before the apply loop's own .flat() call ever ran -- so reverting any of those ops always failed. Found by the plan-1-range code review, confirmed by tracing revertChange's `commitSet([row.inverse], ...)` call against those invert() shapes.
    const v = validateSet(ops.flat());
    if (!v.ok) return { ok: false, failures: v.failures };

    const session = await mongoose.startSession();
    // 🔴 DECLARED HERE, RESET INSIDE THE RETRIED CALLBACK BELOW -- session.withTransaction() automatically re-invokes its callback from scratch on a TransientTransactionError (real, plausible contention here since SeasonalData is one shared global document), and without the reset a retry's pushes would land on top of the first, aborted attempt's stray entries instead of replacing them.
    let changeIds = [];
    // 🔴 SURFACED FOR CALLERS, not just for the audit log. A bulk op's apply() can carry warnings a handler needs to show the user (skipped items, reused thumbnails) — recordChangeIn already stores res.change.detail, but a Discord confirmation message needs res.applied directly, and nothing was returning it. Found during plan 1 Task 6 integration.
    let results = [];
    let failedAt = null;
    try {
        await session.withTransaction(async () => {
            changeIds = [];
            results = [];
            // invert() may return an ARRAY, so an inverse changeset is flattened before applying (the ops.flat() above already covers the outer `ops` array itself; this covers a normalized entry still nested one level).
            for (const [index, op] of v.normalized.flat().entries()) {
                const impl = resolveOp(op.type);
                const res = await impl.apply(op, { session, actorId });
                if (!res.ok) { failedAt = { index, reason: res.reason }; throw new Error(`op ${index} failed: ${res.reason}`); }
                // apply() is the ONLY writer and it ALWAYS audits — the caller cannot opt out. 🔴 `page` is DERIVED FROM THE OP TYPE, never hardcoded. An earlier draft wrote `page: 'draws'` here, which would have stamped every calendar, loadout, patchnote, season and announcement row as `draws` the moment plan 2 lands — breaking getRecentChanges({filterPage}) in /bot analytics AND core/revert.js's ON_CORE.has(row.page) branch, which is the whole mechanism this design added.
                const row = await recordChangeIn(session, {
                    ...res.change, actorId, page: pageForOp(op),
                    inverse: impl.invert({ ...res.change, applied: res.applied })
                });
                changeIds.push(row.changeId);
                results.push({ index, change: res.change, applied: res.applied });
            }
        });
    } catch (e) {
        return { ok: false, failedAt, error: e.message };
    } finally {
        await session.endSession();
    }
    return { ok: true, changeIds, results };
}

module.exports = { validateSet, previewSet, commitSet, pageForOp };
