// ==========================================
// COMMAND: SEASONAL LUCKY DRAWS (MULTI-PAGE)
// ==========================================
// ARCHITECTURE: Multi-page array rendering. Uses an internal pagination block (New vs Returning) combined with Global Tab Navigation.

const BOT_EMOJI = require('../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { SlashCommandBuilder } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { seasonEmojiFor, withCaptionEmoji } = require('../utils/seasonEmoji');
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
// 5, not 6, since 2026-10-24 21:40 EDT: the season subtitle got its own line beside the reminders bell (one more component), and Season 9's busiest Returning page then measured 39 of 40.
const CHUNK_SIZE = 5;
// 🔴 AND A SECOND CAP THE COUNT ABOVE NEVER SAW (2026-10-20, v3 sweep): Discord holds a message's Text Displays to 4,000 characters IN TOTAL (COMPONENT_DISPLAYABLE_TEXT_SIZE_EXCEEDED, probed 2026-10-16 -- .claude/rules/draw-prices.md; the calculator already budgets for it). Six draws fit the component cap at any size, but every item line carries a ~35-character custom emoji, so six draws of about nine items each pass 4,000 and the whole page fails to send. Pages now close at CHUNK_SIZE draws OR at this many characters of draw text, whichever comes first; the rest of the 4,000 is headroom for the title block. One draw that alone runs past it is trimmed with a "…and N more" line (buildDrawSections).
const DRAW_TEXT_BUDGET = 3400;

/**
 * Array Mapper: Converts raw database JSON into Discord V2 UI "Section Item Rows" (Type 9)
 */
function buildDrawSections(drawsArray) {
    const sections = [];
    drawsArray.forEach(draw => {
        // Resolve emoji tiers and title casing
        const itemLines = draw.items.map(item => {
            // "-# comment" items (2026-07-30 22:24 EDT, adminParser.js's parseItemLine) are a free- text note, not a real tiered item -- render as plain Discord subtext with no tier emoji/bold, matching how the admin typed it in.
            if (item.tier === 'comment') return `-# ${item.name}`;
            const emoji = emojis[item.tier.toLowerCase()] || '🔹';
            // Split once and reuse, instead of re-splitting the same string up to 3 times per item.
            const nameParts = item.name.split(' - ');
            return `${emoji} **${nameParts[0]}**${nameParts.length > 1 ? ` — ${nameParts[1]}` : ''}`;
        });

        const unixTime = Math.floor(new Date(draw.date).getTime() / 1000);
        // A draw saved with no date used to print a raw `<t:NaN:f>` (seen on a dev probe draw, 2026-10-20); it reads "Date TBA" instead.
        const dateLine = Number.isFinite(unixTime) ? `<t:${unixTime}:f> (<t:${unixTime}:R>)` : '*Date TBA*';

        // Relative timestamp added in brackets alongside the date, per redesign request. `f` (Long Date, Short Time) instead of `F` (Full Date, Short Time) — drops the day-of-week text, which was mostly just extra width for no real benefit here. Layout H (Harkirat, 2026-10-21 11:35 EDT, "yeah lets go H", picked from mock-ups A–H in #testing-spam): a `###` title, the date in a quote right under it, then the items with an em dash before the skin. The title used to be `**__bold underline__**` with the date last, and on a phone the draws ran together. The date keeps its time although it wraps on a phone: "I've actually seen people confused about the exact time something launches". `-#` on the date was tried and does nothing to a timestamp on mobile.
        const compose = (lines, hidden) => `### ${draw.title}\n> ${dateLine}\n${lines.join('\n')}${hidden ? `\n-# …and ${hidden} more` : ''}`;
        // A single draw too long for one page on its own drops item lines from the end until it fits (see DRAW_TEXT_BUDGET).
        let shown = itemLines;
        let textContent = compose(shown, 0);
        while (textContent.length > DRAW_TEXT_BUDGET && shown.length > 1) {
            shown = shown.slice(0, -1);
            textContent = compose(shown, itemLines.length - shown.length);
        }
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
            sections.push({ type: 10, content: `${textContent}\n-# *(no image)*` });
        }
    });
    return sections;
}

// The characters one draw adds to a page's Text Displays (its section's text, "(no image)" line included).
function drawTextLength(draw) {
    return buildDrawSections([draw]).reduce((n, s) => n + (s.type === 10 ? s.content : s.components[0].content).length, 0);
}

