---
kind: reference
status: live
---

# Design board 3 — the surfaces, the pins each one answers, and the picks

*Rewritten 2026-09-15 22:15 EDT. The board is <https://claude.ai/artifact/2yJmND6URRPwLbNJbzySFc> (version 15). Its kit is
`local/pins2-board-3/redo/`, which is gitignored: the board mounts the portal's own `ui/` and `b3/` modules on the captured
dev database, so tracking a copy would mean committing two megabytes of duplicated portal code. This file is the tracked
record — every surface, the pins it answers, every fork with its options, and every fix value — so Sessions 4 and 5 can
extract from git alone.*

> **Version 1** was the static board of 2026-09-15 afternoon. **Version 2** recreated the whole portal and was reverted the
> same evening — *"this whole portal re-creation thing is just confusing."* Versions 5 to 13 are the redo in board 1 and 2's
> gate format. **Version 14** restructured 19 gates into ten surfaces. **Version 15** fixes the five defects of 21:01 EDT and
> withdraws the shared-vocabulary surface.

## 🔴 The shared-vocabulary surface is WITHDRAWN — 2026-09-15 22:10 EDT

Harkirat: *"your section E is way too narrow scoped. The portal has SOOO many more designs and surfaces that you didn't even
consider. Just defer that to the next session's work… For now, in the artifact, just use the buttons and stuff that the
current portal uses, with the caveat of the changes i requested specifically in the pins (such as the 'add build' or 'add
announcement' button in the manifest header being the same style as the button used in the masthead, etc). But the overall
standardization, and their design, that'll all be part of next session's work."*

So the board now shows **the portal's own elements exactly as they ship**, with only the individually pinned changes applied.
Forks `e1`–`e6` are gone; `data-b3-e1` … `data-b3-e6` default to `now`, which matches no rule in `b3/board.css`. Pins **21,
27, 28, 31, 34, 35, 38, 41, 42** move to the settled log as **Session 4's**, and §5c is where the element system is decided.

## How the board works

- One **block** per surface: every switch for it in a strip above a single stage, the notes under the stage, one Decide panel
  at the foot carrying that surface's forks as rows — look at an option, tick it to record it.
- The manifest stage carries one weapon from **every** category, so the tools row's real spacing and wrap behaviour are on
  screen rather than implied.
- **Where a board already answered it, that board is shown**: `ref/board1-g9.html` and `ref/board1-g8.html` are board 1's page
  trimmed to one gate and framed in the stage, so the target is board 1 rather than my redrawing of it (his note, 20:46 EDT).
  The port sits beside it so the gap is visible.
- A stage is the portal's own component running on the dev database. Drawers, the selection bar and popovers are
  `position:fixed` in the portal, so each stage carries a transform and becomes their window.
- A **pick** writes to the artifact's db at `decisions/<fork>`; a note box writes to `notes/<surface>`. Both read back with
  `read_db`, so a choice needs no message.
- **Dynamic picks** (18:26 EDT): a refinement ask gets two or more options and keeps its pick; the pick only disappears when
  nothing is left to decide.

## The surfaces

| # | Surface | Pins | Decisions |
|---|---|---|---|
| M1 | The Armory manifest — fixes, badges, tags, problems, selecting | 1 · 3 · 4 · 5 · 6 · 7 · 8 · 9 · 10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 · 18 · 19 · 20 · 22 · 29 | `p1` `p2pal` `p2sty` `p3` `p4` `p5list` `p5bg` `p5hint` `e2spd` |
| M2 | The build drawer — **board 1's own G9 framed**, the portal's drawer, and the port so far | 2 | — (the target is board 1) |
| M3 | Repairs | 23 | `p6` |
| M4 | Command search | 25 | — (as shown) |
| M5 | Export | 26 | `exp` |
| B1 | The delivery queue | 32 · 33 · 36 · 37 · 39 · 40 · 43 · 46 · 47 · 49 | `p8` |
| B2 | The broadcast manifest | 44 · 45 · 50 | — (board 2 G11) |
| B3 | The announcement drawer | 48 | — (board 1 G8) |
| H1 | The history manifest | 51 · 52 · 53 · 54 · 55 · 56 · 57 | `p9` |

Pins **24** (account-menu tint — Session 5 reproduces it first), **30** (the standardization session itself) and the nine
standardization pins above are answered in the settled log. The page asserts this coverage itself: any pin from 1 to 57 with
no surface and no log row renders a red banner at the top.

## The forks — 13

| Fork | Surface | Options | My read |
|---|---|---|---|
| `p1` | M1 | a Medals · b Ladder · c Weight | b |
| `p2pal` | M1 | named (nine named hues) · parts (front to back) | named |
| `p2sty` | M1 | wash · washc · bar · neutral | washc |
| `p3` | M1 | a Tape and tail · b Spine, joined | b |
| `p4` | M1 | a Drawn check · b Soft well | a |
| `p5list` | M1 | grouped · table | grouped |
| `p5bg` | M1 | solid · mesh | mesh |
| `p5hint` | M1 | card (hover card) · inline (a line in the bar) | card |
| `e2spd` | M1 | quick 160ms · smooth 260ms · slow 380ms | smooth |
| `p6` | M3 | a Worst first · b By problem | a |
| `exp` | M5 | a Under the scopes · b Its own step | b |
| `p8` | B1 | a On the card · b In Changes ahead | a |
| `p9` | H1 | a Day groups · b Time rail | a |

## The five defects of 2026-09-15 21:01 EDT — measured before and after

He listed five, the sweep found the same class in six places, and one of the five turned out to be another's consequence.

| # | What he saw | Measured before | Measured after |
|---|---|---|---|
| 1 | The collapse icon off-centre in its box | icon centre **4.0px** left of the box centre | **0** |
| 2 | Collapse all has no border and lights the whole wrapper | `::before` `background: none`, `box-shadow: none`, a **111×34** slab of `--hi` on hover | ground and 1px ring at rest; element background `rgba(0,0,0,0)` on hover |
| 3 | The gunsmith copy button lights its wrapper div | hovering the FIELD and the BUTTON returned **byte-identical** computed styles | the two differ; the tint is on the segment, `:focus-visible` carries the keyboard |
| 4 | The warn chip is not aligned with Share | chip right **1077**, Share's box right **1079** | **1079 / 1079**, with no rule added — see below |
| 5 | The reveal is neither smooth nor the speed asked for | 8 samples at 45ms: **zero** intermediate widths, 46px → 95.2px in one frame | **6** intermediate frames, 44px → 95.2px across 260ms |

**Defect 4 was defect 1 seen from the other side.** The fold button was 46px instead of 44 — the 8px gap sitting between its
icon and a zero-width word — and those 2px of overhang pushed the chip 2px left of the Share button's edge below it. Centring
the icon put the chip on the line by itself, so `gates.css` adds no margin rule at all; `app.css`'s own 18px is correct once
the button is the width it claims. A tuned margin would have hidden the cause and drifted the next time the button changed.

**THE CLASS BEHIND DEFECTS 2 AND 3, and it is a portal defect, not a board one.** `app.css:442` is a bare, unscoped
`button:hover:not(:disabled) { background: var(--rule) }`. An element selector carrying two pseudo-classes sits at (0,2,1),
which outranks every `.class { background: none }` in the portal — so any control that draws its own box with a `::before`
gets a second, larger, borderless slab behind it on hover. The previous round killed it for `.wg-r .wg-ib` **alone**, which is
exactly why Collapse all, the sort head, the code field and the fold button all still did it.

`redo/sweep.cjs` hovers every control on the manifest surface and reports each one whose hover paints a layer that was
transparent at rest. It found **nine**, of which six were real: `.wg-fold`, `.wg-sort`, `.wg-code`, `.wg-ib.wg-fbtn`,
`.dk-see` (the board's own Decide button) and one `role=tab` in a segmented switch, which is the one case where the ground is
the affordance and is correctly left alone. After the fix: **zero**, with the three remaining rows being the weapon row
lighting under its own buttons, which is intended.

> **THE RULE, for Session 4 and Session 5:** a hover highlight paints only the shape the pointer is on, and that shape is
> already visible at rest.

**Three of the five are PORTAL defects and must land in the port table**, or Session 5 rebuilds the board's look on top of
the broken rules: `app.css:442` (the bare button hover), `app.css:1181` (`.wg-code:hover .wg-igb` — the tint keyed on the
wrapper), and `.wg-fwrap`'s 18px margin, which is correct only once the fold button is 44px. Defects 1 and 5 were mine.

## The fix values the manifest surface carries

| Pin | Value |
|---|---|
| 3 | **The tools row is a layout, not a nudge.** Row two is a grid of two content-sized groups on one centre line: the category chips, then a 1px 26px divider with 16px of air each side, then Attachments. Chips carry 8px padding and 5px gaps because eight needed 802px of a 772px column — without that, Secondaries orphans. `.mtools .mlabel` min-width 84px → 64px walks the search and chips 20px left |
| 5 | Board 2's fold / unfold marks on every fold control |
| 6 | `--sec` becomes `#3F6E8E` **and the accent is rewritten in the data** — chips, weapon bars and row accents read `b.accent`, which the API still answers with `#023047`, so the token alone changes nothing visible; `utils/loadoutRender.js`'s `SECONDARIES` moves with it |
| 8 | `.wg-ig` draws one ring in an `::after` above its children; `.wg-igf` keeps its inner shadow; `.wg-igb` loses its own ring for a left border |
| 9 · 43 · 47 | The hover box: only the shape under the pointer lights, and it is visible at rest (the class above) |
| 10 | `.wg-code { cursor: pointer }` |
| 11 | The copy segment takes the **weapon's** accent — `--c` at 16% with a 50% ring; **Share keeps the tint it had**, which he said was fine |
| 12 · 29 | **One fold control.** Collapse all and the per-weapon button are one grid: icon, then a track 0 wide at rest and the word's own width on hover. No absolute positioning, no fixed slide, no `max-width` guess |
| 14 | `.wg-heads` min-height 48px, label `700 var(--t-xs)` at `.12em` in `--ink2`; head padded to 20px so the checkbox column has one left edge (139/139/139 with the fix, 135 vs 139 without) |
| 15 | `.wg-r` min-height 52px → 58px |
| 19 | `.wg-h::before` inset 10px at 4px rounded; `.wg-r::before` inset 12px at 2.5px |
| 36 · 37 · 39 · 40 · 46 · 49 · 50 · 51 | Unchanged from version 14 — the queue card, the airtime fade, the quote box, the footer row, the panel head ground, Edit carrying its word, Broadcast's columns, upright counts |

## Two traps this board paid for

- **`.dk-h span`** — a selector written for one sentence — caught the DECIDE chip beside it, because class-plus-element
  outranks a plain class. The chip rendered 508px wide instead of 60px. **Style by class, never by element type.**
- **`page.screenshot({clip})` takes PAGE coordinates; `getBoundingClientRect` gives VIEWPORT ones.** Mixing them shot a
  region hundreds of pixels away — four frames of the wrong element that looked exactly like real evidence, and were read as
  such for one round. Every clip now adds `scrollX`/`scrollY`.

## How it is checked

`redo/verify.cjs` serves the kit, opens it in Chrome with a mock db capability and reports: surfaces, picks and options
rendered; every option of every fork clicked without a page error; each fix measured in computed style with its switch on
**and** off; a pick actually written and painted; board 1's frame loaded; no horizontal overflow at 1282px or 390px; the
tools row's centre line, air and overflow; the checkbox column's left edge; and **the five defects above as readings that can
fail** — `d1_foldIconOffCentre`, `d2_collapseAllBoxAtRest`, `d3_tintIsScopedToSegment`, `d4_chipVsShareRightEdge`,
`d5_reveal.intermediateFrames`. `redo/sweep.cjs` is the class check behind defects 2 and 3; `redo/shots.cjs` takes the
close-up frames.

Last run 2026-09-15 22:15 EDT: **9 surfaces, 13 decision rows, 30 options, every pin 1–57 covered, 0 page errors, 0 overflow at
1282px and 390px**, and d1 = 0 · d2 lit with a ring · d3 true · d4 1079/1079 · d5 6 frames.
