#!/usr/bin/env node
// scripts/handoffCheck.mjs — THE HANDOFF, AS A COMMAND RATHER THAN A PROCEDURE TO REMEMBER.
//
// 🔴 WHY THIS EXISTS. `docs/reference/session-handoff-guide.md` is 400+ lines of correct procedure and it has been followed inconsistently for weeks — because reading it is a thing you must REMEMBER to do, at exactly the moment (80% context, work in flight) when remembering is hardest. Harkirat, 2026-08-31: *"so what do I tell the future session so it properly hands off to the following session?"*
//
// **The answer should be one word.** He says "hand off"; the session runs this; the script says what is missing. Anything he has to explain beyond that is a defect in this file, not in the session.
//
// ⚠️ WHAT IT CANNOT DO, SAID FIRST SO NOBODY READS A PASS AS A GUARANTEE. It cannot tell whether a DECISION was made this session — that is judgement, and no script has it. What it can do is put the question in front of you with the evidence attached: here are the commits that touched decision-bearing code, and here is whether the ledger grew. A green run means the CARRIERS are in order, never that the content is right.

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sh = (c) => { try { return execSync(c, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return ''; } };
const read = (p) => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return null; } };

const LEDGER = 'docs/reference/portal-decision-ledger.md';

// 🔴 THE LIVE PLAN COMES FROM SESSION-START, WHICH IS THE ONLY FILE THAT DECIDES WHAT GOVERNS NOW.
//
// Two earlier versions of this were both wrong, and the second wrongness is the interesting one. First it HARDCODED a dated filename that this repo's taxonomy expects to be superseded — caught by the second audit. Then it globbed for `kind: plan` + `status: live` and took the newest — and that is wrong by DESIGN, not by edge case: **there are legitimately TWO live plans right now** (the conformance plan governs realm work, the remediation plan governs the fixes), so "the live plan" was never a singular thing and a glob silently picked one. With zero live plans it would have thrown on path.basename(null).
//
// SESSION-START's FIRST ACTION is the one place that states what a session should read first. Derive from it, and if it names nothing, say so loudly rather than guess — a wrong guess here silently validates a pointer chain that leads somewhere else. 🔴 ALL OF THEM, NOT THE FIRST ONE — corrected 2026-09-04 14:02 EDT. The comment above has said since it was written that there are legitimately TWO live plans, and this function then returned `match()` — the FIRST path in the file. SESSION-START names the remediation plan first and the conformance work second, so the singular answer was always the remediation plan, and the `.remember` check below dutifully demanded that a session working realms name a plan about working MECHANISMS. That is how "which plan governs?" came to be recorded as an open question in `.remember` and in `docs/db-deferred-list.md` while THREE primary sources already answered it: the remediation plan's own "the conformance plan is NOT superseded", SESSION-START's 2026-09-01 amendment ("if you were handed a realm prompt, that prompt is your first action and this line is not"), and this very comment. A function contradicting the comment directly above it is the receipt class this repo keeps finding.
const { plansNamedIn } = require_('./lib/handoffPlans.cjs');
function livePlans() {
    return plansNamedIn(read(START) || '');
}

// ⚠️ CALLED BELOW, AFTER `START` EXISTS. Assigning here read `START` in its temporal dead zone and threw at import — a live TDZ, written minutes after committing a plan whose Task 1 exists to catch exactly this, and which `node --check` passes. That is the whole argument for the lint rule.
const REMEMBER = '.remember/remember.md';
const START = 'docs/SESSION-START.md';
const PLANS = livePlans();
const PLAN = PLANS[0] || null;   // kept for the messages that name ONE path

let bad = 0, warn = 0;
const fail = (m, fix) => { bad++; console.log(`\n  ❌ ${m}\n     → ${fix}`); };
const soft = (m, fix) => { warn++; console.log(`\n  ⚠️  ${m}\n     → ${fix}`); };
const ok = (m) => console.log(`  ✅ ${m}`);

console.log('\nhandoff check — a handoff is THREE APPENDS and ONE SHORT REWRITE\n');

// ── 1. THE DURABLE CHAIN. This is the finding that scored the 2026-08-31 package 6/10: everything
//    hung off .remember, which is gitignored and rewritten wholesale. If the tracked files do not
//    name the live plan, losing one untracked file strands the work.
const start = read(START) || '';
if (!PLANS.length) fail('SESSION-START names no plan at all — there is no first action',
    `add the governing plan's path to ${START}. Every other check here assumes one exists.`);
