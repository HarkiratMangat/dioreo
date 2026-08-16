// scripts/bulkCacheCollectibles.test.js -- coverage for the previously-untested pure/near-pure
// pieces of the bulk-cache pipeline: sample selection, the Cloudinary context field mapping, the
// per-variant metadata text, and the grouped-message component tree. All were live-verified against
// the real dev bot this session (including a real 7-variant group), but had no automated regression
// coverage -- this pins that behavior so a future edit can't silently break it.
// Run: `node scripts/bulkCacheCollectibles.test.js` (also via `npm test`).
const assert = require('assert');
const {
    pickDiverseSample, assetFolderFor, catalogExtra, buildGroupComponents, variantMetadataLines,
    groupHeaderLines, variantHeadingLines
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
// These pin the 2026-08-15 22:32 EDT layout Harkirat specified. The fields that LEFT this function
// (Description/Parent Category/Group/Variant/Base SKU) are asserted absent on purpose -- they moved
// up into the headings, and a future edit that "restores" them here would silently duplicate them.

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

check('variantMetadataLines: SKU is its OWN line, never appended to the Cloudinary line', () => {
    const lines = variantMetadataLines(doc({ skuId: 'SKU1' }), render({}));
    const cloudinary = lines.find(l => l.includes('**Cloudinary:**'));
    assert.ok(!cloudinary.includes('SKU'), `Cloudinary line must not carry the sku: ${cloudinary}`);
    assert.ok(lines.some(l => l.trim().startsWith('-# **SKU:**') && l.includes('SKU1')), JSON.stringify(lines));
});

check('variantMetadataLines: the description/collection/group/variant/base-sku fields moved to the headings and must NOT reappear here', () => {
    const lines = variantMetadataLines(doc({ label: 'A pile of grey skulls', baseSkuId: 'BASE_SKU' }), render({}));
    for (const gone of ['**Description:**', '**Parent Category:**', '**Group:**', '**Variant:**', 'Base SKU']) {
        assert.ok(!lines.some(l => l.includes(gone)), `"${gone}" belongs in the headings now, not the footnotes: ${JSON.stringify(lines)}`);
    }
    assert.ok(!lines.some(l => l.includes('A pile of grey skulls')), 'the description is a blockquote in the heading block, not a footnote');
});

check('variantMetadataLines: dimensions/frame-count/size ride the Rendered line, not a heading', () => {
    const lines = variantMetadataLines(doc({}), render({ width: 288, height: 288, frameCount: 60 }));
    const rendered = lines[lines.length - 1];
    assert.ok(rendered.includes('Rendered'), rendered);
    assert.ok(rendered.includes('288×288px') && rendered.includes('60f'), rendered);
    assert.ok(!lines.some(l => l.startsWith('###')), 'variantMetadataLines emits footnotes only -- the heading is built separately');
});

// --- groupHeaderLines / variantHeadingLines --------------------------------------------------

check('groupHeaderLines: names the design and underlines the collection; single-variant gets no count line', () => {
    const lines = groupHeaderLines(group({}), [{ doc: doc({}), render: render({}) }]);
    assert.deepStrictEqual(lines, ['## Eternal Damnation — __Underworld__']);
});

check('groupHeaderLines: a multi-variant design states the count and the base SKU once, in the header', () => {
    const renders = [1, 2].map(i => ({ doc: doc({ skuId: `SKU${i}`, baseSkuId: 'BASE' }), render: render({}) }));
    const lines = groupHeaderLines(group({}), renders);
    assert.strictEqual(lines.length, 2);
    assert.ok(lines[1].includes('**2 Variants**') && lines[1].includes('BASE'), lines[1]);
});

check('variantHeadingLines: a multi-variant heading carries the variant label + UPPERCASED hex', () => {
    const lines = variantHeadingLines(doc({ variantLabel: 'Blue', variantValue: '#79e4e3' }), true);
    assert.ok(lines[0].startsWith('### Eternal Damnation (Blue)'), lines[0]);
    assert.ok(lines[0].includes('`Blue`') && lines[0].includes('`#79E4E3`'), lines[0]);
});

check('variantHeadingLines: a single-variant design gets NO ### heading -- the ## header already named it', () => {
    const lines = variantHeadingLines(doc({ label: 'A description' }), false);
    assert.deepStrictEqual(lines, ['> A description']);
});

check('variantHeadingLines: no label means no blockquote, not an empty one', () => {
    assert.deepStrictEqual(variantHeadingLines(doc({ label: undefined }), false), []);
});

// --- buildGroupComponents --------------------------------------------------------------------

check('buildGroupComponents: decorations -- N variants produce exactly N sections and N dividers', () => {
    const renders = [1, 2, 3].map(i => ({ doc: doc({ kind: 'decoration', skuId: `SKU${i}` }), render: render({ filename: `f${i}.webp` }) }));
    const [container] = buildGroupComponents(group({ kind: 'decoration', variants: renders.map(r => r.doc) }), renders);
    const sections = container.components.filter(c => c.type === 9);
    const dividers = container.components.filter(c => c.type === 14);
    assert.strictEqual(sections.length, 3);
    assert.strictEqual(dividers.length, 3, 'a divider precedes EVERY variant, including the first -- it also separates the header from the variant list');
});

check('buildGroupComponents: nameplates -- N variants produce exactly N Media Galleries + N heading/N metadata TextDisplays, NEVER a Section', () => {
    const renders = [1, 2, 3].map(i => ({ doc: doc({ skuId: `SKU${i}` }), render: render({ filename: `f${i}.webp` }) }));
    const [container] = buildGroupComponents(group({ variants: renders.map(r => r.doc) }), renders);
    const sections = container.components.filter(c => c.type === 9);
    const galleries = container.components.filter(c => c.type === 12);
    const texts = container.components.filter(c => c.type === 10);
    const dividers = container.components.filter(c => c.type === 14);
    assert.strictEqual(sections.length, 0, 'nameplates must use the full-width Media Gallery layout, never Section+Thumbnail (that is decoration-only)');
    assert.strictEqual(galleries.length, 3);
    assert.strictEqual(texts.length, 7, '1 header + 3 heading/description blocks + 3 metadata blocks');
    assert.strictEqual(dividers.length, 3);
});

check('buildGroupComponents: a multi-variant message stays inside the 4-components-per-variant budget catalogGrouping.js assumes', () => {
    const { MAX_VARIANTS_PER_MESSAGE } = require('./catalogGrouping');
    const countAll = nodes => nodes.reduce((n, c) => n + 1 + countAll(c.components || []) + (c.accessory ? 1 : 0), 0);
    for (const kind of ['nameplate', 'decoration']) {
        const renders = Array.from({ length: MAX_VARIANTS_PER_MESSAGE }, (_, i) => ({
            doc: doc({ kind, skuId: `SKU${i}` }), render: render({ filename: `f${i}.webp` })
        }));
        const total = countAll(buildGroupComponents(group({ kind, variants: renders.map(r => r.doc) }), renders));
        assert.ok(total <= 40, `${kind}: a full ${MAX_VARIANTS_PER_MESSAGE}-variant message is ${total} components, over Discord's hard 40 ceiling`);
    }
});

check('buildGroupComponents: a single-variant group gets zero dividers, no "Variants" count, and folds its description into the header', () => {
    const renders = [{ doc: doc({ label: 'A snarling hellhound' }), render: render({}) }];
    const [container] = buildGroupComponents(group({ variants: renders.map(r => r.doc) }), renders);
    assert.strictEqual(container.components.filter(c => c.type === 14).length, 0);
    const header = container.components.find(c => c.type === 10).content;
    assert.ok(!header.includes('Variants'), `single-variant header should not say "Variants": ${header}`);
    assert.ok(!header.includes('###'), `single-variant needs no per-variant heading: ${header}`);
    assert.ok(header.includes('> A snarling hellhound'), `description should fold into the header block: ${header}`);
});

check('buildGroupComponents: a variant\'s description appears EXACTLY once in the tree, on both kinds and both shapes', () => {
    const collect = nodes => nodes.flatMap(c => [c.content || '', ...collect(c.components || [])]);
    for (const kind of ['nameplate', 'decoration']) {
        for (const n of [1, 3]) {
            const renders = Array.from({ length: n }, (_, i) => ({
                doc: doc({ kind, skuId: `SKU${i}`, label: 'A snarling hellhound' }), render: render({ filename: `f${i}.webp` })
            }));
            const text = collect(buildGroupComponents(group({ kind, variants: renders.map(r => r.doc) }), renders)).join('\n');
            const hits = text.split('> A snarling hellhound').length - 1;
            assert.strictEqual(hits, n, `${kind} x${n}: description printed ${hits} time(s), expected ${n}`);
        }
    }
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
