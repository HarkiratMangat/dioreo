// ==========================================
// COMMAND: PLAYER GUIDE / HELP
// ==========================================
// ARCHITECTURE: A single Components V2 panel with a category select menu (Loadouts / Lucky Draws /
// Calendar & Patch Notes / Personalization / Utility) — landing state shows an overview, picking a
// category swaps the body to that category's real command-by-command breakdown (every option each
// command takes, not just a one-line blurb). The optional `cmd:` autocomplete option skips straight
// to a specific command's category. Content is static, hand-written copy (not pulled from each
// command's terse SlashCommandBuilder description) EXCEPT the Loadouts category's per-weapon-category
// command list (`/ar`, `/lmg`, `/sniper`, …), which is queried live from Mongo the same way
// index.js's handleBotReady() generates those commands — hardcoding that list would silently go
// stale the moment a category is added/removed (see docs/superpowers/specs/2026-08-08-help-command-
// design.md and the "no duplicated state in prose" lesson this follows).
//
// Every emoji here is one of the bot's own existing custom icons (emojiMap.js), reused per-command
// rather than generic Unicode — e.g. the eyedropper for /colors, the DMZ icon for /dmz. Per the
// emoji-capture rule (.claude/rules/rendering-and-ui.md), data below stores `emojiKey` STRINGS, never
// the emoji mention string itself — every lookup happens inside a render function, never at
// require()-time, so a post-boot emoji ID resync (refreshEmojiIds) is always picked up.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const Loadout = require('../models/Loadout');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { withShareButton } = require('../utils/shareButton');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Sunbeam Yellow -- pastel yet bright, deliberately distinct from patchnotes.js's deeper Patch Gold
// (#F2C230 / 15909424) so the two don't read as the same color at a glance.
const PRESET_ACCENT = 16770669; // Sunbeam Yellow (#FFE66D)

const HARKIRAT_ID = '1139845545754632283';

// manage.js/autobuild.js/alerts.js are admin-only (ALLOWED_ADMIN_ID-gated) and deliberately excluded
// -- this is the USER-FACING command list only. `options` is a short, real breakdown of every option
// that command's SlashCommandBuilder actually takes (cross-checked against each command file, not
// invented) -- required options say so; everything else is optional.
const HELP_CATEGORIES = [
    {
        key: 'loadouts',
        label: 'Loadouts',
        emojiKey: 'dmz',
        commands: [
            {
                name: '/dmz', emojiKey: 'dmz',
                description: "Search DMZ-specific gunsmiths only — full attachment builds, up to 9 slots.",
                options: "`weapon` required, autocomplete · `build` jump to a specific build # · `hidden` only you can see it"
            },
            {
                name: '/all', emojiKey: 'database',
                description: "Search every MP weapon category at once.",
                options: "`weapon` required, autocomplete · `build` jump to a specific build # · `hidden` only you can see it"
            }
        ],
        // Rendered specially in buildContainer() -- the live category list is queried from Mongo,
        // not hardcoded here.
        dynamicNote: {
            emojiKey: 'meta',
            heading: 'Per-category commands',
            description: "One command per weapon category — same options as `/all`, just scoped to that category. Currently live:"
        }
    },
    {
        key: 'draws',
        label: 'Lucky Draws',
        emojiKey: 'newDraws',
        commands: [
            {
                name: '/draws', emojiKey: 'newDraws',
                description: "Browse this season's New and Returning lucky draws.",
                options: "`page` jump directly to New Draws or Returning Draws · `hidden` only you can see it"
            },
            {
                name: '/draw prices', emojiKey: 'drawPrices',
                description: "CP cost breakdown for every draw type.",
                options: "`region` jump directly to the 10, 20, or 30 CP region · `hidden` only you can see it"
            }
        ]
    },
    {
        key: 'calendar',
        label: 'Calendar & Patch Notes',
        emojiKey: 'calendar',
        commands: [
            {
                name: '/calendar', emojiKey: 'calendar',
                description: "This season's event timeline — Draws, Events, and Game Modes.",
                options: "`page` jump directly to Draws/Events/Playlists & Modes · `view` show all events, or only active/upcoming (defaults to your /settings choice) · `hidden` only you can see it"
            },
            {
                name: '/patch notes', emojiKey: 'patchNotes',
                description: "Read the latest weapon balance changes, plus the full patch-note history.",
                options: "`version` search a specific previous patch, autocomplete · `hidden` only you can see it"
            },
            {
                name: '/season end', emojiKey: 'bp',
                description: "See when this season's Battle Pass, Ranked, and DMZ seasons end.",
                options: "`hidden` only you can see it"
            }
        ]
    },
    {
        key: 'personalization',
        label: 'Personalization',
        emojiKey: 'settings',
        commands: [
            {
                name: '/colors', emojiKey: 'eyedropper',
                description: "View the colors extracted from your Discord profile (avatar/banner/decoration) and pick which one accents your panels.",
                options: "`hidden` only you can see it"
            },
            {
                name: '/settings', emojiKey: 'settings',
                description: "Two pages: Visibility (who sees your responses by default) and Preferences (timezone, calendar filter, accent style, and more).",
                options: "`hidden` only you can see it"
            }
        ]
    },
    {
        key: 'utility',
        label: 'Utility',
        emojiKey: 'timestamp',
        commands: [
            {
                name: '/timestamp', emojiKey: 'timestamp',
                description: "Convert any date/time into a Discord timestamp that displays correctly in everyone's own timezone.",
                options: "`datetime` required — e.g. \"tomorrow\", \"sun 4:30pm\", \"19:30\" · `timezone` defaults to your saved /settings timezone · `style` pick one format, or leave blank for all formats · `view` Embed or plain Text, one-off only · `hidden` only you can see it"
            }
        ]
    }
];

