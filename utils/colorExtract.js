// utils/colorExtract.js
const { Jimp } = require('jimp');
const { fingerprint } = require('./algoFingerprint');
// Only for MONTAGE_FINGERPRINT. animatedMediaPipeline requires nothing from here, so this is not a
// cycle; the montage is genuinely part of the algorithm that produces a stored palette (see below).
const { MONTAGE_FINGERPRINT } = require('./animatedMediaPipeline');

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
// A post-clustering merge step folds any two final clusters that land within a distance threshold of
// each other back into one (population-weighted average) -- k-means can still occasionally split a
// large, subtly-varied region (a background with soft lighting gradient) into two very similar
// clusters depending on where the deterministic seeds happened to land; confirmed this happening on
// a real test run before adding the merge step, and confirmed it no longer happens after.
// ============================================================================================
// V3 REWRITE (2026-08-11 01:54 EDT) -- measured against a 22-image corpus of real avatars and
// banners, not tuned on one picture. What was wrong, and why each constant below exists:
//
// 1. SEED STARVATION was the root cause of "asked for 8, got 6". Seeds were picked by sorting pixels
//    by hue and taking every n/k-th BY INDEX, which allocates them in proportion to pixel POPULATION
//    rather than colour coverage. Worse, rgbToHsl returns hue 0 for every neutral (max === min), so
//    an image with a large dark region collapses all of it onto one hue position. Measured on a real
//    avatar: 10 of the 12 seeds landed in two regions and only 10 were even distinct, leaving skin,
//    highlights and a yellow feature with no seed at all. Replaced with deterministic FARTHEST-FIRST
//    seeding (Gonzalez traversal): start at the pixel nearest the mean, then repeatedly take the
//    pixel farthest from everything chosen so far. No randomness, so determinism is preserved.
//
// 2. RGB DISTANCE cannot tell a greyscale RAMP from genuine variety -- black to white is ~440 apart
//    in RGB while being, perceptually, "black, white and antialiasing". So clustering happens in
//    OKLab with LIGHTNESS DOWN-WEIGHTED (LIGHTNESS_WEIGHT): a pure-lightness spread stops attracting
//    seeds it doesn't deserve, without needing an explicit "is this a ramp?" detector.
//
// 3. MERGING now happens in TRUE (unweighted) OKLab, deliberately decoupled from the seeding metric,
//    so "two swatches must differ by at least this much to both be shown" is ONE honest perceptual
//    promise rather than a side effect of a tuning knob. Measured: the old RGB-30 rule left 8
//    perceptual duplicate pairs across the corpus; this leaves 0.
//
// 4. THE ACCENT POOL is the actual fix for the thing Harkirat cared about most. A region covering ~1%
//    of an image can NEVER win a slot against a 50% background under prevalence ranking -- which is
//    why a black cat's red eyes, a holographic avatar's orange and pink, and a cartoon's yellow
//    eyelids were all missing. Verified by rendering classifier masks: the top few percent of pixels
//    by chroma land exactly on those features. So they get their own clustering pass, free of
//    competition from the background.
//    ⚠️ It self-disables on greyscale: CHROMA_FLOOR is absolute, so a pure-grey image contributes no
//    tail at all and no colour can be invented where there is none (verified: output chroma 0.0000).
//    This is also the same instinct getDominantColor above already encodes -- it excludes neutrals and
//    averages only the most vivid pixels of the winning hue. The palette extractor was the
//    inconsistent one.
//
// 5. LOW-COLOUR SOFT RESTRICT (Harkirat's request): a genuinely near-colourless image drops to 4
//    entries instead of the full count. ⚠️ REBUILT 2026-08-12 14:51 EDT -- see the block above
//    LOW_COLOUR_CHROMA below for what it used to do, why that discarded real colours a human could
//    plainly see, and why it now asks about the PIXEL TAIL rather than about the extracted centroids.
const KMEANS_COUNT = 8;
const KMEANS_ITERATIONS = 12;
const LIGHTNESS_WEIGHT = 0.5;    // <1 compresses pure-lightness spread during seeding/clustering
const MERGE_DELTA_E = 0.07;      // OKLab distance below which two entries are the "same" colour
const CHROMA_FLOOR = 0.04;       // absolute: below this a pixel is not colourful in any useful sense
const ACCENT_TAIL_FRACTION = 0.03;
const ACCENT_MIN_PIXELS = 20;    // too few and the "tail" is noise, not a feature
const ACCENT_CLUSTERS = 3;
const SALIENCE_WEIGHT = 0.6;     // how much chroma counts against prevalence when ordering entries
const LOW_COLOUR_COUNT = 4;

// ⚠️ THE LOW-COLOUR GATE HAS ITS OWN FLOOR, AN ORDER OF MAGNITUDE BELOW CHROMA_FLOOR, AND THAT
// SEPARATION IS THE WHOLE FIX (2026-08-12 14:51 EDT). The restrict used to reuse CHROMA_FLOOR --
// "is any extracted centroid at least this colourful?" -- which put two different questions behind
// one constant. CHROMA_FLOOR answers "is this PIXEL worth putting in the accent pool?", where 0.04 is
// a sensible bar for a small punchy feature. The restrict asks "does this IMAGE have colour at all?",
// and 0.04 is far too high a bar for that: every sepia photograph, brown avatar and olive banner sits
// under it while being unmistakably brown to anyone looking at it.
//
// Measured on the 246-image corpus (local/colors-investigation/lowcolour-gates.mjs): the old gate
// fired on 9 images, and FOUR of them were tinted rather than colourless -- a sepia portrait whose
// candidates topped out at chroma 0.027, two brown avatars at 0.033 and 0.037, a dark olive at 0.017.
// Harkirat's own server avatar was one of them: its structure pool correctly found a real black and
// two dark browns, and the restrict then threw all three away for having no saturation, which is not
// the same fact as having no depth.
//
// 0.01 is not fitted to that corpus. It is the point at which a colour is, by THIS MODULE'S OWN merge
// rule, the same colour as plain grey: MERGE_DELTA_E declares two entries identical below 0.07 of
// OKLab distance, so a tail sitting within 0.01 of the neutral axis is nowhere near a distinguishable
// hue. The corpus then confirms the value is not delicate -- the achromatic images measure 0 to
// 0.0031 and the least colourful genuinely-tinted one measures 0.0213, a 7x empty band around it.
const LOW_COLOUR_CHROMA = 0.01;

