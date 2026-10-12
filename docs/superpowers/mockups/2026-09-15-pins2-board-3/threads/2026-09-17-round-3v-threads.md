---
kind: reference
status: live
---

# Board 3-C — all 34 open threads, and what each one got

*2026-09-17 10:15 EDT. Every thread read first, including the ten left overnight; the eight screenshots they cite opened before anything was touched. None can be resolved from here — not one of the 34 is activated for Claude — so the fix is the answer. Nothing published: 3-C is still at version 4 and every change below is local.*

## The nine classes

| Class | Threads | The one rule |
|---|---|---|
| The ring on an icon | `1ea9c583` `79663e93` `370ee708` | A resting ring belongs to a control that ACTS; a mark that REPORTS gets colour and nothing else |
| Row alignment | `1ac9bc07` `ca57c38f` `1dbd22a8` `18a75827` | A box beside words shares a centre line; words beside words share a baseline (`.b3-nw`) |
| The Repairs panel | `2ca45e3c` `6de9e6a2` `81c52bd7` `8587013d` `370ee708` `e3b343f1` | A problem chip names the thing that is wrong, in the reader's nouns; and the panel ranks |
| The export drawer | `743f8f2f` `17722665` `2bffb338` `252520d4` `1ac9bc07` `9ceaf6ff` | The drawer is the container and nothing inside it is |
| Slot vocabulary | `50f15cd3` | Fifteen slot names, nine hues, and a tag that names the slot is what reconciles them |
| Tag styles | `4d5a42c3` `35ae7aaa` | Cut INTO the row vs laid ON it — and both carry the slot colour in the word, as asked twice |
| Badges | `3940ef66` `4ef44724` | A hatch means danger; META is not a danger |
| Small nits with a picture | `b69fc0f8` `3db459ee` `2227caaf` `640d6682` `3a6dd54d` `a10b7896` `90b8fb7a` `9b565073` | Open the picture |
| Hint text and forks | `00c244ee` `6f9b57dd` `7dc8a871` `5aa8099e` | A fork is shown before it is asked; a question he answered stops being a question |

## Measured, not asserted

| Claim | How it was checked | Result |
|---|---|---|
| Attachment names stop truncating | counted elements whose `scrollWidth > clientWidth` in the picker | was clipping mid-word · now **0** |
| `asv` finds AS VAL | drove the real input, read the group headers | `asv` -> `AS VAL` · `av` -> `AS VAL` + 5 · `xyzzy` -> none |
| No image mark wears a ring | computed `boxShadow` on every `.b3-img` | **0 of 5** |
| No repairs row wears the hatch | computed `::before` background on every `.b3-wr` | **0 of 5** |
| The fold control says its word | counted `.b3-fold2 b` | **5 of 5** rows |
| Add build is the masthead's button | read its className | `pill lead madd` |
| `1 never ends` baselines | `Range.getBoundingClientRect()` on the bare text node at 3x | two boxes of different heights, centred, baselines 0.25px apart -> `.b3-nw` |
| The problem card's joint | measured the card and chip rects | right edges flush to the pixel, gap 0 — **and it still read as two objects** |
| Fifteen hues is not a palette | hue ring arithmetic over his six | nine hold a 14 degree minimum; fifteen average 24 with the tightest under 7 |
| The six rare slots in the data | counted `attachmentSlots` across the dev database | 133 builds, **0** carry any of the six |

## Still his to decide

1. **The palette.** Barrel `#08C9D6`, Stock `#6EB8FF`, Underbarrel `#F99814` — his six untouched. On the board as `Yours + 3`.
2. **Whether his six should be regularised.** Their lightness runs .648 to .935 and chroma .125 to .240, so Ammunition reads as a much lighter object than Optic at the same size. That is taste and it is his.
3. **Publishing.** Held, per his 00:28 instruction.
