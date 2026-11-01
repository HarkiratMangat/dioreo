// utils/quickAdd.js -- /manage draws' Quick Add (2026-11-01, Harkirat: "a large text field form, where I just type the draw name or item name (plus a start and/or end date. One per line"). This file is the PURE half: reading a line, finding the draw in the draw index (models/DrawCatalog.js), and turning both into a draft draw. handlers/manage/quickAdd.js owns the pop-ups, the draft panel and the save. Nothing here touches the database or Discord, so scripts/quickAdd.test.js runs it with no connection.
//
// A LINE is a name, then dates, separated by commas: "cx9 mythic draw, starts in 2 days, ends Nov 5" · "Herrscher armory, ends in 28 days" · "Herrscher of reason, ends Nov 12 7pm edt". The words starts/from/releases and ends/until/till say which date is which; an unlabelled date is the start, and a second one the end. "starts ... ends ..." with no comma also works.
//
// DATES (Harkirat, 2026-11-01 11:50 EDT): a date with no time is that day at 00:00 UTC, the admin-date rule (utils/adminParser.js parseAdminDate). A time with no zone is Toronto time. A typed zone is read as that region's own clock, so a wrong summer/winter letter still lands right: "Nov 12 7pm edt" is 7pm Toronto, which is EST by then (his words: "use the correct one, even if the wrong one is typed"). Relative words ("in 2 days", "tomorrow") count from Toronto's day.
const chrono = require('chrono-node');
const { zoneReference, componentInstant } = require('./timestampHelper');

const MAX_LINES = 10;
const TIME_ZONE = 'America/Toronto';   // a typed time with no zone   // one draft panel: 3 components a draw, under Discord's 40 (handlers/manage/quickAdd.js)

// ==========================================
// READING A LINE
// ==========================================
const START_WORDS = /^(?:starts?|starting|started|from|begins?|beginning|releases?|releasing|released|launch(?:es|ing)?|live|goes live|out)\b\s*(?:on|at|in)?\s*/i;
const END_WORDS = /^(?:ends?|ending|ended|until|till|til|leaves?|leaving|closes?|closing|expires?|expiring)\b\s*(?:on|at)?\s*/i;
// Where a date starts inside a segment that has no comma before it ("herrscher armory ends in 28 days"). `from` and `out` are left out on purpose: both turn up in draw names.
const MID_SPLIT = /\s+(?=(?:starts?|starting|begins?|releases?|ends?|ending|until|till|leaves?|leaving)\b)/i;
// A comma-split tail that belongs to the segment before it: the year of "Nov 5, 2026" or the time of "Nov 12, 7pm".
const DATE_TAIL = /^(?:\d{4}|\d{1,2}(?::\d{2})?\s*(?:am|pm)?(?:\s+[a-z]{2,5})?)$/i;

function splitLine(line) {
    const parts = [];
    for (const raw of String(line || '').split(',')) {
        const p = raw.trim();
        if (!p) continue;
        if (parts.length > 1 && DATE_TAIL.test(p)) parts[parts.length - 1] += ` ${p}`;
        else parts.push(...p.split(MID_SPLIT).map(s => s.trim()).filter(Boolean));
    }
    return parts;
}

// The North American zone words, each read as its region's clock rather than a fixed offset, so "edt" in winter is still Toronto. GMT is UTC here (utils/timezoneData.js maps it to London, which is BST all summer). Any other name goes through exactTimezone ("tokyo", "ist").
const REGION_ZONES = {
    et: 'America/Toronto', est: 'America/Toronto', edt: 'America/Toronto', eastern: 'America/Toronto',
    ct: 'America/Chicago', cst: 'America/Chicago', cdt: 'America/Chicago', central: 'America/Chicago',
    mt: 'America/Denver', mst: 'America/Denver', mdt: 'America/Denver', mountain: 'America/Denver',
    pt: 'America/Los_Angeles', pst: 'America/Los_Angeles', pdt: 'America/Los_Angeles', pacific: 'America/Los_Angeles',
    gmt: 'Etc/UTC', utc: 'Etc/UTC', z: 'Etc/UTC'
};
// "Nov 12 7pm edt" -> { zone: 'America/Toronto', rest: 'Nov 12 7pm' }; null when the phrase has no time or ends in no zone name.
function typedZone(text) {
    const t = String(text || '').trim();
    if (!/\d|noon|midnight/i.test(t)) return null;
    const words = t.split(/\s+/);
    const { exactTimezone } = require('./timezoneData');
    for (const n of [2, 1]) {
        if (words.length <= n) continue;
        const name = words.slice(-n).join(' ').toLowerCase();
        const zone = REGION_ZONES[name] || (/^[a-z][a-z ]+$/.test(name) ? exactTimezone(name) : null);
        if (zone) return { zone, rest: words.slice(0, -n).join(' ') };
    }
    return null;
}