// --- THE PAGE LADDER (Harkirat, 2026-08-12 17:30 EDT). A palette may only be 1, 2, 4, 6 or 8 entries
// long, so a second page is never a stub. 1/2/4/6 render on one page; only 8 paginates 4+4.
// Off-rung counts move to the nearest rung that costs least: 3 -> 4, 5 -> 4, 7 -> 8.
//
// ⚠️ AVATAR AND BANNER ONLY. Nameplate and decoration ask for 4 and that is a CEILING, not a quota
// (Harkirat, same conversation) -- their palettes are a deterministic composition (1 bed + 3 art) and
// padding one would invent a colour for a design that simply has fewer. The ladder is therefore gated
// on `count === KMEANS_COUNT` rather than applied to every caller.
//
// ⚠️ THE STRICT 2/4/8 QUOTA THIS REPLACES WAS KILLED BY MEASUREMENT -- do not revive it. Across the 83
// corpus images returning 5/6/7, the honest lever (more seeds, merge threshold untouched) tops out at
// 22/83 and is NON-MONOTONIC (3.0x is worse than 2.5x), and the only setting that reaches 8 for
// everyone is MERGE_DELTA_E 0.04, which puts a perceptually-duplicate pair in all 83 palettes and
// hands back the V3 rewrite's headline win (duplicate pairs 8 -> 0). Those colours are not there.
const PALETTE_RUNGS = new Set([1, 2, 4, 6, 8]);
const LADDER = { 1: 1, 2: 2, 3: 4, 4: 4, 5: 4, 6: 6, 7: 8, 8: 8 };

// Clustering over-asks so the merge has room to fold duplicates without eating the requested count.
// The RETRY factor exists because a count landing off-rung often just means the seeds were spread too
// thinly -- measured over 401 images, 35 of the 72 off-rung ones land on a rung with more seeds ALONE,
// needing nothing manufactured and nothing discarded (7 -> 8 for 20 of 35 sevens, and 6 of 22 fives
// rise to a clean 6).
//
// ⚠️ THE RETRY IS CONDITIONAL, AND THAT IS THE WHOLE POINT. Raising the factor globally would move the
// colours of the 82% of images that are already on a rung, for no benefit. Only an off-rung image
// pays, and it pays in the region of 4ms: MEASURED 2026-08-12 17:48 EDT, the entire clustering phase
// is 4.2ms mean at 1.5x and 7.0ms at 2.5x on a real 256px source. The "palette extraction is 64-183ms"
// figure in the rules file is a whole render phase including fetch and montage pooling -- it is not
// this. There is no CPU argument against the retry; it is noise beside a ~1000ms cold render.
const OVERCLUSTER = 1.5;
const OVERCLUSTER_RETRY = 2.5;

// --- OKLab (Björn Ottosson). Perceptually uniform, so a distance here means what the eye means.
function srgbToLinear(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function linearToSrgb(c) {
    const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255)));
}
function rgbToOklab(r, g, b) {
    const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    return {
        L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    };
}
function oklabToRgb(L, a, bb) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * bb) ** 3;
    return {
        r: linearToSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    };
}
const chromaOf = lab => Math.sqrt(lab.a * lab.a + lab.b * lab.b);
const deltaE = (p, q) => Math.sqrt((p.L - q.L) ** 2 + (p.a - q.a) ** 2 + (p.b - q.b) ** 2);
const dist3 = (p, q) => Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2);

// EVENT-LOOP FIX (2026-07-14, found live): this loop used to run fully synchronously start-to-
// finish -- fine in isolation, but on Render's free-tier shared CPU it was slow enough to block
// Node's single event loop for long stretches. Since this bot is single-process, that meant ANY
// other in-flight Discord interaction (a totally unrelated /manage or /settings click, not just
// another color request) could miss discord.js's 3-second ACK window and die with a 10062 "Unknown
// interaction" while this was still crunching. Fixed by `await`-ing a `setImmediate` after every
// iteration, handing control back to the event loop so a pending deferReply()/deferUpdate() from
// another interaction gets a chance to fire before the next iteration starts. This is now async and
// every caller must await it -- doesn't reduce total CPU time, just stops it from monopolizing the
// loop in one unbroken burst.
const yieldToEventLoop = () => new Promise(resolve => setImmediate(resolve));

