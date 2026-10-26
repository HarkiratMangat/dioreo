// Lineage of every board-3 value that descends from a board-2 design — generated.
// Run: node docs/pins2/final/lineage.cjs   (writes lineage.md beside it)
// 🔴 WHY (2026-09-21 10:56 EDT). Board 3's kit runs Session 2's portal code, so a board-3 surface that board 2 designed first shows
// Session 2's PORT wherever board 3 did not write its own rule — and Harkirat's rule is that the port is never an authority: "the final
// product in the portal should be the CORRECT, non-buggy versions of the finalized designs." This compares, element by element, every
// board-3 value against the board-2 value it descends from, and sorts each difference by WHERE the board-3 value came from:
//   PORT   — a line Session 2 wrote in portal/ui/app.css (git blame, commits 06acb2f1..219dc509). Board 2's value wins unless it is noise.
//   BOARD3 — board 3's own stylesheets (b3/board.css, gates.css). A deliberate board-3 change: board 3 wins.
//   BOARD2 — b2.css, board 2's own rules carried onto board 3. Board 2's value, by definition.
//   OLDER  — a portal line older than Session 2. Neither board set it on this element; look before trusting either side.
// KIND says whether a row can be a design difference at all: STAGE (a width that follows the gate's own width), UA (one side is an
// unstyled browser default), GENERIC (board 2 never styled the element; a bare portal element rule did), HUE (per-row colour), else DESIGN.
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
// docs/pins2/final since 2026-09-28 23:16 EDT
const ROOT = path.resolve(__dirname, '../../..'); process.chdir(ROOT);
const MK = 'docs/superpowers/mockups/';
const S2 = new Set(execSync('git log --format=%H 06acb2f1..219dc509 -- portal/ui/app.css portal/ui/tokens.css portal/ui/v2card.css').toString().trim().split('\n'));
const norm = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
const index = {};
for (const f of ['portal/ui/app.css', 'portal/ui/tokens.css', 'portal/ui/v2card.css']) {
  if (!fs.existsSync(f)) continue;
  const lines = execSync(`git blame --line-porcelain "${f}"`, { maxBuffer: 1e9 }).toString().split('\n'); const b = []; let c = null;
  for (const l of lines) { const m = l.match(/^([0-9a-f]{40}) \d+ \d+/); if (m) { c = m[1]; continue; } if (l.startsWith('\t')) b.push([c, l.slice(1)]); }
  let sel = '', buf = [];
  for (const [c2, t] of b) {
    if (!sel) { buf.push(t); if (t.includes('{')) { sel = norm(buf.join(' ').split('{')[0]); buf = []; index[sel] = index[sel] || []; const rest = t.split('{')[1] || ''; if (rest.trim()) index[sel].push([c2, rest]); if (t.includes('}')) sel = ''; } continue; }
    index[sel].push([c2, t]); if (t.includes('}')) sel = '';
  }
}
// A longhand row is usually set by its shorthand (`padding-top` by `padding`), so the blame looks for both.
const SHORT = (p) => [...new Set([p, p.replace(/^(column|row)-gap$/, 'gap'), p.replace(/-(top|right|bottom|left)$/, ''), p.replace(/^(background|border|font|outline|grid-template|text-decoration)-.*$/, '$1'),
  p.replace(/^(padding|margin)-(top|bottom)$/, '$1-block').replace(/^(padding|margin)-(left|right)$/, '$1-inline')])];
