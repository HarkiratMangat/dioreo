// Session 4 · each option reproduces its own surface (FINAL-DIRECTION.md, C10). On the board every surface is drawn as Board 4 draws it
// (the before), and a pick restyles every surface (the after). Picking the option a surface uses today must therefore change nothing on
// that surface. Any element whose box or computed style moves is a wrong value in the fork's data — the kind of error Harkirat found by
// eye on 2026-10-02 15:37 EDT ("the actual chips you drew aren't even correctly designed").
// Run:  node local/pins2/s4/work/lead/home-check.cjs        → one line per surface, the differing properties, exit 1 on any difference
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const LIVE = path.join(ROOT, 'local/pins2/s4/board/live');
const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-top-width', 'border-left-width', 'border-top-left-radius', 'box-shadow', 'outline-color', 'outline-width', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'text-transform', 'text-align', 'transform', 'opacity', 'padding-top', 'padding-left', 'padding-right', 'margin-left', 'margin-top', 'column-gap', 'row-gap', 'grid-template-columns', 'justify-content', 'align-items'];
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'hc-')), args: ['--no-first-run'] });
  const p = await b.newPage(); await p.setViewport({ width: 1400, height: 1000 }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.setContent('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Big+Shoulders+Display:wght@500;600;700&display=swap"><div id="out"></div>', { waitUntil: 'networkidle0' });
  for (const f of ['samples.js', 'sample.js', 'core.js']) await p.addScriptTag({ content: fs.readFileSync(path.join(LIVE, f), 'utf8') });
  await p.evaluate(() => document.fonts.ready);
  const res = await p.evaluate((PROPS) => {
    const out = []; const box = document.getElementById('out');
    const norm = (v) => { let x = v.replace(/(, none)+$/, '').split(/,(?![^(]*\))/).map((q) => q.trim()).filter((q) => !/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px( inset)?$/.test(q)).join(', '); return x === '' ? 'none' : x; }; const pse = (e, p) => { const c = getComputedStyle(e, p); return c.content === 'none' ? [] : PROPS.map((k) => norm(c.getPropertyValue(k))); }; const snap = (h) => { const r = h.shadowRoot.querySelector('[data-fz~="root"]'); const H = h.getBoundingClientRect(); return [h.shadowRoot.querySelector('[data-fz-surf]'), r, ...r.querySelectorAll('*')].map((e) => { const q = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { tag: e.tagName.toLowerCase() + '.' + String(e.className || '').split(' ')[0], b: [q.left - H.left, q.top - H.top, q.width, q.height], s: [...PROPS.map((k) => norm(cs.getPropertyValue(k))), ...pse(e, '::before'), ...pse(e, '::after')] }; }); };
    for (const F of Object.values(BY)) { if (!F.presets || !F.presets.length || F.agreed || F.ruled) continue;
      for (const c of F.ctx || []) { if (!c.fz || !FZS.has(c.fz) || (!c.today && !c.todayV)) continue;
        const d0 = document.createElement('div'), d1 = document.createElement('div'); box.append(d0, d1);
        const h0 = FZS.mount(d0, c.fz, ''), h1 = FZS.mount(d1, c.fz, FZS.css(c.fz, F.apply(todayV(F, c)).s)); const A = snap(h0), B = snap(h1);
        const diffs = {}; const ex = []; let n = 0;
        A.forEach((x, i) => { const y = B[i]; if (!y) return; let bad = false; const empty = (q) => q.b[2] * q.b[3] === 0; if (empty(x) && empty(y)) return; if (empty(x) !== empty(y)) { diffs['shown'] = (diffs['shown'] || 0) + 1; if (ex.length < 3) ex.push(`${x.tag} ${empty(x) ? 'appears' : 'disappears'}`); n++; return; }
          x.b.forEach((v, k) => { if (Math.abs(v - y.b[k]) > 0.5) { bad = true; diffs['box'] = (diffs['box'] || 0) + 1; if (ex.length < 3) ex.push(`${x.tag} box ${['x', 'y', 'w', 'h'][k]} ${v.toFixed(1)}→${y.b[k].toFixed(1)}`); } });
          x.s.forEach((v, k) => { if (v !== y.s[k]) { const nv = v.match(/-?[\d.]+/g), ny = y.s[k].match(/-?[\d.]+/g); if (nv && ny && nv.length === ny.length && v.replace(/-?[\d.]+/g, '#') === y.s[k].replace(/-?[\d.]+/g, '#') && nv.every((q, j) => Math.abs(+q - +ny[j]) < (/color|image|shadow/.test(PROPS[k % PROPS.length]) ? 0.004 : 0.05))) return; bad = true; const pn = PROPS[k % PROPS.length] + (k >= PROPS.length ? (k >= 2 * PROPS.length ? '::after' : '::before') : ''); diffs[pn] = (diffs[pn] || 0) + 1; if (ex.length < 3) ex.push(`${x.tag} ${pn}: ${v.slice(0, 90)} → ${y.s[k].slice(0, 90)}`); } });
          if (bad) n++; });
        out.push({ fam: F.id, where: c.where, today: c.today || 'todayV', n, of: A.length, props: Object.entries(diffs).sort((a, q) => q[1] - a[1]).map(([k, v]) => k + '×' + v).join(' '), ex });
        d0.remove(); d1.remove(); } }
    return out; }, PROPS);
  let bad = 0; for (const r of res) { if (r.n) bad++; console.log(`${r.n ? 'DIFFERS' : 'same   '} ${r.fam} · ${r.where} (today ${r.today}): ${r.n}/${r.of} elements${r.n ? ' — ' + r.props + ' · ' + r.ex.join(' | ') : ''}`); }
  console.log(`${res.length} surfaces · ${bad} where the surface's own option changes it${errs.length ? ' · page errors: ' + errs.join(' | ') : ''}`);
  await b.close(); process.exit(bad || errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
