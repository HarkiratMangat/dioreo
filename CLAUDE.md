# Dior's Builds — CODM Discord Bot

## What this is
A Discord bot for Call of Duty Mobile (CODM) content: lucky draw info, patch notes,
seasonal calendars, CP pricing, weapon loadouts, and countdown timers. Built and
maintained by Harkirat (Discord ID `1139845545754632283`), the sole admin.

## Stack
- discord.js v14 (`^14.26.4`), Node.js v26, run locally on a Mac (`node index.js`)
- MongoDB Atlas via Mongoose
- `chrono-node` for natural-language date parsing (admin input)
- `dayjs` (+ utc/timezone plugins) for user-facing timestamp conversion
- `jimp` for accent-color extraction (pure JS, no native binary — see Accent color system below)
- `cloudinary` (added 2026-07-12) — draw thumbnail caching (`utils/cloudinaryCache.js`); auto-reads
  the existing `CLOUDINARY_URL` env var on require, no explicit config call needed.
- `xlsx` — NOT used at bot runtime anymore (see MP loadout system below); only referenced by
  `scripts/migrateBuildsToMongo.js`, a one-time/re-runnable migration tool, not something the
  bot itself ever calls.
- Pushed to GitHub (`origin/main`). **Render is git-connected auto-deploy** (a push to `main`
  triggers it, no separate CI/CD pipeline) — **Railway is NOT** (confirmed live 2026-07-12: pushing
  to `main` left Railway's running deployment on a 2-day-old commit with no redeploy triggered at
  all). Railway needs an explicit `railway up --detach` from this repo's root after every push meant
  to reach it — don't assume a `git push` alone puts new code on Railway; verify via `railway logs
  --deployment` (checks the boot-banner timestamp) or `railway status` before trusting it's live.

## Maintaining context comments — please keep doing this
This codebase has inline comments explaining **why** something is written a certain
way, not just what it does — especially around bugs that were fixed, Discord platform
quirks, and non-obvious design decisions. When you edit a file:
- Keep existing context comments accurate — update or remove them if your change
  makes them stale, don't just leave outdated explanations sitting next to new code.
- Add a comment in the same style when you fix a bug, make a non-obvious choice, or
  work around a platform limitation, so both Harkirat and any other AI agent working
  in this repo later understands what happened and why without re-deriving it.
- Prefer explaining *reasoning* over narrating *what* the code does line-by-line.

## Command architecture
Base commands use subcommands to group related functionality:
- `/season end` — `seasonend.js`
- `/draws` — `draws.js` (flat command, no subcommand)
- `/patch notes` — `patchnotes.js`
- `/calendar` — `calendar.js` (flat command)
- `/draw prices` — `drawprices.js`
- `/settings`, `/timestamp` — flat commands
- `/dmz` — `dmz.js` (flat command; standalone DMZ loadout lookup, up to 9 attachments)
- `/all`, `/<category>` (`/ar`, `/lmg`, `/sniper`, etc.) — MP loadout lookup. NOT files in
  `commands/` — auto-generated in `index.js`'s `handleBotReady()` from whatever categories
  currently exist in MongoDB (`Loadout.distinct('category', {mode:'MP'})`), so they only show up
  after the bot's first successful boot post-data-import. See MP loadout system below.
- `/manage` (admin-only, hidden via `setDefaultMemberPermissions(0)`) — the single admin data-entry
  command, covering everything draws/calendar/MP+DMZ loadouts/patch notes/season need. Used to be
  split across this command and a separate `/update` dropdown-driven bulk-import gateway;
  consolidated into one command (2026-07-09, Harkirat's request — "don't want a long list of slash
  commands"), redesigned twice more that same day (collapsed a subcommand-group tree into one flat
  command opening a Components V2 panel, then added Purge/a page-select dropdown/folded a briefly
  -standalone `/export` command back in), then rebuilt a third time (2026-07-12) against 4 mockup
  JSONs Harkirat hand-drew himself while working around a usage-limit outage — new title/section
  layout, a real **Add Multiple** (additive) vs **Replace/Bulk Replace** (destructive) distinction
  for draws/calendar, Export folded INTO each entity's own page instead of a separate Export page,
  Loadouts losing Purge but gaining a 3-way in-page export, and Patch Notes rebuilt around a single
  "current entry" model. `/update` no longer exists, and there is no subcommand tree at all —
  everything is reached through buttons/selects on one ephemeral (by default) panel message.
  - **Shape: one flat command that opens a Components V2 panel.** `/manage` takes an optional
    `page` choice option (Draws/Calendar/MP Loadouts/DMZ Loadouts/Patch Notes — Season isn't in this
    list, see below) to land directly on a section, and an optional `private` boolean (default
    `true` — this is the one command that defaults ephemeral instead of public, since it's the admin
    panel). `commands/manage.js`'s `PAGES` object is the single source of truth for every page's
    title icon, grouped sections, action button copy/styles, and dropdown options — it only builds
    layout and every modal's *shape* (field labels, placeholders, pre-filled values) as exported
    functions; `index.js` owns all the actual routing and DB-mutating submit logic.
  - **MP and DMZ Loadouts are two separate pages (`loadouts_mp`/`loadouts_dmz`), not one shared
    page with a Mode field.** Structurally identical (`manage.js`'s `loadoutsPageDef(mode, ...)`
    factory builds both from one shape, per Harkirat's "just copy that for DMZ loadouts since
    they're essentially the same thing") — the mode lives in which page/button you clicked, not a
    modal field you have to remember to fill in correctly. Because these two group keys contain
    their own underscore, `mng_act_`/`mng_search_`/`mng_pick_` custom_ids are parsed on the LAST
    underscore (`index.js`'s `parseMngId()`), not a naive `.split('_')` — every action id is kept
    underscore-free specifically so this stays unambiguous.
  - **Section switching is a select menu (`mng_pagesel`), not a row of nav buttons** — a button row
    caps out at 5 and this panel has more sections than that. Selecting **Season** doesn't render a
    page at all: Season has no key in `PAGES`, and its two actions ("Season: Titles & Deadlines" /
    "Season: Wipe Season") are flat dropdown entries that each open their modal directly on
    selection, per Harkirat's request ("let that selection open the editing modal right away instead
    of a dedicated management page"). `showModal()` is valid as the first response to a select-menu
    interaction, same as for a button or modal-submit.
  - **Add/Bulk-* actions open their modal directly** on click. Draws: `addnew`/`addreturning`,
    `bulkaddnew`/`bulkaddreturning`/`bulkaddeither` (additive), `bulkreplacenew`/
    `bulkreplacereturning`/`bulkreplaceeither` (destructive, the old bulk-new/returning/both
    behavior renamed), `bulkdeletenew`/`bulkdeletereturning`/`bulkdeleteeither`. Calendar: `add`,
    `addmultiple` (additive), `replacemultiple` (destructive, old bulk-add renamed), `deletemultiple`.
    Loadouts (MP/DMZ): `add`, `bulkadd`, `bulkreplace` (currently routes to the SAME upsert modal as
    `bulkadd` — see the deferred-work note below), `bulkdelete`. Patch Notes: `dateinfo`, `urls1`,
    `urls2` (see the single-current-entry note below).
  - **Edit/Delete need a specific item picked first, and a button can't autocomplete the way a
    slash-command option could** (draws/calendar/MP+DMZ loadouts only — Patch Notes has neither
    anymore) — clicking either opens a one-field "search by name" modal
    (`mng_search_{group}_{action}`) instead. Its submit handler (`index.js`) fuzzy-matches the query
    (`utils/search.js`'s `fuzzyMatch`, same convention as every other admin search route) against
    the right collection: 0 matches replies "not found"; exactly 1 match chains straight into the
    real edit modal or performs the delete directly (Discord allows `showModal()` as the initial
    response to a modal-submit or select-menu interaction, not just a button); 2+ matches shows an
    ephemeral disambiguation select menu (`mng_pick_{group}_{action}`) that resolves the same way
    once a specific one is chosen. `index.js`'s `resolveManagePanelMatches()` /
    `resolveManagePanelAction()` are the shared implementations both the search-modal and the
    select-menu handler call into, so there's exactly one copy of "how do we look this up" and
    "what do we do once we have it" each, not two drifting copies.
  - **Purge (draws/calendar/patchnotes only — Loadouts has NO Purge button at all).** Dropped from
    the Loadouts pages entirely in the 2026-07-12 redesign per Harkirat's explicit call: "we dont
    need purge for the loadouts. the loadouts data is meant to stay long term whereas the purge is
    more so for QoL for the short term seasonal data." Everywhere it does exist, it's a per-page
    "wipe just this entity's data" button requiring a second tap: the first click
    (`mng_act_{group}_purge`) only shows an ephemeral Confirm/Cancel prompt; the actual delete only
    happens from `mng_purgeconfirm_{group}`, so a single misclick can't wipe a collection.
    **Deliberately distinct from "Wipe Season"**, which resets draws+calendar together as part of
    starting a new season but always preserves patch notes history — Patch Notes' own Purge button
    is the one place that history can actually be cleared. `manage.js`'s `PURGE_LABELS` holds the
    per-group confirmation wording (now only `draws`/`calendar`/`patchnotes` keys);
    `index.js`'s `mng_purgeconfirm_`/`mng_purgecancel_` handlers do the actual per-group delete.
  - **Export now lives INSIDE each entity's own page** (2026-07-12), not a separate Export page —
    that page (and the standalone `/export` command it briefly replaced before that) is gone
    entirely. Draws' page has its own Export block (`exportnew`/`exportreturning`); Calendar's page
    has one (`export`); Loadouts (MP/DMZ) gained a genuinely NEW 3-way export
    (`exportupto5`/`exportcategory`/`exportall`) it never had before — reversing the earlier
    "Loadouts are deliberately excluded from Export" decision, since the new mockup explicitly
    designed one in. Every export action replies with the data as a **file attachment**
    (`files: [{ attachment: Buffer.from(text, 'utf-8'), name: '...' }]`), not inline plain text.
    Draws/Calendar/Loadouts all export in their real bulk-import-compatible format
    (`formatDrawsAsBulkText`/`formatCalendarAsBulkText`/`formatLoadoutsAsBulkText` in
    `utils/adminParser.js`) so the file pastes straight back into the matching Bulk Add/Replace
    action. Patch Notes has no export at all anymore (dropped in the redesign — it has no
    bulk-import format to round-trip into anyway, only single add/edit ever existed for it).
  - **Patch Notes operates on a single "current entry"** (`dateinfo`/`urls1`/`urls2`, replacing the
    old add-a-new-entry-by-hand + search-and-edit flow) — all 3 actions target the LAST item in
    `patchNotes[]`, the same entry whose title already stays synced to `currentSeasonTitle` (see the
    design-decision-log entry on that below). `dateinfo` covers release date + additional info;
    `urls1`/`urls2` split the image URL list into `images[0..4]`/`images[5..9]` so a season with more
    than 5 screenshots doesn't need to cram them into one field, and each submit only ever replaces
    its own half, preserving whatever the other slot has saved. If no entry exists yet at all
    (fresh install, or right after Wipe Season), whichever of the 3 is submitted first creates it
    (title defaults to `currentSeasonTitle`) — `index.js`'s `getOrCreateCurrentPatch()`.
  - **Loadouts bulk-add's paste format still carries a redundant Mode field** (`Weapon | Category |
    Mode | Build | Image | Code | Badges`) even though the button itself is already MP/DMZ-scoped —
    kept that way specifically so `parseBulkLoadoutList()` didn't need touching; `index.js`'s submit
    handler force-overrides every parsed entry's `mode` to match whichever page opened the modal
    regardless of what's typed there, so a stray mismatched value can't silently file a loadout under
    the wrong page. Single add/edit's `meta` field dropped its own Mode segment though (now just
    `Category | Badges`, not `Category | Mode | Badges`) since there's no third segment worth adding
    back for a field that's genuinely per-button now — editing an existing loadout reads its mode
    straight off the document instead (there's no "move this loadout to the other mode" action).
  - **Deferred work, on purpose: the real "search + multi-select" flow.** The mockups describe
    "Delete Multiple" (all entities) and Loadouts' "Replace Multiple" as searching first, then
    picking which matches to act on from a list — genuinely new interaction, different from today's
    paste-a-list-of-names-and-fuzzy-match bulk-remove. Per Harkirat's explicit direction (it's a
    large rebuild on its own, and bundling it into this pass risked a usage-limit interruption
    mid-build), this pass keeps those specific actions on today's paste-based modals as a deliberate
    placeholder: "Delete Multiple" is the pre-existing paste-and-fuzzy-match bulk-remove, just
    relabeled; Loadouts' "Replace Multiple" routes into the exact same upsert modal as "Add
    Multiple" (which already covers replace semantics for anything you paste back in, just not via
    a search-and-pick UI). Build the real version next, not a silent gap.

**Important:** `client.commands` is keyed by the exact `SlashCommandBuilder.setName()`
value. Several nav buttons use shorter custom_id suffixes than their actual command
name (e.g. button `nav_prices` → command `draw`). `index.js` has a
`NAV_COMMAND_ALIASES` map bridging these — check it before assuming
`client.commands.get(strippedCustomId)` will just work.

## Components V2 — hard-won lessons
This bot uses Discord's Components V2 (`flags: 32768`) throughout: Containers
(type 17), Sections (type 9) with thumbnail accessories, Text Displays (type 10),
Separators (type 14), Media Galleries (type 12). A few things that will bite you:

1. **Selects and buttons still need an Action Row (type 1) wrapper**, even nested
   inside a Container. Pushing a bare `type: 3` select or `type: 2` button directly
   into a container's `components` array is invalid — this bug has recurred twice
   already (drawprices.js, patchnotes.js) during past sessions. Always wrap.
2. **40 total components per message, counted recursively** — containers, sections,
   text, buttons, thumbnails, everything nested inside everything. A Section with a
   thumbnail accessory costs 3 (section + text + thumbnail), a plain Text Display
   costs 1. `draws.js` and `calendar.js` both implement chunked pagination
   (`CHUNK_SIZE` constants) specifically to stay under this ceiling once bulk imports
   add a lot of entries — this was a real production crash
   (`COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED`), not preemptive paranoia. Any new
   list-rendering command should consider the same pattern.
3. **Buttons cannot have custom hex colors** — only 5 fixed native styles (Primary/
   blurple, Secondary/gray, Success/green, Danger/red, Link/gray-with-URL). Container
   `accent_color` *does* support full hex though. Current convention: inactive nav
   buttons are gray (style 2), the active/current page's button is red + disabled
   (style 4, `disabled: true`).
4. **A button's `label` is plain text only** — pasting a raw emoji mention string like
   `<a:NewDraws:123>` into `label` just displays that literal text, it does NOT render
   the emoji (this bit `draws.js`'s category-toggle buttons). Emoji has to go through the
   dedicated `emoji: { id, name, animated }` field instead. `emojiMap.js`'s `parseEmoji()`
   converts the mention strings already stored there into that shape.

## Crash resilience
`index.js`'s entire `interactionCreate` handler (~650 lines) is wrapped in a single
top-level `try/catch` that just logs to console on error. This was added after a real
crash: a button interaction whose token had already expired (Discord error 10062,
`Unknown interaction`) threw an unhandled rejection that took the whole bot offline
until a manual restart. Interaction tokens are only valid for a few seconds/minutes, so
this kind of failure is expected to happen occasionally under normal use — the handler
should degrade to "that one click didn't work," never "the bot crashed." If you add new
branches to this handler, you don't need your own try/catch around them (the outer one
covers it), but don't let anything inside intentionally rethrow past it.

**`client.on('error', ...)` MUST be registered, or a rejection can crash the bot even with the
outer try/catch in place (found locally, 2026-07-07).** discord.js's `BaseClient` constructs
itself with `super({ captureRejections: true })` — a Node `EventEmitter` option that reroutes a
rejected promise from an async event listener (our `client.on('interactionCreate', async
interaction => {...})`) into an `error` event emitted **on the client itself**, instead of
surfacing through Node's normal `process.on('unhandledRejection')`. With no listener for a plain
`error` event on the client, EventEmitter's default behavior for an unhandled `error` event is to
throw synchronously and crash the process — completely bypassing both the outer try/catch *and*
any `process.on('unhandledRejection')` net, since captureRejections intercepts the rejection before
it ever becomes a "global" unhandled rejection. This is a well-known discord.js gotcha (their own
guide calls it out) and is now fixed with a permanent `client.on('error', ...)` listener right after
the client is instantiated. If you ever see a crash log with "Emitted 'error' event on Client
instance" in the stack, this is why — check that this listener is still registered before assuming
some other Component-count/interaction-routing bug.

**The outer try/catch alone wasn't enough — a real Railway crash got past it (2026-07-07).**
A `deferReply()` failed with 10062 (`Unknown interaction`, expired token), which was caught by
the error-fallback in `index.js`'s slash-command router. That fallback then did
`return interaction.reply(...)` — but the interaction was *already* effectively acknowledged from
Discord's side, so this second call rejected too (40060 `already acknowledged`). Because it was
an unawaited `return <promise>` inside a `try` block, the `try` had already exited by the time
that promise rejected — the outer top-level `catch` above was no longer "in scope" to catch it,
and it surfaced as a raw unhandled promise rejection, which crashes the whole Node process by
default (since Node 15). Fixed by `await`-ing the fallback reply/editReply/followUp calls and
wrapping *those* in their own try/catch too. Also added a `process.on('unhandledRejection', ...)`
logger near the top of `index.js` as a last-resort net for any other unawaited
`return interaction.X(...)` call site that gets missed — **this is not a substitute for awaiting
properly**, just a backstop. The general rule: any `return interaction.reply/editReply/followUp(...)`
inside a `catch` block (or any early-return error branch) MUST be awaited (or wrapped in its own
try/catch) — a bare `return <promise>` does not keep the enclosing try/catch "listening" for that
promise's eventual rejection. Fixed at every site this pattern was found during a later review pass
(not just the original slash-command/nav-button routers): the MP loadout "no builds found" reply,
both settings security-gateway rejection replies, the nav-router "target offline" reply, and the
loadout `copy`/`copyatt` button replies — if you add a new early-return error reply anywhere in this
handler, follow the same await-and-wrap shape rather than a bare `return interaction.X(...)`.

## User-install / DM support — must be set per-command, not inherited
Discord requires each slash command to individually opt in to being usable outside a guild via
`.setIntegrationTypes([1]).setContexts([0, 1, 2])` on its `SlashCommandBuilder` — there's no
bot-level toggle that applies this to every command at once. `/timestamp`, `/all`, and the
auto-generated `/<category>` MP commands had this from an earlier session, but `/draws`,
`/calendar`, `/patch notes`, `/draw prices`, `/dmz`, `/season end`, and `/settings` didn't — so
they silently never showed up when DMing the bot or using it as a user-installed app, even though
the bot as a whole is set up for user-install. Fixed by adding the same
`.setIntegrationTypes([1]).setContexts([0, 1, 2])` to all of them. **`/manage` originally stayed
guild-only on purpose** (it's gated by `setDefaultMemberPermissions(0)`, which has no real meaning
in a DM since there are no guild permissions to check) **but this was reversed 2026-07-12** —
Harkirat explicitly asked to "activate the admin command so i can use them in DMs if i want," so it
now has the same `.setIntegrationTypes([1]).setContexts([0, 1, 2])` as every other command.
`setDefaultMemberPermissions(0)` still gates it in a guild; the `ALLOWED_ADMIN_ID` check in
`manage.js`'s `execute()` is what actually blocks anyone else, including in a DM where guild
permissions don't apply at all. **If you add a new public-facing command, add this line too, or
it'll have the same DM/user-install gap.**

## `/timestamp`'s style-select dropdown (de-duplicated)
Used to be a documented exception to the reuse pattern below — `index.js`'s `tsmenu|`
handler re-implemented both of `commands/timestamp.js`'s view layouts inline instead of
calling back into that file, because it needed to re-render an already-parsed timestamp
under a different style without re-running chrono (a relative input like "tomorrow"
would resolve to a different date if re-parsed later). The two copies drifted out of
sync across two separate redesigns before this got fixed. Now `timestamp.js`'s
`execute(interaction, overrideState)` accepts an optional second argument —
`{ unix, tz, queryInput, style }` — so `index.js` can pass in the already-known values
via a synthetic interaction instead of re-deriving them from slash command options, and
both code paths share one render implementation. If you add more ways to reach this
render logic in the future, extend `overrideState` rather than branching a third copy.

## The "synthetic interaction" pattern (button/select → reused slash command logic)
Several buttons and select menus re-invoke a slash command's own `execute()` function
instead of duplicating render logic (e.g. clicking "Draw Prices" in the nav bar calls
`drawprices.js`'s `execute()` the same way the slash command does). To make a
`ButtonInteraction`/`StringSelectMenuInteraction` look enough like the original
interaction for this to work, `index.js` builds a "synthetic interaction" via
`buildSyntheticInteraction(interaction, overrides)`.

**Do not replace this with a hand-rolled `Object.assign(Object.create(...), interaction, {...})`.**
discord.js sets `client` and `token` on every interaction via
`Object.defineProperty(this, 'client'/'token', { value })` with no `enumerable: true`.
`Object.assign` only copies *enumerable* own properties, so it silently drops both —
this caused two separate real crashes (`Cannot read properties of undefined (reading
'rest')` and a dropped-argument bug in the price-region dropdown) before the shared
helper was introduced. Always use `buildSyntheticInteraction`.

Also note: `ButtonInteraction`/`StringSelectMenuInteraction` have no `.options`
resolver at all — commands called this way get a stubbed `options` object with every
getter returning `null`, and check `interaction.isChatInputCommand()` before trusting
`interaction.options.getX()`.

## Database schema gotcha
Mongoose only persists fields **declared in the schema**. Several past bugs were
exactly this: code setting `doc.someNewField = x; await doc.save()` where
`someNewField` was never added to the Mongoose schema — it looked like it worked
(in-memory) but silently reverted on the next fresh fetch. **Whenever you add a new
field anywhere in the codebase, add it to the corresponding schema in `models/` in
the same change**, or it will not actually save.

## Data models (`models/`)
- `SeasonalData.js` — one global document (`docType: 'global'`). Holds
  `currentSeasonTitle`/`bpTitle`/`rankTitle`/`dmzTitle`, `bpEnd`/`rankEnd`/`dmzEnd`,
  `patchNotes[]` (title = season # & name, NOT "Balance Changes for..." — see
  patchnotes.js), `newDraws[]`/`returningDraws[]`, `calendar[]` (with `endDate`/
  `isOngoing` for "All Season" events).
- `UserPreference.js` — per-user. `seasonalVisibility` is a **shared** toggle
  covering `/season end`, `/draws`, `/patch notes`, `/calendar`, `/draw prices`
  together (Option A design decision — see below). `timestampVisibility`,
  `settingsVisibility`, `defaultRegion`, `loadoutVisibility` are each independent.
  `calendarEventFilter` (`'active'|'all'`, default `'all'`) backs `/calendar`'s
  "Show Active Events Only"/"Show All Events" toggle — deliberately NOT exposed in
  `/settings` (Harkirat's request); `/calendar`'s own button reads/writes it directly,
  it's the only place this field is ever touched. `accentColorStyle`
  (`'avatar'|'banner'|'preset'`, default `'avatar'`; `'default'` is the old value name
  for `'preset'`, still treated identically) plus the independently-cached
  `avatarColorHex`/`avatarColorSource` and `bannerColorHex`/`bannerColorSource` pairs
  back the accent color system — see below.
- `Loadout.js` — weapon loadouts, `mode: 'MP' | 'DMZ'` (MP max 5 attachments, DMZ max 9).
  `description` (optional flavor text) and `shareCode` (the actual copyable in-game Gunsmith
  code) were added during the builds.xlsx migration — see MP loadout system below for why
  `shareCode` is separate from `buildName` despite `/manage`'s modal labeling the latter
  "Build Name / Share Code". Has a compound index on `{ category: 1, mode: 1 }` — every
  autocomplete keystroke and every `/<category>` command filters on this pair together;
  harmless at the current collection size (~100-200 docs) but cheap to add ahead of it
  actually mattering.

## Design decision log (so you don't re-litigate these)
- **"Seasonal Content" visibility is one shared toggle (Option A)**, not five
  separate ones. Deliberately chosen over per-command granularity — if you're asked
  to add a 6th seasonal command, wire it to `prefs.seasonalVisibility` too, don't add
  a new field.
- **Admin dates are always UTC-0.** `adminParser.js`'s `parseAdminDate` forces
  `chrono.parseDate(str, new Date(), { timezone: 0 })` specifically to avoid
  depending on the host machine's local timezone/DST — a past bug (DMZ season-end
  showing 1 hour off) was traced to exactly this kind of local-timezone dependency.
  Don't reintroduce ambient-timezone parsing.
- **chrono-node defaults a bare date (no time-of-day given) to NOON, not midnight.**
  `timestampHelper.js`'s `generateTimestamps` (used by `/timestamp`) checks
  `parsedComponents.isCertain('hour')` and manually zeroes the time back to midnight
  in the target timezone when the user's input had no explicit time — otherwise
  something like `/timestamp datetime:july 17 timezone:UTC` silently came out as
  July 17 **noon** UTC. `adminParser.js`'s `parseAdminDate` was never affected by this
  (it already force-normalizes everything to midnight UTC unconditionally), so this
  was isolated to the user-facing command.
- **Bulk-import text formats are bullet/comma-delimited, not one-per-line JSON**,
  because Harkirat pastes from a notes app export. See `parseBulkDrawList` (comma-
  separated) and `parseBulkEvents` (bullet-separated, `M/D - M/D | Title` or
  `M/D - All Season | Title`) in `adminParser.js`. Titles in bulk imports are
  preserved verbatim (no auto title-casing) because CODM content is full of
  acronyms (MP/BR/DMZ) that naive title-casing mangles into "Mp"/"Br"/"Dmz".
  Because the whole line is comma-delimited, a date containing its own comma (e.g.
  "July 16, 2026") used to fracture across two fields and silently drop the year —
  `parseBulkDrawList` now re-merges a trailing bare-4-digit-year field back onto the
  previous field before parsing it as a date. Keep that in mind if you touch this
  parser: any fix here needs to stay comma-in-date-safe, not just comma-delimiter-safe.
  Per-item parsing (`[tier] Item Name` -> `{tier, name}`) is factored into
  `adminParser.js`'s exported `parseItemLine()`, shared by `parseBulkDrawList` and
  `index.js`'s single add-draw/edit-draw modal handlers — previously copy-pasted
  identically in all three places.
- **`/manage draws`'s bulk import is split into two independent flows — New and
  Returning each have their own modal** (`modal_draws_bulk_new` /
  `modal_draws_bulk_returning` in index.js, `parseBulkDrawList` in `adminParser.js`
  returns a flat array for whichever one category was submitted). This used to be ONE
  modal covering both, distinguished per-line by a leading `n `/`r ` prefix token, and
  a single submit replaced BOTH `newDraws` and `returningDraws` together — re-running
  the import to fix one typo in New Draws silently re-wrote Returning Draws too (even
  if unchanged content-wise, it reordered/re-saved it). Splitting means each submit
  only ever touches its own array. If you add a third draws-like category in the
  future, give it its own modal/custom_id rather than reintroducing a type-prefix line.
  `bulk-both` (added 2026-07-09) is NOT a reintroduction of that old combined flow — it's
  one modal with two independently-optional fields, and each field still only ever
  writes to its own array (a blank field leaves that array completely untouched), for
  the common case of wanting to update both categories without two round-trips.
- **Bulk imports REPLACE, they don't append.** `modal_draws_bulk_new`/
  `modal_draws_bulk_returning` each overwrite only their own array
  (`newDraws`/`returningDraws`), and `modal_calendar_bulk` (index.js) overwrites
  `calendar` wholesale rather than pushing onto the existing array. A bulk paste
  represents the complete current list for that category/season, so re-running it
  (e.g. to fix a typo) replaces the old entries instead of duplicating on top of them.
- **`toTitleCase` (`adminParser.js`) preserves already-uppercase acronyms, skips
  leading punctuation, AND capitalizes each side of a hyphen independently** rather than
  blanket-lowercasing the whole string first. The old implementation did
  `str.toLowerCase()` on the entire string, then re-capitalized only the character
  immediately after whitespace — that mangled "FSS Hurricane" into "Fss Hurricane"
  (acronym torn down), "(Operator)" into "(operator)" (the char after the space was "(",
  not a letter, so nothing got recapitalized), and "Blood-Red" into "Blood-red" (a
  hyphenated word is one whitespace-delimited token, so only its very first letter ever
  got capitalized). Now: each whitespace-delimited word is further split on its own
  hyphens, and each hyphen segment independently either gets preserved verbatim (if
  already fully uppercase, 2+ letters — an acronym like "FSS") or has its first actual
  *letter* capitalized, skipping over leading punctuation like `(`. Applies to draw/item
  titles in both the bulk parser and the single-add/edit modals in index.js.
- **"All Season" calendar events resolve their end date to `bpEnd`, not a literal
  "Ongoing" label.** The Battle Pass ending is what actually closes out an all-season
  event; `calendar.js` only falls back to showing "Ongoing" text if `bpEnd` hasn't been
  set yet.
- **The most recent `patchNotes[]` entry's title stays synced to `currentSeasonTitle`.**
  Older patch note entries keep their own historical title forever (so a past season's
  patch notes don't get renamed retroactively), but the entry representing the
  currently-live season needs to track the live season title — see index.js's
  `modal_season_titles_deadlines` handler (formerly `edit_season_titles`, merged with the old
  deadlines modal on 2026-07-09), which updates both when the admin renames a season.
  Separately, some entries created before the heading redesign still have the full
  legacy sentence ("Balance Changes for Season 6...") baked into their stored title
  instead of just the bare season name — `patchnotes.js`'s exported `cleanPatchTitle()`
  strips that prefix at every display site (heading, history dropdown, autocomplete in
  index.js) rather than requiring old DB entries to be edited by hand.
- **`/calendar`'s active/all events toggle button only appears if at least one event has
  actually ended.** Computed fresh on every render (not cached/stored) via
  `calendar.js`'s `isEventEnded()`/`hasEndedEvents` — if every event this season still
  ends in the future, "Active Only" and "All" would render an identical list, so the
  toggle (and its description line) are omitted entirely rather than shown doing
  visibly nothing. This was a real point of confusion during testing before the check
  existed — Harkirat toggled it, saw no change, and reasonably assumed it was broken,
  when actually the underlying filter logic was correct and there just wasn't anything
  to filter yet. Defaults to `'all'` for anyone without a saved preference. An "All
  Season" event only counts as ended once `bpEnd` is BOTH set AND passed (it has no
  fixed end of its own — see the next bullet); if `bpEnd` hasn't been configured yet,
  it's treated as still active rather than guessed at. The persisted choice lives in
  `UserPreference.calendarEventFilter` (see above).
- **`/season end`'s per-deadline heading went `## ` → `### ` → back to `## `.** It was
  originally one line combining emoji + season title + " ends..." at H2, which wrapped
  awkwardly on mobile; that got fixed by dropping to H3, which then felt visually
  smaller than the rest of the bot's uniform heading sizes. The real fix was moving
  "ends.../that's..." OFF the heading line entirely and onto the timestamp lines below
  it (`✦ **Ends...** <t:X:F>` / `✦ **That's...** <t:X:R>`) — the heading is now just
  `## {emoji} **{title}**`, short enough to never wrap, so it was safe to go back to the
  bigger H2 size without reintroducing the original wrapping bug.
- **`/draw prices` was rewritten (2026-07-11) to compute totals from raw pull arrays instead of
  hand-typing them** — the old `REGION_DATA`/`COMBO_NOTES` had repeated real math mistakes (found by
  cross-referencing against Harkirat's raw combo-notes export: a displayed total not matching its
  own draws curve, a wrong draw value, a typo'd draw value). Rather than keep fixing hand-typed
  totals one at a time, `commands/drawprices.js`'s `DRAW_DATA` now stores ONLY the per-pull CP
  numbers (`draws: [10, 30, 50, ...]`, optional `upgrade: {perDraw, count}`); `formatCP`/
  `arrowSequence`/`cumulativeSequence`/`buildDrawEntries` derive every total, arrow-joined sequence,
  and the "CP spent" running-cost line straight from that array at render time. A wrong number can
  now only ever exist in one place, and a total can never silently drift from its own draws again —
  verify this by re-running `buildContainer()` directly via `node -e` (dump the JSON, cross-check
  each total against its own `draws` sum) rather than hand-summing, if you touch this data again.
  - Expanded from 5 draw types to 10 (later 9 — see below) using a fresh verified data export from
    Harkirat (`drawprices2.txt`) — these used to live only as terse one-line `COMBO_NOTES` entries;
    now every draw type gets the same full per-pull breakdown.
  - The refreshed source itself had one arithmetic typo (`legendaryGunNonReactive.region_10` stated
    a total of 4,540 CP, but its own listed draws sum to 4,550 — matching what this file already had
    before the refresh) — kept the computed-correct 4,550 rather than trusting the source's typed
    total, per the same "always sum, never trust a hand-typed total" rule above.
  - "Mythic Character + Legendary Weapon Draw" and "Legendary Character + Legendary Weapon Draw" are
    each a single named in-game banner (not a bundle of two separate draws) — kept exactly as
    Harkirat named them rather than "simplifying," since that's the banner's real in-game name.
  - `doubleEpicCharacters.region_30` has no data yet (Harkirat's source explicitly says "pending
    data") — `buildDrawEntries` renders a "not yet available" placeholder for a missing region entry
    rather than fabricating a number.
  - **Second pass (2026-07-12, per `drawPrices_ui.json` — Harkirat's own hand-adjusted mockup of the
    whole command while working around a usage-limit outage):** dropped the two group headers
    (Mythic-Tier / Legendary & Epic-Tier) entirely in favor of one flat divider-separated sequence —
    `ENTRY_ORDER` replaces the old `MYTHIC_KEYS`/`OTHER_KEYS` split. Each entry's header dropped from
    a two-emoji tier+Epic combo icon to a single tier emoji (`TIER_ICON`). The quote-block total line
    switched to a second CP emoji (`emojis.cp2`, `CP_CODM2` — deliberately a different ID from
    `emojis.cp`, which stays as-is since nothing else was asked to move over) and gained a `\`X CP
    Draw\` + \`Y CP Upgrade\` = \`Z CP\`` format for the two mythic entries. The arrow-sequence line
    now ends with `= \`X CP\`` (draws-only total, never the grand total including upgrade). The
    cumulative line is now labeled `-# CP spent:` (was `-# Total spent per attempt:`). Upgrade entries
    gained an explicit `### Weapon Upgrade` / `### Character Upgrade` sub-heading with a spelled-out
    `570 CP × 10 Spins = \`5,700 CP\`` formula line (was a compact `-# Upgrade: ...` line).
    "Pick Your Reward Card Draw" renamed to "Pick Your Reward Card Legendary Weapon Draw" to match
    its real in-game banner name.
  - **"Legendary BR Vehicle Draw" was removed entirely in that same pass** — it's the one entry from
    the original 10 that doesn't appear anywhere in `drawPrices_ui.json`. Since Harkirat hand-built
    that mockup himself (not something we generated for him to review), its absence there is read as
    a deliberate cut rather than an oversight worth double-checking first. Its `altLast` mechanism (a
    Reactive/Non-Reactive split affecting only the final pull) was removed along with it — nothing
    else in `DRAW_DATA` ever used that field.
  - **The region select-menu became a single toggle button** (`toggle_price_region_10`/
    `toggle_price_region_30` in `index.js`), always labeled/IDed with the region you'd switch TO, with
    an animated `<a:Regions:1525705441072382052>` icon in the button's `emoji` field (never its
    `label` — see Components V2 point 4). Clicking it now persists the chosen region to
    `UserPreference.defaultRegion` before re-rendering — same persisted-toggle pattern as calendar's
    active/all events filter button — so a user's last-picked region becomes the default `/draw
    prices` lands on next time, same as `/settings`' own region toggle already did, just now
    reachable from the command's own UI too instead of only from `/settings`.
- **Color palette assignment follows nav button order** (Calendar, Draws, Draw Prices,
  Patch Notes, Season End — see the `globalNavigationRow` in any command), exact hex →
  decimal for `accent_color`: Police Blue `#355070` (3494000, **Calendar**, 1st) ·
  Chinese Violet `#6D597A` (7166330, **Draws**, 2nd) · China Rose `#B56576` (11887990,
  **Draw Prices**, 3rd) · Light Coral `#E56B6F` (15035247, **Patch Notes**, 4th) ·
  Tumbleweed `#EAAC8B` (15379595, **Season End**, 5th). These are each command's
  `PRESET_ACCENT` constant — see Accent color system below for when they're actually
  used vs. overridden. This mapping got rotated out of sync with the nav buttons once
  already (after the buttons themselves were reordered in an earlier session) — if the
  nav button order ever changes again, re-derive this mapping from scratch rather than
  assuming the existing `PRESET_ACCENT` values are still aligned to it.
- **`emojiMap.js`** is the single source of truth for emoji IDs (tiers, BP/rank/DMZ/CP
  icons, and the animated command-header icons). Reuse from there rather than
  hardcoding emoji strings inline in new code. Also exports `parseEmoji()` for
  converting a mention string into the `{id, name, animated}` shape a button's `emoji`
  field needs (see Components V2 point 4 above).

## Accent color system (`utils/accentColor.js`, `utils/colorExtract.js`)
Discord's legacy `accent_color`/`hexAccentColor` user field is only populated for
accounts with **no banner set** (the client shows one or the other) — it comes back
`null` for almost every active user, and Discord doesn't expose their newer Nitro
profile-theme colors over the bot API at all. So there's no reliable way to read a
user's "actual" profile color directly; instead we extract one ourselves:
- `colorExtract.js`'s `getDominantColor(url)` downloads an image (avatar or banner) via
  `jimp` and averages a ~2500-pixel sample of it into one hex value.
- **Avatar-matching is the actual default** (`accentColorStyle` schema default is
  `'avatar'`, not a "keep everything as-is" option) — Harkirat wanted every embed to
  match a user's avatar out of the box, not just `/settings`. `'preset'` (labeled
  "Pre-Designed Palette" in the `/settings` dropdown) is the opt-out that restores each
  command's own fixed brand color; `/settings` itself has no brand color of its own so
  it falls back to avatar even under `'preset'`.
- `accentColor.js`'s `resolveAccentColor()` resolves `prefs.accentColorStyle` accordingly,
  and `getAccentColorForCommand()` is what the 5 preset-color commands (calendar/draws/
  patchnotes/drawprices/seasonend) call. **It now creates-and-saves a `UserPreference`
  doc if the user doesn't have one yet at all** — before this, only `/settings` ever
  created that doc, so a user whose first-ever interaction was e.g. `/calendar` would
  have `prefs === null`, and the whole accent system (including the schema default)
  would silently never engage until they happened to run `/settings` first. Only
  `'preset'` skips the Discord user-object fetch; `'avatar'` (now the common case) always
  resolves+caches.
- Avatar and banner colors are cached **independently** on `UserPreference`
  (`avatarColorHex`/`avatarColorSource`, `bannerColorHex`/`bannerColorSource`) — a user
  might switch back and forth between styles, so both get remembered rather than
  invalidating one when the other changes. Each `*Source` field is the Discord image
  hash the cached hex was computed from; a fresh CDN download + re-extraction only
  happens if that specific image actually changed.

## Shared UI builders (`utils/titleBlock.js`, `utils/paginationRow.js`, `utils/globalNav.js`,
`utils/ephemeral.js`, `utils/sendV2Payload.js`)
Small helpers introduced when calendar/draws/patchnotes/drawprices(/seasonend/dmz) were redesigned
to a consistent look, specifically to avoid multiple copies of the same layout/logic drifting out
of sync the way the `/timestamp` duplication already has (see above):
- `buildTitleBlock(topLine, emoji, label)` — the two-line header pattern used by all
  four: the command's own animated-emoji header as the bigger `#` line FIRST, with a
  context line (season title, patch name, or CP region) styled via
  `toBoldItalicUnicode()` underneath it as a caption (reordered per Harkirat's request —
  originally the context line was on top). `toBoldItalicUnicode()` maps Latin letters to Unicode
  Mathematical Bold Italic codepoints (used instead of Discord markdown `***text***`
  because heading lines don't reliably render nested inline emphasis on every Discord
  client — real Unicode glyphs render identically everywhere), and wraps each run of
  digits in markdown italic (`*...*`) around Mathematical Bold digit codepoints (Unicode
  has no bold-italic digit variant, so this hybrid is the closest match to the
  surrounding bold-italic letters — e.g. "Season 6" -> "𝑺𝒆𝒂𝒔𝒐𝒏 *𝟔*"). Non-letter/digit
  characters (spaces, colons, em dashes) pass through unchanged.
  **`topLine` is deliberately NOT a real heading** (no leading `#`/`##`/`###`) — it used
  to be its own `### ` heading stacked directly above the `# ` emoji/label heading, but
  two adjacent headings in one Text Display each carry Discord's own heading-level
  vertical margin that doesn't collapse just because the source only has one `\n`
  between them, which showed up as a disproportionately large gap between the two
  lines. Dropping the `#` prefix removes that margin while `toBoldItalicUnicode()`
  keeps the same visual weight without literal heading markup.
