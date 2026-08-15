// ==========================================
// HELP — INTERACTION HANDLER
// ==========================================
// /help's category dropdown. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js
// split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `help_category`.
// Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so
// deciding ownership up front cannot change which handler wins, and every branch below keeps the
// exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleHelpInteraction is awaited from
// inside handlers/router.js's single top-level try/catch -- do not add one here, do not register
// listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare
// `return interaction.reply(...)` can reject after the try has exited and escape the net.
// See .claude/rules/interaction-router.md.

const { buildSyntheticInteraction, resolvePanelActor } = require('../utils/interactionContext');
const { hasCommandAccess } = require('../utils/adminAccess');

const OWNED_PREFIXES = ["help_category", "help_guide_pick"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // B2. HELP CATEGORY SELECTOR
        if (interaction.customId === 'help_category') {
            await interaction.deferUpdate();
            const helpCommand = interaction.client.commands.get('help');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await helpCommand.execute(syntheticInteraction, interaction.values[0]);
        }

        // B2b. BOT ADMIN'S "jump to a /manage guide" DROPDOWN (item 10, added 2026-08-15 13:11 EDT).
        // Re-checks perms.manage server-side rather than trusting the dropdown having been hidden --
        // same defense-in-depth every other admin-gated action in this bot uses (the dropdown is
        // only ever RENDERED for someone who already has it, this is the click-time re-check).
        // Opens as its own new ephemeral reply, same pattern /manage's own Guide button uses
        // (utils/manageActions.js's openFormatGuide) -- never edits the /help page underneath it.
        if (interaction.customId === 'help_guide_pick') {
            if (!(await hasCommandAccess(interaction.user.id, 'manage'))) {
                return await interaction.reply({ content: "🔒 You don't have access to `/manage`.", ephemeral: true });
            }
            const { buildGuideContainer } = require('../utils/manageGuides');
            const { sendV2Payload } = require('../utils/sendV2Payload');
            await interaction.deferReply({ ephemeral: true });
            return await sendV2Payload(interaction, buildGuideContainer(interaction.values[0]));
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handleHelpInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleHelpInteraction, OWNED_PREFIXES };
