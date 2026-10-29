// scripts/textCommandAdapter.test.js -- the text-command adapter's contract (utils/textCommands/adapter.js), against a recording REST stub: a command answering a plain message must REPLY to it, then EDIT that reply; never post anything ephemeral publicly; never ping; and, where a server rule makes answers private, post only the Open privately card. Written 2026-10-28 17:26 EDT.
const assert = require('assert');
const { createTextInteraction, TextCommandRefused, runCustomId, readRunCustomId } = require('../utils/textCommands/adapter');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { cancelPanelExpiry, schedulePanelExpiry } = require('../utils/passiveExpiry');
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
    // 6. A forced-private answer stays private even when the command sends its panel without deferring first (B4, 2026-10-29 10:32 EDT: sendV2Payload's text branch went straight to send()).
    {
        const { message, calls } = fakeMessage();
        const i = createTextInteraction(message, { textCommand, via: 'd' });
        i.dioreoPolicy = { visibility: 'ephemeral' };
        await sendV2Payload(i, panel());
        assert.strictEqual(calls.length, 1, 'only the card');
        assert.ok(JSON.stringify(calls[0].body).includes('txtpriv_today'));
        assert.ok(!JSON.stringify(calls[0].body).includes('page_next'), 'the panel itself never posts');
    }
    // 7. The reply greys out after its idle time, edited with the bot token (a text reply has no interaction token).
    {
        const { message, calls } = fakeMessage();
        const i = createTextInteraction(message, { textCommand, via: 'd' });
        schedulePanelExpiry(i, 'reply9', panel(), 5);
        await new Promise(r => setTimeout(r, 40));
        const edit = calls.find(c => c.verb === 'patch');
        assert.ok(edit, 'the idle edit happened');
        assert.strictEqual(edit.route, '/channels/chan1/messages/reply9');
        assert.strictEqual(edit.body.components[0].components[1].components[0].disabled, true);
    }
    // 8. A button payload too long for its custom_id is held for 15 minutes and dropped by its own timer, never left until the next long one.
    {
        const realTimeout = global.setTimeout;
        const timers = [];
        global.setTimeout = (fn, ms) => { timers.push({ fn, ms }); return { unref() {} }; };
        let id;
        try { id = runCustomId('txtrun_', { name: 'timestamp' }, `datetime=${'x'.repeat(120)}`); } finally { global.setTimeout = realTimeout; }
        assert.ok(id.startsWith('txtrun_~'));
        const rest = id.slice('txtrun_'.length);
        assert.strictEqual(readRunCustomId(rest).expired, undefined, 'readable while fresh');
        const timer = timers.find(t => t.ms === 15 * 60 * 1000);
        assert.ok(timer, 'a 15-minute timer was set');
        timer.fn();
        assert.strictEqual(readRunCustomId(rest).expired, true, 'gone once its timer fires');
    }
    console.log('textCommandAdapter: 8 cases passed');
})().catch(err => { console.error(err); process.exit(1); });
