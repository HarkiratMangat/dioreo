// Session 4 · draw every surface (Harkirat, 2026-10-02 17:47 EDT: "Where tf is broadcast's manifest then??"). For each family, every Board 4
// stage (each state its switch offers, and the pop-ups) where one of the family's sampled elements is drawn but no sample of the family was
// taken gets a capture spec cloned from the family's own spec for that element: the same selector, hover target, variables and node styles,
// on the new stage. Specs that need a Try step or a click on their own stage are not cloned. Writes the specs to sweep/live-specs.json and
// the new places to sweep/fill.json ({ fam, fz, where, base }); the place's today is found afterwards by today-detect.cjs.
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/surface-fill.cjs
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const W = require(path.join(ROOT, 'docs/pins2/final/board4-spec/board4-walk.cjs'));
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const SW = path.join(__dirname, 'sweep'); const SPEC = {}; const LSF = path.join(SW, 'live-specs.json');
for (const f of fs.readdirSync(SW).filter((f) => /^freeze-.*\.json$/.test(f) && f !== 'freeze-selbar.json').sort()) for (const s of JSON.parse(fs.readFileSync(path.join(SW, f), 'utf8'))) if (!SPEC[s.id] || (s.vars && !SPEC[s.id].vars)) SPEC[s.id] = s;
const LIVE_SPECS = JSON.parse(fs.readFileSync(LSF, 'utf8')); for (const s of LIVE_SPECS) SPEC[s.id] = { ...(SPEC[s.id] || {}), ...s };
const STAGE = { 'c-manifest': 'Armory', 'c-new-build': 'New build', 'c-compare': 'Compare', 'c-repairs': 'Repairs', 'c-export': 'Export', 'c-queue': 'The delivery queue', 'c-broadcast': 'Broadcast', 'c-history': 'History', 'c-admin': 'Admin traffic' };
const short = (k) => (k.startsWith('pop:') ? k.slice(4).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') : k.replace(/^c-/, ''));
(async () => {
  const b0 = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sf-')) });
  const p0 = await b0.newPage(); await p0.setContent('<div></div>'); for (const f of ['samples.js', 'sample.js', 'core.js']) await p0.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'local/pins2/s4/board/live', f), 'utf8') });
  const FAMS = await p0.evaluate(() => Object.values(BY).map((F) => ({ id: F.id, places: (F.ctx || []).filter((c) => c.fz).map((c) => ({ fz: c.fz, where: c.where })) }))); await b0.close();
  const clonable = (s) => s && s.sel && !s.try && !s.click && !s.text;
  const sels = [...new Set(FAMS.flatMap((F) => F.places.map((x) => SPEC[x.fz]).filter(clonable).map((s) => s.sel)))];
  const { b, p } = await W.open(); const views = [];
  const count = (scope) => p.evaluate((scope, sels, PS) => { const roots = scope === 'pop' ? [...document.querySelectorAll(PS)].filter((e) => e.getBoundingClientRect().height > 0) : [document.getElementById(scope)]; const o = {};
    for (const s of sels) { let n = 0; for (const r of roots) { try { n += [...r.querySelectorAll(s)].filter((e) => e.getBoundingClientRect().width > 0).length; } catch (e) {} } if (n) o[s] = n; } return o; }, scope, sels, W.POP_SEL);
  for (const [, id] of W.GATES) { const acts = (await W.actions(p, id)).filter(([k]) => k === 'state'); const states = acts.length ? acts.map(([, , t]) => t) : [null];
    for (let i = 0; i < states.length; i++) { if (states[i]) await W.setState(p, id, states[i]); views.push({ key: id, gate: id, state: i === 0 ? null : states[i], hits: await count(id) }); } }
  for (const pop of W.POPS.filter((x) => !x.drawer)) { const o = await W.openPop(p, pop); if (o.ok) views.push({ key: 'pop:' + pop.label, gate: 'pop', pop: pop.label, hits: await count('pop') }); await W.closePop(p); }
  await b.close();
  const have = new Set(LIVE_SPECS.map((s) => s.id)); const add = []; const fill = [];
  for (const F of FAMS) {
    const covered = new Set(F.places.map((x) => { const s = SPEC[x.fz] || {}; return s.gate === 'pop' ? 'pop:' + s.pop : s.gate; }));
    const byStage = {}; views.forEach((v) => { if (!byStage[v.key]) byStage[v.key] = []; byStage[v.key].push(v); });
    for (const [stage, vs] of Object.entries(byStage)) { if (covered.has(stage)) continue;
      for (const pl of F.places) { const s = SPEC[pl.fz]; if (!clonable(s)) continue; const v = vs.find((x) => x.hits[s.sel]); if (!v) continue;
        const id = `${pl.fz}@${short(stage)}`; const ns = { id, gate: v.gate, sel: s.sel, nth: 0, up: s.up || 0 };
        if (v.state) ns.state = v.state; if (v.pop) ns.pop = v.pop; for (const k of ['hover', 'contains', 'vars', 'nodeStyle', 'addLine']) if (s[k] !== undefined) ns[k] = s[k];
        if (!have.has(id)) { add.push(ns); have.add(id); }
        const tail = pl.where.includes(' · ') ? pl.where.slice(pl.where.indexOf(' · ') + 3) : pl.where;
        fill.push({ fam: F.id, fz: id, base: pl.fz, where: `${stage.startsWith('pop:') ? stage.slice(4).charAt(0).toUpperCase() + stage.slice(5) : STAGE[stage]} · ${tail}` });
        break; } } }
  fs.writeFileSync(LSF, JSON.stringify([...LIVE_SPECS, ...add], null, 1)); fs.writeFileSync(path.join(SW, 'fill.json'), JSON.stringify(fill, null, 1));
  console.log(`${add.length} new specs · ${fill.length} new places`); fill.forEach((f) => console.log(`  ${f.fam}: ${f.where}  ← ${f.fz}`));
})().catch((e) => { console.error(e); process.exit(1); });
