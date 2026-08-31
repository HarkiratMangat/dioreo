// Permission tests for /bot access & /bot analytics's admin gate (utils/adminAccess.js).
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
    isOwner, hasCommandAccess, hasManagePageAccess, getManagePages,
    parsePermissionsInput, formatPermissions, invalidateAdminCache, ADMIN_COMMANDS, MANAGE_PAGE_SCOPES, NOT_IN_ALL, unformattablePermissions,
} = require('../utils/adminAccess');
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

    fakeAdmins = [
        { discordId: GRANTED_BOT_ADMIN, permissions: ['bot'] },
        { discordId: GRANTED_MANAGE_ONLY, permissions: ['manage'] },
    ];
    invalidateAdminCache();

    await check('a non-owner with the "bot" token passes hasCommandAccess(id, "bot")', async () => {
        assert.strictEqual(await hasCommandAccess(GRANTED_BOT_ADMIN, 'bot'), true);
    });

    await check('a non-owner WITHOUT the "bot" token fails hasCommandAccess(id, "bot") -- even with full /manage', async () => {
        assert.strictEqual(await hasCommandAccess(GRANTED_MANAGE_ONLY, 'bot'), false);
    });

    await check('a plain non-owner with no grants at all fails every gate', async () => {
        assert.strictEqual(await hasCommandAccess(NON_OWNER, 'bot'), false);
        assert.strictEqual(await hasCommandAccess(NON_OWNER, 'manage'), false);
        assert.strictEqual((await getManagePages(NON_OWNER)).length, 0);
    });

    await check("getManagePages() for the OWNER no longer includes the retired 'manageadmins'", async () => {
        const pages = await getManagePages(ALLOWED_ADMIN_ID);
        assert.ok(!pages.includes('manageadmins'), 'manageadmins should be retired from /manage entirely -- it moved to /bot access');
        assert.deepStrictEqual([...pages].sort(), [...MANAGE_PAGE_SCOPES].sort());
    });

    await check("hasManagePageAccess() no longer special-cases 'manageadmins' -- nothing routes there anymore", async () => {
        assert.strictEqual(await hasManagePageAccess(ALLOWED_ADMIN_ID, 'draws'), true);
        assert.strictEqual(await hasManagePageAccess(NON_OWNER, 'draws'), false);
    });

    await check("🔴 no grantable permission token is named 'access' or similar -- isOwner() is the ONLY /bot access gate, by design", () => {
        for (const token of ADMIN_COMMANDS) {
            assert.ok(!/access/i.test(token), `a grantable "${token}" token would bypass owner-only /bot access`);
        }
    });

    await check("parsePermissionsInput accepts 'bot' and rejects the retired 'alerts'/'audit' tokens", () => {
        assert.deepStrictEqual(parsePermissionsInput('bot'), ['bot']);
        assert.strictEqual(parsePermissionsInput('alerts'), null, '"alerts" should no longer parse as a valid token');
        assert.strictEqual(parsePermissionsInput('audit'), null, '"audit" should no longer parse as a valid token');
        /* 🔴 'all' EXPANDS TO EVERY COMMAND EXCEPT THE ONES ON NOT_IN_ALL, and asserting that
         * explicitly is the whole point. The previous line read `[...ADMIN_COMMANDS].sort()`,
         * which would have silently absorbed 'destructive' the moment it was added — a test that
         * tracks the implementation cannot notice the implementation going wrong. */
        assert.deepStrictEqual(parsePermissionsInput('all').slice().sort(),
            ['autobuild', 'bot', 'manage'],
            "'all' must stay a convenience for the three ordinary commands");
    });

    await check("🔴 'all' NEVER hands out 'destructive' -- a convenience that quietly grants irreversibility is the opposite of one", () => {
        const all = parsePermissionsInput('all');
        for (const token of NOT_IN_ALL) {
            assert.ok(!all.includes(token),
                `'all' expanded to "${token}"; tier-3 delegation must be typed, never inherited from a shorthand`);
        }
        /* And it must still be reachable when NAMED, or the token would be un-grantable and the
         * exclusion above would be indistinguishable from the feature not existing. */
        assert.deepStrictEqual(parsePermissionsInput('destructive'), ['destructive']);
        assert.deepStrictEqual(parsePermissionsInput('manage,destructive').slice().sort(),
            ['destructive', 'manage']);
    });

    await check("🔴 formatPermissions renders EVERY grantable token -- a permission that is granted and invisible is worse than one that is not granted", () => {
        /* This exists because 'destructive' was added to ADMIN_COMMANDS and formatPermissions,
         * which enumerates tokens by name, silently dropped it: ['destructive','manage'] read
         * back as "/manage (full)". The owner reviewing an admin's access could not see that
         * they held the right to purge. A hand-maintained formatter always loses the next token;
         * this catches it at the point it is added. */
        assert.deepStrictEqual(unformattablePermissions(), [],
            'these grantable tokens render as nothing in a permission summary');
        assert.ok(/one-way/i.test(formatPermissions(['destructive'])),
            'the destructive token must name what it actually allows');
        assert.ok(/one-way/i.test(formatPermissions(['manage', 'destructive'])),
            'destructive must survive being listed alongside a broader token');
    });

    await check("every NOT_IN_ALL token is a real ADMIN_COMMAND -- an exclusion list naming a token that does not exist protects nothing", () => {
        for (const token of NOT_IN_ALL) {
            assert.ok(ADMIN_COMMANDS.includes(token),
                `NOT_IN_ALL names "${token}", which is not in ADMIN_COMMANDS`);
        }
        assert.ok(NOT_IN_ALL.length > 0, 'NOT_IN_ALL is empty, so the exclusion test above is vacuous');
    });

    await check("formatPermissions renders the 'bot' token as /bot analytics, never as /alerts or /audit", () => {
        assert.strictEqual(formatPermissions(['bot']), '/bot analytics');
        assert.ok(!formatPermissions(['bot', 'manage']).includes('/alerts'));
        assert.ok(!formatPermissions(['bot', 'manage']).includes('/audit'));
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
