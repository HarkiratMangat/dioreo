// Board 4 instrument, saved 2026-09-24 14:44 EDT: the image well through 8 states: next free key, three shapes, remove, taken key, link, stored. Run: PW=<playwright path> node board4-image-well-walk.cjs (the kit on :8900; screenshots land beside the script's `w/` or `ass/`).
// well.cjs: the image well through its states — next free key, three shapes, remove, a taken key, a link, a stored image; and the stage panel
const { chromium } = require(process.env.PW || 'playwright');
const W = __dirname + '/w';
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8900/docs/pins2/kit/board4.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const sec = p.locator('#c-new-build'); await sec.locator('.pb-ctl button', { hasText: 'Add build' }).first().click(); await p.waitForTimeout(1200);
  const d = sec.locator('.drawer').first();
  const w = d.locator('#nb-w'); await w.click(); await w.fill('AK117'); await p.waitForTimeout(300); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  const img = d.locator('[data-s=image]').first(); await img.scrollIntoViewIfNeeded();
  const out = []; const snap = async (tag) => { await p.waitForTimeout(450); await img.screenshot({ path: `${W}/${tag}.png` }); out.push(tag + ': ' + (await img.evaluate((e) => { const k = e.querySelector('.f-key input'); const st = e.querySelector('.f-kst'); const sh = e.querySelector('.f-shot').getBoundingClientRect(); return `key=${k ? k.value : '-'} state=${st ? st.textContent.trim() : '-'} tile=${Math.round(sh.width)}x${Math.round(sh.height)} ar=${e.querySelector('.f-shot').dataset.ar || '-'}`; }))); };
  await snap('1-next-free');
  for (const [f, t] of [['port.png', '2-portrait'], ['land.png', '3-landscape'], ['sq.png', '4-square']]) { await img.locator('input[type=file]').first().setInputFiles(`${W}/${f}`); await snap(t); }
  await img.locator('button[aria-label="Remove the image"]').click(); await snap('5-removed');
  const k = img.locator('.f-key input'); await k.fill('AK117-1'); await snap('6-taken');
  await img.locator('.f-src button', { hasText: 'Link' }).click(); await img.locator('input[aria-label="Image link"]').fill('http://127.0.0.1:8900/local/pins2/intake-shots/intake-v36/71.png'); await p.waitForTimeout(900); await snap('7-link');
  await img.locator('.f-src button', { hasText: 'Stored image' }).click(); const pk = img.locator('input[role=combobox]').last(); await pk.click(); await p.waitForTimeout(300); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await snap('8-stored');
  const side = d.locator('.f-side'); await side.screenshot({ path: `${W}/9-side.png` });
  console.log(out.join('\n')); console.log('errors', errs);
  await b.close();
})();
