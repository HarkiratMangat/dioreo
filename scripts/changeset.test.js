// scripts/changeset.test.js
// The property under test is ALL-OR-NOTHING. The bot reads fresh on every interaction, so a
// half-applied set is served to real users within seconds — this is the highest-consequence
// invariant in the whole core.
const assert = require('assert');
const { validateSet } = require('../core/changeset');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('validateSet reports EVERY invalid op, not just the first', () => {
    const r = validateSet([
        { type: 'draw.add', payload: { title: '', category: 'new' } },
        { type: 'draw.add', payload: { title: 'Fine', category: 'nonsense' } }
    ]);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.failures.length, 2, 'a set that stops at the first error makes you fix them one round trip at a time');
});

check('validateSet reports the INDEX of each failure', () => {
    const r = validateSet([
        { type: 'draw.add', payload: { title: 'Fine', category: 'new', items: [] } },
        { type: 'draw.add', payload: { title: '', category: 'new' } }
    ]);
    assert.strictEqual(r.failures[0].index, 1, 'without an index you cannot show the user WHICH row is wrong');
});

check('the highest tier in the set is reported, because it gates the commit', () => {
    const r = validateSet([
        { type: 'draw.add', payload: { title: 'A', category: 'new', items: [] } },
        { type: 'draw.purge', target: { scope: 'all' } }
    ]);
    assert.strictEqual(r.tier, 3, 'one tier-3 op makes the whole set tier 3');
});

process.exit(failures ? 1 : 0);
