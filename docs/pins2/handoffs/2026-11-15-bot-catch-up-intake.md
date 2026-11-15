---
kind: record
status: live
---

# Intake: the Dioreo-Bot catch-up since v3 (Session 4's drawings, Session 5's port)

Recorded 2026-11-15 01:38 EST by Session 4's lead. The Dioreo-Bot project wrote two files for pins2 on 2026-11-14 (a short note at 23:48 EST and the full catch-up at 21:27 EST, each bot proposal word for word); Harkirat forwarded them when he resumed pins2 at 2026-11-15 00:07 EST ("let's continue the portal work now"). Copies are on this Mac only, in `local/pins2/s4/intake/2026-11-14-bot-catch-up/`, and the originals in the Dioreo-Bot checkout's `local/project/proposals/`. Order item 10 of the plan's §5d is this record.

**Who decided what.** Harkirat handed every judgement in this record to Session 4 in the thread on 2026-11-15: "just work autonomously. make the judgement calls. you don't need me." (00:39 EST), "the fable model also makes the judgement calls and decisions. i want it to finish everything without me, no checkpoints/breaks." (00:42 EST, relayed), and "nope, no need for my approval for those either. work autonomously." (00:53 EST, of the rebase and the push). So each routing and design below is Session 4's call, made under that word and marked **(Claude)**; none is his ruling.

## Checked against `origin/main` (`bbd78362`, v3.21.1) at 2026-11-15 01:00 EST

