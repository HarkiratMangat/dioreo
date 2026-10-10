// Board 4: Builder-2 · fidelity.cjs — does a candidate kit look and behave exactly like a reference kit? (Session 4, builder R1, 2026-10-03 23:50 EDT.)
// Walks every view of every gate (docs/pins2/final/board4-spec/board4-walk.cjs: rest, each state, each Try step, each pop-up) on BOTH kits in
// lockstep, at each size, DPR 2, with the clock, the dice, fonts and animations held identical (fidlib.cjs), and reports per view:
//   changed pixels (pixelmatch, threshold 0, anti-aliasing counted), the behaviour fingerprint (tab order, Chrome's own accessibility tree:
//   role, name, pressed/selected/checked/expanded, plus the visible text), and page errors. Then per gate, one element of every control role
//   hovered, focus-visible and pressed. Crops of any difference go to the crops folder as [reference | candidate | difference] at 2x.
// Usage:  node bd-tools/fidelity.cjs --ref local/pins2/s4/ref-kit --cand local/pins2/s4/builder-2 [--gates C1,C7] [--sizes 1480x834,1282x888]
//         [--label name] [--mask masks.json] [--geom geom.json] [--no-roles] [--no-pops] [--views regex]
//         [--css-ref|--css-cand "<style>"] [--js-ref|--js-cand "<script run after each step>"]   (falsifiers: planted in the page, never in a file)
// mask.json: { "<WxH>/<view key>": [[x, y, w, h], ...] } in CSS px of that view's image; change inside is allowed and not counted.
// geom.json: [{ "view": "C1/00-rest", "size": "1480x834"?, "page": "cand"|"ref", "sel": "...", "nth": 0, "edge": "left|right|top|bottom|cx|cy",
//              "of": "box|ink", "target": <number> | { "sel", "nth", "edge", "of" }, "tol": 0.25, "name": "..." }]  (the Adjuster's helper)
const path = require('path'); const fs = require('fs'); const vm = require('vm');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const { PNG } = require(path.join(ROOT, 'node_modules/pngjs'));
const pixelmatch = require(path.join(ROOT, 'node_modules/pixelmatch'));

const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1];
  if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const REF = A.ref || 'local/pins2/s4/ref-kit', CAND = A.cand || 'local/pins2/s4/builder-2';
