// ==========================================
// COMMAND: ADMINISTRATIVE UPDATE GATEWAY
// ==========================================
// Centralized hub for injecting new data rows into the MongoDB Atlas cluster.
// Generates custom contextual overlay modals based on the dropdown category selected.

const { SlashCommandBuilder } = require('discord.js');

// SECURITY GATEWAY: Administrative override locks
const ALLOWED_ADMIN_ID = '1139845545754632283';

module.exports = {
    // COMMAND DEFINITION: Hides command entirely from regular users
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('👑 Administrative Content Suite Update Gateway')
        .setDefaultMemberPermissions(0) // RESTRICTS TO SEVER ADMINISTRATORS ONLY NATIVELY
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Select the target configuration to update')
                .setRequired(true)
                .addChoices(
                    { name: '🛑 START NEW SEASON (Wipes Old Data)', value: 'wipe_season' },
                    { name: '🎉 Bulk Add Draws', value: 'draws_bulk' },
                    { name: '📅 Bulk Import Calendar Events', value: 'add_calendar' },
                    { name: '📝 Add Patch Notes', value: 'add_patchnotes' },
                    { name: '⏳ Edit Season Deadlines', value: 'edit_deadlines' }
                )),

    async execute(interaction) {
        // Double bulletproof permission layer guard check
        if (interaction.user.id !== ALLOWED_ADMIN_ID) {
            return interaction.reply({ content: '❌ Access Denied. You do not possess structural gateway write clearance.', ephemeral: true });
        }

        const category = interaction.options.getString('category');

        // --- ROUTE A: INITIALIZE NEW SEASON ---
        if (category === 'wipe_season') {
            const payload = {
                title: "Initialize New Season", custom_id: "modal_wipe_season",
                components: [{
                    type: 1, components: [{
                        type: 4, custom_id: "season_title", style: 1,
                        label: "New Season Title", placeholder: "e.g. Season 7: Ghost in the Shell", required: true
                    }]
                }]
            };
            return await interaction.showModal(payload);
        }

        // --- ROUTE B: BULK DRAWS IMPORT ---
        if (category === 'draws_bulk') {
            const payload = {
                title: "Bulk Import Lucky Draws", custom_id: "modal_draws_bulk",
                components: [{
                    type: 1, components: [{
                        type: 4, custom_id: "bulk_text", style: 2,
                        label: "Comma-Separated Data",
                        placeholder: "n Title, m Item 1, e Item 2, july 10, url.jpg\nr Title 2, l Item, aug 5, url.jpg",
                        required: true
                    }]
                }]
            };
            return await interaction.showModal(payload);
        }

        // --- ROUTE C: BULK CALENDAR EVENTS ---
        // NOTE (redesigned during review): this used to be one event at a time (title + date only).
        // Now takes a bulk bullet-separated paste — "M/D - M/D | Event Title" per entry, or
        // "M/D - All Season | Event Title" for events with no fixed end — same format as your
        // notes-app export. See utils/adminParser.js's parseBulkEvents for the parsing logic.
        if (category === 'add_calendar') {
            const payload = {
                title: "Bulk Import Calendar Events", custom_id: "modal_calendar_bulk",
                components: [{
                    type: 1, components: [{
                        type: 4, custom_id: "bulk_text", style: 2,
                        label: "Bulleted Event List (UTC-0 dates)",
                        placeholder: "• 7/2 - 8/5 | Throwable Frenzy MP Mode • 7/10 - All Season | Shadow and Shade Mythic Drop",
                        required: true
                    }]
                }]
            };
            return await interaction.showModal(payload);
        }

        // --- ROUTE D: CAROUSEL PATCH SLIDES ---
        // NOTE (redesigned during review): "Patch Title" is renamed to reflect what it actually
        // represents now — just the season # & name (e.g. "Season 6: Take Your Heart"), not the
        // full "Balance Changes for..." string. patchnotes.js now builds that prefix itself so the
        // heading always reads "Balance Changes — {season}" while the dropdown just shows the bare
        // season name. Also added an optional "Additional Info" field per the new design.
        if (category === 'add_patchnotes') {
            const payload = {
                title: "Add Patch Notes", custom_id: "modal_add_patchnotes",
                components: [
                    { type: 1, components: [{ type: 4, custom_id: "patch_title", style: 1, label: "Season # & Name", placeholder: "e.g. Season 6: Take Your Heart", required: true }] },
                    { type: 1, components: [{ type: 4, custom_id: "patch_description", style: 2, label: "Additional Info (optional)", required: false }] },
                    { type: 1, components: [{ type: 4, custom_id: "patch_urls", style: 2, label: "Cloudinary Image URLs (One per line)", required: true }] }
                ]
            };
            return await interaction.showModal(payload);
        }

        // --- ROUTE E: TIMELINE COUNTDOWNS ---
        if (category === 'edit_deadlines') {
            const payload = {
                title: "Set Season Deadlines", custom_id: "modal_edit_deadlines",
                components: [
                    { type: 1, components: [{ type: 4, custom_id: "bp_end", style: 1, label: "Battle Pass End Date", placeholder: "e.g. August 28", required: false }] },
                    { type: 1, components: [{ type: 4, custom_id: "rank_end", style: 1, label: "Ranked Series End Date", required: false }] },
                    { type: 1, components: [{ type: 4, custom_id: "dmz_end", style: 1, label: "DMZ Season End Date", required: false }] }
                ]
            };
            return await interaction.showModal(payload);
        }
    }
};