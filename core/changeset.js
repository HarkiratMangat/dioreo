// core/changeset.js
//
// A changeset is N ops that commit together or not at all.
//
// ⚠️ ALL-OR-NOTHING IS NOT A NICETY. The bot re-reads SeasonalData on every single interaction
// (commands/draws.js, calendar.js, patchnotes.js all call findOne(...).lean() per interaction), so
// a half-applied set is served to real users within seconds. That is why this uses a real Mongo
// transaction and not a best-effort loop.
const mongoose = require('mongoose');
const { resolveOp, actionForOpType } = require('./ops');
const { recordChangeIn } = require('../utils/changeStore');

// The registry key is `page:id`, so a change's page is knowable from its op. Falls back to the op's
// own namespace rather than a literal, so a not-yet-registered op still records truthfully.
function pageForOp(type) {
    const actions = actionForOpType(type);
    return actions?.[0]?.split(':')[0] ?? type.split('.')[0];
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
        else normalized.push(r.normalized || op);
    });
    return { ok: failures.length === 0, failures, normalized, tier };
}

function previewSet(ops, live) {
    return ops.map((op, index) => ({ index, ...resolveOp(op.type).preview(op, live) }));
}

async function commitSet(ops, { actorId }) {
    const v = validateSet(ops);
    if (!v.ok) return { ok: false, failures: v.failures };

    const session = await mongoose.startSession();
    const changeIds = [];
    let failedAt = null;
    try {
        await session.withTransaction(async () => {
            // invert() may return an ARRAY, so an inverse changeset is flattened before applying.
            for (const [index, op] of v.normalized.flat().entries()) {
                const impl = resolveOp(op.type);
                const res = await impl.apply(op, { session, actorId });
                if (!res.ok) { failedAt = { index, reason: res.reason }; throw new Error(`op ${index} failed: ${res.reason}`); }
                // apply() is the ONLY writer and it ALWAYS audits — the caller cannot opt out.
                // 🔴 `page` is DERIVED FROM THE OP TYPE, never hardcoded. An earlier draft wrote
                // `page: 'draws'` here, which would have stamped every calendar, loadout, patchnote,
                // season and announcement row as `draws` the moment plan 2 lands — breaking
                // getRecentChanges({filterPage}) in /bot analytics AND core/revert.js's
                // ON_CORE.has(row.page) branch, which is the whole mechanism this design added.
                const row = await recordChangeIn(session, {
                    ...res.change, actorId, page: pageForOp(op.type),
                    inverse: impl.invert({ ...res.change, applied: res.applied })
                });
                changeIds.push(row.changeId);
            }
        });
    } catch (e) {
        return { ok: false, failedAt, error: e.message };
    } finally {
        await session.endSession();
    }
    return { ok: true, changeIds };
}

module.exports = { validateSet, previewSet, commitSet };
