---
kind: plan
status: live
---

# Session 4 · the spec board, finished for Builder-2

*Written 2026-10-08 16:24 EDT by Session 4's lead. Parent: [the batch-2 plan](2026-09-13-portal-pins-batch-2.md) §5c — the spec board is Session 4's own standardization artifact (Step 4g's "its OWN artifact", Step 5's "board 4"). Artifact `QWFuca9DcrwLFuYXNbhyhQ`, titled "spec-board" from v21 ("Element Library" once complete). Builder-2: `local/pins2/s4/builder-2` (this Mac only, never pushed).*

## His words that shape this plan

| When (EDT) | His words | What it means here |
|---|---|---|
| 2026-10-08 15:36 | "thoroughly update the spec-board with things like the other rails, chips, buttons, fields, etc etc, pop-ups, datepicker" | every element Builder-2 draws gets a spec-board section |
| 2026-10-08 15:36 | "invoke sequential-thinking before each task, minimum 3+ thoughts asking honestly difficult questions … keep your working style preferences as per this repo in check" | the block under "Before every step" |
| 2026-10-08 16:22 | "builder-2 for now, the full realms scope after everything from builder-2 is more or less settled" | Builder-2's nine gates and its drawers only |
| 2026-10-08 16:22 | "no need to physically update the builder-2 board yet. the edit itself can be collective at the end" | Builder-2 is not edited; its changes collect in the ledger |
| 2026-10-08 16:22 | "for now...'spec-board'. once completed, then it can be renamed again to element library" | the rename in Step 0 |
| 2026-10-08 16:22 | (tuned Builder-2 since Oct 6?) "no." | `work/lead/state4/…/state.json` is his current state |
| 2026-10-08 16:24 | "just make a temp ledger for yourself or something. dont rely on deferred list as your ledger." | the decisions draft below, separate from the deferred list |
| 2026-10-08 15:27 | eight field asks (the "6" label reads as the radius; search.filter misaligned, glass not 16, its hover and fill differ; × and count don't light the field; padding 12 vs 14; attachment narrow; × and ⌄ icon size) | Step 1 |
| 2026-10-08 15:30 | "what ink are the outline, the magnifying glass, the dark fill, the placeholder text, the typed text using?? … similarly for other sections" | inks on every section (Steps 1, 2, 4) |

## Before every step — 3+ thoughts, honestly hard

1. Which step am I on, and is my next call part of it?
2. Are all independent calls in one message? Is every edit one `python3` heredoc (assert per anchor, a print per edit, the gate on `&&`)?
3. Routing: `read_smart` for any file I won't change with a direct Edit (first read too) · `ctx_execute_file` for a question or a line range · codebase-memory for code · `ctx_search` for prose · `rg` only for a literal no index covers. A linksee routing warning is a stop, not a note.
4. What will he find that I didn't check: every state, every member of the family against the others, the relations, 390 px?
5. Am I about to draw a design no rule covers? Then it goes in the decision queue as a picture; drawing it is not deciding it.

No prose between the first tool call and the final message. A step is ticked in the same write as its work.

## Not in this plan

- Editing Builder-2: every difference goes in the ledger `builder-2/spec-img/board-changes.json`, applied in one collective update at the end (his 16:22).
- Season, Access, Analytics, Home, Review and the rest of the portal: after Builder-2 settles (his 16:22). Their census is `docs/claude/s4/2026-10-02-s4-realm-census/*.json` (2026-10-02).
- The parent plan's §10.6: written when he closes the standardization board (§10.6's own note). Until then the decisions draft `docs/claude/s4/2026-10-08-s4-standardization-ledger.md` holds each settled element as a §10.6-shaped row (element · value · surfaces · exemptions · his words), updated in the same write as each ruling. The deferred list is not the ledger.
- Push, PR, merge: each needs his word restated at the moment.

## Inputs — read, never re-derived

