// Board 4 instrument, saved 2026-09-24. Run: DSF=2|4 ROWS=n SEL='<row selector>' node board4-ink-centre.cjs '[css to inject]'
// Measure at BOTH 2x and 4x: a layout offset snaps text to whole pixels, a transform does not, and one quantum (1 device px) is noise.
// ink.cjs [css-to-inject] (env DSF=device scale, default 4): per element of the manifest weapon rows, box centre and drawn-ink centre
// against the row centre. Ink = the pixels that change when only that element's ink is hidden, cropped to its own column.
const { chromium } = require(process.env.PW || 'playwright');  // PW=<path to a playwright install> when none is on the resolve path
const fs = require('fs'), cp = require('child_process');
const extra = process.argv[2] || '', K = +(process.env.DSF || 4), N = +(process.env.ROWS || 3);
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: K });
  await p.goto('http://127.0.0.1:8900/local/pins2-board-3/redo/board4.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.emulateMedia({ reducedMotion: 'reduce' }); await p.mouse.move(2, 2);
  await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' + extra }); await p.waitForTimeout(200);
  const rows = await p.$$(process.env.SEL || '#manifest .wg-h'); const out = [];
  for (const [ri, row] of rows.slice(0, N).entries()) {
    await row.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
    const rr = await row.boundingBox(); const cy = rr.y + rr.height / 2;
    const T = [['check', '.cb', 'visibility:hidden'], ['name', '.wg-line > b', 'color:transparent'], ['tag', '.wg-line > small', 'color:transparent'],
      ['count', '.wg-line > em', '-webkit-text-fill-color:transparent'], ['dot', 'i.sep', 'visibility:hidden']];
    const nb = (await row.$$('.b3-bdg')).length;
    for (let i = 1; i <= nb; i++) { T.push([`bdg${i}.icon`, `.b3-bdg:nth-of-type(${i}) > svg`, 'visibility:hidden']); T.push([`bdg${i}.word`, `.b3-bdg:nth-of-type(${i})`, '-webkit-text-fill-color:transparent']); }
    const clip = { x: rr.x, y: rr.y, width: rr.width, height: rr.height };
    fs.writeFileSync(__dirname + '/a.png', await p.screenshot({ clip }));
    for (const [lab, sel, hide] of T) {
      const el = await row.$(sel); if (!el) continue; const bb = await el.boundingBox(); if (!bb || bb.width < 1) continue;
      await el.evaluate((e, h) => { e.dataset.ok = e.getAttribute('style') || ''; e.setAttribute('style', (e.dataset.ok ? e.dataset.ok + ';' : '') + h + '!important'); }, hide);
      fs.writeFileSync(__dirname + '/b.png', await p.screenshot({ clip }));
      await el.evaluate((e) => { e.dataset.ok ? e.setAttribute('style', e.dataset.ok) : e.removeAttribute('style'); });
      const cw = Math.round((bb.width + 4) * K), cx = Math.max(0, Math.round((bb.x - rr.x - 2) * K));
      const r = cp.execSync(`magick ${__dirname}/a.png ${__dirname}/b.png -compose difference -composite -crop ${cw}x${Math.round(rr.height * K)}+${cx}+0 +repage -colorspace gray -threshold 6% -format "%@" info:`).toString();
      const m = r.match(/(\d+)x(\d+)\+(\d+)\+(\d+)/);
      const ink = m ? (rr.y + (+m[4] + +m[2] / 2) / K) - cy : NaN;
      out.push(`row${ri} ${lab.padEnd(11)} box ${(bb.y + bb.height / 2 - cy).toFixed(2).padStart(6)}  ink ${ink.toFixed(2).padStart(6)}  (${m ? m[2] / K : '-'}px tall)`);
    }
  }
  console.log(out.join('\n')); await b.close();
})();
