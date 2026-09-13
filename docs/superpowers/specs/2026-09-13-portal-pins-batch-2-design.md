---
kind: spec
status: frozen
---

# Portal pins, batch 2 — what was decided

*Written 2026-09-13 11:31 EDT. The decisions behind `docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md`. Settled with Harkirat across four rounds of a shown fork board (https://claude.ai/code/artifact/dd0656fb-ab13-4358-8077-c0dd9089b24f) on 2026-09-12 and 2026-09-13, after he pinned 29 notes on the dev portal between 2026-09-11 22:46 EDT and 2026-09-12 12:31 EDT. The pins live in `local/portal-sync-notes.md`, which is gitignored — so §10 reproduces them verbatim, because nothing tracked could otherwise reach them.*

**Frozen.** If a later decision changes one of these, supersede this file with a new dated spec rather than editing it.

## 1 · The colour system

**His rule, in his words:** a `/manage` permission wears its in-bot command's accent; a realm stays in that family but is visually distinct from the permissions inside it. Two colours matching is a defect only when the two things are unrelated — Broadcast and Announcements are both pink because announcements live in Broadcast.

### 1.1 Realm accents — `portal/ui/tokens.css:125-126`

| Realm | Today | New | Note |
|---|---|---|---|
| Season | `#F2994A` | `#F59E0C` | Moved off Season Title/Dates (identical today) and off Patch Notes gold. Hue 37.6°, 8.8:1 on `--desk` |
| Armory | `#AE72E0` | `#EF4444` | Near MP red — accepted as kin |
| Broadcast | `#E56FA6` | `#EC4899` | Today's pink moves down to Announcements |
| Access | `#6B8AF7` | `#6C8AF7` | One digit |
| Analytics | `#9CC85A` | `#9CC85A` | Unchanged |
| History | — | `#00E1D9` | New realm. Near `--play` — accepted |
| Review | `var(--ink)` | `#D8F24A` | **Review gets a real accent**, overturning "Review is colourless because it is every topic" |
| Home | `var(--ink2)` | `var(--ink2)` | Not in his table; unchanged |

### 1.2 `/manage` page accents — against the bot's real accents

| Page | Bot today | New | Verdict |
|---|---|---|---|
| Season Draft | `#F2994A` (mirrors `/season end`) | `#F97315` | Reassigned to a new orange |
| Season Title/Dates | none (pseudo-page) | `#F3994B` | Takes `/season end`'s Neon Amber |
| Draws | `#6B4E7D` | `#6C4E7D` | One digit |
| Calendar | `#3A5068` | `#3A5168` | One digit |
| Announcements | `#2B2D31` fallback | `#E56FA6` | First real accent |
| Patch Notes | `#F2C230` | `#F3C231` | One digit |
| MP Loadouts | `#FF3430` | `#FF3B5D` | Moved to rose, away from the new Armory red |
| DMZ Loadouts | `#337BA6` | `#337CA6` | One digit |

**Commands:** `/manage` `#8B5CF6` · `/autobuild` `#15B8A6` · `/bot` `#23C45F`.

⚠️ **Page and command colours are applied when the Access grid is rebuilt, not before.** Four of them — `/autobuild` 173°, DMZ Loadouts 202°, Calendar 210°, `/manage` 258° — sit inside the 165–265° band the Edit drawer's four edit identities own (`--ed1`–`--ed4`, `portal/ui/tokens.css`), and today's grid palette was chosen to stay clear of it. The deferred permission design (§5) has to resolve that. Realm accents (§1.1) and the semantic tokens (§1.3) are not affected and ship first.

### 1.3 The two semantic tokens

- **`--staged` → `#D8F24A`**, Review's accent — anything saved but not real: staged counts, the draft bar, NEXT SEASON, staged chips. Hue 69.3°, 15.0:1.
- **`--ok` → `#7BDB63`, everywhere, and confirm actions take it.** Today `--ok` (`#3DDC97`, `tokens.css:58`) is a STATUS green only — healthy, live, the new value in a diff, done — with 49 references, and no button has ever used it. Commit, Save and Grant move from the staged fill to `--ok`, so a confirm button wears the colour of the state it produces. Hue 108°, 10.6:1.
- **Consequences:** every one of the ~50 `--staged` consumers in `app.css` is classified staged / confirm / focus rather than find-and-replaced; `--on-staged` (`tokens.css:259`, computed for cyan) is re-derived per fill; Marksman's category accent `--mm` is `#3DDC97` today and stops colliding with `--ok` for free.
- **Rejected on the board:** `#A3694E` (4.20:1, fails AA for the text sites, 2° from `--warn`) · `#226F82` (3.28:1) · `#FF7A46` for Season (it is `--warn`, 0.2° apart) · `#E05328` (3° from `--warn`).

## 2 · The empty state

One rule, `.estate .eicon` at `app.css:2028`, draws five empty states: Analytics Usage, Timing, Reach and Search (`analytics.js:419/512/603/713`) and Access Sessions (`access.js:323`). The dashed chip becomes a **solid edge tinted in the realm's accent**; `.estate.good` keeps its green (now `#7BDB63`) for empty states that are good news. The dev database gets seeded with analytics traffic so the four Analytics views can be judged populated — he has never seen them with data.

## 3 · The small text — sorted by kind

**The test:** a line earns its place only if it says something the panel beneath it cannot show. A restatement is cut. A fact moves to its control — the control states its own limit when it owns one constraint (a disabled button that says why, a live counter), or a mono label/value spec strip carries it when a panel has two or more. A finding becomes actionable — "3 single points of failure" is a filter chip, not a caption.

⚠️ **Never a sweep.** `analytics.js:834` records that one `span.sp` was added to close a conformance finding, and the decision ledger holds rows for others (Review's atomicity sentence, "portal is right"). Every site is enumerated with its realm, string, kind and ledger row before anything is cut.

## 4 · History, a new realm

**The manifest leaves Analytics whole; the rest of Analytics stays exactly as it is.** His reason: the manifest carries undo and revert, a capability, while Analytics is a surface for looking. Rail order follows his table — Season, Armory, Broadcast, Access, Analytics, then a divider, then History and Review. "Seven realms" is asserted in `scripts/lib/portalSeedRealms.mjs`, `portal/ui/shell.js` (`REALMS`, `REALM_LABEL`, `REALM_ICON`), `portal/api/realmAccess.js`, `CLAUDE.md` and the decision ledger; all move to eight in one change.

## 5 · The permission model — PENDING DESIGN

**Deferred by Harkirat, 2026-09-13 11:37 EDT:** *"the permissions restructure still has some kinks that need to be worked out so let's defer that decision as still pending and needing better discussion and designing."* **Nothing in this section is decided.** It records every input given so far, so the design discussion starts from them rather than from the pins.

- **Tiers proposed** (pins `pmtyh3ep6`, `pmtyih6yt`): *Portal* — per realm (Season, Armory, Broadcast, Access, Analytics, History), with Review and Home accompanying any Portal grant and Home showing only what the viewer holds · *Commands* — `/manage`, `/autobuild`, `/bot` · */manage pages* — the eight · and, from his answer in the planning session, a **/bot pages** tier (health, alerts, changes, usage, timing — `commands/bot.js:32-36`). Portal grants and bot grants are decoupled: an admin can hold either or both.
- **Sub-tiers proposed:** create · modify · destructive on every permission, retiring the standalone `destructive` token (pin `pmtyii7ki`) — and, added 2026-09-13 11:37 EDT, a **view-only** sub-tier for the Portal realms: the admin can open and interact with a realm, but every create, modify and delete control renders disabled.
- **The cell proposed:** one cell, `[square] | [sparkle] [triangle] [octagon]`, the square toggling all three; filled and coloured = direct, hollow and coloured = inherited, thin and uncoloured = none. View-only has no shape yet. Shapes are in `local/pin-assets/`; the refit geometry is on the board (https://claude.ai/code/artifact/dd0656fb-ab13-4358-8077-c0dd9089b24f): square 18.5 · sparkle 21 · triangle 21 · octagon 19.5 in a 24 box, measured non-clipping at 16, 20 and 24px.
- **Conferral — his answers:** `/manage` → all eight /manage pages · `/autobuild` → MP and DMZ Loadouts · `/bot` → every /bot page and every /manage page.
- **Access — his answer:** grantable with guardrails — no editing one's own row, no granting a scope or sub-tier one does not hold. Whether revoking is limited the same way was never asked.
- **Migration — his answer:** purge. Only his alt account holds a grant.
- **Constraints any design must meet:** `/bot access` and hotpatch (`commands/bot.js:1030`) stay owner-only, and retiring `destructive` removes `NOT_IN_ALL`, the source the grid's owner-only lock is derived from · enforcement lives in two codebases (`utils/adminAccess.js`, `portal/api/access.js`) and must read one declared table · all 42 registered core op types, plus grant, revoke and end-session, would each need a sub-tier (his example: calendar banners are create and destructive only) · `hasManagePageAccess` gates Review's commit path (`portal/api/changesets.js`, `assertOpsAccess`) · the page and command colours collide with the edit-identity band (§1.2).

## 6 · Armory

- **The build-name field already exists** (`models/Loadout.js:8`, default `Standard Build`, rendered at `portal/ui/armory.js:31`). What is wrong is the DATA: in the dev database 131 of 133 builds hold an ordinal (`Build 1`×73, `Build 2`×41, `Build 3`×14, `Build 4`×2, `Build 5`×1), one holds `Coming Soon` and one holds `1C2B5B6D7O` — a gunsmith code in the name field. **Build number becomes derived** ("Build 1 of 5", per weapon and mode, stable order by `_id`); **build name becomes an optional human label**, blank unless set. Migration is a dry run first; the write happens only after he approves its table.
- **Coverage flags** (`portal/api/armory.js:13-19`): a missing badge is not a defect (`no-badges` removed) · an attachment count of **2 or fewer** is the defect, replacing the exact-count check (DMZ's slot count varies with rarity, so its exact-9 check is wrong too) · **new:** an MP gunsmith code whose length is not twice its attachment count. Checked on real data before adopting: LOCUS Build 1, five attachments, `2A4B5A8C9C`; ICR-1, five, `2C4A5A8D9A`.
- **The row carries:** category colour chip, weapon name, category, badges, image-set indicator, up to five attachments, gunsmith code with a copy icon, build number, build name when set, and a share icon copying `/gunsmiths search weapon:<weapon> build:<n> visibility:Public`. No inline editing — every edit happens in the drawer. "MP" and "5 attachments" meta go. A tasteful category-accent tint on hover.
- ⚠️ `weapon` is an autocomplete option (`commands/gunsmiths.js:23`); the share text must be proven to resolve when pasted before the icon ships.
- **Bulk & Export:** the export block goes — the masthead Export strip already offers mode, category and selection (`armory.js:1262-1331`). The paste (`BulkView`, `armory.js:994`, with its per-field overwrite preview `BulkOverwrites`, `:960`) is the only multi-build create-or-update and **folds into New Build as a paste-many mode**; its placement inside the drawer is the critique session's.
- The floating "+ Add build" and the orphaned Secondaries chip are the shared Manifest tools row (`manifest.js:168-206`).

## 7 · Broadcast

The manifest's five fixes (column spacing, the floating Post button, the tiny colour chips, State filters with no identity, the State column's design) · HeadsUp's placement (it arrives through the Shell's `noticeSlot`, `broadcast.js:442`) · the announcement card redesign · the floating `p.chint` (`:139`). **New features:** a banner or thumbnail image per announcement, and **repeat N times with at least 24 hours between showings**. Delivery today marks an announcement seen on first show (`utils/announcement.js:102`), so repeating needs a per-user count and last-shown time — a new stored field, which means `docs/legal/PRIVACY.md` Appendix A and §2 change in the same commit. The composer's new inputs are designed by the critique session.

## 8 · Shell, Access and Analytics items

- **Crumb removed** (`shell.js:362-363`, `app.css:97-98`) — retiring Home ledger row 14 and Review region 5, which cited its wording.
- **Command bar centred, with keyboard navigation** — arrows, Enter, Escape.
- **Icon-only sign-out beside the profile button.** `.hdr-out` already has CSS (`app.css:3883`) and no JS emitter; check it before building a second.
- **Profile menu takes the Edit drawer's mesh tint** — `dominantColors` (`access.js:80`) moves to a shared module.
- **Revoke joins the Edit drawer** as an in-drawer confirm state, the way Save does, instead of opening a second drawer behind it (`access.js:206-207`, confirm at `:936`).
- **Session rows name browser and OS.** The harness fixture already stores readable strings, so it hides the defect; verify against a real user-agent (`access.js:278`).
- **The When column is in UTC today** (`analytics.js:67`, `toISOString`) — a correctness defect, not only formatting. It becomes the viewer's local time, "Sep 6, 7:25 PM".
- **Column widths come from roles, never a per-realm list** (`manifest.js:222-225`, a recorded decision) — When, Source and Who get narrow roles; What gets the detail role.
- **Level chips carry severity** using the `LEVEL_ROW` vocabulary (`analytics.js:61`).
- **The admin-traffic control** is a native checkbox (`app.css:2849`); it is redesigned — gate G2.
- **The Access panel header** ("1 admin × 12 permissions"): its noise line is sorted by kind at gate G1; the full panel-bar redesign is deferred with §5, because the bar summarises the grid being redesigned.

## 9 · Pins whose named cause was not the cause

| Pin | What it said | What is true |
|---|---|---|
| `pmtxvgtt6` | Analytics icons are bugged | They are empty states; the dashed chip is deliberate; the dev database has no traffic |
| `pmtylf7gz` | Build Name must be created in the model | The field exists; the data holds ordinals and one gunsmith code |
| (round 3) | "a confirm green already exists" — my claim | `--ok` is a status green and no button ever used it |
| `pmtxsahvd` | Sessions cannot be told apart | True in production; the harness fixture hides it |

**Standing instruction carried into every session:** reproduce the pinned symptom on the running portal first, and if what you find disagrees with the pin, stop and say so.

## 10 · The pins, verbatim

```text
## access — 2026-09-11 22:46 EDT · pmtxsahvd · from the dev-portal overlay
**Element:** `#sessions > div.sesslist:nth-of-type(2)` · 1148×173 at 111,531
**It shows:** diorMozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.3
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

![pin pmtxsahvd](portal-pins/pmtxsahvd.png)

The sessions need better distinguishing if possible. For example, I'm currently signed into the dev-portal in the Chrome browser, and also in Arc browser and looking this section right now, i can't which of these signed in sessions belongs to which browser.
## access — 2026-09-12 00:12 EDT · pmtxvdale · from the dev-portal overlay
**Element:** `#hdr > span.who:nth-of-type(6) > div.umenu` · 288×358 at 978,51
**It shows:** dior@diorswrldOWNERSessionexpires in 10h 29mDioreodioreo.app ↗Developer portaldiscord.com ↗Cloudinary assetscloudinary.c
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

give the profile menu pop-up the same mesh gradient tint as the Edit Admin Permissions drawer's admin profile info bar?
## analytics — 2026-09-12 00:15 EDT · pmtxvgtt6 · from the dev-portal overlay
**Element:** `div.panel:nth-of-type(2) > div.estate:nth-of-type(2) > span.eicon > svg` · 36×36 at 669,342
**It shows:**
**Frame:** route #/analytics · scroll 0,0 · viewport 1282×888

![pin pmtxvgtt6](portal-pins/pmtxvgtt6.webp)

all of the icons in the various Analytic's sub-panels (usage/timing/reach/search) are bugged. They have this dashed temp display sort of thing in the background.
## analytics — 2026-09-12 00:16 EDT · pmtxviaom · from the dev-portal overlay
**Element:** `#manifest > div.mtools:nth-of-type(2) > span.chipset:nth-of-type(3) > button.chip:nth-of-type(8)` · 52×32 at 932,335
**It shows:** error
**Frame:** route #/analytics · scroll 0,0 · viewport 1282×888

if these buttons are filters for "Level" why don't they have any sort of styling to their button design to signal their severity levels?
## analytics — 2026-09-12 00:19 EDT · pmtxvmcte · from the dev-portal overlay
**Element:** `tr:nth-of-type(1) > td.n:nth-of-type(2) > span.ncell > span:nth-of-type(2)` · 83×20 at 187,456
**It shows:** 09-06 19:25
**Frame:** route #/analytics · scroll 0,0 · viewport 1282×888

display the When date in a better format? such as "09-06 19:25" -> "Sept 6 7:25 PM", with it always being relative to the local timezone. So if i view this same page in toronto, it would show based on est timezone. But similarly, if i view this same page in Vancouver, it would show in vancouver's timezone.
## analytics — 2026-09-12 00:21 EDT · pmtxvp1qa · from the dev-portal overlay
**Element:** `#manifest` · 1150×4683 at 110,251
**It shows:** One history, both front doorsAlerts, changes and boots are all events — filtering one stream beats switching between fou
**Frame:** route #/analytics · scroll 0,0 · viewport 1282×888

![pin pmtxvp1qa](portal-pins/pmtxvp1qa.webp)

manifest column's spacing for the analytics realm needs it's own separate spacing adjustment, because currently they don't make sense. "When", "Source", and "Who" should not have this much width spacing. "Kind" is fine. And "What" needs more width spacing for sure.
## analytics — 2026-09-12 00:23 EDT · pmtxvrjls · from the dev-portal overlay
**Element:** `section.panel:nth-of-type(2) > div.ph:nth-of-type(1) > label.adminsw > input` · 15×15 at 544,267
**It shows:**
**Frame:** route #/analytics · scroll 0,0 · viewport 1282×888

![pin pmtxvrjls](portal-pins/pmtxvrjls.webp)

honestly, wtf is this lazyyyyy implementation of a toggle for "include admin traffic", this is the worst design implementation of an element I've seen in the entire portal.
## access — 2026-09-12 09:38 EDT · pmtyfklwl · from the dev-portal overlay
**Element:** `div.app > aside.drawer.open > footer.dw-f > button.btn.danger:nth-of-type(1)` · 132×44 at 386,760
**It shows:** Revoke access
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

When tapping "Revoke Access" button, the confirmation for it appears under/as another drawer behind the Edit Permissions drawer. As such, i first then have to click "Cancel" to close this drawer and then I can view the revoke access confirmation. This should be all part of the same drawer system. Just like how "Save Changes" physically changes this drawer, Revoke Access should be the same instead of launching a brand new drawer.
## access — 2026-09-12 10:21 EDT · pmtyh3ep6 · from the dev-portal overlay
**Element:** `thead > tr > th.mxc-name:nth-of-type(1) > span.mxs` · 200×13 at 144,323
**It shows:** Permission
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

- Let’s restructure Permissions handing overall...
    1. Let’s add another tier above “Commands” for “Portal”. This would allow an admin to actually log into the portal and edit things directly from here. I want it decoupled from the actual in-bot permission grants. So an admin can either have both of one or the other. Scope the permissions to per realm: Season, Armory, Broadcast, Analytics (and Review would accompany all of them since it just makes sense to. Same with "Home", and of course only show relevant info on the Home page based on the permissions they have granted).
    2. Let’s separate the type of access for EACH permission, across the entire access panel to 3 sub-tiers: Create, Modify, Destructive. This would mean that each permission now gets 3 square toggle blocks per cell (but instead of just the rounded square, let’s do 3 separate shapes to signify the 3 sub-tiers? I was thinking we do 4 toggles like this: `[square] | [sparkle] [triangle] [octagon]`. All soft rounded edges. Square = shortcut to toggle all 3 sub-tiers, aka “all”. Sparkle = create. Triangle = modify. Octagon = destructive.). I know this would be a significant permissions change and will require modification of code that currently handles permissions.
    3. For the sub-tier system for the portal itself, this would mean identifying and classifying each field and action into which of the 3 sub-tiers it represents. There might be fields, such as the calendar banners, which realistically only comply to “create” and “destroy” because a Modify/edit of a banner is basically the same as destruction. But other fields, such as the actual events in the calendar *can* have modify/edit ability, such as editing an existing event for a typo or something.
    4. Some svg examples of the shapes I was talking about: /Users/harkirat/Downloads/sparkle.svg '/Users/harkirat/Downloads/triangle (1).svg' /Users/harkirat/Downloads/triangle.svg '/Users/harkirat/Downloads/octagon (1).svg' /Users/harkirat/Downloads/octagon.svg
## access — 2026-09-12 10:59 EDT · pmtyih6yt · from the dev-portal overlay
**Element:** `tr.prow:nth-of-type(2) > td.mxc.owncol:nth-of-type(2) > span.mxcell.on > i` · 16×16 at 537,328
**It shows:**
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

Following up to my previous pin about the permissions restructure, i was thinking this would be the structure and their corresponding colors (note that i changed up some of the realm's accent colors, so you'll need to change them accordingly.)

### Portal
- Season #EBB30B  `[square] | [sparkle] [triangle] [octagon]`
- Armory #EF4444
- Broadcast #EC4899
- Access #6C8AF7
- Analytics #9CC85A
--
- History #00E1D9
- Review #E8EDF1

### Commands
- /Manage  #8B5CF6
- /Autobuild  #15B8A6
- /Bot  #23C45F

### /Manage Pages
- Season Draft  #F97315
- Season Title/Dates  #F3994B
- Draws  #6C4E7D
- Calendar  #3A5168
- Announcements  #E56FA6
- Patch Notes  #F3C231
- MP Loadouts  #FF3B5D
- DMZ Loadouts  #337CA6
## access — 2026-09-12 11:00 EDT · pmtyii7ki · from the dev-portal overlay
**Element:** `tbody.grp:nth-of-type(3) > tr.prow:nth-of-type(5) > td.mxc-name:nth-of-type(1) > span.pname` · 178×16 at 166,442
**It shows:** Destructive
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

That would mean this separate "Destructive" permission isn't needed anymore since destructive would be a sub-tier within each permission now.
## access — 2026-09-12 11:02 EDT · pmtyikesy · from the dev-portal overlay
**Element:** `#app > div.app > nav.rail` · 88×836 at 0,52
**It shows:** SeasonArmoryBroadcastAccessAnalyticsReview
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

You'll also notice I added a "History" Realm into my previous permissions restructure pin. History is basically just splitting the manifest out of analytics and into it's own Realm.
## access — 2026-09-12 11:05 EDT · pmtyioc0l · from the dev-portal overlay
**Element:** `main > section.panel:nth-of-type(3) > div.ph:nth-of-type(1) > span.sp:nth-of-type(2)` · 151×16 at 1094,255
**It shows:** 1 admin × 12 permissions
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

1 admin x 12 permissions just reads oodly. it seems to imply that the 1 admin has 12 permissions. Rework this to better represent the Access panel. Like properly, fully redesign it and drastically integrate it into the panels upper bar (where it sits). Because right now, all these small texts, such as this one, just look and feel like noise.
## access — 2026-09-12 11:07 EDT · pmtyiqqu3 · from the dev-portal overlay
**Element:** `#hdr > span.crumb:nth-of-type(2)` · 125×20 at 204,16
**It shows:** Access  By admin
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

I'll be so honest, this nav or whatever it is, is SO useless and ugly. Just remove it.
## access — 2026-09-12 11:08 EDT · pmtyisiuz · from the dev-portal overlay
**Element:** `#hdr > div.cmdbar` · 520×34 at 494,9
**It shows:** ⌘/On this pageBy adminviewGo toWhat needs youhomeSeasonrealmArmoryrealmBroadcastrealmAnalyticsrealmDoReview & commitcomm
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

And pls center the search bar to the page. Also allow keyboard usage for it. Like for example, i can press cmd+/ to invoke it but i still need to use my mouse to actually select an item. Let me use my keyboard arrow keys and stuff to actually navigate within it when it's invoked.
## access — 2026-09-12 11:10 EDT · pmtyiv9te · from the dev-portal overlay
**Element:** `span.who:nth-of-type(6) > div.umenu > div.usec.last:nth-of-type(5) > button.mi.danger` · 276×35 at 984,367
**It shows:** Sign out
**Frame:** route #/access · scroll 0,0 · viewport 1282×888

can you also add a button, icon style only; no text, to the right of the profile menu button inside of the nav bar. Like a 2nd method, a direct method to just press sign out instead of having to do it directly from the menu only. So both methods would exist.
## broadcast — 2026-09-12 11:14 EDT · pmtyizssz · from the dev-portal overlay
**Element:** `#manifest` · 1150×387 at 110,361
**It shows:** ManifestSearch announcementsStateAlllivescheduledexpired+ Post announcement4 of 4Announcement Posted Starts Ends State R
**Frame:** route #/broadcast · scroll 0,0 · viewport 1282×888

this manifest needs drastic refining. 1. Look at the shitty spacing of it's columns. 2. why is the "post announcement" button just randomly floating there? 3. Why are the color chips, left of the Announcement column, so weird and tiny? 4. Why don't the "State" buttons have any color identity? 4. The actual State column just looks so ugly. Implement those badges and states drastically better. Improve their design.
## broadcast — 2026-09-12 11:14 EDT · pmtyj0bqw · from the dev-portal overlay
**Element:** `#manifest` · 1150×387 at 110,361
**It shows:** ManifestSearch announcementsStateAlllivescheduledexpired+ Post announcement4 of 4Announcement Posted Starts Ends State R
**Frame:** route #/broadcast · scroll 0,0 · viewport 1282×888

![pin pmtyj0bqw](portal-pins/pmtyj0bqw.webp)

Forgot to add the screenshot.
## broadcast — 2026-09-12 11:17 EDT · pmtyj3z8o · from the dev-portal overlay
**Element:** `#app > div.app > aside.drawer.open` · 560×550 at 361,169
**It shows:** announcement.post · tier 1Post an announcementTextStartsEndsA blank start shows it the moment you commit. A blank end ta
**Frame:** route #/broadcast · scroll 0,0 · viewport 1282×888

Improve the Announcement system to include an a banner image or a thumbnail image within the announcement message.

Also add the ability to show that specific announcement N repeated times (with a minimum 24 hour delay between the repeat). So incase i sent a message and want to make sure it pops up at least 3 times over the next few days to make sure the user sees it.
## broadcast — 2026-09-12 11:17 EDT · pmtyj4nhx · from the dev-portal overlay
**Element:** `#headsup > div.panel > div.callout` · 1148×64 at 111,666
**It shows:** Heads up: “SESSIONB-SEED Season 7 is live — Reckoning drops today: new dr…”             has no expiry and has been showi
**Frame:** route #/broadcast · scroll 0,0 · viewport 1282×888

Why is the "Heads up" buried half way into the realm??
## broadcast — 2026-09-12 11:19 EDT · pmtyj69wu · from the dev-portal overlay
**Element:** `div.nowwrap:nth-of-type(2) > div:nth-of-type(1) > div.nstack > div.nscard.p0` · 798×62 at 127,381
**It shows:** 1SESSIONB-SEED Season 7 is live — Reckoning drops today: new draws, a reworked ranked reset, and the battle pass runs to
**Frame:** route #/broadcast · scroll 0,0 · viewport 1282×888

Drastically redesign the card showing the announcement. The # and the "Never ends" is fine but the actual announcement and the "up Nd" is poorly integrated. Honestly, just overall, it could use a must better, nicer redesign.
## broadcast — 2026-09-12 11:19 EDT · pmtyj6u8y · from the dev-portal overlay
**Element:** `section.panel:nth-of-type(2) > div.nowwrap:nth-of-type(2) > div:nth-of-type(1) > p.chint` · 798×17 at 127,513
**It shows:** Position is delivery order — oldest first, and nothing else. There is no way                     to reorder announcement
**Frame:** route #/broadcast · scroll 0,0 · viewport 1282×888

![pin pmtyj6u8y](portal-pins/pmtyj6u8y.webp)

why is this just randomly floating in the middle of the panel?
## broadcast — 2026-09-12 11:21 EDT · pmtyj9low · from the dev-portal overlay
**Element:** `main > section.panel:nth-of-type(2) > div.ph:nth-of-type(1) > span.sp:nth-of-type(4)` · 246×16 at 999,326
**It shows:** 1 in one message, oldest first · cap 10
**Frame:** route #/broadcast · scroll 0,0 · viewport 1282×888

Same issue i already mentioned on the access realm, these small texts just look and feel like noise to me. Never once have i glaced over it and assumed it was actually informative. In my mind, i glaced over it and assumed it was just more bloated "hint" text that's plaguing the ENTIRE portal UI.
## broadcast — 2026-09-12 11:21 EDT · pmtyj9r49 · from the dev-portal overlay
**Element:** `section.panel:nth-of-type(2) > div.nowwrap:nth-of-type(2) > div.nprev:nth-of-type(2) > p.pnote` · 300×63 at 943,570
**It shows:** Delivered as an ephemeral follow-up after any top-level slash command,                 every unseen announcement as its
**Frame:** route #/broadcast · scroll 0,0 · viewport 1282×888

That reminds me, *the bloated hint texts are plagueing the entire portal UI!*
## armory — 2026-09-12 11:23 EDT · pmtyjbql6 · from the dev-portal overlay
**Element:** `#manifest > div.mtools:nth-of-type(1) > button.chip.go.madd` · 89×32 at 669,385
**It shows:** + Add build
**Frame:** route #/armory · scroll 0,0 · viewport 1282×888

![pin pmtyjbql6](portal-pins/pmtyjbql6.webp)

why is the "add build" button jsut randomly floating in the middle of the filter bar?
Why is the "secondaries" button just randomly alll the way over on that left side?
Wheres the "awwards worthy" design, alignment, nitpicking, refinement??
## armory — 2026-09-12 12:22 EDT · pmtylf7gz · from the dev-portal overlay
**Element:** `#manifest` · 1150×7026 at 110,267
**It shows:** ManifestSearch buildsCategoryAllAssault 35SMG 26LMG 12Marksman 14Sniper 19Shotgun 10Secondaries 9+ Add build125 of 133Cl
**Frame:** route #/armory · scroll 0,0 · viewport 1282×888

Let's drastically redesign Armory's Manifest system.
- So realistically, I’ll never sort the armory’s manifest by anything other than the Weapon Name. Or use the category filter buttons that already exist.
- That means a lot of the info can technically sit together in a drastically reformatted way and re-designed drastically to actually look and read much better. Since there’s really only 1 sorting method within the actual rows, the weapon name.
- So I want the entire width to be fully redesigned to hold the following info: the coloured chip, weapon name, category, the badges, image (red or green if image set or not), the *up to* 5 attachments, gunsmith code, build number, and build name if specifically set.
- Some misconceptions and notes:
    - build 1 and build 2 are NOT build names. That’s something you invented. I honestly haven’t even set a build name for ANY builds in the database. That also means you actually need to create and implement a Build Name field into the loadout creation models in both the bot and the portal. And it would be an optional field.
    - Build number is literally a number (such as Build: 1 of 5).
    - Mentioning “mp” and “5 attachments” within the manifest row is useless info.
    - A weapon having less than 5 attachments is NOT an issue — that’s fine. An issue in terms of attachments is if a weapon has 2 or fewer attachments.
    - A weapon not having a badge is NOT an issue. Badges are earned and not a mandatory field of the loadout.
    - The gunsmith code *can* be shorter than 10 characters, but it’s never more than 10. It’s a set of NumberLetter for each attachment. Meaning each attachment represents 2 characters within the gunsmith code. The real issue you should flag is the correspondence between the number of attachments and the number of characters in its gunsmith code. For example, if a weapon only has 4 attachments, its gunsmith code would be 8 characters. So if there’s a mismatch there, that’s when you would flag an issue in the system. Does that make sense? And of course use your own judgement to expand on my example for other edge cases, issue scenarios, or ask me if you’re wondering about a scenario.
    - Other improvements to the row, just some ideas, not the exact list of things I want, that’s still on your judgement for the full redesign and how to design it...
        - *Tastefully* extending the accent color of a weapon category to other elements within the row, such as a mesh gradient tint when hovering over the row, etc.
        - A copy icon method to directly copy the gunsmith code from the row.
        - I dont need individual things being editable directly in the row, just make all edits in the edit drawer pop-up.
        - A share icon method which copies the in-bot slash command. Example, I want to share the locus build 2, it would copy `/gunsmiths search weapon:[SNIPER] LOCUS build:2 visibility:Public`.
## armory — 2026-09-12 12:23 EDT · pmtylhbxw · from the dev-portal overlay
**Element:** `#app > div.app > aside.drawer.open.wide` · 880×746 at 201,71
**It shows:** loadout.add · MP · tier 1New MP buildFill in what you know. A weapon name and a category are all it takes to stage a
**Frame:** route #/armory · scroll 0,0 · viewport 1282×888

HOLY SHIT, the actual New Build drawer needs MUCH needed refinement, designing refinement, and overall updating to look and actually feel "awwards worthy". Like seriously, this needs brainstorm, a /design-critique, and proper improvement.
## armory — 2026-09-12 12:26 EDT · pmtylle3x · from the dev-portal overlay
**Element:** `div.app > main > section.panel:nth-of-type(2) > div.bulkview:nth-of-type(2)` · 1148×505 at 111,329
**It shows:** Paste in MPOne block per build, blocks separated by a blank line. A build already carrying this
**Frame:** route #/armory · scroll 0,0 · viewport 1282×888

![pin pmtylle3x](portal-pins/pmtylle3x.webp)

entire Bulk & Export is honestly redunant, no? because the "export" button already exists in the masthead. And the Bulk creation system could honestly just be wired directly into "New Build". Tell me if I'm missing something? Or if these do anything unique?
## armory — 2026-09-12 12:31 EDT · pmtylqtti · from the dev-portal overlay
**Element:** `#compare` · 1148×293 at 111,223
**It shows:** WeaponPick one weapon, or two. Every build of each lines up here field by field, with the rows that differ marked — one
**Frame:** route #/armory · scroll 0,0 · viewport 1282×888

The entire "Compare" panel, method, system, layout, design, etc needs a dedicated /impeccable critique. Like the agents should be scoped to stress every element, component, text, layout, function, usability, etc etc of the Compare panel. Not just the front-facing "pick a weapon", but the entire thing, including after a weapon is actually chosen to compare. Because honestly, this panel could use a drastic improvement considering how useful of a component it is within the portal system. Hell, i eventually want to port it over to the main dioreo.app website as it's own dedicated /compare page (file that as a near future project), because that's just how important and great of a system it is and has the capability to be. It needs a much thought-out "awwwards worthy" refinement.
```
