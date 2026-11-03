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

// One panel shows every option (Harkirat, 2026-11-02 19:48 EST: "condense it to a single page, even for multiple options").
const { mergedAttachmentLines, copyText } = require('../utils/loadoutRender');
// Different slots: the shared four, then each option's own attachment on one "or" line.
assert.deepStrictEqual(mergedAttachmentLines(build), ['`Heavy Barrel`', '`VX Pineapple Grip (Lightweight)`', '`Phoenix Grip Set`', '`Rapid Fire`', '`Fast Extended Mag` or `Removed Pad`']);
// Same slots: one line per slot, the differing slot reads "A or B".
const laser = { ...build, attachments: ['Polarfire-S', 'SZ 1MW PEQ'], attachmentSlots: ['Muzzle', 'Laser'], variants: [{ attachments: ['Polarfire-S', 'Schlager PEQ Box IV'], attachmentSlots: ['Muzzle', 'Laser'], shareCode: 'B', imageKey: 'K-B' }] };
assert.deepStrictEqual(mergedAttachmentLines(laser), ['`Polarfire-S`', '`SZ 1MW PEQ` or `Schlager PEQ Box IV`']);
const body = text(buildLoadoutCardBody(build));
assert.ok(body.includes('### Gunsmith Codes') && body.includes('2D5H7B8D9B') && body.includes('2D4D5H7B9B'), 'every code on the panel');
const gallery = buildLoadoutCardBody(build).find(c => c.type === 12);
assert.strictEqual(gallery.items.length, 2, 'every screenshot in one gallery');
assert.ok(text(buildLoadoutCardBody(build)).includes('> -# Swap per preference.'), 'a comment is quote subtext');
console.log('  ✓ one panel: shared attachments, the differences, every code and screenshot');

// No option buttons, and Copy gives every option under its name.
const card = text(buildLoadoutCard([build], 0, { color: 1, idPrefix: 'mp', categoryBuilds: [build], browse: { scopeToken: 'mp~SMG', flatIndex: 0, flatTotal: 1 } }).components);
assert.ok(!card.includes('gsb~var~') && card.includes('gsb~copy~mp~SMG~0"'));
assert.strictEqual(copyText(build, 'code'), '**Fast Extended Mag**\n2D5H7B8D9B\n\n**Removed Pad**\n2D4D5H7B9B');
const plain = { ...build, variants: undefined };
assert.strictEqual(copyText(plain, 'code'), '2D5H7B8D9B');
assert.ok(text(buildLoadoutCardBody(plain)).includes('### Gunsmith Code: `2D5H7B8D9B`'), 'a build with no options is unchanged');
console.log('  ✓ copy gives every option; plain builds untouched');
console.log('\nloadoutVariants: all checks passed.');
