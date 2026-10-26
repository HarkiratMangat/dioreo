// Board 4 instrument, saved 2026-09-24 14:44 EDT: each form row: label ink centre vs field centre, 2x and 4x (hide-and-diff). Run: PW=<playwright path> node board4-row-ink.cjs (the kit on :8900; screenshots land beside the script's `w/` or `ass/`).
// rowink.cjs: each form row's label INK centre against its field's box centre, at 2x and 4x (Add · filled). Ink = pixels that change when only the label's text is hidden.
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'), cp = require('child_process');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const K of [2, 4]) {
    const p = await b.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: K });
    await p.goto('http://127.0.0.1:8900/docs/pins2/kit/board4.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
    await p.locator('#c-new-build .pb-ctl button', { hasText: 'Add · filled' }).first().click(); await p.waitForTimeout(1200); await p.mouse.move(2, 2);
    const rows = p.locator('#c-new-build .drawer .f-sec > .f-row, #c-new-build .drawer .f-att');
    const n = await rows.count(); const out = [];
    for (let i = 0; i < n; i++) {
      const row = rows.nth(i); await row.scrollIntoViewIfNeeded(); await p.waitForTimeout(80);
      const lab = row.locator('.f-lab label, .f-lab .f-rl, .f-slot').first(); const ctl = row.locator(':scope > :last-child');
      const lb = await lab.boundingBox(), cb = await ctl.boundingBox(); if (!lb || !cb) continue;
      const clip = { x: lb.x - 2, y: cb.y, width: lb.width + 4, height: cb.height };
      fs.writeFileSync(__dirname + '/ra.png', await p.screenshot({ clip }));
      await lab.evaluate((e) => { e.dataset.ok = e.getAttribute('style') || ''; e.setAttribute('style', (e.dataset.ok ? e.dataset.ok + ';' : '') + '-webkit-text-fill-color:transparent!important'); });
      fs.writeFileSync(__dirname + '/rb.png', await p.screenshot({ clip }));
      await lab.evaluate((e) => { e.dataset.ok ? e.setAttribute('style', e.dataset.ok) : e.removeAttribute('style'); });
      const r = cp.execSync(`magick ${__dirname}/ra.png ${__dirname}/rb.png -compose difference -composite -colorspace gray -threshold 6% -format "%@" info:`).toString();
      const m = r.match(/(\d+)x(\d+)\+(\d+)\+(\d+)/); if (!m) continue;
      const ink = (+m[4] + +m[2] / 2) / K, mid = cb.height / 2;
      out.push(`${(await lab.textContent()).trim().slice(0, 11)}:${(ink - mid).toFixed(2)}`);
    }
    console.log(`${K}x`, out.join('  '));
    await p.close();
  }
  await b.close();
})();
