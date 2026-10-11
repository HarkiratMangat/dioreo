// Session 4 · reads the computed pressed look of History's and Repairs' chips (b3-fc), and the selection list's switch, on the kit, so the tuner's ticks carry measured values.
const path = require('path');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
(async () => {
  const { b, p } = await W.open();
  await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await W.sleep(900);
  const out = await p.evaluate(() => {
    const read = (el) => { const s = getComputedStyle(el); return { lab: el.textContent.trim().slice(0, 18), bg: s.backgroundColor, ring: s.boxShadow, color: s.color, c: s.getPropertyValue('--c').trim() }; };
    const r = {};
    for (const g of ['c-history', 'c-repairs']) { const root = document.getElementById(g); r[g] = root ? [...root.querySelectorAll('.b3-fc[aria-pressed=true]')].slice(0, 2).map(read) : 'no gate'; }
    return r;
  });
  console.log(JSON.stringify(out, null, 1)); await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
