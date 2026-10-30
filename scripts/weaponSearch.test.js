// scripts/weaponSearch.test.js
//
// /gunsmith' weapon suggestions: a class typed in plain words finds that class, and a half-typed class word finds it too (Harkirat, 2026-10-19 20:09 EDT: "i typed assault, which should have showed all AR ... and i typed 'snipe' but that only showed 'all snipers' and didn't list the other sniper builds").
const assert = require('assert');
const { resolveCategorySynonyms, findWeaponMatches, isGenericWeaponQuery, foldLookalikes } = require('../utils/search');

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

check('look-alike typos find the weapon: hso for HS0405, l for 1, s for 5 (his 2026-10-25 21:56 EDT ask)', () => {
    const guns = [{ weaponKey: 'hs0405', weaponName: 'HS0405', category: 'SHOTGUN' }, { weaponKey: 'ffar1', weaponName: 'FFAR 1', category: 'AR' }, { weaponKey: 'so14', weaponName: 'SO-14', category: 'MARKSMAN' }];
    assert.deepStrictEqual(findWeaponMatches('hso', guns).map(w => w.weaponKey), ['hs0405']);
    assert.deepStrictEqual(findWeaponMatches('ffarl', guns).map(w => w.weaponKey), ['ffar1']);
    assert.deepStrictEqual(findWeaponMatches('s014', guns).map(w => w.weaponKey), ['so14']);
    assert.strictEqual(foldLookalikes('HS0405'), 'hso4os');
    // A plain match still wins and the fold never widens it.
    assert.deepStrictEqual(findWeaponMatches('hs04', guns).map(w => w.weaponKey), ['hs0405']);
});

check('nothing typed: a few of every class, each class\'s Meta and best-ranked first (his 2026-10-25 23:25 EDT ask)', () => {
    const { featuredWeapons } = require('../utils/search');
    const w = (weaponName, category, extra = {}) => ({ weaponName, weaponKey: weaponName.toLowerCase(), category, ...extra });
    const pool = [w('A1', 'AR'), w('A2', 'AR', { isMeta: true }), w('A3', 'AR', { categoryRank: 'best' }), w('L1', 'LMG'), w('L2', 'LMG', { categoryRank: 'top3' }), w('S1', 'SNIPER', { isMeta: true }), w('S2', 'SNIPER')];
    const four = featuredWeapons(pool, 4).map(x => x.weaponName);
    assert.deepStrictEqual(four, ['A2', 'A3', 'L2', 'S1'], 'one per class first, then the best second; grouped by class');
    assert.strictEqual(featuredWeapons(pool, 99).length, pool.length);
    // A third pick goes to AR, then SMG, never LMG first (his 2026-10-25 23:27 EDT call).
    const seven = ['AR', 'LMG', 'MARKSMAN', 'SECONDARIES', 'SHOTGUN', 'SMG', 'SNIPER'].flatMap(c => [1, 2, 3].map(n => w(`${c}${n}`, c)));
    const counts = featuredWeapons(seven, 16).reduce((m, x) => ({ ...m, [x.category]: (m[x.category] || 0) + 1 }), {});
    assert.deepStrictEqual(counts, { AR: 3, LMG: 2, MARKSMAN: 2, SECONDARIES: 2, SHOTGUN: 2, SMG: 3, SNIPER: 2 });
});

// pickWeapon: the weapon someone MEANT, for a text command or a name sent without picking (2026-10-29 11:05 EDT). Words, never fragments: his "142", "kilo ar" open the KILO 141, bare "lol" opens nothing, and everyday chat after `d gs` opens nothing.
check('pickWeapon opens a weapon only when the typed words name it', () => {
    const { pickWeapon } = require('../utils/search');
    const w = (weaponName, category, extra = {}) => ({ weaponName, weaponKey: weaponName.toLowerCase().replace(/[^a-z0-9]/g, ''), category, ...extra });
    const pool = [w('AK117', 'AR'), w('AK-47', 'AR'), w('KILO 141', 'AR'), w('KILO BOLT-ACTION', 'SNIPER'), w('FENNEC', 'SMG'), w('HS0405', 'SHOTGUN'), w('DL Q33', 'SNIPER'), w('LOCUS', 'SNIPER'), w('MAN-O-WAR', 'AR'), w('CHOPPER', 'LMG'), w('Bruen MK9', 'LMG'), w('RAAL MG', 'LMG'), w('MACHINE PISTOL', 'SECONDARIES'), w('M4', 'AR'), w('XM4', 'AR'), w('TYPE 19', 'AR'), w('L-CAR 9', 'SECONDARIES'), w('MAC-10', 'SMG')];
    const hit = q => pickWeapon(q, pool).hit?.weaponName || null;
    for (const [q, want] of [['142', 'KILO 141'], ['kilo ar', 'KILO 141'], ['kilo 141', 'KILO 141'], ['kilo141', 'KILO 141'], ['ak117', 'AK117'], ['ak 117', 'AK117'], ['ak-117', 'AK117'], ['fenec', 'FENNEC'], ['hso405', 'HS0405'], ['dlq', 'DL Q33'], ['lokus', 'LOCUS'], ['man o war', 'MAN-O-WAR'], ['m4', 'M4'], ['xm4', 'XM4'], ['type 19', 'TYPE 19'], ['mac10', 'MAC-10'], ['kilo sniper', 'KILO BOLT-ACTION']]) assert.strictEqual(hit(q), want, q);
    for (const q of ['lol', 'no', 'op', 'pls', 'bruh', 'true', 'real', 'br', 'l', 'gg', 'ok', 'skins are cool', 'is broken', 'kilo lol']) assert.strictEqual(hit(q), null, q);
    assert.deepStrictEqual(pickWeapon('kilo', pool).several.map(x => x.weaponName), ['KILO 141', 'KILO BOLT-ACTION'], 'one word, two weapons: Did you mean');
    assert.deepStrictEqual(pickWeapon('ak', pool).several.map(x => x.weaponName), ['AK117', 'AK-47']);
    assert.deepStrictEqual(pickWeapon('lol', pool).loose.map(x => x.weaponName), ['KILO 141'], 'the dropdown search still finds it, to offer and never to run');
    assert.deepStrictEqual(pickWeapon('lol', pool).several, []);
});

if (failures) { console.error(`\n${failures} check(s) failed.`); process.exit(1); }
console.log('\nweaponSearch: all checks passed.');
process.exit(0);
