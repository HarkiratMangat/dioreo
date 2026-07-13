// utils/colorExtract.js
const { Jimp } = require('jimp');

// Discord's legacy `accent_color` field is only ever populated for accounts with NO banner set
// (the client shows one or the other) -- most active users have a banner, so that field comes
// back null for them and there was no reliable single API-exposed "profile color" to automate
// /settings' accent color from. This downloads the user's banner (or avatar, if no banner) and
// averages a sample of its pixels to get a representative hex color instead.
//
// STALE CLAIM CORRECTED (2026-07-14): this comment used to say Discord doesn't expose Nitro profile-
// theme colors over the bot API "at all" -- that was true when written, isn't anymore as of the
// current API (v10). `display_name_styles.colors` (a real 2-stop name-color gradient) IS exposed via
// a raw REST call, just not through discord.js's own User class (see accentColor.js's
// fetchProfileExtras for why) and not as a single flat color -- see the 'displayName' accent style in
// accentColor.js and the "View Colors" panel's Name page, both of which use this real field. Pixel
// extraction here remains the right approach specifically for avatar/banner/decoration/nameplate,
// none of which have any equivalent Discord-provided color value at all.
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
        // BUG FIX (2026-07-14, found live via nameplate/decoration extraction -- a real Discord
        // nameplate asset is 32.9% fully-transparent padding): this loop never checked the alpha
        // byte at all, so a transparent pixel's leftover RGB (commonly 0,0,0 -- Discord's PNG
        // encoder doesn't guarantee meaningful RGB under alpha=0) got counted as real opaque black
        // content. Avatar/banner images are typically fully opaque squares, so this never surfaced
        // there -- it only became visible once transparent sources (nameplate/decoration) started
        // running through this same extraction code this session.
        if (data[i + 3] === 0) continue;
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
    // fCount === 0 only if literally every sampled pixel was fully transparent -- an essentially
    // invisible/broken image, not a realistic real-world input, but a plain division would produce
    // NaN rather than a usable hex, so this falls back to a neutral mid-gray instead.
    if (fCount === 0) return 0x808080;
    return (Math.round(fr / fCount) << 16) + (Math.round(fg / fCount) << 8) + Math.round(fb / fCount);
}

// getColorPalette() -- backs /settings' "View Colors" panel. Went through 2 real revisions:
//
// V1 (2026-07-13): an Android Palette-style 6-swatch model (Vibrant/Light Vibrant/Dark Vibrant/
// Muted/Light Muted/Dark Muted), each a scored target region. REJECTED (2026-07-14) after Harkirat
// compared it directly against real palette-generator tools (Jukebox, Coolors) run on his own
// avatar -- their results were genuinely diverse, real colors sampled from visually distinct
// regions of the image (background, hair, eyes, skin), while the synthetic category system read as
// "mostly useless" -- categories are an abstraction over the image, not real colors picked from it.
//
// V2 (2026-07-14, current): proper K-MEANS clustering in RGB space, same technique those reference
// tools visibly use (confirmed: Coolors' own UI shows pin markers landing on chromatically distinct
// regions -- background, hair, eye, skin, shirt -- exactly k-means' expected behavior, since a large
// uniform region becomes ONE cluster regardless of its pixel count while smaller distinct features
// still each get their own). This is a genuine behavior change from V1, not a tuning tweak -- the
// return shape changed from a named-fields object (`{vibrant, muted, ...}`) to a plain array of
// `{hex, percent}` sorted by prevalence, since there's no more fixed category set to key off of.
//
// DETERMINISM matters here specifically because of the "Refresh Colors" button (index.js) --  it
// needs to honestly report whether a source's colors actually changed, which requires the SAME
// image to always produce the SAME result. Textbook k-means uses randomized initialization
// (k-means++), which would make even an unchanged avatar look "different" on every refresh. Fixed
// by seeding centroids DETERMINISTICALLY instead: sort sampled pixels by hue and pick K evenly-
// spaced ones as starting centroids -- spreads the initial guesses across the color wheel (same
// spirit as k-means++) without any randomness, so pixel sampling (already deterministic -- Jimp
// reads pixels in a fixed order, this file's own step size is fixed) plus deterministic seeding
// means the whole pipeline is reproducible for the same source image. Verified directly: ran twice
// against the same real avatar/banner URLs, byte-identical results both times.
//
// A post-clustering merge step folds any two final clusters that land within `MERGE_THRESHOLD` of
// each other back into one (population-weighted average) -- k-means can still occasionally split a
// large, subtly-varied region (a background with soft lighting gradient) into two very similar
// clusters depending on where the deterministic seeds happened to land; confirmed this happening on
// a real test run before adding the merge step, and confirmed it no longer happens after.
const KMEANS_COUNT = 8;
const KMEANS_ITERATIONS = 12;
const MERGE_THRESHOLD = 30; // Euclidean RGB distance

