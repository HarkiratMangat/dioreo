// The refinement contract for pins-2 design board 2 (plan 2026-09-13-portal-pins-batch-2 §10.4), measured on the board and failing when a rule breaks.
// Every rule here is a correction Harkirat had to make by hand across 21 board versions. They are rules of RELATION — a label's distance to its controls, the spacing inside a run of buttons, the edge a column's controls share — so no single-element check sees them. Session 2 re-measures the same rules on its own portal DOM with chrome-devtools evaluate_script; this file proves the numbers on the board they came from.
// Usage: node measure.cjs [board html]   → prints the measurements; exit 1 when any rule misses its target.
const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../../../node_modules/puppeteer-core'));
const file = path.resolve(process.argv[2] || path.join(__dirname, 'index.html'));
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: path.join(require('os').tmpdir(), 'pins2-board-2-measure-chrome'), args: ['--allow-file-access-from-files'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.setViewport({ width: 1282, height: 888 });
  await p.goto('file://' + file, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.fonts.ready);
  const m = await p.evaluate(() => {
    const R = (e) => e.getBoundingClientRect();
    const box = (e) => { const r = R(e); const k = e.matches('.pb-ib, .pb-fbtn') ? 5 : 0; return { l: r.left + k, r: r.right - k }; };
    const textRight = (e) => { const g = document.createRange(); g.selectNodeContents(e); return g.getBoundingClientRect().right; };
    const txt = (e) => { const g = document.createRange(); g.selectNodeContents(e); return g.getBoundingClientRect(); };
    const uniq = (a) => [...new Set(a.map((x) => Math.round(x)))].sort((x, y) => x - y);
    const vis = (e) => e.offsetParent;
    const o = {};
    o.labelToControl = uniq([...document.querySelectorAll('.pb-tools .pb-lab')].filter(vis).map((l) => box(l.nextElementSibling).l - textRight(l)));
    o.toolbarControlStarts = [...document.querySelectorAll('.pb-tools')].filter(vis).map((t) => uniq([...t.querySelectorAll(':scope > div > .pb-lab + *, :scope > div > .pb-grp:first-child > .pb-lab + *')].map((e) => box(e).l)));
    o.chipGap = uniq([...document.querySelectorAll('.pb-grp')].filter(vis).flatMap((g) => { const c = [...g.children].filter((x) => !x.matches('.pb-lab')); return c.slice(1).map((x, i) => box(x).l - box(c[i]).r); }));
    o.dividerSides = uniq([...document.querySelectorAll('.pb-grp + .pb-grp')].filter(vis).flatMap((g) => [R(g).left - box(g.previousElementSibling.lastElementChild).r, box(g.firstElementChild).l - R(g).left]));
    // Adjacent boxes only: two buttons with the delete divider between them are measured by dividerInRun, not here (the first version of this check counted share→delete across the divider and reported a false 35).
    o.buttonRunGap = uniq([...document.querySelectorAll('.pb-acts, .pb-cacts')].filter(vis).flatMap((g) => { const c = [...g.children]; return c.slice(1).map((x, i) => (x.matches('.pb-ib') && c[i].matches('.pb-ib') ? box(x).l - box(c[i]).r : null)).filter((v) => v != null); }));
    o.dividerInRun = uniq([...document.querySelectorAll('.pb-acts .pb-vr, .pb-cacts .pb-vr')].filter(vis).flatMap((v) => [R(v).left - box(v.previousElementSibling).r, box(v.nextElementSibling).l - R(v).right]));
    o.barEndGaps = uniq([...document.querySelectorAll('.pb-tl')].filter(vis).flatMap((t) => { const [a, bar, z] = t.children; return [R(bar).left - R(a).right, R(z).left - R(bar).right]; }));
    o.manifestRightEdges = ['#g4man', '#g11bc'].map((s) => { const el = document.querySelector(s); return { edge: Math.round(R(el).right - 16), controls: uniq([...el.querySelectorAll('.pb-t1 > :last-child, .pb-gh > .pb-fbtn, .pb-rb .pb-acts > :last-child, .pb-br > .pb-ib:last-child, .pb-heads > .pb-fold')].filter(vis).map((e) => box(e).r)) }; });
    o.cardEdges = [...document.querySelectorAll('.pb-card')].map((c) => ({ left: uniq([...c.querySelectorAll('.pb-body > *')].map((e) => R(e).left)), right: uniq([c.querySelector('.pb-enc'), c.querySelector('.pb-tl'), c.querySelector('.pb-cacts > :last-child')].map((e) => box(e).r)) }));
    const hd = document.querySelector('#g4man .pb-gh'); const row = document.querySelector('#g4man .pb-rb');
    o.fixChipMeetsShare = [Math.round(R(hd.querySelector('.pb-fsum')).right), Math.round(box(row.querySelector('.pb-acts > .pb-ib')).r)];
    o.numberUnderName = uniq([txt(hd.querySelector('.pb-gline b')).left, ...[...document.querySelectorAll('#g4man .pb-ix')].filter(vis).map((e) => txt(e).left), txt(document.querySelector('#g4man .pb-heads .pb-sort')).left]);
    o.rowCentreLines = uniq([...document.querySelectorAll('#g4man .pb-rb')].filter(vis).slice(0, 12).flatMap((r) => { const mids = [...r.children].filter((c) => !c.matches('.pb-main, .pb-sline')).map((c) => (R(c).top + R(c).bottom) / 2); return [Math.max(...mids) - Math.min(...mids)]; }));
    o.headerCentreSpread = uniq([...document.querySelectorAll('#g4man .pb-gh')].filter((h) => h.querySelector('.pb-fsum')).map((h) => { const mids = [h.querySelector('.pb-gline'), h.querySelector('.pb-fsum'), h.querySelector('.pb-fbtn')].map((e) => (R(e).top + R(e).bottom) / 2); return Math.max(...mids) - Math.min(...mids); }));
    // A field holding a code only: the No code field centres its text by design (the first version counted it and reported a false 38).
    o.codeFieldPadding = uniq([...document.querySelectorAll('#g4man button.pb-igw .pb-igf')].map((f) => R(f.firstElementChild).left - R(f).left));
    o.plateToAttachments = uniq([...document.querySelectorAll('.pb-main.pb-named')].map((m) => R(m.querySelector('.pb-rail')).left - R(m.querySelector('.pb-plate')).right));
    o.truncatedNames = [...document.querySelectorAll('#g4man .pb-at > span, .pb-plate > span')].filter((e) => vis(e) && e.scrollWidth > e.clientWidth + 1).length;
    o.boxedControlHeights = uniq([...document.querySelectorAll('#g4man .pb-fsum, #g4man .pb-igw .pb-ig')].filter(vis).map((e) => R(e).height));
    return o;
  });
  const same = (a) => a.length === 1;
  const checks = [
    ['no page errors', errs.length === 0],
    ['every toolbar label sits 12px from its controls', JSON.stringify(m.labelToControl) === '[12]'],
    ['stacked toolbar rows start their controls on one line', m.toolbarControlStarts.every(same)],
    ['chips in a group are 8px apart', JSON.stringify(m.chipGap) === '[8]'],
    ['a group divider has 16px on both sides', JSON.stringify(m.dividerSides) === '[16]'],
    ['adjacent boxed buttons in a run are 22px apart', JSON.stringify(m.buttonRunGap) === '[22]'],
    ['the divider before delete is centred', same(m.dividerInRun)],
    ['a lifespan bar has 12px to each end box', JSON.stringify(m.barEndGaps) === '[12]'],
    ['each manifest\'s right-edge controls share its padding line', m.manifestRightEdges.every((x) => same(x.controls) && x.controls[0] === x.edge)],
    ['each card\'s content shares one left and one right edge', m.cardEdges.every((c) => same(c.left) && same(c.right))],
    ['the Fix chip\'s right edge meets share\'s', m.fixChipMeetsShare[0] === m.fixChipMeetsShare[1]],
    ['build numbers, weapon names and the Weapon head start on one line', same(m.numberUnderName)],
    ['a build row\'s cells share one centre line (≤1px)', Math.max(...m.rowCentreLines) <= 1],
    ['a weapon header\'s name, Fix chip and collapse share one centre line (≤1px)', Math.max(...m.headerCentreSpread) <= 1],
    ['the code field pads its code 12px', JSON.stringify(m.codeFieldPadding) === '[12]'],
    ['the name plate sits 20px from its attachments', JSON.stringify(m.plateToAttachments) === '[20]'],
    ['no attachment or build name is truncated', m.truncatedNames === 0],
    ['boxed controls are 34px tall', JSON.stringify(m.boxedControlHeights) === '[34]'],
  ];
  console.log(JSON.stringify(m));
  checks.forEach(([n, ok]) => console.log((ok ? 'PASS ' : 'FAIL ') + n));
  await b.close();
  process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
