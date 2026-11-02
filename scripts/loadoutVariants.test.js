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

// The body shows the picked option's code and marks only the swapped attachment.
const body1 = text(buildLoadoutCardBody(build, { variant: 1 }));
assert.ok(body1.includes('2D4D5H7B9B') && !body1.includes('2D5H7B8D9B'), 'option 2 shows its own code');
assert.ok(body1.includes('Removed Pad` 🔁') && !body1.includes('Heavy Barrel` 🔁'), 'only the swapped attachment is marked');
assert.ok(body1.includes('2 options, switch below'));
assert.ok(text(buildLoadoutCardBody(build)).includes('> -# Swap per preference.'), 'a comment is quote subtext');
console.log('  ✓ the body shows one option and marks the swap');

// A browse card gets a button per option, the open one disabled, and the copy ids carry the option.
const card = buildLoadoutCard([build], 0, { color: 1, idPrefix: 'mp', categoryBuilds: [build], browse: { scopeToken: 'mp~SMG', flatIndex: 0, flatTotal: 1 }, variant: 1 });
const all = text(card.components);
assert.ok(all.includes('gsb~var~mp~SMG~0~0') && all.includes('gsb~var~mp~SMG~0~1'));
assert.ok(all.includes('gsb~copy~mp~SMG~0~1'), 'Copy Code copies the option on screen');
// A card with no browse shows option 1 and no option buttons.
const flat = text(buildLoadoutCard([build], 0, { color: 1, idPrefix: 'mp', categoryBuilds: [build], variant: 1 }).components);
assert.ok(!flat.includes('gsb~var~') && flat.includes('2D5H7B8D9B'));
// A build with no options is unchanged: no marks, no buttons.
const plain = { ...build, variants: undefined };
assert.ok(!text(buildLoadoutCard([plain], 0, { color: 1, idPrefix: 'mp', categoryBuilds: [plain], browse: { scopeToken: 'mp~SMG', flatIndex: 0, flatTotal: 1 } }).components).match(/🔁|gsb~var~/));
console.log('  ✓ the card: one button per option, copy follows the option, plain builds untouched');
console.log('\nloadoutVariants: all checks passed.');
