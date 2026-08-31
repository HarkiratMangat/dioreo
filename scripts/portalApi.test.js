// scripts/portalApi.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { gateCommit } = require('../portal/api/policy');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  \u2713 ${name}`); }
    catch (e) { failures++; console.error(`  \u2717 ${name}\n      ${e.message}`); }
}

check('a tier-3 changeset will not commit until it has been exported', () => {
    const r = gateCommit({ tier: 3, exportedAt: null, confirmText: 'Nightfall', expectText: 'Nightfall' });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /export/i);
});

check('a tier-3 changeset will not commit on a wrong typed confirmation', () => {
    const r = gateCommit({ tier: 3, exportedAt: new Date(), confirmText: 'nightfal', expectText: 'Nightfall' });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /confirm/i);
});

check('a tier-3 changeset with both gates satisfied commits', () => {
    assert.strictEqual(gateCommit({ tier: 3, exportedAt: new Date(), confirmText: 'Nightfall', expectText: 'Nightfall' }).ok, true);
});

check('tier 1 and 2 need neither gate', () => {
    assert.strictEqual(gateCommit({ tier: 1 }).ok, true);
    assert.strictEqual(gateCommit({ tier: 2 }).ok, true);
});

// Source-scan, matching the shape of scripts/botAccessPermissions.test.js: asserts an invariant rather than a unit. Every route registered anywhere in portal/api/ -- GET as well as POST -- must wrap its handler in requireAdmin. Extended to GET here (gap audit plan Task 2.5's own Step 4 flagged that this used to only scan POST): a GET route in this directory always returns admin-scoped data (permission grids, staged changesets, analytics), so an unguarded GET is exactly as real a leak as an unguarded mutation. portal/auth.js's own login/callback GETs are the one legitimate pre-auth exception, and they live outside this directory entirely, so this scan never has to special-case them.
check('every route (GET or POST) in portal/api/ is wrapped in requireAdmin', () => {
    const fs = require('fs'), path = require('path');
    const dir = path.join(__dirname, '..', 'portal', 'api');
    const bad = [];
    for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.js')) continue;
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        for (const m of src.matchAll(/route\(\s*'(?:GET|POST)'\s*,\s*([^,]+),\s*([^)]+)\)/g)) {
            if (!/requireAdmin/.test(m[2])) bad.push(`${f}: ${m[1].trim()}`);
        }
    }
    assert.deepStrictEqual(bad, [], `unguarded routes: ${bad.join(', ')}`);
});

// ── MALFORMED IDS ────────────────────────────────────────────────────────────────────────────
//
// 🔴 A CLIENT MISTAKE WAS REPORTED AS A SERVER ERROR, on six routes across two files, and it took booting the real server to see it: every route that looks a document up by a client-supplied id handed the raw string to Mongoose, which throws a CastError on anything that is not 24 hex characters. `?id=x` produced a 500 with a full stack in the log and "Something went wrong. It has been logged." in the response.
const { isObjectId } = require('../portal/api/httpUtil');

check('a real ObjectId passes and anything Mongoose would refuse does not', () => {
    assert.strictEqual(isObjectId('6a8b8e35493f2fb63caf63d2'), true);
    assert.strictEqual(isObjectId('6A8B8E35493F2FB63CAF63D2'), true, 'hex is case-insensitive');
    assert.strictEqual(isObjectId('x'), false);
    assert.strictEqual(isObjectId('6a8b8e35493f2fb63caf63d'), false, '23 characters is not an id');
    assert.strictEqual(isObjectId('6a8b8e35493f2fb63caf63d22'), false, 'nor is 25');
    assert.strictEqual(isObjectId('zzzzzzzzzzzzzzzzzzzzzzzz'), false, 'right length, not hex');
    assert.strictEqual(isObjectId(''), false);
    assert.strictEqual(isObjectId(null), false);
    assert.strictEqual(isObjectId(undefined), false);
    assert.strictEqual(isObjectId({}), false, 'a non-string must never pass — an object reaching a query is worse than a bad string');
});

// A source scan in the same shape as the requireAdmin one above: every route that takes an id out of the URL must gate it before the query, or the CastError comes back.
check('every changeset route guards its id before querying', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'portal', 'api', 'changesets.js'), 'utf8');
    const takes = (src.match(/const id = segment\(url, 2\);/g) || []).length;
    const guards = (src.match(/if \(!isObjectId\(id\)\) return sendJson\(res, 400/g) || []).length;
    assert.ok(takes > 0, 'the scan found no id-taking routes, which means it is looking at the wrong thing');
    assert.strictEqual(guards, takes, `${takes} routes read an id from the URL and ${guards} guard it`);
});

process.exit(failures ? 1 : 0);
