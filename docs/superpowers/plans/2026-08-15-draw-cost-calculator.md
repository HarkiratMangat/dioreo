---
kind: plan
status: frozen
---

# `/draw calculator` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/draw calculator` — tells a player how much more CP they need to finish a lucky draw from where they are, then works out the cheapest real-money way to buy that CP.

**Architecture:** Two pure, independent engines (`utils/drawCost.js` for draw remainder math over the existing `DRAW_DATA` arrays, `utils/cpPackages.js` for the package table and a DP purchase optimizer) sit under a two-stage Components V2 panel. All wizard state rides in the `customId`, so nothing is persisted and there is no cache to invalidate. A new `isDoubleCP` flag on `SeasonalData.calendar[]` lets the panel detect a live 2X CP event and offer that pricing.

**Tech Stack:** Node 24 (CommonJS), discord.js v14 Components V2, Mongoose, plain `node scripts/*.test.js` test scripts chained in `npm test`.

**Spec:** `docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Branch:** `feat/draw-cost-calculator`, already created off `v3-pre-release` (at `3962df4`, v3.25.0-pre). Do not branch off `main`.
- **PR base:** `--base v3-pre-release`. The `gh` default is `main` and would be wrong.
- **Version:** `v3-pre-release` uses MODERATE bumps only — `v3.25.0-pre` → `v3.26.0-pre`. The trailing `0` never moves. No tags during pre-release.
- **Never hand-type a derived number.** Store base values; derive totals. This governs `DRAW_DATA` and now the package table too.
- **Components V2:** `flags: 32768`. Max **40 components counted recursively**. Selects and buttons need an Action Row (type 1) wrapper even inside a Container. Button labels are plain text — emoji go in the `emoji:` field.
- **`showModal()` must never follow a defer.** It has to be the direct response to the button interaction.
- **Handler contract:** one exported `async` function, returns `true` when it consumed the interaction, `false` to fall through. A handler serving more than one interaction type must **type-test every branch** (`isButton()` / `isStringSelectMenu()` / `isModalSubmit()`).
- **Schema gotcha:** Mongoose persists only fields declared in the schema. Any new field is added to `models/` in the same change.
- **No new per-user persistence.** No model, no stored balance. See the spec's Statelessness section — this is a privacy decision.
- **Markdown prose is soft-wrapped** — one logical line per paragraph. `npm run docs:reflow` enforces it.
- **Commits:** Conventional Commits (`<type>(<scope>): <desc>`, lowercase, imperative, no trailing period), and every commit ends with both co-author trailers:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Co-Authored-By: diorswrld <310361322+diorswrld@users.noreply.github.com>
```

- **Money is stored in integer cents**, never floats. `9999`, not `99.99`. Display formats at render time.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `utils/cpPackages.js` | create | The six-package table and the purchase optimizer. Knows nothing about draws |
| `utils/drawCost.js` | create | Draw remainder / spent-so-far / budget math. Knows nothing about money |
| `commands/drawCalculator.js` | create | Panel rendering and `execute()`. **Exports no `data`** |
| `handlers/drawCalc.js` | create | Owns `calc_*` interaction prefixes |
| `scripts/cpPackages.test.js` | create | Package derivation guard + optimizer correctness |
| `scripts/drawCost.test.js` | create | Remainder conservation across every draw and region |
| `scripts/drawCalcBudget.test.js` | create | 40-component cap, modelled on `colorPanelBudget.test.js` |
| `commands/drawprices.js` | modify | Export the data tables; add the `calculator` subcommand; dispatch on `getSubcommand()` |
| `models/SeasonalData.js` | modify | `calendar[]` gains `isDoubleCP` |
| `handlers/router.js` | modify | Register `handleDrawCalcInteraction` |
| `package.json` | modify | Add the three test scripts to the `test` chain; version bump |

---

## Task 1: The CP package table

**Files:**
- Create: `utils/cpPackages.js`
- Test: `scripts/cpPackages.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `CP_PACKAGES` (array), `CURRENCIES` (all 41 codes, sorted), `normalCp(pkg) -> number`, `doubleCp(pkg) -> number`, `priceOf(pkg, currency) -> number`, `countryOf(currency) -> string`, `formatMoney(amount, currency) -> string`

- [ ] **Step 1: Write the failing test**

Create `scripts/cpPackages.test.js`:

```js
// Derivation guard for the CP package table (utils/cpPackages.js, 2026-08-15 15:29 EDT).
// Design: docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md.
//
// WHAT THIS IS FOR. The store advertises a number that ALREADY includes the bonus (10,800 CP is
// 8,000 base + 35%). During a 2X event the same package gives 8,000 base + 100% = 16,000 -- NOT
// double the advertised 10,800. The first draft of this design got that wrong by 5,600 CP at the
// top tier. These tests pin both derivations against the real store figures.

const assert = require('assert');
const { CP_PACKAGES, CURRENCIES, normalCp, doubleCp, priceCents, formatMoney } = require('../utils/cpPackages');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
}

// Real figures read off Harkirat's own store screenshots, 2026-08-15 15:06 EDT.
const ADVERTISED_NORMAL = [80, 420, 880, 2400, 5000, 10800];
const ADVERTISED_2X = [160, 800, 1600, 4000, 8000, 16000];
const PRICES_CENTS = { USD: [99, 499, 999, 2499, 4999, 9999], EUR: [99, 599, 999, 2999, 5999, 9999], CAD: [99, 699, 1299, 3499, 6999, 12999] };

check('the table has exactly six packages', () => {
    assert.strictEqual(CP_PACKAGES.length, 6);
});

check('normal totals match the advertised store figures', () => {
    assert.deepStrictEqual(CP_PACKAGES.map(normalCp), ADVERTISED_NORMAL);
});

check('2X totals are double the BASE, not double the advertised total', () => {
    assert.deepStrictEqual(CP_PACKAGES.map(doubleCp), ADVERTISED_2X);
});

check('prices are integer cents in every supported currency', () => {
    for (const cur of CURRENCIES) {
        assert.deepStrictEqual(CP_PACKAGES.map(p => priceCents(p, cur)), PRICES_CENTS[cur], `${cur} prices differ`);
        CP_PACKAGES.forEach(p => assert.ok(Number.isInteger(priceCents(p, cur)), `${p.id}/${cur} is not an integer`));
    }
});

check('every package has a price in every supported currency', () => {
    CP_PACKAGES.forEach(p => CURRENCIES.forEach(cur => {
        assert.ok(typeof p.price[cur] === 'number', `${p.id} has no ${cur} price -- a missing currency would make the optimizer silently skip that package`);
    }));
});

