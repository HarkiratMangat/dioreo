// utils/decorationGifCache.js -- persistent Cloudinary cache for the animated decoration GIF preview
// in View Colors' Deco page, added 2026-08-10 09:00 EDT alongside utils/nameplateGifCache.js for the
// feature designed in docs/superpowers/specs/2026-08-09-nameplate-decoration-animated-gif-caching-
// design.md.
//
// Deliberately NOT the "solid opaque card" trick nameplate uses -- Harkirat's explicit call: keep
// decorations genuinely transparent (no backing card, they're meant to float over whatever's behind
// them), and instead find a way to make GIF's binary alpha threshold look better than the naive
// "collapses the soft glow to nothing" result the design spec's Finding 2 measured. The answer is
// alpha DITHERING (utils/animatedGifPipeline.js's ditherAlphaBayer) -- verified live 2026-08-10 09:00
// EDT against a synthetic soft-glow test image, round-tripped through the real ffmpeg encode/decode
// pipeline, and visually confirmed to preserve a recognizable soft-falloff impression instead of a
// hard-edged blob, at both full size and a small (~80px) thumbnail scale.
//
// ⚠️ Still explicitly LOSSY, and always will be -- GIF has no partial-alpha format-level escape at
// all, dithering only trades WHERE the loss shows up (a spatial halftone pattern instead of a missing
// gradient). This is the closest a GIF can get, not a lossless conversion. Flagged here so nobody
// reads this module's existence as "the lossiness got fixed."
//
// ⚠️ NOT YET VISUALLY VERIFIED AGAINST A REAL EQUIPPED DECORATION. This session's sandbox has no
// Discord bot credentials (.env.dev doesn't exist here), so the dithering technique was proven against
// a synthetic radial-glow fixture crafted to resemble the real thing, not the genuine article. The
// mechanism (ffmpeg alpha-correct APNG extraction, per-frame Bayer dither, real GIF encode/decode
// round-trip) is real and tested end-to-end; a live check against Harkirat's own equipped decoration
// on the dev bot is the natural next step before treating the visual result as settled -- same
// "verified live" bar the design spec itself insists on for the nameplate solid-bed look.
const cloudinary = require('cloudinary').v2;

if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- decoration GIF caching will fail on every attempt.');
}

const { Jimp } = require('jimp');
const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');
const { slugify } = require('./cloudinaryCache');
const { extractAlphaFrames, encodeGifFromFrames, ditherAlphaBayer } = require('./animatedGifPipeline');

const FOLDER = 'decoration_gifs';
// Decorations have no single documented native frame rate (a real equipped decoration was measured
// at 60 frames in utils/stillFrame.js's montage comment, with no stated fps) -- 12fps matches the
// fixed rate nameplate settled on above, for the same reason: the render cost is paid once per
// design and cached forever, so there's no pressure to chase a lower rate for speed.
const FPS = 12;
// Cap the rendered width the same way utils/resizedImage.js caps the nameplate/avatar previews --
// decorations are typically already small (avatar-decoration scale), so this is a ceiling, not a
// forced upscale.
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

async function getCachedDecorationGifUrl(decorationAsset) {
    try {
        const result = await cloudinary.api.resource(publicIdFor(decorationAsset), { resource_type: 'image' });
        // Same f_auto carve-out as nameplateGifCache.js -- see that module's matching comment for why
        // this delivery url deliberately skips withDeliveryDefaults().
        return result.secure_url;
    } catch (err) {
        if (errorHttpCode(err) !== 404) {
            console.error(`Decoration GIF cache lookup failed for "${decorationAsset}": ${safeErrorMessage(err)}`);
        }
        return null;
    }
}

async function renderAndCacheDecorationGif(decorationUrl, decorationAsset) {
    const publicId = publicIdFor(decorationAsset);
    if (isCloudinaryWriteBlocked('upload', publicId)) return null;

    try {
        const res = await fetch(decorationUrl);
        if (!res.ok) throw new Error(`Failed to download ${decorationUrl}: HTTP ${res.status}`);
        const sourceBuffer = Buffer.from(await res.arrayBuffer());

        // -f apng is REQUIRED (see utils/stillFrame.js's extractFrameMontage comment) -- without it
        // ffmpeg silently reads an animated PNG as a single still frame and this would produce a
        // 1-frame "animated" GIF with no error anywhere to catch it.
        const rawFrames = await extractAlphaFrames(sourceBuffer, {
            inputExt: '.png',
            preInputArgs: ['-f', 'apng'],
            fps: FPS
        });

        // No bed/compositing step (decorations stay genuinely transparent) -- just dither each
        // frame's own alpha channel and optionally downscale. Same event-loop-yield discipline as
        // nameplateGifCache.js's compositing loop; dithering is O(pixels) synchronous work too.
        const dithered = [];
        for (const frameBuf of rawFrames) {
            const img = await Jimp.read(frameBuf);
            if (img.bitmap.width > MAX_WIDTH) {
                const targetHeight = Math.max(1, Math.round(MAX_WIDTH * img.bitmap.height / img.bitmap.width));
                img.resize({ w: MAX_WIDTH, h: targetHeight });
            }
            ditherAlphaBayer(img);
            dithered.push(await img.getBuffer('image/png'));
            await new Promise(setImmediate);
        }

        // alphaThreshold=1: the dither pass above already collapsed every pixel to exactly 0 or 255,
        // so any threshold in (0,255) reproduces the dither pattern exactly -- 1 just avoids relying
        // on ffmpeg's default (128) coincidentally being a no-op here.
        const gifBuffer = await encodeGifFromFrames(dithered, { fps: FPS, alphaThreshold: 1 });

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
        console.error(`Decoration GIF render/upload failed for "${decorationAsset}": ${safeErrorMessage(err)}`);
        return null;
    }
}

// Single entry point utils/colorPalette.js calls. Returns null (never throws) on any failure --
// caller falls back to the existing static/APNG decoration display, same non-blocking philosophy as
// every other Cloudinary write path in this bot.
async function resolveDecorationGif({ decorationAsset, decorationUrl }) {
    if (!decorationAsset || !decorationUrl) return null;

    const cached = await getCachedDecorationGifUrl(decorationAsset);
    if (cached) return cached;

    return renderAndCacheDecorationGif(decorationUrl, decorationAsset);
}

module.exports = { resolveDecorationGif, publicIdFor, FOLDER };
