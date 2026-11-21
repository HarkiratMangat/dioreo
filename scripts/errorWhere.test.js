// scripts/errorWhere.test.js `whereLabel` (utils/interactionContext.js) puts the user id, the server id (or DM), the install and the app on the router's error lines and command-failure alerts (PRIVACY v1.16 §2.4a). `reportCommandError` sends one alert per command every 10 minutes. Added 2026-11-21 12:04 EST after an outage whose only error line said "timestamp failed".
const assert = require('assert');
const { whereLabel } = require('../utils/interactionContext');
const { setClients } = require('../bot/clients');

const pub = { name: 'public' };
const admin = { name: 'admin' };
setClients({ public: pub, admin });

const cases = [
    [{ id: '1573700000000456789', guildId: '333', client: pub, authorizingIntegrationOwners: { userId: '42' }, user: { id: '42' } }, '(user 42, server 333, user install, public app, ref 456789)'],
    [{ guildId: '333', client: pub, authorizingIntegrationOwners: { guildId: '333' }, user: { id: '42' } }, '(user 42, server 333, server install, public app)'],
    [{ guildId: null, client: admin, authorizingIntegrationOwners: { 1: '42' }, user: { id: '42' } }, '(user 42, DM, user install, admin app)'],
    [{ guildId: '7', client: pub, user: { id: '42' } }, '(user 42, server 7, install unknown, public app)'],
    [null, '(no interaction)'],
];
for (const [interaction, want] of cases) {
    const got = whereLabel(interaction);
    assert.strictEqual(got, want);
}
console.log(`ok: whereLabel gives user, server, install and app for ${cases.length} cases`);

// reportCommandError: the first failure of a command alerts, a repeat inside 10 minutes does not, another command does, and the same command alerts again after 10 minutes.
const { reportCommandError, _resetCommandAlerts } = require('../utils/interactionContext');
_resetCommandAlerts();
const sent = [];
const alert = (title, detail, level) => sent.push({ title, detail, level });
const ix = cases[0][0];
const t0 = 1_000_000;
assert.strictEqual(reportCommandError(ix, '/timestamp', new Error('boom'), { alert, now: t0 }), true);
assert.strictEqual(reportCommandError(ix, '/timestamp', new Error('boom'), { alert, now: t0 + 60_000 }), false);
assert.strictEqual(reportCommandError(ix, '/draws', new Error('x'), { alert, now: t0 + 60_000 }), true);
assert.strictEqual(reportCommandError(ix, '/timestamp', new Error('boom'), { alert, now: t0 + 10 * 60_000 }), true);
assert.strictEqual(sent.length, 3);
assert.strictEqual(sent[0].title, 'Command failed: /timestamp');
assert.strictEqual(sent[0].level, 'error');
assert.ok(sent[0].detail.startsWith('(user 42, server 333, user install, public app, ref 456789) · interaction 1573700000000456789'), sent[0].detail);
assert.ok(sent[0].detail.includes('boom'));
console.log('ok: reportCommandError alerts once per command per 10 minutes, with who and where');

// The storm cap: 5 different commands alert, the 6th and later in the same 10 minutes send ONE "Many commands failing" between them.
_resetCommandAlerts();
const storm = [];
const salert = (title) => storm.push(title);
for (let i = 0; i < 8; i++) reportCommandError({ ...ix, id: `10000${i}` }, `/c${i}`, new Error('down'), { alert: salert, now: t0 + i });
assert.strictEqual(storm.filter(t => t.startsWith('Command failed')).length, 5);
assert.deepStrictEqual(storm.filter(t => t === 'Many commands failing').length, 1);
assert.ok(storm[0].includes('/c0'));
console.log('ok: past 5 command alerts in 10 minutes, one summary stands in for the rest');
