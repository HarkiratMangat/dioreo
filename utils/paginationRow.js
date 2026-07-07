// utils/paginationRow.js
const emojis = require('./emojiMap');

// Shared Prev/Next pagination row — introduced for /draws and /calendar's sub-page navigation,
// meant to be reused by any future paginated command too rather than each one growing its own
// slightly-different button row. Returns null when there's nothing to paginate (caller should
// skip pushing it entirely) so a single-page result never shows a useless disabled row.
function buildPaginationRow({ totalChunks, currentPage, prevCustomId, nextCustomId, indicatorCustomId }) {
    if (totalChunks <= 1) return null;

    return {
        type: 1,
        components: [
            { type: 2, style: 2, emoji: emojis.parseEmoji(emojis.left), custom_id: prevCustomId, disabled: currentPage === 0 },
            // Numbers only (no "Page" label) per the mobile-friendly redesign — the arrows either
            // side already make it obvious this is a pager.
            { type: 2, style: 2, label: `${currentPage + 1} / ${totalChunks}`, custom_id: indicatorCustomId, disabled: true },
            { type: 2, style: 2, emoji: emojis.parseEmoji(emojis.right), custom_id: nextCustomId, disabled: currentPage === totalChunks - 1 }
        ]
    };
}

module.exports = { buildPaginationRow };
