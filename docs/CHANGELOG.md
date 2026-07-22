# Changelog (Detailed)

Dior's Builds' own "release notes" — tracks what shipped, when, and why. See
[CHANGELOG-SUMMARY.md](CHANGELOG-SUMMARY.md) for a plain-language version of the same timeline.

**Versioning:**
- **v1.0.0** (`b225785`) — the actual first working version of the bot. There is no "v0.x" — the
  very first commit was already a real (if tiny) release, not a pre-release draft.
- **v1.x** — the pre-collaboration era: solo-built, Excel-backed MP loadouts, classic Discord
  Embeds. Runs through `cbf2106` (the original `/timestamp` command).
- **v2.0.0** (`63cebb1`, "Pre-release") — the Components V2 rewrite. This is also where Harkirat
  started working on the bot together with Claude, so everything from here on has much more
  detailed reasoning behind it than the entries above.
- **Three-part `vMAJOR.MODERATE.MINOR`** (restructured 2026-07-12). `MAJOR` (whole-number, e.g.
  v2 → v3) = a major overhaul or major new functionality — only bumped deliberately, with Harkirat's
  confirmation. `MODERATE` (middle field) = a significant push: a new feature, a real design change,
  several large bug fixes, or a bundle of adjustments — bumping it resets `MINOR` to 0. `MINOR` (last
  field) = a small adjustment/fix/correction committed on top. `MODERATE` can climb past 9 (v2.10.x,
  v2.11.x, …) indefinitely; reaching double digits is NOT a reason to bump `MAJOR`.
- **Notation — now uniform three-part throughout (normalized 2026-07-21).** Entries v2.7.1 and earlier
  were originally written in a condensed **two-decimal** notation (the trailing MINOR digit crammed onto
  the MODERATE field, no second dot — e.g. `v2.71` meant v2.7.1, `v2.51` meant v2.5.1, `v1.61` meant
  v1.6.1; a single-decimal `v2.7` meant v2.7.0). At Harkirat's request these were retroactively renumbered
  to explicit `vMAJOR.MODERATE.MINOR` so the whole file reads in one consistent scheme — no bot code or git
  tags were affected (pre-`v2.17.3` versions were never tagged; see the version-tagging note in CLAUDE.md).
  Fixing the notation also surfaced and corrected one pre-existing ordering slip (v2.7.1, a `.1` follow-up,
  had sat below v2.7.0 — now above it, matching every other pair and the newest-first order).

Only pushes that actually went live get a permanent version number — see **Unreleased** at the
bottom of this file for work that's committed but not yet pushed.

