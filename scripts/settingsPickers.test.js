// Registry-shape tests for utils/settingsPickers.js (v3-pre-release review finding #48). The registry is the single source both commands/settings.js (render) and handlers/settings.js (search modal + submit) parameterize into, keyed by the real wire action string so the key can never drift out of sync with the custom_id it dispatches on.

const assert = require('assert');
const { SETTINGS_PICKERS } = require('../utils/settingsPickers');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
}

const REQUIRED_KEYS = [
    'prefsField', 'modalPrefix', 'summaryLabel', 'placeholder', 'quickOptions', 'currentLabel',
    'searchLabel', 'searchDescription', 'modalTitle', 'fieldLabel', 'fieldPlaceholder',
    'noun', 'hintText', 'search'
];

check('the registry has exactly the two wire actions as keys', () => {
    assert.deepStrictEqual(Object.keys(SETTINGS_PICKERS).sort(), ['set_cpcurrency', 'set_timezone']);
});

check('every picker carries every required field (catches the #49-style drift this exists to prevent)', () => {
    for (const [action, picker] of Object.entries(SETTINGS_PICKERS)) {
        for (const key of REQUIRED_KEYS) {
            assert.ok(key in picker, `${action} is missing "${key}"`);
        }
    }
});

check('timezone quickOptions() delegates to utils/timezoneData.js, live-labeled', () => {
    const { QUICK_TIMEZONES } = require('../utils/timezoneData');
    const options = SETTINGS_PICKERS.set_timezone.quickOptions();
    assert.strictEqual(options.length, QUICK_TIMEZONES.length);
    assert.ok(options.every(o => typeof o.label === 'string' && typeof o.value === 'string'));
    assert.ok(options.some(o => o.value === 'America/Toronto'));
});

check('cpcurrency quickOptions() delegates to utils/cpCurrencyData.js', () => {
    const { QUICK_CURRENCIES } = require('../utils/cpCurrencyData');
    const options = SETTINGS_PICKERS.set_cpcurrency.quickOptions();
    assert.strictEqual(options.length, QUICK_CURRENCIES.length);
    assert.ok(options.some(o => o.value === 'USD'));
});

check('currentLabel() matches the original per-picker label functions', () => {
    const { findTimezoneLabel } = require('../utils/timezoneData');
    const { currencyLabel } = require('../utils/cpCurrencyData');
    assert.strictEqual(SETTINGS_PICKERS.set_timezone.currentLabel('America/Toronto'), findTimezoneLabel('America/Toronto'));
    assert.strictEqual(SETTINGS_PICKERS.set_cpcurrency.currentLabel('USD'), currencyLabel('USD'));
});

check('search() returns a normalized [{value,label}] list for both pickers', () => {
    const tzMatches = SETTINGS_PICKERS.set_timezone.search('sydney');
    assert.ok(tzMatches.length > 0);
    for (const m of tzMatches) {
        assert.strictEqual(typeof m.value, 'string');
        assert.strictEqual(typeof m.label, 'string');
    }
    const curMatches = SETTINGS_PICKERS.set_cpcurrency.search('canada');
    assert.ok(curMatches.length > 0);
    for (const m of curMatches) {
        assert.strictEqual(typeof m.value, 'string');
        assert.strictEqual(typeof m.label, 'string');
    }
});

check('noun + hintText reproduce the exact original "no match" wording, per picker', () => {
    const tz = SETTINGS_PICKERS.set_timezone;
    assert.strictEqual(
        `❌ No ${tz.noun} matched **"query"** — try ${tz.hintText}.`,
        '❌ No timezone matched **"query"** — try a bigger city near you, a country name, or an abbreviation like `PST`.'
    );
    const cur = SETTINGS_PICKERS.set_cpcurrency;
    assert.strictEqual(
        `❌ No ${cur.noun} matched **"query"** — try ${cur.hintText}.`,
        '❌ No currency matched **"query"** — try a country name or a 3-letter code like `CAD`.'
    );
});

check('noun reproduces the exact original deny-message wording, per picker', () => {
    assert.strictEqual(
        `Run \`/settings\` yourself to search your own ${SETTINGS_PICKERS.set_timezone.noun}.`,
        'Run `/settings` yourself to search your own timezone.'
    );
    assert.strictEqual(
        `Run \`/settings\` yourself to search your own ${SETTINGS_PICKERS.set_cpcurrency.noun}.`,
        'Run `/settings` yourself to search your own currency.'
    );
});

check('modalPrefix matches the real custom_id prefixes handlers/settings.js dispatches on', () => {
    assert.strictEqual(SETTINGS_PICKERS.set_timezone.modalPrefix, 'settingstz_search');
    assert.strictEqual(SETTINGS_PICKERS.set_cpcurrency.modalPrefix, 'settingscur_search');
});

console.log(failures === 0 ? '\nAll settingsPickers checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
