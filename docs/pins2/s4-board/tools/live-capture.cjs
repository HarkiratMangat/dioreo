// Session 4 · LIVE samples for Board 4: Standard. Replaces freeze.cjs, whose copies were dead: every style resolved to px, so a setting
// could not reflow them the way Board 4's CSS would (Harkirat, 2026-10-02 13:05 EDT; local/pins2/s4/board/REBUILD.md, C1–C2).
// For each place it keeps Board 4's real markup and classes: the whole SURFACE the element sits on (the first ancestor with an opaque
// fill — a panel, a drawer, a queue card, the selection bar), wrapped in an empty copy of every ancestor up to <body> so Board 4's
// descendant selectors still match. One stylesheet is pruned from Board 4's own ten: every rule whose selector matches a captured node
// (state pseudo-classes and pseudo-elements stripped for the test), @media and @supports resolved at Board 4's 1282px window, and
// rewritten for a shadow root (:root/html → :host, body → .fz-body, :hover → .fz-h; @property kept apart for document scope).
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/capture.cjs <out.json> <id ...>   (specs come from sweep/freeze-*.json)
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const [outF, ...ids] = process.argv.slice(2);
// does shorthand `sh` set longhand `l`? shared by the CSSOM recovery (in the page) and the source lookup (here)
const COVERS = String.raw`(sh, l) => l === sh || l.startsWith(sh + '-') || (sh === 'font' && l === 'line-height') || (/^border-(color|style|width)$/.test(sh) && new RegExp('^border-(top|right|bottom|left|block|inline)(-(start|end))?-' + sh.slice(7) + '$').test(l)) || (sh === 'border-radius' && /^border-.*-radius$/.test(l)) || (sh === 'border' && /^border-(top|right|bottom|left)-(color|style|width)$/.test(l)) || (sh === 'inset' && /^(top|right|bottom|left)$/.test(l)) || (sh === 'gap' && /^(row|column)-gap$/.test(l)) || (/^place-/.test(sh) && new RegExp('^(align|justify)-' + sh.slice(6) + '$').test(l)) || (sh === 'grid-area' && /^grid-(row|column)-(start|end)$/.test(l)) || (sh === 'flex-flow' && /^flex-(direction|wrap)$/.test(l)) || (sh === 'white-space' && /^(white-space-collapse|text-wrap-mode)$/.test(l))`; const covers = eval(COVERS); const CROPS = path.join(path.dirname(outF), 'live'); fs.mkdirSync(CROPS, { recursive: true });
const SW = path.join(__dirname, 'sweep'); const BY = {};
for (const f of fs.readdirSync(SW).filter((f) => /^freeze-.*\.json$/.test(f) && f !== 'freeze-selbar.json').sort())
  for (const s of JSON.parse(fs.readFileSync(path.join(SW, f), 'utf8'))) if (!BY[s.id] || (s.vars && !BY[s.id].vars)) BY[s.id] = s;
