// Resolved-value spec for pins-2 design board 1 — G9 (New build) and G8 (Post an announcement).
//
// 🔴 WHY THIS EXISTS. Board 2 shipped `resolved-spec.md` and its Armory manifest ported at ~95%. Board 1 shipped a
// rendered page and prose notes, and its two drawers came back as "this looks NOTHING like the Design Board render"
// (pin 2) and "DOES NOT meet my expectation and standards" (pin 48). Board 1 has had no spec since 2026-09-14; this
// writes one. The structural half — where the portal uses a datalist for a combobox, a checkbox for a pressed toggle,
// a select for a segmented control — is `handoff-g9-g8.md` beside the board, and it comes FIRST: values only carry
// across where the two sides already correspond.
//
// Same engine as board 2's `extract-spec.cjs`: ask Chrome which declaration actually WON for each property
// (CSS.getMatchedStylesForNode honours cascade order and !important), print it beside the computed value, so a builder
// ports the winning expression with its tokens and color-mix intact rather than a flattened rgb().
//
// ⚠️ Board 1 has NO gate ids — three `<section class="pb-gate">`, two of them `data-realm="armory"` — so every selector
// scopes by the drawer's own `aria-label`, which is stable and needs no edit to a tracked mockup.
//
// Usage: node board1-extract.cjs [out.md]
const puppeteer = require(require('path').resolve(__dirname, '../../../node_modules/puppeteer-core'));
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const BOARD = path.join(ROOT, 'docs/superpowers/mockups/2026-09-14-pins2-board/index.html');
const OUT = process.argv[2] || path.join(ROOT, 'docs/superpowers/mockups/2026-09-14-pins2-board/resolved-spec.md');

const cell = (v) => String(v).replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
const PROPS = ['display', 'grid-template-columns', 'gap', 'column-gap', 'row-gap', 'align-items', 'align-self', 'justify-self', 'justify-content', 'place-items', 'flex', 'flex-wrap', 'width', 'min-width', 'max-width', 'height', 'min-height', 'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom', 'margin', 'margin-left', 'margin-right', 'margin-top', 'inset', 'top', 'right', 'bottom', 'left', 'border', 'border-radius', 'background', 'background-color', 'background-image', 'box-shadow', 'outline', 'outline-offset', 'font', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'text-decoration', 'color', 'opacity', 'white-space', 'overflow', 'transition', 'cursor', 'content', 'isolation', 'z-index'];
const ALWAYS = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color'];

const NB = 'aside.drawer[aria-label="New build"]';
const AN = 'aside.drawer[aria-label="Post an announcement"]';

// [label, selector, pseudo-elements]
const G9 = [
    ['Drawer', NB], ['Header', `${NB} .dw-h`], ['Header title block', `${NB} .dw-ttl`], ['Eyebrow', `${NB} .dw-eye`],
    ['Header heading', `${NB} .dw-ttl h2`], ['Close button', `${NB} .x`],
    ['Mode bar', `${NB} .pb-bar`], ['Mode segment', `${NB} .pb-seg.pb-mode`], ['Segment thumb', `${NB} .pb-mode .pb-thumb`],
    ['Segment button, pressed', `${NB} .pb-mode button[aria-pressed=true]`], ['Segment button, unpressed', `${NB} .pb-mode button[aria-pressed=false]`],
    ['Bar divider', `${NB} .pb-div`], ['Create segment', `${NB} [data-seg=many]`],
    ['Body', `${NB} .dw-b`], ['Form bed', `${NB} .bed.bform`], ['Form main column', `${NB} .bed-main`],
    ['Form section', `${NB} .bf-sec`], ['Section heading', `${NB} .bf-h`], ['Two-up field grid', `${NB} .bed-g2`],
    ['Field', `${NB} .dwfield`], ['Field label', `${NB} .dwfield label`],
    ['Weapon combobox', `${NB} .pb-combo`], ['Weapon input', `${NB} .pb-combo input`], ['Category select', `${NB} .dwfield select`],
    ['Label field', `${NB} .pb-labelf`], ['Build number badge', `${NB} .pb-bno`], ['Build number', `${NB} .pb-num`],
    ['Label input', `${NB} #nb-label`],
    ['Code field', `${NB} .pb-codefield`], ['Code input', `${NB} #nb-code`], ['Code copy button', `${NB} .pb-copy`],
    ['Code result line', `${NB} .pb-hfill`],
    ['Attachment list', `${NB} .pb-atts`], ['Attachment row', `${NB} .pb-att`], ['Attachment row, auto-filled', `${NB} .pb-att.pb-auto`],
    ['Slot name', `${NB} .pb-slot`], ['Attachment input', `${NB} .ati`], ['Attachment remove', `${NB} .pb-rmv`],
    ['Open slot search', `${NB} .pb-ac`], ['Slot menu', `${NB} .pb-menu`], ['Slot menu option', `${NB} .pb-menu li`],
    ['Slot menu option, selected', `${NB} .pb-menu li[aria-selected=true]`], ['Slot menu match', `${NB} .pb-menu mark`],
    ['Badge group', `${NB} .pb-badges`], ['Badge toggle, on', `${NB} .pb-tog[aria-pressed=true]`],
    ['Badge toggle, off', `${NB} .pb-tog[aria-pressed=false]`], ['Toxic toggle', `${NB} .pb-tog.pb-tox`],
    ['Tier row', `${NB} .pb-rank[data-rank=MP]`], ['Tier segment', `${NB} [data-seg=rank]`],
    ['Image heading row', `${NB} .pb-imghead`], ['Image segment', `${NB} .pb-seg.pb-small`],
    ['Image view', `${NB} .pb-imgview[data-imgview=up]`], ['Image drop', `${NB} .pb-drop`], ['Image preview', `${NB} .pb-shot`],
    ['Image column', `${NB} .pb-dropcol`], ['File line', `${NB} .pb-file`], ['Found echo', `${NB} .pb-echo`],
    ['Side column', `${NB} .bed-side`], ['Side section', `${NB} .bed-sec`], ['Side heading', `${NB} .bed-sec h5`],
    ['Discord card', `${NB} .dcard.lc`], ['Card weapon', `${NB} .dcard.lc h6`], ['Card badges', `${NB} .lc-badges`],
    ['Card rule', `${NB} .lc-rule`], ['Card heading', `${NB} .lc-h`], ['Card attachments', `${NB} .lc-att`],
    ['Card attachment', `${NB} .lc-att code`], ['Card code', `${NB} .lc-code`], ['Card footer', `${NB} .lc-foot`],
    ['Footer', `${NB} .dw-f`], ['Footer cancel', `${NB} .dw-f .btn.no`],
    ['Footer secondary', `${NB} .dw-f .btn:not(.no):not(.go)`], ['Footer primary', `${NB} .dw-f .btn.go`],
];

