// core/revert.js
//
// Turns a ChangeLog row's stored inverse back into an op and applies it.
//
// ⚠️ Every row written BEFORE core/ops existed has inverse: null and is not revertible. That is correct and permanent -- do not backfill a guess. canRevert() says so in words, because otherwise every historical row looks like a bug.
//
// Every entity is routed through core/ops as of plan 2 Task 7 -- the ON_CORE set this file used to gate on, and handlers/manage/shared.js's in-memory registerUndo it existed alongside, are both gone.
const { getChange, markUndone } = require('../utils/changeStore');
const { commitSet } = require('./changeset');

function canRevert(row) {
    if (!row) return { ok: false, reason: 'That change no longer exists.' };
    if (row.undone) return { ok: false, reason: 'That change was already reverted.' };
    if (!row.inverse) {
        return { ok: false, reason: 'That change predates revert support, so there is nothing to undo it with.' };
    }
    return { ok: true };
}

async function revertChange(changeId, { actorId }) {
    const row = await getChange(changeId);
    const gate = canRevert(row);
    if (!gate.ok) return { ok: false, reason: gate.reason };

    const result = await commitSet([row.inverse], { actorId });
    if (!result.ok) return { ok: false, reason: result.error || 'The revert could not be applied.' };

    await markUndone(changeId);
    return { ok: true, changeId: result.changeIds[0] };
}

module.exports = { canRevert, revertChange };
