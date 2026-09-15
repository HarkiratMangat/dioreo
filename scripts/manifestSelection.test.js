// scripts/manifestSelection.test.js — the selection contract the Manifest's body prop hands a realm (plan pins batch 2 §10.4 Architecture). A grouped body can only keep select-all, the bulk bar and SelectionBar working if setting a whole group on or off touches that group alone; a screenshot cannot show that it does, so this does.
const assert = require('assert');
const { setSelection, toggleSelection } = require('../portal/ui/manifest.logic.js');
let passed = 0;
const sorted = (s) => [...s].sort();

let s = setSelection(new Set(['x']), ['a', 'b'], true);
assert.deepStrictEqual(sorted(s), ['a', 'b', 'x']); passed++;

s = setSelection(s, ['a', 'b'], false);
assert.deepStrictEqual(sorted(s), ['x'], 'clearing a group must leave the other selection alone'); passed++;

const input = new Set(['a']);
setSelection(input, ['b'], true);
assert.deepStrictEqual(sorted(input), ['a'], 'the input Set must not be mutated'); passed++;

assert.deepStrictEqual(sorted(setSelection(new Set(['a']), ['z'], false)), ['a'], 'clearing an id that is not selected is a no-op'); passed++;

assert.deepStrictEqual(sorted(toggleSelection(setSelection(new Set(), ['a', 'b'], true), 'a')), ['b'], 'a single toggle composes with a group set'); passed++;

console.log(`manifestSelection: ${passed} passed`);
