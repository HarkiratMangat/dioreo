---
kind: rule
status: live
paths:
  - "utils/adminAccess.js"
  - "utils/announcement.js"
  - "models/AdminUser.js"
  - "models/Announcement.js"
---

# Multi-admin access + the announcement system

*Loads when you touch `utils/adminAccess.js`, `utils/announcement.js`, `models/AdminUser.js`, or `models/Announcement.js`. Both shipped 2026-08-13 (PR #123), and the announcement side was rebuilt TWICE the same day — the first design is recorded below as the mistake to not repeat, not as history for its own sake. `/manage`'s "Manage Admins"/"Announcement" pages themselves are documented in `.claude/rules/manage-panel.md`; this file covers the permission/data model underneath them.*

## Admin access — per-page, not per-command

`ALLOWED_ADMIN_ID` (`commands/manage.js`) is the hardcoded owner and always has everything implicitly. Everyone else's access is a flat array of permission tokens on `AdminUser.permissions`:

- `alerts` / `autobuild` — full access to that command, no finer scope exists for either
- `manage` — full access to EVERY `/manage` page (bare "manage" is a deliberate shorthand for "all pages", not an error — Harkirat's explicit call)
- `manage.<page>` — one specific `/manage` page, `<page>` from `MANAGE_PAGE_SCOPES` (`draws`/`calendar`/`loadouts_mp`/`loadouts_dmz`/`patchnotes`/`seasondraft`/`season`/`announcement`)
- `all` — input-only convenience (Grant/Edit Permissions modal), expands to `['alerts','autobuild','manage']`

⚠️ **`manageadmins` has NO permission token at all, ever.** The allowlist page itself is owner-only visibility — Harkirat's explicit call, not an oversight — so `getManagePages()` only ever includes it for the owner, and no string an admin types can grant it. `season` is a pseudo-page (the two flat "Season: Titles & Deadlines"/"Start New Season" dropdown entries, which aren't a key in `commands/manage.js`'s `PAGES` table at all), kept distinct from `seasondraft` (the real "Next Season Draft" staging page) since editing what's live and staging what's next are different blast radii. `guide` (Bulk Format Guide) needs no permission at all — read-only reference material, available to anyone with ANY manage access.

### The four functions, and which one to use where
- `isAdmin(userId)` — "any admin access at all." Correct for coarse checks: does the Bot Admin category show up in `/help`, may this person admin-override someone else's `/settings` panel. **Wrong for gating one command's own surface** — a `/alerts`-only admin passes this.
- `hasCommandAccess(userId, commandName)` — exact match for `alerts`/`autobuild`; for `manage` means "has `manage` OR any `manage.*` token." Gates the slash command itself and the shared button/modal prefix guard in `index.js`.
- `hasManagePageAccess(userId, pageKey)` — the real per-page gate. `manageadmins` always returns owner-only.
- `getManagePages(userId)` — every page (+ `season`, + `manageadmins` for the owner) this user may reach. Drives `buildManagePage`'s dropdown filter (`commands/manage.js`) so a scoped admin is never OFFERED a page they can't open, not just blocked after clicking into it.

⚠️ **Enforcement is at PAGE-VIEW time, not click-time within an already-open page.** The `/manage` slash command, `mng_pagesel`, and the dropdown filter all correctly restrict which page a scoped admin can reach — but once a page has rendered, its individual `mng_act_{group}_{action}` buttons and page-specific modal submits (`modal_calendar_bulk_add`, etc.) are gated only by the coarse `hasCommandAccess(id,'manage')` guard, not re-checked per page. Safe today by construction (the panel never renders a page they can't reach), but it's render-time protection, not the click-time re-check every other owner-gated mutation here uses (Grant/Revoke/Edit Permissions all re-check at the point of mutation). Filed in `docs/db-deferred-list.md` → Someday, with the exact `pageKey`-threading fix if it's ever picked up. **Deliberately not built now — Harkirat's call:** "document it for a future implementation someday but not needed right now."

### The 60s cache
`getAdminPermissionsMap()` (`Map<discordId, string[]>`) is TTL-cached for 60s to avoid a Mongo round-trip on every admin-gated interaction. `invalidateAdminCache()` runs synchronously right after every grant/revoke/edit-permissions write, so the owner's own next click always sees the fresh list — the 60s window only matters for someone else's already-open session. This is a convenience allowlist under an already-hardcoded owner, not a security boundary against untrusted actors, so that window is an accepted tradeoff, not an oversight.

### Manage Admins page — rich per-admin cards
Each admin renders as a Section+thumbnail (live avatar via `client.users.fetch(discordId)`, one REST call per card — falls back to a plain Text Display if the fetch fails, e.g. a deleted account) followed by an Action Row: **Edit Permissions** (reopens the same Grant modal shape, prefilled with the current comma-joined permission list — this is the actual add/remove mechanism: edit the text, resubmit) and **Revoke** (the existing 2-step confirm flow). Grant is additive/non-destructive (no confirm); Revoke and the owner-only gate on both mutating buttons follow the same pattern as every other destructive `/manage` action.

## Announcement — a collection, not a singleton

⚠️ **The first design was a singleton (`Announcement.docType: 'global'`, one doc, `version` counter) and it silently lost data** — posting a second announcement before a user saw the first OVERWROTE it, so that user could never see the first one's content, and there was no way to delete just one. Rebuilt the same day (2026-08-13) into a real collection: one doc per announcement (`text`, `createdAt`, `createdBy`, `expiresAt`, `color`), and `UserPreference.seenAnnouncementIds` (an array of individually-seen announcement `_id`s) instead of a single version number. **If you ever see `docType`/`version` referenced anywhere for this model, it's stale** — the schema was rewritten clean, not migrated, since it had never shipped past the dev bot.

### Delivery mechanics (`utils/announcement.js`)
- `maybeSendAnnouncement(interaction)` is called from `index.js`'s STEP 6.2, AFTER a command's own reply has already gone out — on both the modular-command branch and the dynamic `/all`/`/<category>` MP-loadout fallback (which bypasses `client.commands.get()` entirely and needs its own identical call). **Wrapped in its own try/catch, separate from the command's own** — a DB failure here must never fall into the outer crash-safety catch and overwrite the command's already-successful reply with an error message.
- Every ACTIVE (`expiresAt: null` or in the future) announcement the user hasn't individually seen yet is bundled into ONE ephemeral `followUp` as SEPARATE embeds — never one message per announcement (Harkirat's explicit design: "one message but design it properly so it's easy to understand that they're different announcements"). Always `ephemeral: true` regardless of the triggering command's own visibility — announcements are a personal one-time notice, not something that should bloat a public channel.
- No embed `title` at all (removed 2026-08-13 — a generic "📢 Announcement" heading still rendered even after the custom-title INPUT FIELD was removed from the modal, because those are two different things; a custom heading can just be typed into the text as markdown). No embed `timestamp` property either (that renders as a STATIC "Today at 2:46 PM" in the footer, never live) — a real `<t:UNIX:R>` tag is appended to the description instead, matching every other timestamp in this bot.
- **Each announcement's `color` is generated ONCE at creation** (`generateAccentColor()`, constrained HSL — hue fully random, saturation 55–75%, lightness 45–60%, so it's always vibrant, never grey/muddy, never neon-blown-out) and **never regenerated on edit** — it's part of the announcement's identity, not its render. Multiple announcements bundled in one delivery are told apart by this color plus Discord's own message-level embed separation, not by a title.
- Delivery caps at Discord's 10-embeds-per-message limit (`MAX_EMBEDS_PER_MESSAGE`) — if a user somehow has more than 10 unseen at once, the OLDEST are shown first (both `active`/`unseen` sort oldest-first) and the rest wait for their next command rather than any being dropped.
- Marking-seen is all-or-nothing per delivery: if the `followUp` throws (expired interaction), NONE are marked seen, so they're retried on the user's next command instead of silently lost.

### Expiry
`computeExpiresAt(rawInput)` from the modal's "Expires In" field: blank → 60-day default, a whole number → that many days, `never`/`none` → `null` (indefinite). Returns `undefined` for anything else, which callers MUST treat as a validation error, not silently fall back to the default. `expiryToInputValue()` is the reverse, used to prefill the Edit modal so resubmitting unchanged reproduces an equivalent expiry rather than resetting it. Expired announcements simply stop being queried — filtered at query time in both delivery (`getActiveAnnouncements`) and the `/manage` list, no cleanup job exists or is needed given the tiny expected collection size.

**Editing an announcement does NOT reset who's already seen it** — a deliberate reading of Harkirat's framing ("fix a date, change the text") as a correction, not a new notice that should re-ping everyone who already read it. If that's ever wrong, the fix is clearing the relevant announcement's `_id` out of every `UserPreference.seenAnnouncementIds` on edit — not built, since it wasn't asked for.

## Two real bugs found by direct DB reproduction, not by reading code (2026-08-13)

Both produced the SAME symptom — a silent "stuck" interaction (Discord's thinking spinner never resolves) rather than a visible error — because both threw AFTER `deferReply()` had already acknowledged the interaction, with nothing local catching the exception, so it fell through to the outer crash-safety `try/catch` in `index.js` (which only logs) and nothing ever called `followUp()` to resolve the deferred reply.

1. **`manageCommand` referenced outside its declaring block scope.** The `mng_announce_edit_` button handler was a SIBLING `if`-block to the `mng_act_` block where `manageCommand` was `const`-declared — a `ReferenceError`, invisible until reproduced. Fixed by declaring it locally in the sibling handler, same as every other id-embedding handler that needs it.
2. **A stale MongoDB unique index (`docType_1`) survived the singleton→collection schema rewrite.** Mongoose doesn't drop indexes for fields removed from the schema. Every new announcement doc has no `docType` field at all, and a non-sparse unique index treats "missing key" as a real value it enforces uniqueness on — so the SECOND announcement ever created collided with the first on `docType: null` and threw. Fixed by dropping the stale index directly (`db.announcements.dropIndex('docType_1')`); no code change needed since the schema itself was already correct.

**General lesson, worth re-deriving if this recurs:** when something is reported "stuck" (not erroring, just never resolving), always reproduce directly against the dev DB / real code path first. Reading the code found neither bug; a one-line `node -e` reproduction against `.env.dev`'s Mongo found both, immediately.
