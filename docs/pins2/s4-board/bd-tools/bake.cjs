// Board 4: Builder-2 · bake.cjs — Bake Final (Stage 3, Session 4, 2026-10-05 15:05 EDT). Harkirat, 11:31 EDT: "why not use the builder values to
// *Create* board 4:final which already holds the correct values, removes all the unsured old ones, and generates a fresh full spec for session 5?"
//
// Board 4: Final is GENERATED, never hand-edited: a copy of Builder-2's board (no builder) whose own CSS carries his values. For every rule the
// builder writes (its override sheet, from his saved variants), the kit rule that wins that property today is found (bd/why.js, from the source
// files) and his value is written THERE, as a named token:
//   · that rule reaches exactly the builder rule's elements  → the declaration goes into that rule (later in the block wins over a shorthand)
//   · it reaches more                                        → a narrowed rule right after it: :is(<its selector>):is(<the builder's>)
//   · no kit rule sets it                                    → a rule at the end of app.css
// Tokens are --std-<his variant name>-<setting>, defined once at the top of app.css. Then every custom property nothing references any more is
// deleted. No :not(#bd-…) and no !important the kit did not already have: what Session 5 ports is the kit's own rules.
// The proof is separate (fidelity.cjs): Final must render pixel-equal to Builder-2 with the builder's sheet, in every walked view.
//
// Usage:  node local/pins2/s4/builder-2/bd-tools/bake.cjs --state <state.json> [--out local/pins2/s4/board4-final] [--report <file.md>]
//         (the state is the artifact db's builder/state document, or "Copy all data for Claude"'s state)
const path = require('path'); const fs = require('fs'); const http = require('http'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../../..'); const KIT = path.resolve(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const A = (() => { const o = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { if (v[i].startsWith('--')) { o[v[i].slice(2)] = v[i + 1] && !v[i + 1].startsWith('--') ? v[++i] : true; } } return o; })();
if (!A.state) { console.error('--state <file> is required'); process.exit(2); }
const OUT = path.resolve(ROOT, A.out || 'local/pins2/s4/board4-final');
const REPORT = path.resolve(ROOT, A.report || path.join(path.relative(ROOT, OUT), 'BAKE.md'));
const rawState = JSON.parse(fs.readFileSync(path.resolve(A.state), 'utf8')); const STATE = rawState.state || rawState.data || rawState;
const stamp = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); const et = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' })); const tz = d.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }).split(' ').pop(); return `${et.getFullYear()}-${p(et.getMonth() + 1)}-${p(et.getDate())} ${p(et.getHours())}:${p(et.getMinutes())} ${tz}`; };

