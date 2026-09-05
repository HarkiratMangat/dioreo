#!/usr/bin/env node
// scripts/portalShot.mjs — ONE element, both sides, cropped. The instrument the "he closes by looking" rule needed.
//
// 🔴 WHY. §0.7d says the deliverable is not a report and not a percentage: it is the two pages side by side, looked at. §0.5b says a Part ships frames that are CAPTURES OF TWO RUNNING PAGES and never a reconstruction. Both were true and neither was runnable for a single CONTROL — `portalDiff` shoots whole pages, `portalAudit` prints rows, and a question like "the design's commit chip against the portal's" had no answer short of two screenshots taken by hand and cropped by eye. A decision that is Harkirat's cannot be put to him as a table of computed styles.
//
// ⚠️ IT ANSWERS "WHAT DOES IT LOOK LIKE", NEVER "WHICH IS RIGHT". No pairing, no diff, no verdict — two PNGs of the same control under the same frozen clock at the same viewport. The judgement is the reader's, which is the point.
//
//   node scripts/portalShot.mjs --realm review --sel ".hdr-commit" --name commit-chip
//   node scripts/portalShot.mjs --realm armory --mk-sel "#addDmz" --pt-sel ".mh-add button:nth-of-type(2)" \
//        --open-sel ".mh-add button:nth-of-type(2)" --name armory-create
//
// ⚠️ THE TWO SIDES OFTEN NEED DIFFERENT SELECTORS and that is not a workaround — `--triggers` already reports that the mockup draws `+ Grant access` where the portal draws `+ Grant access N`. `--sel` sets both; `--mk-sel` and `--pt-sel` override one.
import fs from 'fs';
import http from 'http';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { SEED_REALMS } from './lib/portalSeedRealms.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG = 'docs/superpowers/mockups/2026-08-23-portal-interactive';
const OUT = path.join(ROOT, 'local', 'shots');
const VIEWPORT = { w: 1282, h: 888 };
// The mockup's own fixture day. `portalDiff` freezes both sides here and `fixtures.js` hardcodes it, so a shot taken at any other instant is not comparable to anything else this suite has recorded.
const FROZEN = Date.parse('2026-08-24T18:41:00Z');

const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? true) : d; };
const realm = flag('--realm', 'season');
const sel = flag('--sel', null);
const mkSel = flag('--mk-sel', sel);
const ptSel = flag('--pt-sel', sel);
const openSel = flag('--open-sel', null);
const mkOpenSel = flag('--mk-open-sel', openSel);
const ptOpenSel = flag('--pt-open-sel', openSel);
const name = flag('--name', realm);
const pad = Number(flag('--pad', 12)) || 0;

if (!mkSel || !ptSel) {
    console.error('portal:shot needs --sel (or both --mk-sel and --pt-sel). See this file\'s header.');
    process.exit(2);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
// 🔴 TWO ROOTS, NOT ONE. The harness's import map and its asset paths are written against `portal/public` AS THE SERVER ROOT — served from the repo root instead, every module 404s and the page renders an empty div, which reads exactly like "the portal has no commit chip". The mockup package needs the repo root because its own paths are repo-relative. So: one server each.
function serve(root) {
    const server = http.createServer((req, res) => {
        const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
        const file = path.join(root, rel);
        if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
        // no-store for the same reason `.serve.py` records: a cached fixtures.js makes a run measure yesterday's assets.
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store, must-revalidate' });
        res.end(fs.readFileSync(file));
    });
    return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}

async function shoot(browser, port, side, url, selector, clickSel) {
    const page = await browser.newPage();
    await page.setViewport({ width: VIEWPORT.w, height: VIEWPORT.h });
    // Frozen before any page script runs, and storage cleared — both are settled requirements of this suite, and both were learned the expensive way (a moving clock, and sessionStorage leaking between passes).
    await page.evaluateOnNewDocument((t) => {
        const R = Date;
        // eslint-disable-next-line no-global-assign
        Date = class extends R { constructor(...a) { super(...(a.length ? a : [t])); } static now() { return t; } };
        try { sessionStorage.clear(); localStorage.clear(); } catch { /* a page that forbids storage is fine */ }
    }, FROZEN);
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
    // 2600ms, the same settle `portalDiff` uses. 1400 was enough for the static mockup and not for the harness, whose realm renders after a stubbed fetch resolves — so the first run reported the portal had no commit chip when it simply had not drawn one yet. A too-short settle reads exactly like an absent element.
    await page.evaluate(() => new Promise((r) => setTimeout(r, 2600)));
    if (clickSel) {
        const hit = await page.evaluate((s) => { const el = document.querySelector(s); if (!el) return false; el.click(); return true; }, clickSel);
        if (!hit) { await page.close(); throw new Error(`${side}: nothing matched --open-sel ${clickSel}`); }
        await page.evaluate(() => new Promise((r) => setTimeout(r, 900)));
    }
    const box = await page.evaluate((s, p) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.max(0, r.x - p), y: Math.max(0, r.y - p), width: r.width + p * 2, height: r.height + p * 2 };
    }, selector, pad);
    if (!box) {
        // Name what IS there. "nothing matched" alone cannot distinguish a wrong selector from a page that never rendered, and those need opposite fixes.
        const near = await page.evaluate(() => [...document.querySelectorAll('header *, main > *')].slice(0, 24)
            .map((e) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).join('.') : '')));
        await page.close();
        throw new Error(`${side}: nothing matched ${selector}.\n  present: ${near.join(' ')}\n   The two sides often spell a control differently — use --mk-sel / --pt-sel.`);
    }
    if (box.width < 1 || box.height < 1) { await page.close(); throw new Error(`${side}: ${selector} has no box (${box.width}x${box.height}) — it is present but not rendered.`); }
    fs.mkdirSync(OUT, { recursive: true });
    const file = path.join(OUT, `${name}-${side}.png`);
    await page.screenshot({ path: file, clip: box });
    await page.close();
    console.log(`  ${side}  ${selector}  ${Math.round(box.width)}x${Math.round(box.height)}  ->  ${path.relative(ROOT, file)}`);
    return file;
}

const { findChrome } = require('./lib/chromePath.cjs');
const puppeteer = require('puppeteer-core');
const { server: mkServer, port: mkPort } = await serve(ROOT);
const { server: ptServer, port: ptPort } = await serve(path.join(ROOT, 'portal', 'public'));
const browser = await puppeteer.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
// The mockup's staged store is sessionStorage and this tool clears it, so a realm carrying a staged surface must be seeded or the two sides hold different data — the same refusal `portalDiff` makes, from the same one list.
const mkQuery = SEED_REALMS.includes(realm) ? '?demo=1' : '';
const mkPage = realm === 'home' ? 'index.html' : `${realm}.html`;
try {
    console.log(`\nportal:shot — ${name}, both sides, frozen at the mockup's own fixture day\n`);
    await shoot(browser, mkPort, 'mk', `http://127.0.0.1:${mkPort}/${PKG}/${mkPage}${mkQuery}`, mkSel, mkOpenSel);
    await shoot(browser, ptPort, 'pt', `http://127.0.0.1:${ptPort}/harness.html#/${realm}`, ptSel, ptOpenSel);
    console.log('\n  Two captures of two RUNNING pages. This tool states what they LOOK like and never which is right.\n');
} finally {
    await browser.close();
    mkServer.close();
    ptServer.close();
}
