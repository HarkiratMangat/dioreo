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
const { buildPaginationRow } = require('../utils/paginationRow');

// Repalette (2026-07-12, Section 5 of the batch) -- see calendar.js's matching comment for the
// full nav-row hue-spread reasoning. A deep forest emerald ("CP" = currency) -- chosen over a
// lighter jade alternative Harkirat considered so it reads as confidently "money green" at a
// glance rather than blending into Patch Notes' gold two slots over.
const PRESET_ACCENT = 2067038; // CP Emerald (#1F8A5E) — 3rd nav button (Draw Prices)

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
    legendaryGunReactive: { name: 'Legendary Weapon Draw (Reactive)', tier: 'legendary' },
    legendaryGunNonReactive: { name: 'Legendary Weapon Draw (Non-Reactive)', tier: 'legendary' },
    doubleLegendaryWeapons: { name: 'Double Legendary Weapons Draw', tier: 'legendary' },
    legendaryCharacterWeapon: { name: 'Legendary Character + Legendary Weapon Draw', tier: 'legendary' },
    sevenSpinLegendaryWeapon: { name: '7 Spins Legendary Weapon Draw', tier: 'legendary' },
    pickYourRewardCard: { name: 'Pick Your Reward Card Legendary Weapon Draw', tier: 'legendary' },
    doubleEpicCharacters: { name: 'Double Epic Characters Draw', tier: 'epic' }
};

// Rendered as one flat divider-separated sequence within each page (drawPrices_ui.json has no group
// headers at all, unlike the previous Mythic/Legendary-Epic two-group layout) — order matches the
// reference file. Split across 2 pages (2026-07-12, Harkirat's explicit split) purely to stay under
// Discord's 40-component cap now that each entry renders as up to 3 separate Text Displays (see
// buildDrawEntries) rather than one merged block -- not a content-grouping choice.
const PAGE_1_KEYS = ['mythicWeapon', 'mythicCharacter', 'legendaryGunReactive', 'legendaryGunNonReactive', 'legendaryCharacterWeapon'];
const PAGE_2_KEYS = ['doubleLegendaryWeapons', 'sevenSpinLegendaryWeapon', 'pickYourRewardCard', 'doubleEpicCharacters'];
const SUBPAGES = [PAGE_1_KEYS, PAGE_2_KEYS];

// Mythic-tier draws are the only ones with a separate Upgrade step, and each needs its own noun
// ("Weapon"/"Character") in the "### {X} Upgrade" sub-heading per drawPrices_ui.json.
const UPGRADE_LABEL = { mythicWeapon: 'Weapon', mythicCharacter: 'Character' };

function formatCP(n) { return n.toLocaleString('en-US'); }

// Per example_reformat.json (2026-07-12): each pull number is now individually bold, joined by
// " / " (was a plain arrow-joined sequence) -- and the cumulative "spent so far" sequence is joined
// by "›" (U+203A) instead of an arrow. Both characters copied verbatim from the reference file
// rather than retyped, since a visually-similar-but-wrong unicode glyph would be an easy typo to
// introduce here and hard to notice in a code review.
function boldDrawSequence(entry) { return entry.draws.map(n => `**${formatCP(n)}**`).join(' / '); }
function cumulativeSequence(entry) {
    let running = 0;
    return entry.draws.map(n => { running += n; return formatCP(running); }).join(' › ');
}

// Single tier icon per drawPrices_ui.json (the old mythic/legendary headers combined their tier
// emoji with the Epic emoji as a two-icon prefix; the new reference file uses just the one).
const TIER_ICON = { mythic: emojis.mythic, legendary: emojis.legendary, epic: emojis.epic };

