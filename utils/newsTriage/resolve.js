// utils/newsTriage/resolve.js -- turns what the AI read off a news post into card items: real dates, where each item goes (this season or the Next Season Draft), new or returning, and whether Dioreo already has it (news-channel-triage, built 2026-11-04 20:02 EST). Pure apart from chrono and the admin date formatter, so scripts/newsTriage.test.js pins it.
//
// The model returns dates AS WRITTEN ("tomorrow", "November 19th at 4pm PT") and never a computed date: code reads them here, against the post's own time, so "tomorrow" means the day after the post and not the day after the bot read it (the brief's 4.3, and the reason a catch-up after downtime stays right).
const chrono = require('chrono-node');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const ACTION_OF_KIND = { draw: 'draw', event: 'calendar', mode: 'calendar', patch: 'patch', season: 'season' };

// Names compare without case, punctuation or the words every draw name carries, so "The Hunger Eternal Draw" matches the index's "Hunger Eternal".
function norm(s) {
    return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ')
        .replace(/\b(the|draws?|lucky|mythic drop|series armou?ry|armou?ry|event|mode|playlist)\b/g, ' ')
        .replace(/\s+/g, ' ').trim();
}
function sameName(a, b) {
    const na = norm(a); const nb = norm(b);
    if (!na || !nb) return false;
    return na === nb || (na.length >= 6 && nb.includes(na)) || (nb.length >= 6 && na.includes(nb));
}
const sameDay = (a, b) => dayjs.utc(a).format('YYYY-MM-DD') === dayjs.utc(b).format('YYYY-MM-DD');