- `utils/drawTypes.js`: 14 priced draw types plus Unsure / Unknown and two free types (Secret Cache, Event; his 2026-11-04 call), each with a bulk `type:` code. The catch-up said 14; it is 17 choices.
- `models/Loadout.js`: `credit` `{ show: user | name | link | anonymous | none, prefix: submitted | credit | buildby, discordId, name, url }`, `variants` (label, attachments, attachmentSlots, shareCode, imageKey, imageVersion, sourceHash), `showLabelOnLists`, `noAttachments`, `imageVersion`, `isAss`, `rankModes`, all as the catch-up says.
- `utils/loadoutCredit.js` `creditLine`: "Submitted by @user", "Credit: **name**", "Build by [name](link)", "By *anonymous*", or nothing (a submitted build with no credit still reads "By *anonymous*"). `normalizeCredit`: a name 1–32 characters on one line with no `< > [ ]`, a link https only, 200 characters at most.
- `utils/loadoutOptions.js`: `MAX_OPTIONS` 6, option A is the build, `optionTag` `1`, `1b`, `1c`; `listProblem` refuses a code twice in a build. `utils/loadoutRender.js` `optionCards`: a build with options shows one compact section per option ("**Option A** · code", its numbered list, its picture beside it) and no gallery.
- `utils/catalogue.js` `unknownNames` (an empty catalogue warns about nothing) and `handlers/manage/loadouts.js`: a save stops on **two** findings before it writes, a code that looks cut off (`adminParser.js` `gunsmithCodeProblem`, his 2026-10-28) and names the catalogue does not know (his 2026-10-19), each with Save anyway and Back to edit. The catch-up named only the second. A third stop, the picture warning (an MP edit whose attachments and code changed with no new picture: Keep the picture, Save without a picture, Upload a new picture), is filed for Session 5 below.
- `utils/loadoutRender.js` `CLASS_ORDER` AR, SNIPER, LMG, SMG, SHOTGUN, MARKSMAN, SECONDARIES; `pictureVersion`; Honorable Mention is the tier stored as `capable`, shown "Honorable Mention" (and HM on the bot's lists), every spelling typed (`adminParser.js` line 411).
- `core/ops/loadouts.js` takes `buildNumber` on add and edit and refuses an MP build with no code (`codeRule`), so order item 9's two gaps are closed in core.
- `portal/**` is unchanged since v3.0.0 (`git log v3.0.0..origin/main -- portal` is empty).

## The routing **(Claude)**

The test: a change Board 4 must DRAW is one that changes what a surface Board 4 owns shows, or Session 5 would invent its design; a change that is words, order or wiring goes straight to Session 5's order; work no surface asks for yet is filed.

### Drawn on Builder-2 before Board 4: Final (all six bake into Final; §10.6 rows CU1–CU6)

| # | Ask | Where it is drawn | Board state |
|---|---|---|---|
| CU1 | Badges are per build (his 2026-10-19 15:59 EDT ruling), Ass beside Meta or a tier dropped | The weapon head and the selection list's group head carry none; every manifest row and selection-list row opens with a badge cell of compact badges (24 square, 4 apart) three wide, wrapping, never scrolling (a scroll box would clip each badge's pop-up); measured: an 80 cell hides 3 rails of 24 (from 1) and grows one row of 24, a 108 cell hides 5 and grows none, so 80 | C1 (sample builds varied so one weapon's builds differ) |
| CU2 | Capable shows as Honorable Mention; the in-game class order | The badge plate reads HONORABLE MENTION and HM where five plates share the tier rail; every class list in the order above | C1, C2, C3 |
| CU3 | The credit field (`loadout.credit`) | A Credit section after Image: Shows as (a rail: None · @User · Name · Link · Anonymous), Starts with (a rail: Submitted by · Credit: · Build by, only for user, name and link), then the user ID, the name with its n/32, or the link; the preview card's footer carries the line as `creditLine` writes it | C2 · Add · credit |
| CU4 | `showLabelOnLists` and `noAttachments` | Show on lists: a switch at the end of the Label line, disabled until a label exists. No attachments: a switch at the end of the Attachments head; on, the rows and the code section give way to one line and Stage asks for neither; the card says the bot's line | C2 · Add · credit, Add · no attachments |
| CU5 | The save checks (the catalogue warning, plus the cut-off code the catch-up missed) | They warn, never block: New as a tag in the attachment field's tail (and beside Weapon), Looks cut off on the code's head, Before staging lists both in the CAUTION tone the post drawer already used (now one rule for both drawers), and Stage reads "Stage anyway"; staging carries `catalogue.learn` for the new names. Bulk create meets the same two as notes, and a block now shows every note (a second one used to be dropped) | C2 · Add · checks, Bulk · warning |
| CU6 | Merged builds (`variants`, `loadout.options`) | Manifest: option rows 1b, 1c under their build, no checkbox, no badges, no share or delete, the picture and code columns held in line; a slot that changes between options carries the swap mark on every row. Drawer: an Options section (a rail of the build's tags, Add option, the picked option's label, Move earlier, Move later, Remove), the code, attachments and image below editing the picked option; Before staging asks for every option's attachments and code and refuses a repeated code. Preview: one section per option as `optionCards`. Selection list: an "N options" tag. Compare: each option a column of its own, keyed 1b, 1c in the tile and the list, sharing the six seats, its plate naming the option | C1, C2 · Add · options, C3 · Options |

### Specified as standard components, not drawn: Season has no surface on Board 4 (§10.6 rows CU7–CU9)

Board 4's sections are the Armory manifest, New build, Compare, Repairs, Export, the delivery queue, the Broadcast manifest, History and Admin traffic. Drawing a Season surface now would add a gate the board was never meant to grow at its close, so each Season ask is one decided component in an existing Season control, named by the conventions' grammar, which Session 5 builds as written.

| # | Ask | The component |
|---|---|---|
| CU7 | Draw Type on draws (`priceType`) | In Season's draw drawer (add and edit), a required field `field-L-search.dropdown` named Draw type, grouped: Unsure / Unknown first, then the priced types in `/draw prices`' order (tier as the group), then Free (Secret Cache, Event); on a draw row, the type's name as `tag-S-box.static--ghost` after the title, Unsure / Unknown as `tag-S-box.static-warn--ghost` (it is the flag the bot meant it to be: "easier to parse as a flagged item later on in the portal"), none for a draw never set. Bulk keeps `type: <code>` |
| CU8 | Calendar end TBD; inclusive end dates | The calendar drawer's end control gains a third choice beside a date and Ongoing, TBD (no date and not ongoing); the Track draws a TBD item as Ongoing draws it with its end in `--pending` (dashed, C17), since its end is a place still waiting. Every portal end date reads inclusive, as `/manage` does since #270: an end of Nov 12 runs through Nov 12 |
| CU9 | News triage's source | A staged row the news filled (`newsSource`) carries `tag-S-box.static-info--ghost` reading From news, its source on hover |

### Straight to Session 5's order (words, order, wiring; plan §5d item 10)

| # | Ask | What Session 5 does |
|---|---|---|
| S1 | Picture version in the Armory URL | `portal/api/armory.js:45` `buildImageUrl(b.imageKey, pictureVersion(b))`, both from `utils/loadoutRender.js`; the staging comment at line 62 says `WEAPON-CODE` on MP |
| S2 | History words | `drawindex: 'draw index entry'` in `OP_NOUN` (`portal/ui/board.logic.js:57`), and `news` in History's `sourceOf` |
| S3 | Text command in Analytics | `text: 'Text command'` in `ENTRY_LABEL` (`portal/ui/analytics.js:24`) |
| S4 | Commit errors in words | share `humanCommitError` (`handlers/manage/shared.js:104`): move it to core or import it, read in `portal/ui/async.logic.js` |
| S5 | Announcement preview separators | `SEPARATOR_MARKS` (`utils/announcement.js`) in the composer's preview |
| S6 | Badges per build, the data half | send `isAss` and `rankModes` on add and edit; `parseBadgesToken` matches the bot's `parseLoadoutBadges` (Ass dropped beside Meta or a tier, the capable range forms, `top4` read as `top5`, `hm` / `honorable` / `honorablemention`); Builder-2's `local/pins2/s4/builder-2/b4/bulkformat.js` and `local/pins2/s4/builder-2/ui/armory.logic.js` already carry it |
| S7 | Order item 9's two gaps | closed in core: send `buildNumber`, and core refuses an MP build with no code |
| S8 | The picture warning | the third save stop (see above), when an MP edit changes attachments and code with no new picture, in the same Before staging list as CU5 |

### Filed, not built in batch 2 (`docs/db-deferred-list.md`)

| # | Ask | Why it waits |
|---|---|---|
| F1 | The Undo check (`canRevert` asking `getLaterChangesTo`) | his "defer for now" of 2026-11-06 |
| F2 | `deploy.sh`'s `portal: FAILED` | expected until the portal launches; skip the restart when the unit file is absent |
| F3 | Season draft auto-promote, review and banners | Discord-only by the bot's design; the portal's Promote already gets the carry-over |
| F4 | A draw index surface (`drawindex.edit`) | no portal surface asks for it yet; History names the op (S2) |
| F5 | A past season's own dates (`patchnote.setSeasonDates`) | no portal editor yet |

## What Board 4 shows for it

Builder-2 `01ca19b` (and later), on this Mac only in `local/pins2/s4/builder-2/`, then Board 4: Final at its bake. Shots in `local/pins2/s4/shots/cu-b2/`, `cu-c2/`, `cu-d2/`, `cu-d3/`.
