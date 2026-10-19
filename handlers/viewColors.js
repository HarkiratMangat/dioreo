// ==========================================
// VIEW COLORS — THE PAGE ROW
// ==========================================
// The page buttons under a View Colors panel (commands/viewColors.js; added 2026-10-19 11:39 EDT). Anyone may press them, and a press only changes which page of the RIGHT-CLICKED person's colours is shown: the subject's id comes from the custom_id, never from whoever clicked.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Awaited inside handlers/router.js's one try/catch: nothing here swallows. See .claude/rules/interaction-router.md.
//
// ⚠️ THE SERVER PROFILE ON A CLICK. The right-click handed over the subject's server profile; a click carries only the CLICKER's. So a panel first drawn from a server profile (`s`) re-reads the subject's member record over REST, which works where the bot is in the server; anywhere else (a 404) it falls back to their main profile.
const { Routes } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');

const OWNED_PREFIXES = ['vc_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function subjectMember(interaction, targetId, variantFlag) {
    if (variantFlag !== 's' || !interaction.guildId) return null;
    try {
        return await interaction.client.rest.get(Routes.guildMember(interaction.guildId, targetId));
    } catch {
        return null;
    }
}

async function route(interaction) {
    // A PAGE BUTTON -- `vc_page|{id}|{page}|{s|g}`.
    if (interaction.isButton() && interaction.customId.startsWith('vc_page|')) {
        const [, targetId, page, variantFlag] = interaction.customId.split('|');
        const command = interaction.client.commands.get('View Colors');
        if (!command || !command.PAGES.some(([key]) => key === page)) return await interaction.deferUpdate().catch(() => {});
        await interaction.deferUpdate();
        const target = await interaction.client.users.fetch(targetId, { force: true });
        const member = await subjectMember(interaction, targetId, variantFlag);
        const { panel, files } = await command.renderPanel(interaction, target, member, page);
        // Keeps the message's own privacy: a reply a server rule made private stays private.
        const flags = 32768 | ((interaction.message?.flags?.bitfield ?? 0) & 64);
        return await sendV2Payload(interaction, panel, { flags, allowedMentions: { users: [] }, files, skipExpiry: true });
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleViewColorsInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleViewColorsInteraction, OWNED_PREFIXES };
