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
const { emptyNote } = require('../utils/emptyNote');

// Repalette (2026-07-12, Section 5 of the batch) -- see calendar.js's matching comment for the full nav-row hue-spread reasoning. A dustier, lighter plum than the "Field Ops" alternative Harkirat considered, to stay in the same refined register as Calendar's blue and Season End's amber rather than mixing in a grittier tone.
const PRESET_ACCENT = 7032445; // Plum Fortune (#6B4E7D) — 2nd nav button (Draws)

// DISCORD HARD LIMIT: a message can contain at most 40 total components, counted recursively (containers, sections, text blocks, buttons, thumbnails — everything nested inside everything). Each draw entry costs 3 components (the Section wrapper + its Text Display + its Thumbnail accessory). With bulk-imported seasons easily hitting 10+ draws in one category, showing them all in one page blew past the ceiling and crashed with COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED. CHUNK_SIZE chosen conservatively below the theoretical max to leave headroom. Worst case with the redesigned layout (title+divider, draws, spacer+subpage row, divider, 2-button category row):
//   container(1) + header(1) + divider(1) + CHUNK_SIZE*3(draws) + spacer(1) + subPageRow(1+3)
//   + divider(1) + categoryRow(1+2) = 30, + globalNavRow(1+5) = 36 total — still under 40.
// 5, not 6, since 2026-10-24 21:40 EDT: the season subtitle got its own line beside the reminders bell (one more component), and Season 9's busiest Returning page then measured 39 of 40.
const CHUNK_SIZE = 5;
// 🔴 AND A SECOND CAP THE COUNT ABOVE NEVER SAW (2026-10-20, v3 sweep): Discord holds a message's Text Displays to 4,000 characters IN TOTAL (COMPONENT_DISPLAYABLE_TEXT_SIZE_EXCEEDED, probed 2026-10-16 -- .claude/rules/draw-prices.md; the calculator already budgets for it). Six draws fit the component cap at any size, but every item line carries a ~35-character custom emoji, so six draws of about nine items each pass 4,000 and the whole page fails to send. Pages now close at CHUNK_SIZE draws OR at this many characters of draw text, whichever comes first; the rest of the 4,000 is headroom for the title block. One draw that alone runs past it is trimmed with a "…and N more" line (buildDrawSections).
const DRAW_TEXT_BUDGET = 3400;

// THE DATE LINES (2026-11-01 13:16 EDT, Harkirat: "a user might not understand what that "x days ago" means. Did it end x days ago? did it start x days ago?" and "consider the light blue, green, red, yellow dots infront of the timestamp"). Redesigned to his exact template at 13:54 EDT: small text, the state's dot and a relative line on top (/today's colours: light blue upcoming, green live, yellow leaving soon = live and ending within LEAVING_SOON_MS, red ended), and the one date that matters under it, padded with the `blank` emoji so it lines up after the dot:
//   upcoming      Releasing in 6 hours              / its start date
//   live          Live · Ends in 16 days             / its end date (13:03 EDT: "Live 13 days ago · Ends in 16 days" wrapped on his phone, so the start's relative went)
//   leaving soon  Ending in 2 days                   / its end date
//   ended         Ended 5 days ago                   (no date line)
// The state words are bold (his ask, 13:03 EDT). A live draw with no end on its /calendar row reads "Live · since 13 days ago" over its start date (my call; his template only shows one with an end). The long `f` date is his pick of three (13:18 EDT): Discord has no "Oct 29" style.
function drawDateLines(draw, ctx = {}) {
    const { state, startMs, endMs, bits } = drawTiming(draw, ctx.seasonalDoc || {}, ctx.nowMs ?? Date.now());
    // A draw saved with no date used to print a raw `<t:NaN:f>` (seen on a dev probe draw, 2026-10-20); it reads "Date TBA" instead.
    if (state === 'tba') return '> -# *Date TBA*';
    const u = ms => Math.floor(ms / 1000);
    const rel = ms => `<t:${u(ms)}:R>`;
    const date = ms => `${emojis.blank} <t:${u(ms)}:f>`;
    const hasEnd = Number.isFinite(endMs);
    let lines;
    if (state === 'over') lines = [`${emojis.redDotGlow} **Ended** ${rel(endMs)}`];
    else if (state === 'soon') lines = [`${emojis.lightBlueDotGlow} **Releasing** ${rel(startMs)}`, date(startMs)];
    else {
        // A draw on since before this season began says so on the top line, in place of Live, and the end moves down a line (his layout, 14:48 EDT: "move it to the timestamps top line ':dot: ongoing since season 8' and remove the 'active' and then push 'ends in' to the 2nd line. The full timestamp to 3rd line"). Leaving soon keeps its yellow dot and its Ending.
        const from = carriedFromSeason(draw, ctx.seasonalDoc);
        const dot = bits & 16 ? emojis.yellowDotGlow : emojis.greenDotGlow;
        if (from) lines = [`${dot} **Ongoing** since ${from}`, ...(hasEnd ? [`${emojis.blank} **${bits & 16 ? 'Ending' : 'Ends'}** ${rel(endMs)}`, date(endMs)] : [date(startMs)])];
        else if (bits & 16) lines = [`${emojis.yellowDotGlow} **Ending** ${rel(endMs)}`, date(endMs)];
        // Live, not Active (14:55 EDT, his: "the main heading is 'active now' and the adjective is 'live'").
        else lines = hasEnd ? [`${emojis.greenDotGlow} **Live** · **Ends** ${rel(endMs)}`, date(endMs)] : [`${emojis.greenDotGlow} **Live** · since ${rel(startMs)}`, date(startMs)];
    }
    return lines.map(l => `> -# ${l}`).join('\n');
}

