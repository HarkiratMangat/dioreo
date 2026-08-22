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
const { updateElement, appendElement, removeElement, resortByDate } = require('../mongo/positional');
const { toTitleCase, parseBulkDrawList, parseAdminDate } = require('../../utils/adminParser');
const { resolveThumbnailsForDraws, upsertByTitle } = require('../../utils/bulkMerge');
const { fuzzyMatch } = require('../../utils/search');
const SeasonalData = require('../../models/SeasonalData');

const DOC = { docType: 'global' };
const pathFor = (category) => (category === 'returning' ? 'returningDraws' : 'newDraws');

// ⚠️ FOUND DURING TASK 6 INTEGRATION (2026-08-20), not caught by plan 1's falsification pass: nothing on the READ side sorts newDraws/returningDraws by date -- commands/draws.js trusts the stored array order. The pre-core handler always re-sorted the whole array after every mutation that could change it (add/edit/bulk). An op that only appendElement()s or updateElement()s without re-sorting would silently degrade `/draws` display order the first time an edit changed a date or an add landed out of chronological order -- a real regression Task 6's own goal ("nothing changes for the user") exists to prevent. Every op below that can disturb order re-sorts in the same transaction before returning. (resortByDate itself moved to core/mongo/positional.js 2026-08-21 -- calendar.js had a byte-for-byte duplicate.)

// 🔴 AN ALREADY-PARSED PAYLOAD IS NOT RE-PARSED. commitSet runs validateSet before applying — including on an INVERSE produced by invert(), which carries structured `parsed` data and never the original `text`. A validator that unconditionally re-parses `payload.text || ''` would parse an empty string, overwrite payload.parsed, and silently restore NOTHING. That would have made undo a no-op for bulkDelete, purge and bulkReplace. drawOps.test.js round-trips every inverse through validate() for exactly this reason.
const alreadyParsed = (op) => op.payload?.parsed && !op.payload?.text;

