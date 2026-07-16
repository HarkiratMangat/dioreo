# Dior's Builds — CODM Discord Bot

## What this is
A Discord bot for Call of Duty Mobile (CODM) content: lucky draw info, patch notes,
seasonal calendars, CP pricing, weapon loadouts, and countdown timers. Built and
maintained by Harkirat (Discord ID `1139845545754632283`), the sole admin.

**Before doing anything else this session, read `~/.claude/projects/-Applications-Diors-Builds/
memory/user_working_agreement.md`** (start of `MEMORY.md`'s index) — it's the living summary of
how Harkirat works and what this project expects, with links to every other memory file. This
CLAUDE.md is the deepest source of truth for architecture/design decisions; that file is the
collaboration layer on top of it.

**⚠️ Canonical memory path — `~/.claude/projects/-Applications-Diors-Builds/memory/` (26 files).**
Always read AND write memory there, regardless of what the session prompt suggests. Harkirat relocated
the repo to `/Applications/Claude Code/Diors-Builds` on 2026-07-14, and the harness derives a session's
project folder from the repo path — so it now points sessions at
`~/.claude/projects/-Applications-Claude-Code-Diors-Builds/`.
- **Be precise about what does and doesn't exist there** (verified 2026-07-15): that project folder DOES
  exist — the harness created it and writes this repo's session transcripts/tool-results into it. But it
  contains **no `memory/` subdirectory**, and must never get one. The real 26-file store lives only at
  the `-Applications-Diors-Builds` slug above. Don't read "the folder exists" as evidence this note is
  stale and go migrating.
- **This is a deliberate decision, not an unfixed bug — do NOT "correct" it by moving memory to match
  the repo path** (decided with Harkirat 2026-07-15). The harness slug is derived from the repo's
  location, so memory that follows the slug breaks on EVERY future folder move and needs re-migrating
  each time. A fixed, explicitly-named store makes repo moves irrelevant. The only cost is this note,
  which is cheap and now auto-loads via `SESSION-START.md`.
- If it's ever genuinely migrated anyway, move all 26 files at once and update this note, the working
  agreement, and `SESSION-START.md` together — never let two stores exist.

## Local-only files & the `local/` folder
`local/` (repo root, **gitignored** — added 2026-07-14) is Harkirat's personal scratch folder for
random local-only files: the `project plan notes.txt` future-planning dump lives there, and anything
else he drops in for our working use. It's never pushed to GitHub and never deployed. Other existing
local-only (gitignored) files: `CHANGELOG.md`, `CHANGELOG-SUMMARY.md`, `DEVLOG.md`, `SESSION-START.md`,
`.env`. When Harkirat references "the plan notes" / a file he "threw in there," check `local/` first.

## Stack
- discord.js v14 (`^14.26.4`), Node.js v26, run locally on a Mac (`node index.js`)
- MongoDB Atlas via Mongoose
- `chrono-node` for natural-language date parsing (admin input)
- `dayjs` (+ utc/timezone plugins) for user-facing timestamp conversion
- `jimp` for accent-color extraction (pure JS, no native binary — see Accent color system below)
- `ffmpeg` (system binary, not an npm package — must be on `PATH`) — `utils/stillFrame.js` uses it
  to pull one still frame from APNG/animated sources Jimp can't decode (avatar decorations), for the
  View Colors panel and `'dynamicProfile'` accent style. Confirmed present on this Mac already; not
  guaranteed on every host — if it's ever missing, still-frame extraction (and only that — every
  other image path in the bot is unaffected) fails loudly rather than silently producing garbage.
- `color-namer` (added 2026-07-13) — pure JS, only depends on `chroma-js`; used by the View Colors
  panel to turn an extracted hex into a real name ("Royal Blue") via its `'ntc'` palette. Checked via
  `npm audit` before adding — zero NEW vulnerabilities (only the pre-existing discord.js/undici/xlsx
  ones already tracked in memory as deferred).
- `cloudinary` (added 2026-07-12) — draw thumbnail caching (`utils/cloudinaryCache.js`); auto-reads
  the existing `CLOUDINARY_URL` env var on require, no explicit config call needed. Also backs patch
  notes' own season-based image cache (`utils/patchNotesCache.js`, shipped 2026-07-13) on the same
  account, separate folder/retention rules — see the Patch Notes Cloudinary caching note further
  down rather than duplicating the design here.
- `xlsx` — NOT used at bot runtime anymore (see MP loadout system below); only referenced by
  `scripts/migrateBuildsToMongo.js`, a one-time/re-runnable migration tool, not something the
  bot itself ever calls.
