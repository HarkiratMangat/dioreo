#!/usr/bin/env node
// scripts/docClaimCheck.mjs — A COMMAND WRITTEN INTO A DOCUMENT IS A CLAIM, AND AN UNRUN CLAIM IS A GUESS.
//
// 🔴 WHY. Two read-only audits found the same producer four times over: I wrote a command or a check into a
// document and never ran it. The clearest case — the remediation plan's own pre-merge drift check said
//
//     git rev-list --left-right --count origin/main...origin/v3-pre-release   →  "0 0 means identical"
//
// which is the WRONG PAIR and is non-zero BY DESIGN during a pre-release line. It would have read red
// forever, for the wrong reason, while never testing whether the merge target had moved — and a gate that
// always reads red trains the reader to ignore it. Nobody ran it. It shipped. The same producer wrote a
// ledger header telling sessions to `rg` a prose file (measured afterwards: 1 hit of 6) and a handoff
// script pinned to a plan filename designed to be superseded.
//
// This runs the commands a doc asserts, and prints what they ACTUALLY return, beside what the doc claims.
// It does not judge — judging is the reader's job. **It removes the excuse of not having looked.**
//
// USAGE   node scripts/docClaimCheck.mjs [--doc <path>]
//
// ⚠️ WHAT IT WILL NOT DO: run anything that writes, pushes, merges, deletes, or installs. A doc full of
// destructive commands is exactly where an over-eager checker does real damage, so the allowlist is
// POSITIVE — a command is run only if it matches a known-read-only shape — and everything else is listed
// as "not run, verify by hand" rather than silently skipped. **A skipped check that looks like a pass is
// the defect this whole file exists to fight.**

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };

// POSITIVE allowlist. Read-only shapes only. Anything not matching is REPORTED, never guessed at.
const SAFE = [
    /^git (rev-list|log|status|diff|branch|worktree|rev-parse|fetch --dry-run)\b/,
    /^rg\b(?!.*--(replace|files-with-matches\s+-r))/,
    /^ls\b/, /^wc\b/, /^cat\b/, /^head\b/, /^tail\b/,
    /^node --check\b/,
    /^npm run (docs:audit|portal:status|handoff|portal:orphans)\b/,
    /^node scripts\/(portalGeometry|portalOrphans|portalReverseOrphans|reflow-prose|reflow-comments)\.mjs .*--check\b/,
];
const DESTRUCTIVE = /\b(push|merge|rm |mv |commit|tag|--write|--fix|install|publish|deploy|reset|clean)\b/;

function commands(md) {
    const out = [];
    // Inline code spans that look like a shell command, and fenced bash blocks.
    for (const m of md.matchAll(/`([^`\n]{6,200})`/g)) {
        const c = m[1].trim();
        if (/^(git|rg|npm run|node|ls|wc|cat|head|tail) /.test(c)) out.push(c);
    }
    for (const m of md.matchAll(/```(?:bash|sh)\n([\s\S]*?)```/g)) {
        for (const line of m[1].split('\n')) {
            const c = line.trim();
            if (c && !c.startsWith('#') && /^(git|rg|npm|node|ls) /.test(c)) out.push(c);
        }
    }
    return [...new Set(out)];
}

function liveDocs() {
    const out = [];
    for (const dir of ['docs/superpowers/plans', 'docs/reference']) {
        const d = path.join(ROOT, dir);
        if (!fs.existsSync(d)) continue;
        for (const f of fs.readdirSync(d)) {
            if (!f.endsWith('.md')) continue;
            const head = fs.readFileSync(path.join(d, f), 'utf8').slice(0, 300);
            if (/^status:\s*live/m.test(head)) out.push(path.join(dir, f));
        }
    }
    return out;
}

const docs = arg('--doc') ? [arg('--doc')] : liveDocs();
let ran = 0, skipped = 0, failed = 0;
console.log('\ndoc:claims — running the commands live documents assert\n');

for (const doc of docs) {
    const md = fs.readFileSync(path.join(ROOT, doc), 'utf8');
    const cmds = commands(md);
    if (!cmds.length) continue;
    console.log(`  ── ${doc}`);
    for (const c of cmds) {
        const safe = SAFE.some((re) => re.test(c)) && !DESTRUCTIVE.test(c);
        if (!safe) { skipped++; console.log(`     ⏭  NOT RUN (verify by hand): ${c.slice(0, 96)}`); continue; }
        let out = '', code = 0;
        try { out = execSync(c + ' 2>&1', { cwd: ROOT, encoding: 'utf8', timeout: 60000 }).trim(); }
        catch (e) { out = String(e.stdout || e.message).trim(); code = e.status ?? 1; }
        ran++;
        const first = out.split('\n')[0] || '(no output)';
        if (code && !/docs:audit/.test(c)) { failed++; console.log(`     ❌ exit ${code}  ${c.slice(0, 78)}\n        → ${first.slice(0, 110)}`); }
        else console.log(`     ✔  ${c.slice(0, 78)}\n        → ${first.slice(0, 110)}`);
    }
    console.log('');
}
console.log(`  ${ran} run · ${skipped} not run · ${failed} non-zero`);
console.log('  🔴 READ THE OUTPUT AGAINST WHAT THE DOC CLAIMS. A command that RUNS is not a command that is RIGHT —');
console.log('     the drift check that produced this script exited 0 and returned the wrong answer.');
process.exit(0);
