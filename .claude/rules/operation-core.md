---
kind: rule
status: live
paths:
  - "core/**"
---

# The operation core — `core/ops/*.js`, `core/changeset.js`, `core/mongo/*.js`

*Loads when you touch any file under `core/`. Every mutation across `/manage` and the web portal routes through here as a value (`{type, target, payload}`) with four verbs — `validate`/`preview`/ `apply`/`invert` — per entity. Full design: `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md`.*

## 🔴 An op that has no `/manage` action MUST declare `page:` — a missing one silently breaks a permission check

Added 2026-08-23 13:05 EDT (v3.66.0-pre). `core/changeset.js`'s `pageForOp()` stamps every `ChangeLog` row with a page key, and **that key is used as a permission SCOPE**: `handlers/bot.js` and `portal/api/changesets.js` both gate revert and change-detail on `hasManagePageAccess(userId, row.page)`. When an op has no registered action, `pageForOp()` used to fall back to `op.type.split('.')[0]` — the op's own namespace — which is not the same vocabulary as `utils/adminAccess.js`'s `MANAGE_PAGE_SCOPES`.

**Six ops have no action by design.** They are reachable only as another op's `invert()` target, so there is no `/manage` button for them and there must not be one — `scripts/coreOps.test.js`'s exemption list has said so for months. The namespace fallback therefore fired on all six, and produced two different failures:

- `patchnote.removeSeason` / `restoreSeason` / `editSeason` / `restore` recorded **`patchnote`** (singular), a string no scope list contains, so `hasManagePageAccess` could never match a `manage.patchnotes` grant. **A check comparing against nothing is not a stricter gate; it is an absent one** — a scoped admin was silently denied, and only the hardcoded owner got through.
- `season.restoreDraft` recorded **`season`** when it reverses a *draft* discard. That one is wrong in **both** directions: a `manage.seasondraft` admin was denied their own page, and a `manage.season`-only admin was allowed to revert draft state.

**So: `page:` sits beside `action:` on the impl, and `registerEntity()` throws at boot if an op declares both and they disagree.** Two spellings of one fact, with the registry refusing them when they contradict — the same reason `action` lives here rather than being re-declared beside `utils/manageActions.js`. ⚠️ **A normalising shim at each call site is the wrong fix** and was explicitly rejected: it recreates the two-hand-synced-copies problem this registry exists to prevent, in every consumer rather than in one place.

`scripts/coreOps.test.js` asserts `pageForOp()`'s full output over `listOpTypes()` is a subset of `MANAGE_PAGE_SCOPES`. **It failed before this change and passes after**, so it is not a vacuous pass — and it makes adding a new inverse-only op a test failure rather than a permission hole. Rows written before the fix are repaired by `scripts/fixChangeLogPageKeys.js` (the `patchnote` spelling only; `season` rows are not retro-identifiable, and that file says so rather than pretending otherwise).

## 🔴 An op's `validate()` runs on BOTH a fresh submission and its own inverse — never assume a
## field's raw, unparsed shape

Every mutating entity file (`draws.js`, `calendar.js`, `patchnotes.js`, `announcements.js`) has **two** sources for the same op type: a fresh submission from a Discord modal or the portal's compose UI (where a date/text field arrives as a raw string), and a **replayed inverse** — either `invert()`'s own output on undo, or an already-normalized payload from a bulk parse — which carries the **already-transformed value** (a real `Date` instance for a date field, a structured `parsed` array for bulk text). `validate()` is the ONE function both paths funnel through, so it must handle both shapes, not just the fresh one.

**Found and fixed 2026-08-22 15:20 EDT (v3.62.0-pre):** `core/ops/draws.js`'s `validateOne()` unconditionally called `parseAdminDate(payload.date)` — but `handlers/manage/draws.js`'s `addDraw`/`editDraw` already parse the modal's date string into a real `Date` *before* building the op payload, so `payload.date` always arrived as a `Date`, never a string. `parseAdminDate` immediately calls `.trim()` on its argument, which doesn't exist on `Date.prototype` — every single draw add/edit crashed uncaught, and since the router's crash net only logs, the interaction just hung on "thinking..." forever with nothing written. `core/ops/calendar.js` already had the right guard for this exact hazard (`isAlreadyDated`); `draws.js` never got it — it was very likely the first entity migrated onto the shared operation core, before that pattern existed anywhere to copy.

**The pattern, present everywhere else in this file family — copy it for any new date-like field:**
- `calendar.js`: `const isAlreadyDated = (payload) => payload?.date instanceof Date;`
- `patchnotes.js`: `if (payload?.releaseDate instanceof Date) return payload.releaseDate;`
- `announcements.js`: `if (startsAt && !(startsAt instanceof Date)) { /* parse */ }`
- `draws.js` (now): `if (payload?.date && !(payload.date instanceof Date) && !parseAdminDate(payload.date)) errors.push(...)`

For a **bulk** op (parses a whole textarea into an array), the equivalent guard is checking `op.payload?.parsed` first and skipping straight to normalized output if it's present — every bulk op in `draws.js`/`calendar.js`/`loadouts.js`/`season.js` already does this (`alreadyParsed(op)` in draws.js, an inline `if (op.payload?.parsed) return ...` everywhere else). **A validator that unconditionally re-parses `payload.text || ''` on an inverse would parse an empty string and silently restore nothing** — this is the same hazard class, just for structured data instead of a single typed value.

**Swept 2026-08-22 15:35 EDT:** every other date field across all six entities already has this guard. `draws.js` was the only gap. If you add a new date or structured-parse field to any entity, add the same `instanceof`/`already-parsed` check in the same change — don't rely on this file being read retroactively.
