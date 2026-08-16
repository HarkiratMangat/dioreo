// utils/nameplateWebpCache.js -- persistent Cloudinary cache for the animated nameplate WebP preview
// in View Colors' Nameplate page. Originally a webm-sourced pipeline (pivoted from GIF the same day it
// shipped, 2026-08-10) that needed `-c:v libvpx-vp9` to force the one ffmpeg decoder that actually
// surfaces WebM's alpha side-data (the default silently drops it). Pivoted AGAIN 2026-08-15 10:31 EDT to source
// from the SKU-addressed `media/v1/collectibles-shop/{sku_id}/animated` endpoint instead -- confirmed
// live to return a genuine multi-frame APNG for nameplates too, not just decorations (see
// docs/reference/nameplate-decoration-catalog.md), so this now shares decorationWebpCache.js's simpler
// `-f apng` extraction and the webm/vp9 decoder workaround is gone entirely for this source. The bed
// compositing step below (renderGradientBedFrame) is unaffected -- that's about what happens to each
// decoded frame, not how frames are decoded. Nameplate still needs it where decoration doesn't
// (nameplate art has a transparent background the client fills with a CSS gradient; decoration doesn't).
//
// Same render-once-cache-forever shape every other Cloudinary module here already follows
// (utils/cloudinaryCache.js/patchNotesCache.js/calendarBannerCache.js/loadoutImageCache.js) --
// this is the one difference: those all upload from a REMOTE url Cloudinary fetches itself; there is
// no remote url for this asset (it doesn't exist until this bot renders it), so this uploads a local
// Buffer via a base64 data URI instead.
//
// Cache key is (nameplate design asset, palette name) -- NOT per-user, NOT per-guild. Every user who
// has ever equipped the same nameplate design in the same palette gets the identical rendered WebP, so
// the first person to view any given combination pays the render cost once; everyone after that
// (any user, any server, any bot restart) gets a Cloudinary CDN url. Confirmed the render is genuinely
// deterministic per (asset, palette) -- the source APNG and the bed color are both fixed inputs.
//
// ⚠️ ALSO uploads once to a dedicated Discord storage channel (utils/discordCdnStorage.js,
// NAMEPLATE_CACHE_CHANNEL_ID, added 2026-08-10 12:08 EDT) and persists the resulting cdn.discordapp.com
// url in this Cloudinary resource's `context` metadata. This exists because a Components V2 media-
// gallery item referencing an EXTERNAL url (including this module's own Cloudinary url) gets proxied
// through Discord's images-ext-N.discordapp.net and RE-ENCODED to lossy before any client sees it --
// confirmed live, and confirmed NOT avoidable via a query-string hint (breaks the reference entirely)
// or by using GIF instead (also gets reprocessed, just less severely). Discord's OWN cdn.discordapp.com
// is never proxied this way, so `utils/colorPaletteView.js` prefers that url when present (a plain,
// fast, cacheable URL reference -- no per-render fetch+reattach needed at all) and only falls back to
// fetching+reattaching this module's Cloudinary bytes when the Discord CDN url isn't available yet.
//
// ⚠️ SPLIT INTO A "CORE" RENDER STEP + A CALLER-OWNED UPLOAD STEP (2026-08-15 10:31 EDT) so
// scripts/bulkCacheCollectibles.js can render every color variant of one design and post them together
// as ONE grouped Discord message ("keeping the cache channel tidy" -- Harkirat's request) instead of
// one message per SKU. `renderNameplateWebpCore` does fetch -> extract -> palette -> composite -> encode
// and returns raw materials; it touches neither Cloudinary nor Discord. `renderAndCacheNameplateWebp`
// (the live per-user path via resolveNameplateWebp) calls it and then does exactly what it always did --
// Cloudinary + Discord storage-channel upload IN PARALLEL, context patch, memoize -- so the single-SKU
// live path is byte-for-byte unchanged except for one addition: its context now also carries
// `render_source: 'fallback'` (this path renders a design that, by definition, wasn't in the bulk-cache
// catalog snapshot yet), which is how a future catalog refresh can find and reconcile it -- see
// attachNameplateDiscordCdnUrl below. `renderNameplateWebpForBulk` is the bulk script's hook: core +
// Cloudinary upload only, no storage-channel post, no context patch -- the caller collects several of
// these across one design's variants, uploads them together, then calls `attachNameplateDiscordCdnUrl`
// once per variant (with `render_source: 'catalog'` + the full catalog metadata) to patch each one's own
// Cloudinary context, same as the single-item path always did.
const cloudinary = require('./cloudinaryClient'); // timed proxy over the SDK -- see utils/cloudinaryClient.js
const { Jimp } = require('jimp');

