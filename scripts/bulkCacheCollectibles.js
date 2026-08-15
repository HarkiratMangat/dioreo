// scripts/bulkCacheCollectibles.js -- bulk-renders the nameplate/decoration catalog (via
// CollectibleCatalog, synced from docs/reference/nameplate-decoration-catalog.json by
// scripts/syncCatalogToMongo.js) into the bot's existing Cloudinary + Discord-storage-channel cache
// (utils/nameplateWebpCache.js, utils/decorationWebpCache.js), replacing today's lazy per-user-equip
// discovery for anything already in the catalog. The lazy path (utils/colorPalette.js's resolve*Webp
// calls) stays as the fallback for anything not yet catalogued -- Harkirat's explicit requirement.
//
// Grouped by (kind, collection, groupName) -- scripts/catalogGrouping.js's groupCatalogDocs -- so a
// design's several color variants post together as ONE cache-channel message instead of one per SKU
// ("keeping the channel tidy" -- Harkirat's request), separated by dividers. A variant already cached
// with a real discord_cdn_url is skipped (it already has a channel entry from whenever it was first
// cached -- this codebase's "never rewrite cache-channel history" rule). A variant cached WITHOUT a
// discord_cdn_url (a crash between the Cloudinary upload and the Discord post on an earlier run, or a
// storage-channel failure) is NOT considered done -- still eligible for a channel post this run. A
// variant cached with `render_source: 'fallback'` (rendered by a live user before this design existed
// in our catalog snapshot) gets its Cloudinary context HEALED to 'catalog' + full metadata in place --
// metadata-only, no re-render, no new message.
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
// @discordjs/rest's REST client, which implements exactly what Discord's own docs recommend --
// per-bucket header parsing and automatic backoff on 429 ("rate limits should not be hard coded into
// your app" -- checked directly against Discord's rate-limits documentation, there is no published
// fixed number for the message-create route). Real protection against hitting the limit therefore
// already exists underneath this pipeline for free. --batch-size/--delay-ms below are a deliberate
// COURTESY pacing measure on top of that (predictable CPU load, readable progress, avoiding a burst
// that queues hundreds of requests into the REST bucket manager at once) -- not the primary defense.
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

// Both kinds now source from the SKU-addressed /animated endpoint (2026-08-15 10:31 EDT pivot -- see
// utils/nameplateWebpCache.js's header): confirmed live to return a genuine multi-frame APNG for
// nameplates too, not just decorations.
function assetUrlFor(skuId) {
    return `https://cdn.discordapp.com/media/v1/collectibles-shop/${skuId}/animated`;
}

// Cloudinary `asset_folder` (Media Library organization ONLY -- never the cache key, see
// nameplateWebpCache.js's publicIdFor comment for why). Always has a real collection here (a
// CollectibleCatalog doc always carries one); the live path's own `_uncataloged` fallback folder is
// handled inside the cache modules themselves, not here.
function assetFolderFor(kind, parentCategory) {
    const root = kind === 'nameplate' ? NAMEPLATE_FOLDER : DECORATION_FOLDER;
    return `${root}/${slugify(parentCategory)}`;
}

async function getCachedFor(doc) {
    return doc.kind === 'nameplate' ? getCachedNameplateWebp(doc.asset, doc.palette) : getCachedDecorationWebp(doc.asset);
}

async function renderVariant(doc, assetFolder) {
    const url = assetUrlFor(doc.skuId);
    if (doc.kind === 'nameplate') {
        return renderNameplateWebpForBulk(url, doc.asset, doc.palette, hexToInt(doc.paletteHex), assetFolder);
    }
    return renderDecorationWebpForBulk(url, doc.asset, assetFolder);
}

async function attachFor(doc, publicId, palette, discordCdnUrl, extra) {
    return doc.kind === 'nameplate'
        ? attachNameplateDiscordCdnUrl(publicId, palette, discordCdnUrl, extra)
        : attachDecorationDiscordCdnUrl(publicId, palette, discordCdnUrl, extra);
}

function publicIdFor(doc) {
    return doc.kind === 'nameplate' ? nameplatePublicIdFor(doc.asset, doc.palette) : decorationPublicIdFor(doc.asset);
}

// Every field the expanded metadata (Harkirat's feedback point 2) needs, patched into Cloudinary
// context alongside the palette + discord_cdn_url this render already carries. Cloudinary context
// values are flat strings; attach*DiscordCdnUrl drops undefined/null/empty entries automatically.
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

