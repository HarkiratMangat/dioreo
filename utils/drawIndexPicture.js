// utils/drawIndexPicture.js -- puts an uploaded draw poster into Cloudinary for the owner's Upload Draws and Replace Picture (/bot drawindex).
//
// Prod writes `draws/<slug>`, the one permanent folder (utils/cloudinaryCache.js FOLDER; his rule 2026-10-30: a new image overrides the previous one). A picture it overwrites is first held for 7 days (utils/drawPictureHold.js, his 2026-11-16 15:04 EST "sure go ahead"), so a Revert can put it back; if it cannot be held, nothing is replaced. The dev bot shares prod's Cloudinary account (utils/cloudinaryDevGuard.js), so on dev the picture goes to `dev_draws/<slug>`, a namespace no prod asset lives in, and the guard lets it through (devNamespaceSafe). Cloudinary fetches the Discord link itself; the bot never holds the bytes.
//
// Tags and context are written WITH the upload (catalogMirrorPlan's shape), so a new asset is complete without a second call. Never throws: { ok, url, publicId, hold } (hold: the held copy's id, or null when nothing was overwritten) or { ok: false, error }.
const { isCloudinaryWriteBlocked, IS_DEV } = require('./cloudinaryDevGuard');

const folder = () => (IS_DEV ? 'dev_draws' : require('./cloudinaryCache').FOLDER);
const publicIdForSlug = (slug) => `${folder()}/${slug}`;

// `crop` ({ width, height, bar }): the logo bar to cut off the bottom first (utils/drawPictureBar.js), measured on this same file.
async function uploadPicture({ slug, sourceUrl, doc, previousTags = [], inserted = false, crop = null }) {
    const cc = require('./cloudinaryCache');
    const publicId = publicIdForSlug(slug);
    if (isCloudinaryWriteBlocked('draw index upload', publicId, { devNamespaceSafe: IS_DEV })) return { ok: false, error: 'Cloudinary writes are blocked here.' };
    try {
        const cloudinary = require('cloudinary').v2;
        const plan = cc.catalogMirrorPlan(doc, { previousTags, inserted, year: doc.releaseYear || new Date().getUTCFullYear() });
        const meta = cc.metadataFor(doc.title, { items: doc.items, priceType: doc.priceType });
        // A replaced picture that carried another fingerprint: its old fp_ tag goes, or the old items would still find this asset (the same rule as cacheThumbnail).
        const res = await cloudinary.api.resource(publicId, { context: true, tags: true }).catch(() => null);
        const old = res ? cc.readDrawContext(res) : null;
        // The picture about to be overwritten is held first; without that copy a Revert could not bring it back, so a failed hold replaces nothing.
        let hold = null;
        if (res) {
            const H = require('./drawPictureHold');
            const h = await H.holdAsset(publicId, H.holdIdFor(publicId), res);
            if (!h.ok) return { ok: false, error: `the old picture could not be kept for Revert (${h.error}), so it was not replaced` };
            hold = h.held;
        }
        if (old?.fp && old.fp !== meta.fp) await cloudinary.uploader.remove_tag(`${cc.FP_TAG_PREFIX}${old.fp}`, [publicId]).catch(() => {});
        const contextPairs = { ...meta.context, ...Object.fromEntries(String(plan.context || '').split('|').filter(Boolean).map(p => { const i = p.indexOf('='); return [p.slice(0, i), p.slice(i + 1)]; })) };
        const result = await cloudinary.uploader.upload(sourceUrl, {
            public_id: publicId,
            asset_folder: folder(),
            overwrite: true,
            invalidate: true,
            resource_type: 'image',
            // Stored at most 2048px on its long side (2026-11-16 12:41 EST, his question "what about the image that's stored and presented? its file size"): measured over the 106 pictures already in draws/, the median is 1080 wide and 296 KB, the 90th percentile 2048 wide, and the largest 3840 wide at 2.8 MB. Discord never shows a draw wider than about 550px, and players get it through f_auto,q_auto (WebP or AVIF, compressed) whatever is stored, so the cap only stops a 4K screenshot sitting in the account at full size. The format is kept.
            transformation: [
                ...(crop?.bar > 0 && crop.width && crop.height > crop.bar ? [{ crop: 'crop', width: crop.width, height: crop.height - crop.bar, gravity: 'north' }] : []),
                { width: 2048, height: 2048, crop: 'limit' },
            ],
            tags: [...new Set([...meta.tags, ...plan.addTags])],
            context: contextPairs,
        });
        return { ok: true, url: require('./cloudinaryDeliveryUrl').withDeliveryDefaults(result.secure_url), publicId, hold };
    } catch (err) {
        return { ok: false, error: require('./cloudinaryErrors').safeErrorMessage(err) };
    }
}

module.exports = { uploadPicture, publicIdForSlug, folder };