// Deterministic FARTHEST-FIRST seeding (Gonzalez traversal) -- the fixed-order analogue of k-means++.
// Start from the pixel nearest the population mean, then repeatedly take the pixel farthest from
// everything picked so far. Every step is a pure function of the input, so the same image always
// produces the same seeds -- which is what "Refresh Colors" change-detection depends on (see the
// determinism note above). This replaces sort-by-hue-and-take-every-nth, which allocated seeds by
// population and starved small distinct regions; see the V3 block above for the measurement.
function seedFarthestFirst(vectors, k) {
    if (vectors.length <= k) return vectors.map(v => ({ ...v }));
    let mx = 0, my = 0, mz = 0;
    for (const v of vectors) { mx += v.x; my += v.y; mz += v.z; }
    const mean = { x: mx / vectors.length, y: my / vectors.length, z: mz / vectors.length };
    let first = vectors[0], bestD = Infinity;
    for (const v of vectors) { const d = dist3(v, mean); if (d < bestD) { bestD = d; first = v; } }
    const seeds = [{ ...first }];
    // `nearest[i]` = distance from pixel i to its closest seed so far, updated incrementally so the
    // whole traversal stays O(n*k) rather than O(n*k²).
    const nearest = vectors.map(v => dist3(v, first));
    for (let s = 1; s < k; s++) {
        let idx = 0, far = -1;
        for (let i = 0; i < vectors.length; i++) if (nearest[i] > far) { far = nearest[i]; idx = i; }
        seeds.push({ ...vectors[idx] });
        for (let i = 0; i < vectors.length; i++) {
            const d = dist3(vectors[i], vectors[idx]);
            if (d < nearest[i]) nearest[i] = d;
        }
    }
    return seeds;
}

// k-means over arbitrary 3-vectors, with the cluster means averaged back in TRUE OKLab (`labs`) even
// when the clustering itself ran in the weighted space. That split matters: the weighting is a tool
// for deciding WHICH pixels group together, and must never distort the colour actually reported.
// `denom` is the full sampled-pixel count, so an accent pool's shares stay comparable to the
// structure pool's rather than each summing to 100% of its own subset.
async function clusterLabs(labs, vectors, k, denom) {
    if (labs.length === 0) return [];
    const centroids = seedFarthestFirst(vectors, Math.min(k, vectors.length));
    const assignments = new Array(vectors.length).fill(0);
    for (let iter = 0; iter < KMEANS_ITERATIONS; iter++) {
        // EARLY-CONVERGENCE (2026-07-14, CPU fix): once no pixel changes cluster the centroid
        // recompute is a no-op and every remaining pass is wasted work. Output is identical.
        let changed = false;
        for (let i = 0; i < vectors.length; i++) {
            let minDist = Infinity, minIdx = 0;
            for (let c = 0; c < centroids.length; c++) {
                const d = dist3(vectors[i], centroids[c]);
                if (d < minDist) { minDist = d; minIdx = c; }
            }
            if (assignments[i] !== minIdx) { assignments[i] = minIdx; changed = true; }
        }
        if (!changed) break;
        const sums = Array.from({ length: centroids.length }, () => ({ x: 0, y: 0, z: 0, n: 0 }));
        for (let i = 0; i < vectors.length; i++) {
            const s = sums[assignments[i]];
            s.x += vectors[i].x; s.y += vectors[i].y; s.z += vectors[i].z; s.n++;
        }
        for (let c = 0; c < centroids.length; c++) {
            if (sums[c].n > 0) centroids[c] = { x: sums[c].x / sums[c].n, y: sums[c].y / sums[c].n, z: sums[c].z / sums[c].n };
        }
        // EVENT-LOOP FIX (2026-07-14) -- see the note on yieldToEventLoop above. Do NOT remove: this
        // is what stops a colour extraction monopolising the loop and killing an unrelated
        // interaction's 3-second ACK window with a 10062.
        await yieldToEventLoop();
    }
    const sums = Array.from({ length: centroids.length }, () => ({ L: 0, a: 0, b: 0, n: 0 }));
    for (let i = 0; i < labs.length; i++) {
        const s = sums[assignments[i]];
        s.L += labs[i].L; s.a += labs[i].a; s.b += labs[i].b; s.n++;
    }
    return sums.filter(s => s.n > 0).map(s => ({ L: s.L / s.n, a: s.a / s.n, b: s.b / s.n, share: s.n / denom }));
}

// Fold entries closer than `dE` in TRUE OKLab into one, weighted by share. Runs AFTER the two pools
// are unioned, deliberately -- a structure cluster and an accent cluster can land on the same colour,
// and deduping per-pool would let that pair straight through.
function mergePerceptual(clusters, dE) {
    const merged = [];
    for (const c of [...clusters].sort((x, y) => y.share - x.share)) {
        const target = merged.find(m => deltaE(c, m) < dE);
        if (target) {
            const total = target.share + c.share;
            target.L = (target.L * target.share + c.L * c.share) / total;
            target.a = (target.a * target.share + c.a * c.share) / total;
            target.b = (target.b * target.share + c.b * c.share) / total;
            target.share = total;
            // Origin is STICKY toward `accent` (2026-08-11 13:45 EDT): if either contributor came from
            // the chromatic tail, the merged colour is still that feature. The label layer uses this to
            // say "this is a small vivid detail" rather than re-deriving it from share and chroma, which
            // cannot distinguish a genuine 1%-coverage accent from a rounding artefact.
            if (c.origin === 'accent') target.origin = 'accent';
        } else {
            merged.push({ ...c });
        }
    }
    return merged;
}

