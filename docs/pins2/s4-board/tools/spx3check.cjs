// V23's C1 buttons container (each button alone, b4/specimen.js), checked as he will see it: builder.html with his saved state at 1282×888.
// Reports page errors, buttons with no live element, cards that say "not drawn" or "not measured", C1 unchanged, and shoots each section.
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const OUT = path.join(__dirname, 'spx3'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spx3-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) errs.push(`${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`); });
  await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(STATE, 'utf8'));
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__sxReady, { timeout: 60000 }).catch(() => errs.push('container never ready')); await sleep(1500);
  await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
  const r = await p.evaluate(() => { const X = window.__sx; const box = document.getElementById('c1-buttons'); const g = document.getElementById('c-manifest');
    const found = X.TYPES.map((T) => { const root = X.rootOf(T.n); const el = root && X.find(root, T).find((e) => e.getClientRects().length); return el ? null : `${T.n} ${T.name}`; }).filter(Boolean);
    return { types: X.TYPES.length, missing: found, notDrawn: [...box.querySelectorAll('dd')].filter((d) => /not drawn/.test(d.textContent)).length, notMeasured: [...box.querySelectorAll('dd')].filter((d) => /not measured/.test(d.textContent)).length,
      manifests: box.querySelectorAll('.wg-wrap').length, h: Math.round(box.getBoundingClientRect().height), c1Rows: g.querySelectorAll('.wg-r').length }; });
  const secs = await p.evaluate(() => document.querySelectorAll('#c1-buttons .sx-sec').length);
  for (let i = 0; i < secs; i++) { const parts = await p.evaluate((i) => { const s = document.querySelectorAll('#c1-buttons .sx-sec')[i]; s.scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy({ top: -60, behavior: 'instant' }); return Math.ceil(s.getBoundingClientRect().height / 820); }, i);
    for (let k = 0; k < Math.min(parts, 4); k++) { if (k) await p.evaluate(() => window.scrollBy({ top: 820, behavior: 'instant' })); await sleep(300); await p.screenshot({ path: path.join(OUT, `s${i}-${k}.png`) }); } }
  console.log(JSON.stringify({ ...r, errs: errs.slice(0, 6) })); await b.close();
})().catch((e) => { console.error('spx3check FAIL', e.message); process.exit(1); });
