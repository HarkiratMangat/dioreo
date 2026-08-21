// scripts/drawOps.test.js
// validate() and invert() are PURE — no DB, no network. apply() is covered by Task 7's integration test.
const assert = require('assert');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('draw.add rejects a draw with no title', () => {
    const r = ops.resolveOp('draw.add').validate({ type: 'draw.add', payload: { title: '', category: 'new' } });
    assert.strictEqual(r.ok, false);
    assert.ok(r.errors.some(e => /title/i.test(e)), `expected a title error, got ${JSON.stringify(r.errors)}`);
});

check('draw.add normalizes the title to title case', () => {
    const r = ops.resolveOp('draw.add').validate({
        type: 'draw.add', payload: { title: 'iron wolf — legendary', category: 'new', items: [] }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.title, 'Iron Wolf — Legendary');
});

check('draw.add inverts to draw.delete naming the created element', () => {
    const inv = ops.resolveOp('draw.add').invert({
        action: 'add', model: 'SeasonalData',
        applied: { category: 'new', elementId: '65abc', title: 'Iron Wolf' }
    });
    assert.strictEqual(inv.type, 'draw.delete');
    assert.strictEqual(inv.target.elementId, '65abc');
});

check('draw.bulkReplace inverts to a bulkReplace carrying the FULL prior set', () => {
    const prior = [{ title: 'A' }, { title: 'B' }, { title: 'C' }, { title: 'D' }];
    const inv = ops.resolveOp('draw.bulkReplace').invert({
        action: 'bulkReplace', applied: { category: 'new', replaced: prior, added: [{ title: 'Nightfall' }] }
    });
    assert.strictEqual(inv.type, 'draw.bulkReplace');
    assert.deepStrictEqual(inv.payload.draws, prior,
        'the inverse of a replace must restore every element it destroyed, not just record the count');
});

check('every draw op declares a tier, and purge/bulkReplace are tier 3 and 2', () => {
    for (const t of ops.listOpTypes().filter(t => t.startsWith('draw.'))) {
        assert.ok([1, 2, 3].includes(ops.resolveOp(t).tier), `${t} has no tier`);
    }
    assert.strictEqual(ops.resolveOp('draw.purge').tier, 3);
    assert.strictEqual(ops.resolveOp('draw.bulkReplace').tier, 2);
    assert.strictEqual(ops.resolveOp('draw.add').tier, 1);
});

process.exit(failures ? 1 : 0);
