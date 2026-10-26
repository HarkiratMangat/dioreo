// utils/autobuildCache.js -- where an /autobuild screenshot waits between being read and being saved (Harkirat, 2026-10-25 13:35 EDT: "upload it when it reads, and then put them in like a temp folder ... if it's discarded, then it gets deleted out of the cache folder. And if it's confirmed, then it goes from the cache folder into ... the actual correct storage folder").
//
// WHY: Discord's links to an uploaded screenshot expire after about a day, so a review left open longer would lose its picture and its Save. A cached copy on Cloudinary does not expire.
//
// THE IMAGE RULE (his, 13:38 EDT, and why these are deleted rather than archived): archive/ is for images the bot actually USED -- a saved build, a draw, a calendar banner -- once they are removed or replaced (utils/cloudinaryArchive.js). A cached screenshot that was never saved is not one of those, so a discard deletes it. A saved build's image is copied to the loadout's own key and then follows the archive rule like any other.
//
// The public_id is the screenshot's fingerprint (utils/visionReads.js's fileHash), so the same file read twice shares one cached copy; dropCachedScreenshot is told what else still uses it. On the dev bot the folder is `dev_autobuild_cache`, which the dev guard allows (the dev bot shares prod's Cloudinary account and may not write anywhere a live image could live).
//
// SECURITY: every Cloudinary error is read through safeErrorMessage() here and nowhere else -- a rejected Cloudinary promise carries the account's live API key and secret (CLAUDE.md's Cloudinary secret-logging ban).
const cloudinary = require('./cloudinaryClient');
const { isCloudinaryWriteBlocked, IS_DEV } = require('./cloudinaryDevGuard');

const FOLDER = IS_DEV ? 'dev_autobuild_cache' : 'autobuild_cache';

function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}

function cacheIdFor(hash) {
    return `${FOLDER}/${hash}`;
}

// Copies a screenshot to the cache. Returns { url, cacheId }, or null when it could not (the review then keeps Discord's own link, which works for about a day). Never throws.
async function cacheScreenshot(sourceUrl, hash) {
    if (!sourceUrl || !hash) return null;
    const cacheId = cacheIdFor(hash);
    if (isCloudinaryWriteBlocked('upload', cacheId, { devNamespaceSafe: IS_DEV })) return null;
    try {
        // overwrite: false -- the same file already cached comes back as it is.
        const res = await cloudinary.uploader.upload(sourceUrl, { public_id: cacheId, asset_folder: FOLDER, overwrite: false, resource_type: 'image' });
        return { url: res.secure_url, cacheId };
    } catch (err) {
        console.error(`Autobuild screenshot cache failed (keeping Discord's link): ${safeErrorMessage(err)}`);
        return null;
    }
}

// Deletes a cached screenshot, unless `stillUsed` says another open review still shows it. Never throws.
async function dropCachedScreenshot(cacheId, stillUsed = false) {
    if (!cacheId || stillUsed) return false;
    if (isCloudinaryWriteBlocked('destroy', cacheId, { devNamespaceSafe: IS_DEV && cacheId.startsWith(`${FOLDER}/`) })) return false;
    try {
        await cloudinary.uploader.destroy(cacheId, { invalidate: true, resource_type: 'image' });
        return true;
    } catch (err) {
        console.error(`Autobuild screenshot cache: could not delete ${cacheId}: ${safeErrorMessage(err)}`);
        return false;
    }
}

module.exports = { cacheScreenshot, dropCachedScreenshot, cacheIdFor, FOLDER };
