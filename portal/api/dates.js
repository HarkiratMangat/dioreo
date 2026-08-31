// portal/api/dates.js
//
// 🔴 A DATE PICKER, IN A PORTAL FOR A BOT THAT HAS UNDERSTOOD "in 3 weeks" FOR A YEAR. `chrono-node` is already a dependency and `parseAdminDate()` is already how every admin date reaches this database — /manage has taken typed dates since it was built. The portal was the one surface that made you click through a calendar instead.
//
// 🔴 AND THE PARSING HAPPENS HERE, NOT IN THE BROWSER, WHICH IS THE WHOLE POINT. Shipping a second parser to the client would put two implementations behind one promise: the portal would show you what ITS parser resolved, the server would store what CHRONO resolved, and the day they disagreed the preview would be a lie about the thing being saved. `parseAdminDate` has a documented timezone subtlety of its own — it passes `{ timezone: 0 }` so the host machine's clock cannot shift a date across a day boundary — and a browser reimplementation would have to reproduce that correctly, forever, in a place nobody would think to check.
//
// ⚠️ It returns the ISO DAY, never a timestamp: `parseAdminDate` normalizes to midnight UTC because these are date-only records, and handing the client a time would invite it to render one.
const chronoParse = require('../../utils/adminParser').parseAdminDate;
const { sendJson } = require('./httpUtil');

function register(route) {
    const { requireAdmin } = require('../auth');

    // GET /api/parse-date?q=in+3+weeks -> { q, iso } — iso is null when nothing parsed, which the composer renders as "not a date yet" rather than falling back to today. A silent fallback to now is the exact defect parseAdminDate's own comment records: a typo landed on the current instant and read as a real, intentional date.
    route('GET', /^\/api\/parse-date$/, requireAdmin(async (req, res, url) => {
        const q = url.searchParams.get('q') || '';
        if (q.length > 200) return sendJson(res, 400, { error: 'that is not a date' });
        const parsed = q.trim() ? chronoParse(q) : null;
        sendJson(res, 200, { q, iso: parsed ? parsed.toISOString().slice(0, 10) : null });
    }));
}

module.exports = { register };
