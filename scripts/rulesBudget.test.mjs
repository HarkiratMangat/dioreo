#!/usr/bin/env node
// Proves rulesBudget.mjs can actually FAIL, on each of its three verdicts.
//
// The check runs against a real directory in normal use, and a directory that happens to be clean today cannot demonstrate anything. evaluate() is therefore pure and driven here with synthetic inputs, so every branch is exercised without touching .claude/rules/.
import { evaluate } from './rulesBudget.mjs';
import assert from 'node:assert/strict';

let pass = 0;
const t = (name, fn) => { fn(); console.log(`  PASS  ${name}`); pass++; };

t('a rule at its pin is fine', () => {
    const r = evaluate({ 'a.md': 100 }, { 'a.md': 100 });
    assert.equal(r.errors.length, 0);
});

t('a rule that SHRANK is fine, and does not need the pin lowered first', () => {
    const r = evaluate({ 'a.md': 40 }, { 'a.md': 100 });
    assert.equal(r.errors.length, 0);
});

t('THE RATCHET CAN FAIL: one byte of growth is an error', () => {
    const r = evaluate({ 'a.md': 101 }, { 'a.md': 100 });
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0], /GREW/);
    assert.match(r.errors[0], /\+1/);
});

t('a NEW rule under the target needs no pin', () => {
    const r = evaluate({ 'new.md': 900 }, {}, 1000);
    assert.equal(r.errors.length, 0);
});

t('THE TARGET CAN FAIL: a new rule over it is an error', () => {
    const r = evaluate({ 'new.md': 1001 }, {}, 1000);
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0], /is new/);
});

t('a pin for a deleted rule is an error, not silently ignored', () => {
    const r = evaluate({}, { 'gone.md': 100 });
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0], /no longer exists/);
});

t('an oversized but PINNED rule warns without failing -- that is the accepted-debt path', () => {
    const r = evaluate({ 'big.md': 5000 }, { 'big.md': 5000 }, 1000);
    assert.equal(r.errors.length, 0);
    assert.equal(r.warns.length, 1);
    assert.match(r.warns[0], /5\.0x/);
});

// The load-bearing one: the debt must be VISIBLE while it is tolerated. A ratchet that reported nothing until something grew would let four encyclopedias sit in the injected tier unremarked, which is exactly the state this check was written to end.
t('every oversized rule is named in the warnings, pinned or not', () => {
    const r = evaluate({ 'a.md': 5000, 'b.md': 4000, 'c.md': 10 }, { 'a.md': 5000 }, 1000);
    assert.equal(r.warns.length, 2);
});

console.log(`\n  ${pass} passed, 0 failed`);