const SIZES = (A.sizes || '1480x834,1282x888').split(',').map((s) => s.split('x').map(Number));
const GSEL = A.gates ? A.gates.split(',') : L.GATES.map((g) => g[0]);
const LABEL = A.label || `run-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/runs', LABEL); const CROPS = path.join(ROOT, 'local/pins2/s4/rebuild/crops', LABEL);
fs.mkdirSync(OUT, { recursive: true });
const MASK = A.mask ? JSON.parse(fs.readFileSync(path.resolve(A.mask), 'utf8')) : {};
const GEOM = A.geom ? JSON.parse(fs.readFileSync(path.resolve(A.geom), 'utf8')) : [];
const VIEWRE = A.views ? new RegExp(A.views) : null;

// ── --auto-mask (A1, 2026-10-04 17:38 EDT): the mask is built from the trees themselves, never from one selector (A1.md § Whole pixels: "build the declared
// region from a computed-style diff of struct-ref against your tree"). At each shot both pages report, for every element in the window, a
// signature of its own computed style (sizes, spaces, strokes, type, transform, its ::before/::after) and its box. Matched by identity (tag +
// classes + own text + index, audit.cjs's key):
//   declared   the signature differs (or the element exists on one side only): both boxes, padded 2px, are masked
//   ripple     the signature is the same and the box moved or resized: both boxes, padded 2px, are masked too, and counted apart
// What is left outside both is a pixel no changed or moved element explains: the proof requires 0. The counts of each kind are reported.
const AUTOMASK = !!A['auto-mask'];
const SIGPROBE = () => {
  const P = ['fontSize', 'lineHeight', 'fontWeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'rowGap', 'columnGap',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'outlineWidth', 'outlineOffset', 'transform', 'boxShadow', 'textBoxTrim', 'textBoxEdge', 'display', 'borderTopLeftRadius', 'gridTemplateColumns'];
  const PP = ['content', 'fontSize', 'lineHeight', 'width', 'height', 'top', 'left', 'right', 'bottom', 'paddingTop', 'paddingLeft', 'marginRight', 'marginLeft', 'transform', 'boxShadow', 'borderTopWidth'];
  const own = (e) => e.tagName.toLowerCase() + [...e.classList].filter((c) => !c.startsWith('bd-')).sort().map((c) => '.' + c).join('') + '|' + [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('').replace(/\s+/g, ' ').trim().slice(0, 24);
  const seen = new Map(); const out = {}; const W = innerWidth, H = innerHeight;
  for (const e of document.querySelectorAll('body *')) {
    const o = own(e); const n = seen.get(o) || 0; seen.set(o, n + 1);
    const r = e.getBoundingClientRect(); if (r.width === 0 && r.height === 0) continue; if (r.bottom < -40 || r.top > H + 40 || r.right < -40 || r.left > W + 40) continue;
    const c = getComputedStyle(e); const text = [...e.childNodes].some((x) => x.nodeType === 3 && x.nodeValue.trim()) || /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName);
    const paints = text || /^(IMG|SVG|CANVAS|VIDEO|INPUT|TEXTAREA|SELECT)$/i.test(e.tagName) || c.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor) || ['Top', 'Right', 'Bottom', 'Left'].some((k) => parseFloat(c['border' + k + 'Width']) > 0 && c['border' + k + 'Style'] !== 'none') || c.boxShadow !== 'none' || (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0);
    // a positioned element's own offsets are part of what it declares (the problem card's tape moved from top 10.5 to 10 and read as ripple)
    const parts = [P.filter((k) => text || !/^(fontSize|lineHeight|fontWeight)$/.test(k)).map((k) => c[k]).join('|') + (/absolute|fixed|relative|sticky/.test(c.position) ? '|' + ['top', 'right', 'bottom', 'left'].map((k) => c[k]).join('|') : '')]; const rects = [[r.x, r.y, r.width, r.height]]; let pp = false;
    for (const pe of ['::before', '::after']) { const q = getComputedStyle(e, pe); if (q.content === 'none' || q.content === 'normal') continue; pp = true; parts.push(pe + PP.map((k) => q[k]).join('|'));
      if (/absolute|fixed/.test(q.position)) { const px = (v) => parseFloat(v) || 0; const x = q.left !== 'auto' ? r.x + px(q.left) : r.right - px(q.right) - px(q.width); const y = q.top !== 'auto' ? r.y + px(q.top) : r.bottom - px(q.bottom) - px(q.height); rects.push([x, y, px(q.width) || r.width, px(q.height) || r.height]); } }
    // how far the element paints outside its box: an outer shadow (offset + blur + spread) or an outline. A resized card's glow changed 12px out
    // from its edge while the mask padded 2px (C1 'Open another', 2026-10-04 20:27 EDT)
    let ext = 0; { let t = c.boxShadow; if (t && t !== 'none') { for (let k = 0; k < 4; k++) t = t.replace(/[a-z-]+\([^()]*\)/gi, ' '); for (const sh of t.split(',')) { if (/inset/.test(sh)) continue; const v = sh.trim().split(/\s+/).filter((x) => /^-?[\d.]+px$/.test(x)).map(parseFloat); if (v.length >= 3) ext = Math.max(ext, Math.abs(v[0]) + Math.abs(v[1]) + (v[2] || 0) + Math.max(0, v[3] || 0)); } }
      if (c.outlineStyle !== 'none') ext = Math.max(ext, (parseFloat(c.outlineWidth) || 0) + Math.max(0, parseFloat(c.outlineOffset) || 0)); }
    out[o + '#' + n] = { s: parts.join('§'), rects, p: paints || pp, t: text, x: Math.ceil(ext) };
  }
  return out;
};
// a box that paints nothing is never masked (its children carry their own rows); a painted box that only RESIZED, with no text of its own, is masked
// along its edges only (where its fill and border moved), so a panel that grew 2px cannot hide a change inside it
function autoMask(ma, mb) {
  const dec = [], rip = [], moves = []; let nd = 0, nr = 0; let X = 0; const pad = (q) => [q[0] - 2 - X, q[1] - 2 - X, q[2] + 4 + 2 * X, q[3] + 4 + 2 * X];
  const edges = (q, r) => { const x0 = Math.min(q[0], r[0]), y0 = Math.min(q[1], r[1]), x1 = Math.max(q[0] + q[2], r[0] + r[2]), y1 = Math.max(q[1] + q[3], r[1] + r[3]); const ix0 = Math.max(q[0], r[0]), iy0 = Math.max(q[1], r[1]), ix1 = Math.min(q[0] + q[2], r[0] + r[2]), iy1 = Math.min(q[1] + q[3], r[1] + r[3]);
    const e = 2 + X; return [[x0 - e, y0 - e, x1 - x0 + 2 * e, iy0 - y0 + 2 * e], [x0 - e, iy1 - e, x1 - x0 + 2 * e, y1 - iy1 + 2 * e], [x0 - e, y0 - e, ix0 - x0 + 2 * e, y1 - y0 + 2 * e], [ix1 - e, y0 - e, x1 - ix1 + 2 * e, y1 - y0 + 2 * e]]; };
  for (const k of new Set([...Object.keys(ma), ...Object.keys(mb)])) { const a = ma[k], b = mb[k]; X = Math.max((a && a.x) || 0, (b && b.x) || 0);
    if (!a || !b || a.s !== b.s) { nd++; for (const x of [a, b]) if (x && x.p) dec.push(...x.rects.map(pad)); continue; }
    if (JSON.stringify(a.rects.map((q) => q.map((v) => Math.round(v * 100)))) === JSON.stringify(b.rects.map((q) => q.map((v) => Math.round(v * 100))))) continue;
    nr++; if (a.p && a.rects.length === 1 && Math.abs(a.rects[0][2] - b.rects[0][2]) < 0.01 && Math.abs(a.rects[0][3] - b.rects[0][3]) < 0.01 && a.rects[0][2] * a.rects[0][3] < 120000) moves.push({ k, a: a.rects[0], b: b.rects[0] });
    if (!a.p) continue; const moved = Math.abs(a.rects[0][0] - b.rects[0][0]) > 0.005 || Math.abs(a.rects[0][1] - b.rects[0][1]) > 0.005;
    if (moved || a.t || a.rects.length > 1) rip.push(...a.rects.map(pad), ...b.rects.map(pad)); else rip.push(...edges(a.rects[0], b.rects[0])); }
  return { dec, rip, nd, nr, moves };
}
// moveCheck (a screenshot comparison of moved elements) was removed 2026-10-04 21:17 EDT, Harkirat 21:00 EDT: in A-M1 every move was a fraction of a
// device pixel, so it compared nothing; geometry.cjs (line counts, overflow, overlaps, clipping, from the DOM) checks the moved layout instead.
const INJ = { ref: { css: A['css-ref'] || '', js: A['js-ref'] || '' }, cand: { css: A['css-cand'] || '', js: A['js-cand'] || '' } };

// the control roles, from Builder-2's identity table (bd/identity.js beside this tool, whichever kits are compared) (rows before the first box row): one element of each is hovered, focused and pressed
function controlRoles() {
  const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'bd/identity.js'), 'utf8'), ctx);
  const rows = ctx.window.BD_IDENTITY || []; const cut = rows.findIndex((r) => r[1] === 'Toolbar'); return rows.slice(0, cut < 0 ? rows.length : cut).map((r) => ({ sel: r[0], role: r[1] }));
}

// ── the pixel diff: exact (threshold 0, anti-aliasing counted); a size mismatch counts the non-overlapping area as changed
function decode(buf) { return PNG.sync.read(Buffer.isBuffer(buf) ? buf : Buffer.from(buf)); }
function diffImages(ba, bb, maskRects, dpr) {
  const a = decode(ba), b = decode(bb); const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const crop = (img) => { if (img.width === w && img.height === h) return img.data; const o = Buffer.alloc(w * h * 4); for (let y = 0; y < h; y++) img.data.copy(o, y * w * 4, y * img.width * 4, y * img.width * 4 + w * 4); return o; };
  const da = crop(a), db = crop(b);
  // the mask is a bitmap, filled row by row: a full-board token change gives thousands of rects, and copying them pixel by pixel per rect hung
  // the tool for twenty minutes (A1, 2026-10-04 18:10 EDT)
  if (maskRects && maskRects.length) { const M = new Uint8Array(w * h); for (const [x, y, mw, mh] of maskRects) { const x0 = Math.max(0, Math.floor(x * dpr)), x1 = Math.min(w, Math.ceil((x + mw) * dpr)); if (x1 <= x0) continue;
      for (let yy = Math.max(0, Math.floor(y * dpr)); yy < Math.min(h, Math.ceil((y + mh) * dpr)); yy++) M.fill(1, yy * w + x0, yy * w + x1); }
    for (let j = 0; j < w * h; j++) if (M[j]) { const i = j * 4; db[i] = da[i]; db[i + 1] = da[i + 1]; db[i + 2] = da[i + 2]; db[i + 3] = da[i + 3]; } }
  const out = new PNG({ width: w, height: h });
  const n = pixelmatch(da, db, out.data, w, h, { threshold: 0, includeAA: true, diffMask: true, diffColor: [255, 0, 0] });
  const extra = a.width * a.height + b.width * b.height - 2 * w * h; // area only one image has (counted once each side, halved below)
  let bx = null; if (n) { let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (out.data[(y * w + x) * 4 + 3]) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } bx = [x0, y0, x1, y1]; }
  return { changed: n + Math.round(extra / 2), total: Math.max(a.width * a.height, b.width * b.height), sizeA: [a.width, a.height], sizeB: [b.width, b.height], bbox: bx, a, b, w, h, da, db, out };
}
// a view is a set of viewport shots (fidlib shotSet); the sets must have the same pages, then each pair is diffed and the changes summed
function diffSets(A_, B_, name) {
  const out = { changed: 0, total: 0, crops: [], pages: [], sizeB: [0, 0], bbox: null };
  // a page only one side has is a whole page changed: a structure change that adds or removes a scroller, or makes a gate taller than the window,
  // used to be recorded here and still read 0 (V1 #2, 2026-10-04 01:48 EDT)
  const names = (x) => x.map((s) => s.name).join(','); if (names(A_) !== names(B_)) out.pages.push(`pages differ: ref ${names(A_)} · cand ${names(B_)}`);
  for (const [one, other] of [[A_, B_], [B_, A_]]) for (const s of one) if (!other.find((x) => x.name === s.name)) { const img = decode(s.png); out.changed += img.width * img.height; out.total += img.width * img.height; }
  for (const sa of A_) { const sb = B_.find((s) => s.name === sa.name); if (!sb) continue; let m = MASK[`${name}#${sa.name}`];
    if (AUTOMASK && sa.meta && sb.meta) { const am = autoMask(sa.meta, sb.meta); out.declared = (out.declared || 0) + am.nd; out.ripple = (out.ripple || 0) + am.nr;
      const dOnly = diffImages(sa.png, sb.png, [...(m || []), ...am.dec], 2); out.outsideDeclared = (out.outsideDeclared || 0) + dOnly.changed; out.raw = (out.raw || 0) + diffImages(sa.png, sb.png, m, 2).changed; m = [...(m || []), ...am.dec, ...am.rip]; }
    const d = diffImages(sa.png, sb.png, m, 2);
    out.changed += d.changed; out.total += d.total; out.sizeB = d.sizeB; if (d.changed) { out.pages.push(`${sa.name}: ${d.changed}px bbox ${d.bbox ? d.bbox.map((v) => v / 2).join(',') : 'size'}`); const c = saveCrop(d, `${name}#${sa.name}`); if (c) out.crops.push(c); } }
  return out;
}
function saveCrop(d, name) {
  if (!d.bbox && d.sizeA.join() === d.sizeB.join()) return null;
  const pad = 24; let [x0, y0, x1, y1] = d.bbox || [0, Math.min(d.a.height, d.b.height) - 2, d.w - 1, Math.min(d.a.height, d.b.height) - 1];
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(d.w - 1, x1 + pad); y1 = Math.min(d.h - 1, Math.min(y1 + pad, y0 + 1600));
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, gap = 8; const o = new PNG({ width: cw * 3 + gap * 2, height: ch }); o.data.fill(40);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const si = ((y0 + y) * d.w + (x0 + x)) * 4;
    for (const [k, src] of [[0, d.da], [1, d.db]]) { const di = (y * o.width + k * (cw + gap) + x) * 4; src.copy(o.data, di, si, si + 4); }
    const di = (y * o.width + 2 * (cw + gap) + x) * 4; const hit = d.out.data[si + 3];
    if (hit) { o.data[di] = 255; o.data[di + 1] = 40; o.data[di + 2] = 40; o.data[di + 3] = 255; } else { for (let c = 0; c < 3; c++) o.data[di + c] = Math.round(d.db[si + c] * 0.35); o.data[di + 3] = 255; } }
  fs.mkdirSync(CROPS, { recursive: true }); const f = path.join(CROPS, name.replace(/[\/]/g, '__') + '.png'); fs.writeFileSync(f, PNG.sync.write(o)); return path.relative(ROOT, f);
}

