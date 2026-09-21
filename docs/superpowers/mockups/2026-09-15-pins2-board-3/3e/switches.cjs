// Board 3-E's SWITCHES — generated map of every option the board can show, and which one it holds.
// Run: node docs/superpowers/mockups/2026-09-15-pins2-board-3/3e/switches.cjs  (writes switches.md beside it)
// 🔴 WHY THIS EXISTS (2026-09-21 10:12 EDT): the kit keeps EVERY option of every fork in its CSS and JS, keyed on
// `html[data-b3-<key>="<value>"]` selectors and `useB3('<key>')` branches. Only the value the board holds renders. A port
// that copies a rule or a hunk without checking its switch ships a losing option — 256 of 415 keyed selectors are dead.
// RE-RUN IT whenever a switch's value changes (Session 4 deciding p10 or e1–e6 is exactly that), then re-run extract-spec.cjs.
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '../../../../..'); const KIT = path.join(ROOT, 'local/pins2-board-3/redo');
const src = fs.readFileSync(path.join(KIT, 'b3/state.js'), 'utf8');
const D = eval('(' + src.match(/DEFAULTS\s*=\s*(\{[\s\S]*?\n\});/)[1] + ')');
// Who ruled each switch. handoff-3e.md §4 / §4b are the authority; OPEN means the value on the board is NOT a decision.
const RULED = { p2pal: 'ruled §4', p2lab: 'ruled §4', p2sty: 'ruled §4 (Outline kept in files, unported)', p3: 'ruled §4', p3tbl: 'ruled §4', p4: 'ruled §4 (db)',
  p5bg: 'ruled §4 (db; Solid kept in files as a future setting)', p5hint: 'ruled §4 (db)', hzf: 'ruled §4', sdgh: 'ruled §4 — 44, his words outrank the db\'s 48',
  e2spd: 'ruled §4 (db)', p6: 'ruled §4 (db)', p6lay: 'ruled §4 (db)', exp: 'ruled §4', expl: 'ruled §4 (db)', xbg: 'ruled §4 (db)', p8: 'ruled §4 (db)', p9: 'ruled §4 (db)',
  p1: '§4b — the fork DISSOLVED; `a` is the surviving mark, motion unscoped', p5list: '§4b — both views ship', p5: 'the M1 selection bar as board 3 rebuilt it — `new` is the only value the kit offers besides `now`; NO fork record, inferred from the kit',
  p6day: 'board data switch — `real` is the portal\'s own data; chrome', g9: 'board 1 · G9 drawer, answered 2026-09-14 01:18 EDT (plan §9 G9) — `board1` renders that answer', a1: 'the fixed section treatment — NO fork record; inferred from the kit, where every gate renders under it',
  p7: 'P7 Command search — "Build it properly, and exactly as shown"', p10: '⏳ OPEN — Session 4 · G1 (small text). The board value is NOT a decision',
  e1: '⏳ OPEN — Session 4 · §5c (E1–E6 withdrawn 2026-09-15)', e2: '⏳ OPEN — Session 4', e3: '⏳ OPEN — Session 4', e4: '⏳ OPEN — Session 4', e5: '⏳ OPEN — Session 4', e6: '⏳ OPEN — Session 4',
  section: 'board chrome — which gate is open', xtile: 'withdrawn v40–41; rounds 5T/5V dead', b1: 'board chrome', b2: 'board chrome', g8: 'settled on board 1 · G8', h1L: 'H1 spacing — §6', };
const css = {}; for (const f of ['b3/board.css', 'gates.css', 'b2.css']) css[f] = fs.readFileSync(path.join(KIT, f), 'utf8');
const sel = {}; for (const [f, s] of Object.entries(css)) s.split('\n').forEach((line, i) => { for (const m of line.matchAll(/data-b3-([\w-]+)(?:\s*=\s*"?([\w-]+)"?)?\]/g)) {
  const k = m[1], v = m[2] || '(present)'; const e = sel[k] = sel[k] || {}; (e[v] = e[v] || []).push(`${f}:${i + 1}`); } });
const js = {}; for (const dir of ['ui', 'b3', 'gates', 'cmp']) { const d = path.join(KIT, dir); if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.js'))) fs.readFileSync(path.join(d, f), 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/(?:useB3|\bb3)\(\s*'([\w-]+)'\s*\)/g)) (js[m[1]] = js[m[1]] || []).push(`${dir}/${f}:${i + 1}`); }); }
const keys = [...new Set([...Object.keys(sel), ...Object.keys(js)])].filter((k) => !/^h1/.test(k)).sort();
let live = 0, dead = 0;
const rows = keys.map((k) => { const cur = D[k]; const vals = sel[k] || {};
  const lv = Object.entries(vals).filter(([v]) => v === '(present)' || String(cur) === v); const dv = Object.entries(vals).filter(([v]) => v !== '(present)' && String(cur) !== v);
  lv.forEach(([, l]) => { live += l.length; }); dv.forEach(([, l]) => { dead += l.length; });
  const fmt = (arr) => arr.map(([v, l]) => `\`${v}\` ×${l.length} (${l.slice(0, 3).join(', ')}${l.length > 3 ? ', …' : ''})`).join('<br>') || '—';
  return `| \`${k}\` | \`${JSON.stringify(cur)}\` | ${RULED[k] || '⚠️ unexplained — ask before porting'} | ${fmt(lv)} | ${fmt(dv)} | ${(js[k] || []).slice(0, 6).join('<br>') || '—'} |`; });
const out = ['---', 'kind: reference', 'status: live', '---', '', '# Board 3-E — the switches, and which option the board holds', '',
  `*Generated ${new Date().toISOString()} by \`switches.cjs\` from the kit's \`b3/state.js\` DEFAULTS, \`b3/board.css\`, \`gates.css\`, \`b2.css\` and every \`useB3\`/\`b3()\` call. **${live} keyed selectors are live and ${dead} are dead** under the values below.*`, '',
  '## How to port a switched rule or branch', '',
  '1. **Live** — the selector\'s value is the one the board holds. Port the rule **without** its `html[data-b3-…]` qualifier: the portal has one design, not a switchboard.',
  '2. **Dead** — never port. It is a losing option, and it is kept in the kit only so the board can still show it.',
  '3. **A JS branch** `useB3(\'k\') === v ? A : B` collapses to the arm the board holds. The `useB3` call and the `../b3/state.js` import are deleted, never ported.',
  '4. **⏳ OPEN** — the board holds a value, but it is NOT his decision. Session 4 decides it. If Session 4 picks another value: change DEFAULTS in the kit, re-run this script, `extract-spec.cjs` and `measure.cjs`, and commit the regenerated files — the spec is stale until then.',
  '5. **Kept in files at his request** (Outline, Solid ground) — the dead rule is preserved in the PORTAL too, commented as unshipped, never deleted.', '',
  '| Switch | Board holds | Who ruled it | Live selectors | Dead selectors — do not port | JS branches |', '|---|---|---|---|---|---|', ...rows, ''];
fs.writeFileSync(path.join(__dirname, 'switches.md'), out.join('\n'));
console.log(JSON.stringify({ keys: keys.length, live, dead, unexplained: keys.filter((k) => !RULED[k]) }));
