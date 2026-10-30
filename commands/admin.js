// commands/admin.js
//
// /admin -- the SERVER-ADMIN control panel. Deliberately distinct from /manage, which is Harkirat's owner-level panel gated on hasCommandAccess(userId, 'manage') (utils/adminAccess.js) and stays user-install-only. This one belongs to whoever administers the server the command was run in.
//
// It configures the RESPONSE-VISIBILITY POLICY for slash commands (utils/guildPolicy.js) and, since B7 (2026-10-30), the text-command switch and prefixes on its Config Text Commands view. Nothing here refuses a command or touches a channel, because the bot holds no moderation permission and never acts on a channel outside an interaction (root CLAUDE.md), so it could not enforce either. Design + the rejected alternatives: docs/superpowers/specs/2026-08-10-server-admin-visibility-policy-design.md
const BOT_EMOJI = require('../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');
// ⚠️ Required as the whole module and read INSIDE the render functions below, never destructured or captured at module level. refreshEmojiIds() rewrites this object in place at boot, long after this file is require()d, so a module-level capture freezes the pre-sync id and renders broken on the dev bot -- four sites shipped exactly that bug on 2026-07-26. See .claude/rules/rendering-and-ui.md.
const emojis = require('../utils/emojiMap');
const { commandEntries, commandEntry, explainVisibility, getGuildSettings, isServerAdmin, resolveVisibility, updateGuildSettings } = require('../utils/guildPolicy');
const { toBoldItalicUnicode } = require('../utils/titleBlock');
const { mentionCommand } = require('../utils/commandMentions');

// Every /admin render goes out with mentions OFF. Since the panel can be posted publicly (2026-10-22 14:59 EDT), its role and user mentions would otherwise ping those roles and people in the channel (found by the edge-case pass, 2026-10-22 15:38 EDT).
const NO_PINGS = { parse: [] };
const send = (interaction, components) => sendV2Payload(interaction, components, { allowedMentions: NO_PINGS });

// Discord blurple -- this panel configures a SERVER's own behaviour, so it deliberately does not borrow any of the content commands' accents (see .claude/rules/rendering-and-ui.md's colour map).
const ACCENT = 0x5865F2;

// A select menu accepts at most 25 options. The bot registers 12 gate-able commands today (measured 2026-08-18, v3-pre-release review finding #64 -- was stale at 19), so this is headroom rather than a live truncation -- but it is a real cliff, and a silent one: Discord rejects the whole payload rather than trimming, which renders as a dead button.
const SELECT_OPTION_CAP = 25;

// THE TEXT-COMMAND VIEW (B7, 2026-10-30; Harkirat 2026-10-29 15:54 EDT: "admins need 2 controls, for slash commands and for text commands. text commands aren't private, so they're either a 'turn off here or allow here' sort of system"). The same pages, reached by one button that flips between **Config Text Commands** and **Config Slash Commands** (his labels, 2026-10-29 23:28 EDT), editing GuildSettings.textRules: the same rule set, read as On / Off. Every builder below draws either view. `VIEW` says which while one draws (a render is synchronous, and inView() puts it back), and textIds() moves each control into the `admin_t_` namespace so a click edits the text rules and stays on that view.
let VIEW = 'slash';
const WORDS = { slash: { public: 'Public', ephemeral: 'Private' }, text: { public: 'On', ephemeral: 'Off' } };
const isText = () => VIEW === 'text';

// ---------------------------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------------------------

// Discord requires slash-command names in lowercase, so a capital letter marks a right-click command ("Convert Times") -- which is gateable too, because the policy reads interaction.commandName and a context menu carries one. It must never be shown with a slash (click test 2026-10-21 22:26 EDT: "/Convert Times").
const isMenuCommand = value => /[A-Z]/.test(value);
// On the text view a command is named as it is typed (`today`, `gunsmith dmz`), its rules stored under the slash path (`gunsmith mp`).
const textName = value => require('../utils/textCommands/commands').TEXT_COMMANDS.find(c => require('../utils/textCommands/commands').textPathOf(c) === value)?.name || value;
const commandLabel = value => (isText() ? textName(value) : isMenuCommand(value) ? value : `/${value}`);
const commandText = value => (isText() ? `\`${textName(value)}\`` : isMenuCommand(value) ? `${value} *(right-click)*` : `\`/${value}\``);
// Every text command's path, the text view's Commands menu.
const textPaths = () => { const c = require('../utils/textCommands/commands'); return c.TEXT_COMMANDS.map(c.textPathOf); };

// A rule's visibility as a coloured dot and a word, the same everywhere on the panel, so the state reads before the text does (Harkirat 2026-10-22 14:57 EDT: "make it more visual rather than prose"). Read at render time: the dev bot re-points these ids at boot.
const dot = visibility => (visibility === 'public' ? emojis.greenDotGlow : emojis.redDotGlow);
const visText = visibility => `${dot(visibility)} **${WORDS[VIEW][visibility]}**`;

// THE PER-COMMAND MODEL (Harkirat 2026-10-22 18:31 EDT: "man idk, this is confusing ... build it out autonomously and then show me"). One sentence: server settings cover every command; give a command its own settings and it uses only those. The panel has ONE set of pages (Overview, Channels, Roles) and a SCOPE: blank for the server, or one command path. Every control in a scoped page carries the scope as the last `|` field of its custom_id, so a click edits that command's own rules and never the server's.
const sid = (id, arg, scope) => (scope ? `${id}|${arg ?? ''}|${scope}` : (arg !== undefined && arg !== null && arg !== '' ? `${id}|${arg}` : id));

// The rule set a page shows and edits: the server's, or a command's own. A command without its own settings shows a fresh set that starts from the server default, so adding one exception never flips the rest.
function ruleSet(settings, scope) {
    if (!scope) return settings || { defaultVisibility: 'public', channelRules: [], roleRules: [] };
    return commandEntry(settings, scope) || { command: scope, defaultVisibility: settings?.defaultVisibility || 'public', channelRules: [], roleRules: [], fresh: true };
}

// A command's state as one word and a button style, for the Commands menu and summaries: follows the server (grey), Hidden or Public with no exceptions (red, green), or custom with channel or role rules (blurple).
function commandState(entry) {
    if (!entry) return { word: 'Follows server', style: 2 };
    const custom = entry.channelRules.length || entry.roleRules.length;
    if (custom) return { word: `${WORDS[VIEW][entry.defaultVisibility]}, ${entry.channelRules.length + entry.roleRules.length} exception${entry.channelRules.length + entry.roleRules.length === 1 ? '' : 's'}`, style: 1 };
    return { word: WORDS[VIEW][entry.defaultVisibility], style: entry.defaultVisibility === 'public' ? 3 : 4 };
}

function commandSummary(entry) {
    return `${dot(entry.defaultVisibility)} ${commandText(entry.command)} · ${commandState(entry).word}`;
}

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
    if (place.gateable?.length) n += commandEntries(settings).filter(e => !place.gateable.includes(e.command) && !place.gateable.some(v => v.startsWith(`${e.command} `))).length;
    return n;
}

function hasRules(settings) {
    return Boolean(settings?.ephemeralCommands?.length || settings?.commandSettings?.length || settings?.roleRules?.length || settings?.channelRules?.length);
}

// "Server Settings" with the server-settings emoji on every page (Harkirat 2026-10-22 14:57 EDT, "title to Server Settings"; the one emoji is his 13:40 EDT option A). Custom emoji per sub-page are filed for after v3 in docs/db-deferred-list.md. The tabs say which page is open.
function pageTitle(page, scope) {
    const where = scope ? ` · ${commandLabel(scope)}` : '';
    // The text view is titled for what it sets, so its pages never read as the slash ones (B7).
    return `## ${isText() ? `${emojis.command || emojis.serverSettings} Text Commands` : `${emojis.serverSettings} Server Settings`}${page ? ` · ${page}` : ''}${where}`;
}

