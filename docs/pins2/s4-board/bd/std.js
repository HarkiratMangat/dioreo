// Board 4: Builder · std.js — the standard: variants and layouts, their named values (tokens on :root), the one generated stylesheet that makes
// every member use them, the self-check that every member really shows its value, undo/redo, and saving (the artifact's database, this
// browser as the fallback). Knobs change tokens, so they keep working after a fold rewrites the kit's own rules to the same names.
// Plan: local/pins2/s4/builder-plan.md (v3) § Kinds of thing · How it works · Data shapes.
(function () {
  const BD = (window.BD = window.BD || {}); const M = () => BD.measure; const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const WALK = window.BD_WALK || {};
  // his list, 2026-10-03 14:00 EDT: 2px steps to 16, then 4px steps to 52
  const SPACE = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64]; // his scale: every 2 up to 20, then every 4 (2026-10-04)
  const uniq = (a, d = 1) => [...new Set((a || []).map((x) => +(+x).toFixed(d)))].filter(Number.isFinite).sort((x, y) => x - y);
  // whole pixels only (his ruling, 2026-10-04): a fractional value the walk still measured is left out of a list, never rounded into a new one
  const whole = (a) => uniq(a, 2).filter(Number.isInteger);
  const START_LISTS = () => ({ space: SPACE.slice(), height: whole((WALK.heights || []).filter((h) => h >= 16 && h <= 64)), text: whole(WALK.text), line: whole(WALK.lines), radius: whole([0, ...(WALK.radii || [])]), weight: [400, 500, 600, 700], icon: whole(WALK.icons), track: uniq([0, ...(WALK.ls || [])], 2), edge: [0, 1, 2] });
  const LIST_NAMES = { space: 'Space', height: 'Heights', text: 'Text sizes', line: 'Line heights', radius: 'Corners', weight: 'Text weights', icon: 'Icon sizes', track: 'Letter spacing', edge: 'Edge thickness' };
  const B = ':not(#bd-0):not(#bd-1):not(#bd-2)'; // three ids beat any kit rule (258 kit !important declarations set these properties)

  const cs = (el, pe) => getComputedStyle(el, pe && pe !== 'self' ? pe : null);
  const partOf = (el) => { if (M().descends && M().descends()) { const T = M().paintTarget(el); return T && T.el === el ? T.part : 'self'; } const vb = M().visibleBox(el); return vb ? vb.part : 'self'; };
  // where a setting about the drawn box lands for one member: its ::before/::after, the painted box inside it (sole-ink, bd/measure.js), or itself
  // a piece's selector under its member: its classes when it has them, else its tag, one step per level (selOf's own fallback is a path from
  // the page, which under a member selector matched nothing: the Undo button's gap rule of 12:28 EDT)
  const relSel = (root, el) => { const st = []; for (let e = el; e && e !== root; e = e.parentElement) { const cl = (e.getAttribute('class') || '').split(/\s+/).filter((x) => x && /^[a-zA-Z_][\w-]*$/.test(x) && !/^(on|off|open|sel|active|is-[\w-]+|hover|focus)$/.test(x)); let q = e.tagName.toLowerCase() + cl.map((x) => '.' + CSS.escape(x)).join(''); const pa = e.parentElement; if (pa) { let n = 0; try { n = pa.querySelectorAll(':scope > ' + q).length; } catch (_) {} if (n > 1) q += `:nth-child(${[...pa.children].indexOf(e) + 1})`; } st.unshift(q); } return '> ' + st.join(' > '); };
  // does writing this property on this element move this drawn number one for one? Tried for a moment (bd/measure.js probe), cached per state
  const DRV = new Map(); function drives(host, prop, cur, read) { const k = (host.__bdk = host.__bdk || Math.random().toString(36).slice(2)) + prop + '|' + (state ? state.at : 0); if (DRV.has(k)) return DRV.get(k); const a = read(); const b = M().probe(host, `${prop}:${cur + 2}px !important`, read); const ok = a != null && b != null && Math.abs(b - a - 2) < 0.3; DRV.set(k, ok); if (DRV.size > 4000) DRV.clear(); return ok; }
  const memberEl = (m) => { try { return document.querySelector(m.sel); } catch (_) { return null; } };
  const tgt = (m) => { if (m.part && m.part !== 'self') return { sel: m.sel, part: m.part }; if (!M().descends || !M().descends()) return { sel: m.sel, part: 'self' }; const all = allOf(m); const e = all.find((x) => { const T0 = M().paintTarget(x); return T0 && !T0.bare; }) || all[0] || memberEl(m); const T = e && M().paintTarget(e); if (T && T.el !== e) return { sel: `${m.sel} ${relSel(e, T.el)}`, part: T.part }; return { sel: m.sel, part: T ? T.part : 'self' }; };
  const targetsOf = (m) => { if (m.part && m.part !== 'self') return [{ sel: m.sel, part: m.part }]; if (!M().descends || !M().descends()) return [{ sel: m.sel, part: 'self' }]; const out = new Map(); for (const e of allOf(m)) { const T = M().paintTarget(e); if (!T || T.bare) continue; const t = T.el !== e ? { sel: `${m.sel} ${relSel(e, T.el)}`, part: T.part } : { sel: m.sel, part: T.part }; out.set(t.sel + '|' + t.part, t); } return out.size ? [...out.values()] : [tgt(m)]; };
  const tgtEmit = (v, decl, only) => { const by = new Map(); for (const m of v.members) for (const t of targetsOf(m)) { if (only && !only(t)) continue; if (!by.has(t.part)) by.set(t.part, new Set()); by.get(t.part).add(t.sel); } return [...by].map(([p, sels]) => rule([...sels], p, decl(p))).join('\n'); };
  const tcs = (el) => { const T = M().descends && M().descends() ? M().paintTarget(el) : null; return T ? cs(T.el, T.part) : cs(el, partOf(el)); };
  const mainText = (el) => { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() && !(n.parentElement && n.parentElement.closest('svg')) ? 1 : 3) }); const n = tw.nextNode(); return n ? n.parentElement : el; };
  // an icon drawn over a field from outside it: the Armory search bar's magnifier is an absolutely placed svg beside the input, sitting in the
  // input's left padding (Harkirat, 2026-10-05 11:39 EDT: "why can't i change the icon's size, spacing, etc? how do i know that 10px padding on
  // the right side is the same amount of padding to the left of the icon in there?"). Found as a positioned svg sibling inside the element's box.
  const insetIcon = (el) => M().placedIcon(el); // bd/measure.js owns it now, with the rest of the drawn model
  // its numbers, all on the drawn lines: before (field's inner left edge to the drawing), the drawing's width, after (drawing to the words), right
  function iconGeom(el) {
    const sv = insetIcon(el); if (!sv) return null; const r = el.getBoundingClientRect(), c = cs(el), ib = M().iconBox(sv), sb = sv.getBoundingClientRect(); const bl = px(c.borderLeftWidth);
    let op = sv.parentElement; while (op && op !== document.body && cs(op).position === 'static') op = op.parentElement; const ol = op ? op.getBoundingClientRect().left + op.clientLeft : 0; // an svg has no offsetParent
    return { sv, bl, ol, left: r.left, boxW: sb.width, go: ib.left - sb.left, inkW: ib.width, before: +(ib.left - (r.left + bl)).toFixed(1), after: +(r.left + bl + px(c.paddingLeft) - ib.right).toFixed(1), right: px(c.paddingRight) };
  }
  const ownSvg = (el, sv) => { for (let a = sv.parentElement; a && a !== el; a = a.parentElement) if (M().kindOf(a) === 'control') return false; return true; };
  const firstSvg = (el) => (el.tagName.toLowerCase() === 'svg' ? el : [...el.querySelectorAll('svg')].find((sv) => ownSvg(el, sv)) || insetIcon(el));
  const geomOf = (sel) => { let e = null; try { e = document.querySelector(sel); } catch (_) { return null; } return e ? iconGeom(e) : null; };
  // which way a layout's items run, read from where they actually sit: a grid whose items stack is spaced by its ROW gap. The manifest toolbars
  // are grids of two stacked rows, and the knob wrote a column gap, so History kept its own 16px row gap while the self-check, reading the
  // same wrong axis, said all three followed (Harkirat, 2026-10-03 20:21 EDT: "why isn't the history manifest changing its middle spacing")
  const axisOf = (el) => { const c = cs(el); if (/flex/.test(c.display)) return /^column/.test(c.flexDirection) ? 'y' : 'x'; const kids = [...el.children].filter((k) => M().visible(k) && !/absolute|fixed/.test(cs(k).position)); if (kids.length >= 2) { const a = kids[0].getBoundingClientRect(), b = kids[1].getBoundingClientRect(); if (b.top >= a.bottom - 0.5) return 'y'; } return /grid/.test(c.display) ? 'x' : 'y'; };
  // variants saved before that fix carry the wrong axis: re-read it from their first member whenever a state is loaded
  function reaxis() { for (const v of state.variants) { if (v.kind !== 'layout' && v.kind !== 'box') continue; const el = elsOf(v)[0]; if (el) v.axis = axisOf(el); } }
  const rule = (sels, part, decl, tail = '') => `:is(${sels.join(',')})${B}${part && part !== 'self' ? part : ''}${tail}{${decl}}`;
  const visEmit = (v, t, decl) => tgtEmit(v, () => decl(t));
  const selfEmit = (v, t, decl, tail) => rule(v.members.map((m) => m.sel), 'self', decl(t), tail);

  // round-1 knobs by kind, in plain words; read() measures what the eye sees, emit() writes the generated rule
  // an icon's size is its drawing area: some kit icons carry padding inside their box (the b3-fc chips' 13px icon sits in a 16px box)
  const iconW = (s) => { const c = cs(s); const r = s.getBoundingClientRect(); const k = px(c.width) ? r.width / px(c.width) : 1; return +(r.width - (px(c.paddingLeft) + px(c.paddingRight) + px(c.borderLeftWidth) + px(c.borderRightWidth)) * (k || 1)).toFixed(1); };
  const K = (k, label, list, read, emit, extra = {}) => ({ k, label, list, read, emit, unit: 'px', ...extra });
  const inFlowPseudo = (m, part) => { const e = allOf(m)[0]; if (!e || !part || part === 'self') return false; return !/absolute|fixed/.test(cs(e, part).position); };
  const sizeEmit = (v, decl) => { const by = new Map(); for (const m of v.members) for (const x of targetsOf(m)) { const p = inFlowPseudo(m, x.part) ? 'self' : x.part; if (!by.has(p)) by.set(p, new Set()); by.get(p).add(x.sel); } return [...by].map(([p, sels]) => rule([...sels], p, decl(p))).join('\n'); };
  // a taller control grows from its centre: a member whose flex or grid parent does not centre it grew downward (the image chip, Harkirat
  // 2026-10-06 10:58 EDT, "if i increase its height, it's top aligned and increases downward")
  // ...and keeps its centre where it is: one already centred in its row is set to the middle; one placed off the middle (a close button lined up
  // with a title's first line) grows by half on each side with margins, so its height at the value it shows moves nothing (the fidelity test
  // of 2026-10-06 11:48 EDT: C3's close button dropped 6.5px). Only across a row: in a column, align-self moves a thing sideways
  const centreGrow = (v, t) => { const sels = [], out = []; for (const m of v.members) { if ((m.part || 'self') !== 'self') continue; const e = allOf(m)[0]; const p = e && e.parentElement; const pc = p && cs(p); if (!pc) continue;
      if (!((/flex/.test(pc.display) && !/^column/.test(pc.flexDirection)) || /grid/.test(pc.display))) continue; const c = cs(e); if (c.alignSelf === 'center' || (/center/.test(pc.alignItems) && /auto|normal/.test(c.alignSelf))) continue;
      const pr = p.getBoundingClientRect(), r = e.getBoundingClientRect(); const above = r.top - (pr.top + px(pc.borderTopWidth) + px(pc.paddingTop)), below = (pr.bottom - px(pc.borderBottomWidth) - px(pc.paddingBottom)) - r.bottom;
      if (Math.abs(above - below) <= 0.5) sels.push(m.sel); else { const h = +r.height.toFixed(2); out.push(rule([m.sel], 'self', `margin-top:calc(${px(c.marginTop)}px + (${h}px - ${t}) / 2) !important;margin-bottom:calc(${px(c.marginBottom)}px + (${h}px - ${t}) / 2) !important`)); } }
    return (sels.length ? '\n' + rule(sels, 'self', 'align-self:center !important') : '') + (out.length ? '\n' + out.join('\n') : ''); };
  // a control that opens on hover (an icon-revealing button: the row's Collapse, whose word slides out beside its icon) is sized by what it
  // shows, never given a width: the "square icon" width written for it held its ring shut while the word spilled out (Harkirat, 2026-10-06
  // 10:58 EDT: "hovered, 'Collapse' spills out of its ring"). Found from the kit's own rules: a hover or focus rule that changes its width
  const REVEAL = /^(grid-template-columns|width|max-width|min-width|column-gap|gap|padding-left|padding-right|padding-inline)$/; const RV = new WeakMap();
  function reveals(el) { if (!el) return false; if (RV.has(el)) return RV.get(el); const LK = BD.looks; let r = false;
    if (LK && window.BD_RULES) for (const ru of BD_RULES.rules) { if (!/:(hover|focus-visible)/.test(ru.s) || !ru.d.some(([prop]) => REVEAL.test(prop))) continue; for (const alt of LK.splitTop(ru.s)) { if (!/:(hover|focus-visible)/.test(alt) || /::?(before|after)\s*$/.test(alt)) continue; const q = alt.replace(/:(hover|focus-visible|focus-within|focus)(?![\w-])/g, ''); try { if (el.matches(q)) { r = true; break; } } catch (_) {} } if (r) break; }
    RV.set(el, r); return r; }
  const isSquareIcon = (m) => { const e = allOf(m)[0]; if (!e || !e.querySelector('svg') || (e.innerText || '').trim() || reveals(e)) return false; const T = M().paintTarget(e); const r = T && T.rect ? T.rect : e.getBoundingClientRect(); return Math.abs(r.width - r.height) < 0.75; };
  const HEIGHT = K('height', 'Height', 'height', (el) => M().visibleHeight(el), (v, t) => centreGrow(v, t) + '\n' + sizeEmit(v, (p) => (p === 'self'
    // the drawn box takes the height (a member that draws on a child is sized at that child; its click area stays)
    ? `height:${t} !important;min-height:0 !important;max-height:none !important;box-sizing:border-box !important`
    : `top:calc((100% - ${t}) / 2) !important;bottom:auto !important;height:${t} !important`)));
  // the space inside, left and right, as drawn: inside edge to the first and last drawn piece (words cap to baseline, an icon's lines). Set
  // as that number: the padding written is the number minus what the page adds on top of the padding for that member (an icon's blank margin,
  // a border, a ring), measured when the rule is written, so a change of padding moves the drawing by the same amount and the two settle in
  // one pass. A field with an icon placed in its padding uses Space before the icon and Icon to words instead.
  const hostOf = (el) => { const T = M().paintTarget(el); return T && T.part === 'self' ? T.el : el; };
  const FIELD = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]):not([type=reset]):not([type=color]):not([type=file]):not([type=image]),textarea';
  const drawnPad = (side) => (el) => {
    const C = 'padding' + side[0].toUpperCase() + side.slice(1); if (!(M().descends && M().descends())) return px(cs(el)[C]);
    // a field: typed words run from its text area's edge, so the space is that edge (padding plus border), never the placeholder's ink; with an
    // icon placed in its padding the left side belongs to Space before the icon and Icon to words. Before this the search bar read nothing on
    // either side and his 10 on its right had no knob (V7 state, 2026-10-05 16:01 EDT)
    if (el.matches && el.matches(FIELD) && (side === 'right' || !M().placedIcon(el))) { const c = cs(el); return +(px(c[C]) + px(c['border' + side[0].toUpperCase() + side.slice(1) + 'Width'])).toFixed(2); }
    if (M().placedIcon(el)) return null; const D = M().inside(el); if (!D) return null; const h = hostOf(el);
    // a padding that doesn't move the drawn edge (centred or stretched content) is no setting for that space: Width is (2026-10-05 12:28 EDT)
    const ink = () => { const d = M().inside(el); return d ? d[side] : null; }; if (!drives(h, 'padding-' + side, px(cs(h)[C]), ink)) return null; return +D[side].toFixed(2);
  };
  const padEmit = (side, plain) => (v, t) => {
    const C = 'padding' + side[0].toUpperCase() + side.slice(1); const rows = []; const desc = M().descends && M().descends();
    for (const m of v.members) for (const e of allOf(m)) {
      const T = desc ? M().paintTarget(e) : null; const host = T && T.part === 'self' ? T.el : e; const D = T ? M().inside(e) : null; if (T && !D) { rows.push({ msel: m.sel, rel: '', e, key: plain ? '0' : null }); continue; }
      // an element whose padding doesn't move this space (a centred icon in a fixed-width button) is left out of the offset it would only skew
      const rd = drawnPad(side)(e); // the knob's own reading, so the offset written is the one settle() checks
      rows.push({ msel: m.sel, rel: host === e ? '' : relSel(e, host), e, key: rd != null ? fine(rd - px(cs(host)[C])) : plain ? '0' : null });
    }
    return clustered(rows, (k, corr) => `padding-${side}:calc(${t} - ${+(+k - corr).toFixed(2)}px) !important`, `${v.id}|pad${SIDEK[side]}`);
  };
  const SIDEK = { left: 'L', right: 'R', top: 'T', bottom: 'B' };
  const PADL = K('padL', 'Space inside, left', 'space', drawnPad('left'), padEmit('left'));
  const PADR = K('padR', 'Space inside, right', 'space', drawnPad('right'), padEmit('right'));
  const RADIUS = K('radius', 'Corners', 'radius', (el) => px(tcs(el).borderTopLeftRadius), (v, t) => visEmit(v, t, (x) => `border-radius:${x} !important`));
  const wordsEmit = (prop) => (v, t) => { const rows = []; for (const m of v.members) for (const e of allOf(m)) { const mt = mainText(e); rows.push({ msel: m.sel, rel: mt === e || !e.contains(mt) ? '' : relSel(e, mt), e, key: 'w' }); } return clustered(rows, () => `${prop}:${t} !important`); };
  const FS = K('fs', 'Text size', 'text', (el) => px(cs(mainText(el)).fontSize), wordsEmit('font-size'));
  const FW = K('fw', 'Text weight', 'weight', (el) => +cs(mainText(el)).fontWeight || 400, wordsEmit('font-weight'), { unit: '' });
  const CTT = K('ctt', 'Capitals', null, (el) => { const mt = mainText(el); return mt && mt !== el || el.textContent.trim() ? cs(mt).textTransform : null; }, wordsEmit('text-transform'), { unit: '', options: ['none', 'uppercase', 'capitalize'] });
  const CLS = K('cls', 'Letter spacing', 'track', (el) => (el.textContent.trim() ? +px(cs(mainText(el)).letterSpacing).toFixed(2) : null), wordsEmit('letter-spacing'));
  const CLH = K('clh', 'Line height', 'line', (el) => { if (!el.textContent.trim()) return null; const v = cs(mainText(el)).lineHeight; return v === 'normal' ? null : px(v); }, wordsEmit('line-height'));
  const ICON_D = (x) => `width:${x} !important;height:${x} !important;flex-basis:${x} !important;min-width:${x} !important;min-height:${x} !important;max-width:none !important;max-height:none !important`;
  // an icon is set by its box and measured by its drawing: the drawing fills the box one way and may be narrower the other (Harkirat, 2026-10-05
  // 12:37 EDT: "at least 2 sides should be [8px] because the icon would always fill the max width or height of its container"). The rule is
  // written to each svg a member actually holds, grouped by its selector
  const inkMax = (sv) => { const ib = M().iconBox(sv); return Math.max(ib.width, ib.height); };
  const drawnIcon = (sv) => +(px(cs(sv).width) || sv.getBoundingClientRect().width).toFixed(2); /* the Lucide box, never its ink: one size, one line weight, for every glyph */
  const svgsOf = (e) => { const L = [...e.querySelectorAll('svg')].filter((x) => M().visible(x) && ownSvg(e, x)); const pi = M().placedIcon(e); if (pi) L.push(pi); return L; };
  const iconRule = (v, t) => {
    const rows = []; for (const m of v.members) for (const e of allOf(m)) for (const sv of svgsOf(e).slice(0, 1)) {
      const c = cs(sv); const cssW = px(c.width) || 1; const pad = px(c.paddingLeft) + px(c.paddingRight) + px(c.borderLeftWidth) + px(c.borderRightWidth); const r = 1; /* the box is the size (Lucide's) */
      const inside0 = e.contains(sv); const host = inside0 ? e : sv.parentElement; const u0 = sv.querySelector(':scope > use'); const gh = u0 && u0.getAttribute('href'); // the glyph rides on the svg itself: JAK-12's zap took the skull's ratio from its row's :has() (16:01 EDT)
      rows.push({ msel: inside0 ? m.sel : M().selOf(host, true), rel: relSel(host, sv) + (gh ? `:has(> use[href="${gh}"])` : ''), e: host, key: `${+r.toFixed(4)}|${c.boxSizing === 'border-box' ? +pad.toFixed(2) : 0}` });
    }
    return clustered(rows, (key, corr) => { const [r, pad] = key.split('|').map(Number); return ICON_D(`calc((${t} + ${+(corr || 0).toFixed(2)}px) * ${r}${pad ? ` + ${pad}px` : ''})`); }, `${v.id}|icon`);
  };
  const ICON = K('icon', 'Icon size', 'icon', (el) => { const sv = firstSvg(el); return sv ? drawnIcon(sv) : null; }, (v, t) => (M().descends && M().descends() ? iconRule(v, t) : selfEmit(v, t, ICON_D, ' svg')));
  // the two spaces around an inset icon, each set as the drawn gap it makes (the icon's own blank margin inside its box is taken out); a new icon
  // size from the knob above is used in the same pass, so the three settle together instead of over two rounds
  const scaled = (v, gm) => { const box = v.values.icon != null && v.values.icon !== '' ? px(v.values.icon) : gm.boxW; const k = gm.boxW ? box / gm.boxW : 1; return { go: gm.go * k, inkW: gm.inkW * k }; };
  const IIN = K('iin', 'Space before the icon', 'space', (el) => { const gm = iconGeom(el); return gm ? gm.before : null; }, (v, t) => v.members.map((m) => { const gm = geomOf(m.sel); if (!gm) return ''; const e = document.querySelector(m.sel); const { go } = scaled(v, gm); return rule([M().selOf(e.parentElement, true)], 'self', `left:calc(${t} + ${+(gm.left + gm.bl - go - gm.ol).toFixed(2)}px) !important;right:auto !important`, ' > svg'); }).filter(Boolean).join('\n'));
  const IOUT = K('iout', 'Icon to words', 'space', (el) => { const gm = iconGeom(el); return gm ? gm.after : null; }, (v, t) => v.members.map((m) => { const gm = geomOf(m.sel); if (!gm) return ''; const { inkW } = scaled(v, gm); const before = v.values.iin != null && v.values.iin !== '' ? px(v.values.iin) : gm.before; return rule([m.sel], 'self', `padding-left:calc(${t} + ${+(before + inkW).toFixed(2)}px) !important`); }).filter(Boolean).join('\n'));
  // the space between a control's parts, whatever they are: an icon and its words, or a filter chip's dot, words and count (Harkirat, 2026-10-05
  // 11:51 EDT: "i can't set the gaps between the icon/text/counter in the filter chips" — the knob only appeared when the first part was an svg)
  const flowKids = (el) => [...el.children].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !/absolute|fixed/.test(cs(x).position); });
  // each space between a control's pieces is its own setting, read line to line and written as the margin before the piece that follows it, so
  // one space never moves another (Harkirat, 2026-10-05 12:20 EDT: "the knob is only changing the gap between the icon->label. but nothing
  // changes the label->counter" — the chip's count is spaced by its own margin, which a column-gap knob never reached). The margin written is
  // the number minus what the page already adds there (the box's gap, the pieces' blank edges), measured when the rule is written.
  // which gap is which is decided by the pieces either side, never by position: "icon to words", "words to count", "words to icon". By position,
  // the All chip's first gap (words to count) and Assault's first gap (dot to words) were one setting and wrote to different pieces (the class
  // test of 12:23 EDT: 30 of 77 gap settings never reached the page)
  const GAPCLS = { gap: (a, b) => /icon|mark/.test(a) && /words/.test(b), gap2: (a, b) => /words/.test(a) && /count|badge/.test(b), gap3: (a, b) => /words|count/.test(a) && /icon|mark/.test(b) };
  GAPCLS.gap4 = (a, b) => !GAPCLS.gap(a, b) && !GAPCLS.gap2(a, b) && !GAPCLS.gap3(a, b);
  function gapSlot(el, key) {
    if (typeof key === 'number') key = ['gap', 'gap2', 'gap3', 'gap4'][key]; if (M().placedIcon(el)) return null; const D = M().inside(el); const G = D ? M().gaps(el, D) : []; const g = G.find((x) => GAPCLS[key](x.a.kind, x.b.kind)); if (!g) return null;
    const eo = (p) => (p.node.nodeType === 1 ? p.node : p.node.parentElement); const a = eo(g.a), b = eo(g.b); let C = b; while (C && !C.contains(a)) C = C.parentElement; if (!C) return null;
    const up = (x) => { if (x === C) return null; let q = x; while (q.parentElement && q.parentElement !== C) q = q.parentElement; return q; }; const vert = g.axis === 'y';
    const cb = up(b); if (cb) return { g: g.px, el: cb, prop: vert ? 'margin-top' : 'margin-left', cur: px(cs(cb)[vert ? 'marginTop' : 'marginLeft']) };
    const ca = up(a); if (ca) return { g: g.px, el: ca, prop: vert ? 'margin-bottom' : 'margin-right', cur: px(cs(ca)[vert ? 'marginBottom' : 'marginRight']) };
    return null;
  }
  const gapHolder = (el) => { const s0 = gapSlot(el, 'gap'); return s0 ? { h: s0.el, g: s0.g } : null; };
  // every element a member's selector reaches, so a rule is written per piece selector with the offset most of them share (the rest show in selfCheck)
  const allOf = (m) => { try { return [...document.querySelectorAll(m.sel)].filter((e) => M().visible(e)).slice(0, 80); } catch (_) { return []; } };
  const modeOf = (a) => { const c = new Map(); for (const x of a) { const k = Math.round(x * 4) / 4; c.set(k, (c.get(k) || 0) + 1); } return [...c].sort((p, q) => q[1] - p[1])[0][0]; };
  // one selector, elements built two ways (with and without an icon, a state class, a different glyph): each way needs its own offset, so the
  // elements are grouped by the value they need, the largest group gets the plain rule, and every other group gets a rule narrowed by the first
  // condition that holds for all of it and none of the rest (a class the member selector leaves out, a child it has or lacks, the glyph it
  // draws). Traced 2026-10-05 13:21 EDT: 9 of the class test's 14 were this (Cancel, Reset, All 5, Delivery queue, Build 1, BEST ASSAULT)
  // the narrowest condition on msel that holds for every element of els and none of others: one condition if one does it, else the fewest that
  // together do (the search clustered() uses for its groups)
  function narrowCond(msel, els, others) { const ok = (q) => { try { return els.every((x) => x.matches(msel + q)); } catch (_) { return false; } }; const pc = [...new Set(els.map((x) => x.parentElement && M().selOf(x.parentElement)).filter(Boolean))];
    const cands = [...condsOf(els[0], msel, others), ...pc.map((p) => `:is(${p} > *)`), ...[...new Set(others.map((x) => x.parentElement && M().selOf(x.parentElement)).filter(Boolean))].map((p) => `:not(${p} > *)`)].filter(ok);
    for (const q of cands) if (others.every((x) => !x.matches(msel + q))) return q;
    let cond = '', rest = others.slice(); for (let i = 0; i < 6 && rest.length; i++) { let best = null, bn = 0; for (const q of cands) { if (cond.includes(q)) continue; let n = 0; try { n = rest.filter((x) => !x.matches(msel + cond + q)).length; } catch (_) { continue; } if (n > bn) { bn = n; best = q; } } if (!best) return null; cond += best; rest = rest.filter((x) => x.matches(msel + cond)); }
    return rest.length ? null : cond; }
  // a member's selector reaches only what was picked and its lookalikes. A bare tag-and-class one reached every button.b3-fchip, so making the
  // image chip a variant squeezed the problem chips beside it to 28px (Harkirat 2026-10-06 10:58 EDT); what it reaches that looks different
  // is now ruled out by the narrowest condition
  function memberSel(el, picked) { const sel = M().selOf(el); let reach = []; try { reach = [...document.querySelectorAll(sel)].filter((x) => M().visible(x)); } catch (e) { return sel; }
    const sg = M().signature(el); const mine = picked.filter((x) => { try { return x.matches(sel); } catch (e) { return false; } }); const others = reach.filter((x) => !mine.includes(x) && !M().similar(sg, M().signature(x)));
    if (!others.length) return sel; const keep = [...mine, ...reach.filter((x) => !mine.includes(x) && !others.includes(x))]; const c = narrowCond(sel, keep, others); return c ? sel + c : sel; }
  function condsOf(e, msel, others = []) {
    const out = []; for (const c of (e.getAttribute('class') || '').split(/\s+/)) { if (!c || !/^[a-zA-Z_][\w-]*$/.test(c)) continue; const q = '.' + CSS.escape(c); if (!msel.includes(q)) out.push(q, `:not(${q})`); }
    for (const k of e.children) { const r = relSel(e, k); out.push(`:has(${r})`, `:not(:has(${r}))`); }
    for (const o of others.slice(0, 12)) { for (const c of (o.getAttribute('class') || '').split(/\s+/)) if (c && /^[a-zA-Z_][\w-]*$/.test(c) && !msel.includes('.' + CSS.escape(c))) out.push(`:not(.${CSS.escape(c)})`); for (const k of o.children) out.push(`:not(:has(${relSel(o, k)}))`); }
    for (const u of e.querySelectorAll('use')) { const h = u.getAttribute('href') || u.getAttribute('xlink:href'); if (h) out.push(`:has(use[href="${h}"])`); } return [...new Set(out)];
  }
  const CORR = new Map(), LAST = new Map(); // settle(): per rule, what the page still needed after the offset was applied
  function clustered(rows, declOf, ctx) {
    if (ctx) LAST.set(ctx, []); const bySel = new Map(); for (const r of rows) { const k = r.msel + '|' + (r.rel || ''); if (!bySel.has(k)) bySel.set(k, []); bySel.get(k).push(r); } const out = [];
    for (const [, R] of bySel) {
      const { msel, rel } = R[0]; const tail = rel ? ' ' + rel : ''; const cl = new Map(); for (const r of R) { if (r.key == null) continue; if (!cl.has(r.key)) cl.set(r.key, []); cl.get(r.key).push(r.e); }
      const left = R.filter((r) => r.key == null).map((r) => r.e); const C = [...cl].sort((a, b) => b[1].length - a[1].length); if (!C.length) continue;
      // the narrowest condition that holds for all of a group and none of the rest: one condition if one does it, else the fewest that together
      // do (Cancel is a b3-btn2 with no .go, .quiet or .ghost and no icon); the parent's own selector is a candidate too (the seg buttons)
      const sep = (els, others) => { const ok = (q) => { try { return els.every((x) => x.matches(msel + q)); } catch (_) { return false; } }; const pc = [...new Set(els.map((x) => x.parentElement && M().selOf(x.parentElement)).filter(Boolean))];
        const cands = [...condsOf(els[0], msel, others), ...pc.map((p) => `:is(${p} > *)`), ...[...new Set(others.map((x) => x.parentElement && M().selOf(x.parentElement)).filter(Boolean))].map((p) => `:not(${p} > *)`)].filter(ok);
        for (const q of cands) if (others.every((x) => !x.matches(msel + q))) return q;
        let cond = '', rest = others.slice(); for (let i = 0; i < 6 && rest.length; i++) { let best = null, bn = 0; for (const q of cands) { if (cond.includes(q)) continue; let n = 0; try { n = rest.filter((x) => !x.matches(msel + cond + q)).length; } catch (_) { continue; } if (n > bn) { bn = n; best = q; } } if (!best) return null; cond += best; rest = rest.filter((x) => x.matches(msel + cond)); }
        return rest.length ? null : cond; };
      const emit = (S, key, els) => { const corr = ctx ? CORR.get(ctx + '|' + S) || 0 : 0; out.push(rule([S], 'self', declOf(key, corr))); if (ctx) LAST.get(ctx).push({ S, els }); };
      // the largest group takes the plain rule, narrowed only to keep it off what the setting can't serve
      const c0 = left.length ? sep(C[0][1], left) : ''; emit(msel + (c0 || '') + tail, C[0][0], C[0][1]);
      const glyphOf = (e) => { const u = e.querySelector('use'); return (u && (u.getAttribute('href') || u.getAttribute('xlink:href'))) || [...e.children].map((k) => k.tagName).join(','); };
      for (const [key, els] of C.slice(1)) { const others = R.filter((r) => r.key !== key).map((r) => r.e); const cond = sep(els, others); if (cond) { emit(msel + cond + tail, key, els); continue; }
        const sub = new Map(); for (const e of els) { const g = glyphOf(e); if (!sub.has(g)) sub.set(g, []); sub.get(g).push(e); } for (const [, se] of sub) { const c2 = sep(se, others); if (c2) emit(msel + c2 + tail, key, se); } }
    }
    return out.join('\n');
  }
  const half = (x) => String(Math.round(x * 2) / 2);
  // what the page adds on top of a padding or a gap, grouped to 0.05px, not 0.5: two glyphs whose ink sits 0.15px apart inside the same svg box
  // shared one rule at 0.5 and one of them missed his 10 by 0.15 (Live now, Ended; Upcoming's gap 6.5). A group no condition can single out
  // stays under the main rule, as before (Harkirat's V7 state, 2026-10-05 15:58 EDT)
  const fine = (x) => String(Math.round(x * 20) / 20);
  const GAPLABEL = { gap: 'Icon to words', gap2: 'Words to count', gap3: 'Words to icon', gap4: 'Between other parts' };
  const GAPK = (key) => K(key, GAPLABEL[key], 'space', (el) => {
    if (!(M().descends && M().descends())) { if (key !== 'gap' || insetIcon(el)) return null; const c = cs(el); if (!/flex|grid/.test(c.display)) return null; return flowKids(el).length >= 2 || el.querySelector('svg') ? px(c.columnGap) : null; }
    const sl = gapSlot(el, key); if (!sl) return null; const gnow = () => { const s2 = gapSlot(el, key); return s2 ? s2.g : null; }; if (!drives(sl.el, sl.prop, sl.cur, gnow)) return null; return +sl.g.toFixed(2);
  }, (v, t) => {
    if (!(M().descends && M().descends())) return key === 'gap' ? selfEmit(v, t, (x) => `column-gap:${x} !important`) : '';
    const rows = []; for (const m of v.members) for (const e of allOf(m)) { const sl = gapSlot(e, key); if (!sl) continue; rows.push({ msel: m.sel, rel: relSel(e, sl.el), e, key: sl.prop + '|' + fine(sl.g - sl.cur) }); }
    return clustered(rows, (k, corr) => { const i = k.indexOf('|'); return `${k.slice(0, i)}:calc(${t} - ${+(+k.slice(i + 1) - corr).toFixed(2)}px) !important`; }, `${v.id}|${key}`);
  });
  const IGAP = GAPK('gap'), IGAP2 = GAPK('gap2'), IGAP3 = GAPK('gap3'), IGAP4 = GAPK('gap4');
  const pieceEl = (el, kind) => { if (!(M().descends && M().descends())) return null; const D = M().inside(el); const p = D && D.parts.find((q) => q.kind === kind); if (!p) return null; const e = p.node.nodeType === 1 ? p.node : p.node.parentElement; if (kind === 'count' && (e === mainText(el) || e === el)) return null; return e; };
  const pieceEmit = (kind, decl, ok) => (v, t) => { const rows = []; for (const m of v.members) for (const e of allOf(m)) { const pe = pieceEl(e, kind); if (pe && e.contains(pe) && pe !== e && (!ok || ok(pe))) rows.push({ msel: m.sel, rel: relSel(e, pe), e, key: 'p' }); } return clustered(rows, () => decl(t)); };
  const sizes = (pe, decl, read) => { const a = read(); const b = M().probe(pe, decl(a + 2), read); return Math.abs(b - a - 2) < 0.3; };
  const isDot = (pe) => { const r0 = pe.getBoundingClientRect(); return Math.abs(r0.width - r0.height) <= 0.75; };
  const MSIZE = K('msize', 'Dot size', 'icon', (el) => { const pe = pieceEl(el, 'mark'); if (!pe || !isDot(pe)) return null; const rd = () => { const r = pe.getBoundingClientRect(); return Math.max(r.width, r.height); }; if (!sizes(pe, (x) => `width:${x}px !important;height:${x}px !important;min-width:${x}px !important;min-height:${x}px !important;flex:none !important`, rd)) return null; return +rd().toFixed(1); }, pieceEmit('mark', (t) => `width:${t} !important;height:${t} !important;min-width:${t} !important;min-height:${t} !important;flex:none !important`, isDot));
  const NFS = K('nfs', 'Count size', 'text', (el) => { const pe = pieceEl(el, 'count'); return pe ? px(cs(pe).fontSize) : null; }, pieceEmit('count', (t) => `font-size:${t} !important`));
  const BH = K('bh', 'Badge height', 'height', (el) => { const pe = pieceEl(el, 'badge'); if (!pe) return null; const rd = () => pe.getBoundingClientRect().height; if (!sizes(pe, (x) => `height:${x}px !important;min-height:0 !important;box-sizing:border-box !important`, rd)) return null; return +rd().toFixed(1); }, pieceEmit('badge', (t) => `height:${t} !important;min-height:0 !important;box-sizing:border-box !important`));
  const BFS = K('bfs', 'Badge text size', 'text', (el) => { const pe = pieceEl(el, 'badge'); return pe ? px(cs(pe).fontSize) : null; }, pieceEmit('badge', (t) => `font-size:${t} !important`));
  const NFW = K('nfw', 'Count weight', 'weight', (el) => { const pe = pieceEl(el, 'count'); return pe ? +cs(pe).fontWeight || 400 : null; }, pieceEmit('count', (t) => `font-weight:${t} !important`), { unit: '' });
  // a box sized by what is in it (a chip, an attachment, a name plate, a label in a row) has no width of its own: its width setting is the
  // least it may be (min-width), and Max width the most it may be; only a box its container sizes takes a width (Harkirat, 2026-10-06 12:24
  // EDT: "why do dynamic chips/elements ... even have a pre-defined width value? ... what they shouldve had is a max widths"; a width of 32 on
  // the problem chip folded it to its icon). Found by trying it with the builder's own rules off: 20px more padding widens such a box by 20px
  const CSZ = new Map();
  function contentSized(el) { if (!el || !el.getBoundingClientRect) return false; const k = (el.__bdk = el.__bdk || Math.random().toString(36).slice(2)) + '|cs|' + (state ? state.at : 0); if (CSZ.has(k)) return CSZ.get(k);
    const off = [sheet, dragSheet].filter((x) => x && !x.disabled); off.forEach((x) => { x.disabled = true; }); let r = false;
    try { const c = cs(el); const w0 = el.getBoundingClientRect().width; const w1 = M().probe(el, `padding-left:${px(c.paddingLeft) + 20}px !important`, () => el.getBoundingClientRect().width); r = Math.abs(w1 - w0 - 20) < 0.5; } finally { off.forEach((x) => { x.disabled = false; }); }
    CSZ.set(k, r); if (CSZ.size > 4000) CSZ.clear(); return r; }
  const MINW = (x) => `min-width:${x} !important`;
  const minCap = (el) => (contentSized(el) ? 'min width' : null);
  const widthEmit = (v, t, fixed) => v.members.map((m) => rule([m.sel], 'self', contentSized(allOf(m)[0]) ? MINW(t) : fixed(t))).join('\n');
  // a control whose alignment places its content (an icon centred in a fixed-width button) is sized, not padded: its drawn width
  const CW = K('cw', 'Width', 'height', (el) => { if (!(M().descends && M().descends())) return null; const T = M().paintTarget(el); if (!T || T.bare || /^table/.test(cs(el).display) || reveals(el)) return null; if (drawnPad('left')(el) != null && drawnPad('right')(el) != null) return null; return +T.rect.width.toFixed(2); }, (v, t) => { const cwSet = !!(v.set && v.set.cw); /* Width set: every member takes it, except one that opens on hover */ const sq = cwSet ? [] : v.members.filter(isSquareIcon); const rest0 = cwSet ? v.members.filter((m) => !reveals(allOf(m)[0])) : []; const least = rest0.filter((m) => contentSized(allOf(m)[0])); const rest = { ...v, members: rest0.filter((m) => !least.includes(m)) }; const dec = (w) => (p) => (p === 'self' ? `width:${w} !important;min-width:0 !important;max-width:none !important;flex:none !important;box-sizing:border-box !important` : `left:calc((100% - ${w}) / 2) !important;right:auto !important;width:${w} !important`);
    // a square icon-only control stays square: until Width is set on its own, its width follows its height (the image chip, 10:58 EDT: "it's width never increases")
    return [rest.members.length ? sizeEmit(rest, dec(t)) : '', least.length ? rule(least.map((m) => m.sel), 'self', MINW(t)) : '', sq.length && v.set && v.set.height ? sizeEmit({ ...v, members: sq }, dec(`var(--bd-${v.id.toLowerCase()}-height)`)) : ''].filter(Boolean).join('\n'); }, { also: ['height'], capOf: minCap });
  const EDGE = K('edge', 'Edge thickness', 'edge', (el) => { const c = tcs(el); return c.borderTopStyle === 'none' ? null : px(c.borderTopWidth); }, (v, t) => visEmit(v, t, (x) => `border-width:${x} !important`));
  const LH = K('lh', 'Line height', 'line', (el) => { const v = cs(el).lineHeight; return v === 'normal' ? null : px(v); }, (v, t) => selfEmit(v, t, (x) => `line-height:${x} !important`));
  const LS = K('ls', 'Letter spacing', 'track', (el) => +px(cs(el).letterSpacing).toFixed(2), (v, t) => selfEmit(v, t, (x) => `letter-spacing:${x} !important`));
  const TT = K('tt', 'Capitals', null, (el) => cs(el).textTransform, (v, t) => selfEmit(v, t, (x) => `text-transform:${x} !important`), { unit: '', options: ['none', 'uppercase', 'capitalize'] });
  const TFS = K('fs', 'Size', 'text', (el) => px(cs(el).fontSize), (v, t) => selfEmit(v, t, (x) => `font-size:${x} !important`));
  const TFW = K('fw', 'Weight', 'weight', (el) => +cs(el).fontWeight || 400, (v, t) => selfEmit(v, t, (x) => `font-weight:${x} !important`), { unit: '' });
  const ISIZE = K('size', 'Size', 'icon', (el) => drawnIcon(el), (v, t) => selfEmit(v, t, (x) => `width:${x} !important;height:${x} !important;flex-basis:${x} !important;min-width:${x} !important;min-height:${x} !important;max-width:none !important;max-height:none !important`));
  const LGAP = K('gap', 'Space between, all', 'space', (el) => { const c = cs(el); return px(axisOf(el) === 'y' ? c.rowGap : c.columnGap); }, (v, t) => selfEmit(v, t, (x) => (v.axis === 'y' ? `row-gap:${x} !important` : `column-gap:${x} !important`)));
  // the space inside a layout or a box, one setting per side (Harkirat, 2026-10-06 11:11 EDT: "why is the 8px left/right padding strictly
  // linked? why can't i adjust an individual side?"), read like a control's: inside edge to the first drawn piece, so a list head and its rows
  // read the same number to the same checkbox (10:58 EDT: the rows read 22 to it, the WEAPON head 8, its padding to the checkbox's 44px hit
  // box). A side whose padding moves nothing drawn one for one (centred content) keeps the plain padding as its number
  const lpRead = (side) => (el) => { const d = drawnPad(side)(el); return d != null ? d : px(cs(el)['padding' + side[0].toUpperCase() + side.slice(1)]); };
  const LPAD = (side, label) => K('pad' + SIDEK[side], label, 'space', lpRead(side), padEmit(side, true));
  const LPADT = LPAD('top', 'Space inside, top'), LPADB = LPAD('bottom', 'Space inside, bottom'), LPADL = LPAD('left', 'Space inside, left'), LPADR = LPAD('right', 'Space inside, right');
  // each space between a layout's items is its own setting, read between what is drawn (a 20px checkbox in a 44px hit box counts as the
  // checkbox), written as the margin before the item that follows, so one never moves another (10:58 EDT: the gaps in a row, and the row's
  // share | divider | delete, set one by one). Items that wrap, or more than seven, keep one setting for all of them (Space between, all)
  const SLOTS = 6;
  const kidRect = (k) => { const kk = M().kindOf(k); if (kk === 'text' || kk === 'icon') return M().seen(k); /* anything else is spaced from what it draws: its painted box or ring, else what it holds (a 44px checkbox hit area by its 18px box, a wrapper by the chip inside it) */ return M().drawnExtent(k) || M().seen(k); };
  function slotOf(el, i) {
    if (!(M().descends && M().descends())) return null; const vert = axisOf(el) === 'y'; const K0 = flowKids(el); const pb = M().flowWords ? M().flowWords(el, '::before') : null; const n0 = K0.length + (pb ? 1 : 0); if (n0 < i + 1 || n0 > SLOTS + 1) return null;
    // in a grid, an item that draws nothing of its own ends where its column ends (the build number's column is 28 wide whatever its digit),
    // so a gap from it is the same on every row and a setting keeps the columns lined up
    const grid = /grid/.test(cs(el).display); const cell = (k) => { if (!grid || M().visibleBox(k) || /control|icon/.test(M().kindOf(k) || '')) return null; return M().probe(k, 'justify-self:stretch !important;width:auto !important;min-width:0 !important;max-width:none !important;margin-left:0 !important;margin-right:0 !important', () => { const q = k.getBoundingClientRect(); return { left: q.left, right: q.right, top: q.top, bottom: q.bottom, width: q.width, height: q.height }; }); };
    const K1 = K0.map((k) => ({ k, r: kidRect(k), c: cell(k) })); if (pb) K1.push({ k: el, r: pb, pseudo: true }); if (K1.some((x) => !x.r || !(x.r.width > 0 || x.r.height > 0))) return null; K1.sort((a, b) => (vert ? a.r.top - b.r.top : a.r.left - b.r.left));
    for (let j = 1; j < K1.length; j++) { const a = K1[j - 1].r, z = K1[j].r; if (vert ? z.top < a.bottom - 0.5 : z.left < a.right - 0.5 || Math.min(a.bottom, z.bottom) - Math.max(a.top, z.top) <= 0) return null; } // overlapping or wrapped: no pairs to set
    const a = K1[i - 1], b = K1[i]; if (b.pseudo) return null; const ra = a.c || a.r, rb = b.r;
    // written as the margin before the item that follows; where that moves nothing one for one (an item a free column places), as the margin
    // after the item before it (slotDrives picks the one that works)
    const cands = [{ el: b.k, prop: vert ? 'margin-top' : 'margin-left', cur: px(cs(b.k)[vert ? 'marginTop' : 'marginLeft']) }]; if (!a.pseudo) cands.push({ el: a.k, prop: vert ? 'margin-bottom' : 'margin-right', cur: px(cs(a.k)[vert ? 'marginBottom' : 'marginRight']) });
    return { g: vert ? rb.top - ra.bottom : rb.left - ra.right, a: a.k, el: b.k, ra, rb, cands, prop: cands[0].prop, cur: cands[0].cur };
  }
  // space the row spreads (an auto margin pinning New build to the end, space-between) is not a gap: it grows with the row, and a number set
  // there would pin the button and stop it following the row's edge. Tried by widening the row 20px for a moment
  const SPR = new Map();
  const spreads = (el, i, sl) => { const k = (el.__bdk = el.__bdk || Math.random().toString(36).slice(2)) + '|sp' + i + '|' + (state ? state.at : 0); if (SPR.has(k)) return SPR.get(k); const w = el.getBoundingClientRect().width; const g2 = M().probe(el, `width:${w + 20}px !important;max-width:none !important;flex:none !important`, () => { const s2 = slotOf(el, i); return s2 ? s2.g : null; }); const r = g2 != null && Math.abs(g2 - sl.g) > 0.5; SPR.set(k, r); if (SPR.size > 4000) SPR.clear(); return r; };
  const slotDrives = (el, i, sl) => { if (spreads(el, i, sl)) return false; for (const cd of sl.cands) if (drives(cd.el, cd.prop, cd.cur, () => { const s2 = slotOf(el, i); return s2 ? s2.g : null; })) { sl.use = cd; return true; } return false; };
  const SLOT = (i) => K('s' + i, 'Gap ' + i, 'space', (el) => { const sl = slotOf(el, i); if (!sl || !slotDrives(el, i, sl)) return null; return +sl.g.toFixed(2); }, (v, t) => {
    const rows = []; for (const m of v.members) for (const e of allOf(m)) { const sl = slotOf(e, i); if (!sl || !slotDrives(e, i, sl)) continue; rows.push({ msel: m.sel, rel: relSel(e, sl.use.el), e, key: sl.use.prop + '|' + fine(sl.g - sl.use.cur) }); }
    return clustered(rows, (k, corr) => { const j = k.indexOf('|'); return `${k.slice(0, j)}:calc(${t} - ${+(+k.slice(j + 1) - corr).toFixed(2)}px) !important`; }, `${v.id}|s${i}`);
  });
  const SLOTK = Array.from({ length: SLOTS }, (_, i) => SLOT(i + 1));
  // which of a layout's gap settings is the space between a and b (the page's click-to-set), or null
  function slotFor(P, a, b) { for (let i = 1; i <= SLOTS; i++) { const sl = slotOf(P, i); if (!sl) return null; if ((sl.a.contains(a) && sl.el.contains(b)) || (sl.a.contains(b) && sl.el.contains(a))) return 's' + i; } return null; }
  const ALIGN = K('align', 'How items line up', null, (el) => cs(el).alignItems, (v, t) => selfEmit(v, t, (x) => `align-items:${x} !important`), { unit: '', options: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline', 'normal'] });
  const THICK = K('thick', 'Thickness', 'edge', (el) => { const r = M().seen(el); return +Math.min(r.width, r.height).toFixed(1); }, (v, t) => v.members.map((m) => { const e = allOf(m)[0]; const r = e && M().seen(e); return rule([m.sel], 'self', r && r.height > r.width ? `width:${t} !important;min-width:0 !important;flex:none !important` : `height:${t} !important;min-height:0 !important`); }).join('\n'));
  // a text's box trimmed to its letters (cap height to baseline), so a centred row centres the letters, not the line box around them
  const TRIM = K('trim', 'Letters box', null, (el) => { const tr = cs(el).getPropertyValue('text-box-trim'); return tr && tr !== 'none' ? 'trim-both cap alphabetic' : 'normal'; }, (v, t) => selfEmit(v, t, (x) => `text-box:${x} !important`), { unit: '', options: ['normal', 'trim-both cap alphabetic'] });
  // a text in a box of its own size (CATEGORY's column): its width and how its words line up in it (Harkirat, 2026-10-05 11:09 EDT: "i still don't
  // have any way to change the width of it's container or it's alignment"); width only where the box can take one (a block, or an item of a flex or grid)
  const TW = K('w', 'Width', 'space', (el) => { const c = cs(el); if (/inline/.test(c.display) && !(el.parentElement && /flex|grid/.test(cs(el.parentElement).display))) return null; return +el.getBoundingClientRect().width.toFixed(1); }, (v, t) => widthEmit(v, t, (x) => `width:${x} !important;min-width:${x} !important;max-width:${x} !important;flex:none !important;box-sizing:border-box !important`), { capOf: minCap });
  const TA = K('ta', 'Words line up', null, (el) => { const a = cs(el).textAlign; return a === 'left' ? 'start' : a === 'right' ? 'end' : a; }, (v, t) => selfEmit(v, t, (x) => `text-align:${x} !important`), { unit: '', options: ['start', 'center', 'end'] });
  const LW = K('lw', 'Width', 'height', (el) => { if (!(M().descends && M().descends()) || /^table|inline$/.test(cs(el).display)) return null; const rd = () => el.getBoundingClientRect().width; if (!sizes(el, (x) => `width:${x}px !important;min-width:0 !important;max-width:none !important;flex:none !important;box-sizing:border-box !important`, rd)) return null; return +rd().toFixed(1); }, (v, t) => widthEmit(v, t, (x) => `width:${x} !important;min-width:0 !important;max-width:none !important;flex:none !important;box-sizing:border-box !important`), { capOf: minCap });
  const MAXW = K('maxw', 'Max width', 'height', (el) => { if (!(M().descends && M().descends()) || !contentSized(el)) return null; const mw = cs(el).maxWidth; return mw && mw !== 'none' && /px$/.test(mw) ? px(mw) : +el.getBoundingClientRect().width.toFixed(1); }, (v, t) => v.members.map((m) => { const e = allOf(m)[0]; if (!e || !contentSized(e)) return ''; const least = v.set && (v.set.cw || v.set.lw || v.set.w); const out = [rule([m.sel], 'self', `max-width:${t} !important${least ? '' : ';min-width:0 !important'}`)]; const tx = mainText(e); const ell = 'overflow:hidden !important;text-overflow:ellipsis !important;white-space:nowrap !important'; if (tx && tx !== e && e.contains(tx)) out.push(rule([`${m.sel} ${relSel(e, tx)}`], 'self', `min-width:0 !important;${ell}`)); else if (tx === e) out.push(rule([m.sel], 'self', ell)); return out.join('\n'); }).join('\n'));
  const KNOBS = { control: [HEIGHT, PADL, PADR, RADIUS, FS, FW, CTT, CLS, CLH, CW, MAXW, ICON, MSIZE, NFS, NFW, BH, BFS, IIN, IOUT, IGAP, IGAP2, IGAP3, IGAP4, EDGE], text: [TFS, TFW, LH, LS, TT, TRIM, TW, MAXW, TA], icon: [ISIZE], layout: [LGAP, ...SLOTK, LPADT, LPADB, LPADL, LPADR, ALIGN, LW, MAXW], box: [LPADT, LPADB, LPADL, LPADR, RADIUS, LGAP, ...SLOTK, LW, MAXW], divider: [THICK] };
  const PREFIX = { control: 'B', text: 'T', icon: 'I', layout: 'L', box: 'X', divider: 'D' };
  const KIND_NAME = { control: 'Button', text: 'Text', icon: 'Icon', layout: 'Layout', box: 'Box', divider: 'Divider' };

  let state = null; let compare = false; const U = [], R = []; let sheet = null; let dragSheet = null;
  const fresh = () => ({ v: 3, scales: START_LISTS(), variants: [], gates: {}, notes: [], seq: {}, at: 0 });
  function ensure() { if (!state || state.v !== 3) state = fresh(); const base = START_LISTS(); state.scales = state.scales || {}; for (const k of Object.keys(base)) if (!Array.isArray(state.scales[k]) || !state.scales[k].length) state.scales[k] = base[k]; state.variants = state.variants || []; state.notes = state.notes || []; state.seq = state.seq || {}; state.gates = state.gates || {}; }
  const lis = new Set(), slis = new Set(); let status = 'not saved yet';
  const changed = () => lis.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  const setStatus = (s) => { status = s; slis.forEach((f) => { try { f(s); } catch (e) {} }); };

  // quick select, stage A (bd/looks.js; Harkirat 2026-10-05 19:21 EDT): a variant may carry a LOOK taken from one element, and css() gives every
  // member that look, its own look properties reset so no hover or ring of its own survives. A member's own capture depends only on the kit's
  // source rules, so it is kept per selector
  const OWN = new Map();
  function setLook(id, el) { const v = get(id); const LK = window.BD && BD.looks; if (!v || !LK || !el) return false; pushUndo(); const c = LK.capture(el); v.look = { from: M().selOf(el), at: Date.now(), draws: c.draws, entries: c.entries.map(({ part, state, prop, val }) => ({ part, state, prop, val })), skipped: c.skipped }; for (const m of v.members) if (c.draws !== 'self') m.part = c.draws; OWN.clear(); /* the group's knobs size the part the look draws on */ save('look'); apply(); changed(); return true; }
  function clearLook(id) { const v = get(id); if (!v || !v.look) return false; pushUndo(); delete v.look; save('look'); apply(); changed(); return true; }
  function lookCss(v) { const LK = window.BD && BD.looks; if (!v.look || !LK) return ''; const out = []; for (const m of v.members) { let own = OWN.get(m.sel); if (!own) { let el = null; try { el = document.querySelector('#board ' + m.sel) || document.querySelector(m.sel); } catch (e) {} own = el ? LK.capture(el) : { entries: [] }; OWN.set(m.sel, own); } out.push(LK.emit(v.look, m.sel, own)); } return out.join('\n'); }
  const isSet = (v, kn) => !!(v.set && (v.set[kn.k] || (kn.also || []).some((d) => v.set[d])));
  function css() {
    const root = [], out = [];
    for (const v of state.variants) {
      if (!v.members.length) continue;
      for (const kn of KNOBS[v.kind] || []) {
        const val = v.values[kn.k]; if (val == null || val === '') continue;
        const tok = `--bd-${v.id.toLowerCase()}-${kn.k}`; root.push(`${tok}:${kn.unit === 'px' ? val + 'px' : val}`);
        // only what was set is written: a variant's values start as what its members show, and writing them back re-drew every member through
        // each knob's own reading (Harkirat, 2026-10-06 11:06 EDT: "i make the problem chip into a variant, changed nothing about it, and it
        // instantly broke it"; on C1 all 53 kinds moved something when made a variant). A knob that follows another (Width a square icon's
        // Height) is written when that one is set
        if (!isSet(v, kn)) continue;
        out.push(kn.emit(v, `var(${tok})`));
      }
      // corrections a fix carries: a patch zeroed (margin, a bare wrapper's padding), an item's own alignment that overrode a centring parent
      // dropped, a text box that holds only text made a plain box so its declared letters box (text-box-trim) can work
      for (const c of v.clears || []) { const w = c.what || 'margin'; const decl = w === 'display' ? 'display:block !important' : w === 'alignSelf' ? 'align-self:auto !important' : c.axis === 'y' ? `${w}-top:0 !important;${w}-bottom:0 !important` : `${w}-left:0 !important;${w}-right:0 !important`; out.push(rule(v.members.flatMap((m) => [`${m.sel} ${c.sel}`, `:is(${m.sel}):is(${c.sel})`]), 'self', decl)); }
      // a clear is scoped to the variant's own members: written bare it zeroed that class EVERYWHERE — L-16 (Layout · wg-end) cleared span.b3-bdgs's margin
      // for the manifest row and took the selection list header's divider gap with it (Harkirat, 2026-10-06 21:52 EDT: "fix this divider gap too")
    }
    for (const v of state.variants) if (v.look && v.members.length) out.push(lookCss(v)); // looks last: they carry state rules the knobs never touch
    return `:root{${root.join(';')}}\n${out.join('\n')}`;
  }
  function apply() { if (dragSheet) dragSheet.textContent = ''; const rs = document.documentElement.style; for (let i = rs.length - 1; i >= 0; i--) if (rs[i].startsWith('--bd-')) rs.removeProperty(rs[i]); if (!sheet) { sheet = document.createElement('style'); sheet.id = 'bd-std'; document.documentElement.appendChild(sheet); } sheet.textContent = css(); sheet.disabled = compare; if (!inChange && !compare && M().descends && M().descends()) settle(); }
  const SETTLE = ['padL', 'padR', 'padT', 'padB', 'gap', 'gap2', 'gap3', 'gap4', ...SLOTK.map((x) => x.k)];
  function settle() { for (let it = 0; it < 2; it++) { let moved = false; if (M().atRest) M().atRest(); for (const v of state.variants) for (const k of SETTLE) { const val = v.values[k]; if (typeof val !== 'number' || !(v.set && v.set[k])) continue; const kn = (KNOBS[v.kind] || []).find((x) => x.k === k); const L = LAST.get(`${v.id}|${k}`); if (!kn || !L) continue; for (const { S, els } of L) { const errs = []; for (const e of els) { if (!e.isConnected) continue; let g = null; try { g = kn.read(e); } catch (_) {} if (g != null) errs.push(val - g); } if (!errs.length) continue; const mean = errs.reduce((a, b) => a + b, 0) / errs.length; if (Math.abs(mean) >= 0.05) { /* a miss the panel can show (one decimal) is corrected; 0.25 left his 10 at 10.2 (V7 log, 2026-10-05) */ const ck = `${v.id}|${k}|${S}`; CORR.set(ck, +((CORR.get(ck) || 0) + mean).toFixed(2)); moved = true; } } } if (!moved) break; sheet.textContent = css(); } }

  function exactMode(vals, first) { const c = new Map(); for (const x of vals) { const k = typeof x === 'number' ? Math.round(x * 4) / 4 : x; if (!c.has(k)) c.set(k, []); c.get(k).push(x); } let best = null, n = -1; const f = typeof first === 'number' ? Math.round(first * 4) / 4 : first; for (const [k, a] of c) if (a.length > n || (a.length === n && k === f)) { best = a; n = a.length; } const x = best.includes(first) ? first : best[0]; return typeof x === 'number' ? +x.toFixed(2) : x; }
  function mode(vals, first) { const c = new Map(); for (const v of vals) { const k = typeof v === 'number' ? Math.round(v * 2) / 2 : v; c.set(k, (c.get(k) || 0) + 1); } let best = null, n = -1; const f = typeof first === 'number' ? Math.round(first * 2) / 2 : first; for (const [k, m] of c) if (m > n || (m === n && k === f)) { best = k; n = m; } return best; }
  function autoName(kind, el) { const s = M().signature(el); if (kind === 'control') return `${el.tagName.toLowerCase() === 'a' ? 'Link' : KIND_NAME.control} · ${Math.round(s.h)} · ${s.style}`; if (kind === 'text') return `Text · ${s.fs} · ${s.fw}${s.tt !== 'none' ? ' · capitals' : ''}`; if (kind === 'icon') return `Icon · ${Math.round(s.h)}`; if (kind === 'layout' || kind === 'box') return `${KIND_NAME[kind]} · ${M().classesOf(el)[0] || el.tagName.toLowerCase()}`; return `${KIND_NAME[kind] || kind}`; }
  function nextId(kind) { const p = PREFIX[kind] || 'X'; state.seq[p] = (state.seq[p] || 0) + 1; return `${p}-${String(state.seq[p]).padStart(2, '0')}`; }
  function pushUndo() { U.push(JSON.stringify(state)); if (U.length > 300) U.shift(); R.length = 0; }
  const get = (id) => state.variants.find((v) => v.id === id);
  const elsOf = (v) => { const out = []; const board = document.getElementById('board'); for (const m of v.members) { try { for (const el of document.querySelectorAll(m.sel)) if (board.contains(el) && M().visible(el) && !out.includes(el)) out.push(el); } catch (e) {} } return out; };
  function memberOf(el) { const b = []; for (const v of state.variants) for (const m of v.members) { try { if (el.matches(m.sel)) { b.push(v); break; } } catch (e) {} } return b[0] || null; }

  function create(kind, els, name) {
    { const id0 = `${PREFIX[kind]}-`; for (const k of [...CORR.keys()]) if (k.startsWith(id0)) { const vid = k.split('|')[0]; if (!state.variants.some((x) => x.id === vid)) CORR.delete(k); } }
    if (!els.length) return null; pushUndo(); const id = nextId(kind); const members = []; const sels = new Set();
    for (const el of els) { if ([...sels].some((q) => { try { return el.matches(q); } catch (e) { return false; } })) continue; const sel = memberSel(el, els); sels.add(sel); members.push({ sel, part: partOf(el), n: 0 }); }
    const v = { id, kind, name: name || autoName(kind, els[0]), members, values: {}, set: {}, own: {}, orig: {}, clears: [], axis: axisOf(els[0]), at: Date.now() };
    for (const kn of KNOBS[kind] || []) { const vals = els.map((e) => kn.read(e)).filter((x) => x != null && x !== '' && !(typeof x === 'number' && !Number.isFinite(x))); if (!vals.length) continue; v.orig[kn.k] = vals.map((x) => (typeof x === 'number' ? +x.toFixed(2) : x)); v.values[kn.k] = exactMode(vals, kn.read(els[0])); }
    state.variants.push(v); apply(); for (const m of v.members) m.n = document.querySelectorAll(m.sel).length; save(`made ${v.name} (${v.id})`); changed(); return id;
  }
  function addMembers(id, els) { const v = get(id); if (!v) return; pushUndo(); if (v.look && v.look.draws && v.look.draws !== 'self') setTimeout(() => { let ch = false; for (const m of v.members) if (m.part !== v.look.draws) { m.part = v.look.draws; ch = true; } if (ch) { save('look'); apply(); changed(); } }, 0); /* a member joining a group with a look is sized on the part the look draws on */ for (const el of els) { if (v.members.some((m) => { try { return el.matches(m.sel); } catch (e) { return false; } })) continue; const sel = memberSel(el, els); for (const kn of KNOBS[v.kind] || []) { const x = kn.read(el); if (x != null) (v.orig[kn.k] = v.orig[kn.k] || []).push(typeof x === 'number' ? +x.toFixed(2) : x); } v.members.push({ sel, part: partOf(el), n: document.querySelectorAll(sel).length }); } apply(); save(`added to ${v.id}`); changed(); }
  function removeMember(id, sel) { const v = get(id); if (!v) return; pushUndo(); v.members = v.members.filter((m) => m.sel !== sel); apply(); save(`took one out of ${v.id}`); changed(); }
  function setMemberScope(id, sel, scoped) { const v = get(id); if (!v) return; const m = v.members.find((x) => x.sel === sel); if (!m) return; pushUndo(); m.sel = scoped; m.n = document.querySelectorAll(scoped).length; apply(); save(`narrowed ${v.id}`); changed(); }
  let inChange = false; function beginChange() { if (!inChange) { pushUndo(); inChange = true; } }
  function setValue(id, k, val) { const v = get(id); if (!v) return; if (!inChange) pushUndo(); const had = v.values[k] != null && v.values[k] !== ''; v.values[k] = val; v.set = v.set || {}; if (val == null || val === '') delete v.set[k]; else v.set[k] = true; const kn = (KNOBS[v.kind] || []).find((x) => x.k === k);
    // while a knob is dragged only that knob's rule is rewritten, with the value written in, in a small sheet right after the main one (same
    // selectors, so it wins by order); the main sheet is rebuilt once, on release. A named value changed on :root instead restyled every element
    // on the page at each step, because custom properties inherit (measured 2026-10-03 15:02 EDT: 65-69 ms a frame with 33 members; 17 ms with this sheet).
    if (had && inChange && kn) { if (!dragSheet) { dragSheet = document.createElement('style'); dragSheet.id = 'bd-drag'; } if (dragSheet.previousElementSibling !== sheet) { apply(); sheet.after(dragSheet); } dragSheet.textContent = kn.emit(v, kn.unit === 'px' ? val + 'px' : String(val)); dragSheet.disabled = compare; return; } apply(); }
  function endChange(label) { inChange = false; apply(); save(label); changed(); }
  function setOwn(id, k, on) { const v = get(id); if (!v) return; pushUndo(); v.own[k] = !!on; if (!on) { const kn = (KNOBS[v.kind] || []).find((x) => x.k === k); const L = kn && kn.list && state.scales[kn.list]; if (L && L.length && typeof v.values[k] === 'number') { const nv = L.reduce((b, x) => (Math.abs(x - v.values[k]) < Math.abs(b - v.values[k]) ? x : b), L[0]); if (nv !== v.values[k]) { v.values[k] = nv; (v.set = v.set || {})[k] = true; } } apply(); } save(`${v.id} ${k} own ${on}`); changed(); }
  function rename(id, name) { const v = get(id); if (!v || !name.trim()) return; pushUndo(); v.name = name.trim(); save(`renamed ${v.id}`); changed(); }
  function back(id) { const v = get(id); if (!v) return; pushUndo(); v.values = {}; v.set = {}; apply(); save(`${v.id} back to Board 4`); changed(); }
  function remove(id) { pushUndo(); state.variants = state.variants.filter((v) => v.id !== id); apply(); save(`removed ${id}`); changed(); }
  function addClears(id, items) { const v = get(id); if (!v) return; pushUndo(); for (const it of items) if (!v.clears.some((c) => c.sel === it.sel && (c.what || 'margin') === (it.what || 'margin') && c.axis === it.axis)) v.clears.push(it); apply(); save(`${v.id} cleared ${items.length} patches`); changed(); }
  // guides (bd/guides.js) live per gate in the state, so they save, undo and reload with everything else
  function setGuides(gate, list, label) { pushUndo(); state.gates[gate] = state.gates[gate] || {}; state.gates[gate].guides = list; save(label || 'guides'); changed(); }
  function setList(name, arr) { pushUndo(); state.scales[name] = uniq(arr, name === 'track' ? 2 : 0); save(`list ${name}`); changed(); }
  function addNote(text, el) { const n = { at: Date.now(), text, gate: el ? M().gateOf(el) : null, name: el ? M().nameOf(el) : null, sel: el ? M().selOf(el) : null }; state.notes.push(n); save('note'); if (db) db.collection('notes').add(n).catch(() => {}); changed(); }
  function removeNote(at) { state.notes = state.notes.filter((n) => n.at !== at); save('note removed'); changed(); }
  function setCompare(on) { compare = !!on; apply(); changed(); }
  function undo() { if (!U.length) return false; CORR.clear(); R.push(JSON.stringify(state)); state = JSON.parse(U.pop()); ensure(); apply(); save('undo'); changed(); return true; }
  function redo() { if (!R.length) return false; CORR.clear(); U.push(JSON.stringify(state)); state = JSON.parse(R.pop()); ensure(); apply(); save('redo'); changed(); return true; }
  const COMPONENTS1 = new Set(['span.srch > input', 'button.pill.lead.madd', 'div.mtools', 'div.mtools.b3-hi-tools', 'span.mt-chips', 'div.b3-fgc', 'button.chip', 'button.chip.topic', 'button.b3-fc', 'button.b3-fc.none', 'span.mlabel', 'span.mlabel > span', 'span.b3-fgl', 'button.wg-ib.wg-share', 'button.wg-ib.wg-fbtn', 'button.wg-ib.wg-del', 'button.wg-ib.wg-edit.cx-edit', 'button.rmv', 'button.wg-fold', 'div.wg-acts', 'div.wg-r', 'div.wg-h', 'div.mt-r1', 'span.mt-grp', 'div.b3-fg', 'span.wg-an', 'div.wg-main.named', 'span.wg-plate', 'div.wg-end', 'div.mt-r2.b3-hi-f', 'div.wg-line > b']);
  function migrate() {
    if (!state) return; state.drawnModel = true;
    if (!state.components2) { const before = state.variants.length; for (const v of state.variants) v.members = v.members.filter((m) => m.sel !== 'button.b3-fchip'); state.variants = state.variants.filter((v) => v.members.length); state.components2 = { at: Date.now(), removed: before - state.variants.length }; if (before !== state.variants.length) setTimeout(() => save('components.css draws the problem chip (his pick A)'), 0); }
    if (!state.components1) { const gone = []; for (const v of state.variants) { const before = v.members.length; v.members = v.members.filter((m) => !COMPONENTS1.has(m.sel)); if (v.members.length < before) gone.push(`${v.id} −${before - v.members.length}`); }
      const empty = state.variants.filter((v) => !v.members.length).map((v) => v.id); state.variants = state.variants.filter((v) => v.members.length); state.components1 = { at: Date.now(), gone, removed: empty }; if (gone.length || empty.length) setTimeout(() => save('components.css replaces ' + empty.length + ' variants'), 0); }
    // 2026-10-06 11:21 EDT: only what was set is written (v.set). A variant saved before kept every value it was made with; a value still equal to that
    // is taken as not set, so the page shows what the kit draws there. And a layout's padding is one setting per side, read to what is drawn:
    // a saved padding (left and right as one) becomes the same space on each side, converted by what the page adds on top of it
    for (const v of state.variants) {
      if (!v.set) { v.set = {}; for (const [k, val] of Object.entries(v.values || {})) { if (val == null || val === '') continue; const o = (v.orig || {})[k]; const was = Array.isArray(o) && o.length ? mode(o, o[0]) : undefined; if (was === undefined || (typeof val === 'number' ? Math.abs(val - was) > 0.01 : String(val) !== String(was))) v.set[k] = true; } }
      // a row saved as a button that the builder now reads as a layout of its controls takes the layout's settings: its sides carry over (both
      // are read to what is drawn); a button's gaps, height and words do not exist on a row and are listed in v.dropped
      if (v.kind === 'control') { const e0 = elsOf(v)[0]; if (e0 && M().kindOf(e0) === 'layout') { const keep = new Set((KNOBS.layout || []).map((k) => k.k)); v.dropped = v.dropped || {}; for (const k of Object.keys(v.values)) { if (keep.has(k) && k !== 'gap') continue; if (v.set[k]) v.dropped[k] = v.values[k]; delete v.values[k]; delete v.set[k]; if (v.orig) delete v.orig[k]; } v.kind = 'layout'; v.members = v.members.map((m) => ({ ...m, part: 'self' })); if (/^Button · /.test(v.name)) v.name = autoName('layout', e0); v.axis = axisOf(e0); } }
      if (v.kind !== 'layout' && v.kind !== 'box') continue; const e = elsOf(v)[0];
      for (const [old, sides] of [['padX', ['left', 'right']], ['padY', ['top', 'bottom']]]) {
        if (!(old in (v.values || {})) && !(old in (v.orig || {}))) continue;
        for (const side of sides) { const k = 'pad' + SIDEK[side]; const C = 'padding' + side[0].toUpperCase() + side.slice(1); let d = null; try { d = e ? drawnPad(side)(e) : null; } catch (_) {} const off = d != null ? d - px(cs(hostOf(e))[C]) : 0; const cv = (x) => (typeof x === 'number' ? +(x + off).toFixed(2) : x);
          if (v.values[old] != null && v.values[old] !== '') v.values[k] = cv(v.values[old]); if (Array.isArray(v.orig[old])) v.orig[k] = v.orig[old].map(cv); if (v.set[old]) v.set[k] = true; if (v.own && v.own[old]) v.own[k] = v.own[old]; }
        delete v.values[old]; delete v.orig[old]; delete v.set[old]; if (v.own) delete v.own[old];
      }
    }
    // 2026-10-06 16:03 EDT, his "revert it back to lucide's method ... where they don't differ between sets": an icon's size is its Lucide box
    // again (drawnIcon), one number for every glyph, so one size is one line weight. From 2026-10-05 14:01 EDT a saved size was the icon's ink,
    // which gave an × or a chevron a box up to 1.7 times a trash can's at the same number, and so a heavier line. The number he typed is kept and
    // now means the box; the ink it meant is kept in v.iconWas, and the kit's own sizes (v.orig) are read again as boxes. The 2026-10-05
    // conversion from box to ink (state.iconDrawn) no longer runs.
    if (!state.iconBox) { let n = 0; for (const v of state.variants) { const k = v.kind === 'icon' ? 'size' : 'icon'; if (typeof (v.values || {})[k] !== 'number') continue; const box = (e) => { const sv = e && (v.kind === 'icon' ? e : firstSvg(e)); return sv ? drawnIcon(sv) : null; };
        if (state.iconDrawn) { v.iconWas = { [k]: v.values[k], meant: 'ink' }; n++; } if (v.orig) { const o = elsOf(v).map(box).filter((x) => x != null); if (o.length) v.orig[k] = o; } }
      state.iconBox = { at: Date.now(), from: state.iconDrawn ? 'ink' : 'box', kept: n }; state.iconDrawn = true; if (n) setTimeout(() => save('icon sizes are Lucide boxes again (his 16:03)'), 0); }
  }
  function load(s) { state = typeof s === 'string' ? JSON.parse(s) : JSON.parse(JSON.stringify(s)); ensure(); reaxis(); migrate(); apply(); changed(); }

  // every member must show its value; the ones that can't are listed with the likely reason
  function selfCheck(id) {
    const v = get(id); if (!v) return []; const bad = [];
    for (const el of elsOf(v)) for (const kn of KNOBS[v.kind] || []) {
      const want = v.values[kn.k]; if (want == null || want === '' || !isSet(v, kn)) continue; const got = kn.read(el); if (got == null) continue;
      const ok = typeof want === 'number' ? Math.abs(got - want) <= 0.6 : String(got) === String(want);
      if (!ok) bad.push({ id, el, k: kn.k, label: kn.label, want, got: typeof got === 'number' ? +got.toFixed(1) : got, why: whyNot(el, kn) });
    }
    return bad;
  }
  function whyNot(el, kn) {
    if ((kn.k === 'padL' || kn.k === 'padR') && M().descends && M().descends()) { const h = hostOf(el); const side = kn.k === 'padL' ? 'left' : 'right'; const C = 'padding' + side[0].toUpperCase() + side.slice(1); if (!drives(h, 'padding-' + side, px(cs(h)[C]), () => { const d = M().inside(el); return d ? d[side] : null; })) return 'its width sets this space, not its padding (try Width)'; }
    if (kn.k === 'height' && el.parentElement) { const c = cs(el.parentElement); if (/grid/.test(c.display) || (/flex/.test(c.display) && /^row/.test(c.flexDirection) && /stretch|normal/.test(c.alignItems))) return 'its container sets its height'; }
    if (kn.k === 'fs' || kn.k === 'fw') { if (mainText(el) !== el) return 'the words inside set their own text style'; }
    if (kn.k === 'radius' || kn.k === 'edge') { if (!M().visibleBox(el)) return 'it draws no box'; if (kn.k === 'edge') return 'its edge is a drawn ring, not a border'; }
    if (kn.k === 'icon') return 'the icon sizes itself';
    return 'something more specific still sets it';
  }

  // saving: this browser always, the artifact's database when this view has it; one write at a time
  let db = null, timer = null, busy = false; const pending = [];
  function save(label) { state.at = Date.now(); try { localStorage.setItem('bd-state', JSON.stringify(state)); } catch (e) {} pending.push(label); clearTimeout(timer); timer = setTimeout(flush, 700); if (!db) setStatus('saved in this browser only'); }
  async function flush() {
    if (busy) { timer = setTimeout(flush, 400); return; } const labels = pending.splice(0); if (!db) { setStatus('saved in this browser only'); return; }
    busy = true; setStatus('saving…');
    try { await db.doc('builder/state').set(JSON.parse(JSON.stringify(state))); setStatus('saved'); const last = labels.filter((l) => l !== 'undo' && l !== 'redo').slice(-3); for (const l of last) { try { await db.collection('history').add({ at: Date.now(), what: l }); } catch (e) {} } }
    catch (e) { setStatus('saved in this browser only (' + ((e && e.code) || 'error') + ')'); }
    busy = false;
  }
  function init() {
    try { const s = JSON.parse(localStorage.getItem('bd-state') || 'null'); if (s && s.v === 3) state = s; } catch (e) {}
    ensure(); reaxis(); migrate(); apply();
    (async () => {
      try { db = window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (e) { db = null; }
      if (!db) { setStatus(state.at ? 'saved in this browser only' : 'not saved yet (this browser only)'); return; }
      try { const snap = await db.doc('builder/state').get(); if (snap.exists) { const d = snap.data(); if (d && d.v === 3 && (!state.at || (d.at || 0) >= state.at)) { state = JSON.parse(JSON.stringify(d)); ensure(); reaxis(); migrate(); apply(); changed(); } } setStatus(state.at ? 'saved' : 'ready to save'); }
      catch (e) { setStatus('saved in this browser only'); }
    })();
  }
  BD.std = { iconGeom, insetIcon, gapHolder, gapSlot, slotFor, slotAt: slotOf, kidRect, isSet: (v, k) => !!(v && v.set && v.set[k]), tgt, init, load, css, apply, create, addMembers, setLook, clearLook, removeMember, setMemberScope, beginChange, setValue, endChange, setOwn, rename, back, remove, addClears, setList, setGuides, addNote, removeNote, setCompare, undo, redo, selfCheck, get, elsOf, memberOf, axisOf,
    get state() { return state; }, get compare() { return compare; }, get status() { return status; }, get lists() { return state.scales; }, KNOBS, LIST_NAMES, KIND_NAME, SPACE,
    onChange: (f) => lis.add(f), onStatus: (f) => slis.add(f), exportJSON: () => JSON.stringify(state, null, 1), get canUndo() { return U.length > 0; }, get canRedo() { return R.length > 0; } };
})();
