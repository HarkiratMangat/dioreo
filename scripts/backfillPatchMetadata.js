// scripts/backfillPatchMetadata.js
// One-time / re-runnable: writes Structured Metadata (season, image order, release date, patch id)
// onto every already-cached patch-notes image, sourced from the SeasonalData patchNotes[] entries.
// Added 2026-07-21 alongside the loadout backfill -- the patch metadata fields (see
// utils/patchNotesCache.js's PATCH_METADATA_FIELDS) started empty on existing assets.
//
// Only touches images that are already cached in Cloudinary under patch_notes/{patchId}/{index}
// (setPatchImageMetadata no-ops on a public_id that doesn't exist). Safe to re-run.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const SeasonalData = require('../models/SeasonalData');
const { syncPatchEntryMetadata } = require('../utils/patchNotesCache');
const { cleanPatchTitle } = require('../commands/patchnotes');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
    const entries = doc?.patchNotes || [];
    console.log(`Backfilling patch metadata for ${entries.length} patch entry(ies)...\n`);

    for (const entry of entries) {
        const season = cleanPatchTitle(entry.title);
        const count = (entry.images || []).length;
        await syncPatchEntryMetadata(entry, season);
        console.log(`✅ ${season} (patch ${entry._id}) -- ${count} image(s), release ${entry.releaseDate ? new Date(entry.releaseDate).toISOString().slice(0, 10) : 'none'}`);
    }

    console.log('\nDone.');
    await mongoose.disconnect();
}

main().catch(err => { console.error('Fatal:', err?.message || err); process.exit(1); });
