// Board 4: Builder · measure.js — what a "thing" is on Board 4, its three edges (layout box, visible box, letters), the space between two
// things broken into its pieces, and the near-misses, columns, dividers and nested corners the overlay draws. Pure measurement: it knows
// nothing of variants or knobs. Also loaded by tools/build-data.cjs into the live Board 4, so the page and the walk sign things the same way.
// Plan: local/pins2/s4/builder-plan.md (v3) § What the overlay shows.
(function () {
  const BD = (window.BD = window.BD || {});
  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const CLEAR = /^(transparent|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\))$/;
  const GATES = { 'c-manifest': 'C1', 'c-new-build': 'C2', 'c-compare': 'C3', 'c-repairs': 'C4', 'c-export': 'C5', 'c-queue': 'C6', 'c-broadcast': 'C7', 'c-history': 'C8', 'c-admin': 'C9' };
  const GATE_NAMES = { C1: 'The Armory manifest', C2: 'New build', C3: 'Compare', C4: 'Repairs', C5: 'Export', C6: 'The delivery queue', C7: 'Broadcast', C8: 'History', C9: 'Admin traffic' };
  // the board's chrome is not design: each gate's head and state switch, its Try row, its notes, and the board's own intro. Only a gate's stage
  // and the pop-ups hold things (Harkirat, 2026-10-03 15:10 EDT: "please exclude the board's chrome from the builder's detection")
  const CHROME = '.pb-head, .b4-try, .pb-new, .b4-forks', POPS = '.b4-pop, .b3-datepop, .f-menu';
  // and anything that HOLDS chrome (a wrapper around the head, the Try row and the stage) is board structure too, not design (his shot of
  // 2026-10-03 16:48 EDT: the empty band around the Try row lit up a wrapper spanning the whole gate)
  function inStage(el) { if (!el || el.nodeType !== 1) return false; if (el.closest(POPS)) return true; if (el.querySelector(CHROME)) return false; let prev = null; for (let a = el; a; prev = a, a = a.parentElement) if (a.id && GATES[a.id]) return !!prev && !prev.matches(CHROME); return false; }
  const cs = (el, pe) => getComputedStyle(el, pe || null);
  const box = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
  const isSvgPart = (el) => el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg';

  // Drawn on screen at all. A word for screen readers is clipped to nothing or squeezed into a 1px box, and everything inside a faded,
  // clipped or folded-shut box is gone with it: none of them is a thing (Harkirat, 2026-10-03 20:38 EDT: C7's third "same" Manifest
  // label was "some empty box", a hidden "Remove" for screen readers; 23 such words were counted across the gates)
  function clippedAway(c) {
    const m = /rect\(([^)]*)\)/.exec(c.clip); if (m) { const [t, r, b, l] = m[1].split(/[ ,]+/).map(parseFloat); if (Math.abs((r - l) * (b - t)) <= 1) return true; }
    return /inset\(\s*(50|100)%/.test(c.clipPath);
  }
  function hides(e) {
    const c = cs(e); if (+c.opacity === 0 || clippedAway(c)) return true;
    if (c.overflowX !== 'visible' || c.overflowY !== 'visible') { const r = e.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1) return true; }
    return false;
  }
  // one test for what has ink to show, shared by the list of things and by what a click picks, so the two never disagree
  const inked = (e, k) => k !== 'text' || !!visibleBox(e) || !!letters(e);
  function hiddenAbove(e) { for (let p = e; p && p !== document.body; p = p.parentElement) if (hides(p)) return true; return false; }
  const clearInk = (c) => /^(transparent|rgba\([^)]*,\s*0\))$/.test((c.webkitTextFillColor && c.webkitTextFillColor !== c.color ? c.webkitTextFillColor : c.color).trim());
  function visible(el) {
    if (!el || el.nodeType !== 1 || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect(); if (r.width < 0.5 || r.height < 0.5) return false;
    const c = cs(el); return c.visibility !== 'hidden' && c.display !== 'none' && +c.opacity !== 0 && !clippedAway(c);
  }
  const paintsBg = (c) => !CLEAR.test(c.backgroundColor) || c.backgroundImage !== 'none';
  function paintsEdge(c) {
    for (const s of ['Top', 'Right', 'Bottom', 'Left']) if (px(c['border' + s + 'Width']) > 0 && c['border' + s + 'Style'] !== 'none' && !CLEAR.test(c['border' + s + 'Color'])) return true;
    return !!(c.boxShadow && c.boxShadow !== 'none' && !/^rgba\([^)]*,\s*0\)/.test(c.boxShadow));
  }
  const paints = (c) => paintsBg(c) || paintsEdge(c);

  // a ::before/::after that paints, located from its own insets inside the element's padding box
  function pseudoRect(el, pe) {
    const c = cs(el, pe); if (!c || c.content === 'none' || c.content === 'normal' || c.display === 'none' || !paints(c)) return null;
    const r = el.getBoundingClientRect(); const e = cs(el);
    const L = r.left + px(e.borderLeftWidth), T = r.top + px(e.borderTopWidth);
    const W = r.width - px(e.borderLeftWidth) - px(e.borderRightWidth), H = r.height - px(e.borderTopWidth) - px(e.borderBottomWidth);
    if (c.position === 'absolute' || c.position === 'fixed') {
      const w = c.width === 'auto' ? W - px(c.left) - px(c.right) : px(c.width);
      const h = c.height === 'auto' ? H - px(c.top) - px(c.bottom) : px(c.height);
      const left = c.left !== 'auto' ? L + px(c.left) : L + W - px(c.right) - w;
      const top = c.top !== 'auto' ? T + px(c.top) : T + H - px(c.bottom) - h;
      return { left, top, right: left + w, bottom: top + h, width: w, height: h };
    }
    return box(r);
  }
  // the box the eye sees: the element when it paints, else its painting ::before/::after, else none
  function visibleBox(el) {
    if (!el || el instanceof SVGElement) return null;
    if (paints(cs(el))) return { rect: box(el.getBoundingClientRect()), part: 'self' };
    for (const pe of ['::before', '::after']) { const pr = pseudoRect(el, pe); if (pr && pr.width > 3 && pr.height > 3) return { rect: pr, part: pe }; }
    return null;
  }

  // letters: cap height to baseline of every line of text inside, from the font's own metrics
  const FM = new Map(); let CX = null;
  function metrics(c) {
    const k = `${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`; if (FM.has(k)) return FM.get(k);
    CX = CX || document.createElement('canvas').getContext('2d'); CX.font = k; const m = CX.measureText('H');
    const v = { asc: m.fontBoundingBoxAscent || px(c.fontSize) * 0.9, desc: m.fontBoundingBoxDescent || px(c.fontSize) * 0.25, cap: m.actualBoundingBoxAscent || px(c.fontSize) * 0.7 };
    FM.set(k, v); return v;
  }
  function letters(el) {
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() && !(n.parentElement && n.parentElement.closest('svg')) ? 1 : 3) });
    let b = null;
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const c = cs(n.parentElement); if (c.visibility === 'hidden' || c.display === 'none' || clearInk(c)) continue; let gone = false; for (let q = n.parentElement; q && q !== el.parentElement; q = q.parentElement) if (hides(q)) { gone = true; break; } if (gone) continue; const m = metrics(c);
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) {
        if (q.width < 0.5) continue; const base = q.top + (q.height - (m.asc + m.desc)) / 2 + m.asc; const top = base - m.cap;
        b = b ? { left: Math.min(b.left, q.left), right: Math.max(b.right, q.right), top: Math.min(b.top, top), bottom: Math.max(b.bottom, base) } : { left: q.left, right: q.right, top, bottom: base };
      }
    }
    if (b) { b.width = b.right - b.left; b.height = b.bottom - b.top; } return b;
  }
  // an icon's drawn lines (its symbol draws with a 2-unit stroke, so half of it is added around the shapes)
  function iconBox(svg) {
    try {
      const bb = svg.getBBox(); const m = svg.getScreenCTM(); if (!m || !bb.width) throw 0; const pad = Math.abs(m.a) || 1;
      const xs = [bb.x, bb.x + bb.width].map((x) => m.a * x + m.e), ys = [bb.y, bb.y + bb.height].map((y) => m.d * y + m.f);
      const left = Math.min(...xs) - pad, right = Math.max(...xs) + pad, top = Math.min(...ys) - pad, bottom = Math.max(...ys) + pad;
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    } catch (e) { return box(svg.getBoundingClientRect()); }
  }

  const CTL_SEL = 'button, a[href], input, select, textarea, [role=button], [role=switch], [role=tab], [role=checkbox], [role=radio], [role=menuitem], [role=option]';
  function isControl(el) { return el.matches(CTL_SEL) || (el.hasAttribute('tabindex') && el.tabIndex >= 0 && !!visibleBox(el)); }
  function directText(el) { for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true; return false; }
  // A wrapper whose only content is one inline run of words in the same type is the thing, not the run: it is the box the layout sizes
  // and places (Harkirat, 2026-10-03 20:38 EDT: the Manifest label is right-aligned in a 64px box, and that box's left edge is what sits
  // 16px from the toolbar's border)
  const TEXTP = ['fontSize', 'fontWeight', 'fontFamily', 'fontStyle', 'letterSpacing', 'textTransform'];
  function textHolder(el) {
    if (!el || el.nodeType !== 1 || el.children.length !== 1 || directText(el) || isControl(el)) return null; const k = el.children[0];
    if (k instanceof SVGElement || cs(k).display !== 'inline' || !(directText(k) || textHolder(k))) return null;
    const a = cs(el), b = cs(k); return TEXTP.every((p) => a[p] === b[p]) ? k : null;
  }
  // Words set right or centre inside a wider box are placed by that box: their sides are the box's content edges, their top and bottom the
  // letters (how he measures words). Words set to the start keep their letters on both sides, where the box adds nothing he can see.
  function alignedBox(el, l) {
    const c = cs(el); if (!/^(block|inline-block|table-cell|list-item|flow-root)$/.test(c.display) || !/right|end|center/.test(c.textAlign)) return null;
    const r = el.getBoundingClientRect(); const left = r.left + px(c.borderLeftWidth) + px(c.paddingLeft), right = r.right - px(c.borderRightWidth) - px(c.paddingRight);
    if (right - left - l.width <= 1) return null;
    return { left, right, top: l.top, bottom: l.bottom, width: right - left, height: l.height, align: c.textAlign };
  }
  function kindOf(el) {
    if (!el || el.nodeType !== 1) return null; const t = el.tagName.toLowerCase();
    if (t === 'svg') return 'icon'; if (el instanceof SVGElement) return null;
    // a clickable row that holds controls of its own (a build row: its checkbox, code, share and delete) is a layout of them, never one button:
    // as a button, every space inside it was one "other gap" and could not be set apart (Harkirat, 2026-10-06 12:28 EDT)
    if (isControl(el)) return !el.matches(CTL_SEL) && [...el.querySelectorAll(CTL_SEL + ',[tabindex]')].some((k) => k !== el && visible(k)) ? 'layout' : 'control';
    if (t === 'hr') return 'divider';
    const vb = visibleBox(el);
    if (vb && ((vb.rect.height <= 2.5 && vb.rect.width > 12) || (vb.rect.width <= 2.5 && vb.rect.height > 12))) return 'divider';
    const c = cs(el);
    if (/flex|grid/.test(c.display) && [...el.children].filter(visible).length >= 2) return 'layout';
    if (directText(el)) return 'text';
    if (textHolder(el)) return 'text';
    if (vb) return el.children.length ? 'layout' : 'box';
    return null;
  }
  // the thing under the pointer: the control around it, else the icon, else the nearest element that is a thing
  function thingOf(t, root) {
    if (!t || t.nodeType !== 1) return null; let e = t;
    if (isSvgPart(e)) e = e.closest('svg') || e;
    if (!inStage(e) || hiddenAbove(e)) return null; const ctl = e.closest && e.closest(CTL_SEL); if (ctl && (!root || root.contains(ctl))) return ctl;
    while (e && e !== document.body && e !== document.documentElement && (!root || root.contains(e))) {
      if (visible(e) && kindOf(e) && inked(e, kindOf(e))) { while (e.parentElement && textHolder(e.parentElement) === e && (!root || root.contains(e.parentElement))) e = e.parentElement; return e; }
      e = e.parentElement;
    }
    return null;
  }
  // ── the drawn model (Harkirat, 2026-10-05 12:07 EDT: "work the class, not the instance… fix the core issue, because otherwise i'm just going
  // to find a near similar edge case again somewhere else"). One answer to "what does the eye see" for a control or a box, used by every number
  // on the page, every number in the panel and every setting: the box that is painted (paintTarget), its inside edge (innerOf), the drawn pieces
  // it holds (inkParts: words cap to baseline, an icon's lines, a painted dot or badge, an icon placed in its padding), the space from that inside
  // edge to the pieces on all four sides (inside) and the spaces between the pieces (gaps). Before it the page drew CSS padding, the panel read
  // CSS values and the measures read boxes, so one button said 16 to the letters on the left and 10 to a text box on top, a gap stopped short of
  // an icon's lines, and a 44px click area read as the height of a 32px box (his cases of 11:36–11:55; the class: work/SA-7/findings.md).
  // seen() and visibleHeight() follow it only in the builder (setDescend), so the bd-tools that import this file keep their numbers.
  let DESCEND = false; const setDescend = (v) => { DESCEND = !!v; }; const descends = () => DESCEND;
  // a box-shadow with no offset and no blur is a drawn edge (a ring): outside it adds to the box, inset it is the box's edge
  function shadowRings(c) {
    const out = { outer: 0, inner: 0 }; const s = c && c.boxShadow; if (!s || s === 'none') return out;
    for (const part of s.split(/,(?![^(]*\))/)) {
      if (/rgba\([^)]*,\s*0\)|transparent/.test(part)) continue;
      const n = (part.replace(/(rgba?|hsla?|color|oklch|oklab|lab|lch)\([^)]*\)|#[0-9a-f]{3,8}/gi, '').match(/-?[\d.]+px/g) || []).map(px); const [x = 0, y = 0, blur = 0, spread = 0] = n;
      if (x || y || blur || spread <= 0) continue; if (/inset/.test(part)) out.inner = Math.max(out.inner, spread); else out.outer = Math.max(out.outer, spread);
    }
    return out;
  }
  const inBorderBox = (el, q) => { const r = el.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1 && q.top >= r.top - 1 && q.bottom <= r.bottom + 1; };
  const grow = (u, q) => (!q ? u : !u ? { left: q.left, top: q.top, right: q.right, bottom: q.bottom } : { left: Math.min(u.left, q.left), top: Math.min(u.top, q.top), right: Math.max(u.right, q.right), bottom: Math.max(u.bottom, q.bottom) });
  const sized = (u) => (u ? Object.assign(u, { width: u.right - u.left, height: u.bottom - u.top }) : null);
  // the words of one text node, cap height to baseline, without the spaces around them
  function nodeLetters(n) {
    const pe = n.parentElement; if (!pe) return null; const c = cs(pe); if (c.visibility === 'hidden' || clearInk(c)) return null; const t = n.nodeValue; const i0 = t.search(/\S/); if (i0 < 0) return null; const i1 = t.replace(/\s+$/, '').length;
    const m = metrics(c); const rg = document.createRange(); rg.setStart(n, i0); rg.setEnd(n, i1); let b = null;
    const ls = Math.max(0, px(c.letterSpacing)); for (const q of rg.getClientRects()) { if (q.width < 0.5) continue; const base = q.top + (q.height - (m.asc + m.desc)) / 2 + m.asc; b = grow(b, { left: q.left, right: q.right - ls, top: base - m.cap, bottom: base }); }
    return sized(b);
  }
  // the words in a field: its value, else its placeholder, measured with the field's font from where its content box starts
  function fieldLetters(f) {
    const t = (f.value || f.placeholder || '').trim(); if (!t) return null; const c = cs(f), r = f.getBoundingClientRect(); const m = metrics(c); CX.font = `${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
    const w = CX.measureText(t).width + px(c.letterSpacing) * Math.max(0, t.length - 1); const L = r.left + px(c.borderLeftWidth) + px(c.paddingLeft), R = r.right - px(c.borderRightWidth) - px(c.paddingRight);
    const left = /center/.test(c.textAlign) ? (L + R - w) / 2 : /right|end/.test(c.textAlign) ? R - w : L; const T = r.top + px(c.borderTopWidth) + px(c.paddingTop), B = r.bottom - px(c.borderBottomWidth) - px(c.paddingBottom);
    const base = T + (B - T - (m.asc + m.desc)) / 2 + m.asc; return sized({ left, right: left + w, top: base - m.cap, bottom: base });
  }
  // an icon drawn over a field from outside it (the search bars' magnifier: an absolutely placed svg beside the input, in its left padding)
  function placedIcon(el) { if (!el || !el.parentElement || el instanceof SVGElement || el.querySelector('svg')) return null; const r = el.getBoundingClientRect(); for (const sv of el.parentElement.children) { if (sv === el || sv.tagName.toLowerCase() !== 'svg' || !/absolute|fixed/.test(cs(sv).position) || !visible(sv)) continue; const q = sv.getBoundingClientRect(); const mx = (q.left + q.right) / 2, my = (q.top + q.bottom) / 2; if (q.width && mx > r.left && mx < r.right && my > r.top && my < r.bottom) return sv; } return null; }
  // every drawn line of a thing's content: words and icons (what a painted box inside must hold to be the thing's box)
  function contentInk(el) {
    let u = null; const t = el.tagName.toLowerCase(); if (t === 'input' || t === 'textarea') u = grow(u, fieldLetters(el)); else u = grow(u, letters(el));
    for (const s of el.querySelectorAll('svg')) if (visible(s) && !hiddenAbove(s)) u = grow(u, iconBox(s)); return sized(u);
  }
  // the painted box: the thing itself when it paints (with a ring drawn outside it), else its ::before/::after when that lies inside it (a glow
  // drawn past the box is decoration, not the box), else the outermost painted thing inside that holds all of its words and icons (the gunsmith
  // code's 32px box in a 44px click area; a checkbox's 18px box in a 44px one), else the thing's own box, marked bare
  function paintTarget(el) {
    if (DESCEND && el && el.nodeType === 1 && !(el instanceof SVGElement)) { let hotNow = false; try { hotNow = el.matches(':hover, :focus, :focus-visible, :active'); } catch (e) {}
      if (hotNow) { let tw = null; try { tw = [...document.querySelectorAll(selOf(el))].find((x) => x !== el && visible(x) && !x.matches(':hover, :focus, :focus-visible, :active')); } catch (e) {}
        const Tt = tw && paintTarget0(tw); if (Tt && Tt.el === tw && Tt.part !== 'self') { const pr = pseudoRect(el, Tt.part); if (pr) return { el, part: Tt.part, rect: pr }; } } }
    return paintTarget0(el);
  }
  function paintTarget0(el) {
    if (!el || el.nodeType !== 1 || el instanceof SVGElement) return null; const c = cs(el), rr = el.getBoundingClientRect();
    if (paints(c)) { const g = shadowRings(c).outer; return { el, part: 'self', rect: g ? sized({ left: rr.left - g, top: rr.top - g, right: rr.right + g, bottom: rr.bottom + g }) : box(rr) }; }
    for (const pe of ['::before', '::after']) { const pr = pseudoRect(el, pe); if (pr && pr.width > 3 && pr.height > 3 && !(pr.width > rr.width * 1.25 + 4 && pr.height > rr.height * 1.25 + 4) && !/blur/.test(cs(el, pe).filter)) return { el, part: pe, rect: pr }; }
    const ink = contentInk(el);
    if (ink) { const q = [...el.children].map((x) => [x, 1]); let seenN = 0;
      while (q.length && seenN++ < 120) { const [d, depth] = q.shift(); if (d instanceof SVGElement || !visible(d)) continue; const vb = visibleBox(d);
        if (vb && vb.rect.left <= ink.left + 0.5 && vb.rect.right >= ink.right - 0.5 && vb.rect.top <= ink.top + 0.5 && vb.rect.bottom >= ink.bottom - 0.5) return { el: d, part: vb.part, rect: vb.rect, via: el };
        if (depth < 4) for (const k of d.children) q.push([k, depth + 1]); } }
    return { el, part: 'self', rect: box(rr), bare: true };
  }
  // the inside edge of the painted box: past its border, or past an inset ring that draws the edge
  function innerOf(T) {
    const self = T.part === 'self'; const c = cs(T.el, self ? null : T.part); const r = self ? T.el.getBoundingClientRect() : T.rect; const ri = shadowRings(c).inner; /* a ring drawn on a ::before is the edge too: the share button's 1px line was counted as space inside, 9 where the eye reads 8 (Harkirat, 2026-10-06 12:10 EDT) */
    const b = (s) => Math.max(c['border' + s + 'Style'] === 'none' ? 0 : px(c['border' + s + 'Width']), ri);
    return sized({ left: r.left + b('Left'), top: r.top + b('Top'), right: r.right - b('Right'), bottom: r.bottom - b('Bottom') });
  }
  // the drawn pieces inside the painted box, in the order they read
  // a label a ::before or ::after writes in the flow (an attachment's slot name, "MUZZLE", from its data-slot) is drawn words like any other:
  // left out, the attachment chip's space inside read 53 to its name instead of 10 to its label (Harkirat, 2026-10-06 12:24 EDT). Its sides
  // come from the layout (the content edge, the item beside it, the gap, its margins); its letters from the font, cap height to baseline
  let CV = null;
  function flowWords(n, which) {
    const c = cs(n, which); if (!c || c.display === 'none' || /absolute|fixed/.test(c.position) || c.visibility === 'hidden' || +c.opacity === 0) return null;
    const mt = /^"([\s\S]*)"$/.exec(c.content || ''); if (!mt || !mt[1].trim()) return null;
    const hc = cs(n), r = n.getBoundingClientRect(); const L = r.left + px(hc.borderLeftWidth) + px(hc.paddingLeft), R = r.right - px(hc.borderRightWidth) - px(hc.paddingRight), T = r.top + px(hc.borderTopWidth) + px(hc.paddingTop), B = r.bottom - px(hc.borderBottomWidth) - px(hc.paddingBottom);
    const flex = /flex|grid/.test(hc.display); const gap = flex ? px(hc.columnGap) : 0; const items = [];
    for (const ch of n.childNodes) { if (ch.nodeType === 3) { if (!ch.nodeValue.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(ch); const q = rg.getBoundingClientRect(); if (q.width > 0.5) items.push({ l: q.left, r: q.right }); continue; } if (ch.nodeType !== 1 || !visible(ch) || /absolute|fixed/.test(cs(ch).position)) continue; const q = ch.getBoundingClientRect(), mc = cs(ch); items.push({ l: q.left - px(mc.marginLeft), r: q.right + px(mc.marginRight) }); }
    // its box: the used width and height the browser gives the pseudo, placed against the item beside it; its letters: the line inside that box,
    // placed by the box's own alignment when the pseudo is itself a flex box (the slot label is one: 28 tall, its 12px line centred in it)
    const txt = /uppercase/.test(c.textTransform) ? mt[1].toUpperCase() : /lowercase/.test(c.textTransform) ? mt[1].toLowerCase() : mt[1];
    if (!CV) CV = document.createElement('canvas').getContext('2d'); CV.font = `${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`; try { CV.letterSpacing = c.letterSpacing === 'normal' ? '0px' : c.letterSpacing; } catch (_) {}
    const mm = CV.measureText(txt); const cap = CV.measureText('H').actualBoundingBoxAscent; const fa = mm.fontBoundingBoxAscent, fd = mm.fontBoundingBoxDescent; const tw = Math.max(0, mm.width - px(c.letterSpacing));
    const w = px(c.width), h = px(c.height); if (!(w > 0.5)) return null;
    const boxL = which === '::before' ? L + px(c.marginLeft) : (items.length ? Math.max(...items.map((x) => x.r)) + gap : L) + px(c.marginLeft);
    const left = boxL + px(c.borderLeftWidth) + px(c.paddingLeft), right = left + Math.min(tw, w - px(c.paddingLeft) - px(c.paddingRight) - px(c.borderLeftWidth) - px(c.borderRightWidth));
    if (!(right - left > 0.5)) return null;
    const as = c.alignSelf && !/auto|normal/.test(c.alignSelf) ? c.alignSelf : hc.alignItems; const hh = h > 0.5 ? h : B - T;
    const boxT = flex ? (/center/.test(as) ? T + (B - T - hh) / 2 : /end/.test(as) ? B - hh : T) : T;
    const inT = boxT + px(c.borderTopWidth) + px(c.paddingTop), inH = hh - px(c.borderTopWidth) - px(c.borderBottomWidth) - px(c.paddingTop) - px(c.paddingBottom);
    const lh = c.lineHeight === 'normal' ? fa + fd : px(c.lineHeight); const pai = c.alignItems;
    const lineTop = /flex|grid/.test(c.display) ? (/center/.test(pai) ? inT + (inH - lh) / 2 : /end/.test(pai) ? inT + inH - lh : inT) : inT; const base = lineTop + (lh - (fa + fd)) / 2 + fa;
    if (c.textBoxTrim && c.textBoxTrim !== 'none') return sized({ left, right, top: inT + (inH - cap) / 2, bottom: inT + (inH + cap) / 2 });
    return sized({ left, right, top: base - cap, bottom: base });
  }
  // the outer edge of what a thing draws, as the eye meets it beside its neighbours: its own painted box (or the ring its ::before draws),
  // else the union of what it holds, each painted box whole; a wrapper around the image chip is the chip's bordered square, never the
  // picture inside it (Harkirat, 2026-10-06 13:03 EDT: "why is it ignoring the image mark's border")
  function drawnExtent(el) { const vb = visibleBox(el); if (vb) return vb.rect; const T = paintTarget(el); if (T && !T.bare && T.el === el && T.part && T.part !== 'self' && T.rect) return T.rect; const P = inkParts(el, { el, part: 'self', rect: el.getBoundingClientRect() }); let u = null; for (const q of P) { const r = clipTo(q, el); if (r) u = grow(u, r); } return u ? sized(u) : null; }
  // a piece is seen only inside every box between it and el that hides its overflow (a scrolled attachment rail ends at its box, not at its
  // last chip: read whole, a build's attachments ran over its buttons and the row's gaps read nothing)
  function clipTo(q, el) { const r = { left: q.rect.left, right: q.rect.right, top: q.rect.top, bottom: q.rect.bottom }; let a = q.node && (q.node.nodeType === 1 ? q.node : q.node.parentElement); for (; a && a !== el.parentElement; a = a.parentElement) { const c = cs(a); if (c.overflowX === 'visible' && c.overflowY === 'visible') continue; const b = a.getBoundingClientRect(); if (c.overflowX !== 'visible') { r.left = Math.max(r.left, b.left); r.right = Math.min(r.right, b.right); } if (c.overflowY !== 'visible') { r.top = Math.max(r.top, b.top); r.bottom = Math.min(r.bottom, b.bottom); } } return r.right - r.left > 0.25 && r.bottom - r.top > 0.25 ? sized(r) : null; }
  function inkParts(el, T = paintTarget(el)) {
    const out = []; if (!T) return out; const host = T.part === 'self' ? T.el : el; const tag = host.tagName.toLowerCase();
    const pi = /^(input|textarea|select)$/.test(tag) ? placedIcon(host) : null; if (pi) out.push({ kind: 'icon', rect: iconBox(pi), node: pi, placed: true });
    if (tag === 'input' || tag === 'textarea') { const q = fieldLetters(host); if (q) out.push({ kind: 'words', rect: q, node: host }); }
    const walk = (n) => {
      const pb = flowWords(n, '::before'); if (pb) out.push({ kind: 'words', rect: pb, node: n, pseudo: '::before' });
      const pa = flowWords(n, '::after'); if (pa) out.push({ kind: 'words', rect: pa, node: n, pseudo: '::after' });
      for (const ch of n.childNodes) {
        // words set right or centre in a box of their own (a toolbar's label column, 64 wide, its word right-aligned) are spaced from that
        // box, as seen() measures them: from their letters, the space beside them changed with the word's length (Harkirat, 2026-10-06
        // 12:55 EDT: "the text is in a pre-defined column")
        if (ch.nodeType === 3) { const q = nodeLetters(ch); if (q) { let pe = ch.parentElement; while (pe && pe !== host && /^inline$/.test(cs(pe).display) && pe.parentElement && pe.parentElement !== host && pe.parentElement.childNodes.length === 1) pe = pe.parentElement; /* an inline run's box is the box it sits in */ const ab = pe && pe !== host ? alignedBox(pe, q) : null; out.push({ kind: /^[\s\d.,+×%-]+$/.test(ch.nodeValue) ? 'count' : 'words', rect: ab ? sized({ left: ab.left, right: ab.right, top: q.top, bottom: q.bottom }) : q, node: ch, box: !!ab }); } continue; }
        if (ch.nodeType !== 1 || !visible(ch) || hides(ch)) continue;
        if (ch.tagName.toLowerCase() === 'svg') { out.push({ kind: 'icon', rect: iconBox(ch), node: ch }); continue; } if (ch instanceof SVGElement) continue;
        const vb = visibleBox(ch); if (vb) { out.push({ kind: (ch.textContent || '').trim() ? 'badge' : 'mark', rect: vb.rect, node: ch }); continue; }
        // a box drawn by a ::before or ::after (a ring button, the image chip's bordered square) is what the eye meets, not the icon inside
        // it: the image chip was spaced from its picture, 17 to the code where its edge sits 12 away (Harkirat, 2026-10-06 13:03 EDT)
        { const T2 = paintTarget(ch); if (T2 && !T2.bare && T2.part && T2.part !== 'self' && T2.rect) { out.push({ kind: (ch.textContent || '').trim() ? 'badge' : 'mark', rect: T2.rect, node: ch, drawnBy: T2.part }); continue; } }
        // a box drawn as a group of small painted boxes and nothing else (the History chips' signal meter: four bars) is one glyph, an icon,
        // never four dots: the Dot size knob had made every bar an 8px square (Harkirat 2026-10-05 23:01 EDT, "that's actually broken")
        const vk = [...ch.children].filter((k) => visible(k) && !hides(k)); const gb = vk.map((k) => (!(k.textContent || '').trim() && !(k instanceof SVGElement) ? visibleBox(k) : null));
        if (vk.length >= 2 && gb.every(Boolean) && ![...ch.childNodes].some((x) => x.nodeType === 3 && x.nodeValue.trim())) { const L = Math.min(...gb.map((g) => g.rect.left)), T = Math.min(...gb.map((g) => g.rect.top)), R = Math.max(...gb.map((g) => g.rect.right)), B = Math.max(...gb.map((g) => g.rect.bottom)); out.push({ kind: 'icon', rect: { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T, x: L, y: T }, node: ch, group: true }); continue; }
        walk(ch);
      }
    };
    walk(host); const hc = cs(host); const vert = /flex/.test(hc.display) && /^column/.test(hc.flexDirection);
    return out.sort((a, b) => (vert ? a.rect.top - b.rect.top : a.rect.left - b.rect.left || a.rect.top - b.rect.top));
  }
  // how much room a box has beyond its padding and its content's own boxes, side by side: above 0, its alignment places its content (an icon
  // centred in a fixed 32px button), so its side spaces follow its width, and padding can't set them
  function slackOf(host) {
    const c = cs(host), r = host.getBoundingClientRect(); let u = null;
    for (const ch of host.childNodes) { if (ch.nodeType === 3) { if (!ch.nodeValue.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(ch); const q = rg.getBoundingClientRect(); if (q.width > 0.5) u = grow(u, q); continue; } if (ch.nodeType !== 1 || !visible(ch) || /absolute|fixed/.test(cs(ch).position)) continue; const q = ch.getBoundingClientRect(); const mc = cs(ch); u = grow(u, { left: q.left - px(mc.marginLeft), right: q.right + px(mc.marginRight), top: q.top, bottom: q.bottom }); }
    if (!u) return 0; const L = r.left + px(c.borderLeftWidth) + px(c.paddingLeft), R = r.right - px(c.borderRightWidth) - px(c.paddingRight); return Math.max(0, u.left - L) + Math.max(0, R - u.right);
  }
  // try a setting for a moment and read what moves: a rule in a sheet of its own (no DOM change, so nothing re-renders), stronger than the
  // builder's own rules, on a path that reaches this one element only, removed straight after. The question every setting must answer before
  // it is offered: does this property move this drawn edge one for one? (a padding beside a label that stretches, or beside centred content,
  // does not; the class test of 12:26 EDT found them as settings that "didn't apply")
  let PS = null; const pathOf = (el) => { const st = []; for (let e = el; e && e !== document.body; e = e.parentElement) { if (e.id) { st.unshift('#' + CSS.escape(e.id)); break; } const p = e.parentElement; if (!p) break; st.unshift(`${e.tagName.toLowerCase()}:nth-child(${[...p.children].indexOf(e) + 1})`); } return st.join(' > '); };
  function probe(el, decl, read) { if (!PS) { PS = new CSSStyleSheet(); document.adoptedStyleSheets = [...document.adoptedStyleSheets, PS]; } const i = PS.insertRule(`:root:not(#bdp0):not(#bdp1):not(#bdp2):not(#bdp3) ${pathOf(el)}{${decl}}`, PS.cssRules.length); try { return read(); } finally { PS.deleteRule(i); } }
  // the space inside, on all four sides, from the inside edge to the drawn pieces
  const SN = (x) => { const d = window.devicePixelRatio || 1; return Math.round(x * d) / d; }; const snapR = (r) => sized({ left: SN(r.left), top: SN(r.top), right: SN(r.right), bottom: SN(r.bottom) });
  function inside(el) {
    const T = paintTarget(el); if (!T) return null; const P = inkParts(el, T); if (!P.length) return null; const I = innerOf(T); let u = null; for (const p of P) u = grow(u, p.rect); sized(u);
    if (u.left < I.left - 2 || u.right > I.right + 2 || u.top < I.top - 2 || u.bottom > I.bottom + 2) return null; // its pieces spill out of it: the model doesn't describe this one
    return { T, inner: I, ink: u, parts: P, left: u.left - I.left, right: I.right - u.right, top: u.top - I.top, bottom: I.bottom - u.bottom };
  }
  // the spaces between the drawn pieces, line to line, along the way they run
  function gaps(el, D = inside(el)) {
    if (!D) return []; const hc = cs(D.T.part === 'self' ? D.T.el : el); const vert = /flex/.test(hc.display) && /^column/.test(hc.flexDirection); const out = [];
    for (let i = 1; i < D.parts.length; i++) { const a = D.parts[i - 1], z = D.parts[i]; const sameLine = Math.min(a.rect.bottom, z.rect.bottom) - Math.max(a.rect.top, z.rect.top) > 0 || vert; if (!sameLine) continue; const g = vert ? z.rect.top - a.rect.bottom : z.rect.left - a.rect.right; if (g > -0.25) out.push({ a, b: z, px: g, axis: vert ? 'y' : 'x' }); }
    return out;
  }
  // the old name, kept for its callers: the painted box inside, when it is not the thing itself
  function paintedChild(el) { const T = paintTarget(el); return T && T.el !== el ? { el: T.el, rect: T.rect } : null; }
  function seen(el) {
    const k = kindOf(el); if (k === 'icon') return iconBox(el);
    if (DESCEND && (k === 'control' || k === 'box')) { const T = paintTarget(el); if (T) return T.rect; }
    const vb = visibleBox(el); if (vb) return vb.rect;
    if (k === 'text') { const l = letters(el); if (l) return clipped(el, alignedBox(el, l) || l); }
    return box(el.getBoundingClientRect());
  }
  // words cut off by a box that hides its overflow are measured where they stop showing (C7's long names measured 708 in a 538 box)
  function clipped(el, q) { if (!DESCEND || !q) return q; let o = { ...q }; for (let a = el, i = 0; a && i < 6; a = a.parentElement, i++) { const c = cs(a); if (c.overflowX !== 'visible') { const r = a.getBoundingClientRect(); o.left = Math.max(o.left, r.left); o.right = Math.min(o.right, r.right); } } o.width = Math.max(0, o.right - o.left); return o; }
  const visibleHeight = (el) => { if (DESCEND && kindOf(el) === 'control') { const T = paintTarget(el); if (T) return T.rect.height; } const vb = visibleBox(el); return vb ? vb.rect.height : el.getBoundingClientRect().height; };

  function gateOf(el) { for (let a = el; a; a = a.parentElement) if (a.id && GATES[a.id]) return GATES[a.id]; return null; }
  function gateEl(g) { const id = Object.keys(GATES).find((k) => GATES[k] === g); return id ? document.getElementById(id) : null; }
  function nameOf(el) {
    if (!el) return ''; const t = el.tagName.toLowerCase();
    if (t === 'svg') { const u = el.querySelector('use'); return 'icon ' + ((u && (u.getAttribute('href') || u.getAttribute('xlink:href') || '').replace(/^#i-/, '')) || ''); }
    const a = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('data-tip');
    const tx = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    return (tx || a || t).slice(0, 40);
  }
  // classes that say what state or tone a thing is in, never what it is: left out of a member's selector so one variant covers every state and tone
  const STATE = /^(on|off|open|closed|sel|selected|active|hover|focus|fresh|pressed|busy|dirty|done|in|out|show|shown|hide|hidden|is-[\w-]+|warn|ok|bad|err|error|go|dang|danger|staged|alert|probe|mp|dmz|filled|empty|up|down|first|last|cur|current|now|new|b3-fady|b3-fadx|b3-fadxy|pb-in)$/;
  function classesOf(el) { return (el.getAttribute('class') || '').split(/\s+/).filter((x) => x && !STATE.test(x) && /^[a-zA-Z_][\w-]*$/.test(x)); }
  function selOf(el, scoped) {
    const t = el.tagName.toLowerCase(); const cl = classesOf(el); let s;
    if (cl.length) s = t + cl.map((x) => '.' + CSS.escape(x)).join('');
    else { const p = el.parentElement; s = p && p.id !== 'board' ? `${selOf(p)} > ${t}` : t; }
    if (scoped) { const g = gateOf(el); const id = Object.keys(GATES).find((k) => GATES[k] === g); if (id) s = `#${id} ${s}`; }
    return s;
  }
  function label(el) {
    const k = kindOf(el);
    if (k === 'text' || (k === 'control' && el.querySelectorAll('*').length <= 6)) return `“${nameOf(el).slice(0, 26)}”`;
    if (k === 'icon') return `the ${nameOf(el)}`;
    const c = classesOf(el)[0]; return c ? `the ${c} box` : `the ${el.tagName.toLowerCase()} box`;
  }

  function styleOf(c) {
    const m = c.backgroundColor.match(/rgba?\(([^)]+)\)/); const parts = m ? m[1].split(',') : []; const a = parts.length === 4 ? parseFloat(parts[3]) : parts.length ? 1 : 0;
    if (c.backgroundImage !== 'none') return 'gradient'; if (a >= 0.6) return 'fill'; if (a > 0.01) return 'tint'; return paintsEdge(c) ? 'outline' : 'quiet';
  }
  // ── what a thing IS, apart from the state it is in (Harkirat, 2026-10-03 20:54 EDT: C1's pressed "All 24" matched C6's selected
  // "Delivery queue" tab and C4's "5 Repairs NEED WORK" as "same", and only "family" with its own row's Assault, SMG…, because a pressed
  // chip is outlined and a resting one filled: identity was read off the paint of the moment) ──
  // The paint of a pressed, selected, checked, current or open thing is its state. Its build's paint is a resting sibling's of the same
  // class; with no resting sibling, its paint is unknown and decides nothing.
  const ONCLS = /^(on|active|is-on|is-active|selected|is-selected|current|is-current|open|is-open)$/;
  function isOn(el) {
    for (const a of ['aria-pressed', 'aria-selected', 'aria-checked', 'aria-expanded']) if (el.getAttribute(a) === 'true') return true;
    const cur = el.getAttribute('aria-current'); if (cur && cur !== 'false') return true;
    return classesOf(el).some((c) => ONCLS.test(c));
  }
  const buildCls = (e) => classesOf(e).filter((x) => !LOOSE.test(x) && !ONCLS.test(x));
  const paintOf = (e) => { const vb = visibleBox(e); return vb ? styleOf(vb.part !== 'self' ? cs(e, vb.part) : cs(e)) : 'none'; };
  // a pressed thing's resting sibling of the same build (pressing can change the weight of its words too: C2's "No tier")
  function restSib(el) {
    const mine = buildCls(el)[0] || ''; const p = el.parentElement; if (!p) return null;
    for (const s of p.children) { if (s === el || s.tagName !== el.tagName || isOn(s) || !visible(s)) continue; if ((buildCls(s)[0] || '') === mine) return s; }
    return null;
  }
  // the thing under the pointer (or being pressed or focused) shows its hover paint: its resting paint is a twin's of the same build that is
  // not, else unknown (Harkirat, 2026-10-05 12:47 EDT: the share button he pointed at read as only "family" with 22 identical share buttons)
  const hot = (el) => { try { return el.matches(':hover, :active, :focus-visible'); } catch (e) { return false; } };
  function hotRest(el) { const k = selOf(el); let tw = null; try { tw = [...document.querySelectorAll(k)].find((x) => x !== el && visible(x) && !hot(x) && !isOn(x)); } catch (e) {} return tw ? paintOf(tw) : null; }
  function restPaint(el) { if (!isOn(el)) return paintOf(el); const s = restSib(el); return s ? paintOf(s) : null; }
  // What a control holds, in order, through the wrappers that only group it: a leading mark (an icon, a dot, an avatar), its words, and
  // what trails them (a count, a caps tag, an icon). A filter chip is words and a count, with or without a mark; a count in a painted badge
  // ahead of the words, or a caps tag after them, is another control (C4's "5 Repairs NEED WORK" is not a filter chip).
  const NUM = /^[\d.,+\-–%/×x ]+$/;
  function partsOf(el) {
    const out = [];
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) { const t = c.nodeValue.trim(); if (t) out.push(NUM.test(t) ? 'count' : 'words'); continue; }
        if (c.nodeType !== 1 || !visible(c) || hides(c)) continue;
        if (c instanceof SVGElement) { out.push('mark'); continue; }
        const vb = visibleBox(c), r = c.getBoundingClientRect(), t = c.textContent.trim();
        if (vb && r.width <= 26 && r.height <= 26) { out.push(/^\d+$/.test(t) ? 'badge' : 'mark'); continue; }
        if (vb && t) { out.push(/^\d+$/.test(t) ? 'badge' : 'pill'); continue; }
        if (!t) { if (vb || c.querySelector('svg')) out.push('mark'); continue; }
        if (!c.children.length) { const cc = cs(c); out.push(NUM.test(t) ? 'count' : cc.textTransform === 'uppercase' && px(cc.letterSpacing) >= 0.4 && out.includes('words') ? 'tag' : 'words'); continue; }
        walk(c);
      }
    };
    walk(el); const m = []; for (const x of out) if (!(x === 'words' && m[m.length - 1] === 'words')) m.push(x); return m;
  }
  // A control holding more than four parts is a composite (a build row, a history row, a card): its parts vary with its content, so it is
  // judged by its size, paint and class, never part by part (C1's build rows differ only in how many attachments they list)
  function buildOf(el) {
    const p = partsOf(el); if (p.length > 4) return { composite: true, words: p.includes('words'), lead: '', trail: '' }; const i = p.indexOf('words'); const lead = i > 0 ? p.slice(0, i) : [], trail = i >= 0 ? p.slice(i + 1) : p;
    return { lead: lead.includes('badge') ? 'badge' : lead.length ? 'mark' : '', words: i >= 0, trail: trail.filter((x) => x !== 'words').join('+') };
  }
  // a control in a track (a painted box holding only controls: a segmented switch) is a segment, never a free chip or button
  function ctxOf(el) {
    let p = el.parentElement;
    for (let i = 0; i < 2 && p; i++, p = p.parentElement) {
      const kids = [...p.children].filter(visible); const vb = visibleBox(p);
      if (vb && kids.length >= 2 && kids.every((k) => isControl(k) && !/^(input|select|textarea)$/i.test(k.tagName)) && kids.every((k) => Math.abs(k.getBoundingClientRect().top - kids[0].getBoundingClientRect().top) <= 4)) return 'segment';
      if (vb) break;
    }
    return 'free';
  }
  // the thing's role from the identity table (bd/identity.js, read through bd/roles.js); undefined when the page has no table
  const roleName = (el) => { const R = window.BD_ROLES; if (!R) return undefined; try { return R.classify(el, { kindOf }).role || null; } catch (e) { return null; } };
  function signature(el) {
    const k = kindOf(el); const c = cs(el); const vb = visibleBox(el); const pc = vb && vb.part !== 'self' ? cs(el, vb.part) : c;
    const svg = k === 'icon' ? el : el.querySelector && el.querySelector('svg'); const r = el.getBoundingClientRect(); const style = vb ? styleOf(pc) : 'none';
    return { kind: k, h: +(vb ? vb.rect.height : r.height).toFixed(1), w: +r.width.toFixed(1), r: px(pc.borderTopLeftRadius), style, edge: +px(pc.borderTopWidth).toFixed(1),
      pl: px(c.paddingLeft), pr: px(c.paddingRight), pt: px(c.paddingTop), pb: px(c.paddingBottom), fs: px(c.fontSize), fw: +c.fontWeight || 400, lh: px(c.lineHeight), ls: +px(c.letterSpacing).toFixed(2), tt: c.textTransform,
      ff: (c.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim(), icon: svg && svg !== el ? +svg.getBoundingClientRect().width.toFixed(1) : 0, gap: px(c.columnGap), rgap: px(c.rowGap), disp: c.display, dir: c.flexDirection, part: vb ? vb.part : 'none',
      on: isOn(el), rest: hot(el) ? hotRest(el) : restPaint(el), rfw: isOn(el) && restSib(el) ? +cs(restSib(el)).fontWeight || 400 : +c.fontWeight || 400, build: k === 'control' ? buildOf(el) : null, ctx: k === 'control' ? ctxOf(el) : null, job: k === 'text' ? jobOf(el) : null, role: roleName(el) };
  }
  // by eye, not by exact numbers: words, tone and width never split a lookalike; a couple of pixels of size don't either
  // Same: one build, at rest, within a couple of pixels. Paint compares resting looks (unknown decides nothing), a control's parts and its
  // place (free or in a track) must agree, and words must do the same job. Signatures saved before these fields existed skip them.
  const restOf = (s) => (s.rest === undefined ? s.style : s.rest);
  const samePaint = (a, b) => restOf(a) == null || restOf(b) == null || restOf(a) === restOf(b);
  const pillish = (s) => s.r >= s.h / 2 - 0.5;
  const sameShape = (a, b) => Math.abs(a.h - b.h) <= 2.5 && ((pillish(a) && pillish(b)) || Math.abs(a.r - b.r) <= 2.5);
  function sameBuild(a, b) {
    if (!a.build || !b.build) return true; const x = a.build, y = b.build; if (x.composite || y.composite) return !!x.composite === !!y.composite;
    return x.words === y.words && x.trail === y.trail && (x.lead === 'badge') === (y.lead === 'badge') && (a.ctx || 'free') === (b.ctx || 'free');
  }
  function similar(a, b, opt) {
    if (!a || !b || a.kind !== b.kind) return false;
    // two things with different roles are never the same, however alike they measure (a toggle rail's segment is not a filter chip); opt.look
    // asks only whether they LOOK alike, for the family row (the share and delete buttons: two roles, one 32px icon button)
    if (!(opt && opt.look) && a.role !== undefined && b.role !== undefined && (a.role || b.role) && a.role !== b.role) return false;
    // the type of a control's words counts only when both have words (an icon button's font is invisible)
    if (a.kind === 'control') { const w = !a.build || !b.build || (a.build.words && b.build.words); return samePaint(a, b) && sameShape(a, b) && (!w || (Math.abs(a.fs - b.fs) <= 1 && Math.abs((a.rfw || a.fw) - (b.rfw || b.fw)) <= 100)) && sameBuild(a, b); }
    if (a.kind === 'box') return samePaint(a, b) && sameShape(a, b) && Math.abs(a.fs - b.fs) <= 1;
    if (a.kind === 'text') return Math.abs(a.fs - b.fs) <= 0.5 && Math.abs(a.fw - b.fw) <= 100 && a.tt === b.tt && Math.abs(a.ls - b.ls) <= 0.3 && a.ff === b.ff && (a.job === undefined || b.job === undefined || (a.job || null) === (b.job || null));
    if (a.kind === 'icon') return Math.abs(a.h - b.h) <= 2;
    if (a.kind === 'layout') return a.disp === b.disp && a.dir === b.dir && samePaint(a, b) && Math.abs(a.gap - b.gap) <= 3 && Math.abs((a.pl + a.pr) - (b.pl + b.pr)) <= 6 && Math.abs((a.pt + a.pb) - (b.pt + b.pb)) <= 6;
    if (a.kind === 'divider') return Math.abs(Math.min(a.h, a.w) - Math.min(b.h, b.w)) <= 0.5;
    return false;
  }

  // a thing's role, by name rather than by measurement: the classes it carries and the make-up of what it holds. Two things of one kind that
  // share a class, or hold mostly the same named parts, are one family even when one holds more: History's toolbar is the Armory's with a
  // filter row added (Harkirat, 2026-10-03 15:07 EDT: "widen your similarly search… it's just more detail but overall the same")
  const LOOSE = /^(sr|sr-only|visually-hidden|ic|b4g|app|pb-[\w-]+|g-[\w-]+)$/;
  // A line of words' job, read from where it sits and how it is set, never from its font: a caps label beside what it names (a toolbar row's
  // MANIFEST, a panel's BROADCAST, a filter group's KIND), a caps label above a field, a column's head, a heading. Words with one job and
  // sizes within 1.5px are one family however they are typed (Harkirat, 2026-10-03 20:38 EDT: C6's "Broadcast" is "more or less the same
  // element/purpose, just typed in a different style"). A control's job is its words: two Export buttons styled apart are still one family.
  const flowKids = (p) => [...p.children].filter((x) => visible(x) && !/absolute|fixed/.test(cs(x).position));
  function jobOf(el) {
    const k = kindOf(el);
    if (k === 'control') { const w = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase().replace(/\d+/g, '#'); return w.length >= 2 && w.length <= 28 ? 'words: ' + w : null; }
    if (k !== 'text') return null;
    if (el.closest('th, thead, [role="columnheader"]')) return 'column head';
    if (/^h[1-6]$/i.test(el.tagName) || el.getAttribute('role') === 'heading') return 'heading';
    const c = cs(textHolder(el) || el); if (c.textTransform !== 'uppercase' || px(c.letterSpacing) < 0.4 || visibleBox(el)) return null;
    let u = el; for (let i = 0; i < 2 && u.parentElement && flowKids(u.parentElement).length === 1; i++) u = u.parentElement;
    const sib = u.parentElement ? flowKids(u.parentElement) : []; const at = sib.indexOf(u); const nx = sib[at + 1]; const a = u.getBoundingClientRect();
    if (nx) { const b = nx.getBoundingClientRect(); if (b.left >= a.right - 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0) return at === 0 ? 'row label' : null; if (b.top >= a.bottom - 1) return 'field label'; return null; }
    const pc = u.parentElement ? cs(u.parentElement) : null; return at === 0 && pc && /flex/.test(pc.display) && /^row/.test(pc.flexDirection) ? 'row label' : null;
  }
  function roleOf(el) {
    const named = (e) => classesOf(e).filter((x) => !LOOSE.test(x)); const kids = new Set();
    for (const c of el.children) { if (!visible(c)) continue; const n = named(c)[0]; if (n) kids.add(c.tagName.toLowerCase() + '.' + n); }
    const k = kindOf(el); return { kind: k, cls: named(el).filter((x) => !ONCLS.test(x)), kids, job: jobOf(el), fs: px(cs(el).fontSize), build: k === 'control' ? buildOf(el) : null, ctx: k === 'control' ? ctxOf(el) : null, h: el.getBoundingClientRect().height, role: roleName(el) };
  }
  // why two things are one family, or nothing: the reason shows on the panel's Family row
  function family(a, b) {
    if (!a || !b || !a.kind || a.kind !== b.kind) return false;
    // with roles on both sides the role decides: one role is one family; a role against no role is no family
    if (a.role !== undefined && b.role !== undefined && (a.role || b.role)) return a.role === b.role ? 'same role: ' + a.role : false;
    if (a.job && a.job === b.job && (a.kind === 'control' || Math.abs(a.fs - b.fs) <= 1.5)) return a.kind === 'control' ? 'same words' : a.job + 's';
    // a class names a build only as the FIRST one; later ones are tones and states (warn, on, topic) that cross builds
    if (a.cls[0] && a.cls[0] === b.cls[0]) return 'class ' + a.cls[0];
    if (a.kind === 'control' && a.build && b.build && sameBuild(a, b) && a.build.words && Math.abs(a.h - b.h) <= 8) return 'same parts';
    let n = 0; for (const x of a.kids) if (b.kids.has(x)) n++;
    return n >= 2 && n / Math.min(a.kids.size, b.kids.size) >= 0.75 ? 'same parts' : false;
  }

  // every thing in a scope; a control's own icon and words are its parts, not things of their own
  function things(scope, opts = {}) {
    const out = []; if (!scope) return out; const dead = new Set();
    for (const el of scope.querySelectorAll('*')) {
      if (isSvgPart(el) || el.closest('#bd-host')) continue;
      if ((el.parentElement && dead.has(el.parentElement)) || hides(el)) { dead.add(el); continue; }
      if (el.parentElement && textHolder(el.parentElement) === el) continue;
      if (opts.viewport) { const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue; }
      if (!visible(el) || !inStage(el)) continue; const k = kindOf(el); if (!k) continue;
      if (k !== 'control' && el.parentElement && el.parentElement.closest(CTL_SEL)) continue;
      if (!inked(el, k)) continue;
      out.push(el);
    }
    return out;
  }

  // ── the space between two things, piece by piece ──
  function common(a, b) { const s = new Set(); for (let x = a; x; x = x.parentElement) s.add(x); for (let y = b; y; y = y.parentElement) if (s.has(y)) return y; return null; }
  function causeOf(p, axis) {
    const c = cs(p); const X = axis === 'x'; const nm = label(p);
    if (/flex/.test(c.display)) {
      const row = /^row/.test(c.flexDirection); const main = (row && X) || (!row && !X);
      if (main) { if (/center|space|end|right/.test(c.justifyContent)) return `${nm} spreads its items (${c.justifyContent})`; return null; }
      if (/center/.test(c.alignItems)) return `${nm} centres its items`; if (/stretch|normal/.test(c.alignItems)) return `${nm} is ${X ? 'wider' : 'taller'} than this item`; if (/end/.test(c.alignItems)) return `${nm} lines its items up at the end`;
      return null;
    }
    if (/grid/.test(c.display)) return `${nm}'s ${X ? 'column' : 'row'} is ${X ? 'wider' : 'taller'} than this item`;
    if (X && /center|right|end/.test(c.textAlign)) return `${nm} centres its text`;
    if (!X && px(c.height) && /block|flow/.test(c.display)) return `${nm} is taller than what it holds`;
    return null;
  }
  const whereRef = (el, prop) => { try { return BD.why ? BD.why.short(BD.why.of(el, prop)) : null; } catch (e) { return null; } };
  const EDGEW = { top: 'above', bottom: 'below', left: 'before', right: 'after' };
  function edgeLabelOf(el, side) { const k = kindOf(el); if (k === 'text' && (side === 'left' || side === 'right')) { const l = letters(el); if (l && alignedBox(el, l)) return `${label(el)}'s edge and space inside`; } if (k === 'text') return `space ${EDGEW[side]} the letters of ${label(el)} (line height and letter shapes)`; if (k === 'icon') return `space around the lines of ${label(el)}`; const vb = visibleBox(el); return vb && vb.part !== 'self' ? `${label(el)}'s visible box sits inside its clickable area` : `${label(el)}'s visible edge sits inside its box`; }
  // every piece names the element it belongs to (who), so a correction can go to the right place: the relationship's own setting, or the
  // patches on the way (margins, a bare wrapper's padding) that a correction takes out
  function distance(a, b) {
    if (!a || !b || a === b || a.contains(b) || b.contains(a)) return null;
    let ra = seen(a), rb = seen(b);
    const vov = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top); const axis = vov > 0 ? 'x' : 'y';
    if ((axis === 'x' && rb.left < ra.left) || (axis === 'y' && rb.top < ra.top)) { [a, b] = [b, a]; [ra, rb] = [rb, ra]; }
    const X = axis === 'x'; const END = X ? 'right' : 'bottom', START = X ? 'left' : 'top', E = X ? 'Right' : 'Bottom', S = X ? 'Left' : 'Top';
    const total = rb[START] - ra[END]; const pieces = [];
    const add = (lab, v, from, kind, who) => { if (Math.abs(v) >= 0.01) pieces.push({ label: lab, px: +v.toFixed(2), from, kind, who }); };
    const C = common(a, b); if (!C) return null;
    const la = a.getBoundingClientRect(); add(edgeLabelOf(a, END), la[END] - ra[END], null, 'edge', a);
    let n = a;
    while (n.parentElement && n.parentElement !== C) {
      const p = n.parentElement; const cn = cs(n), cp = cs(p); const nr = n.getBoundingClientRect(), pr = p.getBoundingClientRect(); const m = px(cn['margin' + E]);
      add(`${label(n)}'s own outside space`, m, whereRef(n, 'margin-' + END), m < 0 ? 'patch' : 'margin', n);
      const pad = px(cp['padding' + E]), bor = px(cp['border' + E + 'Width']);
      add(`space left over inside ${label(p)}`, (pr[END] - bor - pad) - (nr[END] + m), causeOf(p, axis) || 'unexplained', 'leftover', p);
      add(`${label(p)}'s space inside`, pad, whereRef(p, 'padding-' + END), 'padding', p);
      add(`${label(p)}'s edge`, bor, whereRef(p, `border-${END}-width`), 'border', p);
      n = p;
    }
    const ca = n; const ma = px(cs(ca)['margin' + E]);
    add(`${label(ca)}'s own outside space`, ma, whereRef(ca, 'margin-' + END), ma < 0 ? 'patch' : 'margin', ca);
    const bside = []; let q = b;
    const lb = b.getBoundingClientRect();
    while (q.parentElement && q.parentElement !== C) {
      const p = q.parentElement; const cq = cs(q), cp = cs(p); const qr = q.getBoundingClientRect(), pr = p.getBoundingClientRect(); const m = px(cq['margin' + S]);
      const pad = px(cp['padding' + S]), bor = px(cp['border' + S + 'Width']);
      const step = [];
      const push = (lab, v, from, kind, who) => { if (Math.abs(v) >= 0.01) step.push({ label: lab, px: +v.toFixed(2), from, kind, who }); };
      push(`${label(p)}'s edge`, bor, whereRef(p, `border-${START}-width`), 'border', p);
      push(`${label(p)}'s space inside`, pad, whereRef(p, 'padding-' + START), 'padding', p);
      push(`space left over inside ${label(p)}`, (qr[START] - m) - (pr[START] + bor + pad), causeOf(p, axis) || 'unexplained', 'leftover', p);
      push(`${label(q)}'s own outside space`, m, whereRef(q, 'margin-' + START), m < 0 ? 'patch' : 'margin', q);
      bside.unshift(...step); q = p;
    }
    const cb = q; const mb = px(cs(cb)['margin' + S]);
    const car = ca.getBoundingClientRect(), cbr = cb.getBoundingClientRect(); const mid = (cbr[START] - mb) - (car[END] + ma); const cc = cs(C);
    let between = 0; let adj = false;
    for (let s = ca.nextElementSibling; s; s = s.nextElementSibling) { if (s === cb) { adj = true; break; } if (visible(s) && !/absolute|fixed/.test(cs(s).position)) between++; }
    if (!adj) { between = 0; for (let s = cb.nextElementSibling; s; s = s.nextElementSibling) { if (s === ca) { adj = true; break; } if (visible(s) && !/absolute|fixed/.test(cs(s).position)) between++; } }
    let named = 0;
    if (between === 0 && /flex|grid/.test(cc.display)) {
      const mainX = /flex/.test(cc.display) ? /^row/.test(cc.flexDirection) : true; const applies = /grid/.test(cc.display) || (X ? mainX : !mainX);
      const g = applies ? px(X ? cc.columnGap : cc.rowGap) : 0;
      if (g && Math.abs(g) <= Math.abs(mid) + 0.5) { add(`${label(C)}'s space between items`, g, whereRef(C, X ? 'column-gap' : 'row-gap'), 'gap', C); named = g; }
    }
    if (between > 0) add(`${between} other thing${between > 1 ? 's' : ''} in between`, mid - named, null, 'between', C);
    else add(`space left over inside ${label(C)}`, mid - named, causeOf(C, axis) || 'unexplained', 'leftover', C);
    add(`${label(cb)}'s own outside space`, mb, whereRef(cb, 'margin-' + START), mb < 0 ? 'patch' : 'margin', cb);
    pieces.push(...bside);
    add(edgeLabelOf(b, START), rb[START] - lb[START], null, 'edge', b);
    const sum = pieces.reduce((s, x) => s + x.px, 0);
    const unexplained = pieces.filter((x) => x.kind === 'leftover' && x.from === 'unexplained').reduce((s, x) => s + Math.abs(x.px), 0);
    return { a, b, axis, ra, rb, total: +total.toFixed(2), pieces, sum: +sum.toFixed(2), unexplained: +unexplained.toFixed(2) };
  }
  // the space from a thing's visible edge to its container's visible edge on one side, piece by piece, measured inward from the container:
  // his test for centring is the space above the letters and below them inside their row (BAL-27 21 and 21, ASSAULT 22 and 24 in his
  // shot of 2026-10-03 15:43 EDT). The pieces telescope, so they always sum to the total.
  function inset(el, C, side) {
    if (!el || !C || el === C || !C.contains(el)) return null;
    const far = side === 'bottom' || side === 'right', V = side === 'top' || side === 'bottom', Sd = side[0].toUpperCase() + side.slice(1), sg = far ? -1 : 1;
    const re = seen(el), rc = seen(C); const total = sg * (re[side] - rc[side]); const pieces = [];
    const add = (lab, v, from, kind, who) => { if (Math.abs(v) >= 0.01) pieces.push({ label: lab, px: +v.toFixed(2), from, kind, who }); };
    const cb = C.getBoundingClientRect(), cc = cs(C); const cbor = px(cc['border' + Sd + 'Width']), cpad = px(cc['padding' + Sd]);
    add(`${label(C)}'s visible edge sits inside its box`, sg * (cb[side] - rc[side]), null, 'edge', C);
    add(`${label(C)}'s edge`, cbor, whereRef(C, `border-${side}-width`), 'border', C);
    add(`${label(C)}'s space inside`, cpad, whereRef(C, 'padding-' + side), 'padding', C);
    let edge = sg * cb[side] + cbor + cpad; const chain = []; for (let q = el; q && q !== C; q = q.parentElement) chain.unshift(q);
    for (const q of chain) {
      const qc = cs(q), qr = q.getBoundingClientRect(), p = q.parentElement; const mg = px(qc['margin' + Sd]);
      add(`space left over inside ${label(p)}`, sg * qr[side] - mg - edge, causeOf(p, V ? 'y' : 'x') || 'unexplained', 'leftover', p);
      add(`${label(q)}'s own outside space`, mg, whereRef(q, 'margin-' + side), mg < 0 ? 'patch' : 'margin', q);
      if (q === el) break;
      const qb = px(qc['border' + Sd + 'Width']), qp = px(qc['padding' + Sd]);
      add(`${label(q)}'s edge`, qb, whereRef(q, `border-${side}-width`), 'border', q);
      add(`${label(q)}'s space inside`, qp, whereRef(q, 'padding-' + side), 'padding', q);
      edge = sg * qr[side] + qb + qp;
    }
    const lr = el.getBoundingClientRect(); add(edgeLabelOf(el, side), sg * (re[side] - lr[side]), null, 'edge', el);
    const sum = pieces.reduce((s, x) => s + x.px, 0);
    return { a: el, C, side, axis: V ? 'y' : 'x', total: +total.toFixed(2), pieces, sum: +sum.toFixed(2) };
  }

  // ── near-misses: lines that almost line up, spaces that almost match ──
  function sameRow(a, b) { const C = common(a, b); let d = 0; for (let x = a; x && x !== C; x = x.parentElement) d++; return d <= 5; }
  // Each thing in a row is judged against the row's own middle (equal space above and below its ink: his test), and a row is shown when its
  // things disagree with it or with each other by more than 0.75px; one mark per thing, never a chain of pairs. Worked out for a whole gate,
  // never for what happens to be on screen, so scrolling never makes a mark come or go (Harkirat, 2026-10-03 16:42 EDT: "they just appear
  // sometimes and other times they don't"). Left edges stay pairwise: two things of a kind stacked within 120px whose left edges almost meet.
  function rowOf(el) {
    let a = el.parentElement;
    for (let i = 0; a && i < 6; i++, a = a.parentElement) {
      if (!inStage(a)) return null; const c = cs(a); if (!/flex|grid/.test(c.display) || (/flex/.test(c.display) && !/^row/.test(c.flexDirection))) continue;
      const kids = [...a.children].filter(visible); if (kids.length < 2) continue;
      if (/grid/.test(c.display)) { const t0 = kids[0].getBoundingClientRect().top; if (kids.some((k) => Math.abs(k.getBoundingClientRect().top - t0) > 1)) continue; }
      return a;
    }
    return null;
  }
  // ── the page at rest. Harkirat's V7 log (2026-10-05 15:35 EDT): every button carries `transition: transform 130ms` and
  // `:active { transform: translateY(1px) scale(.985) }` (app.css, "PRESS HAS WEIGHT"), so a read taken at the click caught the press
  // on its way back — 98.9×43.3, then 99.3×43.5 … 100.4×44 — and drew new numbers every click. Every read first finishes the page's
  // finite motion that moves geometry: that is where the page is going anyway, and finish() fires transitionend, so a drawer still opens.
  // Looping motion cannot finish and is held still by stillAnimations below; colour and opacity fades are left to play.
  const GEO = /^(transform|translate|scale|rotate|offset|width|height|min-|max-|inset|top|right|bottom|left|margin|padding|gap|row-gap|column-gap|font-size|letter-spacing|line-height|border(-(top|right|bottom|left))?-width|flex|grid-template|zoom)/;
  function motionProps(a) { if (a.transitionProperty) return [a.transitionProperty]; try { return a.effect.getKeyframes().flatMap((k) => Object.keys(k)); } catch (e) { return []; } }
  function atRest() { let n = 0; try { for (const a of document.getAnimations()) { if (a.playState !== 'running') continue; const t = a.effect && a.effect.target; if (!t || t.getRootNode() !== document) continue; let end = Infinity; try { end = a.effect.getComputedTiming().endTime; } catch (e) {} if (!isFinite(end)) continue; if (!motionProps(a).some((p) => GEO.test(p))) continue; try { a.finish(); n++; } catch (e) {} } } catch (e) {} return n; }
  function stillAnimations(scope) {
    atRest(); const els = new Set(); try { for (const a of scope.getAnimations({ subtree: true })) { const t = a.effect && a.effect.target; let end = Infinity; try { end = a.effect.getComputedTiming().endTime; } catch (e) {} if (t && t.style && !isFinite(end) && a.effect.getKeyframes().some((k) => Object.keys(k).some((p) => /^(transform|translate|scale|rotate)$/.test(p)))) els.add(t); } } catch (e) {}
    const saved = []; for (const el of els) { saved.push([el, el.getAttribute('style')]); for (const p of ['transform', 'translate', 'scale', 'rotate']) el.style.setProperty(p, 'none', 'important'); }
    return () => { for (const [el, st] of saved) { if (st == null) el.removeAttribute('style'); else el.setAttribute('style', st); } };
  }
  // ── one box, two relationships: a label that shares a flex or grid box with the items it names. The box's one gap sets both the space
  // after the label and the space between the items, so the two can differ only by a patch (a margin on the label), and setting either moves
  // the other (Harkirat, 2026-10-03 21:39 EDT: setting C1's chips 6 apart slid them off the search bar; "the container for the 'category'
  // label and chips should each be its own wrapper"). On the board: C1 and C7's .mt-grp, C8's six .b3-fg, C4's .b3-fh-cmp.
  function sharedGap(box) {
    if (!box || box.nodeType !== 1 || !window.BD_ROLES) return null; const c = cs(box); if (!/flex|grid/.test(c.display)) return null;
    const kids = [...box.children].filter((k) => visible(k) && !/absolute|fixed/.test(cs(k).position)); if (kids.length < 3) return null;
    const role = (e) => { const r = window.BD_ROLES.classify(e, { kindOf }); return r && (r.role || r.bucket); };
    const label = kids[0]; if (role(label) !== 'Key label') return null;
    const items = kids.slice(1); const r0 = role(items[0]); if (!r0 || r0 === 'Key label' || !items.every((k) => role(k) === r0)) return null;
    return { box, label, items, role: r0, labelMargin: px(cs(label).marginRight), gap: px(c.columnGap) };
  }
  // opts.pairs false: no edge pairs (the builder, from 2026-10-05: Harkirat's guides judge edges instead, and the pairs compared left edges of
  // right-aligned things and the inner box of a ringed field); the bd-tools that import this keep the pairs
  function nearMisses(scope, opts = {}) {
    const T = things(scope); const S = [];
    // things are measured at rest: a moving animation (the problem row's chips) is held still for the measurement and let go in the same task,
    // so its mark never depends on the moment it was caught (measured 2026-10-03 16:57 EDT: CAPABLE's left-edge mark came and went with the
    // page's scroll position, because its animation only runs on screen)
    // a small painted thing is a badge whatever it holds: the kit reveals a badge's dot only on screen (its holder gains .in), which turned
    // CAPABLE from text into a layout and back as the page scrolled (measured 2026-10-03 17:00 EDT), so near-misses judge it by its painted box
    const still = stillAnimations(scope); try { for (const e of T) { const k0 = kindOf(e); const k = (k0 === 'layout' || k0 === 'text') && visibleBox(e) && e.getBoundingClientRect().height <= 48 ? 'box' : k0; if (/control|text|icon|box/.test(k)) S.push({ e, k, r: seen(e) }); } } finally { still(); }
    const lines = []; const rows = new Map();
    for (const A of S) { const row = rowOf(A.e); if (!row) continue; if (!rows.has(row)) rows.set(row, []); rows.get(row).push(A); }
    for (const [row, items] of rows) {
      const rc = row.getBoundingClientRect(), c = cs(row); const top = rc.top + px(c.borderTopWidth) + px(c.paddingTop), bot = rc.bottom - px(c.borderBottomWidth) - px(c.paddingBottom); const mid = (top + bot) / 2;
      const off = items.map((A) => ({ A, o: (A.r.top + A.r.bottom) / 2 - mid })).filter((x) => Math.abs(x.o) <= 3 && x.A.r.height <= bot - top + 0.5); if (!off.length) continue;
      const os = off.map((x) => x.o); if (Math.max(...os.map(Math.abs)) <= 0.75 && Math.max(...os) - Math.min(...os) <= 0.75) continue;
      for (const x of off) if (Math.abs(x.o) > 0.25) lines.push({ a: x.A.e, row, axis: 'y', d: +Math.abs(x.o).toFixed(1), what: 'middle', dir: x.o < 0 ? 'high' : 'low' });
    }
    if (opts.pairs !== false) for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
      const A = S[i], B = S[j]; if (A.k !== B.k || A.e.contains(B.e) || B.e.contains(A.e)) continue;
      const vo = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top); if (vo > Math.min(A.r.height, B.r.height) * 0.5) continue;
      const ho = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left); if (ho <= 0) continue;
      const gy = Math.max(A.r.top, B.r.top) - Math.min(A.r.bottom, B.r.bottom); const d = Math.abs(A.r.left - B.r.left);
      if (gy < 120 && d > 0.75 && d <= 3) lines.push({ a: A.e, b: B.e, axis: 'x', d: +d.toFixed(1), what: 'left edges' });
    }
    // what follows each row label in one column of labels starts on one line, whatever kind it is: C1's chips started 5px left of the
    // search bar above them because CATEGORY shares the chips' box (Harkirat, 2026-10-03 21:39 EDT)
    if (window.BD_ROLES && opts.pairs !== false) {
      const st = []; for (const lab of T) { const r = window.BD_ROLES.classify(lab, { kindOf }); if (!r || r.role !== 'Key label') continue; let nx = lab.nextElementSibling; while (nx && !visible(nx)) nx = nx.nextElementSibling; if (!nx) continue; const lr = seen(lab), xr = seen(nx); if (xr.left < lr.right - 0.5 || Math.min(lr.bottom, xr.bottom) - Math.max(lr.top, xr.top) <= 0) continue; st.push({ lab, nx, lr, xr }); }
      for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) { const A = st[i], B = st[j]; if (Math.abs(A.lr.left - B.lr.left) > 1 || Math.abs(A.lr.right - B.lr.right) > 1) continue; const gy = Math.max(A.lr.top, B.lr.top) - Math.min(A.lr.bottom, B.lr.bottom); const d = Math.abs(A.xr.left - B.xr.left); if (gy < 120 && d > 0.75 && d <= 8) lines.push({ a: A.nx, b: B.nx, axis: 'x', d: +d.toFixed(1), what: 'left edges' }); }
    }
    const spaces = []; const L = T.filter((e) => kindOf(e) === 'layout');
    for (const el of L) {
      const c = cs(el); const row = /flex/.test(c.display) ? /^row/.test(c.flexDirection) : true;
      const kids = [...el.children].filter((k) => visible(k) && !/absolute|fixed/.test(cs(k).position)); if (kids.length < 3) continue;
      const R = kids.map(seen); const gaps = []; for (let i = 1; i < R.length; i++) gaps.push(row ? R[i].left - R[i - 1].right : R[i].top - R[i - 1].bottom);
      if (gaps.some((g) => g < -0.5)) continue; const mx = Math.max(...gaps), mn = Math.min(...gaps);
      if (mx - mn > 0.75 && mx - mn <= 3) spaces.push({ el, axis: row ? 'x' : 'y', gaps: gaps.map((g) => +g.toFixed(1)), kids });
    }
    const byCls = new Map(); for (const el of L) { const k = selOf(el); if (!byCls.has(k)) byCls.set(k, []); byCls.get(k).push(el); }
    const PROP = { columnGap: 'space between items', paddingLeft: 'space inside, left', paddingTop: 'space inside, top' };
    for (const [k, els] of byCls) { if (els.length < 2) continue; for (const prop of Object.keys(PROP)) { const vals = els.map((e) => px(cs(e)[prop])); const mx = Math.max(...vals), mn = Math.min(...vals); if (mx - mn > 0.5 && mx - mn <= 4) spaces.push({ els, prop: PROP[prop], vals, sel: k }); } }
    return { lines, spaces };
  }
  // columns: a set of three or more rows built alike; each cell's left edge against its column's line
  function columns(scope) {
    const sets = []; const inSet = new Set(); if (!scope) return sets;
    for (const p of scope.querySelectorAll('*')) {
      if (inSet.has(p) || p.closest('#bd-host') || !visible(p) || !inStage(p)) continue; let skip = false; for (const q of inSet) if (q.contains(p)) { skip = true; break; } if (skip) continue;
      const kids = [...p.children].filter(visible); if (kids.length < 3) continue;
      const sig = (k) => `${k.tagName}.${classesOf(k).join('.')}`; const cnt = new Map(); kids.forEach((k) => cnt.set(sig(k), (cnt.get(sig(k)) || 0) + 1));
      const [best, nb] = [...cnt.entries()].sort((x, y) => y[1] - x[1])[0]; if (nb < 3) continue;
      const rows = kids.filter((k) => sig(k) === best && [...k.children].filter(visible).length >= 2); if (rows.length < 3) continue;
      const nCols = Math.min(...rows.map((r) => r.children.length)); const cols = [];
      for (let i = 0; i < nCols; i++) {
        const cells = rows.map((r) => r.children[i]).filter((c) => c && visible(c)); if (cells.length < 3) continue;
        const xs = cells.map((c) => seen(c).left).sort((x, y) => x - y); const med = xs[Math.floor(xs.length / 2)];
        cols.push({ i, x: med, misses: cells.filter((c) => { const d = Math.abs(seen(c).left - med); return d > 0.5 && d <= 8; }) });
      }
      if (cols.length >= 2) { const r = p.getBoundingClientRect(); sets.push({ p, rows, cols, top: r.top, bottom: r.bottom }); inSet.add(p); }
    }
    return sets;
  }
  function dividers(scope) {
    const out = []; if (!scope) return out;
    for (const el of scope.querySelectorAll('*')) {
      if (el instanceof SVGElement || el.closest('#bd-host') || !visible(el) || !inStage(el)) continue; const c = cs(el); const r = el.getBoundingClientRect();
      const bw = ['Top', 'Right', 'Bottom', 'Left'].map((s) => (c['border' + s + 'Style'] !== 'none' && !CLEAR.test(c['border' + s + 'Color']) ? px(c['border' + s + 'Width']) : 0));
      const sides = bw.filter((x) => x > 0).length;
      if (el.tagName === 'HR') out.push({ el, kind: 'a separate line', t: Math.min(r.height, r.width) });
      else if (sides === 1 && (r.width > 24 || r.height > 24) && !paintsBg(c)) out.push({ el, kind: 'an edge on one side', t: Math.max(...bw), side: ['top', 'right', 'bottom', 'left'][bw.findIndex((x) => x > 0)] });
      else if (((r.height <= 2.5 && r.width > 24) || (r.width <= 2.5 && r.height > 24)) && paints(c)) out.push({ el, kind: 'a separate line', t: Math.min(r.height, r.width) });
      else for (const pe of ['::before', '::after']) { const pr = pseudoRect(el, pe); if (pr && ((pr.height <= 2.5 && pr.width > 24) || (pr.width <= 2.5 && pr.height > 24))) out.push({ el, kind: 'a drawn line', t: +Math.min(pr.height, pr.width).toFixed(1), pe, r: pr }); }
      if (/inset/.test(c.boxShadow) && /0px -?[12]px 0px/.test(c.boxShadow)) out.push({ el, kind: 'a shadow line', t: 1 });
    }
    return out;
  }
  // a rounded thing near a rounded box's corner should be rounded less by exactly the space between them
  function corners(scope) {
    const out = [];
    for (const e of things(scope, { viewport: true })) {
      const vb = visibleBox(e); if (!vb) continue; const ri = px(cs(e, vb.part === 'self' ? null : vb.part).borderTopLeftRadius);
      let a = e.parentElement, d = 0;
      while (a && d < 4) {
        const va = visibleBox(a);
        if (va) {
          const ro = px(cs(a, va.part === 'self' ? null : va.part).borderTopLeftRadius);
          if (ro > 2) {
            const R = vb.rect, O = va.rect; const dl = R.left - O.left, dt = R.top - O.top, dr = O.right - R.right, db = O.bottom - R.bottom;
            const inset = Math.min(Math.max(dl, dt), Math.max(dr, dt), Math.max(dl, db), Math.max(dr, db));
            if (inset >= 0 && inset < ro) { const want = Math.max(0, ro - inset); if (Math.abs(ri - want) > 1.5) out.push({ el: e, outer: a, ri, ro, inset: +inset.toFixed(1), want: +want.toFixed(1) }); }
          }
          break;
        }
        a = a.parentElement; d++;
      }
    }
    return out;
  }

  BD.measure = { flowWords, drawnExtent, probe, pathOf, slackOf, paintedChild, paintTarget, innerOf, inkParts, inside, gaps, placedIcon, shadowRings, nodeLetters, fieldLetters, contentInk, atRest, setDescend, descends, inStage, px, visible, hides, hiddenAbove, textHolder, alignedBox, jobOf, sharedGap, isOn, restPaint, partsOf, buildOf, ctxOf, paints, visibleBox, pseudoRect, letters, iconBox, kindOf, thingOf, seen, visibleHeight, gateOf, gateEl, nameOf, label, classesOf, selOf, signature, similar, roleOf, family, things, distance, inset, common, nearMisses, columns, dividers, corners, GATES, GATE_NAMES, CTL_SEL };
})();
