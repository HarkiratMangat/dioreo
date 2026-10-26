---
kind: record
status: frozen
---

# Pins batch 2 — Session 2 checkpoint (updated 2026-09-15 00:35 EDT)

Branch `feat/portal-pins2-manifests`, 3 commits on `8c5e8a90`, unpushed. Head `c7973c25`.

## Done and measured
| Step | Commit | Evidence |
|---|---|---|
| §5.0 Steps 1–6, 8 | plan ticks | preconditions pass; all four pinned symptoms reproduced |
| Tokens (§10.4 ②) | `5bb2052d`, `af8abe76` | 9 `--sl-*` hues, `--box-inset`, `--tier-best`, `--rad-box` |
| Step 9b dev write | `5bb2052d` | 130 builds written = 130 images with slot metadata; BAL-27 Build 1 correct |
| Step 9 | `af8abe76` | tools row, History, Broadcast manifest, HeadsUp, boxed remove button; states 0, orphans 0, geometry re-recorded |
| Step 10 G4 | `c7973c25` | 68 groups / 125 rows; row, header and action centres within 1px; action and fold edges on the 1243 padding line; code field 144px; 0 truncated; group checkbox selects one weapon only; Collapse all 125 → 0 → 125 |
| Step 10 G6 (Discord side) | `c7973c25` | modal field `setMaxLength(47)`, name part refused over 32; handlerRouting test exit 0 |
| Step 10 G3 | `c7973c25` | card text box, end box and actions share right edge 898; both lifespan bars 463px; "2 of 10 slots used" |
| Step 10 G2 | `c7973c25` | Include · Admin traffic chip toggles `?admin=1` |
| Step 10 G1 | `c7973c25` | 61 scripted replacements (heredoc edits, not distinct call sites) across 9 files; dead `.chint`, `.racknote`, queue and checkbox rules removed; orphans 0 |

## Agent D — paused at a checkpoint (2026-09-15 00:40 EDT)
Head `b9e4ffe6` on `feat/pins2-d-drawer`. Done: brief items 1, 1b, 1c, 1d and item 3's CSS for them. **Not started: item 2, the whole Broadcast composer.** Gates it reports at exit 0: node --check, reverse-orphans, states, armorySlotFill (new, with the cross-weapon falsifier), portalArmoryBulk, loadoutOps, portalRealms, portalUi, portalRoutes, portalOpsReach, portalOpWords; full `npm test` not run. It found two bugs by opening the drawer: `accept="image/*"` read as a comment opener by buildPortal's stripper and deleted the file's tail, and a toolbar div wrapping the preview grid. Resume it with one message; its remaining work is item 2, the live checks against board 1, and `npm test`.

## Next, in order, when the session resumes
1. Compare per §10.2 (four states) — board-1 computed values already gathered; also the Season meta → ruler ends (G1 row season.js:1300).
2. Re-record geometry for `c7973c25`; `portalStates --ci`; captures of Armory, Broadcast queue, Analytics, Access, Review, Season.
3. Step 11: C1–C14 on Armory, Broadcast, History; the staged-for-deletion Armory row captured for Harkirat.
4. Step 12: integrate D; then composer.js G1 row 18 and the composer honouring `initial` (Broadcast Edit / Dates and repeats open it).
5. Step 13 + §13: records, `npm test`, docs:audit; push / PR / merge each need approval restated.
6. Waiting on Harkirat: prod slot write (Step 9b) and the FSS Hurricane name write (G6).

## Not done and why
- G1 emoji "Sync" button: no portal route exists — chip only, ledger row + deferred item to file.
- G1 rows season.js:81/82 (already the row's second line), review.js:67 (already a warning box), analytics.js:516 (count already beside its chart): no change needed.
- G1 row season.js:834: the site no longer exists.

## Commit sweep, answered
- External trees and memory store: no file moved or renamed — not applicable.
- Generated site output: no site source changed.
- Hook self-tests: no hook touched.

## Staged row (2026-09-15 09:30 EDT)
`e73979a8`: /api/review ops carry `targetIds`; Armory rows a staged op targets get `.wg-r.staged` (dashed outline). Harness: 2 rows under .50 GS, capture `local/pins2/s2-after-armory-staged.png`. Cause of a false 0 on first try: the browser held a cached stub.js; a no-cache reload fixed it.
