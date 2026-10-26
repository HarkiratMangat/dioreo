// scripts/permissions.test.js — the two-tier permission model (core/permissions.js + utils/adminAccess.js), offline.
//
// Added 2026-10-19 19:32 EDT with the permission restructure (docs/superpowers/specs/2026-10-19-permission-restructure-design.md). A regression here does not render something wrong, it hands someone a write they were never given, so most of these are behavioural checks over the real gate with stubbed rows, plus conservation checks that make an unclassified op or action a test failure instead of a silent hole:
//   - every registered op has exactly one tier, and the table names no op that no longer exists
//   - every /manage registry action that writes resolves to a tier
//   - carry-down: /manage -> its 8 pages, /autobuild -> MP + DMZ, /bot -> every /bot and /manage page, and nothing else
//   - the approved button list, spot-checked against the tiers it was approved with
//   - checkOps, checkRevert, resolveAction and the pop-up-first Season entries through the real adminAccess code
//   - the legacy bridge keeps each old token's OLD meaning
//
// Runs with no network: models/AdminUser and models/Loadout are stubbed via require.cache, the pattern scripts/botAccessPermissions.test.js uses.

const assert = require('assert');

// The real model is loaded first, for its update hook (the last check), and only then replaced by the stub every other check reads through.
const RealAdminUser = require('../models/AdminUser');
const adminUserPath = require.resolve('../models/AdminUser');
let fakeAdmins = [];
require.cache[adminUserPath] = {
    id: adminUserPath, filename: adminUserPath, loaded: true, exports: {
        find: () => ({ select: () => ({ lean: async () => fakeAdmins }) }),
    },
};
const loadoutPath = require.resolve('../models/Loadout');
let fakeLoadouts = [];
require.cache[loadoutPath] = {
    id: loadoutPath, filename: loadoutPath, loaded: true, exports: {
        find: (query) => ({ select: () => ({ lean: async () => fakeLoadouts.filter((d) => query._id.$in.includes(String(d._id))) }) }),
    },
};

const P = require('../core/permissions');
const A = require('../utils/adminAccess');
const ops = require('../core/ops');
const { checkOps } = require('../core/changeset');
const { ACTIONS_BY_PAGE, resolveAction, resolvePopupEntry } = require('../utils/manageActions');
const { ALLOWED_ADMIN_ID } = require('../utils/owner');

const ID = {
    manageC: '100000000000000001',      // manage: c
    manageCD: '100000000000000002',     // manage: cd
    drawsD: '100000000000000003',       // manage.draws: d
    dmzC: '100000000000000004',         // manage.loadouts_dmz: c + d
    autobuild: '100000000000000005',    // autobuild: c
    botC: '100000000000000006',         // bot: c
    healthOnly: '100000000000000007',   // bot.health: c
    legacyBot: '100000000000000008',    // permissions: ['bot']
    legacyMgrD: '100000000000000009',   // permissions: ['manage.draws', 'destructive']
    nobody: '100000000000000010',
    seasonC: '100000000000000011',      // manage.season: c
};

function setAdmins() {
    fakeAdmins = [
        { discordId: ID.manageC, grants: [{ scope: 'manage', tiers: ['create'] }] },
        { discordId: ID.manageCD, grants: [{ scope: 'manage', tiers: ['create', 'destructive'] }] },
        { discordId: ID.drawsD, grants: [{ scope: 'manage.draws', tiers: ['destructive'] }] },
        { discordId: ID.dmzC, grants: [{ scope: 'manage.loadouts_dmz', tiers: ['create', 'destructive'] }] },
        { discordId: ID.autobuild, grants: [{ scope: 'autobuild', tiers: ['create'] }] },
        { discordId: ID.botC, grants: [{ scope: 'bot', tiers: ['create'] }] },
        { discordId: ID.healthOnly, grants: [{ scope: 'bot.health', tiers: ['create'] }] },
        { discordId: ID.legacyBot, permissions: ['bot'] },
        { discordId: ID.legacyMgrD, permissions: ['manage.draws', 'destructive'] },
        { discordId: ID.seasonC, grants: [{ scope: 'manage.season', tiers: ['create'] }] },
    ];
    A.invalidateAdminCache();
}

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
}

const NON_WRITING_ACTIONS = new Set(['formatguide', 'exportnew', 'exportreturning', 'export', 'exportall', 'exportupto5', 'exportcategory']);

