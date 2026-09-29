---
kind: reference
status: live
---

# Board 4: Collective — the handoff, gate by gate (Version 42)

*Rewritten 2026-09-27 02:47 EDT after Harkirat's harsh review ("i have doubts with your quality and level of work"). The first version (02:29 EDT) presented my paraphrases as his words, mixed superseded alternatives in with current rulings, invented a responsive rule and pointed at maps with none of Board 4's classes. Those are gone. This file is the AUTHORED half of the spec; everything generated sits beside it (README).*

> 🔨 **VERSION 42 — rewritten 2026-09-29 18:50 EDT.** Board 4 Version 42 (published 2026-09-29 18:42 EDT on his "you can publish v42") carries his Version 40 round (classes A–U) and his Version 41 round (classes V–AH), both built; **his review of Version 42 is pending and the Collective is not signed off**. The Compare rows and C3's per-gate table below are rewritten from the kit and the two rounds' "Built in the kit" tables in [the intake log](../../handoffs/2026-09-21-board4-intake.md); every other row names the class that changed it. His words there still win over this file.

## Who reads this, and in what order

**Route (his popup answer, 2026-09-27, before 02:40 EDT):** Session 4 standardizes over Board 4: Collective and publishes **Board 4: Final**; Session 5 ports Board 4: Final. So this file is Session 4's input first and Session 5's second. Where Session 4 changes a value, the regenerated spec wins over any value quoted here.

1. **This file** — per gate: what it is, the rulings that are current, how it behaves, what the data needs, and what nobody has opened.
2. **[`file-map.md`](file-map.md)** — what a port does with each kit file. **[`portal-diff.md`](portal-diff.md)** — the kit's changes to portal files, as diffs.
3. **[`switches.md`](switches.md)** — a selector carrying `html[data-b3-…]` is switched: port a live one without the qualifier, never a dead one.
4. **[`class-map.md`](class-map.md)** and **[`token-map.md`](token-map.md)** — the classes and custom properties the portal does not have. A declaration ported without them styles nothing, silently.
5. **The values** — `C1`–`C9` and `states.md`: every resolved declaration, forced hover, focus and active, with its kit `file:line`.

**Authority when two sources disagree:** the kit at Version 42 (`docs/pins2/kit/`) → his words in the intake log → this file → the plan's build log. This file quotes the first two; it never outranks them.

**His words are not copied here.** They sit, verbatim and dated, in [`docs/pins2/handoffs/2026-09-21-board4-intake.md`](../../handoffs/2026-09-21-board4-intake.md) and in the "His words" lines of [`2026-09-23-board4-v15-plan.md`](../../handoffs/2026-09-23-board4-v15-plan.md). Each ruling below cites the line it comes from (`intake:N`, `plan:N`).

**The "Last checked" column says exactly when each was looked at.** "This session, v35" = opened on the local board at Version 35 on 2026-09-27. "Measured, plan §…" = measured when it was built (Versions 32–34), not re-opened on v35. "Built per the record" = the plan says it was built and checked then; no one has opened it since. Open the last two kinds first.

---

## The rulings that are current — every topic he decided, and what each replaced

