---
kind: plan
status: frozen
---

# Implementation plan — `/draw calculator` saved baskets and per-banner planning

*Written 2026-08-27 10:16 EDT, **rewritten 2026-08-27 11:03 EDT** against revision 3 of the design (the flat banner list + basket store). Design: `docs/superpowers/specs/2026-08-27-draw-calculator-multi-draw-design.md` — **read it in full first**; this plan carries tasks, not reasoning. Branch `claude/draw-calculator-breakdown-146641`.*

## Before you start

1. **Read the spec.** Every 🔴 marks something that fails **silently** if you get it wrong.
2. **`.claude/rules/draw-prices.md`** loads automatically with `commands/drawCalculator.js` and carries five previous redesigns of this panel.
3. **The dev bot is the feedback loop** — `node --watch --env-file=.env.dev index.js` from this worktree (`.env.dev` already copied in). Click it as you build. This panel has shipped visibly broken twice under a fully green suite.
4. **Gates:** `npm test` and `node scripts/docs-audit.mjs` both exit 0. Read the **exit code**, never a trailing summary. `git add` new docs before running gates — untracked files are invisible to both.

## What is already done — do not redo

| Area | State |
|---|---|
| `utils/cpPackages.js` | Bulk peeling, per-currency best-rate package, honesty guard, scaling `naiveCover`. A **live silent-wrong-answer bug is fixed** here (negative Left Over above 64,801 CP). Pinned to 689,900 CP. **No optimizer work remains.** |
| COST BREAKDOWN grammar | Matches Harkirat's exported mockup byte-for-byte. `smallDot` bullets, `blueDash` separators, code-spans, `-#` sub-lines. Do not restyle |
| `utils/globalNav.js` | Gained `overrides`; `/draw prices` uses it. 🔴 **Do not delete it** when the calculator stops calling `buildGlobalNavRow` |
| `utils/emojiMap.js` | `smallDot`, `blueDash`, `simplify`, `expand` |

## Tasks

Order matters — 1–4 are pure logic, independently testable with no UI, and could merge as their own PR to de-risk the rest.

### Task 1 — `models/DrawBasket.js` + privacy disclosure

**Files:** `models/DrawBasket.js` (new), `docs/legal/PRIVACY.md`, `.claude/rules/models.md`

Owner id, optional `name`, ordered `banners: [{ drawKey, pullsDone }]`, `region`, `balance`, `includeUpgrades`, `entitlementMask`, timestamps. **`drawKey` STRINGS, never indices** — positional indices silently re-point a stored basket at different draws if `DRAW_DATA` changes.