// ── 1 · the plan, read in the page: every builder rule, its elements, and the kit rule that wins each of its properties today
async function plan() {
  const CT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp' };
  const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(ROOT, u); try { let b = fs.readFileSync(f); const ext = path.extname(f); if (ext === '.html') b = Buffer.concat([Buffer.from('<!doctype html>'), b]); r.writeHead(200, { 'content-type': CT[ext] || 'application/octet-stream' }); r.end(b); } catch (e) { r.writeHead(404); r.end(); } });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const port = srv.address().port;
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 900000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bd-bake-')) });
  try {
    const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888 });
    await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); } catch (e) {} }, JSON.stringify(STATE));
    await p.goto(`http://127.0.0.1:${port}/${path.relative(ROOT, KIT)}/builder.html?bdhide`, { waitUntil: 'networkidle0', timeout: 120000 });
    await p.waitForFunction(() => window.__bd && window.__bd.mounted !== undefined && document.getElementById('bd-std'), { timeout: 60000 }); await new Promise((r) => setTimeout(r, 1500));
    return await p.evaluate(() => {
      const board = document.getElementById('board'); const sh = document.getElementById('bd-std'); const rules = [...sh.sheet.cssRules]; const tokens = {}; const entries = []; const W = BD.why;
      const SH = { padding: /^padding-/, margin: /^margin-/, gap: /^(row|column)-gap$/, font: /^font-|^line-height$/, 'border-radius': /-radius$/, 'border-width': /^border-.*-width$/, border: /^border-/, inset: /^(top|right|bottom|left)$/, flex: /^flex-/, 'text-box': /^text-box/ };
      const declOf = (r, prop) => r.d.find((d) => d[0] === prop) || r.d.find((d) => SH[d[0]] && SH[d[0]].test(prop));
      const strip = (s) => s.replace(/::?(before|after)\s*$/, '');
      const reachOf = (sel) => { const out = new Set(); for (const part of W.splitSel(sel)) { try { for (const e of document.querySelectorAll(strip(part))) if (board.contains(e)) out.add(e); } catch (e) {} } return out; };
      // a builder rule's declarations as WRITTEN (its cssText), not through the CSSOM: a shorthand set from a var() reads back empty there
      // (border-radius came out as four empty longhands in the first test bake, 15:16 EDT)
      const declsOf = (r) => { const t = r.cssText; const body = t.slice(t.indexOf('{') + 1, t.lastIndexOf('}')); const out = []; let d = 0, cur = ''; for (const ch of body) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ';' && !d) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((s) => s.trim()).filter(Boolean).map((s) => { const i = s.indexOf(':'); const v = s.slice(i + 1).trim(); return { prop: s.slice(0, i).trim(), value: v.replace(/\s*!important\s*$/, ''), imp: /!important\s*$/.test(v) }; }); };
      // the property why.js is asked about, for a shorthand: one of its longhands
      const LONG = { 'border-radius': 'border-top-left-radius', flex: 'flex-grow', padding: 'padding-top', margin: 'margin-top', inset: 'top', gap: 'column-gap', 'border-width': 'border-top-width', font: 'font-size', 'text-box': 'text-box-trim' };
      for (const r of rules) {
        if (r.type !== 1) continue;
        if (r.selectorText === ':root') { const st = r.style; for (let i = 0; i < st.length; i++) tokens[st[i]] = st.getPropertyValue(st[i]).trim(); continue; }
        const pe = (r.selectorText.match(/::(before|after)\s*$/) || [''])[0]; const clean = r.selectorText.replace(/:not\(#bd-\d\)/g, '').replace(/::(before|after)\s*$/, '').trim();
        let els = []; try { els = [...document.querySelectorAll(clean)].filter((e) => board.contains(e)); } catch (e) {}
        for (const dcl of declsOf(r)) {
          const prop = dcl.prop, value = dcl.value; const q = LONG[prop] || prop;
          // each element's own winner: one selector can reach elements that different kit rules style (the three search bars), so the value
          // is written once per winning rule, never only at the first element's
          const groups = new Map();
          for (const e of els.slice(0, 200)) { let w = null; try { w = W.of(e, q, pe); } catch (x) { w = null; } const key = w && w.rule ? `${w.rule.file}:${w.rule.line}:${w.rule.sel}` : 'none'; if (!groups.has(key)) groups.set(key, { w: w && w.rule ? w : null, els: [] }); groups.get(key).els.push(e); }
          for (const [, g] of groups) {
            let winner = null, exactly = false, reach = 0;
            if (g.w) { const RL = window.BD_RULES; const fi = RL.files.indexOf(g.w.rule.file); const R = RL.rules.find((x) => x.f === fi && x.l === g.w.rule.line && W.splitSel(x.s).includes(g.w.rule.sel)) || RL.rules.find((x) => x.f === fi && x.l === g.w.rule.line); const full = R ? R.s : g.w.rule.sel; winner = { f: fi, l: g.w.rule.line, s: full, part: g.w.rule.sel, imp: !!g.w.important, declared: `${g.w.via}:${g.w.declared}` }; const rs = reachOf(full); reach = rs.size; exactly = rs.size === g.els.length && g.els.every((e) => rs.has(e)); }
            entries.push({ clean, pe, prop, value, n: g.els.length, winner, exactly, same: groups.size === 1, reach });
          }
          if (!els.length) entries.push({ clean, pe, prop, value, n: 0, winner: null, exactly: false, same: true, reach: 0 });
        }
      }
      return { tokens, entries, files: window.BD_RULES.files, css: sh.textContent };
    });
  } finally { await b.close(); srv.close(); }
}

// ── 2 · the copy: Builder-2's board without the builder
const SKIP = (rel) => /^(\.git|bd|bd-tools|shots[^/]*)(\/|$)/.test(rel) || /(^|\/)\./.test(rel) || /\.(cjs|md|py)$/.test(rel) || /\.test\.mjs$/.test(rel) || rel === 'builder.html' || rel === 'index.html';
function copyKit() {
  const keepGit = fs.existsSync(path.join(OUT, '.git'));
  if (fs.existsSync(OUT)) for (const n of fs.readdirSync(OUT)) if (n !== '.git') fs.rmSync(path.join(OUT, n), { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true }); let n = 0;
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const abs = path.join(d, e.name); const rel = path.relative(KIT, abs); if (SKIP(rel)) continue; if (e.isDirectory()) walk(abs); else { const to = path.join(OUT, rel); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(abs, to); n++; } } };
  walk(KIT); return { n, keepGit };
}

