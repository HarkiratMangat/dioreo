---
kind: rule
status: live
paths:
  - "commands/**"
---

# Commands — architecture & per-command notes

*Loads when you touch any `commands/*.js`. The command list + routing conventions, the user-install/DM requirement, `/timestamp`, and loadout `build`/`visibility` options. Deeper per-command detail lives in: `.claude/rules/manage-panel.md` (`/manage`), `.claude/rules/draw-prices.md`, `.claude/rules/settings-and-expiry.md` (`/settings` locks/expiry), `.claude/rules/loadouts.md` (loadout lookup), `.claude/rules/accent-and-colors.md` (`/colors`, accent styles), and `.claude/rules/interaction-router.md` (`index.js` handler/router logic).*

## Command list
Base commands use subcommands to group related functionality:
- `/season end` — `seasonend.js`
- `/draws` — `draws.js` (flat command, no subcommand)
- `/patch notes` — `patchnotes.js`
- `/calendar` — `calendar.js` (flat command)
- `/draw prices` — `drawprices.js`
- `/settings`, `/timestamp` — flat commands
- `/dmz` — `dmz.js` (flat command; standalone DMZ loadout lookup, up to 9 attachments)
- `/all`, `/<category>` (`/ar`, `/lmg`, `/sniper`, etc.) — MP loadout lookup. NOT files in `commands/` — auto-generated in `index.js`'s `handleBotReady()` from whatever categories currently exist in MongoDB (`Loadout.distinct('category', {mode:'MP'})`), so they only show up after the bot's first successful boot post-data-import. See `.claude/rules/loadouts.md`.
- `/help` — `help.js` (flat command; categorized command guide — Gunsmiths/Draws/Seasonal Info/Utilities/Preferences — plus a `cmd:` autocomplete jump. Shipped 2026-08-08 22:35 EDT as Pre-Release v3.1.0.)
- `/manage` (admin-only) — the single admin data-entry command; full panel design in `.claude/rules/manage-panel.md`.