// The one button that flips between the two views (his labels, 2026-10-29 23:28 EDT), blurple so it reads as a tool rather than a tab. On Overview, in its own row under the tabs.
function viewRow() {
    const icon = emojis.parseEmoji(isText() ? emojis.serverSettings : (emojis.command || ''));
    return { type: 1, components: [{ type: 2, style: 1, label: isText() ? 'Config Slash Commands' : 'Config Text Commands', custom_id: `admin_view|${isText() ? 'slash' : 'text'}`, ...(icon ? { emoji: icon } : {}) }] };
}

// The prefixes block on the text view's Overview: what works here, Edit (a pop-up), and Reset Prefix once the server has its own (his ask, 2026-10-30 12:35 EDT: "we also need a reset prefix option"). A server's prefix takes `d`'s place; `dior` and `@Dioreo` always stay.
function prefixSection(settings, client) {
    const { prefixParts } = require('../utils/textCommands/server');
    const { replaceable, fixed } = prefixParts();
    const own = settings?.textPrefixes || [];
    const code = list => list.map(p => `\`${p}\``).join(' · ');
    const always = [...fixed, '@Dioreo'].map(p => `\`${p}\``).join(' and ');
    const lines = [own.length ? `${code(own)} *(in place of \`${replaceable}\`)*\n-# ${always} always work` : `\`${replaceable}\` *(default)*\n-# ${always} always work`];
    if (client?.textMessageContent === false) lines.push(`-# ${BOT_EMOJI.warn} Discord hasn't given Dioreo Message Content yet, so only \`@Dioreo\` works for now.`);
    return [
        { type: 10, content: `### Prefix\n${lines.join('\n')}` },
        { type: 1, components: [
            { type: 2, style: 2, label: 'Edit Prefix', custom_id: 'admin_prefix' },
            ...(own.length ? [{ type: 2, style: 4, label: `Reset to ${replaceable}`, custom_id: 'admin_prefix_reset' }] : []),
        ] },
    ];
}

function roleRuleText(rule) {
    const where = rule.channelIds?.length ? `in ${channelList(rule.channelIds)}` : 'everywhere';
    return `<@&${rule.roleId}> → ${visText(rule.visibility)} ${where}`;
}

// The five tabs. The open page is blurple and disabled (Harkirat 2026-10-22 14:57 EDT: "active page should = blurple-disabled", the footer convention of utils/globalNav.js). `subpage` keeps the parent tab blurple but clickable, so the role-in-channels screen can still go back to Roles.
function navRow(active, { subpage = false, scope = null } = {}) {
    // In a command's scope, Overview, Channels and Roles stay on that command; Commands and Help leave it.
    const scoped = new Set(['admin_home', 'admin_channels', 'admin_roles']);
    const btn = (id, label) => ({ type: 2, style: id === active ? 1 : 2, label, custom_id: scoped.has(id) ? sid(id, '', scope) : id, ...(id === active && !subpage ? { disabled: true } : {}) });
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

// The answer to "how do I clear a rule?". A select only saves when it is closed by clicking outside it, and Escape silently cancels, so emptying a menu read as cleared when it was not (click test 2026-10-21 22:26 EDT). Shown only when there is something to clear. It sits INSIDE the panel, as the accessory of the very text it clears (Harkirat 2026-10-22 23:39 EDT: "those buttons, can you put them actually in the embed?"), so the text says what goes and the label stays short enough to sit beside it on a phone. With nothing to clear the text stands alone, since a Section must have an accessory.
function withClear(content, customId, count, label = `Clear (${count})`) {
    const text = { type: 10, content };
    return count ? { type: 9, components: [text], accessory: { type: 2, style: 4, label, custom_id: customId } } : text;
}

// One Overview block per rule area, its Edit button as the Section's accessory, so every setting is one press from the summary. The `|go` suffix keeps its custom_id distinct from the nav row's identical target (Discord refuses a message with a duplicated id).
function areaSection(title, lines, target, scope = null) {
    return {
        type: 9,
        components: [{ type: 10, content: `### ${title}\n${lines.join('\n')}` }],
        accessory: { type: 2, style: 2, label: 'Edit', custom_id: scope ? `${target}|go|${scope}` : `${target}|go` },
    };
}

// The page header: title, the server it is for (his ask, 2026-10-22 14:57 EDT: "mention the server the settings are for"), and on Overview the server's icon beside them. The name and icon come from the cached guild, so a user-installed /admin in a server the bot is not in shows neither; that is the only case without them.
function header(page, place = {}, subtitle = null, scope = null) {
    const lines = [pageTitle(page, scope)];
    if (place.guildName) lines.push(`-# ${toBoldItalicUnicode(place.guildName)}`);
    if (subtitle) lines.push(subtitle);
    const text = { type: 10, content: lines.join('\n') };
    return place.guildIcon && !page && !scope
        ? [{ type: 9, components: [text], accessory: { type: 11, media: { url: place.guildIcon } } }]
        : [text];
}

function buildHome(settings, client, place = {}, { resetArmed = false, scope = null } = {}) {
    if (scope) return buildCommandHome(settings, client, place, scope);
    // Dioreo not in this server: the rules are kept but do nothing, and Discord's own permissions decide.
    const notIn = place.botInGuild === false
        ? [{ type: 10, content: `-# ${BOT_EMOJI.warn} **Dioreo isn't added to this server**, so these rules don't apply right now. Members' own installs follow Discord's channel permissions (Use External Apps). Add Dioreo to the server and the rules work again.` }]
        : [];
    const def = settings?.defaultVisibility || 'public';
    const channelRules = settings?.channelRules || [];
    const roleRules = settings?.roleRules || [];
    const commands = commandEntries(settings);
    const text = isText();
    const byVis = v => channelRules.filter(r => r.visibility === v).map(r => r.channelId);

    const channelLines = channelRules.length
        ? ['ephemeral', 'public'].filter(v => byVis(v).length).map(v => `${visText(v)} in ${channelList(byVis(v))}`)
        : ['-# No channel rules'];
    const roleLines = roleRules.length ? roleRules.map(roleRuleText) : ['-# No role rules'];
    const commandLines = commands.length ? commands.slice(0, 6).map(commandSummary).concat(commands.length > 6 ? [`-# +${commands.length - 6} more`] : []) : ['-# Every command follows the settings above'];

    // What this very channel does right now, for a member with no role rule: the one fact an admin otherwise has to work out from the rules above. Discord's gates are about slash commands, so the text view leaves them out.
    const hereGate = !text && place.channelId && place.discordGate ? place.discordGate(place.channelId) : null;
    const here = place.channelId
        ? resolveVisibility(settings || { defaultVisibility: 'public' }, { channelId: place.channelId, parentChannelId: place.parentId || null, roleIds: [] })
        : null;

    // The explainer shows in full only while the server has no rules (Harkirat 2026-10-22 13:47 EDT, "Text 1"); the rest lives on Help.
    const explainer = hasRules(settings)
        ? '-# A command with its own settings uses only those. Otherwise: role › channel › default. More on **Help**.'
        : text
            ? '-# **These cover every text command.** Give one its own on **Commands**.\n-# Off means Dioreo stays silent there. Slash commands are set on **Config Slash Commands**.'
            : `-# **These settings cover every command.** Give one command its own on **Commands**.\n-# A rule can only make Dioreo **quieter** — Public *permits* a public answer, it never overrides someone's own ${mentionCommand(client, '/settings')}.`;

    const defaultButton = v => ({
        type: 2,
        // The in-panel switcher convention: the current choice is green and disabled (rendering-and-ui.md).
        style: def === v ? 3 : 2,
        label: WORDS[VIEW][v],
        custom_id: `admin_default|${v}`,
        ...(def === v ? { disabled: true } : {}),
    });

    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                // The server's own prefix in the example once it has one (B7's fix-up, 2026-10-30 15:03 EDT).
                ...header(null, place, text ? `-# Where typed commands like \`${(settings?.textPrefixes || [])[0] || 'd'} today\` work, and where Dioreo stays silent.` : '-# Where Dioreo answers **publicly**, and where only the person who asked sees it.'),
                ...notIn,
                { type: 14, spacing: 2 },
                { type: 10, content: text ? `### Default\n-# Text commands are ${visText(def)} unless a rule below says otherwise.` : `### Default\n-# Every answer is ${visText(def)} unless a rule below says otherwise.` },
                { type: 1, components: [defaultButton('public'), defaultButton('ephemeral')] },
                ...(text ? prefixSection(settings, client) : []),
                { type: 14, spacing: 2 },
                areaSection(`Channels${channelRules.length ? ` (${channelRules.length})` : ''}`, channelLines, 'admin_channels'),
                areaSection(`Roles${roleRules.length ? ` (${roleRules.length})` : ''}`, roleLines, 'admin_roles'),
                areaSection(`Commands with their own settings${commands.length ? ` (${commands.length})` : ''}`, commandLines, 'admin_commands'),
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
        viewRow(),
    ];
}

