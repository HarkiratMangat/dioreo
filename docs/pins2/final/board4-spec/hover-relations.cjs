// Board 4's HOVER RELATIONS — hovering one element restyles ANOTHER. The value files force :hover, :focus and :active on each element itself, so
// "hovering a list row turns its tick into the ×", "hovering a Same chip lights its row" or "a badge hovered hides the badges after it" appear in no
// value table: the hovered thing and the styled thing are different elements. Written 2026-09-29 23:26 EDT in the Session 4/5 readiness pass.
// Static: every rule in the kit's stylesheets whose :hover / :focus-visible / :focus-within / :active sits on a compound that is NOT the rule's subject.
// (JS-driven hovers — Compare's lighting through `hc`, the badge pop's state — are in HANDOFF.md, and relations.cjs measures them with a real mouse.)
// Usage: node hover-relations.cjs → writes hover-relations.md beside it
const KITC = require('./kit.cjs'); // which board: Collective's kit, or Final after a bake (kit.cjs)
const fs = require('fs'); const path = require('path');
const KIT = KITC.DIR;
const FILES = ['app.css', 'gates.css', 'b4.css', 'b1.css', 'b2.css', 'b3/board.css', 'b4/classes.css', 'b4/compare.css', 'b4/form.css', 'b4/bulk.css'];
const STATE = /:(hover|focus-visible|focus-within|active)\b/;
const rows = [];
for (const f of FILES) {
  const src = fs.readFileSync(path.join(KIT, f), 'utf8'); const css = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const re = /([^{}@]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(css))) {
    const line = css.slice(0, m.index + m[0].indexOf(m[1].trim())).split('\n').length;
    for (const sel of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!STATE.test(sel)) continue;
      // the subject is the last compound; a state pseudo-class outside it means another element's state styles this one
      const parts = sel.replace(/\s*([>+~])\s*/g, ' $1 ').split(/\s+/).filter((x) => !['>', '+', '~'].includes(x));
      const subject = parts[parts.length - 1] || '';
      const outside = parts.slice(0, -1).some((p) => STATE.test(p)) || /:has\([^)]*:(hover|focus-visible|active)/.test(sel);
      if (!outside || STATE.test(subject.replace(/:not\([^)]*\)/g, '').replace(/:has\([^)]*\)/g, '')) && !parts.slice(0, -1).some((p) => STATE.test(p))) continue;
      rows.push({ f, line, sel: sel.replace(/\s+/g, ' '), decl: m[2].replace(/\s+/g, ' ').trim().slice(0, 180) });
    }
  }
}
const byFile = {}; rows.forEach((r) => { (byFile[r.f] = byFile[r.f] || []).push(r); });
const out = ['---', 'kind: reference', 'status: live', '---', '', '# ' + KITC.TITLE + ' — hover relations', '',
  `*Generated ${new Date().toISOString()} by \`hover-relations.cjs\` from the kit's stylesheets. ${rows.length} rules in which one element's hover, focus or press restyles another element — the relations the value files cannot show, because they force states on each element alone. A port that copies only per-element values loses every one of these. JS-driven hovers (Compare's lighting, the badge pop) are in HANDOFF.md and measured with a real mouse in relations.cjs.*`, ''];
for (const [f, rs] of Object.entries(byFile)) { out.push(`## \`${f}\` — ${rs.length}`, '', '| Line | Selector | Declarations |', '|---|---|---|'); rs.forEach((r) => out.push(`| ${r.line} | \`${r.sel.replace(/\|/g, '\\|')}\` | ${r.decl.replace(/\|/g, '\\|')} |`)); out.push(''); }
fs.writeFileSync(path.join(__dirname, 'hover-relations.md'), out.join('\n'));
console.log(JSON.stringify({ out: 'hover-relations.md', rules: rows.length, files: Object.fromEntries(Object.entries(byFile).map(([k, v]) => [k, v.length])) }));
