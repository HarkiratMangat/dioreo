// scripts/portalRoutes.test.js — the portal's routes, EXECUTED.
//
// 🔴 NOTHING IN THIS SUITE HAD EVER CALLED A ROUTE. `portalApi.test.js` is a SOURCE SCAN asserting every handler is wrapped in `requireAdmin`; `portalRealms`/`portalUi`/`portalReview`/`portalChrome` test pure functions; `portalHarness` compares the fixture stub's keys against the keys the real routes promise — and none of them ever sent a request. A handler could throw on its first real call and the whole suite stayed green, which is exactly what happened: booting the server by hand on 2026-08-26 found six routes turning a malformed id into a 500.
//
// It runs the handlers DIRECTLY out of `ROUTES` rather than over HTTP. There is no listener, no port to collide with, and no chance of hitting a portal somebody else is running — which happened during the manual pass and cost a process that was not mine.
//
// ⚠️ TWO HALVES, AND ONLY ONE NEEDS A DATABASE. The refusal cases run everywhere, always: `sessionFor` returns null on a missing cookie before it ever queries, so "every admin route refuses an anonymous request" is checkable with no Mongo at all — and it is the single most important thing to know about this surface. The 200 cases need real data and **SKIP LOUDLY** without it, because a route test that quietly checks nothing reports exactly what a clean run reports.
const assert = require('assert');
const path = require('path');
const fs = require('fs');