// ONE COMMAND'S OVERVIEW: the same page as the server's, scoped. Follow Server removes the command's own settings; Public or Hidden gives it its own, starting with no exceptions.
function buildCommandHome(settings, client, place, scope) {
    const entry = commandEntry(settings, scope);
    const rules = ruleSet(settings, scope);
    const byVis = v => rules.channelRules.filter(r => r.visibility === v).map(r => r.channelId);
    const pick = entry ? rules.defaultVisibility : 'follow';
    const btn = (value, label) => ({ type: 2, style: pick === value ? 3 : 2, label, custom_id: sid('admin_cmd_default', value, scope), ...(pick === value ? { disabled: true } : {}) });
    const here = place.channelId
        ? explainVisibility(settings || {}, { channelId: place.channelId, parentChannelId: place.parentId || null, roleIds: [], commandName: scope.split(' ')[0], commandPath: scope })
        : null;
    const body = entry
        ? [
            { type: 10, content: `### Default for ${commandLabel(scope)}\n-# ${visText(rules.defaultVisibility)} everywhere, except the rules below.` },
            { type: 1, components: [btn('follow', 'Follow Server'), btn('public', 'Public'), btn('ephemeral', 'Private')] },
            { type: 14, spacing: 2 },
            areaSection(`Channels${rules.channelRules.length ? ` (${rules.channelRules.length})` : ''}`, rules.channelRules.length ? ['ephemeral', 'public'].filter(v => byVis(v).length).map(v => `${visText(v)} in ${channelList(byVis(v))}`) : ['-# No channel exceptions'], 'admin_channels', scope),
            areaSection(`Roles${rules.roleRules.length ? ` (${rules.roleRules.length})` : ''}`, rules.roleRules.length ? rules.roleRules.map(roleRuleText) : ['-# No role exceptions'], 'admin_roles', scope),
        ]
        : [
            { type: 10, content: `### ${commandLabel(scope)} follows the server settings\n-# Pick ${WORDS[VIEW].public} or ${WORDS[VIEW].ephemeral} to give it its own. Then add channel or role exceptions for it alone.` },
            { type: 1, components: [btn('follow', 'Follow Server'), btn('public', 'Public'), btn('ephemeral', 'Private')] },
        ];
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header(null, place, `-# ${entry ? `**${commandLabel(scope)} has its own settings.** It ignores the server-wide ones; every other command still uses them.` : 'Settings for this one command.'}`, scope),
                { type: 14, spacing: 2 },
                ...body,
                ...(here ? [{ type: 14, spacing: 2 }, { type: 10, content: `📍 **Here in <#${place.channelId}>** · ${visText(here.visibility)} for ${commandLabel(scope)}, for members without a role rule` }] : []),
                { type: 1, components: [
                    { type: 2, style: 2, label: 'All Commands', custom_id: 'admin_commands|back' },
                    { type: 2, style: 2, label: 'Server-wide Settings', custom_id: 'admin_home|back' },
                ] },
            ],
        },
        navRow('admin_home', { scope }),
    ];
}

function ruleCount(settings) {
    return commandEntries(settings).length + (settings?.roleRules?.length || 0) + (settings?.channelRules?.length || 0);
}

