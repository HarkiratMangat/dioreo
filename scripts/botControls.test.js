// scripts/botControls.test.js -- the owner's bot-wide tools (B7, 2026-10-30 13:40 EDT): utils/botControls.js (the freeze, blocks, exemptions, the ladder's numbers, reply limits, the router's gate), the spam ladder reading the tuned numbers and Extend, the misfire counts, and the /bot penalties, /bot freeze and /bot servers clicks. Nothing reaches Discord or the database: every model is a recording stand-in.
const assert = require('assert');
const path = require('path');

const stub = (rel, exports) => {
    const file = require.resolve(path.join('..', rel));
    require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
const writes = { controls: [], penalties: [], misfires: [] };
stub('models/BotControls', { updateOne: async (q, u) => { writes.controls.push(u.$set); return {}; }, findById: () => ({ lean: async () => null }) });
stub('models/TextPenalty', { updateOne: async (q, u) => { writes.penalties.push(u.$set); return {}; }, deleteOne: async () => ({}), find: () => ({ lean: async () => [] }) });
stub('models/TextMisfire', { bulkWrite: async ops => { writes.misfires.push(...ops); return {}; }, aggregate: async () => [] });

const controls = require('../utils/botControls');
const spam = require('../utils/textCommands/spamLadder');
const misfires = require('../utils/textCommands/misfires');
const { ALLOWED_ADMIN_ID } = require('../utils/owner');

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ok   ${name}`); } catch (e) { failures++; console.error(`  FAIL ${name}\n       ${e.stack.split('\n').slice(0, 3).join('\n       ')}`); }
    controls.__reset();
}

// A message the ladder can start a penalty from, recording what Dioreo posts and edits.
function ladderMessage(userId) {
    const calls = [];
    const client = { rest: {
        post: async (route, o) => { calls.push({ post: o.body }); return { id: 'note1' }; },
        patch: async (route, o) => { calls.push({ patch: o.body }); return {}; },
        delete: async () => { calls.push({ delete: true }); return {}; },
    } };
    return { message: { id: 'm1', guildId: 'g1', channelId: 'c1', client, author: { id: userId }, guild: { name: 'Dioreoland' } }, calls };
}

// An interaction whose sends land in `sent` (sendV2Payload patches @original when deferred).
function click(customId, { fields = {}, button = true, user = ALLOWED_ADMIN_ID, guilds = new Map() } = {}) {
    const sent = [];
    const interaction = {
        customId, user: { id: user }, applicationId: 'A', token: 't', deferred: false, replied: false,
        isButton: () => button, isModalSubmit: () => !button, isStringSelectMenu: () => false,
        fields: { getTextInputValue: k => fields[k] ?? '' },
        client: { commands: new Map([['draws', {}], ['calendar', {}], ['bot', {}]]), guilds: { cache: guilds }, rest: { patch: async (route, o) => { sent.push(o.body); return {}; }, delete: async () => ({}) } },
        deferUpdate: async () => { interaction.deferred = true; },
        reply: async o => { sent.push({ reply: o }); },
        showModal: async m => { sent.push({ modal: m }); },
    };
    return { interaction, sent };
}
const text = body => JSON.stringify(body);

(async () => {
    await check('defaults: nothing frozen, nobody blocked, the ladder and limits as built', async () => {
        assert.strictEqual(controls.isFrozen('draws'), false);
        assert.deepStrictEqual(controls.spam(), { reply: 1, warning: 3, threshold: 10, rungsMin: [1, 5, 15, 60, 360, 720], tuned: false });
        assert.deepStrictEqual(controls.limitsFor('g1'), { perChannel: 5, perServer: 30, custom: false });
        assert.deepStrictEqual([spam.REPLY_POINTS, spam.WARNING_POINTS, spam.PENALTY_SCORE, spam.RUNGS_MS.length], [1, 3, 10, 6]);
    });

    await check('the ladder pop-up: blank is the default, and a value that would break the ladder is refused', async () => {
        assert.deepStrictEqual(controls.parseSpam({}), { spam: {} });
        assert.deepStrictEqual(controls.parseSpam({ points: '2, 4', threshold: '12', rungs: '1 5 30' }), { spam: { reply: 2, warning: 4, threshold: 12, rungsMin: [1, 5, 30] } });
        assert.ok(controls.parseSpam({ points: '0, 3' }).error, 'zero points');
        assert.ok(controls.parseSpam({ points: '3' }).error, 'one number');
        assert.ok(controls.parseSpam({ threshold: '1' }).error, 'one reply would be a penalty');
        assert.ok(controls.parseSpam({ points: '5, 5', threshold: '5' }).error, "a reply's points reach the limit");
        assert.ok(controls.parseSpam({ rungs: '5, 1' }).error, 'shorter after longer');
        assert.ok(controls.parseSpam({ rungs: '1,2,3,4,5,6,7' }).error, 'more rungs than a penalty record holds');
    });

    await check('reply limits: per server, blank back to the default', async () => {
        assert.deepStrictEqual(controls.parseLimits({ perChannel: '8', perServer: '' }), { limits: { perChannel: 8, perServer: null } });
        assert.ok(controls.parseLimits({ perChannel: '0' }).error);
        assert.ok(controls.parseLimits({ perServer: 'lots' }).error);
        await controls.setLimits('g9', { perChannel: 8, perServer: null });
        assert.deepStrictEqual(controls.limitsFor('g9'), { perChannel: 8, perServer: 30, custom: true });
        assert.deepStrictEqual(controls.limitsFor('g1').custom, false, 'another server keeps the default');
        await controls.setLimits('g9', {});
        assert.strictEqual(controls.limitsFor('g9').custom, false);
        assert.deepStrictEqual(writes.controls.at(-1).replyLimits, [], 'stored, and cleared');
    });

    await check("the router's gate: frozen, one command, blocked; the owner, /bot and Dioreo Admin always pass", async () => {
        const i = (extra = {}) => ({ user: { id: 'u1' }, client: {}, ...extra });
        assert.strictEqual(controls.gateInteraction(i({ commandName: 'draws' })), null);
        await controls.setFreeze({ all: true, reason: 'fixing a bug' });
        assert.ok(/Dioreo is paused: fixing a bug$/.test(controls.gateInteraction(i({ commandName: 'draws' }))));
        assert.ok(controls.gateInteraction(i({ customId: 'calsel_x' })), 'a button on an older panel too');
        assert.strictEqual(controls.gateInteraction(i({ commandName: 'bot' })), null, '/bot');
        assert.strictEqual(controls.gateInteraction(i({ customId: 'bot_frz_off' })), null, "/bot's own buttons");
        assert.strictEqual(controls.gateInteraction({ user: { id: ALLOWED_ADMIN_ID }, commandName: 'draws', client: {} }), null, 'the owner');
        const admin = {};
        require('../bot/clients').setClients({ public: {}, admin });
        assert.strictEqual(controls.gateInteraction(i({ commandName: 'manage', client: admin })), null, 'Dioreo Admin');
        require('../bot/clients').setClients({});
        assert.deepStrictEqual(writes.controls.at(-1).freeze.all, true, 'stored');
        await controls.setFreeze({ commands: ['draws'] });
        assert.ok(/Dioreo is paused\. Try again a little later\.$/.test(controls.gateInteraction(i({ commandName: 'draws' }))), 'no reason given');
        assert.strictEqual(controls.gateInteraction(i({ commandName: 'calendar' })), null, 'another command runs');
        assert.strictEqual(controls.gateInteraction(i({ customId: 'calsel_x' })), null, 'a click passes a one-command freeze');
        await controls.clearFreeze();
        await controls.setFlag('blockedUsers', 'u1', true);
        assert.ok(/isn't available to you/.test(controls.gateInteraction(i({ commandName: 'calendar' }))));
    });

    await check('the ladder reads the tuned numbers, and an exempt person never scores', async () => {
        controls.__reset({ spam: { reply: 1, warning: 3, threshold: 4, rungsMin: [2, 3] } });
        assert.deepStrictEqual([spam.PENALTY_SCORE, spam.RUNGS_MS], [4, [120000, 180000]]);
        const t0 = 1e12;
        for (let k = 0; k < 3; k++) assert.strictEqual(spam.addPoints('t1', spam.REPLY_POINTS, t0 + k), false);
        assert.strictEqual(spam.addPoints('t1', spam.REPLY_POINTS, t0 + 3), true, 'the fourth point reaches the tuned limit');
        controls.__reset({ exemptUsers: ['t2'] });
        for (let k = 0; k < 30; k++) assert.strictEqual(spam.addPoints('t2', spam.WARNING_POINTS, t0 + k), false);
    });

    await check('Extend: the next rung up, or a set time, and the countdown note follows', async () => {
        const { message, calls } = ladderMessage('x1');
        const now = Date.now();
        const p = await spam.startPenalty(message, { now });
        assert.deepStrictEqual([p.step, p.noteMessageId], [1, 'note1']);
        assert.strictEqual(spam.stepToday('x1'), 1);
        const e = await spam.extendPenalty('x1', { now });
        assert.deepStrictEqual([e.step, e.until], [2, now + 5 * 60000], 'the next rung, 5 m');
        assert.ok(calls.some(c => c.patch && c.patch.content.includes(`<t:${Math.ceil(e.until / 1000)}:R>`)), 'the note shows the new end');
        const f = await spam.extendPenalty('x1', { ms: 30 * 60000, now });
        assert.deepStrictEqual([f.step, f.until], [2, now + 30 * 60000], 'a set time keeps the rung');
        assert.strictEqual(writes.penalties.at(-1).until.getTime(), now + 30 * 60000, 'stored');
        assert.strictEqual(await spam.extendPenalty('nobody'), null);
        await spam.liftPenalty('x1');
        assert.strictEqual(spam.stepToday('x1'), 0, 'a lift forgets the rung');
    });

    await check("misfires: Dioreo's own words only, one $inc per row", async () => {
        misfires.note('g1', 'didYouMean', 'Draws/Today', 'd+typo');
        misfires.note('g1', 'didYouMean', 'draws/today', 'd+typo');
        misfires.note('g1', 'noMatch', 'gunsmith', 'mention');
        misfires.note(null, 'noMatch', 'gunsmith', 'mention');
        assert.strictEqual(await misfires.flush(), 2);
        const dym = writes.misfires.find(o => o.updateOne.filter.kind === 'didYouMean').updateOne;
        assert.deepStrictEqual([dym.filter.word, dym.filter.via, dym.update.$inc.count], ['draws/today', 'd+typo', 2]);
        assert.ok(dym.update.$setOnInsert.expireAt > new Date(), 'kept 30 days');
        assert.strictEqual(await misfires.flush(), 0, 'nothing left');
        assert.deepStrictEqual(Object.keys(dym.filter).sort(), ['day', 'guildId', 'kind', 'via', 'word'], 'no person, no text');
    });

    const { handleBotInteraction } = require('../handlers/bot');

    await check('/bot penalties: only the owner; Look Up opens one person; Block takes two presses and lifts', async () => {
        const denied = click('bot_pen_list', { user: 'u2' });
        await handleBotInteraction(denied.interaction);
        assert.ok(/Only the bot owner/.test(denied.sent[0].reply.content));
        const lookup = click('bot_pen_ask');
        await handleBotInteraction(lookup.interaction);
        assert.strictEqual(lookup.sent[0].modal.custom_id, 'bot_penm_ask');
        const bad = click('bot_penm_ask', { button: false, fields: { id: 'abc' } });
        await handleBotInteraction(bad.interaction);
        assert.ok(/not a user ID/.test(bad.sent[0].reply.content));
        const { message } = ladderMessage('111111111111111111');
        await spam.startPenalty(message);
        const open = click('bot_penm_ask', { button: false, fields: { id: '<@111111111111111111>' } });
        await handleBotInteraction(open.interaction);
        assert.ok(/Penalty\*\* · 1 m, ends <t:\d+:R>/.test(text(open.sent[0])), text(open.sent[0]));
        assert.ok(text(open.sent[0]).includes('bot_pen_blockarm|111111111111111111'));
        const arm = click('bot_pen_blockarm|111111111111111111');
        await handleBotInteraction(arm.interaction);
        assert.ok(text(arm.sent[0]).includes('Confirm: block from Dioreo everywhere'));
        assert.strictEqual(controls.isBlockedUser('111111111111111111'), false, 'one press blocks nobody');
        const block = click('bot_pen_block|111111111111111111');
        await handleBotInteraction(block.interaction);
        assert.strictEqual(controls.isBlockedUser('111111111111111111'), true);
        assert.strictEqual(spam.penaltyFor('111111111111111111'), null, 'blocking lifts the running penalty and its note');
        const owner = click(`bot_pen_block|${ALLOWED_ADMIN_ID}`);
        await handleBotInteraction(owner.interaction);
        assert.strictEqual(controls.isBlockedUser(ALLOWED_ADMIN_ID), false, 'the owner is never a target');
    });

    await check('/bot penalties: Tune the Ladder refuses a bad value and saves a good one', async () => {
        const bad = click('bot_penm_tune', { button: false, fields: { threshold: '1' } });
        await handleBotInteraction(bad.interaction);
        assert.ok(bad.sent[0].reply, 'refused privately');
        assert.strictEqual(controls.spam().tuned, false);
        const good = click('bot_penm_tune', { button: false, fields: { points: '1, 2', threshold: '8', rungs: '1, 10' } });
        await handleBotInteraction(good.interaction);
        assert.deepStrictEqual(controls.spam(), { reply: 1, warning: 2, threshold: 8, rungsMin: [1, 10], tuned: true });
        assert.ok(/Rungs 1 m · 10 m/.test(text(good.sent[0])), 'the panel shows the new ladder');
    });

    await check('/bot freeze: commands are checked against the real list; Unfreeze clears it', async () => {
        const typo = click('bot_frzm_some', { button: false, fields: { commands: 'draws, drwas' } });
        await handleBotInteraction(typo.interaction);
        assert.ok(/Not a command: `drwas`/.test(typo.sent[0].reply.content));
        assert.strictEqual(controls.isFrozen('draws'), false, 'nothing frozen on a typo');
        const self = click('bot_frzm_some', { button: false, fields: { commands: 'bot' } });
        await handleBotInteraction(self.interaction);
        assert.ok(self.sent[0].reply, '/bot can never be frozen');
        const ok = click('bot_frzm_some', { button: false, fields: { commands: 'draws', reason: 'new season data' } });
        await handleBotInteraction(ok.interaction);
        assert.strictEqual(controls.isFrozen('draws'), true);
        assert.ok(/Frozen\*\* · `\/draws`/.test(text(ok.sent[0])) && text(ok.sent[0]).includes('Dioreo is paused: new season data'));
        const off = click('bot_frz_off');
        await handleBotInteraction(off.interaction);
        assert.strictEqual(controls.isFrozen('draws'), false);
        assert.ok(text(off.sent[0]).includes('Running normally.'));
    });

    await check('/bot servers: Leave and Block take two presses; Block stores and leaves; Reply Limits saves', async () => {
        const changeStore = require('../utils/changeStore');
        const realRecord = changeStore.recordChange;
        const logged = [];
        changeStore.recordChange = f => { logged.push(f); return Promise.resolve(); };
        const GuildSettings = require('../models/GuildSettings');
        const realFind = GuildSettings.findOne;
        GuildSettings.findOne = () => ({ lean: async () => null });
        try {
            let left = 0;
            const id = '222222222222222222';
            const guilds = new Map([[id, { id, name: 'Spam Farm', memberCount: 12, leave: async () => { left++; }, members: { me: null }, channels: { cache: new Map() } }]]);
            require('../bot/clients').setClients({ public: { guilds: { cache: guilds }, application: { id: 'A' }, rest: { get: async () => [] } } });
            const arm = click(`bot_srv_blockarm|${id}`, { guilds });
            await handleBotInteraction(arm.interaction);
            assert.ok(text(arm.sent[0]).includes('Confirm: leave and block it'));
            assert.strictEqual(left, 0);
            const block = click(`bot_srv_block|${id}`, { guilds });
            await handleBotInteraction(block.interaction);
            assert.deepStrictEqual([controls.isBlockedGuild(id), left], [true, 1]);
            assert.strictEqual(controls.wasLeaving(id), true, 'the feed will say Dioreo left, not that it was removed');
            assert.strictEqual(logged.at(-1).action, 'serverBlock');
            assert.ok(text(block.sent[0]).includes('Unblock Server'));
            const lim = click(`bot_srv_limits|${id}`, { guilds });
            await handleBotInteraction(lim.interaction);
            assert.strictEqual(lim.sent[0].modal.custom_id, `bot_srvlim|${id}`);
            const save = click(`bot_srvlim|${id}`, { button: false, guilds, fields: { perChannel: '2', perServer: '10' } });
            await handleBotInteraction(save.interaction);
            assert.deepStrictEqual(controls.limitsFor(id), { perChannel: 2, perServer: 10, custom: true });
            assert.ok(/Reply limits\*\* · 2 per channel · 10 per server, per 10 s/.test(text(save.sent[0])), 'the checkup shows them');
        } finally {
            require('../bot/clients').setClients({});
            changeStore.recordChange = realRecord;
            GuildSettings.findOne = realFind;
        }
    });

    console.log(failures ? `\n${failures} failing` : '\nbotControls: all passing');
    process.exit(failures ? 1 : 0);
})();
