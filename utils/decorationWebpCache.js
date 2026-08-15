// utils/decorationWebpCache.js -- persistent Cloudinary cache for the animated decoration WebP
// preview in View Colors' Deco page. Originally a GIF cache with Bayer alpha-dithering (2026-08-10
// 09:00 EDT, design spec docs/superpowers/specs/2026-08-09-nameplate-decoration-animated-gif-caching-
// design.md), pivoted the same day (2026-08-10 11:01 EDT) to WebP once a live Discord test (desktop +
// mobile) confirmed the client autoplays animated WebP inline exactly like GIF.
//
// WebP holds real 8-bit alpha, so the entire dithering step this module used to need (GIF's binary
// alpha can't hold a soft glow at all -- see the old ditherAlphaBayer's comment for the halftone
// workaround this replaces) is simply GONE. Frames go from ffmpeg's alpha-correct extraction straight
// to the WebP encoder with zero lossy compromise anywhere in THIS pipeline -- confirmed pixel-perfect
// as far as Cloudinary: a real Cloudinary-hosted round-trip of this exact output was fetched back and
// `cmp`'d byte-identical to the pre-upload file (2026-08-10 11:12 EDT).
//
// ⚠️ That losslessness does NOT reach the end user if the caller references this url directly --
// confirmed live 2026-08-10 11:38 EDT via a real /colors render's actual DOM (`<img src>`, not just the
// copyable `<a href>`): Discord serves an externally-referenced Components V2 media-gallery url from
// its OWN images-ext-N.discordapp.net proxy, which RE-ENCODES the image to lossy server-side (2.2MB vs
// the 898KB lossless upload, confirmed via a direct fetch of that proxy URL and via Harkirat's saved
// file matching it exactly) before any client ever sees it -- this happens for ANY externally-hosted
// image a Components V2 Media Gallery item references, not something specific to Cloudinary or this
// cache. Also confirmed NOT avoidable via a query-string hint (breaks the reference entirely -- Discord
// mis-parses the appended query string as a literal path segment) or by using GIF instead of WebP (an
// external GIF reference also gets reprocessed, 564KB vs its 607KB original, just less severely).
//
// ✅ RESOLVED 2026-08-10 12:08 EDT: also uploads once to a dedicated Discord storage channel
// (utils/discordCdnStorage.js, DECORATION_CACHE_CHANNEL_ID -- Harkirat's own "dioreoland" server, bot
// invited there with real channel permissions, a genuine exception to this bot's usual zero-standing-
// permissions rule) and persists the resulting cdn.discordapp.com url in this Cloudinary resource's
// `context` metadata. Discord's OWN CDN is never proxied this way, so `utils/colorPaletteView.js`
// prefers that url when present -- a plain, fast, cacheable URL reference, no per-render fetch+
// reattach needed at all -- and only falls back to fetching+reattaching this module's Cloudinary bytes
// when the Discord CDN url isn't available yet (channel not configured, or that one upload failed).
//
// ⚠️ SPLIT INTO A "CORE" RENDER STEP + A CALLER-OWNED UPLOAD STEP (2026-08-15 10:31 EDT), mirroring the
// identical restructure in utils/nameplateWebpCache.js (see that file's header for the full reasoning)
// so scripts/bulkCacheCollectibles.js can render every variant of one design and post them together as
// ONE grouped Discord message. `renderDecorationWebpCore` does fetch -> extract -> resize-if-needed ->
// palette -> encode and touches neither Cloudinary nor Discord. `renderAndCacheDecorationWebp` (the
// live per-user path via resolveDecorationWebp) calls it and does exactly what it always did --
// Cloudinary + Discord storage-channel upload, context patch, memoize -- unchanged except its context
// now also carries `render_source: 'fallback'` (this path renders a design not yet in the bulk-cache
// catalog snapshot). `renderDecorationWebpForBulk` is the bulk script's hook: core + Cloudinary upload
// only, no storage-channel post, no context patch.
const cloudinary = require('cloudinary').v2;

if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- decoration WebP caching will fail on every attempt.');
}

