// scripts/portalRealWalk.test.mjs — proves the real-server walk visits the REALM's views, not Season's.
//
// 🔴 THE FIXTURES ARE THE REAL ONES. `portal/fixtures/geometry/*.json` is what the instrument actually reads, so a test against an invented directory would pass under the retired hardcoded default and prove nothing. The load-bearing case is the third: broadcast must NOT come back with Season's tabs, which is the defect that shipped.
import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const { viewsFromFixture, resolveViews } = require_('./lib/portalRealWalkViews.cjs');
const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'portal', 'fixtures', 'geometry');

let n = 0; const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

assert.deepStrictEqual(viewsFromFixture('broadcast', FIX), ['Delivery queue', 'Airtime']);
ok('broadcast reads its own two views out of its fixture');

assert.deepStrictEqual(viewsFromFixture('season', FIX), ['Track', 'Board', 'Repairs']);
ok('season reads its own three — the names that used to be hardcoded for everyone');

// 🔴 THE REGRESSION. A revert to `flag('--views', 'Track,Board,Repairs')` fails HERE and nowhere else.
const bc = resolveViews('', 'broadcast', FIX);
assert.ok(!bc.includes('Board') && !bc.includes('Track') && !bc.includes('Repairs'),
    `broadcast must not inherit Season's tabs — got ${JSON.stringify(bc)}`);
ok("broadcast's resolved views contain none of Season's — the defect that shipped");

assert.deepStrictEqual(resolveViews('One,Two', 'broadcast', FIX), ['One', 'Two']);
ok('an explicit --views still overrides the fixture');

// A realm with no fixture falls back to its DEFAULT view, never to another realm's tabs: one real view checked beats three imaginary ones failed, and a wrong name reads as a defect in the page rather than in the caller.
assert.deepStrictEqual(resolveViews('', 'no-such-realm', FIX), ['default']);
ok('an unrecorded realm falls back to ["default"], not to a neighbour');

assert.deepStrictEqual(viewsFromFixture('no-such-realm', FIX), []);
ok('a missing fixture is an empty list, not a throw');

console.log(`\nportalRealWalk views — ${n} passed`);
