---
kind: reference
status: live
---

# Design board 3 — the surfaces, the pins each one answers, and the picks

*Rewritten 2026-09-16 00:48 EDT. The board is <https://claude.ai/artifact/2yJmND6URRPwLbNJbzySFc> (version 16). Its kit is `local/pins2-board-3/redo/`, which is gitignored: the board mounts the portal's own `ui/` and `b3/` modules on the captured dev database, so tracking a copy would mean committing two megabytes of duplicated portal code. This file is the tracked record — every surface, the pins it answers, every fork with its options, and every fix value — so Sessions 4 and 5 can extract from git alone.*

> **Version 1** was the static board of 2026-09-15 afternoon. **Version 2** recreated the whole portal and was reverted the same evening — *"this whole portal re-creation thing is just confusing."* Versions 5 to 13 are the redo in board 1 and 2's gate format. **Version 14** restructured 19 gates into ten surfaces. **Version 15** fixes the five defects of 21:01 EDT and withdraws the shared-vocabulary surface. **Version 16** removes the three surfaces that asked nothing.

## 🔴 The shared-vocabulary surface is WITHDRAWN — 2026-09-15 22:10 EDT

Harkirat: *"your section E is way too narrow scoped. The portal has SOOO many more designs and surfaces that you didn't even consider. Just defer that to the next session's work… For now, in the artifact, just use the buttons and stuff that the current portal uses, with the caveat of the changes i requested specifically in the pins (such as the 'add build' or 'add announcement' button in the manifest header being the same style as the button used in the masthead, etc). But the overall standardization, and their design, that'll all be part of next session's work."*

So the board now shows **the portal's own elements exactly as they ship**, with only the individually pinned changes applied. Forks `e1`–`e6` are gone; `data-b3-e1` … `data-b3-e6` default to `now`, which matches no rule in `b3/board.css`. Pins **21, 27, 28, 31, 34, 35, 38, 41, 42** move to the settled log as **Session 4's**, and §5c is where the element system is decided.

## 🔴 Three surfaces became documents — 2026-09-16 00:48 EDT

Harkirat, 2026-09-15 22:22 EDT: *"wipe the entire design board 3 and build up correctly this time, using the correct core and references, and structure. You decide honestly."* And, naming the fault exactly: *"why are some of these even gates on the artifact? for example, B3, it shows the portal today vs the Board 1 · G8 design. Like okay...? What's even the point of that? … That has nothing to do with me and nothing i need to look at or decide."*

**A surface earns a place on this board only by asking him something.** Three did not — each showed the portal beside a design an earlier board had already settled, which is a comparison he has already judged:

| Removed | Pins | Where it went |
|---|---|---|
| M2 · The build drawer | 2 | `../2026-09-14-pins2-board/handoff-g9-g8.md` — board 1 · G9, 14 element rows |
| B2 · The broadcast manifest | 44 · 45 · 50 | `../2026-09-14-pins2-board-2/port-g4-g3-g11.md` — board 2 · G11 |
| B3 · The announcement drawer | 48 | `../2026-09-14-pins2-board/handoff-g9-g8.md` — board 1 · G8, 9 element rows |

The board now lists them in an **Already drawn** table naming the document for each, so the pins stay visibly accounted for; the page's own coverage check counts them, so removing a surface without rehoming its pins would raise the red banner rather than pass quietly.

**What was NOT done, deliberately.** The stylesheet cascade was left alone. "The correct core" could be read as re-seating the stage on board 2's G4 instead of the portal's `app.css`, and that was considered and rejected: every reading this board carries — the five defect numbers, 30 options, both overflow checks — was taken against the present cascade, re-seating invalidates all of them, and **no open fork renders differently either way** (a badge, a checkbox and a selection bar do not change because `app.css:442` exists). The portal's own defects belong in the port sheet, where Session 5 applies them, not patched onto the board. If he meant the cascade literally, it is one call to say so.

**M3 · Command search stays although it carries no fork**, and it is the only such surface. He settled it — *"build it properly, and exactly as shown"* — and "as shown" makes this board the specification: it is the only place that design exists. Deleting it would delete the design.

## Round 2 — Harkirat's review of 2026-09-16, captured 2026-09-16 11:34 EDT

