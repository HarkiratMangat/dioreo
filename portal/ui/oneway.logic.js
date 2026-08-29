// portal/ui/oneway.logic.js — classic <script> in the browser, CommonJS in Node.
//
// 🔴 SEVEN TIER-3 OPERATIONS EXISTED IN core/ops AND NOT ONE WAS REACHABLE FROM THE PORTAL. The permission that governs them is fully built — utils/adminAccess.js's `destructive` token, deliberately excluded from `all`, grantable only by the owner — and so is the commit gate that refuses an unexported one. The affordance to run a single one of them was never built, so the whole capability was a model with no surface: an owner could grant somebody the right to purge the season and neither of them could find the button.
//
// ⚠️ ALL OF THEM LIVE ON SEASON. draws, calendar and patch notes are Season's data, and the two season-lifecycle ops are Season's by definition — so this is one strip on one realm, not a component every realm mounts. That is a fact about the data rather than a design choice, and if a tier-3 op ever lands on another entity this list is where it will show up missing.

// 🔴 THE DRAFT ARRIVES SEPARATELY AND THE FIRST VERSION OF THIS READ IT OFF `live`. portal/api/season.js destructures it out — `const { draft, _id, __v, ...live } = doc` — so `live.draft` is ALWAYS undefined and the promote row said "No draft is active" over an active draft, permanently. The test passed because its fixture put draft on live: a fixture that agrees with the code instead of with the API proves the code agrees with itself, which is the failure this branch keeps paying for. It takes the same two arguments the route returns now, and the test asserts the route's shape.
//
// A row is one operation with the count it would destroy. `field` marks the one op that needs a value rather than only a confirmation.
function oneWayItems(live, draft) {
    const l = live || {};
    const newDraws = (l.newDraws || []).length;
    const returning = (l.returningDraws || []).length;
    const calendar = (l.calendar || []).length;
    const patchNotes = (l.patchNotes || []).length;
    const d = draft && draft.active ? draft : null;
    const draftCount = d ? (d.newDraws || []).length + (d.returningDraws || []).length + (d.calendar || []).length : 0;

    // 🔴 THE DESIGN'S STRIP IS FIVE OPERATIONS AND THIS IS SEVEN, WITH DIFFERENT WORDS ON THE FIVE THEY SHARE. `draws-all` and `promote` are portal additions, and the notes were rewritten. Both may well be improvements — promote in particular has nowhere else to live — but they are a redesign, and the redesigns come back after every realm matches. Under the conformance flag the strip is the design's, verbatim: same order, same titles, same units, same sentences.
    if (typeof document !== 'undefined' && document.documentElement.dataset.conform === '1') {
        const items = newDraws + returning + calendar + patchNotes;
        return [
            { id: 'draws-new', title: 'Purge new draws', unit: 'draws', count: newDraws,
                note: 'Empties the New Draws list. Returning draws are untouched.',
                op: { type: 'draw.purge', target: { scope: 'new' }, payload: {} }, word: 'PURGE' },
            { id: 'draws-returning', title: 'Purge returning draws', unit: 'draws', count: returning,
                note: 'Empties the Returning Draws list. New draws are untouched.',
                op: { type: 'draw.purge', target: { scope: 'returning' }, payload: {} }, word: 'PURGE' },
            { id: 'calendar', title: 'Purge calendar', unit: 'events', count: calendar,
                note: 'Removes every event, playlist and calendar draw row for this season.',
                op: { type: 'calendar.purge', target: {}, payload: {} }, word: 'PURGE' },
            { id: 'patchnotes', title: 'Purge patch notes', unit: 'entries', count: patchNotes,
                note: 'Clears the whole patch-note history, published entries included.',
                op: { type: 'patchnote.purge', target: {}, payload: {} }, word: 'PURGE' },
            { id: 'startnew', title: 'Start a new season', unit: 'items', count: items,
                note: 'Clears draws, calendar and titles together and opens an empty season.',
                field: { key: 'newTitle', label: 'New season title', placeholder: 'Season 8 — …' },
                op: { type: 'season.startNew', target: {}, payload: {} }, word: 'NEW SEASON' },
        ];
    }

    return [
        { id: 'draws-all', title: 'Purge every draw', unit: 'draws', count: newDraws + returning,
            note: 'New and returning together. The season keeps its title, dates and calendar.',
            op: { type: 'draw.purge', target: { scope: 'all' }, payload: {} }, word: 'PURGE' },
        { id: 'draws-new', title: 'Purge new draws', unit: 'draws', count: newDraws,
            note: 'Returning draws are left exactly as they are.',
            op: { type: 'draw.purge', target: { scope: 'new' }, payload: {} }, word: 'PURGE' },
        { id: 'draws-returning', title: 'Purge returning draws', unit: 'draws', count: returning,
            note: 'New draws are left exactly as they are.',
            op: { type: 'draw.purge', target: { scope: 'returning' }, payload: {} }, word: 'PURGE' },
        { id: 'calendar', title: 'Purge the calendar', unit: 'events', count: calendar,
            note: 'Every event and playlist window in this season.',
            op: { type: 'calendar.purge', target: {}, payload: {} }, word: 'PURGE' },
        { id: 'patchnotes', title: 'Purge patch-note history', unit: 'entries', count: patchNotes,
            note: 'The whole history, not only this season.',
            op: { type: 'patchnote.purge', target: {}, payload: {} }, word: 'PURGE' },
        { id: 'promote', title: 'Promote the draft season', unit: 'staged items', count: draftCount,
            note: d ? 'Replaces the live season with the draft, wholesale.' : 'No draft is active, so there is nothing to promote.',
            disabled: !d, op: { type: 'season.promoteDraft', target: {}, payload: {} }, word: 'PROMOTE' },
        // ⚠️ THE ONE ROW THAT TAKES A VALUE. season.startNew refuses to validate without a title, so a row that only asked for a confirmation word would stage an op the server rejects — a button that looks like it worked and did not. The field is part of the row rather than the confirmation because a reader deciding whether to press it needs to see what they are naming.
        { id: 'startnew', title: 'Start a new season', unit: 'items', count: newDraws + returning + calendar,
            note: 'Wipes every draw and calendar entry and renames the season. Patch-note history survives.',
            field: { key: 'newTitle', label: 'New season title', placeholder: 'Season 8 — …' },
            op: { type: 'season.startNew', target: {}, payload: {} }, word: 'WIPE' },
    ];
}

