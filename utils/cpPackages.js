// ==========================================
// CP PACKAGE TABLE + PURCHASE OPTIMIZER
// ==========================================
// The six in-game COD Points packages, and the optimizer that works out the cheapest real-money way to cover a CP shortfall. Deliberately knows NOTHING about draws -- utils/drawCost.js works out how much CP is needed, this module works out how to buy it. Design: docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md.
//
// STORES BASE CP + BONUS PERCENTAGE, NEVER A TOTAL. Same rule DRAW_DATA follows, and it matters more here than it looks: the store's advertised number ALREADY has the bonus folded in (10,800 CP is 8,000 base + 35%), so storing the advertised figure would make the 2X figure impossible to derive correctly. During a 2X CP event a package gives base x 2 -- so the $99.99 tier yields 16,000, NOT double the advertised 10,800. Sourced from Harkirat's own store screenshots, 2026-08-15 15:06 EDT.
//
// PRICES ARE NOT A CURRENCY CONVERSION. Apple/Google assign price points directly PER STOREFRONT -- tier-locked, not rate-locked -- and the tiers are NOT proportional to each other. In 17 of 41 currencies "buy the biggest pack" is wrong, and in NOK/SEK the smallest pack is the best value in the store. Never derive a currency by converting from USD; the real figures live in the committed reference file below (all 41 currencies, captured 2026-08-15, provenance and traps documented in the companion .md).
//
// Money is INTEGER MINOR UNITS everywhere ("cents", though the true minor-unit size varies by currency -- see MINOR_UNIT_EXPONENT below). Floats would let two equally-priced combos compare unequal from binary rounding drift, and would let overshoot amounts differ across runs.
const PRICE_DATA = require('../docs/reference/cp-package-prices.json');

const BASE_CP = [80, 400, 800, 2000, 4000, 8000];
const BONUS_PCT = [0, 0.05, 0.10, 0.20, 0.25, 0.35];

// tierIndex is the join key into PRICE_DATA: PRICE_DATA.inGameBundlesCp[i] and every currency's prices[i] align with CP_PACKAGES[i]. normalCp(pkg) is asserted equal to inGameBundlesCp[i] by this module's own test, so a mistyped base/bonus here fails loudly rather than silently overstating CP.
const CP_PACKAGES = BASE_CP.map((baseCp, i) => ({
    id: `cp${baseCp}`,
    baseCp,
    bonusPct: BONUS_PCT[i],
    tierIndex: i
}));

const CURRENCIES = Object.keys(PRICE_DATA.currencies).sort();

// Minor-unit exponent per docs/reference/cp-package-prices.md's Schema section: JPY and CLP have no decimal places, KWD and BHD have three. Everything else defaults to the ISO-4217 standard of 2. Deliberately NOT inferred from the captured data's visible decimal digits -- a JSON number drops trailing zeros (449.90 parses as the JS number 449.9), which would misclassify an ordinary 2-decimal currency as having only one.
const MINOR_UNIT_EXPONENT = { JPY: 0, CLP: 0, KWD: 3, BHD: 3 };
function exponentOf(currency) { return MINOR_UNIT_EXPONENT[currency] ?? 2; }

// Major units as the store displays them (0.99, not 99) -- the raw figure from the price file.
function priceOf(pkg, currency) { return PRICE_DATA.currencies[currency].prices[pkg.tierIndex]; }
function countryOf(currency) { return PRICE_DATA.currencies[currency].country; }

// Integer minor units -- the unit the optimizer's DP runs in, so combos never compare unequal from float drift. Math.round because the source file stores major-unit floats (0.99 * 100 can land on 98.99999999999999 in binary floating point).
function priceCents(pkg, currency) { return Math.round(priceOf(pkg, currency) * 10 ** exponentOf(currency)); }

// Math.round rather than a bare multiply: 0.05/0.10/0.20/0.25/0.35 are not exact in binary floating point, so 400 * 1.05 can land on 420.00000000000006. Every real value here is a whole number of CP.
function normalCp(pkg) { return Math.round(pkg.baseCp * (1 + pkg.bonusPct)); }

