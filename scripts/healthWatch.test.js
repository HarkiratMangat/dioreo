// scripts/healthWatch.test.js The three quiet signals added 2026-11-21 12:23 EST after the 2026-11-21 outage: the daily check's 24-hour interaction counts, the alert when replies keep missing Discord's 3-second window, and the alerts webhook's backup route through the bot. All against stand-ins; no database, no Discord.
const assert = require('assert');
const hw = require('../utils/healthWatch');
const { alertFallback, _resetFallback } = require('../utils/alertWebhook');

(async () => {
    // 1. Day counts: outcomes grouped, autocomplete left out by the query, a missing outcome read as ok.
    let seenMatch = null;
    const model = { aggregate: async (pipe) => { seenMatch = pipe[0].$match; return [{ _id: 'ok', n: 200 }, { _id: 'error', n: 9 }, { _id: 'expired', n: 3 }, { _id: null, n: 1 }]; } };
    const c = await hw.dayCounts({ model, now: Date.parse('2026-11-21T17:00:00Z') });
    assert.deepStrictEqual(c, { total: 213, failed: 9, slow: 3 });
    assert.deepStrictEqual(seenMatch.entry, { $ne: 'autocomplete' });
    assert.strictEqual(seenMatch.createdAt.$gte.toISOString(), '2026-11-20T17:00:00.000Z');
    assert.strictEqual(hw.countsLine(c), '• Last 24h: 213 interactions · 9 failed · 3 too slow for Discord');
    assert.strictEqual(hw.countsLine(null), null);
    console.log('ok: the daily check counts the last 24 hours by outcome');

    // 2. Slow replies: 2 in 10 minutes is quiet, the 3rd alerts (orange), more in the same window do not.
    hw._reset();
    const sent = [];
    const alert = (t, d, l) => sent.push(l);
    const t0 = 5_000_000;
    assert.strictEqual(hw.noteSlowReply({ now: t0, alert }), false);
    assert.strictEqual(hw.noteSlowReply({ now: t0 + 1000, alert }), false);
    assert.strictEqual(hw.noteSlowReply({ now: t0 + 2000, alert }), true);
    assert.strictEqual(hw.noteSlowReply({ now: t0 + 3000, alert }), false);
    assert.deepStrictEqual(sent, ['warn']);
    hw._reset();
    hw.noteSlowReply({ now: t0, alert }); hw.noteSlowReply({ now: t0 + 11 * 60_000, alert });
    assert.strictEqual(hw.noteSlowReply({ now: t0 + 12 * 60_000, alert }), false, 'the first one aged out of the window');
    console.log('ok: 3 slow replies in 10 minutes alert once');

    // 3. Webhook backup: red/orange alerts go through the bot once per 30 minutes; info never does.
    _resetFallback();
    const routed = [];
    const send = async (body) => routed.push(body.content);
    assert.strictEqual(alertFallback('info', 'Daily health check', '', 'HTTP 404', { send, now: 1 }), false);
    assert.strictEqual(alertFallback('error', 'Command failed: /draws', 'boom', 'HTTP 404', { send, now: 1 }), true);
    assert.strictEqual(alertFallback('error', 'Another', 'x', 'HTTP 404', { send, now: 2 }), false);
    assert.strictEqual(alertFallback('warn', 'Later', 'y', 'network error', { send, now: 30 * 60_000 + 2 }), true);
    await new Promise(r => setTimeout(r, 10));
    assert.strictEqual(routed.length, 2);
    assert.ok(routed[0].includes('alerts webhook is not working') && routed[0].includes('HTTP 404') && routed[0].includes('Command failed: /draws'));
    console.log('ok: a failing alerts webhook falls back to the owner notice, once per 30 minutes');
})().catch(err => { console.error(err); process.exit(1); });
