// core/permissions.js
//
// THE PERMISSIONS TABLE. Every admin permission rule in Dioreo is declared here, once, as data: which scopes can be granted, which pages each command carries, which tier every database op needs, and what stays owner-only. utils/adminAccess.js reads it for the bot and the portal reads it for its Access realm, so a rule changes in exactly one place.
//
// The model (Harkirat's decisions, 2026-10-19 17:58-19:11 EDT, design record in docs/superpowers/specs/2026-10-19-permission-restructure-design.md):
//   - Two tiers, CREATE and DESTRUCTIVE. Every action needs exactly one. Editing counts as create.
//   - A grant names a scope (a command or a page) and the tiers held there. A command's tiers CARRY DOWN to every page it carries; a page grant adds on top. Effective tiers on a page = union of its own grant and every carrying command's grant.
//   - Only the owner grants or revokes. /bot access, hotpatch, the restart button and the portal's end-session are owner-only and sit outside the tiers entirely.
//   - Browsing is free. Any admin can open every /manage button page; the tier is checked when a button is pressed. The two pop-up-first Season entries are the exception, because opening them IS the action.
//
// ⚠️ THIS FILE IS PURE: no Mongo, no Discord, no require() at load time (core/ops is required lazily, inside the one function that needs it). That is what lets the portal read it without a database, and what lets scripts/permissions.test.js assert the whole table offline.

const TIERS = ['create', 'destructive'];

const TIER_LABELS = { create: 'Create', destructive: 'Destructive' };

// The /manage pages a grant can name. 'season' is the pseudo-page behind the two flat Season dropdown entries (Titles & Deadlines, Start New Season); it is kept separate from 'seasondraft' because editing what is live and staging what is next are different blast radii.
const MANAGE_PAGES = ['draws', 'calendar', 'loadouts_mp', 'loadouts_dmz', 'patchnotes', 'seasondraft', 'season', 'announcement'];

// The /bot analytics pages a grant can name. 'access' is deliberately absent: /bot access is owner-only and is never a grantable scope, at any tier.
const BOT_PAGES = ['health', 'alerts', 'changes', 'usage', 'timing'];

const manageScope = (page) => `manage.${page}`;
const botScope = (page) => `bot.${page}`;

// command -> the page scopes it carries (his "Yes" 2026-10-19 18:05 EDT: /manage → all 8 pages · /autobuild → MP + DMZ Loadouts · /bot → every /bot page and every /manage page). A command is also a scope in its own right: /autobuild's own actions check the 'autobuild' scope itself.
const COMMANDS = {
    manage: { label: '/manage', carries: MANAGE_PAGES.map(manageScope) },
    autobuild: { label: '/autobuild', carries: [manageScope('loadouts_mp'), manageScope('loadouts_dmz')] },
    bot: { label: '/bot', carries: [...BOT_PAGES.map(botScope), ...MANAGE_PAGES.map(manageScope)] },
};

const PAGE_LABELS = {
    [manageScope('draws')]: 'Draws',
    [manageScope('calendar')]: 'Calendar',
    [manageScope('loadouts_mp')]: 'MP Loadouts',
    [manageScope('loadouts_dmz')]: 'DMZ Loadouts',
    [manageScope('patchnotes')]: 'Patch Notes',
    [manageScope('seasondraft')]: 'Next Season Draft',
    [manageScope('season')]: 'Season',
    [manageScope('announcement')]: 'Announcements',
    [botScope('health')]: 'Health',
    [botScope('alerts')]: 'Alerts',
    [botScope('changes')]: 'Changes',
    [botScope('usage')]: 'Usage',
    [botScope('timing')]: 'Timing',
};

// Every grantable scope, commands first. Order is the order /bot access and the portal grid list them in.
const SCOPES = [...Object.keys(COMMANDS), ...MANAGE_PAGES.map(manageScope), ...BOT_PAGES.map(botScope)];

const scopeLabel = (scope) => COMMANDS[scope]?.label || PAGE_LABELS[scope] || scope;
const scopeKind = (scope) => (COMMANDS[scope] ? 'command' : 'page');

