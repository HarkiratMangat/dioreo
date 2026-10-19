---
kind: spec
status: frozen
---

# The permission restructure — two tiers, carried down

*Written 2026-10-19 19:35 EDT. Frozen: this is a snapshot of what was decided and why, not a live document. It supersedes §5 ("The permission model — PENDING DESIGN") of `docs/pins2/spec/2026-09-13-portal-pins-batch-2-design.md`, which stays as it is: that file belongs to the portal workstream and is a dated snapshot too.*

Decided with Harkirat in a cloud design session that ran 2026-10-19 17:58 EDT → 19:11 EDT. The button list was approved at 19:11 EDT (*"yeah these look better"*), with Undo and Revert left provisional. The bot side was built the same evening; the portal side is a hand-off to the portal workstream (§7).

## 1 · The model

| Rule | Decided |
|---|---|
| Tiers | Two: **Create** and **Destructive**. Every action needs exactly one. Editing counts as create (his answer 19:06 EDT: *"yeah edit = creative"*). The old `modify` tier and linked tiers were dropped at 19:05 EDT. |
| Grants | A grant names a scope (a command or a page) and the tiers held there. Only the owner grants or revokes. |
| Carry-down | `/manage` → all 8 /manage pages · `/autobuild` → MP and DMZ Loadouts · `/bot` → every /bot page and every /manage page. A command's tiers carry down; a page grant adds more on top. Kept from September (18:05 EDT, *"Yes"*). |
| The `destructive` token | Retired. Destructiveness is a tier on each scope, not one global switch. |
| Browsing | Any admin can open every /manage button page, Next Season Draft included. Pressing a button without its tier gives the "no permission" warning, naming the tier and page. Nothing is hidden or greyed out (his revision, 18:17 EDT). |
| Pop-up-first entries | Season: Titles & Deadlines needs Create on Season and Start New Season needs Destructive on Season, because opening one is pressing its button (18:18 EDT). |
| /bot pages | Health, Alerts, Changes, Usage and Timing open with any tier on that page. Changes → Edit needs Create on the change's own page; Changes → Revert needs Destructive there (provisional). |
| Right-clicks | Add to Draws, Add to Calendar and Add to Patch Notes need Create on their page. Autobuild Loadout needs Create on /autobuild. |
| Owner only, outside the tiers | `/bot access`, hotpatch, Health → Restart, and the portal's end-session. |
| Portal | The same per-action rules apply, because the portal commits the same ops. Every admin may view the Access page read-only, and a view-only level exists for the portal realms. Both are the portal's to draw. |
| Migration | Purge the existing grants (his September answer; only his alt holds one). Not re-asked. |

⏳ **Undo and Revert = Destructive is provisional** (18:33 EDT: *"That one we'll get back to"*). It is one constant, `UNDO_TIER` in `core/permissions.js`, so revisiting it is a one-line change.

The full approved button list is `/mnt/project-files/permission-restructure/permissions-review.md` in the project files; §3 below is where it now lives in code.

## 2 · One declared table

Every rule above is data in **`core/permissions.js`**: the tiers, the scopes, what each command carries, the tier of every op in `core/ops`, the actions that write outside the /manage registry, the two pop-up-first Season entries, and the owner-only list. It requires nothing at load time, so the portal can read it without a database, and `describe()` returns the whole table as plain JSON for the portal's Access grid.

This closes the September conferral item's core complaint: the bot and the portal each derived inheritance their own way (the portal with an `includes('manage')` literal). Both now have one table to read.

## 3 · Why the op is the unit

Each /manage button runs exactly one op, so **the button's tier is its op's tier**, and `OP_TIERS` is the whole button list. Two consequences made this the right unit rather than a table of button ids:

- `core/changeset.js`'s `commitSet` is the one place every Discord and portal mutation passes through. It now authorizes every commit (`checkOps` in `utils/adminAccess.js`) before validating or applying anything. A handler that forgot its own check, a modal submitted after a grant was narrowed, or a portal route that only knew pages, still cannot write past a missing tier. This also closes the deferred list's P3 "modal submits are not re-checked" item for every write that goes through the core.
- An op with no entry in `OP_TIERS` is refused for everyone but the owner, and `scripts/permissions.test.js` fails if a registered op has no tier or a tier names a retired op. A new op cannot silently ship ungated.

Two kinds of write do not go through `commitSet` and are gated where they happen: `/autobuild`'s Confirm (a direct `Loadout` save) and the announcement row buttons. Those are `OUTSIDE_ACTIONS`.

A revert is gated by the Undo rule on the reverted row's page, not by the inverse op's own tier: the inverse of a delete is an add, and someone allowed to undo a delete must not be refused because the undo happens to be an add.

