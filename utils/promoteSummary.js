// What Promote to Live carried over from the live season (2026-11-11 21:36 EST): core/ops/season.js's promoteDraft adds any live draw or /calendar row still running at the season start that the draft lacked, and both the Promote result and the auto-promote owner DM name them, so nothing joins the new season unseen.
function carriedLine(carried) {
    const list = (carried || []).filter(c => c && c.title);
    if (!list.length) return '';
    const draws = list.filter(c => c.list !== 'calendar').map(c => c.title);
    const rows = list.filter(c => c.list === 'calendar').map(c => c.title);
    const names = [...new Set([...draws, ...rows])];
    const shown = names.slice(0, 12).join(', ') + (names.length > 12 ? ` and ${names.length - 12} more` : '');
    return `Carried over from the live season because they were still running: ${shown}.`;
}

module.exports = { carriedLine };
