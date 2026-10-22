// utils/patchNotesCache.js
// ==========================================
// PATCH NOTES IMAGE CLOUDINARY CACHE
// ==========================================
// Problem: patch notes screenshots are admin-typed external URLs (same failure mode draws' thumbnails had -- the source can go dark later, leaving a broken image in the carousel). This re-hosts every provided screenshot into this bot's own Cloudinary account so /patch notes keeps working even after the original source disappears.
//
// Distinct retention model from utils/cloudinaryCache.js's draws cache (45-day age + orphan check): patch notes retention is SEASON-based, not time-based -- an image stays cached for as long as its season's patch note entry exists. Every season is reachable now (2026-10-19 00:30 EDT: the dropdown lists the 12 newest and Search Older Seasons finds the rest), so only a deleted entry's folder is pruned, regardless of how many days have passed.
//
// Keyed by the patch note SUBDOCUMENT'S OWN `_id`, not its title -- titles can be renamed later (see handlers/manage/season.js's `modal_season_titles_deadlines`, which keeps the most recent patchNotes[] entry's title synced to `currentSeasonTitle`), and keying by a mutable title would either orphan already-cached images on a rename or require a folder-rename step. `_id` never changes.
const cloudinary = require('./cloudinaryClient'); // timed proxy over the SDK -- see utils/cloudinaryClient.js

// Same auto-config-from-env behavior as utils/cloudinaryCache.js -- the Cloudinary Node SDK reads CLOUDINARY_URL the moment it's required, no explicit cloudinary.config() call needed. This just fails loudly at boot if that var is missing instead of every upload silently erroring later.
if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- patch notes image caching will fail on every attempt.');
}

const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');
const { archiveByMove, archiveBeforeReplace } = require('./cloudinaryArchive');
const { withDeliveryDefaults } = require('./cloudinaryDeliveryUrl');

const FOLDER = 'patch_notes';

// SECURITY: never log a raw Cloudinary error object -- see utils/cloudinaryCache.js's matching note for the exact leak shape (the Admin API's rejected-promise carries the account's live API key+secret in `request_options.auth`). Every Cloudinary call in THIS file has its error caught and sanitized IN this file, same isolation rule as the draws cache module.
function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}

// --- Patch-notes Structured Metadata (2026-07-21, Harkirat's request) ------------------------------- Structured metadata fields for patch-notes images so each cached screenshot carries which season it belongs to, its order in the carousel, and the season's release date. Created via scripts/createCloudinaryMetadataFields.js (idempotent), same as the loadout fields. Account-global fields -- a patch image just doesn't set the loadout fields and vice versa. Cloudinary-only, kept in sync from the SeasonalData patchNotes[] entry (on image (re)cache, on release-date edit, and on season rename -- see handlers/manage/season.js and core/ops/season.js). `Patch_Id` is the patch subdoc's own immutable `_id` (stable across title renames, same reason the public_id is keyed by it); `Patch_Season` is the human-readable title.
const PATCH_METADATA_FIELDS = [
    { external_id: 'Patch_Id', label: 'Patch Id', type: 'string' },
    { external_id: 'Patch_Season', label: 'Patch Season', type: 'string' },
    { external_id: 'Patch_Image_Order', label: 'Patch Image Order', type: 'integer' },
    { external_id: 'Patch_Release_Date', label: 'Patch Release Date', type: 'date' }
];

function toMetadataDate(d) {
    if (!d) return undefined;
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString().slice(0, 10);
}

function buildPatchMetadata({ patchId, season, order, releaseDate }) {
    const md = {};
    if (patchId) md.Patch_Id = String(patchId);
    if (season) md.Patch_Season = season;
    if (typeof order === 'number') md.Patch_Image_Order = order;
    const rd = toMetadataDate(releaseDate);
    if (rd) md.Patch_Release_Date = rd;
    return md;
}

// Best-effort: sets/updates the structured metadata on ONE already-cached patch image. Never throws -- a metadata failure must never affect the image or the admin's save.
async function setPatchImageMetadata(patchId, imageIndex, { season, releaseDate } = {}) {
    try {
        const md = buildPatchMetadata({ patchId, order: imageIndex, season, releaseDate });
        if (Object.keys(md).length === 0) return;
        // Dev bot shares prod's Cloudinary credentials -- this would rewrite the LIVE asset's metadata.
        if (isCloudinaryWriteBlocked('update_metadata', publicIdFor(patchId, imageIndex))) return;
        await cloudinary.uploader.update_metadata(md, [publicIdFor(patchId, imageIndex)]);
    } catch (err) {
        console.error(`Patch image metadata set failed for ${patchId}/${imageIndex} (best-effort, non-fatal): ${safeErrorMessage(err)}`);
    }
}

// Re-syncs metadata across EVERY cached image of a patch entry -- used when the release date or the season title changes WITHOUT re-uploading the images (a /manage "date & info" edit, or a season rename). `seasonTitle` is passed already-cleaned by the caller (core/ops/season.js applies commands/patchnotes.js's cleanPatchTitle, core/ops/patchnotes.js its displayTitle; this util deliberately stays decoupled from the command layer). Each image's own order is preserved.
async function syncPatchEntryMetadata(patchEntry, seasonTitle) {
    if (!patchEntry?._id) return;
    const patchId = String(patchEntry._id);
    const season = seasonTitle || patchEntry.title;
    const count = (patchEntry.images || []).length;
    for (let i = 0; i < count; i++) {
        await setPatchImageMetadata(patchId, i, { season, releaseDate: patchEntry.releaseDate });
    }
}