- `buildPaginationRow({ totalChunks, currentPage, prevCustomId, nextCustomId,
  indicatorCustomId })` — the Prev/Next row used by `/calendar` and `/draws`' sub-page
  navigation: emoji-only Left/Right buttons (`emojiMap.js`'s `left`/`right`, no text
  label), a numbers-only page counter (no "Page" word). Returns `null` when
  `totalChunks <= 1` — **callers must check for that and skip pushing the row**, don't
  assume it's always safe to push directly. Reuse this for any future paginated command
  rather than hand-rolling another slightly-different prev/next row.
- `buildGlobalNavRow(activeCustomId)` — the 5-button Calendar/Draws/Draw Prices/Patch
  Notes/Season End row, used by all five of those commands. Used to be hand-copied
  nearly identically into each file, differing only in which button was styled as the
  active/disabled one — exactly the duplication shape that caused the accent-color
  palette to rotate out of sync with nav button order once already (see the color
  palette note above). Collapsing to one function means the button order/labels/
  custom_ids can only ever drift out of sync with themselves, not silently across 5
  separate files. If the nav button order or set of commands ever changes, this is the
  only place to update.
- `resolveEphemeral({ argPrivate, prefs, prefsField })` — the "explicit option > saved
  preference > default (public)" priority resolution, previously hand-rolled identically
  7 times across calendar/draws/patchnotes/drawprices/seasonend/dmz/index.js's MP
  loadout fallback, differing only in which `UserPreference` field to check
  (`seasonalVisibility` vs `loadoutVisibility`). One place to change the priority rule
  itself, instead of 7.
