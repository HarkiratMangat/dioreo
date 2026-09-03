// scripts/portalProbe.mjs — WHY a box differs, on both sides, in one call.
//
// 🔴 WHY THIS EXISTS. On 2026-08-30 the overlay pass repeatedly went: measure a percentage, guess a cause, fix, re-measure. Every time that loop was broken, it was broken by the same ad-hoc script — walk the ancestor chain, print each one's box and the computed property, and see which ancestor first declares it. It found the composer's 240px (a container, not a rule), the trapped scrim (`main{z-index:1}`), the 13.5px retention paragraph (`.masthead p` reaching into a nested drawer) and the 2px day row (a portal-only wrapper carrying a font-size). It was retyped six times as a heredoc and thrown away six times. portalDiff says HOW MUCH differs; portalAudit says WHAT; this says WHY, which is the question that was costing the turns.
//
// Usage: node scripts/portalProbe.mjs --realm season --sel ".nwhost" [--open "Event"] [--view Board]
//                                     [--props fontSize,width,zIndex] [--chain]
//   --sel     the element to interrogate, on both sides
//   --chain   walk to <html>, reporting which ancestor first DECLARES each property
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? true) : d; };
const realm = flag('--realm', 'season');
const sel = flag('--sel', null);
const view = flag('--view', null);
const openText = flag('--open', null);
const chain = args.includes('--chain');
// 🔴 THE FALSIFIER. Every other instrument here ships with a case proving it can report NO difference, and this one did not — it was proven once by hand against a known-live finding and never again. --selftest points both sides at the mockup: any property it reports as differing is the probe lying.
const selfTest = args.includes('--selftest');
const PROPS = String(flag('--props', 'width,height,fontSize,lineHeight,display,position,zIndex,margin,padding'))
    .split(',').map((s) => s.trim()).filter(Boolean);
if (!sel) { console.error('portal:probe needs --sel "<css selector>"'); process.exit(2); }

const PKG = 'docs/superpowers/mockups/2026-08-23-portal-interactive';

// 🔴 REVIEW REFUSES WITHOUT A SEED — see portalDiff for the full reasoning. Its staged-ops store is sessionStorage and every load here clears it, so an unseeded run measures an EMPTY mockup against a POPULATED portal and returns a confident wrong number. ⚠️ THIS TOOL WAS MISSED when the refusal shipped to diff/audit/converge on 2026-09-03; the reader test found it, and this one is quoted in the plan's §L row 6a, so the reading recorded there was taken unseeded. Re-take it. 2026-09-03 09:03 EDT
const MK_QUERY = process.argv.includes('--mk-query') ? String(process.argv[process.argv.indexOf('--mk-query') + 1] || '') : '';
const withQuery = (u) => (MK_QUERY ? u + (u.includes('?') ? '&' : '?') + MK_QUERY : u);
if (realm === 'review' && !/demo=1/.test(MK_QUERY) && !process.argv.includes('--no-seed')) {
    console.error('refusing: Review must be measured SEEDED or the two sides hold different data.\n'
        + '  add   --mk-query demo=1     to compare two populated boards\n'
        + '  or    --no-seed             to measure the empty state deliberately');
    process.exit(2);
}
const MOCKUP = withQuery(`http://localhost:8900/${PKG}/${realm === 'home' ? 'index' : realm}.html`);
const HARNESS = selfTest ? MOCKUP : `http://localhost:8901/harness.html?fresh=1&b=${Date.now()}#/${realm}`;
// Same instant as every other instrument here, for the same reason: an unfrozen clock moves the countdown between two captures taken seconds apart.
const FROZEN = Date.parse('2026-08-24T18:41:00Z');

const CLICK = (want) => {
    const n = (t) => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const c = [...document.querySelectorAll('button,a,[role="button"],[role="tab"]')]
        .filter((e) => n(e.textContent) === n(want) && e.offsetParent !== null)
        .sort((a, b) => a.textContent.length - b.textContent.length);
    if (!c.length) return false; c[0].click(); return true;
};

