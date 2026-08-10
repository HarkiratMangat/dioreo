// commands/server.js
//
// /server -- the SERVER-ADMIN control panel. Deliberately distinct from /manage, which is
// Harkirat's owner-level panel gated on ALLOWED_ADMIN_ID and stays user-install-only. This one
// belongs to whoever administers the server the command was run in.
//
// It configures exactly one thing: the RESPONSE-VISIBILITY POLICY (utils/guildPolicy.js). Nothing
// here refuses a command or touches a channel, because the bot holds zero standing guild
// permissions and could not enforce either. Design + the rejected alternatives:
// docs/superpowers/specs/2026-08-10-server-admin-visibility-policy-design.md
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');
// ⚠️ Required as the whole module and read INSIDE the render functions below, never destructured or
// captured at module level. refreshEmojiIds() rewrites this object in place at boot, long after this
// file is require()d, so a module-level capture freezes the pre-sync id and renders broken on the
// dev bot -- four sites shipped exactly that bug on 2026-07-26. See .claude/rules/rendering-and-ui.md.
const emojis = require('../utils/emojiMap');
const { getGuildSettings, isServerAdmin, updateGuildSettings } = require('../utils/guildPolicy');

// Discord blurple -- this panel configures a SERVER's own behaviour, so it deliberately does not
// borrow any of the content commands' accents (see .claude/rules/rendering-and-ui.md's colour map).
const ACCENT = 0x5865F2;

// A select menu accepts at most 25 options. The bot registers 19 gate-able commands today, so this
// is headroom rather than a live truncation -- but it is a real cliff, and a silent one: Discord
// rejects the whole payload rather than trimming, which renders as a dead button.
const SELECT_OPTION_CAP = 25;

const VISIBILITY_LABEL = { public: 'Public', ephemeral: 'Hidden' };

// ---------------------------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------------------------

function summaryLines(settings) {
    const def = settings?.defaultVisibility || 'public';
    const channelRules = settings?.channelRules || [];
    const roleRules = settings?.roleRules || [];
    const commandRules = settings?.ephemeralCommands || [];

    const lines = [`**Default:** every response is **${VISIBILITY_LABEL[def]}** unless a rule below says otherwise.`];

    if (commandRules.length) {
        lines.push(`**Always hidden commands (${commandRules.length}):** ${commandRules.map(c => `\`/${c}\``).join(' ')}`);
    }
    if (roleRules.length) {
        lines.push(`**Role rules (${roleRules.length}):** ` + roleRules.map(r => {
            const scope = r.channelIds?.length ? ` in ${r.channelIds.length} channel${r.channelIds.length === 1 ? '' : 's'}` : ' everywhere';
            return `<@&${r.roleId}> → ${VISIBILITY_LABEL[r.visibility]}${scope}`;
        }).join(' · '));
    }
    if (channelRules.length) {
        lines.push(`**Channel rules (${channelRules.length}):** ` + channelRules.map(c => `<#${c.channelId}> → ${VISIBILITY_LABEL[c.visibility]}`).join(' · '));
    }
    if (!commandRules.length && !roleRules.length && !channelRules.length) {
        lines.push('-# No rules set — the bot behaves the same in every channel, for everyone.');
    }
    return lines.join('\n');
}

function navRow(active) {
    const btn = (id, label) => ({ type: 2, style: id === active ? 1 : 2, label, custom_id: id });
    return {
        type: 1,
        components: [
            btn('server_home', 'Overview'),
            btn('server_channels', 'Channels'),
            btn('server_roles', 'Roles'),
            btn('server_commands', 'Commands'),
        ],
    };
}

