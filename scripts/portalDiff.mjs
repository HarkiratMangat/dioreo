#!/usr/bin/env node
// scripts/portalDiff.mjs — THE INSTRUMENT THE CONFORMANCE PASS WAS MISSING FOR TWO PARTS.
//
// 🔴 WHY THIS EXISTS, stated bluntly because the reason is an indictment of everything beside it. The acceptance test for this whole project is one sentence: "I should not be able to see a difference between the mockup's season realm and the live portal's season realm." Harkirat ran that test on 2026-08-28 15:33 EDT by putting two screenshots side by side, and it took him about two seconds to find four composition defects that a 130-turn Part had just declared closed.
//
// Every instrument the plan mandated is an ELEMENT SCANNER. `portal:orphans` asks whether a class has a rule. `portalReverseOrphans` asks the inverse. The structural inventory diff compares headings, tabs and column headers. `portalStates` walks states. `__grid` measures boxes. Every one of them answers "which elements exist, and are they well-formed" — and a page with all the right elements in the wrong arrangement passes all five. That is exactly what shipped: the same nouns, a different page.
//
// The plan's §0 diagnoses that the repo's gates are element scanners which cannot see the real defects, and then prescribes four more element scanners. This file is the missing kind: it does not enumerate anything. It renders both pages and subtracts them.
//
// 🔴 THE MOCKUP IS NOT A SPECIFICATION TO BE READ. IT IS A PROGRAM THAT RENDERS. Two programs drawing the same season should produce nearly the same pixels, and where they do not IS the work list — produced before anyone has an opinion about which elements are worth enumerating, ranked by how much of the page each disagreement occupies, which is the same order a human eye finds them in.
//
// ⚠️ IT WILL NEVER REACH ZERO, AND A THRESHOLD THAT DEMANDS ZERO WOULD BE ABANDONED IN A DAY. The portal runs on real data against a fixture, carries surfaces the mockup lacks, and is deliberately ahead in places with citations to prove it. So this reports REGIONS, not a score to chase: every region is either closed or written into the Part's difference ledger with a citation. What changes is that the candidate list is now generated rather than remembered — the failure mode of an authored ledger is the difference its author could not see, which is precisely the failure this replaces.
//
// USAGE
//   node scripts/portalDiff.mjs --realm season                    capture, diff, report, write PNGs
//   node scripts/portalDiff.mjs --realm season --scroll 900       same, at a scroll offset
//   node scripts/portalDiff.mjs --realm season --view Board      a sub-view; refuses if either side did not switch
//   node scripts/portalDiff.mjs --realm season --viewport 375x812 the narrow layout (off-contract, and says so)
//   node scripts/portalDiff.mjs --realm season --json             machine-readable region list
//
// OUTPUT  local/diff-<realm>/mk-<realm>.png · pt-<realm>.png · delta-<realm>.png
//   `mk-` is the MOCKUP and `pt-` is the PORTAL, in the filename and in every line this prints, because
//   "is that the mockup or the portal?" has had to be asked out loud before.
//
// ⚠️ THE PORTAL SIDE IS THE REAL SERVER BY DEFAULT, NOT THE HARNESS. The harness stubs its data and the mockup is fixture-driven by construction, so those two agree with each other and can both disagree with production — which is what happened with the overview strip, dense in the mockup and 37 marks pinned to their 3px floor against real data. `--portal harness` is available and is the weaker comparison; it says so in the header of its own report.

import fs from 'fs';
import { SEED_REALMS } from './lib/portalSeedRealms.mjs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { record: recordRun } = require('./lib/portalReceipt.cjs');
// 🔴 ONE DOOR RULE, THREE CALLERS. `lib/portalSession.cjs`'s header says "this is that logic, extracted" and this file never adopted it: it kept its own `mintSession` and a door guard testing `main.door` ALONE, which passes the shell-with-no-rows case the lib exists to catch. Three unequal copies of one rule is the defect that lib was written to remove, in the file it was extracted FROM.
const { mintSession: mintDevSession, assertPastDoor } = require('./lib/portalSession.cjs');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const MOCKUP = 'http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive';
const PORTAL_REAL = 'http://localhost:8787';
const PORTAL_HARNESS = 'http://localhost:8901/harness.html';

// The viewport contract, from the plan's §0.3: his window is 1282x920 with 32px of browser chrome. The contract is 1282x888 and every other instrument here is baked to it. --viewport exists for the ONE case that contract cannot express: his original instruction named two widths, "1280x880 and 375x812", and both stylesheets carry real max-width:768px rules, so the narrow layout is designed on both sides and is not a degradation. An off-contract run says so in its own header and writes its own filenames, so it can never be mistaken for the contract reading.
const [VW, VH] = (() => {
    const m = /^(\d{3,5})x(\d{3,5})$/.exec(String(process.argv[process.argv.indexOf('--viewport') + 1] || ''));
    return m ? [Number(m[1]), Number(m[2])] : [1282, 888];
})();
const OFF_CONTRACT = VW !== 1282 || VH !== 888;
const VH0 = VH;
// The old one-screenful behaviour, kept as an opt-in rather than deleted: "what lands above the fold" is a real question, it is just not the same question as "do these two pages match".
const foldOnly = process.argv.includes('--fold');
// Escape hatch for the one case where the wall clock IS the subject; never for an overlay run.
const noFreeze = process.argv.includes('--live-clock');
const SHOT_H = {};

// A cell is coarse on purpose. Pixel-exact differences are noise — antialiasing, a 1px rounding between two layers, a font hinting difference. What matters is REGIONS: a block that moved, a panel that is the wrong ground, a control that is not there. 16px cells cluster naturally into those and never into dust.
const CELL = 16;
// A cell counts as different when this share of its pixels differ by more than the channel tolerance.
//
// 🔴 `--selftest` IS HOW THESE NUMBERS ARE EARNED, AND THE FIRST VERSION OF THIS COMMENT CLAIMED THEY ALREADY HAD BEEN. It said they were "picked by running the tool against the mockup versus ITSELF and widening until the first stayed empty." That run never happened — the numbers were chosen by judgement and then given a provenance that reads like a falsification pass. Committed 2026-08-28 16:1x EDT, in the file whose entire purpose is to stop claims that sound measured and are not, which makes it the worst single act of that session: a fabricated experiment in a comment is read as settled and never re-run.
//
// `node scripts/portalDiff.mjs --selftest` renders the MOCKUP TWICE and diffs it against itself. A tool that reports differences between a page and itself is measuring noise, so this must come back at essentially zero — and if it ever does not, every region list this tool has printed is suspect.
const CHANNEL_TOL = 24, CELL_SHARE = 0.06;


