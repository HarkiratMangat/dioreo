// portal/ui/board.logic.js — CommonJS, imports nothing. Pure functions <Board> renders from.
//
// Board is the CHANGESET PIPELINE (spec F3 / §8.2), not a third content view -- its columns are pipeline stages (Draft -> Staged -> Blocked -> Ready), derived from a Changeset document's own state/tier/exportedAt, never assigned by hand.
//
// 🔴 Task 5's Files note says these three .logic.js files "import nothing" -- so gateCommit's logic is inlined here rather than required from portal/api/policy.js (this file must also load as a plain classic <script> in the browser, where require() does not exist). This is a deliberate, tiny duplication of a 4-line pure function, not the drift utils/manageActions.js's header warns against -- scripts/portalApi.test.js and scripts/portalUi.test.js both assert the identical tier-3 behaviour, so the two copies disagreeing would fail a test immediately, not silently.
function gateCommit({ tier, exportedAt, confirmText, expectText }) {
    if (tier < 3) return { ok: true };
    if (!exportedAt) return { ok: false, reason: 'This change must be exported before it can commit.' };
    if (confirmText !== expectText) return { ok: false, reason: 'Typed confirmation does not match. Type the exact name shown to confirm.' };
    return { ok: true };
}

// Which Board column a changeset belongs in. 'blocked' is a REAL column stating why (spec §8.2), derived from the same gate the server enforces -- never a separate client-side guess that could disagree with what commit would actually do. 🔴 CONFIRMATION TEXT IS NEVER KNOWN IN ADVANCE, so columnFor cannot depend on it -- an earlier draft of this function called gateCommit with `changeset.confirmText`, a field that does not exist anywhere until the moment a human actually types it into the Commit control, which meant no tier-3 changeset could EVER reach Ready (confirmText was always undefined). The typed confirmation is entered at the moment of committing (see board.js's Commit control) and verified SERVER-SIDE at that moment -- this function only classifies the structural half: has it been exported yet.
function columnFor(changeset) {
    if (changeset.state === 'committed') return null; // left the board once committed
    if (changeset.state === 'discarded') return null;
    if (changeset.state === 'draft') return 'draft';
    if (changeset.tier >= 3 && !changeset.exportedAt) return 'blocked';
    return 'ready';
}

// Why a changeset sits in Blocked -- the Board's card shows this, never just "blocked".
function blockedReason(changeset) {
    if (changeset.tier >= 3 && !changeset.exportedAt) return gateCommit({ tier: changeset.tier, exportedAt: null }).reason;
    return null;
}

function groupByColumn(changesets) {
    const cols = { draft: [], staged: [], blocked: [], ready: [] };
    for (const c of changesets) {
        const col = columnFor(c);
        if (col) cols[col].push(c);
    }
    return cols;
}

// Guarded: a classic <script> in a real browser has no `module` global, and an unguarded assignment throws ReferenceError mid-parse -- silently true here only because every function above already executed before this line ran. Found by actually loading this file in a browser rather than assuming the classic-script plan would just work.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { columnFor, blockedReason, groupByColumn };
}
