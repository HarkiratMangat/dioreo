// Read the captured samples (sweep/live.json) for the corner, dark-ground and icon families: which elements carry which radius and through
// which token, which elements are #04070A mixed into --sunk and at what strength, and every icon's size, stroke width and selector.
// Run: node local/pins2/s4/work/lead/kit-probe.cjs [sample ...]
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const LIVE = path.join(ROOT, 'local/pins2/s4/board/live'); const only = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'kp-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1400, height: 1000 });
  await p.setContent('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"><div id="out"></div>', { waitUntil: 'networkidle0' });
  for (const f of ['samples.js', 'sample.js']) await p.addScriptTag({ content: fs.readFileSync(path.join(LIVE, f), 'utf8') });
  console.log(await p.evaluate((only) => { const out = [];
    const nm = (e) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    const p255 = (c) => { const n = (c.match(/[\d.]+/g) || []).map(Number); return /^color\(srgb/.test(c) ? n.map((x, i) => (i < 3 ? x * 255 : x)) : n; };
    for (const id of Object.keys(KIT.samples).filter((k) => !only.length || only.includes(k))) { const d = document.createElement('div'); document.getElementById('out').appendChild(d); const h = FZS.mount(d, id, ''); const R = h.shadowRoot; const surf = R.querySelector('[data-fz-surf]');
      const rad = {}, mix = {}, ic = {};
      for (const e of [surf, ...surf.querySelectorAll('*')]) { const r = e.getBoundingClientRect(); if (!r.width) continue; const cs = getComputedStyle(e);
        const rr = parseFloat(cs.borderTopLeftRadius); if (rr > 0 && rr < Math.min(r.width, r.height) / 2 - .5 && r.width > 20) { const k = rr + 'px ' + nm(e); rad[k] = (rad[k] || 0) + 1; }
        const bg = p255(cs.backgroundColor); if (bg.length >= 3 && (bg.length === 3 || bg[3] === 1)) { const pr = (11 - bg[0]) / 7, pg = (15 - bg[1]) / 8, pb = (18 - bg[2]) / 8; if (pr > .02 && pr <= 1.01 && Math.abs(pr - pg) < .14 && Math.abs(pr - pb) < .14) { const k = Math.round((pr + pg + pb) / 3 * 100) + '% ' + nm(e); mix[k] = (mix[k] || 0) + 1; } }
        if (e.tagName.toLowerCase() === 'svg') { const inner = e.querySelector('path, line, polyline, circle, rect'); const sw = inner ? getComputedStyle(inner).strokeWidth : cs.strokeWidth; const k = Math.round(r.width) + 'px sw ' + sw + ' ' + nm(e) + ' < ' + nm(e.parentElement); ic[k] = (ic[k] || 0) + 1; } }
      const top = (o, n) => Object.entries(o).sort((a, c) => c[1] - a[1]).slice(0, n).map(([k, v]) => k + (v > 1 ? ' ×' + v : '')).join(' · ');
      out.push(`■ ${id} (${Math.round(surf.getBoundingClientRect().width)}px ${nm(surf)})\n  radius: ${top(rad, 12)}\n  #04070A: ${top(mix, 10) || '—'}\n  icons: ${top(ic, 10) || '—'}`); d.remove(); }
    return out.join('\n'); }, only));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
