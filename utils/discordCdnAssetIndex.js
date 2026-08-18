// utils/discordCdnAssetIndex.js -- read/write access to the DiscordCdnAsset durable secondary index (models/DiscordCdnAsset.js -- read that file's header first) plus the recovery routine that USES it: restoring a Cloudinary resource's rendered bytes from the Discord storage-channel message that already holds an untouched copy, when the Cloudinary resource itself was deleted out-of-band. Shared by utils/nameplateWebpCache.js and utils/decorationWebpCache.js so the two caches cannot drift, same "one shared module" rule utils/collectibleCacheKey.js's header documents for the cache-key construction.
//
// Every function here follows the SAME non-blocking philosophy as every other Cloudinary/Discord write in this pipeline: never throws, degrades to "as if this index didn't exist" on any failure (a Mongo hiccup on the index must never break a render or a cache read that would otherwise succeed).
const cloudinary = require('./cloudinaryClient'); // timed proxy over the SDK -- see utils/cloudinaryClient.js
const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');
const DiscordCdnAsset = require('../models/DiscordCdnAsset');

// SECURITY: never log a raw Cloudinary error object -- same leak shape as every other Cloudinary module here (the Admin API's rejected-promise carries the account's live API key+secret in `request_options.auth`).
function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}

// Upserted (never a blind insert) so re-rendering the same design -- a legitimate, expected event, e.g. a catalog refresh healing a fallback entry -- keeps exactly one row per publicId rather than accumulating stale ones. Called from the SAME step the Discord upload succeeds (both the single-file live path and the bulk script's per-variant loop), so a later Cloudinary-side deletion cannot un-write this.
async function recordDiscordCdnAsset({ publicId, kind, channelId, messageId, discordCdnUrl, filename }) {
    if (!publicId || !channelId || !messageId || !discordCdnUrl || !filename) return;
    try {
        await DiscordCdnAsset.updateOne(
            { publicId },
            { $set: { kind, discordChannelId: channelId, discordMessageId: messageId, discordCdnUrl, filename } },
            { upsert: true }
        );
    } catch (err) {
        console.error(`DiscordCdnAsset index write failed for "${publicId}": ${err.message}`);
    }
}

async function getDiscordCdnAsset(publicId) {
    if (!publicId) return null;
    try {
        return await DiscordCdnAsset.findOne({ publicId }).lean();
    } catch (err) {
        console.error(`DiscordCdnAsset index lookup failed for "${publicId}": ${err.message}`);
        return null;
    }
}

// Restores a Cloudinary resource's RENDERED BYTES from an already-uploaded Discord CDN copy, when the resource was deleted out-of-band but this durable index still points at the message it lives in -- the whole point of keeping a second, Cloudinary-independent record. Fetches the still-live cdn.discordapp.com bytes directly (never re-encoded, never proxied -- see discordCdnStorage.js's header) and re-uploads them to Cloudinary at the SAME public_id, which is what makes every existing cache-read/heal code path work completely unmodified afterward.
//
// Deliberately restores ONLY `discord_cdn_url` + `discord_message_id` + `render_source: 'recovered'` into context, NOT a palette and NOT catalog metadata (sku_id/collection/etc) -- those lived only in the deleted resource's context and are not this index's job to remember (see models/DiscordCdnAsset.js's header). The caller gets back `{ cloudinaryUrl, discordCdnUrl }` with no palette, which is what makes resolveNameplateWebp/resolveDecorationWebp's EXISTING `cached.palette ? cached : healPalette(...)` branch route a recovered entry straight into the self-heal path each cache module already has -- healPalette re-derives the palette from the original source asset. Catalog metadata is separately re-attached the next time scripts/bulkCacheCollectibles.js runs (its toHeal branch treats `render_source: 'recovered'` the same as `'fallback'`).
//
// The genuinely useful part: this skips the render pipeline's single most expensive phase entirely -- per-frame Jimp compositing + the ffmpeg WebP encode (measured 63-71% of a nameplate render's cost, docs/db-deferred-list.md's renderGradientBedFrame item) -- since the already-ENCODED bytes are recovered directly rather than rebuilt from the source APNG. Only the (comparatively cheap) palette extraction is repaid, by healPalette, same as it always would be for any palette-less cache entry.
//
// Returns { cloudinaryUrl, discordCdnUrl } on success, null on any failure (including "no index record exists" -- a genuine cold miss) or when Cloudinary writes are blocked (dev-guard) -- callers fall through to a full re-render exactly like today's plain cache-miss behavior.
async function recoverCloudinaryFromDiscordCdnAsset(publicId, assetFolder) {
    const record = await getDiscordCdnAsset(publicId);
    if (!record) return null;
    if (isCloudinaryWriteBlocked('upload', publicId, { devNamespaceSafe: true })) return null;
    try {
        const res = await fetch(record.discordCdnUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${record.discordCdnUrl}`);
        const webpBuffer = Buffer.from(await res.arrayBuffer());
        const uploadResult = await cloudinary.uploader.upload(
            `data:image/webp;base64,${webpBuffer.toString('base64')}`,
            { public_id: publicId, asset_folder: assetFolder, overwrite: true, invalidate: true, resource_type: 'image' }
        );
        // A second, lightweight call rather than folding context into the upload above -- matches this codebase's existing convention (attachNameplateDiscordCdnUrl/attachDecorationDiscordCdnUrl) of uploading bytes and patching context as separate steps.
        await cloudinary.api.update(publicId, {
            resource_type: 'image',
            context: { discord_cdn_url: record.discordCdnUrl, discord_message_id: record.discordMessageId, render_source: 'recovered' }
        });
        // discordMessageId included (v3-pre-release review, finding #23) -- previously omitted, so every caller's own rawContext stub for a recovered entry silently dropped it, and the FIRST palette heal after a recovery wiped it from Cloudinary within one page view of being restored.
        return { cloudinaryUrl: uploadResult.secure_url, discordCdnUrl: record.discordCdnUrl, discordMessageId: record.discordMessageId };
    } catch (err) {
        console.error(`Cloudinary recovery from Discord CDN asset failed for "${publicId}": ${safeErrorMessage(err)}`);
        return null;
    }
}

module.exports = { recordDiscordCdnAsset, getDiscordCdnAsset, recoverCloudinaryFromDiscordCdnAsset };