// A 2X CP event replaces the package's normal bonus with +100%, so it is base x 2 -- never normalCp(pkg) x 2. See this module's header comment; getting this wrong overstates the top tier.
function doubleCp(pkg) { return pkg.baseCp * 2; }

// Display-only -- never used for money math (priceCents/exponentOf own that). A currency without a well-known symbol falls back to its ISO code.
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
// Minimize real money subject to totalCp >= shortfall, IN A GIVEN CURRENCY -- every price lookup below goes through priceCents(pkg, currency); nothing here reads a static per-package price, because the whole point of the 41-currency table is that the cheapest combination differs by storefront (in 17 of 41 currencies "buy the biggest pack" is wrong).
//
// WHY A DP AND NOT A RULE OF THUMB. Under normal USD pricing CP-per-dollar rises monotonically (80.8 -> 108.0), so bigger is strictly better value. Under 2X it is almost perfectly FLAT, with the smallest tier marginally best -- so the winning strategy inverts. Several other currencies are non-monotonic even under normal pricing. Multiple genuinely different strategies from one table is exactly the case a solver earns its place on.
//
// STRUCTURE. Normal packages are unbounded per type, but the TOTAL number of purchases (across every package and every 2X entitlement) is bounded by maxTransactions -- see the DP below. Unused 2X entitlements are additionally bounded at one each. Enumerate all 64 subsets of the AVAILABLE entitlements, and for each look up the bounded-unbounded DP for whatever CP and transaction budget remain. That DP is built ONCE per currency/objective/transaction-cap combination and reused across all 64 subsets.
const MAX_DP_CP = 60000; // Comfortably above any real shortfall; the largest full draw + upgrades is ~24k.

// dp[k][c] = the best way (per `better`) to obtain AT LEAST c CP using AT MOST k normal-package purchases, in `currency`. Bounding by transaction count is what makes maxTransactions (decision 20) real: without this dimension, the DP's mathematically optimal answer for a 5,000 CP shortfall in CAD is 63 separate $0.99 purchases -- correct, and nobody would ever do it. dp[k] carries forward dp[k-1]'s best states (using fewer than k purchases is always still valid at budget k).
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

// ⚠️ LEAST_WASTE WAS REMOVED 2026-08-27 00:07 EDT, and must not be reintroduced. It read `(a.cp !== b.cp ? a.cp < b.cp : a.cents < b.cents)` -- minimize CP OBTAINED, with money only as a tie-break -- so it would pay any amount to shave a single CP off the overshoot. Measured on the real table: covering 11,510 CP in CAD, it swapped one 10,800 pack for five smaller ones to drop the leftover from 30 CP to 10 CP, for CA$26.00 MORE. Harkirat's own reasoning is why it is gone rather than tuned: leftover CP is not waste, it is banked value the player spends later, so "minimize leftover" optimizes the wrong quantity entirely. The replacement (findStockUp below) points the other way -- it asks what a little MORE money buys at a better rate.

// How much more a recommendation may cost than the true optimum in order to need fewer separate purchases. Relative rather than a flat amount because minor-unit size varies by currency (JPY/CLP have none, KWD/BHD have three), so a fixed "300 cents" would mean wildly different things across the 41 storefronts.
//
// 🔴 TWO ALLOWANCES, THE LARGER WINS (2026-10-17 21:04 EDT, Harkirat: "H sounds good"). A flat 3% alone failed his own case: 8,730 CP short in CAD, it recommended FIVE purchases for CA$125.95 over one 10,800 pack for CA$129.99 -- 26 cents a purchase saved, and ~2,000 CP less. His words: "no one is making those 5 purchases to save 26 cents". So a candidate may also cost, for EACH purchase it saves against the optimum, up to the price of the smallest pack (in that currency) or PER_PURCHASE_PCT of the optimum, whichever is more. The 3% floor stays so nothing that passed before stops passing: swept over the real table, the new rule never picks MORE purchases than the old one and changes about one case in eight, every one toward fewer, bigger packs. Two rules that were tried and rejected, so they are not re-proposed: 1.5% per purchase saved with no 3% floor (picked MORE purchases than the old rule in 880 of 16,154 sampled cases), and a price-plus-cost-per-purchase score (jumped +67-118% on tiny totals).
const TRANSACTION_TOLERANCE_PCT = 0.03;
const PER_PURCHASE_PCT = 0.015;

