// scripts/portalStyleRank.test.mjs — proves ④ STYLE's ordering surfaces the row that was buried.
//
// 🔴 THE FIGURES ARE THE REAL ONES, taken from the Armory run on 2026-09-01. Under the old ×count ordering the first row was a leaf-cell width delta repeated 125 times and `section.panel` sat ~140th of 149. A test written with invented numbers would pass under either ordering and prove nothing; these two rows are the ones that actually disagreed.
import assert from 'assert';
import { createRequire } from 'node:module';
const { reachOf, byReach } = createRequire(import.meta.url)('./lib/portalStyleRank.cjs');

let n = 0; const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// The two rows that disagreed, with their measured reach.
const panel = { sig: 'section.panel', n: 1,   radius: 3371 };  // a container: the whole table renders inside it
const cell  = { sig: 'td.ta-r',       n: 125, radius: 682  };  // 125 leaves, four descendants apiece

assert.ok(byReach(panel, cell) < 0, 'the container difference must sort ABOVE the 125x leaf difference');
ok('section.panel (×1, reach 3371) outranks td.ta-r (×125, reach 682) — the ordering that was inverted');

assert.ok([cell, panel].sort(byReach)[0] === panel, 'sorting an array puts the container first');
ok('the comparator holds when actually used to sort');

// ⚠️ THE OLD ORDERING, ASSERTED SO A REVERT FAILS HERE RATHER THAN GOING QUIET.
const byCount = (a, b) => b.n - a.n;
assert.ok(byCount(panel, cell) > 0, 'sanity: under ×count the leaf row led, which is the defect');
ok('under the retired ×count ordering the leaf row leads — the regression this guards');

assert.strictEqual(reachOf({ kids: 3370 }), 3371);
assert.strictEqual(reachOf({ kids: 0 }), 1);
assert.strictEqual(reachOf({}), 1);
assert.strictEqual(reachOf(null), 1);
ok('reach is the element plus its descendants, and a missing count degrades to 1 rather than NaN');

// A tie on reach falls back to ×count, so a repeated difference still leads an equally-deep one-off.
assert.ok(byReach({ n: 9, radius: 100 }, { n: 1, radius: 100 }) < 0);
ok('equal reach breaks on count');

console.log(`\n✅ portalStyleRank: ${n}/${n} passed`);
