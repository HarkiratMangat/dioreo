// Read-only probe of Board 4: Collective (ref-kit): does a WHOLE font size alone put C1's group-head words on the row's middle, without the
// transform nudges? Style overrides live in page memory only; nothing on disk changes. Ink is measured from a DPR-4 screenshot of "HHHH"
// set in the real element: the middle of its ink extent (rows over 50% coverage) and, as a cross-check, the coverage-weighted centroid.
// Each variant runs twice: with the row where it sits today, and with the same row moved onto a whole pixel.
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const ROOT = '/Applications/Claude Code/Diors-Builds';
const puppeteer = require(ROOT + '/node_modules/puppeteer-core');
const CT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png', '.webp': 'image/webp' };
(async () => {
  const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(ROOT, u); try { let b = fs.readFileSync(f); const ext = path.extname(f); if (ext === '.html' && !/^\s*<!doctype/i.test(b.toString('utf8', 0, 64))) b = Buffer.concat([Buffer.from('<!doctype html>'), b]); r.writeHead(200, { 'content-type': CT[ext] || 'application/octet-stream' }); r.end(b); } catch (e) { r.writeHead(404); r.end(); } });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const port = srv.address().port;
  const br = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ink-')) });
  const p = await br.newPage(); await p.setViewport({ width: 1480, height: 834, deviceScaleFactor: 4 });
  await p.goto(`http://127.0.0.1:${port}/local/pins2/s4/ref-kit/board4.html`, { waitUntil: 'networkidle0', timeout: 90000 });
  await p.evaluate(async () => { await document.fonts.ready; });
  await p.waitForFunction(() => !!document.querySelector('.wg-h > .wg-line > b'), { timeout: 30000 });
  await p.evaluate(() => document.querySelector('.wg-h').scrollIntoView({ block: 'center' }));
  const measure = async (sel) => {
    const g = await p.evaluate((sel) => { const h = document.querySelector('.wg-h'), e = h.querySelector(sel); const r = e.getBoundingClientRect(), R = h.getBoundingClientRect(); return { x: r.left, w: r.width, top: R.top, hgt: R.height, mid: R.top + R.height / 2, sx: scrollX, sy: scrollY }; }, sel);
    const b64 = await p.screenshot({ clip: { x: g.x + g.sx, y: g.top + g.sy + 2, width: g.w, height: g.hgt - 4 }, encoding: 'base64' });
    const m = await p.evaluate(async (b64, dpr) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
      const cnt = new Map(); for (let k = 0; k < d.length; k += 4) { const key = (d[k] >> 2) + ',' + (d[k + 1] >> 2) + ',' + (d[k + 2] >> 2); cnt.set(key, (cnt.get(key) || 0) + 1); }
      const bg = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map((v) => v * 4 + 2);
      const w = new Float64Array(W * H); let mx = 0;
      for (let k = 0, j = 0; k < d.length; k += 4, j++) { const v = Math.max(Math.abs(d[k] - bg[0]), Math.abs(d[k + 1] - bg[1]), Math.abs(d[k + 2] - bg[2])); w[j] = v; if (v > mx) mx = v; }
      let sw = 0, sy = 0, top = H, bot = -1;
      for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) { const v = w[y * W + i] / mx; if (v > 0.08) { sw += v; sy += v * (y + 0.5); } if (v > 0.5) { if (y < top) top = y; if (y > bot) bot = y; } }
      return { cy: sy / sw / dpr + 2, top: top / dpr + 2, bot: (bot + 1) / dpr + 2 };
    }, b64, 4);
    return { ext: g.top + (m.top + m.bot) / 2 - g.mid, cen: g.top + m.cy - g.mid, pageTop: g.top + g.sy };
  };
  const set = async (bFs, sFs, nudges) => p.evaluate((bFs, sFs, nudges) => {
    let st = document.getElementById('probe'); if (!st) { st = document.createElement('style'); st.id = 'probe'; document.head.appendChild(st); }
    const h = document.querySelector('.wg-h'); h.querySelector('.wg-line > b').textContent = 'HHHH'; h.querySelector('.wg-line > small').textContent = 'HHHH';
    st.textContent = (bFs ? `.wg-h > .wg-line > b{font-size:${bFs} !important}` : '') + (sFs ? `.wg-h > .wg-line > small{font-size:${sFs} !important}` : '') + (nudges ? '' : '.wg-h > .wg-line > :is(b,small){transform:none !important}');
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, bFs, sFs, nudges);
  const place = async (shift) => p.evaluate((shift) => { const h = document.querySelector('.wg-h'); h.style.marginTop = ''; if (shift) { const t = h.getBoundingClientRect().top + scrollY; const d = (1 - (t % 1)) % 1; h.style.marginTop = d + 'px'; } return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, shift);
  const f = (v) => (v >= 0 ? '+' : '') + v.toFixed(2);
  const rows = [['today: 14.5 / 9.5, nudges on', null, null, true], ['today: 14.5 / 9.5, nudges off', null, null, false], ['14 / 9, no nudges', '14px', '9px', false], ['15 / 10, no nudges', '15px', '10px', false]];
  for (const shift of [false, true]) {
    await place(shift);
    console.log(shift ? '\n— the same row moved onto a whole pixel —' : '— the row where it sits today —');
    for (const [label, bFs, sFs, n] of rows) {
      await set(bFs, sFs, n);
      const a = await measure('.wg-line > b'), c = await measure('.wg-line > small');
      console.log(`${label.padEnd(32)} row top ${a.pageTop.toFixed(2)} · name ${f(a.ext)} (centroid ${f(a.cen)}) · category ${f(c.ext)} (centroid ${f(c.cen)})`);
    }
  }
  await br.close(); srv.close();
})().catch((e) => { console.error('PROBE FAIL', e.message); process.exit(1); });