- ⚠️ **Mongoose only persists DECLARED fields.** Every field in the schema, same change.
- **TTL: 30 days, UNNAMED baskets only**, scoped with a `partialFilterExpression` so a named basket is never collected — copy the pattern and the reasoning from `models/Changeset.js`. Set the value explicitly at the call site rather than as a schema default (`Announcement`'s habit).
- **`entitlementMask`** is the existing 6-bit mask over `CP_PACKAGES` (`cp80`…`cp8000`), snapshotted onto the basket.
- 🔴 **`PRIVACY.md` §2 + Appendix A in this same task.** `docs-audit`'s `privacy-model-coverage` fails the build otherwise — correctly.

**Verify:** `docs:audit` passes; a field added without disclosure makes it fail (prove the gate bites).

### Task 2 — Basket store operations

**Files:** `utils/drawBasketStore.js` (new), `scripts/drawBasketStore.test.js` (new)

`load` · `save` · `listForUser` · `rename` · `remove`. 🔴 **Every read must handle "not found"** — the basket can be deleted, expire, or be missing after a restore. The old stateless panel made that structurally impossible; it is now a real path.

**Verify:** stubs via `require.cache` (no Mongo needed, same technique as `scripts/eventStore.test.js`); missing basket returns a typed absence, never a throw.

### Task 3 — State codec

**Files:** `commands/drawCalculator.js`, `scripts/drawCalcBudget.test.js`

`calc~<verb>~<basketId>~g<page>~x<detail>~f<focus>~a<authorId base36>` — field meanings in spec §5. The basket is NOT in the `custom_id` any more, and **neither is `balance`**: it lives on the basket document and is read at render time.

**Verify:** round-trip; ≤100 chars; a legacy `calc~` id from an old panel degrades to a safe state rather than mis-decoding.

### Task 4 — Cost model over a flat banner list

**Files:** `utils/drawCost.js`, `scripts/drawCalcBudget.test.js`

`basketCost(region, banners, includeUpgrades)` → `{ total, perBanner: [{ drawKey, pullsDone, cost, priced }] }`. Upgrade added **per banner**. Unpriced draw ⇒ `priced: false`, contributes 0, reported so the renderer can name it.

**Verify:** 3 banners at 7/3/0 costs strictly less than 3 fresh and strictly more than 1 fresh; 3 mythic banners carry exactly 3 upgrades.

### Task 5 — Landing page + saved baskets

**Files:** `commands/drawCalculator.js`, `handlers/drawCalc.js`

Draw picker plus the saved-basket list: load, rename, delete. Harkirat's placement: *"the list/load ui can be implemented into the draw calc's landing page, seems like the correct place for it."*

**Verify:** empty state renders with no saved baskets; delete is not one misclick from destroying a named basket.

### Task 6 — Page 1 `COST`

**Files:** `commands/drawCalculator.js`

`## YOUR BASKET` (ONE Text Display) → `## COST BREAKDOWN` → `## PRIORITY PLAN` → `## RECOMMENDED PACKAGE`. Action row: `Set Balance` (the existing one-field modal, unchanged), `Upgrade`, `Simplify`, `Edit Basket`.

🔴 **There is NO quantity control on this page or any other.** Revision 3 deleted quantity as a concept (spec §1). Pass 3's F26 says "quantity moves to Page 1" and is explicitly superseded — if you are reading that line, it is a record of a decision that was overtaken hours later.

- 🔴 **Do NOT reuse `buildDrawEntries()` here** — 52/40, hard send failure. Full fidelity lives in Draw Info.
- **Display compression is allowed**: consecutive identical-progress banners may render as `×3`. State stays flat.
- 🔴 **Preserve the `if (!result || !result.cheapest)` branch** at the optimizer call site. `null` is reachable (29,220 CP at `maxTransactions: 2`) and the code already renders a real message the spec does not describe.

**Verify:** render to text and READ it. Component sweep ≤40.

### Task 7 — Page 2 `BASKET`

**Files:** `commands/drawCalculator.js`, `handlers/drawCalc.js`

**One pulls-done dropdown per banner**, all visible, **paginated at 5 per page** (readability, not budget — 9 fit). Plus `+ Add another` (appends a fresh banner at 0), and reorder via focus select + `▲`/`▼`.

- 🔴 **Every option carries its banner number** (`#2 — 7 pulls done`). A select's placeholder is replaced by the chosen option, so without this a set dropdown stops saying which banner it is.
- 🔴 **New banners start at 0. No inherited defaults** — *"calculators don't assume or constrain answers"*.
- ⚠️ **Do not build reordering as "re-pick everything in order"** — Discord does not guarantee `values` arrives in click order.

**Verify:** setting 3 banners takes 4 taps; a chosen dropdown still names its banner.

### Task 8 — `Draw Info` + `Help` ephemeral panels

**Files:** `commands/drawCalculator.js`, `handlers/drawCalc.js`

Separate ephemeral messages, own 40-component budget each. **Draw Info reuses `buildDrawEntries()` at full fidelity** — measured 23/40 at nine draws. Help explains basket, banners, priority, and what `Simplify` hides.

### Task 9 — Bottom row, author lock, expiry, Reset

**Files:** `commands/drawCalculator.js`, `handlers/drawCalc.js`

`Draw Info · Draw Prices · Reset · Help` replaces `buildGlobalNavRow`. Author lock via **`resolvePanelActor`** on every branch (never a bare id comparison — the helper carries the admin override). `skipExpiry: true`. **`Reset` is two-step**, Danger style on the confirm.

### Task 10 — Shared copy is a snapshot

**Files:** `handlers/share.js`

Strip every interactive component from a shared calculator panel. **Verify: the shared payload contains zero type-2 and type-3 components.**

### Task 11 — Handler routing

**Files:** `handlers/drawCalc.js`

Verbs: `draws` `addmore` `bpulls` `up` `down` `page` `bpage` `info` `help` `reset` `save` `load` `rename` `del`. Keep `modal` `nums` `upg` `detail` `region`. `OWNED_PREFIXES` stays `['calc~']`. An unrecognised verb falls through harmlessly.

### Task 12 — Tests

**Files:** `scripts/drawCalcBudget.test.js`

All eleven requirements in spec §11. 🔴 **Requirement 4 must be able to FAIL** — build a basket whose cheapest-first order provably differs from its array order. Asserting "render matches array" against an arbitrary shuffle passes by construction and proves nothing.

### Task 13 — Records

**Files:** `.claude/rules/draw-prices.md`, `docs/CHANGELOG.md`, `docs/CHANGELOG-SUMMARY.md`, `docs/DEVLOG.md` (via `node scripts/devlog-add.mjs`), `package.json`

Bump `3.69.0-pre → 3.70.0-pre` (MINOR bumps suspended on the pre-release line). Changelog cites `(#PR)` with no hash; backfill the previous entry's hash.

## Audit log

Falsification pass — asking where this plan is **wrong**, not reviewing it.

| Finding | Severity | Resolution |
|---|---|---|
| **The previous revision of this plan described a data model that no longer exists** (quantity, type-focus, banner-focus). An implementation session would have built deleted machinery. | 🔴 Wasted work | Rewritten wholesale against revision 3 |
| **Task ordering buried a dependency** — render tasks consume what the codec defines and the cost model prices. | ⚠️ Rework | 1–4 are pure logic and independently testable; explicitly flagged as a candidate first PR |
| **"Never reuse `buildDrawEntries()`" (Task 6) contradicts "reuse it" (Task 8)** and reads as an error. | ⚠️ Would be "corrected" wrongly | Both correct — the cap is per MESSAGE and Draw Info is its own. Stated in both places |
| **Deleting `globalNav`'s `overrides` looks like obvious cleanup.** | ⚠️ Breaks `/draw prices` | Called out in the do-not-redo table |
| **The store introduces a staleness path the old design made impossible**, and every render must handle it. | 🔴 New failure mode | Task 2, and spec §5 |
| **Requirement 4 could pass vacuously** if the renderer simply maps the array. | 🔴 Vacuous gate | Task 12 requires a provably-different sort order |

**Cleared:** the optimizer needs no work · Draw Info fits at 23/40 (measured) · the component model is calibrated against the real 37/40 panel, though it has been wrong twice today and each page must be re-measured as built.

**Not verified, left to implementation:** the Help panel's exact wording, and whether `▲`/`▼` or a "move to top" single-tap reads better for reordering — both cheap to change once visible on the dev bot.