// ── WHAT THIS TOOL DOES NOT SEE ────────────────────────────────────────────────────────────────── 🔴 PRINTED ON EVERY RUN, BECAUSE AN INSTRUMENT THAT DOES NOT STATE ITS COVERAGE LETS EVERY READER ASSUME IT COVERS EVERYTHING. Three blind spots have been found here by somebody noticing a defect the number could not have contained — below the fold, behind a click, and under the pointer — and each time the tool had reported a confident percentage about a page it had only partly looked at. The axes are enumerated once, here, and the uncovered ones are named in the output.
const COVERAGE_NOTE = [
    'viewport 1282x888 only — 375x812 has never been run on any realm',
    'data states (empty · error · loading) are walked by portal:states but never PIXEL-compared',
    'transitions are zeroed, so only the settled frame is compared',
    'light mode is out of scope by decision (the console is dark-only)',
];

const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? true) : d; };
const realm = flag('--realm', 'season');
const scrollY = Number(flag('--scroll', 0)) || 0;
const asJson = args.includes('--json');
const portalMode = flag('--portal', 'real');
// 🔴 THE FALSIFIER. Every other instrument here ships with a case proving it can fail, and the plan's own §0.10 says to prove a probe can report PRESENCE before trusting its silence. This one shipped with neither. `--selftest` is that rule inverted: identical input must produce an empty result.
const selfTest = args.includes('--selftest');

// 🔴 --view IS THE MOST DANGEROUS FLAG IN THIS FILE, because its failure mode is FLATTERING. Season's Board and Repairs live behind tabs; if the click misses on one side the tool diffs the default view against the default view and prints a small, tidy region list that reads like Board is nearly conformant. That is the exact shape of every instrument failure this pass has produced: it runs, it emits well-formed output, and it measured something else. So the flag ASSERTS rather than attempts — on each side independently it records what main says before the click and after it, and refuses to report unless BOTH sides actually moved. A tab that is not found is a refusal, never a silent fall-through to the default view.
const view = flag('--view', null);
// 🔴 THE OVERLAY TIER, AND IT WAS THE WHOLE MISSING HALF. Harkirat opened the harness himself on 2026-08-29 while Season's three views measured 0.1–0.2% and found the composer and the export panel "severely broken" — because this tool screenshots the page AS IT LOADS and had never clicked anything. Every modal, drawer and panel on every realm was therefore unmeasured, on both sides, from day one. A realm at 0.1% was only ever a realm whose RESTING page matched, and nothing said so.
//
// ⚠️ IT REFUSES THE SAME WAY --view DOES, and for the same reason: a click that misses on one side diffs the page against itself and prints a tidy, flattering region list. Found AND moved, on BOTH sides, or no report.
const openText = flag('--open', null);
// 🔴 AN OVERLAY WHOSE TRIGGER HAS NO UNIQUE LABEL WAS UNMEASURABLE, AND TWO OF SEASON'S SEVEN ARE EXACTLY THAT. The identity editor opens from `.idsum`, a div with no accessible name at all, so it never appears in `--triggers` and `--open` can never reach it. The one-way typed confirm opens from one of FIVE buttons all reading "Export first → ", which the ambiguity guard correctly refuses. A label is the right default — it is what a person clicks — but a selector is what makes the tier complete rather than complete-except-where-the-markup-is-inconvenient.
const openSel = flag('--open-sel', null);
// 🔴 THE SAME DOM UNDER A DIFFERENT POINTER CONDITION. --open reaches a different DOM; these reach the same one in a state no capture had ever taken. Both stylesheets carry ~145 :hover rules and ~75 focus rules apiece and not one of them had ever been compared — including a `.idsum:hover .ed` the audit has been reporting as MISSING from the portal all along, with nothing able to act on it.
const hoverText = flag('--hover', null);
const focusText = flag('--focus', null);
// A modal is anchored to the VIEWPORT, so growing the frame to the document's height would centre it in four thousand pixels of matching background and report a percentage diluted by empty space. --open captures one screenful; --open-full is the opt-out for a drawer that genuinely scrolls.
const openFull = args.includes('--open-full');
const openSlug = (openText || openSel) ? '-open' + String(openText || openSel).toLowerCase().replace(/[^a-z0-9]+/g, '') : ''
    + (hoverText ? '-hover' + String(hoverText).toLowerCase().replace(/[^a-z0-9]+/g, '') : '')
    + (focusText ? '-focus' + String(focusText).toLowerCase().replace(/[^a-z0-9]+/g, '') : '');
const viewSlug = view ? '-' + String(view).toLowerCase().replace(/[^a-z0-9]+/g, '') : '';
const vpSlug = OFF_CONTRACT ? `-${VW}x${VH}` : '';
const shotName = (side) => `${side}-${realm}${viewSlug}${openSlug}${vpSlug}.png`;

