// Board 4 — THE ARC MORPHS (promoted 2026-09-30 19:40 EDT). Counts the distinct outline shapes painted while each pop-up opens and closes. A pop-up whose
// arc does not morph paints ONE shape: V80 printed 1 for every hint and picker and every other check passed (his: "none of the image mark animations
// morph their arc anymore"); V81 prints ~36. Run: node docs/pins2/instruments/board4-arc.cjs [tag]
// the arc's morph: distinct path shapes painted in the first 700ms of an open, and on close
const { W, boot } = require('./board4-checks-lib.cjs');
const tag = process.argv[2] || 'now';
const CASES = [['image mark', 'c-manifest', 'rest', '.wg-imh', 'hover'], ['compare image', 'c-compare', 'Two weapons', '#compare .b3-hint', 'hover'], ['text hint', 'c-manifest', 'rest', '.b3-hint:not(.wg-imh):not(.pinned)', 'hover'], ['problem chip', 'c-manifest', 'rest', '.wg-fwrap.b3-fx:not(.b3-okx):not(.wg-imx)', 'hover'], ['date picker', 'c-broadcast', 'Posting', '.pb-dfld:has(#post-starts) > .pb-dbtn', 'click'], ['Shown chip', 'c-broadcast', 'Saved', '.pb-pill.g-chipbtn', 'click']];
(async () => { const { b, p, errs } = await boot(1);
  for (const [name, a, s, sel, how] of CASES) { await W.setState(p, a, s); await W.sleep(400); const h = await p.$(sel); if (!h) { console.log(tag, name, 'MISSING'); continue; } await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await p.mouse.move(3, 3); await W.sleep(400);
    const pt = await h.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.evaluate(() => { const S = window.__A = { o: [], c: [], phase: 'o' }; const tick = () => { const e = document.querySelector('.b3-hc,.b3-pc.in,.b3-pc:not(.in),.b3-datepop'); const pa = e && e.querySelector('.b3-pc-line path') || (e && e.querySelector('.b3-pc-edge path:not(.glow)')); if (pa && +getComputedStyle(e).opacity > 0.02) S[S.phase].push(getComputedStyle(pa).d); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    if (how === 'hover') await p.mouse.move(pt.x, pt.y); else await p.mouse.click(pt.x, pt.y);
    await W.sleep(900); await p.evaluate(() => { window.__A.phase = 'c'; }); if (how === 'hover') await p.mouse.move(3, 3); else await p.keyboard.press('Escape'); await W.sleep(700);
    const r = await p.evaluate(() => { const A = window.__A; return { o: new Set(A.o).size, of: A.o.length, c: new Set(A.c).size, cf: A.c.length }; });
    console.log(`${tag} ${name.padEnd(14)} open: ${r.o} distinct arc shapes over ${r.of} frames · close: ${r.c} over ${r.cf}`); }
  console.log(tag, 'errs', JSON.stringify(errs.filter((e) => !/cloudinary|404/.test(e)))); await b.close(); })();
