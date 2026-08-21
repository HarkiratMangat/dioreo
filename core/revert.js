// core/revert.js
//
// Turns a ChangeLog row's stored inverse back into an op and applies it.
//
// ⚠️ Every row written BEFORE core/ops existed has inverse: null and is not revertible. That is correct and permanent -- do not backfill a guess. canRevert() says so in words, because otherwise every historical row looks like a bug.
const { getChange, markUndone } = require('../utils/changeStore');
const { commitSet } = require('./changeset');

// Entities routed through core/ops. Grows in plan 2 until it covers everything, then this whole distinction disappears along with handlers/manage/shared.js's registerUndo.
const ON_CORE = new Set(['draws']);

function canRevert(row) {
    if (!row) return { ok: false, reason: 'That change no longer exists.' };
    if (row.undone) return { ok: false, reason: 'That change was already reverted.' };
    if (!row.inverse) {
        // TWO different reasons produce inverse: null, and conflating them tells the user something false. A pre-core row is historical; an unmigrated entity's row is minutes old.
        return ON_CORE.has(row.page)
            ? { ok: false, reason: 'That change predates revert support, so there is nothing to undo it with.' }
            : { ok: false, reason: `Reverting ${row.page || 'this section'} is not yet supported -- use the Undo button on the original message.` };
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
