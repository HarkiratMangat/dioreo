// scripts/collectibleCacheKey.test.js -- coverage for the nameplate/decoration Cloudinary cache-key construction. This is THE highest-consequence pure function in the collectible pipeline: the public id IS the cache key, so a change here orphans every stored render and can silently desync the bulk path from the live path. Pinned here rather than trusted to review. Run: `node scripts/collectibleCacheKey.test.js` (also via `npm test`).
const assert = require('assert');
const { catalogCacheKey, legacyCacheKey, filenameForPublicId } = require('../utils/collectibleCacheKey');

let failures = 0;
const checks = [];
function check(name, fn) { checks.push([name, fn]); }

check('catalogCacheKey: group name + variant label, exactly the scheme Harkirat specified', () => {
    assert.strictEqual(catalogCacheKey('dev_nameplate_webp', 'Eternal Damnation', 'Blue'), 'dev_nameplate_webp/eternal-damnation-blue');
    assert.strictEqual(catalogCacheKey('dev_nameplate_webp', 'Eternal Damnation', 'Red'), 'dev_nameplate_webp/eternal-damnation-red');
});

check('catalogCacheKey: a single-variant design gets the bare group name -- no trailing hyphen', () => {
    const id = catalogCacheKey('dev_nameplate_webp', 'All Bark, All Bite', null);
    assert.strictEqual(id, 'dev_nameplate_webp/all-bark-all-bite');
    assert.ok(!id.endsWith('-'), 'a missing variant label must be omitted, not slugified to an empty segment');
});

check('catalogCacheKey: two variants of one design NEVER collide -- the whole point of including the label', () => {
    const blue = catalogCacheKey('dev_nameplate_webp', 'Eternal Damnation', 'Blue');
    const red = catalogCacheKey('dev_nameplate_webp', 'Eternal Damnation', 'Red');
    assert.notStrictEqual(blue, red);
});

check('catalogCacheKey: the id never carries the asset path or the palette name (the retired scheme)', () => {
    const id = catalogCacheKey('dev_nameplate_webp', 'Eternal Damnation', 'Blue');
    assert.ok(!id.includes('nameplates/'), id);
    assert.ok(!id.includes('1533919'), `the sku belongs in its own field, not the cache key: ${id}`);
    assert.ok(!id.includes('black'), `the palette is redundant with the sku and was removed: ${id}`);
});

check('legacyCacheKey: prefixed so the catalog and legacy id spaces can never be confused', () => {
    assert.strictEqual(legacyCacheKey('dev_nameplate_webp', 'Eternal Damnation Blue', null), 'dev_nameplate_webp/legacy-eternal-damnation-blue');
});

check('legacyCacheKey: falls back to the ASSET when no name exists -- the only case decorations ever hit', () => {
    const id = legacyCacheKey('dev_decoration_webp', null, 'a_68fda5e61b1957d69913b52bda6fab31');
    assert.strictEqual(id, 'dev_decoration_webp/legacy-a-68fda5e61b1957d69913b52bda6fab31');
});

check('legacyCacheKey: the asset fallback stays unique per variant (it carries the sku/hash)', () => {
    const a = legacyCacheKey('dev_nameplate_webp', null, 'nameplates/eternal_damnation/1533919389806493928/');
    const b = legacyCacheKey('dev_nameplate_webp', null, 'nameplates/eternal_damnation/1533919549156622436/');
    assert.notStrictEqual(a, b, 'two variants of one design must not share a legacy id');
});

check('legacyCacheKey: a legacy id can never equal a catalog id for the same design', () => {
    assert.notStrictEqual(
        legacyCacheKey('dev_nameplate_webp', 'Eternal Damnation Blue', null),
        catalogCacheKey('dev_nameplate_webp', 'Eternal Damnation', 'Blue')
    );
});

check('filenameForPublicId: derived FROM the id, so the attachment and the cache entry never disagree', () => {
    assert.strictEqual(filenameForPublicId('dev_nameplate_webp/eternal-damnation-blue'), 'eternal-damnation-blue.webp');
    assert.strictEqual(filenameForPublicId('dev_decoration_webp/legacy-a-68fda5e6'), 'legacy-a-68fda5e6.webp');
});

check('the real catalog snapshot produces 925 DISTINCT ids -- checked globally, since the folder is flat', () => {
    const catalog = require('../docs/reference/nameplate-decoration-catalog.json');
    let total = 0;
    for (const [kind, folder] of [['nameplates', 'nameplate_webp'], ['decorations', 'decoration_webp']]) {
        const seen = new Set();
        for (const groups of Object.values(catalog)) {
            for (const group of (groups[kind] || [])) {
                for (const variant of group.variants) {
                    total++;
                    const id = catalogCacheKey(folder, group.group_name, variant.variant_label || null);
                    assert.ok(!seen.has(id), `collision on "${id}" -- two SKUs would overwrite each other in Cloudinary`);
                    seen.add(id);
                }
            }
        }
    }
    assert.strictEqual(total, 925, `expected the 925-SKU snapshot, got ${total} -- if the catalog was refreshed, re-verify uniqueness rather than editing this number`);
});

for (const [name, fn] of checks) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
}
if (failures > 0) {
    console.error(`❌ collectibleCacheKey: ${failures} case(s) failed`);
    process.exit(1);
}
console.log(`✅ collectibleCacheKey: ${checks.length} cases passed`);
