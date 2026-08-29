// scripts/portalAudit.mjs — ONE call that returns EVERY difference between a design page and the
// portal's, in the order they have to be fixed, at a level of detail you can write a batch of edits
// from without opening anything else.
//
// 🔴 WHY THIS EXISTS, MEASURED. portal:converge answers the same question and answers it too shallowly:
// it walks four levels deep, compares thirteen style properties, and never reads the stylesheets. On
// 2026-08-29 00:2x EDT a Season pass spent well over a hundred turns in a measure → ONE fix → measure loop,
// because every finding below the fourth level (a table row, a lane bar, the season record's cells)
// needed its own hand-written probe, and every CSS difference needed a separate grep. The findings
// were real; the loop was the waste. The rule that produced it — "fix the FIRST rhythm mismatch and
// re-run" — is correct for a CASCADING offset and wrong for everything else, and converge could not
// tell the two apart because it could not see far enough down to know.
//
// So this reports in FIX ORDER, and the order is the batching contract:
//   ① CASCADE   the first vertical offset only. An offset near the top moves everything below it, so
//               a second entry here is almost always the same defect counted twice. FIX ALONE, re-run.
//   ② SHAPE     elements on one side and not the other. INDEPENDENT of each other — FIX AS ONE BATCH.
//   ③ WORDS     same element, different text.                        FIX AS ONE BATCH.
//   ④ STYLE     same element, different computed box or type.        FIX AS ONE BATCH.
//   ⑤ RULES     the two stylesheets, selector by selector. Read from disk, no browser — a declaration
//               that differs here explains a whole class of ④ at once.  FIX AS ONE BATCH.
// Sections ②–⑤ never cascade into one another, so they go in a single scripted edit. Only ① is
// one-at-a-time, and only while it is non-empty.
//
// ⚠️ REPEATED ELEMENTS ARE GROUPED, NOT LISTED. A table of 39 rows produced 39 near-identical lines,
// which is what made the old output unreadable and sent me back to ad-hoc probes. A run of siblings
// sharing a signature is reported as one row: how many, how many differ, and the first three that do.
//
// ⚠️ THE CSS DIFF IS AT-RULE AWARE, and that is not a nicety. A rule lifted out of its @media block is
// a DIFFERENT rule: two of the design's clock rules live under prefers-reduced-motion and one under
// max-width:820px, and copying them without their at-rule rendered a smaller face with no seconds at
// desktop width. The at-rule is part of the key.
//
// Usage: node scripts/portalAudit.mjs --realm season [--view Board] [--all] [--json]
//        --all lifts the per-section caps (default 25 rows each), for a first pass on a cold realm.
const KEY_SEP = ' \u00b7\u00b7 ';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? true) : d; };
const has = (n) => args.includes(n);

const realm = flag('--realm', 'season');
const view = flag('--view', null);
const CAP = has('--all') ? 1e9 : 25;

const PKG = 'docs/superpowers/mockups/2026-08-23-portal-interactive';
const MOCKUP = `http://localhost:8900/${PKG}/${realm === 'home' ? 'index' : realm}.html`;
const HARNESS = `http://localhost:8901/harness.html?conform=1&b=${Date.now()}#/${realm}`;
// The mockup's fixtures hardcode this day and the freeze cannot move it — see the conformance plan §0.6.
const FROZEN = Date.parse('2026-08-24T18:41:00Z');

// Wider than converge's thirteen, and every addition is one that cost a turn to find by hand:
// marginBottom was the record's 14px of trailing space, flex was the rename input that never grew,
// width/display/position are how a component silently stops being the thing its stylesheet describes.
const PROPS = ['display', 'position', 'width', 'minHeight', 'marginTop', 'marginBottom', 'marginLeft',
    'paddingTop', 'paddingBottom', 'paddingLeft', 'gap', 'flex', 'alignItems', 'justifyContent',
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign',
    'color', 'backgroundColor', 'borderRadius', 'borderTopWidth', 'borderLeftColor', 'opacity'];

