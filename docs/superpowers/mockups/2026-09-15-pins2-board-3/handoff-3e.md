---
kind: reference
status: live
---

# Board 3-E → Session 5 · the handoff

*Written 2026-09-21 00:00 EDT, when Harkirat closed board 3-E: "the board is more or less done now." This is the §10.5 artifact the batch-2 plan reserves, in full; §10.5 carries the answer table and points here.*

> 🔴 **THE BOARD ITSELF IS GITIGNORED.** The kit lives at `local/pins2-board-3/redo/` and `local/` is excluded, so **nothing in this handoff can be recovered from the repo.** Two things carry it: this file, and the kit's OWN git repository (`local/pins2-board-3/redo/.git`, first commit `64b7a57`, one commit per round, no remote and a `pre-push` hook that refuses one). Published board: **https://claude.ai/artifact/2LxjJwzsg7odUiJKmvq2Jo**, version 77.

---

## 0 · What the board is, and what closing it means

Six surfaces, each the portal's OWN component running against the dev database — not a mockup of it. What Harkirat clicked is what Session 5 ships.

| Gate | id | Surface | Review pins it answers |
|---|---|---|---|
| **L1** | `list-lab` | Selection-list spacing lab | — (instrument, not a surface) |
| **M1** | `armory-manifest` | The Armory manifest | 3–22 |
| **M2** | `repairs` | Repairs | 23 |
| **M3** | `export` | Export | 26 |
| **B1** | `queue` | The delivery queue | 32, 33, 36, 37, 39, 40, 43, 46, 47, 49 |
| **H1** | `history` | The history manifest | 51–57 |

**"Closed" means every LIVE fork is ruled except one.** 18 live forks, 17 answered; the open one is `p10` · **Small text**, open *on purpose* because small text is Session 4's G1.

🔴 **AND THE LIVE LIST IS NOT THE WHOLE ANSWER SET.** This board ran from 2026-09-15 to 2026-09-21. Forks were answered and REMOVED, options were withdrawn, and three surfaces left the board entirely — none of which is visible in today's `FORKS` array. §1b and §1c carry them. A Session 5 that reads only the live list will rebuild two things he rejected and port CSS that is dead.

⚠️ **THE PORT LIST ALREADY EXISTS AND THIS FILE DOES NOT REPLACE IT.** `README.md` § *"Session 5 port list — portal code changed in the board's kit this session"* (2026-09-19 00:31 EDT, line 2024) is the file-by-file record of every `ui/` change made in the kit, plus per-version notes for v19 and v30–v43. **Read it first.** This file carries what it does not: the decisions, the retired forks, H1's numbers, and everything after 2026-09-20.

---

## 1 · The eighteen forks, as he ruled them

Two records exist and they do not always agree in FORM: a `decided` block hand-written into `gates/picks.js`, and a row he ticked in the board's own Decide panel, stored in the artifact database under `decisions/<forkId>`. **The database is the authority.** `picks.js:213` already resolves it that way — `const ruled = (f.decided && f.decided.choice) || (store.picks[f.id] && store.picks[f.id].choice) || null` — so a ticked fork rules whether or not anyone transcribed it.

