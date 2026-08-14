// ==========================================
// PAGINATION — INTERACTION HANDLER
// ==========================================
// /draws + /calendar pagination. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js
// split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `page_`, `subpage_`, `calpage_`.
// Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so
// deciding ownership up front cannot change which handler wins, and every branch below keeps the
// exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handlePaginationInteraction is awaited from
// inside handlers/router.js's single top-level try/catch -- do not add one here, do not register
// listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare
// `return interaction.reply(...)` can reject after the try has exited and escape the net.
// See .claude/rules/interaction-router.md.

const { buildSyntheticInteraction, resolvePanelActor } = require('../utils/interactionContext');

const OWNED_PREFIXES = ["page_", "subpage_", "calpage_"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // DRAWS PAGINATION (New vs Returning)
        if (interaction.customId === 'page_returning_draws' || interaction.customId === 'page_new_draws') {
            // No deferUpdate() -- single-hop, see sendV2Payload.js's header comment.
            const targetPage = interaction.customId === 'page_returning_draws' ? 'returning' : 'new';
            const drawsCommand = interaction.client.commands.get('draws');

            // Build synthetic routing payload
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await drawsCommand.execute(syntheticInteraction, targetPage);
        }

        // DRAWS SUB-PAGE PAGINATION (Prev/Next within a category, once it exceeds CHUNK_SIZE)
        // custom_id format: subpage_<new|returning>_<targetIndex>, e.g. "subpage_new_2"
        if (interaction.customId.startsWith('subpage_new_') || interaction.customId.startsWith('subpage_returning_')) {
            // No deferUpdate() -- single-hop, see sendV2Payload.js's header comment.
            const isNewCategory = interaction.customId.startsWith('subpage_new_');
            const targetPage = isNewCategory ? 'new' : 'returning';
            const targetSubPage = parseInt(interaction.customId.replace(isNewCategory ? 'subpage_new_' : 'subpage_returning_', ''), 10) || 0;
            const drawsCommand = interaction.client.commands.get('draws');

            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await drawsCommand.execute(syntheticInteraction, targetPage, targetSubPage);
        }

        // CALENDAR PAGE TOGGLE (Draws / Events / Playlists-Modes -- replaces the old Prev/Next
        // sub-page pagination, 2026-07-31 14:00 EDT, per Harkirat's explicit request for named
        // section-toggle buttons instead of arrows). custom_id format: calpage_<0|1|2>.
        if (interaction.customId.startsWith('calpage_')) {
            // REVERTED to two-hop 2026-08-07 17:38 EDT (v2.60.0) -- see the price_region_ branch's
            // comment above for the full reasoning (the emoji-blank bug + investigation).
            await interaction.deferUpdate();
            const targetPage = parseInt(interaction.customId.replace('calpage_', ''), 10) || 0;
            const calendarCommand = interaction.client.commands.get('calendar');

            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await calendarCommand.execute(syntheticInteraction, targetPage);
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handlePaginationInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handlePaginationInteraction, OWNED_PREFIXES };
