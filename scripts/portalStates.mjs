// scripts/portalStates.mjs — THE STATES HARNESS: walk every state a surface can be in, and check the three things only a rendered page can answer.
//
// 🔴 IT IS THE DRIVER FOR A CATALOGUE THAT GROWS, NOT A FIXED LIST. `.states.html` in the mockup package enumerated the states the mockup happened to have, which means it inherited the mockup's blind spots — 4b EXPANDED exists precisely because "the sweep had only ever rendered the default state". So Part 0 builds the driver and the discipline; every realm REGISTERS the states it discovers while walking, in `portal/fixtures/states/<realm>.json`; Part 7 re-runs everything through the finished catalogue. That makes "did I walk every state?" a question you answer by diffing the registry against the walk, instead of a sentence in a summary that nobody can check.
//
// 🔴 THE PASSES ARE RELATIONAL BY DESIGN — see scripts/lib/portalStatePasses.cjs. PASS 1 composite (a control drawing a second box inside its wrapper), PASS 3 space (content clipped to nothing, a page that scrolls sideways), PASS 4 keyboard (a visible control no Tab reaches, and a "modal" Tab walks out of). There is no PASS 2, and a session WILL go looking for it: the mockup's numbering ran 1, 3, 4, 5.
//
// ⚠️ PASS 5 (reduced motion) IS NOT IMPLEMENTED HERE and is not silently missing: emulating the media query is easy, but every honest assertion about it is about what CSS DECLARES, which a rendered walk is the wrong instrument for. It is Part 7's, with the rest of motion-as-a-system.
//
//   node scripts/portalStates.mjs                    walk every registered state
//   node scripts/portalStates.mjs --realm shell      one registry
//   node scripts/portalStates.mjs --ci               fail on a finding no registry entry knows about
//   node scripts/portalStates.mjs --record           write today's findings into each state's `known` list
import fs from 'fs';
import http from 'http';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { runPasses, diffAgainstKnown, keyOf } = require('./lib/portalStatePasses.cjs');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'portal', 'public');
const REGISTRY = path.join(ROOT, 'portal', 'fixtures', 'states');
const VIEWPORT = { w: 1282, h: 888 };

function serve() {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
    const server = http.createServer((req, res) => {
        const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'harness.html';
        const file = path.join(PUBLIC, rel);
        if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store, must-revalidate' });
        res.end(fs.readFileSync(file));
    });
    return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}

