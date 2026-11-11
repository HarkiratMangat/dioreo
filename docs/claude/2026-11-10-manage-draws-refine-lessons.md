---
kind: record
status: frozen
---

# /manage draws refinement: what was hidden, how it was found, and the method for the next subcommands

*Frozen record, written 2026-11-10 21:12 EST at the end of the `feat/manage-draws-refine` session (v3.19.0). Harkirat asked for it as "a lesson for the following /manage subcommand threads to build upon". Read it before refining `calendar`, `patch notes`, `season`, `announcements` or `gunsmith`.*

## The short version, for the next thread

1. **The panel is not the thing to review; the saver behind each button is.** Every /manage panel since v3.13 is a navigation shell over the old savers. Each saver still answers the old way (its own follow-up message, its own pop-up, `<t:D>` dates, a re-upload). Most of what was wrong with the draws panel lived in those seams, not in the panel.
2. **Review with real data.** Dev's 12 draws hid almost every limit and gap. Mirroring prod's 21 draws into dev (backed up first, restored after) surfaced long titles, placeholders, missing ends and the 4,000-character guide.
3. **Measure every view against Discord's limits in code**, at 0, 1, 2 and many items, on every list, page and origin. A script finds in seconds what clicking finds in an hour.
4. **Click the undo and failure paths, not just the happy path.** Revert, Try Again, Cancel and the refusal messages held five of the bugs. A save that works and a Revert that lands nowhere is a broken feature.
5. **Ask what undo produces.** Reverting a delete re-adds the row under a NEW id (`core/ops/draws.js` mints one on every add). Anything that tries to "land back on the thing" after a revert must find it another way (by title, from the change rows).
6. **Ask who else can press the button.** An admin with Draws access but no Calendar access could open End Date and then be refused at submit, because `commitSet` checks every op and refuses the whole set. Check the tier of every op a button writes, before the button is drawn.
7. **Ask what state this path can create that another path refuses.** Move refused a title the other list already held; Add happily created exactly that state.
8. **Look at every screenshot the way he will, before sending it.** Add the numbers up, look for the same fact twice, read every label at N = 1.
9. **Build every "tested" claim from the transcript's click log, item by item.** The first report said "all 28 click-tested". It was false, and clicking the unclicked paths found four bugs.
10. **Round-trip every format.** Export then paste back. Two serializer bugs (`, null`, Legacy saved as Legendary) only show on the way back in.

## What changed (v3.19.0)

| Area | Before | After |
|---|---|---|
| Saving | Every save posted a second message | Edit, Add, Paste, Edit N, End Date and Purge answer on the panel itself, with Revert |
| End dates | Calendar's 5-field editor | Its own pop-up: on a date, with the season, or not announced yet (TBD); for one draw or many |
| The card | Breadcrumb named the section; origin lost after an action; end date shown twice | Keeps where it was opened from through every action; shows only the date the /draws block lacks |
| Needs a Look | A list | A fix button per draw; lands back on the list |
| Search | Titles only, a select menu | Titles and item names; a paged list you can open or select |
| Select | Picks always widened | Like /draws' filter: widen within a group, narrow across groups |
| Delete / Purge | No way to remove the calendar row; Purge had no counts | "+ Calendar Row(s)" (only for admins with Calendar access); counted buttons and Ended Only |
| Quick Add | Opened a second message | Opens in place; shows the end a draw already has; saves draws without their ends for an admin without Calendar access |
| Admin dates | `<t:D>`: Nov 8 00:00 UTC read as "November 7" in Toronto | `<t:f>`: date and time, everywhere `utils/managePanels.js` stamps |
| /draws single draw | Picture under the title | Picture on top (his ask) |

## The hidden defects, and how each was found

