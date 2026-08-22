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

// Which Board column a changeset belongs in. 'blocked' is a REAL column stating why (spec §8.2), derived from the same gate the server enforces -- never a separate client-side guess that could disagree with what commit would actually do.
function columnFor(changeset) {
    if (changeset.state === 'committed') return null; // left the board once committed
    if (changeset.state === 'discarded') return null;
    if (changeset.state === 'draft') return 'draft';
    const gate = gateCommit({
        tier: changeset.tier, exportedAt: changeset.exportedAt,
        confirmText: changeset.confirmText, expectText: changeset.realm,
    });
    return gate.ok ? 'ready' : 'blocked';
}

// Why a changeset sits in Blocked -- the Board's card shows this, never just "blocked".
function blockedReason(changeset) {
    const gate = gateCommit({
        tier: changeset.tier, exportedAt: changeset.exportedAt,
        confirmText: changeset.confirmText, expectText: changeset.realm,
    });
    return gate.ok ? null : gate.reason;
}

function groupByColumn(changesets) {
    const cols = { draft: [], staged: [], blocked: [], ready: [] };
    for (const c of changesets) {
        const col = columnFor(c);
        if (col) cols[col].push(c);
    }
    return cols;
}

module.exports = { columnFor, blockedReason, groupByColumn };