const { Jimp } = require('jimp');
const { isCloudinaryWriteBlocked, IS_DEV } = require('./cloudinaryDevGuard');
const { slugify } = require('./cloudinaryCache');
const { extractAlphaFrames, encodeWebpFromFrames, poolFramesIntoMontage, readImageSize } = require('./animatedMediaPipeline');
const { uploadToStorageChannel } = require('./discordCdnStorage');
const { logRenderTiming } = require('./renderTiming'); // cold-render perf instrumentation, see models/RenderTiming.js
const { getColorPalette, paletteContextFields, readPaletteContext, PALETTE_COUNTS } = require('./colorExtract');

// Imported, never redeclared -- see utils/colorExtract.js's comment on why the counts live there
// rather than in colorPalette.js (which requires this module, so importing back would close a cycle).
const PALETTE_COUNT = PALETTE_COUNTS.decoration;

// A decoration's palette is a pure function of its asset, so it is computed ONCE PER DESIGN EVER and
// stored beside the render instead of once per user (Harkirat 2026-08-11 01:58 EDT). No bed and no
// compositing here, so the raw frames ARE the art -- unlike nameplate, nothing has to be prepended.
//
// ⚠️ This changes WHICH frames a decoration palette is extracted from. utils/colorPalette.js sampled
// via stillFrame.js's ffmpeg `tile` filter; this pools the alpha-correct frames the render already
// decoded (`-c:v libvpx-vp9`-equivalent handling for APNG), so a translucent glow is no longer read
// against whatever the tile filter's backdrop happened to be. Strictly better, but it means a
// decoration palette computed after this change can differ from one cached before it -- which is
// exactly why getCachedPalette prefers THIS value over a stale per-user one.
async function extractPaletteFromFrames(rawFrames) {
    const montage = await poolFramesIntoMontage(rawFrames);
    return getColorPalette(montage, PALETTE_COUNT);
}

// Dev-scoped folder (2026-08-10 11:30 EDT) -- see utils/nameplateWebpCache.js's matching comment;
// same reasoning, same pattern, isolated so a dev render never touches the real `decoration_webp`
// prod cache.
const FOLDER = IS_DEV ? 'dev_decoration_webp' : 'decoration_webp';
// Decorations have no single documented native frame rate (a real equipped decoration was measured
// at 60 frames in utils/stillFrame.js's montage comment, with no stated fps) -- 12fps matches the
// fixed rate nameplate settled on, for the same reason: the render cost is paid once per design and
// cached forever, so there's no pressure to chase a lower rate for speed.
const FPS = 12;
// ONE definition, used by the render and the heal path AND folded into the palette cache key -- see
// utils/nameplateWebpCache.js's matching comment. `-f apng` is the load-bearing flag here: without it
// ffmpeg silently reads an animated PNG as a single still frame, which is the exact silent-single-frame
// trap animatedMediaPipeline.js's header documents. A change to any of these three changes every
// stored decoration palette, which is why they are part of its key.
const FRAME_OPTS = { inputExt: '.png', preInputArgs: ['-f', 'apng'], fps: FPS };
// Cap the rendered width the same way utils/resizedImage.js caps the nameplate/avatar previews --
// decorations are typically already small (avatar-decoration scale, confirmed 288x288 on a real
// equipped decoration -- comfortably under this cap already), so this is a ceiling, not a forced
// upscale or a binding constraint in the common case.
const MAX_WIDTH = 512;

function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}
function errorHttpCode(err) {
    return err?.http_code ?? err?.error?.http_code ?? null;
}

function publicIdFor(decorationAsset) {
    return `${FOLDER}/${slugify(decorationAsset)}`;
}

// Same in-memory memo pattern as utils/nameplateBedImage.js's bedCache/utils/resizedImage.js -- a
// resolved { cloudinaryUrl, discordCdnUrl } pair for a given decoration is deterministic and (per
// this whole cache's render-once-forever design) essentially never changes, but a fresh Cloudinary
// Admin API `resource()` lookup was measured live 2026-08-10 13:48 EDT at 138-470ms PER CALL -- a
// real, avoidable cost on every single page view, including cache hits, since that's what "does a
// cached WebP already exist" checks against. This memo makes every view after the FIRST one this
// process has seen for a given asset+palette combo instant, with zero network call at all.
const resolvedCache = new Map();
const RESOLVED_CACHE_MAX = 128;
function memoizeResolved(publicId, resolved) {
    if (resolvedCache.size >= RESOLVED_CACHE_MAX) resolvedCache.delete(resolvedCache.keys().next().value);
    resolvedCache.set(publicId, resolved);
}

