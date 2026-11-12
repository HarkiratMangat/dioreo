// What Promote to Live will do that is worth a look first (2026-11-11 21:40 EST, Harkirat: "this is something the season draft should have brought up to me before it went live, for me to review"). Read off the season document (and the draw index when given), with no database or Discord of its own, so the review screen (handlers/manage/seasonPanel), the auto-promote owner DM (utils/autoPromote.js) and the day-before promote check (utils/newsTriage/pipeline.js) all list the same things.
//   carried   live draws and /calendar rows still running at the season start that the draft lacks: Promote carries them over (core/ops/season.js, the same planCarryOver)
//   twins     two rows that look like the same thing ("Ford Table Tactics Offer" and "… Event"), and draws that are the same draw (utils/search.js isSameDrawTitle)
//   seam      rows ending a day or so before or after the Battle Pass ends (the Dec 9 / Dec 10 case)
//   noEnd     rows with no end date that are not All Season
//   index     staged draws whose items or draw type disagree with their draw index entry
const DAY_MS = 24 * 60 * 60 * 1000;
// Words that name what a row is rather than which one it is: "Ford Table Tactics Offer" and "Ford Table Tactics Event" are the same thing.
const GENERIC = new Set(['offer', 'event', 'events', 'draw', 'draws', 'bundle', 'sale', 'pack', 'store', 'the', 'a', 'an', 'limited', 'special', 'mode', 'playlist']);
const core = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w && !GENERIC.has(w)).join(' ');
const day = (x) => (x ? new Date(x).toISOString().slice(0, 10) : '');
const short = (x) => (x ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date(x).getUTCMonth()]} ${new Date(x).getUTCDate()}` : '');

// The draft as Promote will put it live: the final carry-over applied to a copy, cutoff the Battle Pass start or now.
function draftAfterCarry(doc, now = new Date()) {
    const draft = doc?.draft || {};
    const { planCarryOver, applyDraftChanges } = require('./newsTriage/draftMerge');
    const work = { ...draft, bpStart: draft.bpStart || now, newDraws: [...(draft.newDraws || [])], returningDraws: [...(draft.returningDraws || [])], calendar: [...(draft.calendar || [])] };
    const { applied } = applyDraftChanges(work, planCarryOver(work, doc || {}).changes);
    return { work, carried: applied.filter(c => c.type === 'add').map(c => ({ list: c.list, title: c.name })) };
}

function pairs(rows, same) {
    const out = [];
    for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) if (same(rows[i], rows[j])) out.push([rows[i].title, rows[j].title]);
    return out;
}

function promoteReview(doc, { now = new Date(), catalog = null } = {}) {
    const draft = doc?.draft || {};
    if (!draft.active) return null;
    const { work, carried } = draftAfterCarry(doc, now);
    const { isSameDrawTitle } = require('./search');
    const cal = work.calendar || [];
    const draws = [...(work.newDraws || []), ...(work.returningDraws || [])];
    // Calendar rows: the same core words under another title, or the same title twice in one category. Draws: the same draw twice across both lists.
    const twins = [
        ...pairs(cal, (a, b) => (core(a.title) && core(a.title) === core(b.title) && a.title !== b.title) || (a.title === b.title && (a.category || 'event') === (b.category || 'event'))),
        ...pairs(draws, (a, b) => a.title === b.title || isSameDrawTitle(a.title, b.title) || (core(a.title) && core(a.title) === core(b.title))),
    ];
    const bpEnd = draft.bpEndTBD || !draft.bpEnd ? null : new Date(draft.bpEnd);
    const seam = bpEnd ? cal.filter(r => r.endDate && !r.isOngoing && day(r.endDate) !== day(bpEnd) && Math.abs(new Date(r.endDate) - bpEnd) <= 1.5 * DAY_MS)
        .map(r => ({ title: r.title, end: short(r.endDate), bpEnd: short(bpEnd), before: new Date(r.endDate) < bpEnd })) : [];
    const noEnd = cal.filter(r => !r.endDate && !r.isOngoing).map(r => r.title);
    const index = [];
    if (Array.isArray(catalog) && catalog.length) {
        const { matchByName } = require('./drawCatalog');
        const names = (items) => (items || []).filter(i => i && i.tier !== 'comment' && i.name).map(i => String(i.name).toLowerCase().trim()).sort().join('|');
        for (const d of draws) {
            const hit = matchByName(catalog, d.title);
            if (!hit) continue;
            const what = [];
            if (d.priceType && hit.entry.priceType && d.priceType !== hit.entry.priceType) what.push('draw type');
            if ((d.items || []).length && (hit.entry.items || []).length && names(d.items) !== names(hit.entry.items)) what.push('items');
            if (what.length) index.push({ title: d.title, what });
        }
    }
    return { carried, twins, seam, noEnd, index, cutoff: draft.bpStart || now };
}

const names = (l, max = 8) => (l.length > max ? `${l.slice(0, max).join(', ')} and ${l.length - max} more` : l.join(', '));
// One line per finding, for a DM or a card. Empty when there is nothing.
function reviewLines(r) {
    if (!r) return [];
    const out = [];
    if (r.carried.length) out.push(`Carried over from the live season, still running at the start: ${names([...new Set(r.carried.map(c => c.title))])}`);
    for (const [a, b] of r.twins.slice(0, 6)) out.push(`Looks like the same thing twice: ${a} · ${b}`);
    if (r.twins.length > 6) out.push(`…and ${r.twins.length - 6} more look-alike pairs`);
    for (const s of r.seam.slice(0, 6)) out.push(`${s.title} ends ${s.end}, a day ${s.before ? 'before' : 'after'} the Battle Pass (${s.bpEnd})`);
    if (r.noEnd.length) out.push(`No end date and not All Season: ${names(r.noEnd)}`);
    for (const x of r.index.slice(0, 6)) out.push(`${x.title}: its ${x.what.join(' and ')} ${x.what.length > 1 ? 'differ' : 'differs'} from the draw index`);
    return out;
}

module.exports = { promoteReview, reviewLines, draftAfterCarry, core };
