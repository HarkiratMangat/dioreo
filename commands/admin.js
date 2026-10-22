// commands/admin.js
//
// /admin -- the SERVER-ADMIN control panel. Deliberately distinct from /manage, which is Harkirat's owner-level panel gated on ALLOWED_ADMIN_ID and stays user-install-only. This one belongs to whoever administers the server the command was run in.
//
// It configures exactly one thing: the RESPONSE-VISIBILITY POLICY (utils/guildPolicy.js). Nothing here refuses a command or touches a channel, because the bot holds no moderation permission and never acts on a channel outside an interaction (root CLAUDE.md), so it could not enforce either. Design + the rejected alternatives: docs/superpowers/specs/2026-08-10-server-admin-visibility-policy-design.md
const BOT_EMOJI = require('../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');
// ⚠️ Required as the whole module and read INSIDE the render functions below, never destructured or captured at module level. refreshEmojiIds() rewrites this object in place at boot, long after this file is require()d, so a module-level capture freezes the pre-sync id and renders broken on the dev bot -- four sites shipped exactly that bug on 2026-07-26. See .claude/rules/rendering-and-ui.md.
const emojis = require('../utils/emojiMap');
const { explainVisibility, getGuildSettings, isServerAdmin, resolveVisibility, updateGuildSettings } = require('../utils/guildPolicy');
const { toBoldItalicUnicode } = require('../utils/titleBlock');
const { mentionCommand } = require('../utils/commandMentions');

// Every /admin render goes out with mentions OFF. Since the panel can be posted publicly (2026-10-22 14:59 EDT), its role and user mentions would otherwise ping those roles and people in the channel (found by the edge-case pass, 2026-10-22 15:38 EDT).
const NO_PINGS = { parse: [] };
const send = (interaction, components) => sendV2Payload(interaction, components, { allowedMentions: NO_PINGS });

// Discord blurple -- this panel configures a SERVER's own behaviour, so it deliberately does not borrow any of the content commands' accents (see .claude/rules/rendering-and-ui.md's colour map).
const ACCENT = 0x5865F2;

// A select menu accepts at most 25 options. The bot registers 12 gate-able commands today (measured 2026-08-18, v3-pre-release review finding #64 -- was stale at 19), so this is headroom rather than a live truncation -- but it is a real cliff, and a silent one: Discord rejects the whole payload rather than trimming, which renders as a dead button.
const SELECT_OPTION_CAP = 25;

const VISIBILITY_LABEL = { public: 'Public', ephemeral: 'Hidden' };

// ---------------------------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------------------------

// Discord requires slash-command names in lowercase, so a capital letter marks a right-click command ("Convert Times") -- which is gateable too, because the policy reads interaction.commandName and a context menu carries one. It must never be shown with a slash (click test 2026-10-21 22:26 EDT: "/Convert Times").
const isMenuCommand = value => /[A-Z]/.test(value);
const commandLabel = value => (isMenuCommand(value) ? value : `/${value}`);
const commandText = value => (isMenuCommand(value) ? `${value} *(right-click)*` : `\`/${value}\``);

// A rule's visibility as a coloured dot and a word, the same everywhere on the panel, so the state reads before the text does (Harkirat 2026-10-22 14:57 EDT: "make it more visual rather than prose"). Read at render time: the dev bot re-points these ids at boot.
const dot = visibility => (visibility === 'public' ? emojis.greenDotGlow : emojis.redDotGlow);
const visText = visibility => `${dot(visibility)} **${VISIBILITY_LABEL[visibility]}**`;

// Names the channels instead of counting them ("Public in 1 channel" named nothing, click test 2026-10-21 22:26 EDT). Three, then a count, so a long list cannot push the page past Discord's text limits.
function channelList(ids) {
    if (!ids?.length) return 'none';
    return ids.slice(0, 3).map(id => `<#${id}>`).join(' ') + (ids.length > 3 ? ` +${ids.length - 3} more` : '');
}

// Who saved last, and when: updatedBy and updatedAt are already stored (PRIVACY.md §2.1a), so this shows them rather than keeping anything new. It answers the first question after a takeover or a surprise change, "who did this?" (edge-case pass, 2026-10-22 15:38 EDT).
function lastChangedLine(settings) {
    if (!settings?.updatedBy) return null;
    const when = settings.updatedAt ? ` <t:${Math.floor(new Date(settings.updatedAt).getTime() / 1000)}:R>` : '';
    return `-# Last changed by <@${settings.updatedBy}>${when}`;
}

// Rules that point at a role that no longer exists, a channel Dioreo cannot see, or a command that is no longer registered. They change nothing, but they count and they read as live, so Overview says how many there are. Nothing is hidden or deleted on view: a channel missing from the cache may be an archived thread whose rule still applies, and a write on view would stamp updatedBy without the admin doing anything.
function staleCount(settings, place = {}) {
    let n = 0;
    if (place.hasRole) n += (settings?.roleRules || []).filter(r => !place.hasRole(r.roleId)).length;
    if (place.hasChannel) {
        n += (settings?.channelRules || []).filter(r => !place.hasChannel(r.channelId)).length;
        n += (settings?.roleRules || []).filter(r => (r.channelIds || []).some(id => !place.hasChannel(id))).length;
    }
    if (place.gateable?.length) n += (settings?.ephemeralCommands || []).filter(c => !place.gateable.includes(c) && !place.gateable.some(v => v.startsWith(`${c} `))).length;
    return n;
}

function hasRules(settings) {
    return Boolean(settings?.ephemeralCommands?.length || settings?.roleRules?.length || settings?.channelRules?.length);
}

// "Server Settings" with the server-settings emoji on every page (Harkirat 2026-10-22 14:57 EDT, "title to Server Settings"; the one emoji is his 13:40 EDT option A). Custom emoji per sub-page are filed for after v3 in docs/db-deferred-list.md. The tabs say which page is open.
function pageTitle(page) {
    return `## ${emojis.serverSettings} Server Settings${page ? ` · ${page}` : ''}`;
}

