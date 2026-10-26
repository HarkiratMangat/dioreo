// Fail-closed Cloudinary write guard for the local dev bot.
//
// `.env.dev`'s CLOUDINARY_URL is byte-identical to prod's -- the dev bot is NOT on a separate Cloudinary account, it talks to the LIVE one. Found 2026-07-27 17:40 EDT while verifying dev/prod isolation for the v3 development structure; BOT_TOKEN, MONGODB_URI and LOG_WEBHOOK_URL were all correctly separated, this was the one that wasn't.
//
// READS are deliberately left alone. Loadout image URLs stored in Mongo point at prod Cloudinary assets, so putting dev on a different account would render every loadout broken locally -- gutting the dev bot for exactly the image features it exists to test.
//
// WRITES are the problem, and folder-scoping cannot fix the worst of them:
//   - `gun-builds` loadout uploads use a BARE public_id (the imageKey), with the folder carried only in `asset_folder` -- a decoupled dashboard label, NOT part of the asset's identity. So a dev upload of an existing imageKey OVERWRITES the live image. A `-dev` folder cannot prevent that; only not-writing can.
//   - `delete_resources` (both prune sweeps) and `update_metadata` against prod public_ids are likewise irreversible against live assets.
//
// Hence fail CLOSED: in development every Cloudinary write is refused and logged loudly, UNLESS the caller opts in via `devNamespaceSafe: true` -- meaning it has already prefixed its OWN public_id/ folder into an isolated dev-only namespace (verified case by case, not something this guard can infer from a string) so a dev write genuinely cannot collide with or overwrite a live prod asset. This is the "properly designed parallel namespace" the fix docs/db-deferred-list.md filed for this guard (2026-07-27 18:40 EDT) called for, added 2026-08-10 11:30 EDT for utils/nameplateWebpCache.js / utils/decorationWebpCache.js specifically -- NOT a blanket loosening. Every other existing caller (loadout images, patch notes, calendar banners) passes no third argument and stays unconditionally blocked in dev, unchanged. The deferred item's own caution about `gun-builds` (bare imageKey as public_id, no folder baked into asset identity, needs buildImageUrl() to agree too) is why this opt-in was NOT extended there -- do that separately, deliberately, when it's actually needed.
//
// ⚠️ Why this is safe in prod: `NODE_ENV=development` is set by `.env.dev` and by nothing else. Prod's `.env` does not define it, and index.js's `dotenv.config()` backfill can only fill in keys that exist SOMEWHERE -- it cannot invent one. So prod evaluates IS_DEV as false and every write proceeds byte-identically to before. This is read once at require time, matching utils/emojiMap.js's existing NODE_ENV check rather than introducing a second pattern.
const IS_DEV = process.env.NODE_ENV === 'development';

// Returns true if the caller must NOT perform the write. Callers return their own established "upload/metadata failed" shape on true, so nothing downstream needs to learn a new contract -- the dev bot then behaves exactly as it would against a Cloudinary hiccup, which every one of these call sites was already designed to survive.
//
// `devNamespaceSafe: true` is the opt-in described in this module's header comment -- the caller is asserting `target` is already inside an isolated dev-only namespace (its own `FOLDER` constant is prefixed, e.g. `dev_nameplate_webp` vs prod's `nameplate_webp`), so allowing the write through in dev cannot touch a live prod asset. Defaults to false so every existing caller is completely unaffected by this parameter's mere existence.
function isCloudinaryWriteBlocked(operation, target, { devNamespaceSafe = false } = {}) {
    if (!IS_DEV) return false;
    if (devNamespaceSafe) {
        console.warn(`🧪 [dev] Cloudinary ${operation} ALLOWED (dev-scoped namespace): ${target}`);
        return false;
    }
    console.warn(`⛔ [dev] Cloudinary ${operation} BLOCKED -- would have written to the LIVE account: ${target}`);
    return true;
}

module.exports = { isCloudinaryWriteBlocked, IS_DEV };
