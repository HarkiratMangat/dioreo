// core/mongo/positional.js
//
// ⚠️ WHY THIS FILE EXISTS. models/SeasonalData.js is ONE global document whose arrays hold newDraws, returningDraws, calendar and patchNotes. So a draws edit and a calendar edit touch the same document, and ordinary document-level optimistic locking (__v) would raise a conflict on nearly every pair of UNRELATED concurrent edits — false conflicts that train you to click through the warning, which is worse than no check. But skipping versioning is worse still: doc.save() on a stale copy writes the whole array back and silently reverts the other edit.
//
// So conflicts are detected at ELEMENT identity: pin the subdocument by _id AND assert its prior values in the same filter. A mismatch matches zero documents, which IS the conflict signal.
//
// ⚠️ WHAT THIS CHECK CAN AND CANNOT CATCH (2026-11-04 00:45 EST, found by the /manage audit). Every caller in core/ops builds `expect` from a `cur` it read INSIDE the same apply(), in the same transaction, so the assertion compares a document with its own snapshot: it can only fail when a value does not survive the Mongoose cast (which is how it failed Harkirat, on draws whose items had no _id), never because another editor got there first. Real concurrent writers are stopped by MongoDB's own write-conflict abort and withTransaction's retry, which re-reads. An edit made AFTER a pop-up opened is not detected at all: see the deferred list, 'Edit pop-ups carry no version'. A caller that wants a real check must pass an `expect` captured BEFORE the write began.
//
// 🔴 Nothing in core/ may call .save() on a SeasonalData document. This module is the only writer.

const { isDeepStrictEqual } = require('util');

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

// 🔴 WHY ARRAYS OF OBJECTS ARE NOT IN THE MONGO FILTER (found 2026-11-04 00:11 EST, prod "Herrscher of Thunder Draw": every edit that sent `items` failed "op 0 failed: conflict"). Mongoose CASTS a query filter against the schema, and casting a subdocument array MINTS a fresh `_id` for every element that lacks one. Eight prod draws were stored with item subdocuments that have no `_id` (written by something other than Mongoose; the origin is unknown), so the cast filter carried ids that no stored item has and matched zero documents -- indistinguishable from a real conflict. The same filter without the cast matched. So an array whose elements are objects is verified HERE instead, against a fresh read of the element in the same session (a transaction, in every caller that matters), by deep equality that ignores key order. Scalars, dates and arrays of primitives keep the Mongo-side assertion, which is the real concurrency guard.
function isObjectArray(v) {
    return Array.isArray(v) && v.some(x => x !== null && typeof x === 'object');
}

// Splits `expect` into what Mongo asserts (`guard`) and what is compared in code (`deep`).
function splitExpect(expect) {
    const guard = {};
    const deep = {};
    for (const [k, v] of Object.entries(expect || {})) (isObjectArray(v) ? deep : guard)[k] = v;
    return { guard, deep };
}

// JSON round-trip first, so an ObjectId, a Date and a plain string compare as their stored forms, whichever side came from lean() and whichever from a payload.
function sameStored(a, b) {
    return isDeepStrictEqual(JSON.parse(JSON.stringify(a ?? null)), JSON.parse(JSON.stringify(b ?? null)));
}

async function updateElement({ Model, docFilter, arrayPath, elementId, expect, set, session }) {
    if (!expect || Object.keys(expect).length === 0) {
        throw new Error('updateElement: `expect` may not be empty — an unguarded positional write can win a race it should lose');
    }
    const { guard, deep } = splitExpect(expect);
    if (Object.keys(deep).length) {
        const fresh = await Model.findOne({ ...docFilter, [`${arrayPath}._id`]: elementId }).select(arrayPath).lean().session(session);
        // A dotted path ('draft.newDraws') is walked, so a future draft caller is not read as 'missing'.
        const el = arrayPath.split('.').reduce((o, k) => o?.[k], fresh)?.find(e => String(e._id) === String(elementId));
        if (!el) return { ok: false, reason: 'missing' };
        if (!Object.entries(deep).every(([k, v]) => sameStored(el[k], v))) return { ok: false, reason: 'conflict' };
    }
    // buildElementFilter refuses an empty `expect`; with only deep fields the element pin by _id is the whole Mongo-side filter.
    const filter = Object.keys(guard).length
        ? buildElementFilter({ docFilter, arrayPath, elementId, expect: guard })
        : { ...docFilter, [`${arrayPath}._id`]: elementId };
    const res = await Model.updateOne(filter, buildElementUpdate({ arrayPath, set }), { session });
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

module.exports = { buildElementFilter, buildElementUpdate, updateElement, appendElement, removeElement, resortByDate, splitExpect, sameStored };
