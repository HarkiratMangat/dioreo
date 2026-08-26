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
        // 🔴 THE DATE IS SENT AS TEXT THE BOT'S OWN PARSER READS BACK, and that is a safety property rather than a convenience. core/ops/patchnotes.js sets releaseDate from parseReleaseDateTime(payload.releaseDate) — and that function returns `new Date()` for anything it cannot read, INCLUDING an empty string. So an editor that posted a blank or differently-formatted date would silently move a published patch note to today. formatReleaseDateTime is its exact round-trip partner (scripts/portalPatchNotes.test.js asserts the round trip), so the field starts life holding a value the server will parse back to the same instant, and an untouched field stages no op at all.
        if (Array.isArray(live.patchNotes)) {
            const { formatReleaseDateTime } = require('../../utils/adminParser');
            live.patchNotes = live.patchNotes.map((p) => ({ ...p, releaseDateText: formatReleaseDateTime(p.releaseDate) }));
        }
        sendJson(res, 200, { live, draft: draft || null, grantedPages });
    }));

    // 🔴 THE EXPORT IS THE BOT'S OWN FORMATTERS, NOT A DISPLAY STRING. Season's "Export selection" built its own `title — window` line, which is a caption rather than a backup: nothing reads it back. utils/adminParser.js has formatted these three shapes for /manage since it was built, and scripts/portalRoundtrip checks them against the parsers that consume them.
    //
    // ⚠️ ONLY TWO OF THE THREE ROUND-TRIP, and the UI's per-scope note says which. Draws re-import through parseBulkDrawList and the calendar through parseBulkEvents; `formatPatchNotesAsText` is a READ format with no bulk-add flow behind it at all, so calling it a backup would tell somebody they hold something they do not.
    route('GET', /^\/api\/season\/export$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, SEASON_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const { formatDrawsAsBulkText, formatCalendarAsBulkText, formatPatchNotesAsText } = require('../../utils/adminParser');
        const doc = await SeasonalData.findOne({ docType: 'global' }).lean() || {};
        const scope = url.searchParams.get('scope');
        const SHAPES = {
            draws: () => [(doc.newDraws || []), formatDrawsAsBulkText],
            returning: () => [(doc.returningDraws || []), formatDrawsAsBulkText],
            calendar: () => [(doc.calendar || []), formatCalendarAsBulkText],
            patchnotes: () => [(doc.patchNotes || []), formatPatchNotesAsText],
        };
        if (!SHAPES[scope]) return sendJson(res, 400, { error: 'export needs one of: draws, returning, calendar, patchnotes' });
        const [list, format] = SHAPES[scope]();
        sendJson(res, 200, { text: format(list), count: list.length });
    }));
}

module.exports = { register, SEASON_PAGES };
