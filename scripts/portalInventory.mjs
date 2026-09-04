// scripts/portalInventory.mjs — walk BOTH pages and compare what they are made of.
//
// 🔴 WHY THIS EXISTS, AND WHY portal:diff IS NOT ENOUGH. The pixel diff answers "where do these two pages disagree" and ranks by area, which is the right first question and a poor second one: a 6px control-height difference repeated on forty controls never rises above the noise floor, and a column whose LABEL says something else entirely occupies almost no pixels. This walks the two DOMs, keys every element by its class signature, and reports three kinds of disagreement the pixel diff structurally cannot rank:
//
//   ONLY     a class signature that exists on one side and not the other
//   COUNT    a signature on both sides in different numbers
//   STYLE    a signature on both sides whose first instance differs in a property that carries design
//   TEXT     a labelled element whose words differ — "Live now / Upcoming / Staged / Ended" against
//            "Draft / Staged / Blocked / Ready" is four words and about nine hundred pixels
//
// ⚠️ A DIFFERENCE IS NOT A DEFECT. Several of these are portal-ahead and cited; the point is that the list is COMPLETE and ranked by kind, so an audit is bounded by what is actually there rather than by what somebody happened to notice. Adjudicate every row against COMPANION.md before any of it becomes an edit.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { record: recordRun } = require('./lib/portalReceipt.cjs');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? true) : d; };
const realm = flag('--realm', 'season');
const view = flag('--view', null);
const asJson = args.includes('--json');

// 🔴 REVIEW REFUSES WITHOUT A SEED — see portalDiff for the full reasoning. Its staged-ops store is sessionStorage and every load here clears it, so an unseeded run measures an EMPTY mockup against a POPULATED portal and returns a confident wrong number. ⚠️ THIS TOOL WAS MISSED when the refusal shipped to diff/audit/converge on 2026-09-03; the reader test found it, and this one is quoted in the plan's §L row 6a, so the reading recorded there was taken unseeded. Re-take it. 2026-09-03 09:03 EDT
const MK_QUERY = process.argv.includes('--mk-query') ? String(process.argv[process.argv.indexOf('--mk-query') + 1] || '') : '';
const withQuery = (u) => (MK_QUERY ? u + (u.includes('?') ? '&' : '?') + MK_QUERY : u);
// 🔴 TWO REALMS NOW, NOT ONE. Home carries the same staged surfaces Review does — the header's commit crumb, the masthead's staged figure and the whole `.hres` resume strip — and it was measured UNSEEDED through Part 6b's first nine runs, which reported the crumb, the figure and the strip as ONLY IN PORTAL and the two pages 78px apart. Seeded they are the same height. Until 2026-09-03 21:29 EDT the seed lived inside review.html and no other page could be asked; it is in the mockup's shared shell.js now, so this guard can cover any page that shows staged work rather than the one page that happened to own the code.
const SEED_REALMS = ['review', 'home'];
if (SEED_REALMS.includes(realm) && !/demo=1/.test(MK_QUERY) && !process.argv.includes('--no-seed')) {
    console.error(`refusing: ${realm === 'home' ? 'Home' : 'Review'} must be measured SEEDED or the two sides hold different data.\n`
        + '  add   --mk-query demo=1     to compare two populated boards\n'
        + '  or    --no-seed             to measure the empty state deliberately');
    process.exit(2);
}
const MOCKUP = 'http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive';
// 🔴 THE THIRD INSTRUMENT WAS READING A DIFFERENT PAGE FROM THE OTHER TWO. portalDiff and portalConverge both load the harness with ?conform=1, which stands pending redesigns down so the comparison is against the design; this loaded it WITHOUT, so every stood-down surface came back as a divergence and every fix already made still showed as unfixed. Two instruments agreeing and a third disagreeing is worse than one instrument, because the disagreement looks like a finding. The cache-buster is here for the same reason it is there: the module map survives a reload. ⚠️ STALE COMMENT, corrected 2026-09-01: `?conform=1` no longer exists — the two rendering modes collapsed 2026-08-31 and the flag was renamed `?fresh=1`, which does FIXTURES ONLY. There is no stand-down switch; do not add one back.
const HARNESS = `http://localhost:8901/harness.html?fresh=1&b=${Date.now()}`;
const VW = 1282, VH = 888;

