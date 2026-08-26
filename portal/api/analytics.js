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
        // spread FIRST: BootRecord's own `kind` ('deploy'/'manual'/'automatic') must not win over the river row's kind — a real bug where it silently did, because the literal came first and object spread applies in source order, so the DB field clobbered it.
        ...boots.map(b => ({ ...b, bootKind: b.kind, kind: 'boot', at: b.createdAt })),
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

// ── REACH ─────────────────────────────────────────────────────────────────────────────────────
//
// 🔴 THE PORTAL COMPUTES THIS BECAUSE NOTHING ELSE DOES. /bot analytics has five pages and none of them is Reach -- context and installType are recorded on every event and have never been read back by anything. This is not a portal-side duplicate of a Discord number; it is the first time the number exists. Which is also the division of labour the project already settled: Discord answers one question in one screenful, the portal is where depth lives.
//
// ⚠️ installType is NULLABLE BY DESIGN and the null is a real answer, not a gap to hide. utils/eventStore.js writes it from interaction.authorizingIntegrationOwners, which Discord omits on some interaction types -- so "not reported" is a third row, never folded into either install kind. Folding it in would overstate whichever bar absorbed it.
async function reachStats() {
    const rows = await AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * DAY_MS) }, isAdmin: false } },
        { $group: { _id: { context: '$context', installType: '$installType' }, n: { $sum: 1 } } },
    ]);
    return rows.map(r => ({ context: r._id.context || null, installType: r._id.installType || null, n: r.n }));
}

// ── SEARCH ────────────────────────────────────────────────────────────────────────────────────
//
// 🔴 THE ONLY NUMBER IN THE WHOLE SYSTEM THAT DESCRIBES WHAT SOMEBODY WANTED. Every other figure in Analytics describes what the bot did. A term typed into an autocomplete that matched nothing is a request for something this bot does not have -- a missing alias or a missing feature -- and it is invisible on every other surface, including Discord's.
//
// ⚠️ ZERO ROWS HERE MEANS "NOBODY TYPED", NEVER "NOTHING WAS MISSING". utils/eventStore.js only writes the search subdocument on autocomplete sessions, so an empty table is a statement about instrumentation coverage rather than about demand. The empty state says so in those words rather than showing a blank.
async function searchTerms({ limit = 40 } = {}) {
    const rows = await AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * DAY_MS) }, 'search.term': { $type: 'string', $ne: '' } } },
        { $group: {
            _id: { term: '$search.term', command: '$command', field: '$search.field' },
            searches: { $sum: 1 },
            zeroResults: { $sum: { $cond: [{ $eq: ['$search.results', 0] }, 1, 0] } },
            picked: { $sum: { $cond: ['$search.picked', 1, 0] } },
        } },
        { $sort: { zeroResults: -1, searches: -1 } }, { $limit: limit },
    ]);
    return rows.map(r => ({ term: r._id.term, command: r._id.command || '?', field: r._id.field || '—',
        searches: r.searches, zeroResults: r.zeroResults, picked: r.picked }));
}

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/analytics$/, requireAdmin(async (req, res, url, session) => {
        if (!(await hasCommandAccess(session.discordId, 'bot'))) return forbidden(res, 'forbidden');
        const { computeUsageStats, computeTimingStats } = require('../../commands/bot');
        const { OUTCOME_KEYS, ENTRY_KEYS } = require('../../models/AnalyticsRollup');
        // 🔴 THE LIMITS ARE RAISED HERE, NOT IN THE SHARED FUNCTION. 8 and 6 are the numbers that fit a Discord panel; the portal has a scrolling page and the reason it exists is depth. Passing the limit keeps both true at once -- see the options bag on computeUsageStats.
        const [river, health, usageStats, timingStats, reach, searches, events7d] = await Promise.all([
            eventRiver({}), healthStats(),
            computeUsageStats({ limit: 25 }), computeTimingStats({ limit: 25 }),
            reachStats(), searchTerms(),
            AnalyticsEvent.find({ createdAt: { $gte: new Date(Date.now() - 7 * DAY_MS) } }).select('createdAt').lean(),
        ]);
        health.spark.commands = bucketByDay(events7d, 7);
        // 🔴 THE THREE TEXT EXPORTS ARE GONE FROM THIS PAYLOAD, AND DELETING THEM IS THE POINT. buildUsageExport/buildTimingExport/buildAlertExport produce the Discord command's own downloadable .txt, and the portal was rendering all three verbatim inside <pre> blocks — the fallback that stood in for a dashboard until there was one. Now that Usage and Timing are real panels, keeping the text beside them is two layers saying the same thing, which is the defect this branch has spent its life finding rather than a harmless extra. The alert export's own facts (level, detail) were never lost: eventRiver already returns full AlertLog documents, so the river carries them as columns and filters instead of prose. Three text builds per page load go with them. The exports remain exactly where they belong — attached to /bot analytics, in Discord.
        //
        // OUTCOME_KEYS/ENTRY_KEYS ride in the payload because the browser cannot require a Mongoose model and the six outcomes are an ENUM, not a display list: the Outcomes panel's whole reading is which ones have NEVER occurred, so it has to know the ones the data does not contain. models/AnalyticsRollup is their single source (its own header records the bug from when two copies existed), and the UI holds only the prose labels.
        sendJson(res, 200, { river, health, usageStats, timingStats, reach, searches, outcomeKeys: OUTCOME_KEYS, entryKeys: ENTRY_KEYS });
    }));
}

module.exports = { register, eventRiver, healthStats, bucketByDay, reachStats, searchTerms };