// ── the behaviour fingerprint of a root (the gate's section, or the open pop-ups)
async function fingerprint(K, rootSel) {
  const roots = await K.p.$$(rootSel); const ax = [];
  const walk = (n) => { if (!n) return; const st = ['pressed', 'checked', 'selected', 'expanded', 'disabled', 'focused', 'haspopup', 'level', 'value'].filter((k) => n[k] !== undefined && n[k] !== false && k !== 'focused').map((k) => `${k}=${n[k]}`);
    if (n.role && !/^(generic|none|StaticText|InlineTextBox|LineBreak)$/.test(n.role)) ax.push(`${n.role} "${(n.name || '').replace(/\s+/g, ' ').trim()}"${st.length ? ' [' + st.join(' ') + ']' : ''}`); (n.children || []).forEach(walk); };
  for (const r of roots) walk(await K.p.accessibility.snapshot({ root: r, interestingOnly: true }));
  const dom = await K.p.evaluate((sel) => { const rs = [...document.querySelectorAll(sel)]; const vis = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none'; };
    const foc = []; for (const r of rs) for (const e of r.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex],[contenteditable="true"]')) if (e.tabIndex >= 0 && !e.disabled && vis(e)) foc.push(e);
    const ord = [...foc.filter((e) => e.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex), ...foc.filter((e) => e.tabIndex === 0)];
    const aria = (e) => [...e.attributes].filter((a) => /^aria-(pressed|checked|selected|expanded|current|disabled)$/.test(a.name)).map((a) => `${a.name}=${a.value}`).join(' ');
    return { tab: ord.map((e) => `${e.tagName.toLowerCase()}${e.getAttribute('role') ? '[' + e.getAttribute('role') + ']' : ''} "${(e.getAttribute('aria-label') || e.innerText || e.value || '').replace(/\s+/g, ' ').trim().slice(0, 60)}" ${aria(e)}`.trim()),
      text: rs.map((r) => r.innerText).join(' | ').replace(/\s+/g, ' ').trim() }; }, rootSel);
  return { ax, tab: dom.tab, text: dom.text };
}
function fpDiff(fa, fb) {
  const out = [];
  for (const k of ['tab', 'ax']) { const a = fa[k], b = fb[k]; const n = Math.max(a.length, b.length); for (let i = 0; i < n; i++) if (a[i] !== b[i]) { out.push(`${k}[${i}]: ref ${JSON.stringify(a[i])} · cand ${JSON.stringify(b[i])}`); break; } }
  if (fa.text !== fb.text) { let i = 0; while (fa.text[i] === fb.text[i]) i++; out.push(`text@${i}: ref ${JSON.stringify(fa.text.slice(Math.max(0, i - 30), i + 40))} · cand ${JSON.stringify(fb.text.slice(Math.max(0, i - 30), i + 40))}`); }
  return out;
}

