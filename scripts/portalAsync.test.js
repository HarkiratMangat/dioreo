// scripts/portalAsync.test.js — the six states a request can be in, and the one thing a write can be that a read cannot.
//
// 🔴 THIS SUBSYSTEM DID NOT EXIST AND NO GATE NOTICED FOR THE WHOLE MIGRATION. Every realm ran `fetchJson(path).then(setData)` with no catch, so a 500, a dropped connection and an expired session all became an unhandled rejection and the page sat on the word "Loading" indefinitely. portal:orphans asks whether a class has a CSS rule and portal:coverage counts the shared shell against every realm at once, so a whole missing subsystem read as a small diffuse gap in eight numbers rather than as one absence. The lesson is the file's reason for existing: neither instrument can see a thing that was never built.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { FAILURE_COPY, failureOf, refusalOf, asyncDefaults } = require('../portal/ui/async.logic');

let failures = 0;
const say = console.log.bind(console);
function check(name, fn) {
    try { fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

say('portalAsync — can the portal say that something went wrong?');

// ── THE THREE-FIELD RULE, ENFORCED RATHER THAN DOCUMENTED ─────────────────────
check('every failure names WHAT failed, what it MEANS, and one ACTION', () => {
    const kinds = Object.keys(FAILURE_COPY);
    assert.ok(kinds.length >= 5, `expected the full set of kinds, found ${kinds.length}`);
    for (const k of kinds) {
        const c = FAILURE_COPY[k];
        for (const field of ['k', 'what', 'means', 'action']) {
            assert.ok(typeof c[field] === 'string' && c[field].trim().length > 3,
                `${k}.${field} is empty — an error missing any one of these is the one that gets screenshotted and forwarded`);
        }
        // The reader's fear on every one of these is that their staged work is gone. Saying so is the means line's whole job, so a means line that never mentions it has drifted from the rule that put it there.
        assert.ok(/stag|written|reach/i.test(c.means), `${k}.means never says what happened to their work`);
    }
});

check('THE COPY GATE CAN FAIL: an empty means line is caught', () => {
    assert.throws(() => {
        // Every other field is deliberately VALID, so the only thing that can fail this is the empty one. A fixture that trips an earlier assertion proves the earlier assertion and says nothing about the field under test — which is what the first version of this falsifier did.
        const c = { k: 'PROBLEM', what: 'Something went wrong', means: '', action: 'Try again' };
        for (const field of ['k', 'what', 'means', 'action']) {
            assert.ok(typeof c[field] === 'string' && c[field].trim().length > 3, `${field} is empty`);
        }
    }, /means is empty/);
});

// ── CLASSIFICATION ────────────────────────────────────────────────────────────
check('a real answer is not a failure', () => {
    assert.strictEqual(failureOf({ live: {}, httpStatus: 200 }), null);
    assert.strictEqual(failureOf({ ok: true, httpStatus: 200 }), null);
});

check('each transport problem gets its own kind', () => {
    assert.strictEqual(failureOf({ signedOut: true }).kind, 'expired');
    assert.strictEqual(failureOf({ forbidden: true }).kind, 'forbidden');
    assert.strictEqual(failureOf({ failed: true, offline: true, status: 0 }).kind, 'offline');
    assert.strictEqual(failureOf({ failed: true, status: 500 }).kind, 'server');
    // ⚠️ A 200 whose body is not JSON is a DIFFERENT cause from a 500 and has a different fix: something in front of the portal answered instead of the portal. Telling the reader the server could not answer sends them to the wrong logs.
    assert.strictEqual(failureOf({ failed: true, unreadable: true, status: 200 }).kind, 'bad-response');
    // A missing payload cannot be an answer. This is the case a `!payload` guard exists for and the one a truthiness test on `.failed` would sail straight past.
    assert.strictEqual(failureOf(undefined).kind, 'bad-response');
});

check('a 4xx that carries the server\'s own sentence uses that sentence', () => {
    const f = failureOf({ error: 'not a valid changeset id', httpStatus: 400 });
    assert.strictEqual(f.kind, 'refused');
    assert.strictEqual(f.what, 'not a valid changeset id');
});

// 🔴 THE REGRESSION THIS FILE EXISTS TO PREVENT. Making fetchJson non-throwing nearly collapsed every non-2xx into a generic failure — which would have silently destroyed the commit gate's 409, whose body {ok:false, reason} carries the only explanation the reader ever sees for a refused tier-3 commit. `failureOf` must not touch it; `refusalOf` is what reads it.
check('the commit gate\'s 409 is an ANSWER, not a transport failure', () => {
    const gate = { ok: false, reason: 'Type the exact changeset id to confirm.', httpStatus: 409 };
    assert.strictEqual(failureOf(gate), null, 'failureOf must leave a well-formed refusal alone');
    assert.strictEqual(refusalOf(gate), 'Type the exact changeset id to confirm.');
});

check('a write that landed is not a refusal', () => {
    assert.strictEqual(refusalOf({ ok: true, httpStatus: 200 }), null);
    // ⚠️ Discard answers {state:'discarded'} with NO `ok` key at all. A refusal test written as `!result.ok` would call every successful discard a failure — and the realm would show an error over a change that really was discarded.
    assert.strictEqual(refusalOf({ state: 'discarded', httpStatus: 200 }), null);
});

check('a write that failed in transport is also a refusal, in one string', () => {
    assert.strictEqual(refusalOf({ failed: true, offline: true, status: 0 }), FAILURE_COPY.offline.what);
    assert.strictEqual(refusalOf({ ok: false, httpStatus: 409 }), 'The server refused the change.');
});

check('THE REFUSAL GATE CAN FAIL: a silent no is not reported as success', () => {
    assert.notStrictEqual(refusalOf({ ok: false, reason: 'nope', httpStatus: 409 }), null);
});

check('the slow threshold is a real number a component can use', () => {
    const d = asyncDefaults();
    assert.ok(d.slowAfterMs > 0 && d.slowAfterMs < 10000, `implausible threshold ${d.slowAfterMs}`);
    assert.ok(Array.isArray(d.skeleton.lines) && d.skeleton.lines.length >= 2);
});

// ── THE CLIENT ────────────────────────────────────────────────────────────────
//
// Executed rather than pattern-matched, the same way portalHarness.test.js runs the stub: two regexes agreeing proves the regexes agree.
function loadClient() {
    const src = fs.readFileSync(path.join(__dirname, '..', 'portal', 'ui', 'httpClient.js'), 'utf8')
        .replace(/^export\s+/gm, '');
    const mod = { exports: {} };
    // eslint-disable-next-line no-new-func
    new Function('module', 'fetch', src + '\nmodule.exports = { fetchJson };')(mod, global.__fetch);
    return mod.exports.fetchJson;
}
function withFetch(impl, fn) {
    global.__fetch = impl;
    return fn(loadClient());
}
const res = (status, body, json = true) => ({
    status, ok: status >= 200 && status < 300,
    json: async () => { if (!json) throw new SyntaxError('Unexpected token < in JSON at position 0'); return body; },
});

async function main() {
    await checkAsync('a 401 and a 403 stay the two shapes every realm already reads', async () => {
        await withFetch(async () => res(401, {}), async (f) => assert.deepStrictEqual(await f('/x'), { signedOut: true }));
        await withFetch(async () => res(403, {}), async (f) => assert.deepStrictEqual(await f('/x'), { forbidden: true }));
    });

    await checkAsync('a 409 body survives the client completely untouched', async () => {
        await withFetch(async () => res(409, { ok: false, reason: 'wrong word' }), async (f) => {
            const body = await f('/x', { method: 'POST' });
            assert.strictEqual(body.ok, false);
            assert.strictEqual(body.reason, 'wrong word', 'the server\'s own sentence must reach the caller');
            assert.strictEqual(body.httpStatus, 409);
        });
    });

    await checkAsync('a fetch that never lands resolves instead of throwing', async () => {
        await withFetch(async () => { throw new TypeError('Failed to fetch'); }, async (f) => {
            const body = await f('/x');
            assert.strictEqual(body.failed, true);
            assert.strictEqual(body.offline, true);
            assert.strictEqual(failureOf(body).kind, 'offline');
        });
    });

    await checkAsync('a 500 whose body is an HTML error page resolves instead of throwing', async () => {
        await withFetch(async () => res(500, null, false), async (f) => {
            const body = await f('/x');
            assert.strictEqual(body.failed, true);
            assert.strictEqual(body.unreadable, true);
        });
    });

    await checkAsync('THE CLIENT GATE CAN FAIL: a thrown fetch is not silently reported as a real payload', async () => {
        await withFetch(async () => { throw new Error('boom'); }, async (f) => {
            assert.notStrictEqual(failureOf(await f('/x')), null);
        });
    });

    say(failures ? `\n✗ ${failures} failed` : '\n✅ portalAsync: every request state is classified, and a refusal survives the client');
    process.exit(failures ? 1 : 0);
}

async function checkAsync(name, fn) {
    try { await fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
main();
