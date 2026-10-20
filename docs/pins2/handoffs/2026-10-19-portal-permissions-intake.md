---
kind: record
status: live
---

# Intake: the portal half of the permission restructure (Session 5)

Recorded 2026-10-19 20:21 EDT by Session 4's lead. Harkirat forwarded this hand-off from a peer project's coordinator on 2026-10-19 20:15 EDT; on the project coordinator's card "Where should the portal Access permissions work go?" he chose "Session 5 plan" (his tap, as the coordinator relayed it at 2026-10-20 00:17 UTC). It is order item 7 of the plan's §5d. The two points it calls portal decisions (realm visibility, the view-only level) are his to answer before they are built.

Checked against `origin/v3-pre-release` at `3289a09f` on 2026-10-19 20:21 EDT: every `core/permissions.js` export named below exists; the spec has § 7 · The portal hand-off; `checkOps`, `checkRevert`, `effectiveTiers` and `getBotPages` are in `core/changeset.js` and `utils/adminAccess.js`; the deferred list's `[P1]` "WHICH COMMANDS CONFER WHICH `/manage` PAGES" is there; CHANGELOG carries Pre-Release v3.97.0 (#206). Not checked: each per-file instruction against the portal's current code (Session 5 reads `core/permissions.js` first).

## His forwarding message, verbatim (2026-10-19 20:15 EDT)

> The bot side of the admin permission restructure is merged into v3-pre-release as PR #206 (Pre-Release v3.97.0) in HarkiratMangat/dioreo. Permissions are now two tiers per command/page, create and destructive, with a command's tier carrying down to its pages. Only Harkirat grants or revokes. Every admin can view the portal Access page read-only. The bot holds one shared permissions table and a gate the portal can call unchanged, and every portal write is already tier-checked.
>
> Portal work for pins2: link the portal's Access realm to those bot permissions (read and edit the new grants, show create/destructive per command and page, read-only for non-owners). The full hand-off is in the attached pins2-portal-permissions.md. Pull v3-pre-release first. Old-style grants still read correctly, so nothing is broken in the meantime.

## The hand-off, verbatim (`pins2-portal-permissions.md`)

### Proposal for pins2: link the portal to the bot's permission table

From the permission-restructure build thread, 2026-10-19 19:37 EDT. Bot side built on claude/permissions-bot-side-5t4xv9 (PR into v3-pre-release). Nothing under portal/** or docs/pins2/** was edited.

Read first: core/permissions.js (the table) and docs/superpowers/specs/2026-10-19-permission-restructure-design.md (the model; §7 is this hand-off).

#### What already works

- Every portal commit goes through core/changeset.js commitSet, which now runs checkOps itself. A user without the tier gets { ok: false, denied, error } from the commit route (409), with error written for a person. The portal is already enforced; what's missing is the portal knowing the rules before the commit.
- The Access realm still writes the old permissions token list. legacyToGrants() in core/permissions.js reads it with each token's old meaning, and a model hook (models/AdminUser.js, clearGrantsOnLegacyWrite) clears grants when the portal writes permissions.

#### Changes, file by file

1. portal/api/access.js: replace the ADMIN_COMMANDS / MANAGE_PAGE_SCOPES / NOT_IN_ALL imports with const P = require('../../core/permissions') and build the grid from P.describe(). scopes (key, label, kind, carries) are rows or columns; tiers (Create, Destructive) are two marks per cell. Each cell shows per tier whether it's held directly (P.grantsOf(admin)) or carried (P.expandGrants(P.grantsOf(admin)) gives effective tiers). Delete the perms.includes('manage') inheritance literal; /autobuild and /bot now carry too, and carries says where. POST /api/access/grant takes grants: [{ scope, tiers }], validated with P.isScope/P.isTier (or a round trip through P.parseGrantsInput(P.grantsToInput(grants))), and writes { grants, permissions: [] }. Stop calling parsePermissionsInput. CSV exports: admins lists P.formatGrants(P.grantsOf(a)); matrix uses the grid's expansion. ownerOnly on a scope no longer exists; owner-only actions are P.OWNER_ONLY, none of them a grid row. Every admin may open Access read-only, and only the owner gets enabled controls (Harkirat's decision). GET routes use requireAdmin without ownerOnly; mutating routes keep ownerOnly.
2. portal/api/changesets.js: assertOpsAccess(discordId, ops) becomes core/changeset.js checkOps(discordId, ops). Same { ok, reason } shape, plus denied[] naming each op, scope and tier needed. Use it at stage, preview and commit. POST /api/revert/:changeId replaces hasManagePageAccess with utils/adminAccess.js checkRevert(discordId, row) (Destructive on the change's page, provisional). WARNING, loadout ops: send target.mode (MP/DMZ) on loadout.delete/edit when known. The gate reads the mode from the DB, but the ChangeLog row's page is stamped from the op, so without it a DMZ delete is recorded as MP.
3. portal/auth.js: delete canDestroy = owner || hasCommandAccess(id, 'destructive'). The destructive case of hasCommandAccess exists only for this and goes with the legacy block. Return effective tiers instead, e.g. tiers: Object.fromEntries([...(await effectiveTiers(id))].map(([s, t]) => [s, [...t]])), plus P.describe().opTiers. An op needs opTiers[type] on its page's scope. Disable (or warn on) controls lacking the tier, matching Discord's "warn on press".
4. portal/api/realmAccess.js: grantedPagesFor / visibleRealms use getManagePages, which now means "pages with any tier". Keeping that (realm shows only to holders) or opening every page realm to every admin (Discord's "browse freely") is a portal decision, decided together with the view-only level. realmForScope gains the bot.<page> scopes (→ analytics). hasCommandAccess(id, 'bot') now means "any /bot page"; use getBotPages(id) if Analytics should show only held pages.
5. View-only realm level: his decision that it exists for portal realms. It is NOT in core/permissions.js (Discord has no such level). Model it portal-side (e.g. a portal-only view grant, or "admin with no tier on this realm's pages"); don't add it to TIERS.
6. After it merges: delete the legacy block in utils/adminAccess.js (ADMIN_COMMANDS, NOT_IN_ALL, getAdminPermissionsMap, parsePermissionsInput, the destructive case of hasCommandAccess), legacyToGrants in core/permissions.js, and the clearGrantsOnLegacyWrite hook. Only after the prod purge (scripts/purgeLegacyAdminGrants.js --apply, needs his word). Tests to update: scripts/portalRealms.test.js, scripts/portalPayloadShape.test.js, scripts/portalSession.test.js.

#### Done means

portal/api/access.js no longer contains includes('manage') or imports NOT_IN_ALL; the grid draws Create and Destructive per row from describe(); a portal grant writes grants; and the deferred list's P1 item "WHICH COMMANDS CONFER WHICH /manage PAGES" passes its Verify line.
