// utils/adminAccess.js
//
// The runtime half of the permission model: who holds what, read from Mongo and checked against core/permissions.js. The owner (utils/owner.js) always holds everything; everyone else holds exactly the grants on their AdminUser row.
//
// ⚠️ REBUILT 2026-10-19 (permission restructure, docs/superpowers/specs/2026-10-19-permission-restructure-design.md). The flat token list (`manage`, `manage.<page>`, `bot`, `autobuild`, plus a global `destructive` token that `all` refused to expand into) is retired. A grant is now `{ scope, tiers }` with two tiers, create and destructive, and a command's tiers carry down to its pages. Every rule lives in core/permissions.js as data; this file never restates one.
//
// Which function to use where:
//   isOwner(id)                  owner-only surfaces: /bot access, hotpatch, Restart. Never a grant.
//   isAdmin(id)                  "any admin at all": may open /manage and browse its pages, sees the admin /help category.
//   can(id, scope, tier)         the real gate. tier is 'create', 'destructive' or 'any'.
//   canAction(id, page, action)  a /manage registry button, by its op's tier.
//   checkOps(id, ops)            a whole changeset, before it commits -- lives in core/changeset.js (it needs pageForOp, which reaches discord.js; this file must stay requireable without it, scripts/ownerModule.test.js).
//   checkRevert(id, row)         Undo / Revert of one ChangeLog row.
//   hasCommandAccess(id, cmd)    may this person open the command at all. Kept by name because the router, /help and the portal call it.
//
// /bot access has no scope at all, ever: it is owner-only visibility, checked with isOwner() at every site.
const AdminUser = require('../models/AdminUser');
const { isOwnerId } = require('./owner');
const P = require('../core/permissions');

let cachedDocs = null; // Map<discordId, { permissions, grants }> | null
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 min -- admin-gated interactions are low-volume and grants change rarely, so a TTL cache avoids a Mongo round-trip on every panel click while keeping a revoke responsive. This is a convenience allowlist under a hardcoded owner, not a security boundary against untrusted actors, so a ≤60s window is an acceptable tradeoff.

async function getAdminDocs() {
    if (cachedDocs && Date.now() - cacheLoadedAt < CACHE_TTL_MS) return cachedDocs;
    const docs = await AdminUser.find({}).select('discordId permissions grants').lean();
    cachedDocs = new Map(docs.map(d => [d.discordId, { permissions: d.permissions || [], grants: d.grants || [] }]));
    cacheLoadedAt = Date.now();
    return cachedDocs;
}

// Call right after any grant/revoke/permission-edit write so the owner's own next click sees the fresh list immediately instead of waiting out the TTL.
function invalidateAdminCache() {
    cachedDocs = null;
}

function isOwner(userId) {
    return isOwnerId(userId);
}

// The grants a user holds, legacy rows bridged (core/permissions.js's grantsOf). Empty for a non-admin.
async function getGrants(userId) {
    const docs = await getAdminDocs();
    return P.grantsOf(docs.get(userId));
}

// Map<scope, Set<tier>> with carry-down applied. The owner gets every tier on every scope.
async function effectiveTiers(userId) {
    if (isOwner(userId)) return P.fullTiers();
    return P.expandGrants(await getGrants(userId));
}

async function can(userId, scope, tier = 'any') {
    if (isOwner(userId)) return true;
    const held = (await effectiveTiers(userId)).get(scope);
    if (!held) return false;
    return tier === 'any' ? held.size > 0 : held.has(tier);
}

// Owner, or anyone holding at least one tier anywhere. A row whose grants confer nothing is not an admin.
async function isAdmin(userId) {
    if (isOwner(userId)) return true;
    for (const tiers of (await effectiveTiers(userId)).values()) if (tiers.size) return true;
    return false;
}

// "May this person open the command at all", by name, for the callers that ask it that way.
//   manage    -> any admin (every admin may browse /manage's pages; buttons check their own tier)
//   bot       -> any tier on /bot or on one of its pages (a page grant alone opens /bot analytics on that page)
//   autobuild -> CREATE on /autobuild, the only tier any of its actions uses (Confirm and the right-click both save a build). A destructive-only /autobuild grant still carries to the two Loadouts pages, it just has nothing to do here.
//   destructive -> 🔴 LEGACY, for portal/auth.js's `canDestroy` until the portal hand-off lands: holds destructive anywhere. It is not a command and no grant names it.
async function hasCommandAccess(userId, commandName) {
    if (isOwner(userId)) return true;
    if (commandName === 'manage') return isAdmin(userId);
    const tiers = await effectiveTiers(userId);
    if (commandName === 'destructive') return [...tiers.values()].some(t => t.has('destructive'));
    if (commandName === 'bot') return ['bot', ...P.BOT_PAGES.map(P.botScope)].some(s => tiers.get(s)?.size);
    if (commandName === 'autobuild') return Boolean(tiers.get('autobuild')?.has('create'));
    return Boolean(tiers.get(commandName)?.size);
}

