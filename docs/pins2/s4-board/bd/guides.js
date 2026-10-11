// Board 4: Builder · guides.js — guides he draws on an edge, and what each thing near a guide does against it (Harkirat, 2026-10-05 11:12–11:17
// EDT: "let me just draw a guide line on the right border of the 'new build' button manually and use that to check if other buttons under it are
// aligned with that guide", with the distance to the outside border on screen and one click to fix). A guide is anchored to an element's edge,
// never to a page x, so it follows scrolling, Try states and both widths. It snaps to the edge a person sees (the ink): a border, a ring drawn by
// box-shadow, an outline, a filled background, the letters, an icon's drawing, in that order; it says which. Also "what controls this": each
// visible quantity of a thing and the rule that sets it. Saved per gate in the builder's state (BD.std), so it survives reloads.
(function () {
  const BD = (window.BD = window.BD || {}); const M = () => BD.measure, S = () => BD.std, Y = () => BD.why;
  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const cs = (el) => getComputedStyle(el);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f1 = (v) => { const r = Math.round(v * 10) / 10; return (Object.is(r, -0) ? 0 : r).toString(); };
  const SIDES = ['left', 'right', 'top', 'bottom'];
  const axisOf = (side) => (side === 'left' || side === 'right' ? 'x' : 'y');
  const NEAR = 4; // a thing within this many px of a guide is tagged

  // ── the edge a person sees ──
  function shadowRing(c) {
    // the first shadow with a spread and no blur draws a ring: inside the box when inset, outside it by the spread when not
    const s = c.boxShadow; if (!s || s === 'none') return null;
    for (const part of s.split(/,(?![^(]*\))/)) { const n = (part.match(/-?[\d.]+px/g) || []).map(px); if (n.length < 4) continue; const [x, y, blur, spread] = n; if (blur > 0.5 || spread <= 0 || Math.abs(x) > 0.5 || Math.abs(y) > 0.5) continue; return { inset: /inset/.test(part), w: spread }; }
    return null;
  }
  function paintsBg(c) { if (c.backgroundImage && c.backgroundImage !== 'none') return true; const m = c.backgroundColor.match(/[\d.]+/g); if (!m) return false; const a = /rgba|\/|color\(/.test(c.backgroundColor) ? +m[m.length - 1] : 1; return a > 0.02 && !/^rgba\(0, 0, 0, 0\)$/.test(c.backgroundColor) && c.backgroundColor !== 'transparent'; }
  function ink(el) {
    const r = el.getBoundingClientRect(), c = cs(el); const box = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    const bw = SIDES.map((s) => (c[`border${s[0].toUpperCase() + s.slice(1)}Style`] !== 'none' ? px(c[`border${s[0].toUpperCase() + s.slice(1)}Width`]) : 0));
    if (bw.some((w) => w > 0)) return { ...box, kind: 'border', inner: { left: r.left + bw[0], right: r.right - bw[1], top: r.top + bw[2], bottom: r.bottom - bw[3] } };
    const ring = shadowRing(c);
    if (ring && ring.inset) return { ...box, kind: 'ring', inner: { left: r.left + ring.w, right: r.right - ring.w, top: r.top + ring.w, bottom: r.bottom - ring.w } };
    if (ring) return { left: r.left - ring.w, right: r.right + ring.w, top: r.top - ring.w, bottom: r.bottom + ring.w, kind: 'ring', inner: box };
    if (c.outlineStyle !== 'none' && px(c.outlineWidth) > 0) { const o = px(c.outlineOffset) + px(c.outlineWidth); return { left: r.left - o, right: r.right + o, top: r.top - o, bottom: r.bottom + o, kind: 'outline', inner: box }; }
    if (paintsBg(c)) return { ...box, kind: 'background', inner: box };
    const k = M().kindOf(el);
    if (k === 'control' && M().paintedChild) { const pc = M().paintedChild(el); if (pc) { const ie = ink(pc.el); return { ...ie, kind: 'drawn box of ' + M().label(pc.el) }; } }
    if (k === 'text') { const l = M().letters(el); if (l) return { left: l.left, right: l.right, top: l.top, bottom: l.bottom, kind: 'letters', inner: l }; }
    if (k === 'icon') { const b = M().iconBox(el); if (b) return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, kind: 'icon', inner: b }; }
    const vb = M().visibleBox(el); const s = M().seen(el); return { left: s.left, right: s.right, top: s.top, bottom: s.bottom, kind: vb && vb.part !== 'self' ? `${vb.part.replace(/^::/, '')} drawing` : 'box', inner: s };
  }
  const centre = (e, axis) => (axis === 'x' ? (e.left + e.right) / 2 : (e.top + e.bottom) / 2);
  const edgeOf = (e, side) => (side === 'cx' ? centre(e, 'x') : side === 'cy' ? centre(e, 'y') : e[side]);
  // the nearest box around it that a person can see, and its inner edge on each side (inside its border or inset ring)
  function container(el) { for (let a = el.parentElement; a && a.id !== 'board'; a = a.parentElement) { if (!M().inStage(a)) return null; const c = cs(a); if (shadowRing(c) || SIDES.some((s) => c[`border${s[0].toUpperCase() + s.slice(1)}Style`] !== 'none' && px(c[`border${s[0].toUpperCase() + s.slice(1)}Width`]) > 0) || paintsBg(c)) return a; } return null; }
  function insets(el) { const C = container(el); if (!C) return null; const e = ink(el), ci = ink(C).inner; return { C, left: e.left - ci.left, right: ci.right - e.right, top: e.top - ci.top, bottom: ci.bottom - e.bottom }; }

  // ── the guides ──
  const store = (gate) => (S().state.gates[gate] && S().state.gates[gate].guides) || [];
  function resolve(g) { try { return document.querySelectorAll(g.sel)[g.idx] || null; } catch (e) { return null; } }
  function pos(g) { const el = resolve(g); if (!el || !M().visible(el)) return null; return edgeOf(ink(el), g.side); }
  function add(gate, el, side) { const list = store(gate).slice(); const sel = M().selOf(el); let idx = 0; try { idx = [...document.querySelectorAll(sel)].indexOf(el); } catch (e) {} const e = ink(el); list.push({ id: 'G' + Date.now().toString(36), side, axis: side === 'cy' ? 'y' : side === 'cx' ? 'x' : axisOf(side), sel, idx, ink: e.kind, name: M().label(el) }); S().setGuides(gate, list, `guide on ${M().label(el)}'s ${side} edge`); }
  function dropAt(el, x, y, gate) { const e = ink(el); const d = { left: Math.abs(x - e.left), right: Math.abs(x - e.right), top: Math.abs(y - e.top), bottom: Math.abs(y - e.bottom) }; const side = Object.keys(d).sort((a, b) => d[a] - d[b])[0]; add(gate, el, side); return side; }
  function remove(gate, id) { S().setGuides(gate, store(gate).filter((g) => g.id !== id), 'guide removed'); }
  function clear(gate) { S().setGuides(gate, [], 'guides cleared'); }
  // every thing in the gate with the same edge within NEAR px of the guide: the outermost of a nest that shares the edge
  function tags(gate, g) {
    const p = pos(g); if (p == null) return []; const gel = M().gateEl(gate); if (!gel) return []; const anchor = resolve(g); const out = [];
    for (const t of M().things(gel)) {
      if (!t.isConnected || t === anchor || (anchor && (t.contains(anchor) || anchor.contains(t)))) continue; const k = M().kindOf(t); if (!/control|text|icon|box/.test(k || '')) continue;
      const e = ink(t); const v = edgeOf(e, g.side); const d = v - p; if (Math.abs(d) > NEAR) continue;
      if (g.axis === 'x' && (e.bottom < 0 || e.top > innerHeight * 3)) {}
      out.push({ el: t, d: Math.round(d * 10) / 10, kind: e.kind });
    }
    return out.filter((a) => !out.some((b) => b !== a && b.el.contains(a.el) && Math.abs(b.d - a.d) < 0.25));
  }
  const tagText = (d) => (Math.abs(d) < 0.5 ? 'on' : `${d > 0 ? '+' : '−'}${f1(Math.abs(d))}px`);

  // ── on the page ──
  function svg({ Lz, pill, H }) {
    const parts = []; const GC = '#3ef0c8', OFF = '#ff6fae';
    for (const gate of Object.keys(M().GATE_NAMES)) {
      const gel = M().gateEl(gate); if (!gel) continue; const gr = gel.getBoundingClientRect(); if (gr.bottom < 0 || gr.top > H) continue;
      for (const g of store(gate)) {
        const p = pos(g); if (p == null) continue; const anchor = resolve(g);
        if (g.axis === 'x') parts.push(Lz(p, Math.max(0, gr.top), p, Math.min(H, gr.bottom), GC, 1, '6 4')); else parts.push(Lz(Math.max(0, gr.left), p, Math.min(innerWidth, gr.right), p, GC, 1, '6 4'));
        const ins = anchor && (g.side === 'left' || g.side === 'right' || g.side === 'top' || g.side === 'bottom') ? insets(anchor) : null;
        const lab = `${g.side} ${g.ink}${ins && Number.isFinite(ins[g.side]) ? ` · ${f1(ins[g.side])} in from ${M().label(ins.C)}` : ''}`;
        const ar = anchor ? anchor.getBoundingClientRect() : null; if (ar) parts.push(pill(g.axis === 'x' ? p + 4 : ar.left, g.axis === 'x' ? Math.max(14, ar.top - 6) : p - 4, lab, GC));
        for (const t of tags(gate, g)) { const r = t.el.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) continue; const x = g.axis === 'x' ? p + 4 : r.left, y = g.axis === 'x' ? r.top + 13 : p + 16; parts.push(pill(x, y, tagText(t.d), Math.abs(t.d) < 0.5 ? GC : OFF)); }
      }
    }
    return parts.join('');
  }

  // ── in the panel: its edges, what controls it, the gate's guides ──
  // What controls this, as compact cells (Harkirat, 2026-10-05 12:09 EDT, on the first version's one row per property: "THIS IS SUCH BLOATED
  // WASTED SPACE! you might as well have put a whole prose paragraph in there"). A pair that matches is one number; where a value comes from is
  // the cell's hover; a value nothing sets (the browser default) is left out.
  function controls(el) {
    const c = cs(el), r = el.getBoundingClientRect(), d = M().seen(el), k = M().kindOf(el); const cells = [];
    const of = (prop) => { try { return Y().of(el, prop); } catch (e) { return null; } };
    const src = (res) => (res ? Y().short(res) : ''); const tokOf = (res) => { const m = res && res.declared && /var\((--[\w-]+)/.exec(res.declared); return m ? m[1] : null; };
    const unset = (res) => !res || /browser default|nothing sets/i.test(Y().text(res) || '');
    const pair = (cap, a, b) => { const ra = of(a), rb = of(b); const va = px(c.getPropertyValue(a)), vb = px(c.getPropertyValue(b)); if (!va && !vb) return; cells.push({ cap, val: Math.abs(va - vb) < 0.05 ? f1(va) : `${f1(va)} · ${f1(vb)}`, tok: tokOf(ra), from: [src(ra), src(rb)].filter(Boolean).filter((x, i, A) => A.indexOf(x) === i).join(' · ') }); };
    pair('inside ←→', 'padding-left', 'padding-right'); pair('inside ↑↓', 'padding-top', 'padding-bottom');
    for (const [s, ar] of [['left', '←'], ['right', '→'], ['top', '↑'], ['bottom', '↓']]) { const v = px(c.getPropertyValue('margin-' + s)); if (Math.abs(v) >= 0.05) { const res = of('margin-' + s); cells.push({ cap: `margin ${ar}`, val: f1(v), tok: tokOf(res), from: src(res) }); } }
    const cg = px(c.columnGap), rg = px(c.rowGap); if (/flex|grid/.test(c.display) && (cg || rg)) { const res = of('column-gap'); cells.push({ cap: 'between', val: Math.abs(cg - rg) < 0.05 || !rg ? f1(cg) : `${f1(cg)} × ${f1(rg)}`, tok: tokOf(res), from: src(res) }); }
    if (k === 'text' || k === 'control') { const res = of('font-size'); cells.push({ cap: 'text', val: f1(px(c.fontSize)), tok: tokOf(res), from: src(res) }); }
    if (k === 'text') { const res = of('text-align'); if (!unset(res)) cells.push({ cap: 'words', val: c.textAlign, from: src(res) }); }
    const pa = el.parentElement; if (pa && M().inStage(pa)) { const pc = cs(pa); if (/flex|grid/.test(pc.display)) { let res = null; try { res = Y().of(pa, 'align-items'); } catch (e) {} const v = [pc.justifyContent, pc.alignItems].filter((x) => x !== 'normal').join(' · '); if (v) cells.push({ cap: 'its box lines up', val: v, from: src(res) }); } }
    return cells;
  }
  const sizeSrc = (el, prop) => { try { return Y().short(Y().of(el, prop)) || 'its content'; } catch (e) { return 'its content'; } };
  const PIN = '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M8 1.5v2.5M8 6.75v2.5M8 12v2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';
  function panelHTML(el, gate) {
    const e = ink(el), ins = insets(el); const h = []; const pc = M().kindOf(el) === 'control' && M().paintedChild ? M().paintedChild(el) : null; const br = el.getBoundingClientRect(); const d = M().seen(el);
    // the four distances around a box, each one a button that pins a guide on that edge; the box shows the drawn size, and the click area when larger
    const side = (s) => `<button class="gp gp-${s}" data-act="gpin" data-side="${s}" title="Pin a guide on the ${s} edge (or press G, then click an edge)">${ins && Number.isFinite(ins[s]) ? f1(ins[s]) : '—'}${PIN}</button>`;
    h.push(`<div class="sec gd"><div class="kh"><span class="dot" style="background:#3ef0c8"></span><span class="kname">Edges</span><span class="kmeta">to ${esc(ins ? M().label(ins.C) : '—')}</span></div><div class="gx">${side('top')}${side('left')}<div class="gbox" title="${esc(`drawn by its ${e.kind} · width: ${sizeSrc(el, 'width')} · height: ${sizeSrc(el, 'height')}`)}"><b>${f1(d.width)} × ${f1(d.height)}</b>${pc || Math.abs(br.height - d.height) >= 0.5 || Math.abs(br.width - d.width) >= 0.5 ? `<span>click ${f1(br.width)} × ${f1(br.height)}</span>` : ''}</div>${side('right')}${side('bottom')}</div></div>`);
    const gm = BD.std && BD.std.iconGeom ? BD.std.iconGeom(el) : null;
    if (gm) { const off = Math.abs(gm.before - gm.right) >= 0.5; h.push(`<div class="sec gd"><div class="kh"><span class="dot" style="background:#ffd166"></span><span class="kname">The icon in it</span>${off ? `<span class="kmeta bad">before ≠ right · ${f1(Math.abs(gm.before - gm.right))} apart</span>` : '<span class="kmeta">before = right</span>'}</div><div class="gc4"><div class="gcell${off ? ' bad' : ''}"><i>before</i><b>${f1(gm.before)}</b></div><div class="gcell"><i>icon</i><b>${f1(gm.inkW)}</b><span>in ${f1(gm.boxW)}</span></div><div class="gcell"><i>to words</i><b>${f1(gm.after)}</b></div><div class="gcell${off ? ' bad' : ''}"><i>right</i><b>${f1(gm.right)}</b></div></div></div>`); }
    h.push(`<div class="sec gd"><div class="kh"><span class="dot" style="background:#9be38a"></span><span class="kname">What controls this</span><span class="kmeta">hover for the rule</span></div><div class="gcs">${controls(el).map((x) => `<div class="gcell" title="${esc(x.from || 'nothing sets it')}"><i>${esc(x.cap)}</i><b>${esc(x.val)}</b>${x.sub ? `<span>${esc(x.sub)}</span>` : ''}${x.tok ? `<code>${esc(x.tok)}</code>` : ''}</div>`).join('')}</div></div>`);
    const G = store(gate);
    if (G.length) {
      h.push(`<div class="sec gd"><div class="kh"><span class="dot" style="background:#3ef0c8"></span><span class="kname">Guides on ${esc(gate)}</span><button class="tl2" data-act="gclear" title="Remove every guide on this gate">Clear</button></div>`);
      for (const g of G) { const T = tags(gate, g); const off = T.filter((t) => Math.abs(t.d) >= 0.5); h.push(`<div class="gg"><div class="grow"><span class="gs">${esc(g.name)} · ${esc(g.side)}</span><span class="gv">${T.length - off.length} on · ${off.length} off</span>${off.length ? `<button class="primary" data-act="gsnapall" data-gid="${esc(g.id)}" title="Snap every one that is off">Snap ${off.length}</button>` : ''}<button class="ib" data-act="gdel" data-gid="${esc(g.id)}" title="Remove this guide">×</button></div>${off.map((t) => `<div class="grow sub"><button class="go" data-act="ggo" data-gid="${esc(g.id)}" data-ti="${T.indexOf(t)}">${esc(M().label(t.el))}</button><span class="gv off">${tagText(t.d)}</span><button class="tl2" data-act="gsnap" data-gid="${esc(g.id)}" data-ti="${T.indexOf(t)}">Snap</button></div>`).join('')}</div>`); }
      h.push('</div>');
    }
    return h.join('');
  }
  const CSS = `.gd .kmeta{margin-left:auto;color:#7d8a94}.gd .kmeta.bad{color:#ff6fae}
.gd .gx{display:grid;grid-template-columns:1fr auto 1fr;grid-template-areas:". t ." "l b r" ". d .";align-items:center;justify-items:center;gap:4px 6px;margin-top:8px}
.gd .gp{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 6px;border-radius:6px;border:1px solid #2a343c;background:#141b20;color:#e6edf2;font:600 12px/1 inherit;font-variant-numeric:tabular-nums;cursor:pointer}.gd .gp svg{color:#3ef0c8;opacity:.7}.gd .gp:hover{border-color:#3ef0c8}.gd .gp:hover svg{opacity:1}
.gd .gp-top{grid-area:t}.gd .gp-left{grid-area:l;justify-self:end}.gd .gp-right{grid-area:r;justify-self:start}.gd .gp-bottom{grid-area:d}
.gd .gbox{grid-area:b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:92px;height:40px;padding:0 8px;border:1px dashed #3ef0c8;border-radius:6px;font-variant-numeric:tabular-nums}.gd .gbox b{font-size:12px}.gd .gbox span{font-size:10px;color:#7d8a94}
.gd .gc4,.gd .gcs{display:grid;gap:4px;margin-top:8px}.gd .gc4{grid-template-columns:repeat(4,1fr)}.gd .gcs{grid-template-columns:repeat(auto-fill,minmax(76px,1fr))}
.gd .gcell{display:flex;flex-direction:column;gap:2px;min-width:0;padding:5px 7px;border-radius:6px;background:#141b20;font-variant-numeric:tabular-nums}.gd .gcell i{font-style:normal;font-size:10px;color:#7d8a94;white-space:nowrap}.gd .gcell b{font-size:12px;color:#e6edf2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gd .gcell span{font-size:10px;color:#7d8a94}.gd .gcell code{font:500 10px 'JetBrains Mono',monospace;color:#9fb3c2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gd .gcell.bad{box-shadow:inset 0 0 0 1px #ff6fae}.gd .gcell.bad b{color:#ff6fae}
.gd .grow{display:flex;align-items:center;gap:8px}.gd .grow.sub{padding-left:12px}.gd .gs{min-width:0;color:#9aa6b0}.gd .gv{flex:1;min-width:0}.gd .gv.off{color:#ff6fae;flex:none}.gd .gg{margin-top:6px}`;
  BD.guides = { ink, insets, container, controls, add, dropAt, remove, clear, tags, pos, resolve, store, svg, panelHTML, tagText, CSS, NEAR };
})();
