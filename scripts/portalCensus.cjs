// scripts/portalCensus.cjs — THE ELEMENT CENSUS: every element the portal renders, in every realm and every registered state,
// grouped by what it LOOKS like rather than what it is called, plus every hand-typed value in the portal's CSS and JS.
//
// 🔴 WHY IT EXISTS (portal pins batch 2, 2026-09-21 12:21 EDT). Session 4 standardizes the portal's elements and Session 5 rebuilds them, and
// Harkirat named the hole: "how would S5 even know what else to replace/adopt in the portal when identical designs are hand written
// throughout the portal? … if S4 fails to identify, find, or state an element, S5 would basically skip it." Reading code to find
// copies is the method that produced the 95% and 30% ports. This makes coverage a COUNT: every rendered element lands in a family,
// Session 4 assigns every family, and a family nobody assigned is visible rather than silently skipped.
//
// What it measures, and why each choice:
//   · A FAMILY is an exact visual fingerprint — role, height, corners, padding, border, fill, type — so `.wg-ib`, `.x` and
//     `.qcard .ed` land together when they draw the same box, whatever they are called.
//   · COLOURS ARE READ AS THE VARIABLE THEY RESOLVE TO, not as the colour on screen. Armory's and Broadcast's copy of one button
//     compute different colours through --realm-c; comparing the colours would split one element into seven.
//   · A NEAR-DUPLICATE GROUP links families that differ by a few pixels or one weight step (7px vs 8px corners, 32 vs 34 tall).
//     Those are the drifted copies — "the same element coded 10 ways" — and the reason exact matching alone is not enough.
//   · STATES come from portal/fixtures/states/*.json, the registry portalStates.mjs already walks, so a drawer, a menu or an error
//     that only exists after a click is censused too. Anything still never rendered is portalReverseOrphans' job (rules with no element).
//   · :hover, :focus-visible and :active are forced on the first instance of every interactive family and their deltas recorded.
//   · THE LOOSE-VALUE SCAN lists every literal colour, radius, font size and duration in portal/ui/app.css and every inline style in
//     portal/ui/*.js, grouped by value — each is a hand-typed copy of what should be a token.
//
// Out of scope, on purpose: the Discord bot's Components V2 messages and the public dioreo.app site, which style themselves.
//
// Usage (the harness must be served: .claude/launch.json → portal-harness on :8901, after `node -e "require('./scripts/buildPortal').build()"`):
//   node scripts/portalCensus.cjs                 all realms, all registered states → local/census/census.json + census.md
//   node scripts/portalCensus.cjs --realm armory  one realm
//   node scripts/portalCensus.cjs --plant         the falsifier: plants a copy of an existing element under a new class and
//                                                 exits 1 unless the census puts it in that element's family
const fs = require('fs'); const path = require('path'); const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const args = process.argv.slice(2); const flag = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? true) : d; };
const ONLY = flag('--realm'); const PLANT = args.includes('--plant');
const BASE = flag('--base', 'http://127.0.0.1:8901/harness.html');
const OUT = path.join(ROOT, 'local', 'census'); fs.mkdirSync(OUT, { recursive: true });
const REALMS = ['home', 'season', 'armory', 'broadcast', 'access', 'analytics', 'history', 'review'].filter((r) => !ONLY || r === ONLY);
const REG = path.join(ROOT, 'portal', 'fixtures', 'states');

