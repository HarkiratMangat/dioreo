// Session 4 · a compact measured outline of named containers on Board 4 (tag.class «own text» · font · box), for the control family.
// Usage: node outline.cjs '<gate-id>|<state or try label or ->|<css selector>' …   → prints the outlines
const path = require('path');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const specs = process.argv.slice(2).map((s) => s.split('|'));
(async () => {
  const { b, p } = await W.open(); await p.setRequestInterception(true);
  p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  for (const [id, st, sel] of specs) {
    await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await W.sleep(900);
    if (st && st !== '-') { const ok = await W.setState(p, id, st); if (!ok) { const acts = await W.actions(p, id); const t = acts.find((a) => a[2] === st); if (t) await W.act(p, id, t[0], t[1]); } }
    const txt = await p.evaluate((id, sel) => {
      const roots = [...document.querySelectorAll(`#${id} ${sel}`)].filter((e) => e.getBoundingClientRect().width > 0).slice(0, 2); if (!roots.length) return `  (no match for ${sel})`;
      const px = (v) => Math.round(parseFloat(v) * 100) / 100; const lines = [];
      const walk = (e, d) => { if (d > 6) return; const cs = getComputedStyle(e); if (cs.display === 'none') return; const r = e.getBoundingClientRect(); if (r.width < 1 && e.children.length === 0) return;
        const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim().slice(0, 24);
        const tag = e.tagName.toLowerCase(); if (tag === 'svg') { lines.push(`${'  '.repeat(d)}svg ${px(r.width)}×${px(r.height)} @x${px(r.left)}`); return; }
        lines.push(`${'  '.repeat(d)}${tag}.${(e.getAttribute('class') || '').trim().split(/\s+/).join('.')}${own ? ` «${own}»` : ''} · ${px(r.width)}×${px(r.height)} @x${px(r.left)},y${px(r.top)} · ${px(cs.fontSize)}/${cs.fontWeight} ${cs.fontFamily.split(',')[0].replace(/"/g, '')} ls${px(cs.letterSpacing) || 0} ${cs.textTransform !== 'none' ? cs.textTransform : ''} · pad ${[cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px).join(' ')} · gap ${cs.gap} · r ${cs.borderTopLeftRadius} · col ${cs.color}${cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? ' · bg ' + cs.backgroundColor : ''}`);
        [...e.children].forEach((k) => walk(k, d + 1)); };
      roots.forEach((r) => walk(r, 0)); return lines.join('\n'); }, id, sel);
    console.log(`\n=== ${id} · ${st} · ${sel}\n${txt}`);
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(2); });