// Overview's last row: Check a Member, and Reset Slash Rules (Reset Text Rules on the text view) once there is something to reset. Reset is two presses: the first turns the row into Cancel · Confirm, so one stray click cannot wipe a server's setup (picked 2026-10-22 15:23 EDT).
function toolsRow(settings, resetArmed) {
    const count = ruleCount(settings);
    // The text view's reset also puts the prefixes back.
    const prefixes = isText() && (settings?.textPrefixes || []).length;
    const changed = count || prefixes || (settings?.defaultVisibility || 'public') !== 'public';
    if (resetArmed && changed) {
        return { type: 1, components: [
            { type: 2, style: 2, label: 'Cancel', custom_id: 'admin_home|cancel' },
            { type: 2, style: 4, label: `Confirm: clear ${count} ${isText() ? 'text' : 'slash'} rule${count === 1 ? '' : 's'}${prefixes ? ' and the prefix' : ''}, set ${WORDS[VIEW].public}`, custom_id: 'admin_reset' },
        ] };
    }
    return { type: 1, components: [
        { type: 2, style: 2, label: 'Check a Member', custom_id: 'admin_check' },
        { type: 2, style: 2, label: 'Export Log', custom_id: 'admin_log' },
        // Named for the view it resets (his 2026-10-30 12:35 EDT: "reset everything kind of implies everything"): each view's reset clears only its own rules.
        ...(changed ? [{ type: 2, style: 4, label: isText() ? 'Reset Text Rules' : 'Reset Slash Rules', custom_id: 'admin_reset_arm' }] : []),
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
    const commands = commandEntries(settings);
    lines.push(`**Commands with own settings** · ${commands.length ? commands.map(commandSummary).join(' · ') : 'none'}`);
    // The text-command switch and prefix (B7), so the owner's tool shows and records them too.
    const text = settings.textRules;
    const prefix = settings.textPrefixes || [];
    if (text || prefix.length) {
        const n = (text?.channelRules?.length || 0) + (text?.roleRules?.length || 0) + commandEntries(text || {}).length;
        lines.push(`**Text commands** · ${text?.defaultVisibility === 'ephemeral' ? 'Off' : 'On'} by default · ${n} rule${n === 1 ? '' : 's'}${prefix.length ? ` · prefix ${prefix.map(p => `\`${p}\``).join(' ')}` : ''}`);
    }
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

function buildChannels(settings, place = {}, scope = null) {
    const set = ruleSet(settings, scope);
    const rules = set.channelRules || [];
    const def = set.defaultVisibility || 'public';
    const ephemeral = rules.filter(r => r.visibility === 'ephemeral').map(r => r.channelId);
    const publicIds = rules.filter(r => r.visibility === 'public').map(r => r.channelId);
    // Channels this page sets to Public that Discord itself keeps private: the confusion the Discord line exists for. Not on the text view: those gates are about slash commands.
    const gated = place.discordGate && !isText() ? publicIds.filter(id => place.discordGate(id)) : [];
    const lead = scope
        ? `-# Only for ${commandLabel(scope)}. Its default is ${visText(def)}. Pick channels where it answers differently.`
        : `-# Your default is ${visText(def)}. Pick channels that answer differently.`;
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                // ⚠️ KEEP THIS PAGE SHORT (Harkirat 2026-08-10 18:23 EDT: lead with the workflow, let help carry the detail). The default is stated here rather than "set that on Overview first", which read as an instruction to go somewhere else (click test 2026-10-21 22:26 EDT).
                ...header('Channels', place, lead, scope),
                { type: 14, spacing: 2 },
                withClear(`${visText('ephemeral')} in${ephemeral.length ? ` (${ephemeral.length})` : ''} · ${channelList(ephemeral)}\n${visText('public')} in${publicIds.length ? ` (${publicIds.length})` : ''} · ${channelList(publicIds)}`, sid('admin_ch_clear', '', scope), rules.length),
                ...(gated.length ? [{ type: 10, content: `-# ${BOT_EMOJI.warn} Discord's own permissions make these private for @everyone, whatever this page says: ${channelList(gated)}. Allow **Use External Apps** in those channels to change it.` }] : []),
                { type: 10, content: '-# 🔎 Type to search · threads follow their channel' },
            ],
        },
        channelSelect(sid('admin_ch_ephemeral', '', scope), isText() ? 'Off in these channels…' : 'Always private in these channels…', ephemeral),
        channelSelect(sid('admin_ch_public', '', scope), isText() ? 'On in these channels…' : 'Always public in these channels…', publicIds),
        navRow('admin_channels', { scope }),
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

function buildRoles(settings, place = {}, scope = null) {
    const set = ruleSet(settings, scope);
    const rules = (set.roleRules || []).filter(r => !r.channelIds?.length);
    const scoped = (set.roleRules || []).filter(r => r.channelIds?.length);
    const lead = scope
        ? `-# Only for ${commandLabel(scope)}. Give a role its own setting, everywhere or in chosen channels. **Roles beat channel rules.**`
        : '-# Give a role its own setting, everywhere or in chosen channels. **Roles beat channel rules.**';
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header('Roles', place, lead, scope),
                { type: 14, spacing: 2 },
                // Clear removes the everywhere rules only, so it sits beside them; a role's channel rules clear on that role's own screen, where the admin can see which they are.
                withClear(`**Everywhere** · ${rules.length ? rules.map(r => `<@&${r.roleId}> → ${visText(r.visibility)}`).join(' · ') : 'none'}`, sid('admin_role_clear', '', scope), rules.length),
                { type: 10, content: `**In chosen channels** · ${scoped.length ? scoped.map(roleRuleText).join(' · ') : 'none'}` },
                { type: 10, content: '-# 🔎 Type to search your roles' },
            ],
        },
        roleSelect(sid('admin_role_public', '', scope), isText() ? 'Always on for these roles…' : 'Always public for these roles…', rules.filter(r => r.visibility === 'public').map(r => r.roleId)),
        roleSelect(sid('admin_role_ephemeral', '', scope), isText() ? 'Always off for these roles…' : 'Always private for these roles…', rules.filter(r => r.visibility === 'ephemeral').map(r => r.roleId)),
        roleSelect(sid('admin_role_pick', '', scope), 'Set a role for specific channels…', [], 1),
        navRow('admin_roles', { scope }),
    ];
}

function buildRoleScope(settings, roleId, place = {}, scope = null) {
    const set = ruleSet(settings, scope);
    const existing = (set.roleRules || []).filter(r => r.roleId === roleId && r.channelIds?.length);
    const pub = existing.find(r => r.visibility === 'public');
    const eph = existing.find(r => r.visibility === 'ephemeral');
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header('Roles', place, null, scope),
                { type: 10, content: `### <@&${roleId}> in chosen channels${scope ? `, for ${commandLabel(scope)}` : ''}` },
                withClear(`${visText('public')} in · ${channelList(pub?.channelIds)}\n${visText('ephemeral')} in · ${channelList(eph?.channelIds)}`, sid('admin_role_scope_clear', roleId, scope), existing.length, 'Clear'),
            ],
        },
        channelSelect(sid('admin_role_scope_public', roleId, scope), `${WORDS[VIEW].public} for this role, only in…`, pub?.channelIds || []),
        channelSelect(sid('admin_role_scope_ephemeral', roleId, scope), `${WORDS[VIEW].ephemeral} for this role, only in…`, eph?.channelIds || []),
        // The tabs, with Roles blurple but live: this screen sits under Roles, and dropping the tabs stranded the admin (click test 2026-10-21 22:26 EDT).
        navRow('admin_roles', { subpage: true, scope }),
    ];
}

// The menu's own order and cut, shared by the render and the save so both agree on which commands the menu could show. Sorted case-blind, so a right-click command sits among the slash commands by name rather than first.
function menuCommands(gateable) {
    const sorted = [...gateable].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    return { shown: sorted.slice(0, SELECT_OPTION_CAP), omitted: sorted.slice(SELECT_OPTION_CAP) };
}

// THE COMMANDS TAB: every command in ONE menu, each marked by its state, opening its own Overview (the server's pages, scoped to it). It was a grid of a button per command until 2026-10-22 23:39 EDT (Harkirat: "I don't like the individual buttons for each of the commands because that looks really bad on mobile"): a phone wraps five buttons a row into a ragged stack, and a menu is one line however many commands there are.
function buildCommands(settings, gateable, targets = new Map(), place = {}) {
    const entries = commandEntries(settings);
    // ⚠️ A string select takes at most 25 OPTIONS and has no search, so past 25 commands the omitted ones are named rather than silently missing. scripts/guildPolicyEnforcement.test.js pins this. If it ever fires for real, paginate the menu (utils/paginationRow.js) -- the cap is Discord's.
    const { shown, omitted } = menuCommands(gateable);
    const stateOf = v => commandState(commandEntry(settings, v));
    // The option's dot is the state at a glance: white follows the server, red Private, green Public. Read at render time, like every emoji here.
    const stateDot = v => (commandEntry(settings, v) ? dot(commandEntry(settings, v).defaultVisibility) : emojis.whiteDotGlow);
    const controls = shown.length ? [{
        type: 1,
        components: [{
            type: 3,
            custom_id: 'admin_cmd_open',
            placeholder: 'Open a command\'s settings…',
            min_values: 1,
            max_values: 1,
            options: shown.map(v => ({
                label: commandLabel(v),
                value: v,
                description: (targets.get(v) ? `Right-click a ${targets.get(v)} · ` : '') + stateOf(v).word,
                ...(emojis.parseEmoji(stateDot(v)) ? { emoji: emojis.parseEmoji(stateDot(v)) } : {}),
            })),
        }],
    }] : [];
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header('Commands', place, '-# Every command follows the server settings, until you give it its own. Then it uses only those.'),
                { type: 14, spacing: 2 },
                withClear(entries.length ? `**With their own settings**\n${entries.map(commandSummary).join('\n')}` : '-# No command has its own settings yet.', 'admin_cmd_clear', entries.length),
                { type: 10, content: `-# Pick a command below to open its settings. ${emojis.whiteDotGlow} follows the server · ${dot('ephemeral')} ${WORDS[VIEW].ephemeral} · ${dot('public')} ${WORDS[VIEW].public}.${isText() ? '' : ' Capitalised ones are right-click commands.'}` },
                // Said plainly because an admin will otherwise expect the command to disappear, and then read its continued presence as a bug rather than a platform limit.
                { type: 10, content: isText() ? '-# Turns off the **typed** form only. The slash command is set on **Config Slash Commands**.' : '-# Hides the **answer**, not the command. To remove a command entirely: **Server Settings → Integrations**.' },
                ...(omitted.length ? [{ type: 10, content: `-# ${BOT_EMOJI.warn} Discord allows 25 options per menu, so ${omitted.length} command(s) are missing from the list below: ${omitted.map(commandLabel).join(', ')}. Please report this.` }] : []),
            ],
        },
        ...controls,
        navRow('admin_commands'),
    ];
}