*22 comment threads, none of them sent to Claude, so none can be replied to or resolved from a session. Captured here because a decision that lives only in a comment thread is a decision nobody can search for. **Version 17** carries the one fix he asked for before continuing.*

### 🔴 The blocker he named, and it is fixed

*"Something about the comments on the History manifest item is bugged and it keeps moving the comments to the top of the page. Please correct that, then I'll continue."* — **Two elements carried `id="manifest"`**: the shared portal `Manifest` at the top of the board (`ui/manifest.js:164`) and History's own panel (`b3/history.js:59`), which borrowed the id to pick up `app.css:2841`'s top margin. A duplicate id resolves to the FIRST match, so every comment placed on History re-anchored to the Armory manifest and jumped to the top. History's panel is `#history-manifest` now with the margin restored in the board's own sheet. **Checked as a class, not as that one id:** `verify.cjs` reports every duplicate id on the page, so the next collision fails rather than waiting to be noticed — it reads `[]` at version 17.

### Decisions he made

| Surface | Decision |
|---|---|
| Badges | **Medals is the right direction** — but add subtle life inside a badge (a poison effect on TOXIC, a shine on BEST; his examples, not literal). He dislikes the TOP 5 dot, and has never seen TOP 3 because no weapon on the board carries it |
| Problems | **A · Tape reads better than B · Spine** |
| Attachment tags | **Drop `bar`.** Still undecided between `wash`, `wash + text` and `neutral + text`; wants a fourth neutral-ground variant drawn from his reference |
| Repairs | **"Worst first" and "by problem" are the wrong labels** — it should be **"by weapon"**, which is where the worst-first design was already heading |
| Command search | **Deferred to a session of its own.** *"i typed 'badge cx9' and got the same list as if i had just typed 'badge'… the algorithm needs a significant improvement session of its own."* Its current design is approved and stays as the specification |

### What he asked to be redrawn — progress at 2026-09-16 14:03 EDT (board version 22)

| Redraw | State |
|---|---|
| **Repairs' whole panel** | ✅ the worklist groups **by weapon**, worst weapon first and worst build first inside it; the row stopped repeating the weapon and category its own group header carries, which is what made the first pass read as two lists stacked. Repairs also left the view toggles for a button at the right of the panel head, and its status is a **count plate that only exists when work is pending** — the button changes shape rather than only colour |
| **The selection bar's mesh ground** | ✅ redrawn. Three faults, each worth keeping as a rule: four hues at 26/22/16/16% read as four stains (now one analogous span, nothing over 15%); every blob centre sat on the canvas so you could see where each began (every centre is outside the box now, only the falloff lands inside); and they stacked like paint (`screen` blending makes them mix like light, which is what a mesh is) |
| **The weapon chips** | ✅ two rows flowing rightward under a mask fade, swipeable, chips at 26px. The **"+8 weapons" button is gone** — it hid exactly the weapons he asked to be able to reach |
| **The Export surface's bugged state** | ✅ measured rather than guessed: the picker was fine (68 groups, 125 rows in the DOM). The drawer is 815px and its stage was 720, and the drawer centres on the stage, so it hung 47px past each end and clipped its own title and footer. Stage is 900; the drawer is contained |
| **The selection list, both views** | ✅ all seven. The view toggle sits at the list's top right and writes the same `p5list` key the Decide panel reads, so switching there IS the pick. The code cell became the copy control — a separate button costs a column and says nothing the code could not say by being clickable. The attachment run scrolls under its fade instead of only fading, because a fade you cannot reach past is a label you cannot read. The Mark column IS the problem chip now, compact so it fits its column, and it opens the real card. ⚠️ **The one-table view had NO rules at all** — `.b3-sd-th`, `.b3-sd-tr` and `.b3-sd-tbl` were in the markup and unstyled, which is why its header read as loose text; it now shares the grouped view's column grammar with a sticky head. Columns retuned: the Marks column was a fixed 92px for at most three small marks, and that width went to the attachments, which is the column that actually runs out |
| **The problem popover's pointer and header** | ✅ the pointer was two stacked clip-path triangles — a border-coloured one with a lighter one scaled 84% on top, which is the generic tooltip arrow and shows its seam wherever the two edges fail to meet. It is now ONE 16px square rotated 45° so a rounded corner protrudes, carrying the card's hairline on exactly the two exposed sides: a corner of the card rather than a shape parked against it. Pointing down from the card it takes the hazard tape, so the tape runs off the edge into a point and the pointer belongs to direction A. ⚠️ The first attempt put the covering strip 3px OUTSIDE the edge, which cut the tip and left a hollow chevron — the strip has to sit flush and reach inward. The header block also takes the container's radius and the warn hairline, which is the "orange border stops at the tape and the corners stick out" he pointed at |
| The problem popover's contents | 🔶 partly — the **near-duplicate now marks its own row**: its code carries the orange wavy underline a bad code gets, so the fault is visible on the build rather than only on the hazard edge. Still open: the prose, the `1 / 5`, and the hazard strip inside the card |
| **The slot palette** | ✅ a fourth palette, **One family**. The two before it were picked hue by hue at whatever saturation each hue looked strong at, which is what makes a set shout — `#F4D03F` and `#7ED957` sit at very different lightnesses and both scream beside `#FF5A5F`. This one holds LIGHTNESS and CHROMA constant and moves only HUE in even steps, `oklch(.78 .115 H)`, with Perk near-neutral because a perk is not a part. **Distinguishable is a hue job; not-an-eye-sore is a chroma-and-lightness job, and they are separable.** The legend is now the control as well as the key — every swatch is a colour input writing the slot's variable straight onto `<html>`, with a per-slot reset — and a **nine-slot specimen** sits beside it: a build no weapon has, so a tag style can be judged on every colour at once |
| **The manifest's weapon set** | ✅ his four are pinned, and every other category is filled by whichever weapon ADDS something the set does not have yet — a badge nobody carries, a problem nobody has — falling back to "most complete build" only when nothing is missing. Measured on the stage: **meta 2 · best 3 · top3 1 · top5 1 · toxic 1**, 8 weapons, 3 problem chips. He had never seen a TOP 3 badge because none was on the stage; `verify.cjs` now **fails on a missing badge kind**, so that cannot quietly return |
| **The Stage-deletion hint** | ✅ two sentences of reassurance became the three states a staged change passes through — **Staged → Review → Gone**, with where you are marked. What he needs is where the change IS and where it goes next, and that is three words and an arrow rather than a paragraph |

