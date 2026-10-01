// docs/pins2/instruments/cites-check.cjs — does every `path:line` cite in the docs Sessions 4 and 5 read still point at what it names? Written 2026-09-29 12:14 EDT, class A of the sweep. paths-resolve.cjs proves a path exists; a cite also claims a LINE, and the kit moved from Version 35 to 40 under them. A line in range is nearly vacuous, so each cite is judged by the words beside it: every backticked token in the same table row or sentence (other than paths) is looked for within ±4 lines of the cited line. Verdicts: ok (a token sits at the line) · moved (a token is in the file, elsewhere: the nearest line is printed) · absent (no token anywhere in the file) · untestable (no token beside the cite: a claim nobody can check) · ambiguous (a bare filename several tracked files end with) · missing (no tracked file) · range (the line is past the file's end). Run: node docs/pins2/instruments/cites-check.cjs [doc ...]   ·   --all also lists untestable   ·   --selftest proves it can fail. Exit 1 when a cite in a live pins2 doc (the plan: only Sessions 4 and 5's sections) is anything but ok or untestable; the deferred list, DESIGN.md and the plan's history are reported with a · and never fatal.
const fs = require('fs'); const path = require('path'); const cp = require('child_process'); const os = require('os');
process.chdir(path.resolve(__dirname, '../../..'));
const LIVE = ['docs/pins2/README.md', 'docs/pins2/final/FINAL.md', 'docs/pins2/final/board4-spec/HANDOFF.md', 'docs/pins2/final/board4-spec/README.md', 'docs/pins2/plan/2026-09-13-portal-pins-batch-2.md', 'docs/pins2/instruments/README.md', 'docs/pins2/kit/README.md'];
// The deferred list and DESIGN.md are read by Session 5 too, but most of their cites are dated history (a line as it was when the entry was filed), so their moved/absent verdicts are reported and never fatal.
const WIDE = ['docs/db-deferred-list.md', 'DESIGN.md'];
const W = 4;
// The plan's cites outside Sessions 4 and 5's own sections describe the code as it stood when Sessions 1–3 ran: history, reported and never fatal.
const PLAN = 'docs/pins2/plan/2026-09-13-portal-pins-batch-2.md';
const PLAN_LIVE = /^(#{2,3}) (5c|5d|10\.5|10\.6|11|13)\b/;
function planLive(text, lineNo) {
  const L = text.split('\n');
  for (let i = lineNo - 1; i >= 0; i--) if (/^#{2,3} /.test(L[i])) return PLAN_LIVE.test(L[i]);
  return false;
}
// The kit is gitignored since 2026-09-30 21:13 EDT (his option c) with its own local git, so its files are added from that repo — before
// this, every cite into docs/pins2/kit/ read "missing" (readiness audit, 2026-10-01 10:54 EDT).
const kitFiles = (() => { try { return cp.execSync('git -C docs/pins2/kit ls-files -z', { maxBuffer: 1e9 }).toString().split('\0').filter(Boolean).map((f) => `docs/pins2/kit/${f}`); } catch { return []; } })();
const tracked = cp.execSync('git ls-files -z', { maxBuffer: 1e9 }).toString().split('\0').filter(Boolean).concat(kitFiles);
const cache = new Map();
const lines = (f) => { if (!cache.has(f)) cache.set(f, fs.readFileSync(f, 'utf8').split('\n')); return cache.get(f); };
const RE = /((?:\.\.?\/)*(?:[\w.@-]+\/)*[\w.@-]+\.(?:css|js|mjs|cjs|md|html|json)):(\d+)(?:\s*[-–]\s*(\d+))?/g;
const PATHISH = /\.(?:css|js|mjs|cjs|md|html|json)(?::\d+)?$|\//;
function resolve(p, doc) {
  if (p.startsWith('.')) { const r = path.normalize(path.join(path.dirname(doc), p)); return tracked.includes(r) ? [r] : []; }
  const hits = tracked.filter((f) => f === p || f.endsWith('/' + p));
  // A bare filename in these records means the product's file when exactly one product file has that name: the kit's ui/ is a copy of portal/ui and the mockup packages carry their own app.css, so without this every bare cite became ambiguous the day the kit was tracked. Two product files of one name (portal/ui/armory.js, portal/api/armory.js) stay ambiguous: that one only the doc can settle.
  if (!p.includes('/') && hits.length > 1) { const prod = hits.filter((f) => !f.startsWith('docs/')); if (prod.length === 1) return prod; }
  return hits;
}
// The words beside a cite are its own doc line (a table row, or a soft-wrapped paragraph), and within that line the 240 characters either side: a wider window lets a neighbouring row's token vouch for this one, which the selftest's "none" row exists to catch.
function tokensNear(text, at, len) {
  const ls = text.lastIndexOf('\n', at) + 1; const le = text.indexOf('\n', at + len); const lineEnd = le < 0 ? text.length : le;
  const lo = Math.max(ls, at - 240); const hi = Math.min(lineEnd, at + len + 240);
  const win = text.slice(lo, hi); const out = new Set();
  for (const m of win.matchAll(/`([^`\n]{3,80})`/g)) {
    let t = m[1].trim();
    if (PATHISH.test(t) && !/^[.#]?[\w-]+$/.test(t)) continue;
    t = t.replace(/\(\)$/, '');
    // `:730` beside a cite is another line of the same file, not a token to find.
    if (/^:\d+/.test(t)) continue;
    if (t.length >= 3) out.add(t);
    // `--patch: #F2C230` names two things a line may hold apart or unspaced; each part is a token too.
    for (const part of t.split(/[\s,;]+/)) { const q = part.replace(/:$/, ''); if (q.length >= 3 && q !== t) out.add(q); }
  }
  return [...out];
}
function judge(file, a, b, toks) {
  const L = lines(file);
  if (a < 1 || a > L.length || (b && b > L.length)) return { v: 'range', detail: `${L.length} lines` };
  if (!toks.length) return { v: 'untestable' };
  const lo = Math.max(0, a - 1 - W); const hi = Math.min(L.length, (b || a) + W);
  const sq = (x) => x.replace(/\s+/g, '');
  const has = (l, t) => l.includes(t) || sq(l).includes(sq(t));
  for (let i = lo; i < hi; i++) for (const t of toks) if (has(L[i], t)) return { v: 'ok', detail: `${t} @${i + 1}` };
  let best = null;
  L.forEach((l, i) => { for (const t of toks) if (has(l, t)) { const d = Math.abs(i + 1 - a); if (!best || d < best.d) best = { d, i: i + 1, t }; } });
  return best ? { v: 'moved', detail: `${best.t} nearest @${best.i}` } : { v: 'absent', detail: toks.slice(0, 3).join(' · ') };
}
function check(doc, text) {
  const res = [];
  for (const m of text.matchAll(RE)) {
    const [whole, p, a, b] = m; const hits = resolve(p, doc);
    const toks = tokensNear(text, m.index, whole.length).filter((t) => !t.includes(p));
    const line = text.slice(0, m.index).split('\n').length;
    if (!hits.length) { res.push({ doc, line, cite: whole, v: 'missing' }); continue; }
    if (new Set(hits).size > 1) { res.push({ doc, line, cite: whole, v: 'ambiguous', detail: hits.slice(0, 4).join(' | ') }); continue; }
    res.push({ doc, line, cite: whole, file: hits[0], ...judge(hits[0], +a, b ? +b : 0, toks) });
  }
  return res;
}
function selftest() {
  const f = 'docs/pins2/kit/ui/broadcast.js'; const L = lines(f);
  const n = L.findIndex((l) => l.includes('export const POSTED_LINE')) + 1;
  if (n < 1) { console.error('selftest: anchor gone'); process.exit(2); }
  const far = n + 40 <= L.length ? n + 40 : n - 40;
  const doc = path.join(os.tmpdir(), 'cites-selftest.md');
  const text = [`| good | \`${f}:${n}\` holds \`POSTED_LINE\` |`, `| shifted | \`${f}:${far}\` holds \`POSTED_LINE\` |`, `| bare | \`broadcast.js:${n}\` holds \`POSTED_LINE\` |`, `| none | \`${f}:${n}\` and nothing else |`, `| past | \`${f}:${L.length + 5}\` holds \`POSTED_LINE\` |`].join('\n');
  const got = check(doc, text).map((r) => r.v);
  const want = ['ok', 'moved', 'ambiguous', 'untestable', 'range'];
  const pass = JSON.stringify(got) === JSON.stringify(want);
  console.log(`selftest: want ${want.join(',')} · got ${got.join(',')} → ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}
if (process.argv.includes('--selftest')) selftest();
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const docs = args.length ? args : [...LIVE, ...WIDE];
const all = process.argv.includes('--all');
let fatal = 0; const tally = {};
for (const doc of docs) {
  const res = check(doc, fs.readFileSync(doc, 'utf8'));
  const by = {}; res.forEach((r) => { by[r.v] = (by[r.v] || 0) + 1; tally[r.v] = (tally[r.v] || 0) + 1; });
  console.log(`${doc}: ${res.length} cites · ${Object.entries(by).map(([k, v]) => `${v} ${k}`).join(' · ') || 'none'}`);
  for (const r of res) {
    const strict = !WIDE.includes(doc) && (doc !== PLAN || planLive(fs.readFileSync(doc, 'utf8'), r.line));
    const bad = strict && ['missing', 'range', 'ambiguous', 'moved', 'absent'].includes(r.v);
    if (bad) fatal++;
    if (r.v !== 'ok' && (r.v !== 'untestable' || all)) console.log(`  ${bad ? '✗' : '·'} ${r.v.padEnd(10)} ${doc}:${r.line}  ${r.cite}${r.detail ? '  (' + r.detail + ')' : ''}`);
  }
}
console.log(`\n${Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(' · ')} — ${fatal} fatal`);
process.exit(fatal ? 1 : 0);