const EXTRA = fs.existsSync(path.join(SW, 'live-specs.json')) ? JSON.parse(fs.readFileSync(path.join(SW, 'live-specs.json'), 'utf8')) : [];
for (const s of EXTRA) BY[s.id] = { ...(BY[s.id] || {}), ...s };
(async () => {
  const { b, p } = await W.open(); await W.sleep(900);
  await p.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' }); await W.sleep(200);
  const cdp = await p.target().createCDPSession(); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const out = { css: '', props: '', samples: {} };
  let prevKey = null;
  for (const id of ids) {
    const s = BY[id]; if (!s) { console.log(`${id}: NO SPEC`); continue; }
    const key = JSON.stringify([s.gate, s.state, s.try, s.click, s.pop]);
    if (prevKey !== null && key !== prevKey) { await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await W.sleep(900); await p.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' }); await W.sleep(200); }
    prevKey = key;
    if (s.state) { await W.setState(p, s.gate, s.state); await W.sleep(700); }
    if (s.pop) { const pop = W.POPS.find((x) => x.label === s.pop); if (pop) { await W.openPop(p, pop).catch(() => {}); await W.sleep(600); } }
    if (s.try) { await p.evaluate((s) => { const bt = [...document.querySelectorAll(`#${s.gate} .b4-try button`)].find((x) => x.textContent.trim() === s.try); if (bt) bt.click(); }, s); await W.sleep(900); }
    if (s.click) { for (let k = 0; k < 2; k++) { const open = await p.evaluate((s) => { const g = document.getElementById(s.gate); const e = s.expect && g && g.querySelector(s.expect); return !!e && e.getBoundingClientRect().height > 2; }, s); if (open) break; await p.evaluate((s) => { const e = document.querySelector('#' + s.gate + ' ' + s.click); if (e) e.click(); }, s); await W.sleep(800); } }
    if (process.env.FZDEBUG) s.debug = 1; s.sig = 1;
    const res = await p.evaluate((s) => {
      const g = document.getElementById(s.gate) || document; let el = null;
      if (s.sel) el = [...g.querySelectorAll(s.sel)].filter((x) => !s.contains || (x.textContent || '').toLowerCase().includes(s.contains.toLowerCase()))[s.nth || 0] || null;
      else { const want = s.text.toLowerCase(); let n = s.nth || 0; for (const e of g.querySelectorAll('*')) { const own = [...e.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent).join('').replace(/\s+/g, ' ').trim().toLowerCase(); if (own && own.startsWith(want) && e.getBoundingClientRect().width > 1) { if (n-- <= 0) { el = e; break; } } } }
      if (!el) return null;
      for (let i = 0; i < (s.up || 0) && el.parentElement; i++) el = el.parentElement;
      el.scrollIntoView({ block: 'center' });
      g.querySelectorAll('.b3-bdgs:not(.in)').forEach((x) => x.classList.add('in'));
      const opaque = (c) => c && c !== 'rgba(0, 0, 0, 0)' && !/,\s*0\)$/.test(c) && !/\/\s*0\)$/.test(c);
      let surf = s.selfSurface ? el : el.parentElement; if (!s.selfSurface) { while (surf && surf !== document.body && !opaque(getComputedStyle(surf).backgroundColor)) surf = surf.parentElement;
      if (!surf || surf === document.body) surf = el.parentElement; }
      // mark the sample, its hovered node, and the hover chain (:hover holds on every ancestor, so .fz-h does too)
      document.querySelectorAll('[data-fz]').forEach((x) => x.removeAttribute('data-fz')); document.querySelectorAll('.fz-h').forEach((x) => x.classList.remove('fz-h')); document.querySelectorAll('[data-fzi]').forEach((x) => x.removeAttribute('data-fzi'));
      el.setAttribute('data-fz', 'root');
      let hov = null; if (s.hover && s.hover !== true) hov = el.querySelector(s.hover); else if (s.hover) hov = el;
      if (hov) { hov.setAttribute('data-fz', hov === el ? 'root hover' : 'hover'); for (let a = hov; a && a !== document.documentElement; a = a.parentElement) a.classList.add('fz-h'); }
      if (hov && s.activeClass) { [...hov.parentElement.children].forEach((x) => { if (x.classList.contains(s.activeClass)) x.setAttribute('data-fz-was', s.activeClass); x.classList.remove(s.activeClass); }); hov.classList.add(s.activeClass); }
      const R = el.getBoundingClientRect(), SR = surf.getBoundingClientRect(); const scs = getComputedStyle(surf);
      // debug: every node's computed style keyed by an index the copy carries too, so the fidelity check can diff property by property
      let sig; if (s.debug || s.sig) { const P = ['display', 'position', 'width', 'height', 'fontSize', 'fontFamily', 'fontWeight', 'letterSpacing', 'lineHeight', 'textTransform', 'justifySelf', 'alignSelf', 'gridTemplateColumns', 'gridColumn', 'gridRow', 'gap', 'padding', 'margin', 'color', 'backgroundColor', 'borderTopWidth', 'whiteSpace', 'fontVariantNumeric', 'fontFeatureSettings', 'overflow', 'flex', 'boxSizing'];
        sig = {}; [...surf.querySelectorAll('*')].forEach((n, i) => { if (n.closest('svg') && n.tagName.toLowerCase() !== 'svg') return; n.setAttribute('data-fzi', i); const cs = getComputedStyle(n); window.__fzPP = s.debug ? null : true; const PP = s.debug ? [...Array(cs.length).keys()].map((q) => cs[q]) : ['display', 'position', 'box-sizing', 'width', 'height', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style', 'border-top-color', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius', 'outline-style', 'outline-width', 'background-color', 'background-image', 'box-shadow', 'color', 'opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'line-height', 'text-transform', 'text-align', 'text-decoration-line', 'white-space', 'overflow-x', 'overflow-y', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'gap', 'grid-template-columns', 'grid-template-rows', 'transform', 'filter', 'visibility', 'z-index', 'content'];
          sig[i] = PP; }); }
      // a scroller between the surface and the sample keeps its scroll position (scrollIntoView moved it, and Board 4's crop shows it)
      document.querySelectorAll('[data-fz-scroll]').forEach((x) => x.removeAttribute('data-fz-scroll'));
      // every scroller in the surface, not only the sample's ancestors: Export's code preview sat scrolled beside its Download button
      for (const a of [surf, ...surf.querySelectorAll('*')]) if (a.scrollTop || a.scrollLeft) a.setAttribute('data-fz-scroll', `${a.scrollTop},${a.scrollLeft}`);
      // the copy: classes and attributes kept, live values written into attributes, nothing that runs
      const clone = surf.cloneNode(true); const live = [...surf.querySelectorAll('*')]; const copy = [...clone.querySelectorAll('*')];
      live.forEach((n, i) => { const c = copy[i]; if (!c) return;
        if (n.tagName === 'INPUT') { c.setAttribute('value', n.value); if (n.checked) c.setAttribute('checked', ''); c.setAttribute('readonly', ''); c.setAttribute('tabindex', '-1'); }
        if (n.tagName === 'TEXTAREA') { c.textContent = n.value; c.setAttribute('readonly', ''); c.setAttribute('tabindex', '-1'); }
        if (n.tagName === 'IMG' || n.tagName === 'CANVAS' || n.tagName === 'VIDEO') { const cs = getComputedStyle(n); const sp = document.createElement('span'); sp.setAttribute('class', n.getAttribute('class') || ''); sp.setAttribute('style', `display:inline-block;width:${cs.width};height:${cs.height};border-radius:${cs.borderRadius};background:#0B0F12;vertical-align:middle`); c.replaceWith(sp); }
      });
      clone.querySelectorAll('script, noscript, template').forEach((x) => x.remove());
      clone.querySelectorAll('*').forEach((x) => { for (const a of [...x.attributes]) if (/^on/i.test(a.name)) x.removeAttribute(a.name); });
      clone.querySelectorAll('use').forEach((u) => { const href = u.getAttribute('href') || u.getAttribute('xlink:href'); const sym = href && href.startsWith('#') && document.querySelector(href); const svg = u.closest('svg');
        if (sym) { const gEl = document.createElementNS('http://www.w3.org/2000/svg', 'g'); [...sym.childNodes].forEach((k) => gEl.appendChild(k.cloneNode(true))); if (svg && !svg.getAttribute('viewBox') && sym.getAttribute('viewBox')) svg.setAttribute('viewBox', sym.getAttribute('viewBox')); u.replaceWith(gEl); } });
      if (s.addLine) { const tgt = clone.querySelector('[data-fz~="root"]'); const host = tgt && (tgt.matches(s.addLine.sel) ? tgt : tgt.querySelector(s.addLine.sel)); if (host) { const ln = document.createElement('span'); ln.setAttribute('data-addline', '1'); ln.setAttribute('style', `display:var(--lline,none);flex:1 1 0%;height:1px;margin-left:4px;align-self:center;background-color:${s.addLine.color || 'rgb(58, 71, 82)'}`); host.appendChild(ln); } }
      // a surface whose height Board 4 constrains (an overlay, or a scroller sized by its stage) keeps that height; a natural one grows
      const fixedH = /absolute|fixed/.test(scs.position) || scs.overflowY !== 'visible';
      clone.setAttribute('data-fz-surf', ''); clone.setAttribute('style', (clone.getAttribute('style') || '') + `;width:${SR.width}px !important;margin:0 !important;position:relative !important;inset:auto !important;transform:none !important;${fixedH ? `height:${SR.height}px !important;max-height:none !important;` : ''}`);
      // the ancestor skeleton: empty copies so `#c-history .b3-hi .mtools …` still matches; their own layout neutralised
      let inner = clone.outerHTML; const anc = [];
      for (let a = surf.parentElement; a && a !== document.body; a = a.parentElement) anc.push(a);
      for (const a of anc) { const r = a.getBoundingClientRect(); const attrs = [...a.attributes].filter((x) => x.name !== 'style' && !/^on/i.test(x.name)).map((x) => `${x.name}="${x.value.replace(/"/g, '&quot;')}"`).join(' ');
        const st = (a.getAttribute('style') || '') + `;display:block !important;position:static !important;margin:0 !important;padding:0 !important;border:0 !important;width:${Math.max(r.width, SR.width)}px !important;height:auto !important;min-height:0 !important;max-height:none !important;overflow:visible !important;transform:none !important;background:none !important;box-shadow:none !important;filter:none !important;opacity:1 !important;clip-path:none !important;mask:none !important`;
        inner = `<${a.tagName.toLowerCase()} ${attrs} style="${st.replace(/"/g, '&quot;')}">${inner}</${a.tagName.toLowerCase()}>`; }
      const battrs = [...document.body.attributes].filter((x) => x.name !== 'style').map((x) => x.name === 'class' ? `class="fz-body ${x.value}"` : `${x.name}="${x.value.replace(/"/g, '&quot;')}"`).join(' ');
      const html = `<div ${/class=/.test(battrs) ? battrs : battrs + ' class="fz-body"'} style="${((document.body.getAttribute('style') || '') + ';display:block !important;margin:0 !important;padding:0 !important;width:max-content !important;min-width:0 !important;background:none !important;overflow:visible !important;height:auto !important;min-height:0 !important').replace(/"/g, '&quot;')}">${inner}</div>`;
      const hostAttrs = Object.fromEntries([...document.documentElement.attributes].map((x) => [x.name, x.value]));
      // for pruning: every node that the copy carries (surface subtree + ancestors + html, body)
      window.__fzNodes = (window.__fzNodes || []).concat([...surf.querySelectorAll('*'), surf, ...anc, document.body, document.documentElement]);
      surf.setAttribute('data-fz-surf', '');
      return { sig, html, hostAttrs, abs: { x: SR.x + scrollX, y: SR.y + scrollY }, surf: { w: SR.width, h: SR.height, cls: (typeof surf.className === 'string' ? surf.className : '') }, root: { x: R.x - SR.x, y: R.y - SR.y, w: R.width, h: R.height } };
    }, s);
    if (!res) { if (s.pop) await W.closePop(p).catch(() => {}); console.log(`${id}: NOT FOUND`); continue; }
    // the kit's own picture of the surface, hover forced the way the copy forces it, for the fidelity check (REBUILD.md C2)
    const hn = []; if (s.hover) { const { root } = await cdp.send('DOM.getDocument', { depth: -1 }); const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '.fz-h' }); for (const nodeId of nodeIds) { await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] }); hn.push(nodeId); } await W.sleep(150); }
    if (res.sig) res.sig = await p.evaluate((props) => { const out = {}; for (const [i, PP] of Object.entries(props)) { const e = document.querySelector(`[data-fzi="${i}"]`); if (!e) continue; const cs = getComputedStyle(e); const keys = Array.isArray(PP) ? PP : [...Array(cs.length).keys()].map((q) => cs[q]); out[i] = {}; for (const q of keys) out[i][q] = cs.getPropertyValue(q); } return out; }, res.sig);
    await p.screenshot({ path: path.join(CROPS, `${id}.kit.png`), clip: { x: res.abs.x, y: res.abs.y, width: res.surf.w, height: res.surf.h }, captureBeyondViewport: true });
    for (const nodeId of hn) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }).catch(() => {});
    await p.evaluate(() => document.querySelectorAll('[data-fz-surf]').forEach((x) => x.removeAttribute('data-fz-surf')));
    if (s.pop) await W.closePop(p).catch(() => {});
    out.sigs = out.sigs || {}; out.sigs[id] = res.sig; delete res.sig;
    out.samples[id] = { ...res, vars: s.vars || [], nodeStyle: s.nodeStyle || [], hover: !!s.hover };
    console.log(`${id}: surface ${Math.round(res.surf.w)}×${Math.round(res.surf.h)} (${res.surf.cls.split(' ').slice(0, 2).join('.')}) · sample ${Math.round(res.root.w)}×${Math.round(res.root.h)} at ${Math.round(res.root.x)},${Math.round(res.root.y)} · ${(res.html.length / 1024).toFixed(0)}KB`);
  }
  // one pruned stylesheet for every capture: the samples are put back into the page first, so a reload between samples loses none of them
  await p.evaluate((htmls) => { const box = document.createElement('div'); box.id = 'fz-relive'; box.style.cssText = 'position:absolute;left:-99999px;top:0;width:2400px'; box.innerHTML = htmls.join(''); document.body.appendChild(box); window.__fzNodes = [...(window.__fzNodes || []), ...box.querySelectorAll('*')]; }, Object.values(out.samples).map((x) => x.html));
  const css = await p.evaluate((COVERS) => { const covers = eval(COVERS);
    const nodes = [...new Set(window.__fzNodes || [])]; const STATE = /:(hover|focus-visible|focus-within|focus|active|visited|target)(?![\w-])/g;
    const splitSel = (t) => { const out = []; let d = 0, cur = ''; for (const ch of t) { if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
    const test = (sel) => { let t = sel.replace(/::?(before|after|first-line|first-letter|placeholder|selection|marker|backdrop|-webkit-[\w-]+|-moz-[\w-]+)(\([^)]*\))?/g, '').replace(STATE, ''); t = t.replace(/:not\(\s*\)/g, '').trim(); if (!t || /[>+~]$/.test(t)) t = (t.replace(/[>+~]\s*$/, '') + ' *').trim(); if (t === '*' || t === '') return true; try { return nodes.some((n) => n.matches(t)); } catch (e) { return true; } };
    // html / :root become :host, taking their WHOLE compound with them: `html[x]:not([x=off]) .a` → `:host([x]:not([x=off])) .a`.
    // (A first version moved only the attribute part, leaving `:host([x]):not(…)`, which never matches; Board 4's slot labels vanished.)
    const hostify = (sel) => { let out = '', i = 0; const re = /(^|[\s>+~(,])(html|:root)(?![\w-])/g; let m;
      while ((m = re.exec(sel))) { const start = m.index + m[1].length; let j = start + m[2].length;
        while (j < sel.length && '[.#:'.includes(sel[j])) { if (sel[j] === '[') { let d = 0; do { if (sel[j] === '[') d++; if (sel[j] === ']') d--; j++; } while (j < sel.length && d > 0); }
          else { j++; if (sel[j] === ':') j++; while (j < sel.length && /[\w-]/.test(sel[j])) j++; if (sel[j] === '(') { let d = 0; do { if (sel[j] === '(') d++; if (sel[j] === ')') d--; j++; } while (j < sel.length && d > 0); } } }
        const comp = sel.slice(start + m[2].length, j); out += sel.slice(i, start) + (comp ? `:host(${comp})` : ':host'); i = j; re.lastIndex = j; }
      return out + sel.slice(i); };
    const rw = (sel) => hostify(sel).replace(/(^|[\s>+~(,])body(?![\w-])/g, '$1.fz-body').replace(/:hover(?![\w-])/g, '.fz-h');
    // A shorthand holding a var() serialises as empty longhands in cssText (`font: 700 40px/.8 var(--display)` came out as `font-style: ;
    // font-weight: ; …`, so .pb-numr lost its typeface). Each empty longhand is put back as the shorthand that still holds the text.
    const KNOWN = { 'line-height': 'font', top: 'inset', right: 'inset', bottom: 'inset', left: 'inset', 'align-items': 'place-items', 'justify-items': 'place-items', 'align-content': 'place-content', 'justify-content': 'place-content', 'align-self': 'place-self', 'justify-self': 'place-self', 'row-gap': 'gap', 'column-gap': 'gap' };
    // Which shorthands set a longhand is asked of the browser, never guessed from names: a name-prefix guess took `border-top` for the
    // shorthand of `border-top-left-radius`, so every `border-radius: var(…)` lost its radius and Board 4's pills came out square
    // (Harkirat, 2026-10-02 14:36 EDT). The CSSOM gives a var() shorthand only as empty longhands; each comes back as a shorthand that
    // really sets it, else the block is taken from the stylesheet's source.
    const SH = ['margin', 'padding', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-color', 'border-style', 'border-width', 'border-radius', 'border-block', 'border-inline', 'border-block-start', 'border-block-end', 'border-inline-start', 'border-inline-end', 'border-image', 'outline', 'background', 'background-position', 'font', 'font-variant', 'grid', 'grid-template', 'grid-area', 'grid-row', 'grid-column', 'gap', 'place-items', 'place-content', 'place-self', 'inset', 'inset-block', 'inset-inline', 'flex', 'flex-flow', 'transition', 'animation', 'mask', 'text-decoration', 'list-style', 'overflow', 'columns', 'column-rule', 'text-emphasis', 'scroll-margin', 'scroll-padding', 'container', 'white-space', 'text-wrap', 'offset', 'margin-block', 'margin-inline', 'padding-block', 'padding-inline', 'contain-intrinsic-size', 'mask-border', 'overscroll-behavior'];
    const LONG = {}; const longs = (sh) => { if (!LONG[sh]) { const d = document.createElement('div').style; d.setProperty(sh, 'initial'); LONG[sh] = new Set([...Array(d.length).keys()].map((i) => d[i])); } return LONG[sh]; };
    const coverers = (l) => SH.filter((sh) => longs(sh).has(l));
    const decl = (st) => { const out = []; const done = new Set();
      for (let i = 0; i < st.length; i++) { const name = st[i]; const val = st.getPropertyValue(name); const pr = st.getPropertyPriority(name) ? ' !important' : '';
        if (val !== '') { out.push(`${name}: ${val}${pr}`); continue; }
        const sh = coverers(name).find((c) => st.getPropertyValue(c) !== ''); if (!sh) return null; if (done.has(sh)) continue; done.add(sh);
        out.push(`${sh}: ${st.getPropertyValue(sh)}${st.getPropertyPriority(sh) ? ' !important' : ''}`); }
      return out.join('; '); };
    // occurrence index of every style rule in its sheet, by normalised selector, so an unrecoverable block can be taken from the source
    const norm = (t) => t.replace(/\s+/g, '').replace(/'/g, '"').replace(/\[([^\]=]+)="?([^\]"]*)"?\]/g, '[$1=$2]').replace(/(^|[^:]):(before|after|first-line|first-letter)/g, '$1::$2');
    const occ = new Map();
    for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; } const cnt = {}; const w = (rs) => { for (const r of rs) { if (r instanceof CSSStyleRule) { const k = norm(r.selectorText); cnt[k] = (cnt[k] || 0) + 1; occ.set(r, cnt[k] - 1); } else if (r.cssRules) w(r.cssRules); } }; w(rules); }
    const problems = [];
    let text = '', props = '';
    const walk = (rules) => { for (const r of rules) {
      if (r instanceof CSSStyleRule) { const sels = splitSel(r.selectorText).filter(test); if (!sels.length) continue; const nested = r.cssRules && r.cssRules.length ? '/* nested rules dropped */' : ''; let d = decl(r.style); if (d === null) { const st = r.style; const empty = [], present = []; for (let q = 0; q < st.length; q++) (st.getPropertyValue(st[q]) === '' ? empty : present).push(st[q]); problems.push({ href: r.parentStyleSheet.href, sel: norm(r.selectorText), idx: occ.get(r), need: [...empty, ...present].map((l) => [l, ...coverers(l)]) }); d = `/*FZQ:${problems.length - 1}*/`; } text += `${sels.map(rw).join(', ')} { ${d} }${nested}\n`; }
      else if (r instanceof CSSMediaRule) { if (matchMedia(r.conditionText || r.media.mediaText).matches) walk(r.cssRules); }
      else if (r instanceof CSSSupportsRule) { if (CSS.supports(r.conditionText)) walk(r.cssRules); }
      else if (typeof CSSContainerRule !== 'undefined' && r instanceof CSSContainerRule) { const before = text; text = ''; walk(r.cssRules); const inner = text; text = before; if (inner) text += `@container ${r.conditionText} {\n${inner}}\n`; }
      else if (typeof CSSPropertyRule !== 'undefined' && r instanceof CSSPropertyRule) props += r.cssText + '\n';
    } };
    const skipped = [];
    for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { skipped.push(sh.href); continue; } walk(rules); }
    return { text, props, skipped, nodes: nodes.length, problems };
  }, COVERS);
  // the source text of each block the CSSOM could not serialise, matched by normalised selector and occurrence in its file
  const srcCache = {}; const blocks = (file) => { if (srcCache[file]) return srcCache[file]; const t = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); const out = []; let i = 0;
    const norm = (x) => x.replace(/\s+/g, '').replace(/'/g, '"').replace(/\[([^\]=]+)="?([^\]"]*)"?\]/g, '[$1=$2]').replace(/(^|[^:]):(before|after|first-line|first-letter)/g, '$1::$2');
    const scan = (from, to) => { let p0 = from; while (p0 < to) { const ob = t.indexOf('{', p0); if (ob < 0 || ob >= to) break; const pre = t.slice(p0, ob).trim(); let d = 1, j = ob + 1; while (j < to && d) { if (t[j] === '{') d++; else if (t[j] === '}') d--; j++; }
      if (pre.startsWith('@')) { if (/^@(media|supports|container|layer)/.test(pre)) scan(ob + 1, j - 1); } else out.push({ sel: norm(pre.replace(/^[;}\s]+/, '')), body: t.slice(ob + 1, j - 1).trim() }); p0 = j; } };
    scan(0, t.length); return (srcCache[file] = out); };
  let fixed = 0; const miss = [];
  for (let k = 0; k < css.problems.length; k++) { const pr = css.problems[k]; const file = path.resolve(__dirname, '../../../../..', decodeURIComponent(new URL(pr.href).pathname).replace(/^\//, '')); let body = null;
    // the right block among same-selector rules: it must declare every property the CSSOM still shows, and a shorthand for each one it lost
    try { const hits = blocks(file).filter((x) => x.sel === pr.sel);
      const names = (b) => b.split(';').map((d) => d.split(':')[0].trim().toLowerCase()).filter(Boolean);
      const ok = (h) => { const ns = new Set(names(h.body)); return pr.need.every((alts) => alts.some((n) => ns.has(n))); };
      const pick = hits[pr.idx] && ok(hits[pr.idx]) ? hits[pr.idx] : hits.find(ok); body = pick ? pick.body : null; } catch (e) { body = null; }
    if (body !== null) { css.text = css.text.replace(`/*FZQ:${k}*/`, body.replace(/;\s*$/, '')); fixed++; } else { miss.push(pr.sel.slice(0, 60)); pr.miss = 1; } }
  out.problems = css.problems;
  console.log(`source blocks restored: ${fixed}/${css.problems.length}${miss.length ? ' · missing: ' + miss.join(' | ') : ''}`);
  out.css = css.text; out.props = css.props;
  if (out.sigs) { fs.writeFileSync(outF.replace(/\.json$/, '-sig.json'), JSON.stringify(out.sigs)); delete out.sigs; }
  fs.writeFileSync(outF, JSON.stringify(out));
  console.log(`css ${(css.text.length / 1024).toFixed(0)}KB from ${css.nodes} nodes · @property ${(css.props.length / 1024).toFixed(1)}KB · skipped sheets: ${css.skipped.join(', ') || 'none'} · total ${(fs.statSync(outF).size / 1024).toFixed(0)}KB`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
