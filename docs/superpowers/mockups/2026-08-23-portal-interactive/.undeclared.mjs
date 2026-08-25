/* Identifiers CALLED but never DECLARED, per file.
 * 🔴 THE FIRST VERSION OF THIS WAS VACUOUS AND REPORTED "clean". It built its `declared` set with
 * a regex that matched `name(` — which is every CALL SITE — so everything called was also
 * "declared" and nothing could ever be missing. It passed a real falsifier (rename `fitLabels`
 * and see if it notices) with a shrug. A probe that cannot report PRESENCE is not a probe, and
 * this one shipped a green tick one commit after `drawComposeGhost` had been missing all day.
 * Run with --self-test: it renames a real function in memory and asserts it gets caught. */
import { readFileSync, readdirSync } from 'node:fs';
/* ⚠️ THE REPO PATH CONTAINS A SPACE (/Applications/Claude Code/…), so `import.meta.url`'s
 * pathname is percent-encoded and `readdirSync` gets `Claude%20Code`. Documented in the memory
 * store as a recurring trap here; `fileURLToPath` is the fix, never a manual decode. */
import { fileURLToPath } from 'node:url';

const BUILTIN = new Set(('if for while switch catch return typeof function class new delete void await yield super this ' +
 'Array Object String Number Boolean Math JSON Date Set Map WeakMap Promise RegExp Error TypeError parseInt parseFloat ' +
 'isNaN isFinite encodeURIComponent decodeURIComponent setTimeout setInterval clearTimeout clearInterval fetch alert ' +
 'confirm prompt requestAnimationFrame cancelAnimationFrame getComputedStyle structuredClone queueMicrotask matchMedia ' +
 'Intl Symbol BigInt Proxy Reflect Number String Boolean addEventListener removeEventListener dispatchEvent scrollTo ' +
 'console document window navigator localStorage sessionStorage history location performance').split(/\s+/));

/* 🔴 STRIP COMMENTS AND STRINGS FIRST. Without this the probe reported `instead`, `meaning`,
 * `apart` and `not` as undeclared functions — every one of them prose, from sentences like
 * "…the window (meaning the visible span)". A checker that cries wolf a hundred times gets
 * muted, which is the same end state as not having one. */
function strip(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1 ')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
}

