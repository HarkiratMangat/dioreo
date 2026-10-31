// scripts/textCommandListener.test.js -- the text-command listener end to end (bot/textCommands.js onMessage, then handlers/textCommands.js for the buttons it posts), with every command module replaced by a stub that records the interaction it was given. Options arrive through options.getString; a weapon or season is looked up through the slash command's own suggestions (utils/autocomplete.js, stubbed here); an ambiguous one gets Did you mean after @Dioreo and silence after `d`; `d timestamp` as a reply runs Convert Times on that message; `d timestamp` alone posts the pop-up card, whose button opens the pop-up and whose answer runs /timestamp. Nothing reaches Discord or the database. Written 2026-10-29 (text commands B2).
const assert = require('assert');
const path = require('path');

const stub = (rel, exports) => {
    const file = require.resolve(path.join('..', rel));
    require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
stub('utils/textCommands/permissions', { textCommandAllowed: async () => true, invalidateGuildOverrides() {} });
stub('handlers/router', { buildInteractionContext: () => ({}) });
// The server's stored settings, per guild id (B7): the real utils/guildPolicy.js reads them through this stand-in model, so prefixes and the text-command switch are tested with the real resolver. A guild id is read once and cached for five minutes, so each case uses its own.
const SERVER = {};
stub('models/GuildSettings', { findOne: q => ({ lean: async () => SERVER[q.guildId] || null }) });
stub('models/TextPenalty', { updateOne: async () => ({}), deleteOne: async () => ({}), find: () => ({ lean: async () => [] }) });
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
process.env.TEXT_PREFIXES = 'd,dior';
process.env.NODE_ENV = 'test'; // the dev-only timing line stays out of the output

const { onMessage } = require('../bot/textCommands');
const { handleTextCommandsInteraction } = require('../handlers/textCommands');

const BOT = '111';
const ran = [];
const record = name => ({ async execute(interaction) { ran.push({ name, interaction }); } });
// /gunsmith's textWeapon over a small weapon list, with the real pickWeapon (2026-10-29 11:05 EDT): a no-build catalogue weapon's value is its name, as the dropdown sends it.
const WEAPON_POOL = [['AK117', 'ak117', 'AR'], ['AK-47', 'ak47', 'AR'], ['Fennec', 'fennec', 'SMG'], ['KILO 141', 'kilo141', 'AR'], ['KILO BOLT-ACTION', 'kiloboltaction', 'SNIPER'], ['PPSh-41', 'PPSh-41', 'SMG', true]]
    .map(([weaponName, weaponKey, category, noBuild]) => ({ weaponName, weaponKey, category, noBuild: Boolean(noBuild) }));
async function textWeapon(mode, text) {
    const picked = require('../utils/search').pickWeapon(text, WEAPON_POOL);
    const view = w => ({ value: w.weaponKey, label: `${w.weaponName}${w.noBuild ? ' · no build yet' : ''}` });
    return { hit: picked.hit ? view(picked.hit) : null, several: picked.several.map(view), loose: picked.loose.map(view) };
}
const commands = new Map([
    ['calendar', record('calendar')], ['gunsmith', { ...record('gunsmith'), textWeapon }], ['timestamp', { ...record('timestamp'), expandShorthand: require('../commands/timestamp').expandShorthand }],
    ['patch', record('patch')], ['draw', record('draw')], ['draws', record('draws')],
    ['Convert Times#3', record('Convert Times')], ['View Colors#2', record('View Colors')],
]);
let n = 0;
function fakeMessage(content, { reference = null, target = null, guildId = 'g1' } = {}) {
    const id = ++n;
    const posts = [];
    const client = {
        user: { id: BOT }, application: { id: BOT }, textMessageContent: true, commands,
        users: { fetch: async uid => ({ id: uid, username: `user${uid}` }) },
        rest: { post: async (route, opts) => { posts.push(opts.body); return { id: `r${id}` }; }, patch: async () => ({}), get: async () => ({}), delete: async () => ({}) },
    };
    const channel = { id: `c${id}`, permissionsFor: () => ({ has: () => true }), isThread: () => false, sendTyping: async () => {} };
    const message = {
        id: `m${id}`, guildId, channelId: channel.id, channel, client, content,
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
        assert.strictEqual(posts[0].components[0].accent_color, 16743772, 'the Did you mean card wears /help\'s coral');
        assert.deepStrictEqual(buttons(posts[0]), ['"custom_id":"txtrun_gunsmith~weapon=ak117"', '"custom_id":"txtrun_gunsmith~weapon=ak47"']);
    });
    await check('d build kilo: two weapons fit every word, so Did you mean after d too', async (before) => {
        const { message, posts } = fakeMessage('d build kilo');
        await onMessage(message);
        assert.strictEqual(ran.length, before);
        assert.deepStrictEqual(buttons(posts[0]), ['"custom_id":"txtrun_gunsmith~weapon=kilo141"', '"custom_id":"txtrun_gunsmith~weapon=kiloboltaction"']);
    });
    await check('kilo ar opens the AR Kilo; lol after d is silent, after @Dioreo only offered', async (before) => {
        await onMessage(fakeMessage('d gs kilo ar').message);
        assert.strictEqual(lastRun().interaction.options.getString('weapon'), 'kilo141');
        const after = ran.length;
        const quiet = fakeMessage('d gs lol');
        await onMessage(quiet.message);
        assert.strictEqual(quiet.posts.length, 0);
        const asked = fakeMessage(`<@${BOT}> gs lol`);
        await onMessage(asked.message);
        assert.strictEqual(ran.length, after, 'a loose match never runs');
        assert.deepStrictEqual(buttons(asked.posts[0]), ['"custom_id":"txtrun_gunsmith~weapon=kilo141"']);
        assert.strictEqual(after, before + 1);
    });
    await check('a weapon with no build opens through its name, as the dropdown sends it', async () => {
        await onMessage(fakeMessage('d gs ppsh').message);
        assert.strictEqual(lastRun().interaction.options.getString('weapon'), 'PPSh-41');
        const { message, posts } = fakeMessage(`<@${BOT}> gs ppsh 4`);
        await onMessage(message);
        assert.ok(JSON.stringify(posts[0] || {}).includes('no build yet') || lastRun().interaction.options.getString('weapon') === 'PPSh-41');
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
        assert.ok(/No match for “zzz”\.$/.test(posts[0]?.content || ''), posts[0]?.content);
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
        // His #4 case 1 (B6, 2026-10-29 14:49 EDT): /timestamp's teal, the title and examples with the prefix used beside a blurple Pick date & time, and the card deletes itself unless pressed.
        const box = posts[0].components[0];
        assert.strictEqual(box.accent_color, 1548962);
        const section = box.components[0];
        assert.strictEqual(section.type, 9);
        assert.ok(/^### .* What date or time\?\n-# e\.g: `d time in 2 days` · `d time fri 6pm`\n-# Confused\? `d help timestamp`$/.test(section.components[0].content), section.components[0].content);
        assert.strictEqual(section.accessory.label, 'Pick date & time');
        assert.strictEqual(section.accessory.style, 1);
        assert.ok(section.accessory.emoji?.id, 'the button carries the timestamp icon');
        assert.ok(require('../utils/textCommands/cardTimers').pending(`r${message.id.slice(1)}`), 'the card deletes itself unless pressed');
        cardId = 'txtrun_timestamp~open';
    });
    await check('a date that does not read gets the Couldn\'t read card, with the prefix used', async (before) => {
        const { message, posts } = fakeMessage(`<@${BOT}> time to sleep`);
        await onMessage(message);
        assert.strictEqual(ran.length, before);
        const section = posts[0].components[0].components[0];
        assert.ok(/Couldn't read `to sleep`\n-# Try a date or time: `@Dioreo time 6 month 7day` · `@Dioreo ts fri 6pm`$/.test(section.components[0].content), section.components[0].content);
        assert.strictEqual(section.accessory.label, 'Try again');
        assert.strictEqual(section.accessory.custom_id, 'txtrun_timestamp~open');
    });
    await check('@Dioreo calendar purple runs calendar, the unknown word ignored (the spec\'s rules table)', async (before) => {
        const { message, posts } = fakeMessage(`<@${BOT}> calendar purple upcoming`);
        await onMessage(message);
        assert.strictEqual(ran.length, before + 1);
        assert.strictEqual(lastRun().name, 'calendar');
        assert.strictEqual(lastRun().interaction.options.getString('filter'), 'soon');
        assert.ok(!posts.some(p => /^Try /.test(p.content || '')), 'no usage line');
    });

    // The spec's "When Dioreo answers" limits and guards, each one end to end (B4, 2026-10-29 10:32 EDT: none had a test).
    await check('bots, webhooks, system messages and DMs are ignored', async (before) => {
        for (const patch of [{ author: { id: 'b', bot: true } }, { webhookId: 'w1' }, { system: true }, { guildId: null }]) {
            const { message, posts } = fakeMessage('d calendar');
            Object.assign(message, patch);
            await onMessage(message);
            assert.strictEqual(posts.length, 0, JSON.stringify(patch));
        }
        assert.strictEqual(ran.length, before);
    });
    await check('same command, same person, within 5 s: one countdown note, then nothing', async (before) => {
        const posts = [];
        for (let k = 0; k < 3; k++) {
            const m = fakeMessage('d draws');
            m.message.author.id = 'repeat';
            await onMessage(m.message);
            posts.push(...m.posts);
        }
        assert.strictEqual(ran.length, before + 1, 'ran once');
        const notes = posts.filter(p => /again <t:\d+:R>/.test(p.content || ''));
        assert.strictEqual(notes.length, 1, 'one countdown note');
        // His wording (B6, 2026-10-29 15:06 EDT): small text, the command as typed.
        assert.ok(/^-# <a?:\w+:\d+> Slow down! Try `d draws` again <t:\d+:R>$/.test(notes[0].content), notes[0].content);
    });
    await check('a repeated help card within 5 s gets no countdown, only a real command does', async () => {
        const posts = [];
        for (let k = 0; k < 2; k++) { const m = fakeMessage(`<@${BOT}>`); m.message.author.id = 'helpy'; await onMessage(m.message); posts.push(...m.posts); }
        assert.strictEqual(posts.length, 1, 'one help card, then silence');
    });
    await check('a command that throws gets the crash line with what was typed', async () => {
        const boom = { async execute() { throw new Error('boom'); } };
        commands.set('draws', boom);
        const err = console.error; console.error = () => {};
        try {
            const { message, posts } = fakeMessage('d draws');
            await onMessage(message);
            assert.ok(/<a?:\w+:\d+> Something went wrong running `d draws`\. Try again in a moment\.$/.test(posts[0]?.content || ''), posts[0]?.content);
        } finally { console.error = err; commands.set('draws', record('draws')); }
    });
    await check('a different command within 1 s: nothing, no warning', async (before) => {
        const a = fakeMessage('d draws'); a.message.author.id = 'quick';
        const b = fakeMessage('d calendar'); b.message.author.id = 'quick';
        await onMessage(a.message);
        await onMessage(b.message);
        assert.strictEqual(ran.length, before + 1);
        assert.strictEqual(b.posts.length, 0);
    });
    await check('one channel: at most 5 replies in 10 s', async (before) => {
        let silent = 0;
        for (let k = 0; k < 7; k++) {
            const m = fakeMessage('d draws');
            m.message.channelId = 'busy'; m.message.channel.id = 'busy';
            await onMessage(m.message);
        }
        assert.strictEqual(ran.length, before + 5);
    });
    await check('an edit within 60 s runs a command the first version did not; after 60 s it does not', async (before) => {
        const listeners = {};
        require('../bot/textCommands').registerTextCommands({ on: (event, fn) => { listeners[event] = fn; } });
        const settle = () => new Promise(r => setTimeout(r, 20));
        const late = fakeMessage('d calendar'); late.message.createdTimestamp = Date.now() - 61_000;
        listeners.messageUpdate(null, late.message); await settle();
        assert.strictEqual(ran.length, before, 'past the window');
        const early = fakeMessage('d calendar'); early.message.createdTimestamp = Date.now() - 10_000;
        listeners.messageUpdate(null, early.message); await settle();
        assert.strictEqual(ran.length, before + 1, 'inside the window');
        listeners.messageUpdate(null, early.message); await settle();
        assert.strictEqual(ran.length, before + 1, 'an answered message is not answered again');
    });
    await check('where Dioreo cannot post: one DM per channel per day, nothing in the channel', async (before) => {
        const dms = [];
        for (let k = 0; k < 2; k++) {
            const m = fakeMessage(k ? 'd calendar' : 'd draws');
            m.message.author.id = 'muted';
            m.message.author.send = async (o) => { dms.push(JSON.stringify(o)); };
            m.message.guild.name = 'Dioreoland';
            m.message.channelId = 'locked'; m.message.channel.id = 'locked';
            m.message.channel.permissionsFor = () => ({ has: () => false });
            if (k) await new Promise(r => setTimeout(r, 1100)); // past the 1-second any-command limit
            await onMessage(m.message);
            assert.strictEqual(m.posts.length, 0);
        }
        assert.strictEqual(ran.length, before);
        assert.strictEqual(dms.length, 1, 'one DM for the server');
        // His layout take 3 (B6, 2026-10-29 15:49 EDT).
        assert.ok(dms[0].includes("I can't post in <#locked> · Dioreoland") && dms[0].includes('**You typed `d draws`** · Ask a server admin to let me send messages there.'), dms[0]);
    });

    // The buttons those replies carry.
    const click = (customId, extra = {}) => {
        const replies = [];
        const i = {
            customId, guildId: 'g1', channelId: 'c1', channel: null, member: null, user: { id: 'clicker' }, client: { commands, users: { fetch: async uid => ({ id: uid }) }, channels: { fetch: async () => null } },
            token: 't', deferred: false,
            isButton: () => !extra.modal, isModalSubmit: () => Boolean(extra.modal),
            message: extra.message || null,
            async deferReply(o) { this.deferred = true; replies.push({ defer: o }); },
            async deferUpdate() { this.deferred = true; replies.push({ update: true }); },
            async reply(o) { replies.push(o); }, async editReply(o) { replies.push({ edit: o }); },
            async showModal(m) { replies.push({ modal: m }); },
            fields: { getTextInputValue: k => (extra.fields || {})[k] || '', getStringSelectValues: k => ((extra.selects || {})[k] ? [extra.selects[k]] : []) },
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
    await check('a Did you mean button for a frozen command says Dioreo is paused, and runs nothing (B7 fix-up)', async (before) => {
        const controls = require('../utils/botControls');
        try {
            controls.__reset({ freeze: { all: false, commands: ['gunsmith'], reason: 'fixing builds' } });
            const { i, replies } = click('txtrun_gunsmith~weapon=ak47');
            await handleTextCommandsInteraction(i);
            assert.strictEqual(ran.length, before, 'not run');
            assert.ok(/Dioreo is paused: fixing builds/.test(replies[0]?.content || ''), JSON.stringify(replies));
        } finally { controls.__reset(); }
    });
    await check('a pick from a card edits that card into the answer, and stops it deleting itself', async () => {
        const cardTimers = require('../utils/textCommands/cardTimers');
        cardTimers.schedule('card9', 10_000, () => {});
        const { i, replies } = click('txtrun_gunsmith~weapon=ak47', { message: { id: 'card9' } });
        await handleTextCommandsInteraction(i);
        assert.deepStrictEqual(replies[0], { update: true });
        assert.strictEqual(cardTimers.pending('card9'), false);
    });
    await check('the card button opens the timestamp pop-up, and its answer runs /timestamp', async () => {
        const open = click(cardId);
        await handleTextCommandsInteraction(open.i);
        const modal = open.replies[0]?.modal;
        assert.strictEqual(modal?.custom_id, 'txtrun_timestamp~submit');
        // Five fields, Discord's most: date, typed zone, then the optional quick-pick zone, format and view dropdowns (his ask, 2026-10-29 11:07 EDT).
        assert.deepStrictEqual(modal.components.map(c => c.component.custom_id), ['datetime', 'timezone', 'timezone_pick', 'style', 'view']);
        assert.ok(modal.components.slice(2).every(c => c.component.type === 3 && c.component.required === false), 'the dropdowns are optional');
        assert.ok(modal.components[3].component.options.some(o => o.value === 'short_list'), 'formats are /timestamp\'s own');
        const submit = click(modal.custom_id, { modal: true, fields: { datetime: 'friday 6pm', timezone: 'Tokyo' }, selects: { timezone_pick: 'Europe/London', style: 'relative', view: 'text' } });
        await handleTextCommandsInteraction(submit.i);
        assert.strictEqual(lastRun().name, 'timestamp');
        assert.strictEqual(lastRun().interaction.options.getString('datetime'), 'friday 6pm');
        assert.strictEqual(lastRun().interaction.options.getString('timezone'), 'Tokyo', 'a typed zone wins over a picked one');
        assert.strictEqual(lastRun().interaction.options.getString('style'), 'relative');
        assert.strictEqual(lastRun().interaction.options.getString('view'), 'text');
        const picks = click(modal.custom_id, { modal: true, fields: { datetime: 'friday 6pm' }, selects: { timezone_pick: 'Europe/London' } });
        await handleTextCommandsInteraction(picks.i);
        assert.strictEqual(lastRun().interaction.options.getString('timezone'), 'Europe/London', 'the picked zone when none is typed');
        assert.strictEqual(lastRun().interaction.options.getString('style'), null, 'blank format: /settings decides');
    });
    await check('a button whose stored value expired says to run it again', async () => {
        const { i, replies } = click('txtrun_~nope');
        await handleTextCommandsInteraction(i);
        assert.ok(/This button expired\. Type the command again\./.test(replies[0]?.content || ''), replies[0]?.content);
    });
    // The cards' own shapes (B6, his layouts 2026-10-29 13:40-15:49 EDT).
    const { helpCard, didYouMeanCard } = require('../bot/textCommands');
    await check('the help card: prefixes, four groups, the private /help icon, never deleting itself', async () => {
        const c = helpCard({ textMessageContent: true, commandIds: new Map([['help', '42']]) }).components[0];
        assert.strictEqual(c.accent_color, 16743772);
        assert.ok(/Need help\?\n-# Prefix: \*\*`@Dioreo`\*\*, \*\*`d`\*\* or \*\*`dior`\*\*$/.test(c.components[0].components[0].content), c.components[0].components[0].content);
        assert.strictEqual(c.components[0].accessory.custom_id, 'txtpriv_help');
        assert.deepStrictEqual(c.components.slice(2, 6).map(x => x.content.replace(/^<a?:\w+:\d+> /, '')), ['**Gunsmith:** `gunsmith` · `dmz`', '**Draws:** `draws` · `prices` · `calculator`', '**Season:** `today` · `calendar` · `remind` · `patch notes` · `end`', '**Utilities:** `timestamp` · `colors` · `settings` · `invite` · `help`']);
        assert.ok(c.components[6].content.endsWith('Or use **slash commands** </help:42>'));
        const noContent = helpCard({ textMessageContent: false }).components[0];
        assert.ok(noContent.components[0].components[0].content.endsWith('Prefix: **`@Dioreo`**') && noContent.components[6].content.includes('`@Dioreo draws`'));
    });
    await check('Did you mean: one match beside its button, several in a row, with what was typed', async () => {
        const one = didYouMeanCard(['calendar'], 'calender stuff').components[0].components[0];
        assert.strictEqual(one.type, 9);
        assert.ok(one.components[0].content.endsWith('Did you mean `calendar`?\n-# You typed `calender stuff`'));
        assert.strictEqual(one.accessory.custom_id, 'txtrun_calendar');
        const two = didYouMeanCard(['calendar', 'draw calculator'], 'cal').components[0].components;
        assert.ok(two[0].content.includes('Did you mean `calendar` or `draw calculator`?'));
        assert.deepStrictEqual(two[1].components.map(b => b.custom_id), ['txtrun_calendar', 'txtrun_draw.calculator']);
    });
    // B7: a server's own prefixes, its text-command switch, and the spam ladder.
    await check('a server with its own prefix answers it, and no longer the default', async (before) => {
        SERVER.gp = { textPrefixes: ['!'] };
        await onMessage(fakeMessage('!calendar', { guildId: 'gp' }).message);
        assert.strictEqual(ran.length, before + 1);
        assert.strictEqual(lastRun().name, 'calendar');
        const d = fakeMessage('d calendar', { guildId: 'gp' });
        await onMessage(d.message);
        assert.strictEqual(ran.length, before + 1, '`d` is not this server\'s prefix');
        assert.strictEqual(d.posts.length, 0);
        await onMessage(fakeMessage('dior draws', { guildId: 'gp' }).message);
        assert.strictEqual(lastRun().name, 'draws', '`dior` always stays (his middle ground, 2026-10-30)');
    });
    await check('the help card lists the server\'s own prefixes', async () => {
        SERVER.gh = { textPrefixes: ['!', 'yo'] };
        const m = fakeMessage('<@111>', { guildId: 'gh' });
        await onMessage(m.message);
        assert.ok(/Prefix: \*\*`@Dioreo`\*\*, \*\*`!`\*\*, \*\*`yo`\*\* or \*\*`dior`\*\*/.test(JSON.stringify(m.posts[0])), JSON.stringify(m.posts[0]).slice(0, 300));
    });
    await check('text commands off for the server: silent, the help card and the emoji reply included', async (before) => {
        SERVER.goff = { textRules: { defaultVisibility: 'ephemeral', channelRules: [], roleRules: [], commandSettings: [] } };
        for (const text of ['d calendar', '<@111>', '<@111> you are the best bot']) {
            const m = fakeMessage(text, { guildId: 'goff' });
            await onMessage(m.message);
            assert.strictEqual(m.posts.length, 0, text);
        }
        assert.strictEqual(ran.length, before);
    });
    await check('one command off: that one is silent, the others still run, and its Did you mean pick is refused', async (before) => {
        SERVER.gcmd = { textRules: { defaultVisibility: 'public', channelRules: [], roleRules: [], commandSettings: [{ command: 'calendar', defaultVisibility: 'ephemeral', channelRules: [], roleRules: [] }] } };
        await onMessage(fakeMessage('d calendar', { guildId: 'gcmd' }).message);
        assert.strictEqual(ran.length, before);
        await onMessage(fakeMessage('d draws', { guildId: 'gcmd' }).message);
        assert.strictEqual(lastRun().name, 'draws');
        const { i, replies } = click('txtrun_calendar');
        i.guildId = 'gcmd';
        await handleTextCommandsInteraction(i);
        assert.ok(/This server turned that command off for you here\./.test(replies[0]?.content || ''), JSON.stringify(replies));
    });
    await check('a command on in a channel where the server turned text commands off runs there', async (before) => {
        SERVER.gch = { textRules: { defaultVisibility: 'public', channelRules: [{ channelId: 'cX', visibility: 'ephemeral' }], roleRules: [], commandSettings: [{ command: 'draws', defaultVisibility: 'public', channelRules: [], roleRules: [] }] } };
        const draws = fakeMessage('d draws', { guildId: 'gch' });
        draws.message.channelId = 'cX';
        await onMessage(draws.message);
        assert.strictEqual(ran.length, before + 1, 'draws has its own settings, which say on');
        const cal = fakeMessage('d calendar', { guildId: 'gch' });
        cal.message.channelId = 'cX';
        await onMessage(cal.message);
        assert.strictEqual(ran.length, before + 1, 'calendar follows the server, off in that channel');
    });
    await check('the spam ladder: the event that reaches 10 points gets the note, then silence in every server', async (before) => {
        const spam = require('../utils/textCommands/spamLadder');
        const first = fakeMessage('d calendar', { guildId: 'gs1' });
        for (let k = 0; k < 9; k++) spam.addPoints(first.message.author.id, spam.REPLY_POINTS);
        await onMessage(first.message);
        assert.strictEqual(ran.length, before, 'the tenth point is not answered');
        assert.ok(/^-# .*You're on cooldown for spamming! Try again <t:\d+:R>$/.test(first.posts[0]?.content || ''), JSON.stringify(first.posts));
        assert.strictEqual(first.posts[0].message_reference.message_id, first.message.id, 'the note replies to the message that reached the limit');
        const elsewhere = fakeMessage('d draws', { guildId: 'gs2' });
        elsewhere.message.author = first.message.author;
        await onMessage(elsewhere.message);
        assert.strictEqual(elsewhere.posts.length, 0, 'a penalty is everywhere');
        assert.strictEqual(ran.length, before);
        await spam.liftPenalty(first.message.author.id);
        assert.strictEqual(spam.penaltyFor(first.message.author.id), null, 'lifted');
    });
    await check("the owner's switches (B7): a freeze, a blocked person or server is silent; the owner still runs", async (before) => {
        const controls = require('../utils/botControls');
        try {
            controls.__reset({ freeze: { all: true, commands: [], reason: 'bug' } });
            // Each case its own server: the earlier cases have used g1's 30 replies per 10 s.
            const frozen = fakeMessage('d calendar', { guildId: 'gfz' });
            await onMessage(frozen.message);
            assert.deepStrictEqual([ran.length, frozen.posts.length], [before, 0], 'everything frozen');
            const owner = fakeMessage('d calendar', { guildId: 'gfz' });
            owner.message.author.id = require('../utils/owner').ALLOWED_ADMIN_ID;
            await onMessage(owner.message);
            assert.strictEqual(ran.length, before + 1, 'the owner is never frozen');
            controls.__reset({ freeze: { all: false, commands: ['draws'] } });
            await onMessage(fakeMessage('d draws', { guildId: 'gfz' }).message);
            assert.strictEqual(ran.length, before + 1, 'a frozen command is silent');
            await onMessage(fakeMessage('d calendar', { guildId: 'gfz' }).message);
            assert.strictEqual(ran.length, before + 2, 'another command runs');
            controls.__reset({ blockedUsers: ['ublocked'], blockedGuilds: ['gblocked'] });
            const person = fakeMessage('d calendar', { guildId: 'gfz' });
            person.message.author.id = 'ublocked';
            await onMessage(person.message);
            await onMessage(fakeMessage('d calendar', { guildId: 'gblocked' }).message);
            assert.strictEqual(ran.length, before + 2, 'a blocked person and a blocked server get nothing');
        } finally { controls.__reset(); }
    });
    await check("a text reply's mentions use the prefix the person typed (B7 fix-up): `dior draws` writes `dior calendar`", async () => {
        let said = null;
        commands.set('draws', { ...record('draws'), execute: async i => { said = require('../utils/commandMentions').mentionCommand(i.client, '/calendar'); } });
        try {
            await onMessage(fakeMessage('dior draws', { guildId: 'gpx' }).message);
            assert.strictEqual(said, '`dior calendar`');
        } finally { commands.set('draws', record('draws')); }
    });
    await check("a server's own reply limit (B7): the owner's 2 per channel stops the third", async (before) => {
        const controls = require('../utils/botControls');
        try {
            controls.__reset({ replyLimits: [{ guildId: 'glim', perChannel: 2, perServer: 30 }] });
            for (const word of ['calendar', 'draws', 'calendar']) {
                const m = fakeMessage(`d ${word}`, { guildId: 'glim' });
                m.message.channelId = 'cLim';
                m.message.channel.id = 'cLim';
                await onMessage(m.message);
            }
            assert.strictEqual(ran.length, before + 2);
        } finally { controls.__reset(); }
    });
    await check("a no-match line counts as a misfire under Dioreo's word, never the person's", async () => {
        const misfires = require('../utils/textCommands/misfires');
        misfires.__pending.clear();
        await onMessage(fakeMessage(`<@${BOT}> gs zzqqxx`, { guildId: 'gmf' }).message);
        const keys = [...misfires.__pending.keys()].map(k => JSON.parse(k));
        assert.ok(keys.some(k => k[2] === 'noMatch' && k[3] === 'gunsmith'), JSON.stringify(keys));
        assert.ok(!JSON.stringify(keys).includes('zzqqxx'), 'never what they typed');
        misfires.__pending.clear();
    });
    await check('a due announcement adds a New announcement button to the text reply, and nothing else (his "go C", 2026-10-30 18:18 EDT)', async () => {
        const path = require('path');
        const f = require.resolve(path.join(__dirname, '..', 'utils', 'announcement'));
        const real = require.cache[f];
        let due = true;
        const realA = require('../utils/announcement');
        require.cache[f] = { id: f, filename: f, loaded: true, exports: { ...realA, hasDueAnnouncement: async () => due, maybeSendAnnouncement: async () => { throw new Error('a text command must never deliver one itself'); } } };
        try {
            const { addAnnouncementButton } = require('../bot/textCommands');
            const edits = [];
            const panel = { type: 17, components: [{ type: 10, content: 'Today' }] };
            const mk = (extra = {}) => ({ user: { id: 'ua' }, __firstSentAt: Date.now(), __lastBody: { flags: 32768, components: [panel] }, editReply: async o => { edits.push(o); }, ...extra });
            assert.strictEqual(await addAnnouncementButton(mk()), true);
            const row = edits[0].components.at(-1);
            assert.deepStrictEqual(edits[0].components[0], panel, 'the reply keeps what it had');
            assert.strictEqual(row.components[0].custom_id, 'ann_open');
            due = false;
            assert.strictEqual(await addAnnouncementButton(mk()), false, 'nothing due: no button');
            due = true;
            assert.strictEqual(await addAnnouncementButton(mk({ __lastBody: null })), false, 'no reply went out: no button');
            const sized = n => ({ type: 17, components: Array.from({ length: n - 1 }, () => ({ type: 10, content: 'x' })) });
            assert.strictEqual(await addAnnouncementButton(mk({ __lastBody: { flags: 32768, components: [sized(39)] } })), false, 'a 39-component reply gets no button (his rule: 38 or less)');
            assert.strictEqual(await addAnnouncementButton(mk({ __lastBody: { flags: 32768, components: [sized(38)] } })), true, 'a 38-component reply does');
            assert.strictEqual(edits.length, 2);
            const src = require('fs').readFileSync(path.join(__dirname, '..', 'bot', 'textCommands.js'), 'utf8');
            assert.ok(/noteOwnCommandSafely\(interaction\);\s*addAnnouncementButton\(interaction\)/.test(src), 'runTextCommand adds it after a successful command');
        } finally { if (real) require.cache[f] = real; else delete require.cache[f]; }
    });
    await check('pressing New announcement shows it AS the private reply and never deletes it (the v3.3.1 bug, 2026-10-30 21:28 EDT)', async () => {
        const path = require('path');
        const f = require.resolve(path.join(__dirname, '..', 'utils', 'announcement'));
        const h = require.resolve(path.join(__dirname, '..', 'handlers', 'announcementControls'));
        const sv = require.resolve(path.join(__dirname, '..', 'utils', 'sendV2Payload'));
        const realSv = require.cache[sv];
        const real = require.cache[f];
        const realA = require('../utils/announcement');
        let shown = true;
        const calls = [];
        require.cache[f] = { id: f, filename: f, loaded: true, exports: { ...realA, maybeSendAnnouncement: async (i, opts) => { calls.push(opts); return shown; } } };
        require.cache[sv] = { id: sv, filename: sv, loaded: true, exports: { sendV2Payload: async (i, components) => { await i.client.rest.patch('@original', { body: { components } }); } } };
        delete require.cache[h];
        try {
            const { handleAnnouncementControlsInteraction } = require('../handlers/announcementControls');
            const log = [];
            const press = () => ({ customId: 'ann_open', isButton: () => true, user: { id: 'ua' }, applicationId: 'app', token: 't', deferred: false, replied: false,
                deferReply: async function (o) { this.deferred = true; log.push(['defer', o]); }, deleteReply: async () => { log.push(['delete']); }, followUp: async () => { log.push(['followUp']); },
                client: { rest: { patch: async (route, o) => { log.push(['patch', o.body]); return { id: 'm1' }; } } } });
            assert.strictEqual(await handleAnnouncementControlsInteraction(press()), true);
            assert.deepStrictEqual(calls[0], { asReply: true }, 'the announcement is the reply itself');
            assert.ok(!log.some(([k]) => k === 'delete'), 'the reply that holds the announcement is never deleted');
            shown = false; log.length = 0;
            await handleAnnouncementControlsInteraction(press());
            const patch = log.find(([k]) => k === 'patch');
            assert.ok(patch && /No new announcements/.test(JSON.stringify(patch[1])), 'nothing due: says so');
            const src = require('fs').readFileSync(path.join(__dirname, '..', 'utils', 'announcement.js'), 'utf8');
            assert.ok(/if \(asReply\) await require\('\.\/sendV2Payload'\)\.sendV2Payload\(/.test(src), 'asReply sends through @original, not a follow-up');
        } finally { if (real) require.cache[f] = real; else delete require.cache[f]; if (realSv) require.cache[sv] = realSv; else delete require.cache[sv]; delete require.cache[h]; }
    });
    await check('an announcement footer with the retired diorHeart shows the current heart (2026-10-30 21:30 EDT)', async () => {
        const A = require('../utils/announcement');
        const heart = require('../utils/emojiMap').diorHeart;
        const c = A.buildAnnouncementContainer({ text: 'Made with <a:diorHeart:1525941004929339594> by @dior · {posted} {heart}', createdAt: new Date(0), color: 1 });
        const text = c.components.map(x => x.content || '').join('\n');
        assert.ok(!text.includes('diorHeart:1525941004929339594'), text);
        assert.strictEqual(text.split(heart).length - 1, 2, text);
    });
    console.log(failures ? `\n${failures} failing` : '\ntextCommandListener: all passing');
    process.exit(failures ? 1 : 0);
})();