// Stock Up's guard rails. A "better value" suggestion that costs triple is not a suggestion, so it is budget-capped relative to the practical answer; it is capped at three purchases because its whole appeal is buying FEWER, BIGGER packs; and it must beat the practical answer's CP-per-unit-money by a real margin or it is just the same advice with a bigger number. The DISPLAYED recommendation never asks for more than this many separate store purchases, no matter how loose the solver's own `maxTransactions` is. These are two different bounds and conflating them was a real bug: with maxTransactions raised to 63, the tolerance search below found nothing affordable at any small cap and fell straight back to the arithmetic optimum -- sixty-three CA$0.99 purchases, the exact absurdity the whole mechanism exists to refuse. Caught by this module's own test rather than in review.
const PRACTICAL_MAX_TX = 6;

const STOCK_UP_MAX_TX = 3;
const STOCK_UP_BUDGET_MULT = 1.6;
const STOCK_UP_MIN_RATE_GAIN = 0.03;

function popcount(mask) { let n = 0; while (mask) { n += mask & 1; mask >>= 1; } return n; }

// Turns a solved (entitlements + DP tail) state into the public result shape.
function materialize(best, bestState, dp, shortfallCp, currency) {
    const combo = best.used.map(p => ({ id: p.id, count: 1, mode: 'double', cpEach: doubleCp(p), priceCents: priceCents(p, currency) }));
    for (const [id, count] of walkBoundedDp(dp, bestState.remainingTransactions, bestState.remainingCp)) {
        const pkg = CP_PACKAGES.find(p => p.id === id);
        combo.push({ id, count, mode: 'normal', cpEach: normalCp(pkg), priceCents: priceCents(pkg, currency) });
    }
    const transactions = combo.reduce((n, c) => n + c.count, 0);
    return { combo, totalCents: best.cents, totalCp: best.cp, leftoverCp: best.cp - shortfallCp, transactions };
}

// One pass of the entitlement-subset enumeration against a PRE-BUILT dp, for a specific total-transaction budget `cap`. Split out of the old solve() so the same dp can be interrogated at several caps without rebuilding it -- that is what makes the fewest-purchases search below cheap.
function solveAtCap(dp, limit, bounded, currency, cap, better, shortfallCp) {
    let best = null;
    let bestState = null;
    for (let mask = 0; mask < (1 << bounded.length); mask++) {
        const usedCount = popcount(mask);
        if (usedCount > cap) continue;
        let cents = 0, cp = 0;
        const used = [];
        for (let i = 0; i < bounded.length; i++) {
            if (mask & (1 << i)) {
                cents += priceCents(bounded[i], currency);
                cp += doubleCp(bounded[i]);
                used.push(bounded[i]);
            }
        }
        const remainingTransactions = cap - usedCount;
        const remainingCp = Math.max(0, limit - cp);
        const tail = dp[remainingTransactions][remainingCp];
        if (!tail) continue; // remainingCp is not reachable within the remaining transaction budget
        const cand = { cents: cents + tail.cents, cp: cp + tail.cp, used, remainingTransactions, remainingCp };
        if (!best || better(cand, best)) { best = cand; bestState = { remainingTransactions, remainingCp }; }
    }
    return best ? materialize(best, bestState, dp, shortfallCp, currency) : null;
}

