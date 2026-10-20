// scripts/weaponSearch.test.js
//
// /gunsmiths' weapon suggestions: a class typed in plain words finds that class, and a half-typed class word finds it too (Harkirat, 2026-10-19 20:09 EDT: "i typed assault, which should have showed all AR ... and i typed 'snipe' but that only showed 'all snipers' and didn't list the other sniper builds").
const assert = require('assert');
const { resolveCategorySynonyms, findWeaponMatches, isGenericWeaponQuery } = require('../utils/search');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('a class word, whole or half typed, names its class', () => {
    for (const [q, cat] of [['assault', 'AR'], ['assault rifle', 'AR'], ['snipe', 'SNIPER'], ['sniper', 'SNIPER'], ['sub', 'SMG'], ['light machine', 'LMG'], ['mark', 'MARKSMAN'], ['shot', 'SHOTGUN'], ['pist', 'SECONDARIES'], ['ar', 'AR'], ['dmr', 'MARKSMAN'], ['mr', 'MARKSMAN'], ['sr', 'SNIPER'], ['sg', 'SHOTGUN'], ['shotty', 'SHOTGUN'], ['side arm', 'SECONDARIES'], ['sidearm', 'SECONDARIES'], ['launcher', 'SECONDARIES'], ['machine gun', 'LMG'], ['bolt', 'SNIPER']]) {
        assert.deepStrictEqual(resolveCategorySynonyms(q), [cat], q);
    }
});

check('a weapon name, two letters, or nothing never names a class', () => {
    for (const q of ['hol', 'ak117', 'sn', 'm', '', 'locus']) assert.deepStrictEqual(resolveCategorySynonyms(q), [], q);
});

check('rifle names every rifle class, whole or half typed', () => {
    for (const q of ['rifle', 'rifles', 'rif']) assert.deepStrictEqual(resolveCategorySynonyms(q), ['AR', 'MARKSMAN', 'SNIPER'], q);
});

check('a half-typed class lists every weapon in it, plus names that match the letters', () => {
    const pool = [
        { weaponKey: 'locus', weaponName: 'LOCUS', category: 'SNIPER' },
        { weaponKey: 'dlq33', weaponName: 'DL Q33', category: 'SNIPER' },
        { weaponKey: 'ak117', weaponName: 'AK117', category: 'AR' },
        { weaponKey: 'shorty', weaponName: 'SHORTY', category: 'SECONDARIES' },
        { weaponKey: 'striker', weaponName: 'STRIKER', category: 'SHOTGUN' },
    ];
    assert.deepStrictEqual(findWeaponMatches('snipe', pool).map(w => w.weaponKey), ['locus', 'dlq33']);
    assert.deepStrictEqual(findWeaponMatches('assault', pool).map(w => w.weaponKey), ['ak117']);
    assert.deepStrictEqual(findWeaponMatches('rifle', pool).map(w => w.weaponKey), ['locus', 'dlq33', 'ak117']);
    assert.deepStrictEqual(findWeaponMatches('shot', pool).map(w => w.weaponKey), ['striker'], 'the class, and SHORTY only if its own letters matched');
});

check('a typo one letter off still finds the class (Harkirat, 2026-10-19 20:34 EDT: "also consider typos/nearest relevant")', () => {
    for (const [q, cat] of [['shoty', 'SHOTGUN'], ['snipr', 'SNIPER'], ['asault', 'AR'], ['marksmen', 'MARKSMAN'], ['pistl', 'SECONDARIES'], ['shotgn', 'SHOTGUN'], ['lmgg', 'LMG']]) {
        assert.deepStrictEqual(resolveCategorySynonyms(q), [cat], q);
    }
    for (const q of ['xyzq', 'shy']) assert.deepStrictEqual(resolveCategorySynonyms(q), [], q);
});

check('a typo in a weapon name finds the weapon; gun or weapon shows every weapon', () => {
    const pool = [
        { weaponKey: 'locus', weaponName: 'LOCUS', category: 'SNIPER' },
        { weaponKey: 'ak117', weaponName: 'AK117', category: 'AR' },
        { weaponKey: 'striker', weaponName: 'STRIKER', category: 'SHOTGUN' },
    ];
    assert.deepStrictEqual(findWeaponMatches('lokus', pool).map(w => w.weaponKey), ['locus']);
    assert.deepStrictEqual(findWeaponMatches('stirker', pool).map(w => w.weaponKey), ['striker']);
    assert.deepStrictEqual(findWeaponMatches('gun', pool).map(w => w.weaponKey), ['locus', 'ak117', 'striker']);
    assert.ok(isGenericWeaponQuery('Weapons') && !isGenericWeaponQuery('shotgun'));
});

if (failures) { console.error(`\n${failures} check(s) failed.`); process.exit(1); }
console.log('\nweaponSearch: all checks passed.');
process.exit(0);
