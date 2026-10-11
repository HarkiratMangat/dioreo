---
kind: record
status: live
---

# C1 element system — his spec, verbatim (2026-10-07 01:12 EDT)

Kept names so far: `label-9.toolbar` (MANIFEST label) · `field.search` · `button-L-box.loud / .fill / .ghost / .paint / .tint`

Styles:
- loud = buttons like "new build", "post announcement", etc. They're not solid fills, but their outline and their inside are usually a matching washed/tinted shade. Usually white/black text.
- tint = buttons like "Stage deletion". Not a solid fill, but not quite the level of color as a 'loud'. Text matches accent. Border and text same color, fill is black with an accent-colored tint over it.
- fill = buttons like "repair build", "stage this build", "reset".
- ghost = buttons like "clear", "list". Outline, transparent fill. On hover they just light up, instead of a fully colored hover tint.
- paint = buttons like "edit builds", "export" in the selection bar, or the share/trashbin icon buttons. A fill, then color tinted on hover.

Box buttons (rectangle, soft corners):
| Size | Height | Clickable | Radius | Icon | Text | Pad L/R | Icon→text |
|---|---|---|---|---|---|---|---|
| L | 44 | 44 | 11 | 16 | 13 · 600 | 14 | 10 |
| M | 32 | 44 | 8 | 14 | 11 · 600 | 10 | 6 |
| S | 26 | 32 | 6 | 12 | 11 · 600 | 10 | 6 |
| XS | 20 | 26 | 5 | 12 | 11 · 600 | 6 | 6 |

Pill buttons standalone (filter chips): same sizing, radius 999. Pill rails (By weapon / One table, Tier Board / Compare): same sizing, radius 999, a 3px gap around the whole thing; 3px on 44, 32 and 26.

Pill chip (the BAL-27 · Build 5 · × chip): 32 tall · left pad 10 · dot 8 (an icon would be 14) · dot→BAL-27 6 · BAL-27 13px · Build 5 11px · BAL-27→Build 5 10 · Build 5→× 6 · × button 24 tall, 50% radius, icon 12, 3px outside gap, hovers like 'paint'.

Line height and letter spacing: mine to set (memory `feedback_line_height_tracking_are_mine`).

## Decided (2026-10-07 12:26 EDT)
- **S is 24** (his 12:13 EDT: "20->24 +4, 24->32 +8, 32->44 +12 … allows 24px to use radius 6"). S: 24 tall, click 32, radius 6, icon 12, text 11 · 600, padding 10, gap 6.
- **Rails** (his "your proposed design for the Rail is fine", redrawn for S 24): a rail is its size, its segments one size down, the space around half the step: L 6 · M 4 · S 2. Segments inside a rail get no extended click area (they touch).
- **The BAL-27 chip** (his 12:13 EDT: "use 4 px all the way around"): an S × (24) in the M chip (32), 4 all round.
- **Name grammar** (his): `type-size-shape.style--flags`, e.g. `button-L-box.fill--ok`, `button-L-box.tint--danger`, `button-M-pill.paint--ar--icon--count`.
- **Fields** (his names): `field-L-search.filter` (manifest) · `field-L-search.dropdown--wep / --category / --attachment` (New build) · `field-L-search.multiSelect--wep` (Compare).
- Measurement colours on the spec page (his): radius orange · gap green · padding light blue · icon purple · height/width yellow · click area dim.

## Open (2026-10-07 12:26 EDT)
- XS click area: his 26, or 24 now that S is 24?
- Colour flags name the source (`--cat`, `--slot`) rather than the value (`--ar`)?
- 9px label names (spec page section): group · category--cat · field--cat · slot--slot · badge · mode · key · realm; and the two weight splits (group 500 vs 600; Compare's slot heads 600 vs chips 700).
- `multiSelect` → `multi` (lowercase)? `.single` / `.multi`?
- My defaults: square icon buttons per size, 1px outline, press 98.5%, disabled 40%.

## His answers (2026-10-07 12:38 EDT) · spec page v3 (version 1791391072-f812)
- XS click area: **24**. Minimum gaps between buttons, on his scale: **M 14 · S 10 · XS 6** (L any).
- Colour values name their source (`cat`, `slot`): **yes**.
- His grammar refinement, shown on the page: `button-M-pill.paint-cat--icon--count`: `-` picks which one (a colour, or what a field searches), `--` adds a part that is there or not. Consequences shown: `field-L-search.dropdown-wep`, `label-9.field-cat`; a label that always takes one source drops it (`label-9.slot`, `label-9.category`). Awaiting his OK.
- 9px label names: preliminarily approved, pictured at 2x on the page for his decision.
- `multi` vs `multiSelect`: he is unsure. Weight splits (group 500/600, slot 700/600): he is checking.

## His 13:39 EDT round · spec page v4 (version 1791395244-13a8)
- Styles section names stay GENERAL (`button-L-box.loud` … `.paint`); colour values (`-staged`, `-danger`, `-ok`) come later as their own sections. (`loud-lead` was wrong anyway: the colour token is `staged`.)
- Descriptions: paint = "neutral fill (dark, grey or clear), tints on hover"; fill = "solid colour, glow on hover".
- Label names (his grammar `label-size-textWeight.colour--flag`): MANIFEST `label-xs-600.ink3--right` · TIME `label-xs-600.ink3` · category `label-xs-700.cat` · BUILD NAME `label-xs-700.cat` · slot (chip and Compare) `label-xs-700.slot` · badge and mode `label-xs-700.badge` · CODE `label-xs-500.ink3` · ARMORY `label-xs-600.ink3--right`. label-xs = mono 9px; line 12px and tracking 0.12em are mine (set on the page).
- Text scale (non-button): xs 9 · s 11 · m 13 · l 15 · xl / xxl from the portal (22 · 26 · 34 · 44): OPEN which two.
- Click areas: decided (gaps M 14 · S 10 · XS 6). Icon-only buttons, outlines, and hover/press each got their own section.
- OPEN: XS text 9px (three variants shown) · hover/press scheme (Still / Lift / Flat shown live; today: 21 of 28 C1 buttons = Still, New build + category chips = Lift, the four L bar buttons drop without shrinking) · xl/xxl sizes.

## His 15:46 EDT round · spec v5 (1791403166-d8eb) · Builder-2 V25 (`e43410b`, 1791403192-1ab6)
- Decided: XS text stays 11 (buttons are Space Grotesk 600) · hover/press = **Still** for every button, fill keeps its glow · Outlines 1px.
- Built on the board: the Manifest search's clear button (`SearchField`, `.srch-x`: M icon, corner 8, 6 inside the field, neutral tint, Still press, Escape clears). Neutral, not the drawer's red: clearing a search deletes nothing (drawer × unchanged, proposal open).
- Spec page: decided sections trimmed; one slot label tile; every search field type drawn from the board's own components (SearchField, Picker ×3, Compare's WeaponSearch).
- OPEN (his to call): text xl 21 · xxl 30 · giant 44 · jumbo 58 (shown); icon-button names: `button-L-icon.paint`, style `bare` (no outline until hover: the minimise −, Sort), `--reveal-right/left` (Collapse); the drawer's × adopting the new clear button.

