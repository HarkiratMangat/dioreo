// scripts/portalApi.test.js
const assert = require('assert');
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

// Source-scan, matching the shape of scripts/botAccessPermissions.test.js: asserts an invariant rather than a unit. Every mutating (POST) route registered anywhere in portal/api/ must wrap its handler in requireAdmin \u2014 a client-reachable POST route with no requireAdmin call in its own registration line is a route this test can catch mechanically, before it ever ships.
check('every mutating route is wrapped in requireAdmin', () => {
    const fs = require('fs'), path = require('path');
    const dir = path.join(__dirname, '..', 'portal', 'api');
    const bad = [];
    for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.js')) continue;
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        for (const m of src.matchAll(/route\(\s*'POST'\s*,\s*([^,]+),\s*([^)]+)\)/g)) {
            if (!/requireAdmin/.test(m[2])) bad.push(`${f}: ${m[1].trim()}`);
        }
    }
    assert.deepStrictEqual(bad, [], `unguarded POST routes: ${bad.join(', ')}`);
});

process.exit(failures ? 1 : 0);
