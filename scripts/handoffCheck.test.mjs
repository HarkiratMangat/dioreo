// scripts/handoffCheck.test.mjs — proves the handoff check reads EVERY plan SESSION-START names.
//
// 🔴 THE LOAD-BEARING CASE IS THE THIRD. `handoffCheck.mjs` resolved "the live plan" with a bare `String.match()`, which returns the FIRST path in the file — under a comment of its own saying there are legitimately several. SESSION-START names the remediation plan first and the conformance work after it, so a session working portal realms was told to point `.remember` at a plan about working mechanisms, and "which plan governs?" was recorded as an open question in two carriers while three primary sources already answered it. A revert to `match()` (singular) fails HERE and nowhere else.
//
// ⚠️ THE REAL FILE IS READ, not an invented fixture, because the defect was about what this repo's actual SESSION-START contains — a test over a made-up string would have passed under the broken code.
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
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

// A shared `g`-flagged regex carries lastIndex between calls; that is a real silent-wrong-answer bug and the module builds a fresh one per call. Two identical calls must agree.
assert.deepStrictEqual(plansNamedIn('docs/superpowers/plans/a.md'), plansNamedIn('docs/superpowers/plans/a.md'));
ok('two identical calls agree — no lastIndex carried between them');

// ── the real file, which is what the defect was actually about
const start = fs.readFileSync(path.join(ROOT, 'docs/SESSION-START.md'), 'utf8');
const real = plansNamedIn(start);
// ⚠️ CORRECTED 2026-09-08 12:11 EDT: this asserted `real.length >= 2` — a COUNT, which went stale the moment PR #186 retired two of the three live plans from SESSION-START and left one. The property the defect was about is "the resolver sees EVERY plan the file names", so the assertion is equality against an independent count of the distinct paths in the real file, with one as the floor (a SESSION-START naming no plan at all is a different defect).
const independent = [...new Set(start.match(/docs\/superpowers\/plans\/[A-Za-z0-9._-]+\.md/g) || [])];
assert.ok(independent.length >= 1, `SESSION-START names no plan at all — the pointer chain is broken`);
assert.deepStrictEqual(real, independent,
    `the resolver must see EVERY plan SESSION-START names — resolver ${JSON.stringify(real)} vs the file ${JSON.stringify(independent)}`);

// ── THE STALE-HEAD MATCHER, PROVEN BOTH WAYS (added 2026-09-07 01:55 EDT) ───────────────────────── It fired on its FIRST live run against a real stale value — a pin written before an amend, in the document it was built for. That is the can-fail proof; these two cases pin the matcher so a later edit cannot loosen it into something that always passes.
const headClaims = (body) => [...body.matchAll(/HEAD[^\n]*?`([0-9a-f]{7,40})`|`([0-9a-f]{7,40})`[^\n]*?\bis HEAD\b/gi)]
    .map((m) => m[1] || m[2]).filter(Boolean);

assert.deepStrictEqual(headClaims('| **HEAD when this was written** | **`c342a760`** — run `git log -1` |'), ['c342a760'],
    'a HEAD line must yield its hash');
assert.deepStrictEqual(headClaims('the fix landed in `6d57e68d` and shipped'), [],
    'AN ORDINARY COMMIT CITATION IS NOT A HEAD CLAIM — a handoff legitimately names the commit a measurement came from, and flagging those would make this gate fire on every well-written document, which is how a gate gets suppressed rather than obeyed');
console.log('  ✓ the stale-HEAD matcher reads a HEAD claim and ignores an ordinary citation');
ok(`the real SESSION-START names ${real.length} plans, and all of them are returned`);

assert.ok(real.some((f) => f.includes('portal-conformance')),
    `the conformance plan is the one realm sessions actually work from and it must be among them — got ${JSON.stringify(real)}`);
ok('the conformance plan is among them — it is NOT first in the file, which is the whole defect');

// 🔴 THE PROGRAM MUST RUN, AND IT HAS TO BE A SUBPROCESS. Added 2026-09-04 14:11 EDT after `npm run handoff` threw `ReferenceError: require_ is not defined` at import while this suite was green — the resolver had a test and the PROGRAM had none, so a change that made the script unrunnable passed everything. ⚠️ THE FIRST VERSION OF THIS CASE `await import`ed IT, under a comment of mine asserting the module is `process.exit`-free at import. It is not: importing runs the whole check and exits with its verdict, which killed this suite. A claim in a comment, contradicted by running it, one turn after writing it — so the subprocess is not caution, it is the measured requirement. ⚠️ THE EXIT CODE IS DELIBERATELY NOT ASSERTED. `handoffCheck` exits 1 whenever a carrier is genuinely missing, which is its JOB; asserting 0 would make this suite fail for reasons that have nothing to do with whether the script is runnable. What is asserted is that it did not die at load — a ReferenceError, a SyntaxError, or a stack trace instead of a report.
const run = spawnSync(process.execPath, [path.join(ROOT, 'scripts/handoffCheck.mjs')], { cwd: ROOT, encoding: 'utf8' });
const out = (run.stdout || '') + (run.stderr || '');
assert.ok(!/ReferenceError|SyntaxError|TypeError|Cannot find module/.test(out),
    `handoffCheck.mjs died at load rather than reporting — got:\n${out.slice(0, 600)}`);
assert.ok(/handoff check/.test(out),
    `handoffCheck.mjs produced no report at all — got:\n${out.slice(0, 600)}`);
ok('handoffCheck.mjs RUNS and reports — the resolver had a test and the program had none');

console.log(`\nhandoffCheck plans — ${n} passed`);
