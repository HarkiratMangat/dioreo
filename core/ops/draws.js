// core/ops/draws.js
//
// The seven draw mutations, as ops. This is the ONLY file that knows a draw's shape.
//
// ⚠️ `tier` is derived from REVERSIBILITY, not from how scary the button looks (spec §5):
//   1 — an exact inverse exists and is cheap to record
//   2 — multi-element or destroys prior state; the inverse is a snapshot taken at apply() time
//   3 — irreversible or system-altering; the caller must gate on an export before committing
const mongoose = require('mongoose');
const { registerEntity } = require('./index');
const { updateElement, appendElement, removeElement } = require('../mongo/positional');
const { toTitleCase, parseBulkDrawList, parseAdminDate } = require('../../utils/adminParser');
const { resolveThumbnailsForDraws, upsertByTitle } = require('../../utils/bulkMerge');
const SeasonalData = require('../../models/SeasonalData');

const DOC = { docType: 'global' };
const pathFor = (category) => (category === 'returning' ? 'returningDraws' : 'newDraws');

// ⚠️ FOUND DURING TASK 6 INTEGRATION (2026-08-20), not caught by plan 1's falsification pass:
// nothing on the READ side sorts newDraws/returningDraws by date -- commands/draws.js trusts the
// stored array order. The pre-core handler always re-sorted the whole array after every mutation
// that could change it (add/edit/bulk). An op that only appendElement()s or updateElement()s
// without re-sorting would silently degrade `/draws` display order the first time an edit changed a
// date or an add landed out of chronological order -- a real regression Task 6's own goal ("nothing
// changes for the user") exists to prevent. Every op below that can disturb order re-sorts in the
// same transaction before returning.
async function resortByDate(session, path) {
    const fresh = await SeasonalData.findOne(DOC).select(path).lean().session(session);
    const sorted = [...fresh[path]].sort((a, b) => new Date(a.date) - new Date(b.date));
    await SeasonalData.updateOne(DOC, { $set: { [path]: sorted } }, { session });
}

// 🔴 AN ALREADY-PARSED PAYLOAD IS NOT RE-PARSED. commitSet runs validateSet before applying —
// including on an INVERSE produced by invert(), which carries structured `parsed` data and never the
// original `text`. A validator that unconditionally re-parses `payload.text || ''` would parse an
// empty string, overwrite payload.parsed, and silently restore NOTHING. That would have made undo a
// no-op for bulkDelete, purge and bulkReplace. drawOps.test.js round-trips every inverse through
// validate() for exactly this reason.
const alreadyParsed = (op) => op.payload?.parsed && !op.payload?.text;

function validateOne(payload) {
    const errors = [];
    if (!payload?.title?.trim()) errors.push('A draw needs a title.');
    if (!['new', 'returning'].includes(payload?.category)) errors.push('Category must be "new" or "returning".');
    if (payload?.endDate && !parseAdminDate(payload.endDate)) errors.push(`Could not read the date "${payload.endDate}".`);
    if (errors.length) return { ok: false, errors };
    return {
        ok: true, errors: [],
        normalized: { payload: { ...payload, title: toTitleCase(payload.title.trim()), items: payload.items || [] } }
    };
}

