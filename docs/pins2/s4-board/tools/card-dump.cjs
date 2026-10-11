// One-off probe (2026-10-10): every "On the board" card's name, selector and words, and every icon's drawn size and stroke weight across the spec board,
// for his twins notes ("does every icon scale the same way?"). Usage: node card-dump.cjs [section]
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const URL = 'http://127.0.0.1:8900/docs/pins2/s4-board/spec.html'; const SEC = process.argv[2] || 'onboard';
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'cd-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1000 }); await p.setCacheEnabled(false);
  await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(4000);
  await p.evaluate(() => dispatchEvent(new Event('spec-show-copies'))); await sleep(1500);
  const out = await p.evaluate((SEC) => {
    const sec = document.getElementById(SEC); const cards = [...(sec ? sec.querySelectorAll('.fm.bm') : [])].map((c) => { const t = c.querySelector('[data-bsel]'); const el = t && (t.firstElementChild || t); const r = el ? el.getBoundingClientRect() : {};
      return { name: c.dataset.bname, sel: t && t.dataset.bsel, words: (el ? el.textContent : '').replace(/\s+/g, ' ').trim().slice(0, 60), h: Math.round(r.height), w: Math.round(r.width), head: c.querySelector('.fm-h') ? c.querySelector('.fm-h').textContent.replace(/\s+/g, ' ').trim().slice(0, 120) : '' }; });
    /* every visible icon across the board: box, stroke width, the size row its control sits on */
    const ic = [...document.querySelectorAll('svg')].filter((s) => s.getBoundingClientRect().width > 0 && s.closest('button, [role=button], .chip, .g-fact')).map((s) => { const r = s.getBoundingClientRect(); const btn = s.closest('button, [role=button], .chip, .g-fact'); const br = btn.getBoundingClientRect(); const u = s.querySelector('use'); const sym = u ? document.querySelector((u.getAttribute('href') || u.getAttribute('xlink:href') || '').replace(/^.*#/, '#') || 'x') : null;
      const pth = (sym || s).querySelector('path, line, circle, polyline, rect');
      /* a sprite symbol's own stroke-width beats CSS on its <use> host (caveat 71060), so read it off the symbol first */
      const sw = parseFloat((sym && (sym.getAttribute('stroke-width') || (pth && pth.getAttribute('stroke-width')))) || getComputedStyle(pth || s).strokeWidth) || 0; const src = sym ? 'sprite' : 'inline'; const vb = (s.getAttribute('viewBox') || '0 0 24 24').split(/\s+/).map(Number); const scale = r.width / (vb[2] || 24);
      return { src, vb: vb[2], sec: (s.closest('section') || {}).id || '?', box: Math.round(r.width * 10) / 10, sw, inkPx: Math.round(sw * scale * 100) / 100, btnH: Math.round(br.height) }; });
    return { cards, ic };
  }, SEC);
  for (const c of out.cards) console.log([c.h + 'x' + c.w, c.name, c.sel, '|', c.words, '|', c.head].join(' '));
  const g = {}; for (const i of out.ic) { const k = `box ${i.box} · ${i.src} vb${i.vb} stroke ${i.sw} · ink ${i.inkPx}px · on ${i.btnH}`; g[k] = g[k] || new Set(); g[k].add(i.sec); }
  console.log('--- icons'); for (const [k, s] of Object.entries(g).sort()) console.log(k, '·', [...s].join(','));
  await b.close();
})();
