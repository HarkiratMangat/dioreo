// utils/loadoutImageCache.js
// Uploads a screenshot (already confirmed by the admin during /autobuild's review step) into
// Cloudinary under a specific, pre-computed Public ID key -- distinct from utils/cloudinaryCache.js
// (which derives its OWN key from a title slug for draw thumbnails) because here the caller has
// already decided the exact key (WEAPON-NAME-N, computed by utils/loadoutRender.js's
// computeWeaponKeyAndBuild) and just needs it uploaded verbatim. Also distinct from
// utils/patchNotesCache.js's season-scoped retention model -- loadout images have no expiry at all
// (same as every other admin-added loadout image), so there's no pruning logic here, just upload.
//
// SECURITY: same rule as utils/cloudinaryCache.js and utils/patchNotesCache.js -- never log a raw
// Cloudinary error object. The Admin/Upload API's rejected-promise can carry the account's live API
// key+secret in `request_options.auth`; only ever read `.message`/`.error.message` off a caught error.
const cloudinary = require('cloudinary').v2;

const FOLDER = 'gun-builds'; // same flat folder every existing loadout image already lives in

function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}

// Builds Cloudinary's `context` param (simple indexed key/value pairs, searchable via the Admin API/
// dashboard -- no predefined Structured Metadata Fields needed, unlike Cloudinary's stricter
// "Structured Metadata" feature which requires defining fields on the account first) from the
// per-slot attachment data. Added 2026-07-20 for the requirement Antigravity's session never
// implemented: "we want to use that attachment slot data as a key for structural metadata... We don't
// be using it directly in the discord bot but we still want to index and retain that information."
// Deliberately NOT written to the Loadout Mongo doc -- Cloudinary-only, per that same framing.
function buildAttachmentContext(attachments, attachmentSlots) {
    if (!attachmentSlots) return undefined;
    const context = {};
    for (let i = 0; i < 5; i++) {
        const slot = (attachmentSlots[i] || '').trim();
        const name = (attachments[i] || '').trim();
        if (slot || name) context[`attachment_${i + 1}_slot`] = slot || 'unknown';
        if (name) context[`attachment_${i + 1}_name`] = name;
    }
    return Object.keys(context).length > 0 ? context : undefined;
}

// Remote-URL-to-remote-URL upload (Cloudinary fetches the bytes server-side, same pattern as
// utils/cloudinaryCache.js's cacheThumbnail) -- overwrite: true so a retry (see the design spec's
// retry_token flow) safely re-uploads under the exact same key rather than erroring on a collision.
async function uploadLoadoutImage(sourceUrl, imageKey, attachments, attachmentSlots) {
    try {
        const context = buildAttachmentContext(attachments, attachmentSlots);
        await cloudinary.uploader.upload(sourceUrl, {
            public_id: imageKey, // bare key, NOT folder-prefixed -- gun-builds is dynamic-folder mode,
                                  // decoupled from public_id (see CLAUDE.md's Cloudinary workflow docs)
            asset_folder: FOLDER,
            overwrite: true,
            invalidate: true,
            resource_type: 'image',
            ...(context ? { context } : {})
        });
        return { success: true, error: null };
    } catch (err) {
        const message = safeErrorMessage(err);
        console.error(`Loadout image upload failed for key "${imageKey}": ${message}`);
        return { success: false, error: message };
    }
}

module.exports = { uploadLoadoutImage, FOLDER };
