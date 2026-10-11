// 2026-10-10 22:06 EDT: his "we need to clear up the definition of each style, the exact rest/hover behavior/colors/etc of each style, and the default view of each style".
// Every board button the spec board reads (board-dom.json, all groups with buttons), its rest and hover inks named with the page's own inkName, grouped by the
// style its twin is named with on the board's cards. Usage: node style-census.cjs > census.txt
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const PAGE = path.join(ROOT, 'docs/pins2/s4-board/spec.html'); const URL = 'http://127.0.0.1:8900/docs/pins2/s4-board/spec.html';
const DOM = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/pins2/s4-board/spec-img/board-dom.json'), 'utf8'));
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sc-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888 }); await p.setRequestInterception(true);
  p.on('request', (r) => { if (r.url() === URL) r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset=utf8></head><body>' + fs.readFileSync(PAGE, 'utf8') + '</body></html>' }); else r.continue(); });
  await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(4000); await p.evaluate(() => dispatchEvent(new Event('spec-show-copies'))); await sleep(1500);
  const names = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-bname]')].flatMap((c) => [...c.querySelectorAll('[data-bsel]')].map((t) => [t.dataset.bsel, c.dataset.bname]))));
  const rows = await p.evaluate((DOM, names) => { const N = window.__inkName; const out = [];
    const edge = (k) => { if (!k) return '—'; if (parseFloat(k.border) > 0 && !/none/.test(k.border)) return (N(k.border.replace(/^[\d.]+px \w+ /, '')) || '?') + ' (border)'; const m = /^(.*?) 0px 0px 0px (\d+)px inset/.exec(k.ring || ''); return m && !/rgba\(0, 0, 0, 0\)/.test(m[1]) ? (N(m[1]) || m[1]) : '—'; };
    for (const [g, fam] of Object.entries(DOM)) for (const [sel, v] of Object.entries(fam || {})) { if (!v || !v.rest || !/button|\.x\b/.test(sel)) continue; const R = v.rest, H = v.hover || {};
      out.push({ g, sel, name: names[sel] || '(not on a card)', text: v.text || v.label || '', rf: N(R.bg) || '—', re: edge(R.skin || R), rw: N(R.color) || '?', hf: N(H.bg) || '—', he: edge(H.skin || H), hw: N(H.color) || '?' }); }
    return out; }, DOM, names);
  const style = (n) => (/\.(wash|tint|fill|paint)/.exec(n) || [, '?'])[1];
  rows.sort((a, z) => (style(a.name) + a.name).localeCompare(style(z.name) + z.name));
  for (const r of rows) console.log([style(r.name).padEnd(5), r.name.padEnd(46), r.text.slice(0, 16).padEnd(16), `REST ${r.rf} | ${r.re} | ${r.rw}`.padEnd(70), `HOVER ${r.hf} | ${r.he} | ${r.hw}`].join(' '));
  await b.close();
})();
