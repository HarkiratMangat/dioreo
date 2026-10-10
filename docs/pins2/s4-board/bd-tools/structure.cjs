// Board 4: Builder-2 · structure.cjs — every instance of the structural defect classes, per gate, with element, selector and file:line
// (Session 4, builder R1, 2026-10-03 23:51 EDT). The classes are R1's (local/pins2/s4/prompts/R1.md, "Structure"):
//   shared-gap   a label or lead item sharing one gap with a set (bd/measure.js sharedGap)
//   margin       a non-zero margin (negative = a pull); the candidates for compensating margins
//   nudge        transform translate*, a relative offset (top/left/right/bottom), a line-height that equals the box's height (centring by line box)
//   magic-size   an authored length width/min-width/max-width/height/min-height/max-height/flex-basis/grid-template-columns: CANDIDATES only;
//                a control's own height is a design size, a pinned column or a min-height that exists to fit content is the defect (judged per row)
//   spacer       an element or a ::before/::after that takes space and paints nothing
//   wrapper-text text placed by a wrapper (bd/measure.js textHolder, alignedBox)
// The source of each winning declaration comes from Chrome's own cascade (CDP CSS.getMatchedStylesForNode), not from a re-implementation.
// Usage: node bd-tools/structure.cjs [--kit local/pins2/s4/builder-2] [--gates C1] [--size 1480x834] [--label name] [--views regex]
//   --views walks every view of the gate (rest, states, Try steps) and unions the instances; without it, rest only.
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const KIT = A.kit || 'local/pins2/s4/builder-2'; const [W, H] = (A.size || '1480x834').split('x').map(Number);
const GSEL = A.gates ? A.gates.split(',') : L.GATES.map((g) => g[0]); const LABEL = A.label || 'structure';
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/structure'); fs.mkdirSync(OUT, { recursive: true });
const BD = path.join(__dirname, '..', 'bd');

