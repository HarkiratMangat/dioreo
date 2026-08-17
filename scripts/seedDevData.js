// scripts/seedDevData.js Replaces the dev database's UserPreference records with SYNTHETIC ones.
//
// WHY THIS EXISTS. The dev database used to be seeded by `mongodump` from production and `mongorestore` into `diors-builds-dev`, which put real users' Discord IDs and preferences onto a development machine -- personal data, in a second location, that the Privacy Policy did not disclose and had no reason to. Found 2026-08-04 11:55 EDT: 17 real snowflake IDs sitting in the local dev database. Harkirat's decision, recorded 2026-08-04 12:07 EDT, was to stop using real data rather than to document the copy -- that removes the processing instead of describing it, and it is the standard answer to production personal data in a development environment.
//
// So: dev gets made-up people now. Nothing here is derived from a real account.
//
// ⚠️ THE GUARD IS THE POINT OF THIS SCRIPT, NOT THE SEEDING. It deletes every UserPreference in the database it connects to. Pointed at production that is a data loss incident, and the difference between the two is one environment variable. So it refuses to run unless the target looks unmistakably like a local dev database, and it refuses to delete anything at all without --yes. Both checks are cheap; the failure they prevent is not recoverable.
//
//   node --env-file=.env.dev scripts/seedDevData.js          # dry run, reports only
//   node --env-file=.env.dev scripts/seedDevData.js --yes    # actually replaces
//
// Safe to re-run: it clears and re-inserts rather than appending, so the collection holds exactly the synthetic set afterwards however many times it has run.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const UserPreference = require('../models/UserPreference');

const APPLY = process.argv.includes('--yes');

/**
 * Refuse anything that is not obviously a local development database.
 *
 * Both conditions are required, because either alone is defeatable by an ordinary mistake: a local mongod can host a database called anything, and a remote host can host one called `diors-builds-dev`. Requiring a loopback host AND a dev-marked database name means a single wrong variable cannot reach production.
 */
function assertDevTarget(uri) {
    if (!uri) {
        throw new Error('MONGODB_URI is not set. Run with --env-file=.env.dev.');
    }
    const local = /(^|@|\/\/)(localhost|127\.0\.0\.1)(:|\/)/.test(uri);
    const dbName = (uri.split('/').pop() || '').split('?')[0];
    const devNamed = /-dev\b|_dev\b|^dev-/.test(dbName);
    if (!local || !devNamed) {
        throw new Error(
            'REFUSING TO RUN. This script deletes every UserPreference in the target ' +
            'database, so it only runs against a local, dev-named one.\n' +
            `  host is loopback : ${local}\n` +
            `  database name    : ${dbName || '(none)'} (dev-named: ${devNamed})\n` +
            'If you meant to seed dev, pass --env-file=.env.dev.'
        );
    }
    return dbName;
}

/**
 * Synthetic people. IDs are deliberately NOT snowflake-shaped -- a 17-20 digit numeric id is exactly what a real Discord account looks like, and the check that proves this database is clean greps for that shape. Making them obviously fake keeps that check meaningful instead of turning it into a thing you have to reason about.
 */
const PEOPLE = [
    { discordId: 'dev-000001', timezone: 'America/Toronto', timestampStyle: 'all_formats',
      defaultRegion: 'region_10', accentColorStyle: 'avatar' },
    { discordId: 'dev-000002', timezone: 'Europe/London', timestampStyle: 'short_time',
      defaultRegion: 'region_1', accentColorStyle: 'banner', loadoutVisibility: 'private' },
    { discordId: 'dev-000003', timezone: 'Asia/Kolkata', timestampStyle: 'relative',
      defaultRegion: 'region_5', accentColorStyle: 'displayName', seasonalVisibility: 'private' },
    { discordId: 'dev-000004', timezone: 'Australia/Sydney', timestampStyle: 'long_date',
      defaultRegion: 'region_3', defaultRegionMode: 'fixed', calendarEventFilter: 'draw' },
    { discordId: 'dev-000005', timezone: 'America/Los_Angeles', timestampStyle: 'all_formats',
      defaultRegion: 'region_10', accentColorStyle: 'dynamicProfile', settingsVisibility: 'private' },
    // One record left almost empty on purpose: most real rows are mostly schema defaults, and a dev database where every field is populated hides the bugs that only appear when a field is absent.
    { discordId: 'dev-000006' },
];

async function main() {
    const uri = process.env.MONGODB_URI;
    const dbName = assertDevTarget(uri);

    await mongoose.connect(uri);
    const existing = await UserPreference.countDocuments();
    const real = await UserPreference.countDocuments({ discordId: { $regex: '^[0-9]{17,20}$' } });

    console.log(`target database : ${dbName}`);
    console.log(`existing records: ${existing} (${real} with a real-looking Discord snowflake id)`);

    if (!APPLY) {
        console.log('\nDRY RUN -- nothing was changed.');
        console.log(`Re-run with --yes to delete those ${existing} record(s) and insert ` +
            `${PEOPLE.length} synthetic ones.`);
        await mongoose.disconnect();
        return;
    }

    const { deletedCount } = await UserPreference.deleteMany({});
    await UserPreference.insertMany(PEOPLE);
    const after = await UserPreference.countDocuments();
    const realAfter = await UserPreference.countDocuments({ discordId: { $regex: '^[0-9]{17,20}$' } });

    console.log(`\ndeleted ${deletedCount}, inserted ${PEOPLE.length}, collection now holds ${after}.`);
    console.log(`records with a real-looking snowflake id: ${realAfter}`);
    if (realAfter !== 0) {
        console.error('✗ Something with a real-looking id survived. Investigate before using this database.');
        process.exitCode = 1;
    } else {
        console.log('✓ No real-looking Discord ids remain.');
    }
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err.message);
    process.exitCode = 1;
    mongoose.disconnect().catch(() => {});
});
