// utils/drawIndexSync.js -- the draw index follows a /manage draw edit (2026-11-11 22:33 EST, Harkirat's "go" on: "why didn't the index auto update when i added the additional items in live?"). Before, only Quick Add, Check Names, news triage and core/ops/drawIndex.js wrote DrawCatalog, so a live edit left the index behind and the next Quick Add brought the old items back.
//
// core/ops/draws.js calls these inside the draw op's own transaction:
//   draw.edit  the matching entry (its title or another name) takes the draw's items and draw type; item kinds already set are kept (utils/drawCatalog.js mergeItems). Its prior values ride on the op's inverse, so Revert puts the index back exactly.
//   draw.add   fills only what the entry lacks (no items, no draw type), so an add can never overwrite the index; its inverse is a delete, which leaves that fill in place.
// The fp, topTier and tags follow the items, and the Cloudinary asset's tags are mirrored after the commit (utils/cloudinaryCache.js mirrorCatalogToCloudinary, which never throws). No database connection (the test harness), no write.
const SAME = (a, b) => JSON.stringify((a || []).map(i => [i.tier, i.name])) === JSON.stringify((b || []).map(i => [i.tier, i.name]));

// What an entry should change to: a $set, or null when it already matches. Pure.
function indexChanges(entry, entries, { items, priceType }, { fillOnly = false } = {}) {
    const C = require('./drawCatalog');
    const set = {};
    const real = (items || []).filter(i => i && i.tier !== 'comment' && String(i.name || '').trim());
    if (real.length && (!fillOnly || !(entry.items || []).length)) {
        const next = C.mergeItems(entry.items, real, entries);
        if (!SAME(next, entry.items)) {
            set.items = next;
            set.fp = require('./cloudinaryCache').drawFingerprint({ items: next });
            set.topTier = C.topTierOf(next);
        }
    }
    if (C.isKnownType(priceType) && priceType !== entry.priceType && (!fillOnly || !C.isKnownType(entry.priceType))) set.priceType = priceType;
    if (!Object.keys(set).length) return null;
    set.tags = C.catalogTags(entry.tags, { fp: set.fp ?? entry.fp, priceType: set.priceType ?? entry.priceType, topTier: set.topTier ?? entry.topTier });
    return set;
}

const connected = () => require('mongoose').connection.readyState === 1;
const FIELDS = { slug: 1, title: 1, aliases: 1, items: 1, priceType: 1, fp: 1, topTier: 1, tags: 1, publicId: 1, releaseYear: 1 };

// -> { id, prior, publicId, priorTags } when it wrote, else null.
async function syncIndex(titles, draw, session, opts = {}) {
    if (!connected()) return null;
    const DrawCatalog = require('../models/DrawCatalog');
    const { matchByName } = require('./drawCatalog');
    const entries = await DrawCatalog.find({}, FIELDS).session(session).lean();
    const hit = titles.filter(Boolean).map(t => matchByName(entries, t)).find(Boolean);
    if (!hit) return null;
    const set = indexChanges(hit.entry, entries, draw, opts);
    if (!set) return null;
    const e = hit.entry;
    const prior = Object.fromEntries(Object.keys(set).map(k => [k, e[k] === undefined ? null : e[k]]));
    await DrawCatalog.updateOne({ _id: e._id }, { $set: set }, { session });
    return { id: String(e._id), prior, publicId: e.publicId || '', priorTags: e.tags || [] };
}

// Puts back what syncIndex changed, and returns the same shape for its own inverse.
async function restoreIndex(restore, session) {
    if (!connected() || !restore?.id) return null;
    const DrawCatalog = require('../models/DrawCatalog');
    const cur = await DrawCatalog.findById(restore.id, FIELDS).session(session).lean();
    if (!cur) return null;
    const prior = Object.fromEntries(Object.keys(restore.prior || {}).map(k => [k, cur[k] === undefined ? null : cur[k]]));
    await DrawCatalog.updateOne({ _id: cur._id }, { $set: restore.prior }, { session });
    return { id: String(cur._id), prior, publicId: cur.publicId || '', priorTags: cur.tags || [] };
}

// After the commit: the in-memory index is dropped and the asset's tags follow. Never throws.
async function afterSync(written) {
    if (!written) return null;
    try {
        const C = require('./drawCatalog');
        C.invalidateCatalog();
        const doc = await require('../models/DrawCatalog').findById(written.id).lean();
        if (doc?.publicId) {
            const { catalogMirrorPlan, mirrorCatalogToCloudinary } = require('./cloudinaryCache');
            await mirrorCatalogToCloudinary(doc.publicId, catalogMirrorPlan(doc, { previousTags: written.priorTags || [], inserted: false, year: doc.releaseYear || new Date().getUTCFullYear() }));
        }
    } catch (err) { console.error(`Draw index sync, after the commit: ${err?.message || err}`); }
    return null;
}

module.exports = { indexChanges, syncIndex, restoreIndex, afterSync };