// Everything the page can see, reduced to the records the passes need. It returns CANDIDATES, not the whole DOM — a thousand element records would make every run a wall of JSON nobody reads.
const COLLECT = function () {
    const idOf = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
    const paints = (cs) => parseFloat(cs.borderTopWidth) > 0 || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent');
    const visible = (el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0; };

    const controls = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea')]
        .filter(visible)
        .map((el) => {
            const cs = getComputedStyle(el), p = el.parentElement, ps = p && getComputedStyle(p);
            const r = el.getBoundingClientRect(), pr = p && p.getBoundingClientRect();
            return {
                id: idOf(el), h: Math.round(r.height), parentH: pr ? Math.round(pr.height) : 0,
                border: Math.round(parseFloat(cs.borderTopWidth) || 0), bg: cs.backgroundColor,
                selfPaintsBg: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent',
                parentPaints: !!(ps && paints(ps)),
            };
        });

    // ⚠️ HIDDEN IS NOT CLIPPED, and conflating them made the first run report nineteen defects that were all the account menu's own collapsed items. A closed panel's contents measure 0x0 for the ordinary reason that they are not being shown. `checkVisibility()` answers the question the pass is actually asking — is this element being rendered — including a `display:none` or `[hidden]` ANCESTOR, which an element-local `display` read cannot see.
    const rendered = (el) => (el.checkVisibility ? el.checkVisibility({ checkVisibilityCSS: true }) : el.getClientRects().length > 0);
    const clipped = [...document.querySelectorAll('main *, header *, .rail *')]
        .filter((el) => el.children.length === 0 && (el.textContent || '').trim().length > 3 && rendered(el))
        .map((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { el, r, cs }; })
        .filter(({ r }) => r.height <= 1 || r.width <= 1)
        .map(({ el, r, cs }) => ({
            id: idOf(el), w: Math.round(r.width), h: Math.round(r.height), textLen: el.textContent.trim().length,
            // the visually-hidden pattern is this shape ON PURPOSE — 1px, clipped, off in the margin
            srOnly: /(^|\s)sr(\s|$)/.test(el.className || '') || cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)' || parseFloat(cs.marginTop) <= -1,
        }));

    const overflow = [...document.querySelectorAll('body, main, header, .rail, .panel, .app')]
        .filter((el) => el.scrollWidth - el.clientWidth > 1 && getComputedStyle(el).overflowX === 'visible')
        .map((el) => ({ id: idOf(el), scrollW: el.scrollWidth, clientW: el.clientWidth, overflowX: getComputedStyle(el).overflowX }));

    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]';
    const focusables = [...document.querySelectorAll(FOCUSABLE)].filter(visible);
    const unreachable = focusables
        .filter((el) => el.getAttribute('tabindex') === '-1' && el.tagName !== 'DIV' && !el.closest('[hidden]'))
        .map((el) => ({ id: idOf(el), tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), why: 'tabindex="-1"' }));

    const dialog = document.querySelector('[role=dialog]:not([hidden]), .drawer.open, .overlay.open, .modal.open');
    const modal = dialog
        ? {
            open: true, kind: dialog.className || 'dialog',
            escapees: focusables
                .filter((el) => !dialog.contains(el) && !el.closest('[inert]') && el.getAttribute('tabindex') !== '-1')
                .slice(0, 12)
                .map((el) => ({ id: idOf(el) })),
        }
        : { open: false, escapees: [] };

    return { controls, clipped, overflow, unreachable, modal, counts: { controls: controls.length, focusables: focusables.length, elements: document.querySelectorAll('main *').length } };
};

