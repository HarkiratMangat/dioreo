// scripts/createCloudinaryMetadataFields.js
// One-time / re-runnable: creates the Cloudinary STRUCTURED METADATA FIELDS that /autobuild's image
// uploads populate (weapon name, mode, build number, Gunsmith code, and one field per Gunsmith slot).
// Added 2026-07-21 at Harkirat's request -- see utils/loadoutImageCache.js's METADATA_FIELDS (the
// single source of truth this script reads) and CLAUDE.md's Cloudinary/loadout-automation notes.
//
// IDEMPOTENT: lists the account's existing metadata fields first and only creates the ones that are
// missing, so re-running it after adding a new field to METADATA_FIELDS is safe (it just fills the
// gap). The account already had a stray `Barrel` string field before this ran -- that one is reused
// as-is and reported as "exists".
//
// Reads credentials from CLOUDINARY_URL in .env (same as the bot). Run: `node scripts/createCloudinaryMetadataFields.js`.
//
// NOT a backfill: this only defines the field SCHEMA. Existing gun-builds assets keep their (currently
// empty) metadata until re-uploaded through /autobuild. Backfilling weapon name / mode / build number /
// Gunsmith code onto existing assets from Mongo is possible (those live on the Loadout doc) but is
// deliberately deferred; the per-slot fields can't be backfilled at all (the slot->attachment mapping
// only comes from the vision extraction, never stored in Mongo).
require('dotenv').config({ quiet: true });
const cloudinary = require('cloudinary').v2;
const { METADATA_FIELDS } = require('../utils/loadoutImageCache');
const { PATCH_METADATA_FIELDS } = require('../utils/patchNotesCache');

// Loadout fields + patch-notes fields (both live on the same account -- a given asset only sets the
// ones that apply to it). One idempotent pass creates whatever's missing across both sets.
const ALL_FIELDS = [...METADATA_FIELDS, ...PATCH_METADATA_FIELDS];

async function main() {
    if (!process.env.CLOUDINARY_URL) {
        console.error('❌ CLOUDINARY_URL is not set (expected in .env). Aborting.');
        process.exit(1);
    }

    const existingRes = await cloudinary.api.list_metadata_fields();
    const existing = new Set((existingRes.metadata_fields || []).map(f => f.external_id));
    console.log(`Found ${existing.size} existing metadata field(s): ${[...existing].join(', ') || '(none)'}\n`);

    let created = 0, skipped = 0, failed = 0;
    for (const field of ALL_FIELDS) {
        if (existing.has(field.external_id)) {
            console.log(`⏭️  exists   ${field.external_id} (${field.type})`);
            skipped++;
            continue;
        }
        try {
            await cloudinary.api.add_metadata_field({
                external_id: field.external_id,
                label: field.label,
                type: field.type,
                mandatory: false
            });
            console.log(`✅ created  ${field.external_id} (${field.type})`);
            created++;
        } catch (err) {
            const msg = err?.error?.message || err?.message || String(err);
            console.error(`❌ FAILED   ${field.external_id}: ${msg}`);
            failed++;
        }
    }

    console.log(`\nDone. created=${created}, existed=${skipped}, failed=${failed}`);
    // Re-list so the final state is visible/verifiable.
    const finalRes = await cloudinary.api.list_metadata_fields();
    console.log(`Account now has ${finalRes.metadata_fields.length} metadata field(s): ${finalRes.metadata_fields.map(f => `${f.external_id}(${f.type})`).join(', ')}`);
    if (failed > 0) process.exit(1);
}

main().catch(err => {
    console.error('Fatal:', err?.error?.message || err?.message || err);
    process.exit(1);
});
