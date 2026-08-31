#!/usr/bin/env node
// scripts/portalCaptureModes.mjs — THE RECORD OF THE RENDERING THAT IS ABOUT TO BE DELETED.
//
// 🔴 WHY THIS EXISTS. Harkirat decided 2026-08-30 22:45 EDT that the portal's two rendering modes collapse into one: the "ahead" rendering is scrapped, the conformed rendering survives, and redesigns get rebuilt fresh on it. The conformed side is photographed everywhere — portalDiff writes `pt-` on every run and an A/B artifact is published per Part. The AHEAD side is photographed NOWHERE. `?conform=1` is set only by the harness reading its own query string (portal/ui/harness/stub.js), so the moment the 57 `conforming()` sites and 51 `data-conform` blocks are deleted, the only record of what those 108 forks were protecting is prose plus git archaeology.
//
// This runs ONCE, before the collapse, and it is the irreversible step of that work.
//
// 🔴 IT HAS RUN, AND IT CANNOT RUN AGAIN. The collapse landed 2026-08-31; there is no conform-OFF rendering left for this to photograph, and the parameter no longer selects one. The file is kept as the PROVENANCE of the published record, not as a tool to reach for:
//   https://claude.ai/code/artifact/48baf822-3a53-46d0-9fe9-93da8e00d104
// Its data-conform arrival assertion will now refuse every run, which is correct: the state it was written to prove reachable is gone.
//
// 🔴 IT CAPTURES ALL SIX REALMS, NOT THE ONE BEING WORKED. Measured 2026-08-30 23:4x EDT: the shared tail changes the conform-OFF rendering of realms nobody has opened. `tokens.css:323` sets --ctl-min/--ctl-pad/--ctl-rad, which is every button in the app; `app.css:5195` includes `.mh-stats .stat .v.zero`, the masthead all six inherit; `app.css:1372` is Armory's tier board; `app.css:2940` is a 78ch measure spanning six selectors. A session working Season would naturally shoot Season and silently lose five realms' only record.
//
// USAGE
//   node scripts/portalCaptureModes.mjs                 all realms, both modes, full page
//   node scripts/portalCaptureModes.mjs --realm season  one realm
//   node scripts/portalCaptureModes.mjs --selftest      prove the flag actually arrives (see below)
//
// OUTPUT  local/conform-capture/<realm>[-<view>]-{on,off}.png  plus index.json
//   `-on` is `?conform=1`, the rendering that SURVIVES. `-off` is the ahead rendering, the one being deleted.
//
// 🔴 THE FALSIFIER, and it is the trap table's own. §0.10: "IDENTICAL READINGS ACROSS VARIANTS THAT MUST DIFFER = NEVER ARRIVED" — an unauthenticated walk once reported the same reading on three views and that read as a stable measurement when it was the signature of measuring the door. A capture pair whose two sides are identical looks exactly like "this realm has no stand-downs" and is indistinguishable from "the query parameter never arrived". So the arrival of the flag is asserted DIRECTLY, on the root element's `data-conform` attribute, independent of any pixel: present in ON, absent in OFF, on every single page. A run where that assertion fails writes nothing. With arrival proven, identical pixels become a real finding about the realm rather than an instrument failure.

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'local', 'conform-capture');
const HARNESS = 'http://localhost:8901/harness.html';

const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? true) : d; };
const only = flag('--realm', null);
const selfTest = args.includes('--selftest');

const [VW, VH] = [1282, 888];
// Same instant portalDiff pins to, and for the same reason: ?today= does not travel the season countdown (COMPANION 16.31a), so two captures seconds apart can never be compared. The value must stay at the mockup's own F.today or the two sides desynchronise — see the plan's 0.6a.
const FROZEN = Date.parse('2026-08-24T18:41:00Z');

// Season's Board and Repairs live behind tabs and carry conform blocks of their own (.bcols at app.css:3073 is Board's). A capture of the default view alone would leave them unrecorded.
const SURFACES = [
    { realm: 'season' }, { realm: 'season', view: 'Board' }, { realm: 'season', view: 'Repairs' },
    { realm: 'armory' }, { realm: 'broadcast' }, { realm: 'review' },
    { realm: 'access' }, { realm: 'analytics' }, { realm: 'home' },
];

const VIEW_SIG = () => (document.querySelector('main')?.innerText || '').slice(0, 400);