// One date phrase -> { date, timed } or null. `zone` is the zone for a time typed with none.
function readWhen(text, { zone = TIME_ZONE, now = new Date() } = {}) {
    const typed = typedZone(text);
    const z = typed ? typed.zone : zone;
    const r = chrono.parse(typed ? typed.rest : String(text || ''), zoneReference(z, now), { forwardDate: true })[0];
    if (!r) return null;
    const c = r.start;
    if (c.isCertain('hour')) return { date: componentInstant(c, z).toDate(), timed: true };
    return { date: new Date(Date.UTC(c.get('year'), c.get('month') - 1, c.get('day'))), timed: false };
}

// Today at 00:00 UTC, as the admin's own calendar day: the start a line with no start gets.
function todayUtc({ zone = TIME_ZONE, now = new Date() } = {}) {
    return readWhen('today', { zone, now }).date;
}

// "cx9 mythic draw, starts in 2 days, ends Nov 5" -> { query, start, end, problems }. start/end are { date, timed } or null.
function parseQuickLine(line, opts = {}) {
    const parts = splitLine(line);
    const out = { line: String(line || '').trim(), query: '', start: null, end: null, problems: [] };
    if (!parts.length) return out;
    // The name is the first part, unless the line opens with a date word ("ends Nov 5, herrscher armory" is not a shape anyone types).
    out.query = parts.shift();
    for (const part of parts) {
        let slot = null, text = part;
        if (START_WORDS.test(part)) { slot = 'start'; text = part.replace(START_WORDS, ''); }
        else if (END_WORDS.test(part)) { slot = 'end'; text = part.replace(END_WORDS, ''); }
        const when = readWhen(text, opts);
        if (!when) { out.problems.push(`Couldn't read "${part}" as a date.`); continue; }
        if (!slot) slot = out.start ? 'end' : 'start';
        if (out[slot]) { out.problems.push(`Two ${slot} dates; kept the first.`); continue; }
        out[slot] = when;
    }
    if (out.start && out.end && out.end.date <= out.start.date) out.problems.push('The end is not after the start.');
    return out;
}

