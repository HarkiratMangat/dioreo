// Derivation guard for the CP package table (utils/cpPackages.js, 2026-08-15 17:43 EDT). Design: docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md.
//
// WHAT THIS IS FOR. The store advertises a number that ALREADY includes the bonus (10,800 CP is 8,000 base + 35%). During a 2X event the same package gives 8,000 base + 100% = 16,000 -- NOT double the advertised 10,800. The first draft of this design got that wrong by 5,600 CP at the top tier. These tests pin both derivations against the real store figures.

const assert = require('assert');
const { CP_PACKAGES, CURRENCIES, normalCp, doubleCp, priceOf, priceCents, countryOf, formatMoney } = require('../utils/cpPackages');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
}

// Real figures read off Harkirat's own store screenshots, and docs/reference/cp-package-prices.json.
const ADVERTISED_NORMAL = [80, 420, 880, 2400, 5000, 10800];
const ADVERTISED_2X = [160, 800, 1600, 4000, 8000, 16000];
const PRICES_CENTS = { USD: [99, 499, 999, 2499, 4999, 9999], EUR: [99, 599, 999, 2999, 5999, 9999], CAD: [99, 699, 1299, 3499, 6999, 12999] };

check('the table has exactly six packages', () => {
    assert.strictEqual(CP_PACKAGES.length, 6);
});

check('there are 41 currencies', () => {
    assert.strictEqual(CURRENCIES.length, 41);
});

check('normal totals match the advertised store figures', () => {
    assert.deepStrictEqual(CP_PACKAGES.map(normalCp), ADVERTISED_NORMAL);
});

check('2X totals are double the BASE, not double the advertised total', () => {
    assert.deepStrictEqual(CP_PACKAGES.map(doubleCp), ADVERTISED_2X);
});

check('prices are integer minor-units in every supported currency', () => {
    for (const cur of ['USD', 'EUR', 'CAD']) {
        assert.deepStrictEqual(CP_PACKAGES.map(p => priceCents(p, cur)), PRICES_CENTS[cur], `${cur} prices differ`);
    }
    for (const cur of CURRENCIES) {
        CP_PACKAGES.forEach(p => assert.ok(Number.isInteger(priceCents(p, cur)), `${p.id}/${cur} is not an integer`));
    }
});

// JPY/CLP have no decimal places and KWD/BHD have three, per cp-package-prices.md's Schema section -- everything else defaults to the ISO-4217 standard of 2. Pinned so a future currency addition can't silently misclassify (a JSON number drops trailing zeros, so this can't be inferred from the data).
check('minor-unit exponents match the documented exceptions', () => {
    assert.strictEqual(priceCents(CP_PACKAGES[0], 'JPY'), 160, 'JPY should have 0 decimal places');
    assert.strictEqual(priceCents(CP_PACKAGES[0], 'CLP'), 990, 'CLP should have 0 decimal places');
    assert.strictEqual(priceCents(CP_PACKAGES[0], 'KWD'), 310, 'KWD should have 3 decimal places');
    assert.strictEqual(priceCents(CP_PACKAGES[0], 'BHD'), 390, 'BHD should have 3 decimal places');
});

// Every package must resolve a price in every currency -- a missing currency would make the optimizer silently skip that package for that storefront rather than erroring loudly.
check('every package has a price in every supported currency', () => {
    CP_PACKAGES.forEach(p => CURRENCIES.forEach(cur => {
        assert.ok(typeof priceOf(p, cur) === 'number', `${p.id} has no ${cur} price -- a missing currency would make the optimizer silently skip that package`);
        assert.ok(Number.isInteger(priceCents(p, cur)), `${p.id}/${cur} priceCents is not an integer`);
    }));
});

check('countryOf resolves every currency', () => {
    CURRENCIES.forEach(cur => assert.ok(typeof countryOf(cur) === 'string' && countryOf(cur).length > 0, `${cur} has no country`));
});

// Pins the finding that justifies the whole optimizer: value is monotonic in USD but NOT in EUR or CAD. If a future price edit makes all three monotonic, "just buy the biggest" becomes correct and this test SHOULD fail so someone re-reads the design rather than leaving a solver with no job.
check('value ordering is non-monotonic outside USD', () => {
    const rate = (p, cur) => normalCp(p) / priceCents(p, cur);
    const isMonotonic = cur => CP_PACKAGES.every((p, i) => i === 0 || rate(p, cur) >= rate(CP_PACKAGES[i - 1], cur));
    assert.ok(isMonotonic('USD'), 'USD should be monotonically better value as packs get bigger');
    assert.ok(!isMonotonic('EUR'), 'EUR was monotonic -- re-check the price table against the real store');
    assert.ok(!isMonotonic('CAD'), 'CAD was monotonic -- re-check the price table against the real store');
});

