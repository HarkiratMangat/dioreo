// utils/resizedImage.js -- downloads an image URL and re-encodes it at a capped width, preserving
// aspect ratio, returning a PNG Buffer. Used by the View Colors panel's nameplate preview
// (utils/colorPaletteView.js): Discord's collectibles CDN IGNORES the `?size=` query param entirely
// (confirmed live -- a 672x126 nameplate stays 672x126 even with `?size=512`), unlike the avatar/
// banner CDN which honors it. So the only way to cap the nameplate preview at a specific width is to
// fetch it and resize it here ourselves, the same way the Display Name gradient banner is generated
// at a fixed size (utils/colorGradientImage.js). Deliberately general-purpose, not nameplate-specific.
const { Jimp } = require('jimp');

// In-memory (NOT database) memo cache -- the resized result for a given source url + target width is
// deterministic and rarely changes, but the View Colors nameplate page would otherwise re-download +
// re-decode + re-resize the same image on every open. Caching the finished Buffer in RAM makes the
// download+resize a one-time-per-process cost instead of per-render (2026-07-14, Harkirat's request,
// after flagging the redundant per-render download). Uses zero database storage. Bounded so a
// long-running process can't grow it without limit; the cached Buffer is only ever read (uploaded as
// an attachment), never mutated, so sharing one reference across renders is safe. Same pattern as the
// swatch-image memo in utils/colorSwatchImage.js.
const resizeCache = new Map();
const RESIZE_CACHE_MAX = 64;

async function renderResizedImage(url, targetWidth) {
    const key = `${url}|${targetWidth}`;
    const cached = resizeCache.get(key);
    if (cached) return cached;

    const img = await Jimp.read(url);
    const { width, height } = img.bitmap;
    // Explicit height (rather than relying on a Jimp auto-height flag) keeps this version-safe and
    // makes the aspect-ratio preservation obvious. Only ever downscales -- if the source is already
    // narrower than the cap, leave it alone rather than upscaling into blur.
    let buffer;
    if (width <= targetWidth) {
        buffer = await img.getBuffer('image/png');
    } else {
        const targetHeight = Math.max(1, Math.round(targetWidth * height / width));
        img.resize({ w: targetWidth, h: targetHeight });
        buffer = await img.getBuffer('image/png');
    }

    if (resizeCache.size >= RESIZE_CACHE_MAX) resizeCache.delete(resizeCache.keys().next().value);
    resizeCache.set(key, buffer);
    return buffer;
}

module.exports = { renderResizedImage };
