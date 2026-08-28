// scripts/portalGeometry.mjs — the per-realm GEOMETRY FIXTURE: record a realm's shape, then fail when it moves.
//
// 🔴 IT EXISTS BECAUSE SIX REALMS SHARE ONE STYLESHEET. `shell.js`, `app.css`, `async.js`, `manifest.js`, `exportPanel.js`, `tips.js`, `overlay.js` and `composer.js` are inherited by every surface, so a fix made while working on Analytics lands in the sheet Season was signed off against — which is how a `.lvlbars` block written 2,400 lines above an existing one restyled charts three realms away while every gate in the suite passed. When a Part closes it records its counts here; a later Part that touches a shared surface re-runs the closed realms IN THE SAME COMMIT.
//
// ⚠️ A FIXTURE OF COUNTS CATCHES MOVEMENT, NOT WRONGNESS. Two compensating changes keep every number identical, and a realm can be perfectly stable and perfectly ugly. It is a smoke alarm, not a proof — the A/B artifact and the difference ledger are what say whether the surface is RIGHT.
//
// ⚠️ AND `__grid` REPORTS GEOMETRY, NOT IDENTITY: two elements can be exactly on-grid and be the wrong two. That is why the inventory travels beside the counts — h1, view tabs, column headers, section headings — so a renamed tab or a vanished column fails even when nothing moved a pixel.
//
//   node scripts/portalGeometry.mjs --realm season --write     record
//   node scripts/portalGeometry.mjs --realm season --check     re-run and diff; non-zero on any movement
//   node scripts/portalGeometry.mjs --all --check              every fixture recorded so far
//
// Measured through the HARNESS (fixtures, no Mongo, no OAuth), at the 1282x888 viewport contract, serving `portal/public` from an ephemeral port of its own so a forgotten dev server can neither help nor break it.
import fs from 'fs';
import http from 'http';
import path from 'path';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'portal', 'public');
const FIXTURES = path.join(ROOT, 'portal', 'fixtures', 'geometry');
const VIEWPORT = { w: 1282, h: 888 };                                                    // §0.3, the same numbers `__grid.viewport()` asserts against
const REALMS = ['season', 'armory', 'broadcast', 'access', 'analytics', 'review', 'home'];

// ─────────────────────────────────────────────────────────────────────────────
// The comparison. Pure, exported, and unit-tested without a browser — the half most likely to be quietly wrong is the diff, not the capture.
// ─────────────────────────────────────────────────────────────────────────────
export function compare(before, after) {
    const moved = [];
    const views = new Set([...Object.keys(before.views || {}), ...Object.keys(after.views || {})]);
    for (const v of views) {
        const b = (before.views || {})[v], a = (after.views || {})[v];
        if (!b) { moved.push({ view: v, what: 'view', was: '—', now: 'present' }); continue; }
        if (!a) { moved.push({ view: v, what: 'view', was: 'present', now: '— gone' }); continue; }
        for (const k of ['examined', 'nearMisses', 'sizeIssues']) {
            if (b.grid[k] !== a.grid[k]) moved.push({ view: v, what: k, was: b.grid[k], now: a.grid[k] });
        }
        for (const k of ['h1', 'tabs', 'cols', 'sections']) {
            const s = (x) => (Array.isArray(x) ? x.join(' · ') : String(x ?? ''));
            if (s(b.inventory[k]) !== s(a.inventory[k])) moved.push({ view: v, what: k, was: s(b.inventory[k]), now: s(a.inventory[k]) });
        }
    }
    return moved;
}

// ─────────────────────────────────────────────────────────────────────────────
// The capture.
// ─────────────────────────────────────────────────────────────────────────────
function serve() {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
    const server = http.createServer((req, res) => {
        const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'harness.html';
        const file = path.join(PUBLIC, rel);
        if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
        // no-store, for the reason `.serve.py` records: a cached fixtures.js made several verification runs measure yesterday's assets and read as bugs.
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store, must-revalidate' });
        res.end(fs.readFileSync(file));
    });
    return new Promise((res) => server.listen(0, '127.0.0.1', () => res({ server, port: server.address().port })));
}

