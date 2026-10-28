// ==========================================
// PAGINATION — INTERACTION HANDLER
// ==========================================
// /draws + /calendar pagination. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `page_`, `subpage_`, `calpage_`. Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so deciding ownership up front cannot change which handler wins, and every branch below keeps the exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handlePaginationInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare `return interaction.reply(...)` can reject after the try has exited and escape the net. See .claude/rules/interaction-router.md.

const { buildSyntheticInteraction } = require('../utils/interactionContext');

const OWNED_PREFIXES = ["page_", "subpage_", "calpage_", "calsel_"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // DRAWS PAGINATION (New vs Returning)
        if (interaction.customId === 'page_returning_draws' || interaction.customId === 'page_new_draws') {
            // No deferUpdate() here: sendV2Payload() acks with one when the render arrives, so this is two trips like every other click (2026-10-27 20:49 EDT; it was one trip until the v3 launch, and /draws' New/Returning switch and arrows blanked their emojis).
            const targetPage = interaction.customId === 'page_returning_draws' ? 'returning' : 'new';
            const drawsCommand = interaction.client.commands.get('draws');

            // Build synthetic routing payload
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await drawsCommand.execute(syntheticInteraction, targetPage);
        }

        // DRAWS SUB-PAGE PAGINATION (Prev/Next within a category, once it exceeds CHUNK_SIZE) custom_id format: subpage_<new|returning>_<targetIndex>, e.g. "subpage_new_2"
        if (interaction.customId.startsWith('subpage_new_') || interaction.customId.startsWith('subpage_returning_')) {
            // No deferUpdate() here: sendV2Payload() acks with one when the render arrives, so this is two trips like every other click (2026-10-27 20:49 EDT; it was one trip until the v3 launch, and /draws' New/Returning switch and arrows blanked their emojis).
            const isNewCategory = interaction.customId.startsWith('subpage_new_');
            const targetPage = isNewCategory ? 'new' : 'returning';
            const targetSubPage = parseInt(interaction.customId.replace(isNewCategory ? 'subpage_new_' : 'subpage_returning_', ''), 10) || 0;
            const drawsCommand = interaction.client.commands.get('draws');

            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await drawsCommand.execute(syntheticInteraction, targetPage, targetSubPage);
        }

        // CALENDAR PAGER (2026-10-21 15:32 EDT; the Draws / Events / Modes buttons before it). custom_id: calpage_<page>_m<filter mask>_<p|n> (see commands/calendar.js buildCalendarPager). Still read: calpage_<page> and calpage_<page>_a from panels posted before, `_a` being the old Active/Upcoming view.
        if (interaction.customId.startsWith('calpage_')) {
            // REVERTED to two-hop 2026-08-07 17:38 EDT (v2.60.0) -- see the price_region_ branch's comment in handlers/drawprices.js for the full reasoning (the emoji-blank bug + investigation).
            await interaction.deferUpdate();
            const targetPage = parseInt(interaction.customId.replace('calpage_', ''), 10) || 0;
            const maskMatch = interaction.customId.match(/_m(\d+)/);
            const filterOverride = maskMatch ? Number(maskMatch[1]) : interaction.customId.endsWith('_a') ? 'active' : null;
            const calendarCommand = interaction.client.commands.get('calendar');

            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await calendarCommand.execute(syntheticInteraction, targetPage, filterOverride);
        }

        // CALENDAR FILTER (2026-10-21 15:32 EDT): the multi-select under the pager. custom_id calsel_<page>; its picks become the mask, and the calendar moves to the first page the filter keeps when this one is left out.
        if (interaction.customId.startsWith('calsel_') && interaction.isStringSelectMenu()) {
            await interaction.deferUpdate();
            const calendarCommand = interaction.client.commands.get('calendar');
            const mask = interaction.values.reduce((m, v) => m | calendarCommand.filterMask(v), 0);
            const targetPage = parseInt(interaction.customId.replace('calsel_', ''), 10) || 0;
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await calendarCommand.execute(syntheticInteraction, targetPage, mask);
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handlePaginationInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handlePaginationInteraction, OWNED_PREFIXES };
