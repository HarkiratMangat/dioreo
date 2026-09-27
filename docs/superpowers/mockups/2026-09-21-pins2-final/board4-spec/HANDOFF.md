---
kind: reference
status: live
---

# Board 4: Collective — the handoff, gate by gate (Version 35)

*Rewritten 2026-09-27 02:47 EDT after Harkirat's harsh review ("i have doubts with your quality and level of work"). The first version (02:29 EDT) presented my paraphrases as his words, mixed superseded alternatives in with current rulings, invented a responsive rule and pointed at maps with none of Board 4's classes. Those are gone. This file is the AUTHORED half of the spec; everything generated sits beside it (README).*

## Who reads this, and in what order

**Route (his popup answer, 2026-09-27, before 02:40 EDT):** Session 4 standardizes over Board 4: Collective and publishes **Board 4: Final**; Session 5 ports Board 4: Final. So this file is Session 4's input first and Session 5's second. Where Session 4 changes a value, the regenerated spec wins over any value quoted here.

1. **This file** — per gate: what it is, the rulings that are current, how it behaves, what the data needs, and what nobody has opened.
2. **[`file-map.md`](file-map.md)** — what a port does with each kit file. **[`portal-diff.md`](portal-diff.md)** — the kit's changes to portal files, as diffs.
3. **[`switches.md`](switches.md)** — a selector carrying `html[data-b3-…]` is switched: port a live one without the qualifier, never a dead one.
4. **[`class-map.md`](class-map.md)** and **[`token-map.md`](token-map.md)** — the classes and custom properties the portal does not have. A declaration ported without them styles nothing, silently.
5. **The values** — `C1`–`C9` and `states.md`: every resolved declaration, forced hover, focus and active, with its kit `file:line`.

**Authority when two sources disagree:** the kit at Version 35 → his words in the intake log → this file → the plan's build log. This file quotes the first two; it never outranks them.

**His words are not copied here.** They sit, verbatim and dated, in [`docs/claude/pins2/handoffs/2026-09-21-board4-intake.md`](../../../../claude/pins2/handoffs/2026-09-21-board4-intake.md) and in the "His words" lines of [`2026-09-23-board4-v15-plan.md`](../../../../claude/pins2/handoffs/2026-09-23-board4-v15-plan.md). Each ruling below cites the line it comes from (`intake:N`, `plan:N`).

**What "checked on v35" means below:** the behaviour was looked at or measured on the local board at Version 35 in this session. Everything else is "built per the record" — the plan says it was built and measured then, and no one has re-opened it since. Treat those as the first things to open.

---

## The rulings that are current — every topic he decided, and what each replaced

