---
kind: reference
status: live
---

# Design board 3 — the gates, the pins each one answers, and the picks

*Written 2026-09-15 19:03 EDT. The board is <https://claude.ai/artifact/2yJmND6URRPwLbNJbzySFc> (version 5). Its kit is
`local/pins2-board-3/redo/`, which is gitignored: the board mounts the portal's own `ui/` and `b3/` modules on the captured
dev database, so tracking a copy would mean committing two megabytes of duplicated portal code. This file is the tracked
record — every gate, the pins it answers, and every fork with its options — so Sessions 4 and 5 can extract from git alone.*

> **Version 1** (`index.html` beside this file) was the static board of 2026-09-15 afternoon. **Version 2** recreated the
> whole portal and was reverted the same evening — *"this whole portal re-creation thing is just confusing"*. Version 5 is
> the redo in board 1 and 2's gate format. The v1 `census.*` and `palettes.json` beside this file are still the evidence
> they always were.

## How the board works

- One **gate** per topic, in board 1 and 2's frame: a gate id, a title, a one-line sub, the pins it answers, a stage
  holding only the element, the notes, and then the picks.
- A stage is the portal's own component — `Manifest`, `ArmoryGroups`, `RepairsPanel`, `NowShowing`, `B3History`,
  `B3BuildDrawer`, the command bar, the export drawer — running on the dev database with the mocked API. Drawers, the
  selection bar and popovers are `position:fixed` in the portal, so each stage carries a transform and becomes their window.
- A **pick** writes to the artifact's db at `decisions/<fork>`; a gate's note box writes to `notes/<gate>`. I read both back
  with `read_db`, so a choice needs no message. Where the db is unavailable the page says so and the picks disable.
- **Dynamic picks** (Harkirat, 2026-09-15 18:26 EDT): *"when I ask for refinement, you should be giving me at least 2+
  options and those sub-options would still require a pick even if the overall direction is decided. So the pick is dynamic
  where decisions are still happening. It's only gone if all decisions are gone and only tweaks are happening."*

## The gates

| Gate | Title | Pins | Picks |
|---|---|---|---|
| A1 | Manifest rows and tools | 3 · 5 · 6 · 8 · 9 · 10 · 14 · 15 · 19 | — (fixes, values below) |
| A2 | Badges | 7 | `p1` |
| A3 | Attachment tags | 16 | `p2pal` · `p2sty` |
| A4 | Build problems | 13 · 17 | `p3` |
| A5 | Selecting builds | 18 · 20 · 22 | `p4` · `p5list` · `p5bg` · `p5hint` |
| A6 | The build drawer | 2 | — (board 1 G9, built) |
| A7 | Repairs | 23 | `p6` |
| A8 | Command search | 25 | — ("exactly as shown") |
| A9 | Export: pick your own | 26 | `exp` |
| B1 | The delivery queue | 32 · 33 · 36 · 37 · 39 · 40 · 43 · 46 · 47 · 49 | `p8` |
| B2 | The broadcast manifest | 44 · 45 · 50 | — (board 2 G11) |
| B3 | The announcement drawer | 48 | — (board 1 G8) |
| H1 | The history manifest | 51 · 52 · 53 · 54 · 55 · 56 · 57 | `p9` |
| E1 | Buttons | 1 · 4 · 29 | `e1` |
| E2 | Icon buttons | 10 · 11 · 12 · 43 · 47 | `e2` |
| E3 | Corner radius | 21 | `e3` |
| E4 | Labels and headings | 14 · 35 · 41 · 42 | `e4` |
| E5 | Pills | 38 | `e5` |
| E6 | Small text | 27 · 28 · 31 · 34 · 40 · 52 | `e6` |

Pins **24** (account-menu tint — Session 5 reproduces it first) and **30** (the standardization session itself) are answered
in the board's settled log rather than on a stage. The board asserts this coverage itself: any pin from 1 to 57 with no gate
and no log row renders a red banner at the top.

## The forks

| Fork | Gate | Options | My read |
|---|---|---|---|
| `p1` | A2 | a Medals · b Ladder · c Weight | b |
| `p2pal` | A3 | named (nine named hues) · parts (front to back) | named |
| `p2sty` | A3 | wash · washc · bar · neutral | washc |
| `p3` | A4 | a Tape and tail · b Spine, joined | b |
| `p4` | A5 | a Drawn check · b Soft well | a |
| `p5list` | A5 | grouped · table | grouped |
| `p5bg` | A5 | solid · mesh | mesh |
| `p5hint` | A5 | card (hover card) · inline (a line in the bar) | card |
| `p6` | A7 | a Worst first · b By problem | a |
| `exp` | A9 | a Under the scopes · b Its own step | b |
| `p8` | B1 | a On the card · b In Changes ahead | a |
| `p9` | H1 | a Day groups · b Time rail | a |
| `e1`–`e6` | E1–E6 | a · b, each described on its gate | e1 a · e2 a · e3 b · e4 a · e5 a · e6 a |

## The fix values A1 and B1 carry

These are the pins whose value is already decided; the board shows them applied, and Session 5 builds them.

| Pin | Value |
|---|---|
| 3 | The Attachments switch moves to the tools row's first row, ahead of Add build; `.mtools .mlabel` min-width 84px → 64px, which walks the search and chips 20px left |
| 5 | Board 2's fold / unfold marks on every fold control (`Fold` renders `i-b2-fold` / `i-b2-unfold`) |
| 6 | `--sec` becomes `#3F6E8E`, in the portal and in `utils/loadoutRender.js` |
| 8 | `.wg-ig` draws one ring in an `::after` above its children; `.wg-igf` keeps `inset 0 3px 4px -2px rgba(0,0,0,.45)`; `.wg-igb` loses its own ring for a left border |
| 9 | `.wg-code:hover` lights only `.wg-igb`, never the field |
| 10 | `.wg-code { cursor: pointer }` |
| 14 | `.wg-heads` min-height 48px, label `700 var(--t-xs)` at `.12em` in `--ink2` |
| 15 | `.wg-r` min-height 52px → 58px |
| 19 | `.wg-h::before` inset 10px with a 4px rounded bar; `.wg-r::before` inset 12px at 3px |
| 36 | `.pb-numr` / `.bnum` takes `var(--c)`, the card's own minted accent |
| 37 | The open bar fades to transparent and the track is masked under it |
| 39 | Quote box padding 14px / 18px / 12px |
| 40 | Footer is a 44px row, text centred, divider dashed, board 2's unfold mark on Show all |
| 43 | `.pb-exp:hover` has no background box |
| 46 | The panel head sits on `#161E24` with a 2px divider |
| 47 | Card actions tint inside their own box — edit in ink, delete in red |
| 49 | The calendar button goes; Edit carries its word |
| 50 | Broadcast columns `minmax(0,1fr) 104px 104px 104px 124px 44px`, column-gap 16px, padding `0 16px 0 22px` |
| 51 | Chip counts upright, never italic |

## How it is checked

`local/pins2-board-3/redo/verify.cjs` serves the kit, opens it in Chrome with a mock db capability and reports: gates, picks
and options rendered; every option of every fork clicked without a page error; each fix measured in computed style with its
switch on **and** off; a pick actually written and painted; board 1's G8 frame loaded; and no horizontal overflow at 1282px
or 390px. Last run 2026-09-15 19:01 EDT: 19 gates, 18 picks, 39 options, 0 page errors, 0 overflow.
