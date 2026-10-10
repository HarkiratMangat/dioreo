// One-off look inside the spec page: errors, and what a section actually rendered. Usage: node page-dbg.cjs '<css selector>' [ms]
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
(async () => {
  const sel = process.argv[2] || '#fields .fl-filter .fg'; const wait = +(process.argv[3] || 3000);
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'dbg-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 1500 });
  p.on('pageerror', (e) => console.log('PAGEERR', e.message.slice(0, 400))); p.on('console', (m) => console.log('CONSOLE.' + m.type(), m.text().slice(0, 300)));
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await new Promise((r) => setTimeout(r, wait));
  console.log(await p.evaluate((sel) => { const e = document.querySelector(sel); return e ? `${document.querySelectorAll(sel).length} match · ov ${e.querySelectorAll('svg.ov').length} · inks ${e.querySelectorAll('.inks').length}\n` + e.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg…/>').slice(0, 1500) : 'no match'; }, sel));
  await b.close();
})();
