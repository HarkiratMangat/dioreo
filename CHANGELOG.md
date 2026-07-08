# Changelog (Detailed)

Dior's Builds' own "release notes" — tracks what shipped, when, and why, reconstructed from commit
history. See [CHANGELOG-SUMMARY.md](CHANGELOG-SUMMARY.md) for a plain-language version of the same
timeline.

**Versioning:**
- **v0.x** — everything before the bot was considered "done enough" to call v1.0 (pre-2026-07-07).
- **v1.0** (`18bc47d`) — the cutoff Harkirat drew: the point the bot became properly usable via DM/
  user-install everywhere, not just in-server.
- **v1.x** — a big update from v1.0 onward: a new feature, a real design change, or an architecture
  shift.
- **v1.xx** — a minor push within that big update: bug fixes, small tweaks, data corrections,
  internal refactors with no user-facing change.

Only pushes that actually went live get a version number. Version boundaries before this file
existed (everything through v1.3) are a judgment call made when writing this file, not something
decided at the time — flag any of them to Harkirat if they should be redrawn.

---

## v1.3 — 2026-07-08
**Toxic badge, bulk badge import, placeholder loadout seeding, this changelog**
- Added a third independent loadout badge, **Toxic** (an unbalanced/cheese pick) — fully separate
  from Meta and Best/Top N, so a build can be any combination of the three (e.g. Striker is
  Meta + Best + Toxic all at once, NA-45 is Toxic-only).
- Added `scripts/applyBadgesBulk.js` — bulk-assigns badges across many weapons at once from a
  pasted list instead of editing each loadout individually via `/manage`. Applied to 28 weapons
  (52 build docs).
- Added `scripts/createPlaceholderLoadouts.js` — seeded 7 weapons that had badge assignments but no
  loadout data yet (Bal-27, FSS Hurricane, Pharo, Machine Pistol, LCAR, GS50, Crossbow) with
  "Coming Soon" placeholder builds so they're live and searchable immediately — attachments/image/
  Gunsmith code to be filled in later via `/manage`. First real data in the `SECONDARIES` category.
- Added this changelog system (`CHANGELOG.md` + `CHANGELOG-SUMMARY.md`).

## v1.12 — 2026-07-08
**Efficiency pass** (`9d06126`)
- Added `.lean()` to every read-only Mongoose query; parallelized independent `Promise.all` awaits
  (prefs + main content queries) across most commands.
- Added a compound `{category, mode}` index on `Loadout`.
- Extracted 3 shared helpers to kill duplication that had already caused one real bug (the nav
  palette rotating out of sync with button order): `utils/globalNav.js` (nav row), `utils/
  ephemeral.js` (visibility-priority resolution), `utils/sendV2Payload.js` (raw `rest.patch` V2
  send). Extracted `adminParser.js`'s `parseItemLine()` out of 3 copy-pasted implementations.
- Fixed the remaining unawaited `return interaction.reply/followUp(...)` sites to match the
  established await + own-try/catch pattern.
- Pure internal refactor — no user-facing behavior change, hence a minor (`.12`) not a big (`.2`).

## v1.11 — 2026-07-08
**Flexible badges + fuzzy search** (`e5e599d`)
- `categoryRank` badges support any `topN` (not just a hardcoded `top3`) — some categories don't
  cap out at exactly 3.
- Badges are now a weapon-level property: editing one build's badges propagates to every other
  build sharing that weapon (`Loadout.updateMany`) instead of only affecting the one build edited.
- Edit-loadout confirmation messages now name the weapon/build and report any unrecognized badge
  tokens instead of silently ignoring typos.
- Autocomplete everywhere in the bot (loadout search, `/manage`, `/patch notes`) switched from
  literal substring matching to punctuation/whitespace-insensitive fuzzy matching (`utils/
  search.js`) — fixes real misses like typing `dlq` not matching `DL Q33`.
- Refinements of the badge system v1.1 introduced, plus a bug fix (search) — minor, not a big.

## v1.1 — 2026-07-07
**Loadout card redesign** (`9ef686b`, `475929e`) — per `loadouts_ui.json` reference
- Weapon name promoted to the top heading; category moved from an overline down into the footer
  (`{category} • Build N of M • Last updated...`).
