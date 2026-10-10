// Board 4: Builder-2 · nearmiss.cjs — bd/measure.js nearMisses on every view of a gate (Session 4, Adjuster A1, 2026-10-04 19:23 EDT): the
// class A detectors for stacked left edges within 3px, the label-column starts, items off their row's middle by box, and sibling gaps within
// 2px of each other. Injects the builder's own measure.js, as structure.cjs does.
// Usage: node bd-tools/nearmiss.cjs [--kit <dir>] [--gates C1] [--size 1282x888] [--views] [--label name]
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const KIT = A.kit || 'local/pins2/s4/builder-2'; const [W, H] = (A.size || '1282x888').split('x').map(Number);
const GSEL = A.gates ? A.gates.split(',') : ['C1']; const LABEL = A.label || 'nearmiss';
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/nearmiss'); fs.mkdirSync(OUT, { recursive: true }); const BD = path.join(__dirname, '..', 'bd');
const RUN = (id) => { const M = window.BD.measure; const s = document.getElementById(id); const r = M.nearMisses(s); const sel = (e) => (M.selOf ? M.selOf(e) : e.className);
  const txt = (e) => (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24);
  return { lines: r.lines.map((x) => ({ what: x.what, axis: x.axis, d: x.d, dir: x.dir || '', a: sel(x.a) + ' "' + txt(x.a) + '"', b: x.b ? sel(x.b) + ' "' + txt(x.b) + '"' : x.row ? 'row ' + sel(x.row) : '' })),
    spaces: r.spaces.map((x) => ({ axis: x.axis || '', prop: x.prop || 'gaps', vals: x.gaps || x.vals, el: x.el ? sel(x.el) : x.sel })) }; };
(async () => {
  const { server, base } = await L.serve(); const b = await L.launch(W, H); const report = { kit: KIT, size: `${W}x${H}`, gates: {} };
  try {
    const K = await L.openKit(b, base, KIT, W, H);
    const inject = async () => { for (const f of ['rules.js', 'identity.js', 'roles.js', 'measure.js']) await K.p.addScriptTag({ content: fs.readFileSync(path.join(BD, f), 'utf8') }); };
    for (const gid of GSEL) { const id = L.GATES.find((g) => g[0] === gid)[1]; const views = {};
      await inject(); await L.scrollTo(K, id); views.rest = await K.p.evaluate(RUN, id);
      if (A.views) { const acts = await L.actions(K.p, id); for (const [n, [kind, i, label]] of acts.entries()) { await L.act(K, id, kind, i); await L.scrollTo(K, id); views[`${n + 1}-${kind}-${label}`] = await K.p.evaluate(RUN, id); } }
      report.gates[gid] = views; const seen = new Set();
      for (const [v, r] of Object.entries(views)) for (const x of [...r.lines, ...r.spaces]) { const k = JSON.stringify(x); if (seen.has(k)) continue; seen.add(k); console.log(`${gid} [${v}] ${JSON.stringify(x)}`); }
    }
  } finally { await b.close(); server.close(); }
  fs.writeFileSync(path.join(OUT, `${LABEL}.json`), JSON.stringify(report, null, 1)); process.exit(0);
})().catch((e) => { console.error('nearmiss failed:', e && e.stack || e); process.exit(2); });
