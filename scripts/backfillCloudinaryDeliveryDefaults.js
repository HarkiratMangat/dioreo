// scripts/backfillCloudinaryDeliveryDefaults.js One-time backfill for the `f_auto,q_auto` delivery-URL convention (Harkirat, 2026-08-07 21:51 EDT): draw thumbnails, patch-note images, and calendar banners were all uploaded to Cloudinary via `cloudinary.uploader.upload()` and had their returned `secure_url` stored VERBATIM, with no transform baked in -- unlike loadout images (utils/loadoutRender.js), which construct their delivery URL fresh at render time and always included `f_auto,q_auto`. The three cache modules (utils/cloudinaryCache.js, utils/patchNotesCache.js, utils/calendarBannerCache.js) now apply `withDeliveryDefaults()` on every NEW upload -- this script fixes what's already stored.
//
// Safe to re-run: `withDeliveryDefaults()` is idempotent (checks for the transform segment before inserting), and every field here is unconditionally OVERWRITTEN with the transformed form of whatever string is already there -- never appended/duplicated. A non-Cloudinary URL (external fallback after a failed upload) passes through byte-identical.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const SeasonalData = require('../models/SeasonalData');
const { withDeliveryDefaults } = require('../utils/cloudinaryDeliveryUrl');

function backfillUrlArray(label, entries, field) {
    if (!entries || entries.length === 0) return 0;
    let changed = 0;
    for (const entry of entries) {
        const before = entry[field];
        if (!before) continue;
        const after = withDeliveryDefaults(before);
        if (after !== before) {
            entry[field] = after;
            changed++;
            console.log(`  [${label}] ${entry.title || entry._id}: ${field} updated`);
        }
    }
    return changed;
}

function backfillImagesArray(label, entries) {
    if (!entries || entries.length === 0) return 0;
    let changed = 0;
    for (const entry of entries) {
        if (!entry.images || entry.images.length === 0) continue;
        for (let i = 0; i < entry.images.length; i++) {
            const before = entry.images[i];
            if (!before) continue;
            const after = withDeliveryDefaults(before);
            if (after !== before) {
                entry.images[i] = after;
                changed++;
                console.log(`  [${label}] ${entry.titleOverride || entry.title || entry._id}: images[${i}] updated`);
            }
        }
    }
    return changed;
}

function backfillBannerFields(label, doc) {
    let changed = 0;
    for (const field of ['drawsBannerUrl', 'eventsBannerUrl', 'playlistsBannerUrl']) {
        const before = doc[field];
        if (!before) continue;
        const after = withDeliveryDefaults(before);
        if (after !== before) {
            doc[field] = after;
            changed++;
            console.log(`  [${label}] ${field} updated`);
        }
    }
    return changed;
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await SeasonalData.findOne({ docType: 'global' });
    if (!doc) {
        console.log('No global SeasonalData document found -- nothing to backfill.');
        await mongoose.disconnect();
        return;
    }

    let total = 0;
    total += backfillUrlArray('newDraws', doc.newDraws, 'thumbnailUrl');
    total += backfillUrlArray('returningDraws', doc.returningDraws, 'thumbnailUrl');
    total += backfillImagesArray('patchNotes', doc.patchNotes);
    total += backfillBannerFields('banners', doc);

    if (doc.draft) {
        total += backfillUrlArray('draft.newDraws', doc.draft.newDraws, 'thumbnailUrl');
        total += backfillUrlArray('draft.returningDraws', doc.draft.returningDraws, 'thumbnailUrl');
        total += backfillBannerFields('draft.banners', doc.draft);
        doc.markModified('draft');
    }

    if (total === 0) {
        console.log('Nothing to change -- every stored Cloudinary URL already carries the transform.');
        await mongoose.disconnect();
        return;
    }

    doc.markModified('newDraws');
    doc.markModified('returningDraws');
    doc.markModified('patchNotes');
    await doc.save();
    console.log(`\nSaved. ${total} URL(s) updated.`);
    await mongoose.disconnect();
}

main().catch(err => { console.error('Fatal:', err?.message || err); process.exit(1); });
