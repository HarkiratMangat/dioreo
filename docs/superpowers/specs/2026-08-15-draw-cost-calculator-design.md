---
kind: spec
status: frozen
---

# `/draw calculator` — lucky-draw cost calculator + CP package optimizer — design

**Date:** 2026-08-15 13:51 EDT · **Branch line:** `v3-pre-release` (at `3962df4`, v3.25.0-pre) · **Author:** Harkirat + Claude (Opus 5)

## Context

`/draw prices` is a static reference table. It answers "what does this draw cost end to end", across three CP regions and four pages, and every number on it is derived from raw per-pull arrays so a wrong figure can only ever exist in one place.

What it cannot answer is the question players actually arrive with: *"I've already done two pulls on this draw — how much more do I need, and what should I buy to get there without wasting money?"* That has two halves, and they are genuinely independent problems. The first is arithmetic over data the bot already holds. The second is a purchase-optimization problem over data the bot does not hold yet: the six in-game CP packages.

The second half is where the feature earns its place. A player who needs 5,000 more CP and holds 3,000 has a shortfall of 2,000, and the obvious move — buy the package that covers 2,000 on its own — is frequently not the cheapest way to get there. Telling them so, in money, is the point of the feature.

## Decisions

Settled with Harkirat on 2026-08-15. Recorded here so they are not re-litigated.

| # | Decision | Why |
|---|---|---|
| 1 | Lives at `/draw calculator`, a subcommand of the existing `draw` group | Sits beside the pricing data it reads. Inherits the CP Emerald accent and the region model |
| 2 | The finish line is a **user input**, never a baked default | Harkirat: the target "would change depending on what the user wants" — their scenario, not our assumption |
| 3 | The Double CP entitlement is a **user input**, never assumed | Same reasoning. We cannot know what they have used |
| 4 | Interactive panel + modal, not slash options alone | Matches the rest of the bot, and lets a user re-run with different numbers without retyping |
| 5 | The two Advanced Double Legendary draws are **out of v1** | Their three purchase modes make "pulls done" ambiguous. `/draw prices` already carries their hand-built strategy breakdowns, so the gap is small |
| 6 | Headline is the **guaranteed worst case**, no luck modelling | Matches the "assume no lucky pull" framing already used on `/draw prices`' strategy lines. Expected value would need per-item odds nothing stores |
| 7 | Show **cheapest-money and least-waste side by side** when they differ | Leftover CP is not destroyed — it stays in the account. Money is the only real cost, but the tradeoff is the user's to make |
| 8 | **One global package table**, priced in USD | Harkirat, measured against the real store: package CP and price are identical across regions and countries; only the currency label changes via Apple/Google FX. Currency is a display concern, not a data one |
| 9 | Targets and the upgrade path are **separate inputs** | Three mutually exclusive targets, plus an independent on/off for the mythic upgrade cost that stacks on any of them |
| 10 | Budget mode accepts **CP or real money** | "I have $50, how far does that get me" runs the optimizer forward and the draw math backward. Both engines, one question |
| 11 | **No database, no persistence** | See "Statelessness" below. This is a privacy decision as much as an architectural one |
| 12 | Region is **three toggle buttons on the results panel**, not a setup select | Region only changes output numbers. Harkirat: it belongs at the bottom of the result, matching `/draw prices`' existing three-button region switcher |
| 13 | The draw-type dropdown **doubles as a contextual guide** | Harkirat: picking a draw type changes what the panel explains, not just what it computes. It teaches the calculator for that specific draw while selecting it |
| 14 | Inputs that don't apply to a draw type **are not rendered** | The upgrade toggle exists only for the two mythic draws. Same principle applies to any future per-type input |
| 15 | 2X **doubles the base CP, not the advertised total** | Sourced from Harkirat's store screenshots. The $99.99 tier is 8,000 base at +35% = 10,800 normally, and 8,000 at +100% = 16,000 during the event — not 21,600 |
| 16 | Store the **base CP and the bonus percentage**, never a total | The same rule that governs `DRAW_DATA`. Both the normal and 2X totals are then derived, so a wrong figure can exist in only one place |
| 17 | A live 2X event is detected from the **calendar**, via a new explicit `isDoubleCP` flag | Harkirat: the calculator should parse calendar events and offer the 2X calculation. An explicit boolean rather than title matching, because a title pattern fails silently when a season words it differently |
| 18 | Detection **offers**, never forces | The user can always calculate at normal pricing regardless of what the calendar says. Harkirat's explicit requirement |
| 19 | During an event, **both stores are live** | Six one-shot 2X bundles plus the normal six, unbounded. Confirmed with Harkirat |

