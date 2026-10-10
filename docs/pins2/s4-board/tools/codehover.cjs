// His 20:47 report: Copy code and Sort DO change on hover and press, and Copy code's hover tint has other corners than its rest box. My
// pointer check said "no change" for both. This hovers the REAL C1's first code chip and Sort and prints, part by part, what each state draws:
// background, ring, colour, corner radius and the drawn box of every element and ::before/::after inside, plus the chip's own parent.
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ch-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 });
  await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(STATE, 'utf8'));
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__bd && window.__bd.mounted && document.querySelector('#c-manifest .wg-code'), { timeout: 60000 }); await sleep(1200);
  await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
  for (const sel of ['#c-manifest .wg-r .wg-code', '#c-manifest .wg-heads .wg-sort']) {
    const at = await p.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, top: top ? top.className + ' (' + top.tagName + ')' : null, html: document.documentElement.getAttribute('data-b3-a1') }; }, sel);
    const read = () => p.evaluate((sel) => { const e = document.querySelector(sel); const out = []; const list = [e.parentElement, e, ...e.querySelectorAll('*')].filter((x) => x.tagName.toLowerCase() !== 'use');
      for (const x of list) for (const pe of [null, '::before', '::after']) { const c = getComputedStyle(x, pe); if (pe && (c.content === 'none' || c.content === 'normal')) continue; const r = x.getBoundingClientRect();
        out.push(`${x === e ? 'BUTTON' : x === e.parentElement ? 'parent' : '.' + ([...x.classList][0] || x.tagName.toLowerCase())}${pe || ''} · bg ${c.backgroundColor} · ring ${c.boxShadow === 'none' ? '-' : c.boxShadow.slice(0, 60)} · col ${c.color} · radius ${c.borderTopLeftRadius} · inset ${pe ? c.inset : ''} · box ${Math.round(r.width)}×${Math.round(r.height)}`); }
      return out; }, sel);
    await p.mouse.move(1, 1); await sleep(500); const rest = await read();
    await p.mouse.move(at.x, at.y); await sleep(600); const hov = await read();
    await p.mouse.down(); await sleep(250); const prs = await read(); await p.mouse.move(1, 1); await p.mouse.up();
    console.log(`\n=== ${sel} · under the pointer: ${at.top} · html data-b3-a1=${at.html}`);
    rest.forEach((l, i) => { const h = hov[i], q = prs[i]; console.log(l === h && l === q ? '  same   ' + l : `  REST   ${l}\n  HOVER  ${h}\n  PRESS  ${q}`); });
  }
  await b.close();
})().catch((e) => { console.error('codehover FAIL', e.message); process.exit(1); });
