// scripts/documentWrite.test.js
const assert = require('assert');
const { buildVersionedFilter } = require('../core/mongo/document');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('the filter pins both the id AND the expected version', () => {
    const f = buildVersionedFilter({ id: '65abc', expectVersion: 3 });
    assert.strictEqual(f._id, '65abc');
    assert.strictEqual(f.__v, 3, 'no version assertion — a stale write would win a race it should lose');
});

check('a missing expectVersion is REJECTED, never treated as "any version"', () => {
    assert.throws(() => buildVersionedFilter({ id: '65abc' }), /expectVersion/,
        'an unguarded document write must be impossible to construct');
});

check('version 0 is a valid expectation, not a falsy absence', () => {
    const f = buildVersionedFilter({ id: '65abc', expectVersion: 0 });
    assert.strictEqual(f.__v, 0, 'a brand-new document has __v 0 and must still be writable');
});

process.exit(failures ? 1 : 0);