async function capture(realm, browser, port) {
    const page = await browser.newPage();
    await page.setViewport({ width: VIEWPORT.w, height: VIEWPORT.h });
    await page.goto(`http://127.0.0.1:${port}/harness.html?b=${Date.now()}#/${realm}`, { waitUntil: 'load' });
    // 🔴 NOT rAF: it never fires in a background tab or an off-screen frame, and a pass gated on it reports `pending` forever. `document.fonts.ready` resolves regardless of visibility, and fonts are exactly what the geometry depends on.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('main h1, main .ph', { timeout: 15000 });

    const views = {};
    const tabNames = await page.evaluate(() => [...document.querySelectorAll('main [role="tab"]:not([data-arm])')].map((b) => b.textContent.trim()));
    const labels = tabNames.length ? tabNames : ['(single view)'];
    for (const label of labels) {
        if (tabNames.length) {
            await page.evaluate((l) => {
                const b = [...document.querySelectorAll('main [role="tab"]:not([data-arm])')].find((x) => x.textContent.trim() === l);
                if (b) b.click();
            }, label);
            await page.evaluate(() => new Promise((r) => setTimeout(r, 120)));            // one paint plus the transitions the design actually uses; the measurement is of the settled view, not the animating one
        }
        views[label] = await page.evaluate(() => {
            const g = window.__grid.all();
            const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
            return {
                grid: { examined: g.examined, nearMisses: g.nearMisses, sizeIssues: g.sizeIssues },
                viewport: g.viewport,
                inventory: {
                    h1: txt(document.querySelector('main h1')),
                    tabs: [...document.querySelectorAll('main [role="tab"]')].map((b) => b.textContent.trim()),
                    cols: [...document.querySelectorAll('main th')].map((t) => txt(t)),
                    sections: [...document.querySelectorAll('main h2, main h3')].map((s) => txt(s)),
                },
            };
        });
    }
    await page.close();

    const off = Object.values(views).find((v) => v.viewport && !v.viewport.onContract);
    if (off) throw new Error(`measured off the viewport contract: ${off.viewport.warning}`);

    return {
        realm,
        recordedAt: new Date().toISOString(),
        commit: (() => { try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return 'unknown'; } })(),
        viewport: { w: VIEWPORT.w, h: VIEWPORT.h },
        views: Object.fromEntries(Object.entries(views).map(([k, v]) => [k, { grid: v.grid, inventory: v.inventory }])),
    };
}

async function run() {
    const args = process.argv.slice(2);
    const flag = (n) => args.includes(n);
    const value = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
    const wanted = flag('--all') ? null : value('--realm');
    if (!wanted && !flag('--all')) {
        console.log('usage: node scripts/portalGeometry.mjs (--realm <name> | --all) [--write | --check]');
        console.log(`realms: ${REALMS.join(', ')}`);
        process.exit(2);
    }
    if (wanted && !REALMS.includes(wanted)) { console.log(`unknown realm "${wanted}" — one of: ${REALMS.join(', ')}`); process.exit(2); }

    fs.mkdirSync(FIXTURES, { recursive: true });
    const recorded = fs.readdirSync(FIXTURES).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
    const targets = wanted ? [wanted] : (flag('--write') ? REALMS : recorded);

    if (!targets.length) {
        // Part 0 builds this runner before any realm has closed, so an empty fixture directory is the CORRECT state and must not read as a failure — but it must not read as a verified one either.
        console.log('portal:geometry — no fixtures recorded yet. A realm records its own when its Part closes.');
        return;
    }

    const { findChrome, CHROME_CANDIDATES } = require('./lib/chromePath.cjs');
    const chrome = findChrome();
    if (!chrome) {
        console.error('  ⚠ SKIPPED — no Chrome found. Tried:\n      ' + CHROME_CANDIDATES.join('\n      '));
        console.error('    Set PUPPETEER_EXECUTABLE_PATH to run this check. NOT a pass.');
        process.exit(0);
    }

    const { build } = require('./buildPortal.js');
    build();                                                                              // measure what portal/ui says NOW, never a stale portal/public
    const { server, port } = await serve();
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox'] });
    let bad = false;
    try {
        for (const realm of targets) {
            const now = await capture(realm, browser, port);
            const file = path.join(FIXTURES, `${realm}.json`);
            const totals = Object.entries(now.views).map(([v, d]) => `${v} ${d.grid.examined}/${d.grid.nearMisses}/${d.grid.sizeIssues}`).join('  ·  ');
            console.log(`${realm.padEnd(10)} ${Object.keys(now.views).length} view(s)   examined/near/size — ${totals}`);

            if (flag('--write')) { fs.writeFileSync(file, JSON.stringify(now, null, 2) + '\n'); console.log(`           ✅ recorded → portal/fixtures/geometry/${realm}.json`); continue; }
            if (!flag('--check')) continue;
            if (!fs.existsSync(file)) { console.log(`           ⚠ no fixture yet — record one with --realm ${realm} --write`); continue; }
            const moved = compare(JSON.parse(fs.readFileSync(file, 'utf8')), now);
            if (!moved.length) { console.log('           ✅ matches its fixture'); continue; }
            bad = true;
            console.log(`           ❌ ${moved.length} change(s) since the fixture was recorded:`);
            for (const m of moved) console.log(`              ${m.view} · ${m.what}: ${m.was} → ${m.now}`);
            console.log('           Either the change is intended — re-record with --write in the SAME commit — or a shared surface moved a realm nobody was working on.');
        }
    } finally {
        await browser.close();
        server.close();
    }
    if (bad) process.exit(1);
}

// Importable for its own test without launching anything: `compare` is the half a browser cannot check.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    run().catch((e) => { console.error('portal:geometry failed —', e.message); process.exit(1); });
}
