// ==========================================
// COMMAND: LUCKY DRAW PRICE BREAKDOWNS
// ==========================================
// ARCHITECTURE: Subcommand structure (/draw prices). 
// Houses static pricing arrays and an internal dropdown to swap region views.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');

// NOTE (corrected during review — see calendar.js for the full explanation): fixed to match the
// intended nav-button-order palette assignment. Draw Prices is the 3rd nav button, so China Rose.
// Also corrects a latent conversion bug: the old value (11888018) doesn't actually match #B56576's
// real decimal (11887990) — a ~28 off-by-value error nobody would have visually noticed.
const PRESET_ACCENT = 11887990; // China Rose (#B56576) — 3rd nav button (Draw Prices)

// RAW PULL-COST DATA (per pull, in CP), keyed by CP-region tier then draw type. Deliberately
// stores ONLY the raw per-pull numbers, never a hand-typed total or running-total string — this
// exact data has already had real hand-typed math mistakes once (a total that didn't match its own
// draws sum, a wrong draw value, a typo'd draw value — see git history). Totals and the "spent per
// attempt" cumulative sequence are always derived from these arrays at render time (formatCP/
// buildDrawEntries below), so a wrong number can only ever exist in one place, and a total can never
// silently drift from its own draws again.
//
// Refreshed 2026-07-11 from Harkirat's own verified combo-notes re-export (drawprices2.txt).
// `legendaryGunNonReactive.region_10`'s draws were given with a stated total of 4,540 CP in that
// source, but they actually sum to 4,550 — matches what was already correctly stored here before
// this refresh, so 4,550 (the real sum) was kept rather than the source doc's own typo.
// `doubleEpicCharacters.region_30` has no data yet ("pending data" in the source) — buildDrawEntries
// renders a placeholder line for it instead of a fabricated number.
//
// `legendaryBRVehicle` was removed entirely 2026-07-12 to match Harkirat's own hand-adjusted
// drawPrices_ui.json reference (his final redesign of this command's whole layout) — it's the one
// entry present in the old build that doesn't appear anywhere in that file, and since he built that
// mockup himself rather than us generating it, its absence is read as deliberate rather than an
// oversight. Its old `altLast` mechanism (a Reactive/Non-Reactive split on the final pull) went with
// it — nothing else ever used that field.
const DRAW_DATA = {
    region_10: {
        label: '10 CP Region',
        mythicWeapon: { draws: [10, 30, 50, 120, 200, 320, 520, 960, 1300, 2300], upgrade: { perDraw: 570, count: 10 } },
        mythicCharacter: { draws: [20, 50, 90, 160, 280, 440, 680, 1100, 1700, 2700], upgrade: { perDraw: 855, count: 14 } },
        legendaryGunReactive: { draws: [10, 30, 50, 120, 200, 320, 520, 800, 1100, 1800] },
        legendaryGunNonReactive: { draws: [10, 30, 50, 120, 200, 320, 520, 800, 1100, 1400] },
        doubleLegendaryWeapons: { draws: [10, 30, 50, 120, 200, 320, 520, 1100, 1400, 1600] },
        legendaryCharacterWeapon: { draws: [10, 30, 50, 120, 200, 320, 520, 800, 1500, 2200] },
        sevenSpinLegendaryWeapon: { draws: [10, 50, 140, 300, 600, 1100, 1600] },
        pickYourRewardCard: { draws: [60, 60, 90, 90, 150, 600, 2190] },
        doubleEpicCharacters: { draws: [10, 25, 40, 100, 160, 280, 560, 640, 1000, 1200] }
    },
    region_30: {
        label: '30 CP Region',
        mythicWeapon: { draws: [30, 80, 120, 300, 500, 800, 1300, 2400, 3400, 5800], upgrade: { perDraw: 1440, count: 10 } },
        mythicCharacter: { draws: [50, 130, 220, 400, 700, 1100, 1700, 2800, 4200, 6700], upgrade: { perDraw: 1440, count: 14 } },
        legendaryGunReactive: { draws: [30, 80, 120, 300, 500, 800, 1300, 2000, 2800, 4700] },
        legendaryGunNonReactive: { draws: [30, 80, 120, 300, 500, 800, 1300, 2000, 2800, 3900] },
        doubleLegendaryWeapons: { draws: [30, 80, 120, 300, 500, 800, 1300, 2800, 3900, 4200] },
        legendaryCharacterWeapon: { draws: [30, 80, 120, 300, 500, 800, 1300, 2000, 3900, 5500] },
        sevenSpinLegendaryWeapon: { draws: [30, 120, 350, 800, 1600, 2800, 3900] },
        pickYourRewardCard: { draws: [120, 150, 180, 240, 360, 1500, 5520] },
        doubleEpicCharacters: null
    }
};

