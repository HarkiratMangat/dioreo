// utils/nameplateBedImage.js -- composites Discord's nameplate "bed" gradient behind the nameplate
// art for the View Colors panel's Nameplate preview (utils/colorPaletteView.js). The bed itself lives
// in NO asset Discord serves -- see utils/nameplatePalettes.js for the full measured story and the
// palette-name -> hex table this reads from. Discord's client draws it as a CSS gradient over the
// art; this reproduces that with a real Jimp composite so the panel's preview matches what the user
// actually sees on their nameplate.
const { Jimp } = require('jimp');
const { NAMEPLATE_GRADIENT_STOPS } = require('./nameplatePalettes');

// Piecewise-linear interpolation across NAMEPLATE_GRADIENT_STOPS' {at, alpha} pairs -- reproduces the
// same curve as Discord's `linear-gradient(90deg, transparent 0%, rgba(C,0.08) 20%, rgba(C,0.08) 50%,
// rgba(C,0.5) 100%)` at any x, not just the four named stops.
function gradientAlphaAt(t) {
    const stops = NAMEPLATE_GRADIENT_STOPS;
    for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i], b = stops[i + 1];
        if (t >= a.at && t <= b.at) {
            const span = b.at - a.at;
            return span > 0 ? a.alpha + (b.alpha - a.alpha) * (t - a.at) / span : a.alpha;
        }
    }
    return stops[stops.length - 1].alpha;
}

// Same memo pattern as utils/resizedImage.js/colorSwatchImage.js -- the composited result for a given
// source url + bed color + target width is deterministic and rarely changes, so this is a
// one-time-per-process cost rather than a per-render one.
const bedCache = new Map();
const BED_CACHE_MAX = 64;

// bedHex: a packed 0xRRGGBB integer (already resolved via nameplatePaletteHex + parseInt upstream --
// this function never looks up or guesses a color itself, it only paints the one it's given).
async function renderNameplateWithBed(url, bedHex, targetWidth = 512) {
    const key = `${url}|${bedHex}|${targetWidth}`;
    const cached = bedCache.get(key);
    if (cached) return cached;

    const art = await Jimp.read(url);
    const { width, height } = art.bitmap;

    // Bed built at the ART's native resolution (not the eventual target width) so the gradient's
    // horizontal stops land at the same fractional positions Discord's own CSS gradient uses,
    // regardless of how much the final image gets downscaled below.
    const bed = new Jimp({ width, height, color: 0x00000000 });
    const r = (bedHex >> 16) & 0xff, g = (bedHex >> 8) & 0xff, b = bedHex & 0xff;
    const data = bed.bitmap.data;
    for (let x = 0; x < width; x++) {
        const t = width > 1 ? x / (width - 1) : 0;
        const a = Math.round(gradientAlphaAt(t) * 255);
        for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a;
        }
    }
    // Art on top of the bed -- the art's own transparent 73% (see nameplatePalettes.js's measured
    // pixel bounds) is exactly what lets the bed show through underneath.
    bed.composite(art, 0, 0);

    if (width > targetWidth) {
        const targetHeight = Math.max(1, Math.round(targetWidth * height / width));
        bed.resize({ w: targetWidth, h: targetHeight });
    }

    const buffer = await bed.getBuffer('image/png');
    if (bedCache.size >= BED_CACHE_MAX) bedCache.delete(bedCache.keys().next().value);
    bedCache.set(key, buffer);
    return buffer;
}

// Signed distance (Inigo Quilez's standard 2D rounded-box SDF) from (px,py) to the boundary of a
// w x h rounded rect with corner radius r, centered in its own box -- 0 on the edge, negative
// inside, positive outside. Used below to paint a ~1px antialiased rounded edge without a separate
// masking library; this bot has no canvas/skia dependency, only Jimp's raw bitmap access.
function sdRoundedBox(px, py, w, h, r) {
    const cx = w / 2, cy = h / 2;
    const qx = Math.abs(px - cx) - (cx - r);
    const qy = Math.abs(py - cy) - (cy - r);
    const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
    const outside = Math.sqrt(ax * ax + ay * ay);
    const inside = Math.min(Math.max(qx, qy), 0);
    return outside + inside - r;
}

// The GIF-caching feature's answer to Finding 3 in the design spec (2026-08-10 08:48 EDT): GIF's
// binary alpha can't hold the existing gradient bed's fade-to-transparent edges at all (round-trips
// to exactly 2 alpha values, confirmed live), so this paints a FULLY OPAQUE bed instead -- solid
// bedHex, no gradient ramp -- with the art composited on top exactly as renderNameplateWithBed does.
// Rounded corners (14px radius, ~1px antialiased edge, Harkirat's confirmed spec) are the only
// surviving transparency in the frame; GIF's threshold handles four small corner triangles fine at
// this scale (verified: alpha values after this composite cluster at 254-255 except right at the
// corners). Renders ONE frame -- utils/nameplateGifCache.js calls this once per extracted webm frame,
// yielding to the event loop between calls (same discipline the k-means CPU-burst incident taught,
// see .claude/rules/accent-and-colors.md's production-incident section) since a real per-render burst
// here is exactly what blocked other interactions' 3s ACK window before.
const CORNER_RADIUS = 14;

async function renderSolidRoundedBedFrame(artBuffer, bedHex, targetWidth = 512) {
    const art = await Jimp.read(artBuffer);
    const { width, height } = art.bitmap;

    const bed = new Jimp({ width, height, color: 0x00000000 });
    const r = (bedHex >> 16) & 0xff, g = (bedHex >> 8) & 0xff, b = bedHex & 0xff;
    const data = bed.bitmap.data;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dist = sdRoundedBox(x + 0.5, y + 0.5, width, height, CORNER_RADIUS);
            const coverage = Math.max(0, Math.min(1, 0.5 - dist));
            const idx = (y * width + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = Math.round(coverage * 255);
        }
    }
    bed.composite(art, 0, 0);

    if (width > targetWidth) {
        const targetHeight = Math.max(1, Math.round(targetWidth * height / width));
        bed.resize({ w: targetWidth, h: targetHeight });
    }

    return bed.getBuffer('image/png');
}

module.exports = { renderNameplateWithBed, renderSolidRoundedBedFrame };
