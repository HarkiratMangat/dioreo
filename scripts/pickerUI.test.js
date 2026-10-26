// Pure-builder tests for utils/pickerUI.js (v3-pre-release review finding #48 — the CP-currency and timezone pickers in /settings were line-for-line clones; this module is the shared UI shape both now parameterize into). Design: local/handoff/2026-08-18-review-remaining-items-handoff.md.

const assert = require('assert');
const { buildPickerSelectRow, buildPickerSearchModal } = require('../utils/pickerUI');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
}

check('buildPickerSelectRow returns a type-1 action row wrapping one type-3 select', () => {
    const row = buildPickerSelectRow({
        customId: 'set_timezone|123|1', placeholder: 'Pick a zone...',
        options: [{ label: 'Eastern', value: 'America/Toronto' }],
        currentValue: 'America/Toronto', searchLabel: '🔍 Search...', searchDescription: 'Not listed?'
    });
    assert.strictEqual(row.type, 1);
    assert.strictEqual(row.components.length, 1);
    const select = row.components[0];
    assert.strictEqual(select.type, 3);
    assert.strictEqual(select.custom_id, 'set_timezone|123|1');
    assert.strictEqual(select.placeholder, 'Pick a zone...');
});

check('marks the option matching currentValue as default, and no other', () => {
    const row = buildPickerSelectRow({
        customId: 'x', placeholder: 'p',
        options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }],
        currentValue: 'b', searchLabel: 'Search', searchDescription: 'd'
    });
    const [optA, optB] = row.components[0].options;
    assert.strictEqual(optA.default, false);
    assert.strictEqual(optB.default, true);
});

check('appends the search sentinel as the last option, with the given label/description', () => {
    const row = buildPickerSelectRow({
        customId: 'x', placeholder: 'p',
        options: [{ label: 'A', value: 'a' }],
        currentValue: 'a', searchLabel: '🔍 Search for your city...', searchDescription: 'Not in the list above?'
    });
    const sentinel = row.components[0].options.at(-1);
    assert.strictEqual(sentinel.label, '🔍 Search for your city...');
    assert.strictEqual(sentinel.value, '__search__');
    assert.strictEqual(sentinel.description, 'Not in the list above?');
});

check('a custom searchValue overrides the default __search__ sentinel value', () => {
    const row = buildPickerSelectRow({
        customId: 'x', placeholder: 'p', options: [], currentValue: null,
        searchLabel: 'S', searchDescription: 'd', searchValue: '__other__'
    });
    assert.strictEqual(row.components[0].options[0].value, '__other__');
});

check('buildPickerSearchModal builds a modal with the given customId/title and one short text input', () => {
    const modal = buildPickerSearchModal({
        customId: 'settingstz_search|123|1', title: 'Search for your timezone',
        fieldLabel: 'City, country, or abbreviation', fieldPlaceholder: 'e.g. "Sydney", "Brazil", "PST"'
    });
    const json = modal.toJSON();
    assert.strictEqual(json.custom_id, 'settingstz_search|123|1');
    assert.strictEqual(json.title, 'Search for your timezone');
    assert.strictEqual(json.components.length, 1);
    const field = json.components[0].components[0];
    assert.strictEqual(field.custom_id, 'query');
    assert.strictEqual(field.label, 'City, country, or abbreviation');
    assert.strictEqual(field.placeholder, 'e.g. "Sydney", "Brazil", "PST"');
    assert.strictEqual(field.required, true);
    assert.strictEqual(field.max_length, 60);
});

console.log(failures === 0 ? '\nAll pickerUI checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
