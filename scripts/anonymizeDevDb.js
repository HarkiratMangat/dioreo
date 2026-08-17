// scripts/anonymizeDevDb.js Strips real Discord identifiers out of the LOCAL DEV database, keeping every preference record intact as realistic test data. Added 2026-08-06 15:07 EDT.
//
// WHY: the dev DB was seeded from a prod `mongodump` (the procedure in docs/reference/deployment-and-ops.md literally instructed it), so `diors-builds-dev.userpreferences` held 17 real users' snowflake IDs plus their real Discord avatar/banner asset hashes. None of that is needed to test anything — the SHAPE of the data is what makes it useful, not whose it is.
//
// ⚠️ ANONYMISE, NOT PURGE — Harkirat's explicit call: "I don't want to purge all the user data locally, I just want to decouple and remove the user ids so the test data still remains and we can use it for testing." Every document survives; every preference value survives. Only the fields that point back at a real person are replaced.
//
// WHAT GETS REPLACED, and why each one counts as identifying:
//   · discordId              — the user's actual Discord snowflake. The obvious one.
//   · avatarColorSource      — a real Discord AVATAR HASH. It is a cache key here, but it is also a
//   · avatarPaletteSource      per-user CDN identifier: with the account id it addresses that person's
//   · bannerPaletteSource      actual avatar/banner image. `a_`-prefixed values are animated assets.
//   · decorationPaletteSource
// NOT replaced, deliberately:
//   · nameplatePaletteSource — a catalogue path ("nameplates/nameplate_xxx/light/") naming a purchasable
//     cosmetic, not a per-user hash. It identifies an item, not a person.
//   · every *ColorHex / *Palette value — derived colours. They are the test data.
//
// ⚠️ NO NEW FIELD MARKS AN ANONYMISED ROW, on purpose. Mongoose only persists fields declared in the schema (CLAUDE.md's schema gotcha), so an `anonymized: true` flag would need a models/ change and would otherwise vanish silently on the next save. Instead the synthetic ids carry their own marker: they all start with the SYNTHETIC_PREFIX below, which no real snowflake does.
//
// Usage:
//   node scripts/anonymizeDevDb.js             # dry run — reports what WOULD change, writes nothing
//   node scripts/anonymizeDevDb.js --write     # actually apply it
const crypto = require('crypto');
const mongoose = require('mongoose');

// ⚠️ `dev-` PREFIX, NOT A SNOWFLAKE-SHAPED NUMBER. The first version of this script used `90000000000…` — numeric and 19 digits, on the reasoning that keeping the id snowflake-shaped preserved the data's shape. That was wrong, and wrong in the way that matters: the project's canonical "is the dev database clean?" check, quoted in docs/reference/deployment-and-ops.md and run inside scripts/seedDevData.js, is `discordId: /^[0-9]{17,20}$/`. Synthetic-but-numeric ids match it, so a fully anonymised database would have reported 17 real users forever — a permanent false alarm on the one check that exists to catch a real leak, which is exactly how a check gets learned-around and then ignored when it finally fires for real. `dev-` also matches the convention scripts/seedDevData.js already established (`dev-000001`), so the two scripts produce mutually recognisable data. Numbering starts at 100001 so it cannot collide with that script's fixed six.
const SYNTHETIC_PREFIX = 'dev-';
const SYNTHETIC_START = 100001;
const HASH_FIELDS = ['avatarColorSource', 'avatarPaletteSource', 'bannerPaletteSource', 'decorationPaletteSource'];

// A fresh random hex of the same length, preserving the `a_` animated-asset prefix so the data keeps the same shape (some rendering paths branch on it).
function fakeHash(original) {
    const animated = typeof original === 'string' && original.startsWith('a_');
    const body = animated ? original.slice(2) : String(original);
    const hex = crypto.randomBytes(Math.ceil(body.length / 2)).toString('hex').slice(0, body.length);
    return animated ? `a_${hex}` : hex;
}

