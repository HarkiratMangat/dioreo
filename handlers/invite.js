// ==========================================
// INVITE — INTERACTION HANDLER
// ==========================================
// One branch: `/invite`'s "Share Link" button, added 2026-08-17 09:24 EDT with the design pass from Harkirat's own mockup (`local/invite_ui.json`). It posts the invite link to the channel as one hyperlinked line (public since 2026-10-18 20:15 EDT; it was an ephemeral bare link before), so the clicker can pass the bot on rather than installing it themselves.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleInviteInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare `return interaction.reply(...)` can reject after the try has exited and escape the net. See .claude/rules/interaction-router.md.
//
// WHY THE discord.com/oauth2 URL AND NOT `dioreo.app/install` (it is masked behind "Add Dioreo" since 2026-10-18; the reasoning below is from when it was sent bare) (Harkirat, 2026-08-17 09:18 EDT: "use the raw discord invite link instead of /install, since discord will render its raw link uniquely on the platform"): Discord unfurls its OWN authorization links into a rich application card wherever they are pasted. The short site route would paste as an ordinary dead-looking URL, which is worse precisely in the case this button exists for -- sharing inside Discord. The site route is still the right thing for sharing OUTSIDE Discord and is not being retired. ⚠️ It is sent as a BARE link on its own line, deliberately NOT inside a code fence: a fenced block suppresses the unfurl, which would throw away the entire reason the raw URL was chosen. The trade-off is that copying is a long-press/selection rather than a one-tap copy button.

const { buildInviteUrls } = require('../utils/inviteLinks');

const OWNED_PREFIXES = ['invite_share'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
    // "SHARE LINK" — posts the invite link to the channel (since 2026-10-18 20:15 EDT; it was private before).
    if (interaction.customId === 'invite_share') {
        // PUBLIC, AS ONE HYPERLINKED LINE (2026-10-18 20:15 EDT, Harkirat: "can we change the 'share link''s output to be as a public message (unless public bot messages are restricted via admin commands or other ways)? and also hide the invite link as a hyperlink?"). This reverses two of his earlier calls (2026-08-17): the reply was ephemeral, so a mis-click on a public panel could not post to the channel, and it was the bare URL alone, so Discord unfurled it into its app card and copying gave exactly the link. Now it is public, and the link is masked behind "Add Dioreo". Where a server's /admin policy makes the bot private in this channel, attachGuildPolicy has already forced every reply ephemeral (utils/guildPolicy.js), so nothing here checks it; where Discord itself bars an app from posting publicly, Discord makes the reply ephemeral.
        const url = buildInviteUrls(interaction.client).chooser;
        // No emoji in front since 2026-10-21 20:10 EDT (Harkirat: "can we remove the dioreokawaii emoji from the share link's message?").
        return await interaction.reply({ content: `### [Add Dioreo](${url}) — the COD:M companion bot!`, ephemeral: false });
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleInviteInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleInviteInteraction, OWNED_PREFIXES };
