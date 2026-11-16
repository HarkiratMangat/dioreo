// utils/drawPictureHold.js -- keeps a draw index picture for 7 days when Upload Draws or Replace Picture overwrites it, so a Revert can put it back.
//
// Harkirat 2026-11-16 15:04 EST, "sure go ahead" to holding the old picture (his 2026-10-30 rule was "a new image overrides the previous one, no copy kept"; for the draw index it is now "no copy kept after 7 days"). A replaced picture is overwritten in place at `draws/<slug>`, and Cloudinary keeps no old version: measured 2026-11-16 15:06 EST on the dev namespace, a link carrying the old version number serves the NEW bytes once the CDN fetches it again. So the bytes are copied aside first, to `draws_hold/<slug>-<stamp>` (dev: `dev_draws_hold/`), and a Revert copies them back.
//
// The held copy carries none of the draw's tags (a `fp_` tag on it would let the fingerprint lookup in utils/cloudinaryCache.js find it): it is tagged `dioreo_draw_hold` and keeps the original tags and context in its own context, which a restore puts back. A restore first holds what is there now, so reverting a Revert works the same way. The daily cleanup (bot/lifecycle.js) deletes held copies older than HOLD_DAYS. Never throws.
const { isCloudinaryWriteBlocked, IS_DEV } = require('./cloudinaryDevGuard');

const HOLD_DAYS = 7;
const HOLD_TAG = 'dioreo_draw_hold';
const holdFolder = () => (IS_DEV ? 'dev_draws_hold' : 'draws_hold');
// The dev bot writes only into its own dev_ folders; every other id stays blocked there (utils/cloudinaryDevGuard.js).
const devSafe = (id) => String(id || '').startsWith('dev_');
const stamp = (d = new Date()) => d.toISOString().replace(/[-:T]/g, '').slice(0, 14);
const holdIdFor = (publicId, d) => `${holdFolder()}/${String(publicId).split('/').pop()}-${stamp(d)}`;
const errText = (err) => require('./cloudinaryErrors').safeErrorMessage(err);

// Copies the asset now at `publicId` to `holdId`. `res` is its Admin API resource when the caller already has it. Returns { ok, held } (held: null when there was nothing to hold).
async function holdAsset(publicId, holdId, res = undefined) {
    if (isCloudinaryWriteBlocked('draw picture hold', holdId, { devNamespaceSafe: devSafe(holdId) })) return { ok: false, error: 'Cloudinary writes are blocked here.' };
    try {
        const cloudinary = require('cloudinary').v2;
        const cur = res === undefined ? await cloudinary.api.resource(publicId, { context: true, tags: true }).catch(() => null) : res;
        if (!cur?.secure_url) return { ok: true, held: null };
        const ctx = cur.context?.custom || {};
        await cloudinary.uploader.upload(cur.secure_url, {
            public_id: holdId, asset_folder: holdFolder(), overwrite: true, resource_type: 'image', tags: [HOLD_TAG],
            context: { ...ctx, held_from: publicId, held_tags: (cur.tags || []).join(',') },
        });
        return { ok: true, held: holdId };
    } catch (err) {
        return { ok: false, error: errText(err) };
    }
}

// Puts the held copy `from` back at `to`, after holding what is at `to` now as `holdCurrentAs`. Returns { ok, error }.
async function restorePicture({ from, to, holdCurrentAs }) {
    if (!from || !to) return { ok: false, error: 'nothing to restore' };
    if (isCloudinaryWriteBlocked('draw picture restore', to, { devNamespaceSafe: devSafe(to) })) return { ok: false, error: 'Cloudinary writes are blocked here.' };
    try {
        const cloudinary = require('cloudinary').v2;
        const held = await cloudinary.api.resource(from, { context: true }).catch(() => null);
        if (!held?.secure_url) return { ok: false, error: `the old picture was kept for ${HOLD_DAYS} days and is gone now` };
        if (holdCurrentAs) {
            const h = await holdAsset(to, holdCurrentAs);
            if (!h.ok) return { ok: false, error: `the current picture could not be kept first (${h.error}), so it was not replaced` };
        }
        const { held_from: _from, held_tags: heldTags = '', ...context } = held.context?.custom || {};
        await cloudinary.uploader.upload(held.secure_url, {
            public_id: to, asset_folder: String(to).split('/').slice(0, -1).join('/'), overwrite: true, invalidate: true, resource_type: 'image',
            tags: String(heldTags).split(',').filter(Boolean), context,
        });
        return { ok: true };
    } catch (err) {
        return { ok: false, error: errText(err) };
    }
}

// The daily cleanup: held copies older than HOLD_DAYS are deleted. One Admin API listing, then a destroy each. Returns the number deleted.
async function pruneHeld(now = new Date()) {
    const prefix = `${holdFolder()}/`;
    if (isCloudinaryWriteBlocked('draw picture hold prune', prefix, { devNamespaceSafe: devSafe(prefix) })) return 0;
    try {
        const cloudinary = require('cloudinary').v2;
        const list = await cloudinary.api.resources({ type: 'upload', prefix, max_results: 500 });
        const cutoff = now.getTime() - HOLD_DAYS * 24 * 60 * 60 * 1000;
        const old = (list.resources || []).filter(r => new Date(r.created_at).getTime() < cutoff);
        for (const r of old) await cloudinary.uploader.destroy(r.public_id, { invalidate: true }).catch(() => {});
        return old.length;
    } catch (err) {
        console.error(`Draw picture hold cleanup failed: ${errText(err)}`);
        return 0;
    }
}

module.exports = { holdAsset, restorePicture, pruneHeld, holdIdFor, holdFolder, HOLD_DAYS, HOLD_TAG };
