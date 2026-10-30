// utils/cloudinaryCache.js
// ==========================================
// DRAW IMAGE CLOUDINARY CACHE
// ==========================================
// Problem: draw thumbnail URLs are often hosted externally (Facebook, etc.), and those platforms sometimes remove/expire the image later, leaving a broken "image failed to load" placeholder in the /draws command. This re-hosts every provided thumbnail into this bot's own Cloudinary account so the command keeps working even after the original source goes dark.
//
// ONE PERMANENT FOLDER, `draws/` (Harkirat, 2026-10-30 16:02 EDT: "the images will remain forever in a draws/ folder, with an image linked to a draw. which means a new image if provided will override the previous one"). It replaced `temp_draws/`, whose images expired after 45 days and were archived to `archive/draws/`: nothing here expires, archives or deletes a draw image any more, and a replaced image is overwritten in place with no copy kept. scripts/backfillDrawImages.js moves what is left in `temp_draws/` and `archive/draws/` into `draws/`; until that has run, lookups still find the legacy `temp_draws/` copy (LEGACY_FOLDER).
//
// A DRAW IS LINKED TO ITS IMAGE BY WHAT IT CONTAINS, not only by its title (his ask, the same day: "even if the draw name is slightly modified/edited, as long the items and rarity and stuff also match ... we can then just re-use the same image"). Every upload carries Cloudinary tags and context: `dioreo_draw`, `fp_<fingerprint>` (a hash of the draw's sorted tier+item-name keys), and the title, price type and item keys. A draw with no image of its own is matched like this, first hit wins:
//   1. its title's slug, `draws/<slug>`                               (exact, the original rule)
//   2. the same fingerprint: same items at the same rarities           (title may differ; price type is a veto only when BOTH sides name one)
//   3. a title within 0.75 character similarity                        (the 2026-07-31 fuzzy rule, unchanged)
// Only 1 and 2 are certain; a near-miss on items (60% or more shared, same price type) is never reused, only named in the error so the admin can see which draw it looks like (utils/cloudinaryCache.js closestDrawImage).
//
// Distinct from utils/loadoutRender.js's Cloudinary usage -- that file only ever builds URL strings for images an admin already uploaded to Cloudinary by hand (bare key or full URL). This module is the first place in the bot that actually calls Cloudinary's upload API itself.
const crypto = require('crypto');
const cloudinary = require('./cloudinaryClient'); // timed proxy over the SDK -- see utils/cloudinaryClient.js

// The Cloudinary Node SDK auto-configures itself from process.env.CLOUDINARY_URL the moment it's required -- no explicit cloudinary.config() call needed. This just fails loudly at boot if that env var is missing, instead of every upload silently failing later with an opaque auth error.
if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- draw thumbnail caching will fail on every attempt.');
}

const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');
const { withDeliveryDefaults } = require('./cloudinaryDeliveryUrl');

const FOLDER = 'draws';
// The folder draw images lived in until 2026-10-30 16:17 EDT. Read as a fallback until scripts/backfillDrawImages.js has moved everything out of it; nothing is ever written there now.
const LEGACY_FOLDER = 'temp_draws';
const DRAW_TAG = 'dioreo_draw';
const FP_TAG_PREFIX = 'fp_';
// Cloudinary context values are short; past this the item keys are left off (the fingerprint tag alone still gives an exact match).
const CONTEXT_KEYS_MAX = 900;
// Items shared (of all items either draw has) at which a near-miss is named in the error. Never used to reuse an image.
const SUGGEST_SIMILARITY = 0.6;

// SECURITY: never log a raw Cloudinary error object directly -- caught live during review, the Admin API's rejected-promise shape is `{ request_options: { ..., auth: 'api_key:api_secret' }, error: { message, http_code } }`, meaning `console.error('...', err)` (or any fallback like `err.message || err`, which still logs the whole object when `.message` is missing) prints the account's live API key AND secret in plaintext straight to the console/log aggregator. These two helpers are the ONLY sanctioned way to read a Cloudinary error anywhere in this file -- the upload API's errors carry `.message`/`.http_code` directly, while the Admin API's (used by `getCachedUrl`) nest them one level under `.error` instead, so both shapes need checking.
function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}
function errorHttpCode(err) {
    return err?.http_code ?? err?.error?.http_code ?? null;
}

