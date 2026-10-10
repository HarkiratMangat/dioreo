// Board 4: Builder-2 · derived.cjs — every size or space on the board whose value is computed from another knob (Session 4, Adjuster A1,
// 2026-10-04 21:43 EDT; round 2's first class, "every setting is the quantity a person sees", the lead after Harkirat's pick 5). From bd/rules.js
// (every kit rule from its source), each declaration of a length property whose value does arithmetic on a var() or folds a correction into one
// (calc(var(--x) - 2px), var(--a) + var(--b), a var() with a fallback inside calc) is a candidate; it is kept only if its rule matches an element
// in some walk view of some gate (state and pseudo-element parts stripped, as audit.cjs), and its computed value there is read.
// Usage: node bd-tools/derived.cjs [--kit <dir>] [--size 1282x888] [--label name]
const path = require('path'); const fs = require('fs'); const vm = require('vm');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const KIT = A.kit || 'local/pins2/s4/builder-2'; const [W, H] = (A.size || '1282x888').split('x').map(Number); const LABEL = A.label || 'derived';
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, KIT, 'bd/rules.js'), 'utf8'), ctx); const R = ctx.window.BD_RULES;
const LEN = /^(--[\w-]+|(min-|max-)?(width|height)|padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|(padding|margin|inset)-[\w-]+|border-radius|grid-template-columns|grid-template-rows|flex-basis|font|font-size|line-height|translate|transform)$/;
const DERIVED = (v) => /var\(/.test(v) && (/calc\(|round\(|min\(|max\(|clamp\(/.test(v)) && /[+\-*/]|,\s*-?\d/.test(v.replace(/var\(--[\w-]+/g, '').replace(/-?\d+(\.\d+)?(px|em|ch|rem|%)?/g, (m) => m));
const cands = [];
for (const r of R.rules) for (const [p, v] of r.d) { if (!LEN.test(p) || !DERIVED(v)) continue; if (/color|mix|gradient|rgb|#|oklch|deg|ms\b|ease/.test(v)) continue; cands.push({ at: `${R.files[r.f].split('/builder-2/')[1]}:${r.l}`, sel: r.s, prop: p, value: v }); }
const strip = (q) => q.replace(/::?(before|after|placeholder|marker|selection|backdrop|first-line|first-letter|-webkit-[\w-]+)(\([^)]*\))?/g, '').replace(/:(hover|focus-visible|focus-within|focus|active|visited|checked|disabled|enabled|placeholder-shown|target|indeterminate)/g, '').replace(/\(\s*\)/g, '()');
(async () => {
  const { server, base } = await L.serve(); const b = await L.launch(W, H); const hit = new Map();
  try {
    const K = await L.openKit(b, base, KIT, W, H);
    const probe = async (view) => { const res = await K.p.evaluate((sels) => sels.map((s) => { try { const e = [...document.querySelectorAll(s)].find((x) => x.closest('section[id^="c-"]') && x.getBoundingClientRect().width > 0); return e ? (e.closest('section[id^="c-"]').id) : null; } catch (x) { return null; } }), cands.map((c) => strip(c.sel) || '*'));
      res.forEach((g, i) => { if (g) { const k = cands[i].at + cands[i].prop; if (!hit.has(k)) hit.set(k, { ...cands[i], gate: g, view }); } }); };
    for (const [gid, id] of L.GATES) { await K.load(); await L.scrollTo(K, id); await probe(`${gid} rest`); const acts = await L.actions(K.p, id); for (const [n, [kind, i, label]] of acts.entries()) { await L.act(K, id, kind, i); await probe(`${gid} ${label}`); } }
  } finally { await b.close(); server.close(); }
  const list = [...hit.values()].sort((x, y) => x.at.localeCompare(y.at)); const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/derived'); fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `${LABEL}.json`), JSON.stringify({ kit: KIT, candidates: cands.length, rendered: list }, null, 1));
  console.log(`candidates ${cands.length} · rendered on the board ${list.length}`); for (const c of list) console.log(`${c.at.padEnd(22)} ${c.gate.padEnd(13)} ${c.prop}: ${c.value.slice(0, 80)}   [${c.sel.slice(0, 60)}]`); process.exit(0);
})().catch((e) => { console.error('derived failed:', e && e.stack || e); process.exit(2); });
