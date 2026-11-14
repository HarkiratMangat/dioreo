// scripts/ownerInbox.test.js -- owner notices go to OWNER_CHANNEL with one ping, or to a DM (2026-11-14 13:15 EST). A stand-in for Discord's REST records every call; no network.
const assert = require('assert');
const { postOwnerNotice, withPing } = require('../utils/ownerInbox');
const { ALLOWED_ADMIN_ID } = require('../utils/owner');

function fakeClient({ failChannel = false } = {}) {
    const calls = [];
    return { calls, rest: { post: async (route, opts) => {
        calls.push({ route, body: opts.body, files: opts.files });
        if (route === '/users/@me/channels') return { id: 'DM1' };
        if (failChannel && route === '/channels/OWN/messages') throw new Error('Missing Access');
        return { id: 'M' + calls.length };
    } } };
}
const v2 = { flags: 32768, components: [{ type: 17, components: [{ type: 10, content: 'card' }] }] };
let n = 0; const check = async (name, fn) => { await fn(); n++; console.log('  ok', name); };

(async () => {
    await check('with OWNER_CHANNEL: one post in that channel, a ping line above the card, only the owner can be pinged, no DM', async () => {
        const c = fakeClient();
        const r = await postOwnerNotice(c, v2, ['f'], { env: { OWNER_CHANNEL: 'OWN' } });
        assert.strictEqual(r.where, 'channel'); assert.strictEqual(c.calls.length, 1);
        const [call] = c.calls;
        assert.strictEqual(call.route, '/channels/OWN/messages');
        assert.deepStrictEqual(call.body.components[0], { type: 10, content: `<@${ALLOWED_ADMIN_ID}>` });
        assert.deepStrictEqual(call.body.allowed_mentions, { users: [ALLOWED_ADMIN_ID] });
        assert.deepStrictEqual(call.files, ['f']);
    });
    await check('plain text gets the ping in front', async () => {
        assert.strictEqual(withPing({ content: 'Spam penalty' }).content, `<@${ALLOWED_ADMIN_ID}> Spam penalty`);
    });
    await check('without OWNER_CHANNEL: a DM as before, with no pings', async () => {
        const c = fakeClient();
        const r = await postOwnerNotice(c, v2, [], { env: {} });
        assert.strictEqual(r.where, 'dm'); assert.strictEqual(r.channelId, 'DM1');
        assert.deepStrictEqual(c.calls.map(x => x.route), ['/users/@me/channels', '/channels/DM1/messages']);
        assert.deepStrictEqual(c.calls[1].body.allowed_mentions, { parse: [] });
        assert.strictEqual(c.calls[1].body.components.length, 1, 'no ping line in a DM');
    });
    await check('a channel post that fails falls back to a DM, so the notice is never lost', async () => {
        const c = fakeClient({ failChannel: true });
        const saved = console.error; console.error = () => {};
        try { const r = await postOwnerNotice(c, v2, [], { env: { OWNER_CHANNEL: 'OWN' } }); assert.strictEqual(r.where, 'dm'); } finally { console.error = saved; }
        assert.deepStrictEqual(c.calls.map(x => x.route), ['/channels/OWN/messages', '/users/@me/channels', '/channels/DM1/messages']);
    });
    await check('every owner notice goes through ownerInbox: no other owner DM path is left', async () => {
        const fs = require('fs');
        for (const f of ['utils/buildSubmissions.js', 'utils/drawEndReminder.js']) {
            const s = fs.readFileSync(require.resolve('../' + f), 'utf8');
            assert.ok(/ownerInbox/.test(s), f + ' does not use ownerInbox');
        }
        assert.ok(!/createDM\(/.test(fs.readFileSync(require.resolve('../utils/drawEndReminder.js'), 'utf8')), 'the draw end-date reminder still opens its own DM');
    });
    console.log(`ownerInbox: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