async function shoot(page, { realm, view }, on) {
    await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument((t) => {
        const R = Date;
        const F = function (...a) { return a.length ? new R(...a) : new R(t); };
        F.prototype = R.prototype; F.now = () => t; F.parse = R.parse; F.UTC = R.UTC;
        window.Date = F;
        try { performance.now = () => 0; } catch { /* read-only in some builds */ }
    }, FROZEN);
    // The mockup persists five UI keys and one page is reused across every shot here; without this a toggle opened in shot 1 silently changes what shot 12 measures. Same reason portalDiff clears them.
    await page.evaluateOnNewDocument(() => {
        try { sessionStorage.clear(); } catch { /* a sandboxed context can refuse */ }
        try { localStorage.clear(); } catch { /* same */ }
    });

    const q = on ? `?conform=1&b=${Date.now()}` : `?b=${Date.now()}`;
    await page.goto(`${HARNESS}${q}#/${realm}`, { waitUntil: 'networkidle2', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('main', { timeout: 20000 });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 2600)));

    // 🔴 THE ARRIVAL ASSERTION. Never inferred from the pixels.
    const arrived = await page.evaluate(() => document.documentElement.hasAttribute('data-conform'));
    if (arrived !== on) {
        throw new Error(`portal:capture refuses to write: data-conform is ${arrived ? 'PRESENT' : 'ABSENT'} on `
            + `${realm}${view ? ` (${view})` : ''} in conform-${on ? 'ON' : 'OFF'} mode.\n`
            + '  The two captures would have been the same rendering under two filenames, which is exactly the\n'
            + '  reading that looks like "this realm has no stand-downs".');
    }

    if (view) {
        const before = await page.evaluate(VIEW_SIG);
        const hit = await page.evaluate((v) => {
            const el = [...document.querySelectorAll('button,[role="tab"],a')]
                .filter((e) => (e.innerText || '').trim() === v)[0];
            if (el) { el.click(); return true; }
            return false;
        }, view);
        if (!hit) throw new Error(`portal:capture refuses: no control reading "${view}" on ${realm}.`);
        await page.evaluate(() => new Promise((r) => setTimeout(r, 900)));
        const after = await page.evaluate(VIEW_SIG);
        if (after === before) throw new Error(`portal:capture refuses: clicking "${view}" on ${realm} changed nothing.`);
    }

    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 260)));

    // The harness nests two `main` elements — its page wrapper and the Shell's — so querySelector returns the outer one whose scrollHeight is the viewport. Take the largest content height of every candidate; a max cannot be fooled by a wrapper. Same defect portalDiff records, and it clipped every capture to 888px twice.
    const h = await page.evaluate((min) => {
        const c = [...document.querySelectorAll('main'), document.scrollingElement,
            document.documentElement, document.body].filter(Boolean);
        return Math.max(min, document.documentElement.scrollHeight,
            ...c.map((e) => Math.max(e.scrollHeight || 0, e.getBoundingClientRect().bottom || 0)));
    }, VH);
    await page.setViewport({ width: VW, height: Math.ceil(h), deviceScaleFactor: 1 });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 320)));

    const name = `${realm}${view ? `-${view.toLowerCase()}` : ''}-${on ? 'on' : 'off'}.png`;
    const buf = Buffer.from(await page.screenshot({ type: 'png' }));
    fs.writeFileSync(path.join(OUT, name), buf);
    return { name, height: Math.ceil(h), bytes: buf.length };
}

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const { findChrome, CHROME_CANDIDATES } = require('./lib/chromePath.cjs');
    const chrome = findChrome();
    if (!chrome) { console.error('No Chrome found. Tried:\n  ' + CHROME_CANDIDATES.join('\n  ')); process.exit(2); }
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox'] });
    const list = selfTest ? [SURFACES[0]] : SURFACES.filter((s) => !only || s.realm === only);
    const index = [];
    try {
        const page = await browser.newPage();
        console.log(`portal:capture — ${list.length} surface(s), both modes, viewport ${VW}px, clock frozen at 2026-08-24\n`);
        for (const s of list) {
            const label = `${s.realm}${s.view ? ` · ${s.view}` : ''}`;
            const on = await shoot(page, s, true);
            const off = await shoot(page, s, false);
            const same = on.bytes === off.bytes;
            index.push({ ...s, on, off, identical: same });
            console.log(`  ${label.padEnd(22)} on ${String(on.height).padStart(5)}px  off ${String(off.height).padStart(5)}px`
                + (same ? '   ⚠️ byte-identical — this realm has no visible stand-down' : ''));
        }
        fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));
        console.log(`\n  wrote ${index.length * 2} PNGs + index.json to local/conform-capture/`);
        console.log('  🔴 `-off` is the rendering being DELETED. It exists nowhere else.');
        if (selfTest) console.log('\n  --selftest: the data-conform arrival assertion held on both modes.');
    } finally {
        await browser.close();
    }
})();
