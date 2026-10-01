// Board 3-E's rules on SHIPPED PORTAL classes — generated. Run: node docs/pins2/final/board4-spec/overrides.cjs
// 🔴 WHY (2026-09-21 10:24 EDT, Harkirat: "did your extractor consider the tweaks/corrections of what was actually shipped into the
// portal from board 1 and 2 … Will session 5 be able to actually go and repair those previous designs and make them 100% now?")
// Board 3's kit runs the portal's own code AFTER Session 2 shipped boards 1 and 2. Where he corrected that shipped design, the
// correction is a rule in the BOARD's stylesheets (b3/board.css, gates.css, b2.css) whose selector names only portal classes
// (.wg-*, .mt-*, .chip, .stt …). portal-diff.md cannot see them (it diffs ui/*.js and app.css), class-map.md skips them (it lists
// board-only classes), and resolved-spec/ scatters them across 1.4 MB as `from: b3/board.css:NNNN`. This lists every one, live or
// dead under switches.md, so each is a line Session 5 moves into portal/ui/app.css.
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '../../../..'); const KIT = path.join(ROOT, 'docs/pins2/kit');
const src = fs.readFileSync(path.join(KIT, 'b3/state.js'), 'utf8');
const D = eval('(' + src.match(/DEFAULTS\s*=\s*(\{[\s\S]*?\n\});/)[1] + ')');
const BOARD = /^(b3|pb|g|exs|gn|dk|lab|gate|l1|mk)-/;
const rows = []; let live = 0, dead = 0, open = 0;
for (const f of ['b3/board.css', 'gates.css', 'b2.css']) {
  const raw = fs.readFileSync(path.join(KIT, f), 'utf8');
  const s = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(s))) {
    const sel = m[1].trim(); if (!sel || sel.startsWith('@') || /^(from|to|\d+%)/.test(sel)) continue;
    const parts = sel.split(',').map((x) => x.trim());
    const portalOnly = parts.some((p) => { const cls = [...p.matchAll(/\.([\w-]+)/g)].map((x) => x[1]); return cls.length && cls.every((c) => !BOARD.test(c) && !/^(g|dk|gn|g-stage|pb-stage)$/.test(c)); });
    if (!portalOnly || /#g-|\.g-stage|\.pb-stage/.test(sel) && !parts.some((p) => !/#g-|\.g-stage|\.pb-stage/.test(p))) continue;
    const sw = [...sel.matchAll(/data-b3-([\w-]+)(?:\s*=\s*"?([\w-]+)"?)?\]/g)].map((x) => [x[1], x[2]]);
    const isDead = sw.some(([k, v]) => v && String(D[k]) !== v); const isOpen = sw.some(([k]) => /^(p10|e[1-6])$/.test(k));
    const line = raw.slice(0, m.index + m[0].indexOf(m[1].trim())).split('\n').length;
    if (isDead) { dead++; continue; }
    live++; if (isOpen) open++;
    rows.push(`| \`${f}:${line}\` | \`${sel.replace(/\s+/g, ' ').replace(/\|/g, '\\|').slice(0, 160)}\` | ${m[2].trim().replace(/\s+/g, ' ').replace(/\|/g, '\\|').slice(0, 220)} | ${isOpen ? '⏳ Session 4' : sw.length ? 'live switch — drop the qualifier' : 'unswitched'} |`);
  }
}
const out = ['---', 'kind: reference', 'status: live', '---', '', '# Board 3-E — its rules on SHIPPED portal classes', '',
  `*Generated ${new Date().toISOString()} by \`overrides.cjs\`. **${live} live rules** (${open} of them ⏳ Session 4's) restyle classes the portal already ships; ${dead} more are losing options and are not listed.*`, '',
  '**This is where the corrections to boards 1 and 2 live.** Session 2 shipped board 1 and board 2 at ~95%; board 3 ran the portal\'s own code and corrected the rest with rules like these. Each row is a change to `portal/ui/app.css` (or `tokens.css`): find the portal rule for the same selector, change it to this, and close the element with `portalProbe` against board 3.', '',
  '⚠️ Board 3 applied these ON TOP of the portal\'s cascade, so a row can win only because the board stylesheet loads last. When moving it into `app.css`, replace the portal\'s own declaration rather than appending a second rule, and re-probe.', '',
  '| Kit source | Selector | Declarations | Switch |', '|---|---|---|---|', ...rows, ''];
// OUT_DIR (2026-09-27 02:43 EDT): Board 4 writes beside its own spec (docs/pins2/final/board4-spec/), so Board 3-E's record is not overwritten.
fs.writeFileSync(path.join(process.env.OUT_DIR || __dirname, 'portal-class-rules.md'), out.join('\n').replace(/^# Board 3-E/m, '# Board 4: Collective (the kit Board 3-E shares)'));
console.log(JSON.stringify({ live, dead, open }));
