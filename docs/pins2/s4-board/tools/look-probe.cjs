// 2026-10-10 22:10 EDT: each corrected copy's inks at rest and under a real mouse, named with the page's inkName (its skin: itself, its skin child or its ::before), standards mode.
// Proves the style definitions reached the copies. Usage: node look-probe.cjs '<data-bfix selector>' ...
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const PAGE = path.join(ROOT, 'docs/pins2/s4-board/spec.html'); const URL = 'http://127.0.0.1:8900/docs/pins2/s4-board/spec.html';
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'lp-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888 }); await p.setRequestInterception(true);
  p.on('request', (r) => { if (r.url() === URL) r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset=utf8></head><body>' + fs.readFileSync(PAGE, 'utf8') + '</body></html>' }); else r.continue(); });
  await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(4000); await p.evaluate(() => dispatchEvent(new Event('spec-show-copies'))); await sleep(2000);
  const read = (sel) => p.evaluate((sel) => { const N = window.__inkName; const w = [...document.querySelectorAll('[data-bfix]')].find((x) => x.dataset.bfix === sel); const e = w && (w.querySelector('[data-lkon]') || w.querySelector('button')); if (!e) return null;
    const on = e.dataset.lkon || 'none'; const s = on === 'child' ? e.querySelector('[data-lkskin]') : e; const c = getComputedStyle(s, /before|after/.test(on) ? '::' + on : null); const ring = /^(.*?) 0px 0px 0px 1px inset/.exec(c.boxShadow);
    const ic = e.querySelector('svg'); const r = e.getBoundingClientRect(); const ir = ic && ic.getBoundingClientRect();
    return { on, fill: N(c.backgroundColor) || 'none', ring: ring ? (N(ring[1]) || 'none') : (c.borderTopWidth !== '0px' ? 'border ' + N(c.borderTopColor) : 'none'), words: N(getComputedStyle(e).color), icx: ir ? Math.round((ir.left + ir.width / 2 - (r.left + r.width / 2)) * 10) / 10 : '' }; }, sel);
  for (const sel of process.argv.slice(2)) { const h = await p.evaluateHandle((sel) => { const w = [...document.querySelectorAll('[data-bfix]')].find((x) => x.dataset.bfix === sel); return w && (w.querySelector('[data-lkon]') || w.querySelector('button')); }, sel); const el = h.asElement(); if (!el) { console.log(sel, 'missing'); continue; }
    await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); await p.mouse.move(2, 2); await sleep(300); const R = await read(sel); const bb = await el.boundingBox(); if (!bb) { console.log(sel.padEnd(32), `[${R.on}] REST ${R.fill} | ${R.ring} | ${R.words}   (not on screen: no hover read)`); continue; } await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(600); const H = await read(sel);
    console.log(`${sel.padEnd(32)} [${R.on}] REST ${R.fill} | ${R.ring} | ${R.words} (icon ${R.icx})   HOVER ${H.fill} | ${H.ring} | ${H.words}`); }
  await b.close();
})();
