// scripts/guildPolicyEnforcement.test.js
//
// ENFORCEMENT tests for the v3 server-admin visibility policy. Run by `npm test`.
//
// WHY A SECOND FILE. scripts/guildPolicy.test.js covers resolveVisibility() -- a pure function, and the easy half. It proves the policy DECIDES correctly and says nothing about whether the decision is ever APPLIED. Everything that actually enforces a verdict lives outside that function, in two choke points and a Mongoose schema, and all three fail in ways a precedence test cannot see:
//
//   1. A field missing from the schema is silently dropped on save (the repo's oldest recurring bug class -- root CLAUDE.md's "Database schema gotcha"). /admin would appear to save a channel rule and the rule would simply not exist on the next fetch.
//   2. The method wrap could clamp `ephemeral` while DESTROYING the Components V2 flag, which renders as a blank message rather than as an error.
//   3. The clamp could be assigned non-enumerably, in which case buildSyntheticInteraction()'s Object.assign drops it and a panel renders clamped on first invocation and unclamped on every navigation click after -- a bypass that only appears on the second click.
//
// NOTHING HERE NEEDS A DATABASE OR A NETWORK, deliberately. GuildSettings is exercised as an unsaved document (Mongoose casts and validates in memory, so an undeclared field is still visibly dropped), getGuildSettings' single query is stubbed at the model seam, and sendV2Payload gets a fake `rest`. A test that skips itself when Mongo is absent would report green in CI while examining nothing, which is the exact failure mode .claude/rules/admin-controls.md warns about after `privacy-model-coverage` did it to this very feature.
//
// ⚠️ WHAT THIS STILL DOES NOT PROVE: that a human clicking /admin in Discord gets the right result. Registration and in-process tests are not a click -- see the v3.1.1 lesson in docs/DEVLOG.md. Behavioural verification in a real guild is tracked separately.
const assert = require('node:assert');
const GuildSettings = require('../models/GuildSettings');
const guildPolicy = require('../utils/guildPolicy');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { SHARE_BUTTON_CUSTOM_ID } = require('../utils/shareButton');

let pass = 0;
const failures = [];
const pending = [];

// ⚠️ t() MUST track the promise an async case returns. The first version of this harness called fn() and moved on, which meant an async case's assertions ran AFTER its own try/finally had already restored the stubs it depended on -- and after the reporter had counted it as passed. It surfaced as a case "passing" and then the process dying on a 10s Mongo timeout, because the real model method was back in place by the time the code under test reached it. A test harness that reports before its tests finish is worse than no harness: it produces green with no run. Cases run ONE AFTER ANOTHER since 2026-10-22 15:41 EDT. Several async cases stub GuildSettings.findOne, and while they ran at once, a case could read another's stub: a /bot servers case got the no-ping case's lean-only stub and failed with "doc.save is not a function". The earlier cases had passed only because their timing never overlapped.
let chain = Promise.resolve();
function t(name, fn) {
    chain = chain.then(() => fn()).then(
        () => { pass++; },
        error => { failures.push(`${name} -- ${error.message}`); },
    );
    pending.push(chain);
}

// A minimal interaction carrying the shapes guildPolicy actually reads. `member.roles` is a plain ARRAY on purpose: that is the raw APIInteractionGuildMember shape Discord sends for a user-installed invocation in a server the bot has not joined, which is precisely the case this feature exists to cover, and the shape a discord.js-flavoured mock would quietly not test.
function makeInteraction({ roleIds = [], commandName = null, subcommand = null, parentId = null, isAdmin = false } = {}) {
    const calls = [];
    const interaction = {
        guildId: 'G_1',
        channelId: 'C_1',
        channel: { parentId },
        member: { roles: roleIds },
        user: { id: 'U_1' },
        commandName,
        options: { getSubcommandGroup: () => null, getSubcommand: () => subcommand },
        memberPermissions: { has: () => isAdmin },
        deferred: true,
        replied: false,
        applicationId: 'A_1',
        token: 'tok',
        client: { rest: { patch: (route, options) => { calls.push({ route, options }); return Promise.resolve(); } } },
        reply: options => { calls.push({ method: 'reply', options }); return Promise.resolve(); },
        deferReply: options => { calls.push({ method: 'deferReply', options }); return Promise.resolve(); },
        followUp: options => { calls.push({ method: 'followUp', options }); return Promise.resolve(); },
    };
    return { interaction, calls };
}

// Stubs the ONE query getGuildSettings makes. Returns a restore function. The cache is invalidated on both sides because it is module-level state shared across every case in this file -- without that, case N would silently resolve against case N-1's settings and still pass.
async function withSettings(settings, run) {
    const original = GuildSettings.findOne;
    GuildSettings.findOne = () => ({ lean: async () => settings });
    guildPolicy.invalidateGuildPolicy('G_1');
    try {
        return await run();
    } finally {
        GuildSettings.findOne = original;
        guildPolicy.invalidateGuildPolicy('G_1');
    }
}

// --- 1. the schema actually declares everything /admin writes ------------------------------ Mongoose only persists DECLARED fields. An undeclared one is accepted in memory and vanishes on the next fetch, so this asserts against toObject() -- the shape that would reach the database -- rather than against the assignment, which always "works".
t('every field /admin writes survives a schema round-trip', () => {
    const doc = new GuildSettings({ guildId: 'G_1' });
    doc.defaultVisibility = 'ephemeral';
    doc.channelRules = [{ channelId: 'C_1', visibility: 'public' }];
    doc.roleRules = [{ roleId: 'R_1', visibility: 'public', channelIds: ['C_1'] }];
    doc.ephemeralCommands = ['colors'];
    doc.updatedBy = 'U_1';

    const saved = doc.toObject();
    assert.strictEqual(saved.defaultVisibility, 'ephemeral');
    assert.strictEqual(saved.channelRules[0].channelId, 'C_1');
    assert.strictEqual(saved.channelRules[0].visibility, 'public');
    assert.strictEqual(saved.roleRules[0].roleId, 'R_1');
    assert.deepStrictEqual([...saved.roleRules[0].channelIds], ['C_1'], 'channelIds must persist -- a role rule without it silently becomes server-wide');
    assert.deepStrictEqual([...saved.ephemeralCommands], ['colors']);
    assert.strictEqual(saved.updatedBy, 'U_1');
});

t('the visibility enum rejects a value outside public/ephemeral', () => {
    const doc = new GuildSettings({ guildId: 'G_1', channelRules: [{ channelId: 'C_1', visibility: 'hidden' }] });
    const error = doc.validateSync();
    assert.ok(error, 'an out-of-enum visibility must fail validation, not reach the database');
});

