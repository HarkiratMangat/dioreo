// Session 4 · which rules set a property on an element, with a pseudo-state forced: the cascade as the page sees it.
// Usage: node rules.cjs '<gate>|<state or ->|<click or ->|<selector>|<hover|->|<prop,prop>' [after.css]
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const [gate, st, click, sel, pseudo, props] = process.argv[2].split('|'); const css = process.argv[3] ? fs.readFileSync(process.argv[3], 'utf8') : null;
(async () => {
  const { b, p } = await W.open(); await p.setRequestInterception(true); p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  if (st !== '-') { const ok = await W.setState(p, gate, st); if (!ok) { const acts = await W.actions(p, gate); const t = acts.find((a) => a[2] === st); if (t) await W.act(p, gate, t[0], t[1]); } }
  if (click !== '-') await W.clickReal(p, `#${gate} ${click}`);
  if (css) await p.addStyleTag({ content: css });
  const c = await p.target().createCDPSession(); await c.send('DOM.enable'); await c.send('CSS.enable');
  const { root } = await c.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await c.send('DOM.querySelector', { nodeId: root.nodeId, selector: `#${gate} ${sel}` });
  if (!nodeId) { console.log('no node'); await b.close(); return; }
  if (pseudo !== '-') await c.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [pseudo] });
  const m = await c.send('CSS.getMatchedStylesForNode', { nodeId }); const want = props.split(',');
  for (const r of m.matchedCSSRules || []) { const decl = r.rule.style.cssProperties.filter((d) => want.some((w) => d.name === w || d.name.startsWith(w + '-')) && d.text); if (!decl.length) continue;
    console.log(`${r.rule.selectorList.text.slice(0, 160)}  [${(r.rule.styleSheetId || '').slice(-4)} ${r.rule.origin}]\n    ${decl.map((d) => d.text).join(' ')}`); }
  const comp = await c.send('CSS.getComputedStyleForNode', { nodeId }); console.log('COMPUTED', comp.computedStyle.filter((x) => want.includes(x.name)).map((x) => `${x.name}: ${x.value}`).join(' · '));
  await b.close();
})().catch((e) => { console.error(e); process.exit(2); });