- `sendV2Payload(interaction, components, { content, flags, embeds, allowedMentions })` —
  the raw `rest.patch(Routes.webhookMessage(interaction.applicationId, interaction.token,
  '@original'))` bypass every Components V2 command needs (discord.js's high-level
  reply/followUp/update don't reliably serialize raw V2 JSON — no builder class exists
  for a type-17 Container), previously repeated verbatim at ~10 send sites. `flags`
  defaults to `32768` (Components V2) since that's the common case; pass an explicit
  override for the rare site that needs something else (e.g. `/timestamp`'s dropdown
  re-render, which has to manually re-OR in the ephemeral bit since that path doesn't go
  through a normal `deferReply()`, or `share_public`'s dynamically-computed flags after
  stripping the ephemeral bit from an existing message). `/timestamp`'s plain-text
  parse-error fallback (no components at all) is left as a raw call rather than forced
  through this helper — genuinely a different shape, not more duplication to collapse.

## Loadout commands (`/dmz`, `/all`, `/<category>`) have `build`/`private` options
All three accept an optional `build` (integer, 1-based, matching the "Build N of M" footer text —
clamped into range rather than rejected if out of bounds) to jump straight to a specific build
instead of always landing on the first and clicking Next repeatedly, and an optional `private`
boolean (same explicit-option > saved-`loadoutVisibility`-preference > default priority every other
command already uses) to land already-public/ephemeral in one shot. Added specifically so a user
doesn't have to rely on "Share Publicly" after the fact just to get the same result up front.

