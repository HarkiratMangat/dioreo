// utils/draftPaste.js -- Paste Draws and Paste Calendar in the Next Season Draft ADD and UPDATE, never replace (2026-11-09, the /manage audit's findings 1 and 2).
//
// Harkirat, 2026-11-09 17:59 EST: "go ahead with all your findings". The draft's two paste boxes used to open prefilled with the whole staged list and REPLACE it on submit. Two things went wrong with that: past Discord's 4,000 characters a prefilled box throws in discord.js ("Invalid string length"), so the button broke once a season's returning draws grew past it (Season 10's stood at 3,780), and a save went straight through with no preview, where the live Paste Draws and Paste Entries show Added, Changed, Unchanged and Not read first. Now each pasted line is matched to a staged row the way the live preview matches it (the exact title, then the fuzzy match), updates it in place (its _id and news tag kept, so it reads "news, edited by you"), or is added; nothing that is not pasted is touched. Removing goes through Remove Draws and the draft calendar's Remove.
//
// Pure: no database, no Discord. The panel (handlers/manage/seasonPanel/draftEdit.js) resolves pictures and commits; the news card's "Add to Next Season Draft" (handlers/news.js, through the old modal_draft_bulk_* boxes) merges the same way.
const { parseBulkDrawList, parseBulkEvents } = require('./adminParser');
const { bestDrawMatch, fuzzyMatch, isSameDrawTitle } = require('./search');

const norm = (t) => String(t || '').trim().toLowerCase();
const day = (x) => (x ? new Date(x).toISOString().slice(0, 10) : '');
const sameTime = (a, b) => Boolean(a && b) && new Date(a).getTime() === new Date(b).getTime();
const itemsKey = (items) => (items || []).map(i => `${i.tier}|${i.name}`).join(';');
const KEY = { new: 'newDraws', returning: 'returningDraws' };

// The staged row a pasted title means: exact title first, then the fuzzy match the live preview uses (drawsPanel previewDraws). `strict` (a save with no preview: the news card's box) matches only the same draw by name (isSameDrawTitle), so a near name can never rewrite another staged row unseen.
function matchIn(list, title, { strict = false } = {}) {
    const exact = (list || []).find(s => norm(s.title) === norm(title));
    if (exact || strict) return exact || (list || []).find(s => isSameDrawTitle(s.title, title)) || null;
    return bestDrawMatch(list || [], title, x => x.title, (itemTitle, t) => fuzzyMatch(t, itemTitle)) || null;
}
// A picture lookup's value: a url string, or { url, priceType } when the draw index also knew the draw type.
const picUrl = (v) => (v && typeof v === 'object' ? v.url : v) || null;

// What a paste of draws would do. `draft` is the stored draft ({ newDraws, returningDraws, calendar }).
function planDraws(draft, newText, retText, { strict = false } = {}) {
    const out = { added: [], changed: [], same: [], skipped: [], twins: [] };
    for (const [sec, raw] of [['new', newText], ['returning', retText]]) {
        const list = draft?.[KEY[sec]] || [];
        const other = draft?.[KEY[sec === 'new' ? 'returning' : 'new']] || [];
        for (const line of String(raw || '').split('\n').map(x => x.trim()).filter(Boolean)) {
            const [p] = parseBulkDrawList(line);
            if (!p || !p.date) { out.skipped.push(line.slice(0, 80)); continue; }
            const old = matchIn(list, p.title, { strict });
            if (!old) {
                // The same draw staged in the other list would list twice on /draws after Promote: refused here, as the draft's Add Draw refuses it.
                const twin = other.find(d => isSameDrawTitle(d.title, p.title));
                if (twin) { out.twins.push({ sec, title: p.title, staged: twin.title }); continue; }
                out.added.push({ sec, p, line });
                continue;
            }
            const diff = [];
            if (old.title !== p.title) diff.push('title');
            if (day(old.date) !== day(p.date)) diff.push('date');
            if (itemsKey(old.items) !== itemsKey(p.items)) diff.push('items');
            if (p.thumbnailUrl && p.thumbnailUrl !== old.thumbnailUrl) diff.push('picture');
            if (p.priceType && p.priceType !== (old.priceType || '')) diff.push('draw type');
            if (p.endDate) {
                const row = endRowFor(draft, old.title);
                if (!row?.endDate || day(row.endDate) !== day(p.endDate)) diff.push('end date');
            }
            if (diff.length) out.changed.push({ sec, p, old, diff, line });
            else out.same.push(p.title);
        }
    }
    out.count = out.added.length + out.changed.length;
    return out;
}

// The draft calendar's draw row for a draw (isSameDrawTitle, as Needs a Look matches them).
function endRowFor(draft, title) {
    return (draft?.calendar || []).find(c => c.category === 'draw' && isSameDrawTitle(c.title, title)) || null;
}

