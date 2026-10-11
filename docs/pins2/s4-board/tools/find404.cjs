// Lists every request a page answers with 4xx/5xx (the spec checks only see the console's "Failed to load resource", never the URL). Usage: node find404.cjs [spec.html|builder.html]
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
(async () => {
  const page = process.argv[2] || 'spec.html';
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 180000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bp-')) }); const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888 });
  const bad = []; p.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/' + page, { waitUntil: 'networkidle0', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1500));
  console.log(bad.length ? bad.join('\n') : 'no failed requests'); await b.close();
})();
