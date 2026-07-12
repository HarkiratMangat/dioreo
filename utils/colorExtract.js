// utils/colorExtract.js
const { Jimp } = require('jimp');

// Discord's legacy `accent_color` field is only ever populated for accounts with NO banner set
// (the client shows one or the other) -- most active users have a banner, so that field comes
// back null for them and there was no reliable API-exposed "profile color" to automate /settings'
// accent color from. This downloads the user's banner (or avatar, if no banner) and averages a
// sample of its pixels to get a representative hex color instead, since Discord doesn't expose
// their newer Nitro "profile theme color" feature over the bot API at all.
//
// Sampled rather than reading every pixel (a full banner is 480x240 = ~115k pixels) to keep this
// fast -- capped at ~2500 samples regardless of image size.
// BUG FIX (2026-07-12, found live): a plain flat average washes out toward gray/white for exactly
// the common case that matters most here -- a profile picture that's mostly a pale/white
// background with one small saturated feature (Harkirat's own example: an avatar that's mostly
// white but reads as "teal/blue" to a person, because that's the one thing your eye actually
// registers). Switched to a SATURATION-WEIGHTED average -- each sampled pixel's contribution is
// weighted by how saturated it is (squared, to emphasize more-vibrant pixels more strongly), so
// low-saturation pixels (white/gray/near-black backgrounds) barely move the result while the
// image's most "prominent" color dominates it. Falls back to the plain average for genuinely
// near-grayscale images, where every pixel's weight is ~0 and a weighted average would divide by
// (near) zero.
async function getDominantColor(imageUrl) {
    const img = await Jimp.read(imageUrl);
    const { width, height, data } = img.bitmap;
    const totalPixels = width * height;
    const pixelStep = Math.max(1, Math.floor(totalPixels / 2500));
    const byteStep = pixelStep * 4; // RGBA = 4 bytes/pixel; stepping by a multiple of 4 keeps us pixel-aligned

    let r = 0, g = 0, b = 0, count = 0;
    let wr = 0, wg = 0, wb = 0, wSum = 0;
    for (let i = 0; i < data.length; i += byteStep) {
        const pr = data[i], pg = data[i + 1], pb = data[i + 2];
        r += pr; g += pg; b += pb; count++;

        const max = Math.max(pr, pg, pb);
        const min = Math.min(pr, pg, pb);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const weight = saturation * saturation;
        wr += pr * weight; wg += pg * weight; wb += pb * weight; wSum += weight;
    }

    if (wSum > 0.01) {
        return (Math.round(wr / wSum) << 16) + (Math.round(wg / wSum) << 8) + Math.round(wb / wSum);
    }
    return (Math.round(r / count) << 16) + (Math.round(g / count) << 8) + Math.round(b / count);
}

module.exports = { getDominantColor };