function buildHome(settings) {
    const def = settings?.defaultVisibility || 'public';
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                { type: 10, content: `## ${emojis.serverSettings} Server Controls` },
                { type: 10, content: '-# Server-admin only · decides whether Dioreo answers **publicly** in the channel or **only to the person who asked**.' },
                { type: 14, spacing: 2 },
                { type: 10, content: summaryLines(settings) },
                { type: 14, spacing: 2 },
                // Stated in the panel because it is the single most surprising property of the
                // model: a rule can only ever quiet the bot. "Public" is a permission, not a
                // command -- a member who prefers hidden answers still gets hidden answers.
                { type: 10, content: '-# A rule can only make the bot **quieter**. Setting something to Public permits a public answer; it never overrides someone who chose hidden in `/settings`.' },
                {
                    type: 1,
                    components: [{
                        type: 2,
                        style: def === 'public' ? 2 : 1,
                        label: def === 'public' ? 'Switch default to Hidden' : 'Switch default to Public',
                        custom_id: 'server_default_toggle',
                    }],
                },
            ],
        },
        navRow('server_home'),
    ];
}

// `type: 8` is a channel select. Omitting `channel_types` on purpose: slash commands work in text
// channels, threads, forum posts and voice text chat alike, and an allow-list of types here would
// silently make some of them unconfigurable.
function channelSelect(customId, placeholder, defaultIds) {
    return {
        type: 1,
        components: [{
            type: 8,
            custom_id: customId,
            placeholder,
            min_values: 0,
            max_values: 25,
            default_values: defaultIds.map(id => ({ id, type: 'channel' })),
        }],
    };
}

function buildChannels(settings) {
    const rules = settings?.channelRules || [];
    const ephemeral = rules.filter(r => r.visibility === 'ephemeral').map(r => r.channelId);
    const publicIds = rules.filter(r => r.visibility === 'public').map(r => r.channelId);
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                { type: 10, content: '## 🔇 Channel rules' },
                { type: 10, content: '-# Each menu holds the full list for that setting — adding or removing a channel here **replaces** it. A channel can only be in one list.' },
                { type: 14, spacing: 2 },
                { type: 10, content: rules.length ? summaryLines(settings).split('\n').pop() : '-# No channel rules yet.' },
            ],
        },
        channelSelect('server_ch_ephemeral', 'Always hidden in these channels…', ephemeral),
        channelSelect('server_ch_public', 'Always public in these channels…', publicIds),
        navRow('server_channels'),
    ];
}

function roleSelect(customId, placeholder, defaultIds, maxValues = 25) {
    return {
        type: 1,
        components: [{
            type: 6,
            custom_id: customId,
            placeholder,
            min_values: 0,
            max_values: maxValues,
            default_values: defaultIds.map(id => ({ id, type: 'role' })),
        }],
    };
}

function buildRoles(settings) {
    const rules = (settings?.roleRules || []).filter(r => !r.channelIds?.length);
    const scoped = (settings?.roleRules || []).filter(r => r.channelIds?.length);
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                { type: 10, content: '## 👥 Role rules' },
                { type: 10, content: '-# Roles beat channels. Use these for "this role may always speak publicly, wherever they are".' },
                { type: 14, spacing: 2 },
                {
                    type: 10, content: scoped.length
                        ? `**Scoped to specific channels:** ${scoped.map(r => `<@&${r.roleId}> → ${VISIBILITY_LABEL[r.visibility]} in ${r.channelIds.length}`).join(' · ')}`
                        : '-# No channel-scoped role rules. Pick a role below to limit one to certain channels.',
                },
            ],
        },
        roleSelect('server_role_public', 'Always public for these roles…', rules.filter(r => r.visibility === 'public').map(r => r.roleId)),
        roleSelect('server_role_ephemeral', 'Always hidden for these roles…', rules.filter(r => r.visibility === 'ephemeral').map(r => r.roleId)),
        roleSelect('server_role_pick', 'Limit one role to specific channels…', [], 1),
        navRow('server_roles'),
    ];
}

