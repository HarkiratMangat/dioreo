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
    assert.deepStrictEqual(four, ['A2', 'A3', 'S1', 'L2'], 'one per class first, then the best second; grouped by class, in the in-game order (AR, Sniper, LMG: his 2026-11-03 11:44 EST)');
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

// The start of a name typed as one run of characters, digits and look-alikes included (Harkirat, 2026-11-05 14:06 EST: `d gs hs0`, `d gs hso` and `d build hs0` got nothing on prod). Before, wordsOf split `hs0` into `hs` + `0`, so the one-word start rule never saw it, and no look-alike was folded on this path.
check('pickWeapon opens the one weapon a typed start names, look-alikes folded', () => {
    const { pickWeapon } = require('../utils/search');
    const w = (weaponName, category) => ({ weaponName, weaponKey: weaponName.toLowerCase().replace(/[^a-z0-9]/g, ''), category });
    const pool = [w('HS0405', 'SHOTGUN'), w('HS2126', 'SHOTGUN'), w('AK117', 'AR'), w('AK-47', 'AR'), w('KILO 141', 'AR'), w('KILO BOLT-ACTION', 'MARKSMAN'), w('M21 EBR', 'SNIPER'), w('J358', 'SECONDARIES'), w('GRAU 5.56', 'AR'), w('GRAV', 'AR'), w('CROSSBOW', 'SECONDARIES'), w('Cronen Squall', 'AR'), w('ISO', 'SMG'), w('ISO Hemlock', 'AR'), w('SHORTY', 'SECONDARIES'), w('STRIKER', 'SHOTGUN')];
    const hit = q => pickWeapon(q, pool).hit?.weaponName || null;
    for (const [q, want] of [['hs0', 'HS0405'], ['hso', 'HS0405'], ['HS0', 'HS0405'], ['hs04', 'HS0405'], ['hso4', 'HS0405'], ['hs2', 'HS2126'], ['hs2l', 'HS2126'], ['ak1', 'AK117'], ['ak-1', 'AK117'], ['m21e', 'M21 EBR'], ['j35', 'J358'], ['5hort', 'SHORTY'], ['5tr', 'STRIKER'], ['iso', 'ISO'], ['is0', 'ISO'], ['grav', 'GRAV'], ['grau', 'GRAU 5.56']]) assert.strictEqual(hit(q), want, q);
    // A start of two names, as typed or folded, is a weapon request with no one answer: Did you mean, never a guess. `gra` and `cro` used to open GRAV and CROSSBOW because the tie-break counted words instead of matching them.
    for (const [q, want] of [['k1lo', ['KILO 141', 'KILO BOLT-ACTION']], ['gra', ['GRAU 5.56', 'GRAV']], ['cro', ['CROSSBOW', 'Cronen Squall']], ['hs', ['HS0405', 'HS2126']]]) assert.deepStrictEqual(pickWeapon(q, pool).several.map(x => x.weaponName).sort(), want, q);
    // Spaces still mean words: `hs 0` is not `hs0`, and chat stays chat.
    for (const q of ['lol', 'the', 'real', 'hs 0', 'is broken']) assert.strictEqual(hit(q), null, q);
});

