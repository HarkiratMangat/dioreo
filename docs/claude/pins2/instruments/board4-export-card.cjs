// Board 4 instrument, saved 2026-09-24 14:44 EDT: the Export hover card: nothing picked, added, another build. Run: PW=<playwright path> node board4-export-card.cjs (the kit on :8900; screenshots land beside the script's `w/` or `ass/`).
// peek.cjs: Export's hover card in its states: no builds picked, a build not in the file, the same build once added, one with three badges
const { chromium } = require(process.env.PW || 'playwright');
const O = __dirname + '/w';
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.5 });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8900/local/pins2-board-3/redo/board4.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const sec = p.locator('#c-export'); await sec.locator('.pb-ctl button', { hasText: 'Picker' }).first().click(); await p.waitForTimeout(1300);
  const d = sec.locator('.drawer').first(); await d.scrollIntoViewIfNeeded();
  const side = d.locator('.b3-xt-side');
  const peek = async (tag) => { await p.waitForTimeout(700); const r = await d.locator('.b3-xt-peek').evaluate((e) => { const q = e.getBoundingClientRect(); return { h: Math.round(q.height), sh: e.scrollHeight, on: e.classList.contains('on'), top: Math.round(q.top), bottom: Math.round(q.bottom) }; }); await side.screenshot({ path: `${O}/pk-${tag}.png` }); return tag + ' ' + JSON.stringify(r); };
  const out = [];
  const tile = d.locator('.b3-xt-c').first(); await tile.hover(); out.push(await peek('1-empty'));
  await tile.click(); await p.mouse.move(5, 5); await p.waitForTimeout(300); await tile.hover(); out.push(await peek('2-added'));
  const t3 = d.locator('.b3-xt-c').nth(4); await t3.hover(); out.push(await peek('3-other'));
  const jak = d.locator('.b3-xt-w8', { hasText: 'JAK-12' }).locator('.b3-xt-c').first();
  if (await jak.count()) { await jak.scrollIntoViewIfNeeded(); await jak.hover(); out.push(await peek('4-three-badges')); } else out.push('4: no JAK-12 tile');
  console.log(out.join('\n'), 'errors', errs);
  await b.close();
})();
