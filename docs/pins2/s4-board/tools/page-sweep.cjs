// The whole-page sweep, run before every spec-board publish (2026-10-09 19:38 EDT, after his screenshot of a pop-up floating over Text sizes): loads the page as
// published (a doctype, so standards mode), scrolls from the top to the foot as he reads, and at every step reports anything drawn on screen that belongs to a
// section not on screen, or any fixed element other than the page's own chrome. Then every call card: one per call, and each index jump lands it in view.
// Usage: node page-sweep.cjs [width]
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const PAGE = path.join(ROOT, 'docs/pins2/s4-board/spec.html'); const URL = 'http://127.0.0.1:8900/docs/pins2/s4-board/spec.html'; const W = +(process.argv[2] || 1440);
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ps-')) });
  const guard = setTimeout(() => { console.error('page-sweep: hung'); process.exit(2); }, 240000);
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.setViewport({ width: W, height: 900 }); await p.setCacheEnabled(false); await p.setRequestInterception(true);
  p.on('request', (r) => { if (r.url() === URL) r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset=utf8></head><body>' + fs.readFileSync(PAGE, 'utf8') + '</body></html>' }); else r.continue(); });
  await p.goto(URL, { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await sleep(3000);
  const H = await p.evaluate(() => document.documentElement.scrollHeight); const bad = new Set();
  for (let y = 0; y < H; y += 700) { await p.evaluate((y) => scrollTo(0, y), y); await sleep(250);
    const found = await p.evaluate(() => { const out = []; const vh = innerHeight; const onScreen = (r) => r.bottom > 0 && r.top < vh && r.width > 1 && r.height > 1;
      for (const e of document.querySelectorAll('.spec *')) { const cs = getComputedStyle(e); if (cs.position !== 'fixed' && !e.matches('.b3-pc, .b3-hc')) continue; if (e.closest('.sbar, .spy, .top')) continue; if (cs.display === 'none' || cs.display === 'contents' || cs.visibility === 'hidden' || +cs.opacity < 0.05) continue;
        const r = e.getBoundingClientRect(); if (!onScreen(r)) continue; const sec = e.closest('section[id]'); const sr = sec && sec.getBoundingClientRect();
        if (cs.position === 'fixed' || !sec || !(sr.bottom > r.top && sr.top < r.bottom)) out.push(`${(sec && sec.id) || '?'} ${e.tagName}.${String(e.className.baseVal ?? e.className).slice(0, 40)} ${cs.position} y${Math.round(r.top)}`); }
      return out; });
    found.forEach((f) => bad.add(`at ${y}: ${f}`)); }
  console.log(`page-sweep @${W}: ${bad.size ? bad.size + ' stray' : 'nothing stray'} (height ${H})`); [...bad].slice(0, 12).forEach((x) => console.log('  ' + x));
  const calls = await p.evaluate(() => { const ids = [...document.querySelectorAll('[id^="call-"]')].map((e) => e.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i); return { n: ids.length, dup, ids }; });
  console.log(`calls: ${calls.n} cards${calls.dup.length ? ', duplicated ' + calls.dup.join(',') : ''}`);
  const jumps = await p.$$('.callx .cx-j'); const miss = [];
  for (let i = 0; i < jumps.length; i++) { await p.evaluate((i) => document.querySelectorAll('.callx .cx-j')[i].click(), i); await sleep(900);
    const r = await p.evaluate((i) => { const li = document.querySelectorAll('.callx li')[i]; const txt = li.querySelector('.cx-q').textContent.slice(0, 30); const el = [...document.querySelectorAll('.callc')].find((c) => c.querySelector('.call-q').textContent.startsWith(txt.slice(0, 20))); if (!el) return 'no card: ' + txt; const q = el.getBoundingClientRect(); return q.top >= 0 && q.top < innerHeight - 60 && q.height > 20 ? '' : `off screen (${Math.round(q.top)}): ${txt}`; }, i); if (r) miss.push(r); }
  console.log(`jumps: ${jumps.length} tried${miss.length ? ', failed: ' + miss.join(' | ') : ', every card landed in view'}`);
  console.log('errors', errs.slice(0, 5)); clearTimeout(guard); await b.close();
})().catch((e) => { console.error('page-sweep FAIL', e.message); process.exit(1); });