| Topic | Gate | The ruling now | Source · replaced | Last checked |
|---|---|---|---|---|
| Tier set | C1 C2 C3 C5 bot | Best · Top 3 · Top 5 · Capable. **TOP 4 is removed from the system and the bot** | `intake:534` (2026-09-24 12:13) · replaced TOP 4 | built per the record |
| Capable | all | a thumbs-up on TOP 4's design and colours; **exists for DMZ too** | `intake:534`, `intake:637` | built per the record |
| ASS grade | all | a poop icon; **ASS and META/Best/Top 3/Top 5/Capable disable each other**; TOXIC + ASS is allowed; motion **A · Stink lines** | `intake:638`, `intake:703` (2026-09-24 22:30) · replaced B Flies, C | built per the record |
| Tier words in the bot | bot | the bot says "Best AR", "Top 3 AR", "Top 5 AR", "Capable AR"; the portal may leave the category out | `intake:625` | not on the board (bot) |
| Badge runs | C1 C2 | no dot bullets between badges; META + BEST + TOXIC wraps to two lines | `intake:519` | built per the record |
| Rank Mode family | C1 C2 C3 C5 bot | HP · S&D · DOM · TDM · FTL · Control; one whitish plate; **MP only, several allowed**; bot `Recommended Rank Mode: {a \| b}`, portal `Rank Mode: {a \| b}`; his marks, expanded strokes, 20px in the plate, fill v2; motion C with drifting periods; words in capitals (stored `Control`) | `plan:530`, `plan:720`, `plan:593`, `plan:613`, `plan:674`, `plan:753` | capitals measured, plan §19z (2026-09-26 17:48 EDT) |
| Badge motion | all | `docs/reference/badge-motion.md` is the law | — | — |
| Add build form | C2 | **Form A · Instrument** | `intake:602` · replaced forms B, C | built per the record |
| Inline labels | C2 | **only Grade and Tier** (and Rank Mode) sit beside their label; Weapon and Category keep their labels above the field; **Label went back to its original format, its label above the field** | `intake:657`, `intake:674` · replaced "the whole form inline" and "Label inline" | this session, v35: Label above its field, BUILD n prefix inside it |
| Drawer width | C2 | **980** (preview 333, form 581); **Grade and Tier stay inline with several builds** ("we clearly have enough space") | `intake:703` (2026-09-24 22:30) · replaced 880 and 940, and "stacked for three" | this session, v35: drawer 980; with three builds Grade, Tier and Rank Mode sit beside their labels |
| Field corners | C2 C7 | every form field and search field takes the tier container's softer corner | `intake:713` | built per the record |
| Dropdowns | C2 | black ground (weapon, category, slot, stored image); no coloured dots; categories in capitals; no "melee"; slot labels in their accent | `intake:444`–`447` | built per the record |
| Several builds | C2 | each build's block tinted in its weapon category's accent | `intake:460` | built per the record |
| Key and image | C2 | a new build's key is never one in use; the "Your key" chip redesigned; the preview snaps to the nearest set aspect ratio; an image can be cleared | `intake:551`–`554` | built per the record |
| Code-filled slots | C2 | the wand-with-sparkles mark in yellow `#F3C231`; "Filled N slots" beside Attachments; slot names in their accents; no green border | `intake:567`–`571` | built per the record |
| Readiness | C2 | inline chips at the labels (Weapon required → checks → Ready) instead of a Ready chip; the Before staging panel in the empty space under the preview, anchored, rows jump to fields; its minimise − has no ring at rest, a ground and ring on hover, 24px, sized to the heading it sits in (Version 40 A) | `intake:572`–`578`, `intake:635`, `intake:658` | built per the record · Version 40 round, class A: built, published as Version 41 (2026-09-29 16:50 EDT) |
| Optional fields | C2 | an "Optional" chip on every optional field | `intake:680` | built per the record |
| Unchecked chips | C2 | rest at 0.6, 1 on hover; disabled 0.18 | `plan:749` · replaced 42% | measured, plan §19z (2026-09-26 17:45 EDT) |
| Bulk | C2 | the format hint and in-list hints redesigned; the list scrolls; the product's MP/DMZ chips; the board's own chips; the Bulk create format (Export writes the same) | `intake:596`–`601`, `intake:206`–`234` | built per the record |
| Bulk head | C2 | the selection bar's View toggle: **Ledger / Embed** (was "Discord") | `plan:736` | measured, plan §19z (2026-09-26 16:35 EDT) |
| Bulk ledger card | C2 | Code row = the selection bar's `CodeCell`, sized to the ledger; a click keeps the code and ticks the mark `--ok` for 1.1s (every `CodeCell`); chip runs two lines, then sideways behind the fade; **a click anywhere on a card** jumps to its block and centres it clear of the fades | `plan:700`, `plan:708`, `plan:744`, `plan:759` | measured, plan §19y–§19z (2026-09-26 15:41–18:08 EDT) |
| Edit | C2 | "Editing X" is the selection bar's weapon chip with its ×, which removes that weapon's blocks | `intake:40` | built per the record |
| Dead space | C2 C5 C7 | a wheel in a drawer's dead space scrolls the column that owns it — now every drawer (the "Drawer scrolling" standard below) | `plan:720` | measured, plan §19z (2026-09-26 16:28 EDT): Export, Add, Bulk, Edit; never the post, History or confirm drawers |
| Compare size | C3 | at most **6 builds**, from any number of weapons; a build chip is ON (in the table) or OFF; weapons arriving together take turns filling the six; at six an OFF chip is refused and the band's seats readout flashes (`deny`) | `intake:50` · C3 round class Y · Version 40 B, O (the limit chip retired into the band) | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending |
| Compare panel | C3 | **Cards alone** (~~Grid~~ Version 40 Q · ~~Lanes~~ Version 41 X · ~~Embed as a view~~ Version 40 Q); the top is the search and the picked weapons' tiles, top-right **Clear builds · Remove all weapons** where VIEW was; a **band between the tiles and the table** holds the seats readout (a seat per build in its weapon's colour, never Broadcast's), the "Same on all N" chips (Category one of them) and the "Shared" chips; the table never scrolls sideways at six builds across three weapons | Version 40 B, G, O, Q · Version 41 X, AE, AD | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending |
| Compare search | C3 | 560px (the landing's width), grouped by category (AR · SMG · LMG · MARKSMAN · SNIPER · SHOTGUN · SECONDARIES), A–Z within; **stays open after a pick**; each weapon's row carries its build numbers as the tile's chips: the row adds the weapon, a number adds that one build (or toggles it once the weapon is in); rows are the build drawer's (left-aligned, no tick); the landing has the same list, and its first pick opens the table with the bar's list still open | Version 40 F · Version 41 AF | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending |
| Compare weapon tile | C3 | one `Tile` for the bar and the landing: 120–260px wide, the name at the 10px padding with its category under it in capitals in the category's colour, two rows at most then a sideways fade; the tint as strong as the table's columns, radius 10 and its ring (no top-edge highlight); a chip per build, ON filled and OFF dashed, whose corner mark is an 18px disk in the build's colour with a near-black − or +, never red; the × has no ring at rest and takes the weapon's colour on hover; hovering a chip lights its cells | C3 round class W · Version 40 A, C, N · Version 41 V, Z, AA · his "the tiles were fine as they were" (Version 40 build) | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending |
| Compare heads | C3 | a weapon is a group: its head is a band over its builds (the name, its category under it), and hovering it lights its columns; each build head is the board's build chip (`.b3-sd-gn`) with **the manifest's image mark right-aligned** (`.wg-im`: ok image, or the warn triangle), then its label or "No label", then its badges as the wordless badge that **opens into the full badge on hover** (on its own ground, the run's fade dropped while hovered); no rule under the names | C3 round class Z · Version 40 H, M, P · Version 41 AC, W, V | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending |
| Compare division | C3 | no line between weapons: each weapon's columns carry a wash of its colour, with a 4px gutter column between weapons — measured: heads 6px apart within a weapon and 16px between weapons, cell boxes 18px and 28px | Version 40 H · Version 41 AG (*"not a fan of the divider line"*) | measured 2026-09-29 18:50 EDT |
| Compare rows | C3 | every body row 64px (two lines), a hairline between rows; row names in capitals in their slot's colour (9.5px, .12em) in a 96px column, and a row name lights its row on hover; **GUNSMITH CODE** is always a row, its label on two lines in white; the code cell copies from anywhere, its copy mark flipping to `--ok` | Version 40 I, J, L · Version 41 Y, AB, V | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending |
| Compare cells | C3 | each cell is read against the other builds of ITS weapon: tinted = an odd one out (a tie tints all); a missing part among builds that carry it = the dash in the odd-one-out tint; **one empty, the dash**; builds that agree merge into one cell with no count in it (the band's Shared chip names the builds); a gunsmith code is never tinted; a cell's fill runs its row's full height; hover by strength — the hovered cell ring 90%, fill 22%, white text; its row and column a faint lift | his popup answers 2026-09-28 14:52–15:05 EDT · Version 40 K · Version 41 V, AD | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending |
| Compare column actions | C3 | under each column the manifest row's **share · edit │ delete** (`.wg-ib`, its tints): share copies `shareCommandText`, edit opens the build in the build drawer over the panel, delete takes it out of the table and stages its deletion | Version 41 AB | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending; the delete is the board's stand-in message |
| Compare one build | C3 | the regular table plus a dashed **suggested** column (a same-category weapon's first build, else any weapon's) with an Add | Version 40 Q | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending |
| Compare landing | C3 | the faded table behind it (his v10 keep); the two readouts in the hint-chip class (Version 40 U), one row with a step mark; 10–16 real tiles in at most three centred rows across ~900px, a fresh draw each time the panel empties; the whole tile hovers and lights every build; the + a bare glyph that shows its tinted box on tile hover | Version 40 S · his "#2 bare glyph", "when hovered, show #1's resting box" | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending |
| Compare Discord cards | C3 | not a view: a bar under the table — a fan of the cards in miniature, each edged in its build's colour, the title "Discord cards" and "N builds, as the bot posts them", a Show / Hide pill in Discord's blurple; the fan closes while the cards are open; each card is as tall as its content | Version 40 Q, R · Version 41 AH | Version 42 (kit read 2026-09-29 18:50 EDT); his review pending |
| Repairs | C4 | the "N builds pass" tile under its own section label and spacing; the "N builds" chip in the Never chip's shape; tickets have **no** hover | `intake:270`, `intake:291`, `plan:744` | built per the record |
| Export | C5 | the list reads the Bulk create format; attachment chips are the manifest's; MP/DMZ follows the weapon and build; pick-all tinted by its category (the top one by its own); list fades; a clean ×; the filename chip's × and ✓; the peek card fades out where it was, never from the list's top (Version 40 D) | `intake:669`–`671`, `intake:465`, `intake:272`, `intake:276`, `intake:490`, `intake:271`, `intake:480` | built per the record · Version 40 round, class D: built, published as Version 41 (2026-09-29 16:50 EDT) |
| Broadcast rows | C7 | middle-aligned; the Armory's delete button; State chips with board 2's rounder corners, no colour dots; an active sort label brightens; a row click opens the editor, an Ended row opens Post again; the staged chip's dash on top, right and bottom only | `intake:80`–`86` | built per the record |
| Post form | C7 | *(the count row and the 150px field are superseded by "The post's Text field" and "Budget" rows above)* the banner is the build drawer's image well, last; "Posted" as a footer under the image; **past 4,000 Stage is blocked; past the shared 6,000 it only warns**; Text, Accent and Banner are section headings in the build drawer's `.f-h` (15px, 600, a rule to the right, the state chip beside it), and Text has no other label; shuffle, calendar and copy sit on the fields' dark fill, tinted in the post's accent and filled with it on hover (Version 40 T, E) | `plan:761`–`767`, `intake:723`, `intake:733`, his popup answers, 2026-09-26 20:07 EDT (the harden) and 2026-09-27 before 02:17 EDT (warn only) | measured, plan §19z–§19z-h (2026-09-26 18:20–20:07 EDT) · Version 40 round, class T, E: built, published as Version 41 (2026-09-29 16:50 EDT) |
| Date picker | C6 C7, every realm | one `DateGrid` for every date the portal sets: the build drawer's dropdown ground; 270 wide, 36px days in 38px rows, the month centred between arrows over the first and last columns, 14px numbers, weekdays in title case, **Sunday first**, today a dot; **no quick picks**; every accent reads `--dp-c`, which defaults to the realm's `--realm-c` (picked = the realm toggles' pressed recipe, hover = their 11% tint) | `intake:801` (2026-09-27 19:12, 19:18 EDT), Sunday first his popup answer · replaced the 312px Monday-first picker with quick picks (18:58 EDT) | this session: Starts, Ends, Set end date, a Season-coloured test, a real-mouse hover on a day, an arrow and the calendar button |
| Queue card chips | C6 | a chip that IS a field opens its editor where it sits, in the pop-up family: End (Never or a date), Start while the post has not begun, and a showings chip beside "Active for" ("Shown once" / "Shown 2 times") with its own stepper pop-up; hover is the neutral family (ring, no fill) · 2026-09-28 14:25 EDT: the drawer's "1 a day max" chip takes the showings chip's repeat mark; the queue head's slots meter is one fill in the realm's pink, the budget chip's meter 112px (the slots' 56) | `intake:827` (2026-09-27 20:34 EDT) | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| Set end date | C6 | opens on the date the post holds, else **tomorrow**, highlighted; the pop-up has **no heading** | `intake:827` + his reply 20:39 EDT · replaced today + 14 and the "Stop showing it / live since" heading | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| Collapse / Expand | C6 C7 | one control — Export's Pick builds button (`.b3-xf-ib` + `Fold`), worded Collapse / Expand, **hidden when the text fits** its two lines; **2026-09-28 19:37 EDT:** every fold eases its height (`foldEase`, `docs/pins2/kit/b3/broadcast.js`, ~260ms both ways), never a one-frame swap | `intake:847` · replaced "Show all / Show less" | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| The post's Text field | C7 | the queue card's quote box: folded (two lines, the post's accent, the default each time the drawer opens) or open (the fields' black, the focus glow round the whole box, animated); its footer holds the counter and budget chips stacked, at their own widths, and Collapse / Expand · 2026-09-28 14:25 EDT: the counter chip wears the chips' **1px** edge (~~the 2px double ring~~), everywhere it draws | `intake:847`, `intake:857` | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| Label-row state | C7, every form drawer | each field's label carries its state: ✓ when filled, Optional, Auto, or a warn chip (Required, Over 4,000, Can't read, Hard to see) — the build form's vocabulary; on a section heading the chip sits beside the heading; Starts and Ends keep their Optional chips (his popup during the Version 40 build: "Keep them") | `intake:827` | this session, v36 kit (checked 2026-09-27 22:08 EDT) · Version 40 round, class T: built, published as Version 41 (2026-09-29 16:50 EDT) |
| Date readout | C7, every date field | the line under a date is a readout: its mark, the value in ink, a hairline, what it means ("Now \| when you commit it", "Thu Nov 26 \| 60 days after it starts", "✓ Fri Oct 2 \| live in 5 days"); never wraps; a hint chip 6px under its field on a solid ground, its mark in a 22px tinted square in the readout's tone — Compare's landing readouts are the same class (Version 40 U) | `intake:827` | this session, v36 kit (checked 2026-09-27 22:08 EDT) · Version 40 round, class U: built, published as Version 41 (2026-09-29 16:50 EDT) |
| Stepper | C6 C7 | one stepper on the fields' ground; its end buttons take the container's corners so the neutral hover ring bends with them; in the showings pop-up it sits **centred**, its count and ring in the post's accent, (~~"per player · 1 a day max"~~; ~~one glyph per showing under it~~ — dropped, his answer 2026-09-28 19:13 EDT; the post drawer's per-showing card row `.pb-cards` dropped with it, 19:50 EDT, "1 a day max" kept beside the stepper) | `intake:827` · his C3 round (`intake` § C3 Compare intake round) classes L, M | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Accent | C6 C7 bot | **an in-form block, not a pop-up** (`AccentBlock`, `docs/pins2/kit/b3/broadcast.js`), on the image block's ground: layout "split" — the colour area (200 × 138) with its hue bar under it; Recent (2 rows of 9, every shuffled, typed or dragged colour) and Saved (9 slots) beside it, the hex field (strips a pasted `#`, a copy button inside) and New colour under them; a saved colour hovered floats and splits into USE and, past a hairline, REPLACE (the current colour sliding out from under it), hex chips beside Recent/Saved; 240ms open and close; Recent and Saved persist in the browser (per admin in the portal — Session 5 data note); his values are in the intake log's last block (~~sixteen presets in a pop-up, the "Tints the card…" hint~~) | his C3 round (`intake` § C3 Compare intake round) classes N, L · mockup `docs/pins2/intake-shots/intake-v38/accent-mock.html` | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) · Version 40 round, class E, T: built, published as Version 41 (2026-09-29 16:50 EDT) |
| Budget | C6 C7 | the shared 6,000 is drawn as segments, one per post in its accent — in the post drawer and as a third chip in the queue head | `intake:827` | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| Chip shape | all | chips are rectangles (6px corners) — the queue head's readouts and "1 a day max" were pills | `intake:827` | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| Share | C1 | the manifest row's share button hovers in `--ok`, the delete's plate recipe in green | `intake:789` (2026-09-22 12:53 EDT) | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| The queue lists | C6 | the live posts in delivery order, then the upcoming (a calendar mark in the number's place, "Starts in 32d"), then a staged post (dashed, a + mark, STAGED); Changes ahead lists a staged post's start | `intake:847` (the examples he asked for) | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
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
| Structure | inherited — [`handoff-3e.md`](../../../superpowers/mockups/2026-09-15-pins2-board-3/handoff-3e.md) § M1 (frozen at Board 3-E v77; the kit and the rulings above win where they differ) |
| States | resting; Try: open a problem, open another, pick one build (the selection bar and its list) |
| Data | the badge fields below ("What the data needs") |
| Never opened | CONTROL in Export's tiles and hover card, the selection bar head and the palette · the View toggle's keyboard focus · the Code chip's keyboard focus |

