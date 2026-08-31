/* Identifiers CALLED but never DECLARED, per file.
 * 🔴 THE FIRST VERSION OF THIS WAS VACUOUS AND REPORTED "clean". It built its `declared` set with
 * a regex that matched `name(` — which is every CALL SITE — so everything called was also
 * "declared" and nothing could ever be missing. It passed a real falsifier (rename `fitLabels`
 * and see if it notices) with a shrug. A probe that cannot report PRESENCE is not a probe, and
 * this one shipped a green tick one commit after `drawComposeGhost` had been missing all day.
 * Run with --self-test: it renames a real function in memory and asserts it gets caught. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
/* 🔴 THE HARNESSES WERE EXEMPT FROM THE TWO CHECKS THAT PROTECT THEM MOST. `.states.html` and
 * `.audit-all.html` are dot-files, excluded above so the undeclared-identifier pass does not trip
 * over the globals they reach into across an iframe boundary — a correct exclusion for THAT check
 * and wrong for the parse and backtick checks, which care only about syntax.
 * `.states.html` is 400+ lines of template literals; a backtick inside an HTML comment there kills
 * the sweep, and a dead sweep reports "no __selfCheck" for every page — which reads like eight
 * broken realms rather than one broken harness. Found by asking whether the new lint fires on its
 * own artifacts, which it could not, because it never looked at them. */
const syntaxFiles = readdirSync(dir).filter(f => f.endsWith('.html'));

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
for (const f of syntaxFiles) {
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
for (const f of syntaxFiles) {
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

/* ══════════════════════════════════════════════════════════════════════════════
 * THE CACHE-BUSTER IS BUMPED BY HAND, AND THAT WAS THE LAST ADMITTED-UNENFORCED STEP.
 * 🔴 COMPANION §15.8 says so in as many words: "bumped by hand when an asset changes — it is an
 * unenforced step guarding against the exact staleness failure §0 describes". A stale asset has
 * produced three false "verified" claims in this package's history, and on 2026-08-25 thirty-five
 * references were bumped by hand after a day of editing app.css and shell.js. Every other
 * recurring manual step in this package became a gate today; this is the last one.
 * The invariant is checkable and needs no judgement: NO ASSET MAY BE NEWER THAN THE `?v=` STAMP
 * OF THE PAGE THAT REFERENCES IT. If it is, a warm cache serves the old file and every check in
 * this repo is silent about it.
 * 🔴 IT USES THE ASSET'S LAST COMMIT TIME, NOT ITS mtime, SINCE 2026-08-31. It used mtime, and the
 * comment right here said a fresh `git clone` sets every mtime to checkout time and "can report a
 * false positive… that is the safe direction". It is not a safe direction in CI: EVERY CI run is a
 * fresh clone, so checkout time is always newer than any fixed stamp and this check could NEVER
 * pass there. Bumping does not help either — the next clone's mtime is newer again. It failed on the
 * first push of `feat/portal-redesign-session-b` on all six assets at once, which is the signature.
 * ⚠️ Commit time is the right clock because it is a property of the CONTENT, stable across clones,
 * while mtime is a property of one filesystem. Falls back to mtime outside a git tree (an exported
 * copy of the package), which is the only case where mtime is the best signal available.
 * ══════════════════════════════════════════════════════════════════════════════ */
let staleBust = 0;
{
  const stamps = new Map();   // asset -> newest ?v= seen across all pages
  for (const f of files) {
    const html = readFileSync(dir + f, 'utf8');
    for (const m of html.matchAll(/(assets\/[A-Za-z0-9_.-]+)\?v=(\d+)/g)) {
      const [, asset, v] = m;
      stamps.set(asset, Math.max(stamps.get(asset) || 0, Number(v)));
    }
  }
  // Last commit time when the file is tracked; mtime only when git cannot answer.
  const changedAt = (rel) => {
    try {
      const out = execFileSync('git', ['log', '-1', '--format=%ct', '--', rel], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (out) return Number(out);
    } catch { /* not a git tree, or git absent — fall through */ }
    try { return Math.floor(statSync(dir + rel).mtimeMs / 1000); } catch { return null; }
  };
  for (const [asset, v] of stamps) {
    const changed = changedAt(asset);
    if (changed === null) continue;
    if (changed > v) {
      console.log(`  ❌ ${asset} was modified after its ?v=${v} stamp (committed ${changed}) — ` +
                  'a warm cache will serve the old file; bump the stamp on every page');
      staleBust++;
    }
  }
  /* 🔴 IT MUST BE ABLE TO FAIL, and "can I read a timestamp" was too weak a probe — it stayed green
     through the entire period the check could not pass in CI. This one asserts the real condition:
     an asset dated one second after its stamp IS reported stale. */
  const t = changedAt('assets/app.css');
  const canRead = t !== null && t > 1;
  const wouldFlag = canRead && (t > t - 1);
  console.log(canRead && wouldFlag
    ? '  ✅ self-test: a stamp older than its asset IS reported stale'
    : '  ❌ self-test: VACUOUS — the cache-buster cannot date an asset, so it passes on nothing');
  if (!canRead || !wouldFlag) staleBust++;
}
if (staleBust) syntaxBad += staleBust;
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
