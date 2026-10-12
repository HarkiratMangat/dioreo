// Board 4 — EVERY POP-UP THROUGH EVERY PATH, FRAME BY FRAME (promoted 2026-09-30 19:40 EDT from Session 3's V79 sweep). Hover/leave, into the card, re-enter
// while fading, pin + outside, the handoff between marks, row to row, click + Esc/outside/button, fast re-clicks — each recorded per animation frame and
// judged: JUMP (moved while visible), RESIZE, SCALE-SNAP, FLICKER, POP-IN (0 → >60% in a frame), VANISHED (removed while visible), ARC-SHAPE (the
// outline's `d` changed — expected during a morph). The tracked checks (r22, relations, a11y) cannot see time; this can. Point it at the portal with
// B4_URL for Session 5's port. Run: node docs/pins2/instruments/board4-popups.cjs
// Every pop-up family through every path, recorded frame by frame; anomalies flagged.
const { W, boot } = require('./board4-checks-lib.cjs');
const SEL = '.b3-pc,.b3-hc,.b4-arc,.b3-xt-peek';
const rec = async (p) => p.evaluate((SEL) => { const R = window.__R = { f: [], ids: new WeakMap(), n: 0, on: true };
  const tick = (t) => { if (!R.on) return; for (const e of document.querySelectorAll(SEL)) { if (!R.ids.has(e)) R.ids.set(e, ++R.n); const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); const m = cs.transform.match(/matrix(3d)?\(([^)]+)\)/); const pa = e.querySelector('.b3-pc-edge:not(.b3-pc-line) path:not(.glow)');
      R.f.push({ t, id: R.ids.get(e), op: +cs.opacity, sc: m ? +(+m[2].split(',')[0]).toFixed(3) : 1, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), in: /\b(in|on)\b/.test(e.className), cut: e.classList.contains('cut'), vis: cs.visibility, d: pa ? (getComputedStyle(pa).d || '').length + ':' + (getComputedStyle(pa).d || '').slice(10, 40) : '', pn: pa || null }); }
    R.f.push({ t, tick: 1, alive: [...document.querySelectorAll(SEL)].map((e) => R.ids.get(e)) }); requestAnimationFrame(tick); };
  requestAnimationFrame(tick); }, SEL);
const stop = async (p) => p.evaluate(() => { const R = window.__R; R.on = false; const pn = new Map(); let k = 0; return R.f.map((f) => { if (f.pn !== undefined) { if (f.pn && !pn.has(f.pn)) pn.set(f.pn, ++k); f.pn = f.pn ? pn.get(f.pn) : 0; } return f; }); });
function judge(fr) { const out = []; const by = new Map(); const ticks = fr.filter((f) => f.tick);
  for (const f of fr) if (!f.tick) { if (!by.has(f.id)) by.set(f.id, []); by.get(f.id).push(f); }
  for (const [id, a] of by) { const vis = a.filter((f) => f.op > 0.02 && f.vis !== 'hidden'); if (!vis.length) continue;
    for (let i = 1; i < a.length; i++) { const p = a[i - 1], c = a[i]; const pv = p.op > 0.02 && p.vis !== 'hidden', cv = c.op > 0.02 && c.vis !== 'hidden';
      if (pv && cv && (Math.abs(c.x - p.x) > 2 || Math.abs(c.y - p.y) > 2) && Math.abs(c.sc - p.sc) < 0.002) out.push(`#${id} JUMP ${p.x},${p.y}→${c.x},${c.y} @${Math.round(c.t)}`);
      if (pv && cv && (Math.abs(c.w - p.w) > 2 || Math.abs(c.h - p.h) > 2) && Math.abs(c.sc - p.sc) < 0.002) out.push(`#${id} RESIZE ${p.w}x${p.h}→${c.w}x${c.h} @${Math.round(c.t)}`);
      if (cv && c.pn !== p.pn && p.pn && c.pn) out.push(`#${id} ARC-REMOUNT @${Math.round(c.t)}`);
      if (pv && cv && c.d !== p.d && c.pn === p.pn && !(c.in && a[0].in === false && i < 45)) out.push(`#${id} ARC-SHAPE ${p.d.split(':')[0]}→${c.d.split(':')[0]} @${Math.round(c.t)}`);
      if (pv && cv && Math.abs(c.sc - p.sc) > 0.04) out.push(`#${id} SCALE-SNAP ${p.sc}→${c.sc} @${Math.round(c.t)}`);
      if (p.in && c.in && c.op + 0.05 < p.op) out.push(`#${id} FLICKER-DOWN ${p.op.toFixed(2)}→${c.op.toFixed(2)} @${Math.round(c.t)}`);
      if (!p.in && !c.in && c.op > p.op + 0.05) out.push(`#${id} FLICKER-UP ${p.op.toFixed(2)}→${c.op.toFixed(2)} @${Math.round(c.t)}`);
      if (!pv && cv && c.op > 0.6) out.push(`#${id} POP-IN op${c.op.toFixed(2)} in one frame @${Math.round(c.t)}`); }
    const last = a[a.length - 1]; const ti = ticks.findIndex((t) => t.t > last.t); if (ti >= 0 && last.op > 0.05 && !ticks[ti].alive.includes(id)) out.push(`#${id} VANISHED at op${last.op.toFixed(2)}${last.cut ? ' (cut: handoff)' : ''} @${Math.round(last.t)}`);
    const first = vis[0]; out.push(`#${id} first-visible ${first.x},${first.y} ${first.w}x${first.h} sc${first.sc}`); }
  return out; }
