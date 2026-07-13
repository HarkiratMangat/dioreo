// utils/colorSwatchImage.js -- generates a small solid-color PNG for a single swatch entry in the
// "View Colors" panel (utils/colorPaletteView.js), so a listed hex actually SHOWS its color instead
// of just being typed text. No caching/hosting needed -- these are sent as message attachments
// (`files`) referenced via `attachment://` in the same payload, not hosted externally, so a fresh
// tiny PNG is generated per render rather than needing a Cloudinary round-trip like draws.js's
// thumbnail cache does for user-provided images.
const { Jimp } = require('jimp');

async function renderSwatchImage(hex) {
    const rgba = ((hex & 0xffffff) << 8) | 0xff; // RRGGBB -> RRGGBBAA (fully opaque)
    const img = new Jimp({ width: 64, height: 64, color: rgba >>> 0 });
    return img.getBuffer('image/png');
}

module.exports = { renderSwatchImage };