// Returns an array of `{ hex, percent }` sorted by prevalence (most-common first), sliced to at MOST
// Picks `limit` entries that SPAN the lightness axis, holding entries[0] fixed and then repeatedly
// taking whichever remaining entry is farthest in L from everything already chosen. Used only by the
// low-colour restrict, where lightness is the sole axis carrying information -- see the block at that
// call site for the measurement that made it necessary.
//
// This is the same deterministic Gonzalez traversal seedFarthestFirst runs, in one dimension: no
// randomness, so the Refresh Colors button's "did anything actually change?" comparison still holds.
// The chosen set is returned in the INPUT's order rather than in pick order, because that order is a
// contract (index 0) and a ranking (salience) that this function has no business restating.
function spanLightness(entries, limit) {
    if (entries.length <= limit) return entries.slice();
    const chosen = [0];
    while (chosen.length < limit) {
        let best = -1, bestGap = -Infinity;
        for (let i = 1; i < entries.length; i++) {
            if (chosen.includes(i)) continue;
            // Distance to the NEAREST already-chosen entry: maximising it is what spreads the picks
            // out, where maximising distance to the mean would just pile them at both extremes.
            let gap = Infinity;
            for (const c of chosen) gap = Math.min(gap, Math.abs(entries[i].L - entries[c].L));
            if (gap > bestGap) { bestGap = gap; best = i; }
        }
        if (best < 0) break;
        chosen.push(best);
    }
    return chosen.sort((a, b) => a - b).map(i => entries[i]);
}

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
// `source` may be a url, a Buffer, or an ALREADY-DECODED Jimp image. The third case exists because
// utils/animatedMediaPipeline.js's poolFramesIntoMontage builds its montage as a Jimp image and no
// caller ever stores the montage -- PNG-encoding it there just to `Jimp.read` it back here cost ~140ms
// per cold render for a bitmap we already had in memory (measured 2026-08-11 14:56 EDT on a real
// 60-frame decoration). Duck-typed on `.bitmap.data` rather than `instanceof` deliberately: Jimp 1.x
// hands back class instances built through its own plugin wrapper, so an identity check is a
// needlessly brittle way to ask "is this already decoded".
async function extractPalette(img, count, overCluster) {
    const { width, height, data } = img.bitmap;
    const totalPixels = width * height;
    const pixelStep = Math.max(1, Math.floor(totalPixels / 2500));
    const byteStep = pixelStep * 4;

    const labs = [];
    for (let i = 0; i < data.length; i += byteStep) {
        // Same alpha-blindness bug fixed in getDominantColor above -- see that fix's comment.
        if (data[i + 3] === 0) continue;
        labs.push(rgbToOklab(data[i], data[i + 1], data[i + 2]));
    }
    if (labs.length === 0) return [];

    // --- Pool A: structure. Lightness down-weighted so a greyscale ramp cannot monopolise the seeds.
    // Still over-clustered at 1.5x, for the original 2026-07-14 reason: the merge below needs slack to
    // fold genuine duplicates without eating into the requested count.
    const structureVectors = labs.map(o => ({ x: o.L * LIGHTNESS_WEIGHT, y: o.a, z: o.b }));
    const structure = await clusterLabs(labs, structureVectors, Math.ceil(count * overCluster), labs.length);

    // --- Pool B: accent. Only the most chromatic pixels, clustered in TRUE OKLab, so a feature
    // covering ~1% of the image gets its own centroid instead of losing every slot to the background.
    // `tailCut` takes the STRICTER of the relative tail and the absolute floor, which is what makes
    // this self-disabling: a greyscale image has nothing above CHROMA_FLOOR, so `accent` stays empty.
    const chromas = labs.map(chromaOf);
    const ranked = [...chromas].sort((a, b) => b - a);
    // The chroma of the image's most-chromatic 3% of pixels. Hoisted out of tailCut because the
    // low-colour restrict below asks about this same quantity -- and because reading it in one place
    // makes it obvious that the two uses take DIFFERENT floors, which is the point (see
    // LOW_COLOUR_CHROMA's block above).
    const tailChroma = ranked[Math.min(ranked.length - 1, Math.floor(ranked.length * ACCENT_TAIL_FRACTION))];
    const tailCut = Math.max(CHROMA_FLOOR, tailChroma);
    const accentLabs = labs.filter((_, i) => chromas[i] >= tailCut);
    const accent = accentLabs.length >= ACCENT_MIN_PIXELS
        ? await clusterLabs(accentLabs, accentLabs.map(o => ({ x: o.L, y: o.a, z: o.b })), ACCENT_CLUSTERS, labs.length)
        : [];

    // Tagged BEFORE the union so the label layer can tell a small vivid feature (the cat's red eyes)
    // from an ordinary region -- see mergePerceptual for why the tag survives a merge as `accent`.
    const merged = mergePerceptual(
        [...structure.map(c => ({ ...c, origin: 'structure' })), ...accent.map(c => ({ ...c, origin: 'accent' }))],
        MERGE_DELTA_E
    );

    // ⚠️ SHARES MUST BE RECOMPUTED HERE, BECAUSE THE TWO POOLS SHARE PIXELS. Pool B clusters a SUBSET
    // of the pixels Pool A already clustered, so every accent pixel was counted twice and the merge
    // above ADDS the two shares. Measured 2026-08-12 13:15 EDT over a 246-image corpus before this
    // fix: 92 palettes summed past 100%, the worst to 155%, and two single entries reported over 100%
    // -- a share of one image that cannot exist. It is worst on broadly chromatic images, because
    // `tailCut` takes Math.max(CHROMA_FLOOR, percentile): on a vivid picture a large population ties at
    // or above that cut, so "the top 3%" is nothing of the kind.
    //
    // Assigning every sampled pixel to its nearest FINAL centroid counts each one exactly once, which
    // is the only definition of "share of the image" that can be defended. It also repairs the ORDER --
    // `merged.sort` below ranks by share, so a double-counted colour could outrank a genuinely larger
    // one and take index 0, the slot that is a contract ("First Impression").
    // Distance is true, unweighted OKLab, matching mergePerceptual rather than the seeding space:
    // LIGHTNESS_WEIGHT exists to stop a greyscale ramp monopolising SEEDS and has no business deciding
    // which centroid a finished pixel belongs to. Cost is ~2,500 pixels x ~16 centroids, sub-millisecond.
    const counts = new Array(merged.length).fill(0);
    for (const o of labs) {
        let best = 0, bestDist = Infinity;
        for (let i = 0; i < merged.length; i++) {
            const dL = o.L - merged[i].L, da = o.a - merged[i].a, db = o.b - merged[i].b;
            const dist = dL * dL + da * da + db * db;
            if (dist < bestDist) { bestDist = dist; best = i; }
        }
        counts[best]++;
    }
    merged.forEach((c, i) => { c.share = counts[i] / labs.length; });
    merged.sort((a, b) => b.share - a.share);

    // Index 0 stays the most prevalent colour -- utils/colorPaletteView.js's assignDynamicLabels
    // claims index 0 unconditionally -- "First Impression", or "Nameplate Background" on a nameplate -- so that position is a contract, not a
    // preference. Everything after it is re-ordered by prevalence blended with chroma, which is what
    // lifts a small vivid accent onto the FIRST page of the 4+4 pagination rather than the second.
    const head = merged.slice(0, 1);
    const rest = merged.slice(1);
    const maxShare = Math.max(...rest.map(r => r.share), Number.EPSILON);
    const maxChroma = Math.max(...rest.map(chromaOf), Number.EPSILON);
    const salience = e => e.share / maxShare + SALIENCE_WEIGHT * (chromaOf(e) / maxChroma);
    rest.sort((a, b) => salience(b) - salience(a));

    const ordered = [...head, ...rest];

    // --- Soft restrict. Judged on the PIXEL TAIL, not on the extracted centroids, and the change of
    // subject is what fixes it -- LOW_COLOUR_CHROMA's block above has the measurement and the reason.
    // Math.min keeps nameplate/decoration (which already ask for 4) at 4 rather than letting this ever
    // RAISE a count.
    //
    // ⚠️ IT IS ALSO WHAT REMOVES THE BOUNDARY FLIP, and by construction rather than by moving a
    // threshold. `tailChroma` is computed from the sampled pixels before a single centroid exists, so
    // it does not depend on `count` at all; the old test read the extracted candidates, which DO
    // change with the requested count, so the same image could be called colourful at one target and
    // colourless at another. Measured over the corpus at targets 6 and 8: the old gate disagreed with
    // itself on 3 images, this one on 0.
    const isLowColour = tailChroma < LOW_COLOUR_CHROMA;
    const limit = isLowColour ? Math.min(LOW_COLOUR_COUNT, count) : count;

    // ⚠️ WHEN THE RESTRICT FIRES, THE SURVIVORS ARE CHOSEN BY LIGHTNESS COVERAGE, NOT BY SALIENCE --
    // the gate and the truncation were BOTH wrong and fixing only the gate leaves half the bug. On a
    // colourless image the salience blend collapses to prevalence (every chroma term is ~0), so a
    // plain slice returns the four largest regions, which on a greyscale ramp are four neighbouring
    // mid-greys. Measured before this: a black-and-white avatar kept four near-whites and discarded a
    // real black covering 11% of the picture, and another dropped both #000000 (11%) and #111111
    // (17%) to keep two near-identical light greys. Lightness is the ONLY axis carrying information
    // on such an image, so spanning it is the only defensible way to spend four slots.
    //
    // Farthest-first on L, the same Gonzalez traversal seedFarthestFirst already uses -- index 0 is
    // held fixed because it is a contract (see above), then each slot goes to whatever is farthest in
    // lightness from everything already chosen. The winners are then put BACK in salience order, so
    // this changes which entries survive and never the order they arrive in.
    //
    // ⚠️ IT CHOOSES FROM `ordered.slice(0, count)`, NOT FROM ALL OF `ordered`, AND THAT BOUND IS
    // LOAD-BEARING. Clustering over-asks by 50% so the merge has room (see this function's header), so
    // `ordered` normally holds MORE than `count` entries and everything past `count` is surplus the
    // extractor has already ranked out. Handed the unbounded list, this picked #1C1C1C for a
    // black-and-white avatar -- a colour the same image's UNRESTRICTED palette would never show. A
    // soft restrict must return a SUBSET of the full palette; showing fewer colours cannot mean
    // showing different ones. Caught by diffing the restricted output against the unrestricted one,
    // and pinned by scripts/paletteShape.test.js.
    // Returned as OKLab entries, NOT hexes: getColorPalette below may still drop one or add a derived
    // one, and both of those decisions are made in lightness. The conversion happens once, at the end.
    return isLowColour ? spanLightness(ordered.slice(0, count), limit) : ordered.slice(0, limit);
}

