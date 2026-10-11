// spec-board, plan Step 4 group 1 (2026-10-08): the board's buttons, the section "On the board". A module per group (the plan's Step 4); spec.js hands it
// the page's own primitives, so nothing here imports spec.js back (no import cycle).
let DOMP = null;   /* board-dom.json, fetched once for every group */
// 2026-10-09 15:22 EDT: a hover that can be drawn standing still (his 11:49 EDT "whats the point of showing me the segments/switches if i can't even see them in their
// active/selected states"): every :hover rule on the page is copied once with .fxhov in its place, so a copy given that class (it and its ancestors, as a real
// pointer would) draws its hover. Nothing on the page carries .fxhov except those copies.
function hoverSheet() { if (document.getElementById('fxhov')) return; const out = []; const walk = (rules, wrap) => { for (const r of rules) { if (r.cssRules && !r.selectorText) walk(r.cssRules, r.conditionText ? [...wrap, r.constructor.name === 'CSSMediaRule' ? `@media ${r.conditionText}` : `@supports ${r.conditionText}`] : wrap);
    else if (r.selectorText && r.selectorText.includes(':hover')) { const t = `${r.selectorText.replace(/:not\(:hover\)/g, ':not(\u0001):not(.fxhov)').replace(/:hover/g, '.fxhov').replace(/\u0001/g, ':hover')} { ${r.style.cssText} }`;   /* 2026-10-10 21:09 EDT: a :not(:hover) copied as :not(.fxhov) matched every real hover too, so every --quiet rest rule stayed on while hovered (his "the icon button styles are nearly all broken on their hover"); the copy keeps :not(:hover) and adds :not(.fxhov) */ out.push(wrap.reduceRight((x, w) => `${w} { ${x} }`, t)); } } };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules, []); } catch (e) {} } const st = document.createElement('style'); st.id = 'fxhov'; st.textContent = out.join('\n'); document.head.appendChild(st); }
const SELC = ['on', 'cur', 'active', 'sel', 'picked']; const SELA = ['aria-pressed', 'aria-selected', 'aria-checked'];
const kidsOf = (b) => [...b.children].filter((k) => k.getClientRects().length && (k.tagName === 'BUTTON' || /^(tab|radio)$/.test(k.getAttribute('role') || '')));
const isOn = (k) => SELA.some((a) => k.getAttribute(a) === 'true') || SELC.some((c) => k.classList.contains(c));
/* what marks the selected segment, read off the board's own selected one against an unselected sibling */
function marks(b) { const ks = kidsOf(b); const on = ks.find(isOn), off = ks.find((k) => !isOn(k)); const ref = on || ks[0]; const at = ref ? SELA.filter((a) => ref.hasAttribute(a)) : [];   /* a rail caught with nothing selected still names the attribute it would set */
  return { cls: on ? [...on.classList].filter((c) => !off || !off.classList.contains(c)) : at.length ? [] : ['on'], at }; }
function pick(b, t, M) { for (const k of kidsOf(b)) { const y = k === t; M.cls.forEach((c) => k.classList.toggle(c, y)); M.at.forEach((a) => k.setAttribute(a, y ? 'true' : 'false')); } }
function flip(e, v) { if (!e.__onCls) e.__onCls = SELC.filter((c) => e.classList.contains(c)); const on = v == null ? !isOn(e) : v; let aria = false;
  for (const a of SELA) if (e.hasAttribute(a)) { e.setAttribute(a, on ? 'true' : 'false'); aria = true; } SELC.forEach((c) => e.classList.remove(c)); if (on) (e.__onCls.length ? e.__onCls : aria ? [] : ['on']).forEach((c) => e.classList.add(c)); }
