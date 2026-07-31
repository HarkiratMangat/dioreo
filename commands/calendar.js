// ==========================================
// COMMAND: EVENT CALENDAR SCHEDULE
// ==========================================
// ARCHITECTURE: 3 separate pages (Draws / Events / Playlists-Modes), switched via named toggle
// buttons rather than Prev/Next -- see buildSectionToggleRow below. Includes a defensive char-budget
// safety net per section (SECTION_CHAR_BUDGET) since a bulk-imported list could otherwise overflow a
// single Text Display's 4000-char cap.

const { SlashCommandBuilder } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { isSameDrawTitle } = require('../utils/search');

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
// been set AND passed. TBD (added 2026-07-31 14:00 EDT, notes follow-up) means the admin explicitly
// doesn't know the end date yet -- treated as running INDEFINITELY (never "ended"), distinct from
// "not set yet" (still falls back to the old bpEnd-unset behavior). A `dateOnly` entry (a draw
// auto-merged in from newDraws/returningDraws with no explicit calendar row -- see
// getDrawSectionEntries below) has no range at all, so it's simply "ended" once its own release date
// has passed.
function isEventEnded(event, seasonalDoc, nowMs) {
    if (event.dateOnly) return new Date(event.date).getTime() <= nowMs;
    if (event.isOngoing) {
        if (seasonalDoc.bpEndTBD) return false;
        return Boolean(seasonalDoc.bpEnd) && new Date(seasonalDoc.bpEnd).getTime() <= nowMs;
    }
    return new Date(event.endDate).getTime() <= nowMs;
}

// 3-section calendar redesign (2026-07-31 12:10/13:30/14:00 EDT). The Draws section auto-merges in
// anything from newDraws/returningDraws that doesn't already have its own explicit `category:
// 'draw'` calendar entry -- per Harkirat's own note, a draw with no admin-typed calendar range
// should still show up here instead of being invisible just because it has no end date. A synthetic
// entry is tagged `dateOnly: true` so it renders as a single "Releases <date>" line instead of a
// false date range. Dedup uses `isSameDrawTitle()` (utils/search.js), NOT the generic `fuzzyMatch()`
// every other search route in this bot uses -- fuzzyMatch requires one full title to be a literal
// substring of the other, which real same-draw title pairs here routinely fail (extra words,
// different final word, reworded suffixes); see that function's own header for the real examples
// this was built against.
//
// Every entry also gets a `drawType` ('new'|'returning') for the New/Returning sub-split below.
// Synthetic entries know their type directly (they came from one specific array). An EXPLICIT
// calendar draw entry has no stored new/returning distinction of its own -- inferred the same way
// dedup works, via isSameDrawTitle against both arrays; an "orphan" explicit entry matching neither
// (a draw only ever bulk-imported into the calendar, never added to newDraws/returningDraws at all)
// defaults to 'new' -- arbitrary, but a reasonable default since most calendar-only draws are ones
// being freshly highlighted for the season.
function getDrawSectionEntries(seasonalDoc) {
    const explicitDraws = seasonalDoc.calendar.filter(e => e.category === 'draw');
    const newDraws = seasonalDoc.newDraws || [];
    const returningDraws = seasonalDoc.returningDraws || [];

    const taggedExplicit = explicitDraws.map(entry => {
        let drawType = 'new';
        if (newDraws.some(d => isSameDrawTitle(entry.title, d.title))) drawType = 'new';
        else if (returningDraws.some(d => isSameDrawTitle(entry.title, d.title))) drawType = 'returning';
        return { ...entry, drawType };
    });

    const syntheticNew = newDraws
        .filter(draw => !explicitDraws.some(e => isSameDrawTitle(draw.title, e.title)))
        .map(draw => ({ title: draw.title, date: draw.date, dateOnly: true, drawType: 'new' }));
    const syntheticReturning = returningDraws
        .filter(draw => !explicitDraws.some(e => isSameDrawTitle(draw.title, e.title)))
        .map(draw => ({ title: draw.title, date: draw.date, dateOnly: true, drawType: 'returning' }));

    return [...taggedExplicit, ...syntheticNew, ...syntheticReturning];
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
        if (seasonalDoc.bpEndTBD) {
            rangeText = `<t:${startUnix}:D>—TBD`;
        } else {
            rangeText = seasonalDoc.bpEnd
                ? `<t:${startUnix}:D>—<t:${Math.floor(new Date(seasonalDoc.bpEnd).getTime() / 1000)}:D>`
                : `<t:${startUnix}:D>—Ongoing`;
        }
    } else {
        rangeText = `<t:${startUnix}:D>—<t:${Math.floor(new Date(event.endDate).getTime() / 1000)}:D>`;
    }
    return `**✦ ${event.title}**\n-# ${emojis.b1} ${rangeText}`;
}

