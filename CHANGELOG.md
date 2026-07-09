# Changelog (Detailed)

Dior's Builds' own "release notes" — tracks what shipped, when, and why. See
[CHANGELOG-SUMMARY.md](CHANGELOG-SUMMARY.md) for a plain-language version of the same timeline.

**Versioning:**
- **v1.0** (`b225785`) — the actual first working version of the bot. There is no "v0.x" — the
  very first commit was already a real (if tiny) release, not a pre-release draft.
- **v1.x** — the pre-collaboration era: solo-built, Excel-backed MP loadouts, classic Discord
  Embeds. Runs through `cbf2106` (the original `/timestamp` command).
- **v2.0** (`63cebb1`, "Pre-release") — the Components V2 rewrite. This is also where Harkirat
  started working on the bot together with Claude, so everything from here on has much more
  detailed reasoning behind it than the entries above.
- **v2.x** — a big update within the v2 era: a new feature, a real design change, or an
  architecture shift.
- **v2.xx** — a minor push within that big update: bug fixes, small tweaks, data corrections,
  internal refactors with no user-facing change.

Only pushes that actually went live get a permanent version number — see **Unreleased** at the
bottom of this file for work that's committed but not yet pushed.

---

## v2.7 — 2026-07-09
**Direct Cloudinary/GitHub integration + bulk loadout data entry**
- Set up direct API access to both GitHub (fine-grained PAT, scoped to this repo — Contents,
  Pull requests, Dependabot alerts, Actions) and Cloudinary (upload/rename/list resources) so
  loadout data and images can be added, corrected, and cross-checked directly against the live
  database and asset storage instead of only through `/manage`.
- Fixed a real UI bug: DMZ loadout cards were showing the **buildName** under a `### Gunsmith Code`
  heading with a working "Copy Code" button, even though DMZ builds never have a real in-game
  share code (confirmed by Harkirat) — copying it would hand someone a fake code. Both the heading
  and the button are now skipped entirely for `mode: 'DMZ'` in `utils/loadoutRender.js`.
- Large batch of real loadout data added/corrected via screenshot extraction, replacing several
  "Coming Soon" placeholders and fixing two weapon-naming mistakes:
  - **Bal-27** (AR): rebuilt from 6 screenshots down to 5 confirmed real builds (one bogus
    community-credited build removed, Cloudinary files renamed/renumbered to match).
  - **DMZ**: first-ever DMZ loadout data added — SO-14, Type 19 (2 builds), AS VAL, AK117, Fennec,
    J358 (Secondaries), Outlaw (Sniper).
  - **PKM** (LMG) and **SKS** (Marksman): additional real MP build variants added alongside their
    existing ones.
  - **LOCUS**: both MP builds migrated off imgur onto Cloudinary directly, closing out the last
    non-Cloudinary image hosting in the whole collection.
  - **Naming corrections**: "GS50" was actually **.50 GS** and "LCAR" was actually **L-CAR 9** —
    both renamed (weapon name + internal key) to match their real in-game names, carrying their
    existing badges over.
  - **New Secondaries weapons**: Machine Pistol, Crossbow, Dobvra, Shorty — real builds added
    (Machine Pistol and Crossbow replacing earlier placeholders).
  - **New Shotgun weapon**: R9-0, added with a Top 3 badge.

## v2.6 — 2026-07-08
**Placeholder loadout seeding + changelog system**
- Seeded 7 weapons (Bal-27, FSS Hurricane, Pharo, Machine Pistol, LCAR, GS50, Crossbow) that had
  badge assignments but no loadout data, with "Coming Soon" placeholder builds (`scripts/
  createPlaceholderLoadouts.js`) — first real data in the `SECONDARIES` category at the time
  (most have since been replaced with real data — see v2.7).
- Added this changelog system (`CHANGELOG.md` + `CHANGELOG-SUMMARY.md` + the stylized release-log
  page).

## v2.51 — 2026-07-08
**"Toxic" badge + bulk badge import** (`6872a43`)
- Added a third independent loadout badge, **Toxic** (Harkirat's term for an unbalanced/cheese
  pick) — fully separate from Meta and Best/Top N, so a build can be any combination of the three
  (e.g. Striker is Meta + Best + Toxic all at once, NA-45 is Toxic-only).
