// Board 4: Builder-2 · cascade.cjs — does b4/components.css actually win? (Session 4, 2026-10-06 17:09 EDT)
// Harkirat, 17:01 and 17:02 EDT: the image chip drew 28 × 32 and the Collapse button opened with no gap, though components.css said 32 × 32 and 6.
// Both times a kit rule of higher specificity (`.b4 :is(#_, .wg-r) …`, `html[data-b3-a1=fixed] …`) out-ranked the components rule, and nothing
// looked: the spec reads values at rest, and consolidate deletes only what it can prove is covered, never what still out-ranks.
// Every element a components.css selector reaches (up to 4 per selector) is put in that selector's state (:hover, :focus-visible… forced through
// the DevTools protocol) and read; then the whole of components.css (rules outside @media) is laid over the page again with four ids added to every
// selector, so it keeps its own order and specificity among itself but out-ranks every kit rule, and the element is read again. Whatever changes
// is a declaration components.css loses on the real page. (A first version laid each rule over alone and reported the rules that components.css
// itself overrides on purpose, such as .mtools under .mtools.b3-hi-tools, as losses.)
// Transitions and animations are switched off for the read, so a lost `transition` is not seen.
// Usage: node local/pins2/s4/builder-2/bd-tools/cascade.cjs   (repo-static on :8900, local/pins2/s4/work/lead/serve8900.py)   exit 1 when anything loses
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../../..'); const KIT = path.resolve(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core')); const CSSX = require(path.join(ROOT, 'local/pins2/s4/work/lead/el-css.cjs'));
const BASE = process.env.BD_BASE || 'http://127.0.0.1:8900'; const W = +(process.env.BD_W || 1282), Hh = +(process.env.BD_H || 888);
const split = (t) => { const out = []; let d = 0, cur = '', q = null; for (const ch of t) { if (q) { cur += ch; if (ch === q) q = null; continue; } if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; } if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
const PSEUDO = { hover: 'hover', 'focus-visible': 'focus-visible', 'focus-within': 'focus-within', focus: 'focus', active: 'active' };
function shape(alt) { const pm = alt.match(/::?(before|after|placeholder)\s*$/); const pe = pm ? '::' + pm[1] : ''; const sel = pm ? alt.slice(0, pm.index) : alt;
  const states = []; const base = sel.replace(/:(hover|focus-visible|focus-within|focus|active)(?![\w-])/g, (m, s) => { states.push(PSEUDO[s]); return ''; }); return { pe, states, base: base.trim() || '*', sel }; }
(async () => {
  const src = fs.readFileSync(path.join(KIT, 'b4/components.css'), 'utf8'); const keep = CSSX.stripKeep(src); const rules = [];
  for (const n of CSSX.parse(keep)) { if (n.kind !== 'rule' || n.nested) continue; const body = src.slice(keep.indexOf('{', n.at) + 1, keep.indexOf('{', n.at) + 1 + n.body.length).trim(); if (!body) continue; rules.push({ sel: n.sel.trim(), body, line: keep.slice(0, n.at).split('\n').length }); }
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bd-cascade-')) });
  const p = await b.newPage(); await p.setViewport({ width: W, height: Hh }); await p.goto(`${BASE}/${path.relative(ROOT, KIT)}/board4.html`, { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForSelector('#c-manifest .wg-r', { timeout: 60000 });
  await p.evaluate(async () => { await document.fonts.ready; const z = document.createElement('style'); z.textContent = '*,*::before,*::after{transition:none !important;animation:none !important}'; document.head.appendChild(z); });
  const cdp = await p.target().createCDPSession(); await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); const doc = await cdp.send('DOM.getDocument', { depth: 0 });
  const BOOST = ':not(#bd-cc-none)'.repeat(4);
  const boosted = rules.map((r) => split(r.sel).map((alt) => { const pm = alt.match(/::?(before|after|placeholder)\s*$/); return pm ? alt.slice(0, pm.index) + BOOST + alt.slice(pm.index) : alt + BOOST; }).join(',') + '{' + r.body + '}').join('\n');
  await p.evaluate((css) => { const t = document.createElement('style'); t.id = 'bd-cc-over'; t.textContent = css; document.head.appendChild(t); t.sheet.disabled = true; }, boosted);
  const seen = new Map(); let tried = 0;
  for (const r of rules) for (const alt of split(r.sel)) { const s = shape(alt);
    const n = await p.evaluate((base) => { let els = []; try { els = [...document.querySelectorAll(base)]; } catch (e) { return -1; } const vis = els.filter((e) => e.getClientRects().length); els = (vis.length ? vis : els).slice(0, 4); els.forEach((e, i) => e.setAttribute('data-cc', i)); return els.length; }, s.base);
    for (let i = 0; i < n; i++) { const q = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: `[data-cc="${i}"]` }); if (!q.nodeId) continue;
      if (s.states.length) await cdp.send('CSS.forcePseudoState', { nodeId: q.nodeId, forcedPseudoClasses: s.states });
      const res = await p.evaluate((i, pe, sel) => { const e = document.querySelector(`[data-cc="${i}"]`); let m = false; try { m = e.matches(sel); } catch (x) {} if (!m) return null; const t = document.getElementById('bd-cc-over');
        const snap = () => { const cs = getComputedStyle(e, pe || null); const o = {}; for (let k = 0; k < cs.length; k++) o[cs[k]] = cs.getPropertyValue(cs[k]); return o; };
        const a = snap(); t.sheet.disabled = false; const z = snap(); t.sheet.disabled = true;
        const diff = Object.keys(z).filter((k) => a[k] !== z[k] && !/^(block-size|inline-size|perspective-origin|transform-origin|width|height)$/.test(k) || (a[k] !== z[k] && /^(width|height)$/.test(k) && !/auto/.test(a[k]))).map((k) => `${k}: ${a[k]} → ${z[k]}`);
        const name = e.tagName.toLowerCase() + [...e.classList].slice(0, 3).map((c) => '.' + c).join(''); return { name, diff }; }, i, s.pe, s.sel);
      if (s.states.length) await cdp.send('CSS.forcePseudoState', { nodeId: q.nodeId, forcedPseudoClasses: [] });
      if (!res) continue; tried++; if (!res.diff.length) continue; const key = res.name + s.pe + (s.states.length ? ':' + s.states.join(':') : '') + '|' + res.diff.join('|'); if (!seen.has(key)) seen.set(key, `components.css:${r.line} ${alt} on ${res.name}${s.pe}${s.states.length ? ' (' + s.states.join(', ') + ')' : ''}: ${res.diff.slice(0, 5).join(' · ')}`); }
    await p.evaluate(() => document.querySelectorAll('[data-cc]').forEach((e) => e.removeAttribute('data-cc'))); }
  const lost = [...seen.values()];
  await b.close();
  console.log(`${rules.length} rules, ${tried} element-and-state reads at ${W}×${Hh}: ${lost.length} where components.css loses`); if (lost.length) console.log(lost.join('\n'));
  process.exit(lost.length ? 1 : 0);
})().catch((e) => { console.error('cascade FAIL', e.stack || e.message); process.exit(2); });
