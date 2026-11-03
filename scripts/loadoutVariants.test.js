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

// Every build with options -> compact cards (Harkirat, 2026-11-02 20:18 EST: "merged builds = options layout. simple").
const { copyText } = require('../utils/loadoutRender');
const comps = buildLoadoutCardBody(build);
const sections = comps.filter(c => c.type === 9);
assert.strictEqual(sections.length, 2, 'one card per option, its screenshot beside it');
const optB = sections[1].components[0].content;
assert.ok(optB.startsWith('**Option B**') && optB.includes('2D4D5H7B9B') && optB.includes('-# 2. Removed Pad') && optB.includes('-# 5. Rapid Fire'), 'title line with its code, full list in small text');
assert.ok(!comps.some(c => c.type === 14 && c.divider && comps.indexOf(c) > 2), 'no dividers between the cards');
assert.ok(!text(comps).includes('### Gunsmith Code:') && !comps.some(c => c.type === 12));


// Same slots (ISO Hemlock's lasers) get the same cards.
const laser = { ...build, attachments: ['Polarfire-S', 'SZ 1MW PEQ'], attachmentSlots: ['Muzzle', 'Laser'], shareCode: 'A1A', imageKey: 'ISO-A1A', variants: [{ attachments: ['Polarfire-S', 'Schlager PEQ Box IV'], attachmentSlots: ['Muzzle', 'Laser'], shareCode: 'B2B', imageKey: 'ISO-B2B' }] };
assert.strictEqual(buildLoadoutCardBody(laser).filter(c => c.type === 9).length, 2);
console.log('  ✓ every merged build: compact option cards');

// No option buttons, and Copy gives every option under its letter.
const card = text(buildLoadoutCard([build], 0, { color: 1, idPrefix: 'mp', categoryBuilds: [build], browse: { scopeToken: 'mp~SMG', flatIndex: 0, flatTotal: 1 } }).components);
assert.ok(!card.includes('gsb~var~') && card.includes('gsb~copy~mp~SMG~0"'));
assert.strictEqual(copyText(build, 'code'), '**Option A**\nVMP-2D5H7B8D9B\n\n**Option B**\nVMP-2D4D5H7B9B');
const plain = { ...build, variants: undefined };
assert.strictEqual(copyText(plain, 'code'), 'VMP-2D5H7B8D9B');
// The code copies as `WEAPON-CODE` with the weapon's real name in capitals (Harkirat, 2026-11-02 21:49 EST, capitals 22:11 EST), the space kept; a build with no code keeps its bare build name.
const { catalogueWeaponName, buildIndex } = require('../utils/catalogue');
const idx = buildIndex([{ kind: 'weapon', name: 'ISO Hemlock' }, { kind: 'weapon', name: 'AK117' }]);
assert.strictEqual(catalogueWeaponName('ISO HEMLOCK', idx), 'ISO Hemlock');
assert.strictEqual(catalogueWeaponName('UNKNOWN GUN', idx), 'UNKNOWN GUN');
assert.strictEqual(copyText({ ...plain, shareCode: '' }, 'code'), 'Build 1');
// All caps, the name's own space and dash kept (Harkirat, 2026-11-02 22:11 EST).
assert.strictEqual(copyText({ ...plain, weaponName: 'Iso Hemlock' }, 'code'), 'ISO HEMLOCK-2D5H7B8D9B');
assert.strictEqual(copyText({ ...plain, weaponName: 'Static-HV' }, 'code'), 'STATIC-HV-2D5H7B8D9B');
assert.ok(text(buildLoadoutCardBody(plain)).includes('### Gunsmith Code: `VMP-2D5H7B8D9B`'), 'a build with no options is unchanged');
console.log('  ✓ copy gives every option; plain builds untouched');
console.log('\nloadoutVariants: all checks passed.');