## Architecture

### The registration constraint — verified, not assumed

`bot/registry.js:loadCommandModules()` keys every module by `command.data.name` into `client.commands`, and pushes each `data` into the single REST `PUT`. Two files both exporting `setName('draw')` would therefore register a **duplicate** `draw` command and silently overwrite each other in the Collection.

`/draw calculator` therefore **cannot** be a standalone command file with its own `data` export. It must be added to the builder that already owns the `draw` group.

### File layout

| File | Status | Role |
|---|---|---|
| `commands/drawprices.js` | modified | Keeps the `draw` group builder; **gains** `.addSubcommand('calculator')`. `execute()` dispatches on `getSubcommand()` and delegates the calculator branch |
| `commands/drawCalculator.js` | new | The calculator's `execute()`, its option-builder fragment, and its panel renderers. **Deliberately exports no `data`** |
| `utils/drawCost.js` | new | Pure remainder math over `DRAW_DATA`. Knows nothing about money |
| `utils/cpPackages.js` | new | The package table and the optimizer. Knows nothing about draws |
| `handlers/drawCalc.js` | new | Owns the `calc_*` interaction prefixes. Registered in `handlers/router.js` beside `handleDrawpricesInteraction` |
| `models/SeasonalData.js` | modified | `calendar[]` sub-schema gains `isDoubleCP: { type: Boolean, default: false }` |
| `commands/manage.js` + `handlers/manage/calendar.js` | modified | A toggle to set `isDoubleCP` on a calendar entry, audited like the page's other writes |

> ⚠️ **`commands/drawCalculator.js` must not export `data`.** The folder sweep in `loadCommandModules()` only registers modules having *both* `data` and `execute`, so a module exporting only `execute` and builders is safely ignored by registration while staying requireable. A future session will read the missing export as an oversight and "fix" it, which would register a second `draw` command. This is called out in the rule file for the same reason.

### Why the two utils are separate

`drawCost` takes `(region, drawKey, pullsDone, target)` and returns CP. `cpPackages` takes `(shortfallCP, entitlements)` and returns ranked purchase combinations. Neither imports the other; the command module is the only thing that knows both exist. Each is a pure function over static data, so both are testable by a plain node script with no bot running and no Discord mocking — which is what makes Phase 1 below independently verifiable.

## The flow

### Two stages, because of the component cap

Discord counts components recursively against a hard ceiling of 40, and exceeding it has already caused a real production crash in this repo. A single panel carrying every input plus every result line prices out around **31 components** — under the cap, but with almost no headroom on precisely the section most likely to grow.

- **Stage A — Setup.** Selects only: draw type, target, Double CP entitlement. Plus an **Enter your numbers** button (opens the modal) and **Calculate**.
- **Stage B — Results.** The full breakdown, a **region toggle row**, and **Edit inputs** returning to Stage A.

**Region does not belong in setup.** It changes only the output numbers, never how the calculation is framed, so it sits as three toggle buttons at the bottom of the *results* — reusing the exact convention `/draw prices` already established: one button per `REGION_ORDER` entry, current region disabled and style 1 (Primary), the other two enabled and style 2 (Secondary), each carrying its own `region10Cp` / `region20Cp` / `region30Cp` icon via `REGION_EMOJI_KEY`. Moving it out of Stage A also buys back components on the setup screen.

**The draw-type dropdown is also the guide.** Selecting a draw changes what the panel *explains*, not merely what it computes — how many pulls that draw has, whether it has an upgrade path, what "finishing" means for it. A player who has never used the calculator is taught it by the act of choosing their draw, which removes the need for a separate help screen.

