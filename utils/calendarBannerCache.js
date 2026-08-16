// utils/calendarBannerCache.js
// ==========================================
// CALENDAR PAGE BANNER CLOUDINARY CACHE
// ==========================================
// One banner image per /calendar page (Draws/Events/Playlists), independently settable via
// /manage's Calendar "Banners" action (added 2026-07-31 17:20 EDT, the notes file follow-up). Same
// re-host-so-a-dead-external-link-can't-break-the-command philosophy as utils/cloudinaryCache.js
// (draw thumbnails) and utils/patchNotesCache.js (patch screenshots), but far simpler retention:
// exactly 3 possible public_ids ever exist (calendar_banners/draws|events|playlists), each just
// overwritten in place on every re-set -- no age/season-based pruning needed.
const cloudinary = require('./cloudinaryClient'); // timed proxy over the SDK -- see utils/cloudinaryClient.js

if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- calendar banner caching will fail on every attempt.');
}

const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');
const { withDeliveryDefaults } = require('./cloudinaryDeliveryUrl');

const FOLDER = 'calendar_banners';
const VALID_PAGES = ['draws', 'events', 'playlists'];

// SECURITY: never log a raw Cloudinary error object -- see utils/cloudinaryCache.js's matching
// note for the exact leak shape (the Admin API's rejected-promise carries the account's live API
// key+secret in `request_options.auth`). Sanitized in this file, same isolation rule as every
// other Cloudinary module.
function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}

function publicIdFor(page) {
    return `${FOLDER}/${page}`;
}

// ⚠️ CORRECTED 2026-08-07 21:23 EDT -- this used to say "a real Discord CDN link doesn't expire the
// way an external host can," which is FALSE for the URLs this bot actually receives. A
// `media.discordapp.net` link (the "Copy Link" a user gets from Discord's own image viewer) is
// SIGNED (`?ex=`/`is=`/`hm=`), and the `ex=` param is a real expiry -- decoding it on a banner set
// 2026-07-29 (exact time unknown -- an admin-set field, not a logged event) showed an expiry of
// 2026-08-01, confirmed dead (404) 2026-08-07 21:25 EDT. Forging a later `ex=` doesn't
// work either (`hm=` is a real signature over `ex`+`is`+path -- tested, still 404). Kept here only
// to distinguish a Discord CDN host for logging/diagnostics; NOT used to skip Cloudinary re-hosting
// anymore -- see cacheBannerImage() below, which now re-hosts every source unconditionally.
function isDiscordCdnUrl(url) {
    try {
        const { hostname } = new URL(url);
        return hostname === 'cdn.discordapp.com' || hostname === 'media.discordapp.net';
    } catch {
        return false;
    }
}

