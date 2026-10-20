// core/ops/catalogue.js
//
// The CODM catalogue (models/CatalogueItem.js) as ops, so a name added through /manage's Save anyway is logged in /bot analytics and can be reverted like any edit. Two op types, inverses of each other. Neither has a /manage page action: they ride along in the same changeset as the loadout save that met the unknown name, which is also what makes "save the build" and "learn its names" one atomic step.
//
// `page` is the PAIR of loadout pages: core/changeset.js's pageForOp() picks the one matching the op's mode, so a DMZ admin's Save anyway is logged (and revertable) under the DMZ page.
const { registerEntity } = require('./index');
const CatalogueItem = require('../../models/CatalogueItem');
const { normKey, invalidateCatalogue } = require('../../utils/catalogue');

const PAGE = ['loadouts_mp', 'loadouts_dmz'];
const KINDS = ['weapon', 'attachment'];

function cleanItems(items) {
    return (Array.isArray(items) ? items : [])
        .filter(it => KINDS.includes(it?.kind) && String(it?.name || '').trim())
        .map(it => ({ ...it, name: String(it.name).trim(), key: normKey(it.name), source: it.source || 'confirmed' }));
}

const refresh = async () => { invalidateCatalogue(); return null; };

registerEntity('catalogue', {
    'catalogue.learn': {
        page: PAGE, tier: 1,
        validate: (op) => {
            const items = cleanItems(op.payload?.items);
            return items.length ? { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, items } } }
                : { ok: false, errors: ['Nothing to add to the catalogue.'] };
        },
        preview: async (op) => ({ before: {}, after: { adding: op.payload.items.map(i => i.name) } }),
        apply: async (op, { session }) => {
            const ids = [];
            const added = [];
            // One at a time: a session must never carry two operations at once.
            for (const it of op.payload.items) {
                if (await CatalogueItem.exists({ kind: it.kind, key: it.key }).session(session)) continue;
                const [doc] = await CatalogueItem.create([it], { session });
                ids.push(String(doc._id));
                added.push(it.name);
            }
            return {
                ok: true,
                afterCommit: refresh,
                change: { action: 'add', model: 'CatalogueItem', target: added.join(', ') || 'no new names',
                          summary: `Added ${added.length} name(s) to the weapons catalogue` },
                applied: { ids, mode: op.payload.mode || null }
            };
        },
        invert: (c) => ({ type: 'catalogue.forget', payload: { ids: c.applied.ids, mode: c.applied.mode } })
    },

    'catalogue.forget': {
        page: PAGE, tier: 1,
        validate: (op) => Array.isArray(op.payload?.ids) ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No catalogue names were selected.'] },
        preview: async (op) => ({ before: { removing: op.payload.ids.length }, after: {} }),
        apply: async (op, { session }) => {
            const removed = await CatalogueItem.find({ _id: { $in: op.payload.ids } }).session(session).lean();
            if (removed.length) await CatalogueItem.deleteMany({ _id: { $in: removed.map(r => r._id) } }, { session });
            return {
                ok: true,
                afterCommit: refresh,
                change: { action: 'delete', model: 'CatalogueItem', target: removed.map(r => r.name).join(', ') || 'nothing',
                          summary: `Removed ${removed.length} name(s) from the weapons catalogue` },
                applied: { removed: removed.map(({ _id, __v, createdAt, updatedAt, ...r }) => r), mode: op.payload.mode || null }
            };
        },
        invert: (c) => ({ type: 'catalogue.learn', payload: { items: c.applied.removed, mode: c.applied.mode } })
    }
});
