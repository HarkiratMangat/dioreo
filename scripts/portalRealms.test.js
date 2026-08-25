// scripts/portalRealms.test.js Task 6's four realms reuse <Shell>/<Manifest> unchanged and supply only their view layer (spec §8.2). Their pure functions already live in portal/api/*.js (coverageFlags, singlePointsOfFailure, the event-river merge) rather than a duplicate .logic.js copy — this file is what tests them as data, matching scripts/portalUi.test.js's "render functions are pure" story.
const assert = require('assert');
const { coverageFlags } = require('../portal/api/armory');
const { singlePointsOfFailure, buildPermissionMatrix } = require('../portal/api/access');

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

// 🔴 A BARE `manage` HELD BY ONE PERSON IS THE MOST CONSEQUENTIAL SINGLE POINT THERE IS -- lose them and you lose every /manage page at once -- and it was the one case singlePointsOfFailure() structurally could not report. Its loop expanded `manage` into the eight page scopes inside an `else if`, so it never recorded a holder for `manage` ITSELF: the token always showed 0 holders and therefore never qualified. Found 2026-08-24 while rebuilding the Access mockup on the real permission model, when the page's own count (6) disagreed with the endpoint's (5).
check('Access By-scope flags a bare "manage" held by exactly one admin', () => {
    const spof = singlePointsOfFailure([{ discordId: 'A', permissions: ['manage'] }]);
    assert.ok(spof.some(s => s.scope === 'manage' && s.discordId === 'A'),
        'a lone holder of the full manage token is a single point of failure for every page at once');
});

check('Access By-scope still flags every page a lone bare-"manage" holder inherits', () => {
    // The expansion must SURVIVE the fix above -- reporting `manage` while dropping the pages would trade one blind spot for eight.
    const spof = singlePointsOfFailure([{ discordId: 'A', permissions: ['manage'] }]);
    for (const page of ['manage.draws', 'manage.calendar', 'manage.season', 'manage.announcement']) {
        assert.ok(spof.some(s => s.scope === page && s.discordId === 'A'), `${page} should still be reported`);
    }
});

// 🔴 ONE PERSON, COUNTED TWICE. `parsePermissionsInput` accepts "manage, manage.draws", and the holder map then received that admin TWICE for manage.draws — once from the bare-token expansion and once from the explicit token — so ids.length === 2 and the scope they hold MOST explicitly was the one scope not reported. Latent before the 2026-08-24 fix (the expansion was in an `else if`, so the two paths were mutually exclusive); the if/if shape that fix needs makes it reachable, which is exactly why it belongs in a test rather than in a comment.
check('Access By-scope counts one admin once, even holding both "manage" and "manage.draws"', () => {
    const spof = singlePointsOfFailure([{ discordId: 'A', permissions: ['manage', 'manage.draws'] }]);
    assert.ok(spof.some(s => s.scope === 'manage.draws' && s.discordId === 'A'),
        'a scope held both directly and by inheritance still has exactly ONE holder');
});

check('Access By-scope does NOT flag a bare "manage" held by two admins', () => {
    const spof = singlePointsOfFailure([{ discordId: 'A', permissions: ['manage'] }, { discordId: 'B', permissions: ['manage'] }]);
    assert.ok(!spof.some(s => s.scope === 'manage'), 'two holders is not a single point');
});

// 🔴 `grantedAt` IS A REAL STORED FIELD. models/AdminUser.js has declared it since 566b3ca (2026-08-13), ten days before portal/api/access.js was last touched with a comment asserting the model "has no timestamp at all" -- and every live document carries one. Deriving it from the ObjectId discards that value AND answers a different question: an ObjectId timestamp is the DOCUMENT'S creation and never moves when permissions are later edited, which is exactly what a "granted" date should reflect.
check('buildPermissionMatrix reports the STORED grantedAt, not one derived from the ObjectId', () => {
    const stored = new Date('2026-08-13T09:00:00.000Z');
    const { admins } = buildPermissionMatrix([{
        _id: '6a8b3ed58c812c59751d92e6',   // its own embedded timestamp is 2026-08-23, ten days later
        discordId: 'D', permissions: ['bot'], grantedAt: stored,
    }]);
    assert.strictEqual(new Date(admins[0].grantedAt).toISOString(), stored.toISOString());
});