function inlineJs(src, file) {
  return file.endsWith('.html')
    ? [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')
    : src;
}

function declaredIn(js) {
  const d = new Set();
  const add = n => n && d.add(n);
  /* real declaration forms ONLY — never a bare `name(`, which is a call */
  for (const m of js.matchAll(/\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)/g)) add(m[1]);
  for (const m of js.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)) add(m[1]);
  for (const m of js.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) add(m[1]);
  /* `const { a, b: c } = …` and `const [a, b] = …` */
  for (const m of js.matchAll(/\b(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g))
    for (const part of m[1].split(',')) add(part.split(':').pop().replace(/[.\s=].*$/, '').trim());
  /* object-literal methods and shorthand: `name(a, b){` or `name: function` or `name: (a) =>` */
  for (const m of js.matchAll(/(?:^|[,{\n]\s*)([A-Za-z_$][\w$]*)\s*(?:\([^()]*\)\s*\{|:\s*(?:async\s*)?(?:function|\())/g)) add(m[1]);
  /* destructured parameters: `({ a, b }) => …` and `function f({ a, b })` */
  for (const m of js.matchAll(/\(\s*\{([^{}]*)\}[^)]*\)\s*(?:=>|\{)/g))
    for (const part of m[1].split(',')) add(part.split(/[:=]/).pop().replace(/[.\s].*$/, '').trim());
  /* parameters */
  for (const m of js.matchAll(/(?:function\s*\*?\s*[\w$]*\s*)?\(([^()]*)\)\s*(?:=>|\{)/g))
    for (const p of m[1].split(',')) add(p.replace(/[=.\s{}[\]:].*$/, '').trim());
  for (const m of js.matchAll(/(?:^|[^\w$)])([A-Za-z_$][\w$]*)\s*=>/g)) add(m[1]);          // single-param arrow
  for (const m of js.matchAll(/\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g)) add(m[1]);
  for (const m of js.matchAll(/\bfor\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) add(m[1]);
  return d;
}

function undeclared(raw, shared = '') {
  const js = strip(raw);
  const d = declaredIn(js + '\n' + shared);
  const called = new Set();
  for (const m of js.matchAll(/(?<![.\w$?])([A-Za-z_$][\w$]*)\s*\(/g)) called.add(m[1]);
  return [...called].filter(c => !d.has(c) && !BUILTIN.has(c) && !/^[A-Z]/.test(c)).sort();
}

const dir = fileURLToPath(new URL('.', import.meta.url));
/* A page and the assets it loads are ONE scope at runtime — `season.html` calls `isEventEnded`,
 * which `fixtures.js` declares. Checking a page in isolation reports every shared helper as
 * missing, which is not a finding, it is a misunderstanding of how the page runs. */
const SHARED = ['assets/fixtures.js', 'assets/timeline.js', 'assets/shell.js']
  .map(f => strip(readFileSync(dir + f, 'utf8'))).join('\n');
const files = readdirSync(dir).filter(f => f.endsWith('.html') && !f.startsWith('.'));

if (process.argv.includes('--self-test')) {
  const js = inlineJs(readFileSync(dir + 'season.html', 'utf8'), 'season.html');
  const broken = js.replace('function fitLabels(', 'function fitLabelsRENAMED(');
  const caught = undeclared(broken, SHARED).includes('fitLabels');
  console.log(caught ? '  ✅ self-test: a deleted function IS caught'
                     : '  ❌ self-test: VACUOUS — a deleted function is not caught');
  if (!caught) process.exit(1);
}

/* ⚠️ SIX KNOWN FALSE POSITIVES, WRITTEN DOWN RATHER THAN SUPPRESSED SILENTLY. Four are English
 * inside a template literal — "${n} build(s)", "${n} item(s)" — which a regex cannot tell from a
 * call, because at the character level it is not one. Two are parameters the param patterns still
 * miss. They are listed so the report reads clean WITHOUT the probe quietly learning to ignore a
 * category that might one day contain a real defect; delete an entry the moment its site changes.
 * Precision measured at 103 raw hits -> 6, with the self-test still catching a real deletion. */
const KNOWN_FALSE = {
  'access.html':   ['onCommit'],                 // param of wireGrantForm(a, onCommit)
  'armory.html':   ['build', 'change', 'get'],   // "build(s)" and prose inside template literals
  'broadcast.html':['bare'],                     // bare() is declared; param-shadowed in a callback
  'season.html':   ['item']                      // "item(s)" in a confirm body
};

/* ══════════════════════════════════════════════════════════════════════════════
 * SYNTAX, BEFORE ANYTHING ELSE.
 *
 * A backtick inside an HTML comment inside a TEMPLATE LITERAL terminates the literal, and
 * the page dies at parse time. That has now happened THREE times in this package —
 * shell.js, broadcast.html, analytics.html — and every time it was found by opening the page
 * and seeing it blank, because a dead page produces no console output that any of these
 * gates read and no __selfCheck for the sweeps to collect. A page that cannot parse is a
 * page every other check is silent about.
 *
 * `new Function(src)` parses without executing, which is exactly the discrimination wanted:
 * it reports the SyntaxError and never runs a line of realm code in Node.
 * ══════════════════════════════════════════════════════════════════════════════ */
let syntaxBad = 0;
for (const f of files) {
  const js = inlineJs(readFileSync(dir + f, 'utf8'), f);
  if (!js.trim()) continue;
  try { new Function(js); }
  catch (e) { console.log(`  ❌ ${f}: does not parse — ${e.message}`); syntaxBad++; }
}
/* The falsifier: a planted backtick-in-a-comment must be caught, or a clean run means nothing. */
{
  const poison = 'const x = `<!-- a ` backtick -->`;';
  let caught = false;
  try { new Function(poison); } catch (e) { caught = true; }
  console.log(caught ? '  ✅ self-test: an unterminated template IS caught'
                     : '  ❌ self-test: VACUOUS — the syntax check cannot fail');
  if (!caught) syntaxBad++;
}

/* ══════════════════════════════════════════════════════════════════════════════
 * A BACKTICK INSIDE AN HTML COMMENT INSIDE A TEMPLATE LITERAL.
 * 🔴 SIX OCCURRENCES, AND THE PARSE CHECK ABOVE CATCHES ONLY SOME OF THEM. Two backticks in one
 * comment terminate and restart the template, which parses fine — and if the restart lands
 * immediately before a member access it becomes a TAGGED TEMPLATE, valid JavaScript that fails at
 * RUNTIME. That is exactly how season.html shipped `.soon is not a function` past a green refs
 * run on 2026-08-25; the sixth occurrence was in the comment written to warn about the fifth.
 * Prose has now failed six times. This is five lines and it cannot be forgotten.
 * Scope is deliberately narrow — a backtick inside `<!-- -->` — so ordinary code and ordinary
 * comments are untouched and the check has nothing to argue with.
 * ══════════════════════════════════════════════════════════════════════════════ */
let tickBad = 0;
for (const f of files) {
  const js = inlineJs(readFileSync(dir + f, 'utf8'), f);
  for (const m of js.matchAll(/<!--[\s\S]*?-->/g)) {
    if (!m[0].includes('`')) continue;
    const line = js.slice(0, m.index).split('\n').length;
    console.log(`  ❌ ${f}:${line}: a backtick inside an HTML comment inside a template literal — ` +
                `write it with plain quotes (this parses sometimes and fails at runtime)`);
    tickBad++;
  }
}
{
  /* It must be able to fail, like everything else here. */
  const poison = 'x = `<!-- the ' + String.fromCharCode(96) + '.soon' + String.fromCharCode(96) + ' class -->`;';
  const hit = [...poison.matchAll(/<!--[\s\S]*?-->/g)].some(m => m[0].includes('`'));
  console.log(hit ? '  ✅ self-test: a backtick in an HTML comment IS caught'
                  : '  ❌ self-test: VACUOUS — the backtick lint cannot fail');
  if (!hit) tickBad++;
}
if (tickBad) syntaxBad += tickBad;
console.log(syntaxBad ? `  ⚠ ${syntaxBad} page(s) with a syntax error` : '  ✅ every page parses');

let bad = syntaxBad;
for (const f of files) {
  const js = inlineJs(readFileSync(dir + f, 'utf8'), f);
  if (!js.trim()) continue;
  const known = new Set(KNOWN_FALSE[f] || []);
  const miss = undeclared(js, SHARED).filter(m => !known.has(m));
  if (miss.length) { console.log(`  ⚠ ${f}: ${miss.join(', ')}`); bad += miss.length; }
}
console.log(bad ? `\n⚠ ${bad} identifier(s) called but never declared` : '\n✅ every called identifier is declared');
process.exit(bad ? 1 : 0);
