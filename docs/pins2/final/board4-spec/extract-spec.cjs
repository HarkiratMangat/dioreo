// Resolved-value spec for Design Board 3-E (plan 2026-09-13-portal-pins-batch-2 §10.5), generated from the RUNNING board.
//
// Board 2's extract-spec.cjs is the method this extends, and it reached ~95%. Four of its gaps are closed here, each because a
// Session 5 port would otherwise have to guess:
//   1. IT ENUMERATES, IT DOES NOT CURATE. Board 2 specced a hand-written selector list, and querySelector returned the FIRST match
//      only. This walks every element inside each gate's `.g-stage` and specs one entry per distinct class signature, then splits a
//      signature into VARIANTS wherever instances render differently (a faulty row, a named cell, a kind hue). A class that renders
//      and is not specced cannot exist, because the list IS the page.
//   2. MORE STATES. Board 2 forced :hover only. This forces :hover, :focus-visible and :active on every interactive element and
//      records what CHANGES, and it drives the reachable states by interaction (the export picker, a file card, the rename field,
//      a selected build, a typed search, command search's three result shapes).
//   3. PROVENANCE. Every winning declaration carries file:line, and a property nothing on the element declares says which ANCESTOR
//      rule it inherits from. Board 2 printed "—" there, which left the builder to find the ancestor.
//   4. MARKUP AND MOTION. Each element's skeleton (tags, classes, ARIA) is printed, and every @keyframes body the board uses.
//
// ⚠️ THE STAGE IS THE PORTAL'S OWN CODE, and every value here was drawn by it. Declarations that read `var(--b3-*)`, `var(--h1-*)`
// or a board class are BOARD NAMES — see token-map.md and file-map.md beside this file before porting any of them verbatim. Board 2
// could say "port the winning expression, tokens intact" because it used portal tokens; board 3-E cannot.
//
// Usage: node extract-spec.cjs [url] [out.md]
//   default url  http://127.0.0.1:8900/docs/pins2/kit/board3e.html   (the kit is ES modules, so it needs http, not file://)
//   Needs the kit's dev server up. A FRESH Chrome profile is used every run, so the board renders its defaults — which carry every
//   ruled pick — rather than whatever a browser remembered.
const path = require('path'); const fs = require('fs'); const os = require('os');
const puppeteer = require(path.resolve(__dirname, '../../../../node_modules/puppeteer-core'));
// 🔴 BOARDS 1 AND 2 TOO (2026-09-21 10:31 EDT). Harkirat: "board 1's designs were very poorly and incorrectly ported into the portal because
// board 1's session never ran the spec extractor over those refined designs … that's part of session 5's work — fixing those old, bad
// ports." Board 1's spec was written after the fact by a CURATED extractor (first match only, no states, no G10 Compare at all) and board
// 2's by the same method. `BOARD=1` / `BOARD=2` run THIS enumerating extractor over them, against the stylesheet each was approved on.
const MODE = process.env.BOARD || '3e';
const MK = 'http://127.0.0.1:8900/docs/superpowers/mockups';
const CFG = {
  '3e': { url: 'http://127.0.0.1:8900/docs/pins2/kit/board3e.html', wait: '#g-history .b3-hi-r', title: 'Design Board 3-E', out: 'b3e-spec.md', stageAll: '.g-stage',
    css: ['b3/board.css', 'gates.css', 'app.css', 'b2.css'].map((f) => path.resolve(__dirname, '../../../../docs/pins2/kit', f)) },
  '1': { url: `${MK}/2026-09-14-pins2-board/index.html`, wait: 'aside.drawer', title: 'Pins-2 design board 1 (G9 · G10 · G8)', out: 'b1-spec.md', stageAll: '.pb-stage',
    css: [path.resolve(__dirname, '../../../superpowers/mockups/2026-09-14-pins2-board/app.css'), path.resolve(__dirname, '../../../superpowers/mockups/2026-09-14-pins2-board/index.html')],
    prepare: () => { ['g9', 'g10', 'g8'].forEach((g, i) => { const s = document.querySelectorAll('section.pb-gate')[i]; if (s) s.id = 'gate-' + g; }); },
    gates: [['G9', 'gate-g9', 'New build drawer'], ['G10', 'gate-g10', 'Compare'], ['G8', 'gate-g8', 'Post an announcement']] },
  '2': { url: `${MK}/2026-09-14-pins2-board-2/index.html`, wait: '#g4man *', title: 'Pins-2 design board 2 (G4 · G6 · G11 · G3 · G1)', out: 'b2-spec.md', stageAll: 'section.pb-gate',
    css: [path.resolve(__dirname, '../../../superpowers/mockups/2026-09-14-pins2-board/app.css'), path.resolve(__dirname, '../../../superpowers/mockups/2026-09-14-pins2-board-2/index.html')],
    prepare: () => { document.querySelectorAll('section.pb-gate[data-gate]').forEach((s) => { s.id = 'gate-' + s.dataset.gate; }); },
    gates: [['G4', 'gate-g4', 'Armory manifest'], ['G6', 'gate-g6', 'Build name'], ['G11', 'gate-g11', 'Broadcast and History manifests'], ['G3', 'gate-g3', 'Announcement card'], ['G2', 'gate-g2', 'Admin traffic'], ['G1', 'gate-g1', 'Small text']] },
  // 🔴 BOARD 4: COLLECTIVE (2026-09-21 13:33 EDT). Every finished surface of boards 1–3 on one page in the kit's portal code — the one board Session 4
  // standardizes from and Session 5 ports once Board 4: Final supersedes it. Sections are `#c-<id>`; each stage is its `.g-stage`.
  '4': { url: 'http://127.0.0.1:8900/docs/pins2/kit/board4.html', wait: '#c-admin .b4-vb .incchip', title: 'Board 4: Collective', out: 'b4-spec.md', stageAll: '.b4g',
    css: ['b3/board.css', 'gates.css', 'app.css', 'b2.css', 'b1.css', 'b4.css'].map((f) => path.resolve(__dirname, '../../../../docs/pins2/kit', f)),
    gates: [['C1', 'c-manifest', 'The Armory manifest'], ['C2', 'c-new-build', 'New build'], ['C3', 'c-compare', 'Compare'], ['C4', 'c-repairs', 'Repairs'],
      ['C5', 'c-export', 'Export'], ['C6', 'c-queue', 'The delivery queue'], ['C7', 'c-broadcast', 'The Broadcast manifest, and posting'], ['C8', 'c-history', 'History'],
      ['C9', 'c-admin', 'Admin traffic']] },
}[MODE];
if (!CFG) throw new Error(`BOARD=${MODE}: expected 3e, 1, 2 or 4`);
const URL_ = process.argv[2] || CFG.url;
const OUT = process.argv[3] || path.join(require('os').tmpdir(), CFG.out);
const cell = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
const PROPS = ['display', 'position', 'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'gap', 'column-gap', 'row-gap',
  'flex', 'flex-direction', 'flex-wrap', 'align-items', 'align-self', 'justify-content', 'justify-self', 'place-items',
  'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'box-sizing',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding-inline', 'padding-block',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'inset', 'top', 'right', 'bottom', 'left',
  'border', 'border-top', 'border-bottom', 'border-left', 'border-right', 'border-color', 'border-width', 'border-style', 'border-radius',
  'outline', 'outline-offset', 'background', 'background-color', 'background-image', 'box-shadow',
  'font', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant-numeric', 'line-height', 'letter-spacing', 'text-transform',
  'text-align', 'text-decoration', 'text-overflow', 'white-space', 'color', 'opacity', 'overflow', 'overflow-x', 'overflow-y', 'clip-path',
  'mask', 'mask-image', 'filter', 'transform', 'transition', 'animation', 'cursor', 'content', 'isolation', 'z-index', 'user-select',
  'field-sizing', 'accent-color', 'visibility', 'pointer-events'];
