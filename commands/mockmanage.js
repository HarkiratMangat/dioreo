// ==========================================
// /mockmanage — THROWAWAY MOCK-UP of the /manage gunsmith mp rehaul (dev bot only, owner only)
// ==========================================
// Built 2026-11-07 11:26 EST for the manage-rehaul planning (Harkirat, 11:22 EST: "throwaway... i want to see a real workign mockup"). It NEVER writes to the database: every save shows what it would do; Export really builds the file, which only reads. `devOnly` keeps it off prod (bot/registry.js), and it is deleted before the rehaul's PR. All behaviour lives in handlers/mockManage.js.
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName('mockmanage')
        .setDescription('Mock-up of the new /manage gunsmith mp (nothing saves)'),
    async execute(interaction) {
        return require('../handlers/mockManage').mock.openPage(interaction);
    },
};
