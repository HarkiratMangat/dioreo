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
t('the Commands page labels subcommands in full and right-click commands without a slash, as toggles and as a menu', () => {
    const { buildCommands } = require('../commands/admin').__testRenderers;
    // Up to 20 commands: one toggle button each, red when hidden. An older bare "draw" rule shows both /draw subcommands red.
    const page = buildCommands({ ephemeralCommands: ['draw'] }, ['draw prices', 'draw calculator', 'Convert Times', 'colors'], new Map([['Convert Times', 'message']]));
    const buttons = page.filter(c => c.type === 1).flatMap(r => r.components).filter(b => b.custom_id?.startsWith('admin_cmd_toggle|'));
    const byId = Object.fromEntries(buttons.map(b => [b.custom_id.split('|')[1], b]));
    assert.strictEqual(buttons.length, 4);
    assert.strictEqual(byId['draw prices'].label, '/draw prices');
    assert.strictEqual(byId['Convert Times'].label, 'Convert Times');
    assert.ok(byId['draw prices'].style === 4 && byId['draw calculator'].style === 4, 'an older bare "draw" rule must show every /draw subcommand as hidden');
    assert.strictEqual(byId.colors.style, 2);
    // Past 20 the dropdown returns, with the right-click line in the option's description.
    const many = [...Array.from({ length: 21 }, (_, i) => `c${String(i).padStart(2, '0')}`), 'Convert Times'];
    const menu = buildCommands({}, many, new Map([['Convert Times', 'message']])).find(c => c.type === 1 && c.components?.[0]?.type === 3);
    assert.ok(menu, 'over 20 commands must fall back to the dropdown');
    assert.strictEqual(menu.components[0].options.find(o => o.value === 'Convert Times').description, 'Right-click a message');
});

t('a toggle splits an older bare-name rule, so flipping one subcommand leaves the other hidden', async () => {
    const admin = require('../commands/admin');
    const saved = { guildId: 'G_1', ephemeralCommands: ['draw'], save: async () => {} };
    const original = GuildSettings.findOne;
    GuildSettings.findOne = () => saved;
    try {
        const { interaction } = makeInteraction({ isAdmin: true });
        Object.assign(interaction, { customId: 'admin_cmd_toggle|draw prices', values: [] });
        interaction.client.gateableCommandNames = ['draw prices', 'draw calculator', 'colors'];
        await admin.handleComponent(interaction);
    } finally {
        GuildSettings.findOne = original;
        guildPolicy.invalidateGuildPolicy('G_1');
    }
    assert.deepStrictEqual([...saved.ephemeralCommands], ['draw calculator']);
});

t('Check a Member names the rule that decided', () => {
    const { buildCheck } = require('../commands/admin').__testRenderers;
    const settings = { defaultVisibility: 'public', ephemeralCommands: ['draw calculator'], roleRules: [{ roleId: 'R', visibility: 'ephemeral', channelIds: [] }], channelRules: [] };
    const text = page => JSON.stringify(page);
    assert.ok(text(buildCheck(settings, ['draw calculator', 'colors'], { roleId: 'R', channelId: 'C' })).includes('is Hidden everywhere'));
    assert.ok(text(buildCheck(settings, ['draw calculator', 'colors'], { channelId: 'C', cmd: 'draw calculator' })).includes('is a hidden command'));
    assert.ok(text(buildCheck(settings, ['draw calculator', 'colors'], { channelId: 'C' })).includes('server default decides'));
});

t('saving the menu replaces an older bare-name rule, so unticking a subcommand un-hides it', async () => {
    const admin = require('../commands/admin');
    const saved = { guildId: 'G_1', ephemeralCommands: ['draw', 'Old Gone Command'], save: async () => {} };
    const original = GuildSettings.findOne;
    GuildSettings.findOne = () => saved;
    try {
        const { interaction } = makeInteraction({ isAdmin: true });
        Object.assign(interaction, { customId: 'admin_cmd_select', values: ['draw calculator'] });
        interaction.client.gateableCommandNames = ['draw prices', 'draw calculator', 'colors'];
        await admin.handleComponent(interaction);
    } finally {
        GuildSettings.findOne = original;
        guildPolicy.invalidateGuildPolicy('G_1');
    }
    assert.deepStrictEqual([...saved.ephemeralCommands].sort(), ['Old Gone Command', 'draw calculator'], 'the bare "draw" must go; a rule the menu could not show must stay');
});

