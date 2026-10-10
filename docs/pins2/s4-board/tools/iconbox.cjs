// His saved icon sizes before and after V19 (2026-10-06 16:36 EDT): from 2026-10-05 14:01 EDT a saved size was the icon's ink; from V19 the same
// number is the Lucide box. Each affected icon's markup is read from Builder-2's Board 4 (a <use> resolved to its symbol) with its button's colour,
// then drawn on a still page at the box it had and the box it gets, three times his window's density. Shooting the board itself failed: its gates
// are stacked, its sticky toolbar covers the list head, and it re-renders after load, so crops caught another layer or an empty page.
// Output: iconbox/sheet.png.
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const OUT = path.join(__dirname, 'iconbox');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const T = [ // variant, what it is, selector of the button, box it drew (its ink-size reading), box it draws now
  ['B-13', 'sort, list head', 'button.wg-sort', 20.6, 12], ['B-13', 'sort, column', 'button.sortbtn', 16, 12], ['B-14', 'quiet button', 'button.b3-btn2.quiet', 24, 14],
  ['B-14', 'New build', 'button.pill.lead.madd', 21, 14], ['B-04', 'delete', 'button.rmv.wg-ib.wg-del', 15.3, 14], ['B-06', 'fold', 'button.b3-xf-ib.b4-fold', 15.3, 14]];
const sleep = (ms) => new Promise((z) => setTimeout(z, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'iconbox-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888 });
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/board4.html', { waitUntil: 'domcontentloaded', timeout: 90000 }); await sleep(12000);
  let got = null; for (let t = 0; t < 10 && !(got && got.every((g) => g.svg)); t++) { try { got = await p.evaluate((T) => {
    const ground = getComputedStyle(document.querySelector('#c-manifest .wg-r') || document.body).backgroundColor;
    return T.map(([vid, label, sel]) => { const el = [...document.querySelectorAll(sel)].find((e) => e.querySelector('svg')); if (!el) return { vid, label, svg: null };
      const sv = el.querySelector('svg').cloneNode(true); for (const u of [...sv.querySelectorAll('use')]) { const id = (u.getAttribute('href') || u.getAttribute('xlink:href') || '').replace(/^#/, ''); const sym = id && document.getElementById(id); if (sym) { if (sym.getAttribute('viewBox')) sv.setAttribute('viewBox', sym.getAttribute('viewBox')); for (const k of sym.children) u.before(k.cloneNode(true)); u.remove(); } }
      const st = getComputedStyle(el.querySelector('svg')); for (const a of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']) if (!sv.getAttribute(a)) sv.setAttribute(a, st.getPropertyValue(a));
      sv.removeAttribute('style'); sv.removeAttribute('class'); return { vid, label, svg: sv.outerHTML, col: getComputedStyle(el).color, ground }; }); }, T); } catch (e) { got = null; } if (!(got && got.every((g) => g.svg))) await sleep(2000); }
  if (!got || !got.every((g) => g.svg)) throw new Error('icons not read: ' + JSON.stringify((got || []).map((g) => g.label + ':' + !!g.svg)));
  const row = (g, was, now) => [was, now].map((bx) => `<div class="c" style="background:${g.ground};color:${g.col}">${g.svg.replace('<svg', `<svg width="${bx}" height="${bx}" style="width:${bx}px;height:${bx}px;flex:none"`)}<span>${bx}px · line ${(2 * bx / 24).toFixed(2)}</span></div>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#0f1418;font:500 13px/1.2 system-ui,sans-serif;color:#cfd6dc}#g{display:inline-grid;grid-template-columns:auto 160px 160px;gap:10px 24px;align-items:center;padding:18px 24px}.c{display:flex;align-items:center;gap:10px;height:44px;padding:0 12px;border-radius:8px}.c span{font:500 11px/1 system-ui;color:#8a96a0}</style><div id="g"><b>Variant · icon</b><b>before (ink size)</b><b>V19 (Lucide box)</b>${got.map((g, i) => `<div>${g.vid} · ${g.label}</div>` + row(g, T[i][3], T[i][4])).join('')}</div>`;
  const q = await b.newPage(); await q.setViewport({ width: 900, height: 700, deviceScaleFactor: 3 }); await q.setContent(html); const r = await q.evaluate(() => { const e = document.getElementById('g').getBoundingClientRect(); return { x: 0, y: 0, width: Math.ceil(e.width), height: Math.ceil(e.height) }; });
  const f = path.join(OUT, 'sheet.png'); await q.screenshot({ path: f, clip: r }); console.log('sheet', f, r.width + 'x' + r.height);
  await b.close();
})().catch((e) => { console.error('iconbox FAIL', e.message); process.exit(1); });
