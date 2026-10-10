// Board 4: Builder-2 · audit.cjs — the dimensions a pixel diff at rest cannot see (Session 4, R1, 2026-10-04 11:58 EDT, after Harkirat asked what
// covers tints, animations, dead-space scrolling and hit areas). Per gate, per walk view, on both kits in lockstep:
//   rules     every style rule of every sheet (CSSOM, so exact), its selector stripped of state and pseudo-element parts, matched inside the
//             gate: a rule that matches different elements in the candidate (a tint keyed on >, :has(), :nth-child, + that a re-parented child
//             no longer meets) is listed, in every view, whether or not it paints anything there
//   motion    every element's transition (property, duration, timing, delay) and animation (name, duration, delay, iterations), compared by
//             element identity
//   hits      elementFromPoint over a 6px grid of the window with the gate at the top: which element a hover, click or wheel reaches at each point
// Element identity is tag + classes + own text + its index among elements of that identity in the gate, so a new wrapper box does not
// re-key its descendants. The new wrapper classes R1 added are named in WRAPPERS: a rule or hit that differs ONLY by reaching one of them is
// reported apart, as expected, never dropped.
// Usage: node bd-tools/audit.cjs [--ref <dir>] [--cand <dir>] [--gates C1,...] [--size 1480x834] [--label name]
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const REF = A.ref || 'local/pins2/s4/ref-kit', CAND = A.cand || 'local/pins2/s4/builder-2'; const [W, H] = (A.size || '1480x834').split('x').map(Number);
const GSEL = A.gates ? A.gates.split(',') : L.GATES.map((g) => g[0]); const LABEL = A.label || 'audit';
const WRAPPERS = ['mt-chips', 'bk-say', 'b3-fh-cells', 'b3-tk-oks', 'b3-fgc'];   // new boxes R1 added
const ADDED = ['bk-acts'];   // classes R1 added to an EXISTING element: left out of its identity, so the element keeps its key (the first run re-keyed every plain div after it)
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/audit'); fs.mkdirSync(OUT, { recursive: true });

const PROBE = (id, WRAPPERS, ADDED) => {
  const s = document.getElementById(id); const cs = getComputedStyle;
  const isWrap = (e) => e && e.classList && WRAPPERS.some((c) => e.classList.contains(c));
  const own = (e) => e.tagName.toLowerCase() + [...e.classList].filter((c) => !c.startsWith('bd-') && !ADDED.includes(c)).sort().map((c) => '.' + c).join('') + '|' + [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('').replace(/\s+/g, ' ').trim().slice(0, 24);
  const all = [...s.querySelectorAll('*')]; const seen = new Map(); const key = new Map();
  for (const e of all) { const o = own(e); const n = seen.get(o) || 0; seen.set(o, n + 1); key.set(e, o + '#' + n); }
  // rules: strip state and pseudo-element parts so the structural part is tested in every state
  const sels = new Set(); const walk = (rules) => { for (const r of rules) { if (r.selectorText) sels.add(r.selectorText); if (r.cssRules) walk(r.cssRules); } };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (x) {} }
  const strip = (q) => q.replace(/::?(before|after|placeholder|marker|selection|backdrop|first-line|first-letter|-webkit-[\w-]+|-moz-[\w-]+)(\([^)]*\))?/g, '').replace(/:(hover|focus-visible|focus-within|focus|active|visited|checked|disabled|enabled|placeholder-shown|target|indeterminate)/g, '').replace(/\(\s*\)/g, '()');
  const rules = {};
  for (const q of sels) { let list; try { list = s.querySelectorAll(strip(q) || '*'); } catch (x) { continue; } if (!list.length) continue; rules[q] = [...list].map((e) => key.get(e) || (e === s ? 'SECTION' : '?')).filter((k) => k !== '?').sort(); }
  // motion
  const motion = {}; for (const e of all) { const c = cs(e); const t = `${c.transitionProperty} ${c.transitionDuration} ${c.transitionTimingFunction} ${c.transitionDelay}`; const a = `${c.animationName} ${c.animationDuration} ${c.animationDelay} ${c.animationIterationCount}`;
    const pa = ['::before', '::after'].map((pe) => { const p = cs(e, pe); return p.content === 'none' ? '' : `${pe} ${p.transitionProperty} ${p.transitionDuration} ${p.animationName} ${p.animationDuration} ${p.animationDelay}`; }).join(' ');
    if (t !== 'all 0s ease 0s' || a !== 'none 0s 0s 1' || pa.trim()) motion[key.get(e)] = `${t} | ${a} | ${pa}`; }
  // hits (the gate's top in the window)
  const hits = []; for (let y = 3; y < innerHeight; y += 6) for (let x = 3; x < innerWidth; x += 6) { let e = document.elementFromPoint(x, y); const w = isWrap(e); if (w) e = e.parentElement; hits.push(e ? (s.contains(e) ? key.get(e) || 'SECTION' : 'outside:' + own(e)) : 'none'); }
  return { rules, motion, hits, wrapKeys: all.filter(isWrap).map((e) => key.get(e)) };
};

