// Severity meter (Harkirat 2026-10-05 23:01 EDT: "that's actually broken ... look at board 4 collective vs builder-2"), shot and dumped the same way. Derived from tier-compare: "tier empty ... that button is literally broken. look at it on board 4 collective vs your
// screenshot". The tier row with its "No tier" button, shot the same way on Board 4: Collective (the kit), Builder-2 with nothing set, and
// Builder-2 with his saved state; plus the computed box of each tier button, so the difference is named, not guessed.
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const { execFileSync } = require('child_process');
const OUT = path.join(__dirname, 'meter'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const CT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp' };
  const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(ROOT, u); try { let b = fs.readFileSync(f); const ext = path.extname(f); if (ext === '.html') b = Buffer.concat([Buffer.from('<!doctype html>'), b]); r.writeHead(200, { 'content-type': CT[ext] || 'application/octet-stream' }); r.end(b); } catch (e) { r.writeHead(404); r.end(); } });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const port = srv.address().port;
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bd-tier-')) });
  const his = fs.readFileSync(path.join(__dirname, 'state3/his-state.json'), 'utf8');
  const runs = [
    { name: 'collective', url: '/docs/pins2/kit/board4.html', state: null },
    { name: 'builder-empty', url: '/docs/pins2/s4-board/builder.html', state: '' },
    { name: 'builder-his', url: '/docs/pins2/s4-board/builder.html', state: his },
  ];
  const res = {};
  for (const run of runs) {
    const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 });
    if (run.state !== null) await p.evaluateOnNewDocument((s) => { try { if (s) localStorage.setItem('bd-state', s); else localStorage.removeItem('bd-state'); } catch (e) {} }, run.state);
    await p.goto(`http://127.0.0.1:${port}${run.url}`, { waitUntil: 'networkidle0', timeout: 90000 });
    if (run.state !== null) await p.waitForFunction(() => window.__bd && window.__bd.mounted, { timeout: 60000 });
    else await p.waitForFunction(() => document.querySelector('#board span.b3-meter'), { timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1200));
    const info = await p.evaluate(() => { const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; for (const a of document.getAnimations()) { try { if (isFinite(a.effect.getComputedTiming().endTime)) a.finish(); } catch (e) {} }
      const m0 = [...document.querySelectorAll('#board span.b3-meter')].find((x) => x.getBoundingClientRect().width > 0); const row = m0.parentElement.parentElement; row.scrollIntoView({ block: 'center', behavior: 'instant' }); const rr = row.getBoundingClientRect();
      const one = (e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { t: (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 20), cls: e.className, box: [r.left - rr.left, r.width, r.height].map((x) => +x.toFixed(1)).join(' / '), disp: c.display, ai: c.alignItems, jc: c.justifyContent, pad: c.padding, fs: c.fontSize, lh: c.lineHeight, bs: c.boxShadow.slice(0, 40), bg: c.backgroundColor }; };
      const mc = getComputedStyle(m0); const kid = (k) => { const c = getComputedStyle(k); const r = k.getBoundingClientRect(); return `${k.tagName.toLowerCase()}.${k.className} ${r.width.toFixed(1)}x${r.height.toFixed(1)} bg ${c.backgroundColor} op ${c.opacity} disp ${c.display} m ${c.margin} br ${c.borderRadius}`; };
      return { meter: { cls: m0.className, html: m0.outerHTML.slice(0, 300), disp: mc.display, gap: mc.columnGap, h: mc.height, w: mc.width, ai: mc.alignItems, kids: [...m0.children].map(kid) }, row: { cls: row.className, w: +rr.width.toFixed(1), h: +rr.height.toFixed(1) }, rect: { x: Math.max(0, rr.left - 12), y: Math.max(0, rr.top - 12), w: Math.min(900, rr.width + 24), h: rr.height + 24 } }; });
    await new Promise((r) => setTimeout(r, 200));
    const full = path.join(OUT, `${run.name}-full.png`); await p.screenshot({ path: full });
    res[run.name] = info; await p.close();
  }
  console.log(JSON.stringify(res, null, 1));
  await b.close(); srv.close();
})().catch((e) => { console.error('tier FAIL', e.message); process.exit(1); });
