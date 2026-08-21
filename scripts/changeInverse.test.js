// scripts/changeInverse.test.js
const assert = require('assert');
const ChangeLog = require('../models/ChangeLog');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('the inverse field is declared on the schema', () => {
    const path = ChangeLog.schema.path('inverse');
    assert.ok(path, 'inverse is NOT declared — Mongoose will accept it in memory and drop it on the next fetch');
});

check('inverse defaults to null, not undefined', () => {
    const doc = new ChangeLog({ changeId: 'Test01-01' });
    assert.strictEqual(doc.inverse, null, 'a missing inverse must be null so "is this revertible" is answerable');
});

check('inverse survives a round trip through the schema', () => {
    const op = { type: 'draw.delete', target: { id: 'abc' }, payload: { title: 'Iron Wolf' } };
    const doc = new ChangeLog({ changeId: 'Test01-02', inverse: op });
    assert.deepStrictEqual(doc.toObject().inverse, op);
});

process.exit(failures ? 1 : 0);
