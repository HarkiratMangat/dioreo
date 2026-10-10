// Board 4: Builder-2 · beforeafter.cjs — the 2x before/after crop a report leads with (Session 4, builder R1, 2026-10-04 00:32 EDT).
// Opens the reference and the candidate (fidlib: frozen clock, settled), scrolls one element of the gate into view on both, and writes
// [reference | candidate | difference] of that element's neighbourhood at DPR 2. The difference panel is the candidate dimmed, with every
// changed pixel in red, so an all-dark third panel is the visible proof of 0 changed pixels.
// Usage: node bd-tools/beforeafter.cjs --ref <dir> --cand <dir> --gate C1 --sel "<selector>" [--size 1480x834] [--pad 16] [--step <walk index>] --out <png>
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const { PNG } = require(path.join(ROOT, 'node_modules/pngjs'));
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const [W, H] = (A.size || '1480x834').split('x').map(Number); const PAD = +(A.pad || 16);
(async () => {
  const { server, base } = await L.serve(); const bs = await Promise.all([L.launch(W, H), L.launch(W, H)]);
  try {
    const id = L.GATES.find((g) => g[0] === A.gate)[1];
    const Ks = await Promise.all([L.openKit(bs[0], base, A.ref, W, H), L.openKit(bs[1], base, A.cand, W, H)]);
    if (A.step) { const acts = await L.actions(Ks[0].p, id); for (let s = 0; s < +A.step; s++) await Promise.all(Ks.map((K) => L.act(K, id, acts[s][0], acts[s][1]))); }
    // the selection drawer mounts a moment after the gate scrolls into view (A1, 2026-10-04 20:21 EDT): wait for the element, then settle
    const shots = await Promise.all(Ks.map(async (K) => { await L.scrollTo(K, id); await K.p.waitForSelector(A.sel, { timeout: 8000 }).catch(() => null); await L.settle(K.p);
      const r = await K.p.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }, A.sel);
      await L.settle(K.p); await K.p.mouse.move(1, 1); await L.settle(K.p); return { r, img: PNG.sync.read(Buffer.from(await K.p.screenshot())) }; }));
    const r = shots[0].r; const x0 = Math.max(0, Math.floor((r.x - PAD) * 2)), y0 = Math.max(0, Math.floor((r.y - PAD) * 2));
    const cw = Math.min(shots[0].img.width - x0, Math.ceil((r.w + 2 * PAD) * 2)), ch = Math.min(shots[0].img.height - y0, Math.ceil((r.h + 2 * PAD) * 2)); const gap = 8;
    const o = new PNG({ width: cw * 3 + gap * 2, height: ch }); o.data.fill(40); let changed = 0;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const si = ((y0 + y) * shots[0].img.width + x0 + x) * 4; const a = shots[0].img.data, b = shots[1].img.data;
      for (const [k, src] of [[0, a], [1, b]]) { const di = (y * o.width + k * (cw + gap) + x) * 4; src.copy(o.data, di, si, si + 4); }
      const diff = a[si] !== b[si] || a[si + 1] !== b[si + 1] || a[si + 2] !== b[si + 2]; if (diff) changed++; const di = (y * o.width + 2 * (cw + gap) + x) * 4;
      if (diff) { o.data[di] = 255; o.data[di + 1] = 40; o.data[di + 2] = 40; } else for (let c = 0; c < 3; c++) o.data[di + c] = Math.round(b[si + c] * 0.35); o.data[di + 3] = 255; }
    const out = path.resolve(A.out); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, PNG.sync.write(o));
    console.log(`${A.gate} ${A.sel} at ${W}x${H}: ${changed} changed pixels in the crop · ${path.relative(ROOT, out)}`);
  } finally { await Promise.all(bs.map((b) => b.close())); server.close(); }
  process.exit(0);
})().catch((e) => { console.error('beforeafter failed:', e && e.stack || e); process.exit(2); });
