// utils/cloudinaryArchive.js
// ==========================================
// CLOUDINARY ARCHIVE -- images are moved aside, never deleted
// ==========================================
// Harkirat, 2026-10-21 11:25 EDT: "instead of deleting, can we move any "deleted" images to an archive folder instead from now on? incase we want to reference them again? an archive folder with respective sub-folders for draws, banners, etc." and, 11:39 EDT, yes to also archiving the old image when one is replaced. Asked the day every draw thumbnail turned out to be gone (the 45-day prune deleted in-use images until #212) with no source links left to restore them from.
//
// Two ways in:
//   - archiveByMove(publicIds, kind): for an image that is going away (a prune, a cleared banner). Renames it under archive/{kind}/, so the original id stops resolving exactly as a delete did.
//   - archiveBeforeReplace(publicId, sourceUrl, kind): for an image about to be overwritten in place. COPIES it to archive/{kind}/ and leaves the original alone, so an upload that fails afterwards cannot leave the live image missing (a move would). A failed copy is logged and the replacement still goes ahead: an admin's save is never blocked by Cloudinary, the rule every module here follows.
//
// Nothing in the bot deletes from archive/, and nothing scans it: every prune lists its own folder by prefix (temp_draws/, patch_notes/), which archive/ is not under.
//
// SECURITY: every Cloudinary error is read through safeErrorMessage()/errorHttpCode() in this file and nowhere else -- a rejected Cloudinary promise carries the account's live API key and secret (CLAUDE.md's Cloudinary secret-logging ban).
const cloudinary = require('./cloudinaryClient'); // timed proxy over the SDK -- see utils/cloudinaryClient.js
const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');

const ARCHIVE_ROOT = 'archive';
// Each kind's sub-folder under archive/, and the folder its live images sit in (dropped from the archived id, since archive/{kind}/ already says where it came from). Loadout images have bare public_ids (gun-builds is a dashboard folder only), so there is nothing to drop.
const KINDS = { draws: 'temp_draws', patch_notes: 'patch_notes', calendar_banners: 'calendar_banners', loadouts: null };

function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}
function errorHttpCode(err) {
    return err?.http_code ?? err?.error?.http_code ?? null;
}

// 2026-10-21T15:40:12.345Z -> 20261021-154012 (UTC), so two archives of the same image never collide and sort by when they were archived.
function stampFor(now) {
    return now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
}

// temp_draws/molten-fusion-draw -> archive/draws/molten-fusion-draw-20261021-154012. Anything under the source folder (patch_notes' {patchId}/{index}) is kept.
function archivePublicIdFor(publicId, kind, now = new Date()) {
    if (!(kind in KINDS)) throw new Error(`Unknown Cloudinary archive kind: ${kind}`);
    const source = KINDS[kind];
    const rest = source && publicId.startsWith(`${source}/`) ? publicId.slice(source.length + 1) : publicId;
    return `${ARCHIVE_ROOT}/${kind}/${rest}-${stampFor(now)}`;
}

function archiveFolderFor(kind) {
    return `${ARCHIVE_ROOT}/${kind}`;
}

// True when sourceUrl is this account's own delivery URL for publicId. An edit box pre-filled with the stored URL re-submits it, and archiving an image "replaced" by itself would add a copy on every save.
function isSameAsset(sourceUrl, publicId) {
    try {
        const url = new URL(sourceUrl);
        if (url.hostname !== 'res.cloudinary.com') return false;
        const escaped = publicId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`/${escaped}(\\.[a-z0-9]+)?$`, 'i').test(decodeURIComponent(url.pathname));
    } catch {
        return false;
    }
}

// The rename keeps the asset's dashboard folder (dynamic-folder mode decouples it from the public_id, see utils/cloudinaryCache.js's asset_folder note), so it is set separately. Best-effort: a failure only misfiles it in the dashboard; the archived id is still right.
async function fileInArchiveFolder(publicId, kind) {
    try {
        await cloudinary.api.update(publicId, { asset_folder: archiveFolderFor(kind) });
    } catch (err) {
        console.error(`Cloudinary archive: moved "${publicId}" but could not set its dashboard folder (non-fatal): ${safeErrorMessage(err)}`);
    }
}

// Moves each image under archive/{kind}/. Returns { archived: [{ from, to }], missing: [publicId], failed: [{ publicId, error }] }; a 404 is "already gone", not a failure. Never throws.
async function archiveByMove(publicIds, kind, now = new Date()) {
    const result = { archived: [], missing: [], failed: [] };
    if (!publicIds.length) return result;
    if (isCloudinaryWriteBlocked('archive (move)', `${publicIds.length} asset(s) to ${archiveFolderFor(kind)}/`)) {
        result.failed = publicIds.map(publicId => ({ publicId, error: 'blocked: dev bot may not write to the live Cloudinary account' }));
        return result;
    }
    for (const publicId of publicIds) {
        const to = archivePublicIdFor(publicId, kind, now);
        try {
            await cloudinary.uploader.rename(publicId, to, { overwrite: false, invalidate: true });
        } catch (err) {
            if (errorHttpCode(err) === 404) {
                result.missing.push(publicId);
            } else {
                const error = safeErrorMessage(err);
                console.error(`Cloudinary archive: could not move "${publicId}" to ${archiveFolderFor(kind)}/ (left in place): ${error}`);
                result.failed.push({ publicId, error });
            }
            continue;
        }
        await fileInArchiveFolder(to, kind);
        result.archived.push({ from: publicId, to });
    }
    return result;
}

// Copies the image currently at publicId into archive/{kind}/ before it is overwritten. Returns { archived: true, to } or { archived: false, reason | error }. Never throws.
async function archiveBeforeReplace(publicId, sourceUrl, kind, now = new Date()) {
    if (isSameAsset(sourceUrl, publicId)) return { archived: false, reason: 'same image' };
    if (isCloudinaryWriteBlocked('archive (copy)', publicId)) return { archived: false, reason: 'blocked' };
    let existing;
    try {
        existing = await cloudinary.api.resource(publicId);
    } catch (err) {
        if (errorHttpCode(err) === 404) return { archived: false, reason: 'nothing to replace' };
        const error = safeErrorMessage(err);
        console.error(`Cloudinary archive: could not look up "${publicId}" before replacing it (the replacement goes ahead): ${error}`);
        return { archived: false, error };
    }
    const to = archivePublicIdFor(publicId, kind, now);
    try {
        await cloudinary.uploader.upload(existing.secure_url, {
            public_id: to,
            asset_folder: archiveFolderFor(kind),
            overwrite: false,
            resource_type: 'image'
        });
        return { archived: true, to };
    } catch (err) {
        const error = safeErrorMessage(err);
        console.error(`Cloudinary archive: could not copy "${publicId}" before replacing it (the replacement goes ahead): ${error}`);
        return { archived: false, error };
    }
}

module.exports = { archiveByMove, archiveBeforeReplace, archivePublicIdFor, archiveFolderFor, isSameAsset, ARCHIVE_ROOT, KINDS };
