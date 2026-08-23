---
kind: spec
status: frozen
---

# Phase 2 — the three premises that were false, and what replaced them

**Date:** 2026-08-23 13:18 EDT · **Author:** Claude Opus 5 with Harkirat · **Status:** supersedes `2026-08-23-bot-analytics-phase-2.md` (the plan) and `2026-08-23-bot-analytics-live-review-design.md` (the spec)

> **Read this before either superseded document.** Both are frozen and both are now wrong in specific, named places. This exists because a correction that lives only in a changelog is a correction nobody reads — the plan is what the next session opens first.

## 0. Why a third document in two days

The 2026-08-23 spec opens by saying a design for a rendered surface cannot be validated by reading it. Phase 2's plan was written from that spec, in the same session, without running anything — and three of its premises were false. **The lesson generalises past rendering: a claim about code cannot be validated by reading the notes about the code either.** Each falsification below cost one command to find and would have cost a shipped release to discover.

## 1. What the plan got wrong

| Plan said | Actually true | How it was found |
|---|---|---|
| Four ops emit `patchnote`: `removeSeason`/`restoreSeason`/`editSeason`/**`addSeason`** | `addSeason` has a registered action. The set is `removeSeason`/`restoreSeason`/`editSeason`/**`restore`** | enumerating `listOpTypes()` through `actionForOpType()` |
| The `patchnote` split is the defect | **`season.restoreDraft` is worse** — it records `season` while reversing a *draft* discard, so it is wrong in **both** directions: `manage.seasondraft` admins denied their own page, `manage.season`-only admins allowed into draft state. The patch-note case at least fails closed | the same enumeration, which the plan never ran |
| The owner is `utils/manageActions.js` — "give those four ops registered actions" | **Wrong owner and wrong fix.** These ops are inverse-only; there is no `/manage` button and there must not be one (`coreOps.test.js` has exempted them for months). Fabricating actions would fabricate buttons | reading the exemption list the plan itself cites |
| Task 4: a draw's `date` decides whether players see it | **`/draws` has no filter of any kind** — no `.filter()`, no `Date.now()`, no visibility test in the file. Every draw in the season document is live; the date is a label it prints | reading the render path, which the plan's own step 1 demanded |
| Task 4 dies if the premise fails | It **half** dies. `/calendar` genuinely gates visibility via `isEventEnded()`, so the feature is real there | same |

## 2. What the 2026-08-23 spec got wrong about itself

> **Rule G was applied to one branch out of two, while the spec recorded it as "adopted verbatim".**

The stacked before/after notation reached `describeListChange()` — the **array** branch — and never reached the scalar branch, which kept emitting the inline `A → B` the rule exists to forbid. The scalar branch is the common case and the one Harkirat's own mockup was about (`Drop` vs `Draw`). The `BEFORE`/`AFTER` card headings carried no glyph either, against a rule that explicitly says the glyphs are the same at both scales.

This is the spec's own finding #3 recurring: **an invariant written down is not an invariant enforced.** It is now asserted by a test that reads `commands/bot.js` and fails on an arrow — with comments stripped first, because the rule is written down inside the function it governs and an assertion that reads its own documentation as a violation is a false positive.

Spec §4 also describes the `patchnote` permission consequence as "filed, not patched". It is patched.

## 3. The contract that replaced the guesswork

An op may declare **`page:`** beside `action:`. `core/ops/index.js` resolves it, `registerEntity()` **throws at boot** if an op declares both and they disagree, and the check runs **before any registry mutation** so a rejected registration leaves nothing behind. Full rule, with the failure modes: `.claude/rules/operation-core.md`.

`scripts/coreOps.test.js` asserts `pageForOp()`'s output over `listOpTypes()` is a subset of `MANAGE_PAGE_SCOPES` — **it failed before the change and passes after**, so it is not a vacuous pass.

⚠️ **The plan's stated verification was `⊆ MANAGE_PAGE_SCOPES ∪ {'access'}`, and the union is wrong.** `access` rows are written straight through `recordChange()` and never pass through `pageForOp()` at all, so including it weakens the assertion for nothing.

## 4. Audit log

A pass whose stated job was to find where **this** document, and this session's work, is wrong.

1. 🔴 **A defect this session introduced, caught only because the test asserted the consequence rather than the message.** `registerEntity()`'s new conflict check originally ran *after* `REGISTRY.set()` and the `ACTION_TO_OP` writes, so a rejected op stayed resolvable and its action stayed claimed — poisoning every later lookup in the process. `assert.throws(..., /message/)` passed against exactly that bug. Adding "and it must leave nothing behind" failed immediately. **Asserting that an error fires proves nothing about what the failure left behind.**
2. 🟡 **The `season.restoreDraft` rows are not retro-identifiable and the migration says so.** `ChangeLog` stores no op type, and `season` is a legitimate value for every other season op, so a blanket update would mislabel real rows. Fixed forward only; `scripts/fixChangeLogPageKeys.js` states the limit rather than implying completeness.
3. 🟡 **`scripts/fixChangeLogPageKeys.js` has run against dev only, and repaired 0 rows there.** That is an honest result, not a proof — the dev database has never held a patch-note revert. The prod run is a real outstanding step, filed on the deferred list against the v3 launch.
4. 🟡 **Tasks 5 and 6 were looked at, not verified as specified.** A seed produced a real severity spread and a dense timing shape, Harkirat checked and said it looked fine, and the seed was then cleared at his instruction. That is a genuine observation and it is **not** the structured mobile pass the plan asked for. The Alerts item stays open on the deferred list and a matching Usage/Timing item was filed rather than quietly closed.
5. 🟢 **Cleared:** whether the `RECORD_VIEWS.patchnote` alias should go now that the spelling is fixed. It stays — rows written before the fix carry the singular key, and the migration is per-database rather than global.
6. 🟢 **Recorded so it is not re-proposed:** normalising `row.page` at each call site. Rejected twice now, for the same reason both times — it puts a second spelling-reconciliation in every consumer, which is the problem the registry exists to prevent.
