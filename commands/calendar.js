// ==========================================
// COMMAND: EVENT CALENDAR SCHEDULE
// ==========================================
// ARCHITECTURE: 3 separate pages (Draws / Events / Playlists-Modes), switched via named toggle buttons rather than Prev/Next -- see buildSectionToggleRow below. Includes a defensive char-budget safety net per section (SECTION_CHAR_BUDGET) since a bulk-imported list could otherwise overflow a single Text Display's 4000-char cap.

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
const { mentionCommand } = require('../utils/commandMentions');
// ⚠️ REVERTED 2026-08-07 21:30 EDT -- the width-cap fix below (2026-07-31 17:20 EDT, "an uncapped banner was making the whole container render unnecessarily wide on desktop") was built on the assumption that a Discord CDN-hosted banner gets a genuine small-preview/full-resolution-on-click pairing via Discord's own resize proxy. Now that every banner is re-hosted to Cloudinary (see utils/calendarBannerCache.js's 2026-08-07 21:25 EDT fix for why -- Discord CDN links expire), that pairing no longer exists: a Cloudinary-transformed derivative is a genuinely separate, smaller file with no path back to the original, so the cap now also shrinks the ZOOMED view, not just the inline preview. Verified live on the dev bot -- confirmed by Harkirat: "it does work but it has that initial issue we discussed where it will remain in that small size even if someone taps on it. So I'd rather not do the resize." Full width now shows both inline and on zoom; the desktop- width nuisance this was fixing is the smaller cost of the two.

// Repalette (2026-07-12, Section 5 of the batch) -- replaces the old flat 5-color nav-order gradient (Police Blue/Chinese Violet/China Rose/Light Coral/Tumbleweed) with a color chosen per command instead of just its position in a fade. Calendar gets a deep structural blue (schedule/ dependable) -- deliberately NOT a teal-leaning alternative Harkirat considered, so it doesn't sit hue-adjacent to Draw Prices' green two slots over in the nav row. See CLAUDE.md's design-decision- log entry for the full nav-row hue-spread reasoning (cool blue -> plum -> green -> gold -> warm amber, left to right).
const PRESET_ACCENT = 3821672; // Slate Harbor (#3A5068) — 1st nav button (Calendar)

// A Text Display's `content` caps at 4000 characters. Real seasonal calendars are nowhere near this (a season's whole timeline is a few dozen entries at most), so this is a safety net, not a real chunking system -- if a section ever legitimately overflows it, truncate with a "+N more" note rather than risk the whole message failing to send.
const SECTION_CHAR_BUDGET = 3800;

// An "All Season" event has no fixed end date of its own -- it runs until the Battle Pass ends (see the rangeText logic below), so an ongoing event only counts as "ended" once bpEnd has both been set AND passed. TBD (added 2026-07-31 14:00 EDT, notes follow-up) means the admin explicitly doesn't know the end date yet -- treated as running INDEFINITELY (never "ended"), distinct from "not set yet" (still falls back to the old bpEnd-unset behavior).
//
// A `dateOnly` entry (a draw auto-merged in from newDraws/returningDraws with no explicit calendar row -- see getDrawSectionEntries below) NEVER counts as "ended" (fixed 2026-08-07 13:03 EDT). It used to return `released date <= now`, which conflates RELEASED with ENDED -- a draw released TODAY reads as "ended" the instant its UTC-midnight release timestamp passes, which for any US-timezone viewer is almost immediately. Found live: "Judgment Day - It Goes Two" (released 2026-08-07T00:00:00Z) correctly showed on `/draws` (no filtering there) but silently vanished from `/calendar`'s Draws page under Harkirat's saved `calendarEventFilter: 'active'` preference, even though the data was correct in every array and the synthesis/dedup logic worked exactly as designed -- the filter itself was applying the wrong test. A draw only ever disappears from here when it's actually removed from `newDraws`/`returningDraws` (normally a season rollover), same as `/draws` already behaves with no end-date concept at all -- there is no real "ended" state to detect for a dateOnly entry until the season-expiry feature (`docs/db-deferred-list.md`'s Queued "draws/calendar auto-expire on season end", filed from the notes file) gets built on purpose.
function isEventEnded(event, seasonalDoc, nowMs) {
    if (event.dateOnly) return false;
    if (event.isOngoing) {
        if (seasonalDoc.bpEndTBD) return false;
        return Boolean(seasonalDoc.bpEnd) && new Date(seasonalDoc.bpEnd).getTime() <= nowMs;
    }
    return new Date(event.endDate).getTime() <= nowMs;
}

