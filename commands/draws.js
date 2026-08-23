// ==========================================
// COMMAND: SEASONAL LUCKY DRAWS (MULTI-PAGE)
// ==========================================
// ARCHITECTURE: Multi-page array rendering. Uses an internal pagination block (New vs Returning) combined with Global Tab Navigation.

const { SlashCommandBuilder } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { buildPaginationRow } = require('../utils/paginationRow');
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Repalette (2026-07-12, Section 5 of the batch) -- see calendar.js's matching comment for the full nav-row hue-spread reasoning. A dustier, lighter plum than the "Field Ops" alternative Harkirat considered, to stay in the same refined register as Calendar's blue and Season End's amber rather than mixing in a grittier tone.
const PRESET_ACCENT = 7032445; // Plum Fortune (#6B4E7D) — 2nd nav button (Draws)

// DISCORD HARD LIMIT: a message can contain at most 40 total components, counted recursively (containers, sections, text blocks, buttons, thumbnails — everything nested inside everything). Each draw entry costs 3 components (the Section wrapper + its Text Display + its Thumbnail accessory). With bulk-imported seasons easily hitting 10+ draws in one category, showing them all in one page blew past the ceiling and crashed with COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED. CHUNK_SIZE chosen conservatively below the theoretical max to leave headroom. Worst case with the redesigned layout (title+divider, draws, spacer+subpage row, divider, 2-button category row):
//   container(1) + header(1) + divider(1) + CHUNK_SIZE*3(draws) + spacer(1) + subPageRow(1+3)
//   + divider(1) + categoryRow(1+2) = 30, + globalNavRow(1+5) = 36 total — still under 40.
const CHUNK_SIZE = 6;

/**
 * Array Mapper: Converts raw database JSON into Discord V2 UI "Section Item Rows" (Type 9)
 */
function buildDrawSections(drawsArray) {
    const sections = [];
    drawsArray.forEach(draw => {
        // Resolve emoji tiers and title casing
        const itemsString = draw.items.map(item => {
            // "-# comment" items (2026-07-30 22:24 EDT, adminParser.js's parseItemLine) are a free- text note, not a real tiered item -- render as plain Discord subtext with no tier emoji/bold, matching how the admin typed it in.
            if (item.tier === 'comment') return `-# ${item.name}`;
            const emoji = emojis[item.tier.toLowerCase()] || '🔹';
            // Split once and reuse, instead of re-splitting the same string up to 3 times per item.
            const nameParts = item.name.split(' - ');
            return `${emoji} **${nameParts[0]}**${nameParts.length > 1 ? ` - ${nameParts[1]}` : ''}`;
        }).join('\n');

        const unixTime = Math.floor(new Date(draw.date).getTime() / 1000);

        // Relative timestamp added in brackets alongside the date, per redesign request. `f` (Long Date, Short Time) instead of `F` (Full Date, Short Time) — drops the day-of-week text, which was mostly just extra width for no real benefit here.
        const textContent = `**__${draw.title}__**\n${itemsString}\n<t:${unixTime}:f> (<t:${unixTime}:R>)`;
        if (draw.thumbnailUrl) {
            sections.push({
                type: 9,
                components: [{ type: 10, content: textContent }],
                accessory: {
                    type: 11, // Attaches Thumbnail natively to the right side of the block
                    media: { url: draw.thumbnailUrl }
                }
            });
        } else {
            // No image was provided/cached for this draw (relaxed 2026-08-22 19:40 EDT, click-test fix -- handlers/manage/draws.js no longer hard-rejects a no-image submission). A Components V2 Section (type 9) requires an accessory, so a bare Text Display is used instead of pointing a Thumbnail at a null/broken URL.
            sections.push({ type: 10, content: `${textContent}\n-# *(no image provided)*` });
        }
    });
    return sections;
}

