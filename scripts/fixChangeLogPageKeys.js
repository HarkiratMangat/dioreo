// One-time repair of ChangeLog.page keys that no permission scope contains.
//
// WHY. core/changeset.js's pageForOp() used to fall back to `op.type.split('.')[0]` for any op with no registered /manage action, and six ops have none by design -- they exist only as another op's invert() target. That fallback stamped `patchnote` (SINGULAR) onto rows written by patchnote.removeSeason / restoreSeason / editSeason / restore, while utils/adminAccess.js's MANAGE_PAGE_SCOPES only ever contained `patchnotes`. handlers/bot.js and portal/api/changesets.js both gate revert and change-detail on hasManagePageAccess(userId, row.page), so on those rows the check compared against a string no grant can hold: a scoped `manage.patchnotes` admin was silently denied. Fixed forward 2026-08-23 12:52 EDT by giving those ops an explicit `page:` (core/ops/index.js); this repairs the rows already written.
//
// ⚠️ WHAT THIS DELIBERATELY DOES NOT TOUCH. `season.restoreDraft` had the mirror-image defect -- it recorded `season` when it reverses a DRAFT discard and belongs to `seasondraft` -- but `season` is a LEGITIMATE value for the other season ops, and ChangeLog stores no op type, only `action`/`model`/`target`. So those rows are not retro-identifiable from the schema and a blanket update would mislabel real season changes. They are fixed forward only. No such row is believed to exist (v3 has not launched and prod has never run a draft revert), and claiming a completeness the data cannot support would be worse than saying so here.
//
// Run once per database: node scripts/fixChangeLogPageKeys.js
require('dotenv').config();
const mongoose = require('mongoose');
const ChangeLog = require('../models/ChangeLog');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const res = await ChangeLog.updateMany({ page: 'patchnote' }, { $set: { page: 'patchnotes' } });
    console.log(`Repaired ${res.modifiedCount} of ${res.matchedCount} matched change row(s): page "patchnote" -> "patchnotes".`);
    const left = await ChangeLog.distinct('page');
    const { MANAGE_PAGE_SCOPES } = require('../utils/adminAccess');
    const orphans = left.filter(p => p && p !== 'access' && !MANAGE_PAGE_SCOPES.includes(p));
    // 'access' is written straight through recordChange() by /bot access and is intentionally not a /manage page (those rows carry no inverse and are correctly un-revertible), so it is excluded rather than reported as a defect.
    console.log(orphans.length
        ? `⚠️ Still present and matching no scope: ${orphans.join(', ')} — investigate before trusting the revert gate.`
        : `✓ Every remaining page key is a real permission scope.`);
    await mongoose.disconnect();
})();
