// scripts/portalTemplateComments.test.mjs — proves the gate can FIRE, and proves each thing it must stay quiet about.
//
// 🔴 THE FALSE-NEGATIVE HALF IS THE POINT. A checker that never matches anything passes every run and certifies nothing, and
// this repo has shipped two of those (see `eslint.config.mjs`'s note on the import-based TDZ checker whose falsifier passed
// for the wrong reason twice). So the fixtures below come in pairs: one that MUST fire and one that MUST NOT, for every
// distinction the lexer draws.
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { scanSource } from './portalTemplateComments.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const B = '`';                                            // written as a variable so THIS file never trips its own subject
let n = 0;
const ok = (name) => { n++; console.log(`  ✓ ${name}`); };

// ── MUST FIRE ────────────────────────────────────────────────────────────────
// The EVEN case: parses cleanly, node --check is silent, the page renders wrong. This is the whole reason the gate exists.
{
    const src = `const x = html${B}<div><!-- the ${B}foo${B} prop is read here --></div>${B};`;
    const f = scanSource(src, 'even.js');
    assert.strictEqual(f.length, 1, 'an even number of backticks in an HTML comment must be reported');
    assert.strictEqual(f[0].tag, 'html');
    assert.strictEqual(f[0].line, 1);
    ok('EVEN number of backticks in an HTML comment — fires (node --check cannot see this one)');
}
// The ODD case: node --check also catches it, but the gate must not depend on that being run first.
{
    const f = scanSource(`const x = html${B}<div><!-- see ${B}foo --></div>${B};`, 'odd.js');
    assert.strictEqual(f.length, 1, 'an odd number of backticks must be reported too');
    ok('ODD number of backticks in an HTML comment — fires');
}
// A multi-line comment, which is the shape every real occurrence has had.
{
    const src = ['const x = html`<div>', '    <!-- ⚠️ THE THING. See `rows.length` for why.', '         Second line. -->', '</div>`;'].join('\n');
    const f = scanSource(src, 'multiline.js');
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].line, 2, 'the reported line is the backtick, not the file');
    ok('multi-line HTML comment — fires, and names the line the backtick is on');
}
// Two broken comments in one template: the scan resumes inside the first, so the second is not swallowed.
{
    const src = `const x = html${B}<i><!-- a ${B}b${B} --></i><i><!-- c ${B}d${B} --></i>${B};`;
    assert.strictEqual(scanSource(src, 'two.js').length, 2, 'a second broken comment must still be found');
    ok('two broken comments in one template — both fire');
}
// Untagged templates are still scanned; the defect belongs to template literals, not to `html`.
{
    const f = scanSource(`const x = ${B}<div><!-- ${B}a${B} --></div>${B};`, 'untagged.js');
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].tag, '(untagged)');
    ok('untagged template literal — fires, and says so');
}

// ── MUST NOT FIRE ────────────────────────────────────────────────────────────
{
    const src = `const x = html${B}<div><!-- a perfectly ordinary comment --></div>${B};`;
    assert.strictEqual(scanSource(src, 'clean.js').length, 0);
    ok('HTML comment with no backtick — silent');
}
{
    // A backtick in the template's TEXT, outside any comment, is ordinary content.
    const src = `const x = html${B}<div>${B}${B}</div>${B};`;
    assert.strictEqual(scanSource(src, 'text.js').length, 0);
    ok('backticks in template text but outside a comment — silent');
}
{
    // A JS block comment holding both an HTML comment and a backtick is not template text at all.
    const src = `/* <!-- see ${B}foo${B} --> */\nconst x = html${B}<div>hi</div>${B};`;
    assert.strictEqual(scanSource(src, 'jsblock.js').length, 0);
    ok('HTML comment + backtick inside a JS block comment — silent');
}
{
    const src = `// <!-- ${B}foo${B} -->\nconst x = html${B}<div>hi</div>${B};`;
    assert.strictEqual(scanSource(src, 'jsline.js').length, 0);
    ok('HTML comment + backtick inside a JS line comment — silent');
}
{
    const src = `const s = "<!-- ${B}foo${B} -->";`;
    assert.strictEqual(scanSource(src, 'string.js').length, 0);
    ok('HTML comment + backtick inside a quoted string — silent');
}
{
    // An interpolation slot legitimately contains a nested template. The comment is in the OUTER template and clean; the
    // backticks belong to the inner one and must not be attributed to it.
    const src = `const x = html${B}<div><!-- clean --> \${cond ? html${B}<b>y</b>${B} : null}</div>${B};`;
    assert.strictEqual(scanSource(src, 'nested.js').length, 0);
    ok('nested template inside ${} beside a clean comment — silent');
}
{
    // An escaped backtick inside template text does NOT end the template, and must not be read as one.
    const src = `const x = html${B}<div><!-- an escaped \\${B} is not a terminator --></div>${B};`;
    assert.strictEqual(scanSource(src, 'escaped.js').length, 1,
        'an escaped backtick inside an HTML comment is still reported — it is legal, but nobody means it and it reads as the bug');
    ok('escaped backtick in a comment — reported (documented as deliberate, not an oversight)');
}
{
    // Object braces inside a ${} slot must not pop the expression context early, or everything after them is mis-lexed.
    const src = `const x = html${B}<div style=\${{ a: 1, b: { c: 2 } }}><!-- ${B}z${B} --></div>${B};`;
    assert.strictEqual(scanSource(src, 'braces.js').length, 1, 'brace depth inside ${} must be tracked, or the lexer loses the template');
    ok('nested object braces in ${} then a broken comment — still fires (brace depth is tracked)');
}

// ── END TO END: the real CLI, its exit code, and its refusal to certify an empty scan ────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tplcomment-'));
const run = (dir) => {
    try {
        const out = execFileSync('node', [path.join(HERE, 'portalTemplateComments.mjs')],
            { env: { ...process.env, PORTAL_TPLCOMMENT_ROOT: dir }, encoding: 'utf8' });
        return { code: 0, out };
    } catch (e) { return { code: e.status, out: (e.stdout || '') + (e.stderr || '') }; }
};
{
    const d = path.join(tmp, 'bad'); fs.mkdirSync(d);
    fs.writeFileSync(path.join(d, 'a.js'), `export const x = html${B}<div><!-- see ${B}q${B} here --></div>${B};\n`);
    const r = run(d);
    assert.strictEqual(r.code, 1, 'a broken fixture must exit NON-ZERO');
    assert.ok(r.out.includes('a.js'), 'the message must name the file');
    assert.ok(r.out.includes('<!--'), 'the message must quote the comment');
    ok('CLI on a broken fixture — exit 1, names the file and quotes the comment');
}
{
    const d = path.join(tmp, 'good'); fs.mkdirSync(d);
    fs.writeFileSync(path.join(d, 'a.js'), `export const x = html${B}<div><!-- fine --></div>${B};\n`);
    assert.strictEqual(run(d).code, 0, 'a clean fixture must exit 0');
    ok('CLI on a clean fixture — exit 0');
}
{
    // §0.5a R7: the guard must not swallow the failure it was written for. A directory with no templates in it is not a pass.
    const d = path.join(tmp, 'empty'); fs.mkdirSync(d);
    fs.writeFileSync(path.join(d, 'a.js'), 'export const x = 1;\n');
    const r = run(d);
    assert.strictEqual(r.code, 1, 'a scan that found no templates must FAIL rather than report clean');
    assert.ok(r.out.includes('extractor'), 'and it must say the extractor, not the code, is the suspect');
    ok('CLI on a directory with no templates — exit 1, blames the extractor');
}
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\n✅ portalTemplateComments: ${n}/${n} passed`);
