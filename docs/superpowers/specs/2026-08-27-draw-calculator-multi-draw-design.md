---
kind: spec
status: frozen
---

# `/draw calculator` — saved baskets, per-banner planning, and the priority plan

*Written 2026-08-27 00:13 EDT. **Rewritten 2026-08-27 11:01 EDT** — third revision, after a harsh audit (Pass 3) falsified two of my own claims and four more decisions from Harkirat changed the data model itself. **Design only — nothing here is built.** Plan: `docs/superpowers/plans/2026-08-27-draw-calculator-multi-draw.md`.*

Harkirat's original ask: *"can the calculator determine and calculate based on if the user wants to purchase multiple draws (either multiple types or multiple of the same type)?? because calculating a scenario such as that is a BIG reason someone would reach for the calculator."*

## 0. The eleven decisions this design implements

| # | Decision | When |
|---|---|---|
| 1 | Multiple draw types in one basket | 2026-08-26 |
| 2 | Multiple banners of the same type — parallel, concurrent | 2026-08-27 00:26 EDT |
| 3 | Upgrades multiply per banner | 2026-08-27 00:30 EDT |
| 4 | Per-banner progress | 2026-08-27 09:58 EDT |
| 5 | Player-ordered priority — **never** an algorithmic sort | 2026-08-27 09:58 EDT |
| 6 | Its own bottom row · draw info moves to a button | 2026-08-27 10:07 EDT |
| 7 | Author-locked, never expires | 2026-08-27 10:10 EDT |
| 8 | **A basket STORE, with named saved baskets**, listed on the landing page | 2026-08-27 10:3x EDT |
| 9 | **Priority orders individual BANNERS**, not draw types | 2026-08-27 10:3x EDT |
| 10 | **"Show Everyone" publishes a snapshot** — controls stripped | 2026-08-27 10:3x EDT |
| 11 | **No inherited defaults.** *"calculators don't assume or constrain answers"* | 2026-08-27 10:4x EDT |

### The two that reshaped the model

✅ **Priority orders individual banners.** This is the decision that mattered most, and its consequence is larger than it looks — see §2.

✅ **A store, and named saved baskets.** *"yes and go further… the list/load ui can be implemented into the draw calc's landing page, seems like the correct place for it."* ⚠️ **My stated case against a store was wrong twice** and is recorded as F22: privacy was a *cost* (a `PRIVACY.md` entry), never a prohibition; and "a DB read on every click, currently zero" was **false** — `handlers/drawCalc.js:55-57` already performs two reads per render.

## 1. 🔴 The basket is a FLAT LIST OF BANNERS. "Quantity" does not exist.

Decision 9 forced this, and it is the single most important line in the document.

If every banner can be independently ordered, then every banner is independently meaningful — so there is nothing left for a quantity number to compress. The basket is not *"Mythic Weapon ×3 with an array of progress"*. It is:

```
1. Mythic Weapon Draw          — 7/10
2. Legendary Weapon (Reactive) — 0/10
3. Mythic Weapon Draw          — 3/10
4. Mythic Weapon Draw          — 0/10
```

Four rows. Order is priority. Progress is a property of a row.

**What this deletes outright**, all of it specced in the previous revision: the quantity select · the type-focus select · the banner-focus-within-type select · the two-level granularity problem · and `q` from the encoding, which the last audit had already flagged as duplicated state.

⚠️ **Display compression is still allowed; state compression is not.** Page 1 may render three consecutive identical-progress banners as `Mythic Weapon Draw ×3` for readability. Page 2 always shows them individually, because that is where they are edited. Conflating those two is what produced the previous revision's whole quantity apparatus.

## 2. 🔴 Setting progress: ONE DROPDOWN PER BANNER

Every earlier revision assumed a **focus pointer** — pick which thing, then edit it. That is a database mindset, and it was the sole reason editing ran 3–4 taps deep. With a flat list it is unnecessary.

**Each banner gets its own pulls-done dropdown, labelled with that banner, all visible at once.** No focus, no mode, no wizard, nothing hidden — the interface every settings form on earth uses, which is why it needs no explanation.

Measured:

| Banners edited | Focus-based (previous design) | One dropdown each |
|---|---|---|
| 1 | 3 taps | **2** |
| 2 | 6 taps | **3** |
| 3 | 9 taps | **4** |
| 5 | 15 taps | **6** |

