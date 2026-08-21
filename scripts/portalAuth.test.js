// scripts/portalAuth.test.js Pure crypto and policy checks — no network, no Discord. What is asserted is the shape of the cookie and the state parameter, because those are the two things that fail silently and unsafely.
const assert = require('assert');
const { buildCookie, buildAuthorizeUrl, verifyState, hashSession } = require('../portal/auth');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  \u2713 ${name}`); }
    catch (e) { failures++; console.error(`  \u2717 ${name}\n      ${e.message}`); }
}

check('the cookie is host-only, HttpOnly, Secure and SameSite=Lax', () => {
    const c = buildCookie('abc123');
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

process.exit(failures ? 1 : 0);
