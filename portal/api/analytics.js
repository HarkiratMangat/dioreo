// portal/api/analytics.js
//
// Analytics realm \u2014 read-only except for revert (handled generically by portal/api/changesets.js's POST /api/revert/:changeId, which re-checks the change's OWN page \u2014 F24). "Nothing is re-derived": Usage/Timing reuse the exact export functions /bot analytics calls, and the event river reads ChangeLog/AlertLog/BootRecord directly rather than recomputing anything.
const ChangeLog = require('../../models/ChangeLog');
const AlertLog = require('../../models/AlertLog');
const BootRecord = require('../../models/BootRecord');
const { hasCommandAccess } = require('../../utils/adminAccess');
const { sendJson, forbidden } = require('./httpUtil');

async function eventRiver({ limit = 100 } = {}) {
    const [changes, alerts, boots] = await Promise.all([
        ChangeLog.find({}).sort({ createdAt: -1 }).limit(limit).lean(),
        AlertLog.find({}).sort({ createdAt: -1 }).limit(limit).lean(),
        BootRecord.find({}).sort({ createdAt: -1 }).limit(limit).lean(),
    ]);
    const river = [
        ...changes.map(c => ({ kind: 'change', at: c.createdAt, ...c })),
        ...alerts.map(a => ({ kind: 'alert', at: a.createdAt, ...a })),
        ...boots.map(b => ({ kind: 'boot', at: b.createdAt, ...b })),
    ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, limit);
    return river;
}

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/analytics$/, requireAdmin(async (req, res, url, session) => {
        if (!(await hasCommandAccess(session.discordId, 'bot'))) return forbidden(res, 'forbidden');
        const { buildUsageExport, buildTimingExport } = require('../../commands/bot');
        const { buildAlertExport } = require('../../utils/alertStore');
        const [river, usage, timing, alerts] = await Promise.all([
            eventRiver({}), buildUsageExport(), buildTimingExport(), buildAlertExport(),
        ]);
        sendJson(res, 200, { river, usage, timing, alerts });
    }));
}

module.exports = { register, eventRiver };
