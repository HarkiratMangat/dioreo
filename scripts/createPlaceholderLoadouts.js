// scripts/createPlaceholderLoadouts.js
// One-off/re-runnable seeder for weapons that already have a badge assignment (see
// scripts/applyBadgesBulk.js's "unmatched" report) but no actual loadout data yet -- Harkirat
// wants these weapons live and searchable in the bot NOW (name + badges visible via /gunsmiths
// search/list and autocomplete) even before attachments/Gunsmith code/a real image exist for
// them. Creates exactly one placeholder build per weapon (imageKey/attachments/buildName are all
// required schema fields -- see models/Loadout.js -- so there's no way to have a loadout with
// truly empty content; a single clearly-labeled "Coming Soon" build is the least-special-cased way
// to satisfy that while still rendering something honest). Safe to re-run: skips any weaponKey
// that already has a doc for that mode instead of creating a duplicate.
require('dotenv').config({ quiet: true }); // quiet: true suppresses dotenv's log line + its rotating promotional "tip"
const mongoose = require('mongoose');
const Loadout = require('../models/Loadout');

const PLACEHOLDER_IMAGE = 'https://placehold.co/1024x576/1a1a1a/e5e5e5?text=Coming+Soon';

// weaponName kept in the same ALL-CAPS style as every other MP loadout in the DB (an artifact of
// the original builds.xlsx migration, see CLAUDE.md's MP loadout system section) for consistency.
const PLACEHOLDER_WEAPONS = [
    { weaponName: 'BAL-27', category: 'AR', isMeta: true, categoryRank: 'best', isToxic: false },
    { weaponName: 'FSS HURRICANE', category: 'SMG', isMeta: false, categoryRank: 'top5', isToxic: false },
    { weaponName: 'PHARO', category: 'SMG', isMeta: false, categoryRank: null, isToxic: true },
    { weaponName: 'MACHINE PISTOL', category: 'SECONDARIES', isMeta: false, categoryRank: 'best', isToxic: false },
    { weaponName: 'LCAR', category: 'SECONDARIES', isMeta: false, categoryRank: 'top3', isToxic: false },
    { weaponName: 'GS50', category: 'SECONDARIES', isMeta: false, categoryRank: 'top3', isToxic: false },
    { weaponName: 'CROSSBOW', category: 'SECONDARIES', isMeta: false, categoryRank: null, isToxic: true }
];

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    for (const w of PLACEHOLDER_WEAPONS) {
        const weaponKey = w.weaponName.toLowerCase().replace(/\s+/g, '');
        const existing = await Loadout.findOne({ weaponKey, mode: 'MP' });
        if (existing) {
            console.log(`⏭️  ${w.weaponName}: already has a loadout, skipped.`);
            continue;
        }

        await new Loadout({
            weaponName: w.weaponName,
            weaponKey,
            category: w.category,
            mode: 'MP',
            buildName: 'Coming Soon',
            attachments: ['Coming soon — check back later!'],
            imageKey: PLACEHOLDER_IMAGE,
            description: '',
            shareCode: '',
            isMeta: w.isMeta,
            categoryRank: w.categoryRank,
            isToxic: w.isToxic
        }).save();
        console.log(`✅ ${w.weaponName} (${w.category}): placeholder loadout created.`);
    }

    await mongoose.disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
