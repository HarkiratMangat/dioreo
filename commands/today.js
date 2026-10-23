// ==========================================
// COMMAND: TODAY IN CODM
// ==========================================
// One screen of the game day (Harkirat's own template, mocked on the dev bot in #testing-spam and approved 10:41–11:48 EDT): what went live today, what is ending soon, what goes live at the next daily reset, the next few days, and a footer of countdowns. Also reachable as `/calendar filter:Today` and as the Today option in /calendar's filter dropdown (his ask, 11:48 EDT), which is why buildTodayContainer takes `fromCalendar`.
//
// THE GAME DAY: CODM's daily reset is 00:00 UTC (8 PM Toronto in summer, 7 PM in winter), so "today" runs from the last 00:00 UTC to the next, and every countdown is a Discord relative timestamp with no time-zone logic. Draws release at the reset, so "going live at the next reset" is anything not yet started whose start falls before the next 00:00 UTC.
//
// Entries come from /calendar's own readers (getDrawSectionEntries, entryState), never a second copy of what "live" or "over" means: an All Season event ends with the Battle Pass, a draw merged in from /draws has no end, and a missing date is TBA. Read-only; nothing here is stored.

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
// His windows (2026-10-23 11:24 EDT): Ending soon looks 2 days ahead; the day list looks 7 days ahead but shows only the first 3 days that have something ("with 4 it kind of gets a bit too long", 11:24 EDT).
const ENDING_SOON_MS = 2 * DAY_MS;
const LOOKAHEAD_MS = 7 * DAY_MS;
const DAYS_SHOWN = 3;
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

// Every draw, event and playlist this season, with where it stands now. Emoji are looked up per call, never at load (scripts/checkEmojiCaptures.js).
function collectEntries(seasonalDoc, nowMs) {
    const { entryState, getDrawSectionEntries } = require('./calendar');
    const out = [];
    const add = (event, icon, kind) => {
        const { state, startMs, endMs } = entryState(event, seasonalDoc, nowMs);
        out.push({ title: event.title, icon, kind, state, startMs, endMs });
    };
    for (const e of getDrawSectionEntries(seasonalDoc)) {
        const returning = e.drawType === 'returning';
        const tier = drawTier(seasonalDoc, e.title);
        add(e, tier ? emojis[tier] : returning ? emojis.returningDraws : emojis.newDraws, returning ? 'Returning draw' : 'New draw');
    }
    for (const e of seasonalDoc.calendar || []) {
        if (e.category === 'draw') continue; // already in getDrawSectionEntries
        if (e.category === 'playlist') add(e, emojis.modes, 'Playlist');
        else add(e, emojis.events, 'Event');
    }
    return out;
}

// The page's sections, as data, so a test can read them without parsing text.
function todaySections(seasonalDoc, nowMs = Date.now()) {
    const { start, next } = gameDay(nowMs);
    const entries = collectEntries(seasonalDoc, nowMs);
    const byEnd = (a, b) => (Number.isFinite(a.endMs) ? a.endMs : Infinity) - (Number.isFinite(b.endMs) ? b.endMs : Infinity) || a.title.localeCompare(b.title);
    const byStart = (a, b) => a.startMs - b.startMs || a.title.localeCompare(b.title);

    // Live now: went live during this game day (his template's "Live now"; everything older is one tap away in /calendar).
    const liveNow = entries.filter(e => e.state === 'live' && e.startMs >= start).sort(byEnd);
    const shown = new Set(liveNow);
    const endingSoon = entries.filter(e => e.state === 'live' && !shown.has(e) && Number.isFinite(e.endMs) && e.endMs - nowMs <= ENDING_SOON_MS).sort(byEnd);
    const goingLive = entries.filter(e => e.state === 'soon' && e.startMs <= next).sort(byStart);
    const later = entries.filter(e => e.state === 'soon' && e.startMs > next && e.startMs <= next + LOOKAHEAD_MS).sort(byStart);

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
    return { start, next, liveNow, endingSoon, goingLive, days };
}

