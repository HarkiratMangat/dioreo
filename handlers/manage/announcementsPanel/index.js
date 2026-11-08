// ==========================================
// /manage announcement — the rehauled panel (SCAFFOLD)
// ==========================================
// Scaffold written 2026-11-07 21:00 EST by the lead so the wiring (commands/manage.js, handlers/manage/index.js, shared.js, utils/autocomplete.js) could land before the builder. Until the builder replaces this file, it shows the old page, so nothing is broken in between. Contract: handleAnnouncementsPanelInteraction(interaction) returns TRUE only for ids starting with PREFIX; openFromSlash(interaction) answers the slash command; renderHome(interaction) redraws the panel in place from the page dropdown; autocomplete(interaction) answers this section's target option.

const PREFIX = 'mng_an|';
const SECTION = 'announcement';

async function oldPage(interaction, section, { ephemeral = true, update = false } = {}) {
    const m = require('../../../commands/manage');
    if (update) await interaction.deferUpdate(); else await interaction.deferReply({ flags: ephemeral ? 64 : 0 });
    const data = await m.buildDynamicData(section);
    return require('../../../utils/sendV2Payload').sendV2Payload(interaction, m.buildManagePage(section, data, interaction.client, null, { showEmojis: require('../../../utils/owner').isOwnerId(interaction.user.id) }));
}

async function handleAnnouncementsPanelInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith(PREFIX)) return false;
    await interaction.reply({ content: 'This panel is being rebuilt. Open /manage again.', flags: 64 });
    return true;
}
async function openFromSlash(interaction) { return oldPage(interaction, SECTION, { ephemeral: interaction.options.getString('visibility') !== 'public' }); }
async function renderHome(interaction) { return oldPage(interaction, SECTION, { update: true }); }
async function autocomplete(interaction) { return interaction.respond([]); }

module.exports = { handleAnnouncementsPanelInteraction, openFromSlash, renderHome, autocomplete, PREFIX };
