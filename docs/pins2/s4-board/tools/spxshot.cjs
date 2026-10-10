// The C1 button-looks container (b4/specimen.js) as he sees it: builder.html with his saved state at 1282×888, double density, scrolled to
// #c1-looks, shot one viewport at a time down the section. Output: spxshot/<n>.png and the section's height and copy count.
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const OUT = path.join(__dirname, 'spxshot'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = process.env.STATE || path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spx-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const st = fs.readFileSync(STATE, 'utf8'); await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); } catch (e) {} }, st);
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => document.getElementById('c1-looks'), { timeout: 60000 }); await p.evaluate(() => document.fonts.ready); await sleep(800);
  const info = await p.evaluate(() => { const s = document.getElementById('c1-looks'); s.scrollIntoView({ block: 'start', behavior: 'instant' }); const r = s.getBoundingClientRect();
    const cells = [...s.querySelectorAll('.spx-live')]; const empty = cells.filter((c) => { const b = c.querySelector('button, [role=button]'); if (!b) return true; const q = b.getBoundingClientRect(); return q.width < 2 || q.height < 2; }).length;
    return { h: Math.round(r.height), cells: cells.length, emptyOrHidden: empty }; });
  let n = 0; for (let y = 0; y < info.h && n < 8; y += 820, n++) { await p.evaluate((y) => { const s = document.getElementById('c1-looks'); s.scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy({ top: y, behavior: 'instant' }); }, y); await sleep(250); await p.screenshot({ path: path.join(OUT, `${n}.png`) }); }
  console.log(JSON.stringify({ ...info, shots: n, errs: errs.slice(0, 5) })); await b.close();
})().catch((e) => { console.error('spxshot FAIL', e.message); process.exit(1); });
