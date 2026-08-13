// commands/autobuild.js
// Screenshot -> Gemini vision extraction -> review/edit -> Cloudinary upload -> Loadout doc, gated
// behind an explicit admin Confirm step. Full design: docs/superpowers/specs/2026-07-19-loadout-
// automation-poc-design.md. Admin-only (same ALLOWED_ADMIN_ID as /manage), MP-only for this PoC.
// Extraction/state/write logic lives in utils/autobuildPipeline.js, shared with index.js's button/
// modal handlers for Confirm/Edit/Cancel/retry -- this file only does option parsing + admin gating.
const { SlashCommandBuilder } = require('discord.js');
const { hasCommandAccess } = require('../utils/adminAccess'); // owner OR Mongo-allowlisted admin scoped to 'autobuild'
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
        // Renamed `private` (boolean) -> `visibility` (Hidden/Public string) 2026-08-10 19:28 EDT.
        // The bot-wide rename landed in v3.1.0 for every other command and missed this one, so this
        // was the last `private` left in the bot -- see .claude/rules/commands-overview.md.
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat. (Defaults to only you.)').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        // ADMIN-ONLY: stays user-install [1] deliberately -- the 10 public commands moved to [0, 1]
        // (guild install) for v3, but an admin command advertised in every server's command list is
        // noise plus needless surface. Harkirat still reaches it anywhere via his own user install.
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),

    async execute(interaction) {
        if (!(await hasCommandAccess(interaction.user.id, 'autobuild'))) {
            return interaction.reply({ content: "🔒 **This one's admin-only.** Try any of the bot's public commands instead!", ephemeral: true });
        }

        const attachment = interaction.options.getAttachment('screenshot');
        const url = interaction.options.getString('url');
        const retryToken = interaction.options.getString('retry_token');
        const imageUrl = attachment ? attachment.url : (url ? url.trim() : null);
        // Explicit option only -- unlike the loadout lookup commands' `visibility`, this has no saved
        // preference layer to fall back on (admin-only PoC, single admin, not worth the extra state).
        // Omitted -> stays hidden, matching the behavior before this option existed.
        const visibilityChoice = interaction.options.getString('visibility');
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';

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
