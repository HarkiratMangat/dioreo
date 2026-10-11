// Session 4 · round 3's scales: every distinct font size, letter spacing, gap, padding, margin and transition duration that Board 4
// actually renders, across every gate and every state the shared walker can reach — computed style, never the stylesheet text.
// Each value carries its count and up to 8 sample elements, so the tuner can show where a step lands. Output: kit-scales.json + .md.
// Run with the kit on :8900:  node local/pins2/s4/work/lead/kit-scales.cjs
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
(async () => {
  const { b, p } = await W.open(); await p.setRequestInterception(true);
  p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  const T = { fs: new Map(), ls: new Map(), gap: new Map(), pad: new Map(), mar: new Map(), dur: new Map(), anim: new Map() };
  const add = (kind, v, who, g) => { const m = T[kind]; const e = m.get(v) || { n: 0, who: new Set(), gates: new Set() }; e.n++; if (e.who.size < 8) e.who.add(who); e.gates.add(g); m.set(v, e); };
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
          const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
          const cls = (e.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
          const who = e.tagName.toLowerCase() + (cls ? '.' + cls : '');
          const row = { who };
          const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          if (own) { const f = px(cs.fontSize); row.fs = `${f}|${/Mono/i.test(cs.fontFamily) ? 'mono' : 'ui'}|${cs.fontWeight}`; const l = parseFloat(cs.letterSpacing); if (Number.isFinite(l) && l !== 0) row.ls = (Math.round((l / f) * 100) / 100).toFixed(2); }
          if (/flex|grid/.test(cs.display)) { const gs = [cs.rowGap, cs.columnGap].filter((x) => x && x !== 'normal' && parseFloat(x) > 0).map(px); if (gs.length) row.gap = [...new Set(gs)]; }
          const pads = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px).filter((x) => x > 0); if (pads.length) row.pad = [...new Set(pads)];
          const mars = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(px).filter((x) => x !== 0 && Number.isFinite(x)); if (mars.length) row.mar = [...new Set(mars)];
          const durs = cs.transitionDuration.split(',').map((x) => x.trim()).filter((x) => x !== '0s'); if (durs.length) { const props = cs.transitionProperty.split(',').map((x) => x.trim()); row.dur = durs.map((d, i) => `${Math.round(parseFloat(d) * 1000)}ms`); row.durp = props; }
          if (cs.animationName && cs.animationName !== 'none') row.anim = cs.animationDuration.split(',').map((d) => `${Math.round(parseFloat(d) * 1000)}ms`);
          out.push(row);
        }
        return out; }, id);
      for (const r of rows) {
        if (r.fs) add('fs', r.fs, r.who, g); if (r.ls) add('ls', r.ls, r.who, g);
        (r.gap || []).forEach((v) => add('gap', v, r.who, g)); (r.pad || []).forEach((v) => add('pad', v, r.who, g)); (r.mar || []).forEach((v) => add('mar', v, r.who, g));
        (r.dur || []).forEach((v) => add('dur', v, r.who, g)); (r.anim || []).forEach((v) => add('anim', v, r.who, g));
      }
    }
  }
  await b.close();
  const out = {}; for (const [k, m] of Object.entries(T)) out[k] = [...m.entries()].map(([v, e]) => ({ v, n: e.n, who: [...e.who], gates: [...e.gates].join(',') })).sort((a, z) => z.n - a.n);
  out.written = new Date().toISOString();
  fs.writeFileSync(path.join(__dirname, 'kit-scales.json'), JSON.stringify(out, null, 1));
  const md = ['# Board 4 kit — the scales it renders (computed style, every gate and state)', ''];
  for (const k of ['fs', 'ls', 'gap', 'pad', 'mar', 'dur', 'anim']) { md.push(`## ${k} — ${out[k].length} distinct`, '', out[k].map((x) => `${x.v}×${x.n}`).join(' · '), ''); }
  fs.writeFileSync(path.join(__dirname, 'kit-scales.md'), md.join('\n'));
  for (const k of ['fs', 'ls', 'gap', 'pad', 'mar', 'dur', 'anim']) console.log(k, out[k].length, 'distinct');
})().catch((e) => { console.error(e); process.exit(2); });