**Inputs that cannot apply are not rendered.** The upgrade toggle appears only for `mythicWeapon` and `mythicCharacter`, and only where `upgrade` data exists — so it is absent for the seven other draws and absent for mythics at `region_20`. This is the general rule for any future per-type input, not a special case for upgrades.

### The modal

Discord modals cannot contain select menus and cap at five text inputs, so the split between categorical and numeric input is forced rather than stylistic. The modal carries at most three fields: **pulls already done**, **current CP balance**, and **target value** (the pull number or the budget, depending on the chosen target). Everything categorical stays on the panel as a select or a button, which is what keeps the modal at three fields rather than the five-field ceiling — a deliberate goal, since a long modal is the least pleasant surface Discord offers.

`showModal()` must be the direct response to the button interaction. It cannot follow a `deferReply`/`deferUpdate` — a constraint already documented in `handlers/autobuild.js`.

Numeric parsing must be lenient about how people actually type: `3,000`, `3000`, `3k`, and stray whitespace all mean the same thing.

### Statelessness

All wizard state rides in the `customId`, in the same spirit as the existing `price_region_{10|20|30}_{currentPage}` encoding. A compact form such as `calc~r10~d3~p2~tF~b3000~e5` sits far inside Discord's 100-character limit even at maximum values.

This is deliberate and load-bearing beyond tidiness. Persisting a user's CP balance, spending progress, and purchase history would introduce new per-user financial-adjacent data, which drags in a `PRIVACY.md` Appendix A entry, a `§2` update, and the `privacy-inventory` docs-audit gate. Remaining stateless avoids all of it. **Do not add a model for this later without treating the privacy documentation as part of the same change.**

**This is also what makes the region toggle instant, with no cache.** Harkirat's instinct was to precompute all three regions so switching is free; the stateless design gets there more simply. Because every input already rides in the `customId`, a region button click recomputes the entire result — draw remainder, shortfall, and both optimizer passes — from scratch. That is three optimizer runs' worth of work at most a few million integer operations, which is far below the latency of the Discord round trip itself. **There is nothing to cache and nothing to invalidate.** The user-visible effect Harkirat wanted — flip regions without re-entering anything — falls out of the `customId` encoding rather than out of precomputation.

A useful consequence: because the other two regions are free to compute at any moment, the region reality-check line (Results item 9) can cite their real figures rather than describing the multiplier in the abstract.

### Input ergonomics

The user enters **pulls already done**, and the panel echoes back the derived figure — *"that's 940 CP spent so far."* People remember what they have spent more reliably than how many pulls they have taken, so the echo lets them catch a miscount themselves without a second, ambiguous input field that would need conflict resolution.

## The draw math (`utils/drawCost.js`)

`DRAW_DATA[region][drawKey].draws` is an ascending per-pull cost array. Everything below is a slice or a sum of it; nothing is hand-typed, matching the rule that governs the rest of the pricing data.

- **Spent so far** = `sum(draws[0 .. pullsDone-1])`
- **Remaining to finish** = `sum(draws[pullsDone .. len-1])`
- **Remaining to pull N** = `sum(draws[pullsDone .. N-1])`
- **Pulls remaining** = `len - pullsDone`
- **Upgrade cost** = `upgrade.perDraw * upgrade.count`, added only when the toggle is on *and* `upgrade` exists
- **Budget mode** = walk the prefix sums from `pullsDone` and return the furthest pull reachable within the budget, plus the CP still short of the next pull

⚠️ **Pull counts are not uniformly ten.** `sevenSpinLegendaryWeapon` and `pickYourRewardCard` are seven-pull draws. Every bound above derives from `draws.length`; hardcoding `10` anywhere is a bug that will pass casual testing on the common draws.

## The optimizer (`utils/cpPackages.js`)

### The package model

Six packages, one global table. Sourced from Harkirat's own store screenshots on 2026-08-15.

Each entry stores **base CP and bonus percentage only** — never a total. This is the same rule that governs `DRAW_DATA`, and it matters here for a specific reason: the advertised store number already has the bonus folded in, so storing it directly would make the 2X figure impossible to derive correctly.

