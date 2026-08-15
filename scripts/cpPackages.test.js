// Derivation guard for the CP package table (utils/cpPackages.js, 2026-08-15 17:43 EDT).
// Design: docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md.
//
// WHAT THIS IS FOR. The store advertises a number that ALREADY includes the bonus (10,800 CP is
// 8,000 base + 35%). During a 2X event the same package gives 8,000 base + 100% = 16,000 -- NOT
// double the advertised 10,800. The first draft of this design got that wrong by 5,600 CP at the
// top tier. These tests pin both derivations against the real store figures.

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

// JPY/CLP have no decimal places and KWD/BHD have three, per cp-package-prices.md's Schema section --
// everything else defaults to the ISO-4217 standard of 2. Pinned so a future currency addition can't
// silently misclassify (a JSON number drops trailing zeros, so this can't be inferred from the data).
check('minor-unit exponents match the documented exceptions', () => {
    assert.strictEqual(priceCents(CP_PACKAGES[0], 'JPY'), 160, 'JPY should have 0 decimal places');
    assert.strictEqual(priceCents(CP_PACKAGES[0], 'CLP'), 990, 'CLP should have 0 decimal places');
    assert.strictEqual(priceCents(CP_PACKAGES[0], 'KWD'), 310, 'KWD should have 3 decimal places');
    assert.strictEqual(priceCents(CP_PACKAGES[0], 'BHD'), 390, 'BHD should have 3 decimal places');
});

// Every package must resolve a price in every currency -- a missing currency would make the
// optimizer silently skip that package for that storefront rather than erroring loudly.
check('every package has a price in every supported currency', () => {
    CP_PACKAGES.forEach(p => CURRENCIES.forEach(cur => {
        assert.ok(typeof priceOf(p, cur) === 'number', `${p.id} has no ${cur} price -- a missing currency would make the optimizer silently skip that package`);
        assert.ok(Number.isInteger(priceCents(p, cur)), `${p.id}/${cur} priceCents is not an integer`);
    }));
});

check('countryOf resolves every currency', () => {
    CURRENCIES.forEach(cur => assert.ok(typeof countryOf(cur) === 'string' && countryOf(cur).length > 0, `${cur} has no country`));
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

console.log(failures === 0 ? `\nAll CP package checks passed (${CP_PACKAGES.length} packages, ${CURRENCIES.length} currencies).` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
