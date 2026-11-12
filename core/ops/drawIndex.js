// core/ops/drawIndex.js
//
// The draw index (models/DrawCatalog.js) edited from /manage draws' Draw Index panel (Harkirat, 2026-11-11 11:02 EST: "i want the draw index as it's own dedicated panel/panel/system"). One op: change an entry's other names, its release season and its draw type. Its inverse is the same op carrying the values it replaced, so a Revert in the panel or in /bot analytics puts them back.
//
// Page 'draws' (an op with no /manage action declares its page: .claude/rules/operation-core.md), tier 1, the tier of a draw edit.
const { registerEntity } = require('./index');
const DrawCatalog = require('../../models/DrawCatalog');

const FIELDS = ['aliases', 'releaseSeason', 'priceType'];
const pick = (src) => Object.fromEntries(FIELDS.filter(f => f in (src || {})).map(f => [f, src[f] === undefined ? null : src[f]]));
const refresh = async () => { require('../../utils/drawCatalog').invalidateCatalog(); return null; };

registerEntity('drawindex', {
    'drawindex.edit': {
        page: 'draws', tier: 1,
        validate: (op) => {
            if (!op.target?.id) return { ok: false, errors: ['No draw index entry was picked.'] };
            const payload = pick(op.payload);
            if (!Object.keys(payload).length) return { ok: false, errors: ['Nothing to change.'] };
            if ('aliases' in payload) payload.aliases = [...new Set((payload.aliases || []).map(a => String(a).trim()).filter(Boolean))].slice(0, 20);
            if ('releaseSeason' in payload && payload.releaseSeason !== null) {
                const n = Number(payload.releaseSeason);
                if (!Number.isInteger(n) || n < 1 || n > 999) return { ok: false, errors: ['A release season is a whole number, like 10.'] };
                payload.releaseSeason = n;
            }
            return { ok: true, errors: [], normalized: { ...op, payload } };
        },
        preview: async (op) => {
            const cur = await DrawCatalog.findById(op.target.id).lean();
            return { before: pick(cur), after: op.payload };
        },
        apply: async (op, { session }) => {
            const cur = await DrawCatalog.findById(op.target.id).session(session).lean();
            if (!cur) return { ok: false, reason: 'missing' };
            const prior = Object.fromEntries(Object.keys(op.payload).map(k => [k, cur[k] === undefined ? null : cur[k]]));
            await DrawCatalog.updateOne({ _id: cur._id }, { $set: op.payload }, { session });
            return {
                ok: true,
                afterCommit: refresh,
                change: { action: 'edit', model: 'DrawCatalog', target: cur.title, summary: `Edited the draw index entry "${cur.title}"` },
                applied: { id: String(cur._id), prior }
            };
        },
        invert: (c) => ({ type: 'drawindex.edit', target: { id: c.applied.id }, payload: c.applied.prior })
    }
});