function roleRuleText(rule) {
    const where = rule.channelIds?.length ? `in ${channelList(rule.channelIds)}` : 'everywhere';
    return `<@&${rule.roleId}> → ${visText(rule.visibility)} ${where}`;
}

// The five tabs. The open page is blurple and disabled (Harkirat 2026-10-22 14:57 EDT: "active page should = blurple-disabled", the footer convention of utils/globalNav.js). `subpage` keeps the parent tab blurple but clickable, so the role-in-channels screen can still go back to Roles.
function navRow(active, { subpage = false } = {}) {
    const btn = (id, label) => ({ type: 2, style: id === active ? 1 : 2, label, custom_id: id, ...(id === active && !subpage ? { disabled: true } : {}) });
    return {
        type: 1,
        components: [
            btn('admin_home', 'Overview'),
            btn('admin_channels', 'Channels'),
            btn('admin_roles', 'Roles'),
            btn('admin_commands', 'Commands'),
            btn('admin_help', 'Help'),
        ],
    };
}

// The answer to "how do I clear a rule?". A select only saves when it is closed by clicking outside it, and Escape silently cancels, so emptying a menu read as cleared when it was not (click test 2026-10-21 22:26 EDT). Shown only when there is something to clear; the label says what goes.
function clearRow(customId, label) {
    return { type: 1, components: [{ type: 2, style: 4, label, custom_id: customId }] };
}

// One Overview block per rule area, its Edit button as the Section's accessory, so every setting is one press from the summary. The `|go` suffix keeps its custom_id distinct from the nav row's identical target (Discord refuses a message with a duplicated id).
function areaSection(title, lines, target) {
    return {
        type: 9,
        components: [{ type: 10, content: `### ${title}\n${lines.join('\n')}` }],
        accessory: { type: 2, style: 2, label: 'Edit', custom_id: `${target}|go` },
    };
}

// The page header: title, the server it is for (his ask, 2026-10-22 14:57 EDT: "mention the server the settings are for"), and on Overview the server's icon beside them. The name and icon come from the cached guild, so a user-installed /admin in a server the bot is not in shows neither; that is the only case without them.
function header(page, place = {}, subtitle = null) {
    const lines = [pageTitle(page)];
    if (place.guildName) lines.push(`-# ${toBoldItalicUnicode(place.guildName)}`);
    if (subtitle) lines.push(subtitle);
    const text = { type: 10, content: lines.join('\n') };
    return place.guildIcon && !page
        ? [{ type: 9, components: [text], accessory: { type: 11, media: { url: place.guildIcon } } }]
        : [text];
}

function buildHome(settings, client, place = {}, { resetArmed = false } = {}) {
    // Dioreo not in this server: the rules are kept but do nothing, and Discord's own permissions decide.
    const notIn = place.botInGuild === false
        ? [{ type: 10, content: `-# ${BOT_EMOJI.warn} **Dioreo isn't added to this server**, so these rules don't apply right now. Members' own installs follow Discord's channel permissions (Use External Apps). Add Dioreo to the server and the rules work again.` }]
        : [];
    const def = settings?.defaultVisibility || 'public';
    const channelRules = settings?.channelRules || [];
    const roleRules = settings?.roleRules || [];
    const commandRules = settings?.ephemeralCommands || [];
    const byVis = v => channelRules.filter(r => r.visibility === v).map(r => r.channelId);

    const channelLines = channelRules.length
        ? ['ephemeral', 'public'].filter(v => byVis(v).length).map(v => `${visText(v)} in ${channelList(byVis(v))}`)
        : ['-# No channel rules'];
    const roleLines = roleRules.length ? roleRules.map(roleRuleText) : ['-# No role rules'];
    const commandLines = commandRules.length ? [`${visText('ephemeral')} ${commandRules.map(commandText).join(' · ')}`] : ['-# No hidden commands'];

    // What this very channel does right now, for a member with no role rule: the one fact an admin otherwise has to work out from the rules above.
    const hereGate = place.channelId && place.discordGate ? place.discordGate(place.channelId) : null;
    const here = place.channelId
        ? resolveVisibility(settings || { defaultVisibility: 'public' }, { channelId: place.channelId, parentChannelId: place.parentId || null, roleIds: [] })
        : null;

    // The two explainer lines show in full only while the server has no rules (Harkirat 2026-10-22 13:47 EDT, "Text 1"); the rest of the detail lives on the Help tab.
    const explainer = hasRules(settings)
        ? '-# Most specific rule wins: command → role → channel → default. More on **Help**.'
        : `-# **Most specific rule wins:** command → role → channel → default.\n-# A rule can only make Dioreo **quieter** — Public *permits* a public answer, it never overrides someone's own ${mentionCommand(client, '/settings')}.`;

    const defaultButton = v => ({
        type: 2,
        // The in-panel switcher convention: the current choice is green and disabled (rendering-and-ui.md).
        style: def === v ? 3 : 2,
        label: VISIBILITY_LABEL[v],
        custom_id: `admin_default|${v}`,
        ...(def === v ? { disabled: true } : {}),
    });

    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header(null, place, '-# Where Dioreo answers **publicly**, and where only the person who asked sees it.'),
                ...notIn,
                { type: 14, spacing: 2 },
                { type: 10, content: `### Default\n-# Every answer is ${visText(def)} unless a rule below says otherwise.` },
                { type: 1, components: [defaultButton('public'), defaultButton('ephemeral')] },
                { type: 14, spacing: 2 },
                areaSection(`Channels${channelRules.length ? ` (${channelRules.length})` : ''}`, channelLines, 'admin_channels'),
                areaSection(`Roles${roleRules.length ? ` (${roleRules.length})` : ''}`, roleLines, 'admin_roles'),
                areaSection(`Hidden Commands${commandRules.length ? ` (${commandRules.length})` : ''}`, commandLines, 'admin_commands'),
                { type: 14, spacing: 2 },
                ...(here ? [{ type: 10, content: hereGate
                    ? `📍 **Here in <#${place.channelId}>** · ${visText('ephemeral')} for @everyone\n-# ${GATE_TEXT[hereGate]}. To change that, allow it for @everyone in this channel's permissions.`
                    : `📍 **Here in <#${place.channelId}>** · ${visText(here)} for members without a role rule` }] : []),
                ...(staleCount(settings, place) ? [{ type: 10, content: `-# ${BOT_EMOJI.warn} ${staleCount(settings, place)} rule(s) name a deleted role, a channel Dioreo can't see, or a retired command. They do nothing; **Clear** on that tab removes them.` }] : []),
                ...(lastChangedLine(settings) ? [{ type: 10, content: lastChangedLine(settings) }] : []),
                { type: 10, content: explainer },
                toolsRow(settings, resetArmed),
            ],
        },
        navRow('admin_home'),
    ];
}

