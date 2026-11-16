// core/ops/drawIndex.js
//
// The draw index (models/DrawCatalog.js) edited from /manage draws' Draw Index panel (Harkirat, 2026-11-11 11:02 EST: "i want the draw index as it's own dedicated panel/panel/system") and, since 2026-11-16 12:16 EST, written by the owner's /bot drawindex (Upload Draws, Replace Picture, Edit Entry's title and items, Delete Entry; Harkirat 2026-11-16 11:11 EST: "an owner only command where i can upload and check the draws index. adding more draws, editing, etc.").
//
//   drawindex.edit    other names, release season, draw type (the admins' Edit Entry). Tier 1.
//   drawindex.add     a new entry from an uploaded poster. Its inverse deletes the entry; the Cloudinary picture stays (unreferenced and harmless, utils/cloudinaryCache.js cacheThumbnail's own rule for an orphaned asset), so a Revert of the Revert finds it again. Tier 1.
//   drawindex.update  picture, items, title, other names, draw type, season, comments; and it re-points the staged or live draws of this entry whose picture was a placeholder or the entry's old link (`rows`). NOT through draw.edit: draw.edit runs utils/drawIndexSync.js, whose mergeItems REPLACES the index's items with the draw row's list. Tier 1.
//   drawindex.delete  removes an entry; its inverse puts the same document back. Tier 2, because it takes a live draw's picture lookup with it.
//
// Page 'draws' (an op with no /manage action declares its page: .claude/rules/operation-core.md). Who may press the owner's buttons is checked at the route (utils/adminAccess.js isOwner). 🔒 add, update and delete are OWNER ONLY INSIDE apply() too (commit security review, 2026-11-16 12:27 EST): a Revert replays an op's inverse as whoever pressed Revert (/bot analytics' Changes, or the panel's own Revert), and checkRevert checks only the page's tier, so an admin with the draws tier could otherwise delete an owner-uploaded entry by reverting its add, or re-add a deleted one. apply() runs on every path, fresh or Revert, so the check sits there once.
const { registerEntity } = require('./index');
const DrawCatalog = require('../../models/DrawCatalog');

const FIELDS = ['aliases', 'releaseSeason', 'priceType'];
const pick = (src) => Object.fromEntries(FIELDS.filter(f => f in (src || {})).map(f => [f, src[f] === undefined ? null : src[f]]));
const refresh = async () => { require('../../utils/drawCatalog').invalidateCatalog(); return null; };
const DOC = { docType: 'global' };
const ROW_PATHS = ['newDraws', 'returningDraws', 'draft.newDraws', 'draft.returningDraws'];
const UPDATE_FIELDS = ['imageUrl', 'publicId', 'items', 'title', 'aliases', 'priceType', 'releaseSeason', 'releaseYear', 'comments'];

const isOwner = (id) => require('../../utils/adminAccess').isOwner(id);
const OWNER_ONLY = { ok: false, reason: 'only the bot owner can change the draw index this way' };
const cleanAliases = (list) => [...new Set((list || []).map(a => String(a).trim()).filter(Boolean))].slice(0, 20);
function seasonOk(n) { return n === null || (Number.isInteger(Number(n)) && Number(n) >= 1 && Number(n) <= 999); }
const TIERS = new Set(['mythic', 'legendary', 'epic']);
function itemsOk(items) {
    return Array.isArray(items) && items.length <= 30 && items.every(i => i && TIERS.has(i.tier) && String(i.name || '').trim());
}
// What follows the items: the fingerprint, the top tier and the bot-owned tags (utils/drawCatalog.js catalogTags).
function derived(doc) {
    const C = require('../../utils/drawCatalog');
    const fp = require('../../utils/cloudinaryCache').drawFingerprint({ items: doc.items });
    const topTier = C.topTierOf(doc.items || []);
    return { fp, topTier, tags: C.catalogTags(doc.tags, { fp, priceType: doc.priceType, topTier }) };
}
// After the commit: the in-memory index is dropped and the asset's tags and context follow (never throws; blocked on the dev bot for prod assets).
const afterWrite = (id, previousTags, inserted) => async () => {
    const C = require('../../utils/drawCatalog');
    C.invalidateCatalog();
    try {
        const doc = await DrawCatalog.findById(id).lean();
        if (doc?.publicId) {
            const { catalogMirrorPlan, mirrorCatalogToCloudinary } = require('../../utils/cloudinaryCache');
            await mirrorCatalogToCloudinary(doc.publicId, catalogMirrorPlan(doc, { previousTags, inserted, year: doc.releaseYear || new Date().getUTCFullYear() }));
        }
    } catch (err) { return `The picture's tags were not updated: ${err?.message || err}`; }
    return null;
};

