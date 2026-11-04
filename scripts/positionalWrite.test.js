// scripts/positionalWrite.test.js Pure query-shape tests — no DB. What is being asserted is that the FILTER carries a prior-value assertion, because that assertion is the entire conflict-detection mechanism. A positional update without it silently wins a race it should have lost.
const assert = require('assert');
const { buildElementFilter, buildElementUpdate, splitExpect, sameStored } = require('../core/mongo/positional');

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

check('arrays of objects are compared in code, never put in the Mongo filter (prod draws with id-less items)', () => {
    const items = [{ tier: 'legendary', name: 'Domain Of Sanction' }];
    const { guard, deep } = splitExpect({ title: 'Herrscher of Thunder Draw', priceType: ['a', 'b'], items });
    assert.deepStrictEqual(Object.keys(guard).sort(), ['priceType', 'title'], 'scalars and primitive arrays stay Mongo-side');
    assert.deepStrictEqual(Object.keys(deep), ['items'], 'a subdocument array must not reach the Mongoose cast, which mints _ids');
    assert.deepStrictEqual(Object.keys(splitExpect({ items: [] }).deep), [], 'an empty array has no objects to mis-cast');
});

check('the stored-form comparison ignores key order and sees a real difference', () => {
    const id = { toJSON: () => '6adb99a6e739e232487d5aa9' };
    assert.ok(sameStored([{ tier: 'legendary', name: 'A' }], [{ name: 'A', tier: 'legendary' }]), 'key order is not a conflict');
    assert.ok(sameStored([{ name: 'A', _id: id }], [{ name: 'A', _id: '6adb99a6e739e232487d5aa9' }]), 'an ObjectId equals its stored hex');
    assert.ok(!sameStored([{ name: 'A' }], [{ name: 'B' }]), 'a changed value IS a conflict');
    assert.ok(!sameStored([{ name: 'A' }], [{ name: 'A' }, { name: 'B' }]), 'an added item IS a conflict');
});

process.exit(failures ? 1 : 0);
