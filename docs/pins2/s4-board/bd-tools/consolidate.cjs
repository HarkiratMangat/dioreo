// Board 4: Builder-2 · consolidate.cjs — one definition per component (Session 4, 2026-10-06 15:22 EDT). Harkirat, 15:11 EDT: "if the board's
// convention is incorrect coding, then fix it!"; 15:13 EDT: "work the class, not just the instance". The values he set for C1 were each
// written by three to six rules across app.css, b3/board.css, gates.css and b4/classes.css, the winner decided by specificity accident.
// b4/components.css now holds each standardized part once; this removes, from the kit's other sheets, every declaration those rules replace.
//
// A declaration is removed only when all of these hold:
//   · its rule is not inside @media or @supports (the narrow layouts stay; components.css restates what it changes there);
//   · every selector of its rule names one of the component classes below (a rule written for these parts, never a base rule such as
//     `.chip` or `input, button`, which other parts of the board also use);
//   · on the board, everything each of those selectors reaches is also reached by a components.css rule with the same pseudo-element and
//     the same state (:hover, [aria-…]), and that rule sets the property or a shorthand that includes it.
// Anything that still competes and is not removed is listed (KEPT), so it can be decided by hand.
// Usage: node local/pins2/s4/builder-2/bd-tools/consolidate.cjs [--apply]   (repo-static on :8900; without --apply it only reports)
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../../..'); const KIT = path.resolve(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core')); const CSSX = require(path.join(ROOT, 'local/pins2/s4/work/lead/el-css.cjs'));
const APPLY = process.argv.includes('--apply'); const BASE = process.env.BD_BASE || 'http://127.0.0.1:8900';
const OWNED = ['mtools', 'mt-r1', 'mt-r2', 'mt-grp', 'mt-chips', 'mlabel', 'srch', 'madd', 'b3-hi-tools', 'b3-hi-f', 'b3-fg', 'b3-fgc', 'b3-fgl', 'b3-rp-f', 'wg-fold', 'wg-ib', 'wg-fbtn', 'wg-h', 'wg-r', 'wg-line', 'wg-main', 'wg-plate', 'wg-at', 'wg-end', 'wg-acts', 'wg-imx', 'wg-imh', 'wg-code', 'wg-ig', 'wg-igf', 'wg-igb', 'b3-fx', 'b3-fchip'];
const SH = { padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding-inline', 'padding-block', 'padding-inline-start', 'padding-inline-end'], 'padding-inline': ['padding-left', 'padding-right', 'padding-inline-start', 'padding-inline-end'], margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'margin-inline', 'margin-block', 'margin-inline-start', 'margin-inline-end'], 'margin-inline': ['margin-left', 'margin-right', 'margin-inline-start', 'margin-inline-end'], gap: ['row-gap', 'column-gap', 'grid-gap', 'grid-row-gap', 'grid-column-gap'], font: ['font-style', 'font-variant', 'font-weight', 'font-stretch', 'font-size', 'line-height', 'font-family'], 'border-width': ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'], 'border-radius': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'], flex: ['flex-grow', 'flex-shrink', 'flex-basis'], 'grid-column': ['grid-column-start', 'grid-column-end'] };
const covers = (c, p) => c === p || (SH[c] || []).includes(p);
const split = (t) => { const out = []; let d = 0, cur = '', q = null; for (const ch of t) { if (q) { cur += ch; if (ch === q) q = null; continue; } if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; } if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
const STATE = /:(hover|focus-visible|focus-within|focus|active|disabled|checked)(?![\w-])|\[aria-[\w-]+(=[^\]]*)?\]/g;
// an alternative's pseudo-element and the states of its subject (outside :not/:is/:where/:has), and the selector that reaches its element
function shape(alt) { const pm = alt.match(/::?(before|after|placeholder)\s*$/); const pe = pm ? '::' + pm[1] : ''; let base = pm ? alt.slice(0, pm.index) : alt;
  const keep = []; const t = base.replace(/:(not|is|where|has)\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)/g, (m) => { keep.push(m); return `\u0000${keep.length - 1}\u0000`; });
  let lastStart = 0; { let d = 0; for (let i = t.length - 1; i >= 0; i--) { const c = t[i]; if (c === ')' || c === ']') d++; else if (c === '(' || c === '[') d--; else if (d === 0 && /[\s>+~]/.test(c)) { lastStart = i + 1; break; } } }
  const states = (t.slice(lastStart).match(STATE) || []).sort().join(''); const stripped = (t.slice(0, lastStart) + t.slice(lastStart).replace(STATE, '')).replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]).trim();
  return { pe, st: states, base: stripped || '*', raw: alt }; }
function decls(body, at) { const out = []; let d = 0, q = null, s = 0; for (let i = 0; i <= body.length; i++) { const c = body[i]; if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === '(' || c === '[') d++; else if (c === ')' || c === ']') d--; if ((c === ';' || i === body.length) && d === 0) { const text = body.slice(s, i); const m = text.match(/^\s*([-\w]+)\s*:/); if (m) out.push({ prop: m[1].toLowerCase(), start: at + s, end: at + (c === ';' ? i + 1 : i), text: text.trim() }); s = i + 1; } } return out; }
function rulesOf(file) { const src = fs.readFileSync(path.join(KIT, file), 'utf8'); const keep = CSSX.stripKeep(src); const out = [];
  const walk = (nodes, inGroup) => { for (const n of nodes) { if (n.kind === 'group') { walk(n.kids, true); continue; } if (n.kind !== 'rule' || n.nested) continue; const open = keep.indexOf('{', n.at); out.push({ file, sel: n.sel, at: n.at, open, inGroup, decls: decls(n.body, open + 1), line: keep.slice(0, n.at).split('\n').length }); } };
  walk(CSSX.parse(keep), false); return { src, rules: out }; }