function ruleCount(settings) {
    return (settings?.ephemeralCommands?.length || 0) + (settings?.roleRules?.length || 0) + (settings?.channelRules?.length || 0);
}

// Overview's last row: Check a Member, and Reset Everything once there is something to reset. Reset is two presses: the first turns the row into Cancel · Confirm, so one stray click cannot wipe a server's setup (picked 2026-10-22 15:23 EDT).
function toolsRow(settings, resetArmed) {
    const count = ruleCount(settings);
    const changed = count || (settings?.defaultVisibility || 'public') !== 'public';
    if (resetArmed && changed) {
        return { type: 1, components: [
            { type: 2, style: 2, label: 'Cancel', custom_id: 'admin_home|cancel' },
            { type: 2, style: 4, label: `Confirm: clear ${count} rule${count === 1 ? '' : 's'} and set Public`, custom_id: 'admin_reset' },
        ] };
    }
    return { type: 1, components: [
        { type: 2, style: 2, label: 'Check a Member', custom_id: 'admin_check' },
        { type: 2, style: 2, label: 'Export Log', custom_id: 'admin_log' },
        ...(changed ? [{ type: 2, style: 4, label: 'Reset Everything', custom_id: 'admin_reset_arm' }] : []),
    ] };
}

// The whole rule set as text, for /bot servers (the owner's override tool) and its Changes-page record. Same pieces as Overview, so the two read alike.
function rulesText(settings) {
    if (!settings) return '-# No settings saved for this server.';
    const def = settings.defaultVisibility || 'public';
    const byVis = v => (settings.channelRules || []).filter(r => r.visibility === v).map(r => r.channelId);
    const lines = [`**Default** · ${visText(def)}`];
    const ch = ['ephemeral', 'public'].filter(v => byVis(v).length).map(v => `${visText(v)} in ${channelList(byVis(v))}`);
    lines.push(`**Channels** · ${ch.length ? ch.join(' · ') : 'none'}`);
    lines.push(`**Roles** · ${(settings.roleRules || []).length ? settings.roleRules.map(roleRuleText).join(' · ') : 'none'}`);
    lines.push(`**Hidden commands** · ${(settings.ephemeralCommands || []).length ? settings.ephemeralCommands.map(commandText).join(' · ') : 'none'}`);
    return lines.join('\n');
}

// `type: 8` is a channel select. Omitting `channel_types` on purpose: slash commands work in text channels, threads, forum posts and voice text chat alike, and an allow-list of types here would silently make some of them unconfigurable.
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

function buildChannels(settings, place = {}) {
    const rules = settings?.channelRules || [];
    const def = settings?.defaultVisibility || 'public';
    const ephemeral = rules.filter(r => r.visibility === 'ephemeral').map(r => r.channelId);
    const publicIds = rules.filter(r => r.visibility === 'public').map(r => r.channelId);
    // Channels this page sets to Public that Discord itself keeps private: the confusion the Discord line exists for.
    const gated = place.discordGate ? publicIds.filter(id => place.discordGate(id)) : [];
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                // ⚠️ KEEP THIS PAGE SHORT (Harkirat 2026-08-10 18:23 EDT: lead with the workflow, let help carry the detail). The default is stated here rather than "set that on Overview first", which read as an instruction to go somewhere else (click test 2026-10-21 22:26 EDT).
                ...header('Channels', place, `-# Your default is ${visText(def)}. Pick channels that answer differently.`),
                { type: 14, spacing: 2 },
                { type: 10, content: `${visText('ephemeral')} in${ephemeral.length ? ` (${ephemeral.length})` : ''} · ${channelList(ephemeral)}\n${visText('public')} in${publicIds.length ? ` (${publicIds.length})` : ''} · ${channelList(publicIds)}` },
                ...(gated.length ? [{ type: 10, content: `-# ${BOT_EMOJI.warn} Discord's own permissions make these private for @everyone, whatever this page says: ${channelList(gated)}. Allow **Use External Apps** in those channels to change it.` }] : []),
                { type: 10, content: '-# 🔎 Type to search · threads follow their channel' },
            ],
        },
        channelSelect('admin_ch_ephemeral', 'Always hidden in these channels…', ephemeral),
        channelSelect('admin_ch_public', 'Always public in these channels…', publicIds),
        ...(rules.length ? [clearRow('admin_ch_clear', `Clear channel rules (${rules.length})`)] : []),
        navRow('admin_channels'),
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

function buildRoles(settings, place = {}) {
    const rules = (settings?.roleRules || []).filter(r => !r.channelIds?.length);
    const scoped = (settings?.roleRules || []).filter(r => r.channelIds?.length);
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header('Roles', place, '-# Give a role its own setting, everywhere or in chosen channels. **Roles beat channel rules.**'),
                { type: 14, spacing: 2 },
                {
                    type: 10, content: `**Everywhere** · ${rules.length ? rules.map(r => `<@&${r.roleId}> → ${visText(r.visibility)}`).join(' · ') : 'none'}\n`
                        + `**In chosen channels** · ${scoped.length ? scoped.map(roleRuleText).join(' · ') : 'none'}`,
                },
                { type: 10, content: '-# 🔎 Type to search your roles' },
            ],
        },
        roleSelect('admin_role_public', 'Always public for these roles…', rules.filter(r => r.visibility === 'public').map(r => r.roleId)),
        roleSelect('admin_role_ephemeral', 'Always hidden for these roles…', rules.filter(r => r.visibility === 'ephemeral').map(r => r.roleId)),
        roleSelect('admin_role_pick', 'Set a role for specific channels…', [], 1),
        // Clears the everywhere rules only; a role's channel rules clear on that role's own screen, where the admin can see which they are.
        ...(rules.length ? [clearRow('admin_role_clear', `Clear everywhere rules (${rules.length})`)] : []),
        navRow('admin_roles'),
    ];
}

