// ==========================================
// INVITE — INTERACTION HANDLER
// ==========================================
// One branch: `/invite`'s "Share Link" button, added 2026-08-17 09:24 EDT with the design pass from Harkirat's own mockup (`local/invite_ui.json`). It posts the share card to the channel, publicly (a card since 2026-10-21; one hyperlinked line from 2026-10-18 20:15 EDT; an ephemeral bare link before that), so the clicker can pass the bot on rather than installing it themselves.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleInviteInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare `return interaction.reply(...)` can reject after the try has exited and escape the net. See .claude/rules/interaction-router.md.
//
// ⚠️ SUPERSEDED 2026-10-21 19:50 EDT: the button now posts utils/inviteCard.js's buildShareCard(), and its buttons carry the oauth links, so nothing unfurls. The note that follows is the history of the link-line version.
// WHY THE discord.com/oauth2 URL AND NOT `dioreo.app/install` (it is masked behind "Add Dioreo" since 2026-10-18; the reasoning below is from when it was sent bare) (Harkirat, 2026-08-17 09:18 EDT: "use the raw discord invite link instead of /install, since discord will render its raw link uniquely on the platform"): Discord unfurls its OWN authorization links into a rich application card wherever they are pasted. The short site route would paste as an ordinary dead-looking URL, which is worse precisely in the case this button exists for -- sharing inside Discord. The site route is still the right thing for sharing OUTSIDE Discord and is not being retired. ⚠️ It is sent as a BARE link on its own line, deliberately NOT inside a code fence: a fenced block suppresses the unfurl, which would throw away the entire reason the raw URL was chosen. The trade-off is that copying is a long-press/selection rather than a one-tap copy button.

const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildShareCard } = require('../utils/inviteCard');

const OWNED_PREFIXES = ['invite_share'];


function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
    // "SHARE LINK" — posts the invite link to the channel (since 2026-10-18 20:15 EDT; it was private before).
    if (interaction.customId === 'invite_share') {
        // PUBLIC, AS ONE HYPERLINKED LINE (2026-10-18 20:15 EDT, Harkirat: "can we change the 'share link''s output to be as a public message (unless public bot messages are restricted via admin commands or other ways)? and also hide the invite link as a hyperlink?"). This reverses two of his earlier calls (2026-08-17): the reply was ephemeral, so a mis-click on a public panel could not post to the channel, and it was the bare URL alone, so Discord unfurled it into its app card and copying gave exactly the link. Now it is public, and the link is masked behind "Add Dioreo". Where a server's /admin policy makes the bot private in this channel, attachGuildPolicy has already forced every reply ephemeral (utils/guildPolicy.js), so nothing here checks it; where Discord itself bars an app from posting publicly, Discord makes the reply ephemeral.
        // Since 2026-10-21 19:50 EDT it posts the share card (utils/inviteCard.js) instead of the masked link line. Deferred public, then the card is patched onto @original: discord.js's reply() does not serialize raw Components V2 (rendering-and-ui.md). Link buttons only, so nothing on it can expire.
        await interaction.deferReply();
        return await sendV2Payload(interaction, [buildShareCard(interaction.client)], { skipExpiry: true });
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleInviteInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleInviteInteraction, OWNED_PREFIXES };
