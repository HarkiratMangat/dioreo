// Session 4 · the Standard board's layout sweep: every family, every place, settings shut and open, at Harkirat's 1512x950 window.
// Fails loudly on anything he has called out: a scroll inside the plate or the page's width, a sample not drawn at its Board 4 surface's
// width, a settings panel that scrolls, and reports how much the floating panel covers the surface and where the plate ends.
// Why: Harkirat, 2026-10-02 12:23–12:30 EDT — the plate scrolled inside itself, the container was the page, the settings wasted space.
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/board-sweep.cjs <outdir> [FAM:place[:ft] to screenshot ...]
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const out = process.argv[2]; const shots = process.argv.slice(3); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-')), args: ['--no-first-run'] });
  const page = await b.newPage(); await page.setViewport({ width: 1512, height: 950, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  // index.html carries no charset (the Artifact skeleton adds one at publish), so its request is answered here with one; no preview copy
  // is written to disk any more (Harkirat, 2026-10-02 12:53 EDT: the copy kept tripping the overwrite guard)
  await page.setRequestInterception(true);
  page.on('request', (r) => { if (/\/board\/live\/index\.html/.test(r.url())) r.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8">' + fs.readFileSync(path.join(ROOT, 'local/pins2/s4/board/live/index.html'), 'utf8') }); else r.continue(); });
  await page.goto(`http://127.0.0.1:8900/local/pins2/s4/board/live/index.html?b=${Date.now()}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 400));
  const ids = await page.evaluate(() => FAM.map((f) => f.id));
  const rows = [];
  const measure = (fam, j, ft) => page.evaluate((fam, j, ft) => {
    S.place = S.place || {}; S.place[fam] = j; S.ft = ft; go(fam);
    const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
    const pl = $('#plate'), sf = $('#stack .bk-layer.on .bk-sf') || $('#stack .bk-layer .bk-sf'), ins = $('#insp'), fz = $('#stack .fzw[data-fz]');
    const z = fz && FZ[fz.dataset.fz]; const P = R(pl), F = R(sf), I = ft ? R(ins) : null;
    const ov = I && F ? Math.max(0, Math.min(I.r, F.r) - Math.max(I.x, F.x)) * Math.max(0, Math.min(I.b, F.b) - Math.max(I.y, F.y)) : 0;
    return { fam, j, ft, fz: fz ? fz.dataset.fz : '', docW: document.documentElement.scrollWidth, plX: pl.scrollWidth - pl.clientWidth, plY: pl.scrollHeight - pl.clientHeight,
      frW: F ? Math.round(F.w) : 0, ctrW: z && z.ctr ? z.ctr.w : 0, plBottom: Math.round(P.b), insH: I ? Math.round(I.h) : 0, insScroll: ft ? ins.scrollHeight - ins.clientHeight : 0, cover: F && ov ? Math.round(100 * ov / (F.w * F.h)) : 0 };
  }, fam, j, ft);
  for (const id of ids) {
    const n = await page.evaluate((id) => placeCtxs(BY[id]).length, id);
    for (let j = 0; j < n; j++) for (const ft of [false, true]) rows.push(await measure(id, j, ft));
  }
  const bad = rows.filter((r) => r.docW > 1512 || r.plX > 0 || r.plY > 0 || (r.fz && r.frW !== r.ctrW) || r.insScroll > 0);
  fs.writeFileSync(path.join(out, 'sweep.json'), JSON.stringify(rows, null, 1));
  console.log(`rows ${rows.length} · framed ${rows.filter((r) => r.fz).length} · violations ${bad.length} · page errors ${errs.length}`);
  for (const r of bad) console.log('VIOLATION', JSON.stringify(r));
  const open = rows.filter((r) => r.ft);
  console.log('panel height max', Math.max(...open.map((r) => r.insH)), '· covers the surface (worst 5):', open.sort((a, c) => c.cover - a.cover).slice(0, 5).map((r) => `${r.fam}/${r.j} ${r.cover}%`).join(', '));
  console.log('plate bottom below 950 (settings shut):', rows.filter((r) => !r.ft && r.plBottom > 950).map((r) => `${r.fam}/${r.j} ${r.plBottom}`).join(', ') || 'none');
  for (const sp of shots) {
    const [fam, j, ft] = sp.split(':');
    await measure(fam, +j || 0, ft === 'ft'); await new Promise((r) => setTimeout(r, 250));
    const f = path.join(out, sp.replace(/:/g, '_') + '.png'); await page.screenshot({ path: f }); console.log(f);
  }
  if (errs.length) console.log('ERRORS', errs.join(' | '));
  await b.close();
})().catch((e) => { console.error(e); process.exit(2); });
