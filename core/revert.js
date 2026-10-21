// core/revert.js
//
// Turns a ChangeLog row's stored inverse back into an op and applies it.
//
// ⚠️ Every row written BEFORE core/ops existed has inverse: null and is not revertible. That is correct and permanent -- do not backfill a guess. canRevert() says so in words, because otherwise every historical row looks like a bug.
//
// Every entity is routed through core/ops as of plan 2 Task 7 -- the ON_CORE set this file used to gate on, and handlers/manage/shared.js's in-memory registerUndo it existed alongside, are both gone.
const { getChange, claimUndo, releaseUndo } = require('../utils/changeStore');
const { commitSet } = require('./changeset');

function canRevert(row) {
    if (!row) return { ok: false, reason: 'That change no longer exists.' };
    if (row.undone) return { ok: false, reason: 'That change was already reverted.' };
    if (!row.inverse) {
        return { ok: false, reason: 'That change predates revert support, so there is nothing to undo it with.' };
    }
    return { ok: true };
}

async function revertChange(changeId, { actorId, source = 'discord' }) {
    const row = await getChange(changeId);
    const gate = canRevert(row);
    if (!gate.ok) return { ok: false, reason: gate.reason };

    // Claim BEFORE applying, so a second concurrent Undo of the same change loses here instead of applying the inverse again (see utils/changeStore.js claimUndo). Any failure below hands the claim back.
    if (!(await claimUndo(changeId))) return { ok: false, reason: 'That change was already reverted.' };

    // revertOf: the Undo rule (destructive on the change's page) gates this inside commitSet, not the inverse op's own tier.
    let result;
    try {
        result = await commitSet([row.inverse], { actorId, source, revertOf: row });
    } catch (err) {
        await releaseUndo(changeId);
        throw err;
    }
    if (!result.ok) {
        await releaseUndo(changeId);
        return { ok: false, reason: result.error || 'The revert could not be applied.' };
    }
    return { ok: true, changeId: result.changeIds[0] };
}

module.exports = { canRevert, revertChange };
