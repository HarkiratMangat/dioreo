// Resolved-value spec for pins-2 design board 2 (plan 2026-09-13-portal-pins-batch-2 §10.4).
// The board's CSS is thirteen rounds of layered overrides, so reading it top-down gives WRONG values: the first `.pb-rb` rule says 44px 116px…, the rule that renders says 32px 28px…. This script asks Chrome which declaration actually won for each property of each element (CSS.getMatchedStylesForNode, cascade order, !important honoured) and prints it beside the computed value, so a builder ports the winning expression — tokens and color-mix intact — not a guess.
// Usage: node extract-spec.cjs <board html> <out.md>   (run `node -e "require('./scripts/buildPortal').build()"` first when the board links portal/public/app.css)
const puppeteer = require(require('path').resolve(__dirname, '../../../../node_modules/puppeteer-core'));
const fs = require('fs'); const path = require('path');
const [htmlArg, outArg] = process.argv.slice(2);
const PROPS = ['display', 'grid-template-columns', 'gap', 'column-gap', 'row-gap', 'align-items', 'align-self', 'justify-self', 'place-items', 'flex', 'flex-wrap', 'width', 'min-width', 'max-width', 'height', 'min-height', 'padding', 'padding-block', 'padding-left', 'padding-right', 'margin', 'margin-left', 'margin-right', 'inset', 'top', 'right', 'bottom', 'left', 'border-radius', 'background', 'background-color', 'background-image', 'box-shadow', 'outline', 'outline-offset', 'font', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'text-decoration', 'text-underline-offset', 'color', 'opacity', 'white-space', 'overflow', 'clip-path', 'transition', 'cursor', 'content', 'isolation', 'z-index'];
const ALWAYS = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color'];
// [label, selector, pseudo list, state setup key]
const G4 = [
  ['Tools bar', '#g4man .pb-tools'], ['Toolbar label, first column', '#g4man .pb-t1 > .pb-lab'], ['Search field', '#g4man .pb-srch input'], ['Add build', '#g4man .pb-add'],
  ['Chip group', '#g4man .pb-t2 > .pb-grp:first-child'], ['Chip group after a divider', '#g4man .pb-t2 > .pb-grp + .pb-grp'], ['Label after a divider', '#g4man .pb-t2 > .pb-grp + .pb-grp > .pb-lab'], ['Category chip', '#g4man .pb-t2 .chip.topic'], ['List · By slot switch', '#g4man .pb-t2 .pb-seg'],
  ['Column heads', '#g4man .pb-heads.pb-ghead'], ['Weapon sort', '#g4man .pb-sort'], ['Collapse all', '#g4man .pb-fold', ['before']],
  ['Weapon group', '#g4man .pb-g'], ['Weapon header', '#g4man .pb-gh', ['before']], ['Weapon name', '#g4man .pb-gline b'], ['Category word', '#g4man .pb-gline small'], ['Build count', '#g4man .pb-nb', ['before']], ['Tag group', '#g4man .pb-gtags'], ['Tier tag', '#g4man .pb-tag'],
  ['Fix chip wrapper', '#g4man .pb-fwrap'], ['Fix chip', '#g4man .pb-fsum'], ['Fix chip build number', '#g4man .pb-fnos i'], ['Fault popover', '#g4man .pb-fpop'], ['Popover row', '#g4man .pb-fpr'], ['Popover build number', '#g4man .pb-fpr > i'], ['Popover text', '#g4man .pb-fpr > span'], ['Weapon collapse button', '#g4man .pb-fbtn', ['before']],
  ['Build row', '#g4man .pb-rb', ['before']], ['Build row, hovered (demo class)', '#g4man .pb-rb.pb-hov', ['before']], ['Build row needing a fix', '#g4man .pb-rb.pb-bad', ['after']], ['Row checkbox', '#g4man .pb-rb .pb-cb'], ['Build number', '#g4man .pb-ix'],
  ['Named content cell', '#g4man .pb-main.pb-named'], ['Unnamed content cell', '#g4man .pb-main:not(.pb-named)'], ['Build name plate', '#g4man .pb-plate', ['after']], ['Plate eyebrow', '#g4man .pb-plate > small'], ['Plate name', '#g4man .pb-plate > span'],
  ['Attachment list', '#g4man .pb-rail'], ['Attachment tag, slot known', '#g4man .pb-rail > .pb-at[style]'], ['Attachment tag, slot unknown', '#g4man .pb-rail > .pb-at:not([style]):not(.pb-atgap)'], ['Empty slot tag', '#g4man .pb-rail > .pb-atgap'],
  ['Image set', '#g4man .pb-im:not(.no)'], ['Image missing', '#g4man .pb-im.no'],
  ['Code button', '#g4man button.pb-igw'], ['Code field group', '#g4man .pb-igw .pb-ig'], ['Code field', '#g4man .pb-igw .pb-igf'], ['Code text', '#g4man .pb-ct:not(.bad)'], ['Code text, faulty', '#g4man .pb-ct.bad'], ['Copy segment', '#g4man .pb-igb'], ['No code field', '#g4man .pb-ig.none'], ['No code text', '#g4man .pb-cnone'],
  ['Row actions', '#g4man .pb-rb .pb-acts'], ['Share button', '#g4man .pb-rb .pb-acts > .pb-ib:first-child', ['before']], ['Divider before delete', '#g4man .pb-rb .pb-vr'], ['Delete button', '#g4man .pb-rb .pb-del', ['before']],
];
const SLOTS = [['Slot strip', '#g4man .pb-strip'], ['Slot cell', '#g4man .pb-sc'], ['Empty slot cell', '#g4man .pb-sc.pb-empty']];
const HOVER = [['Share button, hovered', '#g4man .pb-rb .pb-acts > .pb-ib:first-child', ['before']], ['Delete button, hovered', '#g4man .pb-rb .pb-del', ['before']], ['Copy button, hovered', '#g4man button.pb-igw'], ['Copy segment, hovered', '#g4man button.pb-igw .pb-igb'], ['Attachment tag, row hovered', '#g4man .pb-rb.pb-hov .pb-rail > .pb-at[style]']];
const G11 = [
  ['Broadcast tools bar', '#g11bc .pb-tools'], ['State chip', '#g11bc .chip.topic'], ['Broadcast heads', '#g11bc .pb-heads.pb-bc'], ['Sortable head', '#g11bc .pb-sort'],
  ['Announcement row', '#g11bc .pb-br', ['before']], ['Announcement row, hovered (demo class)', '#g11bc .pb-br.pb-hov'], ['Announcement text', '#g11bc .pb-bt b'], ['Date cell', '#g11bc .pb-dt'], ['Date age line', '#g11bc .pb-dt small'], ['Starts "On posting"', '#g11bc .pb-dt.pb-dim'], ['Ends "No end"', '#g11bc .pb-dt.pb-never'],
  ['State tab, live', '#g11bc .pb-life[data-l=live]'], ['State tab, upcoming', '#g11bc .pb-life[data-l=upcoming]'], ['State tab, ended', '#g11bc .pb-life[data-l=ended]'], ['Row delete', '#g11bc .pb-br > .pb-ib', ['before']],
  ['History search count', '#g11hist .pb-hits'], ['Kind chip', '#g11hist .chip.topic'], ['Level chip', '#g11hist .chip.pb-lv'], ['Severity bars', '#g11hist .pb-sev'], ['Severity bar', '#g11hist .pb-sev i'], ['Load older events', '#g11hist .pb-more .chip'],
];
const STAGED = [['State tab, staged', '#g11bc .pb-life.pb-staged']];
const G3 = [
  ['Queue head', '#g3 .pb-qhead'], ['Card', '#g3 .pb-card', ['before']], ['Position number', '#g3 .pb-numr'], ['Text enclosure', '#g3 .pb-enc'], ['Enclosure text', '#g3 .pb-enc p'], ['Enclosure footer', '#g3 .pb-encf'], ['Show all', '#g3 .pb-enc .pb-exp'],
  ['Lifespan row', '#g3 .pb-tl'], ['Date box', '#g3 .pb-end:not(.pb-nev)'], ['No end box', '#g3 .pb-end.pb-nev'], ['Bar', '#g3 .pb-tl .pb-bar'], ['Track', '#g3 .pb-tl .pb-track'], ['Span', '#g3 .pb-span:not(.pb-open)'], ['Open span', '#g3 .pb-span.pb-open', ['after']], ['Today marker', '#g3 .pb-tl .pb-now'],
  ['Meta row', '#g3 .pb-dates'], ['Meta pill', '#g3 .pb-pill'], ['Card actions', '#g3 .pb-dates .pb-cacts'], ['Card action', '#g3 .pb-cacts > .pb-ib', ['before']], ['Card divider', '#g3 .pb-cacts .pb-vr'], ['Banner', '#g3 .pb-ban'],
];
const QUEUE = [['View bar', '#qafter .pb-vb'], ['Slots meter line', '#qafter .pb-qcount'], ['Meter', '#qafter .cmeter'], ['Queue body', '#qafter .pb-qafter'], ['Changes ahead column', '#qafter .pb-cg'], ['Column heading', '#qafter .pb-cg h5'], ['Change card', '#qafter .pb-cgi'], ['Change date', '#qafter .pb-cgi time'], ['Change text', '#qafter .pb-cgi b'], ['Change verb', '#qafter .pb-cgi em']];
const G2 = [['Analytics view bar', '[data-gate=g2] .pb-vb'], ['Include group', '.pb-inc'], ['Include label', '.pb-inc > span'], ['Admin traffic chip', '.chip.pb-adm'], ['Admin traffic chip, on', '.chip.pb-adm[aria-pressed=true]']];
const TOKENS = ['--tap', '--rad-1', '--rad-2', '--rad-3', '--rad-pill', '--t-micro', '--t-xs', '--t-sm', '--t-base', '--t-md', '--ui', '--data', '--display', '--ink', '--ink2', '--ink3', '--ink4', '--rule', '--rule2', '--rule3', '--desk', '--sunk', '--paper', '--raised', '--hi', '--ok', '--warn', '--warn-ink', '--danger-ink', '--patch', '--info', '--sched', '--r-armory', '--r-broadcast', '--r-history', '--r-analytics', '--sl-muzzle', '--sl-barrel', '--sl-optic', '--sl-stock', '--sl-perk', '--sl-laser', '--sl-underbarrel', '--sl-ammunition', '--sl-rear-grip', '--pb-inset'];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: path.join(require('os').tmpdir(), 'pins2-board-2-spec-chrome'), args: ['--allow-file-access-from-files'] });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888 });
  await p.goto('file://' + path.resolve(htmlArg), { waitUntil: 'networkidle0' }); await p.evaluate(() => document.fonts.ready);
  const c = await p.target().createCDPSession(); await c.send('DOM.enable'); await c.send('CSS.enable');
  const win = (rules, inline, prop) => {
    let best = null;
    const consider = (props, src) => props.forEach((d) => { if (d.name !== prop || d.disabled || d.parsedOk === false) return; const imp = !!d.important; if (!best || imp || !best.imp) { if (!best || imp || !best.imp) best = { v: d.value + (imp ? ' !important' : ''), src, imp }; } });
    rules.forEach((m) => consider(m.rule.style.cssProperties, m.rule.selectorList.text));
    if (inline) consider(inline.cssProperties, 'style attribute');
    return best;
  };
  const out = [];
  const dump = async (title, list, note) => {
    out.push(`\n## ${title}\n`); if (note) out.push(note + '\n');
    for (const [label, sel, pseudos = []] of list) {
      const { root } = await c.send('DOM.getDocument', { depth: -1 });
      const { nodeId } = await c.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
      if (!nodeId) { out.push(`### ${label}\n\n\`${sel}\` — **not present in this state**\n`); continue; }
      const m = await c.send('CSS.getMatchedStylesForNode', { nodeId });
      const comp = Object.fromEntries((await c.send('CSS.getComputedStyleForNode', { nodeId })).computedStyle.map((x) => [x.name, x.value]));
      const box = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}`; }, sel);
      out.push(`### ${label}\n\n\`${sel}\` · rendered ${box}\n`);
      const rows = [];
      PROPS.forEach((pr) => { const w = win(m.matchedCSSRules, m.inlineStyle, pr); if (w || ALWAYS.includes(pr)) rows.push(`| ${pr} | ${w ? '`' + w.v.replace(/\|/g, '\\|') + '`' : '—'} | \`${String(comp[pr] ?? '').replace(/\|/g, '\\|')}\` |`); });
      out.push('| property | winning declaration | computed |\n|---|---|---|\n' + rows.join('\n') + '\n');
      for (const ps of pseudos) {
        const pe = (m.pseudoElements || []).find((x) => x.pseudoType === ps);
        if (!pe) continue;
        const prow = []; PROPS.forEach((pr) => { const w = win(pe.matches, null, pr); if (w) prow.push(`| ${pr} | \`${w.v.replace(/\|/g, '\\|')}\` |`); });
        out.push(`**::${ps}**\n\n| property | winning declaration |\n|---|---|\n` + prow.join('\n') + '\n');
      }
    }
  };
  const tok = await p.evaluate((names) => { const s = getComputedStyle(document.documentElement); return names.map((n) => [n, s.getPropertyValue(n).trim()]); }, TOKENS);
  out.push('## Tokens as resolved on the board\n\n| token | value |\n|---|---|\n' + tok.map(([n, v]) => `| \`${n}\` | \`${v || '(unset)'}\` |`).join('\n') + '\n');
  await dump('G4 · Armory manifest — resting state', G4);
  const hov = async (sel) => { const { root } = await c.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await c.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel }); if (nodeId) await c.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] }); };
  for (const [, sel] of HOVER) await hov(sel);
  await dump('G4 · hover states (forced :hover)', HOVER);
  await p.click('[data-seg=att] button[data-v=slots]'); await new Promise((r) => setTimeout(r, 300));
  await dump('G4 · By slot view', SLOTS, 'Reached with the List · By slot switch.');
  await p.click('[data-seg=att] button[data-v=list]');
  await dump('G11 · Broadcast manifest and History chips', G11);
  await p.click('[data-seg=bstaged] button[data-v=on]'); await new Promise((r) => setTimeout(r, 300));
  await dump('G11 · a staged state', STAGED, 'Reached with the board\'s "One staged" switch.');
  await dump('G3 · Announcement card', G3);
  await dump('Broadcast delivery queue', QUEUE);
  await p.click('.chip.pb-adm');
  await dump('G2 · Admin traffic', G2);
  fs.writeFileSync(outArg, out.join('\n'));
  console.log('wrote', outArg, out.length, 'blocks');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