// The properties a design decision actually lands in. Colour is included because a token drifting is invisible to every source scanner; transitions and shadows are not, because they differ legitimately per state.
const PROPS = ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color',
    'backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderRadius', 'paddingTop', 'paddingLeft',
    'minHeight', 'opacity', 'textAlign', 'justifyContent', 'alignItems', 'flexDirection', 'gap'];

const COLLECT = (props) => {
    const norm = (t) => String(t || '').replace(/\s+/g, ' ').trim();
    const sig = (e) => {
        const cls = String(e.className || '').trim();
        if (!cls || typeof e.className !== 'string') return null;
        // Dynamic per-row classes would make every row its own signature, so a numeric tail is folded away.
        return e.tagName.toLowerCase() + '.' + cls.split(/\s+/).filter(Boolean).sort().join('.').replace(/\d+/g, '#');
    };
    const out = {};
    for (const e of document.querySelectorAll('*')) {
        const k = sig(e);
        if (!k) continue;
        // 🔴 VISIBLE ONLY, AND THIS IS THE DIFFERENCE BETWEEN AN AUDIT AND A WALL OF NOISE. The mockup is ONE page carrying every view's markup at once, hidden with display:none; the portal is an SPA that renders the active view and nothing else. Comparing raw DOMs therefore reports the Track's ruler, lanes, deadrail, scrubber and zoomer as "missing from the portal" while looking at the Board — 93 rows on the first run, most of them another view's furniture. getClientRects() is empty for anything display:none or detached, which is exactly the question being asked: what is ON THIS SCREEN.
        if (!e.getClientRects().length) continue;
        if (!out[k]) {
            const c = getComputedStyle(e), r = e.getBoundingClientRect();
            const style = {};
            for (const p of props) style[p] = c[p];
            out[k] = { n: 0, w: Math.round(r.width), h: Math.round(r.height), style,
                text: norm(e.textContent).slice(0, 60) };
        }
        out[k].n += 1;
    }
    return out;
};

const nameOf = (k) => k;

