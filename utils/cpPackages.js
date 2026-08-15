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
// 8,000 base + 35%), so storing the advertised figure would make the 2X figure impossible to derive
// correctly. During a 2X CP event a package gives base x 2 -- so the $99.99 tier yields 16,000, NOT
// double the advertised 10,800. Sourced from Harkirat's own store screenshots, 2026-08-15 15:06 EDT.
//
// PRICES ARE NOT A CURRENCY CONVERSION. Apple/Google assign price points directly PER STOREFRONT --
// tier-locked, not rate-locked -- and the tiers are NOT proportional to each other. In 17 of 41
// currencies "buy the biggest pack" is wrong, and in NOK/SEK the smallest pack is the best value in
// the store. Never derive a currency by converting from USD; the real figures live in the committed
// reference file below (all 41 currencies, captured 2026-08-15, provenance and traps documented in
// the companion .md).
//
// Money is INTEGER MINOR UNITS everywhere ("cents", though the true minor-unit size varies by
// currency -- see MINOR_UNIT_EXPONENT below). Floats would let two equally-priced combos compare
// unequal from binary rounding drift, and would let overshoot amounts differ across runs.
const PRICE_DATA = require('../docs/reference/cp-package-prices.json');

const BASE_CP = [80, 400, 800, 2000, 4000, 8000];
const BONUS_PCT = [0, 0.05, 0.10, 0.20, 0.25, 0.35];

// tierIndex is the join key into PRICE_DATA: PRICE_DATA.inGameBundlesCp[i] and every currency's
// prices[i] align with CP_PACKAGES[i]. normalCp(pkg) is asserted equal to inGameBundlesCp[i] by this
// module's own test, so a mistyped base/bonus here fails loudly rather than silently overstating CP.
const CP_PACKAGES = BASE_CP.map((baseCp, i) => ({
    id: `cp${baseCp}`,
    baseCp,
    bonusPct: BONUS_PCT[i],
    tierIndex: i
}));

const CURRENCIES = Object.keys(PRICE_DATA.currencies).sort();

// Minor-unit exponent per docs/reference/cp-package-prices.md's Schema section: JPY and CLP have no
// decimal places, KWD and BHD have three. Everything else defaults to the ISO-4217 standard of 2.
// Deliberately NOT inferred from the captured data's visible decimal digits -- a JSON number drops
// trailing zeros (449.90 parses as the JS number 449.9), which would misclassify an ordinary
// 2-decimal currency as having only one.
const MINOR_UNIT_EXPONENT = { JPY: 0, CLP: 0, KWD: 3, BHD: 3 };
function exponentOf(currency) { return MINOR_UNIT_EXPONENT[currency] ?? 2; }

// Major units as the store displays them (0.99, not 99) -- the raw figure from the price file.
function priceOf(pkg, currency) { return PRICE_DATA.currencies[currency].prices[pkg.tierIndex]; }
function countryOf(currency) { return PRICE_DATA.currencies[currency].country; }

// Integer minor units -- the unit the optimizer's DP runs in, so combos never compare unequal from
// float drift. Math.round because the source file stores major-unit floats (0.99 * 100 can land on
// 98.99999999999999 in binary floating point).
function priceCents(pkg, currency) { return Math.round(priceOf(pkg, currency) * 10 ** exponentOf(currency)); }

// Math.round rather than a bare multiply: 0.05/0.10/0.20/0.25/0.35 are not exact in binary floating
// point, so 400 * 1.05 can land on 420.00000000000006. Every real value here is a whole number of CP.
function normalCp(pkg) { return Math.round(pkg.baseCp * (1 + pkg.bonusPct)); }

// A 2X CP event replaces the package's normal bonus with +100%, so it is base x 2 -- never
// normalCp(pkg) x 2. See this module's header comment; getting this wrong overstates the top tier.
function doubleCp(pkg) { return pkg.baseCp * 2; }

