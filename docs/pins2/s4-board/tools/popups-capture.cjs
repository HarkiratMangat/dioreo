// Captures the spec board's Pop-ups section (spec-popups.js) headless: loads spec.html?capture=popups in standards mode as the published page is (a doctype),
// scrolls the section into view, waits for the board's own pop-ups to be opened and kept in turn, and writes spec-img/popups.json. The page only ever draws
// that file (2026-10-09 19:36 EDT, his 19:29 EDT screenshot of a stray card). Run again whenever the board's pop-ups change.
// Usage: node popups-capture.cjs
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const PAGE = path.join(ROOT, 'docs/pins2/s4-board/spec.html'); const URL = 'http://127.0.0.1:8900/docs/pins2/s4-board/spec.html?capture=popups';
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'pc-')) });
  const guard = setTimeout(() => { console.error('popups-capture: browser close hung'); process.exit(2); }, 120000);
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 }); await p.setCacheEnabled(false); await p.setRequestInterception(true);
  p.on('request', (r) => { if (r.url() === URL) r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset=utf8></head><body>' + fs.readFileSync(PAGE, 'utf8') + '</body></html>' }); else r.continue(); });
  await p.goto(URL, { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 });
  await p.evaluate(() => document.getElementById('popups').scrollIntoView({ block: 'start' }));
  await p.waitForFunction(() => window.__popkept, { timeout: 60000 }); const kept = await p.evaluate(() => window.__popkept);
  const miss = Object.entries(kept).filter(([, v]) => !v.html).map(([k]) => k);
  fs.writeFileSync(path.join(ROOT, 'docs/pins2/s4-board/spec-img/popups.json'), JSON.stringify({ captured: new Date().toISOString(), kept }, null, 1));
  console.log(`popups-capture: ${Object.keys(kept).length} kept${miss.length ? ', did not open: ' + miss.join(', ') : ''}`); clearTimeout(guard); await b.close();
})().catch((e) => { console.error('popups-capture FAIL', e.message); process.exit(1); });
