// ==========================================
// COMMAND: /invite — share Dioreo (guild install + user install)
// ==========================================
// Built 2026-08-16 20:51 EDT. One flat command, one Components V2 panel, two install paths side by
// side: "Add to a Server" (guild install) and "Add to Your Account" (user install). Both became
// real options only in the v3 line -- every public command registers `setIntegrationTypes([0, 1])`
// now, so the bot is genuinely installable both ways and a share surface that offered only one of
// them would be describing the v2 bot. See root CLAUDE.md's zero-standing-permissions section.
//
// ⚠️ THE "Add to Server" LINK IS LIVE ON DEV AND INERT ON PROD UNTIL LAUNCH, and that is expected.
// Guild Install is a Developer Portal toggle per application, not something this code can set: the
// dev application ("Dioreo (Dev)") already has it enabled, and the PROD application gets it as part
// of the v3 launch step (`docs/ROADMAP.md`'s v3 section -- the same flip that lets the prod bot be
// invited to the dioreoland storage server). Until that flip, prod's guild link lands on a Discord
// error page. This branch ships with v3, so the two arrive together -- do NOT "fix" the link, and do
// not gate the button on an environment check; there is nothing wrong with it.
//
// LAYOUT follows the house language rather than inventing one: a type-9 Section hero with the
// mascot as its thumbnail accessory (the same shape `/help`'s landing page uses), `### ` subheads
// per install path, `-# 🔹` bullets for the details under each, `-# 💠` for the closing hints, and
// the `{diorHeart} Made with love` footer every user-facing panel ends on.
//
// ACCENT: Coral #FF7D5C -- the SAME accent `/help` uses, deliberately shared rather than unique.
// ⚠️ A brief 2026-08-16 20:38 EDT decision moved `/help` to Signal Green so `/invite` could take
// coral on its own; Harkirat reversed it at 21:54 EDT after seeing both live -- "scratch the green
// colour on /help, let's keep the coral colour for both /help and /invite". So coral is now the
// shared identity of the bot's two META commands (the ones about Dioreo itself, rather than about
// CODM data), which is a distinction worth keeping: every content command has its own colour, and
// these two do not compete with them. Do NOT "fix" this by minting `/invite` a unique accent --
// sharing it is the decision, not an oversight. See `.claude/rules/rendering-and-ui.md`'s accent map.
//
// EMOJI reuse `/help`'s own personal-vs-server pair on purpose: `serverSettings` marks the
// server-scoped path and `settings` the you-scoped one, which is the exact distinction the
// Preferences category already swaps those two icons for. Per the emoji-capture rule
// (.claude/rules/rendering-and-ui.md) every lookup happens INSIDE a render function -- never at
// require() time, or the ids freeze to the prod app's and render broken on the dev bot.
// ✅ Every emoji this panel uses resolves on BOTH applications -- verified by boot-testing the dev
// bot 2026-08-16 21:06 EDT, which reported "54 re-pointed to this app, 0 dev-overridden, 0
// unmatched". (`/help`'s header carried a stale warning that `dioreoCombo` was missing on dev; that
// was true when it was written and is not any more, and it was corrected in this same change.)
//
// NOT WIRED INTO `/help` YET, deliberately. Harkirat, 2026-08-16 20:38 EDT: "exclude it from /help
// for now. Add it as a deferred item that needs discussion and design on how to implement it
// properly into /help cmd" -- filed in `docs/db-deferred-list.md`'s 🗂️ Queued. So `/help cmd:invite`
// finding nothing today is intended, not an oversight.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { withShareButton } = require('../utils/shareButton');
const { buildInviteUrls } = require('../utils/inviteLinks');

// Coral #FF7D5C -- see the ACCENT note in this file's header.
const PRESET_ACCENT = 16743772;

const WEBSITE_URL = 'https://dioreo.app';
// The site's own short redirect to the Discord authorization link (a 302 emitted by
// scripts/buildLegalPages.js, built FROM the same client id, so the two cannot disagree). Shared
// instead of a raw OAuth URL -- see the share block in buildContainer for the full reasoning.
const SHARE_URL = 'https://dioreo.app/install';
// Shared with `/help`'s landing hero rather than re-uploaded -- one asset, one Cloudinary URL.
const MASCOT_URL = 'https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1786237039/site_assets/dioreo-mascot-coral.png';

const VISIBILITY_DESCRIPTION = 'Show this response only to you, or publicly to everyone in the chat.';