// ── In the page: fingerprint every visible element ────────────────────────────────────────────────────────────────────────
function censusInPage(label) {
  const root = document.documentElement; const rcs = getComputedStyle(root);
  if (!window.__tok) {
    // Every custom property declared on :root, resolved and normalised to rgb(), so a colour can be read back as its token.
    const probe = document.createElement('i'); document.body.appendChild(probe);
    const norm = (v) => { probe.style.color = ''; probe.style.color = v; return probe.style.color ? getComputedStyle(probe).color : null; };
    const names = new Set();
    for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; }
      for (const r of rs) if (r.selectorText && /(^|,)\s*:root\b/.test(r.selectorText)) for (let i = 0; i < r.style.length; i++) if (r.style[i].startsWith('--')) names.add(r.style[i]); }
    const tok = {}; for (const n of names) { const v = rcs.getPropertyValue(n).trim(); const c = v && norm(v); if (c) (tok[c] = tok[c] || []).push(n); }
    probe.remove(); window.__tok = tok; window.__norm = norm; window.__cid = 0;
  }
  const tok = window.__tok;
  const colourOf = (el, cs, v) => {
    if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') return 'none';
    for (const k of ['--realm-c', '--c', '--m', '--tc', '--sl']) { const own = cs.getPropertyValue(k).trim(); if (own && window.__norm(own) === v) return `var(${k})`; }
    return tok[v] ? `var(${tok[v].slice(0, 2).join('|')})` : v;
  };
  const kindOf = (el) => {
    const t = el.tagName.toLowerCase(); const role = el.getAttribute('role');
    if (t === 'button' || role === 'button' || role === 'tab' || role === 'option') return 'button';
    if (t === 'a') return 'link'; if (['input', 'select', 'textarea'].includes(t)) return 'field:' + (el.type || t);
    if (t === 'label') return 'label'; if (/^h[1-6]$/.test(t)) return 'heading';
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    return text ? 'text' : 'box';
  };
  const px = (v) => Math.round(parseFloat(v) * 2) / 2 || 0;
  const out = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (['script', 'style', 'link', 'meta'].includes(el.tagName.toLowerCase())) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const kind = kindOf(el);
    // ⚠️ HEIGHT ONLY FOR CONTROLS. A button's or a field's height is designed; a text run's or a card's follows its content, and
    // keeping it split one text style into a family per line count (the first run linked 97.5px and 98px cards as "drift").
    const designedH = kind === 'button' || kind === 'link' || kind.startsWith('field');
    const fp = { kind, h: designedH ? px(r.height) : '-', rad: px(cs.borderTopLeftRadius), pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px).join(' '),
      bw: px(cs.borderTopWidth), bc: px(cs.borderTopWidth) ? colourOf(el, cs, cs.borderTopColor) : 'none', ring: cs.boxShadow === 'none' ? 'none' : 'shadow',
      bg: colourOf(el, cs, cs.backgroundColor), bgi: cs.backgroundImage === 'none' ? 'none' : 'image' };
    const hasText = kind !== 'box';
    if (hasText) Object.assign(fp, { fs: px(cs.fontSize), fw: cs.fontWeight, ff: cs.fontFamily.split(',')[0].replace(/"/g, ''), lh: cs.lineHeight === 'normal' ? 'normal' : px(cs.lineHeight),
      ls: cs.letterSpacing, tt: cs.textTransform, col: colourOf(el, cs, cs.color) });
    // A box that draws nothing (no fill, border, ring, corner or text) is layout, not an element anyone standardizes.
    if (kind === 'box' && fp.bg === 'none' && fp.bgi === 'none' && !fp.bw && fp.ring === 'none' && !fp.rad) continue;
    const id = 'c' + (++window.__cid); el.setAttribute('data-census', id);
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
    const par = el.parentElement; const pcls = par ? (par.getAttribute('class') || '').trim().split(/\s+/)[0] : '';
    out.push({ id, label, fp, sel: el.tagName.toLowerCase() + (cls.length ? '.' + cls.join('.') : ''), parent: pcls, interactive: kind === 'button' || kind === 'link' || kind.startsWith('field'),
      text: hasText ? (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) : '', inline: el.getAttribute('style') || '' });
  }
  return out;
}

async function runSteps(page, steps) {
  for (const st of steps || []) {
    if (st.click) await page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, st.click);
    if (st.clickText) await page.evaluate((s) => { const e = [...document.querySelectorAll(s.sel)].find((x) => (x.textContent || '').includes(s.text)); if (e) e.click(); }, st.clickText);
    if (st.type) { const [sel, text] = Array.isArray(st.type) ? st.type : [st.type.sel, st.type.text];
      await page.evaluate((s, t) => { const e = document.querySelector(s); if (e) { e.focus(); e.value = t; e.dispatchEvent(new Event('input', { bubbles: true })); } }, sel, text); }
    await new Promise((r) => setTimeout(r, st.wait || 400));
  }
}

