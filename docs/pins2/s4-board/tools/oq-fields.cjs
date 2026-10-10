// His 2026-10-08 12:35 EDT questions about the fields, answered from the page: (1) which parts take the realm colour (switch armory → history, diff every
// element's colours); (2) how the dropdown chevron is placed (so its inset can move 4 → 6 correctly); (3) pictures: field words, leading icon, chevron inset,
// corners, each with the part outlined. Writes work/lead/oq/f-*.png and prints JSON. Usage: node oq-fields.cjs
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const OUT = path.join(__dirname, 'oq'); fs.mkdirSync(OUT, { recursive: true }); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 180000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'oqf-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 900, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: '.spec .ov,.spec .fg-fs{visibility:hidden !important}' });
  const acc = async (name) => { await p.evaluate((n) => { [...document.querySelectorAll('#fields .accsw .acc')].find((x) => x.textContent.trim() === n).click(); }, name); await sleep(400); };
  const snap = () => p.evaluate(() => { const out = {}; for (const row of document.querySelectorAll('#fields .fl')) { const k = [...row.classList].find((c) => c.startsWith('fl-')); const f = row.querySelector('.srch, .f-pick, .cx-pick'); if (!f) continue; const m = {};
      [f, ...f.querySelectorAll('*')].forEach((el, i) => { for (const ps of [null, '::before', '::after']) { const c = getComputedStyle(el, ps); if (ps && (c.content === 'none' || c.content === 'normal')) continue; const id = `${i}:${el.tagName.toLowerCase()}${el.classList.length ? '.' + [...el.classList].join('.') : ''}${ps || ''}`; m[id] = { color: c.color, bg: c.backgroundColor, border: c.borderTopColor, shadow: c.boxShadow, stroke: c.stroke, fill: c.fill }; } }); out[k] = m; } return out; });
  await acc('armory'); const A = await snap(); await acc('history'); const H = await snap();
  const realm = {}; for (const k of Object.keys(A)) { const parts = []; for (const id of Object.keys(A[k])) { const a = A[k][id], h = H[k][id]; if (!h) continue; const props = Object.keys(a).filter((q) => a[q] !== h[q]); if (props.length) parts.push(id.replace(/^\d+:/, '') + ' [' + props.join(',') + ']'); } realm[k] = parts; }
  await acc('armory');
  const caret = await p.evaluate(() => { const c = document.querySelector('#fields .fl-wep .f-caret'); const x = document.querySelector('#fields .fl-filter .srch-x'); const cs = getComputedStyle(c), ps = getComputedStyle(c.parentElement), xs = getComputedStyle(x.parentElement);
    const f = c.closest('.f-pick').getBoundingClientRect(), r = c.getBoundingClientRect(), xr = x.getBoundingClientRect(), sr = x.closest('.srch').getBoundingClientRect();
    return { caret: { position: cs.position, right: cs.right, marginRight: cs.marginRight, parent: c.parentElement.className, parentPadR: ps.paddingRight, parentPos: ps.position, inset: +(f.right - r.right).toFixed(1) }, x: { sufRight: xs.right, inset: +(sr.right - xr.right).toFixed(1) } }; });
  const style = async (css) => p.evaluate((css) => { let s = document.getElementById('oq-s'); if (!s) { s = document.createElement('style'); s.id = 'oq-s'; document.head.appendChild(s); } s.textContent = css; }, css);
  const shots = [];
  const shoot = async (file, rowSel, crop = null) => { const r = await p.evaluate((sel) => { const f = document.querySelector(sel); f.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = f.getBoundingClientRect(); return { x: q.left + scrollX, y: q.top + scrollY, w: q.width, h: q.height }; }, rowSel); await sleep(250);
    const c = crop ? { x: r.x + r.w - crop, y: r.y - 10, width: crop + 10, height: r.h + 20 } : { x: r.x - 14, y: r.y - 10, width: r.w + 28, height: r.h + 20 }; await p.screenshot({ path: path.join(OUT, file), clip: c }); shots.push(file); };
  const OL = 'outline:1.5px dashed #D8F24A !important;outline-offset:2px !important;';
  const words = (sel) => `.spec #fields ${sel} input:not(#_){${OL}}`;
  // field words: the weapon field at 14 (today) and 13; the category's ASSAULT at 12 (today), 11 and 13
  for (const [n, css] of [['f-words-wep-14', words('.fl-wep')], ['f-words-wep-13', words('.fl-wep') + '.spec #fields .fl-wep input:not(#_){font-size:13px !important}']]) { await style(css); await shoot(n + '.png', '#fields .fl-wep .f-pick'); }
  for (const n of [12, 11, 13]) { await style(words('.fl-cat') + `.spec #fields .fl-cat input:not(#_), .spec #fields .fl-cat .f-pick span:not(#_){font-size:${n}px !important}`); await shoot(`f-words-cat-${n}.png`, '#fields .fl-cat .f-pick'); }
  // the leading icon: the Manifest search's glass at 12 (today) and 16; the weapon field's at 16 (today) and 12
  const ic = (sel, px) => `.spec #fields ${sel} svg:not(button svg):not(#_){${OL}${px ? `width:${px}px !important;height:${px}px !important;` : ''}}`;
  for (const [n, css, sel] of [['f-icon-search-12', ic('.fl-filter', 0), '.fl-filter .srch'], ['f-icon-search-16', ic('.fl-filter', 16), '.fl-filter .srch'], ['f-icon-wep-16', ic('.fl-wep', 0), '.fl-wep .f-pick'], ['f-icon-wep-12', ic('.fl-wep', 12), '.fl-wep .f-pick']]) { await style(css); await shoot(n + '.png', '#fields ' + sel); }
  // the chevron's inset: 4 (today) and 6, the × beside it for comparison (right end only)
  const cc = caret.caret; const move = cc.position === 'absolute' ? `right:${parseFloat(cc.right) + 2}px !important;` : `margin-right:${parseFloat(cc.marginRight) + 2}px !important;`;
  await style(`.spec #fields .fl-wep .f-caret:not(#_){${OL}}`); await shoot('f-chev-4.png', '#fields .fl-wep .f-pick', 140);
  await style(`.spec #fields .fl-wep .f-caret:not(#_){${OL}${move}}`); await shoot('f-chev-6.png', '#fields .fl-wep .f-pick', 140);
  await style(`.spec #fields .fl-filter .srch-x:not(#_){${OL}}`); await shoot('f-x-6.png', '#fields .fl-filter .srch', 140);
  // corners: the weapon field at 9 (today) and 11
  await style(''); await shoot('f-corner-9.png', '#fields .fl-wep .f-pick', 140);
  await style('.spec #fields .fl-wep .f-fld:not(#_){border-radius:11px !important}'); await shoot('f-corner-11.png', '#fields .fl-wep .f-pick', 140);
  // the realm parts: armory and history side by side, filter + weapon fields
  await style(''); await acc('armory'); await shoot('f-realm-armory-filter.png', '#fields .fl-filter .srch'); await shoot('f-realm-armory-wep.png', '#fields .fl-wep .f-pick');
  await acc('history'); await shoot('f-realm-history-filter.png', '#fields .fl-filter .srch'); await shoot('f-realm-history-wep.png', '#fields .fl-wep .f-pick');
  console.log(JSON.stringify({ realm, caret, move, shots }, null, 1)); await b.close();
})();