check('no package stores a pre-computed total', () => {
    CP_PACKAGES.forEach(p => {
        assert.ok(!('cp' in p) && !('totalCp' in p) && !('price' in p),
            `${p.id} stores a total or a baked-in price map; totals and prices must be derived so a wrong figure can exist in one place only`);
    });
});

check('formatMoney renders cents with the right symbol', () => {
    assert.strictEqual(formatMoney(99, 'USD'), '$0.99');
    assert.strictEqual(formatMoney(12999, 'CAD'), 'CA$129.99');
    assert.strictEqual(formatMoney(160, 'JPY'), '¥160');
    assert.strictEqual(formatMoney(310, 'KWD'), 'KD0.310');
});

// ==========================================
// THE OPTIMIZER
// ==========================================
const { optimizePurchase } = require('../utils/cpPackages');

// Exhaustive reference implementation. Deliberately dumb and obviously correct, so it can falsify the DP rather than merely agree with it. Respects the same maxTransactions cap the DP enforces (default 6) -- without that constraint this would validate a DIFFERENT, unconstrained problem and could legitimately disagree with a correctly-capped optimizer.
function bruteForce(shortfall, currency = 'USD', maxTransactions = 6) {
    let best = null;
    const n = CP_PACKAGES.length;
    const counts = new Array(n).fill(0);
    const recurse = (i, itemsLeft) => {
        if (i === n) {
            const cp = counts.reduce((s, c, j) => s + c * normalCp(CP_PACKAGES[j]), 0);
            if (cp < shortfall) return;
            const cents = counts.reduce((s, c, j) => s + c * priceCents(CP_PACKAGES[j], currency), 0);
            if (!best || cents < best.cents) best = { cents, cp };
            return;
        }
        for (let c = 0; c <= itemsLeft; c++) { counts[i] = c; recurse(i + 1, itemsLeft - c); }
        counts[i] = 0;
    };
    recurse(0, maxTransactions);
    return best;
}

check('a covered shortfall needs no purchase', () => {
    assert.strictEqual(optimizePurchase(0, {}), null);
    assert.strictEqual(optimizePurchase(-500, {}), null);
});

check('the DP agrees with brute force on small shortfalls, within the same transaction cap', () => {
    for (const shortfall of [1, 79, 80, 81, 420, 900, 2401, 5000, 7500]) {
        const dp = optimizePurchase(shortfall, {});
        const bf = bruteForce(shortfall);
        assert.strictEqual(dp.absoluteCheapest.totalCents, bf.cents,
            `shortfall ${shortfall}: DP said ${dp.absoluteCheapest.totalCents}c, brute force found ${bf.cents}c`);
    }
});

check('every result actually covers the shortfall', () => {
    for (const shortfall of [1, 500, 3333, 12000, 29999]) {
        const r = optimizePurchase(shortfall, {});
        assert.ok(r.cheapest.totalCp >= shortfall, `shortfall ${shortfall}: only got ${r.cheapest.totalCp}`);
        assert.strictEqual(r.cheapest.leftoverCp, r.cheapest.totalCp - shortfall);
    }
});

check('combo prices and CP sum to the reported totals', () => {
    const r = optimizePurchase(13000, {});
    const cents = r.cheapest.combo.reduce((s, c) => s + c.count * c.priceCents, 0);
    const cp = r.cheapest.combo.reduce((s, c) => s + c.count * c.cpEach, 0);
    assert.strictEqual(cents, r.cheapest.totalCents);
    assert.strictEqual(cp, r.cheapest.totalCp);
});

check('every result respects the default 6-transaction cap', () => {
    for (const shortfall of [130, 950, 4100, 11000, 29999]) {
        const r = optimizePurchase(shortfall, {});
        assert.ok(r.cheapest.transactions <= 6, `shortfall ${shortfall}: cheapest used ${r.cheapest.transactions} transactions`);
        assert.ok(r.absoluteCheapest.transactions <= 6, `shortfall ${shortfall}: absolute cheapest used ${r.absoluteCheapest.transactions} transactions`);
        if (r.stockUp) assert.ok(r.stockUp.transactions <= 3, `shortfall ${shortfall}: stock-up used ${r.stockUp.transactions} transactions`);
    }
});

