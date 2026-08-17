// ==========================================
// CP CURRENCY DATA -- quick list + fuzzy search
// ==========================================
// /draw calculator's and /settings' currency picker. Mirrors utils/timezoneData.js's exact shape: Discord's own select menu caps at 25 options, and there are 41 real currencies (see docs/reference/cp-package-prices.json/.md), so a flat dropdown can only ever offer a SHORTLIST plus a "Search..." sentinel that opens a modal -- never all 41 at once, and never a silent truncation to 25 that would strand players in the other 16 currencies.
const { fuzzyMatch } = require('./search');
const { CURRENCIES, countryOf } = require('./cpPackages');

// The dropdown's direct one-click picks -- common CODM storefronts, capped well under 24 so the "Search for your currency..." sentinel fits as the 25th option (Discord's select-menu cap).
const QUICK_CODES = [
    'USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'JPY', 'CHF', 'BRL', 'MXN',
    'ZAR', 'TRY', 'SAR', 'AED', 'QAR', 'PLN', 'SEK', 'NOK', 'DKK', 'PKR'
];
const QUICK_CURRENCIES = QUICK_CODES.filter(c => CURRENCIES.includes(c));

function currencyLabel(code) {
    return `${countryOf(code)} (${code})`;
}

// Fuzzy-matches a typed query against the currency code AND its country name, so "canada", "cad" and "CAD" all resolve the same currency. fuzzyMatch has no scoring, so this preserves CURRENCIES' own (alphabetical) order among whatever matches rather than ranking by closeness -- same convention searchTimezones already uses.
function searchCurrencies(query, limit = 25) {
    const q = (query || '').trim();
    if (!q) return [];
    return CURRENCIES.filter(code => fuzzyMatch(q, code) || fuzzyMatch(q, countryOf(code))).slice(0, limit);
}

module.exports = { QUICK_CURRENCIES, currencyLabel, searchCurrencies };
