// portal/api/changesets.js
//
// The generic changeset pathway shared by every realm that drives core/ops (Season, Armory, Broadcast) — compose ops, preview them, commit atomically. Access and Analytics do NOT go through this: Access mutates AdminUser/PortalSession directly (there is no core/ops entity for admin grants), and Analytics only ever reverts an already-committed change via core/revert.js.
//
// Permission is resolved per-op, server-side, on every request (H7) — never trusted from which realm the client claims to be showing.
const Changeset = require('../../models/Changeset');
const SeasonalData = require('../../models/SeasonalData');
const { validateSet, previewSet, commitSet, pageForOp } = require('../../core/changeset');
const { revertChange } = require('../../core/revert');
const { getChange } = require('../../utils/changeStore');
const { hasManagePageAccess, isOwner } = require('../../utils/adminAccess');
const { gateCommit } = require('./policy');
const { readJsonBody, segment, sendJson, forbidden } = require('./httpUtil');

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

    // GET /api/changeset?realm=X -> the caller's own changesets for that realm (any state). Board (Task 5/6) has nothing to render without this -- it was missing entirely until this review pass, so every realm's Board column stayed permanently empty.
    route('GET', /^\/api\/changeset$/, requireAdmin(async (req, res, url, session) => {
        const realm = url.searchParams.get('realm');
        const query = { authorId: session.discordId, state: { $ne: 'discarded' } };
        if (realm) query.realm = realm;
        const docs = await Changeset.find(query).sort({ createdAt: -1 }).lean();
        sendJson(res, 200, { changesets: docs });
    }));

    // POST /api/changeset  { realm, ops[], changesetId? } -> stage/update a draft, return preview
    route('POST', /^\/api\/changeset$/, requireAdmin(async (req, res, url, session) => {
        const body = await readJsonBody(req);
        const { realm, ops, changesetId } = body;
        if (!Array.isArray(ops) || ops.length === 0) return sendJson(res, 400, { error: 'ops must be a non-empty array' });
        const access = await assertOpsAccess(session.discordId, ops);
        if (!access.ok) return forbidden(res, access.reason);

        const v = validateSet(ops);
        const state = v.ok ? 'staged' : 'blocked';
        let doc;
        if (changesetId) {
            doc = await Changeset.findOne({ _id: changesetId, authorId: session.discordId });
            if (!doc) return sendJson(res, 404, { error: 'no such changeset' });
            doc.ops = ops; doc.state = state; doc.tier = v.tier;
        } else {
            doc = new Changeset({ authorId: session.discordId, realm, ops, state, tier: v.tier });
        }
        // doc.save() runs alongside the live-state fetch below rather than after it (efficiency review) -- they're independent, but a save failure must still propagate unguarded rather than being swallowed by the preview try/catch, so it's awaited separately afterward.
        const savePromise = doc.save();

        let preview = null;
        try {
            // 🔴 CODE REVIEW FOUND: this used to pass an empty {} as live state. draws/calendar/ patchnotes/season op preview()s all read live.newDraws/.calendar/.patchNotes/ .currentSeasonTitle/.draft directly (no defensive guard), so previewSet threw on an empty object -- confirmed reproduced (season.startNew / season.promoteDraft, both tier 3, both threw). loadouts/announcements previews self-fetch or ignore the param, so passing the real SeasonalData doc for every realm is harmless where it is unused.
            const live = (await SeasonalData.findOne({ docType: 'global' }).lean()) || {};
            preview = v.ok ? await previewSet(v.normalized, live) : null;
        } catch (e) { console.error('Portal changeset preview failed:', e); }
        await savePromise;

        sendJson(res, 200, { changesetId: doc._id, state: doc.state, tier: doc.tier, failures: v.failures, preview });
    }));

    // GET /api/changeset/:id/preview -> the stored ops' before/after, re-run against live state.
    //
    // The POST route above already computes a preview and returns it, and the client threw it away (composeClient.js's stageOps ignores the body). That preview is also a snapshot from staging time, which is precisely the wrong thing for the review screen: the whole point of reviewing a tier-3 change is to see what it would do to the state that exists RIGHT NOW, so a set staged an hour ago and edited in Discord since shows its real, current consequence rather than the one it would have had. previewSet is pure and reads live state, so re-running it is the correct answer and not a cache miss.
    route('GET', /^\/api\/changeset\/[^/]+\/preview$/, requireAdmin(async (req, res, url, session) => {
        const id = segment(url, 2);
        const doc = await Changeset.findOne({ _id: id, authorId: session.discordId }).lean();
        if (!doc) return sendJson(res, 404, { error: 'no such changeset' });
        const access = await assertOpsAccess(session.discordId, doc.ops);
        if (!access.ok) return forbidden(res, access.reason);

        const v = validateSet(doc.ops);
        let preview = [];
        try {
            const live = (await SeasonalData.findOne({ docType: 'global' }).lean()) || {};
            preview = v.ok ? await previewSet(v.normalized, live) : [];
        } catch (e) { console.error('Portal changeset preview failed:', e); }
        sendJson(res, 200, {
            changesetId: doc._id, tier: doc.tier, state: doc.state, realm: doc.realm,
            ops: doc.ops, exportedAt: doc.exportedAt, failures: v.failures || [], preview,
            confirmText: String(doc._id).slice(-8).toUpperCase(),
        });
    }));

    // POST /api/changeset/:id/export -> marks the tier-3 export gate satisfied
    route('POST', /^\/api\/changeset\/[^/]+\/export$/, requireAdmin(async (req, res, url, session) => {
        const id = segment(url, 2);
        const doc = await Changeset.findOne({ _id: id, authorId: session.discordId });
        if (!doc) return sendJson(res, 404, { error: 'no such changeset' });
        doc.exportedAt = new Date();
        await doc.save();
        sendJson(res, 200, { exportedAt: doc.exportedAt });
    }));

    // POST /api/changeset/:id/discard — 🔴 state:'discarded' has been a recognized value in columnFor() (board.logic.js) since the Board pipeline was built — it just had no route that ever set it, so there was no way to abandon a staged or blocked change anywhere in the portal. Never a hard delete: the row stays for history/audit, columnFor already treats it as leaving the board, exactly like 'committed'.
    route('POST', /^\/api\/changeset\/[^/]+\/discard$/, requireAdmin(async (req, res, url, session) => {
        const id = segment(url, 2);
        const doc = await Changeset.findOne({ _id: id, authorId: session.discordId });
        if (!doc) return sendJson(res, 404, { error: 'no such changeset' });
        if (doc.state === 'committed') return sendJson(res, 409, { error: 'already committed, cannot discard' });
        doc.state = 'discarded';
        doc.discardedAt = new Date();
        await doc.save();
        sendJson(res, 200, { state: doc.state });
    }));

    // POST /api/changeset/:id/commit  { confirmText? }
    route('POST', /^\/api\/changeset\/[^/]+\/commit$/, requireAdmin(async (req, res, url, session) => {
        const id = segment(url, 2);
        const body = await readJsonBody(req);
        const doc = await Changeset.findOne({ _id: id, authorId: session.discordId });
        if (!doc) return sendJson(res, 404, { error: 'no such changeset' });

        const access = await assertOpsAccess(session.discordId, doc.ops);
        if (!access.ok) return forbidden(res, access.reason);

        const gate = gateCommit({
            tier: doc.tier, exportedAt: doc.exportedAt,
            confirmText: body.confirmText, expectText: String(doc._id).slice(-8).toUpperCase(),
        });
        if (!gate.ok) return sendJson(res, 409, gate);

        const result = await commitSet(doc.ops, { actorId: session.discordId });
        if (!result.ok) return sendJson(res, 409, result);

        doc.state = 'committed';
        doc.committedAt = new Date();
        await doc.save();
        sendJson(res, 200, result);
    }));

    // POST /api/revert/:changeId
    route('POST', /^\/api\/revert\/[^/]+$/, requireAdmin(async (req, res, url, session) => {
        const changeId = segment(url, 2);
        const row = await getChange(changeId);
        if (!row) return sendJson(res, 404, { error: 'no such change' });
        // F24: a 'bot'-token analytics admin re-checks the CHANGE'S OWN PAGE before reverting it — the bot_ router prefix (and here, requireAdmin's door check) proves only SOME admin access.
        if (!isOwner(session.discordId) && !(await hasManagePageAccess(session.discordId, row.page))) {
            return forbidden(res, `You do not have access to the "${row.page}" page.`);
        }
        const result = await revertChange(changeId, { actorId: session.discordId });
        sendJson(res, result.ok ? 200 : 409, result);
    }));
}

module.exports = { register, assertOpsAccess };
