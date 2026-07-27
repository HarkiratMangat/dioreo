// Fail-closed Cloudinary write guard for the local dev bot.
//
// `.env.dev`'s CLOUDINARY_URL is byte-identical to prod's -- the dev bot is NOT on a separate
// Cloudinary account, it talks to the LIVE one. Found 2026-07-27 17:40 EDT while verifying dev/prod
// isolation for the v3 development structure; BOT_TOKEN, MONGODB_URI and LOG_WEBHOOK_URL were all
// correctly separated, this was the one that wasn't.
//
// READS are deliberately left alone. Loadout image URLs stored in Mongo point at prod Cloudinary
// assets, so putting dev on a different account would render every loadout broken locally -- gutting
// the dev bot for exactly the image features it exists to test.
//
// WRITES are the problem, and folder-scoping cannot fix the worst of them:
//   - `gun-builds` loadout uploads use a BARE public_id (the imageKey), with the folder carried only
//     in `asset_folder` -- a decoupled dashboard label, NOT part of the asset's identity. So a dev
//     upload of an existing imageKey OVERWRITES the live image. A `-dev` folder cannot prevent that;
//     only not-writing can.
//   - `delete_resources` (both prune sweeps) and `update_metadata` against prod public_ids are
//     likewise irreversible against live assets.
//
// Hence fail CLOSED: in development every Cloudinary write is refused and logged loudly. If a feature
// ever genuinely needs real dev-side writes, the fix is a properly designed parallel namespace (filed
// in docs/db-deferred-list.md), not loosening this.
//
// ⚠️ Why this is safe in prod: `NODE_ENV=development` is set by `.env.dev` and by nothing else. Prod's
// `.env` does not define it, and index.js's `dotenv.config()` backfill can only fill in keys that
// exist SOMEWHERE -- it cannot invent one. So prod evaluates IS_DEV as false and every write proceeds
// byte-identically to before. This is read once at require time, matching utils/emojiMap.js's existing
// NODE_ENV check rather than introducing a second pattern.
const IS_DEV = process.env.NODE_ENV === 'development';

// Returns true if the caller must NOT perform the write. Callers return their own established
// "upload/metadata failed" shape on true, so nothing downstream needs to learn a new contract -- the
// dev bot then behaves exactly as it would against a Cloudinary hiccup, which every one of these call
// sites was already designed to survive.
function isCloudinaryWriteBlocked(operation, target) {
    if (!IS_DEV) return false;
    console.warn(`⛔ [dev] Cloudinary ${operation} BLOCKED -- would have written to the LIVE account: ${target}`);
    return true;
}

module.exports = { isCloudinaryWriteBlocked, IS_DEV };
