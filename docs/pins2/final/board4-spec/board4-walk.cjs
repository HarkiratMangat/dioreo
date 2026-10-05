// Shared by the Board 4 generators (structure.cjs, a11y.cjs, relations.cjs, and extract-spec.cjs's pop-up pass): one way to open the
// board, find each gate's stage, drive its state switch and Try buttons, and open the pop-ups a resting walk never sees.
// Written 2026-09-29 19:13 EDT, when the handoff still listed four things the spec "does not have yet" and all four needed the same walk.
const KITC = require('./kit.cjs'); // which board: Collective's kit, or Final after a bake (kit.cjs)
const path = require('path'); const fs = require('fs'); const os = require('os');
const puppeteer = require(path.resolve(__dirname, '../../../../node_modules/puppeteer-core'));
const URL_ = KITC.URL;
const GATES = [['C1', 'c-manifest', 'The Armory manifest'], ['C2', 'c-new-build', 'New build'], ['C3', 'c-compare', 'Compare'], ['C4', 'c-repairs', 'Repairs'],
  ['C5', 'c-export', 'Export'], ['C6', 'c-queue', 'The delivery queue'], ['C7', 'c-broadcast', 'The Broadcast manifest, and posting'], ['C8', 'c-history', 'History'],
  ['C9', 'c-admin', 'Admin traffic']];
// The stage is the section's first sibling after its head that is not the notes, the Try row or the fork row (extract-spec.cjs, 2026-09-27 02:54 EDT).
const STAGE = (id) => `#${id} .pb-head ~ :not(.pb-new):not(.b4-try):not(.b4-forks)`;
// A pop-up is fixed to the window from its trigger and is closed at rest, so no resting walk reaches it (HANDOFF.md, "What this spec does not have yet").
const POPS = [
  { g: 'C7', id: 'c-broadcast', state: 'Posting', trigger: '#c-broadcast .pb-dbtn', label: 'the date picker, from Starts' },
  { g: 'C6', id: 'c-queue', trigger: '#c-queue .pb-end.g-chipbtn', label: "a card's End chip" },
  { g: 'C6', id: 'c-queue', trigger: '#c-queue .b3-endbtn', label: 'Set end date' },
  { g: 'C6', id: 'c-queue', trigger: '#c-queue .pb-pill.g-chipbtn', label: 'the showings chip' },
  { g: 'C2', id: 'c-new-build', state: 'Add build', trigger: '#c-new-build .f-fld input', label: 'the weapon list' },
  { g: 'C3', id: 'c-compare', state: 'Two weapons', trigger: '#c-compare .cx-pick input', label: 'the search list' },
  // A drawer opened by clicking a row is not a state either (2026-09-29 19:32 EDT): History's event drawer carried a defect no walk had seen.
  { g: 'C8', id: 'c-history', trigger: '#c-history .b3-hi-r', label: "an event's drawer", sel: '#c-history aside.drawer.open', drawer: true },
  { g: 'C7', id: 'c-broadcast', state: 'Saved', trigger: '#c-broadcast table.mtable tbody tr td', label: 'a row\'s Edit drawer', sel: '#c-broadcast aside.drawer.open', drawer: true },
];
const POP_SEL = '.b4-pop, .b3-datepop, .f-menu';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function open() {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
    userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'b4-walk-')), args: ['--no-first-run'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.setViewport({ width: 1282, height: 888 });
  await p.goto(URL_, { waitUntil: 'networkidle0' });
  await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 });
  await p.evaluate(() => document.fonts.ready); await sleep(900);
  return { b, p, errs };
}
const actions = (p, id) => p.evaluate((id) => { const g = document.getElementById(id);
  return [...[...g.querySelectorAll('.pb-ctl button')].map((b, i) => ['state', i, b.textContent.trim()]), ...[...g.querySelectorAll('.b4-try button')].map((b, i) => ['try', i, b.textContent.trim()])]; }, id);
async function act(p, id, kind, i) {
  await p.evaluate((id, kind, i) => { const g = document.getElementById(id); const b = kind === 'state' ? g.querySelectorAll('.pb-ctl button')[i] : g.querySelectorAll('.b4-try button')[i]; if (b) b.click(); }, id, kind, i);
  await sleep(1400);
}
async function setState(p, id, label) {
  if (!label) return true;
  const ok = await p.evaluate((id, label) => { const b = [...document.getElementById(id).querySelectorAll('.pb-ctl button')].find((x) => x.textContent.trim() === label); if (b) b.click(); return !!b; }, id, label);
  await sleep(1400); return ok;
}
// A real pointer click (the pop-up family opens on pointer events a synthetic .click() does not send).
async function clickReal(p, sel) {
  const h = await p.$(sel); if (!h) return false;
  await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await sleep(300);
  await h.click(); await sleep(800); return true;
}
async function openPop(p, pop) {
  await setState(p, pop.id, pop.state);
  // A Try step before it may have filtered the trigger away (History's "Only the probes" leaves no event row): reload once and retry.
  if (!(await clickReal(p, pop.trigger))) {
    await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await sleep(900);
    await setState(p, pop.id, pop.state);
    if (!(await clickReal(p, pop.trigger))) return { ok: false, why: 'no trigger, even after a reload' };
  }
  const has = await p.evaluate((s) => [...document.querySelectorAll(s)].some((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0), pop.sel || POP_SEL);
  return { ok: has, why: has ? '' : 'trigger clicked, nothing opened' };
}
async function closePop(p) { await p.keyboard.press('Escape'); await sleep(400); await p.mouse.click(4, 4); await sleep(300); }
module.exports = { URL_, GATES, STAGE, POPS, POP_SEL, sleep, open, actions, act, setState, clickReal, openPop, closePop };
