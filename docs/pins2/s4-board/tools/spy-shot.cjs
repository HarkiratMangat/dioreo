// The section rail (2026-10-09 10:15 EDT): at 1282 and 1700 wide, scroll to a few sections and read which link is lit; a viewport shot at each; at 390 the menu.
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
/* CLOSE_GUARD: a browser that will not close (seen 2026-10-09 11:19 EDT) must not hold the run: the results are already printed */
setTimeout(() => process.exit(0), 240000).unref();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const BASE = 'http://127.0.0.1:8900/docs/pins2/s4-board/spec.html'; const OUT = path.join(__dirname, 'spec-check');
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spy-')) });
  for (const [w, h] of [[1282, 900], [1700, 1000], [390, 844]]) { const p = await b.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await p.goto(BASE, { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await sleep(2500);
    const rail = await p.evaluate(() => { const n = document.querySelector('.spy'); const s = document.getElementById('spec'); const r = n && n.getBoundingClientRect(); const c = s.getBoundingClientRect(); return { rail: n && getComputedStyle(n).display !== 'none' ? `${Math.round(r.left)}–${Math.round(r.right)}` : 'hidden', column: `${Math.round(c.left)}–${Math.round(c.right)}`, overlap: n && getComputedStyle(n).display !== 'none' ? r.right > c.left + 24 : false, menu: getComputedStyle(document.querySelector('.spy-sel')).display, wide: document.documentElement.scrollWidth }; });
    console.log(`${w}: rail ${rail.rail} · column ${rail.column} · overlap ${rail.overlap} · menu ${rail.menu} · page width ${rail.wide}`);
    if (w === 390) { await p.screenshot({ path: path.join(OUT, 'spy-390.png') }); await p.close(); continue; }
    for (const id of ['segs', 'inputs', 'data']) { await p.evaluate((id) => { const a = [...document.querySelectorAll('.spy a')].find((x) => x.getAttribute('href') === '#' + id); a.click(); }, id); await sleep(400); const mid = await p.evaluate(() => document.querySelector('.spy a.on').getAttribute('href')); await sleep(2600); console.log(`  0.4 s after the click: ${mid}`);
      const lit = await p.evaluate(() => { const a = document.querySelector('.spy a.on'); const top = document.elementFromPoint(400, 120); return { lit: a && a.textContent, hash: location.hash }; }); console.log(`  clicked ${id} → lit «${lit.lit}» · hash ${lit.hash}`); }
    /* wheel-like scrolling: put each section's top 40 px under the reading line and read what is lit (his 10:25 EDT case: Gaps on screen, Text sizes lit) */
    for (const id of ['gaps', 'sizes', 'onboard', 'chips', 'labels', 'changes']) { const got = await p.evaluate(async (id) => { const e = document.getElementById(id); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 56); await new Promise((r) => setTimeout(r, 300)); return (document.querySelector('.spy a.on') || {}).getAttribute ? document.querySelector('.spy a.on').getAttribute('href').slice(1) : null; }, id); console.log(`  scrolled to ${id} → lit ${got}${got === id ? '' : '  ✗'}`); }
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await sleep(400); console.log(`  page foot → lit ${await p.evaluate(() => document.querySelector('.spy a.on').getAttribute('href'))}`);
    await p.screenshot({ path: path.join(OUT, `spy-${w}.png`) }); await p.close(); }
  await b.close();
})().catch((e) => { console.error('spy-shot FAIL', e.message); process.exit(1); });