(async () => {
    const { findChrome, CHROME_CANDIDATES } = require('./lib/chromePath.cjs');
    const chrome = findChrome();
    if (!chrome) { console.error('No Chrome found. Tried:\n  ' + CHROME_CANDIDATES.join('\n  ')); process.exit(2); }
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox'] });
    const grab = async (url, side) => {
        const page = await browser.newPage();
    // 🔴 THE CLOCK IS FROZEN, for the reason portalGeometry's was on 2026-08-31: an instrument that
    //    measures a page which moves while it is being measured reports drift as a finding. The season
    //    countdown reads Date.now() now (the design's start-of-day source was refused as class (b)), so a
    //    live clock changes the WIDTH of its readout between two runs. Same instant portalDiff pins.
    await page.evaluateOnNewDocument((t) => {
        const RealDate = Date;
        const Frozen = function (...a) { return a.length ? new RealDate(...a) : new RealDate(t); };
        Frozen.prototype = RealDate.prototype;
        Frozen.now = () => t; Frozen.parse = RealDate.parse; Frozen.UTC = RealDate.UTC;
        window.Date = Frozen;
        try { performance.now = () => 0; } catch { /* read-only in some builds */ }
    }, Date.parse('2026-08-24T18:41:00Z'));
        await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => new Promise((r) => setTimeout(r, 2400)));
        if (view) {
            const hit = await page.evaluate((want) => {
                const norm = (t) => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
                const c = [...document.querySelectorAll('button,a,[role="tab"]')]
                    .filter((e) => norm(e.textContent) === norm(want) && e.offsetParent !== null)
                    .sort((a, b) => a.textContent.length - b.textContent.length);
                if (!c.length) return false; c[0].click(); return true;
            }, view);
            // The same refusal portalDiff carries: a view that did not switch is worse than no reading.
            if (!hit) throw new Error(`portal:inventory refuses: no control reading "${view}" on the ${side} side.`);
            await page.evaluate(() => new Promise((r) => setTimeout(r, 1100)));
        }
        const data = await page.evaluate(COLLECT, PROPS);
        await page.close();
        return data;
    };
    try {
        const mk = await grab(`${MOCKUP}/${realm === 'home' ? 'index.html' : realm + '.html'}`, 'MOCKUP');
        const pt = await grab(`${HARNESS}?b=${Date.now()}#/${realm}`, 'PORTAL');
        const keys = [...new Set([...Object.keys(mk), ...Object.keys(pt)])].sort();
        const only = { mk: [], pt: [] }, count = [], style = [], text = [];
        for (const k of keys) {
            const a = mk[k], b = pt[k];
            if (a && !b) { only.mk.push(`${nameOf(k)}  ×${a.n}`); continue; }
            if (b && !a) { only.pt.push(`${nameOf(k)}  ×${b.n}`); continue; }
            if (a.n !== b.n) count.push(`${nameOf(k)}  mk ×${a.n}  pt ×${b.n}`);
            const diffs = PROPS.filter((p) => a.style[p] !== b.style[p])
                .map((p) => `${p}: ${a.style[p]} → ${b.style[p]}`);
            if (Math.abs(a.h - b.h) > 3) diffs.unshift(`height: ${a.h} → ${b.h}`);
            if (Math.abs(a.w - b.w) > 6) diffs.unshift(`width: ${a.w} → ${b.w}`);
            if (diffs.length) style.push({ k, diffs });
            // ⚠️ COMPARE WITH THE WHITESPACE REMOVED, NOT MERELY COLLAPSED. The mockup is hand-written HTML with newlines between inline elements and htm emits none, so textContent differs on almost every container for a reason that is not a design difference at all — 47 rows on the first run, most of them noise, which is the fastest way to make an audit unreadable and therefore unread.
            const bare = (t) => t.replace(/\s+/g, '').toLowerCase();
            if (a.text && b.text && bare(a.text) !== bare(b.text) && a.text.length < 55 && b.text.length < 55) {
                text.push(`${nameOf(k)}\n      mk “${a.text}”\n      pt “${b.text}”`);
            }
        }
        if (asJson) { console.log(JSON.stringify({ realm, view, only, count, style, text }, null, 1)); return; }
        const H = (t) => `\n${t}\n${'─'.repeat(t.length)}`;
        console.log(`\nportal:inventory — ${realm}${view ? ' · ' + view : ''} @ ${VW}x${VH}   mk ${Object.keys(mk).length} signatures · pt ${Object.keys(pt).length}`);
        console.log(H(`ONLY IN THE MOCKUP (${only.mk.length}) — drawn there, absent here`));
        only.mk.forEach((s) => console.log('  ' + s));
        console.log(H(`ONLY IN THE PORTAL (${only.pt.length}) — here, absent from the design`));
        only.pt.forEach((s) => console.log('  ' + s));
        console.log(H(`DIFFERENT WORDS (${text.length}) — same element, different information`));
        text.forEach((s) => console.log('  ' + s));
        console.log(H(`DIFFERENT COUNT (${count.length})`));
        count.forEach((s) => console.log('  ' + s));
        console.log(H(`DIFFERENT STYLE (${style.length})`));
        style.forEach((s) => console.log(`  ${nameOf(s.k)}\n      ` + s.diffs.join('\n      ')));
        console.log('\n  A difference is not a defect. Adjudicate each against COMPANION.md before it becomes an edit.\n');
        // The run reached its end and printed a report — record that, so portalStatus can tell an UNRUN instrument from one that ran clean. A receipt is not a result; see lib/portalReceipt.cjs.
        recordRun('inventory', realm);
    } finally { await browser.close(); }
})();
