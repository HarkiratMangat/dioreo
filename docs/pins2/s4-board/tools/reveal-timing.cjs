// 2026-10-10 21:14 EDT: his "can you verify that both right/left use the same animation timing?" — each reveal hovered with a real mouse, its width and its
// word's opacity sampled every 20ms for 700ms, then the mouse leaves and the closing is sampled the same way. Standards mode. Usage: node reveal-timing.cjs
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const PAGE = path.join(ROOT, 'docs/pins2/s4-board/spec.html'); const URL = 'http://127.0.0.1:8900/docs/pins2/s4-board/spec.html';
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'rv-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888 }); await p.setRequestInterception(true);
  p.on('request', (r) => { if (r.url() === URL) r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset=utf8></head><body>' + fs.readFileSync(PAGE, 'utf8') + '</body></html>' }); else r.continue(); });
  await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(4000);
  for (const q of ['[data-facts="rv-right"] button', '[data-facts="rv-left"] button', '[data-bfix="button.x"] button']) {
    const h = await p.$(q); if (!h) { console.log('missing', q); continue; } await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await p.mouse.move(2, 2); await sleep(600);
    const bb = await h.boundingBox(); const S = (lab) => p.evaluate((q) => { const e = document.querySelector(q); const w = e.querySelector(':scope > :not(svg)'); const ow = w ? getComputedStyle(w).opacity : getComputedStyle(e, '::after').opacity; const ww = w ? w.scrollWidth : 0; return [Math.round(e.getBoundingClientRect().width * 10) / 10, (+ow).toFixed(2), ww, w ? Math.round(w.getBoundingClientRect().width * 10) / 10 : Math.round(parseFloat(getComputedStyle(e, '::after').width) * 10) / 10]; }, q);
    const run = async () => { const out = []; for (let t = 0; t <= 700; t += 20) { out.push(`${t}:${(await S()).join('/')}`); await sleep(20); } return out; };
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); const op = await run(); await p.mouse.move(2, 2); const cl = await run();
    const full = await S(); console.log(`== ${q}\nopen  ${op.filter((x, i) => i % 2 === 0).join(' ')}\nclose ${cl.filter((x, i) => i % 2 === 0).join(' ')}`);
  }
  await b.close();
})();