t('a bare-name rule whose subcommands fall past the 25-option cut stays hidden for those subcommands', async () => {
    const admin = require('../commands/admin');
    // 25 commands sort ahead of 'zz', so both of its subcommands are cut from the menu.
    const fill = Array.from({ length: 25 }, (_, i) => `a${String(i).padStart(2, '0')}`);
    const saved = { guildId: 'G_1', ephemeralCommands: ['zz'], save: async () => {} };
    const original = GuildSettings.findOne;
    GuildSettings.findOne = () => saved;
    try {
        const { interaction } = makeInteraction({ isAdmin: true });
        Object.assign(interaction, { customId: 'admin_cmd_select', values: [] });
        interaction.client.gateableCommandNames = [...fill, 'zz one', 'zz two'];
        await admin.handleComponent(interaction);
    } finally {
        GuildSettings.findOne = original;
        guildPolicy.invalidateGuildPolicy('G_1');
    }
    assert.deepStrictEqual([...saved.ephemeralCommands].sort(), ['zz one', 'zz two'], 'subcommands the menu could not show must keep the bare rule, as full paths');
});

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
    const saved = { guildId: '123456789012345678', defaultVisibility: 'ephemeral', channelRules: [{ channelId: 'C', visibility: 'ephemeral' }], roleRules: [], ephemeralCommands: ['colors'], save: async () => {} };
    const original = GuildSettings.findOne;
    GuildSettings.findOne = () => ({ lean: async () => saved, then: (ok) => ok(saved) });
    try {
        // A non-owner is refused before anything is read or written.
        adminAccess.isOwner = () => false;
        const denied = makeInteraction();
        Object.assign(denied.interaction, { customId: 'bot_srv_reset|123456789012345678', isButton: () => true, deferUpdate: async () => {}, client: { ...denied.interaction.client, guilds: { cache: new Map() } } });
        await handleBotInteraction(denied.interaction);
        assert.ok(denied.calls.some(c => c.method === 'reply' && /Only the bot owner/.test(c.options.content)));
        assert.strictEqual(saved.channelRules.length, 1, 'a refused click must not change anything');
        // The owner resets.
        adminAccess.isOwner = () => true;
        const owner = makeInteraction();
        Object.assign(owner.interaction, { customId: 'bot_srv_reset|123456789012345678', isButton: () => true, deferUpdate: async () => {}, deferred: true, client: { ...owner.interaction.client, guilds: { cache: new Map() } } });
        await handleBotInteraction(owner.interaction);
        assert.deepStrictEqual([saved.channelRules.length, saved.ephemeralCommands.length, saved.defaultVisibility], [0, 0, 'public']);
        assert.strictEqual(logged.length, 1);
        assert.ok(/Before: .*Hidden/.test(logged[0].summary), 'the log must carry the rules as they were');
    } finally {
        adminAccess.isOwner = realOwner;
        changeStore.recordChange = realRecord;
        GuildSettings.findOne = original;
        guildPolicy.invalidateGuildPolicy('123456789012345678');
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
        check: buildCheck(settings, ids(30), { roleId: 'ID_1', channelId: 'ID_2', cmd: 'ID_3' }),
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

t('an ordinary member sees neither /admin nor the Bot Admin category', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        const menu = JSON.stringify(await help.buildContainer(null, 0, NOBODY));
        assert.ok(!menu.includes('/admin'), 'the landing directory must not list /admin');
        assert.ok(!menu.includes('Bot Admin') && !menu.includes('BOT ADMIN'), 'the Bot Admin category must be absent entirely');
        const names = await help.getAllHelpCommandNames(NOBODY);
        assert.ok(!names.includes('/admin') && !names.includes('/manage'), 'autocomplete must suggest neither');
    });
});

