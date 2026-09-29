// Board 4 instrument, saved 2026-09-24 14:44 EDT: records a badge's motion off a board row into frames for a gif. Run: PW=<playwright path> node board4-badge-gif.cjs (the kit on :8900; screenshots land beside the script's `w/` or `ass/`).
// assgif.cjs: the ASS badge's three motions, recorded off the real board row (KILO 141) at 3x, one frame every ~70ms for 3.6s each
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const O = __dirname + '/ass'; fs.mkdirSync(O, { recursive: true });
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 3 });
  await p.goto('http://127.0.0.1:8900/local/pins2-board-3/redo/board4.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const h = p.locator('#manifest .wg-h', { hasText: 'KILO 141' }).first(); await h.scrollIntoViewIfNeeded(); await p.mouse.move(2, 2);
  const bd = h.locator('.b3-bdg[data-k=ass]');
  for (const opt of ['a', 'b', 'c']) {
    await p.evaluate((o) => document.documentElement.setAttribute('data-b3-ass', o), opt); await p.waitForTimeout(600);
    const r = await bd.boundingBox(); const clip = { x: r.x - 26, y: r.y - 16, width: r.width + 52, height: r.height + 32 };
    const t0 = Date.now(); let n = 0;
    while (Date.now() - t0 < 3600) { await p.screenshot({ clip, path: `${O}/${opt}-${String(n).padStart(3, '0')}.png` }); n++; await p.waitForTimeout(40); }
    console.log(opt, n, 'frames');
  }
  await b.close();
})();