| Topic | Gate | The ruling now | Source · replaced | v35 |
|---|---|---|---|---|
| Tier set | C1 C2 C3 C5 bot | Best · Top 3 · Top 5 · Capable. **TOP 4 is removed from the system and the bot** | `intake:534` (2026-09-24 12:13) · replaced TOP 4 | built per the record |
| Capable | all | a thumbs-up on TOP 4's design and colours; **exists for DMZ too** | `intake:534`, `intake:637` | built per the record |
| ASS grade | all | a poop icon; **ASS and META/Best/Top 3/Top 5/Capable disable each other**; TOXIC + ASS is allowed; motion **A · Stink lines** | `intake:638`, `intake:703` (2026-09-24 22:30) · replaced B Flies, C | built per the record |
| Tier words in the bot | bot | the bot says "Best AR", "Top 3 AR", "Top 5 AR", "Capable AR"; the portal may leave the category out | `intake:625` | not on the board (bot) |
| Badge runs | C1 C2 | no dot bullets between badges; META + BEST + TOXIC wraps to two lines | `intake:519` | built per the record |
| Rank Mode family | C1 C2 C3 C5 bot | HP · S&D · DOM · TDM · FTL · Control; one whitish plate; **MP only, several allowed**; bot `Recommended Rank Mode: {a \| b}`, portal `Rank Mode: {a \| b}`; his marks, expanded strokes, 20px in the plate, fill v2; motion C with drifting periods; words in capitals (stored `Control`) | `plan:530`, `plan:720`, `plan:593`, `plan:613`, `plan:674`, `plan:753` | capitals checked |
| Badge motion | all | `docs/reference/badge-motion.md` is the law | — | — |
| Add build form | C2 | **Form A · Instrument** | `intake:602` · replaced forms B, C | built per the record |
| Inline labels | C2 | **only Grade and Tier** (and Rank Mode) sit beside their label; Weapon and Category keep their labels above the field; **Label went back to its original format, its label above the field** | `intake:657`, `intake:674` · replaced "the whole form inline" and "Label inline" | checked on v35: Label above its field, BUILD n prefix inside it |
| Drawer width | C2 | **980** (preview 333, form 581); **Grade and Tier stay inline with several builds** ("we clearly have enough space") | `intake:703` (2026-09-24 22:30) · replaced 880 and 940, and "stacked for three" | checked on v35: drawer 980; with three builds Grade, Tier and Rank Mode sit beside their labels |
| Field corners | C2 C7 | every form field and search field takes the tier container's softer corner | `intake:713` | built per the record |
| Dropdowns | C2 | black ground (weapon, category, slot, stored image); no coloured dots; categories in capitals; no "melee"; slot labels in their accent | `intake:444`–`447` | built per the record |
| Several builds | C2 | each build's block tinted in its weapon category's accent | `intake:460` | built per the record |
| Key and image | C2 | a new build's key is never one in use; the "Your key" chip redesigned; the preview snaps to the nearest set aspect ratio; an image can be cleared | `intake:551`–`554` | built per the record |
| Code-filled slots | C2 | the wand-with-sparkles mark in yellow `#F3C231`; "Filled N slots" beside Attachments; slot names in their accents; no green border | `intake:567`–`571` | built per the record |
| Readiness | C2 | inline chips at the labels (Weapon required → checks → Ready) instead of a Ready chip; the Before staging panel in the empty space under the preview, anchored, rows jump to fields | `intake:572`–`578`, `intake:635`, `intake:658` | built per the record |
| Optional fields | C2 | an "Optional" chip on every optional field | `intake:680` | built per the record |
| Unchecked chips | C2 | rest at 0.6, 1 on hover; disabled 0.18 | `plan:749` · replaced 42% | checked on v35 (0.6) |
| Bulk | C2 | the format hint and in-list hints redesigned; the list scrolls; the product's MP/DMZ chips; the board's own chips; the Bulk create format (Export writes the same) | `intake:596`–`601`, `intake:206`–`234` | built per the record |
| Bulk head | C2 | the selection bar's View toggle: **Ledger / Embed** (was "Discord") | `plan:736` | checked on v35 |
| Bulk ledger card | C2 | Code row = the selection bar's `CodeCell`, sized to the ledger; a click keeps the code and ticks the mark `--ok` for 1.1s (every `CodeCell`); chip runs two lines, then sideways behind the fade; **a click anywhere on a card** jumps to its block and centres it clear of the fades | `plan:700`, `plan:708`, `plan:744`, `plan:759` | checked on v35 |
| Edit | C2 | "Editing X" is the selection bar's weapon chip with its ×, which removes that weapon's blocks | `intake:40` | built per the record |
| Dead space | C2 C5 | a wheel in a drawer's dead space scrolls the column that owns it | `plan:720` | checked on v35 (Export, Add, Bulk, Edit; not the post, History or confirm drawers) |
| Compare size | C3 | at most **6 builds** per comparison | `intake:50` | built per the record |
| Compare tables | C3 | **OPEN** — Table A/B/C and Empty A/B/C are his to pick | board note | — |
| Compare badges | C3 | the **tighter** look (tracking reset), runs **at most two lines**, then sideways behind the fade | his popup answer, 2026-09-27, before 02:17 EDT | checked on v35 |
| Compare chips | C3 | the colour-accented slot chip (e.g. Ammunition), as everywhere else | `intake:462` | built per the record |
| Repairs | C4 | the "N builds pass" tile under its own section label and spacing; the "N builds" chip in the Never chip's shape; tickets have **no** hover | `intake:270`, `intake:291`, `plan:744` | built per the record |
| Export | C5 | the list reads the Bulk create format; attachment chips are the manifest's; MP/DMZ follows the weapon and build; pick-all tinted by its category (the top one by its own); list fades; a clean ×; the filename chip's × and ✓ | `intake:669`–`671`, `intake:465`, `intake:272`, `intake:276`, `intake:490`, `intake:271`, `intake:480` | built per the record |
| Broadcast rows | C7 | middle-aligned; the Armory's delete button; State chips with board 2's rounder corners, no colour dots; an active sort label brightens; a row click opens the editor, an Ended row opens Post again; the staged chip's dash on top, right and bottom only | `intake:80`–`86` | built per the record |
| Post form | C7 | the count row: `CharCount` + the budget chip in the counter's own style, squared, one-piece bar; 150px text field; the banner is the build drawer's image well, last; "Posted" as a footer under the image; **past 4,000 Stage is blocked; past the shared 6,000 it only warns** | `plan:761`–`767`, `intake:723`, `intake:733`, his popup answers, 2026-09-26 20:07 EDT (the harden) and 2026-09-27 before 02:17 EDT (warn only) | checked on v35 |
| Admin traffic | C9 | the chip and the rail toggles share the realm's accent, tint and hover | `intake:100`, `intake:463` | built per the record |
| Toggles | all | the pressed tint is the realm's accent; "All" takes it too, and hovers like its neighbours; the drawer's Add build / Bulk create switch is a rail toggle | `intake:287`–`290`, `intake:336`–`337` | built per the record |
| Selection bar | C1 | a soft drop shadow and a subtle border; the list reveal as smooth as Export's; Edit builds / Export hover in `--staged` / `--ok` | `intake:12`–`14`, `plan:288` | built per the record |
| Fades | all | the board's fade (`b3/fady.js`), never a lift; the build form's fade starts where Export's does; Pick builds' top fade slightly lower | `intake:340`, `intake:490` | built per the record |
| Manifest row | C1 | the category label centred on the row, a little more space before "N builds"; "N builds" in the selection bar's build-chip style, no bullet | `intake:338`, `intake:414`, `intake:293` | built per the record |
| Discard confirm | C2 C7 | redesigned twice at his word (plan §10, §13) | `plan:146`, `plan:251` | built per the record |
| Phone | all | **out of scope — "phone doesn't matter… It's a future scope."** | batch-2 plan §5d Step 8 (2026-09-21 10:41 EDT) | — |

