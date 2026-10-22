// ==========================================
// COMMAND: /invite — share Dioreo (guild install + user install)
// ==========================================
// Built 2026-08-16 20:51 EDT. One flat command, one Components V2 panel, two install paths side by side: "Add to a Server" (guild install) and "Add to Your Account" (user install). Both became real options only in the v3 line -- every public command registers `setIntegrationTypes([0, 1])` now, so the bot is genuinely installable both ways and a share surface that offered only one of them would be describing the v2 bot. See root CLAUDE.md's zero-standing-permissions section.
//
// ⚠️ THE "Add to Server" LINK IS LIVE ON DEV AND INERT ON PROD UNTIL LAUNCH, and that is expected. Guild Install is a Developer Portal toggle per application, not something this code can set: the dev application ("Dioreo (Dev)") already has it enabled, and the PROD application gets it as part of the v3 launch step (`docs/ROADMAP.md`'s v3 section -- the same flip that lets the prod bot be invited to the dioreoland storage server). Until that flip, prod's guild link lands on a Discord error page. This branch ships with v3, so the two arrive together -- do NOT "fix" the link, and do not gate the button on an environment check; there is nothing wrong with it.
//
// LAYOUT follows the house language rather than inventing one: a type-9 Section hero with the mascot as its thumbnail accessory (the same shape `/help`'s landing page uses), `### ` subheads per install path, `-# 🔹` bullets for the details under each, `-# 💠` for the closing hints, and the `{diorHeart} Made with love` footer every user-facing panel ends on.
//
// ⚠️ CURRENT LAYOUT (2026-10-21 20:06 EDT, Harkirat's own spec): title `## <DioreoCombo> Invite Dioreo`, a `-#` tagline, a one-line pitch, a divider, a `-#` hint, then Add to Server · Add to My Apps · Share Link. The LAYOUT paragraph above describes earlier versions.
//
// ACCENT: Coral #FF7D5C -- the SAME accent `/help` uses, deliberately shared rather than unique. ⚠️ A brief 2026-08-16 20:38 EDT decision moved `/help` to Signal Green so `/invite` could take coral on its own; Harkirat reversed it at 21:54 EDT after seeing both live -- "scratch the green colour on /help, let's keep the coral colour for both /help and /invite". So coral is now the shared identity of the bot's two META commands (the ones about Dioreo itself, rather than about CODM data), which is a distinction worth keeping: every content command has its own colour, and these two do not compete with them. Do NOT "fix" this by minting `/invite` a unique accent -- sharing it is the decision, not an oversight. See `.claude/rules/rendering-and-ui.md`'s accent map.
//
// EMOJI reuse `/help`'s own personal-vs-server pair on purpose: `serverSettings` marks the server-scoped path and `settings` the you-scoped one, which is the exact distinction the Preferences category already swaps those two icons for. Per the emoji-capture rule (.claude/rules/rendering-and-ui.md) every lookup happens INSIDE a render function -- never at require() time, or the ids freeze to the prod app's and render broken on the dev bot. ✅ Every emoji this panel uses resolves on BOTH applications -- verified by boot-testing the dev bot 2026-08-16 21:06 EDT, which reported "54 re-pointed to this app, 0 dev-overridden, 0 unmatched". (`/help`'s header carried a stale warning that `dioreoCombo` was missing on dev; that was true when it was written and is not any more, and it was corrected in this same change.)
//
// NOT WIRED INTO `/help` YET, deliberately. Harkirat, 2026-08-16 20:38 EDT: "exclude it from /help for now. Add it as a deferred item that needs discussion and design on how to implement it properly into /help cmd" -- filed in `docs/db-deferred-list.md`'s 🗂️ Queued. So `/help cmd:invite` finding nothing today is intended, not an oversight.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildInviteUrls } = require('../utils/inviteLinks');

// Coral #FF7D5C -- see the ACCENT note in this file's header.
const PRESET_ACCENT = 16743772;
// Shared with `/help`'s landing hero -- one asset, ONE definition, in utils/brandAssets.js. It used to be a duplicate literal in both files; see that module's header for why that mattered and for the measured width transform it now carries.
const { MASCOT_URL } = require('../utils/brandAssets');

const VISIBILITY_DESCRIPTION = 'Show this response only to you, or publicly to everyone in the chat.';

