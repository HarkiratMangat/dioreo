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

// Shared by both call shapes below: paints the fade gradient bed at the art's own resolution (so the
// gradient's horizontal stops land at the same fractional positions Discord's own CSS gradient uses,
// regardless of how much the final image gets downscaled after), composites the art on top, and
// downscales to targetWidth if needed. `art` is an already-decoded Jimp image so this has no opinion
// on whether its source was a URL (one-shot static preview) or an extracted frame buffer (per-frame
// animated render) -- that decision lives in the two thin wrappers below.
function paintGradientBedOnto(art, bedHex, targetWidth) {
    const { width, height } = art.bitmap;
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
    return bed;
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
    const buffer = await paintGradientBedOnto(art, bedHex, targetWidth).getBuffer('image/png');
    if (bedCache.size >= BED_CACHE_MAX) bedCache.delete(bedCache.keys().next().value);
    bedCache.set(key, buffer);
    return buffer;
}

// Per-frame variant for the animated WebP cache (utils/nameplateWebpCache.js calls this once per
// extracted webm frame) -- same fade-gradient math as renderNameplateWithBed above, just reading a
// buffer instead of fetching a url, and uncached (each frame's art differs, so there's nothing to
// memoize across calls the way the single-image static path can). WebP holds this fade's real
// fade-to-transparent alpha ramp fine (unlike the GIF-era predecessor this replaced, which had to
// paint a fully opaque solid bed instead because GIF's binary alpha can't hold a fade at all --
// confirmed live at the time). Yields to the event loop between calls (same discipline the k-means
// CPU-burst incident taught, see .claude/rules/accent-and-colors.md's production-incident section)
// since a real per-render burst here is exactly what blocked other interactions' 3s ACK window before.
async function renderGradientBedFrame(artBuffer, bedHex, targetWidth = 512) {
    const art = await Jimp.read(artBuffer);
    return paintGradientBedOnto(art, bedHex, targetWidth).getBuffer('image/png');
}

module.exports = { renderNameplateWithBed, renderGradientBedFrame };
