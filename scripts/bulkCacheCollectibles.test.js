// scripts/bulkCacheCollectibles.test.js -- coverage for the previously-untested pure/near-pure
// pieces of the bulk-cache pipeline: sample selection, the Cloudinary context field mapping, the
// per-variant metadata text, and the grouped-message component tree. All were live-verified against
// the real dev bot this session (including a real 7-variant group), but had no automated regression
// coverage -- this pins that behavior so a future edit can't silently break it.
// Run: `node scripts/bulkCacheCollectibles.test.js` (also via `npm test`).
const assert = require('assert');
const {
    pickDiverseSample, assetFolderFor, catalogExtra, buildGroupComponents, variantMetadataLines
} = require('./bulkCacheCollectibles');

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
    return {
        skuId: 'SKU1', kind: 'nameplate', parentCategory: 'Underworld', groupName: 'Eternal Damnation',
        baseSkuId: 'SKU1', asset: 'nameplates/eternal_damnation/SKU1/', label: 'A description',
        displayName: 'Eternal Damnation (Blue)', palette: 'black', paletteHex: '#000000',
        variantLabel: 'Blue', variantValue: '#79e4e3',
        ...overrides
    };
}

function render(overrides) {
    return {
        webpBuffer: Buffer.from('x'.repeat(2048)), // 2KB, so the size line has a real non-zero value
        palette: [{ hex: 0xff0000 }, { hex: 0x00ff00 }, { hex: 0x0000ff }],
        width: 512, height: 96, frameCount: 43, renderMs: 250,
        publicId: 'dev_nameplate_webp/eternal-damnation-black', filename: 'eternal-damnation-black.webp',
        ...overrides
    };
}

function group(overrides) {
    return { kind: 'nameplate', parentCategory: 'Underworld', groupName: 'Eternal Damnation', variants: [], ...overrides };
}

// --- pickDiverseSample ---------------------------------------------------------------------

check('pickDiverseSample: picks one from each of the 4 diversity buckets before filling remainder', () => {
    const groups = [
        group({ kind: 'nameplate', groupName: 'MultiNP', variants: [1, 2] }),
        group({ kind: 'nameplate', groupName: 'SingleNP', variants: [1] }),
        group({ kind: 'decoration', groupName: 'MultiDeco', variants: [1, 2] }),
        group({ kind: 'decoration', groupName: 'SingleDeco', variants: [1] }),
        group({ kind: 'nameplate', groupName: 'Extra1', variants: [1] })
    ];
    const picked = pickDiverseSample(groups, 4);
    assert.strictEqual(picked.length, 4);
    const names = picked.map(g => g.groupName);
    assert.ok(names.includes('MultiNP') && names.includes('SingleNP') && names.includes('MultiDeco') && names.includes('SingleDeco'),
        `expected all 4 diversity buckets represented, got ${JSON.stringify(names)}`);
});

check('pickDiverseSample: never returns more than N, even with far more groups available', () => {
    const groups = Array.from({ length: 20 }, (_, i) => group({ groupName: `G${i}`, variants: [1] }));
    assert.strictEqual(pickDiverseSample(groups, 3).length, 3);
});

check('pickDiverseSample: fills remaining slots from input order without duplicating an already-picked group', () => {
    const groups = [
        group({ kind: 'nameplate', groupName: 'MultiNP', variants: [1, 2] }),
        group({ kind: 'nameplate', groupName: 'Extra1', variants: [1] }),
        group({ kind: 'nameplate', groupName: 'Extra2', variants: [1] })
    ];
    const picked = pickDiverseSample(groups, 3);
    const names = picked.map(g => g.groupName);
    assert.strictEqual(new Set(names).size, 3, 'no group should be picked twice');
});

check('pickDiverseSample: fewer groups than N returns everything, no crash', () => {
    const groups = [group({ groupName: 'Only', variants: [1] })];
    const picked = pickDiverseSample(groups, 10);
    assert.strictEqual(picked.length, 1);
});

// --- assetFolderFor -------------------------------------------------------------------------

check('assetFolderFor: builds a per-collection subfolder under the kind-appropriate root', () => {
    const nameplateFolder = assetFolderFor('nameplate', 'Underworld');
    const decorationFolder = assetFolderFor('decoration', 'Underworld');
    assert.ok(nameplateFolder.includes('nameplate_webp'), nameplateFolder);
    assert.ok(decorationFolder.includes('decoration_webp'), decorationFolder);
    assert.ok(nameplateFolder.endsWith('/underworld') || nameplateFolder.toLowerCase().endsWith('/underworld'), nameplateFolder);
});

