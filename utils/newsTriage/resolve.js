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
// A number or numeral names a different item: "Street Fighter Series Armory II" is not the first armory, "Gunsmith Challenge 2" not the first challenge (invariants pass, 2026-11-05 17:06 EST).
const numbersOf = s => (norm(s).match(/\b(\d+|ii|iii|iv|vi|vii|viii|ix)\b/g) || []).sort().join(',');
// The loose match, for finding a draw in the draw index only (catalogueMatch).
function sameName(a, b) {
    const na = norm(a); const nb = norm(b);
    if (!na || !nb || numbersOf(a) !== numbersOf(b)) return false;
    return na === nb || (na.length >= 6 && nb.includes(na)) || (nb.length >= 6 && na.includes(nb));
}
// The strict match, for every decision that skips, fixes or merges a row (moved here from draftMerge.js, 2026-11-05 17:06 EST): the loose one above told "Nuketown Halloween" it was the live Nuketown playlist and "Halloween Sale" the Halloween armory, which skipped the new item or offered to change the wrong row's dates. Containment counts only when the shorter name is most of the longer one; typos count when two edits apart on names of eight letters or more ("Fangs Wars" and "Fang Wars" came in as two rows on the backtest).
function edits(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = cur;
    }
    return prev[b.length];
}
// MP and BR versions of one mode are two items ("Attack of the Undead MP Mode" and "… BR Mode" were two edits apart, so the typo rule merged them; the fresh review R1, 2026-11-05 20:14 EST). A name with no MP or BR still matches either.
const modeOf = s => (norm(s).match(/\b(mp|br)\b/g) || []).sort().join(',');
function strictName(a, b) {
    if (numbersOf(a) !== numbersOf(b)) return false;
    if (modeOf(a) && modeOf(b) && modeOf(a) !== modeOf(b)) return false;
    const x = norm(a).replace(/\s+/g, ''); const y = norm(b).replace(/\s+/g, '');
    if (!x || !y) return false;
    if (x === y) return true;
    const [short, long] = x.length <= y.length ? [x, y] : [y, x];
    if (long.includes(short) && short.length >= 0.8 * long.length) return true;
    return short.length >= 8 && edits(x, y) <= 2;
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
    let d = c.isCertain('hour') && c.isCertain('timezoneOffset') ? c.date() : new Date(Date.UTC(c.get('year'), c.get('month') - 1, c.get('day')));
    // chrono's forwardDate moves a month and day with no year that is already behind the post a year ahead: "live now, 11/5 – 11/19" posted Nov 5 at 15:00 UTC read as Nov 5 2027 (the fresh review R1, 2026-11-05 20:14 EST; a date-only result has an implied noon). A date within four months before the post is the post's own year; a date months ahead ("1/5" posted in December) still moves forward.
    if (!c.isCertain('year') && c.isCertain('month')) {
        const back = new Date(d); back.setUTCFullYear(d.getUTCFullYear() - 1);
        const DAY = 24 * 60 * 60 * 1000;
        if (d - ref > 180 * DAY && ref - back >= 0 && ref - back <= 120 * DAY) d = back;
    }
    return d;
}

// Day-first slash dates (2026-11-04 23:06 EST, the Season 9 backtest). A Halloween sales image listed its offers as "28/10 - 17/11", "03/11 - 12/12"; chrono reads 03/11 as March 11, which sent four live draws into the Season 10 draft months off, with nothing to flag it. A post is day-first when any of its slash dates has a first number over 12; failing that, a slash date that reads months away is swapped when the swap lands near the post.
const SLASH = /\b(\d{1,2})\/(\d{1,2})(\/\d{2,4})?\b/g;
const swapSlash = text => String(text || '').replace(SLASH, (_, a, b, y) => `${b}/${a}${y || ''}`);
function dayFirst(rawItems) {
    return (rawItems || []).some(r => [r.start, r.end].some(t => [...String(t || '').matchAll(SLASH)].some(m => Number(m[1]) > 12 && Number(m[2]) <= 12)));
}
function readSlashDate(text, postedAt, dmy) {
    if (!text || !SLASH.test(String(text))) return readDate(text, postedAt);
    SLASH.lastIndex = 0;
    if (dmy) return readDate(swapSlash(text), postedAt);
    const asIs = readDate(text, postedAt); const swapped = readDate(swapSlash(text), postedAt);
    const away = d => (d ? Math.abs(d - new Date(postedAt)) : Infinity);
    // Swapped only when the written order is over 100 days out and the swap within 45: "12/10" posted 10-07 is Dec 10 (64 days), not Oct 12, and a 60-day cut-off flipped it in the backtest, which drafted the Street Fighter armory ending before it began.
    const DAY = 24 * 60 * 60 * 1000;
    return away(asIs) > 100 * DAY && away(swapped) <= 45 * DAY ? swapped : asIs;
}