| Base CP | Normal bonus | Normal total | 2X total | Price |
|---|---|---|---|---|
| 80 | — | 80 | 160 | $0.99 |
| 400 | +5% | 420 | 800 | $4.99 |
| 800 | +10% | 880 | 1,600 | $9.99 |
| 2,000 | +20% | 2,400 | 4,000 | $24.99 |
| 4,000 | +25% | 5,000 | 8,000 | $49.99 |
| 8,000 | +35% | 10,800 | 16,000 | $99.99 |

Shape: `{ id, baseCp, bonusPct, priceUSD }`. Normal total = `baseCp * (1 + bonusPct)`. 2X total = `baseCp * 2`.

> ⚠️ **2X doubles the BASE, not the advertised total.** The $99.99 tier yields 16,000 during an event, not 21,600. Every base above is corroborated by the event screenshot's own `80+80` / `400+400` / `800+800` / `2000+2000` / `4000+4000` / `8000+8000` labelling. Getting this wrong overstates the top tier by 5,600 CP and would send a player a materially wrong purchase recommendation.

**Prices are identical worldwide.** Only the currency label changes — the same tiers render as `Rs 300 … Rs 24,900` on an Indian store and `$0.99 … $99.99` on a US one, via the platform's own FX. USD is therefore the canonical unit, and any local-currency display is presentation, not data.

### Why the optimizer is not a rule of thumb

CP per dollar is **monotonically increasing** under normal pricing — 80.8, 84.2, 88.1, 96.0, 100.0, 108.0 — so bigger packages are strictly better value and the optimizer will tend toward the largest that fits.

Under 2X it is **almost perfectly flat** — 161.6, 160.3, 160.2, 160.1, 160.0, 160.0 — with the *smallest* tier marginally the best. So during an event the winning strategy inverts: minimize overshoot rather than buy big.

Two genuinely different strategies from one algorithm is the argument for computing this rather than publishing a tip.

### The Double CP event

A recurring limited-time promotion, not a once-per-account bonus. While it runs, each of the six packages may be bought **once** at +100% instead of its normal bonus, at the same price. Those entitlements reset when a later event begins. The normal store stays fully available and unbounded throughout.

The optimizer therefore sees, during an event: **six bounded one-shot items** (the unused 2X entitlements) plus **six unbounded items** (the normal packages). Outside an event, only the latter.

### Calendar detection

`SeasonalData.calendar[]` entries are `{ title, date, endDate, isOngoing, category }`. A new boolean **`isDoubleCP`** is added to that sub-schema, set by a toggle on `/manage`'s Calendar page.

Detection reuses the liveness logic `commands/calendar.js` already has for its `active` filter mode (`calendar.js:69-73`) rather than reimplementing a date comparison: an entry is live when it is ongoing, or when now falls within `date`..`endDate`.

When a live `isDoubleCP` entry exists, the panel **offers** the 2X calculation and surfaces the event's own end date. The user may always switch back to normal pricing — detection never forces the mode. When no such entry exists, the panel still lets the user assert an event is running, because the calendar may simply not have been updated yet.

> ⚠️ **Schema-gotcha invariant applies.** `isDoubleCP` must be added to the Mongoose sub-schema in the same change as the code that sets it, or it will appear to work in memory and silently vanish on the next fetch. This repo has shipped that exact bug before. The `/manage` write path should also flow through the existing `ChangeLog` audit capture like the page's other fields.

### The algorithm

Minimize real money subject to `totalCP >= shortfall`.

- Base packages are **unbounded** — buyable repeatedly
- Unused Double CP entitlements are **bounded at one each** — `baseCp * 2` CP, same `priceUSD`
- DP over CP `0..shortfall`, where buying package *i* moves state `c -> min(shortfall, c + cp_i)`, so overshoot collapses into the terminal state naturally and `dp[shortfall]` is the cheapest cover
- The bounded items add a subset dimension: at most `2^6 = 64` DP runs over an array of at most ~30,000. A few million integer operations — instant, and no cleverness is warranted
- **Least waste** is a second pass minimizing `totalCP - shortfall`, tiebreaking on price

Both results are reported when they differ; when they coincide, one recommendation is shown.

## Results content

