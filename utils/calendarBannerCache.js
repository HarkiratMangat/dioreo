// utils/calendarBannerCache.js
// ==========================================
// CALENDAR PAGE BANNER CLOUDINARY CACHE
// ==========================================
// One banner image per /calendar page (Draws/Events/Playlists), independently settable via
// /manage's Calendar "Banners" action (added 2026-07-31 17:20 EDT, notes L184 follow-up). Same
// re-host-so-a-dead-external-link-can't-break-the-command philosophy as utils/cloudinaryCache.js
// (draw thumbnails) and utils/patchNotesCache.js (patch screenshots), but far simpler retention:
// exactly 3 possible public_ids ever exist (calendar_banners/draws|events|playlists), each just
// overwritten in place on every re-set -- no age/season-based pruning needed.
const cloudinary = require('cloudinary').v2;

if (!process.env.CLOUDINARY_URL) {
    console.error('⚠️ CLOUDINARY_URL is not set -- calendar banner caching will fail on every attempt.');
}

const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');

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

// A real Discord CDN link doesn't expire the way an external host (Facebook, etc.) can -- that's
// the whole reason cloudinaryCache.js/patchNotesCache.js re-host in the first place, and it doesn't
// apply to a URL that's already on Discord's own CDN. (Harkirat's direct follow-up, 2026-07-31
// 17:20 EDT.)
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
// A Discord CDN source URL skips the Cloudinary upload entirely -- re-hosting it would be pure
// downside: an extra copy of an already-durable asset, AND it would throw away Discord's own
// dynamic resize proxy (see capBannerPreviewWidth below), which is the one mechanism that actually
// gives a real small-preview/full-resolution-on-click pairing. A Cloudinary-transformed derivative
// can never do that (see capBannerPreviewWidth's Cloudinary branch) -- it's a genuinely separate,
// smaller file with no path back to anything larger.
async function cacheBannerImage(page, sourceUrl) {
    if (!VALID_PAGES.includes(page)) throw new Error(`Invalid calendar banner page: ${page}`);
    if (isDiscordCdnUrl(sourceUrl)) return { url: sourceUrl, cached: true, error: null };
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
        return { url: result.secure_url, cached: true, error: null };
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
// unnecessarily wide on desktop; further follow-up same session: use Discord's own CDN instead of
// Cloudinary where possible, for a REAL small-preview/full-res-on-click pairing). Two branches:
//
// - **Discord CDN source (the good path):** `media.discordapp.net` is Discord's own dynamic resize
//   proxy for its CDN assets -- `?width=N` requests a resized derivative while the ORIGINAL asset
//   stays fully reachable (Discord's own image viewer loads the true source when you click through
//   to zoom, not this resized proxy URL). `cdn.discordapp.com` doesn't accept these query params, so
//   a cdn.discordapp.com URL is rewritten onto the media.discordapp.net host (same path) first.
//   ⚠️ NOT live-verified against a real Discord attachment as of this build (no real banner had been
//   uploaded through this path yet) -- if the preview doesn't visibly shrink once a real Discord CDN
//   banner URL is set, this is the first thing to check.
// - **Cloudinary source (the fallback path, e.g. a non-Discord URL that got re-hosted):** splices a
//   `c_limit,w_N` transform into the delivery URL (`.../upload/{transform}/v.../public_id`). This
//   path has the real platform limitation the Discord path avoids: Discord shows exactly the URL
//   it's given, both inline and on zoom, so the zoomed view here is ALSO capped to this same width --
//   a Cloudinary-transformed derivative is a genuinely separate, smaller file with no path back to
//   anything larger, unlike Discord's own proxy.
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
