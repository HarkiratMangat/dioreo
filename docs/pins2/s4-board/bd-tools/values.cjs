// Board 4: Builder-2 · values.cjs — every computed size and space that is not a whole pixel, or not on Harkirat's spacing scale, per gate, per
// walk view, with the winning declaration's file:line (Session 4, Adjuster A1, 2026-10-04 17:24 EDT). Harkirat, 2026-10-04 01:12 EDT: "take partial
// pixels out of the scenario and keep things clean with whole numbers"; 01:58 and 02:02 EDT: the scale is every 2 up to 20, then every 4.
// It judges the COMPUTED value (an em padding, a calc() with a fractional term, a unitless line-height all compute to fractions from whole-looking
// source), so the source is read only to say where the value comes from (CDP CSS.getMatchedStylesForNode, Chrome's own cascade, as structure.cjs).
//   whole   font-size, line-height, padding, margin, gap, border and outline width, outline-offset, inset (positioned), radius, text-decoration
//           thickness, box-shadow spread, a declared width/height/min/max, a declared px grid track, a translate under 1px (a nudge)
//   scale   padding, margin, gap, inset, line-height of untrimmed text, a declared width/height/min/max: 0 2 4 … 20, then 24 28 32 … (negatives too)
// Left out by the prompt (A1.md § Whole pixels, § The spacing scale): letter-spacing, blur, a width or height that flex or grid shares out (only a
// DECLARED length is judged: %, fr, auto, vw and content keywords are shared out), font size and strokes from the scale (font size: chosen by capital
// height; a 1px hairline stays), the height of a trimmed text box.
// Usage: node bd-tools/values.cjs [--kit <dir>] [--gates C1,...] [--size 1480x834] [--views] [--plant "<css>"] [--label name]
//   --views walks every view of each gate (rest, states, Try steps); without it, rest only. --plant adds a style (the falsifiers).
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const KIT = A.kit || 'local/pins2/s4/builder-2'; const [W, H] = (A.size || '1480x834').split('x').map(Number);
const GSEL = A.gates ? A.gates.split(',') : L.GATES.map((g) => g[0]); const LABEL = A.label || 'values';
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/values'); fs.mkdirSync(OUT, { recursive: true });

