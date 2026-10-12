// scripts/portalReverseOrphans.test.mjs — proves the reverse-orphan sweep CAN FAIL, one case per shape.
//
// 🔴 THE HALF THAT MATTERS IS THE FALSIFIER, NOT THE PASS. A scanner that matches nothing reports a clean tree and looks identical to a clean tree — which is the exact failure the sweep itself exists to catch one level down, and the failure `docs-audit.test.mjs` was written after. So every case here feeds a fixture tree carrying a KNOWN defect and asserts the sweep names it, plus the inverse: a fixture with the same shape wired correctly must stay silent.
//
// 🔴 AND ONE CASE IS THE WHOLE REASON THE SWEEP PARSES EXPRESSIONS: `trow t-${RANK[key]}` must resolve to the table's declared values, so `.t-best` reads as EMITTED and `t-t4` reads as a MISMATCH. A scanner that sees only the literal prefix gets both backwards, and that miss has already happened twice on this project.
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));                               // fileURLToPath, never `new URL(...).pathname` — this repo lives under "/Applications/Claude Code/", and pathname percent-encodes the space
const SCRIPT = path.join(HERE, 'portalReverseOrphans.mjs');
let passed = 0;

function scan(files, args = []) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reverse-orphans-'));
    for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), body);
    const run = (a) => {
        try {
            return { code: 0, out: execFileSync('node', [SCRIPT, ...a], { env: { ...process.env, PORTAL_REVERSE_ROOT: dir }, encoding: 'utf8' }) };
        } catch (e) {
            return { code: e.status, out: (e.stdout || '') + (e.stderr || '') };
        }
    };
    const json = JSON.parse(run(['--json']).out);
    return { dir, json, run, extra: args };
}

const has = (list, name) => list.some((x) => x.name === name);
const check = (label, fn) => { fn(); passed++; console.log(`  ✓ ${label}`); };

console.log('portal:reverse-orphans self-test\n');

// ① a [data-*] selector with no emitter — the live defect this whole pass started from
check('① reports a [data-*] selector nothing emits, and stays silent once it is emitted', () => {
    const css = '.cb-in[data-bare]{border:0}\n.x[data-bare]{background:none}\n.y[data-kept]{color:red}\n';
    const dead = scan({ 'app.css': css, 'a.js': 'html`<input class="cb-in" data-kept="1">`' });
    assert.ok(has(dead.json.data, 'bare'), 'data-bare must be reported when nothing emits it');
    assert.ok(!has(dead.json.data, 'kept'), 'data-kept is emitted and must stay silent');
    const fixed = scan({ 'app.css': css, 'a.js': 'html`<input class="cb-in" data-bare data-kept="1">`' });
    assert.ok(!has(fixed.json.data, 'bare'), 'emitting the attribute must clear the finding');
});

// ② a var() read with no setter anywhere — CSS or JS
check('② reports a var() read with no setter, and accepts a setter written from JS', () => {
    const css = ':root{--set:#fff}\n.a{color:var(--set)}\n.b{color:var(--ci)}\n.c{top:var(--xtop)}\n';
    const dead = scan({ 'app.css': css, 'a.js': 'html`<div class="a"></div>`' });
    assert.ok(has(dead.json.vars, '--ci'), '--ci has no setter and must be reported');
    assert.ok(has(dead.json.vars, '--xtop'), '--xtop has no setter yet and must be reported');
    assert.ok(!has(dead.json.vars, '--set'), 'a var set in the stylesheet must stay silent');
    const fixed = scan({ 'app.css': css, 'a.js': 'html`<div class="a" style=${`--xtop:${n}px`}></div>`' });
    assert.ok(!has(fixed.json.vars, '--xtop'), 'an inline style that sets the var must clear the finding');
});

// ③ a class with ≥2 rules and no emitter — Home's whole card system, styled and unused
check('③ reports a class with ≥2 rules and no emitter, and ignores a single incidental rule', () => {
    const css = '.hcard{padding:8px}\n.hcard .t{font-weight:600}\n.live{color:#0f0}\n.once{color:#f00}\n';
    const r = scan({ 'app.css': css, 'a.js': "html`<div class=\"live\"></div>`" });
    assert.ok(has(r.json.classes, 'hcard'), 'hcard has two rules and no emitter');
    assert.ok(!has(r.json.classes, 'live'), 'an emitted class must stay silent');
    assert.ok(!has(r.json.classes, 'once'), 'one rule is below the threshold — noise, not a finding');
});

