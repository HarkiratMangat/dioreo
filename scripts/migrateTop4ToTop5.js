// scripts/migrateTop4ToTop5.js
//
// Top 4 is retired (Board 4 v19, 2026-09-24): a top-4 build is inside the top five, so every stored `top4` becomes `top5`, on categoryRank (MP) and on dmzRangeRank's tier (DMZ, e.g. top4-close). The parser already reads a typed top4 as top5; this moves the stored ones so no top4 is left anywhere.
//
// Usage: node --env-file=.env.dev scripts/migrateTop4ToTop5.js            (dry run, lists the builds it would change)
//        node --env-file=.env.dev scripts/migrateTop4ToTop5.js --write    (applies it)
//        add --prod to allow a non-localhost database -- prod is outward and needs Harkirat's restated approval.
const mongoose = require('mongoose');
const Loadout = require('../models/Loadout');

const WRITE = process.argv.includes('--write');
const PROD = process.argv.includes('--prod');

(async () => {
    const uri = process.env.MONGODB_URI || '';
    if (!PROD && !/localhost|127\.0\.0\.1/.test(uri)) {
        console.error('Refusing a non-localhost database without --prod.');
        process.exit(2);
    }
    await mongoose.connect(uri);
    const hits = await Loadout.find({ $or: [{ categoryRank: 'top4' }, { dmzRangeRank: /^top4(-|$)/ }] }).lean();
    for (const b of hits) {
        const set = b.categoryRank === 'top4' ? { categoryRank: 'top5' } : { dmzRangeRank: b.dmzRangeRank.replace(/^top4/, 'top5') };
        console.log(`${WRITE ? 'set' : 'would set'} ${b.weaponName} (${b.buildName}, ${b.mode}): ${JSON.stringify(set)}`);
        if (WRITE) await Loadout.updateOne({ _id: b._id }, { $set: set });
    }
    const left = await Loadout.countDocuments({ $or: [{ categoryRank: 'top4' }, { dmzRangeRank: /^top4(-|$)/ }] });
    console.log(`${hits.length} build(s) carried top4; ${left} still do.`);
    await mongoose.disconnect();
    process.exit(0);
})().catch((err) => { console.error(err?.message || err); process.exit(1); });