// Every op type in core/ops -> the one tier it needs. The approved button list (2026-10-19 19:11 EDT) says which button needs which tier; each button runs exactly one op, so the button's tier IS its op's tier and this table is the whole of it. scripts/permissions.test.js fails if an op is registered without an entry here, or an entry names an op that no longer exists. ⚠️ The five ops reachable ONLY as another op's inverse (patchnote.removeSeason/restoreSeason/restore, season.restoreSnapshot/restoreDraft) are DESTRUCTIVE because Undo and Revert are. Discord never stages them directly; the portal could, which is why they are in the table at all.
const OP_TIERS = {
    // Draws
    'draw.add': 'create',
    'draw.edit': 'create',
    'draw.delete': 'destructive',
    'draw.bulkAdd': 'create',
    'draw.bulkReplace': 'create',             // add-or-update by title, deletes nothing (core/ops/draws.js)
    'draw.bulkDelete': 'destructive',
    'draw.purge': 'destructive',
    // Calendar
    'calendar.add': 'create',
    'calendar.edit': 'create',
    'calendar.delete': 'destructive',
    'calendar.bulkAdd': 'create',
    'calendar.bulkReplace': 'create',         // add-or-update by title
    'calendar.bulkDelete': 'destructive',
    'calendar.setBanners': 'create',          // set, edit, replace AND remove a banner (his call 2026-10-19 18:49 EDT: removing one is not destructive)
    'calendar.purge': 'destructive',
    // MP + DMZ Loadouts (one op set; the page comes from the op's mode)
    'loadout.add': 'create',
    'loadout.edit': 'create',
    'loadout.delete': 'destructive',
    'loadout.bulkAdd': 'create',
    'loadout.bulkReplace': 'create',
    'loadout.bulkDelete': 'destructive',
    // Patch Notes
    'patchnote.setDateInfo': 'create',
    'patchnote.setUrls1': 'create',
    'patchnote.setUrls2': 'create',
    'patchnote.addSeason': 'create',
    'patchnote.editSeason': 'create',         // Past Seasons edit, and the Add to Patch Notes right-click
    'patchnote.purge': 'destructive',
    'patchnote.removeSeason': 'destructive',  // inverse-only
    'patchnote.restoreSeason': 'destructive', // inverse-only
    'patchnote.restore': 'destructive',       // inverse-only
    // Season (live)
    'season.setTitlesDeadlines': 'create',
    'season.startNew': 'destructive',
    'season.restoreSnapshot': 'destructive',  // inverse-only
    // Next Season Draft
    'season.setDraftTitlesDeadlines': 'create',
    'season.bulkDraftDraws': 'create',        // replaces the STAGED list only; nothing live changes
    'season.bulkDraftCalendar': 'create',
    'season.promoteDraft': 'destructive',
    'season.discardDraft': 'destructive',
    'season.restoreDraft': 'destructive',     // inverse-only
    // Announcements
    'announcement.post': 'create',
    'announcement.edit': 'create',
    'announcement.delete': 'destructive',
    // CODM catalogue (core/ops/catalogue.js). A learn rides in the same commit as the loadout add or edit that named the new attachment, so it needs what that add needs; forgetting is its inverse-only undo.
    'catalogue.learn': 'create',
    'catalogue.forget': 'destructive',     // inverse-only
};

// DECIDED 2026-10-19 20:17 EDT (Harkirat: "yeah leave it as destructive"; it had been provisional since 2026-10-19 18:33 EDT). Undo and /bot Changes → Revert need this tier on the page the change belongs to, whatever the reverted op's own tier was.
const UNDO_TIER = 'destructive';

// /bot Changes → Edit opens that page's own /manage edit, so it needs what that edit needs.
const CHANGE_EDIT_TIER = 'create';

// Actions that write outside /manage's registry buttons. Each names the scope it is checked on and the tier.
const OUTSIDE_ACTIONS = {
    'autobuild.confirm': { scope: 'autobuild', tier: 'create' },              // /autobuild → Confirm saves the build
    'rightclick.autobuildLoadout': { scope: 'autobuild', tier: 'create' },
    'rightclick.addToDraws': { scope: manageScope('draws'), tier: 'create' },
    'rightclick.addToCalendar': { scope: manageScope('calendar'), tier: 'create' },
    'rightclick.addToPatchNotes': { scope: manageScope('patchnotes'), tier: 'create' },
    'manage.patchseasonPick': { scope: manageScope('patchnotes'), tier: 'create' }, // Patch Notes → Past Seasons (edit one)
    'manage.announcementEdit': { scope: manageScope('announcement'), tier: 'create' },
    'manage.announcementDelete': { scope: manageScope('announcement'), tier: 'destructive' },
};

