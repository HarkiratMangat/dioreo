// scripts/armorySlotFill.test.js — portal/ui/armory.logic.js's slotCatalogue() and codeFill(), added for pins batch 2 Session 2 (agent D, brief 1b). These run in the browser bundle, so they are tested here directly against the real module rather than through a rendered page.
const assert = require('assert');
const { slotCatalogue, codeFill, parseCodePairs } = require('../portal/ui/armory.logic.js');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack || e.message}`); }
}

check('parseCodePairs reads digit-letter pairs in order', () => {
    assert.deepStrictEqual(parseCodePairs('2A4B5A8C9C'), [
        { pair: '2A', digit: '2', letter: 'A' },
        { pair: '4B', digit: '4', letter: 'B' },
        { pair: '5A', digit: '5', letter: 'A' },
        { pair: '8C', digit: '8', letter: 'C' },
        { pair: '9C', digit: '9', letter: 'C' },
    ]);
    assert.deepStrictEqual(parseCodePairs(''), []);
    // A trailing lone digit (still mid-typing) is not yet a pair.
    assert.deepStrictEqual(parseCodePairs('2A4'), [{ pair: '2A', digit: '2', letter: 'A' }]);
});

check('slotCatalogue maps attachment name to slot label from parallel arrays', () => {
    const builds = [
        { mode: 'MP', attachments: ['Monolithic Suppressor', 'MIP Light Barrel'], attachmentSlots: ['Muzzle', 'Barrel'] },
        { mode: 'MP', attachments: ['48 Round Extended Mag'], attachmentSlots: ['Ammunition'] },
        // DMZ entry must not leak into an MP-scoped catalogue.
        { mode: 'DMZ', attachments: ['DMZ-only thing'], attachmentSlots: ['Optic'] },
    ];
    const cat = slotCatalogue(builds, 'MP');
    assert.strictEqual(cat['Monolithic Suppressor'], 'Muzzle');
    assert.strictEqual(cat['MIP Light Barrel'], 'Barrel');
    assert.strictEqual(cat['48 Round Extended Mag'], 'Ammunition');
    assert.strictEqual(cat['DMZ-only thing'], undefined);
});

check('slotCatalogue skips a slot the label table does not recognise', () => {
    const builds = [{ mode: 'MP', attachments: ['Mystery'], attachmentSlots: ['trigger action'] }];
    assert.deepStrictEqual(slotCatalogue(builds, 'MP'), {});
});

check('codeFill is MP only', () => {
    assert.deepStrictEqual(codeFill([], 'akkey', 'DMZ', '2A4B5A8C9C'), []);
});

check('codeFill returns [] for a code with no complete pairs', () => {
    assert.deepStrictEqual(codeFill([], 'akkey', 'MP', ''), []);
});

check('codeFill names each pair from a sibling build of the SAME weapon+mode, in display order', () => {
    const builds = [
        // The sibling that supplies the names: its own shareCode's digits line up with its own attachmentSlots.
        {
            _id: '1', weaponKey: 'akkey', mode: 'MP', shareCode: '2A4B3C',
            attachments: ['MIP Light Barrel', 'No Stock', 'Reflex Sight'],
            attachmentSlots: ['Barrel', 'Stock', 'Optic'],
        },
    ];
    const filled = codeFill(builds, 'akkey', 'MP', '2A4B3C');
    // Display order is optic, muzzle, barrel, stock, ... so Optic (3C) precedes Barrel (2A) precedes Stock (4B).
    assert.deepStrictEqual(filled.map((f) => f.slot), ['optic', 'barrel', 'stock']);
    assert.strictEqual(filled.find((f) => f.slot === 'optic').name, 'Reflex Sight');
    assert.strictEqual(filled.find((f) => f.slot === 'barrel').name, 'MIP Light Barrel');
    assert.strictEqual(filled.find((f) => f.slot === 'stock').name, 'No Stock');
});

check('codeFill leaves a pair open (null) when this weapon has never used it', () => {
    const builds = [
        { _id: '1', weaponKey: 'akkey', mode: 'MP', shareCode: '2A', attachments: ['MIP Light Barrel'], attachmentSlots: ['Barrel'] },
    ];
    // 4B (Stock) has no sibling data for this weapon.
    const filled = codeFill(builds, 'akkey', 'MP', '2A4B');
    const stock = filled.find((f) => f.slot === 'stock');
    assert.strictEqual(stock.name, null);
    const barrel = filled.find((f) => f.slot === 'barrel');
    assert.strictEqual(barrel.name, 'MIP Light Barrel');
});

// 🔴 THE FALSIFIER (brief D 1b's own words): two weapons sharing a pair must never cross-fill. Row 15 measured this as a real disagreement (36 of 56 cases), so the registry MUST be scoped per weapon, not merely usually right about it.
check('FALSIFIER: two different weapons sharing the same pair never cross-fill', () => {
    const builds = [
        { _id: '1', weaponKey: 'locuskey', mode: 'MP', shareCode: '2A', attachments: ['Long Barrel'], attachmentSlots: ['Barrel'] },
        { _id: '2', weaponKey: 'fenneckey', mode: 'MP', shareCode: '2A', attachments: ['Short Barrel'], attachmentSlots: ['Barrel'] },
    ];
    const forLocus = codeFill(builds, 'locuskey', 'MP', '2A');
    const forFennec = codeFill(builds, 'fenneckey', 'MP', '2A');
    assert.strictEqual(forLocus.find((f) => f.slot === 'barrel').name, 'Long Barrel');
    assert.strictEqual(forFennec.find((f) => f.slot === 'barrel').name, 'Short Barrel');
    // A weapon with NO sibling data at all for this pair must get null, never the other weapon's name.
    const forUnknown = codeFill(builds, 'someotherkey', 'MP', '2A');
    assert.strictEqual(forUnknown.find((f) => f.slot === 'barrel').name, null);
});

check('codeFill never returns a "trigger action" row (no digit maps to it)', () => {
    const filled = codeFill([], 'akkey', 'MP', '1A2B3C4D5E6F7G8H9I');
    assert.ok(!filled.some((f) => f.slot === 'trigger action'));
    assert.strictEqual(filled.length, 9);
});

if (failures) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
} else {
    console.log('\nAll armorySlotFill checks passed.');
}