const READ = (selector, props, walkUp) => {
    const el = document.querySelector(selector);
    if (!el) return { missing: true };
    const box = (e) => { const r = e.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top) }; };
    const styleOf = (e) => { const c = getComputedStyle(e); const o = {}; for (const p of props) o[p] = c[p]; return o; };
    const name = (e) => e.tagName.toLowerCase()
        + (typeof e.className === 'string' && e.className.trim()
            ? '.' + e.className.trim().split(/\s+/).join('.') : '');
    const out = { self: { name: name(el), box: box(el), style: styleOf(el) }, chain: [] };
    if (walkUp) {
        let e = el.parentElement;
        while (e && e !== document.documentElement) {
            out.chain.push({ name: name(e), box: box(e), style: styleOf(e) });
            e = e.parentElement;
        }
        out.chain.push({ name: 'html', box: box(document.documentElement), style: styleOf(document.documentElement) });
    }
    return out;
};

(async () => {
    const { findChrome } = require('./lib/chromePath.cjs');
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
    const grab = async (url, side) => {
        const p = await browser.newPage();
        await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 1 });
        await p.evaluateOnNewDocument((t) => {
            const R = Date; const F = function (...a) { return a.length ? new R(...a) : new R(t); };
            F.prototype = R.prototype; F.now = () => t; F.parse = R.parse; F.UTC = R.UTC; window.Date = F;
        }, FROZEN);
        await p.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        await p.evaluate(() => document.fonts.ready);
        await p.evaluate(() => new Promise((r) => setTimeout(r, 2200)));
        for (const [txt, label] of [[view, '--view'], [openText, '--open']]) {
            if (!txt) continue;
            const hit = await p.evaluate(CLICK, txt);
            // Refuses like every other instrument here: a click that misses on one side produces a tidy report about the wrong element, which is the failure mode all of these guard.
            if (!hit) throw new Error(`portal:probe refuses: no control reading "${txt}" (${label}) on the ${side} side.`);
            await p.evaluate(() => new Promise((r) => setTimeout(r, 1400)));
        }
        const data = await p.evaluate(READ, sel, PROPS, chain);
        await p.close();
        return data;
    };
    try {
        const mk = await grab(MOCKUP, 'MOCKUP');
        const pt = await grab(HARNESS, 'PORTAL');
        const fmtBox = (b) => `w=${b.w} h=${b.h} x=${b.x} y=${b.y}`;
        console.log(`\nportal:probe — ${realm}${view ? ' · ' + view : ''}${openText ? ' · open "' + openText + '"' : ''}    ${sel}\n`);
        if (mk.missing || pt.missing) {
            console.log(`  ${mk.missing ? 'MISSING ON THE MOCKUP' : 'present on the mockup'} · ${pt.missing ? 'MISSING ON THE PORTAL' : 'present on the portal'}`);
            if (mk.missing && pt.missing) return;
        }
        if (!mk.missing && !pt.missing) {
            console.log(`  mk  ${mk.self.name}\n      ${fmtBox(mk.self.box)}`);
            console.log(`  pt  ${pt.self.name}\n      ${fmtBox(pt.self.box)}\n`);
            const diff = PROPS.filter((p) => mk.self.style[p] !== pt.self.style[p]);
            if (!diff.length) console.log(selfTest ? '  SELF-TEST: the mockup against itself — every property agrees.' : '  every requested property agrees on this element.');
            if (selfTest && diff.length) { console.error(`portal:probe SELF-TEST FAILED — ${diff.length} property/ies differ between a page and itself.`); process.exitCode = 1; }
            for (const p of diff) console.log(`  ✗ ${p}   ${mk.self.style[p]}  →  ${pt.self.style[p]}`);
            // 🔴 THE POINT OF --chain: an element whose own rules match can still differ, because a property it INHERITS is declared somewhere above it. Every hard finding today was of that shape, and the answer was always the first ancestor whose value changes.
            if (chain && diff.length) {
                for (const p of diff) {
                    const walk = (rows, own) => {
                        let last = own;
                        for (const r of rows) { if (r.style[p] !== last) return `${r.name} = ${r.style[p]}`; last = r.style[p]; }
                        return 'inherited unchanged to <html>';
                    };
                    console.log(`\n  ${p} — first ancestor that changes it`);
                    console.log(`    mk: ${walk(mk.chain, mk.self.style[p])}`);
                    console.log(`    pt: ${walk(pt.chain, pt.self.style[p])}`);
                }
            }
        }
        console.log('');
    } finally {
        await browser.close();
    }
})().catch((e) => { console.error(String(e && e.message ? e.message : e)); process.exit(1); });