### Loadout modes come from the build

MP and DMZ share one op set, and `loadout.delete { target: { id } }` names a build by id only. `pageForOp` falls back to MP for those, which would have refused a DMZ-only admin their own delete and let an MP-only admin through on a DMZ build. The gate reads each named build's mode from the database instead (`pagesForOp` in `utils/adminAccess.js`), never trusting a mode the client sends. An edit that moves a build to the other mode needs the tier on both pages. The Discord delete now also sends the mode, so its ChangeLog row is stamped with the right page.

## 4 · The grant on Discord

A Discord modal has no checkboxes, so `/bot access`'s Grant and Edit Permissions boxes take one `scope: tiers` per line, where tiers is `c`, `d` or `cd`:

```
manage: c
manage.calendar: d
bot.health: c
```

One bad line rejects the whole submission with a message saying what was wrong. The retired `all` shorthand is not accepted. The admin cards list every grant by name, Destructive included, because a summary that hides a scope is how the old formatter once hid the `destructive` token.

## 5 · The legacy bridge and the purge

Rows written before this model carry `permissions: [...]` and no `grants`. Until the purge has run and the portal writes `grants`, `legacyToGrants()` reads each old token in its **old** meaning, because that is what the person who granted it was looking at:

- `manage` / `manage.<page>` → Create there, plus Destructive when the old `destructive` token is present.
- `bot` → each /bot page, **not** the new /bot scope. The new /bot carries every /manage page; mapping the old analytics-only token to it would have handed a read-only admin write access everywhere.
- `autobuild` → Create on /autobuild. ⚠️ **One accepted widening:** the new /autobuild carries Create to the two Loadouts pages and a grant cannot opt out of carry-down, so an old autobuild-only admin can also add and edit builds on /manage's Loadouts pages until the purge. Only his alt holds a grant today, so this reaches nobody in practice.

`scripts/purgeLegacyAdminGrants.js` removes every row with no `grants`. It is a dry run unless given `--apply`. **Running it against prod waits for his word.**

## 6 · What the bot side changed

- `core/permissions.js` (new) — the table.
- `utils/adminAccess.js` — `can`, `canAction`, `canDo`, `checkOps`, `checkRevert`, `effectiveTiers`, `getBotPages`; the 60-second cache now holds `grants`. `hasCommandAccess` keeps its name for its callers: `manage` = any admin, `bot` = any /bot page, `autobuild` = Create on /autobuild. A legacy block (`ADMIN_COMMANDS`, `NOT_IN_ALL`, `parsePermissionsInput`, `getAdminPermissionsMap`, and the `destructive` case of `hasCommandAccess`) stays only for the portal until its swap, and nothing in the bot uses it.
- `models/AdminUser.js` — `grants: [{ scope, tiers }]`; `permissions` is no longer required.
- `core/changeset.js` + `core/revert.js` — every commit authorized; reverts by the Undo rule.
- /manage — buttons via `resolveAction` (the tier, named in the warning); the dropdown offers every page; the two Season entries gated; purge and delete confirms re-check Destructive; Past Seasons and the announcement row buttons through `canDo`.
- /bot — each analytics page re-checked on every click and only held pages offered; Revert via `checkRevert`; the grant boxes as in §4.
- The four admin right-clicks and /autobuild's Confirm through `canDo`.

## 7 · The portal hand-off

The portal is the portal workstream's (`portal/**`, pins2) and was not edited. What it must change is written as a proposal in the project files, `permission-restructure/proposals/pins2-portal-permissions.md`. In short: the Access realm reads `describe()` and writes `grants`; `assertOpsAccess` and the revert route call `checkOps`/`checkRevert`; the realm rail reads tiers instead of `getManagePages`; `canDestroy` is replaced by per-action tiers; and the legacy block in `utils/adminAccess.js` is deleted with the bridge once that has merged and the purge has run. The view-only realm level stays the portal's own.

Until then the portal keeps working: it still writes the old token list, the bridge reads it, and `commitSet` enforces the tiers on whatever it commits.

## 8 · Checked and left alone

- **The Privacy Policy.** §2.1b already says the admin allowlist stores "which specific admin pages/commands they can use"; `grants` is a new shape for the same fact, so no change was needed. The `privacy-model-coverage` audit already covers `AdminUser`.
- **The op `tier` 1/2/3** on `core/ops` (reversibility, which drives the portal's export interlock) is a different thing from the permission tiers and is unchanged.
- **Public Bot on Dioreo Admin** is still off. Until it is turned on, the Discord rules apply to nobody but the owner (his answer 18:24 EDT: *"I'll turn it on later, but it's not a priority"*).