## His 16:19–16:23 EDT round · spec v6 · Builder-2 V26 (2026-10-07 17:03 EDT)
- Decided: text scale xs 9 · s 11 · m 13 · l 15 · xl 21 · xxl 30 · giant 44 · jumbo 58, and the board's 17 becomes 15 (the board change waits with Still) · `--reveal-right` / `--reveal-left` · `--borderless` is a flag any style takes: no outline, ever · the field's clear × is `paint--borderless`.
- "The match count pill" = the "5 matches" box inside the search field.
- Board V26: the × was broken: `.srch svg` (the glass rule) also reached the ×'s own icon, pinned it low and kept it grey on hover; now `.srch > svg`. The count box is M (32, corner 8, 11px, 6 from the field's edge, 6 from the ×).
- Spec v6, the dropdowns: the board's own components (b4/form.js WeaponField · CategoryField · AttachmentRow, b4/compare.js WeaponPick) in the board's ancestor chains with the board's builds. Every open list matches the board's row for row (weapon 68 · category 7 · attachment 200 · Compare 68; HTML identical apart from where the list sits and the hovered row). The build card's markup is identical before and after the extraction.
- Spec v6, captions: none written by hand. Each special case prints what the board measured of itself at rest and under a real mouse (`local/pins2/s4/work/lead/board-probe.cjs` → `local/pins2/s4/builder-2/spec-img/board-facts.json`); the spec copies measure identical (−, Sort, Collapse). The − had stood in the selection bar's context, so it drew the bar ×'s outline; on the board it has none until hover. Sort truly changes nothing on hover. The builder's own geometry for those elements rides along in `local/pins2/s4/builder-2/spec-img/board-bd.css` (Sort is 13 tall on the board, 48 without it).
- Spec v6: the icon grid (loud · tint · fill · ghost · paint × XS–L, and each but fill `--borderless`); Text, Outlines (per style, measured rest and hover) and Click areas (all four sizes at their smallest gap) redrawn as design-system entries.
- OPEN, his: the icon-button names, from the grid · where the board's 19 and 20 (display numerals) and 22 (gate titles) go on the scale · Still and 17 → 15 on the board, once the spec settles.
- (2026-10-07 17:18 EDT, his "are you sure?") Self-audit: every claim re-checked against evidence. Open lists compared as pictures, board beside spec, pointer parked (weapon · category · attachment with its group divider · Compare: the same); all 3 search fields on the board keep their glass (Manifest, Broadcast, History); 36 grid cells all change on hover; verify "all core checks passed". Fixed: the count and × are one suffix group and the input pads to its measured width (130 for "5 matches"; was a fixed 146, too narrow for "1,234 matches"). Not done: Styles, States, Sizes, Rails, Chip and Labels keep their older layouts; the grid cells use partial contexts (the bar's), not full board chains.

## His 18:21 EDT round · spec v8 (2026-10-07 18:28 EDT)
- Decided: the board's 19, 20 (big numbers) and 22 (gate titles) go to xl 21 ("21... its kind of obvious").
- Fixed: disabled sat outside its card (now inside the Still card) · every icon-grid cell and every "today" case carries its proposed name.
- Proposed (his to pick): `--quiet` = the style shows only on hover, clear at rest (not `--borderless`, which never draws an outline). Cases: − `button-S-icon.ghost--quiet` · Sort `button-XS-box.ghost--quiet` (needs 20 tall, 24 click, a hover) · Collapse `button-M-icon.paint--reveal-right` · search × `button-M-icon.paint--borderless` (his).
- Measured on the board (board-probe.cjs): filter chips 32 tall, 6 apart, click area = the chip (3px above hits the toolbar). Post-announcement drawer: copy 28 (corner 7) and calendar 32 (corner 8) clear at rest, accent tint + 1px accent ring on hover → `tint--quiet`; shuffle 44 (corner 9), dark fill + neutral ring, accent tint on hover → `paint`; stepper + 40×36 (corner 5), neutral fill, no ring, accent tint + ring on hover → `paint--quiet`-like, his `paint--borderless` holds only if the hover ring goes; − at value 1 is the disabled state; switch track 40×24, off = dark + 1px ring, on = solid accent, hover = ring brightens → proposed `switch-S-pill.fill`.
- His idea `field-L-search.dropdown-wep--multi`: I agree (the `-wep` picks the data, `--multi` is a part that is there or not). Awaiting his yes before renaming on the page.

## His 18:40–18:50 EDT round · Builder-2 V28 · spec v9 (2026-10-07 18:51 EDT)
- Decided and built: the search × and every dropdown chevron are `tint--quiet` (the Post drawer's own in-field formula, b4/classes.css `.acx-ib` / `.pb-dbtn`: realm colour in the icon at rest; 14% tint, 1px ring at 45%, light icon on hover), M 32, corner 8, icon 14 (the chevron was 16) · Sort has a hover: the same tint drawn as a 4px box and 1px ring outside its 13px (his variant) · the Compare field is `field-L-search.dropdown-wep--multi`.
- Drawn: every style with `--borderless`, `--quiet` and both, at M (spec v9).
- Icon sizes for the Post drawer's field buttons, measured → the decided table: copy 14 in 28 → 14 in M 32 · calendar 16 in 32 → 14 · shuffle 16 in 44 → 16 (L; corner 9 → 11) · stepper − and + 16 in 40×36 → 14 in M 32 · the switch has no icon.
- His correction (18:45 EDT): paint's rest is "neutral (dark, grey or clear)", so the old search × (clear, neutral icon, tint on hover, never an outline) is `paint-borderless`, not quiet + borderless. My example was wrong. Then (18:46 EDT): "we really need to better define .ghost and .paint so they don't overlap". OPEN: my proposal, every style recognisable at rest: ghost never fills (neutral outline, brightens on hover); paint always has a neutral fill at rest (dark or grey, never clear) and tints on hover; "clear at rest" is then `--quiet` on any style. And `-quiet` vs `--quiet`: they still combine (tint--quiet--borderless = clear at rest, tint fill on hover, no ring, unlike the drawer's tint--quiet), so `--` (my recommendation).

## His 19:00–19:02 EDT round · spec v10 (2026-10-07 19:03 EDT)
- "brighten it to match ghost's hover": measured, the − already matches: its hover ring is rgb(133,147,159), the same as ghost's hover ring (ghost rests at the dimmer rule2 70%), icon ink, no fill. My 18:57 claim that ghost's hover was one step brighter was wrong; nothing changed on the board.
- Decided: on fill, the hover glow counts as its outline, so `fill--borderless` never glows (spec v10).
- The variant table: a 56px specimen band per row and two-line names (base, then the flags); measured: icon centres and name tops level in every row, labels on the band, headers over their columns, the table scrolls inside its card on a phone.
- (2026-10-07 19:08 EDT, his "--borderless is also not applying on the ghost button") Cause: b4.css's hover ring `.b4 :is(.b3-btn2:not(.go):not(.dang)…):hover` is !important at (0,8,0) and beat the spec page's flag rules (0,3,1). The flags now carry two `:not(#_)`. board-probe.cjs prints `FLAGS`: every --borderless cell edge-free at rest and hover, every --quiet cell bare at rest (20 cells pass).

## 2026-10-07 19:11 EDT
- Decided (his "yeah rename it to wash"): the style `loud` is now **`wash`** (colour in the fill and outline, white words; tint keeps a dark fill and puts the colour in the words). Older entries above keep the name they were written with.
- (2026-10-07 19:23 EDT) His 19:13–19:19 asks → spec v12 "Every style, one colour": each style's own rules with its colour pointed at warn, states rest · hover · press · disabled (keyboard focus dropped at his word), every value read from the measured colour. Measured: wash = fill accent 14% → 24% on hover, outline accent, white words · tint = dark 85% fill, outline accent 30% on dark, accent words; hover fill accent 12% on dark, outline accent 60%, words accent 80% + white · fill = accent fill, dark words; hover accent 74% + white with a 3px halo at 26%; press accent 88% + black, 2px halo · ghost = greys only (line grey 70% outline, grey words → grey outline, white words) · paint = neutral at rest (dark 85%, line grey outline, light grey words), and on hover EXACTLY tint's hover (same formula: b4.css:160 and board.css:804) · press = drops 1px, 98.5% · disabled = 40%.
- (2026-10-07 19:54 EDT) His 19:48 idea: ghost becomes a flag, `--ghost` = no fill at rest or on hover, outline kept. Drawn on every style (spec v13), measured: tint--ghost = an accent outline-only button; paint--ghost with no colour value (white) = the grey → bright step-up (his 19:52: "the color would just be white"), one step brighter than today's ghost (rest outline line grey 100% vs 70%, words light grey vs grey; hover outline white 60% vs grey, words near-white vs white); wash--ghost: hover changes nothing; fill--ghost: words too dark for the page. OPEN: adopt --ghost on tint and paint only; paint--ghost matching today's greys exactly or keeping paint's step.
- (2026-10-07 19:56 EDT) His attack, 19:52 EDT, upheld: my "paint--ghost is not today's ghost, ghost never takes colour" was a word game: with no colour value the colour is white, and paint's hover is then the grey → bright step-up. So ghost = `paint--ghost` with no colour value, and my "ghost never filled / paint always filled" definitions are withdrawn. Further, measured: paint = tint, neutral until hover (same hover recipe; same dark 85% fill at rest; only the rest outline and words are neutral). Survives: `--ghost` only on tint and paint (wash--ghost has a dead hover, fill--ghost unreadable words). The "match today's greys" question is withdrawn: it is the neutral colour's tuning, which belongs to the colour sections.

## His 19:59 EDT decisions (2026-10-07 20:02 EDT)
- **Decided:** ghost is no longer a style; it is the flag `--ghost` (no fill at rest or on hover), allowed on tint and paint only. Today's ghost = `paint--ghost` with no colour value; the − = `paint--ghost--quiet`.
- **Parked:** paint's definition ("tint, neutral until hover" offered) waits for a full definition check and improvement pass once things settle.
- Still open: `--quiet` vs `-quiet`; icon-button names; the Post drawer's sizes; filter chips' click area.

## Built 2026-10-07 21:07 EDT · spec v15 (1791421647-b0c9)
- The page follows his 19:59 EDT decision: four styles (wash · tint · fill · paint) and the flag `--ghost` on tint and paint; `paint--ghost` in the one-colour states; the − = `paint--ghost--quiet`. Measured, today's ghost vs paint--ghost (white): rest outline line grey 70% vs line grey, rest words grey vs light grey, hover outline grey vs white 60%, hover words white vs white 80% + pure white (the neutral colour's tuning, parked with paint's definition).
- Open with him: `--quiet` vs `-quiet`; icon-button names; the Post drawer's sizes; filter chips' click area; (never answered since 12:38 EDT) the label weight splits, group 500 vs 600 and slot 700 vs 600. Asked 2026-10-07 21:07 EDT: clean up the spec board now?

## His 22:07 EDT answers (2026-10-07 22:10 EDT)
- **Already decided (his words: "i thought --quiet was decided already. same with --borderless and --ghost"; icon names "also decided"):** `--quiet` (a part, written `--`), `--borderless`, `--ghost`; icon-button names `button-<size>-icon.<style>` with their flags, as the grid draws them, and the board's cases: the − `button-S-icon.paint--ghost--quiet`, Sort `button-XS-box.tint--quiet`, Collapse `button-M-icon.paint--reveal-right`, the search × `button-M-icon.tint--quiet`.
- **Label weights:** set by his 13:39 EDT names (group 600; slot 700 on the chip and in Compare). My 21:07 EDT "never answered since 12:38" was wrong and is withdrawn.
- **Decided:** filter chips stay 32 tall, 6 apart, no extra click area.
- **Open:** the Post drawer's four field buttons to the decided sizes (re-asked plainly).
- **His go:** clean up the spec board, planned and asked first.
- Why my list was wrong: I carried this file's "Still open" lines forward without testing each against his later rounds; a decision now closes every open line it answers in the same write.
- **From the session transcript (his words, checked 2026-10-07 22:11 EDT, after his "or you could check the transcript"):** the icon-only pattern is HIS proposal, 15:46 EDT ("i'd propose `button-L-icon.paint` and `button-L-icon.paint--reveal`"), not mine as I had thought; at 16:19 EDT he said to draw every style at XS–L "then based on that, we can decide"; the grid has carried the names since, and his 22:07 EDT message is the yes. `--quiet`: he asked at 18:40 EDT whether `-quiet` fits better ("quiet/border can't be stacked"); I answered `--` because they do stack on tint; he wrote `--quiet` from then on and calls it decided at 22:07 EDT. Label weights: every weight is in his 13:39 EDT list (`label-xs-600.ink3--right` … `label-xs-500.ink3`).

## His 22:18 EDT answers (2026-10-07 22:37 EDT)
- **Board changes wait:** "update them afterwards, after the spec-board is done, then you can go edit the main board with all the changes. lets decide things step by step and then you can do a large update to the board … keep a ledger" → `local/pins2/s4/builder-2/spec-img/board-changes.json`, shown on the spec board.
- **Styles:** one section (Styles, Hover and press, One colour, Outlines merged).
- **Cleanup:** "just overall refine it, finalize decisions for a clean showcase. keep the measurement on/off toggle … collect things together. group things. show the different variants. state the names we set"; merge Sizes + Click areas; drop the ghost comparison; one board-changes list. The not-allowed cells were not picked, so they stay.
- **Sort chevron:** `button-S-icon.paint--ghost--borderless`. **Collapse:** `button-M-icon.paint--reveal-right` is fine.
- **Found open by the read-only check (not asked before):** the search count box (32 tall, realm tint, 6 from the ×) never answered; no name for the filter chips (his 12:36 EDT grammar example `button-M-pill.paint-cat--icon--count`); no name for the rails.

## Built 2026-10-07 22:48 EDT · spec v16 (1791427399-43b7, Builder-2 `9a153b5`)
- The spec board as a finalized showcase, per his 22:18 EDT answers: Sizes and click areas · Styles in one section (wash · tint · fill · paint · tint--ghost · paint--ghost) · Flags · Icon-only with the board's buttons named · Labels grouped by name · Search fields · Pills, rails and chips · Board changes still to make (the ledger) · Still open.
- **Open, asked 22:43 EDT:** the search count box (keep 32 tall, realm 14%, 6 from the ×?); a name for the filter chips (his 12:36 EDT example `button-M-pill.paint-cat--icon--count`); a name for the rails. He answers in the morning.

## His 2026-10-08 morning (2026-10-08 11:12 EDT)
- **Filter chips:** "the dot was classified as an 'icon' a while ago" → `button-M-pill.paint-cat--icon--count`; the All chip has no category and no dot → `button-M-pill.paint--count`. Searched for the old note: found the related rulings (Board 4 intake C7-7, state chips carry icons, not dots; FilterChips draws the dot `<i>` in the icon's place when a category has no icon), not a literal "dot = icon" line.
- **Count box:** he asked what the alternative was ("keep it as drawn or...?"). Drawn three ways on the real field: A as drawn · B neutral box · C no box (my pick). Waiting on his pick.

## His 2026-10-08 11:38 EDT round (2026-10-08 12:00 EDT) · spec v17
- **Rails:** `button-M-rail` (his: "makes sense, no?") → `button-<size>-rail`; the style slot comes when rails are measured against the styles.
- **The spec board:** "no where near done … basically like a library of our elements".
- **Count box:** "neither. we'll come back to it and design it as a proper chip … once we work on all the chips".
- **Built:** dropdown corners measured 9 (should be 11) → ledger; field measurements; an accent switch with the realm token in field names; text measurements per family; sizes aligned; the style rules as pictures; flags: every combination, not-allowed designed, reveals shown, cards as pictures, On the board removed; icon sizes on the icon grid; Sort's hover named wrong in the ledger; pills moved up and measured; the gaps scale.
- **Next:** a census of the other text styles on the board, for naming.
- **Open:** the realm token's place in a field name; field words 14 and 12 off the scale; field leading icons 12 vs 16; chevron inset 4 → 6.

## His 12:35 EDT round (2026-10-08 12:40 EDT)
- **Standing rule (his words: "anything being added as a decided version in the spec-board gets corrected so it's styling matches conventions we've already set forth"):** the spec board draws every decided element to the set conventions; what Builder-2 still gets wrong goes in the board-change list. Applied to the fields: corner 11, in-field buttons 6 from the edge, words 13.
- **Realm accent (his question "why would it go on the field itself? … on the icon?"):** measured, a realm's colour lands only on the in-field buttons (the ×, the chevrons) and the count box, never the field box, its words or its magnifier. So the token goes on those buttons' names (`button-M-icon.tint-armory--quiet`) and the field names stay plain.
- **Pictures he couldn't open:** markdown images pointing into `local/` don't open for him; send pictures with SendUserFile.
- **Open:** the category field's words (12 → 11 or 13); the fields' magnifier (12 on the search, 16 on the dropdowns).

## His 12:45 EDT answers (2026-10-08 12:45 EDT)
- **Fields follow the L size (44):** asked the category words and the magnifier, he answered with the convention ("what size text do 44px buttons use?", "what size icon do 44px buttons use?"): every field's words 13, its icon 16. Built on the spec board; both in the board-change list. Nothing on the spec board is open now.

## His 13:00 EDT correction (2026-10-08 13:01 EDT)
- **The nesting rule, not a precedent:** I moved the chevron to 6 "because the × sits 6"; his: "how much outer gap does a 32px button have inside a 44px rail? 6. so why not match that already defined convention??" The rule: a button inside a container sits one size down with half the step around it: L 44 → M 32 → 6 · M 32 → S 24 → 4 · S 24 → XS 20 → 2. It covers the rails, the in-field buttons (× and ⌄: 6 in a 44 field, centred 6 above and below) and the BAL-27 chip's × (4). Cite the rule, never the instance that happens to match it.

## His 15:27–16:33 EDT round, written 2026-10-08 16:59 EDT
- **Fields (15:27 EDT), verbatim:** "the measurement labels on the fields need their position improved because currently, the way they sit, that "6" looks like it's referring to the radius." · "the search.filter needs correcting; it's misaligned and the icon is not 16px like the other fields." · "And what size are the `x` and chevron icons inside of the fields? 14px correct?" · "and why is the padding to the left of the magnifying glass 12px? shouldn't it be 14 px as per the 44px sizing?" · "also, why is the attachment field drawn so narrow?" · "the fields own hover states also need fixing: the search.filter light-up when hovered is not the same as the other fields. also, hovering the `x` icon or the 'x matches` doesn't active the field's own hover state." · "the search.filter field's inner dark color is also different than the other fields". **Built:** every field's leading content 14 from the edge; the search's glass 16 and centred; the search takes the field look, lit from anywhere over it, focus the fields' staged ring; the attachment row wide enough for its placeholder; the 6 drawn under the field beside the 32; expected values on the gauge; × and ⌄ icons measured 14 (M, C3). Conventions C13.
- **Inks (15:30 EDT):** "what ink are the outline, the magnifying glass, the dark fill, the placeholder text, the typed text using?? Those are things you should be mentioning as a collective. similarly for other sections on the spec-board as well." **Built (fields):** each field's inks measured and named by the kit's own color-mix() recipes (fill `#04070A 52% on sunk`, outline `ink 12%` → `ink 24%`, glass `ink3`, placeholder `ink4`, words `ink`, ⌄ and × `ink3`, under Armory `r-armory 45% on ink3`, count box `ink3 14%` / `r-armory 14%`, focus `staged`).
- **Autonomy (15:36 EDT):** "work autonomously. invoke sequential-thinking before each task, minimum 3+ thoughts asking honestly difficult questions that you'd otherwise miss … thoroughly update the spec-board with things like the other rails, chips, buttons, fields, etc etc, pop-ups, datepicker". Plan: `docs/pins2/plan/2026-10-08-s4-spec-board.md`.
- **Scope, ledger, settings, name (16:22 EDT):** "builder-2 for now, the full realms scope after everything from builder-2 is more or less settled" · "no need to physically update the builder-2 board yet. the edit itself can be collective at the end" · settings unchanged since Oct 6: "no." · "for now...'spec-board'. once completed, then it can be renamed again to element library".
- **Records (16:24, 16:27, 16:33 EDT):** "just make a temp ledger for yourself or something. dont rely on deferred list as your ledger." · "not gitignored... you have your personal docs/claude folder. track it there" · "move any other files worth tracking to docs/claude/ as well appropriately. local/ is for throwaway stuff." → `docs/claude/s4/`.
- **Open for him (pictures first):** Q1, the category dot's slot in a field (`local/pins2/s4/work/lead/q1-dot-slot.png`).

## His 17:05–17:35 EDT round, written 2026-10-08 17:38 EDT
- **17:05:** "too prose heavy. SHOW THROUGH DESIGN. DESIGN INFO, DONT JUST WRITE IT OUT! don't fall into the trap that caused the prior attempts at a spec-board/library to be rejected!" · **17:07:** "expand your sequential-thinking. ask better questions. think *design*, attack the *design*, then refine the *design*; don't act hastily." · **17:22:** "no. cluttered. and still mainly relies on prose as its main convoy of the information. none of it is easily obtainable at a glance." · **17:25:** "invoke /interface-design /frontend-design:frontend-design /design:design-critique … remember what i said earlier when i complimented the artifact on its first creation... why was that a compliment and this a rejection?" · **17:32:** "TF IS THAT??? thats so shit!" · **17:34:** "did you even use the 3 skills i invoked??" · **17:35:** "the fallback is fine. the issue was your attempts at designing the other info i wanted."
- **His praised version (2026-10-07 01:46 EDT, "yo nice artifact design!"):** the board's own components, numbers measured and drawn ON each element, only differences paired, prose low. **Settled:** the fields stay as the fallback — each field measured once, one ink row for the class (outline, fill, glass, words, placeholder, count, × and ⌄, hover, focus).
- **Rule for every new presentation (from 17:36 EDT):** frontend-design's plan with ASCII wireframes checked against his brief and the v1 rules, then design-critique, then build; a new layout is shown to him before it is built.

## His 17:44–17:45 EDT answers, written 2026-10-08 17:47 EDT
- **Text sizes (17:44), verbatim:** "12 -> 11. 14 -> 13. 10-> either 9 or 11, depends on where it's used. 17 -> 15. 19/20/22 -> 21. 12.5 -> 11 or 13, depends where its used. 16 -> 15. 60 -> 58." **By use (C5's roles):** 10 → 9 for Compare's badges (META, BEST AR, labels); History's avatar initial "O" (10, 27 runs) waits until its family is drawn and measured · 12.5 → 11 for Compare's column heads (Weapon, Slot, Actions), 13 for its cell value (60 Round Reload).
- **Q1 (17:45):** "actually, forget the gap. i pick B. it makes sense being in the 16 icon slot." → the category dot centred in the L icon's 16 slot, 18 from the edge, words 10 after the slot (at 40). C6.
- **On my census question (17:44):** "huh?" — the question was mine to answer: the census goes onto the Text sizes ladder.

## His 19:43–19:44 EDT answers, written 2026-10-08 19:51 EDT
- **Q3 (19:43), verbatim:** "28->32. 40->44. except the selection bar's gunsmith code... copy '5 · The selection bar, whole' from the builder-2 board into spec-board and let me see it at 24 and 32 (toggle at the top of the section to switch it. similarly, with the other buttons that live beside it." → the free-standing 28s (drawer ×, Undo, the queue card's Edit and remove, Set end date, Never) go to M 32 and Stage this MP build to L 44; the selection bar's code and the buttons beside it (the status chip, the ×) are shown in section **The selection bar** with a 24 · 32 switch.
- **(19:44), verbatim:** "just this part of 5 · The selection bar, whole" (his screenshot: the bar with the list open) → the list-open bar only.
- **Q8 (19:43), verbatim:** "unsure right now because i want to redesign some of them a bit." → open; he redesigns some tags first.
- **His question (19:43), verbatim:** "i notice that 'set end date' and 'never' both use `button-?-box.tint-warn` but their color/style differs? so im confused? what's the difference in their style?" → answered: same warn outline and words colour, but Set end date carries a warm fill at rest (`warn 9% on sunk`) where tint is plain at rest (`sunk`, as Never is); also face (Space Grotesk 600 vs JetBrains Mono 500), icon 14 vs 12, padding 8 / 12 vs 10, gap 8 vs 6. The name reader could not tell a fill tinted at rest from a plain one; such cards now carry **filled at rest** (Set end date, Pick, the export file name, and any tag like them) until he decides whether that look gets a name or goes.

## His 19:57 EDT answers, written 2026-10-08 19:58 EDT
- **The selection bar (19:57), verbatim:** "32." → the code, the status chip and the × go to M 32; Q3 is settled with no exception.
- **Filled at rest (19:57), verbatim:** "show me both of them on our wash and tint style?" → first read as the three filled-at-rest buttons (wrong); **his correction (21:39 EDT), verbatim:** "by both of them i mean the 'never' chip and the 'set end date' chip." → section **Set end date and Never**: the two Queue buttons today, in our wash, in our tint (2026-10-08 21:39 EDT).
- **His question (21:39 EDT), verbatim:** "also what about this chip? what's it's style? does it use one of ours or something else?" (his screenshot: New build's **Weapon required** hint, `span.b4-hint[data-tone=warn]`) → answered (2026-10-08 21:40 EDT): neither of ours. Rest = hover: fill `warn 12%` (translucent), a 1px ring of `warn 40%`, words `warn-ink`, 24 tall, corner 6, padding 8, icon 12, gap 6, words 12 · 600. Closest to wash (a translucent accent fill) but wash is `warn 14%` with a solid 1px `warn` border and ink words, and it changes on hover; this is a status tag with no hover, so it waits on Q8 with the other tags.
- **Spec board v26** published 2026-10-08 21:40 EDT: section **Set end date and Never** as he meant.
- **His ask (21:42 EDT), verbatim:** "mention their numbers and stuff too, like you did for the buttons styles before" → each cell now prints the Styles section's own Rest and Hover cards (fill, outline, halo, words, measured under a real mouse into `local/pins2/s4/builder-2/spec-img/filled-facts.json`) and its size and corner; **spec board v27** (2026-10-08 21:44 EDT).
- **His point (21:44 EDT), verbatim:** "also... the icons are still different, despite your measurement stating 16px" (his screenshot: the Search builds and Search weapons glasses) → right: both boxes are 16, but the board's search draws its OWN glass (circle r7, a short handle) where the dropdowns use the Lucide search (circle r8). Fixed on the spec board (the search draws the Lucide icon), the ledger's `glass` row names the drawing, and `relations.cjs --family fields` now compares the icon DRAWING, not only its box (it reported this fault before the fix and 0 after). **Spec board v28** (2026-10-08 21:49 EDT).
- **His point (21:51 EDT), verbatim:** "no it doesnt... i just checked the spec-board, your icon is literally the wrong color." → right: the Lucide glass strokes currentColor, and the search field's colour is ink, so my v28 swap drew it in ink where the dropdowns draw ink3. Fixed (the search glass takes ink3, as the dropdowns); `relations.cjs --family fields` now compares the colour each glass DRAWS too (it reported this before the fix, 0 after). **Spec board v29** (2026-10-08 21:53 EDT).

## His 22:00–22:25 EDT points, written 2026-10-08 22:26 EDT
- **(22:00), verbatim:** "1. why does this and so many other cards scroll?? 2. add the 'weapon required' variant to this 'never' 'set end date' comparison table. 3. move the radius number beside it's measurement curve; it feels abandoned 4. confused why some of the icon/buttons are larger in the "today · 28px" version vs the 32px version? for the selection bar." · **(22:01):** "vertically*" · **(22:25):** "what are you even running that's taking so long?"
- → 1: a box with `overflow-x: auto` also scrolls vertically, and a classic scrollbar's height overflows it; at desktop nothing scrolls now (content fits), the selection bar (the board's 1056) scrolls sideways only, a phone scrolls sideways only. Swept at 1000, 1282 and 390 (`local/pins2/s4/work/lead/scroll-sweep.cjs`). 2: Weapon required is the third row. 3: every gauge's corner number sits on its arc's outward diagonal. 4: measured — today the status shield is 18 in a 22 box and the copy icon 12; at 32 every icon is M's 14 (C6), so the shield shrinks while its box grows. **Spec board v30.**


## His 23:31 EDT replies, written 2026-10-08 23:46 EDT
- **(model), verbatim:** "keeping you on opus5.5. set to high." → rename string `Opus5.5-H · S4 spec board: Inputs · Oct 08`.
- **(the post-compact model check), verbatim:** "huh? how come?" → measured: `.claude/hooks/self-check.sh` is registered on UserPromptSubmit with `"timeout": 5` in `.claude/settings.json`; run by hand on this session's 130 MB transcript it takes 11 s, so every prompt kills it at 5 s (110 cancellations of it in this session's transcript since 2026-10-06 21:52 EDT). It greps the whole transcript JSONL for the last compact and the last derivation.
- **(group 6, 2026-10-09 00:03 EDT), verbatim:** "start" → Step 4 group 6 (Data display) built and published as v33 (2026-10-09 00:15 EDT).
- **(group 4), verbatim:** "continue it. i'll check the open questions afterwards since im still busy. if a group 5 exists, continue with it after group 4" → Step 4 group 4 (Inputs) built; group 5 (Overlays) next.

## His 2026-10-09 10:12–10:25 EDT asks on the page itself, written 2026-10-09 10:34 EDT
- **(10:12), verbatim:** "can you add a scrollspy nav or something on the side so i can easily jump to a section? currently i need to scroll and find everywhere" → a section rail, the board moved right to make room (his 10:17: "just push the entire board towards the right by ~80px to kill the empty gap on the right side"); a jump menu below 1100 px. **v34.**
- **(10:15), verbatim:** "can you also add a toggle to show/hide the \"on the board\" stuff? cuz its just info and sometimes it just feels like bloat when im just trying to look at the elements themselves" → his popup answer: both, as two toggles: *Hide notes* (the list under each element, its board place, its measured parts) and *Hide board copies* (On the board, Chips and tags, Segmented, Inputs, Overlays, Data display), remembered per browser.
- **(10:21), verbatim:** "also confused why you're stating board chrome here for \"on the board\"?? You could have literally shown the # on each announcement card which uses the 58px font size..." → the jumbo row's sample is now Queue's card number (`span.pb-numr`, 58 · 700); the gate codes (`span.pb-gid`, C1–C9, his 60 → 58 ruling `t60`) stay counted but never supply the sample.
- **(10:22), verbatim:** "i also notice the font sizes don't even mention the specific font??" → every sample and every census row names its font.
- **(10:25), verbatim:** "also fix the scrollspy section detection logic... im not even on the \"texts\" section" → the rail lights the section whose top last passed a reading line under the sticky bar, re-read on every scroll (the first version lit what an IntersectionObserver band last reported). Checked at six scroll positions at 1282 and 1700. **v35.**
- **(10:50), verbatim:** "nothing even changed on the texts??" (his screenshots: both toggles off, the Text sizes' "on the board" rows still shown) → *Hide board copies* now hides those rows too (they are the board's own text, copied), and the rail drops groups left empty.
- **(10:50, on the gate codes), verbatim:** "yeah... it's literally just board chrome" → every text run in a gate's head (`.pb-head`: its code C1–C9, title, description and scenario buttons) is out of the census (`local/pins2/s4/work/lead/census-chrome.cjs`); ledger row `t60` removed and `t21` no longer names the gate titles; the xl row's use reads "big numbers". Written 2026-10-09 11:05 EDT.
- **(10:51), verbatim:** "also clicking \"hide board copies\" is very glitchy/laggy" → measured: a 0.9 s long task on hide and 2.1 s on show (every click re-rendered and re-measured every section). The toggles now flip one class on the page root; gauges are never measured while hidden, and skip a re-measure at an unchanged size once settled.

## His 2026-10-09 11:49 EDT review, verbatim, written 2026-10-09 11:51 EDT
(with four screenshots: Text sizes with both toggles off; On the board L 44; Segmented and switches; the problem pop-up)

> # Gaps
> - Let's token them?
> - s1 6px / s2 10px / s3 14px / s4 20px / s5 26px / s6 32px
> - For near neighbor elements, such as gaps
>
> # Set End Date / Never / Weapon required
> - What exactly is 'warn-ink' and how does it differ from 'warn'?
> - What's the difference between outline: 'warn 30% on sunk' vs just 'warn 40%'?
> - Also wdym "Hover no change"?
>
> - What even does "hide notes" do? I dont see it changing anything when I have the board copies hidden.
> - Better organize the texts please, they're so cluttered.
> - Selection bar buttons still have the issue where some buttons are larger on the "today 28" version? Did you ever explain that to me??
> - refine and fix the reveal right/left animation: (two screen recordings, copied to `local/pins2/s4/intake/reveal-1-2026-10-09-1134.gif` and `reveal-2-2026-10-09-1135.gif`)
> - also confused why you're showing me this "on the board" section with the errors and not even drawing the corrected version for me to approve... like what do i care about the incorrect version being shown to me??
> - and is `button-L-icon.paint` really correct for the shuffle button? it uses a grey outline but a colored icon.
> - whats the point of showing me the segments/switches if i can't even see them in their active/selected states? interacting with them does nearly nothing.
> - why are "labels" and "fields" grouped together? meanwhile "inputs" is it's own section? wouldn't "labels" group and move near the "texts" sections and fields/inputs be grouped together since the fields are literally inputs?? overall, the entire grouping of sections needs refining.
> - problem pop-up is broken. also you didn't draw the all-pass, no-image, image didn't load, build image, staged deletion pop-ups?
>
> and nearly all of the open questions are drawn as just their current state... draw the corrected proposed state?? like wtf are you doing??
>
> also you're at 860k context so make sure your handoff/compact prep is all in order for when the auto-compact hits soon.

## His 12:06 EDT replies, verbatim, written 2026-10-09 12:09 EDT
- **(warn-ink):** "but is it just concretely set? or can warn-ink be derived from warn by a % value? such as \"warn + 20% white\",etc like youve done with other shades" → set concretely in `app.css` (`--warn-ink:#FF9E72`); not an exact mix: per channel it is warn plus 27% and 24% white; the nearest single mix, warn + 26% white, gives #FF9C75 (2–3 off). Asked whether to make it a derived token.
- **(hover no change):** "but you've stated it even for ones that do change." → right: a measuring fault (handoff Next step 0).
- **(shuffle):** "that's still not correct tho? because doesn't paint have it's outline/icon same color on rest?" → right: at rest its outline is neutral and its icon broadcast, so it is neither paint (all neutral) nor tint (an accent outline); none of the four styles fits. Asked: a rule for it, or a board change to paint (grey icon) or tint (accent outline).
- **(12:14, shuffle), verbatim:** "tint." → the shuffle button is `button-L-icon.tint-broadcast`: its outline takes the realm colour too; fix-list row `shuffle`. Spec board v38. Written 2026-10-09 12:15 EDT.
- **(12:14, warn-ink), verbatim:** "would that be the same as `warn 74% on white`? or does that wording result in a different mix?" → the same mix: 74% warn on white is warn + 26% white, channel by channel (#FF9C75); his call still open on whether to derive it.
- **(12:16), verbatim:** "it's the same? then can we standardize a ratio? because tint/paint currently use 'warn 80% on white'... so what's the visual different between the 2?" · **(12:19, popup):** "show me the literal button fully styled. paint and tint for 'warn' using 80% on white (their current text on hover) and 74% on white (the proposed alt to warn-ink, which is used by set end date/never/weapon required today)" → drawn from the board's own Stage deletion (tint) and Edit builds (paint): `local/pins2/s4/intake/warn-buttons-2026-10-09.png` (80% = #FF956A, contrast 8.9 on sunk; 74% = #FF9D75, 9.5; today's warn-ink #FF9E72). Correction: 74% rounds to #FF9D75, not #FF9C75.
- **(12:21, popup), verbatim:** "what about other colors? like such as staged/danger, etc? would that also use that 'color 74% on white' logic? like what do they currently set? do they all use 'color 80% on white'? or is it different for each one?" → measured across the board's CSS (2026-10-09 12:23 EDT): no shared ratio. Two fixed lighter tokens (warn-ink #FF9E72, danger-ink #FF8A85); about 40 different 'colour N% on white' mixes from 26% to 94% — ok at 70 · 80 · 82 · 86 · 88, staged at 80 · 82 · 85, danger-ink at 80 · 92, realm colours from 26 to 88.
- **(12:28), verbatim:** "add that as part of your work for after the compact. to create a section on the spec-board showing the main colors such as ok, warn, danger, staged, info, armory, etc etc drawn at their current color, and then on 74% on white, 80% on white, in both a tint and paint button style. similar to the image you sent me. Then we can see what actually works as a single ratio across all colors for a lighter variant. Provide your recommendation with it. and im also open to moving the ratio away from 74/80% to something else if a different % fits/looks better." · "update that into your handoff/notes and give me the compact / post compact blocks again" → handoff Next step 9; written 2026-10-09 12:29 EDT.

## His 2026-10-09 afternoon words, verbatim, written 2026-10-09 16:03 EDT
- **(15:10):** "work autonomously, im busy" → steps 2–6 and 9 built (spec board v42–v46).
- **(15:56):** "keep working autonomously. also add the /artifact-capabilities db into the spec-board so i can just choose inside of it instead of having to write it up in chat." → the Your calls section (v46): each choice is the db document `calls/<id>`, read back with ArtifactData.
- **(19:29, with a screenshot):** "why is this pop-up just randomly here? and why do i have to scroll and find the \"your call\" sections in the actual board? why wouldn't you just put them beside their sections? or at the very least provide a way to jump to them? this is such lazy shit design from you!" · **(19:30):** "ask better sequential-thinking because these are large failures!" → v49, written 2026-10-09 19:43 EDT.

## His calls on the board (the db, read 2026-10-10 18:53 EDT), verbatim, written 2026-10-10 19:21 EDT
- **ratio (2026-10-09 19:28 EDT):** "80" → C14; Colours marked decided (spec v50).
- **warnink (19:32 EDT):** "derived" → warn-ink = warn 80% on white #FF956A; danger-ink follows the one ratio (#FF8989). Ledger row `ratio`.
- **twins (22:03 EDT):** "no", note: "a few notes before I'm ready to approve: - verify the icon weight/the logic of it's weight is same across the spec-board. like does every icon scale the same way? - can we try text weight 700 for the 44px buttons? - reword \"stage this mp build\" to \"Stage build\" and add an icon to it? - the gunsmith code button 'button-M-box.paint--borderless' is completely incorrect. it's not really a single button, it's more like a component. so it needs a different kind of proposal (so defer it out of this section for now, we'll come back to it in a bit) - the 'button-M-box.tint-staged Export' \"pick\" button for the export drawer, let's make it L sized. Similarly for the 2 \"Download\" buttons that sit above it in the drawer as well. - the 'button-M-icon.paint--ghost--reveal-right' x close button is bugged. also it should reveal-left. - the '13 off the size table button-?-box.paint--ghost--borderless' Announcement sort button... give it literally the same treatment as the \"Weapon\" sort button. also the weapon sort button should have the `-armory` color part on it, no? since it's realm colored... or would it be `-realm`?" → icon weights measured (every Lucide icon: stroke 2 on a 24 box, so its line is box ÷ 12; the inline marks drawn on a 16 box at 2.6 run heavier) · a 600/700 strip on the L row · Stage build with a plus · the gunsmith code set aside · Pick and both Downloads on L (rows `pick`, `download`) · the × fixed and opening left (row `ncx`) · both sorts `button-S-icon.paint-realm--ghost--borderless` (row `sort`). The capture also never read Repairs' Repair build; it is drawn now.
- **filled (22:27 EDT):** no choice, note: "i actally want to try a few things before i decide these... - what if we changed tint's rest text to `color 80% on white` as well? - what if we tweaks tint's outline to show a bit more of the accent color instead of it being so muted? - i want to try/see a style: REST...fill=color 9% on sunk. outline=color 40% 1px. words=color 80% on white. HOVER...fill=color 15% on sunk. outline=color 62% 1px. words=color 80% on white." → three tries drawn and measured (the stronger outline at 55% on #0B0F12, hover 75%: my values).
- **q8 (22:28 EDT):** "later".
- **q6 (22:30 EDT):** "yes", note: "instead of `-armory`, let's do `-realm`? following the same logic of us using -cat instead of `-assault`, etc" → C11; shuffle is `button-L-icon.tint-realm`.
- **q7 (22:37 EDT):** "24" → the badge box stays 24; the XS proposal withdrawn.
- **q11 (22:48 EDT):** no choice, note: "the toast is part of the builder-2 board chrome." → the toast leaves the Overlays section; Q11 stays open for the drawers and the problem pop-up.
- **(2026-10-10 19:12 EDT):** "why 390??" · **(19:13 EDT):** "search your linksee memory aboy mobile." → the phone is not a review surface for the boards (his 2026-09-18 11:08, 2026-09-20 12:02 and 2026-10-02 10:55 EDT words); the sweeps run at 1282 (his viewport) and 1440, never 390.

## His 2026-10-10 21:02 EDT review of v50, verbatim (11 screenshots), written 2026-10-10 21:05 EDT
> i still have a bit of usage left so i wont switch to the cloud session just yet, but do keep it sync'd up so i can switch over whenever.
>
> * for the never/set end date/weapon required...
>    * i like the new outline on tint. let's use that for that style?
>    * move 'never' and 'set end date' -> tint
>    * 'weapon required'... so first, its not supposed to have any hover event. it's an informative chip. but im honestly still unsure what style i want it as. so before i decide, can you tell me what style these 'ready' and 'filled x slots' tags use? how do their styles compare to the current style of the 'weapon required'?
> * for the reveal-right/left button, the text inside is clipping. also can you verify that both right/left use the same animation timing? because reveal-left seems more abrupt to me. overall can you give them more of an ease, as well as a ~50ms wait so a mouse over them doesnt accidentally trigger the animation.
> * 'on the board' sections:
>    * L buttons, yeah let's use 700 weight.
>    * 'pick' button, isn't this .wash-staged?
>    * the 'button-M-icon.paint--ghost--reveal-left' `x` button is still incorrect. in rest, it's icon is misaligned. and then on hover, the glow/lightup is completely incorrect and not what we use for .paint--ghost.
>    * for the 'undo' button, give it `.paint-realm` for the history realm.
>    * why is the trashbin icon stated twice?
>    * the 'expand' button's hover is also incorrect.
>    * confused how im supposed to judge an icon/button you drew in disabled state (the copy icon button from New Build drawer)
>    * the selection bar's gunsmith code button is also incorrectly labeled. that style is clearly `paint--quiet`
>    * You gave the announcement sort button the -realm token but didn't give it broadcast realm's actual accent tho?
>    * it seems to be you're understanding isn't clear on what a default `.paint` button should look like vs a `.paint--ghost` vs `.paint-color`, similarly with `.tint`. like each button has a default style/color of its own when a color token isn't assigned to it. We should clear that up. and i guess this also ties to our definition of what each button is. so really we need to clear up the definition of each style, the exact rest/hover behavior/colors/etc of each style, and the default view of each style.
>
> * the icon button styles are nearly all broken on their hover. they don't work.
> * Chips and tags... we'll return to these soon, because honestly they require their own styles/scale possibly.
> * the badge boxes...we'll return to these as well, as part of the 'chips and tags' work.
> * Segmented and switches... we'll return to this after the other buttons and colors and stuff are corrected.
> * Inputs... these are either proposed incorrectly or they're broken. please correct this section.
> * Pickers... PLEASE draw your proposals and measurements on these much better. this is such lazy, prose driven work which i've already had to state and correct you on multiple times!! literally look at transcript! Not to mention some of these picker proposals are literally broken and drawn incorrectly.
> * Overlays... i have no idea what this section is even about or trying to propose.
> * pop-ups... literally every single one is drawn incorrectly or broken.
> * Data display... why tf is the whole broadcast cards gate here?? this is a spec-board, not the full gate board. we're refining and standardizing the individual elements that collective make a whole product. the broadcast cards are a collective product. Similarly the discord previews.

### What his 21:02 review changed (spec v51, written 2026-10-10 21:33 EDT)
- Icon hovers: one cause. The hover-freeze copy turned every `:not(:hover)` into `:not(.fxhov)`, which matches a real hover too, so every --quiet rest rule stayed on while hovered. Fixed in `spec-buttons.js` hoverSheet; Flags 32 of 32 and On the board 51 of 51 buttons now change on hover (standards-mode probe, `tools/hover-probe.cjs`).
- Tint's outline 55% / 75% everywhere styles are shown (C9) · Set end date and Never decided tint · L words 700 (C1) · Pick named wash-staged (the namer now calls any accent-mixed fill with an accent outline wash) · the selection bar's code paint--quiet · Undo paint-realm · disabled board buttons drawn enabled · one card per icon button name · announcement cards and Discord previews out of Data display.
- Weapon required: measured against Ready, Filled 4 slots and "4 of 5". All four are one component (b4/form.js Chip, class b4-hint), told apart by tone only.
- Reveal: right and left share every timing (measured with `tools/reveal-timing.cjs`); now eased in and out (cubic-bezier(.45,0,.2,1)), opening after a 50ms wait, the word opened to its own width (max-content) so it no longer clips.
- Still to do from this review: the style definitions table (default, -colour, rest, hover, flags), then the × close, Expand, Undo and Announcement looks drawn from it; Inputs, Pickers, Overlays and Pop-ups redrawn.

### The style definitions (spec v52, written 2026-10-10 22:19 EDT)
- Read off the board: the Styles section's measured buttons in warn (`docs/pins2/s4-board/spec-img/spec-facts.json`) and a census of every board button's inks (`docs/pins2/s4-board/tools/style-census.cjs`). The census showed paint-colour buttons agree on the rule (neutral at rest, the colour on hover) but not on numbers (outline 42 to 45%), and paint's own fill varies (none, sunk, raised).
- Drawn as a table on the Styles section (`spec-defs.js`): paint, tint, wash, fill × no token, -realm (Armory), -warn, -realm (History), each at rest and on hover with its values, and the four flags. The same recipe now paints every corrected copy under On the board, read off its name; the per-button looks (fixCss) are gone.
- Verified with `tools/look-probe.cjs` under a real mouse: the × close rests clear with a rule2 outline and its icon centred (0 off), hovers ink4 and ink; Expand rests sunk 85% and hovers hi; Undo hovers History's colour; the Announcement sort hovers Broadcast's; Set end date and Never are tint-warn. On the board: 56 of 56 buttons change on hover.
- Calls on the board: "defs" (approve the table) and "defaults" (a tint, wash or fill with no token takes ink, or the realm it sits in; my pick ink).

