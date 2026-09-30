// Board 4's RELATIONS: his numbered rulings, measured on the running board and printed pass or fail. Board 3-E had measure.cjs (13
// relations, board 3's selectors); Board 4 had none, so a port could match every declaration in C1–C9 and still miss a ruling that is a
// relation between elements (a gap, a column, a pop-up's distance from its trigger). Written 2026-09-29 19:14 EDT. Session 5 reruns it
// against Board 4: Final, then reads the same numbers off the portal.
// Usage (the kit served on :8900): node relations.cjs  → writes relations.md beside it; exits 1 when a relation fails.
const fs = require('fs'); const path = require('path');
const { POPS, POP_SEL, sleep, open, setState, openPop, closePop } = require('./board4-walk.cjs');
const R = (g, state, what, source, expect, fn, tol = 0.5) => ({ g, state, what, source, expect, fn, tol });
const box = (s) => `(() => { const e = document.querySelector(${JSON.stringify(s)}); return e ? e.getBoundingClientRect() : null; })()`;
const REL = [
  R('C3', 'Two weapons', 'the row-name column', 'Version 41 Y', 96, `(${box('#c-compare col.cx-c0')} || {}).width`),
  R('C3', 'Two weapons', 'the gutter column between weapons', 'Version 41 AG', 4, `(${box('#c-compare col.cx-gc')} || {}).width`),
  R('C3', 'Two weapons', 'a body row (two lines)', 'Version 40 I', 64, `(() => { const r = [...document.querySelectorAll('#c-compare .cx-t tbody tr')].find((x) => !x.querySelector('.cx-code')); return r && r.getBoundingClientRect().height; })()`),
  R('C3', 'Two weapons', 'build heads within a weapon, apart', 'Version 41 AG', 6, `(() => { const h = [...document.querySelectorAll('#c-compare .cx-t thead th.cx-h')].map((x) => x.getBoundingClientRect()); const g = h.slice(1).map((x, i) => Math.round(x.left - h[i].right)); return g.length ? Math.min(...g) : null; })()`),
  R('C3', 'Two weapons', 'build heads between weapons, apart', 'Version 41 AG', 16, `(() => { const h = [...document.querySelectorAll('#c-compare .cx-t thead th.cx-h')].map((x) => x.getBoundingClientRect()); const g = h.slice(1).map((x, i) => Math.round(x.left - h[i].right)); return g.length ? Math.max(...g) : null; })()`),
  R('C3', 'Two weapons', 'the table scrolls sideways (px of overflow)', 'Version 40 G', 0, `(() => { const t = document.querySelector('#c-compare .cx-t'); if (!t) return null; let e = t.parentElement; while (e && getComputedStyle(e).overflowX === 'visible') e = e.parentElement; return e ? Math.max(0, e.scrollWidth - e.clientWidth) : 0; })()`),
  R('C3', 'Two weapons', 'narrowest weapon tile (≥ 120)', 'Version 40 N', '≥120', `(() => { const w = [...document.querySelectorAll('#c-compare .cx-w')].map((x) => x.getBoundingClientRect().width); return w.length ? Math.min(...w) : null; })()`),
  R('C3', 'Two weapons', 'widest weapon tile (≤ 260)', 'Version 40 N', '≤260', `(() => { const w = [...document.querySelectorAll('#c-compare .cx-w')].map((x) => x.getBoundingClientRect().width); return w.length ? Math.max(...w) : null; })()`),
  R('C3', 'Two weapons', 'a build chip\'s corner mark', 'Version 40 C', 18, `(() => { const e = document.querySelector('#c-compare .cx-kb'); return e && e.offsetWidth; })()`),
  R('C3', 'Two weapons', 'the search field', 'Version 42 AI (560 → slightly narrower)', 480, `(() => { const e = document.querySelector('#c-compare .cx-pick'); return e && e.getBoundingClientRect().width; })()`, 2),
  R('C3', 'Two weapons', 'the seats chip against the search, height difference', 'Version 42 AP', 0, `(() => { const a = document.querySelector('#c-compare .cx-top .cx-seats'), b = document.querySelector('#c-compare .cx-top .cx-pick .f-fld'); return a && b ? Math.abs(a.getBoundingClientRect().height - b.getBoundingClientRect().height) : null; })()`),
  R('C3', 'Two weapons', 'the top-right buttons against the search, height difference', 'Version 42 AO/AP', 0, `(() => { const b = document.querySelector('#c-compare .cx-top .cx-pick .f-fld'); const t = [...document.querySelectorAll('#c-compare .cx-tools button')]; return b && t.length ? Math.max(...t.map((x) => Math.abs(x.getBoundingClientRect().height - b.getBoundingClientRect().height))) : null; })()`),
  R('C3', 'Two weapons', "the band's chips against the first build column, x difference", 'Version 42 AN', 0, `(() => { const v = document.querySelector('#c-compare .cx-bv'), h = document.querySelector('#c-compare .cx-t th.cx-h'); return v && h ? Math.abs(v.getBoundingClientRect().left - h.getBoundingClientRect().left) : null; })()`),
  R('C3', 'Two weapons', "a column's last action plate: gap to the right edge minus gap to the foot", 'Version 42 AL', 0, `(() => { const td = document.querySelector('#c-compare td.cx-fa'); const ib = td && [...td.querySelectorAll('.wg-ib')].pop(); if (!ib) return null; const c = td.getBoundingClientRect(), r = ib.getBoundingClientRect(), ins = parseFloat(getComputedStyle(ib, '::before').right) || 0; return Math.abs((c.right - (r.right - ins)) - (c.bottom - (r.bottom - ins))); })()`),
  R('C3', 'Two weapons', "the corner mark's stroke, in px of ink (≥ 1.5)", 'Version 42 AR', '≥1.5', `(() => { const p = document.querySelector('#c-compare .cx-kb .cx-kg path'); if (!p) return null; const svg = p.ownerSVGElement; return parseFloat(getComputedStyle(p).strokeWidth) * parseFloat(getComputedStyle(svg).width) / 16; })()`),
  R('C3', 'Two weapons', 'the verdict chip against the build chip, height difference', 'Version 42 AK', 0, `(() => { const h = document.querySelector('#c-compare .cx-hn'); const g = h && h.querySelector('.b3-sd-gn'), c = h && h.querySelector('.b3-fchip'); return g && c ? Math.abs(g.getBoundingClientRect().height - c.getBoundingClientRect().height) : null; })()`),
  R('C3', 'Two weapons', 'gaps between builds of one weapon that end in a round cap', 'Version 42 AS', '≥1', `[...document.querySelectorAll('#c-compare th.cx-h.cx-hj')].filter((e) => /radial-gradient/.test(getComputedStyle(e, '::after').backgroundImage)).length`),
  R('C3', 'Empty', 'landing tiles (10–16)', 'Version 40 S', '10–16', `document.querySelectorAll('#c-compare .cx-w').length`),
  R('C3', 'Empty', 'landing tile rows (≤ 3)', 'Version 40 S', '≤3', `new Set([...document.querySelectorAll('#c-compare .cx-w')].map((x) => Math.round(x.getBoundingClientRect().top))).size`),
  // V44 (2026-09-29 22:45 EDT, his Version 44 intake)
  R('C3', 'One weapon', 'a slot every build shares that has no table row', 'Version 44 AV', 0, `[...document.querySelectorAll('#c-compare .cx-band .cx-sv')].filter((c) => c.dataset.slot !== 'Category' && ![...document.querySelectorAll('#c-compare .cx-t:not([data-ghost]) tbody th.cx-k0')].some((t) => t.textContent.trim() === c.dataset.slot)).length`),
  R('C3', 'One weapon', 'an unset build name drawn as a box (a frame or a fill)', 'Version 44 AX ("too intrusive")', 0, `[...document.querySelectorAll('#c-compare .cx-pl.unset')].filter((e) => { const c = getComputedStyle(e); return c.outlineStyle !== 'none' || c.boxShadow !== 'none' || c.backgroundImage !== 'none'; }).length`),
  R('C7', 'Posting', 'a count readout whose numeral is the colour of its words', 'Version 44 AZ', 0, `[...document.querySelectorAll('#c-broadcast .b3-cc .b3-nw > b')].filter((b) => getComputedStyle(b).color === getComputedStyle(b.parentElement).color).length + (document.querySelector('#c-broadcast .b3-cc .b3-nw > b') ? 0 : 99)`),
  R('C2', 'Add build', 'the build drawer', 'intake:703 (2026-09-24 22:30)', 980, `(() => { const d = document.querySelector('#c-new-build .drawer'); return d && d.getBoundingClientRect().width; })()`, 1),
  R('C7', 'Posting', "the post drawer's height, min(84vh, 860px)", 'Frame (2026-09-27 16:09 EDT)', Math.round(Math.min(888 * 0.84, 860)), `(() => { const d = document.querySelector('#c-broadcast .drawer'); return d && d.getBoundingClientRect().height; })()`, 1),
];
const POPREL = [
  ['the pop-up\'s distance from its trigger\'s visible box', 'pop-up family (2026-09-28 14:25 EDT)', 10],
];
(async () => {
  const { b, p, errs } = await open();
  const rows = []; let fail = 0;
  const judge = (expect, v, tol) => { if (v == null || Number.isNaN(v)) return false; if (typeof expect === 'number') return Math.abs(v - expect) <= tol;
    if (expect.startsWith('≥')) return v >= parseFloat(expect.slice(1)); if (expect.startsWith('≤')) return v <= parseFloat(expect.slice(1));
    const [a, z] = expect.split('–').map(Number); return v >= a && v <= z; };
  let cur = {};
  for (const r of REL) {
    const id = { C2: 'c-new-build', C3: 'c-compare', C7: 'c-broadcast' }[r.g];
    if (cur[id] !== r.state) { await setState(p, id, r.state); cur[id] = r.state; }
    const v = await p.evaluate(`(${r.fn})`).catch(() => null);
    const ok = judge(r.expect, v, r.tol); if (!ok) fail++;
    rows.push(`| ${r.g} | ${r.state} | ${r.what} | ${r.source} | ${r.expect} | ${v == null ? '**not found**' : Math.round(v * 10) / 10} | ${ok ? '✓' : '✗'} |`);
  }
  // V44 AU (his: "the table is really bugged when you hover over the weapon name"): every hover target of Compare's table, by a REAL mouse hover —
  // a class toggled by hand would have missed it — and no th or td may move, resize or stop being a table cell
  {
    await setState(p, 'c-compare', 'Two weapons'); cur['c-compare'] = 'Two weapons'; await p.mouse.move(2, 2); await sleep(400);
    const boxes = () => p.evaluate(() => { const t = document.querySelector('#c-compare .cx-t:not([data-ghost])').getBoundingClientRect(); return [...document.querySelectorAll('#c-compare .cx-t:not([data-ghost]) :is(th,td)')].map((e) => { const r = e.getBoundingClientRect(); return [r.x - t.x, r.y - t.y, r.width, r.height, getComputedStyle(e).display]; }); });
    const rest = await boxes(); let worst = 0, nonCell = 0, n = 0;
    for (const sel of ['.cx-gr th.cx-g', 'th.cx-h', 'tbody th.cx-k0', 'td.cx-c', '.cx-band .wg-at', '.cx-tiles .cx-k']) {
      const pts = await p.evaluate((sel) => [...document.querySelectorAll(`#c-compare ${sel}`)].slice(0, 4).map((e) => { e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + Math.min(r.height / 2, 14)]; }), sel);
      for (const [x, y] of pts) { n++; await p.mouse.move(x, y); await sleep(220); (await boxes()).forEach((q, i) => { const r0 = rest[i]; if (!r0) return; worst = Math.max(worst, ...[0, 1, 2, 3].map((j) => Math.abs(q[j] - r0[j]))); if (!/table-cell/.test(q[4])) nonCell++; }); await p.mouse.move(2, 2); await sleep(150); }
    }
    const v = Math.round((worst + nonCell) * 10) / 10; const ok = v <= 0.5; if (!ok) fail++;
    rows.push(`| C3 | Two weapons | ${n} real hovers across the table (weapon heads, build heads, slot names, cells, band chips, tile chips): the most a cell moves, plus cells that stop being cells | Version 44 AU | 0 | ${v} | ${ok ? '✓' : '✗'} |`);
  }
  for (const pop of POPS.filter((x) => !x.drawer)) {
    const o = await openPop(p, pop);
    if (!o.ok) { fail++; rows.push(`| ${pop.g} | ${pop.state || 'resting'} | ${pop.label}: opens | pop-up family | opens | **${o.why}** | ✗ |`); await closePop(p); continue; }
    const m = await p.evaluate((trig, sel) => { const t = document.querySelector(trig); const pp = [...document.querySelectorAll(sel)].find((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0);
      if (!t || !pp) return null; let v = t; const tb = v.getBoundingClientRect(); const fld = v.closest('.pb-dfld, .cx-pick, .f-in, .f-fld') || v; const fb = fld.getBoundingClientRect(); const pb = pp.getBoundingClientRect();
      const gap = pb.top >= fb.bottom - 1 ? pb.top - fb.bottom : fb.top - pb.bottom;
      const day = pp.querySelector('[class*="dp-d"]:not([class*="dp-dow"])'); const db = day && day.getBoundingClientRect();
      return { gap, w: pb.width, cls: pp.className, day: db ? [db.width, db.height] : null }; }, pop.trigger.split(',')[0], POP_SEL);
    const ok = m && Math.abs(m.gap - 10) <= 1; if (!ok) fail++;
    rows.push(`| ${pop.g} | ${pop.state || 'resting'} | ${pop.label}: ${POPREL[0][0]} | ${POPREL[0][1]} | 10 | ${m ? Math.round(m.gap * 10) / 10 : '**not measured**'} | ${ok ? '✓' : '✗'} |`);
    if (m && m.day) {
      const w = Math.abs(m.w - 270) <= 1; if (!w) fail++;
      rows.push(`| ${pop.g} | ${pop.state || 'resting'} | the date picker's width | intake:801 | 270 | ${Math.round(m.w)} | ${w ? '✓' : '✗'} |`);
      if (m.day) { const d = Math.abs(m.day[0] - 36) <= 0.5; if (!d) fail++; rows.push(`| ${pop.g} | ${pop.state || 'resting'} | a day's width | intake:801 | 36 | ${Math.round(m.day[0] * 10) / 10} | ${d ? '✓' : '✗'} |`); }
    }
    await closePop(p);
  }
  const head = ['---', 'kind: reference', 'status: live', '---', '', '# Board 4: Collective — relations, measured', '',
    `*Generated ${new Date().toISOString()} by \`relations.cjs\` from the running kit at 1282×888. Each row is one of his rulings that is a RELATION (a size, a gap, a distance, a count), with where he ruled it; the value is read off the page. ${rows.length - fail} of ${rows.length} hold. Page errors: ${errs.length}. Session 5 reruns this against Board 4: Final and reads the same numbers off the portal.*`, '',
    '| Gate | State | Relation | Ruled | Expect | Measured | |', '|---|---|---|---|---|---|---|'];
  fs.writeFileSync(path.join(__dirname, 'relations.md'), head.concat(rows).join('\n') + '\n');
  console.log(JSON.stringify({ out: 'relations.md', rows: rows.length, fail, errs: errs.length }));
  await b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
