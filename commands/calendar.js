// ==========================================
// COMMAND: EVENT CALENDAR SCHEDULE
// ==========================================
// ARCHITECTURE: Flat list of Text Display sections (no thumbnails, unlike /draws), matching the
// calendar_ui.json reference layout. Includes a defensive chunking safety net (same pattern as
// draws.js) since Discord caps every message at 40 total components recursively — a long bulk-
// imported event list could otherwise silently crash the same way /draws did.

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
const { fuzzyMatch } = require('../utils/search');

// Repalette (2026-07-12, Section 5 of the batch) -- replaces the old flat 5-color nav-order
// gradient (Police Blue/Chinese Violet/China Rose/Light Coral/Tumbleweed) with a color chosen per
// command instead of just its position in a fade. Calendar gets a deep structural blue (schedule/
// dependable) -- deliberately NOT a teal-leaning alternative Harkirat considered, so it doesn't sit
// hue-adjacent to Draw Prices' green two slots over in the nav row. See CLAUDE.md's design-decision-
// log entry for the full nav-row hue-spread reasoning (cool blue -> plum -> green -> gold -> warm
// amber, left to right).
const PRESET_ACCENT = 3821672; // Slate Harbor (#3A5068) — 1st nav button (Calendar)

// A Text Display's `content` caps at 4000 characters. Real seasonal calendars are nowhere near
// this (a season's whole timeline is a few dozen entries at most), so this is a safety net, not a
// real chunking system -- if a section ever legitimately overflows it, truncate with a "+N more"
// note rather than risk the whole message failing to send.
const SECTION_CHAR_BUDGET = 3800;

// An "All Season" event has no fixed end date of its own -- it runs until the Battle Pass ends
// (see the rangeText logic below), so an ongoing event only counts as "ended" once bpEnd has both
// been set AND passed. If bpEnd hasn't been configured yet, treat it as still active rather than
// guessing. A `dateOnly` entry (a draw auto-merged in from newDraws/returningDraws with no explicit
// calendar row -- see getDrawSectionEntries below) has no range at all, so it's simply "ended" once
// its own release date has passed.
function isEventEnded(event, seasonalDoc, nowMs) {
    if (event.dateOnly) return new Date(event.date).getTime() <= nowMs;
    if (event.isOngoing) {
        return Boolean(seasonalDoc.bpEnd) && new Date(seasonalDoc.bpEnd).getTime() <= nowMs;
    }
    return new Date(event.endDate).getTime() <= nowMs;
}

// 3-section calendar redesign (2026-07-31 12:10 EDT). The Draws section auto-merges in anything
// from newDraws/returningDraws that doesn't already have its own explicit `category: 'draw'`
// calendar entry (fuzzy-matched by title, same fuzzyMatch() convention used everywhere else in
// this bot) -- per Harkirat's own note, a draw with no admin-typed calendar range should still show
// up here instead of being invisible just because it has no end date. A synthetic entry is tagged
// `dateOnly: true` so it renders as a single "Releases <date>" line instead of a false date range.
function getDrawSectionEntries(seasonalDoc) {
    const explicitDraws = seasonalDoc.calendar.filter(e => e.category === 'draw');
    const rawDraws = [...(seasonalDoc.newDraws || []), ...(seasonalDoc.returningDraws || [])];
    const synthetic = rawDraws
        .filter(draw => !explicitDraws.some(e => fuzzyMatch(draw.title, e.title)))
        .map(draw => ({ title: draw.title, date: draw.date, dateOnly: true }));
    return [...explicitDraws, ...synthetic];
}

