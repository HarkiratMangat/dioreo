// utils/resizedImage.js -- downloads an image URL and re-encodes it at a capped width, preserving
// aspect ratio, returning a PNG Buffer. Used by the View Colors panel's nameplate preview
// (utils/colorPaletteView.js): Discord's collectibles CDN IGNORES the `?size=` query param entirely
// (confirmed live -- a 672x126 nameplate stays 672x126 even with `?size=512`), unlike the avatar/
// banner CDN which honors it. So the only way to cap the nameplate preview at a specific width is to
// fetch it and resize it here ourselves, the same way the Display Name gradient banner is generated
// at a fixed size (utils/colorGradientImage.js). Deliberately general-purpose, not nameplate-specific.
const { Jimp } = require('jimp');

async function renderResizedImage(url, targetWidth) {
    const img = await Jimp.read(url);
    const { width, height } = img.bitmap;
    // Explicit height (rather than relying on a Jimp auto-height flag) keeps this version-safe and
    // makes the aspect-ratio preservation obvious. Only ever downscales -- if the source is already
    // narrower than the cap, leave it alone rather than upscaling into blur.
    if (width <= targetWidth) return img.getBuffer('image/png');
    const targetHeight = Math.max(1, Math.round(targetWidth * height / width));
    img.resize({ w: targetWidth, h: targetHeight });
    return img.getBuffer('image/png');
}

module.exports = { renderResizedImage };
