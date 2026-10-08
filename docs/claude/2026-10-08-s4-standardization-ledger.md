---
kind: record
status: live
---

# §10.6 draft — Session 4's standardization rows (a working ledger, tracked)

*Moved here 2026-10-08 16:27 EDT at his 16:27 EDT word ("not gitignored... you have your personal docs/claude folder. track it there so you don't lose context or forget about it"). Started 2026-10-08 16:27 EDT at his 16:24 EDT word: "just make a temp ledger for yourself or something. dont rely on deferred list as your ledger." Each element he has settled, as a row shaped for the parent plan's §10.6 (element · value · surfaces · exemptions), copied there when he closes the standardization board. What Builder-2 still draws differently is NOT here: that is `builder-2/spec-img/board-changes.json`. The plan: `docs/pins2/plan/2026-10-08-s4-spec-board.md`. Rules cited by number from `conventions.md`; his words verbatim in `button-system.md`.*

| # | Element | Value | Surfaces on Builder-2 | Exemptions · open | His words (EDT) |
|:-:|---|---|---|---|---|
| R1 | Control sizes (C1) | L 44 · M 32 · S 24 · XS 20 · click 44 · 44 · 32 · 24 · icon 16 · 14 · 12 · 12 · words 13·600 · 11·600 · 11·600 · 11·600 · padding 14 · 10 · 10 · 6 · icon→words 10 · 6 · 6 · 6 · neighbours any · 14 · 10 · 6 | every button, rail, chip and field | free-standing 28-tall controls: Q3 | table 2026-10-07 01:12; S 24 at 12:13 ("20->24 +4, 24->32 +8, 32->44 +12"); XS click 24 at 12:36 |
| R2 | Corner (C2) | height × 0.25: 11 · 8 · 6 · 5; pills round | every control | — | 2026-10-05 12:07 |
| R3 | Nesting (C3) | one size down, half the step around: L→M 6 · M→S 4 · S→XS 2 | rails, the in-field × and ⌄, the BAL-27 chip's × | — | rails 2026-10-07 12:26; 2026-10-08 13:00 ("how much outer gap does a 32px button have inside a 44px rail? 6") |
| R4 | Button styles (C9) | wash · tint · fill · paint | every button | paint's definition parked (Q5) | wash renamed from loud 2026-10-07 19:11; styles 19:13–19:19 |
| R5 | Flags (C9) | `--ghost` (tint and paint only) · `--borderless` (no outline ever; fill: no glow) · `--quiet` (bare until hover) · `--reveal-right` / `--reveal-left` | buttons | — | borderless and reveal 2026-10-07 16:19 · quiet 18:40 · ghost 19:59 · fill--borderless no glow 19:03 |
| R6 | Still (C10) | hover changes colour only · press drops 1px and 98.5% · a fill keeps its glow · outlines 1px · disabled 40% | every button | — | 2026-10-07 15:46 |
| R7 | Icons (C6) | 16 · 14 · 12 · 12, the Lucide box; a gap measures to the ink; a dot counts as an icon in names, drawn 8 in chips | every control | the dot in a field: Q1 | 2026-10-07 01:12 · 2026-10-08 11:04 |
| R8 | Pills and filter chips (C4) | the size table, round ends; filter chips M 32, 6 apart, the click area the chip; `button-M-pill.paint-cat--icon--count`, All `button-M-pill.paint--count` | Manifest and Broadcast filters | the count box, as a chip: Q6 | 2026-10-07 22:07 · 2026-10-08 11:12 |
| R9 | Rails | `button-<size>-rail`; segments one size down, 6 · 4 · 2 around; no extended click area | the view rail | the style slot: when rails are measured against the styles | 2026-10-07 12:26 · 2026-10-08 11:38 ("makes sense, no?") |
| R10 | The selection chip | `chip-M-pill.selection-cat`: M 32, an S × (24), 4 all round | the selection bar | — | 2026-10-07 12:13 ("use 4 px all the way around") |
| R11 | Labels (xs) | `label-size-weight.colour--flag`, mono 9 caps: `label-xs-600.ink3` (`--right`) · `label-xs-700.cat` · `label-xs-700.slot` · `label-xs-700.badge` · `label-xs-500.ink3` | every gate | — | 2026-10-07 13:39 |
| R12 | Fields (C0 = L) | 44 · corner 11 · words 13 · icon 16 at 14 from the edge, words 10 after · in-field buttons `button-M-icon.tint-<realm>--quiet`, 6 from the edge · `field-L-search.filter` · `field-L-search.dropdown-wep` / `-category` / `-attachment` · `field-L-search.dropdown-wep--multi` | Manifest search, the New build drawer, Compare | a realm's colour lands only on the in-field buttons and the count box | 2026-10-08 12:35 · 12:45 · 13:00; padding 14 by C1 (his 15:27 question) |
| R13 | Text scale (C5) | xs 9 · s 11 · m 13 · l 15 · xl 21 · xxl 30 · giant 44 · jumbo 58; 17 → 15; 19 · 20 · 22 → 21; line height and tracking are mine (C8) | all text | 12 · 14 · 10 · 12.5 · 60: Q2 | 2026-10-07 13:39 · 16:19 · 18:21 |
| R14 | Gaps (C7) | 6 · 10 · 14 · 20 · 26 · 32 | everywhere | — | see `button-system.md` |
| R15 | Names (C11) | `type-size-shape.style-value--flag`: `-` picks one value, `--` adds a part; a colour value goes on the element that takes the colour | every element | new types: Q4 | 2026-10-07 12:26 · 2026-10-08 12:35 |
| R16 | The search's clear × | an in-field `button-M-icon.tint-<realm>--quiet`: M icon 14, corner 8, 6 inside, Still, Escape clears | the Manifest search | — | 2026-10-07 15:46 (built V25) · 2026-10-08 12:38 |