| What | Where |
|---|---|
| The rules C0–C12 | `docs/claude/s4/2026-10-08-s4-conventions.md` |
| His rulings, verbatim and dated | `docs/claude/s4/2026-10-07-s4-button-system.md` |
| Every control and text style Builder-2 draws, counted 2026-10-08 | `work/lead/inventory.json` (`inventory.cjs`) |
| Every reachable state, resolved values | `docs/pins2/final/board4-spec/states.md` |
| Components and who renders them | `docs/pins2/final/board4-spec/components.md` |
| Hover recipes, 523 controls (2026-10-02, before V25–V28) | `docs/claude/s4/2026-10-02-board4-kit-hover.md` — re-measured for each family drawn, never copied |
| Every string on the eight realms, with roles | `docs/claude/s4/2026-10-02-s4-small-text-draft.md` |
| The fields, measured 2026-10-08 | `work/lead/field-inks-off.json`, `field-inks-armory.json` |

## Steps

### Step 0 · this plan, the rename, the two ledgers

> ⟦ONE MESSAGE⟧ the whole step.

- [x] This file; `docs/pins2/README.md`'s plan row names it; the handoff's RESUME HERE points at the first unticked step; the deferred list's spec-board entry names this file.
- [x] Rename: `spec.html` `<title>` and the page's h1 "C1 Button Spec" → "spec-board".
- [x] `2026-10-08-s4-standardization-ledger.md` seeded with every element settled so far (sizes, nesting, styles, Still, flags, icon sizes, pills and filter chips, rails, the BAL-27 chip, labels, fields, text scale, gaps, names), each with his words and date.
- [x] *(his 16:33 EDT: "local/ is for throwaway stuff")* Session 4's records moved to `docs/claude/s4/`: the handoff (a stub stays at `local/pins2/s4/handoff.md`), the conventions, his rulings, the ledger, the small-text draft, the realm census, the kit measurements. Probes, snapshots, screenshots and Builder-2 stay in `local/`.

**Check:** `npm run docs:audit` exits 0. **Done:** the handoff and the deferred list name this file; the draft has a row per settled element.

### Step 1 · the fields (his 15:27 asks)

> ⟦ONE MESSAGE⟧ the spec.css and spec.js edits, then the probe and the check chained.

- [x] Every field's leading content sits 14 from its edge (C0, C1 L padding 14): the glass, the category dot, a bare placeholder; words 10 after an icon (C1).
- [x] search.filter: glass 16 and centred (the kit's `margin-top: -6px` was written for 12); fill, outline and hover the other fields' (fill `#04070A 52%` on `--sunk`, outline `--ink` 12% → 24% on hover); the hover lights from anywhere over the field, its × and count box included.
- [x] The attachment row: its label and a field that shows "Search attachments" whole.
- [x] The field gauge: the button-to-edge 6 sits under the field beside the 32; expected values drawn (14 · 16 · 10 · 6) so a miss shows red; a centre check on the leading icon; a clipped placeholder flagged.
- [x] Inks per field, measured and drawn as swatches: outline, fill, glass, placeholder, words, in-field icon, count box; the outline on hover.
- [x] *(presentation, 2026-10-08 17:38 EDT)* Three designs for the inks and states rejected; his fallback accepted (17:35 EDT): each field measured once plus ONE ink row for the class in the Styles rows' shape. Published as spec board v21.
- [x] Ledger rows for what Builder-2 still draws differently: field padding 12 (13.5 on the search) → 14; search.filter fill, outline and hover → the field look; the hover from the × and the count.

**Check:** `field-inks.cjs` on spec and board: every field agrees on fill, outline and hover (words, ×, count, chevron), inset 14, glass 16 centred within 0.5; `spec-check.cjs` fields section; I look at `spec-check/sec-fields.png`. **For him (a picture):** Q1.

### Step 2 · inks named, and the family check

- [x] *(landed in Step 1, 2026-10-08 16:59 EDT: the field inks needed it)* One namer: an exact token (rgb within 1) · "token N%" for a translucent token · a two-colour mix solved only over the kit's tokens and literals · else the hex with "≈". Proven first on known cases: the field fill reads "#04070A 52% on sunk", its outline "ink 12%", the × hover fill with armory "r-armory 14%", the count box with the accent off "ink3 14%".
- [ ] Styles' recipes, Labels and every section speak token names (the grammar's value names), not "grey / white".
- [ ] `relations.cjs`: given a family's members on the spec page, compares height, corner, icon box and centre, insets, gaps and inks at rest and under a real mouse. Trusted only after it reports v20's field faults on Builder-2 `2e22d20`.

