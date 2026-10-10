// Board 4: Builder-2 · ink.cjs — is each text's ink on its row's middle? (Session 4, Adjuster A1, 2026-10-04 19:12 EDT). The class A detector for
// "ink off its row's middle by ≥0.25px, in a row whose items are centred" (prompts/A1.md § What counts as a correction).
// For every element with its own text in a centred row, at DPR 4: the element's own text is set to capitals ("H" per character, so the ink is
// the capital height and nothing else: no descender, no x-height), its column of the row is captured, and the middle of the ink's extent (rows
// over half the darkest coverage) is compared with the middle of the row's content box. The text is put back after. The method is the Session 4
// lead's ink-probe (work/lead/ink-probe.cjs), which reproduced the kit's own recorded pre-nudge numbers exactly.
//   centred row   the element is a flex or grid container with align-items center (its own text is the item), or its parent is one, or it has
//                 align-self center. The row's content box is that container's box less border and padding.
// Usage: node bd-tools/ink.cjs [--kit <dir>] [--gates C1] [--size 1282x888] [--views] [--sel "<css>"] [--label name]   (BD_DPR is forced to 4)
const path = require('path'); const fs = require('fs');
// the device-pixel ratio is the screen's: text snaps to device pixels, so a position is real only at the DPR it is seen at (Harkirat's is 2).
// BD_INK_DPR=4 reads the same layout at twice the resolution (the lead's probes used 4).
process.env.BD_DPR = process.env.BD_INK_DPR || '2'; const DPR = +process.env.BD_DPR;
const L = require('./fidlib.cjs'); const { ROOT } = L;
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const KIT = A.kit || 'local/pins2/s4/builder-2'; const [W, H] = (A.size || '1282x888').split('x').map(Number);
const GSEL = A.gates ? A.gates.split(',') : ['C1']; const LABEL = A.label || 'ink';
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/ink'); fs.mkdirSync(OUT, { recursive: true });

const FIND = (id, only) => {
  const s = document.getElementById(id); const cs = getComputedStyle; const px = (v) => parseFloat(v) || 0; const out = [];
  for (const x of document.querySelectorAll('[data-bd-i]')) delete x.dataset.bdI;
  const centred = (c) => /flex|grid/.test(c.display) && (c.alignItems === 'center' || c.placeItems === 'center' || /^center/.test(c.placeItems || ''));
  const sel = (e) => { const p = []; for (let x = e; x && x !== s && p.length < 4; x = x.parentElement) p.unshift(x.tagName.toLowerCase() + (x.classList.length ? '.' + [...x.classList].slice(0, 3).join('.') : '')); return p.join(' > '); };
  let n = 0;
  for (const e of (only ? s.querySelectorAll(only) : s.querySelectorAll('*'))) {
    const t = [...e.childNodes].filter((x) => x.nodeType === 3 && x.nodeValue.trim()); if (!t.length) continue;
    const c = cs(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) continue; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    let row = null; if (centred(c)) row = e; else if (e.parentElement && centred(cs(e.parentElement))) row = e.parentElement; else if (c.alignSelf === 'center') row = e.parentElement; if (!row) continue;
    const rc = cs(row), rr = row.getBoundingClientRect(); const top = rr.top + px(rc.borderTopWidth) + px(rc.paddingTop), bot = rr.bottom - px(rc.borderBottomWidth) - px(rc.paddingBottom);
    if (bot - top < 4) continue;
    // a grid of several rows (Repairs' Code / Build labels stacked beside their cells) has no one middle for a word: its words sit on their own tracks
    if (/grid/.test(rc.display) && rc.gridTemplateRows.split(' ').filter((x) => /px$/.test(x)).length > 1) continue;
    // one line only: a wrapped text has no single middle
    const lh = c.lineHeight === 'normal' ? px(c.fontSize) * 1.3 : px(c.lineHeight); if (r.height > lh * 1.6 + px(c.paddingTop) + px(c.paddingBottom) + 2) continue;
    e.dataset.bdI = 'i' + ++n;
    out.push({ mark: e.dataset.bdI, sel: sel(e), text: t.map((x) => x.nodeValue).join('').trim().slice(0, 30), row: row === e ? '(itself)' : sel(row), mid: (top + bot) / 2, rowTop: top, rowBot: bot, ff: c.fontFamily.split(',')[0].replace(/"/g, ''), fs: c.fontSize, lh: c.lineHeight, trim: c.textBoxTrim || 'none', x: r.left, w: r.width });
  }
  return out;
};
const PREP = (mark) => { const e = document.querySelector(`[data-bd-i="${mark}"]`); if (!e) return null; e.__bdT = []; e.__bdC = e.getAttribute('style'); e.style.setProperty('color', '#ff00ff', 'important'); e.style.setProperty('-webkit-text-fill-color', '#ff00ff', 'important'); e.style.setProperty('text-shadow', 'none', 'important'); e.style.setProperty('opacity', '1', 'important');
  // only the element's own words: a child's text inherits the magenta and was read as this element's ink ("PP19 BIZON" + "Build 1", 2026-10-04 19:57 EDT)
  e.__bdK = []; for (const k of e.querySelectorAll('*')) { e.__bdK.push([k, k.getAttribute('style')]); k.style.setProperty('color', 'transparent', 'important'); k.style.setProperty('-webkit-text-fill-color', 'transparent', 'important'); } for (const x of e.childNodes) if (x.nodeType === 3 && x.nodeValue.trim()) { e.__bdT.push([x, x.nodeValue]); x.nodeValue = x.nodeValue.replace(/\S/g, 'H'); }
  e.scrollIntoView({ block: 'center', inline: 'nearest' });
  // centring scrolls to a fraction; a person's scroll lands on whole pixels, so every scroller and the window are put back on one, and what is
  // left is the layout's own position (2026-10-04 19:29 EDT: every row read .891 off a pixel until this)
  for (let x = e.parentElement; x; x = x.parentElement) if (x.scrollTop % 1 || x.scrollLeft % 1) { x.scrollTop = Math.round(x.scrollTop); x.scrollLeft = Math.round(x.scrollLeft); }
  window.scrollTo(Math.round(scrollX), Math.round(scrollY)); return new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => { const r = e.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    // a text scrolled out of its rail or covered by another layer is not on screen: no middle to judge
    res({ x: r.left, w: r.width, sx: scrollX, sy: scrollY, seen: !!hit && (e.contains(hit) || hit.contains(e)) }); }))); };