// in the page: candidates per class, each with the CSS properties whose winning declaration we want located
const SCAN = (id) => {
  const M = window.BD.measure; const s = document.getElementById(id); const out = []; const cs = getComputedStyle; const px = (v) => parseFloat(v) || 0;
  const vis = (e) => { const r = e.getBoundingClientRect(); const c = cs(e); return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none'; };
  const hidden = (e) => { for (let x = e; x && x !== s; x = x.parentElement) { const c = cs(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return true; } return false; };
  const sel = (e) => { const p = []; for (let x = e; x && x !== s && p.length < 4; x = x.parentElement) p.unshift(x.tagName.toLowerCase() + (x.classList.length ? '.' + [...x.classList].slice(0, 3).join('.') : '')); return p.join(' > '); };
  const txt = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  // marks from an earlier view are cleared first: a stale 's1' left on another element made the cascade lookup report THAT element's rule
  // (the prescan worker found the 64px label width cited on a drawer, 2026-10-04 00:07 EDT)
  for (const x of document.querySelectorAll('[data-bd-s]')) delete x.dataset.bdS;
  let n = 0; const mark = (e) => { if (!e.dataset.bdS) e.dataset.bdS = 's' + ++n; return e.dataset.bdS; };
  const add = (cls, e, props, info, pseudo) => out.push({ cls, mark: mark(e), sel: sel(e) + (pseudo ? '::' + pseudo : ''), text: txt(e), props, info, pseudo: pseudo || null });
  const flexy = (e) => e && /flex|grid/.test(cs(e).display);
  const paints = (c) => (c.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor) || ['Top', 'Right', 'Bottom', 'Left'].some((k) => px(c['border' + k + 'Width']) > 0 && c['border' + k + 'Style'] !== 'none') || c.boxShadow !== 'none' || (c.maskImage && c.maskImage !== 'none') || (c.webkitMaskImage && c.webkitMaskImage !== 'none') || (c.outlineStyle !== 'none' && px(c.outlineWidth) > 0));
  for (const e of s.querySelectorAll('*')) {
    if (e instanceof SVGElement && e.tagName !== 'svg') continue; if (!vis(e) || hidden(e)) continue;
    // screen-reader-only elements are not things on the page (a 1px clipped box)
    { const r0 = e.getBoundingClientRect(); if (r0.width <= 1.01 && r0.height <= 1.01) continue; }
    const c = cs(e);
    if (flexy(e) && M.sharedGap) { const g = M.sharedGap(e); if (g) add('shared-gap', e, ['column-gap', 'gap', 'margin-right'], `label "${txt(g.label)}" + ${g.items.length} ${g.role}; gap ${g.gap}, label margin ${g.labelMargin}`); }
    const mg = ['Top', 'Right', 'Bottom', 'Left'].map((k) => [k, px(c['margin' + k])]).filter(([, v]) => Math.abs(v) >= 0.01);
    if (mg.length && !/absolute|fixed/.test(c.position)) add('margin', e, mg.map(([k]) => 'margin-' + k.toLowerCase()), mg.map(([k, v]) => `${k.toLowerCase()} ${v}${v < 0 ? ' (pull)' : ''}`).join(', ') + (flexy(e.parentElement) ? ' · in a flex/grid box' : ''));
    if (c.transform !== 'none' && !e.getAnimations().length) { const m = c.transform.match(/matrix\(([^)]+)\)/); const t = m ? m[1].split(',').map(Number) : null; if (!t || Math.abs(t[4]) > 0.001 || Math.abs(t[5]) > 0.001) add('nudge', e, ['transform', 'translate'], 'transform ' + c.transform); }
    if (c.translate && c.translate !== 'none' && !e.getAnimations().length) add('nudge', e, ['translate'], 'translate ' + c.translate);
    if (c.position === 'relative' && ['top', 'left', 'right', 'bottom'].some((k) => c[k] !== 'auto' && Math.abs(px(c[k])) > 0.001)) add('nudge', e, ['top', 'left', 'right', 'bottom', 'inset'], 'relative offset ' + ['top', 'left', 'right', 'bottom'].filter((k) => c[k] !== 'auto' && px(c[k])).map((k) => `${k} ${c[k]}`).join(' '));
    const hasText = [...e.childNodes].some((x) => x.nodeType === 3 && x.nodeValue.trim());
    // centring by line box: a painted box (a chip, a badge) whose one line of text is as tall as its content box, set by line-height rather than by alignment
    if (hasText && c.lineHeight !== 'normal' && paints(c)) { const lh = px(c.lineHeight); const h = e.getBoundingClientRect().height - px(c.paddingTop) - px(c.paddingBottom) - px(c.borderTopWidth) - px(c.borderBottomWidth); if (lh > px(c.fontSize) * 1.25 && Math.abs(lh - h) < 0.6 && h > 0) add('nudge', e, ['line-height', 'font'], `line-height ${c.lineHeight} = its height ${h.toFixed(2)} (font ${c.fontSize})`); }
    if (!/^(img|svg|input|textarea|select|video|canvas|iframe)$/i.test(e.tagName)) add('magic-size?', e, ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'flex-basis', 'flex', 'grid-template-columns', 'grid-template', 'inline-size', 'block-size', 'min-inline-size', 'min-block-size'], '');
    const r = e.getBoundingClientRect();
    if (!e.children.length && !txt(e) && !paints(c) && !/^(img|svg|input|textarea|select|video|canvas|iframe|br|hr|use)$/i.test(e.tagName) && (r.width >= 1 || r.height >= 1) && flexy(e.parentElement) && !/absolute|fixed/.test(c.position)) add('spacer', e, ['width', 'height', 'flex', 'flex-grow', 'flex-basis', 'margin'], `empty box ${r.width.toFixed(1)}×${r.height.toFixed(1)}`);
    for (const pe of ['::before', '::after']) { const p = cs(e, pe); if (p.content === 'none' || p.content === 'normal' || p.display === 'none') continue; const txtc = /^["'](.*)["']$/.exec(p.content); const pw = px(p.width), ph = px(p.height);
      if (p.position !== 'absolute' && p.position !== 'fixed' && !paints(p) && !(txtc && txtc[1].trim()) && (pw >= 1 || ph >= 1 || px(p.marginLeft) || px(p.marginRight) || px(p.paddingLeft) || px(p.paddingRight) || p.flexGrow !== '0')) add('spacer', e, ['width', 'height', 'flex', 'flex-grow', 'margin', 'padding', 'content'], `${pe} takes ${pw}×${ph} and paints nothing`, pe.slice(2)); }
    if (M.textHolder && M.textHolder(e)) add('wrapper-text', e, ['font-size', 'line-height', 'text-align', 'width'], 'text holder: the text sits in a wrapper with the same type');
    if (M.alignedBox) { try { const ab = M.alignedBox(e); if (ab) add('wrapper-text', e, ['text-align', 'width', 'min-width'], `aligned by its wrapper (${c.textAlign}, width ${c.width})`); } catch (x) {} }
  }
  return out;
};