*This table is the tracker for round 2. It is not in `docs/db-deferred-list.md` on purpose: these are in-flight items of an open plan step (§5b Step 5), not deferred work, and duplicating them would make two records of one thing.*

### What he reported as broken

The Export surface renders in a bugged state (screenshot in his Downloads, not in the repo) · the manifest stage clips the Edit-builds drawer and needs to be taller · the selection bar is not centred on the manifest · the List button uses a chevron where the fold mark belongs and wants `Clear`'s border · a `Nearly the same as another build` problem shows no indicator on the row itself.

## How the board works

- One **block** per surface: every switch for it in a strip above a single stage, the notes under the stage, one Decide panel at the foot carrying that surface's forks as rows — look at an option, tick it to record it.
- The manifest stage carries one weapon from **every** category, so the tools row's real spacing and wrap behaviour are on screen rather than implied.
- **Where a board already answered it, that board is shown**: `ref/board1-g9.html` and `ref/board1-g8.html` are board 1's page trimmed to one gate and framed in the stage, so the target is board 1 rather than my redrawing of it (his note, 20:46 EDT). The port sits beside it so the gap is visible.
- A stage is the portal's own component running on the dev database. Drawers, the selection bar and popovers are `position:fixed` in the portal, so each stage carries a transform and becomes their window.
- A **pick** writes to the artifact's db at `decisions/<fork>`; a note box writes to `notes/<surface>`. Both read back with `read_db`, so a choice needs no message.
- **Dynamic picks** (18:26 EDT): a refinement ask gets two or more options and keeps its pick; the pick only disappears when nothing is left to decide.

## The surfaces

| # | Surface | Pins | Decisions |
|---|---|---|---|
| M1 | The Armory manifest — fixes, badges, tags, problems, selecting | 1 · 3 · 4 · 5 · 6 · 7 · 8 · 9 · 10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 · 18 · 19 · 20 · 22 · 29 | `p1` `p2pal` `p2sty` `p3` `p4` `p5list` `p5bg` `p5hint` `e2spd` |
| M2 | Repairs | 23 | `p6` |
| M3 | Command search — settled, kept because this board is its only specification | 25 | — (as shown) |
| M4 | Export | 26 | `exp` |
| B1 | The delivery queue | 32 · 33 · 36 · 37 · 39 · 40 · 43 · 46 · 47 · 49 | `p8` |
| H1 | The history manifest | 51 · 52 · 53 · 54 · 55 · 56 · 57 | `p9` |

