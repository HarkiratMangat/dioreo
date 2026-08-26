// portal/api/review.js — the cross-realm review surface.
//
// Every other realm answers "what is in this part of the bot". Review answers the one question none of them can: what is about to change, everywhere at once, and what will it overwrite. The Board shows an admin's changesets for ONE realm as cards; this flattens every open changeset they own, in every realm, down to the individual operations, each with its own field-level diff.
//
// 🔴 IT COMPUTES NOTHING OF ITS OWN. Tier comes from validateSet, the diff from previewSet, the commit gate from board.logic's gateCommit, the wording from describeOp — the same functions the Board and the realm routes already use. The mockup's own header records why that matters: an earlier draft kept a second ledger of "has this been exported?" and the review screen refused a commit the store considered ready. Two answers to one question, and the screen that decides was reading the wrong one.
const Changeset = require('../../models/Changeset');
const SeasonalData = require('../../models/SeasonalData');
const { validateSet, previewSet } = require('../../core/changeset');
const { requireAdmin } = require('../auth');
const { sendJson, forbidden } = require('./httpUtil');
const { visibleRealms } = require('./realmAccess');

// A changeset still in play. 'committed' and 'discarded' have left the board (board.logic's columnFor treats them identically), so neither belongs on a screen about what is ABOUT to happen.
const OPEN_STATES = ['draft', 'staged', 'blocked'];

// board.logic.js is a classic script in the browser and CommonJS in Node — the same file, read two ways. Requiring it here is the Node half, and it is the ONLY copy: a second implementation of describeOp on the server is how the review screen and the Board start describing one change differently.
const { describeOp, describeInverse, diffRows, gateCommit } = require('../ui/board.logic');

// Was the record edited out from under this op after it was staged? The changeset stores what you want to write, never what you were writing over, so the answer needs the `baseline` captured at stage time (models/Changeset.js) compared against a fresh preview of the same op. No baseline means the changeset predates the field — reported as unknown rather than as clean, because "we did not look" and "we looked and it is fine" are different facts.
function stalenessOf(baseline, fresh, index) {
    if (!Array.isArray(baseline) || baseline.length <= index) return { stale: false, checked: false };
    const was = baseline[index];
    const now = fresh && fresh.before !== undefined ? fresh.before : null;
    return { stale: JSON.stringify(was) !== JSON.stringify(now), checked: true };
}

function register(route) {
    // GET /api/review — every open changeset this admin owns, flattened to reviewable operations.
    route('GET', /^\/api\/review$/, requireAdmin(async (req, res, url, session) => {
        const { SEASON_PAGES } = require('./season');
        const { ARMORY_PAGES } = require('./armory');
        const { BROADCAST_PAGES } = require('./broadcast');
        const realms = await visibleRealms(session.discordId, { SEASON_PAGES, ARMORY_PAGES, BROADCAST_PAGES });
        if (!realms.includes('review')) return forbidden(res, 'forbidden');

        const docs = await Changeset.find({ authorId: session.discordId, state: { $in: OPEN_STATES } })
            .sort({ createdAt: 1 }).lean();

        // One live read for every changeset rather than one each: previewSet takes the season document as its `live` argument and re-fetching it per changeset would be the same query run N times, with the added hazard that two changesets could preview against two different snapshots and disagree about what the record currently says.
        let live = {};
        try { live = (await SeasonalData.findOne({ docType: 'global' }).lean()) || {}; }
        catch (e) { console.error('Portal review live-state fetch failed:', e); }

        const ops = [];
        for (const doc of docs) {
            const v = validateSet(doc.ops);
            let preview = [];
            // A changeset that no longer validates is exactly the kind this screen must still show — it is blocked, and the reader needs to see WHY rather than find it missing.
            try { preview = v.ok ? await previewSet(v.normalized, live) : []; }
            catch (e) { console.error('Portal review preview failed:', e); }

            doc.ops.forEach((op, index) => {
                const fresh = preview[index] || null;
                const rows = fresh ? diffRows(fresh.before, fresh.after) : [];
                const { stale, checked } = stalenessOf(doc.baseline, fresh, index);
                const failure = (v.failures || []).find((f) => f.index === index) || null;
                ops.push({
                    id: `${doc._id}:${index}`,
                    changesetId: String(doc._id),
                    index,
                    realm: doc.realm,
                    op: op.type,
                    tier: doc.tier,
                    name: describeOp(op),
                    verb: describeInverse(op) || 'changed',
                    rows,
                    // A tier-3 op is the destructive kind: it has no inverse worth trusting, which is the whole reason the export gate exists.
                    destroys: doc.tier === 3,
                    exported: Boolean(doc.exportedAt),
                    exportedAt: doc.exportedAt || null,
                    stale,
                    staleChecked: checked,
                    blocked: failure ? failure.reason || 'This change no longer validates.' : null,
                    confirmText: String(doc._id).slice(-8).toUpperCase(),
                });
            });
        }

        // The gate is asked ONCE PER CHANGESET, because that is the unit that commits. Reporting it per op would imply an op can be committed on its own, which is the opposite of the atomicity this screen exists to make legible.
        const changesets = docs.map((doc) => ({
            id: String(doc._id), realm: doc.realm, tier: doc.tier, state: doc.state,
            exportedAt: doc.exportedAt || null,
            confirmText: String(doc._id).slice(-8).toUpperCase(),
            opCount: doc.ops.length,
            gate: gateCommit({ tier: doc.tier, exportedAt: doc.exportedAt, confirmText: '', expectText: String(doc._id).slice(-8).toUpperCase() }),
        }));

        sendJson(res, 200, { ops, changesets });
    }));
}

module.exports = { register, OPEN_STATES, stalenessOf };