const CASES = [
  ['c-manifest', 'rest', 'problem chip', '.wg-fwrap.b3-fx:not(.b3-okx):not(.wg-imx)', 'b3-fchip'],
  ['c-manifest', 'rest', 'all-pass mark', '.wg-fwrap.b3-fx.b3-okx:not(.wg-imx)', 'b3-fchip'],
  ['c-manifest', 'rest', 'image mark', '.wg-imh', 'b3-fchip'],
  ['c-compare', 'Two weapons', 'compare image mark', '#compare .b3-hint', null],
  ['c-manifest', 'rest', 'text hint', '.b3-hint:not(.wg-imh):not(.pinned)', null],
  ['c-export', 'Picker', 'export peek', '.b3-xt-c', null],
];
const PICKS = [['c-broadcast', 'Posting', 'date picker', '.pb-dfld:has(#post-starts) > .pb-dbtn'], ['c-broadcast', 'Saved', 'Shown chip', '.pb-pill.g-chipbtn'], ['c-broadcast', 'Saved', 'start chip', '.pb-end.g-chipbtn']];
(async () => { const { b, p, errs } = await boot(1); const log = (name, path, fr) => { const j = judge(fr); console.log(`${name.padEnd(20)} ${path.padEnd(16)} ${j.filter((x) => !/first-visible/.test(x)).join(' | ') || 'clean'}   [${j.filter((x) => /first-visible/.test(x)).join(' ; ')}]`); };
  const center = async (h) => h.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const cardC = async () => p.evaluate(() => { const c = document.querySelector('.b3-pc.in,.b3-hc.in'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  for (const [a, s, name, sel, inner] of CASES) { await W.setState(p, a, s); await W.sleep(400); const all = await p.$$(sel); if (!all.length) { console.log(name, 'MISSING'); continue; } const h = all[0];
    await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await p.mouse.move(3, 3); await W.sleep(500); const c = await center(h);
    await rec(p); await p.mouse.move(c.x, c.y, { steps: 3 }); await W.sleep(900); await p.mouse.move(3, 3, { steps: 3 }); await W.sleep(800); log(name, 'hover+leave', await stop(p));
    if (name !== 'export peek') { await rec(p); await p.mouse.move(c.x, c.y, { steps: 3 }); await W.sleep(900); const k = await cardC(); if (k) { await p.mouse.move(k.x, k.y, { steps: 6 }); await W.sleep(600); } await p.mouse.move(3, 3, { steps: 3 }); await W.sleep(800); log(name, 'into card', await stop(p)); }
    await rec(p); await p.mouse.move(c.x, c.y, { steps: 3 }); await W.sleep(900); await p.mouse.move(3, 3, { steps: 2 }); await W.sleep(260); await p.mouse.move(c.x, c.y, { steps: 2 }); await W.sleep(900); await p.mouse.move(3, 3); await W.sleep(800); log(name, 're-enter fading', await stop(p));
    if (inner !== null || name.includes('image')) { await rec(p); await p.mouse.move(c.x, c.y, { steps: 3 }); await W.sleep(300); await p.mouse.click(c.x, c.y); await W.sleep(700); await p.mouse.move(3, 3, { steps: 3 }); await W.sleep(600); await p.mouse.click(3, 3); await W.sleep(700); log(name, 'pin+outside', await stop(p)); }
    const inView = []; for (const e of all) { const r = await e.evaluate((x) => { const q = x.getBoundingClientRect(); return q.top > 60 && q.bottom < innerHeight - 60; }); if (r) inView.push(e); } if (inView[1] && name !== 'export peek' && name !== 'text hint') { all[0] = inView[0]; all[1] = inView[1]; const c2 = await center(all[1]); await all[0].evaluate((e) => e.scrollIntoView({ block: 'center' })); await W.sleep(300); const c1 = await center(all[0]); const c2b = await center(all[1]); await rec(p); await p.mouse.move(c1.x, c1.y, { steps: 3 }); await W.sleep(900); await p.mouse.move(c2b.x, c2b.y, { steps: 6 }); await W.sleep(900); await p.mouse.move(3, 3); await W.sleep(800); log(name, 'handoff A→B', await stop(p)); }
    if (name === 'export peek' && all[3]) { const c3 = await center(all[3]); await rec(p); await p.mouse.move(c.x, c.y, { steps: 3 }); await W.sleep(700); await p.mouse.move(c3.x, c3.y, { steps: 6 }); await W.sleep(700); await p.mouse.move(3, 3); await W.sleep(800); log(name, 'row→row', await stop(p)); } }
  for (const [a, s, name, sel] of PICKS) { await W.setState(p, a, s); await W.sleep(400); const h = await p.$(sel); if (!h) { console.log(name, 'MISSING'); continue; } await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await W.sleep(300); const c = await center(h);
    await rec(p); await p.mouse.click(c.x, c.y); await W.sleep(700); await p.keyboard.press('Escape'); await W.sleep(600); log(name, 'click+Esc', await stop(p));
    await rec(p); await p.mouse.click(c.x, c.y); await W.sleep(700); await p.mouse.click(3, 3); await W.sleep(600); log(name, 'click+outside', await stop(p));
    await rec(p); await p.mouse.click(c.x, c.y); await W.sleep(700); await p.mouse.click(c.x, c.y); await W.sleep(600); log(name, 'click+button', await stop(p));
    await rec(p); await p.mouse.click(c.x, c.y); await W.sleep(90); await p.mouse.click(c.x, c.y); await W.sleep(90); await p.mouse.click(c.x, c.y); await W.sleep(800); await p.keyboard.press('Escape'); await W.sleep(600); log(name, 'fast re-click', await stop(p)); }
  console.log('errs', JSON.stringify(errs.filter((e) => !/cloudinary|404/.test(e)))); await b.close(); })();
