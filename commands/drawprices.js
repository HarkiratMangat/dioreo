// ==========================================
// COMMAND: LUCKY DRAW PRICE BREAKDOWNS
// ==========================================
// ARCHITECTURE: Subcommand structure (/draw prices). 
// Houses static pricing arrays and an internal dropdown to swap region views.

const { SlashCommandBuilder, Routes } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { withShareButton } = require('../utils/shareButton');

// NOTE (corrected during review — see calendar.js for the full explanation): fixed to match the
// intended nav-button-order palette assignment. Draw Prices is the 3rd nav button, so China Rose.
// Also corrects a latent conversion bug: the old value (11888018) doesn't actually match #B56576's
// real decimal (11887990) — a ~28 off-by-value error nobody would have visually noticed.
const PRESET_ACCENT = 11887990; // China Rose (#B56576) — 3rd nav button (Draw Prices)

// STATIC DICTIONARY: Centralized location for all CP mathematics
// NOTE (corrected during review against Harkirat's raw combo notes dump): three values here didn't
// actually match their own draws curves —
//   - region_10.mythicCharacter.total said 7,200 but its draws (20+50+90+160+280+440+680+1,100+
//     1,700+2,700) sum to 7,220. The combo entry below ("Mythic Character + Legendary Gun") already
//     used 7,220 correctly, so this was a standalone display bug, not a combo-math bug.
//   - region_10.mythicGun's 6th draw was 350, making its total 5,840; the source data has 320,
//     which is 5,810. Fixed both the draws string and the total, and the matching combo entry below.
//   - region_10.legendaryGunReactive's 9th draw was 1,110; should be 1,100 (its own listed total of
//     4,950 already assumed 1,100 — the draws string itself just had a typo).
const REGION_DATA = {
    region_10: {
        label: '10 CP Regions',
        mythicCharacter: { total: '7,220', draws: '20 / 50 / 90 / 160 / 280 / 440 / 680 / 1,100 / 1,700 / 2,700' },
        mythicGun: { total: '5,810', draws: '10 / 30 / 50 / 120 / 200 / 320 / 520 / 960 / 1,300 / 2,300', upgrade: '570 CP × 10 draws' },
        legendaryCharacter: { total: '5,750', draws: '10 / 30 / 50 / 120 / 200 / 320 / 520 / 800 / 1,500 / 2,200' },
        legendaryGunReactive: { total: '4,950', draws: '10 / 30 / 50 / 120 / 200 / 320 / 520 / 800 / 1,100 / 1,800' },
        legendaryGunNonReactive: { total: '4,550', draws: '10 / 30 / 50 / 120 / 200 / 320 / 520 / 800 / 1,100 / 1,400' }
    },
    region_30: {
        label: '30 CP Regions',
        mythicCharacter: { total: '18,000', draws: '50 / 130 / 220 / 400 / 700 / 1,100 / 1,700 / 2,800 / 4,200 / 6,700' },
        mythicGun: { total: '14,730', draws: '30 / 80 / 120 / 300 / 500 / 800 / 1,300 / 2,400 / 3,400 / 5,800', upgrade: '1,440 CP × 10 draws' },
        legendaryCharacter: { total: '14,530', draws: '30 / 80 / 120 / 300 / 500 / 800 / 1,300 / 2,000 / 3,900 / 5,500' },
        legendaryGunReactive: { total: '12,630', draws: '30 / 80 / 120 / 300 / 500 / 800 / 1,300 / 2,000 / 2,800 / 4,700' },
        legendaryGunNonReactive: { total: '11,830', draws: '30 / 80 / 120 / 300 / 500 / 800 / 1,300 / 2,000 / 2,800 / 3,900' }
    }
};

// Combo Draw Notes are the same regardless of which region is selected (each line already shows
// both its Total and Global CP cost), so — unlike REGION_DATA above — this isn't keyed by region.
// NOTE: "Double Legendary Guns" previously had no Global figure at all; added (14,030 CP) from the
// source data. "Pick Your Reward Card Draw" and "7 Spin Draw" were missing from this list entirely;
// added both. "Double Characters" renamed to "Double Epic Characters" since every other combo name
// here specifies its tier and the underlying data is specifically the Epic-tier double pull.
const COMBO_NOTES = [
    { name: 'Double Epic Characters', line: 'Total: 4,015 CP' },
    { name: 'Double Legendary Guns', line: 'Total: 5,350 CP | Global: 14,030 CP' },
    { name: 'Legendary Gun/BR Vehicle + Character', line: 'Total (Non-Reactive): 4,550 CP | Global: 11,830 CP\nTotal (Reactive): 4,950 CP | Global: 12,630 CP' },
    { name: 'Legendary Character + Legendary Secondary', line: 'Total: 5,750 CP | Global: 14,530 CP' },
    { name: 'Mythic Gun + Character', line: 'Total: 11,510 CP (5,810 Base + 5,700 Upgrade)\nGlobal Total: 29,130 CP (14,730 Base + 14,400 Upgrade)' },
    { name: 'Mythic Character + Legendary Gun', line: 'Total: 19,190 CP (7,220 Base + 11,970 Upgrade)\nGlobal Total: 38,160 CP (18,000 Base + 20,160 Upgrade)' },
    { name: 'Pick Your Reward Card Draw', line: 'Total: 3,240 CP | Global: 8,070 CP' },
    { name: '7 Spin Draw', line: 'Total: 3,800 CP | Global: 9,600 CP' }
];

/**
 * UI BUILDER: Constructs the V2 JSON Payload
 * Separated into its own function so the index.js dropdown router can call it directly
 * when users swap regions without needing to re-run the entire slash command.
 */
