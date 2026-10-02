// The apply map — every element the census found in the portal, each with every stylesheet site that styles it, mapped to the Board 4
// standard it takes (or EXEMPT, with the reason). Generated; plan §5c Step 2.
// Run: node docs/pins2/final/apply-map.cjs   (reads local/census/census.json and, when present, local/pins2/s4/picks.json; writes apply-map.md)
// 🔴 WHY (Session 4, 2026-10-01 22:58 EDT). Session 5 builds from this file, so its close is the plan's: every census family maps to exactly one
// row, and every stylesheet rule that names one of a family's classes is listed on that row — an `rg` for the class finds nothing the
// map does not. The STANDARD column names the families of "Board 4: Standard" (the tuner, artifact Wrs8Xg8vT2jy6Zm2E24ozh); its
// values come from Harkirat's settings, read from local/pins2/s4/picks.json once he has made them. The classification below is a
// rule list, not a judgement per row: the rule that matched is printed on every row, so a wrong row shows which rule to fix.
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '../../..'); process.chdir(ROOT);
const C = JSON.parse(fs.readFileSync('local/census/census.json', 'utf8'));
const PICKS = fs.existsSync('local/pins2/s4/picks.json') ? JSON.parse(fs.readFileSync('local/pins2/s4/picks.json', 'utf8')) : null;
const CSS = ['portal/ui/tokens.css', 'portal/ui/app.css', 'portal/ui/v2card.css'];

// ── every rule's selector, with its file and first line (a brace-depth walk; comments stripped first, newlines kept) ──
const rules = [];
for (const f of CSS) {
  const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  let depth = 0, buf = '', bufLine = 1, line = 1, stack = [];
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\n') line++;
    if (ch === '{') { const pre = buf.trim(); stack.push(pre); if (pre && !pre.startsWith('@')) rules.push({ f, line: bufLine + (buf.match(/^\s*/)[0].split('\n').length - 1), sel: pre.replace(/\s+/g, ' ') }); buf = ''; depth++; continue; }
    if (ch === '}') { stack.pop(); buf = ''; depth--; continue; }
    if (ch === ';' && depth > 0) { buf = ''; continue; }
    if (!buf) bufLine = line; buf += ch;
  }
}
const sitesFor = (cls) => { const re = new RegExp(`\\.${cls.replace(/[-]/g, '\\-')}(?![\\w-])`); return rules.filter((r) => re.test(r.sel)); };