/**
 * Array Mapper: Converts raw database JSON into Discord V2 UI "Section Item Rows" (Type 9)
 */
// The season a draw that started before this one began came from (2026-11-01 14:36 EDT, Harkirat: an "on going" draw like Herrscher's Armory, active since last season; he picked "New Draws, tagged by season", and 14:37 EDT the same for a Returning draw). The test is the draw's start date against this season's start, the Battle Pass start (`bpStart`, "The BP start/end is the season start/end"), so it needs no draw index and works in both sections. The season is the past patch-notes entry whose dates hold the start, else the one before the current season; null when either date is missing or the draw started this season.
function carriedFromSeason(draw, seasonalDoc) {
    const start = draw?.date ? new Date(draw.date).getTime() : NaN;
    const seasonStart = seasonalDoc?.bpStart ? new Date(seasonalDoc.bpStart).getTime() : NaN;
    if (!Number.isFinite(start) || !Number.isFinite(seasonStart) || start >= seasonStart) return null;
    const num = t => { const m = /season\s*(\d+)/i.exec(String(t || '')); return m ? Number(m[1]) : null; };
    const held = (seasonalDoc.patchNotes || []).find(e => e.seasonStart && e.seasonEnd && new Date(e.seasonStart).getTime() <= start && start < new Date(e.seasonEnd).getTime());
    const n = num(held?.titleOverride || held?.title) ?? (num(seasonalDoc.currentSeasonTitle) > 1 ? num(seasonalDoc.currentSeasonTitle) - 1 : null);
    return n ? `Season ${n}` : 'last season';
}

// ctx: { seasonalDoc, nowMs } -- the season (for each draw's /calendar end date and its Ongoing since line) and the clock. A caller with no season (/bot analytics' change detail) still gets a labelled start line.
function buildDrawSections(drawsArray, ctx = {}) {
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

        const dateLine = drawDateLines(draw, ctx);
        // No "New draw" line under a title in the filtered list (14:46 EDT, his "remove the new draw/returning draw from it"). A draw on since last season says so in its date lines (drawDateLines).

        // Relative timestamp added in brackets alongside the date, per redesign request. `f` (Long Date, Short Time) instead of `F` (Full Date, Short Time) — drops the day-of-week text, which was mostly just extra width for no real benefit here. Layout H (Harkirat, 2026-10-21 11:35 EDT, "yeah lets go H", picked from mock-ups A–H in #testing-spam): a `###` title, the date in a quote right under it, then the items with an em dash before the skin. The title used to be `**__bold underline__**` with the date last, and on a phone the draws ran together. The date keeps its time although it wraps on a phone: "I've actually seen people confused about the exact time something launches". `-#` on the date was tried and does nothing to a timestamp on mobile.
        const compose = (lines, hidden) => `### ${draw.title}\n${dateLine}\n${lines.join('\n')}${hidden ? `\n-# …and ${hidden} more` : ''}`;
        // A single draw too long for one page on its own drops item lines from the end until it fits (see DRAW_TEXT_BUDGET).
        let shown = itemLines;
        let textContent = compose(shown, 0);
        while (textContent.length > DRAW_TEXT_BUDGET && shown.length > 1) {
            shown = shown.slice(0, -1);
            textContent = compose(shown, itemLines.length - shown.length);
        }
        // A draw with no picture (allowed since 2026-08-22 19:40 EDT) shows Harkirat's "No image yet" placeholder (2026-11-08 11:45 EST), so every draw block has the same shape; it used to be a bare Text Display ending "(no image)", because a Section needs an accessory and a thumbnail cannot point at nothing.
        sections.push({
            type: 9,
            components: [{ type: 10, content: textContent }],
            accessory: {
                type: 11, // Attaches Thumbnail natively to the right side of the block
                media: { url: draw.thumbnailUrl || require('../utils/placeholders').PLACEHOLDER.square }
            }
        });
    });
    return sections;
}

