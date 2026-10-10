// Session 4 · the sweep for the surfaces-change-live board (board/FINAL-DIRECTION.md). Every family × {nothing picked, each option, an
// all-changed mix} × {settings shut, open} at 1280×834, 1480×834 and 1512×950. Faults: the page wider than the window; a plate or the
// table scrolling; a live window not at its surface's width; the settings panel scrolling or covering the table or a surface; a setting's
// name cut off; one option alone on a line; the pick bar showing while the table is in view; a surface marked Unchanged whose after
// differs from its before, or offering Before/After when the two are identical (computed style, every element); a sentence of chrome
// text on the stage (over 60 characters outside his own quotes).
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/board-sweep3.cjs <outdir> [WxH:FAM[:pick=ID|:mix][:ft] ...]  → shots of named states
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const out = process.argv[2]; const shots = process.argv.slice(3); fs.mkdirSync(out, { recursive: true });
const SIZES = [[1280, 834], [1480, 834], [1512, 950]];
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sw3-')), args: ['--no-first-run'] });
  const page = await b.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/404 \(File not found\)/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); }); page.on('response', (r) => { if (r.status() >= 400 && !/favicon\.ico/.test(r.url())) errs.push(r.status() + ' ' + r.url().slice(0, 140)); });
  await page.setRequestInterception(true);
  page.on('request', (r) => { if (/\/board\/live\/index\.html/.test(r.url())) r.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8">' + fs.readFileSync(path.join(ROOT, 'local/pins2/s4/board/live/index.html'), 'utf8') }); else r.continue(); });
  const open = async (w, h, dpr = 1) => { await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr }); await page.goto(`http://127.0.0.1:8900/local/pins2/s4/board/live/index.html?b=${Date.now()}`, { waitUntil: 'networkidle0' }); await page.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 250)); };
  const state = (fam, pick, ft) => page.evaluate(async (fam, pick, ft) => {
    try { localStorage.clear(); } catch (e) {}
    S.f = {}; S.ft = ft; delete S.insPos; const F0 = BY[fam];
    if (pick === 'mix' && (F0.props || []).length && (F0.presets || []).length) { const v = pv(F0, F0.rec); F0.props.forEach((p) => { if (p.type === 'range') v[p.k] = Math.round((p.min + (p.max - p.min) * .85) / p.step) * p.step; else if (p.opts) { const o = p.opts.map((x) => x[0]).filter((x) => !eq(x, v[p.k])); if (o.length) v[p.k] = o[o.length - 1]; } }); S.f[fam] = { status: match(F0, v) ? 'preset' : 'custom', base: F0.rec, v, note: '' }; }
    else if (pick) S.f[fam] = { status: 'preset', base: pick, v: pv(F0, pick), note: '' };
    go(fam); await document.fonts.ready; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); window.scrollTo(0, 0); pbVis();
    const R = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const ov = (a, c) => Math.max(0, Math.min(a.r, c.r) - Math.max(a.x, c.x)) * Math.max(0, Math.min(a.b, c.b) - Math.max(a.y, c.y));
    const ins = $('#insp'); const I = ft ? R(ins) : null; const plates = $$('.bk-sf .bk-plate'); const dt = $('#dt');
    const cov = I ? Math.round([...plates, dt].filter(Boolean).reduce((n, e) => n + ov(I, R(e)), 0)) : 0;
    const plX = Math.max(0, ...plates.map((p) => p.scrollWidth - p.clientWidth)), plY = Math.max(0, ...plates.map((p) => p.scrollHeight - p.clientHeight));
    const winBad = $$('.bk-win').filter((w) => { const sm = KIT.samples[w.dataset.fz]; return sm && Math.abs(w.getBoundingClientRect().width - sm.surf.w) > .5; }).map((w) => w.dataset.fz);
    const cut = $$('.pr-h label').filter((l) => l.scrollWidth > l.clientWidth + 1).map((l) => l.textContent);
    const orphan = $$('.opts').filter((o) => { const bs = [...o.children]; if (bs.length < 3) return false; const tops = bs.map((x) => Math.round(x.getBoundingClientRect().top)); const rows = {}; tops.forEach((t) => { rows[t] = (rows[t] || 0) + 1; }); return rows[tops[tops.length - 1]] === 1 && Object.values(rows).some((n) => n > 1); }).map((o) => o.closest('.pr').dataset.k);
    // Unchanged must mean identical, and Before/After must mean different: every element's box and paint, before layer against after layer
    const snap = (layer) => { const h = layer.querySelector('.fz-host'); if (!h) return layer.innerHTML; const r = h.shadowRoot.querySelector('[data-fz~="root"]'); const H = h.getBoundingClientRect(); const ps = (e, p) => { const c = getComputedStyle(e, p); return c.content === 'none' ? '' : p + c.width + c.height + c.left + c.top + c.backgroundImage + c.backgroundColor + c.opacity + c.transform + c.boxShadow; }; const rn = (t) => t.replace(/(, none)+(?=\||$)/g, '').replace(/-?\d*\.\d+/g, (n) => (+n).toFixed(2)); const sh = (v) => { const x = v.split(/,(?![^(]*\))/).map((q) => q.trim()).filter((q) => !/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px( inset)?$/.test(q)).join(', '); return x || 'none'; }; return [h.shadowRoot.querySelector('[data-fz-surf]'), r, ...r.querySelectorAll('*')].map((e) => { const q = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [q.left - H.left, q.top - H.top, q.width, q.height].map((x) => Math.round(x * 2) / 2).join(',') + cs.color + cs.backgroundColor + sh(cs.boxShadow) + cs.borderTopLeftRadius + cs.borderBottomRightRadius + cs.gridTemplateColumns + cs.fill + cs.stroke + cs.borderTopColor + cs.fontSize + cs.fontWeight + cs.fontFamily + cs.letterSpacing + cs.transform + cs.backgroundImage.replace(/(, none)+$/, '') + ps(e, '::before') + ps(e, '::after'); }).map(rn).join('|'); };
    const lie = []; (V.S || []).forEach((sf) => { const same = sf.bands.every((bd) => snap(bd.L[0]) === snap(bd.L[1])); const sel = selection(F0); if (!sel) return; if (!sf.changed && !same) lie.push(sf.name + ': marked Unchanged, but differs'); if (sf.changed && same) lie.push(sf.name + ': Before/After offered, identical'); });
    const tags = []; $$('.bk-layer.on > .ov rect.rb').forEach((rc) => { const q = rc.getBoundingClientRect(); const L = rc.closest('.bk-layer'); const hst = L.querySelector('.fz-host'); const ink = []; const tw2 = document.createTreeWalker(hst.shadowRoot, NodeFilter.SHOW_TEXT); while (tw2.nextNode()) { const n = tw2.currentNode; if (!n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.width) ink.push(r); } hst.shadowRoot.querySelectorAll('[data-fz~="root"] button, [data-fz~="root"] input').forEach((e) => ink.push(e.getBoundingClientRect())); const P = L.closest('.bk-plate').getBoundingClientRect(); if (ink.some((r) => q.left - 1 < r.right && q.right + 1 > r.left && q.top - 1 < r.bottom && q.bottom + 1 > r.top) || q.top < P.top || q.bottom > P.bottom) tags.push(Math.round(q.left) + ',' + Math.round(q.top)); });
    const pbShown = !$('#pb').hidden && dt && dt.getBoundingClientRect().bottom > ($('.top').offsetHeight + 4);
    const words = []; const tw = document.createTreeWalker($('#stage'), NodeFilter.SHOW_TEXT); while (tw.nextNode()) { const n = tw.currentNode; const t = n.textContent.trim(); if (t.length > 60 && !n.parentElement.closest('.pin, h1, .rv, .rvwrap, .bk-dt, .slab')) words.push(t.slice(0, 50)); }
    return { fam, pick: pick || '', ft, docW: document.documentElement.scrollWidth - innerWidth, plX, plY, dtX: dt ? dt.scrollWidth - dt.clientWidth : 0, winBad, insScroll: ft ? ins.scrollHeight - ins.clientHeight : 0, cov, cut, orphan, lie, pbShown, words, tags, surfaces: (V.S || []).length, changed: (V.S || []).filter((s) => s.changed).length };
  }, fam, pick, ft);
  const rows = [];
  for (const [w, h] of SIZES) {
    await open(w, h); const fams = await page.evaluate(() => FAM.map((f) => [f.id, tunable(f) ? f.presets.map((p) => p.id) : []]));
    for (const [id, ps] of fams) for (const pick of [null, ...ps, ...(ps.length ? ['mix'] : [])]) for (const ft of [false, true]) rows.push({ size: `${w}×${h}`, ...(await state(id, pick, ft)) });
  }
  const key = (r) => [r.docW > 0 && 'page-width', r.plX > 1 && 'plate-x', r.plY > 1 && 'plate-y', r.dtX > 1 && 'table-scrolls', r.winBad.length && 'window-width', r.insScroll > 0 && 'panel-scrolls', r.cov > 0 && 'panel-covers', r.cut.length && 'label-cut', r.orphan.length && 'orphan-option', r.lie.length && 'unchanged-wrong', r.pbShown && 'pickbar-over-table', r.words.length && 'sentence', r.tags.length && 'redline-touches'].filter(Boolean).join(',');
  const bad = rows.filter((r) => key(r)); fs.writeFileSync(path.join(out, 'sweep3.json'), JSON.stringify(rows, null, 1));
  console.log(`rows ${rows.length} · violations ${bad.length} · errors ${errs.length}`);
  const groups = {}; bad.forEach((r) => { (groups[key(r)] = groups[key(r)] || []).push(`${r.size} ${r.fam}${r.pick ? ':' + r.pick : ''}${r.ft ? ' set' : ''}${r.lie.length ? ' [' + r.lie.join('; ') + ']' : ''}${r.words.length ? ' «' + r.words[0] + '»' : ''}${r.cov ? ' cov' + r.cov : ''}${r.winBad.length ? ' ' + r.winBad.join('|') : ''}${r.cut.length ? ' [' + r.cut.join('|') + ']' : ''}`); });
  for (const [k, v] of Object.entries(groups)) console.log(`${k} (${v.length}): ${v.slice(0, 10).join(' · ')}${v.length > 10 ? ' …' : ''}`);
  console.log('surfaces per family:', [...new Set(rows.filter((r) => r.size === '1480×834').map((r) => `${r.fam}:${r.surfaces}`))].join(' '));
  for (const sp of shots) { const [sz, fam, ...mods] = sp.split(':'); const [w, h] = sz.split('x').map(Number); await open(w, h, 2); const pk = mods.find((m) => m.startsWith('pick=')); await state(fam, mods.includes('mix') ? 'mix' : pk ? pk.slice(5) : null, mods.includes('ft')); await new Promise((r) => setTimeout(r, 250)); const f = path.join(out, sp.replace(/[:=]/g, '_') + '.png'); await page.screenshot({ path: f, fullPage: mods.includes('full') }); console.log(f); }
  if (errs.length) console.log('ERRORS:', [...new Set(errs)].slice(0, 8).join(' | '));
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
