---
kind: reference
status: live
---

# Lineage — board-3 values against the board-2 designs they descend from

*Generated 2026-09-21T15:13:13.659Z by `lineage.cjs`. Read [`FINAL.md`](FINAL.md) first; this is its appendix. Session 2's commits on the portal stylesheets: 10.*

## M1 · the Armory manifest ← board 2 · G4

31 board-3 signatures paired with a board-2 element by class (the same class, the alias table in `lineage.cjs`, else `wg-x` ↔ `pb-x`). **68 property differences.** Not paired by name — compare these by eye, or through `../2026-09-14-pins2-board-2/port-g4-g3-g11.md`: `wg-cb` `ic-fold`.

| Board 3 element | Board 2 element | Property | Board 2 | Board 3 | Board-3 value from | Kind | Ships |
|---|---|---|---|---|---|---|---|
| `div.mt-r2` | `div.pb-t2` | display | `flex` | `grid` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.mt-r2` | `div.pb-t2` | column-gap | `10px` | `16px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.mt-r2` | `div.pb-t2` | row-gap | `10px` | `8px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.mt-grp[role=group]` | `span.pb-grp` | column-gap | `8px` | `3px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.mt-grp[role=group]` | `span.pb-grp` | row-gap | `8px` | `3px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.mt-grp[role=group]` | `span.pb-grp` | margin-left | `6px` | `0px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.wg-heads` | `div.pb-ghead.pb-heads` | grid-template-columns | `32px 938.547px 113.453px` | `32px 834.547px 111.453px` | PORT | STAGE | gate width — not a design value |
| `div.wg-heads` | `div.pb-ghead.pb-heads` | min-height | `44px` | `48px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.wg-heads` | `div.pb-ghead.pb-heads` | padding-left | `16px` | `20px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.wg-heads` | `div.pb-ghead.pb-heads` | font-size | `9.5px` | `10.5px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.wg-heads` | `div.pb-ghead.pb-heads` | font-weight | `600` | `700` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.wg-heads` | `div.pb-ghead.pb-heads` | line-height | `9.5px` | `10.5px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.wg-heads` | `div.pb-ghead.pb-heads` | letter-spacing | `1.33px` | `1.26px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.wg-heads` | `div.pb-ghead.pb-heads` | color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `button.wg-sort` | `button.pb-sort` | display | `flex` | `inline-flex` | PORT | DESIGN | **board 2** — the port lost it |
| `button.wg-sort` | `button.pb-sort` | min-height | `44px` | `48px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `button.wg-sort` | `button.pb-sort` | box-sizing | `border-box` | `content-box` | OLDER | GENERIC | board 2 did not style it — not a design value |
| `button.wg-sort` | `button.pb-sort` | font-size | `9.5px` | `10.5px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `button.wg-sort` | `button.pb-sort` | font-weight | `600` | `700` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `button.wg-sort` | `button.pb-sort` | line-height | `9.5px` | `10.5px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `button.wg-sort` | `button.pb-sort` | letter-spacing | `1.33px` | `1.26px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `button.wg-sort` | `button.pb-sort` | text-align | `center` | `start` | UA | UA | browser default on one side — check on the page |
| `div.wg-h` | `div.pb-gh` | grid-template-columns | `32px 294.688px 710.312px 39px` | `32px 407.375px 495.625px 39px` | PORT | STAGE | gate width — not a design value |
| `div.wg-h` | `div.pb-gh` | background-image | `linear-gradient(90deg, color(srgb 0.2431` | `linear-gradient(90deg, color(srgb 1 0.23` | PORT | HUE | a different row's colour — compare the same weapon |
| `button.wg-fbtn.wg-ib` | `button.pb-fbtn` | min-height | `auto` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `button.wg-fbtn.wg-ib` | `button.pb-fbtn` | padding-top | `1px` | `0px` | BOARD3 | GENERIC | board 3 changed it — **board 3** |
| `button.wg-fbtn.wg-ib` | `button.pb-fbtn` | padding-right | `6px` | `12px` | BOARD3 | GENERIC | board 3 changed it — **board 3** |
| `button.wg-fbtn.wg-ib` | `button.pb-fbtn` | padding-bottom | `1px` | `0px` | BOARD3 | GENERIC | board 3 changed it — **board 3** |
| `button.wg-fbtn.wg-ib` | `button.pb-fbtn` | padding-left | `6px` | `12px` | BOARD3 | GENERIC | board 3 changed it — **board 3** |
| `button.wg-fbtn.wg-ib` | `button.pb-fbtn` | font-size | `13px` | `12px` | BOARD3 | GENERIC | board 3 changed it — **board 3** |
| `button.wg-fbtn.wg-ib` | `button.pb-fbtn` | font-weight | `400` | `600` | BOARD3 | GENERIC | board 3 changed it — **board 3** |
| `button.wg-fbtn.wg-ib` | `button.pb-fbtn` | line-height | `19.5px` | `12px` | BOARD3 | GENERIC | board 3 changed it — **board 3** |
| `div.wg-r` | `div.pb-rb` | grid-template-columns | `32px 28px 707px 28px 144px 113px` | `32px 28px 605px 28px 144px 113px` | PORT | STAGE | gate width — not a design value |
| `div.wg-r` | `div.pb-rb` | min-height | `52px` | `58px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.wg-at` | `span.pb-at` | background-color | `rgba(0, 0, 0, 0)` | `color(srgb 0.0951373 0.111059 0.123059)` | BOARD3 | HUE | board 3 changed it — **board 3** |
| `span.wg-at` | `span.pb-at` | background-image | `linear-gradient(color(srgb 0.0778039 0.0` | `none` | BOARD3 | HUE | board 3 changed it — **board 3** |
| `span.wg-at` | `span.pb-at` | box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset, c` | `color(srgb 1 0.439216 0.341176 / 0.46) 0` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `button.wg-code` | `button.pb-igw` | text-align | `center` | `start` | UA | UA | browser default on one side — check on the page |
| `button.wg-code` | `button.pb-igw` | cursor | `copy` | `pointer` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.wg-ig` | `span.pb-ig` | box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | `none` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.wg-ig` | `span.pb-ig` | text-align | `center` | `start` | UA | UA | browser default on one side — check on the page |
| `span.wg-ig` | `span.pb-ig` | cursor | `copy` | `pointer` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.wg-igf` | `span.pb-igf` | box-shadow | `rgba(0, 0, 0, 0.45) 0px 2px 4px 0px inse` | `rgba(0, 0, 0, 0.45) 0px 3px 4px -2px ins` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.wg-igf` | `span.pb-igf` | text-align | `center` | `start` | UA | UA | browser default on one side — check on the page |
| `span.wg-igf` | `span.pb-igf` | cursor | `copy` | `pointer` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.wg-ct` | `span.pb-ct` | text-align | `center` | `start` | UA | UA | browser default on one side — check on the page |
| `span.wg-ct` | `span.pb-ct` | cursor | `copy` | `pointer` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.wg-igb` | `span.pb-igb` | box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | `none` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.wg-igb` | `span.pb-igb` | text-align | `center` | `start` | UA | UA | browser default on one side — check on the page |
| `span.wg-igb` | `span.pb-igb` | cursor | `copy` | `pointer` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `button.wg-ib` | `button.pb-ib` | min-height | `auto` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `button.wg-ib` | `button.pb-ib` | padding-top | `1px` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `button.wg-ib` | `button.pb-ib` | padding-right | `6px` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `button.wg-ib` | `button.pb-ib` | padding-bottom | `1px` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `button.wg-ib` | `button.pb-ib` | padding-left | `6px` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `button.wg-del.wg-ib` | `button.pb-del.pb-ib` | min-height | `auto` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `button.wg-del.wg-ib` | `button.pb-del.pb-ib` | padding-top | `1px` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `button.wg-del.wg-ib` | `button.pb-del.pb-ib` | padding-right | `6px` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `button.wg-del.wg-ib` | `button.pb-del.pb-ib` | padding-bottom | `1px` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `button.wg-del.wg-ib` | `button.pb-del.pb-ib` | padding-left | `6px` | `0px` | PORT | GENERIC | board 2 did not style it — not a design value |
| `div.bad.wg-r` | `div.pb-bad.pb-rb` | grid-template-columns | `32px 28px 707px 28px 144px 113px` | `32px 28px 605px 28px 144px 113px` | PORT | STAGE | gate width — not a design value |
| `div.bad.wg-r` | `div.pb-bad.pb-rb` | min-height | `52px` | `58px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.nocode.wg-at` | `span.pb-at` | background-color | `rgba(0, 0, 0, 0)` | `color(srgb 0.100549 0.084 0.0825882)` | BOARD3 | HUE | board 3 changed it — **board 3** |
| `span.nocode.wg-at` | `span.pb-at` | background-image | `linear-gradient(color(srgb 0.0778039 0.0` | `repeating-linear-gradient(-45deg, color(` | BOARD3 | HUE | board 3 changed it — **board 3** |
| `span.nocode.wg-at` | `span.pb-at` | box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset, c` | `none` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.nocode.wg-at` | `span.pb-at` | color | `rgb(232, 237, 241)` | `rgb(255, 158, 114)` | BOARD3 | HUE | board 3 changed it — **board 3** |
| `span.bad.wg-ct` | `span.bad.pb-ct` | text-align | `center` | `start` | UA | UA | browser default on one side — check on the page |
| `span.bad.wg-ct` | `span.bad.pb-ct` | cursor | `copy` | `pointer` | BOARD3 | DESIGN | board 3 changed it — **board 3** |