const LONGHAND = { 'margin-top': ['margin', 'margin-block', 'margin-block-start'], 'margin-bottom': ['margin', 'margin-block', 'margin-block-end'], 'margin-left': ['margin', 'margin-inline', 'margin-inline-start'], 'margin-right': ['margin', 'margin-inline', 'margin-inline-end'],
  top: ['inset', 'inset-block', 'inset-block-start'], bottom: ['inset', 'inset-block', 'inset-block-end'], left: ['inset', 'inset-inline', 'inset-inline-start'], right: ['inset', 'inset-inline', 'inset-inline-end'],
  'flex-basis': ['flex'], 'flex-grow': ['flex'], 'column-gap': ['gap'], 'line-height': ['font'], 'grid-template-columns': ['grid-template', 'grid'], width: ['inline-size'], height: ['block-size'], 'min-width': ['min-inline-size'], 'min-height': ['min-block-size'] };
const MAGIC = /^(width|min-width|max-width|height|min-height|max-height|flex-basis|flex|grid-template-columns|grid-template|inline-size|block-size|min-inline-size|min-block-size)$/;
async function locate(cdp, sheets, nodeId, props, pseudo) {
  const m = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
  let rules = m.matchedCSSRules || []; if (pseudo) { const pe = (m.pseudoElements || []).find((x) => x.pseudoType === pseudo); rules = pe ? pe.matches : []; }
  const cands = []; if (!pseudo && m.inlineStyle) cands.push({ style: m.inlineStyle, where: 'inline style', sel: 'style=""' });
  rules.forEach((r, i) => { if (r.rule.origin !== 'regular') return; const sh = sheets.get(r.rule.style.styleSheetId); cands.push({ order: i, style: r.rule.style, where: sh ? `${sh}:${(r.rule.style.range ? r.rule.style.range.startLine : 0) + 1}` : '?', sel: r.rule.selectorList.text }); });
  const found = [];
  for (const prop of props) {
    const names = [prop, ...(LONGHAND[prop] || [])]; let best = null;
    for (const c of cands) for (const d of c.style.cssProperties || []) { if (!names.includes(d.name) || d.disabled || !d.range) continue; const imp = !!d.important; const rank = (imp ? 1e6 : 0) + (c.where === 'inline style' ? 5e5 : c.order);
      if (!best || rank >= best.rank) best = { rank, prop: d.name, value: d.value, where: c.where, sel: c.sel, line: c.where === 'inline style' ? null : (d.range.startLine + 1) }; }
    if (best) { const sh = best.where.split(':')[0]; found.push({ prop: best.prop, value: best.value, at: best.line ? `${sh}:${best.line}` : best.where, sel: best.sel.slice(0, 120) }); }
  }
  return found.filter((f, i, a) => a.findIndex((g) => g.prop === f.prop && g.at === f.at) === i);
}

