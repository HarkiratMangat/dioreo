// Dioreo Admin, the second application (2026-10-19 13:51 EDT): which app gets each command, the token rule that keeps today's behaviour when the admin app is off, each app answering with its OWN emoji ids, and command mentions that resolve across both apps. See bot/clients.js.
process.env.NODE_ENV = 'development';   // so the devOnly /embedtest loads, as on the dev bot
const assert = require('assert');
const { Collection } = require('discord.js');
const { adminTokenFrom } = require('../bot/clients');
const { loadCommandModules, splitCommands, ADMIN_APP_COMMAND_NAMES } = require('../bot/registry');
const { runWithContext } = require('../utils/requestContext');
const { mentionCommand, recordCommandIds } = require('../utils/commandMentions');
const emojis = require('../utils/emojiMap');

const results = [];
async function test(name, fn) {
    try { await fn(); results.push(`  PASS  ${name}`); }
    catch (err) { results.push(`  FAIL  ${name}\n        ${err.message}`); process.exitCode = 1; }
}
const nameOf = c => (typeof c.toJSON === 'function' ? c.toJSON().name : c.name);

(async () => {
    await test('admin app is OFF with no token, a blank one, or one equal to BOT_TOKEN', () => {
        assert.strictEqual(adminTokenFrom({ BOT_TOKEN: 'a' }), null);
        assert.strictEqual(adminTokenFrom({ BOT_TOKEN: 'a', ADMIN_BOT_TOKEN: '   ' }), null);
        assert.strictEqual(adminTokenFrom({ BOT_TOKEN: 'a', ADMIN_BOT_TOKEN: 'a' }), null);
        assert.strictEqual(adminTokenFrom({ BOT_TOKEN: 'a', ADMIN_BOT_TOKEN: ' b ' }), 'b');
    });

    await test('split: admin names, devOnly and adminApp go to the admin app; /admin stays public', () => {
        const cmds = ['draw', 'admin', 'manage', 'embedtest', 'Add to Draws', 'flagged'].map(name => ({ name }));
        const mods = new Map([['embedtest', { devOnly: true }], ['flagged', { adminApp: true }]]);
        const { publicCommands, adminCommands } = splitCommands(cmds, mods, { adminApp: true });
        assert.deepStrictEqual(publicCommands.map(nameOf), ['draw', 'admin']);
        assert.deepStrictEqual(adminCommands.map(nameOf), ['manage', 'embedtest', 'Add to Draws', 'flagged']);
    });

    await test('MUST NOT: with the admin app off, every command stays on the public app', () => {
        const cmds = ['draw', 'manage', 'bot'].map(name => ({ name }));
        const { publicCommands, adminCommands } = splitCommands(cmds, new Map(), { adminApp: false });
        assert.deepStrictEqual(publicCommands.map(nameOf), ['draw', 'manage', 'bot']);
        assert.strictEqual(adminCommands.length, 0);
    });

    await test('MUST: the real commands split with none of the seven left on the public app', () => {
        const client = { commands: new Collection() };
        const commands = loadCommandModules(client);
        const { publicCommands, adminCommands } = splitCommands(commands, client.commands, { adminApp: true });
        const pub = publicCommands.map(nameOf);
        const adm = adminCommands.map(nameOf).sort();
        for (const name of ADMIN_APP_COMMAND_NAMES) assert.ok(!pub.includes(name), `${name} is still on the public app`);
        assert.ok(pub.includes('admin'), '/admin left the public app');
        assert.deepStrictEqual(adm, [...ADMIN_APP_COMMAND_NAMES, 'embedtest'].sort());
        assert.strictEqual(pub.length + adm.length, commands.length);
    });

    await test('MUST: each app answers with its OWN emoji ids, across awaits and timers', async () => {
        const fake = (appId, id) => ({ application: { id: appId }, rest: { get: async () => [{ name: '7Mythic_CODM', id, animated: false }] } });
        await emojis.refreshEmojiIds(fake('public-app', '111'));
        await emojis.refreshEmojiIds(fake('admin-app', '222'), { secondary: true });
        assert.strictEqual(emojis.mythic, '<:7Mythic_CODM:111>', 'outside an interaction the public map answers');
        await runWithContext({ appId: 'admin-app' }, async () => {
            assert.strictEqual(emojis.mythic, '<:7Mythic_CODM:222>');
            await new Promise(r => setTimeout(r, 5));
            assert.strictEqual(emojis.mythic, '<:7Mythic_CODM:222>', 'lost after an await');
            const inTimer = await new Promise(r => setTimeout(() => r(emojis.mythic), 5));
            assert.strictEqual(inTimer, '<:7Mythic_CODM:222>', 'lost inside a timer (passiveExpiry)');
            assert.strictEqual(emojis.repoint('<:7Mythic_CODM:1>'), '<:7Mythic_CODM:222>');
        });
        await runWithContext({ appId: 'public-app' }, async () => assert.strictEqual(emojis.mythic, '<:7Mythic_CODM:111>'));
        assert.strictEqual(emojis.repoint('<:7Mythic_CODM:1>'), '<:7Mythic_CODM:111>');
    });

    await test('a mention resolves a command that lives on the other app', () => {
        recordCommandIds(new Map([['bot', '999']]));
        assert.strictEqual(mentionCommand({ commandIds: new Map([['help', '1']]) }, '/bot analytics'), '</bot analytics:999>');
        assert.strictEqual(mentionCommand({ commandIds: new Map([['help', '1']]) }, '/help'), '</help:1>');
        assert.strictEqual(mentionCommand({}, '/nothing'), '`/nothing`');
    });

    console.log('dioreoAdmin.test.js\n' + results.join('\n'));
    process.exit(process.exitCode || 0);
})();
