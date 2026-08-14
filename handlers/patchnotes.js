// ==========================================
// PATCHNOTES — INTERACTION HANDLER
// ==========================================
// /patch notes' season-history dropdown. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js
// split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `select_patch_history`.
// Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so
// deciding ownership up front cannot change which handler wins, and every branch below keeps the
// exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handlePatchnotesInteraction is awaited from
// inside handlers/router.js's single top-level try/catch -- do not add one here, do not register
// listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare
// `return interaction.reply(...)` can reject after the try has exited and escape the net.
// See .claude/rules/interaction-router.md.

const { buildSyntheticInteraction, resolvePanelActor } = require('../utils/interactionContext');

const OWNED_PREFIXES = ["select_patch_history"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // PATCH NOTES HISTORY SELECTOR
        if (interaction.customId === 'select_patch_history') {
            await interaction.deferUpdate();
            const patchId = interaction.values[0].replace('patch_', '');
            const patchnotesCommand = interaction.client.commands.get('patch');

            // Generate synthetic interaction to trigger the command file seamlessly
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await patchnotesCommand.execute(syntheticInteraction, patchId);
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handlePatchnotesInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handlePatchnotesInteraction, OWNED_PREFIXES };
