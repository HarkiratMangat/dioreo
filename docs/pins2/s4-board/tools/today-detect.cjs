// Session 4 · which version does each newly captured place wear today? For every place in sweep/fill.json, Board 4 bare is compared with
// Board 4 + each version's rules, element by element (home-check's comparison); the version that changes nothing is the place's today, and
// a place no version reproduces wears a mix. Writes `today` back into sweep/fill.json.  Run: node local/pins2/s4/work/lead/today-detect.cjs
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const LIVE = path.join(ROOT, 'local/pins2/s4/board/live'); const FILL = path.join(__dirname, 'sweep', 'fill.json');
const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-top-width', 'border-top-left-radius', 'box-shadow', 'outline-color', 'outline-width', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'text-transform', 'text-align', 'transform', 'opacity', 'padding-top', 'padding-left', 'padding-right', 'margin-left', 'margin-top', 'margin-right', 'column-gap', 'row-gap', 'grid-template-columns', 'justify-content', 'align-items', 'min-width', 'display'];
(async () => {
  const fill = JSON.parse(fs.readFileSync(FILL, 'utf8'));
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'td-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1400, height: 1000 });
  await p.setContent('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Big+Shoulders+Display:wght@500;600;700&display=swap"><div id="out"></div>', { waitUntil: 'networkidle0' });
  for (const f of ['samples.js', 'sample.js', 'core.js']) await p.addScriptTag({ content: fs.readFileSync(path.join(LIVE, f), 'utf8') });
  await p.evaluate(() => document.fonts.ready);
  const res = await p.evaluate((fill, PROPS) => {
    const norm = (v) => { const x = v.replace(/(, none)+$/, '').split(/,(?![^(]*\))/).map((q) => q.trim()).filter((q) => !/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px( inset)?$/.test(q)).join(', '); return x === '' ? 'none' : x; };
    const snap = (h) => { const r = h.shadowRoot.querySelector('[data-fz~="root"]'); const H = h.getBoundingClientRect(); return [h.shadowRoot.querySelector('[data-fz-surf]'), r, ...r.querySelectorAll('*')].map((e) => { const q = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { b: [q.left - H.left, q.top - H.top, q.width, q.height], s: PROPS.map((k) => norm(cs.getPropertyValue(k))) }; }); };
    const same = (A, B) => A.every((x, i) => { const y = B[i]; if (!y) return true; if (x.b[2] * x.b[3] === 0 && y.b[2] * y.b[3] === 0) return true; if (x.b.some((v, k) => Math.abs(v - y.b[k]) > 0.5)) return false;
      return x.s.every((v, k) => { if (v === y.s[k]) return true; const nv = v.match(/-?[\d.]+/g), ny = y.s[k].match(/-?[\d.]+/g); return !!(nv && ny && nv.length === ny.length && v.replace(/-?[\d.]+/g, '#') === y.s[k].replace(/-?[\d.]+/g, '#') && nv.every((q, j) => Math.abs(+q - +ny[j]) < (/color|image|shadow/.test(PROPS[k]) ? 0.004 : 0.05))); }); });
    const box = document.getElementById('out');
    return fill.map((f) => { const F = BY[f.fam]; if (!F || !FZS.has(f.fz)) return { ...f, today: null, why: 'no sample' };
      const d0 = document.createElement('div'); box.appendChild(d0); const A = snap(FZS.mount(d0, f.fz, '')); let today = null;
      const near = []; for (const pr of F.presets) { const d1 = document.createElement('div'); box.appendChild(d1); const B = snap(FZS.mount(d1, f.fz, FZS.css(f.fz, F.apply(pr.v).s))); const ex = []; A.forEach((x, i) => { if (ex.length < 3 && B[i] && !same([x], [B[i]])) { const k = x.s.findIndex((v, j) => v !== B[i].s[j]); ex.push(k < 0 ? 'box ' + x.b.map(Math.round) + ' → ' + B[i].b.map(Math.round) : PROPS[k] + ': ' + x.s[k].slice(0, 50) + ' → ' + B[i].s[k].slice(0, 50)); } }); d1.remove(); if (same(A, B)) { today = pr.id; break; } near.push(pr.id + ' [' + ex.join(' | ') + ']'); }
      if (!today) f.near = near;
      d0.remove(); return { ...f, today }; }); }, fill, PROPS);
  fs.writeFileSync(FILL, JSON.stringify(res, null, 1)); res.forEach((f) => console.log(`${f.fam}: ${f.where} → ${f.today || 'a mix (no version reproduces it)'}`));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
