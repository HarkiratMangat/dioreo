# Design history — the 2026-07-12/13 redesign passes & older narrative

*Read on demand. The deep narrative of specific past redesign passes (batch refinement, slash-command
wording overpass, color repalette, post-deploy fixes). LIVE config (current accent hexes, current
layouts) lives in the relevant `.claude/rules/` file — the color repalette's live `PRESET_ACCENT`
values are mirrored in `.claude/rules/rendering-and-ui.md`. This file is the STORY of how those
decisions were reached, kept for context, not the current-state reference.*

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
  **Tightened further 2026-07-18 (mobile-width audit, v2 quick-wins batch)** — dropped "name of" from
  all three (now "The {[DMZ/`{cat}`/]}weapon you want a build for") since the longer category names
  (`MARKSMAN`, `SECONDARIES`) pushed the full phrase past a comfortable mobile width; the shared
  formula itself is unchanged, just shorter.
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
  - **⚠️ SEQUEL BUG (found live 2026-07-17, fixed same day): the `mng_editbtn_` fix above was itself
    broken from the day it shipped — the intermediate Edit button never worked at all.** Repro:
    `/manage` → Edit → search "FSS" → the ephemeral Edit/Search-Again prompt appears → click **Edit**
    → "Dior's Builds didn't respond in time." Root cause: the `mng_editbtn_` HANDLER was written into
    the `if (interaction.isModalSubmit())` block (right next to its `mng_search_` sibling, since they're
    conceptually adjacent) — but `mng_editbtn_` is a **BUTTON** custom_id. A button click has
    `isButton() === true` / `isModalSubmit() === false`, so it never entered that block; the handler was
    dead code and the click fell through unacknowledged → Discord's 3-second no-ACK timeout ("didn't
    respond in time", distinct from the earlier "Something went wrong" which is a *failed* response).
    This is the EXACT same wrong-`isX()`-branch class of bug as the loadout Browse-other-builds dropdown
    (see [[feedback_verify_fix_actually_works]]) — a handler that looks right but sits in the block its
    interaction type never reaches. It went unnoticed because Edit via the panel was never actually
    live-clicked between 2026-07-12 and 2026-07-17 (it WAS on the "not yet verified" list). **Fix:**
    moved the handler into the `isButton()` block (alongside `mng_act_`/`mng_purgeconfirm_`/etc.),
    adapting `customId` → `interaction.customId`; left a placement-warning breadcrumb in BOTH spots so
    it isn't "helpfully" moved back next to `mng_search_`. Because `mng_editbtn_` serves EVERY entity's
    single-match Edit, this broke Edit for draws, calendar, MP loadouts AND DMZ loadouts alike — the fix
    repairs all four. Verified: `buildEditLoadoutModal` (which `showModal` now actually reaches) builds
    without throwing for the real FSS Hurricane doc and all 125 MP loadouts (offline run against live
    Mongo) — so the routing fix exposes no secondary throw.
    - Same fix pass (2026-07-17): the single-match Edit prompt's **Edit + Search Again buttons now share
      ONE action row** (were two stacked rows). Only the single-match case — the multi-match disambiguation
      reply keeps two rows because its select menu (type 3) must occupy its own row and can't sit beside a
      button. (`searchAgainRow.components` is spread into the Edit row rather than pushed as a second row.)
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