// ── the standards on the tuner ──
const STD = {
  A: 'Key labels', B: 'Column heads', F: 'Category word', L: 'Group headings', C: 'Chip shape', D: 'Chip hover and pressed', Dsw: 'View switch',
  E: 'Action hover', Ex: 'Deselect ×', H: 'Button heights', N: 'New button hover', Go: 'Go button hover', R: 'Row hover', Fi: 'Field hover',
  Mi: 'Menu item hover', J: 'Corners', M: 'Dark grounds', Q: 'Drawer side column', P: 'Icon line weight', S: 'Spacing scale', T: 'Text sizes',
  Tm: 'Animation speeds', G: 'Your rulings (grey wash, disabled has no hover)'
};
const HUES = /var\(--(ar|smg|lmg|mm|sn|sg|sec|dmz)\)/;
// One rule list, first match wins, tested against ONE selector's leaf (the element before ‹), never the parent it sits in: a census
// family groups elements by look, so a family can hold a fold button and a delete button that look alike at rest. Each selector is
// classified on its own; the family takes the bucket of its most-used selector and lists the others as mixed roles.
const RULES = [
  ['dev', (f, s) => /pin mode|📍|\.dev-/.test(s), 'EXEMPT', [], 'dev tooling, never ships'],
  ['field', (f) => f.fp.kind.startsWith('field:'), 'Fields', ['Fi', 'M', 'J', 'S', 'T'], 'a form field'],
  ['th', (f, s) => /(^|\s)th\b|wg-heads|-heads\b|sortbtn|wg-sort|\.colh/.test(s), 'Column heads', ['B', 'S'], 'a table or list column head'],
  ['catword', (f) => f.fp.kind === 'text' && f.fp.tt === 'uppercase' && HUES.test(f.fp.col), 'Category word', ['F', 'T'], 'an uppercase word in a category hue'],
  ['keylabel', (f, s) => (f.fp.kind === 'text' || f.fp.kind === 'label') && f.fp.tt === 'uppercase' && f.fp.fs <= 12 && /(\bkl\b|label|mlabel|-k\b|\.k\b|lbl|key|eyebrow|bqhead|incg|-lab|tg-l|kicker|\bk ‹)/.test(s), 'Key labels', ['A', 'T'], 'an uppercase key in front of controls'],
  ['switch', (f, s) => f.fp.kind === 'button' && /(\.seg\b|‹ \.seg|\.sw\b|vsw|view-?sw|\.vb\b|b4-vb|tabsw|\.vt\b)/.test(s), 'View switch', ['Dsw', 'H', 'T'], 'one side of a two- or three-way switch'],
  ['deselect', (f, s) => f.fp.kind === 'button' && /(deselect|\.x\b.*sel|b3-x\b|selbar-x|cx-wx|xt-rm)/.test(s), 'Deselect ×', ['Ex', 'H'], 'removes an item from a selection'],
  ['close', (f, s) => f.fp.kind === 'button' && /(\.x\b|close|dismiss|\.bk\b|b3-pc-x)/.test(s), 'Close and back', ['G', 'H', 'J'], 'closes or goes back: the grey wash'],
  ['delete', (f, s) => f.fp.kind === 'button' && /(del\b|-del|trash|rmv|\.dang|danger|discard)/.test(s), 'Action: delete', ['E', 'H', 'J'], 'a delete or remove action'],
  ['edit', (f, s) => f.fp.kind === 'button' && /edit/.test(s), 'Action: edit', ['E', 'H', 'J'], 'an edit action'],
  ['share', (f, s) => f.fp.kind === 'button' && /(share|copy|\bcp\b|-cp\b|\bexp\b|-exp\b|export|download|\bdl\b)/.test(s), 'Action: share, copy, export', ['E', 'H', 'J'], 'a share, copy or export action'],
  ['chip', (f, s) => f.fp.kind === 'button' && /(chip|\.fc\b|b3-fc|cx-k|xt-c|xt-all|\.rv\b|lvchip|incchip)/.test(s) && !/\.go\b|madd|lead/.test(s), 'Filter chip', ['C', 'D', 'T', 'S'], 'a filter chip'],
  ['go', (f, s) => (f.fp.kind === 'button' || f.fp.kind === 'link') && /(\.go\b|commit|\.stage\b|\.save\b|repair|\.dbtn)/.test(s), 'Go button', ['Go', 'H', 'J'], 'the button that does the thing'],
  ['new', (f, s) => f.fp.kind === 'button' && /(lead|\.new|-new|madd|-add|\.add\b|mh-t\b)/.test(s), 'New button', ['N', 'H', 'J'], 'creates something'],
  ['menuitem', (f, s) => (f.fp.kind === 'button' || f.fp.kind === 'link') && /(\.mi\b|pitem|menu|\.opt\b|-opt\b|plist)/.test(s), 'Menu item', ['Mi', 'T'], 'an item in a dropdown or menu'],
  ['row', (f, s) => (f.fp.kind === 'button' || f.fp.kind === 'box' || f.fp.kind === 'link') && /(wg-r\b|\btr\b|\.tile|att-row|rvop|brow|\.lrow|\.rrow|benc|round-u)/.test(s) && f.states && f.states.hover, 'Row', ['R', 'S'], 'a whole row that opens or selects'],
  ['rail', (f, s) => f.fp.kind === 'link' && /(\.rail|realm|\.mk\b|\.un\b|crumb)/.test(s), 'EXEMPT', [], 'the shell rail and brand: a realm layer, Step 4'],
  ['neutral', (f) => f.fp.kind === 'button', 'Neutral button', ['G', 'H', 'J', 'T'], 'a plain button: the grey wash'],
  ['link', (f) => f.fp.kind === 'link', 'Link', ['T'], 'a text link'],
  ['heading', (f) => f.fp.kind === 'heading', 'Headings', ['L', 'T'], 'a heading'],
  ['grouphead', (f, s) => f.fp.kind === 'text' && /(lnh|sechead|sec-h|grp-h|-gh\b|ghead|hdx|\.sh\b|subhead)/.test(s), 'Group headings', ['L', 'T'], 'the heading over a group'],
  ['smallcaps', (f) => f.fp.kind === 'text' && f.fp.tt === 'uppercase', 'Small text (Step 3)', ['T'], 'small uppercase text: its role is Step 3'],
  ['smalltext', (f) => f.fp.kind === 'text' && f.fp.fs <= 11.5 && /ink3|ink4|ink2/.test(f.fp.col), 'Small text (Step 3)', ['T'], 'small grey text: its role is Step 3'],
  ['text', (f) => f.fp.kind === 'text' || f.fp.kind === 'label', 'Content text', ['T'], 'content: takes the text-size scale only'],
  ['ground', (f, s) => f.fp.kind === 'box' && /(menu|pop|well|tier|dd\b|dropdown|picker|readout|stepper)/.test(s), 'Dark grounds', ['M', 'J'], 'a menu, pop-up or well'],
  ['drawer', (f, s) => f.fp.kind === 'box' && /(\.dw\b|‹ \.dw|drawer|\.dw-)/.test(s), 'Drawer', ['Q', 'J', 'S'], 'a drawer and its columns'],
  ['panel', (f) => f.fp.kind === 'box' && f.fp.rad > 0 && (f.fp.ring !== 'none' || f.fp.bw > 0 || f.fp.bg !== 'none'), 'Panels and cards', ['J', 'S'], 'a surface with corners'],
  ['layout', (f) => f.fp.kind === 'box', 'Layout boxes', ['S'], 'layout only: takes the spacing scale'],
];
// Some roles are named only by the parent (`button ‹ .seg`, `button ‹ .usec`): when the leaf lands in a generic bucket, these rules get
// one more try against the whole selector.
const BY_PARENT = new Set(['switch', 'menuitem', 'th', 'keylabel', 'grouphead', 'deselect', 'close', 'row']);
const GENERIC = new Set(['neutral', 'link', 'text', 'smalltext', 'smallcaps', 'layout', 'panel']);
const classifyOne = (f, w) => {
  const leaf = w.split(' ‹ ')[0]; let hit = null;
  for (const [id, test, bucket, std, why] of RULES) if (test(f, leaf)) { hit = { rule: id, bucket, std, why }; break; }
  if (!hit || GENERIC.has(hit.rule)) for (const [id, test, bucket, std, why] of RULES) if (BY_PARENT.has(id) && test(f, w)) { hit = { rule: id + ' (by parent)', bucket, std, why }; break; }
  return hit || { rule: 'none', bucket: 'UNASSIGNED', std: [], why: '' };
};
const classify = (f) => { const per = f.where.map((w) => ({ w: w.w, n: w.n, ...classifyOne(f, w.w) })); const top = [...per].sort((a, z) => z.n - a.n)[0]; const mixed = [...new Set(per.filter((x) => x.bucket !== top.bucket).map((x) => x.bucket))]; return { rule: top.rule, bucket: top.bucket, std: [...new Set(per.flatMap((x) => x.std))], why: top.why, mixed, per }; };

