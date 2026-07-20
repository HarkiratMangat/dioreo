// utils/cloudinaryCache.js
// ==========================================
// DRAW THUMBNAIL CLOUDINARY CACHE
// ==========================================
// Problem: draw thumbnail URLs are often hosted externally (Facebook, etc.), and those platforms
// sometimes remove/expire the image later, leaving a broken "image failed to load" placeholder in
// the /draws command. This re-hosts every provided thumbnail into this bot's own Cloudinary account
// (folder `temp_draws/`) so the command keeps working even after the original source goes dark.
//
// Distinct from utils/loadoutRender.js's Cloudinary usage -- that file only ever builds URL strings
// for images an admin already uploaded to Cloudinary by hand (bare key or full URL). This module is
// the first place in the bot that actually calls Cloudinary's upload/delete API itself.
//
// Cloudinary has NO native per-asset TTL/auto-expiry (confirmed against the current cloudinary_npm
// docs before building this -- don't assume otherwise if you revisit this). Time-based cleanup is
// therefore done by us: pruneExpiredThumbnails() below, run on a schedule (see index.js's
// handleBotReady), not something Cloudinary does on its own.
const cloudinary = require('cloudinary').v2;

// The Cloudinary Node SDK auto-configures itself from process.env.CLOUDINARY_URL the moment it's
// required -- no explicit cloudinary.config() call needed. This just fails loudly at boot if that
// env var is missing, instead of every upload silently failing later with an opaque auth error.
if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- draw thumbnail caching will fail on every attempt.');
}

const FOLDER = 'temp_draws';
const EXPIRY_DAYS = 45;

// SECURITY: never log a raw Cloudinary error object directly -- caught live during review, the
// Admin API's rejected-promise shape is `{ request_options: { ..., auth: 'api_key:api_secret' },
// error: { message, http_code } }`, meaning `console.error('...', err)` (or any fallback like
// `err.message || err`, which still logs the whole object when `.message` is missing) prints the
// account's live API key AND secret in plaintext straight to the console/log aggregator. These two
// helpers are the ONLY sanctioned way to read a Cloudinary error anywhere in this file -- the
// upload API's errors carry `.message`/`.http_code` directly, while the Admin API's (used by
// `getCachedUrl`) nest them one level under `.error` instead, so both shapes need checking.
function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}
function errorHttpCode(err) {
    return err?.http_code ?? err?.error?.http_code ?? null;
}

// Turns a draw title into a Cloudinary-safe public_id -- lowercase, non-alphanumeric collapsed to a
// single hyphen, no leading/trailing hyphens. Reused as the cache KEY for both upload and lookup, so
// "Shadow and Shade" always maps to the same asset regardless of how many times it's re-cached.
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

// Uploads a REMOTE url straight into Cloudinary -- Cloudinary fetches the bytes itself server-side,
// the bot never downloads the image locally. `overwrite: true` means re-adding/replacing the same
// draw with a NEW url replaces the cached file in place (same public_id), matching Harkirat's spec
// ("if a new URL is provided, it deletes and overrides the file saved on cloudinary with that same
// file name") without a separate explicit delete step first. Never throws -- upload failure (source
// URL already dead, network hiccup, etc.) is a normal, expected case this feature exists to route
// around, not a reason to block the draw from saving at all.
async function cacheThumbnail(title, sourceUrl) {
    try {
        const result = await cloudinary.uploader.upload(sourceUrl, {
            public_id: publicIdFor(title), // folder is baked into this path (temp_draws/{slug})
            // BUG FIX (found live, 2026-07-19): the `temp_draws/` prefix above is baked into the
            // public_id string, but Cloudinary's newer "Folder" UI (asset_folder, a separate metadata
            // field decoupled from the public_id path) never got told about it -- every draw thumbnail
            // was uploading correctly and resolving correct URLs, but Cloudinary's own dashboard showed
            // them all sitting in the root "Home" folder instead of grouped, which is exactly what
            // confused Harkirat when browsing the account directly. Explicitly setting asset_folder
            // fixes this going forward without touching the public_id shape (so no existing URL in
            // MongoDB is affected) -- the ~12 pre-existing assets that predated this fix were moved into
            // a real temp_draws/ folder by hand, one time, via the Cloudinary MCP tool's asset-update.
            asset_folder: FOLDER,
            overwrite: true,
            invalidate: true,
            resource_type: 'image'
        });
        return { url: result.secure_url, cached: true, error: null };
    } catch (err) {
        const message = safeErrorMessage(err);
        console.error(`Cloudinary cache upload failed for "${title}" (${sourceUrl}): ${message}`);
        return { url: null, cached: false, error: message };
    }
}

