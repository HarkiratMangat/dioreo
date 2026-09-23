---
kind: record
status: frozen
---

# Board 4 v14 — the nitpick round (2026-09-23 00:27 EDT)

His asks (2026-09-23 00:10–00:14 EDT): harshly nitpick the Bulk create panel; "you seem to have messed up the colors for the row's highlight glow" (the manifest rows); sweep the board for small bugs in buttons, hover and pressed states; harshly nitpick Form A (Instrument) of Add build, scroll included. Everything below is **local only** in the kit (commits `22259bd` → `0ac0554`); v13 is still the published board.

## Fixed, each at its class, each re-shot after the last edit

| # | Fault | Cause | Fix | File |
|---|---|---|---|---|
| 1 | History's and Broadcast's row glow read grey | Board 4 rewrote both from raw `--c` and dropped board 3's round-15D oklch lift; their hues sit near L .6 | every manifest row (Armory, Broadcast, History) glows in `--glo`, its hue lifted to at least L .72 | `local/pins2-board-3/redo/b4.css` |
| 2 | The build drawer changed height with its content: 860px for a form, 588px while typing a Bulk block | only `max-height` was set | the drawer keeps `min(84vh, 860px)` in every state | `local/pins2-board-3/redo/b4.css` |
| 3 | The form scrolled under the header's rule with a hard cut | a mask on the scroller would clip the header controls it carries | the header's lower edge lifts a shade once the form has scrolled 28px (a scroll-driven animation) | `local/pins2-board-3/redo/b4.css` |
| 4 | A wheel at the end of a drawer's scroll moved the board behind it | `overscroll-behavior:auto` | `contain` on every drawer scroller and textarea | `local/pins2-board-3/redo/b4.css` |
| 5 | The image tile stopped 35–97px short of its column | a fixed 16:10 tile beside a 150–207px column | the tile fills the well's height, never under 110px | `local/pins2-board-3/redo/b4/form.css` |
| 6 | "Next free key" sat under the word Key, not under the key field | the hint was a sibling of the key row | the hint renders in the key row's field column | `local/pins2-board-3/redo/b4/form.js`, `local/pins2-board-3/redo/b4/form.css` |
| 7 | "Discard this draft?" confirmed in success green | the confirm was called without `danger` | red, like every destructive confirm | `local/pins2-board-3/redo/b3/drawer.js` |
| 8 | The faded example's text ran half-cut above and below its line (form preview, Bulk empty) | the line lay on the example with no clearing | the example opens a clearing where the line sits; wider in the form | `local/pins2-board-3/redo/b4/classes.css` |
| 9 | Compare Table A: the badge dot hung at the end of the first line | the badge group wraps in a narrow head | the dot is dropped inside a column head | `local/pins2-board-3/redo/b4/compare.css` |

Checked after the last edit: drawer heights 860 in five states; key field and hint both at x 543; tile and column both 813–992; header lift 0 at the top and 1 at 140px; `overscroll-behavior: contain`; Discard is `btn dang`; the glows' computed first radial is the lifted hue. The flow test (`local/pins2-board-3/board4-review/r22.cjs`) passes with no FAIL. Shots: `local/pins2-board-3/board4-review/v14prep/v2/`, `local/pins2-board-3/board4-review/v14prep/fa/`.

## Seen and proposed, not changed (his to decide)

| Surface | Observation | Proposal |
|---|---|---|
| Bulk result card | the card has no hover and only its thin line-number rail jumps to the lines | the whole card jumps, with a hover ring in its own hue |
| Form A | its idea is labels above wells, but attachments and Key are label-left rows | one of the two, everywhere in A |
| Form A, B, C | unchecked badge and tier chips sit at 42% and read as disabled | a quieter rest that still reads as available |
| Bulk editor | a key line gets a hint chip; a link line gets none, while its card says Link | a Link chip on the link line |
| Header lift (#3) | my addition, made for his scroll note | keep or drop |

## Not checked

- Firefox and Safari (the CLI drives Chrome); a real wheel at a scroll end (the computed value was read, the chaining itself not felt)
- Hover states were forced by copying `:hover` rules onto a class, which misses a hover declared on an ancestor's `:hover`
