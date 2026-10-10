// Board 4: Builder-2 · remount.cjs — which elements survive each walk step, and which are thrown away and rebuilt (Session 4, R1, 2026-10-04 12:27 EDT).
// A pixel diff cannot see a remount: the new node paints the same. But a remounted element drops its focus, its hover, its scroll offset and any
// running transition, so a new wrapper that changes the element TYPE in a slot (article on one render, section on the next) is a behaviour change.
// Found by the read-only JS review (prescan/js-walks.md, b3/repairs.js): the first pass-heading box did exactly that. Per gate, both kits in lockstep:
// every element in the gate is marked with a JS property (never an attribute, so no selector can see it), the step runs, and each element is
// reported as kept or new; the two kits' kept/new lists are compared by element identity (audit.cjs's key: tag + classes + own text + index).
// R1's new boxes (WRAPPERS) and the class added to an existing element (ADDED) are left out of the identity, as in audit.cjs.
// Usage: node bd-tools/remount.cjs [--ref <dir>] [--cand <dir>] [--gates C1,...] [--size 1480x834] [--label name]
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const REF = A.ref || 'local/pins2/s4/ref-kit', CAND = A.cand || 'local/pins2/s4/builder-2'; const [W, H] = (A.size || '1480x834').split('x').map(Number);
const GSEL = A.gates ? A.gates.split(',') : L.GATES.map((g) => g[0]); const LABEL = A.label || 'remount';
const WRAPPERS = ['mt-chips', 'bk-say', 'b3-fh-cells', 'b3-tk-oks', 'b3-fgc']; const ADDED = ['bk-acts', 'bare'];
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/remount'); fs.mkdirSync(OUT, { recursive: true });
const PROBE = (id, WRAPPERS, ADDED, mark) => {
  const s = document.getElementById(id); const isWrap = (e) => WRAPPERS.some((c) => e.classList.contains(c));
  const own = (e) => e.tagName.toLowerCase() + [...e.classList].filter((c) => !c.startsWith('bd-') && !ADDED.includes(c)).sort().map((c) => '.' + c).join('') + '|' + [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('').replace(/\s+/g, ' ').trim().slice(0, 24);
  const seen = new Map(); const out = {};
  for (const e of s.querySelectorAll('*')) { if (isWrap(e)) { e.__bdKeep = 1; continue; } const o = own(e); const n = seen.get(o) || 0; seen.set(o, n + 1); if (!mark) out[o + '#' + n] = e.__bdKeep ? 'kept' : 'new'; e.__bdKeep = 1; }
  return out; };
(async () => {
  const { server, base } = await L.serve(); const bs = await Promise.all([L.launch(W, H), L.launch(W, H)]); const report = { ref: REF, cand: CAND, size: `${W}x${H}`, gates: {} }; let bad = 0;
  try {
    const Ks = await Promise.all([L.openKit(bs[0], base, REF, W, H), L.openKit(bs[1], base, CAND, W, H)]);
    for (const [gid, id] of L.GATES.filter((g) => GSEL.includes(g[0]))) {
      await Promise.all(Ks.map((K) => K.load())); const acts = await L.actions(Ks[0].p, id); const views = [];
      await Promise.all(Ks.map((K) => K.p.evaluate(PROBE, id, WRAPPERS, ADDED, true)));
      for (let v = 1; v <= acts.length; v++) {
        await Promise.all(Ks.map((K) => L.act(K, id, acts[v - 1][0], acts[v - 1][1])));
        const [a, b] = await Promise.all(Ks.map((K) => K.p.evaluate(PROBE, id, WRAPPERS, ADDED, false)));
        const diff = []; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) diff.push(`${k}: ref ${a[k] || '-'} · cand ${b[k] || '-'}`);
        const kept = Object.values(a).filter((x) => x === 'kept').length; views.push({ view: `${v}-${acts[v - 1][2]}`, elements: Object.keys(a).length, kept, differ: diff.length, diff: diff.slice(0, 12) }); bad += diff.length;
        console.log(`${gid} ${views.at(-1).view}: ${Object.keys(a).length} elements, ${kept} kept · differ ${diff.length}${diff.length ? '\n   ' + diff.slice(0, 6).join('\n   ') : ''}`);
      }
      report.gates[gid] = views;
    }
  } finally { await Promise.all(bs.map((b) => b.close())); server.close(); }
  fs.writeFileSync(path.join(OUT, `${LABEL}.json`), JSON.stringify(report, null, 1)); console.log(`remount ${LABEL}: ${bad} element steps differ · report ${path.relative(ROOT, path.join(OUT, LABEL + '.json'))}`); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error('remount failed:', e && e.stack || e); process.exit(2); });
