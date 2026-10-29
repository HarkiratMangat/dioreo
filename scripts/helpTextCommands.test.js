// scripts/helpTextCommands.test.js: /help and slash mentions for text commands (text commands, B3, 2026-10-29). The /help landing carries one Text commands block (every form where the app has Message Content, only `@Dioreo` where it does not) and stays within Discord's 40 components at every permission level; mentionCommand() writes a command's text form inside a text command, where a slash mention may be exactly what the server hides, and the slash mention everywhere else. The real commands/help.js renders; only the store reads it would make are stubbed through require.cache.
const assert = require('assert');
const path = require('path');
const Module = require('module');

function stub(rel, exports) {
    const file = require.resolve(path.join(__dirname, '..', rel));
    const m = new Module(file, null);
    m.filename = file; m.loaded = true; m.exports = exports;
    require.cache[file] = m;
}
stub('utils/adminAccess.js', { isAdmin: async () => false, hasCommandAccess: async () => false, isOwner: () => false });
stub('utils/guildPolicy.js', { isServerAdmin: () => false });

const help = require('../commands/help');
const { mentionCommand, linkCommandMentions, recordCommandPaths } = require('../utils/commandMentions');
const { runWithContext } = require('../utils/requestContext');

const ids = new Map([['draws', '111'], ['today', '222'], ['gunsmith', '333'], ['patch', '444'], ['admin', '555'], ['help', '666'], ['draw', '777']]);
const client = (textMessageContent) => ({ commandIds: ids, textMessageContent, user: { id: '1529636846248919263' }, application: { id: '1529636846248919263' } });
const ALL = { serverAdmin: true, botAdmin: true, manage: true, bot: true, botAccess: true, autobuild: true };

// Discord counts every component, nested ones included: the container, a section and its thumbnail, a row and each thing in it.
function countComponents(list) {
    let n = 0;
    for (const c of list) {
        if (!c || typeof c.type !== 'number') continue;
        n++;
        if (Array.isArray(c.components)) n += countComponents(c.components);
        if (c.accessory) n += countComponents([c.accessory]);
    }
    return n;
}
const texts = (node) => (node.content ? [node.content] : []).concat(...(node.components || []).map(texts));

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message}`); }
}

(async () => {
    let landingCount = 0;
    await check('the landing carries the Text commands block with every form where Message Content is granted', async () => {
        const all = texts(await help.buildContainer(null, 0x5865F2, {}, client(true))).join('\n');
        assert.ok(all.includes('**TEXT COMMANDS**'), 'no Text commands heading');
        for (const f of ['`@Dioreo today`', '`d today`', '`dior today`', '`/today`']) assert.ok(all.includes(f), `missing ${f}`);
        assert.ok(/hides slash commands/.test(all), 'no line on why');
    });
    await check('without Message Content it offers only @Dioreo, the one form that works', async () => {
        const block = help.textCommandsBlock(client(false));
        assert.ok(block.includes('`@Dioreo today`'));
        for (const f of ['`d today`', '`dior today`', '`/today`']) assert.ok(!block.includes(f), `${f} shown without Message Content`);
    });
    await check('the landing and its footer row stay within 40 components at every permission level', async () => {
        for (const perms of [{}, { serverAdmin: true }, ALL]) {
            const n = countComponents([await help.buildContainer(null, 0x5865F2, perms, client(true)), help.helpFooterRow()]);
            assert.ok(n <= 40, `${n} components for ${JSON.stringify(perms)}`);
            landingCount = Math.max(landingCount, n);
        }
    });
    await check('outside a text command a slash mention stays a slash mention', async () => {
        assert.strictEqual(mentionCommand(client(true), '/draws'), '</draws:111>');
        assert.strictEqual(mentionCommand(client(true), '/gunsmith mp'), '</gunsmith mp:333>');
        await runWithContext({ handler: 'help' }, async () => assert.strictEqual(mentionCommand(client(true), '/draws'), '</draws:111>'));
    });
    await check('inside a text command a command with a text form is written as `d <name>`', async () => {
        await runWithContext({ handler: 'textCommands' }, async () => {
            assert.strictEqual(mentionCommand(client(true), '/draws'), '`d draws`');
            assert.strictEqual(mentionCommand(client(true), 'today'), '`d today`');
            assert.strictEqual(mentionCommand(client(true), '/gunsmith mp'), '`d gunsmith`');
            assert.strictEqual(mentionCommand(client(true), '/gunsmith dmz'), '`d dmz`');
            assert.strictEqual(mentionCommand(client(true), '/patch notes'), '`d patch notes`');
            assert.strictEqual(mentionCommand(client(true), '/draw prices'), '`d draw prices`');
            assert.strictEqual(mentionCommand(null, 'settings'), '`d settings`');
        });
    });
    await check('without Message Content the text form is `@Dioreo <name>`', async () => {
        await runWithContext({ handler: 'textCommands' }, async () => assert.strictEqual(mentionCommand(client(false), '/draws'), '`@Dioreo draws`'));
    });
    await check('a slash-only command keeps its mention inside a text command', async () => {
        await runWithContext({ handler: 'textCommands' }, async () => {
            assert.strictEqual(mentionCommand(client(true), '/admin'), '</admin:555>');
            assert.strictEqual(mentionCommand(client(true), '/bot analytics'), '`/bot analytics`');
        });
    });
    await check('free text linked inside a text command takes the text form, a stored mention included', async () => {
        recordCommandPaths(['draws', 'gunsmith mp']);
        await runWithContext({ handler: 'textCommands' }, async () => {
            assert.strictEqual(linkCommandMentions('Open /draws now', client(true)), 'Open `d draws` now');
            assert.strictEqual(linkCommandMentions('</gunsmith mp:1561919451975123035>', client(true)), '`d gunsmith`');
        });
        assert.strictEqual(linkCommandMentions('Open /draws now', client(true)), 'Open </draws:111> now');
    });
    await check('the /help landing rendered from a text command lists text forms, not mentions', async () => {
        await runWithContext({ handler: 'textCommands' }, async () => {
            const all = texts(await help.buildContainer(null, 0x5865F2, {}, client(true))).join('\n');
            assert.ok(all.includes('`d draws`') && all.includes('`d gunsmith`'), 'directory still shows slash mentions');
            assert.ok(!all.includes('</draws:111>'));
        });
    });
    if (failed) { console.log(`\n${failed} check(s) failed.`); process.exit(1); }
    console.log(`\nAll /help text-command checks passed. Landing: ${landingCount} of 40 components.`);
})();