// CHECK A MEMBER (picked 2026-10-22 15:23 EDT): pick a role, a channel and a command, and see what Dioreo does for a member with that role there, and which rule decided. The three picks ride in each control's custom_id ('-' for none), so the screen holds no state of its own. The command menu holds 24 so "Any command" fits beside it.
function checkReason(result, cmd) {
    const where = id => `<#${id}>`;
    switch (result.tier) {
        case 'command': return `${commandText(result.rule)} has its own settings: ${checkReason(result.inner).replace('the server default decides', 'its own default decides')}`;
        case 'roleChannel': return `<@&${result.rule.roleId}> has its own setting in ${channelList(result.rule.channelIds)}`;
        case 'role': return `<@&${result.rule.roleId}> is ${WORDS[VIEW][result.rule.visibility]} everywhere`;
        case 'channel': return `${where(result.rule.channelId)} is set to ${WORDS[VIEW][result.rule.visibility]}`;
        case 'parent': return `this thread follows ${where(result.rule.channelId)}`;
        case 'default': return 'no rule applies, so the server default decides';
        case 'discord': return `${GATE_TEXT[result.rule].replace(' here', ' in this channel for them')}, before any rule on this panel`;
        default: return 'this server has no rules yet';
    }
}

// CHECK A MEMBER (Harkirat 2026-10-22 18:46 EDT: "check a specific member's perms ... search from a dropdown or input their ID"; 18:57 EDT: "why do i need to choose a channel? if i input the user, just display the perms on that member"). Pick a member (menu, or Enter ID) or a role, and the panel shows their whole picture at once: what every command does for them everywhere, the channels where that changes and why, each command with its own settings, and where Discord itself keeps their answers private. `who` is 'u:<id>' or 'r:<id>'; `member` is the fetched member ({ id, roleIds, isAdmin, gate(channelId) }); `channelIds` are the server's channels, for Discord's own blocks.
const ELSEWHERE = '0';
function memberPicture(settings, { roleIds, isAdmin, gate, channelIds = [] }) {
    const referenced = new Set();
    const addRules = set => {
        for (const r of set?.channelRules || []) referenced.add(r.channelId);
        for (const r of set?.roleRules || []) for (const id of r.channelIds || []) referenced.add(id);
    };
    addRules(settings);
    const commands = isAdmin ? [] : commandEntries(settings);
    for (const e of commands) addRules(e);
    const describe = (path) => {
        const at = channelId => explainVisibility(settings || {}, { channelId, roleIds, commandName: path ? path.split(' ')[0] : null, commandPath: path, isAdmin });
        const base = at(ELSEWHERE);
        const changes = [...referenced].map(id => ({ id, r: at(id) })).filter(x => x.r.visibility !== base.visibility);
        return { base, changes };
    };
    const blocked = gate ? channelIds.map(id => ({ id, g: gate(id) })).filter(x => x.g) : [];
    return { server: describe(null), commands: commands.map(e => ({ command: e.command, ...describe(e.command) })), blocked };
}

function pictureLines({ base, changes }) {
    const lines = [`${visText(base.visibility)} everywhere${changes.length ? ', except:' : ''}`];
    // Inside a command's own block the reason is the rule within it; "has its own settings" would repeat the block's heading.
    for (const c of changes.slice(0, 8)) lines.push(`${visText(c.r.visibility)} in <#${c.id}>`, `-# ${checkReason(c.r.tier === 'command' ? c.r.inner : c.r)}`);
    if (changes.length > 8) lines.push(`-# +${changes.length - 8} more channels`);
    return lines;
}

function buildCheck(settings, gateable, { who = null, member = null, error = null, channelIds = [] } = {}, place = {}) {
    const userId = who?.startsWith('u:') ? who.slice(2) : null;
    const roleId = who?.startsWith('r:') ? who.slice(2) : null;
    const ready = Boolean((userId && member) || roleId);
    const roleIds = member ? member.roleIds : (roleId ? [roleId] : []);
    const isAdmin = Boolean(member?.isAdmin);
    // Discord's gates are about slash commands, so the text view leaves them out.
    const gate = isText() ? null : member ? member.gate : (roleId && place.discordGate ? id => place.discordGate(id, roleId) : null);
    const pic = ready ? memberPicture(settings, { roleIds, isAdmin, gate, channelIds }) : null;
    const blocks = [];
    if (error) blocks.push({ type: 10, content: `-# ${BOT_EMOJI.cross} ${error}` });
    else if (!ready) blocks.push({ type: 10, content: '-# Pick a member below, or enter their ID. A role works too: it shows what anyone with that role gets.' });
    else if (isText() && isAdmin) {
        // A server admin skips every text rule (his "sure", 2026-10-30 12:47 EDT).
        blocks.push({ type: 10, content: `### <@${userId}>\n-# **Server admin**: typed commands work for them everywhere, whatever is off` });
    } else {
        const roles = member ? member.roleIds.filter(id => id !== place.guildId).map(id => `<@&${id}>`).join(' ') : '';
        blocks.push({ type: 10, content: userId
            ? `### <@${userId}>\n-# ${isAdmin ? '**Server admin**: commands\' own settings skip them · ' : ''}Roles: ${roles || 'none'}`
            : `### A member with <@&${roleId}>` });
        blocks.push({ type: 14, spacing: 2 });
        blocks.push({ type: 10, content: `**${pic.commands.length ? 'Every other command' : 'Every command'}**\n${pictureLines(pic.server).join('\n')}` });
        for (const c of pic.commands.slice(0, 6)) blocks.push({ type: 10, content: `**${commandText(c.command)}** · its own settings\n${pictureLines(c).join('\n')}` });
        if (pic.commands.length > 6) blocks.push({ type: 10, content: `-# +${pic.commands.length - 6} more commands with their own settings` });
        if (pic.blocked.length) blocks.push({ type: 10, content: `${BOT_EMOJI.warn} **Discord keeps their answers private in** ${channelList(pic.blocked.map(x => x.id))}\n-# Discord blocks Use External Apps (or commands) for them there, before any rule on this panel.` });
        blocks.push({ type: 10, content: isText() ? '-# Off means Dioreo stays silent for them there. Server admins are never turned off.' : '-# Public only *allows* public: their own `/settings` can still make an answer private.' });
    }
    return [
        {
            type: 17,
            accent_color: ACCENT,
            components: [
                ...header('Check a Member', place, isText() ? '-# Where typed commands work for one member, and why.' : '-# Everything Dioreo does for one member, and why.'),
                { type: 14, spacing: 2 },
                ...blocks,
                { type: 1, components: [{ type: 2, style: 2, label: 'Enter a Member ID', custom_id: 'admin_check_id' }] },
            ],
        },
        // No default_values on the member menu: Discord drew the picked member as "undefined" when its client had not loaded them (his test, 2026-10-22 18:55 EDT). The member is named above instead.
        { type: 1, components: [{ type: 5, custom_id: 'admin_check_user', placeholder: userId ? 'Check another member…' : 'Member…', min_values: 0, max_values: 1 }] },
        { type: 1, components: [{ type: 6, custom_id: 'admin_check_role', placeholder: '…or a role', min_values: 0, max_values: 1, default_values: roleId ? [{ id: roleId, type: 'role' }] : [] }] },
        navRow('admin_home', { subpage: true }),
    ];
}