// Full-caps + underline heading, per Harkirat's explicit request (notes follow-up, 2026-07-31 14:00
// EDT) -- `.toUpperCase()` guarantees the caps regardless of how the heading text is typed at the
// call site, `__**...**__` combines Discord's underline+bold markdown inside the `### ` heading line.
function sectionHeading(emoji, text) {
    return `### ${emoji} __**${text.toUpperCase()}**__`;
}

// One Text Display per section (heading + entries together) -- Discord renders visible vertical
// margin BETWEEN components, not between lines inside one, so keeping heading+content in a single
// component is what keeps a section visually tight instead of looking like two floating pieces.
function buildSectionComponent(headingLine, entries, seasonalDoc) {
    if (entries.length === 0) return null;
    let body = entries.map(e => buildEntryLine(e, seasonalDoc)).join('\n');
    if (body.length > SECTION_CHAR_BUDGET) {
        body = body.slice(0, SECTION_CHAR_BUDGET) + `\n-# …and more (too many entries to show at once).`;
    }
    return { type: 10, content: `${headingLine}\n${body}` };
}

// PAGE TOGGLE ROW (replaces the old Prev/Next pagination, 2026-07-31 14:00 EDT, per Harkirat's
// explicit request) -- 3 named buttons instead of arrows, since there are exactly 3 fixed
// sections, not a variable chunk count. The current page's button is styled Primary+disabled
// (matches the "active/current page" convention documented in rendering-and-ui.md); the other two
// are Secondary and clickable.
// Button label "Gamemodes" is intentionally shorter than the page 2 heading text "Playlists &
// Modes" -- Harkirat's explicit call (2026-07-31 16:55 EDT), a button reads better short.
const PAGE_DEFS = [
    { page: 0, label: 'Draws' },
    { page: 1, label: 'Events' },
    { page: 2, label: 'Gamemodes' }
];
function buildSectionToggleRow(currentPage) {
    return {
        type: 1,
        components: PAGE_DEFS.map(d => ({
            type: 2,
            style: d.page === currentPage ? 1 : 2,
            label: d.label,
            custom_id: `calpage_${d.page}`,
            disabled: d.page === currentPage
        }))
    };
}

