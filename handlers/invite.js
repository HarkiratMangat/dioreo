// ==========================================
// INVITE — INTERACTION HANDLER
// ==========================================
// One branch: `/invite`'s "Share Link" button, added 2026-08-17 09:24 EDT with the design pass from
// Harkirat's own mockup (`local/invite_ui.json`). It answers with an EPHEMERAL copy of the install
// link so the clicker can pass it on to someone else, rather than installing it themselves.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleInviteInteraction is awaited from inside
// handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners,
// and keep every error-branch reply an AWAITED call in its own small try/catch. A bare
// `return interaction.reply(...)` can reject after the try has exited and escape the net.
// See .claude/rules/interaction-router.md.
//
// WHY THE RAW discord.com/oauth2 URL AND NOT `dioreo.app/install` (Harkirat, 2026-08-17 09:18 EDT:
// "use the raw discord invite link instead of /install, since discord will render its raw link
// uniquely on the platform"): Discord unfurls its OWN authorization links into a rich application
// card wherever they are pasted. The short site route would paste as an ordinary dead-looking URL,
// which is worse precisely in the case this button exists for -- sharing inside Discord. The site
// route is still the right thing for sharing OUTSIDE Discord and is not being retired.
// ⚠️ It is sent as a BARE link on its own line, deliberately NOT inside a code fence: a fenced block
// suppresses the unfurl, which would throw away the entire reason the raw URL was chosen. The
// trade-off is that copying is a long-press/selection rather than a one-tap copy button.

const { buildInviteUrls } = require('../utils/inviteLinks');

const OWNED_PREFIXES = ['invite_share'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
    // "SHARE LINK" — hands the clicker a copyable install link, privately.
    if (interaction.customId === 'invite_share') {
        // Ephemeral on purpose: the button sits on a PUBLIC panel that anyone scrolling past can
        // click, so a public answer would let one mis-click post to the channel, and would duplicate
        // what the panel itself already shows.
        // ⚠️ THE LINK AND NOTHING ELSE -- no label, no emoji, no surrounding sentence (Harkirat,
        // 2026-08-17 09:26 EDT: "Don't include any extra text in the ephemeral message, just the
        // link."). Two reasons it matters beyond taste: a bare URL as the entire message body is what
        // Discord unfurls most reliably into its application card, and "copy message text" then
        // yields exactly the URL rather than a sentence someone has to trim before pasting. Do not
        // "improve" this by adding a helpful prefix -- that is precisely what was removed.
        const url = buildInviteUrls(interaction.client).chooser;
        return await interaction.reply({ content: url, ephemeral: true });
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handleInviteInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleInviteInteraction, OWNED_PREFIXES };