// 3-section calendar redesign (2026-07-31 12:10/13:30/14:00 EDT). The Draws section auto-merges in anything from newDraws/returningDraws that doesn't already have its own explicit `category: 'draw'` calendar entry -- per Harkirat's own note, a draw with no admin-typed calendar range should still show up here instead of being invisible just because it has no end date. A synthetic entry is tagged `dateOnly: true` so it renders as a single "Releases <date>" line instead of a false date range. Dedup uses `isSameDrawTitle()` (utils/search.js), NOT the generic `fuzzyMatch()` every other search route in this bot uses -- fuzzyMatch requires one full title to be a literal substring of the other, which real same-draw title pairs here routinely fail (extra words, different final word, reworded suffixes); see that function's own header for the real examples this was built against.
//
// Every entry also gets a `drawType` ('new'|'returning') for the New/Returning sub-split below. Synthetic entries know their type directly (they came from one specific array). An EXPLICIT calendar draw entry has no stored new/returning distinction of its own -- inferred the same way dedup works, via isSameDrawTitle against both arrays; an "orphan" explicit entry matching neither (a draw only ever bulk-imported into the calendar, never added to newDraws/returningDraws at all) defaults to 'new' -- arbitrary, but a reasonable default since most calendar-only draws are ones being freshly highlighted for the season.
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
    // Redesigned per calendar_update_ui.json: bold title line + a subtext date-range line below it, using the static "b1" bullet emoji and `D` (Long Date) style with the em-dash directly joining the two timestamps, no surrounding spaces.
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

// Full-caps + underline heading, per Harkirat's explicit request (notes follow-up, 2026-07-31 14:00 EDT) -- `.toUpperCase()` guarantees the caps regardless of how the heading text is typed at the call site, `__**...**__` combines Discord's underline+bold markdown inside the `### ` heading line.
function sectionHeading(emoji, text) {
    return `### ${emoji} __**${text.toUpperCase()}**__`;
}

// One Text Display per section (heading + entries together) -- Discord renders visible vertical margin BETWEEN components, not between lines inside one, so keeping heading+content in a single component is what keeps a section visually tight instead of looking like two floating pieces.
function buildSectionComponent(headingLine, entries, seasonalDoc) {
    if (entries.length === 0) return null;
    let body = entries.map(e => buildEntryLine(e, seasonalDoc)).join('\n');
    if (body.length > SECTION_CHAR_BUDGET) {
        body = body.slice(0, SECTION_CHAR_BUDGET) + `\n-# …and more (too many entries to show at once).`;
    }
    return { type: 10, content: `${headingLine}\n${body}` };
}

