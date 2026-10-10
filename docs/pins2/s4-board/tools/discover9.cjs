// Session 4 · measure Board 4 for the six element families that were hand-drawn (board/FINAL-DIRECTION.md, "Still unsolved"): field hover (Fi),
// menu item hover (Mi), corners (J), the dark grounds mixed from #04070A into --sunk (M), drawer side columns (Q) and icon line weight (P).
// Measured on Board 4 itself with a real pointer, so the presets are rebuilt from Board 4's numbers, not from the hand-drawn assumptions.
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/discover9.cjs   → sweep/discover9.json and a summary per family
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const OUT = path.join(__dirname, 'sweep', 'discover9.json');
(async () => {
  const { b, p, errs } = await W.open(); const R = { Fi: [], Mi: [], J: [], M: [], Q: [], P: [] };
  const VIEWS = [...W.GATES.map(([, id]) => [id, null]), ['c-new-build', 'Add build'], ['c-broadcast', 'Posting'], ['c-broadcast', 'Saved']];
  const tag = (sel) => p.evaluate((sel) => { document.querySelectorAll('[data-d9]').forEach((e) => e.removeAttribute('data-d9')); }, sel);
  for (const [id, state] of VIEWS) {
    if (state) await W.setState(p, id, state); const where = id + (state ? ' · ' + state : '');
    // the static families in one pass over the gate
    const st = await p.evaluate((id, where) => {
      const g = document.getElementById(id); const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      const nm = (e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
      const out = { J: [], M: [], Q: [], P: [], fields: [] };
      const parse = (c) => { const n = (c.match(/[\d.]+/g) || []).map(Number); return /^color\(srgb/.test(c) ? n.map((x, i) => (i < 3 ? x * 255 : x)) : n; };
      for (const e of g.querySelectorAll('*')) { if (!vis(e)) continue; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
        const rad = parseFloat(cs.borderTopLeftRadius); if (rad > 0 && r.width > 24 && r.height > 14 && rad < Math.min(r.width, r.height) / 2 - .5) out.J.push([nm(e), rad, Math.round(r.width), Math.round(r.height)]);
        const bg = parse(cs.backgroundColor); if (bg.length === 3 || (bg.length === 4 && bg[3] === 1)) { const pr = (11 - bg[0]) / 7, pg = (15 - bg[1]) / 8, pb = (18 - bg[2]) / 8; if (pr > 0.02 && pr <= 1.01 && Math.abs(pr - pg) < 0.14 && Math.abs(pr - pb) < 0.14) out.M.push([nm(e), Math.round((pr + pg + pb) / 3 * 100), cs.backgroundColor]); }
        if (/grid/.test(cs.display) && /\b3[3-4]\dpx\b/.test(cs.gridTemplateColumns)) out.Q.push([nm(e), cs.gridTemplateColumns, Math.round(r.width)]);
        if (e.tagName.toLowerCase() === 'svg') out.P.push([nm(e), Math.round(r.width), cs.strokeWidth, (e.querySelector('[stroke-width]') || {}).getAttribute ? e.querySelector('[stroke-width]').getAttribute('stroke-width') : '']);
        if (e.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, select, [contenteditable=""], [contenteditable=true]')) { let box = e; for (let k = 0, x = e; k < 3 && x; k++, x = x.parentElement) { const c = getComputedStyle(x); if (parseFloat(c.borderTopWidth) > 0 || c.boxShadow !== 'none' || !/rgba\(0, 0, 0, 0\)/.test(c.backgroundColor)) { box = x; break; } } e.setAttribute('data-d9f', out.fields.length); out.fields.push([nm(e), nm(box), box === e ? 0 : 1]); } }
      return out; }, id, where);
    st.J.forEach((x) => R.J.push([where, ...x])); st.M.forEach((x) => R.M.push([where, ...x])); st.Q.forEach((x) => R.Q.push([where, ...x])); st.P.forEach((x) => R.P.push([where, ...x]));
    // field hover with the real pointer: the box's paint at rest and while hovered
    for (let i = 0; i < st.fields.length && i < 8 && process.env.D9_ONLY !== 'static'; i++) {
      const read = () => p.evaluate((i) => { const e = document.querySelector(`[data-d9f="${i}"]`); let box = e; for (let k = 0, x = e; k < 3 && x; k++, x = x.parentElement) { const c = getComputedStyle(x); if (parseFloat(c.borderTopWidth) > 0 || c.boxShadow !== 'none' || !/rgba\(0, 0, 0, 0\)/.test(c.backgroundColor)) { box = x; break; } } const c = getComputedStyle(box); return { bc: c.borderTopColor, bw: c.borderTopWidth, sh: c.boxShadow, bg: c.backgroundColor, ol: c.outlineStyle + ' ' + c.outlineColor }; }, i);
      const h = await p.$(`[data-d9f="${i}"]`); if (!h) continue; await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await p.mouse.move(2, 2); await W.sleep(250); const rest = await read();
      try { await h.hover(); } catch (e) { continue; } await W.sleep(350); const hov = await read();
      const diff = Object.keys(rest).filter((k) => rest[k] !== hov[k]).map((k) => `${k}: ${rest[k]} → ${hov[k]}`); R.Fi.push([where, ...st.fields[i], diff.join(' · ') || 'no change']);
    }
    await p.mouse.move(2, 2); await p.evaluate(() => document.querySelectorAll('[data-d9f]').forEach((e) => e.removeAttribute('data-d9f')));
  }
  // menu items: open every pop-up, hover its first items with the real pointer
  for (const pop of W.POPS.filter((x) => !x.drawer && process.env.D9_ONLY !== 'static')) {
    const o = await W.openPop(p, pop); if (!o.ok) { R.Mi.push([pop.label, 'NOT OPENED', o.why]); continue; }
    const items = await p.evaluate((S) => { const pop = [...document.querySelectorAll(S)].find((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0); if (!pop) return []; const it = [...pop.querySelectorAll('li, [role=option], [role=menuitem], button, a')].filter((e) => e.getBoundingClientRect().height > 0); it.forEach((e, i) => e.setAttribute('data-d9m', i)); return it.slice(0, 6).map((e) => e.tagName.toLowerCase() + '.' + (e.className || '').toString().trim().split(/\s+/).slice(0, 2).join('.') + ' "' + e.textContent.trim().slice(0, 18) + '"'); }, W.POP_SEL);
    for (let i = 0; i < items.length; i++) { const read = () => p.evaluate((i) => { const e = document.querySelector(`[data-d9m="${i}"]`); const c = getComputedStyle(e); return { bg: c.backgroundColor, co: c.color, sh: c.boxShadow }; }, i);
      const h = await p.$(`[data-d9m="${i}"]`); if (!h) continue; const rest = await read(); try { await h.hover(); } catch (e) { continue; } await W.sleep(300); const hov = await read();
      R.Mi.push([pop.label, items[i], Object.keys(rest).filter((k) => rest[k] !== hov[k]).map((k) => `${k}: ${rest[k]} → ${hov[k]}`).join(' · ') || 'no change']); }
    await W.closePop(p);
  }
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
  const group = (rows, key) => { const g = {}; rows.forEach((r) => { const k = key(r); (g[k] = g[k] || []).push(r[0]); }); return Object.entries(g).sort((a, c) => c[1].length - a[1].length); };
  console.log('== Fi (field: element · its box · hover change)'); R.Fi.forEach((r) => console.log('  ' + r.join(' | ')));
  console.log('== Mi (pop-up · item · hover change)'); R.Mi.forEach((r) => console.log('  ' + r.join(' | ')));
  console.log('== J (radius · element) × count'); group(R.J, (r) => r[2] + 'px ' + r[1]).slice(0, 26).forEach(([k, v]) => console.log(`  ${k} ×${v.length} (${[...new Set(v)].slice(0, 3).join(', ')})`));
  console.log('== M (% of #04070A in --sunk · element) × count'); group(R.M, (r) => r[2] + '% ' + r[1]).slice(0, 30).forEach(([k, v]) => console.log(`  ${k} ×${v.length} (${[...new Set(v)].slice(0, 3).join(', ')})`));
  console.log('== Q (grid with a 33x px column)'); [...new Set(R.Q.map((r) => r.join(' | ')))].forEach((r) => console.log('  ' + r));
  console.log('== P (icon size · stroke-width) × count'); group(R.P, (r) => r[2] + 'px sw ' + r[3] + (r[4] ? ' attr ' + r[4] : '')).slice(0, 20).forEach(([k, v]) => console.log(`  ${k} ×${v.length}`));
  if (errs.length) console.log('page errors:', errs.slice(0, 3).join(' | '));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