// Display-only -- never used for money math (priceCents/exponentOf own that). A currency without a
// well-known symbol falls back to its ISO code.
const CURRENCY_SYMBOL = {
    USD: '$', CAD: 'CA$', AUD: 'A$', NZD: 'NZ$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'CHF ',
    BRL: 'R$', MXN: 'MX$', ARS: 'AR$', BOB: 'Bs', UYU: '$U', CLP: 'CLP$', COP: 'COL$', PEN: 'S/',
    TRY: '₺', ZAR: 'R', PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei', SEK: 'kr', NOK: 'kr', DKK: 'kr',
    QAR: 'QR', SAR: 'SR', KWD: 'KD', BHD: 'BD', EGP: 'E£', KES: 'KSh', NGN: '₦', KZT: '₸', MNT: '₮',
    LKR: 'Rs', NPR: 'Rs', PKR: 'Rs', PYG: '₲'
};

function formatMoney(cents, currency) {
    const exponent = exponentOf(currency);
    const major = cents / 10 ** exponent;
    const symbol = CURRENCY_SYMBOL[currency] || `${currency} `;
    return `${symbol}${major.toFixed(exponent)}`;
}

// ==========================================
// THE OPTIMIZER
// ==========================================
// Minimize real money subject to totalCp >= shortfall, IN A GIVEN CURRENCY -- every price lookup
// below goes through priceCents(pkg, currency); nothing here reads a static per-package price,
// because the whole point of the 41-currency table is that the cheapest combination differs by
// storefront (in 17 of 41 currencies "buy the biggest pack" is wrong).
//
// WHY A DP AND NOT A RULE OF THUMB. Under normal USD pricing CP-per-dollar rises monotonically
// (80.8 -> 108.0), so bigger is strictly better value. Under 2X it is almost perfectly FLAT, with the
// smallest tier marginally best -- so the winning strategy inverts. Several other currencies are
// non-monotonic even under normal pricing. Multiple genuinely different strategies from one table is
// exactly the case a solver earns its place on.
//
// STRUCTURE. Normal packages are unbounded per type, but the TOTAL number of purchases (across every
// package and every 2X entitlement) is bounded by maxTransactions -- see the DP below. Unused 2X
// entitlements are additionally bounded at one each. Enumerate all 64 subsets of the AVAILABLE
// entitlements, and for each look up the bounded-unbounded DP for whatever CP and transaction budget
// remain. That DP is built ONCE per currency/objective/transaction-cap combination and reused across
// all 64 subsets.
const MAX_DP_CP = 60000; // Comfortably above any real shortfall; the largest full draw + upgrades is ~24k.

// dp[k][c] = the best way (per `better`) to obtain AT LEAST c CP using AT MOST k normal-package
// purchases, in `currency`. Bounding by transaction count is what makes maxTransactions (decision 20)
// real: without this dimension, the DP's mathematically optimal answer for a 5,000 CP shortfall in
// CAD is 63 separate $0.99 purchases -- correct, and nobody would ever do it. dp[k] carries forward
// dp[k-1]'s best states (using fewer than k purchases is always still valid at budget k).
function buildBoundedDp(limit, maxTransactions, currency, better) {
    const dp = [new Array(limit + 1).fill(null)];
    dp[0][0] = { cents: 0, cp: 0, from: -1, prevK: -1, prevC: -1 };
    for (let k = 1; k <= maxTransactions; k++) {
        const layer = new Array(limit + 1);
        for (let c = 0; c <= limit; c++) {
            let best = dp[k - 1][c]; // at-most-(k-1) is also valid at budget k.
            for (let i = 0; i < CP_PACKAGES.length; i++) {
                const pkg = CP_PACKAGES[i];
                const prevC = Math.max(0, c - normalCp(pkg));
                const prev = dp[k - 1][prevC];
                if (!prev) continue;
                const cand = { cents: prev.cents + priceCents(pkg, currency), cp: prev.cp + normalCp(pkg), from: i, prevK: k - 1, prevC };
                if (!best || better(cand, best)) best = cand;
            }
            layer[c] = best;
        }
        dp.push(layer);
    }
    return dp;
}

function walkBoundedDp(dp, k, c) {
    const counts = new Map();
    let state = dp[k][c];
    while (state && state.from !== -1) {
        const pkg = CP_PACKAGES[state.from];
        counts.set(pkg.id, (counts.get(pkg.id) || 0) + 1);
        state = dp[state.prevK][state.prevC];
    }
    return counts;
}

const CHEAPEST = (a, b) => (a.cents !== b.cents ? a.cents < b.cents : a.cp < b.cp);
const LEAST_WASTE = (a, b) => (a.cp !== b.cp ? a.cp < b.cp : a.cents < b.cents);