const origin = (from, prop) => {
  if (/b3\/board\.css|gates\.css/.test(from)) return 'BOARD3';
  if (/b2\.css/.test(from)) return 'BOARD2';
  const m = from.match(/^(?:inherited · )?(.*?) · app\.css:\d+/); if (!m) return /user-agent/.test(from) ? 'UA' : 'OTHER';
  const rule = index[norm(m[1].replace(/\\\|/g, '|'))]; if (!rule) return 'OLDER?';
  for (const p of SHORT(prop)) { const hit = rule.find(([, t]) => new RegExp('(^|[;{\\s])' + p.replace(/-/g, '\\-') + '\\s*:').test(t)); if (hit) return S2.has(hit[0]) ? 'PORT' : 'OLDER'; }
  return 'OLDER?';
};
const parse = (file, secRe) => { const out = {}; let cur = null, on = !secRe;
  for (const l of fs.readFileSync(file, 'utf8').split('\n')) { if (/^## /.test(l)) on = !secRe || secRe.test(l); if (!on) continue;
    const h = l.match(/^### `([^`]+)`/); if (h) { cur = h[1]; continue; }
    if (cur && /^#### look \d+ of (\d+)/.test(l)) { out[cur] = out[cur] || {}; out[cur].__looks = Number(l.match(/of (\d+)/)[1]); }
    const m = l.match(/^\| ([\w-]+) \| (?:↑ )?`([^`]*)` \| `([^`]*)` \| (.*)\|$/); if (m && cur) { out[cur] = out[cur] || {}; if (!(m[1] in out[cur])) out[cur][m[1]] = { comp: m[3], from: m[4].trim() }; } }
  return out; };
const cls = (sig) => sig.split('.').slice(1).map((c) => c.replace(/\[.*$/, ''));
const B3 = `${MK}2026-09-15-pins2-board-3/3e/resolved-spec/`; const B2 = `${MK}2026-09-14-pins2-board-2/resolved-spec-full.md`;
const PAIRS = [
  ['M1 · the Armory manifest', `${B3}M1-armory-manifest.md`, 'board 2 · G4', /G4/],
  ['H1 · the History manifest', `${B3}H1-history.md`, 'board 2 · G11 and the shared tools row', /G11|G4/],
  ['B1 · the delivery-queue card', `${B3}B1-delivery-queue.md`, 'board 2 · G3', /G3/],
];
// Board 3 named some elements differently from board 2. Each alias below was read off both boards' markup, 2026-09-21 10:59 EDT.
const ALIAS = { 'wg-r': 'pb-rb', 'wg-h': 'pb-gh', 'wg-line': 'pb-gline', 'wg-code': 'pb-igw', 'wg-wrap': 'pb-man', 'mt-r1': 'pb-t1', 'mt-r2': 'pb-t2', 'mt-grp': 'pb-grp', mtools: 'pb-tools' };
const out = ['---', 'kind: reference', 'status: live', '---', '', '# Lineage — board-3 values against the board-2 designs they descend from', '',
  `*Generated ${new Date().toISOString()} by \`lineage.cjs\`. Read [\`FINAL.md\`](FINAL.md) first; this is its appendix. Session 2's commits on the portal stylesheets: ${S2.size}.*`, ''];
const totals = {};
for (const [name, f3, bname, sec] of PAIRS) {
  const b3 = parse(f3), b2 = parse(B2, sec);
  const byCls = {}; for (const s of Object.keys(b2)) for (const c of cls(s)) if (c.startsWith('pb-')) (byCls[c] = byCls[c] || []).push(s);
  const rows = []; const unpaired = new Set(); let paired = 0;
  for (const s of Object.keys(b3)) {
    const c = cls(s).find((x) => !/^(b3|g)-/.test(x) && (/-/.test(x) || ALIAS[x])); if (!c) continue;
    // Same class on both boards (board 3 carries some of board 2's own pb- classes), else the alias, else wg-x ↔ pb-x.
    const cand = byCls[c] || byCls[ALIAS[c]] || byCls['pb-' + c.replace(/^[a-z0-9]+-/, '')] || [];
    if (!cand.length) { unpaired.add(c); continue; } paired++;
    // The same TAG too: an svg inside a button is not the button (the first run paired `svg.ic-fold` with `button.pb-fold`).
    // Among same-tag candidates, the one that shares the most state classes (`bad`, `go`, `dmz` …) — a plain count must not be compared
    // with board 2's problem-count variant (the first run did exactly that and called its amber a port loss).
    const plain = (x) => new Set(cls(x).map((k) => k.replace(/^(pb|wg|mt)-/, '')));
    const mine = plain(s); const same = cand.filter((x) => x.split('.')[0] === s.split('.')[0]);
    const best = same.sort((a, b2x) => { const sc = (x) => [...plain(x)].filter((k) => mine.has(k)).length - [...plain(x)].filter((k) => !mine.has(k)).length; return sc(b2x) - sc(a); })[0];
    const t = b2[best || '']; if (!t) { unpaired.add(c); paired--; continue; }
    for (const [p, v] of Object.entries(b3[s])) { if (p === '__looks') continue; const w = t[p]; if (!w || w.comp === v.comp) continue;
      const o = origin(v.from, p);
      const kind = /width|grid-template-columns|inset|^left$|^right$/.test(p) && /\d{3,}(\.\d+)?px/.test(w.comp + v.comp) ? 'STAGE'
        : (/user-agent/.test(w.from) || /user-agent/.test(v.from)) ? 'UA'
        // Board 2 set nothing for this element: its value came from a bare element rule (`input, select, textarea, button`) in the portal's stylesheet.
        : !/\.pb-|\.bad|\.go|\.no/.test(w.from.split(' · ')[0]) && /app\.css/.test(w.from) ? 'GENERIC'
        // A per-row colour: board 2 draws several weapons in different hues, so its first look and board 3's first look are different rows.
        : /color|background/.test(p) && ((t.__looks || 1) > 1 || (b3[s].__looks || 1) > 1) ? 'HUE' : 'DESIGN';
      const verdict = o === 'BOARD3' ? 'board 3 changed it — **board 3**' : o === 'BOARD2' ? 'board 2 rule — **board 2**'
        : kind === 'STAGE' ? 'gate width — not a design value' : kind === 'UA' ? 'browser default on one side — check on the page'
        : kind === 'GENERIC' ? 'board 2 did not style it — not a design value' : kind === 'HUE' ? 'a different row\'s colour — compare the same weapon'
        : o === 'PORT' ? '**board 2** — the port lost it' : 'older portal rule — **board 2** unless he ruled otherwise on board 3';
      rows.push(`| \`${s.slice(0, 44)}\` | \`${best.slice(0, 36)}\` | ${p} | \`${w.comp.slice(0, 40)}\` | \`${v.comp.slice(0, 40)}\` | ${o} | ${kind} | ${verdict} |`);
      totals[`${o}/${kind}`] = (totals[`${o}/${kind}`] || 0) + 1; } }
  out.push(`## ${name} ← ${bname}`, '', `${paired} board-3 signatures paired with a board-2 element by class (the same class, the alias table in \`lineage.cjs\`, else \`wg-x\` ↔ \`pb-x\`). **${rows.length} property differences.**${unpaired.size ? ` Not paired by name — compare these by eye, or through \`../2026-09-14-pins2-board-2/port-g4-g3-g11.md\`: ${[...unpaired].map((x) => '`' + x + '`').join(' ')}.` : ''}`, '',
    '| Board 3 element | Board 2 element | Property | Board 2 | Board 3 | Board-3 value from | Kind | Ships |', '|---|---|---|---|---|---|---|---|', ...rows, '');
}
fs.writeFileSync(path.join(__dirname, 'lineage.md'), out.join('\n'));
console.log(JSON.stringify(totals));
