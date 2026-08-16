// utils/adminAccess.js
//
// Single source of truth for "is this user an admin" -- checks the hardcoded ALLOWED_ADMIN_ID
// (commands/manage.js, the ultimate owner) OR the Mongo-backed AdminUser allowlist.
//
// ⚠️ EXPANDED 2026-08-13, TWICE THE SAME DAY -- first to per-COMMAND permissions (/manage vs
// /alerts vs /autobuild individually), then to per-PAGE scoping WITHIN /manage itself (Harkirat:
// "not just the 3 admin commands, each command... such as editing /manage calendar data"). The
// owner always has everything implicitly; a Mongo-granted admin's access is exactly the tokens on
// their AdminUser.permissions array.
//
// Permission token vocabulary (validated by parsePermissionsInput):
//   'bot' / 'autobuild'      -- full access to that command, no finer scope exists for either
//                                ('bot' replaced the retired 'alerts'/'audit' tokens 2026-08-16,
//                                observability stage 3, when those commands became /bot analytics)
//   'manage'                 -- full access to EVERY /manage page (shorthand, Harkirat's choice:
//                                bare "manage" means "all pages", not "invalid without naming pages")
//   'manage.<page>'          -- one specific /manage page, <page> from MANAGE_PAGE_SCOPES
//   'all'                    -- input-only convenience, expands to ['manage','autobuild','bot']
//
// /bot access -- the runtime admin allowlist itself (moved out of /manage's former owner-only
// `manageadmins` page 2026-08-16) -- has NO permission token at all, ever: it is OWNER-ONLY
// VISIBILITY, checked directly via isOwner(), never grantable to anyone at any scope.
const AdminUser = require('../models/AdminUser');

const ADMIN_COMMANDS = ['manage', 'autobuild', 'bot'];

// One entry per REAL /manage page a permission can name, EXCEPT 'guide' (the Bulk Format Guide is read-only reference
// material, not data-mutating, so it's available to anyone with ANY manage access at all rather
// than needing its own grantable scope). 'season' is a PSEUDO-page -- it covers the two flat
// dropdown entries ("Season: Titles & Deadlines" / "Start New Season") that aren't a key in
// commands/manage.js's PAGES table at all, kept distinct from 'seasondraft' (the real "Next Season
// Draft" staging page) since editing what's LIVE right now and staging what's NEXT are different
// blast radii.
const MANAGE_PAGE_SCOPES = ['draws', 'calendar', 'loadouts_mp', 'loadouts_dmz', 'patchnotes', 'seasondraft', 'season', 'announcement'];

let cachedDocs = null; // Map<discordId, string[]> | null
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 min -- admin-gated interactions are low-volume and the allowlist
// changes rarely, so a TTL cache avoids a Mongo round-trip on every panel click while keeping
// revoke/permission-edit responsive. This is a convenience allowlist under an already-hardcoded
// owner, not a security boundary against untrusted actors, so a ≤60s window is an acceptable tradeoff.

async function getAdminPermissionsMap() {
    if (cachedDocs && Date.now() - cacheLoadedAt < CACHE_TTL_MS) return cachedDocs;
    const docs = await AdminUser.find({}).select('discordId permissions').lean();
    cachedDocs = new Map(docs.map(d => [d.discordId, d.permissions || []]));
    cacheLoadedAt = Date.now();
    return cachedDocs;
}

// Call right after any grant/revoke/permission-edit write so the owner's own next click sees the
// fresh list immediately instead of waiting out the TTL.
function invalidateAdminCache() {
    cachedDocs = null;
}

function isOwner(userId) {
    const { ALLOWED_ADMIN_ID } = require('../commands/manage');
    return userId === ALLOWED_ADMIN_ID;
}

// "Is this person an admin in ANY capacity" -- owner, or a Mongo-granted admin with at least one
// permission token. Correct for coarse checks (does the Bot Admin category show up at all in
// /help; may this person admin-override someone else's /settings panel) but NOT for gating one
// specific command's own surface -- use hasCommandAccess for that, or hasManagePageAccess for a
// specific /manage page.
async function isAdmin(userId) {
    if (isOwner(userId)) return true;
    const map = await getAdminPermissionsMap();
    return (map.get(userId) || []).length > 0;
}

