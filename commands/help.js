// ==========================================
// COMMAND: PLAYER GUIDE / HELP
// ==========================================
// ARCHITECTURE: Redesigned 2026-08-08 20:56 EDT from Harkirat's own JSON mockups (local/landingPageUI.json,
// local/gunsmithsUI.json). Landing page is a Section+thumbnail "hero" (mascot + tagline), two Link
// buttons (Website/Install), a flat command DIRECTORY grouped by category, then a category select
// menu. Picking a category (or using the `cmd:` autocomplete option) swaps to that category's own
// detail page: a real Usage/Options/Examples breakdown, not just a one-line blurb per command.
//
// Categories: Gunsmiths (/all, /dmz, and every live per-weapon-category command) / Draws / Seasonal
// Info / Utilities / Preferences. Gunsmiths' per-category command list (`/ar`, `/lmg`, `/sniper`, …)
// is queried live from Mongo the same way index.js's handleBotReady() generates those commands --
// hardcoding it would silently go stale the moment a category is added/removed (see the "no
// duplicated state in prose" lesson + docs/superpowers/specs/2026-08-08-help-command-design.md).
//
// The `hidden` boolean option was renamed to `visibility` BOT-WIDE (every command, not just this
// one) as part of this redesign, since /help's own copy reads far better as "visibility" -- see the
// rename across commands/*.js and index.js in this same change.
//
// MASCOT_URL is a permanent Cloudinary URL (`site_assets/dioreo-mascot-coral`, f_auto/q_auto
// delivery defaults applied) -- re-hosted 2026-08-08 20:57 EDT from Harkirat's original upload
// (which was a Discord CDN attachment link with signed ex=/is=/hm= params that would have expired in
// roughly a day, same issue this repo already hit and fixed for calendar banners -- see
// .claude/rules/design-decisions.md's Cloudinary-rehost entry). Square 1:1 (already 2048x2048, full
// bleed, no transparent padding to trim) and horizontally flipped per Harkirat's request before
// upload.
//
// Every emoji is one of the bot's own existing custom icons (emojiMap.js). Per the emoji-capture
// rule (.claude/rules/rendering-and-ui.md), data below stores `emojiKey` STRINGS, never the emoji
// mention string itself -- every lookup happens inside a render function, never at require()-time.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const Loadout = require('../models/Loadout');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { withShareButton } = require('../utils/shareButton');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Coral -- matches the DIOREO mascot artwork's own coral branding (mascot filename:
// "DIOREO-mascot2-coral.png"), replacing the earlier standalone Sunbeam Yellow pick.
const PRESET_ACCENT = 16743772; // #FF7D5C

const HARKIRAT_ID = '1139845545754632283';
const WEBSITE_URL = 'https://dioreo.app';
// Matches .env's own CLIENT_ID -- verified 2026-08-08 20:57 EDT, not guessed.
const INSTALL_URL = 'https://discord.com/oauth2/authorize?client_id=1491474871778021550';
const MASCOT_URL = 'https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1786237039/site_assets/dioreo-mascot-coral.png';

// manage.js/autobuild.js/alerts.js are admin-only (ALLOWED_ADMIN_ID-gated) and deliberately excluded
// -- this is the USER-FACING command list only. `staticCommands` is used for `/help cmd:` matching
// and autocomplete; Gunsmiths' dynamic per-category commands are resolved separately (see
// getLiveGunsmithCommandNames below) since they can't be hardcoded here.
const CATEGORY_DEFS = [
    { key: 'gunsmiths', label: 'Gunsmiths', emojiKey: 'loadouts', dropdownDescription: 'Weapon loadout lookup commands', staticCommands: ['/all', '/dmz'] },
    { key: 'draws', label: 'Draws', emojiKey: 'newDraws', dropdownDescription: 'Lucky draw browsing & pricing', staticCommands: ['/draws', '/draw prices'] },
    { key: 'seasonal', label: 'Seasonal Info', emojiKey: 'calendar', dropdownDescription: 'Calendar, patch notes, and season countdowns', staticCommands: ['/calendar', '/patch notes', '/season end'] },
    { key: 'utilities', label: 'Utilities', emojiKey: 'eyedropper', dropdownDescription: 'Timestamps & profile colors', staticCommands: ['/colors', '/timestamp'] },
    { key: 'preferences', label: 'Preferences', emojiKey: 'settings', dropdownDescription: 'Your saved bot settings', staticCommands: ['/settings'] }
];

const DETAIL_HEADERS = {
    gunsmiths: 'Gunsmith Commands',
    draws: 'Draws Commands',
    seasonal: 'Seasonal Info Commands',
    utilities: 'Utility Commands',
    preferences: 'Preference Commands'
};

const USAGE_LEGEND = '-# **Usage: `/cmd <required> [optional]`**';

