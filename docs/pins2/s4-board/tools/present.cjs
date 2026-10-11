// Gate by gate, element by element (his 2026-10-06 23:47 EDT): present ONE element of a gate in chat. Usage:
//   node present.cjs <n>            the n-th thing of the gate's first walk view (bd/walk.js, the builder's own reading order)
//   node present.cjs --list         the reading order, numbered
//   GATE=C1 (default) · STATE=<path to his saved state>
// Writes present/<n>-<slug>-where.png (the element's row, the element boxed) and present/<n>-<slug>.png (the element at 2x, at rest and, for
// a control, hovered, pressed and keyboard-focused, each from a real pointer or key), and prints the element's readings as JSON.
const path = require('path'), fs = require('fs'), os = require('os'); const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../../..'); const OUT = path.join(__dirname, 'present'); fs.mkdirSync(OUT, { recursive: true });
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = process.env.STATE || path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json'); const GATE = process.env.GATE || 'C1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const W = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/pins2/s4-board/bd/walk.js'), 'utf8').replace(/^window\.BD_WALK=/, '').replace(/;\s*$/, ''));
const view = W.views.find((v) => v.g === GATE); const arg = process.argv[2];
if (arg === '--list') { view.things.forEach((t, i) => console.log(`${i + 1}\t${t.sel}\t${(t.name || '').slice(0, 60)}`)); process.exit(0); }
const n = +arg; const thing = view.things[n - 1]; if (!thing) { console.error('no thing', arg); process.exit(1); }
const slug = (thing.name || thing.sel).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'el';
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 120000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'pr-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 });
  await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(STATE, 'utf8'));
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__bd && window.__bd.mounted && window.__sx, { timeout: 60000 }); await p.evaluate(() => document.fonts.ready); await sleep(1000);
  await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
  const gid = '#c-' + (view.gid || 'manifest');
  const found = await p.evaluate((gid, sel, name) => { const g = document.querySelector(gid) || document; const els = [...g.querySelectorAll(sel)].filter((e) => e.getClientRects().length && !e.closest('#c1-buttons'));
    const want = (name || '').replace(/\s+/g, ' ').trim(); const e = els.find((x) => x.textContent.replace(/\s+/g, ' ').trim().startsWith(want.slice(0, 24))) || els[0]; if (!e) return null; e.setAttribute('data-present', ''); e.scrollIntoView({ block: 'center', behavior: 'instant' }); return els.length; }, gid, thing.sel, thing.name);
  if (!found) { console.error('not on the page:', thing.sel); await b.close(); process.exit(1); }
  const box = () => p.evaluate(() => { const e = document.querySelector('[data-present]'); const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const shot = async (r, pad, file) => { const s = await p.evaluate(() => [scrollX, scrollY]); fs.writeFileSync(file, Buffer.from(await p.screenshot({ captureBeyondViewport: false, clip: { x: Math.max(0, r.l - pad) + s[0], y: Math.max(0, r.t - pad) + s[1], width: r.w + pad * 2, height: r.h + pad * 2 } }))); };
  const read = () => p.evaluate(() => { const e = document.querySelector('[data-present]'); const c = getComputedStyle(e); const r = e.getBoundingClientRect(); const px = (v) => Math.round(parseFloat(v) * 100) / 100;
    const txt = [...e.querySelectorAll('*'), e].find((x) => [...x.childNodes].some((k) => k.nodeType === 3 && k.textContent.trim())); const tc = txt ? getComputedStyle(txt) : null; const svg = e.matches('svg') ? e : e.querySelector('svg'); const sr = svg && svg.getBoundingClientRect();
    const sib = (d) => { let s = e; do { s = d < 0 ? s.previousElementSibling : s.nextElementSibling; } while (s && !s.getClientRects().length); if (!s) return null; const q = s.getBoundingClientRect(); return { what: s.tagName.toLowerCase() + '.' + [...s.classList].slice(0, 2).join('.'), gap: px(d < 0 ? r.left - q.right : q.left - r.right) }; };
    return { element: e.tagName.toLowerCase() + '.' + [...e.classList].join('.'), size: `${px(r.width)} × ${px(r.height)}`, corners: c.borderTopLeftRadius, padding: `${c.paddingTop} ${c.paddingRight} ${c.paddingBottom} ${c.paddingLeft}`, gapInside: c.columnGap,
      outline: c.borderTopWidth !== '0px' ? `${c.borderTopWidth} ${c.borderTopColor}` : 'none', ring: c.boxShadow, fill: c.backgroundImage !== 'none' ? c.backgroundImage.slice(0, 80) : c.backgroundColor,
      text: tc ? `“${txt.textContent.trim().slice(0, 30)}” · ${tc.fontFamily.split(',')[0]} ${tc.fontSize} / ${tc.lineHeight} · weight ${tc.fontWeight} · tracking ${tc.letterSpacing} · ${tc.textTransform} · ${tc.color}` : 'none',
      icon: svg ? `${px(sr.width)} × ${px(sr.height)} · stroke ${getComputedStyle(svg).strokeWidth} · ${getComputedStyle(svg).color}` : 'none', before: sib(-1), after: sib(1), motion: c.transitionProperty === 'all' && c.transitionDuration === '0s' ? 'none' : `${c.transitionProperty} ${c.transitionDuration}`,
      control: e.matches('button, [role=checkbox], [role=button], input, a, [tabindex]') }; });
  const rest = await read(); const r0 = await box(); const files = [];
  await shot(r0, 48, path.join(OUT, `${n}-${slug}-where-raw.png`));
  const f0 = path.join(OUT, `${n}-${slug}-rest.png`); await p.mouse.move(2, 880); await sleep(400); await shot(r0, 10, f0); files.push(['rest', f0]);
  const states = {};
  if (rest.control) {
    const look = () => p.evaluate(() => window.__sx.look(document.querySelector('[data-present]'))); const L0 = await look();
    await p.mouse.move(r0.x, r0.y); await sleep(500); const f1 = path.join(OUT, `${n}-${slug}-hover.png`); await shot(r0, 10, f1); files.push(['hover', f1]); states.hover = await p.evaluate((a, z) => window.__sx.changes(a, z), L0, await look());
    await p.mouse.down(); await sleep(220); const f2 = path.join(OUT, `${n}-${slug}-press.png`); await shot(r0, 10, f2); files.push(['press', f2]); states.press = await p.evaluate((a, z) => window.__sx.changes(a, z), L0, await look()); await p.mouse.move(2, 880); await sleep(60); await p.mouse.up(); await sleep(400);
    await p.keyboard.press('Shift'); await p.evaluate(() => document.querySelector('[data-present]').focus({ preventScroll: true })); await sleep(400); const f3 = path.join(OUT, `${n}-${slug}-focus.png`); await shot(r0, 10, f3); files.push(['keyboard', f3]); states.keyboard = await p.evaluate((a, z) => window.__sx.changes(a, z), L0, await look());
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
  }
  await b.close();
  // the where-shot with the element boxed (2x pixels; the element sits 48px in from the crop's edge), and the states side by side, each labelled
  const where = path.join(OUT, `${n}-${slug}-where.png`); const S = 2;
  execFileSync('magick', [path.join(OUT, `${n}-${slug}-where-raw.png`), '-fill', 'none', '-stroke', '#ff3df0', '-strokewidth', '2', '-draw', `rectangle ${48 * S - 3},${48 * S - 3} ${(48 + r0.w) * S + 2},${(48 + r0.h) * S + 2}`, where]);
  const strip = path.join(OUT, `${n}-${slug}.png`);
  execFileSync('magick', [...files.flatMap(([lab, f]) => ['(', f, '-background', '#0b0f12', '-fill', '#9daab4', '-font', 'Helvetica', '-pointsize', '22', `label:${lab}`, '+swap', '-gravity', 'center', '-append', '-bordercolor', '#0b0f12', '-border', '14', ')']), '+append', strip]);
  for (const [, f] of files) fs.unlinkSync(f); fs.unlinkSync(path.join(OUT, `${n}-${slug}-where-raw.png`));
  console.log(JSON.stringify({ n, of: view.things.length, sel: thing.sel, name: thing.name, where: path.relative(ROOT, where), states_image: path.relative(ROOT, strip), ...rest, ...states }, null, 1));
})().catch((e) => { console.error('present FAIL', e.message); process.exit(1); });
