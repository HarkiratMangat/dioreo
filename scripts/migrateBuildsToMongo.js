// scripts/migrateBuildsToMongo.js
//
// ONE-TIME MIGRATION: imports builds.xlsx's MP weapon data into the Loadout collection.
//
// Context: MP loadout lookups (the auto-generated /<category> commands + /all) used to run
// entirely off this spreadsheet via an in-memory object parsed at boot. When autocomplete for
// those commands got rewired to query MongoDB's Loadout collection (mode: 'MP'), the actual data
// was never migrated over — the collection was empty, so autocomplete showed nothing. This script
// is the missing migration step. See CLAUDE.md's design decision log for the full story.
//
// Safe to re-run: deletes existing mode:'MP' documents first, so running this twice doesn't
// create duplicates. Run manually with `node scripts/migrateBuildsToMongo.js` — this is NOT
// wired into the bot's normal startup, it's a one-off data-loading tool.
require('dotenv').config({ quiet: true }); // quiet: true suppresses dotenv's log line + its rotating promotional "tip"
const mongoose = require('mongoose');
const xlsx = require('xlsx'); // devDependency -- this one-off migration is the ONLY xlsx consumer in the repo
const Loadout = require('../models/Loadout');

// Same Cloudinary account/transform path already used elsewhere in this bot (e.g. draws.js's
// thumbnailUrl construction). 104 of builds.xlsx's 106 rows already point here directly; only the
// 2 LOCUS rows are hosted on imgur instead. Stripping this prefix back off (when present) so
// `imageKey` stores the bare filename key ("AK117-1.png") for Cloudinary rows -- matching the
// existing bare-key convention (see models/Loadout.js's comment, e.g. "HOLGER-26-1") -- rather
// than a full URL for every single row. buildImageUrl() re-adds this same prefix at render time.
const CLOUDINARY_BASE = 'https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/';

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas.');

    const workbook = xlsx.readFile('./builds.xlsx');
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`Read ${rows.length} rows from builds.xlsx.`);

    // Group rows by weapon so multiple builds for the same gun (e.g. LOCUS has 2 rows) become
    // separate Loadout documents sharing the same weaponKey, distinguished by buildName — same
    // grouping key convention already used by /manage's add/edit modals: lowercase, spaces stripped.
    const grouped = {};
    rows.forEach(row => {
        const weaponKey = row.Name.toLowerCase().replace(/\s+/g, '');
        if (!grouped[weaponKey]) grouped[weaponKey] = [];
        grouped[weaponKey].push(row);
    });

    const docs = [];
    for (const [weaponKey, groupRows] of Object.entries(grouped)) {
        groupRows.forEach((row, idx) => {
            // EXCEL DATE CONVERSION (same formula used by the old loadBuildsFromExcel() in index.js):
            // Excel stores dates as serial numbers counting days since Jan 1, 1900; 25569 is the
            // day-count offset to the Unix epoch (Jan 1, 1970).
            let lastUpdated = row.LastEdited;
            if (typeof row.LastEdited === 'number') {
                lastUpdated = new Date((row.LastEdited - 25569) * 86400 * 1000);
            } else if (row.LastEdited) {
                lastUpdated = new Date(row.LastEdited);
            } else {
                lastUpdated = new Date();
            }

            const attachments = [row.Att1, row.Att2, row.Att3, row.Att4, row.Att5]
                .filter(att => att && att !== 'N/A');

            // Strip the Cloudinary prefix back to a bare key when present; genuine external URLs
            // (the 2 imgur-hosted LOCUS rows) are left as full URLs — buildImageUrl() handles both.
            const imageKey = row.ImageURL.startsWith(CLOUDINARY_BASE)
                ? row.ImageURL.slice(CLOUDINARY_BASE.length)
                : row.ImageURL;

            docs.push({
                weaponKey,
                weaponName: row.Name,
                category: (row.Category || '').toUpperCase(),
                mode: 'MP',
                buildName: `Build ${idx + 1}`,
                attachments,
                imageKey,
                description: row.Description || '',
                shareCode: row.Code || '',
                lastUpdated
            });
        });
    }

    const deleted = await Loadout.deleteMany({ mode: 'MP' });
    console.log(`Cleared ${deleted.deletedCount} existing mode:'MP' documents.`);

    const inserted = await Loadout.insertMany(docs);
    console.log(`Inserted ${inserted.length} Loadout documents across ${Object.keys(grouped).length} unique weapons.`);

    await mongoose.disconnect();
    console.log('Done.');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
