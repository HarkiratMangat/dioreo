---
kind: plan
status: superseded
superseded_by: docs/superpowers/specs/2026-08-23-analytics-phase-2-falsified-premises-design.md
---

# `/bot analytics` phase 2 — the gaps live review left open

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Close the six gaps the 2026-08-23 live-review pass identified and filed but did not build, on the branch that already carries phase 1.

**Branch:** `feat/bot-analytics-redesign` — **already exists, 16 commits, unpushed, based on `v3-pre-release`.** Do not branch again. The worktree is `/Applications/Claude Code/Diors-Builds-worktrees/bot-analytics-redesign` and it has its own `node_modules` and `.env.dev`.

**Design:** `docs/superpowers/specs/2026-08-23-bot-analytics-live-review-design.md` — **read §2's seven rules before writing anything.** They are the output of six rounds of live review and four of them contradict something the earlier, frozen spec asserted.

**Tech stack:** discord.js v14 Components V2 written as raw JSON, Node's `assert`, the repo's hand-rolled runner. All new checks go in `scripts/botAnalyticsBody.test.js` (26 checks today).

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
- [ ] **Step 2: Decide the direction before patching.** The likely owner is `utils/manageActions.js` — give those four ops registered actions (or an explicit page mapping) so exactly one spelling exists. ⚠️ **A normalising shim at each call site is the wrong answer** and recreates the two-hand-synced-copies problem `core/ops/index.js`'s own header says the registry exists to prevent.
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
