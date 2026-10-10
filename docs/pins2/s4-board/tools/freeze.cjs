// Session 4 · the Standard board's samples, copied from Board 4: Collective instead of drawn by hand. For each place, the real element's
// subtree is cloned with its computed style written inline (inherited properties only where they change, box properties always on the
// tags a browser styles by default), its ::before/::after turned into real spans, and its <use> icons resolved to paths, so the copy
// renders exactly like Board 4 with none of Board 4's stylesheets. A family's settings reach the copy through CSS variables: each mapped
// property is written as var(--name, <Board 4's value>), so a sample with no settings applied IS Board 4.
// Why: Harkirat, 2026-10-02 11:37 EDT — "how do i pick a standardization from a choice that's literally showing the incorrect designs".
// Spec: [{ id, gate, sel | text, nth, up, hover: 'selector inside the root' | true, vars: [{ sel, prop, name }], addLine: true }]
// click + expect: after the Try button, click `click` (inside the gate) until `expect` has height — e.g. unfold the selection list,
// whose rows sit in a 1px folded box at rest, so a copy taken folded measures the wrong place (Ex-selbar and Dsw-selbar, 2026-10-02).
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/freeze.cjs <spec.json> <out.json> <cropdir>
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const [specF, outF, cropDir] = process.argv.slice(2); const SPEC = JSON.parse(fs.readFileSync(specF, 'utf8'));
(async () => {
  const { b, p } = await W.open(); await W.sleep(900); fs.mkdirSync(cropDir, { recursive: true });
  // copy the resting frame: Board 4's glows and pulses would otherwise be frozen mid-animation
  await p.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' }); await W.sleep(200);
  const cdp = await p.target().createCDPSession(); await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); let hoverNode = 0;
  const out = fs.existsSync(outF) ? JSON.parse(fs.readFileSync(outF, 'utf8')) : {};
  for (const s of SPEC) {
    if (s.state) { await W.setState(p, s.gate, s.state); await W.sleep(700); }
    if (s.pop) { const pop = W.POPS.find((x) => x.label === s.pop); if (pop) { await W.openPop(p, pop).catch(() => {}); await W.sleep(600); } }
    if (s.try) { await p.evaluate((s) => { const bt = [...document.querySelectorAll(`#${s.gate} .b4-try button`)].find((x) => x.textContent.trim() === s.try); if (bt) bt.click(); }, s); await W.sleep(900); }
    if (s.click) { for (let k = 0; k < 2; k++) { const open = await p.evaluate((s) => { const g = document.getElementById(s.gate); const e = s.expect && g && g.querySelector(s.expect); return !!e && e.getBoundingClientRect().height > 2; }, s); if (open) break; await p.evaluate((s) => { const e = document.querySelector('#' + s.gate + ' ' + s.click); if (e) e.click(); }, s); await W.sleep(800); } }
    const ok = await p.evaluate((s) => {
      const root = document.getElementById(s.gate) || document; let el = null;
      if (s.sel) el = [...root.querySelectorAll(s.sel)].filter((x) => !s.contains || (x.textContent || '').toLowerCase().includes(s.contains.toLowerCase()))[s.nth || 0] || null;
      else { const want = s.text.toLowerCase(); let n = s.nth || 0; for (const e of root.querySelectorAll('*')) { const own = [...e.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent).join('').replace(/\s+/g, ' ').trim().toLowerCase(); if (own && own.startsWith(want) && e.getBoundingClientRect().width > 1) { if (n-- <= 0) { el = e; break; } } } }
      if (!el) return false;
      for (let i = 0; i < (s.up || 0) && el.parentElement; i++) el = el.parentElement;
      document.querySelectorAll('[data-fz]').forEach((x) => x.removeAttribute('data-fz')); el.setAttribute('data-fz', 'root');
      if (s.hover && s.hover !== true) { const h = el.querySelector(s.hover); if (h) h.setAttribute('data-fz', 'hover'); } else if (s.hover) el.setAttribute('data-fz', 'root hover');
      el.scrollIntoView({ block: 'center' }); return true;
    }, s);
    if (!ok) { console.log(`${s.id}: NOT FOUND`); continue; }
    if (s.hover) { const { root } = await cdp.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-fz~="hover"]' }); if (nodeId) { await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] }); hoverNode = nodeId; } await W.sleep(200); }
    const res = await p.evaluate((s) => {
      const root = document.querySelector('[data-fz~="root"]');
      const INH = ['color', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textTransform', 'textAlign', 'whiteSpace', 'visibility', 'fontVariantNumeric', 'fontFeatureSettings', 'wordSpacing', 'textShadow', 'cursor', 'fill', 'stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'listStyleType', 'textWrap', 'textUnderlineOffset'];
      const BOX = ['display', 'position', 'top', 'right', 'bottom', 'left', 'zIndex', 'boxSizing', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
        'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
        'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'boxShadow', 'outlineStyle', 'outlineWidth', 'outlineColor', 'outlineOffset', 'opacity', 'transform', 'overflow', 'textOverflow', 'verticalAlign', 'textDecorationLine', 'textDecorationColor',
        'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignContent', 'alignSelf', 'justifySelf', 'flexGrow', 'flexShrink', 'flexBasis', 'order', 'gap', 'rowGap', 'columnGap',
        'gridTemplateColumns', 'gridTemplateRows', 'gridColumn', 'gridRow', 'gridAutoFlow', 'placeItems', 'aspectRatio', 'objectFit', 'filter', 'mixBlendMode', 'isolation', 'clipPath', 'maskImage', 'transformOrigin', 'tableLayout', 'borderCollapse', 'borderSpacing', 'webkitLineClamp', 'webkitBoxOrient'];
      const kebab = (k) => (k.startsWith('webkit') ? '-' : '') + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      const UA = /^(BUTTON|INPUT|TEXTAREA|SELECT|H[1-6]|P|UL|OL|LI|FIGURE|SMALL|B|STRONG|EM|I|A|TABLE|TH|TD|TR|THEAD|TBODY|FIELDSET|LEGEND|HR|MARK|CODE|PRE|TIME|LABEL|DL|DD|DT|BLOCKQUOTE|SUMMARY|DETAILS|OUTPUT|IMG|SVG)$/i;
      const INITIAL = { position: 'static', top: 'auto', right: 'auto', bottom: 'auto', left: 'auto', zIndex: 'auto', minWidth: 'auto', maxWidth: 'none', minHeight: 'auto', maxHeight: 'none', opacity: '1', transform: 'none', overflow: 'visible', textOverflow: 'clip', verticalAlign: 'baseline', textDecorationLine: 'none', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'normal', alignItems: 'normal', alignContent: 'normal', alignSelf: 'auto', justifySelf: 'auto', flexGrow: '0', flexShrink: '1', flexBasis: 'auto', order: '0', gap: 'normal', rowGap: 'normal', columnGap: 'normal', gridTemplateColumns: 'none', gridTemplateRows: 'none', gridColumn: 'auto', gridRow: 'auto', gridAutoFlow: 'row', placeItems: 'normal', aspectRatio: 'auto', objectFit: 'fill', filter: 'none', mixBlendMode: 'normal', isolation: 'auto', clipPath: 'none', maskImage: 'none', backgroundImage: 'none', backgroundColor: 'rgba(0, 0, 0, 0)', boxShadow: 'none', outlineStyle: 'none', backgroundSize: 'auto', backgroundPosition: '0% 0%', backgroundRepeat: 'repeat', tableLayout: 'auto', borderCollapse: 'separate', borderSpacing: '0px 0px', transformOrigin: '', webkitLineClamp: 'none', webkitBoxOrient: 'horizontal' };
      const pvar = new Map(); (s.vars || []).filter((v) => /::(after|before)$/.test(v.sel)).forEach((v) => { const [sel, ps] = v.sel.split('::'); const nodes = sel === ':root' ? [root] : [...root.querySelectorAll(sel)].concat(root.matches(sel) ? [root] : []); nodes.forEach((n) => { const m = pvar.get(n) || {}; (m[ps] = m[ps] || {})[v.prop] = v.name; pvar.set(n, m); }); });
      const vmap = new Map(); (s.vars || []).filter((v) => !/::(after|before)$/.test(v.sel)).forEach((v) => { const nodes = v.sel === ':root' ? [root] : [...root.querySelectorAll(v.sel)]; if (v.sel !== ':root' && root.matches(v.sel)) nodes.unshift(root); nodes.forEach((n) => { const m = vmap.get(n) || {}; m[v.prop] = v.name; vmap.set(n, m); }); });
      const style = (n, cs, pcs, isRoot, fixed) => {
        const decl = []; const vm = vmap.get(n) || {};
        const put = (k, val) => { const kk = kebab(k); decl.push(vm[k] ? `${kk}:var(${vm[k]},${val})` : `${kk}:${val}`); };
        const ua = UA.test(n ? n.tagName : 'SPAN');
        // a subgrid's computed tracks read 'subgrid [] []…', which means nothing once the copy has no parent grid: take the parent's resolved
        // tracks over the span the element covers (Ex-selbar's list row, 2026-10-02: its ID, shield and × wrapped under the chips)
        const sub = (k) => { if (!n || !/^subgrid/.test(cs[k]) || !n.parentElement) return cs[k]; let up = n.parentElement; while (up && /^subgrid/.test(getComputedStyle(up)[k])) up = up.parentElement; if (!up) return cs[k]; const pv = getComputedStyle(up)[k].split(' '); const se = k === 'gridTemplateColumns' ? [cs.gridColumnStart, cs.gridColumnEnd] : [cs.gridRowStart, cs.gridRowEnd]; const a0 = parseInt(se[0], 10), e0 = parseInt(se[1], 10); const from = isNaN(a0) ? 0 : a0 - 1; const to = isNaN(e0) ? pv.length : e0 < 0 ? pv.length + e0 + 1 : e0 - 1; return pv.slice(from, to).join(' '); };
        for (const k of INH) if (isRoot || ua || !pcs || cs[k] !== pcs[k] || vm[k]) put(k, cs[k]);
        for (const k of BOX) {
          if (k === 'width' || k === 'height') { if ((isRoot && !(s.fluid && k === 'width') && !(s.maxRows && k === 'height')) || vm[k] || fixed === true || (fixed === 'h' && k === 'height') || (fixed === 'w' && k === 'width')) put(k, cs[k]); continue; }
          const def = INITIAL[k]; const skip = def !== undefined && cs[k] === def && !UA.test(n ? n.tagName : 'SPAN') && !vm[k];
          if (k.startsWith('margin') || k.startsWith('padding') || k.startsWith('border')) { const z = /^(0px|none|rgb\(0, 0, 0\)|currentcolor)$/i.test(cs[k]) || (k.endsWith('Color') && cs[k.replace('Color', 'Style')] === 'none'); if (z && !UA.test(n ? n.tagName : 'SPAN') && !vm[k]) continue; }
          if (k === 'display' && !isRoot && cs[k] === 'inline' && !UA.test(n ? n.tagName : 'SPAN') && !vm[k]) continue;
          if (skip) continue; put(k, /^gridTemplate/.test(k) ? sub(k) : cs[k]);
        }
        return decl.join(';');
      };
      const pseudo = (n, which) => { const ps = getComputedStyle(n, which); if (!ps.content || ps.content === 'none' || ps.content === 'normal') return null; const sp = document.createElement('span'); const txt = ps.content.startsWith('"') ? ps.content.slice(1, -1) : ''; sp.textContent = txt; const pv = ((pvar.get(n) || {})[which.slice(2)]) || {}; sp.setAttribute('style', style(null, ps, getComputedStyle(n), false).replace(/display:inline(;|$)/, '') + ';' + ['display', 'width', 'height', 'flex-grow', 'flex-shrink', 'flex-basis', 'background-color', 'margin-left', 'margin-right', 'align-self', 'border-radius'].map((k) => { const v = ps.getPropertyValue(k); const cam = k.replace(/-([a-z])/g, (m, x) => x.toUpperCase()); return pv[cam] ? `${k}:var(${pv[cam]},${v})` : `${k}:${v}`; }).join(';')); sp.setAttribute('data-pseudo', which.slice(2)); return sp; };
      const copy = (n, pcs, isRoot) => {
        if (n.nodeType === 3) return document.createTextNode(n.textContent);
        if (n.nodeType !== 1) return null;
        const cs = getComputedStyle(n); if (cs.display === 'none') return null;
        const tag = n.tagName.toLowerCase();
        if (tag === 'img') { const d = document.createElement('span'); d.setAttribute('style', `display:inline-block;width:${cs.width};height:${cs.height};border-radius:${cs.borderRadius};background:#0B0F12`); return d; }
        const c = document.createElementNS(n.namespaceURI, tag);
        if (tag === 'use') { const href = n.getAttribute('href') || n.getAttribute('xlink:href'); const sym = href && document.querySelector(href); const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); if (sym) [...sym.childNodes].forEach((x) => g.appendChild(x.cloneNode(true))); return g; }
        for (const a of ['viewBox', 'd', 'points', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'type', 'value', 'placeholder', 'aria-pressed', 'aria-current', 'aria-checked', 'role', 'datetime', 'disabled', 'checked', 'transform']) if (n.hasAttribute && n.hasAttribute(a) && !(tag !== 'svg' && n.namespaceURI !== 'http://www.w3.org/2000/svg' && (a === 'width' || a === 'height'))) c.setAttribute(a, n.getAttribute(a));
        if (tag === 'svg') { const u = n.querySelector('use'); if (u && !n.getAttribute('viewBox')) { const sym = document.querySelector(u.getAttribute('href') || u.getAttribute('xlink:href')); if (sym && sym.getAttribute('viewBox')) c.setAttribute('viewBox', sym.getAttribute('viewBox')); } }
        let fixed = tag === 'svg' || !(n.textContent || '').trim();
        if (!fixed && n.style && n.namespaceURI === 'http://www.w3.org/1999/xhtml') { const h0 = n.getBoundingClientRect().height, w0 = n.getBoundingClientRect().width; const sh = n.style.height, sw = n.style.width; n.style.setProperty('height', 'auto', 'important'); n.style.setProperty('width', 'auto', 'important'); const h1 = n.getBoundingClientRect().height, w1 = n.getBoundingClientRect().width; n.style.height = sh; n.style.width = sw; if (Math.abs(h1 - h0) > .5) fixed = fixed || 'h'; if (Math.abs(w1 - w0) > .5) fixed = fixed || 'w'; }
        if (n.namespaceURI === 'http://www.w3.org/1999/xhtml' || tag === 'svg') c.setAttribute('style', style(n, cs, pcs, isRoot, fixed));
        else { const st = ['fill', 'stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'opacity'].map((k) => `${kebab(k)}:${cs[k]}`).join(';'); c.setAttribute('style', st); }
        if (n.getAttribute('data-fz') && n.getAttribute('data-fz').includes('hover')) c.setAttribute('data-fh', '1');
        for (const ns of s.nodeStyle || []) if (n.matches && n.matches(ns.sel)) c.setAttribute('style', (c.getAttribute('style') || '') + ';' + ns.style);
        const kc = typeof n.className === 'string' ? n.className.trim() : (n.className && n.className.baseVal) || ''; if (kc) c.setAttribute('class', kc.split(/\s+/).map((x) => 'k-' + x).join(' '));
        const bf = pseudo(n, '::before'); if (bf) c.appendChild(bf);
        let kids = [...n.childNodes]; if (tag === 'tbody' && s.maxRows) kids = kids.filter((k) => k.nodeType !== 1).concat([...n.children].slice(0, s.maxRows));
        for (const k of kids) { const x = copy(k, cs, false); if (x) c.appendChild(x); }
        const af = pseudo(n, '::after'); if (af) c.appendChild(af);
        if (s.addLine && n.matches && n.matches(s.addLine.sel) && !af) { const ln = document.createElement('span'); ln.setAttribute('style', `display:var(--lline,none);flex:1 1 0%;height:1px;margin-left:4px;align-self:center;background-color:${s.addLine.color || 'rgb(58, 71, 82)'}`); ln.setAttribute('data-addline', '1'); c.appendChild(ln); }
        if (tag === 'input' || tag === 'textarea') { c.setAttribute('readonly', ''); c.setAttribute('tabindex', '-1'); }
        return c;
      };
      const pcs = root.parentElement ? getComputedStyle(root.parentElement) : null;
      const c = copy(root, pcs, true); const r = root.getBoundingClientRect();
      // the surface the element sits on: the first ancestor with an opaque background
      let bg = 'rgb(23, 30, 36)'; for (let a = root; a; a = a.parentElement) { const v = getComputedStyle(a).backgroundColor; if (v && v !== 'rgba(0, 0, 0, 0)' && !/\/ 0\)$/.test(v)) { bg = v; break; } }
      return { html: c.outerHTML, w: Math.round(r.width), h: Math.round(r.height), bg, box: { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height } };
    }, s);
    const f = path.join(cropDir, `${s.id}.png`); const pad = 12;
    await p.screenshot({ path: f, clip: { x: Math.max(0, res.box.x - pad), y: Math.max(0, res.box.y - pad), width: Math.min(1400, res.box.w + pad * 2), height: Math.min(900, res.box.h + pad * 2) } });
    if (hoverNode) { await cdp.send('CSS.forcePseudoState', { nodeId: hoverNode, forcedPseudoClasses: [] }).catch(() => {}); hoverNode = 0; }
    out[s.id] = { html: res.html, w: res.w, h: res.h, bg: res.bg };
    if (s.pop) { await W.closePop(p).catch(() => {}); }
    console.log(`${s.id}: ${res.w}×${res.h} · ${(res.html.length / 1024).toFixed(1)}KB · on ${res.bg}`);
  }
  fs.writeFileSync(outF, JSON.stringify(out));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
