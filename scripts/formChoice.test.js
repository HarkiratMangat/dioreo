// scripts/formChoice.test.js -- utils/formChoice.js (2026-11-10, Harkirat: "why are we using dropdowns for everything in forms when forms are capable of holding things such as checkboxes and radio boxes as well?", and "leave it out for items that use emojis"). Every shape it makes passes discord.js's own validation, a list with emojis or more than 10 options stays a dropdown, a lone single choice stays a dropdown (a radio group needs two), and readChoice reads all three controls, and an old dropdown, the same way.
const assert = require('assert');
const { LabelBuilder } = require('discord.js');
const { choiceField, asChoice, checkboxField, readChoice, readOne, readCheckbox } = require('../utils/formChoice');

let failed = 0;
function t(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (err) { failed++; console.log(`  ✗ ${name}\n    ${err.message}`); } }
const valid = label => new LabelBuilder(label).toJSON();
const opts = n => Array.from({ length: n }, (_, i) => ({ label: `Option ${i + 1}`, value: `v${i + 1}`, description: 'd' }));

t('choiceField: radio for one of 2-10, checkboxes for several, a dropdown past 10 or with emojis', () => {
    assert.strictEqual(choiceField({ id: 'a', label: 'A', options: opts(2) }).component.type, 21);
    assert.strictEqual(choiceField({ id: 'a', label: 'A', options: opts(10), multi: true }).component.type, 22);
    assert.strictEqual(choiceField({ id: 'a', label: 'A', options: opts(11) }).component.type, 3);
    assert.strictEqual(choiceField({ id: 'a', label: 'A', options: [...opts(2), { label: 'E', value: 'e', emoji: { name: '🔹' } }] }).component.type, 3);
    assert.strictEqual(choiceField({ id: 'a', label: 'A', options: opts(1) }).component.type, 3, 'one option, single: a radio group needs two');
    assert.strictEqual(choiceField({ id: 'a', label: 'A', options: opts(1), multi: true }).component.type, 22, 'one checkbox is fine');
    assert.strictEqual(choiceField({ id: 'a', label: 'A', options: opts(3), forceSelect: true }).component.type, 3);
    for (const f of [choiceField({ id: 'a', label: 'A', options: opts(4) }), choiceField({ id: 'a', label: 'A', options: opts(4), multi: true, required: false }), choiceField({ id: 'a', label: 'A', options: opts(4), multi: true, min: 2, max: 3 })]) valid(f);
});

t('asChoice: wraps a written-out dropdown where it stands; single or multi from max_values; one default on a radio', () => {
    const single = asChoice({ type: 3, custom_id: 's', required: true, min_values: 1, max_values: 1, placeholder: 'x', options: opts(3).map((o, i) => ({ ...o, default: i > 0 })) });
    assert.strictEqual(single.type, 21);
    assert.strictEqual(single.options.filter(o => o.default).length, 1, 'a second default would be refused');
    assert.ok(!('placeholder' in single));
    valid({ type: 18, label: 'S', component: single });
    const multi = asChoice({ type: 3, custom_id: 'm', required: false, min_values: 0, max_values: 3, options: opts(3) });
    assert.deepStrictEqual([multi.type, multi.required, multi.min_values, multi.max_values], [22, false, 0, 3]);
    valid({ type: 18, label: 'M', component: multi });
    const req = asChoice({ type: 3, custom_id: 'r', min_values: 0, max_values: 2, options: opts(2), required: true });
    valid({ type: 18, label: 'R', component: req });
    const emoji = { type: 3, custom_id: 'e', options: [{ label: 'A', value: 'a', emoji: { name: '🪙' } }, { label: 'B', value: 'b' }] };
    assert.strictEqual(asChoice(emoji), emoji, 'emoji lists come back untouched');
    const long = { type: 3, custom_id: 'l', options: opts(14) };
    assert.strictEqual(asChoice(long), long);
    assert.strictEqual(asChoice({ type: 4, custom_id: 't' }).type, 4, 'not a select');
});

t('checkboxField: a single yes/no box that validates', () => {
    valid(checkboxField({ id: 'c', label: 'C', checked: true }));
    assert.strictEqual(checkboxField({ id: 'c', label: 'C' }).component.type, 23);
});

t('readChoice reads a radio, a checkbox group, a checkbox, an old dropdown and nothing the same way', () => {
    const fields = map => ({ fields: { getField: id => { if (!(id in map)) throw new Error('not found'); return map[id]; }, getStringSelectValues: () => { throw new Error('no select'); } } });
    assert.deepStrictEqual(readChoice(fields({ r: { value: 'v2' } }), 'r'), ['v2']);
    assert.deepStrictEqual(readChoice(fields({ r: { value: null } }), 'r'), [], 'a radio left blank');
    assert.deepStrictEqual(readChoice(fields({ g: { values: ['a', 'b'] } }), 'g'), ['a', 'b']);
    assert.deepStrictEqual(readChoice(fields({ c: { value: true } }), 'c'), ['true']);
    assert.deepStrictEqual(readChoice(fields({}), 'x'), []);
    assert.strictEqual(readChoice(fields({}), 'x', { absent: null }), null, 'absent told apart from empty');
    const oldSelect = { fields: { getStringSelectValues: id => (id === 'o' ? ['picked'] : (() => { throw new Error('no'); })()) } };
    assert.deepStrictEqual(readChoice(oldSelect, 'o'), ['picked'], 'a stand-in with only getStringSelectValues');
    assert.strictEqual(readOne(fields({ r: { value: 'v1' } }), 'r'), 'v1');
    assert.strictEqual(readOne(fields({}), 'r'), null);
    assert.strictEqual(readCheckbox({ fields: { getCheckbox: () => true } }, 'c'), true);
});

t('the forms that moved to radio buttons and checkboxes still pass discord.js validation', () => {
    const { ModalBuilder } = require('discord.js');
    const modals = [
        require('../utils/feedback').feedbackModal(),
        require('../commands/draws').buildFilterModal(4095, 'jupiter'),
        require('../commands/draws').buildFilterModal(0, ''),
    ];
    for (const m of modals) new ModalBuilder(m).toJSON();
    const kinds = require('../handlers/manage/itemKinds').buildKindsModal('tok', [{ name: 'AK117 - Skin', title: 'A Draw' }]).toJSON();
    assert.strictEqual(kinds.components[0].component.type, 21);
});

t('custom emoji markup in a label or description keeps the dropdown (think pass, 2026-11-10)', () => {
    const marked = { type: 3, custom_id: 'm', options: [{ label: '<:Season10:1234567890> Means To An End', value: 'a' }, { label: 'B', value: 'b' }] };
    assert.strictEqual(asChoice(marked), marked);
    assert.strictEqual(choiceField({ id: 'm', label: 'M', options: [{ label: 'A', value: 'a', description: '<a:Spin:42> live' }, { label: 'B', value: 'b' }] }).component.type, 3);
    assert.strictEqual(choiceField({ id: 'p', label: 'P', options: [{ label: 'A: plain', value: 'a' }, { label: 'B', value: 'b' }] }).component.type, 21, 'a colon alone is not markup');
});

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
