// Session 4 · for every frozen sample, the chain of Board 4 ancestors it sits in (box, background, edge), so the Standard board can draw
// each copy inside its real container at its real width instead of floating on a plate the width of the page.
// Why: Harkirat, 2026-10-02 12:28 EDT — "wtf am i even setting the column width AGAINST?? why is the container the full page width
// instead of the surface's actual container as it would be sized in the portal??"
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/ctr-probe.cjs <out.json> <spec.json> [spec.json ...]
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const [outF, ...specFs] = process.argv.slice(2);
(async () => {
  const { b, p } = await W.open(); await W.sleep(900);
  await p.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' }); await W.sleep(200);
  const out = fs.existsSync(outF) ? JSON.parse(fs.readFileSync(outF, 'utf8')) : {};
  const vw = await p.evaluate(() => innerWidth); console.log('viewport', vw);
  for (const sf of specFs) for (const s of JSON.parse(fs.readFileSync(sf, 'utf8'))) {
    if (s.state) { await W.setState(p, s.gate, s.state); await W.sleep(700); }
    if (s.pop) { const pop = W.POPS.find((x) => x.label === s.pop); if (pop) { await W.openPop(p, pop).catch(() => {}); await W.sleep(600); } }
    if (s.try) { await p.evaluate((s) => { const bt = [...document.querySelectorAll(`#${s.gate} .b4-try button`)].find((x) => x.textContent.trim() === s.try); if (bt) bt.click(); }, s); await W.sleep(900); }
    if (s.click) { for (let k = 0; k < 2; k++) { const open = await p.evaluate((s) => { const g = document.getElementById(s.gate); const e = s.expect && g && g.querySelector(s.expect); return !!e && e.getBoundingClientRect().height > 2; }, s); if (open) break; await p.evaluate((s) => { const e = document.querySelector('#' + s.gate + ' ' + s.click); if (e) e.click(); }, s); await W.sleep(800); } }
    const res = await p.evaluate((s) => {
      const gate = document.getElementById(s.gate); const root0 = gate || document; let el = null;
      if (s.sel) el = [...root0.querySelectorAll(s.sel)].filter((x) => !s.contains || (x.textContent || '').toLowerCase().includes(s.contains.toLowerCase()))[s.nth || 0] || null;
      else { const want = s.text.toLowerCase(); let n = s.nth || 0; for (const e of root0.querySelectorAll('*')) { const own = [...e.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent).join('').replace(/\s+/g, ' ').trim().toLowerCase(); if (own && own.startsWith(want) && e.getBoundingClientRect().width > 1) { if (n-- <= 0) { el = e; break; } } } }
      if (!el) return null;
      for (let i = 0; i < (s.up || 0) && el.parentElement; i++) el = el.parentElement;
      el.scrollIntoView({ block: 'center' });
      const R = el.getBoundingClientRect(); const chain = [];
      for (let a = el.parentElement, d = 1; a && a !== document.documentElement && d <= 10; a = a.parentElement, d++) {
        const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
        const edge = ['Top', 'Right', 'Bottom', 'Left'].map((k) => cs['border' + k + 'Style'] !== 'none' && parseFloat(cs['border' + k + 'Width']) > 0 ? `${k[0]}${cs['border' + k + 'Width']} ${cs['border' + k + 'Color']}` : '').filter(Boolean).join(' ');
        chain.push({ d, tag: a.tagName.toLowerCase(), id: a.id || '', cls: (typeof a.className === 'string' ? a.className : '').trim().split(/\s+/).slice(0, 3).join('.'), x: Math.round(r.x - R.x), y: Math.round(r.y - R.y), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, bgi: cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 90) : '', rad: cs.borderTopLeftRadius, edge, sh: cs.boxShadow !== 'none' ? cs.boxShadow.slice(0, 120) : '', pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '), ov: cs.overflow, gate: a === gate });
        if (a === gate) break;
      }
      return { w: Math.round(R.width), h: Math.round(R.height), chain };
    }, s);
    if (s.pop) await W.closePop(p).catch(() => {});
    if (!res) { console.log(`${s.id}: NOT FOUND`); continue; }
    out[s.id] = res; console.log(`${s.id} ${res.w}x${res.h}`);
    for (const a of res.chain) console.log(`   ${a.d} ${a.tag}${a.id ? '#' + a.id : ''}${a.cls ? '.' + a.cls : ''} @${a.x},${a.y} ${a.w}x${a.h} bg ${a.bg}${a.bgi ? ' img' : ''} r ${a.rad}${a.edge ? ' edge ' + a.edge : ''}${a.sh ? ' sh' : ''} pad ${a.pad}${a.ov !== 'visible' ? ' ov ' + a.ov : ''}${a.gate ? ' [GATE]' : ''}`);
  }
  fs.writeFileSync(outF, JSON.stringify(out));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