- Added `scripts/applyBadgesBulk.js` — bulk-assigns badges across many weapons at once from a
  pasted list instead of editing each loadout individually via `/manage`. Applied to 28 weapons
  (52 build docs) from Harkirat's own badge list.

## v2.5 — 2026-07-08
**Efficiency pass** (`9d06126`) — "Major health check and optimization check of code"
- Added `.lean()` to every read-only Mongoose query; parallelized independent `Promise.all` awaits
  (prefs + main content queries) across most commands.
- Added a compound `{category, mode}` index on `Loadout`.
- Extracted 3 shared helpers to kill duplication that had already caused one real bug (the nav
  palette rotating out of sync with button order): `utils/globalNav.js` (nav row), `utils/
  ephemeral.js` (visibility-priority resolution), `utils/sendV2Payload.js` (raw `rest.patch` V2
  send). Extracted `adminParser.js`'s `parseItemLine()` out of 3 copy-pasted implementations.
- Fixed the remaining unawaited `return interaction.reply/followUp(...)` sites to match the
  established await + own-try/catch pattern.
- Pure internal refactor — no user-facing behavior change, hence a minor (`.5`) rather than a new
  major version.

## v2.4 — 2026-07-08
**Flexible badges + fuzzy search** (`e5e599d`) — "QoL updates and implemented loadout badges
system"
- `categoryRank` badges support any `topN` (not just a hardcoded `top3`) — some categories don't
  cap out at exactly 3.
- Badges became a weapon-level property: editing one build's badges propagates to every other
  build sharing that weapon (`Loadout.updateMany`) instead of only affecting the one build edited.
- Edit-loadout confirmation messages now name the weapon/build and report any unrecognized badge
  tokens instead of silently ignoring typos.
- Autocomplete everywhere in the bot (loadout search, `/manage`, `/patch notes`) switched from
  literal substring matching to punctuation/whitespace-insensitive fuzzy matching (`utils/
  search.js`) — fixes real misses like typing `dlq` not matching `DL Q33`.
- This is the commit where the badge system introduced in v2.3 became a genuinely complete,
  admin-usable feature rather than a first pass.

## v2.31 — 2026-07-07
**Documented the badge redesign** (`475929e`) — "Introduced the loadout badges concept"
- Pure documentation commit: wrote up the v2.3 loadout card redesign (badges, Copy Attachments)
  in `CLAUDE.md` so the reasoning behind it wasn't lost.

## v2.3 — 2026-07-07
**Loadout card redesign** (`9ef686b`) — per `loadouts_ui.json` reference — "Major loadouts UI
design started"
- Weapon name promoted to the top heading; category moved from an overline down into the footer
  (`{category} • Build N of M • Last updated...`).
- Introduced the Meta/Best/Top-N "badges" line under the weapon name (the first pass — v2.4 is
  where this became fully flexible and admin-friendly).
- Added a **Copy Attachments** button (plain list, ephemeral) alongside the existing Copy Code.
- `Attachments`/`Gunsmith Code` became real `###` headings with backtick-wrapped attachment lines;
  divider between Gunsmith Code and the image removed so the image sits directly below the text.
- Flavor-text `description` moved below the top divider and switched from italic to a real
  blockquote (`> `), with sentence-case normalization.
- A real visual redesign of the bot's flagship card — big update.

## v2.21 — 2026-07-07
**Per-category accent colors + `/secondaries` readiness** (`5d8b82e`)
- MP loadout cards now use a per-weapon-category accent color (AR/SMG/LMG/MARKSMAN/SNIPER/SHOTGUN/
  SECONDARIES each get their own color) instead of one flat color.
- `/secondaries` registered as a live command ahead of any actual SECONDARIES loadouts existing.
- A visual/data tweak layered on the existing architecture, not a new system — minor.