const rel = ms => `<t:${Math.floor(ms / 1000)}:R>`;
const block = content => ({ type: 10, content });
const ends = e => (Number.isFinite(e.endMs) ? ` · ends ${rel(e.endMs)}` : '');

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

// The whole message. `fromCalendar` adds /calendar's filter dropdown (Today picked) and its footer nav, so the view can be left the way it was entered.
function buildTodayContainer(seasonalDoc, { nowMs = Date.now(), accentColor, isEphemeral = false, fromCalendar = false } = {}) {
    const { liveNow, endingSoon, goingLive, days, next } = todaySections(seasonalDoc, nowMs);
    const divider = { type: 14, spacing: 2, divider: true };
    const sections = [];

    // Each live entry is its own block, so Discord's gap between blocks separates them (his "nicer spacing", 10:49 EDT).
    if (liveNow.length) sections.push([block(`### ${emojis.greenDotGlow} Live now`), ...liveNow.map(e => block(`${e.icon} **${e.title}**\n-# ${e.kind}${ends(e)}`))]);
    if (endingSoon.length) sections.push([block(`### ${emojis.yellowDotGlow} Ending soon\n${endingSoon.map(e => `${e.icon} **${e.title}** · ends ${rel(e.endMs)}`).join('\n')}`)]);
    // Going live sits at the top of the day list, set apart by an empty space rather than a divider (11:24 EDT). With nothing going live the block is left out, never replaced by a "nothing goes live" line: an empty list may only mean the calendar is missing it (his pick A, 11:48 EDT).
    const upcoming = [];
    if (goingLive.length) {
        upcoming.push(block(`### ${emojis.blueDotGlow} Going live ${rel(next)}`), ...goingLive.map(e => block(`${e.icon} **${e.title}**\n-# ${e.kind}${ends(e)}`)));
        if (days.length) upcoming.push({ type: 14, spacing: 1, divider: false });
    }
    upcoming.push(...days.map(d => block(`**${d.label}**\n${d.entries.map(e => `${e.icon} ${e.title}`).join('\n')}`)));
    if (upcoming.length) sections.push(upcoming);

    const seasonTitle = seasonalDoc.currentSeasonTitle || 'Current Season';
    const seasonEmoji = seasonEmojiFor(seasonalDoc.currentSeasonTitle, seasonalDoc.currentSeasonEmoji);
    const components = [block(`## ${emojis.calendar} Today in CODM\n${seasonEmoji ? `${seasonEmoji} ` : ''}${toBoldItalicUnicode(seasonTitle)}`), divider];
    if (sections.length) sections.forEach((s, i) => components.push(...(i ? [divider] : []), ...s));
    else components.push(block('-# Nothing on the calendar for the next 7 days.'));
    components.push({ type: 14, spacing: 1, divider: true }, block(footerLine(seasonalDoc, next, nowMs)));

    const { buildGlobalNavRow } = require('../utils/globalNav');
    // The seasonal nav under the panel (his ask, 2026-10-23 12:05 EDT). /today is not one of its five slots, so none is current and every one opens its command.
    if (!fromCalendar) return withShareButton([{ type: 17, accent_color: accentColor, components }, buildGlobalNavRow(null)], isEphemeral);
    const { buildFilterRow, todayMask } = require('./calendar');
    components.push({ type: 14, spacing: 2, divider: true }, buildFilterRow(0, todayMask()));
    const nav = buildGlobalNavRow('nav_calendar', { nav_calendar: { label: 'Full Calendar', custom_id: 'nav_calendar', style: 1 } });
    return withShareButton([{ type: 17, accent_color: accentColor, components }, nav], isEphemeral);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('today')
        .setDescription("What's live today, ending soon and coming up, with the daily reset")
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts, like every public command

    buildTodayContainer,
    todaySections,
    gameDay,

    // `fromCalendar`: opened through /calendar (its `filter:Today` or its dropdown), so the panel keeps /calendar's controls.
    async execute(interaction, { fromCalendar = false } = {}) {
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
        return await sendV2Payload(interaction, buildTodayContainer(seasonalDoc, { accentColor, isEphemeral, fromCalendar }));
    }
};
