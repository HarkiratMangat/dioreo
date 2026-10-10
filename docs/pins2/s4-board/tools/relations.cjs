// The family check (docs/pins2/plan/2026-10-08-s4-spec-board.md, Step 2): every member of a family on the spec page, measured the same way and compared
// with each other (a RELATION fault: one member's fill, outline, hover or icon differs from the rest) and with the rules (a RULE fault: C0–C3, C13 —
// height, corner, inset, icon, centre). Built because v20's fields shipped with both kinds and no check saw either: the search's fill and hover
// differed and its × and count never lit it (relations), every field sat 12 from the edge and the glass 2 px low (rules). Trusted only after it reports
// those faults on v20 (spec-v20.html, served from `git show 2e22d20`). Usage: node relations.cjs [--page spec.html] [--family fields] → exit 1 on a fault
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core')); const { INPAGE } = require('./measure-lib.cjs');
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const PAGE = arg('--page', 'spec.html'); const FAM = arg('--family', 'fields'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// the families and their rules; a new group adds its family here in the same write that draws it
const FAMILIES = {
  fields: { members: [['filter', '#fields .fl-filter .srch'], ['wep', '#fields .fl-wep .f-pick'], ['cat', '#fields .fl-cat .f-pick'], ['att', '#fields .fl-att .f-pick'], ['cmp', '#fields .fl-cmp .cx-pick']],
    expect: { h: 44, radius: '11px', inset: 14, icon: 16, centre: 0, gapFromLead: 10, btnRight: 6, btnIcon: 14, words: '13px' } },
  // the board's buttons (Step 4 group 1): every clone measures as the board does (else its chain lost a rule), every miss on the page has a ledger row,
  // and every family board-dom.cjs read is drawn or excluded with its reason
  buttons: { special: true, sec: 'onboard', group: 'buttons' },
  chips: { special: true, sec: 'chips', group: 'chips', sweep: 'chip-sweep.json' },
  segs: { special: true, sec: 'segs', group: 'segs', sweep: 'seg-sweep.json' },
  inputs: { special: true, sec: 'inputs', group: 'inputs', sweep: 'input-sweep.json' },
  overlays: { special: true, sec: 'overlays', group: 'overlays', sweep: 'overlay-sweep.json' },
  data: { special: true, sec: 'data', group: 'data', sweep: 'data-sweep.json' },
};
(async () => {
  const F = FAMILIES[FAM]; if (!F) { console.error('no family', FAM); process.exit(2); }
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 180000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'rel-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 1500 });
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/' + PAGE, { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady, { timeout: 30000 }); await p.evaluate(() => document.fonts.ready); await sleep(2500);
  if (F.special) {
    const rows = await p.evaluate(async (sec, grp) => { const D = await fetch('spec-img/board-dom.json').then((q) => q.json()).then((j) => j[grp]); const out = [];
      for (const w of document.querySelectorAll(`#${sec} [data-bsel]`)) { const sel = w.dataset.bsel; const v = D[sel]; const btn = window.__rootOf(w); const k = btn && window.__skinRect(btn); const want = v.skin ? { w: v.skin.w, h: v.skin.h, r: parseFloat(v.skin.r) } : { w: v.w, h: v.h, r: parseFloat(v.radius) };
        out.push({ sel, live: k && { w: +k.w.toFixed(1), h: +k.h.toFixed(1), r: k.r }, want, misses: window.__btnMisses[sel] || [], hov: v.hover && v.hover.transform, rst: v.rest && v.rest.transform, tag: btn && btn.tagName }); }
      const O = window.__onboard[grp]; return { out, all: Object.keys(D), ex: O.ex, wide: O.wide, sweepEx: O.sweepEx }; }, F.sec, F.group);
    /* press, under a real mouse: down on the clone, read, then away before up (no click fires); Still (C10) is a 1px drop at 98.5% */
    for (const x of rows.out.filter((q) => q.tag === 'BUTTON')) {   /* only a button presses */ const at = await p.evaluate((sec, sel) => { const b = document.querySelector(`#${sec} [data-bsel="${sel}"] button`); if (!b) return null; b.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; }, F.sec, x.sel);
      if (!at) continue; await p.mouse.move(at.x, at.y); await sleep(250); await p.mouse.down(); await sleep(350); x.press = await p.evaluate((sec, sel) => getComputedStyle(document.querySelector(`#${sec} [data-bsel="${sel}"] button`)).transform, F.sec, x.sel); await p.mouse.move(2, 2); await sleep(120); await p.mouse.up(); await sleep(150); }
    await b.close();
    const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/pins2/s4-board/spec-img/board-changes.json'), 'utf8')).items; const cov = new Set(items.flatMap((x) => x.covers || []));
    const faults = []; const drawn = new Set(rows.out.map((x) => x.sel));
    for (const x of rows.out) { if (!x.live) { faults.push(`CLONE ${x.sel}: no button rendered`); continue; } for (const q of ['w', 'h', 'r']) if (!(q === 'w' && rows.wide[x.sel]) && Math.abs(Math.min(x.live[q], 999) - Math.min(x.want[q], 999)) > 0.6) faults.push(`CLONE ${x.sel}: ${q} ${x.live[q]} here, ${x.want[q]} on the board`);
      /* a miss is covered by its own row, a board-wide value row, or (for what is not a button) a row that holds its whole group for a decision */
      for (const m of x.misses) if (!cov.has(`${x.sel}|${m.prop}`) && !cov.has(`${x.sel}|*`) && !cov.has(`*|${m.prop}=${m.v}`) && !(x.tag !== 'BUTTON' && cov.has('group:' + F.group))) faults.push(`LEDGER ${x.sel}: ${m.prop} ${m.v} ≠ ${m.e} has no ledger row`);
      const pm = /matrix\(([^)]+)\)/.exec(x.press || ''); const pv = pm ? pm[1].split(',').map(Number) : null; const still = pv && Math.abs(pv[0] - 0.985) < 0.002 && Math.abs(pv[5] - 1) < 0.1;
      const mx = (t) => { const q = /matrix\(([^)]+)\)/.exec(t || ''); return q ? q[1].split(',').map(Number) : [1, 0, 0, 1, 0, 0]; }; const h0 = mx(x.rst), h1 = mx(x.hov); const hv = [h1[0] / h0[0], 0, 0, 0, 0, h1[5] - h0[5]]; if ((Math.abs(hv[0] - 1) > 0.002 || Math.abs(hv[5]) > 0.1) && !cov.has(`${x.sel}|hover-move`) && !cov.has(`${x.sel}|*`)) faults.push(`LEDGER ${x.sel}: hover moves it (scale ${hv[0]} · ${hv[5]}px) ≠ Still (colour only) has no ledger row`);   /* the board's hover, read by board-dom.cjs under a real mouse */
      if (x.press !== undefined && !still && !cov.has(`${x.sel}|press`) && !cov.has(`${x.sel}|*`)) faults.push(`LEDGER ${x.sel}: press ${pv ? `scale ${pv[0]} · drop ${pv[5]}` : 'does nothing'} ≠ Still (1px at 98.5%) has no ledger row`); }
    for (const sel of rows.all) if (!drawn.has(sel) && !rows.ex[sel]) faults.push(`COVERAGE ${sel}: neither drawn nor excluded`);
    /* the sweep: every family it found is drawn here (a clone's root matches it), already on the page (a signature with a class), or set aside with a reason */
    if (F.sweep) { const S = JSON.parse(fs.readFileSync(path.join(__dirname, F.sweep), 'utf8')); const left = await (async () => { const b2 = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'rel2-')) }); const q = await b2.newPage(); await q.setViewport({ width: 1282, height: 1500 }); await q.goto('http://127.0.0.1:8900/docs/pins2/s4-board/' + PAGE, { waitUntil: 'networkidle0', timeout: 90000 }); await q.waitForFunction(() => window.__specReady, { timeout: 30000 }); await sleep(2500);
      const out = await q.evaluate((sigs, sec) => { const roots = [...document.querySelectorAll(`#${sec} [data-bsel]`)].map((w) => window.__rootOf(w)).filter(Boolean); return sigs.filter((g) => !roots.some((e) => { try { return e.matches(g.sig); } catch (x) { return false; } })).map((g) => g.sig); }, S.filter((g) => !(g.onPage && g.sig.includes('.'))), F.sec); await b2.close(); return out; })();
      for (const sig of left) if (!rows.sweepEx[sig]) faults.push(`SWEEP ${sig}: found on the board, neither drawn nor set aside`); }
    console.log(`${PAGE} · family ${FAM} · ${drawn.size} clones · ${faults.length} fault(s)`); for (const x of faults) console.log('  ' + x); process.exit(faults.length ? 1 : 0);
  }
  await p.evaluate(INPAGE); const M = {};
  for (const [k, sel] of F.members) {
    await p.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await p.mouse.move(2, 2); await sleep(350);
    const f = await p.evaluate((sel) => window.__field(sel), sel); f.lit = {}; const rest = await p.evaluate((sel) => window.__edgeNow(sel), sel);
    for (const [part, [x, y]] of Object.entries(await p.evaluate((sel) => window.__pts(sel), sel))) { await p.mouse.move(x, y); await sleep(420); const now = await p.evaluate((sel) => window.__edgeNow(sel), sel); f.lit[part] = now !== rest ? now : 'NO CHANGE'; await p.mouse.move(2, 2); await sleep(220); }
    M[k] = f; }
  // labels that collide: any two texts (or a swatch and a text) in one overlay of the section; an anatomy chip that covers its element
  const overlaps = await p.evaluate(() => { const out = []; for (const svg of document.querySelectorAll('#fields svg.ov, #fields svg.anat')) { const ts = [...svg.querySelectorAll('text, rect.sw')].map((t) => ({ t: (t.textContent || 'swatch').trim(), r: t.getBoundingClientRect() })).filter((x) => x.r.width > 0);
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) { const a = ts[i].r, c = ts[j].r; if (Math.min(a.right, c.right) - Math.max(a.left, c.left) > 1 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 1) out.push(`${ts[i].t.slice(0, 26)} / ${ts[j].t.slice(0, 26)}`); }
    if (svg.classList.contains('anat')) { const sr = svg.getBoundingClientRect(); const segsOf = (g) => { const p = (g.querySelector('path') || { getAttribute: () => '' }).getAttribute('d').match(/-?[\d.]+/g) || []; const n = p.map(Number); const out2 = []; for (let i = 0; i + 3 < n.length; i += 2) out2.push([sr.left + n[i], sr.top + n[i + 1], sr.left + n[i + 2], sr.top + n[i + 3]]); return out2; };
      const cs = [...svg.querySelectorAll('.ink-c')].map((g) => ({ name: g.textContent.trim().slice(0, 22), t: g.querySelector('text').getBoundingClientRect(), s: segsOf(g) })); const hit = (s, r) => Math.max(s[0], s[2]) > r.left + 0.5 && Math.min(s[0], s[2]) < r.right - 0.5 && Math.max(s[1], s[3]) > r.top + 0.5 && Math.min(s[1], s[3]) < r.bottom - 0.5;
      const cross = (a, b) => { const ah = Math.abs(a[1] - a[3]) < 0.01, bh = Math.abs(b[1] - b[3]) < 0.01; if (ah === bh) return false; const h = ah ? a : b, v = ah ? b : a; return v[0] > Math.min(h[0], h[2]) + 0.5 && v[0] < Math.max(h[0], h[2]) - 0.5 && h[1] > Math.min(v[1], v[3]) + 0.5 && h[1] < Math.max(v[1], v[3]) - 0.5; };
      for (const a of cs) for (const b of cs) { if (a === b) continue; if (a.s.some((s) => hit(s, b.t))) out.push(`leader of ${a.name} runs through ${b.name}`); if (a.name < b.name && a.s.some((s) => b.s.some((t) => cross(s, t)))) out.push(`leaders of ${a.name} and ${b.name} cross`); } const els = [...svg.parentElement.querySelectorAll('[data-anat] .f-fld, [data-anat] .srch')].map((e) => e.getBoundingClientRect()); for (const x of ts) for (const e of els) if (Math.min(x.r.right, e.right) - Math.max(x.r.left, e.left) > 1 && Math.min(x.r.bottom, e.bottom) - Math.max(x.r.top, e.top) > 1) out.push(`chip on the field: ${x.t.slice(0, 26)}`); } } return out; });
  await b.close();
  const faults = overlaps.map((x) => `RELATION labels overlap: ${x}`);
  // relations: each property, its values across members; a minority value names its members
  const props = { fill: (f) => f.fill, outline: (f) => `${f.edge} ${f.ring}`, corner: (f) => f.radius, height: (f) => f.h, words: (f) => f.words && f.words.size, 'icon box': (f) => f.lead && f.lead.tag === 'svg' ? f.lead.w : null, 'icon drawing': (f) => f.lead && f.lead.tag === 'svg' ? f.lead.drawing : null, 'icon colour': (f) => f.lead && f.lead.tag === 'svg' ? f.lead.drawn : null,   /* his 21:51 EDT: "your icon is literally the wrong color" */   /* his 2026-10-08 21:44 EDT: two 16 px boxes can hold different drawings */ 'hover outline': (f) => Object.values(f.lit).find((v) => v !== 'NO CHANGE') || 'NO CHANGE' };
  for (const [name, get] of Object.entries(props)) { const g = {}; for (const [k, f] of Object.entries(M)) { const v = get(f); if (v == null) continue; (g[v] = g[v] || []).push(k); } const keys = Object.keys(g); if (keys.length > 1) { keys.sort((a, c) => g[c].length - g[a].length); faults.push(`RELATION ${name}: ${keys.map((v) => `${g[v].join('+')} = ${String(v).slice(0, 70)}`).join('  ≠  ')}`); } }
  for (const [k, f] of Object.entries(M)) for (const [part, v] of Object.entries(f.lit)) if (v === 'NO CHANGE') faults.push(`RELATION hover: ${k} does not light from ${part}`);
  // rules
  const E = F.expect; const near = (a, e) => Math.abs(a - e) <= 0.5;
  for (const [k, f] of Object.entries(M)) {
    if (!near(f.h, E.h)) faults.push(`RULE ${k}: height ${f.h} ≠ ${E.h}`);
    if (f.radius !== E.radius) faults.push(`RULE ${k}: corner ${f.radius} ≠ ${E.radius}`);
    if (f.words && f.words.size !== E.words) faults.push(`RULE ${k}: words ${f.words.size} ≠ ${E.words}`);
    const slot = f.lead && f.lead.tag !== 'svg' ? (16 - f.lead.w) / 2 : 0; const inset = f.lead ? f.lead.inset - slot : f.words && f.words.inset;   /* a dot is measured by the 16 slot it sits in */ if (inset != null && !near(inset, E.inset)) faults.push(`RULE ${k}: leading inset ${inset} ≠ ${E.inset}`);
    if (f.lead && f.lead.tag === 'svg' && !near(f.lead.w, E.icon)) faults.push(`RULE ${k}: icon ${f.lead.w} ≠ ${E.icon}`);
    if (f.lead && !near(f.lead.centreOff, E.centre)) faults.push(`RULE ${k}: leading icon centre ${f.lead.centreOff > 0 ? '+' : ''}${f.lead.centreOff}`);
    if (f.lead && f.words && f.words.gapFromLead != null && !near(f.words.gapFromLead - (f.lead.tag !== 'svg' ? (16 - f.lead.w) / 2 : 0), E.gapFromLead)) faults.push(`RULE ${k}: icon → words ${f.words.gapFromLead} ≠ ${E.gapFromLead}`);
    for (const bt of f.buttons) { if (!near(bt.right, E.btnRight)) faults.push(`RULE ${k}: in-field button ${bt.right} from the edge ≠ ${E.btnRight}`); if (bt.icon && !near(bt.icon[0], E.btnIcon)) faults.push(`RULE ${k}: in-field icon ${bt.icon[0]} ≠ ${E.btnIcon}`); }
  }
  console.log(`${PAGE} · family ${FAM} · ${Object.keys(M).length} members · ${faults.length} fault(s)`); for (const x of faults) console.log('  ' + x);
  process.exit(faults.length ? 1 : 0);
})().catch((e) => { console.error('relations FAIL', e.message); process.exit(2); });
