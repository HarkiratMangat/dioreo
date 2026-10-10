// Builder-2's Board 4 (board4.html, nothing decided): each named gate shot as it sits on the page at 1640 wide, to look at after a kit change
// (Session 4, 2026-10-06 15:34 EDT: his C1 values moved into b4/components.css). Usage: node gateshot.cjs <tag> C1 C7 C8 ...
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const [tag, ...gates] = process.argv.slice(2); const OUT = path.join(__dirname, 'gateshot'); fs.mkdirSync(OUT, { recursive: true });
const ID = { C1: 'c-manifest', C2: 'c-new-build', C3: 'c-compare', C4: 'c-repairs', C5: 'c-export', C6: 'c-queue', C7: 'c-broadcast', C8: 'c-history', C9: 'c-admin' };
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bd-gateshot-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1640, height: 900, deviceScaleFactor: 1 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/board4.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForSelector('#c-manifest .wg-r', { timeout: 60000 });
  await p.evaluate(async () => { await document.fonts.ready; for (const a of document.getAnimations()) { try { if (isFinite(a.effect.getComputedTiming().endTime)) a.finish(); else { a.pause(); a.currentTime = 0; } } catch (e) {} } });
  await new Promise((r) => setTimeout(r, 800));
  for (const g of gates) { const el = await p.$('#' + ID[g]); if (!el) { console.log(g, 'missing'); continue; } await el.screenshot({ path: path.join(OUT, `${tag}-${g}.png`) }); }
  console.log('shot', tag, gates.join(' '), errs.length ? 'errors: ' + errs.join(' | ') : 'no errors'); await b.close();
})().catch((e) => { console.error('gateshot FAIL', e.message); process.exit(1); });
