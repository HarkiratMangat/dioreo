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
    // ⚠️ A SET, NOT A LIST. `parsePermissionsInput` accepts "manage, manage.draws", and with the
    // two effects below now both applying (they were mutually exclusive until 2026-08-24), that
    // admin was pushed TWICE for manage.draws — so ids.length === 2 and the one scope they hold
    // most explicitly was the one scope never reported as a single point. Deduping by id makes
    // "how many people hold this" mean what it says.
    const holders = new Map(); // scope -> Set<discordId>
    for (const scope of [...ADMIN_COMMANDS, ...MANAGE_PAGE_SCOPES.map(p => `manage.${p}`)]) {
        holders.set(scope, new Set());
    }
    for (const admin of admins) {
        for (const perm of admin.permissions || []) {
            // 🔴 `manage` COUNTS AS ITSELF, not only as its expansion. This was an `else if`, so a bare
            // `manage` recorded holders for the eight page scopes and never for `manage` -- leaving the
            // token permanently at 0 holders and therefore never reportable, when a lone holder of the
            // FULL token is the most consequential single point of failure there is: lose them and every
            // page goes at once. Found 2026-08-24 rebuilding the Access mockup on the real permission
            // model, where the page's own count disagreed with this endpoint's. Both effects now apply.
            if (holders.has(perm)) holders.get(perm).add(admin.discordId);
            if (perm === 'manage') {
                for (const p of MANAGE_PAGE_SCOPES) holders.get(`manage.${p}`)?.add(admin.discordId);
            }
        }
    }
    const spof = [];
    for (const [scope, ids] of holders) if (ids.size === 1) spof.push({ scope, discordId: [...ids][0] });
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
            // 🔴 DIRECT vs INHERITED is the whole reason a grid beats the comma-separated string it replaces, and the original shape collapsed them into one boolean. A bare `manage` token lights every page column -- but you did not hand those pages over individually, and revoking `manage` takes all of them back at once. 06-access-and-analytics.html renders the two differently for exactly that reason, and its own legend spells it out: "granted directly / inherited — bare manage covers every page."
            const direct = perms.includes(scope.key);
            const inherited = scope.kind === 'page' && !direct && perms.includes('manage');
            grants[scope.key] = { direct, inherited, held: direct || inherited };
        }
        // ⚠️ `grantedAt` IS STORED. models/AdminUser.js has declared `grantedAt: { type: Date, default: Date.now }` since 566b3ca (2026-08-13) and every live document carries one -- this comment previously asserted the model "has no timestamp at all", which was already ten days stale when it was written, and the derivation below silently discarded the real value. The ObjectId fallback is kept for a document written before the field existed, but it is a FALLBACK: an ObjectId's embedded timestamp is the DOCUMENT's creation and never moves when permissions are later edited, so it answers a different question than "when was this granted".
        const grantedAt = admin.grantedAt
            ? new Date(admin.grantedAt)
            : (admin._id ? new Date(parseInt(String(admin._id).slice(0, 8), 16) * 1000) : null);
        return { discordId: admin.discordId, grants, permissions: perms, grantedBy: admin.grantedBy || null, note: admin.note || '', grantedAt };
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
