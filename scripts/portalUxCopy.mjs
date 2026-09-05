#!/usr/bin/env node
// scripts/portalUxCopy.mjs — no engineering identifier reaches a reader.
//
// 🔴 WHY THIS IS A GATE AND NOT A CHECKLIST. Phase ⑥ UX-COPY is the plan's own "most-missed body of work" (audit-log row 25): an entire copy audit existed for nine days and had never been folded into any Part, and the reason is structural — its findings are prose, so "apply them" is unfalsifiable and a session can believe it complied. Four of the audit's classes are not prose at all. A source path, a model name, a `foo()` and a `(s)` in a string a person reads are mechanically detectable, and a rule that can fail is worth more than nine rows of good advice.
//
// ⚠️ IT READS USER TEXT ONLY, AND THAT IS THE WHOLE DIFFICULTY. A naive grep over these files reports 517 hits and every one of them is code: `foo()` matches every call, `models/X.js` matches every import. The text a reader sees is the literal chunks of an `html` tagged template, minus everything inside a tag — so the extraction is an AST walk plus a tag strip, and each half has its own case in the self-test below.
//
// ⚠️ WHAT IT CANNOT SEE, stated rather than implied: copy composed at runtime from variables, copy that lives in `portal/api`, and every judgement class in the audit — a label that does not name its outcome, a vocabulary used two ways, a sentence that argues with the dialog it sits in. Those are hand-worked and recorded in the difference ledger.
import fs from 'fs';
import path from 'path';
import { parse } from 'acorn';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const UI = path.join(ROOT, 'portal', 'ui');

// A tag's insides are markup, not prose: `class="mh-add"` and an interpolated handler are read by nobody. Stripping
// them is what takes the false-positive rate from "every call site in the file" to zero.
export function visibleText(quasis) {
    return quasis.join(' ').replace(/<[^>]*>/g, ' ');
}

const RULES = [
    { id: 'source-path', re: /\b[a-z][\w.-]*\/[\w.-]+\.(?:js|mjs|cjs)\b/g, say: 'a source path' },
    { id: 'model-name', re: /\b(?:AdminUser|UserPreference|AnalyticsEvent|BootRecord|Changeset|PortalSession|GuildSettings)\b/g, say: 'a model name' },
    { id: 'function-name', re: /\b[a-zA-Z_]\w*\(\)/g, say: 'a function name' },
    // The audit's D2: `(s)` is used nowhere else in the product and reads as a form field rather than a sentence.
    { id: 'paren-s', re: /\(s\)/g, say: 'the (s) plural' },
];

// Deliberately empty, and it must stay that way — an allowlist here is how a gate becomes a diary. A string that
// genuinely needs one of these words is a string that should name the thing in the reader's own words instead.
const ALLOW = new Set([]);

export function findingsIn(source, file) {
    const out = [];
    let ast;
    try { ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' }); }
    catch (e) { return [{ file, text: '', rule: 'parse', say: `does not parse — ${e.message}` }]; }
    const walk = (n) => {
        if (!n || typeof n !== 'object') return;
        if (n.type === 'TaggedTemplateExpression' && n.tag && n.tag.name === 'html') {
            const text = visibleText(n.quasi.quasis.map((q) => q.value.cooked ?? ''));
            for (const r of RULES) {
                for (const m of text.match(r.re) || []) {
                    if (ALLOW.has(m)) continue;
                    out.push({ file, text: m, rule: r.id, say: r.say });
                }
            }
        }
        for (const k of Object.keys(n)) {
            const v = n[k];
            if (Array.isArray(v)) v.forEach(walk);
            else if (v && typeof v === 'object' && v.type) walk(v);
        }
    };
    walk(ast);
    return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    // 🔴 THE FALSIFIER RUNS FIRST AND THE PROGRAM REFUSES WITHOUT IT. Every gate in this repo that could not fail
    // stayed green through the whole period it was blind, so this one proves it can report before it reports nothing.
    const PLANT = 'const html=(x)=>x; const a = html`<p class="x">Read models/AdminUser.js and call apply() for 3 item(s)</p>`;';
    const MARKUP = 'const html=(x)=>x; const a = html`<p class="core/ops" title="apply()">Three builds need repair</p>`;';
    const kinds = new Set(findingsIn(PLANT, '<self-test>').map((p) => p.rule));
    const missing = ['source-path', 'model-name', 'function-name', 'paren-s'].filter((k) => !kinds.has(k));
    const falsePositives = findingsIn(MARKUP, '<self-test>');
    if (missing.length || falsePositives.length) {
        console.log(`\n❌ portal:uxcopy is VACUOUS — missing ${missing.join(', ') || 'nothing'}; ${falsePositives.length} false positive(s) on markup.\n`);
        process.exit(1);
    }
    console.log('\nportal:uxcopy — every rule fires on a planted case, and none fires on markup\n');

    const files = fs.readdirSync(UI).filter((f) => f.endsWith('.js')).map((f) => path.join(UI, f));
    const all = files.flatMap((f) => findingsIn(fs.readFileSync(f, 'utf8'), path.relative(ROOT, f)));
    if (!all.length) {
        console.log('  ✅ no source path, model name, function name or (s) plural reaches a reader\n');
        process.exit(0);
    }
    const byFile = {};
    for (const f of all) (byFile[f.file] = byFile[f.file] || []).push(f);
    for (const [f, list] of Object.entries(byFile)) {
        console.log(`  ${f}`);
        for (const x of list) console.log(`     ❌ ${x.say}: ${x.text}`);
    }
    console.log(`\n  ${all.length} engineering identifier(s) in text a person reads.`);
    console.log('  Name the thing in the reader\'s words — local/handoff/2026-08-25-portal-ux-copy-audit.md §B.\n');
    process.exit(1);
}