### C2 · New build — Add, Bulk, Edit, DMZ — `C2-new-build.md`

| | |
|---|---|
| Kit → portal | `b3/drawer.js` (the drawer), `b4/form.js` (Form A, `MediaWell`), `b4/bulk.js` + `b4/bulkformat.js` (Bulk, the format reader and writer, tested in `b4/bulkformat.test.mjs`), `b4/*.css`, `b3/fady.js` → the build drawer in `portal/ui/armory.js` and a shared scroll-edge utility in `portal/ui/` |
| Structure | board 1's G9 drawer ([`handoff-g9-g8.md`](../../../superpowers/mockups/2026-09-14-pins2-board/handoff-g9-g8.md), frozen) as Board 4 rebuilt it; the rulings above govern where they differ |
| States | Add build · Add · filled · Add · three · Bulk · empty / one / several / typing / warning / can't read / pasted / duplicate · DMZ · Edit 3 builds |
| Keys | Enter, Escape, Tab, arrows in the pickers; ⌘/Ctrl+Enter stages, a blocked Stage jumps to its reason (checked in `b3/drawer.js`) |
| Edge cases | a misspelt token (`bestt`) warns; a block with no weapon line can't be read; a duplicate block is named; a Rank Mode token on a DMZ block warns; eight builds still jump clear of the fades; closing stages nothing |
| Never opened | the Code chip in Embed view and in Edit · two-line runs in Edit, the DMZ card, the ghost, and a resize while scrolled · the card jump in Embed view · the 60% chips in Edit and DMZ, and the unchecked Rank Mode tile's word (0.72 × 0.6 ≈ 0.43) · fady's `characterData` observer while typing (cost never measured) · the dropdowns' black ground and the Optional chips, with several builds |

