// ==========================================
// COMMAND: EVENT CALENDAR SCHEDULE
// ==========================================
// ARCHITECTURE: 3 separate pages (Draws / Events / Playlists-Modes), walked by a looping pager with a filter dropdown under it (2026-10-21; it replaced the Draws / Events / Modes buttons) -- see buildCalendarPager and buildFilterRow below. Includes a defensive char-budget safety net per section (SECTION_CHAR_BUDGET) since a bulk-imported list could otherwise overflow a single Text Display's 4000-char cap.

const BOT_EMOJI = require('../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { SlashCommandBuilder } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { seasonEmojiFor, withCaptionEmoji } = require('../utils/seasonEmoji');
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { isSameDrawTitle } = require('../utils/search');
const { buildPaginationRow } = require('../utils/paginationRow');
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

// Where an entry stands right now: 'over', 'live', 'soon' or 'tba' (no usable date), with its start and end in ms (end null when it has none: a draw merged in from newDraws/returningDraws, or an All Season event with bpEnd unset or TBD).
function entryState(event, seasonalDoc, nowMs) {
    // A missing date is TBA, never the epoch: `new Date(null)` is 1970, which read as long since live.
    const startMs = event.date ? new Date(event.date).getTime() : NaN;
    let endMs = null;
    if (!event.dateOnly) {
        if (event.isOngoing) endMs = seasonalDoc.bpEndTBD || !seasonalDoc.bpEnd ? null : new Date(seasonalDoc.bpEnd).getTime();
        else if (event.endDate) endMs = new Date(event.endDate).getTime();
    }
    if (!Number.isFinite(startMs)) return { state: 'tba', startMs, endMs };
    if (Number.isFinite(endMs) && endMs <= nowMs) return { state: 'over', startMs, endMs };
    if (nowMs < startMs) return { state: 'soon', startMs, endMs };
    return { state: 'live', startMs, endMs };
}

// The calendar's order (2026-10-21 14:39 EDT, Harkirat: "move finished events to the top of the list in oldest to newest finished order. Active and upcoming sorted similarly as well? Active being \"first to end to last to end order\". Upcoming being \"first to release to last to release\""): finished by when they ended, then live by when they end (one with no end after them, by start), then upcoming by when they start, then any with no date.
const STATE_ORDER = { over: 0, live: 1, soon: 2, tba: 3 };
function compareEntries(seasonalDoc, nowMs) {
    return (a, b) => {
        const x = entryState(a, seasonalDoc, nowMs), y = entryState(b, seasonalDoc, nowMs);
        if (x.state !== y.state) return STATE_ORDER[x.state] - STATE_ORDER[y.state];
        if (x.state === 'soon') return x.startMs - y.startMs;
        if (x.state === 'tba') return 0;
        const ex = Number.isFinite(x.endMs) ? x.endMs : Infinity, ey = Number.isFinite(y.endMs) ? y.endMs : Infinity;
        return ex !== ey ? ex - ey : x.startMs - y.startMs;
    };
}

// One entry: a status dot, the name, and a small line saying where it stands (2026-10-21 14:34 EDT, his mock G, after mocks A–F in #testing-spam): green live, white upcoming or undated, red with the name struck through once it is over. The small line is padded with two blank braille characters so it sits under the name: Discord indents nothing in small text, and its own list bullet swallowed the line (his "Indent didn't work"). An entry with no usable date reads "Releases TBA", never a raw `<t:NaN:D>` (2026-10-20). Replaces the 2026-07-31 calendar_update_ui.json shape (`**✦ title**` over a `b1` date range).
function buildEntryLine(event, seasonalDoc, nowMs = Date.now()) {
    const { state, startMs, endMs } = entryState(event, seasonalDoc, nowMs);
    const s = Math.floor(startMs / 1000), e = Number.isFinite(endMs) ? Math.floor(endMs / 1000) : null;
    const returning = event.drawType === 'returning';
    let text;
    if (state === 'tba') text = 'Releases TBA';
    else if (state === 'over') text = `Ended <t:${e}:R>`;
    else if (state === 'soon') text = `${returning ? 'Returns' : event.dateOnly ? 'Releases' : 'Starts'} <t:${s}:R> · <t:${s}:D>`;
    else if (e) text = `**Live** · ends <t:${e}:R>`;
    else if (event.dateOnly) text = returning ? `**Back** · returned <t:${s}:R>` : `**Live** · released <t:${s}:R>`;
    else text = `**Live** · ends ${seasonalDoc.bpEndTBD ? 'TBD' : 'with the season'}`;
    const dot = state === 'live' ? emojis.greenDotGlow : state === 'over' ? emojis.redDotGlow : emojis.whiteDotGlow;
    const title = state === 'over' ? `~~**${event.title}**~~` : `**${event.title}**`;
    return `${dot} ${title}\n-# \u2800\u2800 ${text}`;
}

// Full-caps + underline heading, per Harkirat's explicit request (notes follow-up, 2026-07-31 14:00 EDT) -- `.toUpperCase()` guarantees the caps regardless of how the heading text is typed at the call site, `__**...**__` combines Discord's underline+bold markdown inside the `### ` heading line.
function sectionHeading(emoji, text) {
    return `### ${emoji} __**${text.toUpperCase()}**__`;
}

// One Text Display per section (heading + entries together) -- Discord renders visible vertical margin BETWEEN components, not between lines inside one, so keeping heading+content in a single component is what keeps a section visually tight instead of looking like two floating pieces.
function buildSectionComponent(headingLine, entries, seasonalDoc) {
    if (entries.length === 0) return null;
    let body = entries.map(e => buildEntryLine(e, seasonalDoc, Date.now())).join('\n');
    if (body.length > SECTION_CHAR_BUDGET) {
        body = body.slice(0, SECTION_CHAR_BUDGET) + `\n-# …and more (too many entries to show at once).`;
    }
    return { type: 10, content: `${headingLine}\n${body}` };
}

// The three pages, in pager order. `emojiKey` is a NAME looked up in `emojis` at render time, never the emoji value: this table is module-level, and a value captured here would keep the PROD id the dev bot cannot show (scripts/checkEmojiCaptures.js, 2026-08-07). The heading for page 2 reads "Game Modes"; the filter calls it "Playlists & Modes", his wording.
const PAGE_DEFS = [
    { page: 0, label: 'Draws', emojiKey: 'newDraws' },
    { page: 1, label: 'Events', emojiKey: 'events' },
    { page: 2, label: 'Modes', emojiKey: 'modes' }
];

// Per-page banner fields (added 2026-07-31 17:20 EDT, the notes file follow-up) -- indexed by the same numeric page used everywhere else in this file. Blank/'' = show nothing for that page, not a placeholder -- see utils/calendarBannerCache.js + /manage's "Banners" action.
const BANNER_FIELDS_BY_PAGE = ['drawsBannerUrl', 'eventsBannerUrl', 'playlistsBannerUrl'];

// THE FILTER (2026-10-21 15:32 EDT, Harkirat: "change the toggle buttons to a filter dropdown menu instead? with Live, Past/Ended, Upcoming, Lucky Draws, Special Events, Playlists & Modes as the filter options? lets still keep draws/events/modes seperated on 3 pages tho. and we can add a pagination row above the filter dropdown (loops pagination)"). One multi-select replaces the Draws / Events / Modes buttons. Its picks are a bit mask that rides in every custom_id, because nothing about the filter is saved:
//   - the three STATUS picks keep only the entries in those states (none picked = every state; an undated entry counts as Upcoming);
//   - the three PAGE picks decide which pages the pager walks (none picked = all three). Their descriptions are his wording (2026-10-21 15:45 EDT).
const FILTER_OPTIONS = [
    { value: 'live', bit: 1, label: 'Live', emojiKey: 'greenDotGlow', description: 'Running right now' },
    { value: 'over', bit: 2, label: 'Past/Ended', emojiKey: 'redDotGlow', description: 'Already finished this season' },
    { value: 'soon', bit: 4, label: 'Upcoming', emojiKey: 'whiteDotGlow', description: "Hasn't started yet" },
    { value: 'draws', bit: 8, label: 'Lucky Draws', emojiKey: 'newDraws', description: 'Draws releasing this season' },
    { value: 'events', bit: 16, label: 'Special Events', emojiKey: 'events', description: 'Special Events this season' },
    { value: 'modes', bit: 32, label: 'Playlists & Modes', emojiKey: 'modes', description: 'Playlists & game modes this season' }
];
const STATE_BITS = 7;
const PAGE_BIT = [8, 16, 32];
const STATE_BIT = { live: 1, over: 2, soon: 4, tba: 4 };

// Every way a filter arrives, as a mask: a number from a custom_id, the slash `filter` choice ('all'|'over'|'live'|'soon'), or 'active' from a panel posted before 2026-10-21 (the old `view:Active/Upcoming`, which is Live + Upcoming).
function filterMask(filterMode) {
    if (typeof filterMode === 'number' && Number.isFinite(filterMode)) return filterMode & 63;
    if (filterMode === 'active') return 1 | 4;
    const opt = FILTER_OPTIONS.find(o => o.value === filterMode);
    return opt ? opt.bit : 0;
}

// The pages the pager walks under a mask, in order.
const visiblePages = mask => [0, 1, 2].filter(p => !(mask & 56) || (mask & PAGE_BIT[p]));

// The pager above the filter: it walks only the visible pages and loops. Direction rides in the id (`_p`/`_n`), so two pages still give two different ids (Discord rejects a message whose ids repeat).
function buildCalendarPager(page, mask) {
    const pages = visiblePages(mask);
    const idx = Math.max(0, pages.indexOf(page));
    return buildPaginationRow({
        totalChunks: pages.length,
        currentPage: idx,
        prevCustomId: `calpage_${pages[(idx - 1 + pages.length) % pages.length]}_m${mask}_p`,
        nextCustomId: `calpage_${pages[(idx + 1) % pages.length]}_m${mask}_n`,
        indicatorCustomId: 'calpage_ind'
    });
}

// The filter dropdown. Its picks are its defaults, so the closed menu shows what is applied.
function buildFilterRow(page, mask) {
    return {
        type: 1,
        components: [{
            type: 3,
            custom_id: `calsel_${page}`,
            placeholder: 'Filter: Full timeline',
            min_values: 0,
            max_values: FILTER_OPTIONS.length,
            options: FILTER_OPTIONS.map(o => ({ label: o.label, value: o.value, description: o.description, emoji: emojis.parseEmoji(emojis[o.emojiKey]), default: Boolean(mask & o.bit) }))
        }]
    };
}

function buildContainer(seasonalDoc, page = 0, accentColor = PRESET_ACCENT, isEphemeral = false, filterMode = 'all', client) {
    const seasonTitle = seasonalDoc.currentSeasonTitle || "Current Season";
    const nowMs = Date.now();
    const sortByDate = compareEntries(seasonalDoc, nowMs);
    const mask = filterMask(filterMode);
    const states = mask & STATE_BITS;
    const applyFilter = (entries) => states
        ? entries.filter(e => states & STATE_BIT[entryState(e, seasonalDoc, nowMs).state])
        : entries;

    const allDrawEntries = getDrawSectionEntries(seasonalDoc).sort(sortByDate);
    const allEventEntries = seasonalDoc.calendar.filter(e => e.category === 'event' || !e.category).sort(sortByDate);
    const allPlaylistEntries = seasonalDoc.calendar.filter(e => e.category === 'playlist').sort(sortByDate);
    const totalEntryCount = allDrawEntries.length + allEventEntries.length + allPlaylistEntries.length;

    const drawEntries = applyFilter(allDrawEntries);
    const eventEntries = applyFilter(allEventEntries);
    const playlistEntries = applyFilter(allPlaylistEntries);

    // A page the filter leaves out falls back to the first page it keeps.
    const pages = visiblePages(mask);
    const safePage = pages.includes(page) ? page : pages[0];

    const calendarComponents = [];

    // Per-page banner -- rendered as a true cover image at the VERY TOP of the container, above even the title (Harkirat's explicit call, 2026-07-31 17:20 EDT -- reads like a real banner/ splash image rather than a mid-card illustration this way). Independently settable per page; omitted entirely (no placeholder) when unset.
    const bannerUrl = seasonalDoc[BANNER_FIELDS_BY_PAGE[safePage]];
    if (bannerUrl) {
        calendarComponents.push({ type: 12, items: [{ media: { url: bannerUrl } }] });
    }

    // Two-line title (season title on top, command header below) — shared pattern, see utils/titleBlock.js. headingLevel 2 (`## `, was `# `) for design consistency with /draw prices' own drop -- 2026-07-12, Harkirat's request to keep all seasonal command titles at the same size. The season's emoji in front of the season title (2026-10-19 09:26 EDT, Harkirat), see utils/seasonEmoji.js.
    calendarComponents.push(withCaptionEmoji(buildTitleBlock(seasonTitle, emojis.calendar, 'Season Calendar', 2), seasonEmojiFor(seasonalDoc.currentSeasonTitle, seasonalDoc.currentSeasonEmoji)));
    calendarComponents.push({ type: 14, spacing: 2, divider: true });

    // An empty page keeps its own heading, so it is clear which page is empty (2026-10-21 15:53 EDT, Harkirat: "can that include the \":Events: EVENTS\" heading? and add the warning icon infront of the hint"). The Draws page names itself Draws here, having no New/Returning split to show.
    const filteredOut = states && totalEntryCount > 0;
    const emptyPage = (headingLine) => ({ type: 10, content: `${headingLine}\n${filteredOut
        ? `${emojis.warn} *Nothing on this page matches the filter. Clear it to see the full timeline.*`
        : `*There are currently no events scheduled for this season.*`}` });

    if (safePage === 0) {
        // NEW/RETURNING DRAWS soft-split (notes follow-up, 2026-07-31 14:00 EDT) -- replaces the old single "Draws" heading entirely; each sub-heading carries its own matching emoji (emojiMap.js's existing newDraws/returningDraws icons, already used elsewhere in the bot for this exact New/Returning distinction).
        const newDrawEntries = drawEntries.filter(e => e.drawType === 'new');
        const returningDrawEntries = drawEntries.filter(e => e.drawType === 'returning');
        const newSection = buildSectionComponent(sectionHeading(emojis.newDraws, 'New Draws'), newDrawEntries, seasonalDoc);
        const returningSection = buildSectionComponent(sectionHeading(emojis.returningDraws, 'Returning Draws'), returningDrawEntries, seasonalDoc);
        if (!newSection && !returningSection) {
            calendarComponents.push(emptyPage(sectionHeading(emojis.newDraws, 'Draws')));
        } else {
            if (newSection) calendarComponents.push(newSection);
            if (newSection && returningSection) calendarComponents.push({ type: 14, spacing: 2, divider: true });
            if (returningSection) calendarComponents.push(returningSection);
        }
    } else if (safePage === 1) {
        const eventSection = buildSectionComponent(sectionHeading(emojis.events, 'Events'), eventEntries, seasonalDoc);
        calendarComponents.push(eventSection || emptyPage(sectionHeading(emojis.events, 'Events')));
    } else {
        const playlistSection = buildSectionComponent(sectionHeading(emojis.modes, 'Game Modes'), playlistEntries, seasonalDoc);
        calendarComponents.push(playlistSection || emptyPage(sectionHeading(emojis.modes, 'Game Modes')));
    }

    // PAGE NAV: divider -> hint -> pager -> filter (2026-10-21 15:32 EDT). One divider separates the content from the whole block, and the hint sits directly under the content (2026-07-31 16:55 EDT). The pager is left out when the filter keeps one page.
    calendarComponents.push({ type: 14, spacing: 2, divider: true });
    // His wording, 2026-10-21 15:58 EDT, with the /settings tip removed ("let's remove the \"tip check out settings\" part").
    calendarComponents.push({ type: 10, content: `-# Switch between **Draws**, **Events**, and **Game Modes**, or filter your view further.` });
    const pager = buildCalendarPager(safePage, mask);
    if (pager) calendarComponents.push(pager);
    calendarComponents.push(buildFilterRow(safePage, mask));

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
        // `page`/`filter` are one-off, per-invocation overrides only -- neither is saved anywhere. `filter` was `view` (All Events / Active/Upcoming Only) until 2026-10-21 15:32 EDT (Harkirat: "view -> filter ... change the sub-options to \"Full timeline\", \"past/ended\", \"live right now\", \"upcoming\""). Its old /settings-saved default (`calendarEventFilter`) was SILENCED 2026-08-15 13:01 EDT.
        .addStringOption(option => option.setName('page').setDescription('Jump directly to a specific page').addChoices(
            { name: 'Draws', value: 'draws' }, { name: 'Events', value: 'events' }, { name: 'Playlists & Modes', value: 'playlists' }
        ))
        .addStringOption(option => option.setName('filter').setDescription('Show the full timeline, or only past, live or upcoming entries').addChoices(
            { name: 'Full Timeline', value: 'all' }, { name: 'Past/Ended', value: 'over' }, { name: 'Live Right Now', value: 'live' }, { name: 'Upcoming', value: 'soon' }
        ))
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    buildContainer,
    filterMask,
    FILTER_OPTIONS,
    entryState,
    compareEntries,
    // Exported for /bot analytics' change-detail panel: buildEntryLine is the CANONICAL renderer for one calendar row (rule D -- never re-describe a record), and isEventEnded is the ONLY thing that decides whether /calendar's Active/Upcoming view still shows it. A second, hand-rolled date comparison over there would drift from this one and then confidently state the opposite.
    buildEntryLine,
    isEventEnded,

    // filterOverride: the filter mask a pager button or the filter dropdown carries (or 'active' from a panel posted before 2026-10-21); a slash `filter` still wins.
    async execute(interaction, pageOverride = null, filterOverride = null) {
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
            return interaction.followUp({ content: BOT_EMOJI.cross + ' The global seasonal database document has not been initialized yet.' });
        }

        // The filter's /settings default preference was SILENCED 2026-08-15 13:01 EDT (Harkirat's direct request) -- the field itself (`calendarEventFilter`) was removed from UserPreference 2026-10-21 15:58 EDT (Harkirat: "remove the setting's default calendar view option since it doesn't matter anymore"). The slash `filter` is a one-off, defaulting to the full timeline. Never saved, only read on a real slash-command launch.
        const filterChoice = interaction.isChatInputCommand() ? interaction.options.getString('filter') : null;
        const filterMode = filterChoice || filterOverride || 'all';

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