// ── 3 · the bake
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
function bake(P) {
  const V = STATE.variants || []; const tokName = {}; const used = new Set();
  for (const v of V) { let base = slug(v.name); if (!base || /^(button|text|layout|box|icon|divider)(-|$)/.test(base) && /\d/.test(base) === false) base = slug(v.id); if (used.has(base)) base = `${base}-${slug(v.id)}`; used.add(base); for (const k of Object.keys(v.values || {})) tokName[`--bd-${v.id.toLowerCase()}-${k.toLowerCase()}`] = `--std-${base}-${slug(k)}`; }
  const std = (s) => s.replace(/--bd-[a-z]-\d+-[a-z0-9]+/gi, (m) => tokName[m.toLowerCase()] || m);
  const text = {}; const rd = (f) => (text[f] != null ? text[f] : (text[f] = fs.readFileSync(path.join(OUT, f), 'utf8')));
  const lineStart = (t, l) => { let o = 0; for (let i = 1; i < l; i++) { const j = t.indexOf('\n', o); if (j < 0) return -1; o = j + 1; } return o; };
  const blockAt = (t, from) => { const a = t.indexOf('{', from); if (a < 0) return null; let d = 0, q = null; for (let j = a; j < t.length; j++) { const c = t[j]; if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; continue; } if (t.startsWith('/*', j)) { const k = t.indexOf('*/', j + 2); j = k < 0 ? t.length : k + 1; continue; } if (c === '{') d++; else if (c === '}') { d--; if (!d) return { a, z: j }; } } return null; };
  const norm = (s) => s.replace(/\s+/g, ' ').replace(/\s*([>+~,])\s*/g, '$1').trim();
  // the edits, gathered per file as [offset, text] and written from the end, so earlier offsets stay true
  const edits = {}; const add = (f, at, t) => (edits[f] = edits[f] || []).push([at, t]); const report = { inPlace: [], narrowed: [], appended: [], skipped: [] };
  const groups = new Map(); // one insertion per (target, kind)
  for (const e of P.entries) {
    if (!e.n) { report.skipped.push(`${e.clean}${e.pe} ${e.prop}: reaches nothing at rest`); continue; }
    const imp = e.winner ? e.winner.imp : false; const decl = `${e.prop}:${std(e.value)}${imp ? ' !important' : ''}`;
    let key, kind; if (e.winner && e.exactly) { kind = 'in'; key = `in|${e.winner.f}|${e.winner.l}|${e.winner.s}`; } else if (e.winner) { kind = 'narrow'; key = `nr|${e.winner.f}|${e.winner.l}|${e.winner.s}|${e.clean}${e.pe}`; } else { kind = 'end'; key = `end|${e.clean}${e.pe}`; }
    if (!groups.has(key)) groups.set(key, { kind, e, decls: [] }); groups.get(key).decls.push(decl);
  }
  for (const [, g] of groups) {
    const { kind, e } = g; const decls = g.decls.join(';');
    if (kind === 'end') { const f = 'app.css'; const t = rd(f); add(f, t.length, `\n${e.clean}${e.pe}{${decls}}`); report.appended.push(`${e.clean}${e.pe} { ${decls} }`); continue; }
    const f = P.files[e.winner.f]; const t = rd(f); const ls = lineStart(t, e.winner.l); if (ls < 0) { report.skipped.push(`${f}:${e.winner.l} not found for ${e.winner.s}`); continue; }
    // the rule starts on its line: its selector is found there (a minified line holds several), else the first block after the line start
    const line = t.slice(ls, t.indexOf('\n', ls) < 0 ? t.length : t.indexOf('\n', ls)); let from = ls; const k = line.indexOf(e.winner.s); if (k >= 0) from = ls + k;
    const blk = blockAt(t, from); if (!blk || norm(t.slice(from, blk.a)).indexOf(norm(e.winner.s).slice(0, 40)) < 0 && k < 0) { report.skipped.push(`${f}:${e.winner.l} rule text didn't match ${e.winner.s}`); continue; }
    if (kind === 'in') { const body = t.slice(blk.a + 1, blk.z).trimEnd(); add(f, blk.z, `${body && !body.endsWith(';') ? ';' : ''}${decls}`); report.inPlace.push(`${f}:${e.winner.l} ${e.winner.s} { +${decls} }`); }
    else { const pe = e.pe; const ws = e.winner.s.replace(/::?(before|after)\s*$/g, ''); const unwrap = (s) => { if (!s.startsWith(':is(')) return s; let d = 0; for (let i = 3; i < s.length; i++) { if (s[i] === '(') d++; else if (s[i] === ')') { d--; if (!d) return i === s.length - 1 ? s.slice(4, -1) : s; } } return s; }; const sel = `:is(${ws}):is(${unwrap(e.clean)})${pe}`; add(f, blk.z + 1, `\n${sel}{${decls}}`); report.narrowed.push(`${f}:${e.winner.l} after ${e.winner.s} → ${sel} { ${decls} } (it reaches ${e.reach}, the builder rule ${e.n})`); }
  }
  // the tokens, once, at the top of app.css
  const toks = Object.entries(P.tokens).filter(([k]) => tokName[k.toLowerCase()]).map(([k, v]) => `${tokName[k.toLowerCase()]}:${v}`);
  add('app.css', 0, `/* Board 4: Final — his standard values, baked from Builder-2 on ${stamp()} (bd-tools/bake.cjs). Generated: never edit by hand. */\n:root{${toks.join(';')}}\n`);
  for (const [f, list] of Object.entries(edits)) { let t = rd(f); list.sort((a, b) => b[0] - a[0]); for (const [at, s] of list) t = t.slice(0, at) + s + t.slice(at); text[f] = t; }
  // custom properties nothing references any more: defined in the CSS, named nowhere else in the board's CSS, JS or HTML
  const all = []; const walk = (d) => { for (const x of fs.readdirSync(d, { withFileTypes: true })) { const a = path.join(d, x.name); if (x.isDirectory()) { if (x.name !== '.git') walk(a); } else if (/\.(css|js|mjs|html)$/.test(x.name)) all.push(path.relative(OUT, a)); } }; walk(OUT);
  for (const f of all) rd(f);
  const defs = new Map(); for (const f of all.filter((x) => x.endsWith('.css'))) { for (const m of text[f].matchAll(/(^|[;{\s])(--[\w-]+)\s*:/g)) defs.set(m[2], (defs.get(m[2]) || 0) + 1); }
  const removed = [];
  if (!A['keep-unused']) for (const [name, nDef] of defs) { if (/^--std-/.test(name)) continue; let refs = 0; const re = new RegExp(name.replace(/[-]/g, '\\-') + '(?![\\w-])', 'g'); for (const f of all) refs += (text[f].match(re) || []).length; if (refs - nDef <= 0) removed.push(name); }
  for (const f of all.filter((x) => x.endsWith('.css'))) { let t = text[f]; for (const name of removed) t = t.replace(new RegExp(`(^|[;{\\s])${name.replace(/-/g, '\\-')}\\s*:[^;{}]*;?`, 'g'), '$1'); text[f] = t; }
  for (const f of Object.keys(text)) fs.writeFileSync(path.join(OUT, f), text[f]);
  // the page is Final's own
  const bh = path.join(OUT, 'board4.html'); fs.writeFileSync(bh, fs.readFileSync(bh, 'utf8').replace(/<title>[^<]*<\/title>/, '<title>Board 4: Final</title>'));
  return { report, toks, removed, tokName };
}

