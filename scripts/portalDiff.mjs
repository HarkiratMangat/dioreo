#!/usr/bin/env node
// scripts/portalDiff.mjs — THE INSTRUMENT THE CONFORMANCE PASS WAS MISSING FOR TWO PARTS.
//
// 🔴 WHY THIS EXISTS, stated bluntly because the reason is an indictment of everything beside it.
// The acceptance test for this whole project is one sentence: "I should not be able to see a difference
// between the mockup's season realm and the live portal's season realm." Harkirat ran that test on
// 2026-08-28 15:33 EDT by putting two screenshots side by side, and it took him about two seconds to find four
// composition defects that a 130-turn Part had just declared closed.
//
// Every instrument the plan mandated is an ELEMENT SCANNER. `portal:orphans` asks whether a class has a
// rule. `portalReverseOrphans` asks the inverse. The structural inventory diff compares headings, tabs and
// column headers. `portalStates` walks states. `__grid` measures boxes. Every one of them answers
// "which elements exist, and are they well-formed" — and a page with all the right elements in the wrong
// arrangement passes all five. That is exactly what shipped: the same nouns, a different page.
//
// The plan's §0 diagnoses that the repo's gates are element scanners which cannot see the real defects,
// and then prescribes four more element scanners. This file is the missing kind: it does not enumerate
// anything. It renders both pages and subtracts them.
//
// 🔴 THE MOCKUP IS NOT A SPECIFICATION TO BE READ. IT IS A PROGRAM THAT RENDERS. Two programs drawing the
// same season should produce nearly the same pixels, and where they do not IS the work list — produced
// before anyone has an opinion about which elements are worth enumerating, ranked by how much of the page
// each disagreement occupies, which is the same order a human eye finds them in.
//
// ⚠️ IT WILL NEVER REACH ZERO, AND A THRESHOLD THAT DEMANDS ZERO WOULD BE ABANDONED IN A DAY. The portal
// runs on real data against a fixture, carries surfaces the mockup lacks, and is deliberately ahead in
// places with citations to prove it. So this reports REGIONS, not a score to chase: every region is either
// closed or written into the Part's difference ledger with a citation. What changes is that the candidate
// list is now generated rather than remembered — the failure mode of an authored ledger is the difference
// its author could not see, which is precisely the failure this replaces.
//
// USAGE
//   node scripts/portalDiff.mjs --realm season                    capture, diff, report, write PNGs
//   node scripts/portalDiff.mjs --realm season --scroll 900       same, at a scroll offset
//   node scripts/portalDiff.mjs --realm season --json             machine-readable region list
//
// OUTPUT  local/diff-<realm>/mk-<realm>.png · pt-<realm>.png · delta-<realm>.png
//   `mk-` is the MOCKUP and `pt-` is the PORTAL, in the filename and in every line this prints, because
//   "is that the mockup or the portal?" has had to be asked out loud before.
//
// ⚠️ THE PORTAL SIDE IS THE REAL SERVER BY DEFAULT, NOT THE HARNESS. The harness stubs its data and the
// mockup is fixture-driven by construction, so those two agree with each other and can both disagree with
// production — which is what happened with the overview strip, dense in the mockup and 37 marks pinned to
// their 3px floor against real data. `--portal harness` is available and is the weaker comparison; it says
// so in the header of its own report.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const MOCKUP = 'http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive';
const PORTAL_REAL = 'http://localhost:8787';
const PORTAL_HARNESS = 'http://localhost:8901/harness.html';

// The viewport contract, from the plan's §0.3: his window is 1282x920 with 32px of browser chrome.
const VW = 1282, VH = 888;

// A cell is coarse on purpose. Pixel-exact differences are noise — antialiasing, a 1px rounding between
// two layers, a font hinting difference. What matters is REGIONS: a block that moved, a panel that is the
// wrong ground, a control that is not there. 16px cells cluster naturally into those and never into dust.
const CELL = 16;
// A cell counts as different when this share of its pixels differ by more than the channel tolerance.
// Both numbers were picked by running the tool against the mockup versus ITSELF (which must report zero)
// and against the known-different portal, and widening until the first stayed empty.
const CHANNEL_TOL = 24, CELL_SHARE = 0.06;

const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? true) : d; };
const realm = flag('--realm', 'season');
const scrollY = Number(flag('--scroll', 0)) || 0;
const asJson = args.includes('--json');
const portalMode = flag('--portal', 'real');

const OUT = path.join(ROOT, 'local', `diff-${realm}`);

