// ==========================================
// COMMAND: EVENT CALENDAR SCHEDULE
// ==========================================
// ARCHITECTURE: Flat list of Text Display sections (no thumbnails, unlike /draws), matching the
// calendar_ui.json reference layout. Includes a defensive chunking safety net (same pattern as
// draws.js) since Discord caps every message at 40 total components recursively — a long bulk-
// imported event list could otherwise silently crash the same way /draws did.

const { SlashCommandBuilder, Routes } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { buildPaginationRow } = require('../utils/paginationRow');
const { withShareButton } = require('../utils/shareButton');

// NOTE (corrected during review): the palette-to-command assignment had gotten rotated out of
// sync with the nav button order (Calendar/Draws/Draw Prices/Patch Notes/Season End) after the nav
// buttons themselves were reordered in an earlier session — Calendar was showing Light Coral
// (meant for Patch Notes) instead of Police Blue. Fixed here and in the other 4 commands to match
// the intended 1st-5th assignment: Police Blue/Chinese Violet/China Rose/Light Coral/Tumbleweed,
// in nav button order. See CLAUDE.md's color palette note.
const PRESET_ACCENT = 3494000; // Police Blue (#355070) — 1st nav button (Calendar)

// All events in a chunk are joined into ONE Text Display component (see buildContainer) rather
// than one component per event — Discord renders visible vertical margin BETWEEN components, not
// between lines inside a single component's content, so this was the real fix for "the container
// is too long/tall" instead of just shrinking the chunk size. That also means the component-count
// ceiling is no longer the limiting factor here (a whole page of events is 1 component); the cap
// on a single Text Display's `content` is 4000 characters, so CHUNK_SIZE now exists to keep well
// under that per page rather than under the 40-component ceiling.
const CHUNK_SIZE = 20;

function buildContainer(seasonalDoc, subPage = 0, accentColor = PRESET_ACCENT, isEphemeral = false) {
    const seasonTitle = seasonalDoc.currentSeasonTitle || "Current Season";
    const sortedEvents = [...seasonalDoc.calendar].sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalChunks = Math.max(1, Math.ceil(sortedEvents.length / CHUNK_SIZE));
    const safeSubPage = Math.min(Math.max(0, subPage), totalChunks - 1);
    const chunk = sortedEvents.slice(safeSubPage * CHUNK_SIZE, (safeSubPage + 1) * CHUNK_SIZE);

    // Two-line title (season title on top, command header below) — shared pattern, see
    // utils/titleBlock.js.
    const calendarComponents = [
        buildTitleBlock(seasonTitle, emojis.calendar, 'Events Calendar'),
        { type: 14, spacing: 2, divider: true }
    ];

    if (sortedEvents.length === 0) {
        calendarComponents.push({ type: 10, content: `*There are currently no events scheduled for this season.*` });
    } else {
        // Redesigned per calendar_update_ui.json: bold title line + a subtext date-range line below
        // it (was a single combined line), using the new static "b1" bullet emoji and `D` (Long
        // Date) style with the em-dash directly joining the two timestamps, no surrounding spaces.
        const eventLines = chunk.map(event => {
            const startUnix = Math.floor(new Date(event.date).getTime() / 1000);
            // "All Season" events have no fixed end date of their own — they run until the Battle
            // Pass ends, since that's what actually closes out the season. Fall back to showing
            // "Ongoing" only if bpEnd hasn't been set yet (e.g. season just started, deadlines not
            // configured via /update > Edit Season Deadlines).
            let rangeText;
            if (event.isOngoing) {
                rangeText = seasonalDoc.bpEnd
                    ? `<t:${startUnix}:D>—<t:${Math.floor(new Date(seasonalDoc.bpEnd).getTime() / 1000)}:D>`
                    : `<t:${startUnix}:D>—Ongoing`;
            } else {
                rangeText = `<t:${startUnix}:D>—<t:${Math.floor(new Date(event.endDate).getTime() / 1000)}:D>`;
            }
            return `**✦ ${event.title}**\n-# ${emojis.b1} ${rangeText}`;
        });
        // Joined into a single Text Display component (not one push per event) — Discord adds
        // visible vertical margin between separate components, which is what made the old
        // one-component-per-event layout look so tall/spaced-out.
        calendarComponents.push({ type: 10, content: eventLines.join('\n') });
    }

    // SUB-PAGE NAVIGATION: only shown if the event list exceeds one page (buildPaginationRow
    // returns null otherwise). Stateless — the target chunk index is encoded directly in the
    // custom_id, same pattern used by /draws. Shared row builder (utils/paginationRow.js) keeps
    // this visually identical to /draws' own pagination.
    const paginationRow = buildPaginationRow({
        totalChunks, currentPage: safeSubPage,
        prevCustomId: `calsubpage_${safeSubPage - 1}`,
        nextCustomId: `calsubpage_${safeSubPage + 1}`,
        indicatorCustomId: 'calsubpage_indicator'
    });
    if (paginationRow) {
        calendarComponents.push({ type: 14, spacing: 2, divider: true });
        calendarComponents.push(paginationRow);
    }

    const containerPayload = {
        type: 17,
        accent_color: accentColor,
        components: calendarComponents
    };

    const globalNavigationRow = {
        type: 1,
        components: [
            { type: 2, style: 4, label: "Calendar", custom_id: "nav_calendar", disabled: true }, // Locked
            { type: 2, style: 2, label: "Draws", custom_id: "nav_draws" },
            { type: 2, style: 2, label: "Draw Prices", custom_id: "nav_prices" },
            { type: 2, style: 2, label: "Patch Notes", custom_id: "nav_patchnotes" },
            { type: 2, style: 2, label: "Season End", custom_id: "nav_seasonend" }
        ]
    };

    return withShareButton([containerPayload, globalNavigationRow], isEphemeral);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('View the live timeline and start dates for upcoming in-game events!')
        .addBooleanOption(option => option.setName('private').setDescription('Hide this response so only you can see it')),

    buildContainer,

    async execute(interaction, subPageOverride = 0) {
        const userId = interaction.user.id;

        const prefs = await UserPreference.findOne({ discordId: userId });
        const argPrivate = interaction.isChatInputCommand() ? interaction.options.getBoolean('private') : null;
        // NOTE: switched from the old per-command `calendarVisibility` field to the shared
        // `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in
        // /settings (Option A).
        const isEphemeral = argPrivate !== null ? argPrivate : (prefs ? prefs.seasonalVisibility === 'ephemeral' : false);

        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });

        if (!seasonalDoc) {
            return interaction.followUp({ content: '❌ The global seasonal database document has not been initialized yet.' });
        }

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(seasonalDoc, subPageOverride, accentColor, isEphemeral);

        return await interaction.client.rest.patch(
            Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
            { body: { content: "", components, flags: 32768 } }
        );
    }
};