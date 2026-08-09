// ==========================================
// COMMAND: PLAYER GUIDE / HELP
// ==========================================
// ARCHITECTURE: Redesigned 2026-08-08 20:56 EDT from Harkirat's own JSON mockups
// (local/landingPageUI.json, local/gunsmithsUI.json), then revised again 21:31 EDT the same day from
// his direct review feedback. Landing page
// is a Section+thumbnail "hero" (mascot + tagline), two Link buttons (Website/Install), a flat
// command DIRECTORY grouped by category, then a category select menu. Picking a category (or using
// the `cmd:` autocomplete option) swaps to that category's own detail page: a real Usage/Options/
// Examples breakdown per command, options split under whichever command actually has them (never
// merged across commands with different option sets -- Gunsmiths is the one deliberate exception,
// since /all, /dmz, and every per-category command share the identical 3 options).
//
// Categories: Gunsmiths (/all, /dmz, and every live per-weapon-category command) / Draws / Seasonal
// Info / Utilities / Preferences. Gunsmiths' per-category command list (`/ar`, `/lmg`, `/sniper`, …)
// is queried live from Mongo the same way index.js's handleBotReady() generates those commands --
// hardcoding it would silently go stale the moment a category is added/removed (see the "no
// duplicated state in prose" lesson + docs/superpowers/specs/2026-08-08-help-command-design.md).
//
// The `hidden` boolean option was renamed BOT-WIDE to `visibility` (every command, not just this
// one), and its TYPE changed from boolean to a 2-choice string (Hidden/Public) -- "visibility:
// True/False" doesn't read sensibly, "visibility: Hidden/Public" does. /help carries the SAME option
// itself now too (2026-08-08 21:29 EDT review pass) -- it's the one command that had been hardcoded
// ephemeral-only with no way to make it public, an inconsistency with every other command in the bot.
// No "Show Everyone" button here anymore (removed same pass, Harkirat's direct request) -- the
// visibility option already covers that case up front.
//
// MASCOT_URL is a permanent Cloudinary URL (`site_assets/dioreo-mascot-coral`, f_auto/q_auto
// delivery defaults applied) -- re-hosted from Harkirat's original upload (which was a Discord CDN
// attachment link with signed ex=/is=/hm= params that would have expired in roughly a day, same
// issue this repo already hit and fixed for calendar banners -- see .claude/rules/design-
// decisions.md's Cloudinary-rehost entry). Square 1:1 (already 2048x2048, full bleed, no transparent
// padding to trim) and horizontally flipped per Harkirat's request before upload.
//
// Every emoji is one of the bot's own existing custom icons (emojiMap.js). Per the emoji-capture
// rule (.claude/rules/rendering-and-ui.md), data below stores `emojiKey` STRINGS, never the emoji
// mention string itself -- every lookup happens inside a render function, never at require()-time.
// ⚠️ `dioreoCombo`/`loadouts` were JUST uploaded to the PROD Discord application and don't exist yet
// on the separate DEV application ("Dioreo (Dev)") -- refreshEmojiIds() reports them "unmatched" on
// boot there (fail-soft: cosmetics never block the bot), so they render broken on the dev bot
// specifically until Harkirat also uploads copies there. Not a code bug -- the payload itself is
// correct (verified directly against the generated JSON).

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const Loadout = require('../models/Loadout');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Coral -- matches the DIOREO mascot artwork's own coral branding (mascot filename:
// "DIOREO-mascot2-coral.png"), replacing the earlier standalone Sunbeam Yellow pick.
const PRESET_ACCENT = 16743772; // #FF7D5C

const HARKIRAT_ID = '1139845545754632283';
const WEBSITE_URL = 'https://dioreo.app';
// Matches .env's own CLIENT_ID -- verified 2026-08-08 20:57 EDT, not guessed.
const INSTALL_URL = 'https://discord.com/oauth2/authorize?client_id=1491474871778021550';
const MASCOT_URL = 'https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1786237039/site_assets/dioreo-mascot-coral.png';