function kMeansCluster(pixels, k, iterations) {
    if (pixels.length === 0) return [];
    if (pixels.length <= k) {
        return pixels.map(p => ({ hex: (p.r << 16) | (p.g << 8) | p.b, percent: Math.round(100 / pixels.length) }));
    }

    const byHue = [...pixels].sort((a, b) => rgbToHsl(a.r, a.g, a.b).h - rgbToHsl(b.r, b.g, b.b).h);
    const centroids = [];
    for (let i = 0; i < k; i++) {
        centroids.push({ ...byHue[Math.floor(i * byHue.length / k)] });
    }

    let assignments = new Array(pixels.length).fill(0);
    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < pixels.length; i++) {
            let minDist = Infinity, minIdx = 0;
            for (let c = 0; c < centroids.length; c++) {
                const cen = centroids[c];
                const d = (pixels[i].r - cen.r) ** 2 + (pixels[i].g - cen.g) ** 2 + (pixels[i].b - cen.b) ** 2;
                if (d < minDist) { minDist = d; minIdx = c; }
            }
            assignments[i] = minIdx;
        }
        const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
        for (let i = 0; i < pixels.length; i++) {
            const s = sums[assignments[i]];
            s.r += pixels[i].r; s.g += pixels[i].g; s.b += pixels[i].b; s.count++;
        }
        for (let c = 0; c < k; c++) {
            if (sums[c].count > 0) centroids[c] = { r: sums[c].r / sums[c].count, g: sums[c].g / sums[c].count, b: sums[c].b / sums[c].count };
        }
    }

    const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (let i = 0; i < pixels.length; i++) {
        const s = sums[assignments[i]];
        s.r += pixels[i].r; s.g += pixels[i].g; s.b += pixels[i].b; s.count++;
    }
    return sums
        .filter(s => s.count > 0)
        .map(s => ({
            hex: (Math.round(s.r / s.count) << 16) | (Math.round(s.g / s.count) << 8) | Math.round(s.b / s.count),
            percent: Math.round((s.count / pixels.length) * 100)
        }))
        .sort((a, b) => b.percent - a.percent);
}

function mergeCloseClusters(clusters, threshold) {
    const merged = [];
    for (const c of clusters) {
        const r = (c.hex >> 16) & 0xff, g = (c.hex >> 8) & 0xff, b = c.hex & 0xff;
        const target = merged.find(m => {
            const mr = (m.hex >> 16) & 0xff, mg = (m.hex >> 8) & 0xff, mb = m.hex & 0xff;
            return Math.sqrt((r - mr) ** 2 + (g - mg) ** 2 + (b - mb) ** 2) < threshold;
        });
        if (target) {
            const totalPct = target.percent + c.percent;
            const mr = (target.hex >> 16) & 0xff, mg = (target.hex >> 8) & 0xff, mb = target.hex & 0xff;
            target.hex = (Math.round((mr * target.percent + r * c.percent) / totalPct) << 16)
                | (Math.round((mg * target.percent + g * c.percent) / totalPct) << 8)
                | Math.round((mb * target.percent + b * c.percent) / totalPct);
            target.percent = totalPct;
        } else {
            merged.push({ ...c });
        }
    }
    return merged.sort((a, b) => b.percent - a.percent);
}

// Returns an array of `{ hex, percent }` sorted by prevalence (most-common first), sliced to at MOST
// `count` entries -- callers (utils/colorPaletteView.js) render however many actually come back.
// `count` (2026-07-14, Harkirat's request) lets callers ask for fewer clusters on smaller/simpler
// sources (nameplate/decoration -- 4) than richer ones (avatar/banner -- 8) instead of one fixed K
// for every source; defaults to KMEANS_COUNT (8) for any caller that doesn't care.
//
// BUG FIX (2026-07-14, found live: avatar requested 8 colors, only 5 came back): clustering directly
// at K=`count` then merging near-duplicates could eat INTO the requested count with no way to
// recover -- if 3 of the 8 initial clusters were close enough to merge away, the result was
// permanently short by 3, even though the image likely has other genuinely distinct regions the
// merged-away clusters' "slots" could have gone to instead. Fixed by OVER-clustering first (50% more
// than requested) before merging, then taking the top `count` post-merge -- gives the merge step
// room to fold away real near-duplicates while still leaving enough surplus clusters to fill back up
// to the requested count from other genuinely distinct regions. Verified live: avatar went from 5/8
// to a full 8/8 with this fix, using otherwise-identical source pixels.
async function getColorPalette(imageUrl, count = KMEANS_COUNT) {
    const img = await Jimp.read(imageUrl);
    const { width, height, data } = img.bitmap;
    const totalPixels = width * height;
    const pixelStep = Math.max(1, Math.floor(totalPixels / 2500));
    const byteStep = pixelStep * 4;

    const pixels = [];
    for (let i = 0; i < data.length; i += byteStep) {
        // Same alpha-blindness bug fixed in getDominantColor above -- see that fix's comment.
        if (data[i + 3] === 0) continue;
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }

    const overCluster = Math.ceil(count * 1.5);
    const clustered = mergeCloseClusters(kMeansCluster(pixels, overCluster, KMEANS_ITERATIONS), MERGE_THRESHOLD);
    return clustered.slice(0, count);
}

module.exports = { getDominantColor, getColorPalette };
