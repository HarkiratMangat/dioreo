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
        assert.ok(page.includes('`! draws [new|returning]`') && page.includes('`! draws returning`'), 'typed usage and examples');
        assert.ok(!/`d draws/.test(page), 'the default prefix is gone');
    });

    let homeCount = 0;
    await check('the typed home: the #1 card\'s four groups in short words, the prefixes, and a Slash Commands button', async () => {
        const home = await all(null, 'text');
        assert.ok(home.includes('Type a command') && home.includes('**`@Dioreo`**, **`d`** or **`dior`**'), 'no prefix line');
        for (const g of ['`gunsmith` · `dmz`', '`draws` · `prices` · `calculator`', '`today` · `calendar` · `remind` · `patch notes` · `end`', '`timestamp` · `colors` · `settings` · `invite` · `help`']) assert.ok(home.includes(g), `missing ${g}`);
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
    await check('Draw Prices: the Simple view lists the group words, the Detailed view every type in its quoted group', async () => {
        const simple = await all('/draw prices', 'text');
        assert.ok(simple.includes('`mythic` · `legendary` · `armory` · `advanced`') && simple.includes('*+9 more in Detailed view*'));
        const detail = await all('/draw prices', 'text', { detail: true });
        for (const bit of ['-# **Mythic**', '> -# **`double legendary`** · `double leggy` · `dl`', '-# **Special**', '-# or just `10` · `20` · `30`']) assert.ok(detail.includes(bit), `missing ${bit}`);
        assert.ok(!detail.includes('`lcw`') && !detail.includes('`dlw`'), 'lcw / dlw shown');
        assert.ok(buttonIds({ components: await msg('/draw prices', 'text', { detail: true }) }).includes('help_view~text~/draw prices'));
    });
    await check('a slash-only page (/admin and every Bot Admin page) has no typed form and no Text Command button', async () => {
        for (const name of help.visiblePageNames(ALL).filter(n => !H.hasTextView(n))) {
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
        const switcher = (await msg(null, 'slash', { perms: {} }))[1].components[0].options.map(o => o.value);
        assert.ok(!switcher.includes('/manage') && !switcher.includes('/admin') && switcher[0] === 'landing', switcher.join(' '));
        const full = (await msg(null, 'slash', { perms: ALL }))[1].components[0].options;
        assert.ok(full.length <= 25 && full.some(o => o.value === '/manage'), `${full.length} options`);
    });
    await check('the switcher: page name over `d word` on a typed view, the slash command over the name on a slash view', async () => {
        const typed = (await msg('/season end', 'text'))[1].components[0];
        assert.strictEqual(typed.custom_id, 'help_command~text');
        const se = typed.options.find(o => o.value === '/season end');
        assert.ok(se.label === 'Season End' && se.description === 'd end' && se.default, JSON.stringify(se));
        const slash = (await msg('/season end', 'slash'))[1].components[0];
        const se2 = slash.options.find(o => o.value === '/season end');
        assert.ok(slash.custom_id === 'help_command' && se2.label === '/season end' && se2.description === 'Season End');
    });
    await check('without Message Content every typed form reads @Dioreo', async () => {
        const page = await all('/draws', 'text', { c: client(false) });
        assert.ok(page.includes('### `@Dioreo draws [new|returning]`') && page.includes('`@Dioreo draws returning`') && !page.includes('`d draws'));
    });
    await check('where typed forms do nothing (a DM, a server Dioreo is not in), /help is slash only and still renders', async () => {
        const dmClient = { ...client(true), guilds: { cache: new Map([['900', {}]]) } };
        assert.strictEqual(help.typedFormsHere({ guildId: null, client: dmClient }), false, 'a DM');
        assert.strictEqual(help.typedFormsHere({ guildId: '901', client: dmClient }), false, 'a server Dioreo is not in');
        assert.strictEqual(help.typedFormsHere({ guildId: '900', client: dmClient }), true, 'a server Dioreo is in');
        for (const [cmd] of every(ALL)) {
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
    if (failed) { console.log(`\n${failed} check(s) failed.`); process.exit(1); }
    console.log(`\nAll /help text-command checks passed. Home: ${homeCount} of 40 components. Largest page: ${largest.cmd} (${largest.view}), ${largest.n} of 40 components (${largest.chars} characters). Typed forms parsed: ${spans}.`);
})();
