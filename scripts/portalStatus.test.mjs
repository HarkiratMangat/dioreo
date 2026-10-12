// scripts/portalStatus.test.mjs — certifies BOTH branches of portal:status's freshness check.
//
// 🔴 WHY THIS FILE EXISTS. `portal:status` reports per realm whether `portal/ui` has moved since that realm's geometry fixture was recorded. The FRESH branch was proven early — all seven realms report fresh on a tree where nothing moved — but the STALE branch had never fired once in the instrument's life, which by this repo's own rule leaves it uncertified: prove a probe can report PRESENCE before you trust its silence. Its first version cried stale on all seven at once (a fixture cannot stamp the commit it is about to be committed in); that false positive was fixed and the true positive was never tested.
//
// ⚠️ AND THE OBVIOUS WAY TO TEST IT IS BANNED. Committing a real `portal/ui` change, running the tool, then `git reset --hard` back is what destroyed four uncommitted edits on 2026-08-30 — including a plan correction that left a wrong instruction live for minutes. The decision is a pure function of two commit timestamps, so it needs no tree, no worktree and no reset.
import assert from 'assert';
import { isStale } from './portalStatus.mjs';

let passed = 0;
const check = (label, fn) => { fn(); passed++; console.log(`  ✓ ${label}`); };
console.log('portal:status — the freshness check, both branches\n');

check('STALE fires when portal/ui has a commit newer than the fixture', () => {
    assert.strictEqual(isStale('1788980900', '1788980776'), true);
});

check('FRESH when the fixture is newer than the last portal/ui commit', () => {
    assert.strictEqual(isStale('1788980776', '1788980900'), false);
});

// The real tree's own shape: a fixture recorded in the SAME commit as the ui change it measures.
check('FRESH when both were committed together — equal timestamps are not drift', () => {
    assert.strictEqual(isStale('1788980776', '1788980776'), false);
});

// 🔴 FAILS CLOSED, and this is the branch the first version got wrong in the other direction.
check('a missing timestamp is never STALE — a fresh clone must not cry wolf on all seven', () => {
    assert.strictEqual(isStale('', '1788980776'), false);
    assert.strictEqual(isStale('1788980900', ''), false);
    assert.strictEqual(isStale('', ''), false);
    assert.strictEqual(isStale(undefined, undefined), false);
});

// String comparison would put '9...' above '10...'; these two are a decade apart and lexically inverted.
check('the comparison is NUMERIC, not lexical', () => {
    assert.strictEqual(isStale('1000000000', '999999999'), true, 'a newer ui commit whose string sorts LOWER must still be stale');
    assert.strictEqual(isStale('999999999', '1000000000'), false);
});

console.log(`\n✅ ${passed} cases — the stale branch is certified, and it was never once exercised before this file.`);
