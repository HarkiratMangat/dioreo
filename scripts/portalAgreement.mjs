#!/usr/bin/env node
// scripts/portalAgreement.mjs — do two surfaces reporting the same collection agree?
//
// 🔴 THE CLASS NO EXISTING INSTRUMENT CAN SEE, named in the conformance plan 2026-09-03 22:33 EDT. `portal:realwalk` walks one realm's views; `portal:reviewwalk` drives the commit path; `portal:coverage` and `portal:orphans` scan SOURCE and never execute it; the diff and the audit compare a page against its mockup, never a page against another page. **A number that lies identically on both sides passes every one of them.** Five realms were conformed as SURFACES and nothing had ever checked that two surfaces reporting the same collection agree.
//
// It was checked once, by accident, when `--triggers` printed both sides' rows in full: **Home said 66 builds need repair, Armory's own masthead said 60, and the design says 13.** One question, three answers.
//
// ⚠️ WHAT IT ASSERTS, and it is deliberately narrow: two rendered figures carrying the SAME LABEL on two different realms must carry the same VALUE. It does not know what a label means, cannot tell a legitimately-scoped figure from a global one, and says so — a realm whose figure is scoped on purpose belongs in SCOPED below, by name, with the reason. That list is the honest cost of the check and is meant to stay short.
//
// ⚠️ IT READS THE HARNESS, not the real server: fixtures make it deterministic, and a disagreement between two surfaces over the SAME fixture is a derivation defect rather than a data one. A real-server run would also be worth having and is not this.
import fs from 'fs';
import http from 'http';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'portal', 'public');
const REALMS = ['season', 'armory', 'broadcast', 'access', 'analytics', 'review', 'home'];
const VIEWPORT = { w: 1282, h: 888 };

// A figure that is scoped on purpose, and why. Each entry is a claim somebody has to defend; an empty list would make this gate loud and useless, and a long one would make it vacuous.
const SCOPED = {
    // Broadcast's masthead counts what THIS realm has staged (`broadcast.js`'s `stagedHere`), while Home and Season count everything waiting. Both are correct and they are not the same question.
    staged: 'Broadcast and Armory scope "staged" to their own realm; Home, Season and the rail count every changeset.',
    // 🔴 FOUND BY THIS GATE ON ITS FIRST WORKING RUN, 2026-09-04 20:56 EDT: season=20, home=2. Both are correct and both match the design. Season's eyebrow counts LIVE SEASON ITEMS; Home counts LIVE ANNOUNCEMENTS, which is what `index.html:207`'s own `liveAnns().length` counts. **It is one label over two questions — the copy audit's vocabulary class — and it is the DESIGN's wording on both sides**, so §0.1a says reproduce it and file it rather than correct it mid-pass. Filed in `docs/db-deferred-list.md`. ⚠️ This entry is the honest cost of that: the gate is quiet about a genuine ambiguity because the ambiguity is approved, and the entry is where a reader learns it was seen rather than missed.
    'live now': 'Season counts live SEASON ITEMS; Home counts live ANNOUNCEMENTS (index.html:207). One label, two questions — the design\'s own, filed as a post-conformance copy fix.',
};

export function disagreements(rows, scoped = SCOPED) {
    const byLabel = {};
    for (const r of rows) (byLabel[r.label] = byLabel[r.label] || []).push(r);
    const out = [];
    for (const [label, list] of Object.entries(byLabel)) {
        if (list.length < 2) continue;
        const values = [...new Set(list.map((r) => String(r.value)))];
        if (values.length < 2) continue;
        out.push({ label, values, realms: list.map((r) => `${r.realm}=${r.value}`), scoped: scoped[label] || null });
    }
    return out;
}

function serve() {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
    const server = http.createServer((req, res) => {
        const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'harness.html';
        const file = path.join(PUBLIC, rel);
        if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store, must-revalidate' });
        res.end(fs.readFileSync(file));
    });
    return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}

