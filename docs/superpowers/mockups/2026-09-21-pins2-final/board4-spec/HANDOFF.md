---
kind: reference
status: live
---

# Board 4: Collective — the port contract, gate by gate (Version 35)

*Written 2026-09-27 02:29 EDT from the kit at Version 35 (published 2026-09-27 02:20 EDT, artifact `FCAFvDXrKQN28SotQLJhTh`) and the records. This file is the AUTHORED half of the spec: what each gate is, how it behaves and what he ruled. The VALUES (every resolved declaration, every state) are the generated half in this folder's `C*.md` and `states.md` — regenerate those after any kit change (README). Where the two disagree, the kit wins and this file is corrected.*

## How to read it

- **Contract** — behaviour and rulings a stylesheet cannot carry, each with its source. A value named here was measured on the board or read from the kit, never estimated.
- **His items** — every numbered item of his that the records assign to this gate, VERBATIM from its source line (`doc:line`); a row's last cell says what was built. Rows are extracted by `local/pins2-board-3/board4-review/ledger.py`, never retyped.
- **Not opened** — the states the Version 34 sweep had not opened when this was written (`docs/db-deferred-list.md`); treat each as unverified.
- **Structure** — for C1, C4, C5, C6 and C8 the structural spec is Board 3-E's handoff, which Board 4 carried unchanged except where a contract line here says otherwise.

## Across every gate

- **The kit is the design and it is gitignored** (`local/pins2-board-3/redo/`, its own git repo). The published artifact holds the same files; nothing else does.
- **Badge motion**: `docs/reference/badge-motion.md` is the law — parts never move; a material crosses the plate; contained; transform and opacity only.
- **Scroll edges are the board's fade** (`b3/fady.js`: `.b3-fady` vertical, `.b3-sd-atts` / `.b3-fadx` sideways, `fitRows` for runs held to N lines, `routeWheel` for a drawer's dead space) — never a lift or a hard edge.
- **One focus glow for every typing field** (the rename field keeps its own hue; "the thing that's standardized is the actual style of the glow", `.remember` PRE-FLIGHT 39).
- **Toggles** take the realm's accent for the pressed tint and share one hover (intake Message 11, items 41–44).
- **Responsive**: the board is designed and reviewed at desktop width (1440×960 at 2x); the phone is not a review surface (ruled 2026-09-20 12:02 EDT), so the drawers' fixed widths (980 build drawer) are desktop values and the portal's existing breakpoints govern below them.
- **Tokens**: the board reads `--b3-*` and `--h1-*` tokens the portal lacks — map every one through Board 3-E's `3e/token-map.md` and `3e/class-map.md` before porting a declaration; this folder's `tokens.md` lists them as resolved.

## C1 · The Armory manifest

| | |
|---|---|
| Realm | armory |
| Kit | `local/pins2-board-3/redo/gates/armory.js` (the board-3 manifest, via `from3('armory-manifest')`), `local/pins2-board-3/redo/b3/armory-parts.js` (badges, `CodeCell`, the selection bar), `local/pins2-board-3/redo/b3/board.css`, `local/pins2-board-3/redo/b4/classes.css` |
| States on the board | no state switch (Try buttons in its head) |
| Structure | [../../2026-09-15-pins2-board-3/handoff-3e.md § M1](../../2026-09-15-pins2-board-3/handoff-3e.md) |
| Values | [`C1-*.md`](.) and `states.md` (generated) |

### Contract

- **Badge set.** Grades META, TOXIC, ASS; tiers Best, Top 3, Top 5, Capable. TOP 4 is gone from the system and the bot (his v19 Message 2). Capable exists for DMZ too. ASS excludes META and every tier, both ways; TOXIC with ASS is allowed (items 36–37).
- **Rank Mode family** (HP, S&D, DOM, TDM, FTL, Control): MP builds only, several allowed (his 2026-09-26 ruling, plan §19z). Portal line `Rank Mode: HP | S&D`; bot line `Recommended Rank Mode: HP | S&D` (plan §19m). The stored name is `Control`; every badge word is drawn in capitals by `text-transform:uppercase` on `.b3-mdw`, so the bot line and export tokens keep the stored case (plan §19z, 17:48 EDT).
- **His marks** are his expanded outlines, drawn at 20px in the plate, scaled ×1.1 (plan §19r); his proportions are never restyled (`.remember` PRE-FLIGHT 64). Source SVGs: `docs/claude/pins2/data/2026-09-25-codm-mode-icons/`.
- **Motion** follows `docs/reference/badge-motion.md` and nothing else: ASS is pick A (stink lines); Rank Mode is pick C (echo, backwards-C glow and the word on one clock per chip, periods that drift). Only `transform` and `opacity` loop.
- **Selection bar list view**: the copy chip is `CodeCell` (exported from `b3/armory-parts.js`); a click keeps the code and turns only the copy mark into the `--ok` check for 1.1s (`.ticked`) — on every `CodeCell` (his popup "Yes, both tick", plan §19y).
- **The View toggle** is `.b3-sd-vl` + `.b3-sd-vt`; its marks are yellow `#F2C230` on `.b3-sd-vt` itself, so the toggle carries them anywhere (plan §19z, 16:35 EDT).
- **Chip runs that overflow** use the board's sideways fade (`.b3-sd-atts`, `.b3-fadx`, `b3/fady.js`) — never a hard edge.

### Components

| Component | File | Props |
|---|---|---|
| `ManifestStage` | `local/pins2-board-3/redo/gates/armory.js` | `session, weapons = null, collapsedAll = false, mode = 'MP', selectSignal = null, attView: attStart = 'list', showAtt = true, drawers = true, cap = null` |
| `CodeCell` | `local/pins2-board-3/redo/b3/armory-parts.js` | `b` |
| `Hint` | `local/pins2-board-3/redo/b3/armory-parts.js` | `title, sub, children, side = 'top', id, steps = null, tone = null` |
| `buildsWord` | `local/pins2-board-3/redo/b3/armory-parts.js` | — |
| `twinOf` | `local/pins2-board-3/redo/b3/armory-parts.js` | — |
| `faultLine` | `local/pins2-board-3/redo/b3/armory-parts.js` | — |
| `pcPath` | `local/pins2-board-3/redo/b3/armory-parts.js` | `w, h, tx, up, open` |
| `ProblemChip` | `local/pins2-board-3/redo/b3/armory-parts.js` | `weapon, faulty, builds, onOpen, compact = false, tone = 'warn'` |
| `B3Badges` | `local/pins2-board-3/redo/b3/armory-parts.js` | `b` |
| `SelectAllBox` | `local/pins2-board-3/redo/b3/armory-parts.js` | `ids, selected, setMany` |
| `SelectionDock` | `local/pins2-board-3/redo/b3/armory-parts.js` | `ids, rows, builds, onClear, onDeselect, onEdit, onExport, onDelete` |

### States and interactions

| | |
|---|---|
| Board states | no state switch (Try buttons in its head) |
| Keys handled | `Enter`, `Escape` |
| Hover, focus, pressed | per state in `states.md` (forced :hover, :focus-visible, :active, generated) |

### Edge cases

- **Longest badge run**: LOCUS Build 1 carries META, BEST SNIPER and all six Rank Mode badges on one weapon row (board sample); the selection bar's tag rail scrolls sideways behind the fade past its width.
- **No badges**: the row shows none; Compare's head says "No badges" (C3).
- **A build with a problem**: the problem card and the hazard edge (Board 3-E § M1).

### Motion

Badge loops per `docs/reference/badge-motion.md` (META lightning, BEST face gleam, TOP/CAPABLE rim crest, TOXIC stain, ASS fumes, Rank Mode echo); the keyframes are in `motion.md`. The copy tick holds 1.1s.

### Accessibility

- Roles in the kit: `checkbox`, `dialog`, `group`, `list`, `listitem`, `note`, `radio`, `radiogroup`, `region`, `status`, `tab`, `tablist`, `tooltip`
- Fixed aria-labels in the kit: “Actions for the selected builds”, “Attachments”, “Builds to export”, “Builds to pick”, “Clear the search”, “Close”, “Game mode”, “Jump to a category”, “Keep the name it had”, “List view”, “Picked builds”, “Save the name”, “Slot colours”, “Small text: the rule applied to real strings”, “Spacing controls”, “The files”, “Where a code sits in its column”, “Your palette”
- Focus: the board's one focus glow on every typing field; keyboard walk not yet recorded per gate (see Not opened).

### His items (13)

