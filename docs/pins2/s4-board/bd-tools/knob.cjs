// Board 4: Builder-2 · knob.cjs — one knob, one effect (Session 4, builder R1, 2026-10-03 23:53 EDT). For each relationship: raise its owning
// property by a delta with an injected style (never a file edit), and report what moved. Pass = every element that moved is one the relationship
// names (its "expect" selectors, or inside them), or is pushed rigidly downstream by exactly the change (normal flow after a box that grew).
// Anything else that moved, resized, or moved by another amount is the coupling the rebuild exists to remove.
// Usage: node bd-tools/knob.cjs --file local/pins2/s4/rebuild/knobs/C1.json [--kit local/pins2/s4/builder-2] [--size 1480x834] [--label name]
// knobs.json: [{ "name": "chip to chip", "gate": "C1", "view": "rest" | "<n>" (the walk step index), "owner": "<selector>", "nth": 0,
//               "prop": "column-gap", "delta": 4, "expect": ["<selector>", ...] }]
//               "span": { "x": 7, "y": 0 } — optional: how many gaps the property spans on each axis. Computed for gap, padding and margin
//               properties; REQUIRED for a custom property (--x), which the tool cannot trace (without it the bound is 0 and any growth fails)
// --plant "<css>" adds a style before measuring (the falsifier: a margin that moves two things).
const path = require('path'); const fs = require('fs');
const L = require('./fidlib.cjs'); const { ROOT } = L;
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { const k = v[i]; if (!k.startsWith('--')) continue; const n = v[i + 1]; if (n === undefined || n.startsWith('--')) o[k.slice(2)] = true; else { o[k.slice(2)] = n; i++; } } return o; })();
const KIT = A.kit || 'local/pins2/s4/builder-2'; const [W, H] = (A.size || '1480x834').split('x').map(Number); const LABEL = A.label || 'knob';
const KNOBS = JSON.parse(fs.readFileSync(path.resolve(A.file), 'utf8'));
// results go to knobs/results/: writing them beside the input files once overwrote an input whose name matched the label (2026-10-04 00:12 EDT)
const OUT = path.join(ROOT, 'local/pins2/s4/rebuild/knobs/results'); fs.mkdirSync(OUT, { recursive: true });

const RECTS = (id) => { const s = document.getElementById(id); const m = new Map(); let n = 0; const sx = scrollX, sy = scrollY;
  for (const e of s.querySelectorAll('*')) { const r = e.getBoundingClientRect(); if (!r.width && !r.height) continue; if (!e.dataset.bdK) e.dataset.bdK = 'k' + ++n; m.set(e.dataset.bdK, [r.left + sx, r.top + sy, r.width, r.height]); }
  // the inner scrollers' own offsets are folded out, so a scroller's content is measured where it is laid out, not where it was scrolled to
  return [...m.entries()]; };
async function measure(K, id) { await L.settle(K.p); return new Map(await K.p.evaluate(RECTS, id)); }

