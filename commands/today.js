// ==========================================
// COMMAND: TODAY IN CODM
// ==========================================
// The game day at a glance (Harkirat's own template, approved on dev-bot mock-ups in #testing-spam 2026-10-23 10:41–13:02 EDT). Two screens are built here from one set of sections:
//   - /today: everything live now, what is ending soon, what goes live at the next reset, and a footer of countdowns. No future-day list (his 13:02 EDT notes: "only mention if/what is going live that day").
//   - /calendar's Today page, which /calendar opens on (12:25 EDT): the same sections plus the next 2 days with something, under /calendar's own title, pager and filter (commands/calendar.js).
//
// THE GAME DAY: CODM's daily reset is 00:00 UTC (8 PM Toronto in summer, 7 PM in winter), so every countdown is a Discord relative timestamp with no time-zone logic. Draws release at the reset, so "going live" is anything not yet started whose start falls before the next 00:00 UTC.
//
// NEVER CLAIM WHAT THE DATA CANNOT PROVE (his rule, 11:48 and 13:02 EDT): an empty Going live or day list is left out, never replaced by a "nothing goes live" line, because an empty list may only mean the calendar is missing it. The one "nothing" line is "Nothing is currently live", shown only when NOTHING at all is live, since Live now lists everything live.
//
// Entries come from /calendar's own readers (getDrawSectionEntries, entryState), never a second copy of what "live" or "over" means. Read-only; nothing here is stored.

const { SlashCommandBuilder } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { toBoldItalicUnicode } = require('../utils/titleBlock');
const { seasonEmojiFor } = require('../utils/seasonEmoji');
const { withShareButton } = require('../utils/shareButton');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { isSameDrawTitle } = require('../utils/search');

const DAY_MS = 86400000;
// His windows: Ending soon looks 2 days ahead (2026-10-23 11:24 EDT); /calendar's Today page shows the next 2 days with something, looking 7 days ahead ("next 2 dates only then, since the entire panel will likely be long", 13:02 EDT).
const ENDING_SOON_MS = 2 * DAY_MS;
const LOOKAHEAD_MS = 7 * DAY_MS;
const DAYS_SHOWN = 2;
// The next season's line shows from 96 hours before it starts (13:02 EDT).
const TEASER_MS = 96 * 3600000;
// A draw's icon is its best item's tier, best first; a draw with no tiered item keeps its New/Returning icon.
const TIER_ORDER = ['mythic', 'legendary', 'legacy', 'epic'];

// The game day around `nowMs`: the last 00:00 UTC and the next.
function gameDay(nowMs) {
    const start = Math.floor(nowMs / DAY_MS) * DAY_MS;
    return { start, next: start + DAY_MS };
}

// The best tier among a draw's items, as an emojiMap key, or null.
function drawTier(seasonalDoc, title) {
    const draw = [...(seasonalDoc.newDraws || []), ...(seasonalDoc.returningDraws || [])].find(d => isSameDrawTitle(title, d.title));
    const tiers = new Set((draw?.items || []).map(i => i.tier));
    return TIER_ORDER.find(t => tiers.has(t)) || null;
}

// Every draw, event and playlist this season, with where it stands now. `types` (a Set of 'draw' | 'event' | 'playlist', or null for all) is /calendar's type filter narrowing its Today page (his option C, 12:25 EDT). Emoji are looked up per call, never at load (scripts/checkEmojiCaptures.js).
function collectEntries(seasonalDoc, nowMs, types = null) {
    const { entryState, getDrawSectionEntries } = require('./calendar');
    const out = [];
    const add = (event, type, icon, kind) => {
        if (types && !types.has(type)) return;
        const { state, startMs, endMs } = entryState(event, seasonalDoc, nowMs);
        out.push({ title: event.title, type, icon, kind, state, startMs, endMs });
    };
    for (const e of getDrawSectionEntries(seasonalDoc)) {
        const returning = e.drawType === 'returning';
        const tier = drawTier(seasonalDoc, e.title);
        add(e, 'draw', tier ? emojis[tier] : returning ? emojis.returningDraws : emojis.newDraws, returning ? 'Returning draw' : 'New draw');
    }
    for (const e of seasonalDoc.calendar || []) {
        if (e.category === 'draw') continue; // already in getDrawSectionEntries
        if (e.category === 'playlist') add(e, 'playlist', emojis.modes, 'Playlist');
        else add(e, 'event', emojis.events, 'Event');
    }
    return out;
}