if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- nameplate WebP caching will fail on every attempt.');
}

const { isCloudinaryWriteBlocked, IS_DEV } = require('./cloudinaryDevGuard');
const { catalogCacheKey, legacyCacheKey, filenameForPublicId, lookupCatalogEntry } = require('./collectibleCacheKey');
const { extractAlphaFrames, encodeWebpFromFrames, poolFramesIntoMontage } = require('./animatedMediaPipeline');
const { renderGradientBedFrame } = require('./nameplateBedImage');
const { uploadToStorageChannel } = require('./discordCdnStorage');
const { recordRenderTiming } = require('./eventStore'); // cold-render perf, folded into the event plane 2026-08-16 (was models/RenderTiming.js)
const {
    getColorPalette, composeNameplatePalette, paletteContextFields, readPaletteContext,
    PALETTE_COUNTS, NAMEPLATE_OVERASK
} = require('./colorExtract');

// Imported, never redeclared. colorPalette.js requires THIS module, so importing the count back from
// there would close a cycle -- which is why an earlier draft kept a local copy. colorExtract requires
// neither module, so it holds the single definition; see its comment for why three copies of one
// number was the wrong answer.
const PALETTE_COUNT = PALETTE_COUNTS.nameplate;

// The palette is a pure function of (art, bed), both fixed per (asset, palette) -- so it is computed
// ONCE PER DESIGN EVER and stored beside the render, rather than once per user on their UserPreference
// (Harkirat 2026-08-11 01:58 EDT). Extracted from the frames the render already holds, which also
// collapses the duplicate fetch + decode that utils/colorPalette.js was paying separately.
//
// ⚠️ EXTRACT FROM `rawFrames`, NEVER THE COMPOSITED SET. The render composites the bed onto every
// frame; extracting from those reintroduces exactly the bed contamination v3.6.0 removed, letting
// bed-tinted pixels crowd real art colours out of a 4-slot budget. The bed is prepended as a known
// exact value by composeNameplatePalette instead.
async function extractPaletteFromFrames(rawFrames, bedHex) {
    const montage = await poolFramesIntoMontage(rawFrames);
    const full = await getColorPalette(montage, bedHex != null ? PALETTE_COUNT + NAMEPLATE_OVERASK : PALETTE_COUNT);
    return composeNameplatePalette(full, bedHex, PALETTE_COUNT);
}

// Dev-scoped folder (2026-08-10 11:30 EDT) -- the dev bot shares prod's live Cloudinary account (see
// cloudinaryDevGuard.js's header), so writes here are isolated into their own `dev_` folder rather
// than ever touching the real `nameplate_webp` prod cache. Reads use the same FOLDER, so a dev render
// naturally never collides with, or gets confused for, a prod one -- each environment only ever sees
// its own namespace.
const FOLDER = IS_DEV ? 'dev_nameplate_webp' : 'nameplate_webp';
// Matches the source's own native rate (measured live on the webm era: 12fps -- kept unchanged across
// the apng pivot since the render cost is paid ONCE per (design, palette) ever, so there's no reason to
// trade smoothness for a cost that's already amortized to nothing after the first real view).
const FPS = 12;
// ONE definition, used by the render and the heal path AND folded into the palette cache key. These
// three values decide which pixels the extractor ever sees, so a change here changes every stored
// palette. Passing this to paletteContextFields/readPaletteContext is what makes that change invalidate
// them; see colorExtract.js's `extra` parameter for why the cache modules own this rather than the
// fingerprint reaching in for it.
// -f apng is REQUIRED (pivoted 2026-08-15 10:31 EDT from `.webm`/`-c:v libvpx-vp9` -- see this file's header) --
// without it ffmpeg silently reads an animated PNG as a single still frame.
const FRAME_OPTS = { inputExt: '.png', preInputArgs: ['-f', 'apng'], fps: FPS };

// SECURITY: never log a raw Cloudinary error object -- same leak shape as every other Cloudinary
// module here (the Admin API's rejected-promise carries the account's live API key+secret in
// `request_options.auth`). Sanitized in this file, isolated per-module like the rest.
function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}
function errorHttpCode(err) {
    return err?.http_code ?? err?.error?.http_code ?? null;
}

