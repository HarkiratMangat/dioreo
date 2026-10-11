// Board 4: Builder-2 · states.cjs — hover, keyboard focus and press on EVERY instance (up to --max, first and last first) of each named component,
// in EVERY view of its gate where it renders, on both kits in lockstep, compared over the WHOLE window (Session 4, R1, 2026-10-04 11:46 EDT).
// fidelity.cjs samples one element per role with the gate at rest; Harkirat asked what covers "opened/clicked/hover" for the elements the
// rebuild changed, and the honest answer was: nothing beyond that one element. A whole-window capture also catches what a hover opens away
// from the element (the problem pop-up, a tooltip, the "Pick all" word).
// Usage: node bd-tools/states.cjs --file targets.json [--ref <dir>] [--cand <dir>] [--sizes 1480x834,1282x888] [--max 2] [--label name]
// targets.json: { "C1": ["<selector>", ...], "C2": [...] }   selectors must match in both kits
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const { PNG } = require(path.join(ROOT, 'node_modules/pngjs'));
const pixelmatch = require(path.join(ROOT, 'node_modules/pixelmatch'));
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const REF = A.ref || 'local/pins2/s4/ref-kit', CAND = A.cand || 'local/pins2/s4/builder-2'; const MAX = +(A.max || 2);
const SIZES = (A.sizes || '1480x834,1282x888').split(',').map((s) => s.split('x').map(Number)); const LABEL = A.label || 'states';
const T = JSON.parse(fs.readFileSync(path.resolve(A.file), 'utf8'));
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/states', LABEL); fs.mkdirSync(OUT, { recursive: true });
const decode = (b) => PNG.sync.read(Buffer.isBuffer(b) ? b : Buffer.from(b));
function diff(a, b, name) { const x = decode(a), y = decode(b); if (x.width !== y.width || x.height !== y.height) return x.width * x.height;
  const o = new PNG({ width: x.width, height: x.height }); const n = pixelmatch(x.data, y.data, o.data, x.width, x.height, { threshold: 0, includeAA: true, diffMask: true });
  if (n) { const w = x.width, h = x.height, out = new PNG({ width: w * 3, height: h }); for (let r = 0; r < h; r++) { x.data.copy(out.data, r * w * 12, r * w * 4, (r + 1) * w * 4); y.data.copy(out.data, r * w * 12 + w * 4, r * w * 4, (r + 1) * w * 4); o.data.copy(out.data, r * w * 12 + w * 8, r * w * 4, (r + 1) * w * 4); }
    fs.writeFileSync(path.join(OUT, name.replace(/[^\w.-]+/g, '_') + '.png'), PNG.sync.write(out)); }
  return n; }