// Exported (2026-08-15 10:31 EDT) so scripts/bulkCacheCollectibles.js can skip a SKU that's already
// cached without paying for a full resolve. `renderSource` surfaces the context's `render_source`
// marker ('catalog'|'fallback'|undefined for a pre-existing resource that predates this field).
async function getCachedDecorationWebp(decorationAsset) {
    const publicId = publicIdFor(decorationAsset);
    if (resolvedCache.has(publicId)) return resolvedCache.get(publicId);
    try {
        const result = await cloudinary.api.resource(publicId, {
            resource_type: 'image', context: true
        });
        const resolved = {
            cloudinaryUrl: result.secure_url,
            discordCdnUrl: result.context?.custom?.discord_cdn_url || null,
            // Null on a resource rendered BEFORE palette caching shipped -- resolveDecorationWebp
            // backfills those, since the WebP is already cached and would never re-render to get one.
            // Null both when no palette was ever stored AND when the stored one predates the current
            // extractor -- readPaletteContext checks the version marker, and both cases route through
            // healPalette below. See colorExtract.js's PALETTE_ALGO_VERSION for the invalidation rule.
            palette: readPaletteContext(result.context?.custom, FRAME_OPTS),
            renderSource: result.context?.custom?.render_source || null
        };
        memoizeResolved(publicId, resolved);
        return resolved;
    } catch (err) {
        if (errorHttpCode(err) !== 404) {
            console.error(`Decoration WebP cache lookup failed for "${decorationAsset}": ${safeErrorMessage(err)}`);
        }
        return null;
    }
}

// CORE render step (2026-08-15 10:31 EDT): fetch, extract, resize-if-needed, palette, encode. Touches
// neither Cloudinary nor Discord -- see this file's header for why this is split out and who calls it.
async function renderDecorationWebpCore(decorationUrl, decorationAsset) {
    const renderStartedAt = Date.now();
    // Set once the frames are extracted in `asPaths` mode, where this function owns the temp dir. It
    // hangs on the function's own try/finally rather than a nested one so the happy path, the error
    // path and the palette-failure path all release it without a second block to keep in sync.
    let releaseFrames = null;

    try {
        const res = await fetch(decorationUrl);
        if (!res.ok) throw new Error(`Failed to download ${decorationUrl}: HTTP ${res.status}`);
        const sourceBuffer = Buffer.from(await res.arrayBuffer());

        // -f apng is REQUIRED (see utils/stillFrame.js's extractFrameMontage comment) -- without it
        // ffmpeg silently reads an animated PNG as a single still frame and this would produce a
        // 1-frame "animated" WebP with no error anywhere to catch it.
        const extracted = await extractAlphaFrames(sourceBuffer, { ...FRAME_OPTS, asPaths: true });
        releaseFrames = extracted.cleanup;
        const rawFrames = extracted.paths;

        // No bed/compositing step (decorations stay genuinely transparent) and no dithering pass.
        // Dimensions checked from ONE frame only, then resize the WHOLE set only if actually needed --
        // measured live 2026-08-10 13:50 EDT that decorating every frame through Jimp regardless
        // (decode PNG -> maybe resize -> re-encode PNG) cost 736ms even when the source (288x288, the
        // real measured decoration scale) never once exceeded MAX_WIDTH and every "resize" was a
        // no-op -- more than double the actual WebP-encode step, for zero pixel change. ffmpeg's raw
        // extracted frames are already valid PNG buffers img2webp can consume directly, so skip Jimp
        // entirely in the (common) no-resize-needed case.
        const { width: srcWidth, height: srcHeight } = await readImageSize(rawFrames[0]);
        let width = srcWidth, height = srcHeight, frames;
        if (srcWidth > MAX_WIDTH) {
            height = Math.max(1, Math.round(MAX_WIDTH * srcHeight / srcWidth));
            width = MAX_WIDTH;
            frames = [];
            for (const framePath of rawFrames) {
                const img = await Jimp.read(framePath);
                img.resize({ w: width, h: height });
                frames.push(await img.getBuffer('image/png'));
                await new Promise(setImmediate);
            }
        } else {
            frames = rawFrames;
        }
        let palette = null;
        try {
            palette = await extractPaletteFromFrames(rawFrames);
        } catch (err) {
            console.error(`Decoration palette extraction failed for "${decorationAsset}" (render continues): ${err.message}`);
        }

        const webpBuffer = await encodeWebpFromFrames(frames, { fps: FPS });
        const renderMs = Date.now() - renderStartedAt;
        logRenderTiming({ area: 'webp_render', action: 'decoration', cold: true, durationMs: renderMs });

        return { webpBuffer, palette, width, height, frameCount: frames.length, renderMs };
    } catch (err) {
        console.error(`Decoration WebP render failed for "${decorationAsset}": ${safeErrorMessage(err)}`);
        return null;
    } finally {
        if (releaseFrames) await releaseFrames();
    }
}

