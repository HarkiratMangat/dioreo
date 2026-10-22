// utils/guildPolicy.js
//
// Resolves one server's response-visibility policy for one interaction, and enforces it.
//
// THE MODEL, in one line: a server can quiet the bot, never make someone louder than they chose to be. An 'ephemeral' verdict is a CEILING -- it overrides the user's `visibility` option and their saved UserPreference. A 'public' verdict only PERMITS a public response; the user's own choice still decides. So a server rule can never rewrite a personal preference, only constrain where and how loudly the bot speaks. Full design + the rejected alternatives: docs/superpowers/specs/2026-08-10-server-admin-visibility-policy-design.md
//
// ⚠️ NOTHING HERE REFUSES A COMMAND, and that is a platform limit, not a scoping decision. A bot cannot hide a global slash command inside one guild: guild-scoped registration does not delete global commands, Discord merges both sets, and per-command permissions can only be written with an OAuth2 bearer token from a MANAGE_GUILD user. Admins already hold that lever natively in Server Settings -> Integrations. So every tier below resolves to public-or-ephemeral, and a future session should not "finish" this by adding a refusal path -- see models/GuildSettings.js.
//
// ⚠️ WHY THE ENFORCEMENT IS A METHOD WRAP AND NOT A PER-COMMAND CHECK. The obvious design is to make utils/ephemeral.js's resolveEphemeral() policy-aware and pass the policy in. It was built that way first and then removed: resolveEphemeral is called by only a handful of commands -- /help, /timestamp, and /colors were the original three; the eight per-category weapon commands this sentence used to name were retired in the 2026-08-15 /gunsmith consolidation and /colors.js still calls resolveEphemeral directly (v3-pre-release review, finding #60) -- so it would have been an optional argument at nine sites where FORGETTING it looks exactly like passing it, silently un-clamping a server's rule. Instead there are two choke points nothing routes around: attachGuildPolicy() wraps reply/deferReply/followUp on the interaction itself, and utils/sendV2Payload.js strips the "Show Everyone" row on the way out. Same reasoning as utils/logger.js's patchConsole(): one patch that cannot be forgotten beats a rule that must be remembered.
const { PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../models/GuildSettings');

// MessageFlags.Ephemeral. Spelled as a literal rather than imported because it gets OR-ed into the Components V2 flag (32768) below, and seeing `| 64` next to `32768` makes the arithmetic legible.
const EPHEMERAL_FLAG = 64;

// Per-guild settings cache. A policy lookup sits in front of EVERY interaction, so an uncached design would put a Mongo round trip on the hot path of every command in every server. Entries are invalidated explicitly whenever /admin writes, so the TTL is only a backstop against another process (a second bot instance, a manual DB edit) changing the document underneath us.
const CACHE_TTL_MS = 5 * 60 * 1000;
const policyCache = new Map();

function cachePut(guildId, settings) {
    policyCache.set(guildId, { settings, expires: Date.now() + CACHE_TTL_MS });
    return settings;
}

function invalidateGuildPolicy(guildId) {
    policyCache.delete(guildId);
}

// Returns the guild's settings document, or `null` when that server has never configured anything. A null is CACHED deliberately: the overwhelmingly common case is a server with no rules at all, and caching only the hits would leave exactly that case hitting Mongo on every interaction.
async function getGuildSettings(guildId) {
    if (!guildId) return null;
    const hit = policyCache.get(guildId);
    if (hit && hit.expires > Date.now()) return hit.settings;
    const settings = await GuildSettings.findOne({ guildId }).lean();
    return cachePut(guildId, settings || null);
}

// The member's role ids, from whichever shape the interaction carries. discord.js gives a real GuildMember (roles.cache) when the guild is cached, and a raw APIInteractionGuildMember (roles as a plain id array) otherwise -- the raw shape is the norm for a user-installed invocation, which arrives without the guild's member cache.
function memberRoleIds(interaction) {
    const member = interaction.member;
    if (!member) return [];
    if (Array.isArray(member.roles)) return member.roles;
    if (member.roles?.cache) return [...member.roles.cache.keys()];
    return [];
}

// "Is this invoker a server admin?" -- answered from the interaction payload, which already carries the member's COMPUTED permissions, so the common path costs zero REST calls and needs no privileged intent. (The GUILD_MEMBERS intent gates *enumerating* members; this never does that.) The ownerId fallback covers a server owner whose permission bits somehow do not include the administrator flag, and is skipped silently when the guild is uncached.
function isServerAdmin(interaction) {
    if (!interaction.guildId) return false;
    if (interaction.guild?.ownerId && interaction.guild.ownerId === interaction.user.id) return true;
    const perms = interaction.memberPermissions;
    if (!perms) return false;
    return perms.has(PermissionFlagsBits.Administrator) || perms.has(PermissionFlagsBits.ManageGuild);
}

// PRECEDENCE, highest first (Harkirat's call, 2026-08-10 15:47 EDT):
//   0. ADMIN BYPASS -- owner / Administrator / MANAGE_GUILD skip tier 1 entirely and resolve from tier 2 down. Deliberately narrow: it exempts them from the COMMAND rule only, never from the channel or role rules, because those they set for the whole server including themselves.
//   1. a command rule (settings.ephemeralCommands) -- above channel and role, not below
//   2. a role rule scoped to THIS channel
//   3. a role rule with no channel scope
//   4. a channel rule for this channel
//   5. defaultVisibility
// A same-tier conflict (the member holds two roles disagreeing at the same level) resolves to 'public', mirroring Discord's own role-overwrite semantics where an explicit allow beats a deny -- so admins already hold the right intuition. An admin who needs a hard quiet removes the role grant rather than fighting it from a less specific tier. ⚠️ THREADS INHERIT THEIR PARENT CHANNEL'S RULE, and forgetting that was a real hole found before this shipped. In a thread, `interaction.channelId` is the THREAD's id, not the channel it lives under -- so an admin who sets #general to Hidden gets no rule match inside a thread of #general and the answer posts PUBLICLY. It fails in the permissive direction, which is the dangerous one for a moderation feature, and threads are created continuously so an admin can never pre-empt them by listing each one. `parentChannelId` comes free from the interaction payload (`interaction.channel.parentId`) -- no REST call, no intent. A rule on the thread ITSELF still wins over the inherited one, since that is the more specific statement.
function channelMatcher(channelId, parentChannelId) {
    return id => id === channelId || (parentChannelId != null && id === parentChannelId);
}

// The rule keys /admin's Commands menu offers for one registered command: one per subcommand ('draw prices', 'draw calculator'), one per grouped subcommand ('name group sub'), or the bare name for a command with neither, a right-click command included. Per subcommand since 2026-10-22 14:01 EDT (Harkirat: "per subcommand"), so a server can hide /draw calculator and keep /draw prices public. Pure, so bot/registry.js can derive the menu from the exact JSON it registers.
function commandPaths(json) {
    if (!json?.name) return [];
    if (json.type && json.type !== 1) return [json.name];
    const paths = [];
    for (const o of json.options || []) {
        if (o.type === 1) paths.push(`${json.name} ${o.name}`);
        if (o.type === 2) for (const sub of o.options || []) paths.push(`${json.name} ${o.name} ${sub.name}`);
    }
    return paths.length ? paths : [json.name];
}

// The full path of the command an interaction ran ('draw prices'), or its bare name. Context-menu and component interactions have no subcommand, and a context menu's options resolver may not offer the getters at all, hence the optional calls.
function commandPathOf(interaction) {
    if (!interaction.commandName) return null;
    let group = null;
    let sub = null;
    try {
        group = interaction.options?.getSubcommandGroup?.(false) ?? null;
        sub = interaction.options?.getSubcommand?.(false) ?? null;
    } catch { /* no subcommand on this interaction */ }
    return [interaction.commandName, group, sub].filter(Boolean).join(' ');
}

// A command's own settings, if it has any: a commandSettings entry for the full path, then for the bare name ('draw' still covering 'draw prices'), then the older ephemeralCommands form (Hidden everywhere, no exceptions). Null when the command follows the server-wide settings.
function commandEntry(settings, path) {
    if (!settings || !path) return null;
    const bare = path.split(' ')[0];
    const own = settings.commandSettings || [];
    const hit = own.find(e => e.command === path) || own.find(e => e.command === bare);
    if (hit) return { command: hit.command, defaultVisibility: hit.defaultVisibility || 'ephemeral', channelRules: hit.channelRules || [], roleRules: hit.roleRules || [] };
    const legacy = settings.ephemeralCommands || [];
    const old = legacy.includes(path) ? path : (legacy.includes(bare) ? bare : null);
    return old ? { command: old, defaultVisibility: 'ephemeral', channelRules: [], roleRules: [], legacy: true } : null;
}

// Every command with its own settings, the older form included, one entry each.
function commandEntries(settings) {
    const seen = new Set();
    const out = [];
    for (const e of settings?.commandSettings || []) { seen.add(e.command); out.push(commandEntry({ commandSettings: [e] }, e.command)); }
    for (const c of settings?.ephemeralCommands || []) if (!seen.has(c)) { seen.add(c); out.push(commandEntry({ ephemeralCommands: [c] }, c)); }
    return out;
}

// The layered rules of ONE rule set (the server's, or a command's own): a role in this channel › a role everywhere › this channel (or a thread's parent) › the set's default.
function explainLayers(rules, { channelId, parentChannelId = null, roleIds }) {
    const held = new Set(roleIds);
    const matches = channelMatcher(channelId, parentChannelId);
    // Same-tier conflict resolves to public, so the rule named is a public one when any is.
    const pick = list => list.find(r => r.visibility === 'public') || list[0];

    const roleRules = (rules.roleRules || []).filter(r => held.has(r.roleId));
    const scoped = roleRules.filter(r => (r.channelIds || []).some(matches));
    if (scoped.length) return { visibility: pick(scoped).visibility, tier: 'roleChannel', rule: pick(scoped) };

    const global = roleRules.filter(r => !(r.channelIds || []).length);
    if (global.length) return { visibility: pick(global).visibility, tier: 'role', rule: pick(global) };

    const channelRules = rules.channelRules || [];
    const own = channelRules.find(r => r.channelId === channelId);
    if (own) return { visibility: own.visibility, tier: 'channel', rule: own };
    const inherited = parentChannelId && channelRules.find(r => r.channelId === parentChannelId);
    if (inherited) return { visibility: inherited.visibility, tier: 'parent', rule: inherited };

    return { visibility: rules.defaultVisibility || 'public', tier: 'default', rule: null };
}

// Which rule decided, as well as the answer: /admin's "Check a member" names it. resolveVisibility below is this function's `visibility`, so the two can never disagree. THE MODEL SINCE 2026-10-22 18:31 EDT (Harkirat: "man idk, this is confusing ... build it out autonomously"): "Server settings cover every command. Give a command its own settings and it uses only those." A command with its own settings resolves inside them (tier 'command', with `inner` naming the rule there); every other command resolves in the server-wide rules. Server admins skip a command's own settings, as they always skipped hidden commands.
function explainVisibility(settings, { channelId, parentChannelId = null, roleIds, commandName = null, commandPath = null, isAdmin = false }) {
    if (!settings) return { visibility: 'public', tier: 'none', rule: null };
    const context = { channelId, parentChannelId, roleIds };
    const entry = !isAdmin && commandName ? commandEntry(settings, commandPath || commandName) : null;
    if (entry) {
        const inner = explainLayers(entry, context);
        return { visibility: inner.visibility, tier: 'command', rule: entry.command, inner, entry };
    }
    return explainLayers(settings, context);
}

function resolveVisibility(settings, context) {
    return explainVisibility(settings, context).visibility;
}

// Forces every response path on this interaction to ephemeral. Assigned as OWN properties so that utils/interactionContext.js's buildSyntheticInteraction() -- which copies own enumerable properties onto a fresh object -- carries the clamp through to a button re-invoking a command's execute(). Without that, a panel would render clamped on first invocation and unclamped on every navigation click.
function forceEphemeralResponses(interaction) {
    const clamp = options => {
        // A bare string is a legal shorthand for reply()/followUp(); normalise before adding flags.
        const next = typeof options === 'string' ? { content: options } : { ...(options || {}) };
        // The command was about to answer publicly, so the member's own choice (their visibility option or saved /settings) said Public and the server's rule overrode it. sendPolicyNotice reads this to tell them why (2026-10-22 15:51 EDT).
        const wasPrivate = next.ephemeral === true || (typeof next.flags === 'number' && (next.flags & EPHEMERAL_FLAG) !== 0);
        if (!wasPrivate && interaction.dioreoPolicy) interaction.dioreoPolicy.overrodeUser = true;
        next.ephemeral = true;
        // Preserve an explicit flags number (Components V2 sends pass 32768) rather than replacing it -- dropping that flag would render a V2 payload as a blank message.
        if (typeof next.flags === 'number') next.flags |= EPHEMERAL_FLAG;
        return next;
    };
    for (const method of ['reply', 'deferReply', 'followUp']) {
        const original = interaction[method];
        if (typeof original !== 'function') continue;
        interaction[method] = function clamped(options) {
            return original.call(this, clamp(options));
        };
    }
}

// Called ONCE per interaction from handlers/router.js's interactionCreate choke point, before any routing. Attaches `interaction.dioreoPolicy` and applies the clamp. Returns the policy, or null outside a guild (a DM or a user-install context has no server to have an opinion). Whether Dioreo itself is in this server. The Guilds intent puts every server the bot belongs to in the client's cache, so this costs no REST call. Undefined when the interaction carries no client cache (a test double), which counts as "in".
function botInGuild(interaction) {
    const cache = interaction.client?.guilds?.cache;
    return cache ? cache.has(interaction.guildId) : true;
}

async function attachGuildPolicy(interaction) {
    if (!interaction.guildId) return null;
    // A server's /admin rules apply only while Dioreo is in that server (Harkirat 2026-10-22 17:05 EDT: "the whole point of like the server admin stuff is if the bot's actually in there. Otherwise, it just becomes too restricted"). Where only members' own installs reach it, Discord's own channel permissions (Use External Apps) decide, and the stored rules wait unused until the bot is added back.
    if (!botInGuild(interaction)) return null;

    const settings = await getGuildSettings(interaction.guildId);
    const visibility = resolveVisibility(settings, {
        channelId: interaction.channelId,
        // Present only when the interaction happened in a thread; Discord ships it in the payload's channel object, so this costs nothing. See resolveVisibility's own note on why it matters.
        parentChannelId: interaction.channel?.parentId ?? null,
        roleIds: memberRoleIds(interaction),
        // Present on chat-input and autocomplete interactions, absent on button/select clicks. That asymmetry is correct rather than a gap: a component interaction edits a message whose ephemerality Discord fixed when it was first sent, so a command rule has nothing left to decide there -- the tier is simply skipped and resolution falls through to role/channel.
        commandName: interaction.commandName || null,
        commandPath: commandPathOf(interaction),
        isAdmin: isServerAdmin(interaction),
    });

    const policy = {
        visibility,
        // Under an ephemeral policy the "Show Everyone" button must not render OR fire -- it posts a genuinely new public message, which would be a complete bypass of the rule. handlers/share.js's share_public handler re-checks this rather than trusting the button's absence, because a panel opened before the rule was set still has the button on it.
        allowShare: visibility === 'public',
        // The settings version, so a member's "why is this private" notice can start over when the rules change.
        rulesAt: settings?.updatedAt || null,
    };

    interaction.dioreoPolicy = policy;
    if (visibility === 'ephemeral') forceEphemeralResponses(interaction);
    return policy;
}

// Read-modify-write helper for /admin, so every write invalidates the cache in the same place it mutates. `mutate` receives the document and may change it freely.
async function updateGuildSettings(guildId, actorId, mutate, { source = 'admin' } = {}) {
    const doc = await GuildSettings.findOne({ guildId }) || new GuildSettings({ guildId });
    const before = snapshot(doc);
    mutate(doc);
    doc.updatedBy = actorId;
    await doc.save();
    invalidateGuildPolicy(guildId);
    logGuildChange(guildId, actorId, describeChanges(before, snapshot(doc)), source);
    return doc;
}

// The fields a change is described from, as plain data.
function snapshot(doc) {
    return {
        defaultVisibility: doc?.defaultVisibility || 'public',
        channelRules: (doc?.channelRules || []).map(r => ({ channelId: r.channelId, visibility: r.visibility })),
        roleRules: (doc?.roleRules || []).map(r => ({ roleId: r.roleId, visibility: r.visibility, channelIds: [...(r.channelIds || [])] })),
        ephemeralCommands: [...(doc?.ephemeralCommands || [])],
        commands: commandEntries(doc).map(e => ({ command: e.command, defaultVisibility: e.defaultVisibility, channelRules: e.channelRules.map(r => ({ channelId: r.channelId, visibility: r.visibility })), roleRules: e.roleRules.map(r => ({ roleId: r.roleId, visibility: r.visibility, channelIds: [...(r.channelIds || [])] })) })),
    };
}

const LABEL = { public: 'Public', ephemeral: 'Hidden' };

// One plain line per thing that changed, with channels and roles as <#id> / <@&id> tokens the log export turns into names. Empty when nothing changed, and then nothing is logged.
function describeChanges(before, after) {
    const lines = describeRuleSet(before, after, '');
    // A command's own settings: added, removed, or changed inside, each line prefixed with the command.
    const cmd = c => (/[A-Z]/.test(c) ? c : `/${c}`);
    // A snapshot carries `commands`; a raw settings object is read through commandEntries, the older ephemeralCommands included.
    const bCmd = new Map((before.commands || commandEntries(before)).map(e => [e.command, e]));
    const aCmd = new Map((after.commands || commandEntries(after)).map(e => [e.command, e]));
    for (const [c, e] of aCmd) {
        if (!bCmd.has(c)) lines.push(`${cmd(c)}: own settings added (${LABEL[e.defaultVisibility]})`);
        lines.push(...describeRuleSet(bCmd.get(c) || { defaultVisibility: e.defaultVisibility, channelRules: [], roleRules: [] }, e, `${cmd(c)}: `));
    }
    for (const c of bCmd.keys()) if (!aCmd.has(c)) lines.push(`${cmd(c)}: own settings removed, follows the server again`);
    return lines;
}

// One rule set's changes (the server's, or one command's), each line given `prefix`.
function describeRuleSet(before, after, prefix) {
    const lines = [];
    if (before.defaultVisibility !== after.defaultVisibility) lines.push(`Default: ${LABEL[before.defaultVisibility]} → ${LABEL[after.defaultVisibility]}`);
    const chKey = r => `${r.channelId}:${r.visibility}`;
    const bCh = new Set(before.channelRules.map(chKey));
    const aCh = new Set(after.channelRules.map(chKey));
    for (const r of after.channelRules) if (!bCh.has(chKey(r))) lines.push(`Channel <#${r.channelId}> set to ${LABEL[r.visibility]}`);
    for (const r of before.channelRules) if (!aCh.has(chKey(r)) && !after.channelRules.some(x => x.channelId === r.channelId)) lines.push(`Channel <#${r.channelId}> rule removed (was ${LABEL[r.visibility]})`);
    const roleKey = r => `${r.roleId}:${r.visibility}:${[...r.channelIds].sort().join(',')}`;
    const roleText = r => `<@&${r.roleId}> ${LABEL[r.visibility]} ${r.channelIds.length ? `in ${r.channelIds.map(id => `<#${id}>`).join(' ')}` : 'everywhere'}`;
    const bRole = new Set(before.roleRules.map(roleKey));
    const aRole = new Set(after.roleRules.map(roleKey));
    for (const r of after.roleRules) if (!bRole.has(roleKey(r))) lines.push(`Role rule added: ${roleText(r)}`);
    for (const r of before.roleRules) if (!aRole.has(roleKey(r))) lines.push(`Role rule removed: ${roleText(r)}`);
    return lines.map(l => prefix + l);
}

// Writes one GuildSettingsLog row. Fire-and-forget and never throws: a log failure must not undo or block the admin's change, the same contract as utils/changeStore.js's recordChange().
function logGuildChange(guildId, actorId, changes, source = 'admin') {
    if (!changes?.length) return Promise.resolve();
    const GuildSettingsLog = require('../models/GuildSettingsLog');
    return GuildSettingsLog.create({ guildId, actorId, source, changes }).catch(error => {
        console.error(`GuildSettingsLog write failed for ${guildId}: ${error.message}`);
    });
}

// THE "WHY IS THIS PRIVATE?" NOTICE (Harkirat 2026-10-22 15:51 EDT: "make it like a 2x repeat ... private notification, if the settings change ... and they don't match the user's own settings"). Sent as a private follow-up after a slash command whose public answer a server rule made private, at most twice per member per change to that server's rules. Called by handlers/router.js after the command has answered; it never throws.
const NOTICE_LIMIT = 2;
async function sendPolicyNotice(interaction) {
    try {
        const policy = interaction.dioreoPolicy;
        if (!policy?.overrodeUser || !interaction.guildId || !interaction.isChatInputCommand?.()) return false;
        if (!interaction.replied && !interaction.deferred) return false;
        const PolicyNotice = require('../models/PolicyNotice');
        const { hashUserId } = require('./requestContext');
        const userHash = hashUserId(interaction.user.id);
        const rulesAt = policy.rulesAt ? new Date(policy.rulesAt) : new Date(0);
        const seen = await PolicyNotice.findOne({ userHash, guildId: interaction.guildId }).lean();
        const shown = seen && new Date(seen.rulesAt) >= rulesAt ? seen.shown : 0;
        if (shown >= NOTICE_LIMIT) return false;
        await PolicyNotice.updateOne({ userHash, guildId: interaction.guildId }, { $set: { rulesAt, shown: shown + 1, lastShownAt: new Date() } }, { upsert: true });
        await interaction.followUp({
            content: `🔒 **Why is this private?** This server's admins set Dioreo to answer privately here, so your own Public choice doesn't apply in this server.\n-# Shown ${NOTICE_LIMIT === shown + 1 ? 'one last time' : 'twice'} after the server's settings change.`,
            ephemeral: true,
            allowedMentions: { parse: [] },
        });
        return true;
    } catch (error) {
        console.error(`policy notice failed: ${error.message}`);
        return false;
    }
}

module.exports = {
    attachGuildPolicy,
    commandEntries,
    commandEntry,
    explainLayers,
    botInGuild,
    describeChanges,
    logGuildChange,
    sendPolicyNotice,
    commandPaths,
    commandPathOf,
    explainVisibility,
    getGuildSettings,
    invalidateGuildPolicy,
    isServerAdmin,
    resolveVisibility,
    updateGuildSettings,
};