// ── geometry: an element's box or drawn ink edge, in CSS px (ink read off a 2x capture: the bounding box of pixels unlike the surround)
async function geomMeasure(K, sel, nth = 0, of = 'box') {
  const r = await K.p.evaluate((sel, nth) => { const e = document.querySelectorAll(sel)[nth]; if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; }, sel, nth);
  if (!r) return null; if (of !== 'ink') { await L.settle(K.p); const b = await K.p.evaluate((sel, nth) => { const b = document.querySelectorAll(sel)[nth].getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; }, sel, nth); return b; }
  await L.settle(K.p); const img = decode(await K.p.screenshot()); const D = 2; const m = 3;
  const b = await K.p.evaluate((sel, nth) => { const b = document.querySelectorAll(sel)[nth].getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; }, sel, nth);
  const X0 = Math.max(0, Math.floor((b.left - m) * D)), Y0 = Math.max(0, Math.floor((b.top - m) * D)), X1 = Math.min(img.width - 1, Math.ceil((b.right + m) * D)), Y1 = Math.min(img.height - 1, Math.ceil((b.bottom + m) * D));
  const px = (x, y) => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
  const cnt = new Map(); for (let x = X0; x <= X1; x++) for (const y of [Y0, Y1]) { const k = px(x, y).join(); cnt.set(k, (cnt.get(k) || 0) + 1); } for (let y = Y0; y <= Y1; y++) for (const x of [X0, X1]) { const k = px(x, y).join(); cnt.set(k, (cnt.get(k) || 0) + 1); }
  const bg = [...cnt.entries()].sort((a, b2) => b2[1] - a[1])[0][0].split(',').map(Number);
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = Y0 + 1; y < Y1; y++) for (let x = X0 + 1; x < X1; x++) { const c = px(x, y); if (Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]) > 30) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } }
  if (x1 < 0) return null; return { left: x0 / D, top: y0 / D, right: (x1 + 1) / D, bottom: (y1 + 1) / D };
}
const edgeOf = (r, e) => (e === 'cx' ? (r.left + r.right) / 2 : e === 'cy' ? (r.top + r.bottom) / 2 : r[e]);
async function runGeom(Ks, size, key) {
  const res = [];
  for (const g of GEOM.filter((g) => g.view === key && (!g.size || g.size === size))) {
    const K = Ks[g.page || 'cand']; const r = await geomMeasure(K, g.sel, g.nth || 0, g.of || 'box'); if (!r) { res.push({ name: g.name || g.sel, ok: false, why: 'not found' }); continue; }
    const v = edgeOf(r, g.edge); let t = g.target; if (typeof t === 'object') { const r2 = await geomMeasure(K, t.sel, t.nth || 0, t.of || 'box'); t = r2 ? edgeOf(r2, t.edge) : NaN; }
    const miss = +(v - t).toFixed(2); res.push({ name: g.name || g.sel, value: +v.toFixed(2), target: +(+t).toFixed(2), miss, ok: Math.abs(miss) <= (g.tol ?? 0.25) });
  }
  return res;
}