// Discord serves every nameplate under `nameplates/nameplates/<design>/` -- the repeated segment is
// THEIRS, and carrying it into our public id produced ids like
// `dev_nameplate_webp/nameplates-nameplates-twilight-cobalt`, where two thirds of the name is a
// constant. Shortened to `<design>-<palette>` 2026-08-11 17:34 EDT (Harkirat asked why it was so
// long, and the honest answer was that nothing had questioned it).
//
// ⚠️ THE PUBLIC ID IS THE CACHE KEY. Built by utils/collectibleCacheKey.js -- read its header before
// changing anything here; it documents the naming scheme, the uniqueness check it was verified
// against, and why the palette name is no longer part of the key.
//
// `catalog` ({ groupName, variantLabel } | null) is what decides which id space this is: catalogued
// designs get `<group-name>-<variant-label>`, anything else gets `legacy-<name-or-asset>`. The BULK
// path passes it straight from the CollectibleCatalog doc; the LIVE path resolves it by SKU inside
// resolveNameplateWebp. Both MUST end up with the same value for the same design or they stop
// sharing a cache -- that is the whole reason the construction lives in one shared module.
//
// ⚠️ DELIBERATELY does not vary by collection -- see attachNameplateDiscordCdnUrl's `assetFolder`
// param for WHERE the collection actually shows up. Folding it in here would mean a live user's equip
// computes a DIFFERENT public_id than the bulk run used, silently missing the cache and re-rendering
// from scratch. Cloudinary's `asset_folder` is a separate field from `public_id` specifically so the
// Media Library can be organized without touching the cache key.
function publicIdFor(nameplateAsset, catalog, nameplateName) {
    return catalog
        ? catalogCacheKey(FOLDER, catalog.groupName, catalog.variantLabel)
        : legacyCacheKey(FOLDER, nameplateName, nameplateAsset);
}

// Same in-memory memo pattern as utils/nameplateBedImage.js's bedCache/utils/resizedImage.js -- see
// utils/decorationWebpCache.js's matching comment for the measured 138-470ms-per-call cost this
// avoids on every view after the first, not just cold renders.
const resolvedCache = new Map();
const RESOLVED_CACHE_MAX = 128;
function memoizeResolved(publicId, resolved) {
    if (resolvedCache.size >= RESOLVED_CACHE_MAX) resolvedCache.delete(resolvedCache.keys().next().value);
    resolvedCache.set(publicId, resolved);
}

// Cache-only lookup, no render/upload -- mirrors cloudinaryCache.js's getCachedUrl. A 404 here is the
// expected, common "never rendered yet" case, not a real error. `context: true` pulls back the
// persisted Discord CDN url alongside the resource info -- one Admin API call covers both.
// Exported (2026-08-15 10:31 EDT) so scripts/bulkCacheCollectibles.js can skip a SKU that's already cached
// without going through the full resolve->render->single-message path. `renderSource` surfaces the
// context's `render_source` marker ('catalog'|'fallback'|undefined for a pre-existing resource that
// predates this field) so the bulk script can detect and heal a stale fallback entry.
async function getCachedNameplateWebp(nameplateAsset, catalog, nameplateName) {
    const publicId = publicIdFor(nameplateAsset, catalog, nameplateName);
    if (resolvedCache.has(publicId)) return resolvedCache.get(publicId);
    try {
        const result = await cloudinary.api.resource(publicId, {
            resource_type: 'image', context: true
        });
        // Deliberately NOT run through cloudinaryDeliveryUrl.js's withDeliveryDefaults() -- that
        // bakes in `f_auto,q_auto`, but f_auto performs format content-negotiation based on the
        // REQUESTING client's Accept header and could silently hand back a static image. Moot for the
        // discordCdnUrl case below (never touches Cloudinary delivery at all), but cloudinaryUrl is
        // still used as the fetch+reattach fallback, so it keeps this same carve-out.
        const resolved = {
            cloudinaryUrl: result.secure_url,
            discordCdnUrl: result.context?.custom?.discord_cdn_url || null,
            // May be null on a resource rendered BEFORE palette caching shipped -- resolveNameplateWebp
            // heals those rather than leaving them permanently palette-less, since the WebP itself is
            // already cached and would never re-render on its own.
            // Null both when no palette was ever stored AND when the stored one predates the current
            // extractor -- readPaletteContext checks the version marker. Both cases route through
            // healPalette below, which re-derives in place; see colorExtract.js's PALETTE_ALGO_VERSION.
            palette: readPaletteContext(result.context?.custom, FRAME_OPTS),
            renderSource: result.context?.custom?.render_source || null
        };
        memoizeResolved(publicId, resolved);
        return resolved;
    } catch (err) {
        if (errorHttpCode(err) !== 404) {
            console.error(`Nameplate WebP cache lookup failed for "${nameplateAsset}"/"${paletteName}": ${safeErrorMessage(err)}`);
        }
        return null;
    }
}

