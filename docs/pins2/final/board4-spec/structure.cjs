// Board 4's STRUCTURE, generated: every gate's stage as an outline of its elements (tag, classes, role, name), at rest and in each state,
// repeats collapsed. Written 2026-09-29 19:13 EDT: HANDOFF.md's Structure rows pointed at handoffs written for boards 1–3, so no file said
// what Board 4 itself is made of. The per-gate summaries in HANDOFF.md are authored FROM this file; this file is the evidence.
// Usage (the kit served on :8900): node structure.cjs  → writes structure.md beside it.
const KITC = require('./kit.cjs'); // which board: Collective's kit, or Final after a bake (kit.cjs)
const fs = require('fs'); const path = require('path');
const { GATES, STAGE, sleep, open, actions, act } = require('./board4-walk.cjs');
const outline = (p, scope, depth, cap) => p.evaluate((scope, depth, cap) => {
  const root = document.querySelector(scope); if (!root) return null;
  const sig = (e) => { const c = (e.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
    const nm = e.getAttribute('aria-label'); return e.tagName.toLowerCase() + (c.length ? '.' + c.join('.') : '') + (e.getAttribute('role') ? `[role=${e.getAttribute('role')}]` : '') + (nm ? ` “${nm.slice(0, 40)}”` : ''); };
  const vis = (e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && !(e.getBoundingClientRect().width === 0 && e.getBoundingClientRect().height === 0 && cs.position !== 'fixed'); };
  const lines = [];
  const walk = (e, d) => {
    if (lines.length >= cap) return;
    const kids = [...e.children].filter((k) => !['SCRIPT', 'STYLE'].includes(k.tagName) && vis(k));
    for (let i = 0; i < kids.length && lines.length < cap;) {
      const k = kids[i]; const s = sig(k); let n = 1; while (kids[i + n] && sig(kids[i + n]).split(' “')[0] === s.split(' “')[0]) n++;
      const leaf = k.tagName.toLowerCase() === 'svg' || !k.children.length;
      const t = leaf && k.tagName.toLowerCase() !== 'svg' ? (k.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28) : '';
      lines.push(`${'  '.repeat(d)}- \`${s.replace(/`/g, '')}\`${n > 1 ? ` ×${n}` : ''}${t ? ` — “${t}”` : ''}`);
      if (!leaf && k.tagName.toLowerCase() !== 'svg' && d < depth) walk(k, d + 1);
      i += n;
    }
  };
  walk(root, 0);
  return { lines, cut: lines.length >= cap };
}, scope, depth, cap);
(async () => {
  const { b, p, errs } = await open();
  const out = ['---', 'kind: reference', 'status: live', '---', '', '# ' + KITC.TITLE + ' — structure, generated', '',
    `*Generated ${new Date().toISOString()} by \`structure.cjs\` from the running kit at 1282×888. Every gate's stage as an outline: each line is an element (tag, classes, role, accessible label), siblings with the same classes collapsed to ×N, a leaf's text after the dash. Resting at depth 8; each state or Try at depth 6, printed only where it differs from resting. Read HANDOFF.md's per-gate Structure rows first — they are written from this file.*`, ''];
  let states = 0;
  for (const [g, id, title] of GATES) {
    out.push(`## ${g} · ${title}`, '');
    const rest = await outline(p, STAGE(id), 8, 260);
    out.push('### Resting', '', ...(rest ? rest.lines : ['*(stage not found)*']), ...(rest && rest.cut ? ['', '*…cut at 260 lines*'] : []), '');
    for (const [kind, i, label] of await actions(p, id)) {
      if (kind === 'state' && i === 0) continue;
      await act(p, id, kind, i); states++;
      const o = await outline(p, STAGE(id), 6, 200);
      const same = o && rest && o.lines.join('\n') === rest.lines.slice(0, o.lines.length).join('\n');
      out.push(`### ${kind === 'state' ? 'State' : 'Try'} · ${label}`, '', ...(same ? ['*same outline as resting*'] : o ? o.lines : ['*(stage not found)*']), ...(o && o.cut ? ['', '*…cut at 200 lines*'] : []), '');
    }
    const first = (await actions(p, id)).find(([k, i]) => k === 'state' && i === 0); if (first) await act(p, id, 'state', 0);
  }
  out.push(`*${states} states and Try steps walked. Page errors: ${errs.length}.*`);
  fs.writeFileSync(path.join(__dirname, 'structure.md'), out.join('\n') + '\n');
  console.log(JSON.stringify({ out: 'structure.md', states, errs: errs.length }));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
