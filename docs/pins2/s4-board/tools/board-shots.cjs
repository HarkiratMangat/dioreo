// Session 4 · screenshots of Board 4: Standard's local preview at Harkirat's desktop width, one per family state, for the
// look-before-showing pass (the Browser pane cannot screenshot while it is hidden). Needs repo-static on :8900.
// Run: node local/pins2/s4/work/lead/board-shots.cjs <outdir> [state ...]   a state is FAM or FAM:diff4 or FAM:pick=ID
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const out = process.argv[2]; const states = process.argv.slice(3);
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'shots-')), args: ['--no-first-run'] });
  const page = await b.newPage(); await page.setViewport({ width: 1512, height: 950, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  // index.html carries no charset (the Artifact skeleton adds one at publish), so its request is answered here with one; no preview copy
  // is written to disk any more (Harkirat, 2026-10-02 12:53 EDT: the copy kept tripping the overwrite guard)
  await page.setRequestInterception(true);
  page.on('request', (r) => { if (/\/board\/live\/index\.html/.test(r.url())) r.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8">' + fs.readFileSync(path.join(ROOT, 'local/pins2/s4/board/live/index.html'), 'utf8') }); else r.continue(); });
  await page.goto(`http://127.0.0.1:8900/local/pins2/s4/board/live/index.html?b=${Date.now()}#F`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 500));
  for (const s of states) {
    const [fam, mod] = s.split(':');
    await page.evaluate((fam, mod) => {
      go(fam);
      if (mod && mod.startsWith('pick=')) { V.shown = mod.slice(5); pickPreset(mod.slice(5)); }
      if (mod && mod.startsWith('diff')) { setDiff(true); const z = +mod.slice(4) || 1; V.zoom = z; document.querySelectorAll('[data-bz]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.bz) === String(z))); fitPlate(); viewPlate(); }
      if (mod && mod.startsWith('show=')) { V.shown = mod.slice(5); viewPlate(); }
      document.querySelector('#stage').scrollTop = 0;
    }, fam, mod || '');
    await new Promise((r) => setTimeout(r, 350));
    const f = path.join(out, s.replace(/[:=]/g, '_') + '.png'); await page.screenshot({ path: f }); console.log(f);
  }
  console.log('errors', errs.length, errs.join(' | '));
  await b.close();
})().catch((e) => { console.error(e); process.exit(2); });