async function run() {
    console.log('Permissions: the two-tier model\n');
    setAdmins();

    // ── The table ──────────────────────────────────────────────────────────
    await check('🔴 every registered op has a tier, and every tier names a registered op', () => {
        const registered = new Set(ops.listOpTypes());
        const missing = [...registered].filter((t) => !P.OP_TIERS[t]);
        const stale = Object.keys(P.OP_TIERS).filter((t) => !registered.has(t));
        assert.deepStrictEqual(missing, [], `ops with no tier (they would be owner-only by accident): ${missing.join(', ')}`);
        assert.deepStrictEqual(stale, [], `OP_TIERS names ops that no longer exist: ${stale.join(', ')}`);
        for (const [t, tier] of Object.entries(P.OP_TIERS)) assert.ok(P.TIERS.includes(tier), `${t} has tier "${tier}"`);
    });

    await check('every /manage action that writes resolves to exactly one tier; the read-only ones resolve to none', () => {
        for (const [page, actions] of Object.entries(ACTIONS_BY_PAGE)) {
            for (const a of actions) {
                const tier = P.tierForAction(page, a.id);
                if (NON_WRITING_ACTIONS.has(a.id)) assert.strictEqual(tier, null, `${page}:${a.id} writes nothing but has tier ${tier}`);
                else assert.ok(P.TIERS.includes(tier), `${page}:${a.id} has no tier`);
            }
        }
    });

    await check('the approved button list: spot checks against the tiers it was approved with', () => {
        const expect = {
            'draws:addnew': 'create', 'draws:edit': 'create', 'draws:delete': 'destructive', 'draws:bulkadd': 'create',
            'draws:bulkreplace': 'create', 'draws:bulkdelete': 'destructive', 'draws:purgeall': 'destructive',
            'calendar:replacemultiple': 'create', 'calendar:deletemultiple': 'destructive',
            'announcement:post': 'create', 'patchnotes:addseason': 'create',
            'calendar:banners': 'create', 'calendar:purge': 'destructive',
            'loadouts_mp:delete': 'destructive', 'loadouts_dmz:add': 'create',
            'patchnotes:dateinfo': 'create', 'patchnotes:purge': 'destructive',
            'seasondraft:promote': 'destructive', 'seasondraft:discard': 'destructive', 'seasondraft:bulkdraws': 'create',
            'season:titlesdeadlines': 'create', 'season:wipe': 'destructive',
        };
        for (const [key, tier] of Object.entries(expect)) {
            const [page, id] = key.split(':');
            // Season's two entries are not registry buttons (they open from the dropdown) but they do map to ops, so tierForAction answers for them too. A renamed action fails here as null, never silently skipped.
            assert.strictEqual(P.tierForAction(page, id), tier, `${key} should be ${tier}`);
        }
        assert.strictEqual(P.UNDO_TIER, 'destructive', 'Undo/Revert is destructive (provisional, his decision 2026-10-19 18:33 EDT)');
        assert.strictEqual(P.CHANGE_EDIT_TIER, 'create');
        assert.strictEqual(P.OUTSIDE_ACTIONS['manage.announcementDelete'].tier, 'destructive');
        for (const k of ['rightclick.addToDraws', 'rightclick.addToCalendar', 'rightclick.addToPatchNotes', 'rightclick.autobuildLoadout', 'autobuild.confirm']) {
            assert.strictEqual(P.OUTSIDE_ACTIONS[k].tier, 'create', `${k} should be create`);
        }
        assert.strictEqual(P.OUTSIDE_ACTIONS['rightclick.autobuildLoadout'].scope, 'autobuild');
    });

    await check('every OUTSIDE_ACTIONS and POPUP_FIRST_ENTRIES entry names something real', () => {
        for (const [k, rule] of Object.entries(P.OUTSIDE_ACTIONS)) {
            assert.ok(P.isScope(rule.scope), `${k} names unknown scope ${rule.scope}`);
            assert.ok(P.isTier(rule.tier), `${k} names unknown tier ${rule.tier}`);
        }
        for (const [value, key] of Object.entries(P.POPUP_FIRST_ENTRIES)) {
            const [page, id] = key.split(':');
            assert.ok(P.tierForAction(page, id), `${value} -> ${key} resolves to no tier`);
        }
    });

    await check("🔴 /bot access is never a grantable scope, at any tier", () => {
        assert.ok(!P.SCOPES.some((s) => /access/i.test(s)), 'a scope mentioning access would let a grant reach the owner-only allowlist');
        assert.ok(!P.parseGrantsInput('bot.access: cd').ok);
        assert.ok(P.OWNER_ONLY.includes('/bot access'));
    });

    // ── Carry-down ─────────────────────────────────────────────────────────
    await check('carry-down: /manage -> exactly its 8 pages', () => {
        const t = P.expandGrants([{ scope: 'manage', tiers: ['create'] }]);
        const held = [...t].filter(([, s]) => s.size).map(([k]) => k).sort();
        assert.deepStrictEqual(held, ['manage', ...P.MANAGE_PAGES.map(P.manageScope)].sort());
        assert.strictEqual(P.MANAGE_PAGES.length, 8);
    });

    await check('carry-down: /autobuild -> MP and DMZ Loadouts only', () => {
        const t = P.expandGrants([{ scope: 'autobuild', tiers: ['create', 'destructive'] }]);
        const held = [...t].filter(([, s]) => s.size).map(([k]) => k).sort();
        assert.deepStrictEqual(held, ['autobuild', 'manage.loadouts_dmz', 'manage.loadouts_mp']);
    });

    await check('carry-down: /bot -> every /bot page and every /manage page, but not the /manage or /autobuild command scopes', () => {
        const t = P.expandGrants([{ scope: 'bot', tiers: ['destructive'] }]);
        const held = [...t].filter(([, s]) => s.size).map(([k]) => k).sort();
        assert.deepStrictEqual(held, ['bot', ...P.BOT_PAGES.map(P.botScope), ...P.MANAGE_PAGES.map(P.manageScope)].sort());
    });

    await check('a page grant adds to a carried one, and a tier never leaks to the other tier', () => {
        const t = P.expandGrants([{ scope: 'manage', tiers: ['create'] }, { scope: 'manage.draws', tiers: ['destructive'] }]);
        assert.deepStrictEqual([...t.get('manage.draws')].sort(), ['create', 'destructive']);
        assert.deepStrictEqual([...t.get('manage.calendar')], ['create']);
    });

    await check('stale scopes and tiers in a stored row are dropped, never thrown on', () => {
        const t = P.expandGrants([{ scope: 'manage.retired', tiers: ['create'] }, { scope: 'manage.draws', tiers: ['delete'] }, null]);
        assert.ok([...t.values()].every((s) => s.size === 0));
    });

    // ── The text format ───────────────────────────────────────────────────
    await check('parseGrantsInput: aliases, merging, table order, and round-trip through grantsToInput', () => {
        const r = P.parseGrantsInput('manage.calendar: d\nmanage: c, manage.calendar: create\nbot.health: cd');
        assert.ok(r.ok, r.error);
        assert.deepStrictEqual(r.grants, [
            { scope: 'manage', tiers: ['create'] },
            { scope: 'manage.calendar', tiers: ['create', 'destructive'] },
            { scope: 'bot.health', tiers: ['create', 'destructive'] },
        ]);
        assert.deepStrictEqual(P.parseGrantsInput(P.grantsToInput(r.grants)).grants, r.grants);
    });

    await check('parseGrantsInput rejects the whole submission on one bad entry, and never accepts the retired shorthands', () => {
        for (const bad of ['', 'manage', 'manage: x', 'nope: c', 'manage: c, destructive', 'all', 'all: cd', 'destructive: c']) {
            const r = P.parseGrantsInput(bad);
            assert.strictEqual(r.ok, false, `"${bad}" should be rejected`);
            assert.ok(r.error);
        }
    });

    await check('🔴 formatGrants renders every grant it is given, destructive included', () => {
        const s = P.formatGrants([{ scope: 'manage.draws', tiers: ['destructive'] }, { scope: 'bot', tiers: ['create'] }]);
        assert.ok(/Draws/.test(s) && /Destructive/.test(s), s);
        assert.ok(/\/bot: Create/.test(s), s);
        assert.strictEqual(P.formatGrants([]), '*(none)*');
    });

    // ── The legacy bridge ─────────────────────────────────────────────────
    await check("🔴 legacy 'bot' keeps its OLD meaning: analytics pages only, never a /manage page", async () => {
        const t = await A.effectiveTiers(ID.legacyBot);
        for (const p of P.BOT_PAGES) assert.ok(t.get(P.botScope(p)).size, `bot.${p}`);
        for (const p of P.MANAGE_PAGES) assert.strictEqual(t.get(P.manageScope(p)).size, 0, `legacy bot reached manage.${p}`);
        assert.strictEqual(await A.hasCommandAccess(ID.legacyBot, 'bot'), true);
    });

    await check("legacy 'destructive' means both tiers on the tokens it sat beside, and nowhere else", async () => {
        assert.strictEqual(await A.can(ID.legacyMgrD, 'manage.draws', 'destructive'), true);
        assert.strictEqual(await A.can(ID.legacyMgrD, 'manage.draws', 'create'), true);
        assert.strictEqual(await A.can(ID.legacyMgrD, 'manage.calendar'), false);
        assert.deepStrictEqual(P.legacyToGrants(['autobuild', 'destructive']), [{ scope: 'autobuild', tiers: ['create'] }]);
    });

    await check('a row with grants ignores its legacy permissions', () => {
        assert.deepStrictEqual(P.grantsOf({ grants: [{ scope: 'bot.health', tiers: ['create'] }], permissions: ['manage'] }), [{ scope: 'bot.health', tiers: ['create'] }]);
    });

    // ── The runtime gate ──────────────────────────────────────────────────
    await check('the owner holds every tier on every scope; a stranger holds nothing', async () => {
        for (const s of P.SCOPES) for (const t of P.TIERS) assert.strictEqual(await A.can(ALLOWED_ADMIN_ID, s, t), true);
        assert.strictEqual(await A.isAdmin(ID.nobody), false);
        assert.strictEqual(await A.hasCommandAccess(ID.nobody, 'manage'), false);
        assert.strictEqual(await A.hasCommandAccess(ID.nobody, 'bot'), false);
    });

    await check('hasCommandAccess: manage = any admin, bot = any /bot page, autobuild = create on /autobuild', async () => {
        assert.strictEqual(await A.hasCommandAccess(ID.healthOnly, 'manage'), true, 'every admin browses /manage');
        assert.strictEqual(await A.hasCommandAccess(ID.healthOnly, 'bot'), true);
        assert.strictEqual(await A.hasCommandAccess(ID.manageCD, 'bot'), false);
        assert.strictEqual(await A.hasCommandAccess(ID.autobuild, 'autobuild'), true);
        assert.strictEqual(await A.hasCommandAccess(ID.dmzC, 'autobuild'), false);
        assert.deepStrictEqual(await A.getBotPages(ID.healthOnly), ['health']);
        assert.deepStrictEqual(await A.getBotPages(ID.botC), P.BOT_PAGES);
    });

    await check('resolveAction: the button warns on the tier it lacks, and names it', async () => {
        const del = await resolveAction('draws', 'delete', ID.manageC);
        assert.strictEqual(del.ok, false);
        assert.ok(/destructive/i.test(del.message) && /Draws/.test(del.message), del.message);
        assert.strictEqual((await resolveAction('draws', 'addnew', ID.manageC)).ok, true);
        assert.strictEqual((await resolveAction('draws', 'addnew', ID.drawsD)).ok, false, 'destructive alone does not include create');
        assert.strictEqual((await resolveAction('draws', 'delete', ID.drawsD)).ok, true);
        assert.strictEqual((await resolveAction('calendar', 'add', ID.drawsD)).ok, false);
        assert.strictEqual((await resolveAction('draws', 'formatguide', ID.healthOnly)).ok, true, 'a read-only action needs only admin access');
        assert.strictEqual((await resolveAction('draws', 'formatguide', ID.nobody)).ok, false);
    });

    await check('the two pop-up-first Season entries are gated like their buttons; every other entry is free to browse', async () => {
        assert.strictEqual((await resolvePopupEntry('season_titlesdeadlines', ID.seasonC)).ok, true);
        const wipe = await resolvePopupEntry('season_wipe', ID.seasonC);
        assert.strictEqual(wipe.ok, false);
        assert.ok(/destructive/i.test(wipe.message), wipe.message);
        assert.strictEqual((await resolvePopupEntry('season_titlesdeadlines', ID.drawsD)).ok, false);
        assert.strictEqual((await resolvePopupEntry('draws', ID.healthOnly)).ok, true);
    });

    await check('checkOps: each op needs its tier on its page; an unclassified op is owner-only', async () => {
        assert.strictEqual((await checkOps(ID.manageC, [{ type: 'draw.add', payload: {} }])).ok, true);
        const purge = await checkOps(ID.manageC, [{ type: 'draw.add' }, { type: 'calendar.purge' }]);
        assert.strictEqual(purge.ok, false);
        assert.deepStrictEqual(purge.denied.map((d) => [d.index, d.scope, d.tier]), [[1, 'manage.calendar', 'destructive']]);
        assert.strictEqual((await checkOps(ID.manageCD, [{ type: 'calendar.purge' }])).ok, true);
        assert.strictEqual((await checkOps(ID.manageCD, [{ type: 'made.up' }])).ok, false);
        assert.strictEqual((await checkOps(ALLOWED_ADMIN_ID, [{ type: 'made.up' }])).ok, true);
        assert.strictEqual((await checkOps(ID.manageCD, [[{ type: 'draw.delete' }]])).ok, true, 'nested inverse arrays are flattened');
    });

    await check('🔴 checkOps reads a loadout\'s mode from the build, never from the op', async () => {
        fakeLoadouts = [{ _id: 'mp1', mode: 'MP' }, { _id: 'dmz1', mode: 'DMZ' }];
        assert.strictEqual((await checkOps(ID.dmzC, [{ type: 'loadout.delete', target: { id: 'dmz1' } }])).ok, true, 'a DMZ admin deletes a DMZ build');
        assert.strictEqual((await checkOps(ID.dmzC, [{ type: 'loadout.delete', target: { id: 'mp1', mode: 'DMZ' } }])).ok, false, 'claiming DMZ for an MP build does not pass');
        assert.strictEqual((await checkOps(ID.dmzC, [{ type: 'loadout.bulkDelete', payload: { ids: ['dmz1', 'mp1'] } }])).ok, false, 'one MP build in a bulk delete needs the MP page');
        assert.strictEqual((await checkOps(ID.dmzC, [{ type: 'loadout.edit', target: { id: 'dmz1' }, payload: { mode: 'MP' } }])).ok, false, 'moving a build to MP needs MP too');
        assert.strictEqual((await checkOps(ID.autobuild, [{ type: 'loadout.add', payload: { mode: 'DMZ' } }])).ok, true, '/autobuild carries create to DMZ Loadouts');
        fakeLoadouts = [];
    });

    await check('checkRevert: the Undo tier on the change\'s own page, whatever the reverted op was', async () => {
        assert.strictEqual((await A.checkRevert(ID.manageC, { page: 'draws' })).ok, false, 'create alone cannot revert');
        assert.strictEqual((await A.checkRevert(ID.drawsD, { page: 'draws' })).ok, true);
        assert.strictEqual((await A.checkRevert(ID.drawsD, { page: 'calendar' })).ok, false);
        assert.strictEqual((await A.checkRevert(ID.drawsD, null)).ok, false);
    });

    await check('canDo / denyDo: the right-clicks and row buttons outside the registry', async () => {
        assert.strictEqual(await A.canDo(ID.manageC, 'rightclick.addToDraws'), true);
        assert.strictEqual(await A.canDo(ID.drawsD, 'rightclick.addToDraws'), false);
        assert.strictEqual(await A.canDo(ID.autobuild, 'rightclick.autobuildLoadout'), true);
        assert.strictEqual(await A.canDo(ID.manageCD, 'rightclick.autobuildLoadout'), false, '/manage does not carry to /autobuild');
        assert.strictEqual(await A.canDo(ID.manageC, 'manage.announcementDelete'), false);
        assert.ok(/Announcements/.test(A.denyDo('manage.announcementDelete')));
        await assert.rejects(() => A.canDo(ID.manageC, 'no.such.action'));
    });

    await check('describe() hands the portal the whole table as plain data', () => {
        const d = P.describe();
        assert.deepStrictEqual(d.tiers.map((t) => t.key), P.TIERS);
        assert.deepStrictEqual(d.scopes.map((s) => s.key), P.SCOPES);
        assert.deepStrictEqual(d.scopes.find((s) => s.key === 'autobuild').carries, ['manage.loadouts_mp', 'manage.loadouts_dmz']);
        assert.strictEqual(d.undoTier, 'destructive');
        assert.doesNotThrow(() => JSON.stringify(d));
    });

    await check("🔴 a portal write of the old permissions list clears grants, so it is not silently outranked; a /bot access write is left alone", () => {
        const hook = RealAdminUser.schema.s.hooks._pres.get('findOneAndUpdate').find((h) => h.fn.name === 'clearGrantsOnLegacyWrite').fn;
        const run = (update) => { const q = RealAdminUser.findOneAndUpdate({ discordId: '1' }, update); hook.call(q); return q.getUpdate(); };
        assert.deepStrictEqual(run({ discordId: '1', permissions: ['manage'] }).$set.grants, []);
        assert.deepStrictEqual(run({ $set: { grants: [{ scope: 'manage', tiers: ['create'] }], permissions: [] } }).$set.grants, [{ scope: 'manage', tiers: ['create'] }]);
        assert.strictEqual(run({ $set: { title: 'x' } }).$set.grants, undefined, 'a title-only save must not touch grants');
    });

    fakeAdmins = [];
    A.invalidateAdminCache();
    console.log(failures === 0 ? '\nAll permission checks passed.' : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
}

run();
