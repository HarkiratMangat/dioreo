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
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: h * 60, s, l };
}

// BUG FIX (2026-07-12, found live): a plain flat average washes out toward gray/white for the
// common case that matters most here -- a profile picture that's mostly a pale/white background
// with one small saturated feature. First fix attempt was a SATURATION-WEIGHTED AVERAGE (each
// pixel's contribution weighted by saturation²) -- this correctly down-weighted the white
// background, but was STILL wrong for the case that actually matters: an image with several
// DIFFERENT saturated hues in it (e.g. teal hair + blue-green eyes + warm skin tone). Averaging
// RGB across genuinely different hues doesn't produce "the vibrant color" -- it produces a
// mathematical blend that can look like none of the actual colors in the image (found live,
// 2026-07-13, against Harkirat's real Discord avatar: the extracted accent color "felt off"
// compared to the avatar's actual teal/blue, because it had been averaged together with skin-tone
// pixels into a muddy in-between).
//
// SECOND FIX (2026-07-13): switched from "average all vibrant pixels together" to "find the
// single most-prominent HUE CLUSTER and average only within it" -- a real dominant-color approach
// instead of a global blend:
// 1. Convert each sampled pixel to HSL. Pixels that are near-neutral (low saturation, or blown-out
//    near-white/near-black) are EXCLUDED entirely from consideration -- these are backgrounds and
//    shadows, not "the color" of the image, even when they cover the most area.
// 2. Remaining pixels are bucketed into 24 hue bins (15° each), so "teal" and "blue-teal" group
//    together even with per-pixel shading/lighting variance, rather than needing exact RGB match.
// 3. Each pixel's vote in its hue bin is weighted by saturation² (a vivid teal counts more than a
//    pale grayish one), and the bin with the highest total weight wins.
//
// THIRD FIX (2026-07-13, "vivid" variant, confirmed live against 5 real test avatars via a
// side-by-side artifact comparison): step 4 used to be a PLAIN average of every pixel within the
// winning hue bin, which still pulled the result toward a muted middle -- a dark shadow-teal pixel
// counted exactly as much as a bright highlight-teal one. Changed to average only the top 20% MOST
// VIVID pixels within the winning bin (ranked by a `saturation * (1 - |lightness-0.5|*0.6)`
// score, favoring both high saturation and mid-range lightness over very dark/light instances of
// the same hue), so the result is biased toward the punchiest, most "attention-seeking" instance of
// the dominant hue rather than its overall average shade. This is the version Harkirat picked after
// comparing Old (global saturation-weighted average) / New (plain average within winning hue bin) /
// Vivid (this one) side-by-side as real Discord-embed mockups against his own avatar plus 4 other
// test images (gradient orb, holographic photo, an animated GIF, a cartoon screenshot).
//
// NOTE: on an image with multiple comparably-saturated but unrelated hues (tested live on a
// gradient orb with both vivid blue and muted coral regions), this algorithm favors the MORE
// SATURATED hue even if a less-saturated hue covers more area -- confirmed as intentional, not a
// bug, when reviewed directly against the raw per-hue-bin weight data.
//
// Falls back to a plain average of every sampled pixel only if NO pixel clears the saturation/
// lightness thresholds at all (a genuinely near-grayscale image).
async function getDominantColor(imageUrl) {
    const img = await Jimp.read(imageUrl);
    const { width, height, data } = img.bitmap;
    const totalPixels = width * height;
    const pixelStep = Math.max(1, Math.floor(totalPixels / 2500));
    const byteStep = pixelStep * 4; // RGBA = 4 bytes/pixel; stepping by a multiple of 4 keeps us pixel-aligned

    const HUE_BINS = 24; // 15° each
    const bins = Array.from({ length: HUE_BINS }, () => ({ weight: 0, pixels: [] }));

    let fr = 0, fg = 0, fb = 0, fCount = 0; // plain-average fallback, every sampled pixel

    for (let i = 0; i < data.length; i += byteStep) {
        const pr = data[i], pg = data[i + 1], pb = data[i + 2];
        fr += pr; fg += pg; fb += pb; fCount++;

        const { h, s, l } = rgbToHsl(pr, pg, pb);
        // Thresholds tuned for "obviously background/neutral" -- a low-saturation pixel (grays),
        // or a blown-out highlight/shadow (very high/low lightness) never counts toward the
        // dominant hue, no matter how much of the image it covers.
        if (s < 0.15 || l > 0.92 || l < 0.08) continue;

        const bin = Math.min(HUE_BINS - 1, Math.floor(h / (360 / HUE_BINS)));
        const weight = s * s;
        bins[bin].weight += weight;
        // `vivid` score ranks pixels WITHIN this bin later -- saturation matters most, but a very
        // dark or very light pixel of an otherwise-saturated hue (deep shadow, blown highlight)
        // still reads as less "attention-seeking" than a mid-tone instance of the same hue.
        bins[bin].pixels.push({ pr, pg, pb, vivid: s * (1 - Math.abs(l - 0.5) * 0.6) });
    }

    let winner = null;
    for (const bin of bins) {
        if (bin.pixels.length > 0 && (!winner || bin.weight > winner.weight)) winner = bin;
    }

    if (winner) {
        const sorted = [...winner.pixels].sort((a, b) => b.vivid - a.vivid);
        const topN = Math.max(5, Math.ceil(sorted.length * 0.2));
        const top = sorted.slice(0, topN);
        let tr = 0, tg = 0, tb = 0;
        for (const p of top) { tr += p.pr; tg += p.pg; tb += p.pb; }
        return (Math.round(tr / top.length) << 16) + (Math.round(tg / top.length) << 8) + Math.round(tb / top.length);
    }
    return (Math.round(fr / fCount) << 16) + (Math.round(fg / fCount) << 8) + Math.round(fb / fCount);
}

module.exports = { getDominantColor };
