// models/DrawCatalog.js -- the draw index: one document per draw image in Cloudinary `draws/`, with what the image shows (its items, their kinds and skin names), its /draw prices type, its other names and notes. The collection `drawcatalogs` was seeded by hand on 2026-11-01 (93 documents, checksum-verified; the full account is docs/reference/draw-index.md) and had no model until this one. Harkirat, on what it is for: "a proper full index-able list to quickly implement into the bot whenever needed".
//
// WHO WRITES IT:
//   - the bot, when it uploads or re-links a draw image (utils/drawCatalog.js recordCatalogImage). It sets the image and the fingerprint fields only, and merges items so a hand-written `kind`/`baseName`/`skinName` is kept;
//   - scripts/syncDrawCatalog.js, which compares it with Cloudinary and fills in what is missing.
// Neither one ever writes `comments`, `aliases` or `groupSlug` on a document that exists: those are hand-curated.
//
// WHO READS IT: utils/cloudinaryCache.js resolveThumbnail (through utils/drawCatalog.js), to find a draw's image by its title, another name, or its items, and to fill in a draw's type when the admin left it blank.
const mongoose = require('mongoose');

const DrawCatalogItemSchema = new mongoose.Schema({
    tier: { type: String, required: true },            // mythic | legendary | epic
    // weapon | character | vehicle, by the rules in docs/reference/draw-index.md; '' when the bot added the item and nobody has said yet. 'other' (2026-11-01): an item that is none of the three (an emote, a charm), picked in the Set item kinds box (handlers/manage/itemKinds.js), which asks about every ''.
    kind: { type: String, enum: ['weapon', 'character', 'vehicle', 'other', ''], default: '' },
    name: { type: String, required: true },            // as printed: "HVK-30 - Dantang's Diancui"
    baseName: { type: String, default: '' },           // "HVK-30"
    skinName: { type: String, default: '' }            // "Dantang's Diancui"
}, { _id: false });

const DrawCatalogSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },   // utils/cloudinaryCache.js slugify(title); the image is draws/<slug>
    title: { type: String, required: true },
    publicId: { type: String, required: true },
    imageUrl: { type: String, required: true },             // the f_auto,q_auto delivery URL
    priceType: { type: String, default: '' },               // a utils/drawTypes.js key; '' when not known
    topTier: { type: String, default: '' },
    items: { type: [DrawCatalogItemSchema], default: [] },
    fp: { type: String, default: null },                    // utils/cloudinaryCache.js drawFingerprint(items); the Cloudinary tag is fp_<fp>
    comments: { type: [String], default: [] },
    aliases: { type: [String], default: [] },               // other titles the same draw ran under ("Midnight Crescendo Draw")
    tags: { type: [String], default: [] },                  // a copy of the asset's Cloudinary tags
    // Draws that are the same draw shown on two images share one: the two Street Fighter Champion's documents. Equals `slug` otherwise.
    groupSlug: { type: String, default: '' },
    // Seeded only for the new draws whose season Harkirat named. Since 2026-11-01 the bot also sets it, ONCE, when it creates a document for a draw saved into New (utils/drawCatalog.js insertFields): the current season, or the draft's season for a staged draw. Never guessed for a returning draw, never rewritten.
    releaseSeason: { type: Number },
    source: { type: String, default: '' },
    indexedOn: { type: String, default: '' }                // YYYY-MM-DD
}, { collection: 'drawcatalogs' });

// No indexes existed before this model (draw-index.md). slug is unique (checked on prod 2026-11-01: 93 documents, 93 slugs); fp is NOT, because the Street Fighter pair carry the same items.
DrawCatalogSchema.index({ fp: 1 });
DrawCatalogSchema.index({ groupSlug: 1 });

module.exports = mongoose.model('DrawCatalog', DrawCatalogSchema);
