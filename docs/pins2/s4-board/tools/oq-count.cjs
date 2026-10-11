// The search field's count box, three ways, drawn on the spec page's real SearchField (the Manifest's, in its board chain, "bal-27" typed):
// A as drawn (M box, the realm colour at 14%) · B the same box, neutral · C no box, plain grey words. Writes work/lead/oq/count-{A,B,C}.png
// (his 2026-10-08 11:02 EDT: "keep it as drawn or...? what's your question's alternative?"). Usage: node oq-count.cjs
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const OUT = path.join(__dirname, 'oq'); fs.mkdirSync(OUT, { recursive: true });
const VARIANTS = {
  A: '',
  B: '.spec #fields .fl-filter .srch-suf > .mhits:not(#_):not(#_) { background: color-mix(in srgb, var(--ink) 8%, transparent) !important; color: var(--ink2) !important; }',
  C: '.spec #fields .fl-filter .srch-suf > .mhits:not(#_):not(#_) { background: transparent !important; padding: 0 !important; color: var(--ink3) !important; }',
};
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 180000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'oq-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: '.spec .ov{display:none !important}' });
  for (const [k, css] of Object.entries(VARIANTS)) {
    await p.evaluate((css) => { let s = document.getElementById('oq-v'); if (!s) { s = document.createElement('style'); s.id = 'oq-v'; document.head.appendChild(s); } s.textContent = css; }, css);
    const r = await p.evaluate(() => { const f = document.querySelector('#fields .fl-filter .srch'); f.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = f.getBoundingClientRect(); const h = f.querySelector('.mhits'); const c = h && getComputedStyle(h); return { x: q.left - 14 + scrollX, y: q.top - 14 + scrollY, w: q.width + 28, h: q.height + 28, hits: h && { h: h.getBoundingClientRect().height, bg: c.backgroundColor, color: c.color, text: h.textContent } }; });
    await new Promise((res) => setTimeout(res, 300));
    await p.screenshot({ path: path.join(OUT, `count-${k}.png`), clip: { x: r.x, y: r.y, width: r.w, height: r.h } });
    console.log(k, JSON.stringify(r.hits));
  }
  await b.close();
})();
