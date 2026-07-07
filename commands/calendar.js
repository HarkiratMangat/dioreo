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

// An "All Season" event has no fixed end date of its own -- it runs until the Battle Pass ends
// (see the rangeText logic below), so an ongoing event only counts as "ended" once bpEnd has both
// been set AND passed. If bpEnd hasn't been configured yet, treat it as still active rather than
// guessing.
function isEventEnded(event, seasonalDoc, nowMs) {
    if (event.isOngoing) {
        return Boolean(seasonalDoc.bpEnd) && new Date(seasonalDoc.bpEnd).getTime() <= nowMs;
    }
    return new Date(event.endDate).getTime() <= nowMs;
}

function buildContainer(seasonalDoc, subPage = 0, accentColor = PRESET_ACCENT, isEphemeral = false, filterMode = 'all') {
    const seasonTitle = seasonalDoc.currentSeasonTitle || "Current Season";
    const allEventsSorted = [...seasonalDoc.calendar].sort((a, b) => new Date(a.date) - new Date(b.date));
    // "Active Events Only" hides anything that's already ended by wall-clock time -- computed fresh
    // on every render (not cached), so an event silently drops out of this view the moment it ends
    // without needing any admin action.
    const sortedEvents = filterMode === 'active'
        ? allEventsSorted.filter(event => !isEventEnded(event, seasonalDoc, Date.now()))
        : allEventsSorted;

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
        const emptyText = filterMode === 'active' && allEventsSorted.length > 0
            ? `*No active or upcoming events right now — every event this season has already ended. Switch to "Show All Events" to see them.*`
            : `*There are currently no events scheduled for this season.*`;
        calendarComponents.push({ type: 10, content: emptyText });
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
    // VIEW TOGGLE: switches between "Show Active Events Only" and "Show All Events". Only shown
    // when there's actually at least one ENDED event to hide -- if every event this season ends in
    // the future, "Active Only" and "All" render identically, and a toggle that visibly does
    // nothing just reads as broken (this confused Harkirat during testing before this check
    // existed). Persisted directly via prefs.calendarEventFilter (see UserPreference schema)
    // rather than a /settings toggle -- Harkirat specifically didn't want this cluttering the
    // settings dashboard, so /calendar reads/writes it itself.
    const hasEndedEvents = allEventsSorted.some(event => isEventEnded(event, seasonalDoc, Date.now()));
    if (hasEndedEvents) {
        // Merged into the same row as pagination (still well under the 5-button cap:
        // Left/counter/Right/toggle = 4) rather than a second row, matching the pattern
        // established in utils/loadoutRender.js.
        const toggleButton = {
            type: 2, style: 2,
            label: filterMode === 'active' ? 'Show All Events' : 'Show Active Events Only',
            custom_id: filterMode === 'active' ? 'calendar_filter_all' : 'calendar_filter_active'
        };
        const controlsRow = { type: 1, components: paginationRow ? [...paginationRow.components, toggleButton] : [toggleButton] };
        calendarComponents.push({ type: 14, spacing: 2, divider: true });
        calendarComponents.push({ type: 10, content: `-# Use the button below to toggle between every event or only active/upcoming ones — your choice is remembered for next time.` });
        calendarComponents.push(controlsRow);
    } else if (paginationRow) {
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
        .addBooleanOption(option => option.setName('private').setDescription('Hide this response so only you can see it'))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    buildContainer,

    async execute(interaction, subPageOverride = 0, filterOverride = null) {
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

        // filterOverride is passed by index.js's toggle-button handler right after it saves the new
        // choice to prefs.calendarEventFilter; every other entry point (the slash command itself,
        // pagination clicks) re-reads the persisted value fresh so it always reflects the last choice
        // regardless of which button got clicked.
        const filterMode = filterOverride || prefs?.calendarEventFilter || 'all';

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(seasonalDoc, subPageOverride, accentColor, isEphemeral, filterMode);

        return await interaction.client.rest.patch(
            Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
            { body: { content: "", components, flags: 32768 } }
        );
    }
};