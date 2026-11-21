// scripts/errorWhere.test.js `whereLabel` (utils/interactionContext.js) puts the server id (or DM), the install and the app on the router's error lines, and never a user id: PRIVACY §2.4a says no log statement writes one deliberately. Added 2026-11-21 12:04 EST after an outage whose only error line said "timestamp failed".
const assert = require('assert');
const { whereLabel } = require('../utils/interactionContext');
const { setClients } = require('../bot/clients');

const pub = { name: 'public' };
const admin = { name: 'admin' };
setClients({ public: pub, admin });

const cases = [
    [{ guildId: '333', client: pub, authorizingIntegrationOwners: { userId: '42' }, user: { id: '42' } }, '(server 333, user install, public app)'],
    [{ guildId: '333', client: pub, authorizingIntegrationOwners: { guildId: '333' }, user: { id: '42' } }, '(server 333, server install, public app)'],
    [{ guildId: null, client: admin, authorizingIntegrationOwners: { 1: '42' }, user: { id: '42' } }, '(DM, user install, admin app)'],
    [{ guildId: '7', client: pub, user: { id: '42' } }, '(server 7, install unknown, public app)'],
    [null, '(no interaction)'],
];
for (const [interaction, want] of cases) {
    const got = whereLabel(interaction);
    assert.strictEqual(got, want);
    assert.ok(!/\b42\b/.test(got), `no user id in "${got}"`);
}
console.log(`ok: whereLabel gives server, install and app for ${cases.length} cases, never a user id`);