// Places a DERIVED swatch in the palette's emptiest lightness gap. Used only when the ladder needs one
// more entry than the picture contains (3 -> 4, 7 -> 8, and only after the retry has failed to find a
// real one).
//
// 📐 THE GAP, NOT A FIXED PERCENTAGE, AND THAT CHOICE IS LOAD-BEARING (Harkirat picked it 2026-08-12
// 17:41 EDT over the alternative). colorPaletteView's `tint`/`shade` mix a fixed 35% toward white or
// black, which DEGENERATES at the extremes: measured, tint(#FFFFFF) and shade(#000000) are no-ops, and
// shade(#270100) lands 0.040 from its base -- below this module's own "same colour" threshold, so the
// panel would show two swatches it elsewhere calls identical. Targeting an EMPTY SLOT cannot degenerate
// that way, because the slot is chosen for being far from everything already present.
//
// 🚫 A BLEND OF TWO EXISTING SWATCHES WAS RULED OUT BY MEASUREMENT, and keeping the antialiasing seams
// is what rules it out: on a flat two-colour image the seam swatch IS the blend of its two neighbours,
// so blending them again reproduces it. Tested on five real corpus cases -- four duplicated an existing
// entry within MERGE_DELTA_E (0.007 / 0.009 / 0.014 / 0.050).
//
// Hue and chroma are borrowed from the nearest existing entry so the result reads as a companion to a
// real colour rather than an unrelated one; only lightness is new. Returns null rather than a
// near-duplicate if the widest gap is still too narrow to hold a distinguishable colour -- showing
// three honest swatches beats showing four when one of them is a twin.
function fillLightnessGap(entries) {
    if (entries.length === 0) return null;
    // Sentinels at 0 and 1 so a palette clustered entirely in the midtones can place its derived entry
    // out at an end, which is usually where the real gap is on such an image.
    const points = [0, ...entries.map(e => e.L).sort((a, b) => a - b), 1];
    let bestGap = -1, at = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const gap = points[i + 1] - points[i];
        if (gap > bestGap) { bestGap = gap; at = (points[i] + points[i + 1]) / 2; }
    }
    const near = entries.reduce((b, e) => Math.abs(e.L - at) < Math.abs(b.L - at) ? e : b);
    const made = { L: at, a: near.a, b: near.b, share: 0, origin: 'derived' };
    // The guard the fixed-percentage version needed and did not have.
    if (entries.some(e => deltaE(e, made) < MERGE_DELTA_E)) return null;
    return made;
}