// ── one element of every control role: hover, focus-visible, pressed (a pressed control may open something; the gate is reloaded if it did)
async function roleSamples(Ks, id, size, rep) {
  const roles = controlRoles(); const out = [];
  for (const R of roles) {
    // the element is chosen on the CANDIDATE (the identity table describes its structure) and found on the reference by what it IS: its tag, its
    // name or text, and its place among the gate's elements that share both. Choosing by selector on the reference skipped every role whose
    // selector names a box the reference does not have (.mt-chips), silently (the planted-padding falsifier passed the role samples, 2026-10-04 00:16 EDT).
    const sig = await Ks.cand.p.evaluate((id, sel) => { const s = document.getElementById(id); const all = [...s.querySelectorAll(sel)]; const e = all.find((e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 2 && r.height > 2 && c.visibility !== 'hidden' && !e.disabled; });
      if (!e) return null; const key = (x) => x.tagName + '|' + (x.getAttribute('aria-label') || x.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      const k = key(e); const same = [...s.getElementsByTagName(e.tagName)].filter((x) => key(x) === k); return { tag: e.tagName, k, n: same.indexOf(e) }; }, id, R.sel);
    if (!sig) continue;
    const mark = (K) => K.p.evaluate((id, sig) => { const s = document.getElementById(id); for (const x of s.querySelectorAll('[data-bd-role]')) x.removeAttribute('data-bd-role');
      const key = (x) => x.tagName + '|' + (x.getAttribute('aria-label') || x.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      const e = [...s.getElementsByTagName(sig.tag)].filter((x) => key(x) === sig.k)[sig.n]; if (!e) return false; e.setAttribute('data-bd-role', '1'); return true; }, id, sig);
    const pick = 0; const RS = '[data-bd-role]';
    for (const mode of ['hover', 'focus', 'pressed']) {
      const rects = {}; const shots = {};
      await Promise.all(['ref', 'cand'].map(async (w) => { const K = Ks[w];
        rects[w] = (await mark(K)) ? await K.p.evaluate((id, sel, i) => { const e = document.getElementById(id).querySelectorAll(sel)[i]; if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'start' }); return true; }, id, RS, pick) : null;   // inline 'start': a role wider than a sideways-scrolling panel (C1 at 640px) left the panel wherever 'nearest' found it, a different place on each load
        if (!rects[w]) return; await L.settle(K.p); await K.p.mouse.move(1, 1); await L.settle(K.p);
        const r = await K.p.evaluate((id, sel, i) => { const b = document.getElementById(id).querySelectorAll(sel)[i].getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }, id, RS, pick); rects[w] = r;
        if (mode === 'hover') { await K.p.mouse.move(r.x + r.w / 2, r.y + r.h / 2); await L.sleep(700); }
        if (mode === 'focus') { await K.p.keyboard.press('Shift'); await K.p.evaluate((id, sel, i) => document.getElementById(id).querySelectorAll(sel)[i].focus(), id, RS, pick); await L.sleep(200); }
        if (mode === 'pressed') { await K.p.mouse.move(r.x + r.w / 2, r.y + r.h / 2); await K.p.mouse.down(); await L.sleep(200); }
        await L.settle(K.p); shots[w] = await K.p.screenshot();
        if (mode === 'pressed') { await K.p.mouse.move(1, 1); await K.p.mouse.up(); }
        await K.p.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur()); await K.p.mouse.move(1, 1);
      }));
      if (!rects.ref || !rects.cand) { out.push({ role: R.role, mode, ok: false, why: `element missing on ${!rects.ref ? 'ref' : 'cand'}` }); continue; }
      const u = { x: Math.min(rects.ref.x, rects.cand.x) - 10, y: Math.min(rects.ref.y, rects.cand.y) - 10 }; u.w = Math.max(rects.ref.x + rects.ref.w, rects.cand.x + rects.cand.w) + 10 - u.x; u.h = Math.max(rects.ref.y + rects.ref.h, rects.cand.y + rects.cand.h) + 10 - u.y;
      const cut = (buf) => { const img = decode(buf); const x0 = Math.max(0, Math.floor(u.x * 2)), y0 = Math.max(0, Math.floor(u.y * 2)), w = Math.min(img.width - x0, Math.ceil(u.w * 2)), h = Math.min(img.height - y0, Math.ceil(u.h * 2)); const o = new PNG({ width: w, height: h }); for (let y = 0; y < h; y++) img.data.copy(o.data, y * w * 4, ((y0 + y) * img.width + x0) * 4, ((y0 + y) * img.width + x0 + w) * 4); return PNG.sync.write(o); };
      const d = diffImages(cut(shots.ref), cut(shots.cand), null, 2); const crop = d.changed ? saveCrop(d, `${size}/${id}/role-${R.role}-${mode}`) : null;
      out.push({ role: R.role, sel: R.sel, el: sig.k, mode, changed: d.changed, crop });
    }
    if (rep) { const f = await Promise.all(['ref', 'cand'].map((w) => fingerprint(Ks[w], '#' + id))); if (fpDiff(rep, f[1]).length || fpDiff(rep, f[0]).length) { await Promise.all(['ref', 'cand'].map((w) => Ks[w].load())); } }
  }
  return out;
}

