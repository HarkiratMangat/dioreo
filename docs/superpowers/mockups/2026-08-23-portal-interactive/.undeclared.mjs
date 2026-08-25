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

let bad = 0;
for (const f of files) {
  const js = inlineJs(readFileSync(dir + f, 'utf8'), f);
  if (!js.trim()) continue;
  const known = new Set(KNOWN_FALSE[f] || []);
  const miss = undeclared(js, SHARED).filter(m => !known.has(m));
  if (miss.length) { console.log(`  ⚠ ${f}: ${miss.join(', ')}`); bad += miss.length; }
}
console.log(bad ? `\n⚠ ${bad} identifier(s) called but never declared` : '\n✅ every called identifier is declared');
process.exit(bad ? 1 : 0);
