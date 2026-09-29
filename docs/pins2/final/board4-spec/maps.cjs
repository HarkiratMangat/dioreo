// Board 4: Collective — the four maps a port needs beside the resolved values, GENERATED so they can be re-run after any kit change.
// Run: node docs/pins2/final/board4-spec/maps.cjs   (writes file-map.md, portal-diff.md, class-map.md, token-map.md beside it)
// 🔴 WHY (2026-09-27 02:43 EDT): Board 4's first spec pointed Session 5 at Board 3-E's maps (../../2026-09-15-pins2-board-3/3e/), which were written
// before Board 4 existed and hold none of its classes (.bk-*, .cx-*, .pb-chars, .f-stage, .b3-fadx, .b3-mdw …; counted 0 of 15 families).
// Board 3-E's maps were made once, by hand, with no script; these are made by this file so they cannot go stale silently.
//   file-map.md    every kit file and what a port does with it — Board 3-E's reviewed label where the file already existed there, a stated rule otherwise
//   portal-diff.md the kit's copies of portal files, as unified diffs against the portal (the exact change, not a description of it)
//   class-map.md   every class the Board 4 spec renders that no portal stylesheet defines, with the kit file:line that does
//   token-map.md   every custom property the Board 4 spec reads that the portal does not define, with the kit's definition
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
// docs/pins2/final/board4-spec since 2026-09-28 23:16 EDT (it was one level deeper under docs/superpowers/mockups/) const KIT = path.join(ROOT, 'local/pins2-board-3/redo'); const PORTAL = path.join(ROOT, 'portal');
const ROOT = path.resolve(__dirname, '../../../..'); const KIT = path.join(ROOT, 'local/pins2-board-3/redo'); const PORTAL = path.join(ROOT, 'portal');
const MAP3E = path.join(ROOT, 'docs/superpowers/mockups/2026-09-15-pins2-board-3/3e/file-map.md');
const STAMP = new Date().toISOString();
const kitHead = (() => { try { return execFileSync('git', ['-C', KIT, 'log', '-1', '--format=%h'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } })();
const fm = (title, lead) => ['---', 'kind: reference', 'status: live', '---', '', `# Board 4: Collective — ${title}`, '', `*Generated ${STAMP} by \`maps.cjs\` from \`local/pins2-board-3/redo/\` at kit commit \`${kitHead}\`. ${lead}*`, ''];
const walk = (d, skip) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => { const p = path.join(d, e.name); const r = path.relative(KIT, p);
  if (e.name.startsWith('.') || skip.some((s) => r === s || r.startsWith(s + '/'))) return []; return e.isDirectory() ? walk(p, skip) : [r]; });
const files = walk(KIT, ['vendor', 'node_modules', 'shots']).sort();

// ── file-map ──
const prior = new Map(fs.readFileSync(MAP3E, 'utf8').split('\n').filter((l) => /^\| `/.test(l)).map((l) => { const c = l.split('|').map((x) => x.trim()); return [c[1].replace(/`/g, ''), c.slice(2, 5)]; }));
const portalTwin = (f) => { if (f === 'app.css') return 'portal/public/app.css'; const m = f.match(/^ui\/(.+)$/); return m && fs.existsSync(path.join(PORTAL, 'ui', m[1])) ? `portal/ui/${m[1]}` : null; };
const differs = (f) => { const t = portalTwin(f); if (!t) return null; try { execFileSync('git', ['diff', '--no-index', '--quiet', path.join(ROOT, t), path.join(KIT, f)]); return false; } catch { return true; } };
const RULES = [[/^b4\/.*\.test\.mjs$/, 'CHROME', '—', 'a test of the design code; ports with it as a test, never as UI'],
  [/^b4\//, 'DESIGN-CODE', 'the portal file named in HANDOFF.md for its gate', 'Board 4\'s own design code (the build form, Bulk, Compare and their styles)'],
  [/^b1\.css$/, 'MIXED', '`portal/ui/app.css`', 'board 1\'s G8/G9/G10 rules that Board 4\'s build drawer, Compare (`.b1 .b4-cmp`) and the post drawer still wear; split by selector against `class-map.md`'],
  [/^b4\.css$/, 'DESIGN-CODE', '`portal/ui/app.css`', 'Board 4\'s own stylesheet (the post form\'s count row, the Before staging panel, drawer sizes)'],
  [/^gates4\//, 'CHROME', '—', 'Board 4\'s own page: the sections, their state switches and forks'],
  [/\.(html)$/, 'CHROME', '—', 'a board page, a lab or a comparison page'], [/\.(cjs|py|mjs)$/, 'CHROME', '—', 'a board instrument'],
  [/^(data|ref|cmp)\//, 'CHROME', '—', 'a fixture or reference the board renders; never ships']];
const fmRows = files.map((f) => {
  const p = prior.get(f); const d = differs(f);
  if (p) return `| \`${f}\` | ${p[0]} | ${p[1]} | ${p[2]}${d === false ? ' · **identical to the portal now** — nothing to apply' : ''} |`;
  if (portalTwin(f)) return `| \`${f}\` | **PORTAL-COPY** | \`${portalTwin(f)}\` | ${d ? 'apply its hunk in `portal-diff.md`' : 'identical to the portal — nothing to apply'} · labelled by rule, not reviewed |`;
  const r = RULES.find(([re]) => re.test(f)) || [null, '**UNLABELLED**', '—', 'no rule covers it: decide before porting'];
  return `| \`${f}\` | **${r[1].replace(/\*/g, '')}** | ${r[2]} | ${r[3]} · labelled by rule, not reviewed |`;
});
fs.writeFileSync(path.join(__dirname, 'file-map.md'), [...fm('every kit file, and what a port does with it', 'A file Board 3-E already labelled keeps Board 3-E\'s reviewed label (`../../2026-09-15-pins2-board-3/3e/file-map.md`, including its 2026-09-21 correction that `ui/app.js`, `ui/httpClient.js` and `ui/conform.js` are board chrome); a file new since then carries the rule that labelled it, marked "labelled by rule, not reviewed".'),
  '| File | Label | Goes to | Note |', '|---|---|---|---|', ...fmRows, ''].join('\n'));

// ── portal-diff ──
const pd = []; let nd = 0;
for (const f of files) { if (!differs(f)) continue; const t = portalTwin(f); if (prior.get(f) && /CHROME/.test(prior.get(f)[0])) continue; nd++;
  let out = ''; try { execFileSync('git', ['diff', '--no-index', path.join(ROOT, t), path.join(KIT, f)], { encoding: 'utf8', maxBuffer: 64e6 }); } catch (e) { out = e.stdout; }
  out = out.split(ROOT + '/').join('').split(KIT.replace(ROOT + '/', '')).join('kit');
  pd.push(`## \`${f}\` → \`${t}\``, '', '```diff', out.trimEnd(), '```', ''); }
fs.writeFileSync(path.join(__dirname, 'portal-diff.md'), [...fm('the exact changes to PORTAL code', `The kit's copies of portal files (\`ui/*.js\` against \`portal/ui/\`, \`app.css\` against the built \`portal/public/app.css\`), as unified diffs: ${nd} files differ. Board chrome copies (\`ui/app.js\`, \`ui/httpClient.js\`, \`ui/conform.js\`) are left out — applying them would break the portal (Board 3-E's file-map). A \`useB3()\` branch collapses to the arm the board holds (\`switches.md\`).`), ...pd].join('\n'));

// ── class-map and token-map: what the Board 4 spec renders, against what the portal defines ──
const specText = fs.readdirSync(__dirname).filter((f) => /^(C\d|states|tokens|motion).*\.md$/.test(f)).map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
const portalCss = ['ui/app.css', 'ui/v2card.css', 'ui/tokens.css'].map((f) => fs.readFileSync(path.join(PORTAL, f), 'utf8')).join('\n');
const kitCss = ['b4.css', 'b4/classes.css', 'b4/form.css', 'b4/bulk.css', 'b4/compare.css', 'b3/board.css', 'gates.css', 'b1.css', 'b2.css', 'app.css'];
const defs = (css) => new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.(-?[_a-zA-Z][\w-]*)(?=[^{}]*\{)/g)].map((m) => m[1]));
const pDefs = defs(portalCss);
const used = new Set([...specText.matchAll(/`[a-z0-9]+((?:\.[_a-zA-Z][\w-]*)+)/g)].flatMap((m) => m[1].split('.').filter(Boolean)));
const where = (needle) => { for (const f of kitCss) { const L = fs.readFileSync(path.join(KIT, f), 'utf8').split('\n'); const i = L.findIndex((l) => needle.test(l)); if (i >= 0) return `\`${f}:${i + 1}\``; } return '— (set by script, never styled)'; };
const board = [...used].filter((c) => !pDefs.has(c)).sort();
const byPre = {}; board.forEach((c) => { const k = (c.match(/^[a-z0-9]+-?/i) || [c])[0]; (byPre[k] = byPre[k] || []).push(c); });
const cm = [...fm('the classes the portal does not have', `${board.length} classes rendered in this folder's spec (\`C*.md\`, \`states.md\`) that no portal stylesheet (\`portal/ui/app.css\`, \`v2card.css\`, \`tokens.css\`) defines. Each is ported WITH its rules (the kit file:line is where its first rule sits), or renamed onto a portal class in Session 4's standardization — never shipped as a bare class that styles nothing. Short names such as \`.in\`, \`.on\`, \`.pinned\`, \`.ghost\`, \`.quiet\`, \`.stage\`, \`.mesh\` and \`.noname\` are STATE flags, styled only in compound with a component class (\`.b3-bdgs.in\`): port the compound rule, never the flag alone. A class marked \"set by script, never styled\" is a JS hook with no rule of its own.`),
  '| Prefix | Count | Classes (first rule) |', '|---|---|---|'];
for (const [k, list] of Object.entries(byPre).sort((a, b) => b[1].length - a[1].length)) cm.push(`| \`${k}\` | ${list.length} | ${list.map((c) => `\`.${c}\` ${where(new RegExp('\\.' + c.replace(/[-]/g, '\\-') + '(?![\\w-])'))}`).join(' · ')} |`);
fs.writeFileSync(path.join(__dirname, 'class-map.md'), [...cm, ''].join('\n'));
const tokUsed = new Set([...specText.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
const tokDef = (css) => new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const pTok = tokDef(portalCss);
const missing = [...tokUsed].filter((t) => !pTok.has(t)).sort();
// (2026-09-27 02:54 EDT) A token is found wherever the kit names it — a CSS declaration first, else any JS that sets it (fady.js's --fl/--fr, state.js's --h1-* stamp,
// an inline style) — so "not found" means genuinely undefined, not "defined in a file this list forgot" (60 of 138 were misreported that way).
const kitAll = files.filter((f) => /\.(css|js)$/.test(f) && !/^(data|ref|cmp)\//.test(f));
const tdef = (t) => { const esc = t.replace(/[-]/g, '\\-'); const decl = new RegExp(esc + '\\s*:'); const any = new RegExp(esc + '(?![\\w-])');
  for (const re of [decl, any]) for (const f of kitCss.concat(kitAll.filter((x) => !kitCss.includes(x)))) { const L = fs.readFileSync(path.join(KIT, f), 'utf8').split('\n'); const i = L.findIndex((l) => re.test(l) && !/var\(\s*$/.test(l.split(t)[0]) && !(re === any && l.includes('var(' + t))); if (i >= 0) return [`\`${f}:${i + 1}\`${re === any ? ' (set by script)' : ''}`, L[i].trim().slice(0, 140).replace(/\|/g, '\\|')]; }
  return ['— **not defined anywhere in the kit**', '']; };
fs.writeFileSync(path.join(__dirname, 'token-map.md'), [...fm('the custom properties the portal does not have', `${missing.length} of the ${tokUsed.size} custom properties this folder's spec reads are defined nowhere in the portal (\`portal/ui/tokens.css\`, \`app.css\`, \`v2card.css\`). A declaration that reads one ports as \`var()\` of nothing — silently. Session 4 maps each onto a portal token or defines it.`),
  '| Token | Defined in the kit | The definition |', '|---|---|---|', ...missing.map((t) => { const [w, d] = tdef(t); return `| \`${t}\` | ${w} | \`${d}\` |`; }), ''].join('\n'));
console.log(JSON.stringify({ files: files.length, relabelled: fmRows.filter((r) => /by rule/.test(r)).length, unlabelled: fmRows.filter((r) => /UNLABELLED/.test(r)).length, portalDiffs: nd, boardClasses: board.length, missingTokens: missing.length, kit: kitHead }));