// Moves a palette onto the nearest page rung -- see PALETTE_RUNGS above for why the rungs are what
// they are and why this is avatar/banner only.
function applyLadder(entries) {
    const target = LADDER[entries.length];
    if (!target || target === entries.length) return entries;
    // Down: keep the salience order and drop the tail. ⚠️ THIS MUST NOT USE spanLightness, and the
    // first version did -- caught 2026-08-12 18:40 EDT by a synthetic control. Lightness coverage is
    // the right rule for a COLOURLESS image, where lightness is the only axis carrying information;
    // applied to a colourful one it discards a small vivid accent for sitting near another swatch in
    // lightness. Measured: a 2% pure red on a beige/brown ground was dropped outright, which is
    // precisely the colour the accent pool exists to surface.
    //
    // Nothing is lost by the simpler rule, because a colourless image never reaches here: the
    // low-colour restrict has already truncated it to LOW_COLOUR_COUNT, which is a rung, so the ladder
    // no-ops on it. Everything that gets this far is colourful, and `entries` is already ordered by
    // prevalence blended with chroma -- the tail is genuinely the least worth keeping.
    if (target < entries.length) return entries.slice(0, target);
    // Up: only ever by one, and only ever appended -- index 0 is a contract and a manufactured colour
    // has no business anywhere but last.
    const made = fillLightnessGap(entries);
    return made ? [...entries, made] : entries;
}

// `source` may be a url, a Buffer, or an already-decoded Jimp image -- decoded ONCE here so a retry
// costs another clustering pass and never another download or decode.
async function getColorPalette(source, count = KMEANS_COUNT) {
    const img = source?.bitmap?.data ? source : await Jimp.read(source);
    let entries = await extractPalette(img, count, OVERCLUSTER);

    // The ladder and its retry are avatar/banner only (see PALETTE_RUNGS). A nameplate or decoration
    // asking for 4 gets whatever its design really has.
    if (count === KMEANS_COUNT && entries.length > 0 && !PALETTE_RUNGS.has(entries.length)) {
        // An off-rung count often just means the seeds were spread too thinly, so look harder BEFORE
        // resorting to manufacturing or discarding. The retry is kept only if it actually lands on a
        // rung -- a retry that returns a different off-rung count is not an improvement, and taking it
        // anyway would make the output depend on which pass happened to run.
        const retried = await extractPalette(img, count, OVERCLUSTER_RETRY);
        if (PALETTE_RUNGS.has(retried.length)) entries = retried;
    }
    const final = count === KMEANS_COUNT ? applyLadder(entries) : entries;

    return final.map(e => {
        const { r, g, b } = oklabToRgb(e.L, e.a, e.b);
        // `origin` is carried out to the label layer, which is the only consumer -- it distinguishes a
        // small vivid FEATURE from an ordinary region, which share and chroma alone cannot, and it is
        // also how a 'derived' entry announces that it is not a measurement of the picture.
        return { hex: (r << 16) | (g << 8) | b, percent: Math.round(e.share * 100), origin: e.origin };
    });
}

// Perceptual distance between two packed RGB hexes. Exported so a caller that composes a palette BY
// HAND can use the same notion of "these are the same colour" the merge step above uses, instead of
// inventing a second threshold in RGB. utils/colorPalette.js's nameplate branch needs exactly this:
// it prepends the bed colour as a known value and must drop any extracted art colour that would
// render as a near-duplicate of it. Compare against MERGE_DELTA_E for consistency.
function perceptualDistanceHex(a, b) {
    const A = rgbToOklab((a >> 16) & 0xff, (a >> 8) & 0xff, a & 0xff);
    const B = rgbToOklab((b >> 16) & 0xff, (b >> 8) & 0xff, b & 0xff);
    return deltaE(A, B);
}

// Per-source swatch counts. Avatar/banner are richer images that support more genuinely distinct
// clusters; nameplate/decoration are smaller, simpler assets that regularly produce fewer real
// clusters even at higher K, so they ask for fewer up front instead of padding to a count the source
// doesn't support.
//
// ⚠️ THIS LIVES HERE SPECIFICALLY SO THERE IS ONE COPY (moved from utils/colorPalette.js 2026-08-11
// 10:25 EDT). The nameplate/decoration WebP caches now extract palettes too, and colorPalette.js
// requires THOSE modules -- so importing the count back from colorPalette.js would close a cycle, and
// the first draft of the palette cache dodged that by declaring its own local `PALETTE_COUNT = 4` in
// each cache module. Three copies of one number, nothing enforcing agreement, and a change to any one
// of them silently producing palettes of different lengths depending on which path ran. colorExtract
// requires none of them, so everyone can import from here instead.
const PALETTE_COUNTS = { avatar: 8, banner: 8, nameplate: 4, decoration: 4 };