registerEntity('draws', {
    'draw.add': {
        action: ['draws:addnew', 'draws:addreturning'],   // one op; payload.category is the difference
        tier: 1,
        validate: (op) => validateOne(op.payload),
        preview: (op, live) => ({
            before: { count: live[pathFor(op.payload.category)].length },
            after: { count: live[pathFor(op.payload.category)].length + 1, added: op.payload.title }
        }),
        apply: async (op, { session }) => {
            const path = pathFor(op.payload.category);
            const element = { ...op.payload };
            // 🔴 THE _id IS MINTED HERE, not discovered by reading the array tail. A tail read is
            // wrong twice: session.withTransaction() RETRIES its whole callback on a transient error,
            // and commitSet runs N ops in one transaction, so an earlier op's $push moves the tail a
            // later op reads. Every SeasonalData subdocument array has _id enabled.
            element._id = new mongoose.Types.ObjectId();
            const res = await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path, element, session });
            if (!res.ok) return res;
            await resortByDate(session, path);
            const created = element;
            return {
                ok: true,
                change: { action: 'add', model: 'SeasonalData', target: op.payload.title,
                          summary: `Added new draw "${op.payload.title}"` },
                applied: { category: op.payload.category, elementId: String(created._id), title: op.payload.title }
            };
        },
        invert: (change) => ({
            type: 'draw.delete',
            target: { category: change.applied.category, elementId: change.applied.elementId },
            payload: { title: change.applied.title }
        })
    },

    'draw.delete': {
        action: 'draws:delete', tier: 1,
        validate: (op) => op.target?.elementId
            ? { ok: true, errors: [], normalized: op }
            : { ok: false, errors: ['No draw was selected.'] },
        preview: (op, live) => {
            const path = pathFor(op.target.category);
            const gone = live[path].find(d => String(d._id) === op.target.elementId);
            return { before: { draw: gone }, after: { draw: null } };
        },
        apply: async (op, { session }) => {
            const path = pathFor(op.target.category);
            const before = await SeasonalData.findOne(DOC).select(path).lean().session(session);
            const gone = before[path].find(d => String(d._id) === op.target.elementId);
            if (!gone) return { ok: false, reason: 'missing' };
            const res = await removeElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path,
                                              elementId: op.target.elementId, session });
            if (!res.ok) return res;
            return {
                ok: true,
                change: { action: 'delete', model: 'SeasonalData', target: gone.title,
                          summary: `Deleted draw "${gone.title}"` },
                applied: { category: op.target.category, removed: gone }
            };
        },
        invert: (change) => ({
            type: 'draw.add',
            payload: { ...change.applied.removed, category: change.applied.category }
        })
    },

    'draw.edit': {
        action: 'draws:edit', tier: 1,
        validate: (op) => {
            if (!op.target?.elementId) return { ok: false, errors: ['No draw was selected.'] };
            return validateOne({ ...op.payload, category: op.target.category });
        },
        preview: (op, live) => {
            const path = pathFor(op.target.category);
            const cur = live[path].find(d => String(d._id) === op.target.elementId);
            return { before: cur, after: { ...cur, ...op.payload } };
        },
        apply: async (op, { session }) => {
            const path = pathFor(op.target.category);
            const before = await SeasonalData.findOne(DOC).select(path).lean().session(session);
            const cur = before[path].find(d => String(d._id) === op.target.elementId);
            if (!cur) return { ok: false, reason: 'missing' };
            // The prior-value assertion IS the conflict check — see core/mongo/positional.js.
            const expect = Object.fromEntries(Object.keys(op.payload).map(k => [k, cur[k]]));
            const res = await updateElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path,
                                              elementId: op.target.elementId, expect, set: op.payload, session });
            if (!res.ok) return res;
            if ('date' in op.payload) await resortByDate(session, path);
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: cur.title,
                          summary: `Edited draw "${cur.title}"` },
                applied: { category: op.target.category, elementId: op.target.elementId, prior: expect }
            };
        },
        invert: (change) => ({
            type: 'draw.edit',
            target: { category: change.applied.category, elementId: change.applied.elementId },
            payload: change.applied.prior
        })
    },

    'draw.bulkAdd': {
        action: 'draws:bulkadd', tier: 2,
        validate: (op) => {
            if (alreadyParsed(op)) return { ok: true, errors: [], normalized: op };  // an inverse — do not re-parse
            const parsed = parseBulkDrawList(op.payload.text || '');
            if (!parsed || (!parsed.newDraws?.length && !parsed.returningDraws?.length)) {
                return { ok: false, errors: ['Nothing in that text parsed as a draw. Check the Bulk Format Guide.'] };
            }
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed } } };
        },
        preview: (op, live) => ({
            before: { new: live.newDraws.length, returning: live.returningDraws.length },
            after: {
                new: live.newDraws.length + (op.payload.parsed.newDraws?.length || 0),
                returning: live.returningDraws.length + (op.payload.parsed.returningDraws?.length || 0)
            }
        }),
        apply: async (op, { session }) => {
            const { newDraws: rawNew = [], returningDraws: rawReturning = [] } = op.payload.parsed;
            // ⚠️ FOUND DURING TASK 6 INTEGRATION: the pre-core handler always ran every parsed draw
            // through resolveThumbnailsForDraws() (Cloudinary resolve/cache, dropping anything with
            // neither a provided URL nor a cache hit) before saving. A first draft of this op skipped
            // that entirely and would have saved draws with an undefined thumbnailUrl. See
            // utils/bulkMerge.js's header for the matching bulkReplace defect found the same pass.
            const newRes = await resolveThumbnailsForDraws(rawNew);
            const returningRes = await resolveThumbnailsForDraws(rawReturning);
            const added = { newDraws: [], returningDraws: [] };
            for (const [path, list] of [['newDraws', newRes.validDraws], ['returningDraws', returningRes.validDraws]]) {
                if (!list.length) continue;
                for (const d of list) {
                    await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path, element: d, session });
                }
                await resortByDate(session, path);
                added[path] = list;
            }
            const total = added.newDraws.length + added.returningDraws.length;
            const fresh = await SeasonalData.findOne(DOC).lean().session(session);
            const ids = { newDraws: fresh.newDraws.slice(-added.newDraws.length).map(d => String(d._id)),
                          returningDraws: fresh.returningDraws.slice(-added.returningDraws.length).map(d => String(d._id)) };
            const skipped = [...newRes.skipped, ...returningRes.skipped];
            const warnings = [...newRes.warnings, ...returningRes.warnings];
            return {
                ok: true,
                change: { action: 'bulkAdd', model: 'SeasonalData', target: `${total} draws`,
                          summary: `Added ${total} draws in bulk`,
                          detail: skipped.length ? `Skipped (no URL/no cache hit): ${skipped.join(', ')}` : undefined },
                applied: { ids, skipped, warnings }
            };
        },
        invert: (change) => ({
            type: 'draw.bulkDelete',
            target: { ids: change.applied.ids },
            payload: {}
        })
    },

    'draw.bulkReplace': {
        action: 'draws:bulkreplace', tier: 2,
        validate: (op) => {
            if (alreadyParsed(op)) return { ok: true, errors: [], normalized: op };  // an inverse — do not re-parse
            const parsed = parseBulkDrawList(op.payload.text || '');
            if (!parsed) return { ok: false, errors: ['Nothing in that text parsed as a draw.'] };
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed } } };
        },
        preview: (op, live) => ({
            before: { draws: live[pathFor(op.target.category)] },
            after: { draws: op.payload.parsed[pathFor(op.target.category)] || [] }
        }),
        apply: async (op, { session }) => {
            const path = pathFor(op.target.category);
            const before = await SeasonalData.findOne(DOC).select(path).lean().session(session);
            const replaced = before[path];                       // the full prior set — this IS the inverse
            // 🔴 NOT a wholesale $set of the parsed text. "Replace Multiple" has ALWAYS been an
            // upsert-by-fuzzy-title merge (handlers/manage/shared.js's original upsertByTitle,
            // relocated to utils/bulkMerge.js): update the matching item in place, insert anything
            // new, and NEVER touch an existing entry the pasted text didn't mention — Purge already
            // covers a full wipe. A wholesale overwrite here would silently delete every draw not in
            // the paste. Found during Task 6 integration, before any handler was wired to this op.
            const { validDraws } = await resolveThumbnailsForDraws(op.payload.parsed[path] || []);
            const { finalArray, updatedCount, insertedCount } = upsertByTitle(before[path], validDraws);
            finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
            await SeasonalData.updateOne(DOC, { $set: { [path]: finalArray } }, { session });
            return {
                ok: true,
                change: { action: 'bulkReplace', model: 'SeasonalData', target: `${path}`,
                          summary: `Replaced draws — updated ${updatedCount}, added ${insertedCount} (now ${finalArray.length} total)` },
                applied: { category: op.target.category, replaced, added: validDraws }
            };
        },
        invert: (change) => ({
            type: 'draw.bulkReplace',
            target: { category: change.applied.category },
            payload: { draws: change.applied.replaced, parsed: { [pathFor(change.applied.category)]: change.applied.replaced } }
        })
    },

    'draw.bulkDelete': {
        action: 'draws:bulkdelete', tier: 2,
        validate: (op) => (op.target?.ids || op.payload?.titles)
            ? { ok: true, errors: [], normalized: op }
            : { ok: false, errors: ['Nothing was selected to delete.'] },
        preview: (op, live) => ({ before: { count: live.newDraws.length + live.returningDraws.length },
                                  after: { removing: (op.target.ids?.newDraws?.length || 0) + (op.target.ids?.returningDraws?.length || 0) } }),
        apply: async (op, { session }) => {
            const removed = { newDraws: [], returningDraws: [] };
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            for (const path of ['newDraws', 'returningDraws']) {
                for (const id of op.target.ids?.[path] || []) {
                    const gone = before[path].find(d => String(d._id) === id);
                    if (gone) removed[path].push(gone);
                    await removeElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path, elementId: id, session });
                }
            }
            const total = removed.newDraws.length + removed.returningDraws.length;
            return {
                ok: true,
                change: { action: 'bulkDelete', model: 'SeasonalData', target: `${total} draws`,
                          summary: `Deleted ${total} draws in bulk` },
                applied: { removed }
            };
        },
        invert: (change) => ({
            type: 'draw.bulkAdd',
            payload: { parsed: change.applied.removed }
        })
    },

    'draw.purge': {
        action: ['draws:purgeall', 'draws:purgenew', 'draws:purgereturning'],   // one op; target.scope differs
        tier: 3,
        validate: (op) => ['all', 'new', 'returning'].includes(op.target?.scope)
            ? { ok: true, errors: [], normalized: op }
            : { ok: false, errors: ['Purge scope must be all, new or returning.'] },
        preview: (op, live) => ({
            before: { new: live.newDraws.length, returning: live.returningDraws.length },
            after: {
                new: op.target.scope === 'returning' ? live.newDraws.length : 0,
                returning: op.target.scope === 'new' ? live.returningDraws.length : 0
            }
        }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const $set = {};
            if (op.target.scope !== 'returning') $set.newDraws = [];
            if (op.target.scope !== 'new') $set.returningDraws = [];
            await SeasonalData.updateOne(DOC, { $set }, { session });
            return {
                ok: true,
                change: { action: 'purge', model: 'SeasonalData', target: `draws (${op.target.scope})`,
                          summary: `Purged draws — scope "${op.target.scope}"` },
                applied: { scope: op.target.scope, newDraws: before.newDraws, returningDraws: before.returningDraws }
            };
        },
        // 🔴 NOT `category: 'both'`. pathFor() maps anything not 'returning' to 'newDraws', so a
        // 'both' inverse would restore new draws and SILENTLY DROP every returning draw. Reverting a
        // scope:'all' purge is TWO ops — which is why invert() may return an array.
        invert: (change) => [
            { type: 'draw.bulkReplace', target: { category: 'new' },
              payload: { parsed: { newDraws: change.applied.newDraws } } },
            { type: 'draw.bulkReplace', target: { category: 'returning' },
              payload: { parsed: { returningDraws: change.applied.returningDraws } } }
        ]
    }
});
