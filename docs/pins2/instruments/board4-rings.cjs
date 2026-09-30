// Board 4 — ONE FOCUS RING PER FIELD (his 2026-09-30 16:44–16:51 EDT mini intake: the Post drawer's hex, date and text fields drew two rings, 1px, square
// inside rounded). Focuses every text field on every surface — the gates AND the drawers they open (a click outside a drawer closes it, which is how
// the earlier check never measured one) — and reports, per field, how many layers draw a staged ring (want 1), that ring's width (want 2px: a staged
// border + inset, an inset alone, or an outline) and whether the 5px staged halo is there. Held with the other checks; run:
//   node docs/pins2/instruments/board4-rings.cjs [tag]
const { W, boot, shot } = require('./board4-checks-lib.cjs');
const STAGED = /216, 242, 74|0\.847059 0\.94902 0\.290196/;
(async () => { const { b, p, errs } = await boot(2); const tag = process.argv[2] || 'now'; const rows = [];
  const measure = async (scopeSel, label) => { const fs = await p.$$(`${scopeSel} :is(input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]):not([type=color]):not([type=file]), textarea)`);
    for (const h of fs) { const vis = await h.evaluate((e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 20); if (!vis) continue;
      await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await h.click({ delay: 10 }).catch(() => h.focus()); await W.sleep(320);
      const r = await h.evaluate((f, src) => { const re = new RegExp(src); const layers = []; let halo = false;
        for (let e = f, k = 0; e && k < 5; e = e.parentElement, k++) for (const ps of [null, '::before', '::after']) { const s = getComputedStyle(e, ps); if (ps && s.content === 'none') continue;
          let w = 0; if (!ps && re.test(s.borderTopColor) && parseFloat(s.borderTopWidth) > 0) w += parseFloat(s.borderTopWidth);
          const ins = s.boxShadow.match(/(?:rgb\(216, 242, 74\)|color\(srgb 0\.847059 0\.94902 0\.290196\)) 0px 0px 0px ([\d.]+)px inset/); if (ins) w += +ins[1];
          if (s.outlineStyle !== 'none' && re.test(s.outlineColor)) w = Math.max(w, parseFloat(s.outlineWidth));
          if (/0\.16\) 0px 0px 0px 5px/.test(s.boxShadow) && re.test(s.boxShadow)) halo = true;
          if (w > 0) layers.push(`${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 2).join('.')}${ps || ''} ${w}px`); }
        return { f: f.id || (f.placeholder || '').slice(0, 22) || f.className.slice(0, 16), layers, halo }; }, STAGED.source);
      rows.push({ label, ...r }); await h.evaluate((e) => e.blur()); } };
  for (const [id, st] of [['c-manifest', null], ['c-compare', 'Two weapons'], ['c-export', 'Picker'], ['c-broadcast', 'Saved'], ['c-history', null], ['c-new-build', 'Add build'], ['c-new-build', 'Bulk · empty']]) { if (st) await W.setState(p, id, st); await measure(`#${id}`, `${id}/${st || '-'}`); }
  // the drawers: opened, then only their own fields are clicked
  const drawers = [['Post drawer', async () => { await W.setState(p, 'c-broadcast', 'Posting'); }], ['manifest Edit drawer', async () => { const e = await p.$('#c-manifest .wg-edit, #c-manifest .wg-r'); await e.click(); }],
    ['Broadcast row drawer', async () => { await W.setState(p, 'c-broadcast', 'Saved'); const td = await p.$('#c-broadcast table.mtable tbody tr td'); await td.click(); }]];
  for (const [label, open] of drawers) { await p.keyboard.press('Escape').catch(() => {}); await W.sleep(300); await open(); await W.sleep(900); if (await p.$('aside.drawer.open')) await measure('aside.drawer.open', label); else rows.push({ label, f: '(drawer did not open)', layers: [], halo: false }); }
  let bad = 0; for (const r of rows) { const ok = r.layers.length === 1 && /\b2px$/.test(r.layers[0]) && r.halo; if (!ok) bad++; console.log(`${ok ? 'ok ' : 'BAD'} ${r.label.padEnd(22)} ${String(r.f).padEnd(24)} ${r.layers.join(' + ') || 'NO RING'}${r.halo ? '' : ' · no halo'}`); }
  console.log(`\n${rows.length} fields · ${bad} off (want: one layer, 2px, the 5px halo)`); console.log('errs', JSON.stringify(errs.filter((e) => !/cloudinary|404/.test(e)))); await b.close(); })();
