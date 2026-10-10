// Session 4 · every Board 4 surface each family appears on (Harkirat, 2026-10-02 17:47 EDT: "Where tf is broadcast's manifest then??").
// A family's elements are the roots its captured samples were taken from (the capture specs' `sel`); this walks every stage of Board 4 in
// every state its switch offers, plus the pop-ups, finds every visible match, and names each stage where a family's element is drawn but
// no sample of that family was taken. Run with repo-static on :8900:  node local/pins2/s4/work/lead/surface-audit.cjs
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const W = require(path.join(ROOT, 'docs/pins2/final/board4-spec/board4-walk.cjs'));
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const SW = path.join(__dirname, 'sweep'); const SPEC = {};
for (const f of fs.readdirSync(SW).filter((f) => /^freeze-.*\.json$/.test(f) && f !== 'freeze-selbar.json').sort()) for (const s of JSON.parse(fs.readFileSync(path.join(SW, f), 'utf8'))) if (!SPEC[s.id] || (s.vars && !SPEC[s.id].vars)) SPEC[s.id] = s;
for (const s of JSON.parse(fs.readFileSync(path.join(SW, 'live-specs.json'), 'utf8'))) SPEC[s.id] = { ...(SPEC[s.id] || {}), ...s };
(async () => {
  // which family uses which sample, read from the board's own data
  const b0 = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sa-')) });
  const p0 = await b0.newPage(); await p0.setContent('<div></div>'); for (const f of ['samples.js', 'sample.js', 'core.js']) await p0.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'local/pins2/s4/board/live', f), 'utf8') });
  const FAMS = await p0.evaluate(() => Object.values(BY).map((F) => ({ id: F.id, name: F.name, places: (F.ctx || []).filter((c) => c.fz).map((c) => ({ fz: c.fz, where: c.where })) }))); await b0.close();
  // the element a family is about: its samples' roots, as selectors to search for
  for (const F of FAMS) F.sels = [...new Set(F.places.map((x) => SPEC[x.fz]).filter((s) => s && s.sel).map((s) => s.sel.replace(/:nth-of-type\(\d+\)/g, '')))];
  const { b, p } = await W.open(); const views = [];
  for (const [, id] of W.GATES) { const acts = (await W.actions(p, id)).filter(([k]) => k === 'state'); const states = acts.length ? acts.map(([, , t]) => t) : [null];
    for (const st of states) { if (st) await W.setState(p, id, st); views.push({ id, st, hits: await p.evaluate((id, F) => { const g = document.getElementById(id); const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }; const o = {}; for (const f of F) { let n = 0; for (const s of f.sels) { try { n += [...g.querySelectorAll(s)].filter(vis).length; } catch (e) {} } if (n) o[f.id] = n; } return o; }, id, FAMS) }); } }
  for (const pop of W.POPS.filter((x) => !x.drawer)) { const o = await W.openPop(p, pop); if (!o.ok) continue; views.push({ id: 'pop', st: pop.label, hits: await p.evaluate((S, F) => { const pops = [...document.querySelectorAll(S)].filter((e) => e.getBoundingClientRect().height > 0); const o = {}; for (const f of F) { let n = 0; for (const s of f.sels) for (const pp of pops) { try { n += pp.querySelectorAll(s).length + (pp.matches(s) ? 1 : 0); } catch (e) {} } if (n) o[f.id] = n; } return o; }, W.POP_SEL, FAMS) }); await W.closePop(p); }
  await b.close();
  const label = (v) => v.id === 'pop' ? 'pop: ' + v.st : v.id + (v.st ? ' · ' + v.st : '');
  for (const F of FAMS.filter((f) => f.sels.length)) {
    const covered = new Set(F.places.map((x) => { const s = SPEC[x.fz] || {}; return s.gate === 'pop' ? 'pop: ' + s.pop : s.gate; }));
    const seen = {}; views.forEach((v) => { if (v.hits[F.id]) { const g = v.id === 'pop' ? label(v) : v.id; (seen[g] = seen[g] || []).push(`${v.st || 'rest'} ×${v.hits[F.id]}`); } });
    const missing = Object.keys(seen).filter((g) => !covered.has(g));
    console.log(`${F.id} (${F.sels.join(' | ')}): drawn on ${Object.keys(seen).length} stages · sampled ${[...covered].join(', ')}${missing.length ? '\n   MISSING: ' + missing.map((g) => `${g} [${seen[g].join(', ')}]`).join(' · ') : ''}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
