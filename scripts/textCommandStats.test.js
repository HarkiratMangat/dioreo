// scripts/textCommandStats.test.js -- a text command counts as the person's own command, exactly as a slash command does in handlers/router.js: "Dioreo User Since" and Your Stats are recorded after the command has run, and not when it threw (Harkirat, 2026-10-28 22:19 EDT: text commands should count). Drives bot/textCommands.js's onMessage with a fake message; every dependency that would reach Discord or the database is stubbed through the require cache.
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

const userStats = require('../utils/userStats');
const noted = [];
userStats.noteOwnCommandSafely = (interaction) => { noted.push(interaction); };
const { onMessage } = require('../bot/textCommands');

const BOT = '111';
function fakeMessage(authorId, content, execute) {
    const commands = new Map([['today', { execute }], ['patch', { execute }]]);
    const client = {
        user: { id: BOT }, application: { id: BOT }, textMessageContent: false, commands,
        rest: { post: async () => ({ id: 'r1' }), patch: async () => ({}), get: async () => ({}), delete: async () => ({}) },
    };
    const channel = { id: `c${authorId}`, permissionsFor: () => ({ has: () => true }), isThread: () => false, sendTyping: async () => {} };
    return {
        id: `m${authorId}`, guildId: 'g1', channelId: channel.id, channel, client, content,
        author: { id: authorId, bot: false }, member: null, createdTimestamp: Date.now(),
        guild: { members: { me: {} }, roles: { botRoleFor: () => null } },
    };
}

let failures = 0;
async function check(name, fn) { try { await fn(); console.log(`  ok   ${name}`); } catch (e) { failures++; console.error(`  FAIL ${name}\n       ${e.message}`); } }

(async () => {
    await check('a text command that ran is recorded as the person\'s own command', async () => {
        noted.length = 0;
        await onMessage(fakeMessage('u1', `<@${BOT}> today`, async () => {}));
        assert.strictEqual(noted.length, 1);
        assert.strictEqual(noted[0].user.id, 'u1');
        assert.strictEqual(userStats.commandKeyOf(noted[0]), 'today');
    });
    await check('a subcommand is counted under its full name, as from Discord', async () => {
        noted.length = 0;
        await onMessage(fakeMessage('u2', `<@${BOT}> patch notes`, async () => {}));
        assert.strictEqual(noted.length, 1);
        assert.strictEqual(userStats.commandKeyOf(noted[0]), 'patch notes');
    });
    await check('a text command that threw is not recorded, as the slash route does', async () => {
        noted.length = 0;
        await onMessage(fakeMessage('u3', `<@${BOT}> today`, async () => { throw new Error('boom'); }));
        assert.strictEqual(noted.length, 0);
    });
    await check('a message that is not for Dioreo records nothing', async () => {
        noted.length = 0;
        await onMessage(fakeMessage('u4', 'today is cold', async () => {}));
        assert.strictEqual(noted.length, 0);
    });
    console.log(failures ? `\n${failures} failing` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