// ==========================================
// STOCK UP -- the second method (replaces Least Waste, 2026-08-27 00:07 EDT)
// ==========================================
// Answers "if I am spending anyway, what gets me the most CP per unit of money?", which is the question that actually follows from leftover CP having future value. Brute-forced rather than solved by the DP on purpose: the objective is a RATIO (cp / cents), which has no optimal substructure -- the best-rate way to reach 10,000 CP is not built from the best-rate way to reach 5,000 -- so a DP over it would be quietly wrong rather than slow. The search space is tiny (multisets of <= 3 from 6 packages, times at most 64 entitlement subsets), so exhaustive enumeration is both correct and instant.
//
// Returns null when it is not meaningfully different from `practical`, and the caller renders nothing. That is the common case and it is intended -- a second method that always appears has to invent a difference, which is exactly how Least Waste ended up recommending a CA$26.00 premium for 20 CP.
function findStockUp(shortfallCp, bounded, currency, practical) {
    // The purchase limit GROWS WITH THE CALCULATION (2026-10-16 01:11 EDT, Harkirat: "yeah sounds good, go for it"): at least 3, or as many as the practical answer itself needs, never past its own ceiling of 6. A flat 3 topped out at 3 x 10,800 = 32,400 CP, so above ~30,000 CP short Stock Up could never appear; a sweep of all 41 currencies found 47 such shortfalls where a 4-6 purchase option beat the practical rate by more than 3%.
    const maxTx = Math.min(PRACTICAL_MAX_TX, Math.max(STOCK_UP_MAX_TX, practical.transactions));
    const budget = Math.round(practical.totalCents * STOCK_UP_BUDGET_MULT);
    const baseRate = practical.totalCp / practical.totalCents;
    let best = null;
    const rateOf = c => c.cp / c.cents;

    for (let mask = 0; mask < (1 << bounded.length); mask++) {
        const usedCount = popcount(mask);
        if (usedCount > maxTx) continue;
        let baseCents = 0, baseCp = 0;
        const used = [];
        for (let i = 0; i < bounded.length; i++) {
            if (mask & (1 << i)) {
                baseCents += priceCents(bounded[i], currency);
                baseCp += doubleCp(bounded[i]);
                used.push(bounded[i]);
            }
        }
        if (baseCents > budget) continue;
        const counts = new Map();
        // `start` never moves backwards, so each multiset of normal packages is generated exactly once.
        const walk = (start, left, cents, cp) => {
            if (cp >= shortfallCp) {
                const cand = { cents, cp, used, counts: new Map(counts) };
                if (!best || rateOf(cand) > rateOf(best) || (rateOf(cand) === rateOf(best) && cand.cents < best.cents)) best = cand;
            }
            if (left === 0) return;
            for (let i = start; i < CP_PACKAGES.length; i++) {
                const pkg = CP_PACKAGES[i];
                const nextCents = cents + priceCents(pkg, currency);
                if (nextCents > budget) continue;
                counts.set(pkg.id, (counts.get(pkg.id) || 0) + 1);
                walk(i, left - 1, nextCents, cp + normalCp(pkg));
                const remaining = counts.get(pkg.id) - 1;
                if (remaining) counts.set(pkg.id, remaining); else counts.delete(pkg.id);
            }
        };
        walk(0, maxTx - usedCount, baseCents, baseCp);
    }

    if (!best) return null;
    // Three independent reasons to say nothing: no real rate gain, no extra CP to show for the money, or it is simply the practical answer again.
    if (rateOf(best) <= baseRate * (1 + STOCK_UP_MIN_RATE_GAIN)) return null;
    if (best.cp <= practical.totalCp) return null;
    if (best.cents === practical.totalCents && best.cp === practical.totalCp) return null;

    const combo = best.used.map(p => ({ id: p.id, count: 1, mode: 'double', cpEach: doubleCp(p), priceCents: priceCents(p, currency) }));
    for (const [id, count] of best.counts) {
        const pkg = CP_PACKAGES.find(p => p.id === id);
        combo.push({ id, count, mode: 'normal', cpEach: normalCp(pkg), priceCents: priceCents(pkg, currency) });
    }
    return {
        combo,
        totalCents: best.cents,
        totalCp: best.cp,
        leftoverCp: best.cp - shortfallCp,
        transactions: combo.reduce((n, c) => n + c.count, 0),
        extraCents: best.cents - practical.totalCents,
        extraCp: best.cp - practical.totalCp
    };
}