// /manage dropdown entries that open a pop-up straight away, so opening one IS pressing its button (his answer 2026-10-19 18:18 EDT). value -> the registry action whose op decides the tier.
const POPUP_FIRST_ENTRIES = {
    season_titlesdeadlines: 'season:titlesdeadlines',
    season_wipe: 'season:wipe',
};

// Outside the tiers. Checked with isOwner() at every site, never through a grant.
const OWNER_ONLY = ['/bot access', '/bot hotpatch', '/bot Health → Restart', 'portal end-session'];

// ── Pure functions over the table ──────────────────────────────────────────

const isScope = (scope) => SCOPES.includes(scope);
const isTier = (tier) => TIERS.includes(tier);

// grants: [{ scope, tiers: [...] }] -> Map<scope, Set<tier>> with carry-down applied. Unknown scopes and tiers are dropped rather than thrown on: a stale row must never be able to break every admin check, and parseGrantsInput is what refuses them at write time.
function expandGrants(grants) {
    const out = new Map(SCOPES.map((s) => [s, new Set()]));
    for (const g of grants || []) {
        if (!g || !isScope(g.scope)) continue;
        const tiers = (g.tiers || []).filter(isTier);
        for (const target of [g.scope, ...(COMMANDS[g.scope]?.carries || [])]) {
            for (const t of tiers) out.get(target).add(t);
        }
    }
    return out;
}

// Everything, for the owner.
function fullTiers() {
    return new Map(SCOPES.map((s) => [s, new Set(TIERS)]));
}

// 🔴 LEGACY BRIDGE, until the prod purge and the portal's swap have both landed. A row written before this model carries `permissions: ['manage', 'manage.draws', 'destructive', ...]` and no `grants`. The portal's Access realm still WRITES this shape until pins2 switches it to `grants`, so without the bridge a portal grant would silently confer nothing. Each token keeps its OLD meaning, because that is what the person granting it was looking at:
//   manage / manage.<page>  -> create there, plus destructive when the old 'destructive' token is present (it meant one-way ops on every surface the holder had)
//   bot                     -> each /bot analytics page, NOT the new /bot scope. The new /bot carries every /manage page; the old token was analytics only, so mapping it to the new scope would hand a read-only admin write access to every page.
//   autobuild               -> create on /autobuild, never destructive. ⚠️ One honest widening: the new /autobuild carries create to the two Loadouts pages, and a grant cannot opt out of carry-down, so an old autobuild-only admin can also add and edit builds on /manage's Loadouts pages. Accepted as temporary (it ends with the purge) and recorded in the design spec.
// Delete it together with the purge (scripts/purgeLegacyAdminGrants.js) and the portal hand-off, not before.
function legacyToGrants(permissions) {
    const perms = Array.isArray(permissions) ? permissions : [];
    const manageTiers = perms.includes('destructive') ? ['create', 'destructive'] : ['create'];
    const out = [];
    for (const p of perms) {
        if (p === 'bot') out.push(...BOT_PAGES.map((page) => ({ scope: botScope(page), tiers: ['create'] })));
        else if (p === 'autobuild') out.push({ scope: 'autobuild', tiers: ['create'] });
        else if (p === 'manage' || (p.startsWith('manage.') && isScope(p))) out.push({ scope: p, tiers: [...manageTiers] });
    }
    return out;
}

// The grants a stored AdminUser row actually confers: its `grants` when it has any, else its legacy `permissions` through the bridge above.
function grantsOf(doc) {
    if (!doc) return [];
    if (Array.isArray(doc.grants) && doc.grants.length) return doc.grants;
    return legacyToGrants(doc.permissions);
}

function tierForOp(type) {
    return OP_TIERS[type] || null;
}

// A /manage registry action's tier: its op's tier, or null for an action that writes nothing (Export, the Bulk Format Guide).
function tierForAction(page, actionId) {
    const { opTypeForAction } = require('./ops');
    const op = opTypeForAction(page, actionId);
    return op ? tierForOp(op) : null;
}

// ── The /bot access text format ──────────────────────────────────────────── One grant per line (or comma): `scope: tiers`, where tiers is c, d, cd, or the words. For example:
//   manage: c
//   manage.calendar: d
//   bot.health: c
// A Discord modal has no checkboxes, so this is the grant UI on Discord; the portal draws real ones from describe().

