// portal/api/access.js
//
// Access realm \u2014 owner-only, exactly like /bot access (spec §8.2: "no column, no grantable scope"). NOT part of the core operation algebra: admin grants/revokes are direct AdminUser writes, same as they always have been through /bot access, and a live PortalSession end is a direct write too. gateCommit is still used for grant/revoke (tier 3 \u2014 irreversible in effect, since a grant is a real privilege change) so the same typed-confirmation control governs every tier-3 action.
const AdminUser = require('../../models/AdminUser');
const PortalSession = require('../../models/PortalSession');
const { isOwner, parsePermissionsInput, invalidateAdminCache, MANAGE_PAGE_SCOPES, ADMIN_COMMANDS } = require('../../utils/adminAccess');
const { readJsonBody } = require('./httpUtil');

// Access grant/revoke reuses ONLY the typed-confirmation half of the tier-3 model, never the export leg -- gateCommit's exportedAt check has no meaning for a permission change (there is no data to export), and this review pass caught that the original code accepted `body.exportedAt` straight from the client, which would have let any caller satisfy that half of the gate by just sending a timestamp. A permission change has exactly one real safeguard: the admin must type the target's own Discord ID before it takes effect.
function confirmMatchesTarget(confirmText, discordId) {
    return typeof confirmText === 'string' && confirmText === discordId;
}

function ownerOnly(handler) {
    return async (req, res, url, session) => {
        if (!isOwner(session.discordId)) {
            res.writeHead(403, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Access is owner-only.' }));
        }
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

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/access$/, requireAdmin(ownerOnly(async (req, res) => {
        const admins = await AdminUser.find({}).lean();
        const sessions = await PortalSession.find({ revokedAt: null }).sort({ lastSeenAt: -1 }).lean();
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ admins, sessions, singlePointsOfFailure: singlePointsOfFailure(admins) }));
    })));

    route('POST', /^\/api\/access\/grant$/, requireAdmin(ownerOnly(async (req, res, url, session) => {
        const body = await readJsonBody(req);
        const permissions = parsePermissionsInput((body.permissions || []).join(','));
        if (!permissions) {
            res.writeHead(400, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: 'One or more permission tokens were not recognized.' }));
        }
        if (!confirmMatchesTarget(body.confirmText, body.discordId)) {
            res.writeHead(409, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ ok: false, reason: 'Type the exact Discord ID being granted to confirm.' }));
        }

        await AdminUser.findOneAndUpdate(
            { discordId: body.discordId },
            { discordId: body.discordId, grantedBy: session.discordId, permissions, note: body.note || '' },
            { upsert: true, new: true }
        );
        invalidateAdminCache();
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
    })));

    route('POST', /^\/api\/access\/revoke$/, requireAdmin(ownerOnly(async (req, res, url, session) => {
        const body = await readJsonBody(req);
        if (!confirmMatchesTarget(body.confirmText, body.discordId)) {
            res.writeHead(409, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ ok: false, reason: 'Type the exact Discord ID being revoked to confirm.' }));
        }
        await AdminUser.deleteOne({ discordId: body.discordId });
        invalidateAdminCache();
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
    })));

    // Ending a live session is NOT tier 3 \u2014 it costs the signed-in device a re-login, nothing irreversible. The spec's H8/§8.2 calls this out as something the bot itself cannot do at all (revoking an admin in Discord does not kill a browser session).
    route('POST', /^\/api\/access\/session\/end$/, requireAdmin(ownerOnly(async (req, res) => {
        const body = await readJsonBody(req);
        await PortalSession.updateOne({ sessionHash: body.sessionHash }, { revokedAt: new Date() });
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
    })));
}

module.exports = { register, singlePointsOfFailure };
