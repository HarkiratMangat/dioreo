// His 21:32 notes on V23, measured on the REAL C1 with a real pointer before anything is changed: (4) the copy box hover and the chip's
// outer ring, (5) a mixed checkbox's hover, (6) the problem card after click-to-pin then a click outside, (7) List vs Hide list hover,
// (3) the image chip's peek on C1 against the one in the container. Prints what each part draws and shoots the two peeks.
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const OUT = path.join(__dirname, 'notes8'); fs.mkdirSync(OUT, { recursive: true });
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'n8-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 });
  await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(STATE, 'utf8'));
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__sxReady, { timeout: 60000 }); await sleep(1200);
  await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
  const at = (sel, pick) => p.evaluate((sel, pick) => { const els = [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length); const e = els[pick || 0]; if (!e) return null; e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, t: r.top, w: r.width, h: r.height }; }, sel, pick);
  const sty = (sel, parts) => p.evaluate((sel, parts) => { const e = document.querySelector(sel); if (!e) return 'none'; return parts.map(([s, pe]) => { const x = s ? e.querySelector(s) || (e.matches(s) ? e : null) : e; if (!x) return s + ': –'; const c = getComputedStyle(x, pe || null); return `${s || 'self'}${pe || ''}: bg ${c.backgroundColor} · ring ${c.boxShadow} · border ${c.borderTopWidth} ${c.borderTopColor} · col ${c.color} · rad ${c.borderTopLeftRadius}`; }).join('\n    '); }, sel, parts);
  const log = (k, v) => console.log(`\n== ${k}\n    ${v}`);
  // (4) copy box hover
  const cb = await at('#c-manifest .wg-r .wg-code .wg-igb'); await p.mouse.move(1, 1); await sleep(400);
  log('4 copy chip, rest', await sty('#c-manifest .wg-r .wg-code', [['.wg-ig'], ['.wg-ig', '::after'], ['.wg-igb'], ['.wg-igf']]));
  await p.mouse.move(cb.x, cb.y); await sleep(500);
  log('4 copy chip, pointer on the copy box', await sty('#c-manifest .wg-r .wg-code', [['.wg-ig'], ['.wg-ig', '::after'], ['.wg-igb'], ['.wg-igf']]));
  await p.screenshot({ path: path.join(OUT, 'copy-hover.png'), clip: { x: cb.l - 120 + await p.evaluate(() => scrollX), y: cb.t - 10 + await p.evaluate(() => scrollY), width: 180, height: cb.h + 20 } });
  // (7) List / Hide list, (5) mixed checkbox: pick one build on C1
  await p.evaluate(() => { const t = [...document.querySelectorAll('#c-manifest .b4-try button')].find((x) => x.textContent.trim() === 'Pick one build'); t.click(); }); await sleep(900);
  const mixed = await p.evaluate(() => { const e = [...document.querySelectorAll('#c-manifest .wg-h .wg-cb')].find((x) => x.getAttribute('aria-checked') === 'mixed'); if (!e) return null; e.setAttribute('data-n8', 'mixed'); return true; });
  if (mixed) { const m = await at('[data-n8=mixed]'); await p.mouse.move(1, 1); await sleep(300); log('5 mixed checkbox, rest', await sty('[data-n8=mixed]', [[''], ['.cb'], ['.cb', '::before'], ['.cb', '::after']])); await p.mouse.move(m.x, m.y); await sleep(400); log('5 mixed checkbox, hovered', await sty('[data-n8=mixed]', [[''], ['.cb'], ['.cb', '::before'], ['.cb', '::after']])); } else log('5', 'no mixed box found');
  const tg = await at('#c-manifest .b3-sd .b3-sd-tog'); if (tg) { await p.mouse.move(1, 1); await sleep(300); log('7 List rest', await sty('#c-manifest .b3-sd .b3-sd-tog', [[''], ['', '::before']])); await p.mouse.move(tg.x, tg.y); await sleep(400); log('7 List hovered', await sty('#c-manifest .b3-sd .b3-sd-tog', [[''], ['', '::before']]));
    await p.mouse.down(); await p.mouse.up(); await sleep(600); const tg2 = await at('#c-manifest .b3-sd .b3-sd-tog'); await p.mouse.move(1, 1); await sleep(300); log('7 Hide list rest', await sty('#c-manifest .b3-sd .b3-sd-tog', [[''], ['', '::before']])); await p.mouse.move(tg2.x, tg2.y); await sleep(400); log('7 Hide list hovered (aria-expanded=' + await p.evaluate(() => document.querySelector('#c-manifest .b3-sd .b3-sd-tog').getAttribute('aria-expanded')) + ')', await sty('#c-manifest .b3-sd .b3-sd-tog', [[''], ['', '::before']])); }
  await p.evaluate(() => { const t = [...document.querySelectorAll('#c-manifest .b4-try button')].find((x) => x.textContent.trim() === 'Clear'); t.click(); }); await sleep(700);
  // (6) problem card: click to pin, click outside, hover again
  const pc = await at('#c-manifest .wg-h button.b3-fchip'); await p.mouse.move(pc.x, pc.y); await sleep(500); await p.mouse.down(); await p.mouse.up(); await sleep(600);
  const st = () => p.evaluate(() => { const c = document.querySelector('#c-manifest .b3-pc'); if (!c) return 'no card in the DOM'; const cs = getComputedStyle(c); return `card: class "${c.className}" · opacity ${cs.opacity} · × present ${!!c.querySelector('.b3-pc-x')} · pinned-looking ${c.classList.contains('pin') || c.classList.contains('pinned') || c.getAttribute('data-pinned')}`; });
  log('6 after click (pinned)', await st()); await p.mouse.move(640, 60); await p.mouse.down(); await p.mouse.up(); await sleep(700); log('6 after a click outside', await st());
  const pc2 = await at('#c-manifest .wg-h button.b3-fchip'); await p.mouse.move(pc2.x, pc2.y); await sleep(700); log('6 hovered again', await st());
  await p.screenshot({ path: path.join(OUT, 'problem-rehover.png') });
  // (3) image chip peek: C1 then the container
  for (const [nm, sel] of [['c1', '#c-manifest .wg-r .wg-imx .b3-fchip'], ['container', '#c1-buttons .sx-card .wg-imx .b3-fchip']]) {
    await p.mouse.move(1, 1); await sleep(500); const q = await at(sel); if (!q) { log('3 ' + nm, 'not found'); continue; } await p.mouse.move(q.x, q.y);
    for (const ms of [80, 200, 600]) { await sleep(ms === 80 ? 80 : ms - (ms === 200 ? 80 : 200)); await p.screenshot({ path: path.join(OUT, `peek-${nm}-${ms}.png`) }); }
    log('3 peek ' + nm, await p.evaluate(() => { const h = [...document.querySelectorAll('.b3-hint, [role=tooltip], .hint, .b3-hn')].filter((x) => x.getClientRects().length && getComputedStyle(x).opacity !== '0'); return h.map((x) => `${x.className} · pos ${getComputedStyle(x).position} · ${Math.round(x.getBoundingClientRect().left)},${Math.round(x.getBoundingClientRect().top)} ${Math.round(x.getBoundingClientRect().width)}x${Math.round(x.getBoundingClientRect().height)} · anim ${getComputedStyle(x).animationName} · tf ${getComputedStyle(x).transform.slice(0, 30)}`).join(' | ') || 'no visible hint'; }));
  }
  await b.close();
})().catch((e) => { console.error('notes8 FAIL', e.message); process.exit(1); });