---

## Per gate

For each gate: the kit files and the portal file each becomes (from [`file-map.md`](file-map.md)), the states the board shows, what the data needs, and what was never opened. Values are in the gate's generated file.

### C1 · The Armory manifest — `C1-armory-manifest.md`

| | |
|---|---|
| Kit → portal | `b3/armory-parts.js` (badges, `CodeCell`, the selection bar, the problem card) → `portal/ui/armory.js`, `portal/ui/manifest.js` · `ui/manifest.js`, `ui/armory.js` → their portal twins by `portal-diff.md` · `b3/volt.js`, `b3/bolt*.svg` → the META badge |
| Structure | Board 3-E's handoff § M1 (`../../2026-09-15-pins2-board-3/handoff-3e.md`), plus the rulings above |
| States | resting; Try: open a problem, open another, pick one build (the selection bar and its list) |
| Data | the badge fields below ("What the data needs") |
| Never opened | CONTROL in Export's tiles and hover card, the selection bar head and the palette · the View toggle's keyboard focus · the Code chip's keyboard focus |

### C2 · New build — Add, Bulk, Edit, DMZ — `C2-new-build.md`

| | |
|---|---|
| Kit → portal | `b3/drawer.js` (the drawer), `b4/form.js` (Form A, `MediaWell`), `b4/bulk.js` + `b4/bulkformat.js` (Bulk, the format reader and writer, tested in `b4/bulkformat.test.mjs`), `b4/*.css`, `b3/fady.js` → the build drawer in `portal/ui/armory.js` and a shared scroll-edge utility in `portal/ui/` |
| Structure | board 1's G9 drawer (`../../2026-09-14-pins2-board/handoff-g9-g8.md`) as Board 4 rebuilt it; the rulings above govern where they differ |
| States | Add build · Add · filled · Add · three · Bulk · empty / one / several / typing / warning / can't read / pasted / duplicate · DMZ · Edit 3 builds |
| Keys | Enter, Escape, Tab, arrows in the pickers; ⌘/Ctrl+Enter stages, a blocked Stage jumps to its reason (checked in `b3/drawer.js`) |
| Edge cases | a misspelt token (`bestt`) warns; a block with no weapon line can't be read; a duplicate block is named; a Rank Mode token on a DMZ block warns; eight builds still jump clear of the fades; closing stages nothing |
| Never opened | the Code chip in Embed view and in Edit · two-line runs in Edit, the DMZ card, the ghost, and a resize while scrolled · the card jump in Embed view · the 60% chips in Edit and DMZ, and the unchecked Rank Mode tile's word (0.72 × 0.6 ≈ 0.43) · fady's `characterData` observer while typing (cost never measured) · the dropdowns' black ground and the Optional chips, with several builds |

