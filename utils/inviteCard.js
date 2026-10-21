// The Share Link card (handlers/invite.js posts it). Its own module because a handlers/*.js file exports exactly one function (scripts/handlerRouting.test.js).
const { buildInviteUrls } = require('./inviteLinks');
const emojis = require('./emojiMap');
const { MASCOT_URL } = require('./brandAssets');

// Coral, the accent /help and /invite share as the bot's two meta commands (commands/invite.js's header). The card is the same voice, so it wears the same colour.
const SHARE_ACCENT = 0xFF7D5C;

// THE SHARE CARD (2026-10-21 19:50 EDT, Harkirat: "yea lets try it", replacing Discord's automatic app card with this one, with his three emojis on the buttons and no season countdown). Discord's own unfurl of the oauth link fixed the layout and printed "Unlimited Players"; this card says what the bot is and offers both install paths plus the site. Emojis are read here, at render time, so the dev bot's re-pointed ids apply (utils/emojiMap.js).
function buildShareCard(client) {
    const urls = buildInviteUrls(client);
    const link = (label, url, emoji) => ({ type: 2, style: 5, label, url, emoji: emojis.parseEmoji(emoji) });
    return {
        type: 17, accent_color: SHARE_ACCENT, components: [
            { type: 9, components: [
                { type: 10, content: '## Dioreo' },
                { type: 10, content: '-# The COD:M companion bot' },
                { type: 10, content: 'Gunsmith loadouts, lucky draw prices and calculators, patch notes and the season calendar, one slash command away.' },
            ], accessory: { type: 11, media: { url: MASCOT_URL } } },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: '-# **Add to Server** for everyone in a server, or **Add to My Apps** to use it anywhere, DMs included.' },
            { type: 1, components: [
                link('Add to Server', urls.guild, emojis.plus),
                link('Add to My Apps', urls.user, emojis.sparkles),
                link('Website', 'https://dioreo.app', emojis.dioreoKawaii1B),
            ] },
        ],
    };
}

module.exports = { buildShareCard, SHARE_ACCENT };