function buildEntryLine(event, seasonalDoc) {
    const startUnix = Math.floor(new Date(event.date).getTime() / 1000);
    // Redesigned per calendar_update_ui.json: bold title line + a subtext date-range line below it,
    // using the static "b1" bullet emoji and `D` (Long Date) style with the em-dash directly
    // joining the two timestamps, no surrounding spaces.
    let rangeText;
    if (event.dateOnly) {
        rangeText = `Releases <t:${startUnix}:D>`;
    } else if (event.isOngoing) {
        rangeText = seasonalDoc.bpEnd
            ? `<t:${startUnix}:D>—<t:${Math.floor(new Date(seasonalDoc.bpEnd).getTime() / 1000)}:D>`
            : `<t:${startUnix}:D>—Ongoing`;
    } else {
        rangeText = `<t:${startUnix}:D>—<t:${Math.floor(new Date(event.endDate).getTime() / 1000)}:D>`;
    }
    return `**✦ ${event.title}**\n-# ${emojis.b1} ${rangeText}`;
}

// One Text Display per section (heading + entries together) -- Discord renders visible vertical
// margin BETWEEN components, not between lines inside one, so keeping heading+content in a single
// component is what keeps a section visually tight instead of looking like two floating pieces.
function buildSectionComponent(heading, entries, seasonalDoc) {
    if (entries.length === 0) return null;
    let body = entries.map(e => buildEntryLine(e, seasonalDoc)).join('\n');
    if (body.length > SECTION_CHAR_BUDGET) {
        body = body.slice(0, SECTION_CHAR_BUDGET) + `\n-# …and more (too many entries to show at once).`;
    }
    return { type: 10, content: `### ${heading}\n${body}` };
}

