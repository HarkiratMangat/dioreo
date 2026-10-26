---
kind: spec
status: frozen
---

# `/manage` slash-action decomposition — design

**Date:** 2026-08-14 12:05 EDT · **Branch line:** `v3-pre-release` (at `e3d1a88`, v3.17.0-pre) · **Author:** Harkirat + Claude (Opus 5)

## Context

`/manage` is the bot's admin dashboard. Today it takes one meaningful option, `data_for`, which picks a *page* (Draws, Calendar, MP/DMZ Loadouts, Patch Notes, Season Draft, Manage Admins, Announcement), renders that page as a Components V2 container, and everything after that is clicking buttons. Reaching "add a new draw" is three interactions: run the command, read the page, click the button.

Harkirat asked for a direct path: `/manage data_for:draws action:add-new` should open the Add Draw modal immediately, with the `action` choices scoped to the page you picked rather than being one flat list of every action in the bot. Bundled with that, a DB-change audit log — who changed what, and when.

The reason this needs a design rather than an afternoon is that the action list does not currently exist as data anywhere. It is implied in two independent places: the button definitions inside `buildPagesTable()` (`commands/manage.js:74-367`) and a 220-line `if/else` sub-dispatcher inside `routeManage()` (`handlers/manage.js:438-659`). Adding a slash option that names actions would make a **third** copy, in a file that is already 2,608 lines with a single 2,311-line function in it. That is the "sloppy addition" this design exists to avoid.

Three constraints inherited from the 2026-08-14 session that shipped v3.17.0-pre are treated as requirements here, not background:

1. Those ~25 confirm/cancel/undo prompts use raw `interaction.update()` with a legacy `{content, components}` shape that never passes through `sendV2Payload`, so they get no passive idle-expiry instrumentation.
2. Because of (1), `handlers/router.js:165-182` cancels — never reschedules — any pending expiry timer before dispatching into `/manage`, as a documented safety net against a stale timer overwriting a confirm prompt.
3. Per-page admin permissions exist (`utils/adminAccess.js`, `manage.<page>` tokens) but are enforced at page-*view* time, not per button click inside an already-open page. Known and accepted, filed 2026-08-13.

## Decisions

| Question | Decision |
|---|---|
| Decomposition scope | **Action registry + per-page handler split.** Build one registry that the panel buttons, the slash option and the permission check all read from, then move `routeManage`'s branches into per-page modules behind it. |
| Scoping the `action` option | **Autocomplete**, reading `data_for`'s value to offer only that page's actions. Discord cannot scope static choices by another option's value. |
| Which actions are slash-reachable | **Modals and exports only.** Purge, season wipe, promote-draft and discard-draft stay panel-only, so a destructive action always requires deliberately navigating to it first. |
| Audit log | **All writes**, read back through a **separate `/audit` command** mirroring `/alerts`, rather than a new `/manage` page. |
| Option naming | **`data_for` stays.** The handoff sketch called it `command:`, but three of the eight pages (Season Draft, Manage Admins, Announcement) manage no user-facing command, so `command:` would be inaccurate for them, and renaming a live option costs muscle memory for no gain. |

### Historical note worth not re-deriving

`/manage` previously had slash autocomplete and a subcommand-group structure. It was deleted on 2026-07-09 (`handlers/router.js:229-234`) when the button+modal panel replaced it. That removal was about **item search** — picking *which* draw to edit, which the panel's search modal now handles — not about action naming. Re-adding autocomplete for a fixed action vocabulary does not reverse that decision, and the panel stays the primary surface. The slash options are a shortcut for someone who already knows what they want.

## Architecture

### 1. The action registry — `utils/manageActions.js`

One exported table, the single source of truth for what actions exist. Every entry:

```js
{
  id:    'addnew',              // unique within its page
  page:  'draws',               // owning page key -> the permission scope it checks
  label: 'Add New Draw',        // panel button label AND autocomplete choice name
  emoji, style,                 // panel presentation only
  kind:  'modal',               // 'modal' | 'file' | 'confirm' | 'view'
  slash: true,                  // exposed on the `action` option?
  run:   async (ctx) => { ... } // ctx = { interaction, page, mode, manageCommand }
}
```