### C3 · Compare — `C3-compare.md`

| | |
|---|---|
| Kit → portal | `b4/compare.js` (`B4Compare`), `b4/compare.css` → Compare in `portal/ui/armory.js` |
| Structure | board 1's G10, rebuilt on Board 4; **the table and the empty state are still his pick** — build nothing for them until he picks |
| States | One weapon · Two weapons · One build · Empty, each in Table A, B and C and Empty A, B and C (the generator now walks every fork option) |
| Behaviour | a differing cell is measured against the first build of its own weapon and takes that build's colour; hidden columns read "2 not shown: BAL-27 Builds 4, 5"; ASS and DMZ tiers count as badges |
| Never opened | the empty states' keyboard walk |

### C4 · Repairs — `C4-repairs.md`

| | |
|---|---|
| Kit → portal | `b3/repairs.js` → Repairs in `portal/ui/armory.js` |
| Structure | Board 3-E's handoff § M2, plus the rulings above |
| States | Today's · A clean day |

### C5 · Export — `C5-export.md`

| | |
|---|---|
| Kit → portal | `gates/armory.js` (`ExportPicker` and the landing) → `portal/ui/exportPanel.js` · `ui/exportPanel.js` by `portal-diff.md` · `gates/lib.js` (`CharCount`) → `portal/ui/broadcast.js` and `portal/ui/exportPanel.js` |
| Structure | Board 3-E's handoff § M3, plus the rulings above |
| States | Landing · Picker · Three picked |
| Data | the file writes the Bulk create format (deferred list, "Added 2026-09-24 16:47 EDT") |

### C6 · The delivery queue — `C6-delivery-queue.md`

| | |
|---|---|
| Kit → portal | `b3/broadcast.js` → `portal/ui/broadcast.js` |
| Structure | Board 3-E's handoff § B1; Board 4 changed none of its rules after Version 10 |

### C7 · The Broadcast manifest, and posting — `C7-broadcast.md`