// One variant's Section content -- keeps every field the original single-item layout carried
// (dimensions/frame-count/size, palette+swatches for nameplates, asset path, Cloudinary public id,
// SKU, render time) AND adds the expanded set from the catalog: the description (`label`), Parent
// Category + Group, and the variant's own color identity when it has one. This is the redesigned
// layout reviewed via the sample run, per Harkirat's feedback point 1 -- not a silent reuse of the old
// single-item text.
function variantMetadataLines(doc, render) {
    const lines = [
        `### ${doc.displayName} — \`${render.width}×${render.height}px\` · \`${render.frameCount}f\` · \`${(render.webpBuffer.length / 1024).toFixed(1)}kB\``
    ];
    if (doc.kind === 'nameplate') {
        const swatches = render.palette ? render.palette.map(hexOf).join(' · ') : `\`${doc.paletteHex || 'none'}\``;
        lines.push(`-# **Palette:** **\`${doc.palette || 'none'}\` — ${swatches}**`);
    } else if (render.palette) {
        lines.push(`-# **Colors:** **${render.palette.map(hexOf).join(' · ')}**`);
    }
    if (doc.label) lines.push(`-# **Description:** ${doc.label}`);
    lines.push(`-# **Parent Category:** \`${doc.parentCategory}\` · **Group:** \`${doc.groupName}\``);
    if (doc.variantLabel) lines.push(`-# **Variant:** \`${doc.variantLabel}\`${doc.variantValue ? ` (\`${doc.variantValue}\`)` : ''}`);
    lines.push(`-# **Asset:** \`${doc.asset}\``);
    lines.push(`-# **Cloudinary:** \`/${render.publicId}\` · **SKU:** \`${doc.skuId}\`${doc.baseSkuId && doc.baseSkuId !== doc.skuId ? ` · **Base SKU:** \`${doc.baseSkuId}\`` : ''}`);
    lines.push(`-# Rendered <t:${Math.floor(Date.now() / 1000)}:R> in \`${render.renderMs}ms\``);
    return lines;
}

// ONE grouped Components V2 message for a design's freshly-rendered variants -- a Container headed by
// the design name + Parent Category, then a divider-separated Section per variant (thumbnail + the
// full metadata above). Section+Thumbnail (type 9/11) is used for EVERY variant here, including
// nameplates, rather than nameplate's single-item full-width Media Gallery -- a full-width gallery per
// variant would make a multi-variant message far too tall; this is the actual redesign feedback point 1
// asked for, reviewed against the real rendered sample rather than locked as text here.
function buildGroupComponents(group, renders) {
    const count = renders.length;
    const header = `## ${group.groupName}${count > 1 ? ` — ${count} variants` : ''}\n-# **Parent Category:** \`${group.parentCategory}\``;
    const components = [{ type: 10, content: header }];
    renders.forEach(({ doc, render }, i) => {
        if (i > 0) components.push({ type: 14, spacing: 1, divider: true });
        const metadataContent = variantMetadataLines(doc, render).join('\n');
        if (doc.kind === 'nameplate') {
            // Full-width Media Gallery on top, metadata below -- the ORIGINAL single-item nameplate
            // layout (screenshot-verified against the live cache channel 2026-08-15 11:49 EDT), not
            // decoration's compact Section+Thumbnail. Nameplates are wide banner-shaped images that
            // read badly shrunk into a side thumbnail; a Section's accessory thumbnail is small and
            // square, built for decoration's icon-shaped art, not a 512x96-ish banner. Costs 3
            // components/variant here (gallery + text + divider) vs decoration's 4 -- MAX_VARIANTS_PER_
            // MESSAGE in catalogGrouping.js is still computed off the more expensive 4, so this stays a
            // safe (if slightly conservative) cap for nameplate-only groups too.
            components.push({ type: 12, items: [{ media: { url: `attachment://${render.filename}` } }] });
            components.push({ type: 10, content: metadataContent });
        } else {
            components.push({
                type: 9, // Section
                components: [{ type: 10, content: metadataContent }],
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

// --sample N picks N deliberately DIVERSE design groups (one multi-variant nameplate, one
// single-variant nameplate, one multi-variant decoration, one single-variant decoration, then fills any
// remaining slots in input order) rather than "the first N by Mongo order" -- a naive first-N could
// land entirely inside one design and never exercise the grouping feature at all, the thing Harkirat
// most wants to see verified.
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
            if (cached.renderSource === 'fallback') toHeal.push({ doc, cached });
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

    // Already fully cached AND already catalog-sourced -- just reconcile Mongo status in case an
    // earlier run's Cloudinary+Discord work succeeded but its own Mongo write didn't (resumability).
    for (const doc of toSkip) { await markCached(doc); stats.skipped++; }

    // Healed: a live user rendered this exact design before it existed in our catalog snapshot.
    // Metadata-only patch, no re-render, no new channel message.
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
        const urls = await uploadMultipleToStorageChannel(channelId, files, components);
        for (let i = 0; i < chunk.length; i++) {
            const { doc, render } = chunk[i];
            await attachFor(doc, render.publicId, render.palette, urls ? urls[i] : null, catalogExtra(doc));
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

module.exports = { parseArgs, pickDiverseSample, assetFolderFor, catalogExtra, buildGroupComponents, variantMetadataLines };

if (require.main === module) {
    main().catch(err => { console.error('Fatal:', err?.message || err); process.exit(1); });
}