function buildContainer(seasonalDoc, page = 'new', subPage = 0, accentColor = PRESET_ACCENT, isEphemeral = false) {
    const seasonTitle = seasonalDoc.currentSeasonTitle || "Current Season";
    const isNewPage = page !== 'returning';

    const activeList = isNewPage ? seasonalDoc.newDraws : seasonalDoc.returningDraws;

    // CHUNKING: Split the full list into safe-sized pages so we never exceed Discord's 40-component cap
    const totalChunks = Math.max(1, Math.ceil(activeList.length / CHUNK_SIZE));
    const safeSubPage = Math.min(Math.max(0, subPage), totalChunks - 1);
    const chunk = activeList.slice(safeSubPage * CHUNK_SIZE, (safeSubPage + 1) * CHUNK_SIZE);

    // Two-line title (season title on top, command header below) — shared pattern, matches the calendar_update_ui.json redesign. See utils/titleBlock.js.
    const titleEmoji = isNewPage ? emojis.newDraws : emojis.returningDraws;
    const drawComponents = [
        // headingLevel 2 (`## `, was `# `) for design consistency with /draw prices' own drop -- 2026-07-12, Harkirat's request to keep all seasonal command titles at the same size.
        buildTitleBlock(seasonTitle, titleEmoji, isNewPage ? 'New Draws' : 'Returning Draws', 2),
        { type: 14, spacing: 2, divider: true } // Divider separating the title from the draws content
    ];

    // EMPTY STATE HANDLING: If DB array is empty, provide a clean text fallback instead of crashing
    if (activeList.length === 0) {
        drawComponents.push({
            type: 10,
            content: `*There are currently no ${isNewPage ? 'new' : 'returning'} draws scheduled for this season.*`
        });
    } else {
        drawComponents.push(...buildDrawSections(chunk));
    }

    // SUB-PAGE NAVIGATION: only shown when a category has more draws than fit on one page (buildPaginationRow returns null otherwise). Encodes the category + target chunk index directly in the custom_id (stateless), same pattern used by the DMZ loadout pagination elsewhere in this bot. Shared row builder (utils/paginationRow.js) keeps this visually identical to /calendar's own pagination.
    const categoryKey = isNewPage ? 'new' : 'returning';
    const paginationRow = buildPaginationRow({
        totalChunks, currentPage: safeSubPage,
        makeCustomId: (p) => `subpage_${categoryKey}_${p}`,
        indicatorCustomId: 'subpage_indicator'
    });
    if (paginationRow) {
        drawComponents.push({ type: 14, spacing: 1, divider: false }); // Spacer only, no line
        drawComponents.push(paginationRow);
    }

    drawComponents.push({ type: 14, spacing: 2, divider: true }); // Divider before the category toggle

    // CATEGORY TOGGLE: showing both "NEW"/"RETURNING" buttons side by side (one disabled) still wrapped onto two lines on mobile even after shortening the labels, and a disabled button showing the page you're already on doesn't add anything — replaced with a single button that only offers the OTHER category, worded as a full call-to-action instead. Sentence case (was all-caps) -- 2026-07-12, matching the same gray/Secondary + sentence-case convention now used bot-wide for "switch view" buttons (see drawprices.js's region toggle).
    drawComponents.push({
        type: 1,
        components: isNewPage
            ? [{ type: 2, style: 2, label: "View Returning Draws", emoji: emojis.parseEmoji(emojis.returningDraws), custom_id: "page_returning_draws" }]
            : [{ type: 2, style: 2, label: "View New Draws", emoji: emojis.parseEmoji(emojis.newDraws), custom_id: "page_new_draws" }]
    });

    const containerPayload = {
        type: 17,
        accent_color: accentColor,
        components: drawComponents
    };

    const globalNavigationRow = buildGlobalNavRow('nav_draws');

    return withShareButton([containerPayload, globalNavigationRow], isEphemeral);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('draws')
        // Trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) -- was truncating on mobile.
        .setDescription('View new and returning draws this season')
        .addStringOption(option => option.setName('page').setDescription('Jump directly to New Draws or Returning Draws').addChoices({ name: 'New Draws', value: 'new' }, { name: 'Returning Draws', value: 'returning' }))
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    buildContainer,

    async execute(interaction, pageOverride = null, subPageOverride = 0) {
        const userId = interaction.user.id;
        // NOTE (added during review): kicked off alongside `prefs` instead of after it -- doesn't depend on prefs at all, so it resolves concurrently with the deferReply() ack below rather than only starting once that's done. Only `prefs` is actually awaited before deferReply (keeps the 3-second ack window fast). .lean() since this doc is only ever read here, never saved.
        const prefsPromise = UserPreference.findOne({ discordId: userId });
        const seasonalDocPromise = SeasonalData.findOne({ docType: 'global' }).lean();
        const prefs = await prefsPromise;

        let argPrivate = null;
        let activePage = pageOverride || 'new'; // pageOverride is used by the button router in handlers/pagination.js

        // Ingest manual slash command parameters
        if (interaction.isChatInputCommand()) {
            const visibilityChoice = interaction.options.getString('visibility');
            argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
            const userChoice = interaction.options.getString('page');
            if (userChoice) activePage = userChoice;
        }

        // NOTE: switched from the old per-command `drawsVisibility` field to the shared `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in /settings (Option A).
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });
        if (!interaction.deferred) {
            await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        }

        const seasonalDoc = await seasonalDocPromise;
        if (!seasonalDoc) {
            return interaction.followUp({ content: '❌ The global seasonal database document has not been initialized yet.' });
        }

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(seasonalDoc, activePage, subPageOverride, accentColor, isEphemeral);

        return await sendV2Payload(interaction, components);
    }
};