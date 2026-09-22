---
kind: record
status: frozen
---

# Board 4 v12 — the critique, and what it fixed (2026-09-22 16:20 EDT)

His ask (16:01 EDT): nitpick every surface the v10 intake touched with design-critique, the impeccable verbs polish, onboard, distill, clarify, overdrive, layout, delight and animate, and sequential thinking; a larger redesign becomes a new fork option. Every state was opened on the local board with the chrome-devtools CLI (41 shots, then 3 re-shoot rounds), each shot read for faults before any fix. The shots are in `local/pins2-board-3/board4-review/v12crit/`. **Published as Version 13 at 2026-09-22 17:10 EDT on his yes (popup, 16:41 EDT), with round two below; 8 changed kit files plus board4.html.**

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

Gates: `node --check` on the three JS files, `local/pins2-board-3/redo/b4/bulkformat.test.mjs` (round trip holds, 4 broken writers caught), the impeccable detector on the three stylesheets (no findings). Console: one 404, the page's `favicon.ico`, nothing else.

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

## Round two — his "are you sure?", the three he picked, and more (2026-09-22 16:41 EDT)

He answered the publish question with *are you sure?* and asked for the three open items plus anything else that improves the experience. Each addition below was USED on the local board with the chrome-devtools CLI (clicked, typed, pasted, keyed), not only rendered.

| # | Addition | Why it is there | How it was checked | File |
|---|---|---|---|---|
| 18 | A disabled Stage names its reason ("Pick a weapon to stage", "Card 2 needs an attachment · 1 more"), and the reason is a button that jumps to the blocking field and pulses it once | A disabled primary with no reason was the one dead end in the form | clicked: focus landed on the weapon field, pulse class present, the page itself did not move (scroll delta 0) | `local/pins2-board-3/redo/b3/drawer.js`, `local/pins2-board-3/redo/b4/form.js`, `local/pins2-board-3/redo/b4/classes.css` |
| 19 | ⌘↵ stages from anywhere in the drawer; a blocked Stage jumps to its reason instead. The Stage button carries the hint | Mastery for a man who adds builds in sets. The handler reads a ref, never a mount-time closure (the Escape bug) | pressed Meta+Enter on a filled card: staged, drawer closed, toast "Staged · BAL-27" | `local/pins2-board-3/redo/b3/drawer.js` |
| 20 | A screenshot on the clipboard pastes into the build being edited from anywhere in the drawer (⌘V hint in the drop row); the preview card shows it | §3's job starts with "a screenshot just taken" | a real paste event with an image file: file row "Screenshot.png · 2 KB", the well and the Discord preview both show it | `local/pins2-board-3/redo/b4/form.js` |
| 21 | Before a code names the slots, attachment rows appear one at a time | Five identical "Any slot" rows | blank MP form: 1 row; filled: all 5 | `local/pins2-board-3/redo/b4/form.js` |
| 22 | Bulk's empty results show the guide's example as a faded result card with the line on it (one class, `.b4-overline`, shared with the form's empty preview) | 600px of dead column | rendered empty in A | `local/pins2-board-3/redo/b4/bulk.js`, `local/pins2-board-3/redo/b4/bulk.css`, `local/pins2-board-3/redo/b4/classes.css` |
| 23 | A result card arrives with a 240ms rise when its block first reads; reduced motion removes it | Typing visibly produces a build | computed animation present | `local/pins2-board-3/redo/b4/bulk.css` |
| 24 | Bulk says which blocks will not stage ("Lines 9–11 won't be staged · can't be read"), never counting the block still being typed | Stage said "Stage this MP build" beside a block it was about to skip | can't-read, duplicate and typing states opened | `local/pins2-board-3/redo/b3/drawer.js` |
| 25 | A half-typed weapon ("ki") no longer builds a card called "ki"; the ghost stays with "“ki” isn't in the Armory yet…" | The preview treated a search query as a weapon | typed "ki" and "Gauge" into the weapon picker | `local/pins2-board-3/redo/b4/form.js` |

Found by the same sweep and fixed:

| Fault | Fix | File |
|---|---|---|
| **C2's gate header**: 13 state buttons took the row, the title's column was 0px and its sentence ran down the page one word per line (on the published v12 too) | a switch with 8+ states takes its own full-width row under the title, buttons never wrap (its sliding thumb assumes one row); thumb measured on the last state | `local/pins2-board-3/redo/b4/classes.css` |
| Bulk B: labels cut beside "Being typed" | in the margin a label takes its own line | `local/pins2-board-3/redo/b4/bulk.css` |
| Bulk B: with wrapped chips the last margin note sat 8px under Cancel/Stage at full scroll | the notes' floor adds the footer's height; measured clear (739 vs 803) | `local/pins2-board-3/redo/b4/bulk.js` |

The sweep itself: a text-range cut probe over every form (A/B/C × 4 states), bulk (A/B/C × 9 states) and Compare (3 tables × 3 states, 3 empties × 2) state. Every remaining hit is a known false positive: the visually hidden drawer title, screen-reader-only text, and the badges' own volt layer. The flow test (`local/pins2-board-3/redo/../board4-review/r22.cjs`, existing) passes 35 of 35 after the last edit; the state instrument flags only the known (Close's keyboard-only focus rule, the badge layer). The weapon picker was opened by keyboard, typed into, and closed with Escape without closing the drawer.

**Not checked:** Firefox and Safari (the CLI drives Chrome); a real clipboard (the paste was a synthesised event with a real image file).

## Headroom (his side question)

The MCP tool takes text only. Image compression happens in the proxy (`docs/claude/2026-09-21-headroom-notes.md`: profile hr8790 on port 8790, `headroom wrap claude`), so it can be tried only in a session started through the proxy.