function buildRoleScope(settings, roleId, place = {}) {
    const existing = (settings?.roleRules || []).filter(r => r.roleId === roleId && r.channelIds?.length);
    const pub = existing.find(r => r.visibility === 'public');
    const eph = existing.find(r => r.visibility === 'ephemeral');
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header('Roles', place),
                { type: 10, content: `### <@&${roleId}> in chosen channels` },
                { type: 10, content: `${visText('public')} in · ${channelList(pub?.channelIds)}\n${visText('ephemeral')} in · ${channelList(eph?.channelIds)}` },
            ],
        },
        channelSelect(`admin_role_scope_public|${roleId}`, 'Public for this role, only in…', pub?.channelIds || []),
        channelSelect(`admin_role_scope_ephemeral|${roleId}`, 'Hidden for this role, only in…', eph?.channelIds || []),
        ...(existing.length ? [clearRow(`admin_role_scope_clear|${roleId}`, "Clear this role's channels")] : []),
        // The tabs, with Roles blurple but live: this screen sits under Roles, and dropping the tabs stranded the admin (click test 2026-10-21 22:26 EDT).
        navRow('admin_roles', { subpage: true }),
    ];
}

// The menu's own order and cut, shared by the render and the save so both agree on which commands the menu could show. Sorted case-blind, so a right-click command sits among the slash commands by name rather than first.
function menuCommands(gateable) {
    const sorted = [...gateable].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    return { shown: sorted.slice(0, SELECT_OPTION_CAP), omitted: sorted.slice(SELECT_OPTION_CAP) };
}

// A rule stored before 2026-10-22 14:01 EDT on a bare command name ('draw') still covers every subcommand, so the menu ticks them all; the next save rewrites it as full paths (see handleComponent).
function coveredByLegacyRule(value, selected) {
    return !isMenuCommand(value) && value.includes(' ') && selected.includes(value.split(' ')[0]);
}

// Up to 20 commands show as toggle buttons, four rows of five (picked 2026-10-22 15:23 EDT: the dropdown was the least visual control on the panel). Past 20 the dropdown returns, because 5 rows of buttons would leave no room for the rest of the page under Discord's 40-component cap.
const TOGGLE_LIMIT = 20;

function buildCommands(settings, gateable, targets = new Map(), place = {}) {
    const selected = settings?.ephemeralCommands || [];
    // ⚠️ A string select takes at most 25 OPTIONS, and unlike the channel/role menus it has no search -- it is a literal list, so everything must fit. One entry per subcommand since 2026-10-22 14:01 EDT, so the list is longer than the command count: 15 today. A BARE slice would make commands past the 25th unconfigurable with no signal at all, so the omitted ones are named. scripts/guildPolicyEnforcement.test.js pins this. If it ever fires for real, paginate the menu (utils/paginationRow.js) -- the cap is Discord's and cannot be raised.
    const { shown, omitted } = menuCommands(gateable);
    const hiddenNow = v => selected.includes(v) || coveredByLegacyRule(v, selected);
    const toggles = shown.length > 0 && shown.length <= TOGGLE_LIMIT;
    const controls = toggles
        ? Array.from({ length: Math.ceil(shown.length / 5) }, (_, i) => ({
            type: 1,
            components: shown.slice(i * 5, i * 5 + 5).map(v => ({
                type: 2,
                // Red is hidden, grey follows the channel and role rules.
                style: hiddenNow(v) ? 4 : 2,
                label: commandLabel(v),
                custom_id: `admin_cmd_toggle|${v}`,
            })),
        }))
        : [{
            type: 1,
            components: [{
                type: 3,
                custom_id: 'admin_cmd_select',
                placeholder: 'Commands that always answer privately…',
                min_values: 0,
                max_values: shown.length,
                options: shown.map(v => ({
                    label: commandLabel(v),
                    value: v,
                    ...(targets.get(v) ? { description: `Right-click a ${targets.get(v)}` } : {}),
                    default: hiddenNow(v),
                })),
            }],
        }];
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header('Commands', place, '-# These always answer privately, even in public channels. Server admins are exempt.'),
                { type: 14, spacing: 2 },
                { type: 10, content: selected.length ? `${visText('ephemeral')} **(${selected.length})** · ${selected.map(commandText).join(' · ')}` : `-# No hidden commands: every command follows your channel and role rules.` },
                ...(toggles ? [{ type: 10, content: `-# Tap a command to hide or show its answer. ${dot('ephemeral')} red = hidden. Capitalised ones are right-click commands.` }] : []),
                // Said plainly because an admin will otherwise expect the command to disappear, and then read its continued presence as a bug rather than a platform limit.
                { type: 10, content: '-# Hides the **answer**, not the command. To remove a command entirely: **Server Settings → Integrations**.' },
                ...(omitted.length ? [{ type: 10, content: `-# ${BOT_EMOJI.warn} Discord allows 25 options per menu, so ${omitted.length} command(s) are missing from the list below: ${omitted.map(commandLabel).join(', ')}. Please report this.` }] : []),
            ],
        },
        ...controls,
        ...(selected.length ? [clearRow('admin_cmd_clear', `Clear hidden commands (${selected.length})`)] : []),
        navRow('admin_commands'),
    ];
}

// CHECK A MEMBER (picked 2026-10-22 15:23 EDT): pick a role, a channel and a command, and see what Dioreo does for a member with that role there, and which rule decided. The three picks ride in each control's custom_id ('-' for none), so the screen holds no state of its own. The command menu holds 24 so "Any command" fits beside it.
function checkState(roleId, channelId, cmd) {
    return [roleId || '-', channelId || '-', cmd || '-'];
}