// The retired LEAST_WASTE objective is pinned as ABSENT, not merely unused: it is exactly the kind of comparator a future session would "restore" as an obvious missing feature. See utils/cpPackages.js's own note for the measurement that killed it.
check('the retired least-waste objective is gone from the public result', () => {
    const r = optimizePurchase(11510, { currency: 'CAD' });
    assert.strictEqual(r.leastWaste, undefined, 'leastWaste came back -- it optimizes the wrong quantity, see cpPackages.js');
});

// The bug this whole change exists to fix, pinned on the exact case Harkirat reported. The displayed recommendation must not spend four extra store transactions to save CA$2.04.
check('the displayed cheapest prefers far fewer purchases over a trivial saving', () => {
    const r = optimizePurchase(11510, { currency: 'CAD' });
    assert.strictEqual(r.absoluteCheapest.transactions, 6, 'expected the arithmetic optimum to still be the 6-purchase combo');
    assert.strictEqual(r.cheapest.transactions, 2, `displayed recommendation used ${r.cheapest.transactions} purchases`);
    assert.ok(r.cheapest.totalCents > r.absoluteCheapest.totalCents, 'the practical pick should cost slightly more');
    assert.ok(r.cheapest.totalCents - r.absoluteCheapest.totalCents < 500, 'but only slightly -- within the stated tolerance');
    assert.ok(r.cheapest.totalCp > r.absoluteCheapest.totalCp, 'and it should bank MORE cp, not less');
});

// His case that retired the flat 3% rule (2026-10-17 20:09 EDT): 8,730 CP short in CAD, five purchases for CA$125.95 were shown over one 10,800 pack for CA$129.99 -- 26 cents a purchase saved, and about 2,000 CP less.
check('one big pack beats five small ones that save a few cents each', () => {
    const r = optimizePurchase(8730, { currency: 'CAD' });
    assert.strictEqual(r.absoluteCheapest.transactions, 5, 'expected the arithmetic optimum to still be the 5-purchase combo');
    assert.strictEqual(r.cheapest.transactions, 1, `displayed recommendation used ${r.cheapest.transactions} purchases`);
    assert.strictEqual(r.cheapest.totalCp, 10800);
});

// The property the per-purchase allowance was chosen for, swept across currencies: it may only ever pick FEWER purchases than the old flat-3% rule, never more, and never pay past its own allowance.
check('the per-purchase allowance never picks more purchases than the flat 3% rule', () => {
    const { PURCHASE_RULES } = require('../utils/cpPackages');
    for (const currency of ['CAD', 'USD', 'EUR', 'JPY', 'BRL', 'KWD']) {
        for (let shortfall = 40; shortfall <= 24000; shortfall += 1993) {
            const r = optimizePurchase(shortfall, { currency });
            if (!r) continue;
            const abs = r.absoluteCheapest;
            const floor = Math.round(abs.totalCents * PURCHASE_RULES.tolerancePct);
            let old = null;
            for (let cap = 1; cap <= 6 && !old; cap++) {
                const c = optimizePurchase(shortfall, { currency, maxTransactions: cap });
                if (c && c.absoluteCheapest.totalCents <= abs.totalCents + floor) old = c.absoluteCheapest;
            }
            assert.ok(r.cheapest.transactions <= (old || abs).transactions, `${currency} ${shortfall}: ${r.cheapest.transactions} purchases, the 3% rule picked ${(old || abs).transactions}`);
            const perPurchase = Math.max(priceCents(CP_PACKAGES[0], currency), Math.round(abs.totalCents * PURCHASE_RULES.perPurchasePct));
            assert.ok(r.cheapest.totalCents <= abs.totalCents + Math.max(floor, (abs.transactions - r.cheapest.transactions) * perPurchase), `${currency} ${shortfall}: over its allowance`);
        }
    }
});

// A pack's 2X applies to its first purchase in the game, so a result may never show that pack at the normal rate while its 2X is unused (2026-10-17 21:10 EDT; before the fix, 246 of 1,681 swept picks did).
check('an available 2X is always used on its own pack before that pack is bought at the normal rate', () => {
    const tiny = optimizePurchase(20, { currency: 'CAD', doubleCpAvailable: ['cp80'] });
    assert.deepStrictEqual(tiny.cheapest.combo.map(c => `${c.count}x${c.cpEach}${c.mode === 'double' ? '(2X)' : ''}`), ['1x160(2X)']);
    assert.strictEqual(tiny.cheapest.leftoverCp, 140);
    const all = CP_PACKAGES.map(p => p.id);
    for (const currency of ['CAD', 'EUR', 'JPY', 'AUD']) {
        for (let shortfall = 20; shortfall <= 24000; shortfall += 1499) {
            const r = optimizePurchase(shortfall, { currency, doubleCpAvailable: all });
            for (const pick of [r.cheapest, r.absoluteCheapest]) {
                const doubled = new Set(pick.combo.filter(c => c.mode === 'double').map(c => c.id));
                const unused = pick.combo.filter(c => c.mode === 'normal' && !doubled.has(c.id));
                assert.strictEqual(unused.length, 0, `${currency} ${shortfall}: ${unused.map(c => c.id).join(',')} bought at the normal rate with its 2X unused`);
                assert.strictEqual(pick.totalCp, pick.combo.reduce((n, c) => n + c.count * c.cpEach, 0), `${currency} ${shortfall}: totalCp out of step with the combo`);
            }
        }
    }
});