1. **Headline** — CP still needed, and **pulls remaining**. Both, because the question is asked both ways
2. **Spent so far** — free from the same array, and the self-correction hook described above
3. **Remaining pull sequence** — rendered in the `cumulativeSequence` style `/draw prices` already uses, so the surface reads as native rather than bolted on
4. **Upgrade add-on** — a separate line, only where `upgrade` data genuinely exists
5. **Balance to shortfall** — stated plainly as arithmetic, not implied
6. **The already-covered branch** — *"You already have enough. Buy nothing."* A first-class outcome, not a fallback. It is the best possible answer a spend-minimizer can give and it is the easiest one to forget to build
7. **Cheapest-money combo** and **least-waste combo**, side by side when they differ — each with what to buy, total price, CP received, and leftover
8. **The savings callout** — the recommendation measured against the naive choice, meaning the smallest single package that covers the shortfall on its own: *"saves you $X versus buying the ___ pack."* Without this line the optimizer's work is invisible to the user, and this line is the feature's stated purpose
9. **The region reality check** — because packages cost the same everywhere while draws cost up to three times more, a 30 CP region player pays roughly three times the real money for identical rewards. Worth one plain sentence
10. **Share button** and a `mentionCommand` link back to `/draw prices`
11. **An estimate disclaimer** — store prices vary with local tax and FX

### Degradation

Where data genuinely does not exist, the calculator says so and never interpolates:

- `doubleEpicCharacters` is `null` at **both** `region_20` and `region_30`
- `mythicWeapon` / `mythicCharacter` carry no `upgrade` at `region_20`

Both absences are deliberate prior decisions — Harkirat explicitly refused to ship a speculative estimate as real pricing. The calculator reuses the existing "haven't done the research yet" placeholder convention rather than inventing a new empty state, and the upgrade toggle simply does not render where there is no upgrade data.

## Out of scope for v1

- The two Advanced Double Legendary draws (decision 5) — v2
- Expected-value or odds-weighted costs — needs per-item odds nothing currently stores
- Cross-region comparison as an interactive feature — the region is a property of the player's store, not a choice they can act on, so item 9 above states it in one line instead
- Auto-detecting whether a Double CP event is live. Plausible later via admin-maintained seasonal data, which would let the panel default the answer instead of asking — recorded as a v2 idea, not built

## Testing

**Phase 1 is verifiable with no bot running**, which is the point of the module split:

- `drawCost` against every `(region, drawKey)` pair including the seven-pull draws and the null entries, asserting that remaining + spent equals the full total for every `pullsDone` from 0 to `len`
- `cpPackages` against hand-checked shortfalls, plus a brute-force cross-check on small inputs to prove the DP agrees with exhaustive enumeration
- Boundary cases: zero shortfall, shortfall below the smallest package, shortfall above any single package, every entitlement used, none used
- A derivation guard asserting each package's computed normal total equals the store's advertised figure (80 / 420 / 880 / 2,400 / 5,000 / 10,800) and each 2X total equals `baseCp * 2` (160 / 800 / 1,600 / 4,000 / 8,000 / 16,000). This is the check that would have caught the double-the-total misreading

**Phase 2** needs the dev bot (`node --watch --env-file=.env.dev index.js`) and a real click-through, plus a `buildContainer()` JSON dump to **verify** the component count against the 40 cap rather than eyeballing it — the method already used for the Advanced page.

## Phases

1. **Pure math** — `utils/drawCost.js`, `utils/cpPackages.js`, and their test scripts. No Discord surface, no bot required
2. **Calendar plumbing** — the `isDoubleCP` schema field and its `/manage` toggle. Independent of Phase 1 and independently testable against the dev bot's local Mongo
3. **The Discord surface** — subcommand wiring, two-stage panel, modal, `handlers/drawCalc.js`, router registration, calendar detection wired in
4. **Records** — `/help` entry, `.claude/rules/draw-prices.md` (or a new calculator rule), `docs/README.md` if a new rule file lands, changelog entry, `package.json` bump

**Nothing is blocked.** The package values arrived on 2026-08-15 and are recorded above, so Phase 1 can be written and verified end to end. Phases 1 and 2 are independent of each other and could be done in either order, or in parallel by different sessions.
