---
paths:
  - "utils/sendV2Payload.js"
  - "utils/titleBlock.js"
  - "utils/paginationRow.js"
  - "utils/globalNav.js"
  - "utils/ephemeral.js"
  - "utils/emojiMap.js"
  - "utils/shareButton.js"
---

# Rendering & shared UI — Components V2, builders, pagination, "Show Everyone"

*Loads when you touch the shared rendering utils. The Components-V2 platform rules, shared UI builder
helpers, the pagination row (incl. the 2-page loop-back crash fix), and the "Show Everyone" share
button. The live nav-order→`PRESET_ACCENT` color map is documented here too (it's rendering config).
Crash-safety + the synthetic-interaction pattern: `.claude/rules/interaction-router.md`.*

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
5. **These are APPLICATION emojis, and an application emoji renders ONLY for the app that owns it.**
   (Added 2026-07-26 13:45 EDT with the local dev bot.) The 39 mention strings in `emojiMap.js` carry the
   PROD app's ids; the dev bot is a *separate Discord application* whose 72 same-named emoji copies have
   different ids, so the hardcoded ones render as broken text there. `emojiMap.js`'s
   **`refreshEmojiIds(client)`** — called from `index.js`'s `handleBotReady` — fixes this by matching on
   emoji **name** and re-pointing every string at the booting app's own ids. One codebase, both apps, no
   per-environment config, and it self-heals if an emoji is deleted and re-uploaded (which mints a new
   id). Verified a true no-op on prod (0 rewrites, 0 unmatched) and 39/39 re-pointed on dev.
   - **It mutates the exported object in place on purpose** — a consumer that reads `emojis.foo` at render
     time picks the change up with zero call-site changes.
   - **⚠️ …but "every consumer reads at render time" was FALSE, and that assumption shipped a bug**
     (found on the dev bot 2026-07-26 15:52 EDT, fixed 16:04 EDT). `refreshEmojiIds` runs from
     `handleBotReady` — **long after every command module is `require()`d** — and JS strings copy by
     value, so *anything* that reads an emoji value at load time freezes the pre-sync PROD id forever.
     Four sites did exactly that: `manage.js`'s module-level `PAGES` table (broke **every** `/manage`
     emoji), `drawprices.js`'s `TIER_ICON` const (broke pages 1–2 while page 3, which reads live, was
     fine), `shareButton.js`'s `SHARE_BUTTON_ROW`, and `seasonend.js`'s hardcoded `<:BP_CODM1:…>` literal
     that bypassed the map entirely. **The trap is not just destructuring** — a module-level object
     literal containing `${emojis.x}` is the same bug and is much easier to miss.
   - **Rule:** read `emojis.x` inside the render function, or build the containing table per render.
     Every emoji must live in `emojiMap.js` — a hardcoded literal elsewhere is invisible to the sync.
   - **Enforced by `scripts/checkEmojiCaptures.js`**, which proxies `emojiMap` and fails if any module
     reads an emoji value during `require()`. It found all four sites; manual review had found three.
     Run it after touching emoji rendering (CI candidate — see `docs/db-deferred-list.md`).
   - **Fail-soft:** any API/parse error leaves the hardcoded prod ids in place. Cosmetics must never take
     the bot down.
   - An optional **gitignored `utils/emojiMap.dev.json`** overlay (applied after the name sync, only when
     `NODE_ENV=development`) lets a dev session point individual keys at throwaway test emojis that don't
     exist on prod at all, without editing — or risking committing — the tracked map.


