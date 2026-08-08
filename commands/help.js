// ==========================================
// COMMAND: PLAYER GUIDE / HELP
// ==========================================
// ARCHITECTURE: A single Components V2 panel with a category select menu (Loadouts / Lucky Draws /
// Calendar & Patch Notes / Personalization / Utility) — landing state shows an overview + the
// contact line, picking a category swaps the body to that category's command list. The optional
// `cmd:` autocomplete option skips straight to a specific command's category. Everything here is
// static, hand-written copy (not pulled from each command's terse SlashCommandBuilder description)
// so this reads like real help text, not a raw command dump — see
// docs/superpowers/specs/2026-08-08-help-command-design.md for the full design.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { withShareButton } = require('../utils/shareButton');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Sunbeam Yellow -- pastel yet bright, deliberately distinct from patchnotes.js's deeper Patch Gold
// (#F2C230 / 15909424) so the two don't read as the same color at a glance.
const PRESET_ACCENT = 16770669; // Sunbeam Yellow (#FFE66D)

// manage.js/autobuild.js/alerts.js are admin-only (ALLOWED_ADMIN_ID-gated) and deliberately excluded
// -- this is the USER-FACING command list only.
const HELP_CATEGORIES = [
    {
        key: 'loadouts',
        label: 'Loadouts',
        emoji: '🔫',
        commands: [
            { name: '/dmz', description: "Look up saved MP or DMZ weapon loadouts by name, category, or search — full attachment builds with your own accent color and a Share button." }
        ]
    },
    {
        key: 'draws',
        label: 'Lucky Draws',
        emoji: '🎰',
        commands: [
            { name: '/draws', description: "Browse this season's New and Returning lucky draws." },
            { name: '/draw prices', description: "CP cost breakdowns for every draw type, split by the 10 CP and 30 CP regions." }
        ]
    },
    {
        key: 'calendar',
        label: 'Calendar & Patch Notes',
        emoji: '📅',
        commands: [
            { name: '/calendar', description: "This season's event timeline — Draws, Events, and Game Modes." },
            { name: '/patch notes', description: "Read the latest balance changes, plus a full patch-note history." },
            { name: '/season end', description: "See when this season's Battle Pass, Ranked, and DMZ seasons end." }
        ]
    },
    {
        key: 'personalization',
        label: 'Personalization',
        emoji: '🎨',
        commands: [
            { name: '/colors', description: "Pick how your panels are accented — your avatar, banner, or a preset palette." },
            { name: '/settings', description: "Your saved preferences: timezone, visibility defaults, accent style, and more." }
        ]
    },
    {
        key: 'utility',
        label: 'Utility',
        emoji: '🛠️',
        commands: [
            { name: '/timestamp', description: "Convert any date/time into a Discord timestamp that displays correctly in everyone's own timezone." }
        ]
    }
];

const HARKIRAT_ID = '1139845545754632283';

// Matches calendar.js's sectionHeading() convention (full-caps + underline `### ` heading) for
// visual consistency with the rest of the bot's panels.
function sectionHeading(emoji, text) {
    return `### ${emoji} __**${text.toUpperCase()}**__`;
}

function findCategoryForCommand(cmdName) {
    return HELP_CATEGORIES.find(c => c.commands.some(cmd => cmd.name === cmdName)) || null;
}

function buildCategorySelectRow(selectedKey) {
    return {
        type: 1,
        components: [{
            type: 3,
            custom_id: 'help_category',
            placeholder: 'Choose a category to explore…',
            options: HELP_CATEGORIES.map(c => ({
                label: c.label,
                value: c.key,
                emoji: { name: c.emoji },
                default: c.key === selectedKey
            }))
        }]
    };
}

function buildContainer(selectedKey, accentColor) {
    const components = [];

    components.push(buildTitleBlock('Player Guide', '🧭', 'Dioreo Help', 2));
    components.push({ type: 14, spacing: 2, divider: true });

    const category = selectedKey ? HELP_CATEGORIES.find(c => c.key === selectedKey) : null;
    if (!category) {
        components.push({
            type: 10,
            content: `**Dioreo** helps you look up CODM loadouts, lucky draw pricing, the seasonal event calendar, patch notes, and more — right from Discord.\n\nPick a category below to see what's available, or use \`/help cmd:\` to jump straight to a specific command.`
        });
    } else {
        const body = category.commands
            .map(cmd => `**\`${cmd.name}\`**\n${cmd.description}`)
            .join('\n\n');
        components.push({ type: 10, content: `${sectionHeading(category.emoji, category.label)}\n${body}` });
    }

    components.push({ type: 14, spacing: 2, divider: true });
    components.push({ type: 10, content: `-# Found a bug or have a suggestion? Message <@${HARKIRAT_ID}>.` });
    components.push(buildCategorySelectRow(selectedKey));

    return { type: 17, accent_color: accentColor, components };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("See what Dioreo can do, and how to reach Harkirat with bugs or ideas")
        .addStringOption(option => option.setName('cmd').setDescription('Jump straight to a specific command').setAutocomplete(true))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    HELP_CATEGORIES,
    PRESET_ACCENT,
    buildContainer,
    findCategoryForCommand,

    // `categoryOverride` (passed by index.js's `help_category` select-menu handler via a synthetic
    // interaction) skips re-resolving the `cmd` option -- same shape as calendar.js's `pageOverride`.
    async execute(interaction, categoryOverride = null) {
        let selectedKey = categoryOverride;
        if (selectedKey === null && interaction.isChatInputCommand()) {
            const cmdOption = interaction.options.getString('cmd');
            if (cmdOption) {
                const found = findCategoryForCommand(cmdOption);
                selectedKey = found ? found.key : null;
            }
        }

        // Always ephemeral -- this is static, non-personal content with no reason for a per-command
        // visibility option; "Show Everyone" (below) already covers the "I want to share this" case.
        if (!interaction.deferred) await interaction.deferReply({ flags: 64 });

        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);

        const components = withShareButton([buildContainer(selectedKey, accentColor)], true);
        return await sendV2Payload(interaction, components);
    }
};