| Source | # | Item, verbatim |
|---|---|---|
| `09-21-board4-intake.md:392` | 17 | *"The badge chips in the card need to be improved. The attachment slot labels need their accent color"* (the preview card) |
| `09-21-board4-intake.md:420` | 1 | the manifest row's category tag, middle-aligned · the manifest row's inline run (name, tag, count, badges); v16's K7 claimed this fixed, and it is not |
| `09-21-board4-intake.md:438` | 7 | the drop line must not wrap with several cards; no ⌘V hint (the paste stays); the empty tile's icon becomes the manifest's no-image mark in the warn colour · the image block |
| `09-21-board4-intake.md:527` | 5 | no dot bullets between the badges · the badge run (`B3Badges`' `i.sep`), everywhere it renders; scope to confirm when the round closes |
| `09-21-board4-intake.md:528` | 6 | META + BEST + TOXIC wraps to two lines · the badge run in narrow places (the peek's header first); never tested |
| `09-21-board4-intake.md:543` | 10 | TOP 3 and TOP 5 badge designs stay as they are · — |
| `09-21-board4-intake.md:649` | 39 | publish v20 only after he approves the badge design · — |
| `09-21-board4-intake.md:662` | 40 | see ASS A and B on the board before deciding · the fork is A · Stink lines / B · Flies; C (plop) deleted; needs a publish |
| `09-21-board4-intake.md:698` | 58 | *(his 21:27 EDT: "can you show me an option C: the ambiance of the flies variant but using the stink lines?", then "publish it")* · built 2026-09-24 21:29 EDT: C1 fork option C — A's three rising lines with B's plate hum, halo of air and glint; gif `board4-review/v20/ass-c.gif`; published as Version 21 on his word |
| `09-21-board4-intake.md:708` | 60 | ASS is option A · the C1 fork is gone; B's flies and C's blend deleted; A's lines, fug and fume run on every ASS badge (manifest badge measured: lines block, `b3-fug`, `b3-fume`) |
| `09-23-board4-v15-plan.md:305` | 4 | the BUILD prefix's divider is a `border-right` · a tinted cell in the field's ground, no floating line; BUILD in the manifest's tag style |
| `09-23-board4-v15-plan.md:307` | 7 | the drop line wraps in the multi-card column; `⌘V pastes one`; the tile icon is `image` · no hint text (paste kept); a container query swaps to a shorter line; `image-off` in `--warn-ink` (the manifest's `.wg-im.no`) |
| `09-23-board4-v15-plan.md:311` | 15 | segments: 24% ground / 66% ring / ink 26% white; chips: 16% / full border / ink — two recipes · one recipe for every pressed toggle, chips (including `.topic`) and segments |

### Not opened

- the Code chip in Embed view and in Bulk Edit, and its keyboard focus
- the View toggle's keyboard focus
- the 60% chips in the Edit drawer and DMZ, and the unchecked Rank Mode tile's word (0.72 × 0.6 ≈ 0.43)
- CONTROL in Export's tiles and hover card, the selection bar head and the palette

## C2 · New build (Add, Bulk, Edit, DMZ)

| | |
|---|---|
| Realm | armory |
| Kit | `local/pins2-board-3/redo/b3/drawer.js` (`B3BuildDrawer`), `local/pins2-board-3/redo/b4/form.js` (Form A · Instrument, `MediaWell`), `local/pins2-board-3/redo/b4/bulk.js` + `bulk.css` + `bulkformat.js`, `local/pins2-board-3/redo/b4/form.css`, `local/pins2-board-3/redo/b4/classes.css`, `local/pins2-board-3/redo/b3/fady.js` |
| States on the board | Add build · Add · filled · Add · three · Bulk · empty / one / several / typing / warning / can't read / pasted / duplicate · DMZ · Edit 3 builds |
| Structure | — |
| Values | [`C2-*.md`](.) and `states.md` (generated) |

### Contract

- **Drawer width 980px**: preview 333, form 581 (his C2 pick, 2026-09-24 22:33 EDT; 880 and 940 deleted).
- **Form A · Instrument** (his v19 item 33). Weapon and Category stack; only Label, Grade and Tier sit inline beside their label (items 40–42); at 980 Grade and Tier are inline for one build and stack for three (plan §19b).
- **Unchecked badge and tier chips** (`.f-bt`, `.f-tier`) rest at opacity 0.6, 1 on hover; a disabled one stays 0.18 (his "somewhere around 60%", plan §19z 17:45 EDT).
- **Before staging** (`.f-stage`) sits in the side column, anchored under the preview, never floating mid-column (item 34); each row is a jump to its field. A disabled Stage names its reason and the reason jumps to the blocking field; ⌘↵ stages (v12 critique items 18–19).
- **The image well** (Upload · Link · Stored): the default Key is the next free key for that weapon, never one in use; an image can be cleared; the preview takes the nearest of a few set aspect ratios (v19 Message 3, items 13–16). `MediaWell` is exported from `b4/form.js` and reused by the post form.
- **Bulk**: the head carries the selection bar's own View toggle, `Ledger` / `Embed` (was "Discord"), sized 40px outline / 32px buttons / 12px type. The ledger card's Code row is `CodeCell` sized to the ledger (22px plate, 13px icon, 12.5px mono, 0.375px tracking). Its chip runs (attachments, Badges, Rank Mode) hold two lines, then scroll sideways behind the fade (`.b3-fadx[data-rows="2"]`, `fitRows`). A click anywhere on a result card (not a button, not a text selection) moves the caret to its block and scrolls the editor so the whole block sits in the band clear of the fades, centred when it fits (`cardJump`, `jump`); hover ring 32% of the card's hue, lit 58% (plan §19y, §19z).
- **A wheel in a drawer's dead space** scrolls the column that owns it (`routeWheel` in `b3/fady.js`): the area under the pointer's x, else the nearest to its left, else to its right; within it the outermost area that can still move; a wheel inside an area is never touched (plan §19z).
- **Edit** is the same drawer: the "Editing X" hint is the selection bar's weapon chip with its ×, which removes that weapon's blocks (intake C2 item 13).

### Components

| Component | File | Props |
|---|---|---|
| `exportText` | `local/pins2-board-3/redo/b3/drawer.js` | — |
| `B3BuildDrawer` | `local/pins2-board-3/redo/b3/drawer.js` | `addBadge = null, builds, mode: startMode, panel: startPanel, editIds, csrfToken, overlay, Card, onClose, onStaged, prefill = '', seed = null` |
| `newCard` | `local/pins2-board-3/redo/b4/form.js` | — |
| `stageLabel` | `local/pins2-board-3/redo/b4/form.js` | — |
| `blockedReason` | `local/pins2-board-3/redo/b4/form.js` | — |
| `Picker` | `local/pins2-board-3/redo/b4/form.js` | `id, value, placeholder = '', options, onPick, onType = null, typed = true, lead = null, label, empty = 'Nothing matches', clearable = false, mono = false, cls =` |
| `MediaWell` | `local/pins2-board-3/redo/b4/form.js` | `f, set, builds = [], id, reserved = [], sources = ['up', 'link', 'key'], keyed = true, what = 'a screenshot'` |
| `B4AddForm` | `local/pins2-board-3/redo/b4/form.js` | `builds, cards, setCards, active, setActive, Card, defaultMode` |
| `B4BulkForm` | `local/pins2-board-3/redo/b4/bulk.js` | `text, setText, blocks, editing, builds = [], Card, mode` |
| `writeCompact` | `local/pins2-board-3/redo/b4/bulkformat.js` | — |
| `splitBlocks` | `local/pins2-board-3/redo/b4/bulkformat.js` | — |
| `toDisplay` | `local/pins2-board-3/redo/b4/bulkformat.js` | — |
| `readDisplay` | `local/pins2-board-3/redo/b4/bulkformat.js` | — |

### States and interactions

| | |
|---|---|
| Board states | Add build · Add · filled · Add · three · Bulk · empty / one / several / typing / warning / can't read / pasted / duplicate · DMZ · Edit 3 builds |
| Keys handled | `ArrowDown`, `ArrowUp`, `Enter`, `Escape`, `Tab` |
| Hover, focus, pressed | per state in `states.md` (forced :hover, :focus-visible, :active, generated) |

### Edge cases

- **Bulk inputs**: empty · one · several · typing (ghost lines) · warning (a misspelt token, e.g. `bestt`) · can't read (a block with no weapon line) · pasted (the flat paste form) · duplicate (the same block twice) — each is a board state; the card names the problem and a click jumps to its lines.
- **A Rank Mode token on a DMZ block** warns "“hp” is a rank mode — DMZ builds carry none" (plan §19m).
- **Eight builds in Bulk**: the card jump still lands the whole block clear of the fades (plan §19z, 18:08 EDT).
- **A key already in use** is never the default (v19 item 13).
- **Nothing staged on close**: the drawer closes with "Closed. Nothing was staged."

### Motion

The card jump scrolls smoothly (`scroll-behavior` smooth, fade-aware); a blocked Stage's reason pulses its field once.

### Accessibility

- Roles in the kit: `alertdialog`, `checkbox`, `combobox`, `dialog`, `group`, `img`, `list`, `listbox`, `listitem`, `option`, `presentation`, `radio`, `radiogroup`, `status`
- Fixed aria-labels in the kit: “Builds, one block per build, a blank line between blocks”, “Combat range”, “Copy code”, “Grade”, “Gunsmith code”, “Image found for this key”, “Image key”, “Image link”, “Rank Mode”, “Remove the image”, “Remove the link”, “Show”, “Show each build as”, “The bulk format”, “Tier”, “Where the image comes from”, “Which armory”
- Focus: the board's one focus glow on every typing field; keyboard walk not yet recorded per gate (see Not opened).

### His items (105)

| Source | # | Item, verbatim |
|---|---|---|
| `09-21-board4-intake.md:351` | 2 | `dl/095742-Arc.png` · Add build · Image section, empty · the drop line wraps "file" onto a second line; the source switch, drop zone and Key field run past the well's right edge |
| `09-21-board4-intake.md:352` | 3 | `dl/095820-Arc.png` · Add build · footer blocker chip · "Card 1 needs a weapon · 1 more": wording or the chip itself — unclear |
| `09-21-board4-intake.md:363` | 14 | `dl/100733-Arc.png` · Add build · Gunsmith code field, copy hovered · the copy button's hover tile sits tight to the field's right edge |
| `09-21-board4-intake.md:364` | 15 | `dl/100842-Arc.png` · Add build · attachment row, clear × hovered (red) · the clear button's hover or placement |
| `09-21-board4-intake.md:366` | 17 | `dl/101003-Arc.png` · Add build · preview card, no image · the card shows the note "No image on this build, so the card omits the gallery entirely." |
| `09-21-board4-intake.md:367` | 18 | `dl/101023-Arc.png` · Add build · Image section, key filled · the "Replaces the image on 3-LINE RIFLE · B…" warning runs out of the well |
| `09-21-board4-intake.md:377` | 2 | Overflow and wrap: the switch, the drop zone and Key run past the well's right edge, and "file" wraps. |
| `09-21-board4-intake.md:380` | 5 | *"Bad inconsistent spacing that doesn't match the above sections (for the section label of the pass-check tile)"* |
| `09-21-board4-intake.md:383` | 8 | *"This is a reference for how your build drawer field highlights should be styled."* |
| `09-21-board4-intake.md:384` | 9 | *"Inconsistent fade position. The right side is wrong. Make it match the fade position/cut of the left side tiles scroll. Use this same fade position/cut for the Build drawer scroll as well."* |
| `09-21-board4-intake.md:390` | 15 | *"This directly links with shot 16. It's showing how this button has a tint yet the other X button in the form is lacking the tint."* |
| `09-21-board4-intake.md:391` | 16 | *"Links to shot 15"*: the grey × in the form gets the red clear ×'s tint. |
| `09-21-board4-intake.md:421` | 2 | "Required" chip middle-aligned with its label · every form label that carries a chip |
| `09-21-board4-intake.md:422` | 3 | the Stage blocker as a hover pop-up on the disabled Stage, in the Never chip's colours, the pop-up's own shape, a matching glow; no → icon · the drawer footer's blocker line (`.b4-why`), and the board's tooltip |
| `09-21-board4-intake.md:435` | 4 | the Label field's "BUILD n" prefix, refined; the divider between its two parts stops short of the field's height · the joined-field prefix (any field with an attached prefix) |
| `09-21-board4-intake.md:436` | 5 | "Badges and tier" → "Badges"; its "Badges" sub-heading → "Grade"; "Tier in AR" → "Tier" · the badge section's copy, MP |
| `09-21-board4-intake.md:437` | 6 | the same copy in DMZ; Range and Tier drawn as one linked control · the DMZ badge section |
| `09-21-board4-intake.md:469` | 12 | each build card tinted in its weapon category's accent, not only MP red / DMZ blue · the Add form's cards |
| `09-21-board4-intake.md:474` | 17 | "Pick all" tinted in the wrong hue: the top one in MP/DMZ's accent, each bay's in its category's accent · the pick-all chips (v16 tinted them all in the Armory hue) |
| `09-21-board4-intake.md:524` | 2 | the peek never resizes to its content, at any stage (add, remove) · the same card, every state |
| `09-21-board4-intake.md:541` | 8 | a new tier badge, CAPABLE: a thumbs-up icon on TOP 4's design and colours, a swap · the tier badge family |
| `09-21-board4-intake.md:542` | 9 | a new grade badge, ASS: a poop icon, a significant design of its own; 2–3 animated options shown on the board before he picks · the grade badge family (META, TOXIC), each uniquely designed |
| `09-21-board4-intake.md:544` | 11 | "Grade" and "Tier" labels inline with their buttons, not above · the build form's label-and-control rows |
| `09-21-board4-intake.md:545` | 12 | "Label" inline with its field, not above · the same class, the Label field |
| `09-21-board4-intake.md:558` | 13 | a new build's auto-filled Key must never be one already in use (AK117 got "AK117-1", which Build 1 holds) · the Key's default: the next free key for that weapon, checked against every stored key |
| `09-21-board4-intake.md:559` | 14 | the "Your key" chip redesigned, and its icon (a sparkle) replaced with one that means something · the Key field's status chips (Your key, the replace warning), one family |
| `09-21-board4-intake.md:560` | 15 | the image preview takes the closest of a few set aspect ratios to the image it holds, without disturbing the fields around it · the image well's preview tile, across Upload, Link and Stored image |
| `09-21-board4-intake.md:561` | 16 | a way to clear the image once uploaded or linked · the image well, every source |
| `09-21-board4-intake.md:585` | 20 | the slot names (Muzzle, Barrel…) in their own slot accent colours · slot-name labels, wherever the form lists slots |
| `09-21-board4-intake.md:587` | 22 | the card header's "Ready" chip moves into the form: the Build section shows a --warn "⚠ Weapon required" chip while empty; once the weapon is filled, a tinted check beside "Weapon" and "Category" and the section chip turns "Ready"; he asks me to improve on and extend the idea with my own design judgement · per-section and per-field readiness across the build form (every section with a requirement) |
| `09-21-board4-intake.md:589` | 24 | the disabled Stage button's pop-up is cut off at the drawer's edge (a long multi-card reason wraps and clips) · the Stage blocker hint (v17 item 3 put it on the board's Hint) |
| `09-21-board4-intake.md:590` | 25 | his idea: instead of the pop-up, a dedicated chip area in the always-empty space below the Discord preview, stating ready / what still needs what · the drawer's readiness summary; supersedes item 24's pop-up if taken |
| `09-21-board4-intake.md:606` | 26 | the Format hint: a complete redesign, it is unintuitive · Bulk create's format guidance |
| `09-21-board4-intake.md:607` | 27 | the hints inside the list (ghost lines, the inline "New image · next free key" / "Unused upload" / "This build's image" chips) are intrusive; redesign them · the editor's inline annotations |
| `09-21-board4-intake.md:608` | 28 | the list's MP/DMZ chips differ from the product's MP/DMZ chips; make them match · the mode chip, wherever it renders (his screenshots are the reference) |
| `09-21-board4-intake.md:609` | 29 | the list does not scroll: a long paste gets stuck and runs out of its box · the Bulk editor's overflow and scroll |
| `09-21-board4-intake.md:610` | 30 | use the existing chips (the attachment chips and others) instead of new designs · every chip Bulk draws: search the kit for the role first (PRE-FLIGHT 38) |
| `09-21-board4-intake.md:611` | 31 | the whole Bulk create panel, harshly nitpicked: every element, line, border, surface, component and state, for design and usability · the Bulk panel, all states |
| `09-21-board4-intake.md:612` | 32 | Bulk's fork: B "margin notes" is out; A "ledger" and C "preview stack" both stay, as a toggle inside the panel to switch the preview style (both ship in the product) · the Bulk preview column |
| `09-21-board4-intake.md:613` | 33 | the Add build form's fork: A "instrument" is chosen · the build form (forms B and C retire) |
| `09-21-board4-intake.md:644` | 34 | Before staging floats mid-column; anchor it · the side column's layout (preview + summary), every state |
| `09-21-board4-intake.md:645` | 35 | ASS options A (stink lines) and B (flies): keep the direction, add ambiance · the grade badges' layer stack (META and TOXIC carry resting light, glow and haze; ASS has motion only) |
| `09-21-board4-intake.md:646` | 36 | Capable exists for DMZ too — his yes · the tier set |
| `09-21-board4-intake.md:647` | 37 | ASS excludes META and every tier (Best, Top 3, Top 5, Capable), both ways; TOXIC + ASS is allowed · the grade and tier controls, the bulk parser, the model (Session 5) |
| `09-21-board4-intake.md:648` | 38 | the 880 vs 980 drawer as a toggle on the board · a board fork on C2 |
| `09-21-board4-intake.md:663` | 41 | Drawer 880 / 940 / 980, the added width split ⅓ preview, ⅔ form · C2 fork A 880 (preview 300, form 514) · B 940 (320, 554) · C 980 (333, 581); needs a publish |
| `09-21-board4-intake.md:664` | 42 | only Label, Grade and Tier inline · Weapon + Category are v18's stacked pair again |
| `09-21-board4-intake.md:665` | 43 | Before staging wastes horizontal space · the mark leads each row; mode, weapon and build on one line, the need under it on the same edge; no right icon column |
| `09-21-board4-intake.md:688` | 48 | Label back to its original format · label over field; only Grade, Tier and the slots use the label column |
| `09-21-board4-intake.md:689` | 49 | Badges → Grade spacing = Build → Weapon · every heading holds 24px; equal where Grade stacks (880, 940); at 980 Grade sits beside its row, centred on it |
| `09-21-board4-intake.md:690` | 50 | chip alignment · chip boxes centred in tiles and track (0.00); words centred in their chips (−0.25px); No tier's word was 1px high — a 2px top inset centres it (measured after) |
| `09-21-board4-intake.md:691` | 51 | "Optional" chips · Label, Gunsmith code, Badges and Image carry a neutral Optional chip while empty |
| `09-21-board4-intake.md:694` | 54 | *(found in my own pass)* a pasted image link ran under the Bulk editor's edge, cut mid-character · the editor wraps a long line; the typed layer and the painted layer now share one text column (the typed layer's right inset is 40px, the painted column's) — checked by painting the typed layer red over the painted one at 880, 940 and 980, Bulk and Edit |
| `09-21-board4-intake.md:695` | 55 | *(found in my own pass)* DMZ's BEST chip had a 6px wider right inset than left · an empty category word took the badge's gap; it now takes none — every DMZ tier chip measures 7px / 8px, the badge's own padding |
| `09-21-board4-intake.md:697` | 57 | *(his 17:09 EDT, on my red-overlay test shot: "why is the text red? wtf are those shit mp/dmz chips? why are the left accent line so dull?")* · the red was my alignment test paint, sent without saying so. Built 2026-09-24 17:13 EDT: the editor's MP / DMZ is a coloured word in its hue (the box and 3–4px rings drawn round typed glyphs are gone); every editor block bar and every result card's accent is the weapon category hue at full strength, 3px (were 45% and 2px at 70%) |
| `09-21-board4-intake.md:699` | 59 | *(his 21:29 EDT: "i fele like you have enough space in the 940px width drawer to make the badges inline with the label")* · built 2026-09-24 21:34 EDT: the label column is 96px (its widest label, Ammunition with the wand, measures 95; it was 112), the tier options' insets drop a pixel (track 435 → 425), and Grade and Tier stack together only below 535px of card (96 + 14 + 425). Measured: inline at 940 and 980 with one build and in DMZ; stacked together at 880 and with three builds; the slot fields, Grade tiles and Tier track share one left edge. Published as Version 22 on his word (21:57 EDT) |
| `09-21-board4-intake.md:709` | 61 | the drawer is 980 · the C2 fork is gone; build, Bulk and Edit drawers 980, preview 333; a stored 880 or 940 is dropped by migration `2026-09-24-ass-dw-picked` |
| `09-21-board4-intake.md:710` | 62 | Grade and Tier stack with several builds at 980 · a multi-build card's body was 533px against the 535 the inline row needs (96 + 14 + 425); the card's side inset is now its top's 16px, so the body is 537. Measured: Grade and Tier beside their label in all three cards of Add · three, in Add · filled and in DMZ. Flow test PASS 35 |
| `09-21-board4-intake.md:748` | 71 | BEST MARKSMAN, the longest tier word, made the Tier track 432px; with several builds a card has 537 and the row needs 542, so a marksman build's Tier fell under its label · No tier's side inset 9 → 6: the track is 426 and sits beside its label in every card of Add · three |
| `09-21-board4-intake.md:758` | 74 | Bulk: the editor's head row was 30px and the list's 40, so the two heads sat 5px off one centre line and the editor began 10px above the list (in Edit the head also shrank to 36.7) · both heads 40px, `flex:none`: one centre line (226), editor and list start on one edge (258), in Bulk and Edit |
| `09-21-board4-intake.md:759` | 75 | Cancel and Stage sat 4px below both columns' foot, in Bulk and in Add build · the footer sits 20px off the drawer's foot, the columns' own inset; Before staging's hold follows (still 16px above the buttons) |
| `09-21-board4-intake.md:760` | 76 | the Bulk / Edit list ran 35px under Cancel and Stage — Edit's third card showed through them · the list ends 16px above the buttons and fades there |
| `09-21-board4-intake.md:761` | 77 | a build with no label kept an empty label box, so its mode chip sat twice as far from the weapon (Can't read) · an empty label takes no room |
| `09-21-board4-intake.md:764` | 80 | a wrapped suggestion (One build's "Same class", Empty A's "Try") fell back under its label · the chips wrap as one group beside the label |
| `09-21-board4-intake.md:767` | 83 | Table A's head showed "No badges" for a build whose only badge is ASS, or a DMZ tier · ASS and DMZ tiers count as badges |
| `09-21-board4-intake.md:776` | 84 | Keep the placeholders · unchanged: "No label" and "No badges" stay in every head |
| `09-21-board4-intake.md:777` | 85 | Add badges to B and C · every head in B and C carries its badges under the label; every head in A, B and C now reads from the top (bottom-aligned, FFAR 1's names had sat 16px under BAL-27's) — measured one top in each table |
| `09-21-board4-intake.md:778` | 86 | Default for unmarked blocks · the parser already took the switch's mode for a block with no mode; checked: "KILO 141 \ · AR" with the switch on DMZ stages as "Stage this DMZ build". The Format card's first line now says so: "Weapon · category · mode (blank: the switch)" |
| `09-23-board4-v15-plan.md:303` | 2 | `.f-lab label` and `.f-h` text are untrimmed line boxes beside a 24px chip · `text-box:trim-both cap alphabetic` on labels, headings (wrap heading text in a span), `.f-rl` |
| `09-23-board4-v15-plan.md:304` | 3 | the portal's hint system is OFF by his 2026-09-11 ruling; the board's own `.b3-hint` / `.b3-hint-card` exists; the Never chip is `.g-noend` (warn-ink, warn 40% ring) · a `.b3-hint` wrapper on Stage with a `.b3-hint-card.b4-warn` (warn fill, ring, glow); Stage `aria-disabled` (focusable, click jumps to the blocker); the footer `.b4-why` line and its CSS removed |
| `09-23-board4-v15-plan.md:309` | 12 | cards tint by MP/DMZ (`--f-ch` per `data-arm`) · `--f-ch` = the category's accent once the card is started, neutral before |
| `09-23-board4-v15-plan.md:314` | 18 | the rename × has `class="x"`, which the drawer's × rules reach (the stray box, the hover); the landing never had the buttons · one `RenameField` for both places, own classes, inside the chip's right padding |
| `09-23-board4-v15-plan.md:357` | 9 | the ASS grade · umber, a poop mark drawn on Lucide's grid, three motions on a board fork (C1 · Ass badge: A stink lines, B flies, C plop), recorded in `board4-review/v19/ass-*.gif` |
| `09-23-board4-v15-plan.md:364` | 33 | the form fork · A · Instrument only; B and C CSS deleted; stored picks dropped by a migration |
| `09-23-board4-v15-plan.md:396` | 34 | Before staging's anchor is the side column's foot: the column is a flex scroller, the panel takes `margin-top:auto` and `sticky; bottom:0`, and `--f-foot` (52px) is both the column's floor and the panel's hold. The first attempt sat 120px over the buttons because Chrome insets a sticky box from the scroller's content box (78px inset on 78px padding). The empty preview no longer overruns the column (19px → 0). · 16px above Cancel and Stage in Add, Add · filled, Add · three and DMZ, at 980 and 880, at scroll top and scroll end |
| `09-23-board4-v15-plan.md:397` | 35 | ASS takes the grade family's stack: a resting light on every option (lit top edge, ring, umber glow). A adds a haze rising in the plate, a cloud drifting up over the lines and a glow on the lines; B adds a warmth round the mark on the orbit's beat, a halo of air and a glint on each fly. C is unchanged. · gifs `local/pins2-board-3/board4-review/v20/ass-a.gif`, `ass-b.gif` |
| `09-23-board4-v15-plan.md:398` | 37 | Form: ASS is disabled while META or a tier is on; META and every tier are disabled while ASS is on; TOXIC is free; each disabled control says why on hover. Bulk: `ass` beside `meta` or a tier is dropped with a warning ("“ass” can’t sit with meta — saved without it"). The portal and bot port stays Session 5's. · real clicks (fresh · META on · Top 3 on · TOXIC + ASS on · a forced click on Best while ASS); bulk test covers MP, DMZ and TOXIC + ASS |
| `09-23-board4-v15-plan.md:399` | 38 | A C2 fork, Drawer: A · 980 (as v19 built it) / B · 880 (his 2026-09-21 width), for the build, Bulk and Edit drawers together · Grade and Tier inline at 980, stacked at 880 |
| `09-23-board4-v14-nitpick.m:15` | 2 | The build drawer changed height with its content: 860px for a form, 588px while typing a Bulk block · only `max-height` was set · the drawer keeps `min(84vh, 860px)` in every state · `local/pins2-board-3/redo/b4.css` |
| `09-23-board4-v14-nitpick.m:16` | 3 | The form scrolled under the header's rule with a hard cut · a mask on the scroller would clip the header controls it carries · ~~a header lift~~ → **replaced in Round 2 (his ruling, local only)**: the form column scrolls with the board's `.b3-fady` fade · `local/pins2-board-3/redo/b4.css` |
| `09-23-board4-v14-nitpick.m:17` | 4 | A wheel at the end of a drawer's scroll moved the board behind it · `overscroll-behavior:auto` · `contain` on every drawer scroller and textarea · `local/pins2-board-3/redo/b4.css` |
| `09-23-board4-v14-nitpick.m:18` | 5 | The image tile stopped 35–97px short of its column · a fixed 16:10 tile beside a 150–207px column · the tile fills the well's height, never under 110px · `local/pins2-board-3/redo/b4/form.css` |
| `09-23-board4-v14-nitpick.m:19` | 6 | "Next free key" sat under the word Key, not under the key field · the hint was a sibling of the key row · the hint renders in the key row's field column · `local/pins2-board-3/redo/b4/form.js`, `local/pins2-board-3/redo/b4/form.css` |
| `09-23-board4-v14-nitpick.m:20` | 7 | "Discard this draft?" confirmed in success green · the confirm was called without `danger` · red, like every destructive confirm · `local/pins2-board-3/redo/b3/drawer.js` |
| `09-23-board4-v14-nitpick.m:21` | 8 | The faded example's text ran half-cut above and below its line (form preview, Bulk empty) · the line lay on the example with no clearing · the example opens a clearing where the line sits; wider in the form · `local/pins2-board-3/redo/b4/classes.css` |
| `09-22-board4-v12-critique.:14` | 1 | Bulk A · Edit (results list) · With 3+ builds every card was squashed and its bottom rows cut (Image row, badge row, the gutter's end line) · `grid-auto-rows:max-content` on the list: cards take their height, the list scrolls · `local/pins2-board-3/redo/b4/bulk.css` |
| `09-22-board4-v12-critique.:15` | 2 | Bulk A · B · Edit (card chips) · The attachment row never wrapped: a third chip cut mid-word ("Crown-H", "ST", "PERK") · chips wrap; fade mask removed · `local/pins2-board-3/redo/b4/bulk.css` |
| `09-22-board4-v12-critique.:16` | 3 | Bulk C (legend) · The dashed "Name" chip was clipped to "Nam" · the legend chip never shrinks · `local/pins2-board-3/redo/b4/bulk.css` |
| `09-22-board4-v12-critique.:17` | 4 | Bulk editor · A long line (an image URL, a hint chip) stopped at a hard cut on the editor edge · the editor's last 28px fade · `local/pins2-board-3/redo/b4/bulk.css` |
| `09-22-board4-v12-critique.:18` | 5 | Bulk empty · "All 0" filter shown with nothing typed, beside "0 builds" (distill) · filters appear with the first block · `local/pins2-board-3/redo/b4/bulk.js` |
| `09-22-board4-v12-critique.:19` | 6 | Form C (blank) · The hero code placeholder cut at "gam" · the placeholder reads at 15px; the code keeps 21px · `local/pins2-board-3/redo/b4/form.css` |
| `09-22-board4-v12-critique.:20` | 7 | Form B (DMZ, blank) · "Required" wrapped under "Weapon" · label column 136px in B, rows and attachments on one value edge · `local/pins2-board-3/redo/b4/form.css` |
| `09-22-board4-v12-critique.:21` | 8 | Form B (image well) · "Stored image" broke onto two lines · the source switch spans its column, labels never wrap · `local/pins2-board-3/redo/b4/form.css` |
| `09-22-board4-v12-critique.:22` | 9 | Form C (image well) · Switch edge 30px short of the drop zone and key field · same rule: the switch spans its column in all three options · `local/pins2-board-3/redo/b4/form.css` |
| `09-22-board4-v12-critique.:23` | 10 | Form B (several builds) · Panel inside card inside drawer: three boxes deep · inside a card the sections drop their panel, keep hairlines · `local/pins2-board-3/redo/b4/form.css` |
| `09-22-board4-v12-critique.:24` | 11 | Form B (code row) · Copy button 8px right of every chevron (792 vs 784) · the row's −8px margin removed; measured 784 = 784 · `local/pins2-board-3/redo/b4/form.css` |
| `09-22-board4-v12-critique.:26` | 13 | Form (several builds) · Card head said "Build 6" while the label said "Close range"; preview said "Build 1 of 3" beside the card's own "Build 6 of 6" · head reads "Build 6 · Close range"; preview reads "Previewing 1 of 3" · `local/pins2-board-3/redo/b4/form.js` |
| `09-22-board4-v12-critique.:27` | 14 | Form (animate, delight) · Pasting a code changed four fields with no sign that the code did it · each slot the code fills lights in slot order, 50ms apart, once; reduced motion keeps the resting green edge. Checked by computed `animation-name`/`delay`, not seen mid-frame · `local/pins2-board-3/redo/b4/form.css` |
| `09-22-board4-v12-critique.:71` | 18 | A disabled Stage names its reason ("Pick a weapon to stage", "Card 2 needs an attachment · 1 more"), and the reason is a button that jumps to the blocking field and pulses it once · A disabled primary with no reason was the one dead end in the form · clicked: focus landed on the weapon field, pulse class present, the page itself did not move (scroll delta 0) · `local/pins2-board-3/redo/b3/drawer.js`, `local/pins2-board-3/redo/b4/form.js`, `local/pins2-board-3/redo/b4/classes.css` |
| `09-22-board4-v12-critique.:72` | 19 | ⌘↵ stages from anywhere in the drawer; a blocked Stage jumps to its reason instead. The Stage button carries the hint · Mastery for a man who adds builds in sets. The handler reads a ref, never a mount-time closure (the Escape bug) · pressed Meta+Enter on a filled card: staged, drawer closed, toast "Staged · BAL-27" · `local/pins2-board-3/redo/b3/drawer.js` |
| `09-22-board4-v12-critique.:73` | 20 | A screenshot on the clipboard pastes into the build being edited from anywhere in the drawer (⌘V hint in the drop row); the preview card shows it · §3's job starts with "a screenshot just taken" · a real paste event with an image file: file row "Screenshot.png · 2 KB", the well and the Discord preview both show it · `local/pins2-board-3/redo/b4/form.js` |
| `09-22-board4-v12-critique.:74` | 21 | Before a code names the slots, attachment rows appear one at a time · Five identical "Any slot" rows · blank MP form: 1 row; filled: all 5 · `local/pins2-board-3/redo/b4/form.js` |
| `09-22-board4-v12-critique.:75` | 22 | Bulk's empty results show the guide's example as a faded result card with the line on it (one class, `.b4-overline`, shared with the form's empty preview) · 600px of dead column · rendered empty in A · `local/pins2-board-3/redo/b4/bulk.js`, `local/pins2-board-3/redo/b4/bulk.css`, `local/pins2-board-3/redo/b4/classes.css` |
| `09-22-board4-v12-critique.:76` | 23 | A result card arrives with a 240ms rise when its block first reads; reduced motion removes it · Typing visibly produces a build · computed animation present · `local/pins2-board-3/redo/b4/bulk.css` |
| `09-22-board4-v12-critique.:77` | 24 | Bulk says which blocks will not stage ("Lines 9–11 won't be staged · can't be read"), never counting the block still being typed · Stage said "Stage this MP build" beside a block it was about to skip · can't-read, duplicate and typing states opened · `local/pins2-board-3/redo/b3/drawer.js` |

### Not opened

- the Code chip in Embed view and in Bulk Edit, and its keyboard focus
- the two-line chip runs in Bulk Edit, the DMZ card, the ghost, and a resize while scrolled
- the dead-space wheel on the post, History and confirm drawers open
- the card jump's centring in Embed view
- the 60% chips in the Edit drawer and DMZ, and the unchecked Rank Mode tile's word (0.72 × 0.6 ≈ 0.43)
- the count row, the over states and the Before staging panel in Edit and Post again, at narrow widths, and its rows' jump by click and keyboard
- fady's `characterData` observer while typing in Bulk (never measured for cost).

## C3 · Compare

| | |
|---|---|
| Realm | armory |
| Kit | `local/pins2-board-3/redo/b4/compare.js` (`B4Compare`), `local/pins2-board-3/redo/b4/compare.css`, `local/pins2-board-3/redo/gates4/surfaces.js` (`CompareSurface`) |
| States on the board | One weapon · Two weapons · One build · Empty — and two forks still HIS: Table A · Column cards / B · Diff grid / C · Slot lanes, Empty A · Search on the ghost / B · Weapon shelf / C · Command field |
| Structure | — |
| Values | [`C3-*.md`](.) and `states.md` (generated) |

### Contract

- **Open:** Table and Empty are his to pick (the board's own note). Nothing in this section decides them.
- **A cell that differs** is measured against the first build of its own weapon, and takes that build's colour (the board's note).
- **Badges in the heads are the tighter version** (his pick, 2026-09-27): Compare resets the badge root's tracking to normal, and a run holds at most two lines, then scrolls sideways behind the fade (`.cx-run.b3-fadx[data-rows="2"]`, both call sites in `compare.js`). Only the Rank Mode word span keeps `text-transform:uppercase`. Measured in Tables A/B/C with 1–5 builds: never over two lines, no cell grew.
- **ASS and DMZ tiers count as badges**; a build with none reads "No badges". Hidden columns read in the board's build wording: "2 not shown: BAL-27 Builds 4, 5" (sweep items 82–83).

### Components

| Component | File | Props |
|---|---|---|
| `B4Compare` | `local/pins2-board-3/redo/b4/compare.js` | `builds, weapons, onSetWeapons, Card` |

### States and interactions

| | |
|---|---|
| Board states | One weapon · Two weapons · One build · Empty — and two forks still HIS: Table A · Column cards / B · Diff grid / C · Slot lanes, Empty A · Search on the ghost / B · Weapon shelf / C · Command field |
| Keys handled | none of its own |
| Hover, focus, pressed | per state in `states.md` (forced :hover, :focus-visible, :active, generated) |

### Edge cases

- **Empty**: the Empty fork (A/B/C, his pick).
- **More builds than columns**: "2 not shown: BAL-27 Builds 4, 5".
- **A five-badge head**: two lines, the rest scrolls sideways (the fifth build of the sample).

### Motion

None beyond the badges' own loops.

### Accessibility

- Roles in the kit: `group`
- Fixed aria-labels in the kit: none (labels are built from the data)
- Focus: the board's one focus glow on every typing field; keyboard walk not yet recorded per gate (see Not opened).

### His items (16)

| Source | # | Item, verbatim |
|---|---|---|
| `09-21-board4-intake.md:353` | 4 | `dl/095858-Arc.png` · a weapon list, CX-9 hovered (Compare landing?) · the hover is a flat gold tint and ring, not the manifest glow |
| `09-21-board4-intake.md:379` | 4 | *"This is taken from the compare panels empty state. I liked the design of this list. It's a reference for screenshot 1."* |
| `09-21-board4-intake.md:388` | 13 | Like shot 4's list: the attachment picker restyled like the Compare empty-state list. |
| `09-21-board4-intake.md:451` | 8 | weapon list: black ground (Compare's empty-state list), no dots, the category in the manifest's small caps tag, "x builds" in the manifest's count chip · every picker list (`.f-menu`) |
| `09-21-board4-intake.md:471` | 14 | Compare's "Ammunition" chip becomes the board's slot-coloured chip; carry designs across surfaces · the slot chip, board-wide |
| `09-21-board4-intake.md:540` | 7 | TOP 4 removed from the whole system and the bot; tiers become Best / Top 3 / Top 5 / Capable · the tier set: the board's badges, pickers, filters, Compare, Export's format, and outside the board the model, the bot's render and bulk import (Session 3 writes no portal or bot code, anchor #13; to be filed for the session that does) |
| `09-21-board4-intake.md:684` | 44 | the attachment chip design is incorrect · built 2026-09-24 16:47 EDT: every chip on the board computes the manifest chip (fill, slot-coloured ring, size, slot word), measured against the manifest's Muzzle chip. Two rule sets were scoped to the manifest's own contexts — the p2sty selector lists and the neutralbg ring override's `:is()` list — and both now include Bulk's cards and legend, Compare's same row and the Export specimen. His 16:38 EDT: "we literally use it in the armory manifest ON THIS VERY BOARD" — asking back was wrong |
| `09-21-board4-intake.md:696` | 56 | *(found in my own pass)* Compare's first column's badges sat 1.5px under the other four · the Baseline tag stood taller than its name line; every name line holds the tag's height — the five badge rows share one top |
| `09-21-board4-intake.md:718` | 63 | the Tier track's softer corner on every field and search box · one token, `--fld-rad: 9px` (the Tier track's and the image source switch's corner), on every form field, the Grade tiles, the Tier track, the source switch, the drop zone, the Label field's build-number cap (8px inside), every search box (manifest, Broadcast, History, Export, Compare, stored images) and every Post drawer field (text, banner link and swatch, dates, the count stepper). Read back as 9px on each; the Bulk editor frame (10px) and Compare's big pick (10px) were already rounder and stay. Flow test PASS 35 |
| `09-21-board4-intake.md:762` | 78 | Compare: a column head's name did not start on its cells' words — A 4px off, C 8px, and every weapon's first column off again (B 12px) · each head takes its column's cell inset; measured equal in A, B and C, every column |
| `09-23-board4-v15-plan.md:310` | 14 | `.cx-sv` is its own grey chip · the manifest's `.wg-at` slot chip, slot name in `--sl` |
| `09-23-board4-v14-nitpick.m:22` | 9 | Compare Table A: the badge dot hung at the end of the first line · the badge group wraps in a narrow head · the dot is dropped inside a column head · `local/pins2-board-3/redo/b4/compare.css` |
| `09-22-board4-v12-critique.:25` | 12 | Form, empty preview · "Pick a weapon…" floated 80px under the ghost card · the line sits on the ghost, as Compare's empty landing does · `local/pins2-board-3/redo/b4/form.css` |
| `09-22-board4-v12-critique.:28` | 15 | Compare A (column heads) · FFAR 1's heads sat 14px under BAL-27's (no badges, cell centred) · heads read from the top, under the id scope that set `middle`; all six at 342 · `local/pins2-board-3/redo/b4/compare.css` |
| `09-22-board4-v12-critique.:29` | 16 | Compare Empty B (shelf) · "Assault rifle" ran under "5 builds"; a first fix truncated it to "Assaul…" · the shelf uses the Armory's short category names (Assault, Marksman) and a tighter tile · `local/pins2-board-3/redo/b4/compare.js`, `local/pins2-board-3/redo/b4/compare.css` |
| `09-22-board4-v12-critique.:30` | 17 | Compare one build (clarify) · Placeholder "Search Sniper" · "Find another sniper" · `local/pins2-board-3/redo/b4/compare.js` |

### Not opened

- the Compare badges' restored letter-spacing (shown to nobody)

## C4 · Repairs

| | |
|---|---|
| Realm | armory |
| Kit | `local/pins2-board-3/redo/gates/armory.js` via `from3('repairs')`, `local/pins2-board-3/redo/b3/repairs.js` |
| States on the board | Today's · A clean day |
| Structure | [../../2026-09-15-pins2-board-3/handoff-3e.md § M2](../../2026-09-15-pins2-board-3/handoff-3e.md) |
| Values | [`C4-*.md`](.) and `states.md` (generated) |

### Contract

- **Tickets (`.b3-tk`) have no hover** — the item that said they did was withdrawn (his "they don't have any hover event... i'm confused", plan §19z 16:47 EDT). Board 3-E's § M2 is the structural spec; nothing in Board 4 changed its layout.

### Components

| Component | File | Props |
|---|---|---|
| `repairsStatus` | `local/pins2-board-3/redo/b3/repairs.js` | — |
| `RepairsPanel` | `local/pins2-board-3/redo/b3/repairs.js` | `inMode, builds, mode, onFix, onShowAged, onShowBuild` |

### States and interactions

| | |
|---|---|
| Board states | Today's · A clean day |
| Keys handled | none of its own |
| Hover, focus, pressed | per state in `states.md` (forced :hover, :focus-visible, :active, generated) |

### Edge cases

- **A clean day**: its own state on the board.

### Motion

Per Board 3-E's handoff and `motion.md`; Board 4 added none.

### Accessibility

- Roles in the kit: `group`, `img`, `row`, `rowgroup`, `table`
- Fixed aria-labels in the kit: “Builds that need work”, “Show builds with”
- Focus: the board's one focus glow on every typing field; keyboard walk not yet recorded per gate (see Not opened).

### His items (2)

| Source | # | Item, verbatim |
|---|---|---|
| `09-21-board4-intake.md:354` | 5 | `dl/100035-Arc.png` · Repairs · Below standard and Pass every check · unclear: solid green Repair buttons, the checks panel, or the tickets' hover (filed) |
| `09-23-board4-v15-plan.md:66` | 1 | Evidence still missing, one CLI batch: the manifest search's focus recipe, the Pick button's winning hover rule and `git log -S` for it, the row's drawn cap centres, which × is his shot 16, Repairs' head-to-content gaps, an expanded file's height |

### Not opened

- nothing listed for this gate

## C5 · Export

| | |
|---|---|
| Realm | armory |
| Kit | `local/pins2-board-3/redo/gates/armory.js` via `from3('export')`, `local/pins2-board-3/redo/ui/exportPanel.js`, `local/pins2-board-3/redo/gates4/surfaces.js` (`ExportSurface`) |
| States on the board | Landing · Picker · Three picked |
| Structure | [../../2026-09-15-pins2-board-3/handoff-3e.md § M3](../../2026-09-15-pins2-board-3/handoff-3e.md) |
| Values | [`C5-*.md`](.) and `states.md` (generated) |

### Contract

- **The file is the Bulk create format** (his 2026-09-24 ruling, memory 64428): Export's list, hover card and file use it, so a file pastes straight back into Bulk.
- **Every attachment chip is the Armory manifest's chip**; the MP/DMZ chip follows the weapon and build (same ruling).
- **Dead space scrolls**: the gap between the tiles and the preview scrolls the tiles; the right gutter scrolls the files (plan §19z, `routeWheel`).
- **The picker dropdown keeps its scrollbar** (his "keep it, it's fine inside the dropdown", plan §19z 16:47 EDT).

### Components

| Component | File | Props |
|---|---|---|
| `ExportDrawer` | `local/pins2-board-3/redo/ui/exportPanel.js` | `scopes, overlay, onClose` |
| `ExportStrip` | `local/pins2-board-3/redo/ui/exportPanel.js` | `label, scopes, overlay, open: openProp = null, onToggle = null` |

### States and interactions

| | |
|---|---|
| Board states | Landing · Picker · Three picked |
| Keys handled | none of its own |
| Hover, focus, pressed | per state in `states.md` (forced :hover, :focus-visible, :active, generated) |

### Edge cases

- **The picker** lists every build; the files split rather than pass a cap.

### Motion

Per Board 3-E's handoff and `motion.md`; Board 4 added none.

### Accessibility

- Roles in the kit: `group`
- Fixed aria-labels in the kit: none (labels are built from the data)
- Focus: the board's one focus glow on every typing field; keyboard walk not yet recorded per gate (see Not opened).

### His items (26)

| Source | # | Item, verbatim |
|---|---|---|
| `09-21-board4-intake.md:350` | 1 | `dl/095515-Arc.png` · Add build · weapon picker open · the "N builds" chips are cut off at the list's right edge |
| `09-21-board4-intake.md:355` | 6 | `dl/100049-Arc.png` · Export · the Pick button, hovered · the hover looks like the rest state |
| `09-21-board4-intake.md:356` | 7 | `dl/100130-Arc.png` · Export picker · build 3 hovered, preview card · unclear: the preview card's placement or its content |
| `09-21-board4-intake.md:358` | 9 | `dl/100242-Arc.png` · Export drawer · the bottom edge · the "MP builds" file card is cut by the drawer's bottom with a hard edge |
| `09-21-board4-intake.md:359` | 10 | `dl/100312-Arc.png` · Export · three file cards (23, 24, 22) · unclear: the number tiles, the order, or the card layout |
| `09-21-board4-intake.md:362` | 13 | `dl/100634-Arc.png` · Add build · attachment picker open · attachments are unordered, not grouped by slot |
| `09-21-board4-intake.md:368` | 19 | `dl/101052-Arc.png` · Add build · Stored image picker · the subtitles ("3-LINE RIFLE · B…") are cut off; every thumbnail is a placeholder icon |
| `09-21-board4-intake.md:369` | 20 | `dl/101101-Arc.png` · Add build · Stored image picker, scrolled · rows lose their thumbnail and key; three different left indents ("Unused upload", BP50) |
| `09-21-board4-intake.md:370` | 21 | `dl/101144-Arc.png` · Add build · category picker open · the short-code column repeats the name (MARKSMAN, SHOTGUN) and is uneven |
| `09-21-board4-intake.md:395` | 21 | *"Like shot 4s + why are you stating the twice?"* (the category picker: a question about the name and its short code both showing) |
| `09-21-board4-intake.md:452` | 9 | category list: black ground, no Melee, all caps · every picker list; the category options |
| `09-21-board4-intake.md:453` | 10 | attachment list: black ground, slot labels in caps and their slot colours, a better phrase than "Any slot", attachments ordered by the standard slot order (Sight first, Perk last) · every picker list; the slot vocabulary (`--sl-*`) |
| `09-21-board4-intake.md:454` | 11 | stored-image list: black ground; the weapon name and "Build x" in their accent colours, in the correct chip design · every picker list; the manifest's chips |
| `09-21-board4-intake.md:470` | 13 | the DMZ fields get the same black lists, accent colours and chips · every picker list, DMZ |
| `09-21-board4-intake.md:473` | 16 | the × in Export's picked-builds list is clipped at its top · the Export files list |
| `09-21-board4-intake.md:484` | 18 | the rename chip's × / ✓: clipping, odd hover, a stray box around the ×; poor alignment and spacing ("a native well integrated set of buttons that doesn't feel stuck on"); missing from the Export landing's rename chip, which is the same element · the filename rename chip, everywhere it appears (one component) |
| `09-21-board4-intake.md:523` | 1 | the peek card overflows when no builds are selected · Export's Pick builds peek card |
| `09-21-board4-intake.md:685` | 45 | Export's lines in the format the file delivers · one writer for the list, the hover card and the download: the Bulk create format |
| `09-21-board4-intake.md:686` | 46 | the hover card's position · 14px from the drawer's sides, the floor and the file's footer rule, in every hover state |
| `09-21-board4-intake.md:687` | 47 | the mode chip follows the weapon and build · hover card, build card head, Before staging rows, Bulk result cards |
| `09-21-board4-intake.md:692` | 52 | *(his 16:50 EDT screenshot of the Export drawer's head: "THIS is you being thorough like a designer? What's the point of you LOOKING at a screenshot if you don't even look at every surface/element/component on it")* the Back button squashed to 28×14 beside a 28×28 Close · built 2026-09-24 16:53 EDT: a class collision — v19's Bulk rules `.b4 .bk {height:100%; min-height:0; display:grid}` also matched the drawer's Back button (`button.x.bk`); every bare `.bk` selector in b4/bulk.css, b4/classes.css and b4.css is now `div.bk`. Measured after: Back 28×28, Close 28×28, the same top edge; Bulk's grid unchanged (412.8 / 393.2 px, 656 tall). It was in my own 16:46 EDT shot, which I reported as looked at |
| `09-21-board4-intake.md:693` | 53 | *(his 16:59 EDT: "i already asked for the keyboard hints to be removed")* the ⌘↵ chip on Stage · removed 2026-09-24 17:07 EDT from all three Stage buttons (build, Bulk, Edit) and the ↵ glyph from Export's search hint; the shortcut still works. His 2026-09-23 18:2x ask had removed them from the discard question only |
| `09-21-board4-intake.md:747` | 70 | Export's build tiles: an ASS build (KILO 141 Build 1) showed no mark, and a CAPABLE build (HOLGER 26 Build 1) wore Top's award · `local/pins2-board-3/redo/gates/armory.js` marks carry `capable` (thumbs-up, Capable's blue) and `ass` (the ASS mark, its umber) in the tiles, the roster, their labels and `tierWord` (which would have printed "TOP able") |
| `09-23-board4-v15-plan.md:68` | 3 | JS in one heredoc: the Picker's rows and menu width, the category and stored-image options, the blocker chip, copy confirmation, the expand height, S7 and S17 per his answers; asserts on the survivors |
| `09-23-board4-v15-plan.md:315` | 19 | a static 12px mask on `.b3-xt-files` overrode `local/pins2-board-3/redo/b3/fady.js` · remove it; `--fdy:48px` on both Export columns |
| `09-22-board4-v12-critique.:78` | 25 | A half-typed weapon ("ki") no longer builds a card called "ki"; the ghost stays with "“ki” isn't in the Armory yet…" · The preview treated a search query as a weapon · typed "ki" and "Gauge" into the weapon picker · `local/pins2-board-3/redo/b4/form.js` |

### Not opened

- CONTROL in Export's tiles and hover card, the selection bar head and the palette

## C6 · The delivery queue

| | |
|---|---|
| Realm | broadcast |
| Kit | `local/pins2-board-3/redo/gates/broadcast.js` via `from3('queue')`, `local/pins2-board-3/redo/b3/broadcast.js` |
| States on the board | no state switch (Try buttons in its head) |
| Structure | [../../2026-09-15-pins2-board-3/handoff-3e.md § B1](../../2026-09-15-pins2-board-3/handoff-3e.md) |
| Values | [`C6-*.md`](.) and `states.md` (generated) |

### Contract

- Board 3-E's § B1 is the structural spec: the cards, the panel head, Changes ahead and the never-ends warning on the card. Board 4 changed no rule of it after Version 10.

### Components

| Component | File | Props |
|---|---|---|
| `EndPicker` | `local/pins2-board-3/redo/b3/broadcast.js` | `a, csrfToken, overlay, onStaged, cls = ''` |
| `NeverChip` | `local/pins2-board-3/redo/b3/broadcast.js` | `n` |
| `ForeverAhead` | `local/pins2-board-3/redo/b3/broadcast.js` | `list, accentOf, daysBetween, csrfToken, overlay, onStaged` |

### States and interactions

| | |
|---|---|
| Board states | no state switch (Try buttons in its head) |
| Keys handled | `Escape` |
| Hover, focus, pressed | per state in `states.md` (forced :hover, :focus-visible, :active, generated) |

### Edge cases

- **A post that never ends**: the never-ends warning on the card (Board 3-E § B1).

### Motion

Per Board 3-E's handoff and `motion.md`; Board 4 added none.

### Accessibility

- Roles in the kit: `dialog`
- Fixed aria-labels in the kit: “Remove”, “Remove the announcement”, “When it stops showing”
- Focus: the board's one focus glow on every typing field; keyboard walk not yet recorded per gate (see Not opened).

### His items (1)

| Source | # | Item, verbatim |
|---|---|---|
| `09-21-board4-intake.md:739` | 67 | the spacing, again · my 00:36 rhythm was measured on boxes; the eye reads ink and holes. The date row ended on a helper under Ends only, leaving a 48px hole under Starts where every other break is 22 — Starts now carries its own truthful helper ("default · now", blank Start posts now); the helper lines sit at line-height 1 so a box is its ink (they were 16.8 tall for 12px text — a shared `:is()` rule's heaviest argument, (0,7,1), pinned every .pb-echo at 1.4 and was split); the form and the preview sit the drawer's 24px apart (18); Never ends ends on its field's edge (2px in). Measured after, both columns: label → field 13, field → helper 8, every section break 22, insets 25 / 25 |

### Not opened

- nothing listed for this gate

## C7 · The Broadcast manifest, and posting

| | |
|---|---|
| Realm | broadcast |
| Kit | `local/pins2-board-3/redo/ui/broadcast.js` (`PostForm`, `BROADCAST_COLUMNS`), `local/pins2-board-3/redo/gates/lib.js` (`CharCount`), `local/pins2-board-3/redo/b4.css`, `local/pins2-board-3/redo/gates4/surfaces.js` (`BroadcastSurface`) |
| States on the board | Saved · One staged · Posting |
| Structure | — |
| Values | [`C7-*.md`](.) and `states.md` (generated) |

### Contract

- **The count row** under the text field: the counter everyone else uses (`CharCount`: cap 4,000, warn from 3,600) and then the budget chip across the rest of the row, in the counter's own classes (`g-fact b3-cc`), both 28px, both squared, 8px apart, both with the text mark (plan §19z 18:20–18:25 EDT). The budget bar is ONE bar: square segments meeting on a straight line inside the track's round clip, the fill's leading end round (19:53 EDT).
- **The text field** is 150px tall (was 100; his "1.5x").
- **Past 4,000 Stage is blocked**: the counter turns `over` (danger ink and edge, tooltip "N over") and Before staging says "N over the 4,000-character limit". 4,000 is /manage's modal cap and keeps a margin under Discord's delivery cap (plan §19z-h).
- **Past the shared 6,000 it only WARNS** (his pick, 2026-09-27): the budget chip turns `over` ("N over 6,000") and Before staging warns "With the live posts, N over the 6,000 one message carries"; Stage stays enabled. Each live post costs its text plus the 28-character Posted line the bot appends (`POSTED_LINE` in `ui/broadcast.js`).
- **Why the warning matters (verified 2026-09-26 21:19 EDT against `utils/announcement.js` and Discord's Embed Limits page):** the bot sends the oldest ten due posts in ONE followUp; over 6,000 in total, or a description over 4,096 (a text over 4,068), Discord rejects the whole reply and the catch does not mark them seen, so the same batch fails on every later command. The bot's fix is filed in `docs/db-deferred-list.md` ("The announcement limits, hardened on the board").
- **Before staging** (`.pb-ready`, the build drawer's `.f-stage` in the side column): Text · Dates · Delivery, each a jump to its field; the footer keeps only the buttons.
- **The banner** is the build drawer's `MediaWell` with Upload and Link and no key row, as the last field (his 2026-09-25 00:25 EDT).
- **Chip corners are one curve**: two stacked inset rings (`--cc-edge` outer, `--rule2` inner), no border — on `CharCount`, the budget chip and the filename chip (plan §19z-h).

### Components

| Component | File | Props |
|---|---|---|
| `lifecycleOf` | `local/pins2-board-3/redo/ui/broadcast.js` | — |
| `broadcastFilters` | `local/pins2-board-3/redo/ui/broadcast.js` | — |
| `ChangesAhead` | `local/pins2-board-3/redo/ui/broadcast.js` | `all, b3extra = null` |
| `queueWindow` | `local/pins2-board-3/redo/ui/broadcast.js` | — |
| `NowShowing` | `local/pins2-board-3/redo/ui/broadcast.js` | `live, cap, onEdit, onEditDates, onRemove, b3 = null` |
| `commonPrefix` | `local/pins2-board-3/redo/ui/broadcast.js` | — |
| `HeadsUp` | `local/pins2-board-3/redo/ui/broadcast.js` | `all, onSetEnd` |
| `PostForm` | `local/pins2-board-3/redo/ui/broadcast.js` | `initial, again = false, allAnnouncements, onSubmit, onCancel` |
| `BroadcastRealm` | `local/pins2-board-3/redo/ui/broadcast.js` | `session` |
| `CharCount` | `local/pins2-board-3/redo/gates/lib.js` | `n, cap = 0, warnAt = 0, line = false` |
| `Seg` | `local/pins2-board-3/redo/gates/lib.js` | `k, options, label` |
| `Stage` | `local/pins2-board-3/redo/gates/lib.js` | `tall = null, pad = false, scroll = false, sticky = false, children, cls = ''` |
| `Tries` | `local/pins2-board-3/redo/gates/lib.js` | `items` |
| `Gate` | `local/pins2-board-3/redo/gates/lib.js` | `id, gid, realm, title, sub, pins, controls = [], tries = null, notes = [], children` |
| `oneWeaponPerCategory` | `local/pins2-board-3/redo/gates/lib.js` | — |
| `weaponsWith` | `local/pins2-board-3/redo/gates/lib.js` | — |
| `useSignal` | `local/pins2-board-3/redo/gates/lib.js` | — |
| `PanelHead` | `local/pins2-board-3/redo/gates/lib.js` | `realm, views = null, value = null, onSet = null, counts = null, meta = null, cls = '', rightView = null` |
| `useData` | `local/pins2-board-3/redo/gates/lib.js` | — |

### States and interactions

| | |
|---|---|
| Board states | Saved · One staged · Posting |
| Keys handled | none of its own |
| Hover, focus, pressed | per state in `states.md` (forced :hover, :focus-visible, :active, generated) |

### Edge cases

- **Empty text**: Stage disabled, "Needs its text".
- **3,600+**: the counter warns.
- **Past 4,000**: blocked, counter `over`.
- **Past 6,000 with the live posts**: warned, not blocked.
- **A date that does not parse**: Before staging "Needs a readable date for the start/end".
- **A banner link that 404s**: the card drops the banner rather than drawing an empty box (plan, 2026-09-25 01:22 EDT).
- **Edit / Post again**: the same form; its own post is excluded from the budget.

### Motion

The counter's colour changes at 3,600 and 4,000; no motion.

### Accessibility

- Roles in the kit: `group`, `img`, `list`, `listitem`, `status`, `switch`, `tab`, `tablist`
- Fixed aria-labels in the kit: “Announcements in delivery order”, “Changes ahead”, “Dates and repeats”, “Delivery budget”, “Edit announcement”, “Fewer”, “More”, “Remove announcement”, “View”, “What the marks mean”
- Focus: the board's one focus glow on every typing field; keyboard walk not yet recorded per gate (see Not opened).

### His items (7)

| Source | # | Item, verbatim |
|---|---|---|
| `09-21-board4-intake.md:360` | 11 | `dl/100440-Arc.png` · Broadcast manifest · filter chips and rows · unclear beyond the All chip (item 1) |
| `09-21-board4-intake.md:386` | 11 | A question, not a fix: *"what exactly do those left side accent colors match to or represent?"* (Broadcast manifest rows) |
| `09-21-board4-intake.md:728` | 64 | the form's spacing · one rhythm, measured after: a label 13px over its field everywhere (Starts and Ends were 22.8 — the 32px switch set their label row; it now sits in a 12.5px row, centred on the label), a helper line 8px under its field (the count was 18, the default date 14), sections 22px apart (were 18), one 16px gutter (banner 12, dates 16, stepper 20); the mini card and the "1 a day max" pill both 28px tall and 10px apart; In Discord centred on Text's label (it sat 14px low on a sticky top); Cancel and Stage on the last field's foot, both 24px off the drawer's (were 16 and 40) |
| `09-21-board4-intake.md:730` | 66 | the banner is the build drawer's image well, Upload or Link, as the last field · `MediaWell` exported from b4/form.js with `sources`, `keyed` and `what`; the announcement form uses it with Upload and Link and no key row. The drop zone fills the column to the preview's foot ("Drop an image, or choose a file"); a link shows its size chip and the Discord preview shows the banner. Two class leaks fixed on the way: the post drawer's own field rules (descendant `.dwfield input`) boxed the well's link input and widened the form past its column — narrowed to `:not([data-bare])` and child labels; and a field's input counted ~190px toward the well's minimum width (`.b4 .f-fld > .f-in{width:0}`, build form widths re-measured unchanged). Flow test PASS 35 |
| `09-21-board4-intake.md:741` | 69 | "Posted now" under the banner, as a footer · the Discord card reads title, body, banner, then the timestamp, 10px under the banner as Discord draws an embed footer |
| `09-21-board4-intake.md:749` | 72 | a banner link that 404s drew an empty 148px box in the Discord card between the body and "Posted now" · the card tracks its banner's load and shows the broken-image mark, as board 1 drew it |
| `09-21-board4-intake.md:750` | 73 | a picked file's name cut to "doubl…" in the banner well · the well's tile is 136px in the post drawer (176 in the build card), so the name reads |

### Not opened

- the dead-space wheel on the post, History and confirm drawers open
- the count row, the over states and the Before staging panel in Edit and Post again, at narrow widths, and its rows' jump by click and keyboard
- the one-curve edge on the Broadcast gate's card chip and the filename chip's hover
- the other two-segment meters (Broadcast card, shared E6, Armory coverage)

## C8 · History

| | |
|---|---|
| Realm | history |
| Kit | `local/pins2-board-3/redo/gates/history.js` via `from3('history')`, `local/pins2-board-3/redo/b3/history.js` |
| States on the board | no state switch (Try buttons in its head) |
| Structure | [../../2026-09-15-pins2-board-3/handoff-3e.md § H1 and § 6](../../2026-09-15-pins2-board-3/handoff-3e.md) |
| Values | [`C8-*.md`](.) and `states.md` (generated) |

### Contract

- Board 3-E's § H1 (the time rail) and § 6 (his spacing numbers) are the structural spec. Board 4's row glow is drawn from raw `--c`; the v14 nitpick found History's and Broadcast's glow reading grey against board 3's oklch lift (item below).

### Components

| Component | File | Props |
|---|---|---|
| `B3History` | `local/pins2-board-3/redo/b3/history.js` | `rows, actors, total, onOpen, onRevert, onMore, hasMore, selectedId` |

### States and interactions

| | |
|---|---|
| Board states | no state switch (Try buttons in its head) |
| Keys handled | none of its own |
| Hover, focus, pressed | per state in `states.md` (forced :hover, :focus-visible, :active, generated) |

### Edge cases

- Board 3-E § H1 carries the empty and long-range cases of the time rail.

### Motion

Per Board 3-E's handoff and `motion.md`; Board 4 added none.

### Accessibility

- Roles in the kit: `button`, `note`
- Fixed aria-labels in the kit: “About this list”, “Reverse this change”
- Focus: the board's one focus glow on every typing field; keyboard walk not yet recorded per gate (see Not opened).

### His items (1)

| Source | # | Item, verbatim |
|---|---|---|
| `09-23-board4-v14-nitpick.m:14` | 1 | History's and Broadcast's row glow read grey · Board 4 rewrote both from raw `--c` and dropped board 3's round-15D oklch lift; their hues sit near L .6 · every manifest row (Armory, Broadcast, History) glows in `--glo`, its hue lifted to at least L .72 · `local/pins2-board-3/redo/b4.css` |

### Not opened

- the dead-space wheel on the post, History and confirm drawers open

## C9 · Admin traffic

| | |
|---|---|
| Realm | analytics |
| Kit | `local/pins2-board-3/redo/gates4/surfaces.js` (`AdminBar`) |
| States on the board | Product traffic · Admin included |
| Structure | — |
| Values | [`C9-*.md`](.) and `states.md` (generated) |

### Contract

- **The chip and the rail toggles share the realm's accent, tint and hover** — his intake items 12 and 15 ("The rail toggles and the admin traffic tints/colors don't match even tho they're supposed to be using the same accent color from the realm.").

### Components

| Component | File | Props |
|---|---|---|
| `AdminBar` | `local/pins2-board-3/redo/gates4/surfaces.js` | `state = 'off'` |

### States and interactions

| | |
|---|---|
| Board states | Product traffic · Admin included |
| Keys handled | none of its own |
| Hover, focus, pressed | per state in `states.md` (forced :hover, :focus-visible, :active, generated) |

### Edge cases

- Two states only: product traffic, admin included.

### Motion

Per Board 3-E's handoff and `motion.md`; Board 4 added none.

### Accessibility

- Roles in the kit: `group`
- Fixed aria-labels in the kit: none (labels are built from the data)
- Focus: the board's one focus glow on every typing field; keyboard walk not yet recorded per gate (see Not opened).

### His items (3)

| Source | # | Item, verbatim |
|---|---|---|
| `09-21-board4-intake.md:361` | 12 | `dl/100518-Arc.png` · Analytics · the realm tabs and Admin traffic · the active tab and toggle may not match the rail toggles (item 2) |
| `09-21-board4-intake.md:387` | 12 | *"The rail toggles and the admin traffic tints/colors don't match even tho they're supposed to be using the same accent color from the realm."* |
| `09-21-board4-intake.md:472` | 15 | C9's rail toggles and Admin traffic still don't share accent, tint and hover · the segment and chip recipes (v16 K3) — v16 claimed this matched |

### Not opened

- nothing listed for this gate

## Items the records do not tie to one gate (30)

| Source | # | Item, verbatim |
|---|---|---|
| `09-21-board4-intake.md:357` | 8 | `dl/100152-Arc.png` · a search field focused ("Find a weapon, code or attachment") · a thick olive halo and a gold caret, unlike the teal focus elsewhere |
| `09-21-board4-intake.md:365` | 16 | `dl/100851-Arc.png` · a close × hovered (grey) · its hover differs from the red clear × in the shot before |
| `09-21-board4-intake.md:376` | 1 | *"I want that entire pop up replaced with the styling of screenshot 4 + changing the "assault" "smg" etc text matching their accent color."* |
| `09-21-board4-intake.md:378` | 3 | Both: clearer wording (name the other blocker instead of "· 1 more") and restyle the chip. |
| `09-21-board4-intake.md:381` | 6 | *"Broken hover event. It used to be different before but now it goes transparent which is wrong"* |
| `09-21-board4-intake.md:382` | 7 | Card placement: the hover preview card's position or size is off. |
| `09-21-board4-intake.md:385` | 10 | *"When there's multiple lists, the expand barelyyyy opens it up. Make it expand more"* |
| `09-21-board4-intake.md:389` | 14 | *"The copy button doesn't have any hover events or confirmation when the code is copied"* |
| `09-21-board4-intake.md:393` | 18 | *"The fields get cut off/escape the background block when multiple loadouts are added"* |
| `09-21-board4-intake.md:498` | 19 | the Pick builds list's top fade: start slightly lower, a softer ramp · the board's top scroll fade (`local/pins2-board-3/redo/b3/fady.js`), every list under a sticky head |
| `09-21-board4-intake.md:525` | 3 | the peek's animation, slightly more refined · the same card's open, move and resize motion |
| `09-21-board4-intake.md:526` | 4 | a drop shadow so the peek floats above the content · the same card; check the board's existing floating surfaces for the shadow |
| `09-21-board4-intake.md:582` | 17 | Gunsmith code's code-fill chip: a wand-with-sparkles icon, yellow #F3C231 instead of --ok, reworded "Recognized 4 of 5 slots" · the code-recognition signal (a "look at this magic" tone, not a confirmation) |
| `09-21-board4-intake.md:583` | 18 | a code-filled slot's CODE chip becomes the yellow wand-and-sparkles icon alone · the same signal, per slot |
| `09-21-board4-intake.md:584` | 19 | beside "Attachments": a yellow "[wand+sparkles] Filled 4 slots" chip, then the normal "4 of 5" chip · the same signal, on the section heading |
| `09-21-board4-intake.md:586` | 21 | no green border on a code-filled slot's field; it looks like any other field · the attachment field's resting state |
| `09-21-board4-intake.md:588` | 23 | "Still needs one" is confusingly phrased · readiness copy |
| `09-21-board4-intake.md:729` | 65 | the count's fill in a pill · a 10px sunk capsule with a hairline ring, the fill a capsule inside it 2px from every edge |
| `09-21-board4-intake.md:740` | 68 | the whole counter and its bar in one pill chip · one 28px chip in the "1 a day max" pill's own fill, ring and mono: a 96px bar with its fill, then "5,835 of 6,000 left"; it sits where a helper sits, 8px under the Text field on its left edge (I had put only the bar's fill in a pill — his ask was the whole counter) |
| `09-21-board4-intake.md:763` | 79 | Table A's 8px column spacing inset the whole table inside the weapon bar and the figures, on both sides · the scroller spends that spacing outside: the slot labels start on the bar's edge and the last column ends 16px from the panel, as the bar does |
| `09-21-board4-intake.md:765` | 81 | the weapon shelf's 152px tiles pressed "Marksman" against "4 builds" · the shelf is 760px, tiles 184px, 38px between the class and the count |
| `09-21-board4-intake.md:766` | 82 | "2 not shown: BAL-27 4, 5" · "2 not shown: BAL-27 Builds 4, 5", in the board's own build wording |
| `09-23-board4-v15-plan.md:67` | 2 | CSS classes in one heredoc (K2, K3, K4, K5 tints, K6, K7, the ghost clearing), asserts per edit, `node --check`, reload |
| `09-23-board4-v15-plan.md:69` | 4 | Look: every surface in §3's last column with the devtools CLI, forced hover and focus, one contact sheet per class; the flow test `r22.cjs`; the interaction instrument `b4states.cjs` |
| `09-23-board4-v15-plan.md:70` | 5 | Fix what the looking found, re-shoot |
| `09-23-board4-v15-plan.md:71` | 6 | Records: this file's tracker, the intake log's handled mark, the Session 5 port list in `docs/db-deferred-list.md` (every change in a `ui/*` file or `app.css`), kit commit, main commit |
| `09-23-board4-v15-plan.md:72` | 7 | The publish popup, with the states not opened listed first |
| `09-23-board4-v15-plan.md:302` | 1 | the count chip sits INSIDE the category `<small>`, so the tag is baseline-set with the chip; v16's K7 ±1.25px nudges and board.css's `translateY` sit on top · move `<em class="wg-nb b3-sd-gn">` out of `<small>` (ui/armory.js), delete the nudges; the trim (board.css `text-box`) then centres each by its ink |
| `09-23-board4-v15-plan.md:312` | 16 | `.b4 .b3-xt-rm{top:-3px;height:28px}` pokes above its line · on its line, 24px |
| `09-23-board4-v15-plan.md:313` | 17 | `.b4 .b3-xt-all{--c:var(--realm-c)}` forced Armory red on every pick-all · drop it: a bay's chip inherits the bay's `--c`; the top one gets `MODE_HEX[xm]` |

## Reader test (inline, no sub-agent)

Written after the draft, as the questions Session 5 will ask of this file cold, each answered from this file alone:

| Question | Answered where |
|---|---|
| Which Compare table ships? | C3 Contract: not decided, his to pick — build nothing until he does |
| Can a post longer than 4,000 be staged? | C7 Contract: no, Stage is blocked |
| What happens past 6,000? | C7 Contract: a warning only; the bot-side fix is filed |
| Which copy chip goes in the Bulk ledger? | C1 and C2 Contracts: `CodeCell`, sized to the ledger |
| Is TOP 4 still a tier? | C1 Contract: no, removed from the system and the bot |
| Where are the exact pixel values? | the generated `C*.md` and `states.md` beside this file |
| What was never checked? | each gate's Not opened list |