// PAGE TOGGLE ROW (replaces the old Prev/Next pagination, 2026-07-31 14:00 EDT, per Harkirat's explicit request) -- 3 named buttons instead of arrows, since there are exactly 3 fixed sections, not a variable chunk count. The current page's button is styled Primary+disabled (matches the "active/current page" convention documented in rendering-and-ui.md); the other two are Secondary and clickable. Button label shortened "Gamemodes" -> "Modes" (2026-08-07 15:48 EDT, Harkirat's direct follow-up to the emoji addition below) -- the 3 buttons + their new emoji no longer fit on one row on mobile with "Gamemodes" spelled out (wrapped to its own 2nd row), and Harkirat wanted them to stay a single row. The footer hint line and the page-2 section heading both went "Playlists & Modes" -> "Gamemodes" -> "Game Modes" (2026-08-07 15:48-16:16 EDT, Harkirat's own correction -- "Gamemodes" isn't a real word; CODM's actual in-game terminology is the two-word "Game Modes"). The button label itself stays the shorter "Modes" (unaffected by this correction either way -- it's an abbreviation, not the fused misspelling). **The slash-command `data_for`-style choice list (`{ name: 'Playlists & Modes', value: 'playlists' }` below) is the ONE place still reading "Playlists & Modes" -- deliberately left alone, Harkirat's asks so far have named the button/hint/heading specifically, not that choice list.** Emoji added to each button 2026-08-07 13:10 EDT per Harkirat's request -- Draws reuses the SAME `newDraws` emoji /draws' own New Draws heading uses (his explicit call, rather than a separate generic "draw" icon), Events/Modes use emojiMap's own `events`/`modes` icons. `emojiKey` (a STRING NAME, not the emoji value itself) fixed 2026-08-07 13:59 EDT after CI's checkEmojiCaptures.js caught it: this table is module-level, so storing `emojis.newDraws` directly here would capture the PROD id at require() time, before `refreshEmojiIds()` ever runs on boot -- stale/broken on the dev bot exactly like the Guide emoji this same session already fixed elsewhere. `buildSectionToggleRow` looks the key up in `emojis` fresh on every render instead.
const PAGE_DEFS = [
    { page: 0, label: 'Draws', emojiKey: 'newDraws' },
    { page: 1, label: 'Events', emojiKey: 'events' },
    { page: 2, label: 'Modes', emojiKey: 'modes' }
];

// Per-page banner fields (added 2026-07-31 17:20 EDT, the notes file follow-up) -- indexed by the same numeric page used everywhere else in this file. Blank/'' = show nothing for that page, not a placeholder -- see utils/calendarBannerCache.js + /manage's "Banners" action.
const BANNER_FIELDS_BY_PAGE = ['drawsBannerUrl', 'eventsBannerUrl', 'playlistsBannerUrl'];
function buildSectionToggleRow(currentPage) {
    return {
        type: 1,
        components: PAGE_DEFS.map(d => ({
            type: 2,
            style: d.page === currentPage ? 1 : 2,
            label: d.label,
            emoji: emojis.parseEmoji(emojis[d.emojiKey]),
            custom_id: `calpage_${d.page}`,
            disabled: d.page === currentPage
        }))
    };
}

