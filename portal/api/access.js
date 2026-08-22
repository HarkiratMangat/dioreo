// portal/api/access.js
//
// Access realm \u2014 owner-only, exactly like /bot access (spec §8.2: "no column, no grantable scope"). NOT part of the core operation algebra: admin grants/revokes are direct AdminUser writes, same as they always have been through /bot access, and a live PortalSession end is a direct write too. gateCommit is still used for grant/revoke (tier 3 \u2014 irreversible in effect, since a grant is a real privilege change) so the same typed-confirmation control governs every tier-3 action.
const AdminUser = require('../../models/AdminUser');
const PortalSession = require('../../models/PortalSession');
const { isOwner, parsePermissionsInput, invalidateAdminCache, MANAGE_PAGE_SCOPES, ADMIN_COMMANDS } = require('../../utils/adminAccess');
const { readJsonBody, sendJson, forbidden } = require('./httpUtil');

// Access grant/revoke reuses ONLY the typed-confirmation half of the tier-3 model, never the export leg -- gateCommit's exportedAt check has no meaning for a permission change (there is no data to export), and this review pass caught that the original code accepted `body.exportedAt` straight from the client, which would have let any caller satisfy that half of the gate by just sending a timestamp. A permission change has exactly one real safeguard: the admin must type the target's own Discord ID before it takes effect.
function confirmMatchesTarget(confirmText, discordId) {
    return typeof confirmText === 'string' && confirmText === discordId;
}

function ownerOnly(handler) {
    return async (req, res, url, session) => {
        if (!isOwner(session.discordId)) return forbidden(res, 'Access is owner-only.');
        return handler(req, res, url, session);
    };
}

// "By scope" \u2014 flags a scope held by exactly one non-owner (a single point of failure).
function singlePointsOfFailure(admins) {
    const holders = new Map(); // scope -> discordId[]
    for (const scope of [...ADMIN_COMMANDS, ...MANAGE_PAGE_SCOPES.map(p => `manage.${p}`)]) {
        holders.set(scope, []);
    }
    for (const admin of admins) {
        for (const perm of admin.permissions || []) {
            if (perm === 'manage') {
                for (const p of MANAGE_PAGE_SCOPES) holders.get(`manage.${p}`)?.push(admin.discordId);
            } else if (holders.has(perm)) {
                holders.get(perm).push(admin.discordId);
            }
        }
    }
    const spof = [];
    for (const [scope, ids] of holders) if (ids.length === 1) spof.push({ scope, discordId: ids[0] });
    return spof;
}

// Human-readable column labels for MANAGE_PAGE_SCOPES -- read from commands/manage.js's own content-picker choices (the real, already-shipped display names) rather than inventing new copy, per this repo's naming convention.
const PAGE_LABELS = {
    draws: 'Draws', calendar: 'Calendar', loadouts_mp: 'MP', loadouts_dmz: 'DMZ',
    patchnotes: 'Patch Notes', seasondraft: 'Season Draft', season: 'Season', announcement: 'Announcement',
};
const COMMAND_LABELS = { manage: 'Manage', autobuild: 'Autobuild', bot: 'Bot' };

// Gap audit §3.2: the permission-grid data this needs already exists (getAdminPermissionsMap, MANAGE_PAGE_SCOPES) -- this reuses the EXACT same scope enumeration singlePointsOfFailure() above already established, rather than a second list that could drift from it. Shaped for a grid component directly (rows=admins, columns=scopes), not a raw dump of AdminUser docs.
function buildPermissionMatrix(admins) {
    const scopes = [
        ...ADMIN_COMMANDS.map((key) => ({ key, label: COMMAND_LABELS[key] || key, kind: 'command' })),
        ...MANAGE_PAGE_SCOPES.map((page) => ({ key: `manage.${page}`, label: PAGE_LABELS[page] || page, kind: 'page' })),
    ];
    const rows = admins.map((admin) => {
        const perms = admin.permissions || [];
        const grants = {};
        for (const scope of scopes) {
            grants[scope.key] = scope.kind === 'page'
                ? (perms.includes('manage') || perms.includes(scope.key))
                : perms.includes(scope.key);
        }
        return { discordId: admin.discordId, grants };
    });
    return { admins: rows, scopes };
}

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/access$/, requireAdmin(ownerOnly(async (req, res) => {
        const admins = await AdminUser.find({}).lean();
        const sessions = await PortalSession.find({ revokedAt: null }).sort({ lastSeenAt: -1 }).lean();
        sendJson(res, 200, { admins, sessions, singlePointsOfFailure: singlePointsOfFailure(admins) });
    })));

    route('GET', /^\/api\/access\/matrix$/, requireAdmin(ownerOnly(async (req, res) => {
        const admins = await AdminUser.find({}).lean();
        sendJson(res, 200, buildPermissionMatrix(admins));
    })));

    route('POST', /^\/api\/access\/grant$/, requireAdmin(ownerOnly(async (req, res, url, session) => {
        const body = await readJsonBody(req);
        const permissions = parsePermissionsInput((body.permissions || []).join(','));
        if (!permissions) return sendJson(res, 400, { error: 'One or more permission tokens were not recognized.' });
        if (!confirmMatchesTarget(body.confirmText, body.discordId)) {
            return sendJson(res, 409, { ok: false, reason: 'Type the exact Discord ID being granted to confirm.' });
        }

        await AdminUser.findOneAndUpdate(
            { discordId: body.discordId },
            { discordId: body.discordId, grantedBy: session.discordId, permissions, note: body.note || '' },
            { upsert: true, new: true }
        );
        invalidateAdminCache();
        sendJson(res, 200, { ok: true });
    })));

    route('POST', /^\/api\/access\/revoke$/, requireAdmin(ownerOnly(async (req, res, url, session) => {
        const body = await readJsonBody(req);
        if (!confirmMatchesTarget(body.confirmText, body.discordId)) {
            return sendJson(res, 409, { ok: false, reason: 'Type the exact Discord ID being revoked to confirm.' });
        }
        await AdminUser.deleteOne({ discordId: body.discordId });
        invalidateAdminCache();
        sendJson(res, 200, { ok: true });
    })));

    // Ending a live session is NOT tier 3 \u2014 it costs the signed-in device a re-login, nothing irreversible. The spec's H8/§8.2 calls this out as something the bot itself cannot do at all (revoking an admin in Discord does not kill a browser session).
    route('POST', /^\/api\/access\/session\/end$/, requireAdmin(ownerOnly(async (req, res) => {
        const body = await readJsonBody(req);
        await PortalSession.updateOne({ sessionHash: body.sessionHash }, { revokedAt: new Date() });
        sendJson(res, 200, { ok: true });
    })));
}

module.exports = { register, singlePointsOfFailure, buildPermissionMatrix };
