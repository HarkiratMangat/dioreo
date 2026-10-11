// Session 4 · fidelity of the live samples (REBUILD.md C2): renders each captured surface through board/live/sample.js exactly as the
// board does, screenshots it, and compares it with Board 4's own crop of the same surface (live-capture.cjs, hover forced alike).
// Run:  node local/pins2/s4/work/lead/live-check.cjs <live.json> [id ...]   → sweep/live/<id>.copy.png, <id>.pair.png and a diff figure
const path = require('path'); const fs = require('fs'); const os = require('os'); const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const [liveF, ...only] = process.argv.slice(2); const KIT = JSON.parse(fs.readFileSync(liveF, 'utf8')); const DIR = path.join(path.dirname(liveF), 'live');
const SAMPLE = fs.readFileSync(path.join(ROOT, 'local/pins2/s4/board/live/sample.js'), 'utf8');
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'lc-')), args: ['--no-first-run'] });
  const p = await b.newPage(); await p.setViewport({ width: 1400, height: 1000 }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const ids = Object.keys(KIT.samples).filter((k) => !only.length || only.includes(k));
  await p.setContent(`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Big+Shoulders+Display:wght@500;600;700&display=swap"><style>body{margin:0;background:#0F1418}.c{margin:0 0 40px}</style><div id="out"></div>`, { waitUntil: 'networkidle0' });
  await p.evaluate((kit) => { window.KIT = kit; }, KIT); await p.addScriptTag({ content: SAMPLE });
  await p.evaluate((ids) => { for (const id of ids) { const c = document.createElement('div'); c.className = 'c'; c.id = 'c-' + id; document.getElementById('out').appendChild(c); FZS.mount(c, id, ''); } }, ids);
  await p.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 500));
  // the structural check, element by element against Board 4's computed style (a pixel average hid 30 square corners at 0.2%)
  const SIGF = liveF.replace(/\.json$/, '-sig.json'); const SIG = fs.existsSync(SIGF) ? JSON.parse(fs.readFileSync(SIGF, 'utf8')) : {};
  const struct = await p.evaluate((ids, SIG) => { const out = {}; for (const id of ids) { const sig = SIG[id]; if (!sig) { out[id] = null; continue; } const h = document.querySelector('#c-' + CSS.escape(id) + ' .fz-host'); let n = 0, bad = 0; const props = {}; const ex = [];
      for (const [i, k] of Object.entries(sig)) { const e = h.shadowRoot.querySelector(`[data-fzi="${i}"]`); if (!e) continue; n++; const cs = getComputedStyle(e); let miss = false;
        for (const [q, v] of Object.entries(k)) { const c = cs.getPropertyValue(q); if (c === v) continue; if ((q === 'width' || q === 'height') && Math.abs(parseFloat(c) - parseFloat(v)) < 0.6) continue; const nc = c.match(/-?[\d.]+/g), nv = v.match(/-?[\d.]+/g); if (nc && nv && nc.length === nv.length && c.replace(/-?[\d.]+/g, '#') === v.replace(/-?[\d.]+/g, '#') && nc.every((x, j) => Math.abs(+x - +nv[j]) < 0.1)) continue; miss = true; props[q] = (props[q] || 0) + 1; if (ex.length < 3) ex.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${q}: ${v} → ${c}`); }
        if (miss) bad++; }
      out[id] = { n, bad, props: Object.entries(props).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([q, c]) => q + '×' + c).join(' '), ex }; } return out; }, ids, SIG);
  for (const id of ids) {
    const h = await p.evaluateHandle((id) => document.querySelector('#c-' + CSS.escape(id) + ' .fz-host').shadowRoot.querySelector('[data-fz-surf]'), id);
    const f = path.join(DIR, `${id}.copy.png`); await h.asElement().screenshot({ path: f, captureBeyondViewport: true });
    const kit = path.join(DIR, `${id}.kit.png`); const pair = path.join(DIR, `${id}.pair.png`);
    try {
      execSync(`magick "${kit}" "${f}" -background '#ff00ff' -gravity northwest -splice 0x4 -append "${pair}"`);
      const dim = execSync(`magick identify -format '%wx%h' "${kit}" ; echo; magick identify -format '%wx%h' "${f}"`).toString().trim().split('\n');
      const diff = execSync(`magick compare -metric AE -fuzz 6% "${kit}" "${f}" null: 2>&1 || true`).toString().trim();
      const [w, hh] = dim[0].split('x').map(Number); const n = parseFloat(diff); const st = struct[id];
      console.log(`${id.padEnd(13)} pixels ${isNaN(n) ? '?' : (100 * n / (w * hh)).toFixed(2) + '%'} · elements ${st ? `${st.bad}/${st.n} differ${st.bad ? ' — ' + st.props + ' · ' + st.ex.join(' | ') : ''}` : 'no signature'}`);
    } catch (e) { console.log(`${id}: compare failed ${e.message.slice(0, 100)}`); }
  }
  if (errs.length) console.log('page errors:', errs.join(' | '));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
