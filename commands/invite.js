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
// ACCENT: Coral #FF7D5C -- inherited from `/help`, which moved to Signal Green #32A434 in this same
// change (Harkirat's call, 2026-08-16 20:38 EDT). Coral is the DIOREO mascot artwork's own branding
// colour (the asset is literally `dioreo-mascot-coral.png`), so it follows the mascot onto the panel
// that is most about the bot's identity. See `.claude/rules/rendering-and-ui.md`'s accent map.
//
// EMOJI reuse `/help`'s own personal-vs-server pair on purpose: `serverSettings` marks the
// server-scoped path and `settings` the you-scoped one, which is the exact distinction the
// Preferences category already swaps those two icons for. Per the emoji-capture rule
// (.claude/rules/rendering-and-ui.md) every lookup happens INSIDE a render function -- never at
// require() time, or the ids freeze to the prod app's and render broken on the dev bot.
// ⚠️ `dioreoCombo` does not exist on the "Dioreo (Dev)" application yet, so the header emoji renders
// as literal text on the dev bot specifically. Not a code bug -- same known gap `/help` documents.
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
const { mentionCommand } = require('../utils/commandMentions');
const { buildInviteUrls } = require('../utils/inviteLinks');

// Coral #FF7D5C -- see the ACCENT note in this file's header.
const PRESET_ACCENT = 16743772;

const HARKIRAT_ID = '1139845545754632283';
const WEBSITE_URL = 'https://dioreo.app';
// Shared with `/help`'s landing hero rather than re-uploaded -- one asset, one Cloudinary URL.
const MASCOT_URL = 'https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1786237039/site_assets/dioreo-mascot-coral.png';

const VISIBILITY_DESCRIPTION = 'Show this response only to you, or publicly to everyone in the chat.';

function buildContainer(accentColor, client) {
    const urls = buildInviteUrls(client);
    const components = [];

    components.push({
        type: 9,
        components: [{
            type: 10,
            content: `## ${emojis.dioreoCombo} Invite Dioreo\n> Add **Dioreo** to a server, or install it on your own account and take it into every chat you're in.`
        }],
        accessory: { type: 11, media: { url: MASCOT_URL } }
    });

    components.push({ type: 14, spacing: 2, divider: true });

    // The two paths as prose FIRST, buttons underneath -- someone running this is usually deciding
    // between them, and a pair of unexplained buttons makes that choice for them badly.
    components.push({
        type: 10,
        content: `### ${emojis.serverSettings} Add to a Server\n`
            + `Everyone in the server can use Dioreo — nobody else has to install anything.\n`
            + `-# 🔹 You need **Manage Server** on the server you pick\n`
            + `-# 🔹 Dioreo asks for **no permissions at all** — it only ever answers a slash command\n`
            + `-# 🔹 Admins can then choose where it replies publicly with ${mentionCommand(client, '/admin')}\n`
    });

    components.push({
        type: 10,
        content: `### ${emojis.settings} Add to Your Account\n`
            + `Take Dioreo with you into **any** server, DM, or group chat — including ones it hasn't been added to.\n`
            + `-# 🔹 The commands follow **you**, so nobody else in the server needs it installed\n`
            + `-# 🔹 Nothing to set up, and no permissions to grant\n`
    });

    components.push({ type: 14, spacing: 1, divider: true });

    components.push({
        type: 10,
        content: `-# 💠 Not sure which? **Add to a Server** if you want everyone there to use it · **Add to Your Account** if you want it wherever you go · doing both is fine.\n`
            + `-# 💠 New to Dioreo? ${mentionCommand(client, '/help')} shows everything it can do.`
    });

    // Link buttons (style 5) carry no custom_id and fire no interaction -- nothing to route, and
    // nothing for utils/passiveExpiry.js to disable later, so this panel stays usable indefinitely.
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
    components.push({ type: 10, content: `-# ${emojis.diorHeart} Made with love by <@${HARKIRAT_ID}>` });

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