else ok(`SESSION-START names ${PLANS.length} live plan(s): ${PLANS.map((f) => path.basename(f)).join(' · ')}`);
for (const [f, label] of [[LEDGER, 'the decision ledger']]) {
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
    // ⚠️ ANY of the live plans, not a specific one. Demanding a named file here is what told three sessions to point `.remember` at the plan they were not working from.
    const named = PLANS.filter((f) => rem.includes(path.basename(f)));
    if (!named.length) fail('.remember names none of the live plans', `point at one of: ${PLANS.join(' · ')}.`);
    else ok(`.remember names ${named.map((f) => path.basename(f)).join(' · ')}`);
}

// ── 3. THE THREE APPENDS. Did the carriers actually grow, and does the ledger cover what changed? ⚠️ THE WINDOW IS A GUESS AND IT SAYS SO. There is no reliable session boundary in git: `.remember` is gitignored, so its rewrites leave no history to anchor to. A fixed lookback can BOTH pass falsely (an unrelated ledger edit from a previous session sits inside it) and fail falsely (a long session pushes a correct early append outside it). The second audit called this broken by construction; it is, and the honest fix is to PRINT the window rather than imply precision. `--since <ref>` overrides it.
const sinceArg = process.argv.includes('--since') ? process.argv[process.argv.indexOf('--since') + 1] : null;
const hist = sh('git log --oneline -40 --format=%H').split('\n').filter(Boolean);
const base = sinceArg || hist[Math.min(hist.length - 1, 19)] || 'HEAD~1';
console.log(`  ℹ️  window: ${base.slice(0, 9)}..HEAD (${sh(`git rev-list --count ${base}..HEAD`) || '?'} commits)`
    + `${sinceArg ? '' : ' — a GUESS, not the session boundary. Pass --since <ref> if it is wrong.'}`);
const touched = sh(`git diff --name-only ${base}..HEAD`).split('\n').filter(Boolean);
const codeTouched = touched.filter((f) => f.startsWith('portal/ui/') || f.startsWith('core/') || f.startsWith('scripts/portal'));
const ledgerGrew = touched.includes(LEDGER);
const listGrew = touched.includes('docs/db-deferred-list.md');
const logGrew = touched.includes('docs/CHANGELOG.md');

if (codeTouched.length && !ledgerGrew) {
    console.log('\n  ══════════════════════════════════════════════════════════════════════');
    console.log('  🔴 THE ONE QUESTION THIS SCRIPT CANNOT ANSWER, AND THE MOST DANGEROUS ONE');
    console.log('  ══════════════════════════════════════════════════════════════════════');
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

// ── 4. 🔴 IS THE CODE ACTUALLY GREEN? The second audit's headline: this script reported full green while
//    `npm test` was RED on a file the same round of work had just created, and `docs:audit` carried an
//    unaccounted second error. **It verified the documentation plumbing while being structurally blind to
//    the thing plumbing exists to protect.** The fast gates run here; the full suite is named, not run.
for (const [cmd, label] of [['npm run docs:audit', 'docs:audit'],
                            ['node scripts/reflow-prose.mjs --check', 'prose reflow'],
                            ['node scripts/reflow-comments.mjs --check', 'comment reflow']]) {
    let code = 0;
    try { execSync(cmd, { cwd: ROOT, stdio: 'pipe' }); } catch (e) { code = e.status ?? 1; }
    // docs:audit exits 1 on the single expected (#PR) placeholder while the branch has no PR. Anything ELSE failing is a real finding, so the count is read rather than the exit code alone.
    if (label === 'docs:audit') {
        let out = ''; try { out = execSync(cmd + ' 2>&1 || true', { cwd: ROOT, encoding: 'utf8' }); } catch { /* captured below */ }
        const m = /fail CI \((\d+)\)/.exec(out);
        const n = m ? Number(m[1]) : (code ? -1 : 0);
        if (n > 1) fail(`docs:audit reports ${n} errors — more than the one expected (#PR) placeholder`,
            'read them. The plan\'s Task 11 expects exactly 1; anything more is unaccounted for.');
        else if (n < 0) fail('docs:audit failed and its error count could not be read', 'run it directly.');
        else ok(`docs:audit at its expected baseline (${n} error)`);
    } else if (code) fail(`${label} FAILS`, `run the command and fix it — it is a blocking gate in npm test, so the suite is RED right now.`);
    else ok(`${label} clean`);
}
console.log('     ⚠️  `npm test` itself is NOT run here (minutes long). It is an && chain, so an early');
console.log('        failure means the LATER gates never ran at all — a red suite is not one failure.');

// ── 5. NOTHING UNCOMMITTED. Work in flight does not survive a compact.
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