(async () => {
  const html = fs.readFileSync(path.join(KIT, 'board4.html'), 'utf8'); const files = [...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)">/g)].map((m) => m[1]).filter((f) => !/^https?:/.test(f));
  const COMP = 'b4/components.css'; if (!files.includes(COMP)) { console.error('board4.html does not link ' + COMP); process.exit(2); }
  const comp = rulesOf(COMP).rules.filter((r) => !r.inGroup).map((r) => ({ alts: split(r.sel).map(shape), props: r.decls.map((d) => d.prop), sel: r.sel }));
  const kit = {}; for (const f of files) if (f !== COMP) kit[f] = rulesOf(f);
  const cand = []; const has = (alt) => OWNED.some((c) => new RegExp(`\\.${c.replace(/-/g, '\\-')}(?![\\w-])`).test(alt));
  for (const f of Object.keys(kit)) for (const r of kit[f].rules) { if (r.inGroup) continue; const alts = split(r.sel); if (!alts.length || !alts.every(has)) continue; cand.push({ f, r, alts: alts.map(shape) }); }
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bd-cons-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1640, height: 900 }); await p.goto(`${BASE}/${path.relative(ROOT, KIT)}/board4.html`, { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForSelector('#c-manifest .wg-r', { timeout: 60000 });
  // for each candidate selector: the components.css rules (same pseudo-element, same state) that reach everything it reaches on the board
  const owners = await p.evaluate((cand, comp) => { const q = (s) => { try { return [...document.querySelectorAll(s)]; } catch (e) { return null; } }; const cs = comp.map((c) => { const by = new Map(); for (const a of c.alts) { const k = a.pe + '|' + a.st; if (!by.has(k)) by.set(k, { a, set: new Set() }); for (const e of q(a.base) || []) by.get(k).set.add(e); } return [...by.values()]; }); /* a rule's selectors together: :is(.wg-code, .wg-ig.none) is owned by a rule that lists both */
    return cand.map((c) => c.alts.map((a) => { const els = q(a.base); if (!els || !els.length) return { n: 0, by: [] }; const by = []; cs.forEach((alts, ci) => { if (alts.some((x) => x.a.pe === a.pe && x.a.st === a.st && els.every((e) => x.set.has(e)))) by.push(ci); }); return { n: els.length, by }; })); }, cand.map((c) => ({ alts: c.alts })), comp.map((c) => ({ alts: c.alts })));
  await b.close();
  const del = {}; const kept = []; let nDel = 0;
  cand.forEach((c, i) => { const o = owners[i]; for (const d of c.r.decls) { const cov = (x) => x.by.some((ci) => comp[ci].props.some((cp) => covers(cp, d.prop))); /* a selector that reaches nothing on the board (a dead variant of the same part) does not block it */ const ok = o.every((x) => x.n === 0 || cov(x)) && o.some((x) => x.n > 0 && cov(x)); const competes = o.some((x) => x.by.some((ci) => comp[ci].props.some((cp) => covers(cp, d.prop) || covers(d.prop, cp)))); if (ok) { (del[c.f] = del[c.f] || []).push({ ...d, line: c.r.line, sel: c.r.sel }); nDel++; } else if (competes) kept.push(`${c.f}:${c.r.line} ${c.r.sel.slice(0, 80)} { ${d.text} }  — ${o.map((x) => x.n ? (x.by.length ? 'owned' : 'reaches more') : 'reaches nothing here').join(' / ')}`); } });
  const lines = []; for (const f of Object.keys(del)) for (const d of del[f]) lines.push(`${f}:${d.line} ${d.sel.slice(0, 80)} { ${d.text} }`);
  console.log(`${nDel} declarations replaced by components.css, in ${Object.keys(del).length} files${APPLY ? ' — removing' : ' (report only; --apply removes them)'}`); console.log(lines.join('\n')); console.log(`\nKEPT (${kept.length}):`); console.log(kept.join('\n'));
  if (!APPLY) return;
  for (const f of Object.keys(del)) { let s = kit[f].src; const ds = del[f].sort((x, y) => y.start - x.start); for (const d of ds) { let e = d.end; while (e < s.length && /[ \t]/.test(s[e])) e++; s = s.slice(0, d.start) + s.slice(e); }
    // a rule left with nothing in it goes too: found by the same parser, on the edited text, and removed from its selector to its closing brace
    { const keep = CSSX.stripKeep(s); const empty = []; const walk = (nodes) => { for (const n of nodes) { if (n.kind === 'group') { walk(n.kids); continue; } if (n.kind === 'rule' && !n.nested && !n.body.trim()) { const open = keep.indexOf('{', n.at); const end = keep.indexOf('}', open); if (open > 0 && end > open) empty.push([n.at, end + 1]); } } }; walk(CSSX.parse(keep)); for (const [a, z] of empty.sort((x, y) => y[0] - x[0])) s = s.slice(0, a) + s.slice(z); }
    fs.writeFileSync(path.join(KIT, f), s); }
  console.log('applied');
})().catch((e) => { console.error('consolidate FAIL', e.stack || e.message); process.exit(1); });