**Check:** the known cases print exactly; `relations.cjs` on `2e22d20` reports at least the fill, hover, inset and glass-centre faults; on the fixed page, none.

### Step 3 · the text census (deferred item 9)

- [ ] From `inventory.json`, the text inside Builder-2's gates and drawers only (never the builder's own panels: `sx-*`, `bd-*`, the C1 table): grouped by family · size · weight · case · tracking · line height · ink token; count, gates, samples.
- [ ] A section: each style drawn at its measured values with real strings from the board, its count and gates, its small-text role from `small-text-draft.md`, an off-scale size marked against C5.

- [x] *(data, 2026-10-08 17:38 EDT)* `local/pins2/s4/builder-2/spec-img/text-census.json`: 261 family · size · weight · case · tracking · line · ink combinations inside the gates and drawers, grouped into 109 styles (inks folded in).
- [x] *(section, 2026-10-08 17:54 EDT)* The census hung on the Text sizes ladder (his "huh?" at 17:44: the layout was mine to decide): every style at its decided size (his 17:44 moves), drawn in the board's own words, aligned columns — weight · runs · inks · "was N" — where-used in the row's tooltip, the long tail folded. Published as spec board v22.

**For him (pictures):** Q2 and the grammar for non-label text. **Publish v21** (Steps 0–3).

### Step 4 · the families still missing (Builder-2 only)

| Group | Families (the board's classes) |
|---|---|
| Buttons, more | row icon buttons `wg-share` `wg-del` `wg-code` `wg-fbtn` `cx-edit` (44) · card edit and remove `g-edit` `pb-del` (28) · undo `b3-undo` (28) · close `x` `b3-x` `b3-pc-x` · text buttons `b3-btn2` go · ghost · quiet · dang · sm · stage · header sort `sortbtn` · date buttons `pb-dbtn` `b3-endbtn` `g-chipbtn` · colour buttons `acx-new` `acx-ib` |
| Chips and tags | problem and image chips `b3-fchip` · Repairs and History filters `b3-fc` (.warn .none) · `chip.incchip` · tier radios `f-tier` · badge toggles `f-bt` · pills `pb-pill` `b3-tk-agec` `g-soon` `bc-rep` · tags `b3-fh-tag` · end options `b4-popw` · the count box as a chip (Q6) |
| Segmented and switches | state segs `pb-seg` · tabs in `.seg` · the view rail `b3-sd-vt` · source and mode radios `f-src` `mh-mode` · the switch `pb-sw` · the stepper `pb-step` |
| Inputs | the textarea · the mono field `f-in.mono` · the colour picker `acx-sv` `acx-hue` `acx-s` · the date picker `b3-datepop` (`b3-dp-d` .out .today, `b3-dp-nav`) |
| Overlays | the problem pop-up `b3-pc` · the hint `b3-hc` · drawers `drawer` `drawer.wide` · the toast · Confirm (`ui/overlay.js`) |
| Data display | tables `mtable` `cx-t` · cards `g-card` (never · upcoming · staged), the loadout card `dcard`, the Discord preview · meters `b3-meter` `bcbar` `cmeter` `b3-tk-bar` `pb-meter2` · History rows `b3-hi-open` |

Each group is one phase, never one family per cycle:

- [ ] ⟦ONE MESSAGE⟧ the probe grows by the whole group: each family's chain, rest and real-mouse hover and press, and every state the board reaches (from `states.md`: today, selected, out of month · on, off · warn, none · staged, upcoming, never).
- [ ] ⟦ONE MESSAGE⟧ one write: the group's section in its own module (`spec-<group>.js`, imported by `spec.js`; the nav and spec-check's section ids grow with it). Each family drawn with its board component in its board chain, gauged against its size row (C0–C3), with its inks, its states, a proposed name (C11, marked proposed) and "used in" from the inventory. A pop-up the page can't hold in place is shown pinned in a stage; if that fails, a labelled crop of the board — never redrawn by hand.
- [ ] Check: `relations.cjs` over the group; `spec-check.cjs`; I look at every section picture in every state, and at 390 px.
- [ ] Ledger rows for what Builder-2 draws off the rules; the decision queue for what no rule decides; `2026-10-08-s4-standardization-ledger.md` rows once he settles a family.