check('buildPermissionMatrix falls back to the ObjectId timestamp when grantedAt is absent', () => {
    // A document written before the field existed still has to report something rather than null.
    const { admins } = buildPermissionMatrix([{ _id: '6a8b3ed58c812c59751d92e6', discordId: 'E', permissions: ['bot'] }]);
    assert.ok(admins[0].grantedAt instanceof Date, 'a pre-field document still gets a derived date');
    assert.strictEqual(new Date(admins[0].grantedAt).toISOString().slice(0, 10), '2026-08-23');
});

check('Access By-scope does NOT flag a scope held by two or more admins', () => {
    const admins = [{ discordId: 'A', permissions: ['bot'] }, { discordId: 'B', permissions: ['bot'] }];
    const spof = singlePointsOfFailure(admins);
    assert.ok(!spof.some(s => s.scope === 'bot'), 'a scope held by two admins is not a single point of failure');
});

// 🔴 `grants[key]` IS NO LONGER A BOOLEAN. It is {direct, inherited, held} as of the Phase 3 grid (2026-08-23): a bare `manage` token lights every page column, but you did not hand those pages over individually and revoking `manage` takes all of them back at once. Collapsing the two into one boolean is exactly what made the old comma-separated permission string unreadable, so the grid has to be able to tell them apart. `held` is the old boolean, preserved for any caller that only cares whether the scope is reachable.
check('buildPermissionMatrix distinguishes a DIRECT grant from one INHERITED via bare "manage"', () => {
    const { admins, scopes } = buildPermissionMatrix([{ discordId: 'A', permissions: ['manage'] }]);
    assert.ok(scopes.some(s => s.key === 'manage.draws' && s.kind === 'page'));
    assert.ok(scopes.some(s => s.key === 'bot' && s.kind === 'command'));
    assert.deepStrictEqual(admins[0].grants['manage.draws'], { direct: false, inherited: true, held: true });
    assert.deepStrictEqual(admins[0].grants['manage.loadouts_dmz'], { direct: false, inherited: true, held: true });
    assert.deepStrictEqual(admins[0].grants.manage, { direct: true, inherited: false, held: true },
        'the token itself is a DIRECT grant on its own command column');
    assert.deepStrictEqual(admins[0].grants.bot, { direct: false, inherited: false, held: false },
        'bare "manage" grants every /manage page, never bot/autobuild');
});

check('buildPermissionMatrix grants only the named page for a scoped admin, and marks it direct', () => {
    const { admins } = buildPermissionMatrix([{ discordId: 'B', permissions: ['manage.calendar', 'bot'] }]);
    assert.deepStrictEqual(admins[0].grants['manage.calendar'], { direct: true, inherited: false, held: true });
    assert.deepStrictEqual(admins[0].grants['manage.draws'], { direct: false, inherited: false, held: false });
    assert.deepStrictEqual(admins[0].grants.bot, { direct: true, inherited: false, held: true });
});

check('a scope held directly is never ALSO reported as inherited', () => {
    // Both halves true would double-count the scope in By-scope's holder chips and paint the grid cell in two states at once.
    const { admins, scopes } = buildPermissionMatrix([{ discordId: 'C', permissions: ['manage', 'manage.calendar'] }]);
    for (const s of scopes) {
        const g = admins[0].grants[s.key];
        assert.ok(!(g.direct && g.inherited), `${s.key} is reported as both direct and inherited`);
        assert.strictEqual(g.held, g.direct || g.inherited, `${s.key}: held must equal direct || inherited`);
    }
    assert.strictEqual(admins[0].grants['manage.calendar'].direct, true, 'an explicit page grant beside bare manage stays DIRECT');
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
    // A real raw calendar subdocument's start field is `date` (core/ops/calendar.js's own stored shape), never `startDate` -- this fixture used to say `startDate` directly, which happened to pass against the OLD code but never matched what toManifestRows actually spreads from live data. Fixed alongside the `date`->`startDate` rename regression test below.
    const row = { id: 'x3', lane: 'calendar', title: 'Season launch', date: '2026-08-01', endDate: '2026-08-08' };
    const op = buildSeasonEditOp(row, 'title', 'Season 8 launch');
    assert.strictEqual(op.type, 'calendar.edit');
    assert.strictEqual(op.payload.title, 'Season 8 launch');
    assert.strictEqual(op.payload.startDate, '2026-08-01');
});

