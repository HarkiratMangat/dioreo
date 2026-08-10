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
                { type: 10, content: '-# Decide where Dioreo answers **publicly**, and where it answers **only to whoever asked**.' },
                { type: 14, spacing: 2 },
                { type: 10, content: summaryLines(settings) },
                { type: 14, spacing: 2 },
                // The precedence order is the one thing an admin cannot discover by clicking around
                // -- every page looks self-contained, so a role rule quietly overriding a channel
                // rule reads as the channel rule "not working". One line, on the landing page only.
                { type: 10, content: '-# **Most specific rule wins:** command → role → channel → default.' },
                // Stated in the panel because it is the single most surprising property of the
                // model: a rule can only ever quiet the bot. "Public" is a permission, not a
                // command -- a member who prefers hidden answers still gets hidden answers.
                { type: 10, content: '-# A rule can only make Dioreo **quieter** — Public *permits* a public answer, it never overrides someone\'s own `/settings`.' },
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
                // ⚠️ KEEP THIS PAGE SHORT. An earlier draft explained the replace-semantics, the
                // search affordance, thread inheritance and Discord's 25-per-menu cap as four
                // separate paragraphs -- correct, and a wall of text that buried the one line an
                // admin needs. Harkirat's call, 2026-08-10 18:23 EDT: lead with the workflow, drop
                // the limits to a single footnote, and let /help carry the detail.
                { type: 10, content: '-# Exceptions to your server default. Set that on **Overview** first, then pick a few channels here.' },
                { type: 14, spacing: 2 },
                { type: 10, content: rules.length ? summaryLines(settings).split('\n').pop() : '-# No channel rules yet.' },
                { type: 10, content: '-# 🔎 Type to search · your picks **replace** the list · threads follow their channel' },
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
                { type: 10, content: '-# Give a role its own setting — everywhere, or only in chosen channels. **Roles override channel rules.**' },
                { type: 14, spacing: 2 },
                {
                    type: 10, content: scoped.length
                        ? `**Scoped to specific channels:** ${scoped.map(r => `<@&${r.roleId}> → ${VISIBILITY_LABEL[r.visibility]} in ${r.channelIds.length}`).join(' · ')}`
                        : '-# No channel-scoped role rules yet.',
                },
                { type: 10, content: '-# 🔎 Type to search your roles' },
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
                { type: 10, content: '-# This role gets its own setting in just these channels. Clear both menus to remove it.' },
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
    const sorted = [...gateable].sort();
    const names = sorted.slice(0, SELECT_OPTION_CAP);
    // ⚠️ A string select takes at most 25 OPTIONS, and unlike the channel/role menus it has no
    // search -- it is a literal list, so everything must fit. This list is NOT fixed: the
    // per-category weapon commands are generated at boot from Loadout.distinct('category'), so
    // adding weapon categories grows it. At 18 gateable commands (measured 2026-08-10 18:18 EDT)
    // nothing is dropped, but a BARE slice would make commands past the 25th alphabetically
    // unconfigurable with no signal at all -- the admin would simply never see them and have no
    // reason to suspect the list was incomplete. Naming the omitted ones is the difference between
    // a known limit and a silent one. scripts/guildPolicyEnforcement.test.js pins this so it cannot
    // regress to a bare slice. If it ever fires for real, paginate the menu (utils/paginationRow.js
    // already provides the pattern) -- the cap itself is Discord's and cannot be raised.
    const omitted = sorted.slice(SELECT_OPTION_CAP);
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                { type: 10, content: '## 🤫 Always-hidden commands' },
                { type: 10, content: '-# These always answer privately, even in public channels. **You are exempt** — admins can still run them publicly.' },
                { type: 14, spacing: 2 },
                // Said plainly because an admin will otherwise expect the command to disappear, and
                // then read its continued presence as a bug rather than a platform limit.
                { type: 10, content: '-# Hides the **answer**, not the command. To remove a command from the list entirely, use **Server Settings → Integrations**.' },
                ...(omitted.length ? [{ type: 10, content: `-# ⚠️ Discord allows 25 options per menu, so ${omitted.length} command(s) are missing from the list below: ${omitted.map(n => `\`/${n}\``).join(', ')}. Please report this.` }] : []),
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
    // Exported for scripts/guildPolicyEnforcement.test.js only -- nothing in the bot calls these
    // from outside this file. They are here because both limits these tests pin (25 options on a
    // select, 40 components per message) are invisible right up until a panel refuses to open, and
    // a test is the only thing that will notice before an admin does.
    __testRenderers: { buildHome, buildChannels, buildRoles, buildRoleScope, buildCommands },

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
