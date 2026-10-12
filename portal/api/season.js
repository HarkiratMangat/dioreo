// portal/api/season.js
//
// Season realm — covers /manage's 'draws', 'calendar', 'patchnotes', 'seasondraft' and 'season' pages (spec §8.2's join table). Read-only here: mutations go through the generic portal/api/changesets.js pathway as ops built by the frontend (draw.add, calendar.edit, etc.).
const SeasonalData = require('../../models/SeasonalData');
const { sendJson, forbidden } = require('./httpUtil');
const { grantedPagesFor } = require('./realmAccess');

const SEASON_PAGES = ['draws', 'calendar', 'patchnotes', 'seasondraft', 'season'];

// The manifest the portal's Season table shows, flattened for the whole-season export. Kept beside the route rather than in adminParser.js because it is a portal view of the document, not one of the bot's paste-back formats — utils/adminParser.js owns those and every one of them round-trips.
function seasonManifest(doc) {
    const rows = [];
    const push = (type, title, start, end) => rows.push({ type, title: String(title || '').replace(/\s+/g, ' ').trim(), start, end });
    const day = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');
    for (const d of doc.newDraws || []) push('New draw', d.title, day(d.date), day(d.date));
    for (const d of doc.returningDraws || []) push('Returning draw', d.title, day(d.date), day(d.date));
    for (const c of doc.calendar || []) {
        const kind = String(c.category || 'event').toLowerCase();
        push(kind === 'playlist' ? 'Playlist' : kind === 'draw' ? 'Draw window' : 'Event',
            c.title, day(c.date || c.startDate), c.isOngoing ? 'all season' : day(c.endDate || c.date));
    }
    for (const p of doc.patchNotes || []) push('Patch note', p.titleOverride || p.title, day(p.releaseDate), day(p.releaseDate));
    return rows;
}

function formatSeasonManifest(rows) {
    return [['Item', 'Type', 'Starts', 'Ends'].join('\t')]
        .concat(rows.map((r) => [r.title, r.type, r.start, r.end].join('\t'))).join('\n');
}

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
            // 🔴 THE ONE SCOPE THAT TAKES THE WHOLE SEASON WAS MISSING, and it is the one a backup means. The other four each hand back a single list in the bot's own paste-back format; none of them is the Track. This is the manifest as columns — every type in one file, tab-separated so a spreadsheet opens it — and it is deliberately a READ format, like the patch notes: no bulk-add flow reads a mixed list back, and saying otherwise would promise a restore that does not exist.
            all: () => [seasonManifest(doc), formatSeasonManifest],
        };
        if (!SHAPES[scope]) return sendJson(res, 400, { error: 'export needs one of: draws, returning, calendar, patchnotes, all' });
        const [list, format] = SHAPES[scope]();
        sendJson(res, 200, { text: format(list), count: list.length });
    }));
}

module.exports = { register, SEASON_PAGES };
