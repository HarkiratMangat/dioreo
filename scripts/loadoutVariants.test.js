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

// Different slots (VMP: Ammunition vs Stock) -> compact cards, his pick "3" (2026-11-02 20:13 EST).
const { copyText, sameSlots } = require('../utils/loadoutRender');
assert.strictEqual(sameSlots(build), false);
const comps = buildLoadoutCardBody(build);
const sections = comps.filter(c => c.type === 9);
assert.strictEqual(sections.length, 2, 'one card per option, its screenshot beside it');
const optB = sections[1].components[0].content;
assert.ok(optB.startsWith('**Option B**') && optB.includes('2D4D5H7B9B') && optB.includes('-# 2. Removed Pad') && optB.includes('-# 5. Rapid Fire'), 'title line with its code, full list in small text');
assert.ok(!comps.some(c => c.type === 14 && c.divider && comps.indexOf(c) > 2), 'no dividers between the cards');
assert.ok(!text(comps).includes('### Gunsmith Code:') && !comps.some(c => c.type === 12));
console.log('  ✓ different slots: compact option cards');

// Same slots (ISO Hemlock's lasers) -> the regular panel, "`A` or `B`", both codes, both screenshots.
const laser = { ...build, attachments: ['Polarfire-S', 'SZ 1MW PEQ'], attachmentSlots: ['Muzzle', 'Laser'], shareCode: 'A1A', imageKey: 'ISO-A1A', variants: [{ attachments: ['Polarfire-S', 'Schlager PEQ Box IV'], attachmentSlots: ['Muzzle', 'Laser'], shareCode: 'B2B', imageKey: 'ISO-B2B' }] };
assert.strictEqual(sameSlots(laser), true);
const reg = buildLoadoutCardBody(laser);
assert.ok(text(reg).includes('2. `SZ 1MW PEQ` or `Schlager PEQ Box IV`') && text(reg).includes('1. `Polarfire-S`'));
assert.ok(text(reg).includes('### Gunsmith Code: `A1A` or `B2B`'));
assert.strictEqual(reg.find(c => c.type === 12).items.length, 2);
assert.ok(!reg.some(c => c.type === 9));
assert.ok(text(reg).includes('> -# Swap per preference.'), 'a comment is quote subtext');
console.log('  ✓ same slots: the regular panel with "or" and both codes');

// No option buttons, and Copy gives every option under its letter.
const card = text(buildLoadoutCard([build], 0, { color: 1, idPrefix: 'mp', categoryBuilds: [build], browse: { scopeToken: 'mp~SMG', flatIndex: 0, flatTotal: 1 } }).components);
assert.ok(!card.includes('gsb~var~') && card.includes('gsb~copy~mp~SMG~0"'));
assert.strictEqual(copyText(build, 'code'), '**Option A**\n2D5H7B8D9B\n\n**Option B**\n2D4D5H7B9B');
const plain = { ...build, variants: undefined };
assert.strictEqual(copyText(plain, 'code'), '2D5H7B8D9B');
assert.ok(text(buildLoadoutCardBody(plain)).includes('### Gunsmith Code: `2D5H7B8D9B`'), 'a build with no options is unchanged');
console.log('  ✓ copy gives every option; plain builds untouched');
console.log('\nloadoutVariants: all checks passed.');
