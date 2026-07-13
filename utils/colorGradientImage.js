// utils/colorGradientImage.js -- generates a horizontal 2-color gradient banner PNG, used by the
// View Colors panel's Name page (utils/colorPaletteView.js) as a stand-in visual for a user's
// Display Name Colors gradient. NOT a render of the user's actual styled display name -- Discord's
// per-style fonts (font_id/effect_id in display_name_styles) aren't publicly distributed or
// accessible via any API, so there's no legal/technical way to reproduce the real text rendering.
// This is the explicitly-requested fallback instead: a flat gradient swatch at the same aspect ratio
// as a nameplate banner (~672x126, confirmed against a real nameplate asset), left-to-right from the
// gradient's start color to its end color -- matching the left-to-right direction Discord's own
// client renders a styled display name in.
const { Jimp } = require('jimp');

async function renderGradientBanner(startHex, endHex, width = 672, height = 126) {
    const img = new Jimp({ width, height, color: 0x000000ff });
    const r1 = (startHex >> 16) & 0xff, g1 = (startHex >> 8) & 0xff, b1 = startHex & 0xff;
    const r2 = (endHex >> 16) & 0xff, g2 = (endHex >> 8) & 0xff, b2 = endHex & 0xff;
    const data = img.bitmap.data;

    for (let x = 0; x < width; x++) {
        const t = width > 1 ? x / (width - 1) : 0;
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
        }
    }

    return img.getBuffer('image/png');
}

module.exports = { renderGradientBanner };
