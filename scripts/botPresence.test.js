// The bot's presence (2026-10-21 19:31 EDT): the top line swaps between the season countdown and /help, under one Watching card with "Add Dioreo · dioreo.app/install" as its second line. See utils/botPresence.js.
const assert = require('assert');
const { ActivityType } = require('discord.js');
const { seasonCountdownLine, buildPresence, startPresenceRotation, HELP_LINE, INSTALL_LINE } = require('../utils/botPresence');

let passed = 0, failed = 0;
const pending = [];
function t(name, fn) { pending.push((async () => { try { await fn(); passed++; console.log(`  PASS  ${name}`); } catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); } })()); }

const NOW = Date.UTC(2026, 9, 21, 23, 30);
const DAY = 24 * 60 * 60 * 1000;
const doc = (over = {}) => ({ currentSeasonTitle: 'Season 7 — Terminated', bpTitle: 'Season 10 2026', bpEnd: new Date(NOW + 21 * DAY), bpEndTBD: false, ...over });

t('a season with an end date reads "Season N · D days left"', () => {
    assert.strictEqual(seasonCountdownLine(doc(), NOW), 'Season 10 · 21 days left');
});
t('part of a day rounds DOWN, one day is singular, under a day is "last day"', () => {
    assert.strictEqual(seasonCountdownLine(doc({ bpEnd: new Date(NOW + 21 * DAY - 1) }), NOW), 'Season 10 · 20 days left');
    assert.strictEqual(seasonCountdownLine(doc({ bpEnd: new Date(NOW + DAY + 60 * 1000) }), NOW), 'Season 10 · 1 day left');
    assert.strictEqual(seasonCountdownLine(doc({ bpEnd: new Date(NOW + 3 * 60 * 60 * 1000) }), NOW), 'Season 10 · last day');
});
t('no countdown when the end is missing, TBD, or past', () => {
    assert.strictEqual(seasonCountdownLine(doc({ bpEnd: null }), NOW), null);
    assert.strictEqual(seasonCountdownLine(doc({ bpEndTBD: true }), NOW), null);
    assert.strictEqual(seasonCountdownLine(doc({ bpEnd: new Date(NOW - 1) }), NOW), null);
    assert.strictEqual(seasonCountdownLine(null, NOW), null);
});
t('the Battle Pass title wins over a stale season title, which is the fallback, then plain "Season"', () => {
    assert.strictEqual(seasonCountdownLine(doc({ bpTitle: 'Battle Pass', currentSeasonTitle: 'season9 — Name' }), NOW), 'Season 9 · 21 days left');
    assert.strictEqual(seasonCountdownLine(doc({ currentSeasonTitle: '', bpTitle: '' }), NOW), 'Season · 21 days left');
});
t('the presence is ONE Watching card with the install line as its second line', () => {
    const p = buildPresence('Season 10 · 21 days left');
    assert.strictEqual(p.activities.length, 1, 'a second activity (a custom status) hides the card');
    assert.deepStrictEqual(p.activities[0], { name: 'Season 10 · 21 days left', state: INSTALL_LINE, type: ActivityType.Watching });
    assert.strictEqual(buildPresence().activities[0].name, HELP_LINE);
});
t('the rotation starts on the countdown, then /help, then the countdown again', async () => {
    const sent = [];
    const client = { user: { setPresence: p => sent.push(p.activities[0].name) } };
    const r = startPresenceRotation(client, { loadSeason: async () => doc({ bpEnd: new Date(Date.now() + 6 * DAY + 60 * 1000) }), intervalMs: 60 * 60 * 1000 });
    await new Promise(res => setImmediate(res));
    await r.tick(); await r.tick();
    r.stop();
    assert.deepStrictEqual(sent, ['Season 10 · 6 days left', HELP_LINE, 'Season 10 · 6 days left']);
});
t('must NOT: a failed season read or no countdown leaves /help up, never throws', async () => {
    const sent = [];
    const client = { user: { setPresence: p => sent.push(p.activities[0].name) } };
    const origErr = console.error; console.error = () => {};
    const r = startPresenceRotation(client, { loadSeason: async () => { throw new Error('db down'); }, intervalMs: 60 * 60 * 1000 });
    await new Promise(res => setImmediate(res));
    console.error = origErr;
    r.stop();
    const r2 = startPresenceRotation(client, { loadSeason: async () => doc({ bpEndTBD: true }), intervalMs: 60 * 60 * 1000 });
    await new Promise(res => setImmediate(res));
    r2.stop();
    assert.deepStrictEqual(sent, [HELP_LINE, HELP_LINE]);
});

Promise.all(pending).then(() => {
    console.log(`\nbotPresence: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
});