const G9BULK = [
    ['Bulk view', `${NB} .pb-view[data-view="1"]`], ['Bulk layout', `${NB} .pb-bulk`],
    ['Editor head', `${NB} .pb-edhead`], ['Editor', `${NB} .pb-ed`],
    ['Block, updated', `${NB} .pb-blk[data-o=upd]`], ['Block, new', `${NB} .pb-blk[data-o=new]`],
    ['Block, warning', `${NB} .pb-blk[data-o=warn]`], ['Block, unreadable', `${NB} .pb-blk[data-o=bad]`],
    ['Block line', `${NB} .pb-l`], ['Block head line', `${NB} .pb-l.pb-hd`],
    ['Tally', `${NB} .pb-tally`], ['Tally cell', `${NB} .pb-tally > div`],
    ['Result list', `${NB} .pb-rows`], ['Result row', `${NB} .pb-row`], ['Result title', `${NB} .pb-rt`],
    ['Result line range', `${NB} .pb-ln`], ['Outcome word', `${NB} .pb-oc`], ['Result detail', `${NB} .pb-rd`],
    ['Result message', `${NB} .pb-rd.pb-msg`], ['Bulk footer note', `${NB} .why`],
];

const G8 = [
    ['Drawer', AN], ['Eyebrow', `${AN} .dw-eye`], ['Body', `${AN} .dw-b`], ['Bed', `${AN} .bed`], ['Field column', `${AN} .pb-col`],
    ['Text field', `${AN} .dwfield textarea`], ['Budget meter row', `${AN} .pb-meter2`], ['Meter', `${AN} .pb-meter2 .cmeter`],
    ['Meter fill, others', `${AN} .pb-meter2 .cmeter i:first-child`], ['Meter fill, this post', `${AN} .pb-meter2 .cmeter i:last-child`],
    ['Banner row', `${AN} .pb-banner`], ['Banner thumbnail', `${AN} .pb-th`], ['Banner input', `${AN} .pb-banner input`],
    ['Banner echo', `${AN} .pb-echo`],
    ['Date grid', `${AN} .dw-grid2`], ['Label row', `${AN} .pb-lrow`], ['Ends field', `${AN} .pb-endf`],
    ['Never-ends switch', `${AN} .pb-sw`], ['Switch track', `${AN} .pb-swt`],
    ['Repeat row', `${AN} .pb-rep`], ['Stepper', `${AN} .pb-step`], ['Stepper value', `${AN} .pb-step output`],
    ['Showing cards', `${AN} .pb-cards`], ['Showing card', `${AN} .pb-mini`],
    ['Side column', `${AN} .bed-side.pb-card`], ['Discord card', `${AN} .dcard`], ['Card heading', `${AN} .pb-h`],
    ['Card text', `${AN} .dcard p`], ['Card timestamp', `${AN} .pb-ts`], ['Card image', `${AN} .pb-img2`],
    ['Footer', `${AN} .dw-f`], ['Footer primary', `${AN} .dw-f .btn.go`],
];

// Board 1 ships this state deliberately — a dead banner link and a repeat count that cannot fit before the end date.
const G8BAD = [
    ['Banner thumbnail, broken', `${AN} .pb-view[data-view="1"] .pb-th.pb-bad`],
    ['Banner input, broken', `${AN} .pb-view[data-view="1"] input.pb-bad`],
    ['Banner echo, warning', `${AN} .pb-view[data-view="1"] .pb-echo.pb-warn`],
    ['Showing cards, tight', `${AN} .pb-view[data-view="1"] .pb-cards.pb-tight`],
    ['Card image, broken', `${AN} .pb-view[data-view="1"] .pb-img2.pb-bad`],
];

