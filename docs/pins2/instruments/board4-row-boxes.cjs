// Board 4 instrument, saved 2026-09-24 14:44 EDT: each form row: label BOX vs control box, overflow and stacking — boxes only, never an alignment claim. Run: PW=<playwright path> node board4-row-boxes.cjs (the kit on :8900; screenshots land beside the script's `w/` or `ass/`).
// rows.cjs: the form's row grammar, measured — label centre vs control centre, any control running past its row, at 1440 and 1280, one card and three, MP and DMZ
const { chromium } = require(process.env.PW || 'playwright');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const W of [1440, 1280]) {
    const p = await b.newPage({ viewport: { width: W, height: 960 }, deviceScaleFactor: 2 });
    await p.goto('http://127.0.0.1:8900/docs/pins2/kit/board4.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    for (const st of ['Add · filled', 'Add · three', 'DMZ']) {
      const sec = p.locator('#c-new-build'); await sec.locator('.pb-ctl button', { hasText: st }).first().click(); await p.waitForTimeout(1200);
      if (st === 'DMZ') { await p.evaluate(() => { const t = [...document.querySelectorAll('#c-new-build .f-tier')].find((x) => x.textContent.includes('BEST')); t && t.click(); }); await p.waitForTimeout(300); }
      const r = await p.evaluate(() => {
        const d = [...document.querySelectorAll('#c-new-build .drawer')].find((x) => x.querySelector('.f-form'));
        const rows = [...d.querySelectorAll('.f-sec > .f-row, .f-att')];
        const bad = [], off = [];
        rows.forEach((row) => {
          const rr = row.getBoundingClientRect(); const lab = row.querySelector('.f-lab, .f-slot'); const ctl = row.lastElementChild;
          const lr = lab.getBoundingClientRect(), cr = ctl.getBoundingClientRect();
          const stacked = cr.top > lr.bottom - 1;
          const dc = (lr.top + lr.height / 2) - (cr.top + cr.height / 2);
          const name = (lab.textContent || '').trim().slice(0, 12);
          if (!stacked && Math.abs(dc) > 0.6) off.push(`${name}:${dc.toFixed(2)}`);
          const inner = ctl.querySelector('.f-tiers, .f-bdgs') || ctl; const ir = inner.getBoundingClientRect();
          if (ir.right > rr.right + 0.5) bad.push(`${name} overflows ${Math.round(ir.right - rr.right)}px`);
          if (stacked) bad.push(`${name} stacked`);
        });
        const dw = d.getBoundingClientRect();
        return `drawer ${Math.round(dw.width)} · rows ${rows.length} · off-centre [${off.join(' ')}] · ${bad.join(' · ') || 'none overflow/stacked'}`;
      });
      console.log(W, st.padEnd(12), r);
    }
    await p.close();
  }
  await b.close();
})();