// CORE render step (2026-08-15 10:31 EDT): fetch the source APNG, extract alpha-correct frames, composite each
// onto the fade gradient bed, encode to WebP. Touches neither Cloudinary nor Discord -- both callers
// below (the single-item live path and the bulk grouped path) own their own upload strategy. Never
// throws -- returns null on any failure, same non-blocking philosophy as everything else in this
// pipeline; callers treat null exactly like "could not render this one."
async function renderNameplateWebpCore(apngUrl, nameplateAsset, paletteName, bedHex) {
    const renderStartedAt = Date.now();
    try {
        const res = await fetch(apngUrl);
        if (!res.ok) throw new Error(`Failed to download ${apngUrl}: HTTP ${res.status}`);
        const apngBuffer = Buffer.from(await res.arrayBuffer());

        const rawFrames = await extractAlphaFrames(apngBuffer, FRAME_OPTS);

        // Per-frame Jimp compositing is fully synchronous CPU work -- yielding between frames is the
        // same fix the k-means CPU-burst production incident needed (see
        // .claude/rules/accent-and-colors.md), so a cold render here can't block an unrelated
        // interaction's 3s ACK window the way the pre-fix color extraction once did.
        let palette = null;
        try {
            palette = await extractPaletteFromFrames(rawFrames, bedHex);
        } catch (err) {
            console.error(`Nameplate palette extraction failed for "${nameplateAsset}" (render continues): ${err.message}`);
        }

        const composited = [];
        for (const frame of rawFrames) {
            composited.push(await renderGradientBedFrame(frame, bedHex, 512));
            await new Promise(setImmediate);
        }

        const webpBuffer = await encodeWebpFromFrames(composited, { fps: FPS });
        const renderMs = Date.now() - renderStartedAt;
        // Instrumentation only -- a durable copy of the number the cache message below also shows,
        // since that message lives in a channel a dev cache purge can wipe. Inside an interaction
        // this folds into that interaction's deps; from the bulk-cache runner (no interaction in
        // scope) it becomes its own small background event. Replaced RenderTiming 2026-08-16.
        recordRenderTiming('webp_nameplate', renderMs, { area: 'webp_render', action: 'nameplate', cold: true });
        // Dimensions read back from the first composited frame -- cheap (one extra small decode),
        // and more honest than assuming the 512px cap always applied (a source narrower than 512
        // never gets upscaled, see renderGradientBedFrame's own targetWidth logic).
        const { width, height } = (await Jimp.read(composited[0])).bitmap;

        return { webpBuffer, palette, width, height, frameCount: composited.length, renderMs };
    } catch (err) {
        console.error(`Nameplate WebP render failed for "${nameplateAsset}"/"${paletteName}": ${safeErrorMessage(err)}`);
        return null;
    }
}

