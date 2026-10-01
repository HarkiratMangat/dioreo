---
kind: reference
status: live
---

# Handoff spec — board 1 G9 (New build) and G8 (Post an announcement)

*Written 2026-09-15 22:51 EDT. Board 1 is `index.html` beside this file: G9 at lines 348–516, G10 at 517–600, G8 at 601–676. Portal counterparts located with `codebase-memory`. Format follows the `design:design-handoff` skill.*

## Why this document exists

Harkirat, 2026-09-15 22:45 EDT: *"the new manifest design for the armory was ported over nearly 95% identical to what the board 2 mockup showed me. Why? That's the question isn't it."*

It is, and the answer is structural.

| Surface | What shipped with it | How the port went |
|---|---|---|
| **Board 2 G4** — Armory manifest | `resolved-spec.md`, 3,316 lines of winning declarations and computed values | **~95% identical.** Pins on it are refinements: border uniformity, hover target, spacing |
| **Board 1 G9 / G8** — the drawers | a rendered page and prose notes. **No spec** | *"This looks NOTHING like the Design Board render"* (pin 2) · *"DOES NOT meet my expectation and standards"* (pin 48) |

But the spec is only half of it. The other half is why a spec was **sufficient** for G4 and would **not** have been for these two:

**Board 2's manifest and the portal's share one DOM shape.** `pb-*` → `wg-*` is close to a 1:1 rename — `.pb-fold`/`.wg-fold`, `.pb-rb`/`.wg-r`, `.pb-igb`/`.wg-igb`. A table of values maps straight onto it, which is exactly what a value spec is good at.

**The drawers do not correspond at all.** The portal's New Build drawer is a different component with different controls, different semantics and a missing button. A value spec cannot express "this should be a combobox, not a datalist". That is why these two need a STRUCTURAL handoff, and why this document leads with structure and puts values second.

🔴 **So the rule this establishes: a value spec is enough when the two implementations already agree structurally, and is worth nothing when they do not. Check which case you are in before writing one.**

---

## Handoff spec: G9 · New build drawer

### Overview

One drawer that creates one build or many. An admin opens it from the Armory masthead, fills a weapon and a label, optionally pastes a gunsmith code that fills the attachments for them, sets badges and tier, attaches an image, and stages the result. A second view in the same drawer takes a bulk paste in exactly the format Export writes.

**Portal implementation:** `portal/ui/armory.js` — `AddBuildPanel` (475–600), `BuildEditor` (664–808), `BulkCreatePanel` (1124–1192), `WeaponSearch` (877–915); shell `portal/ui/overlay.js` `Drawer` (11–79).

### Structure — element by element

Board scope: `aside.drawer[aria-label="New build"]`. Board 1 has no gate ids; scope by the drawer's own `aria-label`.