// One member as Check a Member needs them: their roles, whether they are a server admin, and Discord's own permissions for them in a channel. A single-member fetch needs no privileged intent (measured 2026-08-09 11:40 EDT in the root CLAUDE.md); it fails only for someone not in the server.
async function readMember(interaction, userId) {
    const guild = interaction.guild;
    if (!guild?.members?.fetch) return { error: "Dioreo isn't in this server, so it can't look members up." };
    let m;
    try { m = await guild.members.fetch(userId); } catch { return { error: "That member isn't in this server." }; }
    const isAdmin = guild.ownerId === userId || m.permissions.has(PermissionFlagsBits.Administrator) || m.permissions.has(PermissionFlagsBits.ManageGuild);
    const gate = channelId => {
        try {
            let channel = guild.channels.cache.get(channelId);
            if (channel?.isThread?.() && channel.parent) channel = channel.parent;
            const perms = channel?.permissionsFor?.(m);
            if (!perms || perms.has(PermissionFlagsBits.Administrator)) return null;
            if (!perms.has(PermissionFlagsBits.UseApplicationCommands)) return 'noCommands';
            if (!perms.has(PermissionFlagsBits.UseExternalApps)) return 'private';
            return null;
        } catch { return null; }
    };
    return { member: { id: userId, roleIds: [...m.roles.cache.keys()], isAdmin, gate } };
}

// THE HELP PANEL (Harkirat 2026-10-22 14:57 EDT: "create a help panel for this command, similar to draw calc's help panel"). Sent as its own private message rather than replacing the panel (Harkirat 2026-10-22 23:39 EDT: "When you press help, can you make it send another private message instead of changing the panel?"), so it carries no tabs: the settings stay open above it. Same shape as commands/drawCalculator.js's buildHelpPanel: emoji headings, short "**term** · meaning" rows under dividers, no paragraphs. It carries the explanations that used to sit on the pages, so the pages can stay visual. `prefix` is the server's own text prefix, so the examples read the way this server types them (his ask, 2026-10-30 16:46 EDT); `d` when none is set.
function buildHelp(client, place = {}, prefix = 'd') {
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
                    '4. **Give one command its own settings** on Commands: it then uses only those',
                ].join('\n') },
                divider,
                { type: 10, content: [
                    '### 🏆 Which Rule Wins',
                    'A command with **its own settings** uses only those. Every other command uses the server\'s.',
                    'Inside either: `1` role in this channel › `2` role everywhere › `3` channel › `4` default',
                    '-# The first that applies decides. Two roles that disagree at the same level give Public, as Discord\'s own role permissions do.',
                ].join('\n') },
                divider,
                { type: 10, content: [
                    '### 🔒 What Private Means',
                    row('Private', 'only the person who ran the command sees the answer'),
                    row('Public', `allows a public answer; anyone who chose private in ${mentionCommand(client, '/settings')} still gets private`),
                    row('Not the command', 'it still shows in the list; remove it in **Server Settings → Integrations**'),
                    row('Show Everyone', 'cannot make a private answer public'),
                ].join('\n') },
                divider,
                // The text-command view (B7, 2026-10-30).
                { type: 10, content: [
                    '### ⌨️ Text Commands',
                    row('On or Off', `a typed command (\`${prefix} today\`, \`@Dioreo today\`) is never private, so it is on or off; off means Dioreo stays silent`),
                    row('Same order', 'a command\'s own settings, then role in this channel › role everywhere › channel › default'),
                    row('Prefix', 'one of your own in place of `d`; `dior` and `@Dioreo` always work. **Reset to d** puts it back'),
                    row('Admins', 'can use typed commands anywhere, whatever is off'),
                    row('Where', '**Config Text Commands** under the tabs on Overview'),
                ].join('\n') },
                divider,
                { type: 10, content: [
                    '### 🛡️ Good to Know',
                    row('Admins', 'skip a command\'s own settings, but follow the server\'s channel and role rules like everyone'),
                    row('Threads', 'follow their channel, unless the thread has its own rule'),
                    row('Menus', 'save when you click outside them; Esc cancels'),
                    row('Clear', 'each page has one once it has rules'),
                    row('Export Log', 'on Overview: every change in the last 60 days, who made it and when. It cannot be cleared, not even by a reset'),
                    row('Check a Member', 'on Overview: pick a role, channel and command to see the answer and the rule behind it'),
                    row('Reset Slash Rules', 'on Overview, two presses: clears every slash rule and sets the default back to Public. **Reset Text Rules** on the text view does the same for text commands and the prefix'),
                ].join('\n') },
            ],
        },
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

// A bare command name ('draw') covering several subcommands is split into one entry per subcommand before any of them is edited, so changing /draw prices never changes /draw calculator. The older ephemeralCommands form is split the same way.
function splitBare(doc, scope, gateable) {
    if (!scope.includes(' ') || /[A-Z]/.test(scope)) return;
    const bare = scope.split(' ')[0];
    const siblings = gateable.filter(v => v.startsWith(`${bare} `));
    const own = (doc.commandSettings || []).find(e => e.command === bare);
    const legacy = (doc.ephemeralCommands || []).includes(bare);
    if (!own && !legacy) return;
    const template = own ? { defaultVisibility: own.defaultVisibility, channelRules: own.channelRules.map(r => ({ channelId: r.channelId, visibility: r.visibility })), roleRules: own.roleRules.map(r => ({ roleId: r.roleId, visibility: r.visibility, channelIds: [...(r.channelIds || [])] })) } : { defaultVisibility: 'ephemeral', channelRules: [], roleRules: [] };
    doc.commandSettings = (doc.commandSettings || []).filter(e => e.command !== bare);
    doc.ephemeralCommands = (doc.ephemeralCommands || []).filter(c => c !== bare);
    for (const v of siblings) {
        if (doc.commandSettings.some(e => e.command === v)) continue;
        doc.commandSettings.push({ command: v, ...JSON.parse(JSON.stringify(template)) });
    }
}

// The rule set a write changes: the server document, or the command's own entry, created on first edit from the server default (or from the older Hidden-everywhere form, which then moves in).
function editTarget(doc, scope, gateable) {
    if (!scope) return doc;
    splitBare(doc, scope, gateable);
    doc.commandSettings = doc.commandSettings || [];
    let entry = doc.commandSettings.find(e => e.command === scope);
    if (!entry) {
        const wasHidden = (doc.ephemeralCommands || []).includes(scope);
        doc.commandSettings.push({ command: scope, defaultVisibility: wasHidden ? 'ephemeral' : (doc.defaultVisibility || 'public'), channelRules: [], roleRules: [] });
        doc.ephemeralCommands = (doc.ephemeralCommands || []).filter(c => c !== scope);
        entry = doc.commandSettings[doc.commandSettings.length - 1];
    }
    return entry;
}

