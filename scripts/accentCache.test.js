// scripts/accentCache.test.js
// Pins utils/accentColor.js's `invalidateAccentCache`, added 2026-08-11 19:07 EDT so the Refresh
// Colors button also drops the ACCENT colour and not just the palette.
// Run: `node scripts/accentCache.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS. Every way this can be wrong is silent. Clear too little and the button keeps
// lying about what it does — the original defect. Clear too much and you evict a cache that costs a
// real image download and a k-means pass to rebuild, for a source the user never touched. And the
// guild/global split is the kind of thing that looks like a naming detail and is not: the two pairs
// exist precisely so moving between a server and a DM does not have each context evict the other's
// colour, so clearing the wrong pair is a silent regression of that design.
const assert = require('assert');
const { invalidateAccentCache } = require('../utils/accentColor');

let failed = 0, passed = 0;
function t(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  PASS  ${name}`);
    } catch (err) {
        failed++;
        console.log(`  FAIL  ${name}\n        ${err.message}`);
    }
}

const stub = () => ({
    avatarColorHex: 0x112233, avatarColorSource: 'hash-a',
    bannerColorHex: 0x445566, bannerColorSource: 'hash-b',
    nameplateColorHex: 0x778899, nameplateColorSource: 'hash-n',
    displayNameColorHex: 0xaabbcc, displayNameColorSource: 'hash-d',
    guildAvatarColorHex: 0xddeeff, guildAvatarColorSource: 'hash-ga'
});

console.log('\naccent cache invalidation — clear exactly what was refreshed, and nothing else\n');

t('clears the named source and reports it', () => {
    const prefs = stub();
    assert.deepStrictEqual(invalidateAccentCache(prefs, ['avatar']), ['avatar']);
    assert.strictEqual(prefs.avatarColorHex, undefined);
    assert.strictEqual(prefs.avatarColorSource, undefined);
});

t('leaves every other source untouched', () => {
    const prefs = stub();
    invalidateAccentCache(prefs, ['avatar']);
    assert.strictEqual(prefs.bannerColorHex, 0x445566, 'banner must survive');
    assert.strictEqual(prefs.nameplateColorHex, 0x778899, 'nameplate must survive');
    assert.strictEqual(prefs.guildAvatarColorHex, 0xddeeff, 'the GUILD pair must survive a global clear');
});

t("'name' maps to the displayName field pair, not a literal `nameColor*`", () => {
    // The panel's source key and the schema's field stem disagree for exactly this one source, which
    // is the sort of mismatch that silently clears nothing at all.
    const prefs = stub();
    assert.deepStrictEqual(invalidateAccentCache(prefs, ['name']), ['name']);
    assert.strictEqual(prefs.displayNameColorHex, undefined);
});

t('the server view clears the GUILD pair and leaves the global one alone', () => {
    const prefs = stub();
    assert.deepStrictEqual(invalidateAccentCache(prefs, ['avatar'], true), ['avatar']);
    assert.strictEqual(prefs.guildAvatarColorHex, undefined);
    assert.strictEqual(prefs.avatarColorHex, 0x112233, 'the global pair must survive a server clear');
});

t('an already-empty source is not reported as cleared', () => {
    // The caller only saves when something was cleared, so a false positive means a pointless write
    // on every refresh of a source that has no cached accent.
    const prefs = stub();
    assert.deepStrictEqual(invalidateAccentCache(prefs, ['decoration']), []);
});

t('an unknown source key is ignored rather than throwing', () => {
    const prefs = stub();
    assert.deepStrictEqual(invalidateAccentCache(prefs, ['not-a-source']), []);
    assert.strictEqual(prefs.avatarColorHex, 0x112233);
});

t('multiple sources clear together, which is the refreshStale case', () => {
    const prefs = stub();
    assert.deepStrictEqual(invalidateAccentCache(prefs, ['avatar', 'banner', 'decoration']), ['avatar', 'banner']);
    assert.strictEqual(prefs.avatarColorHex, undefined);
    assert.strictEqual(prefs.bannerColorHex, undefined);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