function buildContainer(seasonalDoc, page = 0, accentColor = PRESET_ACCENT, isEphemeral = false, filterMode = 'all', client) {
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

    const calendarComponents = [];

    // Per-page banner -- rendered as a true cover image at the VERY TOP of the container, above even the title (Harkirat's explicit call, 2026-07-31 17:20 EDT -- reads like a real banner/ splash image rather than a mid-card illustration this way). Independently settable per page; omitted entirely (no placeholder) when unset.
    const bannerUrl = seasonalDoc[BANNER_FIELDS_BY_PAGE[safePage]];
    if (bannerUrl) {
        calendarComponents.push({ type: 12, items: [{ media: { url: bannerUrl } }] });
    }

    // Two-line title (season title on top, command header below) — shared pattern, see utils/titleBlock.js. headingLevel 2 (`## `, was `# `) for design consistency with /draw prices' own drop -- 2026-07-12, Harkirat's request to keep all seasonal command titles at the same size.
    calendarComponents.push(buildTitleBlock(seasonTitle, emojis.calendar, 'Season Calendar', 2));
    calendarComponents.push({ type: 14, spacing: 2, divider: true });

    const noneScheduledText = filterMode === 'active' && totalEntryCount > 0
        ? `*No active or upcoming events right now — every event this season has already ended. Change this under \`/settings\`'s Preferences page.*`
        : `*There are currently no events scheduled for this season.*`;

    if (safePage === 0) {
        // NEW/RETURNING DRAWS soft-split (notes follow-up, 2026-07-31 14:00 EDT) -- replaces the old single "Draws" heading entirely; each sub-heading carries its own matching emoji (emojiMap.js's existing newDraws/returningDraws icons, already used elsewhere in the bot for this exact New/Returning distinction).
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
        const playlistSection = buildSectionComponent(sectionHeading(emojis.modes, 'Game Modes'), playlistEntries, seasonalDoc);
        calendarComponents.push(playlistSection || { type: 10, content: noneScheduledText });
    }

    // PAGE NAV: divider -> hint -> toggle row (reworked 2026-07-31 16:55 EDT, direct follow-up) -- was divider/row/divider/hint; Harkirat wanted the hint directly under the content with the toggle row below it, and only ONE divider total separating the section content above from this whole nav block.
    calendarComponents.push({ type: 14, spacing: 2, divider: true });
    calendarComponents.push({ type: 10, content: `-# Switch between this season's **Draws**, **Events**, and **Game Modes**. (Tip: check out ${mentionCommand(client, '/settings')})` });
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
        // `page`/`view` (added 2026-07-31 14:20 EDT) are one-off, per-invocation overrides only -- neither is saved anywhere. `view`'s old /settings-saved default (`calendarEventFilter`) was SILENCED 2026-08-15 13:01 EDT -- it now just defaults to 'all' when omitted, same as `page` opening on Draws (page 0) when omitted.
        .addStringOption(option => option.setName('page').setDescription('Jump directly to a specific page').addChoices(
            { name: 'Draws', value: 'draws' }, { name: 'Events', value: 'events' }, { name: 'Playlists & Modes', value: 'playlists' }
        ))
        .addStringOption(option => option.setName('view').setDescription('Show all events, or only active/upcoming ones').addChoices(
            { name: 'All Events', value: 'all' }, { name: 'Active/Upcoming Only', value: 'active' }
        ))
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    buildContainer,

    async execute(interaction, pageOverride = null) {
        const userId = interaction.user.id;

        // NOTE (added during review): kicked off alongside `prefs` instead of after it -- the seasonal document doesn't depend on prefs at all, so it resolves concurrently with the deferReply() ack below rather than only starting once that's done. Only `prefs` is actually awaited before deferReply (keeps the 3-second ack window fast). .lean() since this doc is only ever read here, never saved (unlike /manage's and /update's copies).
        const prefsPromise = UserPreference.findOne({ discordId: userId });
        const seasonalDocPromise = SeasonalData.findOne({ docType: 'global' }).lean();

        const prefs = await prefsPromise;
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
        // NOTE: switched from the old per-command `calendarVisibility` field to the shared `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in /settings (Option A).
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });

        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const seasonalDoc = await seasonalDocPromise;

        if (!seasonalDoc) {
            return interaction.followUp({ content: '❌ The global seasonal database document has not been initialized yet.' });
        }

        // The Active/All Events filter's /settings default preference was SILENCED 2026-08-15 13:01 EDT (Harkirat's direct request) -- `prefs.calendarEventFilter` is no longer read here (or written anywhere; see commands/settings.js). `view` is now the ONLY way to pick Active/Upcoming for a given invocation, a genuine one-off, defaulting to 'all' when omitted. Never saved, only ever read on a real slash-command launch (a button/select re-render always passes pageOverride explicitly and never carries a `view` option to read here anyway).
        const viewChoice = interaction.isChatInputCommand() ? interaction.options.getString('view') : null;
        const filterMode = viewChoice || 'all';

        // `page` (added 2026-07-31 14:20 EDT) is the same kind of one-off override -- only consulted when pageOverride wasn't already supplied by a button click (buildSyntheticInteraction callers always pass an explicit numeric page). Maps the option's word value to the numeric page index buildContainer expects.
        const PAGE_OPTION_TO_INDEX = { draws: 0, events: 1, playlists: 2 };
        let targetPage = pageOverride;
        if (targetPage === null) {
            const pageChoice = interaction.isChatInputCommand() ? interaction.options.getString('page') : null;
            targetPage = pageChoice ? PAGE_OPTION_TO_INDEX[pageChoice] : 0;
        }

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(seasonalDoc, targetPage, accentColor, isEphemeral, filterMode, interaction.client);

        return await sendV2Payload(interaction, components);
    }
};