function sectionHeading(emojiKey, text) {
    return `### ${emojis[emojiKey]} __**${text.toUpperCase()}**__`;
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
                emoji: emojis.parseEmoji(emojis[c.emojiKey]),
                default: c.key === selectedKey
            }))
        }]
    };
}

function buildCommandEntry(cmd) {
    return { type: 10, content: `**${emojis[cmd.emojiKey]} \`${cmd.name}\`**\n${cmd.description}\n-# ${cmd.options}` };
}

// Only the Loadouts category needs this -- queried the SAME way index.js's handleBotReady() derives
// the live /ar, /lmg, /sniper, etc. commands, so this list can never drift stale the way a hardcoded
// copy would the moment a category is added, renamed, or removed.
async function getLiveLoadoutCategoryNames() {
    const dbCategories = await Loadout.distinct('category', { mode: 'MP' });
    const mpCategories = Array.from(new Set([...dbCategories, 'SECONDARIES']));
    return mpCategories
        .map(cat => cat.toLowerCase().replace(/\s+/g, ''))
        .sort()
        .map(cmdName => `\`/${cmdName}\``);
}

async function buildContainer(selectedKey, accentColor) {
    const components = [];

    components.push(buildTitleBlock('Player Guide', emojis.guide, 'Dioreo Help', 2));
    components.push({ type: 14, spacing: 2, divider: true });

    const category = selectedKey ? HELP_CATEGORIES.find(c => c.key === selectedKey) : null;
    if (!category) {
        components.push({
            type: 10,
            content: `**Dioreo** helps you look up CODM loadouts, lucky draw pricing, the seasonal event calendar, patch notes, and more — right from Discord. Full docs, changelog, and legal pages live at **dioreo.app**.\n\nPick a category below to see its commands and every option they take, or use \`/help cmd:\` to jump straight to one.`
        });
    } else {
        components.push({ type: 10, content: sectionHeading(category.emojiKey, category.label) });
        category.commands.forEach((cmd, i) => {
            if (i > 0) components.push({ type: 14, spacing: 1, divider: true });
            components.push(buildCommandEntry(cmd));
        });
        if (category.dynamicNote) {
            const liveNames = await getLiveLoadoutCategoryNames();
            components.push({ type: 14, spacing: 1, divider: true });
            components.push({
                type: 10,
                content: `**${emojis[category.dynamicNote.emojiKey]} ${category.dynamicNote.heading}**\n${category.dynamicNote.description}\n${liveNames.join(' · ')}`
            });
        }
    }

    components.push({ type: 14, spacing: 2, divider: true });
    components.push({ type: 10, content: `-# Pick a category to see its commands and options, or use \`/help cmd:\` to jump straight to one.` });
    components.push(buildCategorySelectRow(selectedKey));
    components.push({ type: 10, content: `-# 🌐 dioreo.app — bugs & suggestions go to <@${HARKIRAT_ID}>.` });

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

        const components = withShareButton([await buildContainer(selectedKey, accentColor)], true);
        return await sendV2Payload(interaction, components);
    }
};