function buildContainer(regionKey, accentColor = PRESET_ACCENT, isEphemeral = false) {
    const region = REGION_DATA[regionKey] || REGION_DATA.region_10;

    // Each pull-type used to be its own Text Display + divider pair (10 components just for the 5
    // base items). Consolidated into ONE block per section instead — same reasoning as calendar.js's
    // redesign: Discord's visible spacing comes from the gap BETWEEN components, not from line
    // breaks inside one, so merging these is what actually shortens the UI rather than just
    // rearranging the same amount of vertical space.
    const baseItemsText = [
        `${emojis.mythic}${emojis.epic} **Mythic Character**\nTotal: ${region.mythicCharacter.total} CP\nDraws: ${region.mythicCharacter.draws}`,
        `${emojis.mythic}${emojis.epic} **Mythic Gun**\nTotal: ${region.mythicGun.total} CP (Base) + Upgrade\nDraws: ${region.mythicGun.draws}\nUpgrade: ${region.mythicGun.upgrade}`,
        `${emojis.legendary}${emojis.epic} **Legendary Character**\nTotal: ${region.legendaryCharacter.total} CP\nDraws: ${region.legendaryCharacter.draws}`,
        `${emojis.legendary}${emojis.epic} **Legendary Gun (Reactive Camo)**\nTotal: ${region.legendaryGunReactive.total} CP\nDraws: ${region.legendaryGunReactive.draws}`,
        `${emojis.legendary}${emojis.epic} **Legendary Gun (Non-Reactive Camo)**\nTotal: ${region.legendaryGunNonReactive.total} CP\nDraws: ${region.legendaryGunNonReactive.draws}`
    ].join('\n\n');

    const comboNotesText = COMBO_NOTES.map(c => `**${c.name}**\n${c.line}`).join('\n\n');

    const containerPayload = {
        type: 17, // Section Container
        accent_color: accentColor,
        components: [
            // Two-line title (region label on top, command header below) — shared pattern, matches
            // the calendar_update_ui.json redesign. See utils/titleBlock.js.
            buildTitleBlock(region.label, emojis.drawPrices, 'Breakdown of Draw Prices'),
            { type: 14, spacing: 2, divider: true },
            { type: 10, content: baseItemsText },
            { type: 14, spacing: 2, divider: true },
            { type: 10, content: `### 💥 Combo Draw Notes` },
            { type: 10, content: comboNotesText },
            { type: 14, spacing: 2, divider: true },

            // INTERNAL SELECTOR: Nested entirely inside the V2 Container array
            { type: 10, content: `-# Use the dropdown below to switch between 10 CP and 30 CP region prices.` },
            {
                type: 1,
                components: [
                    {
                        type: 3, custom_id: "select_price_region", placeholder: "Select CP Region Base...",
                        options: [
                            { label: "10 CP Region", value: "region_10", default: regionKey === 'region_10' },
                            { label: "30 CP Region (Global)", value: "region_30", default: regionKey === 'region_30' }
                        ]
                    }
                ]
            }
        ]
    };

    const globalNavigationRow = {
        type: 1,
        components: [
            { type: 2, style: 2, label: "Calendar", custom_id: "nav_calendar" },
            { type: 2, style: 2, label: "Draws", custom_id: "nav_draws" },
            { type: 2, style: 4, label: "Draw Prices", custom_id: "nav_prices", disabled: true }, // Locked to Active State
            { type: 2, style: 2, label: "Patch Notes", custom_id: "nav_patchnotes" },
            { type: 2, style: 2, label: "Season End", custom_id: "nav_seasonend" }
        ]
    };

    return withShareButton([containerPayload, globalNavigationRow], isEphemeral);
}

module.exports = {
    // COMMAND DEFINITION: Base command 'draw' with subcommand 'prices'
    data: new SlashCommandBuilder()
        .setName('draw')
        .setDescription('Lucky Draw Commands')
        .addSubcommand(sub => sub
            .setName('prices')
            .setDescription('View the CP cost breakdown for Lucky Draws!')
            // Optional direct-jump flag
            .addStringOption(option => option.setName('region').setDescription('Jump directly to a specific CP region').addChoices({ name: '10 CP Region', value: 'region_10' }, { name: '30 CP Region', value: 'region_30' }))
            .addBooleanOption(option => option.setName('private').setDescription('Hide this response so only you can see it')))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    buildContainer, // Expose to the root router

    async execute(interaction, regionOverride = null) {
        const userId = interaction.user.id;
        const prefs = await UserPreference.findOne({ discordId: userId });

        // NOTE (fixed during review): this previously only accepted `interaction` — but index.js's
        // select_price_region dropdown handler calls execute(interaction, selectedRegion), passing
        // the clicked region as a second argument. Without accepting it here, that argument was
        // silently dropped and the dropdown never actually changed anything; it always redrew
        // region_10. regionOverride is what the dropdown/button router passes in.
        //
        // Priority: explicit slash command option > dropdown click override > saved default > region_10.
        let targetRegion = prefs?.defaultRegion || 'region_10';
        if (regionOverride) targetRegion = regionOverride;
        let argPrivate = null;

        // PARAMETER INGESTION: Read optional arguments if initiated via Slash Command
        if (interaction.isChatInputCommand()) {
            argPrivate = interaction.options.getBoolean('private');
            const userChoice = interaction.options.getString('region');
            if (userChoice) targetRegion = userChoice;
        }

        // NOTE: switched from the old per-command `pricesVisibility` field to the shared
        // `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in
        // /settings (Option A).
        const isEphemeral = argPrivate !== null ? argPrivate : (prefs ? prefs.seasonalVisibility === 'ephemeral' : false);
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(targetRegion, accentColor, isEphemeral);

        return await interaction.client.rest.patch(
            Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
            { body: { content: "", components, flags: 32768 } }
        );
    }
};