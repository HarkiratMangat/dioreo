// What Builder-2 draws, counted (2026-10-08 15:40 EDT, before Session 4's autonomous spec-board run): every drawn control and every text style on
// builder.html with his state, in three states of the page — at rest, with the New build drawer open, with the Post announcement drawer open and its
// date picker opened. Controls are grouped by their class signature; text by family · size · weight · case · tracking · line height · ink.
// Usage: node inventory.cjs → work/lead/inventory.json and a short summary on stdout
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const BASE = 'http://127.0.0.1:8900/docs/pins2/s4-board/'; const STATE = path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const READ = () => {
  const vis = (e) => { if (!e.getClientRects().length) return false; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const c = getComputedStyle(e); return c.visibility !== 'hidden' && +c.opacity > 0.02; };
  const gate = (e) => { const g = e.closest('[id^=c-], .drawer, [role=dialog], [role=listbox], [role=menu]'); return g ? (g.id || (g.getAttribute('role') ? g.getAttribute('role') : String(g.className).split(' ').slice(0, 2).join('.'))) : 'page'; };
  const sig = (e) => e.tagName.toLowerCase() + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(/\s+/).filter((c) => c && !/^(on|open|is-|has-|active|sel|lit|b4-pulse|closed|filled)/.test(c)).sort().join('.');
  const ctrls = {}; const add = (kind, e) => { const k = kind + ' ' + sig(e); const r = e.getBoundingClientRect(); const o = ctrls[k] || (ctrls[k] = { kind, sig: sig(e), n: 0, h: new Set(), w: new Set(), gates: new Set(), sample: [] }); o.n++; o.h.add(Math.round(r.height)); o.w.add(Math.round(r.width)); o.gates.add(gate(e)); if (o.sample.length < 3) o.sample.push((e.getAttribute('aria-label') || e.textContent || e.value || '').replace(/\s+/g, ' ').trim().slice(0, 28)); };
  for (const e of document.querySelectorAll('button, [role=button], a[href]')) if (vis(e)) add('button', e);
  for (const e of document.querySelectorAll('input, textarea, select, [contenteditable=true]')) if (vis(e) || (e.type === 'checkbox' && e.parentElement && vis(e.parentElement))) add('input:' + (e.type || e.tagName.toLowerCase()), e);
  for (const e of document.querySelectorAll('[role=switch], [role=tab], [role=tablist], [role=radiogroup], [role=radio], [role=group], [role=menu], [role=menuitem], [role=listbox], [role=option], [role=dialog], [role=tooltip], [role=status], [role=alert], [role=progressbar], [role=slider], [role=grid], table')) if (vis(e)) add('role:' + (e.getAttribute('role') || e.tagName.toLowerCase()), e);
  for (const e of document.querySelectorAll('[class*=chip], [class*=pill], [class*=badge], [class*=tag], [class*=rail], [class*=seg], [class*=tog], [class*=tip], [class*=pop], [class*=menu], [class*=pick], [class*=cal], [class*=date], [class*=toast], [class*=meter], [class*=bar], [class*=dot], [class*=card], [class*=tile], [class*=sw]')) if (vis(e) && !e.matches('button, input')) add('class', e);
  // text: every visible text run (and ::before/::after words)
  const RGB = (c) => c; const txt = {};
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? 1 : 2) }); let n;
  const put = (el, text, ps) => { const c = getComputedStyle(el, ps || null); const fs = parseFloat(c.fontSize); const k = [c.fontFamily.split(',')[0].replace(/"/g, ''), fs, c.fontWeight, c.textTransform === 'uppercase' || (text === text.toUpperCase() && /[A-Z]{2}/.test(text)) ? 'caps' : 'case', c.letterSpacing === 'normal' ? 0 : +(parseFloat(c.letterSpacing) / fs).toFixed(3), c.lineHeight === 'normal' ? 'normal' : +(parseFloat(c.lineHeight)).toFixed(1), c.color].join(' | ');
    const o = txt[k] || (txt[k] = { n: 0, gates: new Set(), sample: [] }); o.n++; o.gates.add(gate(el)); if (o.sample.length < 4 && !o.sample.includes(text.slice(0, 24))) o.sample.push(text.slice(0, 24)); };
  while ((n = tw.nextNode())) { const el = n.parentElement; if (!el || el.closest('script, style, noscript, #bd-host')) continue; const g = document.createRange(); g.selectNodeContents(n); const r = g.getBoundingClientRect(); if (r.width < 0.5 || r.height < 0.5) continue; const c = getComputedStyle(el); if (c.visibility === 'hidden' || +c.opacity < 0.02) continue; put(el, n.textContent.trim().replace(/\s+/g, ' ')); }
  for (const el of document.querySelectorAll('*')) for (const ps of ['::before', '::after']) { const c = getComputedStyle(el, ps); const m = /^"(.+)"$/.exec(c.content); if (m && m[1].trim() && c.display !== 'none' && (parseFloat(c.width) || 1) > 0.5 && vis(el)) put(el, m[1], ps); }
  const S = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { ...v, h: v.h ? [...v.h] : undefined, w: v.w ? [...v.w].slice(0, 6) : undefined, gates: [...v.gates].slice(0, 8) }]));
  return { ctrls: S(ctrls), txt: S(txt) };
};
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 240000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'inv-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1500, height: 1500 }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(STATE, 'utf8'));
  await p.goto(BASE + 'builder.html', { waitUntil: 'networkidle0', timeout: 120000 }); await p.waitForFunction(() => window.__sxReady, { timeout: 60000 }); await sleep(1500);
  await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
  const res = { errs };
  res.rest = await p.evaluate(READ);
  res.gates = await p.evaluate(() => [...document.querySelectorAll('[id^=c-]')].map((g) => `${g.id}:${Math.round(g.getBoundingClientRect().height)}`));
  await p.evaluate(() => { const t = document.querySelector('#c-manifest .madd'); if (t) { t.scrollIntoView({ block: 'center', behavior: 'instant' }); t.click(); } }); await sleep(1600);
  res.newBuild = await p.evaluate(READ);
  await p.keyboard.press('Escape'); await sleep(600); await p.evaluate(() => { const c = [...document.querySelectorAll('.drawer.open button, aside.drawer button')].find((x) => /cancel|close/i.test(x.getAttribute('aria-label') || x.textContent)); if (c) c.click(); }); await sleep(800);
  await p.evaluate(() => { const t = [...document.querySelectorAll('#c-broadcast button')].find((x) => /Post announcement/.test(x.textContent)); if (t) { t.scrollIntoView({ block: 'center', behavior: 'instant' }); t.click(); } }); await sleep(1600);
  res.post = await p.evaluate(READ);
  const cal = await p.evaluate(() => { const u = [...document.querySelectorAll('use[href^="#i-calendar"]')].map((x) => x.closest('button')).find((x) => x && x.getClientRects().length); if (!u) return false; u.scrollIntoView({ block: 'center', behavior: 'instant' }); u.click(); return true; }); await sleep(1200);
  res.datePicker = cal ? await p.evaluate(READ) : null;
  fs.writeFileSync(path.join(__dirname, 'inventory.json'), JSON.stringify(res, null, 1));
  // summary: control families per state, new ones only after rest
  const seen = new Set(); for (const st of ['rest', 'newBuild', 'post', 'datePicker']) { if (!res[st]) { console.log('== ' + st + ': not opened'); continue; } const c = res[st].ctrls; const fresh = Object.entries(c).filter(([k]) => !seen.has(k)); fresh.forEach(([k]) => seen.add(k)); console.log(`== ${st}: ${Object.keys(c).length} control groups, ${fresh.length} new · ${Object.keys(res[st].txt).length} text styles`);
    for (const [k, v] of fresh.sort((a, b) => b[1].n - a[1].n)) console.log(`  ${v.n}× ${k.slice(0, 90)} h${v.h.join('/')} @${v.gates.slice(0, 3).join(',')} «${v.sample.join(' | ')}»`); }
  console.log('gates', res.gates.join(' ')); console.log('errors', errs.slice(0, 4)); await b.close();
})().catch((e) => { console.error('inventory FAIL', e.message); process.exit(1); });
