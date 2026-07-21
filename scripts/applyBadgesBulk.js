// scripts/applyBadgesBulk.js
// One-off/re-runnable bulk badge importer -- lets Harkirat paste a big list of weapon->badge
// assignments (originally from badges.rtf) instead of clicking through /manage's edit-loadout
// modal for each weapon individually. Same pattern as scripts/migrateBuildsToMongo.js: safe to
// re-run if the source list changes, since it just overwrites the badge fields on match.
//
// Matching: each weapon name below is fuzzy-matched (utils/search.js's normalizeForSearch, so
// spaces/hyphens/underscores/periods are ignored) as a SUBSTRING of the stored `weaponKey`,
// scoped to the category it's listed under here (categories are known upfront from this list's
// own grouping, so there's no risk of an abbreviated query like "HVK" matching a weapon in the
// wrong category). Every build sharing that weaponKey+mode gets updated (same "badges describe
// the weapon, not one build" propagation index.js's edit_loadout_ handler already does).
require('dotenv').config();
const mongoose = require('mongoose');
const Loadout = require('../models/Loadout');
const { parseLoadoutBadges } = require('../utils/adminParser');
const { normalizeForSearch } = require('../utils/search');

// Source: badges.rtf (pasted 2026-07-08). Badge strings use the same tokens parseLoadoutBadges
// already understands ("Meta", "Best", "Top N", "Toxic"), just pipe-separated here to match how
// they were originally typed out.
const BADGE_DATA = {
    AR: {
        'Bal-27': 'Meta | Best',
        'Oden': 'Top 5',
        'Man o War': 'Meta | Toxic',
        'KN44': 'Top 5',
        'DRH': 'Meta | Top 3',
        'HVK': 'Top 5'
    },
    SMG: {
        'CX9': 'Meta | Top 3',
        'Switchblade': 'Meta | Best',
        'QQ9': 'Top 5',
        'FSS Hurricane': 'Top 5',
        'Pharo': 'Toxic',
        'USS9': 'Meta | Top 3'
    },
    SHOTGUN: {
        'KRM': 'Top 3',
        'HS0405': 'Top 3',
        'Jak12': 'Top 5 | Toxic',
        'Striker': 'Meta | Best | Toxic',
        'BY15': 'Top 5'
    },
    MARKSMAN: {
        'SO-14': 'Meta | Best',
        'SKS': 'Top 3',
        'SPR': 'Top 5',
        'Type 63': 'Top 3'
    },
    SNIPER: {
        'Locus': 'Meta | Best',
        'Tundra': 'Meta | Top 3',
        'DLQ33': 'Top 5',
        '3-Line Rifle': 'Top 3',
        'Koshka': 'Top 5',
        'NA45': 'Toxic'
    },
    LMG: {
        'Chopper': 'Top 3',
        'MG42': 'Top 5',
        'Raal': 'Top 3',
        'PKM': 'Best'
    },
    SECONDARIES: {
        'Machine Pistol': 'Best',
        'LCAR': 'Top 3',
        'GS50': 'Top 3',
        'Crossbow': 'Toxic'
    }
};

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const allMp = await Loadout.find({ mode: 'MP' }).select('weaponKey category weaponName').lean();
    let updatedWeaponCount = 0;
    let updatedBuildCount = 0;
    const unmatched = [];

    for (const [category, weapons] of Object.entries(BADGE_DATA)) {
        const candidates = allMp.filter(d => d.category === category);

        for (const [queryName, badgesStr] of Object.entries(weapons)) {
            const normalizedQuery = normalizeForSearch(queryName);
            const match = candidates.find(d => normalizeForSearch(d.weaponKey).includes(normalizedQuery));

            if (!match) {
                unmatched.push(`${category} / ${queryName} (badges: ${badgesStr})`);
                continue;
            }

            // Convert "Meta | Best" -> "meta,best" so parseLoadoutBadges (comma-delimited) parses it
            const normalizedTokens = badgesStr.split('|').map(s => s.trim().toLowerCase()).join(',');
            const { isMeta, categoryRank, isToxic, unrecognized } = parseLoadoutBadges(normalizedTokens);
            if (unrecognized.length > 0) {
                console.warn(`⚠️  ${category} / ${queryName}: unrecognized token(s) ${unrecognized.join(', ')}`);
            }

            const result = await Loadout.updateMany(
                { weaponKey: match.weaponKey, mode: 'MP' },
                { isMeta, categoryRank, isToxic }
            );
            updatedWeaponCount++;
            updatedBuildCount += result.modifiedCount;
            // Keep Cloudinary structured metadata in sync with the badges just applied (2026-07-21).
            const { syncLoadoutMetadata } = require('../utils/loadoutImageCache');
            for (const b of await Loadout.find({ weaponKey: match.weaponKey, mode: 'MP' })) await syncLoadoutMetadata(b);
            console.log(`✅ ${match.weaponName} (${category}): ${badgesStr} -> ${result.modifiedCount} build(s) updated`);
        }
    }

    console.log(`\nDone. ${updatedWeaponCount} weapon(s) matched, ${updatedBuildCount} build doc(s) updated.`);
    if (unmatched.length > 0) {
        console.log(`\n⚠️  ${unmatched.length} unmatched (no loadout exists yet for these):`);
        unmatched.forEach(u => console.log(`  - ${u}`));
    }

    await mongoose.disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