// --- 2. the clamp actually clamps ------------------------------------------------------------
t('an ephemeral verdict wraps reply, deferReply and followUp', async () => {
    const { interaction, calls } = makeInteraction();
    await withSettings({ defaultVisibility: 'ephemeral' }, async () => {
        await guildPolicy.attachGuildPolicy(interaction);
        await interaction.reply({ content: 'x' });
        await interaction.deferReply({});
        await interaction.followUp({ content: 'y' });
    });
    assert.strictEqual(calls.length, 3);
    for (const call of calls) assert.strictEqual(call.options.ephemeral, true, `${call.method} was not clamped`);
});

// The single most damaging way this could be wrong: replacing `flags` instead of OR-ing into it drops 32768 and every Components V2 payload renders as a blank message -- which looks like a rendering bug, not a policy bug, and would be debugged in entirely the wrong file.
t('the ephemeral bit is OR-ed into the Components V2 flag, not substituted for it', async () => {
    const { interaction, calls } = makeInteraction();
    await withSettings({ defaultVisibility: 'ephemeral' }, async () => {
        await guildPolicy.attachGuildPolicy(interaction);
        await interaction.reply({ content: 'x', flags: 32768 });
    });
    assert.strictEqual(calls[0].options.flags, 32768 | 64, 'expected 32832 (V2 + ephemeral)');
});

t('a bare string reply is normalised before the flag is added', async () => {
    const { interaction, calls } = makeInteraction();
    await withSettings({ defaultVisibility: 'ephemeral' }, async () => {
        await guildPolicy.attachGuildPolicy(interaction);
        await interaction.reply('plain text');
    });
    assert.strictEqual(calls[0].options.content, 'plain text');
    assert.strictEqual(calls[0].options.ephemeral, true);
});

t('a public verdict leaves the response methods untouched', async () => {
    const { interaction, calls } = makeInteraction();
    await withSettings({ defaultVisibility: 'public' }, async () => {
        await guildPolicy.attachGuildPolicy(interaction);
        await interaction.reply({ content: 'x' });
    });
    assert.strictEqual(calls[0].options.ephemeral, undefined, 'a public policy must not force ephemeral -- it PERMITS public, the user still chooses');
    assert.strictEqual(interaction.dioreoPolicy.allowShare, true);
});

// Threads are the hole that shipped-and-was-caught: interaction.channelId is the THREAD's id, so without inheritance a rule on the parent stops applying the moment talk moves into a thread -- failing OPEN. Asserted here at the attach layer too, because resolveVisibility getting it right is worth nothing if attachGuildPolicy never passes parentChannelId down.
t('attachGuildPolicy passes the thread parent through to the resolver', async () => {
    const { interaction } = makeInteraction({ parentId: 'C_1' });
    interaction.channelId = 'T_1';
    await withSettings({ defaultVisibility: 'public', channelRules: [{ channelId: 'C_1', visibility: 'ephemeral' }] }, async () => {
        await guildPolicy.attachGuildPolicy(interaction);
    });
    assert.strictEqual(interaction.dioreoPolicy.visibility, 'ephemeral', 'a thread must inherit its parent channel rule');
});

t('a command rule clamps an ordinary member and exempts an admin', async () => {
    const settings = { defaultVisibility: 'public', ephemeralCommands: ['colors'] };
    const member = makeInteraction({ commandName: 'colors' });
    const admin = makeInteraction({ commandName: 'colors', isAdmin: true });
    await withSettings(settings, async () => { await guildPolicy.attachGuildPolicy(member.interaction); });
    await withSettings(settings, async () => { await guildPolicy.attachGuildPolicy(admin.interaction); });
    assert.strictEqual(member.interaction.dioreoPolicy.visibility, 'ephemeral');
    assert.strictEqual(admin.interaction.dioreoPolicy.visibility, 'public');
});

// Per subcommand (2026-10-22 14:01 EDT): the policy reads the subcommand off the real interaction shape, so /draw calculator can be hidden while /draw prices stays public.
t('a subcommand rule clamps that subcommand only, through the real wrap', async () => {
    const settings = { defaultVisibility: 'public', ephemeralCommands: ['draw calculator'] };
    const calc = makeInteraction({ commandName: 'draw', subcommand: 'calculator' });
    const prices = makeInteraction({ commandName: 'draw', subcommand: 'prices' });
    await withSettings(settings, async () => { await guildPolicy.attachGuildPolicy(calc.interaction); });
    await withSettings(settings, async () => { await guildPolicy.attachGuildPolicy(prices.interaction); });
    assert.strictEqual(calc.interaction.dioreoPolicy.visibility, 'ephemeral');
    assert.strictEqual(prices.interaction.dioreoPolicy.visibility, 'public');
});

// A component click carries no commandName. The tier is skipped rather than misapplied, which is correct -- Discord fixed that message's ephemerality when it was first sent -- but it is exactly the kind of asymmetry a later refactor "tidies up" into a bug.
t('a component click (no commandName) skips the command tier', async () => {
    const { interaction } = makeInteraction({ commandName: null });
    await withSettings({ defaultVisibility: 'public', ephemeralCommands: ['colors'] }, async () => {
        await guildPolicy.attachGuildPolicy(interaction);
    });
    assert.strictEqual(interaction.dioreoPolicy.visibility, 'public');
});

t('no policy is attached outside a guild', async () => {
    const { interaction } = makeInteraction();
    interaction.guildId = null;
    const policy = await guildPolicy.attachGuildPolicy(interaction);
    assert.strictEqual(policy, null);
    assert.strictEqual(interaction.dioreoPolicy, undefined, 'a DM must carry no policy at all, not a permissive one');
});

// --- 3. the clamp survives buildSyntheticInteraction ---------------------------------------- the router builds synthetic interactions with Object.assign, which copies OWN ENUMERABLE properties only. That is why discord.js's non-enumerable `client`/`token` had to be re-defined by hand there after two real crashes. The same mechanism decides whether the clamp survives a navigation click, so this asserts the property Object.assign depends on rather than re-implementing the helper -- a copy of the helper would only ever test the copy.
t('the clamp and the policy are own enumerable properties', async () => {
    const { interaction } = makeInteraction();
    await withSettings({ defaultVisibility: 'ephemeral' }, async () => {
        await guildPolicy.attachGuildPolicy(interaction);
    });
    for (const key of ['dioreoPolicy', 'reply', 'deferReply', 'followUp']) {
        const descriptor = Object.getOwnPropertyDescriptor(interaction, key);
        assert.ok(descriptor, `${key} must be an OWN property`);
        assert.ok(descriptor.enumerable, `${key} must be ENUMERABLE or Object.assign drops it and the clamp dies on the second click`);
    }
});

t('an Object.assign copy still clamps', async () => {
    const { interaction, calls } = makeInteraction();
    await withSettings({ defaultVisibility: 'ephemeral' }, async () => {
        await guildPolicy.attachGuildPolicy(interaction);
        const synthetic = Object.assign(Object.create(Object.getPrototypeOf(interaction)), interaction);
        await synthetic.reply({ content: 'x', flags: 32768 });
    });
    assert.strictEqual(calls[0].options.flags, 32768 | 64);
});

