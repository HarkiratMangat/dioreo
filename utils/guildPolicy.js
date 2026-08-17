// utils/guildPolicy.js
//
// Resolves one server's response-visibility policy for one interaction, and enforces it.
//
// THE MODEL, in one line: a server can quiet the bot, never make someone louder than they chose to be. An 'ephemeral' verdict is a CEILING -- it overrides the user's `visibility` option and their saved UserPreference. A 'public' verdict only PERMITS a public response; the user's own choice still decides. So a server rule can never rewrite a personal preference, only constrain where and how loudly the bot speaks. Full design + the rejected alternatives: docs/superpowers/specs/2026-08-10-server-admin-visibility-policy-design.md
//
// ⚠️ NOTHING HERE REFUSES A COMMAND, and that is a platform limit, not a scoping decision. A bot cannot hide a global slash command inside one guild: guild-scoped registration does not delete global commands, Discord merges both sets, and per-command permissions can only be written with an OAuth2 bearer token from a MANAGE_GUILD user. Admins already hold that lever natively in Server Settings -> Integrations. So every tier below resolves to public-or-ephemeral, and a future session should not "finish" this by adding a refusal path -- see models/GuildSettings.js.
//
// ⚠️ WHY THE ENFORCEMENT IS A METHOD WRAP AND NOT A PER-COMMAND CHECK. The obvious design is to make utils/ephemeral.js's resolveEphemeral() policy-aware and pass the policy in. It was built that way first and then removed: resolveEphemeral is called by only nine commands -- /help, /timestamp, /colors and the EIGHT per-category weapon commands built dynamically in bot/registry.js never touch it -- so it would have been an optional argument at nine sites where FORGETTING it looks exactly like passing it, silently un-clamping a server's rule. Instead there are two choke points nothing routes around: attachGuildPolicy() wraps reply/deferReply/followUp on the interaction itself, and utils/sendV2Payload.js strips the "Show Everyone" row on the way out. Same reasoning as utils/logger.js's patchConsole(): one patch that cannot be forgotten beats a rule that must be remembered.
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

// The member's role ids, from whichever shape the interaction carries. discord.js gives a real GuildMember (roles.cache) when the guild is cached, and a raw APIInteractionGuildMember (roles as a plain id array) otherwise -- the raw shape is the norm for a user-installed invocation in a server the bot is not a member of, which is precisely a case this feature has to cover.
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

function resolveVisibility(settings, { channelId, parentChannelId = null, roleIds, commandName = null, isAdmin = false }) {
    if (!settings) return 'public';

    if (!isAdmin && commandName && (settings.ephemeralCommands || []).includes(commandName)) {
        return 'ephemeral';
    }

    const held = new Set(roleIds);
    const matches = channelMatcher(channelId, parentChannelId);

    const roleRules = (settings.roleRules || []).filter(r => held.has(r.roleId));
    const scoped = roleRules.filter(r => (r.channelIds || []).some(matches));
    if (scoped.length) return scoped.some(r => r.visibility === 'public') ? 'public' : 'ephemeral';

    const global = roleRules.filter(r => !(r.channelIds || []).length);
    if (global.length) return global.some(r => r.visibility === 'public') ? 'public' : 'ephemeral';

    const channelRules = settings.channelRules || [];
    const own = channelRules.find(r => r.channelId === channelId);
    if (own) return own.visibility;
    const inherited = parentChannelId && channelRules.find(r => r.channelId === parentChannelId);
    if (inherited) return inherited.visibility;

    return settings.defaultVisibility || 'public';
}

// Forces every response path on this interaction to ephemeral. Assigned as OWN properties so that utils/interactionContext.js's buildSyntheticInteraction() -- which copies own enumerable properties onto a fresh object -- carries the clamp through to a button re-invoking a command's execute(). Without that, a panel would render clamped on first invocation and unclamped on every navigation click.
function forceEphemeralResponses(interaction) {
    const clamp = options => {
        // A bare string is a legal shorthand for reply()/followUp(); normalise before adding flags.
        const next = typeof options === 'string' ? { content: options } : { ...(options || {}) };
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

// Called ONCE per interaction from handlers/router.js's interactionCreate choke point, before any routing. Attaches `interaction.dioreoPolicy` and applies the clamp. Returns the policy, or null outside a guild (a DM or a user-install context has no server to have an opinion).
async function attachGuildPolicy(interaction) {
    if (!interaction.guildId) return null;

    const settings = await getGuildSettings(interaction.guildId);
    const visibility = resolveVisibility(settings, {
        channelId: interaction.channelId,
        // Present only when the interaction happened in a thread; Discord ships it in the payload's channel object, so this costs nothing. See resolveVisibility's own note on why it matters.
        parentChannelId: interaction.channel?.parentId ?? null,
        roleIds: memberRoleIds(interaction),
        // Present on chat-input and autocomplete interactions, absent on button/select clicks. That asymmetry is correct rather than a gap: a component interaction edits a message whose ephemerality Discord fixed when it was first sent, so a command rule has nothing left to decide there -- the tier is simply skipped and resolution falls through to role/channel.
        commandName: interaction.commandName || null,
        isAdmin: isServerAdmin(interaction),
    });

    const policy = {
        visibility,
        // Under an ephemeral policy the "Show Everyone" button must not render OR fire -- it posts a genuinely new public message, which would be a complete bypass of the rule. handlers/share.js's share_public handler re-checks this rather than trusting the button's absence, because a panel opened before the rule was set still has the button on it.
        allowShare: visibility === 'public',
    };

    interaction.dioreoPolicy = policy;
    if (visibility === 'ephemeral') forceEphemeralResponses(interaction);
    return policy;
}

// Read-modify-write helper for /admin, so every write invalidates the cache in the same place it mutates. `mutate` receives the document and may change it freely.
async function updateGuildSettings(guildId, actorId, mutate) {
    const doc = await GuildSettings.findOne({ guildId }) || new GuildSettings({ guildId });
    mutate(doc);
    doc.updatedBy = actorId;
    await doc.save();
    invalidateGuildPolicy(guildId);
    return doc;
}

module.exports = {
    attachGuildPolicy,
    getGuildSettings,
    invalidateGuildPolicy,
    isServerAdmin,
    resolveVisibility,
    updateGuildSettings,
};