`kind` is not decoration — it is load-bearing for a real Discord constraint. `showModal()` must be the *first* response to an interaction and cannot follow `deferReply()`; `commands/manage.js:1203` already special-cases `season_titlesdeadlines` for exactly this reason. Making the response mode explicit per entry means `execute()` can decide whether it may defer *before* it does, instead of every new action re-discovering the rule. `kind: 'confirm'` entries always carry `slash: false`, which is how the "no destructive shortcuts" decision is enforced structurally rather than by remembering it.

`resolveAction(page, actionId, userId)` is the one choke point: it looks the entry up and checks `getManagePages(userId).includes(entry.page)`. Because the panel's `mng_act_` dispatch routes through the same call, **this closes constraint 3** — per-button permission enforcement stops being a separate feature and becomes a property of having one resolver.

`commands/manage.js`'s `buildPagesTable()` stops hardcoding button rows and derives them from the registry, so a button and its handler can no longer drift apart.

### 2. Slash surface — `commands/manage.js`

`action` is added as an optional string option with `setAutocomplete(true)`. A `/manage` autocomplete route returns to `handlers/router.js`'s `isAutocomplete()` block, reading `interaction.options.getString('data_for')` to filter the registry to that page's `slash: true` entries, fuzzy-matched with the existing `fuzzyMatch` helper from `utils/search.js` (the same one every other autocomplete route in the bot uses). If `data_for` is empty, it offers nothing and the description tells the user to pick a page first.

`execute()` gains one branch before the existing deferral: if `action` is present, `resolveAction()` it, and on success dispatch by `kind` — `'modal'` returns `run()` directly with no defer, `'file'` and `'view'` defer first. An unresolvable or unpermitted action falls back to rendering the page normally with a short note, rather than erroring out; a typo shouldn't cost the whole invocation.

The 25-item autocomplete response cap is not a risk here — the largest page has roughly a dozen actions — but the registry test asserts it per page so a future page cannot silently exceed it, the same defensive posture as `SELECT_OPTION_CAP` in `commands/admin.js:25`.

### 3. Handler decomposition — `handlers/manage.js` → `handlers/manage/`

`require('./manage')` resolves `./manage.js` first and `./manage/index.js` second, so deleting the file and creating the directory keeps `handlers/router.js:35` unchanged.

| New file | Holds |
|---|---|
| `handlers/manage/index.js` | `OWNED_PREFIXES`, `ownsCustomId`, `handleManageInteraction`, and a thin `routeManage` that type-tests and delegates. Under ~200 lines. |
| `handlers/manage/shared.js` | `parseMngId`, `registerUndo`, `undoButtonRow`, the four pending-token Maps, and the new `prompt()` helper below. |
| `handlers/manage/{draws,calendar,loadouts,patchnotes,season,admins,announcements}.js` | One page's button branches, modal-submit branches, and its DB operations. |

The ~45 scattered write sites collapse into roughly 20 named operation functions, one per page module — the natural place to call the audit recorder exactly once per change.

`shared.js`'s `prompt(interaction, { text, components })` replaces all 25 raw `interaction.update()` calls with one V2 render through `sendV2Payload`, which already performs a single-hop `type: 7` update when the interaction is neither deferred nor replied. That means these prompts start getting passive idle-expiry instrumentation for free, **which retires constraint 2**: `handlers/router.js:165-182`'s cancel-never-reschedule block can be deleted, and its comment plus `utils/sendV2Payload.js`'s header note updated to record that the gap closed rather than leaving a warning about a problem that no longer exists.

### 4. Audit log — `models/ChangeLog.js`, `utils/changeStore.js`, `/audit`

Modelled directly on the `AlertLog` / `utils/alertStore.js` / `/alerts` trio, because that pattern is already proven in this repo and read-back pagination, export and retention are solved there.