| Fork | Surface | The question | **His answer** | Recorded |
|---|---|---|---|---|
| `p2pal` | M1 | Slot palette | **Final** — his nine hexes, six slot mappings, cool grey for unknown | picks.js |
| `p2lab` | M1 | Slot label | **Key** — micro uppercase field key, separated by air alone | picks.js |
| `p2sty` | M1 | Tag style | **Laid on** (`neutralbg`) — ⚠️ Outline's rules STAY in the files, documented, at his request | picks.js |
| `p3` | M1 | The problem card | **A** | picks.js |
| `p3tbl` | M1 | The table's problem mark | **Bare mark** — the triangle alone; hover or click opens the card | picks.js |
| `p4` | M1 | The checkbox | **B · Soft well** | **db** + picks.js |
| `p5bg` | M1 | The bar's ground | **Mesh** — ⚠️ Solid stays in the files as a future portal *setting* (thread `bd09c832`) | **db** + picks.js |
| `p5hint` | M1 | The Stage deletion hint | **Hover card** | **db** + picks.js |
| `hzf` | M1 | The row's hazard edge | **C · taper + plume**, moved to the LEFT border, replacing the row's hover accent | picks.js |
| `sdgh` | M1 | Selection-list weapon-header height | **44px** | **db** (48) + picks.js (44) — see the conflict note below |
| `e2spd` | M1 | The reveal | **Smooth · 260ms** | **db only** — ticked 2026-09-21 00:00 EDT, never transcribed |
| `p10` | M1 | Small text | 🔴 **OPEN — Session 4's G1** | — |
| `p6` | M2 | The worklist | **C · Tickets** | **db** + picks.js |
| `p6lay` | M2 | How the tickets fit together | **By severity** — Blocks sharing, then Below standard, each under its own heading | **db** + picks.js |
| `exp` | M3 | Pick-your-own export | **B** — its own step | picks.js |
| `expl` | M3 | The picker | **Tiles + file** | **db** + picks.js |
| `xbg` | M3 | The drawer's ground | **Ground** | **db** + picks.js |
| `p8` | B1 | The never-ends warning | **A · On the card** | **db** + picks.js |
| `p9` | H1 | The timeline | **B · Time rail** — ⚠️ the drastic redesign is DEFERRED, not rejected | **db** + picks.js |

🔴 **ONE CONFLICT, AND IT IS REAL.** `sdgh` reads **48** in the database (2026-09-19 00:21 EDT) and **44** in `picks.js` (2026-09-19 10:03 EDT, quoting him: *"shrink its height from 48px to 44px"*). The picks.js record is nine hours LATER and carries his words. **Build 44.** The db row is a stale tick he never re-recorded; do not let the "database is the authority" rule override a dated quotation.

---

## 1b · Forks that were answered and then REMOVED — invisible in today's board

| Fork | What it asked | What happened |
|---|---|---|
| `p1` | The rank badge's mark — **A Medals · B Ladder · C Weight** | 🔴 **DISSOLVED, not chosen** (round 3o, 2026-09-16 21:26 EDT). *"Every option in the fork was either something he had refused or nothing at all."* A printed numeral and signal bars were both rejected, three times and in the same sentence. The cause was one thing: **each option encoded the RANK in the mark while the badge already prints TOP 3 / TOP 5 beside it** — a second copy of a fact on screen. The mark stopped saying rank. Motion is unscoped now (it had been `html[data-b3-p1=a]` on every rule, so three of four states had none) and drawn in `--tc`, firing on an IntersectionObserver so it plays when he is looking |
| `p5list` | Grouped list **or** table | **Both ship.** The table carried the card view's two corrections so they read as one system — the square accent chip gone (the row's left edge carries the weapon colour), the Build column collapsing when no selected build is named. ⚠️ And the measurement found what neither of us had named: **the header and the body were resolving different `auto` tracks**, so CODE sat 74.9px off its own column. A table's header and body are ONE grid |
| `e1`–`e6` | The shared element vocabulary | 🔴 **WITHDRAWN 2026-09-15 22:10 EDT** — *"your section E is way too narrow scoped."* Deferred to **Session 4 · §5c**. `data-b3-e1` … `data-b3-e6` default to `now`, which matches no rule in `b3/board.css`. Pins **21, 27, 28, 31, 34, 35, 38, 41, 42** moved with them |
| `xtile` — index · cloud · bands · roster | Export picker tile treatments | **Withdrawn at v40–41.** 🔴 **board.css ROUNDS 5T and 5V ARE DEAD — do not port them.** Only `tile2()` (5W) and `tile3()` (5Y) survive |
| `xbg` — "Bar's light" | A fourth export ground | **Withdrawn at v47.** He could not tell it from Mesh and was right not to: a 35% change in the radius of a 15%-alpha blob is invisible on a dark ground. *"An option nobody can distinguish is not a choice, it is a thing to maintain."* `xbg` is **Flat · Mesh · Ground** |