const UNDO = (mark) => { const e = document.querySelector(`[data-bd-i="${mark}"]`); if (e && e.__bdT) for (const [x, v] of e.__bdT) x.nodeValue = v; if (e) { if (e.__bdC === null) e.removeAttribute('style'); else e.setAttribute('style', e.__bdC); for (const [k, v] of e.__bdK || []) { if (v === null) k.removeAttribute('style'); else k.setAttribute('style', v); } } };
const ROWBOX = (mark) => { const e = document.querySelector(`[data-bd-i="${mark}"]`); const cs = getComputedStyle; const px = (v) => parseFloat(v) || 0; const c = cs(e);
  const centred = (c) => /flex|grid/.test(c.display) && (c.alignItems === 'center' || /^center/.test(c.placeItems || ''));
  const paints = (c) => c.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor) || c.boxShadow !== 'none' || ['Top', 'Bottom'].some((k) => px(c['border' + k + 'Width']) > 0 && c['border' + k + 'Style'] !== 'none');
  let row = centred(c) && paints(c) ? e : e; if (row === e && !(centred(c) && paints(c))) { row = e.parentElement; while (row.parentElement && centred(cs(row.parentElement)) && !(centred(cs(row)) && paints(cs(row)))) row = row.parentElement; } const rc = cs(row), rr = row.getBoundingClientRect(); return { top: rr.top + px(rc.borderTopWidth) + px(rc.paddingTop), bot: rr.bottom - px(rc.borderBottomWidth) - px(rc.paddingBottom) }; };

