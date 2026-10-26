---
kind: plan
status: frozen
---

# `/bot analytics` phase 2 — the gaps live review left open

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Close the six gaps the 2026-08-23 live-review pass identified and filed but did not build, on the branch that already carries phase 1.

**Branch:** `feat/bot-analytics-redesign` — **already exists, 16 commits, unpushed, based on `v3-pre-release`.** Do not branch again. The worktree is `/Applications/Claude Code/Diors-Builds-worktrees/bot-analytics-redesign` and it has its own `node_modules` and `.env.dev`.

**Design:** `docs/superpowers/specs/2026-08-23-bot-analytics-live-review-design.md` — **read §2's seven rules before writing anything.** They are the output of six rounds of live review and four of them contradict something the earlier, frozen spec asserted.

**Tech stack:** discord.js v14 Components V2 written as raw JSON, Node's `assert`, the repo's hand-rolled runner. All new checks go in `scripts/botAnalyticsBody.test.js` (26 checks today).

---

> ## ⚠️ CORRECTIONS — annotated after execution, 2026-08-23 13:27 EDT
>
> **This plan stays frozen and its body below is unedited.** The notes marked **⚠️ CORRECTION** were added *after* the work ran, because three of the premises underneath turned out to be false and a reader who trusts them would repeat the mistakes. The original wording is deliberately left in place: it is the evidence that the plan was confidently wrong, which is the most useful thing this document now carries.
>
> The lesson generalises past the specifics. The spec this plan was written from opens by saying a design for a rendered surface cannot be validated by reading it — and then this plan, written in the same session from that spec, asserted five things about the codebase that one command each would have disproved. **A claim about code cannot be validated by reading the notes about the code either.**
>
> | The plan said | Actually true | Found by |
> |---|---|---|
> | Four ops emit `patchnote`, including **`addSeason`** | `addSeason` has a registered action. The set is `removeSeason`/`restoreSeason`/`editSeason`/**`restore`** | enumerating `listOpTypes()` through `actionForOpType()` |
> | The `patchnote` split is the defect | **`season.restoreDraft` is worse.** It records `season` while reversing a *draft* discard — wrong in **both** directions (`manage.seasondraft` admins denied their own page, `manage.season`-only admins let into draft state). The patch-note case at least fails closed | the same enumeration, which this plan never ran |
> | The owner is `utils/manageActions.js` — give those ops registered actions | **Wrong owner, wrong fix.** These ops are inverse-only: no `/manage` button exists and none should. `coreOps.test.js` has exempted them for months. Fabricating actions would fabricate buttons | reading the exemption list this plan itself cites |
> | A draw's `date` decides whether players see it | **`/draws` has no filter of any kind** — no `.filter()`, no `Date.now()`, no visibility test in the file. The date is a label it prints | reading the render path, which Task 4 step 1 demanded |
> | Verify with `⊆ MANAGE_PAGE_SCOPES ∪ {'access'}` | The union is **wrong and weakens the check**. `access` rows go straight through `recordChange()` and never reach `pageForOp()` | writing the assertion |
>
> **What was built instead of the shim:** an op may declare **`page:`** beside `action:`. `core/ops/index.js` resolves it and `registerEntity()` throws at boot when an op declares both and they disagree — before any registry mutation, so a rejected registration leaves nothing behind. Full rule: `.claude/rules/operation-core.md`.

---

## Global constraints

- **32 columns on a phone, not 40** (spec §2 rule B) — measured, and asserted by an existing test.
- **40 components per message, counted recursively.** `renderRecord()` already takes a budget; every new renderer must go through it rather than around it.
- **Colour is decoration** (rule A). iOS strips ANSI silently. Never let colour be the only carrier.
- **Never re-describe a record** (rule D). Export the canonical builder and reuse it.
- **Verify on a phone, not only on desktop.** Every finding in the spec's §1 table that involved layout came from mobile and would not have been visible otherwise.
- Conventional Commits; `npm test` and `npm run docs:audit` both exit 0 before any commit.

---

### Task 1: `hasManagePageAccess` is called with a page key no scope list contains

**The one with a security consequence — do it first.** `core/changeset.js`'s `pageForOp()` falls back to `op.type.split('.')[0]` for any op with no registered `/manage` action, so `ChangeLog.page` can hold **`patchnote`** (singular) while `MANAGE_PAGE_SCOPES` has `patchnotes`. `handlers/bot.js`'s revert and change-detail gates both call `hasManagePageAccess(userId, row.page)` with that value.

- [ ] **Step 1: Reproduce it as a failing assertion.** `pageForOp()`'s full output set over `listOpTypes()` must be a subset of `MANAGE_PAGE_SCOPES ∪ {'access'}`. It is not today — four patch-note ops (`removeSeason`/`restoreSeason`/`editSeason`/`addSeason`) emit `patchnote`.
    > ⚠️ **CORRECTION (2026-08-23 13:27 EDT):** `addSeason` has an action (`patchnotes:addseason`); the fourth is **`patchnote.restore`**. And `season.restoreDraft`/`season.restoreSnapshot` emit `season` — `restoreDraft` wrongly, since it reverses a *draft* discard. Drop the `∪ {'access'}`: those rows never pass through `pageForOp()`, so including it only weakens the assertion. Done, in `scripts/coreOps.test.js`; it failed before the fix and passes after.
- [ ] **Step 2: Decide the direction before patching.** The likely owner is `utils/manageActions.js` — give those four ops registered actions (or an explicit page mapping) so exactly one spelling exists.
    > ⚠️ **CORRECTION (2026-08-23 13:27 EDT):** the owner is **`core/ops/index.js`**, not `manageActions.js`, and "give them registered actions" is the wrong half of the either/or — an action implies a button, and these ops are inverse-only by design. The **explicit page mapping** is what shipped: `page:` on the impl, validated against `action:` at registration. The warning below about the shim was right and was followed. ⚠️ **A normalising shim at each call site is the wrong answer** and recreates the two-hand-synced-copies problem `core/ops/index.js`'s own header says the registry exists to prevent.
- [ ] **Step 3: Check what an admin actually experiences today.** Grant a scoped `manage.patchnotes` admin, have them open a patch-note change's Details. Whether they are wrongly denied or wrongly allowed decides the severity, and neither has been observed — only inferred.
- [ ] **Step 4:** Keep the subset assertion as a permanent test, and leave `commands/bot.js`'s `RECORD_VIEWS.patchnote` alias in place regardless — historical rows already carry the singular key.

---

### Task 2: `loadouts_mp` / `loadouts_dmz` have no canonical card

`buildLoadoutCard` (`utils/loadoutRender.js`) returns a whole **Container (type 17)** ending in a live action row — pagination plus Copy Attachments / Copy Code, whose `custom_id`s route to `handlers/loadouts.js` and resolve an index against a different query. Embedding it as-is would nest a Container and ship buttons that mislead or misfire.

- [ ] **Step 1:** Extract the content half — everything up to the action row — behind an option (`{ chrome: false }` or a separate `buildLoadoutCardBody`). ⚠️ **`/gunsmiths` and every loadout surface use this builder**; a snapshot test exists (`scripts/loadoutRenderSnapshot.test.js`) and must not move.
- [ ] **Step 2:** Wire `RECORD_VIEWS.loadouts_mp.render`. `loadouts_dmz` aliases it already.
- [ ] **Step 3: Measure, do not assume.** A loadout card is materially heavier than a draw Section (title, dividers, description, attachments, a media gallery). Assert a before/after pair plus chrome clears 40, and confirm the existing budget fallback fires when it does not — a guard that never fires is decoration.

---

### Task 3: `calendar` has no card renderer at all

`commands/calendar.js` builds a whole container; there is no standalone per-event card to reuse.

- [ ] **Step 1:** Extract one, the same way `buildDrawSections` already is.
- [ ] **Step 2:** Wire `RECORD_VIEWS.calendar.render` and assert byte-equality against the extracted builder, matching the draws test.
- [ ] **Step 3:** ⚠️ `/calendar` **synthesizes** draw entries at render time from `newDraws`/`returningDraws` for anything with no explicit calendar row. Those are never saved, so a change-detail panel must never render one — only real `calendar[]` elements.

---

### Task 4: "Is this live to players right now?"

Reverting a title on a draw players can currently see is a bigger decision than reverting one scheduled for next month, and the panel presents them identically.

- [ ] **Step 1: Test the premise first.** Read `commands/draws.js` and `commands/calendar.js` and establish what actually decides visibility. **It may not be the date** — `/draws` may list every draw in the season doc regardless. If visibility is not date-driven, this task changes shape or dies, and that is a real outcome.
    > ⚠️ **CORRECTION (2026-08-23 13:27 EDT): the hedge was right and the task half-died.** `/draws` lists everything in the season document — no filter of any kind — so the planned "scheduled until X / already past" line would have been false on every panel it appeared on. The panel now says what is true: every draw is live the instant it saves, and the date is a label. **`/calendar` genuinely does gate visibility** via `isEventEnded()`, so that half is real and takes its answer from that exported function rather than a second date rule.
- [ ] **Step 2:** If it is real, take the answer **from the render path**, never a fresh date comparison here. A second hand-rolled rule would drift from what `/draws` shows and confidently state the opposite.
- [ ] **Step 3:** One line above the revert button: live now / scheduled until `<t:…:D>` / already past.
- [ ] **Step 4: Verify with three real records** — one past, one live, one future — each matching what `/draws` actually renders.

---

### Task 5: Alerts' severity colour-coding has never been exercised

The dev bot emits almost nothing but `info`, so the page's stated signature — per-row severity colour — has never been seen doing its job. Three identical green rows prove nothing either way.

- [ ] **Step 1:** Seed `AlertLog` with a deliberate spread of `info` / `caution` / `warn` / `error`.
- [ ] **Step 2:** Confirm the three most recent are distinguishable **at a glance** by their leading glyph, on a phone.
- [ ] **Step 3:** If they are not, that is a finding about the page's identity, not about the data — say so rather than adjusting the seed until it looks fine.

---

### Task 6: Usage and Timing have never been seen with production-shaped data

`AnalyticsEvent` is near-empty on the dev bot, so the empty states are verified and the **dense** layouts are not.

- [ ] **Step 1:** Seed a realistic spread — several commands, a long command name, durations spanning all four felt-speed bands.
- [ ] **Step 2:** Confirm bars stay within 32 columns with a realistic name spread, the worst-p95 ranking matches `computeTimingStats()`, and the felt-speed glyphs land in the right bands.
- [ ] **Step 3:** Re-check after the first real deploy; a seeded shape is a rehearsal, not the thing.

---

### Task 7: Close out

- [ ] Changelog entry citing the PR (no hash), `package.json` bump, DEVLOG entry via `node scripts/devlog-add.mjs`, deferred-list items marked resolved **and moved to `docs/archive/resolved-list.md`** — an item leaves an active list only by appearing in its archive.
- [ ] `npm test` and `npm run docs:audit`, reading **exit codes**.
- [ ] `gh pr create --base v3-pre-release`. ⚠️ The branch carries phase 1 too, so the PR body must describe **both** — and say plainly that pagers, filters and exports **moved to the portal**, never "removed".

## Audit log

A pass whose stated job was to find where this plan is wrong.

1. 🔴 **Task 4 rests on an unverified premise and the first draft did not say so.** It assumed a draw's `date` decides whether players see it. That was never checked, and `/draws` may well list everything in the season document. Step 1 is now "test the premise", with dying as a legitimate outcome — the same failure mode that produced the `-204% headroom` bug, which also came from confidently applying a rule that did not hold.
2. 🟡 **Tasks 2 and 3 touch hot paths shared with player-facing commands.** `buildLoadoutCard` serves `/gunsmiths`; the calendar builder serves `/calendar`. Extraction is the risk, not the wiring, so both tasks name the existing snapshot tests that must not move.
3. 🟡 **Task 1 was nearly written as "add a normaliser".** That is the fast fix and it is wrong — it would put a second spelling-reconciliation in every caller. The plan now requires deciding the owner before patching, and names the registry header that argues against the shim.
4. 🟡 **Task 5 can be made to pass by adjusting the seed.** A test whose input you control until the output looks right proves nothing. Step 3 makes "they are still not distinguishable" a reportable result.
5. 🟢 **Cleared:** whether phase 2 needs its own branch. It does not — phase 1 is unmerged and unpushed on `feat/bot-analytics-redesign`, so the work continues there and ships as one PR.

### Added after execution (2026-08-23 13:27 EDT)

6. 🔴 **A defect the fix itself introduced, caught only because the test asserted the CONSEQUENCE rather than the message.** `registerEntity()`'s new conflict check first ran *after* `REGISTRY.set()` and the `ACTION_TO_OP` writes, so a rejected op stayed resolvable and its action stayed claimed — poisoning every later lookup in the process. `assert.throws(..., /message/)` passed against exactly that bug; adding "and it must leave nothing behind" failed immediately. **Asserting that an error fires proves nothing about what the failure left behind.**
7. 🔴 **A rule from the design spec had been applied to one branch out of two, while the spec recorded it as adopted verbatim.** The stacked before/after notation reached the *array* diff and never the *scalar* one, which kept shipping the inline `A → B` the rule forbids — the common case, and the one the mockup was about. Now asserted by a test that reads the source, with comments stripped first (the rule is written down inside the function it governs, and an assertion that reads its own documentation as a violation is a false positive).
8. 🟡 **Tasks 5 and 6 were looked at, not verified as specified.** The seed produced a real severity spread and a dense timing shape, it was checked and looked fine, and the seed was then cleared. That is a genuine observation and **not** the structured mobile pass this plan asked for — so the Alerts item stays open on the deferred list and a matching Usage/Timing item was filed rather than quietly closed. Item 4 above predicted exactly this pressure.
9. 🟡 **`scripts/fixChangeLogPageKeys.js` has run against dev only, repairing 0 rows** — honest, and not a proof: the dev database has never held a patch-note revert. The prod run is filed against the v3 launch. The `season.restoreDraft` rows are **not** retro-identifiable (`ChangeLog` stores no op type and `season` is legitimate for every other season op), so they are fixed forward only and the script says so rather than implying completeness.
10. 🟢 **Recorded so it is not re-proposed:** normalising `row.page` at each call site. Rejected twice now, for the same reason both times.
