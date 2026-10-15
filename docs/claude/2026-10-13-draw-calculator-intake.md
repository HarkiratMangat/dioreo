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
| Round | ✅ closed 2026-10-13 22:57 EDT ("i don't think i need to go further"); build started |
| Round 2 | ✅ closed 2026-10-14 13:07 EDT ("thats it for my intake so far, work autonomous and correct these things"); build started |
| Batches | 3 |
| Classes | 9 |

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

### Batch 3 — 2026-10-13 22:57 EDT, verbatim · the Cost page, simplified and with its breakdown open (round closed)

**His screenshots:** `local/project/features/draw-calculator/intake-2026-10-13/07-cost-page.png` (the Cost page) · `08-cost-page-breakdown.png` (the same with Show Breakdown open)

> * oh... a reset aka "new calculation" button does exist... it's just not available until the 3rd screen.
> * instead of "your draws", rephrase to "Your selection" or something similar.
> * also how do i add another quanity of a draw type on this screen? such as if i want to add another mythic draw? OH... it's the "edit draw" button. Then why is that button at the bottom instead of in the "your draw" section? and why have the dropdown menu to select draw types when the other half of the funtionality isn't available until "edit draw" screen?
> * overall, improve visualization through finetuning design
> * honestly, overall things also just seem very cluttered and poorly organized/structured.
>
> i don't think i need to go further into the intake, these comments above kind of address the overall issues with the calc right now.
>
> invoke a thorough /workstyle:think-pass on the comments, attach them, ask uncomfortable challenging questions, figure out the out of box solutions, and work on these autonomously. no taking over my screen pls.

**His asks, by class** (logged 2026-10-13 22:57 EDT; the round is closed and the build starts from here):

| Class | His asks | The sweep it implies |
|---|---|---|
| **A · Prose → a walked guide** *(extended)* | "YOUR DRAWS" → "Your selection"; finer visual design | every heading on every page |
| **E · Start over** *(extended)* | New Calculation exists but only on the result page | one button, every page |
| **H · Where editing lives** | adding another of a draw on the result page is behind Edit Draws at the bottom, away from the selection; the result page's draw picker does half the job (types only) while the other half lives on Edit Draws | the result page's selection block, its picker, Edit Draws, the form: one place, one way, to change what is being priced |
| **I · Structure and clutter** (whole panel) | cluttered, poorly organised and structured; improve the visualisation | the order and grouping of every block on every page, the button rows, the breakdown's layout |

## Built — 2026-10-13 23:13 EDT (branch `feat/draw-calculator`, not pushed)

| Class | What changed |
|---|---|
| A | the form is two numbered steps; the picker is an instruction; the region and priority explanations moved to Help; the saved list is the loader alone; "Your Selection" heads the result |
| B | one name per draw (his renames), "N/10 Items", Title Case descriptions with "CP Total" and "+ N CP Upgrade", no repeated name; a test fails on any "… Draw" name |
| C | Draw Info off the nav row |
| D | ~~answered: checkboxes exist only in popups~~ → wrong (2026-10-13 23:59 EDT): his reference is the bot's own `/admin` channel select, which Discord draws with checkboxes; the draw picker is a string select, which showed none. Tested 2026-10-14 00:03 EDT: phone draws checkboxes on every multi-select (the calculator's too), desktop on none of ours. Client-side, nothing to change |
| E | New Calculation on every page with a line |
| F | 6 lines per page |
| G | each line's dropdown opens with Remove and Move Up; progress first in the label; tier emoji on every value; Remove with progress asks |
| H | Edit beside "Your Selection" opens the form as a view; the Edit Draws page and the result's picker are gone |
| I | the result's controls are one row (Set Balance · Save · Delete); the upgrade toggle moved to step 1 |

A second think-pass (his `/nudge`, 2026-10-13 23:13 EDT) changed five things in the first build: Set Balance back on the result, Edit as a view instead of un-submitting, a confirm on Remove when progress would go, the upgrade toggle into step 1, and progress first in each line's label.

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
| H | Cost page, Edit Draws, form | one place and one way to change what is priced |
| I | all | structure and clutter: order, grouping, rows, the breakdown |
| J | landing, region row, `/draw prices` | the selected region reads as the current state: green and disabled |
| K | landing, footer | saved calculations: where they live, how to open, delete and wipe them, the limit |
| L | landing headings and hints | wording: "Start a Calculation", the region heading removed, shorter hints |

