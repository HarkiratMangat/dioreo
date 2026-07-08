# Changelog

Dior's Builds' own "release notes" — tracks what shipped, when, and why. Versioning is informal
(this file didn't exist until v1.3; earlier versions are reconstructed from commit history):

- **v1.x** — a big update: a new feature, a real design change, or an architecture shift.
- **v1.xx** — a minor push within that big update: bug fixes, small tweaks, data corrections.

Only pushes that actually went live on Render get a version number — local-only/uncommitted work
doesn't count until it's deployed.

---

## v1.3 — 2026-07-08
**Toxic badge + bulk badge import**
- Added a third independent loadout badge, **Toxic** (Harkirat's term for an unbalanced/cheese
  pick) — fully separate from Meta and Best/Top N, so a build can be any combination of the three
  (e.g. Striker is Meta + Best + Toxic all at once, NA-45 is Toxic-only).
- Added `scripts/applyBadgesBulk.js` — bulk-assigns badges across many weapons at once from a
  pasted list instead of editing each loadout individually via `/manage`. Applied to 28 weapons
  (52 build docs) from Harkirat's own badge list.
- Added `scripts/createPlaceholderLoadouts.js` — seeded 7 weapons that had badge assignments but no
  loadout data yet (Bal-27, FSS Hurricane, Pharo, Machine Pistol, LCAR, GS50, Crossbow) with
  "Coming Soon" placeholder builds, so they're live and searchable in `/all`/`/<category>`/
  autocomplete immediately — attachments/image/Gunsmith code to be filled in later via `/manage`.
  This is also the first real data in the `SECONDARIES` category.

## v1.22 — 2026-07-08
**Efficiency pass**
- Added `.lean()` to every read-only Mongoose query; parallelized independent `Promise.all` awaits
  (prefs + main content queries) across most commands.
- Added a compound `{category, mode}` index on `Loadout`.
- Extracted 3 shared helpers to kill duplication that had already caused one real bug (the nav
  palette rotating out of sync with button order): `utils/globalNav.js` (nav row), `utils/
  ephemeral.js` (visibility-priority resolution), `utils/sendV2Payload.js` (raw `rest.patch` V2
  send). Extracted `adminParser.js`'s `parseItemLine()` out of 3 copy-pasted implementations.
- Fixed the remaining unawaited `return interaction.reply/followUp(...)` sites to match the
  established await + own-try/catch pattern.
- General comment/CLAUDE.md cleanup pass, no functional changes beyond the above.

## v1.21 — 2026-07-08
**Flexible badges + fuzzy search**
- `categoryRank` badges support any `topN` (not just a hardcoded `top3`) — some categories don't
  cap out at exactly 3.
- Badges are now a weapon-level property: editing one build's badges propagates to every other
  build sharing that weapon (`Loadout.updateMany`) instead of only affecting the one build edited.
- Edit-loadout confirmation messages now name the weapon/build and report any unrecognized badge
  tokens instead of silently ignoring typos.
- Autocomplete everywhere in the bot (loadout search, `/manage`, `/patch notes`) switched from
  literal substring matching to punctuation/whitespace-insensitive fuzzy matching (`utils/
  search.js`) — fixes real misses like typing `dlq` not matching `DL Q33`.

## v1.2 — 2026-07-07
**Loadout card redesign** (per `loadouts_ui.json` reference)
- Weapon name promoted to the top heading; category moved from an overline down into the footer
  (`{category} • Build N of M • Last updated...`).
- Added Meta/Best/Top-N "badges" line under the weapon name.
- Added a **Copy Attachments** button (plain list, ephemeral) alongside the existing Copy Code.
- `Attachments`/`Gunsmith Code` became real `###` headings with backtick-wrapped attachment lines;
  divider between Gunsmith Code and the image removed so the image sits directly below the text.
- Flavor-text `description` moved below the top divider and switched from italic to a real
  blockquote (`> `), with sentence-case normalization.

## v1.13 — 2026-07-07
**Per-category accent colors + `/secondaries` readiness**
- MP loadout cards now use a per-weapon-category accent color (AR/SMG/LMG/MARKSMAN/SNIPER/SHOTGUN/
  SECONDARIES each get their own color from the "Custom Class" palette) instead of one flat color.
- `/secondaries` registered as a live command ahead of any actual SECONDARIES loadouts existing,
  so it doesn't silently stay missing until the first one is added.

## v1.12 — 2026-07-07
**Crash-resilience hardening + UX pass**
- Fixed a real Railway crash: `client.on('error', ...)` was missing, so a rejection from an async
  `interactionCreate` listener (discord.js's `captureRejections: true` behavior) could bypass the
  outer try/catch entirely and take the whole bot down.
- Fixed a second crash class: unawaited `return interaction.reply(...)` calls inside error-fallback
  branches don't stay "covered" by their enclosing try/catch once the promise rejects later.
- Fixed "Share Publicly" actually failing in real servers (`DiscordAPIError[50001] Missing Access`)
  by routing through the interaction-response mechanism instead of a raw bot-token channel POST —
  this bot is user-installed only and has no real channel permissions anywhere.
- Header/calendar/draws UX polish pass.

## v1.11 — 2026-07-07
**DM / user-install visibility fix**
- `/draws`, `/calendar`, `/patch notes`, `/draw prices`, `/dmz`, `/season end`, `/settings` were
  missing `.setIntegrationTypes([1]).setContexts([0,1,2])`, so they silently never appeared when
  DMing the bot or using it as a user-installed app, even though the bot as a whole supports it.
- Fixed a related crash-on-double-fail bug in the interaction router.

## v1.1 — 2026-07-06
**Components V2 UI overhaul + MongoDB-backed MP loadouts**
- Migrated the entire bot's UI from classic Embeds to Discord's Components V2 (Containers,
  Sections, Text Displays, Media Galleries).
- Migrated MP weapon loadouts off the old in-memory `builds.xlsx`-backed system onto MongoDB
  (`Loadout` collection), matching how DMZ loadouts already worked.
- Added the "Share Publicly" button pattern for ephemeral responses.

## v1.0 — 2026-04-08 to 2026-07-04
**Original bot foundation**
- Initial build: lucky draws, seasonal calendar, patch notes, CP draw pricing, DMZ loadout lookup
  (Excel-backed), fuzzy search, inline embed fields.
- Render keep-alive workaround for the free-tier sleep behavior.
- `/timestamp` natural-language date/timezone command added.