// Display name + tier (for the emoji prefix) per draw type — same across both regions, so this
// isn't duplicated inside DRAW_DATA. "Mythic Character + Legendary Weapon Draw" and "Legendary
// Character + Legendary Weapon Draw" are each a single named in-game banner (not a combo of two
// separate draws bundled together) — kept exactly as named in Harkirat's source rather than
// "simplified," since that's the banner's real in-game name. "Pick Your Reward Card" picked up the
// "Legendary Weapon" suffix in the drawPrices_ui.json pass to match its real in-game banner name.
const DRAW_META = {
    mythicWeapon: { name: 'Mythic Weapon Draw', tier: 'mythic' },
    mythicCharacter: { name: 'Mythic Character + Legendary Weapon Draw', tier: 'mythic' },
    legendaryGunReactive: { name: 'Legendary Weapon (Reactive) Draw', tier: 'legendary' },
    legendaryGunNonReactive: { name: 'Legendary Weapon (Non-Reactive) Draw', tier: 'legendary' },
    doubleLegendaryWeapons: { name: 'Double Legendary Weapons Draw', tier: 'legendary' },
    legendaryCharacterWeapon: { name: 'Legendary Character + Legendary Weapon Draw', tier: 'legendary' },
    sevenSpinLegendaryWeapon: { name: '7 Spins Legendary Weapon Draw', tier: 'legendary' },
    pickYourRewardCard: { name: 'Pick Your Reward Card Legendary Weapon Draw', tier: 'epic' },
    doubleEpicCharacters: { name: 'Double Epic Characters Draw', tier: 'epic' }
};

// Rendered as one flat divider-separated sequence (drawPrices_ui.json has no group headers at all,
// unlike the previous Mythic/Legendary-Epic two-group layout) — order matches the reference file.
const ENTRY_ORDER = ['mythicWeapon', 'mythicCharacter', 'legendaryGunReactive', 'legendaryGunNonReactive', 'doubleLegendaryWeapons', 'legendaryCharacterWeapon', 'sevenSpinLegendaryWeapon', 'pickYourRewardCard', 'doubleEpicCharacters'];

// Mythic-tier draws are the only ones with a separate Upgrade step, and each needs its own noun
// ("Weapon"/"Character") in the "### {X} Upgrade" sub-heading per drawPrices_ui.json.
const UPGRADE_LABEL = { mythicWeapon: 'Weapon', mythicCharacter: 'Character' };

function formatCP(n) { return n.toLocaleString('en-US'); }

// Builds the arrow-joined per-pull sequence and the cumulative "CP spent" sequence straight from a
// draws array — see the DRAW_DATA comment above for why these are always computed here instead of
// ever being hand-typed.
function arrowSequence(entry) { return entry.draws.map(formatCP).join(' → '); }
function cumulativeSequence(entry) {
    let running = 0;
    return entry.draws.map(n => { running += n; return formatCP(running); }).join(' → ');
}

// Single tier icon per drawPrices_ui.json (the old mythic/legendary headers combined their tier
// emoji with the Epic emoji as a two-icon prefix; the new reference file uses just the one).
const TIER_ICON = { mythic: emojis.mythic, legendary: emojis.legendary, epic: emojis.epic };