// Turns a draw title into a Cloudinary-safe public_id -- lowercase, non-alphanumeric collapsed to a single hyphen, no leading/trailing hyphens. Reused as the cache KEY for both upload and lookup, so "Shadow and Shade" always maps to the same asset regardless of how many times it's re-cached.
function slugify(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'untitled';
}

function publicIdFor(title) {
    return `${FOLDER}/${slugify(title)}`;
}
function legacyPublicIdFor(title) {
    return `${LEGACY_FOLDER}/${slugify(title)}`;
}
// draws/molten-fusion-draw -> molten-fusion-draw, from either folder.
function slugOf(publicId) {
    return String(publicId || '').split('/').pop();
}

// ==========================================
// FINGERPRINT: what makes two draws the same draw
// ==========================================
// An item is its rarity and its name with everything but letters and digits removed, so a different dash, a changed case or a doubled space is not a different item. A `comment` line ("Acquire Both Terminators to Unlock...") is a note about the draw and is edited freely, so it never counts.
const normaliseItemName = name => String(name || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

function itemKeys(items) {
    const keys = new Set();
    for (const item of items || []) {
        if (!item || item.tier === 'comment') continue;
        const name = normaliseItemName(item.name);
        if (name) keys.add(`${item.tier || ''}:${name}`);
    }
    return [...keys].sort();
}

// Null when the draw has no items to go by (an image then can only be matched by its title).
function drawFingerprint(draw) {
    const keys = itemKeys(draw?.items);
    if (!keys.length) return null;
    return crypto.createHash('sha1').update(keys.join('|')).digest('hex').slice(0, 16);
}

// Shared items out of every item either side has (Jaccard), so a draw with one extra item scores below one with the same items.
function drawSimilarity(aKeys, bKeys) {
    const a = new Set(aKeys);
    const b = new Set(bKeys);
    let shared = 0;
    for (const k of a) if (b.has(k)) shared++;
    const union = a.size + b.size - shared;
    return { shared, total: Math.max(a.size, b.size), score: union ? shared / union : 0 };
}

// Two price types disagree only when BOTH name one: a draw added before types existed, or typed later, still matches.
const priceTypesAgree = (a, b) => !a || !b || a === b;

// The tags and context an upload carries. `items` is left off when it would not fit.
function metadataFor(title, draw) {
    const fp = drawFingerprint(draw);
    const keys = itemKeys(draw?.items).join(',');
    const context = { title: String(title) };
    if (draw?.priceType) context.price_type = String(draw.priceType);
    if (fp) context.fp = fp;
    if (keys && keys.length <= CONTEXT_KEYS_MAX) context.items = keys;
    return { fp, tags: fp ? [DRAW_TAG, `${FP_TAG_PREFIX}${fp}`] : [DRAW_TAG], context };
}

// What an asset from the Admin API says about its draw: { title, priceType, fp, keys[] }. `context.custom` is where Cloudinary puts it.
function readDrawContext(asset) {
    const custom = asset?.context?.custom || asset?.context || {};
    return {
        title: custom.title || slugOf(asset?.public_id).replace(/-/g, ' '),
        priceType: custom.price_type || '',
        fp: custom.fp || null,
        keys: custom.items ? String(custom.items).split(',').filter(Boolean) : [],
    };
}

// Same in-memory memo pattern as utils/nameplateWebpCache.js/utils/decorationWebpCache.js's resolvedCache -- this is the identical `cloudinary.api.resource()` Admin API call measured live at 138-470ms per call on that pair (db-deferred-list.md, 2026-08-10), paid on every single lookup even though the result never changes once cached. Populated on both a cache-read hit (getCachedUrl) and right after a fresh upload (cacheThumbnail), so a same-process re-lookup right after a save never round-trips to Cloudinary at all. Only successful resolutions are memoized -- a 404 miss is NOT cached, since cacheThumbnail can create the resource moments later and a cached miss would then shadow it.
//
// ⚠️ Same caveat as the WebP caches (db-deferred-list.md): this Map is never invalidated by an out-of-band change made directly in the Cloudinary dashboard, only by THIS module's own writes. A manual dashboard re-upload/delete of a draws/ asset needs a bot restart to be picked up by a long-running process that already resolved it once.
const resolvedCache = new Map();
const RESOLVED_CACHE_MAX = 128;
function memoizeResolved(publicId, url) {
    if (resolvedCache.size >= RESOLVED_CACHE_MAX) resolvedCache.delete(resolvedCache.keys().next().value);
    resolvedCache.set(publicId, url);
}
// fingerprint -> { publicId, url, title, priceType }, successes only, for the same reason.
const fingerprintCache = new Map();

// Finds the image already linked to this draw's fingerprint, in draws/ first. Never throws; a Cloudinary hiccup is "no match", like every lookup in this file.
async function findByFingerprint(draw) {
    const fp = drawFingerprint(draw);
    if (!fp) return null;
    const hit = fingerprintCache.get(fp);
    if (hit && priceTypesAgree(hit.priceType, draw.priceType)) return hit;
    try {
        const page = await cloudinary.api.resources_by_tag(`${FP_TAG_PREFIX}${fp}`, { context: true, max_results: 50 });
        const found = (page.resources || [])
            .filter(a => priceTypesAgree(readDrawContext(a).priceType, draw.priceType))
            // draws/ before a legacy copy, then the newest image.
            .sort((x, y) => (Number(y.public_id.startsWith(`${FOLDER}/`)) - Number(x.public_id.startsWith(`${FOLDER}/`))) || (new Date(y.created_at) - new Date(x.created_at)))[0];
        if (!found) return null;
        const ctx = readDrawContext(found);
        const result = { publicId: found.public_id, url: withDeliveryDefaults(found.secure_url), title: ctx.title, priceType: ctx.priceType };
        fingerprintCache.set(fp, result);
        return result;
    } catch (err) {
        if (errorHttpCode(err) !== 404) console.error(`Cloudinary fingerprint lookup failed: ${safeErrorMessage(err)}`);
        return null;
    }
}

// Writes a draw's tags and context onto an image that is already there, so an image reused by title keeps pointing at the draw it now belongs to (its items may have changed since it was first uploaded). Skipped when they already say so. Never throws.
async function linkDrawMetadata(publicId, title, draw) {
    const { fp, tags, context } = metadataFor(title, draw);
    if (!fp) return false;
    if (isCloudinaryWriteBlocked('draw metadata', publicId)) return false;
    try {
        // A title match on a legacy temp_draws/ copy has nothing at draws/<slug> yet: the backfill tags it when it moves it, so this is not an error.
        const found = await cloudinary.api.resource(publicId, { context: true }).catch(err => { if (errorHttpCode(err) === 404) return null; throw err; });
        if (!found) return false;
        const current = readDrawContext(found);
        if (current.fp === fp && current.title === context.title && current.priceType === (context.price_type || '')) return false;
        if (current.fp && current.fp !== fp) await cloudinary.uploader.remove_tag(`${FP_TAG_PREFIX}${current.fp}`, [publicId]);
        await cloudinary.uploader.add_tag(tags.join(','), [publicId]);
        await cloudinary.uploader.add_context(Object.entries(context).map(([k, v]) => `${k}=${v}`).join('|'), [publicId]);
        fingerprintCache.delete(fp);
        return true;
    } catch (err) {
        console.error(`Cloudinary draw metadata failed for "${title}": ${safeErrorMessage(err)}`);
        return false;
    }
}

// Uploads a REMOTE url straight into Cloudinary -- Cloudinary fetches the bytes itself server-side, the bot never downloads the image locally. `overwrite: true` means re-adding/replacing the same draw with a NEW url replaces the stored file in place (his rule, 2026-10-30: a new image overrides the previous one), and nothing is archived: there is no copy of the old image any more. Never throws -- upload failure (source URL already dead, network hiccup, etc.) is a normal, expected case this feature exists to route around, not a reason to block the draw from saving at all.
//
// WHICH IMAGE IT REPLACES: only ever the title's own `draws/<slug>`. A replaced image is gone for good (no archive copy any more), so an upload must never land on another draw's asset: two draws that are both live can share the same items, and art given to one would have overwritten the other's. A renamed draw therefore gets its own asset, and the items link follows the NEWEST image carrying them (findByFingerprint sorts newest first); the old asset stays, unreferenced and harmless. `draw` is { items, priceType }; without it only the title can link.
async function cacheThumbnail(title, sourceUrl, draw = null) {
    const publicId = publicIdFor(title);
    // Dev bot shares prod's Cloudinary credentials. Returning the same shape as the catch block below means resolveThumbnail() falls back to the raw URL exactly as it does for a real upload failure, so a draw still saves in dev -- it just isn't re-hosted.
    if (isCloudinaryWriteBlocked('upload', publicId)) {
        return { url: null, cached: false, error: 'blocked: dev bot may not write to the live Cloudinary account' };
    }
    try {
        const meta = draw ? metadataFor(title, draw) : null;
        // Replacing an image that carries another fingerprint: its old tag must go, or the old items would still find this image.
        if (meta) {
            const old = await cloudinary.api.resource(publicId, { context: true }).then(readDrawContext).catch(() => null);
            if (old?.fp && old.fp !== meta.fp) await cloudinary.uploader.remove_tag(`${FP_TAG_PREFIX}${old.fp}`, [publicId]).catch(() => {});
        }
        const result = await cloudinary.uploader.upload(sourceUrl, {
            public_id: publicId, // the folder is baked into this path (draws/{slug})
            // BUG FIX (found live, 2026-07-19): the folder prefix above is baked into the public_id string, but Cloudinary's newer "Folder" UI (asset_folder, a separate metadata field decoupled from the public_id path) never got told about it -- every draw thumbnail was uploading correctly and resolving correct URLs, but Cloudinary's own dashboard showed them all sitting in the root "Home" folder instead of grouped. Explicitly setting asset_folder fixes this without touching the public_id shape (so no existing URL in MongoDB is affected).
            asset_folder: FOLDER,
            overwrite: true,
            invalidate: true,
            resource_type: 'image',
            ...(meta ? { tags: meta.tags, context: meta.context } : {})
        });
        const url = withDeliveryDefaults(result.secure_url);
        // Populate the memo right away -- `overwrite: true` means this may be replacing whatever getCachedUrl had previously memoized under this same public_id, so this write must win.
        memoizeResolved(publicId, url);
        if (meta?.fp) fingerprintCache.set(meta.fp, { publicId, url, title: String(title), priceType: draw.priceType || '' });
        return { url, cached: true, error: null };
    } catch (err) {
        const message = safeErrorMessage(err);
        console.error(`Cloudinary cache upload failed for "${title}" (${sourceUrl}): ${message}`);
        return { url: null, cached: false, error: message };
    }
}

// Looks up whatever's already cached under this title's slug, without uploading anything -- used when a draw is re-added/replaced with NO new URL given, per Harkirat's spec ("assuming the url field is not provided again ... automatically use that"). draws/ first, then the legacy folder. Cloudinary's Admin API 404s when the resource doesn't exist, which the SDK surfaces as a rejected promise -- treated as "not found", not a real error, since that's the expected, common case for a draw that's never been cached yet.
async function getCachedUrl(title) {
    for (const publicId of [publicIdFor(title), legacyPublicIdFor(title)]) {
        if (resolvedCache.has(publicId)) return resolvedCache.get(publicId);
        try {
            const result = await cloudinary.api.resource(publicId);
            const url = withDeliveryDefaults(result.secure_url);
            memoizeResolved(publicId, url);
            return url;
        } catch (err) {
            // NOTE (fixed during review): the Admin API's error nests http_code under `.error`, not on the caught object directly -- `err.http_code` is always undefined here, so an unguarded `!== 404` check logged EVERY lookup miss (the expected, common "never cached yet" case) as if it were a real failure. errorHttpCode() checks both shapes.
            if (errorHttpCode(err) !== 404) {
                console.error(`Cloudinary cache lookup failed for "${title}": ${safeErrorMessage(err)}`);
                return null;
            }
        }
    }
    return null;
}

/**
 * Single entry point every draw-save site calls. `providedUrl` is whatever the admin actually typed (already resolved to a full URL by adminParser.js if it was a bare Cloudinary key) -- or null/empty if they left it blank, which means "reuse whatever's already cached for this draw" rather than being rejected as missing input (see adminParser.js's parseBulkDrawList + manage.js's buildAddDrawModal for the blank-means-reuse convention). `draw` is { items, priceType } when the caller has them: it is what lets a renamed draw find its image by its items.
 *
 * Returns { url, cached, error, reused, matchedTitle, matchedBy }:
 * - Provided a URL, caching succeeded -> { url: <cloudinary url>, cached: true, error: null, reused: false }
 * - Provided a URL, caching failed -> { url: <original url>, cached: false, error: <message>, reused: false } (falls back to the raw external URL rather than blocking the save -- exactly the failure mode this feature is meant to reduce, but a save must never hard-fail just because Cloudinary hiccuped)
 * - No URL provided, found a match -> { url: <cloudinary url>, cached: true, error: null, reused: true, matchedBy: 'title' | 'items' | 'similar-title' } (matchedTitle names the draw it came from unless the title is the same)
 * - No URL provided, nothing cached -> { url: null, cached: false, error: 'No URL provided and no cached image found...', reused: false } (caller MUST treat this as a real validation error -- there is nothing to show a thumbnail with; the message names the closest draw by items when one is close)
 */
async function resolveThumbnail(title, providedUrl, draw = null) {
    if (providedUrl && providedUrl.trim()) {
        const result = await cacheThumbnail(title, providedUrl.trim(), draw);
        if (result.cached) return { url: result.url, cached: true, error: null, reused: false };
        return { url: providedUrl.trim(), cached: false, error: result.error, reused: false };
    }

    // 1. The title's own slug.
    const exactUrl = await getCachedUrl(title);
    if (exactUrl) {
        if (draw) await linkDrawMetadata(publicIdFor(title), title, draw);
        return { url: exactUrl, cached: true, error: null, reused: true, matchedTitle: null, matchedBy: 'title' };
    }

    // 2. The same items at the same rarities, under whatever title it had.
    if (draw) {
        const linked = await findByFingerprint(draw);
        if (linked) return { url: linked.url, cached: true, error: null, reused: true, matchedTitle: linked.title, matchedBy: 'items' };
    }

    // 3. Fuzzy title (added 2026-07-31 17:20 EDT, Harkirat's request) -- an exact-slug miss no longer means "nothing cached", it means "try a near-match first". A typo or a slight rewording of the same draw's title used to silently fail this lookup and force a fresh upload of the exact same image under a second public_id.
    const match = await getCachedUrlFuzzy(title);
    if (match) return { url: match.url, cached: true, error: null, reused: true, matchedTitle: match.exact ? null : match.matchedTitle, matchedBy: match.exact ? 'title' : 'similar-title' };

    let error = 'No URL provided and no cached image found for this draw name.';
    if (draw) {
        const near = await closestDrawImage(draw);
        if (near) error += ` Closest by items: "${near.title}" (${near.shared} of ${near.total} the same), not reused: send its image, or give this draw that title.`;
    }
    return { url: null, cached: false, error, reused: false };
}

// Character-level similarity (Levenshtein-based), NOT utils/search.js's word-overlap isSameDrawTitle -- that one is built for reworded/extra-word title variants of the SAME draw (“same content, different wording”), which is the wrong tool for "same title, off by a typo or a small tweak." Plain iterative Levenshtein (no recursion, no external dep) is plenty fast at title-length strings.
function levenshteinDistance(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prevRow = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
        const currRow = [i];
        for (let j = 1; j <= n; j++) {
            currRow[j] = a[i - 1] === b[j - 1]
                ? prevRow[j - 1]
                : 1 + Math.min(prevRow[j - 1], prevRow[j], currRow[j - 1]);
        }
        prevRow = currRow;
    }
    return prevRow[n];
}

