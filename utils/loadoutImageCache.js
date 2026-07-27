// utils/loadoutImageCache.js
// Uploads a screenshot (already confirmed by the admin during /autobuild's review step) into
// Cloudinary under a specific, pre-computed Public ID key -- distinct from utils/cloudinaryCache.js
// (which derives its OWN key from a title slug for draw thumbnails) because here the caller has
// already decided the exact key (WEAPON-NAME-N, computed by utils/loadoutRender.js's
// computeWeaponKeyAndBuild) and just needs it uploaded verbatim. Also distinct from
// utils/patchNotesCache.js's season-scoped retention model -- loadout images have no expiry at all
// (same as every other admin-added loadout image), so there's no pruning logic here, just upload.
//
// This module ALSO owns the loadout STRUCTURED METADATA (2026-07-21) -- see METADATA_FIELDS below.
// Image upload and metadata are DELIBERATELY SEPARATE calls: uploadLoadoutImage() only puts the image
// up; syncLoadoutMetadata(doc) sets/updates the structured metadata from a Loadout doc. That split is
// what lets metadata stay in sync EVERYWHERE a loadout changes -- /autobuild write, /manage add/edit,
// bulk upsert, badge propagation, and the one-time backfill -- all funnel through the same
// doc->metadata function, and a metadata failure can never fail an image upload or a DB write.
//
// SECURITY: same rule as utils/cloudinaryCache.js and utils/patchNotesCache.js -- never log a raw
// Cloudinary error object. The Admin/Upload API's rejected-promise can carry the account's live API
// key+secret in `request_options.auth`; only ever read `.message`/`.error.message` off a caught error.
const cloudinary = require('cloudinary').v2;

const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');

const FOLDER = 'gun-builds'; // same flat folder every existing loadout image already lives in

function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}

// --- Loadout Structured Metadata schema -------------------------------------------------------------
// Real account-level STRUCTURED METADATA FIELDS (queryable + validated in the dashboard/Admin API),
// switched from loose `context` on 2026-07-21 at Harkirat's request. Create/refresh via
// scripts/createCloudinaryMetadataFields.js (idempotent). external_ids are Title_Case with `_` for
// multi-word (a space isn't a legal external_id char). Every field is a `string` except Build_Number
// (integer) and the two date fields -- deliberately: a string can never fail validation, so a metadata
// write can never cascade into a failed image upload (see syncLoadoutMetadata's decoupling).
//
// Cloudinary-only, NOT mirrored into the Loadout Mongo doc. The per-slot fields can only be filled by
// /autobuild (the slot->attachment mapping comes from the vision extraction and is never stored in
// Mongo); every OTHER field is derivable from the Loadout doc itself, so /manage edits and the backfill
// populate them too.
const METADATA_FIELDS = [
    { external_id: 'Weapon_Name', label: 'Weapon Name', type: 'string' },
    { external_id: 'Mode', label: 'Mode', type: 'string' }, // 'MP'/'DMZ'. Plain string (not enum) so a write can never fail validation and block an upload.
    { external_id: 'Build_Number', label: 'Build Number', type: 'integer' },
    { external_id: 'Gunsmith_Code', label: 'Gunsmith Code', type: 'string' },
    // The nine MP Gunsmith slots -- each holds the attachment name equipped there (only set by /autobuild).
    { external_id: 'Muzzle', label: 'Muzzle', type: 'string' },
    { external_id: 'Barrel', label: 'Barrel', type: 'string' },
    { external_id: 'Optic', label: 'Optic', type: 'string' },
    { external_id: 'Stock', label: 'Stock', type: 'string' },
    { external_id: 'Perk', label: 'Perk', type: 'string' },
    { external_id: 'Laser', label: 'Laser', type: 'string' },
    { external_id: 'Underbarrel', label: 'Underbarrel', type: 'string' },
    { external_id: 'Ammunition', label: 'Ammunition', type: 'string' },
    { external_id: 'Rear_Grip', label: 'Rear Grip', type: 'string' },
    // Badges (2026-07-21) -- always written (true/false, or a cleared Rank) so an edit that REMOVES a
    // badge actually clears it in Cloudinary rather than leaving a stale value.
    { external_id: 'Is_Meta', label: 'Is Meta', type: 'string' },
    { external_id: 'Is_Toxic', label: 'Is Toxic', type: 'string' },
    { external_id: 'Rank', label: 'Rank', type: 'string' }, // categoryRank (MP) or dmzRangeRank (DMZ) -- only one is ever set per build
    // Dates (2026-07-21) -- Created_At is the doc's real creation time, read for free from the Mongo
    // ObjectId's embedded timestamp (~"went live in the bot"); Last_Updated mirrors Loadout.lastUpdated.
    { external_id: 'Created_At', label: 'Created At', type: 'date' },
    { external_id: 'Last_Updated', label: 'Last Updated', type: 'date' }
];