(async () => {
  const { server, base } = await L.serve(); const bs = await Promise.all([L.launch(W, H), L.launch(W, H)]); const report = { ref: REF, cand: CAND, size: `${W}x${H}`, gates: {} };
  try {
    const Ks = await Promise.all([L.openKit(bs[0], base, REF, W, H), L.openKit(bs[1], base, CAND, W, H)]);
    for (const G of L.GATES.filter((g) => GSEL.includes(g[0]))) {
      const [gid, id] = G; await Promise.all(Ks.map((K) => K.load())); const acts = await L.actions(Ks[0].p, id); const views = [];
      for (let v = 0; v <= acts.length; v++) {
        if (v) await Promise.all(Ks.map((K) => L.act(K, id, acts[v - 1][0], acts[v - 1][1])));
        await Promise.all(Ks.map((K) => L.scrollTo(K, id)));
        const [a, b] = await Promise.all(Ks.map((K) => K.p.evaluate(PROBE, id, WRAPPERS, ADDED)));
        const wrap = new Set(b.wrapKeys); const ruleDiff = []; const ruleWrapOnly = [];
        for (const q of new Set([...Object.keys(a.rules), ...Object.keys(b.rules)])) { const x = a.rules[q] || [], y = (b.rules[q] || []); if (x.join() === y.join()) continue;
          const yNoWrap = y.filter((k) => !wrap.has(k)); if (x.join() === yNoWrap.join()) ruleWrapOnly.push(q); else ruleDiff.push({ sel: q, ref: x.length, cand: y.length, onlyRef: x.filter((k) => !y.includes(k)).slice(0, 4), onlyCand: yNoWrap.filter((k) => !x.includes(k)).slice(0, 4) }); }
        const motDiff = []; for (const k of new Set([...Object.keys(a.motion), ...Object.keys(b.motion)])) { if (wrap.has(k)) continue; if ((a.motion[k] || '') !== (b.motion[k] || '')) motDiff.push({ el: k, ref: a.motion[k] || '-', cand: b.motion[k] || '-' }); }
        let hitDiff = 0; const hitEx = []; for (let i = 0; i < a.hits.length; i++) if (a.hits[i] !== b.hits[i]) { hitDiff++; if (hitEx.length < 6) hitEx.push(`${a.hits[i]} → ${b.hits[i]}`); }
        views.push({ view: v ? `${v}-${acts[v - 1][2]}` : 'rest', rules: Object.keys(a.rules).length, ruleDiff, ruleWrapOnly, motDiff, hitPoints: a.hits.length, hitDiff, hitEx });
        console.log(`${gid} ${views.at(-1).view}: rules ${views.at(-1).rules} · differ ${ruleDiff.length} (+${ruleWrapOnly.length} only through a new box) · motion differ ${motDiff.length} · hits differ ${hitDiff}/${a.hits.length}`);
      }
      report.gates[gid] = views;
    }
  } finally { await Promise.all(bs.map((b) => b.close())); server.close(); }
  fs.writeFileSync(path.join(OUT, `${LABEL}.json`), JSON.stringify(report, null, 1)); console.log(`report ${path.relative(ROOT, path.join(OUT, LABEL + '.json'))}`); process.exit(0);
})().catch((e) => { console.error('audit failed:', e && e.stack || e); process.exit(2); });
