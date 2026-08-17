// utils/cloudinaryDeliveryUrl.js
// ==========================================
// SHARED CLOUDINARY DELIVERY-URL CONVENTION
// ==========================================
// Standing convention (Harkirat, 2026-08-07 21:51 EDT): every Cloudinary delivery URL this bot produces bakes in `f_auto,q_auto` (adaptive format + adaptive quality, Cloudinary's own recommended default) unless a specific site EXPLICITLY has a reason not to. `utils/loadoutRender.js`'s `buildImageUrl()` already did this correctly (constructs the URL fresh at render time from a bare stored `imageKey`), but the three modules that call `cloudinary.uploader.upload()` directly and store the returned `secure_url` whole (`cloudinaryCache.js`/draws, `patchNotesCache.js`, `calendarBannerCache.js`) never applied it -- found live 2026-08-07 21:51 EDT while debugging an unrelated calendar-banner issue. This is the one place that convention now lives, so a 4th future module doesn't have to reinvent or forget it.
const DEFAULT_TRANSFORM = 'f_auto,q_auto';

// Idempotent -- checks for an existing `/upload/{transform}` segment before inserting, so calling this twice (e.g. a URL that already went through the migration script AND then a fresh re-upload) never double-bakes the transform into the path. Non-Cloudinary URLs (a raw-URL fallback after an upload failure, or literally anything without `/upload/`) pass through untouched -- this is a Cloudinary-specific transform, not a generic image proxy.
function withDeliveryDefaults(url, transform = DEFAULT_TRANSFORM) {
    if (!url || typeof url !== 'string') return url;
    if (!url.includes('/upload/')) return url;
    if (url.includes(`/upload/${transform}/`)) return url;
    return url.replace('/upload/', `/upload/${transform}/`);
}

module.exports = { withDeliveryDefaults, DEFAULT_TRANSFORM };