// Stock Up must never be the thing Least Waste was: a worse deal wearing a second label.
check('stock-up, when shown, is genuinely better value and genuinely more CP', () => {
    for (const shortfall of [130, 950, 4100, 5810, 11000, 11510, 15000]) {
        const r = optimizePurchase(shortfall, { currency: 'CAD' });
        if (!r.stockUp) continue;
        const baseRate = r.cheapest.totalCp / r.cheapest.totalCents;
        const upRate = r.stockUp.totalCp / r.stockUp.totalCents;
        assert.ok(upRate > baseRate, `shortfall ${shortfall}: stock-up had a WORSE cp-per-cent rate than cheapest`);
        assert.ok(r.stockUp.totalCp > r.cheapest.totalCp, `shortfall ${shortfall}: stock-up cost more without banking more CP`);
        assert.strictEqual(r.stockUp.extraCp, r.stockUp.totalCp - r.cheapest.totalCp);
        assert.strictEqual(r.stockUp.extraCents, r.stockUp.totalCents - r.cheapest.totalCents);
    }
});

// A falsifier with teeth: stock-up must actually FIRE somewhere, or the check above passes vacuously on an always-null field.
check('stock-up actually appears on at least one real shortfall', () => {
    const hits = [130, 950, 4100, 5810, 11000, 11510, 15000, 20000]
        .filter(sf => optimizePurchase(sf, { currency: 'CAD' }).stockUp);
    assert.ok(hits.length > 0, 'stock-up never fired on any tested shortfall -- the check above would be vacuous');
});

check('a 2X entitlement is used at most once each', () => {
    const all = CP_PACKAGES.map(p => p.id);
    const r = optimizePurchase(20000, { doubleCpAvailable: all });
    r.cheapest.combo.filter(c => c.mode === 'double')
        .forEach(c => assert.ok(c.count <= 1, `${c.id} used ${c.count} times as a 2X purchase`));
});

check('2X entitlements make a given shortfall cheaper, never dearer', () => {
    const all = CP_PACKAGES.map(p => p.id);
    for (const shortfall of [5000, 16000, 25000]) {
        const without = optimizePurchase(shortfall, {});
        const with2x = optimizePurchase(shortfall, { doubleCpAvailable: all });
        assert.ok(with2x.cheapest.totalCents <= without.cheapest.totalCents,
            `shortfall ${shortfall}: 2X came out more expensive (${with2x.cheapest.totalCents} vs ${without.cheapest.totalCents})`);
    }
});

check('naive baseline is the smallest single package that covers it alone', () => {
    const r = optimizePurchase(900, {});
    assert.strictEqual(r.naive.totalCp, 2400, 'expected the 2,400 CP package as the naive cover for 900');
    assert.ok(r.naive.totalCents >= r.cheapest.totalCents);
});

check('currency actually changes the recommendation -- the optimizer is not silently pinned to USD', () => {
    // Real numbers from docs/reference/cp-package-prices.json: in CAD the value ordering is non-monotonic (companion doc), so the cheapest combo for the same shortfall must differ from USD's, not just be a currency-symbol relabelling of the same combo.
    const usd = optimizePurchase(5000, { currency: 'USD' });
    const cad = optimizePurchase(5000, { currency: 'CAD' });
    assert.notDeepStrictEqual(usd.cheapest.combo, cad.cheapest.combo,
        'CAD produced the same combo as USD -- the optimizer may be ignoring the currency parameter');
});

