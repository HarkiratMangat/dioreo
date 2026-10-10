// Board 4: Builder · the data the page needs, measured on the live Board 4 in standards mode (as the published artifact runs):
//   bd/rules.js — every kit rule from its SOURCE file (file, line, selector, declarations, @media/@supports/@container), for "where does this
//                 value come from"; source, not the CSSOM, because the CSSOM empties var() shorthands a later longhand overrides;
//   bd/walk.js  — every gate in every state and pop-up, signed by the page's own measure.js, for "also in other states", and the starting
//                 lists the knobs snap to (heights, text sizes, line heights, corners, icon sizes, letter spacing).
// Run with repo-static on :8900:  node local/pins2/s4/builder-2/bd-tools/build-data.cjs
const path = require('path'); const fs = require('fs'); const ROOT = path.resolve(__dirname, '../../../../..');
// Builder-2's data must describe Builder-2's own board. board4-walk.cjs defaults to docs/pins2/kit (Board 4: Collective), and a run
// without B4_URL measured Collective for every A-data patch of the Adjuster's rounds (found by the lead 2026-10-05 03:25 EDT: rules
// carried Collective's values and line numbers). So the default is this clone's page, and a run against any other page stops.
process.env.B4_URL = process.env.B4_URL || 'http://127.0.0.1:8900/local/pins2/s4/builder-2/board4.html';
if (!/\/local\/pins2\/s4\/builder-2\/board4\.html$/.test(new URL(process.env.B4_URL).pathname)) throw new Error('build-data measures Builder-2 only; B4_URL is ' + process.env.B4_URL);
const W = require(path.join(ROOT, 'docs/pins2/final/board4-spec/board4-walk.cjs')); const { STD } = require(path.join(ROOT, 'local/pins2/s4/work/lead/el-page.cjs'));
const CSSX = require(path.join(ROOT, 'local/pins2/s4/work/lead/el-css.cjs'));
const BD = path.join(__dirname, '..', 'bd'); const MEASURE = path.join(BD, 'measure.js');
function splitDecls(body) {
  const out = []; let d = 0, q = null, cur = '';
  for (const ch of body) { if (q) { cur += ch; if (ch === q) q = null; continue; } if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; } if (ch === '(') d++; if (ch === ')') d--; if (ch === ';' && d === 0) { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf(':'); if (i < 0) return null; const p = x.slice(0, i).trim().toLowerCase(); let v = x.slice(i + 1).trim(); const imp = /!\s*important\s*$/i.test(v); if (imp) v = v.replace(/!\s*important\s*$/i, '').trim(); return p.startsWith('--') || !p ? null : [p, v, imp ? 1 : 0]; }).filter(Boolean);
}
(async () => {
  const t0 = Date.now(); const { b, p } = await W.open();
  // a doctype in front of any of the repo's own pages (el-page.cjs's STD covers only docs/pins2/kit), so Builder-2's clone loads in standards mode as published
  await p.setRequestInterception(true); p.on('request', (rq) => { const u = new URL(rq.url()); if (u.hostname === '127.0.0.1' && /\.html$/.test(u.pathname) && rq.resourceType() === 'document') { const f = path.join(ROOT, decodeURIComponent(u.pathname)); if (fs.existsSync(f)) return rq.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html>' + fs.readFileSync(f, 'utf8') }); } rq.continue(); }); await p.setViewport({ width: 1480, height: 834 });
  const reload = async () => { await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await p.evaluate(() => document.fonts.ready); await W.sleep(600); };
  await reload();
  if (!/\/local\/pins2\/s4\/builder-2\/board4\.html$/.test(new URL(p.url()).pathname)) throw new Error('opened ' + p.url() + ', not Builder-2');
  const compat = await p.evaluate(() => document.compatMode); if (compat !== 'CSS1Compat') throw new Error('Board 4 is not in standards mode: ' + compat);
  // ① the rules, from source
  const sheets = await CSSX.sheetsOf(p, ROOT); const files = [], rules = []; let order = 0, nested = 0;
  for (const sh of sheets) {
    const rel = sh.href ? decodeURIComponent(new URL(sh.href).pathname).replace(/^\/(docs\/pins2\/kit|local\/pins2\/s4\/builder-2)\//, '') : '(inline)'; const fi = files.push(rel) - 1;
    const clean = CSSX.stripKeep(sh.text); const nl = [0]; for (let i = 0; i < clean.length; i++) if (clean[i] === '\n') nl.push(i + 1);
    const lineAt = (pos) => { let lo = 0, hi = nl.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (nl[m] <= pos) lo = m; else hi = m - 1; } return lo + 1; };
    const walk = (nodes, ctx) => { for (const n of nodes) {
      if (n.kind === 'rule') { if (n.nested) nested++; const body = n.nested ? n.body.slice(0, n.body.indexOf('{')).replace(/[^;]*$/, '') : n.body; const d = splitDecls(body); if (!d.length) continue; const r = { f: fi, l: lineAt(n.at), s: n.sel.replace(/\s+/g, ' ').trim(), d, o: order++ }; if (ctx.m.length) r.m = ctx.m; if (ctx.su.length) r.su = ctx.su; if (ctx.c) r.c = ctx.c; rules.push(r); }
      else if (n.kind === 'group') { const at = n.pre.match(/^@([\w-]+)/)[1].toLowerCase(); const q = n.pre.slice(at.length + 1).trim(); if (at === 'media') walk(n.kids, { ...ctx, m: [...ctx.m, q] }); else if (at === 'supports') walk(n.kids, { ...ctx, su: [...ctx.su, q] }); else if (at === 'container') walk(n.kids, { ...ctx, c: ctx.c ? ctx.c + ' and ' + q : q }); else walk(n.kids, ctx); }
    } };
    walk(CSSX.parse(clean), { m: sh.media ? [sh.media] : [], su: [], c: '' });
  }
  // ② every gate in every state and pop-up
  const views = []; for (const [g, id] of W.GATES) { views.push({ g, id, kind: 'rest', label: 'as it opens' }); for (const a of await W.actions(p, id)) views.push({ g, id, kind: a[0], i: a[1], label: a[2] }); }
  for (const pop of W.POPS) views.push({ g: pop.g, id: pop.id, kind: 'pop', label: pop.label, pop });
  const out = []; const L = { heights: [], text: [], lines: [], radii: [], icons: [], ls: [] }; let misses = 0;
  for (const v of views) {
    await reload(); let scope = `#${v.id}`;
    if (v.kind === 'state' || v.kind === 'try') await W.act(p, v.id, v.kind, v.i);
    if (v.kind === 'pop') { const o = await W.openPop(p, v.pop); if (!o.ok) { misses++; process.stdout.write('x'); continue; } scope = v.pop.sel || W.POP_SEL; }
    await p.addScriptTag({ path: path.join(BD, 'identity.js') }); await p.addScriptTag({ path: path.join(BD, 'roles.js') }); await p.addScriptTag({ path: MEASURE });
    const got = await p.evaluate((scope) => { const M = window.BD.measure; const seen = new Set(); const things = [];
      for (const sc of document.querySelectorAll(scope)) for (const el of M.things(sc)) { const sg = M.signature(el); const sel = M.selOf(el); const key = sel + '|' + [sg.h, sg.r, sg.fs, sg.style].join('|'); if (seen.has(key)) continue; seen.add(key); things.push({ sel, name: M.nameOf(el), sig: sg }); }
      return things; }, scope);
    for (const t of got) { const s = t.sig;
      if (s.kind === 'control') { L.heights.push(s.h); L.radii.push(s.r); if (s.icon) L.icons.push(s.icon); }
      if (s.kind === 'text' || s.kind === 'control') { L.text.push(s.fs); if (s.lh) L.lines.push(s.lh); L.ls.push(s.ls); }
      if (s.kind === 'icon') L.icons.push(s.h); if ((s.kind === 'box' || s.kind === 'layout') && s.r) L.radii.push(s.r); }
    if (v.kind !== 'rest') out.push({ g: v.g, label: v.label, kind: v.kind, things: got });
    if (v.kind === 'pop') await W.closePop(p).catch(() => {});
    process.stdout.write('.');
  }
  const u = (a, d = 1) => [...new Set(a.map((x) => +(+x).toFixed(d)))].filter(Number.isFinite).sort((x, y) => x - y);
  const data = { at: new Date().toISOString(), views: out, heights: u(L.heights.map((x) => Math.round(x * 2) / 2)), text: u(L.text), lines: u(L.lines.map((x) => Math.round(x * 2) / 2)), radii: u(L.radii), icons: u(L.icons.map((x) => Math.round(x))), ls: u(L.ls, 2) };
  fs.writeFileSync(path.join(BD, 'rules.js'), 'window.BD_RULES=' + JSON.stringify({ files, rules }) + ';\n');
  fs.writeFileSync(path.join(BD, 'walk.js'), 'window.BD_WALK=' + JSON.stringify(data) + ';\n');
  const kb = (f) => (fs.statSync(path.join(BD, f)).size / 1024).toFixed(0) + 'KB';
  console.log(`\nrules ${rules.length} from ${files.length} files (${nested} carry nested rules) · views ${views.length} (${misses} pop-ups did not open) · things in other states ${out.reduce((n, v) => n + v.things.length, 0)}`);
  console.log(`lists: heights ${data.heights.length} [${data.heights.join(' ')}] · text ${data.text.length} · lines ${data.lines.length} · corners ${data.radii.length} · icons ${data.icons.length} · letter spacing ${data.ls.length} · rules.js ${kb('rules.js')} · walk.js ${kb('walk.js')} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
