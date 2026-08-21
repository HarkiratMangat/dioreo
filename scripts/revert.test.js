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

check('a row from an entity NOT YET on the core says something different', () => {
    // Between this plan and plan 2, calendar/loadouts/patchnotes/season/announcements still use the
    // in-memory registerUndo. Their rows are BRAND NEW and also have inverse: null -- telling the user
    // they "predate revert support" would be plainly false and would read as a bug.
    const r = canRevert({ changeId: 'Aug20-09', inverse: null, undone: false, page: 'calendar' });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /not yet/i, 'an unmigrated entity must not be described as historical');
    assert.doesNotMatch(r.reason, /predates/i);
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
