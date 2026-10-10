// Board 4: Builder-2 · fidlib.cjs — the shared harness under fidelity.cjs, structure.cjs and knob.cjs (Session 4, builder R1, 2026-10-03 23:50 EDT).
// One way to serve the repo, open a kit folder's board4.html in standards mode with the clock and the dice frozen, wait for its fonts, settle
// every animation at its end, and walk each gate's views exactly as docs/pins2/final/board4-spec/board4-walk.cjs does.
// It serves the repo itself (no :8900), so any two kit folders can be compared: ref-kit, a clone, the candidate.
const path = require('path'); const fs = require('fs'); const os = require('os'); const http = require('http');
const ROOT = path.resolve(__dirname, '../../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const WALK = require(path.join(ROOT, 'docs/pins2/final/board4-spec/board4-walk.cjs'));
const { GATES, POPS, POP_SEL } = WALK;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── the server: the repo's own files; a kit page gets the doctype it lacks, so it lays out in standards mode, not quirks
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
function serve() {
  return new Promise((res) => {
    const s = http.createServer((rq, rs) => {
      const u = new URL(rq.url, 'http://x'); const f = path.join(ROOT, decodeURIComponent(u.pathname));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end('404'); }
      const ext = path.extname(f).toLowerCase(); let body = fs.readFileSync(f);
      if (ext === '.html' && !/^\s*<!doctype/i.test(body.toString('utf8', 0, 64))) body = Buffer.concat([Buffer.from('<!doctype html>'), body]);
      rs.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store' }); rs.end(body);
    });
    s.listen(0, '127.0.0.1', () => res({ server: s, base: `http://127.0.0.1:${s.address().port}` }));
  });
}
const rel = (dir) => path.relative(ROOT, path.resolve(ROOT, dir)).split(path.sep).join('/');

