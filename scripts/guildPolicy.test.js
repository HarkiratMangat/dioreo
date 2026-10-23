// scripts/guildPolicy.test.js
//
// Precedence tests for utils/guildPolicy.js's resolveVisibility() -- the v3 server-admin response-visibility policy. Run by `npm test`.
//
// WHY THIS EXISTS AS A TEST RATHER THAN A CAREFUL READ: the resolver is a pure function with SIX tiers, two of which (a channel-scoped role rule, and the admin bypass) only differ from their neighbours in cases nobody exercises by hand. Every configuration Harkirat named while designing this is pinned below, so a later change to one tier cannot quietly reorder another. If you change the precedence order, a case here must change with it -- that is the point.
//
// Design + the reasoning behind each tier: .claude/rules/admin-controls.md and docs/superpowers/specs/2026-08-10-server-admin-visibility-policy-design.md
const { resolveVisibility } = require('../utils/guildPolicy');

let pass = 0;
const failures = [];

function t(name, got, want) {
    if (got === want) { pass++; return; }
    failures.push(`${name}: got "${got}", expected "${want}"`);
}

// One settings document exercising every tier at once, so a case cannot pass by accident of an empty rule list somewhere else.
const SETTINGS = {
    defaultVisibility: 'ephemeral',
    channelRules: [{ channelId: 'C_PUB', visibility: 'public' }],
    roleRules: [
        { roleId: 'R_ALL', visibility: 'public', channelIds: [] },
        { roleId: 'R_SOME', visibility: 'public', channelIds: ['C_A', 'C_B'] },
        { roleId: 'R_MUTE', visibility: 'ephemeral', channelIds: [] },
    ],
    ephemeralCommands: ['colors'],
};

// --- the baseline: no configuration at all ------------------------------------------------- A server that has never touched /admin has no document, and must behave exactly as before this feature existed. This is the case that runs in every server, so it is the one that matters most.
t('no settings document -> public', resolveVisibility(null, { channelId: 'X', roleIds: [] }), 'public');

// --- tier 5: the server default ------------------------------------------------------------
t('default applies with no matching rule', resolveVisibility(SETTINGS, { channelId: 'X', roleIds: [] }), 'ephemeral');

// --- tier 4: channel rules beat the default ------------------------------------------------
t('channel rule beats default', resolveVisibility(SETTINGS, { channelId: 'C_PUB', roleIds: [] }), 'public');

// --- tier 3: an unscoped role rule beats any channel rule ---------------------------------- Harkirat's "@roleA is allowed it publicly in all channels" while the server default is ephemeral.
t('server-wide role rule beats default', resolveVisibility(SETTINGS, { channelId: 'X', roleIds: ['R_ALL'] }), 'public');
// The same tier in the other direction: a muted role stays muted in a channel that is public for everyone else. If this ever flips, a role-level quiet has silently stopped working.
t('server-wide role rule beats channel rule', resolveVisibility(SETTINGS, { channelId: 'C_PUB', roleIds: ['R_MUTE'] }), 'ephemeral');

// --- tier 2: a channel-scoped role rule is the most specific -------------------------------- Harkirat's "@roleB is allowed it publicly in some select channels".
t('scoped role rule applies inside its scope', resolveVisibility(SETTINGS, { channelId: 'C_A', roleIds: ['R_SOME'] }), 'public');
t('scoped role rule is silent outside its scope', resolveVisibility(SETTINGS, { channelId: 'C_Z', roleIds: ['R_SOME'] }), 'ephemeral');
t('scoped rule beats an unscoped rule on another role', resolveVisibility(SETTINGS, { channelId: 'C_A', roleIds: ['R_SOME', 'R_MUTE'] }), 'public');

// --- same-tier conflict resolves to public -------------------------------------------------- Mirrors Discord's own role-overwrite semantics, where an explicit allow beats a deny. An admin who needs a hard quiet removes the grant rather than fighting it from a less specific tier.
t('two conflicting roles at one tier -> public', resolveVisibility(SETTINGS, { channelId: 'X', roleIds: ['R_ALL', 'R_MUTE'] }), 'public');

// --- tier 1: command rules sit ABOVE channel and role ---------------------------------------
t('command rule beats every other rule', resolveVisibility(SETTINGS, { channelId: 'C_PUB', roleIds: ['R_ALL'], commandName: 'colors' }), 'ephemeral');
t('a command not named is unaffected', resolveVisibility(SETTINGS, { channelId: 'C_PUB', roleIds: [], commandName: 'draws' }), 'public');
// Component interactions carry no command name, so the tier is skipped rather than misapplied.
t('no command name skips the command tier', resolveVisibility(SETTINGS, { channelId: 'C_PUB', roleIds: ['R_ALL'] }), 'public');

// --- per-subcommand rules (2026-10-22 14:01 EDT, Harkirat: "per subcommand") --------------- A rule names one subcommand ('draw calculator'), so its sibling stays public. A bare name stored before then ('draw') still covers every subcommand, or upgrading would silently un-hide answers a server had hidden.
const PER_SUB = { defaultVisibility: 'public', ephemeralCommands: ['draw calculator', 'season'] };
t('a subcommand rule hides that subcommand', resolveVisibility(PER_SUB, { channelId: 'X', roleIds: [], commandName: 'draw', commandPath: 'draw calculator' }), 'ephemeral');
t('a subcommand rule leaves its sibling public', resolveVisibility(PER_SUB, { channelId: 'X', roleIds: [], commandName: 'draw', commandPath: 'draw prices' }), 'public');
t('an older bare-name rule still covers every subcommand', resolveVisibility(PER_SUB, { channelId: 'X', roleIds: [], commandName: 'season', commandPath: 'season end' }), 'ephemeral');
t('a right-click command (no subcommand) matches its own name', resolveVisibility({ ...PER_SUB, ephemeralCommands: ['Convert Times'] }, { channelId: 'X', roleIds: [], commandName: 'Convert Times', commandPath: 'Convert Times' }), 'ephemeral');
t('the admin bypass still covers a subcommand rule', resolveVisibility(PER_SUB, { channelId: 'X', roleIds: [], commandName: 'draw', commandPath: 'draw calculator', isAdmin: true }), 'public');

