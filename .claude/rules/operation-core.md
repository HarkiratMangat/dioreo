---
kind: rule
status: live
paths:
  - "core/**"
---

# The operation core — `core/ops/*.js`, `core/changeset.js`, `core/mongo/*.js`

*Loads when you touch any file under `core/`. Every mutation across `/manage` and the web portal routes through here as a value (`{type, target, payload}`) with four verbs — `validate`/`preview`/ `apply`/`invert` — per entity. Full design: `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md`.*

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
