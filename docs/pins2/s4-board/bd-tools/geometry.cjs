// Board 4: Builder-2 · geometry.cjs — what a correction did to the layout, read from the DOM, no screenshots (Session 4, Adjuster A1, 2026-10-04
// 21:02 EDT; Harkirat 21:00 EDT, in place of the moved-element screenshot check). Per gate, per walk view and pop-up, both kits in lockstep, every
// element of the gate (and of an open pop-up) is read for four things, and only what the candidate has that the reference has not is reported:
//   lines      a text's line count (its own text nodes, measured by Range client rects): a new wrap
//   overflow   a box whose content is wider or taller than it (scrollWidth/Height over clientWidth/Height by more than 1px) where it clips or
//              shows an ellipsis: text cut off
//   overlap    two in-flow siblings whose boxes now intersect by more than 1px each way
//   clipped    an element sticking out of an ancestor that clips (overflow other than visible) by more than 1px
// Elements are matched by identity (tag + classes + own text + index, as audit.cjs), so a moved box keeps its key.
// Usage: node bd-tools/geometry.cjs [--ref <dir>] [--cand <dir>] [--gates C1,...] [--size 1282x888] [--css-cand "<css>"] [--label name]
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const { PNG } = require(path.join(ROOT, 'node_modules/pngjs'));
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const REF = A.ref || 'local/pins2/s4/struct-ref', CAND = A.cand || 'local/pins2/s4/builder-2'; const [W, H] = (A.size || '1282x888').split('x').map(Number);
const GSEL = A.gates ? A.gates.split(',') : L.GATES.map((g) => g[0]); const LABEL = A.label || 'geometry';
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/geometry'); fs.mkdirSync(OUT, { recursive: true });

