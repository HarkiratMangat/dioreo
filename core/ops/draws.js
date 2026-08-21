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
const SeasonalData = require('../../models/SeasonalData');

const DOC = { docType: 'global' };
const pathFor = (category) => (category === 'returning' ? 'returningDraws' : 'newDraws');

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
            const { newDraws = [], returningDraws = [] } = op.payload.parsed;
            const added = { newDraws: [], returningDraws: [] };
            for (const [path, list] of [['newDraws', newDraws], ['returningDraws', returningDraws]]) {
                for (const d of list) {
                    await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path, element: d, session });
                }
                added[path] = list;
            }
            const total = newDraws.length + returningDraws.length;
            const fresh = await SeasonalData.findOne(DOC).lean().session(session);
            const ids = { newDraws: fresh.newDraws.slice(-newDraws.length).map(d => String(d._id)),
                          returningDraws: fresh.returningDraws.slice(-returningDraws.length).map(d => String(d._id)) };
            return {
                ok: true,
                change: { action: 'bulkAdd', model: 'SeasonalData', target: `${total} draws`,
                          summary: `Added ${total} draws in bulk` },
                applied: { ids }
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
            const incoming = op.payload.parsed[path] || [];
            await SeasonalData.updateOne(DOC, { $set: { [path]: incoming } }, { session });
            return {
                ok: true,
                change: { action: 'bulkReplace', model: 'SeasonalData', target: `${path}`,
                          summary: `Replaced ${replaced.length} draws with ${incoming.length}` },
                applied: { category: op.target.category, replaced, added: incoming }
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