const TIER_ALIASES = { c: ['create'], d: ['destructive'], cd: ['create', 'destructive'], dc: ['create', 'destructive'], create: ['create'], destructive: ['destructive'] };

// -> { ok: true, grants } or { ok: false, error }. One bad entry rejects the whole submission: a partial grant from a typo is worse than an error.
function parseGrantsInput(raw) {
    const entries = String(raw || '').split(/[\n,]+/).map((e) => e.trim()).filter(Boolean);
    if (!entries.length) return { ok: false, error: 'Nothing to grant. Write one `scope: tiers` per line, for example `manage: c`.' };
    const merged = new Map();
    for (const entry of entries) {
        const m = entry.match(/^([a-z_.]+)\s*[:=]\s*(.+)$/i);
        if (!m) return { ok: false, error: `"${entry}" needs a tier after a colon: \`c\` (create), \`d\` (destructive) or \`cd\` (both).` };
        const scope = m[1].toLowerCase();
        if (!isScope(scope)) return { ok: false, error: `"${scope}" isn't something that can be granted. Use one of: ${SCOPES.map((s) => `\`${s}\``).join(', ')}.` };
        const tiers = merged.get(scope) || new Set();
        for (const word of m[2].toLowerCase().split(/[\s+/&]+/).filter(Boolean)) {
            if (!TIER_ALIASES[word]) return { ok: false, error: `"${word}" isn't a tier. Use \`c\` (create), \`d\` (destructive) or \`cd\` (both).` };
            for (const t of TIER_ALIASES[word]) tiers.add(t);
        }
        merged.set(scope, tiers);
    }
    // Table order, tiers in table order, so the same grant always stores and renders the same way.
    const grants = SCOPES.filter((s) => merged.has(s)).map((scope) => ({ scope, tiers: TIERS.filter((t) => merged.get(scope).has(t)) }));
    return { ok: true, grants };
}

const tierLetters = (tiers) => TIERS.filter((t) => (tiers || []).includes(t)).map((t) => t[0]).join('');

// The inverse of parseGrantsInput, for pre-filling the Edit Permissions box.
function grantsToInput(grants) {
    return (grants || []).filter((g) => isScope(g.scope) && (g.tiers || []).length).map((g) => `${g.scope}: ${tierLetters(g.tiers)}`).join('\n');
}

// One readable line for the /bot access cards and confirmations. 🔴 Every grant renders. A summary that silently drops a scope it does not recognise is how the old formatter hid the 'destructive' token: an owner reviewing someone's access could not see that they held it.
function formatGrants(grants) {
    const parts = (grants || []).filter((g) => (g.tiers || []).length).map((g) => {
        const tiers = TIERS.filter((t) => g.tiers.includes(t)).map((t) => TIER_LABELS[t]).join(' + ');
        const where = scopeKind(g.scope) === 'page' ? `${scopeLabel(g.scope)} (/${g.scope.split('.')[0]})` : scopeLabel(g.scope);
        return `${where}: ${tiers}`;
    });
    return parts.length ? parts.join(' · ') : '*(none)*';
}

// The whole table as plain data, for the portal's Access realm and its tests: everything a grid needs to draw its rows and columns, and nothing it would have to re-derive.
function describe() {
    return {
        tiers: TIERS.map((key) => ({ key, label: TIER_LABELS[key] })),
        scopes: SCOPES.map((key) => ({ key, label: scopeLabel(key), kind: scopeKind(key), carries: [...(COMMANDS[key]?.carries || [])] })),
        opTiers: { ...OP_TIERS },
        undoTier: UNDO_TIER,
        changeEditTier: CHANGE_EDIT_TIER,
        outsideActions: JSON.parse(JSON.stringify(OUTSIDE_ACTIONS)),
        popupFirstEntries: { ...POPUP_FIRST_ENTRIES },
        ownerOnly: [...OWNER_ONLY],
    };
}

module.exports = {
    TIERS, TIER_LABELS, MANAGE_PAGES, BOT_PAGES, COMMANDS, SCOPES, OP_TIERS, UNDO_TIER, CHANGE_EDIT_TIER,
    OUTSIDE_ACTIONS, POPUP_FIRST_ENTRIES, OWNER_ONLY,
    manageScope, botScope, scopeLabel, scopeKind, isScope, isTier,
    expandGrants, fullTiers, legacyToGrants, grantsOf, tierForOp, tierForAction,
    parseGrantsInput, grantsToInput, formatGrants, describe,
};