(async () => {
  const { server, base } = await L.serve(); const b = await L.launch(W, H); const results = [];
  try {
    const K = await L.openKit(b, base, KIT, W, H);
    for (const k of KNOBS) {
      const G = L.GATES.find((g) => g[0] === k.gate); const id = G[1];
      await K.load(); if (A.plant) await K.p.addStyleTag({ content: A.plant });
      if (k.view && k.view !== 'rest') { const acts = await L.actions(K.p, id); for (let s = 0; s <= +k.view - 1 && s < acts.length; s++) await L.act(K, id, acts[s][0], acts[s][1]); }
      await L.scrollTo(K, id);
      const own = await K.p.evaluate((id, sel, nth, prop) => { const e = document.getElementById(id).querySelectorAll(sel)[nth || 0]; if (!e) return null; e.setAttribute('data-bd-knob', '1'); return getComputedStyle(e).getPropertyValue(prop); }, id, k.owner, k.nth || 0, k.prop);
      if (own == null) { results.push({ ...k, ok: false, why: 'owner not found' }); continue; }
      // V1's M2 review #1 (2026-10-04 16:57 EDT): a holder's growth, and so every push it causes, is bounded by n × the delta, where n is the number of gaps
      // the owner's property spans on that axis. Before this, `grew` accepted any amount, so a 20px plant on the knob's row passed with 1,039 elements "pushed"
      const span = k.span || await K.p.evaluate((prop) => { const o = document.querySelector('[data-bd-knob]'); const kids = [...o.children].filter((c) => { const cs = getComputedStyle(c); const r = c.getBoundingClientRect(); return cs.position !== 'absolute' && cs.position !== 'fixed' && (r.width || r.height); });
        // a line is the children whose vertical extents overlap (a centred label and a taller chip set have different tops but share a line)
        const rs = kids.map((c) => c.getBoundingClientRect()).sort((p, q) => p.top - q.top); const lines = []; for (const r of rs) { const L = lines[lines.length - 1]; if (L && r.top < L.bottom - 0.5) { L.n++; L.bottom = Math.max(L.bottom, r.bottom); } else lines.push({ n: 1, bottom: r.bottom }); }
        const colGaps = Math.max(0, ...lines.map((l) => l.n - 1)), rowGaps = Math.max(0, lines.length - 1);
        if (/^(column-gap|grid-column-gap)$/.test(prop)) return { x: colGaps, y: 0 }; if (/^(row-gap|grid-row-gap)$/.test(prop)) return { x: 0, y: rowGaps }; if (prop === 'gap') return { x: colGaps, y: rowGaps };
        if (/^(padding|margin)-(left|right|inline-start|inline-end)$/.test(prop) || /^(width|min-width|max-width)$/.test(prop)) return { x: 1, y: 0 };
        if (/^(padding|margin)-(top|bottom|block-start|block-end)$/.test(prop) || /^(height|min-height|max-height)$/.test(prop)) return { x: 0, y: 1 };
        if (/^(padding|margin)-inline$/.test(prop)) return { x: 2, y: 0 }; if (/^(padding|margin)-block$/.test(prop)) return { x: 0, y: 2 }; if (/^(padding|margin)$/.test(prop)) return { x: 2, y: 2 };
        return { x: 0, y: 0 }; }, k.prop);
      const before = await measure(K, id);
      const v = own.trim(); const raised = /^-?[\d.]+px$/.test(v) ? `${parseFloat(v) + (k.delta ?? 4)}px` : v === 'normal' || v === '' ? `${k.delta ?? 4}px` : `calc(${v} + ${k.delta ?? 4}px)`;
      const st = await K.p.addStyleTag({ content: `[data-bd-knob]{${k.prop}:${raised}!important}` });
      const after = await measure(K, id);
      const info = await K.p.evaluate((id, expect) => { const s = document.getElementById(id); const inExp = new Set(); for (const sel of expect) for (const e of s.querySelectorAll(sel)) { inExp.add(e.dataset.bdK); for (const d of e.querySelectorAll('*')) inExp.add(d.dataset.bdK); }
        const desc = {}; for (const e of s.querySelectorAll('[data-bd-k]')) desc[e.dataset.bdK] = e.tagName.toLowerCase() + (e.classList.length ? '.' + [...e.classList].slice(0, 3).join('.') : '') + ((e.innerText || '').trim() ? ` "${e.innerText.trim().replace(/\s+/g, ' ').slice(0, 24)}"` : '');
        return { inExp: [...inExp], desc }; }, id, k.expect || []);
      const inside = new Set(await K.p.evaluate(() => [...document.querySelectorAll('[data-bd-knob] *')].map((e) => e.dataset.bdK).filter(Boolean)));
      const holders = new Set(await K.p.evaluate((id) => { const o = document.querySelector('[data-bd-knob]'); const out = []; for (let x = o; x && x.id !== id; x = x.parentElement) if (x.dataset.bdK) out.push(x.dataset.bdK); return out; }, id));
      await st.evaluate((e) => e.remove()); await K.p.evaluate(() => { const e = document.querySelector('[data-bd-knob]'); if (e) e.removeAttribute('data-bd-knob'); });
      const exp = new Set(info.inExp); const moved = []; const D = k.delta ?? 4;
      for (const [key, r0] of before) { const r1 = after.get(key); if (!r1) { moved.push({ key, gone: true }); continue; } const d = r1.map((x, i) => +(x - r0[i]).toFixed(2)); if (d.some((x) => Math.abs(x) > 0.01)) moved.push({ key, d }); }
      // the elements that hold an expected one (its row, its box) may grow by the change: they are the relationship's own boxes, not a coupling
      const expected = moved.filter((m) => exp.has(m.key));
      const rest = moved.filter((m) => !exp.has(m.key));
      // pushed downstream = OUTSIDE the owner box, moved rigidly by exactly the change. An element inside the owner that moved and is not named is
      // never 'pushed': it is the coupling (measured 2026-10-04 00:12 EDT: the reference kit's first chip moved 4px with the chip gap and was waved through)
      const pushed = rest.filter((m) => !inside.has(m.key) && m.d && m.d[2] === 0 && m.d[3] === 0 && ((Math.abs(m.d[0]) === 0 && Math.abs(Math.abs(m.d[1]) - D) < 0.02) || (Math.abs(m.d[1]) === 0 && Math.abs(Math.abs(m.d[0]) - D) < 0.02)));
      // a box that holds the owner (or is it) and only changed size, never position, is the relationship's own box growing: the set got wider
      // ...and so is a box that holds an element the relationship names (the chip set when the chips spread)
      const holdsExp = new Set(await K.p.evaluate((id, keys, exp) => { const s = document.getElementById(id); return keys.filter((k) => { const e = s.querySelector(`[data-bd-k="${k}"]`); return e && [...e.querySelectorAll('[data-bd-k]')].some((d) => exp.includes(d.dataset.bdK)); }); }, id, rest.map((m) => m.key), [...exp]));
      const lim = [span.x * D, span.y * D]; const within = (m) => Math.abs(m.d[2]) <= lim[0] + 0.02 && Math.abs(m.d[3]) <= lim[1] + 0.02;
      const grew = rest.filter((m) => m.d && (m.d[2] || m.d[3]) && !m.d[0] && !m.d[1] && (holders.has(m.key) || holdsExp.has(m.key)) && within(m) && after.get(m.key));   // only a box that holds the owner or a named element: any other box that grows by the delta is a coupling (V1 #1, 2026-10-04 01:48 EDT)
      // a centred holder re-centres: it grows by g and moves by -g/2 on that axis (the empty editor's overlay); and what sits after a grown set in
      // flow is pushed by the set's growth, not by the delta (the tag after C4's slot cells moved 16 when four gaps grew 4) — both measured 2026-10-04 02:36 EDT
      const isHold = (m) => holders.has(m.key) || holdsExp.has(m.key);
      // ...bounded the same way, and only for a holder whose every measured descendant is a named element (V1 M2 #1: a whole toolbar row that
      // widened 4 and shifted 2 passed as 'centred', because it held the owner)
      const onlyNamed = new Set(await K.p.evaluate((id, keys, exp) => { const s = document.getElementById(id); return keys.filter((k) => { const e = s.querySelector(`[data-bd-k="${k}"]`); const ds = e ? [...e.querySelectorAll('[data-bd-k]')] : []; return ds.length > 0 && ds.every((d) => exp.includes(d.dataset.bdK)); }); }, id, rest.map((m) => m.key), [...exp]));
      const recentred = rest.filter((m) => m.d && isHold(m) && onlyNamed.has(m.key) && within(m) && !grew.includes(m) && [[0, 2], [1, 3]].every(([pi, si]) => Math.abs(m.d[pi] + m.d[si] / 2) < 0.02));
      const growths = new Set([D, ...grew.flatMap((m) => [Math.abs(m.d[2]), Math.abs(m.d[3])]).filter((g) => g > 0.01).map((g) => +g.toFixed(2))]);
      const pushed2 = rest.filter((m) => !inside.has(m.key) && !pushed.includes(m) && m.d && m.d[2] === 0 && m.d[3] === 0 && ((m.d[0] === 0 && growths.has(+Math.abs(m.d[1]).toFixed(2))) || (m.d[1] === 0 && growths.has(+Math.abs(m.d[0]).toFixed(2)))));
      pushed.push(...pushed2); grew.push(...recentred);
      const other = rest.filter((m) => !pushed.includes(m) && !grew.includes(m));
      const show = (ms) => ms.slice(0, 12).map((m) => `${info.desc[m.key] || m.key} ${m.gone ? 'gone' : 'Δ' + m.d.join(',')}`);
      const r = { name: k.name, gate: k.gate, view: k.view || 'rest', owner: k.owner, prop: k.prop, span, from: v, to: raised, expectedMoved: expected.length, pushedDownstream: pushed.length, holdersGrew: grew.length, other: other.length, otherList: show(other), grewList: show(grew), expectedList: show(expected), ok: expected.length > 0 && other.length === 0 };
      results.push(r); console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${k.gate} ${r.name}: ${k.prop} ${v} → ${raised} · expected moved ${r.expectedMoved} · pushed ${r.pushedDownstream} · holders grew ${r.holdersGrew} · other ${r.other}${r.other ? '\n       ' + r.otherList.join('\n       ') : ''}${!r.expectedMoved ? '\n       (nothing it names moved: the knob does not own this relationship)' : ''}`);
    }
  } finally { await b.close(); server.close(); }
  fs.writeFileSync(path.join(OUT, `${LABEL}.json`), JSON.stringify(results, null, 1)); console.log(`report ${path.relative(ROOT, path.join(OUT, LABEL + '.json'))}`); process.exit(results.every((r) => r.ok) ? 0 : 1);
})().catch((e) => { console.error('knob failed:', e && e.stack || e); process.exit(2); });
