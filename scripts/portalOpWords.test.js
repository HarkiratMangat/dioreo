// scripts/portalOpWords.test.js — every registered operation describes itself in English, on the LIVE server.
//
// 🔴 WHY THIS EXISTS, AND WHY NO EXISTING GATE COULD HAVE CAUGHT IT. `portal/ui/harness/stub.js:225` reads
// `verb: o.verb || 'changed'` — it passes the fixture's own hand-written verb straight through and never calls
// `describeOp` or `describeInverse`. So `portalDiff`, `portalAudit`, `portalConverge`, `portalProbe` and
// `portalStates` all compare a Review screen wearing words the running portal will never print. **The one screen
// where everything becomes real is the one screen whose most consequential words the instruments cannot see.**
//
// Measured 2026-09-04 21:58 EDT against `listOpTypes()`: **10 of the 42 registered op types** fell through
// `OP_VERB` and printed their raw method segment as the headline — Review's row read *"setTitlesDeadlines season"*
// for the most common edit in the product. And two `INVERSE_OF` values ended in an article the template then
// supplied again, producing *"Undo would restore the previous the season"*.
//
// ⚠️ IT READS THE REAL REGISTRY, not a list kept here. A list would go stale the moment somebody registers an op,
// which is precisely the failure being guarded: the defect was a lookup table whose fallback was the identifier,
// so it stopped being a translation silently.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
require(path.join(ROOT, 'core/ops/season'));
require(path.join(ROOT, 'core/ops/draws'));
require(path.join(ROOT, 'core/ops/calendar'));
require(path.join(ROOT, 'core/ops/loadouts'));
require(path.join(ROOT, 'core/ops/patchnotes'));
require(path.join(ROOT, 'core/ops/announcements'));
const { listOpTypes } = require(path.join(ROOT, 'core/ops'));

// `board.logic.js` declares globals rather than exporting — every page loads it as a script. Evaluating it in a
// sandbox is how a test reaches the same functions the browser does, without inventing a second copy of them.
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'portal/ui/board.logic.js'), 'utf8'), ctx);

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

const types = listOpTypes();
assert.ok(types.length >= 40, `only ${types.length} op types resolved — the registry did not load`);
ok(`the real registry loaded: ${types.length} op types`);

// ── no headline is an identifier
const camel = types
    .map((t) => [t, ctx.describeOp({ type: t, payload: {} })])
    .filter(([, d]) => /[a-z][A-Z]/.test(String(d)));
assert.deepStrictEqual(camel, [],
    `these op types print a raw method segment as their headline:\n  ${camel.map(([t, d]) => `${t} -> ${d}`).join('\n  ')}`);
ok('no registered op type describes itself with a camelCase identifier');

// ── THE GATE CAN FAIL. An unregistered op type must still come back as English, never as its own segment.
const invented = ctx.describeOp({ type: 'widget.setSomeNewThing', payload: {} });
assert.ok(!/[a-z][A-Z]/.test(invented),
    `the fallback still prints the identifier: ${invented}`);
assert.ok(/^Change to the /.test(invented), `unexpected fallback wording: ${invented}`);
ok(`THE FALLBACK CAN FAIL AND DOES NOT: an unknown op reads "${invented}"`);

// ── no inverse sentence carries two articles
const doubled = types
    .map((t) => [t, ctx.describeInverse({ type: t, payload: {} })])
    .filter(([, i]) => i && /\b(?:the|a|an|previous)\s+the\b/.test(String(i)));
assert.deepStrictEqual(doubled, [],
    `these inverse sentences carry a doubled article:\n  ${doubled.map(([t, i]) => `${t} -> ${i}`).join('\n  ')}`);
ok('no inverse sentence reads "… the previous the season"');

// ── and that check is not vacuous either
const probe = { the: 'restore the previous' };
assert.ok(/\bprevious\s+the\b/.test(`Undo would ${probe.the} the season`),
    'the doubled-article pattern does not match the very string it was written for');
ok('THE ARTICLE CHECK CAN FAIL: the pattern matches the exact string that motivated it');

console.log(`\nportal op words — ${n} passed, over ${types.length} registered operations`);