// Looks up whatever's already cached under this title's slug, without uploading anything -- used
// when a draw is re-added/replaced with NO new URL given, per Harkirat's spec ("assuming the url
// field is not provided again ... automatically use that"). Cloudinary's Admin API 404s when the
// resource doesn't exist, which the SDK surfaces as a rejected promise -- treated as "not found",
// not a real error, since that's the expected, common case for a draw that's never been cached yet.
async function getCachedUrl(title) {
    try {
        const result = await cloudinary.api.resource(publicIdFor(title));
        return result.secure_url;
    } catch (err) {
        // NOTE (fixed during review): the Admin API's error nests http_code under `.error`, not on
        // the caught object directly -- `err.http_code` is always undefined here, so an unguarded
        // `!== 404` check logged EVERY lookup miss (the expected, common "never cached yet" case) as
        // if it were a real failure. errorHttpCode() checks both shapes.
        if (errorHttpCode(err) !== 404) {
            console.error(`Cloudinary cache lookup failed for "${title}": ${safeErrorMessage(err)}`);
        }
        return null;
    }
}

/**
 * Single entry point every draw-save site calls. `providedUrl` is whatever the admin actually typed
 * (already resolved to a full URL by adminParser.js if it was a bare Cloudinary key) -- or null/empty
 * if they left it blank, which now means "reuse whatever's already cached for this title" rather
 * than being rejected as missing input (see adminParser.js's parseBulkDrawList + manage.js's
 * buildAddDrawModal for the blank-means-reuse convention).
 *
 * Returns { url, cached, error, reused }:
 * - Provided a URL, caching succeeded -> { url: <cloudinary url>, cached: true, error: null, reused: false }
 * - Provided a URL, caching failed -> { url: <original url>, cached: false, error: <message>, reused: false }
 *   (falls back to the raw external URL rather than blocking the save -- exactly the failure mode
 *   this feature is meant to reduce, but a save must never hard-fail just because Cloudinary hiccuped)
 * - No URL provided, found a cached match -> { url: <cloudinary url>, cached: true, error: null, reused: true }
 * - No URL provided, nothing cached -> { url: null, cached: false, error: 'no cached image found', reused: false }
 *   (caller MUST treat this as a real validation error -- there is nothing to show a thumbnail with)
 */
async function resolveThumbnail(title, providedUrl) {
    if (providedUrl && providedUrl.trim()) {
        const result = await cacheThumbnail(title, providedUrl.trim());
        if (result.cached) return { url: result.url, cached: true, error: null, reused: false };
        return { url: providedUrl.trim(), cached: false, error: result.error, reused: false };
    }

    const cachedUrl = await getCachedUrl(title);
    if (cachedUrl) return { url: cachedUrl, cached: true, error: null, reused: true };
    return { url: null, cached: false, error: 'No URL provided and no cached image found for this draw name.', reused: false };
}

// Lists every asset currently sitting in temp_draws/ -- paginates via next_cursor since Cloudinary
// caps a single resources() call at 500, though the draws collection is nowhere near that size today.
async function listCachedAssets() {
    const assets = [];
    let nextCursor = undefined;
    do {
        const page = await cloudinary.api.resources({
            type: 'upload',
            prefix: `${FOLDER}/`,
            max_results: 500,
            next_cursor: nextCursor
        });
        assets.push(...page.resources);
        nextCursor = page.next_cursor;
    } while (nextCursor);
    return assets;
}

/**
 * Deletes cached thumbnails that are BOTH 45+ days old AND no longer referenced by any current draw
 * -- Harkirat's confirmed rule (not a strict age-only cutoff), so a long-lived draw's image never
 * silently disappears from the command just because it's been up for a while. `currentUrls` is a
 * Set of every thumbnailUrl actually in use right now (newDraws + returningDraws combined) --
 * callers build this from SeasonalData themselves, since this module stays model-agnostic (matches
 * every other utils/ file's convention of not importing Mongoose models directly).
 */
async function pruneExpiredThumbnails(currentUrls) {
    // NOTE (fixed during review): the whole body is wrapped here now -- listCachedAssets() had no
    // try/catch of its own, so a Cloudinary error from IT used to propagate all the way up to
    // index.js's runCloudinaryCleanup(), which logged it with the same `error.message || error`
    // anti-pattern this file's other catch blocks were just fixed for -- printing the raw error
    // object (API key + secret in `request_options.auth`) straight to the console/log aggregator.
    // Every Cloudinary call this module makes must have its error caught and sanitized IN this file,
    // never left to escape to a caller that doesn't know to sanitize it.
    try {
        const assets = await listCachedAssets();
        const cutoff = Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const toDelete = assets.filter(a => new Date(a.created_at).getTime() < cutoff && !currentUrls.has(a.secure_url));

        if (toDelete.length === 0) return { deletedCount: 0, deleted: [] };

        const publicIds = toDelete.map(a => a.public_id);
        await cloudinary.api.delete_resources(publicIds, { invalidate: true });
        return { deletedCount: publicIds.length, deleted: publicIds };
    } catch (err) {
        const message = safeErrorMessage(err);
        console.error(`Cloudinary prune failed: ${message}`);
        return { deletedCount: 0, deleted: [], error: message };
    }
}

module.exports = { slugify, publicIdFor, cacheThumbnail, getCachedUrl, resolveThumbnail, listCachedAssets, pruneExpiredThumbnails, FOLDER, EXPIRY_DAYS };
