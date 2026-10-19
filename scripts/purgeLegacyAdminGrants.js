// Removes every admin grant written before the two-tier permission model, so each admin is granted again under it.
//
// WHY A PURGE AND NOT A CONVERSION. Harkirat's answer to the migration question (2026-09-13, restated in docs/superpowers/specs/2026-10-19-permission-restructure-design.md) was "purge": only his alt held a grant, so re-granting it by hand costs less than trusting a converter to read old tokens correctly. core/permissions.js's legacyToGrants() keeps old rows working until this runs; once it has run on a database, nothing there needs the bridge.
//
// WHAT COUNTS AS LEGACY. An AdminUser row with no `grants` (or an empty list). A row that has `grants` is already on the new model, even if a stale `permissions` list still sits beside it, and is left alone. /bot access's grant and edit pop-ups write `grants` with `permissions: []`, so a row anyone has touched since the restructure is never removed.
//
// 🔴 DRY RUN BY DEFAULT. It connects, lists what it would remove, and changes nothing. `--apply` deletes. Running it with --apply against PROD needs Harkirat's word at the time; the owner (utils/owner.js) never had a row and needs none.
//
// Usage:
//   node --env-file=.env.dev scripts/purgeLegacyAdminGrants.js            # dry run, dev database
//   node --env-file=.env.dev scripts/purgeLegacyAdminGrants.js --apply    # delete, dev database
require('dotenv').config();
const mongoose = require('mongoose');

const LEGACY_QUERY = { $or: [{ grants: { $exists: false } }, { grants: { $size: 0 } }] };

async function main() {
    const apply = process.argv.includes('--apply');
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set.');
    await mongoose.connect(process.env.MONGODB_URI);
    const AdminUser = require('../models/AdminUser');
    const { formatGrants, legacyToGrants } = require('../core/permissions');

    console.log(`Database: ${mongoose.connection.name}${apply ? '' : ' (dry run, nothing will change)'}`);
    const rows = await AdminUser.find(LEGACY_QUERY).lean();
    if (!rows.length) {
        console.log('✓ No legacy grants. Every admin row is already on the two-tier model.');
        return;
    }
    console.log(`${rows.length} legacy admin row(s):`);
    for (const r of rows) {
        // What the row confers today through the bridge, so the person running this can re-grant it by hand afterwards if they want to.
        console.log(`  - ${r.discordId}${r.title || r.note ? ` (${r.title || r.note})` : ''}: [${(r.permissions || []).join(', ')}] → today reads as ${formatGrants(legacyToGrants(r.permissions))}`);
    }
    if (!apply) {
        console.log('\nDry run. Re-run with --apply to remove them.');
        return;
    }
    const res = await AdminUser.deleteMany({ _id: { $in: rows.map((r) => r._id) } });
    console.log(`\nRemoved ${res.deletedCount} legacy admin row(s). Re-grant from /bot access.`);
}

main()
    .catch((e) => { console.error(e.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