// Splits a category's draws into pages that respect BOTH caps -- CHUNK_SIZE draws (components) and DRAW_TEXT_BUDGET characters (text). Greedy and deterministic, so a `subpage_<category>_<n>` id names the same page on every render of the same data.
function paginateDraws(list) {
    const pages = [];
    let page = [], used = 0;
    for (const draw of list) {
        const len = drawTextLength(draw);
        if (page.length && (page.length >= CHUNK_SIZE || used + len > DRAW_TEXT_BUDGET)) {
            pages.push(page);
            page = [];
            used = 0;
        }
        page.push(draw);
        used += len;
    }
    if (page.length) pages.push(page);
    return pages.length ? pages : [[]];
}

// THE FILTER (2026-11-01, Harkirat: "I also want to implement a "Upcoming", "live", "leaving soon", "ended" filters on the /draws page; likely collapsing those + the new/returning draws toggle into a single multi select dropdown or a "filter" button. And expanding those filters to the slash command and text commands."). One multi-select under the pager replaces the New/Returning Draws button, the way /calendar's did on 2026-10-21. Its picks are a bit mask that rides in every custom_id, because nothing about the filter is saved:
//   - New / Returning decide which sections the pager walks (none picked = both, New first, as before);
//   - the four STATUS picks keep only the draws in those states (none picked = every draw). Live includes Leaving soon, which is the part of Live that ends within LEAVING_SOON_MS.
// A draw's state is /calendar's (entryState): its start is the draw's own date, its end the end date on its /calendar draw row, and with no row it has no end and is never Ended or Leaving soon.
const FILTER_OPTIONS = [
    { value: 'new', bit: 1, label: 'New Draws', emojiKey: 'newDraws', description: 'Released for the first time this season' },
    { value: 'returning', bit: 2, label: 'Returning Draws', emojiKey: 'returningDraws', description: 'Back from an earlier season' },
    { value: 'upcoming', bit: 4, label: 'Upcoming', emojiKey: 'lightBlueDotGlow', description: "Hasn't started yet" },
    { value: 'live', bit: 8, label: 'Live', emojiKey: 'greenDotGlow', description: 'Running right now' },
    { value: 'leaving', bit: 16, label: 'Leaving soon', emojiKey: 'yellowDotGlow', description: 'Live, and ends within 2 days' },
    { value: 'ended', bit: 32, label: 'Ended', emojiKey: 'redDotGlow', description: 'Already finished' }
];
const SECTION_BIT = { new: 1, returning: 2 };
const STATE_BITS = 4 | 8 | 16 | 32;
// /today's "Leaving soon" (commands/today.js ENDING_SOON_MS), so the two never disagree about the same draw.
const LEAVING_SOON_MS = 2 * 24 * 60 * 60 * 1000;

// Every way a filter arrives, as a mask: a number from a custom_id, or one slash/text `filter` value.
function filterMask(filter) {
    if (typeof filter === 'number' && Number.isFinite(filter)) return filter & 63;
    const opt = FILTER_OPTIONS.find(o => o.value === filter);
    return opt ? opt.bit : 0;
}

// The status bits one draw carries right now.
function drawStateBits(draw, seasonalDoc, nowMs = Date.now()) {
    const { entryState } = require('./calendar');
    const { calendarRowFor } = require('../utils/drawEndReminder');
    const row = calendarRowFor(seasonalDoc, draw.title);
    const event = row ? { date: draw.date, endDate: row.endDate, isOngoing: row.isOngoing } : { date: draw.date, dateOnly: true };
    const { state, endMs } = entryState(event, seasonalDoc, nowMs);
    if (state === 'over') return 32;
    if (state === 'live') return 8 | (Number.isFinite(endMs) && endMs - nowMs <= LEAVING_SOON_MS ? 16 : 0);
    return 4; // upcoming, or no date yet
}

// The filter dropdown. Its picks are its defaults, so the closed menu shows what is applied.
function buildFilterRow(mask) {
    return {
        type: 1,
        components: [{
            type: 3,
            custom_id: 'subpage_filter',
            placeholder: 'Filter draws...',
            min_values: 0,
            max_values: FILTER_OPTIONS.length,
            options: FILTER_OPTIONS.map(o => ({ label: o.label, value: o.value, description: o.description, emoji: emojis.parseEmoji(emojis[o.emojiKey]), default: Boolean(mask & o.bit) }))
        }]
    };
}

