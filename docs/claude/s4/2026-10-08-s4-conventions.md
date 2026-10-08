---
kind: record
status: live
---

# C1 conventions · the class rules (written 2026-10-08 13:03 EDT)

Derive every value from these before asking Harkirat anything, and cite the rule number. A ruling of his that sets or changes a rule edits this file in the same write; the dated history stays in `docs/claude/s4/2026-10-07-s4-button-system.md`.

## The rule that answers most questions
- **C0 · A control follows its size row.** Its height, click area, corner, icon, words, padding, icon → words gap, neighbour gap and the buttons nested in it all come from its size (C1–C3). A field is a control (44 = L). (His 2026-10-08 12:45 and 13:00 EDT: "what size text/icon do 44px buttons use?" · "how much outer gap does a 32px button have inside a 44px rail? 6".)

## Sizes
- **C1 · Size table** (2026-10-07): L 44 · click 44 · corner 11 · icon 16 · words 13·600 · padding 14 · icon→words 10 · neighbours any | M 32 · 44 · 8 · 14 · 11·600 · 10 · 6 · 14 | S 24 · 32 · 6 · 12 · 11·600 · 10 · 6 · 10 | XS 20 · 24 · 5 · 12 · 11·600 · 6 · 6 · 6.
- **C2 · Corner = height × 0.25** (2026-10-05 12:07 EDT): 11 · 8 · 6 · 5.
- **C3 · Nesting:** a button inside a container is one size down with half the step around it: L→M 6 · M→S 4 · S→XS 2 (rails 2026-10-07 12:26 EDT; generalised 2026-10-08 13:00 EDT). Covers rails, in-field buttons (× and ⌄), the chip's ×.
- **C4 · Pills** take the size table with round ends; filter chips keep their click area to the chip, 6 apart (2026-10-07 22:07 EDT).

## Type, icons, gaps
- **C5 · Text scale** xs 9 · s 11 · m 13 · l 15 · xl 21 · xxl 30 · giant 44 · jumbo 58; off-scale sizes moved by his calls (17→15, 19/20/22→21). A control's words follow C1.
- **C6 · Icons** follow C1 (16 · 14 · 12 · 12), size = the Lucide box; a gap to an icon measures to its ink. A dot counts as an icon in names (2026-10-08 11:04 EDT) but is drawn 8 in chips (2026-10-07 01:12 EDT).
- **C7 · Gaps** 6 · 10 · 14 · 20 · 26 · 32.
- **C8 · Line height and letter spacing are mine** (shown as measurements on the Text section, never asked).

## Look and behaviour
- **C9 · Styles** wash · tint · fill · paint (paint's definition parked). **Flags:** `--ghost` no fill, tint and paint only · `--borderless` no outline ever, fill no glow · `--quiet` bare until hover · `--reveal-right/-left`.
- **C10 · Still** hover changes colour only · press drops 1px and 98.5% · fill keeps its glow · outlines 1px · disabled 40%.

## Names
- **C11 · Grammar** `type-size-shape.style-value--flag`: `-` picks one value (a colour or a data source), `--` adds a part that is there or not. A colour value goes on the element that takes the colour (a realm token on the in-field buttons, measured 2026-10-08 12:38 EDT).

## The spec board
- **C12 · A decided element is drawn to these rules;** what Builder-2 still draws wrong goes in `local/pins2/s4/builder-2/spec-img/board-changes.json` (2026-10-08 12:35 EDT).

## Fields
- **C13 · One look for every field** (his 2026-10-08 15:27 EDT: the search.filter's "light-up when hovered is not the same as the other fields … hovering the `x` icon or the 'x matches' doesn't active the field's own hover state … the inner dark color is also different"): fill `#04070A 52% on sunk`, a 1px outline `ink 12%` that turns `ink 24%` when the pointer is anywhere over the field (its in-field buttons and count box included), focus a 2px `staged` ring inside with a 5px `staged 16%` halo. Its leading content sits 14 from the edge (C1 L padding), words 10 after an icon. Added 2026-10-08 16:59 EDT.

## What is genuinely his to decide
- A new design no rule covers · two rules that conflict · an exception to a rule · a name the grammar leaves truly ambiguous · anything he says he wants to own. Everything else: derive, apply, cite.