// Addressed by the word on the control, so it needs no knowledge of either side's class names — the mockup and the portal do not share them. Case- and whitespace-insensitive, and it takes the SHORTEST matching element so a container whose text merely includes the word never wins over the tab itself. 🔴 IT REPORTS WHAT IT CLICKED AND HOW MANY IT COULD HAVE, because returning a bare `true` is what let two sides open DIFFERENT panels and call the difference a conformance figure. The candidates are sorted by text length and `cands[0]` is clicked — so where several controls share a label, the two pages pick independently, and nothing downstream can tell. Measured 2026-08-30: `--open "Export first → "` opened the design's EXPORT DRAWER against the portal's STAGING DRAWER and reported **26.7% in 2 regions**; `--open "Season 7 — Terminated Jul 22 6 img current"` opened a Discord card preview against the identity summary and reported **18.7%**. Both numbers are well-formed, large, and about nothing. `--triggers` had already printed `Export first → ×5`: the tool knew the label was ambiguous, printed the count, and clicked one anyway.
const CLICK_VIEW = (want) => {
    const norm = (t) => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const target = norm(want);
    const cands = [...document.querySelectorAll('button,a,[role="tab"],[role="button"]')]
        .filter((e) => norm(e.textContent) === target && e.offsetParent !== null)
        .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
    if (!cands.length) return false;
    const el = cands[0];
    // The path is what makes two sides comparable: a label can repeat, but "the fourth `.exs-i` inside `.tray`" is a position, and two renderings of the same design agree about position or the difference is the finding.
    const path = (n) => { const out = []; for (let e = n; e && e.tagName !== 'BODY'; e = e.parentElement) { const t = e.tagName.toLowerCase(); const c = (e.className && typeof e.className === 'string') ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''; out.unshift(t + c); } return out.slice(-4).join('>'); };
    el.click();
    return { n: cands.length, path: path(el) };
};
// What an OVERLAY opening looks like, cheaply. A modal is frequently portaled OUTSIDE main — the tray, the confirm sheet and the export panel all are — so the view signature below cannot see it. Body text length plus the count of anything dialog-shaped moves for every one of them.
const OPEN_SIG = () => {
    const t = String(document.body.innerText || '').replace(/\s+/g, ' ').trim();
    const n = document.querySelectorAll('dialog,[role="dialog"],[aria-modal="true"],.ov,.ovl,.modal,.sheet,.drawer,.exs,.dw,.cmp').length;
    // Node COUNT, not innerHTML length: an aria-expanded flip changes the byte count by one and would pass this assertion while nothing opened, which is precisely the flattering failure it exists to stop.
    return t.length + '|' + n + '|' + document.querySelectorAll('*').length;
};
// What the page IS, cheaply and without knowing its markup: how much text the content area holds plus how it starts. A view change moves both. Comparing this before and after the click is what turns a missed tab into a refusal instead of a clean-looking report.
const VIEW_SIG = () => {
    const m = document.querySelector('main');
    const t = String((m && m.innerText) || '').replace(/\s+/g, ' ').trim();
    return t.length + '|' + t.slice(0, 140);
};

const OUT = path.join(ROOT, 'local', `diff-${realm}`);

// ── the two URLs, and the one difference in how each is reached ────────────────────────────────────── The mockup is one HTML file per realm. The portal is an SPA addressed by hash. A realm the mockup does not have (there is no `home.html`; index.html is Home) is named here rather than guessed at.
const MOCKUP_PAGE = { home: 'index.html' }[realm] || `${realm}.html`;
// 🔴 A QUERY THE MOCKUP SIDE CARRIES, because one realm cannot be compared without it. Review's staged-ops store is sessionStorage and every load here clears it, so its mockup renders EMPTY against a populated portal and every number is a comparison of two different datasets. `--mk-query demo=1` asks review.html to seed itself from its own fixtures — seeded on request, never automatically (COMPANION §15).
const MK_QUERY = process.argv.includes('--mk-query') ? String(process.argv[process.argv.indexOf('--mk-query') + 1] || '') : '';
const withQuery = (u) => (MK_QUERY ? u + (u.includes('?') ? '&' : '?') + MK_QUERY : u);
const mockupUrl = withQuery(`${MOCKUP}/${MOCKUP_PAGE}`);
// 🔴 REVIEW REFUSES WITHOUT A SEED, AND THAT IS A REFUSAL RATHER THAN A NOTE ON PURPOSE. Review's staged-ops store is sessionStorage and every load here clears it, so an unseeded run compares an EMPTY mockup against a POPULATED portal and returns a confident, well-formed number for a comparison nobody meant to make — measured 2026-09-03 00:22 EDT at 4.7% in 15 regions against 0.5% in 12 seeded. A note in the plan would be one more thing to remember; this cannot be forgotten. `--no-seed` is the explicit opt-out for anyone who really does want the empty state. 🔴 TWO REALMS NOW, NOT ONE. Home carries the same staged surfaces Review does — the header's commit crumb, the masthead's staged figure and the whole `.hres` resume strip — and it was measured UNSEEDED through Part 6b's first nine runs, which reported the crumb, the figure and the strip as ONLY IN PORTAL and the two pages 78px apart. Seeded they are the same height. Until 2026-09-03 21:29 EDT the seed lived inside review.html and no other page could be asked; it is in the mockup's shared shell.js now, so this guard can cover any page that shows staged work rather than the one page that happened to own the code.
if (SEED_REALMS.includes(realm) && !/demo=1/.test(MK_QUERY) && !process.argv.includes('--no-seed')) {
    console.error(`refusing: ${realm === 'home' ? 'Home' : 'Review'} must be measured SEEDED or the two sides hold different data.\n`
        + '  add   --mk-query demo=1     to compare two populated boards (what every recorded figure for this realm means)\n'
        + '  or    --no-seed             to measure the empty state deliberately');
    process.exit(2);
}

const portalUrl = selfTest ? mockupUrl
    : portalMode === 'harness' ? `${PORTAL_HARNESS}?fresh=1&b=${Date.now()}#/${realm}`
    : `${PORTAL_REAL}/?b=${Date.now()}#/${realm}`;

// ── SIGNING THE DIFF IN ─────────────────────────────────────────────────────────────────────────────
//
// 🔴 THE FIRST RUN OF THIS TOOL DIFFED A LOGIN PAGE AND REPORTED 11.9% ACROSS TWELVE REGIONS, and every one of them was noise. Puppeteer launches a clean profile, so the real portal answers with the door — and the report looked exactly like a real finding: percentages, ranked regions, element names. That is the whole failure mode this file was written to end, reproduced by the file itself on its first run.
//
// Two answers, and it needs both. It MINTS a session against dev Mongo so it can see the realm at all, and it REFUSES to report if the portal side is still the door — because a diff that silently compares the wrong page is worse than no diff, and this one had already proved it can happen.
//
// ⚠️ DEV MONGO ONLY, asserted rather than assumed. It reads the URI out of `.env.dev` by hand (the same grep-do-not-source reasoning as backupDb.sh and portSeasonalToLocal.mjs) and refuses anything that is not localhost. A diff tool that can write a session into the production database is not a diff tool. Delegates to the extracted lib. The reasoning that used to live here — dev Mongo asserted rather than assumed, the OWNER rather than whoever the database lists first — is unchanged and now lives in ONE place.
async function mintSession(discordId) { return mintDevSession(ROOT, discordId); }