// commandPaths: the menu's keys, from the JSON that is registered.
const { commandPaths } = require('../utils/guildPolicy');
const same = (name, got, want) => t(name, JSON.stringify(got), JSON.stringify(want));
same('a plain command is its own key', commandPaths({ name: 'colors', options: [{ type: 3, name: 'visibility' }] }), ['colors']);
same('a command with subcommands gets one key each', commandPaths({ name: 'draw', options: [{ type: 1, name: 'prices' }, { type: 1, name: 'calculator' }] }), ['draw prices', 'draw calculator']);
same('a subcommand group gets name group sub', commandPaths({ name: 'x', options: [{ type: 2, name: 'g', options: [{ type: 1, name: 's' }] }] }), ['x g s']);
same('a right-click command is its bare name', commandPaths({ name: 'View Colors', type: 2 }), ['View Colors']);

// explainVisibility names the tier that decided; resolveVisibility is its answer, so these also pin the two together.
const { explainVisibility } = require('../utils/guildPolicy');
t('explain: the command tier', explainVisibility(PER_SUB, { channelId: 'X', roleIds: [], commandName: 'draw', commandPath: 'draw calculator' }).tier, 'command');
t('explain: a scoped role rule', explainVisibility(SETTINGS, { channelId: 'C_A', roleIds: ['R_SOME'] }).tier, 'roleChannel');
t('explain: a server-wide role rule', explainVisibility(SETTINGS, { channelId: 'X', roleIds: ['R_MUTE'] }).tier, 'role');
t('explain: a channel rule', explainVisibility(SETTINGS, { channelId: 'C_PUB', roleIds: [] }).tier, 'channel');
t('explain: a thread following its parent', explainVisibility(SETTINGS, { channelId: 'T_1', parentChannelId: 'C_PUB', roleIds: [] }).tier, 'parent');
t('explain: the default', explainVisibility(SETTINGS, { channelId: 'X', roleIds: [] }).tier, 'default');
t('explain: a same-tier conflict names the public rule', explainVisibility(SETTINGS, { channelId: 'X', roleIds: ['R_MUTE', 'R_ALL'] }).rule.roleId, 'R_ALL');

// --- threads inherit their parent channel's rule --------------------------------------------- Found by deriving angles before shipping, not by a failing check -- nothing in this repo could have caught it, because every case above passes channelId as an opaque string and so cannot tell a thread id from a channel id. In a real thread, interaction.channelId is the THREAD's id, so without inheritance an admin's rule on #general silently stops applying the moment conversation moves into a thread of #general -- failing OPEN, in a feature whose whole job is to restrict.
t('a thread inherits its parent channel rule', resolveVisibility(SETTINGS, { channelId: 'T_1', parentChannelId: 'C_PUB', roleIds: [] }), 'public');
t('a thread with no parent rule falls through to default', resolveVisibility(SETTINGS, { channelId: 'T_1', parentChannelId: 'C_OTHER', roleIds: [] }), 'ephemeral');
// The thread's OWN rule is the more specific statement and must beat the inherited one -- an admin who singles out one noisy thread inside an otherwise-public channel has to be able to.
t('a rule on the thread itself beats the inherited one', resolveVisibility(
    { ...SETTINGS, channelRules: [{ channelId: 'C_PUB', visibility: 'public' }, { channelId: 'T_1', visibility: 'ephemeral' }] },
    { channelId: 'T_1', parentChannelId: 'C_PUB', roleIds: [] },
), 'ephemeral');
// Channel-scoped ROLE rules inherit the same way, or the two tiers disagree about what "in this channel" means -- which would be worse than either answer alone.
t('a channel-scoped role rule reaches the parent’s threads', resolveVisibility(SETTINGS, { channelId: 'T_2', parentChannelId: 'C_A', roleIds: ['R_SOME'] }), 'public');
t('a non-thread interaction is unaffected by inheritance', resolveVisibility(SETTINGS, { channelId: 'C_PUB', parentChannelId: null, roleIds: [] }), 'public');

// --- tier 0: the admin bypass, and its deliberate narrowness --------------------------------
t('admin bypasses the command rule', resolveVisibility(SETTINGS, { channelId: 'C_PUB', roleIds: ['R_ALL'], commandName: 'colors', isAdmin: true }), 'public');
// The bypass covers the COMMAND tier only. An admin is still bound by the channel and role rules they set for the whole server, themselves included -- if this ever returns 'public', the bypass has widened into "admins are exempt from their own configuration".
t('admin is still bound by channel/role rules', resolveVisibility(SETTINGS, { channelId: 'X', roleIds: [], commandName: 'colors', isAdmin: true }), 'ephemeral');

if (failures.length) {
    console.error(`❌ guildPolicy: ${failures.length} precedence case(s) failed\n  - ${failures.join('\n  - ')}`);
    process.exit(1);
}
console.log(`✅ guildPolicy: ${pass} precedence cases passed`);
