// utils/nameplateWebpCache.js -- persistent Cloudinary cache for the animated nameplate WebP preview
// in View Colors' Nameplate page. Originally a GIF cache (2026-08-10 09:00 EDT, design spec
// docs/superpowers/specs/2026-08-09-nameplate-decoration-animated-gif-caching-design.md), pivoted the
// same day (2026-08-10 11:01 EDT) to WebP once a live Discord test confirmed the client autoplays
// animated WebP inline exactly like GIF. WebP's real alpha means the fade gradient bed
// (utils/nameplateBedImage.js's renderGradientBedFrame) is used as-is -- no more GIF-era "solid
// opaque card" compromise (GIF's binary alpha genuinely couldn't hold the fade; WebP can).
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
// deterministic per (asset, palette) -- the source webm and the bed color are both fixed inputs.
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
const cloudinary = require('cloudinary').v2;
const { Jimp } = require('jimp');

if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- nameplate WebP caching will fail on every attempt.');
}

const { isCloudinaryWriteBlocked, IS_DEV } = require('./cloudinaryDevGuard');
const { slugify } = require('./cloudinaryCache');
const { extractAlphaFrames, encodeWebpFromFrames, poolFramesIntoMontage } = require('./animatedMediaPipeline');
const { renderGradientBedFrame } = require('./nameplateBedImage');
const { uploadToStorageChannel } = require('./discordCdnStorage');
const {
    getColorPalette, composeNameplatePalette, serializePalette, deserializePalette
} = require('./colorExtract');

// How many swatches a nameplate carries, and how far the extractor over-asks before the bed's
// near-duplicates are dropped. Mirrors utils/colorPalette.js's PALETTE_COUNTS.nameplate -- kept as a
// local constant rather than imported because colorPalette.js requires THIS module, and importing
// back would close the cycle.
const PALETTE_COUNT = 4;
const PALETTE_OVERASK = 2;

// The palette is a pure function of (art, bed), both fixed per (asset, palette) -- so it is computed
// ONCE PER DESIGN EVER and stored beside the render, rather than once per user on their UserPreference
// (Harkirat 2026-08-11 01:58 EDT). Extracted from the frames the render already holds, which also
// collapses the duplicate webm fetch + decode that utils/colorPalette.js was paying separately.
//
// ⚠️ EXTRACT FROM `rawFrames`, NEVER THE COMPOSITED SET. The render composites the bed onto every
// frame; extracting from those reintroduces exactly the bed contamination v3.6.0 removed, letting
// bed-tinted pixels crowd real art colours out of a 4-slot budget. The bed is prepended as a known
// exact value by composeNameplatePalette instead.
async function extractPaletteFromFrames(rawFrames, bedHex) {
    const montage = await poolFramesIntoMontage(rawFrames);
    const full = await getColorPalette(montage, bedHex != null ? PALETTE_COUNT + PALETTE_OVERASK : PALETTE_COUNT);
    return composeNameplatePalette(full, bedHex, PALETTE_COUNT);
}

// Dev-scoped folder (2026-08-10 11:30 EDT) -- the dev bot shares prod's live Cloudinary account (see
// cloudinaryDevGuard.js's header), so writes here are isolated into their own `dev_` folder rather
// than ever touching the real `nameplate_webp` prod cache. Reads use the same FOLDER, so a dev render
// naturally never collides with, or gets confused for, a prod one -- each environment only ever sees
// its own namespace.
const FOLDER = IS_DEV ? 'dev_nameplate_webp' : 'nameplate_webp';
// Matches the source webm's own native rate (measured live: 12fps, 43 frames over ~3.6s) -- Harkirat's
// call after the original design's cost/quality tradeoff: the render cost is paid ONCE per (design,
// palette) ever, so there's no reason to trade smoothness for a cost that's already amortized to
// nothing after the first real view.
const FPS = 12;

// SECURITY: never log a raw Cloudinary error object -- same leak shape as every other Cloudinary
// module here (the Admin API's rejected-promise carries the account's live API key+secret in
// `request_options.auth`). Sanitized in this file, isolated per-module like the rest.
function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}
function errorHttpCode(err) {
    return err?.http_code ?? err?.error?.http_code ?? null;
}