// Patches a rendered resource's Cloudinary context with its Discord storage-channel url, same ONE-CALL
// rule the single-item path always followed (`context` REPLACES the whole map, so palette,
// discord_cdn_url and everything in `extra` must travel in the same `api.update`). Exported (2026-08-15 10:31 EDT)
// for scripts/bulkCacheCollectibles.js, which uploads several variants' files in ONE grouped Discord
// message and then has to patch each variant's OWN Cloudinary resource individually afterward.
//
// `extra` carries the render-source marker + (for the bulk path) the catalog metadata: `render_source`
// ('catalog'|'fallback'), and when known, `sku_id`/`base_sku_id`/`collection`/`group_name`/
// `variant_label`/`variant_value`/`label`/`display_name`. Cloudinary context values are flat strings
// (`key=value|key=value` wire format, same as paletteContextFields' own encoding) -- undefined/null
// entries in `extra` are dropped rather than written as "undefined".
async function attachNameplateDiscordCdnUrl(publicId, palette, discordCdnUrl, extra = {}) {
    if (isCloudinaryWriteBlocked('update', publicId, { devNamespaceSafe: true })) return;
    const context = { ...paletteContextFields(palette, FRAME_OPTS) };
    if (discordCdnUrl) context.discord_cdn_url = discordCdnUrl;
    for (const [key, value] of Object.entries(extra)) {
        if (value !== undefined && value !== null && value !== '') context[key] = String(value);
    }
    if (!Object.keys(context).length) return;
    try {
        await cloudinary.api.update(publicId, { resource_type: 'image', context });
    } catch (err) {
        console.error(`Nameplate context-metadata patch failed for "${publicId}": ${safeErrorMessage(err)}`);
    }
}

// BULK hook (2026-08-15 10:31 EDT): core render + Cloudinary upload only -- no storage-channel post, no context
// patch. scripts/bulkCacheCollectibles.js calls this once per not-yet-cached variant of a design,
// collects the results across the whole design's variants, then posts them together as ONE grouped
// message and calls attachNameplateDiscordCdnUrl per variant afterward. Cloudinary caching happens
// immediately per-variant regardless (no reason to defer the part that doesn't need grouping).
//
// `assetFolder`: Cloudinary's `asset_folder` (Media Library organization ONLY -- see publicIdFor's
// comment on why this must never affect `public_id`, the actual cache key). The bulk script passes
// `${FOLDER}/<collection-slug>`; omitted here it falls back to the flat `FOLDER`, matching what the
// live path has always used.
async function renderNameplateWebpForBulk(apngUrl, nameplateAsset, paletteName, bedHex, assetFolder, catalog) {
    const publicId = publicIdFor(nameplateAsset, catalog);
    if (isCloudinaryWriteBlocked('upload', publicId, { devNamespaceSafe: true })) return null;
    const core = await renderNameplateWebpCore(apngUrl, nameplateAsset, paletteName, bedHex);
    if (!core) return null;
    try {
        const uploadResult = await cloudinary.uploader.upload(
            `data:image/webp;base64,${core.webpBuffer.toString('base64')}`,
            { public_id: publicId, asset_folder: assetFolder || FOLDER, overwrite: true, invalidate: true, resource_type: 'image' }
        );
        const filename = filenameForPublicId(publicId);
        return { ...core, publicId, filename, cloudinaryUrl: uploadResult.secure_url };
    } catch (err) {
        console.error(`Nameplate Cloudinary upload failed for "${nameplateAsset}"/"${paletteName}": ${safeErrorMessage(err)}`);
        return null;
    }
}

