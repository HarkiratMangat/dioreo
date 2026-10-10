// Session 4 · does a frozen copy render like Board 4? Renders each copy from freeze.cjs's output on the surface it was taken from,
// screenshots it, and stacks it under the Board 4 crop of the same element (kit on top, copy below) so the two can be compared by eye
// and by pixel difference.  Run:  node local/pins2/s4/work/lead/freeze-check.cjs <frozen.json> <cropdir> [id ...]
const path = require('path'); const fs = require('fs'); const os = require('os'); const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const [frozenF, cropDir, ...only] = process.argv.slice(2); const F = JSON.parse(fs.readFileSync(frozenF, 'utf8'));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'fzc-')), args: ['--no-first-run'] });
  const p = await b.newPage(); await p.setViewport({ width: 1500, height: 1000 });
  const ids = Object.keys(F).filter((k) => !only.length || only.includes(k));
  const html = `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"><style>*{box-sizing:border-box}body{margin:0;background:#111}.c{padding:12px;display:inline-block;margin:0 0 20px}</style>` + ids.map((k) => `<div class="c" id="c-${k}" style="background:${F[k].bg}">${F[k].html}</div><br>`).join('');
  await p.setContent(html, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 300));
  for (const k of ids) {
    const el = await p.$(`#c-${k}`); const f = path.join(cropDir, `${k}.copy.png`); await el.screenshot({ path: f });
    const kit = path.join(cropDir, `${k}.png`); const pair = path.join(cropDir, `${k}.pair.png`);
    try {
      execSync(`magick "${kit}" "${f}" -background '#ff00ff' -gravity northwest -splice 0x4 -append "${pair}"`);
      const diff = execSync(`magick compare -metric AE -fuzz 6% "${kit}" "${f}" null: 2>&1 || true`).toString().trim();
      console.log(`${k}: kit vs copy differing pixels (6% fuzz) ${diff}`);
    } catch (e) { console.log(`${k}: compare failed ${e.message.slice(0, 80)}`); }
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
