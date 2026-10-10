// Why a clone on the spec page measures differently from the board: the style rules that match the board's button but not its clone (the clone's chain
// lost the context those rules need: a sibling, a position, an ancestor the chain left out). Usage: node clone-diff.cjs "<sel>" ... (board-dom.json selectors)
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const SELS = process.argv.slice(2); const STATE = path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const RULES = (sel, scope) => { const PROPS = /^(padding|border-radius|border-top-left-radius|height|min-height|width|min-width|max-width|gap|column-gap|font-size|font-weight|line-height|flex|inline-size|block-size)/;
  const e = [...document.querySelectorAll(scope ? scope + ' ' + sel : sel)].find((x) => x.getClientRects().length && !x.closest('[class*="sx-"], #bd-host')); if (!e) return null; const out = [];
  const walk = (list, media) => { for (const r of list) { if (r.cssRules && !r.selectorText) { walk(r.cssRules, (r.conditionText || r.name || '') + ' ' + media); continue; } if (!r.selectorText) continue; const s = r.selectorText.replace(/::?(before|after|placeholder|selection|marker)\b/g, '');
      let ok = false; try { ok = e.matches(s); } catch (x) { ok = false; } if (!ok) continue; const props = [...r.style].filter((p) => PROPS.test(p)).map((p) => `${p}: ${r.style.getPropertyValue(p)}`); if (props.length) out.push(`${r.selectorText.slice(0, 140)} { ${props.join('; ').slice(0, 160)} }${media.trim() ? ' @' + media.trim() : ''}`); } };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules, ''); } catch (x) {} } return out; };
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 240000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'cd-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1500, height: 1500 }); await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(STATE, 'utf8'));
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 120000 }); await p.waitForFunction(() => window.__sxReady, { timeout: 60000 }); await sleep(1500);
  const board = {}; for (const s of SELS) board[s] = await p.evaluate(RULES, s, null);
  const q = await b.newPage(); await q.setViewport({ width: 1282, height: 1400 }); q.on('requestfailed', (r) => console.log('FAILED', r.url())); q.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
  await q.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await q.waitForFunction(() => window.__specReady, { timeout: 30000 }); await sleep(2500);
  for (const s of SELS) { const spec = await q.evaluate((s) => { const w = document.querySelector(`#onboard [data-bsel="${s}"]`); if (!w) return null; w.setAttribute('data-cd', '1'); return true; }, s); const here = spec && await q.evaluate(RULES, s.replace(/^button/, 'button'), '[data-cd="1"]');
    await q.evaluate(() => document.querySelectorAll('[data-cd]').forEach((x) => x.removeAttribute('data-cd')));
    const B = board[s] || [], H = here || []; console.log(`\n== ${s}: ${B.length} rules on the board, ${H.length} on the clone`); for (const r of B) if (!H.includes(r)) console.log('  board only:', r); for (const r of H) if (!B.includes(r)) console.log('  clone only:', r); }
  await b.close();
})().catch((e) => { console.error('clone-diff FAIL', e.message); process.exit(1); });
