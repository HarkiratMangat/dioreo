// utils/inviteLinks.js The bot's own install URLs, built ONCE here and consumed by `/invite` and `/help`'s landing page.
//
// WHY THIS IS A MODULE AND NOT A CONST IN EACH FILE: `commands/help.js` carried a hardcoded `INSTALL_URL` with the PROD application's client_id baked into the string. That is correct on prod and silently WRONG on the local dev bot -- "Dioreo (Dev)" is a separate Discord application with its own id (see root CLAUDE.md), so the dev bot's own help panel offered an install link for the production app. Nothing errors; you just install the wrong bot. Adding a SECOND copy of the same URL for `/invite` would have doubled that surface, so both now derive the id at render time.
//
// ⚠️ RESOLVE THE ID AT RENDER TIME, NEVER AT REQUIRE TIME. `client.application` is only populated once the Client has connected, and every command module is `require()`d long before that -- the exact same trap `utils/emojiMap.js` documents for emoji ids and `utils/commandMentions.js` for command ids. Call buildInviteUrls(client) inside the render function, with the live client.

// Last-resort fallback only, for the window before the client has connected (and for any test that builds a payload with no client at all). Matches .env's CLIENT_ID -- the same literal that used to be `commands/help.js`'s INSTALL_URL, kept so this module can never render a broken href.
const { PermissionFlagsBits } = require('discord.js');

const FALLBACK_CLIENT_ID = '1491474871778021550';

function resolveClientId(client) {
    // `client.application.id` and `client.user.id` are the same value for a bot account; both are checked because a synthetic/mocked interaction may carry only one of them.
    return client?.application?.id || client?.user?.id || FALLBACK_CLIENT_ID;
}

/**
 * The three install entry points, as absolute discord.com URLs.
 *
 *   guild   -- "Add to a Server". `integration_type=0` is Discord's GUILD_INSTALL. It asks for
 *              GUILD_PERMISSIONS below: the message permissions v4's text commands will need. Asked for
 *              NOW, at v3's launch (Harkirat, 2026-10-20 10:15 EDT), because a permission added later
 *              only reaches a server whose admin re-authorizes the bot, while gateway intents can be
 *              switched on later with no reinstall. Until text commands ship NO code uses them: the bot
 *              still answers only through the interaction-response webhook (root CLAUDE.md). Keep this
 *              set equal to the Developer Portal's Default Install Settings on each app, or the
 *              `chooser` link and the profile "Add App" button ask for something else.
 *              `scope=bot+applications.commands` is required for a guild install -- `bot` alone
 *              registers no commands, and `applications.commands` alone is a user install.
 *   user    -- "Add to Your Account". `integration_type=1` is USER_INSTALL, which takes only the
 *              `applications.commands` scope; a `bot` scope here is rejected by Discord.
 *   chooser -- the bare authorize link with no integration_type, which makes Discord render its own
 *              "Add App" picker offering whichever install types the application has enabled. This
 *              is the exact shape `/help`'s landing button has always used, kept byte-identical so
 *              that button's behaviour is unchanged by this refactor.
 */
// View Channels · Send Messages · Send Messages in Threads · Embed Links · Attach Files · Read Message History · Use External Emojis · Add Reactions = 274878286912. No moderation or admin permission, ever.
const GUILD_PERMISSIONS = [
    PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendMessagesInThreads,
    PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.UseExternalEmojis, PermissionFlagsBits.AddReactions,
].reduce((a, b) => a | b, 0n);

function buildInviteUrls(client) {
    const clientId = resolveClientId(client);
    const base = `https://discord.com/oauth2/authorize?client_id=${clientId}`;
    return {
        guild: `${base}&permissions=${GUILD_PERMISSIONS}&integration_type=0&scope=bot+applications.commands`,
        user: `${base}&integration_type=1&scope=applications.commands`,
        chooser: base,
    };
}

module.exports = { buildInviteUrls, FALLBACK_CLIENT_ID, GUILD_PERMISSIONS };