// ── the two URLs, and the one difference in how each is reached ──────────────────────────────────────
// The mockup is one HTML file per realm. The portal is an SPA addressed by hash. A realm the mockup does
// not have (there is no `home.html`; index.html is Home) is named here rather than guessed at.
const MOCKUP_PAGE = { home: 'index.html' }[realm] || `${realm}.html`;
const mockupUrl = `${MOCKUP}/${MOCKUP_PAGE}`;
const portalUrl = portalMode === 'harness'
    ? `${PORTAL_HARNESS}?b=${Date.now()}#/${realm}`
    : `${PORTAL_REAL}/?b=${Date.now()}#/${realm}`;

// ── SIGNING THE DIFF IN ─────────────────────────────────────────────────────────────────────────────
//
// 🔴 THE FIRST RUN OF THIS TOOL DIFFED A LOGIN PAGE AND REPORTED 11.9% ACROSS TWELVE REGIONS, and every
// one of them was noise. Puppeteer launches a clean profile, so the real portal answers with the door —
// and the report looked exactly like a real finding: percentages, ranked regions, element names. That is
// the whole failure mode this file was written to end, reproduced by the file itself on its first run.
//
// Two answers, and it needs both. It MINTS a session against dev Mongo so it can see the realm at all,
// and it REFUSES to report if the portal side is still the door — because a diff that silently compares
// the wrong page is worse than no diff, and this one had already proved it can happen.
//
// ⚠️ DEV MONGO ONLY, asserted rather than assumed. It reads the URI out of `.env.dev` by hand (the same
// grep-do-not-source reasoning as backupDb.sh and portSeasonalToLocal.mjs) and refuses anything that is
// not localhost. A diff tool that can write a session into the production database is not a diff tool.
async function mintSession(discordId) {
    const envPath = path.join(ROOT, '.env.dev');
    if (!fs.existsSync(envPath)) return null;
    const line = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).find((l) => l.trimStart().startsWith('MONGODB_URI='));
    const uri = line ? line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : '';
    if (!uri) return null;
    if (!/mongodb:\/\/(localhost|127\.0\.0\.1)/.test(uri)) {
        throw new Error(`portal:diff refuses to mint a session against a non-local database: ${uri.replace(/\/\/.*@/, '//***@')}`);
    }
    const mongoose = require('mongoose');
    await mongoose.connect(uri);
    const PortalSession = require(path.join(ROOT, 'models/PortalSession'));
    const AdminUser = require(path.join(ROOT, 'models/AdminUser'));
    // Whoever the dev database already trusts. Inventing an id would mint a session for a person the
    // permission model does not know, and the page would render the forbidden state instead of the realm.
    const who = discordId || (await AdminUser.findOne({}).lean())?.discordId;
    if (!who) { await mongoose.disconnect(); return null; }
    const raw = crypto.randomBytes(32).toString('hex');
    await PortalSession.create({
        sessionHash: crypto.createHash('sha256').update(raw).digest('hex'),
        discordId: who,
        userAgent: 'portal:diff (scripts/portalDiff.mjs)',
    });
    await mongoose.disconnect();
    return { raw, who };
}

async function shoot(page, url, label) {
    await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    // 🔴 NEVER rAF — it does not fire in a background tab and a pass gated on it waits forever. This is
    // the same trap portalStates.mjs records; `document.fonts.ready` resolves regardless of visibility.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('main', { timeout: 20000 });
    // The SPA has to route, fetch and settle. The mockup only has to lay out. One wait covers both.
    // 🔴 SCROLL THE CONTAINER, NOT THE WINDOW — a trap this repo had already written down and this tool
    // walked into anyway on its first day: "main is the portal's scroll container, so window.scrollY can
    // never show a portal scroll bug." The mockup scrolls its document; the portal scrolls `main`. Scroll
    // whichever actually overflows, on both sides, or `--scroll` silently reports the top of the page
    // twice and every region below the fold stays invisible.
    await page.evaluate((y) => new Promise((r) => {
        const el = [document.querySelector('main'), document.scrollingElement, document.documentElement]
            .find((e) => e && e.scrollHeight > e.clientHeight + 4);
        if (el) el.scrollTop = y; else window.scrollTo(0, y);
        setTimeout(r, 2600);
    }), scrollY);
    // ⚠️ ANIMATION IS STOPPED BEFORE THE SHUTTER, not tolerated after it. An entrance animation mid-flight
    // renders a different frame on each run, and a diff whose own output moves between runs is a diff
    // nobody will trust twice. Reduced motion is emulated AND transitions are zeroed, on both sides
    // identically — so the comparison is of the settled page, which is the thing being designed.
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 260)));
    const door = await page.evaluate(() => !!document.querySelector('main.door'));
    if (door) {
        throw new Error(`portal:diff refuses to report: ${url} is showing the DOOR, not the realm.\n`
            + '  A diff of a login page produces percentages and ranked regions that look exactly like findings.\n'
            + '  Either the dev portal is not running with --env-file=.env.dev, or no admin exists in dev Mongo\n'
            + '  for a session to be minted against.');
    }
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: VW, height: VH } });
    fs.writeFileSync(path.join(OUT, `${label}-${realm}.png`), buf);
    return buf;
}

