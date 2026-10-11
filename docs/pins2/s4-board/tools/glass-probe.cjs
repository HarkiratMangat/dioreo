// The field magnifiers, his 2026-10-08 21:44 EDT "the icons are still different, despite your measurement stating 16px": each field's glass — its icon
// (sprite symbol and viewBox), stroke width, colour and the INK it draws (the path's box scaled into the 16 px box), not the svg box — and a 2× clip.
// Usage: node glass-probe.cjs → spec-check/glass-<field>.png
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'gl-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 1400, deviceScaleFactor: 2 }); await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await sleep(2500);
  const FIELDS = [['filter', '#fields .fl-filter'], ['wep', '#fields .fl-wep'], ['att', '#fields .fl-att'], ['cmp', '#fields .fl-cmp']];
  for (const [k, sel] of FIELDS) {
    const r = await p.evaluate((sel) => { const w = document.querySelector(sel); const f = w && (w.querySelector('.f-fld') || w.querySelector('.srch')); if (!f) return null; const r0 = f.getBoundingClientRect();
      const s = [...f.querySelectorAll('svg')].find((x) => x.getClientRects().length && !x.closest('button') && x.getBoundingClientRect().left < r0.left + r0.width / 2); if (!s) return null;
      const u = s.querySelector('use'); const href = u && u.getAttribute('href'); const sym = href && document.querySelector(href); const q = s.getBoundingClientRect(); const cs = getComputedStyle(s);
      const vb = sym && sym.getAttribute('viewBox'); const vw = vb ? parseFloat(vb.split(/\s+/)[2]) : q.width; const sc = q.width / vw; const bb = u && u.getBBox();
      const paths = sym ? [...sym.children].map((c) => c.tagName + ' ' + [...c.attributes].map((a) => `${a.name}=${a.value}`).join(' ')).join(' | ') : '';
      s.scrollIntoView({ block: 'center' }); const q2 = s.getBoundingClientRect();
      return { info: `svg ${q.width.toFixed(2)}×${q.height.toFixed(2)} · ${href} viewBox ${vb} · class "${s.getAttribute('class')}" · stroke-width ${cs.strokeWidth} (symbol attr ${sym && sym.getAttribute('stroke-width')}) · drawn stroke ${(parseFloat(cs.strokeWidth) * sc).toFixed(2)}px · colour ${cs.color} · ink ${bb ? (bb.width * sc).toFixed(2) + '×' + (bb.height * sc).toFixed(2) : '?'} · vector-effect ${cs.vectorEffect} · inline style "${s.getAttribute('style') || ''}"\n    shapes: ${paths.slice(0, 260)}`, clip: { x: q2.left - 4 + scrollX, y: q2.top - 4 + scrollY, width: q2.width + 8, height: q2.height + 8 } }; }, sel);   /* page coordinates */
    if (!r) { console.log(k, 'no glass'); continue; } console.log(`${k}: ${r.info}`); await p.screenshot({ path: path.join(__dirname, 'spec-check', `glass-${k}.png`), clip: r.clip }); }
  // and the rules that set each glass's size and stroke (why they differ)
  console.log(await p.evaluate(() => { const out = []; for (const [k, sel] of [['filter', '#fields .fl-filter .srch > svg'], ['wep', '#fields .fl-wep .f-fld svg']]) { const e = document.querySelector(sel); if (!e) continue; const walk = (list) => { for (const r of list) { if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; } if (!r.selectorText) continue; let hit = false; try { hit = e.matches(r.selectorText); } catch (x) {} if (!hit) continue; const props = [...r.style].filter((q) => /^(width|height|stroke|stroke-width|color|transform|scale)/.test(q)).map((q) => `${q}: ${r.style.getPropertyValue(q)}`); if (props.length) out.push(`${k} | ${r.selectorText.slice(0, 110)} { ${props.join('; ')} }`); } }; for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (x) {} } } return out.join('\n'); }));
  await b.close();
})().catch((e) => { console.error('glass-probe FAIL', e.message); process.exit(1); });
