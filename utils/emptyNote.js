// utils/emptyNote.js -- the ONE way a panel says a list is empty (2026-11-01 14:32 EDT, Harkirat: "Improve the warning messages for screens like this too. Don't work at the instance!!! Work the class!"). His wording, given for /draws at 13:54 and 14:05 EDT:
//   :Warn: *Zero (0) **New Draws** match this filter.*
//   -# :NewDraws: **New Draws:** :GreenDot: `1` live:blank: :RedDot: `2` ended
// The second line says where that list stands right now, so the reader knows what to pick instead; with nothing in the list at all, the first line says so ("…this season") and there is no second line. Used by /draws (commands/draws.js) and /calendar's timeline pages (commands/calendar.js); a new filtered panel uses it too rather than writing its own.
const emojis = require('./emojiMap');

// label: what the list is ("New Draws"); emoji: its icon; counts: [{ emojiKey, label, n }] for every state, zero counts dropped here; filtered: whether a filter emptied it.
function emptyNote({ label, emoji, counts = [], filtered = true }) {
    const shown = counts.filter(c => c.n > 0);
    if (!filtered || !shown.length) return `${emojis.warn} *Zero (0) **${label}** this season.*`;
    const line = shown.map(c => `${emojis[c.emojiKey]} \`${c.n}\` ${c.label}`).join(`${emojis.blank} `);
    return `${emojis.warn} *Zero (0) **${label}** match this filter.*\n-# ${emoji} **${label}:** ${line}`;
}

module.exports = { emptyNote };