function buildContainer(seasonalDoc, page = 'new', subPage = 0, accentColor = PRESET_ACCENT, isEphemeral = false, filter = 0) {
    const seasonTitle = seasonalDoc.currentSeasonTitle || "Current Season";
    const mask = filterMask(filter);
    const states = mask & STATE_BITS;
    const nowMs = Date.now();
    const lists = {
        new: (seasonalDoc.newDraws || []).filter(d => !states || (drawStateBits(d, seasonalDoc, nowMs) & states)),
        returning: (seasonalDoc.returningDraws || []).filter(d => !states || (drawStateBits(d, seasonalDoc, nowMs) & states))
    };
    // The sections the pager walks: the picked ones, or both. Under a filter a section with nothing left is skipped, unless every one is empty.
    const picked = ['new', 'returning'].filter(k => !(mask & 3) || (mask & SECTION_BIT[k]));
    const walk = mask && picked.some(k => lists[k].length) ? picked.filter(k => lists[k].length) : picked;
    const categoryKey = walk.includes(page) ? page : walk[0];
    const isNewPage = categoryKey !== 'returning';

    const activeList = lists[categoryKey];

    // CHUNKING: Split the full list into safe-sized pages so we never exceed Discord's 40-component cap or its 4,000-character text cap (paginateDraws above)
    const pages = paginateDraws(activeList);
    const totalChunks = pages.length;
    const safeSubPage = Math.min(Math.max(0, subPage), totalChunks - 1);
    const chunk = pages[safeSubPage];

    // Two-line title (season title on top, command header below) — shared pattern, matches the calendar_update_ui.json redesign. See utils/titleBlock.js.
    const titleEmoji = isNewPage ? emojis.newDraws : emojis.returningDraws;
    const drawComponents = [
        // headingLevel 2 (`## `, was `# `) for design consistency with /draw prices' own drop -- 2026-07-12, Harkirat's request to keep all seasonal command titles at the same size. The season's emoji in front of the season title (2026-10-19 09:26 EDT, Harkirat), see utils/seasonEmoji.js. The reminders bell on the title (utils/reminders.js withBell).
        ...require('../utils/reminders').withBell(withCaptionEmoji(buildTitleBlock(seasonTitle, titleEmoji, isNewPage ? 'New Draws' : 'Returning Draws', 2), seasonEmojiFor(seasonalDoc.currentSeasonTitle, seasonalDoc.currentSeasonEmoji))),
        { type: 14, spacing: 2, divider: true } // Divider separating the title from the draws content
    ];

    // EMPTY STATE HANDLING: If DB array is empty, provide a clean text fallback instead of crashing
    if (activeList.length === 0) {
        drawComponents.push({
            type: 10,
            content: states
                ? `${emojis.warn} *No ${isNewPage ? 'new' : 'returning'} draws match the filter. Clear it to see every draw.*`
                : `*There are currently no ${isNewPage ? 'new' : 'returning'} draws scheduled for this season.*`
        });
    } else {
        drawComponents.push(...buildDrawSections(chunk));
    }

    // SUB-PAGE NAVIGATION: only shown when a category has more draws than fit on one page (buildPaginationRow returns null otherwise). Encodes the category + target chunk index directly in the custom_id (stateless), same pattern used by the DMZ loadout pagination elsewhere in this bot. Shared row builder (utils/paginationRow.js) keeps this visually identical to /calendar's own pagination. ONE PAGER FOR THE WHOLE COMMAND (2026-10-25 14:37-14:39 EDT, Harkirat's review): New's pages, then Returning's, looping, so page 1 is New Draws and 2 and 3 are Returning Draws' two pages. The middle names the section and counts every page ("New · 1/3", "Returning · 2/3", his "keep 1/3"), the way /calendar's "Events · 2/3" does. Each arrow's id still names its section and that section's page (`subpage_<new|returning>_<n>`), so handlers/pagination.js is unchanged. The New/Returning Draws button below stays. Under a filter the pager walks only the filtered draws of the sections the filter keeps, and its ids carry the mask (`subpage_<section>_<n>_m<mask>`); with no filter the ids are exactly the ones panels posted before it carry.
    const allPages = walk.flatMap(key => paginateDraws(lists[key]).map((_, sub) => ({ key, sub })));
    const here = Math.max(0, allPages.findIndex(p => p.key === categoryKey && p.sub === safeSubPage));
    const paginationRow = buildPaginationRow({
        totalChunks: allPages.length, currentPage: here,
        makeCustomId: (p) => `subpage_${allPages[p].key}_${allPages[p].sub}${mask ? `_m${mask}` : ''}`,
        indicatorCustomId: 'subpage_indicator',
        indicatorLabel: `${categoryKey === 'new' ? 'New' : 'Returning'} · ${here + 1}/${allPages.length}`
    });
    if (paginationRow) {
        drawComponents.push({ type: 14, spacing: 1, divider: false }); // Spacer only, no line
        drawComponents.push(paginationRow);
    }

    drawComponents.push({ type: 14, spacing: 2, divider: true }); // Divider before the filter
    drawComponents.push(buildFilterRow(mask));

    // PRICE THESE DRAWS (2026-10-21 10:14 EDT, Harkirat): Calculate opens /draw calculator's pick-your-draws pop-up (handlers/drawCalc.js `drawspick`), shown only when a draw this season has a price type. A `calc~` id with no author, so whoever presses it gets their own calculation. It shared a row with the New/Returning Draws toggle (CATEGORY TOGGLE, 2026-07-12: one button offering the OTHER section, sized so the pair never wrapped on his iPhone, his option D of 2026-10-21) until 2026-11-01, when the filter above replaced the toggle.
    const priced = [...(seasonalDoc.newDraws || []), ...(seasonalDoc.returningDraws || [])].some(d => d.priceType);
    const { encodeState } = require('./drawCalculator');
    // Its own row since the toggle went: one component more than the shared row, and the busiest page measured 37 of 40 after it. The toggle's ids (`page_new_draws`/`page_returning_draws`) still open their section on panels posted before (handlers/pagination.js).
    if (priced) {
        drawComponents.push({
            type: 1,
            components: [{ type: 2, style: 1, label: 'Calculate', emoji: emojis.parseEmoji(emojis.calculator), custom_id: encodeState('drawspick', {}) }]
        });
    }

    const containerPayload = {
        type: 17,
        accent_color: accentColor,
        components: drawComponents
    };

    // In a filtered view the footer's own Draws slot becomes a live blurple "All Draws" that clears the filter, as /calendar's "Full Calendar" does.
    const globalNavigationRow = mask
        ? buildGlobalNavRow('nav_draws', { nav_draws: { label: 'All Draws', custom_id: 'nav_draws', style: 1 } })
        : buildGlobalNavRow('nav_draws');

    return withShareButton([containerPayload, globalNavigationRow], isEphemeral);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('draws')
        // Trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) -- was truncating on mobile.
        .setDescription('View new and returning draws this season')
        .addStringOption(option => option.setName('page').setDescription('Jump directly to New Draws or Returning Draws').addChoices({ name: 'New Draws', value: 'new' }, { name: 'Returning Draws', value: 'returning' }))
        // One status to start with (2026-11-01); the dropdown on the panel picks several.
        .addStringOption(option => option.setName('filter').setDescription('Show only upcoming, live, leaving soon or ended draws').addChoices(
            { name: 'Upcoming', value: 'upcoming' }, { name: 'Live', value: 'live' }, { name: 'Leaving Soon', value: 'leaving' }, { name: 'Ended', value: 'ended' }
        ))
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    buildContainer,
    filterMask,
    drawStateBits,
    FILTER_OPTIONS,
    // Exported 2026-08-23 10:56 EDT so /bot analytics' change-detail panel can render a draw with the SAME code players see, instead of hand-describing its fields. Copying the body instead would let the two drift, and a panel that quietly stops matching the real card is worse than one that never tried.
    buildDrawSections,
    // Exported for scripts/sweepFixes.test.js.
    paginateDraws,
    DRAW_TEXT_BUDGET,

    // filterOverride: the filter mask a pager button or the filter dropdown carries; a slash `filter` wins.
    async execute(interaction, pageOverride = null, subPageOverride = 0, filterOverride = 0) {
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
            const filterChoice = interaction.options.getString('filter');
            if (filterChoice) filterOverride = filterMask(filterChoice);
        }

        // NOTE: switched from the old per-command `drawsVisibility` field to the shared `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in /settings (Option A).
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });
        if (!interaction.deferred) {
            await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        }

        const seasonalDoc = await seasonalDocPromise;
        if (!seasonalDoc) {
            return require('../utils/ephemeral').privateNotice(interaction, BOT_EMOJI.cross + ' The global seasonal database document has not been initialized yet.');
        }

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(seasonalDoc, activePage, subPageOverride, accentColor, isEphemeral, filterOverride);

        return await sendV2Payload(interaction, components);
    }
};