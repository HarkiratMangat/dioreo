// One read of the facts the 2026-10-08 11:38 EDT round needs, before building: every field's height, corner, icon, gaps and text on the spec page AND on the
// board; which realms the board draws and their colour tokens; what the Text section's samples compute to today. Usage: node fact-sweep.cjs → prints JSON
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const BASE = 'http://127.0.0.1:8900/docs/pins2/s4-board/'; const STATE = path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const FIELD = (root) => { const out = []; for (const f of document.querySelectorAll(root)) { const c = getComputedStyle(f); const r = f.getBoundingClientRect(); const ic = f.querySelector('svg'); const inp = f.querySelector('input'); const ip = inp && getComputedStyle(inp);
  const icr = ic && ic.getBoundingClientRect(); const ir = inp && inp.getBoundingClientRect();
  const A = (x) => { const m = /\(([^)]*)\)/.exec(x || ''); if (!m) return 1; const q = m[1].replace(/^srgb\s+/, '').split(/[\s,/]+/).filter(Boolean); return q.length > 3 ? parseFloat(q[3]) : 1; }; let skin = null;
  for (const el of [f, ...f.querySelectorAll('*')]) for (const ps of [null, '::before', '::after']) { const k = getComputedStyle(el, ps); if (ps && (k.content === 'none' || k.content === 'normal')) continue; const vis = (parseFloat(k.borderTopWidth) > 0 && k.borderTopStyle !== 'none' && A(k.borderTopColor) > 0.01) || /inset/.test(k.boxShadow) || A(k.backgroundColor) > 0.01; if (!vis) continue; const bb = ps ? { width: parseFloat(k.width) || 0, height: parseFloat(k.height) || 0 } : el.getBoundingClientRect(); const ar = bb.width * bb.height; if (!skin || ar > skin.a) skin = { a: ar, h: +bb.height.toFixed(1), radius: k.borderTopLeftRadius, edge: k.borderTopWidth + ' ' + (/inset/.test(k.boxShadow) ? 'inset' : ''), at: (el === f ? 'self' : el.className && String(el.className).slice(0, 20)) + (ps || '') }; }
  out.push({ skin, cls: String(f.className).slice(0, 40), h: +r.height.toFixed(1), w: +r.width.toFixed(1), radius: c.borderTopLeftRadius, border: c.borderTopWidth, icon: icr && +icr.width.toFixed(1), iconLeft: icr && +(icr.left - r.left).toFixed(1), iconToInput: icr && ir ? +(ir.left - icr.right).toFixed(1) : null, font: ip && `${ip.fontSize} ${ip.fontWeight} ${ip.fontFamily.split(',')[0]}`, padL: ip && ip.paddingLeft }); } return out; };
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 180000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'fs-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 1500 });
  await p.goto(BASE + 'spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await p.evaluate(() => document.fonts.ready);
  const spec = await p.evaluate((F) => { const FIELD = eval(F);
    const fields = FIELD('#fields .srch, #fields .f-pick, #fields .cx-pick');
    const text = [...document.querySelectorAll('#text .ts')].map((row) => ({ k: row.querySelector('.ts-k').textContent, samples: [...row.querySelectorAll('.ts-s, .ts-m, .ts-d')].map((e) => { const c = getComputedStyle(e); return { cls: e.className, text: e.textContent, size: c.fontSize, line: c.lineHeight, track: c.letterSpacing, weight: c.fontWeight, family: c.fontFamily.split(',')[0], tt: c.textTransform }; }) }));
    return { fields, text }; }, '(' + FIELD.toString() + ')');
  await p.setViewport({ width: 1500, height: 900 });
  await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); } catch (e) {} }, fs.existsSync(STATE) ? fs.readFileSync(STATE, 'utf8') : '');
  await p.goto(BASE + 'builder.html', { waitUntil: 'networkidle0', timeout: 120000 }); await new Promise((r) => setTimeout(r, 2500));
  const board = await p.evaluate((F) => { const FIELD = eval(F); const realms = [...new Set([...document.querySelectorAll('[data-realm]')].map((e) => e.dataset.realm))];
    const tok = {}; const cs = getComputedStyle(document.documentElement); for (const r of ['season', 'armory', 'broadcast', 'review', 'access', 'analytics', 'history', 'home']) tok[r] = cs.getPropertyValue('--r-' + r).trim();
    return { realms, tokens: tok, fields: FIELD('.srch, .f-pick, .cx-pick') }; }, '(' + FIELD.toString() + ')');
  console.log(JSON.stringify({ spec, board }, null, 1)); await b.close();
})();
