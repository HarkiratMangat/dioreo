// Board 4 · the readiness sweep (2026-09-29 23:23 EDT, his "every element … fully and honestly ready for session 4/5"): every HANDOFF row that had never
// been opened on the current kit ("built per the record", "measured, plan §19z", "v35/v36") is opened here at Version 45 — each one's surface captured at
// 2x into docs/pins2/intake-shots/readiness-v45/ and its checkable clauses read off the page. The crops are judged by eye one at a time; the numbers print.
// Usage (the kit on :8900): node docs/pins2/instruments/board4-readiness.cjs  → one JSON object of measurements, and the crops
const W = require('../final/board4-spec/board4-walk.cjs');
const D = require('path').resolve(__dirname, '../intake-shots/readiness-v45');
(async () => {
  const { b, p, errs } = await W.open(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 }); await W.sleep(600);
  const out = {}; const miss = [];
  const shot = async (sel, name) => { const el = await p.$(sel); if (!el) { miss.push(name + ' ← ' + sel); return false; } await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); await W.sleep(200); await el.screenshot({ path: `${D}/${name}.png` }); return true; };
  const ev = (fn, ...a) => p.evaluate(fn, ...a).catch((e) => 'ERR ' + e.message);
  // tag the nth build row of a weapon on the manifest
  const tagRow = (w, n, id) => ev((w, n, id) => { const leaf = [...document.querySelectorAll('#c-manifest *')].find((e) => e.children.length === 0 && e.textContent.trim() === w); if (!leaf) return false;
    let g = leaf; while (g && !g.querySelector('.wg-r')) g = g.parentElement; if (!g) return false; const r = g.querySelectorAll('.wg-r')[n - 1]; if (!r) return false; r.id = id; return true; }, w, n, id);
  const tagHead = (w, id) => ev((w, id) => { const leaf = [...document.querySelectorAll('#c-manifest *')].find((e) => e.children.length === 0 && e.textContent.trim() === w); if (!leaf) return false;
    let h = leaf; while (h && h.parentElement && !h.parentElement.querySelector('.wg-r')) h = h.parentElement; h.id = id; return true; }, w, id);

  // ── C1 · the manifest
  for (const [w, n, id] of [['HOLGER 26', 1, 'r-capable'], ['KILO 141', 1, 'r-ass'], ['JAK-12', 1, 'r-jak']]) { await tagRow(w, n, id); await shot('#' + id, `C1-${id}`); }
  out.badgeRuns = await ev(() => ['r-capable', 'r-ass', 'r-jak'].map((id) => { const r = document.getElementById(id); if (!r) return null; const bd = [...r.querySelectorAll('.b3-bdgs .b3-bdg')];
    return { id, badges: bd.map((x) => x.textContent.trim()).join(' · '), lines: new Set(bd.map((x) => Math.round(x.getBoundingClientRect().top))).size, dots: [...r.querySelectorAll('.b3-bdgs .sep')].filter((s) => getComputedStyle(s).display !== 'none').length }; }));
  await tagHead('AK117', 'h-ak'); await shot('#h-ak', 'C1-group-head');
  out.manifestHead = await ev(() => { const h = document.getElementById('h-ak'); if (!h) return null; const r = h.getBoundingClientRect(); const cat = [...h.querySelectorAll('*')].find((e) => e.children.length === 0 && /^assault$/i.test(e.textContent.trim()));
    const c = cat && cat.getBoundingClientRect(); return c ? { catCentreOff: Math.round(((c.top + c.bottom) / 2 - (r.top + r.bottom) / 2) * 10) / 10, catText: getComputedStyle(cat).textTransform } : 'no category leaf'; });
  const sh = await p.$('#c-manifest .wg-share'); if (sh) { await sh.evaluate((e) => e.scrollIntoView({ block: 'center' })); const q = await sh.boundingBox(); await p.mouse.move(q.x + q.width / 2, q.y + q.height / 2); await W.sleep(300);
    out.shareHover = await ev(() => { const e = document.querySelector('#c-manifest .wg-share'); return getComputedStyle(e).color + ' / ' + getComputedStyle(e, '::before').boxShadow; }); await shot('#c-manifest .wg-acts', 'C1-share-hover'); await p.mouse.move(2, 2); }
  await ev(() => { const all = [...document.querySelectorAll('#c-manifest button')].find((b) => /^All\s*\d/.test(b.textContent.trim())); if (all) all.parentElement.id = 'cat-row'; });
  await shot('#cat-row', 'C1-category-toggles');
  await W.act(p, 'c-manifest', 'try', 3); await W.sleep(900);
  out.selectionBar = await ev(() => { const d = document.querySelector('#c-manifest .b3-sd'); if (!d) return 'no .b3-sd'; const c = getComputedStyle(d); return { shadow: c.boxShadow.slice(0, 90), border: c.borderTop + ' / ' + c.outline }; });
  await shot('#c-manifest .b3-sd', 'C1-selection-bar');
  await W.act(p, 'c-manifest', 'try', 5); await W.sleep(600);
  // ── C2 · the build drawer
  const dr = '#c-new-build .drawer';
  await W.setState(p, 'c-new-build', 'Add build'); await shot(dr, 'C2-add');
  out.add = await ev(() => { const g = document.querySelector('#c-new-build'); const fld = g.querySelector('.f-fld'), tier = g.querySelector('.f-tiers, .f-tier');
    return { fieldRadius: fld && getComputedStyle(fld).borderRadius, tierRadius: tier && getComputedStyle(tier).borderRadius, optionalChips: [...g.querySelectorAll('.f-h')].filter((h) => /Optional/.test(h.textContent)).map((h) => h.textContent.replace(/\s+/g, ' ').trim().slice(0, 24)),
      stage: Boolean(g.querySelector('.f-stage, .f-stm')), uncheckedOpacity: [...g.querySelectorAll('.f-bdgs .wg-cb[aria-checked=false] .b3-bdg, .f-bdgs [aria-checked=false] .b3-bdg')].slice(0, 1).map((x) => getComputedStyle(x.closest('[aria-checked]')).opacity + '/' + getComputedStyle(x).opacity) }; });
  await W.setState(p, 'c-new-build', 'Add · filled'); await W.sleep(1800); await shot(dr, 'C2-filled');
  out.filled = await ev(() => { const g = document.querySelector('#c-new-build'); const w = g.querySelector('.f-wand'); return { wand: w && getComputedStyle(w).color, filledChip: [...g.querySelectorAll('.f-h')].map((h) => h.textContent.replace(/\s+/g, ' ').trim()).find((t) => /Filled/.test(t)) || null }; });
  await W.setState(p, 'c-new-build', 'Add · three'); await shot(dr, 'C2-three');
  out.three = await ev(() => [...document.querySelectorAll('#c-new-build .f-card-b')].map((c) => c.style.getPropertyValue('--f-hue')));
  for (const st of ['Bulk · several', 'DMZ', 'Edit 3 builds']) { await W.setState(p, 'c-new-build', st); await shot(dr, 'C2-' + st.replace(/\W+/g, '-')); }
  out.edit = await ev(() => { const t = document.querySelector('#c-new-build .drawer').textContent; return /Editing/.test(t) ? t.match(/Editing[^A-Za-z]*[A-Z0-9][^\n]{0,30}/)?.[0] : 'no Editing'; });
  // ── C4 · C5 · C6 · C7 · C9
  await W.setState(p, 'c-repairs', 'Today’s'); await shot(W.STAGE('c-repairs'), 'C4-today');
  await W.setState(p, 'c-repairs', 'A clean day'); await shot(W.STAGE('c-repairs'), 'C4-clean');
  await W.setState(p, 'c-export', 'Three picked'); await shot(W.STAGE('c-export'), 'C5-three-picked');
  await shot(W.STAGE('c-queue'), 'C6-queue');
  await W.setState(p, 'c-broadcast', 'Saved'); await shot('#c-broadcast table.mtable', 'C7-rows');
  await W.setState(p, 'c-broadcast', 'Posting'); await shot('#c-broadcast .drawer', 'C7-post');
  await W.setState(p, 'c-admin', 'Product traffic'); await shot(W.STAGE('c-admin'), 'C9-admin');
  out.miss = miss; out.pageErrors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
