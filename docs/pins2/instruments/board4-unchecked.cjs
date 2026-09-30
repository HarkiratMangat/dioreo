// Board 4 · the ten things the readiness sweep had only NOTED as not exercised (2026-09-29 23:40 EDT). Harkirat: "finish the 'not checked' items … that's work
// you need to be doing as part of session 3". Each is driven through the real interaction and measured; crops go to local/pins2/intake-shots/readiness-v45/unchecked/
// (this Mac only). Usage (the kit on :8900): node docs/pins2/instruments/board4-unchecked.cjs → one JSON object
const W = require('../final/board4-spec/board4-walk.cjs');
const D = require('path').resolve(__dirname, '../../../local/pins2/intake-shots/readiness-v45/unchecked');
(async () => {
  const { b, p, errs } = await W.open(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 }); await W.sleep(600);
  const out = {}; const shot = async (sel, name) => { const el = await p.$(sel); if (el) { await el.screenshot({ path: `${D}/${name}.png` }); return true; } out['miss:' + name] = sel; return false; };
  const ev = (fn, ...a) => p.evaluate(fn, ...a).catch((e) => 'ERR ' + e.message);
  const centre = async (sel) => { const el = await p.$(sel); if (!el) return null; await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); await W.sleep(150); const q = await el.boundingBox(); return q && [q.x + q.width / 2, q.y + q.height / 2]; };
  // 1 · the image well: three shapes snap to the nearest set shape, then the image clears
  await W.setState(p, 'c-new-build', 'Add build');
  out.imageWell = [];
  for (const [n, want] of [['wide3x1', '16:9'], ['square', '1:1'], ['tall2x3', '3:4']]) {
    const inp = await p.$('#c-new-build input[type=file]'); if (!inp) { out.imageWell.push('no file input'); break; }
    await inp.uploadFile(`/tmp/wl-${n}.png`); await W.sleep(700);
    const r = await ev(() => { const s = document.querySelector('#c-new-build .f-shot'); const q = s.getBoundingClientRect(); return { ar: s.dataset.ar, box: Math.round(q.width / q.height * 100) / 100, img: Boolean(s.querySelector('img')) }; });
    out.imageWell.push({ n, want, ...r, ok: r.ar === want });
    if (n === 'wide3x1') await shot('#c-new-build .f-media', 'well-wide');
  }
  const clr = await ev(() => { const bs = [...document.querySelectorAll('#c-new-build .f-media button')]; const c = bs.find((x) => /clear|remove/i.test(x.getAttribute('aria-label') || x.textContent)); if (!c) return bs.map((x) => (x.getAttribute('aria-label') || x.textContent).trim()).join(' | '); c.click(); return 'clicked ' + (c.getAttribute('aria-label') || c.textContent).trim(); });
  await W.sleep(400); out.imageWellClear = { clr, after: await ev(() => ({ img: Boolean(document.querySelector('#c-new-build .f-shot img')), file: (document.querySelector('#c-new-build .f-fname') || {}).textContent || null })) };
  await shot('#c-new-build .f-media', 'well-cleared');
  // 2 · Bulk: the code's copy tick lasts ~1.1s; a card click brings its block to the middle of the editor
  await W.setState(p, 'c-new-build', 'Bulk · several');
  const cc = await p.$('#c-new-build .drawer dd button'); out.bulkTick = null;
  if (cc) { await cc.evaluate((e) => e.scrollIntoView({ block: 'center' })); const has = () => cc.evaluate((e) => /check/.test(e.innerHTML) && !/copy/.test(e.innerHTML.match(/href="[^"]*"/g)?.join('') || '')); const t0 = await has(); await cc.click(); const seq = []; const st = Date.now(); for (let i = 0; i < 16; i++) { seq.push([Date.now() - st, await has()]); await W.sleep(100); }
    const on = seq.filter((x) => x[1]); out.bulkTick = { before: t0, firstOn: on[0] && on[0][0], lastOn: on.length ? on[on.length - 1][0] : null }; }
  const ed = await ev(() => { const g = document.querySelector('#c-new-build .drawer'); const sc = [...g.querySelectorAll('*')].filter((e) => { const c = getComputedStyle(e); return /(auto|scroll)/.test(c.overflowY) && e.scrollHeight > e.clientHeight + 4; }); return sc.map((e) => e.className.toString().slice(0, 40) + ' ' + e.scrollHeight + '/' + e.clientHeight); });
  out.bulkScrollers = ed;
  await ev(() => { document.querySelectorAll('#c-new-build .drawer *').forEach((e) => { if (e.scrollTop) e.scrollTop = 0; }); });
  const cards = await p.$$('#c-new-build .drawer .bk-card, #c-new-build .drawer [class*=bk-res], #c-new-build .drawer article');
  out.bulkCards = cards.length;
  if (cards.length >= 3) { await cards[2].evaluate((e) => e.scrollIntoView({ block: 'center' })); const q = await cards[2].boundingBox(); await p.mouse.click(q.x + q.width * 0.6, q.y + 30); await W.sleep(700);
    out.bulkJump = await ev(() => { const g = document.querySelector('#c-new-build .drawer'); const sc = [...g.querySelectorAll('*')].filter((e) => { const c = getComputedStyle(e); return /(auto|scroll)/.test(c.overflowY) && e.scrollHeight > e.clientHeight + 4; });
      const edt = sc.find((e) => e.closest('.bk-ed, .bk-editor, [class*=edit]') || /ed|src|code/.test(e.className)) || sc[0]; const lit = g.querySelector('.bk-blk.on, .on[class*=blk], [class*=line].on, .bk-lit');
      const r = edt.getBoundingClientRect(); const lr = lit && lit.getBoundingClientRect(); return { editor: edt.className.toString().slice(0, 40), scrollTop: edt.scrollTop, lit: lit ? lit.className.toString().slice(0, 40) : null, litCentreOffPct: lr ? Math.round((((lr.top + lr.bottom) / 2 - (r.top + r.bottom) / 2) / r.height) * 100) : null }; });
    await shot('#c-new-build .drawer', 'bulk-after-card-click'); }
  // 3 · Export's peek card fades where it was
  await W.setState(p, 'c-export', 'Picker'); await W.sleep(400);
  const chip = await centre('#c-export .b3-xt-c'); out.peek = null;
  if (chip) { await p.mouse.move(chip[0], chip[1]); await W.sleep(500); const r0 = await ev(() => { const k = document.querySelector('#c-export .b3-xt-peek'); const q = k.getBoundingClientRect(); return [Math.round(q.top), Math.round(q.height), getComputedStyle(k).opacity, k.classList.contains('on')]; });
    await shot('#c-export .b3-xt-peek', 'peek-on'); await p.mouse.move(chip[0] + 400, chip[1] + 300); const seq = []; for (let i = 0; i < 8; i++) { seq.push(await ev(() => { const k = document.querySelector('#c-export .b3-xt-peek'); const q = k.getBoundingClientRect(); return [Math.round(q.top), Math.round(q.height), Math.round(+getComputedStyle(k).opacity * 100) / 100]; })); await W.sleep(35); }
    out.peek = { on: r0, fading: seq }; }
  // 4 · Repairs: a ticket does not respond to hover
  await W.setState(p, 'c-repairs', 'Today’s');
  const tk = await ev(() => { const btn = [...document.querySelectorAll('#c-repairs button')].find((x) => /Repair build/.test(x.textContent)); let c = btn; while (c && !(getComputedStyle(c).borderTopWidth !== '0px' && c.getBoundingClientRect().height > 150)) c = c.parentElement; if (!c) return null; c.id = 'tk1'; return true; });
  if (tk) { const style = () => ev(() => { const c = getComputedStyle(document.getElementById('tk1')); return [c.backgroundColor, c.backgroundImage.slice(0, 60), c.boxShadow.slice(0, 80), c.borderColor, c.transform, c.filter, c.cursor].join(' ; '); });
    const s0 = await style(); const q = await (await p.$('#tk1')).boundingBox(); await p.mouse.move(q.x + 40, q.y + 20); await W.sleep(400); const s1 = await style(); out.ticketHover = { same: s0 === s1, rest: s0, hover: s1 === s0 ? '(same)' : s1 }; await p.mouse.move(2, 2); }
  // 5 · ASS: the stink lines move; 6 · Capable in DMZ
  const ass = await centre('#c-manifest .b3-bdg[data-k=ass]');
  out.ass = await ev(() => { const a = document.querySelector('#c-manifest .b3-bdg[data-k=ass]'); if (!a) return null; const run = a.closest('.b3-bdgs'); const i = a.querySelector('.b3-ass > i'); const c = i && getComputedStyle(i); return { runIn: run.classList.contains('in'), anim: c && c.animationName, dur: c && c.animationDuration, t0: c && c.transform }; });
  await W.sleep(450); out.assLater = await ev(() => { const i = document.querySelector('#c-manifest .b3-bdg[data-k=ass] .b3-ass > i'); return i && getComputedStyle(i).transform; });
  await shot('#c-manifest .b3-bdg[data-k=ass]', 'ass-badge');
  await W.setState(p, 'c-new-build', 'DMZ'); out.dmzTiers = await ev(() => [...document.querySelectorAll('#c-new-build .f-tier')].map((t) => t.textContent.replace(/\s+/g, ' ').trim()));
  // 7 · META + BEST + TOXIC: which builds carry all three, and do they wrap?
  out.metaBestToxic = await ev(async () => { try { const m = await import('/docs/pins2/kit/data/armory.js'); const all = (m.default && (m.default.builds || m.default)) || []; return (Array.isArray(all) ? all : []).filter((x) => x.isMeta && x.isToxic && x.categoryRank === 'best').map((x) => `${x.weaponName} ${x.mode} ${x.buildName}`); } catch (e) { return 'ERR ' + e.message; } });
  await W.setState(p, 'c-export', 'Picker'); await W.sleep(400);
  const sk = await ev(() => { const n = [...document.querySelectorAll('#c-export *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'STRIKER'); if (!n) return null; let t = n; while (t && !t.querySelector('.b3-xt-c')) t = t.parentElement; const c = t && t.querySelector('.b3-xt-c'); if (!c) return null; c.id = 'sk1'; c.scrollIntoView({ block: 'center' }); return true; });
  if (sk) { const q = await (await p.$('#sk1')).boundingBox(); await p.mouse.move(q.x + q.width / 2, q.y + q.height / 2); await W.sleep(500);
    out.strikerPeek = await ev(() => { const k = document.querySelector('#c-export .b3-xt-peek'); const bd = [...k.querySelectorAll('.b3-bdg')].filter((x) => x.getBoundingClientRect().width > 0); return { head: k.textContent.slice(0, 30), badges: bd.map((x) => x.textContent.trim()).join(' · '), lines: new Set(bd.map((x) => Math.round(x.getBoundingClientRect().top))).size }; });
    await shot('#c-export .b3-xt-peek', 'striker-peek');
    // the run fits the wide peek on one line; the ruling is that it wraps when it does not — narrow its box and count the lines
    out.strikerNarrow = await ev(() => { const r = document.querySelector('#c-export .b3-xt-peek .b3-bdgs'); const was = r.style.maxWidth; r.style.maxWidth = '240px'; const bd = [...r.querySelectorAll('.b3-bdg')].filter((x) => x.getBoundingClientRect().width > 0); const lines = new Set(bd.map((x) => Math.round(x.getBoundingClientRect().top))).size; const over = r.scrollWidth > r.clientWidth + 1; r.style.maxWidth = was; return { lines, overflows: over }; });
    await p.mouse.move(2, 2); }
  // 8 · unticked chips at rest, hovered and disabled
  await W.setState(p, 'c-new-build', 'Add build');
  const op = () => ev(() => [...document.querySelectorAll('#c-new-build .f-bdgs .f-bt')].map((x) => `${x.getAttribute('aria-label')}:${x.getAttribute('aria-checked')}:${x.disabled ? 'dis' : ''}:${getComputedStyle(x.querySelector('.b3-bdgs')).opacity}`));
  out.chipsRest = await op(); const meta = await centre('#c-new-build .f-bt[aria-label=META]'); await p.mouse.move(meta[0], meta[1]); await W.sleep(300); out.chipsHoverMeta = await op(); await p.mouse.click(meta[0], meta[1]); await p.mouse.move(2, 2); await W.sleep(350); out.chipsMetaTicked = await op();
  await shot('#c-new-build .f-bdgs', 'chips-meta-ticked');
  // 9 · the discard confirm
  await W.setState(p, 'c-new-build', 'Add build'); await W.clickReal(p, '#c-new-build #nb-w'); await p.keyboard.type('bal'); await W.sleep(300); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await W.sleep(400); await p.keyboard.press('Escape'); await W.sleep(300); await p.keyboard.press('Escape'); await W.sleep(500);
  out.discard = await ev(() => { const t = document.querySelector('#c-new-build').textContent; return /Discard this draft\?/.test(t); }); await shot('#c-new-build .drawer', 'discard-confirm');
  // 10 · the wheel in every drawer's dead space scrolls the column that owns it
  const wheel = async (gate, state, sel, name) => { if (state) await W.setState(p, gate, state); await W.sleep(400);
    const box = await ev((sel) => { const d = document.querySelector(sel); if (!d) return null; d.scrollIntoView({ block: 'start' }); const q = d.getBoundingClientRect(); return [q.x, q.y, q.width, Math.min(q.height, innerHeight - q.y)]; }, sel); if (!box) return { name, miss: sel };
    let dead = [], pts = 0;
    for (let gy = 1; gy < 10; gy++) for (let gx = 1; gx < 11; gx++) { const x = box[0] + box[2] * gx / 11, y = box[1] + box[3] * gy / 10;
      const snap = () => ev((sel) => [scrollY, ...[...document.querySelectorAll(sel + ' *')].filter((e) => e.scrollHeight > e.clientHeight + 2).map((e) => e.scrollTop)].join(','), sel);
      const target = await ev((x, y, sel) => { const e = document.elementFromPoint(x, y); return e && e.closest(sel) ? (e.closest('input,textarea,button,select,a,[role=radio],[role=checkbox]') ? 'ctl' : e.closest('.dw-h') ? 'head' : 'ok') : 'out'; }, x, y, sel);   // the header is not dead space: the rule is "below its header" (b3/fady.js)
      if (target !== 'ok') continue; pts++;
      const s0 = await snap(); await p.mouse.move(x, y); await p.mouse.wheel({ deltaY: 160 }); await W.sleep(140); let s1 = await snap();
      if (s1 === s0) { await p.mouse.wheel({ deltaY: -160 }); await W.sleep(140); s1 = await snap(); }
      if (s1 === s0) dead.push([Math.round(x), Math.round(y)]); }
    return { name, points: pts, dead: dead.length, deadAt: dead.slice(0, 8) }; };
  out.wheel = [];
  out.wheel.push(await wheel('c-new-build', 'Add build', '#c-new-build .drawer', 'Add'));
  out.wheel.push(await wheel('c-new-build', 'Add · three', '#c-new-build .drawer', 'Add three'));
  out.wheel.push(await wheel('c-new-build', 'Bulk · several', '#c-new-build .drawer', 'Bulk several'));
  out.wheel.push(await wheel('c-new-build', 'Edit 3 builds', '#c-new-build .drawer', 'Edit 3'));
  out.wheel.push(await wheel('c-broadcast', 'Posting', '#c-broadcast .drawer', 'Post'));
  await W.setState(p, 'c-export', 'Picker'); await ev(() => { const d = document.querySelector('#c-export aside.drawer'); if (d) d.id = 'xpick'; });
  out.wheel.push(await wheel('c-export', null, '#xpick', 'Export picker'));
  out.pageErrors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