check('buildSeasonEditOp on a calendar row whose real field is `date` (not `startDate`) renames it before sending -- core/ops/calendar.js’s validateEvent reads raw payload.startDate even though the STORED field is `date`', () => {
    const row = { id: 'x4', lane: 'calendar', title: 'Clan Wars', date: '2026-08-01', endDate: '2026-08-08' };
    const op = buildSeasonEditOp(row, 'title', 'Clan Wars Rerun');
    assert.strictEqual(op.payload.startDate, '2026-08-01');
    assert.strictEqual(op.payload.date, undefined, 'a stray `date` key would be silently discarded by validateEvent’s normalized output, but the START value must survive under the key it actually reads');
});

const { buildArmoryAddOp, buildArmoryEditOp, parseBadgesToken } = require('../portal/ui/armory.logic');

check('parseBadgesToken parses meta/best/toxic/topN tokens', () => {
    const r = parseBadgesToken('meta, top3, toxic', 'MP');
    assert.strictEqual(r.isMeta, true);
    assert.strictEqual(r.categoryRank, 'top3');
    assert.strictEqual(r.isToxic, true);
    assert.deepStrictEqual(r.unrecognized, []);
});

check('parseBadgesToken moves a bare categoryRank onto dmzRangeRank for DMZ mode', () => {
    const r = parseBadgesToken('top3', 'DMZ');
    assert.strictEqual(r.categoryRank, null);
    assert.strictEqual(r.dmzRangeRank, 'top3');
});

check('parseBadgesToken reports an unrecognized token instead of silently dropping it', () => {
    const r = parseBadgesToken('meta, bogus', 'MP');
    assert.deepStrictEqual(r.unrecognized, ['bogus']);
});

check('buildArmoryAddOp builds a loadout.add op with badges parsed from the token field', () => {
    const op = buildArmoryAddOp({ weaponName: 'AK-47', category: 'AR', buildName: 'No Recoil', mode: 'MP', attachments: ['a', 'b'], badges: 'meta' });
    assert.strictEqual(op.type, 'loadout.add');
    assert.strictEqual(op.payload.mode, 'MP');
    assert.strictEqual(op.payload.weaponName, 'AK-47');
    assert.strictEqual(op.payload.isMeta, true);
});

check('buildArmoryEditOp edits a field via loadout.edit, targeting { id }, preserving weaponKey/mode', () => {
    const row = { id: 'l1', weaponKey: 'ak-47', mode: 'MP', category: 'AR', buildName: 'No Recoil', attachments: ['a'], isMeta: false, isToxic: false, categoryRank: null };
    const op = buildArmoryEditOp(row, 'isMeta', true);
    assert.strictEqual(op.type, 'loadout.edit');
    assert.deepStrictEqual(op.target, { id: 'l1' });
    assert.strictEqual(op.payload.isMeta, true);
    assert.strictEqual(op.payload.weaponKey, 'ak-47');
});

const { buildBroadcastAddOp, buildBroadcastEditOp } = require('../portal/ui/broadcast.logic');

check('buildBroadcastAddOp builds an announcement.post op', () => {
    const op = buildBroadcastAddOp({ text: 'Season 8 is live', expiresAt: '2026-10-01', startsAt: null, color: 0xf2c230 });
    assert.strictEqual(op.type, 'announcement.post');
    assert.strictEqual(op.payload.text, 'Season 8 is live');
    assert.strictEqual(op.payload.expiresAt, '2026-10-01');
});

check('buildBroadcastEditOp edits an announcement via announcement.edit, targeting { id }', () => {
    const row = { id: 'a1', text: 'Old text', expiresAt: '2026-10-01', startsAt: null };
    const op = buildBroadcastEditOp(row, 'text', 'New text');
    assert.strictEqual(op.type, 'announcement.edit');
    assert.deepStrictEqual(op.target, { id: 'a1' });
    assert.strictEqual(op.payload.text, 'New text');
});

process.exit(failures ? 1 : 0);