// Applied identically by shoot() and label(), because a region labelled from the DEFAULT view while the pixels came from Board is worse than no label at all — it names the wrong element with total confidence. Every visible control the page offers, both sides, as one map. Written because the first question the overlay tier asks — "what is there to open, and does the other side have it?" — had no answer short of reading two source files, and a control present on ONE side is itself a finding this reports for free.
const LIST_TRIGGERS = () => {
    const norm = (t) => String(t || '').replace(/\s+/g, ' ').trim();
    const out = new Map();
    for (const e of document.querySelectorAll('button,a,[role="button"],[role="tab"],summary')) {
        if (e.offsetParent === null) continue;
        // 🔴 A DATA ROW IS NOT A CONTROL. Armory's list came back as a hundred build names — every row of every table is clickable, so an unfiltered inventory is unreadable on exactly the realm that needs it most. A control belongs to the chrome; a row belongs to the content, and the content is what the other four sections already compare.
        if (e.closest('tr,li[data-id],[data-id],.bcard,.mtable tbody,.daylist,.explist,.exs')) continue;
        const t = norm(e.textContent) || norm(e.getAttribute('aria-label'));
        if (!t || t.length > 60) continue;
        out.set(t, (out.get(t) || 0) + 1);
    }
    return [...out.entries()].map(([t, n]) => t + (n > 1 ? ` ×${n}` : ''));
};

// Addressed by the word on the control, like every other targeting here, then hovered with the REAL mouse — :hover does not respond to a dispatched event, only to the pointer actually being there.
async function pointAt(page, side) {
    for (const [text, kind] of [[hoverText, 'hover'], [focusText, 'focus']]) {
        if (!text) continue;
        const box = await page.evaluate((want) => {
            const n = (t) => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
            const c = [...document.querySelectorAll('button,a,[role="button"],[role="tab"],input,select,summary,li,td,[tabindex]')]
                .filter((e) => n(e.textContent) === n(want) && e.offsetParent !== null)
                .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
            if (!c.length) return null;
            const r = c[0].getBoundingClientRect();
            return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: r.width, h: r.height };
        }, text);
        if (!box) throw new Error(`portal:diff refuses to report: no element reading "${text}" to ${kind} on the ${side} side.`);
        if (kind === 'hover') await page.mouse.move(box.x, box.y);
        else {
            await page.evaluate((want) => {
                const n = (t) => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
                const c = [...document.querySelectorAll('button,a,[role="button"],input,select,[tabindex]')]
                    .filter((e) => n(e.textContent) === n(want) && e.offsetParent !== null)
                    .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
                // focusVisible is what makes the KEYBOARD ring appear; a bare focus() often does not.
                if (c[0]) { try { c[0].focus({ focusVisible: true }); } catch { c[0].focus(); } }
            }, text);
        }
        await page.evaluate(() => new Promise((r) => setTimeout(r, 420)));
    }
}

// 🔴 THE CROSS-SIDE PANEL COMPARISON WAS TRIED TWICE AND REMOVED, and the attempts are worth more than the code was. A signature taking the LAST visible overlay picked an empty `div.ov` scrim on both sides, so it matched while the panels underneath held different content — silent on the exact reading it was written for. Taking the one with the MOST TEXT then selected different elements on the two sides for panels that genuinely agree, and Event and Playlist started refusing at 0.9%. A guard with false positives gets suppressed rather than obeyed, and a third variant guessed at from here would be the same guess again. Filed with both measurements attached.
//
// What survives is the part that is exact: a label matching MORE THAN ONE control is refused, because the tie-break runs independently on each page. That alone caught `Export first → ` (5 matches, and `--triggers` had been printing `×5` all along). Where a label is unique the clicked PATH is the same on both sides — for the row preview both clicked `li.rec-row.cur` — so a large residual there is a real finding about two different panels, not an artefact.
const CLICK_SEL = (sel) => {
    // ⚠️ `getClientRects()`, NOT `offsetParent`. The label matcher uses `offsetParent` and gets away with it because a labelled control is nearly always statically positioned; `.idsum` is not, and `offsetParent` is null for a positioned element whose containing block is the initial one — so the first version of this reported "no visible element matching .idsum" about an element `portal:probe` was measuring at 1160x147, on both sides, with every property agreeing. A visibility test that disagrees with a measurement of the same element is the wrong test.
    const found = [...document.querySelectorAll(sel)];
    const all = found.filter((e) => e.getClientRects().length > 0);
    if (!all.length) return { n: 0, present: found.length, why: found.map((e) => {
        const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
        return `display:${cs.display} visibility:${cs.visibility} ${Math.round(r.width)}x${Math.round(r.height)} parentDisplay:${e.parentElement ? getComputedStyle(e.parentElement).display : '-'}`;
    }).join(' | ') };
    all[0].click();
    return { n: all.length, path: sel };
};