(async () => {
  const P = await plan(); const c = copyKit(); const R = bake(P);
  const md = [`# Board 4: Final — the bake`, '', `*Generated ${stamp()} by \`local/pins2/s4/builder-2/bd-tools/bake.cjs\` from ${path.relative(ROOT, path.resolve(A.state))} (${(STATE.variants || []).length} variants). Never edit Final by hand: change the values in Builder-2 and bake again.*`, '',
    `| | |`, `|---|--:|`, `| Kit files copied | ${c.n} |`, `| Builder rules read | ${P.entries.length} declarations |`, `| Written into the rule that sets them | ${R.report.inPlace.length} |`, `| Narrowed rule after the one that sets them | ${R.report.narrowed.length} |`, `| New rule (no kit rule set it) | ${R.report.appended.length} |`, `| Skipped | ${R.report.skipped.length} |`, `| Tokens | ${R.toks.length} |`, `| Unused custom properties removed | ${R.removed.length} |`, '',
    '## Tokens', '', ...R.toks.map((t) => `- \`${t}\``), '', '## Written into the rule', '', ...R.report.inPlace.map((x) => `- ${x}`), '', '## Narrowed rules', '', ...R.report.narrowed.map((x) => `- ${x}`), '', '## New rules', '', ...R.report.appended.map((x) => `- ${x}`), '', '## Skipped', '', ...R.report.skipped.map((x) => `- ${x}`), '', '## Removed custom properties', '', R.removed.map((x) => `\`${x}\``).join(' · ') || '—', ''];
  fs.writeFileSync(REPORT, md.join('\n'));
  fs.writeFileSync(path.join(path.dirname(REPORT), 'builder-sheet.css'), P.css);
  console.log(`baked ${path.relative(ROOT, OUT)}: ${c.n} files · in place ${R.report.inPlace.length} · narrowed ${R.report.narrowed.length} · new ${R.report.appended.length} · skipped ${R.report.skipped.length} · tokens ${R.toks.length} · removed ${R.removed.length}`);
  console.log(`report ${path.relative(ROOT, REPORT)} · the builder's own sheet for the proof: ${path.relative(ROOT, path.join(path.dirname(REPORT), 'builder-sheet.css'))}`);
})().catch((e) => { console.error('bake FAIL', e.stack || e.message); process.exit(1); });