function popcount(mask) { let n = 0; while (mask) { n += mask & 1; mask >>= 1; } return n; }

function solve(shortfallCp, availableIds, currency, maxTransactions, better) {
    const bounded = CP_PACKAGES.filter(p => availableIds.includes(p.id));
    const limit = Math.min(shortfallCp, MAX_DP_CP);
    const dp = buildBoundedDp(limit, maxTransactions, currency, better);
    let best = null;
    let bestState = null;

    // Enumerate every subset of the available 2X entitlements. At most 2^6 = 64 iterations. Each
    // entitlement used counts as one transaction, so it eats into the same budget as normal packages.
    for (let mask = 0; mask < (1 << bounded.length); mask++) {
        const usedCount = popcount(mask);
        if (usedCount > maxTransactions) continue;
        let cents = 0, cp = 0;
        const used = [];
        for (let i = 0; i < bounded.length; i++) {
            if (mask & (1 << i)) {
                cents += priceCents(bounded[i], currency);
                cp += doubleCp(bounded[i]);
                used.push(bounded[i]);
            }
        }
        const remainingTransactions = maxTransactions - usedCount;
        const remainingCp = Math.max(0, limit - cp);
        const tail = dp[remainingTransactions][remainingCp];
        if (!tail) continue; // remainingCp is not reachable within the remaining transaction budget
        const cand = { cents: cents + tail.cents, cp: cp + tail.cp, used, remainingTransactions, remainingCp };
        if (!best || better(cand, best)) { best = cand; bestState = { remainingTransactions, remainingCp }; }
    }
    if (!best) return null; // shortfall unreachable within maxTransactions -- not expected at the default of 6

    const combo = best.used.map(p => ({ id: p.id, count: 1, mode: 'double', cpEach: doubleCp(p), priceCents: priceCents(p, currency) }));
    for (const [id, count] of walkBoundedDp(dp, bestState.remainingTransactions, bestState.remainingCp)) {
        const pkg = CP_PACKAGES.find(p => p.id === id);
        combo.push({ id, count, mode: 'normal', cpEach: normalCp(pkg), priceCents: priceCents(pkg, currency) });
    }
    const transactions = combo.reduce((n, c) => n + c.count, 0);
    return { combo, totalCents: best.cents, totalCp: best.cp, leftoverCp: best.cp - shortfallCp, transactions };
}

// The baseline the savings callout measures against: the smallest SINGLE package that covers the
// whole shortfall on its own -- the move a player makes without a calculator. Falls back to the
// largest package when nothing covers it alone.
function naiveCover(shortfallCp, currency) {
    const fit = CP_PACKAGES.find(p => normalCp(p) >= shortfallCp) || CP_PACKAGES[CP_PACKAGES.length - 1];
    return {
        combo: [{ id: fit.id, count: 1, mode: 'normal', cpEach: normalCp(fit), priceCents: priceCents(fit, currency) }],
        totalCents: priceCents(fit, currency),
        totalCp: normalCp(fit),
        leftoverCp: normalCp(fit) - shortfallCp,
        transactions: 1
    };
}

// maxTransactions caps how many separate purchases a recommendation may involve -- enforced as a real
// dimension of the DP above, not a post-hoc filter. Without it the true optimum in CAD for a 5,000 CP
// shortfall is SIXTY-THREE $0.99 purchases ($62.37 vs $69.99 for the 5,000 pack) -- arithmetically
// right and nobody would ever do it. Every result reports its own transaction count so the tradeoff
// stays visible rather than hidden.
function optimizePurchase(shortfallCp, { currency = 'USD', doubleCpAvailable = [], maxTransactions = 6 } = {}) {
    if (shortfallCp <= 0) return null;
    const cheapest = solve(shortfallCp, doubleCpAvailable, currency, maxTransactions, CHEAPEST);
    const leastWaste = solve(shortfallCp, doubleCpAvailable, currency, maxTransactions, LEAST_WASTE);
    return { ...cheapest, cheapest, leastWaste, naive: naiveCover(shortfallCp, currency) };
}

module.exports = { CP_PACKAGES, CURRENCIES, normalCp, doubleCp, priceOf, priceCents, countryOf, formatMoney, optimizePurchase };