(async () => {
  const { server, base } = await L.serve(); const b = await L.launch(W, H); const report = { kit: KIT, size: `${W}x${H}`, gates: {} };
  try {
    const K = await L.openKit(b, base, KIT, W, H); const cdp = await K.p.createCDPSession(); const sheets = new Map();
    cdp.on('CSS.styleSheetAdded', (e) => { const u = e.header.sourceURL || ''; sheets.set(e.header.styleSheetId, u ? path.relative(path.join(ROOT, KIT), path.join(ROOT, new URL(u).pathname)) : 'inline <style>'); });
    const inject = async () => { for (const f of ['rules.js', 'identity.js', 'roles.js', 'measure.js']) await K.p.addScriptTag({ content: fs.readFileSync(path.join(BD, f), 'utf8') }); await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); await cdp.send('DOM.getDocument', { depth: -1 }); };
    for (const G of L.GATES.filter((g) => GSEL.includes(g[0]))) {
      const [gid, id] = G; const seen = new Map();
      const scanView = async (view) => {
        await L.scrollTo(K, id); const items = await K.p.evaluate(SCAN, id); const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
        for (const it of items) {
          // node ids through this CDP session's own DOM agent: a puppeteer handle's objectId belongs to another session
          const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-bd-s="${it.mark}"]` }); if (!nodeId) continue;
          let src = await locate(cdp, sheets, nodeId, it.props, it.pseudo);
          if (it.cls === 'magic-size?') { src = src.filter((f) => MAGIC.test(f.prop) && /\d(px|em|rem|ch|ex)\b/.test(f.value) && !/\bvar\(|%|auto|fit-content|max-content|min-content/.test(f.value.replace(/calc\([^)]*\)/, (x) => (/\dpx/.test(x) ? x : '')))); if (!src.length) continue; it.cls = 'magic-size'; it.info = src.map((f) => `${f.prop}: ${f.value}`).join('; '); }
          const k = `${it.cls}|${it.sel}|${src.map((f) => f.at + f.prop).join(',')}`; if (!seen.has(k)) seen.set(k, { ...it, src, views: [view] }); else seen.get(k).views.push(view);
        }
      };
      await inject(); await scanView('rest');
      if (A.views) { const acts = await L.actions(K.p, id); for (const [n, [kind, i, label]] of acts.entries()) { const key = `${n + 1}-${kind}-${label}`; if (A.views !== true && !new RegExp(A.views).test(key)) continue; await L.act(K, id, kind, i); await scanView(key); } await K.load(); }
      const list = [...seen.values()].map(({ mark, props, pseudo, ...r }) => r); const counts = {}; for (const r of list) counts[r.cls] = (counts[r.cls] || 0) + 1;
      report.gates[gid] = { counts, list }; console.log(`${gid}: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'}`);
    }
  } finally { await b.close(); server.close(); }
  const jf = path.join(OUT, `${LABEL}.json`); fs.writeFileSync(jf, JSON.stringify(report, null, 1));
  const md = [`# Structure: ${KIT} at ${report.size}`, '', ...Object.entries(report.gates).flatMap(([g, r]) => [`## ${g}`, '', '| Class | Element | Text | What | Source |', '|---|---|---|---|---|', ...r.list.map((x) => `| ${x.cls} | \`${x.sel.replace(/\|/g, '\\|')}\` | ${x.text.replace(/\|/g, '/')} | ${x.info.replace(/\|/g, '/')} | ${x.src.map((f) => `${f.at} \`${f.prop}: ${f.value}\``).join('<br>').replace(/\|/g, '\\|') || '—'} |`), ''])];
  fs.writeFileSync(path.join(OUT, `${LABEL}.md`), md.join('\n')); console.log(`report ${path.relative(ROOT, jf)}`); process.exit(0);
})().catch((e) => { console.error('structure failed:', e && e.stack || e); process.exit(2); });
