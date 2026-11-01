// utils/drawCatalog.js -- the bot's reader and writer for the draw index (models/DrawCatalog.js, prod collection `drawcatalogs`). Added 2026-11-01 so the 93 indexed draws are actually used: before this, nothing read the collection.
//
// READ: the whole catalog is small (93 documents, about 100 KB), so it is loaded once and kept in memory for CACHE_MS, and every match below is a pass over that list. One Mongo read replaces what used to be one to three Cloudinary Admin API calls per lookup (measured 138-470 ms each, utils/cloudinaryCache.js). The matchers are pure over a list, so scripts/drawCatalog.test.js needs no database.
//
// WRITE: recordCatalogImage keeps the catalog in step when the bot itself uploads or re-links a draw image. It only ever sets the image and what the fingerprint depends on (items, fp, top tier, price type, tags); comments, aliases and groupSlug are hand-curated and are written only when a document is first created. Items are MERGED, so a `kind`, `baseName` or `skinName` written by hand survives the admin retyping the draw.
//
// NEVER THROWS, and is never a reason a save fails: with no database connection (a script, a test) or a failed read the catalog is simply empty and utils/cloudinaryCache.js falls back to Cloudinary exactly as it did before.
const mongoose = require('mongoose');
const DrawCatalog = require('../models/DrawCatalog');
const { slugify, slugOf, itemKeys, drawFingerprint, drawSimilarity, priceTypesAgree, titleSimilarity, DRAW_TAG, FP_TAG_PREFIX, FOLDER, FUZZY_SIMILARITY_THRESHOLD, SUGGEST_SIMILARITY } = require('./cloudinaryCache');