// ── frozen before any page script runs: the same instant, a performance clock that never moves, and a seeded Math.random, on both pages
// (twenty kit files read the clock: "days ago", "Active for 21d", the season track). 2026-10-03 12:00 EDT.
const FROZEN = Date.UTC(2026, 9, 3, 16, 0, 0);
const FREEZE = `(() => { const T = ${FROZEN}; const RD = Date;
  function D(...a) { if (!new.target) return new RD(T).toString(); return a.length ? new RD(...a) : new RD(T); }
  D.prototype = RD.prototype; Object.setPrototypeOf(D, RD); D.now = () => T; D.UTC = RD.UTC; D.parse = RD.parse; window.Date = D;
  try { performance.now = () => 0; } catch (e) {}
  // every short timer is counted, so a view is captured when the kit's own scripted steps (a Try's typing, a 1.1s 'fresh' flag) have run out
  const st = window.setTimeout, ct = window.clearTimeout; const pend = new Set();
  window.setTimeout = function (f, ms, ...a) { const h = st.call(window, function () { pend.delete(h); return typeof f === 'function' ? f.apply(this, a) : (0, eval)(f); }, ms); if ((+ms || 0) <= 5000) pend.add(h); return h; };
  window.clearTimeout = function (h) { pend.delete(h); return ct.call(window, h); }; window.__bdPending = () => pend.size;
  // a scripted smooth scroll ends wherever the frame clock left it when the capture comes; every scroll is instant, so it ends where it is going
  const inst = (o) => (o && typeof o === 'object' ? Object.assign({}, o, { behavior: 'instant' }) : o);
  for (const P of [Element.prototype, window]) for (const m of ['scrollTo', 'scrollBy', 'scroll']) { const f = P[m]; if (f) P[m] = function (a, ...r) { return f.call(this, inst(a), ...r); }; }
  const siv = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (a) { return siv.call(this, typeof a === 'object' ? inst(a) : a); };
  let s = 0x2f6b; Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
})();`;
// No motion in a capture: finite animations are FINISHED (the kit has ~20 'both'/'forwards' animations, so removing them with animation:none would
// show faded-out things and hide whatever sits under an opacity-0 start), infinite ones held at their first frame, transforms held still by
// bd/measure.js stillAnimations' rule. Transitions are finished too, never disabled: drawers wait on transitionend.
// META's discharge (b3/volt.js) is an SVG with SMIL animation used as a mask: no page clock reaches it, so it is the one thing hidden in a capture
// (measured 2026-10-03 23:37 EDT: 5,066 changed pixels between two loads of the SAME kit, on the META badge only). Its box keeps its place.
// The caret blinks on its own clock; the kit sets caret-color with !important at up to (1,3,1) (b4/classes.css:146), so the transparent caret is
// written at (3,0,0) to win (measured 2026-10-04 00:30 EDT: a 72px caret line was the only change between two loads, in C2's and C3's pop-ups).
const STILL_CSS = ':not(#bd-a):not(#bd-b):not(#bd-c),:not(#bd-a):not(#bd-b):not(#bd-c)::before,:not(#bd-a):not(#bd-b):not(#bd-c)::after{caret-color:transparent!important;scroll-behavior:auto!important} .b3-volt{visibility:hidden!important}';
// quiet: no short timer pending and no DOM change for 250ms (at most 8s), then every animation settled
async function quiet(p) {
  await p.evaluate(() => new Promise((res) => { let last = performance.timeOrigin; let t = 0; const mo = new MutationObserver(() => { t = 0; }); mo.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
    const tick = () => { t += 50; last += 50; if ((window.__bdPending ? window.__bdPending() : 0) === 0 && t >= 250) { mo.disconnect(); return res(); } if (last - performance.timeOrigin > 8000) { mo.disconnect(); return res(); } setTimeout(tick, 50); }; setTimeout(tick, 50); }));
  await settle(p);
}
async function settle(p) {
  // three calm rounds in a row: no image still loading, no animation still running. A scroll or a class change can START an animation a frame
  // later (the badges reveal on screen through an IntersectionObserver), so one empty round proves nothing (measured 2026-10-03 23:21 EDT).
  const t0 = Date.now(); const st = await p.evaluate(async () => {
    const two = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    let calm = 0, rounds = 0, imgw = 0;
    // a scroll can start a re-render a frame later (the badges' IntersectionObserver mounts META's discharge and swaps its rest class), and a
    // capture taken inside it caught META half-lit in one load of identical code (noise run 5 at 1282, C2 rest, 15,369px; 2026-10-04 02:33 EDT):
    // a round is calm only if the DOM did not change in it either
    let muts = 0; const mo = new MutationObserver((m) => { muts += m.length; }); mo.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
    for (let k = 0; k < 60 && calm < 3; k++) {
      rounds++; muts = 0; await two();
      // only images that can be seen: a lazy image off screen never completes (each settle waited 4s per round on one, 2026-10-03 23:22 EDT)
      const onScreen = (i) => { const r = i.getBoundingClientRect(); return r.bottom > -40 && r.top < innerHeight + 40 && r.width > 0; };
      const imgs = k < 20 ? [...document.images].filter((i) => !i.complete && onScreen(i)) : [];
      if (imgs.length) { imgw++; await Promise.race([Promise.all(imgs.map((i) => new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))), new Promise((r) => setTimeout(r, 4000))]); calm = 0; continue; }
      let live = 0;
      for (const a of document.getAnimations()) {
        try { const t = a.effect && a.effect.getComputedTiming(); if (t && t.iterations === Infinity) { if (a.playState !== 'paused' || a.currentTime !== 0) { a.pause(); a.currentTime = 0; live++; } }
          else if (a.playState !== 'finished') { a.finish(); live++; } } catch (e) { live++; }
      }
      // SVG SMIL (<animate>, META's discharge in b3/volt.js) is invisible to getAnimations(): every svg's own clock is held at 0
      for (const sv of document.querySelectorAll('svg')) { if (sv.ownerSVGElement || !sv.pauseAnimations) continue; try { if (!sv.animationsPaused() || sv.getCurrentTime() !== 0) { sv.pauseAnimations(); sv.setCurrentTime(0); if (sv.querySelector('animate,animateTransform,animateMotion,set')) live++; } } catch (e) {} }
      await document.fonts.ready; calm = live || muts ? 0 : calm + 1;
    }
    mo.disconnect();
    await Promise.race([Promise.all([...document.images].filter((i) => i.complete).map((i) => (i.decode ? i.decode().catch(() => null) : null))), new Promise((r) => setTimeout(r, 3000))]); await two();
    return { rounds, imgw };
  });
  if (process.env.BD_VERBOSE && Date.now() - t0 > 400) console.error(`  settle ${Date.now() - t0}ms rounds ${st.rounds} image waits ${st.imgw}`);
}
const FAMS = ['Space Grotesk', 'JetBrains Mono', 'Big Shoulders Display'];
async function fontsOk(p) {
  // every face of the three families is loaded, every subset and weight, so nothing on either page waits on a lazily fetched subset
  return p.evaluate(async (fams) => { await document.fonts.ready; const faces = [...document.fonts]; await Promise.all(faces.filter((x) => fams.includes(x.family.replace(/["']/g, ''))).map((x) => x.load().catch(() => null))); await document.fonts.ready;
    const missing = fams.filter((f) => !faces.some((x) => x.family.replace(/["']/g, '') === f && x.status === 'loaded'));
    const check = fams.filter((f) => !document.fonts.check(`16px "${f}"`)); return { missing, check }; }, FAMS);
}

async function launch(w, h) {
  // BD_CHROME: another binary (chrome-headless-shell, 2026-10-04 13:19 EDT: the full Chrome.app in 'new' headless registers with the macOS window server, and twelve
  // at once hung Harkirat's Dock). A shell binary runs headless:'shell'. Ref and candidate always share one binary, and each binary has its own noise floor.
  const exe = process.env.BD_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return puppeteer.launch({ executablePath: exe, headless: /headless[-_]shell/.test(exe) ? 'shell' : 'new', protocolTimeout: 900000,
    userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bd-fid-')), args: ['--no-first-run', '--font-render-hinting=none', '--hide-scrollbars', '--disable-partial-raster', '--disable-gpu', '--disable-lcd-text', '--force-color-profile=srgb', `--window-size=${w},${h}`] });
}
// A page on one kit folder. inject: { css, js } planted on every load (falsifiers), never as a file edit.
async function openKit(b, base, dir, w, h, inject = {}) {
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 300)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await p.evaluateOnNewDocument(FREEZE);
  // BD_DPR=1 renders a non-retina screen (sub-pixel rounding differs there); every comparison is in device pixels, so nothing else changes
  await p.setViewport({ width: w, height: h, deviceScaleFactor: +(process.env.BD_DPR || 2) });
  const url = `${base}/${rel(dir)}/board4.html`;
  const load = async () => {
    await p.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
    await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 30000 });
    await p.addStyleTag({ content: STILL_CSS }); if (inject.css) await p.addStyleTag({ content: inject.css });
    const f = await fontsOk(p); if (f.missing.length || f.check.length) throw new Error(`fonts not loaded in ${dir}: missing ${f.missing} unchecked ${f.check}`);
    await sleep(300); await quiet(p); await p.mouse.move(1, 1);
  };
  await load();
  return { p, errs, load, dir, url, inject };
}
const actions0 = (p, id) => p.evaluate((id) => { const g = document.getElementById(id);
  return [...[...g.querySelectorAll('.pb-ctl button')].map((b, i) => ['state', i, b.textContent.trim()]), ...[...g.querySelectorAll('.b4-try button')].map((b, i) => ['try', i, b.textContent.trim()])]; }, id);
// views the walk never reaches (A1, 2026-10-04 22:05 EDT; V2 F3): C1's selection list is opened by its List toggle, which no Try step presses. Each extra is a
// click inserted after the step it follows, then a second click that puts the page back, so every later view is the walk's own.
const EXTRA = { 'c-manifest': [{ after: 'Pick three', sel: '#c-manifest .b3-sd-tog', label: 'Pick three · list open' }] };
const actions = async (p, id) => { const a = await actions0(p, id); const out = []; for (const x of a) { out.push(x); for (const e of EXTRA[id] || []) if (x[2] === e.after) { out.push(['click', e.sel, e.label]); out.push(['click', e.sel, e.label + ', closed again']); } } return out; };
async function act(K, id, kind, i) {
  await K.p.evaluate((id, kind, i) => { const g = document.getElementById(id); const b = kind === 'click' ? document.querySelector(i) : kind === 'state' ? g.querySelectorAll('.pb-ctl button')[i] : g.querySelectorAll('.b4-try button')[i]; if (b) b.click(); }, id, kind, i);
  await sleep(120); await quiet(K.p); if (K.inject.js) await K.p.evaluate(K.inject.js);
}
async function setState(K, id, label) {
  if (!label) return true;
  const ok = await K.p.evaluate((id, label) => { const b = [...document.getElementById(id).querySelectorAll('.pb-ctl button')].find((x) => x.textContent.trim() === label); if (b) b.click(); return !!b; }, id, label);
  await sleep(120); await quiet(K.p); return ok;
}
async function clickReal(K, sel) {
  const h = await K.p.$(sel); if (!h) return false;
  await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await sleep(250); await settle(K.p);
  await h.click(); await sleep(120); await quiet(K.p); return true;
}
async function scrollTo(K, id) { await K.p.evaluate((id) => { document.getElementById(id).scrollIntoView({ block: 'start' }); }, id); await sleep(150); await settle(K.p); await K.p.mouse.move(1, 1); await settle(K.p); }

// The views of one gate, in the walk's order: rest, every state, every Try step (states then tries, never reset), then its pop-ups (each from a fresh load).
async function walkGate(K, gid, fn) {
  const G = GATES.find((g) => g[0] === gid); const id = G[1];
  await K.load(); if (K.inject.js) await K.p.evaluate(K.inject.js);
  const acts = await actions(K.p, id);
  await fn({ key: `${gid}/00-rest`, id, kind: 'rest' });
  for (const [n, [kind, i, label]] of acts.entries()) { await act(K, id, kind, i); await fn({ key: `${gid}/${String(n + 1).padStart(2, '0')}-${kind}-${label.replace(/[^\w]+/g, '_').slice(0, 40)}`, id, kind, label }); }
  return acts;
}
// raw section screenshot (CSS px x DPR), captured beyond the viewport so a tall gate is whole
// The capture is the viewport at its real size, never captured beyond it: each gate's stage is sticky and as tall as the window, with its panel
// scrolling inside (measured 2026-10-03 23:14 EDT: C1's .pb-stage.g-fixed.g-sticky is 820px in an 834px window, its panel overflow:auto), so an
// enlarged capture lays the gate out at a size nobody sees, and differently from one capture to the next. A view is therefore a SET of viewport
// shots: the gate as the step left it (its head at the top of the window), the window scrolled to the gate's end, then every inner scroller of the
// gate paged from its top to its end. Each scroller is put back after.
async function shotSet(K, id) {
  // K.onSnap (A1, 2026-10-04 17:38 EDT): fidelity --auto-mask records every element's computed style and box at the moment of each shot, so the mask is
  // built from the same scroll positions as the image it masks. Unset, nothing changes.
  const shots = []; const snap = async (name) => { await settle(K.p); await K.p.mouse.move(1, 1); shots.push({ name, png: await K.p.screenshot(), meta: K.onSnap ? await K.onSnap(K) : null }); };
  await K.p.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start' }), id); await snap('top');
  const tall = await K.p.evaluate((id) => { const r = document.getElementById(id).getBoundingClientRect(); return r.height > innerHeight + 1; }, id);
  if (tall) { await K.p.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'end' }), id); await snap('end'); await K.p.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start' }), id); }
  // a window narrower than the gate (the 640px render: the stage keeps a 1148px minimum) scrolls sideways: page it left to right too
  const wide = await K.p.evaluate(() => Math.max(document.documentElement.scrollWidth - innerWidth, 0));
  for (let x = 1; wide > 1 && x <= Math.ceil(wide / (await K.p.evaluate(() => innerWidth - 40))); x++) { await K.p.evaluate((x) => window.scrollTo(Math.min(x * (innerWidth - 40), document.documentElement.scrollWidth - innerWidth), scrollY), x); await snap('x' + x); }
  if (wide > 1) await K.p.evaluate(() => window.scrollTo(0, scrollY));
  // vertical scrollers, and (since 2026-10-04 12:02 EDT, Harkirat: "scrolling (both vertical and horizontal)?") horizontal-only ones too: a badge rail,
  // an attachment rail or Compare's table wrapper hides content past its edge that a capture of its first page never compares
  const n = await K.p.evaluate((id) => { const S = [...document.getElementById(id).querySelectorAll('*')].filter((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return r.height > 8 && r.width > 20 && ((/auto|scroll/.test(c.overflowY) && e.scrollHeight > e.clientHeight + 1) || (/auto|scroll/.test(c.overflowX) && e.scrollWidth > e.clientWidth + 1)); });
    window.__bdScrollers = S.map((e) => ({ e, top: e.scrollTop, left: e.scrollLeft })); return S.length; }, id);
  for (let k = 0; k < n; k++) {
    const pages = await K.p.evaluate((k) => { const { e } = window.__bdScrollers[k]; return e.scrollHeight > e.clientHeight + 1 ? Math.ceil((e.scrollHeight - e.clientHeight) / Math.max(40, e.clientHeight - 40)) : 0; }, k);
    // a scroller wider than itself (C1's panel at 640px: the rows keep their 1025px track) is paged sideways too, on every vertical page
    const across = await K.p.evaluate((k) => { const { e } = window.__bdScrollers[k]; return e.scrollWidth > e.clientWidth + 1 ? Math.ceil((e.scrollWidth - e.clientWidth) / Math.max(40, e.clientWidth - 40)) : 0; }, k);
    for (let pg = 0; pg <= Math.min(pages, 30); pg++) { await K.p.evaluate((k, pg) => { const { e } = window.__bdScrollers[k]; e.scrollLeft = 0; e.scrollTop = Math.min(e.scrollHeight - e.clientHeight, pg * Math.max(40, e.clientHeight - 40)); }, k, pg); if (pages || !across) await snap(`s${k}p${pg}`);   // a horizontal-only rail's first page is already in the shots above
      for (let q = 1; q <= Math.min(across, 10); q++) { await K.p.evaluate((k, q) => { const { e } = window.__bdScrollers[k]; e.scrollLeft = Math.min(e.scrollWidth - e.clientWidth, q * Math.max(40, e.clientWidth - 40)); }, k, q); await snap(`s${k}p${pg}x${q}`); } }
    await K.p.evaluate((k) => { const s = window.__bdScrollers[k]; s.e.scrollTop = s.top; s.e.scrollLeft = s.left; }, k);
  }
  await settle(K.p); return shots;
}
// a pop-up as it opened, then every scroller inside it paged (a long weapon or search list, a month grid)
async function shotPop(K, sel) {
  const shots = []; const snap = async (name) => { await settle(K.p); shots.push({ name, png: await K.p.screenshot(), meta: K.onSnap ? await K.onSnap(K) : null }); };
  await snap('open');
  const n = await K.p.evaluate((sel) => { const S = []; for (const root of document.querySelectorAll(sel)) for (const e of [root, ...root.querySelectorAll('*')]) { const c = getComputedStyle(e); if (((/auto|scroll/.test(c.overflowY) && e.scrollHeight > e.clientHeight + 1) || (/auto|scroll/.test(c.overflowX) && e.scrollWidth > e.clientWidth + 1)) && e.getBoundingClientRect().height > 8) S.push(e); }
    window.__bdPopScr = S.map((e) => ({ e, top: e.scrollTop, left: e.scrollLeft })); return S.length; }, sel);
  for (let k = 0; k < n; k++) {
    const [pv, ph] = await K.p.evaluate((k) => { const { e } = window.__bdPopScr[k]; const st = (a, b) => (a > b + 1 ? Math.ceil((a - b) / Math.max(30, b - 30)) : 0); return [st(e.scrollHeight, e.clientHeight), st(e.scrollWidth, e.clientWidth)]; }, k);
    for (let pg = 1; pg <= Math.min(pv, 30); pg++) { await K.p.evaluate((k, pg) => { const { e } = window.__bdPopScr[k]; e.scrollTop = Math.min(e.scrollHeight - e.clientHeight, pg * Math.max(30, e.clientHeight - 30)); }, k, pg); await snap(`p${k}v${pg}`); }
    for (let pg = 1; pg <= Math.min(ph, 10); pg++) { await K.p.evaluate((k, pg) => { const { e } = window.__bdPopScr[k]; e.scrollTop = 0; e.scrollLeft = Math.min(e.scrollWidth - e.clientWidth, pg * Math.max(30, e.clientWidth - 30)); }, k, pg); await snap(`p${k}h${pg}`); }
    await K.p.evaluate((k) => { const s = window.__bdPopScr[k]; s.e.scrollTop = s.top; s.e.scrollLeft = s.left; }, k);
  }
  return shots;
}
async function shotSection(K, id) { const t = Date.now(); await scrollTo(K, id); const t1 = Date.now(); const h = await K.p.$('#' + id); const r = await h.screenshot({ captureBeyondViewport: true }); if (process.env.BD_VERBOSE) console.error(`  shot ${K.dir}: scroll ${t1 - t}ms capture ${Date.now() - t1}ms`); return r; }
async function shotViewport(K) { await settle(K.p); return K.p.screenshot(); }

module.exports = { ROOT, GATES, POPS, POP_SEL, sleep, serve, rel, launch, openKit, settle, quiet, shotSet, shotPop, actions, act, setState, clickReal, scrollTo, walkGate, shotSection, shotViewport, FROZEN };