function buildContainer(accentColor, client) {
    const urls = buildInviteUrls(client);
    const components = [];
    // ⚠️ HISTORY, superseded 2026-10-21 20:06 EDT by the layout below (two named install buttons, no /help footer). REBUILT 2026-08-17 09:24 EDT from Harkirat's own mockup, `local/invite_ui.json`. Two structural changes came from it:
    //   · ONE "Invite" button on the BARE chooser URL, instead of the two explicit
    //     guild/user buttons this file shipped with. Discord's own Add App picker offers whichever
    //     install types the application has enabled, so the platform does the branching and the panel
    //     does not have to. Fewer buttons, and it cannot go out of step with the portal's settings.
    //   · A "Share Link" button, replacing the fenced-code-block share line -- see the note on it below.
    // ⚠️ FIVE VALUES IN THAT MOCKUP ARE DEV-SPECIFIC OR EPHEMERAL AND ARE DELIBERATELY NOT COPIED. The mockup was built live on the dev bot, so it hardcodes: the DEV application's client_id (resolved here off the live client instead), the DEV app's `</help:…>` command id (resolved via mentionCommand), a mockup-generated `custom_id` (a real routed id here), `flags: 36864` -- Components V2 plus SUPPRESS_NOTIFICATIONS, where sendV2Payload owns flags and ORs in the ephemeral bit -- and, the one that would have silently broken in production, a **signed cdn.discordapp.com attachment URL** for the mascot carrying `ex=`/`is=`/`hm=` params that EXPIRE. That is the exact failure this repo already paid for and fixed by re-hosting the mascot to Cloudinary (see commands/help.js's header). MASCOT_URL below is that permanent copy.

    // REDESIGNED 2026-10-21 20:06 EDT to Harkirat's layout ("lets do this"): a tagline and a one-line pitch under the title, then the two install paths as their own buttons beside Share Link. This reverses the 2026-08-17 single bare-chooser "Invite" button described above: he chose two named buttons so the panel says what each path does. The `/help` footer went with it (not in his layout).
    components.push({
        type: 9,
        components: [{
            type: 10,
            content: `## ${emojis.dioreoCombo} Invite Dioreo\n`
                // Tagline and pitch in a quote bar, and the pitch reworded (2026-10-21 20:13 EDT, Harkirat: drop "builds", plural Gunsmiths, drop "lucky", singular calculator, "patch notes, season calendar, and more"), then cut to fit two lines beside the thumbnail on a phone (2026-10-21 20:27 EDT, his pick "H"; about 30 characters fit on line 2).
                + `> -# **COD:M companion bot**\n`
                + `> Gunsmiths, draw prices/calculator, patch notes, calendar & more.`
        }],
        accessory: { type: 11, media: { url: MASCOT_URL } }
    });

    components.push({ type: 14, spacing: 1, divider: true });
    components.push({ type: 10, content: '-# **Add to Server**, or **Add to My Apps** to use it anywhere, even in DMs!' });

    // The two install buttons are LINK buttons (style 5): no custom_id, no interaction. "Share Link" is a real Primary button, which is why this panel passes `skipExpiry` at its send site -- one custom_id component would otherwise re-arm the 10-minute idle-disable for the WHOLE panel, greying out Share Link beside still-live install links on exactly the public post that exists to be found days later. Harkirat's call, 2026-08-17 09:18 EDT. One row of four (2026-10-21 21:00 EDT, Harkirat: "Leave 1 row, it's the same on mobile either way"; his phone wrapped the one-row and two-row versions alike). A two-row split, tried at 20:17 EDT the same day, only added a gap on desktop. The install buttons carry no emoji (20:17 EDT, his call), and Website sits before Share.
    components.push({
        type: 1,
        components: [
            { type: 2, style: 5, label: 'Add to Server', url: urls.guild },
            { type: 2, style: 5, label: 'Add to My Apps', url: urls.user },
            { type: 2, style: 5, label: 'Website', url: 'https://dioreo.app' },
            // STYLE 1 (blurple) with the heart icon, kept since 2026-08-22 and named again in the 2026-10-21 layout ("share button in blue with the shareheart emoji"). The other buttons are LINK buttons, which Discord renders grey, so the heart carries the colour and this button carries the emphasis.
            { type: 2, style: 1, label: 'Share Link', custom_id: 'invite_share', emoji: emojis.parseEmoji(emojis.shareHeart) }
        ]
    });

    return { type: 17, accent_color: accentColor, components };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Add Dioreo to a server or your account')
        .addStringOption(option => option.setName('visibility').setDescription(VISIBILITY_DESCRIPTION)
            .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        // Guild + user install, all contexts -- a share command that cannot be run in the very servers you want to share it in would defeat itself.
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]),

    PRESET_ACCENT,
    buildContainer,

    async execute(interaction) {
        // Defaults PUBLIC, unlike `/help`'s hidden default: the point of running this is to put the links in front of other people. There is deliberately no UserPreference field behind it -- the same reasoning `/help` uses, this is a per-invocation choice, not a saved taste. A server rule that forces ephemeral still applies, at the two choke points in `.claude/rules/admin-controls.md`, without this command knowing anything about it.
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const isEphemeral = visibilityChoice === 'hidden';
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);

        // ⚠️ NO "Show Everyone" BUTTON HERE, BY EXPLICIT DECISION -- Harkirat, 2026-08-17 11:27 EDT (stale opening clause removed, v3-pre-release review, finding #61 -- it used to say "Show Everyone IS offered here," the exact opposite of this decision): "i don't actually want the show everyone button for it. they can just send the command again publicly." That is the durable reason and it is a product call, not a workaround: `/invite` defaults to PUBLIC and already carries its own Share Link button, so a third way to make it public is redundant. `/help` is the precedent -- it dropped the same button, on the same reasoning, because its visibility option already covered the case. 🐞 It ALSO closes a real bug, which is why the button had already gone before that message (found 2026-08-17 09:47 EDT auditing this branch; it shipped live in v3.40.0). Show Everyone does not re-enter this function -- handlers/share.js builds the public copy and sends it through `sendV2Payload` ITSELF, without `skipExpiry` -- so a shared panel armed the idle timer after all and its Share Link greyed out ten minutes later, on precisely the public post this command exists to leave behind. **So the bug being solved some other way is NOT a reason to bring the button back; the decision above stands on its own.** If it is ever genuinely wanted, the honest fix is the one rejected here: let share.js learn the exemption from the source panel. Threading the flag was rejected because share.js has only the message JSON and would need its own table of exempt commands -- a second copy of the decision, the duplication sendV2Payload's own header warns about -- and always-skipping there was rejected because a shared `/settings` panel genuinely should expire. `skipExpiry`: nothing on this panel is token-dependent -- the Share Link handler answers with its own fresh interaction -- and the message is meant to be found and clicked days later. See utils/sendV2Payload.js's note for the bar a second user must meet.
        const components = [buildContainer(accentColor, interaction.client)];
        return await sendV2Payload(interaction, components, { skipExpiry: true });
    }
};