**Two options are KEPT ALIVE in the files although they lost** — both at his explicit request, and deleting either is a defect:

- `p2sty` · **Outline** — *"let's do Laid On but keep and document the code for the Outline style in case I change my mind."*
- `p5bg` / `xbg` · **Solid ground** — *"leave the styling for the solid ground in the files and note that it's something i might want to implement later as maybe a settings menu option"* (thread `bd09c832`).

---

## 1c · Surfaces that left the board, and where their pins went

*A surface earns a place on this board only by asking him something.* Three showed the portal beside a design an earlier board had already settled — a comparison he had already judged.

| Left | Pins | Rehomed to |
|---|---|---|
| **M2 · The build drawer** | 2 | `../2026-09-14-pins2-board/handoff-g9-g8.md` — board 1 · G9, 14 element rows |
| **B2 · The broadcast manifest** | 44 · 45 · 50 | `../2026-09-14-pins2-board-2/port-g4-g3-g11.md` — board 2 · G11 |
| **B3 · The announcement drawer** | 48 | `../2026-09-14-pins2-board/handoff-g9-g8.md` — board 1 · G8, 9 element rows |

🔴 **AND ONE MORE, WHICH IS A RISK RATHER THAN A TIDY REHOMING.** **M3 · Command search** (pin 25) carried no fork and was kept *because this board was its only specification* — he settled it with *"build it properly, and exactly as shown"*, and "as shown" made the board the spec. **It is no longer on the board**: `gates/main.js` now says outright that command search is not among the surfaces. Session 5 must recover that design from an earlier board version (the artifact's own history, or a kit commit) before building pin 25 — **it cannot be recovered from the live board.**

Pins **24** (account-menu tint — Session 5 reproduces it first) and **30** (the standardization session itself) are answered in the plan's settled log, not here.

---

## 1d · Three PORTAL defects the board exposed — these belong in the port table

Found by the class sweep, not by the board's own design work. If Session 5 ports the board's look without these, it rebuilds that look on top of the broken rules.

| Site | Defect |
|---|---|
| `app.css:442` | A bare, unscoped `button:hover:not(:disabled){background:var(--rule)}`. An element selector carrying two pseudo-classes sits at **(0,2,1)** and outranks every `.class{background:none}` in the portal — so any control that draws its own box with a `::before` gets a second, larger, borderless slab behind it on hover. A previous round killed it for `.wg-r .wg-ib` **alone**, which is why it came back |
| `app.css:1181` | `.wg-code:hover .wg-igb` — the tint keyed on the WRAPPER, so hovering the field and hovering the button returned byte-identical computed styles |
| `.wg-fwrap` | Its 18px margin is correct **only once the fold button is 44px**. The button was 46, and those 2px of overhang pushed the warn chip 2px off the Share button's edge below it. Centring the icon put the chip on the line with no margin rule added |

> **THE RULE, for Session 4 and Session 5:** a hover highlight paints only the shape the pointer is on, and that shape is already visible at rest.

---

## 2 · H1's spacing — his numbers, not mine

Thirteen hard-coded spacing declarations across H1 became named relationships, each stamped by `b3/state.js` as a `--h1-*` custom property on `:root`. He tuned them in the board's own lab and pressed **Save for Claude**, which wrote `spacing/h1` to the artifact database at **2026-09-21 03:54 UTC (23:54 EDT)**. These are read back from that record, not transcribed from chat.

| Token | Knob | Mine | **His** | Drives |
|---|---|---|---|---|
| `--h1-l` | Left edge → label | 22 | 22 | `.b3-hi-tools` padding-left; every list row's left inset |
| `--h1-r` | Chips → right edge | 18 | **22** | `.b3-hi-tools` padding-right; every list row's right inset |
| `--h1-labw` | Label width | 56 | 56 | `.b3-fgl` and `.mt-r1 > .mlabel` — one shared column |
| `--h1-lab` | Label → chips | 16 | 16 | the gap after the label, both toolbar rows |
| `--h1-chip` | Between chips | 6 | 6 | `.b3-fg` gap |
| `--h1-row` | Row → row | 10 | 10 | `.b3-hi-f` row-gap |
| `--h1-col` | First column → second | 36 | 36 | `.b3-hi-f` column-gap |
| `--h1-top` | Top edge → search | 16 | 16 | `.b3-hi-tools` padding-top |
| `--h1-head` | Search → filter rows | 12 | **16** | `.mtools` row-gap |
| `--h1-srchh` | Search height | 44 | 44 | `.srch` and its input |
| `--h1-srchw` | Search width | 956 | **340** | `.srch` max-width |
| `--h1-rowh` | Event row height | 56 | **44** | `.b3-hi-r` min-height |
| `--h1-rowp` | Row text → row edge | 11 | 11 | `.b3-hi-r .what` padding |
| `--h1-day` | Day row height | 40 | **52** | `.b3-hi-day` min-height |
| `--h1-cell` | Between columns | 16 | **22** | the list grid's column-gap |
| `--h1-kind` | Kind column width | 110 | 110 | the list grid |
| `--h1-who` | Who column width | 150 | **100** | the list grid |
| `--h1-undo` | Undo column width | 92 | **90** | the list grid |

**Eight moved; ten he left alone, which is an answer too.** All eighteen are now the board's boot defaults in `b3/state.js`, with a migration that drops any browser still holding the old ones.

⚠️ **Do not re-derive these from a screenshot.** `--h1-srchw` at 340 is the largest single change and it is deliberate: the search stops spanning the toolbar.

---

## 3 · The export drawer landing — M3, and the one he spoon-fed

This surface went through v1 → v2 → v3, and **v3 was scrapped**: *"revert back to v2 entirely."* v2 was then recovered from the session transcript, not rewritten from a screenshot. Everything below is v2 plus the five refinements he named, applied one step at a time.

### 3.1 What ships

```
Download a copy of what's live — one file per set.
[↺ Import it back to undo]   [⚠ Download one before anything permanent]

 ┌──────┐  MP builds                                      ┌────────────┐
 │ 125  │  [dioreo-mp-builds-2026-09-20.txt  ✎]           │ ⤓ Download │
 └──────┘                                                  └────────────┘
 ┌──────┐  DMZ builds                                     ┌────────────┐
 │   8  │  [dioreo-dmz-builds-2026-09-20.txt ✎]           │ ⤓ Download │
 └──────┘                                                  └────────────┘
   ☑≡     Pick builds…                                    ┌────────────┐
          Search and tick exactly what you want            │  Pick   ›  │
                                                           └────────────┘
```

### 3.2 Components — every one is PORTED, none is new

| Element | Component | Rule |
|---|---|---|
| Count square | `.b3-xf-sq` | The export file card's own square, which is itself the selection bar's `.b3-sd-count`. 40×40, 10px corners, fill from `--m`. ⚠️ **NOT `.b3-xf-h0 .b3-xf-sq`** — that is the EMPTY-state variant, sunk and unlit |
| Square figures | `--display` + `--tr-fig` | Big Shoulders at **700 / 19px**. One declaration serves the landing AND the card; they are the same chip |
| Mode accent | `MODE_HEX` | MP `#FF3B5C`, DMZ `#3DA5F5` — the masthead's own pair, set as `--m` on the row |
| Filename | `.b3-xf-fn` + `.b3-xf-fid` | The picker's rename chip, whole: the `--ok` tint, the pencil, the `.txt` held out of the field, click-to-rename |
| Download | `.b3-btn2.sm.go` | Unchanged — `--ok` fill, `--on-ok` ink |
| Pick | `.b3-btn2.sm.stage` | **New modifier**, built the way `.go` is: sets `--b3-fill` and takes its states from that |
| Hint marks | `.exs-facts` | New, and the only genuinely new markup on this surface |

### 3.3 The `.stage` modifier — the one thing Session 5 must not hand-copy

```css
.b3-btn2.stage{--b3-fill:var(--staged);--b3-under:var(--sunk);color:var(--ink);
  background:color-mix(in srgb,var(--b3-fill) 14%,var(--b3-under));
  box-shadow:inset 0 0 0 1px var(--b3-fill)}
.b3-btn2.stage:hover:not(:disabled){background:color-mix(in srgb,var(--b3-fill) 24%,var(--b3-under))}
.b3-btn2.stage:active:not(:disabled){background:color-mix(in srgb,var(--b3-fill) 30%,var(--b3-under))}
```

Three things about it are load-bearing:

1. **The recipe is `.pill.lead`'s** — a full-hue edge over a 14% tint of the same hue, `--ink` label, 24% on hover (app.css:4543, board.css:1604). `.b3-btn2` draws its edge with an inset shadow rather than a border, so that is the edge it gets.
2. **It CANNOT share `.go`'s state rules.** Those mix `--b3-fill` **74% toward white**, which is right for a solid and turns a 14% wash nearly white.
3. 🔴 **The tint mixes against `--b3-under`, never `transparent`.** Measured: the manifest's create verb sits on a flat `.panel rgb(23,30,36)`; this one sits over `.drawer.open`, which carries a background IMAGE — the mesh ground. A 14% mix toward `transparent` is 86% of whatever is behind it, so the same declaration is a different colour on the two surfaces. He saw it before I did.

### 3.4 Copy — three rewrites, and why each failed

| Version | Why it failed |
|---|---|
| *"One file per set, in the bot's own block format — paste it back into Bulk to restore. Take one before any one-way change."* | Three facts welded into one sentence, so it is an all-or-nothing read. **And "Bulk" is an Armory concept** — this landing is the SHARED panel, rendered by four drawers |
| *"The bot reads this exact file back" / "Take one before a one-way change"* | Both describe the system. "Reads back" is our word; **"Take one" has no object** |
| *"Imports straight back" / "Before one-way changes"* | Prepositional **fragments** — the warning was carried entirely by the icon beside it, which `/impeccable clarify` bans outright. "one-way" is a tier named in `ui/oneway.js` and nowhere the reader has been |

**Shipping copy**, all three parts non-overlapping — the lead says *what it is*, mark one *what it buys you*, mark two *when*:

- Lead (`.dw-lead.exs-lead`): **"Download a copy of what's live — one file per set."**
- Mark 1 (`rotate-ccw`): **"Import it back to undo"**
- Mark 2 (`triangle-alert`, `--warn-ink`): **"Download one before anything permanent"**

Each mark survives having its icon removed. "Download" is the word on the buttons, so lead, mark and control name the action identically.

⚠️ `exportPanel.js:77` records a hard constraint: *"one sentence, because a three-line paragraph makes the drawer 25px taller and moves everything in it."* The strip is **26px**. The lead adds a line — if that shifts the rows more than Session 5 wants, drop the lead to `--t-sm`.

### 3.5 Measured geometry

| | Value |
|---|---|
| Row inset | `padding: 13px 18px 14px 6px` — one relation, not three offsets; column 1 is fixed 64px so the left inset carries the square AND the text column |
| Buttons | **102.1px** natural (Download, no `width` at all — exactly as the panel draws it) · **102px** floor (Pick) · **34px** tall · `padding-inline: 12px` |
| Trailing chevron | `margin-right: -5px` — its 14px box carries ~5px of transparent bearing, so the ink sat 2.5px left of centre |
| Titles | `.exs-t b` at `--t-lg`; rows with a file chip get `position:relative; top:-3px` |
| Rename chip | 24px, both states, `flex:0 0 auto` + `min-height` — a bare `height` is a request a flex parent may shrink |
| Field width | `field-sizing: content` — the card's grid footer gave the editing label its width; a flex column does not |

---

## 3b · v70 → v77 — the span the README does not cover

🔴 **`README.md`'s round log stops at version 70** (*"the intake round"*, 2026-09-20 17:46 EDT). Everything below happened after it and exists nowhere else but this file and the kit's git.

### The intake round and its verdicts (2026-09-20 17:46 → 21:35 EDT)

He gave seven items, I fixed them, then he validated each one and **overturned most**.

| # | His item | His verdict | State |
|---|---|---|---|
| 1 | The export landing's three tiles are three different designs | ten more defects, then *"SO fucking bad"*, then **"revert to v2 entirely"** | v2 recovered **from the session transcript**, then his five refinements applied one step at a time — §3 |
| 2 | Horizontal lines intruding the container border | **still not fixed** (three attempts) | Now a real `border` — §4. **Unruled** |
| 3 | The weapon title tints alone on hover | **fixed** | closed |
| 4 | A decided fork still offered both options | **done** | `segOpts` reads the recorded pick; `p8` and `p9` transcribed |
| 5 · 7d | Spacing exposed as knobs | *"terrible, uninformative, unintuitive"* — `ListLab` already existed on this board | Rebuilt on `ListLab`'s own rows + **Save for Claude**. **Unruled** |
| 6 | H1's row glow ≠ the Armory manifest's | not fixed twice, then *"the glow's correct now in the actual browser"* | closed — it is `.wg-r:hover`'s recipe, not `.b3-wr`'s |
| 7a | The time rail's accent washed out | **partial** | back to full `--c`. **Unruled** |
| 7b · 7f | Kind chip · floating divider | **fixed** | closed |
| 7e | The date row's alignment | **bugged** | the chip was baseline-aligned in a fixed-height box; centred. **Unruled** |

⚠️ **Four items are UNRULED** — he never gave a verdict on the fix. Session 5 should treat 2, 5/7d, 7a and 7e as *built but unconfirmed*.

### Rounds 15–18 (2026-09-20 21:35 → 2026-09-21 00:02 EDT)

| Round | What landed |
|---|---|
| 15 | Container edges become a real `border` — §4 |
| 16 | The border edge · the rebuilt spacing lab · the export rebuild (later scrapped) |
| 16B | `isoLocal` — every rendered date was tomorrow's after 20:00 EDT |
| 16C · 17 | The v2 restore, recovered from the transcript rather than rewritten |
| 18A | The two dead H1 toolbar knobs — a specificity defect, not a wiring one |
| 18B | H1's filter labels right-aligned; the label column split into width + gap |
| 18C · 18D | EVENTS joins the label column; four search knobs |
| 18E | The lab's number boxes keep their native nudge arrows (I had suppressed them; L1 never did) |
| Steps 1–5 | The export landing: rename chip · count square · nudges · `.stage` · the hint marks |

### Two mechanisms this span created

1. 🔴 **The kit has its own git.** `local/pins2-board-3/redo/.git`, first commit `64b7a57`, one commit per round, no remote, a `pre-push` hook that refuses one, `shots/` excluded, README at `KIT-GIT.md`. **It exists because he asked for a revert and there was nothing to revert to.**
2. **The session transcript is the version store for anything gitignored.** This repo's heredoc contract puts the previous text into every `assert <anchor> in t`, so `~/.claude/projects/<slug>/*.jsonl` carries the exact prior state of anything a heredoc edited. codebase-memory does **not** (one current graph, no content history), and the artifact service's `ver` needs a `<unix>-<hash>` id that nothing enumerates.

---

## 4 · The class-level fixes — these are the reason the board took the rounds it did

Every one was found because a symptom was an *instance* of something larger.

| Fix | Class |
|---|---|
| **Container edges are a real `border`** | `outline` paints above descendants only within one stacking context, and an `::after` overlay only covers containers you remember to list — `search_code` found **361** `inset 0 0 0 1px` declarations. A border sits outside the padding box, so a child's box can never reach it. `.panel` never appeared in a screenshot for exactly this reason |
| **`isoLocal`** | `new Date().toISOString().slice(0,10)` is UTC, so from 20:00 EDT every rendered date was tomorrow's. 8 sites board-side, 36 across the kit |
| **`.exs-t span` → `.exs-t > span`** | A descendant selector reaching inside a component it knows nothing about, restyling the rename chip's spans |
| **`label{}` neutralised inside `.b3-xf-fid`** | app.css:669 styles every bare `<label>` as a form caption — `margin-bottom:5px` at (0,0,1), and it won because nothing on the chip said otherwise |
| **The file chip is `:is(.b3-xf,.exs-i)`** | 46 selectors widened. Same (0,1,0) weight, one set of declarations, two callers |
| **H1 toolbar gaps** | `html[data-b3-a1=fixed] .mt-r2` at **(0,2,1)** beat `.b3-hi .b3-hi-f` at (0,2,0), so two spacing knobs were dead while the lab reported values the page never used |
| **EVENTS joins the label column** | It is `.mlabel`, not `.b3-fgl`; `gates.css:237`'s `min-width:64px` at (0,3,1) beat the rule meant to size it |

🔴 **THE ONE HABIT THIS BOARD SHOULD TEACH SESSION 5:** four separate defects tonight were *"the declaration says X"* when the page said otherwise. **Ask the page which rule wins.** Iterate the sheets, iterate rules by index, skip `r.type !== 1` (a plain `CSSStyleRule` has an empty `.cssRules` in Chrome, so naive recursion swallows every rule), guard `matches()` in try/catch, and count a rule you already know matches so an empty result is distinguishable from a broken walk.

And: **measure the drawn ink, not the element box.** His rulers read 28/33 on the Pick button where the DOM read 28.4/28.4. Both were right about different things; only one of them was about what he sees.

---

## 5 · States, motion and accessibility

| Element | State | Behaviour |
|---|---|---|
| Rename chip | rest | `.b3-xf-fn:not(.editing)` — `--ok` tint, pencil at `--ink4` |
| Rename chip | hover | ink to `--ink2`, ground to `--sunk`, ring to `--ink4` |
| Rename chip | editing | `--focus` inset edge **plus** `0 0 0 3px` of `--ok` at 26% and a `16px -2px` fade at 40%; both callers |
| Rename chip | empty field | falls back to the generated name — the chip can never be blank |
| Download | hover / press | `.go`'s own ladder off `--b3-fill` |
| Pick | hover / press | 14% → 24% → 30% of `--staged`, mixed against `--b3-under` |
| Row glow (M1/H1) | hover | `.wg-r:hover`'s recipe, not `.b3-wr`'s — three fixed-pixel ellipses inside the row, all in `--c` plus a `--realm-c` layer, no blend modes |
| Export file card | fold | 420ms `cubic-bezier(.32,.72,0,1)`, flex-grow ALONE — transitioning `min-height` too measured 33.3ms/frame against 16.7 |

- Every count cell carries `aria-label="<n> <unit>"`; the square itself is `aria-hidden`.
- The rename chip keeps its accessible name across both states (`Rename <file>` / `File name for <set>`).
- Reduced motion drops the chip's glow transition and the fold's easing.
- ⚠️ **The phone is not a review surface for these boards** — settled 2026-09-20 12:02 EDT. Do not spec mobile from board 3-E.

---

## 6 · What is NOT answered

| Open | Where it goes |
|---|---|
| `p10` · Small text | **Session 4 · G1** — the rewrite, the apply map and the exemptions |
| The H1 "drastic redesign" | Deferred by him, not rejected. Time rail ships |
| Outline tag style (`p2sty`) | Kept in the files, documented, as a possible future switch |
| Solid export ground (`p5bg`, `xbg`) | Kept in the files as a future portal **setting**, per thread `bd09c832` |
| The lab's three columns | Two-line labels put the columns out of step and leave a void beside "The columns". Cosmetic, on the instrument, not on a shipping surface |
| gates.css:813/815, :352 | `transition: padding` / `max-width`, and a `side-tab` accent stripe on `.b3-byp-c` — flagged by `impeccable detect`, pre-existing, untouched |

---

## 7 · How Session 5 closes a surface

Per §5d.2, unchanged — a side-by-side against the board at 1282×888, every value in this file read back with `getComputedStyle` and written beside the board's. A differing value is a defect unless a ledger row cites it.

Two additions this board earned:

1. **Read the value off the PAGE, not off this file's table.** Every number here was measured, but a number in prose is a copy of state that nothing updates.
2. **The board is at artifact v77 and the kit's git is the only other copy.** If a value here and the board disagree, the board wins and this file is the defect.
