// 🔴 THE GUARD THAT WAS MISSING FOR ONE DAY. When the conformance collapse removed the flag keeping patch
// notes out of the Season manifest, it also removed the only thing keeping them out of an ACTION surface:
// buildSeasonEditOp branches on isDraw and everything else falls through to calendar.edit. This asserts the
// refusal directly, because "core/ would probably reject it" is not a guard.
const assert = require('assert');
const path = require('path');
const { buildSeasonEditOp } = require(path.join(__dirname, '..', 'portal', 'ui', 'season.logic.js'));

let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); console.log('  ✓ ' + name); pass++; } catch (e) { console.log('  ✗ ' + name + '\n      ' + e.message); fail++; } };

console.log('\nseason patch-note guard');
t('buildSeasonEditOp REFUSES a patchNotes row', () => {
    const op = buildSeasonEditOp({ lane: 'patchNotes', id: 'p1', title: 'Season 7' }, 'title', 'x');
    assert.strictEqual(op, null, 'a publication must not produce an op from the manifest');
});
t('THE GUARD CAN FAIL: a draw row still builds a draw.edit', () => {
    const op = buildSeasonEditOp({ lane: 'newDraws', id: 'd1', title: 'A draw' }, 'title', 'x');
    assert.ok(op && op.type === 'draw.edit', 'a draw must still be editable — a guard that refuses everything is not a guard');
});
t('a calendar row still builds a calendar.edit', () => {
    const op = buildSeasonEditOp({ lane: 'calendar', id: 'c1', title: 'An event' }, 'title', 'x');
    assert.ok(op && op.type === 'calendar.edit');
});
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