// The baseline the savings callout measures against: the smallest SINGLE package that covers the whole shortfall on its own -- the move a player makes without a calculator. Falls back to the largest package when nothing covers it alone.
function naiveCover(shortfallCp, currency) {
    const single = CP_PACKAGES.find(p => normalCp(p) >= shortfallCp);
    // No single package covers a basket-sized shortfall, so the no-calculator move becomes "buy the biggest pack until it is covered". Returning ONE pack there (the old behaviour) reported a baseline that does not actually cover the goal, and its leftoverCp went negative -- the same defect class as the ceiling bug below, in the one function whose whole job is to be a fair comparison.
    const fit = single || CP_PACKAGES[CP_PACKAGES.length - 1];
    const count = single ? 1 : Math.ceil(shortfallCp / normalCp(fit));
    const totalCp = normalCp(fit) * count;
    return {
        combo: [{ id: fit.id, count, mode: 'normal', cpEach: normalCp(fit), priceCents: priceCents(fit, currency) }],
        totalCents: priceCents(fit, currency) * count,
        totalCp,
        leftoverCp: totalCp - shortfallCp,
        transactions: count
    };
}

// ==========================================
// BULK PREFIX -- how a basket larger than the DP window gets an honest answer (added 2026-08-27 00:31 EDT)
// ==========================================
// 🔴 THE BUG THIS FIXES WAS SILENT AND ALREADY SHIPPED. solve() clamped `limit = Math.min(shortfallCp, MAX_DP_CP)`, so a shortfall above 60,000 CP was quietly REPLACED by a 60,000 CP question and the answer to that was returned as though it answered the real one. Measured before the fix: optimizePurchase(689900) returned a combo totalling 64,800 CP with no error and no null, and `leftoverCp` came back at -625,100. The panel renders that verbatim -- "Left Over: -625,100 CP". The exact threshold is 64,801 CP (at 64,800 it is still honest).
//
// It was unreachable in practice only by luck: the most expensive single draw plus upgrade is 38,160 CP (mythicCharacter @ region_30), which happens to sit below the clamp. NOTHING enforced that relationship. Multi-draw baskets make it trivial -- selecting every draw is 69,625 CP at region_20 and 137,980 CP at region_30, both past the threshold, and "select everything" is the first thing anyone tries.
//
// The fix: above the window, peel off K copies of the best-VALUE package so the DP only ever sees a remainder it can honestly solve, then optimise that remainder normally. Exact whenever the peeled package dominates on value, which is the case that makes a shortfall this large in the first place.
//
// ⚠️ THE BULK PACKAGE IS COMPUTED PER CURRENCY AND MUST STAY THAT WAY. Measured across the real table: the best CP-per-money package is the 8,000 tier in 32 of 41 currencies, but the 4,000 tier in 5, the 2,000 tier in 2, and the SMALLEST tier in 2. Hardcoding the top tier would be silently wrong for users in nine storefronts -- precisely the failure the 41-currency table exists to prevent.
function bestRatePackage(currency) {
    return CP_PACKAGES.reduce((best, p) => {
        const rate = normalCp(p) / priceCents(p, currency);
        return (!best || rate > best.rate) ? { pkg: p, rate } : best;
    }, null).pkg;
}

function bulkPrefix(shortfallCp, currency) {
    if (shortfallCp <= MAX_DP_CP) return null;
    const pkg = bestRatePackage(currency);
    const count = Math.ceil((shortfallCp - MAX_DP_CP) / normalCp(pkg));
    return { pkg, count, cp: count * normalCp(pkg), cents: count * priceCents(pkg, currency) };
}

