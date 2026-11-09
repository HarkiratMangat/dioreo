// utils/calendarBannerCache.js
// ==========================================
// CALENDAR PAGE BANNER CLOUDINARY CACHE
// ==========================================
// One banner image per /calendar page (Draws/Events/Playlists), independently settable via /manage's Calendar "Banners" action (added 2026-07-31 17:20 EDT, the notes file follow-up). Same re-host-so-a-dead-external-link-can't-break-the-command philosophy as utils/cloudinaryCache.js (draw thumbnails) and utils/patchNotesCache.js (patch screenshots), but far simpler retention: exactly 3 possible public_ids ever exist (calendar_banners/draws|events|playlists), each overwritten in place on every re-set -- no age/season-based pruning needed. Since 2026-10-21 the banner being replaced or cleared goes to archive/calendar_banners/ first, never deleted (utils/cloudinaryArchive.js).
const cloudinary = require('./cloudinaryClient'); // timed proxy over the SDK -- see utils/cloudinaryClient.js

if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- calendar banner caching will fail on every attempt.');
}

const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');
const { withDeliveryDefaults } = require('./cloudinaryDeliveryUrl');
const { archiveByMove, archiveBeforeReplace } = require('./cloudinaryArchive');

const FOLDER = 'calendar_banners';
const VALID_PAGES = ['draws', 'events', 'playlists'];

// SECURITY: never log a raw Cloudinary error object; utils/cloudinaryErrors.js sanitizes it (the Admin API's rejected promise carries the live API key and secret in `request_options.auth`).
const { safeErrorMessage } = require('./cloudinaryErrors');

function publicIdFor(page) {
    return `${FOLDER}/${page}`;
}

// ⚠️ CORRECTED 2026-08-07 21:23 EDT -- this used to say "a real Discord CDN link doesn't expire the way an external host can," which is FALSE for the URLs this bot actually receives. A `media.discordapp.net` link (the "Copy Link" a user gets from Discord's own image viewer) is SIGNED (`?ex=`/`is=`/`hm=`), and the `ex=` param is a real expiry -- decoding it on a banner set 2026-07-29 (exact time unknown -- an admin-set field, not a logged event) showed an expiry of 2026-08-01, confirmed dead (404) 2026-08-07 21:25 EDT. Forging a later `ex=` doesn't work either (`hm=` is a real signature over `ex`+`is`+path -- tested, still 404). Kept here only to distinguish a Discord CDN host for logging/diagnostics; NOT used to skip Cloudinary re-hosting anymore -- see cacheBannerImage() below, which now re-hosts every source unconditionally. (isDiscordCdnUrl, which this note sat on, was deleted 2026-10-20 in the v3 sweep: nothing had called it since the skip-the-upload branch was reverted. The note stays because cacheBannerImage's comment below points at it.)

// Uploads a REMOTE url straight into Cloudinary (server-side fetch, the bot never downloads the image itself) -- never throws, a Cloudinary hiccup falls back to the raw URL rather than blocking the admin's save, same philosophy as cacheThumbnail()/cachePatchImage().
//
// ⚠️ Discord CDN sources used to skip this upload entirely, on the theory that re-hosting was pure downside (an extra copy of an "already-durable" asset). REVERTED 2026-08-07 21:25 EDT -- that premise was wrong (see the CORRECTED note above: Discord CDN links are signed and expire), so a banner set from a Discord link was silently going dead within ~24-48h with no way to detect or repair it from the stored URL alone. Every source now re-hosts unconditionally, same as every other cached image in this bot. Verified live 2026-08-07: uploading a real Discord CDN banner URL to Cloudinary and capping it with a Cloudinary `c_limit,w_N` derivative correctly returned an aspect-preserved 256x144 derivative from a 2048x1152 source -- Cloudinary's `c_limit` only ever needs ONE dimension to preserve aspect ratio, unlike Discord's proxy. `draft` (2026-11-09, the /manage audit's finding 5: the Next Season Draft can stage banners): a staged banner gets its own public_id, `calendar_banners/next_<page>_<time>`, never the live one. Promote copies the draft's url onto the live field, so a fixed draft id would let the NEXT season's staged banner overwrite the asset the live page is still showing. It is never archived before writing (the id is new each time).
async function cacheBannerImage(page, sourceUrl, { draft = false } = {}) {
    if (!VALID_PAGES.includes(page)) throw new Error(`Invalid calendar banner page: ${page}`);
    const publicId = draft ? `${FOLDER}/next_${page}_${Date.now()}` : publicIdFor(page);
    if (isCloudinaryWriteBlocked('upload', publicId)) {
        return { url: sourceUrl, cached: false, error: 'blocked: dev bot may not write to the live Cloudinary account' };
    }
    if (!draft) await archiveBeforeReplace(publicIdFor(page), sourceUrl, 'calendar_banners');
    try {
        const result = await cloudinary.uploader.upload(sourceUrl, {
            public_id: publicId,
            // Same asset_folder fix as every other Cloudinary module here -- the FOLDER prefix is already baked into the public_id path, but Cloudinary's newer "Folder" UI needs this set separately or the dashboard never groups it visually.
            asset_folder: FOLDER,
            overwrite: true,
            invalidate: true,
            resource_type: 'image'
        });
        return { url: withDeliveryDefaults(result.secure_url), cached: true, error: null };
    } catch (err) {
        const message = safeErrorMessage(err);
        console.error(`Cloudinary cache upload failed for calendar banner "${page}" (${sourceUrl}): ${message}`);
        return { url: sourceUrl, cached: false, error: message };
    }
}

// Best-effort archive of a page's cached banner asset -- called when the admin clears a banner field back to blank. Moved to archive/calendar_banners/, never deleted (Harkirat, 2026-10-21 11:25 EDT). Never throws; archiveByMove logs its own failures, and a failed move just leaves the old asset where it was, same non-blocking philosophy as every other write path in this file.
async function clearBannerImage(page) {
    if (!VALID_PAGES.includes(page)) return;
    if (isCloudinaryWriteBlocked('archive (move)', publicIdFor(page))) return;
    await archiveByMove([publicIdFor(page)], 'calendar_banners');
}

module.exports = { cacheBannerImage, clearBannerImage, FOLDER };