// Pins the finding that justifies the whole optimizer: value is monotonic in USD but NOT in EUR or
// CAD. If a future price edit makes all three monotonic, "just buy the biggest" becomes correct and
// this test SHOULD fail so someone re-reads the design rather than leaving a solver with no job.
check('value ordering is non-monotonic outside USD', () => {
    const rate = (p, cur) => normalCp(p) / priceCents(p, cur);
    const isMonotonic = cur => CP_PACKAGES.every((p, i) => i === 0 || rate(p, cur) >= rate(CP_PACKAGES[i - 1], cur));
    assert.ok(isMonotonic('USD'), 'USD should be monotonically better value as packs get bigger');
    assert.ok(!isMonotonic('EUR'), 'EUR was monotonic -- re-check the price table against the real store');
    assert.ok(!isMonotonic('CAD'), 'CAD was monotonic -- re-check the price table against the real store');
});

check('no package stores a pre-computed total', () => {
    CP_PACKAGES.forEach(p => {
        assert.ok(!('cp' in p) && !('totalCp' in p),
            `${p.id} stores a total; totals must be derived so a wrong figure can exist in one place only`);
    });
});

check('formatMoney renders cents with the right symbol', () => {
    assert.strictEqual(formatMoney(99, 'USD'), '$0.99');
    assert.strictEqual(formatMoney(12999, 'CAD'), 'CA$129.99');
});

