---
kind: record
status: live
---

# Intake: season start dates in the Season identity editor (Session 5)

Recorded 2026-10-21 11:26 EDT by Session 4's lead. Harkirat forwarded this ask from the Dioreo-Bot project in the project chat at 2026-10-21 11:24 EDT; the project coordinator relayed it with the instruction to record it as Session 5 scope, as with the permissions intake (`2026-10-19-portal-permissions-intake.md`), and not to build it now. It is order item 8 of the plan's §5d.

Checked 2026-10-21 11:26 EDT:

- `/Applications/Claude Code/Dioreo-Bot` is a second checkout of this repo (`HarkiratMangat/dioreo`) on `fix/command-refresh-polish` at `88edcf56`; its `core/ops/season.js` names `bpStart` / `rankStart` / `dmzStart` 11 times, and its `models/SeasonalData.js` declares all three live (lines 19–21) and under `draft` (lines 90–92).
- `origin/v3-pre-release` at `f5e50763` does not have them yet: its `applyFields` (`core/ops/season.js:38`) reads only title, end and endTBD.
- The portal's editor: `portal/ui/season.js` `handleIdentitySave` sends the identity edits as one `season.setTitlesDeadlines` op (or `season.setDraftTitlesDeadlines` for the draft); the Start fields ride in that same payload. Board 4 and Builder-2 draw no Start input; it takes the End input's look.

Not checked: the bot branch's tests, and whether Review's change text names the new fields (the write-up's Verify line asks for it).

## His forwarding message, verbatim (2026-10-21 11:24 EDT)

> From the Dioreo-Bot project (command-refresh): /season end now shows a progress bar per season, which needs each season's START date. The bot side adds bpStart / rankStart / dmzStart to SeasonalData (live and draft), and season.setTitlesDeadlines / setDraftTitlesDeadlines accept them in the same payload as the end dates (core/ops/season.js applyFields: a date string sets it, '' clears it).
>
> Ask: add a Start date input beside each season's End input in the portal's Season identity editor, sent as bpStart / rankStart / dmzStart. Blank sends nothing; clearing a filled one sends ''.
>
> Timing: the bot side is on fix/command-refresh-polish and is not on v3-pre-release yet. Build against these field names now; it works once both are merged. Prod already holds all three start dates.
>
> Full write-up: /Applications/Claude Code/Dioreo-Bot/local/project/proposals/2026-10-21-pins2-season-start-dates.md
>
> Verify: a start set in the portal makes that season's bar appear in /season end, and Review shows the start in the change.

## The write-up, verbatim (from the Dioreo-Bot checkout's local proposals folder, the path in his message above)

Written 2026-10-21 10:24 EDT by the command-refresh lead (Dioreo-Bot, branch `fix/command-refresh-polish`). The bot side is built; nothing in `portal/**` was touched.

## Why

Harkirat, 2026-10-21 10:14 EDT: a progress bar on all three seasons in `/season end` ("show the progress bar above the dates but below the title. and yes for all 3 season dates"). The bar needs each season's START date, which was never stored.

## What the bot side added

| Field | Where |
|---|---|
| `bpStart`, `rankStart`, `dmzStart` (Date) | `models/SeasonalData.js`, live and `draft.*` |
| `season.setTitlesDeadlines` / `season.setDraftTitlesDeadlines` | accept `bpStart` / `rankStart` / `dmzStart` in the payload (`applyFields` in `core/ops/season.js`): a date string or Date sets it, `''`/`null` clears it, an unreadable one is reported in `detail` as "Battle Pass start" |
| Promote Draft | copies the draft's starts to live, blank included |
| Restore snapshots | include the starts |

Discord's `/manage` box takes them as a range on each line: `Battle Pass, Aug 6 - Nov 17`.

## Timing

Written up for pins2 at 2026-10-21 11:21 EDT, on Harkirat's word ("yeah write it up and i'll give it to that project's coordinator", 2026-10-21 11:18 EDT). The bot side is on `fix/command-refresh-polish` and is **not on v3-pre-release yet**: it lands when that branch merges. Build against the field names now; it only works once both are merged. Prod already holds all three starts (written 2026-10-21 11:03 EDT).

## Asked of pins2

Add a **Start** date input beside each season's End input in the portal's Season identity editor, sent as `bpStart` / `rankStart` / `dmzStart` in the same op payload the End fields already ride in. Leaving it blank sends nothing (keeps the stored start); clearing a filled one sends `''`.

**Verify:** setting a start in the portal makes `/season end` show that season's bar; Review shows the start in the change.