async function openOverlay(page, side) {
    if (!openText && !openSel) return;
    const before = await page.evaluate(OPEN_SIG);
    // 🔴 POLL FOR THE TARGET, DO NOT ASSUME IT IS THERE — the third instance of this class today, and the same remedy each time. The mockup builds its identity summary with `idSum.innerHTML = …` in its own script, so for a moment `.idsum` is an empty div with no client rects. Clicking straight after `load` reported "no visible element matching .idsum" about an element `portal:probe` was measuring at 1160x147 on both sides with every property agreeing. A fixed sleep would paper over it on this machine and fail on a slower one; waiting for the element itself is exact and costs nothing when it is already there.
    if (openSel) {
        try {
            await page.waitForFunction(
                (sel) => [...document.querySelectorAll(sel)].some((e) => e.getClientRects().length > 0),
                { timeout: 6000 }, openSel);
        } catch { /* fall through to the refusal below, which says what was found and what was rendered */ }
    }
    const hit = openSel ? await page.evaluate(CLICK_SEL, openSel) : await page.evaluate(CLICK_VIEW, openText);
    const what = openSel ? `matching ${openSel}` : `reading "${openText}"`;
    if (!hit || !hit.n) throw new Error(`portal:diff refuses to report: no visible element ${what} on the ${side} side`
        + (hit && hit.present ? ` — ${hit.present} match the selector but none is rendered (${hit.why}).\n` : '.\n')
        + '  Run with --triggers to see every control both sides actually offer.');
    // 🔴 AN AMBIGUOUS LABEL IS REFUSED, NOT RESOLVED BY GUESSING. Picking the shortest match is a tie-break, and a tie-break applied independently on two pages is how they end up comparing different things.
    if (hit.n > 1) throw new Error(`portal:diff refuses to report: ${openSel || '"' + openText + '"'} matches ${hit.n} controls on the ${side} side, and the tie is broken by text length — independently on each side, so the two pages can open different panels and the percentage would be about nothing.\n`
        + `  It clicked ${hit.path}. Use a label that appears once, or open the panel from a control that does.`);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1100)));
    const after = await page.evaluate(OPEN_SIG);
    if (after === before) throw new Error(`portal:diff refuses to report: clicking ${openSel || '"' + openText + '"'} opened nothing on the ${side} side.\n`
        + '  The control was found and clicked and the page is byte-identical afterwards, so no overlay appeared.');
}

async function enterView(page, side) {
    if (!view) return;
    const before = await page.evaluate(VIEW_SIG);
    const hit = await page.evaluate(CLICK_VIEW, view);
    if (!hit) throw new Error(`portal:diff refuses to report: no control reading "${view}" exists on the ${side} side.\n`
        + '  Without this refusal the run would have diffed the default view against itself and reported it as this one.');
    await page.evaluate(() => new Promise((r) => setTimeout(r, 900)));
    const after = await page.evaluate(VIEW_SIG);
    if (after === before) throw new Error(`portal:diff refuses to report: clicking "${view}" changed nothing on the ${side} side.\n`
        + '  The control was found and clicked, and main is identical afterwards, so the view did not switch.');
}

// 🔴 WITHOUT THIS THE RESIDUAL HAS A FLOOR NOBODY CAN EXPLAIN, and an unexplained floor is how a threshold gets quietly raised until it stops meaning anything. COMPANION 16.31a records that ?today= does NOT travel the clock: countdownParts reads Date.now(), so the hero figure, the seconds, the tier colour and the session expiry line all move between two captures taken seconds apart. Both sides are pinned to ONE instant, before any script on the page runs, so nothing can observe the real wall clock.
const FROZEN = Date.parse(String(flag('--at', '2026-08-24T18:41:00Z')));
async function freezeClock(page) {
    if (noFreeze) return;
    await page.evaluateOnNewDocument((t) => {
        const RealDate = Date;
        const Frozen = function (...a) { return a.length ? new RealDate(...a) : new RealDate(t); };
        Frozen.prototype = RealDate.prototype;
        Frozen.now = () => t;
        Frozen.parse = RealDate.parse;
        Frozen.UTC = RealDate.UTC;
        window.Date = Frozen;
        try { performance.now = () => 0; } catch { /* read-only in some builds */ }
    }, FROZEN);
}

