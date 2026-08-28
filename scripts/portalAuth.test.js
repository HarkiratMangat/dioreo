// scripts/portalAuth.test.js Pure crypto and policy checks — no network, no Discord. What is asserted is the shape of the cookie and the state parameter, because those are the two things that fail silently and unsafely.
const assert = require('assert');
const { buildCookie, buildAuthorizeUrl, verifyState, hashSession,
        originOf, allowedOrigins, cookieAttrs, isLocalOrigin } = require('../portal/auth');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  \u2713 ${name}`); }
    catch (e) { failures++; console.error(`  \u2717 ${name}\n      ${e.message}`); }
}

check('the cookie is host-only, HttpOnly, Secure and SameSite=Lax', () => {
    // ⚠️ THE ORIGIN ARGUMENT IS NEW AND THIS CHECK WAS PASSING WITHOUT IT. `buildCookie` took one argument until 2026-08-28; after the signature changed, `buildCookie('abc123')` read the session id as the ORIGIN, which is not a localhost URL, so `Secure` was included and the assertion passed — correct answer, nonsense input. A check that keeps passing through a signature change is not measuring what its name says.
    const c = buildCookie('https://portal.dioreo.app', 'abc123');
    assert.ok(c.includes('HttpOnly'), 'a readable session cookie is a stolen session cookie');
    assert.ok(c.includes('Secure'));
    assert.ok(/SameSite=Lax/i.test(c));
    assert.ok(!/Domain=/i.test(c),
        'no Domain attribute \u2014 a host-only cookie is never sent to dioreo.app, which is the whole reason for the subdomain');
});

check('the authorize URL requests identify and NOTHING else', () => {
    const u = new URL(buildAuthorizeUrl({ clientId: '123', redirectUri: 'https://portal.dioreo.app/auth/callback', state: 's' }));
    assert.strictEqual(u.searchParams.get('scope'), 'identify',
        'any additional scope is a promise broken on the door page');
    assert.strictEqual(u.searchParams.get('response_type'), 'code');
    assert.ok(u.searchParams.get('state'), 'a missing state parameter is an open CSRF hole on the login flow');
});

check('a forged or missing state is rejected', () => {
    assert.strictEqual(verifyState('nope', 'expected'), false);
    assert.strictEqual(verifyState(undefined, 'expected'), false);
    assert.strictEqual(verifyState('expected', 'expected'), true);
});

check('the stored session id is a hash, never the raw value', () => {
    const raw = 'abc123';
    const h = hashSession(raw);
    assert.notStrictEqual(h, raw, 'storing the raw session id makes a database read equal to a login');
    assert.strictEqual(h, hashSession(raw), 'the hash must be stable or every request logs the user out');
});


// ── THE ORIGIN A REQUEST ARRIVED ON ────────────────────────────────────────────────────────────────
//
// 🔴 THESE EXIST BECAUSE A LIVE AUTHENTICATION BUG SHIPPED WITH NO FALSIFIER. `/auth/login` built its redirect_uri from `PORTAL_PUBLIC_URL` while `Set-Cookie` necessarily landed on the origin the request arrived on — so starting a sign-in at http://localhost:8787 while that variable named the tunnel put the state cookie on one host and the callback on another, and the callback reported "invalid or expired state". That message describes a forged request; nothing was forged and nothing had expired. Harkirat hit it on 2026-08-28 15:27 EDT. No gate in this repo could have: every one of them reads source or renders a component, and this is a property of two hosts disagreeing at runtime.

check('originOf reads the proxy header, because behind the tunnel the socket is plain http', () => {
    assert.strictEqual(originOf({ headers: { host: 'dev-portal.dioreo.app', 'x-forwarded-proto': 'https' } }),
        'https://dev-portal.dioreo.app');
    // cloudflared can send a list; the first entry is the client's own scheme.
    assert.strictEqual(originOf({ headers: { host: 'dev-portal.dioreo.app', 'x-forwarded-proto': 'https, http' } }),
        'https://dev-portal.dioreo.app');
    assert.strictEqual(originOf({ headers: { host: 'localhost:8787' }, socket: {} }), 'http://localhost:8787');
});

check('allowedOrigins carries PORTAL_PUBLIC_URL and both localhost spellings', () => {
    const prev = { u: process.env.PORTAL_PUBLIC_URL, p: process.env.PORTAL_PORT };
    process.env.PORTAL_PUBLIC_URL = 'https://dev-portal.dioreo.app/';   // trailing slash on purpose
    process.env.PORTAL_PORT = '8787';
    const list = allowedOrigins();
    assert.ok(list.includes('https://dev-portal.dioreo.app'), 'the trailing slash must be trimmed or nothing matches');
    assert.ok(list.includes('http://localhost:8787'));
    assert.ok(list.includes('http://127.0.0.1:8787'));
    process.env.PORTAL_PUBLIC_URL = prev.u; process.env.PORTAL_PORT = prev.p;
});

check('THE ALLOWLIST CAN REFUSE: an origin nobody registered is not offered to Discord', () => {
    // Without this, `req.headers.host` — which is client-controlled — would be echoed straight into an OAuth redirect_uri, which is how an open redirector gets built.
    const prev = process.env.PORTAL_PUBLIC_URL;
    process.env.PORTAL_PUBLIC_URL = 'https://dev-portal.dioreo.app';
    assert.ok(!allowedOrigins().includes('https://evil.example'), 'an arbitrary Host must never be allowed');
    process.env.PORTAL_PUBLIC_URL = prev;
});

check('Secure is dropped on plain-http localhost and kept everywhere else', () => {
    // A `Secure` cookie is not stored over plain http, and browsers disagree about whether localhost is an exception — the ones that refuse produce no error anywhere, just a login that reports the state is invalid. Localhost is a secure context by definition, so dropping it there costs nothing.
    assert.ok(!cookieAttrs('http://localhost:8787').includes('Secure'));
    assert.ok(!cookieAttrs('http://127.0.0.1:8787').includes('Secure'));
    assert.ok(cookieAttrs('https://localhost:8787').includes('Secure'), 'https localhost still gets it');
    assert.ok(cookieAttrs('https://dev-portal.dioreo.app').includes('Secure'));
    assert.ok(cookieAttrs('http://portal.example.com').includes('Secure'), 'a non-local http origin keeps it');
    // Every cookie this file writes is host-only by design (spec decision 8) — a Domain attribute would send it to dioreo.app, which is the whole reason the portal is a separate subdomain.
    assert.ok(!cookieAttrs('https://dev-portal.dioreo.app').some((p) => /^Domain=/i.test(p)));
});

check('a cleared cookie carries the SAME attributes it is clearing', () => {
    // A browser only replaces a cookie when name, path and domain agree. Getting Secure wrong on the clear leaves the old cookie in place, so a sign-out silently does not sign you out.
    const live = cookieAttrs('http://localhost:8787', { maxAge: 600 }).filter((p) => !/^Max-Age=/.test(p));
    const dead = cookieAttrs('http://localhost:8787', { maxAge: 0 }).filter((p) => !/^Max-Age=/.test(p));
    assert.deepStrictEqual(dead, live);
    assert.ok(isLocalOrigin('http://127.0.0.1:8787') && !isLocalOrigin('https://dev-portal.dioreo.app'));
});

// ⚠️ THE EXIT IS THE LAST LINE OF THE FILE, DELIBERATELY. It used to sit above the final third of these checks, so five cases appended on 2026-08-28 ran zero times and the suite reported four passes and a clean exit — the "test nobody runs" defect this repo has a whole section about, inside the file added to close a gap of exactly that shape. Anything new goes ABOVE this line.
process.exit(failures ? 1 : 0);