function checkReason(result, cmd) {
    const where = id => `<#${id}>`;
    switch (result.tier) {
        case 'command': return `${commandText(result.rule)} is a hidden command`;
        case 'roleChannel': return `<@&${result.rule.roleId}> has its own setting in ${channelList(result.rule.channelIds)}`;
        case 'role': return `<@&${result.rule.roleId}> is ${VISIBILITY_LABEL[result.rule.visibility]} everywhere`;
        case 'channel': return `${where(result.rule.channelId)} is set to ${VISIBILITY_LABEL[result.rule.visibility]}`;
        case 'parent': return `this thread follows ${where(result.rule.channelId)}`;
        case 'default': return 'no rule applies, so the server default decides';
        case 'discord': return `${GATE_TEXT[result.rule].replace(' here', ' in this channel for this role')}, before any rule on this panel`;
        default: return 'this server has no rules yet';
    }
}

function buildCheck(settings, gateable, { roleId = null, channelId = null, cmd = null } = {}, place = {}) {
    const shown = menuCommands(gateable).shown.slice(0, 24);
    const command = cmd && shown.includes(cmd) ? cmd : null;
    const gate = channelId && place.discordGate ? place.discordGate(channelId, roleId) : null;
    // Discord's own permissions decide first: /admin can only make Dioreo quieter beneath them.
    const result = !channelId ? null
        : gate ? { visibility: 'ephemeral', tier: 'discord', rule: gate }
            : explainVisibility(settings, { channelId, roleIds: roleId ? [roleId] : [], commandName: command ? command.split(' ')[0] : null, commandPath: command });
    const who = roleId ? `A member with <@&${roleId}>` : 'A member with no role rule';
    const verdict = result
        ? `${who}${command ? `, using ${commandText(command)},` : ''} in <#${channelId}>:\n## ${result.tier === 'discord' && result.rule === 'noCommands' ? '⛔ **Commands not shown**' : visText(result.visibility)}\n-# Because ${checkReason(result)}.${result.visibility === 'public' ? ` Their own ${'`/settings`'} can still make it private.` : ''}`
        : '-# Pick a channel to see the answer.';
    const [r, c, k] = checkState(roleId, channelId, command);
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header('Check a Member', place, '-# What Dioreo does for one member, and which rule decides it.'),
                { type: 14, spacing: 2 },
                { type: 10, content: verdict },
            ],
        },
        { type: 1, components: [{ type: 6, custom_id: `admin_check_role|${c}|${k}`, placeholder: 'Role (optional)…', min_values: 0, max_values: 1, default_values: roleId ? [{ id: roleId, type: 'role' }] : [] }] },
        { type: 1, components: [{ type: 8, custom_id: `admin_check_ch|${r}|${k}`, placeholder: 'Channel…', min_values: 0, max_values: 1, default_values: channelId ? [{ id: channelId, type: 'channel' }] : [] }] },
        { type: 1, components: [{ type: 3, custom_id: `admin_check_cmd|${r}|${c}`, placeholder: 'Command (optional)…', min_values: 0, max_values: 1, options: [
            { label: 'Any command', value: '-', default: !command },
            ...shown.map(v => ({ label: commandLabel(v), value: v, default: v === command })),
        ] }] },
        navRow('admin_home', { subpage: true }),
    ];
}

// THE HELP TAB (Harkirat 2026-10-22 14:57 EDT: "create a help panel for this command, similar to draw calc's help panel"). Same shape as commands/drawCalculator.js's buildHelpPanel: emoji headings, short "**term** · meaning" rows under dividers, no paragraphs. It carries the explanations that used to sit on the pages, so the pages can stay visual.
function buildHelp(client, place = {}) {
    const row = (term, meaning) => `${emojis.smallDot} **${term}** · ${meaning}`;
    const divider = { type: 14, spacing: 2, divider: true };
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header('Help', place, '-# How server settings decide who sees Dioreo\'s answers.'),
                divider,
                { type: 10, content: [
                    '### 🧭 How It Works',
                    `1. **Pick a default** on Overview: ${visText('public')} or ${visText('ephemeral')}`,
                    '2. **Add channel exceptions** on Channels',
                    '3. **Give roles their own setting** on Roles, everywhere or in chosen channels',
                    '4. **Hide single commands** on Commands, down to one subcommand',
                ].join('\n') },
                divider,
                { type: 10, content: [
                    '### 🏆 Which Rule Wins',
                    '`1` Hidden command › `2` role in this channel › `3` role everywhere › `4` channel › `5` default',
                    '-# The first that applies decides. Two roles that disagree at the same level give Public, as Discord\'s own role permissions do.',
                ].join('\n') },
                divider,
                { type: 10, content: [
                    '### 🔒 What Hidden Means',
                    row('Hidden', 'only the person who ran the command sees the answer'),
                    row('Public', `allows a public answer; anyone who chose private in ${mentionCommand(client, '/settings')} still gets private`),
                    row('Not the command', 'it still shows in the list; remove it in **Server Settings → Integrations**'),
                    row('Show Everyone', 'cannot make a hidden answer public'),
                ].join('\n') },
                divider,
                { type: 10, content: [
                    '### 🛡️ Good to Know',
                    row('Admins', 'skip hidden commands, but follow channel and role rules like everyone'),
                    row('Threads', 'follow their channel, unless the thread has its own rule'),
                    row('Menus', 'save when you click outside them; Esc cancels'),
                    row('Clear', 'each page has one once it has rules'),
                    row('Export Log', 'on Overview: every change in the last 60 days, who made it and when. It cannot be cleared, not even by Reset Everything'),
                    row('Check a Member', 'on Overview: pick a role, channel and command to see the answer and the rule behind it'),
                    row('Reset Everything', 'on Overview, two presses: clears every rule and sets the default back to Public'),
                ].join('\n') },
            ],
        },
        navRow('admin_help'),
    ];
}

// ---------------------------------------------------------------------------------------------
// Component dispatch
// ---------------------------------------------------------------------------------------------

// Replaces every rule of one visibility with the given ids, and drops those ids from the opposite list so a channel can never appear in both (which would make precedence order-dependent).
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