// ── rows ──
const leafClasses = (w) => { const leaf = w.split(' ‹ ')[0]; return (leaf.match(/\.[\w-]+/g) || []).map((x) => x.slice(1)); };
const rows = C.families.map((f) => {
  const k = classify(f);
  const cls = [...new Set(f.where.flatMap((w) => leafClasses(w.w)))];
  // An element with no class of its own (`span ‹ .wg-slots`) is styled through its parent: take the rules that name the parent's class
  // and the element's tag together.
  const viaParent = f.where.filter((w) => !leafClasses(w.w).length).flatMap((w) => { const [leaf, ctx] = w.w.split(' ‹ '); const tag = (leaf.match(/^[a-z0-9]+/) || [''])[0]; const pc = ((ctx || '').match(/\.[\w-]+/g) || []).map((x) => x.slice(1)); return pc.flatMap((c) => sitesFor(c)).filter((r) => tag && new RegExp(`(^|[\\s>+~(,])${tag}(?![\\w-])`).test(r.sel)); });
  const sites = [...new Map([...cls.flatMap((c) => sitesFor(c)), ...viaParent].map((r) => [`${r.f}:${r.line}`, r])).values()];
  const realms = [...new Set(f.where.flatMap((w) => w.realms || []))];
  const fp = f.fp; const cur = [fp.h ? `h ${fp.h}` : '', fp.rad ? `r ${fp.rad}` : '', fp.pad && fp.pad !== '0 0 0 0' ? `pad ${fp.pad}` : '', `${fp.fs}/${fp.fw}${fp.tt === 'uppercase' ? ' caps' : ''}${fp.ls && fp.ls !== 'normal' ? ' ls ' + fp.ls : ''}`, fp.col].filter(Boolean).join(' · ');
  return { id: f.id, n: f.n, kind: fp.kind, sel: f.where.map((w) => w.w), realms, cur, hover: f.states && f.states.hover ? 'yes' : '', cls, sites, ...k };
});
const drift = new Map(); C.drift.forEach((g, i) => g.forEach((id) => drift.set(id, i + 1)));

