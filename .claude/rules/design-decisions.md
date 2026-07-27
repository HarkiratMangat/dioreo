---
paths:
  - "utils/adminParser.js"
  - "utils/timestampHelper.js"
  - "commands/calendar.js"
  - "commands/patchnotes.js"
  - "commands/seasonend.js"
  - "commands/draws.js"
  - "models/UserPreference.js"
---

# Design decisions — don't re-litigate these

*Loads when you touch the parser, timestamp helper, calendar/patchnotes/seasonend/draws commands, or
UserPreference. The "already decided, here's why" log: seasonal visibility (Option A), admin-date UTC
handling, chrono noon default, bulk-import formats, title-casing, All-Season calendar events, patch-note
title sync, the `/draw prices` data-model rewrite, the nav-order→color map, emoji sourcing. The color
map's LIVE hexes are mirrored in `.claude/rules/rendering-and-ui.md`; the redesign NARRATIVE is in
`docs/reference/design-history.md`.*

- **"Seasonal Content" visibility is one shared toggle (Option A)**, not five
  separate ones. Deliberately chosen over per-command granularity — if you're asked
  to add a 6th seasonal command, wire it to `prefs.seasonalVisibility` too, don't add
  a new field.
- **Admin dates are always UTC-0 — except patch notes' release date/time, which is the one
  deliberate exception.** `adminParser.js`'s `parseAdminDate` (draws/calendar/season-end deadlines)
  forces `chrono.parseDate(str, new Date(), { timezone: 0 })` specifically to avoid depending on the
  host machine's local timezone/DST — a past bug (DMZ season-end showing 1 hour off) was traced to
  exactly this kind of local-timezone dependency. Don't reintroduce ambient-timezone parsing for
  those fields.
  - **Patch notes' release date (`adminParser.js`'s `parseReleaseDateTime`, used only by the 3
    `modal_patch_*` handlers in index.js) is smarter, per Harkirat's explicit call (2026-07-27
    08:02 EDT):** a
    bare date with no time-of-day still means UTC-0 midnight (same convention as everywhere else,
    falls straight through to `parseAdminDate`), but the moment a time is also typed
    ("2026-07-22, 7:20 AM"), that time is treated as Harkirat's own local clock (his
    `UserPreference.timezone`, same field `/settings`/`/timestamp` already use, default
    `America/Toronto`) and converted to the real UTC instant — chrono's `isCertain('hour')` decides
    which case applies, same check `timestampHelper.js`'s `generateTimestamps()` already uses. Root
    cause this fixed: `parseAdminDate` used to unconditionally discard any typed time and normalize
    to midnight UTC regardless — a real time typed alongside the date was silently thrown away, and
    since `commands/patchnotes.js` displays the release date with a Discord `<t:X:f>` (date+time)
    timestamp, that discarded-then-midnight-UTC value rendered as a confusing wrong-day/wrong-time
    string in the viewer's own local timezone (e.g. midnight UTC showing as "8:00 PM the previous
    day" for a UTC-4 viewer). `adminParser.js`'s `formatReleaseDateTime` is the reverse — it
    pre-fills the "Date & Info" / "Edit Past Season" modals with the time included whenever the
    stored instant isn't exact UTC midnight, so reopening either modal to tweak something unrelated
    (e.g. the description) doesn't silently wipe a previously-set release time back to midnight on
    the next submit. If you add a 4th patch-notes-date call site, use `parseReleaseDateTime`/
    `formatReleaseDateTime`, not `parseAdminDate`/`formatAdminDate` — every other admin date field
    (draws/calendar/season-end) is unaffected and keeps the plain UTC-0 functions.
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
    divider-separated sequence, each entry down to a single tier emoji (`tierIcon()` — a module-level
    `TIER_ICON` const until 2026-07-26 16:04 EDT, when it was made per-render because the const froze
    pre-sync emoji ids; not the old tier+Epic combo). "Legendary BR Vehicle Draw" removed entirely (absent from Harkirat's own
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
  `PRESET_ACCENT` constant — see `.claude/rules/accent-and-colors.md` for when they're actually
  used vs. overridden. This mapping got rotated out of sync with the nav buttons once
  already (after the buttons themselves were reordered in an earlier session) — if the
  nav button order ever changes again, re-derive this mapping from scratch rather than
  assuming the existing `PRESET_ACCENT` values are still aligned to it.
- **`emojiMap.js`** is the single source of truth for emoji IDs (tiers, BP/rank/DMZ/CP
  icons, and the animated command-header icons). Reuse from there rather than
  hardcoding emoji strings inline in new code. Also exports `parseEmoji()` for
  converting a mention string into the `{id, name, animated}` shape a button's `emoji`
  field needs (see the Components V2 rules in root CLAUDE.md).

