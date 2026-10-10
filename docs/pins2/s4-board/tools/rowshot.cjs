// Builder-2's Board 4 (board4.html, nothing decided) shot whole at three widths, so a structure change in the kit can be proved to move no
// pixel: run once before the change with "before", once after with "after", then compare the pairs (magick compare -metric AE).
// Session 4, 2026-10-06 12:34 EDT: the build row's right-side buttons wrapped in one container (Harkirat 12:28 EDT).
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const tag = process.argv[2] || 'now'; const OUT = path.join(__dirname, 'rowshot'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bd-rowshot-')) });
  for (const w of [1640, 1282, 600]) {
    const p = await b.newPage(); await p.setViewport({ width: w, height: 900, deviceScaleFactor: 1 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
    await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/board4.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForSelector('#c-manifest .wg-r', { timeout: 60000 });
    await p.evaluate(async () => { await document.fonts.ready; for (const a of document.getAnimations()) { try { if (isFinite(a.effect.getComputedTiming().endTime)) a.finish(); else { a.pause(); a.currentTime = 0; } } catch (e) {} } });
    await new Promise((r) => setTimeout(r, 800));
    const el = await p.$('#c-manifest'); await el.screenshot({ path: path.join(OUT, `${tag}-${w}.png`) });
    const rows = await p.evaluate(() => [...document.querySelectorAll('#c-manifest .wg-r')].slice(0, 3).map((r) => [...r.querySelectorAll('.wg-cb, .wg-ix, .wg-main, .wg-imh, .wg-code, .wg-ig.none, .wg-acts, .wg-ib')].map((k) => `${k.className.split(' ')[0]} ${Math.round(k.getBoundingClientRect().left * 4) / 4}/${Math.round(k.getBoundingClientRect().width * 4) / 4}`).join(' ')));
    fs.writeFileSync(path.join(OUT, `${tag}-${w}.txt`), rows.join('\n') + '\n' + errs.join('\n')); await p.close();
  }
  await b.close(); console.log('shot', tag);
})().catch((e) => { console.error('rowshot FAIL', e.message); process.exit(1); });