// --- catalogExtra ----------------------------------------------------------------------------

check('catalogExtra: maps every expanded-metadata field, snake_case, render_source always catalog', () => {
    const extra = catalogExtra(doc({}));
    assert.strictEqual(extra.render_source, 'catalog');
    assert.strictEqual(extra.sku_id, 'SKU1');
    assert.strictEqual(extra.base_sku_id, 'SKU1');
    assert.strictEqual(extra.collection, 'Underworld');
    assert.strictEqual(extra.group_name, 'Eternal Damnation');
    assert.strictEqual(extra.variant_label, 'Blue');
    assert.strictEqual(extra.variant_value, '#79e4e3');
    assert.strictEqual(extra.label, 'A description');
    assert.strictEqual(extra.display_name, 'Eternal Damnation (Blue)');
});

check('catalogExtra: a single-variant doc with no variantLabel/variantValue leaves those undefined, not null/empty-string', () => {
    const extra = catalogExtra(doc({ variantLabel: undefined, variantValue: undefined }));
    assert.strictEqual(extra.variant_label, undefined);
    assert.strictEqual(extra.variant_value, undefined);
});

// --- variantMetadataLines --------------------------------------------------------------------

check('variantMetadataLines: nameplate shows Palette line with the palette name + swatches', () => {
    const lines = variantMetadataLines(doc({}), render({}));
    const paletteLine = lines.find(l => l.includes('**Palette:**'));
    assert.ok(paletteLine, `no Palette line found in ${JSON.stringify(lines)}`);
    assert.ok(paletteLine.includes('black'), paletteLine);
    assert.ok(paletteLine.includes('#FF0000'), paletteLine);
});

check('variantMetadataLines: decoration shows Colors line, never Palette', () => {
    const lines = variantMetadataLines(doc({ kind: 'decoration', palette: undefined, paletteHex: undefined }), render({}));
    assert.ok(!lines.some(l => l.includes('**Palette:**')), 'decoration must never show a Palette line');
    assert.ok(lines.some(l => l.includes('**Colors:**')), `no Colors line found in ${JSON.stringify(lines)}`);
});

check('variantMetadataLines: includes the description (label) when present, omits the line when absent', () => {
    const withLabel = variantMetadataLines(doc({ label: 'A pile of grey skulls' }), render({}));
    assert.ok(withLabel.some(l => l.includes('**Description:**') && l.includes('A pile of grey skulls')));
    const withoutLabel = variantMetadataLines(doc({ label: undefined }), render({}));
    assert.ok(!withoutLabel.some(l => l.includes('**Description:**')), 'no label must mean no Description line, not an empty one');
});

check('variantMetadataLines: Variant line only appears when variantLabel exists (single-variant designs have none)', () => {
    const withVariant = variantMetadataLines(doc({ variantLabel: 'Blue', variantValue: '#79e4e3' }), render({}));
    assert.ok(withVariant.some(l => l.includes('**Variant:**') && l.includes('Blue')));
    const noVariant = variantMetadataLines(doc({ variantLabel: undefined, variantValue: undefined }), render({}));
    assert.ok(!noVariant.some(l => l.includes('**Variant:**')));
});

check('variantMetadataLines: Base SKU is only shown when it differs from the SKU itself (avoids a redundant duplicate line)', () => {
    const differentBase = variantMetadataLines(doc({ skuId: 'VARIANT_SKU', baseSkuId: 'BASE_SKU' }), render({}));
    assert.ok(differentBase.some(l => l.includes('Base SKU')));
    const sameBase = variantMetadataLines(doc({ skuId: 'SKU1', baseSkuId: 'SKU1' }), render({}));
    assert.ok(!sameBase.some(l => l.includes('Base SKU')), 'a base sku identical to the sku itself should not print a redundant line');
});

check('variantMetadataLines: always carries dimensions/frame-count/size in the heading, and the render-time footer', () => {
    const lines = variantMetadataLines(doc({}), render({ width: 288, height: 288, frameCount: 60 }));
    assert.ok(lines[0].includes('288×288px') && lines[0].includes('60f'), lines[0]);
    assert.ok(lines[lines.length - 1].includes('Rendered'), lines[lines.length - 1]);
});

// --- buildGroupComponents --------------------------------------------------------------------

