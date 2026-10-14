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
| Batches | 2 |
| Classes | 7 |

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

### Batch 2 — 2026-10-13 21:33 EDT, verbatim · the form with lines, a line's dropdown, "+ Add more draws"

**His screenshots:** `local/project/features/draw-calculator/intake-2026-10-13/04-setup-two-lines.png` (the form with #1 Mythic Weapon and #2 Reactive Legendary) · `05-line-dropdown-open.png` (#2's dropdown open, ending in Remove) · `06-add-more-open.png` ("+ Add more draws" open)

> * i want a "clear" or restart or reset or something similarly phrased/worded button to completely start the calc again. put it in the action row thats outside the embed.
> * why do the dropdowns paginate after 4? is it a components limit issue? can we paginate after 6?
> * make the "remove" line the first item in the dropdown list.
> * redesign/refine the dropdown list items to look better and be more visual than prose-reliant
> * and honestly similar comments from the prior screen. "class, not instance". improve the usability and ease.
>
> next screen...

**His asks, by class** (logged 2026-10-13 21:33 EDT; nothing built):

| Class | His asks | The sweep it implies |
|---|---|---|
| **A · Prose → a walked guide** *(batch 1, extended)* | "similar comments from the prior screen": this screen's hint ("Set how many pulls you have already done… Running a draw twice? Add it again below.") is the same problem | added to A's sweep: the form-with-lines hint, the Region hint here too |
| **B · How a draw is named and described** *(batch 1, extended)* | the same, on this screen: each line reads "#2 Reactive Legendary · 7 pulls done" with "3,700 CP left on Legendary Weapon Draw (Reactive)"; "+ Add more draws" repeats the full names and says "pulls" ("You have 1 · adds a 2nd, at 0 pulls") | added to B's sweep: every line dropdown's labels and descriptions, every "+ Add more draws" description |
| **E · Start over** | a Clear / Restart / Reset button that starts the calculation again from nothing, in the nav row outside the panel | the result page's two-step "New Calculation" already does a version of this, and the form has none: one name, one behaviour, on every page. What it clears (lines, balance, region, the saved name) and whether it asks first |
| **F · Lines per page** | why 4? is it the component limit? can it be 6? | his question first: measure the form and Edit Draws at 6 lines, with and without the saved list, against Discord's 40, and show the numbers |
| **G · How a dropdown's options are designed** (every select) | Remove becomes the FIRST option of a line's dropdown; the options redesigned to look better and read visually, not as prose | every select in the calculator: a line's dropdown, the first-pick picker, "+ Add more draws", Load a saved calculation, the Cost page's picker. Where actions sit against values, what an option's emoji, label and description each carry |

## Ambiguities to settle at the build

*A reading of his words that could go two ways, with what would settle it, rather than a guess.*

- **"x Items" — how far it reaches** (B). The picker's "10 pulls" clearly becomes "10 Items". Whether a line's progress ("3 pulls done"), the `/draw calculator` slash option named `pulls`, and `/draw prices` follow it is not said. Settle at the build: list every "pull" a player reads and ask once.
- **"the draw types might be better in all caps?"** (B) is his question, not a decision. Settle with renders side by side; Discord shortens a chosen option's label in the closed picker at about 24 characters, so "LEGENDARY WEAPON (NON-REACTIVE)" needs measuring.
- **"Set your CP region and current balance"** (A) puts region and balance under one label, while Set Balance today sits in the Calculate row. Whether that means moving Set Balance beside the region buttons, or only rewording, is a layout question for the build, with renders.
- **The checkboxes** (D) are a question he asked, not an ask yet. Answered at the build by a test on the dev bot, with the result shown to him.
- **"Clear"** (E): whether it replaces the result page's "New Calculation" or sits beside it, whether it keeps the region and the saved name, and whether it asks first like New Calculation does. Settle with renders.
- **"Remove" first** (G): a closed dropdown shows the chosen option, and how Discord scrolls the open list (to the top, or to the chosen option) decides whether Remove first is seen before the progress values. Test on desktop and the phone at the build.
- **"can we paginate after 6?"** (F) is a question; answered with measured component counts before anything changes.

## All classes, one index

| Class | Screens | In one line |
|---|---|---|
| A | all (batches 1, 2) | prose replaced by a walked guide: short instructions, explanations moved to Help |
| B | all (batches 1, 2) | one naming system for draws: labels, descriptions, Items, CP, Title Case |
| C | nav row | Draw Info button removed |
| D | draw picker | checkboxes in the picker, if Discord can draw them |
| E | nav row, every page | one Clear / start-over button outside the panel |
| F | form, Edit Draws | lines per page: why 4, and whether 6 fits |
| G | every select | dropdown options: Remove first, visual over prose |
