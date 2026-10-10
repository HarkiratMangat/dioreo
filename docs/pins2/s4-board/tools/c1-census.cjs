// Every button on C1, once (2026-10-06 19:20 EDT, his review of V21: "the views/amount you're stating where these buttons appear is
// incorrect … we start c1 button and you listed the entire boards buttons"). The builder with his saved state at 1282×888; C1 only, in each of
// its states (rest + its six tries), counting UNIQUE elements per state — never summed across states. A button that only shows while its row
// is hovered is counted too and marked. Grouped by the element's own component classes (state classes left out). Output: c1-census.json.
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = process.env.BD_STATE || path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'c1c-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 1 });
  const st = fs.readFileSync(STATE, 'utf8'); await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, st);
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__bd && window.__bd.mounted && document.querySelector('#c-manifest .wg-h'), { timeout: 60000 }); await sleep(1200);
  await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
  const STATES = ['rest', 'Open a problem', 'Open another', 'Pick one build', 'Pick three', 'Pick eight', 'Clear'];
  const out = {};
  for (const s of STATES) {
    if (s !== 'rest') { await p.evaluate((s) => { const g = document.getElementById('c-manifest'); const btn = [...g.querySelectorAll('.b4-try button')].find((x) => x.textContent.trim() === s); if (btn) btn.click(); }, s); await sleep(s.startsWith('Open') ? 1400 : 900); }
    out[s] = await p.evaluate(() => {
      const M = BD.measure; const g = document.getElementById('c-manifest'); const roots = [g, ...[...document.querySelectorAll('.b4-pop, .b3-datepop, .f-menu, [role=dialog], [role=tooltip], .tip, .b3-peek')].filter((x) => !g.contains(x) && !x.closest('#c1-looks, #bd-host'))];
      const STATE_CLS = /^(on|off|open|is-|has-|sel|active|hot|cur|picked|checked|busy|done|pending|in|out|mine|sm|lg)$/;
      const rows = []; const seen = new Set();
      for (const R of roots) for (const e of R.querySelectorAll('button, [role=button], [role=checkbox], [role=switch], [role=tab], a[href], summary, input[type=checkbox], input[type=radio], input[type=search], input[type=text], label.chip')) {
        if (seen.has(e) || e.closest('.b4-try, .pb-head, .pb-new')) continue; seen.add(e); if (!M.inStage(e) && R === g) continue;
        const cs = getComputedStyle(e); if (cs.display === 'none' || !e.getClientRects().length) continue;
        const vis = M.visible(e); const r = e.getBoundingClientRect();
        const cls = [...e.classList].filter((c) => !STATE_CLS.test(c)).sort();
        const key = `${e.tagName.toLowerCase()}${e.getAttribute('role') ? '[' + e.getAttribute('role') + ']' : ''}${cls.length ? '.' + cls.join('.') : ''}`;
        const name = (e.getAttribute('aria-label') || e.title || (e.innerText || '').replace(/\s+/g, ' ').trim()).slice(0, 40);
        const row = e.closest('.wg-r, .wg-h, .mtools, .wg-heads, .b3-sd, .b3-sd-bar, .b3-pc, [role=dialog]');
        rows.push({ key, name, vis, w: +r.width.toFixed(1), h: +r.height.toFixed(1), where: row ? [...row.classList].slice(0, 2).join('.') : (R === g ? 'C1' : 'pop:' + [...R.classList].slice(0, 2).join('.')) });
      }
      return rows; });
  }
  const types = new Map();
  for (const [s, rows] of Object.entries(out)) for (const r of rows) { let T = types.get(r.key); if (!T) types.set(r.key, (T = { key: r.key, per: {}, hidden: 0, names: [], sizes: new Set(), where: new Set() })); T.per[s] = (T.per[s] || 0) + 1; if (!r.vis && s === 'rest') T.hidden++; if (r.name && T.names.length < 5 && !T.names.includes(r.name)) T.names.push(r.name); T.sizes.add(`${r.w}×${r.h}`); T.where.add(r.where); }
  const list = [...types.values()].map((T) => ({ ...T, sizes: [...T.sizes].slice(0, 6), where: [...T.where] })).sort((a, z) => (z.per.rest || 0) - (a.per.rest || 0));
  fs.writeFileSync(path.join(__dirname, 'c1-census.json'), JSON.stringify(list, null, 1));
  for (const T of list) console.log(`${T.key} | rest ${T.per.rest || 0}${T.hidden ? ' (' + T.hidden + ' hidden till row hover)' : ''} | ${Object.entries(T.per).filter(([k]) => k !== 'rest').map(([k, n]) => k + ':' + n).join(' ')} | ${T.sizes.join(' ')} | ${T.where.join(',')} | ${T.names.join(' / ')}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
