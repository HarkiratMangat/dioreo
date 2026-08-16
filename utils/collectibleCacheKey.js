// utils/collectibleCacheKey.js -- the ONE place a nameplate/decoration Cloudinary public_id is built.
//
// ⚠️ THE PUBLIC ID IS THE CACHE KEY. Changing how it is built ORPHANS every render stored under the
// old name, so this module exists to make sure the two paths that compute it -- the bulk catalog run
// (scripts/bulkCacheCollectibles.js) and the live per-user render (utils/colorPalette.js) -- can never
// drift apart and silently stop sharing a cache. That drift is the specific failure this design was
// chosen to prevent: if the live path computed a different id than the bulk run used, every user's
// equip would miss the pre-cached render and re-render from scratch, defeating bulk pre-caching
// entirely, and the `render_source: 'fallback'` heal-in-place path would stop finding anything.
//
// NAMING, specified by Harkirat 2026-08-15 22:57 EDT: `<group-name>-<variant-label>`, which is Discord's
// own naming structure for a nameplate with colour variants ("Eternal Damnation" + "Blue"/"Red"), read
// straight off the catalog rather than derived from the `asset` path. A design with no variants is
// just `<group-name>`. This REPLACES the previous `<slug(full asset path)>-<palette>` scheme, whose ids
// ran to `nameplates-eternal-damnation-1533919389806493928-black`.
//
// ✅ VERIFIED UNIQUE before shipping, not assumed: computed over the whole catalog snapshot
// (docs/reference/nameplate-decoration-catalog.json) 2026-08-15 23:00 EDT -- 262 nameplate SKUs -> 262
// distinct ids and 663 decoration SKUs -> 663 distinct ids, 0 collisions. Checked GLOBALLY, across
// collections, because FOLDER is flat: two collections each owning a design of the same name would
// have collided, and only a global check could have caught it.
//
// ⚠️ The palette name is deliberately NOT in the key any more. It was redundant: the catalog carries
// exactly one palette per SKU (0 of 262 nameplate variants missing `palette`/`palette_hex`), so a
// SKU's palette is a property of the design, never a user choice, and keying on it added nothing the
// group+variant pair did not already pin down.
const { slugify } = require('./cloudinaryCache');

// The catalogued id. `variantLabel` is absent for a single-variant design, which is why it is appended
// conditionally rather than slugified to an empty string and left as a trailing hyphen.
function catalogCacheKey(folder, groupName, variantLabel) {
    const parts = [slugify(groupName), variantLabel ? slugify(variantLabel) : null].filter(Boolean);
    return `${folder}/${parts.join('-')}`;
}

// The id for a design that is NOT in the catalog snapshot -- Discord added it after the snapshot was
// taken. By definition there is no `group_name`/`variant_label` to read, so this falls back to the
// best name available and marks it `legacy-` so the two id spaces can never be confused.
//
// ⚠️ `name` is only ever available for NAMEPLATES, and only from Discord's `Nameplate.label` a11y
// string (utils/nameplatePalettes.js's deriveNameplateName). Decorations have no equivalent field at
// all -- Harkirat's call, after confirming there is genuinely nothing to parse there -- and a
// nameplate whose label is missing derives no name either, since the catalog-shaped asset path
// `nameplates/<design>/<sku>/` ends in the SKU and nameplateNameFromAsset rejects it. Both of those
// cases fall through to the ASSET, which carries the SKU and is therefore unique per variant.
//
// ⚠️ The one residual risk, accepted knowingly: if Discord's a11y label for a multi-variant design
// omits the colour (`..._ETERNAL_DAMNATION_A11Y` rather than `..._ETERNAL_DAMNATION_BLUE_A11Y`), two
// uncatalogued variants of one design would derive the same name and share a key. Unverifiable
// today -- the only real label ever observed in this codebase is the single-variant
// `COLLECTIBLES_NAMEPLATES_TWILIGHT_A11Y`. If a collision is ever seen here, append the SKU; do not
// re-derive this from the asset, which was the previous scheme and is what the shortening replaced.
function legacyCacheKey(folder, name, asset) {
    return `${folder}/legacy-${slugify(name || asset)}`;
}

// The attachment filename for the cache-channel post. Derived FROM the public id rather than rebuilt
// from the same inputs, so the two can never disagree about what a given render is called.
function filenameForPublicId(publicId) {
    return `${publicId.split('/').pop()}.webp`;
}

// The LIVE path's bridge into the catalog. utils/colorPalette.js only ever knows what Discord's
// profile payload gave it -- asset, palette, skuId, name -- and never the group/variant pair the
// catalogued id is built from. Looking the SKU up here is what lets a live equip compute the SAME id
// the bulk run used and therefore HIT its pre-rendered cache instead of re-rendering.
//
// Memoized permanently per sku, including the negative result: the catalog is a static snapshot
// replaced by hand, so an answer cannot change under a running process, and the miss case (an
// uncatalogued design) is exactly the one that would otherwise re-query on every single view.
//
// Never throws. A Mongo failure degrades to the legacy id, i.e. to today's behaviour for an
// uncatalogued design -- a lookup that cannot complete must not break a working preview.
const catalogEntryCache = new Map();
async function lookupCatalogEntry(skuId) {
    if (!skuId) return null;
    if (catalogEntryCache.has(skuId)) return catalogEntryCache.get(skuId);
    let entry = null;
    try {
        const CollectibleCatalog = require('../models/CollectibleCatalog');
        const doc = await CollectibleCatalog.findOne({ skuId }, { groupName: 1, variantLabel: 1 }).lean();
        if (doc) entry = { groupName: doc.groupName, variantLabel: doc.variantLabel || null };
    } catch (err) {
        console.error(`Collectible catalog lookup failed for sku "${skuId}": ${err?.message || err}`);
        return null; // NOT memoized -- a transient Mongo error must not pin this sku to legacy forever
    }
    catalogEntryCache.set(skuId, entry);
    return entry;
}

module.exports = { catalogCacheKey, legacyCacheKey, filenameForPublicId, lookupCatalogEntry };