// ── write ──
const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'America/New_York' }).slice(0, 16) + ' ' + (new Date().toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }).split(' ').pop());
const esc = (s) => String(s).replace(/\|/g, '\\|');
const byBucket = new Map(); rows.forEach((r) => { if (!byBucket.has(r.bucket)) byBucket.set(r.bucket, []); byBucket.get(r.bucket).push(r); });
const order = ['Key labels', 'Column heads', 'Category word', 'Group headings', 'Headings', 'Filter chip', 'View switch', 'Action: delete', 'Action: edit', 'Action: share, copy, export', 'Deselect ×', 'Close and back', 'New button', 'Go button', 'Neutral button', 'Row', 'Fields', 'Menu item', 'Link', 'Panels and cards', 'Dark grounds', 'Drawer', 'Small text (Step 3)', 'Content text', 'Layout boxes', 'EXEMPT', 'UNASSIGNED'];
const pick = (code) => { if (!PICKS || !PICKS.f || !PICKS.f[code] || PICKS.f[code].status === 'none') return 'not set'; const p = PICKS.f[code]; return p.status === 'preset' ? p.base : `mix from ${p.base}`; };
const md = ['---', 'kind: reference', 'status: live', '---', '', '# The apply map — every portal element, and the Board 4 standard it takes', '',
  `*Generated ${stamp} by \`apply-map.cjs\` from the element census (\`local/census/census.json\`, ${C.passes.length} passes, ${C.families.length} families). Plan §5c Step 2. Session 5 builds from it; regenerate it after any census run or once Harkirat's settings are read into \`local/pins2/s4/picks.json\`.*`, '',
  '**How to read a row.** One row per census family. **Sites** is every rule in `portal/ui/*.css` that names one of the family\'s own classes, so an `rg` for the class finds nothing the row leaves out. **Takes** lists the standards on the tuner that set its look; the **rule** column says which line of the classifier put it there, so a wrong row points at the rule to fix.', '',
  '## The standards and their settings', '', '| Code | Standard | Harkirat\'s setting |', '|---|---|---|',
  ...Object.entries(STD).map(([c, n]) => `| ${c} | ${n} | ${c === 'G' ? 'ruled' : pick(c)} |`), '',
  '## Coverage', '', '| Bucket | Families | Uses |', '|---|--:|--:|',
  ...order.filter((b) => byBucket.has(b)).map((b) => `| ${b} | ${byBucket.get(b).length} | ${byBucket.get(b).reduce((a, r) => a + r.n, 0)} |`),
  `| **All** | **${rows.length}** | **${rows.reduce((a, r) => a + r.n, 0)}** |`, '',
  `Families whose selectors take different roles (listed under **Also holds**; Session 5 splits them): **${rows.filter((r) => r.mixed.length).length}**.`, '',
  `Families with no stylesheet site (built only from inline styles, element defaults or a class no rule names): **${rows.filter((r) => !r.sites.length).length}**. Families in a drift group (near-identical families the census flagged): **${rows.filter((r) => drift.has(r.id)).length}** in ${C.drift.length} groups.`, ''];
for (const b of order.filter((x) => byBucket.has(x))) {
  const list = byBucket.get(b).sort((a, z) => z.n - a.n);
  md.push(`## ${b} · ${list.length}`, '', b === 'EXEMPT' ? 'Kept out of the standard; Step 4 records the reason and what would reopen each.' : `Takes: ${[...new Set(list.flatMap((r) => r.std))].map((c) => `${c} ${STD[c]}`).join(' · ')}.`, '',
    '| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |', '|---|---|--:|---|---|---|---|---|---|---|');
  for (const r of list) {
    const sites = r.sites.length ? r.sites.slice(0, 8).map((s) => `\`${s.f.replace('portal/ui/', '')}:${s.line}\``).join(' ') + (r.sites.length > 8 ? ` +${r.sites.length - 8}` : '') : '—';
    md.push(`| ${r.id}${drift.has(r.id) ? ` ·d${drift.get(r.id)}` : ''} | ${esc(r.sel.slice(0, 3).map((s) => '`' + s + '`').join('<br>'))}${r.sel.length > 3 ? ` +${r.sel.length - 3}` : ''} | ${r.n} | ${r.realms.join(', ')} | ${esc(r.cur)} | ${r.hover} | ${sites} | ${r.std.join(' ')} | ${r.rule} | ${r.mixed.join(', ')} |`);
  }
  md.push('');
}
fs.writeFileSync(path.join(__dirname, 'apply-map.md'), md.join('\n'));
console.log(`apply-map.md: ${rows.length} families · ${rules.length} rules parsed · unassigned ${(byBucket.get('UNASSIGNED') || []).length} · no site ${rows.filter((r) => !r.sites.length).length}`);
for (const b of order.filter((x) => byBucket.has(x))) console.log(`  ${b}: ${byBucket.get(b).length}`);