function catalogueMatch(name, catalogue) {
    return (catalogue || []).find(d => [d.title, ...(d.aliases || [])].some(t => sameName(t, name))) || null;
}

// A season title is "Season 10 — 7th Anniversary": an em dash, never a colon or a hyphen (Harkirat, 2026-11-04 22:55 EST: "i dont use : in my titles"). Only the season title: draw and event names keep the game's own colons ("Honkai: Gleaming Front").
const seasonTitle = name => String(name || '').replace(/^(Season\s+\d+)\s*[:\-–—]\s*/i, '$1 — ').trim();

// One raw item from utils/newsTriage/model.js → a card item, or `{ skip: reason }`. ctx: { postedAt, liveEnd, liveTitle, draftStart, draftTitle, draftEnd, namesRegion, catalogue: [{ title, aliases }], live: { newDraws, returningDraws, calendar }, draft: { same } }
function resolveItem(raw, ctx) {
    const warnings = [];
    const start = readSlashDate(raw.start, ctx.postedAt, ctx.dayFirst);
    let end = readSlashDate(raw.end, ctx.postedAt, ctx.dayFirst);
    // An end before its start was read in the wrong order (or a year short): try the other order, then a year on.
    if (start && end && end < start) {
        const swapped = readDate(swapSlash(raw.end), ctx.postedAt);
        if (swapped && swapped >= start) end = swapped;
        else if (end.getUTCMonth() < start.getUTCMonth()) end = new Date(Date.UTC(end.getUTCFullYear() + 1, end.getUTCMonth(), end.getUTCDate()));
    }
    let action = ACTION_OF_KIND[raw.kind] || 'info';
    // Another region is dropped only when the post's own words say so (ctx.namesRegion, from filter.js); a region the AI read off the picture alone is shown with a warning instead, because a wrong drop is silent.
    if (raw.region === 'other' && ctx.namesRegion !== false) return { skip: 'another region' };
    if (raw.region === 'other') warnings.push('The AI thinks this may be for another region; the post\'s words do not say so.');
    if (raw.region === 'test' && ctx.namesTestServer !== false) return { skip: 'a test server' };
    if (raw.region === 'test') warnings.push('The AI thinks this was only seen on a test server; the post\'s words do not say so.');
    if (action === 'info') return { skip: 'nothing Dioreo tracks' };

    // Where it goes. A date beats words: a draw dated after this season ends goes to the draft whatever the post calls it.
    let where;
    // Past the Next Season Draft's own season is later, whatever the date rule below says (invariants pass, 2026-11-05 17:11 EST): the 10-08 leak of Season 10, dated November 12, is after Season 8's end, so the date rule sent it to the draft and the Season 9 draft came out titled "Season 10" (the backtest, re-run after the 11:42 change below). The draft holds the next season only: a season numbered past it, or a date on or after the draft season's own end.
    const seasonNo = s => { const m = String(s || '').match(/\bseason\s*(\d+)\b/i); return m ? Number(m[1]) : null; };
    const nextNo = seasonNo(ctx.liveTitle) ? seasonNo(ctx.liveTitle) + 1 : seasonNo(ctx.draftTitle);
    const itemNo = raw.kind === 'season' ? seasonNo(raw.name) : null;
    if ((nextNo && itemNo && itemNo > nextNo) || (start && ctx.draftEnd && start >= new Date(ctx.draftEnd))) where = 'later';
    // "later" decides only when the post gives no date: a date beats words here too (2026-11-05 11:42 EST, the Flex backtest: the AI called Sapphire Winter Draw, dated 8 November, a later season's, and it was dropped).
    if (where === 'later') { /* decided above */ } else if (raw.season === 'later' && !start) where = 'later';
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
        if (ctx.draftTitle && strictName(ctx.draftTitle, raw.name) && (!start || (ctx.draftStart && sameDay(ctx.draftStart, start)))) return { skip: 'already in the Next Season Draft' };
        if (raw.certainty === 'expected') warnings.push('Expected, not confirmed.');
        return { kind: 'season', part: raw.part || 'main', change: raw.change, name: raw.part && raw.part !== 'main' ? String(raw.name || '') : seasonTitle(raw.name), rewards: [], startText: raw.start || '', endText: raw.end || '', start, end, where, action: 'season', drawType: 'new', certainty: raw.certainty, catalogueTitle: '', warnings };
    }

    // A live item the bot already has, whose dates the post moves or completes (2026-11-05 11:06 EST, from his side: "what is the bot WRONG about"). Before, a new end date for a live row was dropped as "already on /draws", and a moved start looked new, so its Add button would have made a second row. Now it is a fix: the card shows the bot's dates beside the post's and opens /manage's Edit box with the post's dates filled in.
    let fix = null;
    if (where === 'live' && raw.change !== 'cancelled' && (action === 'draw' || action === 'calendar')) {
        fix = liveFix(raw, start, end, action, ctx.live || {});
        if (fix && fix.skip) return fix;
        if (fix) warnings.push(`On the bot: ${span(fix.curStart, fix.curEnd)}. The post says: ${span(start || fix.curStart, end || fix.curEnd)}.`);
    }
    if (raw.change === 'cancelled' || (raw.change === 'changed' && !fix)) {
        action = 'info';
        warnings.push(raw.change === 'cancelled' ? 'Cancelled: remove or edit it in /manage.' : 'A change to something already listed: edit it in /manage.');
    }

    const cat = action === 'draw' || (action === 'info' && raw.kind === 'draw') ? catalogueMatch(raw.name, ctx.catalogue) : null;
    let drawType = raw.change === 'returning' ? 'returning' : 'new';
    if (cat && drawType === 'new') { drawType = 'returning'; warnings.push(`"${cat.title}" is in the draw index, so this is read as a returning draw.`); }

    const pool = (where === 'draft' ? ctx.draft : ctx.live) || {};
    // When the draft is filled automatically (draftMerge.js), an item already in the draft is not dropped here: the merge decides whether it updates the row (a later post with its end date, an official post over a leak). Dropping it lost Leader's Kill Confirmed's end date in the backtest.
    const merging = ctx.autoDraft && where === 'draft';
    if (action === 'draw') {
        const have = [...(pool.newDraws || []), ...(pool.returningDraws || [])].find(d => strictName(d.title, raw.name) && (!start || !d.date || sameDay(d.date, start)));
        if (have && !merging && !fix) return { skip: where === 'draft' ? 'already in the Next Season Draft' : 'already on /draws' };
    }
    if (action === 'calendar') {
        const have = (pool.calendar || []).find(e => strictName(e.title, raw.name) && (!start || !e.date || sameDay(e.date, start)));
        if (have && !merging && !fix) return { skip: where === 'draft' ? 'already in the draft calendar' : 'already on /calendar' };
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
        kind: raw.kind, change: raw.change, name: cat ? cat.title : raw.name, rewards: raw.rewards || [],
        startText: raw.start || '', endText: raw.end || '', start: startUsed, end,
        where, action: fix ? 'fix' : action, drawType, certainty: raw.certainty, catalogueTitle: cat ? cat.title : '', warnings, doubleCP: Boolean(raw.doubleCP),
        ...(fix ? { fixList: fix.fixList, fixId: fix.fixId, fixDrawType: fix.fixDrawType, curStart: fix.curStart, curEnd: fix.curEnd } : {}),
    };
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const short = d => { if (!d) return '?'; const x = new Date(d); return `${MON[x.getUTCMonth()]} ${x.getUTCDate()}`; };
const span = (a, b) => `${short(a)}${b ? ` – ${short(b)}` : ''}`;