// A date as written, read against the post's time in UTC (the game's daily update is 00:00 UTC, and every admin date in Dioreo is UTC-0: .claude/rules/design-decisions.md). With no time of day it is that day's 00:00 UTC; with a time and a zone ("4pm PT") it is that instant.
function readDate(text, postedAt) {
    if (!text) return null;
    const ref = postedAt instanceof Date ? postedAt : new Date(postedAt || Date.now());
    const said = String(text).replace(/\b(today'?s )?daily (reset|update)\b/i, 'today').replace(/\breset\b/i, '');
    const found = chrono.parse(said, { instant: ref, timezone: 0 }, { forwardDate: true })[0];
    if (!found) return null;
    const c = found.start;
    if (c.isCertain('hour') && c.isCertain('timezoneOffset')) return c.date();
    return new Date(Date.UTC(c.get('year'), c.get('month') - 1, c.get('day')));
}

function catalogueMatch(name, catalogue) {
    return (catalogue || []).find(d => [d.title, ...(d.aliases || [])].some(t => sameName(t, name))) || null;
}

// One raw item from utils/newsTriage/model.js → a card item, or `{ skip: reason }`. ctx: { postedAt, liveEnd, draftStart, namesRegion, catalogue: [{ title, aliases }], live: { newDraws, returningDraws, calendar }, draft: { same } }
function resolveItem(raw, ctx) {
    const warnings = [];
    const start = readDate(raw.start, ctx.postedAt);
    const end = readDate(raw.end, ctx.postedAt);
    let action = ACTION_OF_KIND[raw.kind] || 'info';
    // Another region is dropped only when the post's own words say so (ctx.namesRegion, from filter.js); a region the AI read off the picture alone is shown with a warning instead, because a wrong drop is silent.
    if (raw.region === 'other' && ctx.namesRegion !== false) return { skip: 'another region' };
    if (raw.region === 'other') warnings.push('The AI thinks this may be for another region; the post\'s words do not say so.');
    if (action === 'info') return { skip: 'nothing Dioreo tracks' };

    // Where it goes. A date beats words: a draw dated after this season ends goes to the draft whatever the post calls it.
    let where;
    if (raw.season === 'later') where = 'later';
    else if (start && ctx.liveEnd) {
        // ON or after the live season's end is next season (2026-11-04 22:09 EST, from the live dev run): CODM's own Season 10 post listed eight playlists starting 11/12, Season 9's bpEnd is 2026-11-12 00:00 UTC, and a strict `>` sent all eight to the LIVE season with a false "the date is before this season ends" warning. Launch-day items start exactly on the boundary, so this is every season's busiest post.
        where = start >= new Date(ctx.liveEnd) ? 'draft' : 'live';
        if (raw.season === 'next' && where === 'live') warnings.push('The post says next season, but the date is before this season ends.');
    } else if (raw.season === 'next') where = 'draft';
    else where = 'live';
    if (where === 'later') return { skip: 'a later season' };

    // A season post (its title and start) goes only to the Next Season Draft's Titles & Deadlines box; the live season's own title is not news triage's to change. The post that announces a season is the one that sets the draft's start, so dropping it lost the season's most important post (the live run, CODM's "Greetings" post, 2026-11-04 22:09 EST).
    if (action === 'season') {
        if (where !== 'draft') return { skip: 'the live season\'s own title or dates' };
        if (ctx.draftTitle && sameName(ctx.draftTitle, raw.name) && (!start || (ctx.draftStart && sameDay(ctx.draftStart, start)))) return { skip: 'already in the Next Season Draft' };
        if (raw.certainty === 'expected') warnings.push('Expected, not confirmed.');
        return { kind: 'season', change: raw.change, name: raw.name, rewards: [], startText: raw.start || '', endText: raw.end || '', start, end, where, action: 'season', drawType: 'new', certainty: raw.certainty, catalogueTitle: '', warnings };
    }

    if (raw.change === 'cancelled' || raw.change === 'changed') {
        action = 'info';
        warnings.push(raw.change === 'cancelled' ? 'Cancelled: remove or edit it in /manage.' : 'A change to something already listed: edit it in /manage.');
    }

    const cat = action === 'draw' || (action === 'info' && raw.kind === 'draw') ? catalogueMatch(raw.name, ctx.catalogue) : null;
    let drawType = raw.change === 'returning' ? 'returning' : 'new';
    if (cat && drawType === 'new') { drawType = 'returning'; warnings.push(`"${cat.title}" is in the draw index, so this is read as a returning draw.`); }

    const pool = (where === 'draft' ? ctx.draft : ctx.live) || {};
    if (action === 'draw') {
        const have = [...(pool.newDraws || []), ...(pool.returningDraws || [])].find(d => sameName(d.title, raw.name) && (!start || !d.date || sameDay(d.date, start)));
        if (have) return { skip: where === 'draft' ? 'already in the Next Season Draft' : 'already on /draws' };
    }
    if (action === 'calendar') {
        const have = (pool.calendar || []).find(e => sameName(e.title, raw.name) && (!start || !e.date || sameDay(e.date, start)));
        if (have) return { skip: where === 'draft' ? 'already in the draft calendar' : 'already on /calendar' };
    }

    let startUsed = start;
    if (!start && (action === 'draw' || action === 'calendar')) {
        if (where === 'draft' && (ctx.draftStart || ctx.liveEnd)) {
            startUsed = new Date(ctx.draftStart || ctx.liveEnd);
            warnings.push('No date in the post: the box uses the next season\'s start. Change it if you know better.');
        } else warnings.push('No date in the post.');
    }
    if (raw.certainty === 'expected') warnings.push('Expected, not confirmed.');

    return {
        kind: raw.kind, change: raw.change, name: raw.name, rewards: raw.rewards || [],
        startText: raw.start || '', endText: raw.end || '', start: startUsed, end,
        where, action, drawType, certainty: raw.certainty, catalogueTitle: cat ? cat.title : '', warnings,
    };
}

// All of a post's items: the ones worth a card, and why the rest are not.
function resolveItems(rawItems, ctx) {
    const card = []; const skipped = [];
    for (const raw of rawItems || []) {
        const r = resolveItem(raw, ctx);
        if (r.skip) skipped.push({ name: raw.name, reason: r.skip });
        else card.push(r);
    }
    return { card, skipped };
}

// ---- what each button fills in ----
const fmtAdmin = d => (d ? dayjs.utc(d).format('MMMM D, YYYY') : '');
const cleanItemName = s => String(s || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
const TIER_LETTER = { mythic: 'm', legendary: 'l', epic: 'e' };
const rewardLines = item => (item.rewards || []).filter(r => r && r.name).map(r => `${TIER_LETTER[r.tier] || 'l'} ${cleanItemName(r.name)}`);

// /manage's Add Draw box (commands/manage.js buildAddDrawModal). A returning draw the index knows leaves the image blank, which reuses the index's image.
function drawPrefill(item, imageUrl) {
    const range = item.start ? fmtAdmin(item.start) + (item.end ? ` - ${fmtAdmin(item.end)}` : '') : '';
    return { title: item.name, date: range, url: item.catalogueTitle ? '' : (imageUrl || ''), items: rewardLines(item).join('\n') };
}

// /manage's Add Calendar Event box (commands/manage.js buildCalendarAddModal).
function calendarPrefill(item) {
    return { title: item.name, startDate: fmtAdmin(item.start), endDate: fmtAdmin(item.end), category: item.kind === 'mode' ? 'playlist' : 'event' };
}

// One line for the Next Season Draft's draws box, in parseBulkDrawList's format: Title, items…, Date, URL. The parser needs at least one item, so a draw whose rewards the post does not list carries a note line, which he edits before saving.
function draftDrawLine(item, imageUrl) {
    const items = rewardLines(item);
    const date = item.start ? fmtAdmin(item.start) + (item.end ? ` - ${fmtAdmin(item.end)}` : '') : 'DATE?';
    const url = item.catalogueTitle ? '' : (imageUrl || '');
    return [cleanItemName(item.name), ...(items.length ? items : ['-# Rewards not listed yet']), date, ...(url ? [url] : [])].join(', ');
}

// One line for the Next Season Draft's calendar box, in parseBulkEvents' format: [e|p] M/D - M/D | Title.
function draftCalendarLine(item) {
    const md = d => dayjs.utc(d).format('M/D');
    const start = item.start ? md(item.start) : '?';
    const end = item.end ? md(item.end) : 'All Season';
    return `${item.kind === 'mode' ? 'p' : 'e'} ${start} - ${end} | ${cleanItemName(item.name)}`;
}

module.exports = { norm, sameName, readDate, resolveItem, resolveItems, catalogueMatch, drawPrefill, calendarPrefill, draftDrawLine, draftCalendarLine };