// 🔴 DISABLED WITH THE REASON, NEVER HIDDEN. An admin without the capability must still SEE that these operations exist and read what would unlock them: hiding the strip teaches nothing, produces a support question, and conceals from that person that somebody else can do this to their data.
function whyNoDestroy(session) {
    if (!session) return 'Only the owner can run one-way operations.';
    if (session.canDestroy) return '';
    return 'One-way operations need the Destructive permission, which only the owner can grant.';
}

// Two gates, reported separately, because "you may not" and "not until you name it" are different answers to different questions and collapsing them tells the reader the wrong one.
function owRowState(item, { canDestroy, fieldValue }) {
    if (!canDestroy) return { state: 'locked', label: 'Owner only' };
    if (item.disabled) return { state: 'empty', label: 'Nothing to do' };
    if (!item.count) return { state: 'empty', label: 'Nothing to remove' };
    if (item.field && !String(fieldValue || '').trim()) return { state: 'needs-field', label: item.title.replace(/…$/, '') + '…' };
    return { state: 'ready', label: item.title.replace(/…$/, '') + '…' };
}

const plural = (n, unit) => (n === 1 && unit.endsWith('s') ? unit.slice(0, -1) : unit);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { oneWayItems, whyNoDestroy, owRowState, plural };
}
