// Board 4 · the Version 44 round's falsifiers, run on the live kit before and after the build (2026-09-29 22:26 EDT, his V44 intake, classes AT–BB).
//   hover  · AU: every hover target of Compare's table, by a REAL mouse hover; no th/td may move, resize or stop being a table cell
//   pop    · AW: a bare badge's pop sampled every frame in and out: its width, and whether the bare badge ever shows while the pop does
//   lists  · AT/BA/BB: the build drawer's weapon list order and hairlines; Compare's list ticks, and the tick on a hovered picked row
//   counts · AZ: the numeral's colour in each count readout (queue budget, drawer budget, character counter)
//   rows   · AV: a slot every build shares is a row AND a Same chip
// Usage: node docs/pins2/instruments/board4-v44-probe.cjs [label]   → prints one JSON object
const W = require('../final/board4-spec/board4-walk.cjs');
(async () => {
  const { b, p, errs } = await W.open(); const out = { label: process.argv[2] || '' };
  try {
    out.states = (await W.actions(p, 'c-compare')).map((a) => a[2]);
    await W.setState(p, 'c-compare', 'Two weapons'); await p.mouse.move(2, 2); await W.sleep(500);
    // boxes are measured from the table's own corner, so a scroll between two readings is not read as a move
    const boxes = () => p.evaluate(() => { const t = document.querySelector('#c-compare .cx-t:not([data-ghost])').getBoundingClientRect(); return [...document.querySelectorAll('#c-compare .cx-t:not([data-ghost]) :is(th,td)')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round((r.x - t.x) * 2) / 2, Math.round((r.y - t.y) * 2) / 2, Math.round(r.width * 2) / 2, Math.round(r.height * 2) / 2, getComputedStyle(e).display]; }); });
    const rest = await boxes();
    const kinds = { weaponHead: '.cx-gr th.cx-g', buildHead: 'th.cx-h', slotLabel: 'tbody th.cx-k0', cell: 'td.cx-c', bandChip: '.cx-band .wg-at', tileChip: '.cx-tiles .cx-k' };
    out.hover = {};
    for (const [k, sel] of Object.entries(kinds)) {
      const pts = await p.evaluate((sel) => [...document.querySelectorAll(`#c-compare ${sel}`)].slice(0, 6).map((e) => { e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + Math.min(r.height / 2, 14)]; }), sel);
      let worst = 0, notCell = 0;
      for (const [x, y] of pts) { await p.mouse.move(x, y); await W.sleep(260); const now = await boxes();
        now.forEach((n, i) => { const r0 = rest[i]; if (!r0) return; worst = Math.max(worst, ...[0, 1, 2, 3].map((j) => Math.abs(n[j] - r0[j]))); if (!/table-cell/.test(n[4])) notCell += 1; }); await p.mouse.move(2, 2); await W.sleep(200); }
      out.hover[k] = { targets: pts.length, worstMovePx: worst, nonCellFrames: notCell };
    }
    // AV: rows vs the band
    out.rows = await p.evaluate(() => ({ rows: [...document.querySelectorAll('#c-compare .cx-t:not([data-ghost]) tbody th.cx-k0')].map((t) => t.textContent.trim()),
      same: [...document.querySelectorAll('#c-compare .cx-band .cx-sv')].map((c) => c.dataset.slot), shared: [...document.querySelectorAll('#c-compare .cx-band .cx-shc')].map((c) => c.dataset.slot) }));
    // AX: the head's name
    out.names = await p.evaluate(() => [...document.querySelectorAll('#c-compare .cx-nm')].map((n) => `${n.className}: ${n.textContent.trim()}`));   // since 2026-09-29 23:41 EDT the name is a table row
    // AW: the pop, frame by frame
    const bw = await p.evaluate(() => { const e = document.querySelector('#c-compare .b3-bdgs.bare .b3-bw'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    if (bw) {
      const sample = () => p.evaluate(() => { const w = document.querySelector('#c-compare .b3-bdgs.bare .b3-bw'); const pop = w.querySelector('.b3-bpop'), bare = w.querySelector(':scope > .b3-bdg'); const cp = getComputedStyle(pop), cb = getComputedStyle(bare);
        const popOn = cp.display !== 'none' && cp.visibility !== 'hidden' && +cp.opacity > 0.01; return [Math.round(pop.getBoundingClientRect().width), popOn ? 1 : 0, cb.visibility !== 'hidden' && +cb.opacity > 0.01 ? 1 : 0]; });
      const frames = async () => { const f = []; for (let i = 0; i < 22; i++) { f.push(await sample()); await W.sleep(16); } return f; };
      await p.mouse.move(bw[0], bw[1]); const inF = await frames(); await p.mouse.move(2, 2); const outF = await frames();
      const both = (f) => f.filter(([, po, ba]) => po && ba).length;
      const widths = (f) => [...new Set(f.map((x) => x[0]))].length;
      out.pop = { in: { distinctWidths: widths(inF), bothVisibleFrames: both(inF), first: inF[0], last: inF[inF.length - 1] }, out: { distinctWidths: widths(outF), bothVisibleFrames: both(outF), first: outF[0], last: outF[outF.length - 1] } };
    }
    // BA/BB: Compare's list
    await W.clickReal(p, '#c-compare .cx-pick input'); await W.sleep(500);
    out.compareList = await p.evaluate(() => { const lis = [...document.querySelectorAll('#c-compare .f-menu li[role=option]')]; const picked = lis.filter((l) => l.querySelector('.cx-mk[data-picked]'));
      return { rows: lis.length, picked: picked.length, pickedWithTick: picked.filter((l) => { const t = l.querySelector('.f-tick'); return t && getComputedStyle(t).display !== 'none' && t.querySelector('svg'); }).length, multiselectable: document.querySelector('#c-compare .f-menu')?.getAttribute('aria-multiselectable') }; });
    const pr = await p.evaluate(() => { const l = [...document.querySelectorAll('#c-compare .f-menu li[role=option]')].find((x) => x.querySelector('.cx-mk[data-picked]')); if (!l) return null; const r = l.querySelector('.f-ol').getBoundingClientRect(); return [r.x + 4, r.y + r.height / 2]; });
    if (pr) { await p.mouse.move(pr[0], pr[1]); await W.sleep(420);
      out.compareList.hoverPicked = await p.evaluate(() => { const l = [...document.querySelectorAll('#c-compare .f-menu li[role=option]')].find((x) => x.querySelector('.cx-mk[data-picked]')); const t = l.querySelector('.f-tick'); const ol = getComputedStyle(l.querySelector('.f-ol'));
        return { tickColor: t ? getComputedStyle(t).color : null, tickPath: t && t.querySelector('path') ? getComputedStyle(t.querySelector('path')).d : null, strike: ol.textDecorationLine }; }); }
    await W.closePop(p);
    // AT: the build drawer's weapon list
    await W.setState(p, 'c-new-build', 'Add build'); await W.clickReal(p, '#c-new-build #nb-w'); await W.sleep(600);
    out.drawerList = await p.evaluate(() => { const lis = [...document.querySelectorAll('#c-new-build .f-menu li[role=option]')];
      return { rows: lis.length, first: lis.slice(0, 5).map((l) => l.querySelector('.f-ol').textContent + ' · ' + (l.querySelector('.f-om') || {}).textContent), hairlines: lis.filter((l) => l.classList.contains('f-g0') && getComputedStyle(l, '::before').content !== 'none').length,
        countChips: lis.filter((l) => l.querySelector('.f-oc')).length, metaColor: lis[0] && getComputedStyle(lis[0].querySelector('.f-om')).color }; });
    await W.closePop(p);
    // AZ: the count readouts' numerals
    const col = (sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0, 3).map((e) => `${e.textContent.trim()} → ${getComputedStyle(e).color}`), sel);
    out.counts = { queue: await col('#c-queue .g-budget b') };
    await W.setState(p, 'c-broadcast', 'Posting'); await W.sleep(600);
    out.counts.drawerBudget = await col('#c-broadcast .pb-meter2 b'); out.counts.drawerCounter = await col('#c-broadcast .b3-cc:not(.pb-meter2) b, #c-broadcast .b3-cc:not(.pb-meter2)');
    // AY: the manifest's weapons
    out.manifest = await p.evaluate(() => [...new Set([...document.querySelectorAll('#c-manifest .wg-r')].map((r) => (r.closest('[data-weapon]') || {}).dataset?.weapon).filter(Boolean))]);
    out.manifestHas = await p.evaluate(() => ({ PHARO: document.querySelector('#c-manifest').textContent.includes('PHARO'), GS50: document.querySelector('#c-manifest').textContent.includes('.50 GS') }));
  } catch (e) { out.error = String(e && e.stack || e); }
  out.pageErrors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