const hov = (t, stop) => { for (let x = t; x && x !== stop; x = x.parentElement) x.classList.add('fxhov'); };
export function makeOnBoard(L, C) {   /* C: group · sec · title · type · exclude · decided · stub · wide · weight (false: words size only) · q · qtag · sweepEx */
  const { html, useState, useRef, useEffect, useLayout, getJson, SIZES, SEG, near, fmt, Num, Tick, VTick, alphaOf, Name, Tag, Sec, inkName, shadowParts, Icon, rLab } = L;
  // ---------- buttons on the board (plan Step 4, group 1; 2026-10-08 18:25 EDT) ----------
  // board-dom.cjs reads every button family off Builder-2 in the states it lives in: its markup, its ancestor chain, the box it draws, its inks at rest and
  // under a real mouse. Each is shown by CLONING the board's own markup into its own chain (same classes and CSS, never redrawn) and measured live on the
  // box it DRAWS against the row that box's height puts it in (C0). Members alike in row, shape and name are one measured member, the rest drawn beside it.
  if (C.states) hoverSheet();
  const DOM = { g: {} }; const domReady = (DOMP || (DOMP = getJson('spec-img/board-dom.json'))).then((j) => { DOM.g = j || {}; });
  // the builder's geometry layer for the clones, scoped to this section so no other drawing on the page takes the board's current sizes
  const scopeRule = (css, pre) => { const i = css.indexOf('{'); const parts = []; let dp = 0, cur = ''; for (const ch of css.slice(0, i)) { if (ch === '(') dp++; if (ch === ')') dp--; if (ch === ',' && !dp) { parts.push(cur); cur = ''; } else cur += ch; } parts.push(cur); return parts.map((q) => `${pre} ${q.trim()}`).join(', ') + ' ' + css.slice(i); };
  domReady.then(() => { const B = DOM.g[C.group] || {}; const rules = new Set(); const vars = {}; for (const v of Object.values(B)) { (v.bd || []).forEach((r) => rules.add(r)); Object.assign(vars, v.bdvars || {}); }
    const st = document.createElement('style'); st.id = 'bd-' + C.sec; st.textContent = `#${C.sec} { ${Object.entries(vars).map(([k, x]) => `${k}: ${x};`).join(' ')} }\n` + [...rules].map((r) => scopeRule(r, '#' + C.sec)).join('\n'); document.head.appendChild(st); });
  // a rule that reads a DESCENDANT of an ancestor (:has()) sees nothing in a chain of ancestors; the one such context a clone needs is stood in, hidden
  const STUB = C.stub || {};
  // a width the board takes from its container (a table cell), not from the button
  const WIDE = C.wide || {};
  function Clone({ path, markup, stub }) {
    const segs = (path || '').split(' > ').filter(Boolean); const last = segs.length - 1; const stubAt = stub && segs.findIndex((q) => new RegExp('(^|\\.)' + stub[0] + '(\\.|\\[|$)').test(q));
    return segs.reduceRight((kid, seg, i) => { const m = SEG.exec(seg) || []; const at = {}; (m[4] || '').replace(/\[([\w-]+)=([^\]]*)\]/g, (_, k, v) => { at[k] = v; return ''; });
      const cls = ['ctx', ...(m[3] || '').split('.').filter((c) => c && c !== 'b3-fady')].join(' '); const T = m[1] || 'div'; const id = m[2] ? m[2].slice(1) : undefined;   /* unlike Chain, the drawer stays: its buttons' rules name it */
      return i === last ? html`<${T} id=${id} class=${cls} ...${at} dangerouslySetInnerHTML=${{ __html: markup }} />` : html`<${T} id=${id} class=${cls} ...${at}>${i === stubAt ? html`<div class=${stub[1]} style="display:none" aria-hidden="true"></div>` : null}${kid}<//>`; }, null);
  }
  // the box a button DRAWS (skinOf's rule: the largest visible box among the button, its children and their ::before/::after), placed on the page: a
  // pseudo-element has no rect of its own, so it sits at its own left/top when they are set, else centred on its element. A button bare at rest has none.
  function skinRect(b) {
    let best = null;
    for (const el of [b, ...b.querySelectorAll('*')]) for (const ps of [null, '::before', '::after']) { const c = getComputedStyle(el, ps); if (ps && (c.content === 'none' || c.content === 'normal')) continue;
      const vis = (parseFloat(c.borderTopWidth) > 0 && c.borderTopStyle !== 'none' && alphaOf(c.borderTopColor) > 0.01) || /inset/.test(c.boxShadow) || alphaOf(c.backgroundColor) > 0.01; if (!vis) continue;
      const er = el.getBoundingClientRect(); let x, y, w, h;
      if (ps) { const ec = getComputedStyle(el); w = parseFloat(c.width) || 0; h = parseFloat(c.height) || 0; const l = parseFloat(c.left), t = parseFloat(c.top); x = isNaN(l) ? er.left + (er.width - w) / 2 : er.left + parseFloat(ec.borderLeftWidth) + l; y = isNaN(t) ? er.top + (er.height - h) / 2 : er.top + parseFloat(ec.borderTopWidth) + t; }
      else { x = er.left; y = er.top; w = er.width; h = er.height; }
      if (!best || w * h > best.w * best.h) best = { x, y, w, h, c, el, ps }; }
    return best;
  }
  const boxRect = (b) => { const r = b.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, c: getComputedStyle(b) }; };
  window.__skinRect = (b) => { const k = skinRect(b) || boxRect(b); return { x: k.x, y: k.y, w: k.w, h: k.h, r: parseFloat(k.c.borderTopLeftRadius) || 0 }; };
  // every visible run of words in a button (a visually hidden label is not words): their span, and the first one's size and weight
  const wordsOf = (b) => { const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? 1 : 2) }); let n, u = null, f = null;
    while ((n = w.nextNode())) { const g = document.createRange(); g.selectNodeContents(n); const q = g.getBoundingClientRect(); const pc = getComputedStyle(n.parentElement); if (q.width <= 2 || pc.visibility === 'hidden' || +pc.opacity < 0.05) continue;
      if (!f) f = { fs: parseFloat(pc.fontSize), fw: +pc.fontWeight }; u = u ? { left: Math.min(u.left, q.left), right: Math.max(u.right, q.right) } : { left: q.left, right: q.right }; }
    return u && { ...u, ...f }; };
  const TXT = (row) => { const [z, w] = String(SIZES[row].text).split('·').map((x) => parseFloat(x)); return { s: z, w }; };
  const BTN_MISS = window.__btnMisses || (window.__btnMisses = {});
  // the clone's own root: the child of the innermost chain element (a stood-in :has() context is a sibling, never on the path)
  const rootOf = (w) => { if (!w) return null; let x = w; for (let n; (n = x.querySelector(':scope > .ctx')); ) x = n; return x.firstElementChild; }; window.__rootOf = rootOf;
  // 2026-10-09 12:49 EDT: the corrected twin (his 2026-10-09 11:49 EDT "draw the corrected proposed state"): the same clone, set to its row's values (C0–C3, C5, C6) by inline
  // overrides, then measured by the same gauge, so a value that did not land shows as a miss on the proposed drawing. Absolute values first (height, corner,
  // icon, words), then the paddings and gaps nudged by what the gauge still measures (a skin, a margin or a fixed width can carry them), up to three passes.
  const imp = (el, k, v) => el.style.setProperty(k, v, 'important');
  const visEls = (b, q) => [...b.querySelectorAll(q)].filter((x) => x.getClientRects().length && x.getBoundingClientRect().width > 2);
  function fixWords(b, row) { const tx = TXT(row); for (const el of [b, ...b.querySelectorAll('*')]) if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) { imp(el, 'font-size', tx.s + 'px'); imp(el, 'font-weight', String(tx.w)); } }
  function fixBox(b, h, r, pill) { const c = getComputedStyle(b); imp(b, 'box-sizing', 'border-box'); imp(b, 'height', h + 'px'); imp(b, 'min-height', h + 'px'); imp(b, 'max-height', h + 'px'); imp(b, 'padding-top', '0'); imp(b, 'padding-bottom', '0');
    if (!/flex|grid/.test(c.display)) imp(b, 'display', 'inline-flex'); imp(b, 'align-items', 'center'); imp(b, 'border-radius', (pill ? h / 2 : r) + 'px'); }
  // where the box is drawn decides where the values go: on the button itself; on a child that draws it (the root then is the click area, C1's hit);
  // or on a ::before/::after, which takes a rule of its own keyed to this twin
  let FXN = 0; const FXH = new WeakMap(); const FXS = new WeakMap();
  function pseudoRule(b, ps, css, tag = '') { const id = b.getAttribute('data-fxid') || String(++FXN); b.setAttribute('data-fxid', id); const sid = 'fxps-' + id + ps.replace(/:/g, '') + tag; let st = document.getElementById(sid); if (!st) { st = document.createElement('style'); st.id = sid; document.head.appendChild(st); } st.textContent = `.spec [data-fxid="${id}"]${ps} { ${css} }`; }
  // 2026-10-10 19:07 EDT: a twin's markup changed where he renamed it (his twins note: "reword 'stage this mp build' to 'Stage build' and add an icon"); today's copy keeps the board's
  const live = (h) => (C.live ? String(h || '').replace(/\s(?:aria-disabled="true"|disabled(?:="[^"]*")?)(?=[\s>])/g, '') : h);   /* a disabled copy cannot be judged: both copies drawn enabled */
  const fixMarkup = (sel, h) => live(((C.markup || {})[sel] || []).reduce((s, [a, z]) => s.split(a).join(z), h || ''));
  function fixBtn(b, row) { const E = SIZES[row]; if (!E || !b.getClientRects().length) return false; b.setAttribute('data-fxroot', '');   /* a hidden twin measures nothing: it is set the first time it shows */
    /* what the box is, read once before any override (a corner read after the first pass would call every box a pill) */
    if (!FXS.has(b)) { const k0 = skinRect(b), o0 = boxRect(b); const own0 = !k0 || (k0.el === b && !k0.ps && Math.abs(k0.w - o0.w) < 0.6 && Math.abs(k0.h - o0.h) < 0.6); FXS.set(b, { k: k0 && { el: k0.el, ps: k0.ps }, own: own0, pill: Boolean(k0) && (parseFloat(k0.c.borderTopLeftRadius) || 0) >= k0.h / 2 - 0.5, only: !wordsOf(b), square: k0 ? Math.abs(k0.w - k0.h) < k0.h * 0.5 : true, hitBox: Boolean(k0) && !own0 && (o0.h > k0.h + 0.6 || o0.w > k0.w + 0.6) }); }
    const { k, own, pill, only, square, hitBox } = FXS.get(b);
    /* 2026-10-10 19:07 EDT: a reveal twin is not locked to its square (his "the x close button is bugged. also it should reveal-left": the 32 width lock kept it shut on hover);
       its size, corner, icon and words come from the row, and spec.css opens it the way the Flags section's refined reveal does */
    const rv = own && (C.reveal || {})[(b.closest('[data-bfix]') || { dataset: {} }).dataset.bfix];
    if (rv) { visEls(b, 'svg').forEach((x) => { imp(x, 'width', E.icon + 'px'); imp(x, 'height', E.icon + 'px'); }); fixWords(b, row); fixBox(b, E.h, E.r, pill); b.setAttribute('data-rvx', rv); [['--rv-h', E.h], ['--rv-i', E.icon], ['--rv-p', E.pad], ['--rv-g', E.gap]].forEach(([x, n]) => b.style.setProperty(x, n + 'px')); return true; }
    visEls(b, 'svg').forEach((x) => { imp(x, 'width', E.icon + 'px'); imp(x, 'height', E.icon + 'px'); imp(x, 'flex', 'none'); imp(x, 'transform', 'none'); imp(x, 'padding', '0'); if (only && square) { imp(x, 'margin', '0'); imp(x, 'position', 'static'); imp(x, 'translate', 'none'); } }); fixWords(b, row);   /* an icon's padding or offset is not C6's icon */
    if (own) { [...b.children].forEach((x) => { imp(x, 'margin-left', '0'); imp(x, 'margin-right', '0'); });   /* a margin that pushes a part to the far edge is not C1's gap */
      fixBox(b, E.h, E.r, pill); imp(b, 'min-width', '0'); imp(b, 'column-gap', (only && square ? 0 : E.gap) + 'px'); if (only && square) { imp(b, 'width', E.h + 'px'); imp(b, 'padding-left', '0'); imp(b, 'padding-right', '0'); imp(b, 'justify-content', 'center'); } else imp(b, 'width', 'auto'); return true; }
    const H = hitBox ? E.hit : E.h;   /* the root keeps a click area around the drawn box only where it had one */
    imp(b, 'box-sizing', 'border-box'); imp(b, 'height', H + 'px'); imp(b, 'min-height', H + 'px'); if (only && square) { imp(b, 'width', H + 'px'); imp(b, 'min-width', H + 'px'); imp(b, 'padding-left', '0'); imp(b, 'padding-right', '0'); if (!/flex|grid/.test(getComputedStyle(b).display)) imp(b, 'display', 'inline-flex'); imp(b, 'align-items', 'center'); imp(b, 'justify-content', 'center'); }
    if (k.ps) { const r = pill ? E.h / 2 : E.r; pseudoRule(b, k.ps, `height: ${E.h}px !important; top: calc(50% - ${E.h / 2}px) !important; bottom: auto !important; border-radius: ${r}px !important;${only && square ? ` width: ${E.h}px !important; left: calc(50% - ${E.h / 2}px) !important; right: auto !important;` : ''}`); }
    else fixBox(k.el, E.h, E.r, pill); return true; }
  // 2026-10-09 16:03 EDT: a decided row's look on the twin, beside its geometry (the ledger's shuffle, sort and copy-the-code rows): laid on the box that draws it
  function fixLook(b, css) { const st = FXS.get(b) || {}; const k = st.k; const tgt = k && k.el && !k.ps ? k.el : b; for (const [x, v] of Object.entries(css)) imp(tgt, x, v);
    if (k && k.ps) pseudoRule(b, k.ps, Object.entries(css).map(([x, v]) => `${x}: ${v} !important;`).join(' '), 'look'); }
  // a padding or a gap still off after the absolute pass: move the property that carries it by the difference the gauge measured; a move that changed
  // nothing is put back and not tried again (the part sits where a padding cannot reach, and the twin shows that as a miss)
  function nudgeBtn(b, miss) { let did = false; const k = skinRect(b); const host = k && k.el !== b && !k.ps ? k.el : b; const hist = FXH.get(b) || {}; FXH.set(b, hist);
    const ic = visEls(b, 'svg')[0]; const tw = wordsOf(b); const icRight = ic && tw && ic.getBoundingClientRect().left > tw.left;
    const words = tw && (() => { const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? 1 : 2) }); const n = w.nextNode(); return n && n.parentElement !== b ? n.parentElement : null; })();
    const target = { 'pad-l': [host, 'padding-left'], 'pad-r': [host, 'padding-right'], gap: icRight ? [ic, 'margin-left'] : words ? [words, 'margin-left'] : ic ? [ic, 'margin-right'] : [host, 'column-gap'] };
    for (const m of miss) { const t = target[m.prop]; if (!t) continue; const [el, prop] = t; const h = hist[m.prop]; if (h && (h.dead || Math.abs(m.v - h.v) < 0.3)) { if (!h.dead) { el.style.setProperty(prop, h.orig, h.orig ? 'important' : ''); h.dead = true; did = true; } continue; }
      if (h && h.dead) continue;
      const cur = parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0; hist[m.prop] = { v: m.v, orig: h ? h.orig : el.style.getPropertyValue(prop) }; imp(el, prop, (cur + m.e - m.v) + 'px'); if (m.prop === 'pad-l' && el === b) imp(b, 'justify-content', 'flex-start'); did = true; }
    /* a move that changed nothing: the icon may sit in a wrapper wider than itself (a copy segment, a fixed slot), which holds the space a padding or gap cannot reach — free it once */
    if (!hist.freed && ic && ic.parentElement !== b && Object.values(hist).some((x) => x.dead)) { const w = ic.parentElement; if (w.getBoundingClientRect().width > ic.getBoundingClientRect().width + 1) { hist.freed = true; for (const [x, v] of [['width', 'auto'], ['min-width', '0'], ['padding-left', '0'], ['padding-right', '0'], ['flex', 'none']]) imp(w, x, v); for (const k of Object.keys(hist)) if (k !== 'freed') delete hist[k]; did = true; } }
    return did; }
  window.__btnFixed = window.__btnFixed || {};
  function fixRail(b, kids, row, segRow, ins) { const E = SIZES[row], K = SIZES[segRow]; if (!E || !K || !b.getClientRects().length) return false; const k0 = skinRect(b); if (!FXS.has(b)) FXS.set(b, { pill: Boolean(k0) && (parseFloat(k0.c.borderTopLeftRadius) || 0) >= k0.h / 2 - 0.5, kp: kids.map((k) => { const kk = skinRect(k); return Boolean(kk) && (parseFloat(kk.c.borderTopLeftRadius) || 0) >= kk.h / 2 - 0.5; }) }); const { pill, kp: KP } = FXS.get(b);
    fixBox(b, E.h, E.r, pill); ['top', 'right', 'bottom', 'left'].forEach((q) => imp(b, 'padding-' + q, ins + 'px'));
    kids.forEach((k, i) => { fixBox(k, K.h, K.r, KP[i]); visEls(k, 'svg').forEach((x) => { imp(x, 'width', K.icon + 'px'); imp(x, 'height', K.icon + 'px'); imp(x, 'flex', 'none'); }); if (wordsOf(k)) { imp(k, 'padding-left', K.pad + 'px'); imp(k, 'padding-right', K.pad + 'px'); fixWords(k, segRow); } }); return true; }
  function nudgeRail(b, miss) { let did = false; const c = getComputedStyle(b); for (const m of miss) { const d = m.e - m.v; if (m.prop === 'inset-x') { imp(b, 'padding-left', (parseFloat(c.paddingLeft) + d) + 'px'); did = true; } else if (m.prop === 'inset-y') { imp(b, 'padding-top', (parseFloat(c.paddingTop) + d) + 'px'); did = true; } } return did; }
  function fixField(f, multi) { if (!f.getClientRects().length) return; const k = skinRect(f), o = boxRect(f); const own = !k || (Math.abs(k.w - o.w) < 0.6 && Math.abs(k.h - o.h) < 0.6); if (own) { if (!multi) fixBox(f, 44, 11, false); else imp(f, 'border-radius', '11px'); } else if (k && k.el && !k.ps) { if (!multi) fixBox(k.el, 44, 11, false); else imp(k.el, 'border-radius', '11px'); }   /* the box that draws the field may be inside it (Post's body) */
    for (const x of [f, ...f.querySelectorAll('input, textarea')]) if (x.matches('input, textarea')) imp(x, 'font-size', '13px'); }
  function nudgeField(f, miss, lead, inp) { let did = false; for (const m of miss) { const d = m.e - m.v; if (m.prop === 'fpad') { if (lead) { const lc = getComputedStyle(lead); if (lc.position === 'absolute') { imp(lead, 'left', (parseFloat(lc.left) + d) + 'px'); if (inp) imp(inp, 'padding-left', (parseFloat(getComputedStyle(inp).paddingLeft) + d) + 'px'); } else imp(lead, 'margin-left', (parseFloat(lc.marginLeft) + d) + 'px'); }
        else if (inp) imp(inp, 'padding-left', (parseFloat(getComputedStyle(inp).paddingLeft) + d) + 'px'); did = true; }
      else if (m.prop === 'fgap' && lead) { const lc = getComputedStyle(lead); if (lc.position === 'absolute' && inp) imp(inp, 'padding-left', (parseFloat(getComputedStyle(inp).paddingLeft) + d) + 'px'); else imp(lead, 'margin-right', (parseFloat(lc.marginRight) + d) + 'px'); did = true; } } return did; }
  // the measurements on the box the button draws, against its row (none for a height off the size table: Q3); its click area dim when it is larger
  function BtnGauge({ sel, row, v, fix, children }) {
    const ref = useRef(); const [g, setG] = useState(null); const E = row ? SIZES[row] : null;
    useLayout(ref, function run(box, pass = 0) {
      const b = rootOf(box.querySelector(fix ? '[data-bfix]' : '[data-bsel]')); if (!b) return; if (fix && !pass && fixBtn(b, row)) { if ((C.fixCss || {})[sel]) fixLook(b, C.fixCss[sel]); for (const [q, css] of (C.fixKids || {})[sel] || []) b.querySelectorAll(q).forEach((e) => { for (const [x, v] of Object.entries(css)) imp(e, x, v); }); } const bc = getComputedStyle(b);
      /* a button the board places inside its parent (a transform, an absolute position) stands in the gauge's flow instead; nothing it draws changes */
      if (v && v.rest && v.rest.transform && v.rest.transform !== 'none') b.style.transform = 'none'; if (/absolute|fixed/.test(bc.position)) { b.style.position = 'relative'; b.style.inset = 'auto'; }
      const o = box.getBoundingClientRect(); const L = (x) => x - o.left, T = (y) => y - o.top; const r = b.getBoundingClientRect(); const s = ((C.box || {})[sel] ? null : skinRect(b)) || boxRect(b);   /* C.box: measured on its own box (today's day draws only a 4px dot) */
      if (C.width && C.width[sel] && v && v.w) b.style.width = v.w + 'px';   /* a width its board container sets: the clone takes it, so its words wrap as they do there */
    const IS = fix && (C.iconSel || {})[sel]; if (IS && E && !pass) b.querySelectorAll(IS).forEach((x) => { imp(x, 'width', E.icon + 'px'); imp(x, 'height', E.icon + 'px'); imp(x, 'flex', 'none'); });   /* a part that stands in the icon's slot on the corrected copy (C.iconSel) */
    const ic = (IS && b.querySelector(IS)) || [...b.querySelectorAll('svg')].find((x) => x.getClientRects().length && x.getBoundingClientRect().width > 2); const ir = ic && ic.getBoundingClientRect(); let tw = wordsOf(b);
    /* words drawn by a ::before (the attachment chip's slot label) have no text node: they start at the content edge, so the run reaches back to it */
    { const bf = getComputedStyle(b, '::before'), bc2 = getComputedStyle(b); if (/^"[^"]+"$/.test(bf.content) && bf.display !== 'none' && bf.position !== 'absolute') { const cl = b.getBoundingClientRect().left + parseFloat(bc2.borderLeftWidth) + parseFloat(bc2.paddingLeft); tw = tw ? { ...tw, left: Math.min(tw.left, cl) } : { left: cl, right: cl + (parseFloat(bf.width) || 0), fs: parseFloat(bf.fontSize), fw: +bf.fontWeight }; } }
      const inBox = (a, z) => a >= s.x - 0.5 && z <= s.x + s.w + 0.5;   /* a switch's label sits beside its track: words outside the drawn box are not its padding */
    const parts = [ir && inBox(ir.left, ir.right) && ['icon', ir.left, ir.right], tw && inBox(tw.left, tw.right) && ['text', tw.left, tw.right]].filter(Boolean).sort((p, q) => p[1] - q[1]); const only = !(tw && inBox(tw.left, tw.right)); const segs = []; let at = s.x;
      parts.forEach(([k, a, z], i) => { segs.push([i ? 'gap' : 'pad', at, a, E && !only ? (i ? E.gap : E.pad) : null, i ? 'gap' : 'pad-l']); segs.push([k, a, z, k === 'icon' && E ? E.icon : null, k]); at = z; });
      if (parts.length) segs.push(['pad', at, s.x + s.w, E && !only ? E.pad : null, 'pad-r']);
      const rad = parseFloat(s.c.borderTopLeftRadius) || 0; const pill = rad >= s.h / 2 - 0.5; const rv = Math.min(rad, s.h / 2); const re = E ? (pill ? s.h / 2 : E.r) : null;
      const tx = E && TXT(row); const hit = r.height > s.h + 0.6 || r.width > s.w + 0.6 ? r : null;
      const off = only && ir ? { x: (ir.left + ir.width / 2) - (s.x + s.w / 2), y: (ir.top + ir.height / 2) - (s.y + s.h / 2) } : null;
      const miss = []; const chk = (prop, val, e) => { if (e != null && !near(val, e)) miss.push({ prop, v: +fmt(val), e }); };
      const square = Math.abs(s.w - s.h) < s.h * 0.5;   /* a switch's track is a pill, never a square: only a square icon button is held to width = height */
    chk('h', s.h, E && E.h); if (only && square) chk('w', s.w, E && E.h); chk('r', rv, re); segs.forEach(([, a, z, e, prop]) => chk(prop, z - a, e));
      if (tw && tx) { chk('words', tw.fs, tx.s); if (C.weight !== false) chk('weight', tw.fw, tx.w); }   /* C1's weight is a control's; a tag keeps the size rule (C5) only */ if (hit) chk('hit', hit.height, E && E.hit); if (off) { chk('centre-x', off.x, 0); chk('centre-y', off.y, 0); }
      if (fix) { if (pass < 6 && miss.some((m) => /^(pad-l|pad-r|gap)$/.test(m.prop)) && nudgeBtn(b, miss)) return run(box, pass + 1); if (box.offsetParent) window.__btnFixed[sel] = miss; else delete window.__btnFixed[sel]; }
      else { BTN_MISS[sel] = miss; const fm = box.closest('.fm'); if (fm) fm.classList.toggle('fx-on', miss.length > 0 || fm.hasAttribute('data-fxkeep')); }   /* a card whose today misses nothing shows no twin */
      setG({ W: o.width, H: o.height, square, x: L(s.x), y: T(s.y), w: s.w, h: s.h, rv, re, segs: segs.map(([k, a, z, e]) => ({ k, a: L(a), z: L(z), v: z - a, e })), tw, tx, only, he: E && E.hit, eh: E && E.h,
        hit: hit && { x: L(hit.left), y: T(hit.top), w: hit.width, h: hit.height }, off, miss });
    });
    /* the numbers over the box, each on the lowest line where it touches no other (a 7.5 gap's "7.5 ≠ 10" is wider than the gap it names) */
    const tops = []; if (g) for (const q of g.segs) { if (q.k === 'text' || (g.only && q.k !== 'icon')) continue; const t = fmt(q.v); const x = (q.a + q.z) / 2, w = t.length * 6.3 + 8;
      let lv = 0; while (tops.some((o) => o.lv === lv && Math.abs(o.x - x) < (o.w + w) / 2 + 4)) lv++; tops.push({ ...q, x, w, lv }); }
    const wl = g && g.tw && `Aa ${fmt(g.tw.fs)} · ${g.tw.fw}`; const wm = g && g.tw && g.tx && (!near(g.tw.fs, g.tx.s) || (C.weight !== false && !near(g.tw.fw, g.tx.w))); const ra = g && Math.max(g.rv, 1);
    /* beside the drawing: each part that misses its row, measured → the row's value (padding's two sides on one line) */
    const ML = { h: ['h', 'height'], w: ['h', 'width'], r: ['r', 'corner'], icon: ['icon', 'icon'], gap: ['gap', 'gap'], words: ['dim', 'words'], weight: ['dim', 'weight'], hit: ['hit', 'click area'], 'centre-x': ['icon', 'centre ↔'], 'centre-y': ['icon', 'centre ↕'] };
    const ms = []; if (g && g.miss) { const pl = g.miss.find((m) => m.prop === 'pad-l'), pr = g.miss.find((m) => m.prop === 'pad-r'); for (const m of g.miss) { if (m.prop === 'pad-l' || m.prop === 'pad-r') continue; ms.push([...ML[m.prop], fmt(m.v), fmt(m.e)]); }
      if (pl || pr) ms.unshift(['pad', pl && pr ? 'padding' : pl ? 'padding left' : 'padding right', pl && pr ? `${fmt(pl.v)} / ${fmt(pr.v)}` : fmt((pl || pr).v), fmt((pl || pr).e)]); }
    const list = ms.length ? html`<dl class="bmiss">${ms.map(([k, lab, v2, e2]) => html`<div class=${'k-' + k}><dt><i></i>${lab}</dt><dd><b>${v2}</b><${Icon} name="arrow-right" />${e2}</dd></div>`)}</dl>` : null;
    return html`<div class="bgauge" ref=${ref}>${children}${g && html`<svg class="ov" width=${g.W} height=${g.H} aria-hidden="true">
      ${g.hit && html`<g class="k-hit"><rect class="hit" x=${g.hit.x} y=${g.hit.y} width=${g.hit.w} height=${g.hit.h} rx="4" /></g><${Num} bare x=${g.hit.x + g.hit.w + 6} y=${g.hit.y + g.hit.h - 2} v=${g.hit.h} e=${g.he} kind="hit" anchor="start" />`}
      <${VTick} x=${g.x - 9} a=${g.y} z=${g.y + g.h} kind="h" /><${Num} bare x=${g.x - 15} y=${g.y + g.h / 2 + 3.5} v=${g.h} e=${g.eh} kind="h" anchor="end" />
      ${g.only && g.square && html`<${Tick} a=${g.x} z=${g.x + g.w} y=${g.y + g.h + 9} kind="h" /><${Num} bare x=${g.x + g.w / 2} y=${g.y + g.h + 23} v=${g.w} e=${g.eh} kind="h" />`}
      ${g.segs.map((q) => html`<${Tick} a=${q.a} z=${q.z} y=${g.y - 8} kind=${q.k === 'text' ? 'dim' : q.k} />`)}${tops.map((q) => html`<${Num} bare x=${q.x} y=${g.y - 15 - q.lv * 14} v=${q.v} e=${q.e} kind=${q.k} />`)}
      <g class="k-r"><path class="arc" d=${`M ${g.x + g.w - ra} ${g.y - 1.5} A ${ra} ${ra} 0 0 1 ${g.x + g.w + 1.5} ${g.y + ra}`} /></g><${Num} bare x=${rLab(g.x, g.y, g.w, ra).x} y=${rLab(g.x, g.y, g.w, ra).y} v=${g.rv} e=${g.re} kind="r" anchor="start" />
      ${wl && html`<text class=${'tsz' + (wm ? ' cwarn' : '')} x=${g.x} y=${g.y + g.h + 23}>${wl}</text>`}
      ${g.off && (Math.abs(g.off.x) > 0.5 || Math.abs(g.off.y) > 0.5) && html`<text class="cwarn" x=${g.x + g.w / 2} y=${g.y + g.h + 38} text-anchor="middle">centre ${fmt(g.off.x)}, ${fmt(g.off.y)}</text>`}
    </svg>`}</div>${list}`;
  }
  // a rail (C3, R9): its box, the selected segment inside it and the inset between them; its row is one size up from its segment's, never guessed
  const UP = { XS: 'S', S: 'M', M: 'L' }; const DOWN = { L: 'M', M: 'S', S: 'XS' }; const INSET = { L: 6, M: 4, S: 2 };
  const onKid = (b) => { const kids = [...b.children].filter((k) => k.getClientRects().length && (k.tagName === 'BUTTON' || /^(tab|radio)$/.test(k.getAttribute('role') || ''))); return kids.find((k) => k.getAttribute('aria-pressed') === 'true' || k.getAttribute('aria-selected') === 'true' || k.getAttribute('aria-checked') === 'true' || /(^|\s)(on|cur|active|sel|picked)(\s|$)/.test(k.className)) || kids[0]; };
  function RailGauge({ sel, fix, children }) {
    const ref = useRef(); const [g, setG] = useState(null);
    useLayout(ref, function run(box, pass = 0) { const b = rootOf(box.querySelector(fix ? '[data-bfix]' : '[data-bsel]')); if (!b) return; const k = onKid(b); if (!k) return; const o = box.getBoundingClientRect(); const L = (x) => x - o.left, T = (y) => y - o.top;
      const s = skinRect(b) || boxRect(b); const ks = skinRect(k) || boxRect(k); const fixed = typeof (C.rail || {})[sel] === 'string' ? C.rail[sel] : null; const segRow = fixed ? DOWN[fixed] : ROWS[Math.round(ks.h)] || null; const row = fixed || (segRow ? UP[segRow] : null);   /* a container whose own row is known (the stepper on the field ground, 44 = L) holds its buttons one size down (C3) */ const E = row ? SIZES[row] : null; const ins = row ? INSET[row] : null;
      if (fix && !pass && row && segRow && b.getClientRects().length) { fixRail(b, [...b.children].filter((x) => x.getClientRects().length && (x.tagName === 'BUTTON' || /^(tab|radio)$/.test(x.getAttribute('role') || ''))), row, segRow, ins); return run(box, 1); }
      const rad = parseFloat(s.c.borderTopLeftRadius) || 0; const pill = rad >= s.h / 2 - 0.5; const rv = Math.min(rad, s.h / 2); const kRad = parseFloat(ks.c.borderTopLeftRadius) || 0; const kPill = kRad >= ks.h / 2 - 0.5; const kRv = Math.min(kRad, ks.h / 2);
      const re = E ? (pill ? s.h / 2 : E.r) : null; const ekh = segRow ? SIZES[segRow].h : null; const ekr = segRow ? (kPill ? ks.h / 2 : SIZES[segRow].r) : null;
      const miss = []; const chk = (prop, v, e) => { if (e != null && !near(v, e)) miss.push({ prop, v: +fmt(v), e }); };
      chk('h', s.h, E && E.h); chk('r', rv, re); chk('seg-h', ks.h, ekh); chk('inset-x', ks.x - s.x, ins); chk('inset-y', ks.y - s.y, ins); chk('seg-r', kRv, ekr);
      if (fix) { if (pass < 4 && miss.some((m) => /^inset/.test(m.prop)) && nudgeRail(b, miss)) return run(box, pass + 1); if (box.offsetParent) window.__btnFixed[sel] = miss; else delete window.__btnFixed[sel]; } else { BTN_MISS[sel] = miss; const fm = box.closest('.fm'); if (fm) fm.classList.toggle('fx-on', miss.length > 0 || fm.hasAttribute('data-fxkeep')); }
      setG({ W: o.width, H: o.height, x: L(s.x), y: T(s.y), w: s.w, h: s.h, rv, re, eh: E && E.h, kx: L(ks.x), ky: T(ks.y), kh: ks.h, ekh, ins, miss }); });
    const ML = { h: ['h', 'rail height'], r: ['r', 'rail corner'], 'seg-h': ['h', 'segment height'], 'inset-x': ['pad', 'inset'], 'inset-y': ['pad', 'inset top'], 'seg-r': ['r', 'segment corner'] };
    const list = g && g.miss.length ? html`<dl class="bmiss">${g.miss.map((m) => html`<div class=${'k-' + ML[m.prop][0]}><dt><i></i>${ML[m.prop][1]}</dt><dd><b>${fmt(m.v)}</b><${Icon} name="arrow-right" />${fmt(m.e)}</dd></div>`)}</dl>` : null; const ra = g && Math.max(g.rv, 1);
    /* the rail's height on the left, the segment's (shorter) on the right: two marks of different lengths read as rail and segment without words */
    return html`<div class="bgauge rail" ref=${ref}>${children}${g && html`<svg class="ov" width=${g.W} height=${g.H} aria-hidden="true">
      <${VTick} x=${g.x - 9} a=${g.y} z=${g.y + g.h} kind="h" /><${Num} bare x=${g.x - 15} y=${g.y + g.h / 2 + 3.5} v=${g.h} e=${g.eh} kind="h" anchor="end" />
      <${Tick} a=${g.x} z=${g.kx} y=${g.y - 8} kind="pad" /><${Num} bare x=${(g.x + g.kx) / 2} y=${g.y - 15} v=${g.kx - g.x} e=${g.ins} kind="pad" />
      <${VTick} x=${g.x + g.w + 30} a=${g.ky} z=${g.ky + g.kh} kind="h" /><${Num} bare x=${g.x + g.w + 36} y=${g.ky + g.kh / 2 + 3.5} v=${g.kh} e=${g.ekh} kind="h" anchor="start" />
      <g class="k-r"><path class="arc" d=${`M ${g.x + g.w - ra} ${g.y - 1.5} A ${ra} ${ra} 0 0 1 ${g.x + g.w + 1.5} ${g.y + ra}`} /></g><${Num} bare x=${rLab(g.x, g.y, g.w, ra).x} y=${rLab(g.x, g.y, g.w, ra).y} v=${g.rv} e=${g.re} kind="r" anchor="start" />
    </svg>`}</div>${list}`;
  }
  // a field (C0, C1 L, C13): the box it draws against 44 (none for a box of many lines), corner 11, 14 from its edge to the words or the leading icon, 10 from
  // that icon to the words, words 13 (C5); the misses go to the same list the ledger check reads (Step 4 group 4, 2026-10-08 23:40 EDT)
  function FieldBox({ sel, v, multi, fix, children }) {
    const ref = useRef(); const [g, setG] = useState(null); const E = SIZES.L;
    useLayout(ref, function run(box, pass = 0) { const f = rootOf(box.querySelector(fix ? '[data-bfix]' : '[data-bsel]')); if (!f) return; if (fix && !pass) fixField(f, multi); if (C.width && C.width[sel] && v && v.w) f.style.width = v.w + 'px';
      const o = box.getBoundingClientRect(); const L = (x) => x - o.left, T = (y) => y - o.top; const s = skinRect(f) || boxRect(f); const vis = (x) => x && x.getClientRects().length;
      const inp = f.matches('input, textarea') ? f : [...f.querySelectorAll('input, textarea')].find(vis); const ic = inp && getComputedStyle(inp);
      const tl = inp ? inp.getBoundingClientRect().left + parseFloat(ic.borderLeftWidth) + parseFloat(ic.paddingLeft) : null;
      /* the leading content: the leftmost icon or label before the words (the build name's "Build 1" prefix, a glass) */ const lead = [...f.querySelectorAll('svg, span, b, i, em, label')].filter((x) => vis(x) && !x.closest('button') && tl != null && x.getBoundingClientRect().width > 2 && x.getBoundingClientRect().right <= tl + 1 && (x.tagName.toLowerCase() === 'svg' || (x.textContent || '').trim())).sort((p, q) => p.getBoundingClientRect().left - q.getBoundingClientRect().left)[0]; const lr = lead && lead.getBoundingClientRect();
      const fs = ic ? parseFloat(ic.fontSize) : null; const rad = Math.min(parseFloat(s.c.borderTopLeftRadius) || 0, s.h / 2); const edge = lr ? lr.left : tl;
      const miss = []; const chk = (prop, val, e) => { if (e != null && val != null && !near(val, e)) miss.push({ prop, v: +fmt(val), e }); };
      if (!multi) chk('fh', s.h, E.h); chk('fr', rad, E.r); if (edge != null) chk('fpad', edge - s.x, E.pad); if (lr && tl != null) chk('fgap', tl - lr.right, E.gap); if (fs) chk('fwords', fs, 13);
      if (fix) { if (pass < 3 && miss.some((m) => /^(fpad|fgap)$/.test(m.prop)) && nudgeField(f, miss, lead, inp)) return run(box, pass + 1); if (box.offsetParent) window.__btnFixed[sel] = miss; else delete window.__btnFixed[sel]; } else { BTN_MISS[sel] = miss; const fm = box.closest('.fm'); if (fm) fm.classList.toggle('fx-on', miss.length > 0 || fm.hasAttribute('data-fxkeep')); }
      setG({ W: o.width, H: o.height, x: L(s.x), y: T(s.y), w: s.w, h: s.h, rad, pad: edge != null ? { a: L(s.x), z: L(edge), v: edge - s.x } : null, gap: lr && tl != null ? { a: L(lr.right), z: L(tl), v: tl - lr.right } : null, fs, tx: tl != null ? L(tl) : L(s.x), miss }); });
    const ML = { fh: ['h', 'height'], fr: ['r', 'corner'], fpad: ['pad', 'padding'], fgap: ['gap', 'gap'], fwords: ['dim', 'words'] };
    const list = g && g.miss.length ? html`<dl class="bmiss">${g.miss.map((m) => html`<div class=${'k-' + ML[m.prop][0]}><dt><i></i>${ML[m.prop][1]}</dt><dd><b>${fmt(m.v)}</b><${Icon} name="arrow-right" />${fmt(m.e)}</dd></div>`)}</dl>` : null; const ra = g && Math.max(g.rad, 1);
    return html`<div class="bgauge field" ref=${ref}>${children}${g && html`<svg class="ov" width=${g.W} height=${g.H} aria-hidden="true">
      <${VTick} x=${g.x - 9} a=${g.y} z=${g.y + g.h} kind="h" /><${Num} bare x=${g.x - 15} y=${g.y + g.h / 2 + 3.5} v=${g.h} e=${multi ? null : 44} kind="h" anchor="end" />
      ${g.pad && html`<${Tick} a=${g.pad.a} z=${g.pad.z} y=${g.y - 8} kind="pad" /><${Num} bare x=${(g.pad.a + g.pad.z) / 2} y=${g.y - 15} v=${g.pad.v} e=${14} kind="pad" />`}
      ${g.gap && html`<${Tick} a=${g.gap.a} z=${g.gap.z} y=${g.y - 8} kind="gap" /><${Num} bare x=${(g.gap.a + g.gap.z) / 2} y=${g.y - 15} v=${g.gap.v} e=${10} kind="gap" />`}
      <g class="k-r"><path class="arc" d=${`M ${g.x + g.w - ra} ${g.y - 1.5} A ${ra} ${ra} 0 0 1 ${g.x + g.w + 1.5} ${g.y + ra}`} /></g><${Num} bare x=${rLab(g.x, g.y, g.w, ra).x} y=${rLab(g.x, g.y, g.w, ra).y} v=${g.rad} e=${11} kind="r" anchor="start" />
      ${g.fs && html`<text class=${'tsz' + (near(g.fs, 13) ? '' : ' cwarn')} x=${g.tx} y=${g.y + g.h + 23}>Aa ${fmt(g.fs)}</text>`}</svg>`}</div>${list}`;
  }
  // a picker drawn whole (no rule sizes it yet): its parts measured live and listed beside it
  function WholeGauge({ sel, v, fix, children }) {
    const ref = useRef(); const [g, setG] = useState(null);
    useLayout(ref, (box) => { const w = rootOf(box.querySelector(fix ? '[data-bfix]' : '[data-bsel]')); if (!w) return; if (!fix) BTN_MISS[sel] = [];
      /* 2026-10-09 13:09 EDT: an open question drawn as a proposal (his 11:49 EDT "draw the corrected proposed state"): the twin takes C.propose's values, then its parts are measured as today's are */
      if (fix) for (const [q, css] of ((C.propose || {})[sel] || {}).set || []) for (const e of (q === ':scope' ? [w] : w.querySelectorAll(q))) for (const [k, x] of Object.entries(css)) imp(e, k, x); if (C.width && C.width[sel] && v && v.w) w.style.width = v.w + 'px'; if (C.size && C.size[sel] && v) { w.style.width = v.w + 'px'; w.style.height = v.h + 'px'; }   /* a bar its table row stretches: the clone takes the row's height */
      const parts = (C.whole[sel] || []).map(([lab, q]) => { const e = q === ':scope' ? w : w.querySelector(q); if (!e || !e.getClientRects().length) return null; const k = boxRect(e);   /* a part is its own box (the square and the hue bar paint a gradient, their thumb is the only flat fill inside) */ const c = getComputedStyle(e); const words = (e.innerText || '').trim() && !e.querySelector('button, input') ? `${fmt(parseFloat(c.fontSize))} · ${c.fontWeight}` : ''; return { lab, w: fmt(k.w), h: fmt(k.h), r: fmt(parseFloat(k.c.borderTopLeftRadius) || 0), words }; }).filter(Boolean);
      setG((o) => (JSON.stringify(o) === JSON.stringify(parts) ? o : parts)); });
    return html`<div class="bgauge whole" ref=${ref}>${children}</div>${g && html`<dl class="bparts">${g.map((p) => html`<div><dt>${p.lab}</dt><dd><b>${p.w} × ${p.h}</b> · corner ${p.r}${p.words ? ` · words ${p.words}` : ''}</dd></div>`)}</dl>`}`;
  }
  // a proposed name, read off the board's own inks at rest and under the mouse (C9 · C11): fill = a solid accent; wash = a translucent accent fill with an
  // accent outline; tint = an accent outline on a dark fill; paint = neutral. --ghost: no fill at rest or on hover · --borderless: no outline at rest or on
  // hover · --quiet: bare at rest, something drawn on hover · --reveal-right/-left: opens wider on hover, its words showing on that side. The colour value is the accent any state shows.
  const HUE = /(?:^|[\s≈])(ok|danger|del|staged|warn|info|r-[a-z]+)\b/;
  const SOLID = /^(ok|danger|del|staged|warn|info|r-[a-z]+)(-ink|-edge)?$/;   // a solid accent token, never a mix of one; del is the danger family's fill
  const hueOf = (c) => { if (!c || alphaOf(c) < 0.01) return null; const m = HUE.exec(String(inkName(c) || '')); return m ? (m[1] === 'del' ? 'danger' : m[1].replace(/^r-/, '')) : null; };   /* a realm token names its realm (C11's tint-<realm>) */
  const edgeCol = (k) => { if (!k) return null; const bc = (k.border || '').replace(/^[\d.]+px \w+ /, ''); if (parseFloat(k.border) > 0 && !/none/.test(k.border) && alphaOf(bc) > 0.01) return bc; const p = shadowParts(k.ring).find((q) => q.inset && q.spread > 0 && alphaOf(q.raw) > 0.01); return p ? p.raw : null; };   /* a transparent ring draws nothing */
  const fillCol = (k) => (k && alphaOf(k.bg) > 0.01 ? k.bg : null);
  function proposedName(v, row, shape) {
    const R = v.rest || {}, H = v.hover || {}; const rf = fillCol(R.skin), hf = fillCol(H.skin), re = edgeCol(R.skin), he = edgeCol(H.skin);
    const hue = hueOf(H.color) || hueOf(he) || hueOf(hf) || hueOf(R.color) || hueOf(re) || hueOf(rf);
    const style = rf && alphaOf(rf) > 0.95 && SOLID.test(String(inkName(rf))) ? 'fill' : rf && hueOf(rf) && hueOf(re) ? 'wash' : re && hueOf(re) ? 'tint' : 'paint';
    const fl = []; if (style !== 'fill' && !rf && !hf) fl.push('ghost'); if (style !== 'fill' && !re && !he) fl.push('borderless'); if (!rf && !re && (hf || he)) fl.push('quiet'); if (H.w && R.w && H.w - R.w > 0.6) fl.push(v.gap != null && v.gap > -(v.icon || 0) ? 'reveal-right' : 'reveal-left');   /* opens wider on hover: its words show on the side they sit */
    return `${C.type}-${row || '?'}-${shape}.${style}${hue ? '-' + hue : ''}${fl.map((f) => '--' + f).join('')}`;
  }
  const ROWS = { 44: 'L', 32: 'M', 24: 'S', 20: 'XS' };
  // not drawn here, and why: a member already on this page, the same button read twice, a row or a counted pill (their own groups)
  const EXCLUDE = C.exclude || {};
  (window.__onboard || (window.__onboard = {}))[C.group] = { ex: EXCLUDE, wide: WIDE, sweepEx: C.sweepEx || {} };
  // names already decided, with the ledger row that carries the board change
  const DECIDED = C.decided || {};
  // where on the board it lives, read off its chain: a drawer or pop-up by its body, else its gate
  const usedIn = (v) => { const p = v.path || ''; return /aside[^ >]*\.b1(\.|\[| |$)/.test(p) ? 'Post' : /aside\.drawer\.open\.wide|aside\.drawer\.wide/.test(p) && !/b1/.test(p) ? 'New build' : /b3-pc/.test(p) || v.gate === 'b3-pc' ? 'problem pop-up' : /b4-exp/.test(p) ? 'Export' : /b3-nb/.test(p) ? 'New build' : /pb-col|pb-dfld|acx/.test(p) ? 'Post' : /b3-sd/.test(p) ? 'selection bar' : ({ 'c-new-build': 'New build', 'c-export': 'Export', 'c-admin': 'Admin', 'c-manifest': 'Manifest', 'c-compare': 'Compare', 'c-repairs': 'Repairs', 'c-history': 'History', 'c-queue': 'Queue', 'c-broadcast': 'Broadcast' })[v.gate] || v.gate; };
  // each control in its states, drawn standing still: a rail with each of its first three segments selected and the pointer on an unselected one; a switch or
  // a pressable chip off, on and under the pointer. The board's own markup in each, its state set the way the board sets it.
  function States({ m0, rail }) {
    const ref = useRef();
    useLayout(ref, (box) => { box.querySelectorAll('[data-fxst]').forEach((w) => {   /* its own attribute: a board gate carries data-st, and a copy of its chain would answer [data-st] */ if (w.dataset.done) return; const b = rootOf(w); if (!b) return; w.dataset.done = '1'; const st = w.dataset.fxst;
      if (rail) { const ks = kidsOf(b); if (st.startsWith('sel')) { const k = ks[+st.slice(3)]; if (k) pick(b, k, marks(b)); else w.closest('.st-c').style.display = 'none'; } else { const off = ks.find((k) => !isOn(k)); if (off) hov(off, w); } }
      else if (st === 'off') flip(b, false); else if (st === 'on') flip(b, true); else { flip(b, false); hov(b, w); } }); });
    const cells = rail ? [['sel0', 'selected · 1st'], ['sel1', 'selected · 2nd'], ['sel2', 'selected · 3rd'], ['hov', 'hover · unselected']] : [['off', 'off'], ['on', 'on'], ['hov', 'hover · off']];
    return html`<div class="st-strip" ref=${ref}>${cells.map(([k, t]) => html`<figure class="st-c"><figcaption>${t}</figcaption><div class="st-b" data-fxst=${k} inert><${Clone} path=${m0.v.path} markup=${m0.v.html} stub=${STUB[m0.sel]} /></div></figure>`)}</div>`;
  }
  /* the live copy answers a click the way the board does: a rail moves its selection, a switch or chip flips */
  const liveClick = (e) => { const w = e.target.closest('[data-bsel]'); if (!w) return; const b = rootOf(w); if (!b || !b.contains(e.target)) return; const ks = kidsOf(b); const t = ks.find((k) => k.contains(e.target)); if (ks.length > 1 && t) pick(b, t, marks(b)); else flip(b); };
  function OnBoard() {
    const [, set] = useState(0); useEffect(() => { domReady.then(() => set(1)); }, []); const D = DOM.g[C.group] || {};
    const items = Object.entries(D).filter(([sel]) => !EXCLUDE[sel]).map(([sel, v]) => { const k = (!(C.box || {})[sel] && v.skin) || { w: v.w, h: v.h, r: v.radius }; const sq = Math.abs(k.w - k.h) < 0.6; const pill = parseFloat(k.r) >= k.h / 2 - 0.5;
      const shape = sq && v.icon ? 'icon' : pill ? 'pill' : 'box'; const dec = DECIDED[sel]; const moved = C.rowmap && !(C.rowkeep || {})[sel] ? C.rowmap[Math.round(k.h)] : null; const row = dec ? dec[1] : (C.rowOf || {})[sel] || moved || ROWS[Math.round(k.h)] || null;   /* a height he has moved to a row (Q3) is measured against that row */
      const isRail = Boolean(C.rail && C.rail[sel]); const railRow = isRail && typeof C.rail[sel] === 'string' ? C.rail[sel] : isRail && v.kidH ? UP[ROWS[Math.round(v.kidH)]] || null : null; const isField = Boolean(C.field && C.field[sel]); const isWhole = Boolean(C.whole && C.whole[sel]);
    const nm = (C.names || {})[sel] || (dec ? dec[0] : isRail ? `button-${railRow || '?'}-rail` : proposedName(v, row, shape));   /* R9: button-<size>-rail; its style slot waits until rails are measured against the styles */ const filled = !dec && /\.(tint|paint)/.test(nm) && Boolean(hueOf(fillCol(v.rest && v.rest.skin)));   /* the accent already in its fill at rest: C9's tint and paint are plain there, and no flag says otherwise yet */
    return { sel, v, row: isRail ? railRow : row, h: Math.round(k.h), name: nm, decided: Boolean(dec), filled: filled && !isRail && !isField && !isWhole, rail: isRail, field: isField, whole: isWhole, multi: isField && C.field[sel] === 'multi' }; });
    const blocks = []; for (const it of items) { const bk = it.field ? 'field' : it.whole ? 'whole' : it.rail ? 'rail' : it.row || String(it.h); let B = blocks.find((x) => x.k === bk); if (!B) blocks.push((B = { k: bk, row: it.rail || it.field || it.whole ? null : it.row, h: it.h, rail: it.rail, field: it.field, whole: it.whole, members: [] })); const sig = [it.h, it.v.radius, it.v.padL, it.v.padR, it.v.icon, it.v.gap, it.v.words].join('|'); const key = /-icon\./.test(it.name) ? '' : sig; let M = B.members.find((m) => m.name === it.name && m.key === key); if (!M) B.members.push((M = { name: it.name, sig, key, decided: it.decided, filled: it.filled, list: [] })); M.list.push(it); }   /* an icon button with one name is one card, every board use beside it (his "why is the trashbin icon stated twice?"); boxes with different words keep a card each */   /* siblings share the name AND every measured part, so one gauge speaks for them all */
    for (const B of blocks) if (B.whole) B.members.sort((a, z) => a.name.localeCompare(z.name));   /* a kind's members side by side */ const RO = ['L', 'M', 'S', 'XS']; const ord = (B) => (B.field ? -3 : B.whole ? -2 : B.rail ? -1 : B.row ? RO.indexOf(B.row) : 110 - B.h);   /* rails first */ blocks.sort((a, z) => ord(a) - ord(z));
    return html`<${Sec} id=${C.sec} title=${C.title} tag="Proposed" kind="diff" aside=${C.q ? html`<${Tag} kind="diff">${C.q}<//>` : null}>
      <div class="bsec">${C.table ? html`<h3 class="subh bsub"><b>Frames</b><span>${C.table.note}</span></h3><table class="ftab"><thead><tr><th>surface</th><th>size</th><th>corner</th><th>fill</th>${C.table.propose ? html`<th class="fx-th">proposed</th>` : null}</tr></thead><tbody>${C.table.rows.map(([lab, sel]) => { const v = D[sel]; return v ? html`<tr><td>${lab}</td><td>${fmt(v.w)} × ${fmt(v.h)}</td><td>${parseFloat(v.radius) || 0}</td><td>${inkName((v.rest || {}).bg) || '—'}</td>${C.table.propose ? html`<td class="fx-td">${C.table.propose[sel] || '—'}</td>` : null}</tr>${v.parts ? html`<tr class="fpart"><td></td><td colspan="3">${v.parts.map((p) => html`<span><i>${p.lab}</i> ${p.words || `${fmt(p.w)} × ${fmt(p.h)}${/^0 0 0 0$/.test(p.pad) ? '' : ` · padding ${p.pad}`}`}</span>`)}</td></tr>` : null}` : html`<tr><td>${lab}</td><td colspan="3">not reached on the board</td></tr>`; })}</tbody></table>` : null}${blocks.map((B) => html`<h3 class="subh bsub">${B.field ? html`<b>Fields</b><span>an L control: 44, corner 11, 14 to the words, words 13 (C0, C1, C13)</span>` : B.whole ? html`<b>${(C.wholeHead || ['Pickers'])[0]}</b><span>${(C.wholeHead || [, 'drawn whole as the board draws them, their parts measured; no rule sizes them yet'])[1]}</span>` : B.rail ? html`<b>Rails</b><span>one size up from their segments, half the step around (C3)</span>` : B.row ? html`<b>${B.row}</b><span>${SIZES[B.row].h}</span>` : html`<b>${B.h}</b><span>off the size table</span>${[28, 40].includes(B.h) ? html`<${Tag} kind="diff">${C.offq || 'Q3'}<//>` : (C.offTags || {})[B.h] ? html`<${Tag} kind="diff">${C.offTags[B.h]}<//>` : null}`}</h3>${C.try700 && B.row === 'L' ? html`<div class="w7"><p class="w7-n">his ask: “can we try text weight 700 for the 44px buttons?” C1 says 600; each L button with words, drawn at L, at both weights</p>${[600, 700].map((wt) => html`<div class="w7-r"><b>${wt === 600 ? '600 · C1 today' : '700 · trying'}</b><div class="w7-s">${B.members.filter((M) => (M.list[0].v.text || '').trim()).map((M) => html`<div class=${'w7-c w' + wt}><${Clone} path=${M.list[0].v.path} markup=${fixMarkup(M.list[0].sel, M.list[0].v.html)} stub=${STUB[M.list[0].sel]} /></div>`)}</div></div>`)}</div>` : null}
        <div class="fmembers">${B.members.map((M) => { const [m0, ...sib] = M.list; const G = B.rail ? RailGauge : B.field ? FieldBox : B.whole ? WholeGauge : BtnGauge; const P = (C.propose || {})[m0.sel]; const PR = !B.row && !B.rail && !B.field && !B.whole ? (C.proposeRow || {})[B.h] : null;   /* an off-table height drawn on the row proposed for it (an open question) */ const fixable = B.whole ? Boolean(P) : !(C.wrap || {})[m0.sel] && (B.rail || B.field || Boolean(SIZES[B.row]) || Boolean(PR));   /* the corrected twin: on a size row, a rail or a field (a picker drawn whole has no rule yet) */ return html`<div class=${'fm bm' + ((C.full || {})[m0.sel] ? ' full' : '') + ((B.whole && P) || PR ? ' fx-on' : '')} data-fxkeep=${(B.whole && P) || PR ? '' : undefined} data-bname=${M.name}><div class="fm-h"><${Name}>${M.name}<//><span class="fm-use">${sib.length ? '' : usedIn(m0.v)}</span>${M.decided ? html`<${Tag} kind="ok">decided<//>` : null}${C.qtag && C.qtag[m0.sel] ? html`<${Tag} kind="diff">${C.qtag[m0.sel]}<//>` : null}${M.filled ? html`<${Tag} kind="diff">filled at rest<//>` : null}${C.live && /\sdisabled|aria-disabled="true"/.test(m0.v.html || '') ? html`<${Tag} kind="diff">disabled where the board was read · drawn enabled<//>` : null}${sib.length ? html`<span class="fm-use">${[m0, ...sib].map((x) => usedIn(x.v)).join(' · ')}</span>` : null}</div>${(C.calls || {})[m0.sel] && L.CallSlot ? html`<div class="callrow in-card">${C.calls[m0.sel].map((id) => html`<${L.CallSlot} id=${id} />`)}</div>` : null}
          <div class="stage wide">${fixable ? html`<div class="fx"><span class="fx-cap">${P ? `proposed · ${P.q}` : PR ? `proposed · ${(C.offTags || {})[B.h] || ''} · ${PR} ${SIZES[PR].h}` : 'proposed'}</span>${P ? html`<p class="fx-note">${P.note}</p>` : null}<div class="fx-row"><${G} fix sel=${m0.sel} row=${B.row || PR} v=${m0.v} multi=${m0.multi}><div data-bfix=${m0.sel}><${Clone} path=${m0.v.path} markup=${fixMarkup(m0.sel, m0.v.html)} stub=${STUB[m0.sel]} /></div><//></div></div>` : null}<div class="fx-was">${fixable ? html`<span class="fx-cap">today${C.states ? ' · click it' : ''}</span>` : null}<div class="fx-row" onClick=${C.states ? liveClick : null}>${((Wr, g) => (Wr ? html`<${Wr}>${g}<//>` : g))((C.wrap || {})[m0.sel], html`<${G} sel=${m0.sel} row=${B.row} v=${m0.v} multi=${m0.multi}><div data-bsel=${m0.sel}><${Clone} path=${m0.v.path} markup=${live(m0.v.html)} stub=${STUB[m0.sel]} /></div><//>`)}${sib.map((x) => html`<div class="bsib" style=${C.width && C.width[x.sel] && x.v.w ? `width:${x.v.w}px` : null} data-bsel=${x.sel} title=${`${usedIn(x.v)} · ${x.v.label || x.v.text}`}><${Clone} path=${x.v.path} markup=${live(x.v.html)} stub=${STUB[x.sel]} /></div>`)}</div></div>${C.states && !B.whole ? html`<${States} m0=${m0} rail=${B.rail} />` : null}</div></div>`; })}</div>`)}</div><//>`;
  }
  return { Section: OnBoard, Clone, scopeRule };
}
// group 1's settings: not drawn here and why · names already decided (with their ledger row) · a :has() context to stand in · a width from the container
const BUTTONS = { group: 'buttons', sec: 'onboard', title: 'On the board', type: 'button',
  // his Q3 (2026-10-08 19:43 EDT): "28->32. 40->44. except the selection bar's gunsmith code" (that one has its own section, 24 or 32)
  rowmap: { 28: 'M', 40: 'L' },   /* the selection bar's code too: his "32." (2026-10-08 19:58 EDT) */
  exclude: { 'button.wg-fbtn': 'Collapse, drawn under Flags', 'button.b3-btn2.cx-clr': 'the same button as Clear table', 'button.f-more': 'a row (data display)', 'button.f-st': 'a row (data display)', 'button.cx-dcb': 'a row (data display)', 'button.b3-rv': 'a pill with a count (chips)', 'button.wg-code': 'the gunsmith code: a component, not a single button; its own proposal later (his twins note, 2026-10-10)' },
  decided: { 'button.wg-sort': ['button-S-icon.paint-realm--ghost--borderless', 'S', 'sort'], 'button.sortbtn': ['button-S-icon.paint-realm--ghost--borderless', 'S', 'sort'], 'button.acx-ib': ['button-M-icon.tint--quiet', 'M', 'post'], 'button.pb-dbtn': ['button-M-icon.tint--quiet', 'M', 'post'], 'button.acx-new': ['button-L-icon.tint-realm', 'L', 'shuffle'] },
  stub: { 'button.b3-btn2.go:not(.sm):not(.dang)': ['drawer', 'b3-nb'] },
  // 2026-10-09 16:03 EDT: the decided rows' look on their corrected copies: shuffle takes tint's accent outline (row shuffle); sort and copy-the-code are --ghost--borderless (rows sort, copycode)
  fixCss: { 'button.acx-new': { 'box-shadow': 'inset 0 0 0 1px color-mix(in srgb, var(--r-broadcast) 55%, #0B0F12)' }, 'button.wg-sort': { background: 'transparent', 'box-shadow': 'none', 'border-color': 'transparent' }, 'button.sortbtn': { background: 'transparent', 'box-shadow': 'none', 'border-color': 'transparent' }, 'button.f-cp': { background: 'transparent', 'box-shadow': 'none', 'border-color': 'transparent' } },
  wide: { 'button.sortbtn': 'fills its table cell' },
  // 2026-10-10 19:07 EDT, his twins note (calls/twins): the × opens left · Export's Pick and its two Downloads go to L · Stage this MP build → Stage build with an icon · 700 tried on L
  // · the Announcement sort takes the Weapon sort's treatment, both -realm (his Q6 note: "-realm … the same logic of us using -cat"). The gunsmith code is set aside above.
  names: { 'button.x': 'button-M-icon.paint--ghost--reveal-left', 'button.as-btn.b3-sd-code': 'button-M-box.paint--quiet', 'button.b3-undo': 'button-M-box.paint-realm' }, reveal: { 'button.x': 'left' },
  rowOf: { 'button.b3-btn2.sm.stage': 'L', 'button.b3-btn2.sm.go @^Download': 'L' },
  markup: { 'button.b3-btn2.go:not(.sm):not(.dang)': [['>Stage this MP build<', '><svg class="ic" aria-hidden="true"><use href="#i-plus"></use></svg>Stage build<']] },
  try700: false,   /* 2026-10-10 21:13 EDT: decided, his "L buttons, yeah let's use 700 weight" (C1) */
  // 2026-10-10 21:13 EDT, his 21:02 review: the selection bar's code is paint--quiet (the board capture read its hover as unchanged, so the namer could not see it); Undo takes History's colour
  // ("give it .paint-realm for the history realm"); a board button that is disabled where it was read is drawn enabled (his "how im supposed to judge … drawn in disabled state")
  live: true };
export function makeButtons(L) { const S = makeOnBoard(L, BUTTONS); return { OnBoard: S.Section, Clone: S.Clone, scopeRule: S.scopeRule }; }
