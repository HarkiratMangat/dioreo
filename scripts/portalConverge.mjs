// scripts/portalConverge.mjs — ONE call that answers "how far apart are these two pages, and where".
//
// The overlay method needs a tight loop: measure, fix a batch, measure again. Three separate tools meant three round trips per iteration, so this runs them together against the SAME pair of loads and prints, in order:
//   RHYTHM   the vertical stack of both pages, element by element, with every mismatch marked. A small offset
//            near the top cascades into one page-sized pixel region, so this is what has to reach zero FIRST.
//   WORDS    same element, different text.
//   STYLE    same element, different box or type.
// Usage: node scripts/portalConverge.mjs --realm broadcast [--view Airtime]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { record: recordRun } = require('./lib/portalReceipt.cjs');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? true) : d; };
const realm = flag('--realm', 'broadcast');
const view = flag('--view', null);
// 🔴 A QUERY THE MOCKUP SIDE CARRIES, because one realm cannot be compared without it. Review's staged-ops store is sessionStorage and every load here clears it, so its mockup renders EMPTY against a populated portal and every number is a comparison of two different datasets. `--mk-query demo=1` asks review.html to seed itself from its own fixtures — seeded on request, never automatically (COMPANION §15).
const MK_QUERY = process.argv.includes('--mk-query') ? String(process.argv[process.argv.indexOf('--mk-query') + 1] || '') : '';
const withQuery = (u) => (MK_QUERY ? u + (u.includes('?') ? '&' : '?') + MK_QUERY : u);
const MOCKUP = withQuery(`http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/${realm === 'home' ? 'index' : realm}.html`);
// 🔴 REVIEW REFUSES WITHOUT A SEED, AND THAT IS A REFUSAL RATHER THAN A NOTE ON PURPOSE. Review's staged-ops store is sessionStorage and every load here clears it, so an unseeded run compares an EMPTY mockup against a POPULATED portal and returns a confident, well-formed number for a comparison nobody meant to make — measured 2026-09-03 00:22 EDT at 4.7% in 15 regions against 0.5% in 12 seeded. A note in the plan would be one more thing to remember; this cannot be forgotten. `--no-seed` is the explicit opt-out for anyone who really does want the empty state.
if (realm === 'review' && !/demo=1/.test(MK_QUERY) && !process.argv.includes('--no-seed')) {
    console.error('refusing: Review must be measured SEEDED or the two sides hold different data.\n'
        + '  add   --mk-query demo=1     to compare two populated boards (what every recorded figure for this realm means)\n'
        + '  or    --no-seed             to measure the empty state deliberately');
    process.exit(2);
}

const HARNESS = `http://localhost:8901/harness.html?fresh=1&b=${Date.now()}#/${realm}`;
const FROZEN = Date.parse('2026-08-24T18:41:00Z');
const PROPS = ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color',
    'backgroundColor', 'borderRadius', 'paddingTop', 'paddingLeft', 'minHeight', 'textAlign', 'gap'];

const COLLECT = (props) => {
    const norm = (t) => String(t || '').replace(/\s+/g, ' ').trim();
    const ms = [...document.querySelectorAll('main')];
    const root = ms[ms.length - 1] || document.body;
    const out = [];
    const walk = (el, d) => {
        for (const e of el.children) {
            if (!e.getClientRects().length) continue;
            const r = e.getBoundingClientRect(), c = getComputedStyle(e);
            const cls = typeof e.className === 'string' ? e.className.trim() : '';
            const style = {}; for (const p of props) style[p] = c[p];
            out.push({ d, top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width),
                sig: e.tagName.toLowerCase() + (cls ? '.' + cls.split(/\s+/).sort().join('.').replace(/\d+/g, '#') : ''),
                text: norm(e.textContent).slice(0, 48), style });
            if (d < 3) walk(e, d + 1);
        }
    };
    walk(root, 0);
    return out;
};