const SCAN = (id, popSel) => {
  const s = document.getElementById(id); const roots = popSel ? [...document.querySelectorAll(popSel)].filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0) : [s]; const cs = getComputedStyle; const px = (v) => parseFloat(v) || 0; const out = [];
  const SCALE = (v) => { const a = Math.abs(Math.round(v * 1000) / 1000); if (Math.abs(a - Math.round(a)) > 0.005) return false; const r = Math.round(a); return r <= 20 ? r % 2 === 0 : r % 4 === 0; };
  const whole = (v) => Math.abs(v - Math.round(v)) <= 0.005;
  const hidden = (e) => { for (let x = e; x && x !== s; x = x.parentElement) { const c = cs(x); if (c.display === 'none' || c.visibility === 'hidden') return true; } return false; };
  const sel = (e) => { const p = []; for (let x = e; x && x !== s && p.length < 4; x = x.parentElement) p.unshift(x.tagName.toLowerCase() + (x.classList.length ? '.' + [...x.classList].filter((c) => !c.startsWith('bd-')).slice(0, 3).join('.') : '')); return p.join(' > '); };
  const txt = (e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('').replace(/\s+/g, ' ').trim().slice(0, 30);
  for (const x of document.querySelectorAll('[data-bd-v]')) delete x.dataset.bdV;
  let n = 0; const mark = (e) => { if (!e.dataset.bdV) e.dataset.bdV = 'v' + ++n; return e.dataset.bdV; };
  const judge = (e, c, pseudo) => {
    const f = []; const add = (prop, v, rule, extra) => { if (rule === 'whole' ? !whole(v) : !(whole(v) && SCALE(v))) f.push({ prop, v: Math.round(v * 1000) / 1000, rule, ...(extra || {}) }); };
    const hasText = pseudo ? /^["']/.test(c.content) && c.content.length > 2 : [...e.childNodes].some((x) => x.nodeType === 3 && x.nodeValue.trim());
    if (hasText) { add('font-size', px(c.fontSize), 'whole'); if (c.lineHeight !== 'normal') { const trimmed = c.textBoxTrim && c.textBoxTrim !== 'none'; add('line-height', px(c.lineHeight), trimmed ? 'whole' : 'scale'); } }
    for (const k of ['Top', 'Right', 'Bottom', 'Left']) { add('padding-' + k.toLowerCase(), px(c['padding' + k]), 'scale'); if (c.position !== 'absolute' && c.position !== 'fixed' || true) add('margin-' + k.toLowerCase(), px(c['margin' + k]), 'scale');
      if (c['border' + k + 'Style'] !== 'none' && px(c['border' + k + 'Width']) > 0) add('border-' + k.toLowerCase() + '-width', px(c['border' + k + 'Width']), 'whole'); }
    if (/flex|grid/.test(c.display)) { if (c.rowGap !== 'normal') add('row-gap', px(c.rowGap), 'scale'); if (c.columnGap !== 'normal') add('column-gap', px(c.columnGap), 'scale'); }
    if (c.outlineStyle !== 'none' && px(c.outlineWidth) > 0) { add('outline-width', px(c.outlineWidth), 'whole'); add('outline-offset', px(c.outlineOffset), 'whole'); }
    for (const k of ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft']) { const r = c['border' + k + 'Radius']; if (r && !/%/.test(r)) add('border-' + k.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1) + '-radius', px(r), 'whole'); }
    if (c.textDecorationLine !== 'none' && /px$/.test(c.textDecorationThickness)) add('text-decoration-thickness', px(c.textDecorationThickness), 'whole');
    if (c.boxShadow !== 'none') { let t = c.boxShadow; for (let k = 0; k < 4; k++) t = t.replace(/[a-z-]+\([^()]*\)/gi, ' '); for (const sh of t.split(',')) { const ls = sh.trim().split(/\s+/).filter((x) => /^-?[\d.]+px$/.test(x)).map(px); if (ls.length < 4 || ls[2] !== 0) continue; add('box-shadow spread', ls[3], 'whole'); if (ls[0]) add('box-shadow offset-x', ls[0], 'whole'); if (ls[1]) add('box-shadow offset-y', ls[1], 'whole'); } }   // a blurred shadow is a glow, not a stroke (blur is excluded)
    if (c.transform !== 'none') { const m = c.transform.match(/matrix\(([^)]+)\)/); if (m) { const t = m[1].split(',').map(Number); for (const [k, v] of [['translate-x', t[4]], ['translate-y', t[5]]]) if (Math.abs(v) > 0.001 && Math.abs(v) < 1) f.push({ prop: k, v: Math.round(v * 1000) / 1000, rule: 'nudge' }); } }
    // declared sizes are judged after the cascade lookup says the value is an authored length; collect the computed values here
    const sizes = {}; for (const k of ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'flex-basis', ...(c.position !== 'static' ? ['top', 'right', 'bottom', 'left'] : [])]) { const v = c.getPropertyValue(k); if (/px$/.test(v)) sizes[k] = px(v); }
    return { f, sizes };
  };
  for (const e of roots.flatMap((r) => [r, ...r.querySelectorAll('*')])) {
    if (e instanceof SVGElement && e.tagName !== 'svg') continue; const r = e.getBoundingClientRect(); if (r.width <= 1.01 && r.height <= 1.01) continue; if (hidden(e)) continue;
    const c = cs(e); const j = judge(e, c, null); out.push({ mark: mark(e), sel: sel(e), text: txt(e), pseudo: null, ...j });
    for (const pe of ['::before', '::after']) { const p = cs(e, pe); if (p.content === 'none' || p.content === 'normal' || p.display === 'none') continue; const jp = judge(e, p, pe); out.push({ mark: mark(e), sel: sel(e) + pe, text: (/^["'](.*)["']$/.exec(p.content) || [, ''])[1].slice(0, 30), pseudo: pe.slice(2), ...jp }); }
  }
  return out;
};

const LONGHAND = { 'margin-top': ['margin', 'margin-block', 'margin-block-start'], 'margin-bottom': ['margin', 'margin-block', 'margin-block-end'], 'margin-left': ['margin', 'margin-inline', 'margin-inline-start'], 'margin-right': ['margin', 'margin-inline', 'margin-inline-end'],
  'padding-top': ['padding', 'padding-block', 'padding-block-start'], 'padding-bottom': ['padding', 'padding-block', 'padding-block-end'], 'padding-left': ['padding', 'padding-inline', 'padding-inline-start'], 'padding-right': ['padding', 'padding-inline', 'padding-inline-end'],
  top: ['inset', 'inset-block', 'inset-block-start'], bottom: ['inset', 'inset-block', 'inset-block-end'], left: ['inset', 'inset-inline', 'inset-inline-start'], right: ['inset', 'inset-inline', 'inset-inline-end'],
  'row-gap': ['gap', 'grid-row-gap', 'grid-gap'], 'column-gap': ['gap', 'grid-column-gap', 'grid-gap'], 'font-size': ['font'], 'line-height': ['font'],
  'border-top-width': ['border', 'border-top', 'border-width', 'border-block', 'border-block-start', 'border-block-width'], 'border-bottom-width': ['border', 'border-bottom', 'border-width', 'border-block', 'border-block-end', 'border-block-width'],
  'border-left-width': ['border', 'border-left', 'border-width', 'border-inline', 'border-inline-start', 'border-inline-width'], 'border-right-width': ['border', 'border-right', 'border-width', 'border-inline', 'border-inline-end', 'border-inline-width'],
  'outline-width': ['outline'], 'border-top-left-radius': ['border-radius'], 'border-top-right-radius': ['border-radius'], 'border-bottom-right-radius': ['border-radius'], 'border-bottom-left-radius': ['border-radius'],
  'text-decoration-thickness': ['text-decoration'], 'box-shadow spread': ['box-shadow'], 'box-shadow offset-x': ['box-shadow'], 'box-shadow offset-y': ['box-shadow'], 'translate-x': ['transform', 'translate'], 'translate-y': ['transform', 'translate'],
  width: ['inline-size'], height: ['block-size'], 'min-width': ['min-inline-size'], 'min-height': ['min-block-size'], 'max-width': ['max-inline-size'], 'max-height': ['max-block-size'], 'flex-basis': ['flex'] };
async function locate(cdp, sheets, nodeId, props, pseudo) {
  const m = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
  let rules = m.matchedCSSRules || []; if (pseudo) { const pe = (m.pseudoElements || []).find((x) => x.pseudoType === pseudo); rules = pe ? pe.matches : []; }
  const cands = []; if (!pseudo && m.inlineStyle) cands.push({ style: m.inlineStyle, where: 'inline style', sel: 'style=""', order: 1e9 });
  rules.forEach((r, i) => { if (r.rule.origin !== 'regular') return; const sh = sheets.get(r.rule.style.styleSheetId); cands.push({ order: i, style: r.rule.style, where: sh || '?', sel: r.rule.selectorList.text }); });
  // an inherited font-size or line-height comes from an ancestor's rule: CDP lists those under inherited; the winning one is the nearest ancestor's
  const host = pseudo ? [(m.matchedCSSRules || []).filter((r) => r.rule.origin === 'regular').map((r, i) => ({ order: i, style: r.rule.style, where: sheets.get(r.rule.style.styleSheetId) || '?', sel: r.rule.selectorList.text }))] : [];
  const inh = [...host, ...(m.inherited || []).map((x) => (x.matchedCSSRules || []).filter((r) => r.rule.origin === 'regular').map((r, i) => ({ order: i, style: r.rule.style, where: sheets.get(r.rule.style.styleSheetId) || '?', sel: r.rule.selectorList.text })))];
  const found = {};
  for (const prop of props) {
    const names = [prop, ...(LONGHAND[prop] || [])]; const pick = (list) => { let best = null; for (const c of list) for (const d of c.style.cssProperties || []) { if (!names.includes(d.name) || d.disabled || !d.range) continue; const rank = (d.important ? 1e10 : 0) + c.order; if (!best || rank >= best.rank) best = { rank, prop: d.name, value: d.value, at: c.where === 'inline style' ? 'inline style' : `${c.where}:${d.range.startLine + 1}`, sel: c.sel.slice(0, 140) }; } return best; };
    let best = pick(cands); if (!best && /^(font-size|line-height)$/.test(prop)) for (const lvl of inh) { best = pick(lvl); if (best) { best.inherited = true; break; } }
    if (best) found[prop] = best;
  }
  return found;
}
// a length set through a token (var(--x)) is authored too: the first census missed every inset and size set that way (A1, 2026-10-04 19:09 EDT)
const authored = (v) => /\d|var\(/.test(v) && !/%|\bfr\b|\bauto\b|fit-content|max-content|min-content|vw|vh|\bstretch\b/.test(v);

(async () => {
  const { server, base } = await L.serve(); const b = await L.launch(W, H); const report = { kit: KIT, size: `${W}x${H}`, at: new Date().toISOString(), plant: A.plant || null, gates: {} };
  try {
    const K = await L.openKit(b, base, KIT, W, H, A.plant ? { css: A.plant } : {}); const cdp = await K.p.createCDPSession(); const sheets = new Map();
    cdp.on('CSS.styleSheetAdded', (e) => { const u = e.header.sourceURL || ''; sheets.set(e.header.styleSheetId, u ? path.relative(path.join(ROOT, KIT), path.join(ROOT, new URL(u).pathname)) : 'inline <style>'); });
    const enable = async () => { await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); await cdp.send('DOM.getDocument', { depth: -1 }); };
    for (const G of L.GATES.filter((g) => GSEL.includes(g[0]))) {
      const [gid, id] = G; const agg = new Map(); let elements = 0;
      const scanView = async (view, pop) => {
        if (!pop) await L.scrollTo(K, id); const items = await K.p.evaluate(SCAN, id, pop || null); elements += items.length; const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
        for (const it of items) {
          const sizeProps = Object.keys(it.sizes); if (!it.f.length && !sizeProps.length) continue;
          const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-bd-v="${it.mark}"]` }); if (!nodeId) continue;
          const src = await locate(cdp, sheets, nodeId, [...new Set([...it.f.map((x) => x.prop), ...sizeProps])], it.pseudo);
          const fs2 = it.f.filter((x) => !(/^(margin|padding)-/.test(x.prop) && src[x.prop] && /\bauto\b|%/.test(src[x.prop].value)));
          for (const k of sizeProps) { const s = src[k]; if (!s || !authored(s.value)) continue; const v = it.sizes[k]; const w = Math.abs(v - Math.round(v)) <= 0.005; const r = Math.round(Math.abs(v)); const onS = w && (r <= 20 ? r % 2 === 0 : r % 4 === 0); if (!w || !onS) fs2.push({ prop: k, v: Math.round(v * 1000) / 1000, rule: 'scale', declared: true }); }
          for (const x of fs2) { const s = src[x.prop] || null; const k = `${x.prop}|${x.v}|${s ? s.at : 'computed (no rule: a UA default or an inherited value)'}|${it.pseudo || ''}`;
            if (!agg.has(k)) agg.set(k, { prop: x.prop, value: x.v, rule: x.rule, whole: Math.abs(x.v - Math.round(x.v)) <= 0.005, at: s ? s.at : null, decl: s ? s.value : null, ruleSel: s ? s.sel : null, inherited: s ? !!s.inherited : false, pseudo: it.pseudo, n: 0, els: new Set(), views: new Set(), sample: [] });
            const a = agg.get(k); a.n++; a.els.add(it.sel); a.views.add(view); if (a.sample.length < 3 && !a.sample.some((y) => y.sel === it.sel)) a.sample.push({ sel: it.sel, text: it.text }); }
        }
      };
      await enable(); await scanView('rest');
      if (A.views) { const acts = await L.actions(K.p, id); for (const [n, [kind, i, label]] of acts.entries()) { await L.act(K, id, kind, i); await enable(); await scanView(`${n + 1}-${kind}-${label}`); } await K.load(); }
      if (A.views) for (const P of L.POPS.filter((x) => x.g === gid)) { await K.load(); await L.setState(K, P.id, P.state); await L.clickReal(K, P.trigger); await enable(); await scanView('pop-' + P.label, P.sel || L.POP_SEL); }
      const list = [...agg.values()].map((a) => ({ ...a, els: a.els.size, views: [...a.views] })).sort((x, y) => (x.at || '').localeCompare(y.at || '') || x.prop.localeCompare(y.prop));
      const counts = { elements, flagged: list.length, fractional: list.filter((x) => !x.whole).length, offScale: list.filter((x) => x.whole && x.rule === 'scale').length, nudges: list.filter((x) => x.rule === 'nudge').length };
      report.gates[gid] = { counts, list }; console.log(`${gid}: ${JSON.stringify(counts)}`);
    }
  } finally { await b.close(); server.close(); }
  const jf = path.join(OUT, `${LABEL}.json`); fs.writeFileSync(jf, JSON.stringify(report, null, 1)); console.log(`report ${path.relative(ROOT, jf)}`); process.exit(0);
})().catch((e) => { console.error('values failed:', e && e.stack || e); process.exit(2); });
