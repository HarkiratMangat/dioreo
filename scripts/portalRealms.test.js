// scripts/portalRealms.test.js
// Task 6's four realms reuse <Shell>/<Manifest> unchanged and supply only their view layer (spec
// §8.2). Their pure functions already live in portal/api/*.js (coverageFlags, singlePointsOfFailure,
// the event-river merge) rather than a duplicate .logic.js copy — this file is what tests them as
// data, matching scripts/portalUi.test.js's "render functions are pure" story.
const assert = require('assert');
const { coverageFlags } = require('../portal/api/armory');
const { singlePointsOfFailure } = require('../portal/api/access');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  \u2713 ${name}`); }
    catch (e) { failures++; console.error(`  \u2717 ${name}\n      ${e.message}`); }
}

check('Armory Coverage flags a build with no image', () => {
    const build = { mode: 'MP', attachments: ['a', 'b', 'c', 'd', 'e'], isMeta: true, lastUpdated: new Date() };
    assert.ok(coverageFlags(build, []).includes('missing-image'));
});

check('Armory Coverage flags the wrong attachment count for the build\u0027s mode', () => {
    const mp = { mode: 'MP', imageKey: 'x', attachments: ['a', 'b'], isMeta: true, lastUpdated: new Date() };
    assert.ok(coverageFlags(mp, []).includes('wrong-attachment-count'));
    const dmz = { mode: 'DMZ', imageKey: 'x', attachments: Array(9).fill('a'), isMeta: true, lastUpdated: new Date() };
    assert.ok(!coverageFlags(dmz, []).includes('wrong-attachment-count'));
});

check('Armory Coverage flags a build not updated in 90 days', () => {
    const stale = { mode: 'MP', imageKey: 'x', attachments: Array(5).fill('a'), isMeta: true, lastUpdated: new Date(Date.now() - 100 * 86400000) };
    assert.ok(coverageFlags(stale, []).includes('stale-90d'));
    const fresh = { ...stale, lastUpdated: new Date() };
    assert.ok(!coverageFlags(fresh, []).includes('stale-90d'));
});

check('Access By-scope flags a scope held by exactly one non-owner admin', () => {
    const admins = [{ discordId: 'A', permissions: ['bot'] }, { discordId: 'B', permissions: ['manage.draws'] }];
    const spof = singlePointsOfFailure(admins);
    assert.ok(spof.some(s => s.scope === 'bot' && s.discordId === 'A'));
    assert.ok(spof.some(s => s.scope === 'manage.draws' && s.discordId === 'B'));
});

check('Access By-scope does NOT flag a scope held by two or more admins', () => {
    const admins = [{ discordId: 'A', permissions: ['bot'] }, { discordId: 'B', permissions: ['bot'] }];
    const spof = singlePointsOfFailure(admins);
    assert.ok(!spof.some(s => s.scope === 'bot'), 'a scope held by two admins is not a single point of failure');
});

process.exit(failures ? 1 : 0);