(async () => {
    const { findChrome } = require('./lib/chromePath.cjs');
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
    const grab = async (url, side) => {
        const p = await browser.newPage();
        await p.setViewport({ width: 1282, height: 1800, deviceScaleFactor: 1 });
        await p.evaluateOnNewDocument((t) => {
            const R = Date; const F = function (...a) { return a.length ? new R(...a) : new R(t); };
            F.prototype = R.prototype; F.now = () => t; F.parse = R.parse; F.UTC = R.UTC; window.Date = F;
        }, FROZEN);
        await p.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        await p.evaluate(() => document.fonts.ready);
        await p.evaluate(() => new Promise((r) => setTimeout(r, 2200)));
        if (view) {
            const hit = await p.evaluate((want) => {
                const n = (t) => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
                const c = [...document.querySelectorAll('button,a,[role="tab"]')]
                    .filter((e) => n(e.textContent) === n(want) && e.offsetParent !== null)
                    .sort((a, b) => a.textContent.length - b.textContent.length);
                if (!c.length) return false; c[0].click(); return true;
            }, view);
            if (!hit) throw new Error(`portal:converge refuses: no control reading "${view}" on the ${side} side.`);
            await p.evaluate(() => new Promise((r) => setTimeout(r, 1200)));
        }
        const data = await p.evaluate(COLLECT, PROPS);
        await p.close();
        return data;
    };
    try {
        const mk = await grab(MOCKUP, 'MOCKUP'), pt = await grab(HARNESS, 'PORTAL');
        console.log(`\nportal:converge — ${realm}${view ? ' · ' + view : ''}   mk ${mk.length} nodes (${mk.at(-1)?.top + mk.at(-1)?.h}px) · pt ${pt.length} (${pt.at(-1)?.top + pt.at(-1)?.h}px)\n`);
        // Pair by signature in document order: the first unmatched pt node with the same signature.
        const used = new Set(); let bad = 0;
        console.log('RHYTHM — every mismatch, in document order. Fix the FIRST one; the rest usually follow.');
        for (const a of mk) {
            const j = pt.findIndex((b, i) => !used.has(i) && b.sig === a.sig);
            if (j < 0) { console.log(`  ✗ ABSENT   mk ${String(a.top).padStart(4)} h${String(a.h).padStart(4)}  ${a.sig}`); bad++; continue; }
            used.add(j); const b = pt[j];
            const dTop = b.top - a.top, dH = b.h - a.h, dW = b.w - a.w;
            if (Math.abs(dTop) <= 1 && Math.abs(dH) <= 1 && Math.abs(dW) <= 2) continue;
            bad++;
            console.log(`  ✗ ${String(a.sig).padEnd(30)} top ${String(a.top).padStart(4)}→${String(b.top).padStart(4)} (${dTop >= 0 ? '+' : ''}${dTop})  h ${String(a.h).padStart(4)}→${String(b.h).padStart(4)} (${dH >= 0 ? '+' : ''}${dH})  w ${dW >= 0 ? '+' : ''}${dW}`);
        }
        const extra = pt.filter((_, i) => !used.has(i));
        for (const b of extra) console.log(`  ✗ EXTRA    pt ${String(b.top).padStart(4)} h${String(b.h).padStart(4)}  ${b.sig}`);
        console.log(`\n  ${bad + extra.length} mismatch(es) of ${mk.length} design nodes.\n`);

        const bare = (t) => t.replace(/\s+/g, '').toLowerCase();
        const used2 = new Set(); const words = [], styles = [];
        for (const a of mk) {
            const j = pt.findIndex((b, i) => !used2.has(i) && b.sig === a.sig);
            if (j < 0) continue; used2.add(j); const b = pt[j];
            if (a.text && b.text && bare(a.text) !== bare(b.text)) words.push(`  ${a.sig}\n      mk “${a.text}”\n      pt “${b.text}”`);
            const d = PROPS.filter((p) => a.style[p] !== b.style[p]).map((p) => `${p}: ${a.style[p]} → ${b.style[p]}`);
            if (d.length) styles.push(`  ${a.sig}\n      ` + d.join('\n      '));
        }
        console.log(`WORDS (${words.length})`); words.slice(0, 40).forEach((x) => console.log(x));
        console.log(`\nSTYLE (${styles.length})`); styles.slice(0, 40).forEach((x) => console.log(x));
        // The run reached its end and printed a report — record that, so portalStatus can tell an UNRUN instrument from one that ran clean. A receipt is not a result; see lib/portalReceipt.cjs.
        recordRun('converge', realm);
    } finally { await browser.close(); }
})();