const TOKENS = ['--tap', '--rad-1', '--rad-2', '--rad-3', '--rad-box', '--rad-pill', '--t-micro', '--t-xs', '--t-sm', '--t-base', '--t-md', '--ui', '--data', '--display', '--ink', '--ink2', '--ink3', '--ink4', '--rule', '--rule2', '--rule3', '--raised', '--sunk', '--desk', '--paper', '--patch', '--staged', '--ok', '--warn', '--warn-ink', '--danger-ink', '--focus', '--s2', '--s3', '--s4', '--box-inset', '--dur-1', '--ease'];

(async () => {
    const { findChrome } = require(path.join(ROOT, 'scripts/lib/chromePath.cjs'));
    const b = await puppeteer.launch({ executablePath: findChrome(), headless: 'new', args: ['--allow-file-access-from-files', '--no-sandbox'] });
    const p = await b.newPage();
    await p.setViewport({ width: 1282, height: 888 });
    await p.goto('file://' + BOARD, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 900));
    const c = await p.target().createCDPSession();
    await c.send('DOM.enable'); await c.send('CSS.enable');

    const win = (rules, inline, prop) => {
        let best = null;
        const consider = (props, src) => props.forEach((d) => {
            if (d.name !== prop || d.disabled || d.parsedOk === false) return;
            const imp = !!d.important;
            if (!best || imp || !best.imp) best = { v: d.value, imp, src };
        });
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
            const box = await p.evaluate((s) => { const el = document.querySelector(s); if (!el) return '—';
                const r = el.getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}`; }, sel);
            out.push(`### ${label}\n\n\`${sel}\` · rendered ${box}\n`);
            const rows = [];
            PROPS.forEach((pr) => { const w = win(m.matchedCSSRules, m.inlineStyle, pr);
                if (w || ALWAYS.includes(pr)) rows.push(`| ${pr} | ${w ? '`' + cell(w.v) + '`' : '—'} | \`${cell(comp[pr] ?? '')}\` |`); });
            out.push('| property | winning declaration | computed |\n|---|---|---|\n' + rows.join('\n') + '\n');
            for (const ps of pseudos) {
                const pe = (m.pseudoElements || []).find((x) => x.pseudoType === ps);
                if (!pe) continue;
                const prow = []; PROPS.forEach((pr) => { const w = win(pe.matches, null, pr); if (w) prow.push(`| ${pr} | \`${cell(w.v)}\` |`); });
                out.push(`**::${ps}**\n\n| property | winning declaration |\n|---|---|\n` + prow.join('\n') + '\n');
            }
        }
    };

    out.push(`---\nkind: reference\nstatus: live\n---\n`);
    out.push(`# Pins-2 design board 1 — resolved values\n`);
    out.push(`*Generated by \`local/pins2/spec/board1-extract.cjs\` from \`index.html\` beside this file, at 1282×888. Each row gives the declaration that actually WON the cascade (CDP \`CSS.getMatchedStylesForNode\`, \`!important\` honoured) beside the computed value, so a builder ports the expression with its tokens intact rather than a flattened colour.*\n`);
    out.push(`> 🔴 **READ \`handoff-g9-g8.md\` FIRST.** These two drawers do NOT correspond structurally to the portal's — a datalist where the board has a combobox, a checkbox where it has a pressed toggle, a select where it has a segmented control, one container where it has per-slot rows, and a footer missing its third button. Values only carry across where the two sides already agree, so the structural pairing comes first and this is the second pass.\n`);

    const tok = await p.evaluate((names) => { const s = getComputedStyle(document.documentElement);
        return names.map((n) => [n, s.getPropertyValue(n).trim()]); }, TOKENS);
    out.push('## Tokens as resolved on board 1\n\n| token | value |\n|---|---|\n' + tok.map(([n, v]) => `| \`${n}\` | \`${v || '(unset)'}\` |`).join('\n') + '\n');

    await dump('G9 · New build drawer — resting state', G9);
    await dump('G9 · Bulk create view', G9BULK, 'Reached with the drawer\'s **Add build · Bulk create** segment.');
    await dump('G8 · Post an announcement — filled state', G8);
    await p.evaluate(() => { const bs = [...document.querySelectorAll('[data-seg=views] button')];
        const b1 = bs.find((x) => x.dataset.v === '1'); if (b1) b1.click(); });
    await new Promise((r) => setTimeout(r, 500));
    await dump('G8 · Bad link, short window', G8BAD, 'Board 1 ships this state deliberately: a dead banner and a repeat count that cannot fit before the end date.');

    fs.writeFileSync(OUT, out.join('\n'));
    console.log('wrote', path.relative(ROOT, OUT), '·', out.length, 'blocks');
    await b.close();
})().catch((e) => { console.error(String(e && e.stack ? e.stack : e).slice(0, 600)); process.exit(1); });
