// Session 4 · the relational probe: for a Board 4 element, every node of its subtree to a depth, with its box relative to the root,
// its own type and layout properties, and the CSS rule (selector + stylesheet) that sets each layout property — so a fork's settings
// are derived from what Board 4 measures AND from the mechanism that produces it (a grid track, a gap, a margin, a width).
// Why: Harkirat, 2026-10-02 13:05 EDT — the label→control gap, "THE MAIN PART OF THE FORK", had no setting, because every tool I had
// measured an element's own style and never its distance to a neighbour. See local/pins2/s4/board/REBUILD.md, C3.
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/rel-probe.cjs <spec.json> <out.json> [depth]
// spec: [{ id, gate, sel, nth?, contains?, state?, try?, click?, expect? }]
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const [specF, outF, depthArg] = process.argv.slice(2); const SPEC = JSON.parse(fs.readFileSync(specF, 'utf8')); const DEPTH = +depthArg || 3;
const LAYOUT = ['grid-template-columns', 'grid-template-rows', 'column-gap', 'row-gap', 'gap', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'width', 'min-width', 'height', 'justify-self', 'align-self', 'text-align', 'justify-content', 'align-items', 'font-size', 'font-weight', 'letter-spacing', 'font-family', 'color', 'line-height', 'text-transform', 'flex', 'flex-basis', 'border-radius', 'background-color', 'box-shadow', 'border-color', 'border-width'];
(async () => {
  const { b, p } = await W.open(); await W.sleep(900);
  await p.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' }); await W.sleep(200);
  const cdp = await p.target().createCDPSession(); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const out = {};
  for (const s of SPEC) {
    if (s.state) { await W.setState(p, s.gate, s.state); await W.sleep(700); }
    if (s.try) { await p.evaluate((s) => { const bt = [...document.querySelectorAll(`#${s.gate} .b4-try button`)].find((x) => x.textContent.trim() === s.try); if (bt) bt.click(); }, s); await W.sleep(900); }
    if (s.click) { for (let k = 0; k < 2; k++) { const open = await p.evaluate((s) => { const g = document.getElementById(s.gate); const e = s.expect && g && g.querySelector(s.expect); return !!e && e.getBoundingClientRect().height > 2; }, s); if (open) break; await p.evaluate((s) => { const e = document.querySelector('#' + s.gate + ' ' + s.click); if (e) e.click(); }, s); await W.sleep(800); } }
    const nodes = await p.evaluate((s, DEPTH) => {
      document.querySelectorAll('[data-rp]').forEach((x) => x.removeAttribute('data-rp'));
      const g = document.getElementById(s.gate) || document; const el = [...g.querySelectorAll(s.sel)].filter((x) => !s.contains || (x.textContent || '').toLowerCase().includes(s.contains.toLowerCase()))[s.nth || 0];
      if (!el) return null; el.scrollIntoView({ block: 'center' }); const R = el.getBoundingClientRect(); const list = []; let n = 0;
      const walk = (e, d) => { if (d > DEPTH || e.nodeType !== 1) return; const cs = getComputedStyle(e); if (cs.display === 'none') return; const r = e.getBoundingClientRect(); const id = 'n' + (n++); e.setAttribute('data-rp', id);
        const own = [...e.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent).join('').replace(/\s+/g, ' ').trim().slice(0, 24);
        list.push({ id, d, tag: e.tagName.toLowerCase(), cls: (typeof e.className === 'string' ? e.className : (e.className && e.className.baseVal) || '').trim(), text: own, x: +(r.x - R.x).toFixed(1), y: +(r.y - R.y).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
          cs: { display: cs.display, gtc: cs.gridTemplateColumns, cg: cs.columnGap, rg: cs.rowGap, fs: cs.fontSize, fw: cs.fontWeight, ff: cs.fontFamily.split(',')[0].replace(/"/g, ''), ls: cs.letterSpacing, tt: cs.textTransform, ta: cs.textAlign, js: cs.justifySelf, col: cs.color, lh: cs.lineHeight, m: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].join(' '), pd: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' ') } });
        if (e.tagName.toLowerCase() !== 'svg') [...e.children].forEach((c) => walk(c, d + 1)); };
      walk(el, 0); return list;
    }, s, DEPTH);
    if (!nodes) { console.log(`${s.id}: NOT FOUND`); continue; }
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    for (const nd of nodes) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-rp="${nd.id}"]` }); if (!nodeId) continue;
      const m = await cdp.send('CSS.getMatchedStylesForNode', { nodeId }); const src = {};
      for (const rm of (m.matchedCSSRules || [])) {
        const sel = rm.rule.selectorList.selectors.filter((_, i) => rm.matchingSelectors.includes(i)).map((x) => x.text).join(', ');
        const sheet = (rm.rule.styleSheetId && rm.rule.origin === 'regular') ? (rm.rule.style.range ? '' : '') : rm.rule.origin;
        for (const pr of rm.rule.style.cssProperties) if (LAYOUT.includes(pr.name) && !pr.disabled && pr.value !== undefined && (pr.range || pr.implicit === false)) src[pr.name] = `${pr.value}  ← ${sel}${sheet ? ' [' + sheet + ']' : ''}`;
      }
      if (m.inlineStyle) for (const pr of m.inlineStyle.cssProperties) if (LAYOUT.includes(pr.name) && pr.value) src[pr.name] = `${pr.value}  ← inline`;
      nd.src = src;
    }
    out[s.id] = nodes; console.log(`== ${s.id} (${nodes.length} nodes)`);
    for (const nd of nodes) {
      console.log(`${'  '.repeat(nd.d)}${nd.tag}.${nd.cls.split(/\s+/).slice(0, 3).join('.')}${nd.text ? ' "' + nd.text + '"' : ''} @${nd.x},${nd.y} ${nd.w}x${nd.h} | ${nd.cs.display} fs ${nd.cs.fs} fw ${nd.cs.fw} ls ${nd.cs.ls} ta ${nd.cs.ta}${nd.cs.gtc !== 'none' ? ' gtc ' + nd.cs.gtc : ''}${nd.cs.cg !== 'normal' ? ' cg ' + nd.cs.cg : ''}${nd.cs.rg !== 'normal' ? ' rg ' + nd.cs.rg : ''} m ${nd.cs.m} p ${nd.cs.pd}`);
      for (const [k, v] of Object.entries(nd.src || {})) if (/grid-template|gap|margin|padding|width|justify|text-align|flex/.test(k)) console.log(`${'  '.repeat(nd.d)}    · ${k}: ${v.slice(0, 160)}`);
    }
  }
  fs.writeFileSync(outF, JSON.stringify(out, null, 1));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