const ALWAYS = ['display', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color'];
const INHERITABLE = new Set(['font', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant-numeric', 'line-height',
  'letter-spacing', 'text-transform', 'text-align', 'white-space', 'color', 'cursor', 'visibility', 'accent-color']);
const FP = ['display', 'font-size', 'font-weight', 'font-family', 'line-height', 'letter-spacing', 'text-transform', 'color', 'background-color',
  'background-image', 'box-shadow', 'border-top-width', 'border-top-color', 'border-radius', 'padding-top', 'padding-right', 'padding-bottom',
  'padding-left', 'gap', 'opacity', 'outline-style', 'height'];
const INTERACTIVE = 'button, a[href], input, textarea, select, label, [role=button], [role=option], [role=tab], [role=checkbox], [tabindex]';
const GATES = [
  ['L1', 'list-lab', 'Selection-list spacing lab', 'INSTRUMENT — the lab is a tool on the board, not a surface that ships. Its OUTPUT (the values he saved) is the design; the lab itself is chrome.'],
  ['M1', 'armory-manifest', 'The Armory manifest'], ['M2', 'repairs', 'Repairs'], ['M3', 'export', 'Export'],
  ['B1', 'queue', 'The delivery queue'], ['H1', 'history', 'The history manifest'],
];

(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
    userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'b3e-spec-')), args: ['--no-first-run'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.setViewport({ width: 1282, height: 888 });
  const c = await p.target().createCDPSession();
  const sheets = {};
  c.on('CSS.styleSheetAdded', ({ header }) => { sheets[header.styleSheetId] = (header.sourceURL || '').split(/\/kit\/|\/redo\/|\/mockups\//).pop() || (header.isInline ? 'inline <style>' : '?'); });
  await c.send('DOM.enable'); await c.send('CSS.enable');
  await p.goto(URL_, { waitUntil: 'networkidle0' });
  await p.waitForSelector(CFG.wait, { timeout: 20000 });
  if (CFG.prepare) await p.evaluate(CFG.prepare);
  await p.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 900));

  const src = (rule) => `${sheets[rule.styleSheetId] || (rule.origin === 'user-agent' ? 'user-agent' : '?')}:${rule.style && rule.style.range ? rule.style.range.startLine + 1 : '?'}`;
  // 🔴 A PHYSICAL PROPERTY IS ALSO SET BY ITS LOGICAL TWIN, and matching on the name alone missed it (2026-09-21 10:10 EDT): `.exs-i .b3-btn2.sm`
  // declares `padding-left:10px` and a later rule's `padding-inline:12px` wins, so the table printed 10px as the winner and flagged it ⚠️ —
  // a porter reading the winner column would have shipped 10. Chrome reports `padding-inline` as its longhands `padding-inline-start/end`,
  // never as `padding-left`, so both names are taken in ONE pass, in cascade order. The board is LTR throughout.
  const TWIN = { 'padding-left': 'padding-inline-start', 'padding-right': 'padding-inline-end', 'padding-top': 'padding-block-start', 'padding-bottom': 'padding-block-end',
    'margin-left': 'margin-inline-start', 'margin-right': 'margin-inline-end', 'margin-top': 'margin-block-start', 'margin-bottom': 'margin-block-end',
    left: 'inset-inline-start', right: 'inset-inline-end', top: 'inset-block-start', bottom: 'inset-block-end',
    width: 'inline-size', height: 'block-size', 'min-width': 'min-inline-size', 'max-width': 'max-inline-size', 'min-height': 'min-block-size', 'max-height': 'max-block-size',
    'border-top-width': 'border-block-start-width', 'border-top-color': 'border-block-start-color' };
  const winner = (rules, inline, prop) => {
    let best = null;
    const take = (props, from) => (props || []).forEach((d) => { if ((d.name !== prop && d.name !== TWIN[prop]) || d.disabled || d.parsedOk === false) return;
      const imp = !!d.important; if (!best || imp || !best.imp) best = { v: d.value + (imp ? ' !important' : '') + (d.name !== prop ? ` (as ${d.name})` : ''), from, imp }; });
    (rules || []).forEach((m) => take(m.rule.style.cssProperties, `${cell(m.rule.selectorList.text).slice(0, 90)} · ${src(m.rule)}`));
    if (inline) take(inline.cssProperties, 'style attribute');
    return best;
  };
  const nodeOf = async (id) => { const { root } = await c.send('DOM.getDocument', { depth: -1 }); return (await c.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-spec-id="${id}"]` })).nodeId; };
  const computed = async (nodeId) => Object.fromEntries((await c.send('CSS.getComputedStyleForNode', { nodeId })).computedStyle.map((x) => [x.name, x.value]));

  // Tag every element in a stage and group it by class signature, then by rendered look.
  const census = (scope, prefix) => p.evaluate((scope, prefix, FP, INTERACTIVE) => {
    const root = document.querySelector(scope); if (!root) return null;
    let n = 0; const sigs = {};
    root.querySelectorAll('*').forEach((e) => {
      if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') return;
      const cls = (e.getAttribute('class') || '').split(/\s+/).filter(Boolean).sort();
      const sig = e.tagName.toLowerCase() + (cls.length ? '.' + cls.join('.') : '') + (e.getAttribute('role') ? `[role=${e.getAttribute('role')}]` : '');
      if (!cls.length && ['span', 'div', 'b', 'i', 'em', 'small', 'li', 'p', 'strong', 'mark', 'kbd', 'time', 'label'].indexOf(e.tagName.toLowerCase()) < 0) return;
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      if (cs.display === 'none') return;
      const fp = FP.map((k) => cs.getPropertyValue(k)).join('|');
      const id = `${prefix}${++n}`; e.setAttribute('data-spec-id', id);
      const par = e.parentElement; const pcls = par ? (par.getAttribute('class') || '').split(/\s+/).filter(Boolean)[0] : '';
      (sigs[sig] = sigs[sig] || { sig, parent: pcls, variants: {}, count: 0 }).count++;
      const v = sigs[sig].variants[fp] = sigs[sig].variants[fp] || { id, n: 0, w: Math.round(r.width), h: Math.round(r.height),
        interactive: e.matches(INTERACTIVE), text: (e.childElementCount ? '' : (e.textContent || '').trim().slice(0, 48)),
        aria: ['aria-label', 'aria-pressed', 'aria-expanded', 'aria-selected', 'aria-hidden', 'role', 'title', 'type'].map((a) => e.getAttribute(a) != null ? `${a}="${e.getAttribute(a).slice(0, 40)}"` : '').filter(Boolean).join(' '),
        skeleton: (() => { const t = e.cloneNode(true); t.querySelectorAll('svg').forEach((s) => s.replaceWith(document.createTextNode('⟨svg' + (s.getAttribute('class') ? '.' + s.getAttribute('class').split(' ').join('.') : '') + '⟩')));
          t.querySelectorAll('[data-spec-id]').forEach((x) => x.removeAttribute('data-spec-id')); t.removeAttribute('data-spec-id');
          return t.outerHTML.replace(/\s+/g, ' ').replace(/>([^<]{40})[^<]+</g, '>$1…<').slice(0, 420); })() };
      v.n++;
    });
    return Object.values(sigs);
  }, scope, prefix, FP, INTERACTIVE);

  const out = []; const seen = new Set(); const sigSeen = new Set(); let specced = 0, variantsTotal = 0, mismatches = 0;
  const specOne = async (label, v) => {
    const nodeId = await nodeOf(v.id); if (!nodeId) return;
    const m = await c.send('CSS.getMatchedStylesForNode', { nodeId }); const comp = await computed(nodeId);
    const rows = [];
    for (const pr of PROPS) {
      const w = winner(m.matchedCSSRules, m.inlineStyle, pr);
      if (w) {
        if (/user-agent/.test(w.from) && /^(0e?m?|0px|normal|none|auto|initial)$/.test(String(w.v).trim()) && !ALWAYS.includes(pr)) continue;
        // A percentage resolving to pixels is RESOLUTION, not an override: port the percentage. Only two absolute lengths that disagree are a real conflict.
        const abs = (x) => /^-?[\d.]+(px)?$/.test(String(x).replace(/ \(as [\w-]+\)$/, '').trim());
        const bad = abs(w.v) && abs(comp[pr]) && parseFloat(w.v) !== parseFloat(comp[pr]);
        if (bad) mismatches++;
        // A rule keyed on a switch Session 4 still owns (p10 small text, e1–e6 the shared elements) is provisional however it renders today.
        const open = /data-b3-(p10|e[1-6])\b/.test(w.from) ? ' · ⏳ **OPEN — Session 4 owns this switch; see `switches.md`**' : '';
        rows.push(`| ${pr} | ${bad ? '⚠️ ' : ''}\`${cell(w.v)}\` | \`${cell(comp[pr])}\` | ${w.from}${bad ? ' · **a later rule wins — port the computed value and find that rule**' : ''}${open} |`); continue; }
      if (INHERITABLE.has(pr)) {
        let from = null; (m.inherited || []).some((inh) => { const iw = winner(inh.matchedCSSRules, inh.inlineStyle, pr); if (iw) { from = iw; return true; } return false; });
        if (from) { rows.push(`| ${pr} | ↑ \`${cell(from.v)}\` | \`${cell(comp[pr])}\` | inherited · ${from.from} |`); continue; }
      }
      if (ALWAYS.includes(pr)) rows.push(`| ${pr} | — | \`${cell(comp[pr])}\` | initial |`);
    }
    out.push(`#### ${label}\n\n\`${v.id}\` · rendered **${v.w}×${v.h}** · ${v.n} instance${v.n === 1 ? '' : 's'} look like this${v.text ? ` · text “${cell(v.text)}”` : ''}${v.aria ? ` · ${cell(v.aria)}` : ''}\n`);
    out.push('```html\n' + v.skeleton + '\n```\n');
    out.push('| property | winning declaration | computed | from |\n|---|---|---|---|\n' + rows.join('\n') + '\n');
    for (const ps of ['before', 'after']) {
      const pe = (m.pseudoElements || []).find((x) => x.pseudoType === ps); if (!pe) continue;
      const prow = []; PROPS.forEach((pr) => { const w = winner(pe.matches, null, pr); if (w) prow.push(`| ${pr} | \`${cell(w.v)}\` | ${w.from} |`); });
      if (prow.length) out.push(`**::${ps}**\n\n| property | winning declaration | from |\n|---|---|---|\n` + prow.join('\n') + '\n');
    }
    if (v.interactive) {
      // 🔴 TWO BLIND SPOTS FIXED 2026-09-21 10:15 EDT. (1) The computed style was read the instant the state was forced, while a
      // transition was still running, so the same button's :focus-visible delta appeared on one run and vanished on the next — a spec
      // that changes between two runs of the same board is not a spec. Transitions are switched off for the read. (2) Only the element
      // itself was diffed, so a control whose CHILD answers the state (the drawer's Back/Close say their word on hover; a row's glow is a
      // ::before) read as "changes nothing". Its pseudo-elements and first 40 descendants are diffed too.
      const DPROPS = ['opacity', 'visibility', 'display', 'transform', 'color', 'background-color', 'border-color', 'box-shadow', 'width', 'max-width', 'clip-path', 'outline-color', 'outline-width', 'text-decoration-line', 'fill', 'stroke', 'content'];
      const snap = () => p.evaluate((id, props) => { const e = document.querySelector(`[data-spec-id="${id}"]`); if (!e) return [];
        const list = [['::before', e, '::before'], ['::after', e, '::after'], ...[...e.querySelectorAll('*')].slice(0, 40).map((x) => [x.tagName.toLowerCase() + (x.getAttribute('class') ? '.' + x.getAttribute('class').trim().split(/\s+/).join('.') : ''), x, null])];
        return list.map(([n, x, ps]) => { const cs = getComputedStyle(x, ps); return [n, props.map((pp) => cs.getPropertyValue(pp))]; }); }, v.id, DPROPS);
      for (const st of ['hover', 'focus-visible', 'active']) {
        await p.evaluate(() => { const t = document.createElement('style'); t.id = '__spec-no-transition'; t.textContent = '*,*::before,*::after{transition:none!important}'; document.head.appendChild(t); });
        const before = await snap();
        await c.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [st] });
        const cs2 = await computed(nodeId); const after = await snap();
        await c.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
        await p.evaluate(() => { const t = document.getElementById('__spec-no-transition'); if (t) t.remove(); });
        const d = PROPS.filter((pr) => !/^(transition|animation)/.test(pr) && comp[pr] !== undefined && cs2[pr] !== comp[pr]).map((pr) => `| ${pr} | \`${cell(comp[pr])}\` | \`${cell(cs2[pr])}\` |`);
        const kid = []; before.forEach(([n, vals], i) => { if (!after[i]) return; DPROPS.forEach((pp, j) => { if (vals[j] !== after[i][1][j]) kid.push(`| ${n} | ${pp} | \`${cell(vals[j])}\` | \`${cell(after[i][1][j])}\` |`); }); });
        out.push(`**:${st}** — ${d.length ? 'changes' : 'changes nothing on the element itself'}${kid.length ? '; parts inside it respond (table below)' : ''}\n` + (d.length ? '\n| property | at rest | ' + st + ' |\n|---|---|---|\n' + d.join('\n') + '\n' : '')
          + (kid.length ? `\n| part inside | property | at rest | ${st} |\n|---|---|---|---|\n` + kid.join('\n') + '\n' : ''));
      }
    }
    specced++;
  };
  const dumpStage = async (title, scope, prefix, note) => {
    const sigs = await census(scope, prefix);
    if (!sigs) { out.push(`\n### ${title}\n\n\`${scope}\` — **not present in this state**\n`); return 0; }
    const fresh = sigs.map((s) => ({ ...s, variants: Object.fromEntries(Object.entries(s.variants).filter(([fp]) => !seen.has(s.sig + '|' + fp))) }))
      .filter((s) => Object.keys(s.variants).length);
    out.push(`\n### ${title}\n\n${note ? note + '\n\n' : ''}${sigs.length} distinct signatures on screen; ${fresh.length} not already specced above.\n`);
    for (const s of fresh) {
      Object.keys(s.variants).forEach((fp) => seen.add(s.sig + '|' + fp)); sigSeen.add(s.sig);
      const vs = Object.values(s.variants); variantsTotal += vs.length;
      out.push(`\n### \`${s.sig}\`\n\ninside \`.${s.parent || '—'}\` · ${s.count} on screen · **${vs.length} look${vs.length === 1 ? '' : 's'}**\n`);
      for (let i = 0; i < Math.min(vs.length, 6); i++) await specOne(vs.length > 1 ? `look ${i + 1} of ${vs.length}` : 'the one look', vs[i]);
      if (vs.length > 6) out.push(`*${vs.length - 6} further looks are the same component in other data hues (a per-row \`--c\` / \`--m\` / \`--sl\`); they differ in colour only.*\n`);
    }
    return fresh.length;
  };

  // ── Tokens, including every board-scoped one the design reads ──
  const kitCss = CFG.css.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const names = [...new Set([...kitCss.matchAll(/var\((--[\w-]+)/g)].map((x) => x[1]))].sort();
  const tok = await p.evaluate((names) => { const s = getComputedStyle(document.documentElement); return names.map((n) => [n, s.getPropertyValue(n).trim()]); }, names);
  const defined = new Set([...kitCss.matchAll(/(--[\w-]+)\s*:/g)].map((x) => x[1]));
  out.push('## Tokens as resolved on `:root`\n\nEvery custom property the kit\'s four stylesheets read. **Scope** says where it is set: `:root` means a global token; `component` means a rule sets it on an element (read its value in that element\'s table); `JS` means only `b3/state.js` stamps it at runtime, so it does not exist in any stylesheet and must become a real token or a literal when ported.\n\n| token | value on :root | scope |\n|---|---|---|\n' +
    tok.map(([n, v]) => `| \`${n}\` | ${v ? '`' + cell(v).replace(/url\("data:[^)]{60,}\)/g, (u) => u.slice(0, 44) + '…")') + '`' : '—'} | ${n.startsWith('--h1-') ? 'JS · `b3/state.js` stamp()' : v ? ':root' : defined.has(n) ? 'component' : 'fallback only'} |`).join('\n') + '\n');

  // ── Motion ──
  const kf = await p.evaluate(() => { const o = []; for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; }
    for (let i = 0; i < rs.length; i++) if (rs[i].type === 7) o.push([rs[i].name, (sh.href || 'inline').split(/\/kit\/|\/redo\//).pop(), rs[i].cssText.replace(/\s+/g, ' ')]); } return o; });
  const usedKf = new Set([...kitCss.matchAll(/animation(?:-name)?\s*:\s*([\w-]+)/g)].map((x) => x[1]));
  out.push('\n## @keyframes the board uses\n\n' + kf.filter(([n]) => usedKf.has(n)).map(([n, f, t]) => `**\`${n}\`** · ${f}\n\n\`\`\`css\n${t}\n\`\`\`\n`).join('\n'));

  // ── Every gate, resting ──
  if (MODE === '3e') for (const [gid, id, title, note] of GATES) { out.push(`\n## ${gid} · ${title} — resting\n`); await dumpStage(`${gid} stage`, `#g-${id} .g-stage`, `${gid}-`, note); }
  else for (const [gid, id, title] of CFG.gates) { out.push(`\n## ${gid} · ${title} — resting\n`); await dumpStage(`${gid} stage`, MODE === '4' ? `#${id} .pb-head ~ :not(.pb-new):not(.b4-try):not(.b4-forks)` : `#${id} ${MODE === '1' ? '.pb-stage' : ''}`.trim(), `${gid}-`); }

  // ── Reachable states, each re-censused so only what is NEW is specced ──
  const click = async (sel) => { const ok = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, sel); await new Promise((r) => setTimeout(r, 700)); return ok; };
  out.push('\n## Reachable states\n\nEach state is reached by the interaction named, then the stage is walked again; only signatures or looks not seen above are specced.\n');
  if (MODE === '1') {
    // Board 1's own switches (its inline script): DMZ, Bulk create, an existing image key, and G8's deliberate bad-link view.
    for (const [seg, name] of [['arm', 'G9 · DMZ'], ['many', 'G9 · Bulk create'], ['img', 'G9 · Existing image key']]) {
      if (await click(`#gate-g9 [data-seg=${seg}] button:nth-of-type(2)`)) await dumpStage(name, '#gate-g9 .pb-stage', `G9${seg}-`);
    }
    if (await click('#gate-g8 [data-seg=views] button:nth-of-type(2)')) await dumpStage('G8 · Bad link, short window', '#gate-g8 .pb-stage', 'G8bad-');
  }
  if (MODE === '2') {
    // The three states board 2's own curated extractor drove (its extract-spec.cjs:82–90) — kept, so nothing it covered is lost.
    if (await click('#gate-g4 [data-seg=att] button[data-v=slots]')) await dumpStage('G4 · By slot view', '#gate-g4', 'G4s-');
    await click('#gate-g4 [data-seg=att] button[data-v=list]');
    if (await click('[data-seg=bstaged] button[data-v=on]')) await dumpStage('G11 · a staged state', '#gate-g11', 'G11s-');
    if (await click('.chip.pb-adm')) await dumpStage('G2 · Admin traffic, toggled', '#gate-g2', 'G2a-');
  }
  if (MODE === '4') {
    // (2026-09-21 14:47 EDT) Every section's STATE switch (its head's segmented control) and every Try button above a stage, each walked in turn.
    const acts = await p.evaluate(() => [...document.querySelectorAll('.b4g')].flatMap((g) => [
        ...[...g.querySelectorAll('.pb-ctl button')].slice(1).map((b, i) => [g.id, 'state', i + 1, b.textContent.trim()]),
        ...[...g.querySelectorAll('.b4-try button')].map((b, i) => [g.id, 'try', i, b.textContent.trim()])]));
    for (const [gid, kind, i, label] of acts) {
      const ok = await p.evaluate((gid, kind, i) => { const g = document.getElementById(gid); const b = kind === 'state' ? g.querySelectorAll('.pb-ctl button')[i] : g.querySelectorAll('.b4-try button')[i]; if (!b) return false; b.click(); return true; }, gid, kind, i);
      await new Promise((r) => setTimeout(r, 1600));
      if (ok) await dumpStage(`${gid.slice(2)} · ${label}`, `#${gid} .pb-head ~ :not(.pb-new):not(.b4-try):not(.b4-forks)`, `${gid.slice(2)}${kind[0]}${i}-`);
    }
  }
  if (MODE === '4') {
    // (2026-09-27 02:43 EDT) Every FORK option in a section's `.b4-forks` (Compare's Table and Empty), each with the section's states re-walked, then the
    // fork restored. Before this, only the held option (A) was ever specced: Tables B and C and Empties B and C had no values at all.
    // (2026-09-27 02:54 EDT) The stage is the section's first sibling after its head that is not the notes, the Try row or the FORK row. Without
    // `:not(.b4-forks)` the fork row itself was the stage in C3 — every Compare dump since the forks landed specced the fork switches (5
    // signatures) and the Compare body (`div.b1.b4-cmp`) sat in "Not reached".
    const forks = await p.evaluate(() => [...document.querySelectorAll('.b4g')].flatMap((g) => [...g.querySelectorAll('.b4-fork')].map((f, fi) => {
      const bs = [...f.querySelectorAll('button')]; return [g.id, fi, bs.map((b) => b.textContent.trim()), bs.findIndex((b) => b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-checked') === 'true' || b.classList.contains('on'))]; })));
    for (const [gid, fi, opts, cur] of forks) {
      for (let oi = 0; oi < opts.length; oi++) {
        if (oi === cur) continue;
        await p.evaluate((gid, fi, oi) => document.getElementById(gid).querySelectorAll('.b4-fork')[fi].querySelectorAll('button')[oi].click(), gid, fi, oi);
        await new Promise((r) => setTimeout(r, 1200));
        const nst = await p.evaluate((gid) => document.getElementById(gid).querySelectorAll('.pb-ctl button').length, gid);
        for (let si = 0; si < Math.max(1, nst); si++) {
          if (nst) { await p.evaluate((gid, si) => document.getElementById(gid).querySelectorAll('.pb-ctl button')[si].click(), gid, si); await new Promise((r) => setTimeout(r, 1400)); }
          await dumpStage(`${gid.slice(2)} · ${opts[oi]}${nst ? ` · state ${si + 1}` : ''}`, `#${gid} .pb-head ~ :not(.pb-new):not(.b4-try):not(.b4-forks)`, `${gid.slice(2)}f${fi}o${oi}s${si}-`);
        }
      }
      await p.evaluate((gid, fi, cur) => { const b = document.getElementById(gid).querySelectorAll('.b4-fork')[fi].querySelectorAll('button')[Math.max(0, cur)]; if (b) b.click(); }, gid, fi, cur);
      await new Promise((r) => setTimeout(r, 800));
    }
  }
  if (MODE === '4') {
    // (2026-09-29 19:26 EDT) THE POP-UPS. Each is closed at rest, so no walk above reached one: HANDOFF.md listed the date picker's values as
    // missing (0 `.b3-dp-*` rows). Each pop-up in board4-walk.cjs's POPS is opened with a real pointer (the family opens on pointer events) and
    // specced from its parent, so the pop-up's own surface is a row too.
    const W = require('./board4-walk.cjs');
    for (const [pi, pop] of W.POPS.entries()) {
      const o = await W.openPop(p, pop);
      if (!o.ok) { out.push(`\n### ${pop.g} · ${pop.label}, open\n\n**Not opened:** ${o.why}\n`); await W.closePop(p); continue; }
      await p.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find((x) => getComputedStyle(x).display !== 'none' && x.getBoundingClientRect().height > 0); if (e && e.parentElement) e.parentElement.setAttribute('data-spec-pop', '1'); }, pop.sel || W.POP_SEL);
      await dumpStage(`${pop.g} · ${pop.label}, open`, '[data-spec-pop]', `${pop.g}pop${pi}-`);
      await p.evaluate(() => document.querySelectorAll('[data-spec-pop]').forEach((e) => e.removeAttribute('data-spec-pop')));
      await W.closePop(p);
    }
  }
  if (MODE === '3e') {
  if (await click('#g-export .exs-i .b3-xf-fn')) await dumpStage('M3 · the landing\'s rename field, open', '#g-export .g-stage', 'M3e-');
  await p.keyboard.press('Escape'); await new Promise((r) => setTimeout(r, 300));
  if (await click('#g-export .exs-i .b3-btn2.stage')) {
    await dumpStage('M3 · the picker step', '#g-export .g-stage', 'M3p-');
    if (await click('#g-export .b3-xt-c, #g-export [data-id] .b3-xt-c, #g-export .b3-xt-w button')) await dumpStage('M3 · a file with builds in it', '#g-export .g-stage', 'M3f-');
    if (await click('#g-export .b3-xf .b3-xf-fn:not(.editing)')) await dumpStage('M3 · a file\'s rename field, open', '#g-export .g-stage', 'M3r-');
  }
  if (await click('#g-armory-manifest .wg-r .wg-cb, #g-armory-manifest .wg-r .cb')) await dumpStage('M1 · one build selected (the selection bar)', '#g-armory-manifest .g-stage', 'M1s-');
  const typed = await p.evaluate(() => { const i = document.getElementById('history-search'); if (!i) return false; i.focus(); i.value = 'bot'; i.dispatchEvent(new Event('input', { bubbles: true })); return true; });
  if (typed) { await new Promise((r) => setTimeout(r, 600)); await dumpStage('H1 · a typed search', '#g-history .g-stage', 'H1q-'); }
  }

  // ── Command search: settled, unmounted, and this board is still its only specification ──
  const cmdOk = MODE !== '3e' ? 'n/a' : await p.evaluate(async () => {
    const host = document.createElement('section'); host.id = 'g-cmd'; host.innerHTML = '<div class="pb-stage g-stage" style="position:relative;min-height:520px;padding:24px"></div>';
    document.getElementById('board').appendChild(host);
    const { html } = await import('/docs/pins2/kit/vendor/htm-preact.mjs'); const { render } = await import('/docs/pins2/kit/vendor/preact.mjs');
    const { B3CommandBar } = await import('/docs/pins2/kit/b3/palette.js'); const { hooks } = await import('/docs/pins2/kit/b3/state.js');
    render(html`<${B3CommandBar} commands=${[]} realmLabel="Armory" />`, host.firstElementChild); await new Promise((r) => setTimeout(r, 300));
    window.__cmd = (t) => hooks.paletteType && hooks.paletteType(t); return !!hooks.paletteType;
  }).catch((e) => String(e));
  if (MODE === '3e') out.push('\n## P7 · Command search — settled "as shown", mounted here from `b3/palette.js`\n\nHe settled it: *"Build it properly, and exactly as shown."* It carries no fork, it is no longer a gate, and this board is still its only specification — so it is mounted here from the kit\'s own `B3CommandBar` over the board\'s stylesheets. ⚠️ **The LOOK ships with this plan; the RANKING does not** — `gates/main.js` records it as its own session: *"badge cx9" returns what "badge" alone returns, and the ranking needs rebuilding.*\n');
  if (cmdOk === true) {
    await dumpStage('P7 · closed, resting', '#g-cmd .g-stage', 'P7-');
    for (const [q, name] of [['meta cx9', 'a badge and a weapon — the compose row'], ['badge', 'an action word — Do · Find · Go'], ['zzzz', 'nothing matches — the empty state']]) {
      await p.evaluate((q) => window.__cmd(q), q); await new Promise((r) => setTimeout(r, 500));
      await dumpStage(`P7 · typed “${q}” — ${name}`, '#g-cmd .g-stage', `P7${q.replace(/\W/g, '')}-`);
    }
  } else if (MODE === '3e') out.push(`**Could not be mounted:** \`${cell(cmdOk)}\` — spec it from \`b3/palette.js\` and the \`.b3-cmd*\` rules in \`b3/board.css\`.\n`);

  // ── Coverage: nothing that rendered in a stage went unspecced ──
  const untagged = await p.evaluate((all) => [...document.querySelectorAll(all + ' *')].filter((e) => !e.closest('svg') || e.tagName.toLowerCase() === 'svg')
    .filter((e) => (e.getAttribute('class') || '').trim() && getComputedStyle(e).display !== 'none')
    .map((e) => e.tagName.toLowerCase() + '.' + e.getAttribute('class').trim().split(/\s+/).sort().join('.') + (e.getAttribute('role') ? `[role=${e.getAttribute('role')}]` : ''))
    , CFG.stageAll).then((list) => [...new Set(list)].filter((sig) => !sigSeen.has(sig)).slice(0, 60));
  const head = [`# ${CFG.title} — resolved values`, '', `*Generated ${new Date().toISOString()} by \`extract-spec.cjs\` from ${URL_} at 1282×888, fresh profile. ${specced} looks specced across ${sigSeen.size} signatures. Page errors: ${errs.length}. Classed signatures rendered in a stage that no pass reached: **${untagged.length}**. Winning declarations the computed value contradicts: **${mismatches}** (marked ⚠️).*`, '',
    '**How to read a table.** *winning declaration* is the text Chrome applied for that property name, in cascade order with `!important` honoured; *computed* is what it resolved to; *from* is the selector and `file:line` in the kit. ↑ means nothing on the element declares it and the value is inherited from the named ancestor rule. ⚠️ means a DIFFERENT property name overrode it later — a shorthand beaten by a longhand or the reverse (`padding` against `padding-inline`) — and **the computed column is the truth**. A user-agent row is kept only where it sets something other than a default.', ''];
  if (untagged.length) head.push('⚠️ **Not reached** (rendered, classed, never walked — each is a coverage hole):\n\n' + untagged.map((x) => `- \`${x}\``).join('\n') + '\n');
  if (errs.length) head.push('⚠️ **Page errors during extraction:**\n\n' + errs.map((x) => `- \`${cell(x).slice(0, 200)}\``).join('\n') + '\n');
  fs.writeFileSync(OUT, head.join('\n') + '\n' + out.join('\n'));
  console.log(JSON.stringify({ out: OUT, specced, signatures: sigSeen.size, variantsTotal, untagged: untagged.length, mismatches, errs: errs.length, cmd: cmdOk === true }));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