// The live row(s) an item names, and whether the post moves or completes their dates. null when the bot does not have it; { skip } when it has it with the same dates.
function liveFix(raw, start, end, action, live) {
    const drawLists = action === 'draw' ? [['newDraws', 'new'], ['returningDraws', 'returning']] : [];
    let drawRow = null; let drawType = '';
    for (const [list, type] of drawLists) { const r = (live[list] || []).find(d => strictName(d.title, raw.name)); if (r) { drawRow = r; drawType = type; break; } }
    const category = action === 'draw' ? 'draw' : (raw.kind === 'mode' ? 'playlist' : 'event');
    const calRow = (live.calendar || []).find(e => strictName(e.title, raw.name) && (e.category || 'event') === category);
    if (!drawRow && !calRow) return null;
    const curStart = (drawRow && drawRow.date) || (calRow && calRow.date) || null;
    const curEnd = calRow && !calRow.isOngoing ? (calRow.endDate || null) : null;
    const startMoved = start && curStart && !sameDay(start, curStart);
    const endNew = end && (!curEnd || !sameDay(end, curEnd));
    if (!startMoved && !endNew) return { skip: action === 'draw' ? 'already on /draws' : 'already on /calendar' };
    return { fixList: drawRow ? (drawType === 'new' ? 'newDraws' : 'returningDraws') : 'calendar', fixId: String((drawRow || calRow)._id || ''), fixDrawType: drawType, curStart, curEnd };
}

// All of a post's items: the ones worth a card, and why the rest are not.
function resolveItems(rawItems, ctx) {
    const card = []; const skipped = [];
    const postCtx = { ...ctx, dayFirst: dayFirst(rawItems) };
    for (const raw of rawItems || []) {
        const r = resolveItem(raw, postCtx);
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

module.exports = { dayFirst, readSlashDate, seasonTitle, norm, sameName, strictName, readDate, resolveItem, resolveItems, catalogueMatch, drawPrefill, calendarPrefill, draftDrawLine, draftCalendarLine };
