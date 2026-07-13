// ==========================================
// COMMAND: DEDICATED VIEW COLORS LAUNCH
// ==========================================
// A standalone entry point into utils/colorPaletteView.js's panel (2026-07-14, Harkirat's request)
// -- previously only reachable via the "View Colors" button inside /settings. This is a thin wrapper
// around the exact same render pipeline that button already uses (utils/colorPalette.js's
// refreshAllPalettes + utils/colorPaletteView.js's buildColorPalettePanel), not a separate
// implementation -- keeps both entry points guaranteed identical instead of two copies drifting.
const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const { refreshAllPalettes } = require('../utils/colorPalette');
const { buildColorPalettePanel } = require('../utils/colorPaletteView');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('colors')
        .setDescription('View colors extracted from your avatar, banner, and other profile elements')
        .addBooleanOption(option => option.setName('hidden').setDescription('True = only you can see this response. False = everyone in the chat can see it.'))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    async execute(interaction) {
        const userId = interaction.user.id;
        let prefs = await UserPreference.findOne({ discordId: userId });
        if (!prefs) prefs = new UserPreference({ discordId: userId });

        // No dedicated visibility preference field of its own -- reuses settingsVisibility, same as
        // the "View Colors" button inside /settings itself, so behavior stays consistent between the
        // two entry points unless this specific invocation explicitly overrides it.
        const argPrivate = interaction.isChatInputCommand() ? interaction.options.getBoolean('hidden') : null;
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'settingsVisibility' });

        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        }

        const data = await refreshAllPalettes(interaction, prefs);
        const { components, files } = await buildColorPalettePanel({
            source: 'avatar',
            data,
            targetUserId: userId,
            avatarThumbnailUrl: interaction.user.displayAvatarURL({ extension: 'png', size: 256 })
        });

        return await sendV2Payload(interaction, components, { flags: 32768 | (isEphemeral ? 64 : 0), allowedMentions: { users: [] }, files });
    }
};