async function main() {
    const write = process.argv.includes('--write');
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/diors-builds-dev';

    // 🔴 SAFETY GATE — this script must be structurally incapable of touching production. It rewrites primary keys; pointed at prod it would disconnect every real user from their settings with no undo. Both conditions are required: a local host AND a dev-named database. A prose warning in a header is not a safeguard, and this is exactly the kind of script that gets run half-awake.
    const isLocal = /(^|@|\/\/)(localhost|127\.0\.0\.1)(:|\/)/.test(uri);
    const isDevDb = /\/[^/?]*dev[^/?]*(\?|$)/i.test(uri);
    if (!isLocal || !isDevDb) {
        console.error('🔴 REFUSING TO RUN.');
        console.error('   This script only ever runs against a LOCAL, DEV-named database.');
        console.error(`   host looks local: ${isLocal} · db name contains "dev": ${isDevDb}`);
        process.exit(1);
    }

    await mongoose.connect(uri);
    const col = mongoose.connection.collection('userpreferences');
    const docs = await col.find({}).toArray();

    // ⚠️ A SYNTHETIC discordId IS THE DONE-MARKER FOR THE WHOLE DOCUMENT, including its hash fields. The first version tested the hash fields independently — but a randomised hash is, by construction, indistinguishable from a real one (both are just hex of the same length), so every re-run re-randomised all 15 and reported them as "real asset hashes" found. Harmless to the data, actively misleading in the output: the script kept announcing it had found real user hashes in a database it had already cleaned. Since a document's id and its hashes are always rewritten in the same pass, the id alone answers the question exactly, with no marker field and no guessing.
    let already = 0;
    const plan = [];
    for (const d of docs) {
        if (String(d.discordId || '').startsWith(SYNTHETIC_PREFIX)) { already++; continue; }
        const hashHits = HASH_FIELDS.filter(f => typeof d[f] === 'string' && d[f].length);
        plan.push({ _id: d._id, isSynthetic: false, hashHits, doc: d });
    }

    console.log(`userpreferences: ${docs.length} documents`);
    console.log(`  already anonymised, nothing to do: ${already}`);
    console.log(`  to change: ${plan.length}`);
    const fieldCounts = {};
    for (const p of plan) for (const f of p.hashHits) fieldCounts[f] = (fieldCounts[f] || 0) + 1;
    console.log(`  real discordIds to replace: ${plan.filter(p => !p.isSynthetic).length}`);
    for (const [f, n] of Object.entries(fieldCounts)) console.log(`  real asset hashes in ${f}: ${n}`);

    if (!write) {
        console.log('\nDRY RUN — nothing written. Re-run with --write to apply.');
        await mongoose.disconnect();
        return;
    }

    // Sequential synthetic ids keep `unique: true` satisfiable without a collision retry loop, and make the anonymised set trivially recognisable when eyeballing the collection.
    let n = SYNTHETIC_START;
    for (const p of plan) {
        const $set = {};
        if (!p.isSynthetic) $set.discordId = SYNTHETIC_PREFIX + String(n++);
        for (const f of p.hashHits) $set[f] = fakeHash(p.doc[f]);
        await col.updateOne({ _id: p._id }, { $set });
    }

    // Re-read and PROVE it, rather than trusting the writes. A silent partial failure here leaves real ids in place while the run reports success — the exact shape of claim this project keeps paying for. The assertion is on the re-read data, not on the update results.
    const after = await col.find({}).toArray();
    const realIds = after.filter(d => !String(d.discordId || '').startsWith(SYNTHETIC_PREFIX));
    const uniqueIds = new Set(after.map(d => d.discordId)).size;
    // The PROJECT'S canonical check, run here verbatim rather than trusting the prefix test above — this is the regex quoted in deployment-and-ops.md and used by seedDevData.js, and it is what anyone auditing this database will actually run. If the two ever disagree, this is the one that gets believed, so it is the one that has to pass.
    const snowflakeShaped = after.filter(d => /^[0-9]{17,20}$/.test(String(d.discordId || ''))).length;

    console.log('\nverified by re-reading the collection:');
    console.log(`  documents still present: ${after.length} (was ${docs.length})`);
    console.log(`  real discordIds remaining: ${realIds.length}`);
    console.log(`  snowflake-shaped ids (the canonical audit check, must be 0): ${snowflakeShaped}`);
    console.log(`  discordIds unique: ${uniqueIds === after.length} (${uniqueIds}/${after.length})`);

    const ok = realIds.length === 0 && snowflakeShaped === 0
        && after.length === docs.length && uniqueIds === after.length;
    console.log(ok ? '\n✅ anonymised — every document kept, no real identifiers left.'
        : '\n🔴 FAILED — see the counts above.');
    await mongoose.disconnect();
    if (!ok) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
