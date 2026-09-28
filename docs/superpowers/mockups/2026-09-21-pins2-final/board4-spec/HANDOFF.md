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
| Readiness | C2 | inline chips at the labels (Weapon required → checks → Ready) instead of a Ready chip; the Before staging panel in the empty space under the preview, anchored, rows jump to fields | `intake:572`–`578`, `intake:635`, `intake:658` | built per the record |
| Optional fields | C2 | an "Optional" chip on every optional field | `intake:680` | built per the record |
| Unchecked chips | C2 | rest at 0.6, 1 on hover; disabled 0.18 | `plan:749` · replaced 42% | measured, plan §19z (2026-09-26 17:45 EDT) |
| Bulk | C2 | the format hint and in-list hints redesigned; the list scrolls; the product's MP/DMZ chips; the board's own chips; the Bulk create format (Export writes the same) | `intake:596`–`601`, `intake:206`–`234` | built per the record |
| Bulk head | C2 | the selection bar's View toggle: **Ledger / Embed** (was "Discord") | `plan:736` | measured, plan §19z (2026-09-26 16:35 EDT) |
| Bulk ledger card | C2 | Code row = the selection bar's `CodeCell`, sized to the ledger; a click keeps the code and ticks the mark `--ok` for 1.1s (every `CodeCell`); chip runs two lines, then sideways behind the fade; **a click anywhere on a card** jumps to its block and centres it clear of the fades | `plan:700`, `plan:708`, `plan:744`, `plan:759` | measured, plan §19y–§19z (2026-09-26 15:41–18:08 EDT) |
| Edit | C2 | "Editing X" is the selection bar's weapon chip with its ×, which removes that weapon's blocks | `intake:40` | built per the record |
| Dead space | C2 C5 C7 | a wheel in a drawer's dead space scrolls the column that owns it — now every drawer (the "Drawer scrolling" standard below) | `plan:720` | measured, plan §19z (2026-09-26 16:28 EDT): Export, Add, Bulk, Edit; never the post, History or confirm drawers |
| Compare size | C3 | at most **6 builds**, from **any number of weapons** (~~two weapons~~); a build chip is ON (in the table) or OFF, never a third silent "not shown"; weapons arriving together take turns filling the six; at six an OFF chip is `not-allowed`, its tooltip says why, and a click flashes the limit chip (`.cx-cap`) | `intake:50`, his C3 round (`intake` § C3 Compare intake round) class Y | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Compare tables | C3 | **settled:** Cards · Grid · Lanes (~~Table A/B/C~~) plus **Embed** on a VIEW toggle in the panel's top-right corner — Bulk's own toggle (`.b3-sd-vt.bk-view`, "View" label); the landing is A's search over **twelve weapon tiles, a fresh random draw each time** the panel comes back to empty (~~Empty A/B/C~~, and the faded ghost table is gone) | his C3 round (`intake` § C3 Compare intake round) classes Q, R, T | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Compare badges | C3 | in the table heads, the **wordless** badge: plate, material, colours and mark, the word moved to the tooltip and the accessible name (`B3Badges` `bare`, `local/pins2-board-3/redo/b3/armory-parts.js`); still two lines at most, then sideways behind the fade | his popup answer, 2026-09-27, before 02:17 EDT · his C3 round (`intake` § C3 Compare intake round) class Z | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Compare chips | C3 | the colour-accented slot chip (e.g. Ammunition), as everywhere else; in the "Same on all N" line the category is one of them — **Category** (~~Class~~), an attachment chip in the category's colour | `intake:462` · his C3 round (`intake` § C3 Compare intake round) class S | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Compare weapon tile | C3 | the picked weapon and the landing share one tile (`Tile`, `local/pins2-board-3/redo/b4/compare.js`): the name, its category in capitals in the category's colour (~~the dot, "x builds"~~), a chip per build — ON filled, OFF dashed; hover shows a − (take it out, in `--danger-ink`) or a + (put it in); in the bar × removes the weapon; on the landing a chip opens the comparison on that one build and the name on every build that fits | his C3 round (`intake` § C3 Compare intake round) class W | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Compare bar | C3 | the search first, **always there**, 308px (the build drawer's dropdown width), the tiles after it; top-right the limit chip (`g-status` + meter, "4 of 6 builds") and the VIEW toggle | his C3 round (`intake` § C3 Compare intake round) classes X, V | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Compare heads | C3 | the weapon **once, large (17px), over its builds**, with its category as the manifest's `.wg-line` pair (9.5px mono capitals, ink-centred with the name); each build as its coloured chip ("Build 2"); the label line and the badge line only when some shown build has one (~~"No label" ×6, "No badges"~~) | his C3 round (`intake` § C3 Compare intake round) class Z | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Compare cells' meaning | C3 | **no reference build and no key line** (~~"Baseline", the "Each build is read…" line~~ — his 14:44 EDT). Each cell is read against the other builds of ITS weapon: tinted = an odd one out (not the row's most common value; a tie tints all), dashed = missing a part most of its builds have, a dash = empty where most are empty, dim = all its builds agree; a gunsmith code is never tinted; across weapons, a row filled by only some weapons says so under its name ("BAL-27 only") | his popup answers 15:0x EDT: "A · Odd ones out", "both" | kit `4d07336` (local) |
| Compare cells | C3 | a cell's fill, hatch or edge runs the **full height of its row** (`td{height:1px}` + `.cx-v{height:100%}`); a merged Lanes cell lights the head of **every build it covers**; row names right-aligned against their row, over the row dividers (restored); every cell's words left-aligned | his C3 round (`intake` § C3 Compare intake round) classes AB, AC | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Compare Embed | C3 | each build as Discord draws it (`LoadoutCard`), captioned with its build chip (and the weapon when several share the grid); a grid by count **1→1, 2→2, 3→3, 4→4, 5→3+2, 6→3+3** — the K7 layout of 2026-09-21, lost when v11 rebuilt Compare (~~4 + 2 auto-fill, no caption, a "Show the Discord cards" button~~) | fixplan K7 · his C3 round (`intake` § C3 Compare intake round) classes T, U | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Repairs | C4 | the "N builds pass" tile under its own section label and spacing; the "N builds" chip in the Never chip's shape; tickets have **no** hover | `intake:270`, `intake:291`, `plan:744` | built per the record |
| Export | C5 | the list reads the Bulk create format; attachment chips are the manifest's; MP/DMZ follows the weapon and build; pick-all tinted by its category (the top one by its own); list fades; a clean ×; the filename chip's × and ✓ | `intake:669`–`671`, `intake:465`, `intake:272`, `intake:276`, `intake:490`, `intake:271`, `intake:480` | built per the record |
| Broadcast rows | C7 | middle-aligned; the Armory's delete button; State chips with board 2's rounder corners, no colour dots; an active sort label brightens; a row click opens the editor, an Ended row opens Post again; the staged chip's dash on top, right and bottom only | `intake:80`–`86` | built per the record |
| Post form | C7 | *(the count row and the 150px field are superseded by "The post's Text field" and "Budget" rows above)* the banner is the build drawer's image well, last; "Posted" as a footer under the image; **past 4,000 Stage is blocked; past the shared 6,000 it only warns** | `plan:761`–`767`, `intake:723`, `intake:733`, his popup answers, 2026-09-26 20:07 EDT (the harden) and 2026-09-27 before 02:17 EDT (warn only) | measured, plan §19z–§19z-h (2026-09-26 18:20–20:07 EDT) |
| Date picker | C6 C7, every realm | one `DateGrid` for every date the portal sets: the build drawer's dropdown ground; 270 wide, 36px days in 38px rows, the month centred between arrows over the first and last columns, 14px numbers, weekdays in title case, **Sunday first**, today a dot; **no quick picks**; every accent reads `--dp-c`, which defaults to the realm's `--realm-c` (picked = the realm toggles' pressed recipe, hover = their 11% tint) | `intake:801` (2026-09-27 19:12, 19:18 EDT), Sunday first his popup answer · replaced the 312px Monday-first picker with quick picks (18:58 EDT) | this session: Starts, Ends, Set end date, a Season-coloured test, a real-mouse hover on a day, an arrow and the calendar button |
| Queue card chips | C6 | a chip that IS a field opens its editor where it sits, in the pop-up family: End (Never or a date), Start while the post has not begun, and a showings chip beside "Active for" ("Shown once" / "Shown 2 times") with its own stepper pop-up; hover is the neutral family (ring, no fill) · 2026-09-28 14:25 EDT: the drawer's "1 a day max" chip takes the showings chip's repeat mark; the queue head's slots meter is one fill in the realm's pink, the budget chip's meter 112px (the slots' 56) | `intake:827` (2026-09-27 20:34 EDT) | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| Set end date | C6 | opens on the date the post holds, else **tomorrow**, highlighted; the pop-up has **no heading** | `intake:827` + his reply 20:39 EDT · replaced today + 14 and the "Stop showing it / live since" heading | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| Collapse / Expand | C6 C7 | one control — Export's Pick builds button (`.b3-xf-ib` + `Fold`), worded Collapse / Expand, **hidden when the text fits** its two lines | `intake:847` · replaced "Show all / Show less" | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| The post's Text field | C7 | the queue card's quote box: folded (two lines, the post's accent, the default each time the drawer opens) or open (the fields' black, the focus glow round the whole box, animated); its footer holds the counter and budget chips stacked, at their own widths, and Collapse / Expand · 2026-09-28 14:25 EDT: the counter chip wears the chips' **1px** edge (~~the 2px double ring~~), everywhere it draws | `intake:847`, `intake:857` | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| Label-row state | C7, every form drawer | each field's label carries its state: ✓ when filled, Optional, Auto, or a warn chip (Required, Over 4,000, Can't read, Hard to see) — the build form's vocabulary | `intake:827` | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| Date readout | C7, every date field | the line under a date is a readout: its mark, the value in ink, a hairline, what it means ("Now \| when you commit it", "Thu Nov 26 \| 60 days after it starts", "✓ Fri Oct 2 \| live in 5 days"); never wraps | `intake:827` | this session, v36 kit (checked 2026-09-27 22:08 EDT) |
| Stepper | C6 C7 | one stepper on the fields' ground; its end buttons take the container's corners so the neutral hover ring bends with them; in the showings pop-up it sits **centred**, its count and ring in the post's accent, with one glyph per showing under it (~~"per player · 1 a day max"~~) | `intake:827` · his C3 round (`intake` § C3 Compare intake round) classes L, M | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
| Accent | C6 C7 bot | **an in-form block, not a pop-up** (`AccentBlock`, `local/pins2-board-3/redo/b3/broadcast.js`), on the image block's ground: layout "split" — the colour area (200 × 138) with its hue bar under it; Recent (2 rows of 9, every shuffled, typed or dragged colour) and Saved (9 slots) beside it, the hex field (strips a pasted `#`, a copy button inside) and New colour under them; a saved colour hovered floats and splits into USE and, past a hairline, REPLACE (the current colour sliding out from under it), hex chips beside Recent/Saved; 240ms open and close; Recent and Saved persist in the browser (per admin in the portal — Session 5 data note); his values are in the intake log's last block (~~sixteen presets in a pop-up, the "Tints the card…" hint~~) | his C3 round (`intake` § C3 Compare intake round) classes N, L · mockup `local/pins2-board-3/board4-review/intake-v38/accent-mock.html` | built 2026-09-28 14:25 EDT, kit `2b64129` (local, unpublished) |
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
| Structure | Board 3-E's handoff § B1, then the v36 intake (2026-09-27 22:08 EDT): the card is `QCard` (`local/pins2-board-3/redo/gates/broadcast.js`) — its End, Start and showings chips open the pop-up family, its quote box folds only when the text runs past two lines, and the queue lists upcoming and staged posts after the live ones |
| States | the queue as it stands on the board: a live post that never ends, a live post ending Dec 31 (354 characters, shown twice), an upcoming post (1,935 characters, Oct 31 → Nov 14) and a staged post (board data: `local/pins2-board-3/redo/data/broadcast.js`, its `staged` list) |