// Queried the SAME way index.js's handleBotReady() derives the live /ar, /lmg, /sniper, etc.
// commands, so this can never drift stale the way a hardcoded copy would the moment a category is
// added, renamed, or removed. Returns bare lowercase names (no leading slash), sorted.
async function getLiveGunsmithCommandNames() {
    const dbCategories = await Loadout.distinct('category', { mode: 'MP' });
    const mpCategories = Array.from(new Set([...dbCategories, 'SECONDARIES']));
    return mpCategories.map(cat => cat.toLowerCase().replace(/\s+/g, '')).sort();
}

async function resolveCommandToCategory(cmdName) {
    for (const cat of CATEGORY_DEFS) {
        if (cat.staticCommands.includes(cmdName)) return cat.key;
    }
    const liveNames = await getLiveGunsmithCommandNames();
    if (liveNames.some(n => `/${n}` === cmdName)) return 'gunsmiths';
    return null;
}

// Every real command name this bot has, for /help's `cmd:` autocomplete -- static entries plus the
// live per-category Gunsmiths commands.
async function getAllHelpCommandNames() {
    const liveNames = (await getLiveGunsmithCommandNames()).map(n => `/${n}`);
    const staticNames = CATEGORY_DEFS.flatMap(c => c.staticCommands);
    return [...staticNames, ...liveNames];
}

function buildGunsmithsBody(liveNames) {
    const categoryLine = liveNames.map(n => `\`/${n}\``).join(' · ');
    return `### \`/all\`\nSearch across all available MP loadouts\n### ${categoryLine}\nSearch for MP loadouts in a specific category\n### \`/dmz\`\nSearch for DMZ specific loadouts\n\n`
        + `-# **Options**\n-# 🔹 \`<weapon>\` Select weapon (supports autocomplete & partial word matching)\n-# 🔹 \`[build]\` Specify build number\n-# 🔹 \`[visibility]\` View as a hidden ephemeral message or publicly\n\n`
        + `-# **Examples**\n-# 🔸 **/all** weapon:\`AK117\`\n-# 🔸 **/smg** weapon:\`Switchblade X9\` build:\`2\` visibility:\`True\``;
}

function buildDrawsBody() {
    return `### \`/draws\`\nBrowse this season's New and Returning lucky draws\n### \`/draw prices\`\nCP cost breakdown for every draw type, split by CP region\n\n`
        + `-# **Options**\n-# 🔹 \`[page]\` (/draws) Jump directly to New Draws or Returning Draws\n-# 🔹 \`[region]\` (/draw prices) Jump directly to the 10, 20, or 30 CP region\n-# 🔹 \`[visibility]\` View as a hidden ephemeral message or publicly\n\n`
        + `-# **Examples**\n-# 🔸 **/draws** page:\`Returning Draws\`\n-# 🔸 **/draw prices** region:\`30 CP Region\``;
}

function buildSeasonalBody() {
    return `### \`/calendar\`\nThis season's event timeline — Draws, Events, and Game Modes\n### \`/patch notes\`\nLatest weapon balance changes, plus the full patch-note history\n### \`/season end\`\nSee when this season's Battle Pass, Ranked, and DMZ seasons end\n\n`
        + `-# **Options**\n-# 🔹 \`[page]\` (/calendar) Jump directly to Draws/Events/Playlists & Modes\n-# 🔹 \`[view]\` (/calendar) Show all events, or only active/upcoming (defaults to your /settings choice)\n-# 🔹 \`[version]\` (/patch notes) Search a specific previous patch, autocomplete\n-# 🔹 \`[visibility]\` View as a hidden ephemeral message or publicly\n\n`
        + `-# **Examples**\n-# 🔸 **/calendar** page:\`Events\` view:\`Active/Upcoming Only\`\n-# 🔸 **/patch notes** version:\`Season 6\``;
}

function buildUtilitiesBody() {
    return `### \`/colors\`\nView the colors extracted from your Discord profile and pick which one accents your panels\n### \`/timestamp\`\nConvert any date/time into a Discord timestamp that displays correctly in everyone's own timezone\n\n`
        + `-# **Options**\n-# 🔹 \`<datetime>\` (/timestamp) e.g. "tomorrow", "sun 4:30pm", "19:30"\n-# 🔹 \`[timezone]\` (/timestamp) Defaults to your saved /settings timezone\n-# 🔹 \`[style]\` (/timestamp) Pick one format, or leave blank for all formats\n-# 🔹 \`[view]\` (/timestamp) Embed or plain Text, one-off only\n-# 🔹 \`[visibility]\` View as a hidden ephemeral message or publicly\n\n`
        + `-# **Examples**\n-# 🔸 **/timestamp** datetime:\`tomorrow 8pm\` timezone:\`Eastern Time\`\n-# 🔸 **/colors** visibility:\`True\``;
}

function buildPreferencesBody() {
    return `### \`/settings\`\nTwo pages: Visibility (who sees your responses by default) and Preferences (timezone, calendar filter, accent style, and more)\n\n`
        + `-# **Options**\n-# 🔹 \`[visibility]\` View as a hidden ephemeral message or publicly\n\n`
        + `-# **Examples**\n-# 🔸 **/settings**`;
}

