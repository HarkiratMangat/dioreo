// ==========================================
// /manage season titles + draft — the rehauled panel (SCAFFOLD)
// ==========================================
// Scaffold written 2026-11-07 21:00 EST by the lead so the wiring (commands/manage.js, handlers/manage/index.js, shared.js, utils/autocomplete.js) could land before the builder. Until the builder replaces this file, it shows the old page, so nothing is broken in between. Contract: handleSeasonPanelInteraction(interaction) returns TRUE only for ids starting with PREFIX; openFromSlash(interaction, view = 'live') answers the slash command; renderHome(interaction, view = 'live') redraws the panel in place from the page dropdown; autocomplete(interaction) answers this section's target option.

const PREFIX = 'mng_ss|';
const SECTION = { live: 'season_titlesdeadlines', draft: 'seasondraft' };

async function oldPage(interaction, section, { ephemeral = true, update = false } = {}) {
    const m = require('../../../commands/manage');
    if (update) await interaction.deferUpdate(); else await interaction.deferReply({ flags: ephemeral ? 64 : 0 });
    const data = await m.buildDynamicData(section);
    return require('../../../utils/sendV2Payload').sendV2Payload(interaction, m.buildManagePage(section, data, interaction.client, null, { showEmojis: require('../../../utils/owner').isOwnerId(interaction.user.id) }));
}

async function handleSeasonPanelInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith(PREFIX)) return false;
    await interaction.reply({ content: 'This panel is being rebuilt. Open /manage again.', flags: 64 });
    return true;
}
async function openFromSlash(interaction, view = 'live') { return oldPage(interaction, (view === 'draft' ? 'seasondraft' : SECTION.live), { ephemeral: interaction.options.getString('visibility') !== 'public' }); }
async function renderHome(interaction, view = 'live') { return oldPage(interaction, (view === 'draft' ? 'seasondraft' : SECTION.live), { update: true }); }
async function autocomplete(interaction) { return interaction.respond([]); }

module.exports = { handleSeasonPanelInteraction, openFromSlash, renderHome, autocomplete, PREFIX };
