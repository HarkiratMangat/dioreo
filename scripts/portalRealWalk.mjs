#!/usr/bin/env node
// scripts/portalRealWalk.mjs — the conformance plan's §0.5b phase ⓪, as a repeatable command.
//
// 🔴 IT RUNS BEFORE THE WORK, NOT AS A VICTORY LAP AFTER IT. The mockup and the harness are BOTH fixture-driven, so they agree with each other automatically and everything they corroborate about data shape, they corroborate vacuously. `TL.days` returned NaN for every real record — "ends NaN days after the battle pass" — and no fixture could ever have shown it.
//
// ⚠️ THIS IS NOT A CONFORMANCE CHECK. The real portal carries no `?conform=1`, so every stand-down is ON and a pixel comparison against the mockup measures the redesigns rather than the gap. What only this can see: real data volumes, the door, genuine empty and error states, the 401/409 paths, and whether any of it works. ⚠️ STALE COMMENT, corrected 2026-09-01: `?conform=1` no longer exists — the two rendering modes collapsed 2026-08-31 and the flag was renamed `?fresh=1`, which does FIXTURES ONLY. There is no stand-down switch; do not add one back.
import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { record: recordRun } = require('./lib/portalReceipt.cjs');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fs = require('fs');
const { findChrome } = require('./lib/chromePath.cjs');
const { mintSession, assertPastDoor } = require('./lib/portalSession.cjs');

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const flag = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const realm = flag('--realm', 'season');
// 🔴 THE VIEW NAMES COME FROM THE REALM, NOT FROM SEASON. This defaulted to `Track,Board,Repairs` on every realm, so a Broadcast walk reported `❌ no control reading "Board"` twice and passed on one view — a failure that names a control the realm has never had. Identical shape to `--triggers` printing `season` as a literal on every realm until 2026-09-01, in the same instrument family, and the ⚠️ instrument that should have caught it already knew the answer: `portal:status` prints each realm's views by reading these same fixtures. So this reads them too, and falls back to the default view alone rather than to another realm's tabs — a walk that checks one real view beats one that fails on three imaginary ones. `--views` still overrides for a realm with no fixture recorded yet.
const viewsFromFixture = (r) => {
    try {
        const f = path.join(ROOT, 'portal', 'fixtures', 'geometry', `${r}.json`);
        return Object.keys(JSON.parse(fs.readFileSync(f, 'utf8')).views || {});
    } catch { return []; }
};
const views = flag('--views', '').split(',').filter(Boolean).length
    ? flag('--views', '').split(',').filter(Boolean)
    : (viewsFromFixture(realm).length ? viewsFromFixture(realm) : ['default']);
const noAuth = has('--no-auth');           // the falsifier: proves the door assertion can fire

// What a rendered page must never say to a reader. `null` and `undefined` are included as WORDS because that is how they reach a screen — a template that interpolated a missing field.
const GARBAGE = /\bNaN\b|Invalid Date|\bundefined\b|\bnull\b|\[object Object\]|\bInfinity\b|,\s*,/;

