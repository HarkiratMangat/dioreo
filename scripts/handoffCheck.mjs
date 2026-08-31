#!/usr/bin/env node
// scripts/handoffCheck.mjs — THE HANDOFF, AS A COMMAND RATHER THAN A PROCEDURE TO REMEMBER.
//
// 🔴 WHY THIS EXISTS. `docs/reference/session-handoff-guide.md` is 400+ lines of correct procedure and it
// has been followed inconsistently for weeks — because reading it is a thing you must REMEMBER to do, at
// exactly the moment (80% context, work in flight) when remembering is hardest. Harkirat, 2026-08-31:
// *"so what do I tell the future session so it properly hands off to the following session?"*
//
// **The answer should be one word.** He says "hand off"; the session runs this; the script says what is
// missing. Anything he has to explain beyond that is a defect in this file, not in the session.
//
// ⚠️ WHAT IT CANNOT DO, SAID FIRST SO NOBODY READS A PASS AS A GUARANTEE. It cannot tell whether a
// DECISION was made this session — that is judgement, and no script has it. What it can do is put the
// question in front of you with the evidence attached: here are the commits that touched decision-bearing
// code, and here is whether the ledger grew. A green run means the CARRIERS are in order, never that the
// content is right.

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sh = (c) => { try { return execSync(c, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return ''; } };
const read = (p) => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return null; } };

const LEDGER = 'docs/reference/portal-decision-ledger.md';
const PLAN = 'docs/superpowers/plans/2026-08-31-post-compact-remediation.md';
const REMEMBER = '.remember/remember.md';
const START = 'docs/SESSION-START.md';

let bad = 0, warn = 0;
const fail = (m, fix) => { bad++; console.log(`\n  ❌ ${m}\n     → ${fix}`); };
const soft = (m, fix) => { warn++; console.log(`\n  ⚠️  ${m}\n     → ${fix}`); };
const ok = (m) => console.log(`  ✅ ${m}`);

console.log('\nhandoff check — a handoff is THREE APPENDS and ONE SHORT REWRITE\n');

// ── 1. THE DURABLE CHAIN. This is the finding that scored the 2026-08-31 package 6/10: everything
//    hung off .remember, which is gitignored and rewritten wholesale. If the tracked files do not
//    name the live plan, losing one untracked file strands the work.
const start = read(START) || '';
for (const [f, label] of [[PLAN, 'the live plan'], [LEDGER, 'the decision ledger']]) {
    if (start.includes(path.basename(f)) || start.includes(f)) ok(`SESSION-START names ${label}`);
    else fail(`SESSION-START does NOT name ${label} — the pointer chain runs through .remember alone`,
        `add a line to ${START}. It is TRACKED and hook-injected; .remember is neither.`);
}
const claude = read('CLAUDE.md') || '';
if (claude.includes(path.basename(LEDGER))) ok('CLAUDE.md names the decision ledger');
else soft('CLAUDE.md does not name the ledger', 'add a row to its docs table — a second tracked pointer.');

// ── 2. .remember IS A POINTER. Authoring a long one means the durable carriers are missing something.
const rem = read(REMEMBER);
if (rem === null) fail('.remember/remember.md is missing', 'write a short pointer, not an essay.');
else {
    const kb = Buffer.byteLength(rem) / 1024;
    if (kb > 6) soft(`.remember is ${kb.toFixed(1)}KB — that is an essay, not a pointer`,
        'move the facts into the ledger or the deferred list. A fact worth a paragraph there belongs in a tracked file.');
    else ok(`.remember is ${kb.toFixed(1)}KB — pointer-sized`);
    if (!rem.includes(path.basename(PLAN))) fail('.remember does not name the live plan', `point at ${PLAN}.`);
    else ok('.remember names the live plan');
}

// ── 3. THE THREE APPENDS. Did the carriers actually grow, and does the ledger cover what changed?
const since = sh('git log --oneline -30 --format=%H') .split('\n').filter(Boolean);
const base = since[Math.min(since.length - 1, 19)] || 'HEAD~1';
const touched = sh(`git diff --name-only ${base}..HEAD`).split('\n').filter(Boolean);
const codeTouched = touched.filter((f) => f.startsWith('portal/ui/') || f.startsWith('core/') || f.startsWith('scripts/portal'));
const ledgerGrew = touched.includes(LEDGER);
const listGrew = touched.includes('docs/db-deferred-list.md');
const logGrew = touched.includes('docs/CHANGELOG.md');

if (codeTouched.length && !ledgerGrew) {
    soft(`${codeTouched.length} decision-bearing file(s) changed and the ledger did NOT grow`,
        `a script cannot tell whether you DECIDED anything — you can. If any of these was a judgement call, append a row to ${LEDGER}:\n        ${codeTouched.slice(0, 6).join('\n        ')}`);
} else if (ledgerGrew) ok('the decision ledger grew');
else ok('no decision-bearing code changed');

if (!listGrew) soft('docs/db-deferred-list.md did not change',
    'if anything is left open, unfinished, or newly discovered, it goes there — a limitation that lives only in a chat message is indistinguishable from one nobody noticed.');
else ok('the deferred list grew');

if (codeTouched.length && !logGrew) soft('code changed and the changelog did not',
    'append a ### to the open entry. Do NOT mint a new version.');
else if (logGrew) ok('the changelog grew');

// ── 4. NOTHING UNCOMMITTED. Work in flight does not survive a compact.
const dirty = sh('git status --porcelain').split('\n').filter(Boolean);
if (dirty.length) fail(`${dirty.length} uncommitted change(s)`, 'commit them — a compact does not preserve a dirty tree.');
else ok('working tree clean');

// ── 5. VERIFICATION IS A CLAIM ABOUT A COMMIT. Say when it was last true, never that it IS true.
console.log(`\n  ℹ️  HEAD is ${sh('git rev-parse --short HEAD')} · ${sh('git rev-list --count origin/v3-pre-release..HEAD 2>/dev/null') || '?'} commit(s) ahead of v3-pre-release`);
console.log('     ⚠️  This script does NOT run the suites. State when they last passed and on WHICH commit —');
console.log('        a green remembered from three commits ago is a claim about a tree that no longer exists.');

console.log(`\n${bad ? '❌' : '✅'} ${bad} blocking · ${warn} advisory`);
console.log('   ⚠️  A pass means the CARRIERS are in order. It says nothing about whether what you wrote is RIGHT.');
process.exit(bad ? 1 : 0);
