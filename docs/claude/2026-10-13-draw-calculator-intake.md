---
kind: record
status: live
---

# `/draw calculator` intake round — opened 2026-10-13 20:51 EDT

> 📷 **Screenshots stay on this Mac only**, in `local/project/features/draw-calculator/intake-2026-10-13/`, numbered in the order he sends them. A fresh clone does not have them, by his standing call ("kit can be tracked but leave screenshots local", 2026-09-29).

*His review of the calculator on the dev bot, screen by screen, branch `feat/draw-calculator`. **Log only until he says the round is over:** nothing is built or changed before then. Shaped like the Board 4 rounds (`docs/pins2/handoffs/2026-09-21-board4-intake.md`): each batch is his words verbatim and dated, with the screenshots it came with; then his asks grouped by **class**, a class being the one underlying problem with every screen it touches and the sweep it implies before building, never one row per sentence. Classes are lettered across the whole round, and a later batch adds to an earlier class rather than opening a duplicate.*

## Status

| | |
|---|---|
| Round | ⏳ open, log only |
| Batches | 1 |
| Classes | 4 |

## Batches

### Batch 1 — 2026-10-13 21:13 EDT, verbatim · the empty setup form and its draw picker

**His screenshots:** `local/project/features/draw-calculator/intake-2026-10-13/01-setup-empty.png` (the empty form) · `02-draw-picker-open.png` (the draw picker opened) · `03-discord-checkbox-select.png` (a Discord multi-select that shows a checkbox per option, his reference)

> * let's remove "draw info" button.
> * too much prose reliance to convey the info.
> * rephrase dropdown menu placeholder to "Select draw types to calculate" or something similar. instead of making it a question, make navigation/usability almost like a walked-guide
> * "Region · the CP price of your first pull on a draw" hint line, rephrase it to something along the lines of "Set your CP region and current balance" or something similar. The "the CP price of your first pull on a draw" explanation for what a "Region" is belongs in the Help panel, not as bloat on the main calc.
> * similarly, rephrase and trim the above lines of prose as well. Easy usability and navigation depends on good visualization where anyone can easily utilize the feature without having to first rely on lines of prose to understand it's fundamentals.
> * rephrase the dropdown list lines as well. such as for mythic weapon, remove the "mythic weapon draw" out of desc, similarly with "mythic character + legendary weapon draw". Reactive Legendary -> reword to "Legendary Weapon (Reactive)"; similarly for non-reactive; and remove the bloaded "legendary weapon drawn (reactive), etc out of the desc. and so on...
> * instead of "x pulls", let's reword it to "x Items"
> * for the "+ xxx Upgrade", include "CP" behind the number. and upper case "total" so it matches the uppercase "Upgrade". the desc should basically be title case. Whereas the draw types might be better in all caps?
> * Also, can't we add that empty checkbox in this dropdown as well? Or is that not possible in the v2 components version?
>
> that's it for this screen.

**His asks, by class** (logged 2026-10-13 21:14 EDT; nothing built):

| Class | His asks | The sweep it implies |
|---|---|---|
| **A · Prose → a walked guide** (the whole calculator) | too much prose conveys the info; the intro lines trimmed and rephrased; the picker placeholder an instruction, not a question ("Select draw types to calculate"); the Region hint becomes a short instruction ("Set your CP region and current balance"); what a region *is* moves to Help | every line a player reads on every calculator screen: the form, the Cost page, Edit Draws, notices and confirms, every placeholder and option description. Each one either guides the next step or moves to Help. Help gains what leaves the panel |
| **B · How a draw is named and described** (one naming system) | option labels renamed ("Legendary Weapon (Reactive)", "(Non-Reactive)", "and so on"); the description drops the repeated full draw name; "x pulls" → "x Items"; "+ N CP Upgrade"; "Total" capitalised; descriptions in Title Case; draw names possibly ALL CAPS | every place a draw is named or counted: the first-pick picker, "+ Add more draws", each line's dropdown ("#1 … · 3 pulls done"), the Cost page's YOUR DRAWS and breakdown, Edit Draws' headings, Help, the slash shortcut's notices, `SHORT_NAME` |
| **C · The nav row** | remove the Draw Info button | what Draw Info shows that nothing else does, and where that goes (Help or Draw Prices); the nav row on every page; Help text that mentions Draw Info |
| **D · The picker's checkboxes** | can the draw picker show an empty checkbox per option, as in `03`? | a question to answer by testing: whether a Components V2 string select can draw them, on desktop and on the phone |

## Ambiguities to settle at the build

*A reading of his words that could go two ways, with what would settle it, rather than a guess.*

- **"x Items" — how far it reaches** (B). The picker's "10 pulls" clearly becomes "10 Items". Whether a line's progress ("3 pulls done"), the `/draw calculator` slash option named `pulls`, and `/draw prices` follow it is not said. Settle at the build: list every "pull" a player reads and ask once.
- **"the draw types might be better in all caps?"** (B) is his question, not a decision. Settle with renders side by side; Discord shortens a chosen option's label in the closed picker at about 24 characters, so "LEGENDARY WEAPON (NON-REACTIVE)" needs measuring.
- **"Set your CP region and current balance"** (A) puts region and balance under one label, while Set Balance today sits in the Calculate row. Whether that means moving Set Balance beside the region buttons, or only rewording, is a layout question for the build, with renders.
- **The checkboxes** (D) are a question he asked, not an ask yet. Answered at the build by a test on the dev bot, with the result shown to him.

## All classes, one index

| Class | Screens | In one line |
|---|---|---|
| A | all | prose replaced by a walked guide: short instructions, explanations moved to Help |
| B | all | one naming system for draws: labels, descriptions, Items, CP, Title Case |
| C | nav row | Draw Info button removed |
| D | draw picker | checkboxes in the picker, if Discord can draw them |