// Every weapon in the tracked catalogue seed, every way of typing it (Harkirat, 2026-11-15 11:23 EST, after `mac` listed 14 LMGs: "that's no small issue ... make sure there aren't other poor things"). The sweep that found mach, shorty, lach, bolt and asva pulling in whole classes, SHORTY and ISO not first, and pistol, rifle and gun opening one weapon.
check('typing a weapon never pulls in a class, and a class word never opens one weapon (the 2026-11-15 sweep)', () => {
    const { pickWeapon, fuzzyMatch, CATEGORY_SEARCH_SYNONYMS } = require('../utils/search');
    const CLASS = { 'Assault Rifles': 'AR', 'Sniper Rifles': 'SNIPER', 'Light Machine Guns': 'LMG', 'Submachine Guns': 'SMG', Shotguns: 'SHOTGUN', 'Marksman Rifles': 'MARKSMAN', Pistols: 'SECONDARIES', Launchers: 'SECONDARIES', Melee: 'SECONDARIES' };
    const pool = require('../docs/pins2/data/2026-09-25-codm-weapons-attachments.json').weapons
        .map(w => ({ weaponName: w.name, weaponKey: w.name.toLowerCase().replace(/\s+/g, ''), category: CLASS[w.category] || w.category }))
        .filter((w, i, all) => all.findIndex(o => o.weaponName.toLowerCase() === w.weaponName.toLowerCase()) === i);
    for (const extra of [{ weaponName: 'Lachmann-556', weaponKey: 'lachmann-556', category: 'LMG' }, { weaponName: 'Nail Gun', weaponKey: 'nailgun', category: 'SECONDARIES' }]) if (!pool.some(o => o.weaponName.toLowerCase() === extra.weaponName.toLowerCase())) pool.push(extra);
    const sq = x => x.toLowerCase().replace(/[^a-z0-9]/g, '');
    const problems = [];
    for (const w of pool) {
        if (pool.filter(o => sq(o.weaponName) === sq(w.weaponName)).length > 1) continue;
        // The full name: first in the dropdown, and it opens.
        if (findWeaponMatches(w.weaponName, pool)[0]?.weaponKey !== w.weaponKey) problems.push(`${w.weaponName}: not first in the dropdown`);
        if (pickWeapon(w.weaponName, pool).hit?.weaponKey !== w.weaponKey) problems.push(`${w.weaponName}: does not open`);
        // Each start of 3+ letters lists only weapons its letters reach, unless it is itself a class or generic word.
        const name = sq(w.weaponName);
        for (let i = 3; i <= name.length; i++) {
            const q = name.slice(0, i);
            if (CATEGORY_SEARCH_SYNONYMS[q] || isGenericWeaponQuery(q)) continue;
            const strays = findWeaponMatches(q, pool).filter(o => !fuzzyMatch(q, o.weaponName));
            if (strays.length) { problems.push(`${q}: also lists ${strays.slice(0, 2).map(o => o.weaponName).join(', ')}${strays.length > 2 ? ` and ${strays.length - 2} more` : ''}`); break; }
        }
    }
    assert.deepStrictEqual(problems, [], 'every weapon reachable by its own name, with nothing else pulled in');
    const names = q => findWeaponMatches(q, pool).map(o => o.weaponName);
    assert.deepStrictEqual(names('mach'), ['Machine Pistol'], 'mach: Machine Pistol, no LMGs');
    assert.deepStrictEqual(names('lach'), ['Lachmann-556'], 'lach: only Lachmann-556');
    assert.strictEqual(names('pistol')[0], 'Machine Pistol', 'pistol: the Secondaries, the one named for it first');
    assert.ok(names('pistol').length > 1 && names('pistol').every(n => pool.find(o => o.weaponName === n).category === 'SECONDARIES'), 'pistol: every Secondary');
    assert.ok(names('snipe').length > 1, 'snipe: still the sniper class, no name holds it');
    for (const q of ['pistol', 'rifle', 'gun', 'smg', 'mg']) assert.strictEqual(pickWeapon(q, pool).hit, null, `${q} opens no single weapon`);
    assert.strictEqual(pickWeapon('nail gun', pool).hit?.weaponName, 'Nail Gun', 'the whole name still opens');
    assert.strictEqual(require('../utils/search').weaponQueryClasses('mach', pool).length, 0, 'no class for letters that name a weapon');
});

check('a player shorthand names its weapon: shv, sx9, t63 (Harkirat, 2026-11-06 11:41 EST)', () => {
    const { pickWeapon } = require('../utils/search');
    const w = (weaponName, category) => ({ weaponName, weaponKey: weaponName.toLowerCase(), category });
    const pool = [w('3-Line Rifle', 'SNIPER'), w('Kilo Bolt-Action', 'MARKSMAN'), w('Kilo 141', 'AR'), w('MX Guardian', 'SHOTGUN'), w('Crossbow', 'SECONDARIES'), w('MAC-10', 'SMG'), w('Machine Pistol', 'SECONDARIES'), w('Static-HV', 'SMG'), w('Switchblade X9', 'SMG'), w('Type 63', 'MARKSMAN'), w('Type 25', 'AR'), w('Type 19', 'AR'), w('.50 GS', 'SECONDARIES'), w('Man-O-War', 'AR'), w('Striker', 'SHOTGUN'), w('Signal 50', 'SNIPER'), w('XPR-50', 'SNIPER')];
    for (const [q, want] of [['3lr', '3-Line Rifle'], ['kba', 'Kilo Bolt-Action'], ['k141', 'Kilo 141'], ['mkg', 'MX Guardian'], ['mxg', 'MX Guardian'], ['xbow', 'Crossbow'], ['mac', 'MAC-10'], ['shv', 'Static-HV'], ['SHV', 'Static-HV'], ['sx9', 'Switchblade X9'], ['t63', 'Type 63'], ['t25', 'Type 25'], ['t19', 'Type 19'], ['deagle', '.50 GS'], ['mow', 'Man-O-War'], ['s50', 'Signal 50'], ['S50', 'Signal 50']]) {
        assert.strictEqual(pickWeapon(q, pool).hit?.weaponName, want, `pick ${q}`);
        assert.strictEqual(findWeaponMatches(q, pool)[0]?.weaponName, want, `list ${q}`);
    }
    assert.deepStrictEqual(findWeaponMatches('shv', [w('Striker', 'SHOTGUN')]), [], 'an alias whose weapon is missing matches nothing');
});

if (failures) { console.error(`\n${failures} check(s) failed.`); process.exit(1); }
console.log('\nweaponSearch: all checks passed.');
process.exit(0);
