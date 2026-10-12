// Board 4 — POP-UP TIMING, MEASURED (promoted 2026-09-30 19:40 EDT): hover or click to first visible frame, fade-in, grow, fade-out and removal per
// pop-up, on the page's own clock (capture-phase event stamps against a rAF sampler, ±1 frame). Compare against b3/poptime.js and motion-timing.md.
// ONLY=<regex> narrows the cases. Run: node docs/pins2/instruments/board4-poptiming.cjs
// Pop-up reveal / hide timing, measured on the page's own clock: capture-phase listeners stamp the triggering event, a rAF loop samples the pop-up's
// computed opacity and transform scale every frame until it is gone.
const { W, boot } = require('./board4-checks-lib.cjs');
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null; const CASES0 = [
  { name: 'Problem chip (build problems)', st: ['c-manifest', 'rest'], sel: '.wg-fwrap.b3-fx:not(.b3-okx):not(.wg-imx)', how: 'hover' },
  { name: 'All-pass mark', st: ['c-manifest', 'rest'], sel: '.wg-fwrap.b3-fx.b3-okx:not(.wg-imx)', how: 'hover' },
  { name: 'Image mark', st: ['c-manifest', 'rest'], sel: '.wg-imh .wg-imx', how: 'hover' },
  { name: 'Date picker (Post drawer)', st: ['c-broadcast', 'Posting'], sel: '.pb-dfld:has(#post-starts) > .pb-dbtn', how: 'click' },
  { name: 'Repeat picker (Shown chip)', st: ['c-broadcast', 'Saved'], sel: '.pb-pill.g-chipbtn', how: 'click' },
  { name: 'Start-date chip', st: ['c-broadcast', 'Saved'], sel: '.pb-end.g-chipbtn', how: 'click' },
  { name: 'Stage deletion hint', st: ['c-manifest', 'try:Pick three'], sel: '.b3-hint:has([aria-describedby="b3-del-hint"])', how: 'hover' },
  { name: 'Export peek', st: ['c-export', 'Picker'], sel: '.b3-xt-c', how: 'hover' },
  { name: 'HANDOFF problem → next', st: ['c-manifest', 'rest'], sel: '.wg-fwrap.b3-fx:not(.wg-imx)', how: 'hover', second: true },
];
const CASES = CASES0.filter((c) => !ONLY || ONLY.test(c.name));
(async () => { const { b, p } = await boot(1);
  for (const c of CASES) { await W.setState(p, ...c.st); await W.sleep(400); let h = await p.$(c.sel); if (!h) { console.log('MISSING', c.name, c.sel); continue; }
    let first = null; if (c.second) { const all = await p.$$(c.sel); first = all[0]; h = all[1]; await first.evaluate((e) => e.scrollIntoView({ block: 'center' })); await first.hover(); await W.sleep(900); await p.evaluate(() => { window.__first = document.querySelector('.b3-pc.in'); }); }
    if (!c.second) { await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await p.mouse.move(5, 5); await W.sleep(500); }
    await p.evaluate(() => { const S = window.__pt = { ev: [], s: [], el: null, before: new Set(document.querySelectorAll('.b3-pc,.b3-hc,.b4-arc,.b3-xt-peek')) };
      for (const k of ['mouseover', 'mouseout', 'click', 'keydown']) document.addEventListener(k, (e) => S.ev.push([k, e.timeStamp]), true);
      const tick = (t) => { if (!S.el) S.el = [...document.querySelectorAll('.b3-pc,.b3-hc,.b4-arc,.b3-xt-peek')].find((e) => !S.before.has(e) || e.classList.contains('in') || e.classList.contains('on')) || null;
        if (S.el) { const cs = getComputedStyle(S.el); const m = cs.transform.match(/matrix(3d)?\(([^)]+)\)/); S.s.push([t, S.el.isConnected ? +cs.opacity : -1, m ? +m[2].split(',')[0] : 1, S.el.className.split(' ').slice(0, 3).join('.')]); }
        if (S.s.length < 400) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    if (c.how === 'hover') await h.hover(); else await h.click();
    await W.sleep(1300); const tOff = await p.evaluate(() => performance.now());
    if (c.how === 'hover') await p.mouse.move(5, 5); else await p.keyboard.press('Escape');
    await W.sleep(900);
    const r = await p.evaluate((tOff) => { const S = window.__pt; const on = (S.ev.find((e) => e[0] === 'mouseover' || e[0] === 'click') || [])[1]; const off = (S.ev.find((e) => e[1] > tOff && (e[0] === 'mouseout' || e[0] === 'keydown')) || [])[1];
      const s = S.s; const A = s.filter((x) => x[0] < off), B = s.filter((x) => x[0] >= off); const f = (arr, pr) => (arr.find(pr) || [NaN])[0];
      const vis = f(A, (x) => x[1] > 0.01), full = f(A, (x) => x[1] >= 0.99); let settle = NaN; for (let i = A.length - 1; i >= 0; i--) { if (Math.abs(A[i][2] - 1) > 0.002) { settle = (A[i + 1] || A[i])[0]; break; } }
      const peak = Math.max(...A.map((x) => x[2])); const drop = f(B, (x) => x[1] < 0.99 && x[1] >= 0), zero = f(B, (x) => x[1] <= 0.01), gone = f(B, (x) => x[1] === -1);
      return { nA: A.length, nB: B.length, evs: S.ev.map((e) => e[0][0] + Math.round(e[1])).slice(0, 6).join(' '), cls: (s[0] || [])[3], open: { delay: vis - on, fade: full - vis, motion: settle - vis, overshoot: peak }, close: { start: drop - off, fade: zero - off, unmount: gone - off } }; }, tOff);
    if (c.second) console.log('   first card still connected after the handoff:', await p.evaluate(() => Boolean(window.__first && window.__first.isConnected && window.__first.classList.contains('in'))));
    const n = (v) => (Number.isFinite(v) ? Math.round(v) + 'ms' : '—');
    console.log(`${c.name.padEnd(30)} ${String(r.cls).padEnd(26)} OPEN wait ${n(r.open.delay)} · fade-in ${n(r.open.fade)} · motion ${n(r.open.motion)} (peak scale ${r.open.overshoot == null ? '—' : (+r.open.overshoot).toFixed(3)}) [${r.nA}/${r.nB} frames, events ${r.evs}] | CLOSE fade-out ${n(r.close.fade)} · removed ${n(r.close.unmount)}`); }
  await b.close(); })();
