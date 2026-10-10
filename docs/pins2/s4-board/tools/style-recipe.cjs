// Our wash and tint, read off the Styles section's live buttons (the warn wrapper): every rule that paints them (fill, outline, ring, words) with its
// declared expression, and the measured result at rest and under a real mouse. The Filled-at-rest section lays these same expressions on the board's
// buttons with each one's own accent. Usage: node style-recipe.cjs
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sr-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 1400 }); await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await sleep(2500);
  console.log(await p.evaluate(() => { const out = []; for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; } for (const r of rs) if (r.selectorText && /warnwrap/.test(r.selectorText)) out.push('WRAP ' + r.cssText.slice(0, 400)); } return out.join('\n'); }));
  for (const k of ['wash', 'tint']) {
    const sel = `.ss-live[data-states="${k}"] button`;
    const rules = await p.evaluate((sel) => { const e = document.querySelector(sel); const out = []; const P = /^(background|background-color|box-shadow|border|border-color|border-top-color|border-width|color|outline|--)/;
      const walk = (list) => { for (const r of list) { if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; } if (!r.selectorText) continue; for (const part of r.selectorText.split(/,(?![^(]*\))/)) { const base = part.trim().replace(/::?(before|after)\b/g, '').replace(/:hover|:active|:focus-visible/g, ''); let hit = false; try { hit = e.matches(base); } catch (x) {} if (!hit) continue; const props = [...r.style].filter((q) => P.test(q)).map((q) => `${q}: ${r.style.getPropertyValue(q)}`); if (props.length) out.push(`${part.trim().slice(0, 110)} { ${props.join('; ').slice(0, 300)} }`); break; } } };
      for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (x) {} } return out; }, sel);
    console.log(`\n== ${k}: ${rules.length} rules`); rules.forEach((x) => console.log('  ' + x));
    const xy = await p.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
    const read = () => p.evaluate((sel) => { const e = document.querySelector(sel); const N = window.__inkName; const c = getComputedStyle(e), bf = getComputedStyle(e, '::before'); return `fill ${N(c.backgroundColor)} · border ${c.borderTopWidth} ${N(c.borderTopColor)} · ring ${c.boxShadow.slice(0, 90)} · words ${N(c.color)} · ::before ${bf.content !== 'none' ? N(bf.backgroundColor) + ' ' + bf.boxShadow.slice(0, 60) : '—'}`; }, sel);
    await p.mouse.move(2, 2); await sleep(300); console.log('  REST  ' + await read()); await p.mouse.move(xy.x, xy.y); await sleep(500); console.log('  HOVER ' + await read()); }
  await b.close();
})().catch((e) => { console.error('style-recipe FAIL', e.message); process.exit(1); });
