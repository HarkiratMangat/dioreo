// scripts/catalogGrouping.js -- pure grouping/chunking logic for scripts/bulkCacheCollectibles.js,
// factored out so it's testable without Mongo/Cloudinary/Discord (see scripts/catalogGrouping.test.js).
//
// Grouping key: (kind, collection, groupName) -- the natural "one design, several color variants" unit
// the catalog JSON's own collection -> group -> variants[] nesting already gives (see
// docs/reference/nameplate-decoration-catalog.md). A CollectibleCatalog doc's own
// {kind, collection, groupName} triple IS this key.

function groupKey(doc) {
    return `${doc.kind} ${doc.parentCategory} ${doc.groupName}`;
}

// Groups an array of CollectibleCatalog-shaped docs by (kind, collection, groupName), preserving each
// group's first-seen order and each group's variants in input order APART from the base variant, which
// is promoted to the front (see below) -- both matter, since a
// deterministic, reproducible processing order makes --sample/--dry-run output predictable across runs
// of the same input.
function groupCatalogDocs(docs) {
    const order = [];
    const byKey = new Map();
    for (const doc of docs) {
        const key = groupKey(doc);
        if (!byKey.has(key)) {
            const group = { kind: doc.kind, parentCategory: doc.parentCategory, groupName: doc.groupName, variants: [] };
            byKey.set(key, group);
            order.push(group);
        }
        byKey.get(key).variants.push(doc);
    }
    // The BASE variant leads every group (Harkirat 2026-08-15 23:43 EDT). The cache-channel embed no
    // longer prints the base SKU as its own line -- instead the variant that SKU refers to is simply
    // listed first, which says the same thing without a line of machine id. Stable otherwise, so the
    // catalog's own order still decides the rest.
    //
    // ⚠️ Sorted HERE, not in the message builder, so the ordering survives chunkVariants() and so the
    // render order, the header's variant-label list and the container's accent colour (taken from
    // renders[0]) can never disagree about which variant is the design's primary one. It was already
    // true by accident of catalog order for every group checked; this makes it guaranteed.
    for (const group of order) {
        const baseIndex = group.variants.findIndex(v => v.baseSkuId && v.skuId === v.baseSkuId);
        if (baseIndex > 0) group.variants.unshift(group.variants.splice(baseIndex, 1)[0]);
    }
    return order;
}

// Component budget for ONE grouped cache-channel message -- computed, not guessed, per this session's
// approved plan: divider(1) + Section(1) + TextDisplay child(1) + Thumbnail accessory(1) ~= 4
// components per variant, plus a fixed Container + header TextDisplay ~= 2. Discord's real hard
// ceiling is 40 total components, counted RECURSIVELY (this bot has hit
// COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED in production before -- see .claude/rules/rendering-and-ui.md)
// -- (40-2)/4 = 9.5, so capping at 8 leaves real headroom rather than sitting right at the edge (the
// "assert real headroom, not just under the line" discipline this project already applies elsewhere,
// e.g. scripts/colorPanelBudget.test.js).
const COMPONENTS_PER_VARIANT = 4;
const FIXED_COMPONENTS = 2;
const MAX_VARIANTS_PER_MESSAGE = Math.floor((40 - FIXED_COMPONENTS) / COMPONENTS_PER_VARIANT);

// Splits an array (a group's rendered variants) into chunks no larger than maxPerMessage -- the
// fallback for the rare design with more variants than one message's component budget allows. The
// catalog's own measured shape (235 nameplate groups -> 262 SKUs, 490 decoration groups -> 663 SKUs,
// ~1.1-1.35 variants/group on average) means this essentially never fires in practice, but it has to
// exist rather than be hoped unnecessary.
function chunkVariants(items, maxPerMessage = MAX_VARIANTS_PER_MESSAGE) {
    if (items.length <= maxPerMessage) return [items];
    const chunks = [];
    for (let i = 0; i < items.length; i += maxPerMessage) {
        chunks.push(items.slice(i, i + maxPerMessage));
    }
    return chunks;
}

module.exports = { groupKey, groupCatalogDocs, chunkVariants, MAX_VARIANTS_PER_MESSAGE };