// His order for every list (13:02 EDT): no end date at the top, then the one that leaves last down to the one that leaves first, so what leaves quickest sits at the bottom.
const endOrder = (a, b) => {
    const ea = Number.isFinite(a.endMs) ? a.endMs : Infinity, eb = Number.isFinite(b.endMs) ? b.endMs : Infinity;
    return (ea === eb ? 0 : eb > ea ? 1 : -1) || a.title.localeCompare(b.title);
};

// The page's sections, as data, so a test can read them without parsing text.
function todaySections(seasonalDoc, nowMs = Date.now(), { types = null } = {}) {
    const { next } = gameDay(nowMs);
    const entries = collectEntries(seasonalDoc, nowMs, types);
    const live = entries.filter(e => e.state === 'live');
    // Ending soon takes what is live and ends within 2 days; Live now holds the rest of what is live, so nothing is listed twice.
    const endingSoon = live.filter(e => Number.isFinite(e.endMs) && e.endMs - nowMs <= ENDING_SOON_MS).sort(endOrder);
    const ending = new Set(endingSoon);
    const liveNow = live.filter(e => !ending.has(e)).sort(endOrder);
    const goingLive = entries.filter(e => e.state === 'soon' && e.startMs <= next).sort(endOrder);
    const later = entries.filter(e => e.state === 'soon' && e.startMs > next && e.startMs <= next + LOOKAHEAD_MS).sort((a, b) => a.startMs - b.startMs || a.title.localeCompare(b.title));

    // Grouped by the UTC date, which is the game's date for anything that releases at the reset.
    const days = [];
    for (const e of later) {
        const key = Math.floor(e.startMs / DAY_MS);
        let day = days.find(d => d.key === key);
        if (!day) {
            if (days.length === DAYS_SHOWN) break;
            day = { key, label: new Date(key * DAY_MS).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }), entries: [] };
            days.push(day);
        }
        day.entries.push(e);
    }
    return { next, anyLive: live.length > 0, liveNow, endingSoon, goingLive, days };
}

const rel = ms => `<t:${Math.floor(ms / 1000)}:R>`;
const block = content => ({ type: 10, content });
const ends = e => (Number.isFinite(e.endMs) ? ` · ends ${rel(e.endMs)}` : '');

// The next season, from /manage's Next Season draft, when it starts within 96 hours, as the line under the season subtitle (13:02 EDT). Its start is the draft's Battle Pass start, else the live Battle Pass end (the new season begins when this one's pass ends).
function seasonTeaser(seasonalDoc, nowMs = Date.now()) {
    const draft = seasonalDoc.draft;
    if (!draft?.active || !draft.currentSeasonTitle) return null;
    const when = draft.bpStart || (seasonalDoc.bpEndTBD ? null : seasonalDoc.bpEnd);
    const startMs = when ? new Date(when).getTime() : NaN;
    if (!Number.isFinite(startMs) || startMs <= nowMs || startMs - nowMs > TEASER_MS) return null;
    const emoji = seasonEmojiFor(draft.currentSeasonTitle, draft.currentSeasonEmoji);
    return `### ${emoji ? `${emoji} ` : ''}${draft.currentSeasonTitle} · starts ${rel(startMs)}`;
}

