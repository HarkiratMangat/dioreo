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
//   default url  http://127.0.0.1:8900/local/pins2-board-3/redo/board3e.html   (the kit is ES modules, so it needs http, not file://)
//   Needs the kit's dev server up. A FRESH Chrome profile is used every run, so the board renders its defaults — which carry every
//   ruled pick — rather than whatever a browser remembered.
const path = require('path'); const fs = require('fs'); const os = require('os');
const puppeteer = require(path.resolve(__dirname, '../../../../../node_modules/puppeteer-core'));
const URL_ = process.argv[2] || 'http://127.0.0.1:8900/local/pins2-board-3/redo/board3e.html';
const OUT = process.argv[3] || path.join(require('os').tmpdir(), 'b3e-spec.md');
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
  c.on('CSS.styleSheetAdded', ({ header }) => { sheets[header.styleSheetId] = (header.sourceURL || '').split('/redo/').pop() || (header.isInline ? 'inline <style>' : '?'); });
  await c.send('DOM.enable'); await c.send('CSS.enable');
  await p.goto(URL_, { waitUntil: 'networkidle0' });
  await p.waitForSelector('#g-history .b3-hi-r', { timeout: 20000 });
  await p.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 900));

  const src = (rule) => `${sheets[rule.styleSheetId] || (rule.origin === 'user-agent' ? 'user-agent' : '?')}:${rule.style && rule.style.range ? rule.style.range.startLine + 1 : '?'}`;
  const winner = (rules, inline, prop) => {
    let best = null;
    const take = (props, from) => (props || []).forEach((d) => { if (d.name !== prop || d.disabled || d.parsedOk === false) return;
      const imp = !!d.important; if (!best || imp || !best.imp) best = { v: d.value + (imp ? ' !important' : ''), from, imp }; });
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
        const plain = (x) => /^-?[\d.]+(px|em|%)?$/.test(String(x).trim());
        const bad = plain(w.v) && plain(comp[pr]) && parseFloat(w.v) !== parseFloat(comp[pr]) && !/em$/.test(String(w.v).trim());
        if (bad) mismatches++;
        rows.push(`| ${pr} | ${bad ? '⚠️ ' : ''}\`${cell(w.v)}\` | \`${cell(comp[pr])}\` | ${w.from}${bad ? ' · **overridden — see computed**' : ''} |`); continue; }
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
      for (const st of ['hover', 'focus-visible', 'active']) {
        await c.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [st] });
        const cs2 = await computed(nodeId);
        await c.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
        const d = PROPS.filter((pr) => comp[pr] !== undefined && cs2[pr] !== comp[pr]).map((pr) => `| ${pr} | \`${cell(comp[pr])}\` | \`${cell(cs2[pr])}\` |`);
        out.push(`**:${st}** — ${d.length ? 'changes' : 'changes nothing on the element (its ::before or a parent may still respond; see the rows above)'}\n` + (d.length ? '\n| property | at rest | ' + st + ' |\n|---|---|---|\n' + d.join('\n') + '\n' : ''));
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
  const kitCss = ['b3/board.css', 'gates.css', 'app.css', 'b2.css'].map((f) => fs.readFileSync(path.resolve(__dirname, '../../../../../local/pins2-board-3/redo', f), 'utf8')).join('\n');
  const names = [...new Set([...kitCss.matchAll(/var\((--[\w-]+)/g)].map((x) => x[1]))].sort();
  const tok = await p.evaluate((names) => { const s = getComputedStyle(document.documentElement); return names.map((n) => [n, s.getPropertyValue(n).trim()]); }, names);
  const defined = new Set([...kitCss.matchAll(/(--[\w-]+)\s*:/g)].map((x) => x[1]));
  out.push('## Tokens as resolved on `:root`\n\nEvery custom property the kit\'s four stylesheets read. **Scope** says where it is set: `:root` means a global token; `component` means a rule sets it on an element (read its value in that element\'s table); `JS` means only `b3/state.js` stamps it at runtime, so it does not exist in any stylesheet and must become a real token or a literal when ported.\n\n| token | value on :root | scope |\n|---|---|---|\n' +
    tok.map(([n, v]) => `| \`${n}\` | ${v ? '`' + cell(v).replace(/url\("data:[^)]{60,}\)/g, (u) => u.slice(0, 44) + '…")') + '`' : '—'} | ${n.startsWith('--h1-') ? 'JS · `b3/state.js` stamp()' : v ? ':root' : defined.has(n) ? 'component' : 'fallback only'} |`).join('\n') + '\n');

  // ── Motion ──
  const kf = await p.evaluate(() => { const o = []; for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; }
    for (let i = 0; i < rs.length; i++) if (rs[i].type === 7) o.push([rs[i].name, (sh.href || 'inline').split('/redo/').pop(), rs[i].cssText.replace(/\s+/g, ' ')]); } return o; });
  const usedKf = new Set([...kitCss.matchAll(/animation(?:-name)?\s*:\s*([\w-]+)/g)].map((x) => x[1]));
  out.push('\n## @keyframes the board uses\n\n' + kf.filter(([n]) => usedKf.has(n)).map(([n, f, t]) => `**\`${n}\`** · ${f}\n\n\`\`\`css\n${t}\n\`\`\`\n`).join('\n'));

  // ── Every gate, resting ──
  for (const [gid, id, title, note] of GATES) { out.push(`\n## ${gid} · ${title} — resting\n`); await dumpStage(`${gid} stage`, `#g-${id} .g-stage`, `${gid}-`, note); }

  // ── Reachable states, each re-censused so only what is NEW is specced ──
  const click = async (sel) => { const ok = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, sel); await new Promise((r) => setTimeout(r, 700)); return ok; };
  out.push('\n## Reachable states\n\nEach state is reached by the interaction named, then the stage is walked again; only signatures or looks not seen above are specced.\n');
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

  // ── Command search: settled, unmounted, and this board is still its only specification ──
  const cmdOk = await p.evaluate(async () => {
    const host = document.createElement('section'); host.id = 'g-cmd'; host.innerHTML = '<div class="pb-stage g-stage" style="position:relative;min-height:520px;padding:24px"></div>';
    document.getElementById('board').appendChild(host);
    const { html } = await import('/local/pins2-board-3/redo/vendor/htm-preact.mjs'); const { render } = await import('/local/pins2-board-3/redo/vendor/preact.mjs');
    const { B3CommandBar } = await import('/local/pins2-board-3/redo/b3/palette.js'); const { hooks } = await import('/local/pins2-board-3/redo/b3/state.js');
    render(html`<${B3CommandBar} commands=${[]} realmLabel="Armory" />`, host.firstElementChild); await new Promise((r) => setTimeout(r, 300));
    window.__cmd = (t) => hooks.paletteType && hooks.paletteType(t); return !!hooks.paletteType;
  }).catch((e) => String(e));
  out.push('\n## P7 · Command search — settled "as shown", mounted here from `b3/palette.js`\n\nHe settled it: *"Build it properly, and exactly as shown."* It carries no fork, it is no longer a gate, and this board is still its only specification — so it is mounted here from the kit\'s own `B3CommandBar` over the board\'s stylesheets. ⚠️ **The LOOK ships with this plan; the RANKING does not** — `gates/main.js` records it as its own session: *"badge cx9" returns what "badge" alone returns, and the ranking needs rebuilding.*\n');
  if (cmdOk === true) {
    await dumpStage('P7 · closed, resting', '#g-cmd .g-stage', 'P7-');
    for (const [q, name] of [['meta cx9', 'a badge and a weapon — the compose row'], ['badge', 'an action word — Do · Find · Go'], ['zzzz', 'nothing matches — the empty state']]) {
      await p.evaluate((q) => window.__cmd(q), q); await new Promise((r) => setTimeout(r, 500));
      await dumpStage(`P7 · typed “${q}” — ${name}`, '#g-cmd .g-stage', `P7${q.replace(/\W/g, '')}-`);
    }
  } else out.push(`**Could not be mounted:** \`${cell(cmdOk)}\` — spec it from \`b3/palette.js\` and the \`.b3-cmd*\` rules in \`b3/board.css\`.\n`);

  // ── Coverage: nothing that rendered in a stage went unspecced ──
  const untagged = await p.evaluate(() => [...document.querySelectorAll('.g-stage *')].filter((e) => !e.closest('svg') || e.tagName.toLowerCase() === 'svg')
    .filter((e) => (e.getAttribute('class') || '').trim() && getComputedStyle(e).display !== 'none')
    .map((e) => e.tagName.toLowerCase() + '.' + e.getAttribute('class').trim().split(/\s+/).sort().join('.') + (e.getAttribute('role') ? `[role=${e.getAttribute('role')}]` : '')))
    .then((list) => [...new Set(list)].filter((sig) => !sigSeen.has(sig)).slice(0, 60));
  const head = [`# Design Board 3-E — resolved values`, '', `*Generated ${new Date().toISOString()} by \`extract-spec.cjs\` from ${URL_} at 1282×888, fresh profile. ${specced} looks specced across ${sigSeen.size} signatures. Page errors: ${errs.length}. Classed signatures rendered in a stage that no pass reached: **${untagged.length}**. Winning declarations the computed value contradicts: **${mismatches}** (marked ⚠️).*`, '',
    '**How to read a table.** *winning declaration* is the text Chrome applied for that property name, in cascade order with `!important` honoured; *computed* is what it resolved to; *from* is the selector and `file:line` in the kit. ↑ means nothing on the element declares it and the value is inherited from the named ancestor rule. ⚠️ means a DIFFERENT property name overrode it later — a shorthand beaten by a longhand or the reverse (`padding` against `padding-inline`) — and **the computed column is the truth**. A user-agent row is kept only where it sets something other than a default.', ''];
  if (untagged.length) head.push('⚠️ **Not reached** (rendered, classed, never walked — each is a coverage hole):\n\n' + untagged.map((x) => `- \`${x}\``).join('\n') + '\n');
  if (errs.length) head.push('⚠️ **Page errors during extraction:**\n\n' + errs.map((x) => `- \`${cell(x).slice(0, 200)}\``).join('\n') + '\n');
  fs.writeFileSync(OUT, head.join('\n') + '\n' + out.join('\n'));
  console.log(JSON.stringify({ out: OUT, specced, signatures: sigSeen.size, variantsTotal, untagged: untagged.length, mismatches, errs: errs.length, cmd: cmdOk === true }));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
