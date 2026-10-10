// V22's C1 buttons container, checked the way he will use it (2026-10-06 19:31 EDT): builder.html with his saved state at 1282×888, double
// density. Fails loudly on: page errors, a card with no live button, a button with no size, the problem card not open, the selection bar
// missing, C1 itself changed by the container (row count, its own Pick three try, Collapse all inside the container). Then hovers every
// card's button for real and records whether anything visibly changed, and shoots each section. Output: spx2/<n>.png + a JSON line.
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const OUT = path.join(__dirname, 'spx2'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = process.env.STATE || path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spx2-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`); }); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  const st = fs.readFileSync(STATE, 'utf8'); await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, st);
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__sxReady, { timeout: 60000 }).catch(() => errs.push('container never got ready')); await p.evaluate(() => document.fonts.ready); await sleep(800);
  await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((z) => setTimeout(z, ms)); const box = document.getElementById('c1-buttons'); const g = document.getElementById('c-manifest'); const o = {};
    o.cards = box ? box.querySelectorAll('.sx-card').length : 0; o.missing = box ? [...box.querySelectorAll('[data-sx-missing] b')].map((x) => x.textContent) : ['no container'];
    o.pcOpen = !!(box && box.querySelector('.b3-pc-open')); o.selBar = !!(box && box.querySelector('.b3-sd .b3-sd-edit'));
    o.c1Rows = g.querySelectorAll('.wg-r').length; const fold = box && box.querySelector('.sx-live .wg-heads .wg-fold'); if (fold) { fold.click(); await wait(400); } o.c1RowsAfterFold = g.querySelectorAll('.wg-r').length; if (fold) { fold.click(); await wait(300); }
    const t = [...g.querySelectorAll('.b4-try button')].find((x) => x.textContent.trim() === 'Pick three'); if (t) { t.click(); await wait(900); } o.c1PickBar = !!g.querySelector('.b3-sd .b3-sd-edit'); const c = [...g.querySelectorAll('.b4-try button')].find((x) => x.textContent.trim() === 'Clear'); if (c) { c.click(); await wait(500); }
    const del = box.querySelector('.sx-live .wg-r .wg-del'); let reached = false; if (del) { const f = () => { reached = true; }; del.addEventListener('click', f); del.click(); del.removeEventListener('click', f); } o.deleteClickBlocked = del ? !reached : 'no delete';
    o.dupIds = [...box.querySelectorAll('[id]')].map((e) => e.id).filter((id) => document.querySelectorAll('#' + CSS.escape(id)).length > 1).slice(0, 8);
    o.h = box ? box.getBoundingClientRect().height : 0; return o; });
  // hover each card's button for real: does anything on it change?
  const hov = []; const n = await p.evaluate(() => document.querySelectorAll('#c1-buttons .sx-card').length);
  for (let i = 0; i < n; i++) {
    const q = await p.evaluate((i) => { const c = document.querySelectorAll('#c1-buttons .sx-card')[i]; const name = c.querySelector('b').textContent; c.dispatchEvent(new MouseEvent('mouseenter')); const el = document.querySelector('[data-sx-hl]'); c.dispatchEvent(new MouseEvent('mouseleave')); if (!el) return { name, none: true };
      el.setAttribute('data-sx-probe', String(i)); el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); const T = BD.measure.paintTarget(el) || { el, part: 'self' }; const cs = getComputedStyle(T.el || el, T.part && T.part !== 'self' ? T.part : null);
      const sig = [cs.backgroundColor, cs.boxShadow, getComputedStyle(el).color, cs.borderTopColor, ...[el, ...el.querySelectorAll('*')].flatMap((e) => [null, '::before', '::after'].map((pe) => { const c = getComputedStyle(e, pe); return [c.backgroundColor, c.color, c.boxShadow, c.opacity, c.transform].join(','); }))].join('|'); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); const parts = [el, ...el.querySelectorAll('*')].flatMap((e) => [null, '::before', '::after'].map((pe) => { const c = getComputedStyle(e, pe); return [(e.className && e.className.baseVal == null ? e.className : e.tagName) + (pe || ''), [c.backgroundColor, c.color, c.boxShadow, c.opacity, c.transform].join(',')]; })); window.__sxParts = parts; return { name, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, before: sig, under: top ? (el.contains(top) || top === el ? 'itself' : (top.className && top.className.baseVal == null ? top.className : top.tagName)) : 'nothing' }; }, i);
    if (q.none) { hov.push(`${q.name}: NO ELEMENT`); continue; }
    await p.mouse.move(1, 1); await sleep(80); await p.mouse.move(q.x, q.y); await sleep(450);
    const after = await p.evaluate((i) => { const el = document.querySelector(`[data-sx-probe="${i}"]`); const T = BD.measure.paintTarget(el) || { el, part: 'self' }; const cs = getComputedStyle(T.el || el, T.part && T.part !== 'self' ? T.part : null); const sig = [cs.backgroundColor, cs.boxShadow, getComputedStyle(el).color, cs.borderTopColor, ...[el, ...el.querySelectorAll('*')].flatMap((e) => [null, '::before', '::after'].map((pe) => { const c = getComputedStyle(e, pe); return [c.backgroundColor, c.color, c.boxShadow, c.opacity, c.transform].join(','); }))].join('|'); const parts = [el, ...el.querySelectorAll('*')].flatMap((e) => [null, '::before', '::after'].map((pe) => { const c = getComputedStyle(e, pe); return [(e.className && e.className.baseVal == null ? e.className : e.tagName) + (pe || ''), [c.backgroundColor, c.color, c.boxShadow, c.opacity, c.transform].join(',')]; })); const was = window.__sxParts || []; const diff = parts.filter((x, j) => was[j] && was[j][1] !== x[1]).map((x) => x[0]).slice(0, 4); const tips = [...document.querySelectorAll('[role=tooltip], .tip, .b3-peek, .wg-fpop')].filter((x) => x.getClientRects().length && getComputedStyle(x).opacity !== '0' && getComputedStyle(x).visibility !== 'hidden').length; return { s: sig, w: el.getBoundingClientRect().width, diff, tips }; }, i);
    const real = after.s !== q.before || Math.abs(after.w - q.w) > 0.5; const said = await p.evaluate((i) => { const c = document.querySelectorAll('#c1-buttons .sx-card')[i]; const dts = [...c.querySelectorAll('dt')]; const d = dts.find((x) => x.textContent === 'Hover'); return d ? d.nextElementSibling.textContent.trim() : ''; }, i);
    hov.push(`${q.name}: ${q.w.toFixed(0)}×${q.h.toFixed(0)} real hover ${real ? 'changes' : 'NO CHANGE'} · card says ${/^no change$/.test(said) ? 'no change' : 'changes'}${real !== !/^no change$/.test(said) ? `  ← MISMATCH · under pointer: ${q.under} · real parts changed: ${(after.diff || []).join(', ') || '–'} · pop-ups showing: ${after.tips}` : ''}`);
    await p.mouse.move(1, 1);
  }
  // the three Collapse variants: hover, hold every running transition, seek it to 0 / 25 / 50 / 75 / 100 % and shoot the row each time,
  // then the same for leaving. Screenshots are too slow to time by sleeping (the 130 ms frames came out fully open)
  for (let i = 0; i < 3; i++) {
    const q = await p.evaluate((i) => { const fb = document.querySelectorAll('#c1-buttons .sx-var .wg-h .wg-fbtn')[i]; if (!fb) return null; fb.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = fb.getBoundingClientRect(); const row = fb.closest('.wg-h').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, clip: { x: row.left + scrollX, y: row.top - 6 + scrollY, width: Math.min(1282, row.width), height: row.height + 12 } }; }, i);
    if (!q) { errs.push('no fold ' + i); continue; }
    for (const [phase, mx, my] of [['open', q.x, q.y], ['close', 1, 1]]) {
      if (phase === 'open') { await p.mouse.move(1, 1); await sleep(500); }
      await p.mouse.move(mx, my); await sleep(16);
      const dur = await p.evaluate((i) => { const fb = document.querySelectorAll('#c1-buttons .sx-var .wg-h .wg-fbtn')[i]; const an = fb.getAnimations({ subtree: true }); let d = 0; for (const a of an) { a.pause(); const tm = a.effect.getComputedTiming(); d = Math.max(d, tm.endTime || 0); } window.__fa = an; return Math.round(d); }, i);
      for (const f of [0, 0.25, 0.5, 0.75, 1]) { await p.evaluate((f, dur) => { for (const a of window.__fa || []) a.currentTime = f * dur; }, f, dur); await sleep(40); await p.screenshot({ path: path.join(OUT, `fold${i}-${phase}-${Math.round(f * 100)}.png`), clip: q.clip }); }
      await p.evaluate(() => { for (const a of window.__fa || []) a.finish(); }); await sleep(120);
    }
  }
  // shoot each section
  const secs = await p.evaluate(() => [...document.querySelectorAll('#c1-buttons .sx-sec')].map((s, i) => i));
  for (const i of secs) { const parts = await p.evaluate((i) => { const s = document.querySelectorAll('#c1-buttons .sx-sec')[i]; s.scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy({ top: -70, behavior: 'instant' }); return Math.ceil(s.getBoundingClientRect().height / 800); }, i);
    for (let k = 0; k < Math.min(parts, 3); k++) { if (k) await p.evaluate(() => window.scrollBy({ top: 800, behavior: 'instant' })); await sleep(250); await p.screenshot({ path: path.join(OUT, `s${i}-${k}.png`) }); } }
  console.log(JSON.stringify({ ...r, errs: errs.slice(0, 6) })); console.log(hov.join('\n'));
  await b.close();
})().catch((e) => { console.error('spx2check FAIL', e.message); process.exit(1); });
