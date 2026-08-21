// portal/api/season.js
//
// Season realm — covers /manage's 'draws', 'calendar', 'patchnotes', 'seasondraft' and 'season' pages (spec §8.2's join table). Read-only here: mutations go through the generic portal/api/changesets.js pathway as ops built by the frontend (draw.add, calendar.edit, etc.).
const SeasonalData = require('../../models/SeasonalData');
const { getManagePages } = require('../../utils/adminAccess');

const SEASON_PAGES = ['draws', 'calendar', 'patchnotes', 'seasondraft', 'season'];

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/season$/, requireAdmin(async (req, res, url, session) => {
        const pages = await getManagePages(session.discordId);
        const grantedPages = pages.filter(p => SEASON_PAGES.includes(p));
        if (grantedPages.length === 0) {
            res.writeHead(403, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: 'forbidden' }));
        }
        const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
        const { draft, _id, __v, ...live } = doc || {};
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ live, draft: draft || null, grantedPages }));
    }));
}

module.exports = { register, SEASON_PAGES };