// Returns one ARRAY of block strings per draw type (2 blocks normally, 3 if it has an Upgrade step)
// -- NOT one joined string. Per example_reformat.json (2026-07-12), each entry splits into separate
// Text Displays: [heading + total], [pull sequence + cumulative], optionally [upgrade heading +
// formula] -- kept as 3 real separate Text Displays (not merged) since the gap BETWEEN components is
// what gives the natural spacing Harkirat wants here; no divider between a given entry's own blocks,
// only between entries (see withInnerDividers below). This pushes total component count too high
// for all 9 entries on one page at once (over Discord's 40-cap) -- solved via pagination in
// buildContainer instead of merging blocks back together, see PAGE_1_KEYS/PAGE_2_KEYS below.
function buildDrawEntries(regionKey, keys) {
    const region = DRAW_DATA[regionKey];
    return keys.map(key => {
        const meta = DRAW_META[key];
        const entry = region[key];
        const icon = TIER_ICON[meta.tier];
        if (!entry) return [`**${icon} ${meta.name}**\n*Dior is lazy and hasn't done the research **yet** for this draw. More draws and updated info coming soon.*`];

        const total = entry.draws.reduce((a, b) => a + b, 0);
        const blocks = [];

        // Block 1: heading + total (quote-blocked, per Harkirat's request to bring the `> ` back).
        // Upgrade entries bold-wrap each `CP` quantity independently (draw / upgrade / grand total),
        // with the "+"/"=" outside the bold -- non-upgrade entries are just one bold total.
        let totalLine;
        if (entry.upgrade) {
            const upgradeTotal = entry.upgrade.perDraw * entry.upgrade.count;
            totalLine = `> ${emojis.cp2} **\`${formatCP(total)} CP Draw\`** + **\`${formatCP(upgradeTotal)} CP Upgrade\`** = **\`${formatCP(total + upgradeTotal)} CP\`**`;
        } else {
            totalLine = `> ${emojis.cp2} **\`${formatCP(total)} CP\`**`;
        }
        blocks.push(`**${icon} ${meta.name}**\n${totalLine}`);

        // Block 2: bold pull sequence + cumulative spend, own Text Display.
        blocks.push(`${boldDrawSequence(entry)} ⌇ **\`${formatCP(total)} CP\`**\n-# **CP Spent:** ${cumulativeSequence(entry)}`);

        // Block 3 (upgrade entries only): its own separate Text Display, matching the reference file.
        if (entry.upgrade) {
            const upgradeTotal = entry.upgrade.perDraw * entry.upgrade.count;
            blocks.push(`**${UPGRADE_LABEL[key]} Upgrade**\n${formatCP(entry.upgrade.perDraw)} CP x ${entry.upgrade.count} Spins ⌇ **\`${formatCP(upgradeTotal)} CP\`**`);
        }

        return blocks;
    });
}

// Turns an array of entry-groups (each itself an array of block strings, see buildDrawEntries) into
// a flat component list with a divider BETWEEN groups but never within one group's own blocks, and
// no leading/trailing divider (the caller is responsible for whatever comes immediately
// before/after this run). `spacing` defaults to 1 to match drawPrices_ui.json's own dividers;
// buildContainer currently overrides this to 2 (large) for region_10 only, as a one-off spacing test
// Harkirat asked for (2026-07-12) -- see its own note.
function withInnerDividers(entryGroups, spacing = 1) {
    const components = [];
    entryGroups.forEach((blocks, i) => {
        if (i > 0) components.push({ type: 14, spacing, divider: true });
        blocks.forEach(content => components.push({ type: 10, content }));
    });
    return components;
}

/**
 * UI BUILDER: Constructs the V2 JSON Payload
 * Separated into its own function so the index.js dropdown/button router can call it directly
 * when users swap regions or pages without needing to re-run the entire slash command.
 */
