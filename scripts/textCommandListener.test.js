// scripts/textCommandListener.test.js -- the text-command listener end to end (bot/textCommands.js onMessage, then handlers/textCommands.js for the buttons it posts), with every command module replaced by a stub that records the interaction it was given. Options arrive through options.getString; a weapon or season is looked up through the slash command's own suggestions (utils/autocomplete.js, stubbed here); an ambiguous one gets Did you mean after @Dioreo and silence after `d`; `d timestamp` as a reply runs Convert Times on that message; `d timestamp` alone posts the pop-up card, whose button opens the pop-up and whose answer runs /timestamp. Nothing reaches Discord or the database. Written 2026-10-29 (text commands B2).
const assert = require('assert');
const path = require('path');

const stub = (rel, exports) => {
    const file = require.resolve(path.join('..', rel));
    require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
stub('utils/textCommands/permissions', { textCommandAllowed: async () => true, invalidateGuildOverrides() {} });
stub('handlers/router', { buildInteractionContext: () => ({}) });
stub('utils/guildPolicy', { attachGuildPolicy: async () => null });
stub('utils/eventStore', { recordInteractionEvent() {} });
stub('utils/userStats', { noteOwnCommandSafely() {} });
// The suggestion lists, as /gunsmith mp and /patch notes would give them.
const WEAPONS = [
    { name: '▸ All META builds', value: '~scope~MP.meta' },
    { name: '[AR] AK117', value: 'ak117' },
    { name: '[AR] AK-47', value: 'ak47' },
    { name: '[SMG] Fennec', value: 'fennec' },
];
const SEASONS = [{ name: 'Season 9: Haunted', value: 'id9' }, { name: 'Season 8: Terminated', value: 'id8' }];
const autocompleteCalls = [];
stub('utils/autocomplete', {
    runAutocomplete: async (i) => {
        const text = i.options.getFocused().toLowerCase().replace(/[\s-]/g, '');
        autocompleteCalls.push({ command: i.commandName, text });
        const pool = i.commandName === 'patch' ? SEASONS : WEAPONS;
        return i.respond(pool.filter(c => c.value.startsWith('~') ? !text : c.name.toLowerCase().replace(/[\s-]/g, '').includes(text)));
    },
});
process.env.TEXT_PREFIXES = '/,d,dior';
process.env.NODE_ENV = 'test'; // the dev-only timing line stays out of the output

const { onMessage } = require('../bot/textCommands');
const { handleTextCommandsInteraction } = require('../handlers/textCommands');

const BOT = '111';
const ran = [];
const record = name => ({ async execute(interaction) { ran.push({ name, interaction }); } });
const commands = new Map([
    ['calendar', record('calendar')], ['gunsmith', record('gunsmith')], ['timestamp', { ...record('timestamp'), expandShorthand: require('../commands/timestamp').expandShorthand }],
    ['patch', record('patch')], ['draw', record('draw')], ['draws', record('draws')],
    ['Convert Times#3', record('Convert Times')], ['View Colors#2', record('View Colors')],
]);
let n = 0;
function fakeMessage(content, { reference = null, target = null } = {}) {
    const id = ++n;
    const posts = [];
    const client = {
        user: { id: BOT }, application: { id: BOT }, textMessageContent: true, commands,
        users: { fetch: async uid => ({ id: uid, username: `user${uid}` }) },
        rest: { post: async (route, opts) => { posts.push(opts.body); return { id: `r${id}` }; }, patch: async () => ({}), get: async () => ({}), delete: async () => ({}) },
    };
    const channel = { id: `c${id}`, permissionsFor: () => ({ has: () => true }), isThread: () => false, sendTyping: async () => {} };
    const message = {
        id: `m${id}`, guildId: 'g1', channelId: channel.id, channel, client, content,
        author: { id: `u${id}`, bot: false }, member: null, createdTimestamp: Date.now(),
        guild: { members: { me: {} }, roles: { botRoleFor: () => null } },
        reference, fetchReference: async () => target,
    };
    return { message, posts };
}
const lastRun = () => ran[ran.length - 1];
const buttons = body => JSON.stringify(body).match(/"custom_id":"[^"]+"/g) || [];

let failures = 0;
async function check(name, fn) {
    const before = ran.length;
    try { await fn(before); console.log(`  ok   ${name}`); } catch (e) { failures++; console.error(`  FAIL ${name}\n       ${e.message}`); }
}

(async () => {
    await check('options arrive through getString, visibility never', async (before) => {
        await onMessage(fakeMessage('d calendar events upcoming').message);
        assert.strictEqual(ran.length, before + 1);
        const i = lastRun().interaction;
        assert.strictEqual(i.options.getString('page'), 'events');
        assert.strictEqual(i.options.getString('filter'), 'soon');
        assert.strictEqual(i.options.getString('visibility'), null);
        assert.strictEqual(i.__dioreoVia, 'd+args');
    });
    await check('a calendar shortcut word opens its page', async () => {
        await onMessage(fakeMessage('d modes').message);
        assert.strictEqual(lastRun().interaction.options.getString('page'), 'playlists');
        assert.strictEqual(lastRun().interaction.__dioreoVia, 'd');
    });
    await check('draw prices: a group word filters every draw in it', async () => {
        await onMessage(fakeMessage('d prices legendary 20').message);
        const i = lastRun().interaction;
        assert.strictEqual(lastRun().name, 'draw');
        assert.strictEqual(i.options.getSubcommand(), 'prices');
        assert.strictEqual(i.options.getString('filter'), 'legendaryGunReactive,legendaryGunNonReactive');
        assert.strictEqual(i.options.getString('region'), 'region_20');
    });
    await check('one confident weapon is looked up and runs gunsmith mp', async () => {
        await onMessage(fakeMessage('d gs ak117').message);
        const i = lastRun().interaction;
        assert.strictEqual(lastRun().name, 'gunsmith');
        assert.strictEqual(i.options.getSubcommand(), 'mp');
        assert.strictEqual(i.options.getString('weapon'), 'ak117');
    });
    await check('an ambiguous weapon after @Dioreo gets Did you mean, each button carrying its value', async (before) => {
        const { message, posts } = fakeMessage(`<@${BOT}> gs ak`);
        await onMessage(message);
        assert.strictEqual(ran.length, before, 'nothing ran');
        assert.strictEqual(posts.length, 1);
        assert.ok(JSON.stringify(posts[0]).includes('Did you mean'));
        assert.deepStrictEqual(buttons(posts[0]), ['"custom_id":"txtrun_gunsmith~weapon=ak117"', '"custom_id":"txtrun_gunsmith~weapon=ak47"']);
    });
    await check('the same ambiguity after d is silent', async (before) => {
        const { message, posts } = fakeMessage('d gs ak');
        await onMessage(message);
        assert.strictEqual(ran.length, before);
        assert.strictEqual(posts.length, 0);
    });
    await check('dior gunsmith skins are cool sends nothing', async (before) => {
        const { message, posts } = fakeMessage('dior gunsmith skins are cool');
        await onMessage(message);
        assert.strictEqual(ran.length, before);
        assert.strictEqual(posts.length, 0);
    });
    await check('no match after @Dioreo says so in one line', async () => {
        const { message, posts } = fakeMessage(`<@${BOT}> gs zzz`);
        await onMessage(message);
        assert.strictEqual(posts[0]?.content, 'No match for “zzz”.');
    });
    await check('a bare exact weapon name runs gunsmith; a near one stays silent', async (before) => {
        await onMessage(fakeMessage('d fennec').message);
        assert.strictEqual(lastRun().name, 'gunsmith');
        assert.strictEqual(lastRun().interaction.options.getString('weapon'), 'fennec');
        const after = ran.length;
        const { message, posts } = fakeMessage('d ak');
        await onMessage(message);
        assert.strictEqual(ran.length, after);
        assert.strictEqual(posts.length, 0);
        assert.strictEqual(after, before + 1);
    });
    await check('patch notes latest takes the newest season', async () => {
        await onMessage(fakeMessage('d pn latest').message);
        assert.strictEqual(lastRun().name, 'patch');
        assert.strictEqual(lastRun().interaction.options.getString('season'), 'id9');
    });
    await check('d timestamp as a reply runs Convert Times on the replied message', async () => {
        const target = { id: 'target1', content: 'raid at 8pm EST' };
        await onMessage(fakeMessage('d timestamp', { reference: { messageId: 'target1', type: 0 }, target }).message);
        assert.strictEqual(lastRun().name, 'Convert Times');
        assert.strictEqual(lastRun().interaction.targetMessage, target);
        assert.strictEqual(lastRun().interaction.commandName, 'Convert Times');
    });
    await check('d colors @name shows that person through View Colors', async () => {
        await onMessage(fakeMessage('d colors <@555>').message);
        assert.strictEqual(lastRun().name, 'View Colors');
        assert.strictEqual(lastRun().interaction.targetUser.id, '555');
    });
    await check('d timestamp with a date runs /timestamp with it', async () => {
        await onMessage(fakeMessage('d time in a minute').message);
        assert.strictEqual(lastRun().name, 'timestamp');
        assert.strictEqual(lastRun().interaction.options.getString('datetime'), 'in a minute');
    });
    await check('d timestamp is wrong lol sends nothing', async (before) => {
        const { message, posts } = fakeMessage('d timestamp is wrong lol');
        await onMessage(message);
        assert.strictEqual(ran.length, before);
        assert.strictEqual(posts.length, 0);
    });
    let cardId = null;
    await check('d timestamp alone posts a card whose button opens the pop-up', async (before) => {
        const { message, posts } = fakeMessage('d timestamp');
        await onMessage(message);
        assert.strictEqual(ran.length, before);
        assert.deepStrictEqual(buttons(posts[0]), ['"custom_id":"txtrun_timestamp~open"']);
        cardId = 'txtrun_timestamp~open';
    });
    await check('@Dioreo calendar purple gets the usage line', async () => {
        const { message, posts } = fakeMessage(`<@${BOT}> calendar purple`);
        await onMessage(message);
        assert.ok(/^Try `calendar /.test(posts[0]?.content || ''), posts[0]?.content);
    });

    // The buttons those replies carry.
    const click = (customId, extra = {}) => {
        const replies = [];
        const i = {
            customId, guildId: 'g1', channelId: 'c1', channel: null, member: null, user: { id: 'clicker' }, client: { commands, users: { fetch: async uid => ({ id: uid }) }, channels: { fetch: async () => null } },
            token: 't', deferred: false,
            isButton: () => !extra.modal, isModalSubmit: () => Boolean(extra.modal),
            async deferReply(o) { this.deferred = true; replies.push({ defer: o }); },
            async reply(o) { replies.push(o); }, async editReply(o) { replies.push({ edit: o }); },
            async showModal(m) { replies.push({ modal: m }); },
            fields: { getTextInputValue: k => (extra.fields || {})[k] || '' },
        };
        return { i, replies };
    };
    await check('a Did you mean button runs the command with its value, publicly', async () => {
        const { i, replies } = click('txtrun_gunsmith~weapon=ak47');
        assert.strictEqual(await handleTextCommandsInteraction(i), true);
        assert.strictEqual(lastRun().interaction.options.getString('weapon'), 'ak47');
        assert.strictEqual(lastRun().interaction.options.getSubcommand(), 'mp');
        assert.deepStrictEqual(replies[0], { defer: { flags: 0 } });
    });
    await check('the card button opens the timestamp pop-up, and its answer runs /timestamp', async () => {
        const open = click(cardId);
        await handleTextCommandsInteraction(open.i);
        const modal = open.replies[0]?.modal;
        assert.strictEqual(modal?.custom_id, 'txtrun_timestamp~submit');
        const submit = click(modal.custom_id, { modal: true, fields: { datetime: 'friday 6pm', timezone: 'Tokyo' } });
        await handleTextCommandsInteraction(submit.i);
        assert.strictEqual(lastRun().name, 'timestamp');
        assert.strictEqual(lastRun().interaction.options.getString('datetime'), 'friday 6pm');
        assert.strictEqual(lastRun().interaction.options.getString('timezone'), 'Tokyo');
    });
    await check('a button whose stored value expired says to run it again', async () => {
        const { i, replies } = click('txtrun_~nope');
        await handleTextCommandsInteraction(i);
        assert.ok(/Run it again/.test(replies[0]?.content || ''));
    });
    console.log(failures ? `\n${failures} failing` : '\ntextCommandListener: all passing');
    process.exit(failures ? 1 : 0);
})();