let failures = 0, skipped = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
async function acheck(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

// A response object that records instead of writing. `sendJson` in portal/api/httpUtil.js calls writeHead then end, and `forbidden` goes through the same path — so capturing both is enough to read any handler's answer.
function fakeRes() {
    const res = { status: 0, headers: {}, body: '', headersSent: false };
    res.writeHead = (status, headers) => { res.status = status; Object.assign(res.headers, headers || {}); res.headersSent = true; return res; };
    res.end = (chunk) => { if (chunk) res.body += chunk; return res; };
    res.setHeader = (k, v) => { res.headers[k] = v; };
    return res;
}
const fakeReq = (cookie, method = 'GET', headers = {}) => ({ method, headers: { ...(cookie ? { cookie } : {}), ...headers } });
const json = (res) => { try { return JSON.parse(res.body); } catch { return null; } };

// The same extraction portalHarness uses, for the same reason: the keys a route promises are written as shorthand literals in its own sendJson call, so they are read from the source rather than restated here where they could drift.
function promisedKeys() {
    const out = {};
    const dir = path.join(__dirname, '..', 'portal', 'api');
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js'))) {
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        for (const r of [...src.matchAll(/route\(\s*'GET'\s*,\s*\/\^((?:\\.|[^/])+)\$\//g)]) {
            const from = r.index;
            const next = src.indexOf("route('", from + 5);
            const body = src.slice(from, next === -1 ? src.length : next);
            const m = body.match(/sendJson\(res,\s*200,\s*\{([^}]*)\}/);
            if (!m) continue;
            const keys = m[1].split(',').map((k) => k.split(':')[0].trim()).filter((k) => /^[a-zA-Z_$][\w$]*$/.test(k));
            if (keys.length) out[r[1].replace(/\\/g, '')] = keys;
        }
    }
    return out;
}

(async () => {
    console.log('portalRoutes — the routes, executed');

    // Loading server.js registers every route as a side effect. It does NOT listen: the bootstrap at the foot of that file is guarded by require.main.
    const { ROUTES } = require('../portal/server');
    const gets = ROUTES.filter((r) => r.method === 'GET' && String(r.pattern).startsWith('/^\\/api'));

    check('the route table is populated, so the cases below are not vacuous', () => {
        assert.ok(gets.length >= 8, `expected the API routes to be registered, found ${gets.length}`);
    });

    // ── THE HALF THAT ALWAYS RUNS ────────────────────────────────────────────────────────────
    //
    // 🔴 THE MOST IMPORTANT PROPERTY OF THIS SURFACE, and it needs no database: an anonymous request is refused by every single route. portalApi.test.js proves the WRAPPER is present by reading the source; this proves it REFUSES by calling it.
    for (const r of gets) {
        const label = String(r.pattern).replace(/^\/\^|\$\/$/g, '').replace(/\\/g, '');
        // eslint-disable-next-line no-await-in-loop
        await acheck(`${label} refuses an anonymous request`, async () => {
            const res = fakeRes();
            await r.handler(fakeReq(null), res, new URL('http://127.0.0.1' + label));
            assert.strictEqual(res.status, 401, `expected 401, got ${res.status}`);
            assert.ok(json(res) && json(res).error, 'and it says so in JSON rather than an empty body');
        });
    }

    // ── THE HALF THAT NEEDS A DATABASE ─────────────────────────────────────────────────────── 🔴 READ .env.dev DIRECTLY, NEVER `process.env`. Requiring portal/server.js above pulls in the modules that call dotenv against the PRODUCTION `.env`, and dotenv does not overwrite a variable that is already set — so a later `config({ path: '.env.dev' })` is a no-op and `process.env.MONGODB_URI` is the live Atlas URI. That is how this section silently skipped on a machine with a perfectly good local mongod running: it read prod's URI, saw it was not local, and stood down. Parsing the file itself also makes the guard below absolute — this test cannot reach a remote database even if one is configured everywhere else.
    const devEnv = path.join(__dirname, '..', '.env.dev');
    const uri = fs.existsSync(devEnv)
        ? ((fs.readFileSync(devEnv, 'utf8').match(/^MONGODB_URI=(.*)$/m) || [])[1] || '').trim()
        : '';
    const local = /localhost|127\.0\.0\.1/.test(uri);
    let mongoose = null;
    if (local) {
        mongoose = require('mongoose');
        try { await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 }); }
        catch { mongoose = null; }
    }

    if (!mongoose) {
        skipped++;
        // 🔴 LOUD, NEVER A QUIET PASS. Without this line a missing database reports exactly what a clean run reports, which is how a dead gate survives for months.
        console.error(`  ⚠ SKIPPED the 200 cases — no LOCAL Mongo reachable${uri ? '' : ' and no MONGODB_URI in .env.dev'}.`);
        console.error('      Start a local mongod and re-run; these cases are the only thing that executes a route with real data.');
    } else {
        const crypto = require('crypto');
        const { hashSession } = require('../portal/auth');
        const PortalSession = require('../models/PortalSession');
        const { ALLOWED_ADMIN_ID } = require('../utils/owner');
        const raw = crypto.randomBytes(24).toString('hex');
        await PortalSession.deleteMany({ userAgent: 'portal-routes-test' });
        await PortalSession.create({ sessionHash: hashSession(raw), discordId: ALLOWED_ADMIN_ID, userAgent: 'portal-routes-test' });
        const cookie = `portal_session=${raw}`;
        // Every non-GET route verifies CSRF, and the token is derived from the session hash rather than stored — so the test computes it exactly as the server does instead of fetching it.
        const csrf = require('../portal/auth').csrfToken({ sessionId: hashSession(raw) });
        const promised = promisedKeys();

        // ⚠️ A ROUTE THAT REQUIRES A SCOPE MUST BE GIVEN ONE HERE, and /api/armory/export gained that requirement on 2026-08-26: with neither ids nor a mode it now answers 400 rather than an empty export. That refusal is the point — an empty file that looks like a successful backup is the worst answer a route can give when the tier-3 interlock tells the reader an export is the way back — so the loop supplies the scope and the bare call gets its own case below.
        const QUERY = { '/api/armory/export': '?mode=MP' };

        // The preview route takes an id; it gets its own case below, with a real one.
        for (const [route, keys] of Object.entries(promised).filter(([r]) => r !== '/api/armory/preview')) {
            // eslint-disable-next-line no-await-in-loop
            await acheck(`${route} answers 200 with ${keys.join(', ')}`, async () => {
                const match = gets.find((r) => r.pattern.test(route));
                assert.ok(match, `no registered route matches ${route}`);
                const res = fakeRes();
                await match.handler(fakeReq(cookie), res, new URL('http://127.0.0.1' + route + (QUERY[route] || '')));
                assert.strictEqual(res.status, 200, `expected 200, got ${res.status} (${res.body.slice(0, 80)})`);
                const body = json(res);
                assert.ok(body, 'the body parses as JSON');
                for (const k of keys) assert.ok(k in body, `promised key "${k}" is missing from the response`);
            });
        }

        // 🔴 AN EXPORT WITH NO SCOPE IS A REFUSAL, NOT AN EMPTY FILE. Before the mode and category scopes existed this route answered 200 with an empty string for a request naming nothing — which reads as "there was nothing to export" rather than "you did not say what to export", and the two are very different when the file is meant to be the way back from a purge.
        await acheck('/api/armory/export refuses a request that names no scope', async () => {
            const match = gets.find((r) => r.pattern.test('/api/armory/export'));
            const res = fakeRes();
            await match.handler(fakeReq(cookie), res, new URL('http://127.0.0.1/api/armory/export'));
            assert.strictEqual(res.status, 400, 'a scopeless export must not answer with an empty success');
            assert.match(json(res).error, /ids, or a mode/);
        });

        // ⚠️ A ROUTE THAT TAKES A PARAMETER NEEDS ONE. The loop above calls every GET with its bare path, which is right for the eight that take none and wrong for the preview: with no id it correctly 404s, and asserting 200 there tests the test rather than the route. It gets a REAL id, fetched the same way the page does.
        await acheck('/api/armory/preview answers 200 for a real build', async () => {
            const listRes = fakeRes();
            await gets.find((r) => r.pattern.test('/api/armory')).handler(fakeReq(cookie), listRes, new URL('http://127.0.0.1/api/armory'));
            const build = (json(listRes).builds || [])[0];
            if (!build) { console.error('      (no builds in the dev database — nothing to preview)'); return; }
            const res = fakeRes();
            await gets.find((r) => r.pattern.test('/api/armory/preview'))
                .handler(fakeReq(cookie), res, new URL(`http://127.0.0.1/api/armory/preview?id=${build._id}`));
            assert.strictEqual(res.status, 200, `expected 200, got ${res.status} (${res.body.slice(0, 80)})`);
            assert.ok(json(res).card, 'and it carries a rendered card');
        });

        // 🔴 A PREVIEW THAT THROWS IS INVISIBLE FROM THE OUTSIDE — /api/review catches it and still answers 200, which is why this defect survived a full manual pass. The op rows it returns must carry a real before/after, not the empty diff a swallowed exception leaves behind.
        await acheck('/api/review returns a real diff for every op it can validate', async () => {
            const res = fakeRes();
            await gets.find((r) => r.pattern.test('/api/review')).handler(fakeReq(cookie), res, new URL('http://127.0.0.1/api/review'));
            const body = json(res);
            const editable = (body.ops || []).filter((o) => !o.blocked && /\.edit$/.test(o.op || ''));
            if (!editable.length) { console.error('      (no editable ops staged in the dev database)'); return; }
            for (const o of editable) {
                assert.ok(Array.isArray(o.rows) && o.rows.length > 0,
                    `${o.op} came back with an empty diff — its preview threw and the route swallowed it`);
            }
        });

        // 🔴 A LINE THE PARSER CANNOT READ MUST COME BACK MARKED, NEVER DROPPED AND NEVER GUESSED. The fixture stub failed this exact case first: `Date.parse("with no date 2026 UTC")` returns January 1st, so a nonsense line came back "understood" with a date nobody typed.
        await acheck('POST /api/parse-bulk marks an undatable line rather than inventing a date', async () => {
            const match = ROUTES.find((r) => r.method === 'POST' && r.pattern.test('/api/parse-bulk'));
            assert.ok(match, '/api/parse-bulk is registered');
            const res = fakeRes();
            const req = fakeReq(cookie, 'POST', { 'content-type': 'application/json', 'x-csrf-token': csrf });
            req.on = (ev, fn) => { if (ev === 'data') fn(Buffer.from(JSON.stringify({ kind: 'draw', text: 'Crimson Moonlight, Fennec, Sep 3\nnonsense line with no date' }))); if (ev === 'end') fn(); return req; };
            await match.handler(req, res, new URL('http://127.0.0.1/api/parse-bulk'));
            assert.strictEqual(res.status, 200, `expected 200, got ${res.status} (${res.body.slice(0, 90)})`);
            const rows = json(res).rows || [];
            assert.ok(rows.some((r) => r.ok && r.start), 'the readable line is understood');
            assert.ok(!rows.some((r) => r.ok && /nonsense/i.test(r.name || '')), 'the unreadable line is not reported as understood');
        });

        // 🔴 THE DEFECT THE MANUAL BOOT FOUND, kept as a case so it cannot come back: a client typo is a 400, not a 500.
        await acheck('a malformed id is a 400, never a 500', async () => {
            const match = gets.find((r) => r.pattern.test('/api/armory/preview'));
            assert.ok(match, 'the preview route is registered');
            const res = fakeRes();
            await match.handler(fakeReq(cookie), res, new URL('http://127.0.0.1/api/armory/preview?id=nonsense'));
            assert.strictEqual(res.status, 400, `expected 400, got ${res.status}`);
        });

        await PortalSession.deleteMany({ userAgent: 'portal-routes-test' });
        await mongoose.disconnect();
    }

    if (skipped) console.error(`\n⚠ portalRoutes: ${skipped} section SKIPPED — this run did NOT execute a route against real data.`);
    process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('  ✗ portalRoutes failed to start\n      ' + e.stack); process.exit(1); });
