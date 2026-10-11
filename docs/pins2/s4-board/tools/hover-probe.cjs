// 2026-10-10 21:07 EDT: his "the icon button styles are nearly all broken on their hover". In standards mode (as published), for every button in a section:
// its inks at rest, then with a real mouse on its centre — what is under the pointer, whether the button matches :hover, and what changed.
// Usage: node hover-probe.cjs <sectionId> [max]
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const PAGE = path.join(ROOT, 'docs/pins2/s4-board/spec.html'); const URL = 'http://127.0.0.1:8900/docs/pins2/s4-board/spec.html';
const [SEC, MAX = '400'] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'hp-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888 }); await p.setCacheEnabled(false); await p.setRequestInterception(true);
  p.on('request', (r) => { if (r.url() === URL) r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset=utf8></head><body>' + fs.readFileSync(PAGE, 'utf8') + '</body></html>' }); else r.continue(); });
  await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(4000); await p.evaluate(() => dispatchEvent(new Event('spec-show-copies'))); await sleep(1500);
  const n = await p.evaluate((S) => { const s = document.getElementById(S); const bs = [...s.querySelectorAll('button')].filter((x) => x.getClientRects().length && !x.closest('.callc, .callx, .tgl'));
    bs.forEach((x, i) => x.setAttribute('data-hp', i)); return bs.length; }, SEC);
  const ink = (i) => p.evaluate((i) => { const e = document.querySelector(`[data-hp="${i}"]`); const c = getComputedStyle(e); const ic = e.querySelector('svg'); return { bg: c.backgroundColor, sh: c.boxShadow, bo: c.borderTopColor, co: c.color, ic: ic ? getComputedStyle(ic).color : '', cell: (e.closest('[data-facts],[data-na],[data-bsel],[data-bfix]') || {}).dataset ? JSON.stringify(Object.assign({}, (e.closest('[data-facts],[data-bsel],[data-bfix]') || { dataset: {} }).dataset)) : '' }; }, i);
  const rows = []; let dead = 0;
  for (let i = 0; i < Math.min(n, +MAX); i++) {
    await p.evaluate((i) => document.querySelector(`[data-hp="${i}"]`).scrollIntoView({ block: 'center' }), i); await p.mouse.move(2, 2); await sleep(120);
    const r = await ink(i); const bb = await (await p.$(`[data-hp="${i}"]`)).boundingBox(); if (!bb) continue;
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(450);
    const h = await ink(i); const top = await p.evaluate((x, y, i) => { const t = document.elementFromPoint(x, y); const e = document.querySelector(`[data-hp="${i}"]`); return { top: t ? t.tagName.toLowerCase() + '.' + String(t.className && t.className.baseVal !== undefined ? t.className.baseVal : t.className).split(' ').slice(0, 2).join('.') : '', inside: Boolean(t && (t === e || e.contains(t))), hov: e.matches(':hover') }; }, bb.x + bb.width / 2, bb.y + bb.height / 2, i);
    const changed = ['bg', 'sh', 'bo', 'co', 'ic'].filter((k) => r[k] !== h[k]); if (!changed.length) dead++;
    rows.push(`${String(i).padStart(3)} ${changed.length ? 'changes ' + changed.join(',') : 'NO CHANGE'} · hover ${top.hov} · under ${top.inside ? 'itself' : top.top} · ${r.cell}`);
  }
  console.log(rows.join('\n')); console.log(`${SEC}: ${rows.length} buttons, ${dead} unchanged on hover`); await b.close();
})();