- Introduced the Meta/Best/Top-N "badges" line under the weapon name (the feature v1.11/v1.3 later
  extend).
- Added a **Copy Attachments** button (plain list, ephemeral) alongside the existing Copy Code.
- `Attachments`/`Gunsmith Code` became real `###` headings with backtick-wrapped attachment lines;
  divider between Gunsmith Code and the image removed so the image sits directly below the text.
- Flavor-text `description` moved below the top divider and switched from italic to a real
  blockquote (`> `), with sentence-case normalization.
- A real visual redesign of the bot's flagship card — big update.

## v1.02 — 2026-07-07
**Per-category accent colors + `/secondaries` readiness** (`5d8b82e`)
- MP loadout cards now use a per-weapon-category accent color (AR/SMG/LMG/MARKSMAN/SNIPER/SHOTGUN/
  SECONDARIES each get their own color) instead of one flat color.
- `/secondaries` registered as a live command ahead of any actual SECONDARIES loadouts existing.
- A visual/data tweak layered on the v1.0 architecture, not a new system — minor.

## v1.01 — 2026-07-07
**Crash-resilience hardening + UX pass** (`8ca36d3`)
- Fixed a real Railway crash: `client.on('error', ...)` was missing, so a rejection from an async
  `interactionCreate` listener (discord.js's `captureRejections: true` behavior) could bypass the
  outer try/catch entirely and take the whole bot down.
- Fixed a second crash class: unawaited `return interaction.reply(...)` calls inside error-fallback
  branches don't stay "covered" by their enclosing try/catch once the promise rejects later.
- Fixed "Share Publicly" actually failing in real servers (`DiscordAPIError[50001] Missing Access`)
  by routing through the interaction-response mechanism instead of a raw bot-token channel POST.
- Header/calendar/draws UX polish pass.
- Bug fixes and polish following v1.0 — minor.

## v1.0 — 2026-07-07
**DM / user-install visibility fix** (`18bc47d`) — Harkirat's chosen cutoff for "v1"
- `/draws`, `/calendar`, `/patch notes`, `/draw prices`, `/dmz`, `/season end`, `/settings` were
  missing `.setIntegrationTypes([1]).setContexts([0,1,2])`, so they silently never appeared when
  DMing the bot or using it as a user-installed app, even though the bot as a whole supports it.
- Fixed a related crash-on-double-fail bug in the interaction router.
- Marked v1.0 because this is the point the bot actually became usable everywhere it was designed
  to be (DM + user-install, not just in-server) — a meaningful milestone even though the underlying
  change is a small fix, not a new feature.

---

## v0.3 — 2026-07-06
**Components V2 UI overhaul + MongoDB-backed MP loadouts** (`63cebb1`)
- Migrated the entire bot's UI from classic Embeds to Discord's Components V2 (Containers,
  Sections, Text Displays, Media Galleries).
- Migrated MP weapon loadouts off the old in-memory `builds.xlsx`-backed system onto MongoDB
  (`Loadout` collection), matching how DMZ loadouts already worked.
- Added the "Share Publicly" button pattern for ephemeral responses.
- The single biggest architecture change in the bot's history — a big update.

## v0.2 — 2026-07-04
**Added `/timestamp`** (`cbf2106`)
- New natural-language date/timezone conversion command. A new feature — big update.

## v0.11 — 2026-05-17
**Render keep-alive workaround** (`669d68d`, `6bab40b`)
- Added a keep-alive ping to work around Render free-tier's spin-down behavior, and fixed Express
  binding to `0.0.0.0` (required for Render's health checks to reach it).
- Infra/deploy fix, not a feature — minor.

## v0.1 — 2026-04-08
**Original bot foundation** (`b225785` through `ccbddd4`)
- Initial build: lucky draws, seasonal calendar, patch notes, CP draw pricing, DMZ loadout lookup
  (Excel-backed), fuzzy search, inline embed fields, screenshots for documentation.
- Everything from this single initial build session, bundled as one version.