// maxTransactions caps how many separate purchases a recommendation may involve -- enforced as a real dimension of the DP above, not a post-hoc filter. Without it the true optimum in CAD for a 5,000 CP shortfall is SIXTY-THREE $0.99 purchases ($62.37 vs $69.99 for the 5,000 pack) -- arithmetically right and nobody would ever do it.
//
// ⚠️ `cheapest` IS NOT THE ARITHMETIC MINIMUM, DELIBERATELY (2026-08-27 00:07 EDT). The cap alone was not enough: the DP happily spent its whole budget of six purchases chasing pennies. Measured on the real table, covering 11,510 CP in CAD, the true optimum is 4x80 + 1x420 + 1x10800 = CA$140.94 across SIX separate store transactions, while 1x880 + 1x10800 is CA$142.98 across TWO -- CA$2.04 more for four fewer purchases AND 140 more CP. Nobody picks the first, so it must not be what the panel prints. `cheapest` is therefore the FEWEST-PURCHASE combo whose cost is within the allowance of the true optimum (3%, or more for each purchase it saves -- see TRANSACTION_TOLERANCE_PCT), and the true optimum stays available as `absoluteCheapest` -- exported so a test can pin the exact arithmetic (a tolerance-based assertion alone could not tell a working search from a broken one).
function optimizePurchase(shortfallCp, { currency = 'USD', doubleCpAvailable = [], maxTransactions = 6 } = {}) {
    if (shortfallCp <= 0) return null;
    const bounded = CP_PACKAGES.filter(p => doubleCpAvailable.includes(p.id));

    // Peel bulk packs first so the DP only ever sees a target inside its own window (see bulkPrefix above). `target` is what every solve below is asked to cover; `shortfallCp` stays the truth every result is finally measured against.
    const bulk = bulkPrefix(shortfallCp, currency);
    const target = bulk ? shortfallCp - bulk.cp : shortfallCp;
    const limit = Math.min(Math.max(target, 0), MAX_DP_CP);
    const dp = buildBoundedDp(limit, maxTransactions, currency, CHEAPEST);

    // Folds the peeled bulk packs back into a tail result, re-basing every total on the REAL shortfall. Merging into an existing same-package line rather than appending a second one keeps the rendered combo readable ("60x 10,800 CP", not two separate rows of the same pack).
    const merge = r => {
        if (!r) return null;
        if (!bulk) return r;
        const combo = r.combo.map(c => ({ ...c }));
        const same = combo.find(c => c.id === bulk.pkg.id && c.mode === 'normal');
        if (same) same.count += bulk.count;
        else combo.unshift({ id: bulk.pkg.id, count: bulk.count, mode: 'normal', cpEach: normalCp(bulk.pkg), priceCents: priceCents(bulk.pkg, currency) });
        const totalCp = r.totalCp + bulk.cp;
        return {
            combo,
            totalCents: r.totalCents + bulk.cents,
            totalCp,
            leftoverCp: totalCp - shortfallCp,
            transactions: combo.reduce((n, c) => n + c.count, 0)
        };
    };

    // 🔴 A PACK'S 2X IS NOT OPTIONAL IN THE GAME (2026-10-17 21:10 EDT). Its double bonus applies to that pack's FIRST purchase automatically, so "buy the 80 CP pack at the normal rate" while its 2X is unused cannot happen -- the player gets double CP whether we say so or not. The DP prices the two independently, and a price tie (same cost, double CP) resolves to the normal one, so before this fix about 15% of recommendations with every 2X available (246 of 1,681 swept) showed a normal-rate pack whose own 2X sat unused, under-reporting the CP and the Left Over, and Stock Up then offered the 2X version "for 0 more". Turning that pack's first unit into its 2X costs nothing and makes the result what the game will actually give.
    const settle = r => {
        if (!r) return null;
        const combo = r.combo.map(c => ({ ...c }));
        let totalCp = r.totalCp;
        for (const pkg of bounded) {
            if (combo.some(c => c.id === pkg.id && c.mode === 'double')) continue;
            const line = combo.find(c => c.id === pkg.id && c.mode === 'normal');
            if (!line) continue;
            line.count -= 1;
            combo.push({ id: pkg.id, count: 1, mode: 'double', cpEach: doubleCp(pkg), priceCents: priceCents(pkg, currency) });
            totalCp += doubleCp(pkg) - normalCp(pkg);
        }
        const kept = combo.filter(c => c.count > 0);
        return { ...r, combo: kept, totalCp, leftoverCp: totalCp - shortfallCp };
    };

    const absoluteCheapest = settle(merge(solveAtCap(dp, limit, bounded, currency, maxTransactions, CHEAPEST, target)));
    // Unreachable within maxTransactions -- a caller passing a tighter cap can genuinely hit this, so every consumer must null-check.
    if (!absoluteCheapest) return null;

    // A candidate's allowance grows with the purchases it saves (see TRANSACTION_TOLERANCE_PCT). Purchases are counted AFTER merge, so peeled bulk packs count on both sides and cancel out.
    const floorCents = Math.round(absoluteCheapest.totalCents * TRANSACTION_TOLERANCE_PCT);
    const perPurchaseCents = Math.max(priceCents(CP_PACKAGES[0], currency), Math.round(absoluteCheapest.totalCents * PER_PURCHASE_PCT));
    const affordable = c => c.totalCents <= absoluteCheapest.totalCents + Math.max(floorCents, (absoluteCheapest.transactions - c.transactions) * perPurchaseCents);
    const ceiling = Math.min(maxTransactions, PRACTICAL_MAX_TX);
    // Start from the best answer available at the display ceiling, THEN try to buy fewer purchases with the tolerance. Starting from `absoluteCheapest` instead would leave a 63-purchase combo standing whenever nothing cheap enough exists at a low cap.
    let cheapest = settle(merge(solveAtCap(dp, limit, bounded, currency, ceiling, CHEAPEST, target))) || absoluteCheapest;
    for (let cap = 1; cap <= ceiling; cap++) {
        const candidate = settle(merge(solveAtCap(dp, limit, bounded, currency, cap, CHEAPEST, target)));
        if (candidate && affordable(candidate)) { cheapest = candidate; break; }
    }

    // 🔴 THE HONESTY GUARD, and it is the most important line in this module. Every failure this file has had -- the DP window clamp, the single-pack naive baseline -- surfaced as a result that did NOT cover the shortfall and rendered a NEGATIVE leftover rather than raising anything. A wrong number that looks like a number is far worse than a refusal, so a result that does not cover the goal is never returned. Cheap, and it catches every future variant of this bug class rather than just the two already found.
    if (cheapest.totalCp < shortfallCp || cheapest.leftoverCp < 0) return null;

    return {
        cheapest,
        absoluteCheapest,
        // Stock Up is deliberately skipped once bulk peeling is in play: its whole pitch is "a bit more money at a better rate", and a bulk basket is ALREADY buying the best-rate package repeatedly. There is nothing better-value left to suggest, so suggesting anything would be noise.
        stockUp: bulk ? null : findStockUp(shortfallCp, bounded, currency, cheapest),
        naive: naiveCover(shortfallCp, currency)
    };
}

// The recommendation's two allowances, exported for the same reason as Stock Up's below: the Help panel states the real numbers.
const PURCHASE_RULES = { tolerancePct: TRANSACTION_TOLERANCE_PCT, perPurchasePct: PER_PURCHASE_PCT };

// Stock Up's three thresholds, exported so the calculator's Help panel states the real numbers instead of a copy of them (2026-10-16 00:05 EDT).
const STOCK_UP_RULES = { maxPurchases: STOCK_UP_MAX_TX, maxPurchasesCeiling: PRACTICAL_MAX_TX, budgetMult: STOCK_UP_BUDGET_MULT, minRateGain: STOCK_UP_MIN_RATE_GAIN };

module.exports = { CP_PACKAGES, CURRENCIES, STOCK_UP_RULES, PURCHASE_RULES, normalCp, doubleCp, priceOf, priceCents, countryOf, formatMoney, optimizePurchase };
