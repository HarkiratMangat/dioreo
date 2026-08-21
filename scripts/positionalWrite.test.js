// scripts/positionalWrite.test.js
// Pure query-shape tests — no DB. What is being asserted is that the FILTER carries a prior-value
// assertion, because that assertion is the entire conflict-detection mechanism. A positional update
// without it silently wins a race it should have lost.
const assert = require('assert');
const { buildElementFilter, buildElementUpdate } = require('../core/mongo/positional');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('the filter pins the document, the element AND the expected prior values', () => {
    const f = buildElementFilter({
        docFilter: { docType: 'global' }, arrayPath: 'newDraws',
        elementId: '65abc', expect: { title: 'Iron Wolf' }
    });
    assert.strictEqual(f.docType, 'global');
    assert.strictEqual(f['newDraws._id'], '65abc');
    assert.strictEqual(f['newDraws.title'], 'Iron Wolf', 'no prior-value assertion — a stale write would succeed');
});

check('an empty expect is REJECTED, never silently allowed', () => {
    assert.throws(() => buildElementFilter({
        docFilter: { docType: 'global' }, arrayPath: 'newDraws', elementId: '65abc', expect: {}
    }), /expect/, 'an unguarded positional write must be impossible to construct');
});

check('the update targets the matched element only', () => {
    const u = buildElementUpdate({ arrayPath: 'newDraws', set: { title: 'Nightfall' } });
    assert.deepStrictEqual(u, { $set: { 'newDraws.$.title': 'Nightfall' } });
});

process.exit(failures ? 1 : 0);
