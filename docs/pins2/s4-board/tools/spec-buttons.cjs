// Which board buttons the spec page already draws: every button's classes on spec.html, against board-dom.json's selectors (a member already drawn
// elsewhere on the page is not drawn twice). Usage: node spec-buttons.cjs
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sb-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 1400 }); await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 });
  const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/pins2/s4-board/spec-img/board-dom.json'), 'utf8')).buttons;
  const hits = await p.evaluate((sels) => sels.map((s) => { const n = document.querySelectorAll(s).length; const secs = [...new Set([...document.querySelectorAll(s)].map((e) => (e.closest('section[id]') || {}).id))]; return [s, n, secs.join(',')]; }), Object.keys(D));
  for (const [s, n, secs] of hits) if (n) console.log('ON PAGE', s.padEnd(36), n, secs); console.log('of', hits.length, 'board families,', hits.filter((h) => h[1]).length, 'already on the spec page'); await b.close();
})().catch((e) => { console.error('spec-buttons FAIL', e.message); process.exit(1); });