// How far the nameplate path over-asks before near-duplicates of the bed are dropped -- see
// composeNameplatePalette. Shared for the same reason as the counts above.
const NAMEPLATE_OVERASK = 2;

// A nameplate's four swatches are ONE bed + THREE from the art (Harkirat 2026-08-11 07:55 EDT).
// Lifted out of utils/colorPalette.js 2026-08-11 10:03 EDT so the permanent palette cache in
// utils/nameplateWebpCache.js composes it IDENTICALLY -- two copies of this rule would eventually
// disagree, and the disagreement would be invisible because each path caches its own result.
//
// The bed is PREPENDED EXACTLY, never extracted: its hex is already known precisely from the design's
// palette metadata, so deriving it from pixels could only approximate a value we hold. Any art colour
// that would render as a near-duplicate of the bed is dropped, which is why the caller must over-ask
// (asking for `wanted + 2`) -- without that headroom a dropped near-duplicate hands back a short
// palette. `percent: 0` on the bed is not a measurement and nothing reads it: the bed's share is a
// design fact, and assignDynamicLabels claims index 0 outright before any percent-based rule runs.
//
// bedHex null (a `none`/unknown palette) means the design's background is already baked into the art,
// so all four slots come from the art untouched and nothing is invented.
function composeNameplatePalette(fullPalette, bedHex, wanted) {
    if (bedHex == null) return fullPalette.slice(0, wanted);
    const art = fullPalette
        .filter(c => perceptualDistanceHex(c.hex, bedHex) >= MERGE_DELTA_E)
        .slice(0, wanted - 1);
    return [{ hex: bedHex, percent: 0 }, ...art];
}

// Wire format for persisting a palette in a Cloudinary resource's `context` metadata (2026-08-11
// 10:03 EDT), so a nameplate/decoration palette is computed once per DESIGN ever rather than once per
// user. Lives here because this module defines the `{ hex, percent }` shape, so it owns how that shape
// round-trips.
//
// ⚠️ Deliberately NOT JSON. Cloudinary encodes context as `key=value|key=value`, so a value containing
// `=` or `|` corrupts the whole map -- and JSON of an array of objects is dense with `{`, `"` and `:`
// with no guarantee about which the encoder escapes. This format uses only hex digits, `:` and `,`:
//
//     RRGGBB:PP[:a],RRGGBB:PP[:a],...
//
// The optional `:a` marks an entry that came from the ACCENT pool, so a cached palette can still be
// labelled "a small vivid detail" rather than losing that distinction on the way to Cloudinary. It is
// optional rather than required so palettes written before it existed still decode.
//
// Returns null for anything malformed rather than a partial palette -- a half-decoded palette would
// render as a real one and be indistinguishable from a correct short result.
function serializePalette(palette) {
    if (!Array.isArray(palette) || palette.length === 0) return null;
    return palette
        .map(c => {
            const base = `${(c.hex >>> 0).toString(16).padStart(6, '0')}:${Math.max(0, Math.round(c.percent ?? 0))}`;
            return c.origin === 'accent' ? `${base}:a` : base;
        })
        .join(',');
}

// 🏷️ WHICH ALGORITHM PRODUCED A STORED PALETTE -- DERIVED FROM THE CODE, NOT FROM A RELEASE NUMBER.
// Written to Cloudinary `context` as `palette_version` beside the palette itself, and checked on every
// read: a palette tagged with anything else is treated as ABSENT, which routes it through the caches'
// existing heal path and re-derives it once, in place. That is the entire invalidation mechanism --
// there is no purge script and none is wanted, since deleting the resource would take the render and
// its `discord_cdn_url` with it.
//
// Why a key is needed at all: the per-design palette cache keys on the ASSET HASH, which never changes
// when the algorithm does -- the same trap `[[feedback_cache_invalidation_on_algorithm_change]]`
// records for the per-user colour caches. Without a key, v3.8.0-pre's montage fix (a real rounding
// correction that moved a swatch by one unit of 255) would have left every already-cached design on
// the old value forever, with nothing in the record saying which value a given entry held.
//
// ⚠️ WHY IT IS A HASH AND NOT A HAND-WRITTEN STRING (Harkirat, 2026-08-11 15:44 EDT, rejecting the
// first design): *"there's a unique versioning for the actual algorithm."* A hand-written release tag
// fails in both directions -- it only moves when someone remembers, so a real change can ship under a
// stale tag with every cached value quietly wrong; and naming it after a release invites bumping it
// every release, re-deriving identical output for nothing. Deriving it from the code removes the human
// from the loop entirely: **shipping v3.9.0, v3.10.0 or any other release does NOT change this value
// and forces no re-derivation.** It moves if and only if the listed code moves.
//
// ⚠️ THE MONTAGE IS PART OF THE ALGORITHM, not a separate concern. Every stored palette here belongs
// to a nameplate or decoration, and both reach the extractor through poolFramesIntoMontage -- so which
// frames are pooled and how they are laid onto the sheet decides the colours as surely as the
// clustering does. Fingerprinting the extractor alone would have missed this release's tile-copy fix,
// which altered a swatch while touching nothing in this file.
//
// What is deliberately NOT in here: `getDominantColor` and the naming/label layers. The first feeds
// the per-user accent caches, which have their own invalidation; the second two are recomputed at
// render time from the stored hexes and so cannot go stale in Cloudinary.
//
// To read the current value: `node -p "require('./utils/colorExtract').PALETTE_ALGO_VERSION"`.
// Ledger (fill in on the way past -- it maps an opaque hash back to a human story):
//   ec022f178423 — as of v3.8.0-pre: two-pool OKLab extractor with farthest-first seeding; montage
//                  tiles copied rather than composited; frame extraction folded in. Entries written
//                  before any marker existed carry none, and are stale by definition -- correctly,
//                  since they predate the rounding fix.
// ⚠️ Each cache combines this with its own FRAME_OPTS, so the value actually stored is NOT this
// string -- see paletteKey below. This is the shared base, not the final key.
const PALETTE_ALGO_VERSION = fingerprint(
    // Everything the extracted values depend on, including the helpers the top-level functions call --
    // a change inside clusterLabs or mergePerceptual never shows up in getColorPalette's own source.
    srgbToLinear, linearToSrgb, rgbToOklab, oklabToRgb, chromaOf, deltaE,
    seedFarthestFirst, clusterLabs, mergePerceptual, spanLightness, fillLightnessGap, applyLadder,
    extractPalette, getColorPalette,
    composeNameplatePalette, perceptualDistanceHex,
    {
        KMEANS_COUNT, KMEANS_ITERATIONS, LIGHTNESS_WEIGHT, MERGE_DELTA_E, CHROMA_FLOOR,
        ACCENT_TAIL_FRACTION, ACCENT_MIN_PIXELS, ACCENT_CLUSTERS, SALIENCE_WEIGHT, LOW_COLOUR_COUNT,
        LOW_COLOUR_CHROMA, OVERCLUSTER, OVERCLUSTER_RETRY, LADDER,
        // A Set does not survive JSON, so it is fingerprinted as its members -- without this a change
        // to which counts count as a rung would move no hash and leave every cached palette stale.
        PALETTE_RUNGS: [...PALETTE_RUNGS].join(','),
        PALETTE_COUNTS, NAMEPLATE_OVERASK
    },
    MONTAGE_FINGERPRINT
);