// ④ NAME MISMATCH, and the concatenation case that makes it visible at all
check('④ resolves a lookup table through a template: .t-best is emitted, t-t4 is a mismatch', () => {
    const css = '.trow{display:flex}\n.trow.t-best{color:#fff}\n.t-best{font-weight:700}\n.t-top4{opacity:.8}\n.t-top4 .n{opacity:.9}\n';
    const js = "const RANK_KEY = { best: 'best', top4: 't4' };\nhtml`<div class=${`trow t-${RANK_KEY[key]}`}></div>`";
    const r = scan({ 'app.css': css, 'a.js': js });
    assert.ok(!has(r.json.classes, 't-best'), '.t-best IS emitted through the table — reporting it is the miss this parser exists to prevent');
    assert.ok(has(r.json.mismatch, 't-t4'), 't-t4 is emitted and no rule matches it');
    assert.ok(has(r.json.classes, 't-top4'), '.t-top4 is styled twice and nothing emits it');
});

// 🔴 THE SELF-SUPPRESSION TRAP, PINNED. `palette.js` now carries a long comment explaining `data-bare`, and that comment contains the literal string several times. If the comment blanking ever regresses — or a file fails to parse and the scan falls back to raw source, which it does deliberately so an unreadable file is never read as clean — that comment ALONE would credit the attribute and the gate would report clean with the markup removed. A check whose own documentation suppresses it has happened in this repo before.
check('· an attribute or class named only in a COMMENT never counts as an emitter', () => {
    const css = '.q[data-bare]{border:0}\n.q[data-bare]:focus{outline:0}\n.deadclass{a:b}\n.deadclass .k{a:b}\n';
    const js = "// this component sets data-bare on its input, and .deadclass wraps it\n/* another mention of data-bare and .deadclass */\nhtml`<input class=\"q\">`";
    const r = scan({ 'app.css': css, 'a.js': js });
    assert.ok(has(r.json.data, 'bare'), 'a comment mentioning data-bare must NOT certify it as emitted');
    assert.ok(has(r.json.classes, 'deadclass'), 'a comment mentioning a class must NOT certify it as emitted');
});

// The blind spot must be COUNTED, never dropped — an unreadable expression is the one thing that can turn a ③ finding into a false positive
check('· an opaque class expression is reported rather than silently ignored', () => {
    const r = scan({ 'app.css': '.zz{color:#fff}\n.zz .k{color:#eee}\n', 'a.js': 'const cls = pick(x);\nhtml`<div class=${cls}></div>`' });
    assert.match(r.run([]).out, /resolved to nothing readable/, 'the report must say how much it could not read');
});

// A local const and an array-built class list are the commonest shapes in this tree; both must resolve, or every class in the component reads as dead
check('· resolves a class list built in a local const from an array', () => {
    const r = scan({ 'app.css': '.bar{height:8px}\n.bar.saved{opacity:1}\n', 'a.js': "const cls = ['bar', on ? 'saved' : ''].filter(Boolean).join(' ');\nhtml`<div class=${cls}></div>`" });
    assert.ok(!has(r.json.classes, 'bar'), 'a class built in an array and joined IS emitted');
});

// Comparisons and comments are the two classic false-positive sources; both are pinned
check('· the right-hand side of a comparison is not a class, and a comment is not a rule', () => {
    const r = scan({ 'app.css': '/* .ghostly is described here twice, .ghostly */\n.real{color:#fff}\n.real.on{color:#eee}\n', 'a.js': "html`<div class=${dir === 'asc' ? 'real' : 'real on'}></div>`" });
    assert.ok(!has(r.json.classes, 'ghostly'), 'a class named only in a comment has no rule and must not be reported as one');
    assert.ok(!has(r.json.mismatch, 'asc'), "'asc' is a comparison operand, not a class");
});

// The ratchet: --write records, --ci passes against its own record, and a NEW defect fails it
check('· --write then --ci passes, a new defect fails it, and a fixed entry left in the baseline also fails', () => {
    const css = '.dead{a:b}\n.dead .k{a:b}\n';
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reverse-orphans-ci-'));
    fs.writeFileSync(path.join(dir, 'app.css'), css);
    fs.writeFileSync(path.join(dir, 'a.js'), 'html`<div class="ok"></div>`');
    const env = { ...process.env, PORTAL_REVERSE_ROOT: dir };
    const run = (args) => {
        try { execFileSync('node', [SCRIPT, ...args], { env, encoding: 'utf8' }); return 0; }
        catch (e) { return e.status; }
    };
    assert.strictEqual(run(['--write']), 0, '--write must record the debt');
    assert.strictEqual(run(['--ci']), 0, '--ci must pass against the record it just wrote');
    fs.appendFileSync(path.join(dir, 'app.css'), '.fresh{a:b}\n.fresh .k{a:b}\n');
    assert.strictEqual(run(['--ci']), 1, 'a NEW rule with no element must fail the gate');
    fs.writeFileSync(path.join(dir, 'app.css'), '.ok{a:b}\n.ok .k{a:b}\n');
    assert.strictEqual(run(['--ci']), 1, 'a baseline entry that has been fixed must fail until the baseline is re-recorded');
});

console.log(`\n✅ ${passed} cases — every shape proven able to fail, and proven silent when the same shape is wired correctly.`);
