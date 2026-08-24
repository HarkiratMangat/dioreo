// portal/api/armory.js
//
// Armory realm \u2014 covers /manage's 'loadouts_mp' and 'loadouts_dmz' pages. No dates, so no Track \u2014 Rack (by category) and Coverage (data-quality flags) are both derived read-only views over the same Loadout collection. Mutations go through the generic changeset pathway (loadout.add, loadout.bulkReplace, etc.) built by the frontend.
const Loadout = require('../../models/Loadout');
const { findDuplicateLoadouts, getMpCategoryAccent, buildLoadoutCard } = require('../../utils/loadoutRender');
const { sendJson, forbidden } = require('./httpUtil');
const { grantedPagesFor } = require('./realmAccess');

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
        // 🔴 EXCLUDE THE BUILD FROM ITS OWN COMPARISON SET. `mpBuilds` is every MP build including this one — findDuplicateLoadouts's exact-code check trivially matches a build against itself (same shareCode, 100% attachment overlap), so every build with a shareCode and >=4 attachments always found at least one "duplicate": itself. That is what flagged 131 of 133 builds — measured against the real ported catalogue, not a design number.
        const others = mpBuilds.filter((b) => String(b._id) !== String(build._id));
        const dupes = findDuplicateLoadouts({ gunsmithCode: build.shareCode, attachments: build.attachments }, others);
        if (dupes && dupes.length > 0) flags.push('near-duplicate');
    }
    return flags;
}

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/armory$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, ARMORY_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const all = await Loadout.find({}).lean();
        const mpBuilds = all.filter(b => b.mode === 'MP');
        const builds = all.map(b => ({ ...b, coverage: coverageFlags(b, mpBuilds), accent: getMpCategoryAccent(b.category) }));
        sendJson(res, 200, { builds, grantedPages });
    }));

    // The Armory compose UI's "LIVE PREVIEW" panel — calls the bot's own buildLoadoutCard() so the browser renders exactly what Discord will send (spec §4/§2 of the compose-UI design), rather than a second hand-built approximation of the card that could drift from the real one.
    route('GET', /^\/api\/armory\/preview$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, ARMORY_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const id = url.searchParams.get('id');
        const build = id && await Loadout.findById(id).lean();
        if (!build) return sendJson(res, 404, { error: 'no such loadout' });
        const card = buildLoadoutCard([build], 0, { color: getMpCategoryAccent(build.category), idPrefix: 'preview_' });
        sendJson(res, 200, { card });
    }));

    // Bulk "Export selection" — utils/adminParser.js's formatLoadoutsAsBulkText was only ever wired to Discord-side callers (handlers/manage/loadouts.js, utils/manageActions.js) before this.
    route('GET', /^\/api\/armory\/export$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, ARMORY_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean);
        const builds = await Loadout.find({ _id: { $in: ids } }).lean();
        const { formatLoadoutsAsBulkText } = require('../../utils/adminParser');
        sendJson(res, 200, { text: formatLoadoutsAsBulkText(builds) });
    }));
}

module.exports = { register, ARMORY_PAGES, coverageFlags };