## Round 2 — opened 2026-10-14 11:45 EDT

### Batch 4 — 2026-10-14 11:45 EDT, verbatim · the landing

> * when the cp region button is selected, make it green-disabled.
> * how do i clear/remove saved calculations?
> * "Pick one to reopen it." -> "Reopen a saved calculation." (also side note, what's the limit of how many can be saved and what if the user reaches the limit? is there a warning? is there a deletion system?  an override system? etc. Thoroughly sequential-think it and critique it, consider the edge cases/unasked angles)
>    * maybe we move the saved calcs to a button in the footer? with a modal that allows you to pick the saved one from a dropdown + also holds the controls to delete specific saved calcs or wipe them all?
> * "Your Selection" -> "Start a Calculation". "Pick every draw you are pricing out. You can add more later." -> "Pick all the draw types you want to calculate. You can add more later."
> * "Your Region & CP Balance" remove it. Also remove the divider above it.
> * "Set your CP region and the CP you already have. Not sure of your region? See Help." -> Set your CP region and current balance." leave as `-#` hint style text.

**Classes:** J (green-disabled region), K (saved calculations), L (wording).

**J:** reverses `1cd13c82`, where the selected button was made green but left clickable. The same button is in `/draw prices`, so the class covers both commands.

**K, what the code does today** (read 2026-10-14 11:47 EDT):

| Question | Today |
|---|---|
| Limit | none stored; the loader shows only the first 25 by name, so a 26th is unreachable while the placeholder still counts it |
| Warning at a limit | none |
| Delete one | only from a finished result's **Delete Calculation**, two clicks, named ones only |
| Named draft (New Calculation keeps the name) | opens on the form, which has no Delete: it must be calculated first |
| Unnamed | cannot be deleted; expires 30 days after it was **created**, even if edited yesterday |
| Wipe all | none |
| Duplicate names | allowed; two with one name look the same in the loader |
| Size | 25 saved plus lines measured past Discord's message cap on 2026-10-14; the form drops lines to fit |

**K, angles for the build:** moving the loader off the landing (his footer idea) also removes its weight from the size cap; a modal has one submit button, so open and delete cannot be two buttons in it; a cap of 25 matches one dropdown, and at the cap Save should refuse with a notice rather than evict a calculation he named; Wipe All needs a confirm; deleting the calculation the message shows must fall to the existing missing-calculation screen. Selects inside a modal are not used anywhere in this repo yet: probe on the dev bot before designing on them.

**L:** "Your Selection" also heads the result page beside **Edit**; whether that one changes too is open. Removing the region heading also removes "Not sure of your region? See Help."; Help keeps the explanation.

**His answers, 2026-10-14 11:52 EDT, verbatim:**

| Asked | His answer |
|---|---|
| "Start a Calculation" on the result page too? | "first screen for now. i havent looked at the result screen yet." |
| Green and disabled in `/draw prices` too? | "yes" |
| A Saved page inside the message instead of a popup | "oh basically like a surface switch? so you can dynamically switch the panel between \"saved\" settings and the calculator itself, instead of a pop-up? makes sense." Both versions are still shown as pictures before he picks |

**Batch 4, follow-up, 2026-10-14 11:53 EDT, verbatim (class K):**

> and you're right, they barely hold any info. the saved lists need more info to help easily understand what each saved calc even is.

Today each option is the name plus "N lines · region". Room Discord gives an option: a 100-character label, a 100-character description and one emoji. Candidates for the build: which draws (short names, ×2 for repeats), CP still needed, whether it was calculated or is a draft, and when it last changed.

### Batch 5 — 2026-10-14 11:54 EDT, verbatim · the draw picker, open, with three picked (shot 09)

> is this a discord limit? why do they get cutoff at the top even tho there's so much empty width?

**Class B (naming), extended:** the picked draws show as chips in the closed picker, and Discord's desktop client cuts each chip at a fixed width however wide the box is ("Legendary Weapon (Reactiv", "Legendary Weapon (Non-Re"). The chip width is drawn by the client; the bot sends only the option's label. Not probed: whether the phone cuts at the same length. The one lever is the label itself: put the word that tells two draws apart first ("Reactive Legendary Weapon"), so the cut takes the shared tail, not the difference.

**His answer, 2026-10-14 12:28 EDT:** rename to "Reactive / Non-Reactive Legendary Weapon"? "no leave it for now."

### Batch 6 — 2026-10-14 12:28 EDT, verbatim · the form with three lines, a line's dropdown, "+ Add more draws" open (shots 10–13)

> * on this screen, "Your Selection" as `##`, add a `###` under it: "set current attempts"
> * instead of the "X" being inline in the text itself, make it an emoji similar to how the legendary badge is an emoji. Also reword "Remove #1" to "Remove this Selection"
> * "Set how many Items you already have on each draw. Pick a draw again below to run two of it." -> "Set how many spins you've already performed on each draw. `0` means draw is unattempted."
> * change this dropdown's "x/x items" to "x/x spins"
> * also before the "xxxx cp left", also add the amount of CPs spent so far on each spin. such as 0/10: `0 CP Spent · 4,950 CP to Completion`
> * add a `##` above the "add more draws" dropdown: "Calculate multiple draws". And a hint line "Select more draw types or add more of the same type to calculate multiple at the same time".
> * reword "Add more draws (pick one again to run two)" -> "Add more draws to selection"
> * and slightly better phrase the desc of the items in the add more draws dropdown.
> * and honestly, idk how useful the "move up" item currently is. What even is the priority plan? and how does the order of the draw effect it? im lowkey considering removing that part of the calc but idk yet.

**Classes:** L (headings and hints), B (naming: spins), G (dropdown options: Remove as an emoji, CP spent), M (new: the priority order and Move Up).

**B, spins:** reverses batch 1's "x pulls → x Items" for the line dropdowns. Whether "spins" also replaces "Items" in the picker's "10 Items · …", the Cost page and Help is open; one name across the calculator is class B's own rule.

**L, headings:** on the empty landing the heading is "Start a Calculation" (batch 4); with lines it becomes `## Your Selection` over `### Set current attempts`. A `##` is larger than every heading on the form today, so the levels of the other headings get set in the same pass.

**G, CP spent:** each line's dropdown carries 11–13 options; a longer description on each adds to the message size that already limits lines to 5 a page. Measure at the build.

**M, what the Priority Plan does today** (read 2026-10-14 12:28 EDT): the result lists the lines in their order, each with its own cost and a running total. Nothing else uses the order: the CP needed, the purchase advice and the balance check are the same in any order, and the plan never marks where the balance runs out. So **Move Up changes only the running-total column.** Two directions for the build: drop the order, Move Up and the Priority Plan; or keep them and make the plan say which lines the balance already covers and where it runs short.

**His answers, 2026-10-14 13:07 EDT, verbatim:**

| Asked | His answer |
|---|---|
| "Spins" everywhere, or only in each draw's dropdown? | "when generally refering to them, it's \"items\", when referring to a specific count/attempts then \"spins\"" |
| Remove the order and Move Up, or show what the balance covers? | "let's remove it for now. the \"your balance covers #1 and #2\" feels more like a future update to the calc and it's ability." |

### Batch 7 — 2026-10-14 13:07 EDT, verbatim · the result page and its breakdown (shots 14–15, round closed)

> * can we better implement the saved calc name into the title? Maybe put it in a 2nd line? "> ### Viewing Saved: `the name`"?
> * why are the cp region buttons gone from this screen? and the upgrade yes/no button.
> * the "Balance: 20 CP :BlueDash_BD: Region: 10 CP" line is also  redundant now that the balance is included inside the balance button. and the region is a toggle.
> * overall, give the calc and breakdowns some more breathing room. refine things. refine the experience and display of info/buttons.
>
> thats it for my intake so far, work autonomous and correct these things. bumping you up to -high again.

**Classes:** N (new: the result page carries its own controls: region, upgrade, balance; nothing repeated as text), I (structure and breathing room, extended), L (the saved name in the title).

**M, decided:** the order, Move Up and the Priority Plan are removed. A plan that shows which lines the balance covers is filed as a future idea.

**B, decided:** "Items" when speaking of a draw in general ("10 Items · 5,810 CP Total"); "Spins" for a count of attempts ("3/10 Spins").

## Built, round 2 — 2026-10-14 13:19 EDT (branch `feat/draw-calculator`, not pushed)

| Class | Built |
|---|---|
| J | current region green and disabled, in the calculator and `/draw prices` |
| K | **Saved (N)** in the nav opens a Saved view: reopen (each option shows CP needed, region, draws, Draft), delete several with a confirm, Delete All in two clicks, ◀ Back; 25 kept at most, Save refuses at the cap |
| L | "Start a Calculation" with his hint on the empty form; region heading and its divider removed; his region hint; "Viewing Saved: `name`" under the title |
| B | "Spins" for counts, "Items" for what a draw holds |
| G | Remove this Selection with a ✖️ emoji; each value's description "N CP Spent · N CP to Completion" |
| L (batch 6) | "## Your Selection / ### Set Current Attempts" and his hint; "## Calculate Multiple Draws" with his hint; "Add more draws to selection"; add-picker descriptions "In Your Selection ×N · Pick to Add Another" |
| M | Move Up, the order and the Priority Plan removed; "Cost Per Draw" in the breakdown; the balance-coverage plan filed as a future idea |
| N | the result carries the region row and the upgrade toggle; the Balance/Region text line removed; "Still to Buy" only with a balance |
| I | spacers between blocks; the breakdown's package lines say each figure once |

**My additions, his to reverse:** only the chosen value of a line's dropdown keeps "#N · … · name" (the others read "3/10 Spins"), which pays for the longer spend text and keeps five lines a page · the result's headings became `##` to match the form's · the delete list shows each one's draw count and last-changed date · the Saved view gives up detail in steps when 25 long names would pass Discord's size cap.

### Batch 8 — 2026-10-14 16:47 EDT, verbatim · round 2 on the dev bot (shots 16–21); a direct work order, built the same hour

> * i clicked "new calc", so why is it still saying "viewing saved: test"? Also for the "viewing saved" line, can we use the same style as the season title we use normally?
> * can we move "calculate" down to it's own action row, with a divider above it. Move "New calculation" and "saved" into that same row.
> * move "upgrade" button beside the Set balance button.
> * also replace the X emoji in the dropdown with `<:Cross:1560019185747099758>`(prod bot emoji id) `<:Cross:1560019354446463087>`(dev bot emoji id), i uploaded them but idk which one you need so here's both IDs
> * add this emoji to the "Calculate" button: `<a:Sparkles:1560023184873488525>` (prod),  `<a:Sparkles:1560022548387856534>` (dev)
> * "Calculate Multiple Draws" should be `###`. also reword to "add more draws"
> * "Set Current Attempts" -> "adjust partial completion".
> * "your selection" should have a plural "s" if there are 2 or more draws selected.
> * rephrase "in your selection 1x" to "1x in your selection" (side note, are you able to make these desc characters bold? if yes, please make the "1x" bold.
> * and a `·` between `7,220 CP Total` `+ 11,970 CP Upgrade` doesn't make sense since the `+` is already there.
> * remove the "rename" button from the calc and implement it into the "saved" panel instead. also if viewing a saved calc and then the "saved" button is tapped, it show should a section at the top of it with options to edit that saved option such as renaming it, deleting it, etc. Remove the "delete calc" button from the calc result panel as well.
> * also selecting a "saved" calc to view should open it to the result page, not take you through the full wizard process. Otherwise it's not different than a fresh calc.
> * move "CP needed" into a `###` heading. and better organize that simplified view of that section.
> * and no point stating "Cheapest" when no other option is being presented. It only makes sense in the full breakdown view.
> * also better structure that section that mentions the cost, the packages, the left over CP. "Class, not instance".

**Built 2026-10-14 16:54 EDT:**

| Ask | Built |
|---|---|
| "Viewing saved" after New Calculation | the cause: New Calculation emptied the saved calculation in place and kept its name. It now starts a new unnamed calculation and leaves the saved one untouched |
| Season-title style | `utils/titleBlock.js`'s caption, the same as the Season Calendar's |
| Calculate row | its own row under a divider: Calculate · New Calculation · Saved; the form's nav keeps Draw Prices · Help |
| Upgrade | beside Set Balance, on the form and the result |
| Emojis | Cross and Sparkles added to `utils/emojiMap.js` with the prod ids; the dev bot re-points to its own copies by name |
| Headings | "### Add More Draws", "Adjust Partial Completion", "Your Selections" from two draws |
| Add-more descriptions | "1× In Your Selection · Pick to Add Another"; the "·" before "+ … CP Upgrade" removed. **Bold is not possible:** an option description is plain text in Discord |
| Rename / Delete | gone from the result; the Saved view opens with a "This Calculation" section: Rename and Delete for a saved one, Save for an unsaved one |
| Opening a saved one | lands on its result; one saved before it was ever calculated is calculated on open |
| Cost section | "### CP Needed: `N CP`", a quiet "still to buy after your balance" line; every package option has one shape (quoted price and packs, one line of bought and left over); "Cheapest"/"Stock Up" labels only when two options show |

### Batch 9 — 2026-10-14 17:25 EDT, verbatim · a correction to batch 8's New Calculation fix

> no, a saved calc should remain in it's saved state. so that means a user needs to press "save" and select that previous saved result to override it. otherwise selecting that saved calc again should bring you to it's result, not a empty state.

> also update Save button's emoji to <a:SaveStar:1560041207177023519>(prod), <a:SaveStar:1560041353185075250> (dev)

**Built 2026-10-14 17:32 EDT:** a saved calculation is a snapshot. The first real change to one (spins, draws, region, upgrade, balance, 2X) opens an unnamed working copy that records where it came from (`sourceId`); the title then reads "Edited from Saved: name". Save opens a Save step: Save as New, or pick a saved calculation and confirm saving over it, after which the working copy is removed and the saved one's result shows. Reopening a saved one always lands on its result. SaveStar is on both Save buttons. The "test" calculation emptied by the old New Calculation before this fix stays empty; it can be deleted in Saved.

### Batch 10 — 2026-10-14 17:58 EDT, verbatim · landing, form and result (shots 22–24)

> * move "saved" to the left of "calculate" and reword it to "View Saved", no counter.
> * move "new calc" button to the front of the row. saved in middle. calculate last.
> * add some space above the "add more draws" heading?
> * add a `###` heading above the "set region..." hint line, "Tweak Calculation" or similarly worded
> * reword "edit" to "edit selection"
> * reword "show breakdown" to "full breakdown"
> * the results screen also moved the "saved" / "new calc" buttons outside. leave them in their current row. just replace "calculate" with "Save result" and include the star emoji.

**Built 2026-10-14 18:02 EDT:** the last row is New Calculation · View Saved · Calculate on the form and New Calculation · View Saved · Save Result (SaveStar, opens the Save step) on the result, so both nav rows are Draw Prices · Help; a spacer above "### Add More Draws"; "### Tweak Calculation" over the region hint on both screens (its margin replaces the form's spacer there, which kept five lines a page); "Edit Selection"; "Full Breakdown".

### Batch 11 — 2026-10-14 18:22 EDT, verbatim

> nah, leave it as is. but this does remind me, on the results page, can we have an "export" button which outputs the result into a simple copy-able markdown for the user to share?

**Built 2026-10-14 18:24 EDT:** the spacer question is closed as he left it. **Export** sits in the result's last row (New Calculation · View Saved · Export · Save Result) and answers privately with the result as markdown in a code block: each draw's spins and cost, CP needed, what the balance leaves, and the recommended package; no custom emoji, so it reads the same pasted anywhere.

### Batch 12 — 2026-10-14 18:25 EDT, verbatim

> * restart the bot without --watch. and also SIGNIFICANTLY improve the help panel, omg it's just ALL prose.

**Built 2026-10-14 18:27 EDT:** Help is six sections under dividers: How It Works (four numbered steps), Words You'll See, Buttons, Saving, Shortcut; every entry a one-line "term · meaning". The dev bot was already running without `--watch` (one instance); restarted on the new code anyway.

### Batch 13 — 2026-10-14 18:31 EDT, verbatim

> add some emojis to the help sections. and the "words you'll see" section is useless. similarly with the button sections. rework those to hold and visually show better info. overall, /workstyle:think-pass and /design:design-critique your rework of it and rework it properly and nicely

> also add the same emoji as the "show everyone" button to "Export" and remove "show everyone" component

**Built 2026-10-14 18:38 EDT:** Help now carries what the screen cannot show: 🧭 How It Works (4 steps), 📈 How Prices Work (the open draw's real spin-by-spin price chain at the open region, with what the last three spins cost of the total), 🗺️ Find Your Region (region icons; which draws' first spin IS the region), 🧾 Reading Your Result (the package rule, left over, Stock Up, 2X), ⭐ Saving (saved stays saved, save over, limits), ⚡ Shortcut. The think-pass falsified the old line "region = first spin on any draw": Mythic Character and Pick Your Reward Card start higher. The critique cut the two result lines the screen already labels and promoted the region rule out of small text. Export carries the Show Everyone icon; the calculator no longer sends a Show Everyone row, which frees 2 components (`SETUP_CONTAINER_BUDGET` 37).

### Click-test — 2026-10-14 18:59 EDT, on the dev bot in his Discord app, in the background (his "go clicktest. use my computer but use it in the background")

| Path | Result |
|---|---|
| Full Breakdown / Simplify | works; Cost Per Draw and both package options show |
| Export | private markdown reply, renders and copies |
| Help | the open draw's price chain at the open region; every section renders |
| View Saved → This Calculation → Save → Save step | works |
| Save over "test" → confirm | works; lands on its result with "Saved over" |
| Region change on a saved result | opens a copy titled "Edited from Saved: test"; the saved one stays at 10 CP |
| Reopen "test" from Saved | its result, unchanged |
| Edit Selection → spins → Remove with progress → Keep It → Calculate | works |
| New Calculation two-click | works |

**Fixed:** New Calculation on an edited copy kept "Edited from Saved" on the empty form (it now starts fresh and drops the copy); Stock Up sat flush against Cheapest's last line (a blank line between them); "Keep it" → "Keep It". **Not clicked:** Save as New (a modal needs typing), Delete and Delete All (they would delete his "test"); both are covered by the handler simulation and the tests.

### Batch 14 — 2026-10-14 19:27 EDT, verbatim

> do it later.
>
> * add this emoji to the "edit selection" button. <a:EditCalc:1560069086531166209> (prod), <a:EditCalc:1560068687942123642> (dev).
> * side note, which emoji id do you even need? both or a specific one?
> * and for the export text, provide a more detailed breakdown. not the full breakdown but also not the simplified, somewhere inbetween.

**Built 2026-10-14 19:30 EDT:** EditCalc on Edit Selection (the prod id in `utils/emojiMap.js`; the dev bot re-points by name). The export now shows, per draw, spins, what is left, CP to finish and CP already spent, with the upgrade on its own line; then CP needed, what the balance leaves, each recommended pack with its price, and the Stock Up option. The delete click-test is filed in `docs/db-deferred-list.md` for later.


### Batch 15 — 2026-10-15 18:01 EDT, verbatim

> update these following emojis (prod bot ids provided):
>
> *  "calculate" button sparkles to <a:Sparkles:1560410369447563274>
> *  "full breakdown" button to <a:Expand:1560408706233933845>
> *  "simplify" button to <a:Collapse:1560408707685294120>
> *  "edit selections" button to <a:EditCalc:1560408533160296519>
> * 30cp to <a:30CP:1560408352641519656>
> * 20cp to <a:20CP:1560408353975443487>
> * 10cp to <a:10CP:1560408355380404344>

**Built 2026-10-15 18:03 EDT:** all seven prod ids in `utils/emojiMap.js`; the old `simplify` key is now `collapse` (its only user is the calculator's detail toggle). The three region icons are shared, so /draw prices' region switcher changes with the calculator's region select and Help chips. The dev app holds every new name once (read live), and the dev bot re-points them by name at boot.