async function shoot(page, url, label) {
    await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
    await freezeClock(page);

    // 🔴 EVERY LOAD STARTS FROM A CLEAN SLATE, AND UNTIL 2026-08-30 18:5x EDT NONE OF THEM DID. The mockup persists FIVE pieces of UI state in sessionStorage — `dioreo-identity-open`, `dioreo-board-collapsed`, the lane-collapse map, the staged-ops tray and the export panel's open flag — and this tool reuses ONE page for the mockup shot, the portal shot and the labelling pass. sessionStorage is per-origin and survives navigation inside a tab, so a single `--open` click on any toggle that persists silently changed what every LATER run measured.
    //
    // It was found the long way. `--open-sel ".idsum"` refused with "no visible element ... 1 match the selector but none is rendered (display:none)", about an element `portal:probe` measured at 1160x147 on both sides with every property agreeing, and which a standalone puppeteer replication — plain load, networkidle2, the same 2400ms scroll settle, frozen clock and live clock — reported as `block` with one client rect in all five variants. The measurements disagreed because the FIRST attempt had expanded the identity section and the mockup remembered.
    //
    // ⚠️ THE CONSEQUENCE IS BIGGER THAN ONE REFUSAL. `dioreo-board-collapsed` and the lane-collapse map are persisted the same way, and "Events and Playlists auto-collapsing 20 of 39 Track items" has been carried as a Season defect in the plan's §L. That has to be re-measured from a clean slate before it is trusted as a difference between the two sides at all.
    await page.evaluateOnNewDocument(() => {
        try { sessionStorage.clear(); } catch { /* a sandboxed context can refuse; a clean load is still the default */ }
        try { localStorage.clear(); } catch { /* same */ }
    });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    // 🔴 NEVER rAF — it does not fire in a background tab and a pass gated on it waits forever. This is the same trap portalStates.mjs records; `document.fonts.ready` resolves regardless of visibility.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('main', { timeout: 20000 });
    // The SPA has to route, fetch and settle. The mockup only has to lay out. One wait covers both. 🔴 SCROLL THE CONTAINER, NOT THE WINDOW — a trap this repo had already written down and this tool walked into anyway on its first day: "main is the portal's scroll container, so window.scrollY can never show a portal scroll bug." The mockup scrolls its document; the portal scrolls `main`. Scroll whichever actually overflows, on both sides, or `--scroll` silently reports the top of the page twice and every region below the fold stays invisible.
    await page.evaluate((y) => new Promise((r) => {
        const cands = [...document.querySelectorAll('main'), document.scrollingElement, document.documentElement];
        const el = cands.filter(Boolean).sort((a, b) => (b.scrollHeight || 0) - (a.scrollHeight || 0))
            .find((e) => e.scrollHeight > e.clientHeight + 4);
        if (el) el.scrollTop = y; else window.scrollTo(0, y);
        setTimeout(r, 2600);
    }), scrollY);
    // ⚠️ ANIMATION IS STOPPED BEFORE THE SHUTTER, not tolerated after it. An entrance animation mid-flight renders a different frame on each run, and a diff whose own output moves between runs is a diff nobody will trust twice. Reduced motion is emulated AND transitions are zeroed, on both sides identically — so the comparison is of the settled page, which is the thing being designed.
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 260)));
    // 🔴 `main.door` ALONE PASSES THE SHELL-WITH-NO-ROWS CASE, which is the exact reading `lib/portalSession.cjs` was extracted to stop: a rendered header and 784 characters of chrome, identical on every view, looks like a stable measurement and is the signature of never having arrived. The lib's rule runs on the PORTAL side only — the mockup is a static page with no door to be behind, and its fold/overlay captures legitimately render shapes the realm-row list does not name.
    const door = await page.evaluate(() => !!document.querySelector('main.door'));
    if (!door && !selfTest && label !== 'mk') await assertPastDoor(page, `${url} (portal side)`);
    if (door && !selfTest) {
        throw new Error(`portal:diff refuses to report: ${url} is showing the DOOR, not the realm.\n`
            + '  A diff of a login page produces percentages and ranked regions that look exactly like findings.\n'
            + '  Either the dev portal is not running with --env-file=.env.dev, or no admin exists in dev Mongo\n'
            + '  for a session to be minted against.');
    }
    await enterView(page, label === 'mk' ? 'MOCKUP' : 'PORTAL');
    await openOverlay(page, label === 'mk' ? 'MOCKUP' : 'PORTAL');
    await pointAt(page, label === 'mk' ? 'MOCKUP' : 'PORTAL');
    // 🔴 THE TWO SIDES LAND AT DIFFERENT SCROLL POSITIONS AND THAT ALONE DOMINATED THE NUMBER. The design's composer scrolls itself into view on open (its page ends at scrollTop 285); a portal that does not leaves the two fold-height frames photographing different parts of the page, and the residual reads as a composition failure when it is a camera failure. Whether each side auto-scrolls is a real question — the audit's `top` column answers it — but the pixel frame has to be deterministic first.
    if (openText) {
        await page.evaluate(() => new Promise((r) => {
            for (const el of [...document.querySelectorAll('main'), document.scrollingElement, document.documentElement]) {
                if (el) el.scrollTop = 0;
            }
            window.scrollTo(0, 0);
            setTimeout(r, 420);
        }));
    }
    // 🔴 THIS CLIPPED TO ONE SCREENFUL FOR ITS ENTIRE FIRST DAY, and the gap is the same shape as the one the tool was written to close. It captured { x:0, y:0, width:VW, height:VH } — 888px — so EVERYTHING BELOW THE FOLD had never been compared once, on any realm, at any width, while the report said "17.1% of pixels differ" as though it had read the page. A `--scroll` flag existed to reach further and nothing ever used it. Harkirat spotted broken differences in two seconds in the frames this produced; they were below 888px. Full-page is the DEFAULT now, and `--fold` is the opt-in for the old behaviour when the question is genuinely about what lands above the fold.
    //
    // ⚠️ THE TWO SIDES ARE DIFFERENT HEIGHTS, and that is a finding rather than an obstacle. The canvas subtraction needs one geometry, so both are compared over the SHORTER page and the leftover is reported as its own line — a portal 600px taller than its mockup is a composition difference that a percentage can never express. 🔴 `VH0` HAS TO BE PASSED IN. The first version of these four lines closed over it, and a page.evaluate callback is serialised and run in the BROWSER, where no such binding exists — ReferenceError, swallowed by a .catch I had written myself, falling back to 888. The run then printed "captured mk- 888px · pt- 888px" under a comment claiming full-page capture. A silent fallback on the one line whose failure most needed to be seen. It throws now.
    const full = await page.evaluate((min) => {
        // 🔴 THE HARNESS HAS TWO NESTED `main` ELEMENTS — its own page wrapper and the one the app's Shell renders inside it — so `querySelector('main')` returns the OUTER one, whose scrollHeight is the viewport. Every harness capture was therefore clipped to 888px again, by a different route than the one already fixed today. Take the LARGEST content height of every candidate rather than the first that happens to overflow: a max cannot be fooled by a wrapper, and a wrapper cannot be fooled into reporting more than its content.
        const cands = [...document.querySelectorAll('main'), document.scrollingElement, document.documentElement,
            document.body].filter(Boolean);
        const h = Math.max(min, document.documentElement.scrollHeight,
            ...cands.map((e) => Math.max(e.scrollHeight || 0, e.getBoundingClientRect().bottom || 0)));
        return Math.ceil(h);
    }, VH0);
    const h = (foldOnly || ((openText || hoverText || focusText) && !openFull)) ? VH : Math.min(Math.max(full, VH), 12000);
    if (!foldOnly) {
        // A page whose scroll container is `main` does not grow the window, so `fullPage` alone captures VH. Growing the viewport to the content makes the whole column paint, which is what has to be compared.
        await page.setViewport({ width: VW, height: h, deviceScaleFactor: 1 });
        await page.evaluate(() => new Promise((r) => setTimeout(r, 700)));
    }
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: VW, height: h } });
    fs.writeFileSync(path.join(OUT, shotName(label)), buf);
    SHOT_H[label] = h;
    return buf;
}