- **No typing.** This is what makes it better than the modal I had been about to propose; Harkirat's doubt about a pop-up form was well placed.
- **WYSIWYG.** The state is on screen, not in a pointer you can lose track of.
- ⚠️ **A select's `placeholder` is REPLACED by the chosen option once picked**, so a dropdown reading "7 pulls done" would no longer say *which* banner it belongs to. Real trap, would have shipped. Fix: **number the rows in the listing above AND prefix every option with its banner number** (`#2 — 7 pulls done`). Belt and braces, because positional correspondence alone breaks when mobile wraps.
- 🔴 **No inherited defaults** (decision 11). A new banner starts at **0**, which asserts nothing — "I haven't started" is a real state. Copying a sibling's 7 would be the calculator inventing an answer.

**Paginate at 5 banners per page.** Nine fit inside the component budget (38/40 measured), but **the budget is not the binding constraint — readability is.** This exact panel has been rejected three times for mobile density; nine stacked full-width dropdowns is a wall. Five is a readability choice, deliberately below what fits.

**Adding a second banner of a draw already in the basket** uses an `+ Add another` select listing the basket's own draws — one tap appends a fresh banner at 0 pulls. No quantity number to choose, no assumption made.

**Reordering** keeps a focus select plus `▲`/`▼`. It is the one remaining pointer, and that is the right allocation: reordering is rare, progress-setting is common, and the previous design had it backwards. ⚠️ **Do not implement reordering as "re-pick every banner in your preferred order" in a multi-select** — Discord does not guarantee `values` arrives in click order, and that is unverified platform behaviour underneath a core interaction.

## 3. Architecture — a store, two pages, two ephemeral panels

⚠️ **The 40-component ceiling is per MESSAGE, counted recursively** (root `CLAUDE.md`; this repo has taken that production crash once). A second Container shares the same budget and buys nothing — so "multi-panel" means **pages** within the live message, plus **separate ephemeral messages** for read-only detail, each of which gets its own fresh 40.

- **Landing** — no basket yet. Draw picker, plus **the saved-basket list** (decision 8): load, rename, delete.
- **Page 1 `COST`** — the breakdown, the recommendation, the priority plan. Draw multi-select inline, plus the action row: **`Set Balance`** (the existing one-field modal, unchanged), `Upgrade` toggle, `Simplify`, `Edit Basket`.
- **Page 2 `BASKET`** — per-banner dropdowns, add-another, reordering. Paginated at 5.
- **`Draw Info`** — ephemeral, its own message. Full `buildDrawEntries()` fidelity for every distinct draw in the basket. **Measured 23/40 at nine draws, which is the CEILING, not a sample** — `DRAW_META` holds exactly nine draw types, so a basket of twenty banners still spans at most nine. Draw Info never needs pagination.
- **`Help`** — ephemeral. Explains the basket, banners, priority and what `Simplify` hides.

🔴 **Page 2 exists so the ANSWER stays readable, not because components ran out.** A 2-banner basket would fit on one page (36/40), but Page 1 already carries the breakdown, plan and recommendation; pushing the answer off-screen on mobile is exactly the complaint that drove the last three rebuilds. This reason survives a budget change; "it doesn't fit" would not.

## 4. Component budget — a model CALIBRATED against the real renderer