| # | Element | Board 1 | Portal today | What must change |
|---|---|---|---|---|
| 1 | Mode + create switch | `.pb-bar` holding `.pb-seg.pb-mode` (MP/DMZ), a `.pb-div` rule, then `[data-seg=many]` — **Add build · Bulk create** | `.modesw` (role=group, "Which armory this build is for") only | **Add the second segment and the rule between them.** Bulk create is reachable from inside the drawer, not a separate entry point |
| 2 | Weapon | `.pb-combo` — `input[role=combobox][aria-expanded][autocomplete=off]` with a drawn menu | `input#ab-weapon` + `list="ab-weapon-dl"` | **A datalist is not a combobox.** No styling, no filtered menu, no keyboard model of our own. Build the combobox |
| 3 | Category | `.dwfield select` | `select#ab-category` | agrees |
| 4 | Label | `.pb-labelf` = `.pb-bno` (`small` BUILD + `b.pb-num`) locked to the left of `input#nb-label` | `.bf-buildno-wrap` + `.bf-buildno` | Verify the number is **inside** the field, not beside it |
| 5 | Gunsmith code | `.pb-codefield` = `input#nb-code` + `button.pb-copy` | `.dwfield.code-field` + `button.chip` | Portal's copy control is a generic chip; board draws a field-integral button |
| 6 | Code result line | `.pb-hfill` — *"4 of 5 filled from the code"*, with a wand icon, on the Attachments heading | `.bf-n` | Words are Session 4's; the **placement on the section heading** is this spec's |
| 7 | Attachments | `.pb-atts` → one `.pb-att` per slot: `.pb-slot` name + `input.ati` + `button.pb-rmv`. Auto-filled rows carry `.pb-auto` | one `.atlist` container | **Per-slot rows with a named slot and a remove control.** The auto-filled state must be visible |
| 8 | Open slot search | `.pb-ac` → `input[role=combobox][aria-expanded=true][aria-controls]` + `ul.pb-menu[role=listbox]`, options with `aria-selected` and `<mark>` on the matched span | not present | **Build it.** A slot the code knows but cannot name stays open and lists only that slot's attachments |
| 9 | Badges | `.pb-badges` → `button.pb-tog[aria-pressed]`, TOXIC as `.pb-tox` | `.bf-badges` → `label.bf-tog` wrapping `input[type=checkbox]` | **A pressed toggle, not a checkbox.** Different semantics and different visuals |
| 10 | Tier | `.pb-rank[data-rank=MP]` "Tier in AR" + `[data-seg=rank][data-tier]` segmented, `[data-rank=DMZ]` "Range tier" swapped by mode | `.dwfield.bf-rank` + `select#ab-rank` | **Segmented, not a select**, and the label changes with mode |
| 11 | Image | `.pb-imghead` (heading + `.pb-seg.pb-small` Upload-or-link / Existing key) then `.pb-imgview[data-imgview]` → `.pb-drop` = `.pb-shot` preview + `.pb-dropcol` (`.pb-file` name/size, Key field) | `.segsw` + `.imgdrop` + `.imgpreview` + `label.chip.filedrop` | Two named views; the preview sits **beside** the fields |
| 12 | Found echo | `span.pb-echo` — check icon + *"Found in gun-builds"* | `.imgkey` | A result line per field is the board's whole idea (see §Content) |
| 13 | Discord preview | `aside.bed-side` → `.bed-sec h5` "In Discord" → `.dcard.lc` with `h6`, `.lc-badges`, `.lc-rule`, `.lc-h`, `ul.lc-att li code`, `.lc-code`, `.lc-foot`. One per mode, `--c` set to the weapon accent | **absent** | **Build it.** The drawer shows what the build will look like in Discord while you fill it |
| 14 | Footer | `footer.dw-f` — `.btn.no` Cancel · `.btn` **Stage and add another** · `.btn.go` Stage this MP build | Cancel + `.btn.go` | **The middle button does not exist.** Verified: "Stage and add another" occurs nowhere in `portal/ui` |

### Bulk view — `.pb-view[data-view=1]`

| Element | Board 1 | Portal |
|---|---|---|
| Editor | `.pb-ed[role=textbox][aria-multiline=true][contenteditable]` with one `.pb-blk[data-o]` per build, coloured rail per outcome | `BulkCreatePanel` (1124–1192) |
| Head | `.pb-edhead` — label + *"4 builds · 32 lines"* | — |
| Tally | `.pb-tally` — four cells `[data-o]`: new · updated · saved with a warning · can't be read | — |
| Result rows | `ol.pb-rows` → `li.pb-row[data-o]` with `.pb-rt` (weapon, build, `.pb-ln` line range), `.pb-oc` outcome word, `.pb-rd` detail — a `<s>`/`<b>` before-and-after for an update, `.pb-sl` slot list for a new build, `.pb-msg` for a warning or an error | — |
| Footer | `.why` *"Block 4 is skipped"* + Cancel + Stage | — |

**`data-o` is the outcome vocabulary and it is load-bearing:** `upd` · `new` · `warn` · `bad`. Rail colour, tally cell and result row all key off it.

### Behaviour — the part no screenshot carries

Straight from the board's own `.pb-note` blocks, which is where this has been sitting unread:

