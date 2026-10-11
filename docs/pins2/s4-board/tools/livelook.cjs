// Builder-2 as Harkirat sees it (2026-10-06 17:12 EDT): builder.html with his saved state (env STATE, a db fetch), at his window (env W×H, default
// 1282×888, double density), scrolled to the manifest's first weapon row, the whole window shot. Output: livelook/<W>.png
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const OUT = path.join(__dirname, 'livelook'); fs.mkdirSync(OUT, { recursive: true });
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const W = +(process.env.W || 1282), H = +(process.env.H || 888); const STATE = process.env.STATE || path.join(__dirname, 'state4/fetch-2026-10-06-1710/builder/state.json');
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'livelook-')) });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
  // SLOWFONTS=<ms>: web fonts arrive that much later, as on a slow first load, to see what the builder measures before they land
  if (process.env.SLOWFONTS) { await p.setRequestInterception(true); p.on('request', (r) => { if (/fonts\.(gstatic|googleapis)\.com|\.woff2?($|\?)/.test(r.url())) setTimeout(() => r.continue(), +process.env.SLOWFONTS); else r.continue(); }); }
  const st = fs.readFileSync(STATE, 'utf8'); await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); } catch (e) {} }, st);
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 90000 });
  for (let t = 0; t < 40; t++) { const n = await p.evaluate(() => { const f = document.querySelector('iframe'); const d = (f && f.contentDocument) || document; return d.querySelectorAll('#c-manifest .wg-h').length; }).catch(() => 0); if (n) break; await new Promise((r) => setTimeout(r, 1000)); }
  await new Promise((r) => setTimeout(r, 2500));
  const info = await p.evaluate((SEL) => { const f = document.querySelector('iframe'); const d = (f && f.contentDocument) || document; const h = d.querySelector('#c-manifest .wg-h'); (d.querySelector(SEL) || h).scrollIntoView({ block: 'center' }); const l = h.querySelector('.wg-line'); return { iframe: !!f, vw: (f ? f.contentWindow : window).innerWidth, kids: [...l.children].map((k) => { const q = k.getBoundingClientRect(); return k.tagName + ' ' + q.left.toFixed(1) + '-' + q.right.toFixed(1) + ' ml ' + getComputedStyle(k).marginLeft; }) }; }, process.env.SEL || '#c-manifest .wg-h');
  await new Promise((r) => setTimeout(r, 400)); const f = path.join(OUT, `${W}${process.env.SLOWFONTS ? '-slowfonts' : ''}${process.env.SEL ? '-' + process.env.SEL.replace(/[^a-z]+/gi, '-').replace(/^-|-$/g, '') : ''}.png`); await p.screenshot({ path: f }); console.log(f, JSON.stringify(info));
  await b.close();
})().catch((e) => { console.error('livelook FAIL', e.message); process.exit(1); });
