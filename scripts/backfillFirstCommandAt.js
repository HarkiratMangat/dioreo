// scripts/backfillFirstCommandAt.js -- one-time fill of UserPreference.firstCommandAt for users who existed before it was tracked (added 2026-10-20 17:53 EDT). The best date we have is the record's own creation time, read from its ObjectId. It is an approximation in both directions: the record is created by the first /settings, /colors or colour-matched command, which may come after the user's first command, and a click on someone else's colour-matched panel also creates one, which may come before it. $min, the same operator utils/firstCommand.js uses, so a date already recorded is only ever moved EARLIER, and running this twice changes nothing. Usage:  node --env-file=.env.dev scripts/backfillFirstCommandAt.js           (dry run: prints what it would write)
//         node --env-file=.env.dev scripts/backfillFirstCommandAt.js --write
const mongoose = require('mongoose');
const UserPreference = require('../models/UserPreference');

// The update for each document, kept pure so it can be tested without a database.
function backfillOps(docs) {
    return docs.map((d) => ({ updateOne: { filter: { _id: d._id }, update: { $min: { firstCommandAt: d._id.getTimestamp() } } } }));
}

async function main() {
    const write = process.argv.includes('--write');
    await mongoose.connect(process.env.MONGODB_URI);
    const docs = await UserPreference.find({}, { _id: 1, firstCommandAt: 1 }).lean();
    const ops = backfillOps(docs);
    const missing = docs.filter((d) => !d.firstCommandAt).length;
    console.log(`${docs.length} record(s), ${missing} without firstCommandAt.${write ? '' : ' Dry run: pass --write to apply.'}`);
    if (write && ops.length) {
        const r = await UserPreference.bulkWrite(ops);
        console.log(`matched ${r.matchedCount}, modified ${r.modifiedCount}`);
    }
    await mongoose.disconnect();
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { backfillOps };
