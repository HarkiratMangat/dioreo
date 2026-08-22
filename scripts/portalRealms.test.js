// scripts/portalRealms.test.js Task 6's four realms reuse <Shell>/<Manifest> unchanged and supply only their view layer (spec §8.2). Their pure functions already live in portal/api/*.js (coverageFlags, singlePointsOfFailure, the event-river merge) rather than a duplicate .logic.js copy — this file is what tests them as data, matching scripts/portalUi.test.js's "render functions are pure" story.
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

const { buildSeasonAddOp, buildSeasonEditOp } = require('../portal/ui/season.logic');

check('buildSeasonAddOp builds a draw.add op with the real "new"/"returning" category vocabulary, not the Manifest lane name', () => {
    const op = buildSeasonAddOp('draw', { title: 'Wraith', endDate: '2026-09-01', items: ['a', 'b'] });
    assert.strictEqual(op.type, 'draw.add');
    assert.strictEqual(op.payload.title, 'Wraith');
    assert.strictEqual(op.payload.category, 'new');
});

check('buildSeasonAddOp builds a draw.add op with category "returning" for kind=returning', () => {
    const op = buildSeasonAddOp('returning', { title: 'Havoc rerun', endDate: '2026-09-01' });
    assert.strictEqual(op.payload.category, 'returning');
});

check('buildSeasonAddOp builds a calendar.add op for kind=event', () => {
    const op = buildSeasonAddOp('event', { title: 'Clan wars', startDate: '2026-09-01', endDate: '2026-09-08' });
    assert.strictEqual(op.type, 'calendar.add');
});

check('buildSeasonEditOp on a draw row edits the date via draw.edit (real schema field is date, not the Manifest display key endDate), mapping the Manifest lane back to "new"/"returning"', () => {
    const row = { id: 'x1', lane: 'newDraws', title: 'Iron Wolf', items: ['a'], endDate: '2026-08-10T00:00:00.000Z' };
    const op = buildSeasonEditOp(row, 'endDate', '2026-08-13');
    assert.strictEqual(op.type, 'draw.edit');
    assert.strictEqual(op.target.category, 'new');
    assert.strictEqual(op.payload.date, '2026-08-13', 'core/ops/draws.js validates payload.date, not payload.endDate -- a real pre-existing bug found and fixed this session');
    assert.strictEqual(op.payload.endDate, undefined, 'the wrong field name must not also be sent -- Mongoose silently drops it, which is exactly how this bug shipped a draw with no date at all');
    assert.deepStrictEqual(op.payload.items, ['a']);
});

check('buildSeasonEditOp on a returningDraws row maps to category "returning"', () => {
    const row = { id: 'x2', lane: 'returningDraws', title: 'Shadow Blade rerun', endDate: '2026-08-13' };
    const op = buildSeasonEditOp(row, 'title', 'Shadow Blade Rerun');
    assert.strictEqual(op.target.category, 'returning');
});

check('buildSeasonEditOp on an event row edits via calendar.edit and passes a chrono-parseable date string', () => {
    const row = { id: 'x3', lane: 'calendar', title: 'Season launch', startDate: '2026-08-01', endDate: '2026-08-08' };
    const op = buildSeasonEditOp(row, 'title', 'Season 8 launch');
    assert.strictEqual(op.type, 'calendar.edit');
    assert.strictEqual(op.payload.title, 'Season 8 launch');
    assert.strictEqual(op.payload.startDate, '2026-08-01');
});

process.exit(failures ? 1 : 0);