// ── the diff itself, done in the browser ─────────────────────────────────────────────────────────────
// PNG decoding needs a decoder, and adding one to this repo for a single script is the wrong trade when a
// canvas is already available in the browser this script is driving. Both captures go back in as data
// URLs, get drawn, and the subtraction happens where the pixels already are.
async function diff(page, mkBuf, ptBuf) {
    // ⚠️ `Buffer.from(...)` IS LOAD-BEARING. Recent puppeteer returns a `Uint8Array` from `screenshot()`,
    // not a Buffer, and `Uint8Array.prototype.toString('base64')` is not an encoder — it ignores the
    // argument and returns the bytes comma-joined as decimal. The result is a syntactically valid data:
    // URL containing garbage, so the failure surfaces as an image `onerror`, which rejects with an Event
    // and prints the wonderfully uninformative `Event: Event`. Cost two runs to find.
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

        // Flood-fill the hot cells into regions. A moved block lights up as one connected mass; two
        // unrelated changes stay two. This is what makes the output a work LIST rather than a heat map.
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

// What is actually AT a region, on each side — because "a 320x180 block differs at (960,140)" is a
// coordinate and "the mockup has a stat row there, the portal has a countdown" is a finding.
async function label(page, url, regions) {
    await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate((y) => new Promise((r) => {
        const el = [document.querySelector('main'), document.scrollingElement, document.documentElement]
            .find((e) => e && e.scrollHeight > e.clientHeight + 4);
        if (el) el.scrollTop = y; else window.scrollTo(0, y);
        setTimeout(r, 2400);
    }), scrollY);
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
        if (portalMode !== 'harness') {
            const sess = await mintSession(flag('--as', null));
            if (sess) {
                await browser.setCookie({ name: 'portal_session', value: sess.raw,
                    domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' });
                console.log(`  signed in as ${sess.who} (a session minted in dev Mongo for this run)`);
            }
        }
        const mk = await shoot(page, mockupUrl, 'mk');
        const pt = await shoot(page, portalUrl, 'pt');
        // ⚠️ THE SUBTRACTION HAPPENS ON A BLANK PAGE, NOT ON THE ONE JUST CAPTURED. Loading a data: URL
        // into whichever page happened to be open puts the diff at the mercy of that page's CSP — the
        // first run rejected with a bare `Event: Event`, which is an image onerror and reads like nothing.
        // A blank page has no policy to trip over and no relationship to either subject.
        const scratch = await browser.newPage();
        await scratch.goto('about:blank');
        const d = await diff(scratch, mk, pt);
        const mkAt = await label(page, mockupUrl, d.regions);
        const ptAt = await label(page, portalUrl, d.regions);

        if (asJson) {
            console.log(JSON.stringify({ realm, scrollY, portalMode, ...d,
                regions: d.regions.map((r, i) => ({ ...r, mk: mkAt[i], pt: ptAt[i] })) }, null, 1));
        } else {
            const pct = (d.diffRatio * 100).toFixed(1);
            console.log(`\nportal:diff — ${realm} @ ${VW}x${VH}${scrollY ? ` scrolled ${scrollY}` : ''}  ·  portal = ${portalMode}`);
            if (portalMode === 'harness') console.log('  ⚠️  harness: both sides are fixture-driven, so they can agree with each other and disagree with production.');
            console.log(`  mk- ${path.relative(ROOT, path.join(OUT, `mk-${realm}.png`))}`);
            console.log(`  pt- ${path.relative(ROOT, path.join(OUT, `pt-${realm}.png`))}`);
            console.log(`\n  ${pct}% of pixels differ, in ${d.regionCount} region(s). Largest first:\n`);
            d.regions.slice(0, 14).forEach((r, i) => {
                console.log(`  ${String(i + 1).padStart(2)}. ${String(r.w).padStart(4)}x${String(r.h).padStart(3)} at (${r.x},${r.y})`);
                console.log(`      mk- ${mkAt[i].at}  ${mkAt[i].text ? '“' + mkAt[i].text + '”' : ''}`);
                console.log(`      pt- ${ptAt[i].at}  ${ptAt[i].text ? '“' + ptAt[i].text + '”' : ''}`);
            });
            console.log('\n  Every region is CLOSED or CITED in the Part\'s difference ledger. A region is not');
            console.log('  a defect by itself — real data, portal-ahead surfaces and fixture gaps all land here.\n');
        }
    } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
