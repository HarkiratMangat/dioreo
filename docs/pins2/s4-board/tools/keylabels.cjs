// Session 4 · how Board 4 lays out its key labels (MANIFEST, CATEGORY, KIND, LEVEL, WHO, VIEW, STAGED …): each label's box width,
// text alignment, the gap from its drawn ink to the next control, and where that control starts — so the tuner can show the
// right-aligned column History uses (Harkirat, 2026-10-02 10:07 EDT) rather than a guess.
const path = require('path');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
(async () => {
  const { b, p } = await W.open();
  await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await W.sleep(900);
  const out = await p.evaluate(() => {
    const rows = [];
    for (const g of ['c-manifest', 'c-history', 'c-broadcast', 'c-queue', 'c-repairs', 'c-export']) {
      const root = document.getElementById(g); if (!root) continue;
      for (const e of root.querySelectorAll('*')) {
        const cs = getComputedStyle(e); if (cs.textTransform !== 'uppercase' || cs.display === 'none') continue;
        const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(''); if (!own || own.length > 14) continue;
        const r = e.getBoundingClientRect(); if (r.width < 4) continue;
        const range = document.createRange(); range.selectNodeContents(e); const ink = range.getBoundingClientRect();
        let nx = e.nextElementSibling; while (nx && nx.getBoundingClientRect().width < 2) nx = nx.nextElementSibling;
        const n = nx ? nx.getBoundingClientRect() : null;
        rows.push({ g, text: own, cls: e.className, w: Math.round(r.width * 10) / 10, align: cs.textAlign, minW: cs.minWidth, inkL: Math.round(ink.left), inkR: Math.round(ink.right), boxL: Math.round(r.left), gapInkToNext: n ? Math.round((n.left - ink.right) * 10) / 10 : null, nextL: n ? Math.round(n.left) : null, parent: e.parentElement.className.slice(0, 30), ls: cs.letterSpacing, fs: cs.fontSize, fw: cs.fontWeight, ff: cs.fontFamily.split(',')[0] });
      }
    }
    return rows;
  });
  for (const r of out) console.log(`${r.g} ${r.text.padEnd(12)} ${r.cls.padEnd(16)} box ${r.w} ${r.align} minW ${r.minW} · ink ${r.inkL}–${r.inkR} → next at ${r.nextL} (gap ${r.gapInkToNext}) · ${r.ff} ${r.fs} ${r.fw} ls ${r.ls} · in .${r.parent}`);
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