// 🔴 THREE SHAPES, NOT ONE, AND THE FIRST VERSION READ ONLY THE FIRST — which reported **season: 0 figures** and still printed a green tick. A gate that finds nothing on a page it never read is the vacuous pass this repo keeps paying for, so the shapes are enumerated and the per-realm figure count is printed beside the timing, where a zero is visible rather than folded into a total.
//   · `.stat`        — every realm's masthead cluster.
//   · `.mh-eyebrow`  — SEASON ONLY, and the reason is a design decision already made: COMPANION §16.31 sends
//                      LIVE NOW / STAGED / FLAGS up to an eyebrow and deletes the stat block, so Season's figures
//                      are simply not `.stat`s. A tool that knows only `.stat` cannot see the one realm that
//                      followed the design.
//   · `.att-row`     — Home's attention rows, which carry `N of M` in `.att-sev`. This is where the measured
//                      disagreement actually lived: Home said 66 builds need repair and Armory's masthead said 60.
const READ = function () {
    const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const num = (s) => /^[\d.,]+$/.test(String(s || '').trim());
    const out = [];
    for (const el of document.querySelectorAll('main .stat, header .stat')) {
        const label = norm((el.querySelector('.k') || {}).textContent);
        const value = norm((el.querySelector('.v') || {}).textContent);
        if (label && num(value)) out.push({ label, value, from: 'stat' });
    }
    for (const el of document.querySelectorAll('.mh-eyebrow > span')) {
        const i = el.querySelector('i');
        if (!i) continue;
        const label = norm(el.textContent.replace(i.textContent, ''));
        const value = norm(i.textContent);
        if (label && num(value)) out.push({ label, value, from: 'eyebrow' });
    }
    for (const el of document.querySelectorAll('.att-row')) {
        const sev = el.querySelector('.att-sev');
        const text = norm((el.querySelector('.att-x b') || {}).textContent);
        if (!sev || !text) continue;
        const m = /^([\d.,]+) of ([\d.,]+)$/.exec(norm(sev.textContent));
        if (!m) continue;
        // The row's own sentence is the question, with its figures stripped so "60 builds need repair" and "13 builds need repair" are one label rather than two.
        out.push({ label: text.replace(/[\d.,]+/g, '').replace(/\s+/g, ' ').trim(), value: m[1], of: m[2], from: 'attention' });
    }
    return out;
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    // 🔴 THE FALSIFIER RUNS FIRST. A cross-surface gate that reports nothing is indistinguishable from a portal that agrees with itself, and this repo has three memories about exactly that. A seeded disagreement must fail.
    const planted = disagreements([
        { realm: 'home', label: 'need repair', value: 66 },
        { realm: 'armory', label: 'need repair', value: 60 },
    ], {});
    const quiet = disagreements([
        { realm: 'home', label: 'need repair', value: 60 },
        { realm: 'armory', label: 'need repair', value: 60 },
    ], {});
    if (planted.length !== 1 || quiet.length !== 0) {
        console.log(`\n❌ portal:agreement is VACUOUS — planted ${planted.length} (want 1), agreeing ${quiet.length} (want 0).\n`);
        process.exit(1);
    }
    console.log('\nportal:agreement — a seeded disagreement fails, and two agreeing figures do not\n');

    const { findChrome } = require('./lib/chromePath.cjs');
    const puppeteer = require('puppeteer-core');
    const { server, port } = await serve();
    const browser = await puppeteer.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
    const rows = [];
    const timings = [];
    try {
        for (const realm of REALMS) {
            const page = await browser.newPage();
            await page.setViewport({ width: VIEWPORT.w, height: VIEWPORT.h });
            const t0 = Date.now();
            await page.goto(`http://127.0.0.1:${port}/harness.html?b=${Date.now()}#/${realm}`, { waitUntil: 'load' });
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(() => new Promise((r) => setTimeout(r, 2600)));
            const ms = Date.now() - t0;
            const got = await page.evaluate(READ);
            timings.push({ realm, ms, figures: got.length });
            for (const g of got) rows.push({ realm, ...g });
            await page.close();
        }
    } finally {
        await browser.close();
        server.close();
    }

    console.log('  realm         load   figures');
    for (const t of timings) console.log(`  ${t.realm.padEnd(12)} ${String(t.ms).padStart(5)}ms ${String(t.figures).padStart(6)}`);

    const bad = disagreements(rows).filter((d) => !d.scoped);
    const excused = disagreements(rows).filter((d) => d.scoped);
    if (excused.length) {
        console.log('\n  Scoped on purpose, and each says why:');
        for (const d of excused) console.log(`    · ${d.label}: ${d.realms.join(' ')} — ${d.scoped}`);
    }
    if (!bad.length) {
        console.log(`\n  ✅ ${rows.length} figure(s) across ${REALMS.length} realms; no two surfaces answer one question differently.`);
        console.log('  ⚠️ It compares figures that share a LABEL. Two surfaces asking the same question in different words');
        console.log('     are invisible to it, and so is a figure that is wrong on every surface at once.\n');
        process.exit(0);
    }
    console.log('');
    for (const d of bad) console.log(`  ❌ "${d.label}" — ${d.realms.join('  ')}`);
    console.log(`\n  ${bad.length} question(s) with more than one answer. Read each realm's own derivation; do not`);
    console.log('  reconcile by copying one figure into the other, which is how the first Home/Armory pair diverged.\n');
    process.exit(1);
}