// /admin sits INSIDE Preferences rather than in a heading of its own, so the assertions are about the category's contents changing -- not about a category appearing.
t('a server admin sees /admin inside Preferences, with the swapped emoji and description', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        const container = await help.buildContainer(null, 0, SERVER_ADMIN);
        const menu = JSON.stringify(container);
        assert.ok(menu.includes('/admin'), 'the landing directory must list /admin');
        assert.ok(!menu.includes('SERVER ADMIN'), 'it must NOT get a heading of its own any more');
        assert.ok(menu.includes('(server)'), '/admin must be marked as an admin command');
        assert.ok(!menu.includes('Bot Admin'), 'Manage Server must NOT grant the bot-admin category');

        const select = container.components.find(c => c.type === 1 && c.components?.[0]?.type === 3);
        const preferences = select.components[0].options.find(o => o.label === 'Preferences');
        assert.strictEqual(preferences.description, 'Manage your personal & server admin settings');
        assert.strictEqual(preferences.emoji.name, 'ServerSettings', 'Preferences must swap to the ServerSettings emoji');

        assert.ok((await help.getAllHelpCommandNames(SERVER_ADMIN)).includes('/admin'));
    });
});

t('a plain member sees the ordinary Preferences emoji and description', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        const container = await help.buildContainer(null, 0, NOBODY);
        const select = container.components.find(c => c.type === 1 && c.components?.[0]?.type === 3);
        const preferences = select.components[0].options.find(o => o.label === 'Preferences');
        assert.strictEqual(preferences.description, 'Manage your saved bot settings');
        assert.strictEqual(preferences.emoji.name, 'Settings');
    });
});

// The two levels are independent, not a hierarchy: this is the case that would break if `requires` were ever collapsed back into one boolean.
t('a bot admin sees the Bot Admin category without holding Manage Server', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        const menu = JSON.stringify(await help.buildContainer(null, 0, BOT_ADMIN));
        assert.ok(menu.includes('BOT ADMIN'), 'the landing directory must list the category');
        assert.ok(menu.includes('/manage') && menu.includes('/bot analytics') && menu.includes('/bot access') && menu.includes('/autobuild'));
        assert.ok(!menu.includes('/admin'), 'bot admin alone must NOT reveal the server-admin command');
        const names = await help.getAllHelpCommandNames(BOT_ADMIN);
        assert.ok(names.includes('/manage') && !names.includes('/admin'));
    });
});

// CATEGORY_DEFS is now the single source for the dropdown, the landing directory and autocomplete, so a category can no longer be half-added to the LIST. What it can still be half-added to is the detail page: BODY_BUILDERS and DETAIL_HEADERS are separate objects keyed by the same strings, and a category present in the array but missing from either renders `undefined` as its heading or throws outright when someone picks it. Rendering every declared category is the cheapest check that covers both, and it needs no knowledge of either object's internals.
t('every declared category renders a detail page', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        for (const category of help.CATEGORY_DEFS) {
            const page = await help.buildContainer(category.key, 0, { serverAdmin: true, botAdmin: true, manage: true, bot: true, botAccess: true, autobuild: true });
            const text = JSON.stringify(page);
            assert.ok(!text.includes('undefined'), `${category.key} renders "undefined" -- it is missing from DETAIL_HEADERS or BODY_BUILDERS`);
            assert.ok(text.includes(category.label) || text.includes(category.staticCommands[0].name), `${category.key} rendered no recognisable content`);
        }
    });
});

t('a non-admin reaching a restricted page is returned to the directory, not refused', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        const page = JSON.stringify(await help.buildContainer('botadmin', 0, NOBODY));
        assert.ok(page.includes('GUNSMITH'), 'expected the landing directory');
        assert.ok(!page.includes('/manage'), 'the restricted body must not render');
    });
});

// The per-COMMAND gate is a different code path from the per-CATEGORY one, and its failure is quieter: Preferences renders either way, just with an extra line. Asserting on the body rather than the category is the only way to see it.
t('a non-admin opening Preferences gets no /admin section in the body', async () => {
    const help = require('../commands/help');
    await withNoLoadouts(async () => {
        const plain = JSON.stringify(await help.buildContainer('preferences', 0, NOBODY));
        const admin = JSON.stringify(await help.buildContainer('preferences', 0, SERVER_ADMIN));
        assert.ok(!plain.includes('/admin') && !plain.includes('Manage Server'), 'the /admin section must be absent');
        assert.ok(admin.includes('/admin') && admin.includes('Manage Server'), 'the /admin section must be present for an admin');
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