- Pushed to GitHub (`origin/main`). **Render is git-connected auto-deploy** (a push to `main`
  triggers it, no separate CI/CD pipeline) — **Railway is NOT connected to a git source at all**
  (confirmed 2026-07-12 via `railway status --json`: the `diors-builds` service's `source` is
  `{ image: null, repo: null }` — it's deployed purely from local CLI snapshot uploads, there's no
  auto-deploy toggle to flip because there's nothing to auto-deploy from). Harkirat was explicitly
  asked whether to connect it to the GitHub repo (`connect_service_source` MCP tool can do this) and
  said no, leave it CLI-only — don't connect it without asking again first, this was a deliberate
  choice, not an oversight. Railway needs an explicit `railway up --detach` from this repo's root
  after every push meant to reach it — don't assume a `git push` alone puts new code on Railway;
  verify via `railway logs --deployment` (checks the boot-banner timestamp) or `railway status`
  before trusting it's live.
- **Railway's free tier blocks CLI deploys (`railway up`) during peak hours, 8 AM–8 PM
  America/New_York** (confirmed live 2026-07-12: `railway up --detach` returned "Free-tier deploys
  to us-east4-eqdc4a are not available during peak hours... upgrade your plan" instead of deploying)
  — if a deploy is needed during that window, it has to wait until after 8 PM ET or the plan needs
  upgrading; there's no workaround on the current tier. Keep the local instance running as the
  fallback until an off-peak deploy actually goes through and is verified live.
- **Render suspend/resume: the `render` CLI (v2.21.0) has no `suspend` subcommand at all** —
  confirmed via `--help` on every relevant command (`render services`, `render services update`,
  etc.) and the `render-cli` skill's own docs; don't waste time guessing at CLI flag names for this,
  it isn't there. The only way to suspend/resume is Render's REST API directly:
  `POST https://api.render.com/v1/services/{serviceId}/suspend` (and `.../resume`), auth'd with
  `Authorization: Bearer $RENDER_API_KEY`. **`RENDER_API_KEY` already lives in this project's own
  `.env`** (same file `BOT_TOKEN`/`CLOUDINARY_URL` live in) — `grep "^RENDER_API_KEY=" .env` is all
  that's needed to get it for a `curl` call; don't go looking anywhere else for it. Specifically:
  reading `~/.render/cli.yaml` (the CLI's own personal cross-project OAuth session file, which lives
  *outside* this project directory entirely) to extract a token for this same purpose was correctly
  blocked by the safety classifier as credential exploration — a project's own `.env` is a normal,
  already-in-scope file for working in this repo; a personal `~/.` config file outside the project is
  a meaningfully different, more sensitive thing to go digging through, even for the same end goal.
  `diors-builds`' service ID is `srv-d850b2og4nts73fhpfog` (Ohio region, `dashboard.render.com/web/
  srv-d850b2og4nts73fhpfog`) — confirmed via `render services --output json`.

## Version tagging (added 2026-07-16)
The `vMAJOR.MODERATE.MINOR` convention itself is defined in `SESSION-START.md` (gitignored,
canonical source — don't duplicate the full rules here), including the existing "ONE version per
PUSH, not per commit" rule and `CHANGELOG.md`'s "Unreleased" section with a proposed number. What's
new: **each real push's version now also gets an actual git tag** (e.g. `v2.18.1`), complementing
(not replacing) that existing system — the CHANGELOG's proposed number is the human-readable plan,
the tag is the permanent, unambiguous marker once it's real. This makes `git describe --tags` give
free, zero-maintenance visibility into exactly what's committed-but-unpushed since the last real
push.

**Backfilled tags: `v2.17.3` (`426a444`), `v2.18.0` (`5c403a7`), and `v2.18.1` (`1600b8e`)** — found
by cross-checking `CHANGELOG.md` directly against `git log`, not by guessing from commit messages
alone (an earlier pass here missed `v2.18.1` entirely — it bundles 3 commits, `f7b4575`/`c4b1c19`/
`1600b8e`, pushed together as one version per the existing "one push, one number" rule, and none of
the 3 commit messages themselves say "v2.18.1"). Confirmed via `git describe --tags` after tagging:
`v2.18.1-1-gcf6cad7` — exactly matches `git status`'s "ahead of origin by 1 commit," i.e. only the
current HEAD is genuinely unreleased. **Deliberately did NOT backfill further back than v2.17.3.**
Most of this repo's ~40+ earlier version bumps span date-grouped ranges in `CHANGELOG.md` without
an unambiguous 1:1 commit mapping (e.g. five separate bumps all dated one day) — tagging those
would mean guessing, and a wrong permanent tag is worse than no tag. If a clean historical mapping
is ever worked out, backfill then; until that's actually done, treat pre-`v2.17.3` history as
untagged by design, not an oversight.

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

## Panel interaction locks — `/manage` (admin-only) and `/settings` (author + 15-min expiry) (2026-07-14)
Two separate gaps, fixed the same session: `/manage`'s own slash-command `execute()` only ever
checked `ALLOWED_ADMIN_ID` once, at initial invocation — none of the ~25 button/select/modal-submit
handlers the panel spawns re-checked who was clicking, so anyone who could see the message (run
non-ephemeral via `hidden:false`, or just present in the channel) could press its buttons and mutate
bot data. `/settings` had NO author-lock at all on some of its own components (`set_page_` carried no
`userId` whatsoever) and no expiry mechanism existed anywhere in the bot.

- **`/manage` fix: one centralized guard**, not per-handler patches. Right after the anti-spam block
  at the top of `interactionCreate` (`index.js`), before any routing happens: if the interaction is a
  button/select/modal-submit AND its `customId` starts with one of `/manage`'s own prefixes (`mng_`,
  `modal_`, `add_loadout_`, `edit_loadout_`, `edit_calendar_`, `edit_draw_`, `add_draw_` — every
  prefix `/manage` has ever generated, enumerated directly from the code, not guessed) AND
  `interaction.user.id !== ALLOWED_ADMIN_ID`, it replies ephemeral access-denied and returns before
  reaching any handler. `ALLOWED_ADMIN_ID` is now exported from `commands/manage.js` (was previously
  only a local const) so there's exactly one source of truth, not a second hardcoded literal. This
  choke point is self-maintaining — any FUTURE manage action automatically gets covered as long as it
  keeps using one of these same prefixes, which every manage action always has. Deliberately scoped to
  ONLY these prefixes so `/settings`, `/colors`, draws/calendar pagination, etc. are completely
  unaffected — this is not a bot-wide button lock.
- **`/settings` fix: stateless expiry encoded directly in the custom_id**, not a Map. Considered a
  `messageId -> {userId, expiresAt}` Map (mirroring `manageUndoStore`'s pattern) but rejected it —
  populating it on the VERY FIRST render would need an extra `interaction.fetchReply()` call just to
  learn the message id (the same "hard design problem" `dynamicProfile`'s message-id caching hit, see
  the accent color section below), and a Map resets on every redeploy. Instead every custom_id
  `settings.js` builds (`toggle_*`, `set_*`, `set_page_`, `colors_view`) carries the deadline as its
  own pipe segment — same "stateless" convention `tsmenu`/`price_subpage_` already use. Computed ONCE
  per genuine `/settings` invocation (`SETTINGS_PANEL_TTL_MS = 15 * 60 * 1000`, `settings.js`'s
  `execute(interaction, pageOverride, expiresAtOverride)` — new 3rd param) and threaded through
  unchanged on every re-render, so clicking around the panel never extends the clock; the 15 minutes
  is anchored to the original command, not a sliding window. Every settings-owned handler in
  `index.js` (`toggle_`, generic `set_`, `set_page_`) checks identity first, then
  `Date.now() > parseInt(expiresAtStr, 10)`, replying "run `/settings` again" if expired — and passes
  the SAME `expiresAtStr` back into its own re-render call rather than letting a fresh one get minted.
  **`colors_view` (the "View Colors" button that lives ON the settings panel) gets the expiry check
  too**, since it's still a settings component — but the brand-NEW colors panel message it opens keeps
  its existing separate `|userId` lock with NO timeout of its own (Harkirat's explicit "/settings
  only" call, since `colors_page_`/`colors_subpage_`/`colors_refresh_` back BOTH `/settings`' button
  AND the standalone `/colors` command sharing identical code — locking those would've silently
  changed `/colors` too). `set_page_` also needed a real `flags: 0`-style fix of its own: its
  custom_id used to be a bare `set_page_{N}` with no pipe segments at all, so adding `|userId|expiresAt`
  required switching its parsing from a blind `.replace('set_page_', '')` to a proper `.split('|')`.

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

### `/timestamp`'s `format` option — Embed or plain Text (2026-07-14)
New slash-command-exclusive `format` string option (`embed`/`text`, default `embed`) — deliberately
NOT saved to `/settings`/`UserPreference`, since Harkirat wanted this purely a per-invocation choice.
Works identically for the All Formats overview and every individual style view. Text mode reuses the
exact same content strings the embed view builds (`headingLine`/`linesBlock`/`parsedLine`/`hintLine`,
computed once and consumed by both branches so there's no drift between the two) but sends them as
plain message `content` instead of wrapping them in a type-17 Container — no `accent_color`, and a
blank line stands in for the type-14 divider component (plain content has no divider equivalent). The
style-select dropdown and Share/"Show Everyone" button both still work in text mode as top-level
action rows (Discord supports classic action rows identically whether or not the V2 flag is set) —
only the container itself is dropped. `flags` is `0` for a public text response, not the usual `32768`
default — confirmed safe: `sendV2Payload`'s default param only triggers on `undefined`, not on falsy
values, so an explicit `0` is never silently overridden back to Components V2.

Switching styles via the dropdown while in text mode needed to STAY in text mode — there's no `format`
option to re-read on that path (`overrideState` skips normal option resolution entirely, same
constraint `ephemeral`/`accentColor` already work around). Solved the same way `ephemeral` already is:
`index.js`'s `tsmenu|` handler derives `isTextMode` from the ABSENCE of the Components V2 bit (32768)
on the message being edited (`!(interaction.message.flags?.bitfield & 32768)`), since text mode never
sets that flag, and passes it through `overrideState.isTextMode`.

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
  - **Second pass (2026-07-12, per `drawPrices_ui.json` — Harkirat's own hand-adjusted mockup):**
    dropped the two group headers (Mythic-Tier / Legendary & Epic-Tier) for one flat
    divider-separated sequence, each entry down to a single tier emoji (`TIER_ICON`, not the old
    tier+Epic combo). "Legendary BR Vehicle Draw" removed entirely (absent from Harkirat's own
    hand-built mockup, read as deliberate) — its `altLast` mechanism went with it, nothing else ever
    used that field. Region switcher became a toggle button instead of a select-menu, persisting to
    `UserPreference.defaultRegion` on click.
  - **Third pass (2026-07-12, per `example_reformat.json` + several direct follow-up requests the
    same session) — this is the CURRENT final state:**
    - Command title (`buildTitleBlock`) down to `## ` (was `# `) with an extra `**bold**` wrap around
      the caption on top of its existing bold-italic-unicode styling — both via new optional params
      (`headingLevel`, `boldCaption`) on the shared helper, defaulting to the old behavior so
      calendar/patchnotes/draws (which separately also moved to `## `, see below) and seasonend
      (already `## `) didn't silently change unless explicitly opted in.
    - Each entry now renders as up to 3 SEPARATE Text Displays — `[**icon name** \n > total line]`,
      `[bold pull sequence + cumulative]`, and (mythic entries only) `[**Upgrade** \n formula line]`
      — deliberately NOT merged back into fewer components; Harkirat wants the real gap BETWEEN
      Discord components for the spacing, not blank lines inside one. Entry headers are `**bold**`
      with no heading markup at all (was `### `). The `> ` quote block on the CP total line came
      back (was briefly removed, then restored). Upgrade sub-heading is `**bold**`, not `### ` (was
      briefly a real heading, then flattened to match the reference file). Pull-sequence numbers are
      individually bold, joined by ` / ` (was a plain arrow-joined sequence); the cumulative line
      uses `›` (U+203A) as its separator and is prefixed `-# **CP Spent:**`; the pull-sequence line
      ends with `⌇` (U+2307) `**\`X CP\`**` instead of `= \`X CP\``. Copy these two unicode
      characters verbatim from a known-good source if you ever touch this again — a
      visually-similar-but-wrong glyph is an easy, hard-to-notice typo here.
    - **Entries are now paginated across 2 pages** (`PAGE_1_KEYS`/`PAGE_2_KEYS`/`SUBPAGES` in
      `drawprices.js`) purely because rendering every entry as up to 3 real Text Displays pushed the
      full 9-entry, single-page container to 41 recursive components — over Discord's 40 cap, which
      would have failed to send outright. Page 1: Mythic Weapon, Mythic Character, Legendary Weapon
      (Reactive/Non-Reactive), Legendary Character + Legendary Weapon. Page 2: Double Legendary
      Weapons, 7 Spins Legendary Weapon, Pick Your Reward Card, Double Epic Characters — exact split
      Harkirat specified, not a size-balancing choice. `buildContainer(regionKey, accentColor,
      isEphemeral, subpage)` takes a 4th param; `execute(interaction, regionOverride, subpageOverride)`
      threads it through. **Subpage is NEVER persisted anywhere** (unlike region) — a fresh `/draw
      prices` invocation always starts at page 1 regardless of what page anyone last viewed; it only
      travels through a button click's own `custom_id` for that one re-render.
    - Region toggle button: `price_region_{10|30}_{currentSubpage}` (not `toggle_price_region_*` —
      that prefix collides with `/settings`' generic binary-toggle handler, which expects a
      `|{userId}` suffix this button doesn't have; a real bug caught during review before ever
      shipping). Encodes the current subpage too so switching region doesn't reset which page of
      entries you were on. Region choice persists to `UserPreference.defaultRegion`; subpage does not.
    - Page nav (`price_subpage_{region}_{targetPage}`, via the shared `buildPaginationRow` helper) is
      positioned directly under the entries themselves (own divider on both sides), NOT next to the
      region-switch footer/button below — it originally sat right beside the "Switch between viewing
      10 CP or 30 CP region prices" text, which read as if the page arrows were also part of
      switching region. Moved per Harkirat's explicit fix request.
    - Footer collapsed to one `-#` line: `Switch between viewing 10 CP or 30 CP region prices. (Tip:
      check out \`/settings\`)` (was two separate lines).
    - `emojis.drawPrices` updated to a new emoji ID (`<a:DrawPrices:1525864071776305163>`) — only
      used by this command, no other call sites to update.
    - **`## ` title sizing applied to calendar/draws/patchnotes too** (their `buildTitleBlock` calls
      now pass `2` as the 4th arg), "to keep consistency of design" across all seasonal commands —
      `seasonend.js` didn't need touching, its own hand-rolled heading was already `## `.
    - The large-divider-spacing test between entries (spacing 2, region_10 only, region_30 stays
      spacing 1 for comparison) from the prior round is UNCHANGED and still region_10-only — not yet
      decided whether to keep, drop, or apply everywhere.
    - Component counts per page, verified directly via `buildContainer()`: region_10 page 1 = 34,
      page 2 = ~28ish; region_30 similar minus a few for the shorter entries. All safely under 40.
      Re-verify the same way (dump JSON, count recursively) if entries are ever added back or
      un-merged.
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
`null` for almost every active user. Discord's newer Nitro name-color feature
(`display_name_styles.colors`) IS exposed over the bot API as of the current version (v10)
— see the `'displayName'` style below — but avatar/banner/decoration/nameplate have no
Discord-provided color value at all, so those four are extracted ourselves:
- `colorExtract.js`'s `getDominantColor(url)` downloads an image (avatar or banner) via
  `jimp`, samples ~2500 pixels, and picks a representative hex value — see "Accent color
  extraction algorithm" below for exactly how (it's gone through 3 real revisions, not a
  simple average).
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
  happens if that specific image actually changed. **Caching is keyed on the image hash,
  NOT on the extraction algorithm version** — changing the algorithm (see below) does
  nothing for a user's already-cached color until their underlying avatar/banner image
  changes, or the cache is manually cleared.
- **`/settings`' one exception is `'preset'` specifically, not "always avatar."** If a
  user's `accentColorStyle` is explicitly `'banner'`, `/settings` correctly shows their
  BANNER color (falling back to avatar only if they have no banner uploaded at all) —
  `resolveAccentColor()`'s `defaultBehavior: 'avatar'` param (which `/settings` passes)
  only overrides the `'preset'`/`'default'` case, since that's the one style with no
  brand color to show at all. Don't read "`/settings` falls back to avatar" as "`/settings`
  always shows avatar regardless of style" — it doesn't.

### Accent color extraction algorithm (`colorExtract.js`'s `getDominantColor()`)
Gone through 3 real revisions, each found wrong by testing against Harkirat's actual
Discord avatar rather than a hypothetical:
1. **Flat average of every sampled pixel** (original) — washed out toward gray/white for
   the common case of a mostly-pale avatar with one small vibrant feature.
2. **Saturation-weighted average** (2026-07-12) — down-weighted low-saturation background
   pixels correctly, but still averaged RGB across genuinely DIFFERENT hues (e.g. teal
   hair + skin tone) into a muddy blend that could look like none of the actual colors
   present.
3. **Dominant hue-cluster + vivid bias, "vivid"** (2026-07-13, current) — buckets sampled
   pixels into 24 hue bins (15° each), excluding near-neutral pixels (low saturation, or
   blown-out near-white/near-black) entirely from consideration; the bin with the highest
   saturation²-weighted total wins; the final color averages only the TOP 20% most vivid
   pixels within that winning bin (ranked by saturation and mid-range lightness), not
   every pixel in it — biased toward the punchiest instance of the dominant hue rather
   than its overall muted average. Confirmed live by generating a side-by-side artifact
   (real Discord-embed mockups: 4px accent strip + `#131416` body) comparing all 3
   algorithms against Harkirat's own avatar plus 4 other real test images (a gradient orb,
   a holographic photo, an animated GIF, a cartoon screenshot) before picking this one.
   **On an image with multiple comparably-saturated but unrelated hues, this favors the
   MORE saturated hue even if a less-saturated one covers more area** — confirmed
   intentional (checked the raw per-bin weight data directly on the gradient-orb test
   case: a small vivid-blue region legitimately outweighed a larger but less-saturated
   coral region), not a bug to fix.
- Applies identically to BOTH avatar and banner extraction — they share this one function
  (`accentColor.js`'s `getCachedColor()` calls it for both `kind: 'avatar'` and
  `kind: 'banner'`), so no separate banner-specific logic exists or is needed.
- **Every user's cached `avatarColorHex`/`avatarColorSource`/`bannerColorHex`/
  `bannerColorSource` was cleared (2026-07-13)** after shipping the vivid algorithm, so
  every user's color recomputes fresh on their next accent-color-resolving command
  instead of silently keeping a stale pre-vivid value indefinitely (per the image-hash
  caching note above). One-time `UserPreference.updateMany({}, {$unset: {...}})` — not a
  recurring migration, don't re-run it reflexively on future algorithm tweaks without
  thinking through whether that specific change actually invalidates existing cached
  values.