(async () => {
  const t0 = Date.now(); const { server, base } = await L.serve(); const report = { label: LABEL, ref: REF, cand: CAND, inject: INJ, sizes: SIZES.map((s) => s.join('x')), views: [], roles: [], pops: [], errors: {} };
  for (const [W, H] of SIZES) {
    // one browser per kit: a second tab in one browser is a background tab, where requestAnimationFrame never fires and nothing settles
    const size = `${W}x${H}`; const bs = await Promise.all([L.launch(W, H), L.launch(W, H)]);
    try {
      const [kr, kc] = await Promise.all([L.openKit(bs[0], base, REF, W, H, INJ.ref), L.openKit(bs[1], base, CAND, W, H, INJ.cand)]); const Ks = { ref: kr, cand: kc };
      if (AUTOMASK) for (const K of [kr, kc]) K.onSnap = (k) => k.p.evaluate(SIGPROBE);
      for (const G of L.GATES.filter((g) => GSEL.includes(g[0]))) {
        const [gid, id] = G;
        const tg = Date.now(); await Promise.all([Ks.ref.load(), Ks.cand.load()]); for (const w of ['ref', 'cand']) if (Ks[w].inject.js) await Ks[w].p.evaluate(Ks[w].inject.js);
        if (A.verbose) console.error(`${size} ${gid}: loaded in ${Date.now() - tg}ms`);
        const acts = await Promise.all([L.actions(Ks.ref.p, id), L.actions(Ks.cand.p, id)]);
        if (JSON.stringify(acts[0]) !== JSON.stringify(acts[1])) report.views.push({ size, key: `${gid}/actions`, fp: ['the state and Try buttons differ: ' + JSON.stringify(acts)] });
        if (!A['no-roles']) { const rest = await fingerprint(Ks.ref, '#' + id); report.roles.push(...(await roleSamples(Ks, id, size, rest)).map((r) => ({ size, gate: gid, ...r }))); await Promise.all([Ks.ref.load(), Ks.cand.load()]); }
        const views = [['rest', -1, 'rest'], ...acts[0]];
        for (const [n, [kind, i, label]] of views.entries()) {
          const e0 = { ref: Ks.ref.errs.length, cand: Ks.cand.errs.length };
          if (kind !== 'rest') await Promise.all(['ref', 'cand'].map((w) => L.act(Ks[w], id, kind, i)));
          const key = `${gid}/${String(n).padStart(2, '0')}-${kind}${kind === 'rest' ? '' : '-' + label.replace(/[^\w]+/g, '_').slice(0, 40)}`;
          if (VIEWRE && !VIEWRE.test(key)) continue;
          const T = [Date.now()]; const [sa, sb] = await Promise.all(['ref', 'cand'].map((w) => L.shotSet(Ks[w], id))); T.push(Date.now());
          const d = diffSets(sa, sb, `${size}/${key}`); T.push(Date.now()); const crop = d.crops.join(' ');
          const [fa, fb] = await Promise.all(['ref', 'cand'].map((w) => fingerprint(Ks[w], '#' + id)));
          const geom = GEOM.length ? await runGeom(Ks, size, key) : []; T.push(Date.now());
          if (A.verbose) console.error(`${size} ${key}: ${sa.length} shots ${T[1] - T[0]}ms diff ${T[2] - T[1]}ms fp ${T[3] - T[2]}ms`);
          report.views.push({ size, key, shots: sa.length, changed: d.changed, raw: d.raw, declared: d.declared, ripple: d.ripple, outsideDeclared: d.outsideDeclared, moveSame: d.moveSame, moveDiff: d.moveDiff, moveSub: d.moveSub, moveEx: d.moveEx, pct: +(100 * d.changed / Math.max(1, d.total)).toFixed(4), where: d.pages, crop, fp: fpDiff(fa, fb), errs: { ref: Ks.ref.errs.slice(e0.ref), cand: Ks.cand.errs.slice(e0.cand) }, geom });
          if (A.dumpfp) fs.writeFileSync(path.join(OUT, `${size}__${key.replace(/\//g, '__')}.fp.json`), JSON.stringify({ ref: fa, cand: fb }, null, 1));
        }
        if (!A['no-pops']) for (const pop of L.POPS.filter((p) => p.g === gid)) {
          const key = `${gid}/pop-${pop.label.replace(/[^\w]+/g, '_').slice(0, 40)}`; if (VIEWRE && !VIEWRE.test(key)) continue;
          const ok = await Promise.all(['ref', 'cand'].map(async (w) => { const K = Ks[w]; await K.load(); if (K.inject.js) await K.p.evaluate(K.inject.js); await L.setState(K, pop.id, pop.state); const c = await L.clickReal(K, pop.trigger); if (K.inject.js) await K.p.evaluate(K.inject.js); return c; }));
          const sel = pop.sel || L.POP_SEL; const opened = await Promise.all(['ref', 'cand'].map((w) => Ks[w].p.evaluate((s) => [...document.querySelectorAll(s)].some((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0), sel)));
          const [sa, sb] = await Promise.all(['ref', 'cand'].map((w) => L.shotPop(Ks[w], sel)));
          const d = diffSets(sa, sb, `${size}/${key}`); const crop = d.crops.join(' ');
          const [fa, fb] = await Promise.all(['ref', 'cand'].map((w) => fingerprint(Ks[w], sel)));
          report.pops.push({ size, key, clicked: ok, opened, shots: sa.length, changed: d.changed, raw: d.raw, declared: d.declared, ripple: d.ripple, outsideDeclared: d.outsideDeclared, moveSame: d.moveSame, moveDiff: d.moveDiff, moveSub: d.moveSub, moveEx: d.moveEx, pct: +(100 * d.changed / Math.max(1, d.total)).toFixed(4), where: d.pages, crop, fp: fpDiff(fa, fb) });
        }
      }
      report.errors[size] = { ref: Ks.ref.errs, cand: Ks.cand.errs };
    } finally { await Promise.all(bs.map((b) => b.close())); }
  }
  server.close(); report.seconds = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  // numbers only
  const all = [...report.views, ...report.pops]; const bad = all.filter((v) => v.changed || (v.fp && v.fp.length) || (v.errs && v.errs.cand.length !== v.errs.ref.length) || (v.opened && v.opened[0] !== v.opened[1]));
  console.log(`fidelity ${LABEL}: ${REF} vs ${CAND} · ${report.sizes.join(', ')} · ${report.seconds}s`);
  for (const s of report.sizes) for (const g of GSEL) { const vs = all.filter((v) => v.size === s && v.key.startsWith(g + '/')); if (!vs.length) continue;
    const ch = vs.filter((v) => v.changed); const fp = vs.filter((v) => v.fp && v.fp.length);
    if (AUTOMASK) console.log(`${s} ${g}: raw changed px ${vs.map((v) => v.raw || 0).reduce((a, b) => a + b, 0)} · elements declared ${vs.map((v) => v.declared || 0).reduce((a, b) => a + b, 0)} · ripple ${vs.map((v) => v.ripple || 0).reduce((a, b) => a + b, 0)} · px outside declared ${vs.map((v) => v.outsideDeclared || 0).reduce((a, b) => a + b, 0)}`);
    console.log(`${s} ${g}: views ${vs.length} · changed ${ch.length} (max ${Math.max(0, ...vs.map((v) => v.changed || 0))}px, ${Math.max(0, ...vs.map((v) => v.pct || 0))}%) · fingerprint diffs ${fp.length}`); }
  for (const v of bad) console.log(`  ${v.size} ${v.key}: ${v.changed || 0}px ${v.pct || 0}%${v.where && v.where.length ? ' [' + v.where.join('; ') + ']' : ''}${v.bboxCss ? ' bbox ' + v.bboxCss.join(',') : ''}${v.crop ? '\n     ' + v.crop : ''}${v.fp && v.fp.length ? '\n     fp ' + v.fp.join('\n     fp ') : ''}${v.errs && v.errs.cand.length !== v.errs.ref.length ? '\n     errs ref ' + v.errs.ref.length + ' cand ' + v.errs.cand.length + ' ' + v.errs.cand.join(' / ') : ''}${v.opened && v.opened[0] !== v.opened[1] ? '\n     opened ' + v.opened : ''}`);
  const rb = report.roles.filter((r) => r.changed || r.ok === false); console.log(`roles: ${report.roles.length} samples · ${rb.length} differ`); for (const r of rb) console.log(`  ${r.size} ${r.gate} ${r.role} ${r.mode}: ${r.changed ?? r.why}px ${r.crop || ''}`);
  for (const s of report.sizes) { const e = report.errors[s]; if (e) console.log(`page errors ${s}: ref ${e.ref.length} cand ${e.cand.length}`); }
  const geo = report.views.flatMap((v) => (v.geom || []).map((g) => ({ ...g, key: v.key, size: v.size }))); for (const g of geo) console.log(`geom ${g.size} ${g.key} ${g.name}: ${g.value} vs ${g.target} miss ${g.miss} ${g.ok ? 'ok' : 'MISS'}`);
  console.log(`report ${path.relative(ROOT, path.join(OUT, 'report.json'))}`);
  // exit at once: the server's keep-alive sockets held the process open five minutes after the report (measured 2026-10-03 23:43 EDT)
  process.exit(bad.length || rb.length ? 1 : 0);
})().catch((e) => { console.error('fidelity failed:', e && e.stack || e); process.exit(2); });
module.exports = { geomMeasure, diffImages, fingerprint };