// The draft's lists after a plan, with `pictures` mapping a plan row's line to its resolved picture (null = none found). A changed row keeps its _id, news tag and picture unless a new one was pasted; an added row needs a picture, as the draft's Add Draw does. End dates go on the draft calendar, as the live paste puts them on /calendar.
function applyDraws(draft, plan, pictures = new Map()) {
    const next = { newDraws: [...(draft?.newDraws || [])], returningDraws: [...(draft?.returningDraws || [])] };
    let calendar = [...(draft?.calendar || [])];
    const touched = new Set();
    let calendarChanged = false;
    const noPicture = [];
    const byDate = (l) => [...l].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    const setEnd = (title, start, end) => {
        if (!end) return;
        const row = calendar.find(c => c.category === 'draw' && isSameDrawTitle(c.title, title));
        if (row && sameTime(row.endDate, end) && !row.isOngoing) return;
        const event = { title: row?.title || title, date: row?.date || start, endDate: end, isOngoing: false, category: 'draw', isDoubleCP: Boolean(row?.isDoubleCP) };
        calendar = row ? calendar.map(c => (c === row ? { ...c, ...event } : c)) : [...calendar, event];
        calendarChanged = true;
    };
    for (const { sec, p, line } of plan.added) {
        const pic = pictures.get(line);
        const url = picUrl(pic) || p.thumbnailUrl || null;
        if (!url) { noPicture.push(p.title); continue; }
        const key = KEY[sec];
        const priceType = p.priceType || (pic && typeof pic === 'object' ? pic.priceType : '') || '';
        next[key] = byDate([...next[key], { title: p.title, items: p.items || [], date: p.date, thumbnailUrl: url, ...(priceType ? { priceType } : {}) }]);
        touched.add(key);
        setEnd(p.title, p.date, p.endDate);
    }
    for (const { sec, p, old, line } of plan.changed) {
        const key = KEY[sec];
        const url = (p.thumbnailUrl && picUrl(pictures.get(line))) || old.thumbnailUrl;
        const row = { ...old, title: p.title, items: p.items || old.items || [], date: p.date, thumbnailUrl: url, ...(p.priceType ? { priceType: p.priceType } : {}) };
        next[key] = byDate(next[key].map(d => (String(d._id) === String(old._id) && d.title === old.title ? row : d)));
        touched.add(key);
        // A renamed draw keeps its calendar row under the new title, so /draws still finds its end date.
        if (old.title !== p.title) {
            const cal = endRowFor({ calendar }, old.title);
            if (cal) { calendar = calendar.map(c => (c === cal ? { ...c, title: p.title } : c)); calendarChanged = true; }
        }
        setEnd(p.title, p.date, p.endDate);
    }
    return { lists: Object.fromEntries([...touched].map(k => [k, next[k]])), calendar: calendarChanged ? byDate(calendar) : null, noPicture };
}

// What a paste of calendar lines would do against the draft calendar.
function planCalendar(draft, raw, { strict = false } = {}) {
    const out = { added: [], changed: [], same: [], skipped: [] };
    const stored = draft?.calendar || [];
    for (const line of String(raw || '').split('\n').map(x => x.trim()).filter(Boolean)) {
        const parsed = parseBulkEvents(line);
        if (!parsed.length) { out.skipped.push(line.slice(0, 80)); continue; }
        for (const e of parsed) {
            const row = { title: e.title, date: e.startDate, endDate: e.isOngoing ? null : e.endDate || null, isOngoing: Boolean(e.isOngoing), category: e.category || 'event', isDoubleCP: Boolean(e.isDoubleCP) };
            const old = matchIn(stored, row.title, { strict });
            if (!old) { out.added.push({ row }); continue; }
            const diff = [];
            if (old.title !== row.title) diff.push('title');
            if (day(old.date) !== day(row.date)) diff.push('start');
            if (Boolean(old.isOngoing) !== row.isOngoing || (!row.isOngoing && day(old.endDate) !== day(row.endDate))) diff.push('end');
            if ((old.category || 'event') !== row.category) diff.push('type');
            if (Boolean(old.isDoubleCP) !== row.isDoubleCP) diff.push('2x CP');
            if (diff.length) out.changed.push({ row, old, diff });
            else out.same.push(row.title);
        }
    }
    out.count = out.added.length + out.changed.length;
    return out;
}
function applyCalendar(draft, plan) {
    let calendar = [...(draft?.calendar || [])];
    for (const { row, old } of plan.changed) calendar = calendar.map(c => (c === old ? { ...old, ...row } : c));
    calendar.push(...plan.added.map(a => a.row));
    return calendar.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
}

module.exports = { planDraws, applyDraws, planCalendar, applyCalendar, endRowFor, matchIn };
