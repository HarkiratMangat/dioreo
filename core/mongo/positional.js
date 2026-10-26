// core/mongo/positional.js
//
// ⚠️ WHY THIS FILE EXISTS. models/SeasonalData.js is ONE global document whose arrays hold newDraws, returningDraws, calendar and patchNotes. So a draws edit and a calendar edit touch the same document, and ordinary document-level optimistic locking (__v) would raise a conflict on nearly every pair of UNRELATED concurrent edits — false conflicts that train you to click through the warning, which is worse than no check. But skipping versioning is worse still: doc.save() on a stale copy writes the whole array back and silently reverts the other edit.
//
// So conflicts are detected at ELEMENT identity: pin the subdocument by _id AND assert its prior values in the same filter. A mismatch matches zero documents, which IS the conflict signal.
//
// 🔴 Nothing in core/ may call .save() on a SeasonalData document. This module is the only writer.

function buildElementFilter({ docFilter, arrayPath, elementId, expect }) {
    if (!expect || Object.keys(expect).length === 0) {
        throw new Error('buildElementFilter: `expect` may not be empty — an unguarded positional write can win a race it should lose');
    }
    const filter = { ...docFilter, [`${arrayPath}._id`]: elementId };
    for (const [k, v] of Object.entries(expect)) filter[`${arrayPath}.${k}`] = v;
    return filter;
}

function buildElementUpdate({ arrayPath, set }) {
    const $set = {};
    for (const [k, v] of Object.entries(set)) $set[`${arrayPath}.$.${k}`] = v;
    return { $set };
}

async function updateElement({ Model, docFilter, arrayPath, elementId, expect, set, session }) {
    const res = await Model.updateOne(
        buildElementFilter({ docFilter, arrayPath, elementId, expect }),
        buildElementUpdate({ arrayPath, set }),
        { session }
    );
    if (res.matchedCount === 1) return { ok: true };
    // Distinguish "someone changed it" from "it is gone" — the messages a human needs differ.
    const stillThere = await Model.countDocuments({ ...docFilter, [`${arrayPath}._id`]: elementId }, { session });
    return { ok: false, reason: stillThere ? 'conflict' : 'missing' };
}

async function appendElement({ Model, docFilter, arrayPath, element, session }) {
    const res = await Model.updateOne(docFilter, { $push: { [arrayPath]: element } }, { session });
    return res.matchedCount === 1 ? { ok: true } : { ok: false, reason: 'missing' };
}

async function removeElement({ Model, docFilter, arrayPath, elementId, session }) {
    const res = await Model.updateOne(docFilter, { $pull: { [arrayPath]: { _id: elementId } } }, { session });
    return res.modifiedCount === 1 ? { ok: true } : { ok: false, reason: 'missing' };
}

// Hoisted out of core/ops/draws.js and core/ops/calendar.js (2026-08-21) -- both entities had a byte-for-byte-identical copy, needed for the same reason: neither read side (commands/draws.js, commands/calendar.js) sorts these arrays, so every mutation that can change order re-sorts in the same transaction before returning. Returns the sorted array so a caller doesn't need its own extra fetch just to read the post-sort array/count.
async function resortByDate(Model, docFilter, arrayPath, session) {
    const fresh = await Model.findOne(docFilter).select(arrayPath).lean().session(session);
    const sorted = [...fresh[arrayPath]].sort((a, b) => new Date(a.date) - new Date(b.date));
    await Model.updateOne(docFilter, { $set: { [arrayPath]: sorted } }, { session });
    return sorted;
}

module.exports = { buildElementFilter, buildElementUpdate, updateElement, appendElement, removeElement, resortByDate };
