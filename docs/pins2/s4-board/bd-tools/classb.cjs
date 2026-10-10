// Board 4: Builder-2 · classb.cjs — a crop per text kind that ink.cjs still finds off its row's middle after the method (trimmed to its
// capitals, row on a whole pixel), i.e. the size's capital height lands between pixels (Session 4, Adjuster A1, 2026-10-04 23:40 EDT). Each
// crop is the row at DPR 4 with ticks either side: magenta on the row's middle, cyan on the ink's middle, so the gap is visible without a measurement.
// Usage: node bd-tools/classb.cjs --ink <label>[:C6+C7][,<label>…] [--min 0.26] [--out local/pins2/s4/rebuild/crops/A-M2-classB]
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const MIN = +(A.min || 0.26); const OUT = path.join(ROOT, A.out || 'local/pins2/s4/rebuild/crops/A-M2-classB'); fs.mkdirSync(OUT, { recursive: true });
const kinds = new Map();
for (const spec of A.ink.split(',')) { const [lab, only] = spec.split(':'); const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'local/pins2/s4/rebuild/ink', lab + '.json'), 'utf8'));
  for (const [gid, list] of Object.entries(R.gates)) for (const x of list) { if (only && !only.split('+').includes(gid)) continue; if (!x.miss || Math.abs(x.off) < MIN || Math.abs(x.off) >= 2) continue;
    const k = `${gid}|${x.sel.split(' > ').pop()}|${x.ff}|${x.fs}`; const g = kinds.get(k); if (g) g.n++; else kinds.set(k, { gid, ...x, n: 1 }); } }
(async () => {
  process.env.BD_DPR = '4'; const { server, base } = await L.serve(); const b = await L.launch(1282, 888); const rows = [];
  try { const K = await L.openKit(b, base, A.kit || 'local/pins2/s4/builder-2', 1282, 888); let i = 0;
    for (const [k, x] of kinds) { i++; const id = L.GATES.find((g) => g[0] === x.gid)[1]; await K.load(); await L.scrollTo(K, id);
      if (x.view !== 'rest') { const acts = await L.actions(K.p, id); const n = parseInt(x.view, 10); const a = acts[n - 1]; if (a) { await L.act(K, id, a[0], a[1]); await L.scrollTo(K, id); } }
      const box = await K.p.evaluate((id, sel, text, off) => { const tail = sel.split(' > ').slice(-2).join(' > '); let e = null; try { e = [...document.querySelectorAll('#' + id + ' ' + tail)].find((n) => (n.textContent || '').trim().startsWith(text.trim().slice(0, 10))); } catch (z) {} if (!e) return null;
        e.scrollIntoView({ block: 'center' }); let row = e.parentElement; const r0 = e.getBoundingClientRect(); const rr = row.getBoundingClientRect(); const mid = rr.top + rr.height / 2;
        const mk = (y, c) => { for (const x of [rr.left - 7, rr.right + 1]) { const d = document.createElement('div'); d.style.cssText = `position:fixed;left:${x}px;width:6px;top:${y}px;height:.25px;background:${c};z-index:99999;pointer-events:none`; d.className = 'bd-cb'; document.body.appendChild(d); } };   // ticks either side of the row, so the text itself stays clear
        mk(mid, '#ff2bd6'); mk(mid + off, '#22e0ff'); return { x: rr.left - 8 + scrollX, y: rr.top - 8 + scrollY, w: rr.width + 16, h: rr.height + 16 }; }, id, x.sel, x.text, x.off);
      const f = `${String(i).padStart(2, '0')}-${x.gid}-${x.sel.split(' > ').pop().replace(/[^\w.-]/g, '')}-${x.fs}.png`;
      if (box) { await L.settle(K.p); fs.writeFileSync(path.join(OUT, f), await K.p.screenshot({ clip: { x: Math.max(0, box.x), y: box.y, width: Math.min(box.w, 700), height: box.h } })); }
      rows.push({ crop: box ? f : null, gate: x.gid, element: x.sel.split(' > ').slice(-2).join(' > '), text: x.text, font: `${x.ff} ${x.fs}/${x.lh}`, trim: x.trim, row: x.rowH, off: x.off, count: x.n }); }
  } finally { await b.close(); server.close(); }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(rows, null, 1)); for (const r of rows) console.log(`${r.crop || '(not found)'}  ${r.gate} ${r.font} off ${r.off} ×${r.count}  "${r.text}"`); process.exit(0);
})().catch((e) => { console.error('classb failed:', e && e.stack || e); process.exit(2); });
