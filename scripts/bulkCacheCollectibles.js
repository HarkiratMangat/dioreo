// scripts/bulkCacheCollectibles.js -- bulk-renders the nameplate/decoration catalog (via CollectibleCatalog, synced from docs/reference/nameplate-decoration-catalog.json by scripts/syncCatalogToMongo.js) into the bot's existing Cloudinary + Discord-storage-channel cache (utils/nameplateWebpCache.js, utils/decorationWebpCache.js), replacing today's lazy per-user-equip discovery for anything already in the catalog. The lazy path (utils/colorPalette.js's resolve*Webp calls) stays as the fallback for anything not yet catalogued -- Harkirat's explicit requirement.
//
// Grouped by (kind, collection, groupName) -- scripts/catalogGrouping.js's groupCatalogDocs -- so a design's several color variants post together as ONE cache-channel message instead of one per SKU ("keeping the channel tidy" -- Harkirat's request), separated by dividers. A variant already cached with a real discord_cdn_url is skipped (it already has a channel entry from whenever it was first cached -- this codebase's "never rewrite cache-channel history" rule). A variant cached WITHOUT a discord_cdn_url (a crash between the Cloudinary upload and the Discord post on an earlier run, or a storage-channel failure) is NOT considered done -- still eligible for a channel post this run. A variant cached with `render_source: 'fallback'` (rendered by a live user before this design existed in our catalog snapshot) gets its Cloudinary context HEALED to 'catalog' + full metadata in place -- metadata-only, no re-render, no new message.
//
// Usage:
//   node scripts/bulkCacheCollectibles.js --sample 6              # N diverse design groups
//   node scripts/bulkCacheCollectibles.js --collection Underworld # one full collection
//   node scripts/bulkCacheCollectibles.js --sku 1533919389806493928
//   node scripts/bulkCacheCollectibles.js --kind nameplate        # nameplate|decoration|all (default all)
//   node scripts/bulkCacheCollectibles.js --retry-failed          # also reprocess cacheStatus:'failed'
//   node scripts/bulkCacheCollectibles.js --dry-run
//   node scripts/bulkCacheCollectibles.js --batch-size 5 --delay-ms 3000   (defaults shown)
//
// Rate-limiting: uploadToStorageChannel/uploadMultipleToStorageChannel already go through
// @discordjs/rest's REST client, which implements exactly what Discord's own docs recommend -- per-bucket header parsing and automatic backoff on 429 ("rate limits should not be hard coded into your app" -- checked directly against Discord's rate-limits documentation, there is no published fixed number for the message-create route). Real protection against hitting the limit therefore already exists underneath this pipeline for free. --batch-size/--delay-ms below are a deliberate COURTESY pacing measure on top of that (predictable CPU load, readable progress, avoiding a burst that queues hundreds of requests into the REST bucket manager at once) -- not the primary defense.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const CollectibleCatalog = require('../models/CollectibleCatalog');
const { groupCatalogDocs, chunkVariants } = require('./catalogGrouping');
const { slugify } = require('../utils/cloudinaryCache');
const {
    getCachedNameplateWebp, renderNameplateWebpForBulk, attachNameplateDiscordCdnUrl,
    publicIdFor: nameplatePublicIdFor, FOLDER: NAMEPLATE_FOLDER
} = require('../utils/nameplateWebpCache');
const {
    getCachedDecorationWebp, renderDecorationWebpForBulk, attachDecorationDiscordCdnUrl,
    publicIdFor: decorationPublicIdFor, FOLDER: DECORATION_FOLDER
} = require('../utils/decorationWebpCache');
const { uploadMultipleToStorageChannel } = require('../utils/discordCdnStorage');
const { recordDiscordCdnAsset } = require('../utils/discordCdnAssetIndex');

function parseArgs(argv) {
    const args = { batchSize: 5, delayMs: 3000, kind: 'all' };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--sample') args.sample = parseInt(argv[++i], 10);
        else if (a === '--collection') args.collection = argv[++i];
        else if (a === '--sku') args.sku = argv[++i];
        else if (a === '--kind') args.kind = argv[++i];
        else if (a === '--batch-size') args.batchSize = parseInt(argv[++i], 10);
        else if (a === '--delay-ms') args.delayMs = parseInt(argv[++i], 10);
        else if (a === '--retry-failed') args.retryFailed = true;
        else if (a === '--dry-run') args.dryRun = true;
    }
    return args;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function hexToInt(hex) { return hex ? parseInt(String(hex).replace('#', ''), 16) : null; }

