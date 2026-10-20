---
kind: rule
status: live
paths:
  - "utils/adminAccess.js"
  - "utils/announcement.js"
  - "models/AdminUser.js"
  - "core/permissions.js"
  - "models/Announcement.js"
---

# Multi-admin access + the announcement system

*Loads when you touch `utils/adminAccess.js`, `utils/announcement.js`, `models/AdminUser.js`, or `models/Announcement.js`. Both shipped 2026-08-13 (PR #123), and the announcement side was rebuilt TWICE the same day — the first design is recorded below as the mistake to not repeat, not as history for its own sake. `/manage`'s "Manage Admins"/"Announcement" pages themselves are documented in `.claude/rules/manage-panel.md`; this file covers the permission/data model underneath them.*

## Admin access — two tiers, carried down (rebuilt 2026-10-19 19:38 EDT)

⚠️ **The flat token list is RETIRED** (`manage`, `manage.<page>`, `bot`, `autobuild`, the global `destructive` token, and the `all` shorthand that refused to expand into it). If you see those described as the live model anywhere, it is stale. Design: `docs/superpowers/specs/2026-10-19-permission-restructure-design.md`.

**Every rule is data in `core/permissions.js`, once.** Two tiers, Create and Destructive; every action needs exactly one, and edit counts as create. A grant is `{ scope, tiers }` on `AdminUser.grants`, where a scope is a command (`manage`, `autobuild`, `bot`) or a page (`manage.<page>`, `bot.<page>`). A command's tiers carry down: `/manage` → its 8 pages, `/autobuild` → MP and DMZ Loadouts, `/bot` → every /bot page and every /manage page. The owner (`utils/owner.js`) holds everything and has no row.

- **The op is the unit.** Each /manage button runs one op, so `OP_TIERS` (every op in `core/ops` → its tier) IS the button list. `scripts/permissions.test.js` fails if a registered op has no tier, and `checkOps` refuses an unclassified op for everyone but the owner. **A new op needs a line in `OP_TIERS` in the same change.**
- **`core/changeset.js`'s `commitSet` authorizes every commit**, Discord and portal alike, before validating. The checks in handlers (`resolveAction`, the confirm re-checks, `canDo`) exist to answer early with a named warning; the one in `commitSet` is the one that cannot be skipped. That is also what closed the old "modal submits are not re-checked" gap for every write through the core.
- **Writes that bypass `commitSet` are gated where they happen**, through `OUTSIDE_ACTIONS` + `canDo`: `/autobuild`'s Confirm (a direct `Loadout` save), the four admin right-clicks, Patch Notes' Past Seasons pick, and the announcement row buttons.
- **Browsing is free.** Any admin opens every /manage page; the dropdown is not filtered. A button pressed without its tier gets a warning naming the tier and page. The two Season entries (`POPUP_FIRST_ENTRIES`) are the exception, because opening one is pressing its button.
- **Loadout modes come from the build.** For `loadout.edit`/`delete`/`bulkDelete`, `core/changeset.js`'s `pagesForOp` reads each build's mode from Mongo; the op's mode is never trusted.
- **Undo/Revert = Destructive on the change's page** (`UNDO_TIER`, decided 2026-10-19 20:17 EDT: *"yeah leave it as destructive"*), and a revert is gated by that rule rather than the inverse op's own tier.

⚠️ **`/bot access` has NO scope at all, ever.** Owner-only, checked with `isOwner()` at every site (`commands/bot.js`'s `execute()`, every `bot_admin_*`/`bot_adminmodal_*` branch). No string can grant it; `scripts/botAccessPermissions.test.js` pins that. Hotpatch, Health → Restart and the portal's end-session are owner-only the same way.

### Which function to use where (`utils/adminAccess.js`)
- `isOwner(id)` — owner-only surfaces. Never a grant.
- `isAdmin(id)` — any tier anywhere. May open /manage, sees the admin /help category, may admin-override a `/settings` panel.
- `can(id, scope, tier)` — the real gate; `tier` is `'create'`, `'destructive'` or `'any'`.
- `canAction(id, page, actionId)` — a /manage registry button, by its op's tier (`resolveAction` calls it). An action that writes nothing (Export, Guide) needs only `isAdmin`.
- `canDo(id, key)` / `denyDo(key)` — an `OUTSIDE_ACTIONS` entry and its warning.
- `checkRevert(id, row)` — one revert. ⚠️ **`checkOps(id, ops)`, the gate for a whole changeset, lives in `core/changeset.js`**, not here: it needs `pageForOp`, whose require chain reaches discord.js, and this file must stay requireable without it (`scripts/ownerModule.test.js` fails otherwise).
- `hasCommandAccess(id, cmd)` — kept by name for the router, `/help` and the portal: `manage` = any admin, `bot` = any /bot page, `autobuild` = Create on /autobuild.
- `getBotPages(id)` — the /bot analytics pages offered and re-checked per click. `getManagePages`/`hasManagePageAccess` = any tier on a page; used for a change's detail panel and by the portal until its swap.

### The legacy bridge (temporary)
A row with `permissions` and no `grants` reads through `legacyToGrants()` with each token's OLD meaning (`bot` → the /bot pages only, never the new /bot scope that carries /manage). The portal still writes that shape until the pins2 hand-off (`/mnt/project-files/permission-restructure/proposals/pins2-portal-permissions.md`), and `models/AdminUser.js`'s `clearGrantsOnLegacyWrite` hook clears `grants` on such a write so it is not outranked. `scripts/purgeLegacyAdminGrants.js` (dry run unless `--apply`; prod needs Harkirat's word) removes legacy rows. The legacy block at the bottom of `adminAccess.js`, the bridge and the hook go together once both have landed.

### The 60s cache
`getAdminDocs()` (`Map<discordId, { permissions, grants }>`) is TTL-cached for 60s to avoid a Mongo round-trip on every admin-gated interaction. `invalidateAdminCache()` runs right after every grant/revoke/edit write, so the owner's own next click sees the fresh state; the 60s window only matters for someone else's already-open session. A convenience allowlist under a hardcoded owner, not a security boundary against untrusted actors.

### The admin allowlist UI — now `/bot access`, not a `/manage` page
**Moved out of `/manage` entirely 2026-08-16** (observability stage 3) — see `commands/bot.js`'s `buildAccessPanel()`/`buildAdminListBlocks()` and `handlers/bot.js`'s routing. The rendering and interaction shape is unchanged from the retired `manageadmins` page: each admin renders as a Section+thumbnail (live avatar via `client.users.fetch(discordId)`, one REST call per card — falls back to a plain Text Display if the fetch fails, e.g. a deleted account) followed by an Action Row: **Edit Permissions** (reopens the same Grant modal shape, prefilled with the current grants, one `scope: c|d|cd` per line) and **Revoke** (a 2-step confirm flow). Only the custom_id prefixes changed (`mng_admin_*`/`modal_admin_*` → `bot_admin_*`/`bot_adminmodal_*`, matching `/bot`'s single owned prefix) and the `recordChange()` page tag (`'manageadmins'` → `'access'`).

## Announcement — a collection, not a singleton

⚠️ **The first design was a singleton (`Announcement.docType: 'global'`, one doc, `version` counter) and it silently lost data** — posting a second announcement before a user saw the first OVERWROTE it, so that user could never see the first one's content, and there was no way to delete just one. Rebuilt the same day (2026-08-13) into a real collection: one doc per announcement (`text`, `createdAt`, `createdBy`, `expiresAt`, `color`), and `UserPreference.seenAnnouncementIds` (an array of individually-seen announcement `_id`s) instead of a single version number. **If you ever see `docType`/`version` referenced anywhere for this model, it's stale** — the schema was rewritten clean, not migrated, since it had never shipped past the dev bot.

### Delivery mechanics (`utils/announcement.js`)
- `maybeSendAnnouncement(interaction)` is called from `handlers/router.js`'s slash-command route engine, AFTER a command's own reply has already gone out. *(Historical: through 2026-08-15, it also had a second, identical call site in the dynamic `/all`/`/<category>` MP-loadout fallback, which bypassed `client.commands.get()` entirely -- that fallback and its duplicate call were deleted by the `/gunsmiths` consolidation, so the modular-command branch is now the ONLY choke point.)* **Wrapped in its own try/catch, separate from the command's own** — a DB failure here must never fall into the outer crash-safety catch and overwrite the command's already-successful reply with an error message.
- Every ACTIVE (`expiresAt: null` or in the future) announcement the user hasn't individually seen yet is bundled into ONE ephemeral `followUp` as SEPARATE embeds — never one message per announcement (Harkirat's explicit design: "one message but design it properly so it's easy to understand that they're different announcements"). Always `ephemeral: true` regardless of the triggering command's own visibility — announcements are a personal one-time notice, not something that should bloat a public channel.
- No embed `title` at all (removed 2026-08-13 — a generic "📢 Announcement" heading still rendered even after the custom-title INPUT FIELD was removed from the modal, because those are two different things; a custom heading can just be typed into the text as markdown). No embed `timestamp` property either (that renders as a STATIC "Today at 2:46 PM" in the footer, never live) — a real `<t:UNIX:R>` tag is appended to the description instead, matching every other timestamp in this bot.
- **Each announcement's `color` is generated ONCE at creation** (`generateAccentColor()`, constrained HSL — hue fully random, saturation 55–75%, lightness 45–60%, so it's always vibrant, never grey/muddy, never neon-blown-out) and **never regenerated on edit** — it's part of the announcement's identity, not its render. Multiple announcements bundled in one delivery are told apart by this color plus Discord's own message-level embed separation, not by a title.
- Delivery caps at Discord's 10-embeds-per-message limit (`MAX_EMBEDS_PER_MESSAGE`) — if a user somehow has more than 10 unseen at once, the OLDEST are shown first (both `active`/`unseen` sort oldest-first) and the rest wait for their next command rather than any being dropped.
- Marking-seen is all-or-nothing per delivery: if the `followUp` throws (expired interaction), NONE are marked seen, so they're retried on the user's next command instead of silently lost.

### Expiry
`computeExpiresAt(rawInput)` from the modal's "Expires In" field: blank → 60-day default, a whole number → that many days, `never`/`none` → `null` (indefinite). Returns `undefined` for anything else, which callers MUST treat as a validation error, not silently fall back to the default. `expiryToInputValue()` is the reverse, used to prefill the Edit modal so resubmitting unchanged reproduces an equivalent expiry rather than resetting it. Expired announcements simply stop being queried — filtered at query time in both delivery (`getActiveAnnouncements`) and the `/manage` list, no cleanup job exists or is needed given the tiny expected collection size.

**Editing an announcement does NOT reset who's already seen it** — a deliberate reading of Harkirat's framing ("fix a date, change the text") as a correction, not a new notice that should re-ping everyone who already read it. If that's ever wrong, the fix is clearing the relevant announcement's `_id` out of every `UserPreference.seenAnnouncementIds` on edit — not built, since it wasn't asked for.

## Two real bugs found by direct DB reproduction, not by reading code (2026-08-13)

Both produced the SAME symptom — a silent "stuck" interaction (Discord's thinking spinner never resolves) rather than a visible error — because both threw AFTER `deferReply()` had already acknowledged the interaction, with nothing local catching the exception, so it fell through to the outer crash-safety `try/catch` in `handlers/router.js` (which only logs) and nothing ever called `followUp()` to resolve the deferred reply.

1. **`manageCommand` referenced outside its declaring block scope.** The `mng_announce_edit_` button handler was a SIBLING `if`-block to the `mng_act_` block where `manageCommand` was `const`-declared — a `ReferenceError`, invisible until reproduced. Fixed by declaring it locally in the sibling handler, same as every other id-embedding handler that needs it.
2. **A stale MongoDB unique index (`docType_1`) survived the singleton→collection schema rewrite.** Mongoose doesn't drop indexes for fields removed from the schema. Every new announcement doc has no `docType` field at all, and a non-sparse unique index treats "missing key" as a real value it enforces uniqueness on — so the SECOND announcement ever created collided with the first on `docType: null` and threw. Fixed by dropping the stale index directly (`db.announcements.dropIndex('docType_1')`); no code change needed since the schema itself was already correct.

**General lesson, worth re-deriving if this recurs:** when something is reported "stuck" (not erroring, just never resolving), always reproduce directly against the dev DB / real code path first. Reading the code found neither bug; a one-line `node -e` reproduction against `.env.dev`'s Mongo found both, immediately.