function buildRoleScope(settings, roleId) {
    const existing = (settings?.roleRules || []).filter(r => r.roleId === roleId && r.channelIds?.length);
    const pub = existing.find(r => r.visibility === 'public');
    const eph = existing.find(r => r.visibility === 'ephemeral');
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                { type: 10, content: `## 👥 <@&${roleId}> — channel scope` },
                { type: 10, content: '-# A scoped rule beats an unscoped one, and both beat channel rules. Clearing both menus removes the scope.' },
            ],
        },
        channelSelect(`server_role_scope_public|${roleId}`, 'Public for this role, only in…', pub?.channelIds || []),
        channelSelect(`server_role_scope_ephemeral|${roleId}`, 'Hidden for this role, only in…', eph?.channelIds || []),
        { type: 1, components: [{ type: 2, style: 2, label: 'Back to roles', custom_id: 'server_roles' }] },
    ];
}

function buildCommands(settings, gateable) {
    const selected = settings?.ephemeralCommands || [];
    // Sorted so the menu order is stable across renders; a set that reorders itself between clicks
    // reads as the panel losing state.
    const names = [...gateable].sort().slice(0, SELECT_OPTION_CAP);
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                { type: 10, content: '## 🤫 Always-hidden commands' },
                { type: 10, content: '-# These beat every channel and role rule. **Server admins are exempt** — you can still run them publicly yourself.' },
                { type: 14, spacing: 2 },
                // Said plainly because an admin will otherwise expect the command to disappear, and
                // then read its continued presence as a bug rather than a platform limit.
                { type: 10, content: '-# This hides the **answer**, not the command. Discord does not let a bot remove one of its own commands inside a single server — to take a command off the list entirely, use **Server Settings → Integrations**.' },
            ],
        },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: 'server_cmd_select',
                placeholder: 'Commands that are always hidden here…',
                min_values: 0,
                max_values: names.length,
                options: names.map(n => ({ label: `/${n}`, value: n, default: selected.includes(n) })),
            }],
        },
        navRow('server_commands'),
    ];
}

// ---------------------------------------------------------------------------------------------
// Component dispatch
// ---------------------------------------------------------------------------------------------

// Replaces every rule of one visibility with the given ids, and drops those ids from the opposite
// list so a channel can never appear in both (which would make precedence order-dependent).
function setChannelRules(doc, visibility, ids) {
    const other = visibility === 'public' ? 'ephemeral' : 'public';
    doc.channelRules = [
        ...(doc.channelRules || []).filter(r => r.visibility === other && !ids.includes(r.channelId)),
        ...ids.map(channelId => ({ channelId, visibility })),
    ];
}

function setUnscopedRoleRules(doc, visibility, ids) {
    const kept = (doc.roleRules || []).filter(r => {
        if (r.channelIds?.length) return true;                       // scoped rules are edited elsewhere
        if (r.visibility === visibility) return false;               // this menu owns them
        return !ids.includes(r.roleId);                              // a role moved to the other list
    });
    doc.roleRules = [...kept, ...ids.map(roleId => ({ roleId, visibility, channelIds: [] }))];
}

function setScopedRoleRule(doc, roleId, visibility, channelIds) {
    const kept = (doc.roleRules || []).filter(r => !(r.roleId === roleId && r.visibility === visibility && r.channelIds?.length));
    doc.roleRules = channelIds.length ? [...kept, { roleId, visibility, channelIds }] : kept;
}

