// ==========================================
// SETTINGS PICKERS — the shared searchable-list registry
// ==========================================
// v3-pre-release review finding #48: /settings' CP-currency and Timezone pickers were line-for-line clones across four site-pairs (data module, select-render block, __search__ modal-open branch, modal-submit branch). This registry is the single source both commands/settings.js (render) and handlers/settings.js (search modal + submit) parameterize into, keyed by the REAL wire action string ('set_timezone'/'set_cpcurrency') -- the same self-enforcing-key pattern utils/manageActions.js uses, so the key can never drift out of sync with the custom_id it dispatches on. Pure data/functions only, no discord.js/handler dependency.
const { QUICK_TIMEZONES, findTimezoneLabel, searchTimezones, displayLabel } = require('./timezoneData');
const { QUICK_CURRENCIES, currencyLabel, searchCurrencies } = require('./cpCurrencyData');

const SETTINGS_PICKERS = {
    set_timezone: {
        prefsField: 'timezone',
        modalPrefix: 'settingstz_search',
        summaryLabel: 'Timezone',
        placeholder: 'Set Your Local Clock Timezone Filters...',
        // displayLabel appends the LIVE abbreviation (finding #45) -- called fresh on every render, never cached, since DST shifts which abbreviation is current.
        quickOptions: () => QUICK_TIMEZONES.map(z => ({ label: displayLabel(z.tz, z.label), value: z.tz })),
        currentLabel: (value) => findTimezoneLabel(value),
        searchLabel: '🔍 Search for your city...',
        searchDescription: 'Not in the list above? Type a city, country, or abbreviation.',
        modalTitle: 'Search for your timezone',
        fieldLabel: 'City, country, or abbreviation',
        fieldPlaceholder: 'e.g. "Sydney", "Brazil", "PST"',
        noun: 'timezone',
        hintText: 'a bigger city near you, a country name, or an abbreviation like `PST`',
        search: (query) => searchTimezones(query, 10)
    },
    set_cpcurrency: {
        prefsField: 'cpCurrency',
        modalPrefix: 'settingscur_search',
        summaryLabel: 'CP Currency',
        placeholder: 'Set which storefront /draw calculator quotes prices from...',
        quickOptions: () => QUICK_CURRENCIES.map(code => ({ label: currencyLabel(code), value: code })),
        currentLabel: (value) => currencyLabel(value),
        searchLabel: '🔍 Search for your currency...',
        searchDescription: 'Not in the list above? Type a country or currency code.',
        modalTitle: 'Search for your currency',
        fieldLabel: 'Country or currency code',
        fieldPlaceholder: 'e.g. "Canada", "CAD"',
        noun: 'currency',
        hintText: 'a country name or a 3-letter code like `CAD`',
        search: (query) => searchCurrencies(query, 10)
    }
};

module.exports = { SETTINGS_PICKERS };
