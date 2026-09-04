#!/usr/bin/env node
// scripts/portalPreflight.mjs — the five-step pipeline, IN ORDER, refusing when a step undoes the last.
//
// 🔴 WHY THIS EXISTS. The order is `reflow-comments` → `portal:bust` → build → `portalGeometry --write` → commit, and reversing any pair undoes the next: a reflow after `bust` edits a source file whose `?v=` stamp was already written, so `portal:refs` fails with *"modified after its ?v= stamp"* and a warm cache serves the old file. That trap is named in `docs/superpowers/plans/SESSION2-PROMPT.md` §4 as trap 2 — and it was violated TWICE on 2026-09-04, in the session that was quoting it, because the steps are four separate commands and remembering their order is the mechanism. Naming a trap is not a mechanism; running the steps in order is.
//
// ⚠️ WHAT IT DOES NOT DO. It does not commit, and it does not decide whether the work is right. It leaves a tree that the gates can judge — nothing more.
//
// ⚠️ IT REFUSES RATHER THAN REPORTING. A preflight that prints a warning and exits 0 is a preflight nobody reads; the whole point is that the next command does not run.
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');

// The order IS the contract, so it is one list read top to bottom rather than four call sites.
export const STEPS = [
    { name: 'reflow-comments', argv: ['scripts/reflow-comments.mjs', '--write'] },
    { name: 'reflow-prose', argv: ['scripts/reflow-prose.mjs', '--write'] },
    // 🔴 BUST AFTER THE REFLOWS, BUILD AFTER THE BUST. `portal:bust` stamps every mockup page with a `?v=` derived from its assets' mtimes, so any edit to an asset after this point invalidates the stamp it just wrote — which is the exact failure this file exists to stop.
    { name: 'portal:bust', argv: ['docs/superpowers/mockups/2026-08-23-portal-interactive/.bust.mjs'] },
    { name: 'build', argv: ['-e', "require('./scripts/buildPortal').build()"] },
    // 🔴 GEOMETRY LAST, because it MEASURES the built tree. Recording before the build stamps the previous build's numbers under this commit's sha, which is a fixture that certifies the wrong tree.
    { name: 'portalGeometry --write', argv: ['scripts/portalGeometry.mjs', '--all', '--write'] },
];

// ⚠️ THE ORDER CHECK IS THE POINT, NOT THE STEPS. Running the five in sequence is easy; what has actually failed is a SIXTH thing happening between two of them. So after the bust, any later change to a mockup asset is a hard failure rather than a silent stale stamp.
const PKG = 'docs/superpowers/mockups/2026-08-23-portal-interactive';
const ASSETS = 'docs/superpowers/mockups/2026-08-23-portal-interactive/assets';
const mtimes = () => {
    const out = execFileSync('git', ['ls-files', ASSETS], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const fs = require_('fs');
    return out.map((f) => `${f}:${fs.statSync(path.join(ROOT, f)).mtimeMs}`).join('|');
};

// 🔴 THIS SCRIPT CARRIES NO STAMP GUARD, AND THREE ATTEMPTS AT ONE IS WHY — 2026-09-04 16:25 EDT. The filed entry's verify condition was "running it out of order fails", and running it is what killed each attempt:
//  1. Compare asset mtimes between this script's own bust and geometry steps. Exits 0 on a touched asset, and must: this script always runs its steps IN ORDER, so an internal comparison catches only a change made by something else mid-run.
//  2. Delegate to `portal:refs`. 🔴 **It REPORTS a stale stamp and exits 0** — reproduced twice by busting, editing `assets/app.css`'s content, and running it. A step that cannot go red.
//  3. Implement the mtime-versus-`?v=` comparison here. Cannot fire either, and the reason is structural: **this tool RE-RUNS the bust**, so any staleness present when it starts is fixed by step 3 before the check on step 5 could see it.
// **The staleness this trap describes is created by running the steps BY HAND in the wrong order — which is precisely the thing this script exists to stop anyone doing.** So the guard belongs in the suite, on the path a hand-run reaches; `portal:refs` is that path and it reports instead of failing. Filed as its own defect. What this script is, honestly: five commands in the one order that does not undo itself, and nothing more.
function run(step) {
    if (DRY) { console.log(`  · ${step.name}`); return; }
    process.stdout.write(`  · ${step.name} … `);
    try {
        execFileSync(process.execPath, step.argv, { cwd: ROOT, stdio: 'pipe' });
        console.log('ok');
    } catch (e) {
        console.log('FAILED');
        console.log(String(e.stdout || '').slice(-1200));
        console.log(String(e.stderr || '').slice(-600));
        process.exit(1);
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    console.log('\nportal:preflight — the five steps, in the one order that does not undo itself\n');
    let afterBust = null;
    for (const step of STEPS) {
        run(step);
        if (DRY) continue;
        if (step.name === 'portal:bust') afterBust = mtimes();
        else if (afterBust !== null && step.name === 'portalGeometry --write' && mtimes() !== afterBust) {
            console.log('\n  ❌ a mockup asset changed AFTER portal:bust stamped the pages.');
            console.log('     Every `?v=` written by that step is now stale and `portal:refs` will fail.');
            console.log('     Re-run this command; do not run the steps by hand in a different order.');
            process.exit(1);
        }
    }
    console.log('\n  ✅ the tree is built and measured in order. This says NOTHING about whether the work is right —');
    console.log('     run `npm test` and `npm run docs:audit` for that, and read their exit codes, not their tails.\n');
}
