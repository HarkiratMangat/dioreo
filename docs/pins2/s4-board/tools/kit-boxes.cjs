// Session 4 · every BUTTON and every CONTAINER box on Board 4, across every gate and state, deduped by look: height, radius, padding,
// type, ground, edge — the input for the button family (E1) and the radius scale (E3). Written 2026-10-01.
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
(async () => {
  const { b, p } = await W.open(); await p.setRequestInterception(true);
  p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  const looks = new Map();
  const reload = async () => { await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await W.sleep(900); };
  for (const [g, id] of W.GATES) {
    await reload(); const acts = await W.actions(p, id);
    for (const a of [null, ...acts]) {
      if (a) { await reload(); await W.act(p, id, a[0], a[1]); }
      const rows = await p.evaluate((id) => {
        const px = (v) => Math.round(parseFloat(v) * 10) / 10; const out = [];
        for (const e of document.getElementById(id).querySelectorAll('*')) {
          if (e.closest('.pb-head, .pb-new, .b4-try, .b4-forks, .pb-ctl')) continue;
          const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
          const isBtn = e.matches('button, [role=button], a[href]');
          const rad = cs.borderTopLeftRadius; const bw = px(cs.borderTopWidth); const ring = /inset/.test(cs.boxShadow); const bg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none';
          const isBox = !isBtn && (rad !== '0px') && (bg || bw || ring) && r.width >= 24 && r.height >= 16;
          if (!isBtn && !isBox) continue;
          const lab = (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24);
          out.push({ kind: isBtn ? 'button' : 'box', cls: (e.getAttribute('class') || '').trim().split(/\s+/).sort().join('.'), tag: e.tagName.toLowerCase(), h: isBtn ? px(r.height) : '-', w: px(r.width),
            rad, pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px).join(' '), fs: px(cs.fontSize), fw: cs.fontWeight, bg: cs.backgroundColor, bw, ring, lab });
        }
        return out; }, id);
      for (const r of rows) { const k = [r.kind, r.tag, r.cls, r.h, r.rad, r.pad, r.fs, r.fw].join('|'); const L = looks.get(k) || { ...r, gates: new Set(), n: 0 }; L.n++; L.gates.add(g); looks.set(k, L); }
    }
  }
  await b.close();
  const list = [...looks.values()].map((l) => ({ ...l, gates: [...l.gates].join(',') }));
  fs.writeFileSync(path.join(__dirname, 'kit-boxes.json'), JSON.stringify(list, null, 1));
  const btn = list.filter((l) => l.kind === 'button'); const box = list.filter((l) => l.kind === 'box');
  const tally = (arr, k) => { const m = {}; arr.forEach((x) => { m[x[k]] = (m[x[k]] || 0) + 1; }); return Object.entries(m).sort((a, z) => z[1] - a[1]).map(([v, n]) => `${v}×${n}`).join(' · '); };
  console.log(`buttons: ${btn.length} looks · heights ${tally(btn, 'h')}\n  radii ${tally(btn, 'rad')}`);
  console.log(`boxes: ${box.length} looks · radii ${tally(box, 'rad')}`);
})().catch((e) => { console.error(e); process.exit(2); });
