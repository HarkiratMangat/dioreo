// scripts/handoffCheck.test.mjs — proves the handoff check reads EVERY plan SESSION-START names.
//
// 🔴 THE LOAD-BEARING CASE IS THE THIRD. `handoffCheck.mjs` resolved "the live plan" with a bare `String.match()`, which returns the FIRST path in the file — under a comment of its own saying there are legitimately several. SESSION-START names the remediation plan first and the conformance work after it, so a session working portal realms was told to point `.remember` at a plan about working mechanisms, and "which plan governs?" was recorded as an open question in two carriers while three primary sources already answered it. A revert to `match()` (singular) fails HERE and nowhere else.
//
// ⚠️ THE REAL FILE IS READ, not an invented fixture, because the defect was about what this repo's actual SESSION-START contains — a test over a made-up string would have passed under the broken code.
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const { plansNamedIn } = require_('./lib/handoffPlans.cjs');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

let n = 0; const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// ── the pure cases
assert.deepStrictEqual(plansNamedIn(''), []);
ok('an empty file names no plan — an empty list, never a null that throws downstream');

assert.deepStrictEqual(plansNamedIn('read docs/superpowers/plans/a.md today'), ['docs/superpowers/plans/a.md']);
ok('one path is found');

assert.deepStrictEqual(
    plansNamedIn('first docs/superpowers/plans/a.md then docs/superpowers/plans/b.md'),
    ['docs/superpowers/plans/a.md', 'docs/superpowers/plans/b.md'],
);
ok('TWO paths come back as two, in SESSION-START’s own order — the singular resolver returned only the first');

assert.deepStrictEqual(
    plansNamedIn('docs/superpowers/plans/a.md ... amended: docs/superpowers/plans/a.md'),
    ['docs/superpowers/plans/a.md'],
);
ok('a plan named twice (a FIRST ACTION line and its amendment) is one plan, not two');

// A shared `g`-flagged regex carries lastIndex between calls; that is a real silent-wrong-answer bug
// and the module builds a fresh one per call. Two identical calls must agree.
assert.deepStrictEqual(plansNamedIn('docs/superpowers/plans/a.md'), plansNamedIn('docs/superpowers/plans/a.md'));
ok('two identical calls agree — no lastIndex carried between them');

// ── the real file, which is what the defect was actually about
const start = fs.readFileSync(path.join(ROOT, 'docs/SESSION-START.md'), 'utf8');
const real = plansNamedIn(start);
assert.ok(real.length >= 2,
    `SESSION-START names ${real.length} plan(s); this repo has had more than one live plan since 2026-08-31 and the check must see them all — got ${JSON.stringify(real)}`);
ok(`the real SESSION-START names ${real.length} plans, and all of them are returned`);

assert.ok(real.some((f) => f.includes('portal-conformance')),
    `the conformance plan is the one realm sessions actually work from and it must be among them — got ${JSON.stringify(real)}`);
ok('the conformance plan is among them — it is NOT first in the file, which is the whole defect');

console.log(`\nhandoffCheck plans — ${n} passed`);