const CACHE_MS = 10 * 60 * 1000;
const RANK = { mythic: 3, legendary: 2, epic: 1 };
const normaliseName = name => String(name || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

// ==========================================
// THE IN-MEMORY COPY
// ==========================================
let cached = null;      // { at, entries }
let loading = null;     // one read in flight, shared by every caller that arrives during it

async function loadCatalog({ force = false } = {}) {
    if (mongoose.connection.readyState !== 1) return cached?.entries || [];
    if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.entries;
    if (loading) return loading;
    loading = DrawCatalog.find({}).lean()
        .then(entries => { cached = { at: Date.now(), entries }; return entries; })
        .catch(err => { console.error(`Draw catalog read failed: ${err?.message || err}`); return cached?.entries || []; })
        .finally(() => { loading = null; });
    return loading;
}
function invalidateCatalog() { cached = null; }

// ==========================================
// MATCHING (pure over a list of catalog documents)
// ==========================================
// Its own title, then another name it ran under. Both are certain; the price type is not checked, the same as the title match in utils/cloudinaryCache.js.
function matchByName(entries, title) {
    const slug = slugify(title);
    if (!slug) return null;
    const own = entries.find(e => e.slug === slug);
    if (own) return { entry: own, matchedBy: 'title' };
    const other = entries.find(e => (e.aliases || []).some(a => slugify(a) === slug));
    return other ? { entry: other, matchedBy: 'alias' } : null;
}

// The same items at the same rarities. When two documents share them (the Street Fighter pair), the group's own document wins.
function matchByItems(entries, draw) {
    const fp = drawFingerprint(draw);
    if (!fp) return null;
    const hits = entries.filter(e => e.fp === fp && priceTypesAgree(e.priceType, draw.priceType));
    if (!hits.length) return null;
    hits.sort((a, b) => Number(b.slug === b.groupSlug) - Number(a.slug === a.groupSlug));
    return { entry: hits[0], matchedBy: 'items' };
}

// The 0.75 character-similarity rule utils/cloudinaryCache.js uses on Cloudinary slugs, run over every title and other name in the catalog.
function matchBySimilarTitle(entries, title) {
    const slug = slugify(title);
    if (!slug) return null;
    let best = null;
    for (const e of entries) {
        for (const name of [e.slug, ...(e.aliases || []).map(slugify)]) {
            const score = titleSimilarity(slug, name);
            if (score >= FUZZY_SIMILARITY_THRESHOLD && (!best || score > best.score)) best = { entry: e, matchedBy: 'similar-title', score };
        }
    }
    return best;
}

// The certain matches only, in the order resolveThumbnail trusts them: what a draw IS, for filling in its type.
function matchCatalog(entries, title, draw = null) {
    return matchByName(entries, title) || (draw ? matchByItems(entries, draw) : null);
}

// For the "closest by items" error: same contract as utils/cloudinaryCache.js pickClosest, over the catalog.
function closestByItems(entries, draw) {
    const mine = itemKeys(draw?.items);
    if (!mine.length) return null;
    let best = null;
    for (const e of entries) {
        if (!priceTypesAgree(e.priceType, draw.priceType)) continue;
        const sim = drawSimilarity(mine, itemKeys(e.items));
        if (sim.score >= SUGGEST_SIMILARITY && (!best || sim.score > best.score)) best = { ...sim, title: e.title, publicId: e.publicId };
    }
    return best;
}

// ==========================================
// BUILDING A DOCUMENT
// ==========================================
// "HVK-30 - Dantang's Diancui" -> HVK-30 / Dantang's Diancui. A name with no " - " is all base name.
function splitItemName(name) {
    const s = String(name || '').trim();
    const at = s.indexOf(' - ');
    return at === -1 ? { baseName: s, skinName: '' } : { baseName: s.slice(0, at).trim(), skinName: s.slice(at + 3).trim() };
}

// An admin's item lines ({ tier, name }, utils/adminParser.js parseItemLine) as catalog items. An item already in the document keeps its hand-written kind, base name and skin name; a new one is split on " - " and takes its kind from any other document that has the same item.
function mergeItems(existingItems, newItems, otherEntries = []) {
    const known = new Map();
    for (const e of otherEntries) for (const i of e.items || []) if (i.kind) known.set(normaliseName(i.name), { kind: i.kind });
    for (const i of existingItems || []) known.set(normaliseName(i.name), i);
    const out = [];
    for (const item of newItems || []) {
        if (!item || item.tier === 'comment' || !String(item.name || '').trim()) continue;
        const had = known.get(normaliseName(item.name));
        const split = splitItemName(item.name);
        out.push({
            tier: item.tier,
            kind: had?.kind || '',
            name: String(item.name).trim(),
            baseName: had?.baseName || split.baseName,
            skinName: had?.baseName ? (had.skinName || '') : split.skinName
        });
    }
    return out;
}

function topTierOf(items) {
    return (items || []).reduce((top, i) => (RANK[i.tier] || 0) > (RANK[top] || 0) ? i.tier : top, '');
}

// The asset's tags as the catalog mirrors them: the bot-owned ones recomputed, anything else (season_<n>_2026) kept.
function catalogTags(existingTags, { fp, priceType, topTier }) {
    const kept = (existingTags || []).filter(t => t !== DRAW_TAG && !t.startsWith(FP_TAG_PREFIX) && !t.startsWith('ptype_') && !t.startsWith('top_'));
    return [DRAW_TAG, ...(fp ? [`${FP_TAG_PREFIX}${fp}`] : []), ...(priceType ? [`ptype_${priceType}`] : []), ...(topTier ? [`top_${topTier}`] : []), ...kept];
}

const isKnownType = t => Boolean(t) && t !== 'unknown';

// ==========================================
// WRITING
// ==========================================
// After the bot uploads an image (`url` given) or re-tags one it reused by title (no `url`). `draw` is { items, priceType }. Returns true when it wrote. Only images in draws/ are catalogued; a re-link of an image the catalog has never seen is left for scripts/syncDrawCatalog.js, since there is no URL to store.
async function recordCatalogImage({ title, publicId, url = null, draw = null, now = new Date() }) {
    if (mongoose.connection.readyState !== 1) return false;
    if (!String(publicId || '').startsWith(`${FOLDER}/`)) return false;
    const slug = slugOf(publicId);
    try {
        const existing = await DrawCatalog.findOne({ slug }).lean();
        if (!existing && !url) return false;
        const set = { publicId };
        if (url) set.imageUrl = url;
        const fp = drawFingerprint(draw);
        if (fp) {
            set.fp = fp;
            set.items = mergeItems(existing?.items, draw.items, cached?.entries || []);
            set.topTier = topTierOf(set.items);
        }
        if (isKnownType(draw?.priceType)) set.priceType = draw.priceType;
        set.tags = catalogTags(existing?.tags, { fp: set.fp ?? existing?.fp, priceType: set.priceType ?? existing?.priceType, topTier: set.topTier ?? existing?.topTier });
        const update = { $set: set };
        if (!existing) {
            update.$setOnInsert = {
                title: String(title),
                groupSlug: slug,
                comments: (draw?.items || []).filter(i => i?.tier === 'comment' && i.name).map(i => String(i.name)),
                aliases: [],
                source: 'bot',
                indexedOn: now.toISOString().slice(0, 10)
            };
        }
        await DrawCatalog.updateOne({ slug }, update, { upsert: true });
        invalidateCatalog();
        return true;
    } catch (err) {
        console.error(`Draw catalog write failed for "${title}": ${err?.message || err}`);
        return false;
    }
}

module.exports = {
    loadCatalog, invalidateCatalog, matchByName, matchByItems, matchBySimilarTitle, matchCatalog, closestByItems,
    splitItemName, mergeItems, topTierOf, catalogTags, isKnownType, recordCatalogImage, CACHE_MS
};
