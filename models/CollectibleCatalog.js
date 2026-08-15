// models/CollectibleCatalog.js -- runtime Mongo mirror of docs/reference/nameplate-decoration-catalog.json,
// ONE DOCUMENT PER SKU (flattened out of the JSON's collection -> group -> variants[] nesting), so a
// bulk-cache run or a future lookup never re-parses the 480KB file. The JSON file stays the git-diffable
// source of truth (that's the entire reason Harkirat wanted it tracked); this collection is a derived
// index built FROM it by scripts/syncCatalogToMongo.js, same "JSON in, Mongo out" direction
// scripts/syncNameplateCatalog.py already uses for "Discord in, JSON out".
//
// cacheStatus/cachedAt/lastError/lastAttemptAt are NOT part of the catalog data -- they're this bot's
// own bulk-cache progress tracking, so scripts/bulkCacheCollectibles.js can resume a partial run (925
// SKUs, batched with a delay between batches to stay under Discord's channel-message rate limit) without
// re-attempting SKUs that already rendered successfully. See docs/reference/nameplate-decoration-
// catalog.md for the field-by-field provenance of everything else here.
const mongoose = require('mongoose');

const CollectibleCatalogSchema = new mongoose.Schema({
    skuId: { type: String, required: true, unique: true },
    // 'nameplate' | 'decoration' -- decides which of utils/nameplateWebpCache.js /
    // utils/decorationWebpCache.js's resolve*Webp() the bulk-cache script calls for this doc.
    kind: { type: String, enum: ['nameplate', 'decoration'], required: true },
    // The top-level catalog collection name, e.g. "Underworld" -- Harkirat's own display term for this
    // is "Parent Category", which is why the field is named that rather than `collection`: Mongoose
    // reserves `collection` as a schema pathname (it shadows `Model.collection`, the actual MongoDB
    // collection handle) and warns loudly that using it "may break some functionality" -- caught by
    // that warning on this model's very first real query, not by inspection.
    parentCategory: { type: String, required: true },
    groupName: { type: String, required: true },
    baseSkuId: { type: String, required: true },
    // Nameplate: "nameplates/<slug>/<sku>/" (3 segments -- see nameplateWebpCache.js's publicIdFor).
    // Decoration: a bare asset hash, e.g. "a_68fda5e61b1957d69913b52bda6fab31" -- no path to shorten.
    asset: { type: String, required: true },
    label: { type: String }, // Discord's own descriptive caption
    // "<groupName> (<variantLabel>)" for a multi-variant design, or the plain design name for a
    // single-variant one -- see the catalog doc's "Display-name rule". Feeds resolveNameplateWebp's
    // `nameplateName` (the cache-channel message heading); decorations have no equivalent field to feed.
    displayName: { type: String, required: true },
    // Nameplate-only (0/262 missing either field per the catalog doc's own verified structure).
    // paletteHex is Discord's own resolved hex for this design's bed -- used DIRECTLY as bedHex rather
    // than re-deriving it through utils/nameplatePalettes.js's 12-entry table, so a bulk-cache run never
    // depends on that table staying in sync with whatever palette names Discord ships in the future.
    palette: { type: String },
    paletteHex: { type: String },
    // Present only on a variant of a multi-color design; absent (name used instead) on a single-SKU one.
    variantLabel: { type: String },
    variantValue: { type: String },
    // The variant's own RAW `name` field from the JSON -- present only on a single-variant design (the
    // catalog doc's "name vs variant_label/variant_value" split: a group carries one or the other, never
    // both). Stored alongside the COMPUTED `displayName` above rather than only keeping the derived
    // value, so this doc stays a full 1:1 mirror of the source JSON and nothing has to be re-parsed from
    // it later if the display-name rule ever needs revisiting.
    name: { type: String },
    cacheStatus: { type: String, enum: ['pending', 'cached', 'failed'], default: 'pending' },
    cachedAt: { type: Date },
    lastAttemptAt: { type: Date },
    lastError: { type: String }
}, { timestamps: true });

// Every bulk-cache run's real query: "which SKUs of this kind still need work" -- kept a compound index
// since kind and cacheStatus are always filtered together, never cacheStatus alone.
CollectibleCatalogSchema.index({ kind: 1, cacheStatus: 1 });

module.exports = mongoose.model('CollectibleCatalog', CollectibleCatalogSchema);