## v2.2 — 2026-07-07
**Crash-resilience hardening + UX pass** (`8ca36d3`)
- Fixed a real Railway crash: `client.on('error', ...)` was missing, so a rejection from an async
  `interactionCreate` listener (discord.js's `captureRejections: true` behavior) could bypass the
  outer try/catch entirely and take the whole bot down.
- Fixed a second crash class: unawaited `return interaction.reply(...)` calls inside error-fallback
  branches don't stay "covered" by their enclosing try/catch once the promise rejects later.
- Fixed "Share Publicly" actually failing in real servers (`DiscordAPIError[50001] Missing Access`)
  by routing through the interaction-response mechanism instead of a raw bot-token channel POST.
- Header/calendar/draws UX polish pass.

## v2.1 — 2026-07-07
**Officially released: DM / user-install visibility fix** (`18bc47d`)
- Added `.setIntegrationTypes([1]).setContexts([0,1,2])` to `/draws`, `/calendar`, `/patch notes`,
  `/draw prices`, `/dmz`, `/season end`, and `/settings` — they were silently guild-only, so they
  never showed up in DMs or as a user-installed app. `/update` and `/manage` stay guild-only
  intentionally (admin-only).
- Fixed an unawaited `return interaction.reply(...)` in the slash-command and nav-button error
  fallbacks in `index.js`: when the fallback reply itself failed (seen live on Railway as error
  10062 then 40060), the rejection escaped past the outer try/catch and crashed the whole process.
  Now awaited and wrapped in their own try/catch, plus a process-level `unhandledRejection` logger
  as a backstop.
- Marked "Officially released" in Harkirat's own notes for this commit — the point the bot became
  usable everywhere it was designed to be, not just in-server.

## v2.0 (Pre-release) — 2026-07-06
**Components V2 UI overhaul + MongoDB-backed MP loadouts** (`63cebb1`) — "Major bot update
launched"
- Migrated the entire bot's UI from classic Embeds to Discord's Components V2 (Containers,
  Sections, Text Displays, Media Galleries).
- Migrated MP weapon loadouts off the old in-memory `builds.xlsx`-backed system onto MongoDB
  (`Loadout` collection), matching how DMZ loadouts already worked.
- Added the "Share Publicly" button pattern for ephemeral responses.
- The single biggest architecture change in the bot's history, and the point Harkirat started
  working on the bot together with Claude — everything before this line is reconstructed from
  memory/commit messages; everything after is from direct working knowledge of the change.

---

## v1.7 — 2026-07-04
**`/timestamp` arrives** (`cbf2106`)
- New natural-language date/timezone conversion command added, with its own parsing backend.

## v1.61 — 2026-05-17
**Render bind fix** (`6bab40b`)
- Bug fixes, including binding the keep-alive Express server to `0.0.0.0` (required for Render's
  health checks to actually reach it).

## v1.6 — 2026-05-17
**Render keep-alive workaround** (`669d68d`)
- Implemented a keep-alive ping to work around Render's free-tier spin-down behavior.

## v1.5 — 2026-04-08
**Loadout screenshots** (`ccbddd4`)
- Added screenshots for loadouts, and built the Cloudinary URL logic based on loadout screenshot
  filenames — the precursor to today's `imageKey`/`buildImageUrl()` system.

## v1.4 — 2026-04-08
**"Practical start" of the bot** (`8c082a6`) — "Final build: fuzzy search, inline fields, and
green copy button"
- Major bug fixes and refinement of the code logic.
- Added fuzzy search, inline embed fields, and a green "Copy" button.
- Marked as the bot's practical start/release in Harkirat's own notes — the point it went from
  "a script" to "a bot people could actually use."

## v1.3 — 2026-04-08
**Embed builder engine** (`f1cbe1f`)
- Embed design improvements.
- Built out an "Embed Builder Engine" — a reusable internal system for constructing the classic
  Discord Embeds this early version relied on (this is the direct ancestor of today's `utils/
  loadoutRender.js`, long before Components V2 existed).
- Other code refinements and bug fixes.

## v1.21 — 2026-04-08
**Bug fixes** (`448ae1c`)
- Bug fixes and correction of some code following the QoL pass.

## v1.2 — 2026-04-08
**Quality-of-life pass** (`cdfb082`)
- Added autocomplete, fuzzy matching, dynamically-derived weapon categories, and pagination.
- Added the first per-weapon-category commands.

## v1.1 — 2026-04-08
**Excel-backed weapon data** (`86a6845`)
- Added the main portion of guns, storing loadout data in an Excel spreadsheet — the system that
  `scripts/migrateBuildsToMongo.js` would eventually migrate off of, over a year later (v2.0).

## v1.0 — 2026-04-08
**Initial launch** (`b225785`)
- The very first version of the bot: just LOCUS, to test that the bot worked at all. No calendar,
  no draws, no patch notes yet — MP loadouts only, rendered as classic Discord Embeds (Components
  V2 didn't exist yet as a Discord feature at this point).

