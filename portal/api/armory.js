// portal/api/armory.js
//
// Armory realm \u2014 covers /manage's 'loadouts_mp' and 'loadouts_dmz' pages. No dates, so no Track \u2014 Rack (by category) and Coverage (data-quality flags) are both derived read-only views over the same Loadout collection. Mutations go through the generic changeset pathway (loadout.add, loadout.bulkReplace, etc.) built by the frontend.
const Loadout = require('../../models/Loadout');
const { findDuplicateLoadouts, getMpCategoryAccent } = require('../../utils/loadoutRender');
const { getManagePages } = require('../../utils/adminAccess');

const ARMORY_PAGES = ['loadouts_mp', 'loadouts_dmz'];
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// Coverage flags \u2014 every flag here is meant to be a filter into the Manifest (spec §8.2), so each build carries which ones it tripped rather than a single pass/fail.
function coverageFlags(build, mpBuilds) {
    const flags = [];
    if (!build.imageKey) flags.push('missing-image');
    const hasBadge = build.isMeta || build.categoryRank || build.dmzRangeRank || build.isToxic;
    if (!hasBadge) flags.push('no-badges');
    const expected = build.mode === 'DMZ' ? 9 : 5;
    if ((build.attachments || []).length !== expected) flags.push('wrong-attachment-count');
    if (build.lastUpdated && Date.now() - new Date(build.lastUpdated).getTime() > NINETY_DAYS_MS) flags.push('stale-90d');
    if (build.mode === 'MP' && build.shareCode) {
        const dupes = findDuplicateLoadouts({ gunsmithCode: build.shareCode, attachments: build.attachments }, mpBuilds);
        if (dupes && dupes.length > 0) flags.push('near-duplicate');
    }
    return flags;
}

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/armory$/, requireAdmin(async (req, res, url, session) => {
        const pages = await getManagePages(session.discordId);
        const grantedPages = pages.filter(p => ARMORY_PAGES.includes(p));
        if (grantedPages.length === 0) {
            res.writeHead(403, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: 'forbidden' }));
        }
        const all = await Loadout.find({}).lean();
        const mpBuilds = all.filter(b => b.mode === 'MP');
        const builds = all.map(b => ({ ...b, coverage: coverageFlags(b, mpBuilds), accent: getMpCategoryAccent(b.category) }));
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ builds, grantedPages }));
    }));
}

module.exports = { register, ARMORY_PAGES, coverageFlags };
