// ==========================================
// /mockmanage — THROWAWAY MOCK-UP of the /manage gunsmith mp rehaul (dev bot only, owner only)
// ==========================================
// Built 2026-11-07 11:26 EST for the manage-rehaul planning (Harkirat, 11:22 EST: "throwaway... i want to see a real workign mockup"). It NEVER writes to the database: every save shows what it would do; Export really builds the file, which only reads. `devOnly` keeps it off prod (bot/registry.js), and it is deleted before the rehaul's PR. All behaviour lives in handlers/mockManage.js.
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName('mockmanage')
        .setDescription('Mock-up of the new /manage gunsmith mp (nothing saves)')
        .addStringOption(o => o.setName('build').setDescription('Go to one build: type a weapon, a number or a label, e.g. fss 1b').setAutocomplete(true))
        .addStringOption(o => o.setName('do').setDescription('What to do. With a build or builds it happens right away').addChoices(
            { name: 'Add Build', value: 'add' }, { name: 'Edit', value: 'edit' }, { name: 'Move', value: 'move' }, { name: 'Add Option', value: 'addopt' },
            { name: 'Delete', value: 'delete' }, { name: 'Paste Builds', value: 'paste' }, { name: 'Export', value: 'export' }, { name: 'Guide', value: 'guide' }))
        .addStringOption(o => o.setName('builds').setDescription('Several builds, comma-separated: fss 1b, static, smg'))
        .addStringOption(o => o.setName('weapon').setDescription('Go to a weapon and all its builds').setAutocomplete(true))
        .addStringOption(o => o.setName('class').setDescription('Go to a class and pick a weapon').addChoices(
            { name: 'Assault', value: 'AR' }, { name: 'Sniper', value: 'SNIPER' }, { name: 'LMG', value: 'LMG' }, { name: 'SMG', value: 'SMG' },
            { name: 'Shotgun', value: 'SHOTGUN' }, { name: 'Marksman', value: 'MARKSMAN' }, { name: 'Secondary', value: 'SECONDARIES' })),
    async execute(interaction) {
        const m = require('../handlers/mockManage').mock;
        if (!require('../utils/owner').isOwnerId(interaction.user.id)) return interaction.reply({ content: '🔒 The mock-up is for the owner.', flags: 64 });
        const o = interaction.options;
        if (!['build', 'do', 'builds', 'weapon', 'class'].some(k => o.getString(k))) return m.openPage(interaction);
        return m.openFromSlash(interaction);
    },
};