| | |
|---|---|
| Kit → portal | `ui/broadcast.js` (`PostForm`, the columns) by `portal-diff.md` · `gates/lib.js` (`CharCount`) · `b4.css` (the count row, `.pb-ready`) · `b4/form.js` (`MediaWell`) |
| Structure | board 2's G11 for the manifest; board 1's G8 for the drawer (`handoff-g9-g8.md`), as Board 4 rebuilt it |
| States | Saved · One staged · Posting |
| Limits | empty → Stage off, "Needs its text" · 3,600+ → the counter warns · past 4,000 → blocked, the counter `over` · past the shared 6,000 with the live posts → warned, not blocked; each post costs its text plus the 28-character Posted line (`POSTED_LINE`) · an unreadable date → "Needs a readable date for the start/end" · a banner link that 404s → no empty box |
| Why 6,000 matters | the bot sends the oldest ten due posts in one reply; over 6,000, or a text over 4,068, Discord rejects the whole reply and the same batch fails on every later command (verified 2026-09-26 21:19 EDT against `utils/announcement.js` and Discord's Embed Limits) |
| Never opened | the count row, the over states and Before staging in Edit and Post again, at narrow widths, and its rows' jump by click and keyboard · the one-curve edge on the Broadcast card chip and the filename chip's hover · the other two-segment meters (Broadcast card, shared E6, Armory coverage) · the dead-space wheel with the post drawer open |

### C8 · History — `C8-history.md`

| | |
|---|---|
| Kit → portal | `b3/history.js` → `portal/ui/history.js`; `ui/history.js` by `portal-diff.md` |
| Structure | Board 3-E's handoff § H1 and § 6 (his spacing numbers) |
| Known | History's and Broadcast's row glow read grey against board 3's oklch lift (v14 nitpick) |
| Never opened | the dead-space wheel with the event drawer open |

### C9 · Admin traffic — `C9-admin-traffic.md`

| | |
|---|---|
| Kit → portal | `gates4/surfaces.js` (`AdminBar`) → Analytics' view bar |
| States | Product traffic · Admin included |

---

## What the data and the bot need — none of it is visible on the board

A design port that stops at CSS ships a Capable badge nobody can save. Every item below is filed with its files and a verify condition in [`docs/db-deferred-list.md`](../../../../db-deferred-list.md); the entry names are exact.

| Change | Where it lands | Entry in the deferred list |
|---|---|---|
| TOP 4 retired, Capable and ASS added: `categoryRank` drops `top4` and gains `capable`; `isAss` beside `isMeta` / `isToxic`; ASS excludes META and every tier; a pasted `top4` stages as Top 5 with a warning; stored `top4` data migrates | `models/Loadout.js`, the parser, the renderer, the portal, stored data | "The badge set changes: Top 4 retired, Capable and Ass added — the model, the bot and the portal" |
| Rank Mode: `rankModes: [String]` (HP, S&D, DOM, TDM, FTL, Control; MP only); the Badges-line tokens and aliases; `Recommended Rank Mode: {a \| b}` with his custom emoji; the portal label | `models/Loadout.js`, `utils/adminParser.js`, `utils/loadoutRender.js`, `core/ops/loadouts.js`, `portal/api/bulk.js`, `handlers/manage/loadouts.js` | "A new set of badges — design on Board 4, then implement in the bot and portal exactly as ASS and CAPABLE" |
| The Bulk create format, which Export also writes | `utils/adminParser.js`, the Export writer | the Board 4 bullet "Added 2026-09-24 16:47 EDT (Board 4 v20, for Session 5 to port)" |
| The announcement limits: the op refuses text over 4,000; delivery splits into replies that fit and logs the real reason | `core/ops/announcements.js`, `utils/announcement.js` | "The announcement limits, hardened on the board — the bot and portal must match" |

**Mongoose persists only declared fields** (CLAUDE.md): every new field lands in its schema in the same change as the code that writes it.

---

## What this spec does not have yet

- **Board 4's measured relations** — Board 3-E had `measure.cjs` (pixel relations); its selectors are board 3's, and Board 4 has no relations file. The values files are resolved declarations, not relations.
- **Accessibility beyond keys** — focus order, ARIA roles and screen-reader announcements were never walked on Board 4. Keys that are handled are named per gate above; everything else is unrecorded.
- **The generator's own coverage holes** — the README lists every classed element no pass reached ("Not reached"), and every ⚠️ row is a winning declaration the computed value contradicts. Each is unexamined until opened.