### Post-click latency fix (2026-07-13) — `getAccentColorForCommand()` no longer force-fetches
for avatar style
Real, user-reported hesitation between a button's Discord-side "loading" spinner ending
and its content actually updating, traced to `getAccentColorForCommand()` unconditionally
calling `interaction.client.users.fetch(id, { force: true })` on every single call — a
forced Discord REST round-trip on every pagination/toggle click regardless of whether the
color cache was about to hit. Fixed: only `'banner'` style still force-fetches (banner data
genuinely isn't in the lightweight interaction payload); the default `'avatar'` style now
reuses `interaction.user` directly. **Confirmed safe via discord.js source itself**
(`BaseInteraction.js`/`CachedManager.js`/`User.js`): Discord sends the clicking user's live
avatar hash with every interaction, and `_patch()` always overwrites `.avatar` from that
payload, so a different user clicking a shared message, or the same user changing their
avatar between clicks, both still resolve correctly with zero extra fetch. Banner has no
equivalent free signal (a structural API difference, not an oversight), so it keeps a
throttled force-fetch instead: `bannerRecheckCache`, `RECHECK_WINDOW_MS = 15 * 60 * 1000` —
a real slash-command invocation (`interaction.isChatInputCommand()`) always bypasses the
window and fetches fresh (confirmed via `buildSyntheticInteraction` in index.js that a
button-driven re-render correctly still reads `isChatInputCommand() === false`, since the
synthetic interaction preserves the original component interaction's `.type`); only
button/select re-renders of an already-open message consult the 15-minute cache. This adds
zero latency to `'preset'`-style users (returns `presetHex` before any of this runs) or
`'avatar'`-style users (never fetches at all) — only `'banner'`-style users' fresh
slash-command runs pay the force-fetch cost, same as before this fix, just scoped correctly
instead of hitting every render.

### 'displayName' style — Discord's real Nitro name-color gradient (2026-07-13)
Discord exposes a genuine 2-stop name-color gradient a user explicitly picked via their own
UI: `display_name_styles.colors` (an array of 2 decimal RGB ints, e.g. `[7183099,
6082490]` → `#6D9AFB`/`#5CCFBA`). **Not parsed by discord.js's own `User` class at all** —
confirmed against the installed v14.26.4, `User._patch()` has no handling for it whatsoever
(unlike `collectibles`/`primary_guild`, which it DOES parse — this field is simply newer
than what this discord.js version implements), so even a force-fetched
`client.users.fetch()` silently drops it. The only way to read it is a raw REST call that
bypasses the User model entirely: `client.rest.get(Routes.user(userId))` — same
`client.rest` object every V2 command already uses for `rest.patch('@original')`, just a
GET. `accentColor.js`'s `fetchProfileExtras(client, userId)` is this one raw call, shared
by the `'displayName'`/`'dynamicProfile'` styles AND the "View Colors" panel's Name page
below — always a live network call (no free signal from the interaction payload, no
discord.js-level cache to lean on), so callers throttle it the same way banner is throttled
(`RECHECK_WINDOW_MS`, always-fresh on a genuine slash command).
- `blendGradientColors([c1, c2])` averages the 2 colors into one hex for use as a
  Container's flat `accent_color` (Components V2 has no gradient support). Deliberately a
  simple average — unlike the flat-average approach REJECTED for avatar/banner pixel
  sampling (see the extraction algorithm's own revision history above), these are exactly 2
  deliberate user-picked anchor colors, not thousands of noisy image pixels, so a plain
  average is the right call here, not the same footgun.
- Falls back to Avatar Color if the user hasn't set one up (same "fall back to the next
  most personalized style" pattern banner-with-no-banner already uses) — a Nitro name style
  is a real, common "not set up" case, not a rare edge case.
- **One-time notice, not repeated on every render**: `index.js`'s `set_accent_style`
  handler fires a short ephemeral Components V2 follow-up (`#FF73FA`, Discord Nitro's own
  brand pink) only when the user actively PICKS `'displayName'` and doesn't have one set up
  — explains it's a Nitro feature, that Avatar Color is being used meanwhile, and that they
  can switch anytime. Sent via a raw `POST Routes.webhook(applicationId, token)` call (the
  follow-up equivalent of `sendV2Payload`'s `PATCH .../@original`) since discord.js's
  high-level `interaction.followUp({components})` doesn't reliably serialize raw V2 JSON
  either.
- `/settings`' hex display shows BOTH real gradient stops (`#6D9AFB → #5CCFBA`), not just
  the blended value — more informative since these are literally the user's own chosen
  colors, not an approximation.

### 'dynamicProfile' style — randomly picks between every real color source (2026-07-13)
The one style that's genuinely randomized rather than deterministic: on each real NEW
slash-command launch, randomly picks between every color source the user actually has
(avatar always; banner/displayName/decoration/nameplate only if set), then holds that pick
steady across any button/select re-render of that specific message.
- **The hard design problem**: keeping the same random pick stable across button
  re-renders of one message, without threading a seed through every pagination/toggle
  button's custom_id across 5+ command files. Solved via `interaction.message.id` — free on
  every button/select interaction (no fetch needed), used directly as the cache key
  (`dynamicColorCache`, TTL 24h, mirrors `manageUndoStore`'s short-lived-token pattern). The
  INITIAL command launch is the only tricky case (no message exists yet at the point accent
  color must be resolved, before the first payload is sent) — solved by paying ONE extra
  `interaction.fetchReply()` call (fetches the placeholder message `deferReply()` already
  created) to learn the real message id right after picking, but only once per genuine
  command launch under this specific opt-in style, never on the per-click hot path the
  latency fix above protects. A cache miss on a re-render (TTL expired, or the bot restarted
  since launch — this cache is in-memory only) gracefully re-rolls a fresh pick rather than
  erroring.
- Decoration/nameplate colors go through the exact same extraction + still-frame pipeline
  the "View Colors" panel uses (see below) — an extraction failure EXCLUDES that source
  from the random pool entirely rather than substituting the command's generic preset color
  (which would be a silent, misleading "profile color" that isn't real).
- Routed around `resolveAccentColor()` entirely (`resolveDynamicProfileColor(interaction,
  prefs, presetHex)`) since it fundamentally needs `interaction` itself, not just a
  pre-resolved `userFetch` — flows automatically to every command already using the shared
  `getAccentColorForCommand()` hook, no per-command changes needed.

### Clarifications worth remembering
- **Loadout/DMZ commands (`/dmz`, `/all`, `/<category>`) are and remain COMPLETELY
  unaffected by any accent-color-style customization** — always use their own hardcoded
  per-weapon-category palette (`getMpCategoryAccent()` in `utils/loadoutRender.js`), never
  touch `accentColorStyle` at all.
- **`/timestamp` DOES already support every accent style** (avatar/banner/displayName/
  dynamicProfile) via the shared `getAccentColorForCommand()` — but ONLY once the user has
  personally saved a `/timestamp` default style other than "All Formats"
  (`UserPreference.timestampStyle`). The default "All Formats" overview always stays
  timestamp's own fixed teal preset regardless of accent style preference — Harkirat's own
  earlier explicit design call, not something left unwired.

## "View Colors" panel (`/colors`, `/settings`' View Colors button, `utils/colorPalette.js`,
`utils/colorPaletteView.js`, `utils/colorExtract.js`, `utils/stillFrame.js`,
`utils/colorSwatchImage.js`, `utils/colorGradientImage.js`)
Lets a user browse real extracted colors from their Avatar/Banner/Display Name/Nameplate/Deco,
with tap-to-copy hex codes. Two entry points, both funneling through the exact same render
pipeline so they can't drift apart: the standalone `/colors` command (`commands/colors.js`) and
a "View Colors" button in `/settings` next to the Avatar/Banner download buttons (style 1/
blurple, an eyedropper emoji — `utils/emojiMap.js`'s `eyedropper`, an animated icon Harkirat
sourced, background-removed, and recolored to Discord blurple himself, then uploaded as an
Application Emoji via `POST /applications/{id}/emojis`, `client.rest` auth'd with the bot
token — this bot never needed to do the upload itself, see the GIF processing note below).
Both `settingsVisibility`-scoped (no dedicated visibility preference of its own).

### The color extraction algorithm — went through a full redesign, not a tuning pass
**V1 (2026-07-13, REJECTED same week)**: an Android Palette-style 6-swatch model (Vibrant/
Light Vibrant/Dark Vibrant/Muted/Light Muted/Dark Muted, later +Dominant/+Average). Rejected
after Harkirat compared it directly against real palette-generator tools (Jukebox, Coolors)
run on his own avatar — their results were genuinely diverse real colors sampled from
visually distinct regions of the image, while the synthetic category system read as "mostly
useless." **Before rebuilding, the naive alternative was tested and found WORSE**: ranking
real sampled pixels by raw population and taking the top N produced 4 near-identical
off-whites on Harkirat's own avatar (`#F5F4F3(34.5%) #EBEBE9(26.1%) #EEEEF1(2.7%)
#F3F1ED(2.1%)`) — the exact "background dominates" failure mode `getDominantColor()`'s own
"vivid" algorithm was built to avoid in the first place.

**V2 (2026-07-13, current)**: real K-MEANS clustering in RGB space, the actual technique those
reference tools visibly use (confirmed: Coolors' own UI shows pin markers landing on
chromatically distinct regions — background, hair, eye, skin, shirt — exactly k-means'
expected behavior, since a large uniform region becomes ONE cluster regardless of pixel
count while smaller distinct features still get their own). `getColorPalette(imageUrl, count)`
returns a plain array of `{hex, percent}` sorted by prevalence, NOT a named-fields object —
there's no more fixed category set to key off of.
- **Determinism is required, not optional**, specifically because of the "Refresh Colors"
  button's honest change-detection (below) — it needs the SAME image to always produce the
  SAME result, or even an unchanged avatar would look "different" on every refresh. Textbook
  k-means uses randomized init (k-means++); fixed by seeding centroids DETERMINISTICALLY
  instead (sort sampled pixels by hue, pick K evenly-spaced ones as starting centroids —
  same spread-out spirit as k-means++, zero randomness). Verified live: ran extraction
  twice against the same real avatar/banner URLs, byte-identical both times.
- **A post-clustering merge step** folds any 2 final clusters within 30 RGB-distance back
  into one (population-weighted average) — confirmed empirically that plain k-means could
  still occasionally split a subtly-varied region (a background with soft lighting
  gradient) into 2 near-duplicate clusters depending on where the deterministic seeds
  landed.
- **REAL BUG found and fixed, not just a caching gotcha**: requesting 8 colors for avatar
  only returned 5 even with the merge step in place — clustering at exactly K=8 then
  merging could eat INTO the requested count with no way to recover lost slots, even though
  the image likely had other genuinely distinct regions available to fill them from. Fixed
  by over-clustering first (K = 1.5× requested) before merging, then slicing to the top
  `count` post-merge — gives the merge step room to fold away real near-duplicates while
  still hitting the requested count from other distinct regions. Verified: avatar went from
  5/8 to a full 8/8, determinism re-confirmed unaffected.
- **REAL alpha-transparency bug found and fixed**: neither `getDominantColor()` nor
  `getColorPalette()`'s pixel-sampling loops ever checked the alpha byte at all — confirmed
  32.9% of a real Discord nameplate asset is fully-transparent padding, whose leftover RGB
  (commonly `0,0,0`) was being counted as real opaque black content. Never surfaced on
  avatar/banner (typically fully-opaque squares) — only became visible once transparent
  sources (nameplate/decoration) started running through this same code. Fixed by skipping
  any pixel with `alpha === 0` in both functions' sampling loops. Verified: nameplate's
  "Dominant" (a V1-era swatch) went from a nonsensical `#000000` to a real matching blue;
  avatar's single-color extraction re-tested byte-identical to its pre-fix value (no
  regression on the already-opaque case).
- **Per-source color counts**: avatar/banner 8, nameplate/decoration 4 (`PALETTE_COUNTS` in
  `colorPalette.js`) — nameplate/decoration are smaller/simpler assets that regularly
  produce fewer genuinely distinct clusters even at higher K, confirmed empirically, so they
  ask for fewer up front instead of padding out to a count they don't really support.
  Avatar/banner's 8 paginate 4-per-page (`ENTRIES_PER_PAGE` in `colorPaletteView.js`,
  `colors_subpage_{source}_{subpage}` custom_id/handler) via the same shared
  `buildPaginationRow` helper `/calendar`/`/draws` use — since it already returns `null`
  (renders nothing) when there's only 1 page, nameplate/decoration/Name's smaller counts
  never show a pager at all, no per-source special-casing needed for that part.

### Dynamic RELATIVE color labels — not a fixed category, not a raw statistic
Each entry's caption went through 2 iterations before landing on the current design, driven
by direct, specific pushback each time:
1. First showed the raw `Covers ~X% of the image` percentage — Harkirat disliked this too.
2. Rebuilt as `assignDynamicLabels()`: computed relative to how each color relates to the
   OTHERS actually extracted from THAT source (not a fixed swatch type) — "Majority Color",
   "Vibrant Accent", etc. First version only had 5 real categories, and anything beyond that
   fell back to a numbered "Accent Color 2"/"Accent Color 3" — Harkirat's direct pushback:
   "the whole point of my request was to keep them unique yet relevant," a numbered
   fallback is neither. **Rebuilt again same day with 13 real non-majority categories**
   (up from 4) specifically so a genuinely large enough rule set covers all 8 entries on
   avatar/banner's largest pages without ever touching the fallback: Majority Color (rank
   0) → Vibrant Accent / Dark Undertone / Light Highlight / Neutral Tone (the original 4,
   only claim an entry that genuinely earns the threshold) → Secondary Color (meaningfully-
   sized 2nd population share) → Warm Contrast / Cool Contrast (genuine temperature
   contrast against the majority specifically, only fires if majority isn't already that
   temperature) → Complementary Tone (most hue-distant entry overall) → Deep Shade / Soft
   Tint (notably darker/lighter than the MAJORITY specifically, distinct from the separate
   darkest/lightest-overall rules) → Rich Tone / Muted Accent (notably more/less saturated
   than the majority specifically) → Balanced Tone (closest overall match to the majority,
   for a genuinely unremarkable color — still a real relationship, not a manufactured one).
   Greedy priority claim: each rule only claims an UNCLAIMED entry that actually earns it,
   never forced, so labels never duplicate on one page. A tiny 4-word non-numbered fallback
   pool still exists as a safety net for a pathological edge case, but verified live it's
   never actually reached — avatar's and banner's full 8-entry sets both got 8/8 distinct
   real labels, zero fallback hits.
- Row format: **{plain-English color name}** (via `color-namer`'s `'ntc'` "Name that Color"
  palette — picked over its other bundled palettes specifically because ntc's names come
  pre-formatted with real spacing/casing like "Royal Blue" rather than lowercase-
  concatenated "royalblue") as the bold heading, `Hex: `#XXXXXX`` plainly below it, the
  dynamic relative label as a small quoted caption. New dependency, checked via `npm audit`
  before adding — zero NEW vulnerabilities introduced (only the pre-existing discord.js/
  undici/xlsx ones already tracked in memory as deferred).
- Each entry also shows an actual generated solid-color swatch image (`colorSwatchImage.js`'s
  `renderSwatchImage(hex)`, tiny Jimp-generated PNG, no external hosting needed) as a Section
  thumbnail accessory, sent as a message attachment referenced via `attachment://swatch_N.png`.

### Per-page layout, source by source
- **Avatar**: Section+avatar-thumbnail header (the page's own subject).
- **Banner/Nameplate**: full-width Media Gallery preview at the top (same `{ type: 12, items:
  [{ media: { url } }] }` shape `/settings`' own banner display already uses in production),
  plain-text heading below (no thumbnail — the media above already shows the real image).
- **Deco**: Section+thumbnail (like Avatar), NOT a Media Gallery — tried the full-width
  version first, Harkirat: "gets too large and looks odd." The thumbnail points at the REAL
  animated decoration URL (not the still-frame used internally for extraction), but Discord
  renders it as a static poster in this context anyway (confirmed a genuine Discord-client
  limitation, needs a manual tap to animate — same class of issue as the nameplate .webm
  attempt below). The real fix (converting APNG to a real GIF via ffmpeg on every render,
  since GIFs DO autoplay inline) was explicitly NOT built — real per-render latency/
  complexity for a cosmetic nicety Harkirat said he's fine leaving static.
- **Name**: a GENERATED gradient banner (`colorGradientImage.js`'s `renderGradientBanner`),
  explicitly NOT a render of the user's actual styled display name text — Discord's per-style
  fonts (`font_id`/`effect_id` in `display_name_styles`) aren't publicly distributed or
  accessible via any API at all, confirmed no legal/technical path exists. Built the fallback
  Harkirat suggested himself instead: a flat left-to-right gradient at the real nameplate
  banner's own aspect ratio (confirmed via a live fetch: 672×126, ≈5.33:1) since he liked
  those dimensions. 3 entries (down from an earlier 5 that also included lighten/darken
  variants) — the 2 real gradient stops plus their midpoint blend (the SAME value used as
  the single `'displayName'` accent-color hex, via `accentColor.js`'s `blendGradientColors`).
- **Nameplate animation**: tried using the real `asset.webm` sibling for display (2026-07-13)
  — reverted same day, Harkirat didn't like that Discord needs a manual tap to play it
  inline rather than auto-animating (same underlying limitation as Deco above). Reverted to
  the static `.png` used for extraction; the dead `nameplateAnimatedUrl` plumbing was removed
  entirely from `accentColor.js`/`colorPalette.js` rather than left unused.
- **No `accent_color` at all** on the panel's container (Harkirat's explicit request) — field
  omitted entirely, not set to a neutral value, giving Discord's default no-accent look.
- **Divider spacing 2 ("large")** and a short hint line above the source-switch row: "Switch
  below to see colors from your other profile elements. (Tip: Updated your profile? `Refresh
  Colors`)" — on its own `-#` line below the first sentence after Harkirat flagged the
  original one-line version made the panel feel too tall on mobile.
- **Vertical centering**: tried a leading blank-emoji line (`emojis.blank`) above the
  Avatar/Deco headings to nudge the 2-line heading text down toward vertically centered
  against the taller thumbnail — Discord's Components V2 has no native vertical-align
  control for a Section's text relative to its accessory either. Reverted same day after
  Harkirat checked it on mobile and it didn't look right there. Stays a known, unsolved
  cosmetic gap. (Horizontal centering is separately confirmed flatly impossible — Discord
  has zero text-align support at all, and manual space-padding doesn't work either since
  the heading includes a proportional-width `<@user>` mention pill whose rendered width
  varies by username length.)

### "Refresh Colors" — the one other deliberate exception to "buttons never re-fetch"
Its own top-level sibling row OUTSIDE the container (same convention the global nav row/
Share Publicly button already use — a new top-level row, never packed into the container),
style 1 (blurple) + the eyedropper emoji, matching "View Colors" itself.
- Forces a real re-extraction bypassing the cache (`utils/colorPalette.js`'s `forceRefresh`
  param on `getCachedPalette`/`getPalettePanelData`) — alongside `colors_view` (the main
  button), the only 2 entry points that do this; ordinary page/subpage navigation
  (`colors_page_`/`colors_subpage_`) stays cache-only and fast, unaffected. Since the 2026-07-13
  lazy-loading rewrite (see the incident note below), a refresh only re-extracts the ONE source
  currently on screen, not all four.
- **Dedicated 10s cooldown** (`colorsRefreshCooldowns` in index.js), separate from the
  generic 600ms anti-spam guard (below) — this button does real re-extraction work, the
  generic guard's window wouldn't meaningfully throttle it. On cooldown, replies ephemeral
  with remaining seconds instead of processing.
- **Honest change-detection**: snapshots a cache-only "before" state via
  `getPalettePanelData(interaction, prefs, source, false)`, THEN forces the real refresh via
  `getPalettePanelData(interaction, prefs, source, true)`, compares the two, and sends an ephemeral
  follow-up saying either "Found new colors!" or "still generates the same colors — this
  button is for after you actually change it, not to reroll." This is exactly why
  determinism in the k-means rewrite above mattered — without it, this comparison would
  report "changed" on literally every click regardless of whether anything really did.
- **REAL BUG found and fixed**: the panel correctly said "found new colors" but kept showing
  the OLD swatch images until switching pages and back. Root cause: `sendV2Payload.js`'s raw
  multipart `PATCH` never included Discord's `attachments` field in the JSON body when
  uploading new `files` — Discord's edit-message API needs this field to know whether new
  attachments should REPLACE or ADD TO a message's existing ones; omitted, Discord could
  retain the OLD attachments instead of cleanly swapping in the new swatch images, even
  though text/components updated correctly (that part doesn't depend on `attachments` at
  all, which is why the confirm message worked while the images silently stayed stale).
  Fixed: whenever `files` is passed to `sendV2Payload`, also set `body.attachments = []` —
  confirmed via grep this is safe bot-wide, only the 5 View Colors call sites ever pass
  `files` at all, and every one of them always fully regenerates its complete attachment
  set on every render (never expects to "keep" one from a prior render).

### Still-frame extraction for animated sources (`utils/stillFrame.js`)
Avatar decorations are commonly served as **animated PNG (APNG)** — confirmed live against a
real equipped decoration, Jimp (this whole color system's underlying image library) cannot
decode APNG at all (`Mime type image/apng does not support decoding`). `extractStillFrame
(sourceUrl)` downloads the source and pulls exactly ONE still frame via `ffmpeg` (`-vframes 1
-update 1` — the `-update 1` flag avoids a spurious "missing %d sequence pattern" warning
ffmpeg otherwise prints; confirmed present on this host but NOT a guaranteed system dependency
elsewhere) into a PNG Buffer Jimp reads identically to a URL. Deliberately general-purpose,
reusable for any other animated source, not decoration-specific. Wired into BOTH places
decoration extraction happens (`colorPalette.js`'s `getCachedPalette` for the View Colors
panel, `accentColor.js`'s `getCachedDecorationColor` for the `'dynamicProfile'` pool) — the
cache check runs BEFORE the still-frame extraction step so a cache hit never pays for an
unnecessary ffmpeg call. Nameplate's `static.png` doesn't need this (already guaranteed
static); avatar/banner don't either.

### Post-ship production incident: stale palette cache + bot-wide interaction timeouts (2026-07-13)
Harkirat reported `/colors` still showing 5 old-labeled swatches for avatar right after `219b2e1`
deployed, even after re-running it, hitting `/settings`' View Colors button, and clicking Refresh
Colors (which itself claimed "still generates the same colors"). Root-caused via `systematic-
debugging`, two distinct bugs stacked on top of each other:
1. **Stale cache, never invalidated.** `219b2e1`'s over-clustering fix (avatar 5/8 → 8/8, see the
   k-means algorithm section above) was never followed by the same one-time cache-clear the earlier
   "vivid" accent-color rewrite did (`e5359df`) — confirmed directly: Harkirat's live
   `avatarPalette` in Mongo had exactly 5 entries, already in the new k-means array shape (so not
   leftover V1 data — a k-means result computed before the over-clustering fix landed, most likely
   from same-day local dev iteration hitting the same production `MONGODB_URI`). Running the
   *current* `getColorPalette()` directly against that same avatar URL correctly returned 8. Fixed
   with a one-time `UserPreference.updateOne({discordId: '1139845545754632283'}, {$unset: {...}})`
   clearing all 4 `*Palette`/`*PaletteSource` fields — scoped to Harkirat's own account only, per
   `[[feedback_cache_invalidation_on_algorithm_change]]` (an earlier session in this same feature
   got this wrong once already with an unscoped `updateMany({})`, correctly blocked by the safety
   classifier).
2. **Bot-wide interaction timeouts, unrelated to colors specifically.** Render logs from Harkirat's
   actual testing window showed `DiscordAPIError[10062]: Unknown interaction` (Discord's 3-second
   ACK window blown before `deferReply()`/`deferUpdate()` even ran) — not just on `/colors`, but on
   `/manage`, `/settings`, and a select-menu click too, spread across ~15 minutes with zero process
   restarts in between (ruled out Render free-tier sleep/wake cycling as the cause). Root cause:
   `kMeansCluster()` ran fully synchronously from start to finish with no `await` inside its
   iteration loop — on Render's free tier (0.1 shared CPU), this blocked Node's single event loop
   long enough that ANY other in-flight interaction, regardless of which command, could miss its ACK
   window while a color extraction was still crunching. Confirmed the mechanism directly: a
   `setInterval(5ms)` timer fired **zero** times during a pre-fix extraction call and 12 times
   (matching `KMEANS_ITERATIONS`) after the fix. Fixed by `await`-ing a `setImmediate()` after every
   k-means iteration (`kMeansCluster` and `getColorPalette` both had to become properly awaited
   end-to-end — the call site in `getColorPalette` wasn't awaiting it at all before this) and
   dropping banner's fetch size from 512px to 256px (halves Jimp's synchronous decode/unfilter work;
   k-means only ever samples ~2500 pixels regardless of source resolution, so this isn't a visible
   quality loss). This doesn't reduce total CPU time spent — it stops that time from monopolizing
   the event loop in one unbroken burst, so a concurrent command's `deferReply()` gets a chance to
   fire in between. **Deliberately NOT a Render plan upgrade** — Harkirat's explicit call: try
   making the code more efficient first, defer parts of the feature next if that's still not enough,
   only fall back to touching infra/plan as a last resort.

**Second pass (2026-07-13, on Opus 4.8) — the efficiency rewrite that actually addressed the CPU
root cause, not just the yield symptom.** The first pass above made extraction *yield*; this pass
made it do far *less* work. Four changes, in order of impact:
1. **Lazy per-source extraction (the headline fix).** `refreshAllPalettes` was renamed to
   `getPalettePanelData(interaction, prefs, activeSource, forceRefresh)` and now extracts the palette
   for ONLY the source being displayed, not all four. `buildColorPalettePanel` only ever renders one
   source's swatches at a time (`data[effectiveSource]`), so extracting avatar+banner+decoration+
   nameplate on every render was ~4x wasted work — each a synchronous Jimp decode + k-means pass, and
   decoration additionally spawning an `ffmpeg` subprocess for its still frame. Every source the user
   HAS still gets its availability key + preview URL surfaced (cheap — from `getSourceImageInfo`'s
   network calls, no pixel work), so the nav buttons + current preview all render correctly; the other
   sources extract lazily the moment the user navigates to them. Decoration's ffmpeg subprocess now
   never runs unless the Deco page is actually opened. The one behavior tradeoff: first visit to each
   page shows a brief loading spinner instead of being pre-warmed (accepted — far better than freezing
   the whole bot). All 6 call sites updated (`commands/colors.js`, and index.js's `colors_view`/
   `colors_page_`/`colors_subpage_`/`colors_refresh_` handlers — refresh calls it twice, before/after).
2. **Removed `/settings`' background soft-refresh entirely** (`commands/settings.js`). It fired an
   un-awaited `refreshAllPalettes` on EVERY `/settings` open, speculatively warming all 4 sources'
   caches in the background whether or not the user ever clicked View Colors — a major unconditional
   CPU drain (4 background extractions + an ffmpeg spawn per `/settings` open) and a prime suspect for
   why `/settings`/`/manage` themselves showed up in the 10062 logs. With lazy extraction the panel
   warms on demand anyway, so the pre-warm bought little and cost a lot. Its removal also eliminates
   the concurrent-`save()` version-conflict hazard it was carefully working around (it used a separate
   freshly-fetched `prefs` doc for exactly that reason).
3. **k-means early-convergence** (`utils/colorExtract.js`): break the iteration loop once no pixel
   changes cluster. Output is BYTE-IDENTICAL to running the full 12 (verified — the returned clusters
   are computed from `assignments`, which is already stable at convergence), so determinism and the
   Refresh change-detection are fully preserved. **Honest caveat: measured 0% benefit on Harkirat's
   own avatar** (12 clusters over 2521 pixels don't fully stabilize within the 12-cap there) — it only
   helps sources that genuinely converge early (the smaller-K nameplate/decoration at K=6). Kept
   because it's free-when-it-helps / never-changes-output / never-slower, not because it's a reliable
   win. Do NOT lower `KMEANS_ITERATIONS` from 12 to force a win — that WOULD change output and break
   the determinism the Refresh button's "same colors?" comparison depends on against already-cached values.
4. **Memoized solid swatch PNGs by hex** (`utils/colorSwatchImage.js`, bounded 256-entry `Map`). A
   swatch is deterministic per hex and never changes, but the panel re-encoded up to 4 of them on
   every page/subpage switch. Now encoded once per process per distinct color. The cached Buffer is
   only ever read (uploaded as an attachment), never mutated, so sharing one reference across renders
   is safe and doesn't interact with the `sendV2Payload` attachments-replacement fix.
Verified locally: determinism holds (byte-identical across runs), event loop stays responsive during
extraction (a 5ms timer fires ~14× mid-extraction vs 0× when it was fully blocking), the panel still
renders correctly with an available-but-unextracted source (Banner button shows even when
`data.banner` is null), and all modules load cleanly. **Not yet verified live on Render** — the true
test is whether 1-source-at-a-time extraction stays under the 3s ACK window on the actual free-tier
CPU; watch the logs for fresh 10062s after deploy. If it's STILL not enough, the remaining levers (in
Harkirat's stated order of preference) are: defer more of the feature, then move extraction off the
main thread (`worker_threads` — moves the CPU burst off the event loop entirely, though it competes
for the same fractional core), and only as a last resort a Render plan bump.

**Branch-testing discovery (2026-07-13): the erratic behavior was ALSO multiple bot instances, not
only CPU.** The CPU work above was deployed to a `fix/colors-cpu-efficiency` branch (Render's tracked
branch temporarily pointed at it — same service, so only one Render instance, no collision from
Render itself) for real-free-tier testing. During that test Harkirat saw the panel render *different
code versions on different clicks* (an abandoned blank-emoji heading trick + old "Accent Color N"
labels on some clicks, current 8-color layout on others) — impossible within one instance.
`ps aux` found **three leftover local `node index.js` processes** (started earlier that day in prior
debugging, each frozen at a different stale code snapshot) racing the Render branch bot. This is a
single-token bot: multiple live instances make Discord hand each interaction to a random one, and
they race each other's `deferReply`/`deferUpdate` (10062/40060). **This very likely contributed to
the ORIGINAL 10062 wave too**, not just the CPU angle. Fixed by killing the 3 local processes
(Railway was already fully removed — its "Offline" CLI status was real, the logs seen were
historical). Lesson now in memory (`[[feedback_multiple_bot_instances]]`) and folded into the push
flow (kill stray local instances so only Render runs). A permanent single-instance guard is on the
Next-planned-work list below. **Note also:** a `git push`/Render deploy does NOT stop local
processes — they're different machines; only explicitly killing them does.

### View Colors preview sizing (2026-07-13, follow-up to the CPU pass)
Three preview-size fixes after the CPU work, all confirmed on the branch deploy before merge:
- **Banner preview regressed to 256px** — the CPU pass dropped banner extraction to 256px for faster
  decode, but the Media Gallery *display* reused that same shrunk url. Fixed by decoupling in
  `getSourceImageInfo`: banner now carries `url` (512px, for display) AND `extractUrl` (256px, used
  only by `getCachedPalette` for clustering). k-means samples ~2500 pixels regardless of resolution,
  so 256 is quality-equivalent for extraction — it just wasn't big enough to *show*.
- **Gradient Display Name banner** capped 672×126 → **512×96** (same 5.33:1 ratio), the new default
  in `colorGradientImage.js`.
- **Nameplate preview** capped at **512px wide**. Discord's COLLECTIBLES CDN **ignores `?size=`
  entirely** (confirmed live: a 672×126 nameplate stays 672×126 with `?size=512`, unlike the avatar/
  banner CDN which honors it), so the only way to cap it is to fetch+resize ourselves — new
  `utils/resizedImage.js` (`renderResizedImage(url, width)`, downscale-only, aspect-preserving),
  attached as `nameplate_resized.png`, with a fallback to the native-size url if the resize fails.
  It **memoizes the resized Buffer in-memory** (bounded `Map`, keyed by url+width — NOT a DB write,
  zero storage impact) so the download+resize is one-time-per-process instead of per-render, per
  Harkirat's cost concern about the redundant download (that page already downloads the nameplate
  once for extraction). Same memo pattern as `colorSwatchImage.js`'s swatch cache.

### Icon sourcing (the eyedropper emoji)
Harkirat provided a raw GIF, background-removed via the `gif-background-remover` skill
(`--analyze` first, confirmed white background + one verified enclosed region via
`--protect-outline-color`, NOT `--protect-region` since the interior shape isn't circular),
then recolored toward Discord blurple (`#5865F2`) via a custom HSL-shift script — the bulb to
exact blurple, the liquid to a lighter tint preserving its original lightness offset. **Real
GIF-format limitation found while trying to fake a "bleed-through" highlight effect**: GIF
has NO partial-transparency support at all — every pixel is binary opaque-or-transparent,
confirmed directly (a 114/255 alpha value silently got rounded back to 255 by Pillow's own
GIF encoder). Worked around correctly since the button's background color is fixed and known:
baked a literal blend of white+blurple as a flat opaque color in place of the pure white,
achieving the same visual effect without needing real alpha. Cropped + compressed for
Discord's 256KB emoji limit — Harkirat's own manual pipeline (crop → resize to 128px width →
`gifski` re-encode at quality 68) kept all 180 original frames at 248KB, meaningfully better
than this session's own attempts via the skill's gifsicle-based tier system (which had to
drop frames to hit budget) — see the gif-background-remover skill's own SKILL.md for the
fuller writeup of that comparison. Uploaded by Harkirat himself as an Application Emoji.

## Light anti-spam cooldown (2026-07-13)
`index.js`'s single `interactionCreate` handler checks a per-user 600ms cooldown
(`interactionCooldowns` Map, `INTERACTION_COOLDOWN_MS`) at the very top, before any of the
`isAutocomplete`/`isChatInputCommand`/`isStringSelectMenu`/`isButton`/`isModalSubmit` branches —
scoped to ONLY `isButton()`/`isStringSelectMenu()` (the rapid-clickable component types; a slash
command or modal submit is a deliberate typed action, not spam-clickable the same way). An
interaction inside the window is silently swallowed (`deferUpdate().catch(() => {})` then
`return`) rather than replied to with an error — no visible change, no "This interaction failed"
toast, just a no-op. One entry per distinct user (not per click), so the Map never meaningfully
grows. Meant as a very light guard against rapid double/triple-clicking causing races (a `/manage`
confirm flow re-firing, pagination edits stacking), not a real rate-limiter. The View Colors
"Refresh Colors" button has its OWN separate, longer 10s cooldown (`colorsRefreshCooldowns`) on top
of this — see the View Colors section above for why (it does real re-extraction work this generic
600ms window wouldn't meaningfully throttle).

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

## "Show Everyone" (`utils/shareButton.js`, formerly "Share Publicly")
Every ephemeral response across the bot gets one extra button appended below its existing
components: clicking it answers that button click with the exact same content as a public message.
**Renamed 2026-07-14** (Harkirat's request — "Share Publicly" read as ambiguous about what actually
happens) to "Show Everyone", which states the outcome directly. Same day, the plain 🌐 globe was
swapped for a Harkirat-provided custom animated emoji (`emojiMap.js`'s `share`) — goes through the
button's dedicated `emoji` field via `parseEmoji()`, not baked into `label` (see Components V2 point
4 above). The underlying `share_public` custom_id and every mechanism described below is unchanged.
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

## Patch notes Cloudinary caching (`utils/patchNotesCache.js`, shipped 2026-07-13)
Same underlying problem as draws' thumbnail cache (admin-typed external screenshot URLs can go
dark later, leaving a broken image in `/patch notes`' media carousel) but a genuinely DIFFERENT
retention model, so this is its own module rather than a reuse of `cloudinaryCache.js`:
- **Retention is SEASON-based, not time-based.** An image stays cached for as long as its season is
  still reachable through `/patch notes`' own "previous 5 seasons" history dropdown
  (`patchnotes.js`'s `recentPatches = seasonalDoc.patchNotes.slice(-5)`), and gets pruned once that
  season rolls off the back of that list — regardless of how many days have passed. A season live
  for months stays cached the whole time as long as it's still one of the 5 most recent; a season
  that rolled off the dropdown yesterday gets pruned on the very next sweep no matter how young it
  is. `pruneOrphanedPatchFolders(keepPatchIds)` takes the exact same `_id` set the history dropdown
  is built from, so retention here can never drift out of sync with what's actually still reachable
  in Discord.
- **Keyed by the patch note subdocument's own `_id`, not its title** — titles CAN be renamed later
  (the most-recent entry's title stays synced to `currentSeasonTitle`, see the design-decision-log
  entry above), and keying by a mutable title would either orphan already-cached images on a rename
  or require a folder-rename step neither Cloudinary nor this module supports. `_id` never changes.
- `public_id` shape: `patch_notes/{patchId}/{imageIndex}` — `imageIndex` is the ABSOLUTE position in
  the patch note's `images[]` array (0-9), not a per-modal-submission-local index, so re-submitting
  the same slot (`urls1` owns indices 0-4, `urls2` owns 5-9) always overwrites the same asset in
  place (`overwrite: true`) instead of accumulating duplicates under different indices.
- Same `overwrite: true` + `invalidate: true` remote-URL-to-remote-URL upload pattern as the draws
  cache (Cloudinary fetches the bytes server-side, the bot never downloads the image itself), and
  the same never-throw-just-fall-back-to-the-raw-URL philosophy — a Cloudinary hiccup must never
  block an admin's save.
- **Same SECURITY rule as the draws cache, re-applied here rather than assumed inherited**: never
  log a raw Cloudinary error object (the Admin API's rejected-promise carries the account's live API
  key+secret in `request_options.auth`) — every Cloudinary call in this file catches and sanitizes
  its own error via `safeErrorMessage()`, none of it escapes to a caller that doesn't know to
  sanitize it.
- Runs on the same boot + 24h `setInterval` schedule as the draws cleanup (`index.js`'s
  `runCloudinaryCleanup()`), same Cloudinary account, separate `patch_notes/` folder.

## Batch refinement pass (2026-07-12, evening — after the earlier same-day redesign/deploy work)
A large follow-up batch covering `/draw prices`, `/manage`, and `/settings`, requested right after
the `/manage` panel redesign shipped. Sections 4 (a slash-command wording/consistency overpass) and
5 (new color palettes) are explicitly deferred — 4 needs a presented plan + Harkirat's confirmation
before any code changes, 5 is meant to happen last, after everything else. Both are still pending
as of this entry.

- **`/draw prices`:** "Pick Your Reward Card Legendary Weapon Draw" now uses the legendary tier
  emoji (was mistakenly tagged `epic`). Large divider spacing (2) is now used for BOTH regions —
  the region_10-only spacing test from earlier that day is over, applied everywhere. region_30's
  still-missing `doubleEpicCharacters` placeholder text changed to "*Dior is lazy and hasn't done
  the research **yet** for this draw...*". The divider that used to sit directly above the
  footer/region-button row was removed (relied on Discord's own natural component gap instead of an
  explicit spacer). The region-switch button restyled from style 3 (green) to style 2 (gray/
  Secondary) to match the same "switch view" button convention now used bot-wide (see draws.js's
  category-toggle buttons, also restyled+re-cased this same pass: "VIEW NEW/RETURNING DRAWS" →
  "View New/Returning Draws", sentence case).
- **`/manage` — biggest chunk of this pass:**
  - Inter-group divider spacing bumped to 2 everywhere (`buildManagePage`), matching draw prices.
  - Full grammar/capitalization cleanup across every page's action names/descriptions — explicitly
    overrides the EARLIER "preserve Harkirat's verbatim mockup casing" choice from the same day's
    prior redesign; Title Case + clean sentences now, consistently.
  - Calendar's "Misc." group renamed to "Export & Purge Data".
  - The `page` slash option renamed to `section` (name/description/every read site) — "page" didn't
    describe what it actually is (a data section, not a page of anything).
  - "Season: Titles & Deadlines" is now ALSO reachable directly from `/manage`'s own `section`
    option (previously only via the in-panel `mng_pagesel` dropdown) — picking it skips rendering
    the panel and shows the modal immediately, same as the dropdown's flat entry. "Start New
    Season" deliberately has NO direct option entry — destructive enough that requiring the extra
    step through the panel (with its own warning) is intentional.
  - **"Season: Wipe Season" renamed to "Start New Season"** and given a select-option `description`
    ("⚠️ Wipes all draws & calendar data. Cannot be undone.") so it isn't mistakenly triggered — the
    option's description is Discord's own smaller gray subtitle line under a select option label.
    **Gained the same 2-step Confirm/Cancel flow every other destructive `/manage` action uses** —
    it used to wipe draws/calendar the INSTANT the title modal was submitted, no confirmation at
    all. The entered title is now stashed in a short-lived `pendingSeasonWipes` Map (index.js) keyed
    by a random token between the modal submit and the Confirm click.
  - **BUG FIX: Edit Draws was throwing "Something went wrong. Try again."** — root cause was
    `buildEditDrawModal`'s `.setValue(targetDraw.thumbnailUrl)` in manage.js: discord.js's
    `TextInputBuilder.setValue()` throws a synchronous validation error if given `undefined`
    (any draw doc missing `thumbnailUrl`, e.g. a legacy pre-Cloudinary-cache entry), which threw
    INSIDE `resolveManagePanelAction`'s `showModal()` call before the interaction was ever
    acknowledged — exactly what surfaced as Discord's generic client-side failure toast. Fixed with
    a `|| ''` fallback, same defensive pattern now also applied to `buildEditLoadoutModal`'s
    `imageKey` field (same risk, not yet triggered but same shape of bug).
  - **Add Single Draw gained a 5th "Or Paste As One Line" field** (Paragraph, optional) — an
    alternative to filling in Title/Items/Date/URL separately; if filled, the line is parsed through
    the same `parseBulkDrawList()` parser bulk import uses. All 5 fields are `setRequired(false)`
    now so Discord's own validation doesn't reject a submission that only has the combined field
    filled in.
  - **Bulk Replace Draws changed from wholesale-wipe-then-replace to upsert-by-title.** New
    `upsertDrawsByTitle(existingArray, parsedDraws)` helper in index.js fuzzy-matches each pasted
    draw's title against the array being replaced — a match updates that existing draw IN PLACE
    (keeps its `_id`), no match inserts it as new, and anything NOT mentioned in the paste is left
    completely untouched. Purge already covers full wipes, so Replace no longer needs to double as
    one. Add Multiple is unchanged (pure append).
  - **New/Returning/Either button triplets condensed to ONE button per bulk section** (Add Multiple,
    Replace Multiple, Delete Multiple) — the old per-category modals (`buildBulkDrawsModal`) were
    pure redundancy once the combined "Either/Both" modal already covers the single-category case by
    leaving one field blank; that per-category modal builder + its index.js route were deleted
    entirely rather than kept as dead code.
  - **Purge moved into its own fully separate Draws section** (own text block + button row, its own
    dividers) and expanded from one "purge everything" button to 3 granular scopes: Purge New Draws
    Only / Purge Returning Draws Only / Purge All Draws Data. `manage.js`'s `PURGE_LABELS` is now
    `{ [group]: { all, new?, returning? } }` (was a flat string per group) so every group's confirm
    handler can be keyed identically (`PURGE_LABELS[group][scope]`); `mng_purgeconfirm_`/
    `mng_purgecancel_` custom_ids now always encode `{group}_{scope}` (scope is always `'all'` for
    calendar/patchnotes, which have no sub-scopes).
  - **Every deletion path across `/manage` now has a 2-step Confirm/Cancel** — single Delete
    (draws/calendar/loadouts, via `resolveManagePanelAction`) and Bulk Delete (draws/calendar/
    loadouts) used to delete the instant a match resolved / a modal was submitted. Bulk Delete's
    modal-submit handlers now do a DRY RUN first (compute what WOULD be removed, no save) and show
    the same Confirm/Cancel prompt Purge already used, via new `mng_delconfirm_`/`mng_delcancel_`
    (single-item) and `mng_bulkdelconfirm_`/`mng_bulkdelcancel_` (bulk) button handlers, backed by
    `pendingManageDeletes`/`pendingBulkDeletes` Maps.
  - **Undo button + richer confirmation messages.** Every destructive confirm (Purge, Start New
    Season, single Delete, Bulk Delete, Bulk Replace) now attaches an "Undo" button
    (`mng_undo_{token}`) alongside its success message — `registerUndo(description, restoreFn)`
    (index.js) snapshots the pre-mutation state into a short-lived `manageUndoStore` Map (10-minute
    expiry, same pattern as the other pending-action Maps) and restores it on click. This is a
    same-session mistake-reversal tool, NOT a real audit log/version history — nothing here is
    persisted to Mongo. Confirmation messages across Add/Edit/Delete/Purge/Replace now state
    specifically what changed (title, category, item count, release date, before/after counts)
    instead of a generic "Successfully updated!".
- **`/settings`:**
  - Draw Prices region preference converted from a binary toggle button to a 3-option select menu:
    "Show Last Viewed Region" (new default), "10 CP Region Pricing", "30 CP Region Pricing". New
    schema field `UserPreference.defaultRegionMode` (`'last_viewed' | 'region_10' | 'region_30'`,
    default `'last_viewed'`) — `defaultRegion` is UNCHANGED and keeps auto-tracking whatever was
    last actually viewed/toggled in `/draw prices` itself; `defaultRegionMode` is the NEW override
    layer on top: `'last_viewed'` behaves exactly as before, `'region_10'`/`'region_30'` PIN the
    opening view regardless of what gets toggled elsewhere. `drawprices.js`'s `execute()` checks
    `defaultRegionMode` before falling back to `defaultRegion`. The old binary
    `toggle_region_10`/`toggle_region_30` buttons are gone; a new `set_region_mode` branch on the
    existing generic `set_` dropdown handler in index.js covers it.
  - PUBLIC/HIDDEN toggle **button labels are unchanged** (still all-caps `PUBLIC`/`HIDDEN`) but the
    descriptive text next to each now reads "Everyone can see" / "Visible only to me" instead of the
    raw state name, for clarity.
  - Avatar/Banner accent color style now shows the actual cached hex code inline, e.g. `**Avatar
    Color `(#1A2B3C)`**` — pulled straight from the already-cached `avatarColorHex`/`bannerColorHex`
    fields, no new lookup.
  - New footer line: `-# Made with love by <@1139845545754632283> <:dioreo:1525895775387779242>` —
    a SILENT mention (`allowed_mentions: { users: [] }`, already applied to the header's own
    self-mention) so it doesn't ping Harkirat when anyone else opens `/settings`. `dioreo` added to
    `emojiMap.js`.
  - **Paginated into 2 pages** (Visibility / Preferences) — the new region dropdown + hex codes +
    footer pushed a single-page render close enough to Discord's 40-component cap (~38-39 estimated)
    that splitting was the safer call, per the batch's own "check and paginate if needed" framing.
    `execute(interaction, pageOverride = 0)` takes the target page; the banner/profile header section
    re-renders identically on both pages (not truly shared state, just duplicated). Uses the same
    `buildPaginationRow` helper /calendar and /draws already use (`set_page_{N}` custom_ids, new
    `B.5` button handler in index.js). Every Preferences-page select menu's custom_id now carries a
    3rd pipe segment (`|1`) so re-selecting an option lands back on page 2 instead of resetting to
    page 1 — the generic `set_` dropdown handler parses this optional segment and passes it through
    to `execute()`.

## Slash-command wording overpass (2026-07-12, evening — Section 4 of the batch above)
Surveyed every slash command's name/description/option wording for inconsistency, presented the
findings + a proposed fix list to Harkirat, got his explicit go-ahead, then implemented:
- **`/timestamp`'s `ephemeral` option renamed to `private`**, description reworded to the standard
  "Hide this response so only you can see it" — every other command already used `private` with
  this exact wording; `/timestamp` was the one holdout using a differently-named, differently-worded
  option for the same concept. This is a real user-visible change (`ephemeral:` → `private:` as the
  option users type after `/timestamp`), not just an internal rename.
- **Weapon-search option description standardized** across `/dmz`, `/all`, and every auto-generated
  `/<category>` command — these were three different phrasings for the same concept ("The name of
  the weapon you want a DMZ build for" vs. "Type weapon name" vs. "Select a {category}"). Now all
  follow "The name of the {weapon you want a build for" pattern (category-scoped for `/<category>`).
- **`/manage`'s Edit Loadout modal field label fixed** to match Add Loadout's "Build Name / Share
  Code" (Edit had it shortened to "Build Name / Code").
- **`manage.js`'s user-facing copy and comments converted from `--` (double hyphen) to a real em
  dash (`—`)** — the rest of the bot's prose (comments and CLAUDE.md itself) consistently uses `—`;
  `manage.js` alone used `--` throughout with zero em dashes. The `--- SECTION HEADER ---`-style
  3-hyphen comment dividers were deliberately left alone (not prose dashes, a distinct visual
  convention).
- Explicitly left alone after review (already consistent, not worth touching): option naming
  patterns elsewhere, "Jump directly to a specific X" phrasing (draws/drawprices/manage all already
  match), punctuation style differences between base commands (`/season`, `/patch`, `/draw` — terse
  noun-phrase descriptions, no `!`) and their subcommands (`season end`, `patch notes`, `draw
  prices` — exclamation-toned, matching the majority of other commands) — this split is intentional/
  consistent within itself, not an inconsistency to fix.

## Color repalette (2026-07-12, evening — Section 5, final item of the batch)
Replaced the old flat 5-color nav-order gradient (Police Blue `#355070` / Chinese Violet `#6D597A`
/ China Rose `#B56576` / Light Coral `#E56B6F` / Tumbleweed `#EAAC8B`) with colors chosen per
command instead of just position-in-a-fade. Presented 3 full candidate directions (Dusk Signal —
refined evolution of the existing muted gradient; Field Ops — pulled from CODM's own operator
palette, gunmetal/brass/rust/olive; Neon Ops — bold/saturated, closer to Loadouts' Custom Class
energy) as an HTML artifact using the established palette-spec-sheet format
([[project_palette_spec_sheet_format]]), then an addendum with refined Draw Prices/Patch Notes
options once Harkirat asked for money-green/teal and a real "Leakers on Duty" reference-image gold.
Harkirat picked a specific mix across options; final result, optimized for the nav row's left-to-
right hue spread (cool blue → plum → green → gold → warm amber) rather than any one command's color
in isolation:
- **Calendar** — `PRESET_ACCENT = 3821672` / Slate Harbor `#3A5068` (1st nav button). Deliberately
  the deep-blue option over a teal-leaning alternative Harkirat considered, so it doesn't sit
  hue-adjacent to Draw Prices' green two slots over.
- **Draws** — `PRESET_ACCENT = 7032445` / Plum Fortune `#6B4E7D` (2nd). The dustier/lighter plum
  over a deeper "Field Ops" plum, to stay in the same refined register as its neighbors.
- **Draw Prices** — `PRESET_ACCENT = 2067038` / CP Emerald `#1F8A5E` (3rd). Deep forest emerald
  over a lighter jade alternative — reads as confidently "money green" without blending into Patch
  Notes' gold next to it.
- **Patch Notes** — `PRESET_ACCENT = 15909424` / Patch Gold `#F2C230` (4th). Pulled directly from
  the "Leakers on Duty" reference graphic Harkirat pointed at (the community's own patch-notes-
  reveal image format) rather than invented from scratch.
- **Season End** — `PRESET_ACCENT = 15898954` / Neon Amber `#F2994A` (5th). Warm sunset amber,
  pairs as an analogous warm neighbor to Patch Notes' gold, closing out the row's cool-to-warm
  progression.
- **Timestamp** — `PRESET_ACCENT = 1548962` / Cyber Teal `#17A2A2`. This command was NOT part of
  the avatar/banner accent-color system at all before this pass (`accent_color` was hardcoded to
  the old Persimmon `#FF7641` on every render). **New rule, Harkirat's explicit design call:**
  the "All Formats" overview — this command's own branded default view — keeps this fixed teal
  regardless of the user's Accent Color Style preference, same as Loadouts' fixed per-category
  colors are never personalized. Only once a user has SAVED a specific default style in
  `/settings` (`UserPreference.timestampStyle` is anything other than the schema default
  `'all_formats'`) does the command start respecting avatar/banner personalization like the other
  5 commands. **Checks the SAVED preference specifically, not the style actually being rendered on
  a given call** — confirmed explicitly with Harkirat: a one-off `/timestamp style:shortDate`
  invocation does NOT trigger personalization by itself if the user's saved default is still
  `all_formats`. Implementation: `timestamp.js` now exports `PRESET_ACCENT` and calls
  `getAccentColorForCommand()` conditionally; the `overrideState`-driven re-render path (index.js's
  `tsmenu|` select handler, which skips normal option-resolution entirely) has its own copy of the
  same check since it has no `prefs` object to read from directly — computed there and passed
  through `overrideState.accentColor`, the same way `ephemeral` already gets threaded through that
  path.
- **`/dmz` switched from a fixed identity color (`#1c1c1c`) to the SAME per-weapon-category
  palette MP loadouts already use** (`utils/loadoutRender.js`'s `MP_CATEGORY_ACCENT`/
  `getMpCategoryAccent()`) — a real behavior change, not just a new preset value. A DMZ result's
  embed color now depends on the weapon's category the same way `/all`'s does (e.g. a DMZ AR build
  renders in AR's color, a DMZ SMG build in SMG's). Applied at both render sites: the initial
  `/dmz` slash-command response (`commands/dmz.js`) AND the Prev/Next pagination re-render
  (index.js's shared `dmz`/`mp`-prefixed button handler) — the latter used to hardcode the DMZ
  branch to the old fixed color separately, so both had to change together or paging would have
  silently reverted to the old flat color. Loadouts' per-category palette itself is unchanged.
- **Loadouts' existing per-category palette is otherwise untouched** — this repalette only ever
  touched the 5 nav-button commands, Timestamp, and `/dmz`'s color SOURCE (not the palette values
  themselves).
- **Two structural corrections made to `/manage` and `/settings` during this same review pass**
  (not color-related, caught while Harkirat was looking at screenshots of the live panel):
  - `/manage`'s Draws page: the 3 bulk actions (Add Multiple/Replace Multiple/Delete Multiple) were
    each their own group with their own divider between them — regrouped into ONE section (all 3
    text blocks + one shared 3-button row), matching how the single-item Add/Edit/Delete section
    above it is already laid out. `PAGES.draws.groups` in `manage.js` now has exactly 4 groups
    (single-item, bulk, purge, export) instead of 6.
  - `/settings`: reordered from `hint text → divider → nav row → footer` to `hint text → nav row →
    divider → footer` — the divider used to sit directly above the Prev/Next buttons, which read as
    separating the hint text from the very buttons it was describing. Page 1's hint line also
    reworded to "Choose your personal Preferences settings on page 2 →" (was "More settings on
    page 2 →").

## Post-deploy fixes and follow-up polish (2026-07-12, night — after the batch shipped)
Harkirat tested the just-deployed batch live and sent back a Render error log (edit buttons
throwing) plus a long follow-up list. All addressed same session:

- **REAL BUG, found live in production: every single-match Edit search threw "Something went
  wrong. Try again."** Root cause, confirmed directly against the installed package:
  `ModalSubmitInteraction.prototype.showModal` is `undefined` in discord.js v14.26.4 —
  `ButtonInteraction`/`StringSelectMenuInteraction` both implement `showModal()`, but Discord's API
  does not allow responding to a `MODAL_SUBMIT` interaction with another modal at all, and
  discord.js's class reflects that. This is why Edit only ever worked when a search happened to
  match MULTIPLE items (routed through the `mng_pick_` select menu, which CAN `showModal()`) and
  broke on an exact single match (which used to call `resolveManagePanelAction` directly from the
  search modal's own submit interaction). Delete was never affected — it replies with plain text,
  which modal-submit interactions can do fine. **Fix:** a single Edit match now shows one
  intermediate button ("Edit: {label}") instead of opening the modal directly — the click on THAT
  button (a real `ButtonInteraction`) is what calls `showModal()`. Stashed in a new
  `pendingManageEdits` Map (`index.js`), same short-lived-token pattern as the other pending-action
  Maps in this file (`mng_editbtn_{token}`).
  - A **"Search Again"** button was added alongside both the single-match button prompt and the
    multi-match disambiguation select, so a second search doesn't require scrolling back up to the
    original panel message.
  - Reworded the single-Delete confirm text — "This cannot be undone directly, but you'll get an
    Undo button right after" read as self-contradictory. Now: "You'll get an Undo button right
    after, in case you change your mind."
- **`/draw prices`**: global nav row moved INSIDE the container (was a separate sibling element
  after it) — order at the time: entries > subpage pagination > nav row > divider > "Switch
  between..." line > region button. **SUPERSEDED 2026-07-13** — see the follow-up entry below for
  the actual final layout; this nav-row-inside placement turned out to be a real inconsistency
  with `/calendar`/`/draws` and was corrected.
- **Divider spacing "large across the board"** — extended past the earlier per-file passes to
  catch two stragglers: `/settings`' divider right before the footer, and `/manage`'s title divider
  (both were still `spacing: 1`).
- **Calendar's Bulk Replace now upserts by title**, matching Draws' semantics exactly (new
  `upsertEventsByTitle()` helper in `index.js`) — was still a wholesale wipe-then-replace.
- **`/manage` Calendar page**: group headings ("Single Event Data" etc.) removed entirely — matches
  how Draws' page never had them. Export and Purge split into their own separate groups (so the
  existing per-group divider spaces them apart) and each renders as a **Section + button accessory**
  (`style: 'inline'` on the group, a new render branch in `buildManagePage`) instead of the usual
  block-list-then-shared-row layout — same visual pattern `/settings`' visibility toggles already use.
- **Patch Notes URL modals**: each of the 5 URL slots is now its OWN Short text field (`url0`..`url4`)
  instead of one Paragraph field with newline-joined URLs — a modal has exactly 5 field slots, which
  is exactly why URLs were split into "URLs 1"/"URLs 2" in the first place; this uses that same
  budget more granularly. (Cloudinary-backed caching for these images was deferred out of this same
  pass as a separate follow-up project — **shipped 2026-07-13, see "Patch notes Cloudinary caching"
  below**, not still pending.)
- **`/settings` footer**: swapped `dioreo` for an animated `diorHeart` emoji
  (`<a:diorHeart:1525941004929339594>`) and moved it to the FRONT of the sentence ("{emoji} Made
  with love by @dior"). Button labels reworded "HIDDEN"/"PUBLIC" → "Hide"/"Show"; descriptive text
  now partially italicized — "Visible to *everyone in chat*" / "Visible *only to me*". Dropped
  "personal" from the Preferences-page hint. Accent-style dropdown descriptions changed "every
  embed" → "every command" (an embed isn't actually the right noun here since this is all
  Components V2, not legacy embeds).
- **Every slash command description had its trailing "!" removed** and two had leftover emoji
  stripped (`/dmz`'s magnifying glass, `/manage`'s crown) — should have been caught during the
  earlier same-day wording overpass, wasn't. New exact strings: `/calendar` "View the timeline for
  this season's in-game events", `/dmz` "Search through all DMZ specific gunsmiths", `/settings`
  "Customize your bot settings, such as accent color, or download your avatar & banner", `/manage`
  "Database manager for gunsmiths and seasonal data — Add/Edit/Delete", `/draws` "View new and
  returning draws coming this season", `/all` "Search through all available MP gunsmiths".
- **The `private` boolean option, renamed to `hidden` on EVERY command** (reversing part of the
  earlier same-day `ephemeral`→`private` standardization — Harkirat's explicit follow-up call) —
  new description everywhere: "True = only you can see this response. False = everyone in the chat
  can see it." (`/manage`'s own variant keeps its "(default: True)" note, same as before.)
- **Loadout card footer**: "Last updated" → "Updated".
- **`/all`'s autocomplete/result list had no sort at all** — Mongo returns docs in natural/insertion
  order, so LOCUS (the very first weapon ever migrated from `builds.xlsx`) always showed first
  regardless of category or name. First fixed with a hand-confirmed `CATEGORY_SORT_ORDER` array
  (`AR`/`SMG`/`LMG` only, pending Harkirat confirming the rest); per his 2026-07-12 follow-up
  request, that array was dropped entirely — category now just sorts alphabetically too, same as
  weapon name already did within a category. `CATEGORY_SORT_ORDER` no longer exists in `index.js`.
- **Accent-color extraction switched from a flat pixel average to a SATURATION-WEIGHTED average**
  (`utils/colorExtract.js`) — a flat average washes out toward gray/white for the common case of a
  mostly-pale avatar/banner with one small vibrant feature (Harkirat's own example: an avatar that's
  mostly white but reads as "teal" to a person, because that's the one thing the eye registers).
  Each sampled pixel's RGB now gets weighted by its saturation squared before averaging, so
  low-saturation background pixels barely move the result while the image's most "prominent" color
  dominates it; falls back to a plain average for genuinely near-grayscale images (where every
  pixel's weight is ~0). **Note:** this only affects NEWLY-extracted colors — a user's existing
  cached `avatarColorHex`/`bannerColorHex` won't recompute until their underlying image actually
  changes (the cache-hit check is keyed on the Discord image hash, not on the algorithm version).
- **`/manage` Draws search now also matches against each draw's item names** (weapons/characters/
  emotes), not just the draw's title — searching "fss hurricane" or "charioteer" now finds the draw
  those items are actually IN.
- **`/calendar`'s active/all-events hint line condensed**, with a "(Tip: check out `/settings`)"
  appended, matching the same tip convention `/draw prices`' footer already uses.
- **Explicitly deferred to separate follow-up projects** (Harkirat's own call, not scope-cut
  silently): patch notes Cloudinary caching with season-based retention (**shipped 2026-07-13, see
  "Patch notes Cloudinary caching" above — no longer pending**); `/secondaries` → `/secondary`
  rename + a `/pistols` alias (still pending).

## "Browse other builds" dropdown + alphabetical category sort (2026-07-12/13, follow-up)
- **`/all`'s category sort dropped `CATEGORY_SORT_ORDER` entirely** (see the batch entry above) —
  Harkirat's explicit follow-up call to just go alphabetical instead of hand-confirming a category
  order. `index.js`'s autocomplete sort is now `category.localeCompare` then `weaponName.localeCompare`,
  nothing else.
- **Loadout cards (`/dmz`, `/all`, `/<category>`) gained a "Browse other builds" select-menu
  dropdown**, one of the two items previously flagged as deferred future work (see the "Next
  planned work" list below — now implemented, not still pending). Lets a user jump straight to a
  different weapon's card without re-running the slash command. `utils/loadoutRender.js`'s
  `buildCategoryBrowseRow()` builds it; `buildLoadoutCard()` takes a new `categoryBuilds` option
  (every `Loadout` doc sharing the card's scope — same `category`+`mode:'MP'` for MP cards, or
  every `mode:'DMZ'` doc for DMZ cards, since `/dmz` has no per-category commands the way MP does)
  and renders the row only when there's more than one WEAPON to browse to.
  - **One entry per weapon, not per build** — an earlier version listed every individual build with
    a "[Build N of M]" suffix (e.g. `SO-14 [Build 1 of 2]`), but that was simplified per Harkirat's
    follow-up request: selecting a weapon from the dropdown always opens it at build index 0 (Prev/
    Next already covers browsing between that weapon's own build variants). Deduped by `weaponKey`
    via a Map, sorted alphabetically by weapon name. Selected option's `value` is just the bare
    `weaponKey`.
  - **The dropdown row lives OUTSIDE the container**, as a top-level sibling passed into
    `withShareButton([containerPayload, browseRow], isEphemeral)` — NOT because Discord disallows a
    select menu nested inside a Container (a wrong theory floated mid-session; `/settings` and
    `/manage` both nest selects inside their containers successfully), just per Harkirat's explicit
    layout preference.
  - **REAL BUG (found live, 2026-07-13): the select-menu handler was originally placed inside
    `if (interaction.isButton())` in index.js instead of `if (interaction.isStringSelectMenu())`** —
    a plain misplacement from when the handler was first added, sitting right after the `set_page_`
    button handler which reads as adjacent but is actually one whole top-level block away. A
    `StringSelectMenuInteraction` never satisfies `isButton()`, so the entire handler was dead code:
    no error, no log, nothing — Discord just timed out the interaction after ~3s with a bare "This
    interaction failed", and several rounds of plausible-sounding fixes (container-nesting theory,
    defer-before-query reordering, empty-result guard) never touched the actual problem because none
    of them were checked against a real firing interaction. Only adding a `console.log` at the very
    top of `isStringSelectMenu()` and comparing it against a log inside the (unreachable) handler
    revealed the mismatch. Moved into the correct block, now working. See
    `[[feedback_verify_fix_actually_works]]` in memory for the general lesson.
  - **Discord's 25-option select cap is a silent truncation**, not an error — not expected to bite
    at the collection's current size (~100-200 docs total across ALL categories combined), but if a
    single category (or all of DMZ) ever exceeds 25 distinct weapons, revisit this rather than
    assuming every weapon is always reachable through the dropdown.
  - Added at all 3 render sites that needed it: `commands/dmz.js`'s `execute()`, `index.js`'s MP
    fallback route (`/all`+`/<category>`), and both the dmz/mp pagination handler AND the browse
    handler itself (paging or browsing again from an already-browsed card needs the same fresh
    `categoryBuilds` fetch, not just the initial slash-command response).

## `/draw prices` layout, final correction (2026-07-13)
Took several wrong attempts to land (see `[[feedback_check_sibling_code_before_guessing]]` in
memory) — the ACTUAL final, Harkirat-confirmed structure:
- **Container**: title > divider > entries (no divider before pagination) > pagination row >
  divider > "Switch between..." hint line > region-switch button row. The region-switch button is
  the container's LAST item.
- **Outside the container, as a separate top-level sibling**: the global nav row
  (`buildGlobalNavRow('nav_prices')`) — matching `/calendar`'s and `/draws`' own convention of
  passing the nav row into `withShareButton([containerPayload, globalNavigationRow], isEphemeral)`
  rather than nesting it. This command is the only one of the three with extra content (hint line +
  region button) that has to sit BETWEEN the container's own entries and the nav row, but the nav
  row still ends up last overall, just with no divider needed between it and the container (two
  separate top-level components already get Discord's own inter-component spacing).
- **No divider between the last entry and the pagination row** — this was explicitly requested
  multiple times and got dropped by mistake mid-session when a blanket "large divider spacing
  across the board" pass over-applied; don't reintroduce it.

## Known open issues (not yet fixed — flagged, not silently patched)
- `calendar.js` and `draws.js` both have defensive component-count chunking;
  `patchnotes.js`'s media carousel does not (untested at scale — likely fine since
  patch note screenshots per entry are usually few, but not empirically verified
  the way draws/calendar chunking was).
- **View Colors panel's vertical centering is unsolved.** Discord's Components V2 has no native
  vertical-align control for a Section's text relative to its accessory; a blank-emoji-line
  workaround was tried and reverted after it looked wrong on mobile. Purely cosmetic, no functional
  impact — see the View Colors section above for the full history.
- **Deco page renders as a static poster, not animated**, even though its thumbnail points at the
  real animated decoration URL — confirmed a genuine Discord-client limitation (needs a manual tap
  to animate in this context), not a bug in this bot's own code. The real fix (re-encoding APNG to
  GIF via ffmpeg on every render, since GIFs DO autoplay inline) was deliberately not built — real
  per-render latency for a cosmetic nicety Harkirat said he's fine leaving static. Nameplate's own
  animated `.webm` was tried in its place for the same reason and reverted for the same tap-to-play
  limitation; that plumbing (`nameplateAnimatedUrl`) was removed rather than left dead.
- **`ffmpeg` is a real, unverified-elsewhere system dependency** now that `utils/stillFrame.js`
  exists (View Colors' decoration extraction, `'dynamicProfile'`'s decoration source) — confirmed
  present on this Mac, not guaranteed on Render/Railway's production containers. If decoration color
  extraction ever silently stops working in production specifically (works locally, not live), check
  for `ffmpeg` on the deployed image before assuming it's a code bug.
- **Pagination/toggle clicks (draws' New/Returning switch, calendar/draw-prices sub-page nav, etc.)
  have a structural double network round-trip, not a CPU/DB bug** (investigated 2026-07-14, Harkirat
  flagged it "feels slow"). Traced every `await` on the hot path for both `/draws`' view-switch and
  `/calendar`'s sub-page nav: 1 `deferUpdate()` round-trip, 2 concurrent Mongo reads (`prefs` +
  `SeasonalData`), then a SEPARATE `rest.patch(Routes.webhookMessage(...))` round-trip to actually
  update the message — `buildContainer()` itself is pure sync string-building, no image/attachment
  work happens on this path at all. Ruled out the earlier View-Colors-incident-style cause too:
  Harkirat's own saved `accentColorStyle` is `'preset'`, which returns `presetHex` immediately with
  no live Discord fetch, so that's not contributing here. The real fix — answering with a single
  direct `UPDATE_MESSAGE` interaction response instead of defer-then-patch — would cut one full
  network hop per click, but touches every paginated command (draws/calendar/drawprices/settings/
  colors/loadouts), a broader refactor than anything else done this session. **Deliberately deferred
  to a future session** (Harkirat's explicit call — ship the smaller asks first) rather than attempted
  alongside the panel-lock/share-button/timestamp-format work above. **When we do tackle it, the agreed
  shape is a HYBRID, not a blanket conversion** (Harkirat's call, 2026-07-14): split by what each
  handler does before it can respond. Pure string-building paginated commands (draws, calendar,
  drawprices, settings) → single `UPDATE_MESSAGE` (one hop; they finish well inside Discord's 3s ACK
  window, so the margin `deferUpdate()` buys isn't needed). Anything that does heavy work before
  replying — View Colors (k-means extraction, swatch/gradient PNG generation, the ffmpeg still-frame)
  and any attachment-generating path → KEEP defer-then-patch, since blowing the 3s ACK is a real risk
  there. Heuristic: "does this path do CPU or image/network work before it replies?" → heavy stays
  defer, light goes single-hop.

## Next planned work

### Remaining v2 items (near-term, not yet started — filed 2026-07-14 from Harkirat's plan-notes file)
- **Reword `/timestamp`'s `format` option to `view`** — "format" collides conceptually with the
  timestamp *styles* (shortDate/longDate/etc.); "view" is what it actually controls (Embed vs Text).
  User-visible option rename, same shape as the earlier `ephemeral`→`private`→`hidden` renames. See
  the `/timestamp` `format` section above for where it's wired (slash option + `overrideState.isTextMode`).
- **Pagination double round-trip perf fix** — already in "Known open issues" above; deferred,
  cross-cutting (touches every paginated command), do when Harkirat greenlights it.

**Second batch of v2 items (filed 2026-07-15 from the plan-notes file).** These ship to `main`/live
NORMALLY even while v3 pre-release work runs in parallel — see the parallel-track note in
[[project_dior_builds_changelog_system]]; each one also gets cloned into the v3 branch once it exists.
- **Add the `hidden` option to `/settings`** — every other command has it; `/settings` was simply
  missed. Same option name/description as everywhere else.
- **Trim slash-command descriptions to fit mobile** — several currently truncate to `...` on mobile.
  Audit all of them against MOBILE width, not desktop.
- **Loadout search on a short/partial phrase** (e.g. `loc`, noticed live on mobile) currently fails
  unhelpfully. Two candidate fixes, decide at build: auto-resolve to the closest fuzzy match, OR
  improve the error to say "pick from the list" — specifically when there's no match OR the phrase is
  under 3 letters. Relates to `utils/search.js`'s `fuzzyMatch`.
- **Reword the action-blocked message** — easier to understand, some humor, and actually useful (say
  what to do instead). This is the panel-lock denial copy (see "Panel interaction locks" above).
- **Admin override on action blocks** — Harkirat (`ALLOWED_ADMIN_ID`) should never be action-blocked
  on someone else's panel; only non-admins get blocked where a block exists. **Critical detail: the
  override must NOT swap in his colors/data** — the panel keeps rendering the ORIGINAL user's data, he
  just isn't denied the interaction. Touches the centralized guard in `interactionCreate` and
  `/settings`' author-lock.
- **View Colors: extract a wider variety of colors** — juul's avatar (`local/juuls profile picture.png`)
  returned only 6 instead of the requested 8 AND missed a genuinely useful yellow; assume one root
  cause for both. **Keep existing behavior for genuinely minimal images**: juul's banner
  (`local/juuls banner.png`) correctly returned 4 on a single page — 2-4 colors on one page must stay
  the outcome for low-variety sources, NOT be padded out to a quota. See the k-means section above
  (over-clustering at K=1.5× and the 30-RGB merge step are the likely levers; the determinism
  requirement is non-negotiable — Refresh's change-detection depends on it). **Own session, Opus 4.8
  high** — real algorithmic work, not a filing item.
- **View Colors: always show the Display Name / Nameplate / Deco pages even when unset/no Nitro** —
  instead of hiding them, render a humor/"bully" page (no colors shown). Ties into the personality
  direction in the v3 list below.
- **View Colors: add full-resolution Download Avatar / Download Banner buttons** on their respective
  color-menu pages — bottom, OUTSIDE the container, beside the Refresh button; grey (style 2); same
  style as they already appear in `/settings`.
- **Pagination loop-back when >3 pages** (e.g. the Bal-27 loadout) — wrap last→first instead of a
  disabled button on the final page. **Keep the current disabled-state behavior at exactly 2 pages.**
  Affects the shared `buildPaginationRow` helper, so check every caller before changing it.

### v3 (next MAJOR version) — roadmap (filed 2026-07-14 from Harkirat's plan-notes file)
Harkirat's own planned feature set for the next whole-number version. **Not started; nothing here is a
committed design yet** — these are captured intents to brainstorm/spec properly when each is picked up.
Some overlap (noted inline). The v3 branch / pre-release-versioning / test-bot strategy lives in
[[project_dior_builds_changelog_system]], not repeated here.
- **`/meta` command** — view all weapons marked Meta. Options `mode:MP/DMZ`, `category:AR/SMG/...`,
  same hidden/ephemeral option as others; visibility tied to the `loadoutVisibility` toggle. Paginated
  through each meta build (a weapon's multiple builds shown in order, then the next weapon); in-panel
  dropdown to jump to a specific meta weapon; category-switch buttons below the embed; per-category
  accent color (reuses `getMpCategoryAccent()`); badges (incl. the Meta badge itself) hidden from this
  view. **NOTE: overlaps with the `/loadout` meta subcommand idea below — likely the same feature
  reached two ways; reconcile at design time rather than building both.**
- **Draw cost calculator** — given the user's CP region, draw type, attempts already done/remaining,
  and current CP balance: compute cost to finish the draw, and suggest the top-up package needed if the
  balance is short. Builds on `/draw prices`' existing per-pull `DRAW_DATA`.
- **Rename `/manage` → `/admin`, with slash-command-driven actions ALONGSIDE the existing panel.** Keep
  the interactive dashboard embed, but also support: `/admin` (opens dashboard), `/admin command:{x}`
  (opens dashboard on that command's page), `/admin command:{x} action:{y}` (opens that action's modal
  directly — add / bulk add / export new-or-returning draws / purge / etc.). The `action` choices must
  be scoped to only the actions valid for the chosen `command`, not a flat list of every action across
  all commands. Examples: `/admin command:loadouts action:add`, `/admin command:loadouts action:export
  SMGs hidden:false`, `/admin command:draws action:bulk delete`, `/admin command:season
  titles-&-deadlines` (no action — always just opens the modal). Also bundle in an internal DB-change
  logging/tracking system (log edits made via the admin command — e.g. a draw's info being edited).
- **`/settings` jump-to options** — `/settings customize:visibility|preferences|colors hidden:…` to
  land directly on page 1 (visibility), page 2 (preferences), or open the colors menu directly.
- **Detach `/colors`'s visibility from `/settings`** — give `/colors` its own visibility preference
  (while keeping the "View Colors" button ON the settings panel tied to settings visibility), and add
  `/colors` visibility toggles into the settings page.
- **Consolidate MP loadout commands into one `/loadout weapon:{fuzzy autocomplete}`** (leave `/dmz`
  as-is, already consolidated). Ideally one command that can search ALL weapons OR be scoped to a single
  category. Plus a **meta subcommand**: an embed listing just Meta-marked weapons, a dropdown to pick one
  (option description = category / main use-case, TBD at build), and pagination for multi-build weapons.
  (Overlaps with the standalone `/meta` above — pick one shape.)
- **Update/add new builds + audit current loadout data** so it's current with the live season.
- **Different view options for the slash commands** (unspecified in the notes — expand when picked up).
- **Ship the redesigned changelog artifact** (personal-use release-log visual — see
  [[project_changelog_redesign]], currently paused).
- **A `/help` command** (filed 2026-07-15) — detail the bot's commands/features, and reference the
  command in the bot's own Discord description so people can find it.
- **Personality pass: "bully people who are broke"** (filed 2026-07-15, Harkirat's words) — a silly
  running gag to give the bot some character. No fixed home yet; sprinkle it in as we go. Already has
  two concrete landing spots picked: the unset Display Name/Nameplate/Deco humor pages (v2 list above)
  and the reworded action-blocked message (v2 list above). Keep it light/jokey, never actually mean.

### v4 — roadmap (filed 2026-07-15, further out than v3; nothing designed yet)
- **Ship as a GUILD-INSTALL bot with text/prefix commands** — e.g. `d b ak117` ("dior build ak117"),
  plus a manually-settable per-server prefix. Commands like the prefix-setter should be
  server-EXCLUSIVE (the slash version only appears in a guild, never in a DM).
  **⚠️ This breaks the single biggest architectural assumption in this file** — see "This bot is
  user-installed only — it is NEVER a guild member with roles/permissions" above. That whole section
  becomes false under v4, and things it explains (the `50001 Missing Access` wall, why "Show Everyone"
  had to route through the interaction-response mechanism instead of a channel POST) would change.
  Re-read and rewrite that section as part of v4, don't leave it contradicting reality.
  **Discord Dev Portal changes required** (confirmed 2026-07-15): enable Guild Install in the portal's
  Installation settings, add `setIntegrationTypes([0, 1])` to commands, and — the big one — enable the
  **privileged MESSAGE CONTENT intent**, which needs Discord's approval once the bot passes 100 guilds.
  Real guild membership with View Channel / Send Messages also becomes a genuine requirement.
- **User-submitted loadouts, gated behind Harkirat's manual review** — a submission never goes live
  until he approves it. Needs a review surface where he can Deny / Accept / Accept-with-edit each
  submission (likely an extension of the `/admin` panel from v3).

### v5 — roadmap (filed 2026-07-15, most speculative; explore properly when picked up)
- **Generate the gunsmith image + share code ourselves, removing the manual-screenshot requirement.**
  Given a weapon + its attachments, the bot builds the image and the Gunsmith code, then stores it in
  Cloudinary. Groundwork this needs: teach the gunsmith CODE structure, teach the gunsmith LAYOUT
  design, and supply the base no-attachment gunsmith page for each weapon (they differ per weapon).
  Harkirat's own note: explore the idea further at v5 time — this is a research spike, not a spec.
- **User-built custom gunsmiths in-bot** (depends on the above working). Pick weapon → pick that
  weapon's available attachments → generate image → share/download. Plus a "my builds" command to save
  and view custom loadouts, merged INTO `/loadout` results for that specific user when they search
  that weapon — but visually distinguished so a custom build is never mistaken for one of the bot's
  own official builds.

- **General bot/code housekeeping session** (added 2026-07-15, Harkirat's request — "at some point
  soon", not urgent). A dedicated pass for accumulated cruft rather than doing it piecemeal mid-feature.
  Known items so far:
  - Delete leftover config backups: `.claude/settings.local.json.bak-*` (shows as untracked in
    `git status`) and `~/.claude/settings.json.bak-*`. Both changes they back up are verified working.
  - Audit for other stale absolute paths after the 2026-07-14 repo relocation to `/Applications/Claude
    Code/Diors-Builds`. The known ones are FIXED (the `SessionStart` hook now resolves via
    `$CLAUDE_PROJECT_DIR`; two `node -c` permission entries are now relative) — this is a sweep for
    anything missed, ideally preferring relative/dynamic paths so a future move can't rot them again.
    **Note: the memory store staying at the `-Applications-Diors-Builds` slug is NOT part of this — it's
    deliberate and move-proof, see the canonical-memory-path note at the top of this file.**
  - General dead-code / stale-comment / unused-dependency review across the repo.
  - Revisit whether `patchnotes.js`'s media carousel needs the component-count chunking `draws`/
    `calendar` have (see "Known open issues").
- **Single-instance guard for the bot itself** (added 2026-07-13 to the to-do list, Harkirat's
  request — do later, not urgent). This is a single-token bot; multiple concurrent instances collide
  badly (see the "Branch-testing discovery" note above and `[[feedback_multiple_bot_instances]]`).
  Add a startup lock / refuse-to-start-if-already-connected mechanism so a stray leftover local
  `node index.js` can't silently race the deployed Render instance again. Until this exists, killing
  stray local instances is a manual step in the push flow.
- **Full DEVLOG backfill from prior chat transcripts** (added 2026-07-13). `DEVLOG.md` (new, local-only
  narrative "journey & lessons" record — see the changelog-system memory) shipped a v1 covering the
  2026-07-13 session richly plus brief `[backfill — expand later]` stubs for earlier milestones. The
  deferred task (waiting on token budget, Harkirat's call) is to retrieve the actual prior chat
  transcripts — which hold reasoning/interactions/discoveries that never reached CLAUDE.md or memory —
  and merge/expand them into DEVLOG's Part A journey + Part B lessons ledger.
- **Changelog is now caught up** (done 2026-07-13): `CHANGELOG.md`/`CHANGELOG-SUMMARY.md` are current
  through v2.17.3 under the 3-part scheme, with a roadmap section added to each. Was ~9 versions behind
  before this; no longer pending.
- **The real "search + multi-select" flow for Delete Multiple (all entities) and Loadouts' Replace
  Multiple** — deliberately deferred out of the 2026-07-12 `/manage` panel redesign at Harkirat's
  explicit request, to avoid risking a usage-limit interruption mid-build on top of everything else
  in that pass. See the `/manage` design-decision-log entry above for exactly what's a placeholder
  right now vs. what the real version needs to do. Still pending.
- **`/secondaries` → `/secondary` rename + a `/pistols` alias** registered as a genuinely separate
  command querying the same category — still explicitly deferred, not scope-cut silently.
- The 2026-07-12 batch (draw prices, `/manage`, `/settings`, slash-command overpass, color
  repalette) and patch notes Cloudinary caching are now both fully complete and shipped — see their
  own CLAUDE.md sections above for detail, not listed here as pending anymore.
- **The View Colors panel / accent-color-personalization feature (this session, 2026-07-13/14) is
  functionally complete** — k-means extraction, dynamic relative labeling, `/colors` command, the
  `/settings` button, `'displayName'`/`'dynamicProfile'` accent styles, Refresh Colors with
  cooldown+change-detection, all live-tested and confirmed working by Harkirat across many rounds.
  See the "View Colors panel" section above for the full history and the 2 known open cosmetic gaps
  listed just above (vertical centering, deco/nameplate animation). **2026-07-13 CPU + sizing pass**
  (lazy per-source extraction, dropped `/settings` soft-refresh, k-means convergence + yields, swatch
  memo, banner/gradient/nameplate 512px sizing) branch-tested on Render free tier and merged — see
  the "Post-ship production incident" and "View Colors preview sizing" sections above.
- **Not yet re-confirmed live**: the `sendV2Payload` attachments-replacement fix (Refresh Colors
  should now visually update the panel immediately instead of requiring a page-switch to see new
  swatches) was boot-tested but not re-exercised against a real Discord click since the fix landed —
  worth a quick re-test the next time this area is touched, rather than assuming it's confirmed.
- Not yet verified: Harkirat manually exercising every `/manage` panel action (including the
  combined-line Add Draw field, upsert-by-title Replace, granular Purge scopes, every Confirm/Cancel
  step, and every Undo button), the `/settings` 2-page layout, and the Cloudinary-cache add/edit/bulk
  flows (both draws' and patch notes'), live in Discord.