## H1 · the History manifest ← board 2 · G11 and the shared tools row

3 board-3 signatures paired with a board-2 element by class (the same class, the alias table in `lineage.cjs`, else `wg-x` ↔ `pb-x`). **8 property differences.** Not paired by name — compare these by eye, or through `../2026-09-14-pins2-board-2/port-g4-g3-g11.md`: `st-a` `has-ent` `st-z` `st-m`.

| Board 3 element | Board 2 element | Property | Board 2 | Board 3 | Board-3 value from | Kind | Ships |
|---|---|---|---|---|---|---|---|
| `div.b3-hi-tools.mtools` | `div.pb-tools` | row-gap | `12px` | `16px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.b3-hi-tools.mtools` | `div.pb-tools` | padding-top | `14px` | `16px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.b3-hi-tools.mtools` | `div.pb-tools` | padding-right | `16px` | `22px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.b3-hi-tools.mtools` | `div.pb-tools` | padding-left | `16px` | `22px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.mt-r1` | `div.pb-t1` | display | `flex` | `grid` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.mt-r1` | `div.pb-t1` | column-gap | `12px` | `0px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.b3-hi-f.mt-r2` | `div.pb-t2` | display | `flex` | `grid` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.b3-hi-f.mt-r2` | `div.pb-t2` | column-gap | `10px` | `36px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |

## B1 · the delivery-queue card ← board 2 · G3

17 board-3 signatures paired with a board-2 element by class (the same class, the alias table in `lineage.cjs`, else `wg-x` ↔ `pb-x`). **14 property differences.** Not paired by name — compare these by eye, or through `../2026-09-14-pins2-board-2/port-g4-g3-g11.md`: `pb-qafter` `has-word` `pb-vr` `pb-del` `pb-cg` `pb-cgnone`.

| Board 3 element | Board 2 element | Property | Board 2 | Board 3 | Board-3 value from | Kind | Ships |
|---|---|---|---|---|---|---|---|
| `div.g-card.g-never.pb-card` | `div.pb-card` | grid-template-columns | `56px 698px 0px` | `56px 618px 0px` | BOARD2 | STAGE | board 2 rule — **board 2** |
| `div.pb-enc` | `div.pb-enc` | box-shadow | `rgb(42, 52, 61) 0px 0px 0px 1px inset, c` | `color(srgb 0.94902 0.760784 0.188235 / 0` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.pb-encf` | `div.pb-encf` | padding-right | `4px` | `18px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `button.pb-exp` | `button.pb-exp` | margin-left | `482.094px` | `347.078px` | BOARD2 | DESIGN | board 2 rule — **board 2** |
| `div.pb-tl` | `div.pb-tl` | grid-template-columns | `100px 474px 100px` | `75px 444px 75px` | BOARD3 | STAGE | board 3 changed it — **board 3** |
| `div.pb-tl` | `div.pb-tl` | row-gap | `12px` | `5px` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.g-run.pb-span` | `span.pb-span` | left | `63.5px` | `122.906px` | OTHER | STAGE | gate width — not a design value |
| `span.g-run.pb-span` | `span.pb-span` | background-color | `rgb(31, 138, 94)` | `rgba(0, 0, 0, 0)` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.g-run.pb-span` | `span.pb-span` | background-image | `none` | `linear-gradient(90deg, rgb(242, 194, 48)` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.pb-now` | `span.pb-now` | left | `332.625px` | `403.016px` | OTHER | STAGE | gate width — not a design value |
| `span.g-noend.pb-end` | `span.pb-end` | box-shadow | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | `color(srgb 1 0.478431 0.270588 / 0.4) 0p` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `span.g-noend.pb-end` | `span.pb-end` | color | `rgb(157, 170, 180)` | `rgb(255, 158, 114)` | BOARD3 | DESIGN | board 3 changed it — **board 3** |
| `div.pb-cacts` | `div.pb-cacts` | margin-right | `-5px` | `0px` | BOARD2 | DESIGN | board 2 rule — **board 2** |
| `div.pb-cacts` | `div.pb-cacts` | margin-left | `444.875px` | `239.844px` | BOARD2 | DESIGN | board 2 rule — **board 2** |