| Defect | How it was found | Why earlier sessions missed it |
|---|---|---|
| Editing a draw on the placeholder uploaded the placeholder as the draw's real picture and indexed it, so Needs a Look stopped flagging it | Tracing what Edit's Save calls: `resolveThumbnail`'s "a link was given" branch uploaded any link, and the Edit box is pre-filled with the stored link | Every test used a real picture; nobody edited a placeholder draw |
| Every Edit re-uploaded the draw's unchanged picture | Same trace: the pre-filled link always counted as "a new link" | The upload succeeds, so nothing looks wrong |
| An Edit that changed nothing still wrote a change row | Submitting the Edit pop-up unchanged during the survey click test | Nobody submits an unchanged form on purpose, so nobody looked |
| The Edit box saved Legacy items as Legendary | Round-tripping: the box writes a tier letter with `charAt(0)`, and both start with "l" | Legacy items are rare |
| Export wrote `, null` for a draw with no picture, which the parser then read as the date | Exporting the selection and reading the file | Export was tested on draws with pictures |
| The guide's paste skeleton put the link before the dates | Comparing the guide's text with what the parser takes off the end of a line | The guide was prose, never parsed |
| A failed panel Edit had no Try Again | Reading `retry.js`: no spec for the panel's own pop-up ids | The old /manage Edit had one |
| The draws guide reached 4,245 characters, Discord refused it, and the panel hung on "thinking…" | Clicking Guide after my own copy change (my bug, caught by the click test); now a test renders every guide | Text length is invisible in the source |
| Reverting a Move or a Delete landed on a list, or on an empty Select list with no note | Clicking Revert after a Move, then after Delete N | Revert was never clicked after the build; the re-minted id only shows then |
| End Date and "+ Calendar Row" were offered to admins without Calendar access, then refused | Reading `commitSet`: it calls `checkOps` on every op, so a calendar op inside a draws save needs the Calendar tier | Every click test runs as the owner, who passes every check |
| Quick Add refused a whole draft for those admins | Same reading: Quick Add puts calendar rows in the same commit (the #249 class, fixed for Add and Edit long ago) | Same: owner-only testing |
| Add New / Add Returning took a title the other list held, so /draws listed it twice and both shared one /calendar row | Click-testing Move's duplicate refusal: making the duplicate needed Add, and Add allowed it | Move's guard was tested in code, never by building the state it guards against |
| Home read "18 active · 4 leaving soon · 3 ended" for 21 draws | Looking at the screenshot and adding the numbers up (Leaving Soon is inside Active) | The comment in the code said so; the screen didn't |
| The card showed the end date twice | Looking at the screenshot: /draws' own block shows it, and the card's line repeated it | Two pieces of code, each correct alone |
| "Select These 1", "Select All 1", "Set on 1 draw (their /calendar rows)" | Reading every label with one item | Tests used several items |
| Quick Add's Revert All left a note with no way back; Try Again titled the panel's Edit "Edit Lucky Draw" | Clicking them | Never clicked |

## How the discovering actually happened

- **A survey script before any design.** The survey script (kept on this Mac in the draws feature folder's probes folder, gitignored, with the mirror script below) printed every draw with its state, row, picture and gaps, and measured every view against the limits. It turned "review the panel" into a list of facts to check.
- **Prod's data in dev.** The mirror script copied prod's draws and their calendar rows into the dev database, after a backup, with a `RESTORE=` mode that put dev's own copy back at the end. The dev database is shared with pins2, so the write was announced and reverted.
- **Reading one level down.** For every button, I opened the function its submit calls and read what it answers with. That is where "two messages, calendar's editor, `<t:D>`, re-upload" came from: one cause under many findings.
- **Think-passes that left the task's frame.** The useful questions were not "is this panel nice" but "what does undo produce", "who else can press this", "what state can this create", "what does this look like with one item".
- **His "are you sure?"** I had reported from a compaction summary. Extracting every click from the transcript showed which paths had never been clicked after the build. Every bug in the last three rows of the table above came from clicking those.

## What I got wrong

- The first report claimed every item was click-tested. It wasn't. Lesson: the report's tested claims come from the click log, never from a summary.
- I made the draws guide too long and Discord refused it. Lesson: any text change gets the limits test.
- A timestamp sweep stamped this session's time onto older comments; I restored them from `origin/main`.
- Two heredocs once ran into each other and nothing committed. Lesson: one heredoc per command, the gate chained with `&&`.

## Practical notes for click-testing /manage

- Test in the Dioreo Admin (Dev) DM. News triage posts into #testing-spam on the dev bot.
- The slash picker lists prod's **Dioreo Admin** next to **Dioreo Admin (Dev)**. Pick the Dev one every time.
- Clicking by a `find` ref sometimes doesn't register in Discord; clicking by coordinates does.
- The Chrome window would not shrink below about 845px, so a phone-width view was not checked.
- The dev bot's Cloudinary writes are blocked, and most dev draw pictures (`temp_draws/...`) answer 404. That is dev data, not a bug.
- `ManageSelection` tokens last 24 hours. `commitSet` refuses a whole set if any op fails its tier check.

## Still open

- **Phone width**: not checked (see above).
- **Prod Dioreo Admin's emojis** (PasteImport, Guide, News): missing on the dev admin app until its start-up sync; prod's hourly sync should do the same, unverified.
- **Prod data**: Herrscher of Thunder's items are stored as "Herrscher Of Thunder", so an Edit N would rewrite them.
- **An idea**: Needs a Look can't tell a picture link that no longer loads.

## A checklist for the next subcommand (calendar is next)

1. Read this file, the subcommand's section of `.claude/rules/manage-panel.md`, and the savers its buttons call.
2. Survey prod's data for that page (read-only) and mirror it into dev with a backup and a restore.
3. Write a limits test that renders every view at 0, 1, 2 and many items.
4. For every button: what does it write, which ops, which tiers? Who can press it without them?
5. For every save: where does the answer appear, what does Revert land on, what does Try Again reopen?
6. For every guard: which other path can create the state it refuses?
7. Round-trip the page's export and paste formats.
8. Click every path after the build, including Revert, Try Again, Cancel and the refusals; keep the click log.
9. Look at every screenshot as he will before sending it.
10. Report tested claims from the click log, and name what was not clicked.
