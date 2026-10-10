// Session 4 · the completeness half of the Standard board's fidelity sweep. For each role (a set of selectors in Board 4: Collective), every
// element that plays it, grouped by its measured look, with a crop of one example per look. A fork on the board is complete only when each
// look here is one of its answers (or identical to one), and correct only when each answer is one of these looks.
// Spec: { role: { sel, props: [computed props], kids: true|false, after: true|false, hover: selector-or-null } }
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/kit-roles.cjs <spec.json> <outdir> [role ...]
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const [specF, out, ...only] = process.argv.slice(2); const SPEC = JSON.parse(fs.readFileSync(specF, 'utf8'));
(async () => {
  const { b, p } = await W.open(); await W.sleep(900); fs.mkdirSync(out, { recursive: true });
  const report = {};
  for (const [role, r] of Object.entries(SPEC)) {
    if (only.length && !only.includes(role)) continue;
    const els = await p.evaluate((r) => {
      const pick = (cs, list) => list.map((k) => k + '=' + cs[k]).join(';');
      const pred = r.pred ? new Function('e', 'cs', r.pred) : null;
      const all = [...document.querySelectorAll(r.sel || '[id^=c-] *')].filter((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 1 && b.height > 1 && cs.visibility !== 'hidden' && (!pred || pred(e, cs)); });
      return all.map((e, i) => {
        e.setAttribute('data-kr', String(i));
        const cs = getComputedStyle(e); let sig = pick(cs, r.props);
        if (r.after) { const a = getComputedStyle(e, '::after'); sig += ';after=' + (a.content !== 'none' && a.content !== 'normal' ? `${a.height}/${a.backgroundColor}/${a.borderTopWidth}` : 'none'); }
        if (r.kids) sig += ';kids=' + [...e.children].map((k) => { const kc = getComputedStyle(k); return `${k.tagName.toLowerCase()}.${(k.className && typeof k.className === 'string' ? k.className.trim().split(/\s+/)[0] : '')}[${pick(kc, r.kidProps || ['fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderRadius', 'height'])}]`; }).join(',');
        const own = (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50);
        const gate = (e.closest('[id^="c-"]') || {}).id || '-';
        return { i, gate, cls: `${e.tagName.toLowerCase()}.${typeof e.className === 'string' ? e.className.trim().split(/\s+/).join('.') : ''}`, text: own, sig };
      });
    }, r);
    const groups = new Map(); for (const e of els) { const g = groups.get(e.sig) || []; g.push(e); groups.set(e.sig, g); }
    const list = [...groups.entries()].map(([sig, g], n) => ({ n: n + 1, count: g.length, sig, examples: g.slice(0, 6).map((e) => `${e.gate} ${e.cls} "${e.text}"`), first: g[0].i }));
    for (const g of list) {
      await p.evaluate((i) => document.querySelector(`[data-kr="${i}"]`).scrollIntoView({ block: 'center' }), g.first);
      if (r.hover) { await p.hover(`[data-kr="${g.first}"]${r.hover === true ? '' : ' ' + r.hover}`).catch(() => {}); await W.sleep(450); }
      const box = await p.evaluate((i) => { const e = document.querySelector(`[data-kr="${i}"]`); const q = e.getBoundingClientRect(); return { x: q.x + scrollX, y: q.y + scrollY, w: q.width, h: q.height }; }, g.first);
      const pad = 10; g.file = path.join(out, `${role}-${g.n}.png`);
      await p.screenshot({ path: g.file, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(1300, box.w + pad * 2), height: Math.min(700, box.h + pad * 2) } });
      if (r.hover) await p.mouse.move(2, 2);
    }
    report[role] = list;
    console.log(`\n== ${role} · ${els.length} element(s), ${list.length} look(s)`);
    for (const g of list) { console.log(`  look ${g.n} ×${g.count}  ${g.sig.slice(0, 700)}`); for (const x of g.examples) console.log(`      ${x}`); }
  }
  fs.writeFileSync(path.join(out, 'kit-roles.json'), JSON.stringify(report, null, 1));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