function buildContainer(seasonalDoc, page = 0, accentColor = PRESET_ACCENT, isEphemeral = false, filterMode = 'all') {
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

    const safePage = Math.min(Math.max(0, page), 2);

    // Two-line title (season title on top, command header below) — shared pattern, see
    // utils/titleBlock.js.
    const calendarComponents = [
        // headingLevel 2 (`## `, was `# `) for design consistency with /draw prices' own drop --
        // 2026-07-12, Harkirat's request to keep all seasonal command titles at the same size.
        buildTitleBlock(seasonTitle, emojis.calendar, 'Events Calendar', 2),
        { type: 14, spacing: 2, divider: true }
    ];

    const noneScheduledText = filterMode === 'active' && totalEntryCount > 0
        ? `*No active or upcoming events right now — every event this season has already ended. Change this under \`/settings\`'s Preferences page.*`
        : `*There are currently no events scheduled for this season.*`;

    if (safePage === 0) {
        // NEW/RETURNING DRAWS soft-split (notes follow-up, 2026-07-31 14:00 EDT) -- replaces the old
        // single "Draws" heading entirely; each sub-heading carries its own matching emoji
        // (emojiMap.js's existing newDraws/returningDraws icons, already used elsewhere in the bot
        // for this exact New/Returning distinction).
        const newDrawEntries = drawEntries.filter(e => e.drawType === 'new');
        const returningDrawEntries = drawEntries.filter(e => e.drawType === 'returning');
        const newSection = buildSectionComponent(sectionHeading(emojis.newDraws, 'New Draws'), newDrawEntries, seasonalDoc);
        const returningSection = buildSectionComponent(sectionHeading(emojis.returningDraws, 'Returning Draws'), returningDrawEntries, seasonalDoc);
        if (!newSection && !returningSection) {
            calendarComponents.push({ type: 10, content: noneScheduledText });
        } else {
            if (newSection) calendarComponents.push(newSection);
            if (newSection && returningSection) calendarComponents.push({ type: 14, spacing: 2, divider: true });
            if (returningSection) calendarComponents.push(returningSection);
        }
    } else if (safePage === 1) {
        const eventSection = buildSectionComponent(sectionHeading(emojis.events, 'Events'), eventEntries, seasonalDoc);
        calendarComponents.push(eventSection || { type: 10, content: noneScheduledText });
    } else {
        const playlistSection = buildSectionComponent(sectionHeading(emojis.modes, 'Playlists & Modes'), playlistEntries, seasonalDoc);
        calendarComponents.push(playlistSection || { type: 10, content: noneScheduledText });
    }

    // PAGE NAV: divider -> hint -> toggle row (reworked 2026-07-31 16:55 EDT, direct follow-up) --
    // was divider/row/divider/hint; Harkirat wanted the hint directly under the content with the
    // toggle row below it, and only ONE divider total separating the section content above from
    // this whole nav block.
    calendarComponents.push({ type: 14, spacing: 2, divider: true });
    calendarComponents.push({ type: 10, content: `-# Switch between this season's **Draws**, **Events**, and **Playlists & Modes**. (Tip: check out \`/settings\`)` });
    calendarComponents.push(buildSectionToggleRow(safePage));

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
        // `page`/`view` (added 2026-07-31 14:20 EDT) are one-off, per-invocation overrides only --
        // neither is saved anywhere. `view` falls back to the /settings-saved calendarEventFilter
        // preference when omitted; `page` just opens on Draws (page 0) when omitted, same as before
        // this option existed.
        .addStringOption(option => option.setName('page').setDescription('Jump directly to a specific page').addChoices(
            { name: 'Draws', value: 'draws' }, { name: 'Events', value: 'events' }, { name: 'Playlists & Modes', value: 'playlists' }
        ))
        .addStringOption(option => option.setName('view').setDescription('Show all events, or only active/upcoming ones (defaults to your /settings choice)').addChoices(
            { name: 'All Events', value: 'all' }, { name: 'Active/Upcoming Only', value: 'active' }
        ))
        .addBooleanOption(option => option.setName('hidden').setDescription('True = only you can see this response. False = everyone in the chat can see it.'))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    buildContainer,

    async execute(interaction, pageOverride = null) {
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

        // The Active/All Events filter moved to /settings entirely (2026-07-31 14:00 EDT, notes
        // follow-up) -- /calendar just reads the saved preference fresh on every render now, no more
        // in-page toggle button/handler to keep in sync with it. `view` (added 2026-07-31 14:20 EDT)
        // is a one-off per-invocation override on top of that -- never saved, only ever read on a
        // real slash-command launch (a button/select re-render always passes pageOverride explicitly
        // and never carries a `view` option to read here anyway).
        const viewChoice = interaction.isChatInputCommand() ? interaction.options.getString('view') : null;
        const filterMode = viewChoice || prefs?.calendarEventFilter || 'all';

        // `page` (added 2026-07-31 14:20 EDT) is the same kind of one-off override -- only consulted
        // when pageOverride wasn't already supplied by a button click (buildSyntheticInteraction
        // callers always pass an explicit numeric page). Maps the option's word value to the numeric
        // page index buildContainer expects.
        const PAGE_OPTION_TO_INDEX = { draws: 0, events: 1, playlists: 2 };
        let targetPage = pageOverride;
        if (targetPage === null) {
            const pageChoice = interaction.isChatInputCommand() ? interaction.options.getString('page') : null;
            targetPage = pageChoice ? PAGE_OPTION_TO_INDEX[pageChoice] : 0;
        }

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(seasonalDoc, targetPage, accentColor, isEphemeral, filterMode);

        return await sendV2Payload(interaction, components);
    }
};
