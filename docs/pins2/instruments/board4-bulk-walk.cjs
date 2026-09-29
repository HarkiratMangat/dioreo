// Board 4 instrument, saved 2026-09-24 14:44 EDT: Bulk by hand: format card, one ghost line, a long paste, the Discord view. Run: PW=<playwright path> node board4-bulk-walk.cjs (the kit on :8900; screenshots land beside the script's `w/` or `ass/`).
// bulkx.cjs: Bulk by hand: the format card, typing at the end (one ghost line), a long paste (does it scroll inside its frame?), the Discord view
const { chromium } = require(process.env.PW || 'playwright');
const O = __dirname + '/w';
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.5 });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8900/local/pins2-board-3/redo/board4.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const sec = p.locator('#c-new-build'); await sec.locator('.pb-ctl button', { hasText: 'Bulk · empty' }).first().click(); await p.waitForTimeout(1200);
  const d = sec.locator('.drawer').first(); await d.scrollIntoViewIfNeeded();
  await d.locator('.bk-gt').click(); await p.waitForTimeout(400); await d.screenshot({ path: `${O}/b-fmt.png` });
  await d.locator('.bk-fmt button', { hasText: 'Insert this example' }).click(); await p.waitForTimeout(300);
  const ta = d.locator('#pb-ta'); await ta.focus(); await ta.evaluate((t) => { t.setSelectionRange(t.value.length, t.value.length); });
  await p.keyboard.type('\n'); await p.waitForTimeout(300); await d.screenshot({ path: `${O}/b-ghost.png` });
  const blk = 'XM4 | AR | MP\nLabel: Long\nCode: 1A2B3C4D5E\nImage: XM4-9\nBadges: meta, top5\n- Monolithic Suppressor\n- MIP Light Barrel\n- No Stock\n- 50 Round Mag\n- Granulated Grip Tape\n';
  await ta.fill(Array.from({ length: 6 }, () => blk).join('\n')); await p.waitForTimeout(500);
  await ta.evaluate((t) => { t.setSelectionRange(t.value.length, t.value.length); t.dispatchEvent(new Event('select')); });
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
  const m = await d.evaluate((e) => { const w = e.querySelector('.pb-edwrap'), f = e.querySelector('.bk-frame'), dw = e.querySelector('.dw-b'); const r = (x) => { const q = x.getBoundingClientRect(); return [Math.round(q.top), Math.round(q.bottom)]; }; return { wrap: r(w), frame: r(f), body: r(dw), sh: w.scrollHeight, ch: w.clientHeight, st: w.scrollTop, ta: e.querySelector('#pb-ta').offsetHeight, ed: e.querySelector('.pb-ed').offsetHeight }; });
  await d.screenshot({ path: `${O}/b-long.png` });
  await d.locator('.bk-view button', { hasText: 'Discord' }).click(); await p.waitForTimeout(500); await d.screenshot({ path: `${O}/b-stack.png` });
  console.log(JSON.stringify(m), 'errors', errs);
  await b.close();
})();
