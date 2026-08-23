// portal/api/analytics.js
//
// Analytics realm — read-only except for revert (handled generically by portal/api/changesets.js's POST /api/revert/:changeId, which re-checks the change's OWN page — F24). "Nothing is re-derived": Usage/Timing reuse the exact functions /bot analytics calls, and the event river reads ChangeLog/AlertLog/BootRecord directly rather than recomputing anything.
//
// 🔴 HEALTH COMES FROM MONGO, AND THAT IS A CONSTRAINT NOT A SHORTCUT. commands/bot.js's computeHealthStats(client) takes a live discord.js client and reads client.ws.status and this process's RSS. The portal is a SEPARATE systemd unit (scripts/dioreo-portal.service) with no gateway connection, so calling it here would report the PORTAL's own uptime and memory while looking exactly like the bot's — a wrong number that is indistinguishable from a right one. Everything below is derived from records the bot itself wrote: BootRecord for uptime and restarts, AlertLog for errors and the RSS trend, AnalyticsEvent for command volume. The UI states the provenance rather than implying a live reading.
const ChangeLog = require('../../models/ChangeLog');
const AlertLog = require('../../models/AlertLog');
const BootRecord = require('../../models/BootRecord');
const AnalyticsEvent = require('../../models/AnalyticsEvent');
const { hasCommandAccess } = require('../../utils/adminAccess');
const { sendJson, forbidden } = require('./httpUtil');

const DAY_MS = 86400000;

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

// Daily counts for a sparkline, oldest first, with EMPTY DAYS PRESENT AS ZERO. A sparkline built by grouping only the days that have rows silently compresses a quiet week into a dense one — the gap is the signal, so the buckets are generated from the calendar and then filled.
function bucketByDay(docs, days, field = 'createdAt') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const buckets = new Array(days).fill(0);
    for (const doc of docs) {
        const t = new Date(doc[field]).getTime();
        const index = days - 1 - Math.floor((start.getTime() - t) / DAY_MS);
        if (index >= 0 && index < days) buckets[index] += 1;
    }
    return buckets;
}

async function healthStats() {
    const now = Date.now();
    const since24h = new Date(now - DAY_MS);
    const since7d = new Date(now - 7 * DAY_MS);

    const [lastBoot, boots7d, alerts7d, events24h, distinct24h] = await Promise.all([
        BootRecord.findOne({}).sort({ createdAt: -1 }).lean(),
        BootRecord.find({ createdAt: { $gte: since7d } }).select('createdAt kind').lean(),
        AlertLog.find({ createdAt: { $gte: since7d } }).select('createdAt level rssMb').lean(),
        AnalyticsEvent.countDocuments({ createdAt: { $gte: since24h } }),
        AnalyticsEvent.distinct('userHash', { createdAt: { $gte: since24h }, isAdmin: false }),
    ]);

    const errors24h = alerts7d.filter(a => new Date(a.createdAt) >= since24h && (a.level === 'warn' || a.level === 'error'));
    const noise24h = alerts7d.filter(a => new Date(a.createdAt) >= since24h && a.level !== 'warn' && a.level !== 'error');
    // ⚠️ SAMPLED, NOT CONTINUOUS. rssMb is written when an ALERT fires, so this is the highest RSS seen at any alert in the window — not a true peak, and it is absent entirely in a quiet week. The UI says "at last alert" rather than "peak" when the sample count is thin, because a peak computed from two samples is a number that looks more authoritative than it is.
    const rssSamples = alerts7d.map(a => a.rssMb).filter(n => typeof n === 'number' && n > 0);

    return {
        uptimeSince: lastBoot ? lastBoot.createdAt : null,
        lastBootKind: lastBoot ? lastBoot.kind : null,
        lastBootVersion: lastBoot ? lastBoot.version : null,
        restarts24h: boots7d.filter(b => new Date(b.createdAt) >= since24h).length,
        restarts7d: boots7d.length,
        errors24h: errors24h.length,
        noise24h: noise24h.length,
        rssPeakMb: rssSamples.length ? Math.max(...rssSamples) : null,
        rssSampleCount: rssSamples.length,
        commands24h: events24h,
        distinctUsers24h: distinct24h.length,
        spark: {
            alerts: bucketByDay(alerts7d, 7),
            boots: bucketByDay(boots7d, 7),
        },
    };
}

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/analytics$/, requireAdmin(async (req, res, url, session) => {
        if (!(await hasCommandAccess(session.discordId, 'bot'))) return forbidden(res, 'forbidden');
        const { buildUsageExport, buildTimingExport, computeUsageStats, computeTimingStats } = require('../../commands/bot');
        const { buildAlertExport } = require('../../utils/alertStore');
        const [river, usage, timing, alerts, health, usageStats, timingStats, events7d] = await Promise.all([
            eventRiver({}), buildUsageExport(), buildTimingExport(), buildAlertExport(),
            healthStats(), computeUsageStats(), computeTimingStats(),
            AnalyticsEvent.find({ createdAt: { $gte: new Date(Date.now() - 7 * DAY_MS) } }).select('createdAt').lean(),
        ]);
        health.spark.commands = bucketByDay(events7d, 7);
        // usage/timing/alerts stay in the payload: they are the /bot analytics text exports and the Usage and Timing panels still render them verbatim under their own stat tiles. Nothing here is a second computation of the same numbers (spec §8.2's "nothing is re-derived") — the tiles read the stats objects those same functions were built from.
        sendJson(res, 200, { river, usage, timing, alerts, health, usageStats, timingStats });
    }));
}

module.exports = { register, eventRiver, healthStats, bucketByDay };
