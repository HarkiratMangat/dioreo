// ==========================================
// ANNOUNCEMENT CONTROLS — INTERACTION HANDLER
// ==========================================
// The `ann_` buttons: "Why am I seeing this?" under every delivered announcement (utils/announcement.js whyButtonRow), and the Turn off / Turn back on switch in its private answer (buildWhyPanel). Built 2026-10-26 15:20 EDT from Harkirat's announcement-controls ask; the same setting is also in /settings (page 2, Preferences) and /remind (its bottom row).
//
// No owner lock, deliberately: every `ann_` button sits on a message only one person can see, and each one changes the PRESSER's own setting, never anyone else's.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S (.claude/rules/interaction-router.md): no try/catch that swallows, no listeners, every reply awaited.

const { sendV2Payload } = require('../utils/sendV2Payload');
const A = require('../utils/announcement');

const OWNED_PREFIXES = ['ann_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
    // Literal ids, not utils/announcement.js's ANN_*_ID constants, so scripts/handlerRouting.test.js can see each branch behind the `ann_` prefix. The answer, privately, as a new message under the announcement.
    if (interaction.isButton() && interaction.customId === 'ann_why') {
        await interaction.deferReply({ flags: 64 });
        return await sendV2Payload(interaction, A.buildWhyPanel('on', interaction.client));
    }
    // The switch, redrawn in place.
    if (interaction.isButton() && (interaction.customId === 'ann_off' || interaction.customId === 'ann_on')) {
        const off = interaction.customId === 'ann_off';
        await interaction.deferUpdate();
        await A.setAnnouncementsOff(interaction.user.id, off);
        return await sendV2Payload(interaction, A.buildWhyPanel(off ? 'off' : 'back', interaction.client));
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the contract every handlers/*.js module follows.
async function handleAnnouncementControlsInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleAnnouncementControlsInteraction, OWNED_PREFIXES };
