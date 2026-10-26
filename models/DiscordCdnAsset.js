// models/DiscordCdnAsset.js -- durable, Cloudinary-INDEPENDENT record of which Discord storage-channel message holds a given rendered nameplate/decoration WebP's bytes (added 2026-08-17 19:07 EDT, closing the gap recorded in docs/db-deferred-list.md / docs/archive/resolved-list.md: "a deleted Cloudinary resource orphans its storage-channel message permanently").
//
// WHY a second index at all: utils/nameplateWebpCache.js / utils/decorationWebpCache.js treat Cloudinary as the SOLE record of "does a rendered WebP for this design already exist, and which Discord CDN url points at it" -- the `discord_cdn_url` lives only in that Cloudinary resource's `context`. So deleting the Cloudinary resource (a cache purge, an accidental Media Library delete, anything) destroys BOTH the cached bytes AND the only pointer back to the Discord message that already holds an untouched copy of those same bytes -- even though that message is still sitting in the channel, genuinely recoverable. This collection is that second, independent pointer: one row per rendered design (`publicId`, the same string used as the Cloudinary `public_id`/cache key), written in the SAME step the Discord upload succeeds, so it survives a Cloudinary-side deletion untouched. See `utils/discordCdnAssetIndex.js`'s `recoverCloudinaryFromDiscordCdnAsset()` for how it's used to recover.
//
// Deliberately NOT a mirror of Cloudinary's richer context (no palette, no catalog metadata) -- its only job is "which message, which attachment, which url", the minimum needed to recover. Catalog metadata (sku_id, collection, etc) already has its own re-attachment path via scripts/bulkCacheCollectibles.js's toHeal branch once a recovered resource is detected (`render_source: 'recovered'` in the healed Cloudinary context).
const mongoose = require('mongoose');

const DiscordCdnAssetSchema = new mongoose.Schema({
    // The Cloudinary public_id / cache key -- see nameplateWebpCache.js's/decorationWebpCache.js's publicIdFor(). One row per rendered design, kept current via upsert (a re-render of the same design overwrites its row, matching this codebase's "cache key is the design, not the render attempt" convention).
    publicId: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ['nameplate', 'decoration'], required: true },
    discordChannelId: { type: String, required: true },
    discordMessageId: { type: String, required: true },
    // The resolved cdn.discordapp.com url at write time. Discord auto-refreshes a stale signed url's `ex`/`is`/`hm` params when it's passed back into an API field (see utils/discordCdnStorage.js's header) -- but the RECOVERY path here re-fetches this exact url directly with a plain `fetch()`, not through a Discord API field, so a genuinely expired signature would fail that fetch. Acceptable: the failure is caught and degrades to a normal full re-render, same as any other recovery failure.
    discordCdnUrl: { type: String, required: true },
    filename: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('DiscordCdnAsset', DiscordCdnAssetSchema);