function titleSimilarity(a, b) {
    const maxLen = Math.max(a.length, b.length) || 1;
    return 1 - levenshteinDistance(a, b) / maxLen;
}

// "~90%... or something similar as per your judgement" (Harkirat's own framing) -- 0.75 rather than a literal 0.9, since "slightly adjust it" (his own example) reads as more than single-character typo tolerance: a short added/removed word on a longer title already drops below 90% similarity on a plain edit-distance ratio, and this is matching against the ADMIN'S OWN prior title, a low-risk surface (worst case on a false match is reusing the wrong-but-still-real cached thumbnail, not corrupting data) -- worth erring toward matching over missing.
const FUZZY_SIMILARITY_THRESHOLD = 0.75;

// Best-effort near-match against everything cached (draws/ and the legacy folder) -- only runs on an exact-slug miss (getCachedUrl already covers the common case with a single direct lookup, no need to list-scan every time). Never throws; a Cloudinary listing hiccup here degrades to "no match" exactly like a real miss, same fail-open philosophy as every other lookup in this file.
async function getCachedUrlFuzzy(title) {
    const exactUrl = await getCachedUrl(title);
    if (exactUrl) return { url: exactUrl, matchedTitle: title, exact: true };

    try {
        const targetSlug = slugify(title);
        const assets = await listCachedAssets();
        let best = null;
        let bestScore = 0;
        for (const asset of assets) {
            const score = titleSimilarity(targetSlug, slugOf(asset.public_id));
            if (score > bestScore) { bestScore = score; best = asset; }
        }
        if (best && bestScore >= FUZZY_SIMILARITY_THRESHOLD) {
            return {
                url: withDeliveryDefaults(best.secure_url),
                matchedTitle: slugOf(best.public_id).replace(/-/g, ' '),
                exact: false,
                score: bestScore
            };
        }
        return null;
    } catch (err) {
        console.error(`Cloudinary fuzzy thumbnail lookup failed for "${title}": ${safeErrorMessage(err)}`);
        return null;
    }
}

