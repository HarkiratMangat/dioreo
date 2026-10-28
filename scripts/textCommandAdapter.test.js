// scripts/textCommandAdapter.test.js -- the text-command adapter's contract (utils/textCommands/adapter.js), against a recording REST stub: a command answering a plain message must REPLY to it, then EDIT that reply; never post anything ephemeral publicly; never ping; and, where a server rule makes answers private, post only the Open privately card. Written 2026-10-28 17:26 EDT.
const assert = require('assert');
const { createTextInteraction, TextCommandRefused } = require('../utils/textCommands/adapter');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { cancelPanelExpiry } = require('../utils/passiveExpiry');
const { SHARE_BUTTON_CUSTOM_ID } = require('../utils/shareButton');

function fakeMessage() {
    const calls = [];
    let n = 0;
    const rest = {
        post: async (route, opts) => { calls.push({ verb: 'post', route, body: opts.body }); return { id: `reply${++n}` }; },
        patch: async (route, opts) => { calls.push({ verb: 'patch', route, body: opts.body }); return { id: route.split('/').pop() }; },
        delete: async (route) => { calls.push({ verb: 'delete', route }); },
        get: async () => ({}),
    };
    const channel = { id: 'chan1', permissionsFor: () => ({ has: () => true }), sendTyping: async () => {} };
    const message = {
        id: 'msg1', guildId: 'guild1', channelId: 'chan1', channel, createdTimestamp: Date.now(),
        author: { id: 'user1' }, member: { roles: { cache: new Map() } },
        guild: { members: { me: {} }, preferredLocale: 'en-US' },
        client: { rest, user: { id: 'bot1' }, application: { id: 'app1' } },
    };
    return { message, calls };
}
const textCommand = { name: 'today', slash: 'today' };
const panel = (extraRows = []) => [{ type: 17, components: [{ type: 10, content: 'hi' }, { type: 1, components: [{ type: 2, style: 2, label: 'Next', custom_id: 'page_next' }] }] }, ...extraRows];
const shareRow = { type: 1, components: [{ type: 2, style: 1, label: 'Show Everyone', custom_id: SHARE_BUTTON_CUSTOM_ID }] };

(async () => {
    // 1. Public answer: the member's Hidden setting (flag 64) is ignored, the first send replies, the second edits, no ping, Show Everyone dropped.
    {
        const { message, calls } = fakeMessage();
        const i = createTextInteraction(message, { textCommand, via: 'mention' });
        await i.deferReply({ flags: 64 });
        await sendV2Payload(i, panel([shareRow]));
        await sendV2Payload(i, panel());
        assert.strictEqual(calls.length, 2);
        assert.strictEqual(calls[0].verb, 'post');
        assert.deepStrictEqual(calls[0].body.message_reference, { message_id: 'msg1', fail_if_not_exists: false });
        assert.strictEqual(calls[0].body.flags & 64, 0, 'never ephemeral in a channel');
        assert.strictEqual(calls[0].body.allowed_mentions.replied_user, false, 'never pings');
        assert.ok(!JSON.stringify(calls[0].body.components).includes(SHARE_BUTTON_CUSTOM_ID), 'Show Everyone dropped');
        assert.strictEqual(calls[1].verb, 'patch');
        assert.ok(calls[1].route.endsWith('/reply1'), 'second send edits the first reply');
        cancelPanelExpiry('reply1');
    }
    // 2. A server rule forcing hidden: only the Open privately card is posted, and nothing after it.
    {
        const { message, calls } = fakeMessage();
        const i = createTextInteraction(message, { textCommand, via: 'd' });
        i.dioreoPolicy = { visibility: 'ephemeral' };
        await i.deferReply({ flags: 64 });
        await sendV2Payload(i, panel());
        await i.followUp({ content: 'notice', ephemeral: true });
        assert.strictEqual(calls.length, 1, 'only the card');
        assert.ok(JSON.stringify(calls[0].body).includes('txtpriv_today'), 'the card carries the Open privately button');
        assert.ok(!JSON.stringify(calls[0].body).includes('page_next'), 'the panel itself never posts');
    }
    // 3. A modal-first command is refused rather than half-run.
    {
        const { message } = fakeMessage();
        const i = createTextInteraction(message, { textCommand, via: 'mention' });
        await assert.rejects(() => i.showModal({}), TextCommandRefused);
    }
    // 4. The options stub answers a subcommand, and nothing else.
    {
        const { message } = fakeMessage();
        const i = createTextInteraction(message, { textCommand: { name: 'draw prices', slash: 'draw', sub: 'prices' }, via: 'dior' });
        assert.strictEqual(i.options.getSubcommand(), 'prices');
        assert.strictEqual(i.options.getString('visibility'), null);
        assert.strictEqual(i.isChatInputCommand(), true);
        assert.strictEqual(i.isButton(), false);
    }
    // 5. A channel that denies Read Message History refuses a reply (50013): the answer goes out as a plain message instead.
    {
        const { message, calls } = fakeMessage();
        const post = message.client.rest.post;
        message.client.rest.post = async (route, opts) => {
            if (opts.body.message_reference) { const e = new Error('Missing Permissions'); e.code = 50013; throw e; }
            return post(route, opts);
        };
        const i = createTextInteraction(message, { textCommand, via: 'mention' });
        await i.reply({ content: 'hi' });
        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0].body.message_reference, undefined, 'retried without the reference');
    }
    console.log('textCommandAdapter: 5 cases passed');
})().catch(err => { console.error(err); process.exit(1); });