// Both kinds now source from the SKU-addressed /animated endpoint (2026-08-15 10:31 EDT pivot -- see utils/nameplateWebpCache.js's header): confirmed live to return a genuine multi-frame APNG for nameplates too, not just decorations.
function assetUrlFor(skuId) {
    return `https://cdn.discordapp.com/media/v1/collectibles-shop/${skuId}/animated`;
}

// Cloudinary `asset_folder` (Media Library organization ONLY -- never the cache key, see nameplateWebpCache.js's publicIdFor comment for why). Always has a real collection here (a CollectibleCatalog doc always carries one); the live path's own `_uncataloged` fallback folder is handled inside the cache modules themselves, not here.
function assetFolderFor(kind, parentCategory) {
    const root = kind === 'nameplate' ? NAMEPLATE_FOLDER : DECORATION_FOLDER;
    return `${root}/${slugify(parentCategory)}`;
}

// The catalog descriptor the Cloudinary public id is built from -- see utils/collectibleCacheKey.js. The bulk path has it directly on the doc; the LIVE path resolves the same pair by SKU. They must agree or the two paths stop sharing a cache, which is the entire point of pre-caching.
function catalogKeyFor(doc) {
    return { groupName: doc.groupName, variantLabel: doc.variantLabel || null };
}

async function getCachedFor(doc) {
    return doc.kind === 'nameplate'
        ? getCachedNameplateWebp(doc.asset, catalogKeyFor(doc))
        : getCachedDecorationWebp(doc.asset, catalogKeyFor(doc));
}

async function renderVariant(doc, assetFolder) {
    const url = assetUrlFor(doc.skuId);
    if (doc.kind === 'nameplate') {
        return renderNameplateWebpForBulk(url, doc.asset, doc.palette, hexToInt(doc.paletteHex), assetFolder, catalogKeyFor(doc));
    }
    return renderDecorationWebpForBulk(url, doc.asset, assetFolder, catalogKeyFor(doc));
}

async function attachFor(doc, publicId, palette, discordCdnUrl, extra) {
    return doc.kind === 'nameplate'
        ? attachNameplateDiscordCdnUrl(publicId, palette, discordCdnUrl, extra)
        : attachDecorationDiscordCdnUrl(publicId, palette, discordCdnUrl, extra);
}

function publicIdFor(doc) {
    return doc.kind === 'nameplate'
        ? nameplatePublicIdFor(doc.asset, catalogKeyFor(doc))
        : decorationPublicIdFor(doc.asset, catalogKeyFor(doc));
}

// Every field the expanded metadata (Harkirat's feedback point 2) needs, patched into Cloudinary context alongside the palette + discord_cdn_url this render already carries. Cloudinary context values are flat strings; attach*DiscordCdnUrl drops undefined/null/empty entries automatically.
function catalogExtra(doc) {
    return {
        render_source: 'catalog',
        sku_id: doc.skuId,
        base_sku_id: doc.baseSkuId,
        collection: doc.parentCategory,
        group_name: doc.groupName,
        variant_label: doc.variantLabel,
        variant_value: doc.variantValue,
        label: doc.label,
        display_name: doc.displayName
    };
}

function hexOf(c) { return `\`#${(c.hex >>> 0).toString(16).padStart(6, '0').toUpperCase()}\``; }
function upperHex(hex) { return hex ? `#${String(hex).replace('#', '').toUpperCase()}` : null; }

