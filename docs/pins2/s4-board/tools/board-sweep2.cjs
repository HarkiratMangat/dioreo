// Session 4 · the V19 contract sweep (local/pins2/s4/board/REBUILD.md C4–C8). Every family × place × {settings shut, open} × {as picked,
// an all-changed mix}, at Harkirat's measured viewport (about 1480×834 inside claude.ai, from his 1.333× screenshot) and at 1512×950.
// Board faults fail the run (page width, a scroll inside the plate, a window not at its surface's width, the panel scrolling or covering
// the sample or the controls, a setting's name cut off, one option left alone on a line); Board 4's own behaviour under a setting is not
// judged here. Screenshots of named states at 2×.
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/board-sweep2.cjs <outdir> [W×H:FAM:place[:ft][:mix] ...]
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const out = process.argv[2]; const shots = process.argv.slice(3); fs.mkdirSync(out, { recursive: true });
const SIZES = [[1280, 834], [1480, 834], [1512, 950]];
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sw2-')), args: ['--no-first-run'] });
  const page = await b.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); }); page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url().slice(0, 140)); });
  await page.setRequestInterception(true);
  page.on('request', (r) => { if (/\/board\/live\/index\.html/.test(r.url())) r.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8">' + fs.readFileSync(path.join(ROOT, 'local/pins2/s4/board/live/index.html'), 'utf8') }); else r.continue(); });
  const open = async (w, h) => { await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 }); await page.goto(`http://127.0.0.1:8900/local/pins2/s4/board/live/index.html?b=${Date.now()}`, { waitUntil: 'networkidle0' }); await page.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 300)); };
  const state = (fam, j, ft, mix) => page.evaluate(async (fam, j, ft, mix) => {
    try { localStorage.clear(); } catch (e) {}
    S.f = {}; S.place = { [fam]: j }; S.ft = ft; delete S.insPos; const F0 = BY[fam];
    if (mix && (F0.props || []).length && (F0.presets || []).length) { const v = pv(F0, F0.rec); F0.props.forEach((p) => { if (p.type === 'range') v[p.k] = Math.round((p.min + (p.max - p.min) * .85) / p.step) * p.step; else if (p.opts) { const o = p.opts.map((x) => x[0]).filter((x) => !eq(x, v[p.k])); if (o.length) v[p.k] = o[o.length - 1]; } }); S.f[fam] = { status: match(F0, v) ? 'preset' : 'custom', base: F0.rec, v, note: '' }; }
    go(fam); await document.fonts.ready; await new Promise((r) => setTimeout(r, 60)); const fm = F(); if (fm) { const [c] = curPlace(fm); if (liveOf(c)) frame(fm, c); }
    const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const ov = (a, c) => a && c ? Math.max(0, Math.min(a.r, c.r) - Math.max(a.x, c.x)) * Math.max(0, Math.min(a.b, c.b) - Math.max(a.y, c.y)) : 0;
    const pl = $('#plate'), ins = $('#insp'), ctl = $('.bk-ctl'), win = $('#stack .bk-layer.on .bk-win');
    const [c] = curPlace(BY[fam]); const smp = c.fz && KIT.samples[c.fz];
    const P = R(pl), I = ft ? R(ins) : null, C = R(ctl), Wn = R(win);
    const room = innerWidth - 8 - ins.offsetWidth >= (P ? P.r : 0);
    const cut = [...document.querySelectorAll('.pr-h label')].filter((l) => l.scrollWidth > l.clientWidth + 1).map((l) => l.textContent);
    const orphan = [...document.querySelectorAll('.opts')].filter((o) => { const bs = [...o.children]; if (bs.length < 3) return false; const tops = bs.map((x) => Math.round(x.getBoundingClientRect().top)); const last = tops[tops.length - 1]; const rows = {}; tops.forEach((t) => { rows[t] = (rows[t] || 0) + 1; }); return rows[last] === 1 && Object.values(rows).some((n) => n > 1); }).map((o) => o.closest('.pr').dataset.k);
    return { fam, j, ft, mix, live: !!smp, docW: document.documentElement.scrollWidth - innerWidth, plX: pl ? pl.scrollWidth - pl.clientWidth : 0, plY: pl ? pl.scrollHeight - pl.clientHeight : 0,
      winW: Wn ? Math.round(Wn.w) : 0, surfW: smp ? Math.round(smp.surf.w) : 0, insScroll: ft ? ins.scrollHeight - ins.clientHeight : 0, insH: I ? Math.round(I.h) : 0,
      room, covPlate: I ? Math.round(ov(I, P)) : 0, covCtl: I ? Math.round(ov(I, C)) : 0, cut, orphan, plateBottom: P ? Math.round(P.b) : 0, tileH: Math.max(0, ...[...document.querySelectorAll('.bk-tile')].map((t) => Math.round(t.getBoundingClientRect().height))) };
  }, fam, j, ft, mix);
  const rows = [];
  for (const [w, h] of SIZES) {
    await open(w, h); const fams = await page.evaluate(() => FAM.map((f) => [f.id, placeCtxs(f).length, (f.props || []).length > 0 && (f.presets || []).length > 0]));
    for (const [id, n, tun] of fams) for (let j = 0; j < n; j++) for (const ft of [false, true]) for (const mix of tun ? [false, true] : [false]) rows.push({ size: `${w}×${h}`, ...(await state(id, j, ft, mix)) });
  }
  const bad = rows.filter((r) => r.docW > 0 || r.plX > 1 || r.plY > 1 || (r.live && r.winW !== r.surfW) || r.insScroll > 0 || r.covPlate > 0 || r.covCtl > 0 || r.cut.length || r.orphan.length || r.tileH > 300);
  fs.writeFileSync(path.join(out, 'sweep2.json'), JSON.stringify(rows, null, 1));
  console.log(`rows ${rows.length} · live ${rows.filter((r) => r.live).length} · violations ${bad.length} · errors ${errs.length}`);
  const key = (r) => [r.docW > 0 && 'page-width', r.plX > 1 && 'plate-x', r.plY > 1 && 'plate-y', r.live && r.winW !== r.surfW && 'window-width', r.insScroll > 0 && 'panel-scrolls', r.covPlate > 0 && 'covers-plate', r.covCtl > 0 && 'covers-controls', r.cut.length && 'label-cut', r.orphan.length && 'orphan-option', r.tileH > 300 && 'tile-tall'].filter(Boolean).join(',');
  const groups = {}; bad.forEach((r) => { (groups[key(r)] = groups[key(r)] || []).push(`${r.size} ${r.fam}/${r.j}${r.ft ? ' set' : ''}${r.mix ? ' mix' : ''}${r.insScroll > 0 ? ' +' + r.insScroll : ''}${r.cut.length ? ' [' + r.cut.join('|') + ']' : ''}${r.orphan.length ? ' {' + r.orphan.join('|') + '}' : ''}${r.covPlate ? ' cov' + r.covPlate : ''}`); });
  for (const [k, v] of Object.entries(groups)) console.log(`${k} (${v.length}): ${v.slice(0, 14).join(' · ')}${v.length > 14 ? ' …' : ''}`);
  const tall = rows.filter((r) => r.ft); console.log('panel tallest:', tall.sort((a, c) => c.insH - a.insH).slice(0, 4).map((r) => `${r.size} ${r.fam}${r.mix ? ' mix' : ''} ${r.insH}px`).join(', '), '· no room for the panel beside:', [...new Set(rows.filter((r) => r.ft && !r.room).map((r) => `${r.size} ${r.fam}/${r.j}`))].slice(0, 12).join(', ') || 'none');
  for (const sp of shots) { const [sz, fam, j, ...mods] = sp.split(':'); const [w, h] = sz.split('x').map(Number); await open(w, h); await state(fam, +j || 0, mods.includes('ft'), mods.includes('mix')); await new Promise((r) => setTimeout(r, 250)); const f = path.join(out, sp.replace(/:/g, '_') + '.png'); await page.screenshot({ path: f }); console.log(f); }
  if (errs.length) console.log('ERRORS:', [...new Set(errs)].slice(0, 8).join(' | '));
  await b.close();
})().catch((e) => { console.error(e); process.exit(2); });
