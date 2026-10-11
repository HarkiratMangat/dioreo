// Board 4: Builder-2 · chipgap-probe.cjs — the label-less "More filters" group's chip-to-chip gap, on a mounted instance (Session 4, R1,
// 2026-10-04 01:59 EDT). No board view renders the group (Armory passes no extraChips), so the probe mounts one into C1's second toolbar row in
// each kit's OWN markup (ui/manifest.js:198: chips directly in .mt-grp in ref-kit, inside .mt-chips in Builder-2) and reads the distance
// between two chips' boxes. The lead's ruling on V1 #4: it must read 3px again.
// Usage: node bd-tools/chipgap-probe.cjs --kits local/pins2/s4/ref-kit,local/pins2/s4/builder-2 [--size 1480x834]
const L = require('./fidlib.cjs');
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) if (v[i].startsWith('--')) { o[v[i].slice(2)] = v[i + 1]; i++; } return o; })();
const [W, H] = (A.size || '1480x834').split('x').map(Number);
(async () => { const { server, base } = await L.serve();
  for (const kit of A.kits.split(',')) { const b = await L.launch(W, H); const K = await L.openKit(b, base, kit, W, H);
    const wrapped = await K.p.evaluate(() => fetch('ui/manifest.js').then((r) => r.text()).then((t) => /aria-label="More filters"><span class="mt-chips">/.test(t)));
    const r = await K.p.evaluate((wrapped) => { const row = document.querySelector('#c-manifest .mtools .mt-r2'); const g = document.createElement('span'); g.className = 'mt-grp'; g.setAttribute('aria-label', 'More filters');
      const chips = '<button class="chip">One</button><button class="chip">Two</button>'; g.innerHTML = wrapped ? `<span class="mt-chips">${chips}</span>` : chips; row.appendChild(g);
      const [a, c] = g.querySelectorAll('.chip'); const ra = a.getBoundingClientRect(), rc = c.getBoundingClientRect(); return { gap: +(rc.left - ra.right).toFixed(2), grpGap: getComputedStyle(g).columnGap }; }, wrapped);
    console.log(`${kit}: markup ${wrapped ? '.mt-grp > .mt-chips > .chip' : '.mt-grp > .chip'} · chip to chip ${r.gap}px (group column-gap ${r.grpGap})`);
    await b.close(); }
  server.close(); process.exit(0); })().catch((e) => { console.error(e); process.exit(2); });