**Order:** Buttons → Chips and tags → Segmented and switches → Inputs → Overlays → Data display. **Publish** after every two groups (v22, v23, v24).

- [x] *(group 1, Buttons, 2026-10-08 18:42 EDT)* The probe (`board-dom.cjs`: rest, two Try states, three drawers; the drawn box, inks at rest and on hover, the builder's geometry rules) · the section in `spec-buttons.js` · `relations.cjs --family buttons` and `spec-check.cjs` clean · a ledger row for every miss. States: each clone is live (hover and press work on the page) and its look is its style's, drawn once under Styles, so no per-member state pictures (sameness drawn once). Used in: a one-word board place beside each name.
- [x] *(group 2, Chips and tags, 2026-10-08 19:02 EDT)* `chip-sweep.cjs` (every small drawn box with words inside the gates and drawers, six states) → `board-dom.cjs chips` (32 families; a typed search for the count box) · `spec-chips.js` on the shared engine (`makeOnBoard` in `spec-buttons.js`) · `relations.cjs --family chips` (the sweep tied to the section) and `spec-check.cjs` clean · Q7 and Q8 queued; tag misses held by one row until Q8. Published as spec board v23.
- [x] *(group 3, Segmented and switches, 2026-10-08 22:26 EDT)* `seg-sweep.cjs` → `board-dom.cjs segs` (13 families; the gate scenario picker set aside as board chrome) · `spec-segs.js` with a rail gauge (C3: a rail's row is one size up from its selected segment, inset 6 · 4 · 2) · `relations.cjs --family segs` 0 faults · ledger rows for every miss. Published as spec board v30.
- [x] *(group 4, Inputs, 2026-10-08 23:49 EDT)* `input-sweep.cjs` → `board-dom.cjs inputs` (14 families) · `spec-inputs.js` with a field gauge (C0, C1 L, C13), the stepper as a container on the field ground (C3), the colour and date pickers drawn whole with their parts measured, and a today 36 · M 32 · L 44 switch on the date picker's days · `relations.cjs --family inputs` 0 faults (and buttons, chips, segs, fields 0) · ledger rows `txarea` `srchgap` `step` `dpnav` `dpday` `bnprefix`, covers on `fieldr` `fpad` `fwords` · Q9 and Q10 queued. Published as spec board v31.
- [x] *(group 5, Overlays, 2026-10-09 00:01 EDT)* `overlay-sweep.cjs` (every floating surface in the board's states, a tooltip state included) → `board-dom.cjs overlays` · `spec-overlays.js`: the drawers' frames measured in a table (a drawer is too large for a card), their header strips, the problem pop-up and the toast drawn whole with their parts measured · tooltips are off across the portal (his 2026-09-11 14:20 EDT) and no Builder-2 state opens Confirm, so neither is drawn · `relations.cjs --family overlays` 0 faults (inputs, segs, chips, buttons, fields 0) · Q11 queued. Published as spec board v32.
- [x] *(group 6, Data display, 2026-10-09 00:15 EDT)* `data-sweep.cjs` → `board-dom.cjs data` (the two tables' rows and cells read as parts) · `spec-data.js`: the Broadcast manifest and Compare tables measured in a table; History's rows, the meters, the colour bar, the four announcement cards, the loadout card and the Discord preview drawn whole with their parts measured · `relations.cjs --family data` 0 faults (all seven families 0) · ledger row `hirow` · the page now declares utf-8 (its stylesheets' bullets read as mojibake without it) · Q12 queued. Published as spec board v33. **Step 4 is complete.**

### Step 5 · records, every phase

- [ ] In the same write as the work: the handoff's CURRENT STATE, `button-system.md` (his rulings), `conventions.md` (a ruling that sets a rule), the ledger, `2026-10-08-s4-standardization-ledger.md`, this plan's ticks.
- [ ] A Builder-2 commit per phase (never pushed); a main-repo commit for the tracked files (never pushed).

## The decision queue — his, each shown as a picture first

| # | Question | Why no rule decides it | Status |
|:-:|---|---|---|
| Q1 | The category dot's slot in a field: 8 + 10 (words at 32) or the 16 icon slot (words at 40, in line with the weapon field) | C6 covers chips, not fields | settled 17:45 EDT: B, the 16 icon slot |
| Q2 | Off-scale text: 12 · 14 · 10 · 12.5 · 60 | C5 has none of them; only 17 → 15 and 19 · 20 · 22 → 21 were ruled | settled 17:44 EDT: 12 → 11 · 14 → 13 · 10 → 9 or 11 by use · 12.5 → 11 or 13 by use · 16 → 15 · 60 → 58 |
| Q3 | The free-standing 28-tall controls' size row | his 2026-10-07 table dropped the old 28 row; nested ones follow C3 | settled 2026-10-08 19:43 EDT: 28 → M 32, 40 → L 44; the selection bar's code, status chip and × → M 32 (2026-10-08 19:58 EDT) |
| Q4 | Names for the new types: switch, stepper, date picker, colour picker, pop-up, drawer, toast, table, card, tag, meter, tabs, segmented | C11 needs a type word | open (Step 4) |
| Q5 | Paint's definition | parked by him | parked |
| Q6 | The count box, designed as a chip | his: "once we work on all the chips" | Step 4, Chips and tags |
| Q7 | The badge's box height: 24 on the Manifest (`b3-bdg`, 9px), 20 in Compare (10px) | R11 names the label, not its box | open (Step 4, 2026-10-08 18:55 EDT) |
| Q8 | Whether tags and chips that are not controls follow the control size rows (C0–C2) | C0 names controls; C4 covers pills and filter chips only | his 2026-10-08 19:43 EDT: "unsure right now because i want to redesign some of them a bit" |
| Q9 | The colour picker's parts: the square (200 × 138), the hue bar (12 on a 44 click strip), the swatches (22.7), the panel's corner (10) | no rule sizes a picker; a swatch is a button off the size table | open (Step 4 group 4, 2026-10-08 23:46 EDT): drawn whole with its parts measured |
| Q11 | One corner and one padding for every floating surface: drawers 10, the toast 6, the date picker 12, the colour picker's panel 10, the problem pop-up 0 with its arc | no rule sizes a floating surface | open (Step 4 group 5, 2026-10-09 00:01 EDT): measured in the Overlays frame table |
| Q12 | Data display's sizes: History's rows (48 and 42), the announcement cards' corner (10) and the loadout card's (8), the meters' heights (4 · 6 · 16) | no rule sizes data display | open (Step 4 group 6, 2026-10-09 00:15 EDT): measured on the Data display section |
| Q10 | The date picker's day: today 36, M 32 or L 44 | 36 is off the size table; C0 puts a control on a row, but which row is a judgement | open (Step 4 group 4, 2026-10-08 23:46 EDT): a switch on the section lays each on the clone |

## Cost

About 25–40 turns for Steps 0–5 *(my estimate, 2026-10-08 16:27 EDT)*; each report counts the turns its phase took.

## Audit log

### Falsification pass, 2026-10-08 16:24 EDT — "where is this plan wrong?"

| # | Where it could be wrong | What the plan does about it |
|:-:|---|---|
| 1 | §10.6 rows written now vs at the close | §10.6's own note says at the close; `2026-10-08-s4-standardization-ledger.md` holds them until then (his 16:24: not the deferred list; his 16:27: tracked in docs/claude) |
| 2 | The inventory counts the builder's own panels | only elements inside a gate, a drawer or a dialog count |
| 3 | A new instrument passing vacuously | the namer and `relations.cjs` each reproduce known answers or known faults before use |
| 4 | Pop-ups are fixed or portalled and won't sit in a section | a pinned stage, else a labelled crop of the board, decided here before it's hit |
| 5 | One family per cycle creeping back | Step 4 runs per group: one probe, one write, one check |
| 6 | `kit-hover.md` predates Builder-2 V25–V28 | hover is re-measured with a real mouse for each family drawn |
| 7 | A proposed name reading as a decided one | every proposed name says so until he answers Q4 |
| 8 | `spec.js` is already 59 KB in one file | each new group lives in its own module |
| 9 | My earlier "§10.6 empty means Session 5 gets nothing" | partly wrong: §10.6 is written at the close by design; the gap was a ledger of settled rows, now `2026-10-08-s4-standardization-ledger.md` |