// ==========================================
// FINDING THE DRAW
// ==========================================
// Words that say nothing about WHICH draw: every title has one of them.
const STOP = new Set(['draw', 'draws', 'drop', 'the', 'of', 'a', 'an', 'and', 'lucky', 'series', 'crate', 'bundle']);
const TIERS = new Set(['mythic', 'legendary', 'epic']);
// Words that name a KIND of item ("mythic character"): like a rarity, they narrow the list but name no draw on their own.
const KINDS = { character: 'character', char: 'character', operator: 'character', weapon: 'weapon', gun: 'weapon', vehicle: 'vehicle' };
const describes = w => TIERS.has(w) || Boolean(KINDS[w]);
const MAX_CANDIDATES = 24;   // the Pick box's dropdown holds 25: these plus "keep as typed"
// "Herrscher's" -> herrscher, "CX-9" -> cx9, "Armories" -> armory. A light stem so a plural or a possessive still meets its word.
function stem(word) {
    let w = word.toLowerCase().replace(/['’]s$/, '').replace(/[^\p{L}\p{N}]/gu, '');
    if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
    else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
    return w;
}
const words = text => String(text || '').split(/\s+/).map(stem).filter(w => w && !STOP.has(w));

// A typo: one slip in a word of 5 or 6 letters, two in a longer one ("hersher" -> herrscher, "visge" -> visage, "armroy" -> armory). A swapped pair of letters counts as one slip.
function near(a, b) {
    const n = Math.min(a.length, b.length);
    // Four letters or fewer must be exact: "here" is one slip from "hero".
    if (n < 5) return false;
    const max = n >= 7 ? 2 : 1;
    if (Math.abs(a.length - b.length) > max) return false;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
    }
    return d[a.length][b.length] <= max;
}

// How well one catalog document answers the query's words. Each word is worth 2 when it is in the title or another name, 1.5 in an item's name, 1 when it is a rarity one of the items has; a word found nowhere is a miss. `cover` (how much of the title the query names) breaks ties, so "Herrscher of Reason" prefers the draw with that title over the armory whose item is "Core of Reason".
function scoreEntry(entry, queryWords) {
    const titleWords = new Set([entry.title, ...(entry.aliases || [])].flatMap(words));
    const itemWords = new Set((entry.items || []).flatMap(i => words(`${i.baseName || ''} ${i.skinName || ''} ${i.name || ''}`)));
    const tiers = new Set((entry.items || []).map(i => i.tier));
    const kinds = new Set((entry.items || []).map(i => i.kind));
    let points = 0, misses = 0, inTitle = 0;
    for (const w of queryWords) {
        if (titleWords.has(w)) { points += 2; inTitle++; }
        else if (itemWords.has(w)) points += 1.5;
        else if (TIERS.has(w) && tiers.has(w)) points += 1;
        else if (KINDS[w] && kinds.has(KINDS[w])) points += 1;
        else if ([...titleWords].some(t => near(w, t))) { points += 1.75; inTitle++; }
        else if ([...itemWords].some(t => near(w, t))) points += 1.25;
        else misses++;
    }
    const ownTitle = words(entry.title);
    const cover = ownTitle.length ? ownTitle.filter(w => queryWords.includes(w)).length / ownTitle.length : 0;
    return { score: points / (2 * queryWords.length), misses, inTitle, cover };
}

// The draws a list of words fits, best first, one per group (the Street Fighter pair share their items: the group's own document stands for both, as utils/drawCatalog.js matchByItems does).
function rank(entries, queryWords) {
    const ranked = entries
        .map(entry => ({ entry, ...scoreEntry(entry, queryWords) }))
        // At least half the words, and at least one of them in a title or an item (a lone "mythic" names nothing).
        .filter(r => r.misses * 2 <= queryWords.length && (r.inTitle > 0 || r.score >= 0.5))
        .sort((a, b) => a.misses - b.misses || b.score - a.score || b.cover - a.cover
            || Number(b.entry.slug === b.entry.groupSlug) - Number(a.entry.slug === a.entry.groupSlug));
    const groups = new Set();
    return ranked.filter(r => !groups.has(r.entry.groupSlug || r.entry.slug) && groups.add(r.entry.groupSlug || r.entry.slug));
}

// The query as typed, and with each pair of neighbouring words joined: "were soldier" also tries "weresoldier".
function joinedVariants(queryWords) {
    const out = [queryWords];
    for (let i = 0; i < queryWords.length - 1; i++) out.push([...queryWords.slice(0, i), queryWords[i] + queryWords[i + 1], ...queryWords.slice(i + 2)]);
    return out;
}

// Only rarity and kind words ("mythic character", "legendary weapon draw"): every draw with an item that is both, newest season first. These name no one draw, so the draft asks him to pick (his ask, 2026-11-01: "a dropdown list of the 25 more relevant mythic character draws").
function describedDraws(entries, queryWords) {
    const tiers = queryWords.filter(w => TIERS.has(w));
    const kinds = queryWords.map(w => KINDS[w]).filter(Boolean);
    const fits = entries.filter(e => (e.items || []).some(i => (!tiers.length || tiers.includes(i.tier)) && (!kinds.length || kinds.includes(i.kind))));
    const groups = new Set();
    return fits
        .sort((a, b) => (b.releaseSeason || 0) - (a.releaseSeason || 0) || Number(b.slug === b.groupSlug) - Number(a.slug === a.groupSlug) || a.title.localeCompare(b.title))
        .filter(e => !groups.has(e.groupSlug || e.slug) && groups.add(e.groupSlug || e.slug));
}

// The draw a line names. -> { entry, matchedBy: 'title'|'alias'|'words'|null, alternates: [title], sure, candidates: [entry] } or null.
//   sure        false when the best answer missed a word or another draw scored within 0.1 of it
//   candidates  when not sure, the draws the words fit (at most MAX_CANDIDATES), for the draft's Pick box
//   entry null  the words only describe ("mythic character"): no guess, only candidates
function findCatalogDraw(entries, query) {
    const { matchByName } = require('./drawCatalog');
    const named = matchByName(entries, query) || matchByName(entries, `${query} Draw`);
    if (named) return { ...named, alternates: [], sure: true, candidates: [] };
    const queryWords = words(query);
    if (!queryWords.length) return null;
    if (queryWords.every(describes)) {
        const candidates = describedDraws(entries, queryWords).slice(0, MAX_CANDIDATES);
        return candidates.length ? { entry: null, matchedBy: null, alternates: [], sure: false, candidates } : null;
    }
    // The typed words first; a joined pair only when it fits better (fewer missed words, or a higher score).
    let ranked = null;
    for (const variant of joinedVariants(queryWords)) {
        const r = rank(entries, variant);
        if (!r.length) continue;
        if (!ranked || r[0].misses < ranked[0].misses || (r[0].misses === ranked[0].misses && r[0].score > ranked[0].score)) ranked = r;
    }
    if (!ranked) return null;
    const best = ranked[0];
    // Other draws the words fit nearly as well. Within 0.1 of the best score the pick is a coin toss, so the draft asks for a look.
    const others = ranked.slice(1).filter(r => r.misses === best.misses && r.score >= best.score - 0.25);
    const close = others.some(r => best.score - r.score < 0.1);
    const sure = best.misses === 0 && !close;
    return { entry: best.entry, matchedBy: 'words', alternates: others.slice(0, 3).map(r => r.entry.title), sure, candidates: sure ? [] : ranked.slice(0, MAX_CANDIDATES).map(r => r.entry) };
}

// ==========================================
// THE DRAFT
// ==========================================
// "Season 9 — Hunger Eternal" -> 9; null when the title carries no number.
function seasonNumber(title) {
    const m = /season\s*(\d+)/i.exec(String(title || ''));
    return m ? Number(m[1]) : null;
}

// A catalog document's items as /draws stores them: { tier, name } plus its notes as `-#` comment lines.
function drawItemsFromEntry(entry) {
    const items = (entry.items || []).map(i => ({ tier: i.tier, name: i.name }));
    return [...items, ...(entry.comments || []).map(c => ({ tier: 'comment', name: c }))];
}

// One parsed line, matched, as the draft draw the panel shows and the save writes.
//   seasonalDoc  the live SeasonalData (for the current season and the draws already on /draws)
//   isSameTitle  utils/search.js isSameDrawTitle, passed in so this file needs no database module
//   pick         the draw he picked in the Pick box (a catalog document), or TYPED for "keep as typed"; skips the search
const TYPED = Symbol('typed');
function draftFromLine(parsed, { entries = [], seasonalDoc = {}, isSameTitle = (a, b) => a === b, zone, now, pick = null } = {}) {
    const found = !pick && parsed.query ? findCatalogDraw(entries, parsed.query) : null;
    const entry = pick ? (pick === TYPED ? null : pick) : found?.entry || null;
    const title = entry ? entry.title : titleCase(parsed.query);
    const listed = [['new', seasonalDoc.newDraws || []], ['returning', seasonalDoc.returningDraws || []]]
        .flatMap(([category, list]) => list.filter(d => isSameTitle(d.title, title)).map(d => ({ category, draw: d })))[0] || null;
    const current = seasonNumber(seasonalDoc.currentSeasonTitle);
    // New when the index says the draw was first released this season, or when the index has never seen it; every other draw it knows is coming back.
    const category = listed ? listed.category : entry ? (entry.releaseSeason && entry.releaseSeason === current ? 'new' : 'returning') : 'new';
    return {
        line: parsed.line,
        query: parsed.query,
        title,
        items: listed ? listed.draw.items || [] : entry ? drawItemsFromEntry(entry) : [],
        priceType: listed?.draw.priceType || entry?.priceType || '',
        imageUrl: listed?.draw.thumbnailUrl || entry?.imageUrl || null,
        category,
        // A draw already on /draws keeps its own start unless the line gave one.
        start: parsed.start ? parsed.start.date : listed ? listed.draw.date : todayUtc({ zone, now }),
        startGiven: Boolean(parsed.start),
        startTimed: Boolean(parsed.start?.timed),
        end: parsed.end ? parsed.end.date : null,
        endTimed: Boolean(parsed.end?.timed),
        matchedBy: pick ? (entry ? 'picked' : null) : found?.matchedBy || null,
        sure: pick ? true : found ? found.sure : false,
        alternates: found?.alternates || [],
        // The Pick box's list (slugs), while the match is a guess or there is none; and whether the draw is still unchosen ("mythic character"), which Save skips.
        candidates: found && !found.sure ? found.candidates.map(e => e.slug) : [],
        needsPick: Boolean(found && !found.entry),
        existing: listed ? { category: listed.category, elementId: String(listed.draw._id), title: listed.draw.title } : null,
        problems: [...parsed.problems]
    };
}

// The lines of the Quick Add box -> { drafts, extra }: at most MAX_LINES drafts, `extra` counting the lines left over.
function parseQuickText(text) {
    const lines = String(text || '').split('\n').map(l => l.trim()).filter(Boolean);
    return { lines: lines.slice(0, MAX_LINES), extra: Math.max(0, lines.length - MAX_LINES) };
}

// "cx9 mythic draw" -> "Cx9 Mythic Draw": the title a draw the index does not know is saved under (draw.add title-cases it again, core/ops/draws.js).
function titleCase(s) {
    return String(s || '').trim().replace(/\s+/g, ' ').replace(/(^|\s)(\S)/g, (m, sp, c) => sp + c.toUpperCase());
}

// The draft's items as the Edit box's text, one per line in the Add Draw box's format ("legendary CX-9 - Lethal Hollow", "-# a note").
function itemsToText(items) {
    return (items || []).map(i => i.tier === 'comment' ? `-# ${i.name}` : `${i.tier} ${i.name}`).join('\n');
}

module.exports = {
    TIME_ZONE, TYPED, typedZone, near, MAX_CANDIDATES,
    MAX_LINES, splitLine, readWhen, todayUtc, parseQuickLine, parseQuickText, stem, words, scoreEntry, findCatalogDraw,
    seasonNumber, drawItemsFromEntry, draftFromLine, itemsToText, titleCase
};
