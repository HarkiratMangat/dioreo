// Every search field on the spec page AND on the board, read as one class (his 2026-10-08 15:27 EDT round): what each field draws (skin fill, outline,
// corner, width), its leading icon (size, centre against the field's centre, ink), its words (left inset, placeholder ink, typed ink, size), its
// in-field buttons (size, icon size, ink) and count box, and which parts light the field's outline under a REAL mouse (the words, the ×, the count,
// the chevron). Every colour is named against the page's own :root tokens. Usage: node field-inks.cjs [--acc armory] → work/lead/field-inks.json
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const BASE = 'http://127.0.0.1:8900/docs/pins2/s4-board/'; const STATE = path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const ACC = process.argv.includes('--acc') ? process.argv[process.argv.indexOf('--acc') + 1] : '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// a state picture of a field: its drawn box and 12 px around it (the focus halo is 5), in document coordinates, written where the spec page reads it
const SHOTS = path.join(ROOT, 'docs/pins2/s4-board/spec-img');
async function shot(p, sel, name) { const c = await p.evaluate((sel) => { const e = document.querySelector(sel); const b = (e.querySelector('.f-fld') || e).getBoundingClientRect(); return { x: b.left - 12 + scrollX, y: b.top - 12 + scrollY, width: b.width + 24, height: b.height + 24 }; }, sel); await p.screenshot({ path: path.join(SHOTS, name), clip: c }); }
const SPEC = [['filter', '#fields .fl-filter .srch'], ['wep', '#fields .fl-wep .f-pick'], ['cat', '#fields .fl-cat .f-pick'], ['att', '#fields .fl-att .f-pick'], ['cmp', '#fields .fl-cmp .cx-pick']];
const BOARD = [['filter', '#c-manifest .srch'], ['wep', '.f-card-b [data-s=build] .f-g2 .f-row:nth-child(1) .f-pick'], ['cat', '.f-card-b [data-s=build] .f-g2 .f-row:nth-child(2) .f-pick'], ['att', '.f-card-b [data-s=atts] .f-att .f-pick'], ['cmp', '.cx-top .cx-pick']];
// runs in the page: tokens, then one field's parts
const { INPAGE } = require('./measure-lib.cjs');
async function readAll(p, list, shoot = false) {
  await p.evaluate(INPAGE); const out = {};
  for (const [k, sel] of list) {
    const ok = await p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return false; e.scrollIntoView({ block: 'center', behavior: 'instant' }); return true; }, sel); if (!ok) { out[k] = null; continue; }
    await p.mouse.move(2, 2); await sleep(350); const f = await p.evaluate((sel) => window.__field(sel), sel); f.hover = { rest: await p.evaluate((sel) => window.__edgeNow(sel), sel) };
    const pts = await p.evaluate((sel) => window.__pts(sel), sel);
    f.raw = { rest: await p.evaluate((sel) => window.__raw(sel), sel), hover: {} }; if (shoot && k === 'filter') { await p.addStyleTag({ content: '.spec .ov, .spec .anat { display: none !important; }' }); await sleep(250); await shot(p, sel, 'field-filter-rest.png'); } if (shoot && k === 'wep') await shot(p, sel, 'field-wep-rest.png');
    for (const [part, [x, y]] of Object.entries(pts)) { await p.mouse.move(x, y); await sleep(420); f.hover[part] = await p.evaluate((sel) => window.__edgeNow(sel), sel); f.raw.hover[part] = await p.evaluate((sel) => window.__raw(sel), sel); if (part === 'clear') f.xHoverBg = await p.evaluate((sel) => { const x = document.querySelector(sel + ' .srch-x'); return x ? getComputedStyle(x).backgroundColor : null; }, sel); if (shoot && k === 'filter' && (part === 'words' || part === 'clear')) { await shot(p, sel, part === 'words' ? 'field-filter-hover.png' : 'field-filter-hoverx.png'); await sleep(300); } await p.mouse.move(2, 2); await sleep(250); }
    await p.evaluate((sel) => { const i = [...document.querySelector(sel).querySelectorAll('input')].find((e) => e.getClientRects().length); if (i) i.focus({ preventScroll: true }); }, sel); await sleep(450); if (shoot && k === 'filter') await shot(p, sel, 'field-filter-focus.png'); f.raw.focus = await p.evaluate((sel) => window.__raw(sel), sel); f.focus = await p.evaluate((sel) => window.__edgeNow(sel), sel);
    f.raw.xHoverBg = f.xHoverBg || null; await p.evaluate(() => document.activeElement && document.activeElement.blur()); await sleep(350);   // never Escape: on the board it closes the New build drawer and the fields after it vanish
    out[k] = f; }
  return out;
}
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 180000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'fi-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 1500, deviceScaleFactor: 2 }); p.on('pageerror', (e) => console.log('PAGEERR', e.message.slice(0, 300))); p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLEERR', m.text().slice(0, 300)); });
  await p.goto(BASE + 'spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await p.evaluate(() => document.fonts.ready); await sleep(1500);
  if (ACC) await p.evaluate((a) => { const x = [...document.querySelectorAll('#fields .acc')].find((e) => e.textContent.trim() === a); if (x) x.click(); }, ACC); await sleep(400);
  const spec = await readAll(p, SPEC, !ACC); const tokens = await p.evaluate(() => window.__tok);
  const p2 = await b.newPage(); await p2.setViewport({ width: 1500, height: 1500 });
  await p2.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(STATE, 'utf8'));
  await p2.goto(BASE + 'builder.html', { waitUntil: 'networkidle0', timeout: 120000 }); await p2.waitForFunction(() => window.__sxReady, { timeout: 60000 }); await sleep(1500);
  await p2.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; const t = document.querySelector('#c-manifest .madd'); t.scrollIntoView({ block: 'center', behavior: 'instant' }); t.click(); }); await sleep(1500);
  const board = await readAll(p2, BOARD);
  fs.writeFileSync(path.join(__dirname, 'field-inks.json'), JSON.stringify({ acc: ACC, spec, board, tokens }, null, 1));
  if (!ACC) fs.writeFileSync(path.join(ROOT, 'docs/pins2/s4-board/spec-img/field-facts.json'), JSON.stringify({ measured: new Date().toISOString(), facts: Object.fromEntries(Object.entries(spec).filter(([, v]) => v).map(([k, v]) => [k, v.raw])) }, null, 1));
  // the namer, proven on colours whose answer is known (b4/form.css, b4/components.css)
  const known = await p.evaluate((sp) => { const N = window.__inkName; if (!N) return 'no namer on the page'; const w = sp.wep, c = sp.filter; return { fieldFill: N(w.raw.rest.bg), fieldEdge: N((/^(.*?\))\s+0px/.exec(w.raw.rest.ring) || [])[1]), countBox: c && c.count ? N(c.count.bgRaw) : null, xHover: c ? N(c.xHoverBg) : null, caret: w.buttons[0] ? N(w.buttons[0].iconRaw) : null, focusHalo: w.raw.focus ? N((/,\s*(.*?\))\s+0px 0px 0px 5px/.exec(w.raw.focus.ring) || [])[1]) : null }; }, spec); console.log('KNOWN', JSON.stringify(known));
  // what the page itself prints under each field, read after a reload so it carries the facts this run just wrote
  await p.reload({ waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await sleep(1800); if (ACC) { await p.evaluate((a) => { const x = [...document.querySelectorAll('#fields .acc')].find((e) => e.textContent.trim() === a); if (x) x.click(); }, ACC); await sleep(900); }
  console.log('SHOWN ' + (ACC || 'off') + '\n' + (await p.evaluate(() => [...document.querySelectorAll('#fields .fl')].map((fl) => (fl.querySelector('.fl-n code') || {}).textContent + ' :: ' + ((fl.querySelector('.fg-fs') || {}).textContent || '') + ' :: ' + (fl.querySelector('.inks') ? fl.querySelector('.inks').innerText.replace(/\n+/g, ' | ') : 'no inks')).join('\n')))); await b.close(); console.log('ok', Object.keys(tokens).length, 'colour tokens');
})().catch((e) => { console.error('field-inks FAIL', e.message); process.exit(1); });
