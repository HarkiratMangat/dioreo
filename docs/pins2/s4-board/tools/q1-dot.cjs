// Q1 of docs/pins2/plan/2026-10-08-s4-spec-board.md, drawn for him: the category field's dot in a field, two ways, each stacked under the weapon field
// so the words' start can be compared. A: as drawn (dot 8, 14 from the edge, words 10 after it, at 32). B: the dot centred in the 16 icon slot (words
// at 40, in line with the weapon field's). Writes work/lead/q1/q1-{A,B}-{wep,cat}.png; magick stacks them. Usage: node q1-dot.cjs
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const OUT = path.join(__dirname, 'q1'); fs.mkdirSync(OUT, { recursive: true });
const BASE = '.spec .ov, .spec .inks, .spec .fg-fs { display: none !important; }';
const VAR = { A: '', B: '.spec #fields .fl-cat .f-pre.f-ic:not(#_):not(#_) { padding-left: 18px !important; } .spec #fields .fl-cat .f-pre.f-ic + .f-in:not(#_):not(#_) { padding-left: 14px !important; }' };
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'q1-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 900, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await new Promise((r) => setTimeout(r, 2500));
  await p.addStyleTag({ content: BASE });
  for (const [k, css] of Object.entries(VAR)) {
    await p.evaluate((css) => { let s = document.getElementById('q1v'); if (!s) { s = document.createElement('style'); s.id = 'q1v'; document.head.appendChild(s); } s.textContent = css; }, css);
    for (const f of ['wep', 'cat']) {
      const r = await p.evaluate((f) => { const e = document.querySelector(`#fields .fl-${f} .f-fld`); e.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = e.getBoundingClientRect(); const i = e.querySelector('input'); const ip = getComputedStyle(i); return { x: q.left - 16 + scrollX, y: q.top - 12 + scrollY, w: q.width + 32, h: q.height + 24, words: i.getBoundingClientRect().left + parseFloat(ip.paddingLeft) - q.left }; }, f);
      await new Promise((res) => setTimeout(res, 250)); await p.screenshot({ path: path.join(OUT, `q1-${k}-${f}.png`), clip: { x: r.x, y: r.y, width: r.w, height: r.h } }); console.log(k, f, 'words at', r.words.toFixed(1));
    }
  }
  await b.close();
})();