## MP loadout accent colors are per-weapon-category, not one fixed color
`utils/loadoutRender.js`'s `MP_CATEGORY_ACCENT` maps each `Loadout.category` value
(`AR`/`SMG`/`LMG`/`MARKSMAN`/`SNIPER`/`SHOTGUN`/`SECONDARIES`) to a color from the "Custom Class"
palette — a curated mix Harkirat picked across several palette proposals (see the palette spec
sheet artifact from that session; not a file in this repo). `getMpCategoryAccent(category)` looks
it up (case-insensitive, falls back to a neutral default `#2b2d31` if a category is ever
unrecognized). This is what makes `/all`'s accent color change depending on which weapon was
searched (e.g. a CX-9 result renders in SMG's color, an LK24 result in AR's) — `/all` isn't locked
to one category the way `/ar`/`/smg`/etc. are, so it resolves the color from the query result
itself (`mpBuilds[0].category`) rather than a fixed value. `/<category>` commands hit the exact
same lookup in the exact same shared handler (they're the same dynamically-generated fallback
route in index.js) — they just always land on the same entry since every result they can ever
return already shares one category. Applied at BOTH render sites: the initial slash-command
response AND the Prev/Next pagination re-render (`index.js`'s `dmz`/`mp`-prefixed button handler) —
missing the second one would have made paging between builds silently revert to the old flat
color. `/dmz` keeps its own separate fixed identity color (`#1c1c1c`), intentionally NOT part of
this MP-specific category mapping.

**`SECONDARIES` has no loadouts saved yet, but `/secondaries` is already registered as a command.**
`handleBotReady()`'s category-registration loop used to derive its command list purely from
`Loadout.distinct('category', {mode:'MP'})` — a category with zero entries would just never get a
command. Since Harkirat wants `/secondaries` ready to go the moment he starts adding those
loadouts (rather than it silently appearing only after the first one is saved), that distinct-query
result is now merged with a hardcoded `'SECONDARIES'` before the registration loop runs. If you add
another category ahead of its data existing, extend that same merge rather than waiting on real
loadouts to exist first.

## MP loadout system (`utils/loadoutRender.js`, `scripts/migrateBuildsToMongo.js`)
`builds.xlsx` used to be the sole source of truth for MP loadouts: a `loadBuildsFromExcel()` in
`index.js` parsed it into an in-memory object at boot, and `/all` + auto-generated `/<category>`
commands (`/ar`, `/lmg`, etc.) read from it directly. At some point autocomplete for those same
commands got rewired to query MongoDB's `Loadout` collection (`mode: 'MP'`) instead — but the data
itself was never migrated, and the actual render still read the old Excel object. Net effect: the
autocomplete dropdown (Mongo-backed, empty collection) showed nothing, and even a manually-typed
weapon name would have hit the still-Excel-backed render with an incompatible key scheme. Fixed by:
- Running `scripts/migrateBuildsToMongo.js` once to import all 106 rows / 58 unique weapons from
  `builds.xlsx` into `Loadout` (mode `'MP'`), grouping duplicate weapon-name rows into separate
  `buildName: "Build 1"/"Build 2"/...` documents. Safe to re-run (clears existing `mode:'MP'` docs
  first) if the spreadsheet is ever updated and needs re-importing.
- Removing `loadBuildsFromExcel()`/the in-memory `builds` object/`createBuildEmbed()` from
  `index.js` entirely — MP now reads from Mongo exclusively, same as DMZ.
- Moving the `/all`+`/<category>` command *registration* (not just autocomplete) into
  `handleBotReady()`, querying `Loadout.distinct('category', {mode:'MP'})` — this can't happen at
  module-load time anymore since it needs a DB round-trip. Safe even before the Mongo connection
  fully establishes: Mongoose buffers queries by default until connected, it doesn't throw.
- Extracting `buildImageUrl()`/`buildLoadoutCard()` into `utils/loadoutRender.js`, shared by
  `/dmz` and the new MP handler — `buildImageUrl` handles `imageKey` being EITHER a bare Cloudinary
  key (the original admin-added-loadout design, and what `migrateBuildsToMongo.js` extracts for
  104 of builds.xlsx's 106 rows — same Cloudinary account already used by `draws.js`) OR a full
  external URL. At the time of that migration, 2 rows (both LOCUS builds) were still imgur-hosted
  and needed this fallback; both were since re-uploaded to Cloudinary directly (2026-07-09) and
  their `imageKey`s updated to bare keys (`LOCUS-1`/`LOCUS-2`), so no current loadout actually
  exercises the full-URL path anymore — but `buildImageUrl()` still supports it, since `builds.xlsx`
  (and any future re-run of the migration script against it) could reintroduce an external-URL row.
  Don't assume every row is one or the other — check `ImageURL.startsWith(CLOUDINARY_BASE)` per row
  like the migration script does, rather than treating the whole sheet as one format.
- Discovering along the way that `buildName` was doing double duty as both the display label AND
  the "Copy Share Code" button's payload — which meant admin-added loadouts never had a real code,
  just whatever label was typed. Added a separate `shareCode` field (populated from the
  spreadsheet's actual `Code` column during migration) that the copy button now prefers, falling
  back to `buildName` for loadouts that don't have one.
- Discovering a second half-wired preference along the way: `/settings`' single "Weapon Builds"
  toggle writes to `prefs.loadoutVisibility`, but `/dmz` was checking a completely different field
  (`prefs.dmzVisibility`) that was never exposed in the `/settings` UI at all — so that toggle did
  nothing for `/dmz`, ever. Fixed `/dmz` to read `loadoutVisibility` (now shared with the new MP
  commands too, one toggle covering every loadout lookup, same Option A pattern as
  `seasonalVisibility`) and removed the dead `dmzVisibility` field entirely rather than leaving it
  as unreachable state.

`buildLoadoutCard()` was originally a legacy `EmbedBuilder` card (Harkirat's actual, older design —
category overline, bold weapon title, side-by-side "Attachments"/"Gunsmith Code" embed fields,
image, "Build N of M | Last updated" footer, Back/Next/Copy Code buttons). It got flattened into a
generic V2-styled card during the Mongo migration above, which was a real visual regression, not an
intentional redesign — rebuilt to match that original identity as closely as Components V2 allows.
**V2 has no equivalent to an embed's inline fields** — "Attachments" and "Gunsmith Code" stack
vertically now instead of sitting side-by-side; everything else (heading hierarchy, image, footer
line, button labels/order) matches. Since this card moved off `EmbedBuilder` entirely, its send
sites (`dmz.js`, the MP fallback and pagination handler in `index.js`) had to switch from
`interaction.followUp()`/`interaction.update()` to the same raw `rest.patch('@original')` bypass
every other V2 command already uses — discord.js's high-level methods don't reliably serialize raw
V2 JSON (there's no builder class for a type-17 Container). If you touch this card again, remember
`accent_color` needs a **decimal**, not a hex string like `EmbedBuilder.setColor()` took.

Buttons (pagination + Copy Attachments + Copy Code) live INSIDE the container now, not as a sibling
row — with a divider between them and the image/caption above, per Harkirat's request. Prev/Next
also switched to the shared Left/Right-emoji pagination style (`utils/paginationRow.js`) instead of
plain "Back"/"Next" text buttons, matching `/calendar` and `/draws`. Pagination + Copy Attachments +
Copy Code all share one row instead of separate ones — exactly 5 buttons in the worst case
(Left/counter/Right/Copy Attachments/Copy Code), right at Discord's per-row cap, so don't add a 6th
button here without splitting the row. "Share Publicly" is still its own row OUTSIDE the container
(unlike the other buttons), consistent with every other command.

**Card layout, second pass (per `loadouts_ui.json`):** weapon name is now the top `# ` heading, with
optional Meta/Best-in-category/Top-N-in-category "badges" directly below it as one bold line (see
`buildBadgesLine()`) — the category label that used to sit as a small overline above the weapon name
moved down into the footer instead (`{category} • Build N of M • Last updated <t:X:D>`).
"Attachments"/"Gunsmith Code" are real `### ` H3 headings now (not bold text), each attachment line
is backtick-wrapped, and the divider that used to sit between Gunsmith Code and the image was
removed entirely — the image now sits directly under whichever text block precedes it. Divider
`spacing` on this specific card is `1`, not the `2` used elsewhere in the bot (calendar/draws/etc.) —
intentional per this reference file, not an oversight. The optional flavor-text `description` sits
right below the top divider (above Attachments, was above the divider before) as a real Discord
blockquote (`> `) instead of italic text, run through `toSentenceCase()` first since admin-typed
descriptions aren't always capitalized correctly.
- **Badges** (`Loadout.isMeta` boolean + `Loadout.categoryRank` free-form string + `Loadout.isToxic`
  boolean) only render when actually granted — `buildBadgesLine()` returns `null` (nothing shown) if
  none are set. `categoryRank` is intentionally NOT a fixed `'best'|'top3'` enum — not every category
  tops out at exactly 3, so it stores `'best'` or `'top{N}'` (`'top3'`, `'top4'`, `'top5'`, ...), one
  field not two independent booleans, because "Best in category" and "Top N in category" are
  mutually exclusive tiers of the same ranking. `isToxic` ("Toxic" — Harkirat's term for an
  unbalanced/cheese pick) is a fully separate, independent flag — a build can be Toxic regardless of
  its Meta status or category rank (e.g. NA-45 is Toxic-only with no Meta/rank; Striker is
  Meta+Best+Toxic all at once), added after badges already existed once real data needed it. "Best",
  "Top N", and "Toxic" each use a DIFFERENT emoji (`emojiMap.js`'s `best`/`top`/`toxic`) — don't reuse
  one for another. Badges are joined with the `blank` spacer emoji between each granted badge,
  matching the reference file's exact spacing (no space before `blank`, one space after it).
- **`Loadout.dmzRangeRank` is the ONLY rank badge field DMZ builds ever use — `categoryRank` is
  never set for `mode: 'DMZ'`**, added 2026-07-09 once real DMZ badge data existed. `/dmz` has no
  per-category commands the way MP does (`/ar`, `/smg`, etc.), so a "Best AR"-style badge doesn't
  read as meaningfully there. `dmzRangeRank` stores either a bare `'best'`/`'top{N}'` (renders as
  "Best DMZ"/"Top N DMZ" when no combat range role applies — e.g. Type 19, SO-14) or a range-role-
  qualified `'best-close'`/`'best-midlong'`/`'top{N}-close'`/`'top{N}-midlong'` (e.g. Fennec is
  "Best Close Range", AS VAL is "Best Mid-Long Range") — same non-enum, parser-validated pattern as
  `categoryRank`. `buildBadgesLine()` branches entirely on `mode === 'DMZ'`: DMZ builds only ever
  read `dmzRangeRank`, MP builds only ever read `categoryRank`, reusing the same Best/Top emojis
  either way — no new emoji assets needed. In `index.js`'s add/edit-loadout handlers, a plain
  `best`/`topN` admin input still parses into `categoryRank` first (the parser doesn't know mode),
  then gets rerouted into `dmzRangeRank` (and `categoryRank` cleared) if the loadout's mode is DMZ.
  Admin input tokens: `best`, `top3`, `bestclose`, `bestmidlong`, `top3close`, `top5midlong` (no
  space before "close"/"midlong", unlike `topN`'s optional space).
- **Admin input for badges rides along on the existing "Category | Badges" modal field** as a 2nd
  pipe-delimited segment (`"AR | meta,best"`, `"AR | meta,top5"`, or `"AR | meta,best,toxic"`)
  rather than getting its own field — `/manage`'s add/edit-loadout modals already use all 5 of
  Discord's per-modal field slots, so there was no room for a dedicated badges input. This field
  used to be "Category | Mode | Badges" (3 segments) before the 2026-07-12 redesign split MP/DMZ
  into separate pages — Mode no longer needs its own segment since the button itself is already
  mode-scoped (add reads it from which page you clicked; edit reads it straight off the existing
  document, since there's no "move this loadout to the other mode" action). `adminParser.js`'s
  `parseLoadoutBadges()` parses comma-separated, case-insensitive
  tokens (`meta`, `best`, `toxic`, `topN` in any spacing like `top 5`) and returns any tokens it
  didn't recognize (e.g. a typo like `bset`) so the admin gets told exactly what didn't apply,
  instead of a badge silently failing to save with no feedback. The edit modal reconstructs the
  current badges token list from the DB so re-opening it to change something unrelated doesn't
  silently clear existing badges.
- **Badges are a weapon-level property, not a per-build one.** Editing one build's badges via
  `edit_loadout_` now propagates the same `isMeta`/`categoryRank`/`isToxic` to every OTHER build
  sharing that weaponKey+mode (`Loadout.updateMany(...)`) — setting "Meta" while editing Build 1 used
  to leave Build 2/3 of the same weapon showing no badge at all. This propagation only happens on
  **edit**, not on **add** — the add-loadout modal has nothing pre-filled, so a blank badges field
  there (the common case when just adding another build variant) would silently wipe existing
  siblings' badges. Re-editing an existing build is the supported way to (re)sync badges across a
  weapon's builds; adding a new build doesn't currently inherit them automatically.
- **`scripts/applyBadgesBulk.js`** is a one-off/re-runnable bulk badge importer — Harkirat pastes a
  full weapon→badge list (grouped by category) instead of editing every loadout individually via
  `/manage`. Matches each entry as a fuzzy substring of the stored `weaponKey` (scoped to the
  category it's listed under, via `utils/search.js`'s `normalizeForSearch`), and propagates to every
  build of that weapon the same way the `edit_loadout_` handler does. Weapons with no loadout saved
  yet (e.g. Bal-27, FSS Hurricane, Pharo, and everything under SECONDARIES as of 2026-07-08) are
  reported as unmatched rather than silently skipped — re-run once those loadouts actually exist.
- **Loadouts bulk-add's text format is one loadout per block, blocks separated by a blank line**,
  header line `Weapon | Category | Mode | Build Name | ImageKey | ShareCode | Badges` followed by
  attachment lines (see `adminParser.js`'s `parseBulkLoadoutList()`). Only Weapon/Category/Mode are
  required — the rest are optional trailing pipe segments. Mode is STILL a header field here (unlike
  the single-add modal, which dropped its own Mode segment) purely so `parseBulkLoadoutList()`
  didn't need touching in the 2026-07-12 MP/DMZ page split — `index.js`'s submit handler
  force-overrides every parsed entry's `mode` to match whichever page (MP or DMZ) the modal was
  opened from regardless of what's typed there, so this is now redundant-but-harmless rather than a
  real "which collection does this go in" decision. **This bulk-add upserts by
  `{weaponKey, mode, buildName}` — it never wholesale-replaces the `Loadout` collection** the way
  the draws/calendar bulk-adds replace their whole array; doing that here would wipe every loadout
  in the database. A block matching an existing build updates it in place; otherwise it's inserted,
  and weapon-level badges still propagate to sibling builds afterward via `Loadout.updateMany`, same
  as `edit_loadout_`. The Loadouts page's "Replace Multiple" button currently routes into this exact
  same modal/handler too (see the `/manage` deferred-work note above) — its upsert behavior already
  covers replace semantics for anything pasted back in.
- **Bulk-remove/Bulk-delete (draws/calendar/loadouts) all fuzzy-match by name rather than requiring
  an exact match or a database ID**, added 2026-07-09 as the first bulk-removal capability the bot
  has ever had. Reuses `utils/search.js`'s `fuzzyMatch` — same punctuation-insensitive matching as
  every autocomplete route — and reports both what was removed and what didn't match anything, so a
  typo'd title doesn't just silently do nothing. Loadout bulk-delete lines are `Weapon` (removes
  every build of that weapon, scoped to whichever MP/DMZ page the modal was opened from) or
  `Weapon | Build Name` (removes just that one build) — dropped their own Mode segment in the
  2026-07-12 redesign for the same reason single-add/edit did.
- **"Copy Attachments"** is a new button next to Copy Code, replying with the plain attachment list
  (one per line, no bullets/backticks/formatting — meant to be pasted straight into Gunsmith)
  ephemeral, same mechanism as Copy Code. Handled by the `copyatt` action in index.js's shared
  `dmz`/`mp`-prefixed button router, alongside the existing `copy`/`next`/`prev` actions.

## Autocomplete search is punctuation/whitespace-insensitive, not just substring (`utils/search.js`)
Every autocomplete route in the bot (loadout weapon search across `/dmz`/`/all`/`/<category>`,
`/patch notes`' version search) used a plain `.includes()` (or an equivalent raw Mongo `$regex`),
which requires the typed query to appear as one literal, contiguous substring of the stored name —
so typing `dlq` never matched `DL Q33`, since the space between "DL" and "Q33" breaks that literal
character sequence. `fuzzyMatch()` strips spaces/hyphens/underscores/periods from both sides before
comparing, which fixes that whole class of miss (also covers `cx9` matching `CX-9`) without going as
far as true fuzzy/subsequence matching (skipping letters), which would start returning noisy,
hard-to-predict matches for a dataset this size.

**`/manage` has no autocomplete options at all** — its Edit/Delete panel actions collect a search
query through a one-field modal instead (see the Command architecture section above), since a
button can't autocomplete like a slash-command option could. That modal-submit handler
(`index.js`'s `resolveManagePanelMatches()`) reuses the exact same `fuzzyMatch()` convention as
every autocomplete route above — same matching behavior, just triggered by a modal submit instead
of a live-typed option.

## This bot is user-installed only — it is NEVER a guild member with roles/permissions
`Dior's Builds` runs entirely as a user-installed app (`setIntegrationTypes([1])` on every
public-facing command). It is never added to any server as a bot with a role, so it has **zero
standing guild permissions** — no View Channel, no Send Messages, nothing — in any server it
responds in. The only reason it can respond to a slash command in a guild at all is Discord's
interaction-response webhook system (`deferReply`/`deferUpdate` + editing `@original` via the
interaction token), which is authorized per-interaction and doesn't check normal channel
permissions. **Any code that tries to act on a channel a different way — a raw bot-token REST call
like `rest.post(Routes.channelMessages(channelId))`, or anything else that isn't answering an
interaction — will fail with `DiscordAPIError[50001] Missing Access`,** because that path DOES
require real channel permissions this bot will never have. This bit "Share Publicly" for exactly
that reason (see below) — if you add a feature that needs to independently post/edit/react in a
channel outside of directly responding to the interaction that triggered it, it needs to go through
this same interaction-response mechanism (a `deferReply`/`followUp` on that interaction), not a
generic bot-token channel call.

## "Share Publicly" (`utils/shareButton.js`)
Every ephemeral response across the bot gets one extra button appended below its existing
components: clicking it answers that button click with the exact same content as a public message.
The mechanism is simpler than it sounds — **Discord includes the full original message
(content/embeds/components) directly in a button click's own interaction payload, even when that
message is ephemeral.** There's no need to store or reconstruct any state: `index.js`'s
`share_public` handler just reads `interaction.message`, strips the `EPHEMERAL` flag (64) and the
share button's own row, then answers the button click itself with a non-ephemeral
`deferReply()` + `rest.patch('@original')` — everything else intact, including any
dropdowns/pagination buttons the original had, which keep working on the public copy since they're
already all stateless (`tsmenu|...`, `calsubpage_N`, etc. encode everything they need in their own
`custom_id`).

**This used to POST a brand-new message directly to the channel via `rest.post(Routes.
channelMessages(...))` using the bot's own token — found live to fail with `DiscordAPIError[50001]
Missing Access`** the moment it was tested in a real server channel, precisely because of this
bot's user-installed-only nature (see above): that raw channel POST needs real Send Messages
permission this bot never has. Fixed by routing through the interaction-response mechanism instead
(answering the button's own interaction, non-ephemeral) — works everywhere the bot can already
respond to a command, no channel permissions to check or configure, and one message instead of two
(no separate "✅ Shared publicly below!" confirmation needed anymore — the response IS the public
copy). This also means Share Publicly can't work in a context the bot can't respond in at all
(shouldn't come up in practice), and a Group DM only works if the bot's actually been added to it.
- `withShareButton(components, isEphemeral)` is what every command calls at the point it builds its
  final payload — appends a **new** action row (never packed into an existing row) specifically so
  commands whose nav row is already at Discord's 5-button cap don't need special-casing.
- Every command with an ephemeral option now threads `isEphemeral` through to wherever its final
  payload gets built (`buildContainer()` for calendar/draws/drawprices/patchnotes, inline for
  seasonend, `buildLoadoutCard()` for dmz/MP, and settings.js's own payload). Any RE-RENDER path
  (pagination, dropdowns, region-swap) needs this too, or the button silently disappears after the
  first interaction — `/timestamp`'s dropdown-driven re-render is the one exception that couldn't
  just re-derive it from `prefs` (it skips normal option-resolution entirely via `overrideState`),
  so `index.js` explicitly reads `interaction.message.flags` and passes `ephemeral` through
  alongside `unix`/`tz`/`queryInput`/`style`. The DMZ/MP pagination handler does the same for the
  same reason (editing an existing message, no `execute()` re-run to re-resolve prefs from).
- If you add a new ephemeral-capable command, remember: (1) call `withShareButton` on the final
  components array, (2) make sure every re-render path (not just the initial slash command) also
  gets `isEphemeral` passed through correctly.

## Draw thumbnail Cloudinary cache (`utils/cloudinaryCache.js`)
Draw thumbnail URLs are often hosted externally (Facebook, etc.), and those platforms sometimes
remove/expire the image later, leaving a broken "image failed to load" placeholder in `/draws`.
Built 2026-07-12 to re-host every provided thumbnail into this bot's own Cloudinary account
(folder `temp_draws/`, same account `/dmz`/MP loadouts already use — cloud name `dr6dn61eh`) so the
command keeps working even after the original source goes dark. This is the first place in the bot
that actually calls Cloudinary's upload/delete API itself — `utils/loadoutRender.js`'s existing
Cloudinary usage only ever builds URL strings for images an admin already uploaded by hand.
- **Cloudinary has NO native per-asset TTL/auto-expiry** — confirmed against the current
  `cloudinary_npm` docs before building this (don't assume otherwise if you revisit it). "Auto-delete
  after 45 days" is therefore something THIS bot does on a schedule
  (`pruneExpiredThumbnails`, called from `index.js`'s `runCloudinaryCleanup()` on boot + every 24h
  via `setInterval`), not a Cloudinary feature being configured.
- **Upload is remote-URL-to-remote-URL** — `cloudinary.uploader.upload(sourceUrl, {...})` hands
  Cloudinary the external URL directly; Cloudinary fetches the bytes server-side, the bot never
  downloads the image itself. `overwrite: true` + `invalidate: true` means re-adding/replacing a
  draw with a NEW url replaces the cached file in place (same `public_id`, derived from
  `slugify(title)`) with no separate delete step needed first.
- **Thumbnail URL is now OPTIONAL everywhere it's entered** (single add/edit modals in `manage.js`,
  and the bulk paste format in `adminParser.js`'s `parseBulkDrawList`) — a blank/omitted URL means
  "reuse whatever's already cached in Cloudinary for this exact draw title" (Harkirat's spec: "if
  the url field is not provided again... automatically use that"). `utils/cloudinaryCache.js`'s
  `resolveThumbnail(title, providedUrl)` is the one entry point every draw-save site in `index.js`
  calls (6 sites: single add/edit, bulk add/replace new+returning, bulk add/replace both) — it never
  throws, always resolves, and returns `{ url, cached, error, reused }` so callers can tell a
  successful cache from a fallback from a hard failure.
  - Provided a URL + caching succeeds → cached Cloudinary URL.
  - Provided a URL + caching fails (source already dead, network hiccup, etc.) → falls back to the
    raw URL as typed, so the draw still saves — a Cloudinary hiccup must never block an admin action,
    that's the opposite of what this feature is for.
  - No URL + a cache hit exists → reuses the cached URL.
  - No URL + no cache hit at all → `url: null`, and this IS treated as a real validation error by
    every caller (the draw needs *some* thumbnail to render at all) — single add/edit rejects the
    submission with a clear message; bulk routes skip just that one entry and report it by name in
    the confirmation, rather than silently saving a draw with a broken/missing image field.
- **Bulk-paste URL detection is a space heuristic, not a stricter format change.** Every date this
  bot's admin flows accept ("July 15", "August 5, 2026") contains a space; a URL or bare Cloudinary
  key never does. `adminParser.js`'s `looksLikeUrlOrKey()` pops the trailing comma-field as a URL
  only if it has no space AND isn't a bare 4-digit year (which also has no space, and is the
  comma-split tail of a "Month Day, Year" date — see the existing year-merge-back logic right below
  it). Verified against all 4 combinations (URL/no-URL × plain-date/comma-year-date) before shipping.
- **Cleanup rule is 45+ days old AND orphaned, not a strict age cutoff** (Harkirat's confirmed
  choice) — `pruneExpiredThumbnails(currentUrls)` only deletes a cached asset if it's both past the
  45-day window AND no current draw's `thumbnailUrl` still points at it. `currentUrls` is built by
  the caller (`index.js`, from `SeasonalData.newDraws`/`returningDraws`) — `cloudinaryCache.js` stays
  model-agnostic, matching every other file in `utils/`. A long-lived draw's image is never at risk
  just because it's been up for a while.
- **SECURITY: never log a raw Cloudinary error object.** Caught live during review before this ever
  shipped — the Admin API's rejected-promise shape is
  `{ request_options: { auth: 'api_key:api_secret', ... }, error: { message, http_code } }`, so
  `console.error('...', err)` (or any fallback like `err.message || err`, which still logs the whole
  object when `.message` is absent) prints the account's live API key AND secret in plaintext to the
  console/log aggregator. `cloudinaryCache.js`'s `safeErrorMessage(err)`/`errorHttpCode(err)` are the
  ONLY sanctioned way to read a Cloudinary error anywhere in this module (the upload API's errors
  carry `.message`/`.http_code` directly; the Admin API's, used by `getCachedUrl`, nest them one
  level under `.error` instead — checking only the top-level shape silently mis-detected every
  "not yet cached" 404 as a real error too, logging the credential-bearing object on every single
  cache-miss lookup until this was fixed). Every Cloudinary call in this file has its error caught
  and sanitized IN this file — none of it is left to escape to a caller that doesn't know to
  sanitize it (verified by wrapping `pruneExpiredThumbnails`'s entire body, not just the delete
  call — `listCachedAssets()` had no try/catch of its own and could have leaked the same way).
- Package: `cloudinary` (npm, added 2026-07-12) — auto-configures itself from the existing
  `CLOUDINARY_URL` env var the moment it's required, no explicit `cloudinary.config()` call needed.
  Already present in both local `.env` and Railway's production variables.

## Known open issues (not yet fixed — flagged, not silently patched)
- `calendar.js` and `draws.js` both have defensive component-count chunking;
  `patchnotes.js`'s media carousel does not (untested at scale — likely fine since
  patch note screenshots per entry are usually few, but not empirically verified
  the way draws/calendar chunking was).

## Next planned work
- **The real "search + multi-select" flow for Delete Multiple (all entities) and Loadouts' Replace
  Multiple** — deliberately deferred out of the 2026-07-12 `/manage` panel redesign at Harkirat's
  explicit request, to avoid risking a usage-limit interruption mid-build on top of everything else
  in that pass. See the `/manage` design-decision-log entry above for exactly what's a placeholder
  right now vs. what the real version needs to do.
- Not yet verified: Harkirat manually exercising every `/manage` panel action, and the new
  Cloudinary-cache add/edit/bulk flows, live in Discord post-redesign.