// One staged or live draw row's picture, guarded on the link it had, so a row edited meanwhile is left alone.
async function setRowPicture(row, session) {
    const { updateElement } = require('../mongo/positional');
    const SeasonalData = require('../../models/SeasonalData');
    return updateElement({ Model: SeasonalData, docFilter: DOC, arrayPath: row.path, elementId: row.id, expect: { thumbnailUrl: row.from ?? null }, set: { thumbnailUrl: row.to }, session });
}

registerEntity('drawindex', {
    'drawindex.edit': {
        page: 'draws', tier: 1,
        validate: (op) => {
            if (!op.target?.id) return { ok: false, errors: ['No draw index entry was picked.'] };
            const payload = pick(op.payload);
            if (!Object.keys(payload).length) return { ok: false, errors: ['Nothing to change.'] };
            if ('aliases' in payload) payload.aliases = cleanAliases(payload.aliases);
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
    },

    'drawindex.add': {
        page: 'draws', tier: 1,
        // payload: { slug, title, publicId, imageUrl, items, comments, aliases, priceType, releaseSeason, releaseYear } or, on a Revert of a delete, { restore: <the whole document> }.
        validate: (op) => {
            const p = op.payload || {};
            if (p.restore) return p.restore._id && p.restore.slug ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['Nothing to restore.'] };
            const errors = [];
            if (!String(p.slug || '').trim() || !String(p.title || '').trim()) errors.push('A draw needs a title.');
            if (!p.publicId || !p.imageUrl) errors.push('A draw needs its picture.');
            if (!itemsOk(p.items)) errors.push('Every item needs a rarity and a name.');
            if ('releaseSeason' in p && !seasonOk(p.releaseSeason ?? null)) errors.push('A release season is a whole number, like 10.');
            return errors.length ? { ok: false, errors } : { ok: true, errors: [], normalized: { ...op, payload: { ...p, aliases: cleanAliases(p.aliases) } } };
        },
        preview: async (op) => ({ before: null, after: op.payload.restore || op.payload }),
        apply: async (op, { session, actorId }) => {
            if (!isOwner(actorId)) return OWNER_ONLY;
            const p = op.payload;
            const slug = p.restore ? p.restore.slug : p.slug;
            if (await DrawCatalog.findOne({ slug }).session(session).lean()) return { ok: false, reason: `the draw index already has an entry at "${slug}"` };
            let doc;
            if (p.restore) doc = p.restore;
            else {
                const base = {
                    slug, title: String(p.title), publicId: p.publicId, imageUrl: p.imageUrl, priceType: p.priceType || '',
                    items: p.items.map(i => ({ tier: i.tier, kind: i.kind || '', name: String(i.name).trim(), baseName: i.baseName || '', skinName: i.skinName || '' })),
                    comments: (p.comments || []).map(String), aliases: p.aliases || [], tags: [], groupSlug: slug,
                    source: 'owner-upload', indexedOn: new Date().toISOString().slice(0, 10),
                    ...(Number.isInteger(p.releaseSeason) ? { releaseSeason: p.releaseSeason, releaseYear: Number.isInteger(p.releaseYear) ? p.releaseYear : new Date().getUTCFullYear() } : {}),
                };
                doc = { ...base, ...derived(base) };
            }
            const [created] = await DrawCatalog.create([doc], { session });
            return {
                ok: true,
                afterCommit: afterWrite(String(created._id), [], !p.restore),
                change: { action: 'add', model: 'DrawCatalog', target: doc.title, summary: `Added "${doc.title}" to the draw index` },
                applied: { id: String(created._id) }
            };
        },
        invert: (c) => ({ type: 'drawindex.delete', target: { id: c.applied.id } })
    },

    'drawindex.update': {
        page: 'draws', tier: 1,
        // payload: { set: { <UPDATE_FIELDS> }, rows: [{ path, id, from, to }] }. `rows` re-point staged or live draws' pictures; they are worked out by the caller (handlers/manage/drawsPanel/drawIndexUpload.js rowsToRepoint) and replayed exactly by the inverse.
        validate: (op) => {
            if (!op.target?.id) return { ok: false, errors: ['No draw index entry was picked.'] };
            const set = Object.fromEntries(Object.entries(op.payload?.set || {}).filter(([k]) => UPDATE_FIELDS.includes(k)));
            const rows = (op.payload?.rows || []).filter(r => r && ROW_PATHS.includes(r.path) && r.id && typeof r.to === 'string');
            if (!Object.keys(set).length && !rows.length) return { ok: false, errors: ['Nothing to change.'] };
            if ('items' in set && !itemsOk(set.items)) return { ok: false, errors: ['Every item needs a rarity and a name.'] };
            if ('title' in set && !String(set.title || '').trim()) return { ok: false, errors: ['A draw needs a title.'] };
            if ('aliases' in set) set.aliases = cleanAliases(set.aliases);
            if ('releaseSeason' in set && !seasonOk(set.releaseSeason)) return { ok: false, errors: ['A release season is a whole number, like 10.'] };
            // `hold` (a forward picture replace: the old picture's held copy and where it lived) and `restore` (its Revert: copy `from` back onto `to`) ride through, or a rebuilt payload would drop them (.claude/rules/operation-core.md).
            const pair = (x, a, b) => (x && typeof x[a] === 'string' && typeof x[b] === 'string' ? { [a]: x[a], [b]: x[b] } : null);
            const hold = pair(op.payload?.hold, 'id', 'publicId');
            const restore = pair(op.payload?.restore, 'from', 'to');
            return { ok: true, errors: [], normalized: { ...op, payload: { set, rows, ...(hold ? { hold } : {}), ...(restore ? { restore } : {}) } } };
        },
        preview: async (op) => {
            const cur = await DrawCatalog.findById(op.target.id).lean();
            return { before: cur ? Object.fromEntries(Object.keys(op.payload.set).map(k => [k, cur[k]])) : null, after: op.payload.set };
        },
        apply: async (op, { session, actorId }) => {
            if (!isOwner(actorId)) return OWNER_ONLY;
            const cur = await DrawCatalog.findById(op.target.id).session(session).lean();
            if (!cur) return { ok: false, reason: 'missing' };
            const set = { ...op.payload.set };
            if ('items' in set || 'priceType' in set) Object.assign(set, derived({ ...cur, ...set }));
            const prior = Object.fromEntries(Object.keys(set).map(k => [k, cur[k] === undefined ? null : cur[k]]));
            if (Object.keys(set).length) await DrawCatalog.updateOne({ _id: cur._id }, { $set: set }, { session });
            const moved = [];
            for (const row of op.payload.rows || []) {
                const res = await setRowPicture(row, session);
                if (res.ok) moved.push({ path: row.path, id: row.id, from: row.to, to: row.from ?? '' });
            }
            // A Revert of a picture replace copies the held old picture back after the commit, holding the current one first so reverting the Revert works too (utils/drawPictureHold.js). The links in the index and the rows are the ones they had; Cloudinary serves an asset's current bytes under any version number.
            const H = require('../../utils/drawPictureHold');
            const restore = op.payload.restore || null;
            const nextHold = restore ? { id: H.holdIdFor(restore.to), publicId: restore.to } : (op.payload.hold || null);
            const write = afterWrite(String(cur._id), cur.tags || [], false);
            return {
                ok: true,
                afterCommit: restore ? async () => {
                    const r = await H.restorePicture({ from: restore.from, to: restore.to, holdCurrentAs: nextHold.id });
                    const note = await write();
                    return r.ok ? note : `The index is back, but the picture was not: ${r.error}.`;
                } : write,
                change: { action: 'edit', model: 'DrawCatalog', target: cur.title, summary: `Updated the draw index entry "${cur.title}"${moved.length ? ` and ${moved.length} draw picture${moved.length === 1 ? '' : 's'}` : ''}` },
                applied: { id: String(cur._id), prior: Object.fromEntries(Object.entries(prior).filter(([k]) => UPDATE_FIELDS.includes(k))), rows: moved, ...(nextHold ? { hold: nextHold } : {}) }
            };
        },
        invert: (c) => ({ type: 'drawindex.update', target: { id: c.applied.id }, payload: { set: c.applied.prior, rows: c.applied.rows || [], ...(c.applied.hold ? { restore: { from: c.applied.hold.id, to: c.applied.hold.publicId } } : {}) } })
    },

    'drawindex.delete': {
        page: 'draws', tier: 2,
        validate: (op) => (op.target?.id ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No draw index entry was picked.'] }),
        preview: async (op) => ({ before: await DrawCatalog.findById(op.target.id).lean(), after: null }),
        apply: async (op, { session, actorId }) => {
            if (!isOwner(actorId)) return OWNER_ONLY;
            const cur = await DrawCatalog.findById(op.target.id).session(session).lean();
            if (!cur) return { ok: false, reason: 'missing' };
            await DrawCatalog.deleteOne({ _id: cur._id }, { session });
            return {
                ok: true,
                afterCommit: refresh,
                change: { action: 'delete', model: 'DrawCatalog', target: cur.title, summary: `Deleted "${cur.title}" from the draw index` },
                applied: { removed: cur }
            };
        },
        invert: (c) => ({ type: 'drawindex.add', payload: { restore: c.applied.removed } })
    }
});

module.exports = { ROW_PATHS, UPDATE_FIELDS, derived };