(async () => {
  const { server, base } = await L.serve(); const rows = []; const t0 = Date.now();
  for (const [W, H] of SIZES) {
    const size = `${W}x${H}`; const bs = await Promise.all([L.launch(W, H), L.launch(W, H)]);
    try {
      const Ks = await Promise.all([L.openKit(bs[0], base, REF, W, H), L.openKit(bs[1], base, CAND, W, H)]);
      for (const [gid, sels] of Object.entries(T)) {
        const id = L.GATES.find((g) => g[0] === gid)[1];
        const replay = async (n) => { await Promise.all(Ks.map((K) => K.load())); const acts = await L.actions(Ks[0].p, id); for (let s = 0; s < n; s++) await Promise.all(Ks.map((K) => L.act(K, id, acts[s][0], acts[s][1]))); };
        await Promise.all(Ks.map((K) => K.load())); const acts = await L.actions(Ks[0].p, id);
        // the views are walked forward, one step at a time, as the walk does; a view is replayed from a fresh load only when a press changed the gate
        for (let v = 0; v <= acts.length; v++) {
          if (v) await Promise.all(Ks.map((K) => L.act(K, id, acts[v - 1][0], acts[v - 1][1]))); const view = v ? `${v}-${acts[v - 1][2]}` : 'rest';
          for (const sel of sels) {
            const counts = await Promise.all(Ks.map((K) => K.p.evaluate((id, sel) => [...document.getElementById(id).querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(e).visibility !== 'hidden'; }).length, id, sel)));
            if (counts[0] !== counts[1]) { rows.push({ size, gid, view, sel, ok: false, why: `instances ref ${counts[0]} cand ${counts[1]}` }); continue; }
            const n = counts[0]; if (!n) continue; const picks = [...new Set([0, n - 1, ...Array.from({ length: Math.max(0, MAX - 2) }, (_, i) => Math.round((i + 1) * (n - 1) / (MAX - 1)))])].slice(0, MAX);
            for (const nth of picks) for (const mode of ['hover', 'focus', 'pressed']) {
              const before = await Ks[0].p.evaluate((id) => document.getElementById(id).innerHTML.length, id);
              const shots = await Promise.all(Ks.map(async (K) => {
                const ok = await K.p.evaluate((id, sel, nth) => { const e = [...document.getElementById(id).querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(e).visibility !== 'hidden'; })[nth]; if (!e) return false; document.querySelectorAll('[data-bd-st]').forEach((x) => x.removeAttribute('data-bd-st')); e.setAttribute('data-bd-st', '1'); e.scrollIntoView({ block: 'center', inline: 'start' }); return true; }, id, sel, nth);
                if (!ok) return null; await K.p.mouse.move(1, 1); await L.settle(K.p);
                const r = await K.p.evaluate(() => { const b = document.querySelector('[data-bd-st]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
                if (mode === 'hover') { await K.p.mouse.move(r.x, r.y); await L.sleep(800); }
                if (mode === 'focus') { await K.p.keyboard.press('Shift'); await K.p.evaluate(() => { const e = document.querySelector('[data-bd-st]'); const f = e.matches('a,button,input,select,textarea,[tabindex]') ? e : e.querySelector('a,button,input,select,textarea,[tabindex]'); if (f) f.focus(); }); await L.sleep(300); }
                if (mode === 'pressed') { await K.p.mouse.move(r.x, r.y); await K.p.mouse.down(); await L.sleep(250); }
                await L.settle(K.p); const png = await K.p.screenshot();
                if (mode === 'pressed') { await K.p.mouse.move(1, 1); await K.p.mouse.up(); }
                await K.p.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur()); await K.p.mouse.move(1, 1); return png; }));
              const key = `${size} ${gid} ${view} ${sel} #${nth} ${mode}`;
              if (!shots[0] || !shots[1]) { rows.push({ size, gid, view, sel, nth, mode, ok: false, why: 'element missing' }); continue; }
              const d = diff(shots[0], shots[1], key); rows.push({ size, gid, view, sel, nth, mode, changed: d });
              // a line every 25 samples (2026-10-04 14:48 EDT): a two-hour sweep that printed nothing until its end could not answer "how far along is it?"
              if (rows.length % 25 === 0) console.log(`  … ${rows.length} samples · ${gid} ${view} · ${Math.round((Date.now() - t0) / 1000)}s`);
              const after = await Ks[0].p.evaluate((id) => document.getElementById(id).innerHTML.length, id);
              if (after !== before) await replay(v);   // a press opened or changed something: start the view again
            }
          }
        }
      }
    } finally { await Promise.all(bs.map((b) => b.close())); }
  }
  server.close(); fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(rows, null, 1));
  const bad = rows.filter((r) => r.changed || r.ok === false);
  console.log(`states ${LABEL}: ${REF} vs ${CAND} · ${rows.length} samples · ${bad.length} differ · ${Math.round((Date.now() - t0) / 1000)}s`);
  const by = {}; for (const r of rows) { const k = `${r.size} ${r.gid}`; by[k] = by[k] || [0, 0]; by[k][0]++; if (r.changed || r.ok === false) by[k][1]++; } for (const [k, [n, b]] of Object.entries(by)) console.log(`  ${k}: ${n} samples, ${b} differ`);
  for (const r of bad.slice(0, 40)) console.log(`  DIFF ${r.size} ${r.gid} ${r.view} ${r.sel} #${r.nth} ${r.mode}: ${r.changed ?? r.why}`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error('states failed:', e && e.stack || e); process.exit(2); });