// Lists every draw image (draws/, then the legacy folder until the backfill empties it) with its context -- paginates via next_cursor since Cloudinary caps a single resources() call at 500.
async function listCachedAssets({ folders = [FOLDER, LEGACY_FOLDER] } = {}) {
    const assets = [];
    for (const folder of folders) {
        let nextCursor = undefined;
        do {
            const page = await cloudinary.api.resources({
                type: 'upload',
                prefix: `${folder}/`,
                max_results: 500,
                context: true,
                next_cursor: nextCursor
            });
            assets.push(...page.resources);
            nextCursor = page.next_cursor;
        } while (nextCursor);
    }
    return assets;
}

// The cached draw whose items overlap this one's most, for the error that names it. Pure over `assets` (as listCachedAssets returns them) so a test needs no Cloudinary; null below SUGGEST_SIMILARITY, or when the price types disagree. Never an image to reuse.
function pickClosest(draw, assets) {
    const mine = itemKeys(draw?.items);
    if (!mine.length) return null;
    let best = null;
    for (const asset of assets) {
        const ctx = readDrawContext(asset);
        if (!ctx.keys.length || !priceTypesAgree(ctx.priceType, draw.priceType)) continue;
        const sim = drawSimilarity(mine, ctx.keys);
        if (sim.score >= SUGGEST_SIMILARITY && (!best || sim.score > best.score)) best = { ...sim, title: ctx.title, publicId: asset.public_id };
    }
    return best;
}
async function closestDrawImage(draw) {
    try {
        return pickClosest(draw, await listCachedAssets());
    } catch (err) {
        console.error(`Cloudinary closest-draw lookup failed: ${safeErrorMessage(err)}`);
        return null;
    }
}

module.exports = {
    slugify, publicIdFor, legacyPublicIdFor, slugOf, cacheThumbnail, getCachedUrl, resolveThumbnail, listCachedAssets,
    itemKeys, drawFingerprint, drawSimilarity, priceTypesAgree, metadataFor, readDrawContext, pickClosest, findByFingerprint, linkDrawMetadata,
    FOLDER, LEGACY_FOLDER, DRAW_TAG, FP_TAG_PREFIX, SUGGEST_SIMILARITY
};
