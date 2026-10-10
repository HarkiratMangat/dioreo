// Session 4 · every element of every view of Board 4, measured, for the board-wide difference census (diff-analyse.py reads it).
// Why: Harkirat, 2026-10-02 18:24 EDT — "standardization means correcting all things … you really didn't consider the border->column gap",
// then 18:26 EDT: "FIND EVERY DIFFERENCE IN A SURFACE ACROSS THE BOARD." Every tool before this measured an element's own style, or the
// relations someone had already named; none could find a relation nobody had named. This one records, for every visible element of every
// view (each gate at rest, after each state and Try button, and each pop-up and drawer board4-walk knows), its classes, its box, its own
// style, its own text ink, and its ::before/::after; the analysis derives the relations (insets from every painted edge, gaps between
// siblings) and compares each across the board. Run with repo-static on :8900:  node local/pins2/s4/work/lead/diff-census.cjs
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const OUT = path.join(__dirname, 'diff'); fs.mkdirSync(OUT, { recursive: true });
const PROPS = ['font-size', 'font-weight', 'font-family', 'letter-spacing', 'line-height', 'text-transform', 'color', 'background-color', 'background-image',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius', 'box-shadow', 'outline-width', 'outline-color', 'opacity',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'column-gap', 'row-gap', 'display', 'grid-template-columns', 'text-align', 'justify-content', 'align-items',
  'font-style', 'text-decoration-line', 'fill', 'stroke', 'stroke-width', 'cursor', 'flex-direction'];
const COLOR_PROPS = new Set(['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'fill', 'stroke']);
async function measure(p, scope, label) {
  await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}' }); await W.sleep(150);
  return p.evaluate((scope, PROPS, CP) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true }); const cache = {};
    const col = (c) => { if (!c || c === 'none' || /url\(/.test(c)) return c; if (cache[c]) return cache[c]; cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return (cache[c] = d[3] === 0 ? 'transparent' : `${d[0]},${d[1]},${d[2]}${d[3] < 255 ? ',' + (d[3] / 255).toFixed(2) : ''}`); };
    const shadow = (v) => (v === 'none' ? v : v.replace(/(rgba?|oklch|oklab|color|lab|lch|hsla?)\([^()]*(\([^()]*\)[^()]*)*\)/g, (m) => '[' + col(m) + ']'));
    const sx = window.scrollX, sy = window.scrollY; const R = (r) => [+(r.left + sx).toFixed(1), +(r.top + sy).toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)];
    let roots;
    if (scope.kind === 'stage') roots = [...document.querySelectorAll(scope.sel)].filter((e) => e.getBoundingClientRect().width > 0);
    else roots = [...document.querySelectorAll(scope.sel)].filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0);
    const out = []; const idx = new Map();
    const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return null; const r = e.getBoundingClientRect(); if (r.width < 0.5 || r.height < 0.5) return null; return [cs, r]; };
    const walk = (e, par) => {
      const v = vis(e); if (!v) return; const [cs, r] = v; const i = out.length; idx.set(e, i);
      const s = PROPS.map((k) => { let x = cs.getPropertyValue(k); if (CP.includes(k)) x = col(x); else if (k === 'box-shadow') x = shadow(x); else if (k === 'font-family') x = x.split(',')[0].replace(/["']/g, '').trim(); else if (k === 'background-image') x = x === 'none' ? x : shadow(x).slice(0, 160); return x; });
      let ink = null; for (const n of e.childNodes) { if (n.nodeType !== 3 || !n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) { if (q.width < 0.5) continue; const a = R(q); ink = ink ? [Math.min(ink[0], a[0]), Math.min(ink[1], a[1]), Math.max(ink[0] + ink[2], a[0] + a[2]) - Math.min(ink[0], a[0]), Math.max(ink[1] + ink[3], a[1] + a[3]) - Math.min(ink[1], a[1])] : a; } }
      const txt = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim().slice(0, 40);
      const ps = {}; for (const pe of ['::before', '::after']) { const q = getComputedStyle(e, pe); if (q.content && q.content !== 'none' && q.content !== 'normal' && q.display !== 'none') ps[pe] = [q.content.slice(0, 20), q.width, q.height, col(q.backgroundColor), q.borderTopWidth + ' ' + col(q.borderTopColor), q.position, q.left, q.top, q.right, q.bottom, q.fontSize, col(q.color), q.opacity]; }
      const cls = (typeof e.className === 'string' ? e.className : e.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).sort().join('.');
      const ph = e.placeholder ? [e.placeholder.slice(0, 24), col(getComputedStyle(e, '::placeholder').color)] : null;
      // the element's state, so a pressed chip is compared with pressed chips and not with resting ones whose class list is the same
      const sta = ['aria-pressed', 'aria-selected', 'aria-current', 'aria-checked', 'aria-expanded', 'disabled'].filter((k) => e.hasAttribute(k) && e.getAttribute(k) !== 'false').map((k) => k.replace('aria-', '')).concat(e.checked ? ['checked'] : []).join('+');
      out.push({ i, par, tag: e.tagName.toLowerCase(), cls, sta: sta || undefined, txt, b: R(r), s, ink, ps: Object.keys(ps).length ? ps : undefined, ph: ph || undefined, nk: e.children.length });
      for (const c of e.children) walk(c, i);
    };
    for (const r of roots) walk(r, -1);
    return out;
  }, scope, PROPS, [...COLOR_PROPS]);
}
(async () => {
  const { b, p, errs } = await W.open(); await p.setRequestInterception(true);
  p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  const reload = async () => { await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await p.evaluate(() => document.fonts.ready); await W.sleep(900); };
  const views = []; const t0 = Date.now();
  for (const [g, id, name] of W.GATES) {
    await reload(); const acts = await W.actions(p, id);
    const active = await p.evaluate((id) => { const b = [...document.getElementById(id).querySelectorAll('.pb-ctl button')].find((x) => x.classList.contains('on') || x.getAttribute('aria-pressed') === 'true' || x.getAttribute('aria-selected') === 'true'); return b ? b.textContent.trim() : null; }, id);
    for (const a of [null, ...acts]) {
      if (a && a[0] === 'state' && a[2] === active) continue;
      if (a) { await reload(); await W.act(p, id, a[0], a[1]); }
      const view = { g, id, name, kind: a ? a[0] : 'rest', label: a ? a[2] : (active || 'rest') };
      view.els = await measure(p, { kind: 'stage', sel: W.STAGE(id) }, view.label); views.push(view);
      console.log(`${g} ${id} · ${view.kind} ${view.label}: ${view.els.length} elements`);
    }
  }
  for (const pop of W.POPS) {
    await reload(); const o = await W.openPop(p, pop);
    if (!o.ok) { console.log(`POP ${pop.label}: NOT OPENED (${o.why})`); views.push({ g: pop.g, id: pop.id, name: pop.label, kind: 'pop', label: pop.label, els: [], miss: o.why }); continue; }
    const view = { g: pop.g, id: pop.id, name: pop.label, kind: pop.drawer ? 'drawer' : 'pop', label: pop.label };
    view.els = await measure(p, { kind: 'pop', sel: pop.sel || W.POP_SEL }, pop.label); views.push(view);
    console.log(`POP ${pop.label}: ${view.els.length} elements`);
  }
  fs.writeFileSync(path.join(OUT, 'dump.json'), JSON.stringify({ when: new Date().toISOString(), props: PROPS, views, errs }));
  console.log(`views ${views.length} · elements ${views.reduce((n, v) => n + v.els.length, 0)} · page errors ${errs.length} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
