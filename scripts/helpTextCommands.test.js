// scripts/helpTextCommands.test.js: /help and slash mentions for text commands (text commands, B3, 2026-10-29). The /help landing carries one Text commands block (every form where the app has Message Content, only `@Dioreo` where it does not) and stays within Discord's 40 components at every permission level; mentionCommand() writes a command's text form inside a text command, where a slash mention may be exactly what the server hides, and the slash mention everywhere else. Since B5 (2026-10-29 00:15 EDT) every detail page also writes each command's typed form beside its slash Usage and Examples, built from utils/textCommands/commands.js: every one of them must be a message the real parser runs as that command with those values, a command with no text form shows none, and every page stays within 40 components. The real commands/help.js renders; only the store reads it would make are stubbed through require.cache.
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
const { parseTextCommand } = require('../utils/textCommands/parse');
const { TEXT_COMMANDS, LATEST } = require('../utils/textCommands/commands');

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
    await check('outside a text command the landing tip still names /help cmd:', async () => {
        const all = texts(await help.buildContainer(null, 0x5865F2, {}, client(true))).join('\n');
        assert.ok(all.includes('Tip: **/help** `cmd:` opens one command'));
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
            assert.ok(all.includes('Tip: `d help <command>` opens one command'), 'the tip still names /help cmd:');
        });
    });
    // ---- B5: the detail pages' typed forms ----
    const page = async (key, perms = ALL, c = client(true)) => texts(await help.buildContainer(key, 0x5865F2, perms, c)).join('\n');
    const tcFor = name => TEXT_COMMANDS.find(c => `/${c.slash}${c.sub ? ` ${c.sub}` : ''}` === name);
    const run = text => parseTextCommand(text, { botId: '1', prefixes: ['d'], commands: TEXT_COMMANDS });
    await check('the draws, seasonal and gunsmith pages write each command\'s typed form beside its Usage and Examples', async () => {
        const want = {
            draws: ['Or type `d draws [new|returning]`', 'Or type `d draw calculator [start|saved|help]`', 'Or type `d draw prices [10cp|20cp|30cp] [type]`', '`d draws returning`', '`d draw prices 30cp`', '`d draw prices mythic weapon`', '`d draw calculator saved`'],
            seasonal: ['Or type `d calendar [draws|events|playlists] [past|live|upcoming]`', 'Or type `d today`', 'Or type `d patch notes [new|season]`', '`d calendar events upcoming`', '`d patch notes season 6`'],
            gunsmith: ['Or type `d gunsmith [weapon]`', 'Or type `d dmz [weapon]`', '`d gunsmith ak117`', '`d dmz fennec`'],
            utilities: ['Or type `d timestamp <datetime> [tz:timezone]`, or reply to a message with `d timestamp`', 'Or type `d colors [@someone]`, or reply to someone with `d colors`'],
            preferences: ['Or type `d settings`'],
        };
        for (const [key, lines] of Object.entries(want)) {
            const all = await page(key, {});
            for (const l of lines) assert.ok(all.includes(l), `${key}: missing ${l}`);
        }
        // A long value list shows its key, and the key is one the parser takes.
        assert.strictEqual(run('d draw prices type:mythic').values.filter, 'mythicWeapon,mythicCharacter');
        // A twin sits on its slash example's own line.
        assert.ok((await page('draws')).includes('-# 🔸 **/draws** page:`Returning Draws` · `d draws returning`'));
    });
    await check('a command with no text form keeps slash only: /admin and every Bot Admin command', async () => {
        const prefs = await page('preferences', { serverAdmin: true });
        const adminPart = prefs.slice(prefs.indexOf('</admin:555>'));
        assert.ok(adminPart.length > 100 && !adminPart.includes('Or type'), '/admin got a typed line');
        assert.ok(!adminPart.includes('· `d '), 'an /admin example got a typed twin');
        const botAdmin = await page('botadmin');
        assert.ok(botAdmin.includes('/manage') && !botAdmin.includes('Or type') && !botAdmin.includes('`d '), 'a Bot Admin command got a typed form');
        assert.strictEqual(help.textUsage(client(true), '/admin'), null);
        assert.strictEqual(help.textExample(client(true), '/bot analytics', {}), null);
    });
    let twins = 0;
    await check('every typed example is a message the parser runs as that command, with that example\'s values', async () => {
        for (const [key, list] of Object.entries(help.HELP_EXAMPLES)) for (const [, name, values] of list) {
            const twin = help.textExample(client(true), name, values);
            if (!twin) continue;
            twins++;
            const v = run(twin);
            const tc = tcFor(name);
            assert.strictEqual(v.kind, 'run', `${key}: "${twin}" does not run (${v.kind})`);
            assert.strictEqual(v.command, tc.name, `${key}: "${twin}" runs ${v.command}, not ${tc.name}`);
            for (const [opt, val] of Object.entries(values)) {
                const o = tc.options.find(x => x.name === opt);
                if (o.rest && !(o.values || []).some(x => [].concat(x.value).join(',') === [].concat(val).join(','))) {
                    const wanted = o.rest === 'datetime' ? val : (o.restText ? o.restText(val.toLowerCase()) : val.toLowerCase());
                    const got = o.rest === 'datetime' ? v.values[opt] : (v.autocomplete.find(a => a.option === opt) || {}).text;
                    assert.strictEqual(got, wanted, `${key}: "${twin}" reads ${opt} as ${got}`);
                } else assert.strictEqual(v.values[opt], [].concat(val).join(','), `${key}: "${twin}" reads ${opt} as ${v.values[opt]}`);
            }
        }
        assert.ok(twins >= 7, `only ${twins} typed examples`);
    });
    await check('every value word a page\'s typed line offers is one the parser runs as that value', async () => {
        let pages = '';
        for (const cat of help.CATEGORY_DEFS) pages += await page(cat.key);
        for (const cat of help.CATEGORY_DEFS) for (const c of cat.detailCommands || cat.staticCommands) {
            const tc = tcFor(c.name);
            if (!tc) continue;
            assert.ok(pages.includes(`Or type \`${help.textUsage(client(true), c.name)}\``), `${c.name}: its typed line is not on its page`);
            assert.strictEqual(run(`d ${tc.words[0]}`).command, tc.name, `${c.name}: \`d ${tc.words[0]}\` runs something else`);
            for (const o of tc.options || []) for (const val of o.values || []) {
                const v = run(`d ${tc.words[0]} ${val.aliases[0]}`);
                assert.strictEqual(v.kind, 'run', `${c.name}: "${val.aliases[0]}" does not run`);
                if (val.value === LATEST) assert.ok(v.autocomplete.some(a => a.option === o.name && a.first), `${c.name}: "${val.aliases[0]}" is not the latest`);
                else assert.strictEqual(v.values[o.name], [].concat(val.value).join(','), `${c.name}: "${val.aliases[0]}" reads as ${v.values[o.name]}`);
            }
        }
    });
    await check('without Message Content the typed forms read @Dioreo, and inside a text command the page still renders them', async () => {
        const all = await page('draws', ALL, client(false));
        assert.ok(all.includes('Or type `@Dioreo draws [new|returning]`') && all.includes('`@Dioreo draws returning`') && !all.includes('`d draws'));
        await runWithContext({ handler: 'textCommands' }, async () => {
            const inText = await page('draws');
            assert.ok(inText.includes('### `d draws`') && inText.includes('-# 💬 Type `d draws [new|returning]`') && !inText.includes('Or type'), 'inside a text command the line should read Type, not Or type');
        });
    });
    await check('where typed forms do nothing (a DM, a server Dioreo is not in), /help shows none, and still renders', async () => {
        const dmClient = { ...client(true), guilds: { cache: new Map([['900', {}]]) } };
        assert.strictEqual(help.typedFormsHere({ guildId: null, client: dmClient }), false, 'a DM');
        assert.strictEqual(help.typedFormsHere({ guildId: '901', client: dmClient }), false, 'a server Dioreo is not in');
        assert.strictEqual(help.typedFormsHere({ guildId: '900', client: dmClient }), true, 'a server Dioreo is in');
        for (const key of [null, ...help.CATEGORY_DEFS.map(c => c.key)]) {
            const container = await help.buildContainer(key, 0x5865F2, ALL, client(true), null, false, false);
            const all = texts(container).join('\n');
            for (const bit of ['Or type', '· `d ', 'TEXT COMMANDS']) assert.ok(!all.includes(bit), `${key || 'landing'}: shows ${bit} where it cannot work`);
            assert.ok(countComponents([container, help.helpFooterRow()]) <= 40);
        }
        assert.ok((await page('draws')).includes('Or type `d draws'), 'a server render lost its typed forms');
    });
    let largest = { n: 0 };
    // Characters are measured with PROD-LENGTH ids for every command (think-pass, 2026-10-29 00:27 EDT): with the 3-digit fake ids above, and none for /bot, /manage, /embed or /autobuild, a mention is ~20 characters shorter than on prod, and this check passed a page that prod would refuse. Discord's 4,000 is the total of a message's text displays (`.claude/rules/draw-prices.md`, probed 2026-10-16 01:17 EDT).
    const PROD_ID = '1561783498770227300';
    const prodIds = new Map(['gunsmith', 'draws', 'draw', 'calendar', 'today', 'remind', 'patch', 'season', 'colors', 'timestamp', 'invite', 'settings', 'admin', 'bot', 'embed', 'manage', 'autobuild', 'help'].map(n => [n, PROD_ID]));
    // Bot Admin was exempt here until 2026-10-29 09:29 EDT: the owner's page measured 4,038 characters with prod ids, and was trimmed to fit (commands/help.js's note above buildBotAdminBody). Every page is asserted now.
    await check('every page stays within 40 components, and every page within 4,000 characters with prod-length ids', async () => {
        for (const perms of [{}, { serverAdmin: true }, ALL, { botAdmin: true, bot: true }]) for (const tmc of [true, false]) for (const cat of [null, ...help.CATEGORY_DEFS.map(c => c.key)]) {
            const container = await help.buildContainer(cat, 0x5865F2, perms, { ...client(tmc), commandIds: prodIds });
            const n = countComponents([container, help.helpFooterRow()]);
            const chars = texts(container).join('').length;
            assert.ok(n <= 40, `${cat || 'landing'}: ${n} components for ${JSON.stringify(perms)}`);
            assert.ok(chars <= 4000, `${cat || 'landing'}: ${chars} characters for ${JSON.stringify(perms)}`);
            // A restricted category falls back to the landing, so only a real detail page counts here.
            const def = help.CATEGORY_DEFS.find(c => c.key === cat);
            if (def && (!def.requires || perms[def.requires]) && n > largest.n) largest = { n, cat, chars };
        }
    });
    // B4, 2026-10-29 10:32 EDT: a click on a text command's reply is a click on a plain bot message (no interaction metadata), and the page it redraws keeps the text forms (the spec's "Replies"). A slash reply's click, and a DM card's, keep the slash mention.
    await check('a click on a text reply keeps the text forms; a slash reply and a DM card do not', async () => {
        const { buildInteractionContext } = require('../handlers/router');
        const clickOn = (guildId, message) => ({ id: '9', applicationId: 'app', customId: 'help_category', user: { id: 'u1' }, guildId, message });
        const textReply = buildInteractionContext(clickOn('g1', { interactionMetadata: null }));
        const slashReply = buildInteractionContext(clickOn('g1', { interactionMetadata: { id: '8' } }));
        const dmCard = buildInteractionContext(clickOn(null, { interactionMetadata: null }));
        assert.strictEqual(textReply.textReply, true);
        assert.strictEqual(runWithContext(textReply, () => mentionCommand(client(true), '/draws')), '`d draws`');
        assert.strictEqual(runWithContext(slashReply, () => mentionCommand(client(true), '/draws')), '</draws:111>');
        assert.strictEqual(runWithContext(dmCard, () => mentionCommand(client(true), '/draws')), '</draws:111>');
    });
    // B4, 2026-10-29 10:32 EDT (the plan's 4b, from the prod journal): /help failed for everyone on prod with COMPONENT_INVALID_EMOJI, because its Commands List option named an emoji the prod app had deleted. With a booted app that lacks one name, no component on any /help page carries an id that app does not own, and that name gets no emoji at all.
    await check('no /help component carries an emoji the booted app lacks', async () => {
        const emojis = require('../utils/emojiMap');
        const list = [];
        for (const value of Object.values(emojis)) {
            const m = typeof value === 'string' && /^<(a)?:(\w+):(\d+)>$/.exec(value);
            if (m && !list.some(e => e.name === m[2])) list.push({ name: m[2], id: m[3], animated: Boolean(m[1]) });
        }
        const lacking = /^<a?:(\w+):/.exec(emojis.dioreoCombo)[1];
        const owned = list.filter(e => e.name !== lacking);
        await emojis.refreshEmojiIds({ application: { id: 'app' }, rest: { get: async () => ({ items: owned }) } });
        assert.strictEqual(emojis.parseEmoji(emojis.dioreoCombo), undefined, 'the missing name gets no emoji');
        const other = owned[0];
        assert.strictEqual(emojis.parseEmoji(`<:${other.name}:42>`).id, other.id, 'a stale id is answered with the app\'s own copy');
        const ownedIds = new Set(owned.map(e => e.id));
        const emojiIds = node => [...(node?.emoji?.id ? [node.emoji.id] : []), ...[].concat(node?.components || [], node?.options || [], node?.accessory || []).flatMap(emojiIds)];
        for (const perms of [{}, ALL]) for (const cat of [null, ...help.CATEGORY_DEFS.map(c => c.key)]) {
            const container = await help.buildContainer(cat, 0x5865F2, perms, client(true));
            for (const id of emojiIds({ components: [container, help.helpFooterRow()] })) assert.ok(ownedIds.has(id), `${cat || 'landing'}: a component names emoji ${id}, which the app does not own`);
        }
    });
    if (failed) { console.log(`\n${failed} check(s) failed.`); process.exit(1); }
    console.log(`\nAll /help text-command checks passed. Landing: ${landingCount} of 40 components. Largest detail page: ${largest.cat}, ${largest.n} of 40 components (${largest.chars} characters). Typed examples: ${twins}.`);
})();