// Returns one formatted string PER draw type (not one joined block) — buildContainer interleaves
// these with real divider components so every draw section is visually separated, per Harkirat's
// request, rather than relying on a blank line inside one Text Display (Discord's visible spacing
// comes from the gap BETWEEN components, not from line breaks inside one — see calendar.js's
// chunking note for the same lesson).
function buildDrawEntries(regionKey) {
    const region = DRAW_DATA[regionKey];
    return ENTRY_ORDER.map(key => {
        const meta = DRAW_META[key];
        const entry = region[key];
        const icon = TIER_ICON[meta.tier];
        if (!entry) return `## ${icon} ${meta.name}\n*Data not yet available for this region.*`;

        const total = entry.draws.reduce((a, b) => a + b, 0);
        const lines = [`## ${icon} ${meta.name}`];
        if (entry.upgrade) {
            const upgradeTotal = entry.upgrade.perDraw * entry.upgrade.count;
            lines.push(`> ${emojis.cp2} **\`${formatCP(total)} CP Draw\` + \`${formatCP(upgradeTotal)} CP Upgrade\` = \`${formatCP(total + upgradeTotal)} CP\`**`);
        } else {
            lines.push(`> ${emojis.cp2} **\`${formatCP(total)} CP\`**`);
        }
        lines.push(`${arrowSequence(entry)} = \`${formatCP(total)} CP\``);
        lines.push(`-# CP spent: ${cumulativeSequence(entry)}`);
        if (entry.upgrade) {
            const upgradeTotal = entry.upgrade.perDraw * entry.upgrade.count;
            lines.push(`### ${UPGRADE_LABEL[key]} Upgrade`);
            lines.push(`${formatCP(entry.upgrade.perDraw)} CP × ${entry.upgrade.count} Spins = \`${formatCP(upgradeTotal)} CP\``);
        }
        return lines.join('\n');
    });
}

// Turns an array of Text Display strings into [text, divider, text, divider, ..., text] — i.e. a
// divider BETWEEN every pair of entries, but no leading/trailing divider (the caller is responsible
// for whatever comes immediately before/after this run). Spacing is 1 here (not the 2 used by
// calendar/draws/etc.) to match drawPrices_ui.json's own dividers exactly.
function withInnerDividers(entries) {
    const components = [];
    entries.forEach((content, i) => {
        if (i > 0) components.push({ type: 14, spacing: 1, divider: true });
        components.push({ type: 10, content });
    });
    return components;
}

/**
 * UI BUILDER: Constructs the V2 JSON Payload
 * Separated into its own function so the index.js dropdown router can call it directly
 * when users swap regions without needing to re-run the entire slash command.
 */
function buildContainer(regionKey, accentColor = PRESET_ACCENT, isEphemeral = false) {
    const region = DRAW_DATA[regionKey] || DRAW_DATA.region_10;
    const otherRegionKey = regionKey === 'region_10' ? 'region_30' : 'region_10';
    const otherRegionLabel = DRAW_DATA[otherRegionKey].label;

    // Flat, divider-separated sequence per drawPrices_ui.json — no group headers at all (the old
    // Mythic/Legendary-Epic two-group split is gone).
    const entrySections = withInnerDividers(buildDrawEntries(regionKey));

    const containerPayload = {
        type: 17, // Section Container
        accent_color: accentColor,
        components: [
            // Two-line title (region label on top, command header below) — shared pattern. See
            // utils/titleBlock.js.
            buildTitleBlock(region.label, emojis.drawPrices, 'Breakdown of Draw Prices'),
            { type: 14, spacing: 1, divider: true },
            ...entrySections,
            { type: 14, spacing: 1, divider: true },

            { type: 10, content: `-# Switch between viewing 10 CP or 30 CP region prices.\n-# Use \`/settings\` command to change your default view.` },
            {
                type: 1,
                components: [
                    {
                        // Single toggle button replaces the old select-menu region switcher (per
                        // Harkirat's own drawPrices_ui.json redesign) -- always labeled with the
                        // region you'd switch TO, and its custom_id encodes that same target region
                        // directly so index.js's handler doesn't need to re-derive it. Deliberately
                        // NOT prefixed `toggle_` -- that prefix is claimed by /settings' generic
                        // binary-toggle button handler in index.js, which expects a `|{userId}`
                        // suffix this button doesn't have (a real bug caught during review, before
                        // ever being pushed -- see index.js's matching comment).
                        type: 2, style: 3, custom_id: `price_region_${otherRegionKey === 'region_10' ? '10' : '30'}`,
                        label: `View ${otherRegionLabel} Prices`,
                        emoji: emojis.parseEmoji(emojis.regions)
                    }
                ]
            }
        ]
    };

    const globalNavigationRow = buildGlobalNavRow('nav_prices');

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
        // price_region_* button handler calls execute(interaction, targetRegion)
        // after already persisting that same region to prefs.defaultRegion (same
        // persisted-toggle pattern as calendar's active/all filter button) — regionOverride is what
        // that handler passes in so the re-render doesn't have to re-fetch prefs a second time.
        //
        // Priority: explicit slash command option > button click override > saved default > region_10.
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
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(targetRegion, accentColor, isEphemeral);

        return await sendV2Payload(interaction, components);
    }
};