// Follow Server: the command loses its own settings, whatever form they were in.
function dropCommand(doc, scope, gateable) {
    splitBare(doc, scope, gateable);
    doc.commandSettings = (doc.commandSettings || []).filter(e => e.command !== scope);
    doc.ephemeralCommands = (doc.ephemeralCommands || []).filter(c => c !== scope);
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
        guildId: interaction.guildId || null,
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

// The denied panel's small print, shared by the command and a click (Harkirat's wording and layout, 2026-10-25 11:00 EDT: the -# lines in their own text box so Discord leaves a gap; his lock and Access Denied emojis to come). /help and /settings are clickable commands.
function deniedHints(client) {
    return `-# **Lost access?** Discord Support can restore ownership; once Discord says you're an admin again, this panel will open. Dioreo's dev can also reset this server's rules on request · ${mentionCommand(client, '/help')}\n-# **Looking for your own settings?** Check out ${mentionCommand(client, '/settings')}`;
}

// The text view's settings, shaped like a whole rule set, so every builder reads it as it reads the server's (B7).
function textView(settings) {
    if (!settings) return null;
    const t = settings.textRules || {};
    return { defaultVisibility: t.defaultVisibility || 'public', channelRules: t.channelRules || [], roleRules: t.roleRules || [], ephemeralCommands: t.ephemeralCommands || [], commandSettings: t.commandSettings || [], textPrefixes: settings.textPrefixes || [], updatedBy: settings.updatedBy, updatedAt: settings.updatedAt };
}

// The stored text rule set, made on first edit.
function textRoot(doc) {
    if (!doc.textRules) doc.textRules = {};
    return doc.textRules;
}

// Ids shared by both views: the view switch, Export Log and Help. Check a Member has a copy on each view (B7: the text view's reads the text rules).
const SHARED_IDS = /^admin_(view|log|help)/;
function textIds(node) {
    if (Array.isArray(node)) return node.map(textIds);
    if (!node || typeof node !== 'object') return node;
    const out = { ...node };
    if (typeof out.custom_id === 'string' && out.custom_id.startsWith('admin_') && !SHARED_IDS.test(out.custom_id)) out.custom_id = `admin_t_${out.custom_id.slice('admin_'.length)}`;
    if (out.components) out.components = textIds(out.components);
    if (out.accessory) out.accessory = textIds(out.accessory);
    return out;
}

// Draws one view: `view` is 'slash' or 'text'.
function inView(view, build) {
    const before = VIEW;
    VIEW = view;
    try {
        const components = build();
        return view === 'text' ? textIds(components) : components;
    } finally {
        VIEW = before;
    }
}

// Single entry point for every `admin_*` component. handlers/router.js routes here rather than growing another dozen branches in its own handler, and the admin gate lives here so there is exactly one place that decides who may change a server's rules.
async function handleComponent(interaction) {
    if (!interaction.guildId) {
        return interaction.reply({ content: `${emojis.serverSettings} **Server Settings only work inside a server.**`, ephemeral: true });
    }
    if (!isServerAdmin(interaction)) {
        require('../utils/eventStore').markOutcome('rejected_admin');
        return interaction.reply({
            // The same words as the command's denied panel, as one private message (a click on someone else's panel).
            content: `🔒 ${emojis.cross} **Access Denied** — It doesn't seem like you're an admin in this server!\n> These controls change how Dioreo behaves for everyone in this server, so they need the **Manage Server** permission.\n${deniedHints(interaction.client)}`,
            ephemeral: true,
        });
    }

    const parts = interaction.customId.split('|');
    // `admin_t_*` is the text view's copy of a control (B7): the same case below, writing the text rules.
    const onText = parts[0].startsWith('admin_t_');
    const id = onText ? `admin_${parts[0].slice('admin_t_'.length)}` : parts[0];
    const arg = parts[1];
    const guildId = interaction.guildId;
    const actorId = interaction.user.id;
    const values = interaction.values || [];
    const gateable = onText ? textPaths() : (interaction.client.gateableCommandNames || []);
    const place = onText ? { ...placeOf(interaction), gateable, discordGate: null } : placeOf(interaction);
    // The rule set an edit changes: the server document, or its text rules.
    const root = doc => (onText ? textRoot(doc) : doc);
    // The view the page draws in; the view switch changes it.
    let view = onText ? 'text' : 'slash';
    // The command a scoped page is about (the last `|` field). Only a registered command, or one that already has settings here, is accepted, so a forged id cannot create settings for a name that does not exist.
    let scope = id.startsWith('admin_check') ? null : (parts[2] || null);
    if (id === 'admin_cmd_open') scope = values[0] || null;
    if (scope && !gateable.includes(scope)) {
        const stored = await getGuildSettings(guildId);
        const known = commandEntries(onText ? textView(stored) : stored).some(e => e.command === scope);
        if (!known) scope = null;
    }
    // An edit inside a scope: change the command's own rule set, or the server's when there is no scope.
    const edit = fn => updateGuildSettings(guildId, actorId, doc => fn(editTarget(root(doc), scope, gateable)));

    let settings;
    let page = null;
    switch (id) {
        case 'admin_home':
        case 'admin_channels':
        case 'admin_roles':
        case 'admin_commands':
            settings = await getGuildSettings(guildId);
            page = id;
            break;

        // Help opens as its own private message, the way the draw calculator's does (handlers/drawCalc.js), and leaves the panel as it was. Nothing on it can go stale, so it skips the idle timeout.
        case 'admin_help':
            await interaction.deferReply({ flags: 64 });
            return sendV2Payload(interaction, buildHelp(interaction.client, place, (await getGuildSettings(guildId))?.textPrefixes?.[0] || 'd'), { allowedMentions: NO_PINGS, skipExpiry: true });

        case 'admin_cmd_open':
            settings = await getGuildSettings(guildId);
            page = 'admin_home';
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
            return send(interaction, inView(view, () => buildHome(onText ? textView(settings) : settings, interaction.client, place, { resetArmed: true })));

        // THE VIEW SWITCH (B7): Config Text Commands / Config Slash Commands.
        case 'admin_view':
            settings = await getGuildSettings(guildId);
            view = arg === 'text' ? 'text' : 'slash';
            page = 'admin_home';
            scope = null;
            break;

        // The text view's prefixes: a pop-up, and its submit (B7). Blank puts the default back.
        case 'admin_prefix': {
            if (!onText) return;
            settings = await getGuildSettings(guildId);
            // The box allows 20 characters although a prefix holds 6 (MAX_LENGTH), so a longer word reaches parsePrefixes and gets its warning; at max_length 6 Discord cut `default` to `defaul` and it saved with no warning (live pass, 2026-10-30 17:39 EDT). The description names the defaults this app really uses.
            const current = (settings?.textPrefixes || []).join(', ');
            return interaction.showModal({
                title: 'Text command prefixes',
                custom_id: 'admin_t_prefixm',
                components: [{ type: 18, label: 'Your prefix', description: (() => { const { replaceable, fixed } = require('../utils/textCommands/server').prefixParts(); return `Replaces ${replaceable}. One word, no spaces. Blank = ${replaceable}. ${fixed.join(', ')} and @Dioreo always work.`.slice(0, 100); })(), component: { type: 4, custom_id: 'prefixes', style: 1, required: false, max_length: 20, placeholder: 'e.g. !', ...(current ? { value: current } : {}) } }],
            });
        }
        case 'admin_prefixm': {
            if (!onText) return;
            const read = require('../utils/textCommands/server').parsePrefixes(interaction.fields?.getTextInputValue('prefixes') || '');
            if (read.error) return interaction.reply({ content: `${BOT_EMOJI.cross} ${read.error} Nothing was saved.`, ephemeral: true });
            scope = null;
            settings = await updateGuildSettings(guildId, actorId, doc => { doc.textPrefixes = read.prefixes.length ? read.prefixes : undefined; });
            page = 'admin_home';
            break;
        }

        // Reset to d (his ask, 2026-10-30 12:35 EDT).
        case 'admin_prefix_reset':
            if (!onText) return;
            scope = null;
            settings = await updateGuildSettings(guildId, actorId, doc => { doc.textPrefixes = undefined; });
            page = 'admin_home';
            break;

        case 'admin_reset':
            scope = null;
            if (onText) {
                // The text view's reset: every text rule and the prefixes go; the slash settings stay.
                settings = await updateGuildSettings(guildId, actorId, doc => { doc.textRules = undefined; doc.textPrefixes = undefined; });
                page = 'admin_home';
                break;
            }
            settings = await updateGuildSettings(guildId, actorId, doc => {
                doc.channelRules = [];
                doc.roleRules = [];
                doc.ephemeralCommands = [];
                doc.commandSettings = [];
                doc.defaultVisibility = 'public';
            });
            page = 'admin_home';
            break;

        case 'admin_check':
        case 'admin_check_user':
        case 'admin_check_role':
        case 'admin_check_ch':
        case 'admin_check_cmd':
        case 'admin_check_idm': {
            settings = await getGuildSettings(guildId);
            const picked = values[0] && values[0] !== '-' ? values[0] : null;
            let state = {};
            if (id === 'admin_check_user' && picked) state = { who: `u:${picked}` };
            else if (id === 'admin_check_role' && picked) state = { who: `r:${picked}` };
            else if (id === 'admin_check_idm') {
                // The "Enter a Member ID" pop-up's submit.
                const typed = (interaction.fields?.getTextInputValue('id') || '').replace(/[<@!>\s]/g, '');
                state = /^\d{15,22}$/.test(typed) ? { who: `u:${typed}` } : { error: 'That is not a member ID: 17–20 digits, from their profile with Developer Mode on.' };
            }
            if (state.who?.startsWith('u:')) {
                const read = await readMember(interaction, state.who.slice(2));
                if (read.error) state = { error: read.error };
                else state.member = read.member;
            }
            // The server's text channels, for where Discord itself blocks them (from the cache: no REST call).
            state.channelIds = [...(interaction.guild?.channels?.cache?.values?.() || [])].filter(ch => ch.isTextBased?.() && !ch.isThread?.()).map(ch => ch.id);
            return send(interaction, inView(view, () => buildCheck(onText ? textView(settings) : settings, gateable, state, place)));
        }

        // "Enter a Member ID": a one-box pop-up; its submit is admin_check_idm above.
        case 'admin_check_id':
            return interaction.showModal({
                title: 'Check a Member',
                custom_id: onText ? 'admin_t_check_idm' : 'admin_check_idm',
                components: [{ type: 1, components: [{ type: 4, custom_id: 'id', label: 'Member ID', style: 1, min_length: 15, max_length: 25, required: true, placeholder: '17–20 digits' }] }],
            });

        // The server default (no scope).
        case 'admin_default':
            if (arg !== 'public' && arg !== 'ephemeral') return;
            scope = null;
            settings = await updateGuildSettings(guildId, actorId, doc => { root(doc).defaultVisibility = arg; });
            page = 'admin_home';
            break;

        // A command's own default: Follow Server removes its settings, Public or Hidden gives it its own.
        case 'admin_cmd_default':
            if (!scope || !['follow', 'public', 'ephemeral'].includes(arg)) return;
            settings = await updateGuildSettings(guildId, actorId, doc => {
                if (arg === 'follow') return dropCommand(root(doc), scope, gateable);
                editTarget(root(doc), scope, gateable).defaultVisibility = arg;
            });
            page = 'admin_home';
            break;

        case 'admin_ch_public':
        case 'admin_ch_ephemeral':
            settings = await edit(set => setChannelRules(set, id === 'admin_ch_public' ? 'public' : 'ephemeral', values));
            page = 'admin_channels';
            break;

        case 'admin_role_public':
        case 'admin_role_ephemeral':
            settings = await edit(set => setUnscopedRoleRules(set, id === 'admin_role_public' ? 'public' : 'ephemeral', values));
            page = 'admin_roles';
            break;

        case 'admin_ch_clear':
            settings = await edit(set => { set.channelRules = []; });
            page = 'admin_channels';
            break;

        case 'admin_role_clear':
            settings = await edit(set => { set.roleRules = (set.roleRules || []).filter(r => r.channelIds?.length); });
            page = 'admin_roles';
            break;

        case 'admin_cmd_clear':
            scope = null;
            settings = await updateGuildSettings(guildId, actorId, doc => { const r = root(doc); r.ephemeralCommands = []; r.commandSettings = []; });
            page = 'admin_commands';
            break;

        case 'admin_role_scope_clear':
            settings = await edit(set => { set.roleRules = (set.roleRules || []).filter(r => !(r.roleId === arg && r.channelIds?.length)); });
            return send(interaction, inView(view, () => buildRoleScope(onText ? textView(settings) : settings, arg, place, scope)));

        case 'admin_role_pick':
            settings = await getGuildSettings(guildId);
            return send(interaction, inView(view, () => buildRoleScope(onText ? textView(settings) : settings, values[0], place, scope)));

        case 'admin_role_scope_public':
        case 'admin_role_scope_ephemeral':
            settings = await edit(set => setScopedRoleRule(set, arg, id === 'admin_role_scope_public' ? 'public' : 'ephemeral', values));
            return send(interaction, inView(view, () => buildRoleScope(onText ? textView(settings) : settings, arg, place, scope)));

        default:
            return;
    }

    // A scoped page whose command no longer has settings (Follow Server, Reset) still opens: it shows the command following the server. The view switch draws the other view's Overview with that view's commands and place.
    const textNow = view === 'text';
    const shown = textNow ? textView(settings) : settings;
    const pagePlace = textNow ? { ...placeOf(interaction), gateable: textPaths(), discordGate: null } : placeOf(interaction);
    const PAGE_BUILDERS = {
        admin_channels: () => buildChannels(shown, pagePlace, scope),
        admin_roles: () => buildRoles(shown, pagePlace, scope),
        admin_commands: () => buildCommands(shown, pagePlace.gateable, textNow ? new Map() : interaction.client.contextMenuTargets, pagePlace),
    };
    const components = inView(view, () => (PAGE_BUILDERS[page] || (() => buildHome(shown, interaction.client, pagePlace, { scope })))());

    // ⚠️ Was a raw `interaction.update({ components, flags: 32768 })` until 2026-08-14 10:59 EDT -- sendV2Payload is the established pattern for a V2 render (CLAUDE.md's "V2 sends" cheat-sheet), and it is what makes this panel pick up the passive 10-minute idle-disable for free (utils/sendV2Payload.js's own header comment).
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
    __testRenderers: { inView, textView, readMember, buildHome, buildChannels, buildRoles, buildRoleScope, buildCommands, buildHelp, buildCheck, buildLogFile, discordGate, editTarget, dropCommand },

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
                    // (Harkirat's wording and layout, 2026-10-25 11:00 EDT: the -# lines in their own text box so Discord leaves a gap; his lock and Access Denied emojis to come)
                    { type: 10, content: '## 🔒 Server admins only' },
                    { type: 10, content: `${emojis.cross} **Access Denied** — It doesn't seem like you're an admin in this server!\n> These controls change how Dioreo behaves for everyone in this server, so they need the **Manage Server** permission.` },
                    { type: 10, content: deniedHints(interaction.client) },
                ],
            }]);
        }

        const settings = await getGuildSettings(interaction.guildId);
        return send(interaction, buildHome(settings, interaction.client, placeOf(interaction)));
    },
};