- **`models/ChangeLog.js`** — `changeId` (human `MmmDD-NN`, allocated race-free through the existing `AlertCounter` `$inc` upsert under a namespaced key), `actorId`, `page`, `action`, `model`, `target` (human label of the thing changed), `summary`, `detail`, `undone` (Boolean, flipped when an Undo consumes the change), `createdAt` (indexed). Explicit `createdAt` only, no `updatedAt`, matching `AlertLog`.
- **`utils/changeStore.js`** — `recordChange()` fire-and-forget and never-throwing, so a logging failure can never break an admin action; `pruneChanges()` at 180 days or 5,000 rows, whichever bites first, throttled hourly; `getRecentChanges({page, perPage, filter})`; `buildChangeExport()`.
- **`commands/audit.js` + `handlers/audit.js`** — the `/alerts` shape: summary tiles, paginated list with the page encoded statelessly in the customId, export to a `.txt` attachment, filter by page and by actor. `setIntegrationTypes([1])`, added to `ADMIN_COMMAND_NAMES` in `bot/registry.js:130` so `/admin` cannot gate it, and given its own `'audit'` token in `utils/adminAccess.js`'s `ADMIN_COMMANDS`.

> 🔴 **`ChangeLog` stores `actorId`, a per-user Discord ID, so `docs/legal/PRIVACY.md` must be updated in the same change.** `npm run docs:audit`'s `privacy-model-coverage` check exists precisely to catch a new model gaining a per-user field, and it will fail otherwise. Because a legal source changes, this stage also needs `dior legal build` and a `public/` commit — unlike a changelog-only change, which never does.

## Error handling

Each page module keeps the contract the split established: no local try/catch net, no listeners, the crash net stays in `handlers/router.js`. Every error reply is an awaited call inside its own small try/catch, as `handlers/colors.js:1-23` documents. `recordChange()` swallows its own failures by construction. `resolveAction()` returns a discriminated result rather than throwing, so both the panel and the slash path handle "no such action" and "not permitted" the same way.

## Testing

- **`scripts/manageActions.test.js`** (new) — conservation in both directions: every panel button id has a registry entry and every registry entry appears on its page; every `page` is a real scope in `MANAGE_PAGE_SCOPES ∪ {manageadmins, guide}`; no `kind: 'confirm'` entry is `slash: true`; per-page slash-action count ≤ 25.
- **`scripts/handlerRouting.test.js`** — update its `handlers/*.js` glob for the new directory, keeping the no-overlapping-prefixes assertion intact.
- **`scripts/changeStore.test.js`** (new) — `recordChange()` resolves rather than throwing when the write fails; retention prunes by both age and cap.
- Existing `npm test`, `npm run docs:audit`, and the 26 hook self-tests must stay green at every stage.
- **Live click-test on the dev bot** (`node --watch --env-file=.env.dev index.js`) after each stage — every page's buttons, one modal per page, one confirm/cancel, one undo, and both slash paths.

## Staging

Four PRs into `v3-pre-release`, each a MODERATE bump (minor bumps are suspended for the pre-release line):

1. **`refactor(manage): extract the action registry`** → v3.18.0-pre. Registry + panel buttons + `mng_act_` dispatch routed through it. No user-visible change. Closes constraint 3.
2. **`refactor(manage): split routeManage into per-page modules`** → v3.19.0-pre. Mechanical move plus the shared `prompt()` helper. Retires constraint 2 and its router block.
3. **`feat(manage): scoped action option`** → v3.20.0-pre. The slash surface and autocomplete route.
4. **`feat(audit): DB change log and /audit`** → v3.21.0-pre. Model, store, command, handler, PRIVACY.md, site rebuild.

Stages 1 and 2 are pure refactors and are the ones that must be click-tested hardest, because they can regress a working panel with no visible diff in behaviour — exactly the failure mode that dropped `/settings` pagination during the `index.js` split, where the moved code was byte-identical.

## Out of scope

Renaming `data_for`. Touching the `/manage` search-modal flow. The four in-memory pending Maps staying in-process and not surviving a restart — real, unchanged by this work, and not worth a persistence layer for a 10-minute TTL. Making Undo itself auditable beyond the `undone` flag.