// The export's text: newest first, one block per change, in UTC so it reads the same for everyone. Ids become names where the guild is cached; an actor's name comes from Discord, with the id kept beside it as the record.
async function buildLogFile(interaction, rows) {
    const guild = interaction.guild;
    const name = (kind, id) => {
        if (kind === '#') return guild?.channels?.cache?.get(id)?.name ? `#${guild.channels.cache.get(id).name} (${id})` : `#${id}`;
        return guild?.roles?.cache?.get(id)?.name ? `@${guild.roles.cache.get(id).name} (${id})` : `@role ${id}`;
    };
    const plain = line => line.replace(/<#(\d+)>/g, (_, id) => name('#', id)).replace(/<@&(\d+)>/g, (_, id) => name('@', id));
    const actors = new Map();
    for (const id of new Set(rows.map(r => r.actorId))) {
        try { actors.set(id, (await interaction.client.users.fetch(id)).username); } catch { actors.set(id, null); }
    }
    const stamp = d => new Date(d).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    const head = [
        "Dioreo · Server Settings change log",
        `Server: ${guild?.name || 'unknown'} (${interaction.guildId})`,
        `Exported: ${stamp(Date.now())} · last 60 days · ${rows.length} change${rows.length === 1 ? '' : 's'}`,
        'Kept 60 days. It cannot be cleared, so it shows every change in that window.',
        '',
    ];
    const body = rows.map(r => [
        `${stamp(r.createdAt)} · ${r.source === 'owner' ? "Dioreo's owner" : 'admin'} ${actors.get(r.actorId) || 'unknown user'} (${r.actorId})`,
        ...r.changes.map(c => `  - ${plain(c)}`),
    ].join('\n'));
    return [...head, ...(body.length ? body : ['No changes in the last 60 days.'])].join('\n') + '\n';
}

// Where the panel was opened: the server's name and icon for the header, and the channel for Overview's "Here in" line. From the cached guild only, so it costs no REST call; a server the bot has not joined gives neither name nor icon.
function placeOf(interaction) {
    return {
        guildName: interaction.guild?.name || null,
        guildIcon: interaction.guild?.iconURL?.({ size: 128 }) || null,
        channelId: interaction.channelId || null,
        parentId: interaction.channel?.parentId || null,
        // Only where the guild is cached (the bot is in the server): roles and channels arrive with it, so a missing id is gone or out of sight. Threads are checked too, but an archived thread is not cached, which is why staleCount only counts and never removes.
        hasRole: interaction.guild?.roles?.cache ? id => interaction.guild.roles.cache.has(id) : null,
        hasChannel: interaction.guild?.channels?.cache ? id => interaction.guild.channels.cache.has(id) || Boolean(interaction.guild.channels.cache.find?.(c => c.threads?.cache?.has?.(id))) : null,
        gateable: interaction.client?.gateableCommandNames || [],
        botInGuild: require('../utils/guildPolicy').botInGuild(interaction),
        discordGate: interaction.guild?.roles?.everyone ? (channelId, roleId) => discordGate(interaction.guild, channelId, roleId) : null,
    };
}

// WHAT DISCORD ITSELF ALLOWS (Harkirat 2026-10-22 18:21 EDT, "yeah" to showing it). Discord's own permissions are the ceiling under every /admin rule: with Use Application Commands off, Dioreo's commands don't show; with Use External Apps off, Discord forces every app's answer private (his 2026-08-10 test, admin-controls rule). Read from the cached guild, for @everyone or one role in one channel (a thread reads its parent). Returns 'noCommands', 'private' or null when Discord allows public answers.
function discordGate(guild, channelId, roleId = null) {
    try {
        let channel = guild.channels.cache.get(channelId);
        if (channel?.isThread?.() && channel.parent) channel = channel.parent;
        if (!channel?.permissionsFor) return null;
        const role = roleId ? guild.roles.cache.get(roleId) : guild.roles.everyone;
        const perms = role && channel.permissionsFor(role);
        if (!perms) return null;
        if (perms.has(PermissionFlagsBits.Administrator)) return null;
        if (!perms.has(PermissionFlagsBits.UseApplicationCommands)) return 'noCommands';
        if (!perms.has(PermissionFlagsBits.UseExternalApps)) return 'private';
        return null;
    } catch {
        return null;
    }
}

const GATE_TEXT = { noCommands: "Discord blocks **Use Application Commands** here, so Dioreo's commands don't show", private: 'Discord blocks **Use External Apps** here, so every app answers privately' };

// Single entry point for every `admin_*` component. handlers/router.js routes here rather than growing another dozen branches in its own handler, and the admin gate lives here so there is exactly one place that decides who may change a server's rules.
async function handleComponent(interaction) {
    if (!interaction.guildId) {
        return interaction.reply({ content: `${emojis.serverSettings} **Server Settings only work inside a server.**`, ephemeral: true });
    }
    if (!isServerAdmin(interaction)) {
        require('../utils/eventStore').markOutcome('rejected_admin');
        return interaction.reply({
            content: `🔒 **Server admins only.** These controls change how Dioreo behaves for everyone here, so they need **Manage Server**.\n-# If your server's admins lost access, Discord Support can restore ownership; once Discord says you're an admin again, this panel opens. Dioreo's owner can also reset this server's rules on request.`,
            ephemeral: true,
        });
    }

    const [id, arg] = interaction.customId.split('|');
    const guildId = interaction.guildId;
    const actorId = interaction.user.id;
    const values = interaction.values || [];
    const place = placeOf(interaction);

    let settings;
    switch (id) {
        case 'admin_home':
        case 'admin_channels':
        case 'admin_roles':
        case 'admin_commands':
        case 'admin_help':
            settings = await getGuildSettings(guildId);
            break;

        // EXPORT LOG: the server's change log as a private text file (Harkirat 2026-10-22 15:51 EDT). Channels and roles are named where Dioreo can see them, with the id beside.
        case 'admin_log': {
            const GuildSettingsLog = require('../models/GuildSettingsLog');
            const rows = await GuildSettingsLog.find({ guildId }).sort({ createdAt: -1 }).limit(2000).lean();
            const file = await buildLogFile(interaction, rows);
            return interaction.reply({
                content: rows.length ? `${emojis.serverSettings} **Change log** · ${rows.length} change${rows.length === 1 ? '' : 's'} in the last 60 days` : `${emojis.serverSettings} **Change log** · no changes in the last 60 days`,
                files: [{ attachment: Buffer.from(file, 'utf8'), name: `dioreo-server-settings-log-${guildId}.txt` }],
                ephemeral: true,
                allowedMentions: NO_PINGS,
            });
        }

        case 'admin_reset_arm':
            settings = await getGuildSettings(guildId);
            return send(interaction, buildHome(settings, interaction.client, place, { resetArmed: true }));

        case 'admin_reset':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                doc.channelRules = [];
                doc.roleRules = [];
                doc.ephemeralCommands = [];
                doc.defaultVisibility = 'public';
            });
            break;

        case 'admin_check':
        case 'admin_check_role':
        case 'admin_check_ch':
        case 'admin_check_cmd': {
            settings = await getGuildSettings(guildId);
            const parts = interaction.customId.split('|').slice(1).map(v => (v === '-' ? null : v));
            const picked = values[0] && values[0] !== '-' ? values[0] : null;
            const state = id === 'admin_check' ? { channelId: interaction.channelId }
                : id === 'admin_check_role' ? { roleId: picked, channelId: parts[0], cmd: parts[1] }
                    : id === 'admin_check_ch' ? { roleId: parts[0], channelId: picked, cmd: parts[1] }
                        : { roleId: parts[0], channelId: parts[1], cmd: picked };
            return send(interaction, buildCheck(settings, interaction.client.gateableCommandNames || [], state, place));
        }

        // One command's toggle. An older bare-name rule ('draw') covering it is first split into its subcommands, so flipping /draw prices leaves /draw calculator as it was.
        case 'admin_cmd_toggle': {
            const gateable = interaction.client.gateableCommandNames || [];
            if (!gateable.includes(arg)) return;
            settings = await updateGuildSettings(guildId, actorId, doc => {
                let list = [...(doc.ephemeralCommands || [])];
                const parent = arg.split(' ')[0];
                if (!isMenuCommand(arg) && arg.includes(' ') && list.includes(parent)) {
                    list = list.filter(c => c !== parent).concat(gateable.filter(v => v.startsWith(`${parent} `)));
                }
                list = list.includes(arg) ? list.filter(c => c !== arg) : [...list, arg];
                doc.ephemeralCommands = [...new Set(list)];
            });
            break;
        }

        // Overview's two default buttons; the button for the current default is disabled, so a click always means a change.
        case 'admin_default':
            if (arg !== 'public' && arg !== 'ephemeral') return;
            settings = await updateGuildSettings(guildId, actorId, doc => { doc.defaultVisibility = arg; });
            break;

        case 'admin_default_toggle':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                doc.defaultVisibility = (doc.defaultVisibility || 'public') === 'public' ? 'ephemeral' : 'public';
            });
            break;

        case 'admin_ch_public':
        case 'admin_ch_ephemeral':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                setChannelRules(doc, id === 'admin_ch_public' ? 'public' : 'ephemeral', values);
            });
            break;

        case 'admin_role_public':
        case 'admin_role_ephemeral':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                setUnscopedRoleRules(doc, id === 'admin_role_public' ? 'public' : 'ephemeral', values);
            });
            break;

        case 'admin_ch_clear':
            settings = await updateGuildSettings(guildId, actorId, doc => { doc.channelRules = []; });
            break;

        case 'admin_role_clear':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                doc.roleRules = (doc.roleRules || []).filter(r => r.channelIds?.length);
            });
            break;

        case 'admin_cmd_clear':
            settings = await updateGuildSettings(guildId, actorId, doc => { doc.ephemeralCommands = []; });
            break;

        case 'admin_role_scope_clear':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                doc.roleRules = (doc.roleRules || []).filter(r => !(r.roleId === arg && r.channelIds?.length));
            });
            return send(interaction, buildRoleScope(settings, arg, place));

        case 'admin_role_pick':
            settings = await getGuildSettings(guildId);
            return send(interaction, buildRoleScope(settings, values[0], place));

        case 'admin_role_scope_public':
        case 'admin_role_scope_ephemeral':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                setScopedRoleRule(doc, arg, id === 'admin_role_scope_public' ? 'public' : 'ephemeral', values);
            });
            return send(interaction, buildRoleScope(settings, arg, place));

        case 'admin_cmd_select':
            settings = await updateGuildSettings(guildId, actorId, doc => {
                // Merge, not replace (v3-pre-release review, finding #28) -- the menu can only ever show/return the first SELECT_OPTION_CAP (25) of the sorted gateable list (see buildCommands' own comment), so a straight replace silently deleted every existing rule on a command past that cutoff the moment an admin touched this menu for an unrelated reason. Preserve whatever was already set for a command this render of the menu couldn't even show. A bare command name stored before per-subcommand rules ('draw') is replaced by full paths: the menu showed its subcommands ticked, so the values that come back are the admin's real choice for those, and keeping the bare name would hide /draw prices forever after the admin unticked it. Any of its subcommands the menu could NOT show inherit the bare rule as a full path, so the rewrite never un-hides an answer the admin had no chance to see (commit security review 2026-10-22 14:12 EDT: dropping the bare name outright would fail open past the 25-option cut).
                const gateable = interaction.client.gateableCommandNames || [];
                const { shown } = menuCommands(gateable);
                const outsideMenu = [];
                for (const c of doc.ephemeralCommands || []) {
                    if (shown.includes(c)) continue;
                    const subcommands = gateable.filter(v => v.startsWith(`${c} `));
                    if (!subcommands.length) outsideMenu.push(c);
                    else outsideMenu.push(...subcommands.filter(v => !shown.includes(v)));
                }
                doc.ephemeralCommands = [...new Set([...outsideMenu, ...values])];
            });
            break;

        default:
            return;
    }

    // Which page to re-render after a write: the one the control lives on. A per-id table, not two chained ternaries re-deriving the page and then the builder (v3-pre-release review, finding #46) -- the page step matched by PREFIX, and admin_role_pick/admin_role_scope_public/admin_role_scope_ephemeral all shared the admin_role_ prefix too, safe only because each of those three `return`s earlier in the switch above and never reaches this code. The switch above is the actual source of truth for which id maps to which page; this table just names it directly instead of re-deriving it by string-matching the id a second time.
    const PAGE_FOR_ID = {
        admin_home: 'admin_home',
        admin_channels: 'admin_channels',
        admin_roles: 'admin_roles',
        admin_commands: 'admin_commands',
        admin_default_toggle: 'admin_home',
        admin_default: 'admin_home',
        admin_reset: 'admin_home',
        admin_cmd_toggle: 'admin_commands',
        admin_help: 'admin_help',
        admin_ch_public: 'admin_channels',
        admin_ch_ephemeral: 'admin_channels',
        admin_role_public: 'admin_roles',
        admin_role_ephemeral: 'admin_roles',
        admin_cmd_select: 'admin_commands',
        admin_ch_clear: 'admin_channels',
        admin_role_clear: 'admin_roles',
        admin_cmd_clear: 'admin_commands',
    };
    const page = PAGE_FOR_ID[id] || id;

    const PAGE_BUILDERS = {
        admin_channels: () => buildChannels(settings, place),
        admin_roles: () => buildRoles(settings, place),
        admin_commands: () => buildCommands(settings, interaction.client.gateableCommandNames || [], interaction.client.contextMenuTargets, place),
        admin_help: () => buildHelp(interaction.client, place),
    };
    const components = (PAGE_BUILDERS[page] || (() => buildHome(settings, interaction.client, place)))();

    // ⚠️ Was a raw `interaction.update({ components, flags: 32768 })` until 2026-08-14 10:59 EDT -- switched to sendV2Payload for two reasons at once: (1) it's the established pattern every other handler in the bot uses for a V2 render (CLAUDE.md's "V2 sends" cheat-sheet: discord.js's own high-level reply/followUp/update don't RELIABLY serialize raw V2 JSON), and this command had never been real-world click-tested live (docs/ROADMAP.md's click-test checklist names it the one deliberate holdout) -- so matching the battle-tested path is strictly safer regardless of whether the raw call actually worked; (2) it's what makes this panel pick up the passive 10-minute idle-disable for free (utils/sendV2Payload.js's own header comment). The three `interaction.update()` calls above got the same swap for the same reasons.
    return send(interaction, components);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription("SERVER ADMINS: control Dioreo's server settings")
        // Keeps the command out of ordinary members' pickers where the bot IS guild-installed. It is NOT the gate -- Discord ignores this field for a user-installed invocation, which is exactly the case this feature exists to cover, so execute() re-checks for real.
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        // Hidden by default; Public posts the panel in the channel (Harkirat 2026-10-22 14:59 EDT: "theres also no visibility option for it"). The cost, accepted: a public panel shows the server's rules to everyone there. Its buttons still refuse anyone without Manage Server (handleComponent), and a channel rule set to Hidden still makes it private (attachGuildPolicy).
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.')
            .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        // [0, 1]: kept so an admin can still open the panel through their own install, to read or tidy the rules, while Dioreo is not in the server. Since 2026-10-22 17:05 EDT the rules apply only while the bot IS in the server (utils/guildPolicy.js's botInGuild), and the panel says so when it is not.
        //
        // ⚠️ The cost of keeping [1], found by Harkirat live 2026-08-10 16:06 EDT: a user-installed command travels with the USER into every server they are in, so /admin appears for anyone who has installed the bot even where it is not guild-installed, and setDefaultMemberPermissions cannot hide it (Discord ignores that field for user-installed invocations -- which is why the runtime admin check above is the real gate). setContexts([0]) is the part that CAN be fixed: guild channels only, so it no longer appears in DMs or group DMs where it could never do anything but refuse.
        .setIntegrationTypes([0, 1]).setContexts([0]),

    handleComponent,
    // For /bot servers, the owner's override tool (commands/bot.js).
    rulesText,
    lastChangedLine,
    // Exported for scripts/guildPolicyEnforcement.test.js only -- nothing in the bot calls these from outside this file. They are here because both limits these tests pin (25 options on a select, 40 components per message) are invisible right up until a panel refuses to open, and a test is the only thing that will notice before an admin does.
    __testRenderers: { buildHome, buildChannels, buildRoles, buildRoleScope, buildCommands, buildHelp, buildCheck, buildLogFile, discordGate },

    async execute(interaction) {
        // Private unless the admin picks Public. The refusals below stay private whatever was picked: a non-admin's "Public" must not post a refusal into the channel.
        const isPublic = interaction.options?.getString?.('visibility') === 'public' && Boolean(interaction.guildId) && isServerAdmin(interaction);
        await interaction.deferReply({ ephemeral: !isPublic });

        if (!interaction.guildId) {
            return send(interaction, [{
                type: 17,
                accent_color: ACCENT,
                components: [
                    { type: 10, content: `## ${emojis.serverSettings} Server Settings` },
                    { type: 10, content: 'This one only works **inside a server** — there is nothing to configure in a DM.' },
                ],
            }]);
        }

        if (!isServerAdmin(interaction)) {
            return send(interaction, [{
                type: 17,
                accent_color: ACCENT,
                components: [
                    { type: 10, content: '## 🔒 Server admins only' },
                    { type: 10, content: `These controls change how Dioreo behaves for everyone in this server, so they need the **Manage Server** permission.\n\n-# Looking for your own settings? ${mentionCommand(interaction.client, '/settings')} is yours and works anywhere.\n-# Lost access? Discord Support can restore ownership; once Discord says you're an admin again, this panel opens. Dioreo's owner can also reset this server's rules on request.` },
                ],
            }]);
        }

        const settings = await getGuildSettings(interaction.guildId);
        return send(interaction, buildHome(settings, interaction.client, placeOf(interaction)));
    },
};