// public_id shape: patch_notes/{patchId}/{imageIndex} -- imageIndex is the ABSOLUTE position in the patch note's `images[]` array (0-9), not a per-modal-submission-local index, so re-submitting the same slot (URLs 1 owns 0-4, URLs 2 owns 5-9 -- see core/ops/patchnotes.js) always overwrites the same asset in place via `overwrite: true` rather than accumulating duplicates under different indices.
function publicIdFor(patchId, imageIndex) {
    return `${FOLDER}/${patchId}/${imageIndex}`;
}

// Uploads a REMOTE url straight into Cloudinary (server-side fetch, the bot never downloads the image itself) -- never throws, a Cloudinary hiccup must fall back to the raw URL rather than blocking the admin's save, same philosophy as utils/cloudinaryCache.js's cacheThumbnail(). `meta` (optional): { season, releaseDate } -- the patch's title + release date, so the cached image carries its structured metadata immediately. Set in a SEPARATE best-effort step after the upload (setPatchImageMetadata swallows its own errors), same decoupling as the loadout side: a metadata hiccup must never turn a successful image cache into a fallback-to-raw-URL.
async function cachePatchImage(patchId, imageIndex, sourceUrl, meta = {}) {
    // Same shape as the catch block below, so a dev save falls back to the raw URL exactly as it does for a real Cloudinary hiccup -- the admin's save still succeeds, the image just isn't re-hosted. ⚠️ It returned `url: null` until 2026-10-19 10:31 EDT, contradicting this comment: every dev-bot patch-notes save stored nulls in images[], and /patch notes then failed outright (Discord rejects a gallery item with no media.url). Found click-testing Add to Patch Notes.
    if (isCloudinaryWriteBlocked('upload', publicIdFor(patchId, imageIndex))) {
        return { url: sourceUrl, cached: false, error: 'blocked: dev bot may not write to the live Cloudinary account' };
    }
    // The image in this slot is copied to archive/patch_notes/ before it is overwritten (Harkirat, 2026-10-21 11:39 EDT); re-submitting the slot's own stored URL archives nothing. utils/cloudinaryArchive.js.
    await archiveBeforeReplace(publicIdFor(patchId, imageIndex), sourceUrl, 'patch_notes');
    try {
        const result = await cloudinary.uploader.upload(sourceUrl, {
            public_id: publicIdFor(patchId, imageIndex),
            // Same asset_folder fix as utils/cloudinaryCache.js's cacheThumbnail() -- the FOLDER prefix is already baked into the public_id path, but Cloudinary's newer "Folder" UI (asset_folder, decoupled from public_id) never got told about it, so nothing here would have shown up grouped in the dashboard even once it started actually caching successfully.
            asset_folder: FOLDER,
            overwrite: true,
            invalidate: true,
            resource_type: 'image'
        });
        await setPatchImageMetadata(patchId, imageIndex, meta);
        return { url: withDeliveryDefaults(result.secure_url), cached: true, error: null };
    } catch (err) {
        const message = safeErrorMessage(err);
        console.error(`Cloudinary cache upload failed for patch ${patchId} image ${imageIndex} (${sourceUrl}): ${message}`);
        return { url: sourceUrl, cached: false, error: message };
    }
}

// Lists every asset currently cached under patch_notes/ -- paginates via next_cursor since Cloudinary caps a single resources() call at 500, mirroring listCachedAssets() in utils/cloudinaryCache.js.
async function listCachedPatchAssets() {
    const assets = [];
    let nextCursor;
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
 * Archives (moves to archive/patch_notes/, never deletes -- Harkirat, 2026-10-21 11:25 EDT) every cached image belonging to a season whose patch note `_id` is NOT in `keepPatchIds` -- callers pass every patchNotes[] entry's `_id`, since every season stays reachable in Discord, so only a deleted entry's folder goes. Whole-folder deletion, not age-based.
 */
async function pruneOrphanedPatchFolders(keepPatchIds) {
    try {
        const assets = await listCachedPatchAssets();
        const toDelete = assets.filter(a => {
            // public_id shape: patch_notes/{patchId}/{imageIndex}
            const patchId = a.public_id.split('/')[1];
            return patchId && !keepPatchIds.has(patchId);
        });

        if (toDelete.length === 0) return { archivedCount: 0, archived: [] };

        const publicIds = toDelete.map(a => a.public_id);
        // The dev bot's own boot/24h cleanup sweep would otherwise run this unprompted against the live account.
        if (isCloudinaryWriteBlocked('archive (move)', `${publicIds.length} asset(s) under ${FOLDER}/`)) {
            return { archivedCount: 0, archived: [] };
        }
        const moved = await archiveByMove(publicIds, 'patch_notes');
        return { archivedCount: moved.archived.length, archived: moved.archived, failed: moved.failed };
    } catch (err) {
        const message = safeErrorMessage(err);
        console.error(`Cloudinary patch-notes prune failed: ${message}`);
        return { archivedCount: 0, archived: [], error: message };
    }
}

module.exports = { cachePatchImage, pruneOrphanedPatchFolders, syncPatchEntryMetadata, setPatchImageMetadata, buildPatchMetadata, PATCH_METADATA_FIELDS, FOLDER };
