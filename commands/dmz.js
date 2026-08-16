// ==========================================
// COMMAND: STANDALONE DMZ LOADOUT LOOKUP
// ==========================================
// This handles dedicated DMZ weapon configurations, restricting lookups strictly
// to DMZ variants allowing up to 9 attachments per weapon schema layout.
// Reduced to a thin wrapper over utils/loadoutLookup.js's lookupAndRenderWeapon() during the
// /gunsmiths consolidation -- that function is the same lookup logic this file used to own
// directly, now shared with /gunsmiths search (mode: 'MP') so the two paths can't drift apart.
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dmz')
        .setDescription('Search through all DMZ specific gunsmiths')
        // Both option descriptions trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) --
        // were truncating on mobile. Kept the same standardized "weapon you want a build for"
        // formula /gunsmiths search uses, just tightened -- see that command for the matching trim.
        .addStringOption(option =>
            option.setName('weapon')
                .setDescription('The DMZ weapon you want a build for')
                .setRequired(true)
                .setAutocomplete(true)) // Autocomplete hooked dynamically in handlers/router.js
        .addIntegerOption(option =>
            option.setName('build')
                .setDescription('Jump to a specific build number')
                .setMinValue(1))
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    async execute(interaction) {
        const { lookupAndRenderWeapon } = require('../utils/loadoutLookup');
        return lookupAndRenderWeapon(interaction, {
            mode: 'DMZ',
            rawQuery: interaction.options.getString('weapon'),
            requestedBuild: interaction.options.getInteger('build'),
            visibilityChoice: interaction.options.getString('visibility'),
        });
    },
};