// Any tier on one /manage page. Used where a page's CONTENT is shown (a change's detail) and by the portal until its swap; a button must ask can() or canAction() for its own tier instead.
async function hasManagePageAccess(userId, pageKey) {
    return can(userId, P.manageScope(pageKey), 'any');
}

// The /manage pages this user holds any tier on. ⚠️ No longer drives the /manage dropdown -- every admin browses every page now (his decision 2026-10-19 18:17 EDT). Kept for the portal's realm rail until the portal hand-off reads effectiveTiers() directly.
async function getManagePages(userId) {
    const tiers = await effectiveTiers(userId);
    return P.MANAGE_PAGES.filter(p => tiers.get(P.manageScope(p))?.size);
}

// The /bot analytics pages this user may open: any tier on the page (the approved list, 2026-10-19 19:11 EDT: "any tier on that page").
async function getBotPages(userId) {
    const tiers = await effectiveTiers(userId);
    return P.BOT_PAGES.filter(p => tiers.get(P.botScope(p))?.size);
}

// A /manage registry action (utils/manageActions.js) -> { ok, tier }. An action that writes nothing (Export, Guide) needs no tier, only admin access.
async function canAction(userId, page, actionId) {
    const tier = P.tierForAction(page, actionId);
    if (!tier) return { ok: await isAdmin(userId), tier: null };
    return { ok: await can(userId, P.manageScope(page), tier), tier };
}

// An action outside the /manage registry, by its key in core/permissions.js's OUTSIDE_ACTIONS (the right-clicks, Past Seasons, the announcement row buttons).
async function canDo(userId, actionKey) {
    const rule = P.OUTSIDE_ACTIONS[actionKey];
    if (!rule) throw new Error(`core/permissions.js has no OUTSIDE_ACTIONS entry "${actionKey}"`);
    return can(userId, rule.scope, rule.tier);
}

// The warning a press without the tier gets, naming what is missing.
const denialFor = (scope, tier) => `🔒 **You don't have ${P.TIER_LABELS[tier].toLowerCase()} permission on ${P.scopeLabel(scope)}.** Ask the bot owner to grant it if you need it.`;
const denyDo = (actionKey) => denialFor(P.OUTSIDE_ACTIONS[actionKey].scope, P.OUTSIDE_ACTIONS[actionKey].tier);

// Undo / Revert of one ChangeLog row: UNDO_TIER (destructive, ⏳ provisional) on the page the change belongs to, whatever the reverted op's own tier was.
async function checkRevert(userId, row) {
    if (!row) return { ok: false, reason: 'That change no longer exists.' };
    const scope = P.manageScope(row.page);
    if (await can(userId, scope, P.UNDO_TIER)) return { ok: true };
    return { ok: false, reason: denialFor(scope, P.UNDO_TIER) };
}

// The /manage page keys, under the name the bot, the portal and several tests already import. Not legacy: the same list as core/permissions.js's MANAGE_PAGES, re-exported rather than restated.
const MANAGE_PAGE_SCOPES = [...P.MANAGE_PAGES];

// ── 🔴 LEGACY, FOR THE PORTAL ONLY ────────────────────────────────────────── portal/api/access.js still reads and writes the retired token list (it builds its grid from ADMIN_COMMANDS/MANAGE_PAGE_SCOPES/NOT_IN_ALL and parses grants with parsePermissionsInput), and portal/** belongs to pins2. Nothing in the bot uses these any more. The hand-off proposal (the portal's switch to core/permissions.js's describe() and `grants`) deletes this block; until then it keeps the portal's Access realm working, and core/permissions.js's legacyToGrants() makes what it writes count.
const ADMIN_COMMANDS = ['manage', 'autobuild', 'bot', 'destructive'];
const NOT_IN_ALL = ['destructive'];

async function getAdminPermissionsMap() {
    const docs = await getAdminDocs();
    return new Map([...docs].map(([id, d]) => [id, d.permissions]));
}

function parsePermissionsInput(raw) {
    const tokens = (raw || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (tokens.length === 0) return null;
    if (tokens.length === 1 && tokens[0] === 'all') return ADMIN_COMMANDS.filter(c => !NOT_IN_ALL.includes(c));
    const result = new Set();
    for (const token of tokens) {
        if (ADMIN_COMMANDS.includes(token)) { result.add(token); continue; }
        if (token.startsWith('manage.') && MANAGE_PAGE_SCOPES.includes(token.slice('manage.'.length))) { result.add(token); continue; }
        return null; // one bad token invalidates the whole submission
    }
    return [...result];
}

module.exports = {
    isOwner, isAdmin, can, canAction, canDo, checkRevert, effectiveTiers, getGrants,
    denialMessage: denialFor, denyDo,
    hasCommandAccess, hasManagePageAccess, getManagePages, getBotPages,
    invalidateAdminCache, formatGrants: P.formatGrants, MANAGE_PAGE_SCOPES,
    // legacy, portal-only (see the block above)
    getAdminPermissionsMap, parsePermissionsInput, ADMIN_COMMANDS, NOT_IN_ALL,
};
