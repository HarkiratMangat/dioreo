---
kind: record
status: live
---

# Board 4 — the fix plan for his intake round (2026-09-21 19:14 EDT)

*The intake log is `2026-09-21-board4-intake.md` (verbatim, gate by gate). This file groups his items by CAUSE, gives each class its authority, its fix, and the check that proves it across the whole board. Nothing here is fixed per instance. It is the carrier if the session compacts mid-pass.*

## How the pass runs

1. **Instruments first**, because every earlier round failed on the same blind spot: I verified resting DOM only and never drove `:hover`, `:active` or `:focus-visible`. `docs/claude/pins2/instruments/b4states.cjs` (to write): puppeteer, **Cloudinary blocked so it sees what the artifact shows**, and for every interactive element in every section:
   - the states matrix: rest, hover, active, focus-visible and pressed+hover, via CDP `CSS.forcePseudoState`. It flags a hover identical to rest, a grey (low-chroma) hover on a hued control, and siblings in one control group whose radius or height differ.
   - a font-role census per section: family, size and weight per text role.
   - vertical centring per row: each cell's ink centre against the row's centre.
   - containment: a drawer inside its stage, a hover card inside its scroll area, text inside its box.

   Run it as a baseline, then after every class. **C4, C6 and C8 are "fine", so any change there is a regression.** Regenerate `board4-spec` and diff those three files.
2. **Class fixes** (below), each as one heredoc per file family, verified by the instrument across every instance, not the one element touched.
3. **Shell proposals** (K2) as live switches on Board 4. Publish once, and he rules header and footer in a popup.
4. **The C2 drawer rebuild** on the chosen shell, against board 1's G9, with the lineage table written first.
5. Final: instruments, spec regeneration, screenshots of every state, then ask before publishing.

Scope: CSS under `.b4`, and behaviour behind `window.B4_COLLECTIVE`, so Board 3-E stays as approved.

## The classes

| # | Class | His items | Authority | Fix |
|---|---|---|---|---|
| K1 | **Control-state contract**: every interactive family gets rest, hover, pressed, pressed+hover, focus and disabled in its OWN hue, and never a grey wash | C1-3, C2-2, C2-3, C3-2, C3-3, C5-1, C9-1 | The board-3 families: `.b3-fc` hue contract (`--fc`), `b3-btn2`/`go`/`dang`, `.mh-mode` | One table of families. Where it comes from: the grey wash is `app.css .seg button:hover{background:var(--hi)}` plus my round-1 `color-mix(--hi 75%)`. MP/DMZ tiles hover in their own mode hue. Segments brighten ink and lift the thumb border. Selection bar: Edit hovers `--staged`, Export hovers `--ok`, **hover only** (his ruling). MP/DMZ in C2 and C5 must be ONE rule |
| K2 | **Drawer shell**: header and footer | C2-1, C2-6, C2-7, C2-9, C7-9 | The Export picker's drawer, his reference for good: a title row with `‹ ×` nav, controls in the body, actions in context, no footer bar | Live options on the board, applied to all four drawers (New build, Bulk, Edit, Post) |
| K3 | **Form surface**: fields, dropdowns, labels, placeholders, the image box, badge toggles, tier segment | C2-4, C2-7, C7-10 | Board 1 G9 (`handoff-g9-g8.md`, `resolved-spec-full.md`, b4parity g9), with board-3 families where he ruled them | Write the C2 lineage table (element · board 1 · board 3 · his ruling · final), then one radius scale, one control-height scale and one type-role map. Seen on today's board: a native `<select>` beside a custom combobox, italic placeholders everywhere, a truncated placeholder ("Paste a link, or choose a f…"), an empty skeleton image box, a pink label-prefix block, and a centred "Pick a weapon…" orphan in the preview. **The board presents C2 EMPTY while board 1 is judged FILLED**, so add a Filled state |
| K4 | **Dynamic mesh** from content | C2-5, C2-10 | The Export picker's mesh (`--m1..--m4` ranked hues) | One `meshFor()`: Add takes the selected category, Bulk the parsed blocks' categories, Edit the edited builds, Post the announcement accent. Verify all four drawers |
| K5 | **Bulk list = the export file list**, and friendly | C2-11, C2-12, C2-13 | `.b3-xt-ln` export list | The same line classes and gutter; a visible grammar (ghost template lines, a line-type hint in the gutter), not a placeholder that disappears; board-chrome prefill scenarios (one build, several, a warning, an error, mixed MP/DMZ) |
| K6 | **Chip family reuse** | C2-14, C3-1, C7-3, C7-6, C7-7 | The selection bar's `.b3-sc` weapon chip; the Export picker's build tiles; board 2 G11's state tab | "Editing X" becomes `.b3-sc`, one per weapon with ×, and × removes that weapon's blocks. Compare build toggles use the picker's rounded-square build tiles, one shape. State tab radius from board 2. The staged tab keeps a solid left bar, dashed top/right/bottom, `--staged` hue and icon, new words. Filter chips take icons in place of dots |
| K7 | **Compare layout and type** | C3-4, C3-5, C3-6, C3-7 | Board 1 G10 plus board 3 type roles | Cards: 2→2, 3→3, 4→4, 5→3+2, 6→3+3; the card title names the build, not only the weapon. Regulate faces and weights to the board-3 role map. **Landing redesigned** |
| K8 | **Anchored floating card** | C5-2 | — | Export hover card: anchor to the file card (open → its line range, collapsed → its header), clamp to the stack's scroll area, and show the mode (MP/DMZ tile hue and label) |
| K9 | **Broadcast rows** | C7-1, C7-2, C7-4, C7-5 | Board 2 G11 (64px rows, the 44px delete, sort chevron) | Centre every cell on the row's centre line (measured). Delete button = Armory's `.wg-ib` delete. An active sort label brightens to `--ink`. A row click opens PostForm prefilled (edit); an Ended row opens it as **Post again**. No inline cell editing |
| K10 | **Selection bar** | C1-1, C1-2 | The Export file fold: **420ms `cubic-bezier(.32,.72,0,1)` on `flex-grow` alone** (handoff-3e §1 M3) | A layered float shadow. The list stays mounted and folds on the same curve; today it unmounts after a 240ms timeout, which is the choppiness |
| K11 | **Post drawer bugs** | C7-8 | — | `overflow-wrap:anywhere` in the preview; repeats pips wrap or cap with "+k"; the form column `minmax(0,1fr)` |
| K12 | **Board images on the artifact** | (my note, C3) | — | A designed fallback tile at the image's proportion when Cloudinary is unreachable; the instrument runs with Cloudinary blocked |