// Uploads a REMOTE url straight into Cloudinary (server-side fetch, the bot never downloads the
// image itself) -- never throws, a Cloudinary hiccup falls back to the raw URL rather than
// blocking the admin's save, same philosophy as cacheThumbnail()/cachePatchImage().
//
// ⚠️ Discord CDN sources used to skip this upload entirely, on the theory that re-hosting was pure
// downside (an extra copy of an "already-durable" asset). REVERTED 2026-08-07 21:25 EDT -- that
// premise was wrong (see isDiscordCdnUrl's comment: Discord CDN links are signed and expire), so a
// banner set from a Discord link was silently going dead within ~24-48h with no way to detect or
// repair it from the stored URL alone. Every source now re-hosts unconditionally, same as every
// other cached image in this bot. Verified live 2026-08-07: uploading a real Discord CDN banner URL
// to Cloudinary and capping it via capBannerPreviewWidth's Cloudinary branch (c_limit,w_N) correctly
// returned an aspect-preserved 256x144 derivative from a 2048x1152 source -- that branch also
// sidesteps capBannerPreviewWidth's Discord-CDN-branch bug (below) for free, since Cloudinary's
// `c_limit` only ever needs ONE dimension to preserve aspect ratio, unlike Discord's proxy.
async function cacheBannerImage(page, sourceUrl) {
    if (!VALID_PAGES.includes(page)) throw new Error(`Invalid calendar banner page: ${page}`);
    if (isCloudinaryWriteBlocked('upload', publicIdFor(page))) {
        return { url: sourceUrl, cached: false, error: 'blocked: dev bot may not write to the live Cloudinary account' };
    }
    try {
        const result = await cloudinary.uploader.upload(sourceUrl, {
            public_id: publicIdFor(page),
            // Same asset_folder fix as every other Cloudinary module here -- the FOLDER prefix is
            // already baked into the public_id path, but Cloudinary's newer "Folder" UI needs this
            // set separately or the dashboard never groups it visually.
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

// Best-effort delete of a page's cached banner asset -- called when the admin clears a banner
// field back to blank. Never throws; a failed delete just leaves an orphaned (harmless) asset in
// Cloudinary, same non-blocking philosophy as every other write path in this file.
async function clearBannerImage(page) {
    if (!VALID_PAGES.includes(page)) return;
    if (isCloudinaryWriteBlocked('delete_resources', publicIdFor(page))) return;
    try {
        await cloudinary.uploader.destroy(publicIdFor(page), { invalidate: true });
    } catch (err) {
        console.error(`Cloudinary banner clear failed for "${page}" (best-effort, non-fatal): ${safeErrorMessage(err)}`);
    }
}

// Caps the DISPLAYED width of a banner image for the inline preview, without touching whatever's
// actually stored (Harkirat's direct follow-up, 2026-07-31 17:20 EDT: the raw banner rendered
// unnecessarily wide on desktop).
//
// - **Cloudinary source (the only path every banner takes as of 2026-08-07 21:25 EDT):** splices a
//   `c_limit,w_N` transform into the delivery URL (`.../upload/{transform}/v.../public_id`) --
//   verified live to correctly aspect-preserve from a SINGLE dimension (a 2048x1152 source capped to
//   w_256 came back an exact 256x144). Discord shows exactly the URL it's given, both inline and on
//   zoom, so the zoomed view is ALSO capped to this same width -- a Cloudinary-transformed derivative
//   is a genuinely separate, smaller file with no path back to anything larger.
// - **Discord CDN source (LEGACY/DEAD PATH -- do not extend, only exists for pre-2026-08-07 DB rows
//   that haven't been re-saved yet):** `cacheBannerImage()` used to skip re-hosting for a Discord CDN
//   source and rely on `media.discordapp.net`'s own `?width=N` resize proxy instead. Two real bugs
//   found testing this branch, neither worth fixing since the branch itself is being phased out:
//   (1) `?width=N` ALONE is silently ignored by Discord's proxy -- it requires `width` AND `height`
//   together, confirmed via curl (`width=256` alone returned the full-size original; `width=256&
//   height=144` together correctly returned 256x144). This function never sent `height`, so this
//   branch has never actually resized anything. (2) Even fixed, a mismatched box isn't aspect-fit --
//   `width=256&height=256` on the 16:9 source came back a hard-cropped 256x256, not letterboxed --
//   so a correct fix would need the source's real aspect ratio, which this function doesn't have.
//   Moot either way: the underlying URLs are Discord-signed and expire in ~24-48h (see
//   isDiscordCdnUrl's comment), so any DB row still hitting this branch is almost certainly already a
//   dead link regardless of what this does to it.
function capBannerPreviewWidth(url, maxWidth) {
    if (!url) return url;
    if (isDiscordCdnUrl(url)) {
        try {
            const parsed = new URL(url);
            parsed.hostname = 'media.discordapp.net';
            parsed.searchParams.set('width', String(maxWidth));
            return parsed.toString();
        } catch {
            return url;
        }
    }
    if (url.includes('/upload/')) return url.replace('/upload/', `/upload/c_limit,w_${maxWidth}/`);
    return url;
}

module.exports = { cacheBannerImage, clearBannerImage, capBannerPreviewWidth, isDiscordCdnUrl, VALID_PAGES, FOLDER };
