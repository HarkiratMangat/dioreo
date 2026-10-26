// scripts/backfillLoadoutMetadata.js One-time / re-runnable: ports every existing Loadout's data (weapon name, mode, build number, Gunsmith code, badges, created/updated dates) into its Cloudinary asset's Structured Metadata. Added 2026-07-21 -- the metadata fields (see utils/loadoutImageCache.js's METADATA_FIELDS) started empty on existing assets; this fills them from Mongo, which is the system of record.
//
// Does NOT set the per-slot fields (Muzzle/Barrel/...) -- the slot->attachment mapping only exists at /autobuild vision-extraction time and was never stored in Mongo, so it can't be reconstructed for pre-existing builds. Those fill in going forward as builds are (re)created via /autobuild.
//
// Best-effort per doc (syncLoadoutMetadata never throws): external-URL / PENDING-UPLOAD keys are skipped, and a key whose Cloudinary asset doesn't exist is reported (not fatal). Safe to re-run.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const Loadout = require('../models/Loadout');
const { syncLoadoutMetadata } = require('../utils/loadoutImageCache');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const docs = await Loadout.find({}).lean();
    console.log(`Backfilling metadata for ${docs.length} loadout doc(s)...\n`);

    let synced = 0, skipped = 0, notFound = 0, failed = 0;
    const problems = [];
    for (const doc of docs) {
        const res = await syncLoadoutMetadata(doc);
        if (res.success) {
            synced++;
        } else if (/no real Cloudinary key/.test(res.error)) {
            skipped++;
            problems.push(`SKIP  ${doc.weaponName} (${doc.buildName}, ${doc.mode}) -- key "${doc.imageKey}" (external/placeholder)`);
        } else if (/no Cloudinary asset/.test(res.error)) {
            notFound++;
            problems.push(`MISS  ${doc.weaponName} (${doc.buildName}, ${doc.mode}) -- no asset at "${doc.imageKey}"`);
        } else {
            failed++;
            problems.push(`FAIL  ${doc.weaponName} (${doc.buildName}, ${doc.mode}) -- ${res.error}`);
        }
    }

    console.log(`Done. synced=${synced}, skipped(external/placeholder)=${skipped}, asset-missing=${notFound}, failed=${failed}`);
    if (problems.length > 0) {
        console.log('\nNon-synced docs (for review -- these are real data gaps, not script errors):');
        problems.forEach(p => console.log('  ' + p));
    }
    await mongoose.disconnect();
}

main().catch(err => { console.error('Fatal:', err?.message || err); process.exit(1); });