const BODY_BUILDERS = {
    draws: buildDrawsBody,
    seasonal: buildSeasonalBody,
    utilities: buildUtilitiesBody,
    preferences: buildPreferencesBody
};

function buildCategorySelectRow(selectedKey) {
    const isLanding = !selectedKey;
    const options = [
        { label: 'Commands List', value: 'landing', description: 'Return to the main command overview', emoji: emojis.parseEmoji(emojis.dioreoCombo), default: isLanding },
        ...CATEGORY_DEFS.map(c => ({
            label: c.label,
            value: c.key,
            description: c.dropdownDescription,
            emoji: emojis.parseEmoji(emojis[c.emojiKey]),
            default: c.key === selectedKey
        }))
    ];
    return { type: 1, components: [{ type: 3, custom_id: 'help_category', placeholder: 'Choose a category to explore…', options }] };
}

async function buildContainer(selectedKey, accentColor) {
    const components = [];

    if (!selectedKey) {
        const liveNames = await getLiveGunsmithCommandNames();
        const gunsmithsLine = ['all', ...liveNames, 'dmz'].map(n => `\`/${n}\``).join(' · ');

        components.push({
            type: 9,
            components: [{
                type: 10,
                content: `## ${emojis.dioreoCombo} Dioreo's Commands\n> **Dioreo** helps you look up CODM loadouts, lucky draw pricing, the seasonal event calendar, patch notes, and more!`
            }],
            accessory: { type: 11, media: { url: MASCOT_URL } }
        });
        components.push({
            type: 1,
            components: [
                { type: 2, style: 5, label: 'Website', url: WEBSITE_URL },
                { type: 2, style: 5, label: 'Install dioreo', url: INSTALL_URL }
            ]
        });
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({
            type: 10,
            content: `### ${emojis.loadouts} **GUNSMITHS**\n**${gunsmithsLine}**\n`
                + `### ${emojis.newDraws} **DRAWS**\n**\`/draws\` · \`/draw prices\`**\n`
                + `### ${emojis.calendar} **SEASONAL INFO**\n**\`/calendar\` · \`/patch notes\` · \`/season end\`**\n`
                + `### ${emojis.eyedropper} **UTILITIES**\n**\`/colors\` · \`/timestamp\`**\n`
                + `### ${emojis.settings} **PREFERENCES**\n**\`/settings\`**\n\n`
                + `-# 💠 **Learn more about a command:** **\`/help <command>\`**\n-# 💠 e.g: **/help** cmd:\`draws\`\n-# 💠 Or use the Dropdown below!\n\n`
                + `-# Report bugs & suggestions to <@${HARKIRAT_ID}>.`
        });
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({ type: 10, content: `-# Pick a category below to explore its commands, or use \`/help cmd:\` to jump straight to one.` });
        components.push(buildCategorySelectRow(null));
        components.push({ type: 14, spacing: 1, divider: true });
        components.push({ type: 10, content: `-# ${emojis.diorHeart} Made with love by @dior` });
    } else {
        const body = selectedKey === 'gunsmiths'
            ? buildGunsmithsBody(await getLiveGunsmithCommandNames())
            : BODY_BUILDERS[selectedKey]();

        components.push({ type: 10, content: `## ${emojis[CATEGORY_DEFS.find(c => c.key === selectedKey).emojiKey]} **${DETAIL_HEADERS[selectedKey]}**\n${USAGE_LEGEND}` });
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({ type: 10, content: body });
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({ type: 10, content: `-# Use the dropdown to browse another category, or jump back with \`/help cmd:\`.` });
        components.push(buildCategorySelectRow(selectedKey));
    }

    return { type: 17, accent_color: accentColor, components };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("See what Dioreo can do, and how to reach Harkirat with bugs or ideas")
        .addStringOption(option => option.setName('cmd').setDescription('Jump straight to a specific command').setAutocomplete(true))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    CATEGORY_DEFS,
    PRESET_ACCENT,
    buildContainer,
    getAllHelpCommandNames,
    resolveCommandToCategory,

    // `categoryOverride` (passed by index.js's `help_category` select-menu handler via a synthetic
    // interaction) skips re-resolving the `cmd` option -- same shape as calendar.js's `pageOverride`.
    // 'landing' is a real dropdown VALUE (the "Commands List" reset option) but behaves identically
    // to null/no-selection, so it's normalized here rather than threading a 6th special case through
    // buildContainer.
    async execute(interaction, categoryOverride = null) {
        let selectedKey = categoryOverride;
        if (selectedKey === null && interaction.isChatInputCommand()) {
            const cmdOption = interaction.options.getString('cmd');
            if (cmdOption) selectedKey = await resolveCommandToCategory(cmdOption);
        }
        if (selectedKey === 'landing') selectedKey = null;

        // Always ephemeral -- this is static, non-personal content with no reason for a per-command
        // visibility option; "Show Everyone" (below) already covers the "I want to share this" case.
        if (!interaction.deferred) await interaction.deferReply({ flags: 64 });

        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);

        const components = withShareButton([await buildContainer(selectedKey, accentColor)], true);
        return await sendV2Payload(interaction, components);
    }
};
