---
kind: record
status: frozen
---

# Board 4 v12 — the critique, and what it fixed (2026-09-22 16:20 EDT)

His ask (16:01 EDT): nitpick every surface the v10 intake touched with design-critique, the impeccable verbs polish, onboard, distill, clarify, overdrive, layout, delight and animate, and sequential thinking; a larger redesign becomes a new fork option. Every state was opened on the local board with the chrome-devtools CLI (41 shots, then 3 re-shoot rounds), each shot read for faults before any fix. The shots are in `local/pins2-board-3/board4-review/v12crit/`. **Local only; v12 is still the published version.**

## Fixed, each as a class, each re-shot after the last edit

| # | Surface | Fault seen | Fix | File |
|---|---|---|---|---|
| 1 | Bulk A · Edit (results list) | With 3+ builds every card was squashed and its bottom rows cut (Image row, badge row, the gutter's end line) | `grid-auto-rows:max-content` on the list: cards take their height, the list scrolls | `local/pins2-board-3/redo/b4/bulk.css` |
| 2 | Bulk A · B · Edit (card chips) | The attachment row never wrapped: a third chip cut mid-word ("Crown-H", "ST", "PERK") | chips wrap; fade mask removed | `local/pins2-board-3/redo/b4/bulk.css` |
| 3 | Bulk C (legend) | The dashed "Name" chip was clipped to "Nam" | the legend chip never shrinks | `local/pins2-board-3/redo/b4/bulk.css` |
| 4 | Bulk editor | A long line (an image URL, a hint chip) stopped at a hard cut on the editor edge | the editor's last 28px fade | `local/pins2-board-3/redo/b4/bulk.css` |
| 5 | Bulk empty | "All 0" filter shown with nothing typed, beside "0 builds" (distill) | filters appear with the first block | `local/pins2-board-3/redo/b4/bulk.js` |
| 6 | Form C (blank) | The hero code placeholder cut at "gam" | the placeholder reads at 15px; the code keeps 21px | `local/pins2-board-3/redo/b4/form.css` |
| 7 | Form B (DMZ, blank) | "Required" wrapped under "Weapon" | label column 136px in B, rows and attachments on one value edge | `local/pins2-board-3/redo/b4/form.css` |
| 8 | Form B (image well) | "Stored image" broke onto two lines | the source switch spans its column, labels never wrap | `local/pins2-board-3/redo/b4/form.css` |
| 9 | Form C (image well) | Switch edge 30px short of the drop zone and key field | same rule: the switch spans its column in all three options | `local/pins2-board-3/redo/b4/form.css` |
| 10 | Form B (several builds) | Panel inside card inside drawer: three boxes deep | inside a card the sections drop their panel, keep hairlines | `local/pins2-board-3/redo/b4/form.css` |
| 11 | Form B (code row) | Copy button 8px right of every chevron (792 vs 784) | the row's −8px margin removed; measured 784 = 784 | `local/pins2-board-3/redo/b4/form.css` |
| 12 | Form, empty preview | "Pick a weapon…" floated 80px under the ghost card | the line sits on the ghost, as Compare's empty landing does | `local/pins2-board-3/redo/b4/form.css` |
| 13 | Form (several builds) | Card head said "Build 6" while the label said "Close range"; preview said "Build 1 of 3" beside the card's own "Build 6 of 6" | head reads "Build 6 · Close range"; preview reads "Previewing 1 of 3" | `local/pins2-board-3/redo/b4/form.js` |
| 14 | Form (animate, delight) | Pasting a code changed four fields with no sign that the code did it | each slot the code fills lights in slot order, 50ms apart, once; reduced motion keeps the resting green edge. Checked by computed `animation-name`/`delay`, not seen mid-frame | `local/pins2-board-3/redo/b4/form.css` |
| 15 | Compare A (column heads) | FFAR 1's heads sat 14px under BAL-27's (no badges, cell centred) | heads read from the top, under the id scope that set `middle`; all six at 342 | `local/pins2-board-3/redo/b4/compare.css` |
| 16 | Compare Empty B (shelf) | "Assault rifle" ran under "5 builds"; a first fix truncated it to "Assaul…" | the shelf uses the Armory's short category names (Assault, Marksman) and a tighter tile | `local/pins2-board-3/redo/b4/compare.js`, `local/pins2-board-3/redo/b4/compare.css` |
| 17 | Compare one build (clarify) | Placeholder "Search Sniper" | "Find another sniper" | `local/pins2-board-3/redo/b4/compare.js` |

Gates: `node --check` on the three JS files, `b4/bulkformat.test.mjs` (round trip holds, 4 broken writers caught), the impeccable detector on the three stylesheets (no findings). Console: one 404, the page's `favicon.ico`, nothing else.

## Seen and not changed, with the reason

| Surface | Observation | Why not changed now |
|---|---|---|
| Form, several builds | Stage is disabled with no reason beside the button (card 2 "Needs an attachment" is only in its head) | A footer reason line is a new element, not a craft fix; worth doing, needs his nod on wording |
| Form, blank MP | Five "Any slot" rows before a weapon is picked | Slot names depend on the weapon; collapsing them is a distill decision for him |
| Form and Bulk C preview | "No image on this build, so the card omits the gallery entirely" appears even when a key is set but nothing is uploaded | Copy change touches the preview card shared with the portal's `Card`; Session 5 |
| Bulk empty | The right column is one line of text over 600px of empty space | An empty-state ghost result is onboarding work (a new element) |
| Post drawer | Counter reads "5,888 of 6,000 left" with the text empty | Predates v11; the composer's own count |
| Drawer close | "× Close" shows its label in some states and not others | It is board 3's hover-reveal; the CLI browser's pointer may have been resting on it. Not confirmed as a defect |

## Overdrive — no new fork option

Checked each surface for a redesign the refinement could not reach. None found: every fault above was craft inside the option's own idea. The one authored moment the form earned is #14 (the code visibly assembling the build), applied to all three options.

## My read of the four forks (his pick)

| Fork | Would pick | Why |
|---|---|---|
| Form | C · Code first | The job (§3) says the code is primary for MP; C leads with it and #14 makes pasting visible. DMZ has no code, and C falls back to A's order there |
| Bulk | A · Ledger | With #1 and #2 the cards read whole beside their lines; B's margin cards stack chips in a 334px column; C repeats the preview the form already has |
| Table | B · Diff grid | Differences are the question; B fills exactly the differing cells, edge to edge |
| Empty | C · Command field | One field, six ranked weapons, one click; the shelf needs 12 tiles to say the same |

## Instruments that misled me this round

| Instrument | How it misled | Recipe |
|---|---|---|
| My "kill all animation" style before shots | The badges' shine parked over a letter: "B ST ASSAULT" looked like a defect | Shoot without it; it only belongs on a probe that measures layout |
| `scrollWidth > clientWidth` | "Marksman" was cut by 0.58px; both widths round to the same integer, so it reported no cut | Measure the text with a `Range` against the box's float width |

## Headroom (his side question)

The MCP tool takes text only. Image compression happens in the proxy (`docs/claude/2026-09-21-headroom-notes.md`: profile hr8790 on port 8790, `headroom wrap claude`), so it can be tried only in a session started through the proxy.
