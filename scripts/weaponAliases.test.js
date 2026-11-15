// The weapon shorthands (utils/search.js WEAPON_ALIASES) never step on each other, a weapon or a class (Harkirat, 2026-11-15 11:09 EST: "make sure you add some sort of internal check to verify that aliases never interact with each other ... that the alias is available, etc."). Runs weaponAliasProblems() on the tracked catalogue seed, then proves each check can fail.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { WEAPON_ALIASES, weaponAliasProblems } = require('../utils/search');

const CLASS = { 'Assault Rifles': 'AR', 'Sniper Rifles': 'SNIPER', 'Light Machine Guns': 'LMG', 'Submachine Guns': 'SMG', Shotguns: 'SHOTGUN', 'Marksman Rifles': 'MARKSMAN', Pistols: 'SECONDARIES', Launchers: 'SECONDARIES', Melee: 'SECONDARIES' };
const seed = require('../docs/pins2/data/2026-09-25-codm-weapons-attachments.json').weapons;
// Weapons released after the seed was transcribed that a shorthand points at. The live catalogue has them; scripts/checkWeaponAliases.js checks against it.
const SINCE_SEED = [{ name: 'Signal 50', category: 'Sniper Rifles' }];
const weapons = [...seed, ...SINCE_SEED].map(w => ({ weaponName: w.name, weaponKey: w.name.toLowerCase().replace(/\s+/g, ''), category: CLASS[w.category] || w.category }));

// 1. Every shorthand is safe on the real weapon list.
assert.deepStrictEqual(weaponAliasProblems(weapons), [], 'every shorthand opens its weapon and nothing else');
console.log(`  ✓ ${Object.keys(WEAPON_ALIASES).length} shorthands, ${weapons.length} weapons, no problems`);

// 2. No shorthand is written twice: a repeated key in an object literal silently keeps the last value, so the first one vanishes with no error.
const src = fs.readFileSync(path.join(__dirname, '../utils/search.js'), 'utf8');
const literal = src.match(/const WEAPON_ALIASES = \{([^}]*)\}/)[1];
const keys = [...literal.matchAll(/'?([A-Za-z0-9]+)'?\s*:/g)].map(m => m[1].toLowerCase());
assert.strictEqual(keys.length, Object.keys(WEAPON_ALIASES).length, 'the literal holds no repeated key');
console.log('  ✓ no shorthand written twice');

// 3. Each check can fail.
const bad = weaponAliasProblems(weapons, { 'S-50': 'signal50', svd: 'signal50', smg: 'signal50', zz9: 'nogun', xpr: 'xpr50' });
const has = (key, text) => assert.ok(bad.some(p => p.startsWith(`${key}:`) && p.includes(text)), `${key} flagged for "${text}": ${JSON.stringify(bad)}`);
has('S-50', 'not lower-case');
has('svd', 'already the name of SVD');
has('smg', 'is a class word');
has('zz9', 'matches 0 weapons');
assert.deepStrictEqual(bad.filter(p => p.startsWith('xpr:')), [], 'a shorthand that is only a start of its own weapon is fine');
const twins = weaponAliasProblems([...weapons, { weaponName: 'Signal-50', weaponKey: 'signal-50', category: 'SNIPER' }], { s50: 'signal50' });
assert.ok(twins.some(p => p.includes('matches 2 weapons')), 'a target two weapons share is flagged');
// A shorthand never pulls in a class it only begins (`mac` begins "machine gun"; it listed all 14 LMGs before 2026-11-15).
assert.deepStrictEqual(require('../utils/search').findWeaponMatches('mac', weapons).filter(w => w.category === 'LMG').map(w => w.weaponName), [], 'mac lists no LMG');
console.log('  ✓ each check fails on a bad shorthand');

console.log('\nweaponAliases: all checks passed.');
