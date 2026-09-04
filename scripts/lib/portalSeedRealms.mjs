// scripts/lib/portalSeedRealms.mjs
//
// 🔴 THE REALMS WHOSE TWO SIDES HOLD DIFFERENT DATA UNLESS THE MOCKUP IS SEEDED. The staged-ops store is
// `sessionStorage` and every instrument clears it on load, while the portal harness synthesises four
// changesets — so any page carrying a staged surface compares an EMPTY mockup against a POPULATED one and
// returns well-formed numbers for a comparison nobody meant to make. Review was measured that way for its
// whole life (4.7% unseeded against 0.5% seeded) and Home for the first nine runs of Part 6b (78px apart
// unseeded, identical heights seeded).
//
// ⚠️ IT IS ONE LIST BECAUSE IT WAS FIVE. Part 6b added `home` by hand-editing the same guard in
// portalAudit, portalDiff, portalConverge, portalInventory and portalProbe — five copies of one fact, with
// nothing making them agree, so a sixth realm growing a staged surface needs five edits and a drifted copy
// fails SILENTLY by measuring one realm unseeded. Add a realm here and every instrument learns it at once.
export const SEED_REALMS = ['review', 'home'];