**Detailed vs. summary coverage:** every real push gets an entry here, including purely internal
housekeeping (repo/tooling changes, nothing a player would notice). [CHANGELOG-SUMMARY.md](CHANGELOG-SUMMARY.md)
**represents every version number too — no number is skipped** (Harkirat's rule, 2026-07-21: "easier to
delete than to add"). It stays player-focused, so trivial/internal/docs-only point releases aren't given
their own prose write-up — instead they're folded into a neighbouring entry's version range (e.g.
`v2.18.0–v2.18.3`) or noted in one line (e.g. "*v2.22.1 was a docs-only point release*"), so a reader can
still see the version existed. Only genuinely user-facing changes get a real bullet.

---

# 🔮 Planned & Upcoming (not shipped yet)
Ideas, committed work, and known small gaps — nothing in this section has shipped. Roughly ordered by
how committed we are. Items graduate into a numbered version entry below once they actually ship.

### 🛠️ Planned — intend to build
- **Single-instance guard** — a startup lock so a stray local `node index.js` can't silently run
  alongside the deployed Render bot. This is a single-token bot: two live instances race every
  interaction (Discord routes each click to a random one) and cause the "different behavior each
  click" + 10062/40060 errors seen behind v2.17.0. Refuse-to-start-if-already-connected is the fix.
- **Real "search + multi-select" admin flow** — for "Delete Multiple" (all entities) and Loadouts'
  "Replace Multiple": search first, then tick which matches to act on. Today these are placeholder
  paste-a-list-of-names flows; this is the genuinely new interaction they're meant to become.
- **General bot/code housekeeping session** (added 2026-07-15) — one dedicated cleanup pass instead of
  piecemeal mid-feature tidying: delete leftover `*.bak-*` config backups, sweep for any stale absolute
  paths left over from the 2026-07-14 repo relocation (the known ones are already fixed; prefer
  relative/dynamic paths so a future move can't rot them), dead-code/stale-comment/unused-dependency
  review, and decide whether `/patch notes`' media carousel needs component-count chunking.
- **Write a user-friendly bot/ops guide** (added 2026-07-18) — a rich but noob-friendly how-to for
  operating the bot end-to-end (the GCP VM, hosting, deploy flow, checking status/logs), so Harkirat can
  maintain it himself. Distinct from CLAUDE.md and the terse VM command card — a human operator's guide.

#### Remaining v2 polish batch (filed 2026-07-14/15 from the plan-notes file)
Ships to `main`/live as normal `v2.x` pushes, in parallel with v3 pre-release work. Most of this batch has
already shipped and graduated into the numbered list below: **8 items in v2.21.0** (`/timestamp`
`format`→`view`, `/settings` `hidden` option, mobile description trim, short/partial loadout search, admin
override + reworded action-blocked message, View Colors download buttons, `/manage` `section`→`data_for`),
plus **`/manage` loadout data-entry UX** (v2.23.0), **`/manage` per-page accent colors** (v2.24.0),
**webhook alerting heavy-half** (v2.26.0 — per-alert IDs, `/alerts`, text-log export, legibility fixes), and
**pagination loop-back** (v2.28.0, with its 2-page crash fixed in v2.30.2). Still open from this batch:
- **View Colors: wider colour variety** — a real avatar returned 6 of 8 requested colours and missed a
  useful yellow. Minimal images correctly returning 2-4 on one page must NOT be padded out to a quota.
  Needs its own focused session — determinism is a hard constraint (Refresh's change-detection).
- **View Colors: humour pages for unset Display Name / Nameplate / Deco** instead of hiding them.
- **Richer in-bot diagnostic logging** (filed 2026-07-18) — so a failure points at exactly which component
  broke and why (distinct from the webhook alerting heavy-half, now shipped, and the v3 DB-change audit log).
- **Admin `/status` command** (filed 2026-07-18) — VM health/metrics (gateway state, RAM/CPU, restart count)
  surfaced in-bot, built on `scripts/vmstatus.sh` / `vmpeaks.sh`. **Un-bundled from the webhook work
  2026-07-20** (Harkirat's call — unsure of its usability right now); still deferred as its own session.

#### v3 (next MAJOR — pre-release track)
Built on a `v3-pre-release` branch, logged here as `Pre-Release v3.x.x`, kept out of the summary
changelog until v3 actually launches.
- **`/manage` → `/admin`**, keeping the dashboard panel but adding slash-driven actions
  (`/admin command:{x} action:{y}`), with `action` choices scoped to the chosen command. Plus an
  internal DB-change logging/tracking system.
- **`/meta`** — browse every weapon marked Meta, paginated, category-switchable, per-category accent.
- **Draw cost calculator** — cost to finish a draw from region + attempts done/remaining + CP balance,
  with a suggested top-up package.
- **Consolidate MP loadout commands into one `/loadout`** (with a meta subcommand — overlaps `/meta`
  above; pick one shape at design time). `/dmz` stays as-is.
- **`/settings` jump-to options** and **detaching `/colors`' visibility** from settings.
- **`/help`** detailing commands/features, referenced from the bot's Discord description — must include
  a way to contact Harkirat (his Discord) for bug reports/requests.
- A **personality pass** ("bully people who are broke") sprinkled through, starting with the humour
  pages and the reworded block message.
- **Announcement feature** — post an announcement from `/manage`; each user sees it once (as a follow-up
  embed) on their next command run, until the next announcement replaces it. Per-user "last seen" tracking.
- **Easy bot sharing / `/invite`** — a share path that works even in servers where user-apps are blocked
  (every reply ephemeral), and is shareable outside Discord entirely. Relates to the v4 guild-install shift.
- **Privacy Policy / Terms of Service** — needed for Discord compliance, especially once verified/past
  100 servers (same threshold as the MESSAGE CONTENT intent below). Should cover the usage-analytics
  item below if that ships first.
- **Richer usage analytics** — who ran what command, when, how often, and how people actually navigate a
  feature (dropdown vs retyping, etc.) — distinct from the diagnostic-logging item above (that's failure
  attribution, this is usage telemetry).
- **`/define` (Urban Dictionary integration)** — pure fun, not CODM-related, low priority.
- **Extend the passive auto-disable pattern** beyond `/settings` (which shipped it in v2.22.0) to
  draws/calendar/drawprices/loadouts, which currently have none — mechanical (reuse
  `utils/passiveExpiry.js`), open question is whether 10 minutes is the right window everywhere.

### 💭 Considering — ideas, not committed
- Continue the stylized visual "release log" redesign (the "Armory Terminal" artifact) — paused.
- Possibly promote the View Colors / accent-personalization system to a **`v3.0.0`** milestone rather
  than leaving it inside the v2 line — Harkirat's call (a MAJOR bump is never made without his OK).
- **v4 — guild install + text/prefix commands** (`d b ak117`), with a settable per-server prefix and
  server-exclusive commands. ⚠️ This reverses the bot's user-installed-only architecture and needs Dev
  Portal changes: Guild Install enabled, `setIntegrationTypes([0, 1])`, and the **privileged MESSAGE
  CONTENT intent** (which needs Discord approval past 100 servers).
- **v4 — user-submitted loadouts**, gated behind manual review (deny / accept / accept-with-edit).
- **v5 — generate the gunsmith image + share code ourselves**, removing the manual-screenshot step:
  teach the code structure + layout, supply per-weapon base pages, store output in Cloudinary.
- **v5 — user-built custom gunsmiths in-bot** (depends on the above), plus a "my builds" command that
  merges a user's own builds into `/loadout` results, visually distinct from official ones.

### 🐛 Known issues / small fixes — deferred, mostly cosmetic
- **View Colors heading isn't vertically centered** against its thumbnail — Components V2 has no
  vertical-align control; a workaround was tried and reverted. Purely cosmetic.
- **Decoration & nameplate previews show as static posters, not animated** — a genuine Discord-client
  limitation, not a bug here; the real fix (re-encoding to GIF per render) was rejected as not worth
  the per-render latency for a cosmetic nicety.
- **Cloudinary folder organization — verify** (added 2026-07-18) — confirm draw thumbnails actually land in
  `temp_draws/` and patch-notes images in `patch_notes/{patchId}/` as designed; Harkirat noticed assets that
  look like they're in the main folder + secondary-weapon files not following the old naming. Read-only
  check; escalate to a real bug only if a genuine discrepancy is confirmed.
- **`/patch notes` media carousel has no component-count chunking** yet, unlike `/draws`/`/calendar`
  — untested at scale; likely fine (few screenshots per entry) but not empirically verified.
- **`ffmpeg` is an unverified production dependency** — used for decoration still-frames; confirmed on
  the local Mac, not guaranteed on Render's container. If decoration color extraction ever breaks in
  production only, check for `ffmpeg` on the deployed image first.
- **Pagination/toggle clicks pay a structural double network round-trip** (`deferUpdate()` then a
  separate `PATCH` to update the message) — not a CPU/DB bug this time, just the current architecture.
  Real fix is switching to a single direct `UPDATE_MESSAGE` response; touches every paginated command,
  deferred as its own future pass rather than bundled into v2.18.0.
- ~~Disabling expired buttons — a reactive "friendly message but buttons stay live" gap~~ — **SHIPPED
  for `/settings` in v2.22.0** as a genuinely PASSIVE, no-click auto-disable (a held interaction token
  + `setTimeout` PATCHes the message on its own after 10 idle minutes) — see that entry below for the
  mechanism, and CLAUDE.md's "Passive idle-timeout auto-disable" section for the full design. This
  entry itself went through two rounds of correction before landing there: first wrongly claimed
  disabling was impossible at all, then wrongly claimed a proactive zero-click update specifically was
  impossible — both wrong, see CLAUDE.md's "Known open issues" for the full trail. Still open: the same
  pattern for draws/calendar/drawprices/loadouts (see the v3 roadmap list above).
- **Global profile only, never per-server "Server Profile" overrides** (confirmed 2026-07-18) — every
  avatar/banner/deco/nameplate read uses the user's global Discord profile; a user with a different
  avatar set for one specific server won't see that reflected. Keep in mind for the v4 guild-install
  pivot (Harkirat's call, 2026-07-18) rather than solving now, since v4 already changes how guild-member
  context is available to the bot.

---

## v2.30.2 — 2026-07-21 (`231b133`) — fix pagination duplicate-custom_id crash at exactly 2 pages
A live production crash, found in the VM logs while verifying the v2.30.1 deploy (9× in one hour on `/draws`
alone). Introduced by v2.28.0's pagination loop-back. **Player-facing** (it took down whole commands), though
the fix itself is a one-file internal change.
- **The bug:** on the page-number (`makeCustomId`) pagination path, wrapping at exactly **2 pages** makes both
  arrows target the one "other" page, so `makeCustomId(prevPage) === makeCustomId(nextPage)` — two buttons with
  an **identical `custom_id`**. Discord hard-rejects that (`Invalid Form Body … COMPONENT_CUSTOM_ID_DUPLICATED`)
  and the **entire message fails to send**, so the command throws. v2.28.0's own note calling the 2-page case
  "harmless, just redundant" was the opposite of true.
- **Blast radius:** `/draws`, `/calendar`, `/settings` (which hardcodes 2 pages — so it crashed on **every
  open** for a day), View Colors (8 colours → 2 pages) and `/alerts`. Any page-based pager that lands on 2 pages.
- **Fix** (`utils/paginationRow.js`): it's mathematically impossible to have two *enabled looping* arrows with
  unique page-based ids at 2 pages (both must point at the same page). So at exactly 2 pages on that path the
  helper now **clamps + disables the boundary arrow** (`prev → max(0, cp-1)`, `next → min(last, cp+1)`), giving
  distinct ids (`…_0` vs `…_1`). 3+ pages loop unchanged. The legacy direction-encoded (`prev_`/`next_`) path
  used by loadout cards is inherently unique even at 2 pages and keeps looping, untouched.
- Verified exhaustively: a harness over `totalChunks` 2–5 × every current page (zero duplicate ids), plus an
  end-to-end `draws.buildContainer()` render of a 2-chunk doc (`subpage_new_0`/`subpage_new_1`, not two
  `subpage_new_1`). Left as clamp-at-2; a cosmetic single-toggle-button alternative is possible later
  (Harkirat's call).
- **Documentation cycle shipped alongside this version (doc-only, no separate version):** the records audit
  this session — graduated v2.27.0–v2.30.1 out of the old "pending graduation"/"Unreleased" staging into the
  numbered list above; fixed the scrambled 2026-07-18 ordering; backfilled `CHANGELOG-SUMMARY.md` so no
  version number is skipped (v2.27.0 + the older minors via range-extension); pruned four already-shipped
  items from the roadmap; backfilled the missing **v2.26.0 git tag**; a full notes-scratchpad tidy (SESSION
  STATUS #4, inline answers/marks, ℋ-item sweep) with its intake filed into CLAUDE.md/deferred-items; plus
  CLAUDE.md staleness fixes and a memory-alignment pass. No bot behaviour changed by any of it.

## v2.30.1 — 2026-07-21 (`c419fcf`) — `/draw prices` Advanced Double Legendary page corrections
Two fixes to the v2.30.0 Advanced Double Legendary page, from a marked-up screenshot Harkirat sent
(`local/Screenshots/CleanShot 2026-07-21 at 20.16.48@2x.png`) — the v2.30.0 version got the mockup wrong
in two spots:
- **Removed three internal dividers that were never in the mockup** — the v2.30.0 builder added spacing-2
  dividers after the headline, after the three purchase modes, and after the callouts (`dividerBefore =
  {1,4,6}`). None are in `local/advanced leggy_format.json`; all removed. The page is now a flat run of
  Text Displays with the only dividers being the title divider above and footer divider below (both from
  `buildContainer`, not the entry builder).
- **Strategy heading corrected** from `### **The Strategy, If You Want...**` to the exact plain-bold form
  Harkirat specified: `**The Strategy. If You Want...**` (no `### ` heading, comma → period).
- Applies to both CP regions. Re-verified via a `buildContainer()` JSON dump: container now has exactly 2
  dividers (title + footer), totals still derive from the arrays, ≈26 components (well under the 40 cap).
- **Shipped + deployed live to the VM 2026-07-21** (committed 2026-07-21 as `c419fcf`, held one session per
  Harkirat's instruction, then pushed/deployed the next session). Re-verified live via a `buildContainer()`
  dump after deploy: exactly 2 dividers (title + footer) on both regions, correct plain-bold heading.

## v2.30.0 — 2026-07-21 (`91567dc`) — `/draw prices` Advanced Double Legendary page redesign + full-caps draw headings
Player-facing visual pass on `/draw prices`, matching Harkirat's own hand-drawn mockup
(`local/advanced leggy_format.json`). No data or math changed — every number is still DERIVED from the
raw per-pull arrays (`DRAW_DATA`, `ADVANCED_DOUBLE_LEGENDARY`); only rendering/wording moved.
- **Advanced Double Legendary Weapon Draw page (page 3) rebuilt to the mockup** (`buildAdvancedDouble
  LegendaryEntry`): full-caps heading + `Reg / Adv` headline totals with a `(See **The Strategy** below)`
  pointer; three quote-styled purchase modes (`'Regular Purchase' Only`, `'Advanced Purchase' Only`,
  `'Regular Purchase' + Remaining Item Separately`); the `NOTE` and `THE TRAP` callouts reworded to the
  mockup copy; and **The Strategy** split from one bullet block into three separate Text Displays (its
  `### ` heading rides the first), each with an inline CP icon on its cost.
- **The mockup only specified the 10 CP region; the 30 CP region was cloned from the same design** with
  its own correctly-derived figures (Reg 11,030 / Adv 17,648 / Trap 22,060; "cheaper than a Normal Draw"
  comparison 11,830; strategies 14,810 / 13,370 / 11,030 — all re-summed and verified).
- **Every draw-price entry heading is now FULL-CAPS** (the lines with the tier emoji prefix), across both
  key-driven pages and the Advanced page, for consistency. `DRAW_META.name` stays the canonical mixed-case
  source of truth; only the rendered heading is uppercased (`meta.name.toUpperCase()`).
- Verified by dumping `buildContainer()` JSON and re-summing every total against its own array, and
  recursively counting components: all pages stay well under Discord's 40-component cap (max ~35 incl. the
  share button). Closes notes items L74 (Advanced redesign) + L75 (full-caps headings).
- **Docs synced** (`6c13a56`, doc-only follow-up, no redeploy): CLAUDE.md's Advanced Double Legendary
  section rewritten from the old single-strategy-block description to this redesign's 3-block shape +
  the full-caps heading rule.

## v2.29.0 — 2026-07-21 (`7960454`) — `/autobuild` v2-test fixes · loadout data corrections
Second `/autobuild` round from Harkirat's live v2 test (`local/Autobuild testing v2.md`), plus a batch of
loadout data corrections he verified by hand. **Admin/back-end only** — nothing changes for players.

### `/autobuild` extraction fixes
- **Weapon SKIN name no longer mistaken for the weapon.** The vision model was reading the equipped skin's
  stylized title (e.g. `R9-0 - Death's Voice`) as the weapon name, which cascaded into a wrong
  `weaponKey`/`imageKey` and created a brand-new "weapon" instead of adding a build to the existing one
  (and broke category auto-inference along the way). Fixed at two layers: the prompt now asks for the
  **base weapon only** (`utils/visionExtract.js`), and a structural backstop `normalizeWeaponName()`
  (`utils/adminParser.js`) strips a spaced-dash/em-dash skin suffix — base weapon hyphens are unspaced
  (`R9-0`, `CX-9`, `L-CAR 9`) so a real name is never touched.
- **Weapon names normalized to ALL-CAPS.** Autobuild stored title-case (`Machine Pistol`) while every
  migrated build is uppercase (`MACHINE PISTOL`), so a new build showed out of place in `/manage`'s
  disambiguation dropdown. `normalizeWeaponName()` now uppercases too (weaponKey is already
  case-insensitive and imageKey already uppercased, so only the stored display value needed fixing).
- **Restricted attachment slots are skipped.** A slot locked by another attachment (crossed-out /
  prohibited icon) was being emitted as if the slot LABEL were an attachment (that's how J358 got a
  `"Trigger Action"` attachment). The prompt now explicitly skips restricted AND empty slots and never
  outputs a slot label as a name; the old "exactly 5" wording that forced a hallucinated 5th is gone.
- **Attachments always display in canonical slot order** (Optic → Muzzle → Barrel → Stock → Laser →
  Underbarrel → Trigger Action → Rear Grip → Ammunition → Perk), via `orderAttachmentsBySlot()`. Applies
  to `/autobuild` builds (which carry per-slot labels); builds created before this keep their entry order
  until a separate reorder pass. Empty/restricted slots are filtered before storage, kept aligned with
  their slot labels so per-slot Cloudinary metadata never maps a name onto the wrong slot.
- `/manage`'s **"How Images Work"** info block updated — it said the bot never uploads images; `/autobuild`
  now does (screenshot → Cloudinary + loadout in one step), so it's presented as the fast path alongside
  the manual-key entry.

### Loadout data corrections (Harkirat-verified)
- **L-CAR 9 Build 2 ↔ Crossbow Build 1 images were swapped** (each screenshot uploaded under the other's
  Cloudinary key during the 2026-07-19 re-upload; the attachment data was always correct). Bytes swapped
  back and verified by etag; metadata re-synced.
- **J358's `"Trigger Action"`** removed — it was a restricted slot, not an attachment.
- **3 `/autobuild` test builds deleted** (Mongo + Cloudinary): Machine Pistol Build 2, R9-0 — Death's Voice
  Build 1 & 2.
- **Striker's "Fast Reload Reload Case"** confirmed correct as-is (real in-game label, not a typo) — no change.

## v2.28.0 — 2026-07-21 (`cd7ba71`) — `/autobuild` live-test fixes · Cloudinary metadata · new Advanced Double Legendary draw · looping pagination
One push bundling four workstreams (the `/autobuild` + Cloudinary metadata batch had been sitting
uncommitted across sessions; the draw-prices + pagination work is from the 2026-07-21 session). **Shipped
live to the VM 2026-07-21.** Player-facing parts: the new draw type + looping pagination. Admin/back-end
parts: the `/autobuild` fixes + Cloudinary metadata.

### `/autobuild` live-test bug fixes
First round of fixes from Harkirat's live `/autobuild` test (notes: `local/autobuild testing notes.md`).
Admin-only feature.
- **Open Loadout now renders the weapon's full build set + real pagination.** The PoC passed a
  single-element array to `buildLoadoutCard`, so every "Open Loadout" card read **"Build 1 of 1"** with
  no Prev/Next arrows, even for a weapon with several builds (live tests 1/3/4). Now queries every build
  of that `weaponKey` and opens **on the just-created build** — correct "Build N of M", working
  pagination. (`index.js` `autobuild_openloadout_` handler.)
- **Confirm now edits the review card in place** into the "Loadout created / Open Loadout" card, instead
  of leaving a stale review panel above a brand-new message (Harkirat's note #11). Applies to the retry
  paths too. (`utils/autobuildPipeline.js` — `replaceWithV2Card` via `sendV2Payload` PATCH `@original`,
  replacing the old new-message `followUpV2Card` POST.)
- **Badges now propagate across every build of a weapon.** Setting e.g. "Meta" during `/autobuild` review
  used to land the badge only on the newly-created build (live test 3) — badges describe the weapon, not
  one variant. `writeLoadoutDoc` now `updateMany`s siblings (same `weaponKey`/`mode`), guarded on "a badge
  is actually set" so a blank can never wipe siblings. Mirrors `/manage`'s `edit_loadout_` convention.
- **Duplicate-loadout detection (advisory warning).** Re-submitting a screenshot of a build already in the
  DB silently created a second identical doc (live test 1). New `findDuplicateLoadouts`
  (`utils/loadoutRender.js`) flags a likely dupe on the review card via two soft rules (Harkirat's idea):
  code **identical** + ≥4/5 attachments match, **or** code within **2 char edits** + all 5 attachments
  match. Advisory only — Confirm still works, so a genuine new variant isn't blocked.
- **Category-conflict warning.** Picking a category that differs from an existing build of the same weapon
  silently registered the weapon under two categories (live test 4 — AK117 ended up both AR and MARKSMAN).
  The review card now warns when the chosen category ≠ an existing build's category. **Build numbering
  stays per-`weaponKey`, deliberately** (a weapon's identity is its key; the real bug is the miscategoriz-
  ation, which this warning surfaces — not the numbering).
- **Cloudinary metadata: switched to Structured Metadata Fields, then fully expanded + backfilled + kept
  in sync** (Harkirat's follow-up calls). **22 account-level fields** created via the idempotent
  `scripts/createCloudinaryMetadataFields.js`:
  - **Loadouts (18):** one per Gunsmith slot (Muzzle/Barrel/Optic/Stock/Perk/Laser/Underbarrel/Ammunition/
    Rear_Grip), **Weapon_Name**, **Mode**, **Build_Number** (int), **Gunsmith_Code**, badges **Is_Meta**/
    **Is_Toxic**/**Rank**, and dates **Created_At**/**Last_Updated** (Created_At read for free from the Mongo
    ObjectId timestamp — no schema change).
  - **Patch notes (4):** **Patch_Id**, **Patch_Season**, **Patch_Image_Order** (int), **Patch_Release_Date** —
    so each cached screenshot knows its season, carousel order, and release date.
  - **Backfilled** all existing assets from Mongo: **132/133** loadouts (the 1 skip is PHARO's external-URL
    "Coming Soon" placeholder) + all 5 Season 6 patch images.
  - **Per-slot fields backfilled too, via a one-time vision batch** (`scripts/backfillLoadoutSlots.js`,
    GCP-authorized spend) — ran the Gemini model over every existing loadout image to recover the
    slot→attachment mapping Mongo didn't store, mapping vision's slot labels onto the authoritative stored
    attachment names. **122/132 fully mapped.** The 10 partials turned out to be pre-existing data bugs the
    batch *surfaced* (two loadout images fully swapped — `L-CAR-9-2`↔`CROSSBOW-1`, a few builds with crossed
    attachments between variants, a stored typo, one revolver-slot miss) — flagged for Harkirat, not
    auto-fixed. `visionExtract` gained an optional `maxAttachments` (default 5; DMZ uses 9) — `/autobuild`
    behavior unchanged.
  - **Auto-syncs on every edit** (the "if I edit these it updates Cloudinary by itself" ask): loadout
    add/edit/bulk + badge propagation, and patch-notes date/URL/season-rename edits. Doc-centric design —
    `syncLoadoutMetadata(doc)` / `syncPatchEntryMetadata(entry)` are the single sync points; metadata is
    always a best-effort step decoupled from any image upload so it can never fail a save.
  - Verified live end-to-end (write + `api.resource` read-back + queryable searches). Real gotcha handled: a
    Cloudinary public_id has no file extension, so `AK117-1.png` had to be stripped to `AK117-1` for the
    metadata API (which silently no-ops on a mismatched id).
- **Removed the AK117 test data** created during the live test — the 3 MP dupe builds (`AK117-2/3/4`, Mongo
  docs + Cloudinary images), guarded by a created-date check. The real MP `AK117-1` and DMZ `AK117-1` kept.

### New "Advanced Double Legendary Weapon Draw" in `/draw prices`
A brand-new draw type added to `/draw prices` from Harkirat's own 10/30 CP breakdown. User-facing.
- **New 3rd page in `/draw prices`** dedicated to the **Advanced Double Legendary Weapon Draw** — a more
  elaborate draw than the others: it offers **three purchase modes per spin** (Regular / Advanced / the
  "Trap") plus a **strategy breakdown**, so it doesn't fit the shared `draws: []` model every other entry
  uses. It gets its own builder (`buildAdvancedDoubleLegendaryEntry`) on its own page, reached via the same
  Prev/Next pagination (now **3 pages**, was 2). Both CP regions have full data.
- **Rendered with the same multi-component "section" style as the rest of the command** (separate Text
  Displays grouped by spacing-2 dividers: headline totals → the 3 purchase modes → the two NOTE/THE-TRAP
  cautions → the strategy list), not one flat text block. Keeps the literal in-game **"Regular Purchase"**
  / **"Advanced Purchase"** labels verbatim.
- **Every number is derived, never hand-typed** — same rule the rest of this file already enforces. Only
  the Regular and Advanced per-pull arrays are stored per region; from those the code derives the **Trap**
  (always exactly 2× Regular), all three totals, the running "CP Spent" lines, the three **strategy costs**
  (Reg/Adv cumulative slices), and even the "cheaper than a Normal Draw (X vs Y)" comparison (Y read from
  the region's own Legendary Weapon Non-Reactive total). So a wrong number can only ever live in one place.
- Verified: all rendered totals/sequences match the source breakdown exactly for both regions; every page
  stays under Discord's 40-component cap (max 33); and out-of-range pages clamp safely.

### Bot-wide: pagination arrows now LOOP instead of disabling on the ends
Every Prev/Next pager in the bot (draws & calendar sub-pages, draw prices, `/settings`, View Colors,
`/alerts`, loadout cards) now **wraps around** — Next on the last page jumps to the first page, Prev on
the first page jumps to the last — instead of the arrow going disabled at the end (Harkirat's request).
- Centralised in the shared `utils/paginationRow.js`: the arrows are no longer disabled (only the middle
  page counter stays a disabled label), and the wrap modulo lives in ONE place via a new
  `makeCustomId(targetPage)` callback the 6 target-page callers now pass instead of pre-baked
  `prevCustomId`/`nextCustomId` strings.
- Loadout cards kept their existing direction-based custom_ids — their index.js handler already did the
  modulo wrap on click, so they just needed the buttons un-disabled.
- Applies at exactly 2 pages too (both arrows then simply point at the other page) — a deliberate part of
  "loop everywhere"; flag if you'd rather 2-page pagers keep a disabled end instead.

## v2.27.0 — 2026-07-21 (`042b5e9`) — silence routine gateway-reconnect alerts (log, don't post)
Admin/ops-only — nothing changes for players. Was committed & pushed earlier; **confirmed pulled + live
on the VM 2026-07-21**, in the same deploy that shipped v2.28.0 (above).
- **The routine "Reconnecting to Discord" → "Gateway resumed" pair no longer posts to the Discord alert
  channel** — it's still fully LOGGED to the alert store, just not pushed as a message. These fire every
  1-3h as normal, self-recovering gateway churn (Discord cycling sessions / tiny network blips —
  sub-second, resumed with full event replay = zero data loss), so they were pure channel noise. Harkirat's
  call: keep the history for a future `/status` to print on demand, stop the every-few-hours pings-that-
  aren't-really-pings. Confirmed via the VM journal that these were firing ~every 1-3h with clean
  sub-second resumes before making the change.
- **Mechanism:** new `sendAlert(..., { silent: true })` option (`utils/alertWebhook.js`) — logs to the
  store, skips the webhook POST, never pings. Store docs carry a new `silent:true` flag (`AlertLog.silent`)
  so `/status` can later pull exactly the reconnect history. The genuinely-bad case is untouched and still
  loud: a reconnect that FAILS to resume surfaces via the separate 🟠 "Gateway disconnected" handler (which
  pings), so suppressing the routine pair can't hide a real outage.
- **Deferred to when `/status` is built** (noted in CLAUDE.md): `/alerts`' recent-list/export will show
  silent docs (they'll dominate by frequency — likely wants a filter), and silent docs share the 1000-doc
  retention cap with real alerts (may want their own retention). Log-now, present-later, per Harkirat.
- Verified offline (silent path skips fetch, both paths record, flags correct).

## v2.26.0 — 2026-07-20 (`477d37c`)
Pushed + deployed to the GCP VM this session; the alert store is **verified live in production** (the
boot's own "Bot online" alert wrote the first real doc, `Jul21-01` — UTC-day rollover working as designed).
The interactive `/alerts` panel (buttons/pagination) is not yet click-tested in Discord. This bundles the
previously-staged housekeeping/`/manage`-colors work — one push, one version (a moderate feature folds the
minor housekeeping in). Full technical detail: CLAUDE.md's "Deployment & Ops (GCP)" section.

**Persistent alert log + `/alerts` command** — the "webhook alerting, heavier half" roadmap item (per-alert
IDs + downloadable log + explainer) plus 3 folded-in legibility fixes. `/status` was **un-bundled** and
stays deferred (Harkirat's call — unsure of its usability right now).
- **Every alert is persisted to Mongo** (`models/AlertLog.js`) with a short human-referenceable ID —
  `MMMDD-NN` on the **UTC** day, e.g. `Jul20-03`. Generated race-free via an atomic per-day counter
  (`models/AlertCounter.js`) so a same-second crash burst can't collide. Retention: >30 days OR beyond a
  1000 hard cap, pruned ≤1/hour.
- **`utils/alertStore.js`** owns the store + the `/alerts` read helpers. The store write is an **independent
  fire-and-forget** from the Discord POST (neither awaits the other) — a Mongo outage can't stop an alert
  reaching Discord (a DB failure is itself an alert), and a Discord outage can't stop the log. `sendAlert`
  stays synchronous / never-throws / never-blocks and just mirrors what was actually sent (post-throttle).
- **New admin-only `/alerts` command** — a Components V2 panel: severity summary (24h/7d counts + last
  error's ID/time), a paginated newest-first recent list (each with its ID), an **Export Log** button
  (a `.txt` fuller than the embed), and a **"What alerts mean?"** explainer subpage. Auto-gated by adding
  `alerts_` to index.js's centralized admin-guard prefix list.
- **Escalating uptime format** in every alert footer (was raw `730m`): always the top two units —
  `42Min` → `3H 42Min` → `2D 22H` → `1W 3D` → `1M 3W` → `1Y 2M` (minutes shown as `Min` so a bare `M` is
  unambiguously months). `utils/alertStore.js`'s `formatUptime()`.
- **"Gateway reconnecting" → "Reconnecting to Discord"** — clarifies the bot *process* is fine and only the
  gateway websocket dropped; deliberately NOT "restarting" (which would falsely imply a crash).
- **Manual-vs-automatic restart labeling.** New VM-side `scripts/deploy.sh` writes a gitignored
  `.restart-reason` marker right before restarting; the bot reads + consumes it on boot, so "Bot online"
  now reads **🚀 Manual deploy** / **🔧 Manual restart** / **♻️ Automatic/unattended restart** (with
  `systemd NRestarts` context). A stale marker (>10 min) is ignored. `deploy.sh` is now the deploy path;
  a bare `systemctl restart` correctly shows as automatic.

**Bundled-in housekeeping + `/manage` accent colors** (was staged as v2.25.1)
- Deleted 2 stale settings backups (after confirming the current files they back up still parse as valid JSON).
- Swept for stale absolute paths from the 2026-07-14 relocation — came back clean.
- **`/manage` pages each get their own accent color** — Draws/Calendar/Patch Notes reuse their command's
  `PRESET_ACCENT`; MP Loadouts red (`#FF3430`) and DMZ blue (`#337BA6`), sampled off the
  `:Rank_7Legendary_CODM:`/`:DMZ_CODM:` emoji via the bot's own `getDominantColor()` pipeline.
- **Removed 2 unused deps** (`mongodb` raw driver, `express`) and index.js's dead Express keep-alive server
  (a Render/Railway free-tier workaround, obsolete since the VM/systemd move). `npm audit` set unchanged.

**Process fixes (docs/tooling)** — a ⚡ FIRST ACTION banner at the top of `SESSION-START.md` backstopping
the `/rename`+model-rec convention (it had silently degraded on recent sessions); a notes-file item about a
MarkEdit Return-key regression annotated + filed to `deferred-items.md` after a prior session dropped it.

---

## v2.25.0 — 2026-07-20
**`/autobuild`: screenshot → live loadout, built and shipped** (`d41a92f`..`299998a`, 18 commits) —
moderate — pushed AND deployed live to the VM. *(Documented late — this whole feature shipped live
across an earlier push with no numbered CHANGELOG entry at the time; backfilled now. Full technical
detail lives in CLAUDE.md's "Loadout automation (screenshot → live loadout)" section — this entry is
the release-notes summary, not a duplicate of it.)*

- **New admin-only `/autobuild` command**: submit a Gunsmith screenshot (attachment or URL), the bot
  runs it through an LLM vision call to extract weapon name / Gunsmith code / attachments, cleans up
  common OCR mistakes (fuzzy-matches attachments against existing `Loadout` data, structurally corrects
  the Gunsmith code's Number-Letter alternation), then shows a Confirm/Edit/Cancel review card before
  anything saves — never auto-publishes straight from extraction, same "review before write" convention
  every other `/manage` destructive action already uses.
- On Confirm: auto-generates the `WEAPON-NAME-N` image key/build number deterministically (plain code,
  no AI), uploads the image to Cloudinary, and writes the real `Loadout` doc — with an "Open Loadout"
  button on success.
- Built as 9 tasks + a final whole-branch review in one sitting (`commands/autobuild.js`,
  `utils/autobuildPipeline.js`, `utils/visionExtract.js`, `utils/loadoutImageCache.js`, plus new
  `adminParser.js` helpers). Review caught and fixed several real bugs before it ever went live: a
  confirm/retry duplicate-write race window, an ephemeral-reply leak in the extraction error path, an
  unawaited-promise/data-loss-ordering bug in the write pipeline, and the Edit modal needing
  `sendV2Payload` + guards for undefined fields.
- **Vision backend migrated from Google AI Studio to GCP Vertex AI** (`299998a`) after AI Studio's
  separate Gemini prepay credit balance ran dry — Vertex AI bills against the same GCP project credits
  already backing the VM, at identical Gemini pricing. Uses a keyless dual-layer OAuth token fetch (VM
  instance metadata server first, local `gcloud` ADC as a Mac-side fallback) — no stored credentials.
  Required the VM's service account to gain the `cloud-platform` instance scope (Harkirat stopped/
  restarted the VM for this — new external IP) and routing `gemini-3.5-flash` through Vertex AI's
  `global`/`us`/`eu` Multi-Region endpoints (single-region endpoints don't serve that model).
- **Two real bugs fixed in this same commit**, found during review of a same-day Antigravity handoff
  session (used while a Claude session was rate-limited): `gunsmithCode` was coming back with the
  weapon name prepended (`"Locus-1B2A4B8C9C"` instead of `"1B2A4B8C9C"`) — fixed via a prompt change
  plus a structural backstop (`correctGunsmithCode`'s `stripCodePrefix()`); and per-attachment slot-type
  extraction (e.g. "Muzzle", "Barrel") was missing entirely despite being part of the original design —
  added, attached as Cloudinary `context` metadata, not bot-facing.
- Also in that same commit: fixed `DEFAULT_LOCATION`'s fallback (`'us-central1'` → `'us'`, the original
  wrong single-region guess had never actually been corrected in code even after the working `.env`
  override was found), and removed 2 unused npm dependencies the handoff had introduced
  (`@google-cloud/vertexai`, `@google/genai` — the real implementation is a raw `fetch` call, no SDK).
- **Comment accuracy fix** (`8d81f54`): `correctGunsmithCode`'s header comment was updated to describe
  all 3 of its actual correction branches (type-mismatch look-alikes, same-type case normalization,
  no-op) instead of only the first.
- **Not yet done, on purpose** (Harkirat's explicit call, "we'll figure it out after a live test"):
  visually disabling the review card's Cancel/Confirm buttons after use, and validating the Edit
  modal's free-typed `category` field. **Status as of this entry: code-complete and deployed, but
  Harkirat has not yet run the real end-to-end Discord test** — treat any bugs that surface from that
  test as fresh work, not a continuation of this entry.

## v2.24.0 — 2026-07-20
**Cloudinary `asset_folder` fix + full account cleanup + patch notes broken-image fix** — minor — pushed,
NOT deployed to the VM yet (Harkirat's explicit call — no need to redeploy for this push).

- `utils/cloudinaryCache.js` / `utils/patchNotesCache.js` now set Cloudinary's `asset_folder` on every
  upload, not just a `temp_draws/`/`patch_notes/{id}/` prefix baked into the `public_id` path. Both
  were always functionally correct (URLs always resolved right) — this only fixes Cloudinary's own
  dashboard never recognizing them as organized into a folder, which is what made them look like they
  were sitting in "Home" when browsed directly. No `public_id`/URL changes, so no MongoDB data needed
  touching for this part.
- **Live Cloudinary account audit + cleanup** (executed directly via the Cloudinary MCP tool + a
  MongoDB cross-reference, not just code): confirmed the 10 `IMG_XXXX` "unrenamed" assets flagged last
  session were actually already-superseded dead weight (re-uploaded correctly 15 minutes after the
  original mistake, timestamps confirm it) — deleted. The 12 correctly-named replacement assets
  (`DOBVRA-1`, `R9-0-1`, etc., `LOCUS-1`/`-2`) were sitting in Cloudinary's root folder instead of
  `gun-builds` — moved (public_id/URLs untouched). ~26 of Cloudinary's own default demo assets
  (`samples/*`) deleted, unrelated to the bot. `DMZ-Assaulter-1`/`DMZ-Scavenger-1` deliberately left
  alone (Harkirat confirmed: reserved for a future DMZ feature, not a mistake). Real Cloudinary folders
  now exist for all three subsystems: `gun-builds`, `temp_draws`, `patch_notes`.
- **Also discovered: Cloudinary's `public_id` (the real URL identifier) and `display_name` (a purely
  cosmetic dashboard label) are independently-editable fields** — several assets have a correctly-
  renamed `public_id` but a stale `display_name` still showing the original upload filename, which is
  what made them look unrenamed when browsing Cloudinary directly even though the bot's URLs were
  already correct. Not fixed everywhere (cosmetic only), flagged as optional in CLAUDE.md.
- **Patch notes broken-image bug FIXED (a data fix, not a code fix).** The live Season 6 patch note
  entry's `images[]` were raw, already-dead `media.discordapp.net` links (confirmed 404 at the CDN
  origin via direct `curl`, despite still rendering fine in Harkirat's own Discord client — that's
  Discord's client silently refreshing an expired signed attachment link for a viewer who can still
  resolve the source channel, which doesn't help a server-side fetch). Harkirat supplied 5 fresh URLs;
  each verified live, re-cached through the existing `cachePatchImage()` (`patch_notes/
  6a4bd78c9b44d22e27107d2c/0-4.webp`), and the live `SeasonalData` doc's `patchNotes[0].images` updated
  directly via the MongoDB MCP tool. `/patch notes` now serves permanent Cloudinary URLs for this entry.
- **Loadout-automation design captured, not built** (deferred to a dedicated future session) —
  screenshot → LLM vision extraction (Gemini, not the Claude API — Claude Pro doesn't cover API billing)
  → structural Gunsmith-code correction + attachment fuzzy-matching → confirm-before-publish → auto
  weaponKey/build-numbering → Cloudinary upload + Mongo doc. Full design in CLAUDE.md's new "Loadout
  automation (screenshot → live loadout)" section under the roadmap.

Full technical writeup: CLAUDE.md's "MP loadout system" → "The Cloudinary image workflow, finally
documented", "Patch notes Cloudinary caching", and "Loadout automation (screenshot → live loadout)"
sections.

## v2.23.0 — 2026-07-18
**`/manage` loadout data-entry UX overhaul + Cloudinary workflow fix** (`de02ee9`) — moderate —
**deployed live to the VM 2026-07-19** (confirmed via `scripts/vmstatus.sh` — Gateway connected, 0
real errors, bundled with v2.22.0/v2.21.1 below in the same pull). ⚠️ **Harkirat has NOT yet
live-click-tested the actual `/manage` loadout flow in Discord** — admin-only impact (doesn't affect
normal user-facing commands), so he's deliberately continuing other work before doing that
verification pass. Don't assume click-tested just because it's deployed.

P1 roadmap item, filed 2026-07-18 from the third v2 batch, shipped same day.

- **"How Images Work" info block** added to both `/manage` Loadouts pages (MP + DMZ) — explains, in
  the panel itself, that image uploads are a manual step OUTSIDE the bot (Cloudinary's own dashboard,
  or asking Claude to do it), that Cloudinary assigns the Public ID from the uploaded file's own name
  unless renamed, and that whatever that Public ID is has to be typed exactly into "Cloudinary Image
  Key" — no auto-fetch, no validation ahead of time.
- **Add/Edit Loadout modal field clarity** — the Attachments field (previously no placeholder at all)
  now shows a real example; the image field is relabeled "Cloudinary Image Key (Public ID)" with a
  placeholder reflecting the actual naming convention used across the live collection
  (`WeaponKey-BuildNum`, e.g. `BP50-1`), not the old made-up `bp50_flex_v1` example that was never the
  real convention anywhere.
- **Real Cloudinary existence check, the actual functional fix.** `utils/loadoutRender.js`'s new
  `checkImageExists()` does a HEAD request against the constructed image URL right after a save —
  Add Loadout, Edit Loadout, and Bulk Add/Replace (`index.js`) all call it and append a clear warning
  to the confirmation message if the key doesn't resolve to anything on Cloudinary yet. Advisory only
  (never blocks the save; a network hiccup is treated as "can't confirm," never as "missing," so it
  can't produce a false warning). This is the direct fix for the exact failure Harkirat hit with FSS
  Hurricane — a mismatched key used to save silently and only surface later as a broken card image;
  now it's flagged the moment it's saved.
- **The Cloudinary mystery is genuinely solved, not just narrated** — confirmed the real workflow live
  against the actual Cloudinary account (via the Cloudinary MCP tool, not guessed): every loadout image
  sits in one flat `gun-builds` folder (organizational only in Cloudinary's UI, NOT part of the delivery
  URL — this account uses dynamic-folder mode), and roughly a dozen assets are still sitting under their
  raw, never-renamed camera filenames (`IMG_5630`, `IMG_3123`, etc.) — direct confirmation of what
  Harkirat had already suspected about the secondary-weapon files. Full writeup in CLAUDE.md's "The
  Cloudinary image workflow, finally documented" subsection under "MP loadout system".
- Verified via direct function-level testing (not a full local bot boot, to avoid racing the live VM
  instance — single-token bot): `buildManagePage()` for both loadout pages builds cleanly at 35
  components (well under Discord's 40 cap), every modal builder runs without throwing (including the
  legacy-missing-`imageKey` guard case), and `checkImageExists()` was run live against a known-good key
  (`FSS-HURRICANE-1` → true), a known-bad key (→ false), and the bulk-import placeholder URL (→ true,
  correctly never checked).

## v2.22.1 — 2026-07-18
**Workflow glossary rewrite + central-notes confirmation system — docs only, no bot code touched**
(this push) — minor

Follow-up to v2.22.0's push, same day. Two threads, purely process/documentation, no bot behavior
changed:

- **document/commit/push/deploy glossary rewrite.** `docs/SESSION-START.md`'s NON-NEGOTIABLES section
  used to define "push" as always meaning the full deploy cycle — that stopped being literally true the
  moment v2.22.0 shipped as commit+push with the VM deploy deliberately held. Rewritten into 4 clearly
  separable steps (commit = local only; push = code reaches GitHub, bot untouched; deploy = the VM
  actually goes live; document = syncing the written record), with the default-chain assumption stated
  explicitly rather than baked into one overloaded word. Synced into `user_working_agreement.md` too.
- **`docs/diors-builds notes.md`'s confirmation-mark system finalized.** Built earlier this session as a
  real MarkEdit extension (files live in MarkEdit's own app container, not this repo — see
  `reference_markedit_extension_api` memory for the full build/debug story and exact paths), landed on
  its final spec after several rounds: 4 shortlisted symbols (✴︎ ✦ ◆ ℋ), 8 final colors (amber, orange,
  pink, violet, periwinkle, cobalt blue, cyan, turquoise), all switchable live via a "Confirmation Mark"
  menu in MarkEdit's Extensions bar, no restart needed for color/default changes. The file's own 🔑
  Legend section now documents the finalized system in place of the earlier placeholder text, and every
  one of the 5 original notes-file questions that prompted this whole thread is formally closed
  (`[x] ✓`) rather than just answered inline. Full narrative in DEVLOG's "Building a real MarkEdit
  extension" entry.

## v2.22.0 — 2026-07-18
**`/settings` passive idle-timeout auto-disable** (this push) — moderate —
**deployed live to the VM 2026-07-19** (confirmed via `scripts/vmstatus.sh`, bundled with v2.23.0/
v2.21.1 in the same pull — the deploy was deliberately held at push time to keep working, then
completed the same session). ⚠️ **Harkirat has NOT yet live-tested the actual 10-minute passive
idle-timeout behavior** (open `/settings`, leave it untouched for the full 10 minutes, confirm the
buttons go dead with no click required) — don't assume click-tested just because it's deployed.

Built the passive auto-disable feature designed earlier this same session (after two rounds of
correction on the underlying Discord token mechanics — see v2.21.1 below and CLAUDE.md's "Known open
issues"). `/settings`' old REACTIVE 15-minute expiry — a deadline encoded in every custom_id, checked
on click, replying "run `/settings` again" while the buttons themselves stayed visually live forever —
is replaced with a genuinely PASSIVE mechanism:

- **New `utils/passiveExpiry.js`.** Every render of `/settings` (the initial command AND every
  button/select re-render) schedules a `setTimeout` holding THAT render's own fresh interaction token.
  Any later interaction on the same message cancels the pending timer and reschedules from ITS OWN
  token — a sliding 10-minute idle window, not a fixed deadline from creation. If 10 straight minutes
  pass with zero interaction, the timer fires entirely on its own (no click involved) and `PATCH`es the
  message directly using the held token to recursively disable every button/select in it. 10 minutes is
  a self-imposed UX choice, comfortably under each token's own ~15-minute lifetime.
- **`commands/settings.js`** dropped the old `SETTINGS_PANEL_TTL_MS`/`expiresAtOverride` scheme and the
  `|{expiresAt}` segment on every custom_id it builds; the final send now captures the returned message
  (Discord's own `PATCH` response already carries the message's `id` — no extra `fetchReply()` round-
  trip needed, even on the very first render) and calls `schedulePanelExpiry`.
- **`index.js`** removed the 4 now-dead reactive expiry checks (`set_`, `toggle_`, `set_page_`,
  `colors_view` handlers) — Discord itself refuses a click on an actually-disabled component, so
  there's nothing left for a reactive check to catch. Author-lock (`|userId`) on all 4 is unchanged.
- **Verified offline, not live**: syntax-checked, unit-tested the disable-recursion logic against a
  realistic settings.js-shaped payload (Section accessories, action-row selects/buttons, a top-level
  share-button row — all correctly disabled, dividers/text left untouched, no mutation of the source
  array), cross-checked every custom_id builder/parser pair for the new (shorter) shape, and confirmed
  via `@discordjs/rest`'s own source that a `PATCH` response is parsed JSON carrying the message `id`.
  **Did not boot the bot locally** — the VM is the one live instance for this single-token bot; a local
  boot would have raced it. A real Discord click-through is still pending the VM deploy.
- **Scoped to `/settings` only** — extending the same pattern to draws/calendar/drawprices/loadouts is
  its own separate roadmap item (see the v3 pre-release list above). The standalone View Colors panel
  (opened via `colors_view`) still has no timeout of its own, unaffected.
- Full design trail (including the two corrections that preceded this build) in CLAUDE.md's "Passive
  idle-timeout auto-disable" section and "Known open issues".

## v2.21.1 — 2026-07-18
**Deploy-key fix + button-expiry mechanics correction + roadmap intake — docs/ops only, no bot code
touched** (this push) — minor

Follow-up to v2.21.0's push, same day. Three threads, no bot code changed, no VM redeploy needed:

- **Deploy-key fix.** Flipping the repo private broke the VM's `git pull` (it had been pulling
  anonymously over plain HTTPS, which only ever worked because the repo was public). Fixed with a
  dedicated **read-only SSH deploy key** generated on the VM and registered via `gh repo deploy-key
  add` — not by reusing a personal GitHub token (attempting to extract one via `gh auth token` was
  correctly blocked by the safety classifier, same category as the earlier `~/.render/cli.yaml` block).
  VM remote is now `git@github.com:HarkiratMangat/diors-builds.git`. Documented in CLAUDE.md's
  Deployment & Ops section, `reference_vm_bot_commands`, and `project_deployment_migration_render_to_gcp`.
- **Button-expiry mechanics — wrong twice, corrected properly the third time.** Harkirat asked whether
  an expired button could be physically disabled instead of Discord's generic failure toast. First
  answer (sourced from a real Discord-docs search on the 15-minute interaction-token lifetime) wrongly
  concluded a MESSAGE becomes uneditable 15 minutes after creation — contradicted by the plain fact
  that draws/calendar/loadout pagination buttons already work forever with no expiry check at all.
  Corrected once Harkirat pushed back: **every button click carries its own fresh 15-minute token**,
  independent of the message's age — that's exactly why those other buttons never break. `/settings`'
  existing 15-minute expiry is a self-imposed business rule, not a Discord ceiling (an earlier claim
  that it "had to" be 15 minutes for platform reasons was also wrong, and retracted). The real,
  buildable gap: `/settings` already replies with a friendly "expired" message on a stale click, but
  never uses that click's own valid token to actually disable the buttons — filed as a concrete P2
  roadmap item. See CLAUDE.md's "Known open issues" + the new roadmap entry, and DEVLOG's "(yet later)"
  entry for the full correction trail.
- **15-item note-filing pass**, folded into the v3/v4 roadmap and `deferred-items.md`: Privacy Policy /
  Terms of Service (P1, real Discord requirement past the v4 100-server threshold), a `/define` Urban
  Dictionary command (P3, just for fun), richer usage analytics/telemetry (P2, distinct from the
  existing diagnostic-logging item — this is usage tracking, not failure attribution), `/help` now
  explicitly required to include a way to contact Harkirat, and extending the expiry-check pattern
  beyond `/settings` to draws/calendar/drawprices/loadouts filed as its own item. Also confirmed via
  full grep: every avatar/banner/deco/nameplate read in the bot uses the user's GLOBAL Discord profile,
  never a per-server Server Profile override — a real, previously-undocumented gap, deliberately
  deferred to v4 (guild membership becomes reliably available then). Two items resolved as non-issues
  rather than left open: "Tundra" is confirmed already correct in the live DB (`LW3-TUNDRA`, MongoDB
  MCP connected with explicit permission), and a rough Atlas tier check (144 docs / ~135KB total) shows
  storage isn't the constraint that will force an upgrade at current scale.

This entry replaces an earlier stale draft that only described the deploy-key fix, written before the
button-expiry correction and note-filing pass landed on top of it. Full story in DEVLOG's three
2026-07-18 "(later)" entries.

## v2.21.0 — 2026-07-18
**v2 quick-wins polish batch — 8 small user-facing items + doc housekeeping** (`c5b8663` + this push) — moderate

- **`/timestamp`'s `format` option renamed to `view`** — "format" read as if it picked a timestamp
  FORMAT (already `style`'s job); `view` is what it actually controls (Embed panel vs plain text).
  Same shape as the earlier `ephemeral`→`private`→`hidden` renames.
- **Added the `hidden` option to `/settings`** — every other command already had it; `/settings` was
  simply missed. Same explicit-option > saved-preference > public priority (`resolveEphemeral`) as
  everywhere else — the in-panel Show/Hide toggle still controls the SAVED preference exactly as before.
- **Mobile-width pass across every slash command's descriptions** — several (Settings 83 chars,
  Manage 68, Calendar 50, Season End's subcommand 69, Timestamp's datetime/timezone/view options, the
  weapon/build options shared by `/dmz`/`/all`/`/<category>`) were truncating to "..." on Discord's
  mobile command picker; trimmed to fit while preserving meaning. Left the standardized `hidden`
  option wording untouched (already a deliberate, heavily-revised cross-command convention).
- **Loadout search now handles a short/partial weapon name** (e.g. `loc`) instead of just failing.
  New `findWeaponMatches()` (`utils/search.js`) fuzzy-matches the raw typed query against the
  mode/category-scoped candidate list when the exact `weaponKey` lookup misses: an unambiguous single
  match auto-resolves; 2+ matches replies with the real candidate names and asks the user to pick one
  instead of silently guessing. Applied to `/dmz` and the shared `/all`+`/<category>` MP fallback.
- **Admin (`ALLOWED_ADMIN_ID`) is never action-blocked on someone else's `/settings` or View Colors
  panel anymore** — a new `resolvePanelActor()` helper (`index.js`) lets Harkirat through every
  per-user author-lock (toggle/set/set_page/colors_view/colors_page/colors_subpage/colors_refresh)
  while still rendering/mutating the ORIGINAL owner's data, never his own — achieved by swapping
  `.user` on a synthetic interaction to the real fetched target user, not by relaxing the identity
  check alone (which would have silently shown Harkirat's own avatar/prefs instead). `/manage`'s own
  admin-only guard needed no override (it was already admin-only by design).
- **Reworded every "action blocked" denial message** across `/manage`'s admin guard and every
  `/settings`/View Colors author-lock — clearer, a little lighter, and says what to do instead (e.g.
  "🔒 Not your dashboard! ... run `/settings` yourself").
- **View Colors: added full-resolution Download Avatar / Download Banner buttons** to their respective
  color pages, bottom, outside the container, beside Refresh Colors — matching `/settings`' existing
  download-link buttons (style-5 Link buttons pointed at the 4096px CDN URL, visually the same grey as
  a Secondary button, just backed by a direct link instead of an interaction). `utils/colorPalette.js`'s
  `getPalettePanelData` now also surfaces `avatarFullUrl`/`bannerFullUrl` (free — already-computed CDN
  URL strings, no extra fetch).
- **`/manage`'s `section` option renamed to `data_for`** — "section" didn't describe what's actually
  being picked (a data ENTITY: Draws/Calendar/Loadouts/Patch Notes/Season). Discord option names can't
  contain spaces, so `data_for` is the closest valid spelling of the requested "data for".
- **Docs (`c5b8663`):** added a title-only greppable table of contents to CLAUDE.md, filed 5 new v2
  items + 2 v3 items + 2 someday items from the notes-scratchpad intake, applied the
  `[Priority · Effort]` tag system to the near-term roadmap.
- **`/secondaries` stays exactly as-is** (command name, DB category enum, and the command's own
  description) — reconsidered the older "rename to `/secondary` + `/pistols` alias" roadmap idea and
  dropped it. Two small display-only wording tweaks instead: the autocomplete tag (`/all`'s
  `[SECONDARIES] weaponName`) and the rank badge line ("Best SECONDARIES") now read the singular
  "SECONDARY" — the footer, command name, and description are untouched.
- **New category-level search synonyms** (`utils/search.js`'s `resolveCategorySynonym`) — typing a
  weapon-CLASS term (`pistol`, `assault rifle`, `smg`, `lmg`, `marksman`/`dmr`, `sniper`, `shotgun`,
  `secondary`/`secondaries`, `handgun`) now surfaces every weapon in that category, not just weapons
  whose own name happens to contain that word. This is the direct replacement for the shelved
  `/pistols` alias idea (no new command needed) — applied to `/dmz`/`/all`/`/<category>` autocomplete
  AND the short/partial-query exact-lookup fallback added earlier this batch.
- **Repo housekeeping: `CHANGELOG.md`, `CHANGELOG-SUMMARY.md`, `DEVLOG.md`, `SESSION-START.md`, and the
  central notes scratchpad (`diors-builds notes.md` + its `notes-archive/`) all moved from
  gitignored/local-only into a new TRACKED `docs/` folder** (Harkirat's request, so a real `git diff`/
  `git log` covers their history instead of manual snapshots — the repo was public at the time and he
  was consciously aware/OK with it). `.env` stays gitignored (secrets never belong in git history,
  regardless of repo visibility). The `SessionStart` hook (`.claude/settings.local.json`) was updated
  to the new `docs/SESSION-START.md` path and verified resolving correctly. Every structural/live
  reference to these files across CLAUDE.md and memory was updated to match; historical narrative
  entries describing their PAST gitignored status were left as accurate history, not rewritten.

## v2.20.0 — 2026-07-17
**Admin Edit-loadout fix + daily heartbeat + Ops Agent (RAM peaks)** (`64d4c38` + this push) — moderate
Bundles the previously-staged v2.19.1 (alert-ping wording + memory-boundary docs) with this session's
work into one push; numbered MODERATE because it's a real bug fix restoring a fully-broken admin
capability PLUS a new monitoring feature PLUS new ops observability, not a lone MINOR follow-up.
- **FIXED: `/manage` Edit was completely broken for every entity** (draws, calendar, MP + DMZ loadouts).
  Clicking the intermediate **Edit** button after a single-match search gave "Dior's Builds didn't respond
  in time." The `mng_editbtn_` handler had been written into the `isModalSubmit()` block, but its custom_id
  is a **button** — so a button click never reached it (dead code) and timed out with no ACK. Moved the
  handler into the `isButton()` block; same wrong-`isX()`-branch class of bug as the loadout Browse
  dropdown before it. Broken (unnoticed, never live-clicked) since the `mng_editbtn_` flow shipped
  2026-07-12. Verified offline against live Mongo: the edit modal now builds for the real FSS Hurricane doc
  and all 125 MP loadouts without throwing.
- **NEW: daily "still healthy" heartbeat** (`utils/alertWebhook.js` via `index.js`) — an info-level,
  NON-pinging Discord alert every 24h (uptime / servers / gateway latency / memory), so a long quiet
  uptime is proven-alive rather than ambiguous. Skipped when the gateway isn't ready; not fired on boot
  ("Bot online" already covers that). Complements v2.19.0's trouble/startup-only alerts.
- **Alert readability pass** (`utils/alertWebhook.js` + `index.js`) — the webhook alerts were hard to
  parse (Harkirat's feedback). Now: **4 severity levels** 🟢info / 🟡caution / 🟠warn / 🔴error (was 3) —
  "Gateway reconnecting" dropped from orange to 🟡 yellow since it's transient/self-recovering, distinct
  from a real 🟠 "Gateway disconnected"; **pings now fire on orange + red** only. Every alert carries a
  proper Discord `<t:>` timestamp (timezone-correct, hover-expandable). Fixed the "Bot online" alert
  showing a nonsensical "gateway -1ms" (ping isn't measured yet at that instant) → "measuring…".
- **`/manage` Edit prompt: Edit + Search Again buttons now share one row** (were two stacked rows) for the
  single-match case.
- **NEW: GCP Ops Agent installed on the VM** (v2.70.0, apt-repo method — the migration-time 404 was
  transient) → unlocks guest RAM/disk metrics + log forwarding. **`scripts/vmpeaks.sh` now reports RAM
  peaks** (`rampeak()`, `agent.googleapis.com/memory/percent_used`). Gotcha fixed along the way: the
  project's Cloud Monitoring + Cloud Logging APIs were both disabled, so the agent silently dropped every
  metric — `gcloud services enable`d both (free-tier) and export errors went to zero; first RAM peak read
  43.7% of the 1 GB VM.
- **Alert pings now carry the title in the message** (`utils/alertWebhook.js`, from staged v2.19.1) so the
  notification reads "@Dior 🟠 Gateway disconnected" instead of a bare @mention.
- **Docs (from staged v2.19.1):** revised the canonical-memory-path note (CLAUDE.md + SESSION-START +
  working agreement) from "delete the slug `memory/` subdir if it appears" → "do NOT create/delete/symlink
  it; it's the PAUSED memory-architecture redesign's domain, defer" — after a Diors session wrongly deleted
  the empty slug dir (harmless). New memory `feedback_defer_to_owning_project`.

## v2.19.0 — 2026-07-17
**Hosting migration Render → GCP + observability + Discord alerting** (`e60b17a`) — moderate
- **Migrated hosting off Render (free tier) to a Google Cloud Compute Engine e2-micro VM** (us-east1,
  under systemd, auto-restart on crash + reboot). Render's free tier could not hold the Discord gateway
  (10-14 min connects → silent zombie sockets → every interaction failed); identical code connects in
  ~6s on the VM and holds. Render suspended as a fallback (delete ~2026-07-24). Full saga: DEVLOG 2026-07-17.
- **Discord webhook alerting** (`utils/alertWebhook.js`, wired into index.js at 9 sites): posts crashes,
  gateway disconnect/reconnect/error, DB failure, uncaught exception/rejection, and a "Bot online" ping
  per (re)start to a private channel. **Active @mention** to the admin on notice-worthy alerts (errors +
  gateway disconnect); error alerts include stack frames; every footer carries host + RSS memory + uptime.
  Throttled 1/min, never throws, never blocks. `LOG_WEBHOOK_URL` is a secret (`.env` only).
- **Monitoring tools:** `scripts/vmstatus.sh` (one-command VM+bot health) + `scripts/vmpeaks.sh`
  (historical CPU peaks 12h-30d via Cloud Monitoring). RAM peaks pending the Ops Agent (deferred).
- **New deploy flow:** `git push` → on the VM `git pull && sudo systemctl restart diors-bot` → verify
  `scripts/vmstatus.sh`. Docs: CLAUDE.md "Deployment & Ops (GCP)" section, SESSION-START, memory.

## v2.18.3 — 2026-07-16
**Shard-lifecycle diagnostics + gitignore fix** (`2a9482b`, `7c59297`, `48f5a7d`) — minor
- **Added Discord shard-lifecycle logging** (`shardReady`/`shardResume`/`shardReconnecting`/
  `shardDisconnect`/`shardError`) in `index.js`. The Gateway handshake could silently take 10+ min with
  zero error anywhere; this made the WS-layer retry activity visible instead of pure silence. (This is
  what later gave us the diagnostic trail that pinned the Render failure and drove the GCP migration.)
- **Gitignored `.claude/settings.local.json*`** — was only untracked by luck; a `git add -A` would have
  swept personal Claude Code settings into the public repo.
- Doc: recorded Render auto-deploy disabled (the temporary safeguard, now moot — Render retired in v2.19).

## v2.18.2 — 2026-07-16
**Docs & tooling — no bot code touched** (`cf6cad7`, `df8cc58`) — minor

Two commits pushed together as ONE version, same "doc-only push bumps MINOR" rule as v2.18.1.

- **Corrected the canonical memory-path note** — it previously (incorrectly) claimed the
  `-Applications-Claude-Code-Diors-Builds` project folder doesn't exist at all; it does (the harness
  writes session transcripts there after the repo's move), it just must never gain its own `memory/`
  subdirectory. Recorded that memory deliberately doesn't follow the repo path, worded so a future
  session doesn't "fix" it by migrating.
- **Added a general bot/code housekeeping item to the roadmap**: remove leftover `*.bak-*` config
  backups, sweep for stale absolute paths after the relocation, dead-code/comment/dependency review,
  and the `/patch notes` carousel chunking question.
- **Added git-tag versioning, complementing (not replacing) the existing push/version system.** Each
  real push's version now also gets an actual git tag (e.g. `v2.18.1`), so `git describe --tags`
  gives free visibility into what's committed-but-unpushed since the last real push. Backfilled
  `v2.17.3`, `v2.18.0`, `v2.18.1` by cross-checking this file directly against `git log` — a first
  pass missed `v2.18.1` by only scanning commit messages for an explicit version string, since none
  of its 3 bundled commits name it.

## v2.18.1 — 2026-07-15
**Docs, roadmap & housekeeping — no bot code touched** (`f7b4575`, `c4b1c19`, `1600b8e`) — minor

Three commits pushed together as ONE version. They were only ever live as a single state, so they get
one number rather than one each — see the versioning note in the header; a doc-only push bumps MINOR,
and had any moderate-level feature work landed first, these would have folded into that entry instead.

- **Roadmap filed out to v5** from Harkirat's `local/project plan notes.txt`. CLAUDE.md's "Next planned
  work" gained a **remaining v2** batch (`/settings`' missing `hidden` option, mobile description
  truncation, short-phrase loadout search, action-blocked reword + admin override, colour variety,
  humour pages, full-res download buttons, pagination loop-back), v3 additions (`/help`, a personality
  pass), and brand-new **v4** (guild install + text/prefix commands, user-submitted loadouts with a
  manual review queue) and **v5** (generate the gunsmith image/code ourselves; user-built custom
  loadouts) sections. Both changelog roadmap sections re-synced to match.
- **Flagged that v4's guild install invalidates the "user-installed only / zero standing guild
  permissions" architecture section** of CLAUDE.md — including everything downstream of it (the
  `50001 Missing Access` wall, why "Show Everyone" routes through the interaction response rather than
  a channel POST). That section must be rewritten as part of v4, not left silently contradicting reality.
- **Documented the canonical memory path.** The repo's move to `/Applications/Claude Code/Diors-Builds`
  means a session can be told its memory lives at `-Applications-Claude-Code-Diors-Builds`, which does
  not exist — the real 26-file store is at `-Applications-Diors-Builds`. Writing to the wrong one would
  silently fork memory into two half-empty stores, failing only as later "inexplicable amnesia". Noted
  at the top of CLAUDE.md and in the working agreement, since either could be read first.
- **Documented the pagination perf fix's agreed hybrid shape** — single `UPDATE_MESSAGE` for light
  string-building commands (draws/calendar/drawprices/settings), keep defer-then-patch for anything
  doing CPU or image work before replying (View Colors, attachment paths) where blowing the 3s ACK is
  a real risk. Still deferred; this just records the decision so it isn't re-derived.
- **Added `local/`** — a gitignored scratch folder for personal working files (plan notes, reference
  screenshots) — and **stopped tracking `.DS_Store`** (`git rm --cached`), which had been committed to
  the repo; the pre-existing `.gitignore` never applied to it because gitignore only affects untracked
  files.
- Created this file's **`Unreleased`** section, which the header had referenced for months without it
  ever existing.

## v2.18.0 — 2026-07-14
**Panel interaction locks, Share button rename, /timestamp text mode** (this session) — moderate
- **`/manage` locked to admin-only across EVERY interaction it spawns**, not just the initial slash
  command. Previously only the top-level `execute()` checked `ALLOWED_ADMIN_ID` — none of the ~25
  button/select/modal-submit handlers the panel generates (`mng_*`, `modal_*`, single add/edit
  loadout/draw/calendar modals) re-checked who was clicking, so anyone who could see the panel message
  (non-ephemeral run, or just present in-channel) could press its buttons and mutate bot data. Fixed
  with ONE centralized guard in `index.js`, right after the anti-spam block, checking every custom_id
  prefix `/manage` has ever generated against the newly-exported `ALLOWED_ADMIN_ID` before any routing
  happens — self-maintaining for future manage actions, scoped tightly so no other command is touched.
- **`/settings` locked to the invoking user + a 15-minute expiry**, closing a real gap (`set_page_`
  carried no `userId` check at all) and adding a mechanism that didn't exist anywhere in the bot
  before. Implemented statelessly — the deadline is encoded directly in every custom_id `settings.js`
  builds rather than tracked in a Map, avoiding both new in-memory state that resets on redeploy and
  an extra `fetchReply()` network call. Clicking around the panel never extends the clock; expired
  interactions get an ephemeral "run `/settings` again" reply instead of executing. The "View Colors"
  button ON the settings panel inherits this expiry (it's a settings component), but the standalone
  colors panel it opens keeps its own existing, separate, un-timed lock (Harkirat's explicit call,
  since that panel's code is shared with the standalone `/colors` command).
- **"Share Publicly" button renamed to "Show Everyone"** and its icon swapped from the plain 🌐 globe
  to a Harkirat-provided custom animated emoji (`emojiMap.js`'s new `share` entry), wired through the
  button's dedicated `emoji` field rather than baked into `label`.
- **New `/timestamp format` option** (Embed/Text, default Embed, slash-command-exclusive — not saved
  to `/settings`). Text mode renders the exact same content as the embed view (All Formats overview or
  any individual style) as plain message content instead of a Components V2 container, dropping the
  accent-color/divider chrome; blank lines stand in for dividers. Switching styles via the dropdown
  while in text mode correctly stays in text mode, derived from the absence of the Components V2 flag
  on the message being edited (same trick already used to preserve ephemeral state across re-renders).
- Investigated a "/draws feels slow when switching views" report — traced the full hot path for
  `/draws`' New/Returning switch and `/calendar`'s sub-page nav; found a structural defer-then-patch
  double network round-trip, not a bug. See the roadmap section above for the deferred real fix.

## v2.17.3 — 2026-07-13
**Timeline reconciliation + changelog three-part renumbering** (docs-only; this commit)
- Reconciled every stray `2026-07-14` (UTC) date reference in CLAUDE.md and memory back to
  `2026-07-13` (local, matching git author dates) so the project timeline is internally consistent.
- Renumbered the changelog catch-up below into the correct three-part `vMAJOR.MODERATE.MINOR` scheme
  (it had been logged under a wrong flat-decimal scheme), added two previously-missed pushes
  (`v2.8.0`/`v2.8.1`, DMZ range badges), and updated the header's versioning explanation.

## v2.17.2 — 2026-07-13
**Nameplate memoization + documentation** (`4674bdc`) — minor
- The resized nameplate preview is now memoized in RAM (one-time per process, zero DB storage).
- Documented the CPU pass, the preview-sizing fixes, and the multiple-bot-instance finding in CLAUDE.md.

## v2.17.1 — 2026-07-13
**View Colors preview sizing** (`b3a77b7`) — minor
- Banner preview restored to its full 512px width (it had been shrunk to 256px by the CPU change).
- The Display Name gradient banner and the nameplate preview are now both capped at 512px wide (the
  nameplate is fetched and resized in-house, since Discord's collectibles CDN ignores the size param).

## v2.17.0 — 2026-07-13
**View Colors CPU fix — bot-wide interaction timeouts** (`2b6db08`) — large bug fix
- **Fixed bot-wide "This interaction failed" (10062) errors** traced to the View Colors panel's color
  extraction blocking Node's single event loop on Render's free-tier CPU long enough that unrelated
  commands (`/manage`, `/settings`, etc.) missed Discord's 3-second acknowledgement window. Fixes, in
  order of impact: **lazy per-source extraction** (only the source on screen is extracted, not all
  four — decoration's ffmpeg step never runs unless the Deco page is opened); **removed the
  `/settings` background soft-refresh** that speculatively warmed all four sources on every open;
  k-means now yields to the event loop between iterations and stops early on convergence; solid swatch
  PNGs memoized in RAM; banner extraction downsized to 256px.
- Also root-caused erratic "different version on different clicks" behavior to **multiple bot
  instances running at once** — three stray local `node index.js` processes racing the deployed bot.
  Single-token bot; only one instance may run at a time.

## v2.16.0 — 2026-07-13
**View Colors panel + accent-color personalization** (`219b2e1`) — biggest feature since the v2.0.0
Components rewrite
- New **`/colors` command** and a **"View Colors" button in `/settings`**: browse the real colors
  extracted from your Avatar, Banner, Display Name, Nameplate, and Decoration, with tap-to-copy hex
  codes, a generated swatch per color, and dynamic *relationship* labels ("Majority Color", "Vibrant
  Accent", etc.) computed via k-means clustering rather than fixed categories.
- **"Refresh Colors"** button with honest change-detection (tells you whether your colors actually
  changed) and a 10-second cooldown.
- **Two new accent-color styles** in `/settings`: **Display Name** (Discord's real Nitro name-color
  gradient, read via a raw REST call discord.js doesn't expose) and **Dynamic Profile** (randomly
  picks from every color source you have on each new command, held stable across that message's clicks).
- Extraction is **per-source k-means** (avatar/banner return 8 colors, nameplate/decoration 4), made
  **deterministic** so "Refresh Colors" can honestly report whether anything changed; animated
  decorations (APNG) are decoded to a still frame via `ffmpeg` first, since Jimp can't read them.
- A light **600ms anti-spam cooldown** on buttons/menus to absorb rapid double-clicks.

## v2.15.0 — 2026-07-13
**Vivid accent-color extraction** (`e5359df`, `utils/colorExtract.js`) — mostly internal
- Reworked how the single accent color is pulled from an avatar/banner. The old flat/saturation-
  weighted average muddied images that mix several distinct hues (e.g. teal hair + skin tone) into an
  in-between color matching none of them.
- New approach: bucket sampled pixels into 24 hue bins, drop near-neutral ones, pick the most
  saturation-heavy bin, then average only the **top 20% most vivid** pixels in it — biasing toward the
  punchiest instance of the dominant hue.
- Chosen after a side-by-side comparison against 5 real test avatars. Every user's cached accent color
  was cleared once so it recomputes fresh (caches key on the image hash, not the algorithm version).

## v2.14.0 — 2026-07-13
**Patch notes image caching** (`9863e6a`, `utils/patchNotesCache.js`) — mostly internal
- Admin-submitted patch-notes screenshots are now re-hosted on Cloudinary (same pattern as the draw
  thumbnail cache), so a dead source link no longer leaves a broken image in `/patch notes`.
- **Season-based retention** (not time-based): an image is kept as long as its season is still
  reachable through the "previous 5 seasons" history dropdown, then pruned on the same scheduled sweep
  as the draw cache. Keyed by the patch note's own `_id` (titles get renamed; `_id` never does).
- Falls back to the raw URL on any Cloudinary hiccup, so a caching failure never blocks an admin save.

## v2.13.0 — 2026-07-13
**Loadout browse dropdown + sorting + layout fix** (`616d4c4`)
- Loadout cards (`/dmz`, `/all`, `/<category>`) gained a **"Browse other builds"** dropdown to jump
  straight to another weapon without re-running the command.
- `/all`'s weapon list is now sorted alphabetically by category then name (previously unsorted, so
  LOCUS always showed first).
- Final layout correction to `/draw prices` (nav row placement + divider spacing).

## v2.12.1 — 2026-07-12
**Critical Edit-search crash fix + post-deploy polish** (`c6c0b8f`) — minor
- **Fixed a real crash:** every single-match Edit search in `/manage` threw "Something went wrong"
  (discord.js can't open a modal in response to a modal submission) — Edit now routes through an
  intermediate button, with a "Search Again" button added.
- Calendar bulk-replace now upserts by title (matching draws); patch-notes URL modals use 5 separate
  fields; assorted `/settings` wording, slash-command description cleanup, and the `private` option
  renamed to `hidden` everywhere.

## v2.12.0 — 2026-07-12
**Slash-command wording overpass + full color repalette** (`99c37a9`)
- Standardized command/option wording across the bot.
- **Repainted every seasonal command's accent color** (Calendar / Draws / Draw Prices / Patch Notes
  / Season End / Timestamp) for a coherent cool-to-warm nav-row spread, and switched `/dmz` to the
  same per-weapon-category palette MP loadouts already use.

## v2.11.1 — 2026-07-12
**Batch refinement pass** (`02e27d5`) — minor
- Follow-up refinements across the just-redesigned `/draw prices`, `/manage`, and `/settings`
  (spacing, grouping, upsert-by-title for calendar bulk-replace, and assorted wording).

## v2.11.0 — 2026-07-12
**Draw thumbnail Cloudinary caching + `/draw prices` reformat** (`20071f2`)
- **Draw thumbnail Cloudinary caching** — externally-hosted draw images are re-hosted so `/draws`
  keeps working after the original source link expires (45-day orphan cleanup).
- Further `/draw prices` reformatting and unified seasonal-command title sizing.

## v2.10.0 — 2026-07-12
**`/draw prices` + `/manage` rebuild per mockups** (`591dcce`)
- **`/draw prices`** rebuilt: per-pull breakdowns with all totals computed from raw data (no more
  hand-typed totals drifting), paginated across 2 pages, region toggle.
- **`/manage`** admin panel overhauled: additive "Add Multiple" vs destructive "Replace/Bulk Replace"
  split, granular Purge scopes, a 2-step Confirm/Cancel on every destructive action, an **Undo**
  button, and richer confirmation messages. `/settings` groundwork toward its 2-page layout.

## v2.9.0 — 2026-07-09
**`/update` consolidated into `/manage`** (`235f145`)
- Merged the separate `/update` bulk-import command into `/manage` as a single Components-V2
  button/dropdown panel, so there's one admin command instead of two. (Later fully rebuilt in v2.10.0.)

## v2.8.1 — 2026-07-09
**DMZ badge scoping fix** (`2793be4`) — minor
- DMZ badges never use the per-category (MP) ranking system, even when no combat-range role applies —
  a `best`/`topN` admin input on a DMZ loadout is routed into `dmzRangeRank`, not `categoryRank`.

## v2.8.0 — 2026-07-09
**DMZ range-based badges** (`01d0096`)
- Added range-qualified DMZ rank badges — **Best / Top N Close Range** and **Best / Top N Mid-Long
  Range** — so a DMZ build can be flagged as best-in-role rather than only a bare Best/Top N.

## v2.7.1 — 2026-07-09
**Untrack changelog files** (`fc80d7a`) — internal only, not in the summary changelog
- `CHANGELOG.md`/`CHANGELOG-SUMMARY.md` moved to `.gitignore` and untracked from the repo
  (`git rm --cached`) — Harkirat wants them kept as a local-only personal record rather than
  pushed to the public GitHub repo. No bot behavior changed.

## v2.7.0 — 2026-07-09
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

## v2.6.0 — 2026-07-08
**Placeholder loadout seeding + changelog system**
- Seeded 7 weapons (Bal-27, FSS Hurricane, Pharo, Machine Pistol, LCAR, GS50, Crossbow) that had
  badge assignments but no loadout data, with "Coming Soon" placeholder builds (`scripts/
  createPlaceholderLoadouts.js`) — first real data in the `SECONDARIES` category at the time
  (most have since been replaced with real data — see v2.7.0).
- Added this changelog system (`CHANGELOG.md` + `CHANGELOG-SUMMARY.md` + the stylized release-log
  page).

## v2.5.1 — 2026-07-08
**"Toxic" badge + bulk badge import** (`6872a43`)
- Added a third independent loadout badge, **Toxic** (Harkirat's term for an unbalanced/cheese
  pick) — fully separate from Meta and Best/Top N, so a build can be any combination of the three
  (e.g. Striker is Meta + Best + Toxic all at once, NA-45 is Toxic-only).
- Added `scripts/applyBadgesBulk.js` — bulk-assigns badges across many weapons at once from a
  pasted list instead of editing each loadout individually via `/manage`. Applied to 28 weapons
  (52 build docs) from Harkirat's own badge list.

## v2.5.0 — 2026-07-08
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

## v2.4.0 — 2026-07-08
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
- This is the commit where the badge system introduced in v2.3.0 became a genuinely complete,
  admin-usable feature rather than a first pass.

## v2.3.1 — 2026-07-07
**Documented the badge redesign** (`475929e`) — "Introduced the loadout badges concept"
- Pure documentation commit: wrote up the v2.3.0 loadout card redesign (badges, Copy Attachments)
  in `CLAUDE.md` so the reasoning behind it wasn't lost.

## v2.3.0 — 2026-07-07
**Loadout card redesign** (`9ef686b`) — per `loadouts_ui.json` reference — "Major loadouts UI
design started"
- Weapon name promoted to the top heading; category moved from an overline down into the footer
  (`{category} • Build N of M • Last updated...`).
- Introduced the Meta/Best/Top-N "badges" line under the weapon name (the first pass — v2.4.0 is
  where this became fully flexible and admin-friendly).
- Added a **Copy Attachments** button (plain list, ephemeral) alongside the existing Copy Code.
- `Attachments`/`Gunsmith Code` became real `###` headings with backtick-wrapped attachment lines;
  divider between Gunsmith Code and the image removed so the image sits directly below the text.
- Flavor-text `description` moved below the top divider and switched from italic to a real
  blockquote (`> `), with sentence-case normalization.
- A real visual redesign of the bot's flagship card — big update.

## v2.2.1 — 2026-07-07
**Per-category accent colors + `/secondaries` readiness** (`5d8b82e`)
- MP loadout cards now use a per-weapon-category accent color (AR/SMG/LMG/MARKSMAN/SNIPER/SHOTGUN/
  SECONDARIES each get their own color) instead of one flat color.
- `/secondaries` registered as a live command ahead of any actual SECONDARIES loadouts existing.
- A visual/data tweak layered on the existing architecture, not a new system — minor.

## v2.2.0 — 2026-07-07
**Crash-resilience hardening + UX pass** (`8ca36d3`)
- Fixed a real Railway crash: `client.on('error', ...)` was missing, so a rejection from an async
  `interactionCreate` listener (discord.js's `captureRejections: true` behavior) could bypass the
  outer try/catch entirely and take the whole bot down.
- Fixed a second crash class: unawaited `return interaction.reply(...)` calls inside error-fallback
  branches don't stay "covered" by their enclosing try/catch once the promise rejects later.
- Fixed "Share Publicly" actually failing in real servers (`DiscordAPIError[50001] Missing Access`)
  by routing through the interaction-response mechanism instead of a raw bot-token channel POST.
- Header/calendar/draws UX polish pass.

## v2.1.0 — 2026-07-07
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

## v2.0.0 (Pre-release) — 2026-07-06
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

## v1.7.0 — 2026-07-04
**`/timestamp` arrives** (`cbf2106`)
- New natural-language date/timezone conversion command added, with its own parsing backend.

## v1.6.1 — 2026-05-17
**Render bind fix** (`6bab40b`)
- Bug fixes, including binding the keep-alive Express server to `0.0.0.0` (required for Render's
  health checks to actually reach it).

## v1.6.0 — 2026-05-17
**Render keep-alive workaround** (`669d68d`)
- Implemented a keep-alive ping to work around Render's free-tier spin-down behavior.

## v1.5.0 — 2026-04-08
**Loadout screenshots** (`ccbddd4`)
- Added screenshots for loadouts, and built the Cloudinary URL logic based on loadout screenshot
  filenames — the precursor to today's `imageKey`/`buildImageUrl()` system.

## v1.4.0 — 2026-04-08
**"Practical start" of the bot** (`8c082a6`) — "Final build: fuzzy search, inline fields, and
green copy button"
- Major bug fixes and refinement of the code logic.
- Added fuzzy search, inline embed fields, and a green "Copy" button.
- Marked as the bot's practical start/release in Harkirat's own notes — the point it went from
  "a script" to "a bot people could actually use."

## v1.3.0 — 2026-04-08
**Embed builder engine** (`f1cbe1f`)
- Embed design improvements.
- Built out an "Embed Builder Engine" — a reusable internal system for constructing the classic
  Discord Embeds this early version relied on (this is the direct ancestor of today's `utils/
  loadoutRender.js`, long before Components V2 existed).
- Other code refinements and bug fixes.

## v1.2.1 — 2026-04-08
**Bug fixes** (`448ae1c`)
- Bug fixes and correction of some code following the QoL pass.

## v1.2.0 — 2026-04-08
**Quality-of-life pass** (`cdfb082`)
- Added autocomplete, fuzzy matching, dynamically-derived weapon categories, and pagination.
- Added the first per-weapon-category commands.

## v1.1.0 — 2026-04-08
**Excel-backed weapon data** (`86a6845`)
- Added the main portion of guns, storing loadout data in an Excel spreadsheet — the system that
  `scripts/migrateBuildsToMongo.js` would eventually migrate off of, over a year later (v2.0.0).

## v1.0.0 — 2026-04-08
**Initial launch** (`b225785`)
- The very first version of the bot: just LOCUS, to test that the bot worked at all. No calendar,
  no draws, no patch notes yet — MP loadouts only, rendered as classic Discord Embeds (Components
  V2 didn't exist yet as a Discord feature at this point).

---

# 📋 Unreleased (committed, not yet pushed)

Staging area for work that's committed locally but hasn't gone live yet, so it has no permanent version
number. On push, graduate this content up into a real numbered entry (newest-first, at the TOP of the
list above) and reset this section to empty.

*(Nothing currently unreleased — everything committed is live on the VM.)*
