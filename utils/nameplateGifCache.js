// utils/nameplateGifCache.js -- persistent Cloudinary cache for the animated nameplate GIF preview
// in View Colors' Nameplate page, added 2026-08-10 09:00 EDT for the feature designed in
// docs/superpowers/specs/2026-08-09-nameplate-decoration-animated-gif-caching-design.md.
//
// Same render-once-cache-forever shape every other Cloudinary module here already follows
// (utils/cloudinaryCache.js/patchNotesCache.js/calendarBannerCache.js/loadoutImageCache.js) --
// this is the one difference: those all upload from a REMOTE url Cloudinary fetches itself; there is
// no remote url for this asset (it doesn't exist until this bot renders it), so this uploads a local
// Buffer via a base64 data URI instead.
//
// Cache key is (nameplate design asset, palette name) -- NOT per-user, NOT per-guild. Every user who
// has ever equipped the same nameplate design in the same palette gets the identical rendered GIF, so
// the first person to view any given combination pays the ~1.9s render cost once; everyone after that
// (any user, any server, any bot restart) gets a Cloudinary CDN url. Confirmed the render is genuinely
// deterministic per (asset, palette) -- the source webm and the bed color are both fixed inputs.
const cloudinary = require('cloudinary').v2;

if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- nameplate GIF caching will fail on every attempt.');
}

const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');
const { slugify } = require('./cloudinaryCache');
const { extractAlphaFrames, encodeGifFromFrames } = require('./animatedGifPipeline');
const { renderSolidRoundedBedFrame } = require('./nameplateBedImage');

const FOLDER = 'nameplate_gifs';
// Matches the source webm's own native rate (measured live: 12fps, 43 frames over ~3.6s) -- Harkirat's
// call after Finding 4's cost/quality tradeoff: the ~1.9s cold-render cost is paid ONCE per (design,
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

// Cache-only lookup, no render/upload -- mirrors cloudinaryCache.js's getCachedUrl. A 404 here is the
// expected, common "never rendered yet" case, not a real error.
async function getCachedNameplateGifUrl(nameplateAsset, paletteName) {
    try {
        const result = await cloudinary.api.resource(publicIdFor(nameplateAsset, paletteName), { resource_type: 'image' });
        // Deliberately NOT run through cloudinaryDeliveryUrl.js's withDeliveryDefaults() -- that
        // bakes in `f_auto,q_auto` (this bot's standing convention), but `f_auto` performs format
        // content-negotiation based on the REQUESTING client's Accept header, and Discord's own
        // embed-fetching crawler is not guaranteed to send one that keeps Cloudinary serving a real
        // animated format back. The entire point of this cache is "Discord auto-plays a GIF inline";
        // an `f_auto` substitution that silently hands Discord a static image would defeat that
        // silently, with no error anywhere to catch it. This is the explicit "site has a reason not
        // to" carve-out that module's own header comment describes.
        return result.secure_url;
    } catch (err) {
        if (errorHttpCode(err) !== 404) {
            console.error(`Nameplate GIF cache lookup failed for "${nameplateAsset}"/"${paletteName}": ${safeErrorMessage(err)}`);
        }
        return null;
    }
}

// Full cold-render path: fetch the source webm, extract alpha-correct frames, composite each onto a
// solid rounded bed, encode to GIF, upload, cache. Never throws -- callers treat a render failure
// exactly like "not cached yet", falling back to the existing static preview (see
// utils/colorPaletteView.js), same non-blocking philosophy as every other Cloudinary write path here.
async function renderAndCacheNameplateGif(webmUrl, nameplateAsset, paletteName, bedHex) {
    const publicId = publicIdFor(nameplateAsset, paletteName);
    if (isCloudinaryWriteBlocked('upload', publicId)) return null;

    try {
        const res = await fetch(webmUrl);
        if (!res.ok) throw new Error(`Failed to download ${webmUrl}: HTTP ${res.status}`);
        const webmBuffer = Buffer.from(await res.arrayBuffer());

        // -c:v libvpx-vp9 forces the decoder that actually surfaces the WebM alpha side-data block --
        // see animatedGifPipeline.js's own comment for the measured default-decoder bug this works
        // around (Finding 1 in the design spec).
        const rawFrames = await extractAlphaFrames(webmBuffer, {
            inputExt: '.webm',
            preInputArgs: ['-c:v', 'libvpx-vp9'],
            fps: FPS
        });

        // Per-frame Jimp compositing is the dominant cost here (Finding 4: ~1.2s of ~1.9s at 43
        // frames) and is fully synchronous CPU work -- yielding between frames is the same fix the
        // k-means CPU-burst production incident needed (see .claude/rules/accent-and-colors.md),
        // so a cold render here can't block an unrelated interaction's 3s ACK window the way the
        // pre-fix color extraction once did.
        const composited = [];
        for (const frame of rawFrames) {
            composited.push(await renderSolidRoundedBedFrame(frame, bedHex, 512));
            await new Promise(setImmediate);
        }

        // alphaThreshold=128 matches the design spec's own verified-live result: the only remaining
        // transparency after the solid-bed composite is a handful of antialiased corner pixels, which
        // a plain threshold handles imperceptibly at this size (confirmed: mean diff 4.8/765 against
        // the source PNG, ordinary palette quantization noise, not a visible corner artifact).
        const gifBuffer = await encodeGifFromFrames(composited, { fps: FPS, alphaThreshold: 128 });

        const uploadResult = await cloudinary.uploader.upload(
            `data:image/gif;base64,${gifBuffer.toString('base64')}`,
            {
                public_id: publicId,
                asset_folder: FOLDER,
                overwrite: true,
                invalidate: true,
                resource_type: 'image'
            }
        );
        return uploadResult.secure_url;
    } catch (err) {
        console.error(`Nameplate GIF render/upload failed for "${nameplateAsset}"/"${paletteName}": ${safeErrorMessage(err)}`);
        return null;
    }
}

// Single entry point utils/colorPalette.js calls. Returns null (never throws) whenever the animated
// GIF isn't available for any reason -- no recognized bed color (nothing to build a solid card from,
// same "never fabricate a color" rule nameplateBedImage.js already follows), cache miss + render
// failure, or a blocked dev-bot write. The caller's existing static-preview path is the fallback.
async function resolveNameplateGif({ nameplateAsset, paletteName, webmUrl, bedHex }) {
    if (!nameplateAsset || !webmUrl || bedHex == null) return null;

    const cached = await getCachedNameplateGifUrl(nameplateAsset, paletteName);
    if (cached) return cached;

    return renderAndCacheNameplateGif(webmUrl, nameplateAsset, paletteName, bedHex);
}

module.exports = { resolveNameplateGif, publicIdFor, FOLDER };
