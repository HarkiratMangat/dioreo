// The selection bar section at each switch position (24 · 32 · today), and the clone against the board: the bar's size and each in-list button's height.
// Usage: node selbar-shot.cjs → spec-check/sec-selbar-<mode>.png
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = path.join(__dirname, 'spec-check'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 180000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sbs-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 1400 }); await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await sleep(2500);
  await p.addStyleTag({ content: '.spec .sbar { position: static !important; }' }); const board = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/pins2/s4-board/spec-img/board-dom.json'), 'utf8')).selbar;
  for (const [mode, label] of [['today', 'today · 28'], ['S', '24'], ['M', '32']]) {
    await p.evaluate((label) => { const t = [...document.querySelectorAll('#selbar .accsw button')].find((x) => x.textContent.trim() === label); t.click(); }, label); await sleep(700);
    const m = await p.evaluate(() => { const bar = document.querySelector('#selbar .b3-sd'); const r = bar.getBoundingClientRect(); const hs = {}; bar.querySelectorAll('.b3-sd-code, .b3-fchip, .b3-x').forEach((e) => { const k = e.classList[0]; const q = e.getBoundingClientRect(); (hs[k] = hs[k] || new Set()).add(`${Math.round(q.width)}×${Math.round(q.height)}`); }); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), hs: Object.fromEntries(Object.entries(hs).map(([k, v]) => [k, [...v].join(' ')])) }; });
    console.log(`${mode.padEnd(6)} bar ${m.w}×${m.h}${mode === 'today' ? ` (board ${board.w}×${board.h})` : ''} · ${Object.entries(m.hs).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    if (mode === 'today' && (Math.abs(m.w - board.w) > 0.6 || Math.abs(m.h - board.h) > 0.6)) { console.log(`FAULT clone ${m.w}×${m.h} ≠ board ${board.w}×${board.h}`); process.exitCode = 1; }
    const el = await p.$('#selbar'); await el.screenshot({ path: path.join(OUT, `sec-selbar-${mode}.png`) }); }
  await b.close();
})().catch((e) => { console.error('selbar-shot FAIL', e.message); process.exit(1); });