// One footer line, his pick E (2026-10-23 10:58–11:02 EDT): the daily reset, then each season end, the app's blank emoji between them, all relative. A TBD end reads TBD; an unset or past one is left out.
function footerLine(seasonalDoc, next, nowMs) {
    const parts = [`🔄 Daily reset ${rel(next)}`]; // 🔄 until the emoji project's reset emoji exists (docs/ROADMAP.md, "Emoji to request")
    for (const [icon, label, field] of [[emojis.bp, 'BP', 'bpEnd'], [emojis.rank, 'Rank', 'rankEnd'], [emojis.dmz, 'DMZ', 'dmzEnd']]) {
        if (seasonalDoc[`${field}TBD`]) { parts.push(`${icon} ${label} TBD`); continue; }
        const ms = seasonalDoc[field] ? new Date(seasonalDoc[field]).getTime() : NaN;
        if (Number.isFinite(ms) && ms > nowMs) parts.push(`${icon} ${label} ${rel(ms)}`);
    }
    return `-# ${parts.join(emojis.blank)}`;
}

// Discord refuses a message over 40 components or over 4,000 characters of text in all (.claude/rules/draw-prices.md). A busy season can hold 30 live entries, which measured 57 components on /calendar's Today page (2026-10-23 13:11 EDT), so the body steps down until the message fits: 'spaced' (one block per entry, his spacing), then 'compact' (one block per section), then 'capped' (Live now and Ending soon trimmed, with a "+N more" line).
const MODES = ['spaced', 'compact', 'capped'];
const LIVE_CAP = 12, ENDING_CAP = 8;
function countComponents(list) {
    let n = 0;
    const walk = c => { n++; (c.components || []).forEach(walk); if (c.accessory) walk(c.accessory); };
    list.forEach(walk);
    return n;
}
const textLength = list => JSON.stringify(list).match(/"content":"(?:[^"\\]|\\.)*"/g)?.reduce((n, c) => n + c.length - 12, 0) || 0;
// The first mode whose whole message fits. `wrap(body)` builds the full message around a body.
function fitMessage(seasonalDoc, opts, wrap) {
    for (const mode of MODES) {
        const message = wrap(buildTodayBody(seasonalDoc, { ...opts, mode }));
        if (countComponents(message) <= 40 && textLength(message) <= 3800) return message;
    }
    return wrap(buildTodayBody(seasonalDoc, { ...opts, mode: 'capped' }));
}