// The characters one draw adds to a page's Text Displays (its section's text, "(no image)" line included).
function drawTextLength(draw, ctx = {}) {
    return buildDrawSections([draw], ctx).reduce((n, s) => n + (s.type === 10 ? s.content : s.components[0].content).length, 0);
}

// Splits a category's draws into pages that respect BOTH caps -- CHUNK_SIZE draws (components) and DRAW_TEXT_BUDGET characters (text). Greedy and deterministic, so a `subpage_<category>_<n>` id names the same page on every render of the same data. `size` is the most draws a page holds (the filtered list's group headings take components, so it passes a smaller one).
function paginateDraws(list, ctx = {}, size = CHUNK_SIZE) {
    const pages = [];
    let page = [], used = 0;
    for (const draw of list) {
        const len = drawTextLength(draw, ctx);
        if (page.length && (page.length >= size || used + len > DRAW_TEXT_BUDGET)) {
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
    // Active now, not Live (14:54 EDT, his "class not instance!!" after the heading took /calendar's Today word at 14:51): the menu, the slash choice and the help say what the heading says. The value stays `live` so posted panels and `d draws live` keep working.
    { value: 'live', bit: 8, label: 'Active now', emojiKey: 'greenDotGlow', description: 'Live in the game right now' },
    { value: 'leaving', bit: 16, label: 'Leaving soon', emojiKey: 'yellowDotGlow', description: 'Live, and ends within 3 days' },
    { value: 'ended', bit: 32, label: 'Ended', emojiKey: 'redDotGlow', description: 'Already finished' }
];
const SECTION_BIT = { new: 1, returning: 2 };
const STATE_BITS = 4 | 8 | 16 | 32;
// 3 days, Harkirat's call for /draws (2026-11-01 11:50 EDT, "for /draws, we'll consider the last 3"). /today's own "Leaving soon" (commands/today.js ENDING_SOON_MS) stays at 2 days on purpose: it is a daily digest.
const LEAVING_SOON_MS = 3 * 24 * 60 * 60 * 1000;

// Every way a filter arrives, as a mask: a number from a custom_id, or one slash/text `filter` value.
function filterMask(filter) {
    if (typeof filter === 'number' && Number.isFinite(filter)) return filter & 63;
    const opt = FILTER_OPTIONS.find(o => o.value === filter);
    return opt ? opt.bit : 0;
}

// One draw right now: its /calendar state, start and end, and its status bits (FILTER_OPTIONS). Upcoming and no-date-yet both carry Upcoming's bit.
function drawTiming(draw, seasonalDoc, nowMs = Date.now()) {
    const { entryState } = require('./calendar');
    const { calendarRowFor } = require('../utils/drawEndReminder');
    const row = calendarRowFor(seasonalDoc, draw.title);
    const event = row ? { date: draw.date, endDate: row.endDate, isOngoing: row.isOngoing } : { date: draw.date, dateOnly: true };
    const { state, startMs, endMs } = entryState(event, seasonalDoc, nowMs);
    const bits = state === 'over' ? 32
        : state === 'live' ? 8 | (Number.isFinite(endMs) && endMs - nowMs <= LEAVING_SOON_MS ? 16 : 0)
        : 4;
    return { state, startMs, endMs, bits };
}

// The status bits one draw carries right now.
function drawStateBits(draw, seasonalDoc, nowMs = Date.now()) {
    return drawTiming(draw, seasonalDoc, nowMs).bits;
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

// THE FILTERED LIST (2026-11-01 13:16 EDT, Harkirat: "when a view is filtered along with a live, leaving, upcoming, or ended filter, why don't we present it as a collective list with heads for "live", etc similar to /today?"). With a status picked, the draws of the sections the filter keeps are one list under /today's headings and colours, in this order. Leaving soon is the part of Live that ends within LEAVING_SOON_MS, so a draw sits under one heading only, and Live picked alone still shows its Leaving soon draws (Live includes them, FILTER_OPTIONS). The headings are /calendar's Today page's (14:51 EDT, his "the headings should match /calendar and /today"): Active now, not Live. `word` keeps the count line's "live" from his 13:54 EDT template.
const STATUS_GROUPS = [
    { key: 'live', label: 'Active now', word: 'live', emojiKey: 'greenDotGlow', holds: b => (b & 8) && !(b & 16), order: (a, b) => a.startMs - b.startMs },
    { key: 'leaving', label: 'Leaving soon', emojiKey: 'yellowDotGlow', holds: b => b & 16, order: (a, b) => a.endMs - b.endMs },
    { key: 'upcoming', label: 'Upcoming', emojiKey: 'lightBlueDotGlow', holds: b => b & 4, order: (a, b) => (a.startMs || Infinity) - (b.startMs || Infinity) },
    { key: 'ended', label: 'Ended', emojiKey: 'redDotGlow', holds: b => b & 32, order: (a, b) => b.endMs - a.endMs }
];
// The filtered list's page size: one heading per group on a page costs a component each, so it holds one draw fewer than CHUNK_SIZE. Measured by scripts/drawsFilter.test.js's worst case (every group on one page, a note, Reset and Calculate) under 40.
const FILTERED_CHUNK = CHUNK_SIZE - 1;

function buildContainer(seasonalDoc, page = 'new', subPage = 0, accentColor = PRESET_ACCENT, isEphemeral = false, filter = 0) {
    const seasonTitle = seasonalDoc.currentSeasonTitle || "Current Season";
    const mask = filterMask(filter);
    const states = mask & STATE_BITS;
    const nowMs = Date.now();
    const ctx = { seasonalDoc, nowMs };
    // In release order (utils/drawDates.js byRelease, 2026-11-08 12:18 EST): the stored order is the paste order, which is not the order players should read.
    const timed = (key) => require('../utils/drawDates').byRelease(seasonalDoc[key === 'new' ? 'newDraws' : 'returningDraws']).map(d => ({ ...d, _section: key, ...drawTiming(d, seasonalDoc, nowMs) }));
    const lists = {
        new: timed('new').filter(d => !states || (d.bits & states)),
        returning: timed('returning').filter(d => !states || (d.bits & states))
    };
    // The sections the filter keeps: the picked ones, or both.
    const picked = ['new', 'returning'].filter(k => !(mask & 3) || (mask & SECTION_BIT[k]));
    const anyShown = picked.some(k => lists[k].length);
    // A picked section with nothing in it no longer gets a page of its own (2026-11-01 13:16 EDT, Harkirat: "why not just show the returning draws page directly and then have a divided section at the top that states "No New Draws match this filter." instead of a WHOLE empty page?"). Only a section he picked by name, and only while the other one has draws. Worded to his template (13:54 EDT): the warning, then a small line with where that section's draws stand right now, so the reader knows what to pick instead. utils/emptyNote.js, his wording (13:54 and 14:05 EDT): the warning, then where that section's draws stand right now.
    const SECTION_NAME = { new: 'New Draws', returning: 'Returning Draws' };
    const sectionNote = (k) => {
        const all = timed(k);
        const counts = STATUS_GROUPS.map(g => ({ emojiKey: g.emojiKey, label: g.word || g.label.toLowerCase(), n: all.filter(d => g.holds(d.bits)).length }));
        return emptyNote({ label: SECTION_NAME[k], emoji: emojis[k === 'new' ? 'newDraws' : 'returningDraws'], counts, filtered: Boolean(mask) && all.length > 0 });
    };
    // Which empty sections get a line at the top: one picked by name under a filter, and, with no filter, a section with no draws at all (it used to get a whole page saying so, the same empty page he asked to retire, 14:32 EDT: "Work the class!"). With nothing to show anywhere, every kept section's line is the page.
    const notes = picked.filter(k => !lists[k].length && (!anyShown || !mask || (mask & SECTION_BIT[k]))).map(sectionNote);

    let titleEmoji, titleLabel, body, pager;
    if (states) {
        // One list across the kept sections, grouped by state.
        const all = picked.flatMap(k => lists[k]);
        const flat = STATUS_GROUPS.flatMap(g => all.filter(d => g.holds(d.bits)).sort(g.order).map(d => ({ ...d, _group: g })));
        const pages = paginateDraws(flat, ctx, FILTERED_CHUNK);
        const at = Math.min(Math.max(0, subPage), pages.length - 1);
        const chunk = pages[at];
        const onlyOne = picked.length === 1 ? picked[0] : null;
        // Both sections: ":Filter: Filtered Draws" (his wording, 14:07 EDT, "Viewing Filtered Draws"; shortened 14:51 EDT so it fits one line on his phone beside the bell, his ask); one section keeps its own name and icon.
        titleEmoji = onlyOne === 'returning' ? emojis.returningDraws : onlyOne === 'new' ? emojis.newDraws : emojis.filter;
        titleLabel = onlyOne === 'new' ? 'New Draws' : onlyOne === 'returning' ? 'Returning Draws' : 'Filtered Draws';
        body = [];
        let group = null;
        for (const d of chunk) {
            if (d._group !== group) { group = d._group; body.push({ type: 10, content: `## ${emojis[group.emojiKey]} ${group.label}` }); }
            body.push(...buildDrawSections([d], ctx));
        }
        pager = buildPaginationRow({
            totalChunks: pages.length, currentPage: at,
            // The section in the id is a placeholder: handlers/pagination.js reads the page number and the mask, and the filtered list ignores the section.
            makeCustomId: (p) => `subpage_new_${p}_m${mask}`,
            indicatorCustomId: 'subpage_indicator',
            indicatorLabel: `${chunk[0]?._group.label || 'Filtered'} · ${at + 1}/${pages.length}`
        });
    } else {
        // A section with nothing in it is skipped (its line sits at the top instead), unless every one is empty.
        const walk = anyShown ? picked.filter(k => lists[k].length) : picked;
        const categoryKey = walk.includes(page) ? page : walk[0];
        const isNewPage = categoryKey !== 'returning';
        const activeList = lists[categoryKey];
        // CHUNKING: Split the full list into safe-sized pages so we never exceed Discord's 40-component cap or its 4,000-character text cap (paginateDraws above) The note above takes two components, so its pages hold one draw fewer (measured 40 of 40 without, scripts/drawsFilter.test.js).
        const size = notes.length ? CHUNK_SIZE - 1 : CHUNK_SIZE;
        const pages = paginateDraws(activeList, ctx, size);
        const safeSubPage = Math.min(Math.max(0, subPage), pages.length - 1);
        titleEmoji = isNewPage ? emojis.newDraws : emojis.returningDraws;
        titleLabel = isNewPage ? 'New Draws' : 'Returning Draws';
        // Nothing anywhere: the notes above are the whole page.
        body = activeList.length ? buildDrawSections(pages[safeSubPage], ctx) : [];
        // SUB-PAGE NAVIGATION: only shown when a category has more draws than fit on one page (buildPaginationRow returns null otherwise). Encodes the category + target chunk index directly in the custom_id (stateless), same pattern used by the DMZ loadout pagination elsewhere in this bot. Shared row builder (utils/paginationRow.js) keeps this visually identical to /calendar's own pagination. ONE PAGER FOR THE WHOLE COMMAND (2026-10-25 14:37-14:39 EDT, Harkirat's review): New's pages, then Returning's, looping, so page 1 is New Draws and 2 and 3 are Returning Draws' two pages. The middle names the section and counts every page ("New · 1/3", "Returning · 2/3", his "keep 1/3"), the way /calendar's "Events · 2/3" does. Each arrow's id still names its section and that section's page (`subpage_<new|returning>_<n>`), so handlers/pagination.js is unchanged. Under a section filter the pager walks only the sections the filter keeps, and its ids carry the mask (`subpage_<section>_<n>_m<mask>`); with no filter the ids are exactly the ones panels posted before it carry.
        const allPages = walk.flatMap(key => paginateDraws(lists[key], ctx, size).map((_, sub) => ({ key, sub })));
        const here = Math.max(0, allPages.findIndex(p => p.key === categoryKey && p.sub === safeSubPage));
        pager = buildPaginationRow({
            totalChunks: allPages.length, currentPage: here,
            makeCustomId: (p) => `subpage_${allPages[p].key}_${allPages[p].sub}${mask ? `_m${mask}` : ''}`,
            indicatorCustomId: 'subpage_indicator',
            indicatorLabel: `${categoryKey === 'new' ? 'New' : 'Returning'} · ${here + 1}/${allPages.length}`
        });
    }

    const drawComponents = [
        // headingLevel 2 (`## `, was `# `) for design consistency with /draw prices' own drop -- 2026-07-12, Harkirat's request to keep all seasonal command titles at the same size. The season's emoji in front of the season title (2026-10-19 09:26 EDT, Harkirat), see utils/seasonEmoji.js. The reminders bell on the title (utils/reminders.js withBell).
        ...require('../utils/reminders').withBell(withCaptionEmoji(buildTitleBlock(seasonTitle, titleEmoji, titleLabel, 2), seasonEmojiFor(seasonalDoc.currentSeasonTitle, seasonalDoc.currentSeasonEmoji))),
        { type: 14, spacing: 2, divider: true }, // Divider separating the title from the draws content
        // The empty picked section's line, in its own block above the draws with a line under it.
        ...(notes.length ? [{ type: 10, content: notes.join('\n') }, ...(body.length ? [{ type: 14, spacing: 1, divider: true }] : [])] : []),
        ...body
    ];
    if (pager) {
        drawComponents.push({ type: 14, spacing: 1, divider: false }); // Spacer only, no line
        drawComponents.push(pager);
    }

    drawComponents.push({ type: 14, spacing: 2, divider: true }); // Divider before the filter
    drawComponents.push(buildFilterRow(mask));

    // PRICE THESE DRAWS (2026-10-21 10:14 EDT, Harkirat): Calculate opens /draw calculator's pick-your-draws pop-up (handlers/drawCalc.js `drawspick`), shown only when a draw this season has a price type. A `calc~` id with no author, so whoever presses it gets their own calculation. It shared a row with the New/Returning Draws toggle (CATEGORY TOGGLE, 2026-07-12: one button offering the OTHER section, sized so the pair never wrapped on his iPhone, his option D of 2026-10-21) until 2026-11-01, when the filter above replaced the toggle.
    const priced = [...(seasonalDoc.newDraws || []), ...(seasonalDoc.returningDraws || [])].some(d => d.priceType);
    const { encodeState } = require('./drawCalculator');
    // RESET FILTER (2026-11-01 13:16 EDT, Harkirat: "when any filter is selected, show a "Reset filter" button to the left of calculate with the "Return" emoji. which wipes the filters and takes you back to the normal /draws view"). `subpage_reset` in handlers/pagination.js; the footer's All Draws does the same, but sits far from the dropdown.
    const actions = [
        ...(mask ? [{ type: 2, style: 2, label: 'Reset Filter', emoji: emojis.parseEmoji(emojis.returnArrow), custom_id: 'subpage_reset' }] : []),
        ...(priced ? [{ type: 2, style: 1, label: 'Calculate', emoji: emojis.parseEmoji(emojis.calculator), custom_id: encodeState('drawspick', {}) }] : [])
    ];
    // Its own row since the toggle went. The toggle's ids (`page_new_draws`/`page_returning_draws`) still open their section on panels posted before (handlers/pagination.js).
    if (actions.length) drawComponents.push({ type: 1, components: actions });

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
        .addStringOption(option => option.setName('filter').setDescription('Show only upcoming, active, leaving soon or ended draws').addChoices(
            { name: 'Upcoming', value: 'upcoming' }, { name: 'Active Now', value: 'live' }, { name: 'Leaving Soon', value: 'leaving' }, { name: 'Ended', value: 'ended' }
        ))
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    buildContainer,
    filterMask,
    drawStateBits,
    drawTiming,
    drawDateLines,
    carriedFromSeason,
    FILTER_OPTIONS,
    STATUS_GROUPS,
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