// --- 4. the share row is stripped at the send boundary ---------------------------------------
const shareRow = { type: 1, components: [{ type: 2, custom_id: SHARE_BUTTON_CUSTOM_ID, label: 'Show Everyone' }] };
const navRow = { type: 1, components: [{ type: 2, custom_id: 'nav_draws', label: 'Draws' }] };
const container = { type: 17, components: [{ type: 10, content: 'body' }] };

t('sendV2Payload strips the share row under an ephemeral policy', async () => {
    const { interaction, calls } = makeInteraction();
    interaction.dioreoPolicy = { visibility: 'ephemeral', allowShare: false };
    await sendV2Payload(interaction, [container, navRow, shareRow]);
    const sent = calls[0].options.body.components;
    assert.strictEqual(sent.length, 2, 'exactly the share row should be dropped');
    assert.ok(!JSON.stringify(sent).includes(SHARE_BUTTON_CUSTOM_ID));
    assert.strictEqual(sent[1].components[0].custom_id, 'nav_draws', 'the nav row must survive -- stripping too much is as wrong as stripping too little');
});

t('sendV2Payload leaves the share row alone under a public policy', async () => {
    const { interaction, calls } = makeInteraction();
    interaction.dioreoPolicy = { visibility: 'public', allowShare: true };
    await sendV2Payload(interaction, [container, shareRow]);
    assert.strictEqual(calls[0].options.body.components.length, 2);
});

t('sendV2Payload is unaffected when no policy is attached at all', async () => {
    const { interaction, calls } = makeInteraction();
    await sendV2Payload(interaction, [container, shareRow]);
    assert.strictEqual(calls[0].options.body.components.length, 2, 'a DM or an unpolicied guild must not lose its share button');
});

// --- 5. the command menu never truncates silently -------------------------------------------- A string select takes 25 options and has no search, so the list must fit. The gateable set is generated at boot from Loadout.distinct('category'), so it GROWS as weapon categories are added -- at 18 today nothing is dropped, and by the time it matters nobody will be looking. The bug this pins is not the cap (Discord's, unraisable) but a SILENT cap: an admin seeing 25 of 30 commands has no way to tell the list is incomplete, because a short list looks exactly like a complete one.
t('the command menu names anything it had to leave out', () => {
    const { buildCommands } = require('../commands/admin').__testRenderers;
    const many = Array.from({ length: 30 }, (_, i) => `cmd${String(i).padStart(2, '0')}`);
    const rendered = JSON.stringify(buildCommands(null, many));
    const select = buildCommands(null, many).find(c => c.type === 1 && c.components?.[0]?.type === 3);
    assert.strictEqual(select.components[0].options.length, 25, 'the select itself must stay within Discord’s cap');
    assert.ok(rendered.includes('cmd25'), 'an omitted command must be named in the panel, not silently dropped');
    assert.ok(rendered.includes('cmd29'));
});

t('the command menu stays quiet when everything fits', () => {
    const { buildCommands } = require('../commands/admin').__testRenderers;
    const few = ['colors', 'help', 'timestamp'];
    const rendered = JSON.stringify(buildCommands(null, few));
    assert.ok(!rendered.includes('not listed') && !rendered.includes('missing from the list'), 'no truncation warning should appear when nothing was truncated');
});

// --- 5b. the Commands menu: labels, right-click lines, older rules, and the save ------------- From the 2026-10-21 22:26 EDT click test: right-click commands showed as "/Convert Times", and subcommands as a bare "/draw".
t('each page offers Clear only when it has rules, and the role screen keeps the four tabs', () => {
    const { buildChannels, buildRoles, buildRoleScope, buildCommands } = require('../commands/admin').__testRenderers;
    const ids = page => JSON.stringify(page);
    assert.ok(!ids(buildChannels({})).includes('admin_ch_clear'));
    assert.ok(ids(buildChannels({ channelRules: [{ channelId: 'C', visibility: 'ephemeral' }] })).includes('admin_ch_clear'));
    assert.ok(ids(buildRoles({ roleRules: [{ roleId: 'R', visibility: 'public', channelIds: [] }] })).includes('admin_role_clear'));
    assert.ok(ids(buildCommands({ ephemeralCommands: ['colors'] }, ['colors'])).includes('admin_cmd_clear'));
    const scope = ids(buildRoleScope({ roleRules: [{ roleId: 'R', visibility: 'public', channelIds: ['C'] }] }, 'R'));
    assert.ok(scope.includes('admin_role_scope_clear|R') && scope.includes('admin_home') && scope.includes('admin_commands'), 'the role screen must carry Clear and all four tabs');
});

// --- 5c. /bot servers, the owner's override, and the no-ping rule ------------------------------ (edge-case pass, 2026-10-22 15:38 EDT)
t('/bot servers is owner-only on every click, and a reset clears the rules and is logged', async () => {
    const adminAccess = require('../utils/adminAccess');
    const changeStore = require('../utils/changeStore');
    const { handleBotInteraction } = require('../handlers/bot');
    const realOwner = adminAccess.isOwner;
    const realRecord = changeStore.recordChange;
    const logged = [];
    changeStore.recordChange = fields => { logged.push(fields); return Promise.resolve(); };
    // The server's own change log must show the owner's reset too (Harkirat 2026-10-22 17:05 EDT: "it should log that just for transparency").
    const GuildSettingsLog = require('../models/GuildSettingsLog');
    const realLogCreate = GuildSettingsLog.create;
    const serverLog = [];
    GuildSettingsLog.create = async row => { serverLog.push(row); return row; };
    const saved = { guildId: '123456789012345678', defaultVisibility: 'ephemeral', channelRules: [{ channelId: 'C', visibility: 'ephemeral' }], roleRules: [], ephemeralCommands: ['colors'], textRules: { defaultVisibility: 'ephemeral', channelRules: [], roleRules: [], commandSettings: [] }, textPrefixes: ['!'], save: async () => {} };
    const original = GuildSettings.findOne;
    GuildSettings.findOne = () => ({ lean: async () => saved, then: (ok) => ok(saved) });
    try {
        // A non-owner is refused before anything is read or written.
        adminAccess.isOwner = () => false;
        const denied = makeInteraction();
        Object.assign(denied.interaction, { customId: 'bot_srv_reset|123456789012345678', isButton: () => true, isModalSubmit: () => false, deferUpdate: async () => {}, client: { ...denied.interaction.client, guilds: { cache: new Map() } } });
        await handleBotInteraction(denied.interaction);
        assert.ok(denied.calls.some(c => c.method === 'reply' && /Only the bot owner/.test(c.options.content)));
        assert.strictEqual(saved.channelRules.length, 1, 'a refused click must not change anything');
        // The owner resets.
        adminAccess.isOwner = () => true;
        const owner = makeInteraction();
        Object.assign(owner.interaction, { customId: 'bot_srv_reset|123456789012345678', isButton: () => true, isModalSubmit: () => false, deferUpdate: async () => {}, deferred: true, client: { ...owner.interaction.client, guilds: { cache: new Map() } } });
        await handleBotInteraction(owner.interaction);
        assert.deepStrictEqual([saved.channelRules.length, saved.ephemeralCommands.length, saved.defaultVisibility], [0, 0, 'public']);
        assert.deepStrictEqual([saved.textRules, saved.textPrefixes], [undefined, undefined], 'the owner\'s reset clears the text switch and the prefix too (B7)');
        assert.strictEqual(logged.length, 1);
        assert.ok(/Before: .*Private/.test(logged[0].summary), 'the log must carry the rules as they were');
        assert.ok(/\*\*Text commands\*\* · Off by default · 0 rules · prefix `!`/.test(logged[0].summary), 'and the text settings as they were');
        await new Promise(r => setImmediate(r));
        assert.strictEqual(serverLog.length, 1, "the owner's reset must appear in the server's own change log");
        assert.strictEqual(serverLog[0].source, 'owner');
    } finally {
        GuildSettingsLog.create = realLogCreate;
        adminAccess.isOwner = realOwner;
        changeStore.recordChange = realRecord;
        GuildSettings.findOne = original;
        guildPolicy.invalidateGuildPolicy('123456789012345678');
    }
});