const PROBE = (id, popSel) => {
  const cs = getComputedStyle; const own = (e) => e.tagName.toLowerCase() + [...e.classList].filter((c) => !c.startsWith('bd-')).sort().map((c) => '.' + c).join('') + '|' + [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('').replace(/\s+/g, ' ').trim().slice(0, 24);
  const roots = [document.getElementById(id), ...(popSel ? [...document.querySelectorAll(popSel)] : [])].filter(Boolean);
  const all = roots.flatMap((r) => [r, ...r.querySelectorAll('*')]); const seen = new Map(); const key = new Map();
  for (const e of all) { const o = own(e); const n = seen.get(o) || 0; seen.set(o, n + 1); key.set(e, o + '#' + n); }
  const vis = (e) => { const c = cs(e); if (c.display === 'none' || c.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const out = { lines: {}, overflow: {}, overlap: [], clipped: [], tops: [] };
  // every gate's top and every stage's top on a whole pixel (V2 F2, the lead: a class on all nine gates); measured in page coordinates
  for (const sec of document.querySelectorAll('section[id^="c-"], section[id^="c-"] .pb-stage')) { const y = sec.getBoundingClientRect().top + scrollY; if (Math.abs(y - Math.round(y)) > 0.005) out.tops.push(`${sec.id || sec.className.split(' ')[0]} top ${y.toFixed(3)}`); }
  for (const e of all) {
    if (e instanceof SVGElement && e.tagName !== 'svg') continue; if (!vis(e)) continue; const k = key.get(e); const c = cs(e);
    const t = [...e.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim());
    if (t.length) { const tops = new Set(); for (const n of t) { const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width > 0.5) tops.add(Math.round(q.top)); } out.lines[k] = tops.size; }
    if (c.overflowX !== 'visible' || c.overflowY !== 'visible' || c.textOverflow === 'ellipsis') { const ox = e.scrollWidth - e.clientWidth, oy = e.scrollHeight - e.clientHeight; if (ox > 1 || oy > 1) out.overflow[k] = `${Math.round(ox)}×${Math.round(oy)}`; }
    // sticking out of the nearest clipping ancestor
    if (!/fixed/.test(c.position) && !e.classList.contains('sr') && !(e.getBoundingClientRect().width <= 1.01 && e.getBoundingClientRect().height <= 1.01)) { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const ac = cs(a); if (ac.overflowX === 'visible' && ac.overflowY === 'visible') continue; const r = e.getBoundingClientRect(), ar = a.getBoundingClientRect();
        // a scroller's content is meant to run past it: only an element that is not inside the scrolled area counts
        if (/auto|scroll/.test(ac.overflowX + ac.overflowY)) break;
        const d = Math.max(ar.left - r.left, r.right - ar.right, ar.top - r.top, r.bottom - ar.bottom); if (d > 1) out.clipped.push(`${k} out of ${key.get(a) || a.tagName} by ${d.toFixed(1)}`); break; } }
    // in-flow siblings that now intersect
    const kids = [...e.children].filter((x) => vis(x) && !/absolute|fixed/.test(cs(x).position)); const R = kids.map((x) => x.getBoundingClientRect());
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const ix = Math.min(R[i].right, R[j].right) - Math.max(R[i].left, R[j].left), iy = Math.min(R[i].bottom, R[j].bottom) - Math.max(R[i].top, R[j].top); if (ix > 1 && iy > 1) out.overlap.push(`${key.get(kids[i])} × ${key.get(kids[j])}`); }
  }
  return out;
};
const diff = (a, b) => {
  const lines = Object.keys(b.lines).filter((k) => k in a.lines && b.lines[k] > a.lines[k]).map((k) => `${k}: ${a.lines[k]} → ${b.lines[k]} lines`);
  const overflow = Object.keys(b.overflow).filter((k) => !(k in a.overflow)).map((k) => `${k}: overflows ${b.overflow[k]}`);
  const ol = new Set(a.overlap), cl = new Set(a.clipped.map((x) => x.replace(/ by .*/, '')));
  // growth of an overflow or a clip the reference already had (V2 H5, 2026-10-05 00:56 EDT): a key present in both whose amount grew by more than
  // 1px is reported with both amounts, or a box that already overflowed by 2px and now cuts 6px of ink would read as "nothing new"
  const num = (v) => v.split('×').map(Number); const overflowGrew = Object.keys(b.overflow).filter((k) => k in a.overflow).filter((k) => { const [ax, ay] = num(a.overflow[k]), [bx, by] = num(b.overflow[k]); return bx > ax + 1 || by > ay + 1; }).map((k) => `${k}: overflow grew ${a.overflow[k]} → ${b.overflow[k]}`);
  const camt = new Map(a.clipped.map((x) => [x.replace(/ by .*/, ''), +x.replace(/.* by /, '')])); const clippedGrew = b.clipped.filter((x) => { const k = x.replace(/ by .*/, ''); return camt.has(k) && +x.replace(/.* by /, '') > camt.get(k) + 1; }).map((x) => `${x} (was ${camt.get(x.replace(/ by .*/, ''))})`);
  return { lines, overflow, overflowGrew, overlap: b.overlap.filter((x) => !ol.has(x)), clipped: b.clipped.filter((x) => !cl.has(x.replace(/ by .*/, ''))), clippedGrew, tops: b.tops };
};
// find the element by its identity key in the candidate, capture it with overflow hidden and visible, and say whether any pixel differs
async function inkHidden(K, id, popSel, key) {
  const box = await K.p.evaluate((id, popSel, key) => { const own = (e) => e.tagName.toLowerCase() + [...e.classList].filter((c) => !c.startsWith('bd-')).sort().map((c) => '.' + c).join('') + '|' + [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('').replace(/\s+/g, ' ').trim().slice(0, 24);
    const roots = [document.getElementById(id), ...(popSel ? [...document.querySelectorAll(popSel)] : [])].filter(Boolean); const seen = new Map(); let hit = null;
    for (const e of roots.flatMap((r) => [r, ...r.querySelectorAll('*')])) { const o = own(e); const n = seen.get(o) || 0; seen.set(o, n + 1); if (o + '#' + n === key) { hit = e; break; } }
    if (!hit) return null; hit.scrollIntoView({ block: 'center' }); window.__bdInk = hit; const r = hit.getBoundingClientRect(); return { x: r.left + scrollX - 4, y: r.top + scrollY - 6, w: r.width + 8, h: r.height + 12, ell: getComputedStyle(hit).textOverflow === 'ellipsis' }; }, id, popSel, key);
  if (!box || box.w < 1) return false; const clip = { x: Math.max(0, box.x), y: Math.max(0, box.y), width: box.w, height: box.h };
  // the mouse is parked off the page first, so a hover that scrollIntoView slid under the pointer cannot differ between the two shots
  await K.p.mouse.move(0, 0); await L.settle(K.p); const a = PNG.sync.read(Buffer.from(await K.p.screenshot({ clip }))); await K.p.evaluate(() => { window.__bdInk.style.setProperty('overflow', 'visible', 'important'); }); await L.settle(K.p);
  const b = PNG.sync.read(Buffer.from(await K.p.screenshot({ clip }))); await K.p.evaluate(() => { window.__bdInk.style.removeProperty('overflow'); }); await L.settle(K.p);
  // ink the overflow hid can only appear OUTSIDE the element's own box (the 4px/6px margin of the clip): only those pixels are compared, and a
  // channel must move by more than 24 of 255, so a re-rasterised edge inside the box does not count (2026-10-04 22:31 EDT: three C3 f-om rows
  // flagged with no visible difference at DPR 4)
  const dpr = a.width / clip.width; const ix0 = Math.round((box.x + 4 - clip.x) * dpr), iy0 = Math.round((box.y + 6 - clip.y) * dpr), ix1 = Math.round((box.x + box.w - 4 - clip.x) * dpr), iy1 = Math.round((box.y + box.h - 6 - clip.y) * dpr);
  let n = 0; // an ellipsized line hides the rest of its sentence by design: only the bands above and below its box count for it (2026-10-05 01:27 EDT)
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) { if (x >= ix0 && x < ix1 && y >= iy0 && y < iy1) continue; if (box.ell && y >= iy0 && y < iy1) continue; const i = (y * a.width + x) * 4; if (Math.abs(a.data[i] - b.data[i]) > 24 || Math.abs(a.data[i + 1] - b.data[i + 1]) > 24 || Math.abs(a.data[i + 2] - b.data[i + 2]) > 24) n++; }
  return n > 0;
}
(async () => {
  const { server, base } = await L.serve(); const bs = await Promise.all([L.launch(W, H), L.launch(W, H)]); const report = { ref: REF, cand: CAND, size: `${W}x${H}`, at: new Date().toISOString(), views: [] };
  try {
    const Ks = await Promise.all([L.openKit(bs[0], base, REF, W, H), L.openKit(bs[1], base, CAND, W, H, A['css-cand'] ? { css: A['css-cand'] } : {})]);
    for (const G of L.GATES.filter((g) => GSEL.includes(g[0]))) {
      const [gid, id] = G; await Promise.all(Ks.map((K) => K.load())); const acts = await L.actions(Ks[0].p, id);
      const read = async (view, pop) => { const [a, b] = await Promise.all(Ks.map((K) => K.p.evaluate(PROBE, id, pop || null))); const d = diff(a, b);
        // an overflow is a finding only if it hides ink: the element is captured with its overflow hidden and again visible, and the two compared
        d.overflowInk = []; for (const o of d.overflow) { const k = o.replace(/: overflows .*/, ''); const hid = await inkHidden(Ks[1], id, pop, k); if (hid) d.overflowInk.push(o + ' · hides ink'); }
        for (let i = 0; i < d.overflowGrew.length; i++) { const k = d.overflowGrew[i].replace(/: overflow grew .*/, ''); if (await inkHidden(Ks[1], id, pop, k)) d.overflowGrew[i] += ' · hides ink'; }
        const n = d.lines.length + d.overflowInk.length + d.overlap.length + d.clipped.length + d.tops.length + d.overflowGrew.length + d.clippedGrew.length; report.views.push({ gate: gid, view, n, ...d }); console.log(`${gid} ${view}: new wraps ${d.lines.length} · overflow ${d.overflow.length} (hiding ink ${d.overflowInk.length}) · overlaps ${d.overlap.length} · clipped ${d.clipped.length} · fractional tops ${d.tops.length} · grew ${d.overflowGrew.length + d.clippedGrew.length} (hiding ink ${d.overflowGrew.filter((x) => x.endsWith('hides ink')).length})`); };
      await Promise.all(Ks.map((K) => L.scrollTo(K, id))); await read('rest');
      for (let v = 0; v < acts.length; v++) { await Promise.all(Ks.map((K) => L.act(K, id, acts[v][0], acts[v][1]))); await Promise.all(Ks.map((K) => L.scrollTo(K, id))); await read(`${v + 1}-${acts[v][2]}`); }
      for (const P of L.POPS.filter((x) => x.g === gid)) { await Promise.all(Ks.map(async (K) => { await K.load(); await L.setState(K, P.id, P.state); await L.clickReal(K, P.trigger); })); await read('pop-' + P.label, P.sel || L.POP_SEL); }
    }
  } finally { await Promise.all(bs.map((b) => b.close())); server.close(); }
  fs.writeFileSync(path.join(OUT, `${LABEL}.json`), JSON.stringify(report, null, 1)); const tot = report.views.reduce((s, v) => s + v.n, 0); // n counts overflow only where it hides ink
  console.log(`geometry ${LABEL}: ${report.views.length} views · ${tot} new findings · report ${path.relative(ROOT, path.join(OUT, LABEL + '.json'))}`); process.exit(0);
})().catch((e) => { console.error('geometry failed:', e && e.stack || e); process.exit(2); });
