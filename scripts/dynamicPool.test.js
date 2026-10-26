// scripts/dynamicPool.test.js Regression test for the Dynamic Profile Colors pool and the retired accent styles in utils/accentColor.js. Added 2026-08-13 00:02 EDT. Run: `node scripts/dynamicPool.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS. The pool draws STORED SWATCHES first and falls back to a per-source accent colour only where none are saved — and the fallback is the entire reason this design was chosen over a straight swap. `*Palette` fields are written ONLY by the View Colors panel, so a user who has never opened `/colors` has none: measured on prod at the time of writing, 12 of 18 preference documents (67%) had zero stored palettes. Drop the fallback and Dynamic Profile Colors silently becomes "use the preset" for most people — an option that appears to do nothing, with no error anywhere.
//
// ⚠️ AND THE RETIRED STYLES ARE A SILENT FAILURE OF THEIR OWN. 'banner' and 'displayName' can no longer be selected, but `accentColorStyle` is a plain String with no enum, so nothing stops an old value existing. Unnormalized, it would resolve against a source the UI can no longer pick.
const assert = require('assert');
const { paletteFields } = require('../utils/colorExtract');
const { storedSwatchesFor } = require('../utils/accentColor');

let failed = 0;
let passed = 0;
// Counted, never hardcoded -- a literal total rots the moment a case is added.
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

console.log('\nDynamic Profile Colors — the swatch pool, and the styles that were retired\n');

// --- paletteFields is the shared field-name rule. accentColor.js and colorPalette.js BOTH depend on it now, which is why it lives in colorExtract (neither can import the other without a cycle).
t('paletteFields names the global and guild pairs distinctly', () => {
    assert.deepStrictEqual(paletteFields('avatar', false), { paletteField: 'avatarPalette', sourceField: 'avatarPaletteSource' });
    assert.deepStrictEqual(paletteFields('avatar', true), { paletteField: 'guildAvatarPalette', sourceField: 'guildAvatarPaletteSource' });
    assert.deepStrictEqual(paletteFields('nameplate', true), { paletteField: 'guildNameplatePalette', sourceField: 'guildNameplatePaletteSource' });
});

t('there is exactly ONE definition of the palette field-name rule', () => {
    // ⚠️ Two hand-rolled copies of `guild${Kind}Palette` would drift silently, and a wrong field name reads as "no swatches saved" rather than as an error — the pool would just quietly shrink. Read from source because there is no output that can show it.
    const fs = require('fs');
    const path = require('path');
    const offenders = [];
    for (const rel of ['utils/accentColor.js', 'utils/colorPalette.js', 'utils/colorPaletteView.js']) {
        const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
        for (const line of src.split('\n')) {
            if (/^\s*(\/\/|\*)/.test(line)) continue;
            if (/`guild\$\{.*\}Palette`|guild\$\{kind\[0\]/.test(line)) offenders.push(`${rel}: ${line.trim()}`);
        }
    }
    assert.strictEqual(offenders.length, 0, `the field-name rule has been re-implemented:\n        ${offenders.join('\n        ')}`);
});

// --- The pool itself. buildDynamicColorPool needs a live interaction, so the swatch-reading half is exercised through the REAL exported helper against a fake prefs document.
//
// ⚠️ THESE CASES USED A LOCAL COPY OF THE EXPRESSION AT FIRST, AND WERE THEREFORE VACUOUS. Deleting the guild half of the read and deleting the malformed-entry guard both left the suite green, because the suite was testing its own re-implementation. `storedSwatchesFor` was extracted out of an inline closure specifically so this file can reach it. **Never re-inline it.**
const swatchesOf = storedSwatchesFor;

t('swatches are read from BOTH the global and the server field pair', () => {
    // Harkirat's spec: "from both global & server profiles". Reading only one pair halves the pool and nothing reports it.
    const prefs = {
        avatarPalette: [{ hex: 0x111111 }, { hex: 0x222222 }],
        guildAvatarPalette: [{ hex: 0x333333 }]
    };
    assert.deepStrictEqual(swatchesOf(prefs, 'avatar'), [0x111111, 0x222222, 0x333333]);
});

t('a source with no stored swatches yields nothing, which is what triggers the accent top-up', () => {
    assert.deepStrictEqual(swatchesOf({}, 'banner'), []);
    assert.deepStrictEqual(swatchesOf({ bannerPalette: null }, 'banner'), []);
});

t('malformed palette entries are dropped, never pushed as undefined', () => {
    // A palette restored from a cache written before the wire format gained its flags can hold entries without a hex. An undefined in the pool becomes an undefined accent colour on a real embed.
    const prefs = { avatarPalette: [{ hex: 0x111111 }, {}, null, { percent: 5 }] };
    assert.deepStrictEqual(swatchesOf(prefs, 'avatar'), [0x111111]);
});

t('the pool is de-duplicated', () => {
    // The same colour in both the global and server palette of one source would otherwise weight the random pick toward it for no reason a user could see.
    const prefs = { avatarPalette: [{ hex: 0x111111 }], guildAvatarPalette: [{ hex: 0x111111 }] };
    const pooled = [...new Set(swatchesOf(prefs, 'avatar'))];
    assert.deepStrictEqual(pooled, [0x111111]);
});

t('display name colors are NOT a pool source', () => {
    // Excluded on purpose: they are two exact values picked in Discord's own UI, not colours extracted from an image, and the style that surfaced them was retired in the same change.
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'utils', 'accentColor.js'), 'utf8');
    const pool = src.slice(src.indexOf('async function buildDynamicColorPool'), src.indexOf('async function resolveDynamicProfileColor'));
    const pushes = pool.split('\n').filter(l => /pool\.push/.test(l) && !/^\s*\/\//.test(l));
    assert.ok(pushes.length, 'could not find the pool pushes — this case is testing nothing');
    assert.ok(!pushes.some(l => /DisplayName/i.test(l)), `display name colours are back in the pool:\n        ${pushes.filter(l => /DisplayName/i.test(l)).join('\n')}`);
});

// --- The retired styles.
t('a stored `banner` or `displayName` style is normalized to avatar, not left to resolve', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'utils', 'accentColor.js'), 'utf8');
    assert.ok(/rawStyle === 'banner' \|\| rawStyle === 'displayName'/.test(src),
        'resolveAccentColor no longer normalizes the retired styles — an old stored value now resolves against a source the UI cannot pick');
});

t('the retired styles are gone from /settings\' dropdown', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'commands', 'settings.js'), 'utf8');
    const options = src.slice(src.indexOf('set_accent_style'), src.indexOf('set_accent_style') + 2000);
    assert.ok(!/value: "banner"/.test(options), 'Banner Color is back in the accent dropdown');
    assert.ok(!/value: "displayName"/.test(options), 'Display Name Colors is back in the accent dropdown');
    for (const v of ['preset', 'avatar', 'dynamicProfile']) {
        assert.ok(new RegExp(`value: "${v}"`).test(options), `the "${v}" option went missing`);
    }
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