// The sections under a title, shared by /today (withDays false) and /calendar's Today page (withDays true), ending with the footer.
function buildTodayBody(seasonalDoc, { nowMs = Date.now(), withDays = false, types = null, mode = 'spaced' } = {}) {
    if (withDays) return buildCalendarTodayBody(seasonalDoc, { nowMs, types, mode });
    const { anyLive, liveNow: allLive, endingSoon: allEnding, goingLive, days, next } = todaySections(seasonalDoc, nowMs, { types });
    const capped = mode === 'capped';
    const liveNow = capped ? allLive.slice(0, LIVE_CAP) : allLive;
    const endingSoon = capped ? allEnding.slice(-ENDING_CAP) : allEnding; // the quickest to leave sit at the bottom, so keep those
    const more = n => (n > 0 ? [`-# +${n} more`] : []);
    // In 'spaced' each entry is its own block; otherwise a section is one block, its entries a line apart.
    const entryBlocks = (heading, lines, extra = []) => (mode === 'spaced' && !extra.length
        ? [block(heading), ...lines.map(block)]
        : [block([heading, ...lines, ...extra].join('\n'))]);
    const divider = { type: 14, spacing: 2, divider: true };
    const sections = [];

    // Each live entry is its own block, so Discord's gap between blocks separates them (his "nicer spacing", 10:49 EDT).
    if (liveNow.length) sections.push(entryBlocks(`### ${emojis.greenDotGlow} Live now`, liveNow.map(e => `${e.icon} **${e.title}**\n-# ${emojis.blank}\u2002${e.kind}${ends(e)}`), more(allLive.length - liveNow.length)));
    // Nothing at all live: his line, true by construction since Live now lists everything live; it leads straight into what follows, no divider (his draft, 12:32 EDT).
    if (!anyLive) sections.push([block(`### ${emojis.redDotGlow} Nothing is currently live`)]);
    if (endingSoon.length) sections.push([block([`### ${emojis.yellowDotGlow} Ending soon`, ...more(allEnding.length - endingSoon.length), ...endingSoon.map(e => `${e.icon} **${e.title}** · ends ${rel(e.endMs)}`)].join('\n'))]);
    const upcoming = [];
    if (goingLive.length) {
        upcoming.push(...entryBlocks(`### ${emojis.lightBlueDotGlow} Going live ${rel(next)}`, goingLive.map(e => `${e.icon} **${e.title}**\n-# ${emojis.blank}\u2002${e.kind}${ends(e)}`)));
        if (withDays && days.length) upcoming.push({ type: 14, spacing: 1, divider: false });
    }
    const dayText = days.map(d => `**${d.label}**\n${d.entries.map(e => `${e.icon} ${e.title}`).join('\n')}`);
    if (withDays && dayText.length) upcoming.push(...(mode === 'spaced' ? dayText.map(block) : [block(dayText.join('\n'))]));
    if (upcoming.length) sections.push(upcoming);

    const components = [];
    sections.forEach((s, i) => components.push(...(i && !(i === 1 && !anyLive) ? [divider] : []), ...s));
    // The footer sits after an empty space, not a line (13:02 EDT: "change this to divider:false small spacing").
    components.push({ type: 14, spacing: 1, divider: false }, block(footerLine(seasonalDoc, next, nowMs)));
    return components;
}

// /calendar's Today page, his own template (2026-10-23 15:50 EDT, built after mock-ups in #testing-spam; /today keeps the layout above while he reviews it). Every heading is `##`, and no entry carries a status line, which wrapped on his phone:
//   Live now: one block per type, each under a small "<type emoji> **Draws**" label with a small no-line gap between types; draws keep their tier icon, events and playlists are `- ` bullets.
//   Ending soon: names under one small bold "Ends <relative>" label per end day.
//   Upcoming: a small bold "Going live <relative>" label over what starts by the next reset, then each of the next days with something in its own block under a small bold date.
// A busy season trims Live now to its first LIVE_CAP entries and Ending soon to its ENDING_CAP soonest, each with a "+N more" line, until the message fits.
const LIVE_KINDS = [['draw', 'Draws', 'newDraws'], ['event', 'Events', 'events'], ['playlist', 'Playlists & Modes', 'modes']];
function buildCalendarTodayBody(seasonalDoc, { nowMs = Date.now(), types = null, mode = 'spaced' } = {}) {
    const { anyLive, liveNow: allLive, endingSoon: allEnding, goingLive, days, next } = todaySections(seasonalDoc, nowMs, { types });
    const capped = mode === 'capped';
    const liveNow = capped ? allLive.slice(0, LIVE_CAP) : allLive;
    const endingSoon = capped ? allEnding.slice(-ENDING_CAP) : allEnding;
    const more = n => (n > 0 ? [`-# +${n} more`] : []);
    const gap = { type: 14, spacing: 1, divider: false };
    const divider = { type: 14, spacing: 2, divider: true };
    const sections = [];

    if (liveNow.length) {
        const live = [];
        for (const [type, label, emojiKey] of LIVE_KINDS) {
            const items = liveNow.filter(e => e.type === type);
            if (!items.length) continue;
            const lines = items.map(e => (type === 'draw' ? `${e.icon} ${e.title}` : `- ${e.title}`));
            if (live.length) live.push(gap);
            live.push(block([...(live.length ? [] : [`## ${emojis.greenDotGlow} Live now`]), `-# ${emojis[emojiKey]} **${label}**`, ...lines].join('\n')));
        }
        const extra = more(allLive.length - liveNow.length);
        if (extra.length) live.push(block(extra.join('\n')));
        sections.push(live);
    }
    if (!anyLive) sections.push([block(`## ${emojis.redDotGlow} Nothing is currently live`)]);
    if (endingSoon.length) {
        const lines = [];
        let lastDay = null;
        for (const e of endingSoon) {
            const day = Math.floor(e.endMs / DAY_MS);
            if (day !== lastDay) { lines.push(`-# **Ends ${rel(e.endMs)}**`); lastDay = day; }
            lines.push(`${e.icon} ${e.title}`);
        }
        sections.push([block([`## ${emojis.yellowDotGlow} Ending soon`, ...more(allEnding.length - endingSoon.length), ...lines].join('\n'))]);
    }
    const dated = [];
    if (goingLive.length) dated.push([`-# **Going live** ${rel(next)}`, ...goingLive.map(e => `${e.icon} ${e.title}`)]);
    for (const d of days) dated.push([`-# **${d.label}**`, ...d.entries.map(e => `${e.icon} ${e.title}`)]);
    // Each dated group is its own block, for the spacing (his ask, 15:45 EDT); the Upcoming heading rides in the first.
    if (dated.length) sections.push(dated.map((lines, i) => block([...(i ? [] : [`## ${emojis.lightBlueDotGlow} Upcoming`]), ...lines].join('\n'))));

    const components = [];
    sections.forEach((sec, i) => components.push(...(i && !(i === 1 && !anyLive) ? [divider] : []), ...sec));
    components.push(gap, block(footerLine(seasonalDoc, next, nowMs)));
    return components;
}

