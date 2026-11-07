// ==========================================
// /mockdraws — THROWAWAY MOCK-UP of the /manage draws rehaul (dev bot only, owner only)
// ==========================================
// Built 2026-11-07 16:44 EST after his "yeah go ahead" to mocking up the Draws section the way /manage gunsmith was (v3.13.0, #261). It NEVER writes: every save answers with what it WOULD do; Export builds a real file, which only reads. `devOnly` keeps it off prod (bot/registry.js), and it is deleted before the rehaul's PR. All behaviour lives in handlers/mockDraws.js.
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName('mockdraws')
        .setDescription('Mock-up of the new /manage draws (nothing saves)')
        .addStringOption(o => o.setName('draw').setDescription('Go to one draw: type part of its title').setAutocomplete(true))
        .addStringOption(o => o.setName('do').setDescription('What to do. With a draw it happens right away').addChoices(
            { name: 'Quick Add', value: 'quickadd' }, { name: 'Add New Draw', value: 'addnew' }, { name: 'Add Returning Draw', value: 'addreturning' },
            { name: 'Edit', value: 'edit' }, { name: 'Set End Date', value: 'end' }, { name: 'Move New/Returning', value: 'move' }, { name: 'Delete', value: 'delete' },
            { name: 'Paste Draws', value: 'paste' }, { name: 'Export', value: 'export' }))
        .addStringOption(o => o.setName('show').setDescription('Open a list of draws').addChoices(
            { name: 'New Draws', value: 'new' }, { name: 'Returning Draws', value: 'returning' }, { name: 'Upcoming', value: 'upcoming' },
            { name: 'Active Now', value: 'live' }, { name: 'Leaving Soon', value: 'leaving' }, { name: 'Ended', value: 'ended' }, { name: 'No End Date', value: 'noend' })),
    async execute(interaction) {
        if (!require('../utils/owner').isOwnerId(interaction.user.id)) return interaction.reply({ content: '🔒 The mock-up is for the owner.', flags: 64 });
        return require('../handlers/mockDraws').mock.openFromSlash(interaction);
    },
};
