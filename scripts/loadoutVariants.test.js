// Swap options on one build (models/Loadout.js `variants`, Harkirat 2026-11-02 11:41 EST): the card shows one option at a time, marks what changes, gives a button per option, and Copy copies the option on screen.
const assert = require('assert');
const { variantView, variantCount, swapSlots, variantLabel, buildLoadoutCardBody, buildLoadoutCard } = require('../utils/loadoutRender');

const build = {
    weaponKey: 'vmp', weaponName: 'VMP', category: 'SMG', mode: 'MP', buildName: 'Build 1', lastUpdated: new Date('2026-11-02'),
    attachments: ['Heavy Barrel', 'VX Pineapple Grip (Lightweight)', 'Fast Extended Mag', 'Phoenix Grip Set', 'Rapid Fire'],
    attachmentSlots: ['Barrel', 'Underbarrel', 'Ammunition', 'Rear Grip', 'Perk'],
    shareCode: '2D5H7B8D9B', imageKey: 'VMP-2D5H7B8D9B', description: 'Swap per preference.',
    variants: [{ label: '', attachments: ['Heavy Barrel', 'Removed Pad', 'VX Pineapple Grip (Lightweight)', 'Phoenix Grip Set', 'Rapid Fire'], attachmentSlots: ['Barrel', 'Stock', 'Underbarrel', 'Rear Grip', 'Perk'], shareCode: '2D4D5H7B9B', imageKey: 'VMP-2D4D5H7B9B' }],
};
const text = comps => JSON.stringify(comps);

// The two options differ in TWO slots, one of which the other leaves empty: whole-option variants, not a one-slot swap.
assert.strictEqual(variantCount(build), 2);
assert.deepStrictEqual([...swapSlots(build)].sort(), ['Ammunition', 'Stock']);
assert.strictEqual(variantView(build, 1).shareCode, '2D4D5H7B9B');
assert.strictEqual(variantView(build, 9).shareCode, '2D4D5H7B9B', 'an out-of-range option clamps to the last');
assert.strictEqual(variantView(build, 0), build);
assert.strictEqual(variantLabel(build, 0), 'Fast Extended Mag');
assert.strictEqual(variantLabel(build, 1), 'Removed Pad');
console.log('  ✓ options, swapped slots and labels');

// Option cards (Harkirat, 2026-11-02 20:06 EST: "option cards but each has its own full set of attachments").
const { copyText } = require('../utils/loadoutRender');
const comps = buildLoadoutCardBody(build);
const sections = comps.filter(c => c.type === 9);
assert.strictEqual(sections.length, 2, 'one card per option, each with its screenshot beside it');
assert.ok(sections.every(c => c.accessory && c.accessory.type === 11));
const optB = sections[1].components[0].content;
assert.ok(optB.startsWith('### Option B') && optB.includes('5. `Rapid Fire`') && optB.includes('`Removed Pad`') && optB.includes('2D4D5H7B9B'), 'option B lists its full set and its own code');
assert.ok(!text(comps).includes('### Gunsmith Code:') && !comps.some(c => c.type === 12), 'no single-build code line or gallery');
assert.ok(text(comps).includes('> -# Swap per preference.'), 'a comment is quote subtext');
console.log('  ✓ one card per option, full attachment list, its code and screenshot');

// No option buttons, and Copy gives every option under its letter.
const card = text(buildLoadoutCard([build], 0, { color: 1, idPrefix: 'mp', categoryBuilds: [build], browse: { scopeToken: 'mp~SMG', flatIndex: 0, flatTotal: 1 } }).components);
assert.ok(!card.includes('gsb~var~') && card.includes('gsb~copy~mp~SMG~0"'));
assert.strictEqual(copyText(build, 'code'), '**Option A**\n2D5H7B8D9B\n\n**Option B**\n2D4D5H7B9B');
const plain = { ...build, variants: undefined };
assert.strictEqual(copyText(plain, 'code'), '2D5H7B8D9B');
assert.ok(text(buildLoadoutCardBody(plain)).includes('### Gunsmith Code: `2D5H7B8D9B`'), 'a build with no options is unchanged');
console.log('  ✓ copy gives every option; plain builds untouched');
console.log('\nloadoutVariants: all checks passed.');