async function walk(page, state, port) {
    const q = new URLSearchParams(state.flags || {});
    q.set('b', String(Date.now()));
    await page.goto(`http://127.0.0.1:${port}/harness.html?${q}#/${state.realm || 'home'}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);                                     // never rAF: it does not fire off-screen, and a pass gated on it reports pending forever
    await page.waitForSelector('main', { timeout: 15000 });
    for (const step of state.steps || []) {
        if (step.key) await page.evaluate((k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k.key, metaKey: !!k.meta, bubbles: true })), step);
        if (step.click) await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.click(); }, step.click);
        // ⚠️ A MENU ITEM IS IDENTIFIED BY ITS WORDS, NOT ITS POSITION. `.who [role=menuitem]` matched the FIRST item — "What you can do", which navigates away — so the state named "toast after an account action" walked to a different realm and reported clean. A registry that addresses controls positionally breaks every time a menu gains an entry, silently.
        if (step.clickText) await page.evaluate((s) => { const el = [...document.querySelectorAll(s.sel)].find((x) => (x.textContent || '').includes(s.text)); if (el) el.click(); }, step.clickText);
        // ⚠️ A TOOLTIP IS CONTENT AND IS INVISIBLE TO A SCREENSHOT, so the runtime that renders it has to be walked like any other state. tips.js delegates from the document, so a synthetic pointerover on the host is what a real pointer would produce.
        if (step.hover) await page.evaluate((sel) => { const el = document.querySelector(sel); if (el) { el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); } }, step.hover);
        if (step.type) await page.evaluate((s) => { const el = document.querySelector(s.sel); if (el) { el.value = s.text; el.dispatchEvent(new Event('input', { bubbles: true })); } }, step);
        await page.evaluate(() => new Promise((r) => setTimeout(r, 160)));
    }
    // A state can declare its own settle time. The slow state is the reason: it exists to be measured WHILE the request is still out, so waiting for the data would destroy the very thing being walked.
    if (state.settleMs) await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), state.settleMs);
    // 🔴 `expect` IS WHAT MAKES A REGISTERED STATE A STATE RATHER THAN A CLAIM. The export-strip entry clicked `.mh-take` — which is the role="group" WRAPPER, not the toggle inside it — so the walk opened nothing, examined the default view, and reported a clean pass under the name of a state it had never reached. Five states were vacuous the same way for one run. A state that names the element its own steps are supposed to produce cannot lie about having got there.
    const expected = state.expect ? await page.evaluate((sel) => !!document.querySelector(sel), state.expect) : true;
    if (!expected) throw new Error(`state "${state.name}" did not reach its own subject — nothing matches ${state.expect} after its steps ran, so a clean result would be a clean result for the DEFAULT view`);

    // 🔴 A PROBE MUST BE ABLE TO REPORT PRESENCE BEFORE AN ABSENCE MEANS ANYTHING. A run that walked to a page the SPA had not routed yet returned all-zeroes and read as a clean sweep, so a state that finds nothing to examine is an ERROR here, not a pass.
    const records = await page.evaluate(COLLECT);
    // ⚠️ THE PRESENCE PROOF IS ELEMENTS, NOT FOCUSABLES. A skeleton is a legitimate state with nothing to focus — asserting on focusables made the deliberately-slow state fail as if it were broken, which would have pushed the next session to delete the state rather than the assertion.
    if (!records.counts.elements) throw new Error(`state "${state.name}" examined 0 elements inside <main> — the page had not rendered, so a clean result would be meaningless`);
    return records;
}

async function run() {
    const args = process.argv.slice(2);
    const flag = (n) => args.includes(n);
    const only = args.includes('--realm') ? args[args.indexOf('--realm') + 1] : null;

    fs.mkdirSync(REGISTRY, { recursive: true });
    const files = fs.readdirSync(REGISTRY).filter((f) => f.endsWith('.json')).filter((f) => !only || f === `${only}.json`);
    if (!files.length) { console.log(`portal:states — no registries in portal/fixtures/states${only ? ` matching "${only}"` : ''}. Each realm registers its own states as it walks them.`); return; }

    const { findChrome, CHROME_CANDIDATES } = require('./lib/chromePath.cjs');
    const chrome = findChrome();
    if (!chrome) {
        console.error('  ⚠ SKIPPED — no Chrome found. Tried:\n      ' + CHROME_CANDIDATES.join('\n      '));
        console.error('    Set PUPPETEER_EXECUTABLE_PATH to run this check. NOT a pass.');
        process.exit(0);
    }

    require('./buildPortal.js').build();
    const { server, port } = await serve();
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox'] });
    let bad = false, walked = 0;
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: VIEWPORT.w, height: VIEWPORT.h });
        for (const f of files) {
            const file = path.join(REGISTRY, f);
            const registry = JSON.parse(fs.readFileSync(file, 'utf8'));
            console.log(`\n${registry.surface} — ${registry.states.length} state(s)`);
            for (const state of registry.states) {
                const records = await walk(page, state, port);
                const findings = runPasses(records);
                const { fresh, fixed } = diffAgainstKnown(findings, state.known || []);
                walked++;
                const tally = `${records.counts.controls} control(s), ${records.counts.focusables} focusable`;
                if (!findings.length) console.log(`  ✓ ${state.name.padEnd(34)} ${tally}`);
                else console.log(`  · ${state.name.padEnd(34)} ${tally} — ${findings.length} finding(s), ${fresh.length} new`);
                for (const x of fresh) console.log(`      ❌ PASS ${x.pass}  ${x.id}\n           ${x.detail}`);
                for (const k of fixed) console.log(`      ✅ fixed since the last recording: ${k}`);
                if (flag('--record')) state.known = findings.map(keyOf);
                if (flag('--ci') && (fresh.length || fixed.length)) bad = true;
            }
            if (flag('--record')) { fs.writeFileSync(file, JSON.stringify(registry, null, 2) + '\n'); console.log(`  ✅ recorded → portal/fixtures/states/${f}`); }
        }
    } finally {
        await browser.close();
        server.close();
    }
    console.log(`\n${walked} state(s) walked at ${VIEWPORT.w}x${VIEWPORT.h}.`);
    if (bad) { console.log('❌ a finding is new, or a recorded one is fixed and still listed. Fix it, or re-record with --record in the same commit.'); process.exit(1); }
}

run().catch((e) => { console.error('portal:states failed —', e.message); process.exit(1); });
