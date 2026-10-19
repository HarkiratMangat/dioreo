// ==========================================
// PATCHNOTES — INTERACTION HANDLER
// ==========================================
// /patch notes' season-history dropdown and its Search Older Seasons pop-up. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `select_patch_history`, `patch_search`. Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so deciding ownership up front cannot change which handler wins, and every branch below keeps the exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handlePatchnotesInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare `return interaction.reply(...)` can reject after the try has exited and escape the net. See .claude/rules/interaction-router.md.

const { buildSyntheticInteraction, resolvePanelActor } = require('../utils/interactionContext');

const OWNED_PREFIXES = ["select_patch_history", "patch_search"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // PATCH NOTES HISTORY SELECTOR
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_patch_history') {
            await interaction.deferUpdate();
            const patchId = interaction.values[0].replace('patch_', '');
            const patchnotesCommand = interaction.client.commands.get('patch');

            // Generate synthetic interaction to trigger the command file seamlessly
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await patchnotesCommand.execute(syntheticInteraction, patchId);
        }
        // SEARCH OLDER SEASONS (2026-10-19 00:30 EDT): past the 12 the dropdown lists, a pop-up finds any kept season by name or number.
        if (interaction.isButton() && interaction.customId === 'patch_search_open') {
            const { buildSearchModal } = require('../commands/patchnotes');
            await interaction.showModal(buildSearchModal());
            return;
        }
        if (interaction.isModalSubmit() && interaction.customId === 'patch_search_submit') {
            await interaction.deferUpdate();
            const SeasonalData = require('../models/SeasonalData');
            const { findPatchByQuery } = require('../commands/patchnotes');
            const query = interaction.fields.getTextInputValue('q');
            const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
            const hit = doc && doc.patchNotes ? findPatchByQuery(doc.patchNotes, query) : null;
            if (!hit) {
                try { await interaction.followUp({ content: `No season matches "${String(query).slice(0, 60)}".`, flags: 64 }); } catch (notifyError) { console.error('Failed to report a patch notes search with no match (interaction likely expired):', notifyError); }
                return;
            }
            const patchnotesCommand = interaction.client.commands.get('patch');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await patchnotesCommand.execute(syntheticInteraction, String(hit._id));
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handlePatchnotesInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handlePatchnotesInteraction, OWNED_PREFIXES };