// Single entry point for every `server_*` component. index.js routes here rather than growing
// another dozen branches in its own handler, and the admin gate lives here so there is exactly one
// place that decides who may change a server's rules.
async function handleComponent(interaction) {
    if (!interaction.guildId) {
        return interaction.reply({ content: `${emojis.serverSettings} **Server Controls only work inside a server.**`, ephemeral: true });
    }
    if (!isServerAdmin(interaction)) {
        return interaction.reply({
            content: '🔒 **Server admins only.** These controls change how Dioreo behaves for everyone here, so they need **Manage Server**.',
            ephemeral: true,
        });
    }

    const [id, arg] = interaction.customId.split('|');
    const guildId = interaction.guildId;
    const actorId = interaction.user.id;
    const values = interaction.values || [];

    let settings;
    switch (id) {
        case 'server_home':
        case 'server_channels':
        case 'server_roles':
        case 'server_commands':
            settings = await getGuildSettings(guildId);
            break;

        case 'server_default_toggle':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                doc.defaultVisibility = (doc.defaultVisibility || 'public') === 'public' ? 'ephemeral' : 'public';
            });
            break;

        case 'server_ch_public':
        case 'server_ch_ephemeral':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                setChannelRules(doc, id === 'server_ch_public' ? 'public' : 'ephemeral', values);
            });
            break;

        case 'server_role_public':
        case 'server_role_ephemeral':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                setUnscopedRoleRules(doc, id === 'server_role_public' ? 'public' : 'ephemeral', values);
            });
            break;

        case 'server_role_pick':
            settings = await getGuildSettings(guildId);
            return interaction.update({ components: buildRoleScope(settings, values[0]), flags: 32768 });

        case 'server_role_scope_public':
        case 'server_role_scope_ephemeral':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                setScopedRoleRule(doc, arg, id === 'server_role_scope_public' ? 'public' : 'ephemeral', values);
            });
            return interaction.update({ components: buildRoleScope(settings, arg), flags: 32768 });

        case 'server_cmd_select':
            settings = await updateGuildSettings(guildId, actorId, doc => { doc.ephemeralCommands = values; });
            break;

        default:
            return;
    }

    // Which page to re-render after a write: the one the control lives on.
    const page = id.startsWith('server_ch_') ? 'server_channels'
        : id.startsWith('server_role_') ? 'server_roles'
            : id === 'server_cmd_select' ? 'server_commands'
                : id === 'server_default_toggle' ? 'server_home'
                    : id;

    const components = page === 'server_channels' ? buildChannels(settings)
        : page === 'server_roles' ? buildRoles(settings)
            : page === 'server_commands' ? buildCommands(settings, interaction.client.gateableCommandNames || [])
                : buildHome(settings);

    return interaction.update({ components, flags: 32768 });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Server admins: control where Dioreo answers publicly and where it stays hidden')
        // Keeps the command out of ordinary members' pickers where the bot IS guild-installed. It is
        // NOT the gate -- Discord ignores this field for a user-installed invocation, which is
        // exactly the case this feature exists to cover, so execute() re-checks for real.
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        // [0, 1]: a server whose members only user-installed the bot still needs admin controls --
        // the visibility policy applies to a user-installed invocation too, so registering [0] alone
        // would create servers where the policy is ACTIVE but nobody can ever configure it.
        //
        // ⚠️ The cost of keeping [1], found by Harkirat live 2026-08-10 16:06 EDT: a user-installed
        // command travels with the USER into every server they are in, so /server appears for anyone
        // who has installed the bot even where it is not guild-installed, and
        // setDefaultMemberPermissions cannot hide it (Discord ignores that field for user-installed
        // invocations -- which is why the runtime admin check above is the real gate).
        // setContexts([0]) is the part that CAN be fixed: guild channels only, so it no longer
        // appears in DMs or group DMs where it could never do anything but refuse.
        .setIntegrationTypes([0, 1]).setContexts([0]),

    handleComponent,

    async execute(interaction) {
        // Always ephemeral, and never offered as a `visibility` option: this is a configuration
        // surface, not content. A public copy would leak the server's rules into the channel and
        // hand every member buttons they are not allowed to press.
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guildId) {
            return sendV2Payload(interaction, [{
                type: 17,
                accent_color: ACCENT,
                components: [
                    { type: 10, content: `## ${emojis.serverSettings} Server Controls` },
                    { type: 10, content: 'This one only works **inside a server** — there is nothing to configure in a DM.' },
                ],
            }]);
        }

        if (!isServerAdmin(interaction)) {
            return sendV2Payload(interaction, [{
                type: 17,
                accent_color: ACCENT,
                components: [
                    { type: 10, content: '## 🔒 Server admins only' },
                    { type: 10, content: 'These controls change how Dioreo behaves for everyone in this server, so they need the **Manage Server** permission.\n\n-# Looking for your own settings? `/settings` is yours and works anywhere.' },
                ],
            }]);
        }

        const settings = await getGuildSettings(interaction.guildId);
        return sendV2Payload(interaction, buildHome(settings));
    },
};