function buildContainer(accentColor, client) {
    const urls = buildInviteUrls(client);
    const components = [];

    // CONDENSED 2026-08-16 21:54 EDT, Harkirat on seeing the first build live: "WAY too much info and
    // noise! This needs to be significantly condensed." The first draft explained each install path
    // with a ### heading plus two or three -# bullets -- accurate, and far too much to read for what
    // is really a two-button decision. Everything a user must know to CHOOSE fits on one line each;
    // the caveats that got cut (Manage Server is required, the bot requests no permissions) are
    // enforced by Discord's own install dialog anyway, which states the permissions itself on the
    // very next screen. Do not re-add them here -- this panel was already rejected once at that
    // length, and the detail is one click away by construction.
    components.push({
        type: 9,
        components: [{
            type: 10,
            content: `## ${emojis.dioreoCombo} Invite Dioreo\n`
                + `${emojis.serverSettings} **Add to a Server** — everyone there can use it\n`
                + `${emojis.settings} **Add to Your Account** — use it in any server, DM, or group chat`
        }],
        accessory: { type: 11, media: { url: MASCOT_URL } }
    });

    // Link buttons (style 5) carry no custom_id and fire no interaction -- nothing to route, and
    // (since 2026-08-16 21:15 EDT) nothing for utils/passiveExpiry.js to disable either, so this
    // panel stays clickable forever. That matters more here than anywhere else in the bot: an invite
    // post exists to be clicked by whoever scrolls past it later, not by the person who ran it.
    // Emoji goes through the dedicated `emoji` field, never baked into `label` (Components V2 rule 4).
    components.push({
        type: 1,
        components: [
            { type: 2, style: 5, label: 'Add to Server', url: urls.guild, emoji: emojis.parseEmoji(emojis.serverSettings) },
            { type: 2, style: 5, label: 'Add to Your Account', url: urls.user, emoji: emojis.parseEmoji(emojis.settings) },
            { type: 2, style: 5, label: 'Website', url: WEBSITE_URL }
        ]
    });

    components.push({ type: 14, spacing: 1, divider: true });

    // THE SHARE PATH (Harkirat, 2026-08-16 21:54 EDT: "I also need an option to 'copy link' or
    // 'share' ... incase someone wants to share the link with someone instead of just installing it
    // themselves"). A fenced code block rather than a button on purpose, for three reasons that all
    // point the same way: Discord renders a real COPY affordance on a fenced block (and long-press
    // works on mobile), whereas a link button can only ever navigate -- clicking one cannot copy
    // anything; a custom_id button would re-arm the passive-expiry timer this panel was just freed
    // from, so the share control would die after 10 idle minutes on exactly the public post it
    // exists for; and no handler means no router branch, no OWNED_PREFIXES entry, and nothing to
    // keep in step.
    // ⚠️ It deliberately shares `dioreo.app/install`, NOT a raw discord.com/oauth2 URL. That route
    // already exists (a 302 built FROM the same client id in scripts/buildLegalPages.js, so it
    // cannot drift), it is short enough to say out loud, it survives the OAuth URL gaining or losing
    // parameters, and -- the actual point -- it works OUTSIDE Discord, which a slash command never
    // can. That is the half of docs/ROADMAP.md's "Easy bot sharing" item a command alone can't reach.
    components.push({
        type: 10,
        content: `-# 💠 Sharing it with someone? Send them this link:\n\`\`\`\n${SHARE_URL}\n\`\`\``
    });

    return { type: 17, accent_color: accentColor, components };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Add Dioreo to your server, or install it on your own account')
        .addStringOption(option => option.setName('visibility').setDescription(VISIBILITY_DESCRIPTION)
            .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        // Guild + user install, all contexts -- a share command that cannot be run in the very
        // servers you want to share it in would defeat itself.
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]),

    PRESET_ACCENT,
    buildContainer,

    async execute(interaction) {
        // Defaults PUBLIC, unlike `/help`'s hidden default: the point of running this is to put the
        // links in front of other people. There is deliberately no UserPreference field behind it --
        // the same reasoning `/help` uses, this is a per-invocation choice, not a saved taste. A
        // server rule that forces ephemeral still applies, at the two choke points in
        // `.claude/rules/admin-controls.md`, without this command knowing anything about it.
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const isEphemeral = visibilityChoice === 'hidden';
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);

        // "Show Everyone" IS offered here (unlike `/help`, which dropped it): running this hidden
        // and then deciding to post it for the channel is the command's own core flow.
        const components = withShareButton([buildContainer(accentColor, interaction.client)], isEphemeral);
        return await sendV2Payload(interaction, components);
    }
};
