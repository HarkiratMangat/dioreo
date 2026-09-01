// scripts/lib/portalStyleRank.cjs — how portalAudit's ④ STYLE section orders its rows.
//
// 🔴 IT USED TO ORDER BY ×COUNT, AND THAT IS BACKWARDS FOR CONSEQUENCE. On 2026-09-01 the Armory manifest's rows painted
// --raised where the design paints --desk, on every row of a 125-row table, because one paragraph between two panels
// broke `.panel + .panel`. ④ REPORTED IT — `section.panel backgroundColor: rgba(0,0,0,0) → rgb(23,30,36)`, the exact
// value — and it sorted ~140th of 149 as a `× 1`, buried under a hundred-odd `×125` leaf-cell width deltas. It was read
// past twice, and then a commit message claimed no instrument could have found it, which was false.
//
// The instrument was not blind; its ORDERING was. A difference on a CONTAINER is rendered through everything inside it,
// and a difference on a leaf is rendered through one cell. `reach` is that number.
//
// ⚠️ THIS MAKES THE CONSEQUENTIAL ROW SORT FIRST. It cannot make anyone read it, and no ordering can. It is a lens on the
// same data, not a new check — which is the point: the miss here did not need a fifth instrument, it needed the fourth
// one read correctly.
// ⚠️ AND REACH IS NOT IMPORTANCE. A tall wrapper scores high because it contains a lot, not because it matters a lot;
// `×n` is still printed beside it because "how many places" and "how much of the page" are different questions and a
// reader needs both.

// One element's contribution: itself, plus everything rendered inside it.
function reachOf(node) { return 1 + (node && node.kids ? node.kids : 0); }

// Descending by reach. Ties break on ×count so a repeated difference still leads an equally-deep one-off.
function byReach(a, b) { return (b.radius - a.radius) || (b.n - a.n); }

module.exports = { reachOf, byReach };