console.log(failures === 0 ? `\nAll CP package checks passed (${CP_PACKAGES.length} packages).` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/cpPackages.test.js` Expected: FAIL — `Cannot find module '../utils/cpPackages'`

- [ ] **Step 3: Write the implementation**

Create `utils/cpPackages.js`:

```js
// ==========================================
// CP PACKAGE TABLE + PURCHASE OPTIMIZER
// ==========================================
// The six in-game COD Points packages, and the optimizer that works out the cheapest real-money way
// to cover a CP shortfall. Deliberately knows NOTHING about draws -- utils/drawCost.js works out how
// much CP is needed, this module works out how to buy it. Design:
// docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md.
//
// STORES BASE CP + BONUS PERCENTAGE, NEVER A TOTAL. Same rule DRAW_DATA follows, and it matters more
// here than it looks: the store's advertised number ALREADY has the bonus folded in (10,800 CP is
// 8,000 base + 35%), so storing the advertised figure makes the 2X number impossible to derive.
// During a 2X CP event a package gives base x 2 -- so the $99.99 tier yields 16,000, NOT double the
// advertised 10,800. Sourced from Harkirat's own store screenshots, 2026-08-15 15:06 EDT.
//
// PRICES ARE IDENTICAL WORLDWIDE. Only the currency label differs (the same tiers show as Rs 300 --
// Rs 24,900 on an Indian store), converted by the platform's own FX. USD cents is the canonical unit.
//
// Money is INTEGER CENTS everywhere. Floats would accumulate error across a multi-package combo and
// make two equally-priced combos compare unequal.
// PRICES COME FROM THE COMMITTED REFERENCE FILE, NOT FROM A TABLE IN THIS MODULE.
// docs/reference/cp-package-prices.json holds all 41 currencies the official CODM web store sells
// in, captured 2026-08-15 and validated against three known-real tables plus ten live re-fetches.
// Its companion .md documents provenance and the eight re-crawl traps.
//
// WHY A FILE AND NOT A LITERAL: Apple/Google assign price points directly PER STOREFRONT -- they are
// tier-locked, not rate-locked -- and the tiers are NOT proportional to each other. Measured: in 17
// of the 41 currencies "buy the biggest pack" is WRONG, and in NOK and SEK the SMALLEST pack is the
// best value in the store. Never derive a currency by converting from USD.
const PRICE_DATA = require('../docs/reference/cp-package-prices.json');

// Bundle CP amounts are identical in every storefront -- only prices vary.
const CP_PACKAGES = PRICE_DATA.inGameBundlesCp.map((baseTotal, i) => ({
    id: `cp${[80, 400, 800, 2000, 4000, 8000][i]}`,
    baseCp: [80, 400, 800, 2000, 4000, 8000][i],
    bonusPct: [0, 0.05, 0.10, 0.20, 0.25, 0.35][i],
    tierIndex: i
}));

const CURRENCIES = Object.keys(PRICE_DATA.currencies).sort();

// prices[] are MAJOR units as the store displays them, deliberately -- currencies here differ in
// exponent (JPY and CLP have none, KWD and BHD have three), so a blanket "multiply by 100" is wrong.
function priceOf(pkg, currency) { return PRICE_DATA.currencies[currency].prices[pkg.tierIndex]; }
function countryOf(currency) { return PRICE_DATA.currencies[currency].country; }

// Math.round rather than a bare multiply: 0.05/0.10/0.20/0.25/0.35 are not exact in binary floating
// point, so 400 * 1.05 can land on 420.00000000000006. Every real value here is a whole number of CP.
function normalCp(pkg) { return Math.round(pkg.baseCp * (1 + pkg.bonusPct)); }

// A 2X CP event replaces the package's normal bonus with +100%, so it is base x 2 -- never
// normalCp(pkg) x 2. See this module's header comment; getting this wrong overstates the top tier.
function doubleCp(pkg) { return pkg.baseCp * 2; }

function formatMoney(cents, currency) { return `${CURRENCY_SYMBOL[currency]}${(cents / 100).toFixed(2)}`; }

module.exports = { CP_PACKAGES, CURRENCIES, normalCp, doubleCp, priceCents, formatMoney };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/cpPackages.test.js` Expected: PASS — all six checks green.

- [ ] **Step 5: Commit**

```bash
git add utils/cpPackages.js scripts/cpPackages.test.js && git commit -m "feat(calculator): CP package table with derived normal and 2X totals"
```

---

## Task 2: The purchase optimizer

**Files:**
- Modify: `utils/cpPackages.js`
- Modify: `scripts/cpPackages.test.js`

**Interfaces:**
- Consumes: `CP_PACKAGES`, `normalCp`, `doubleCp` from Task 1
- Produces: `optimizePurchase(shortfallCp, { currency, doubleCpAvailable, maxTransactions }) -> { cheapest, leastWaste, naive }` where each result is `{ combo: [{ id, count, mode, cpEach, priceCents }], totalCents, totalCp, leftoverCp, transactions }`, or `null` when `shortfallCp <= 0`. `currency` defaults to `'USD'`, `maxTransactions` to `6`

- [ ] **Step 1: Write the failing tests**

Append to `scripts/cpPackages.test.js`, **before** the final `console.log`:

```js
const { optimizePurchase } = require('../utils/cpPackages');

// Exhaustive reference implementation. Deliberately dumb and obviously correct, so it can falsify
// the DP rather than merely agree with it. Only usable on small shortfalls -- that is the point.
function bruteForce(shortfall, maxEach = 4) {
    let best = null;
    const n = CP_PACKAGES.length;
    const counts = new Array(n).fill(0);
    const recurse = (i) => {
        if (i === n) {
            const cp = counts.reduce((s, c, j) => s + c * normalCp(CP_PACKAGES[j]), 0);
            if (cp < shortfall) return;
            const cents = counts.reduce((s, c, j) => s + c * CP_PACKAGES[j].priceCents, 0);
            if (!best || cents < best.cents) best = { cents, cp };
            return;
        }
        for (let c = 0; c <= maxEach; c++) { counts[i] = c; recurse(i + 1); }
        counts[i] = 0;
    };
    recurse(0);
    return best;
}

check('a covered shortfall needs no purchase', () => {
    assert.strictEqual(optimizePurchase(0, {}), null);
    assert.strictEqual(optimizePurchase(-500, {}), null);
});

check('the DP agrees with brute force on small shortfalls', () => {
    for (const shortfall of [1, 79, 80, 81, 420, 900, 2401, 5000, 7500]) {
        const dp = optimizePurchase(shortfall, {});
        const bf = bruteForce(shortfall);
        assert.strictEqual(dp.totalCents, bf.cents,
            `shortfall ${shortfall}: DP said ${dp.totalCents}c, brute force found ${bf.cents}c`);
    }
});

check('every result actually covers the shortfall', () => {
    for (const shortfall of [1, 500, 3333, 12000, 29999]) {
        const r = optimizePurchase(shortfall, {});
        assert.ok(r.totalCp >= shortfall, `shortfall ${shortfall}: only got ${r.totalCp}`);
        assert.strictEqual(r.leftoverCp, r.totalCp - shortfall);
    }
});

check('combo prices and CP sum to the reported totals', () => {
    const r = optimizePurchase(13000, {});
    const cents = r.combo.reduce((s, c) => s + c.count * c.priceCents, 0);
    const cp = r.combo.reduce((s, c) => s + c.count * c.cpEach, 0);
    assert.strictEqual(cents, r.totalCents);
    assert.strictEqual(cp, r.totalCp);
});

check('least-waste never overshoots more than cheapest', () => {
    for (const shortfall of [130, 950, 4100, 11000]) {
        const r = optimizePurchase(shortfall, {});
        assert.ok(r.leastWaste.leftoverCp <= r.cheapest.leftoverCp,
            `shortfall ${shortfall}: least-waste wasted more than cheapest`);
        assert.ok(r.leastWaste.totalCents >= r.cheapest.totalCents,
            `shortfall ${shortfall}: least-waste was cheaper, so cheapest was not optimal`);
    }
});

check('a 2X entitlement is used at most once each', () => {
    const all = CP_PACKAGES.map(p => p.id);
    const r = optimizePurchase(20000, { doubleCpAvailable: all });
    r.combo.filter(c => c.mode === 'double')
        .forEach(c => assert.ok(c.count <= 1, `${c.id} used ${c.count} times as a 2X purchase`));
});

check('2X entitlements make a given shortfall cheaper, never dearer', () => {
    const all = CP_PACKAGES.map(p => p.id);
    for (const shortfall of [5000, 16000, 25000]) {
        const without = optimizePurchase(shortfall, {});
        const with2x = optimizePurchase(shortfall, { doubleCpAvailable: all });
        assert.ok(with2x.totalCents <= without.totalCents,
            `shortfall ${shortfall}: 2X came out more expensive (${with2x.totalCents} vs ${without.totalCents})`);
    }
});

check('naive baseline is the smallest single package that covers it alone', () => {
    const r = optimizePurchase(900, {});
    assert.strictEqual(r.naive.totalCp, 2400, 'expected the 2,400 CP package as the naive cover for 900');
    assert.ok(r.naive.totalCents >= r.cheapest.totalCents);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/cpPackages.test.js` Expected: FAIL — `optimizePurchase is not a function`

- [ ] **Step 3: Write the implementation**

Append to `utils/cpPackages.js`, before `module.exports`:

```js
// ==========================================
// THE OPTIMIZER
// ==========================================
// Minimize real money subject to totalCp >= shortfall.
//
// WHY A DP AND NOT A RULE OF THUMB. Under normal pricing CP-per-dollar rises monotonically
// (80.8 -> 108.0), so bigger is strictly better value and the answer is usually "buy big". During a
// 2X event it is almost perfectly FLAT (161.6 -> 160.0), with the SMALLEST tier marginally best --
// so the winning strategy inverts to "minimize overshoot". Two opposite strategies from one table is
// exactly the case a solver earns its place on.
//
// STRUCTURE. Normal packages are unbounded (buy as many as you like). Unused 2X entitlements are
// bounded at one each. Rather than a bitmask DP over both, note there are only 6 possible bounded
// items: enumerate all 64 subsets of the AVAILABLE ones, and for each, look up the unbounded DP for
// whatever shortfall remains. The unbounded DP is computed once and reused across all 64.
const MAX_DP_CP = 60000; // Well above any real shortfall; the largest full draw + upgrades is ~24k.

// dp[c] = the best way to obtain AT LEAST c CP using unbounded normal packages.
// `better(a, b)` decides which of two candidate states wins, so the same routine serves both the
// cheapest-money pass and the least-waste pass without duplicating the recurrence.
function buildUnboundedDp(limit, better) {
    const dp = new Array(limit + 1);
    dp[0] = { cents: 0, cp: 0, from: -1 };
    for (let c = 1; c <= limit; c++) {
        let best = null;
        for (let i = 0; i < CP_PACKAGES.length; i++) {
            const pkg = CP_PACKAGES[i];
            const prev = dp[Math.max(0, c - normalCp(pkg))];
            const cand = { cents: prev.cents + pkg.priceCents, cp: prev.cp + normalCp(pkg), from: i };
            if (!best || better(cand, best)) best = cand;
        }
        dp[c] = best;
    }
    return dp;
}

function walkDp(dp, target) {
    const counts = new Map();
    let c = target;
    while (c > 0) {
        const pkg = CP_PACKAGES[dp[c].from];
        counts.set(pkg.id, (counts.get(pkg.id) || 0) + 1);
        c = Math.max(0, c - normalCp(pkg));
    }
    return counts;
}

const CHEAPEST = (a, b) => (a.cents !== b.cents ? a.cents < b.cents : a.cp < b.cp);
const LEAST_WASTE = (a, b) => (a.cp !== b.cp ? a.cp < b.cp : a.cents < b.cents);

function solve(shortfallCp, availableIds, better) {
    const bounded = CP_PACKAGES.filter(p => availableIds.includes(p.id));
    const dp = buildUnboundedDp(Math.min(shortfallCp, MAX_DP_CP), better);
    let best = null;

    // Enumerate every subset of the available 2X entitlements. At most 2^6 = 64 iterations.
    for (let mask = 0; mask < (1 << bounded.length); mask++) {
        let cents = 0, cp = 0;
        const used = [];
        for (let i = 0; i < bounded.length; i++) {
            if (mask & (1 << i)) {
                cents += bounded[i].priceCents;
                cp += doubleCp(bounded[i]);
                used.push(bounded[i]);
            }
        }
        const remaining = Math.max(0, shortfallCp - cp);
        const tail = dp[remaining];
        const cand = { cents: cents + tail.cents, cp: cp + tail.cp, used, remaining };
        if (!best || better(cand, best)) best = cand;
    }

    const combo = best.used.map(p => ({ id: p.id, count: 1, mode: 'double', cpEach: doubleCp(p), priceCents: p.priceCents }));
    for (const [id, count] of walkDp(dp, best.remaining)) {
        const pkg = CP_PACKAGES.find(p => p.id === id);
        combo.push({ id, count, mode: 'normal', cpEach: normalCp(pkg), priceCents: pkg.priceCents });
    }
    return { combo, totalCents: best.cents, totalCp: best.cp, leftoverCp: best.cp - shortfallCp };
}

// The baseline the savings callout measures against: the smallest SINGLE package that covers the
// whole shortfall on its own -- the move a player makes without a calculator. Falls back to the
// largest package when nothing covers it alone.
function naiveCover(shortfallCp) {
    const fit = CP_PACKAGES.find(p => normalCp(p) >= shortfallCp) || CP_PACKAGES[CP_PACKAGES.length - 1];
    return {
        combo: [{ id: fit.id, count: 1, mode: 'normal', cpEach: normalCp(fit), priceCents: fit.priceCents }],
        totalCents: fit.priceCents,
        totalCp: normalCp(fit),
        leftoverCp: normalCp(fit) - shortfallCp
    };
}

// maxTransactions caps how many separate purchases a recommendation may involve. Without it the true
// optimum in CAD for a 5,000 CP shortfall is SIXTY-THREE $0.99 purchases ($62.37 vs $69.99 for the
// 5,000 pack) -- arithmetically right and nobody would ever do it. The DP still explores the whole
// space; the cap only filters what is OFFERED, and every result reports its own transaction count so
// the tradeoff stays visible rather than hidden.
function optimizePurchase(shortfallCp, { currency = 'USD', doubleCpAvailable = [], maxTransactions = 6 } = {}) {
    if (shortfallCp <= 0) return null;
    const opts = { currency, maxTransactions };
    const cheapest = solve(shortfallCp, doubleCpAvailable, CHEAPEST, opts);
    const leastWaste = solve(shortfallCp, doubleCpAvailable, LEAST_WASTE, opts);
    return { ...cheapest, cheapest, leastWaste, naive: naiveCover(shortfallCp, currency) };
}
```

Update the export line to `module.exports = { CP_PACKAGES, normalCp, doubleCp, formatUsd, optimizePurchase };`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node scripts/cpPackages.test.js` Expected: PASS — all checks green, including the brute-force agreement.

- [ ] **Step 5: Commit**

```bash
git add utils/cpPackages.js scripts/cpPackages.test.js && git commit -m "feat(calculator): purchase optimizer with cheapest and least-waste passes"
```

---

## Task 3: Draw remainder math

**Files:**
- Create: `utils/drawCost.js`
- Create: `scripts/drawCost.test.js`
- Modify: `commands/drawprices.js` (export the data tables)

**Interfaces:**
- Consumes: `DRAW_DATA`, `DRAW_META`, `REGION_ORDER` newly exported from `commands/drawprices.js`
- Produces: `pullCount(region, key)`, `spentSoFar(region, key, pullsDone)`, `remainingToFinish(region, key, pullsDone)`, `remainingToPull(region, key, pullsDone, targetPull)`, `upgradeCost(region, key)`, `reachableWithBudget(region, key, pullsDone, budgetCp)` — the last returning `{ pullsReachable, cpUsed, cpShortOfNext }`

- [ ] **Step 1: Export the data tables**

In `commands/drawprices.js`, add to `module.exports` above `data:`:

```js
    // Exported so utils/drawCost.js can do remainder math over the same arrays rather than keeping a
    // second copy -- a second copy is exactly the drift DRAW_DATA's own header comment exists to
    // prevent. Same pattern commands/manage.js already uses to expose PAGES to its test script.
    DRAW_DATA, DRAW_META, REGION_ORDER, REGION_EMOJI_KEY,
```

- [ ] **Step 2: Write the failing test**

Create `scripts/drawCost.test.js`:

```js
// Conservation tests for the draw remainder math (utils/drawCost.js, 2026-08-15 15:29 EDT).
// Design: docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md.
//
// WHAT THIS IS FOR. Every figure the calculator shows is a slice of DRAW_DATA's per-pull arrays, so
// the whole class of bugs available here is "the slice was taken wrong". The conservation check
// below (spent + remaining == total, for EVERY pullsDone) catches an off-by-one at any boundary in
// one assertion. It also pins the two draws that are NOT ten pulls, which is the specific mistake a
// hardcoded 10 would produce and which casual testing on the common draws would never surface.

const assert = require('assert');
const { DRAW_DATA, REGION_ORDER } = require('../commands/drawprices');
const cost = require('../utils/drawCost');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
}

const drawKeys = Object.keys(DRAW_DATA.region_10).filter(k => k !== 'label');

check('spent + remaining equals the full total at every pull position', () => {
    for (const region of REGION_ORDER) {
        for (const key of drawKeys) {
            const entry = DRAW_DATA[region][key];
            if (!entry) continue; // doubleEpicCharacters is null at region_20 and region_30
            const total = entry.draws.reduce((a, b) => a + b, 0);
            for (let done = 0; done <= entry.draws.length; done++) {
                const spent = cost.spentSoFar(region, key, done);
                const left = cost.remainingToFinish(region, key, done);
                assert.strictEqual(spent + left, total,
                    `${region}/${key} at ${done} pulls: ${spent} + ${left} != ${total}`);
            }
        }
    }
});

check('the two seven-pull draws are not treated as ten', () => {
    assert.strictEqual(cost.pullCount('region_10', 'sevenSpinLegendaryWeapon'), 7);
    assert.strictEqual(cost.pullCount('region_10', 'pickYourRewardCard'), 7);
    assert.strictEqual(cost.pullCount('region_10', 'mythicWeapon'), 10);
});

check('absent data returns null rather than a fabricated number', () => {
    assert.strictEqual(cost.remainingToFinish('region_20', 'doubleEpicCharacters', 0), null);
    assert.strictEqual(cost.remainingToFinish('region_30', 'doubleEpicCharacters', 0), null);
    assert.strictEqual(cost.upgradeCost('region_20', 'mythicWeapon'), null);
});

check('upgrade cost is perDraw times count where it exists', () => {
    assert.strictEqual(cost.upgradeCost('region_10', 'mythicWeapon'), 570 * 10);
    assert.strictEqual(cost.upgradeCost('region_10', 'mythicCharacter'), 855 * 14);
    assert.strictEqual(cost.upgradeCost('region_10', 'legendaryGunReactive'), null);
});

check('remainingToPull is a strict prefix of remainingToFinish', () => {
    const full = cost.remainingToFinish('region_10', 'mythicWeapon', 2);
    const toNine = cost.remainingToPull('region_10', 'mythicWeapon', 2, 9);
    const last = DRAW_DATA.region_10.mythicWeapon.draws[9];
    assert.strictEqual(toNine + last, full);
});

check('budget mode reports how far the money goes and what is still short', () => {
    // region_10 mythicWeapon from a standing start: 10, 30, 50, 120 -> 210 after four pulls.
    const r = cost.reachableWithBudget('region_10', 'mythicWeapon', 0, 210);
    assert.strictEqual(r.pullsReachable, 4);
    assert.strictEqual(r.cpUsed, 210);
    assert.strictEqual(r.cpShortOfNext, 200); // pull 5 costs 200
});

console.log(failures === 0 ? '\nAll draw cost checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node scripts/drawCost.test.js` Expected: FAIL — `Cannot find module '../utils/drawCost'`

- [ ] **Step 4: Write the implementation**

Create `utils/drawCost.js`:

```js
// ==========================================
// DRAW REMAINDER MATH
// ==========================================
// "I have done N pulls -- what is left?" Every figure here is a slice or a sum of DRAW_DATA's
// existing per-pull arrays; nothing is stored and nothing is hand-typed, which is the same rule
// DRAW_DATA's own header comment sets out. Deliberately knows NOTHING about money -- utils/
// cpPackages.js handles that half. Design:
// docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md.
//
// ⚠️ PULL COUNTS ARE NOT UNIFORMLY TEN. sevenSpinLegendaryWeapon and pickYourRewardCard have SEVEN
// pulls. Every bound below derives from draws.length for that reason; a hardcoded 10 would pass
// testing on the seven common draws and silently overcount on the other two.
//
// ⚠️ ABSENT DATA RETURNS null, NEVER AN ESTIMATE. doubleEpicCharacters has no data at region_20 or
// region_30, and the two mythic draws have no upgrade figure at region_20. Both gaps are deliberate
// -- Harkirat refused to ship a speculative estimate as real pricing -- so callers render the
// existing "haven't done the research yet" placeholder rather than computing around them.
const { DRAW_DATA } = require('../commands/drawprices');

function entryFor(region, key) {
    const regionData = DRAW_DATA[region];
    if (!regionData) return null;
    return regionData[key] || null;
}

function pullCount(region, key) {
    const entry = entryFor(region, key);
    return entry ? entry.draws.length : null;
}

function sumRange(draws, from, to) {
    let total = 0;
    for (let i = from; i < to; i++) total += draws[i];
    return total;
}

function spentSoFar(region, key, pullsDone) {
    const entry = entryFor(region, key);
    if (!entry) return null;
    return sumRange(entry.draws, 0, Math.min(pullsDone, entry.draws.length));
}

function remainingToFinish(region, key, pullsDone) {
    const entry = entryFor(region, key);
    if (!entry) return null;
    return sumRange(entry.draws, Math.min(pullsDone, entry.draws.length), entry.draws.length);
}

// targetPull is 1-indexed as a player counts them: "get me to pull 9" means through draws[8].
function remainingToPull(region, key, pullsDone, targetPull) {
    const entry = entryFor(region, key);
    if (!entry) return null;
    const to = Math.min(targetPull, entry.draws.length);
    return sumRange(entry.draws, Math.min(pullsDone, to), to);
}

function upgradeCost(region, key) {
    const entry = entryFor(region, key);
    if (!entry || !entry.upgrade) return null;
    return entry.upgrade.perDraw * entry.upgrade.count;
}

// Budget mode, the inverse question: "I can spend this much -- how far does it get me?"
// cpShortOfNext is what they would still need for the pull AFTER the one they can reach, and is null
// when the budget finishes the draw outright.
function reachableWithBudget(region, key, pullsDone, budgetCp) {
    const entry = entryFor(region, key);
    if (!entry) return null;
    let used = 0;
    let pull = pullsDone;
    while (pull < entry.draws.length && used + entry.draws[pull] <= budgetCp) {
        used += entry.draws[pull];
        pull++;
    }
    return {
        pullsReachable: pull,
        cpUsed: used,
        cpShortOfNext: pull < entry.draws.length ? entry.draws[pull] - (budgetCp - used) : null
    };
}

module.exports = { pullCount, spentSoFar, remainingToFinish, remainingToPull, upgradeCost, reachableWithBudget };
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node scripts/drawCost.test.js` Expected: PASS — all checks green.

- [ ] **Step 6: Wire both test scripts into `npm test`**

In `package.json`, add to the `test` chain immediately after `node scripts/manageActions.test.js &&`:

```
node scripts/cpPackages.test.js && node scripts/drawCost.test.js &&
```

- [ ] **Step 7: Run the full suite**

Run: `npm test` Expected: PASS — the whole chain green, including the two new scripts.

- [ ] **Step 8: Commit**

```bash
git add utils/drawCost.js scripts/drawCost.test.js commands/drawprices.js package.json && git commit -m "feat(calculator): draw remainder math with conservation tests"
```

---

## Task 4: Schema changes — the `isDoubleCP` flag and the currency preference

**Files:**
- Modify: `models/SeasonalData.js`
- Modify: `commands/manage.js`, `handlers/manage/calendar.js`, `utils/manageActions.js`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `SeasonalData.calendar[].isDoubleCP` (Boolean, default false) and `UserPreference.cpCurrency` (String, default `'USD'`)

- [ ] **Step 1: Add the schema field**

In `models/SeasonalData.js`, inside the `calendar` sub-schema:

```js
        // Marks a live 2X CP event so /draw calculator can offer double-CP pricing without the user
        // having to know an event is on. An explicit flag rather than matching the title text: a
        // title pattern fails SILENTLY the first season the wording changes, and a silent miss here
        // means quoting someone the wrong purchase. Set from /manage's Calendar page.
        isDoubleCP: { type: Boolean, default: false },
```

⚠️ Mongoose persists only declared fields. This must land in the same change as the code that writes it, or it will work in memory and vanish on the next fetch.

- [ ] **Step 1b: Add the currency preference**

In `models/UserPreference.js`:

```js
    // Which storefront's prices /draw calculator quotes. Apple prices are tier-locked PER STOREFRONT
    // and are not proportional to each other, so the cheapest package combination genuinely differs
    // by currency -- this is not a display setting. Overridable per-invocation on the slash command.
    cpCurrency: { type: String, default: 'USD' },
```

🔴 **This is a new per-user stored field, so `docs/legal/PRIVACY.md` Appendix A and §2 must be updated in the SAME change.** The `privacy-inventory` docs-audit check covers every per-user field, not only sensitive ones, and it is an ERROR-level gate — it will fail CI otherwise. Add the `/settings` control alongside, following how a neighbouring preference is rendered there.

- [ ] **Step 2: Add the toggle to `/manage`'s Calendar page**

Read `utils/manageActions.js` and `handlers/manage/calendar.js` first and mirror how a neighbouring per-entry action is registered and audited. The registry is the single source of truth for page actions — register the action there rather than adding a button and a handler branch separately. The write must flow through the same `ChangeLog` capture as the page's other writes.

- [ ] **Step 3: Verify against the dev bot's local Mongo**

```bash
node --watch --env-file=.env.dev index.js
```

In Discord: `/manage` → Calendar → toggle a test entry's Double CP flag → re-open the page and confirm it persisted → confirm `/audit` shows the change.

- [ ] **Step 4: Confirm persistence survives a fresh fetch**

```bash
mongosh mongodb://localhost:27017/diors-builds-dev --quiet --eval 'db.seasonaldatas.findOne({}, {calendar: 1})'
```

Expected: the toggled entry shows `isDoubleCP: true`. If the field is absent, the schema edit did not land — that is the schema gotcha, not a UI bug.

- [ ] **Step 5: Run the registry test**

Run: `node scripts/manageActions.test.js` Expected: PASS — the new action is registered on both sides, so neither a dead button nor an unreachable handler exists.

- [ ] **Step 6: Commit**

```bash
git add models/SeasonalData.js models/UserPreference.js commands/manage.js commands/settings.js handlers/manage/calendar.js utils/manageActions.js docs/legal/PRIVACY.md && git commit -m "feat(calendar): double CP event flag and CP currency preference"
```

---

## Task 5: The `calculator` subcommand and Stage A panel

**Files:**
- Create: `commands/drawCalculator.js`
- Modify: `commands/drawprices.js`

**Interfaces:**
- Consumes: `DRAW_META`, `REGION_ORDER` (Task 3), `CP_PACKAGES` (Task 1), `upgradeCost` (Task 3)
- Produces: `encodeState(verb, state) -> string`, `decodeState(customId) -> state`, `buildSetupPanel(state, accent) -> component[]`, `execute(interaction)`

- [ ] **Step 1: Add the subcommand to the existing builder**

In `commands/drawprices.js`'s `data`, after the `prices` subcommand:

```js
        .addSubcommand(sub => sub
            .setName('calculator')
            .setDescription('Work out how much more CP you need, and the cheapest way to buy it')
            .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })))
```

- [ ] **Step 2: Dispatch on the subcommand**

At the top of `drawprices.js`'s `execute(interaction)`:

```js
        // The `draw` group owns two subcommands. The calculator lives in its own module -- but that
        // module deliberately exports no `data`, because bot/registry.js keys commands by
        // data.name and a second file exporting setName('draw') would register a DUPLICATE command
        // and silently overwrite this one in client.commands. Do NOT "fix" that missing export.
        if (interaction.options.getSubcommand() === 'calculator') {
            return require('./drawCalculator').execute(interaction);
        }
```

- [ ] **Step 3: Write the state codec**

In `commands/drawCalculator.js`:

```js
// State rides entirely in the customId -- no model, no cache, no per-user persistence. That is a
// PRIVACY decision as much as an architectural one: storing someone's CP balance and spend progress
// would need a PRIVACY.md Appendix A entry and would trip the privacy-inventory docs-audit gate.
// It also makes the region toggle free -- every click just recomputes, which is a few million
// integer ops, far below the Discord round trip. There is nothing to invalidate.
//
// Format: calc~<verb>~r<region digits>~d<draw index>~p<pulls done>~t<target>~v<target value>
//         ~b<balance>~u<0|1 upgrades>~e<2X entitlement bitmask>
// Fields are looked up BY PREFIX rather than by position, so a missing field decodes to its default
// instead of shifting every field after it. Discord's customId cap is 100 chars; a maximal state
// here is about 48.
const DRAW_KEYS = Object.keys(DRAW_META);

function encodeState(verb, s) {
    return [
        'calc', verb,
        `r${s.region.replace('region_', '')}`,
        `d${DRAW_KEYS.indexOf(s.drawKey)}`,
        `p${s.pullsDone}`,
        `t${s.target}`,
        `v${s.targetValue || 0}`,
        `b${s.balance || 0}`,
        `u${s.includeUpgrades ? 1 : 0}`,
        `e${s.entitlementMask || 0}`
    ].join('~');
}

function decodeState(customId) {
    const parts = customId.split('~');
    const get = (prefix, fallback) => {
        const hit = parts.slice(2).find(p => p.startsWith(prefix));
        return hit === undefined ? fallback : hit.slice(prefix.length);
    };
    return {
        verb: parts[1] || 'setup',
        region: `region_${get('r', '10')}`,
        drawKey: DRAW_KEYS[Number(get('d', 0))] || DRAW_KEYS[0],
        pullsDone: Number(get('p', 0)),
        target: get('t', 'F'),           // F = finish, P = specific pull, B = budget
        targetValue: Number(get('v', 0)),
        balance: Number(get('b', 0)),
        includeUpgrades: get('u', '0') === '1',
        entitlementMask: Number(get('e', 0))
    };
}
```

- [ ] **Step 4: Build the Stage A panel**

`buildSetupPanel(state, accent)` renders one Container holding, in order:

1. Title block via `buildTitleBlock`
2. **A guide paragraph keyed off `state.drawKey`** — how many pulls that draw has, whether it has an upgrade path, what finishing it means. This is the dropdown doubling as documentation
3. Draw-type string select, `custom_id` = `encodeState('draw', state)`, one option per `DRAW_META` key with that draw's pull count in the `description`
4. Target string select, `custom_id` = `encodeState('target', state)` — Finish the draw / Stop at a specific pull / Spend a set budget
5. Upgrade toggle button, **rendered only when** `upgradeCost(state.region, state.drawKey) !== null`
6. 2X entitlement multi-select (`min_values: 0`, `max_values: 6`), **rendered only when** a live `isDoubleCP` calendar entry exists or the user has asserted one
7. An **Enter your numbers** button (`calc~modal~…`) and a **Calculate** button (`calc~run~…`)

Read `commands/drawprices.js`'s `buildContainer` and copy its conventions for the title block, dividers and `withShareButton` / `buildGlobalNavRow` placement rather than inventing markup.

- [ ] **Step 5: Boot-test that exactly one `draw` command registers**

```bash
node --check commands/drawCalculator.js && node --check commands/drawprices.js
node --watch --env-file=.env.dev index.js
```

In Discord, confirm `/draw calculator` appears alongside `/draw prices`, and that **only one** `draw` command exists.

- [ ] **Step 6: Commit**

```bash
git add commands/drawCalculator.js commands/drawprices.js && git commit -m "feat(calculator): /draw calculator subcommand and setup panel"
```

---

## Task 6: The modal and the interaction handler

**Files:**
- Create: `handlers/drawCalc.js`
- Modify: `handlers/router.js`

**Interfaces:**
- Consumes: `encodeState`, `decodeState`, `buildSetupPanel` (Task 5), `pullCount` (Task 3)
- Produces: `handleDrawCalcInteraction(interaction) -> Promise<boolean>`

- [ ] **Step 1: Write the handler skeleton**

```js
// Owns every calc~ interaction. Serves THREE interaction types -- buttons, string selects and modal
// submits -- so EVERY branch type-tests as well as prefix-tests. Skipping that is the exact defect
// that broke /settings pagination during the index.js split: two branches with byte-identical
// customId prefixes but different types, where the first swallowed the second.
//
// Contract (see .claude/rules/interaction-router.md): return TRUE when this handler consumed the
// interaction, FALSE to fall through to the next handler in router.js.
async function handleDrawCalcInteraction(interaction) {
    const customId = interaction.customId;
    if (!customId || !customId.startsWith('calc~')) return false;
    const state = decodeState(customId);

    // showModal() must be the DIRECT response to the button -- it cannot follow a deferReply or
    // deferUpdate. Same constraint documented in handlers/autobuild.js.
    if (interaction.isButton() && state.verb === 'modal') {
        await interaction.showModal(buildNumbersModal(state));
        return true;
    }
    if (interaction.isModalSubmit() && state.verb === 'nums') { /* parse, re-render setup */ return true; }
    if (interaction.isStringSelectMenu() && state.verb === 'draw') { /* swap draw, re-render */ return true; }
    if (interaction.isStringSelectMenu() && state.verb === 'target') { /* swap target, re-render */ return true; }
    if (interaction.isStringSelectMenu() && state.verb === 'ent') { /* set entitlement mask */ return true; }
    if (interaction.isButton() && state.verb === 'upg') { /* flip includeUpgrades */ return true; }
    if (interaction.isButton() && state.verb === 'run') { /* render results */ return true; }
    if (interaction.isButton() && state.verb === 'region') { /* recompute for the new region */ return true; }
    if (interaction.isButton() && state.verb === 'edit') { /* back to setup */ return true; }
    return false;
}
```

- [ ] **Step 2: Add lenient numeric parsing**

```js
// Players type "3,000", "3000" and "3k" interchangeably. Rejecting two of those would read as the
// calculator being broken rather than strict. Returns null for genuinely invalid input so the
// caller can show a validation message instead of silently treating it as zero.
function parseAmount(raw) {
    if (!raw) return 0;
    const cleaned = String(raw).trim().toLowerCase().replace(/[, ]/g, '');
    const k = cleaned.endsWith('k');
    const n = Number(k ? cleaned.slice(0, -1) : cleaned);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(k ? n * 1000 : n);
}
```

- [ ] **Step 3: Bound `pullsDone` per draw, not to a constant**

The modal must reject `pullsDone` outside `0..pullCount(region, drawKey)`. Test with `sevenSpinLegendaryWeapon`: entering `9` must be rejected with a message, not silently clamped to a tenth pull that does not exist.

- [ ] **Step 4: Register in the router**

In `handlers/router.js`, immediately after the `handleDrawpricesInteraction` line:

```js
        if (await handleDrawCalcInteraction(interaction)) return;
```

Add the matching `require` beside the other handler requires.

- [ ] **Step 5: Click-test on the dev bot**

Run `/draw calculator`, open the modal, submit `3,000` then `3k` then `3000` and confirm all three parse identically. Confirm every select and button responds, and that none falls through to another handler.

- [ ] **Step 6: Run the routing tests**

Run: `node scripts/handlerRouting.test.js && node scripts/handlerState.test.js` Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add handlers/drawCalc.js handlers/router.js && git commit -m "feat(calculator): modal input and calc interaction handler"
```

---

## Task 7: The results panel

**Files:**
- Modify: `commands/drawCalculator.js`

**Interfaces:**
- Consumes: everything from Tasks 1–6
- Produces: `buildResultsPanel(state, accent) -> component[]`

- [ ] **Step 1: Render the result sections in the spec's order**

Headline (CP needed **and** pulls remaining) · spent so far · remaining pull sequence in `/draw prices`' `cumulativeSequence` style · upgrade add-on where it exists · balance-to-shortfall arithmetic · the already-covered branch · cheapest and least-waste combos side by side · the savings callout · the region reality check · share button and a `mentionCommand` link to `/draw prices` · the estimate disclaimer.

- [ ] **Step 2: Make the already-covered branch first-class**

```js
    // The best answer a spend-minimizer can give, and the easiest to forget to build. When the
    // balance already covers the target there is no optimizer output at all -- say so plainly and
    // do not render an empty recommendation section.
    if (shortfall <= 0) { /* "You already have enough. Buy nothing." */ }
```

- [ ] **Step 3: Add the region toggle row**

Three buttons, `custom_id` = `encodeState('region', { ...state, region })`, one per `REGION_ORDER` entry — current region **disabled** and `style: 1`, the other two enabled and `style: 2`, each carrying its `REGION_EMOJI_KEY` icon. This mirrors `/draw prices`' switcher exactly; read that code and match it rather than inventing a variant.

- [ ] **Step 4: Handle absent data**

When `remainingToFinish` returns `null` (`doubleEpicCharacters` at region_20/region_30), render the existing "haven't done the research yet" placeholder and **no** purchase recommendation. Never interpolate.

- [ ] **Step 5: Click-test all three regions and both event modes**

On the dev bot, run a calculation and flip through all three regions, confirming the numbers change with no re-entry. Then toggle 2X entitlements and confirm the recommendation changes shape — during 2X it should favour smaller packages, since value is flat.

- [ ] **Step 6: Commit**

```bash
git add commands/drawCalculator.js && git commit -m "feat(calculator): results panel with region toggles and savings callout"
```

---

## Task 8: Component budget test

**Files:**
- Create: `scripts/drawCalcBudget.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `buildSetupPanel`, `buildResultsPanel` (Tasks 5, 7)
- Produces: nothing consumed downstream

- [ ] **Step 1: Write the test**

Model it on `scripts/colorPanelBudget.test.js` — read that file first and match its structure. It must walk the rendered payload recursively (including `accessory`) and assert the total stays under 40 for **the worst case**: a mythic draw at a region with upgrade data, upgrade toggle on, all six entitlement options rendered, the longest draw name, and both optimizer results differing so both render.

```js
function countComponents(node) {
    if (!node || typeof node !== 'object') return 0;
    if (Array.isArray(node)) return node.reduce((n, c) => n + countComponents(c), 0);
    let n = 1;
    if (node.accessory) n += countComponents(node.accessory);
    (node.components || []).forEach(c => { n += countComponents(c); });
    return n;
}
```

- [ ] **Step 2: Run it**

Run: `node scripts/drawCalcBudget.test.js` Expected: PASS. The script should **print the actual counts**, so headroom is visible rather than merely asserted.

- [ ] **Step 3: Wire into `npm test`**

Add `node scripts/drawCalcBudget.test.js &&` to the `test` chain after `drawCost.test.js`.

- [ ] **Step 4: Commit**

```bash
git add scripts/drawCalcBudget.test.js package.json && git commit -m "test(calculator): assert both panels stay under the 40-component cap"
```

---

## Task 9: Records and the pull request

**Files:**
- Modify: `commands/help.js`, `.claude/rules/draw-prices.md`, `docs/CHANGELOG.md`, `docs/CHANGELOG-SUMMARY.md`, `docs/DEVLOG.md`, `package.json`, `package-lock.json`
- Verify (changed in Task 4): `docs/legal/PRIVACY.md`

- [ ] **Step 1: Add the `/help` entry**

`/draw calculator` must appear in `commands/help.js` alongside `/draw prices`. Read how `prices` is listed and match it. A new command absent from `/help` is a half-measure.

- [ ] **Step 2: Document in the rule file**

Add a `/draw calculator` section to `.claude/rules/draw-prices.md`, and add `commands/drawCalculator.js` + `handlers/drawCalc.js` to its `paths:` glob so it loads when those files are touched. It must record: the no-`data`-export constraint and why · that 2X doubles the base, not the advertised total · that pull counts are not uniformly ten · the stateless-by-design privacy decision and its one deliberate exception (`cpCurrency`) · that Apple prices are tier-locked per storefront and must never be derived by converting from USD.

- [ ] **Step 3: Changelog, summary, devlog, version**

- `docs/CHANGELOG.md`: a `Pre-Release v3.26.0` entry citing `(#PR)` with **no hash**, and backfill the previous entry's hash
- `docs/CHANGELOG-SUMMARY.md`: **a line is required for every version**, even docs-only — the release gate blocks the merge without it
- `docs/DEVLOG.md`: a narrative entry
- `package.json` **and** `package-lock.json` to `3.26.0-pre`

⚠️ `package-lock.json` carries the version in **two** places, and a mismatch fails the merge — this bit PR #130.

- [ ] **Step 4: Run every gate**

```bash
npm test && npm run docs:audit
```

Expected: both green. Read the **exit code**, not the trailing summary line. `docs:audit`'s `privacy-inventory` check is the one most likely to fail here — it fires on the new `cpCurrency` field if `PRIVACY.md` was not updated in Task 4.

- [ ] **Step 5: Open the PR against the right base**

```bash
gh pr create --base v3-pre-release --title "feat(calculator): /draw calculator with CP package optimizer"
```

⚠️ `gh` defaults to `--base main`. A v3 feature landed there puts unfinished code on the branch that must stay live-safe.

- [ ] **Step 6: Ask before merging**

Merging is never automatic — ask Harkirat first. Merge squashed with branch deletion, then refresh local refs with `git fetch origin main:main v3-pre-release:v3-pre-release`. No tag: pre-release mints none.

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: package table and the 2X correction → Task 1 · optimizer with both passes and the naive baseline → Task 2 · draw math including budget mode and degradation → Task 3 · `isDoubleCP` and calendar detection → Tasks 4 and 5 · two-stage panel, guide dropdown, conditional inputs → Task 5 · modal, lenient parsing, three-type handler → Task 6 · all eleven result sections, region toggles, already-covered branch → Task 7 · 40-component cap → Task 8 · `/help`, rule file, changelog, version, PR base → Task 9.

**Known gap, deliberate.** Task 5's `buildSetupPanel` and Task 7's `buildResultsPanel` describe their contents section by section but do not paste complete render code. Both must mirror existing builders in `commands/drawprices.js` — `buildTitleBlock`, `withShareButton`, `buildGlobalNavRow`, the `cumulativeSequence` style, the region switcher — and inventing that markup here rather than reading the neighbouring file is exactly the mistake `feedback_check_sibling_code_before_guessing` records. Each of those steps names the file to copy from.

**Type consistency.** `optimizePurchase` returns `{ combo, totalCents, totalCp, leftoverCp, cheapest, leastWaste, naive }` and is consumed that way in Task 7. `drawCost` exports six functions, all consumed by the names declared in Task 3's Interfaces block. State field names (`region`, `drawKey`, `pullsDone`, `target`, `targetValue`, `balance`, `includeUpgrades`, `entitlementMask`) are identical across Tasks 5, 6 and 7.
