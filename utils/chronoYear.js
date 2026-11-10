// utils/chronoYear.js -- a month and day typed with no year that has already passed stays in THIS year (2026-11-09, his Quick Add screenshot). chrono's forwardDate moves any month and day behind the reference a whole year ahead, so "starts nov 9" typed at 7:18 PM Toronto on Nov 9 (already Nov 10 in UTC) saved as Nov 9 2027, and "starts oct 30" did the same at any hour. News triage met the same trap first (utils/newsTriage/resolve.js, review R1, 2026-11-05). The rule, shared: a date with no typed year that forwardDate put more than 180 days ahead comes back a year when that lands it no more than `backDays` before the reference.
const DAY = 24 * 60 * 60 * 1000;

function pullBackYear(component, date, ref, { backDays = 120 } = {}) {
    if (!date || !component || component.isCertain('year') || !component.isCertain('month')) return date;
    const back = new Date(date);
    back.setUTCFullYear(date.getUTCFullYear() - 1);
    const at = new Date(ref).getTime();
    if (date - at > 180 * DAY && at - back >= 0 && at - back <= backDays * DAY) return back;
    return date;
}

module.exports = { pullBackYear };