## Facts established before building (so they are not re-derived)

- `p10` (small text) is ruled **`state`** in `b3/state.js` DEFAULTS. The hint treatment for K3 hints comes from it; hint COPY stays Session 4's.
- Board 2 G11 ruled the staged tab as a **dashed outline** and the State filter chips **with colour dots** (13:06 EDT popup). His intake items C7-6 and C7-7 supersede both; the plan carries both rulings so the change is deliberate.
- The Ends default: board 1 drew "default · Sun Nov 15", and nothing rules how it is computed. K3 designs the field; the date rule stays his open question.
- Selection bar actions: Edit `.b3-btn2`, Export `.b3-btn2`, Stage deletion `.b3-btn2.dang`, Clear `.b3-btn2.quiet` (`b3/armory-parts.js` SelectionDock).

## Cost

Roughly 60–120 turns across `b4.css`, `b1.css`, `b3/drawer.js`, `b3/armory-parts.js`, `ui/armory.js` (Compare), `ui/broadcast.js` (PostForm, columns), `ui/manifest.js` (inline edit), the Export picker code, and `gates4/*`. One interim publish for the shell ruling.

## Progress — pass 1, 2026-09-21 19:27 EDT (local only, not published)

| Class | State | Evidence |
|---|---|---|
| K1 control states | **Built**: MP/DMZ rest and hover in their own hue (one rule for C2 and C5); design segments hover and press in the gate's hue, not grey; pressed+hover answers; C9 chip and views in Analytics' hue; drawer close and copy hover; the Armory Weapon sort hovers | `b4states` before (`states-baseline.md`) → after (`states-after1.md`): NONE on real controls 0 outside History's inert zero-count chips and row-level buttons; the remaining GREY are chips whose pressed grey board 2 ruled (All, Compare's weapon chip, left for K6) |
| K9 Broadcast rows | **Built**: every cell's cap centre within ±0.7px of the row's (was −0.6…+1.8, "No end" worst); the Armory's delete; icons on the State chips; the staged tab (solid left bar, dashed rest, `--staged`, Review mark, "Change staged"); active sort label to `--ink`; row click opens the editor, an Ended row opens **Post it again**; no inline cell edit | `board4-review/shots/shot-c7-*.png`; cap-centre method in `b4states` CENTRE |
| K11 post drawer bugs | **Built**: a long word wraps inside the preview; the side column stays 320px so it never overlays the form; repeats wrap | `shot-c7-long.png` |
| K10 selection bar | **Built**: float shadow; the list stays mounted and folds 0fr↔1fr on the Export file's curve; Edit hovers `--staged`, Export hovers `--ok` | `shot-c1-*.png` |
| K2 shell, K3 C2 form, K4 mesh, K5 bulk list, K6 chips (Editing X, Compare toggles), K7 Compare, K8 C5 hover card, K12 images | **Next** | — |

⚠️ A measuring lesson from this pass: the first cap-centre probe inserted an inline-block, which is blockified inside a flex tab and reported −4.4px that was not on screen; History looked broken and was not. The instrument now reads each text run's own range and the font's descent, and never mutates the DOM.
