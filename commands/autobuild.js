// commands/autobuild.js
// Screenshot -> Gemini vision extraction -> review/edit -> Cloudinary upload -> Loadout doc, gated
// behind an explicit admin Confirm step. Full design: docs/superpowers/specs/2026-07-19-loadout-
// automation-poc-design.md. Admin-only (same ALLOWED_ADMIN_ID as /manage), MP-only for this PoC.
// Extraction/state/write logic lives in utils/autobuildPipeline.js, shared with index.js's button/
// modal handlers for Confirm/Edit/Cancel/retry -- this file only does option parsing + admin gating.
const { SlashCommandBuilder } = require('discord.js');
const { ALLOWED_ADMIN_ID } = require('./manage');
const { runExtraction } = require('../utils/autobuildPipeline');

const CATEGORY_CHOICES = ['AR', 'SMG', 'LMG', 'MARKSMAN', 'SNIPER', 'SHOTGUN', 'SECONDARIES'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autobuild')
        .setDescription('Extract an MP loadout from a Gunsmith screenshot (admin-only PoC)')
        .setDefaultMemberPermissions(0)
        .addAttachmentOption(option => option.setName('screenshot').setDescription('The Gunsmith screenshot (or use the url option instead)'))
        .addStringOption(option => option.setName('url').setDescription('A URL to the screenshot, instead of an attachment'))
        .addStringOption(option => option.setName('category').setDescription('Weapon category (optional -- will look up or ask if omitted)').addChoices(...CATEGORY_CHOICES.map(c => ({ name: c, value: c }))))
        .addStringOption(option => option.setName('badges').setDescription('meta,best,top5,toxic (optional -- blank inherits from an existing build of this weapon)'))
        .addStringOption(option => option.setName('retry_token').setDescription('Only used when re-submitting an image after a Cloudinary upload failure'))
        .addBooleanOption(option => option.setName('private').setDescription('Reply privately, only you can see it (default: true)'))
        // ADMIN-ONLY: stays user-install [1] deliberately -- the 10 public commands moved to [0, 1]
        // (guild install) for v3, but an admin command advertised in every server's command list is
        // noise plus needless surface. Harkirat still reaches it anywhere via his own user install.
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),

    async execute(interaction) {
        if (interaction.user.id !== ALLOWED_ADMIN_ID) {
            return interaction.reply({ content: "🔒 **This one's admin-only.** Try any of the bot's public commands instead!", ephemeral: true });
        }

        const attachment = interaction.options.getAttachment('screenshot');
        const url = interaction.options.getString('url');
        const retryToken = interaction.options.getString('retry_token');
        const imageUrl = attachment ? attachment.url : (url ? url.trim() : null);
        // Explicit option only -- unlike the loadout lookup commands' `private`, this has no saved
        // preference layer to fall back on (admin-only PoC, single admin, not worth the extra state).
        // Omitted -> stays private, matching the behavior before this option existed.
        const isEphemeral = interaction.options.getBoolean('private') ?? true;

        // retry_token path (Task 7 adds retryImageUpload) -- Discord modals can't accept file
        // attachments, so "ask for the image again" after a Cloudinary failure has to be a fresh
        // slash-command invocation, not a button/modal round-trip. See the design spec's "Image
        // retry mechanism" decision.
        if (retryToken) {
            if (!imageUrl) {
                return interaction.reply({ content: '❌ Provide `screenshot` or `url` with a retry_token.', ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: isEphemeral });
            const { retryImageUpload } = require('../utils/autobuildPipeline');
            return retryImageUpload(interaction, retryToken, imageUrl);
        }

        if ((attachment && url) || (!attachment && !url)) {
            return interaction.reply({ content: '❌ Provide exactly one of `screenshot` or `url`.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: isEphemeral });
        const category = interaction.options.getString('category');
        const badges = interaction.options.getString('badges');
        return runExtraction(interaction, imageUrl, category, badges);
    }
};