1. **`bar`** — MP/DMZ, a rule, then Add build · Bulk create.
2. **`build`** — the build number is **locked into the Label field**.
3. **`code`** — code comes first. Pasting it **fills every attachment it can**: the digit names the slot, and a digit–letter pair seen on another build names the attachment.
4. **`search`** — a slot the code knows but cannot name **stays open**, and its search **lists only that slot's attachments**.
5. **`DMZ`** — DMZ builds take **up to nine slots and no gunsmith code**.
6. **`tier`** — "Tier in AR" takes the tier's colour: gold for Best, blue fading through Top 3–5.
7. **`bulk`** — the paste is **exactly what Export writes**. Each build's lines share a coloured rail; its result names the lines. Readable builds save even when one block cannot be read.
8. **`order`** — slots list in **the display order set 2026-07-21**; the code's digit only says which slot a pair fills.

### States

| Element | State | Behaviour |
|---|---|---|
| Attachment row | auto-filled | `.pb-auto` — visibly distinct from one typed by hand |
| Attachment row | open slot | no value, search active, menu listing that slot only |
| Drawer | mode = DMZ | `[data-only=DMZ]` sections show, `[data-only=MP]` hide; code section gone; nine slots |
| Tier | by mode | `[data-rank=MP]` "Tier in AR" vs `[data-rank=DMZ]` "Range tier"; the other is `hidden` |
| Image | two views | `[data-imgview=up]` upload-or-link · `[data-imgview=key]` existing key, with a found echo |
| Bulk block | four outcomes | `data-o` = `upd` · `new` · `warn` · `bad` |
| Footer | blocked | `.why` states the reason ("Block 4 is skipped") |

### Accessibility — already declared on the board, keep it

`aside.drawer[role=dialog][aria-label]` · weapon `input[role=combobox][aria-expanded][aria-controls]` with `ul[role=listbox]` and `li[role=option][aria-selected]` · badges `button[aria-pressed]` · segments `button[aria-pressed]` · bulk editor `[role=textbox][aria-multiline=true][aria-label]` · every remove button `aria-label="Remove <attachment>"` · the drop preview `[role=img][aria-label]`.

⚠️ The portal's checkbox-and-select substitutions **change the announced semantics**, not just the look. A checkbox announces checked/unchecked; a toggle announces pressed. Porting the visuals without the roles leaves the two disagreeing.

---

## Handoff spec: G8 · Post an announcement drawer

### Overview

Compose an announcement, see its delivery budget, attach a banner, set when it starts and ends, choose how many times each player sees it, and preview it as Discord will render it. Board 1 ships **two states deliberately**: `Filled` and `Bad link, short window`.

**Portal implementation:** `portal/ui/broadcast.js` — `PostForm` (300–423); date parsing `portal/ui/composer.js` `SmartDate` (21–58).

### Structure

Board scope: `aside.drawer[aria-label="Post an announcement"]`.

| # | Element | Board 1 | Portal today | What must change |
|---|---|---|---|---|
| 1 | Eyebrow | `.dw-eye` — `announcement.post · tier 1` | present | agrees |
| 2 | Text | `.dwfield` + `textarea[rows=4]` | `textarea#post-text[rows=4]` | agrees |
| 3 | Budget meter | `.pb-meter2[aria-label="Delivery budget"]` → `.cmeter` with **two** `<i>` fills (others dim, this one full) + `<b>3,180</b> of 6,000 left` | `.cmeter.bcast` + `.meter-note`, one fill | **Two fills.** The 6,000 is shared across every live post; the meter must show the others' share behind yours |
| 4 | Banner | `.pb-banner` = `.pb-th` thumbnail + input, with `.pb-echo` showing `1600 × 900` | `.banner-row` + `.banner-thumb` + `.banner-echo` | Structure agrees; check the echo carries the **dimensions** |
| 5 | Starts / Ends | `.dw-grid2` with `.pb-lrow` label rows; `.dwfield.pb-endf[data-never]` | `.dw-grid2.bcast-dates` + `.dwfield.ends-field` + `.never-ends-field` | Verify the two sit on one grid with `gap: 0 16px` |
| 6 | Never ends | `button.pb-sw[role=switch][aria-checked]` + `.pb-swt` — **beside** Ends; turning it on replaces the date | `label.seg-sw-inline` wrapping `input[type=checkbox]` | **A switch, not a checkbox**, and it must replace the date field |
| 7 | Show each player | `.pb-rep` → `.pb-step` (Fewer / `<output>` / More) **and** `.pb-cards[role=img]` — one `.pb-mini` per showing, as the post appears in Discord, with a **1 a day max** tag | `.repeat-row` + `.stepper` (`.step-btn`/`.step-val`) + `.clock-tag` | **The per-showing cards do not exist.** The stepper alone loses the whole idea |
| 8 | Discord preview | `aside.bed-side.pb-card` → `.dcard` with `.pb-h`, `p`, `.pb-ts`, `.pb-img2` | `.post-prev` with `.post-prev-banner`, `.post-prev-text`, `.post-prev-when` | Different class family; compare rendered values once structure matches |
| 9 | Footer | `.dw-f` — Cancel + `.btn.go` Stage post | present | agrees |

