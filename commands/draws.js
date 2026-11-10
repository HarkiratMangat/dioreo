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
// One line per item: its tier emoji, the weapon in bold, then the skin. Shared by the list's draw blocks and the single-draw panel (buildDrawPanel).
function drawItemLines(draw) {
    return (draw.items || []).map(item => {
        // "-# comment" items (2026-07-30 22:24 EDT, adminParser.js's parseItemLine) are a free- text note, not a real tiered item -- render as plain Discord subtext with no tier emoji/bold, matching how the admin typed it in.
        if (item.tier === 'comment') return `-# ${item.name}`;
        const emoji = emojis[String(item.tier || '').toLowerCase()] || '🔹';
        // Split once and reuse, instead of re-splitting the same string up to 3 times per item.
        const nameParts = String(item.name || '').split(' - ');
        return `${emoji} **${nameParts[0]}**${nameParts.length > 1 ? ` — ${nameParts[1]}` : ''}`;
    });
}

function buildDrawSections(drawsArray, ctx = {}) {
    const sections = [];
    drawsArray.forEach(draw => {
        const itemLines = drawItemLines(draw);

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
    if (typeof filter === 'number' && Number.isFinite(filter)) return filter & MASK_ALL;
    const opt = FILTER_OPTIONS.find(o => o.value === filter);
    return opt ? opt.bit : 0;
}

// THE FILTER FORM (2026-11-10, Harkirat: "i also want a form for the /draws filter since there's currently 5 pages of draws. with the filters expanded as well for better searching."). The Filter button opens a pop-up of checkboxes (utils/formChoice.js) whose picks extend the mask above: the six FILTER_OPTIONS bits, then rarity (a draw with at least one item of a ticked tier) and draw type (read off its price type's name, utils/drawTypes.js; a draw with no type is read off its title). A text search over the title and the item names rides beside the mask as `_q<text>` (encodeQuery). Within one group, ticks widen (any of them); across groups they narrow (all of them), as the status picks always have.
const RARITY_OPTIONS = [
    { value: 'mythic', bit: 64, label: 'Mythic', description: 'Has a Mythic item' },
    { value: 'legendary', bit: 128, label: 'Legendary', description: 'Has a Legendary item' },
    { value: 'epic', bit: 256, label: 'Epic', description: 'Has an Epic item' }
];
const KIND_OPTIONS = [
    { value: 'weapon', bit: 512, label: 'Weapon draws', description: 'A weapon is the prize' },
    { value: 'character', bit: 1024, label: 'Character draws', description: 'An operator is the prize' },
    { value: 'armory', bit: 2048, label: 'Series Armories', description: 'Armory draws' }
];
const RARITY_BITS = 64 | 128 | 256;
const KIND_BITS = 512 | 1024 | 2048;
const MASK_ALL = 4095;
// The search's most characters in a custom_id once encoded (encodeQuery): the longest id that carries it, `subpage_one_<n>~returning_<n>_m4095_q…`, stays under Discord's 100.
const QUERY_ID_MAX = 44;

function drawRarityBits(draw) {
    return RARITY_OPTIONS.reduce((m, o) => ((draw.items || []).some(i => String(i.tier || '').toLowerCase() === o.value) ? m | o.bit : m), 0);
}
function drawKindBits(draw) {
    const name = require('../utils/drawTypes').drawTypeName(draw.priceType);
    const text = name && draw.priceType !== 'unknown' ? name : String(draw.title || '');
    let bits = 0;
    if (/armou?ry/i.test(text)) bits |= 2048;
    if (/character|operator/i.test(text)) bits |= 1024;
    if (/weapon|gun/i.test(text)) bits |= 512;
    // A title that names neither (most draws are a weapon's) counts as a weapon draw.
    if (!(bits & (512 | 1024)) && !(bits & 2048)) bits |= 512;
    return bits;
}
function drawMatches(draw, mask, query) {
    const r = mask & RARITY_BITS;
    if (r && !(drawRarityBits(draw) & r)) return false;
    const k = mask & KIND_BITS;
    if (k && !(drawKindBits(draw) & k)) return false;
    if (query) {
        const { fuzzyMatch } = require('../utils/search');
        if (![draw.title, ...(draw.items || []).map(i => i.name)].some(n => fuzzyMatch(query, String(n || '')))) return false;
    }
    return true;
}

// The search in a custom_id: no `_` (the id's own separator) and no `~`, spaces as `+`, cut to QUERY_ID_MAX.
function encodeQuery(query) {
    let q = String(query || '').trim();
    const enc = t => encodeURIComponent(t).replace(/_/g, '%5F').replace(/~/g, '%7E').replace(/%20/g, '+');
    while (q && enc(q).length > QUERY_ID_MAX) q = q.slice(0, -1);
    return enc(q);
}
function decodeQuery(raw) {
    try { return decodeURIComponent(String(raw || '').replace(/\+/g, ' ')).trim(); } catch { return ''; }
}
// What a pager id carries after the section and page: `_m<mask>` and `_q<search>`, each only when set.
function filterSuffix(mask, query) {
    return `${mask ? `_m${mask}` : ''}${query ? `_q${encodeQuery(query)}` : ''}`;
}
// The mask and search out of any /draws id (handlers/pagination.js).
function parseFilterSuffix(customId) {
    const id = String(customId || '');
    const m = /_m(\d+)(?=_q|$)/.exec(id);
    const q = /_q([^_~]*)$/.exec(id);
    return { mask: m ? filterMask(Number(m[1])) : 0, query: q ? decodeQuery(q[1]) : '' };
}

// Every draw this season in one list, New then Returning, each in release order: the single-draw panel's numbering.
function allDraws(seasonalDoc) {
    const { byRelease } = require('../utils/drawDates');
    return [
        ...byRelease(seasonalDoc.newDraws || []).map(d => ({ ...d, _section: 'new' })),
        ...byRelease(seasonalDoc.returningDraws || []).map(d => ({ ...d, _section: 'returning' }))
    ];
}
// A draw by its title: exact first (case aside), then the first whose title holds what was typed.
function findDrawIndex(seasonalDoc, title) {
    const list = allDraws(seasonalDoc);
    const want = String(title || '').trim().toLowerCase();
    if (!want) return -1;
    const exact = list.findIndex(d => String(d.title || '').toLowerCase() === want);
    if (exact >= 0) return exact;
    const { fuzzyMatch } = require('../utils/search');
    return list.findIndex(d => fuzzyMatch(want, String(d.title || '')));
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

// The filter dropdown (`subpage_filter`, 2026-11-01) was retired 2026-11-10 for the Filter button and its pop-up below; handlers/pagination.js still reads it on panels posted before.

// The Filter pop-up, its boxes ticked as the panel stands. Its submit (`subpage_filterm`, handlers/pagination.js) reads them back through readFilterModal.
function buildFilterModal(mask = 0, query = '') {
    const { choiceField } = require('../utils/formChoice');
    const opt = list => list.map(o => ({ label: o.label, value: o.value, description: o.description, ...(mask & o.bit ? { default: true } : {}) }));
    return {
        custom_id: 'subpage_filterm',
        title: 'Filter Draws',
        components: [
            choiceField({ id: 'section', label: 'Sections', description: 'Tick none to show both', options: opt(FILTER_OPTIONS.slice(0, 2)), multi: true, required: false }),
            choiceField({ id: 'status', label: 'Status', description: 'Tick none to show every status', options: opt(FILTER_OPTIONS.slice(2)), multi: true, required: false }),
            choiceField({ id: 'rarity', label: 'Rarity', description: 'Draws with an item of a ticked rarity', options: opt(RARITY_OPTIONS), multi: true, required: false }),
            choiceField({ id: 'kind', label: 'Draw type', options: opt(KIND_OPTIONS), multi: true, required: false }),
            { type: 18, label: 'Search', description: 'Words in a draw title or item name', component: { type: 4, custom_id: 'query', style: 1, required: false, max_length: 40, placeholder: 'e.g. Jupiter or AK117', ...(query ? { value: String(query).slice(0, 40) } : {}) } }
        ]
    };
}
function readFilterModal(interaction) {
    const { readChoice } = require('../utils/formChoice');
    const all = [...FILTER_OPTIONS, ...RARITY_OPTIONS, ...KIND_OPTIONS];
    let mask = 0;
    for (const id of ['section', 'status', 'rarity', 'kind']) {
        for (const v of readChoice(interaction, id)) mask |= (all.find(o => o.value === v)?.bit || 0);
    }
    let query = '';
    try { query = String(interaction.fields.getTextInputValue('query') || '').trim(); } catch { query = ''; }
    return { mask: filterMask(mask), query };
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

// The Open a draw… menu: the draws `kept`, the ones on this page first. Each value is the draw's place in allDraws.
function buildOpenRow(seasonalDoc, kept, onPage, originId) {
    if (!kept.length || !originId) return null;
    const all = allDraws(seasonalDoc);
    const indexOf = d => {
        const byId = d._id !== undefined ? all.findIndex(x => String(x._id) === String(d._id) && x._section === d._section) : -1;
        return byId >= 0 ? byId : all.findIndex(x => x.title === d.title && x._section === d._section);
    };
    const seen = new Set();
    const ordered = [...onPage, ...kept].filter(d => { const i = indexOf(d); if (i < 0 || seen.has(i)) return false; seen.add(i); return true; }).slice(0, 25);
    if (!ordered.length) return null;
    const dot = { 4: 'lightBlueDotGlow', 8: 'greenDotGlow', 16: 'yellowDotGlow', 32: 'redDotGlow' };
    const word = { 4: 'Upcoming', 8: 'Active now', 16: 'Leaving soon', 32: 'Ended' };
    const top = b => (b & 16 ? 16 : b & 8 ? 8 : b & 32 ? 32 : 4);
    return {
        type: 1,
        components: [{
            type: 3,
            custom_id: `subpage_open~${originId}`,
            placeholder: 'Open a draw...',
            options: ordered.map(d => ({
                label: String(d.title || 'Untitled draw').slice(0, 100),
                value: String(indexOf(d)),
                description: `${d._section === 'returning' ? 'Returning' : 'New'} · ${word[top(d.bits)]}`,
                emoji: emojis.parseEmoji(emojis[dot[top(d.bits)]])
            }))
        }]
    };
}

// THE SINGLE-DRAW PANEL (2026-11-10, Harkirat: "jump directly and open a specific draw. like a single panel of that draw"). From `/draws draw:`, `d draws <name>`, or the Open a draw… menu. The draw's title and date lines, its picture full width, every item (no "…and N more": one draw always fits), its type, then a pager through every draw this season (allDraws' order) and Back to the page it was opened from (`back`, a /draws pager id; the draw's own section page when opened by name).
function buildDrawPanel(seasonalDoc, index, accentColor = PRESET_ACCENT, isEphemeral = false, opts = {}) {
    const all = allDraws(seasonalDoc);
    const at = Math.min(Math.max(0, index), all.length - 1);
    const draw = all[at];
    const nowMs = opts.nowMs ?? Date.now();
    const ctx = { seasonalDoc, nowMs };
    const seasonTitle = seasonalDoc.currentSeasonTitle || 'Current Season';
    const isNew = draw._section !== 'returning';
    const sectionList = all.filter(d => d._section === draw._section);
    // Back: the page it came from, else the section page that holds it.
    let back = opts.back;
    if (!back) {
        const pages = paginateDraws(sectionList, ctx, CHUNK_SIZE);
        const sub = Math.max(0, pages.findIndex(p => p.some(d => d.title === draw.title)));
        back = `${draw._section}_${sub}`;
    }
    const typeName = require('../utils/drawTypes').drawTypeName(draw.priceType);
    const itemLines = drawItemLines(draw);
    const components = [
        ...require('../utils/reminders').withBell(withCaptionEmoji(buildTitleBlock(seasonTitle, isNew ? emojis.newDraws : emojis.returningDraws, isNew ? 'New Draw' : 'Returning Draw', 2), seasonEmojiFor(seasonalDoc.currentSeasonTitle, seasonalDoc.currentSeasonEmoji))),
        { type: 14, spacing: 2, divider: true },
        { type: 10, content: `### ${draw.title}\n${drawDateLines(draw, ctx)}` },
        ...(draw.thumbnailUrl ? [{ type: 12, items: [{ media: { url: draw.thumbnailUrl } }] }] : []),
        { type: 10, content: [itemLines.length ? itemLines.join('\n') : '-# No items listed yet.', ...(typeName && draw.priceType !== 'unknown' ? [`-# ${typeName}`] : [])].join('\n').slice(0, 3400) }
    ];
    const pager = buildPaginationRow({
        totalChunks: all.length, currentPage: at,
        makeCustomId: (p) => `subpage_one_${p}~${back}`,
        indicatorCustomId: 'subpage_indicator',
        indicatorLabel: `Draw ${at + 1}/${all.length}`
    });
    components.push({ type: 14, spacing: 2, divider: true });
    if (pager) components.push(pager);
    const { encodeState } = require('./drawCalculator');
    const priced = all.some(d => d.priceType);
    components.push({ type: 1, components: [
        { type: 2, style: 2, label: 'Back to Draws', emoji: emojis.parseEmoji(emojis.returnArrow), custom_id: `subpage_${back}` },
        ...(priced ? [{ type: 2, style: 1, label: 'Calculate', emoji: emojis.parseEmoji(emojis.calculator), custom_id: encodeState('drawspick', {}) }] : [])
    ] });
    const nav = buildGlobalNavRow('nav_draws', { nav_draws: { label: 'All Draws', custom_id: 'nav_draws', style: 1 } });
    return withShareButton([{ type: 17, accent_color: accentColor, components }, nav], isEphemeral);
}

function buildContainer(seasonalDoc, page = 'new', subPage = 0, accentColor = PRESET_ACCENT, isEphemeral = false, filter = 0, opts = {}) {
    const seasonTitle = seasonalDoc.currentSeasonTitle || "Current Season";
    const mask = filterMask(filter);
    const states = mask & STATE_BITS;
    // The search typed in the Filter pop-up (2026-11-10); with the mask it is what `narrowed` means: anything that hides a draw.
    const query = String(opts.query || '').trim();
    const narrowed = Boolean(mask || query);
    // `opts.nowMs` draws the page as of another moment: the season panel's staged preview renders the draft as on the day the season starts (2026-11-08).
    const nowMs = opts.nowMs ?? Date.now();
    const ctx = { seasonalDoc, nowMs };
    // In release order (utils/drawDates.js byRelease, 2026-11-08 12:18 EST): the stored order is the paste order, which is not the order players should read.
    const timed = (key) => require('../utils/drawDates').byRelease(seasonalDoc[key === 'new' ? 'newDraws' : 'returningDraws']).map(d => ({ ...d, _section: key, ...drawTiming(d, seasonalDoc, nowMs) }));
    const lists = {
        new: timed('new').filter(d => (!states || (d.bits & states)) && drawMatches(d, mask, query)),
        returning: timed('returning').filter(d => (!states || (d.bits & states)) && drawMatches(d, mask, query))
    };
    // The sections the filter keeps: the picked ones, or both.
    const picked = ['new', 'returning'].filter(k => !(mask & 3) || (mask & SECTION_BIT[k]));
    const anyShown = picked.some(k => lists[k].length);
    // A picked section with nothing in it no longer gets a page of its own (2026-11-01 13:16 EDT, Harkirat: "why not just show the returning draws page directly and then have a divided section at the top that states "No New Draws match this filter." instead of a WHOLE empty page?"). Only a section he picked by name, and only while the other one has draws. Worded to his template (13:54 EDT): the warning, then a small line with where that section's draws stand right now, so the reader knows what to pick instead. utils/emptyNote.js, his wording (13:54 and 14:05 EDT): the warning, then where that section's draws stand right now.
    const SECTION_NAME = { new: 'New Draws', returning: 'Returning Draws' };
    const sectionNote = (k) => {
        const all = timed(k);
        const counts = STATUS_GROUPS.map(g => ({ emojiKey: g.emojiKey, label: g.word || g.label.toLowerCase(), n: all.filter(d => g.holds(d.bits)).length }));
        return emptyNote({ label: SECTION_NAME[k], emoji: emojis[k === 'new' ? 'newDraws' : 'returningDraws'], counts, filtered: narrowed && all.length > 0 });
    };
    // Which empty sections get a line at the top: one picked by name under a filter, and, with no filter, a section with no draws at all (it used to get a whole page saying so, the same empty page he asked to retire, 14:32 EDT: "Work the class!"). With nothing to show anywhere, every kept section's line is the page.
    const notes = picked.filter(k => !lists[k].length && (!anyShown || !narrowed || (mask & SECTION_BIT[k]))).map(sectionNote);

    let titleEmoji, titleLabel, body, pager, originId, kept, onPage;
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
            makeCustomId: (p) => `subpage_new_${p}${filterSuffix(mask, query)}`,
            indicatorCustomId: 'subpage_indicator',
            indicatorLabel: `${chunk[0]?._group.label || 'Filtered'} · ${at + 1}/${pages.length}`
        });
        originId = `new_${at}${filterSuffix(mask, query)}`;
        kept = flat;
        onPage = chunk;
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
            makeCustomId: (p) => `subpage_${allPages[p].key}_${allPages[p].sub}${filterSuffix(mask, query)}`,
            indicatorCustomId: 'subpage_indicator',
            indicatorLabel: `${categoryKey === 'new' ? 'New' : 'Returning'} · ${here + 1}/${allPages.length}`
        });
        originId = `${categoryKey}_${safeSubPage}${filterSuffix(mask, query)}`;
        kept = walk.flatMap(k => lists[k]);
        onPage = activeList.length ? pages[safeSubPage] : [];
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
    // OPEN A DRAW (2026-11-10, Harkirat: "i want a option in the /draws slash command to jump directly and open a specific draw. like a single panel of that draw."). Every draw the view keeps, this page's first, up to Discord's 25; a pick opens buildDrawPanel, whose Back returns here (`subpage_open~<this page's id>`). It took the filter dropdown's two components when the filter moved into the Filter button's pop-up below.
    const openRow = buildOpenRow(seasonalDoc, kept || [], onPage || [], originId);
    if (openRow) drawComponents.push(openRow);

    // PRICE THESE DRAWS (2026-10-21 10:14 EDT, Harkirat): Calculate opens /draw calculator's pick-your-draws pop-up (handlers/drawCalc.js `drawspick`), shown only when a draw this season has a price type. A `calc~` id with no author, so whoever presses it gets their own calculation. It shared a row with the New/Returning Draws toggle (CATEGORY TOGGLE, 2026-07-12: one button offering the OTHER section, sized so the pair never wrapped on his iPhone, his option D of 2026-10-21) until 2026-11-01, when the filter above replaced the toggle.
    const priced = [...(seasonalDoc.newDraws || []), ...(seasonalDoc.returningDraws || [])].some(d => d.priceType);
    const { encodeState } = require('./drawCalculator');
    // RESET FILTER (2026-11-01 13:16 EDT, Harkirat: "when any filter is selected, show a "Reset filter" button to the left of calculate with the "Return" emoji. which wipes the filters and takes you back to the normal /draws view"). `subpage_reset` in handlers/pagination.js; the footer's All Draws does the same, but sits far from the dropdown.
    // FILTER (2026-11-10): opens the pop-up (buildFilterModal) ticked as this view stands, so its id carries the mask and search.
    const actions = [
        { type: 2, style: narrowed ? 1 : 2, label: 'Filter', emoji: emojis.parseEmoji(emojis.filter), custom_id: `subpage_filterform${filterSuffix(mask, query)}` },
        ...(narrowed ? [{ type: 2, style: 2, label: 'Reset Filter', emoji: emojis.parseEmoji(emojis.returnArrow), custom_id: 'subpage_reset' }] : []),
        ...(priced ? [{ type: 2, style: 1, label: 'Calculate', emoji: emojis.parseEmoji(emojis.calculator), custom_id: encodeState('drawspick', {}) }] : [])
    ];
    // Its own row since the toggle went. The toggle's ids (`page_new_draws`/`page_returning_draws`) still open their section on panels posted before (handlers/pagination.js).
    drawComponents.push({ type: 1, components: actions });

    const containerPayload = {
        type: 17,
        accent_color: accentColor,
        components: drawComponents
    };

    // In a filtered view the footer's own Draws slot becomes a live blurple "All Draws" that clears the filter, as /calendar's "Full Calendar" does.
    const globalNavigationRow = narrowed
        ? buildGlobalNavRow('nav_draws', { nav_draws: { label: 'All Draws', custom_id: 'nav_draws', style: 1 } })
        : buildGlobalNavRow('nav_draws');

    return withShareButton([containerPayload, globalNavigationRow], isEphemeral);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('draws')
        // Trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) -- was truncating on mobile.
        .setDescription('View new and returning draws this season')
        // draw: (2026-11-10, his ask): opens one draw on its own panel (buildDrawPanel), suggested by title as you type.
        .addStringOption(option => option.setName('draw').setDescription('Open one draw on its own panel').setAutocomplete(true))
        .addStringOption(option => option.setName('page').setDescription('Jump directly to New Draws or Returning Draws').addChoices({ name: 'New Draws', value: 'new' }, { name: 'Returning Draws', value: 'returning' }))
        // One status to start with (2026-11-01); the panel's Filter pop-up picks several, and more.
        .addStringOption(option => option.setName('filter').setDescription('Show only upcoming, active, leaving soon or ended draws').addChoices(
            { name: 'Upcoming', value: 'upcoming' }, { name: 'Active Now', value: 'live' }, { name: 'Leaving Soon', value: 'leaving' }, { name: 'Ended', value: 'ended' }
        ))
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    buildContainer,
    buildDrawPanel,
    buildFilterModal,
    readFilterModal,
    parseFilterSuffix,
    filterSuffix,
    encodeQuery,
    decodeQuery,
    drawMatches,
    drawKindBits,
    allDraws,
    findDrawIndex,
    RARITY_OPTIONS,
    KIND_OPTIONS,
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

    // draw: suggestions, newest first: this season's draws whose title (or an item) holds what is typed. utils/autocomplete.js routes here; a text command's `d draws <name>` asks the same list (bot/textCommands.js).
    async autocomplete(interaction) {
        const typed = String(interaction.options.getFocused() || '').trim();
        const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
        if (!doc) return await interaction.respond([]);
        const list = allDraws(doc).reverse().filter(d => !typed || drawMatches(d, 0, typed));
        return await interaction.respond(list.slice(0, 25).map(d => ({
            name: `${String(d.title || 'Untitled draw').slice(0, 80)} · ${d._section === 'returning' ? 'Returning' : 'New'}`.slice(0, 100),
            value: String(d.title || '').slice(0, 100)
        })));
    },

    // filterOverride: the filter mask a pager button or the filter dropdown carries; a slash `filter` wins. extra.query: the Filter pop-up's search. extra.drawIndex / extra.back: open one draw (buildDrawPanel), Back returning to that /draws page.
    async execute(interaction, pageOverride = null, subPageOverride = 0, filterOverride = 0, extra = {}) {
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
            const drawChoice = interaction.options.getString('draw');
            if (drawChoice) extra = { ...extra, drawTitle: drawChoice };
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
        let drawIndex = Number.isInteger(extra.drawIndex) ? extra.drawIndex : -1;
        if (extra.drawTitle) {
            drawIndex = findDrawIndex(seasonalDoc, extra.drawTitle);
            if (drawIndex < 0) return require('../utils/ephemeral').privateNotice(interaction, `${BOT_EMOJI.cross} No draw this season is called **${String(extra.drawTitle).slice(0, 80)}**. Pick one from the suggestions, or open /draws.`);
        }
        const components = drawIndex >= 0 && allDraws(seasonalDoc).length
            ? buildDrawPanel(seasonalDoc, drawIndex, accentColor, isEphemeral, { back: extra.back })
            : buildContainer(seasonalDoc, activePage, subPageOverride, accentColor, isEphemeral, filterOverride, { query: extra.query });

        return await sendV2Payload(interaction, components);
    }
};