---
kind: reference
status: live
---

# Design board 3 — the gates, the pins each one answers, and the picks

*Written 2026-09-15 19:03 EDT. The board is <https://claude.ai/artifact/2yJmND6URRPwLbNJbzySFc> (version 10). Its kit is
`local/pins2-board-3/redo/`, which is gitignored: the board mounts the portal's own `ui/` and `b3/` modules on the captured
dev database, so tracking a copy would mean committing two megabytes of duplicated portal code. This file is the tracked
record — every gate, the pins it answers, and every fork with its options — so Sessions 4 and 5 can extract from git alone.*

> **Version 1** (`index.html` beside this file) was the static board of 2026-09-15 afternoon. **Version 2** recreated the
> whole portal and was reverted the same evening — *"this whole portal re-creation thing is just confusing"*. Version 5 is
> the redo in board 1 and 2's gate format, and version 6 answers his first two comments on it. The v1 `census.*` and `palettes.json` beside this file are still the evidence
> they always were.

## How the board works

- One **gate** per topic, in board 1 and 2's frame: a gate id, a title, a one-line sub, the pins it answers, a stage
  holding only the element, the notes, and then the picks.
- A1's stage carries one weapon from **every** category, so the tools row's real spacing and wrap behaviour are on screen rather than implied.
- A stage is the portal's own component — `Manifest`, `ArmoryGroups`, `RepairsPanel`, `NowShowing`, `B3History`,
  `B3BuildDrawer`, the command bar, the export drawer — running on the dev database with the mocked API. Drawers, the
  selection bar and popovers are `position:fixed` in the portal, so each stage carries a transform and becomes their window.
- A **pick** writes to the artifact's db at `decisions/<fork>`; a gate's note box writes to `notes/<gate>`. I read both back
  with `read_db`, so a choice needs no message. Where the db is unavailable the page says so and the picks disable.
- **Dynamic picks** (Harkirat, 2026-09-15 18:26 EDT): *"when I ask for refinement, you should be giving me at least 2+
  options and those sub-options would still require a pick even if the overall direction is decided. So the pick is dynamic
  where decisions are still happening. It's only gone if all decisions are gone and only tweaks are happening."*

## The surfaces

One section per surface, because a surface is what you look at: the manifest's spacing, its badges, its tags, its problems
and selecting are the same screen, so they read under one stage rather than as five gates (his correction, 2026-09-15
19:27 EDT). The stage is sticky, so it stays with you while you work down the topics beneath it.

| Surface | Topics inside it | Pins | Picks |
|---|---|---|---|
| M1 · The Armory manifest | Rows and tools · Badges · Attachment tags · Build problems · Selecting builds | 3 · 5 · 6 · 7 · 8 · 9 · 10 · 13 · 14 · 15 · 16 · 17 · 18 · 19 · 20 · 22 | `p1` `p2pal` `p2sty` `p3` `p4` `p5list` `p5bg` `p5hint` |
| M2 · The build drawer | — | 2 | — (board 1 G9) |
| M3 · Repairs | — | 23 | `p6` |
| M4 · Command search | — | 25 | — (as shown) |
| M5 · Export | — | 26 | `exp` |
| B1 · The delivery queue | — | 32 · 33 · 36 · 37 · 39 · 40 · 43 · 46 · 47 · 49 | `p8` |
| B2 · The broadcast manifest | — | 44 · 45 · 50 | — (board 2 G11) |
| B3 · The announcement drawer | — | 48 | — (board 1 G8) |
| H1 · The history manifest | — | 51 · 52 · 53 · 54 · 55 · 56 · 57 | `p9` |
| E · The shared vocabulary | Buttons · Icon buttons · Radius · Labels · Pills · Small text | 1 · 4 · 10 · 11 · 12 · 14 · 21 · 27 · 28 · 29 · 31 · 34 · 35 · 38 · 40 · 41 · 42 · 43 · 47 · 52 | `e1`–`e6` |

Pins **24** (account-menu tint — Session 5 reproduces it first) and **30** (the standardization session itself) are answered
in the board's settled log. The page asserts this coverage itself: any pin from 1 to 57 with no surface and no log row
renders a red banner at the top.

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
| 3 | **The tools row is a layout, not a nudge.** Row two is a grid of two content-sized groups on one centre line: the category chips, then a 1px 26px divider with 16px of air each side, then Attachments. The chips carry 8px padding and 5px gaps because eight of them needed 802px of a 772px column — without that, Secondaries orphans onto a second line. `.mtools .mlabel` min-width 84px → 64px walks the search and chips 20px left. ⚠️ Three earlier versions were wrong: row one (19:20 EDT), nowrap without closing the deficit (19:32 EDT), and top-aligned with uneven air around the divider (20:34 EDT) |
| 5 | Board 2's fold / unfold marks on every fold control (`Fold` renders `i-b2-fold` / `i-b2-unfold`) |
| 6 | `--sec` becomes `#3F6E8E` in the portal **and the accent is rewritten in the data** — chips, weapon bars and row accents all read `b.accent`, which the API still answers with `#023047`, so the token alone changes nothing visible; `utils/loadoutRender.js`'s `SECONDARIES` moves with it |
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
| — | **Row icon buttons keep their own box** (#1F272E, 1px `--rule2`, 8px radius, inset 5px). The defect is the 44×44 square of `--hi` the button ELEMENT paints on hover behind that box — transparent now on hover, focus and press, so only the box lights, tinted by intent (delete red). ⚠️ My first pass removed the box instead, which was a misreading (corrected 2026-09-15 20:40 EDT) |
| — | **The gunsmith copy segment takes the weapon's accent** — `.wg-igb` hover mixes 16% of the row's `--c` with a 50% ring; **Share keeps its own tint**, which he said was fine (corrected 2026-09-15 20:41 EDT) |
| — | **The weapon line on one axis**: `.wg-nb::before` drops its 2px bottom margin and the small line centres as an inline-flex, so the category and the build count share a baseline (19:24 EDT) |
| — | **The build row's accent** is 2.5px, the weapon row's stays 4px (19:25 EDT) |
| — | **Select-all alignment** (his comment 2026-09-15 19:20 EDT, not one of the 57): `.wg-heads` padding `0 var(--s4)` → `0 var(--s4) 0 20px`, so the column head, the weapon header and every build row share one left edge. Measured: all three checkboxes at x=139 with the fix, 135 vs 139 without it |

## How it is checked

`local/pins2-board-3/redo/verify.cjs` serves the kit, opens it in Chrome with a mock db capability and reports: gates, picks
and options rendered; every option of every fork clicked without a page error; each fix measured in computed style with its
switch on **and** off; a pick actually written and painted; board 1's G8 frame loaded; and no horizontal overflow at 1282px
or 390px. It also measures the tools row: the second group starts past the first and overlaps it vertically, the divider is an inset rule, the row does not overflow, and the Secondaries chip's computed `--c` reads `#3F6E8E`, and the three checkbox columns share one left edge with the fix and do not without it. Last run 2026-09-15 19:43 EDT: 10 surfaces, 18 picks, 39 options, 0 page errors, the chip group one line at 32px on the same centre line as Attachments, 16px of air each side of the divider, no overflow at 1282px or 390px.
