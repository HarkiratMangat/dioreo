// C1 buttons: every open note of his, checked in one headless run on builder.html with his saved state at 1282×888 (rerun each round).
// Real pointer for hover and press, rAF sampling for motion, 4× screenshots for anything that is a pixel question (ink, rings).
// Prints one block per note with the reading that decides it; writes crops to work/lead/c1-check/.
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const OUT = path.join(__dirname, 'c1-check'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core')); const { PNG } = require(path.join(ROOT, 'node_modules/pngjs'));
const STATE = process.env.STATE || path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (k, lines) => console.log(`\n== ${k}\n` + [].concat(lines).map((l) => '   ' + l).join('\n'));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 300000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'c1c-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 4 }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(STATE, 'utf8'));
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__sxReady, { timeout: 60000 }); await p.evaluate(() => document.fonts.ready); await sleep(1200);
  await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; window.__P = null; });
  await p.evaluate(async () => { window.__P = await import('/local/pins2/s4/work/lead/probe-lib.js?v=' + Date.now()); });
  // centre of the first visible match, scrolled to the middle of the viewport
  const at = (sel, test) => p.evaluate((sel, test) => { const f = test ? new Function('e', 'return ' + test) : () => true; const e = [...document.querySelectorAll(sel)].find((x) => x.getClientRects().length && f(x)); if (!e) return null; e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, t: r.top, w: r.width, h: r.height }; }, sel, test || '');
  const away = async () => { await p.mouse.move(2, 880); await sleep(350); };
  const shot = async (r, name, pad = 4) => { const s = await p.evaluate(() => [scrollX, scrollY]); const buf = await p.screenshot({ captureBeyondViewport: false, clip: { x: r.l - pad + s[0], y: r.t - pad + s[1], width: r.w + pad * 2, height: r.h + pad * 2 } }); const bb = Buffer.from(buf); fs.writeFileSync(path.join(OUT, name + '.png'), bb); return PNG.sync.read(bb); };
  const dpx = (img, x, y) => { const k = (y * img.width + x) * 4; return [img.data[k], img.data[k + 1], img.data[k + 2]]; };
  const dist = (a, z) => Math.abs(a[0] - z[0]) + Math.abs(a[1] - z[1]) + Math.abs(a[2] - z[2]);
  const try_ = (t, scope) => p.evaluate((t, scope) => { const b = [...document.querySelectorAll(`${scope} .b4-try button`)].find((x) => x.textContent.trim() === t); if (b) b.click(); return !!b; }, t, scope);

  // 0 · Sort and Copy code: every part's paint at rest, hovered at the centre, hovered on the copy box, pressed (his 20:47: both DO change)
  if (process.env.ONLY === 'sortcopy') {
    for (const [nm, sel, sub] of [['Sort, board', '#c-manifest .wg-heads .wg-sort', ''], ['Copy code, board, centre', '#c-manifest .wg-r .wg-code', ''], ['Copy code, board, copy box', '#c-manifest .wg-r .wg-code', '.wg-igb']]) {
      await away(); const q = await at(sel + (sub ? ' ' + sub : ''));
      const dump = () => p.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find((x) => x.getClientRects().length); const o = []; for (const x of [e, ...e.querySelectorAll('*')]) { if (x.tagName.toLowerCase() === 'use') continue; for (const pe of [null, '::before', '::after']) { const c = getComputedStyle(x, pe); if (pe && (c.content === 'none' || c.content === 'normal')) continue; o.push(`${x === e ? 'self' : '.' + ([...x.classList][0] || x.tagName.toLowerCase())}${pe || ''}: bg ${c.backgroundColor} col ${c.color} stroke ${c.stroke} shadow ${c.boxShadow.slice(0, 44)} op ${c.opacity} tf ${c.transform.slice(0, 22)}`); } } return o; }, sel);
      const r0 = await dump(); await p.mouse.move(q.x, q.y); await sleep(500); const r1 = await dump(); await p.mouse.down(); await sleep(200); const r2 = await dump(); await p.mouse.move(2, 880); await p.mouse.up();
      say(nm, r0.map((l, i) => l === r1[i] && l === r2[i] ? 'same  ' + l : `REST  ${l}\n      HOVER ${r1[i]}\n      PRESS ${r2[i]}`));
    }
    await b.close(); return;
  }
  // 1 · Collapse: the icon must not move while the word opens; report the icon's x drift over the open and close, and the width run
  const coll = [];
  for (const [nm, sel] of [['C1 board', '#c-manifest .wg-h .wg-fbtn'], ['container, word left', '#c1-buttons .sx-left2 .wg-fbtn'], ['container, word right', '#c1-buttons .sx-right2 .wg-fbtn']]) {
    await away(); const q = await at(sel); if (!q) { coll.push(`${nm}: not found`); continue; }
    const run = async (to) => { await p.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find((x) => x.getClientRects().length); const ic = e.querySelector('svg') || e; const s = []; const t0 = performance.now(); const tick = () => { const r = ic.getBoundingClientRect(), R = e.getBoundingClientRect(); s.push([performance.now() - t0, r.left, R.width, R.left, R.right]); if (performance.now() - t0 < 700) requestAnimationFrame(tick); }; requestAnimationFrame(tick); window.__samp = s; }, sel); await p.mouse.move(to.x, to.y); await sleep(760); return p.evaluate(() => window.__samp); };
    const open = await run(q); const close = await run({ x: 2, y: 880 });
    const rep = (s) => { const xs = s.map((v) => v[1]), ws = s.map((v) => v[2]); const end = s.findIndex((v, i) => i > 0 && Math.abs(v[2] - s[s.length - 1][2]) < 0.2); const Ls = s.map((v) => v[3]), Rs = s.map((v) => v[4]); return `left ${Math.min(...Ls).toFixed(1)}–${Math.max(...Ls).toFixed(1)} right ${Math.min(...Rs).toFixed(1)}–${Math.max(...Rs).toFixed(1)} · icon x ${Math.min(...xs).toFixed(1)}–${Math.max(...xs).toFixed(1)} (drift ${(Math.max(...xs) - Math.min(...xs)).toFixed(1)}) · width ${ws[0].toFixed(1)}→${ws[ws.length - 1].toFixed(1)} · settles ${end > 0 ? Math.round(s[end][0]) + 'ms' : '–'}`; };
    coll.push(`${nm}: open ${rep(open)} | close ${rep(close)}`);
  }
  say('1 Collapse (icon must not move)', coll);

  // 2 · a focus ring after a mouse click
  const ring = [];
  for (const [nm, sel] of [['checkbox', '#c1-buttons .wg-cb'], ['sort', '#c1-buttons .wg-sort'], ['collapse', '#c1-buttons .wg-fbtn'], ['C1 checkbox', '#c-manifest .wg-r .wg-cb']]) {
    await away(); const q = await at(sel); if (!q) { ring.push(`${nm}: not found`); continue; } await p.mouse.click(q.x, q.y); await sleep(250);
    ring.push(nm + ': ' + await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'nothing focused'; const c = getComputedStyle(e); return `focused ${e.className.slice(0, 30)} · :focus-visible ${e.matches(':focus-visible')} · outline ${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`; }));
    await p.mouse.click(q.x, q.y); await sleep(200); await p.evaluate(() => document.activeElement && document.activeElement.blur());
  }
  say('2 Focus ring after a mouse click', ring);
  { await p.evaluate(() => window.__bd.ui.setInspect(true)); await away(); const q = await at('#c1-buttons .wg-cb'); await p.mouse.click(q.x, q.y); await sleep(300);
    const img = await shot({ l: q.x - 30, t: q.y - 30, w: 60, h: 60 }, 'ring-inspect-on', 0);
    say('2b Inspect on, after clicking a container checkbox', await p.evaluate((x, y) => { const out = []; for (const e of document.querySelectorAll('body *')) { const r = e.getBoundingClientRect(); if (!r.width || r.left > x + 40 || r.right < x - 40 || r.top > y + 40 || r.bottom < y - 40) continue; const c = getComputedStyle(e); if ((c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || (c.boxShadow !== 'none' && /0px 0px 0px [1-9]/.test(c.boxShadow)) || (c.position === 'fixed' || c.position === 'absolute') && e.closest('#bd-host, [id^=bd-], [class*=bd-]')) out.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)} ${Math.round(r.width)}×${Math.round(r.height)} outline ${c.outlineStyle} ${c.outlineColor} shadow ${c.boxShadow.slice(0, 50)}`); } return out.length ? out.slice(0, 8) : ['nothing drawn around it']; }, q.x, q.y));
    await p.evaluate(() => { window.__bd.ui.setInspect(false); document.activeElement && document.activeElement.blur(); }); await p.keyboard.press('Escape'); }

  // 3 · the image chip's peek, board vs container: what shows at 80 / 250 / 700ms and whether a pinned card holds the board
  const peek = [];
  for (const [nm, sel] of [['container', '#c1-buttons .wg-imx .b3-fchip'], ['C1 board, same build', '#c-manifest .wg-r .wg-imx .b3-fchip']]) {
    await away(); await sleep(1500); const q = await at(sel); if (!q) { peek.push(`${nm}: not found`); continue; } await p.mouse.move(q.x, q.y); const seen = [];
    for (const ms of [80, 250, 700]) { await sleep(ms === 80 ? 80 : ms === 250 ? 170 : 450); seen.push(`${ms}ms ` + await p.evaluate(() => { const h = [...document.querySelectorAll('.b3-peek, .b3-imp, [class*=peek], .b3-hint-pop, [role=tooltip]')].filter((x) => x.getClientRects().length && +getComputedStyle(x).opacity > 0.02); return h.map((x) => { const r = x.getBoundingClientRect(); const c = getComputedStyle(x); return `${x.className.slice(0, 26)} ${Math.round(r.width)}×${Math.round(r.height)} op ${(+c.opacity).toFixed(2)} tf ${c.transform === 'none' ? 'none' : c.transform.slice(7, 30)}`; }).join(' + ') || 'nothing'; })); }
    peek.push(`${nm}: ${seen.join(' | ')}`);
  }
  say('3 Image peek', peek);

  // 4 · copy code: the outline on the copy box at rest and on hover (4× pixels on the box's top edge)
  const cp = [];
  for (const [nm, sel] of [['C1 board', '#c-manifest .wg-r .wg-code .wg-igb'], ['container', '#c1-buttons .wg-code .wg-igb']]) {
    await away(); const q = await at(sel); if (!q) { cp.push(`${nm}: not found`); continue; } const box = await p.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find((x) => x.getClientRects().length).closest('.wg-ig'); const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; }, sel);
    const edge = (img) => { const x = Math.round((q.x - box.l + 4) * 4); const rows = []; for (let y = 0; y < 8 * 4; y++) rows.push(dpx(img, x, y)); return rows; };
    const rest = edge(await shot(box, `copy-${nm.split(' ')[0]}-rest`)); await p.evaluate(() => { window.__slog = []; const wrap = (o, k) => { const f = o[k]; if (f.__w) return; const g = function (...a) { window.__slog.push(k + ' ' + (new Error().stack.split('\n').slice(2, 5).map((s) => s.trim().replace(/https?:\/\/[^/]+/, '')).join(' < '))); return f.apply(this, a); }; g.__w = 1; o[k] = g; }; wrap(Element.prototype, 'scrollIntoView'); wrap(HTMLElement.prototype, 'focus'); wrap(window, 'scrollTo'); wrap(window, 'scrollBy'); wrap(Element.prototype, 'scrollTo'); addEventListener('scroll', () => window.__slog.push('scroll event y ' + Math.round(scrollY)), { once: true }); }); await p.mouse.move(q.x, q.y); await sleep(450); cp.push('scroll log: ' + (await p.evaluate(() => window.__slog.join(' || ')) || 'none')); const moved = await p.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find((x) => x.getClientRects().length).closest('.wg-ig'); const r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width - 8, r.top + r.height / 2); return `ig now ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)} · under pointer ${top ? top.className.toString().slice(0, 40) : '-'} · scrollY ${Math.round(scrollY)}`; }, sel); fs.writeFileSync(path.join(OUT, `copy-${nm.split(' ')[0]}-hover-view.png`), Buffer.from(await p.screenshot())); const hov = edge(await shot(box, `copy-${nm.split(' ')[0]}-hover`));
    const ringRow = (rows) => rows.findIndex((c, i) => i > 8 && dist(c, rows[2]) > 40); const ri = ringRow(rest), hi = ringRow(hov);
    cp.push(`${nm}: before ${Math.round(box.l)},${Math.round(box.t)} · ${moved}`); cp.push(`${nm}: top-edge ring row rest ${ri >= 0 ? rest[ri].join(',') : '–'} · hover ${hi >= 0 ? hov[hi].join(',') : '–'} · same row ${ri === hi}`);
  }
  say('4 Copy code outline on hover', cp);

  // 5 · checkbox hover: empty, mixed, checked (Pick one build makes a mixed weapon box)
  await try_('Pick one build', '#c-manifest'); await sleep(900); const cb = [];
  for (const [nm, test] of [['empty', `e.getAttribute('aria-checked')==='false'`], ['mixed', `e.getAttribute('aria-checked')==='mixed'`], ['checked', `e.getAttribute('aria-checked')==='true'`]]) {
    await away(); const q = await at('#c-manifest .wg-cb', test); if (!q) { cb.push(`${nm}: none on the board`); continue; }
    const read = () => p.evaluate((x, y) => { const e = document.elementFromPoint(x, y).closest('.wg-cb'); const k = e.querySelector('.cb') || e; const c = getComputedStyle(k); return `ring ${c.boxShadow === 'none' ? 'none' : c.boxShadow.slice(0, 60)} · bg ${c.backgroundColor} · border ${c.borderTopColor}`; }, q.x, q.y);
    const r0 = await read(); await p.mouse.move(q.x, q.y); await sleep(350); const r1 = await read(); cb.push(`${nm}: ${r0 === r1 ? 'NO CHANGE · ' + r0 : `rest ${r0}\n      hover ${r1}`}`);
  }
  say('5 Checkbox hover', cb);

  // 7 · List / Hide list hover on the board's own dock
  const lt = [];
  for (const phase of ['List', 'Hide list']) {
    await away(); const q = await at('#c-manifest .b3-sd .b3-sd-tog'); if (!q) { lt.push('no dock'); break; }
    if (phase === 'Hide list' && await p.evaluate(() => document.querySelector('#c-manifest .b3-sd .b3-sd-tog').getAttribute('aria-expanded') !== 'true')) { await p.mouse.click(q.x, q.y); await sleep(700); await away(); }
    const read = () => p.evaluate(() => { const e = document.querySelector('#c-manifest .b3-sd .b3-sd-tog'); const c = getComputedStyle(e); return `--b3-ring ${c.getPropertyValue('--b3-ring').trim().slice(0, 50)} · "${e.textContent.trim()}" bg ${c.backgroundColor} · ring ${c.boxShadow === 'none' ? 'none' : c.boxShadow.slice(0, 50)} · ink ${c.color}`; });
    const r0 = await read(); const q2 = await at('#c-manifest .b3-sd .b3-sd-tog'); await p.mouse.move(q2.x, q2.y); await sleep(400); const r1 = await read(); await sleep(900); const r2 = await read(); lt.push(`${phase}: rest ${r0}\n      hover ${r1}\n      hover +0.9s ${r2}`);
  }
  say('7 List / Hide list hover', lt);
  await try_('Clear', '#c-manifest'); await sleep(700);

  // 6 · problem card: pin, click outside, hover again — must open unpinned (no ×) and close when the pointer leaves
  await away(); const pc = await at('#c-manifest .wg-h button.b3-fchip'); const pcs = [];
  const card = () => p.evaluate(() => { const c = [...document.querySelectorAll('#c-manifest .b3-pc')].find((x) => x.getClientRects().length && +getComputedStyle(x).opacity > 0.05); return c ? `open · × ${!!c.querySelector('.b3-pc-x') && !!c.querySelector('.b3-pc-x').getClientRects().length}` : 'closed'; });
  if (pc) { await p.mouse.move(pc.x, pc.y); await sleep(500); await p.mouse.click(pc.x, pc.y); await sleep(500); pcs.push('pinned: ' + await card()); await p.mouse.click(640, 120); await sleep(600); pcs.push('after a click outside: ' + await card()); const pc2 = await at('#c-manifest .wg-h button.b3-fchip'); await p.mouse.move(pc2.x, pc2.y); await sleep(700); pcs.push('hovered again: ' + await card()); await away(); await sleep(500); pcs.push('pointer left: ' + await card()); }
  say('6 Problem card after pin + outside click', pcs);

  // 8 · every selection-bar button drawn alone in "each button alone"
  say('8 Selection-bar buttons drawn alone', await p.evaluate(() => { const X = window.__sx; return X.TYPES.filter((t) => t.bar).map((t) => { const root = X.rootOf(t.n); const el = root && X.find(root, t).find((e) => e.getClientRects().length); return `${t.n} ${t.name}: ${el ? 'drawn' : 'MISSING'}`; }); }));

  // 9 · the selection list's weapon header: pill → divider → first badge (container's whole bar, By weapon)
  say('9 Divider gaps, selection list header', await p.evaluate(async () => { const sd = document.querySelector('#c1-buttons .sx-stage.tall .b3-sd'); const by = [...sd.querySelectorAll('.b3-sd-vt button')].find((b) => /By weapon/.test(b.textContent)); by.click(); await new Promise((r) => setTimeout(r, 800)); return [...sd.querySelectorAll('.b3-sd-gh')].filter((g) => g.querySelector('.b3-bdgs')).map((g) => { const pill = g.querySelector('.b3-sd-gn').getBoundingClientRect(); const bd = g.querySelector('.b3-bdgs'); const r = bd.getBoundingClientRect(); const first = bd.firstElementChild.getBoundingClientRect(); return `${g.querySelector('.b3-nw b').textContent}: pill right ${pill.right.toFixed(1)} → divider ${r.left.toFixed(1)} (gap ${(r.left - pill.right).toFixed(1)}) → first badge ${first.left.toFixed(1)} (gap ${(first.left - r.left - 1).toFixed(1)})`; }); }));

  await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 }); await sleep(600);
  // 10 · chip ink (at 2x, his screen): the slot label's caps and the name's cap band, each against the chip's centre (4× pixels)
  const ink = [];
  for (const [nm, sel] of [['selection list', '#c1-buttons .sx-stage.tall .b3-sd-r .wg-at'], ['C1 manifest row', '#c-manifest .wg-r .wg-at']]) {
    const N = +(process.env.INKN || 5); const chips = await p.evaluate((sel, N) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length).slice(0, N).map((e, i) => { e.setAttribute('data-ink', i); return i; }), sel, N);
    for (const i of chips) {
      const g = await p.evaluate((i) => { const e = document.querySelector(`[data-ink="${i}"]`); e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); const c = getComputedStyle(e), bc = getComputedStyle(e, '::before'); const an = e.querySelector('.wg-an').getBoundingClientRect(); const lw = parseFloat(bc.width); const l0 = r.left + parseFloat(c.paddingLeft) + parseFloat(c.borderLeftWidth); return { l: r.left, t: r.top, w: r.width, h: r.height, labA: l0, labB: l0 + lw, nameA: an.left, slot: e.getAttribute('data-slot') }; }, i);
      const img = await shot(g, `ink-${nm.split(' ')[0]}-${i}`, 0); const S = 2; const gapX = Math.round(((g.labB + g.nameA) / 2 - g.l) * S);
      const rows = (xa, xb) => { const out = []; for (let y = 2 * S; y < (g.h - 2) * S; y++) { const ref = dpx(img, gapX, y); let hit = 0; for (let x = Math.round((xa - g.l) * S); x < Math.round((xb - g.l) * S); x++) if (dist(dpx(img, x, y), ref) > 120) hit++; if (hit > 1) out.push(y); } return out; };
      const lab = rows(g.labA, g.labB), cap = rows(g.nameA, g.nameA + 5); const ctr = (r) => r.length ? ((r[0] + r[r.length - 1] + 1) / 2 / S - g.h / 2).toFixed(2) : '–';
      ink.push(`${nm} · ${g.slot}: label caps off ${ctr(lab)} · name cap off ${ctr(cap)} (px from the chip's centre; + is low)`);
    }
    await p.evaluate(() => document.querySelectorAll('[data-ink]').forEach((e) => e.removeAttribute('data-ink')));
  }
  say('10 Chip ink, label vs name', ink);
  say('page errors', errs.length ? errs.slice(0, 8) : ['none']);
  await b.close();
})().catch((e) => { console.error('c1-check FAIL', e.message); process.exit(1); });