// Patches a rendered resource's Cloudinary context -- mirrors utils/nameplateWebpCache.js's
// attachNameplateDiscordCdnUrl exactly (same ONE-CALL rule, same `extra` shape for the render-source
// marker + catalog metadata). Exported (2026-08-15 10:31 EDT) for scripts/bulkCacheCollectibles.js.
async function attachDecorationDiscordCdnUrl(publicId, palette, discordCdnUrl, extra = {}) {
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
        console.error(`Decoration context-metadata patch failed for "${publicId}": ${safeErrorMessage(err)}`);
    }
}

// BULK hook (2026-08-15 10:31 EDT): core render + Cloudinary upload only -- see
// utils/nameplateWebpCache.js's renderNameplateWebpForBulk for the full reasoning, identical shape here.
// `assetFolder`: Cloudinary's `asset_folder` (Media Library organization only -- never affects
// `public_id`, the actual cache key, for the same reason documented on the nameplate side).
async function renderDecorationWebpForBulk(decorationUrl, decorationAsset, assetFolder) {
    const publicId = publicIdFor(decorationAsset);
    if (isCloudinaryWriteBlocked('upload', publicId, { devNamespaceSafe: true })) return null;
    const core = await renderDecorationWebpCore(decorationUrl, decorationAsset);
    if (!core) return null;
    try {
        const uploadResult = await cloudinary.uploader.upload(
            `data:image/webp;base64,${core.webpBuffer.toString('base64')}`,
            { public_id: publicId, asset_folder: assetFolder || FOLDER, overwrite: true, invalidate: true, resource_type: 'image' }
        );
        const filename = `${slugify(decorationAsset)}.webp`;
        return { ...core, publicId, filename, cloudinaryUrl: uploadResult.secure_url };
    } catch (err) {
        console.error(`Decoration Cloudinary upload failed for "${decorationAsset}": ${safeErrorMessage(err)}`);
        return null;
    }
}

async function renderAndCacheDecorationWebp(decorationUrl, decorationAsset, skuId) {
    const publicId = publicIdFor(decorationAsset);
    if (isCloudinaryWriteBlocked('upload', publicId, { devNamespaceSafe: true })) return null;

    const core = await renderDecorationWebpCore(decorationUrl, decorationAsset);
    if (!core) return null;
    const { webpBuffer, palette, width, height, frameCount, renderMs } = core;

    try {
        const filename = `${slugify(decorationAsset)}.webp`;
        const hexOf = c => `\`#${(c.hex >>> 0).toString(16).padStart(6, '0').toUpperCase()}\``;
        const metadataLines = [
            `### \`${width}×${height}px\` · \`${frameCount}f\` · \`${(webpBuffer.length / 1024).toFixed(1)}kB\``,
            palette ? `-# **Colors:** **${palette.map(hexOf).join(' · ')}**` : null,
            `-# **Asset:** \`${decorationAsset}\``,
            `-# **Cloudinary:** \`/${publicId}\`${skuId ? ` · **SKU:** \`${skuId}\`` : ''}`,
            `-# Rendered <t:${Math.floor(Date.now() / 1000)}:R> in \`${renderMs}ms\``,
            // 2026-08-15 10:31 EDT: this path only ever renders a design NOT (yet) in the bulk-cache
            // catalog -- see this file's header. Flags it so a catalog refresh can find + reconcile it.
            `-# ⚠️ Fallback render — not in the catalog snapshot yet`
        ].filter(Boolean);
        const components = [
            {
                type: 17, // Container
                accent_color: palette?.[0]?.hex ?? undefined,
                components: [
                    {
                        type: 9, // Section
                        components: [{ type: 10, content: metadataLines.join('\n') }],
                        accessory: { type: 11, media: { url: `attachment://${filename}` } }
                    }
                ]
            }
        ];
        const [discordCdnUrl, uploadResult] = await Promise.all([
            uploadToStorageChannel(
                process.env.DECORATION_CACHE_CHANNEL_ID,
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
                // reason. Never affects `public_id`, the cache key.
                { public_id: publicId, asset_folder: `${FOLDER}/_uncataloged`, overwrite: true, invalidate: true, resource_type: 'image' }
            )
        ]);
        await attachDecorationDiscordCdnUrl(publicId, palette, discordCdnUrl, { render_source: 'fallback' });
        const resolved = { cloudinaryUrl: uploadResult.secure_url, discordCdnUrl, palette };
        memoizeResolved(publicId, resolved);
        return resolved;
    } catch (err) {
        console.error(`Decoration WebP render/upload failed for "${decorationAsset}": ${safeErrorMessage(err)}`);
        return null;
    }
}