// ── the diff itself, done in the browser ───────────────────────────────────────────────────────────── PNG decoding needs a decoder, and adding one to this repo for a single script is the wrong trade when a canvas is already available in the browser this script is driving. Both captures go back in as data URLs, get drawn, and the subtraction happens where the pixels already are.
async function diff(page, mkBuf, ptBuf) {
    // ⚠️ `Buffer.from(...)` IS LOAD-BEARING. Recent puppeteer returns a `Uint8Array` from `screenshot()`, not a Buffer, and `Uint8Array.prototype.toString('base64')` is not an encoder — it ignores the argument and returns the bytes comma-joined as decimal. The result is a syntactically valid data: URL containing garbage, so the failure surfaces as an image `onerror`, which rejects with an Event and prints the wonderfully uninformative `Event: Event`. Cost two runs to find.
    const toUrl = (b) => 'data:image/png;base64,' + Buffer.from(b).toString('base64');
    return page.evaluate(async (mkSrc, ptSrc, cfg) => {
        const load = (src) => new Promise((res, rej) => {
            const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
        });
        const [a, b] = await Promise.all([load(mkSrc), load(ptSrc)]);
        const W = Math.min(a.width, b.width), H = Math.min(a.height, b.height);
        const grab = (img) => {
            const c = document.createElement('canvas'); c.width = W; c.height = H;
            c.getContext('2d').drawImage(img, 0, 0);
            return c.getContext('2d').getImageData(0, 0, W, H).data;
        };
        const A = grab(a), B = grab(b);

        const cols = Math.ceil(W / cfg.CELL), rows = Math.ceil(H / cfg.CELL);
        const hot = new Uint8Array(cols * rows);
        let diffPx = 0;
        for (let cy = 0; cy < rows; cy++) {
            for (let cx = 0; cx < cols; cx++) {
                let n = 0, tot = 0;
                const x1 = Math.min((cx + 1) * cfg.CELL, W), y1 = Math.min((cy + 1) * cfg.CELL, H);
                for (let y = cy * cfg.CELL; y < y1; y++) {
                    for (let x = cx * cfg.CELL; x < x1; x++) {
                        const i = (y * W + x) * 4; tot++;
                        if (Math.abs(A[i] - B[i]) > cfg.CHANNEL_TOL
                            || Math.abs(A[i + 1] - B[i + 1]) > cfg.CHANNEL_TOL
                            || Math.abs(A[i + 2] - B[i + 2]) > cfg.CHANNEL_TOL) n++;
                    }
                }
                diffPx += n;
                if (tot && n / tot >= cfg.CELL_SHARE) hot[cy * cols + cx] = 1;
            }
        }

        // Flood-fill the hot cells into regions. A moved block lights up as one connected mass; two unrelated changes stay two. This is what makes the output a work LIST rather than a heat map.
        const seen = new Uint8Array(cols * rows), regions = [];
        for (let i = 0; i < hot.length; i++) {
            if (!hot[i] || seen[i]) continue;
            const stack = [i]; seen[i] = 1;
            let minx = cols, miny = rows, maxx = -1, maxy = -1, cells = 0;
            while (stack.length) {
                const k = stack.pop(), kx = k % cols, ky = (k / cols) | 0;
                cells++;
                if (kx < minx) minx = kx; if (kx > maxx) maxx = kx;
                if (ky < miny) miny = ky; if (ky > maxy) maxy = ky;
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
                    const nx = kx + dx, ny = ky + dy;
                    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                    const nk = ny * cols + nx;
                    if (hot[nk] && !seen[nk]) { seen[nk] = 1; stack.push(nk); }
                }
            }
            regions.push({
                x: minx * cfg.CELL, y: miny * cfg.CELL,
                w: (maxx - minx + 1) * cfg.CELL, h: (maxy - miny + 1) * cfg.CELL,
                cells, area: cells * cfg.CELL * cfg.CELL,
            });
        }
        regions.sort((p, q) => q.area - p.area);
        return { W, H, diffRatio: diffPx / (W * H), regions: regions.slice(0, 40), regionCount: regions.length };
    }, toUrl(mkBuf), toUrl(ptBuf), { CELL, CHANNEL_TOL, CELL_SHARE });
}

