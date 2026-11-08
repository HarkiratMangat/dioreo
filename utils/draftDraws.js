// utils/draftDraws.js -- one draw at a time in the Next Season Draft (2026-11-08 12:27 EST).
//
// Harkirat, 2026-11-08 11:52 EST: "i want a better draws drafting method. i basically want a version of the new/returning draws panel but with the design/mix of how the /draw calculator handles the \"draw selections/edit\" panel. so I'm able to add draws or delete draws 1 by 1 or also bulk paste." Pure: a staged list in, the next list out. The season panel commits the result through season.bulkDraftDraws' `parsed` path, which sets the list as given, so every untouched row keeps its _id, picture and news tag, and Revert puts the old list back. Only the row added or edited is parsed and its picture resolved, by the caller.
const { formatDrawsAsBulkText } = require('./adminParser');

const idOf = (d) => String(d?._id || '');
const byDate = (list) => [...list].sort((a, b) => (a.date ? new Date(a.date).getTime() : Infinity) - (b.date ? new Date(b.date).getTime() : Infinity));

// One draw as the single bulk line the parser reads: Title, type: x, items..., date, image. Items come one per line from the pop-up.
function lineFor({ title, type, items, date, image }) {
    const itemParts = String(items || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
    return [String(title || '').trim(), type ? `type: ${String(type).trim()}` : null, ...itemParts, String(date || '').trim(), String(image || '').trim()].filter(Boolean).join(', ');
}
// A stored draw's items, one per line, for the Edit pop-up. Each item through the bulk formatter on its own, so its tier shorthand is the parser's own; a whole line cannot be split on commas, because its date has one ("November 12, 2026").
function itemLines(draw) {
    const head = 'X, ';
    return (draw.items || []).map(item => {
        const line = formatDrawsAsBulkText([{ title: 'X', items: [item], date: new Date(0), thumbnailUrl: '' }]);
        return line.slice(head.length, line.lastIndexOf(', January 1, 1970'));
    }).join('\n');
}
function addDraw(list, draw) { return byDate([...(list || []), draw]); }
// Edit keeps the row's _id and its news tag, so the row reads "news, edited by you" (its sig no longer matches) and news triage leaves it alone.
function editDraw(list, id, draw) {
    const at = (list || []).findIndex(d => idOf(d) === String(id));
    if (at < 0) return null;
    const old = list[at];
    const next = { ...draw, _id: old._id, ...(old.newsSource ? { newsSource: old.newsSource } : {}) };
    return byDate(list.map((d, i) => (i === at ? next : d)));
}
function removeDraws(list, ids) {
    const gone = new Set((ids || []).map(String));
    return (list || []).filter(d => !gone.has(idOf(d)));
}

module.exports = { lineFor, itemLines, addDraw, editDraw, removeDraws, byDate };
