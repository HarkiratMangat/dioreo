// utils/healthWatch.js Two quiet signals that would have shortened the 2026-11-21 09:52 EST outage, built 2026-11-21 12:23 EST on Harkirat's "useful info that would be beneficial even if realistically never used/triggered".
//
// 1. dayCounts(): the last 24 hours of interactions by outcome, for the daily health check. "Still online and healthy" said nothing about whether commands were WORKING; a line like "212 commands · 9 failed · 3 too slow" makes a bad day visible even when no single failure alerted.
// 2. noteSlowReply(): Discord gives a command 3 seconds to answer, then shows "The application did not respond" and the reply fails with 10062. One is a blip; 3 in 10 minutes means the bot or its database is slow, and that alerts (orange, once per 10 minutes). utils/eventStore.js calls it on each 10062.
const SLOW_WINDOW_MS = 10 * 60 * 1000;
const SLOW_LIMIT = 3;
let slow = [];
let slowAlertAt = 0;

async function dayCounts({ model, now = Date.now() } = {}) {
    const AnalyticsEvent = model || require('../models/AnalyticsEvent');
    const rows = await AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) }, entry: { $ne: 'autocomplete' } } },
        { $group: { _id: '$outcome', n: { $sum: 1 } } },
    ]);
    const by = Object.fromEntries(rows.map(r => [r._id || 'ok', r.n]));
    const total = rows.reduce((a, r) => a + r.n, 0);
    return { total, failed: by.error || 0, slow: by.expired || 0 };
}

function countsLine(c) {
    if (!c) return null;
    return `• Last 24h: ${c.total} interactions · ${c.failed} failed · ${c.slow} too slow for Discord`;
}

function noteSlowReply({ now = Date.now(), alert } = {}) {
    const send = alert || require('./alertWebhook').sendAlert;
    slow = slow.filter(t => now - t < SLOW_WINDOW_MS);
    slow.push(now);
    if (slow.length >= SLOW_LIMIT && now - slowAlertAt >= SLOW_WINDOW_MS) {
        slowAlertAt = now;
        send('Replies missing Discord\'s 3-second window', `${slow.length} commands or clicks in the last 10 minutes got Discord's "The application did not respond", because Dioreo answered after Discord's 3 seconds. Usually a slow database or a busy bot; check the VM and Atlas.`, 'warn');
        return true;
    }
    return false;
}

module.exports = { dayCounts, countsLine, noteSlowReply, _reset: () => { slow = []; slowAlertAt = 0; } };
