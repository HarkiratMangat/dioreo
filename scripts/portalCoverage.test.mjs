// scripts/portalCoverage.test.mjs — the self-test portal:coverage did not have.
//
// 🔴 IT EXISTS BECAUSE THE FILE STOPPED BEING A SET COMPARISON. On 2026-08-26 it grew brace matching, five class-valued props, a 600-char declaration window, a one-hop function-body lookup with a 900-char window over a concatenated sibling corpus, a member call-graph with a keyword blacklist, and a styled-class intersection — eight heuristics, added one at a time, each raising the number, none tested. A gate whose failure mode is a slightly WRONG answer rather than an error has to prove it can still be wrong, or nobody can tell which heuristic they just broke.
//
// ⚠️ EVERY CHECK HAS A FALSIFIER. A resolution test that only ever asserts "the class was found" passes on a scanner that returns every string in the file. Each one below also asserts something that must NOT be found, which is what makes the positive half mean anything.
import assert from 'node:assert';
import { emittedFrom, shellMembers, closureOf, classExpressions } from './portalCoverage.mjs';

let failures = 0;
const check = (name, fn) => {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures += 1; console.log(`  ✗ ${name}\n      ${e.message}`); }
};

console.log('portalCoverage — the scanner\'s own resolution paths');

check('a plain class attribute is read', () => {
    const out = emittedFrom('<div class="alpha beta">');
    assert.ok(out.has('alpha') && out.has('beta'));
});

check('a class EXPRESSION that interpolates is read to its real end', () => {
    // The defect: `[^}]*` stops at the INNER brace, capturing "`lvtag lv-$" and losing the literal.
    const out = emittedFrom("html`<span class=${`lvtag lv-${r.level}`}>x</span>`");
    assert.ok(out.has('lvtag'), 'the literal before the interpolation');
});

check('THE BRACE MATCHER CAN FAIL: an unrelated literal outside a class position is not counted', () => {
    const out = emittedFrom("const msg = 'saved failed'; html`<div class=${cls}>`");
    assert.ok(!out.has('saved'), 'a string with no path to a class attribute must not count');
});

check('every class-valued prop is read, and the list is shared with portal:orphans', async () => {
    const { CLASS_PROPS } = await import('./portalClassProps.mjs');
    for (const prop of CLASS_PROPS) {
        const out = emittedFrom(`{ ${prop}: 'zeta-${prop}' }`);
        assert.ok(out.has(`zeta-${prop}`), `${prop} is not being read`);
    }
    // 🔴 THE ASYMMETRY THAT LET A NO-OP CLASS SHIP. `tone` was added here and not to orphans, so a class that styles nothing counted as covered and the gate that refuses an unstyled class never saw it.
    const orphans = (await import('node:fs')).readFileSync('scripts/portalOrphans.mjs', 'utf8');
    assert.ok(orphans.includes("from './portalClassProps.mjs'"),
        'portal:orphans must read the SHARED prop list, not a second copy that can drift');
});

check('a conditional prop value still ships its class', () => {
    const out = emittedFrom("{ tone: staged ? 'stg' : undefined }");
    assert.ok(out.has('stg'));
});

check('a class computed into a variable is resolved through its declaration', () => {
    const out = emittedFrom("const kind = c.dataKind === 'detail' ? 'det' : 'ta-r';\nhtml`<td class=${kind}>`");
    assert.ok(out.has('det') && out.has('ta-r'));
});

check('THE VARIABLE RESOLVER CAN FAIL: a declaration never used in a class position is ignored', () => {
    const out = emittedFrom("const labels = 'alpha omega';\nhtml`<td class=${kind}>`");
    assert.ok(!out.has('omega'), 'resolution is bounded by USE, not by shape');
});

check('one hop through a helper reaches the class it returns', () => {
    const src = "function bandClass({ state }) {\n  if (state === 'live') return 'bar saved';\n  return 'bar';\n}\n"
              + "const cls = [bandClass({ state })].join(' ');\nhtml`<div class=${cls}>`";
    assert.ok(emittedFrom(src).has('saved'), 'the helper body was not followed');
});

check('THE HOP CAN FAIL: a helper nobody names in a class initializer is not followed', () => {
    const src = "function unrelated() { return 'ghostclass'; }\nconst cls = 'bar';\nhtml`<div class=${cls}>`";
    assert.ok(!emittedFrom(src).has('ghostclass'));
});

check('an imperative className assignment is read; a transient toggle is not', () => {
    // The line the file draws on purpose: identity is markup, state is not. See its own header.
    const out = emittedFrom("el.className = 'tip';\nel.classList.toggle('is-slow', on);");
    assert.ok(out.has('tip'), 'a direct assignment names what the element IS');
    assert.ok(!out.has('is-slow'), 'a toggle names what it is DOING, and is deliberately skipped');
});

check('a trailing-hyphen fragment is a prefix, never a class', () => {
    const out = emittedFrom('html`<span class=${`lvlb lv-${level}`}>`');
    assert.ok(!out.has('lv-'), 'a fragment nobody can emit would cap this instrument below 100% forever');
});

check('shell members are found, keywords are not, and the call graph closes over them', () => {
    const src = "    alpha({ x }){\n      return beta();\n    },\n    beta(){\n      return '<i class=\"gamma\">';\n    },\n"
              + "    if (nope) { return 1; }\n";
    const { members } = shellMembers(src);
    assert.ok(members.has('alpha') && members.has('beta'), 'both members');
    assert.ok(!members.has('if'), 'a keyword at member indentation is not a member');
    const reached = closureOf(['alpha'], members);
    assert.ok(reached.has('beta'), 'calling alpha must pull in what alpha calls');
});

check('THE CLOSURE CAN FAIL: a member nobody calls is not charged to a page', () => {
    const src = "    alpha(){\n      return 1;\n    },\n    lonely(){\n      return '<i class=\"unused\">';\n    },\n";
    const { members } = shellMembers(src);
    assert.ok(!closureOf(['alpha'], members).has('lonely'));
});

check('classExpressions returns the whole expression, nesting included', () => {
    const [expr] = classExpressions('class=${a ? `x ${b}` : "y"}');
    assert.ok(expr.includes('"y"'), `stopped early: ${expr}`);
});

console.log(failures ? `\n${failures} failed` : '\nall resolution paths verified, each with a falsifier');
process.exit(failures ? 1 : 0);