function buildContainer(seasonalDoc, subPage = 0, accentColor = PRESET_ACCENT, isEphemeral = false, filterMode = 'all') {
    const seasonTitle = seasonalDoc.currentSeasonTitle || "Current Season";
    const nowMs = Date.now();
    const sortByDate = (a, b) => new Date(a.date) - new Date(b.date);
    const applyFilter = (entries) => filterMode === 'active'
        ? entries.filter(e => !isEventEnded(e, seasonalDoc, nowMs))
        : entries;

    const allDrawEntries = getDrawSectionEntries(seasonalDoc).sort(sortByDate);
    const allEventEntries = seasonalDoc.calendar.filter(e => e.category === 'event' || !e.category).sort(sortByDate);
    const allPlaylistEntries = seasonalDoc.calendar.filter(e => e.category === 'playlist').sort(sortByDate);
    const totalEntryCount = allDrawEntries.length + allEventEntries.length + allPlaylistEntries.length;

    const drawEntries = applyFilter(allDrawEntries);
    const eventEntries = applyFilter(allEventEntries);
    const playlistEntries = applyFilter(allPlaylistEntries);

    // 2 FIXED pages (Harkirat's explicit call, 2026-07-31 12:10 EDT): page 1 = Draws + Events, page 2 =
    // Playlists/Modes -- not a variable chunk count like the old flat-list pagination. A real
    // section-toggle-button nav (instead of Prev/Next) is deferred, see docs/db-deferred-list.md.
    const totalChunks = 2;
    const safeSubPage = Math.min(Math.max(0, subPage), totalChunks - 1);

    // Two-line title (season title on top, command header below) — shared pattern, see
    // utils/titleBlock.js.
    const calendarComponents = [
        // headingLevel 2 (`## `, was `# `) for design consistency with /draw prices' own drop --
        // 2026-07-12, Harkirat's request to keep all seasonal command titles at the same size.
        buildTitleBlock(seasonTitle, emojis.calendar, 'Events Calendar', 2),
        { type: 14, spacing: 2, divider: true }
    ];

    const noneScheduledText = filterMode === 'active' && totalEntryCount > 0
        ? `*No active or upcoming events right now — every event this season has already ended. Switch to "Show All Events" to see them.*`
        : `*There are currently no events scheduled for this season.*`;

    if (safeSubPage === 0) {
        const drawSection = buildSectionComponent('Draws', drawEntries, seasonalDoc);
        const eventSection = buildSectionComponent('Events', eventEntries, seasonalDoc);
        if (!drawSection && !eventSection) {
            calendarComponents.push({ type: 10, content: noneScheduledText });
        } else {
            if (drawSection) calendarComponents.push(drawSection);
            if (drawSection && eventSection) calendarComponents.push({ type: 14, spacing: 1, divider: false });
            if (eventSection) calendarComponents.push(eventSection);
        }
    } else {
        const playlistSection = buildSectionComponent('Playlists / Modes', playlistEntries, seasonalDoc);
        calendarComponents.push(playlistSection || { type: 10, content: noneScheduledText });
    }

    // SUB-PAGE NAVIGATION: stateless — the target page index is encoded directly in the custom_id,
    // same pattern used by /draws. Shared row builder (utils/paginationRow.js) keeps this visually
    // identical to /draws' own pagination.
    const paginationRow = buildPaginationRow({
        totalChunks, currentPage: safeSubPage,
        makeCustomId: (p) => `calsubpage_${p}`,
        indicatorCustomId: 'calsubpage_indicator'
    });
    // hasEndedEvents/endedFlags below need the FULL (unfiltered) entry set across all 3 buckets --
    // the toggle must stay visible as long as anything anywhere has ended, not just on whichever
    // page happens to be showing right now.
    const endedFlags = [...allDrawEntries, ...allEventEntries, ...allPlaylistEntries].map(e => isEventEnded(e, seasonalDoc, nowMs));
    // VIEW TOGGLE: switches between "Show Active Events Only" and "Show All Events". Only shown
    // when there's actually at least one ENDED event to hide -- if every event this season ends in
    // the future, "Active Only" and "All" render identically, and a toggle that visibly does
    // nothing just reads as broken (this confused Harkirat during testing before this check
    // existed). Persisted directly via prefs.calendarEventFilter (see UserPreference schema)
    // rather than a /settings toggle -- Harkirat specifically didn't want this cluttering the
    // settings dashboard, so /calendar reads/writes it itself.
    const hasEndedEvents = endedFlags.some(Boolean);
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
        // Row sits BETWEEN two dividers, hint comes last -- same structure /draws and /draw prices
        // already use for their own pagination rows (was hint-then-row here, the only outlier).
        calendarComponents.push({ type: 14, spacing: 2, divider: true });
        calendarComponents.push(controlsRow);
        calendarComponents.push({ type: 14, spacing: 2, divider: true });
        calendarComponents.push({ type: 10, content: `-# Toggle between **All Events** or **Active/Upcoming Events** only.` });
    } else if (paginationRow) {
        calendarComponents.push({ type: 14, spacing: 2, divider: true });
        calendarComponents.push(paginationRow);
    }

    const containerPayload = {
        type: 17,
        accent_color: accentColor,
        components: calendarComponents
    };

    const globalNavigationRow = buildGlobalNavRow('nav_calendar');

    return withShareButton([containerPayload, globalNavigationRow], isEphemeral);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calendar')
        // Trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) -- was truncating on mobile.
        .setDescription("View this season's in-game event timeline")
        .addBooleanOption(option => option.setName('hidden').setDescription('True = only you can see this response. False = everyone in the chat can see it.'))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    buildContainer,

    async execute(interaction, subPageOverride = 0, filterOverride = null) {
        const userId = interaction.user.id;

        // NOTE (added during review): kicked off alongside `prefs` instead of after it -- the
        // seasonal document doesn't depend on prefs at all, so it resolves concurrently with the
        // deferReply() ack below rather than only starting once that's done. Only `prefs` is
        // actually awaited before deferReply (keeps the 3-second ack window fast). .lean() since
        // this doc is only ever read here, never saved (unlike /manage's and /update's copies).
        const prefsPromise = UserPreference.findOne({ discordId: userId });
        const seasonalDocPromise = SeasonalData.findOne({ docType: 'global' }).lean();

        const prefs = await prefsPromise;
        const argPrivate = interaction.isChatInputCommand() ? interaction.options.getBoolean('hidden') : null;
        // NOTE: switched from the old per-command `calendarVisibility` field to the shared
        // `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in
        // /settings (Option A).
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });

        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const seasonalDoc = await seasonalDocPromise;

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

        return await sendV2Payload(interaction, components);
    }
};