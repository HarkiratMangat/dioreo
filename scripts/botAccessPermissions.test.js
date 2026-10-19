// Permission tests for /bot access & /bot analytics's admin gate (utils/adminAccess.js). The two-tier model itself is tested in scripts/permissions.test.js.
//
// Stage 3 of the observability layer moved the owner-only `manageadmins` page out of /manage into /bot access, and consolidated the retired 'alerts'/'audit' permission tokens into one 'bot' token. This is the highest-severity change in that stage — a regression here does not produce a wrong number, it grants someone admin access — so these are real behavioural tests over the token-grant path, not just shape checks, plus source-scan checks pinning that the two call sites that matter (commands/bot.js's `access` subcommand, handlers/bot.js's mutating branches) gate on isOwner() rather than a grantable token. See docs/superpowers/specs/2026-08-16-observability- layer-design.md's Risks section.
//
// Runs with no network: models/AdminUser is stubbed via require.cache, matching the pattern scripts/eventStore.test.js already uses for stage 2's own Mongo-backed modules.

const assert = require('assert');
const fs = require('fs');

const adminUserPath = require.resolve('../models/AdminUser');
let fakeAdmins = [];
require.cache[adminUserPath] = {
    id: adminUserPath, filename: adminUserPath, loaded: true, exports: {
        find: () => ({ select: () => ({ lean: async () => fakeAdmins }) }),
    },
};

const {
    isOwner, hasCommandAccess, hasManagePageAccess, getManagePages, getBotPages, invalidateAdminCache, MANAGE_PAGE_SCOPES,
} = require('../utils/adminAccess');
const P = require('../core/permissions');
const { ALLOWED_ADMIN_ID } = require('../utils/owner');

const NON_OWNER = '999999999999999999';
const GRANTED_BOT_ADMIN = '888888888888888888';
const GRANTED_MANAGE_ONLY = '777777777777777777';

let failures = 0;
async function check(name, fn) {
    try {
        await fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        failures++;
        console.error(`  ✗ ${name}\n      ${error.message}`);
    }
}

async function run() {
    console.log('/bot access + /bot analytics — permission gate\n');

    await check('the owner always passes isOwner(); a non-owner never does', () => {
        assert.strictEqual(isOwner(ALLOWED_ADMIN_ID), true);
        assert.strictEqual(isOwner(NON_OWNER), false);
        assert.strictEqual(isOwner(GRANTED_BOT_ADMIN), false);
    });

    // Rewritten 2026-10-19 19:37 EDT for the two-tier model (core/permissions.js). The token-list checks this file used to carry ('all' never expands to 'destructive', formatPermissions renders every token) guarded a model that is gone; their intent lives on in scripts/permissions.test.js (parseGrantsInput refuses 'all', formatGrants renders every grant). What stays here is /bot's own gate.
    fakeAdmins = [
        { discordId: GRANTED_BOT_ADMIN, grants: [{ scope: 'bot.health', tiers: ['create'] }] },
        { discordId: GRANTED_MANAGE_ONLY, grants: [{ scope: 'manage', tiers: ['create', 'destructive'] }] },
    ];
    invalidateAdminCache();

    await check('a non-owner holding one /bot page passes hasCommandAccess(id, "bot") and is offered only that page', async () => {
        assert.strictEqual(await hasCommandAccess(GRANTED_BOT_ADMIN, 'bot'), true);
        assert.deepStrictEqual(await getBotPages(GRANTED_BOT_ADMIN), ['health']);
    });

    await check('a non-owner with full /manage but no /bot page fails hasCommandAccess(id, "bot")', async () => {
        assert.strictEqual(await hasCommandAccess(GRANTED_MANAGE_ONLY, 'bot'), false);
        assert.deepStrictEqual(await getBotPages(GRANTED_MANAGE_ONLY), []);
    });

    await check('a plain non-owner with no grants at all fails every gate', async () => {
        assert.strictEqual(await hasCommandAccess(NON_OWNER, 'bot'), false);
        assert.strictEqual(await hasCommandAccess(NON_OWNER, 'manage'), false);
        assert.strictEqual((await getManagePages(NON_OWNER)).length, 0);
        assert.strictEqual((await getBotPages(NON_OWNER)).length, 0);
    });

    await check("getManagePages() for the OWNER is exactly the /manage pages, with no retired 'manageadmins'", async () => {
        const pages = await getManagePages(ALLOWED_ADMIN_ID);
        assert.ok(!pages.includes('manageadmins'), 'manageadmins should be retired from /manage entirely -- it moved to /bot access');
        assert.deepStrictEqual([...pages].sort(), [...MANAGE_PAGE_SCOPES].sort());
    });

    await check("hasManagePageAccess() answers per page, with no special case for 'manageadmins'", async () => {
        assert.strictEqual(await hasManagePageAccess(ALLOWED_ADMIN_ID, 'draws'), true);
        assert.strictEqual(await hasManagePageAccess(NON_OWNER, 'draws'), false);
        assert.strictEqual(await hasManagePageAccess(GRANTED_BOT_ADMIN, 'draws'), false);
    });

    await check("🔴 no grantable scope is named 'access' or similar -- isOwner() is the ONLY /bot access gate, by design", () => {
        for (const scope of P.SCOPES) {
            assert.ok(!/access/i.test(scope), `a grantable "${scope}" scope would bypass owner-only /bot access`);
        }
    });

    await check('commands/bot.js gates the "access" subcommand with isOwner(), never a permission token', () => {
        const src = fs.readFileSync(require.resolve('../commands/bot.js'), 'utf8');
        const subIdx = src.indexOf("if (sub === 'access')");
        assert.ok(subIdx > -1, 'could not find the access subcommand branch in commands/bot.js');
        const nextMarkerIdx = src.indexOf('// analytics', subIdx);
        const block = src.slice(subIdx, nextMarkerIdx > -1 ? nextMarkerIdx : subIdx + 500);
        assert.ok(/if \(!isOwner\(interaction\.user\.id\)\)/.test(block),
            'the access subcommand must gate on isOwner(), not a permission token -- manageadmins\' invariant was "no token can ever grant this"');
        assert.ok(!/hasCommandAccess\(/.test(block),
            'access must never be gated by hasCommandAccess() -- that checks a grantable token, and none may ever grant this');
    });

    await check('handlers/bot.js re-checks isOwner() at every access-mutating branch (grant/edit/revoke)', () => {
        const src = fs.readFileSync(require.resolve('../handlers/bot.js'), 'utf8');
        const mutatingBranches = [
            "customId === 'bot_admin_grant'",
            "customId.startsWith('bot_admin_editperms_')",
            "customId.startsWith('bot_admin_revoke_')",
            "customId.startsWith('bot_admin_revokeconfirm_')",
            "customId === 'bot_adminmodal_grant'",
            "customId.startsWith('bot_adminmodal_editperms_')",
        ];
        for (const marker of mutatingBranches) {
            const idx = src.indexOf(marker);
            assert.ok(idx > -1, `could not find branch: ${marker}`);
            const nearby = src.slice(idx, idx + 350);
            assert.ok(/isOwner\(interaction\.user\.id\)/.test(nearby), `${marker} does not re-check isOwner() nearby`);
        }
    });

    invalidateAdminCache();
    fakeAdmins = [];

    console.log(failures === 0 ? '\nAll permission-gate checks passed.' : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
}

run();
