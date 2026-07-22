// utils/paginationRow.js
const emojis = require('./emojiMap');

// Shared Prev/Next pagination row — introduced for /draws and /calendar's sub-page navigation and
// reused by every paginated surface in the bot (draws, calendar, drawprices, settings, View Colors,
// alerts, loadout cards). Returns null when there's nothing to paginate (caller should skip pushing
// it) so a single-page result never shows a useless row.
//
// LOOPING (2026-07-21, Harkirat's request — "loop back to the first page instead of going disabled
// on the last page"): the arrows WRAP instead of disabling on the ends — Next on the last page
// jumps to the first page, and Prev on the first page jumps to the last. The middle page-indicator
// stays disabled (it's a plain label). This replaces the old `disabled: currentPage === 0 /
// === totalChunks - 1` end-caps.
//
// ⚠️ THE EXACTLY-2-PAGES EXCEPTION (found live 2026-07-22 — a real production crash, not theory):
// with the makeCustomId (page-number) path, wrapping at totalChunks === 2 makes BOTH arrows target
// the one "other" page, so makeCustomId(prevPage) === makeCustomId(nextPage) — two buttons with an
// IDENTICAL custom_id. Discord hard-rejects that (`Invalid Form Body ...
// COMPONENT_CUSTOM_ID_DUPLICATED`) and the ENTIRE message fails to send — the command throws. This
// hit /draws, /calendar, /settings (hardcoded 2 pages), View Colors (8 colors → 2 pages) and
// /alerts. An earlier version of this comment called the 2-page case "harmless, just redundant" —
// it was the opposite of harmless. It is mathematically impossible to have TWO enabled looping
// arrows with unique PAGE-based ids at 2 pages (both must point at the same page), so for the
// makeCustomId path we clamp + disable the boundary arrow at exactly 2 pages (prev on page 1 and
// next on page 2 go disabled), which yields distinct ids (`..._0` vs `..._1`). 3+ pages loop
// normally (prev !== next, no collision). The legacy prevCustomId/nextCustomId path encodes a
// DIRECTION, not a page, so its two ids are inherently distinct even at 2 pages — it keeps looping
// untouched (loadout cards). If Harkirat later wants a single looping toggle button at 2 pages
// instead of a clamped arrow pair, that's a layout change to make here.
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

    // At exactly 2 pages the page-based (makeCustomId) path must NOT wrap — see the block comment
    // above for why (duplicate custom_id → the whole message is rejected). Clamp + disable the
    // boundary arrow in that one case; wrap everywhere else. The legacy prev/next-string path
    // (direction-encoded, inherently unique) always wraps, unaffected.
    const clampTwo = !!makeCustomId && totalChunks === 2;
    const prevPage = clampTwo ? Math.max(0, currentPage - 1) : (currentPage - 1 + totalChunks) % totalChunks;
    const nextPage = clampTwo ? Math.min(totalChunks - 1, currentPage + 1) : (currentPage + 1) % totalChunks;
    const prevId = makeCustomId ? makeCustomId(prevPage) : prevCustomId;
    const nextId = makeCustomId ? makeCustomId(nextPage) : nextCustomId;
    const prevDisabled = clampTwo && currentPage === 0;
    const nextDisabled = clampTwo && currentPage === totalChunks - 1;

    return {
        type: 1,
        components: [
            { type: 2, style: 2, emoji: emojis.parseEmoji(emojis.left), custom_id: prevId, disabled: prevDisabled },
            // Numbers only (no "Page" label) per the mobile-friendly redesign — the arrows either
            // side already make it obvious this is a pager. Stays disabled (it's just a label).
            { type: 2, style: 2, label: `${currentPage + 1} / ${totalChunks}`, custom_id: indicatorCustomId, disabled: true },
            { type: 2, style: 2, emoji: emojis.parseEmoji(emojis.right), custom_id: nextId, disabled: nextDisabled }
        ]
    };
}

module.exports = { buildPaginationRow };
