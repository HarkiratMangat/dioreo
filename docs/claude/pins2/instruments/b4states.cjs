// Board 4 — the interaction-state instrument. Written 2026-09-21 19:16 EDT, after four rounds in which every "fixed" claim was
// made on a RESTING DOM and he found the missing hover, the grey wash or the odd shape himself. What it measures, per section:
//   STATES  every interactive element forced into :hover, :active and :focus-visible through CDP CSS.forcePseudoState, diffed
//           against rest. NONE = hover changes nothing · GREY = the hover paints a neutral grey on a control that has a hue.
//   SHAPES  siblings inside one control group whose border-radius or height differ (his "notice how their shapes are not
//           consistent?").
//   FONTS   the family · size · weight triples each section's text uses, so board-1/2 surfaces can be put on board 3's roles.
//   CENTRE  each row's cells: the ink centre of the cell's first text against the row's centre, flagged past 1px.
//   CONTAIN a drawer inside its stage, and any element whose text overflows its own box.
// Cloudinary is BLOCKED, so it sees the board the artifact shows him, not the one the dev server shows me.
// Run with the kit on :8900:  node docs/claude/pins2/instruments/b4states.cjs [section,section] [--out=file.md]
const path = require('path'), fs = require('fs'), os = require('os');
const puppeteer = require(path.resolve(__dirname, '../../../../node_modules/puppeteer-core'));
const args = process.argv.slice(2);
const pick = (args.find((a) => !a.startsWith('--')) || '').split(',').filter(Boolean);
const OUT = (args.find((a) => a.startsWith('--out=')) || '').slice(6);
const URL = 'http://127.0.0.1:8900/local/pins2-board-3/redo/board4.html';
const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-left-color', 'box-shadow', 'outline-style', 'opacity', 'transform', 'text-decoration-line'];