check('buildGroupComponents: decorations -- N variants produce exactly N sections and N-1 dividers', () => {
    const renders = [1, 2, 3].map(i => ({ doc: doc({ kind: 'decoration', skuId: `SKU${i}` }), render: render({ filename: `f${i}.webp` }) }));
    const [container] = buildGroupComponents(group({ kind: 'decoration', variants: renders.map(r => r.doc) }), renders);
    const sections = container.components.filter(c => c.type === 9);
    const dividers = container.components.filter(c => c.type === 14);
    assert.strictEqual(sections.length, 3);
    assert.strictEqual(dividers.length, 2, 'N variants need N-1 dividers between them, never N or N+1');
});

check('buildGroupComponents: nameplates -- N variants produce exactly N Media Galleries + N TextDisplays, NEVER a Section', () => {
    const renders = [1, 2, 3].map(i => ({ doc: doc({ skuId: `SKU${i}` }), render: render({ filename: `f${i}.webp` }) }));
    const [container] = buildGroupComponents(group({ variants: renders.map(r => r.doc) }), renders);
    const sections = container.components.filter(c => c.type === 9);
    const galleries = container.components.filter(c => c.type === 12);
    const texts = container.components.filter(c => c.type === 10);
    const dividers = container.components.filter(c => c.type === 14);
    assert.strictEqual(sections.length, 0, 'nameplates must use the full-width Media Gallery layout, never Section+Thumbnail (that is decoration-only)');
    assert.strictEqual(galleries.length, 3);
    assert.strictEqual(texts.length, 4, '1 header + 3 per-variant metadata blocks');
    assert.strictEqual(dividers.length, 2);
});

check('buildGroupComponents: a single-variant group gets zero dividers and no "N variants" suffix', () => {
    const renders = [{ doc: doc({}), render: render({}) }];
    const [container] = buildGroupComponents(group({ variants: renders.map(r => r.doc) }), renders);
    assert.strictEqual(container.components.filter(c => c.type === 14).length, 0);
    const header = container.components.find(c => c.type === 10).content;
    assert.ok(!header.includes('variant'), `single-variant header should not say "variants": ${header}`);
});

check('buildGroupComponents: decoration Section accessories reference that variant\'s OWN filename, in order', () => {
    const renders = ['a', 'b', 'c'].map(f => ({ doc: doc({ kind: 'decoration', skuId: f }), render: render({ filename: `${f}.webp` }) }));
    const [container] = buildGroupComponents(group({ kind: 'decoration', variants: renders.map(r => r.doc) }), renders);
    const urls = container.components.filter(c => c.type === 9).map(s => s.accessory.media.url);
    assert.deepStrictEqual(urls, ['attachment://a.webp', 'attachment://b.webp', 'attachment://c.webp']);
});

check('buildGroupComponents: nameplate Media Galleries reference that variant\'s OWN filename, in order', () => {
    const renders = ['a', 'b', 'c'].map(f => ({ doc: doc({ skuId: f }), render: render({ filename: `${f}.webp` }) }));
    const [container] = buildGroupComponents(group({ variants: renders.map(r => r.doc) }), renders);
    const urls = container.components.filter(c => c.type === 12).map(g => g.items[0].media.url);
    assert.deepStrictEqual(urls, ['attachment://a.webp', 'attachment://b.webp', 'attachment://c.webp']);
});

check('buildGroupComponents: nameplate accent uses the catalog paletteHex directly, not a re-derived palette color', () => {
    const renders = [{ doc: doc({ paletteHex: '#123456' }), render: render({ palette: [{ hex: 0xffffff }] }) }];
    const [container] = buildGroupComponents(group({ variants: renders.map(r => r.doc) }), renders);
    assert.strictEqual(container.accent_color, 0x123456);
});

check('buildGroupComponents: decoration accent falls back to the render\'s own first palette color (no paletteHex exists)', () => {
    const renders = [{ doc: doc({ kind: 'decoration', paletteHex: undefined }), render: render({ palette: [{ hex: 0xabcdef }] }) }];
    const [container] = buildGroupComponents(group({ kind: 'decoration', variants: renders.map(r => r.doc) }), renders);
    assert.strictEqual(container.accent_color, 0xabcdef);
});

run();
if (failures > 0) {
    console.error(`❌ bulkCacheCollectibles: ${failures} case(s) failed`);
    process.exit(1);
}
console.log(`✅ bulkCacheCollectibles: ${checks.length} cases passed`);
