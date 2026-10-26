// core/mongo/document.js
//
// Optimistic concurrency for entities that are their OWN Mongo document — models/Loadout.js and models/Announcement.js.
//
// ⚠️ THIS IS NOT core/mongo/positional.js AND THE TWO ARE NOT INTERCHANGEABLE. positional.js writes an element INSIDE an array on one shared document (SeasonalData), where document-level versioning would fire false conflicts on unrelated edits. Here every record is its own document, so plain __v versioning is exactly right — and pointing positional.js at one of these matches nothing and returns `missing`, which reads as a legitimate outcome rather than a bug.
//
// The `expectVersion: 0` case is why the guard tests for undefined and not falsiness: a freshly created document has __v === 0, and `if (!expectVersion)` would reject a perfectly valid write.

function buildVersionedFilter({ id, expectVersion }) {
    if (expectVersion === undefined || expectVersion === null) {
        throw new Error('buildVersionedFilter: `expectVersion` is required — an unguarded document write can win a race it should lose');
    }
    return { _id: id, __v: expectVersion };
}

async function updateDocument({ Model, id, expectVersion, set, session }) {
    const res = await Model.updateOne(
        buildVersionedFilter({ id, expectVersion }),
        { $set: set, $inc: { __v: 1 } },
        { session }
    );
    if (res.matchedCount === 1) return { ok: true, version: expectVersion + 1 };
    const exists = await Model.exists({ _id: id }, { session });
    return { ok: false, reason: exists ? 'conflict' : 'missing' };
}

async function createDocument({ Model, doc, session }) {
    const [created] = await Model.create([doc], { session });
    return { ok: true, id: String(created._id), version: created.__v ?? 0 };
}

async function deleteDocument({ Model, id, expectVersion, session }) {
    const res = await Model.deleteOne(buildVersionedFilter({ id, expectVersion }), { session });
    if (res.deletedCount === 1) return { ok: true };
    const exists = await Model.exists({ _id: id }, { session });
    return { ok: false, reason: exists ? 'conflict' : 'missing' };
}

module.exports = { buildVersionedFilter, updateDocument, createDocument, deleteDocument };