// Full cold-render path: core render + upload to Cloudinary AND (once) to the Discord storage channel,
// cache. Never throws -- callers treat a render failure exactly like "not cached yet", falling back to
// the existing static preview (see utils/colorPaletteView.js), same non-blocking philosophy as every
// other Cloudinary write path here. Unchanged in every observable way by the 2026-08-15 10:31 EDT core-extraction
// refactor above (still one message per SKU, on purpose) except one addition: its context now always
// carries `render_source: 'fallback'` and the message gets a small marker line -- this path renders
// designs that, by definition, are not (yet) in the bulk-cache catalog snapshot, so flagging them makes
// a later catalog refresh able to find and reconcile them (see attachNameplateDiscordCdnUrl above).
async function renderAndCacheNameplateWebp(apngUrl, nameplateAsset, paletteName, bedHex, skuId, nameplateName, catalog) {
    const publicId = publicIdFor(nameplateAsset, catalog, nameplateName);
    if (isCloudinaryWriteBlocked('upload', publicId, { devNamespaceSafe: true })) return null;

    const core = await renderNameplateWebpCore(apngUrl, nameplateAsset, paletteName, bedHex);
    if (!core) return null;
    const { webpBuffer, palette, width, height, frameCount, renderMs } = core;

    try {
        // Discord storage-channel upload and Cloudinary upload are INDEPENDENT of each other (neither
        // needs the other's result) -- run them in PARALLEL, not sequentially. Measured live
        // 2026-08-10 12:21 EDT: doing this in series (Discord upload, THEN a Cloudinary upload that
        // waited on it to attach context) visibly slowed down the cold-render path, since it's two
        // full network round-trips back-to-back instead of one. Cloudinary's own upload here carries
        // NO context yet; if the Discord upload succeeds, its url gets attached afterward via a
        // separate, lightweight `api.update()` metadata patch (no re-upload of the actual bytes) --
        // cheaper than making the Cloudinary upload itself wait on a second, unrelated network call.
        const bedHexStr = bedHex != null ? `#${bedHex.toString(16).padStart(6, '0')}` : 'none';
        const filename = filenameForPublicId(publicId);
        const heading = nameplateName || 'Nameplate';
        // Grouped by WHAT THE READER IS ASKING (Harkirat's polish request 2026-08-11 16:59 EDT: better
        // organised, still concise, no taller). Layout specified by Harkirat 2026-08-11 18:44 EDT, to
        // the character -- do not "tidy" it beyond the 2026-08-15 10:31 EDT fallback-marker addition below.
        const hexOf = c => `\`#${(c.hex >>> 0).toString(16).padStart(6, '0').toUpperCase()}\``;
        const swatches = palette ? palette.map(hexOf).join(' · ') : `\`${bedHexStr}\``;
        const metadataLines = [
            `### ${heading} — \`${width}×${height}px\` · \`${frameCount}f\` · \`${(webpBuffer.length / 1024).toFixed(1)}kB\``,
            `-# **Palette:** **\`${paletteName || 'none'}\` — ${swatches}**`,
            `-# **Asset:** \`${nameplateAsset}\``,
            `-# **Cloudinary:** \`/${publicId}\``,
            // Its OWN line since 2026-08-15 22:32 EDT (Harkirat) -- tacked onto the end of the
            // Cloudinary line above, the sku read as part of the url rather than as a separate id.
            skuId ? `-# **SKU:** \`${skuId}\`` : null,
            `-# Rendered <t:${Math.floor(Date.now() / 1000)}:R> in \`${renderMs}ms\``,
            // 2026-08-15 10:31 EDT: this path only ever renders a design NOT (yet) in the bulk-cache catalog --
            // see this file's header. Flags it so a future catalog refresh can find + reconcile it.
            `-# ⚠️ Fallback render — not in the catalog snapshot yet`
        ].filter(Boolean); // `skuId` above is conditional -- drop it rather than emit a blank line
        const components = [
            {
                type: 17, // Container
                // 🔄 THE BED COLOUR -- Harkirat 2026-08-11 16:59 EDT, deliberately REVERSING his own
                // 2026-08-10 14:08 EDT call for "the first ART colour, NOT bedHex". Do not "restore"
                // the art colour on the strength of that older comment; this is the newer decision and
                // it matches what the design reads as at a glance, since the bed is the whole
                // background of the rendered nameplate.
                // ⚠️ Falls back to the first ART colour when a `none`-palette design has no bed at all
                // (its background is baked into the art), rather than leaving the container unstyled.
                accent_color: bedHex ?? palette?.[0]?.hex ?? undefined,
                components: [
                    { type: 12, items: [{ media: { url: `attachment://${filename}` } }] },
                    { type: 10, content: metadataLines.join('\n') }
                ]
            }
        ];
        const [discordCdnUrl, uploadResult] = await Promise.all([
            uploadToStorageChannel(
                process.env.NAMEPLATE_CACHE_CHANNEL_ID,
                filename,
                webpBuffer,
                'image/webp',
                components
            ),
            cloudinary.uploader.upload(
                `data:image/webp;base64,${webpBuffer.toString('base64')}`,
                // This path only ever renders a design NOT (yet) in the bulk-cache catalog -- see this
                // file's header -- so it organizes into a dedicated Media Library subfolder rather than
                // the flat root, matching the bulk path's per-collection organization for the same
                // reason. Never affects `public_id`, the cache key -- see publicIdFor's comment.
                { public_id: publicId, asset_folder: `${FOLDER}/_uncataloged`, overwrite: true, invalidate: true, resource_type: 'image' }
            )
        ]);
        // AWAITED, not fire-and-forget -- a fire-and-forget version of this patch was tested live
        // 2026-08-10 13:07 EDT and lost the write silently under node --watch (a file-edit restart
        // kills in-flight promises with no error surfaced anywhere), and the same class of risk exists
        // in any environment if the process restarts/crashes between the parallel uploads above and
        // this patch completing. The render function must not report success until discordCdnUrl is
        // actually persisted and readable by a future cache hit -- otherwise every render after the
        // first permanently falls back to the slower fetch+reattach path with no way to self-heal.
        await attachNameplateDiscordCdnUrl(publicId, palette, discordCdnUrl, { render_source: 'fallback' });
        const resolved = { cloudinaryUrl: uploadResult.secure_url, discordCdnUrl, palette };
        memoizeResolved(publicId, resolved);
        return resolved;
    } catch (err) {
        console.error(`Nameplate WebP render/upload failed for "${nameplateAsset}"/"${paletteName}": ${safeErrorMessage(err)}`);
        return null;
    }
}