// The two halves of the context round-trip, kept as one pair so the four call sites (each cache's
// render path and its heal path, times two modules) cannot drift on the key name or the version.
// Returns {} rather than a partial map when there is nothing worth storing, so a caller can spread it
// into a context object unconditionally.
// ⚠️ `extra` is how a CALLER folds its own output-affecting inputs into the key, and both helpers must
// be given the same ones or a freshly-written palette reads back as stale forever. It exists because
// PALETTE_ALGO_VERSION cannot see everything on its own: the ffmpeg fps and decoder flags live in the
// two cache modules and differ per media type (a nameplate is `-c:v libvpx-vp9` at 12fps, a decoration
// `-f apng`), and importing them here would close a cycle -- those modules require this one. Each
// cache passes its FRAME_OPTS, so "which frames existed" is part of the identity of what was stored.
// Symmetry is enforced locally: the write and the read sit in the same module, a few lines apart.
function paletteKey(...extra) {
    return extra.length ? fingerprint(PALETTE_ALGO_VERSION, ...extra) : PALETTE_ALGO_VERSION;
}

function paletteContextFields(palette, ...extra) {
    const serialized = serializePalette(palette);
    return serialized ? { palette: serialized, palette_version: paletteKey(...extra) } : {};
}

// Reads a stored palette back, returning null unless it was produced by the CURRENT algorithm. Null is
// exactly what an absent palette returns, and both caches already treat that as "heal this one" -- so
// stale entries re-derive themselves on next view with no separate migration path to maintain.
function readPaletteContext(custom, ...extra) {
    if (!custom || custom.palette_version !== paletteKey(...extra)) return null;
    return deserializePalette(custom.palette);
}

function deserializePalette(raw) {
    if (typeof raw !== 'string' || !raw) return null;
    const out = [];
    for (const part of raw.split(',')) {
        const m = /^([0-9a-fA-F]{6}):(\d{1,3})(:a)?$/.exec(part.trim());
        if (!m) return null;
        const entry = { hex: parseInt(m[1], 16), percent: parseInt(m[2], 10) };
        if (m[3]) entry.origin = 'accent';
        out.push(entry);
    }
    return out.length ? out : null;
}

// Colourfulness of a packed RGB hex, in OKLab. Exported 2026-08-11 14:00 EDT for the label layer,
// which had been judging "is this colourful?" with HSL saturation and getting nonsense at the
// lightness extremes: `#FDFEFE` (white to any eye) reports HSL s = 0.333 and `#020311` (black)
// reports 0.789, because HSL's denominator collapses as lightness approaches 0 or 1. Chroma has no
// such blow-up, so any threshold expressed in it means the same thing at every lightness.
// ⚠️ Range differs from HSL saturation -- roughly 0 to 0.37 across sRGB, not 0 to 1. A threshold
// copied across from an `s` value without rescaling will be wrong by a factor of about three.
function chromaOfHex(hex) {
    const lab = rgbToOklab((hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff);
    return chromaOf(lab);
}

module.exports = {
    getDominantColor, getColorPalette, perceptualDistanceHex, MERGE_DELTA_E,
    // Exported for scripts/paletteShape.test.js only -- no runtime caller. The low-colour
    // restrict's every failure is silent (a palette that is merely SHORT looks exactly like a palette
    // of a simple image), so the selection rule is tested directly rather than inferred from output.
    spanLightness, LOW_COLOUR_CHROMA, LOW_COLOUR_COUNT,
    fillLightnessGap, applyLadder, PALETTE_RUNGS, LADDER,
    composeNameplatePalette, serializePalette, deserializePalette,
    paletteContextFields, readPaletteContext, PALETTE_ALGO_VERSION,
    PALETTE_COUNTS, NAMEPLATE_OVERASK, chromaOfHex
};