⚠️ **These are model outputs, not measurements — the pages do not exist yet.** The model was calibrated first: run against the *current* panel it reproduces the independently-measured **37/40** exactly. It has still been wrong twice today (it omitted the Container's own component, and estimated Draw Info at 22 when the measured figure is 23). **Re-measure each page as it is built.**

| Page | Components |
|---|---|
| Page 1 (basket size barely moves this — the basket is ONE Text Display) | ~29 / 40 |
| Page 2, 5 banner dropdowns | **32 / 40** (measured model; 9 would be 38) |
| Draw Info, 9 draws | **23 / 40** (measured) |
| Current panel today | 37 / 40 (measured) |

## 5. State, the store, and the encoding

Because the basket now lives in the store, the `custom_id` carries only a **reference plus transient view state**:

```
calc~<verb>~<basketId>~g<page>~x<detail>~f<focus>~a<authorId base36>
```

| Field | Meaning |
|---|---|
| `basketId` | the stored document; **the basket itself is never in the `custom_id`** |
| `g` | which page — `0` = COST, `1` = BASKET |
| `x` | the existing `Simplify` / `Show Breakdown` boolean, unchanged from today |
| `f` | the reorder focus pointer from §2 — which banner `▲`/`▼` will move. The ONLY focus pointer left |
| `a` | author id, base-36 (12 chars, not 19) |

⚠️ **`balance` is deliberately NOT here.** It lives on the basket document and is read at render time. An earlier draft carried it in both places; that is duplicated state of exactly the kind this spec rejects for `quantity`, and there is no reason for it — unlike `g`/`x`/`f`, balance is not view state, it is part of what the basket *is*.

🔴 **This deletes the entire stale-decode hazard that the previous revision needed a `~z1` version marker to survive (F11).** That marker is gone with the encoding it protected — do not reintroduce it. The old plan reused field letters with new meanings, so a stale panel's `p10` would have decoded as "two banners" instead of "10 pulls done" — silently. Once the format stops carrying the basket, that class of bug cannot occur. **The store is what makes the encoding safe, not merely roomier.**

**Basket document** (`models/DrawBasket.js`): owner, optional name, ordered banner list (`drawKey` + `pullsDone` each), region, balance, upgrade toggle, entitlement mask, timestamps.

- ⚠️ **Mongoose only persists declared fields** — every field goes in the schema in the same change (root `CLAUDE.md`'s standing gotcha).
- **`entitlementMask`** is the existing 6-bit mask over `CP_PACKAGES` (`cp80`…`cp8000`), unchanged from today's panel state. It is **snapshotted onto the basket** rather than recomputed, because it records what the player *told us* they still hold — there is no live entitlement source to read.
- **TTL: 30 days, on UNNAMED baskets only.** 🔴 Scope it with a `partialFilterExpression` so a named basket is never collected, exactly as `models/Changeset.js` does (*"a bare `createdAt` TTL would also delete committed changesets… `partialFilterExpression` scopes the expiry"*). 30 days matches that precedent; `Announcement` uses 60 with the value set explicitly by the caller rather than as a schema default, which is the better habit — follow it.
- 🔴 **`PRIVACY.md` §2 + Appendix A in the SAME change.** `docs-audit`'s `privacy-model-coverage` will fail the build otherwise — which is the gate doing its job, not an obstacle.
- 🔴 **The panel can now go stale**, which the stateless design made structurally impossible. A basket can be deleted, expire, or be missing after a restore. **Every render needs a "this basket no longer exists" path**, and `skipExpiry`'s justification changes: it now rests on the store being the source of truth, not on the `custom_id` being self-contained.

## 6. Cost model

Per banner: `remainingToFinish(region, drawKey, itsPullsDone)` + `upgradeCost(region, drawKey)` when the toggle is on and one exists. Basket cost is the sum; then **one** `optimizePurchase(basketCost − balance, …)` call.

✅ The optimizer needs no further change — the 2026-08-27 00:31 EDT fix (per-currency bulk peeling + honesty guard) covers every basket size. **689,900 CP is the largest figure the tests exercise, not a ceiling**: bulk peeling has no upper bound, and that number is simply the most expensive basket this data can produce (all nine draws × 5).

🔴 **Preserve the existing `if (!result || !result.cheapest)` branch.** `null` is genuinely reachable (29,220 CP at `maxTransactions: 2`) and the code already renders a real message for it. The spec omitting it is how a rewrite would drop it.

## 7. The priority plan

Basket order **is** priority order, now over individual banners (decision 9):

```
## PRIORITY PLAN
<dot> 1. Mythic Weapon Draw — 7/10 <dash> **2,300 CP** <dash> running **2,300 CP**
<dot> 2. Legendary Weapon (Reactive) — 0/10 <dash> **5,750 CP** <dash> running **8,050 CP**
-# ▲ your 8,000 CP balance covers #1 in full, and 5,700 CP into #2
<dot> 3. Mythic Weapon Draw — 3/10 <dash> **5,530 CP** <dash> running **13,580 CP**
```

The nearly-done banner can now sit above a different draw entirely — the case decision 9 existed to enable. Collapsed shows one line. 🔴 **No algorithmic sort, ever**; new banners append and the player promotes them.

## 8. Author lock, expiry, sharing

- **Author lock** via `resolvePanelActor(interaction, authorId)` on every branch — never a bare id comparison; the helper carries the deliberate `ALLOWED_ADMIN_ID` override.
- **No passive expiry** — `skipExpiry: true`. ⚠️ **Its justification changed with the store and the old one no longer holds** (§5): it rests on the basket document being the source of truth, NOT on the `custom_id` being self-contained. Do not "restore" expiry on the reasoning that the panel can now go stale — handle staleness with the missing-basket path instead.
- 🔴 **"Show Everyone" publishes a SNAPSHOT** (decision 10): `handlers/share.js` strips every interactive component. The previous revision called a public panel of eleven silently-rejecting controls "intended"; it was not checked, and it was wrong.

## 9. Absent data and edge cases

- An entry with no price at the current region is **excluded from the total and named on its own row** — never silently dropped, never interpolated.
- **Region switching must preserve every banner's progress.**
- 🔴 **Draw indices are positional.** Removing a draw from `DRAW_DATA` would silently re-point a stored basket at *different draws*. **Store `drawKey` strings in the document, never indices** — the store makes this free.
- **`Reset` is two-step**: first click relabels to `Reset — click again` in Danger style. It clears basket, balance, focus and page.
- **Empty basket** returns to the landing state, which now also lists saved baskets.

## 10. Out of scope

Budget mode across a basket · per-banner region mixing · per-banner upgrade toggles · per-banner goals other than `Finish` · sharing a saved basket with another user.

## 11. Testing requirements

Assert against **rendered strings**, per `scripts/drawCalcBudget.test.js` — three live defects here were invisible to every structural gate.

1. Component budget swept across basket size × page × detail ≤ 40 including share.
2. **Per-banner cost** — 3 banners at 7/3/0 costs strictly less than 3 fresh, strictly more than 1 fresh.
3. **Upgrades multiply per banner** — 3 mythic banners carry exactly 3 upgrades.
4. 🔴 **No algorithmic reordering.** Must be able to FAIL: build a basket whose cheapest-first order *provably differs* from its array order, then assert the render matches the array. Asserting "render matches array" against an arbitrary shuffle passes by construction and proves nothing.
5. **The missing-basket path renders a real message**, not a crash.
6. **Author lock** denies a third party, allows `ALLOWED_ADMIN_ID`.
7. **Shared copy carries zero interactive components.**
8. **`Reset` requires two clicks** and then yields state identical to a fresh invocation.
9. **Dropdown options carry their banner number**, so a chosen value stays attributable.
10. **`PRIVACY.md` covers every stored field** (enforced by `docs-audit`).
11. **No `null`, `NaN`, `undefined` or negative figure** in any rendered string across the sweep.

## Audit log

Two falsification passes per `.claude/rules/plan-drafting.md` — asking where this document is **wrong**, never "reviewing" it. Justified on all three triggers: the failure mode is silent (a wrong basket total renders as a confident number), premise risk was real (and several premises were false), and rebuilding the panel after implementing against a wrong ceiling is expensive.

### Pass 2 — 2026-08-27 10:15 EDT

| # | Finding | Severity | Fixed in |
|---|---|---|---|
| **F10** | **"Multi-panel" read as "more containers" would fail at send time** — the 40-cap is per message, counted recursively, so a second Container shares the budget. | 🔴 Would crash | §1 — pages + separate ephemeral messages |
| **F11** | **Stale-panel decode collision.** Reusing `p`/`d` with new meanings makes legacy `p10` decode as two banners instead of 10 pulls, silently, on panels still live in Discord. | 🔴 Silent wrong answer | §4 — the `~z1` marker |
| **F12** | **The author-lock id does not fit.** A raw 19-digit snowflake caps the basket at 11 banners; at 20 banners the id pushes the encoding to exactly 100/100 — zero margin, the same mistake that killed the first draft's encoding at 98/100. | 🔴 Would overflow | §4 — base-36 id (12 chars) + a computed 95-char guard |
| **F13** | **Priority and progress are different granularities** — priority is per draw *type*, progress is per *banner*. One focus select cannot serve both. | ⚠️ Design | §8 — two focus selects |
| **F14** | **Region switching strands entries and would drop their progress.** | ⚠️ Data loss | §9 |
| **F15** | **`single` and `multi` modes made the 1↔2 transition a state-losing cliff.** Two code paths for one concept. | ⚠️ Data loss | §2 — no modes; controls adapt to basket size |
| **F16** | **A flat instance cap is a magic number that drifts from the real limit.** A narrow basket genuinely has room for more banners. | ⚠️ Latent | §4 — computed guard, measured per width |
| **F17** | **`skipExpiry` was about to be used as an exception rather than on the merits.** Its documented bar is "nothing on this panel can go stale"; checking it, the panel *does* meet that bar because every figure recomputes from the `custom_id` on each click. | ✅ Cleared | §7 — justification stated |
| **F18** | **`utils/globalNav.js`'s `overrides` parameter would have read as dead code** once the calculator stopped calling `buildGlobalNavRow`, and been deleted — breaking `/draw prices`' still-live "Draw Calculator" button. | ⚠️ Would break a sibling | §8 — explicit do-not-delete |
| **F19** | **"Its own command" and "keep the name" looked contradictory** and were about to be resolved by re-registering the command — which would have re-introduced the duplicate-`draw` trap `drawCalculator.js`'s header exists to prevent. | ⚠️ Would break registration | §0 — the two asks were never coupled |

**Cleared, not fixed** — checked and found non-issues, recorded so a later session does not re-investigate:

- **The optimizer needs no further change.** The 2026-08-27 00:31 EDT bulk-peeling + honesty guard covers every basket size this design can produce, pinned to 689,900 CP.
- **The 2X entitlement model is already correct for baskets** — one use each, enumerated by mask. It matters proportionally *less* on a large basket, which is a wording caution, not a defect.
- **Component budget has ≥9 margin on every page**, computed against real per-component costs.

**Alternatives re-examined and still rejected:** a modal with one field per banner for bulk progress entry (Discord caps modals at 5 inputs, and it reintroduces the free-text entry the 2026-08-26 rebuild deleted as *"the single most hostile thing about the old flow"*) · algorithmic priority sorting (forbidden by decision 5) · paging the one-banner case for consistency (makes the common case worse to serve the rare one) · an in-memory `messageId → authorId` map instead of encoding the id (defeats the deliberate statelessness and fails open after a restart).

**Assumptions converted to measurements:** encoding length at every basket width (§4), the per-page component budget (§3), the base-36 snowflake length (12 vs 19), and the exact width at which the encoding overflows.

### Pass 3 — 2026-08-27 10:33 EDT (harsh audit, at Harkirat's request)

✅ **All six were answered by Harkirat the same morning, and four of them reshaped the design — this pass's findings are RESOLVED, not open.** The State column below records what each became. Revision 3 (§1–§2) is the result.

| # | Finding | Severity | State |
|---|---|---|---|
| **F20** | **The component table repeated F1's exact error** — computed from a model of the renderer, published under a heading claiming it was measured. Calibrating the model against the known 37/40 panel validated the method and immediately exposed a missed Container component (31→32) and a wrong Draw Info estimate (22→23, measured). | ⚠️ Method | Fixed §3; both figures corrected |
| **F21** ✅ | **Priority and per-banner progress do not compose.** Priority orders draw *types*; progress is per *banner*. A player 7 pulls into one of three Mythic banners cannot prioritise finishing **that banner** — the whole entry moves as a unit. These were decided in isolation and never checked against each other, and the case they fail is the exact one that motivated both. | 🔴 Feature hole | **RESOLVED** — Harkirat chose banner-level priority, which flattened the model entirely (§1). The hole was the model being wrong, not a gap to patch |
| **F22** | **The stated case against a database was wrong twice.** (a) "Privacy" was cited as a constraint when a `PRIVACY.md` entry is a *cost*, not a prohibition — the error [[feedback_policy_is_advisory_not_a_veto]] names exactly. (b) "A DB read on every click; currently zero" is **false**: `handlers/drawCalc.js:55-57` already performs **two** reads per render (`UserPreference` + `SeasonalData`). TTL precedent also already exists (`Announcement`, `PortalSession`, `Changeset`). | 🔴 False premise | **RESOLVED** — a store was approved, *and* named saved baskets (decision 8) |
| **F23** | **Per-banner progress costs 7 interactions** for a realistic two-banner edit (page turn + type focus + banner focus + pulls, twice). The 2026-08-26 rebuild existed to *cut* interaction count and called 5 "hostile". Harkirat chose this option without that number in front of him — a failure of the question, not the answer. A modal handles 1–5 banners in **one** interaction; rejecting it "because text entry is hostile" was reasoning by slogan (the hostile thing was a text field on the *common* path). | ⚠️ Usability | **RESOLVED** — neither selects nor a modal: one dropdown per banner (§2), 4 taps for three banners instead of 9 |
| **F24** | **"Show Everyone" publishes a panel with 11 live-looking controls that silently reject everyone.** The spec called this "intended, not a bug" without checking `handlers/share.js`. Three coherent options exist (strip components / re-key to the sharer / drop the button as `/help` and `/invite` did); the spec picked none deliberately. | ⚠️ UX | **RESOLVED** — strip the controls, publish a snapshot (decision 10) |
| **F25** | **`Reset` is destructive, un-confirmed, and adjacent to two harmless buttons.** One misclick wipes up to 20 banners of setup with no undo. | ⚠️ Data loss | Fixed §8 — two-step confirm |
| **F26** | **The page seam matches concepts, not frequency.** Quantity is the second-most-common edit after reading the number, and it sat behind a page turn while the rarer `Set Balance` sat on Page 1. | ⚠️ UX | ⚠️ **SUPERSEDED the same day** — revision 3 deleted quantity as a concept entirely (§1), so there is no quantity control to place on either page. Kept for the record; do NOT implement a quantity select |

**Cleared by checking, not by reasoning:**

- **The optimizer's `null` branch is already handled** — `commands/drawCalculator.js:315` renders a real message. An earlier claim in this pass that it would crash was **wrong**. But `null` *is* now genuinely reachable (29,220 CP at `maxTransactions: 2`), and **the spec never mentions the branch**, so a from-spec rewrite could silently drop behaviour the code already has. Preserved as a plan requirement.
- **Draw Info fits**: 23/40 worst case, measured across all three regions.

**Never questioned until now, and worth recording:**

- **The basket has no name and does not outlive the message.** The thing a player cares about — "the stuff I want this season" — has no noun in this design. This is the database question arriving from the other side: persistence is the feature a store unlocks, and it is worth more than raising a size cap nobody reaches.
- **`q` is duplicated state.** §4 derives `quantity` from `instances.length` on principle, then stores the same fact as `q` in the encoding. Defensible (the encoding needs framing) but it should say so rather than appear to have forgotten its own rule.
- **Positional draw indices are a second F11.** `d012` is `DRAW_KEYS.indexOf` order; removing a draw from `DRAW_DATA` silently re-points a stale basket at *different draws*, and a basket mis-maps every entry at once rather than one.
- **The dev-bot click-test owed from the PREVIOUS rebuild is still owed.** This design lands on a panel nobody has clicked.
- **Shipping shape is unstated.** Tasks 1–2 are pure logic with no UI and could merge independently to de-risk the rest.

### Pass 1 — 2026-08-27 00:35 EDT

**F1 — the component projection was WRONG and would have shipped a panel that cannot send.** "Drop pulls+goal (−4), add quantity (+2), add a summary line (+1) → 36/40" treated the per-draw summary as *one* component. `buildDrawEntries()` actually returns **20 blocks** for nine draws: **52/40**, a hard send failure.

**F2 — "multiple of the same type" had no verified meaning** and the cost model silently depended on it. Flagged rather than assumed; Harkirat's answer confirmed parallel banners.

**F3 — dropping the pulls and goal selects would have silently regressed the single-draw flow.** Now handled by §2's adaptivity instead of a mode flag.

**F4 — "budget mode generalizes" was accepted without checking.** It does not: spreading a budget across draws needs an allocation policy nobody specified. Answered by §6's player-directed plan.

**F6 — the central premise ("no optimizer change at all") was false, and checking it found a shipped bug.** The optimizer returned a **negative Left Over** for every shortfall above 64,801 CP, silently. Fixed 2026-08-27 00:31 EDT. Highest-value finding of either pass, and invisible from the document's text.

**F7 — the proposed `custom_id` encoding overflowed** at 107/100 once per-entry pulls and a focus pointer were included.

**F8 — the quantity control described did not exist.** A multi-select's options are checkboxes and cannot carry a per-entry quantity.

**F9 — "the first instance carries pullsDone, the rest are fresh"** could not express parallel banners at mixed progress. Escalated to a question; Harkirat chose full per-banner progress.

**F5 — cleared:** the optimizer's *interface* is right (it knows nothing about draws and takes a single integer), even though F6 proved the implementation behind it was not.