function publicIdFor(nameplateAsset, paletteName) {
    return `${FOLDER}/${slugify(nameplateAsset)}-${slugify(paletteName || 'none')}`;
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
async function getCachedNameplateWebp(nameplateAsset, paletteName) {
    const publicId = publicIdFor(nameplateAsset, paletteName);
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
            palette: deserializePalette(result.context?.custom?.palette)
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

// Full cold-render path: fetch the source webm, extract alpha-correct frames, composite each onto the
// fade gradient bed, encode to WebP, upload to Cloudinary AND (once) to the Discord storage channel,
// cache. Never throws -- callers treat a render failure exactly like "not cached yet", falling back to
// the existing static preview (see utils/colorPaletteView.js), same non-blocking philosophy as every
// other Cloudinary write path here.
async function renderAndCacheNameplateWebp(webmUrl, nameplateAsset, paletteName, bedHex, skuId, nameplateName) {
    const publicId = publicIdFor(nameplateAsset, paletteName);
    if (isCloudinaryWriteBlocked('upload', publicId, { devNamespaceSafe: true })) return null;
    const renderStartedAt = Date.now();

    try {
        const res = await fetch(webmUrl);
        if (!res.ok) throw new Error(`Failed to download ${webmUrl}: HTTP ${res.status}`);
        const webmBuffer = Buffer.from(await res.arrayBuffer());

        // -c:v libvpx-vp9 forces the decoder that actually surfaces the WebM alpha side-data block --
        // see animatedMediaPipeline.js's own comment for the measured default-decoder bug this works
        // around.
        const rawFrames = await extractAlphaFrames(webmBuffer, {
            inputExt: '.webm',
            preInputArgs: ['-c:v', 'libvpx-vp9'],
            fps: FPS
        });

        // Per-frame Jimp compositing is fully synchronous CPU work -- yielding between frames is the
        // same fix the k-means CPU-burst production incident needed (see
        // .claude/rules/accent-and-colors.md), so a cold render here can't block an unrelated
        // interaction's 3s ACK window the way the pre-fix color extraction once did.
        // Palette FIRST, from the raw art frames, before anything composites a bed onto them. Doing it
        // here rather than in utils/colorPalette.js also removes a circularity: the storage-channel
        // message's accent used to be passed IN from a palette extracted separately upstream, so the
        // render depended on an extraction that depended on the same frames the render had in hand.
        // A failure must not sink the WebP -- the render is the primary product and the panel falls
        // back to its own extraction when no palette comes back.
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
        // Dimensions read back from the first composited frame -- cheap (one extra small decode),
        // and more honest than assuming the 512px cap always applied (a source narrower than 512
        // never gets upscaled, see renderGradientBedFrame's own targetWidth logic).
        const { width, height } = (await Jimp.read(composited[0])).bitmap;

        // Discord storage-channel upload and Cloudinary upload are INDEPENDENT of each other (neither
        // needs the other's result) -- run them in PARALLEL, not sequentially. Measured live
        // 2026-08-10 12:21 EDT: doing this in series (Discord upload, THEN a Cloudinary upload that
        // waited on it to attach context) visibly slowed down the cold-render path, since it's two
        // full network round-trips back-to-back instead of one. Cloudinary's own upload here carries
        // NO context yet; if the Discord upload succeeds, its url gets attached afterward via a
        // separate, lightweight `api.update()` metadata patch (no re-upload of the actual bytes) --
        // cheaper than making the Cloudinary upload itself wait on a second, unrelated network call.
        const bedHexStr = bedHex != null ? `#${bedHex.toString(16).padStart(6, '0')}` : 'none';
        const filename = `${slugify(nameplateAsset)}-${slugify(paletteName || 'none')}.webp`;
        const heading = nameplateName || 'Nameplate';
        const metadataLines = [
            `**Asset:** \`${nameplateAsset}\``,
            skuId ? `**SKU:** \`${skuId}\`` : null,
            `**Palette:** \`${paletteName || 'none'}\` · **Bed:** \`${bedHexStr}\``,
            `**Cloudinary:** \`${publicId}\``,
            `**Dimensions:** ${width}×${height} · **Frames:** ${composited.length} · **Size:** ${(webpBuffer.length / 1024).toFixed(1)} KB`,
            // The four extracted hexes, in the panel's own order (bed first, then the three art
            // colours) -- Harkirat's explicit ask 2026-08-11 09:20 EDT, so the cache channel records
            // what the design's palette actually resolved to, not just that a render happened.
            palette ? `**Colors:** ${palette.map(c => `\`#${(c.hex >>> 0).toString(16).padStart(6, '0').toUpperCase()}\``).join(' ')}` : null,
            `-# Rendered <t:${Math.floor(Date.now() / 1000)}:R> · took ${renderMs}ms`
        ].filter(Boolean);
        const components = [
            {
                type: 17, // Container
                // The first ART colour, NOT bedHex -- Harkirat's explicit request 2026-08-10 14:08 EDT.
                // bedHex keeps doing its real job just above (renderGradientBedFrame's gradient bed);
                // this is purely which color styles the cache MESSAGE.
                // ⚠️ It used to read `palette[0]`, which SILENTLY BECAME THE BED when v3.6.0 changed the
                // composition to prepend the bed at index 0 -- the line kept its "NOT bedHex" comment
                // while doing exactly that. With a bed present the first art colour is index 1; with a
                // `none` palette nothing is prepended and index 0 is already art.
                accent_color: (bedHex != null ? palette?.[1]?.hex : palette?.[0]?.hex) ?? undefined,
                components: [
                    { type: 12, items: [{ media: { url: `attachment://${filename}` } }] },
                    { type: 10, content: `### ${heading}` },
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
                { public_id: publicId, asset_folder: FOLDER, overwrite: true, invalidate: true, resource_type: 'image' }
            )
        ]);
        // AWAITED, not fire-and-forget -- a fire-and-forget version of this patch was tested live
        // 2026-08-10 13:07 EDT and lost the write silently under node --watch (a file-edit restart
        // kills in-flight promises with no error surfaced anywhere), and the same class of risk exists
        // in any environment if the process restarts/crashes between the parallel uploads above and
        // this patch completing. The render function must not report success until discordCdnUrl is
        // actually persisted and readable by a future cache hit -- otherwise every render after the
        // first permanently falls back to the slower fetch+reattach path with no way to self-heal.
        // ONE patch carrying both keys. Cloudinary's `context` replaces the whole map, so sending them
        // in two calls would have the second silently erase the first.
        const serialized = serializePalette(palette);
        const context = {};
        if (discordCdnUrl) context.discord_cdn_url = discordCdnUrl;
        if (serialized) context.palette = serialized;
        if (Object.keys(context).length) {
            try {
                await cloudinary.api.update(publicId, { resource_type: 'image', context });
            } catch (err) {
                console.error(`Nameplate context-metadata patch failed for "${publicId}": ${safeErrorMessage(err)}`);
            }
        }
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
async function resolveNameplateWebp({ nameplateAsset, paletteName, webmUrl, bedHex, skuId, nameplateName }) {
    if (!nameplateAsset || !webmUrl || bedHex == null) return null;

    const cached = await getCachedNameplateWebp(nameplateAsset, paletteName);
    if (cached) return cached.palette ? cached : healPalette(cached, nameplateAsset, paletteName, webmUrl, bedHex);

    return renderAndCacheNameplateWebp(webmUrl, nameplateAsset, paletteName, bedHex, skuId, nameplateName);
}

// A WebP rendered BEFORE palette caching shipped has no palette in its context, and since the render
// is cached forever it would never re-run to acquire one -- so that design would fall back to per-user
// extraction indefinitely, which is the cost this cache exists to remove. This backfills it: re-fetch
// the webm, extract, patch the context. Paid ONCE per pre-existing design, never again.
//
// ⚠️ Does NOT re-render or re-upload the WebP -- only the metadata is patched, so the existing
// cdn.discordapp.com url and the cache-channel message are untouched. That does mean an older cache
// message keeps its pre-existing accent and carries no Colors line; backfilling those would mean
// editing history in the storage channel, which is deliberately out of scope.
//
// Returns the cached object unchanged on any failure -- a heal that cannot complete must degrade to
// today's behaviour, never break a working preview.
async function healPalette(cached, nameplateAsset, paletteName, webmUrl, bedHex) {
    const publicId = publicIdFor(nameplateAsset, paletteName);
    if (isCloudinaryWriteBlocked('update', publicId, { devNamespaceSafe: true })) return cached;
    try {
        const res = await fetch(webmUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${webmUrl}`);
        const rawFrames = await extractAlphaFrames(Buffer.from(await res.arrayBuffer()), {
            inputExt: '.webm', preInputArgs: ['-c:v', 'libvpx-vp9'], fps: FPS
        });
        const palette = await extractPaletteFromFrames(rawFrames, bedHex);
        const serialized = serializePalette(palette);
        if (!serialized) return cached;
        // Re-send discord_cdn_url alongside it -- `context` replaces the whole map, so patching the
        // palette alone would wipe the url this module works hard to persist.
        const context = { palette: serialized };
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

module.exports = { resolveNameplateWebp, publicIdFor, FOLDER };
