// scripts/catalogGrouping.test.js -- coverage for scripts/catalogGrouping.js's grouping/chunking logic,
// the mechanism behind the "one design, several variants -> ONE cache-channel message" feature in
// scripts/bulkCacheCollectibles.js. Pure functions, no Mongo/Cloudinary/Discord -- deliberately fast so
// the component-budget math and the grouping key can be pinned without a live run.
// Run: `node scripts/catalogGrouping.test.js` (also via `npm test`).
const assert = require('assert');
const { groupKey, groupCatalogDocs, chunkVariants, MAX_VARIANTS_PER_MESSAGE } = require('./catalogGrouping');

let failures = 0;
const checks = [];
function check(name, fn) { checks.push([name, fn]); }
function run() {
    for (const [name, fn] of checks) {
        try { fn(); console.log(`  ✓ ${name}`); }
        catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
    }
}

function doc(overrides) {
    return { kind: 'nameplate', parentCategory: 'Underworld', groupName: 'Eternal Damnation', skuId: 'sku', ...overrides };
}

check('groupCatalogDocs: variants of the same (kind, collection, groupName) land in ONE group', () => {
    const docs = [
        doc({ skuId: '1', variantLabel: 'Blue' }),
        doc({ skuId: '2', variantLabel: 'Red' })
    ];
    const groups = groupCatalogDocs(docs);
    assert.strictEqual(groups.length, 1, 'two variants of the same design must be ONE group, not two');
    assert.strictEqual(groups[0].variants.length, 2);
    assert.deepStrictEqual(groups[0].variants.map(v => v.skuId), ['1', '2'], 'variant order must be preserved');
});

check('groupCatalogDocs: same groupName in a DIFFERENT collection is a SEPARATE group', () => {
    const docs = [
        doc({ skuId: '1', parentCategory: 'Underworld' }),
        doc({ skuId: '2', parentCategory: 'Solar Eclipse' })
    ];
    const groups = groupCatalogDocs(docs);
    assert.strictEqual(groups.length, 2, 'collection is part of the grouping key -- same design name in two collections must not merge');
});

check('groupCatalogDocs: same asset/groupName but different KIND is a separate group', () => {
    const docs = [doc({ skuId: '1', kind: 'nameplate' }), doc({ skuId: '2', kind: 'decoration' })];
    const groups = groupCatalogDocs(docs);
    assert.strictEqual(groups.length, 2, 'kind must be part of the grouping key');
});

check('groupCatalogDocs: group ORDER follows first-seen order in the input', () => {
    const docs = [doc({ skuId: '1', groupName: 'B' }), doc({ skuId: '2', groupName: 'A' }), doc({ skuId: '3', groupName: 'B' })];
    const groups = groupCatalogDocs(docs);
    assert.deepStrictEqual(groups.map(g => g.groupName), ['B', 'A'], 'a later doc of an EARLIER group must not move that group later in output order');
});

check('groupKey: identical for two docs with the same triple, different for any differing field', () => {
    const a = doc({ skuId: '1' });
    const b = doc({ skuId: '2' }); // same kind/collection/groupName, different sku -- key must match
    assert.strictEqual(groupKey(a), groupKey(b));
    assert.notStrictEqual(groupKey(a), groupKey({ ...a, parentCategory: 'Other' }));
});

check('chunkVariants: a group at or under the cap stays in ONE chunk', () => {
    const items = Array.from({ length: MAX_VARIANTS_PER_MESSAGE }, (_, i) => i);
    const chunks = chunkVariants(items);
    assert.strictEqual(chunks.length, 1);
    assert.strictEqual(chunks[0].length, MAX_VARIANTS_PER_MESSAGE);
});

check('chunkVariants: a group ONE OVER the cap splits into two chunks, none exceeding it', () => {
    const items = Array.from({ length: MAX_VARIANTS_PER_MESSAGE + 1 }, (_, i) => i);
    const chunks = chunkVariants(items);
    assert.strictEqual(chunks.length, 2, 'must split rather than silently exceed the component budget');
    for (const c of chunks) assert.ok(c.length <= MAX_VARIANTS_PER_MESSAGE, `chunk of ${c.length} exceeds the cap of ${MAX_VARIANTS_PER_MESSAGE}`);
    assert.strictEqual(chunks.flat().length, items.length, 'no item may be dropped by chunking');
});

check('chunkVariants: an empty array chunks to a single empty chunk, never zero chunks or a crash', () => {
    const chunks = chunkVariants([]);
    assert.strictEqual(chunks.length, 1);
    assert.deepStrictEqual(chunks[0], []);
});

check('MAX_VARIANTS_PER_MESSAGE: computed budget leaves real headroom under Discord\'s real 40-component ceiling', () => {
    // divider(1) + Section(1) + TextDisplay(1) + Thumbnail accessory(1) per variant, + a fixed
    // Container + header TextDisplay (2) -- assert real headroom, not merely "under the line" (this
    // project's own discipline, see .claude/rules/rendering-and-ui.md).
    const worstCase = 2 + MAX_VARIANTS_PER_MESSAGE * 4;
    assert.ok(worstCase <= 40, `worst-case component count ${worstCase} must not exceed Discord's 40-component ceiling`);
    assert.ok(40 - worstCase >= 2, `headroom of ${40 - worstCase} is too thin -- must survive one more component being added later without recomputation`);
});

run();
if (failures > 0) {
    console.error(`❌ catalogGrouping: ${failures} case(s) failed`);
    process.exit(1);
}
console.log(`✅ catalogGrouping: ${checks.length} cases passed`);
