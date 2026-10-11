// One-off (2026-10-10): screenshot "On the board" cards by their selector, copies shown, hover off. Usage: node card-shot.cjs <outdir> <sel> [sel...]
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const URL = 'http://127.0.0.1:8900/docs/pins2/s4-board/spec.html'; const [OUT, ...ARGS] = process.argv.slice(2); const HOV = ARGS.includes('--hover'); const SELS = ARGS.filter((x) => x !== '--hover');   /* --hover: the pointer on today's copy, then on the proposed one */
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'cs-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 }); await p.setCacheEnabled(false);
  await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(4000); await p.evaluate(() => dispatchEvent(new Event('spec-show-copies'))); await sleep(2000);
  fs.mkdirSync(OUT, { recursive: true });
  for (const sel of SELS) { const h = await p.evaluateHandle((sel) => { if (sel[0] === '#') return document.querySelector(sel); const t = [...document.querySelectorAll('[data-bsel]')].find((e) => e.dataset.bsel === sel || (e.closest('[data-bname]') || {}).dataset?.bname === sel); return t ? t.closest('.fm') : null; }, sel);
    const el = h.asElement(); if (!el) { console.log('missing', sel); continue; } await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); await sleep(400); const tag = sel.replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
    if (!HOV) { const f = path.join(OUT, tag + '.png'); await el.screenshot({ path: f }); console.log(f); continue; }
    for (const k of ['bsel', 'bfix']) { const t = await el.$(`[data-${k}] button, [data-${k}] [role=button]`); if (!t) { console.log('no', k); continue; } await t.hover(); await sleep(1600); const f = path.join(OUT, tag + '-' + k + '-hover.png'); await el.screenshot({ path: f }); console.log(f); await p.mouse.move(2, 2); await sleep(300); } }
  await b.close();
})();