// What is actually AT a region, on each side — because "a 320x180 block differs at (960,140)" is a coordinate and "the mockup has a stat row there, the portal has a countdown" is a finding.
async function label(page, url, regions) {
    await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
    await freezeClock(page);

    // 🔴 EVERY LOAD STARTS FROM A CLEAN SLATE, AND UNTIL 2026-08-30 18:5x EDT NONE OF THEM DID. The mockup persists FIVE pieces of UI state in sessionStorage — `dioreo-identity-open`, `dioreo-board-collapsed`, the lane-collapse map, the staged-ops tray and the export panel's open flag — and this tool reuses ONE page for the mockup shot, the portal shot and the labelling pass. sessionStorage is per-origin and survives navigation inside a tab, so a single `--open` click on any toggle that persists silently changed what every LATER run measured.
    //
    // It was found the long way. `--open-sel ".idsum"` refused with "no visible element ... 1 match the selector but none is rendered (display:none)", about an element `portal:probe` measured at 1160x147 on both sides with every property agreeing, and which a standalone puppeteer replication — plain load, networkidle2, the same 2400ms scroll settle, frozen clock and live clock — reported as `block` with one client rect in all five variants. The measurements disagreed because the FIRST attempt had expanded the identity section and the mockup remembered.
    //
    // ⚠️ THE CONSEQUENCE IS BIGGER THAN ONE REFUSAL. `dioreo-board-collapsed` and the lane-collapse map are persisted the same way, and "Events and Playlists auto-collapsing 20 of 39 Track items" has been carried as a Season defect in the plan's §L. That has to be re-measured from a clean slate before it is trusted as a difference between the two sides at all.
    await page.evaluateOnNewDocument(() => {
        try { sessionStorage.clear(); } catch { /* a sandboxed context can refuse; a clean load is still the default */ }
        try { localStorage.clear(); } catch { /* same */ }
    });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate((y) => new Promise((r) => {
        const cands = [...document.querySelectorAll('main'), document.scrollingElement, document.documentElement];
        const el = cands.filter(Boolean).sort((a, b) => (b.scrollHeight || 0) - (a.scrollHeight || 0))
            .find((e) => e.scrollHeight > e.clientHeight + 4);
        if (el) el.scrollTop = y; else window.scrollTo(0, y);
        setTimeout(r, 2400);
    }), scrollY);
    await enterView(page, url.includes('8900') ? 'MOCKUP' : 'PORTAL');
    await openOverlay(page, url.includes('8900') ? 'MOCKUP' : 'PORTAL');
    // The same growth shoot() applied. Without it elementsFromPoint is asked about y=2400 on a page that ends at 888 and answers with whatever is nearest — a confident name for the wrong element.
    if (!foldOnly) {
        const h = SHOT_H[url.includes('8900') ? 'mk' : 'pt'] || VH;
        await page.setViewport({ width: VW, height: h, deviceScaleFactor: 1 });
        await page.evaluate(() => new Promise((r) => setTimeout(r, 700)));
    }
    return page.evaluate((rs) => rs.map((r) => {
        const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        const els = document.elementsFromPoint(Math.min(cx, innerWidth - 2), Math.min(cy, innerHeight - 2));
        const el = els.find((e) => e !== document.body && e !== document.documentElement) || null;
        const name = (e) => e ? (e.tagName.toLowerCase() + (e.className && typeof e.className === 'string'
            ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) : '—';
        return {
            at: name(el),
            in: name(el && el.closest('section,.panel,.masthead,.ph,header,nav')),
            text: (el && (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 54)) || '',
        };
    }), regions);
}

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const { findChrome, CHROME_CANDIDATES } = require('./lib/chromePath.cjs');
    const chrome = findChrome();
    if (!chrome) { console.error('No Chrome found. Tried:\n  ' + CHROME_CANDIDATES.join('\n  ')); process.exit(2); }
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        if (portalMode !== 'harness' && !selfTest) {
            const sess = await mintSession(flag('--as', null));
            if (sess) {
                await browser.setCookie({ name: 'portal_session', value: sess.raw,
                    domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' });
                console.log(`  signed in as ${sess.who} (a session minted in dev Mongo for this run)`);
            }
        }
        const mk = await shoot(page, mockupUrl, 'mk');
        const pt = await shoot(page, portalUrl, 'pt');
        // ⚠️ THE SUBTRACTION HAPPENS ON A BLANK PAGE, NOT ON THE ONE JUST CAPTURED. Loading a data: URL into whichever page happened to be open puts the diff at the mercy of that page's CSP — the first run rejected with a bare `Event: Event`, which is an image onerror and reads like nothing. A blank page has no policy to trip over and no relationship to either subject.
        const scratch = await browser.newPage();
        await scratch.goto('about:blank');
        const d = await diff(scratch, mk, pt);
        const mkAt = await label(page, mockupUrl, d.regions);
        const ptAt = await label(page, portalUrl, d.regions);

        if (asJson) {
            console.log(JSON.stringify({ realm, view, viewport: `${VW}x${VH}`, scrollY, portalMode, ...d,
                regions: d.regions.map((r, i) => ({ ...r, mk: mkAt[i], pt: ptAt[i] })) }, null, 1));
        } else {
            const pct = (d.diffRatio * 100).toFixed(1);
            console.log(`\nportal:diff — ${realm}${view ? ' · ' + view : ''} @ ${VW}x${VH}${scrollY ? ` scrolled ${scrollY}` : ''}  ·  portal = ${portalMode}`);
            if (OFF_CONTRACT) console.log('  ⚠️  OFF-CONTRACT viewport — the fixtures and every other instrument are baked to 1282x888. This reading is not comparable to theirs.');
            if (portalMode === 'harness') console.log('  ⚠️  harness: both sides are fixture-driven, so they can agree with each other and disagree with production.');
            console.log(`  captured mk- ${SHOT_H.mk}px · pt- ${SHOT_H.pt}px${foldOnly ? '  (--fold: ONE SCREENFUL, everything below is uncompared)' : ''}`
                + (SHOT_H.mk !== SHOT_H.pt ? `  ·  🔴 the portal is ${SHOT_H.pt - SHOT_H.mk > 0 ? SHOT_H.pt - SHOT_H.mk + 'px TALLER' : SHOT_H.mk - SHOT_H.pt + 'px SHORTER'} — compared over the shorter of the two` : ''));
            console.log(`  mk- ${path.relative(ROOT, path.join(OUT, shotName('mk')))}`);
            console.log(`  pt- ${path.relative(ROOT, path.join(OUT, shotName('pt')))}`);
            console.log(`\n  ${pct}% of pixels differ, in ${d.regionCount} region(s). Largest first:\n`);
            d.regions.slice(0, 14).forEach((r, i) => {
                console.log(`  ${String(i + 1).padStart(2)}. ${String(r.w).padStart(4)}x${String(r.h).padStart(3)} at (${r.x},${r.y})`);
                console.log(`      mk- ${mkAt[i].at}  ${mkAt[i].text ? '“' + mkAt[i].text + '”' : ''}`);
                console.log(`      pt- ${ptAt[i].at}  ${ptAt[i].text ? '“' + ptAt[i].text + '”' : ''}`);
            });
            console.log('\n  not covered by this run: ' + COVERAGE_NOTE.join('\n' + ' '.repeat(22)) + '\n');
            // 🔴 THIS SENTENCE WAS PRINTED UNCONDITIONALLY, AFTER TRUNCATING TO 14 REGIONS, AND IT READ AS A VERIFIED CLAIM. It is a string literal: this tool has never read the ledger and cannot know whether any region is cited. On every realm but Review it asserted closure over regions it had not shown anyone — season 121 hidden, armory 879, access 42, analytics 27, home 12. §0.7d makes the ENUMERATION the close condition, so the close was being discharged by boilerplate. Found by the §L ⑥ agent, 2026-09-03 23:19 EDT.
            const hidden = d.regionCount - Math.min(14, d.regionCount);
            if (hidden > 0) {
                console.log(`\n  ⚠️  ${hidden} of ${d.regionCount} regions were NOT printed — this tool lists the largest 14.`);
                console.log('  The close condition is the ENUMERATION, so a realm is not closed on what you can see here.');
                console.log('  Use --json for every region.');
            }
            console.log('\n  A region is not a defect by itself — real data, portal-ahead surfaces and fixture gaps all');
            console.log('  land here. Adjudicate each against the Part\'s difference ledger; this tool does not read it');
            console.log('  and cannot tell you whether anything here is cited.\n');
        }
        if (selfTest) {
            const ok = d.diffRatio < 0.001 && d.regionCount === 0;
            console.log(`\n  SELF-TEST: the mockup against itself — ${(d.diffRatio * 100).toFixed(3)}% of pixels, ${d.regionCount} region(s).`);
            console.log(ok
                ? '  ✅ empty, as identical input must be. The cell size and tolerances are not manufacturing regions.'
                : '  ❌ NOT EMPTY. Identical input produced regions, so this is reporting noise and every region list\n     it has printed is suspect. Widen CHANGE_TOL / CELL_SHARE until this comes back clean.');
            if (!ok) process.exitCode = 1;
        }
        recordRun('diff', realm);
    } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
