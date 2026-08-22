// portal/api/season.js
//
// Season realm — covers /manage's 'draws', 'calendar', 'patchnotes', 'seasondraft' and 'season' pages (spec §8.2's join table). Read-only here: mutations go through the generic portal/api/changesets.js pathway as ops built by the frontend (draw.add, calendar.edit, etc.).
const SeasonalData = require('../../models/SeasonalData');
const { sendJson, forbidden } = require('./httpUtil');
const { grantedPagesFor } = require('./realmAccess');

const SEASON_PAGES = ['draws', 'calendar', 'patchnotes', 'seasondraft', 'season'];

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/season$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, SEASON_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
        const { draft, _id, __v, ...live } = doc || {};
        sendJson(res, 200, { live, draft: draft || null, grantedPages });
    }));
}

module.exports = { register, SEASON_PAGES };
