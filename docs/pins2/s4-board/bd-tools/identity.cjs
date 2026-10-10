// Board 4: Builder · the identity table (Session 4, 2026-10-03 21:16 EDT). Every thing on the board at rest, given its role by bd/roles.js
// (the apply map's own rule list plus the kit's rulings), grouped by role and by build key, and written as a table to review:
//   local/pins2/s4/identity.md   — one section per role, one row per build key, its members by gate and their words
// and checked against the portal census where the kit reuses a portal class: the same rule list must give the same role for the same
// element, or the adapter that reads the kit is wrong.
// Run with repo-static on :8900 or none (it serves the repo itself):  node local/pins2/s4/builder-2/bd-tools/identity.cjs
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const OUT = path.join(ROOT, 'local/pins2/s4/identity.md');
(async () => {
  const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'local/census/census.json'), 'utf8'));
  const CT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp' };
  const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(ROOT, u); try { let b = fs.readFileSync(f); const ext = path.extname(f); if (ext === '.html') b = Buffer.concat([Buffer.from('<!doctype html>'), b]); r.writeHead(200, { 'content-type': CT[ext] || 'application/octet-stream' }); r.end(b); } catch (e) { r.writeHead(404); r.end(); } });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const port = srv.address().port;
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bd-id-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1480, height: 834 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/local/pins2/s4/builder-2/builder.html`, { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__bd && window.__bd.mounted, { timeout: 60000 }); await new Promise((r) => setTimeout(r, 800));
  // census families whose leaf names a class the kit also uses, for the agreement check
  const res = await p.evaluate((fams) => {
    const B = window.__bd, M = B.measure, R = window.BD_ROLES; if (!R) return { err: 'BD_ROLES missing' };
    const ON = /^(on|active|is-on|is-active|selected|is-selected|current|is-current|open|is-open)$/;
    const board = document.getElementById('board'); const all = M.things(board);
    const txt = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 22);
    const keyOf = (el) => { const leaf = el.tagName.toLowerCase() + [...el.classList].filter((c) => !ON.test(c)).map((c) => '.' + c).join(''); const pc = el.parentElement && el.parentElement.classList[0]; return pc ? `${leaf} ‹ .${pc}` : leaf; };
    const rows = new Map(); const kinds = {};
    for (const el of all) {
      const r = R.classify(el, M); const role = r.rule === 'table' ? r.role : '(not reviewed) ' + (r.bucket || 'no role: ' + M.kindOf(el)); const key = keyOf(el); const id = role + '|' + key;
      kinds[role] = (kinds[role] || 0) + 1;
      if (!rows.has(id)) rows.set(id, { role, key, rule: r.rule, src: r.src || '', n: 0, gates: {}, words: new Set(), kind: M.kindOf(el) });
      const o = rows.get(id); o.n++; const g = M.gateOf(el); o.gates[g] = (o.gates[g] || 0) + 1; if (o.words.size < 6) o.words.add(txt(el) || '·');
    }
    // agreement: a kit element whose leaf matches a census family's leaf must land in the same role as that family
    const leafOf = (el) => el.tagName.toLowerCase() + [...el.classList].map((c) => '.' + c).join('');
    const byLeaf = new Map(); for (const f of fams) for (const w of f.where) { const l = w.w.split(' ‹ ')[0]; if (!byLeaf.has(l)) byLeaf.set(l, []); byLeaf.get(l).push({ f, w: w.w }); }
    let agree = 0, differ = 0; const diffs = [];
    for (const el of all) { const hits = byLeaf.get(leafOf(el)); if (!hits) continue; const mine = R.classify(el, M).bucket; const theirs = R.classifyOne(hits[0].f, hits[0].w).bucket; if (mine === theirs) agree++; else { differ++; if (diffs.length < 30) diffs.push(`${M.gateOf(el)} ${leafOf(el)} "${txt(el)}": kit ${mine} · census ${theirs} (${hits[0].w})`); } }
    return { rows: [...rows.values()].map((o) => ({ ...o, words: [...o.words] })), kinds, agree, differ, diffs, total: all.length };
  }, C.families.map((f) => ({ id: f.id, fp: f.fp, states: f.states, where: f.where.map((w) => ({ w: w.w })) })));
  await b.close(); srv.close();
  if (res.err) { console.error(res.err); process.exit(1); }
  const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'America/New_York' }).slice(0, 16) + ' ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }).split(' ').pop();
  const byRole = new Map(); for (const r of res.rows) { if (!byRole.has(r.role)) byRole.set(r.role, []); byRole.get(r.role).push(r); }
  const roles = [...byRole.keys()].sort((a, z) => res.kinds[z] - res.kinds[a]);
  const esc = (s) => String(s).replace(/\|/g, '\\|');
  const md = ['# Board 4 identity table', '', `*Generated ${stamp} by \`local/pins2/s4/builder-2/bd-tools/identity.cjs\`: every thing on the board at rest (${res.total}), its role from \`bd/roles.js\` (the apply map's rule list plus the kit's rulings), grouped by build key (tag and classes without state classes, ‹ the parent's first class). Rest state only.*`, '',
    `**Census agreement** on kit elements whose class the portal also has: ${res.agree} agree, ${res.differ} differ.`, '', ...res.diffs.map((d) => `- ${esc(d)}`), '',
    '| Role | Things | Build keys |', '|---|--:|--:|', ...roles.map((r) => `| ${r} | ${res.kinds[r]} | ${byRole.get(r).length} |`), ''];
  for (const r of roles) {
    md.push(`## ${r} · ${res.kinds[r]}`, '', '| Key | n | Gates | Words | Set by |', '|---|--:|---|---|---|');
    for (const o of byRole.get(r).sort((a, z) => z.n - a.n)) md.push(`| \`${esc(o.key)}\` | ${o.n} | ${Object.entries(o.gates).map(([g, n]) => g + ' ' + n).join(', ')} | ${esc(o.words.join(' / '))} | ${o.rule === 'table' ? esc(o.src) : esc(o.rule)} |`);
    md.push('');
  }
  fs.writeFileSync(OUT, md.join('\n'));
  console.log(`identity.md: ${res.total} things · ${res.rows.length} keys · ${roles.length} roles · census agree ${res.agree} / differ ${res.differ}${errs.length ? ' · page errors: ' + errs.slice(0, 3).join(' | ') : ''}`);
  for (const r of roles) console.log(`  ${r}: ${res.kinds[r]} things in ${byRole.get(r).length} keys`);
})().catch((e) => { console.error('identity FAIL', e.message); process.exit(1); });