// B7 (2026-10-30): the text-command view. Its own ids, On/Off words, the flip button, and a click that writes textRules and never the slash settings.
t('the /admin text view: its ids, On/Off, the flip button and a save into textRules only', async () => {
    const admin = require('../commands/admin');
    const { inView, textView, buildHome } = admin.__testRenderers;
    const stored = { guildId: 'G_T', defaultVisibility: 'ephemeral', textRules: { defaultVisibility: 'ephemeral', channelRules: [], roleRules: [], commandSettings: [] }, textPrefixes: ['!'] };
    const json = JSON.stringify(inView('text', () => buildHome(textView(stored), { textMessageContent: true }, {})));
    assert.ok(json.includes('"custom_id":"admin_t_default|public"') && json.includes('"label":"On"') && json.includes('"label":"Off"'), 'On/Off in the text namespace');
    assert.ok(json.includes('"custom_id":"admin_view|slash"') && json.includes('Config Slash Commands'), 'the flip back');
    assert.ok(json.includes('"custom_id":"admin_t_prefix"') && json.includes('`!` *(in place of `d`)*') && json.includes('`dior` and `@Dioreo` always work'), 'the prefix block');
    assert.ok(json.includes('"custom_id":"admin_t_prefix_reset"') && json.includes('Reset to d'), 'Reset to d, shown once the server has its own');
    assert.ok(json.includes('Reset Text Rules'), 'the text view names its reset');
    assert.ok(json.includes('"custom_id":"admin_t_check"'), 'Check a Member has its own text copy');
    const { buildCheck } = admin.__testRenderers;
    const off = JSON.stringify(inView('text', () => buildCheck(textView(stored), [], { who: 'r:R_X' }, {})));
    assert.ok(off.includes('**Off**') && off.includes('Off means Dioreo stays silent'), 'the text check reads On / Off');
    const boss = JSON.stringify(inView('text', () => buildCheck(textView(stored), [], { who: 'u:U_9', member: { roleIds: [], isAdmin: true, gate: () => 'private' } }, {})));
    assert.ok(boss.includes('typed commands work for them everywhere') && !boss.includes('Discord keeps'), 'an admin is never off, and Discord\'s slash gates stay out');
    assert.ok(!/"custom_id":"admin_(default|channels|roles|commands|home)/.test(json), 'no slash-view control on the text view');
    const slash = JSON.stringify(inView('slash', () => buildHome(stored, {}, {})));
    assert.ok(slash.includes('"custom_id":"admin_view|text"') && slash.includes('Config Text Commands') && slash.includes('"label":"Private"'), 'the slash view keeps its words and flips to text');
    assert.ok(slash.includes('Reset Slash Rules') && !slash.includes('Reset Everything'), 'the slash view names its reset');
    const doc = new GuildSettings({ guildId: 'G_T', defaultVisibility: 'ephemeral' });
    doc.save = async () => doc;
    const original = GuildSettings.findOne;
    GuildSettings.findOne = () => ({ lean: async () => doc.toObject(), then: ok => ok(doc) });
    guildPolicy.invalidateGuildPolicy('G_T');
    const GuildSettingsLog = require('../models/GuildSettingsLog');
    const realLogCreate = GuildSettingsLog.create;
    const log = [];
    GuildSettingsLog.create = async row => { log.push(row); return row; };
    try {
        const click = async (customId, extra = {}) => {
            const { interaction, calls } = makeInteraction({ isAdmin: true });
            Object.assign(interaction, { guildId: 'G_T', customId, values: [], ...extra });
            await admin.handleComponent(interaction);
            return calls;
        };
        await click('admin_t_default|ephemeral');
        assert.strictEqual(doc.textRules.defaultVisibility, 'ephemeral', 'the text default');
        assert.strictEqual(doc.defaultVisibility, 'ephemeral', 'the slash default is untouched');
        await click('admin_t_ch_public', { values: ['C_9'] });
        assert.deepStrictEqual(doc.textRules.channelRules.map(r => [r.channelId, r.visibility]), [['C_9', 'public']]);
        assert.strictEqual(doc.channelRules.length, 0, 'no slash channel rule');
        const bad = await click('admin_t_prefixm', { fields: { getTextInputValue: () => '/, @' } });
        assert.ok(bad.some(c => c.method === 'reply' && /Nothing was saved/.test(c.options.content)), 'a refused prefix');
        await click('admin_t_prefixm', { fields: { getTextInputValue: () => '!, YO' } });
        assert.deepStrictEqual([...doc.textPrefixes], ['!', 'yo']);
        await new Promise(r => setImmediate(r));
        assert.ok(log.some(r => r.changes.includes('Text commands · Default: On → Off')), JSON.stringify(log.map(r => r.changes)));
        assert.ok(log.some(r => r.changes.includes('Text command prefixes: default → ! yo')));
        await click('admin_t_prefix_reset');
        assert.strictEqual(doc.textPrefixes, undefined, 'Reset to d');
        await click('admin_t_prefixm', { fields: { getTextInputValue: () => '!' } });
        await click('admin_t_reset');
        assert.strictEqual(doc.textPrefixes, undefined, 'the text reset clears the prefix too');
        assert.strictEqual(doc.textRules, undefined, 'the text reset clears the text rules');
        assert.strictEqual(doc.defaultVisibility, 'ephemeral', 'and leaves the slash settings');
    } finally {
        GuildSettings.findOne = original;
        GuildSettingsLog.create = realLogCreate;
        guildPolicy.invalidateGuildPolicy('G_T');
    }
});

t('the /admin panel never pings: every send turns mentions off', async () => {
    const admin = require('../commands/admin');
    const original = GuildSettings.findOne;
    GuildSettings.findOne = () => ({ lean: async () => ({ guildId: 'G_1', roleRules: [{ roleId: 'R', visibility: 'ephemeral', channelIds: [] }] }) });
    guildPolicy.invalidateGuildPolicy('G_1');
    try {
        const { interaction, calls } = makeInteraction({ isAdmin: true });
        Object.assign(interaction, { customId: 'admin_home', values: [] });
        await admin.handleComponent(interaction);
        const sent = calls.find(c => c.options?.body);
        assert.ok(sent, 'the panel was not sent');
        assert.deepStrictEqual(sent.options.body.allowed_mentions, { parse: [] });
    } finally {
        GuildSettings.findOne = original;
        guildPolicy.invalidateGuildPolicy('G_1');
    }
});

// --- 5d. the change log and the private-answer notice (2026-10-22 15:51 EDT) -----------------
t('describeChanges names each change, and an unchanged save logs nothing', () => {
    const { describeChanges } = guildPolicy;
    const before = { defaultVisibility: 'public', channelRules: [{ channelId: 'C1', visibility: 'ephemeral' }], roleRules: [], ephemeralCommands: ['colors'] };
    const after = { defaultVisibility: 'ephemeral', channelRules: [], roleRules: [{ roleId: 'R', visibility: 'public', channelIds: ['C2'] }], ephemeralCommands: ['colors', 'Convert Times'] };
    assert.deepStrictEqual(describeChanges(before, after), [
        'Default: Public → Private',
        'Channel <#C1> rule removed (was Private)',
        'Role rule added: <@&R> Public in <#C2>',
        'Convert Times: own settings added (Private)',
    ]);
    assert.deepStrictEqual(describeChanges(before, before), []);
});

t('every save writes a log row, and a reset adds one rather than clearing the log', async () => {
    const GuildSettingsLog = require('../models/GuildSettingsLog');
    const realCreate = GuildSettingsLog.create;
    const rows = [];
    GuildSettingsLog.create = async row => { rows.push(row); return row; };
    const saved = { guildId: 'G_1', defaultVisibility: 'public', channelRules: [], roleRules: [], ephemeralCommands: ['colors'], save: async () => {} };
    const original = GuildSettings.findOne;
    GuildSettings.findOne = () => saved;
    try {
        await guildPolicy.updateGuildSettings('G_1', 'U_1', doc => { doc.defaultVisibility = 'ephemeral'; });
        await guildPolicy.updateGuildSettings('G_1', 'U_1', doc => { doc.defaultVisibility = 'public'; doc.ephemeralCommands = []; });
        await new Promise(r => setImmediate(r));
    } finally {
        GuildSettingsLog.create = realCreate;
        GuildSettings.findOne = original;
        guildPolicy.invalidateGuildPolicy('G_1');
    }
    assert.strictEqual(rows.length, 2);
    assert.deepStrictEqual(rows[1].changes, ['Default: Private → Public', '/colors: own settings removed, follows the server again']);
    // Nothing in the admin or owner paths deletes log rows: the only deleteMany/deleteOne on the model would be here.
    const fs = require('fs');
    for (const f of ['commands/admin.js', 'commands/bot.js', 'handlers/bot.js', 'utils/guildPolicy.js']) {
        assert.ok(!/GuildSettingsLog\.(deleteMany|deleteOne|findOneAndDelete|remove)/.test(fs.readFileSync(require('path').join(__dirname, '..', f), 'utf8')), `${f} must never delete change-log rows`);
    }
});

t('the private-answer notice shows twice per rule change, only when a public answer was made private', async () => {
    const PolicyNotice = require('../models/PolicyNotice');
    const store = new Map();
    const realFind = PolicyNotice.findOne;
    const realUpdate = PolicyNotice.updateOne;
    PolicyNotice.findOne = q => ({ lean: async () => store.get(`${q.userHash}|${q.guildId}`) || null });
    PolicyNotice.updateOne = async (q, u) => { store.set(`${q.userHash}|${q.guildId}`, { ...u.$set }); };
    const run = async (rulesAt, wasPublic = true) => {
        const { interaction, calls } = makeInteraction({ commandName: 'colors' });
        interaction.isChatInputCommand = () => true;
        interaction.replied = true;
        interaction.dioreoPolicy = { visibility: 'ephemeral', overrodeUser: wasPublic, rulesAt };
        await guildPolicy.sendPolicyNotice(interaction);
        return calls.some(c => c.method === 'followUp');
    };
    try {
        const v1 = new Date('2026-10-22T19:00:00Z');
        assert.deepStrictEqual([await run(v1), await run(v1), await run(v1)], [true, true, false], 'twice, then quiet');
        assert.strictEqual(await run(new Date('2026-10-22T20:00:00Z')), true, 'a newer rule change starts the count again');
        assert.strictEqual(await run(new Date('2026-10-22T21:00:00Z'), false), false, 'an answer the member already wanted private gets no notice');
    } finally {
        PolicyNotice.findOne = realFind;
        PolicyNotice.updateOne = realUpdate;
    }
});

t('the clamp marks an answer that was going to be public', async () => {
    const { interaction } = makeInteraction();
    await withSettings({ defaultVisibility: 'ephemeral' }, async () => { await guildPolicy.attachGuildPolicy(interaction); });
    await interaction.deferReply({ ephemeral: true });
    assert.ok(!interaction.dioreoPolicy.overrodeUser, 'an already-private answer is not an override');
    await interaction.deferReply({ flags: 32768 });
    assert.ok(interaction.dioreoPolicy.overrodeUser, 'a public answer made private is');
});

t('the exported log names channels and roles and keeps the ids', async () => {
    const { buildLogFile } = require('../commands/admin').__testRenderers;
    const guild = { name: 'Test Server', channels: { cache: new Map([['111', { name: 'general' }]]) }, roles: { cache: new Map([['222', { name: 'Mods' }]]) } };
    const interaction = { guild, guildId: 'G_1', client: { users: { fetch: async () => ({ username: 'harkirat' }) } } };
    const text = await buildLogFile(interaction, [{ createdAt: new Date('2026-10-22T19:30:00Z'), actorId: '999', source: 'admin', changes: ['Channel <#111> set to Private', 'Role rule added: <@&222> Public everywhere'] }]);
    assert.ok(text.includes('2026-10-22 19:30 UTC · admin harkirat (999)'));
    assert.ok(text.includes('#general (111)') && text.includes('@Mods (222)'));
});

t('a server rule does nothing while Dioreo is not in that server', async () => {
    const outside = makeInteraction();
    outside.interaction.client.guilds = { cache: new Map() };
    const inside = makeInteraction();
    inside.interaction.client.guilds = { cache: new Map([['G_1', {}]]) };
    await withSettings({ defaultVisibility: 'ephemeral' }, async () => {
        await guildPolicy.attachGuildPolicy(outside.interaction);
        await guildPolicy.attachGuildPolicy(inside.interaction);
    });
    assert.strictEqual(outside.interaction.dioreoPolicy, undefined, 'no policy, no clamp: Discord permissions decide');
    assert.strictEqual(inside.interaction.dioreoPolicy.visibility, 'ephemeral');
    const { buildHome } = require('../commands/admin').__testRenderers;
    assert.ok(JSON.stringify(buildHome({ defaultVisibility: 'ephemeral' }, null, { botInGuild: false })).includes("isn't added to this server"));
});

t("the panel reads Discord's own block and puts it before any /admin rule", () => {
    const { discordGate, buildCheck, buildChannels } = require('../commands/admin').__testRenderers;
    const { PermissionsBitField: P } = require('discord.js');
    const perms = bits => new P(bits);
    const all = P.Flags.UseApplicationCommands | P.Flags.UseExternalApps;
    const guild = {
        roles: { everyone: { id: 'G' }, cache: new Map([['R', { id: 'R' }]]) },
        channels: { cache: new Map([
            ['OPEN', { permissionsFor: () => perms(all) }],
            ['NOAPPS', { permissionsFor: () => perms(P.Flags.UseApplicationCommands) }],
            ['NOCMDS', { permissionsFor: () => perms(0n) }],
        ]) },
    };
    assert.strictEqual(discordGate(guild, 'OPEN'), null);
    assert.strictEqual(discordGate(guild, 'NOAPPS'), 'private');
    assert.strictEqual(discordGate(guild, 'NOCMDS'), 'noCommands');
    const place = { discordGate: (c, r) => discordGate(guild, c, r) };
    const check = JSON.stringify(buildCheck({ defaultVisibility: 'public', channelRules: [{ channelId: 'NOAPPS', visibility: 'public' }] }, [], { who: 'r:R', channelIds: ['NOAPPS', 'OPEN'] }, place));
    assert.ok(check.includes('Discord keeps their answers private in') && check.includes('<#NOAPPS>'), 'Discord blocking apps must show before the rules');
    const page = JSON.stringify(buildChannels({ channelRules: [{ channelId: 'NOAPPS', visibility: 'public' }] }, place));
    assert.ok(page.includes("Discord's own permissions make these private"));
});

// --- 5e. the per-command model (Harkirat 2026-10-22 18:31 EDT) --------------------------------- His own example, 2026-10-22 18:26 EDT, set on /calendar: "hidden everywhere except in channel #a and #b. @roleA is still hidden in channel #a. @roleB is allowed public everywhere. @roleC is public in channel #c but hidden in channel #a." Every cell of the table sent back to him.
t('his /calendar example resolves to the table he was shown', () => {
    const settings = {
        defaultVisibility: 'public',
        commandSettings: [{
            command: 'calendar', defaultVisibility: 'ephemeral',
            channelRules: [{ channelId: 'A', visibility: 'public' }, { channelId: 'B', visibility: 'public' }],
            roleRules: [
                { roleId: 'RA', visibility: 'ephemeral', channelIds: ['A'] },
                { roleId: 'RB', visibility: 'public', channelIds: [] },
                { roleId: 'RC', visibility: 'public', channelIds: ['C'] },
                { roleId: 'RC', visibility: 'ephemeral', channelIds: ['A'] },
            ],
        }],
    };
    const v = (roles, channelId) => guildPolicy.resolveVisibility(settings, { channelId, roleIds: roles, commandName: 'calendar', commandPath: 'calendar' }) === 'public' ? 'P' : 'H';
    const row = roles => ['A', 'B', 'C', 'X'].map(c => v(roles, c)).join('');
    assert.strictEqual(row([]), 'PPHH', 'no role rule');
    assert.strictEqual(row(['RA']), 'HPHH', '@roleA');
    assert.strictEqual(row(['RB']), 'PPPP', '@roleB');
    assert.strictEqual(row(['RC']), 'HPPH', '@roleC');
    // A command without its own settings follows the server.
    assert.strictEqual(guildPolicy.resolveVisibility(settings, { channelId: 'X', roleIds: [], commandName: 'draws', commandPath: 'draws' }), 'public');
    // Admins skip the command's own settings.
    assert.strictEqual(guildPolicy.resolveVisibility(settings, { channelId: 'X', roleIds: [], commandName: 'calendar', commandPath: 'calendar', isAdmin: true }), 'public');
});

t('the Commands tab lists every command in one menu, marked by state, with no button per command', () => {
    const { buildCommands } = require('../commands/admin').__testRenderers;
    const settings = { ephemeralCommands: ['colors'], commandSettings: [{ command: 'calendar', defaultVisibility: 'ephemeral', channelRules: [{ channelId: 'A', visibility: 'public' }], roleRules: [] }, { command: 'help', defaultVisibility: 'public', channelRules: [], roleRules: [] }] };
    const page = buildCommands(settings, ['calendar', 'colors', 'help', 'draws', 'Convert Times'], new Map([['Convert Times', 'message']]));
    assert.ok(!JSON.stringify(page).includes('admin_home||'), 'a button per command looked bad on mobile; the menu replaces it');
    const menu = page.find(c => c.type === 1 && c.components?.[0]?.type === 3).components[0];
    assert.strictEqual(menu.custom_id, 'admin_cmd_open');
    const opt = Object.fromEntries(menu.options.map(o => [o.value, o]));
    assert.deepStrictEqual(['calendar', 'colors', 'help', 'draws'].map(v => opt[v].description), ['Private, 1 exception', 'Private', 'Public', 'Follows server']);
    assert.deepStrictEqual(['calendar', 'colors', 'help', 'draws'].map(v => opt[v].emoji?.name?.slice(0, 3)), ['Red', 'Red', 'Gre', 'Whi'], 'red Private · green Public · white follows');
    assert.strictEqual(opt['Convert Times'].label, 'Convert Times');
    // Past Discord's 25, the missing ones are named (case 5).
    const many = Array.from({ length: 30 }, (_, i) => `cmd${String(i).padStart(2, '0')}`);
    const big = buildCommands({}, many).find(c => c.type === 1 && c.components?.[0]?.type === 3);
    assert.strictEqual(big.components[0].options.length, 25);
});

t('every Clear button sits inside the panel, and Help carries no tabs', () => {
    const { buildChannels, buildRoles, buildRoleScope, buildCommands, buildHelp } = require('../commands/admin').__testRenderers;
    const inPanel = (page, id) => page[0].type === 17 && JSON.stringify(page[0]).includes(id) && !JSON.stringify(page.slice(1)).includes(id);
    assert.ok(inPanel(buildChannels({ channelRules: [{ channelId: 'C', visibility: 'ephemeral' }] }), 'admin_ch_clear'));
    assert.ok(inPanel(buildRoles({ roleRules: [{ roleId: 'R', visibility: 'public', channelIds: [] }] }), 'admin_role_clear'));
    assert.ok(inPanel(buildRoleScope({ roleRules: [{ roleId: 'R', visibility: 'public', channelIds: ['C'] }] }, 'R'), 'admin_role_scope_clear|R'));
    assert.ok(inPanel(buildCommands({ ephemeralCommands: ['colors'] }, ['colors']), 'admin_cmd_clear'));
    const help = buildHelp();
    assert.strictEqual(help.length, 1, 'Help is its own message: the panel only');
    assert.ok(!JSON.stringify(help).includes('admin_'), 'no tabs or buttons on Help');
});

t('a scoped edit changes only that command, starting from the server default', () => {
    const { editTarget, dropCommand } = require('../commands/admin').__testRenderers;
    const doc = { defaultVisibility: 'ephemeral', channelRules: [{ channelId: 'S', visibility: 'public' }], roleRules: [], ephemeralCommands: ['draw'], commandSettings: [] };
    const gateable = ['draw prices', 'draw calculator', 'calendar'];
    // A new command entry starts from the server default and has no exceptions; the server's own rules are untouched.
    const cal = editTarget(doc, 'calendar', gateable);
    assert.deepStrictEqual([cal.defaultVisibility, cal.channelRules.length], ['ephemeral', 0]);
    cal.channelRules = [{ channelId: 'A', visibility: 'public' }];
    assert.strictEqual(doc.channelRules.length, 1, 'the server rules must not change');
    // The older bare 'draw' is split, so Follow Server on /draw prices leaves /draw calculator Hidden.
    dropCommand(doc, 'draw prices', gateable);
    assert.deepStrictEqual(doc.ephemeralCommands, []);
    assert.deepStrictEqual(doc.commandSettings.map(e => `${e.command}:${e.defaultVisibility}`).sort(), ['calendar:ephemeral', 'draw calculator:ephemeral']);
});

t('every scoped page carries its command in each control, and the command Overview offers Follow Server', () => {
    const { buildHome, buildChannels, buildRoles, buildRoleScope } = require('../commands/admin').__testRenderers;
    const settings = { commandSettings: [{ command: 'draw prices', defaultVisibility: 'ephemeral', channelRules: [], roleRules: [{ roleId: 'R', visibility: 'public', channelIds: ['A'] }] }] };
    for (const page of [buildChannels(settings, {}, 'draw prices'), buildRoles(settings, {}, 'draw prices'), buildRoleScope(settings, 'R', {}, 'draw prices')]) {
        const ids = page.filter(c => c.type === 1).flatMap(r => r.components).map(c => c.custom_id).filter(id => /^admin_(ch|role)_/.test(id));
        assert.ok(ids.length && ids.every(id => id.endsWith('|draw prices')), `every edit control must carry the scope: ${ids.join(', ')}`);
    }
    const home = JSON.stringify(buildHome(settings, null, {}, { scope: 'draw prices' }));
    assert.ok(home.includes('admin_cmd_default|follow|draw prices') && home.includes('has its own settings'));
    const fresh = JSON.stringify(buildHome({}, null, {}, { scope: 'colors' }));
    assert.ok(fresh.includes('follows the server settings'));
});

t("Check a Member shows a member's whole picture, no channel needed", () => {
    const { buildCheck } = require('../commands/admin').__testRenderers;
    const settings = {
        defaultVisibility: 'public',
        channelRules: [{ channelId: 'QUIET', visibility: 'ephemeral' }],
        roleRules: [{ roleId: 'MUTED', visibility: 'ephemeral', channelIds: [] }],
        commandSettings: [{ command: 'calendar', defaultVisibility: 'ephemeral', channelRules: [{ channelId: 'A', visibility: 'public' }], roleRules: [] }],
    };
    const member = (roleIds, isAdmin = false, gate = () => null) => ({ id: 'U', roleIds, isAdmin, gate });
    const text = state => JSON.stringify(buildCheck(settings, ['calendar', 'colors'], { channelIds: ['A', 'QUIET', 'BLOCKED'], ...state }));
    const plain = text({ who: 'u:U', member: member([]) });
    assert.ok(plain.includes('Public**') && plain.includes('<#QUIET>'), 'Public everywhere, except the Private channel');
    assert.ok(plain.includes('`/calendar`') && plain.includes('<#A>'), "a command's own settings and its exception are listed");
    assert.ok(text({ who: 'u:U', member: member(['MUTED']) }).includes('Private** everywhere'), "the member's own role decides");
    const admin = text({ who: 'u:U', member: member([], true) });
    assert.ok(admin.includes('Server admin') && !admin.includes('`/calendar`'), 'an admin skips command settings');
    assert.ok(text({ who: 'u:U', member: member([], false, id => (id === 'BLOCKED' ? 'private' : null)) }).includes('Discord keeps their answers private in'));
    assert.ok(text({ who: 'r:MUTED' }).includes('A member with'), 'a role works too');
    assert.ok(text({ error: "That member isn't in this server." }).includes("isn't in this server"));
});

// --- 6. no panel page can exceed the Components V2 ceiling ----------------------------------- 40 components per message, counted RECURSIVELY through containers, sections and rows. Exceeding it is not a soft failure: Discord rejects the whole message (COMPONENT_MAX_TOTAL_COMPONENTS_ EXCEEDED) and the panel simply refuses to open. This repo has already shipped that as a real production crash once (see .claude/rules/rendering-and-ui.md), and every explanatory line added to a panel costs one -- which is exactly the kind of harmless-looking edit that trips it.
function countComponents(nodes) {
    return (nodes || []).reduce((total, node) => total + 1 + countComponents(node.components), 0);
}

t('every /admin page stays under the 40-component ceiling', () => {
    const { buildHome, buildChannels, buildRoles, buildRoleScope, buildCommands, buildHelp, buildCheck } = require('../commands/admin').__testRenderers;
    // A deliberately maximal configuration: the most components each page can possibly render.
    const ids = n => Array.from({ length: n }, (_, i) => `ID_${i}`);
    const settings = {
        defaultVisibility: 'ephemeral',
        channelRules: ids(25).map(channelId => ({ channelId, visibility: 'ephemeral' })),
        roleRules: [
            ...ids(25).map(roleId => ({ roleId, visibility: 'public', channelIds: [] })),
            { roleId: 'R_S', visibility: 'ephemeral', channelIds: ids(25) },
        ],
        ephemeralCommands: ids(25),
    };
    const pages = {
        home: buildHome(settings),
        channels: buildChannels(settings),
        roles: buildRoles(settings),
        roleScope: buildRoleScope(settings, 'R_S'),
        commands: buildCommands(settings, ids(30)),
        help: buildHelp(),
        commandToggles: buildCommands(settings, ids(20)),
        check: buildCheck(settings, ids(30), { who: 'r:ID_1', channelIds: ids(25) }),
        checkMember: buildCheck({ ...settings, commandSettings: ids(10).map(command => ({ command, defaultVisibility: 'ephemeral', channelRules: [], roleRules: [] })) }, ids(30), { who: 'u:ID_9', channelIds: ids(25), member: { id: 'ID_9', roleIds: ['ID_1'], isAdmin: false, gate: () => 'private' } }),
        commandHome: buildHome({ ...settings, commandSettings: [{ command: 'ID_1', defaultVisibility: 'ephemeral', channelRules: settings.channelRules, roleRules: settings.roleRules }] }, null, {}, { scope: 'ID_1' }),
        commandChannels: buildChannels({ commandSettings: [{ command: 'ID_1', defaultVisibility: 'ephemeral', channelRules: settings.channelRules, roleRules: [] }] }, {}, 'ID_1'),
        homeResetArmed: buildHome(settings, null, { guildName: 'A server', guildIcon: 'https://cdn.discordapp.com/icons/1/a.png', channelId: 'C_1' }, { resetArmed: true }),
        homeWithServer: buildHome(settings, null, { guildName: 'A server', guildIcon: 'https://cdn.discordapp.com/icons/1/a.png', channelId: 'C_1' }),
    };
    for (const [name, page] of Object.entries(pages)) {
        const used = countComponents(page);
        assert.ok(used <= 40, `${name} renders ${used} components, over Discord's 40 -- the page would fail to open`);
    }
});

// --- 7. /help hides the Server Admin category from non-admins -------------------------------- Filtered in THREE places -- the dropdown, the landing directory, and the `cmd:` autocomplete -- because the landing directory is a hardcoded string rather than a map over CATEGORY_DEFS, so the two can disagree, and because suggesting `/admin` in autocomplete and then bouncing the user to the directory is worse than never offering it. One test per surface, since filtering two and forgetting the third is the realistic mistake.
async function withNoLoadouts(run) {
    const Loadout = require('../models/Loadout');
    const original = Loadout.distinct;
    Loadout.distinct = async () => [];
    try {
        return await run();
    } finally {
        Loadout.distinct = original;
    }
}

const NOBODY = { serverAdmin: false, botAdmin: false };
const SERVER_ADMIN = { serverAdmin: true, botAdmin: false };
// Per-command keys (manage/bot/botAccess/autobuild) added 2026-08-13, 'bot'/'botAccess' replacing the retired 'alerts'/'audit' 2026-08-16 -- this fixture represents a FULL bot admin (owner or a Mongo-granted admin with `all`), so every one of the four command lines within the Bot Admin category must be individually true too, or commands/help.js's per-command `requires` filtering hides them even though the category shows. `botAccess` is isOwner() in real code, not a token -- true here because this fixture represents the OWNER, the only identity that can ever be true.
const BOT_ADMIN = { serverAdmin: false, botAdmin: true, manage: true, bot: true, botAccess: true, autobuild: true };

// B6 (2026-10-30 00:15 EDT): /help is one page per command now (utils/helpPages.js), and CATEGORY_DEFS' `requires` decides which pages a viewer may open, list in the switcher, or reach through `cmd:`. /bot's subcommands share one /help page with a dropdown since 2026-10-30 14:05 EDT; listed here by subcommand, the pages a viewer can actually open.
const pageNames = async (help, perms) => help.visiblePageNames(perms).flatMap(n => (n === '/bot' ? help.visibleBotSubs(perms) : [n]));
const homeOf = async (help, perms) => JSON.stringify(await help.buildHelpMessage({ perms, client: {}, view: 'slash' }));

t('an ordinary member sees neither /admin nor any Bot Admin page', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        const home = await homeOf(help, NOBODY);
        assert.ok(!home.includes('/admin') && !home.includes('/manage'), 'the home page and its switcher must list neither');
        const names = await help.getAllHelpCommandNames(NOBODY);
        assert.ok(!names.includes('/admin') && !names.includes('/manage'), 'autocomplete must suggest neither');
        assert.ok(!(await pageNames(help, NOBODY)).includes('/admin'));
    });
});

