// The refinement contract for Design Board 3-E (plan 2026-09-13-portal-pins-batch-2 §10.5), measured on the RUNNING board and
// failing when a relation breaks. Board 2's measure.cjs is the model: a per-element value table cannot see two elements
// disagreeing, and every rule below is a relation Harkirat corrected by hand on this board, with the time he did it.
// Session 5 re-measures the same rules on the portal with chrome-devtools evaluate_script; this file proves them on the board
// they came from. Ink, not boxes, wherever the eye reads ink (anchor #30): a glyph's side-bearing is not its box.
// Usage: node measure.cjs [url]   → prints each measurement; exit 1 when any rule misses.
const path = require('path'); const os = require('os'); const fs = require('fs');
const puppeteer = require(path.resolve(__dirname, '../../../../../node_modules/puppeteer-core'));
const URL_ = process.argv[2] || 'http://127.0.0.1:8900/local/pins2-board-3/redo/board3e.html';
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'b3e-measure-')) });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.setViewport({ width: 1282, height: 888 });
  await p.goto(URL_, { waitUntil: 'networkidle0' }); await p.waitForSelector('#g-history .b3-hi-r'); await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 800));
  const m = await p.evaluate(() => {
    const R = (e) => e.getBoundingClientRect(); const r1 = (x) => Math.round(x * 10) / 10;
    const ink = (e) => { const g = document.createRange(); g.selectNodeContents(e); const rs = [...g.getClientRects()].filter((q) => q.width); return rs.length ? { l: Math.min(...rs.map((q) => q.left)), r: Math.max(...rs.map((q) => q.right)) } : { l: R(e).left, r: R(e).right }; };
    const uniq = (a) => [...new Set(a.map(r1))].sort((x, y) => x - y);
    const o = {};
    const hi = document.querySelector('#g-history');
    const labs = [...hi.querySelectorAll('.b3-hi-f .b3-fgl')];
    const cols = {}; labs.forEach((l) => { const k = Math.round(R(l).left); (cols[k] = cols[k] || []).push(ink(l).r); });
    o.h1LabelRightsPerColumn = Object.values(cols).map(uniq);
    o.h1EventsEndsWithColumnOne = [r1(ink(hi.querySelector('.mt-r1 > .mlabel')).r), r1(Math.min(...Object.values(cols)[0]))];
    o.h1SearchStartsWithChips = [r1(R(hi.querySelector('.mt-r1 > .srch')).left), r1(R(hi.querySelector('.b3-hi-f .b3-fg').children[1]).left)];
    o.h1LabelToChips = uniq([...hi.querySelectorAll('.b3-hi-f .b3-fg')].map((g) => R(g.children[1]).left - R(g.children[0]).right));
    const ex = document.querySelector('#g-export');
    const btns = [...ex.querySelectorAll('.exs-i > .b3-btn2')];
    o.exButtonHeights = uniq(btns.map((x) => R(x).height));
    o.exButtonWidths = btns.map((x) => r1(R(x).width));
    o.exButtonInkBalance = btns.map((x) => { const kids = [...x.childNodes].map((n) => n.nodeType === 3 ? (() => { const g = document.createRange(); g.selectNodeContents(n); const q = g.getBoundingClientRect(); return q.width ? { l: q.left, r: q.right } : null; })() : { l: R(n).left, r: R(n).right }).filter(Boolean);
      const L = Math.min(...kids.map((k) => k.l)) - R(x).left, Rr = R(x).right - Math.max(...kids.map((k) => k.r)); return r1(Math.abs(L - Rr)); });
    const rows = [...ex.querySelectorAll('.exs-i')].filter((r) => r.querySelector('.b3-xf-fid'));
    o.exTitleMeetsChip = rows.map((r) => [r1(ink(r.querySelector('.exs-t b')).l), r1(R(r.querySelector('.b3-xf-fn')).left)]);
    o.exSquareColumn = uniq([...ex.querySelectorAll('.exs-i .b3-xf-sq')].map((s) => R(s).left + R(s).width / 2));
    o.exSquareSize = uniq([...ex.querySelectorAll('.exs-i .b3-xf-sq')].flatMap((s) => [R(s).width, R(s).height]));
    o.exChipHeight = uniq([...ex.querySelectorAll('.exs-i .b3-xf-fn')].map((c) => R(c).height));
    o.exFactsOneLine = uniq([...ex.querySelectorAll('.exs-facts > li')].map((li) => R(li).top));
    return o;
  });
  // INK, not boxes: a Lucide glyph sits inside its 14px box with transparent bearing, so child boxes cannot say whether the
  // drawn content is centred — he measured 28 / 33 with rulers while the boxes read even. Photograph each button and find the
  // first and last pixel columns that differ from the button's own fill, inside its 1px ring.
  const J = require(path.resolve(__dirname, '../../../../../node_modules/jimp'));
  const Jimp = J.Jimp || J;
  m.exButtonInk = [];
  for (const h of await p.$$('#g-export .exs-i > .b3-btn2')) {
    await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await new Promise((r) => setTimeout(r, 120));
    const shot = Buffer.from(await h.screenshot()); const img = await (Jimp.fromBuffer ? Jimp.fromBuffer(shot) : Jimp.read(shot));
    const W = img.bitmap.width, H = img.bitmap.height, px = (x, y) => { const i = (y * W + x) * 4; const d = img.bitmap.data; return [d[i], d[i + 1], d[i + 2]]; };
    const fill = px(Math.round(W * 0.06), Math.round(H * 0.25)); const inset = Math.ceil(W * 0.03) + 2;
    const ink = (x) => { for (let y = 3; y < H - 3; y++) { const q = px(x, y); if (Math.abs(q[0] - fill[0]) + Math.abs(q[1] - fill[1]) + Math.abs(q[2] - fill[2]) > 90) return true; } return false; };
    let L = inset; while (L < W - inset && !ink(L)) L++; let Rr = W - 1 - inset; while (Rr > L && !ink(Rr)) Rr--;
    const dpr = W / (await h.evaluate((e) => e.getBoundingClientRect().width));
    m.exButtonInk.push([Math.round(L / dpr * 10) / 10, Math.round((W - 1 - Rr) / dpr * 10) / 10]);
  }
  const same = (a) => a.length === 1; const near = (a, b, t = 0.6) => Math.abs(a - b) <= t;
  const checks = [
    ['no page errors', errs.length === 0, errs.join(' ')],
    ['H1 · every filter label in a column ENDS on one x — right-aligned (his 2026-09-20 21:59 EDT: "the labels should be right aligned")', m.h1LabelRightsPerColumn.every(same), JSON.stringify(m.h1LabelRightsPerColumn)],
    ['H1 · EVENTS ends where the first column\'s labels end (22:04 EDT: "the events label isn\'t aligned with the other labels")', near(...m.h1EventsEndsWithColumnOne), JSON.stringify(m.h1EventsEndsWithColumnOne)],
    ['H1 · the search field starts where the first chips start', near(...m.h1SearchStartsWithChips), JSON.stringify(m.h1SearchStartsWithChips)],
    ['H1 · label → first chip is one distance in every group (--h1-lab, 16px)', same(m.h1LabelToChips) && near(m.h1LabelToChips[0], 16, 1), JSON.stringify(m.h1LabelToChips)],
    ['Export · the three buttons are one height, 34px (23:26 EDT: "increase all 3 … by 1px to the top and 1px downwards")', same(m.exButtonHeights) && m.exButtonHeights[0] === 34, JSON.stringify(m.exButtonHeights)],
    ['Export · Pick is as wide as Download, within half a pixel (23:10 EDT: "so it doesn\'t feel staggered")', Math.max(...m.exButtonWidths) - Math.min(...m.exButtonWidths) <= 0.5, JSON.stringify(m.exButtonWidths)],
    ['Export · each button\'s drawn INK is centred, within 1.5px (23:26 EDT: "28px on left side, 33 px on right side") — measured on the rendered pixels, not the element boxes', m.exButtonInk.every(([l, r]) => Math.abs(l - r) <= 1.5), JSON.stringify(m.exButtonInk)],
    ['Export · each title starts on the same x as its rename chip (22:16 EDT: "left aligned with the MP builds / DMZ builds text")', m.exTitleMeetsChip.every(([a, b]) => near(a, b, 1)), JSON.stringify(m.exTitleMeetsChip)],
    ['Export · the count squares share one centre line', same(m.exSquareColumn), JSON.stringify(m.exSquareColumn)],
    ['Export · the count square is the component\'s 40×40 (22:53 EDT: "the same 40x40 and same 10px corners")', same(m.exSquareSize) && m.exSquareSize[0] === 40, JSON.stringify(m.exSquareSize)],
    ['Export · the rename chip is 24px in every row', same(m.exChipHeight) && m.exChipHeight[0] === 24, JSON.stringify(m.exChipHeight)],
    ['Export · the hint marks sit on one line', same(m.exFactsOneLine), JSON.stringify(m.exFactsOneLine)],
  ];
  let fail = 0; for (const [n, ok, v] of checks) { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}\n      ${v}`); }
  console.log(`\n${checks.length - fail}/${checks.length} relations hold`);
  await b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