function buildContainer(regionKey, accentColor = PRESET_ACCENT, isEphemeral = false, subpage = 0) {
    const region = DRAW_DATA[regionKey] || DRAW_DATA.region_10;
    const otherRegionKey = regionKey === 'region_10' ? 'region_30' : 'region_10';
    const otherRegionLabel = DRAW_DATA[otherRegionKey].label;
    // Clamp rather than reject an out-of-range page (matches the "build N of M" clamping convention
    // used elsewhere, e.g. loadout pagination) -- defensive, not expected to trigger in practice
    // since the pagination row's own disabled state already prevents going out of bounds.
    const currentPage = Math.min(Math.max(subpage, 0), SUBPAGES.length - 1);

    // Flat, divider-separated sequence per drawPrices_ui.json — no group headers at all (the old
    // Mythic/Legendary-Epic two-group split is gone). Split across 2 pages (see PAGE_1_KEYS/
    // PAGE_2_KEYS above) to stay under Discord's 40-component cap now that each entry can render as
    // up to 3 separate Text Displays.
    // Large divider spacing (2) between draw entries, applied to BOTH regions as of 2026-07-12 --
    // this used to be a region_10-only test to compare against region_30's spacing 1, but Harkirat
    // confirmed he wants the larger spacing everywhere now that the comparison's done. Every OTHER
    // divider in this container (title, pagination, nav row) also uses spacing 2 now -- the earlier
    // "title divider stays spacing 1" exception was dropped the same day per Harkirat's "large
    // spacing across the board" follow-up.
    const innerDividerSpacing = 2;
    const entrySections = withInnerDividers(buildDrawEntries(regionKey, SUBPAGES[currentPage]), innerDividerSpacing);

    // Prev/Next between the 2 entry pages, same region -- shared pagination row helper (see
    // utils/paginationRow.js), same style as /calendar and /draws' sub-page navigation. Placed
    // directly under the entries themselves (own divider on both sides) rather than next to the
    // region-switch footer/button below -- sitting right next to that footer's "Switch between
    // viewing 10 CP or 30 CP region prices" text read as if the page arrows were ALSO part of
    // switching region, which they aren't (Harkirat's explicit fix, 2026-07-12).
    const paginationRow = buildPaginationRow({
        totalChunks: SUBPAGES.length,
        currentPage,
        prevCustomId: `price_subpage_${regionKey}_${currentPage - 1}`,
        nextCustomId: `price_subpage_${regionKey}_${currentPage + 1}`,
        indicatorCustomId: 'price_subpage_indicator'
    });

    // BUG FIX (found live, 2026-07-13): the global nav row used to be nested INSIDE the container,
    // sitting BEFORE the divider/hint line/region button rather than after them -- crammed directly
    // under the pagination arrows with no separation, and structurally inconsistent with every
    // other seasonal command (/calendar, /draws), which both pass their nav row as a separate
    // top-level sibling into `withShareButton([containerPayload, globalNavigationRow], isEphemeral)`
    // rather than nesting it. Fixed per Harkirat's exact spec: the divider/hint line/region button
    // all STAY inside the container (region button is the container's LAST item) -- only the nav
    // row itself moves OUTSIDE, as its own sibling below the container, matching calendar/draws.
    const globalNavigationRow = buildGlobalNavRow('nav_prices');

    // All dividers now spacing 2 (2026-07-12, "large spacing across the board" -- overrides the
    // earlier "title divider stays spacing 1" exception from the same day's prior pass).
    const containerPayload = {
        type: 17, // Section Container
        accent_color: accentColor,
        components: [
            // Two-line title (region label on top, command header below) — shared pattern. See
            // utils/titleBlock.js.
            // headingLevel 2 (`## `) and boldCaption (extra **bold** wrap on the region caption) --
            // both scoped to this command only per Harkirat's request (2026-07-12); see
            // utils/titleBlock.js's buildTitleBlock.
            buildTitleBlock(region.label, emojis.drawPrices, 'Breakdown of Draw Prices', 2, true),
            { type: 14, spacing: 2, divider: true },
            ...entrySections,
            // NO divider between the last entry and the pagination row (Harkirat's explicit,
            // repeated correction) -- pagination sits directly under the entries with no separator.
            ...(paginationRow ? [paginationRow] : []),
            { type: 14, spacing: 2, divider: true },
            // One-line footer (was two `-#` lines) per example_reformat.json.
            { type: 10, content: `-# Switch between viewing 10 CP or 30 CP region prices. (Tip: check out \`/settings\`)` },
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
                        // ever being pushed -- see index.js's matching comment). Preserves the
                        // CURRENT subpage across a region switch (encoded in its own custom_id) so
                        // flipping region doesn't reset which page of entries you were looking at.
                        // Style 2 (gray/Secondary), not 3 (green) -- 2026-07-12, matches the
                        // Secondary+sentence-case convention now used bot-wide for this class of
                        // "switch view" button (see draws.js's category-toggle buttons).
                        type: 2, style: 2, custom_id: `price_region_${otherRegionKey === 'region_10' ? '10' : '30'}_${currentPage}`,
                        label: `View ${otherRegionLabel} Prices`,
                        emoji: emojis.parseEmoji(emojis.regions)
                    }
                ]
            }
        ]
    };

    // Nav row lives OUTSIDE the container, as a separate top-level sibling -- matches /calendar
    // and /draws' own convention (see calendar.js/draws.js), not nested inside like every other
    // element in this command.
    return withShareButton([containerPayload, globalNavigationRow], isEphemeral);
}

