// scripts/helpTextCommands.test.js: /help and slash mentions for text commands (text commands, B3, 2026-10-29; rewritten for B6's per-command pages, 2026-10-30 00:15 EDT: every page in its typed and slash view, built by utils/helpPages.js). The /help landing carries one Text commands block (every form where the app has Message Content, only `@Dioreo` where it does not) and stays within Discord's 40 components at every permission level; mentionCommand() writes a command's text form inside a text command, where a slash mention may be exactly what the server hides, and the slash mention everywhere else. Since B5 (2026-10-29 00:15 EDT) every detail page also writes each command's typed form beside its slash Usage and Examples, built from utils/textCommands/commands.js: every one of them must be a message the real parser runs as that command with those values, a command with no text form shows none, and every page stays within 40 components. The real commands/help.js renders; only the store reads it would make are stubbed through require.cache.
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
    const H = require('../utils/helpPages');
    // Every page this viewer may open, in each view it has, the home page first.
    const every = perms => [[null, 'text'], [null, 'slash'], ...help.visiblePageNames(perms).flatMap(n => (H.hasTextView(n) ? [[n, 'text'], [n, 'slash']] : [[n, 'slash']]))];
    const msg = async (cmd, view, { perms = ALL, c = client(true), detail = false, typedForms = true } = {}) => help.buildHelpMessage({ perms, client: c, cmd, view, detail, typedForms });
    const all = async (...a) => texts({ components: await msg(...a) }).join('\n');
    const buttonIds = node => [...(node?.custom_id ? [node.custom_id] : []), ...[].concat(node?.components || [], node?.accessory || []).flatMap(buttonIds)];
    const run = text => parseTextCommand(text, { botId: '1', prefixes: ['d'], commands: TEXT_COMMANDS });
    const tcFor = name => TEXT_COMMANDS.find(c => `/${c.slash}${c.sub ? ` ${c.sub}` : ''}` === name);

    // B7: a typed page and the typed home show the server's own prefixes.
    await check('a server\'s own prefixes on the typed home and on a typed page', async () => {
        const own = { perms: ALL, client: client(true), view: 'text', prefixes: ['!', 'dior'] };
        const home = texts({ components: await help.buildHelpMessage({ ...own, cmd: null }) }).join('\n');
        assert.ok(home.includes('**`@Dioreo`**, **`!`** or **`dior`**'), 'home prefix line');
        assert.ok(home.includes('`! help <command>`'), 'home tip');
        const page = texts({ components: await help.buildHelpMessage({ ...own, cmd: '/draws' }) }).join('\n');
        assert.ok(page.includes('`! draws [new|returning] [filter] [draw name]`') && page.includes('`! draws returning`'), 'typed usage and examples');
        assert.ok(!/`d draws/.test(page), 'the default prefix is gone');
    });

    let homeCount = 0;
    await check('the typed home: the #1 card\'s four groups in short words, the prefixes, and a Slash Commands button', async () => {
        const home = await all(null, 'text');
        assert.ok(home.includes('Type a command') && home.includes('**`@Dioreo`**, **`d`** or **`dior`**'), 'no prefix line');
        for (const g of ['`gunsmith` · `dmz` · `list`', '`draws` · `prices` · `calculator`', '`today` · `calendar` · `remind` · `patch notes` · `end`', '`timestamp` · `colors`', 'Misc**\n`settings` · `prefix` · `invite` · `help` · `announcement`']) assert.ok(home.includes(g), `missing ${g}`);
        assert.ok(home.includes('`d help <command>` opens its page'));
        assert.ok(!home.includes('/today'), 'the retired `/` prefix is still named');
        assert.ok(buttonIds({ components: await msg(null, 'text') }).includes('help_view~slash~landing'));
        const noContent = await all(null, 'text', { c: client(false) });
        assert.ok(noContent.includes('Start with **`@Dioreo`**, such as `@Dioreo today`') && !noContent.includes('**`d`**'));
    });
    await check('the slash home: the groups as mentions, a Text commands line and its button, and no category dropdown', async () => {
        const home = await all(null, 'slash', { perms: {} });
        assert.ok(home.includes('</draws:111>') && home.includes('</gunsmith mp:333>'));
        assert.ok(home.includes('Works where a server hides slash commands'));
        const ids = buttonIds({ components: await msg(null, 'slash', { perms: {} }) });
        assert.ok(ids.includes('help_view~text~landing') && ids.includes('help_command') && !ids.includes('help_category'), ids.join(' '));
    });
    await check('the home page and its footer stay within 40 components at every permission level', async () => {
        for (const perms of [{}, { serverAdmin: true }, ALL]) for (const view of ['text', 'slash']) {
            const n = countComponents([...await msg(null, view, { perms }), help.helpFooterRow()]);
            assert.ok(n <= 40, `${n} components for ${JSON.stringify(perms)} ${view}`);
            homeCount = Math.max(homeCount, n);
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
        // B7's fix-up: the prefix the person typed, or the server's own on a click, never a hard-coded `d` (which a server's prefix replaces).
        await runWithContext({ handler: 'textCommands', textPrefix: '!' }, async () => assert.strictEqual(mentionCommand(client(true), '/draws'), '`! draws`'));
        await runWithContext({ textReply: true, textPrefix: 'cod' }, async () => assert.strictEqual(mentionCommand(client(true), '/draws'), '`cod draws`'));
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
    await check('each typed page names its command with its help word and shown aliases, and both run that command', async () => {
        for (const name of help.visiblePageNames(ALL).filter(H.hasTextView)) {
            const tc = tcFor(name);
            const page = await all(name, 'text');
            assert.ok(page.includes(`### \`d ${tc.helpWord}`), `${name}: no usage line`);
            assert.ok(page.includes(tc.shown.map(w => `\`${w}\``).join(' · ')), `${name}: no aliases line`);
            for (const w of [tc.helpWord, ...tc.shown]) assert.strictEqual(run(`d ${w}`).command, tc.name, `${name}: \`d ${w}\` runs ${run(`d ${w}`).command}`);
        }
    });
    let spans = 0;
    await check('every typed form a page shows is a message the parser answers', async () => {
        for (const perms of [{}, ALL]) for (const [cmd, view] of every(perms).filter(([, v]) => v === 'text')) {
            const page = await all(cmd, view, { perms, detail: cmd === '/draw prices' });
            for (const [, span] of page.matchAll(/`(d [^`]+)`/g)) {
                if (/[<[]/.test(span)) continue; // a usage line or the legend, not a message
                spans++;
                const v = run(span);
                assert.ok(['run', 'needsInput'].includes(v.kind) || (v.kind === null && v.weaponGuess), `${cmd || 'home'}: "${span}" gets ${v.kind}`);
            }
        }
        assert.ok(spans >= 60, `only ${spans} typed forms checked`);
    });
    await check('every value word a page shows runs as that value', async () => {
        for (const name of ['/draws', '/draw prices', '/draw calculator', '/calendar', '/patch notes']) {
            const tc = tcFor(name);
            for (const o of tc.options || []) for (const val of o.values || []) for (const w of [val.aliases[0], ...(val.shown || [])]) {
                const v = run(`d ${tc.helpWord} ${w}`);
                assert.strictEqual(v.kind, 'run', `${name}: "${w}" does not run`);
                if (val.value === LATEST) assert.ok(v.autocomplete.some(a => a.option === o.name && a.first), `${name}: "${w}" is not the latest`);
                else assert.strictEqual(v.values[o.name], [].concat(val.value).join(','), `${name}: "${w}" reads as ${v.values[o.name]}`);
            }
        }
    });
    await check('Draw Prices: the Simple View lists the group words, the Detailed View every type in its quoted group', async () => {
        const simple = await all('/draw prices', 'text');
        assert.ok(simple.includes('`mythic` · `legendary` · `armory` · `advanced`') && simple.includes('*+9 more in Detailed View*'));
        const detail = await all('/draw prices', 'text', { detail: true });
        for (const bit of ['-# **Mythic**', '> -# **`double legendary`** · `double leggy` · `dl`', '-# **Special**', '-# or just `10` · `20` · `30`']) assert.ok(detail.includes(bit), `missing ${bit}`);
        assert.ok(!detail.includes('`lcw`') && !detail.includes('`dlw`'), 'lcw / dlw shown');
        assert.ok(buttonIds({ components: await msg('/draw prices', 'text', { detail: true }) }).includes('help_view~text~/draw prices'));
    });
    await check('a slash-only page (/admin and every Bot Admin page) has no typed form and no Text Command button', async () => {
        // A page that names its typed forms on purpose (`namesTyped`: the gunsmith lists, the owner's page) is checked by its own rule below.
        for (const name of help.visiblePageNames(ALL).filter(n => !H.hasTextView(n) && !H.PAGES[n].namesTyped)) {
            const comps = await msg(name, 'text');
            const page = texts({ components: comps }).join('\n');
            // /admin's page names `d today` as what its Config Text Commands view switches on and off (B7, his draft 2026-10-30): a description, never a typed usage line, so only the usage heading is checked there.
            assert.ok(name === '/admin' ? !/### `d /.test(page) : !/`d [a-z]/.test(page), `${name}: shows a typed form`);
            assert.ok(!buttonIds({ components: comps }).some(id => id.startsWith('help_view~text')), `${name}: offers the text view`);
            assert.ok(page.includes('no text command'), `${name}: no slash-only note`);
        }
    });
    await check('a restricted page is neither opened nor listed for someone who cannot use it', async () => {
        assert.strictEqual(await help.resolvePage('/manage', {}), null);
        assert.strictEqual(await help.resolvePage('manage', ALL), '/manage');
        assert.strictEqual(await help.resolvePage('View Colors', {}), '/colors');
        assert.strictEqual(await help.resolvePage('/gunsmith', {}), '/gunsmith mp');
        const switcher = (await msg(null, 'slash', { perms: {} }))[0].components.find(c => c.type === 1 && c.components[0].custom_id === 'help_command').components[0].options.map(o => o.value);
        assert.ok(!switcher.includes('/manage') && !switcher.includes('/admin') && switcher[0] === 'landing', switcher.join(' '));
        const full = (await msg(null, 'slash', { perms: ALL }))[0].components.find(c => c.type === 1 && c.components[0].custom_id === 'help_command').components[0].options;
        assert.ok(full.length <= 25 && full.some(o => o.value === '/manage'), `${full.length} options`);
    });
    await check("/bot is one page with a dropdown to its subcommands (his call, 2026-10-30 14:05 EDT), and each viewer sees only theirs", async () => {
        const full = (await msg(null, 'slash', { perms: ALL }))[0].components.find(c => c.type === 1 && c.components[0].custom_id === 'help_command').components[0].options.map(o => o.value);
        assert.ok(full.includes('/bot') && !full.some(v => v.startsWith('/bot ')) && full.includes('/embed'), full.join(' '));
        assert.strictEqual(await help.resolvePage('/bot servers', ALL), '/bot servers', 'a subcommand keeps its name, so the page opens on it');
        const servers = await msg('/bot servers', 'slash', { perms: ALL });
        const json = JSON.stringify(servers[0]);
        const picker = JSON.parse(json.match(/\{"type":3,"custom_id":"help_bot"[^]*?\]\}/)[0]);
        assert.deepStrictEqual(picker.options.map(o => o.value), ['/bot analytics', '/bot access', '/bot servers', '/bot penalties', '/bot freeze', '/bot delete', '/bot hotpatch']);
        assert.strictEqual(picker.options.find(o => o.default).value, '/bot servers');
        assert.ok(json.includes('## ') && json.includes('Servers'), 'titled with the subcommand');
        const analyticsOnly = { botAdmin: true, bot: true };
        const narrow = JSON.stringify((await msg('/bot', 'slash', { perms: analyticsOnly }))[0]);
        assert.ok(narrow.includes('Bot Analytics') && !narrow.includes('help_bot'), 'an analytics-only admin gets Analytics, with no dropdown');
        assert.ok(!JSON.stringify((await msg('/bot servers', 'slash', { perms: analyticsOnly }))[0]).includes('Spam Penalties'), 'and an owner-only subcommand never opens for them');
        const home = JSON.stringify((await msg(null, 'slash', { perms: ALL }))[0]);
        assert.ok(home.includes('/bot penalties') && !/`\/bot`/.test(home), "the home page's Admin line names each subcommand, never a bare /bot");
    });
    await check('the switcher sits inside the card, behind a small divider, and the message is that one card (2026-11-01)', async () => {
        for (const cmd of [null, '/draws']) {
            const m = await msg(cmd, 'slash');
            assert.strictEqual(m.length, 1, 'one top-level component: the card');
            const body = m[0].components;
            const at = body.findIndex(c => c.type === 1 && c.components[0].custom_id === 'help_command');
            assert.ok(at > 0 && body[at - 1].type === 14 && body[at - 1].spacing === 1, 'a small divider right above the switcher');
            if (!cmd) assert.ok(String(body.at(-1).content).includes('Made with'), 'the home sign-off stays the last line');
            else assert.strictEqual(at, body.length - 1, 'last on a command page');
        }
    });
    await check('the switcher: page name over `d word` on a typed view, the slash command over the name on a slash view', async () => {
        const typed = (await msg('/season end', 'text'))[0].components.find(c => c.type === 1 && c.components[0].type === 3).components[0];
        assert.strictEqual(typed.custom_id, 'help_command~text');
        const se = typed.options.find(o => o.value === '/season end');
        // The main aliases ride in the description (2026-11-09 13:10 EST, his ask), at most three.
        assert.ok(se.label === 'Season End' && se.description === 'd end · also se, season end, rank end' && se.default, JSON.stringify(se));
        const slash = (await msg('/season end', 'slash'))[0].components.find(c => c.type === 1 && c.components[0].type === 3).components[0];
        const se2 = slash.options.find(o => o.value === '/season end');
        assert.ok(slash.custom_id === 'help_command' && se2.label === '/season end' && se2.description === 'Season End · typed: d end, d se, d season end', JSON.stringify(se2));
        assert.ok([...typed.options, ...slash.options].every(o => o.description.length <= 100), 'Discord caps a description at 100');
    });
    await check('without Message Content every typed form reads @Dioreo', async () => {
        const page = await all('/draws', 'text', { c: client(false) });
        assert.ok(page.includes('### `@Dioreo draws [new|returning] [filter] [draw name]`') && page.includes('`@Dioreo draws returning`') && !page.includes('`d draws'));
    });
    await check('where typed forms do nothing (a DM, a server Dioreo is not in), /help is slash only and still renders', async () => {
        const dmClient = { ...client(true), guilds: { cache: new Map([['900', {}]]) } };
        assert.strictEqual(help.typedFormsHere({ guildId: null, client: dmClient }), false, 'a DM');
        assert.strictEqual(help.typedFormsHere({ guildId: '901', client: dmClient }), false, 'a server Dioreo is not in');
        assert.strictEqual(help.typedFormsHere({ guildId: '900', client: dmClient }), true, 'a server Dioreo is in');
        // The owner's page names his typed command everywhere (namesTyped, admin): it is documentation of a command that runs in a server.
        for (const [cmd] of every(ALL).filter(([c]) => c !== '/owner')) {
            const comps = await msg(cmd, 'text', { typedForms: false });
            const page = texts({ components: comps }).join('\n');
            assert.ok((cmd === '/admin' ? !/### `d /.test(page) : !/`d [a-z]/.test(page)) && !page.includes('Text commands'), `${cmd || 'home'}: shows a typed form where it cannot work`);
            assert.ok(!buttonIds({ components: comps }).some(id => id.startsWith('help_view~')), `${cmd || 'home'}: offers a view switch`);
            assert.ok(countComponents([...comps, help.helpFooterRow()]) <= 40);
        }
    });
    let largest = { n: 0 };
    // Characters are measured with PROD-LENGTH ids for every command (think-pass, 2026-10-29 00:27 EDT): a mention is ~20 characters longer on prod than with the 3-digit ids above. Discord's 4,000 is the total of a message's text displays (`.claude/rules/draw-prices.md`, probed 2026-10-16 01:17 EDT).
    const PROD_ID = '1561783498770227300';
    const prodIds = new Map(['gunsmith', 'draws', 'draw', 'calendar', 'today', 'remind', 'patch', 'season', 'colors', 'timestamp', 'invite', 'settings', 'admin', 'bot', 'embed', 'manage', 'autobuild', 'help'].map(n => [n, PROD_ID]));
    await check('every page stays within 40 components and 4,000 characters with prod-length ids, in every view', async () => {
        for (const perms of [{}, { serverAdmin: true }, ALL, { botAdmin: true, bot: true }]) for (const tmc of [true, false]) for (const [cmd, view] of every(perms)) for (const detail of cmd === '/draw prices' ? [false, true] : [false]) {
            const comps = await msg(cmd, view, { perms, c: { ...client(tmc), commandIds: prodIds }, detail });
            const n = countComponents([...comps, help.helpFooterRow()]);
            const chars = texts({ components: comps }).join('').length;
            assert.ok(n <= 40, `${cmd || 'home'} ${view}: ${n} components for ${JSON.stringify(perms)}`);
            assert.ok(chars <= 4000, `${cmd || 'home'} ${view}: ${chars} characters for ${JSON.stringify(perms)}`);
            if (cmd && n > largest.n) largest = { n, cmd, view, chars };
        }
    });
    // B4, 2026-10-29 10:32 EDT: a click on a text command's reply is a click on a plain bot message (no interaction metadata), and the page it redraws keeps the text forms (the spec's "Replies"). A slash reply's click, and a DM card's, keep the slash mention.
    await check('a click on a text reply keeps the text forms; a slash reply and a DM card do not', async () => {
        const { buildInteractionContext } = require('../handlers/router');
        const clickOn = (guildId, message) => ({ id: '9', applicationId: 'app', customId: 'help_command', user: { id: 'u1' }, guildId, message });
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
        for (const perms of [{}, ALL]) for (const [cmd, view] of every(perms)) {
            const msg = await help.buildHelpMessage({ perms, client: client(true), cmd, view });
            for (const id of emojiIds({ components: [...msg, help.helpFooterRow()] })) assert.ok(ownedIds.has(id), `${cmd || 'home'} ${view}: a component names emoji ${id}, which the app does not own`);
        }
    });
    // Two /help commands (2026-11-09 13:10 EST, his ask): Dioreo's for players and server admins, Dioreo Admin's for the admin and owner pages. One /help with everything while Dioreo Admin is off.
    await check('scopes: the public /help has no Bot Admin pages, Dioreo Admin\'s has only those and the owner\'s page, and "all" keeps both', async () => {
        const H2 = require('../utils/helpPages');
        const pub = help.visiblePageNames(ALL, 'public');
        const adm = help.visiblePageNames(ALL, 'admin');
        assert.ok(!pub.some(n => H2.PAGES[n].admin), `admin page on the public /help: ${pub.filter(n => H2.PAGES[n].admin)}`);
        assert.ok(pub.includes('/admin') && pub.includes('/announcement') && pub.includes('/gunsmith list'), 'server settings, announcements and the lists stay public');
        assert.deepStrictEqual(adm, ['/manage', '/manage emojis', '/autobuild', '/bot', '/embed', '/owner']);
        assert.deepStrictEqual(help.visiblePageNames({ botAdmin: true, manage: true }, 'admin'), ['/manage'], 'an admin with only /manage sees only /manage');
        assert.ok(!help.visiblePageNames({}, 'admin').length, 'no pages for someone with no admin access');
        const allNames = help.visiblePageNames(ALL);
        for (const n of [...pub, ...adm]) assert.ok(allNames.includes(n), `${n} missing from the one-/help setup`);
        const home = texts({ components: await help.buildHelpMessage({ perms: ALL, client: client(true), view: 'slash', scope: 'admin' }) }).join('\n');
        assert.ok(home.includes('Dioreo Admin') && home.includes(' Owner**') && home.includes('`d owner delete`') && !home.includes('Misc') && !home.includes('/draws'), 'the admin home');
        const pubHome = texts({ components: await help.buildHelpMessage({ perms: ALL, client: client(true), view: 'slash', scope: 'public' }) }).join('\n');
        assert.ok(!/\/manage|\/bot /.test(pubHome) && pubHome.includes('Misc'), 'the public home names no admin command');
        assert.strictEqual(await help.resolvePage('manage', ALL, 'public'), null, '/manage is not opened from the public /help');
        assert.strictEqual(await help.resolvePage('announcement', ALL, 'public'), '/announcement');
        assert.strictEqual(await help.resolvePage('owner', ALL, 'admin'), '/owner');
        assert.strictEqual(await help.resolvePage('owner', { botAdmin: true, manage: true }, 'admin'), null, 'only the owner opens the owner page');
        const choices = await help.helpChoices('an', ALL, 'admin');
        assert.ok(!choices.some(c => c.value === 'announcement'), 'no announcements shortcut on Dioreo Admin');
    });
    await check('helpScope: Dioreo Admin\'s interaction is "admin", Dioreo\'s is "public", and "all" with the admin app off', () => {
        const clients = require('../bot/clients');
        const before = { ...clients.clients };
        try {
            clients.setClients({ public: { application: { id: 'P' } }, admin: null });
            assert.strictEqual(help.helpScope({ applicationId: 'A' }), 'all');
            clients.setClients({ public: { application: { id: 'P' } }, admin: { application: { id: 'A' } } });
            assert.strictEqual(help.helpScope({ applicationId: 'A' }), 'admin');
            assert.strictEqual(help.helpScope({ applicationId: 'P' }), 'public');
            assert.strictEqual(help.helpScope({}), 'public', 'a text command (no application id) is the public /help');
        } finally { clients.setClients(before); }
    });
    await check('the announcement and owner pages, and the lists page hiding its typed forms where they cannot work', async () => {
        const ann = await all('/announcement', 'text');
        assert.ok(ann.includes('### `d announcement [words] [channel]`') && ann.includes('`announce` · `repost`') && ann.includes('/help cmd:announcement'));
        const owner = await all('/owner', 'slash');
        assert.ok(owner.includes('### `d owner delete [channel] [messages|N]`') && owner.includes('`override`') && owner.includes('never anyone else'));
        assert.ok(owner.includes('-# Usage: `d cmd <required> [optional]`'), 'a typed command reads the typed legend');
        const sw = JSON.stringify(await msg('/owner', 'slash'));
        assert.ok(sw.includes('"label":"Owner Tools","value":"/owner","description":"d owner delete"'), 'the owner page is no slash command in the switcher');
        const listHere = await all('/gunsmith list', 'slash');
        const listDm = await all('/gunsmith list', 'slash', { typedForms: false });
        assert.ok(listHere.includes('`d lists`') && !listDm.includes('`d lists`'));
    });
    if (failed) { console.log(`\n${failed} check(s) failed.`); process.exit(1); }
    console.log(`\nAll /help text-command checks passed. Home: ${homeCount} of 40 components. Largest page: ${largest.cmd} (${largest.view}), ${largest.n} of 40 components (${largest.chars} characters). Typed forms parsed: ${spans}.`);
})();
