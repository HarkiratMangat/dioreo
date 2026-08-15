// scripts/syncCatalogToMongo.js -- flattens docs/reference/nameplate-decoration-catalog.json's
// collection -> group -> variants[] nesting into ONE CollectibleCatalog Mongo doc per SKU. The JSON
// file stays the git-diffable source of truth (that's the entire reason Harkirat wanted it tracked);
// this collection is a derived runtime index built FROM it, indexed by sku_id -- same "JSON in, Mongo
// out" direction scripts/syncNameplateCatalog.py already uses for "Discord in, JSON out" on the other
// half of this pipeline.
//
// ADDITIVE, like syncNameplateCatalog.py's own JSON-side sync: descriptive fields get $set on every
// run (so a catalog refresh's edits propagate), but this bot's OWN bulk-cache progress tracking
// (cacheStatus/cachedAt/lastAttemptAt/lastError) gets $setOnInsert ONLY -- a re-run never resets
// progress for a SKU that's already been processed. Safe to re-run any time the JSON file changes.
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CollectibleCatalog = require('../models/CollectibleCatalog');

const CATALOG_PATH = path.join(__dirname, '..', 'docs', 'reference', 'nameplate-decoration-catalog.json');

// Display-name rule, verified against docs/reference/nameplate-decoration-catalog.md's own worked
// examples: a variant carrying `variant_label` displays as "<group_name> (<variant_label>)"; a variant
// with no variant_label carries its own `name` instead (present only on single-variant designs -- the
// two fields are mutually exclusive across all 925 entries, 0 exceptions per that doc). `name` falls
// back to `groupName` only in the theoretical case neither field is present, so this never returns an
// empty display name.
function computeDisplayName(groupName, variant) {
    if (variant.variant_label) return `${groupName} (${variant.variant_label})`;
    return variant.name || groupName;
}

// Flattens the raw catalog JSON (an object keyed by collection name, each holding `nameplates`/
// `decorations` arrays of design groups) into one flat record per SKU variant.
function flattenCatalog(catalog) {
    const docs = [];
    for (const [collection, sections] of Object.entries(catalog)) {
        for (const [jsonKind, kind] of [['nameplates', 'nameplate'], ['decorations', 'decoration']]) {
            for (const group of sections[jsonKind] || []) {
                for (const variant of group.variants || []) {
                    docs.push({
                        skuId: variant.sku_id,
                        kind,
                        // Field is `parentCategory`, not `collection` -- Mongoose reserves the latter
                        // as a schema pathname (see models/CollectibleCatalog.js's comment).
                        parentCategory: collection,
                        groupName: group.group_name,
                        baseSkuId: group.base_sku_id,
                        asset: variant.asset,
                        label: variant.label,
                        name: variant.name,
                        displayName: computeDisplayName(group.group_name, variant),
                        palette: variant.palette,
                        paletteHex: variant.palette_hex,
                        variantLabel: variant.variant_label,
                        variantValue: variant.variant_value
                    });
                }
            }
        }
    }
    return docs;
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const docs = flattenCatalog(catalog);
    console.log(`Parsed ${docs.length} SKU(s) from the catalog file.`);

    let inserted = 0, updated = 0;
    for (const { skuId, ...rawFields } of docs) {
        // Drop undefined keys explicitly rather than relying on driver behavior for `undefined` in an
        // update doc (a decoration has no palette/paletteHex; a single-variant design has no
        // variantLabel/variantValue) -- keeps a re-sync from writing explicit nulls over fields that
        // were simply never applicable to begin with.
        const fields = Object.fromEntries(Object.entries(rawFields).filter(([, v]) => v !== undefined));
        // `returnDocument: 'before'` returns the PRE-update doc -- null means it didn't exist yet (a
        // real insert). Deliberately not `rawResult: true`/`lastErrorObject.upserted`: that shape
        // depends on the underlying MongoDB driver's raw response format, which changed under this
        // Mongoose version and threw "Cannot read properties of null" instead of returning the expected
        // wrapper. Checking the returned document's existence is simpler and driver-shape-independent.
        const before = await CollectibleCatalog.findOneAndUpdate(
            { skuId },
            { $set: fields, $setOnInsert: { skuId, cacheStatus: 'pending' } },
            { upsert: true, returnDocument: 'before' }
        );
        if (before === null) inserted++;
        else updated++;
    }

    const nameplateCount = await CollectibleCatalog.countDocuments({ kind: 'nameplate' });
    const decorationCount = await CollectibleCatalog.countDocuments({ kind: 'decoration' });
    console.log(`\nDone. ${inserted} inserted, ${updated} updated (${docs.length} total SKUs in the catalog file).`);
    console.log(`Mongo now holds ${nameplateCount} nameplate(s), ${decorationCount} decoration(s), ${nameplateCount + decorationCount} total.`);

    await mongoose.disconnect();
}

module.exports = { computeDisplayName, flattenCatalog };

if (require.main === module) {
    main().catch(err => { console.error('Fatal:', err?.message || err); process.exit(1); });
}
