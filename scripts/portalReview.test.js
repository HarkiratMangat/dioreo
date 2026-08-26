// scripts/portalReview.test.js — the Review realm's pure halves.
//
// Review is the screen that WRITES. Everything else in the portal can be wrong and be corrected;
// this one decides whether a destructive change reaches real players, so its two pure functions are
// tested here rather than left to a browser pass: blockersFor (what stands between staged work and
// the commit button) and stalenessOf (whether the record moved underneath a staged op).
const assert = require('assert');
const { blockersFor } = require('../portal/ui/review.logic');
const { stalenessOf } = require('../portal/api/review');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.log(`  ✗ ${name}\n      ${e.message}`); }
}

console.log('portalReview — the screen that writes');

check('a clean set has no blockers, so the commit button opens', () => {
    assert.deepStrictEqual(blockersFor([{ id: 'a' }], [{ id: 'c', tier: 1, exportedAt: null }], {}, {}), []);
});

check('a tier-3 changeset without an export blocks the commit', () => {
    const b = blockersFor([{ id: 'a', tier: 3 }], [{ id: 'c', tier: 3, exportedAt: null, confirmText: 'AB12', realm: 'season' }], {}, {});
    assert.ok(b.some((x) => x.kind === 'export'), 'expected an export blocker');
});

check('an exported tier-3 changeset still demands the typed confirmation', () => {
    const cs = [{ id: 'c', tier: 3, exportedAt: new Date(), confirmText: 'AB12', realm: 'season' }];
    const b = blockersFor([{ id: 'a', tier: 3 }], cs, {}, {});
    assert.ok(!b.some((x) => x.kind === 'export'), 'export was satisfied, so that blocker should be gone');
    assert.ok(b.some((x) => x.kind === 'type'), 'the typed confirmation is a SEPARATE gate and must remain');
});

check('typing the exact confirmation word clears the last gate', () => {
    const cs = [{ id: 'c', tier: 3, exportedAt: new Date(), confirmText: 'AB12', realm: 'season' }];
    assert.deepStrictEqual(blockersFor([{ id: 'a', tier: 3 }], cs, {}, { c: 'AB12' }), []);
});

// 🔴 THE WORD IS NEVER "DELETE" — muscle memory carries you straight through that one. It is the
// changeset's own id fragment, which the SERVER independently expects (portal/api/changesets.js's
// commit route computes the same slice), so a client that accepted anything else would be rejected
// there rather than committing something unconfirmed.
check('a near-miss on the confirmation word does NOT clear the gate', () => {
    const cs = [{ id: 'c', tier: 3, exportedAt: new Date(), confirmText: 'AB12', realm: 'season' }];
    assert.strictEqual(blockersFor([{ id: 'a', tier: 3 }], cs, {}, { c: 'ab12' }).length, 1, 'case must matter');
    assert.strictEqual(blockersFor([{ id: 'a', tier: 3 }], cs, {}, { c: 'AB1' }).length, 1, 'a prefix is not the word');
});

check('a stale op blocks, and resolving it unblocks — without touching any other gate', () => {
    const ops = [{ id: 'a', stale: true }];
    assert.ok(blockersFor(ops, [], {}, {}).some((x) => x.kind === 'stale'));
    assert.deepStrictEqual(blockersFor(ops, [], { a: true }, {}), []);
});

check('an op that no longer validates blocks on its own account', () => {
    assert.ok(blockersFor([{ id: 'a', blocked: 'no such draw' }], [], {}, {}).some((x) => x.kind === 'invalid'));
});

// The mockup shipped a masthead reading "1 GATES OPEN" — plural on a count of one, and meaning the
// REVERSE of what it says. The wording is the component's, but the COUNT is this function's, so the
// singular/plural decision has something real to agree with.
check('every blocker carries a count, so the masthead noun can agree with a number', () => {
    const b = blockersFor([{ id: 'a', stale: true }, { id: 'b', stale: true }], [], {}, {});
    assert.strictEqual(b.find((x) => x.kind === 'stale').n, 2);
});

console.log('\nstalenessOf — did the record move underneath the staged change?');

check('identical before-states are not stale', () => {
    assert.deepStrictEqual(stalenessOf([{ title: 'A' }], { before: { title: 'A' } }, 0), { stale: false, checked: true });
});

check('a changed before-state IS stale', () => {
    assert.deepStrictEqual(stalenessOf([{ title: 'A' }], { before: { title: 'B' } }, 0), { stale: true, checked: true });
});

// 🔴 "WE DID NOT LOOK" AND "WE LOOKED AND IT IS FINE" ARE DIFFERENT FACTS. A changeset staged before
// models/Changeset.js gained its baseline field has nothing to compare against, and reporting that
// as clean would be the portal asserting something it never checked — on the one screen where the
// consequence of being wrong is a destructive write against a record somebody else already moved.
check('no baseline reports UNCHECKED, never clean', () => {
    assert.deepStrictEqual(stalenessOf(null, { before: { title: 'A' } }, 0), { stale: false, checked: false });
    assert.deepStrictEqual(stalenessOf([], { before: { title: 'A' } }, 0), { stale: false, checked: false });
});

check('an op index past the end of the baseline is unchecked, not clean', () => {
    assert.deepStrictEqual(stalenessOf([{ title: 'A' }], { before: { title: 'A' } }, 5), { stale: false, checked: false });
});

check('a missing fresh preview compares against null rather than throwing', () => {
    assert.strictEqual(stalenessOf([null], null, 0).stale, false);
    assert.strictEqual(stalenessOf([{ title: 'A' }], null, 0).stale, true);
});

console.log(failures ? `\n✗ ${failures} failed` : '\n✅ portalReview: all cases passed');
process.exit(failures ? 1 : 0);