(async () => {
  const { server, base } = await L.serve(); const b = await L.launch(W, H); const report = { kit: KIT, size: `${W}x${H}`, dpr: DPR, at: new Date().toISOString(), gates: {} };
  const { PNG } = require(path.join(ROOT, 'node_modules/pngjs'));
  try {
    const K = await L.openKit(b, base, KIT, W, H, A.plant ? { css: A.plant } : {});
    for (const gid of GSEL) {
      const id = L.GATES.find((g) => g[0] === gid)[1]; const rows = [];
      const scan = async (view) => {
        await L.scrollTo(K, id); const items = await K.p.evaluate(FIND, id, A.sel || null);
        for (const it of items) {
          const g = await K.p.evaluate(PREP, it.mark); if (!g) continue; await L.settle(K.p);
          const rb = await K.p.evaluate(ROWBOX, it.mark); const y0 = Math.floor(rb.top) , y1 = Math.ceil(rb.bot);
          if (!g.seen || g.w < 1 || y1 - y0 < 2 || rb.top < 0 || rb.bot > H) { await K.p.evaluate(UNDO, it.mark); continue; }
          const png = PNG.sync.read(Buffer.from(await K.p.screenshot({ clip: { x: Math.max(0, g.x) + g.sx, y: y0 + g.sy, width: Math.min(g.w, W - Math.max(0, g.x)), height: y1 - y0 } })));
          await K.p.evaluate(UNDO, it.mark);
          if (process.env.BD_INK_DUMP) { fs.mkdirSync(process.env.BD_INK_DUMP, { recursive: true }); fs.writeFileSync(path.join(process.env.BD_INK_DUMP, `${gid}-${it.mark}-${it.text.replace(/\W+/g, '_')}.png`), PNG.sync.write(png)); }
          const d = png.data, Wd = png.width, Hd = png.height;
          // per pixel, as the lead's probe: a row is ink when any of its pixels is over half the strongest contrast (a row SUM counted only the
          // capitals' crossbar, since the stems are thin: 2026-10-04 19:12 EDT)
          const v = new Float64Array(Wd * Hd); let mx = 0; for (let j = 0; j < Wd * Hd; j++) { const k = j * 4; v[j] = Math.max(0, Math.min(d[k], d[k + 2]) - d[k + 1]); if (v[j] > mx) mx = v[j]; }   // magenta strength
          let top = -1, bot = -1; for (let y = 0; y < Hd; y++) { let on = false; for (let x = 0; x < Wd; x++) if (v[y * Wd + x] > mx * 0.5) { on = true; break; } if (on) { if (top < 0) top = y; bot = y; } }
          if (top < 0) continue;
          // sub-row edges: the partly covered row just outside each edge moves the edge by its coverage (2026-10-04 19:41 EDT: whole device rows
          // quantised every reading to 0.25px, so a true −0.20 read −0.25 and failed a 0.25px threshold it passes)
          const rmax = (y) => { if (y < 0 || y >= Hd) return 0; let m = 0; for (let x = 0; x < Wd; x++) m = Math.max(m, v[y * Wd + x]); return Math.min(1, m / mx); };
          const tEdge = top - Math.min(1, rmax(top - 1) / 0.5) * 0.5 + (1 - Math.min(1, rmax(top) / 1)) * 0.5, bEdge = bot + 1 + Math.min(1, rmax(bot + 1) / 0.5) * 0.5 - (1 - Math.min(1, rmax(bot) / 1)) * 0.5;
          const inkMid = y0 + (tEdge + bEdge) / 2 / DPR; const off = +(inkMid - (rb.top + rb.bot) / 2).toFixed(2);
          rows.push({ view, sel: it.sel, text: it.text, row: it.row, ff: it.ff, fs: it.fs, lh: it.lh, trim: it.trim, rowH: +(rb.bot - rb.top).toFixed(2), rowTop: +rb.top.toFixed(3), capH: +((bEdge - tEdge) / DPR).toFixed(2), off, miss: Math.abs(off) >= 0.25 });
        }
      };
      await scan('rest');
      if (A.views) { const acts = await L.actions(K.p, id); for (const [n, [kind, i, label]] of acts.entries()) { await L.act(K, id, kind, i); await scan(`${n + 1}-${kind}-${label}`); } }
      report.gates[gid] = rows; const miss = rows.filter((r) => r.miss);
      console.log(`${gid}: ${rows.length} texts in centred rows · ${miss.length} off by ≥0.25px`);
      const seen = new Set(); for (const r of miss) { const k = r.sel + r.off; if (seen.has(k)) continue; seen.add(k); console.log(`  ${String(r.off).padStart(6)}  ${r.sel.slice(-60)} "${r.text}" ${r.ff} ${r.fs}/${r.lh} trim:${r.trim} row ${r.rowH}px at ${r.rowTop} [${r.view}]`); }
    }
  } finally { await b.close(); server.close(); }
  fs.writeFileSync(path.join(OUT, `${LABEL}.json`), JSON.stringify(report, null, 1)); console.log(`report ${path.relative(ROOT, path.join(OUT, LABEL + '.json'))}`); process.exit(0);
})().catch((e) => { console.error('ink failed:', e && e.stack || e); process.exit(2); });
