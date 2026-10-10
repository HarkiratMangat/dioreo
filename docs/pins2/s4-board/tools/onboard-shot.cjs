// The spec page's "On the board" section: its picture at 1282 and 390, and per member its name, its clones and what misses its row.
// Usage: node onboard-shot.cjs → spec-check/sec-onboard.png, sec-onboard-390.png
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const SEC = process.argv[2] || 'onboard'; /* CLOSE_GUARD: a browser that will not close (seen 2026-10-09 11:19 EDT) must not hold the run: the results are already printed */
setTimeout(() => process.exit(0), 240000).unref();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = path.join(__dirname, 'spec-check'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 180000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ob-')) });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
  for (const [w, name] of [[1282, `sec-${SEC}.png`], [390, `sec-${SEC}-390.png`]]) {
    await p.setViewport({ width: w, height: 1400 }); await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await p.evaluate(() => document.fonts.ready); await sleep(2500);
    if (w === 1282) { const info = await p.evaluate((sec) => [...document.querySelectorAll(`#${sec} .bm`)].map((m) => { const s0 = m.querySelector('[data-bsel]').dataset.bsel; return { name: m.dataset.bname, sels: [...m.querySelectorAll('[data-bsel]')].map((e) => e.dataset.bsel.replace('button.', '')), miss: (window.__btnMisses[s0] || []).map((x) => `${x.prop} ${x.v}≠${x.e}`) }; }), SEC);
      for (const i of info) console.log(i.name.padEnd(46), '|', i.sels.join(' '), '|', i.miss.join(' · ') || 'on its row');
      const inks = await p.evaluate(async () => { const D = await fetch('spec-img/board-dom.json').then((q) => q.json()).then((j) => j.buttons); const N = window.__inkName; const f = (k) => (k ? `${N(k.bg)} | ${(k.ring || '').slice(0, 60)} | ${k.border}` : '—');
        return Object.entries(D).map(([s, v]) => `${s.replace('button.', '').padEnd(30)} words ${N(v.rest.color)} → ${N(v.hover.color)} · skin rest ${f(v.rest.skin)} · hover ${f(v.hover.skin)}`); });
      console.log(inks.join('\n')); }
    const el = await p.$('#' + SEC); await el.screenshot({ path: path.join(OUT, name) }); }
  console.log('page errors:', errs.length ? errs.slice(0, 5).join(' | ') : 'none'); await b.close();
})().catch((e) => { console.error('onboard-shot FAIL', e.message); process.exit(1); });
