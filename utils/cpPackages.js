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

module.exports = { CP_PACKAGES, CURRENCIES, normalCp, doubleCp, priceOf, priceCents, countryOf, formatMoney };
