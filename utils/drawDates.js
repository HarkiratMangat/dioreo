// utils/drawDates.js -- a draw's "Start - End" box (2026-11-04 00:58 EST, Harkirat: "do it like how the season title command does start/end dates").
//
// A draw's END date is not a field on the draw: it is the end of the draw's /calendar row (category "draw", matched to the draw by title, utils/drawEndReminder.js calendarRowFor). The Add and Edit Draw forms used to hold only the release date, so an end could be set only through Calendar edit, Quick Add or the reminder button. The date box now takes `September 10, 2026 - November 12, 2026` exactly as the season titles box does (core/ops/season.js applyLine): a single date is the release date alone; a range also sets the end. This file is the pure part: reading the box, writing it back, and deciding which calendar write (if any) the submit needs. Pure on purpose: no database, so scripts/drawDates.test.js can fail it.
const { parseAdminDate, parseAdminDateRange, formatAdminDate } = require('./adminParser');

const ms = (d) => (d ? new Date(d).getTime() : null);
const valid = (d) => Boolean(d) && Number.isFinite(new Date(d).getTime());

// The box's text for a draw: "September 10, 2026 - November 12, 2026" with an end, "September 10, 2026" without, empty with no date. The season box shows the same long form.
function formatDrawDates(start, end) {
    const s = valid(start) ? formatAdminDate(start) : '';
    const e = valid(end) ? formatAdminDate(end) : '';
    return s && e ? `${s} - ${e}` : s;
}

// The same dates in the ISO form Add Multiple's one-line format can read (its fields are split on commas, which the long form contains).
function formatDrawDatesForBulk(start, end) {
    const iso = (d) => new Date(d).toISOString().slice(0, 10);
    if (!valid(start)) return '';
    return valid(end) ? `${iso(start)} - ${iso(end)}` : iso(start);
}

// The box's text -> { ok, start, end } or { ok: false, error }. An end of TBD, or none, is "no end". An end that cannot be read is REPORTED, never dropped: the season box's own rule ("an unparseable date is reported, never silently kept").
function parseDrawDates(text) {
    const raw = String(text || '').trim();
    if (!raw) return { ok: false, error: 'Fill in the release date.' };
    const range = parseAdminDateRange(raw);
    if (range) {
        // A range typed back to front with both years ("November 12, 2026 - September 10, 2026") comes out of the parser in date order, as it does in the season box; a year-less one rolls the end into next year. So there is no end-before-start case to refuse here.
        if (range.endTBD || !range.end) return { ok: true, start: range.start, end: null };
        return { ok: true, start: range.start, end: range.end };
    }
    const start = parseAdminDate(raw);
    if (!start) return { ok: false, error: `Date "${raw}" wasn't understood -- nothing was saved. Type a date, or "start - end".` };
    const after = raw.split(/\s+(?:-|–|—|to)\s+/i)[1];
    if (after !== undefined && !parseAdminDate(after)) return { ok: false, error: `The end date "${after}" wasn't understood -- nothing was saved.` };
    return { ok: true, start, end: null };
}

// The calendar write one submit needs, or null. `row` is the draw's current /calendar draw row (or null); `prev` is what the draw was before this submit ({ title, start }), null for a new draw. Nothing is written when nothing the row cares about changed, so an edit of a draw's items never touches its row. The row follows a rename and a new start, keeps its own title otherwise (a row's title often differs from the draw's), and keeps its Double CP flag.
function planEndRow({ row, prev = null, title, start, end }) {
    if (!row) return end ? { type: 'calendar.add', payload: { title, date: start, endDate: end, isOngoing: false, category: 'draw', isDoubleCP: false } } : null;
    const titleChanged = Boolean(prev) && prev.title !== title;
    const startChanged = Boolean(prev) && ms(prev.start) !== ms(start);
    const endChanged = ms(row.endDate) !== ms(end) || Boolean(row.isOngoing) !== !end;
    if (!titleChanged && !startChanged && !endChanged) return null;
    return {
        type: 'calendar.edit', target: { elementId: String(row._id) },
        payload: { title: titleChanged ? title : row.title, date: start, endDate: end || null, isOngoing: !end, category: 'draw', isDoubleCP: Boolean(row.isDoubleCP) }
    };
}

module.exports = { formatDrawDates, formatDrawDatesForBulk, parseDrawDates, planEndRow };