// ── the in-page walk ─────────────────────────────────────────────────────────────────────────────
// No depth cap. The whole point is that a table cell, a lane bar and a grid cell are where the
// differences actually live, and every one of them sits below converge's fourth level.
const COLLECT = (props) => {
    const norm = (t) => String(t || '').replace(/\s+/g, ' ').trim();
    const ms = [...document.querySelectorAll('main')];
    const root = ms[ms.length - 1] || document.body;
    const out = [];
    const sigOf = (e) => {
        const cls = typeof e.className === 'string' ? e.className.trim() : '';
        // Digits are masked so `lvl2` and `lvl3` share a signature: a numbered variant is the same
        // component, and pairing them is what lets a level difference show up as a STYLE row.
        return e.tagName.toLowerCase()
            + (cls ? '.' + cls.split(/\s+/).sort().join('.').replace(/\d+/g, '#') : '');
    };
    const walk = (el, d, trail) => {
        for (const e of el.children) {
            if (!e.getClientRects().length) continue;
            const r = e.getBoundingClientRect(), c = getComputedStyle(e);
            const sig = sigOf(e);
            const style = {};
            for (const p of props) style[p] = c[p];
            out.push({
                d, sig, path: trail + '>' + sig,
                top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width),
                left: Math.round(r.left),
                // Own text only — a container's textContent is every descendant's, so a single wrong
                // word deep in a table reported as a difference on every ancestor above it.
                text: norm([...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ')),
                all: norm(e.textContent).slice(0, 60),
                style,
            });
            walk(e, d + 1, trail + '>' + sig);
        }
    };
    walk(root, 0, '');
    return out;
};

// ── the stylesheet diff, read from disk ──────────────────────────────────────────────────────────
function parseCss(file) {
    let src = fs.readFileSync(file, 'utf8');
    src = src.replace(/\/\*[\s\S]*?\*\//g, '');
    const out = new Map();
    // A hand-rolled brace walk rather than a parser dependency: it only has to survive this repo's
    // two stylesheets, and it has to KEEP the at-rule, which is what a flat regex loses.
    const stack = [];
    let i = 0, buf = '';
    while (i < src.length) {
        const ch = src[i];
        if (ch === '{') {
            const head = buf.trim().replace(/\s+/g, ' ');
            buf = '';
            if (head.startsWith('@')) { stack.push(head); i++; continue; }
            // A rule: read to its closing brace.
            let depth = 1, j = i + 1;
            while (j < src.length && depth > 0) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; }
            const body = src.slice(i + 1, j - 1);
            const decls = body.split(';').map((d) => d.trim().replace(/\s+/g, ' ')).filter(Boolean).sort();
            const key = (stack.length ? stack.join(' | ') + ' | ' : '') + head;
            if (!out.has(key)) out.set(key, []);
            out.get(key).push(decls);
            i = j; continue;
        }
        if (ch === '}') { stack.pop(); buf = ''; i++; continue; }
        buf += ch; i++;
    }
    return out;
}

function cssDiff() {
    const mkFiles = [`${PKG}/assets/tokens.css`, `${PKG}/assets/app.css`].map((f) => path.join(ROOT, f));
    const ptFiles = ['portal/ui/tokens.css', 'portal/ui/app.css'].map((f) => path.join(ROOT, f));
    const merge = (files) => {
        const m = new Map();
        for (const f of files) for (const [k, v] of parseCss(f)) m.set(k, (m.get(k) || []).concat(v));
        return m;
    };
    const mk = merge(mkFiles), pt = merge(ptFiles);
    const onlyMk = [], differ = [];
    for (const [sel, mkBodies] of mk) {
        if (!pt.has(sel)) { onlyMk.push(sel); continue; }
        const ptBodies = pt.get(sel);
        // Compare the UNION of declarations: a rule split across two blocks in one file and written as
        // one in the other is the same rule, and pairing block-for-block reported it as a difference.
        const flat = (bs) => new Set(bs.flat());
        const A = flat(mkBodies), B = flat(ptBodies);
        const aOnly = [...A].filter((d) => !B.has(d));
        const bOnly = [...B].filter((d) => !A.has(d));
        if (aOnly.length || bOnly.length) differ.push({ sel, aOnly, bOnly });
    }
    return { onlyMk, differ, counts: { mk: mk.size, pt: pt.size } };
}

// ── grouping: a run of siblings sharing a signature is ONE row ───────────────────────────────────
function groupRuns(rows) {
    const out = [];
    for (const r of rows) {
        const last = out[out.length - 1];
        if (last && last.sig === r.sig && last.d === r.d) { last.members.push(r); continue; }
        out.push({ sig: r.sig, d: r.d, members: [r] });
    }
    return out;
}

const pad = (v, n) => String(v).padStart(n);
const sgn = (n) => (n >= 0 ? '+' : '') + n;

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
            // ⚠️ REFUSES ON BOTH SIDES. A view flag that silently does nothing on one page produces a
            // plausible number for the wrong comparison — which has happened, from shell word-splitting.
            const hit = await p.evaluate((want) => {
                const n = (t) => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
                const c = [...document.querySelectorAll('button,a,[role="tab"]')]
                    .filter((e) => n(e.textContent) === n(want) && e.offsetParent !== null)
                    .sort((a, b) => a.textContent.length - b.textContent.length);
                if (!c.length) return false; c[0].click(); return true;
            }, view);
            if (!hit) throw new Error(`portal:audit refuses: no control reading "${view}" on the ${side} side.`);
            await p.evaluate(() => new Promise((r) => setTimeout(r, 1400)));
        }
        const data = await p.evaluate(COLLECT, PROPS);
        await p.close();
        return data;
    };

    try {
        const mk = await grab(MOCKUP, 'MOCKUP');
        const pt = await grab(HARNESS, 'PORTAL');
        const mkH = Math.max(...mk.map((r) => r.top + r.h), 0);
        const ptH = Math.max(...pt.map((r) => r.top + r.h), 0);

        if (has('--json')) {
            console.log(JSON.stringify({ mk, pt, css: cssDiff() }));
            return;
        }

        console.log(`\nportal:audit — ${realm}${view ? ' · ' + view : ''}    mk ${mk.length} nodes / ${mkH}px    ·    pt ${pt.length} / ${ptH}px    (${sgn(ptH - mkH)}px)\n`);

        // 🔴 PAIRING IS SEQUENCE ALIGNMENT, AND BOTH SIMPLER RULES WERE TRIED AND MEASURED FIRST.
        // Pairing globally by signature in document order — what portal:converge does — survives four
        // levels and collapses at sixteen: on Season's Board the first `b` in the page paired with a `b`
        // four cards away and 622 of 1608 nodes reported as present-on-one-side. Pairing strictly by
        // ancestor path plus ordinal is worse, 1610 groups, because ONE extra wrapper div desynchronises
        // every path beneath it and nothing below the first structural difference pairs at all.
        //
        // The two pages are two renderings of the same tree with insertions and deletions between them,
        // which is precisely what a longest-common-subsequence solves. Aligning the signature SEQUENCES
        // pairs correctly straight through a missing wrapper, and what falls outside the alignment is a
        // real structural difference rather than an artifact of counting.
        const alignPairs = (A, B) => {
            const n = A.length, m = B.length;
            // Int32Array rather than nested arrays: 1600 x 1600 is 2.5M cells and the naive form spends
            // more time allocating rows than computing them.
            const dp = new Int32Array((n + 1) * (m + 1));
            const at = (i, j) => i * (m + 1) + j;
            for (let i = n - 1; i >= 0; i--) {
                for (let j = m - 1; j >= 0; j--) {
                    dp[at(i, j)] = A[i].sig === B[j].sig
                        ? dp[at(i + 1, j + 1)] + 1
                        : Math.max(dp[at(i + 1, j)], dp[at(i, j + 1)]);
                }
            }
            const P = [], onlyA = [], onlyB = [];
            let i = 0, j = 0;
            while (i < n && j < m) {
                if (A[i].sig === B[j].sig) { P.push([A[i], B[j]]); i++; j++; }
                else if (dp[at(i + 1, j)] >= dp[at(i, j + 1)]) { onlyA.push(A[i]); i++; }
                else { onlyB.push(B[j]); j++; }
            }
            while (i < n) onlyA.push(A[i++]);
            while (j < m) onlyB.push(B[j++]);
            return { P, onlyA, onlyB };
        };
        const { P: pairs, onlyA: absent, onlyB: extra } = alignPairs(mk, pt);

        // ① CASCADE — the first vertical offset, alone.
        const offsets = pairs.filter(([a, b]) => Math.abs(b.top - a.top) > 1 || Math.abs(b.h - a.h) > 1);
        console.log('① CASCADE — an offset here moves everything below it. FIX THIS ONE ALONE, then re-run.');
        if (!offsets.length) console.log('   ✓ nothing: the two pages stack identically. Everything below is independent.\n');
        else {
            const [a, b] = offsets[0];
            console.log(`   ✗ ${a.sig}   top ${pad(a.top, 5)}→${pad(b.top, 5)} (${sgn(b.top - a.top)})   h ${pad(a.h, 4)}→${pad(b.h, 4)} (${sgn(b.h - a.h)})`);
            console.log(`      at ${a.path.slice(-110)}`);
            console.log(`      ${offsets.length - 1} more offset(s) below it — expect most to be this one, counted again.\n`);
        }

        // ② SHAPE — grouped by SIGNATURE across the whole page, not by run of siblings.
        // 🔴 A PATTERN REPEATED PER CARD IS ONE FINDING, NOT N. Grouping adjacent siblings only, the
        // Board reported 664 rows that were the same seven-element card sub-structure missing thirty-odd
        // times — which is one edit. Collapsing on the signature turns the section into the list of
        // component pieces one side has and the other does not, at the size the fix actually is.
        const bySig = (rows) => {
            const m = new Map();
            for (const r of rows) {
                if (!m.has(r.sig)) m.set(r.sig, { n: 0, sample: r, parents: new Set() });
                const g = m.get(r.sig); g.n++;
                g.parents.add(r.path.split('>').slice(-2, -1)[0] || '');
            }
            return [...m.entries()].sort((x, y) => y[1].n - x[1].n);
        };
        const shape = [];
        for (const [sig, g] of bySig(absent)) shape.push(`   ONLY IN MOCKUP  ×${pad(g.n, 4)}  ${sig.padEnd(26)} in ${g.parents.size} place(s)   ${g.sample.all.slice(0, 40)}`);
        for (const [sig, g] of bySig(extra)) shape.push(`   ONLY IN PORTAL  ×${pad(g.n, 4)}  ${sig.padEnd(26)} in ${g.parents.size} place(s)   ${g.sample.all.slice(0, 40)}`);
        console.log(`② SHAPE (${shape.length} component piece(s)) — independent of each other. ONE BATCH.`);
        shape.slice(0, CAP).forEach((l) => console.log(l));
        if (shape.length > CAP) console.log(`   … ${shape.length - CAP} more — re-run with --all`);
        console.log('');

        // ③ WORDS — own text only, grouped by signature.
        const bare = (t) => t.replace(/\s+/g, '').toLowerCase();
        const wordGroups = new Map();
        for (const [a, b] of pairs) {
            if (!a.text && !b.text) continue;
            if (bare(a.text) === bare(b.text)) continue;
            if (!wordGroups.has(a.sig)) wordGroups.set(a.sig, []);
            wordGroups.get(a.sig).push([a.text, b.text]);
        }
        console.log(`③ WORDS (${wordGroups.size} element kind(s)) — ONE BATCH.`);
        [...wordGroups].slice(0, CAP).forEach(([sig, list]) => {
            console.log(`   ${sig}${list.length > 1 ? `  ×${list.length}` : ''}`);
            list.slice(0, 3).forEach(([m, p]) => console.log(`      mk “${m.slice(0, 68)}”\n      pt “${p.slice(0, 68)}”`));
        });
        if (wordGroups.size > CAP) console.log(`   … ${wordGroups.size - CAP} more — re-run with --all`);
        console.log('');

        // ④ STYLE — grouped by signature AND by which property differs, because one CSS rule produces
        //    the same difference on every element it matches and they are one fix, not N.
        const styleGroups = new Map();
        for (const [a, b] of pairs) {
            for (const p of PROPS) {
                if (a.style[p] === b.style[p]) continue;
                // A NUL here made this whole file BINARY to ripgrep, which reports no matches in it rather than
                // an error — so the one instrument the conformance pass runs on was unsearchable by the tool
                // everything else here is searched with. A printable sentinel that cannot occur in a selector
                // or a computed value does the same job and stays visible.
                const key = [a.sig, p, a.style[p], b.style[p]].join(KEY_SEP);
                styleGroups.set(key, (styleGroups.get(key) || 0) + 1);
            }
        }
        console.log(`④ STYLE (${styleGroups.size} difference(s)) — ONE BATCH.`);
        [...styleGroups].sort((x, y) => y[1] - x[1]).slice(0, CAP).forEach(([k, n]) => {
            const [sig, prop, mv, pv] = k.split(KEY_SEP);
            console.log(`   ×${pad(n, 3)}  ${sig}   ${prop}: ${mv} → ${pv}`);
        });
        if (styleGroups.size > CAP) console.log(`   … ${styleGroups.size - CAP} more — re-run with --all`);
        console.log('');

        // ⑤ RULES — the stylesheets themselves. Explains ④ in bulk, and finds what ④ cannot: a rule
        //    the design has for a state or a breakpoint nothing on this page is currently in.
        const css = cssDiff();
        console.log(`⑤ RULES — ${css.counts.mk} design selectors · ${css.onlyMk.length} the portal does not define · ${css.differ.length} differing. ONE BATCH.`);
        css.onlyMk.slice(0, CAP).forEach((s) => console.log(`   MISSING RULE   ${s}`));
        if (css.onlyMk.length > CAP) console.log(`   … ${css.onlyMk.length - CAP} more — re-run with --all`);
        css.differ.slice(0, CAP).forEach(({ sel, aOnly, bOnly }) => {
            console.log(`   DIFFERS        ${sel}`);
            if (aOnly.length) console.log(`      design only: ${aOnly.join(' ; ').slice(0, 150)}`);
            if (bOnly.length) console.log(`      portal only: ${bOnly.join(' ; ').slice(0, 150)}`);
        });
        if (css.differ.length > CAP) console.log(`   … ${css.differ.length - CAP} more — re-run with --all`);
        console.log('');
    } finally { await browser.close(); }
})();
