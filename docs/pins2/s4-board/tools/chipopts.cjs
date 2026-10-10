// The weapon row's problem chip, drawn three ways from the patterns Harkirat set (2026-10-06 15:05 EDT: "using these patterns, please adjust
// the problem chip itself and show me your proposal"), beside today's, on Builder-2's Board 4 at his 1282 window. Each option is CSS laid
// over the page for the shot only; nothing is written to the kit. Output: chipopts/<name>.png, one crop of the first weapon row with a problem.
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const OUT = path.join(__dirname, 'chipopts'); fs.mkdirSync(OUT, { recursive: true });
const S = '.wg-h .b3-fchip';
const OPTS = {
  today: '',
  A: `${S}{height:32px;border-radius:8px;padding:0 10px 0 14px;gap:6px;font:600 11px/1 var(--ui)} ${S} > .ic{width:14px;height:14px}`,
  B: `${S}{height:32px;border-radius:999px;padding:0 10px 0 14px;gap:6px;font:600 11px/1 var(--ui)} ${S} > .ic{width:12px;height:12px}`,
  C: `${S}{height:32px;border-radius:8px;padding:0 10px 0 14px;gap:10px;font:600 13px/1 var(--ui)} ${S} > .ic{width:14px;height:14px}`,
};
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bd-chipopts-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/board4.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForSelector('#c-manifest .wg-h .b3-fchip', { timeout: 60000 });
  await p.evaluate(async () => { await document.fonts.ready; });
  for (const [name, css] of Object.entries(OPTS)) {
    await p.evaluate((css) => { let s = document.getElementById('chipopt'); if (!s) { s = document.createElement('style'); s.id = 'chipopt'; document.head.appendChild(s); } s.textContent = css; for (const a of document.getAnimations()) { try { if (isFinite(a.effect.getComputedTiming().endTime)) a.finish(); else { a.pause(); a.currentTime = 0; } } catch (e) {} } }, css);
    const box = await p.evaluate(() => { const c = document.querySelector('#c-manifest .wg-h .b3-fchip'); const row = c.closest('.wg-h'); row.scrollIntoView({ block: 'center' }); const r = row.getBoundingClientRect(); return { x: Math.max(0, r.left + r.width * 0.5), y: r.top, w: r.width * 0.5, h: r.height }; });
    await new Promise((r) => setTimeout(r, 300)); const shot = path.join(OUT, `full-${name}.png`); await p.screenshot({ path: shot });
    fs.writeFileSync(path.join(OUT, `${name}.crop`), `${Math.round(box.w * 2)}x${Math.round(box.h * 2)}+${Math.round(box.x * 2)}+${Math.round(box.y * 2)}`);
    const m = await p.evaluate(() => { const c = document.querySelector('#c-manifest .wg-h .b3-fchip'); const r = c.getBoundingClientRect(); return `${r.width.toFixed(1)}×${r.height.toFixed(1)}`; }); console.log(name, m);
  }
  await b.close();
})().catch((e) => { console.error('chipopts FAIL', e.message); process.exit(1); });
