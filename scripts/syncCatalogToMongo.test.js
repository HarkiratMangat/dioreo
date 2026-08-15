// scripts/syncCatalogToMongo.test.js -- coverage for scripts/syncCatalogToMongo.js's pure logic: the
// display-name rule and the collection->group->variants flattening. No Mongo connection -- both
// functions are pure, so this pins the exact rule from docs/reference/nameplate-decoration-catalog.md
// ("<group_name> (<variant_label>)" for a multi-variant design, else the variant's own `name`) without
// a live database.
// Run: `node scripts/syncCatalogToMongo.test.js` (also via `npm test`).
const assert = require('assert');
const { computeDisplayName, flattenCatalog } = require('./syncCatalogToMongo');

let failures = 0;
const checks = [];
function check(name, fn) { checks.push([name, fn]); }
function run() {
    for (const [name, fn] of checks) {
        try { fn(); console.log(`  ✓ ${name}`); }
        catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
    }
}

check('computeDisplayName: a variant WITH variant_label -> "<group_name> (<variant_label>)"', () => {
    assert.strictEqual(
        computeDisplayName('Eternal Damnation', { variant_label: 'Blue' }),
        'Eternal Damnation (Blue)'
    );
});

check('computeDisplayName: a variant with NO variant_label uses its own `name`', () => {
    assert.strictEqual(computeDisplayName('Twilight', { name: 'Twilight' }), 'Twilight');
});

check('computeDisplayName: `name` wins even when it differs from groupName (never silently substitutes the group name)', () => {
    assert.strictEqual(computeDisplayName('Group X', { name: 'Actual Display Name' }), 'Actual Display Name');
});

check('computeDisplayName: neither field present falls back to groupName rather than throwing or returning empty', () => {
    assert.strictEqual(computeDisplayName('Fallback Name', {}), 'Fallback Name');
});

check('flattenCatalog: real worked example -- two-variant nameplate group with palette fields', () => {
    const catalog = {
        Underworld: {
            nameplates: [{
                group_name: 'Eternal Damnation',
                base_sku_id: 'BASE1',
                variants: [
                    { sku_id: 'SKU1', asset: 'nameplates/eternal_damnation/SKU1/', label: 'desc blue', palette: 'black', palette_hex: '#000000', variant_label: 'Blue', variant_value: '#79e4e3' },
                    { sku_id: 'SKU2', asset: 'nameplates/eternal_damnation/SKU2/', label: 'desc red', palette: 'black', palette_hex: '#000000', variant_label: 'Red', variant_value: '#fb515a' }
                ]
            }],
            decorations: []
        }
    };
    const docs = flattenCatalog(catalog);
    assert.strictEqual(docs.length, 2);
    assert.deepStrictEqual(docs.map(d => d.skuId), ['SKU1', 'SKU2']);
    assert.strictEqual(docs[0].kind, 'nameplate');
    assert.strictEqual(docs[0].parentCategory, 'Underworld');
    assert.strictEqual(docs[0].groupName, 'Eternal Damnation');
    assert.strictEqual(docs[0].baseSkuId, 'BASE1');
    assert.strictEqual(docs[0].displayName, 'Eternal Damnation (Blue)');
    assert.strictEqual(docs[0].paletteHex, '#000000');
    assert.strictEqual(docs[0].variantValue, '#79e4e3');
});

check('flattenCatalog: a single-variant decoration group carries `name`, no palette fields, kind=decoration', () => {
    const catalog = {
        'Toy Story': {
            nameplates: [],
            decorations: [{
                group_name: 'Woody',
                base_sku_id: 'DBASE',
                variants: [{ sku_id: 'DSKU', asset: 'a_deadbeef', label: 'a cowboy hat', name: 'Woody' }]
            }]
        }
    };
    const docs = flattenCatalog(catalog);
    assert.strictEqual(docs.length, 1);
    assert.strictEqual(docs[0].kind, 'decoration');
    assert.strictEqual(docs[0].displayName, 'Woody');
    assert.strictEqual(docs[0].palette, undefined, 'decorations must never carry a palette field');
    assert.strictEqual(docs[0].variantLabel, undefined, 'a single-variant design must never carry variantLabel');
});

check('flattenCatalog: multiple collections and multiple groups all flatten into one flat array', () => {
    const catalog = {
        A: { nameplates: [{ group_name: 'G1', base_sku_id: 'B1', variants: [{ sku_id: 'S1', asset: 'x', name: 'G1' }] }], decorations: [] },
        B: { nameplates: [], decorations: [{ group_name: 'G2', base_sku_id: 'B2', variants: [{ sku_id: 'S2', asset: 'y', name: 'G2' }] }] }
    };
    const docs = flattenCatalog(catalog);
    assert.strictEqual(docs.length, 2);
    assert.deepStrictEqual(docs.map(d => d.parentCategory).sort(), ['A', 'B']);
});

run();
if (failures > 0) {
    console.error(`❌ syncCatalogToMongo: ${failures} case(s) failed`);
    process.exit(1);
}
console.log(`✅ syncCatalogToMongo: ${checks.length} cases passed`);
