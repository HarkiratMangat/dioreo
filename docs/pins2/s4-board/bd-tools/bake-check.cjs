// Board 4: Builder-2 · bake-check.cjs — the quick proof of a bake (Stage 3, 2026-10-05 15:20 EDT): every element on the board at rest, 16 sizing and
// spacing properties, computed in the builder view (Builder-2's board + the builder's own sheet, saved by bake.cjs as builder-sheet.css) and in the
// baked Final. Any difference is a value the bake did not carry, or carried somewhere it changes something else. Exit 1 on any difference.
// Proven able to fail: with one of his tokens (filter chips' height) deleted from Final, it named the 16 chips and the rows they hold.
// The full proof is fidelity.cjs (pixels, every walked view, hover/focus/pressed):
//   node bd-tools/fidelity.cjs --ref local/pins2/s4/builder-2 --cand <final> --css-ref "$(cat <final>/builder-sheet.css)" --sizes 1282x888
// Usage:  node local/pins2/s4/builder-2/bd-tools/bake-check.cjs <final dir>
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = '/Applications/Claude Code/Diors-Builds';
const L = require('./fidlib.cjs');
const CAND = process.argv[2] || 'local/pins2/s4/work/bake/final-keep'; const SHEET = fs.readFileSync(path.join(ROOT, CAND, 'builder-sheet.css'), 'utf8');
const PROPS = ['width', 'height', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-left', 'margin-top', 'column-gap', 'row-gap', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'border-top-left-radius', 'text-transform'];
(async () => { const { server, base } = await L.serve(); const b = await L.launch(1282, 888);
  try { const R = await L.openKit(b, base, 'local/pins2/s4/builder-2', 1282, 888, { css: SHEET }); const C = await L.openKit(b, base, CAND, 1282, 888);
    const grab = (K) => K.p.evaluate((PROPS) => { const g = document.getElementById('board'); return [...g.querySelectorAll('*')].map((e, i) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return [i, e.tagName.toLowerCase() + '.' + [...e.classList].join('.'), PROPS.map((p) => c.getPropertyValue(p)).join('|'), [r.width, r.height].map((x) => x.toFixed(1)).join('x')]; }); }, PROPS);
    const a = await grab(R), z = await grab(C); let n = 0; const seen = new Map();
    for (let i = 0; i < Math.min(a.length, z.length); i++) { if (a[i][2] === z[i][2]) continue; const pa = a[i][2].split('|'), pz = z[i][2].split('|'); const d = PROPS.map((p, k) => (pa[k] !== pz[k] ? `${p} ${pa[k]}→${pz[k]}` : null)).filter(Boolean).join(', '); const key = a[i][1] + ' ' + d; if (seen.has(key)) { seen.set(key, seen.get(key) + 1); continue; } seen.set(key, 1); n++; }
    console.log('elements', a.length, z.length, 'distinct differences', seen.size); for (const [k, c] of [...seen].slice(0, 40)) console.log(c, k.slice(0, 230)); process.exitCode = seen.size ? 1 : 0;
  } finally { await b.close(); server.close(); } })().catch((e) => { console.error(e); process.exit(1); });