// Single source of truth for the visibility option's copy -- reused verbatim as the real
// SlashCommandBuilder description AND every /help category's own [visibility] bullet, so the two
// can never drift apart the way "hidden ephemeral message" vs "True/False" once did.
const VISIBILITY_DESCRIPTION = 'Show this response only to you, or publicly to everyone in the chat.';
const VISIBILITY_BULLET = `-# 🔹 \`[visibility]\` ${VISIBILITY_DESCRIPTION}`;

// manage.js/autobuild.js/alerts.js are admin-only (ALLOWED_ADMIN_ID-gated) and deliberately excluded
// -- this is the USER-FACING command list only. `staticCommands` is used for `/help cmd:` matching
// and autocomplete; Gunsmiths' dynamic per-category commands are resolved separately (see
// getLiveGunsmithCommandNames below) since they can't be hardcoded here. `dropdownDescription`s are
// written to be genuinely useful at a glance, not filler -- what you'll actually find in there.
const CATEGORY_DEFS = [
    { key: 'gunsmiths', label: 'Gunsmiths', emojiKey: 'loadouts', dropdownDescription: 'Search MP and DMZ weapon loadouts', staticCommands: ['/all', '/dmz'] },
    { key: 'draws', label: 'Draws', emojiKey: 'newDraws', dropdownDescription: 'Browse lucky draws & their CP costs', staticCommands: ['/draws', '/draw prices'] },
    { key: 'seasonal', label: 'Seasonal Info', emojiKey: 'calendar', dropdownDescription: "This season's calendar, patch notes & end dates", staticCommands: ['/calendar', '/patch notes', '/season end'] },
    { key: 'utilities', label: 'Utilities', emojiKey: 'eyedropper', dropdownDescription: 'Timestamp & profile color tools', staticCommands: ['/colors', '/timestamp'] },
    { key: 'preferences', label: 'Preferences', emojiKey: 'settings', dropdownDescription: 'Manage your saved bot settings', staticCommands: ['/settings'] }
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

// Gunsmiths keeps ONE shared Options block (unlike every other category below) because /all, every
// per-category command, and /dmz genuinely share the identical 3 options -- splitting it three ways
// would just repeat the same lines three times, not clarify anything.
function buildGunsmithsBody(liveNames) {
    const categoryLine = liveNames.map(n => `\`/${n}\``).join(' · ');
    return `### \`/all\`\nSearch across all available MP loadouts\n### ${categoryLine}\nSearch for MP loadouts in a specific category\n### \`/dmz\`\nSearch for DMZ specific loadouts\n\n`
        + `-# **Options**\n-# 🔹 \`<weapon>\` Select weapon (supports autocomplete & partial word matching)\n-# 🔹 \`[build]\` Specify build number\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/all** weapon:\`AK117\`\n-# 🔸 **/smg** weapon:\`Switchblade X9\` build:\`2\` visibility:\`Hidden\``;
}

function buildDrawsBody() {
    return `### \`/draws\`\nBrowse this season's New and Returning lucky draws\n-# **Options**\n-# 🔹 \`[page]\` Jump directly to New Draws or Returning Draws\n${VISIBILITY_BULLET}\n`
        + `### \`/draw prices\`\nCP cost breakdown for every draw type, split by CP region\n-# **Options**\n-# 🔹 \`[region]\` Jump directly to the 10, 20, or 30 CP region\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/draws** page:\`Returning Draws\`\n-# 🔸 **/draw prices** region:\`30 CP Region\``;
}

function buildSeasonalBody() {
    return `### \`/calendar\`\nThis season's event timeline — Draws, Events, and Game Modes\n-# **Options**\n-# 🔹 \`[page]\` Jump directly to Draws/Events/Playlists & Modes\n-# 🔹 \`[view]\` Show all events, or only active/upcoming (defaults to your /settings choice)\n${VISIBILITY_BULLET}\n`
        + `### \`/patch notes\`\nLatest weapon balance changes, plus the full patch-note history\n-# **Options**\n-# 🔹 \`[season]\` Search for a specific previous season (start typing to see suggestions)\n${VISIBILITY_BULLET}\n`
        + `### \`/season end\`\nSee when this season's Battle Pass, Ranked, and DMZ seasons end\n-# **Options**\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/calendar** page:\`Events\` view:\`Active/Upcoming Only\`\n-# 🔸 **/patch notes** season:\`Season 6 — Take Your Heart\``;
}

function buildUtilitiesBody() {
    return `### \`/colors\`\nView the colors extracted from your Discord profile and pick which one accents your panels\n-# **Options**\n${VISIBILITY_BULLET}\n`
        + `### \`/timestamp\`\nConvert almost any date or time — including natural language — into a Discord timestamp that displays correctly in everyone's own timezone\n-# **Options**\n-# 🔹 \`<datetime>\` e.g. "tomorrow", "in 2 hours", "dec 25 at 9am", "19:30", "next monday"\n-# 🔹 \`[timezone]\` Defaults to your saved /settings timezone\n-# 🔹 \`[style]\` Pick one format, or leave blank for all formats\n-# 🔹 \`[view]\` Embed or plain Text, one-off only\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/colors** visibility:\`Public\`\n-# 🔸 **/timestamp** datetime:\`this saturday 7pm\` timezone:\`Pacific Time\`\n-# 🔸 **/timestamp** datetime:\`august 20\` style:\`Short Date (d)\`\n-# 🔸 **/timestamp** datetime:\`in 45 minutes\` view:\`Text\``;
}

function buildPreferencesBody() {
    return `### \`/settings\`\nTwo pages: Visibility (who sees your responses by default) and Preferences (timezone, calendar filter, accent style, and more)\n-# **Options**\n${VISIBILITY_BULLET}\n\n`
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
        { label: 'Commands List', value: 'landing', description: 'Back to the full command overview', emoji: emojis.parseEmoji(emojis.dioreoCombo), default: isLanding },
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
                { type: 2, style: 5, label: 'Install Dioreo', url: INSTALL_URL }
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
        // Deliberately NOT re-mentioning `/help cmd:` here -- the directory above already covers it
        // ("Learn more about a command: /help <command>... Or use the Dropdown below!"); repeating it
        // right below would just be the same instruction twice in one panel.
        components.push({ type: 10, content: `-# Select a category from the dropdown below` });
        components.push(buildCategorySelectRow(null));
        components.push({ type: 14, spacing: 1, divider: true });
        components.push({ type: 10, content: `-# ${emojis.diorHeart} Made with love by <@${HARKIRAT_ID}>` });
    } else {
        const body = selectedKey === 'gunsmiths'
            ? buildGunsmithsBody(await getLiveGunsmithCommandNames())
            : BODY_BUILDERS[selectedKey]();

        components.push({ type: 10, content: `## ${emojis[CATEGORY_DEFS.find(c => c.key === selectedKey).emojiKey]} **${DETAIL_HEADERS[selectedKey]}**\n${USAGE_LEGEND}` });
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({ type: 10, content: body });
        components.push({ type: 14, spacing: 2, divider: true });
        // Detail pages DON'T already mention /help cmd: in their main content (unlike the landing
        // page above), so it's worth surfacing here -- reworded from the landing hint rather than
        // reused verbatim, since the two pages need different things said.
        components.push({ type: 10, content: `-# To see other commands, use the dropdown below or **\`/help <cmd>\`**` });
        components.push(buildCategorySelectRow(selectedKey));
    }

    return { type: 17, accent_color: accentColor, components };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("See what Dioreo can do, and how to reach Harkirat with bugs or ideas")
        .addStringOption(option => option.setName('cmd').setDescription('Jump straight to a specific command').setAutocomplete(true))
        .addStringOption(option => option.setName('visibility').setDescription(`${VISIBILITY_DESCRIPTION} (Defaults to only you.)`).addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
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

        // Unlike every other command, /help has no saved preference to fall back to -- defaults to
        // hidden (matches /manage's/`/alerts`' own-panel convention) unless explicitly made public.
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);

        // No "Show Everyone" button -- the visibility option above already covers that case up
        // front, and repeating it here would be redundant (Harkirat's direct request).
        const components = [await buildContainer(selectedKey, accentColor)];
        return await sendV2Payload(interaction, components);
    }
};
