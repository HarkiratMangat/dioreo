// utils/seasonEmoji.js
//
// A season's own emoji in front of its title wherever a caption states the season (2026-10-19 09:26 EDT, Harkirat: "Any sub headings that state the season title, put the respective emoji for that season infront of it. :emoji:<space>season title").
//
// TWO SOURCES, the stored one first. /manage's season title box takes a custom emoji typed in front of the title (2026-10-19 09:30 EDT, his pick "Add it"), which core/ops/season.js splits off into its own field so the title itself stays plain text everywhere (a select label, the Cloudinary metadata, the season search). A season with none stored falls back to emojiMap's season{N}, picked by the number in its title, which is how Seasons 6 to 9 were set up (2026-10-19 00:30 EDT). A title with no number and nothing stored gets none.
const emojis = require('./emojiMap');

// A custom emoji mention at the very start, with any space after it. Unicode emoji are not split off: the ask was the <a:name:id> a season's art arrives as, and a Unicode one would survive the bold-italic lettering anyway (it converts only Latin letters and digits).
const LEADING_EMOJI = /^\s*(<a?:\w+:\d+>)\s*/;

function splitSeasonEmoji(raw) {
    const text = String(raw || '');
    const m = LEADING_EMOJI.exec(text);
    return m ? { emoji: m[1], title: text.slice(m[0].length).trim() } : { emoji: '', title: text.trim() };
}

function seasonEmojiFor(title, stored) {
    if (stored) return emojis.repoint(stored);
    const m = /season\s*(\d+)/i.exec(title || '');
    if (!m) return null;
    return emojis[`season${m[1]}`] || null;
}

// Puts the emoji in front of buildTitleBlock's caption line, OUTSIDE the bold-italic lettering, which would mangle an emoji's name and id.
function withCaptionEmoji(block, emoji) {
    if (emoji) block.content = block.content.replace('\n', `\n${emoji} `);
    return block;
}

module.exports = { splitSeasonEmoji, seasonEmojiFor, withCaptionEmoji };