// ⚠️ LAYOUT SPECIFIED BY HARKIRAT 2026-08-15 22:32 EDT, to the character -- do not "tidy" it. It REPLACES the flat all-footnotes layout this file shipped with earlier the same day (that one was explicitly a placeholder pending his review of a real sample run, which this is the result of). What moved, and why, so a later edit doesn't undo it by reasoning from the old shape:
//   · the description (`label`) is now a BLOCKQUOTE next to the image, not a `-# **Description:**`
//     footnote -- it is the one human sentence in the block and was buried among machine identifiers;
//   · Parent Category / Group / Variant / Base SKU all left the per-variant footnotes: they are
//     properties of the DESIGN or of the heading line, so they are stated ONCE in the headings above
//     instead of repeated identically under every variant;
//   · dimensions/frames/size moved OFF the heading and onto the Rendered line (BOLD since
//     2026-08-15 23:43 EDT), which frees the heading to carry the variant's own colour swatch;
//   · SKU is its own line. It used to be tacked onto the end of the Cloudinary line, where it read as
//     part of the url rather than as a separate identifier -- Harkirat called this out on the
//     fallback layout too (see nameplateWebpCache.js/decorationWebpCache.js).
function variantMetadataLines(doc, render) {
    const lines = [];
    if (doc.kind === 'nameplate') {
        const swatches = render.palette ? render.palette.map(hexOf).join(' · ') : `\`${doc.paletteHex || 'none'}\``;
        lines.push(`-# **Palette:** **\`${doc.palette || 'none'}\` — ${swatches}**`);
    } else if (render.palette) {
        lines.push(`-# **Colors:** **${render.palette.map(hexOf).join(' · ')}**`);
    }
    lines.push(`-# **Asset:** \`${doc.asset}\``);
    lines.push(`-# **Cloudinary:** \`/${render.publicId}\``);
    lines.push(`-# **SKU:** \`${doc.skuId}\``);
    lines.push(`-# Rendered <t:${Math.floor(Date.now() / 1000)}:R> in \`${render.renderMs}ms\` — **\`${render.width}×${render.height}px\` · \`${render.frameCount}f\` · \`${(render.webpBuffer.length / 1024).toFixed(1)}kB\`**`);
    return lines;
}

// The design-level header: `## <design> — __<collection>__`, plus a second line for a multi-variant design carrying the variant count and the base SKU. Both of those are properties of the DESIGN, not of any one variant, which is exactly why they sit here once instead of under each variant. ⚠️ `renders` is the CHUNK being posted, not necessarily the whole group -- chunkVariants() splits a design with more variants than one message's component budget. The count therefore describes this message, matching what a reader can actually see in it.
function groupHeaderLines(group, renders) {
    const lines = [`## ${group.groupName} — __${group.parentCategory}__`];
    if (renders.length > 1) {
        // The variant LABELS, in render order -- which is base-variant-first, guaranteed by catalogGrouping.js. This replaced a `**Base SKU:** <id>` line (Harkirat 2026-08-15 23:43 EDT): the base sku is always some variant's own sku, so listing that variant first says the same thing without spending a line on a 19-digit number the reader cannot use.
        const labels = renders.map(({ doc }) => doc.variantLabel).filter(Boolean);
        lines.push(`**${renders.length} Variants**${labels.length ? ` — **${labels.map(l => `\`${l}\``).join(' · ')}**` : ''}`);
    }
    return lines;
}