// Single entry point utils/colorPalette.js calls. Returns null (never throws) on any failure --
// caller falls back to the existing static/APNG decoration display, same non-blocking philosophy as
// every other Cloudinary write path in this bot. Otherwise returns { cloudinaryUrl, discordCdnUrl } --
// discordCdnUrl may be null even on success, same caveat as utils/nameplateWebpCache.js.
async function resolveDecorationWebp({ decorationAsset, decorationUrl, skuId }) {
    if (!decorationAsset || !decorationUrl) return null;

    const cached = await getCachedDecorationWebp(decorationAsset);
    if (cached) return cached.palette ? cached : healPalette(cached, decorationAsset, decorationUrl);

    return renderAndCacheDecorationWebp(decorationUrl, decorationAsset, skuId);
}

// Backfills a palette onto a WebP rendered BEFORE palette caching shipped. Without this, such a design
// never re-renders (the WebP is already cached), so it would fall back to per-user extraction forever
// -- precisely the cost this cache removes. Paid ONCE per pre-existing design.
//
// ⚠️ Metadata only: no re-render, no re-upload, and the existing cache-channel message is left alone
// (so an older one keeps its original accent and has no Colors line -- editing storage-channel history
// is deliberately out of scope). Returns the cached object unchanged on any failure, so a heal that
// cannot complete degrades to today's behaviour rather than breaking a working preview.
async function healPalette(cached, decorationAsset, decorationUrl) {
    const publicId = publicIdFor(decorationAsset);
    if (isCloudinaryWriteBlocked('update', publicId, { devNamespaceSafe: true })) return cached;
    try {
        const res = await fetch(decorationUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${decorationUrl}`);
        // `asPaths` here too: this path only ever samples the ~9 frames the montage picks, so reading
        // all 60 into memory to throw 51 of them away was the same waste the render path had.
        const extracted = await extractAlphaFrames(Buffer.from(await res.arrayBuffer()), { ...FRAME_OPTS, asPaths: true });
        let palette;
        try {
            palette = await extractPaletteFromFrames(extracted.paths);
        } finally {
            await extracted.cleanup();
        }
        const context = { ...paletteContextFields(palette, FRAME_OPTS) };
        if (!context.palette) return cached;
        // Re-send discord_cdn_url -- `context` replaces the whole map, so patching the palette alone
        // would wipe the url this module works hard to persist.
        if (cached.discordCdnUrl) context.discord_cdn_url = cached.discordCdnUrl;
        await cloudinary.api.update(publicId, { resource_type: 'image', context });
        const resolved = { ...cached, palette };
        memoizeResolved(publicId, resolved);
        return resolved;
    } catch (err) {
        console.error(`Decoration palette backfill failed for "${publicId}": ${safeErrorMessage(err)}`);
        return cached;
    }
}

module.exports = {
    resolveDecorationWebp, publicIdFor, FOLDER,
    getCachedDecorationWebp, renderDecorationWebpForBulk, attachDecorationDiscordCdnUrl
};