// Pins the spec's own motivating example (design doc, "The mathematically optimal combination can be absurd in practice"): UNCAPPED, a 5,000 CP shortfall in CAD is cheapest as 63 separate $0.99 purchases (5,040 CP for $62.37) rather than the single $69.99 pack. This is a KNOWN CASE that can fail both ways -- if the cap silently does nothing, the capped result matches this; if currency or the cap is broken some other way, neither total matches.
check('uncapped, the CAD absurd-optimum matches the spec\'s worked example', () => {
    const uncapped = optimizePurchase(5000, { currency: 'CAD', maxTransactions: 63 });
    assert.strictEqual(uncapped.absoluteCheapest.totalCents, 6237, `expected $62.37 (63 x $0.99), got ${uncapped.absoluteCheapest.totalCents}c`);
    assert.strictEqual(uncapped.absoluteCheapest.totalCp, 5040);
    assert.strictEqual(uncapped.absoluteCheapest.transactions, 63);
    // ...and the DISPLAYED recommendation must refuse it, because 63 purchases is the whole reason the practical search exists.
    assert.ok(uncapped.cheapest.transactions < 10, `the displayed recommendation still asked for ${uncapped.cheapest.transactions} purchases`);
});

// The default cap must reject that absurd combo and fall back to something a human would do.
check('capped at the default of 6, CAD does NOT recommend 63 purchases', () => {
    const capped = optimizePurchase(5000, { currency: 'CAD' });
    assert.ok(capped.cheapest.transactions <= 6, `expected <= 6 transactions, got ${capped.cheapest.transactions}`);
    assert.ok(capped.cheapest.totalCents > 6237, 'the capped result should not match the uncapped absurd optimum');
    assert.ok(capped.cheapest.totalCents <= capped.naive.totalCents,
        `capped cheapest (${capped.cheapest.totalCents}c) should never be worse than the naive single-pack baseline (${capped.naive.totalCents}c)`);
});

// 🔴 The ceiling bug, pinned on the exact realistic triggers. Before the fix these returned a combo covering 64,800 CP with a NEGATIVE leftoverCp and no error -- "select every draw" reaches both figures.
check('a basket-sized shortfall is covered honestly, never with a negative leftover', () => {
    for (const shortfall of [64801, 69625, 137980, 689900]) {
        for (const currency of ['USD', 'CAD', 'JPY', 'NOK']) {
            const r = optimizePurchase(shortfall, { currency });
            assert.ok(r, `${currency} ${shortfall}: returned null instead of an answer`);
            assert.ok(r.cheapest.totalCp >= shortfall, `${currency} ${shortfall}: only covered ${r.cheapest.totalCp}`);
            assert.ok(r.cheapest.leftoverCp >= 0, `${currency} ${shortfall}: negative leftover ${r.cheapest.leftoverCp}`);
            assert.ok(r.naive.totalCp >= shortfall, `${currency} ${shortfall}: naive baseline did not cover the shortfall`);
            assert.ok(r.naive.leftoverCp >= 0, `${currency} ${shortfall}: naive leftover went negative`);
            const cp = r.cheapest.combo.reduce((n, c) => n + c.count * c.cpEach, 0);
            const cents = r.cheapest.combo.reduce((n, c) => n + c.count * c.priceCents, 0);
            assert.strictEqual(cp, r.cheapest.totalCp, `${currency} ${shortfall}: combo CP does not sum to the reported total`);
            assert.strictEqual(cents, r.cheapest.totalCents, `${currency} ${shortfall}: combo price does not sum to the reported total`);
        }
    }
});

// The falsifier for the guard itself: it must be able to REFUSE, or the check above passes on a function that simply never returns null.
check('the honesty guard can actually refuse -- it is not vacuous', () => {
    const impossible = optimizePurchase(50000, { currency: 'CAD', maxTransactions: 1 });
    assert.strictEqual(impossible, null, 'a shortfall unreachable in one purchase must return null, not a short answer');
});

// The bulk package is currency-dependent: the top tier is best value in only 32 of 41 currencies. Hardcoding it would be wrong for nine storefronts, silently.
check('bulk peeling follows the per-currency best-value package, not a hardcoded tier', () => {
    const seen = new Set();
    for (const currency of CURRENCIES) {
        const r = optimizePurchase(200000, { currency });
        assert.ok(r, `${currency}: no answer for a bulk-sized shortfall`);
        const bulkLine = r.cheapest.combo.reduce((a, b) => (b.count > (a ? a.count : 0) ? b : a), null);
        seen.add(bulkLine.id);
    }
    assert.ok(seen.size > 1, `every currency peeled the same package (${[...seen]}) -- the per-currency lookup is not doing anything`);
});

console.log(failures === 0 ? `\nAll CP package checks passed (${CP_PACKAGES.length} packages, ${CURRENCIES.length} currencies).` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
