// scripts/revert.test.js
const assert = require('assert');
const { canRevert } = require('../core/revert');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('a row from BEFORE the core existed says so', () => {
    const r = canRevert({ changeId: 'Aug20-01', inverse: null, undone: false, page: 'draws' });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /predates/i, 'the message must explain WHY, since every pre-Task-2 row is in this state');
});

check('every entity is on the core now -- there is no more per-page distinction', () => {
    // Plan 2 Task 7 retired the ON_CORE set and its two-reason branch: EVERY page is on the operation core now, so an inverse:null row means exactly one thing regardless of `page` -- it predates revert support. A page-specific "not yet supported" message would be a lie.
    const r = canRevert({ changeId: 'Aug20-09', inverse: null, undone: false, page: 'calendar' });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /predates/i, 'inverse:null means the same thing for every page post-Task-7');
});

check('an already-undone row cannot be reverted twice', () => {
    const r = canRevert({ changeId: 'Aug20-02', inverse: { type: 'draw.add' }, undone: true });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /already/i);
});

check('a row with an inverse and not undone can be reverted', () => {
    assert.strictEqual(canRevert({ changeId: 'Aug20-03', inverse: { type: 'draw.add' }, undone: false }).ok, true);
});

process.exit(failures ? 1 : 0);