(async () => {
    const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'b4s-')) });
    const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1000 });
    await p.setRequestInterception(true);
    p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
    await p.goto(URL, { waitUntil: 'networkidle0' });
    await p.waitForSelector('#c-admin .incchip'); await new Promise((r) => setTimeout(r, 1500));
    // (2026-09-21 22:43 EDT) Settle every transition, or a forced :hover reads the transition's FIRST frame and reports NONE on a control that does answer (it did: the add-another chip).
    await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    const cdp = await p.target().createCDPSession();
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const sections = await p.evaluate(() => [...document.querySelectorAll('.b4g')].map((g) => g.id));
    const lines = [];
    const say = (s) => { lines.push(s); };
    for (const sec of sections.filter((s) => !pick.length || pick.some((k) => s.includes(k)))) {
        // Tag every visible interactive element once per signature.
        const els = await p.evaluate((sec) => {
            const g = document.getElementById(sec); const seen = new Set(); const out = [];
            const sel = 'button, [role=button], [role=tab], [role=radio], a[href], label.chip, .chip, .b3-fc, summary, .b3-sc';
            // (sr-only text is skipped by CENTRE; a pressed thumb drawn by a sibling .pb-thumb is read from the button's own fill)
            [...g.querySelectorAll(sel)].forEach((e, i) => {
                if (!e.offsetParent || e.closest('.pb-head, .pb-new')) return;
                const sig = e.tagName + '.' + [...e.classList].sort().join('.') + '|' + (e.getAttribute('aria-pressed') || '') + '|' + e.textContent.trim().replace(/\d+/g, '#').slice(0, 18);
                if (seen.has(sig)) return; seen.add(sig);
                e.setAttribute('data-b4q', sec + '-' + i); out.push({ q: sec + '-' + i, name: (e.tagName.toLowerCase() + '.' + [...e.classList].join('.')).slice(0, 60) + ' «' + e.textContent.trim().slice(0, 22) + '»' + (['aria-pressed', 'aria-selected', 'aria-checked'].some((k) => e.getAttribute(k) === 'true') || e.classList.contains('on') ? ' [pressed]' : '') });
            });
            return out;
        }, sec);
        const doc = await cdp.send('DOM.getDocument', { depth: -1 });
        // A hover can live on the element, on its ::before/::after (the manifest's icon buttons) or on its icon, so all four are read.
        const read = (q) => p.evaluate((q, PROPS) => { const e = document.querySelector(`[data-b4q="${q}"]`); if (!e) return null; const o = {};
            const take = (cs, pre) => PROPS.forEach((k) => { o[pre + k] = cs.getPropertyValue(k).slice(0, 90); });
            take(getComputedStyle(e), ''); take(getComputedStyle(e, '::before'), 'b:'); take(getComputedStyle(e, '::after'), 'a:');
            // A segmented control draws its pressed fill on a sibling thumb, so that is the pressed button's real ground.
            const th = e.parentElement && e.parentElement.querySelector(':scope > .pb-thumb, :scope > .thumb'); if (th && ['aria-pressed', 'aria-selected'].some((k) => e.getAttribute(k) === 'true')) o['background-color'] = getComputedStyle(th).backgroundColor;
            const ic = e.querySelector('svg'); if (ic) { const c = getComputedStyle(ic); o['ic:color'] = c.color; o['ic:stroke'] = c.stroke; o['ic:opacity'] = c.opacity; }
            // (2026-09-22 08:51 EDT) a hover can paint a CHILD (.wg-code → .wg-igb); read the first three children's fills too, or 'no grey' is vacuous.
            [...e.children].slice(0, 3).forEach((ch, i) => { o['c' + i + ':bg'] = getComputedStyle(ch).backgroundColor; });
            return o; }, q, PROPS);
        const grey = (c) => { const m = String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); if (!m) return false; const [r, g, bb, a] = [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]]; const mx = Math.max(r, g, bb) / 255, mn = Math.min(r, g, bb) / 255, l = (mx + mn) / 2; const sat = mx === mn ? 0 : (mx - mn) / (l > 0.5 ? 2 - mx - mn : mx + mn);
            // A blue-grey like the portal's --hi (35,44,52) is still a grey to the eye: saturation under .3 at low lightness.
            return a > 0.05 && sat < 0.3 && l < 0.45; };
        const none = [], greys = [], nofocus = [], noactive = [], hitbad = [];
        for (const e of els) {
            const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: `[data-b4q="${e.q}"]` });
            if (!nodeId) continue;
            const rest = await read(e.q);
            await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
            const hov = await read(e.q);
            await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
            // Pass 2 (2026-09-21 22:40 EDT): keyboard focus and press are states he clicks too.
            for (const [ps, bag] of [['focus-visible', nofocus], ['active', noactive]]) { await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [ps] }); const st = await read(e.q); await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }); if (!Object.keys(rest).some((k) => rest[k] !== st[k])) bag.push(e.name); }
            const diff = Object.keys(rest).filter((k) => rest[k] !== hov[k]);
            if (!diff.length) none.push(e.name);
            else { const gk = diff.find((k) => (k === 'background-color' || /^c\d:bg$/.test(k)) && grey(hov[k]) && !grey(rest[k])); if (gk) greys.push('hover ' + e.name + (gk === 'background-color' ? '' : ' (child ' + gk + ')') + ' → ' + hov[gk]); }
            // (2026-09-22 08:51 EDT) forcePseudoState paints a DEAD control's hover perfectly; only a hit-test at its centre sees what is on top.
            const blocker = await p.evaluate((q) => { const x = document.querySelector(`[data-b4q="${q}"]`); if (!x) return null; x.scrollIntoView({ block: 'center' }); const R = x.getBoundingClientRect(); if (!R.width || !R.height) return null; const h = document.elementFromPoint(R.left + R.width / 2, R.top + R.height / 2); return h && !(x === h || x.contains(h)) ? ((h.className && h.className.toString()) || h.tagName).slice(0, 40) : null; }, e.q);
            if (blocker) hitbad.push(e.name + ' ← ' + blocker);
            // A PRESSED control resting on a neutral grey fill is the other half of his "grey washed" (C2, C9).
            if (/\[pressed\]/.test(e.name) && grey(rest['background-color'])) greys.push('pressed ' + e.name + ' rests on ' + rest['background-color']);
        }
        const shapes = await p.evaluate((sec) => {
            const g = document.getElementById(sec); const bad = [];
            const groups = new Set([...g.querySelectorAll('button, .chip')].filter((e) => e.offsetParent && !e.closest('.pb-head, .pb-new')).map((e) => e.parentElement));
            groups.forEach((par) => {
                const kids = [...par.children].filter((k) => k.matches('button, .chip') && k.offsetParent);
                if (kids.length < 2) return;
                const f = (k) => getComputedStyle(k).borderRadius + ' h' + Math.round(k.getBoundingClientRect().height);
                const set = [...new Set(kids.map(f))];
                if (set.length > 1) bad.push((par.className.toString() || par.tagName).slice(0, 40) + ': ' + set.join(' | '));
            });
            return bad;
        }, sec);
        const fonts = await p.evaluate((sec) => {
            const g = document.getElementById(sec); const m = new Map();
            [...g.querySelectorAll('*')].filter((e) => e.offsetParent && !e.closest('.pb-head, .pb-new') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).forEach((e) => {
                const cs = getComputedStyle(e); const k = cs.fontFamily.split(',')[0].replace(/"/g, '') + ' ' + cs.fontSize + ' ' + cs.fontWeight; m.set(k, (m.get(k) || 0) + 1); });
            return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n}`);
        }, sec);
        // CENTRE — cap-height centre of every text run against the row's centre (2026-09-21 19:24 EDT). No probe element: an inserted
        // inline-block is blockified inside a flex tab and reports offsets that are not on screen (it did, −4.4px on C7's tabs).
        const centre = await p.evaluate((sec) => {
            const g = document.getElementById(sec); const bad = []; const cv = document.createElement('canvas').getContext('2d');
            const met = (cs) => { cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const m = cv.measureText('H'); return { cap: m.actualBoundingBoxAscent, desc: m.fontBoundingBoxDescent }; };
            [...g.querySelectorAll('tbody tr, .b3-hi-r, .b3-sd-r, .b3-sd-tr')].slice(0, 12).forEach((row) => {
                const R = row.getBoundingClientRect(); if (!R.height) return; const mid = R.top + R.height / 2;
                const w = document.createTreeWalker(row, NodeFilter.SHOW_TEXT); let n;
                while ((n = w.nextNode())) {
                    if (!n.textContent.trim() || n.parentElement.closest('.sr')) continue;
                    const r = document.createRange(); r.selectNodeContents(n); const rs = r.getClientRects(); if (rs.length !== 1) continue;
                    const m = met(getComputedStyle(n.parentElement)); const d = (rs[0].bottom - m.desc - m.cap / 2) - mid;
                    if (Math.abs(d) > 1.2) bad.push(`${row.className.toString().slice(0, 12) || 'tr'} «${n.textContent.trim().slice(0, 14)}» ${d > 0 ? '+' : ''}${d.toFixed(1)}px`);
                }
            });
            return bad;
        }, sec);
        const contain = await p.evaluate((sec) => {
            const g = document.getElementById(sec); const bad = [];
            const st = g.querySelector('.g-stage'); const d = g.querySelector('.drawer');
            if (st && d) { const a = st.getBoundingClientRect(), c = d.getBoundingClientRect(); if (c.top < a.top - 1 || c.bottom > a.bottom + 1) bad.push(`drawer ${Math.round(c.top - a.top)}..${Math.round(c.bottom - a.top)} in stage ${Math.round(a.height)}`); }
            [...g.querySelectorAll('*')].forEach((e) => { const cs = getComputedStyle(e); if (e.offsetParent && e.children.length === 0 && e.scrollWidth > e.clientWidth + 1 && cs.overflowX === 'visible' && cs.display !== 'inline' && !e.closest('.sr')) bad.push(`overflow «${e.textContent.trim().slice(0, 24)}» ${e.scrollWidth}>${e.clientWidth}`); });
            return bad.slice(0, 12);
        }, sec);
        say(`\n## ${sec} — ${els.length} controls · NONE ${none.length} · GREY ${greys.length} · SHAPES ${shapes.length} · CENTRE ${centre.length} · CONTAIN ${contain.length} · NOFOCUS ${nofocus.length} · NOACTIVE ${noactive.length} · BLOCKED ${hitbad.length}`);
        none.forEach((x) => say(`- NONE  ${x}`)); greys.forEach((x) => say(`- GREY  ${x}`)); shapes.forEach((x) => say(`- SHAPE ${x}`));
        centre.slice(0, 10).forEach((x) => say(`- CENTRE ${x}`)); hitbad.forEach((x) => say(`- BLOCKED ${x}`)); nofocus.slice(0, 14).forEach((x) => say(`- NOFOCUS ${x}`)); noactive.slice(0, 8).forEach((x) => say(`- NOACTIVE ${x}`)); contain.forEach((x) => say(`- CONTAIN ${x}`));
        say(`- FONTS ${fonts.slice(0, 8).join(' · ')}`);
    }
    await b.close();
    const text = lines.join('\n');
    if (OUT) fs.writeFileSync(OUT, text);
    console.log(text.split('\n').filter((l) => l.startsWith('## ')).join('\n'));
})();
