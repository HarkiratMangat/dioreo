// scripts/textCommandPrefix.test.js -- the `prefix` / `pre` text command (Harkirat, 2026-10-30 16:02 EDT): the parser's rules for it, the five words that can never be a prefix, the two reply formats he wrote, and the admin path end to end through bot/textCommands.js onMessage with the real prefix code and a stand-in for the stored settings.
const assert = require('assert');
const path = require('path');

const stub = (rel, exports) => {
    const file = require.resolve(path.join('..', rel));
    require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
stub('utils/textCommands/permissions', { textCommandAllowed: async () => true, invalidateGuildOverrides() {} });
stub('handlers/router', { buildInteractionContext: () => ({}) });
stub('models/TextPenalty', { updateOne: async () => ({}), deleteOne: async () => ({}), find: () => ({ lean: async () => [] }) });
stub('utils/eventStore', { recordInteractionEvent() {} });
stub('utils/userStats', { noteOwnCommandSafely() {} });
// The stored settings per guild, behind the real function names utils/guildPolicy.js exports. isServerAdmin is read off the fake interaction, since the real one needs a Discord permission set.
const SERVER = {};
const saves = [];
stub('utils/guildPolicy', {
    getGuildSettings: async guildId => SERVER[guildId] || null,
    updateGuildSettings: async (guildId, actorId, mutate) => {
        const doc = SERVER[guildId] || { guildId };
        mutate(doc);
        SERVER[guildId] = doc;
        saves.push({ guildId, actorId, textPrefixes: doc.textPrefixes });
        return doc;
    },
    isServerAdmin: interaction => Boolean(interaction.memberPermissions?.has?.('admin')),
    textCommandOnHere: async () => true,
});
process.env.TEXT_PREFIXES = 'd,dior';
process.env.NODE_ENV = 'test';

const { parseTextCommand } = require('../utils/textCommands/parse');
const { TEXT_COMMANDS, aliasClashes } = require('../utils/textCommands/commands');
const { parsePrefixes, REMOVE_WORDS } = require('../utils/textCommands/server');
const { readAction } = require('../utils/textCommands/prefixCommand');
const emojis = require('../utils/emojiMap');
const { onMessage } = require('../bot/textCommands');

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ok   ${name}`); } catch (error) { failures++; console.log(`  FAIL ${name}\n       ${error.message}`); }
}

const BOT = '111';
const parse = (text, extra = {}) => parseTextCommand(text, { botId: BOT, prefixes: ['d', 'dior'], commands: TEXT_COMMANDS, ...extra });

let n = 0;
// admin: the author holds Manage Server in the channel. Returns the posted message bodies.
function fakeMessage(content, { admin = false, guildId = 'g1', guildName = 'Dioreoland' } = {}) {
    const id = ++n;
    const posts = [];
    const client = {
        user: { id: BOT }, application: { id: BOT }, textMessageContent: true, commands: new Map(),
        rest: { post: async (route, opts) => { posts.push(opts.body); return { id: `r${id}` }; }, patch: async () => ({}), get: async () => ({}), delete: async () => ({}) },
    };
    const member = { id: `u${id}`, roles: { cache: new Map() } };
    // The bot can always post; the author's permission set answers `admin` (Manage Server) and nothing else.
    const channel = { id: `c${id}`, permissionsFor: who => ({ has: bit => (who === member ? bit === 'admin' && admin : true) }), isThread: () => false, sendTyping: async () => {} };
    const message = {
        id: `m${id}`, guildId, channelId: channel.id, channel, client, content,
        author: { id: `u${id}`, bot: false }, member, createdTimestamp: Date.now(),
        guild: { name: guildName, ownerId: 'someone-else', members: { me: {} }, roles: { botRoleFor: () => null } },
        reference: null, fetchReference: async () => null,
    };
    return { message, posts };
}
const cmd = emojis.command;
const NOT_SET = `${cmd} Dioreo's prefixes: **<@${BOT}> · \`dior\` · \`d\`**\n-# Dioreoland's server prefix: *Not set*`;
const SET = p => `${cmd} Dioreoland's server prefix: **\`${p}\`**\n-# **<@${BOT}> · \`dior\`** also work!`;

(async () => {
    await check('the command and its aliases: prefix and pre, no clash with any other word', () => {
        const c = TEXT_COMMANDS.find(t => t.name === 'prefix');
        assert.ok(c.textOnly && c.rawArgs);
        assert.deepStrictEqual(c.words, ['prefix', 'pre', 'prefixes']);
        assert.deepStrictEqual(aliasClashes(), []);
    });
    await check('the parser: bare and with one word run; a typo, several words, or a short typo after d are chat', () => {
        assert.strictEqual(parse('d prefix').kind, 'run');
        assert.strictEqual(parse('d pre').command, 'prefix');
        assert.strictEqual(parse('D PREFIXES').command, 'prefix', 'plural and any case');
        const set = parse('dior prefix d!');
        assert.strictEqual(set.kind, 'run');
        assert.strictEqual(set.args, 'd!');
        assert.strictEqual(parse('dior prefix remove').args, 'remove');
        assert.strictEqual(parse('<@111> pre reset').args, 'reset');
        assert.strictEqual(parse('<@111> prefix a b').args, 'a b', '@Dioreo always runs');
        assert.strictEqual(parse('d prefix a b').kind, null, 'two words after d is chat');
        assert.strictEqual(parse('d pre owned lol').kind, null);
        assert.strictEqual(parse('d per').kind, null, 'a typo of a three-letter word is not an answer');
        assert.strictEqual(parse('d prefxi').kind, 'run', 'a longer word forgives a swapped pair');
        assert.strictEqual(parse('d prefxi x').kind, null, 'a typo with any argument is chat');
        assert.strictEqual(parse('dprefix').command, 'prefix', 'a glued exact word works, like `dtoday`');
        assert.strictEqual(parse('dprefxi').kind, null, 'a glued typo does not');
    });
    await check('the five remove words, in any case, can never be a server prefix, with a warning', () => {
        assert.deepStrictEqual(REMOVE_WORDS, ['remove', 'reset', 'erase', 'default', 'delete']);
        for (const w of REMOVE_WORDS) {
            for (const typed of [w, w.toUpperCase(), `d!, ${w}`]) {
                const read = parsePrefixes(typed);
                assert.ok(read.error && read.error.includes(`\`${w}\``), `${typed}: ${JSON.stringify(read)}`);
            }
        }
        assert.ok(!parsePrefixes('d!').error);
        assert.ok(!parsePrefixes('resets').error, 'only the exact words');
    });
    await check('what an admin\'s word asks for', () => {
        for (const w of REMOVE_WORDS) assert.deepStrictEqual(readAction(w.toUpperCase()), { reset: true });
        assert.deepStrictEqual(readAction('D!'), { prefixes: ['d!'] });
        assert.deepStrictEqual(readAction('d'), { reset: true }, 'the default word is the default');
        assert.ok(readAction('a/b').error);
        assert.ok(readAction('toolongprefix').error);
    });
    await check('anyone: no prefix set shows every prefix and "Not set", his format exactly', async () => {
        const m = fakeMessage('d prefix');
        await onMessage(m.message);
        assert.strictEqual(m.posts.length, 1);
        assert.strictEqual(m.posts[0].content, NOT_SET);
        assert.deepStrictEqual(m.posts[0].allowed_mentions.parse, [], 'the bot mention in it pings no one');
    });
    await check('anyone: a server prefix set shows it and what also works, his format exactly', async () => {
        SERVER.gset = { textPrefixes: ['d!'] };
        const m = fakeMessage('dior pre', { guildId: 'gset' });
        await onMessage(m.message);
        assert.strictEqual(m.posts[0].content, SET('d!'));
    });
    await check('a non-admin\'s argument changes nothing and gets the same reply, in silence about the attempt', async () => {
        SERVER.gna = { textPrefixes: ['d!'] };
        const before = saves.length;
        for (const text of ['dior prefix x', 'dior prefix remove']) {
            const m = fakeMessage(text, { guildId: 'gna', admin: false });
            await onMessage(m.message);
            assert.strictEqual(m.posts[0].content, SET('d!'), text);
        }
        assert.strictEqual(saves.length, before, 'nothing was saved');
        assert.deepStrictEqual(SERVER.gna.textPrefixes, ['d!']);
    });
    await check('an admin sets it, then resets it with each alias', async () => {
        const set = fakeMessage('dior prefix Yo', { guildId: 'gadm', admin: true });
        await onMessage(set.message);
        assert.deepStrictEqual(SERVER.gadm.textPrefixes, ['yo']);
        assert.strictEqual(saves[saves.length - 1].actorId, set.message.author.id);
        assert.ok(set.posts[0].content.endsWith(SET('yo')), set.posts[0].content);
        for (const word of REMOVE_WORDS) {
            SERVER.gadm.textPrefixes = ['yo'];
            const m = fakeMessage(`dior pre ${word}`, { guildId: 'gadm', admin: true });
            await onMessage(m.message);
            assert.strictEqual(SERVER.gadm.textPrefixes, undefined, word);
            assert.ok(m.posts[0].content.endsWith(NOT_SET), m.posts[0].content);
        }
    });
    await check('an admin\'s bad word is refused with the warning and saves nothing', async () => {
        SERVER.gbad = { textPrefixes: ['d!'] };
        const before = saves.length;
        for (const word of ['a/b', 'waytoolongg']) {
            const m = fakeMessage(`dior prefix ${word}`, { guildId: 'gbad', admin: true });
            await onMessage(m.message);
            assert.ok(/Nothing was saved/.test(m.posts[0].content), m.posts[0].content);
        }
        assert.strictEqual(saves.length, before);
    });
    await check('the new prefix works at once, and `d` stops', async () => {
        SERVER.gnew = { textPrefixes: ['!'] };
        const seen = fakeMessage('! prefix', { guildId: 'gnew' });
        await onMessage(seen.message);
        assert.strictEqual(seen.posts[0].content, SET('!'));
        const old = fakeMessage('d prefix', { guildId: 'gnew' });
        await onMessage(old.message);
        assert.strictEqual(old.posts.length, 0);
    });
    console.log(failures ? `\n${failures} failed` : '\ntextCommandPrefix: all passing');
    process.exit(failures ? 1 : 0);
})();