## Shared UI builders (`utils/titleBlock.js`, `utils/paginationRow.js`, `utils/globalNav.js`,
`utils/ephemeral.js`, `utils/sendV2Payload.js`)
Small helpers introduced when calendar/draws/patchnotes/drawprices(/seasonend/dmz) were redesigned
to a consistent look, specifically to avoid multiple copies of the same layout/logic drifting out
of sync the way the `/timestamp` duplication already had (see `.claude/rules/commands-overview.md`):
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
- `buildPaginationRow({ totalChunks, currentPage, makeCustomId | prevCustomId/nextCustomId,
  indicatorCustomId })` — the Prev/Next row used by `/calendar`/`/draws`' sub-page navigation and
  every other pager (drawprices, `/settings`, View Colors, `/alerts`, loadout cards): emoji-only
  Left/Right buttons (`emojiMap.js`'s `left`/`right`, no text label), a numbers-only page counter (no
  "Page" word). Returns `null` when `totalChunks <= 1` — **callers must check for that and skip pushing
  the row**, don't assume it's always safe to push directly.
  - **The arrows LOOP, they don't disable — EXCEPT at exactly 2 pages on the `makeCustomId` path
    (2026-07-21 loop-back; the 2-page carve-out added 2026-07-21, v2.30.2).** Next on the last page
    wraps to the first page and Prev on the first wraps to the last; the middle counter is a plain
    disabled label. This replaced the old `disabled: currentPage === 0 / === totalChunks - 1`
    end-caps for 3+ pages. **⚠️ At exactly 2 pages the `makeCustomId` (page-number) path CANNOT loop
    with both arrows enabled** — wrapping makes `prevPage === nextPage` (both point at the one "other"
    page), so `makeCustomId(prevPage) === makeCustomId(nextPage)`: two buttons with an IDENTICAL
    custom_id, which Discord hard-rejects (`Invalid Form Body … COMPONENT_CUSTOM_ID_DUPLICATED` → the
    WHOLE message fails to send, the command throws). This shipped as a real production crash in
    v2.28.0's loop-back and hit `/draws`, `/calendar`, `/settings` (hardcoded 2 pages — crashed on
    every open), View Colors (8 colors → 2 pages) and `/alerts` (found live in the VM logs 2026-07-21,
    9× in one hour on `/draws` alone). The earlier "applies at EVERY page count including exactly 2 —
    intentional / harmless, just redundant" claim here was WRONG — it was the opposite of harmless.
    **Fix (v2.30.2):** at `totalChunks === 2` on the `makeCustomId` path only, the helper clamps
    (`prev → max(0, cp-1)`, `next → min(last, cp+1)`) and disables the boundary arrow, yielding
    distinct ids (`…_0` vs `…_1`). 3+ pages loop unchanged. The legacy `prevCustomId`/`nextCustomId`
    path encodes a DIRECTION not a page, so its two ids are inherently distinct even at 2 pages — it
    keeps looping untouched (loadout cards). If a single looping toggle button at 2 pages is ever
    wanted instead of the clamped pair, that's a layout change in `paginationRow.js` (Harkirat's call,
    left as clamp-2026-07-21).
  - **Two ways to pass custom_ids — don't mix them.** `makeCustomId(targetPage)` is preferred and used
    by every caller whose id bakes in a target PAGE NUMBER (drawprices/draws/calendar/settings/colors/
    alerts): the helper computes the WRAPPED prev/next page and calls `makeCustomId` to build each id,
    so the modulo lives in ONE place. The legacy `prevCustomId`/`nextCustomId` strings are only for
    loadout cards, whose id encodes a DIRECTION + current index and whose index.js handler already does
    the modulo wrap itself — those are passed through verbatim and just needed the un-disable. A new
    paginated command should use `makeCustomId` and let the helper handle wrapping.
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
  the raw Components V2 JSON bypass every V2 command needs (discord.js's high-level
  reply/followUp/update don't reliably serialize raw V2 JSON — no builder class exists
  for a type-17 Container), previously repeated verbatim at ~10 send sites. `flags`
  defaults to `32768` (Components V2) since that's the common case; pass an explicit
  override for the rare site that needs something else (e.g. `/timestamp`'s dropdown
  re-render, which has to manually re-OR in the ephemeral bit since that path doesn't go
  through a normal `deferReply()`, or `share_public`'s dynamically-computed flags after
  stripping the ephemeral bit from an existing message). `/timestamp`'s plain-text
  parse-error fallback (no components at all) is left as a raw call rather than forced
  through this helper — genuinely a different shape, not more duplication to collapse.
  - ⚠️ **DUAL-MODE since the "pagination perf hybrid" (2026-08-06 22:17 EDT), PARTIALLY REVERTED
    2026-08-07 17:38 EDT (v2.60.0).** If the interaction is NOT yet acked
    (`!interaction.deferred && !interaction.replied`), this POSTs straight to the interaction-callback
    endpoint (`type:7` UPDATE_MESSAGE) as the interaction's first and only response — one Discord
    round-trip instead of the old ack-then-`rest.patch('@original')` two. Already-deferred paths (the
    initial slash-command invocation, or a heavy path like View Colors that still defers on purpose)
    are unaffected and keep patching exactly as before.
    **⚠️ The single-hop path causes a real, confirmed Discord CLIENT bug** — a re-rendered button's
    custom emoji can go blank and sometimes never recover. Reproduced live on every command tested;
    ruled out our own payload (always correct), timing (200ms-2000ms artificial delays all failed),
    animated-vs-static emoji, and button/emoji count as the cause — only reverting to two-hop avoids
    it. `calpage_` (calendar), `price_region_`/`price_subpage_` (draw prices), and `set_page_`
    (`/settings`, found mid-investigation to have the same bug) now all defer first again, accepting
    a real measured ~200-300ms extra cost per click. `draws`' own sub-page nav
    (`subpage_new_`/`subpage_returning_`) is the one branch left single-hop — untested for this bug
    either way, not confirmed safe just because it wasn't flagged.
    Full investigation: `docs/db-deferred-list.md`'s "button emoji goes blank after a single-hop
    re-render" entry. **If you add a new light nav branch, don't reflexively make it single-hop** —
    given this bug, defaulting a NEW branch to two-hop (`deferUpdate()` first) is the safer starting
    point unless you have a specific reason to risk the single-hop path.


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
bot's user-installed-only nature (see root CLAUDE.md): that raw channel POST needs real Send Messages
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


## Live nav-order → `PRESET_ACCENT` color map
*The current per-command accent colors, ordered by their nav-button position (this is LIVE config — the
STORY of how these were chosen is in `docs/DEVLOG.md` → *"2026-07-12 — The color repalette: chosen per
command, not per position in a fade (Section 5)"*;
each command's `PRESET_ACCENT` constant holds its own value). If the nav-button order ever changes,
re-derive this mapping from scratch rather than trusting the existing alignment.*

| Nav pos | Command | Color | Hex | Decimal |
|---|---|---|---|---|
| 1 | Calendar | Slate Harbor | `#3A5068` | `3821672` |
| 2 | Draws | Plum Fortune | `#6B4E7D` | `7032445` |
| 3 | Draw Prices | CP Emerald | `#1F8A5E` | `2067038` |
| 4 | Patch Notes | Patch Gold | `#F2C230` | `15909424` |
| 5 | Season End | Neon Amber | `#F2994A` | `15898954` |
| — | Timestamp | Cyber Teal | `#17A2A2` | `1548962` (only when a user saved a non-default `/timestamp` style; the All-Formats overview keeps this fixed teal regardless of accent-style prefs) |

*`/manage` per-page accents (MP red `#FF3430`, DMZ blue `#337BA6`) are in `.claude/rules/manage-panel.md`;
loadout per-category accents (`MP_CATEGORY_ACCENT`) are in `.claude/rules/loadouts.md`.*
