// scripts/drawIndexSync.test.js -- the draw index follows a /manage draw edit (utils/drawIndexSync.js, 2026-11-11 22:33 EST). No database: indexChanges is pure, and the op's inverse is checked for the restore it carries.
const assert = require('assert');
const { indexChanges } = require('../utils/drawIndexSync');
let failures = 0;
const check = (name, fn) => { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message.split('\n').slice(0, 4).join('\n      ')}`); } };
const entry = { slug: 'world-champs-final-draw', title: 'World Champs Final Draw', priceType: 'legendaryGunReactive', items: [{ tier: 'legendary', name: 'AK117 - Final', kind: 'weapon', baseName: 'AK117', skinName: 'Final' }], tags: ['draw', 'ptype_legendaryGunReactive'], fp: 'old' };

check('an edit with more items and another draw type updates the entry, keeping a kind already set', () => {
    const set = indexChanges(entry, [entry], { items: [{ tier: 'legendary', name: 'AK117 - Final' }, { tier: 'epic', name: 'Ghost - Champ' }, { tier: 'comment', name: 'a note' }], priceType: 'sevenSpinLegendaryWeapon' });
    assert.deepStrictEqual(set.items.map(i => [i.tier, i.name]), [['legendary', 'AK117 - Final'], ['epic', 'Ghost - Champ']]);
    assert.strictEqual(set.items[0].kind, 'weapon', 'the kind he set is kept');
    assert.strictEqual(set.priceType, 'sevenSpinLegendaryWeapon');
    assert.ok(set.fp && set.fp !== 'old' && set.tags.includes(`fp_${set.fp}`) && set.tags.includes('ptype_sevenSpinLegendaryWeapon'), JSON.stringify(set.tags));
});
check('an edit that matches the entry changes nothing', () => {
    assert.strictEqual(indexChanges(entry, [entry], { items: [{ tier: 'legendary', name: 'AK117 - Final' }], priceType: 'legendaryGunReactive' }), null);
});
check('an add only fills what the entry lacks', () => {
    assert.strictEqual(indexChanges(entry, [entry], { items: [{ tier: 'epic', name: 'Other' }], priceType: 'sevenSpinLegendaryWeapon' }, { fillOnly: true }), null, 'never overwrites');
    const bare = { ...entry, items: [], priceType: '' };
    const set = indexChanges(bare, [bare], { items: [{ tier: 'epic', name: 'Other' }], priceType: 'sevenSpinLegendaryWeapon' }, { fillOnly: true });
    assert.ok(set.items.length === 1 && set.priceType === 'sevenSpinLegendaryWeapon');
});
check('an unknown or blank draw type never clears the entry\'s', () => {
    assert.strictEqual(indexChanges(entry, [entry], { items: [{ tier: 'legendary', name: 'AK117 - Final' }], priceType: '' }), null);
});
check('draw.edit\'s inverse carries the index entry\'s prior values, and only when it synced', () => {
    require('../core/ops/draws');
    const op = require('../core/ops').resolveOp('draw.edit');
    const withIndex = op.invert({ applied: { category: 'new', elementId: 'x', prior: { title: 'A' }, index: { id: 'i', prior: { priceType: 'legendaryGunReactive' } } } });
    assert.deepStrictEqual(withIndex.payload, { title: 'A', __indexRestore: { id: 'i', prior: { priceType: 'legendaryGunReactive' } } });
    assert.deepStrictEqual(op.invert({ applied: { category: 'new', elementId: 'x', prior: { title: 'A' } } }).payload, { title: 'A' });
});
if (failures) { console.error(`\n${failures} check(s) FAILED.`); process.exit(1); }
console.log('\nAll draw index sync checks passed.');
