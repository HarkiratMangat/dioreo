// portal/api/changesets.js
//
// The generic changeset pathway shared by every realm that drives core/ops (Season, Armory, Broadcast) — compose ops, preview them, commit atomically. Access and Analytics do NOT go through this: Access mutates AdminUser/PortalSession directly (there is no core/ops entity for admin grants), and Analytics only ever reverts an already-committed change via core/revert.js.
//
// Permission is resolved per-op, server-side, on every request (H7) — never trusted from which realm the client claims to be showing.
const Changeset = require('../../models/Changeset');
const { validateSet, previewSet, commitSet, pageForOp } = require('../../core/changeset');
const { revertChange } = require('../../core/revert');
const { getChange } = require('../../utils/changeStore');
const { hasManagePageAccess, isOwner } = require('../../utils/adminAccess');
const { gateCommit } = require('./policy');
const { readJsonBody, segment } = require('./httpUtil');

async function assertOpsAccess(discordId, ops) {
    for (const op of ops) {
        const page = pageForOp(op);
        // eslint-disable-next-line no-await-in-loop
        if (!isOwner(discordId) && !(await hasManagePageAccess(discordId, page))) {
            return { ok: false, reason: `You do not have access to the "${page}" page.` };
        }
    }
    return { ok: true };
}

function register(route) {
    const { requireAdmin } = require('../auth');

    // POST /api/changeset  { realm, ops[], changesetId? } -> stage/update a draft, return preview
    route('POST', /^\/api\/changeset$/, requireAdmin(async (req, res, url, session) => {
        const body = await readJsonBody(req);
        const { realm, ops, changesetId } = body;
        if (!Array.isArray(ops) || ops.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: 'ops must be a non-empty array' }));
        }
        const access = await assertOpsAccess(session.discordId, ops);
        if (!access.ok) { res.writeHead(403, { 'content-type': 'application/json' }); return res.end(JSON.stringify(access)); }

        const v = validateSet(ops);
        const state = v.ok ? 'staged' : 'blocked';
        let doc;
        if (changesetId) {
            doc = await Changeset.findOne({ _id: changesetId, authorId: session.discordId });
            if (!doc) { res.writeHead(404); return res.end(JSON.stringify({ error: 'no such changeset' })); }
            doc.ops = ops; doc.state = state; doc.tier = v.tier;
        } else {
            doc = new Changeset({ authorId: session.discordId, realm, ops, state, tier: v.tier });
        }
        await doc.save();

        let preview = null;
        try {
            const live = {}; // preview() takes live state per-op; entities fetch their own inside preview()
            preview = v.ok ? previewSet(v.normalized, live) : null;
        } catch (e) { console.error('Portal changeset preview failed:', e); }

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ changesetId: doc._id, state: doc.state, tier: doc.tier, failures: v.failures, preview }));
    }));

    // POST /api/changeset/:id/export -> marks the tier-3 export gate satisfied
    route('POST', /^\/api\/changeset\/[^/]+\/export$/, requireAdmin(async (req, res, url, session) => {
        const id = segment(url, 2);
        const doc = await Changeset.findOne({ _id: id, authorId: session.discordId });
        if (!doc) { res.writeHead(404); return res.end(JSON.stringify({ error: 'no such changeset' })); }
        doc.exportedAt = new Date();
        await doc.save();
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ exportedAt: doc.exportedAt }));
    }));

    // POST /api/changeset/:id/commit  { confirmText? }
    route('POST', /^\/api\/changeset\/[^/]+\/commit$/, requireAdmin(async (req, res, url, session) => {
        const id = segment(url, 2);
        const body = await readJsonBody(req);
        const doc = await Changeset.findOne({ _id: id, authorId: session.discordId });
        if (!doc) { res.writeHead(404); return res.end(JSON.stringify({ error: 'no such changeset' })); }

        const access = await assertOpsAccess(session.discordId, doc.ops);
        if (!access.ok) { res.writeHead(403, { 'content-type': 'application/json' }); return res.end(JSON.stringify(access)); }

        const gate = gateCommit({
            tier: doc.tier, exportedAt: doc.exportedAt,
            confirmText: body.confirmText, expectText: doc.realm,
        });
        if (!gate.ok) { res.writeHead(409, { 'content-type': 'application/json' }); return res.end(JSON.stringify(gate)); }

        const result = await commitSet(doc.ops, { actorId: session.discordId });
        if (!result.ok) { res.writeHead(409, { 'content-type': 'application/json' }); return res.end(JSON.stringify(result)); }

        doc.state = 'committed';
        doc.committedAt = new Date();
        await doc.save();
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(result));
    }));

    // POST /api/revert/:changeId
    route('POST', /^\/api\/revert\/[^/]+$/, requireAdmin(async (req, res, url, session) => {
        const changeId = segment(url, 2);
        const row = await getChange(changeId);
        if (!row) { res.writeHead(404); return res.end(JSON.stringify({ error: 'no such change' })); }
        // F24: a 'bot'-token analytics admin re-checks the CHANGE'S OWN PAGE before reverting it — the bot_ router prefix (and here, requireAdmin's door check) proves only SOME admin access.
        if (!isOwner(session.discordId) && !(await hasManagePageAccess(session.discordId, row.page))) {
            res.writeHead(403, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: `You do not have access to the "${row.page}" page.` }));
        }
        const result = await revertChange(changeId, { actorId: session.discordId });
        res.writeHead(result.ok ? 200 : 409, { 'content-type': 'application/json' });
        res.end(JSON.stringify(result));
    }));
}

module.exports = { register, assertOpsAccess };