// The /today message: title, sections, then the seasonal nav under the panel (his ask, 12:05 EDT). /today is not one of its five slots, so none is current and every one opens its command.
function buildTodayContainer(seasonalDoc, { nowMs = Date.now(), accentColor, isEphemeral = false } = {}) {
    const { buildGlobalNavRow } = require('../utils/globalNav');
    const seasonTitle = seasonalDoc.currentSeasonTitle || 'Current Season';
    const seasonEmoji = seasonEmojiFor(seasonalDoc.currentSeasonTitle, seasonalDoc.currentSeasonEmoji);
    const teaser = seasonTeaser(seasonalDoc, nowMs);
    const title = block(`## ${emojis.calendar} Today in CODM\n${seasonEmoji ? `${seasonEmoji} ` : ''}${toBoldItalicUnicode(seasonTitle)}${teaser ? `\n${teaser}` : ''}`);
    return fitMessage(seasonalDoc, { nowMs }, body => withShareButton([{ type: 17, accent_color: accentColor, components: [title, { type: 14, spacing: 2, divider: true }, ...body] }, buildGlobalNavRow(null)], isEphemeral));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('today')
        .setDescription("What's live, ending soon and going live today, with the daily reset")
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts, like every public command

    buildTodayContainer,
    buildTodayBody,
    fitMessage,
    countComponents,
    todaySections,
    seasonTeaser,
    gameDay,

    async execute(interaction) {
        const prefsPromise = UserPreference.findOne({ discordId: interaction.user.id });
        const seasonalDocPromise = SeasonalData.findOne({ docType: 'global' }).lean();
        const prefs = await prefsPromise;
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
        // Seasonal content, so the shared "Seasonal Content" toggle (Option A, .claude/rules/design-decisions.md).
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const seasonalDoc = await seasonalDocPromise;
        if (!seasonalDoc) return interaction.followUp({ content: `${emojis.cross} The global seasonal database document has not been initialized yet.` });

        // Calendar's accent (his call, 2026-10-23 10:00 EDT), through the same /settings accent style every seasonal command honours.
        const { PRESET_ACCENT } = require('./calendar');
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        return await sendV2Payload(interaction, buildTodayContainer(seasonalDoc, { accentColor, isEphemeral }));
    }
};