## User-install / DM support — must be set per-command, not inherited
Discord requires each slash command to individually opt in to being usable outside a guild via `.setIntegrationTypes([1]).setContexts([0, 1, 2])` on its `SlashCommandBuilder` — there's no bot-level toggle that applies this to every command at once. `/timestamp`, `/all`, and the auto-generated `/<category>` MP commands had this from an earlier session, but `/draws`, `/calendar`, `/patch notes`, `/draw prices`, `/dmz`, `/season end`, and `/settings` didn't — so they silently never showed up when DMing the bot or using it as a user-installed app, even though the bot as a whole is set up for user-install. Fixed by adding the same `.setIntegrationTypes([1]).setContexts([0, 1, 2])` to all of them. **`/manage` originally stayed guild-only on purpose** (it's gated by `setDefaultMemberPermissions(0)`, which has no real meaning in a DM since there are no guild permissions to check) **but this was reversed 2026-07-12** — Harkirat explicitly asked to "activate the admin command so i can use them in DMs if i want," so it now has the same `.setIntegrationTypes([1]).setContexts([0, 1, 2])` as every other command. `setDefaultMemberPermissions(0)` still gates it in a guild; the `ALLOWED_ADMIN_ID` check in `manage.js`'s `execute()` is what actually blocks anyone else, including in a DM where guild permissions don't apply at all. ⚠️ **UPDATED 2026-08-09 12:01 EDT (v3 guild install) — the integration-types half of the above is now historical.** Public commands register **`.setIntegrationTypes([0, 1])`**, not `[1]`: `[0]` is guild install, added so the bot's commands work inside a server for people who have NOT user-installed it. `.setContexts([0, 1, 2])` is unchanged. The three ADMIN commands (`/manage`, `/alerts`, `/autobuild`) deliberately stay `[1]` — an admin command advertised in every server's command list is noise plus needless surface, and Harkirat still reaches them anywhere via his own user install. **If you add a new PUBLIC command, use `.setIntegrationTypes([0, 1]).setContexts([0, 1, 2])`; if you add a new ADMIN command, use `[1]`.** ⚠️ And note the 8 per-category weapon commands are built dynamically in `index.js`, NOT in `commands/*.js` — a sweep over this folder misses them, which is exactly what happened on the first pass of that change.


## `/timestamp`'s style-select dropdown (de-duplicated)
Used to be a documented exception to the reuse pattern below — `index.js`'s `tsmenu|` handler re-implemented both of `commands/timestamp.js`'s view layouts inline instead of calling back into that file, because it needed to re-render an already-parsed timestamp under a different style without re-running chrono (a relative input like "tomorrow" would resolve to a different date if re-parsed later). The two copies drifted out of sync across two separate redesigns before this got fixed. Now `timestamp.js`'s `execute(interaction, overrideState)` accepts an optional second argument — `{ unix, tz, queryInput, style }` — so `index.js` can pass in the already-known values via a synthetic interaction instead of re-deriving them from slash command options, and both code paths share one render implementation. If you add more ways to reach this render logic in the future, extend `overrideState` rather than branching a third copy.

### `/timestamp`'s `view` option — Embed or plain Text (2026-07-14, renamed `format`→`view` 2026-07-18)
New slash-command-exclusive `view` string option (`embed`/`text`, default `embed`) — deliberately NOT saved to `/settings`/`UserPreference`, since Harkirat wanted this purely a per-invocation choice. Works identically for the All Formats overview and every individual style view. Text mode reuses the exact same content strings the embed view builds (`headingLine`/`linesBlock`/`parsedLine`/`hintLine`, computed once and consumed by both branches so there's no drift between the two) but sends them as plain message `content` instead of wrapping them in a type-17 Container — no `accent_color`, and a blank line stands in for the type-14 divider component (plain content has no divider equivalent). The style-select dropdown and Share/"Show Everyone" button both still work in text mode as top-level action rows (Discord supports classic action rows identically whether or not the V2 flag is set) — only the container itself is dropped. `flags` is `0` for a public text response, not the usual `32768` default — confirmed safe: `sendV2Payload`'s default param only triggers on `undefined`, not on falsy values, so an explicit `0` is never silently overridden back to Components V2.

**Renamed `format` → `view` (2026-07-18, v2 quick-wins batch)** — "format" read as if it picked a TIMESTAMP format (fullDateTime/shortDate/etc, already `style`'s job above), when it actually controls Embed panel vs plain text. Same shape as the earlier `ephemeral`→`private`→`hidden` renames: a user-visible option rename, nothing else about the mechanism below changed.

Switching styles via the dropdown while in text mode needed to STAY in text mode — there's no `view` option to re-read on that path (`overrideState` skips normal option resolution entirely, same constraint `ephemeral`/`accentColor` already work around). Solved the same way `ephemeral` already is: `index.js`'s `tsmenu|` handler derives `isTextMode` from the ABSENCE of the Components V2 bit (32768) on the message being edited (`!(interaction.message.flags?.bitfield & 32768)`), since text mode never sets that flag, and passes it through `overrideState.isTextMode`.


## Loadout commands (`/dmz`, `/all`, `/<category>`) have `build`/`visibility` options
All three accept an optional `build` (integer, 1-based, matching the "Build N of M" footer text — clamped into range rather than rejected if out of bounds) to jump straight to a specific build instead of always landing on the first and clicking Next repeatedly, and an optional `visibility` boolean (renamed from `hidden` 2026-08-08, part of the /help redesign's bot-wide option rename — same explicit-option > saved-`loadoutVisibility`-preference > default priority every other command already uses) to land already-public/ephemeral in one shot. Added specifically so a user doesn't have to rely on "Share Publicly" after the fact just to get the same result up front.

**The `hidden` → `visibility` rename applies to every command in the bot** (dmz/all/`<category>`/draws/draw prices/calendar/patch notes/season end/colors/settings/timestamp/manage/alerts), not just loadouts — same option name, same boolean semantics, just renamed for clarity when `/help`'s redesign needed to describe it. If you see `hidden` referenced anywhere (an old screenshot, a stale comment), it's out of date.