module.exports = {
    // COMMAND DEFINITION: Base command 'draw' with subcommand 'prices'
    data: new SlashCommandBuilder()
        .setName('draw')
        .setDescription('Lucky Draw Commands')
        .addSubcommand(sub => sub
            .setName('prices')
            .setDescription('View the CP cost breakdown for Lucky Draws')
            // Optional direct-jump flag
            .addStringOption(option => option.setName('region').setDescription('Jump directly to a specific CP region').addChoices({ name: '10 CP Region', value: 'region_10' }, { name: '30 CP Region', value: 'region_30' }))
            .addBooleanOption(option => option.setName('hidden').setDescription('True = only you can see this response. False = everyone in the chat can see it.')))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    buildContainer, // Expose to the root router

    async execute(interaction, regionOverride = null, subpageOverride = 0) {
        const userId = interaction.user.id;
        const prefs = await UserPreference.findOne({ discordId: userId });

        // NOTE (fixed during review): this previously only accepted `interaction` — but index.js's
        // price_region_*/price_subpage_* button handlers call execute(interaction, targetRegion,
        // targetSubpage) after already persisting the region pick to prefs.defaultRegion (same
        // persisted-toggle pattern as calendar's active/all filter button) — regionOverride is what
        // that handler passes in so the re-render doesn't have to re-fetch prefs a second time.
        // subpageOverride (added 2026-07-12 for the 2-page entry split) is NOT persisted anywhere --
        // unlike region, which page of entries you were on isn't a saved preference, just carried
        // along through the button click itself.
        //
        // Priority: explicit slash command option > button click override > pinned defaultRegionMode
        // (2026-07-12, /settings' new 3-option region dropdown -- 'region_10'/'region_30' PIN the
        // opening view regardless of what's last been toggled) > last-viewed defaultRegion > region_10.
        let targetRegion = 'region_10';
        if (prefs?.defaultRegionMode === 'region_10' || prefs?.defaultRegionMode === 'region_30') {
            targetRegion = prefs.defaultRegionMode;
        } else if (prefs?.defaultRegion) {
            targetRegion = prefs.defaultRegion;
        }
        if (regionOverride) targetRegion = regionOverride;
        let argPrivate = null;

        // PARAMETER INGESTION: Read optional arguments if initiated via Slash Command
        if (interaction.isChatInputCommand()) {
            argPrivate = interaction.options.getBoolean('hidden');
            const userChoice = interaction.options.getString('region');
            if (userChoice) targetRegion = userChoice;
        }

        // NOTE: switched from the old per-command `pricesVisibility` field to the shared
        // `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in
        // /settings (Option A).
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(targetRegion, accentColor, isEphemeral, subpageOverride);

        return await sendV2Payload(interaction, components);
    }
};