// The C1 Button Spec page (builder-2/spec.html), checked the way he uses it, plus the board crops it shows. One headless run:
//  1. the board (builder.html, his saved state): crops each 9px label kind into builder-2/spec-img/ (the page shows them as pictures,
//     since a label has no states) and reads the manifest search field at rest and focused;
//  2. the spec page: the same search field at rest and focused (must match the board's), the Hide measurements button (must hide
//     every overlay), a hover INSIDE a click area but outside the drawn button (must light the button), page errors, and screenshots.
// Usage: node spec-check.cjs [--no-crops]
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const B2 = path.join(ROOT, 'docs/pins2/s4-board'); const IMG = path.join(B2, 'spec-img'); const OUT = path.join(__dirname, 'spec-check');
fs.mkdirSync(IMG, { recursive: true }); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json'); const URL = 'http://127.0.0.1:8900/docs/pins2/s4-board/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// each 9px label kind: where it lives on the board, what to crop (the label's own element or the thing it sits in)
const LABELS = [
  ['key', null, '.b3-pc.pinned *', '=code', 'self'],   // first: the pinned card closes once the page scrolls
  ['group', 'c-manifest', '.mtools .mlabel', 'Manifest', 'self'],
  ['group-600', 'c-history', 'span', 'Time', 'self'],
  ['slot', 'c-manifest', '.wg-r .wg-at', null, 'self'],
  ['slot-compare', 'c-compare', 'th.cx-k0', 'Muzzle', 'self'],
  ['category', 'c-manifest', '.wg-h .wg-line > small', null, 'self'],
  ['field', 'c-manifest', '.wg-plate', null, 'self'],
  ['badge', 'c-manifest', '.b3-bdg', 'META', 'self'],
  ['mode', 'c-manifest', '.b3-bdg', 'HP', 'self'],
  ['realm', 'c-repairs', 'span.t', 'Armory', 'self'],
];
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 180000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spc-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) errs.push(r.status() + ' ' + r.url().replace(/^.*builder-2\//, '')); }); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(STATE, 'utf8'));
  const field = () => p.evaluate(async () => { const i = document.querySelector('.srch input'); const r = () => { const c = getComputedStyle(i); const s = getComputedStyle(i.parentElement); return `input ${c.height} · border ${c.borderTopWidth} ${c.borderTopColor} · r ${c.borderTopLeftRadius} · bg ${c.backgroundColor} · shadow ${c.boxShadow} · outline ${c.outlineStyle} ${c.outlineWidth} · box shadow ${s.boxShadow}`; };
    const rest = r(); i.focus(); await new Promise((z) => setTimeout(z, 300)); const foc = r(); i.blur(); return { rest, foc }; });
  if (!process.argv.includes('--no-crops')) {
    await p.goto(URL + 'builder.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__sxReady, { timeout: 60000 }); await p.evaluate(() => document.fonts.ready); await sleep(1000);
    await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
    const chip = await p.evaluate(() => { const t = document.querySelector('#c-manifest .wg-h button.b3-fchip'); t.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await p.mouse.move(chip.x, chip.y); await sleep(700); await p.mouse.click(chip.x, chip.y); await sleep(900);
    console.log('card open', await p.evaluate(() => [...document.querySelectorAll('[class*=b3-pc]')].filter((e) => e.getClientRects().length).slice(0, 6).map((e) => e.className).join(' | ')));
    console.log('board search field', JSON.stringify(await field(), null, 1));
    for (const [k, gate, sel, text, crop] of LABELS) {
      const r = await p.evaluate((gate, sel, text, crop) => { const g = gate ? document.getElementById(gate) : document; if (!g) return null; let e = [...g.querySelectorAll(sel)].find((x) => x.getClientRects().length && !x.closest('#c1-buttons') && (!text || (text[0] === '=' ? (x.children.length === 0 && x.textContent.trim().toLowerCase() === text.slice(1)) : x.textContent.trim().toLowerCase().startsWith(text.toLowerCase()))));
        if (!e) return null; if (crop === 'parent') e = e.parentElement; e.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = e.getBoundingClientRect(); return { x: q.left + scrollX, y: q.top + scrollY, w: q.width, h: q.height }; }, gate, sel, text, crop);
      if (!r) { console.log('crop', k, 'NOT FOUND'); continue; }
      await sleep(150); fs.writeFileSync(path.join(IMG, k + '.png'), Buffer.from(await p.screenshot({ captureBeyondViewport: false, clip: { x: r.x - 8, y: r.y - 8, width: Math.min(r.w + 16, 700), height: r.h + 16 } }))); console.log('crop', k, `${Math.round(r.w)}×${Math.round(r.h)}`);
    }
  }
  await p.goto(URL + 'spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await p.evaluate(() => document.fonts.ready); await sleep(1200); await p.evaluate(async () => { window.__P = await import('/local/pins2/s4/work/lead/probe-lib.js?v=' + Date.now()); });
  console.log('spec search field', JSON.stringify(await field(), null, 1));
  console.log('sticky blockers + chip', JSON.stringify(await p.evaluate(() => { const anc = []; let x = document.querySelector('.spec .bar'); while (x) { const c = getComputedStyle(x); if (c.overflow !== 'visible' || c.contain !== 'none') anc.push(x.tagName + '#' + x.id + '.' + String(x.className).slice(0, 30) + ' overflow ' + c.overflow + ' h ' + c.height); x = x.parentElement; }
    const sc = document.querySelector('.chip-spec .b3-sc'); const cs = sc && getComputedStyle(sc); return { anc, chip: sc ? [cs.transform, cs.scale, cs.zoom, cs.animationName, sc.offsetHeight, sc.getBoundingClientRect().height].join(' / ') : 'none', chipRules: sc ? window.__P.rulesFor(sc, '', /transform|scale|zoom|animation/) : [] }; })));
  console.log('misses', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.miss')].map((t) => (t.closest('section') || {}).id + ':' + t.textContent))));
  console.log('pseudo', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.spec .hz button')].map((b) => { const a = getComputedStyle(b, '::after'); return `${b.className || b.textContent.trim()}: ::after ${a.content} ${a.position} inset ${a.inset}`; }))));
  // a hover 3px outside a drawn M button, inside its click area
  const hz = await p.evaluate(() => { const b = document.querySelector('#sizes .sz-M .hz button'); b.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top - 3, before: getComputedStyle(b).backgroundColor }; });
  await p.mouse.move(hz.x, hz.y); await sleep(400);
  console.log('hover 3px above an M button', JSON.stringify(await p.evaluate((x, y) => { const b = document.querySelector('#sizes .sz-M .hz button'); const top = document.elementFromPoint(x, y); return { hovered: b.matches(':hover'), under: top && (top === b || b.contains(top)) ? 'the button' : (top && top.className), bg: getComputedStyle(b).backgroundColor }; }, hz.x, hz.y)), 'rest bg', hz.before);
  await p.mouse.move(2, 2);
  fs.writeFileSync(path.join(OUT, 'top.png'), Buffer.from(await p.screenshot()));
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0, k = 0; y < H && k < 8; y += 860, k++) { await p.evaluate((y) => scrollTo(0, y), y); await sleep(250); fs.writeFileSync(path.join(OUT, `p${k}.png`), Buffer.from(await p.screenshot())); }
  // the toggle: sticky, and it hides every overlay
  await p.evaluate(() => scrollTo(0, 1500)); await sleep(200);
  const tog = await p.evaluate(() => { const t = document.querySelector('.spec .tog'); const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, visible: r.top >= 0 && r.bottom <= innerHeight }; });
  await p.mouse.click(tog.x, tog.y); await sleep(250);
  console.log('toggle', JSON.stringify({ stickyVisibleAt1500: tog.visible, overlaysShownAfterClick: await p.evaluate(() => [...document.querySelectorAll('.ov')].filter((o) => o.getClientRects().length).length), total: await p.evaluate(() => document.querySelectorAll('.ov').length) }));
  // the variant table's relations (his 19:00 EDT spacing note): per row the icons' centre line and the names' tops, names over two lines, headers over their columns;
  // then at a phone width: no page-wide sideways scroll, the table scrolls inside its card
  const rel = async () => p.evaluate(() => { const g = document.querySelector('.vgrid'); if (!g) return 'no .vgrid'; const all = [...g.querySelectorAll('.vc')]; const cells = all.filter((c) => c.dataset.facts); const rows = {};
    cells.forEach((c) => { const k = c.dataset.facts.replace(/^vr-/, '').split('--')[0]; (rows[k] = rows[k] || []).push(c); });
    const out = Object.entries(rows).map(([k, cs]) => { const ys = cs.map((c) => { const b = c.querySelector('button').getBoundingClientRect(); return b.top + b.height / 2; }); const ts = cs.map((c) => c.querySelector('.vc-n').getBoundingClientRect().top);
      const lines = cs.map((c) => Math.round(c.querySelector('.vc-n').getBoundingClientRect().height / (parseFloat(getComputedStyle(c.querySelector('.vc-n')).lineHeight) || 16)));
      const lab = c0 => c0; const lb = g.querySelectorAll('.vk b')[Object.keys(rows).indexOf(k)].getBoundingClientRect(); const band = cs[0].querySelector('.vc-s').getBoundingClientRect();
      return `row ${k}: icon centres spread ${(Math.max(...ys) - Math.min(...ys)).toFixed(1)} · name tops spread ${(Math.max(...ts) - Math.min(...ts)).toFixed(1)} · name lines ${[...new Set(lines)].join('/')} · label vs band centre ${((lb.top + lb.height / 2) - (band.top + band.height / 2)).toFixed(1)}`; });
    const hd = [...g.querySelectorAll('.ig-hd.sm')].map((h, i) => { const hr = h.getBoundingClientRect(); const col = all[i].getBoundingClientRect(); return ((hr.left + hr.width / 2) - (col.left + col.width / 2)).toFixed(1); });
    return out.join('\n') + `\nheader centre vs column centre: ${hd.join(' / ')}`; });
  console.log('RELATIONS at 1282\n' + await rel());
  // his 11:38 EDT "align the buttons properly": per column the buttons' left edges, per row the measured button's centre against its neighbours'
  console.log('SIZES ROWS ' + JSON.stringify(await p.evaluate(() => { const rows = [...document.querySelectorAll('#sizes .szrow')].map((r) => { const g = r.querySelector('.gauge button').getBoundingClientRect(); const ps = [...r.querySelectorAll('.pairbox button')].map((b) => b.getBoundingClientRect()); return { gl: g.left, gc: g.top + g.height / 2, pl: ps[0] && ps[0].left, pc: ps[0] && ps[0].top + ps[0].height / 2 }; }); const sp = (v) => +(Math.max(...v) - Math.min(...v)).toFixed(1); return { gaugeLeftSpread: sp(rows.map((x) => x.gl)), pairLeftSpread: sp(rows.map((x) => x.pl)), rowCentreDiffs: rows.map((x) => +(x.gc - x.pc).toFixed(1)) }; })));
  await p.evaluate(() => { const t = document.querySelector('.spec .tog'); if (t && t.getAttribute('aria-pressed') === 'false') t.click(); }); await sleep(300);   // measurements on: hidden numbers cannot overlap anything (a vacuous pass, caught 2026-10-08)
  // every measurement number that overlaps another number or a word on the page (the chips' 32 sat on CATEGORY once)
  console.log('OVERLAPS ' + JSON.stringify(await p.evaluate(() => { const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1; const out = [];
    for (const s of document.querySelectorAll('.spec > section[id]')) { const nums = [...s.querySelectorAll('.ov text')].filter((t) => t.getClientRects().length).map((t) => ({ t: t.textContent, r: t.getBoundingClientRect() })); const words = []; const w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() && !n.parentElement.closest('svg') && n.parentElement.checkVisibility({ opacityProperty: true, visibilityProperty: true }) ? 1 : 2) }); let n; while ((n = w.nextNode())) { const g = document.createRange(); g.selectNodeContents(n); const r = g.getBoundingClientRect(); if (r.width) words.push({ t: n.textContent.trim().slice(0, 16), r }); }
      nums.forEach((a, i) => { nums.slice(i + 1).forEach((b) => { if (hit(a.r, b.r)) out.push(`${s.id}: ${a.t} × ${b.t}`); }); words.forEach((b) => { if (hit(a.r, b.r)) out.push(`${s.id}: ${a.t} × "${b.t}"`); }); }); }
    return out.slice(0, 20); })));
  console.log('OVERLAYS PER SECTION ' + JSON.stringify(await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.spec > section[id]')].map((s) => [s.id, s.querySelectorAll('.ov').length])))));
  console.log('STATES SECTION\n' + await p.evaluate(() => [...document.querySelectorAll('.ss-row')].map((r) => { const k = r.querySelector('.ss-k b').textContent;
    const tops = (q) => [...r.querySelectorAll(q)].map((e) => e.getBoundingClientRect().top); const spread = (v) => (v.length ? Math.max(...v) - Math.min(...v) : 0).toFixed(1);
    const wraps = [...r.querySelectorAll('.rc dd')].filter((d) => d.getBoundingClientRect().height > parseFloat(getComputedStyle(d).lineHeight) * 1.5 + 1).map((d) => d.textContent);
    const hex = [...r.querySelectorAll('.rc dd')].filter((d) => /#[0-9a-f]{6}/i.test(d.textContent)).map((d) => d.textContent);
    return `${k}: pictures ${spread(tops('.ss-c img'))} · first lines ${spread(tops('.rc > div:first-child'))} · wrapped [${wraps.join(' | ')}] · hex [${hex.join(' | ')}] · "${(r.querySelector('.ss-sum') || {}).textContent || ''}"`; }).join('\n')));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 }); await sleep(500);
  console.log('page at 390: scrollWidth', await p.evaluate(() => document.documentElement.scrollWidth), '· grid at 390 scrolls inside its card:', await p.evaluate(() => { const g = document.querySelector('.vgrid'); return g.scrollWidth > g.clientWidth + 1; }));
  console.log('wider at 390:', JSON.stringify(await p.evaluate(() => { const W = document.documentElement.clientWidth; const scrolls = (e) => { for (let x = e.parentElement; x; x = x.parentElement) { const o = getComputedStyle(x).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; } return false; };
    return [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > W + 0.5 && !scrolls(e); }).slice(0, 8).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)} right ${e.getBoundingClientRect().right.toFixed(1)}`); })));
  await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 }); await sleep(500);
  // each section whole, measurements back on, for looking at (spec-check/sec-<id>.png)
  await p.addStyleTag({ content: '.spec .sbar{position:static !important}' });   /* sbar-static: the sticky bar would sit over the middle of a long section's picture */
  await p.evaluate(() => { const t = document.querySelector('.spec .tog'); if (t && t.getAttribute('aria-pressed') === 'false') t.click(); }); await sleep(300);
  for (const id of await p.evaluate(() => [...document.querySelectorAll('.spec > section[id]')].map((x) => x.id))) { const el = await p.$('.spec > section#' + id); await el.evaluate((x) => x.scrollIntoView({ block: 'start', behavior: 'instant' })); await sleep(250); await el.screenshot({ path: path.join(OUT, `sec-${id}.png`) }); }
  console.log('errors', JSON.stringify(errs.slice(0, 6))); await b.close();
})().catch((e) => { console.error('spec-check FAIL', e.message); process.exit(1); });