### C3 · Compare — `C3-compare.md`

| | |
|---|---|
| Kit → portal | `b4/compare.js` (`B4Compare`, `Tile`, `WeaponPick`, `BuildHead`, `Table`) and `b4/compare.css` → Compare in `portal/ui/armory.js`; `b4/form.js`'s shared `Picker` with its four opt-in props (`keep`, `grouped`, `extra`, `open0`), all off for the build drawer; the column's edit drawer and delete message are the board's (`gates4/surfaces.js`, `CompareSurface`) — in the portal, the Armory's own build drawer and staged delete |
| Structure — Board 4's own, written 2026-09-29 18:50 EDT | **top:** the search (`WeaponPick`), the picked weapons' `Tile`s, top-right the tools (`.cx-tools`: Clear builds · Remove all weapons) · **the band:** the seats (`.cx-seats`), "Same on all N" (`.cx-same`), "Shared" (`.cx-shr`, a `.cx-sh` chip per shared value: the slot in its colour, the value, the builds as numbers) · **the table** (`Table`, fixed layout): a 96px name column (`col.cx-c0`), then per weapon its build columns and a 4px gutter (`col.cx-gc`); `thead` = the weapon bands (`th.cx-g`) and a `BuildHead` per column; `tbody` = a row per slot (`th.cx-k0` + `td.cx-c` › `.cx-v`), the code row a `button.cx-code`; `tfoot tr.cx-ft` = each column's actions (`.wg-acts.cx-acts`) · **under it:** the Discord bar (`.cx-dcb`: fan `.cx-dcf`, title `.cx-dct`, pill `.cx-dcp`) and, open, the cards · **empty:** the faded table, the readouts (`.cx-lead`, two `.b4-echo`), the shelf of 10–16 tiles |
| States | One weapon · Two weapons · One build · Empty (the board's switch) |
| Behaviour | `on` = the builds in the table (≤ 6, by id) · `hc` = what is lit: a cell, a column, a row or a weapon · `deny` = a refused chip at six flashes the seats · `dc` = the Discord cards open · `flash` = a copy just made (1.2s) · a weapon added joins with its builds in number order up to six; a number adds only that build |
| Data | nothing new: share is `shareCommandText`, edit is the build drawer, delete is the manifest's staged deletion |
| Never opened | the keyboard walk of the landing, the multi-select list (a row's number chips by arrow key), the column actions and the Discord pill · the badge pop by keyboard focus · the band's Shared chips wrapping when six builds of one weapon share most slots · a screen reader over merged cells |

### C4 · Repairs — `C4-repairs.md`

| | |
|---|---|
| Kit → portal | `b3/repairs.js` → Repairs in `portal/ui/armory.js` |
| Structure | inherited — [`handoff-3e.md`](../../../superpowers/mockups/2026-09-15-pins2-board-3/handoff-3e.md) § M2 (frozen at v77; the kit and the rulings above win where they differ) |
| States | Today's · A clean day |

### C5 · Export — `C5-export.md`

| | |
|---|---|
| Kit → portal | `gates/armory.js` (`ExportPicker` and the landing) → `portal/ui/exportPanel.js` · `ui/exportPanel.js` by `portal-diff.md` · `gates/lib.js` (`CharCount`) → `portal/ui/broadcast.js` and `portal/ui/exportPanel.js` |
| Structure | inherited — [`handoff-3e.md`](../../../superpowers/mockups/2026-09-15-pins2-board-3/handoff-3e.md) § M3 (frozen at v77; the kit and the rulings above win where they differ) |
| States | Landing · Picker · Three picked |
| Data | the file writes the Bulk create format (deferred list, "Added 2026-09-24 16:47 EDT") |

### C6 · The delivery queue — `C6-delivery-queue.md`

| | |
|---|---|
| Kit → portal | `b3/broadcast.js` → `portal/ui/broadcast.js` |
| Structure | inherited — [`handoff-3e.md`](../../../superpowers/mockups/2026-09-15-pins2-board-3/handoff-3e.md) § B1 (frozen at v77), then the v36 intake (2026-09-27 22:08 EDT): the card is `QCard` (`docs/pins2/kit/gates/broadcast.js`) — its End, Start and showings chips open the pop-up family, its quote box folds only when the text runs past two lines, and the queue lists upcoming and staged posts after the live ones |
| States | the queue as it stands on the board: a live post that never ends, a live post ending Dec 31 (354 characters, shown twice), an upcoming post (1,935 characters, Oct 31 → Nov 14) and a staged post (board data: `docs/pins2/kit/data/broadcast.js`, its `staged` list) |

### C7 · The Broadcast manifest, and posting — `C7-broadcast.md`

| | |
|---|---|
| Kit → portal | `ui/broadcast.js` (`PostForm`, the columns) by `portal-diff.md` · `gates/lib.js` (`CharCount`) · `b4.css` (the count row, `.pb-ready`) · `b4/form.js` (`MediaWell`) |
| Structure | board 2's G11 for the manifest; board 1's G8 for the drawer ([`handoff-g9-g8.md`](../../../superpowers/mockups/2026-09-14-pins2-board/handoff-g9-g8.md)), as Board 4 rebuilt it |
| States | Saved · One staged · Posting |
| Limits | empty → Stage off, "Needs its text" · 3,600+ → the counter warns · past 4,000 → blocked, the counter `over` · past the shared 6,000 with the live posts → warned, not blocked; each post costs its text plus the 28-character Posted line (`POSTED_LINE`) · an unreadable date → "Needs a readable date for the start/end" · a banner link that 404s → no empty box |
| Why 6,000 matters | the bot sends the oldest ten due posts in one reply; over 6,000, or a text over 4,068, Discord rejects the whole reply and the same batch fails on every later command (verified 2026-09-26 21:19 EDT against `utils/announcement.js` and Discord's Embed Limits) |
| Dates (2026-09-27 23:04 EDT) | `DateGrid` in the pop-up family (`usePop` / `ChipPop`, `docs/pins2/kit/b3/broadcast.js`; surface `.b3-datepop.b4-pop`, `docs/pins2/kit/b3/board.css`): under Starts and Ends from the calendar button, and from the queue card's End and Start chips and Set end date. No quick picks. Under each date a READOUT: "Now \| when you commit it", "Thu Nov 26 \| 60 days after it starts", "✓ Fri Oct 2 \| live in 5 days". Edit opens on the words of the dates it has. **To use it in another realm:** render the family's pop-up under an ancestor that sets `--realm-c`; set `--dp-c` only to override. **Session 5:** the answer to pin group D's "a pop-up date picker on every date field portal-wide" — Season's native date inputs (`docs/pins2/kit/ui/season.js` 624 and 894, and their portal twins) move onto it |
| Hover (2026-09-27 18:58 EDT) | the fields' hover now shows (it was out-specified by the resting rule, `b4/classes.css`); the Never ends switch and the calendar button have one |
| Frame (2026-09-27 16:09 EDT) | the build drawer's: one height (`min(84vh, 860px)`), the body never scrolls; the form column (`.pb-col.b3-fady`) and the preview (`.pb-prevsc.b3-fady`) scroll on their own, no native bar; Before staging 16px over Cancel/Stage in every state; labels are the build drawer's field labels; an Optional chip after Starts, Ends and Banner while empty (`b4.css`, `b4/classes.css`, `ui/broadcast.js`) |
| Never opened | the count row, the over states and Before staging in Edit and Post again, at narrow widths, and its rows' jump by click and keyboard · the one-curve edge on the Broadcast card chip and the filename chip's hover · the other two-segment meters (Broadcast card, shared E6, Armory coverage) · the dead-space wheel with the post drawer open |

### C8 · History — `C8-history.md`

| | |
|---|---|
| Kit → portal | `b3/history.js` → `portal/ui/history.js`; `ui/history.js` by `portal-diff.md` |
| Structure | inherited — [`handoff-3e.md`](../../../superpowers/mockups/2026-09-15-pins2-board-3/handoff-3e.md) § H1 and § 6 (his spacing numbers; frozen at v77) |
| Known | History's and Broadcast's row glow read grey against board 3's oklch lift (v14 nitpick) |
| Never opened | the dead-space wheel with the event drawer open |

### C9 · Admin traffic — `C9-admin-traffic.md`

| | |
|---|---|
| Kit → portal | `gates4/surfaces.js` (`AdminBar`) → Analytics' view bar |
| States | Product traffic · Admin included |


---

## For Session 4 to decide

*Added 2026-09-27 11:02 EDT, his ruling at 10:59 EDT: "--patch yellow color and where it's used is a decision/part of session 4's work … similarly with the X button and it's standardizing." Both came from his board comments of 2026-09-22 (intake log, "v35 intake round"). Nothing below has been changed on the board; each is his question, the measurement, and the choices.*

### D1 · The yellow — `--patch`, and everywhere it is used

**His question (2026-09-22 12:59 EDT, on the manifest's select-all checkbox):** *"why does the checkbox and the Selection bar's square 'total build' chip use the #F3C231 accent? Honestly, anywhere really where that color is currently used right now...like where does that color link/reference to in the portal? Why was that specific color chosen? Discuss that with me before changing anything, i want knowledge and then to decide."*

| Fact | Where it is written |
|---|---|
| The token is `--patch: #F2C230` — his #F3C231 is the same colour one step off per channel, and appears in the kit only inside a comment | `portal/ui/tokens.css:58`; `docs/pins2/kit/b4/classes.css:427` |
| The portal's own token file calls it **"the portal's global accent"**; it was Broadcast's realm colour until Broadcast moved to pink | `portal/ui/tokens.css:118` |
| Two more names carry the same hex with a different meaning: `--pn` (patch notes) and `--tier-best` (the Best badge's gold, kept separate "so a later retune of one never moves the other") | `portal/ui/tokens.css:69`, `:239`–`:240` |
| **Why this yellow was chosen: no record says.** It arrived with the portal as its accent | — |

**How much uses it (recounted 2026-09-29 18:50 EDT on Version 42, the kit's CSS and JS):** `var(--patch)` on 232 lines of the kit and 139 of the portal; the bare hex `#F2C230` on 32 and 6 (2026-09-27: 229, 139, 32 and 7). By property (2026-09-27's count), across the kit's stylesheets and `portal/ui/app.css`: background 86 · color 48 · box-shadow 40 · outline 29 · border-color 25 · the badges' `--tc` 14 · caret-color 2 · other 11.

**What it means where it is used, by role:**

| Role | Examples | Where |
|---|---|---|
| Selection | the checkbox's checked fill; the selection bar's count square | `portal/ui/app.css:692` (`.cb.on`); `docs/pins2/kit/b3/board.css:719`, `:730`, `:765` |
| Focus and typing | every text field's focus ring and glow, the caret, the text highlight | `docs/pins2/kit/b4/classes.css:143`–`:149`, `:211`–`:212` |
| "The system did this" | the wand chips (his pick, 2026-09-24 13:33 EDT: "not really a confirmation, it's more like a 'look at this magic'") | `docs/pins2/kit/b4/classes.css:426`–`:430` |
| Rank | the Best tier's gold (by hex, `#F2C230`, and `--tier-best`) | `docs/pins2/kit/b3/board.css:167`, `:180`, `:190`; `docs/pins2/kit/b4/classes.css:129`, `:200` |
| Pressed and fallback | some pressed toggles; the portal's fallback accent when a realm has none | `docs/pins2/kit/b4.css:115`; `portal/ui/tokens.css:475`–`:519` |

**The decision:** whether one colour should carry selection, focus, "magic" and rank at once, or each role gets its own token (and which roles keep `--patch`). **Session 4 discusses it with him before changing anything** — his words.

### D2 · The remove control — one hover, in a deletion accent

**His question (2026-09-22 13:01 EDT, on the selection bar's "Deselect PP19 BIZON" ×):** *"why does the (x) close button hover tint only tint the X in the red color? Why not a tint on the whole button when hovered? And is that accent standardized as something like --del so it's clear that it applies to deletion, removal, etc elements such as the trashbin button or this X remove button, etc?"*

**The deletion tokens exist:** `--del: #FF6B6B`, `--danger-ink: #FF8A85` (destructive text), `--danger-edge: #54322F` (`portal/ui/tokens.css:58`, `:250`–`:251`). **The hover red on the board is `--danger-ink`, not `--del`.**

**Every remove / close / clear control on Board 4** (counted 2026-09-27 11:02 EDT in the resting board, three picked, a problem open, Edit 3 builds, Add · three, Three picked, Posting and Saved):

| Control | Class | Count | Resting |
|---|---|---|---|
| Stage deletion of a build (trash, manifest rows) | `.wg-del.wg-ib` | 168 | 44×44, no fill, grey glyph |
| Remove an announcement (Broadcast rows) | `.rmv.wg-del.wg-ib` | 32 | 44×44 |
| Deselect a weapon / build (selection bar and list) | `.b3-x` | 28 | 28×28 circle |
| Close a drawer | `.x` | 17 | 28×28 |
| Remove a build card / clear a field (build drawer) | `.f-cx.f-suf`, `.f-clr.f-suf` | 12 + 12 | 32×32 |
| Remove a weapon from Compare | `.cx-wx` | 8 | 26×26 |
| Delete from the delivery queue | `.pb-del.pb-ib` | 8 | 28×28 |
| Stage deletion (selection bar) | `.b3-btn2.dang` | 7 | 136×40, red text |
| Close the problem card | `.b3-pc-x` | 6 | 30×30 |
| Clear (text buttons) | `.b3-btn2.quiet`, `button` | 7 + 16 | 80×40, 71×30 |

**Hovered with a real pointer — three different recipes:**

| Control | Fill on hover | Glyph on hover |
|---|---|---|
| Trash in the manifest, Broadcast's remove, the queue's delete | the round plate behind it (`::before`) warms from `#1F272E` to a faint red | `--danger-ink` |
| Compare's weapon × | **the whole button**, tinted in its weapon's colour (`--c`) past the board's neutral `!important` rule — Version 41 AA, his "the tinted hover i asked for" (was `--danger-ink` at 13%) | the weapon's colour |
| The drawer's close × | none | brightens to ink, not red |
| The selection bar's `.b3-x` | none measured | none measured — **his screenshot shows a red glyph, so the red is drawn where this read did not look (a child or an animation); re-measure** |

**The decision:** one hover for every remove control — his proposal is the whole button tinted — in one named deletion token (`--del` or `--danger-ink`), and whether "close" (dismiss) stays neutral while "remove"/"delete" goes red. Compare's × does the whole-button version, but in its weapon's colour since Version 41, so a deletion token also decides whether a colour-coded remove stays; Before staging's − and the tile's × have no ring at rest since Version 40 A.

---

### D3 · The dropdown ground has no token

**His question (2026-09-27 19:16 EDT, `intake:801`):** *"if it doesn't have a token, then that's something to let session 4 know/be aware of, correct?"* — it has none.

| Fact | Where |
|---|---|
| The ground is written out as `color-mix(in srgb,#04070A N%,var(--sunk))` — a raw hex, no name | the dropdowns: `docs/pins2/kit/b4/classes.css` (`.f-menu`); the date picker: `docs/pins2/kit/b3/board.css` (`.b3-datepop`) |
| **27 declarations, 5 files, ten different mixes** (recounted 2026-09-29 18:50 EDT on Version 42; 18 and nine on 2026-09-27): 30 · 35 · 38 · 40 (×7) · 42 (×2) · 45 (×3) · 52 (×8) · 55 (×2) · 60 · 85 | `b4/classes.css` 15 · `b4/form.css` 6 · `b4/bulk.css` 3 · `b4/compare.css` 2 · `b3/board.css` 1 |
| The portal has **none** of it: 0 in `portal/ui/app.css` and `portal/ui/tokens.css` — it arrived with Board 4's form | — |
| The nearest portal names are `--overlay`, `--overlay-62`, `--overlay-66` — scrims behind a drawer, a different job | `portal/ui/tokens.css` |
| The menus' and the picker's shadow (`0 22px 44px -14px rgba(0,0,0,.75), 0 6px 14px -6px rgba(0,0,0,.5)`) and edge (`--ink` at 10%) are literals too | the same two rules |

**The decision:** name the ground — one token for menus and pop-ups (and one for their shadow), and whether the nine mixes collapse into a few named steps (a field, a menu or pop-up, a well). Until then the dropdown and the date picker share the 40% mix by copy, not by name.

## The standards this round set — for Session 4 to carry to every realm

*Written 2026-09-27 22:08 EDT from the v36 intake (`intake:861`, the round grouped by class). Each is built once on the board; each names its class, so a port or a new surface uses it rather than copying it.*

| Standard | What it is | Where it lives on the board |
|---|---|---|
| **The form system** | Every form drawer — the build drawer, the post drawer, and the portal's others (patch notes named) — shares: one field ground (`color-mix(in srgb,#04070A 52%,var(--sunk))`, edge `--ink` 12%, corner `--fld-rad`); a label row that carries the field's state (✓, Optional, Auto, or a warn chip); the readout line under a date; one stepper; the **Before staging** card (`.f-stage`) whose rows jump to their fields; hovers from the neutral family (ring, no fill) **2026-09-28 14:25 EDT:** the Before staging card minimises (a − in its head) to an info chip left of Cancel in its tone, warn or ok (the − is the selection bar's `.b3-x`; the chip is the card's own mark `.f-stm` at the footer's 40px, 2026-09-28 19:07 EDT); one stored choice for every form drawer (`useStageMin`, `docs/pins2/kit/b4/form.js`); a field whose pop-up is open wears the typing fields' glow. | `docs/pins2/kit/b4/form.js` (`Chip`, the build form), `docs/pins2/kit/ui/broadcast.js` (`PostForm`, `BoardDate`), `docs/pins2/kit/b4/classes.css` (the v36 block) |
| **The pop-up family** | Everything a chip or a field opens (a date, the showings, the accent): `usePop` / `ChipPop` in `docs/pins2/kit/b3/broadcast.js`. Fixed to the window from its trigger (the panels and columns it opens in clip) and corrected for a transformed ancestor by measuring where it landed; opens down, else up; closes on a click outside, Escape (focus returns to the trigger) or a scroll outside; focus moves in without a keyboard ring. Its surface is the dropdowns' ground (`.b3-datepop.b4-pop`). **2026-09-28 21:45 EDT, his catch:** the build drawer's dropdown lists joined the family (`Picker`, `docs/pins2/kit/b4/form.js`) — fixed, 10px off the field, bounded by the drawer's BODY and the window, height capped to the room, the page moving just enough when neither side has room; while any list or pop-up is open the column fades drop their mask (a mask hides a fixed child). Measure in a 700px window: `docs/pins2/instruments/board4-menu-fit.cjs` **2026-09-28 14:25 EDT:** one gap both ways — 10px, the build drawer's dropdowns' — measured from the trigger's VISIBLE box (a date field, not its calendar button) on the SETTLED box (the entrance's first frame is 7px off and scaled; measuring it had put every pop-up ~9px high: flush below a trigger, 17px off one above it); the entrance comes from the trigger's side; a list or pop-up open in a drawer column eases that column's scroll fade off (`--ft`/`--fb` to 0) so it is never cut; a highlighted list row keeps the menu's 6px padding. | `docs/pins2/kit/b3/broadcast.js`, `docs/pins2/kit/b3/board.css` |
| **Drawer scrolling** | A wheel in a drawer's dead space scrolls the column that owns it (the one under the pointer, else the nearest to its left); an area is only what a person can wheel (overflow auto or scroll) — a box that clips without scrolling, and any textarea, hands its wheel to the area around it. Measured with a real wheel (2026-09-27 23:04 EDT): the post drawer 0 dead of 90 points with its text folded and 0 of 90 open, the build drawer (Add · three) 0 of 103, Edit 3 builds 0 of 103; **Bulk · several 53 of 98 dead — the same with the v36 routing, so older than this round (filed)**; the Export picker's empty files column stays inert (nothing to scroll) | `docs/pins2/kit/b3/fady.js` (`routeWheel`) |
| **Chips** | Rectangles with 6px corners; a fact chip that is a field is a button in the same look with the neutral hover | `docs/pins2/kit/b4/classes.css` |
| **An accent per post** | Every surface that shows a post wears its stored colour — never the realm's pink: the card, its number, the preview, the text box, its budget segment | `docs/pins2/kit/ui/broadcast.js`, `docs/pins2/kit/gates/broadcast.js` |

## What the data and the bot need — none of it is visible on the board

A design port that stops at CSS ships a Capable badge nobody can save. Every item below is filed with its files and a verify condition in [`docs/db-deferred-list.md`](../../../db-deferred-list.md); the entry names are exact.

| Change | Where it lands | Entry in the deferred list |
|---|---|---|
| TOP 4 retired, Capable and ASS added: `categoryRank` drops `top4` and gains `capable`; `isAss` beside `isMeta` / `isToxic`; ASS excludes META and every tier; a pasted `top4` stages as Top 5 with a warning; stored `top4` data migrates | `models/Loadout.js`, the parser, the renderer, the portal, stored data | "The badge set changes: Top 4 retired, Capable and Ass added — the model, the bot and the portal" |
| Rank Mode: `rankModes: [String]` (HP, S&D, DOM, TDM, FTL, Control; MP only); the Badges-line tokens and aliases; `Recommended Rank Mode: {a \| b}` with his custom emoji; the portal label | `models/Loadout.js`, `utils/adminParser.js`, `utils/loadoutRender.js`, `core/ops/loadouts.js`, `portal/api/bulk.js`, `handlers/manage/loadouts.js` | "A new set of badges — design on Board 4, then implement in the bot and portal exactly as ASS and CAPABLE" |
| The Bulk create format, which Export also writes | `utils/adminParser.js`, the Export writer | the Board 4 bullet "Added 2026-09-24 16:47 EDT (Board 4 v20, for Session 5 to port)" |
| **An accent that can be chosen and changed:** the post op already takes `color`; the EDIT op's apply writes only text, dates, banner and repeats (`set` in `core/ops/announcements.js`, checked 2026-09-27 22:08 EDT), so a changed accent is dropped today — add `color` to `set` and to the prior its inverse restores; the portal's drawer sends it | `core/ops/announcements.js`, the portal's post drawer | "An announcement's accent, chosen in the portal — the edit op must carry it" |
| **The queue shows staged posts:** the card list reads the review's staged `announcement.post` ops after the live and upcoming posts (the board holds them in `data/broadcast.js`'s `staged`) | `portal/ui/broadcast.js` | the same entry |
| The announcement limits: the op refuses text over 4,000; delivery splits into replies that fit and logs the real reason | `core/ops/announcements.js`, `utils/announcement.js` | "The announcement limits, hardened on the board — the bot and portal must match" |

**Mongoose persists only declared fields** (CLAUDE.md): every new field lands in its schema in the same change as the code that writes it.

---

## The generator's numbers, read — 2026-09-29 18:50 EDT

The README's header counts are the extractor's. Read on the Version 42 kit (regenerated 2026-09-29 18:05 EDT, after the Version 41 build; no kit change since): **1,530 looks across 654 signatures, 0 page errors.**

| Count | What it is | What a port does |
|---|---|---|
| **14 not reached** | all the board's gate frame: `pb-head`, `pb-gid`, `pb-stage`, `pb-new`, `pb-ctl`, `g-tries`, `g-stage`, `g-scroll`, the `b4-*` stage wrappers and `cx-host` (`gates4/*` and `gates.css`, labelled CHROME or the frame half of MIXED in `file-map.md`) | nothing: none is a portal element |
| **41 ⚠️ opacity** | animation frames sampled mid-flight: ASS's stink lines (`.b3-ass > i`, 31) and the Rank Mode drift (`.b3-mdw`, 10); opacity is not a length, so these are not conflicts | port the `@keyframes` (`motion.md`) and the declared resting value |
| **22 ⚠️ layout techniques** | a declared value the layout is meant to override: `td{height:1px}` for full-height cells (11), `.f-in{width:0}` under flex (7), the auto-sized textarea (1), `.mtable` cell widths (2), `.pb-qafter` (1) | port the declaration, never the computed value |
| **10 ⚠️ unitless line-heights** | `1.5`, `1.35`, `1.7`, `1`, `1.45` read against their computed pixels | port the unitless value |
| **3 ⚠️ outline-offset** | `-1.5px` rounded by the device | port `-1.5px` |
| **12 ⚠️ real** | a declaration a later rule overrides: the `th.cx-k0` width of 118px in `docs/pins2/kit/b4/compare.css` (10 rows — Version 41 Y moved the column to 96px on `col.cx-c0` and left this behind); a `style` height of 46px (1); `.pb-lrow .pb-sw` 22px (1) | port the computed value and leave the dead declaration out |

## What this spec does not have yet

- **A structure narrative written for Board 4, except C3** (written 2026-09-29 18:50 EDT, C3's per-gate table) — every other gate's *Structure* row above points at a handoff written for an EARLIER board (`handoff-3e.md` § M1, M2, M3, B1, H1 at Board 3-E v77; `handoff-g9-g8.md` and plan §10.1–§10.4 for C2, C3, C7), so its element lists and `file:line` are those boards'. The kit, the generated markup and this file's rulings are the truth where they differ; Board 4's own per-surface structure narrative was never written (found 2026-09-28 23:59 EDT).
- **Board 4's measured relations** — Board 3-E had `measure.cjs` (pixel relations); its selectors are board 3's, and Board 4 has no relations file. The values files are resolved declarations, not relations.
- **Accessibility beyond keys** — focus order, ARIA roles and screen-reader announcements were never walked on Board 4. Keys that are handled are named per gate above; everything else is unrecorded.
- **The date picker's values** (2026-09-27 19:26 EDT) — the generator walks each gate at rest, and the pop-up is closed at rest, so `C6`/`C7`/`states.md` hold no `.b3-dp-*` row (checked: 0). Its values are the `.b3-dp-*` and `.b3-datepop` rules in `docs/pins2/kit/b3/board.css` and the open calendar button in `docs/pins2/kit/b4.css`, as C7's Dates row says.
- **The generator's own coverage holes** — the README lists every classed element no pass reached ("Not reached"), and every ⚠️ row is a winning declaration the computed value contradicts. Each is unexamined until opened.