const browser = await puppeteer.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
let failed = false;
try {
    if (!noAuth) {
        const sess = await mintSession(ROOT, flag('--as', null));
        if (!sess) throw new Error('portal:realwalk: could not mint a dev session — is .env.dev present with a localhost MONGODB_URI?');
        await browser.setCookie({ name: 'portal_session', value: sess.raw, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' });
        await browser.setCookie({ name: 'portal_session', value: sess.raw, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' });
        console.log(`\nportal:realwalk — ${realm} · signed in as ${sess.who} (session minted in dev Mongo for this run)\n`);
    } else {
        console.log(`\nportal:realwalk — ${realm} · --no-auth: this run is EXPECTED to be refused at the door\n`);
    }

    const page = await browser.newPage();
    const errs = [], bad = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
    page.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 160)));
    page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`); });
    await page.setViewport({ width: 1282, height: 888, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:8787/#/${realm}`, { waitUntil: 'networkidle2', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));

    const state = await assertPastDoor(page, `${realm} on load`);
    console.log(`  past the door: ${state.realmNodes} realm node(s), ${state.textLen} chars\n`);

    const scan = async (label) => {
        const out = await page.evaluate((src) => {
            const re = new RegExp(src);
            const hits = [];
            for (const el of document.querySelectorAll('main *, header *')) {
                if (el.children.length) continue;
                const t = (el.innerText || '').trim();
                if (t && re.test(t)) hits.push((typeof el.className === 'string' && el.className ? '.' + el.className.split(/\s+/)[0] : el.tagName.toLowerCase()) + '  ' + t.slice(0, 74));
            }
            return { hits: [...new Set(hits)].slice(0, 14), rows: document.querySelectorAll('main tr, main .bar, main li, main .rec-row').length, chars: String((document.querySelector('main') || {}).innerText || '').length };
        }, GARBAGE.source);
        const ok = out.hits.length === 0;
        if (!ok) failed = true;
        console.log(`  ${ok ? '✅' : '❌'} ${label.padEnd(9)} ${String(out.rows).padStart(4)} row(s) · ${String(out.chars).padStart(6)} chars${ok ? '' : ` · ${out.hits.length} garbage value(s)`}`);
        out.hits.forEach((h) => console.log(`        ⚠️  ${h}`));
        return out;
    };

    const seen = [];
    seen.push(await scan(views[0] || 'default'));
    for (const v of views.slice(1)) {
        const clicked = await page.evaluate((want) => {
            const b = [...document.querySelectorAll('button,[role="tab"],a')].find((e) => (e.textContent || '').trim() === want);
            if (!b) return false; b.click(); return true;
        }, v);
        if (!clicked) { console.log(`  ❌ ${v.padEnd(9)} no control reading "${v}" — the view was never entered`); failed = true; continue; }
        await page.evaluate(() => new Promise((r) => setTimeout(r, 1800)));
        seen.push(await scan(v));
    }

    // 🔴 IDENTICAL READINGS ACROSS VIEWS THAT MUST DIFFER IS THE SIGNATURE OF NEVER HAVING ARRIVED, and it is far more convincing than zeroes because the numbers look plausible. This is the check that would have caught the 784/0/784/0/784/0 reading without anyone noticing the lone 401.
    const sig = seen.map((s) => `${s.rows}:${s.chars}`);
    if (seen.length > 1 && new Set(sig).size === 1) {
        failed = true;
        console.log(`\n  ❌ every view reported ${sig[0]} — identical readings across views that must differ means the`);
        console.log('     walk never left the first page. Treat nothing above as measured.');
    }

    // ⚠️ AND THE CONSOLE MESSAGE DOES NOT NAME THE URL. Chrome's subresource failure reads exactly "Failed to load resource: the server responded with a status of 404 (Not Found)" — no path — so filtering console text on the word favicon cannot work, and the first attempt at this exemption silently did nothing. Those messages are always a MIRROR of a network response, and the responses are checked below with their URLs intact, where the exemption can be exact. What survives here is what only the console can report: thrown exceptions and explicit console.error.
    const realErrs = errs.filter((t) => !/^Failed to load resource/.test(t));
    const realBad = bad.filter((b) => !/favicon/i.test(b));
    if (realErrs.length || realBad.length) failed = true;
    console.log(`\n  console errors: ${errs.length}${errs.length && !realErrs.length ? ' (all mirror a network response — counted there, with the URL)' : ''}`);
    errs.slice(0, 10).forEach((e) => console.log(`     ✗ ${e}`));
    console.log(`  responses >= 400: ${bad.length}${bad.length && !realBad.length ? ' (favicon only — not counted)' : ''}`);
    [...new Set(bad)].slice(0, 10).forEach((b) => console.log(`     ✗ ${b}`));
    // A MISSING FAVICON IS NOT A DEFECT IN THE REALM, and it arrives twice — once as a >=400 response and once as the console error that response generates. The first version exempted only the response, so the walk failed on a 404 for /favicon.ico while reporting three clean views. A gate that fires on something nobody will fix is a gate that gets ignored, which is the third time today a false positive nearly cost more than the defect it guarded.
    console.log('');
} catch (e) {
    console.error(String(e.message || e));
    failed = true;
} finally {
    await browser.close();
}
// Only a walk that got past the door and through every view is worth recording.
if (!failed) recordRun('realwalk', realm);
process.exit(failed ? 1 : 0);