### C7 · The Broadcast manifest, and posting — `C7-broadcast.md`

| | |
|---|---|
| Kit → portal | `ui/broadcast.js` (`PostForm`, the columns) by `portal-diff.md` · `gates/lib.js` (`CharCount`) · `b4.css` (the count row, `.pb-ready`) · `b4/form.js` (`MediaWell`) |
| Structure | board 2's G11 for the manifest; board 1's G8 for the drawer (`handoff-g9-g8.md`), as Board 4 rebuilt it |
| States | Saved · One staged · Posting |
| Limits | empty → Stage off, "Needs its text" · 3,600+ → the counter warns · past 4,000 → blocked, the counter `over` · past the shared 6,000 with the live posts → warned, not blocked; each post costs its text plus the 28-character Posted line (`POSTED_LINE`) · an unreadable date → "Needs a readable date for the start/end" · a banner link that 404s → no empty box |
| Why 6,000 matters | the bot sends the oldest ten due posts in one reply; over 6,000, or a text over 4,068, Discord rejects the whole reply and the same batch fails on every later command (verified 2026-09-26 21:19 EDT against `utils/announcement.js` and Discord's Embed Limits) |
| Dates (2026-09-27 23:04 EDT) | `DateGrid` in the pop-up family (`usePop` / `ChipPop`, `local/pins2-board-3/redo/b3/broadcast.js`; surface `.b3-datepop.b4-pop`, `local/pins2-board-3/redo/b3/board.css`): under Starts and Ends from the calendar button, and from the queue card's End and Start chips and Set end date. No quick picks. Under each date a READOUT: "Now \| when you commit it", "Thu Nov 26 \| 60 days after it starts", "✓ Fri Oct 2 \| live in 5 days". Edit opens on the words of the dates it has. **To use it in another realm:** render the family's pop-up under an ancestor that sets `--realm-c`; set `--dp-c` only to override. **Session 5:** the answer to pin group D's "a pop-up date picker on every date field portal-wide" — Season's native date inputs (`local/pins2-board-3/redo/ui/season.js` 624 and 894, and their portal twins) move onto it |
| Hover (2026-09-27 18:58 EDT) | the fields' hover now shows (it was out-specified by the resting rule, `b4/classes.css`); the Never ends switch and the calendar button have one |
| Frame (2026-09-27 16:09 EDT) | the build drawer's: one height (`min(84vh, 860px)`), the body never scrolls; the form column (`.pb-col.b3-fady`) and the preview (`.pb-prevsc.b3-fady`) scroll on their own, no native bar; Before staging 16px over Cancel/Stage in every state; labels are the build drawer's field labels; an Optional chip after Starts, Ends and Banner while empty (`b4.css`, `b4/classes.css`, `ui/broadcast.js`) |
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

## For Session 4 to decide

*Added 2026-09-27 11:02 EDT, his ruling at 10:59 EDT: "--patch yellow color and where it's used is a decision/part of session 4's work … similarly with the X button and it's standardizing." Both came from his board comments of 2026-09-22 (intake log, "v35 intake round"). Nothing below has been changed on the board; each is his question, the measurement, and the choices.*

### D1 · The yellow — `--patch`, and everywhere it is used

**His question (2026-09-22 12:59 EDT, on the manifest's select-all checkbox):** *"why does the checkbox and the Selection bar's square 'total build' chip use the #F3C231 accent? Honestly, anywhere really where that color is currently used right now...like where does that color link/reference to in the portal? Why was that specific color chosen? Discuss that with me before changing anything, i want knowledge and then to decide."*

| Fact | Where it is written |
|---|---|
| The token is `--patch: #F2C230` — his #F3C231 is the same colour one step off per channel, and appears in the kit only inside a comment | `portal/ui/tokens.css:58`; `local/pins2-board-3/redo/b4/classes.css:426` |
| The portal's own token file calls it **"the portal's global accent"**; it was Broadcast's realm colour until Broadcast moved to pink | `portal/ui/tokens.css:118` |
| Two more names carry the same hex with a different meaning: `--pn` (patch notes) and `--tier-best` (the Best badge's gold, kept separate "so a later retune of one never moves the other") | `portal/ui/tokens.css:69`, `:239`–`:240` |
| **Why this yellow was chosen: no record says.** It arrived with the portal as its accent | — |

**How much uses it (counted 2026-09-27 11:02 EDT):** `var(--patch)` on 229 lines of the kit and 139 of the portal; the bare hex `#F2C230` on 32 and 7. By property, across the kit's stylesheets and `portal/ui/app.css`: background 86 · color 48 · box-shadow 40 · outline 29 · border-color 25 · the badges' `--tc` 14 · caret-color 2 · other 11.

**What it means where it is used, by role:**

| Role | Examples | Where |
|---|---|---|
| Selection | the checkbox's checked fill; the selection bar's count square | `portal/ui/app.css:692` (`.cb.on`); `local/pins2-board-3/redo/b3/board.css:719`, `:730`, `:765` |
| Focus and typing | every text field's focus ring and glow, the caret, the text highlight | `local/pins2-board-3/redo/b4/classes.css:143`–`:149`, `:211`–`:212` |
| "The system did this" | the wand chips (his pick, 2026-09-24 13:33 EDT: "not really a confirmation, it's more like a 'look at this magic'") | `local/pins2-board-3/redo/b4/classes.css:426`–`:430` |
| Rank | the Best tier's gold (by hex, and `--tier-best`) | `local/pins2-board-3/redo/b3/board.css:167`, `:180`, `:190`; `local/pins2-board-3/redo/b4/classes.css:129`, `:200` |
| Pressed and fallback | some pressed toggles; the portal's fallback accent when a realm has none | `local/pins2-board-3/redo/b4.css:115`; `portal/ui/tokens.css:475`–`:519` |

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
| Compare's weapon × | **the whole button**, `--danger-ink` at 13% | `--danger-ink` |
| The drawer's close × | none | brightens to ink, not red |
| The selection bar's `.b3-x` | none measured | none measured — **his screenshot shows a red glyph, so the red is drawn where this read did not look (a child or an animation); re-measure** |

**The decision:** one hover for every remove control — his proposal is the whole button tinted — in one named deletion token (`--del` or `--danger-ink`), and whether "close" (dismiss) stays neutral while "remove"/"delete" goes red. Compare's × already does the whole-button version.

---

### D3 · The dropdown ground has no token

**His question (2026-09-27 19:16 EDT, `intake:801`):** *"if it doesn't have a token, then that's something to let session 4 know/be aware of, correct?"* — it has none.

| Fact | Where |
|---|---|
| The ground is written out as `color-mix(in srgb,#04070A N%,var(--sunk))` — a raw hex, no name | the dropdowns: `local/pins2-board-3/redo/b4/classes.css` (`.f-menu`); the date picker: `local/pins2-board-3/redo/b3/board.css` (`.b3-datepop`) |
| **18 declarations, 5 files, nine different mixes:** 30 · 35 · 38 · 40 (×8) · 42 · 45 (×2) · 52 (×2) · 55 · 60 | `b4/classes.css` 7 · `b4/form.css` 6 · `b4/bulk.css` 3 · `b4/compare.css` 1 · `b3/board.css` 1 (counted 2026-09-27 19:24 EDT) |
| The portal has **none** of it: 0 in `portal/ui/app.css` and `portal/ui/tokens.css` — it arrived with Board 4's form | — |
| The nearest portal names are `--overlay`, `--overlay-62`, `--overlay-66` — scrims behind a drawer, a different job | `portal/ui/tokens.css` |
| The menus' and the picker's shadow (`0 22px 44px -14px rgba(0,0,0,.75), 0 6px 14px -6px rgba(0,0,0,.5)`) and edge (`--ink` at 10%) are literals too | the same two rules |

**The decision:** name the ground — one token for menus and pop-ups (and one for their shadow), and whether the nine mixes collapse into a few named steps (a field, a menu or pop-up, a well). Until then the dropdown and the date picker share the 40% mix by copy, not by name.

## The standards this round set — for Session 4 to carry to every realm

*Written 2026-09-27 22:08 EDT from the v36 intake (`intake:861`, the round grouped by class). Each is built once on the board; each names its class, so a port or a new surface uses it rather than copying it.*

| Standard | What it is | Where it lives on the board |
|---|---|---|
| **The form system** | Every form drawer — the build drawer, the post drawer, and the portal's others (patch notes named) — shares: one field ground (`color-mix(in srgb,#04070A 52%,var(--sunk))`, edge `--ink` 12%, corner `--fld-rad`); a label row that carries the field's state (✓, Optional, Auto, or a warn chip); the readout line under a date; one stepper; the **Before staging** card (`.f-stage`) whose rows jump to their fields; hovers from the neutral family (ring, no fill) **2026-09-28 14:25 EDT:** the Before staging card minimises (a − in its head) to an info chip left of Cancel in its tone, warn or ok; one stored choice for every form drawer (`useStageMin`, `local/pins2-board-3/redo/b4/form.js`); a field whose pop-up is open wears the typing fields' glow. | `local/pins2-board-3/redo/b4/form.js` (`Chip`, the build form), `local/pins2-board-3/redo/ui/broadcast.js` (`PostForm`, `BoardDate`), `local/pins2-board-3/redo/b4/classes.css` (the v36 block) |
| **The pop-up family** | Everything a chip or a field opens (a date, the showings, the accent): `usePop` / `ChipPop` in `local/pins2-board-3/redo/b3/broadcast.js`. Fixed to the window from its trigger (the panels and columns it opens in clip) and corrected for a transformed ancestor by measuring where it landed; opens down, else up; closes on a click outside, Escape (focus returns to the trigger) or a scroll outside; focus moves in without a keyboard ring. Its surface is the dropdowns' ground (`.b3-datepop.b4-pop`) **2026-09-28 14:25 EDT:** one gap both ways — 10px, the build drawer's dropdowns' — measured from the trigger's VISIBLE box (a date field, not its calendar button) on the SETTLED box (the entrance's first frame is 7px off and scaled; measuring it had put every pop-up ~9px high: flush below a trigger, 17px off one above it); the entrance comes from the trigger's side; a list or pop-up open in a drawer column eases that column's scroll fade off (`--ft`/`--fb` to 0) so it is never cut; a highlighted list row keeps the menu's 6px padding. | `local/pins2-board-3/redo/b3/broadcast.js`, `local/pins2-board-3/redo/b3/board.css` |
| **Drawer scrolling** | A wheel in a drawer's dead space scrolls the column that owns it (the one under the pointer, else the nearest to its left); an area is only what a person can wheel (overflow auto or scroll) — a box that clips without scrolling, and any textarea, hands its wheel to the area around it. Measured with a real wheel (2026-09-27 23:04 EDT): the post drawer 0 dead of 90 points with its text folded and 0 of 90 open, the build drawer (Add · three) 0 of 103, Edit 3 builds 0 of 103; **Bulk · several 53 of 98 dead — the same with the v36 routing, so older than this round (filed)**; the Export picker's empty files column stays inert (nothing to scroll) | `local/pins2-board-3/redo/b3/fady.js` (`routeWheel`) |
| **Chips** | Rectangles with 6px corners; a fact chip that is a field is a button in the same look with the neutral hover | `local/pins2-board-3/redo/b4/classes.css` |
| **An accent per post** | Every surface that shows a post wears its stored colour — never the realm's pink: the card, its number, the preview, the text box, the showings glyphs, its budget segment | `local/pins2-board-3/redo/ui/broadcast.js`, `local/pins2-board-3/redo/gates/broadcast.js` |

## What the data and the bot need — none of it is visible on the board

A design port that stops at CSS ships a Capable badge nobody can save. Every item below is filed with its files and a verify condition in [`docs/db-deferred-list.md`](../../../../db-deferred-list.md); the entry names are exact.

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

## What this spec does not have yet

- **Board 4's measured relations** — Board 3-E had `measure.cjs` (pixel relations); its selectors are board 3's, and Board 4 has no relations file. The values files are resolved declarations, not relations.
- **Accessibility beyond keys** — focus order, ARIA roles and screen-reader announcements were never walked on Board 4. Keys that are handled are named per gate above; everything else is unrecorded.
- **The date picker's values** (2026-09-27 19:26 EDT) — the generator walks each gate at rest, and the pop-up is closed at rest, so `C6`/`C7`/`states.md` hold no `.b3-dp-*` row (checked: 0). Its values are the `.b3-dp-*` and `.b3-datepop` rules in `local/pins2-board-3/redo/b3/board.css` and the open calendar button in `local/pins2-board-3/redo/b4.css`, as C7's Dates row says.
- **The generator's own coverage holes** — the README lists every classed element no pass reached ("Not reached"), and every ⚠️ row is a winning declaration the computed value contradicts. Each is unexamined until opened.
