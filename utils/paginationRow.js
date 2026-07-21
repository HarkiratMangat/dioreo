// utils/paginationRow.js
const emojis = require('./emojiMap');

// Shared Prev/Next pagination row — introduced for /draws and /calendar's sub-page navigation and
// reused by every paginated surface in the bot (draws, calendar, drawprices, settings, View Colors,
// alerts, loadout cards). Returns null when there's nothing to paginate (caller should skip pushing
// it) so a single-page result never shows a useless row.
//
// LOOPING (2026-07-21, Harkirat's request — "loop back to the first page instead of going disabled
// on the last page"): the arrows now WRAP instead of disabling on the ends — Next on the last page
// jumps to the first page, and Prev on the first page jumps to the last. Neither arrow is ever
// disabled anymore; only the middle page-indicator stays disabled (it's a plain label). This
// replaces the old `disabled: currentPage === 0 / === totalChunks - 1` end-caps. (Applies at exactly
// 2 pages too, where both arrows simply point at "the other" page — harmless, just redundant.)
//
// Two ways to supply the button custom_ids:
//  • makeCustomId(targetPage) — PREFERRED, for callers whose id bakes in a TARGET PAGE NUMBER (every
//    caller except loadout cards). The helper computes the WRAPPED prev/next page itself and calls
//    this to build each id, so the modulo math lives in exactly ONE place instead of being copied
//    into (and drifting across) every caller.
//  • prevCustomId / nextCustomId — legacy, for callers whose id encodes a DIRECTION + current index
//    rather than a target page (loadout cards: `${prefix}prev_...` / `${prefix}next_...`, whose own
//    index.js handler already does the modulo wrap on click). These are passed through verbatim; the
//    only thing looping needs for them is that the buttons are no longer disabled — which is now the
//    default here. Don't mix the two: pass makeCustomId OR the prev/next pair, not both.
function buildPaginationRow({ totalChunks, currentPage, makeCustomId, prevCustomId, nextCustomId, indicatorCustomId }) {
    if (totalChunks <= 1) return null;

    // Wrap-around targets (only used for the makeCustomId path — the legacy prev/next ids already
    // carry a direction that their own handler wraps).
    const prevPage = (currentPage - 1 + totalChunks) % totalChunks;
    const nextPage = (currentPage + 1) % totalChunks;
    const prevId = makeCustomId ? makeCustomId(prevPage) : prevCustomId;
    const nextId = makeCustomId ? makeCustomId(nextPage) : nextCustomId;

    return {
        type: 1,
        components: [
            { type: 2, style: 2, emoji: emojis.parseEmoji(emojis.left), custom_id: prevId },
            // Numbers only (no "Page" label) per the mobile-friendly redesign — the arrows either
            // side already make it obvious this is a pager. Stays disabled (it's just a label).
            { type: 2, style: 2, label: `${currentPage + 1} / ${totalChunks}`, custom_id: indicatorCustomId, disabled: true },
            { type: 2, style: 2, emoji: emojis.parseEmoji(emojis.right), custom_id: nextId }
        ]
    };
}

module.exports = { buildPaginationRow };