t('a server admin sees /admin, and Manage Server grants no Bot Admin page', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        const home = await homeOf(help, SERVER_ADMIN);
        assert.ok(home.includes('/admin'), 'the home page must list /admin');
        assert.ok(!home.includes('/manage'), 'Manage Server must NOT grant the bot-admin pages');
        assert.ok((await help.getAllHelpCommandNames(SERVER_ADMIN)).includes('/admin'));
        assert.strictEqual(await help.resolvePage('/admin', SERVER_ADMIN), '/admin');
    });
});

// The two levels are independent, not a hierarchy: this is the case that would break if `requires` were ever collapsed back into one boolean.
t('a bot admin sees the Bot Admin pages without holding Manage Server', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        const names = await pageNames(help, BOT_ADMIN);
        for (const n of ['/manage', '/bot analytics', '/bot access', '/autobuild']) assert.ok(names.includes(n), `missing ${n}`);
        assert.ok(!names.includes('/admin'), 'bot admin alone must NOT reveal the server-admin command');
        const all = await help.getAllHelpCommandNames(BOT_ADMIN);
        assert.ok(all.includes('/manage') && !all.includes('/admin'));
    });
});

t('every page a full admin can open renders, in each of its views', async () => {
    const help = require('../commands/help');
    const H = require('../utils/helpPages');
    const ALL = { serverAdmin: true, botAdmin: true, manage: true, bot: true, botAccess: true, autobuild: true };
    await withNoLoadouts(async () => {
        for (const name of help.visiblePageNames(ALL)) for (const view of H.hasTextView(name) ? ['text', 'slash'] : ['slash']) {
            const text = JSON.stringify(await help.buildHelpMessage({ perms: ALL, client: {}, cmd: name, view }));
            assert.ok(!text.includes('undefined'), `${name} ${view} renders "undefined"`);
            assert.ok(text.includes(H.PAGE_NAMES[name]), `${name} ${view} rendered no title`);
        }
    });
});

t('a non-admin reaching a restricted page is returned to the home page, not refused', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        assert.strictEqual(await help.resolvePage('/manage', NOBODY), null);
        const page = JSON.stringify(await help.buildHelpMessage({ perms: NOBODY, client: {}, cmd: '/manage', view: 'slash' }));
        assert.ok(page.includes("Dioreo's Commands"), 'expected the home page');
        assert.ok(!page.includes('Manage Data'), 'the restricted page must not render');
    });
});

// Wait for every async case to actually finish before reporting. This used to be a 50ms setTimeout, which is a race dressed up as a drain -- it reported whatever had happened to complete by then.
(async () => {
    await Promise.all(pending);
    if (failures.length) {
        console.error(`❌ guildPolicy enforcement: ${failures.length} case(s) failed\n  - ${failures.join('\n  - ')}`);
        process.exit(1);
    }
    console.log(`✅ guildPolicy enforcement: ${pass} cases passed`);
    // Mongoose keeps a connection-buffer timer alive even though nothing here connects; without this the process would hang after a clean pass.
    process.exit(0);
})();