// The per-variant heading + description. A SINGLE-variant design gets no `###` heading at all -- the `##` group header one line above already names it, and repeating the same name immediately below it was pure noise; it keeps only its description blockquote, which merges up into the header block.
function variantHeadingLines(doc, isMulti) {
    const lines = [];
    if (isMulti) {
        // The colour SWATCH only -- the variant label was dropped 2026-08-15 23:43 EDT because `displayName` already ends in it ("Eternal Damnation (Blue)"), so printing both said "Blue" twice on one line. The group header carries the full label list instead.
        lines.push(`### ${doc.displayName}${doc.variantValue ? ` — \`${upperHex(doc.variantValue)}\`` : ''}`);
    }
    if (doc.label) lines.push(`> ${doc.label}`);
    return lines;
}

// ONE grouped Components V2 message for a design's freshly-rendered variants -- a Container headed by the design name + collection, then a divider-separated block per variant.
//
// Nameplates keep the full-width Media Gallery (type 12) and decorations keep Section+Thumbnail (type 9/11): a nameplate is a wide banner that reads badly shrunk into a Section's small square accessory thumbnail, which is built for decoration's icon-shaped art. Screenshot-verified against the live cache channel 2026-08-15 11:49 EDT.
//
// ⚠️ Component budget, counted RECURSIVELY (Discord's hard ceiling is 40 -- this bot has hit COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED in production). Multi-variant costs 4 per variant on BOTH kinds -- nameplate: divider + heading/description text + gallery + metadata text; decoration: divider + Section + its text child + its thumbnail accessory -- plus a fixed Container + header text. That is exactly what catalogGrouping.js's COMPONENTS_PER_VARIANT=4 / FIXED_COMPONENTS=2 assume, so MAX_VARIANTS_PER_MESSAGE stays correct; keep them in step if this tree changes.
function buildGroupComponents(group, renders) {
    const isMulti = renders.length > 1;
    const headerLines = groupHeaderLines(group, renders);
    // A single-variant design's description belongs in the header block itself (there is no `###` heading to hang it under), which also keeps that layout at 3 components instead of 4.
    if (!isMulti) headerLines.push(...variantHeadingLines(renders[0].doc, false));
    const components = [{ type: 10, content: headerLines.join('\n') }];

    renders.forEach(({ doc, render }, i) => {
        // A divider before EVERY variant of a multi-variant design, INCLUDING the first -- it separates the design-level header from the variant list, not just one variant from the next. (The old layout used N-1 dividers because it had no header/variant boundary to mark.)
        if (isMulti) components.push({ type: 14, spacing: 1, divider: true });
        // EMPTY for a single-variant design -- its heading lines were already folded into the header block above. Calling variantHeadingLines() again here emitted the description blockquote a SECOND time (caught 2026-08-15 22:39 EDT by rendering the real Underworld group, not by the unit tests, which asserted the header CONTAINED the description but never that it appeared exactly once). The "exactly once" assertion now exists -- keep it.
        const heading = isMulti ? variantHeadingLines(doc, true) : [];
        const metadata = variantMetadataLines(doc, render).join('\n');
        if (doc.kind === 'nameplate') {
            if (heading.length) components.push({ type: 10, content: heading.join('\n') });
            components.push({ type: 12, items: [{ media: { url: `attachment://${render.filename}` } }] });
            components.push({ type: 10, content: metadata });
        } else {
            components.push({
                type: 9, // Section
                components: [{ type: 10, content: [...heading, metadata].join('\n') }],
                accessory: { type: 11, media: { url: `attachment://${render.filename}` } }
            });
        }
    });

    const first = renders[0];
    const accent = first.doc.kind === 'nameplate'
        ? (hexToInt(first.doc.paletteHex) ?? first.render.palette?.[0]?.hex)
        : first.render.palette?.[0]?.hex;
    return [{ type: 17, accent_color: accent ?? undefined, components }];
}

// --sample N picks N deliberately DIVERSE design groups (one multi-variant nameplate, one single-variant nameplate, one multi-variant decoration, one single-variant decoration, then fills any remaining slots in input order) rather than "the first N by Mongo order" -- a naive first-N could land entirely inside one design and never exercise the grouping feature at all, the thing Harkirat most wants to see verified.
function pickDiverseSample(groups, n) {
    const buckets = [
        groups.filter(g => g.kind === 'nameplate' && g.variants.length > 1),
        groups.filter(g => g.kind === 'nameplate' && g.variants.length === 1),
        groups.filter(g => g.kind === 'decoration' && g.variants.length > 1),
        groups.filter(g => g.kind === 'decoration' && g.variants.length === 1)
    ];
    const picked = [];
    const pickedKeys = new Set();
    const key = g => `${g.kind} ${g.parentCategory} ${g.groupName}`;
    for (const bucket of buckets) {
        if (picked.length >= n) break;
        if (bucket[0]) { picked.push(bucket[0]); pickedKeys.add(key(bucket[0])); }
    }
    for (const g of groups) {
        if (picked.length >= n) break;
        if (!pickedKeys.has(key(g))) { picked.push(g); pickedKeys.add(key(g)); }
    }
    return picked.slice(0, n);
}

async function markCached(doc) {
    await CollectibleCatalog.updateOne(
        { skuId: doc.skuId },
        { cacheStatus: 'cached', cachedAt: new Date(), lastAttemptAt: new Date(), lastError: null }
    );
}

async function processGroup(group, args, stats) {
    const assetFolder = assetFolderFor(group.kind, group.parentCategory);
    const toRender = [];
    const toHeal = [];
    const toSkip = [];

    for (const doc of group.variants) {
        const cached = await getCachedFor(doc);
        if (cached && cached.discordCdnUrl) {
            // 'recovered' (2026-08-17 19:09 EDT, see utils/discordCdnAssetIndex.js) is treated the same as 'fallback' here: a resource restored from the durable Discord-message index after its Cloudinary resource was deleted out-of-band never had its catalog metadata (sku_id/collection/etc) re-attached, since the recovery path deliberately doesn't try to remember that -- this branch is what closes the loop.
            if (cached.renderSource === 'fallback' || cached.renderSource === 'recovered') toHeal.push({ doc, cached });
            else toSkip.push(doc);
            continue;
        }
        toRender.push(doc);
    }

    if (args.dryRun) {
        toRender.forEach(doc => console.log(`  [dry-run] would render  ${doc.skuId}  ${doc.displayName}`));
        toHeal.forEach(({ doc }) => console.log(`  [dry-run] would heal    ${doc.skuId}  ${doc.displayName}`));
        toSkip.forEach(doc => console.log(`  [dry-run] already done  ${doc.skuId}  ${doc.displayName}`));
        return;
    }

    // Already fully cached AND already catalog-sourced -- just reconcile Mongo status in case an earlier run's Cloudinary+Discord work succeeded but its own Mongo write didn't (resumability).
    for (const doc of toSkip) { await markCached(doc); stats.skipped++; }

    // Healed: a live user rendered this exact design before it existed in our catalog snapshot. Metadata-only patch, no re-render, no new channel message.
    for (const { doc, cached } of toHeal) {
        await attachFor(doc, publicIdFor(doc), cached.palette, cached.discordCdnUrl, catalogExtra(doc));
        await markCached(doc);
        stats.healed++;
    }

    const renders = [];
    for (const doc of toRender) {
        const render = await renderVariant(doc, assetFolder);
        if (render) {
            renders.push({ doc, render });
        } else {
            stats.failed++;
            await CollectibleCatalog.updateOne(
                { skuId: doc.skuId },
                { cacheStatus: 'failed', lastAttemptAt: new Date(), lastError: 'render returned null -- see console output above for the underlying cause' }
            );
        }
    }
    if (!renders.length) return;

    for (const chunk of chunkVariants(renders)) {
        const files = chunk.map(({ render }) => ({ name: render.filename, contentType: 'image/webp', data: render.webpBuffer }));
        const components = buildGroupComponents(group, chunk);
        const channelId = group.kind === 'nameplate' ? process.env.NAMEPLATE_CACHE_CHANNEL_ID : process.env.DECORATION_CACHE_CHANNEL_ID;
        const grouped = await uploadMultipleToStorageChannel(channelId, files, components);
        const urls = grouped?.urls || null;
        const messageId = grouped?.messageId || null;
        for (let i = 0; i < chunk.length; i++) {
            const { doc, render } = chunk[i];
            const url = urls ? urls[i] : null;
            await attachFor(doc, render.publicId, render.palette, url, { ...catalogExtra(doc), discord_message_id: messageId });
            // Durable secondary index (2026-08-17 19:09 EDT) -- see utils/discordCdnAssetIndex.js's header. One row per variant, all sharing this grouped message's id, so a LATER deletion of just one variant's Cloudinary resource can recover that variant alone without touching the others still sharing this message.
            if (url && messageId) {
                await recordDiscordCdnAsset({
                    publicId: render.publicId, kind: doc.kind, channelId, messageId,
                    discordCdnUrl: url, filename: render.filename
                });
            }
            await markCached(doc);
            stats.cached++;
        }
    }
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const filter = {};
    if (args.kind !== 'all') filter.kind = args.kind;
    if (args.collection) filter.parentCategory = args.collection;
    if (args.sku) {
        filter.skuId = args.sku;
    } else {
        filter.cacheStatus = args.retryFailed ? { $in: ['pending', 'failed'] } : 'pending';
    }

    const docs = await CollectibleCatalog.find(filter).lean();
    console.log(`${docs.length} SKU(s) match the filter.`);
    if (!docs.length) { await mongoose.disconnect(); return; }

    let groups = groupCatalogDocs(docs);
    if (args.sample) groups = pickDiverseSample(groups, args.sample);

    console.log(`Processing ${groups.length} design group(s)${args.dryRun ? ' (DRY RUN)' : ''}, batches of ${args.batchSize}, ${args.delayMs}ms delay between batches.\n`);
    const stats = { cached: 0, healed: 0, skipped: 0, failed: 0 };
    let done = 0;
    for (let i = 0; i < groups.length; i += args.batchSize) {
        const batch = groups.slice(i, i + args.batchSize);
        await Promise.all(batch.map(g => processGroup(g, args, stats)));
        done += batch.length;
        console.log(`Progress: ${done}/${groups.length} group(s) — cached=${stats.cached} healed=${stats.healed} skipped=${stats.skipped} failed=${stats.failed}`);
        if (!args.dryRun && i + args.batchSize < groups.length) await sleep(args.delayMs);
    }

    console.log(`\nDone. cached=${stats.cached} healed=${stats.healed} skipped=${stats.skipped} failed=${stats.failed} (${groups.length} group(s), ${docs.length} SKU(s) considered).`);
    await mongoose.disconnect();
}

module.exports = {
    parseArgs, catalogKeyFor, pickDiverseSample, assetFolderFor, catalogExtra,
    buildGroupComponents, variantMetadataLines, groupHeaderLines, variantHeadingLines
};

if (require.main === module) {
    main().catch(err => { console.error('Fatal:', err?.message || err); process.exit(1); });
}
