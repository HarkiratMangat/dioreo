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
async function getDominantColor(imageUrl) {
    const img = await Jimp.read(imageUrl);
    const { width, height, data } = img.bitmap;
    const totalPixels = width * height;
    const pixelStep = Math.max(1, Math.floor(totalPixels / 2500));
    const byteStep = pixelStep * 4; // RGBA = 4 bytes/pixel; stepping by a multiple of 4 keeps us pixel-aligned

    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += byteStep) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
    }

    return (Math.round(r / count) << 16) + (Math.round(g / count) << 8) + Math.round(b / count);
}

module.exports = { getDominantColor };
