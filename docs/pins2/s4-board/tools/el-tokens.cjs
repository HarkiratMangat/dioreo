// Session 4 · every custom property set on :root (or html) in Board 4's and the portal's own stylesheets, resolved, for the element board.
// tokens.md lists what the kit's four stylesheets READ; the base palette (--sunk, --paper, --ink…) is SET by the portal's stylesheet that
// Board 4 also loads, so a list from tokens.md alone left Board 4's commonest ground with "no token" (2026-10-02 19:40 EDT).
// Run with repo-static on :8900 and the harness on :8901:  node local/pins2/s4/work/lead/el-tokens.cjs  → el/tokens.json
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs')); const PW = require('./portal-walk.cjs');
const READ = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], +(d[3] / 255).toFixed(3)]; };
  const names = new Set(); const walk = (rs) => { for (const r of rs) { if (r.selectorText && /(^|,)\s*(:root|html)(?![\w-])/.test(r.selectorText)) for (let i = 0; i < r.style.length; i++) if (r.style[i].startsWith('--')) names.add(r.style[i]); if (r.cssRules) walk(r.cssRules); } };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} }
  return [...names].sort().map((n) => { const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); const isCol = /^(#|rgb|hsl|oklch|oklab|color\(|color-mix|lab|lch|hwb)/i.test(v);
    return { name: n, scope: ':root', value: v.slice(0, 160), rgba: isCol ? rgba(v) : null }; }); };
(async () => {
  const out = {};
  { const { b, p } = await W.open(); out.b4 = await p.evaluate(READ); await b.close(); }
  { const { b, p } = await PW.open(); await PW.load(p, 'home'); out.portal = await p.evaluate(READ); await b.close(); }
  fs.writeFileSync(path.join(__dirname, 'el', 'tokens.json'), JSON.stringify(out));
  console.log(`Board 4: ${out.b4.length} tokens on :root (${out.b4.filter((t) => t.rgba).length} colours) · portal: ${out.portal.length} (${out.portal.filter((t) => t.rgba).length} colours)`);
})().catch((e) => { console.error(e); process.exit(1); });
