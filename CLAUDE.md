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
- `xlsx` — NOT used at bot runtime anymore (see MP loadout system below); only referenced by
  `scripts/migrateBuildsToMongo.js`, a one-time/re-runnable migration tool, not something the
  bot itself ever calls.
- Pushed to GitHub (`origin/main`); deployed on both Render and Railway via git-connected
  auto-deploy — no separate CI/CD pipeline, a push to `main` is the deploy trigger on both.

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
- `/update` (admin-only, hidden via `setDefaultMemberPermissions(0)`) — bulk data entry gateway
- `/manage` (admin-only) — loadout CRUD + season title editing

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
`.setIntegrationTypes([1]).setContexts([0, 1, 2])` to all of them. `/update` and `/manage` are
deliberately left out — they're admin-only bulk data-entry gateways gated by
`setDefaultMemberPermissions(0)`, which has no real meaning in a DM (no guild permissions to
check), so keeping them guild-only is intentional, not an oversight. **If you add a new
public-facing command, add this line too, or it'll have the same DM/user-install gap.**

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
- **`/update`'s bulk draws import is split into two independent flows — New and
  Returning each have their own modal** (`modal_draws_bulk_new` /
  `modal_draws_bulk_returning` in index.js, `parseBulkDrawList` in `adminParser.js`
  returns a flat array for whichever one category was submitted). This used to be ONE
  modal covering both, distinguished per-line by a leading `n `/`r ` prefix token, and
  a single submit replaced BOTH `newDraws` and `returningDraws` together — re-running
  the import to fix one typo in New Draws silently re-wrote Returning Draws too (even
  if unchanged content-wise, it reordered/re-saved it). Splitting means each submit
  only ever touches its own array. If you add a third draws-like category in the
  future, give it its own modal/custom_id rather than reintroducing a type-prefix line.
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
  `edit_season_titles` handler, which updates both when the admin renames a season.
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
- **`/draw prices`' `REGION_DATA`/`COMBO_NOTES` had real math mistakes**, found by
  cross-referencing against Harkirat's raw combo-notes export: a displayed total not
  matching its own draws curve (mythicCharacter said 7,200, its draws summed to 7,220),
  a wrong draw value (mythicGun's 6th pull was listed as 350, should be 320, making the
  total 5,810 not 5,840), and a typo'd draw value (legendaryGunReactive's 9th pull said
  1,110, should be 1,100). If you edit this data again, sum each `draws` string and
  confirm it equals its own `total` before saving — don't assume existing values are
  correct just because they're already in the file.
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
- **Admin input for badges rides along on the existing "Category | Mode" modal field** as a 3rd
  pipe-delimited segment (`"AR | MP | meta,best"`, `"AR | MP | meta,top5"`, or
  `"AR | MP | meta,best,toxic"`) rather than getting its own field — `/manage`'s add/edit-loadout
  modals already use all 5 of Discord's per-modal field slots, so there was no room for a dedicated
  badges input. `adminParser.js`'s `parseLoadoutBadges()` parses comma-separated, case-insensitive
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
- **"Copy Attachments"** is a new button next to Copy Code, replying with the plain attachment list
  (one per line, no bullets/backticks/formatting — meant to be pasted straight into Gunsmith)
  ephemeral, same mechanism as Copy Code. Handled by the `copyatt` action in index.js's shared
  `dmz`/`mp`-prefixed button router, alongside the existing `copy`/`next`/`prev` actions.

## Autocomplete search is punctuation/whitespace-insensitive, not just substring (`utils/search.js`)
Every autocomplete route in the bot (loadout weapon search across `/dmz`/`/all`/`/<category>`,
`/manage`'s draws + loadouts search, `/patch notes`' version search) used a plain `.includes()` (or
an equivalent raw Mongo `$regex`), which requires the typed query to appear as one literal,
contiguous substring of the stored name — so typing `dlq` never matched `DL Q33`, since the space
between "DL" and "Q33" breaks that literal character sequence. `fuzzyMatch()` strips
spaces/hyphens/underscores/periods from both sides before comparing, which fixes that whole class of
miss (also covers `cx9` matching `CX-9`) without going as far as true fuzzy/subsequence matching
(skipping letters), which would start returning noisy, hard-to-predict matches for a dataset this
size. `/manage`'s loadouts autocomplete switched from a raw Mongo `$regex` to fetching everything and
filtering in JS (same pattern the weapon-dictionary block already used) since punctuation-stripping
can't be expressed as a single regex against the stored field — fine at this collection's size.

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

## Known open issues (not yet fixed — flagged, not silently patched)
- `calendar.js` and `draws.js` both have defensive component-count chunking;
  `patchnotes.js`'s media carousel does not (untested at scale — likely fine since
  patch note screenshots per entry are usually few, but not empirically verified
  the way draws/calendar chunking was).

## Next planned work
Harkirat wants to reorganize the admin commands (`/update` + `/manage`) to be more
"centralized" — currently split across two commands with some overlapping/missing
functionality. Nothing has been designed yet; start by asking what "centralized"
should look like (one command with subcommand groups? a different UX entirely?)
rather than assuming.
