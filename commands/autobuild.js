// commands/autobuild.js Screenshot -> Gemini vision extraction -> review/edit -> Cloudinary upload -> Loadout doc, gated behind an explicit admin Confirm step. Full design: docs/superpowers/specs/2026-07-19-loadout-automation-poc-design.md. Admin-only (gated by hasCommandAccess(..., 'autobuild'), the same allowlist model as /manage). MP-only until 2026-10-19 17:54 EDT; it now reads DMZ builds too, telling the two apart from the screenshot (utils/visionExtract.js's classifyMode) unless `mode:` says which. Extraction/state/write logic lives in utils/autobuildPipeline.js, shared with handlers/autobuild.js's button/ modal handlers for Confirm/Edit/Cancel/retry -- this file only does option parsing + admin gating.
const BOT_EMOJI = require('../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { SlashCommandBuilder } = require('discord.js');
const { hasCommandAccess } = require('../utils/adminAccess'); // owner OR Mongo-allowlisted admin scoped to 'autobuild'
const { mentionCommand } = require('../utils/commandMentions');

const CATEGORY_CHOICES = ['AR', 'SMG', 'LMG', 'MARKSMAN', 'SNIPER', 'SHOTGUN', 'SECONDARIES'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autobuild')
        .setDescription('Make an MP/DMZ gunsmith build from an image')
        .setDefaultMemberPermissions(0)
        .addAttachmentOption(option => option.setName('screenshot').setDescription('The Gunsmith screenshot (or use the url option instead)'))
        .addStringOption(option => option.setName('url').setDescription('A URL to the screenshot, instead of an attachment'))
        .addStringOption(option => option.setName('category').setDescription('Weapon category (optional -- will look up or ask if omitted)').addChoices(...CATEGORY_CHOICES.map(c => ({ name: c, value: c }))))
        // Optional override for the mode the screenshot's UI chrome would decide. Left blank, a screenshot whose chrome is ambiguous gets a review card that asks, never a guess.
        .addStringOption(option => option.setName('mode').setDescription('MP or DMZ (optional -- read from the screenshot if omitted)').addChoices({ name: 'MP', value: 'MP' }, { name: 'DMZ', value: 'DMZ' }))
                .addStringOption(option => option.setName('badges').setDescription('meta, best, top5, capable, toxic, ass, hp, s&d... (optional, this build only)'))
        .addStringOption(option => option.setName('retry_token').setDescription('Only used when re-submitting an image after a Cloudinary upload failure'))
        // Renamed `private` (boolean) -> `visibility` (Hidden/Public string) 2026-08-10 19:28 EDT. The bot-wide rename landed in v3.1.0 for every other command and missed this one, so this was the last `private` left in the bot -- see .claude/rules/commands-overview.md.
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat. (Defaults to only you.)').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        // ADMIN-ONLY: stays user-install [1] deliberately -- the 10 public commands moved to [0, 1] (guild install) for v3, but an admin command advertised in every server's command list is noise plus needless surface. Harkirat still reaches it anywhere via his own user install.
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),
    // The options are for ONE build since 2026-10-25 12:49 EDT (Harkirat: "let's make the slash command options method for a singular gunsmith creation. and if bulk /autobuild, then just via the /autobuild command"). screenshot2..screenshot10 (bulk, 2026-10-20 10:36 EDT) are gone: several screenshots and links go through the form a bare /autobuild opens (utils/autobuildStart.js).

    async execute(interaction) {
        if (!(await hasCommandAccess(interaction.user.id, 'autobuild'))) {
            return interaction.reply({ content: "🔒 **This one's admin-only.** Try any of the bot's public commands instead!", ephemeral: true });
        }

        const attachment = interaction.options.getAttachment('screenshot');
        const url = interaction.options.getString('url');
        const retryToken = interaction.options.getString('retry_token');
        const imageUrl = attachment ? attachment.url : (url ? url.trim() : null);
        // Explicit option only -- unlike the loadout lookup commands' `visibility`, this has no saved preference layer to fall back on (admin-only PoC, single admin, not worth the extra state). Omitted -> stays hidden, matching the behavior before this option existed.
        const visibilityChoice = interaction.options.getString('visibility');
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';

        // Nothing given: the form, straight away (2026-10-25 11:40-11:47 EDT, his ask and pick). showModal has to be the first response, so nothing is deferred before it. It replaces the "Provide exactly one of screenshot or url" error a bare run used to get ("this error message is also wrong").
        if (!attachment && !url && !retryToken) {
            // An open batch comes back first, where it was left (Harkirat, 2026-10-25 13:31 EDT: "running /autobuild ... will basically resume the process"); its Add screenshots button opens the form.
            if (await require('../utils/autobuildBulk').resumeOpenBatch(interaction)) return;
            const { buildStartModal } = require('../utils/autobuildStart');
            return interaction.showModal(buildStartModal());
        }

        // retry_token path (Task 7 adds retryImageUpload). Written when Discord modals could not take files, so the image had to come back through a fresh slash command; since 2026-10-25 12:49 EDT the form takes a token too, and a failed upload's Re-upload button opens it filled in.
        if (retryToken) {
            if (!imageUrl) {
                return interaction.reply({ content: require('../utils/emojiMap').glyphs(BOT_EMOJI.cross + ' Provide `screenshot` or `url` with a retry_token.'), ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: isEphemeral });
            const { retryImageUpload } = require('../utils/autobuildPipeline');
            return retryImageUpload(interaction, retryToken, imageUrl);
        }

        if (attachment && url) {
            return interaction.reply({ content: require('../utils/emojiMap').glyphs(`${BOT_EMOJI.cross} Use \`screenshot\` or \`url\`, not both. To read several, run ${mentionCommand(interaction.client, '/autobuild')} on its own.`), ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: isEphemeral });
        const category = interaction.options.getString('category');
        const badges = interaction.options.getString('badges');
        const mode = interaction.options.getString('mode');
        // One screenshot is a batch of one (2026-10-20 12:43 EDT), so a single review and a bulk review are the same surface and cannot drift apart: Save and Discard stay on the page, Discard can be undone. A batch of one has no pager or Save All.
        const { runBulk } = require('../utils/autobuildBulk');
        return runBulk(interaction, [imageUrl], { explicitCategory: category, badgesOption: badges, explicitMode: mode, ephemeral: isEphemeral });
    }
};