// Command-level gate. For 'bot'/'autobuild' this is an exact match. For 'manage' it means "has
// ANY manage access at all" -- full ('manage') or any single page ('manage.xxx') -- because that's
// what decides whether the /manage SLASH COMMAND itself may even be opened; which PAGES they can
// then reach is a separate, finer question answered by hasManagePageAccess/getManagePages below.
async function hasCommandAccess(userId, commandName) {
    if (isOwner(userId)) return true;
    const map = await getAdminPermissionsMap();
    const perms = map.get(userId) || [];
    if (commandName === 'manage') return perms.includes('manage') || perms.some(p => p.startsWith('manage.'));
    return perms.includes(commandName);
}

// The real per-PAGE gate inside /manage. `pageKey` is a real PAGES table key (draws/calendar/
// loadouts_mp/loadouts_dmz/patchnotes/seasondraft/announcement), or the pseudo-key 'season' (the
// two flat Season dropdown entries). 'manageadmins' is RETIRED (moved to /bot access, 2026-08-16) --
// if you see it passed here, that call site is stale.
async function hasManagePageAccess(userId, pageKey) {
    if (isOwner(userId)) return true;
    const map = await getAdminPermissionsMap();
    const perms = map.get(userId) || [];
    return perms.includes('manage') || perms.includes(`manage.${pageKey}`);
}

// Every /manage page (+ the 'season' pseudo-page) this user may reach -- drives the panel's own
// page-select dropdown, so a scoped admin is never even OFFERED a page they can't open (not just
// blocked after clicking into it). 'manageadmins' retired from this table 2026-08-16 -- see
// /bot access, which is owner-only by its own isOwner() check, not by anything returned here.
async function getManagePages(userId) {
    if (isOwner(userId)) return [...MANAGE_PAGE_SCOPES];
    const map = await getAdminPermissionsMap();
    const perms = map.get(userId) || [];
    if (perms.includes('manage')) return [...MANAGE_PAGE_SCOPES];
    return MANAGE_PAGE_SCOPES.filter(page => perms.includes(`manage.${page}`));
}

// Parses the Grant/Edit Permissions modal's comma-separated field into a validated, deduped
// permissions array -- or `null` if any token wasn't recognized, so the caller can reject with a
// clear error instead of silently granting a partial/wrong set.
function parsePermissionsInput(raw) {
    const tokens = (raw || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (tokens.length === 0) return null;
    if (tokens.length === 1 && tokens[0] === 'all') return [...ADMIN_COMMANDS];
    const result = new Set();
    for (const token of tokens) {
        if (ADMIN_COMMANDS.includes(token)) {
            result.add(token);
            continue;
        }
        if (token.startsWith('manage.') && MANAGE_PAGE_SCOPES.includes(token.slice('manage.'.length))) {
            result.add(token);
            continue;
        }
        return null; // one bad token invalidates the whole submission -- a partial grant from a typo is worse than an error
    }
    return [...result];
}

// Human-readable rendering of a permissions array for the Manage Admins list cards -- 'manage'
// alone reads as "Full /manage access" rather than the literal token, and 'manage.xxx' tokens get
// their page's real display label instead of the raw scope key.
const MANAGE_PAGE_LABELS = {
    draws: 'Draws', calendar: 'Calendar', loadouts_mp: 'MP Loadouts', loadouts_dmz: 'DMZ Loadouts',
    patchnotes: 'Patch Notes', seasondraft: 'Next Season Draft', season: 'Season Titles/Wipe', announcement: 'Announcement'
};
function formatPermissions(perms) {
    if (!perms || perms.length === 0) return '*(none)*';
    const parts = [];
    if (perms.includes('bot')) parts.push('/bot analytics');
    if (perms.includes('autobuild')) parts.push('/autobuild');
    if (perms.includes('manage')) {
        parts.push('/manage (full)');
    } else {
        const pages = perms.filter(p => p.startsWith('manage.')).map(p => MANAGE_PAGE_LABELS[p.slice('manage.'.length)] || p);
        if (pages.length > 0) parts.push(`/manage: ${pages.join(', ')}`);
    }
    return parts.join(' · ') || '*(none)*';
}

module.exports = {
    isAdmin, hasCommandAccess, hasManagePageAccess, getManagePages, isOwner,
    invalidateAdminCache, getAdminPermissionsMap, parsePermissionsInput, formatPermissions,
    ADMIN_COMMANDS, MANAGE_PAGE_SCOPES
};