// Maps a vision-extracted slot LABEL (attachmentSlots[i], e.g. "Rear Grip") to its metadata field
// external_id. Tolerant of common label variants; an unrecognized slot is skipped (its attachment name
// still lives in the Loadout doc's `attachments` array), never an error.
const SLOT_TO_FIELD = {
    muzzle: 'Muzzle',
    barrel: 'Barrel',
    optic: 'Optic', sight: 'Optic',
    stock: 'Stock',
    perk: 'Perk',
    laser: 'Laser',
    underbarrel: 'Underbarrel', 'under barrel': 'Underbarrel',
    ammunition: 'Ammunition', ammo: 'Ammunition',
    'rear grip': 'Rear_Grip', 'rear_grip': 'Rear_Grip', grip: 'Rear_Grip'
};

// Cloudinary date fields want YYYY-MM-DD. Returns undefined for a missing/invalid date.
function toMetadataDate(d) {
    if (!d) return undefined;
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString().slice(0, 10);
}

// Builds the full structured-metadata object from a Loadout doc (mongoose doc OR lean object). The
// single source of truth every write path funnels through, so /autobuild, /manage edits, and the
// backfill all produce identical metadata. `attachmentSlots` is the ONLY thing not derivable from the
// doc -- passed in only by /autobuild (from the vision extraction); omitted everywhere else, which
// leaves any existing per-slot metadata untouched (update_metadata MERGES, it doesn't replace).
// Badge/date fields are ALWAYS set (Is_Meta/Is_Toxic as 'true'/'false', Rank to its value or '') so a
// re-sync after an edit correctly reflects a REMOVED badge instead of leaving a stale one.
function buildLoadoutMetadata(doc, attachmentSlots) {
    const md = {};
    if (doc.weaponName) md.Weapon_Name = doc.weaponName;
    if (doc.mode) md.Mode = doc.mode;
    if (doc.shareCode) md.Gunsmith_Code = doc.shareCode;
    const bn = /Build\s+(\d+)/i.exec(doc.buildName || '');
    if (bn) md.Build_Number = parseInt(bn[1], 10);

    md.Is_Meta = doc.isMeta ? 'true' : 'false';
    md.Is_Toxic = doc.isToxic ? 'true' : 'false';
    md.Rank = (doc.mode === 'DMZ' ? doc.dmzRangeRank : doc.categoryRank) || '';

    // Created_At from the ObjectId's embedded timestamp (works for both a mongoose doc and a lean doc);
    // fall back to a real createdAt field if one ever exists.
    let createdAt = null;
    if (doc._id && typeof doc._id.getTimestamp === 'function') createdAt = doc._id.getTimestamp();
    else if (doc.createdAt) createdAt = doc.createdAt;
    const created = toMetadataDate(createdAt);
    if (created) md.Created_At = created;
    const updated = toMetadataDate(doc.lastUpdated);
    if (updated) md.Last_Updated = updated;

    if (Array.isArray(attachmentSlots) && Array.isArray(doc.attachments)) {
        for (let i = 0; i < doc.attachments.length; i++) {
            const field = SLOT_TO_FIELD[(attachmentSlots[i] || '').toLowerCase().trim()];
            const name = (doc.attachments[i] || '').trim();
            if (field && name) md[field] = name;
        }
    }
    return md;
}

// True only for a bare Cloudinary key we actually own (not an external URL, not a failed-upload
// placeholder) -- the only case where setting metadata makes sense.
function isRealImageKey(imageKey) {
    return !!imageKey && !imageKey.startsWith('http') && !imageKey.startsWith('PENDING-UPLOAD-');
}