// Single entry point utils/colorPalette.js calls. Returns null (never throws) whenever the animated
// WebP isn't available for any reason -- no recognized bed color (nothing to build a bed from, same
// "never fabricate a color" rule nameplateBedImage.js already follows), cache miss + render failure,
// or a blocked dev-bot write. Otherwise returns { cloudinaryUrl, discordCdnUrl } -- discordCdnUrl may
// be null even on success (storage channel not configured, or that one upload failed) and callers
// must handle that, falling back to the existing static preview only when BOTH are unavailable.
async function resolveNameplateWebp({ nameplateAsset, paletteName, apngUrl, bedHex, skuId, nameplateName }) {
    if (!nameplateAsset || !apngUrl || bedHex == null) return null;

    // Resolved ONCE here and threaded down, so every step below (cache lookup, render, heal) computes
    // the identical public id. This is the live path's only route to the group/variant pair the
    // catalogued id is built from -- without it a live equip would compute a `legacy-` id, miss the
    // bulk-cached render entirely and re-render from scratch. Memoized per sku inside.
    const catalog = await lookupCatalogEntry(skuId);

    const cached = await getCachedNameplateWebp(nameplateAsset, catalog, nameplateName);
    if (cached) return cached.palette ? cached : healPalette(cached, nameplateAsset, catalog, nameplateName, apngUrl, bedHex);

    return renderAndCacheNameplateWebp(apngUrl, nameplateAsset, paletteName, bedHex, skuId, nameplateName, catalog);
}

// A WebP rendered BEFORE palette caching shipped has no palette in its context, and since the render
// is cached forever it would never re-run to acquire one -- so that design would fall back to per-user
// extraction indefinitely, which is the cost this cache exists to remove. This backfills it: re-fetch
// the source, extract, patch the context. Paid ONCE per pre-existing design, never again.
//
// ⚠️ Does NOT re-render or re-upload the WebP -- only the metadata is patched, so the existing
// cdn.discordapp.com url and the cache-channel message are untouched. That does mean an older cache
// message keeps its pre-existing accent and carries no Colors line; backfilling those would mean
// editing history in the storage channel, which is deliberately out of scope.
//
// Returns the cached object unchanged on any failure -- a heal that cannot complete must degrade to
// today's behaviour, never break a working preview.
async function healPalette(cached, nameplateAsset, catalog, nameplateName, apngUrl, bedHex) {
    const publicId = publicIdFor(nameplateAsset, catalog, nameplateName);
    if (isCloudinaryWriteBlocked('update', publicId, { devNamespaceSafe: true })) return cached;
    try {
        const res = await fetch(apngUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${apngUrl}`);
        const rawFrames = await extractAlphaFrames(Buffer.from(await res.arrayBuffer()), FRAME_OPTS);
        const palette = await extractPaletteFromFrames(rawFrames, bedHex);
        const context = { ...paletteContextFields(palette, FRAME_OPTS) };
        if (!context.palette) return cached;
        // Re-send discord_cdn_url alongside it -- `context` replaces the whole map, so patching the
        // palette alone would wipe the url this module works hard to persist.
        if (cached.discordCdnUrl) context.discord_cdn_url = cached.discordCdnUrl;
        await cloudinary.api.update(publicId, { resource_type: 'image', context });
        const resolved = { ...cached, palette };
        memoizeResolved(publicId, resolved);
        return resolved;
    } catch (err) {
        console.error(`Nameplate palette backfill failed for "${publicId}": ${safeErrorMessage(err)}`);
        return cached;
    }
}

module.exports = {
    resolveNameplateWebp, publicIdFor, FOLDER,
    getCachedNameplateWebp, renderNameplateWebpForBulk, attachNameplateDiscordCdnUrl
};