Pins **24** (account-menu tint — Session 5 reproduces it first), **30** (the standardization session itself) and the nine standardization pins above are answered in the settled log. The page asserts this coverage itself: any pin from 1 to 57 with no surface and no log row renders a red banner at the top.

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

**Defect 4 was defect 1 seen from the other side.** The fold button was 46px instead of 44 — the 8px gap sitting between its icon and a zero-width word — and those 2px of overhang pushed the chip 2px left of the Share button's edge below it. Centring the icon put the chip on the line by itself, so `gates.css` adds no margin rule at all; `app.css`'s own 18px is correct once the button is the width it claims. A tuned margin would have hidden the cause and drifted the next time the button changed.

**THE CLASS BEHIND DEFECTS 2 AND 3, and it is a portal defect, not a board one.** `app.css:442` is a bare, unscoped `button:hover:not(:disabled) { background: var(--rule) }`. An element selector carrying two pseudo-classes sits at (0,2,1), which outranks every `.class { background: none }` in the portal — so any control that draws its own box with a `::before` gets a second, larger, borderless slab behind it on hover. The previous round killed it for `.wg-r .wg-ib` **alone**, which is exactly why Collapse all, the sort head, the code field and the fold button all still did it.

`redo/sweep.cjs` hovers every control on the manifest surface and reports each one whose hover paints a layer that was transparent at rest. It found **nine**, of which six were real: `.wg-fold`, `.wg-sort`, `.wg-code`, `.wg-ib.wg-fbtn`, `.dk-see` (the board's own Decide button) and one `role=tab` in a segmented switch, which is the one case where the ground is the affordance and is correctly left alone. After the fix: **zero**, with the three remaining rows being the weapon row lighting under its own buttons, which is intended.

> **THE RULE, for Session 4 and Session 5:** a hover highlight paints only the shape the pointer is on, and that shape is already visible at rest.

**Three of the five are PORTAL defects and must land in the port table**, or Session 5 rebuilds the board's look on top of the broken rules: `app.css:442` (the bare button hover), `app.css:1181` (`.wg-code:hover .wg-igb` — the tint keyed on the wrapper), and `.wg-fwrap`'s 18px margin, which is correct only once the fold button is 44px. Defects 1 and 5 were mine.

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

- **`.dk-h span`** — a selector written for one sentence — caught the DECIDE chip beside it, because class-plus-element outranks a plain class. The chip rendered 508px wide instead of 60px. **Style by class, never by element type.**
- **`page.screenshot({clip})` takes PAGE coordinates; `getBoundingClientRect` gives VIEWPORT ones.** Mixing them shot a region hundreds of pixels away — four frames of the wrong element that looked exactly like real evidence, and were read as such for one round. Every clip now adds `scrollX`/`scrollY`.

## How it is checked

`redo/verify.cjs` serves the kit, opens it in Chrome with a mock db capability and reports: surfaces, picks and options rendered; every option of every fork clicked without a page error; each fix measured in computed style with its switch on **and** off; a pick actually written and painted; board 1's frame loaded; no horizontal overflow at 1282px or 390px; the tools row's centre line, air and overflow; the checkbox column's left edge; the **structure** check that replaced the board-1 frame one — which surfaces render, which of them carry no decision, the Already-drawn rows, and that the three removed ids are absent — and **the five defects above as readings that can fail** — `d1_foldIconOffCentre`, `d2_collapseAllBoxAtRest`, `d3_tintIsScopedToSegment`, `d4_chipVsShareRightEdge`, `d5_reveal.intermediateFrames`. `redo/sweep.cjs` is the class check behind defects 2 and 3; `redo/shots.cjs` takes the close-up frames.

Last run 2026-09-16 00:48 EDT: **6 surfaces, 13 decision rows, 30 options, every pin 1–57 covered, 0 page errors, 0 overflow at 1282px and 390px**, and d1 = 0 · d2 lit with a ring · d3 true · d4 1079/1079 · d5 6 frames.
