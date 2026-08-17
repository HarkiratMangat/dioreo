// ==========================================
// COMMAND: DEDICATED VIEW COLORS LAUNCH
// ==========================================
// A standalone entry point into utils/colorPaletteView.js's panel (2026-07-14, Harkirat's request) -- previously only reachable via the "View Colors" button inside /settings. This is a thin wrapper around the exact same render pipeline that button already uses (utils/colorPalette.js's getPalettePanelData + utils/colorPaletteView.js's buildColorPalettePanel), not a separate implementation -- keeps both entry points guaranteed identical instead of two copies drifting.
const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const { getPalettePanelData } = require('../utils/colorPalette');
const { buildColorPalettePanel } = require('../utils/colorPaletteView');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('colors')
        // Trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) -- was truncating on mobile.
        .setDescription('View colors extracted from your profile')
        // Reordered 2026-08-13 (Harkirat: "page/source/visibility reads better than leading with visibility") -- Discord's option picker follows registration order, not alphabetical, so this order IS the display order. Jump straight to a specific source page instead of always landing on Avatar. Values match utils/colorPaletteView.js's SOURCE_META keys exactly.
        .addStringOption(option => option.setName('page').setDescription('Jump straight to a specific color source.').addChoices(
            { name: 'Avatar', value: 'avatar' },
            { name: 'Banner', value: 'banner' },
            { name: 'Name', value: 'name' },
            { name: 'Nameplate', value: 'nameplate' },
            { name: 'Deco', value: 'decoration' }
        ))
        // Per-server profile support (2026-08-09 17:12 EDT). The ONLY override in the whole feature, and deliberately NOT saved to UserPreference -- per-invocation only, same shape as /timestamp's `view`. Everything else resolves from context alone. Renamed 'from' -> 'source' with clearer choice labels 2026-08-13 (Harkirat's request).
        .addStringOption(option => option.setName('source').setDescription("Read colors from your main profile, or your profile for this server.").addChoices({ name: 'From Main Profile', value: 'global' }, { name: 'From Server Profile', value: 'server' }))
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    async execute(interaction) {
        const userId = interaction.user.id;
        let prefs = await UserPreference.findOne({ discordId: userId });
        if (!prefs) prefs = new UserPreference({ discordId: userId });

        // No dedicated visibility preference field of its own -- reuses settingsVisibility, same as the "View Colors" button inside /settings itself, so behavior stays consistent between the two entry points unless this specific invocation explicitly overrides it.
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'settingsVisibility' });

        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        }

        // The DEFAULT is contextual, not global: ask for the server view and let per-source fallback decide, exactly as /settings' View Colors button does. So running /colors in a server where you have a server profile shows those colours with no option typed, and running it in a DM (or a server where you don't) shows your global ones. `source:main` forces global; `source:server` forces server and errors below if there is nothing to show.
        const sourceChoice = interaction.isChatInputCommand() ? interaction.options.getString('source') : null;
        const requested = sourceChoice === 'global' ? 'global' : 'server';

        // Which page to land on -- defaults to avatar, unchanged behavior when omitted.
        const pageChoice = interaction.isChatInputCommand() ? (interaction.options.getString('page') || 'avatar') : 'avatar';

        // Only the landing page is extracted here -- other sources lazily extract when the user navigates to them (see utils/colorPalette.js's getPalettePanelData for why).
        const data = await getPalettePanelData(interaction, prefs, pageChoice, false, requested);
        // What we ACTUALLY ended up rendering -- asking for the server view and having no override resolves to the global images, so the panel must be labelled global or its switch button would offer to show colours already on screen.
        const variant = (requested === 'server' && data.hasServerProfile) ? 'server' : 'global';

        // Asked for server colours where there are none -- in a DM, in a guild with no server profile set. Rather than silently serving global colours under a "server" heading (a quiet wrong answer), say so and offer the switch. Harkirat's spec: "output a warning message and offer to edit the message and display the global colors." Only when the user EXPLICITLY asked for server colours. The contextual default must never land here -- someone who just typed /colors in a DM wants their colours, not an error.
        if (sourceChoice === 'server' && !data.hasServerProfile) {
            const reason = data.inGuild
                ? "You don't have a server profile set for this server."
                : "Server profiles only exist inside a server — there's none to read here.";
            const warning = {
                type: 17,
                components: [
                    { type: 10, content: `### No server colors to show\n${reason}` },
                    { type: 14, spacing: 1, divider: true },
                    { type: 10, content: "-# Your main profile colors are ready whenever you want them." },
                    {
                        type: 1,
                        components: [{
                            type: 2, style: 1, label: 'Show Global Colors',
                            // Reuses the same handler the in-panel switch uses, so there is one implementation of "render this variant", not two.
                            custom_id: `colors_variant_g_${pageChoice}_0|${userId}`
                        }]
                    }
                ]
            };
            return await sendV2Payload(interaction, [warning], { flags: 32768 | (isEphemeral ? 64 : 0), allowedMentions: { users: [] } });
        }

        const { components, files } = await buildColorPalettePanel({
            source: pageChoice,
            data,
            targetUserId: userId,
            // The server view has its own avatar; data.avatarThumbnailUrl already reflects whichever variant was resolved, so it wins when present.
            avatarThumbnailUrl: data.avatarThumbnailUrl || interaction.user.displayAvatarURL({ extension: 'png', size: 256 }),
            variant
        });

        return await sendV2Payload(interaction, components, { flags: 32768 | (isEphemeral ? 64 : 0), allowedMentions: { users: [] }, files });
    }
};