(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
    userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'census-')), args: ['--no-first-run'] });
  const page = await b.newPage(); await page.setViewport({ width: 1282, height: 888 });
  const c = await page.target().createCDPSession(); await c.send('DOM.enable'); await c.send('CSS.enable');
  const all = []; const passes = []; const hovered = new Set(); let planted = null;
  const load = async (realm) => { await page.goto(`${BASE}?fresh=1&b=${Date.now()}#/${realm}`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 900)); };
  const census = async (label) => {
    const rows = await page.evaluate(censusInPage, label); all.push(...rows); passes.push([label, rows.length]);
    // Forced states on the first instance of each interactive fingerprint: what CHANGES is part of what the element is.
    for (const row of rows) {
      const key = JSON.stringify(row.fp); if (!row.interactive || hovered.has(key)) continue; hovered.add(key);
      const { root } = await c.send('DOM.getDocument', { depth: -1 });
      const { nodeId } = await c.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-census="${row.id}"]` }); if (!nodeId) continue;
      row.states = {};
      for (const st of ['hover', 'focus-visible', 'active']) {
        const read = () => c.send('CSS.getComputedStyleForNode', { nodeId }).then((x) => Object.fromEntries(x.computedStyle.map((p) => [p.name, p.value])));
        await page.evaluate(() => { const t = document.createElement('style'); t.id = '__cz'; t.textContent = '*,*::before,*::after{transition:none!important}'; document.head.appendChild(t); });
        const a = await read(); await c.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [st] }); const z = await read();
        await c.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }); await page.evaluate(() => { const t = document.getElementById('__cz'); if (t) t.remove(); });
        const d = ['background-color', 'color', 'border-top-color', 'box-shadow', 'outline-style', 'outline-color', 'transform', 'opacity'].filter((p) => a[p] !== z[p]);
        row.states[st] = d.length ? d.map((p) => `${p}: ${z[p].slice(0, 60)}`).join(' · ') : '—';
      }
    }
  };
  for (const realm of REALMS) {
    await load(realm); await census(`${realm} · resting`);
    if (PLANT && realm === 'armory' && !planted) {
      // The falsifier: a new class, the look of an existing chip. If the census cannot put it with that chip, it cannot find copies.
      planted = await page.evaluate(() => { const src = document.querySelector('main .chip'); if (!src) return null;
        const cs = getComputedStyle(src); const el = document.createElement('button'); el.className = 'zz-planted-copy'; el.textContent = src.textContent;
        for (const p of ['display', 'height', 'padding', 'border', 'border-radius', 'background-color', 'background-image', 'box-shadow', 'font', 'letter-spacing', 'text-transform', 'color', 'line-height', 'box-sizing', 'align-items', 'gap', 'margin'])
          el.style.setProperty(p, cs.getPropertyValue(p));
        src.after(el); return src.className; });
      await census('armory · planted');
    }
    const regFile = path.join(REG, `${realm}.json`);
    const reg = fs.existsSync(regFile) ? JSON.parse(fs.readFileSync(regFile, 'utf8')).states || [] : [];
    for (const st of reg) { await load(realm); await runSteps(page, st.steps); await census(`${realm} · ${st.name}`); }
    // Every view on the realm's own switch, which the registry does not always list.
    const tabs = await page.evaluate(() => [...document.querySelectorAll('main [role=tab]')].map((t) => t.textContent.trim()).filter(Boolean));
    for (const t of [...new Set(tabs)].slice(0, 8)) { await load(realm); await page.evaluate((w) => { const e = [...document.querySelectorAll('main [role=tab]')].find((x) => x.textContent.trim() === w); if (e) e.click(); }, t);
      await new Promise((r) => setTimeout(r, 500)); await census(`${realm} · view ${t}`); }
  }
  await b.close();

  // ── Families, and the near-duplicate groups that link them ──────────────────────────────────────────────────────────────
  const fam = new Map();
  for (const r of all) { const k = JSON.stringify(r.fp); if (!fam.has(k)) fam.set(k, { fp: r.fp, n: 0, where: new Map(), states: null }); const f = fam.get(k); f.n++;
    const w = `${r.sel}${r.parent ? ' ‹ .' + r.parent : ''}`; const e = f.where.get(w) || { n: 0, labels: new Set(), text: r.text, inline: r.inline }; e.n++; e.labels.add(r.label.split(' · ')[0]); f.where.set(w, e);
    if (r.states && !f.states) f.states = r.states; }
  // ⚠️ A FAMILY ID IS A HASH OF ITS LOOK, never its rank: Session 4's element map is keyed by these ids, and a rank-based id renumbers
  // every family the moment one count changes, which would silently re-point every assignment in the map at a different element.
  const fams = [...fam.values()].sort((a, b2) => b2.n - a.n); fams.forEach((f) => { f.id = 'F' + require('crypto').createHash('sha1').update(JSON.stringify(f.fp)).digest('hex').slice(0, 7); });
  const NUM = ['h', 'rad', 'bw', 'fs', 'lh']; const parent = fams.map((_, i) => i); const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const near = (a, z) => { if (a.kind !== z.kind) return false; let diff = 0;
    for (const k of Object.keys(a)) { if (k === 'kind') continue; const x = a[k], y = z[k]; if (x === y) continue;
      if (NUM.includes(k) && typeof x === 'number' && typeof y === 'number' && Math.abs(x - y) <= 2) { diff++; continue; }
      if (k === 'fw' && Math.abs(Number(x) - Number(y)) <= 100) { diff++; continue; }
      if (k === 'pad') { const p = String(x).split(' ').map(Number), q = String(y).split(' ').map(Number); if (p.every((v, i) => Math.abs(v - q[i]) <= 2)) { diff++; continue; } }
      return false; }
    return diff > 0 && diff <= 3; };
  for (let i = 0; i < fams.length; i++) for (let j = i + 1; j < fams.length; j++) if (near(fams[i].fp, fams[j].fp)) parent[find(j)] = find(i);
  const groups = new Map(); fams.forEach((f, i) => { const g = find(i); (groups.get(g) || groups.set(g, []).get(g)).push(f); });
  const drift = [...groups.values()].filter((g) => g.length > 1).sort((a, b2) => b2.reduce((s, f) => s + f.n, 0) - a.reduce((s, f) => s + f.n, 0));

  // ── The loose values: every literal in the stylesheet and every inline style in the components ────────────────────────
  const loose = new Map(); const addLoose = (kind, val, where) => { const k = kind + ' ' + val; (loose.get(k) || loose.set(k, { kind, val, where: [] }).get(k)).where.push(where); };
  fs.readFileSync(path.join(ROOT, 'portal/ui/app.css'), 'utf8').split('\n').forEach((l, i) => {
    const s = l.replace(/\/\*.*?\*\//g, ''); const at = `app.css:${i + 1}`;
    for (const m of s.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g)) addLoose('colour', m[0], at);
    for (const m of s.matchAll(/border-radius\s*:\s*([0-9.]+px[^;}]*)/g)) addLoose('radius', m[1].trim(), at);
    for (const m of s.matchAll(/font-size\s*:\s*([0-9.]+px)/g)) addLoose('font-size', m[1], at);
    for (const m of s.matchAll(/\b([0-9.]+m?s)\s+(cubic-bezier\([^)]*\)|ease[\w-]*|linear)/g)) addLoose('motion', m[0], at);
  });
  for (const f of fs.readdirSync(path.join(ROOT, 'portal/ui')).filter((x) => x.endsWith('.js'))) fs.readFileSync(path.join(ROOT, 'portal/ui', f), 'utf8').split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/style=(\$\{[^}]{0,120}\}|"[^"]{0,120}")/g)) addLoose('inline style', m[1].replace(/\s+/g, ' '), `${f}:${i + 1}`); });
  const looseList = [...loose.values()].sort((a, b2) => b2.where.length - a.where.length);

  const planted_ok = !PLANT || (planted !== null && fams.some((f) => [...f.where.keys()].some((w) => w.includes('zz-planted-copy')) && [...f.where.keys()].some((w) => !w.includes('zz-planted-copy'))));
  fs.writeFileSync(path.join(OUT, 'census.json'), JSON.stringify({ at: new Date().toISOString(), passes, families: fams.map((f) => ({ id: f.id, fp: f.fp, n: f.n, states: f.states,
    where: [...f.where.entries()].map(([w, e]) => ({ w, n: e.n, realms: [...e.labels], text: e.text, inline: e.inline })) })), drift: drift.map((g) => g.map((f) => f.id)), loose: looseList }, null, 1));
  const fpLine = (fp) => Object.entries(fp).filter(([k]) => k !== 'kind').map(([k, v]) => `${k} ${v}`).join(' · ');
  const md = ['# Portal element census', '', `*${new Date().toISOString()} · ${passes.length} passes over ${REALMS.length} realms · ${all.length} rendered elements · **${fams.length} families** · **${drift.length} near-duplicate groups** · **${looseList.length} distinct hand-typed values**${PLANT ? ` · falsifier ${planted_ok ? 'PASSED' : 'FAILED'}` : ''}*`, '',
    '## Near-duplicate groups — the same element written more than one way', '',
    ...drift.slice(0, 60).flatMap((g) => [`### ${g.map((f) => f.id).join(' ≈ ')} · ${g[0].fp.kind} · ${g.reduce((s, f) => s + f.n, 0)} instances`, '',
      ...g.map((f) => `- **${f.id}** (${f.n}) ${fpLine(f.fp)}\n  - ${[...f.where.entries()].slice(0, 6).map(([w, e]) => `\`${w}\` ×${e.n} in ${[...e.labels].join(', ')}`).join('\n  - ')}`), '']),
    '## Loose values — most repeated first', '', '| Kind | Value | Times | Where (first 6) |', '|---|---|---|---|',
    ...looseList.slice(0, 80).map((l) => `| ${l.kind} | \`${l.val.replace(/\|/g, '\\|').slice(0, 60)}\` | ${l.where.length} | ${l.where.slice(0, 6).join(' · ')} |`), ''];
  fs.writeFileSync(path.join(OUT, 'census.md'), md.join('\n'));
  console.log(JSON.stringify({ passes: passes.length, elements: all.length, families: fams.length, drift: drift.length, loose: looseList.length, loose_uses: looseList.reduce((s, l) => s + l.where.length, 0), planted: PLANT ? planted_ok : 'n/a' }));
  process.exit(planted_ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
