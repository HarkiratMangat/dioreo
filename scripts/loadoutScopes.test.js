const assert = require('assert');
const { parseScopeToken, formatScopeToken, flatIndexToPosition } = require('../utils/loadoutScopes');

// round-trip: a token must survive format(parse(t)) === t, or a click loses its scope
for (const t of ['MP.AR.std', 'MP.*.std', 'MP.*.meta', 'DMZ.*.meta', 'DMZ.*.std']) {
    assert.strictEqual(formatScopeToken(parseScopeToken(t)), t, `round-trip failed for ${t}`);
}

// flatIndexToPosition must map a flat position onto the right weapon AND the right index inside it
const builds = [
    { weaponKey: 'ak117', buildName: 'A' }, { weaponKey: 'ak117', buildName: 'B' },
    { weaponKey: 'cx-9',  buildName: 'C' },
];
assert.deepStrictEqual(flatIndexToPosition(builds, 1).weaponKey, 'ak117');
assert.strictEqual(flatIndexToPosition(builds, 1).indexWithinWeapon, 1);
assert.strictEqual(flatIndexToPosition(builds, 2).weaponKey, 'cx-9');
assert.strictEqual(flatIndexToPosition(builds, 2).indexWithinWeapon, 0);
// out-of-range clamps rather than throwing -- a build deleted mid-browse must not crash the click
assert.strictEqual(flatIndexToPosition(builds, 99).weaponKey, 'cx-9');
console.log('✓ loadoutScopes');
