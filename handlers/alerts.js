// ==========================================
// ALERTS — INTERACTION HANDLER
// ==========================================
// /alerts panel. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js
// split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `alerts_`.
// Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so
// deciding ownership up front cannot change which handler wins, and every branch below keeps the
// exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleAlertsInteraction is awaited from
// inside handlers/router.js's single top-level try/catch -- do not add one here, do not register
// listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare
// `return interaction.reply(...)` can reject after the try has exited and escape the net.
// See .claude/rules/interaction-router.md.

// (no shared interaction helpers needed here -- these branches never build a synthetic
// interaction or resolve a panel owner. See utils/interactionContext.js if that changes.)

const OWNED_PREFIXES = ["alerts_"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // --- /alerts PANEL (admin-only; already auto-gated by the centralized `alerts_` guard above) ---
        // Export: a FRESH ephemeral message carrying the .txt, so the panel itself is left untouched.
        // ⚠️ EVERY branch here type-tests, added 2026-08-14 10:01 EDT. This module previously
        // carried NO `is…()` test anywhere: it gated on the `alerts_` prefix alone, so ANY
        // interaction type bearing an `alerts_` id was consumed. Harmless while every `alerts_*`
        // id is a button, which is true today — but it is the same shape as the `set_`/`set_page_`
        // bug that shipped in this split, where prefix ownership was doing work that only an
        // interaction type could correctly do. `scripts/handlerRouting.test.js`'s mixed-type scan
        // could not see it either: it skips modules using fewer than two types, and a ZERO-type
        // module reads to that check exactly like a single-type one.
        if (interaction.isButton() && interaction.customId === 'alerts_export') {
            await interaction.deferReply({ flags: 64 });
            const { buildAlertExport } = require('../utils/alertStore');
            const text = await buildAlertExport();
            const stamp = new Date().toISOString().slice(0, 10);
            return interaction.editReply({ content: '📄 Alert log export:', files: [{ attachment: Buffer.from(text, 'utf-8'), name: `dior-alerts-${stamp}.txt` }] });
        }

        // Explain <-> Back: re-render the SAME panel message between its main + explainer views. sendV2Payload
        // patches @original (keeps the message's own ephemerality — Discord ignores flag changes on edit).
        if (interaction.isButton() && (interaction.customId === 'alerts_explain' || interaction.customId === 'alerts_back')) {
            await interaction.deferUpdate();
            const { buildAlertsPanel } = require('../commands/alerts');
            const { sendV2Payload } = require('../utils/sendV2Payload');
            const view = interaction.customId === 'alerts_explain' ? 'explain' : 'main';
            return sendV2Payload(interaction, await buildAlertsPanel({ view }));
        }

        // Pagination through the recent-alert list (custom_id encodes the target page, stateless).
        if (interaction.isButton() && interaction.customId.startsWith('alerts_page_')) {
            await interaction.deferUpdate();
            const { buildAlertsPanel } = require('../commands/alerts');
            const { sendV2Payload } = require('../utils/sendV2Payload');
            const page = parseInt(interaction.customId.replace('alerts_page_', ''), 10) || 0;
            return sendV2Payload(interaction, await buildAlertsPanel({ page, view: 'main' }));
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handleAlertsInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleAlertsInteraction, OWNED_PREFIXES };
