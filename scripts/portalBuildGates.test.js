// scripts/portalBuildGates.test.js — the build's own source-shape gates, tested as pure functions.
//
// 🔴 WRITTEN BECAUSE assertNamedImportsResolve WAS PROVEN ONCE, BY HAND, AND THE FALSIFIER WAS THROWN AWAY. It was added on 2026-09-03 after a missing `export` blanked the portal, verified by temporarily deleting an `export` keyword and watching the build fail — and then nothing kept that proof. A gate whose failure path has no test is a gate that can rot into a vacuous pass, which is the failure this repo has three memories about. Every case below is a FALSIFIER: it asserts the gate THROWS, and one asserts it does not.
const assert = require('assert');
const { assertNamedImportsResolve } = require('./buildPortal');

let passed = 0;
const t = (name, fn) => { fn(); passed += 1; console.log(`  ✓ ${name}`); };
const throws = (src, dep, re) => assert.throws(() => assertNamedImportsResolve('caller.js', src, () => dep), re);

t('a named import of something the sibling does not export THROWS', () => {
    throws("import { buildTrackData } from './season.js';", 'function buildTrackData(l) {}', /does not export it/);
});

t('the message names the identifier and the file it came from', () => {
    throws("import { nope } from './season.js';", 'export const yes = 1;', /imports 'nope' from '.\/season.js'/);
});

t('an `export function` declaration satisfies it', () => {
    assertNamedImportsResolve('c.js', "import { a } from './x.js';", () => 'export function a() {}');
});

t('an `export const` declaration satisfies it', () => {
    assertNamedImportsResolve('c.js', "import { a } from './x.js';", () => 'export const a = 1;');
});

t('an `export { a }` re-export list satisfies it', () => {
    assertNamedImportsResolve('c.js', "import { a } from './x.js';", () => 'const a = 1;\nexport { a };');
});

t('`as` aliasing checks the SOURCE name, not the local one', () => {
    throws("import { missing as present } from './x.js';", 'export const present = 1;', /imports 'missing'/);
});

t('a multi-name import checks every name', () => {
    throws("import { a, b, c } from './x.js';", 'export const a=1; export const c=3;', /imports 'b'/);
});

t('a .logic.js import is left to assertNoLogicImport', () => {
    assertNamedImportsResolve('c.js', "import { x } from './y.logic.js';", () => 'function x() {}');
});

t('a sibling the build does not emit is skipped rather than guessed at', () => {
    assertNamedImportsResolve('c.js', "import { x } from './vendored.js';", () => null);
});

t('a commented-out bad import is NOT reported — comments are stripped first', () => {
    assertNamedImportsResolve('c.js', "// import { gone } from './x.js';", () => 'export const kept = 1;');
});

console.log(`\n  ${passed} passed, 0 failed`);