// A Cloudinary public_id has NO file extension, but some stored imageKeys carry one (e.g. the real
// `AK117-1.png`). buildImageUrl tolerates the extension (Cloudinary resolves it in a delivery URL),
// but the Admin/Upload metadata API does NOT -- `update_metadata(md, ["AK117-1.png"])` silently
// matches nothing (returns public_ids: []). So strip a trailing image extension before addressing the
// asset for metadata. Harmless for the majority of keys, which have no extension at all.
function imageKeyToPublicId(imageKey) {
    return imageKey.replace(/\.(png|jpe?g|webp|gif|avif)$/i, '');
}

// Best-effort: writes the structured metadata for one loadout onto its Cloudinary asset. NEVER throws
// -- a metadata failure (missing asset, transient Admin-API hiccup) logs and is swallowed so it can't
// fail a DB write or an image upload. `attachmentSlots` only from /autobuild (see buildLoadoutMetadata).
// Returns success:false (not an exception) when the asset doesn't exist -- update_metadata reports that
// as an empty public_ids array rather than an error, so the empty-match case is checked explicitly.
async function syncLoadoutMetadata(doc, attachmentSlots) {
    if (!doc || !isRealImageKey(doc.imageKey)) return { success: false, error: 'no real Cloudinary key' };
    const publicId = imageKeyToPublicId(doc.imageKey);
    try {
        const md = buildLoadoutMetadata(doc, attachmentSlots);
        if (Object.keys(md).length === 0) return { success: false, error: 'nothing to set' };
        // Dev bot shares prod's Cloudinary credentials -- this would rewrite the LIVE asset's metadata.
        if (isCloudinaryWriteBlocked('update_metadata', publicId)) {
            return { success: false, error: 'blocked: dev bot may not write to the live Cloudinary account' };
        }
        const res = await cloudinary.uploader.update_metadata(md, [publicId]);
        if (!res.public_ids || res.public_ids.length === 0) {
            return { success: false, error: `no Cloudinary asset at "${publicId}"` };
        }
        return { success: true, error: null };
    } catch (err) {
        console.error(`Loadout metadata sync failed for "${publicId}" (best-effort, non-fatal): ${safeErrorMessage(err)}`);
        return { success: false, error: safeErrorMessage(err) };
    }
}

// Remote-URL-to-remote-URL upload (Cloudinary fetches the bytes server-side, same pattern as
// utils/cloudinaryCache.js's cacheThumbnail) -- overwrite: true so a retry (see the design spec's
// retry_token flow) safely re-uploads under the exact same key rather than erroring on a collision.
// IMAGE ONLY -- structured metadata is set separately by syncLoadoutMetadata(doc) once the Loadout doc
// exists, so this never has to know anything about the loadout's data.
async function uploadLoadoutImage(sourceUrl, imageKey) {
    // The single most dangerous write in the bot from a dev instance: `public_id` is the bare imageKey
    // (see the comment below), so `overwrite: true` against a key that already exists in prod would
    // silently replace a LIVE loadout image. Folder-scoping cannot prevent it -- asset_folder is not
    // part of the asset's identity.
    if (isCloudinaryWriteBlocked('upload', `${FOLDER}/${imageKey}`)) {
        return { success: false, error: 'blocked: dev bot may not write to the live Cloudinary account' };
    }
    try {
        await cloudinary.uploader.upload(sourceUrl, {
            public_id: imageKey, // bare key, NOT folder-prefixed -- gun-builds is dynamic-folder mode,
                                  // decoupled from public_id (see CLAUDE.md's Cloudinary workflow docs)
            asset_folder: FOLDER,
            overwrite: true,
            invalidate: true,
            resource_type: 'image'
        });
        return { success: true, error: null };
    } catch (err) {
        const message = safeErrorMessage(err);
        console.error(`Loadout image upload failed for key "${imageKey}": ${message}`);
        return { success: false, error: message };
    }
}

module.exports = { uploadLoadoutImage, syncLoadoutMetadata, buildLoadoutMetadata, isRealImageKey, METADATA_FIELDS, SLOT_TO_FIELD, FOLDER };
