// utils/announcementBannerCache.js
// ==========================================
// ANNOUNCEMENT BANNER CLOUDINARY CACHE
// ==========================================
// Pins batch 2, spec §7 / plan §10.3 row 2. Every other pasted link in this repo is re-hosted on Cloudinary (utils/patchNotesCache.js, utils/calendarBannerCache.js) so a dead external link at commit time never becomes a permanently-broken record; announcements get the same treatment. The re-host runs inside core/ops/announcements.js's own apply() -- see that file's header -- never in the portal, which only ever hands over the raw pasted URL.
//
// SECURITY: never log a raw Cloudinary error object -- see utils/cloudinaryCache.js's matching note (the Admin API's rejected-promise carries the account's live API key+secret in `request_options.auth`).
const crypto = require('crypto');
const cloudinary = require('./cloudinaryClient'); // timed proxy over the SDK -- see utils/cloudinaryClient.js

if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- announcement banner caching will fail on every attempt.');
}

const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');
const { withDeliveryDefaults } = require('./cloudinaryDeliveryUrl');

const FOLDER = 'announcement_banners';

function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}

// 🔴 THE PUBLIC ID IS KEYED ON {announcementId}-{hash of the SOURCE link}, NEVER a fixed one-per- announcement id (unlike utils/calendarBannerCache.js's fixed per-page id, which is safe there only because that module has no undo to protect). An undo in Review restores the PRIOR bannerImageUrl STRING verbatim -- if a later edit re-uploaded under the SAME fixed public_id, that overwrite would silently make the prior (already-committed) URL start serving the NEW image the moment it landed, because Cloudinary's `overwrite:true` replaces the asset the public_id points at. Hashing the source means two different pasted links for one announcement get two different assets, so an old, already- stored URL keeps pointing at whatever it always pointed at, undo or not.
function publicIdFor(announcementId, sourceUrl) {
    const hash = crypto.createHash('sha1').update(String(sourceUrl || '')).digest('hex').slice(0, 10);
    return `${FOLDER}/${announcementId}-${hash}`;
}

// A value already shaped like one of THIS folder's own delivery URLs is treated as already-hosted and is never re-uploaded -- the common case once an announcement has been saved once and is being edited again for an unrelated reason (the text, a date), where the banner field round-trips unchanged.
function isOurDeliveryUrl(url) {
    return typeof url === 'string' && url.includes(`/${FOLDER}/`);
}

// Uploads a REMOTE url straight into Cloudinary (server-side fetch) -- NEVER throws. A failed upload never blocks the post: it stores the raw link as-is, same tolerance as every other cached image in this bot (calendarBannerCache/patchNotesCache/loadoutImageCache all share this contract).
async function cacheAnnouncementBanner(announcementId, sourceUrl) {
    const raw = String(sourceUrl || '').trim();
    if (!raw) return { url: null, cached: false, error: null };
    if (isOurDeliveryUrl(raw)) return { url: raw, cached: false, error: null };
    const publicId = publicIdFor(announcementId, raw);
    if (isCloudinaryWriteBlocked('upload', publicId)) {
        return { url: raw, cached: false, error: 'blocked: dev bot may not write to the live Cloudinary account' };
    }
    try {
        const result = await cloudinary.uploader.upload(raw, {
            public_id: publicId,
            asset_folder: FOLDER,
            overwrite: true,
            invalidate: true,
            resource_type: 'image',
        });
        return { url: withDeliveryDefaults(result.secure_url), cached: true, error: null };
    } catch (err) {
        const message = safeErrorMessage(err);
        console.error(`Cloudinary cache upload failed for announcement banner (${raw}): ${message}`);
        return { url: raw, cached: false, error: message };
    }
}

module.exports = { cacheAnnouncementBanner, publicIdFor, isOurDeliveryUrl, FOLDER };