### Behaviour

From the board's own notes:

1. **`budget`** — Repairs' thin meter for the 6,000-character limit **shared by every live post**: dim pink for the others, full pink for this one.
2. **`10.3·2`** — Banner link with its thumbnail and size; **a dead link shows orange**.
3. **`never`** — Never ends is a **switch** beside Ends; turning it on **replaces the date**.
4. **`10.3·3`** — Show each player: one small card per showing, the way the post appears in Discord, and a **1 a day max** tag. **Cards that cannot fit** before the end date are drawn differently.
5. **`10.3·4`** — In Discord sits **beside** the fields, not below them.

### States and edge cases — the board ships the error state, so build it

| State | Board 1 | Detail |
|---|---|---|
| Filled | `[data-view=0]` | banner echo `1600 × 900`, 3,180 of 6,000 left, 3 showings |
| **Bad link, short window** | `[data-view=1]` | `.pb-th.pb-bad` warning thumbnail · `input.pb-bad` · `.pb-echo.pb-warn` *"didn't load"* · `.pb-img2.pb-bad` in the Discord card · `.pb-cards.pb-tight` with `aria-label="Only 5 of 7 showings fit before it ends Sep 20"` |

🔴 **That second state is the edge case spec.** A dead banner and a repeat count that cannot fit in the window are both drawn, both announced to a screen reader, and both currently unbuilt.

### Accessibility

`[role=dialog][aria-label]` · budget meter `[aria-label="Delivery budget"]` · never-ends `[role=switch][aria-checked]` · stepper buttons `aria-label="Fewer"` / `"More"` with `<output>` for the value · `.pb-cards[role=img]` carrying the **whole meaning in its `aria-label`** — *"Shown to each player up to 3 times, at most once a day"* and, when tight, *"Only 5 of 7 showings fit before it ends Sep 20"*.

---

## How to check a port of these

`scripts/portalProbe.mjs` gained `--mockup`, `--mk-page` and `--mk-sel` on 2026-09-15 22:42 EDT, so it can now compare the portal against any design package rather than only the retired `2026-08-23-portal-interactive` one:

```bash
node scripts/portalProbe.mjs --realm armory \
  --mockup docs/superpowers/mockups/2026-09-14-pins2-board \
  --mk-page index.html \
  --mk-sel 'aside.drawer[aria-label="New build"] .pb-att' \
  --sel '.atlist .bf-att' --chain --no-seed
```

⚠️ **For these two gates a value diff is the SECOND pass, not the first.** Where the structures do not correspond, the probe reports "MISSING ON THE PORTAL", which is the finding rather than a measurement. Fix structure, then measure values.

## Tokens

Both gates draw from `portal/public/app.css`, which board 1 links directly (`../../../../portal/public/app.css`) — so board and portal already share the token layer, and any value difference is a rule difference, never a token one. *(Amended 2026-10-01 14:43 EDT, Session 3's close: board 1 froze on its own `app.css` on 2026-09-21 10:30 EDT — board 1 `index.html:7–10` — so it no longer shares the portal's token layer; `docs/pins2/final/FINAL.md` § Boards 1 and 2.)*