function validateOne(payload) {
    const errors = [];
    if (!payload?.title?.trim()) errors.push('A draw needs a title.');
    if (!['new', 'returning'].includes(payload?.category)) errors.push('Category must be "new" or "returning".');
    if (payload?.date && !parseAdminDate(payload.date)) errors.push(`Could not read the date "${payload.date}".`);
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
            // 🔴 THE _id IS MINTED HERE, not discovered by reading the array tail. A tail read is wrong twice: session.withTransaction() RETRIES its whole callback on a transient error, and commitSet runs N ops in one transaction, so an earlier op's $push moves the tail a later op reads. Every SeasonalData subdocument array has _id enabled.
            element._id = new mongoose.Types.ObjectId();
            const res = await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path, element, session });
            if (!res.ok) return res;
            await resortByDate(SeasonalData, DOC, path, session);
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
            if ('date' in op.payload) await resortByDate(SeasonalData, DOC, path, session);
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

    // ⚠️ TARGET SHAPE FIXED DURING TASK 6 INTEGRATION (2026-08-20 23:48 EDT). An earlier draft had bulkAdd parse ONE text blob into `{newDraws, returningDraws}` and mutate both categories from a single op. That doesn't match parseBulkDrawList() (utils/adminParser.js), which returns a FLAT array — category comes from which of the two independently-optional textareas (new_text/returning_text) the admin filled in, not from the pasted text itself. bulkAdd/bulkReplace are therefore single-category, like draw.edit/draw.delete — the handler builds up to two ops (one per filled field) and commits them together in one changeset, preserving the original one-save atomicity.
    'draw.bulkAdd': {
        action: 'draws:bulkadd', tier: 2,
        validate: (op) => {
            if (alreadyParsed(op)) return { ok: true, errors: [], normalized: op };  // an inverse — do not re-parse
            if (!['new', 'returning'].includes(op.target?.category)) {
                return { ok: false, errors: ['Bulk add needs a category (new or returning).'] };
            }
            const parsed = parseBulkDrawList(op.payload.text || '');
            if (!parsed?.length) {
                return { ok: false, errors: ['Nothing in that text parsed as a draw. Check the Bulk Format Guide.'] };
            }
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed } } };
        },
        preview: (op, live) => ({
            before: { count: live[pathFor(op.target.category)].length },
            after: { count: live[pathFor(op.target.category)].length + op.payload.parsed.length }
        }),
        apply: async (op, { session }) => {
            const path = pathFor(op.target.category);
            // ⚠️ The pre-core handler always ran every parsed draw through resolveThumbnailsForDraws() (Cloudinary resolve/cache, dropping anything with neither a provided URL nor a cache hit) before saving. Found during Task 6 integration: a first draft of this op skipped that entirely and would have saved draws with an undefined thumbnailUrl.
            const { validDraws, skipped, warnings } = await resolveThumbnailsForDraws(op.payload.parsed);
            // 🔴 IDs captured via a BEFORE-snapshot diff, not a post-resort tail-slice. resortByDate re-sorts the WHOLE array by date -- a newly-added draw whose date sorts earlier than an existing one lands mid-array, not at the tail, so slice(-N) after the sort would silently pick up unrelated pre-existing draws' ids instead. Those ids feed straight into this op's own invert() (bulkDelete) -- a wrong id here means reverting a bulk-add deletes the WRONG draws. Found by the plan-1-range code review.
            const before = await SeasonalData.findOne(DOC).select(path).session(session).lean();
            const beforeIds = new Set(before[path].map(d => String(d._id)));
            for (const d of validDraws) {
                await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path, element: d, session });
            }
            // resortByDate's own return value stands in for the extra fetch a separate "give me the fresh array" query would otherwise need.
            const sorted = validDraws.length ? await resortByDate(SeasonalData, DOC, path, session) : before[path];
            const ids = sorted.filter(d => !beforeIds.has(String(d._id))).map(d => String(d._id));
            return {
                ok: true,
                change: { action: 'bulkAdd', model: 'SeasonalData', target: `${validDraws.length} draws`,
                          summary: `Added ${validDraws.length} draws in bulk`,
                          detail: skipped.length ? `Skipped (no URL/no cache hit): ${skipped.join(', ')}` : undefined },
                applied: { category: op.target.category, ids, added: validDraws, skipped, warnings, total: sorted.length }
            };
        },
        invert: (change) => ({
            type: 'draw.bulkDelete',
            payload: { ids: { [pathFor(change.applied.category)]: change.applied.ids } }
        })
    },

    'draw.bulkReplace': {
        action: 'draws:bulkreplace', tier: 2,
        validate: (op) => {
            if (alreadyParsed(op)) return { ok: true, errors: [], normalized: op };  // an inverse — do not re-parse
            if (!['new', 'returning'].includes(op.target?.category)) {
                return { ok: false, errors: ['Replace Multiple needs a category — without one it would wipe the wrong list.'] };
            }
            const parsed = parseBulkDrawList(op.payload.text || '');
            if (!parsed) return { ok: false, errors: ['Nothing in that text parsed as a draw.'] };
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed } } };
        },
        preview: (op, live) => ({
            before: { draws: live[pathFor(op.target.category)] },
            after: { draws: op.payload.parsed }
        }),
        apply: async (op, { session }) => {
            const path = pathFor(op.target.category);
            const before = await SeasonalData.findOne(DOC).select(path).lean().session(session);
            const replaced = before[path];                       // the full prior set — this IS the inverse
            // 🔴 NOT a wholesale $set of the parsed text. "Replace Multiple" has ALWAYS been an upsert-by-fuzzy-title merge (handlers/manage/shared.js's original upsertByTitle, relocated to utils/bulkMerge.js): update the matching item in place, insert anything new, and NEVER touch an existing entry the pasted text didn't mention — Purge already covers a full wipe. A wholesale overwrite here would silently delete every draw not in the paste. Found during Task 6 integration, before any handler was wired to this op.
            const { validDraws } = await resolveThumbnailsForDraws(op.payload.parsed);
            const { finalArray, updatedCount, insertedCount } = upsertByTitle(before[path], validDraws);
            finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
            await SeasonalData.updateOne(DOC, { $set: { [path]: finalArray } }, { session });
            return {
                ok: true,
                change: { action: 'bulkReplace', model: 'SeasonalData', target: `${path}`,
                          summary: `Replaced draws — updated ${updatedCount}, added ${insertedCount} (now ${finalArray.length} total)` },
                applied: { category: op.target.category, replaced, added: validDraws, updatedCount, insertedCount, total: finalArray.length }
            };
        },
        invert: (change) => ({
            type: 'draw.bulkReplace',
            target: { category: change.applied.category },
            payload: { parsed: change.applied.replaced }
        })
    },

    // ⚠️ RESHAPED DURING TASK 6 INTEGRATION. The real "Bulk Delete Draws" UI (handlers/manage/draws.js's pre-core bulkDeleteDraws) takes PASTED TITLES, fuzzy-matched (utils/search.js's fuzzyMatch) — never element ids, which the admin never sees or types. A first draft of this op only accepted an ids-shaped target, which no real caller could ever construct from the modal it serves.
    'draw.bulkDelete': {
        action: 'draws:bulkdelete', tier: 2,
        validate: (op) => {
            const ids = op.payload?.ids || {};
            const titles = op.payload?.titles || {};
            const has = (m) => (m.newDraws?.length || 0) + (m.returningDraws?.length || 0) > 0;
            return (has(ids) || has(titles))
                ? { ok: true, errors: [], normalized: op }
                : { ok: false, errors: ['Nothing was selected to delete.'] };
        },
        preview: (op, live) => {
            const willRemove = (path) => {
                if (op.payload.ids?.[path]?.length) return op.payload.ids[path].length;
                const titles = op.payload.titles?.[path] || [];
                let remaining = live[path];
                let count = 0;
                for (const title of titles) {
                    const match = remaining.find(item => fuzzyMatch(title, item.title));
                    if (match) { count++; remaining = remaining.filter(i => i !== match); }
                }
                return count;
            };
            return { before: { count: live.newDraws.length + live.returningDraws.length },
                     after: { removing: willRemove('newDraws') + willRemove('returningDraws') } };
        },
        apply: async (op, { session }) => {
            const removed = { newDraws: [], returningDraws: [] };
            const notFound = { newDraws: [], returningDraws: [] };
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            for (const path of ['newDraws', 'returningDraws']) {
                // An id-based removal (from this op's own invert()) skips the fuzzy-title path entirely — replaying a title match against a document that may have changed since the forward op ran could match the WRONG element, or nothing at all. An id, once known, is exact.
                if (op.payload.ids?.[path]?.length) {
                    for (const id of op.payload.ids[path]) {
                        const gone = before[path].find(d => String(d._id) === id);
                        if (gone) removed[path].push(gone);
                    }
                } else {
                    let remaining = [...before[path]];
                    for (const title of op.payload.titles?.[path] || []) {
                        const match = remaining.find(item => fuzzyMatch(title, item.title));
                        if (match) { removed[path].push(match); remaining = remaining.filter(i => i !== match); }
                        else notFound[path].push(title);
                    }
                }
                for (const gone of removed[path]) {
                    await removeElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path, elementId: String(gone._id), session });
                }
            }
            const total = removed.newDraws.length + removed.returningDraws.length;
            if (!total) return { ok: false, reason: 'missing' };
            return {
                ok: true,
                change: { action: 'bulkDelete', model: 'SeasonalData', target: `${total} draws`,
                          summary: `Deleted ${total} draws in bulk`,
                          detail: (notFound.newDraws.length || notFound.returningDraws.length)
                              ? `Not found: ${[...notFound.newDraws, ...notFound.returningDraws].join(', ')}` : undefined },
                applied: { removed, notFound }
            };
        },
        // Restores by re-appending the exact removed subdocuments (title/date/thumbnailUrl/items/_id discarded and re-minted, matching draw.delete's own invert — an add, not a positional restore-by-id, since the element's slot in the array is gone).
        invert: (change) => [
            ...(change.applied.removed.newDraws.length
                ? [{ type: 'draw.bulkAdd', target: { category: 'new' }, payload: { parsed: change.applied.removed.newDraws } }] : []),
            ...(change.applied.removed.returningDraws.length
                ? [{ type: 'draw.bulkAdd', target: { category: 'returning' }, payload: { parsed: change.applied.removed.returningDraws } }] : [])
        ]
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
        // 🔴 NOT `category: 'both'`. pathFor() maps anything not 'returning' to 'newDraws', so a 'both' inverse would restore new draws and SILENTLY DROP every returning draw. Reverting a scope:'all' purge is TWO ops — which is why invert() may return an array.
        invert: (change) => [
            { type: 'draw.bulkReplace', target: { category: 'new' },
              payload: { parsed: change.applied.newDraws } },
            { type: 'draw.bulkReplace', target: { category: 'returning' },
              payload: { parsed: change.applied.returningDraws } }
        ]
    }
});
