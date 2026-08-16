// ==========================================
// AUTOBUILD — INTERACTION HANDLER
// ==========================================
// /autobuild review card + its edit modal. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js
// split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `autobuild_`.
// Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so
// deciding ownership up front cannot change which handler wins, and every branch below keeps the
// exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleAutobuildInteraction is awaited from
// inside handlers/router.js's single top-level try/catch -- do not add one here, do not register
// listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare
// `return interaction.reply(...)` can reject after the try has exited and escape the net.
// See .claude/rules/interaction-router.md.

// (no shared interaction helpers needed here -- these branches never build a synthetic
// interaction or resolve a panel owner. See utils/interactionContext.js if that changes.)

const OWNED_PREFIXES = ["autobuild_"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
    const { customId } = interaction;
        // --- AUTOBUILD: CONFIRM ---
        if (interaction.isButton() && interaction.customId.startsWith('autobuild_confirm_')) {
            const token = interaction.customId.replace('autobuild_confirm_', '');
            await interaction.deferUpdate();
            const { confirmAndWrite } = require('../utils/autobuildPipeline');
            return await confirmAndWrite(interaction, token);
        }

        // --- AUTOBUILD: CANCEL ---
        if (interaction.isButton() && interaction.customId.startsWith('autobuild_cancel_')) {
            const token = interaction.customId.replace('autobuild_cancel_', '');
            await interaction.deferUpdate();
            const { cancelReview } = require('../utils/autobuildPipeline');
            return await cancelReview(interaction, token);
        }

        // --- AUTOBUILD: OPEN LOADOUT --- answers THIS button's own interaction with a brand-new PUBLIC
        // message (not an edit of the ephemeral confirmation), same shape /dmz's execute() uses for its
        // own initial send. See the design spec's "Open Loadout" section.
        if (interaction.isButton() && interaction.customId.startsWith('autobuild_openloadout_')) {
            const loadoutId = interaction.customId.replace('autobuild_openloadout_', '');
            const Loadout = require('../models/Loadout');
            const { buildLoadoutCard, getMpCategoryAccent } = require('../utils/loadoutRender');
            const doc = await Loadout.findById(loadoutId).lean();
            if (!doc) {
                return interaction.reply({ content: '❌ That loadout no longer exists.', ephemeral: true });
            }
            // Render the weapon's FULL build set (not just this one doc) so the Prev/Next pagination
            // and the correct "Build N of M" footer render, opening ON the just-created build. The PoC
            // passed [doc] alone (found in live testing 2026-07-20): builds.length === 1, so
            // buildPaginationRow returned null and the footer wrongly read "Build 1 of 1" even for a
            // weapon that has several builds. Same weaponKey scope /gunsmiths search's own lookup
            // uses. openIndex falls back to 0 if the doc somehow isn't in its own result set.
            const builds = await Loadout.find({ weaponKey: doc.weaponKey, mode: 'MP' }).lean();
            const openIndex = Math.max(0, builds.findIndex(b => String(b._id) === String(doc._id)));
            const categoryBuilds = await Loadout.find({ category: doc.category, mode: 'MP' }).lean();
            const accentColor = getMpCategoryAccent(doc.category);
            const cardPayload = buildLoadoutCard(builds, openIndex, { color: accentColor, idPrefix: 'mp', isEphemeral: false, categoryBuilds });
            await interaction.deferReply({ ephemeral: false });
            const { sendV2Payload } = require('../utils/sendV2Payload');
            return await sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
        }

        // --- AUTOBUILD: EDIT BUTTON --- MUST stay in isButton(), never moved next to autobuild_editmodal_
        // below -- see this feature's "Critical placement rule" (same class of bug CLAUDE.md documents
        // already happening once for /manage's mng_editbtn_/mng_search_ pair). showModal() is valid as a
        // response to a button click; it is NOT valid as a response to a modal submit.
        if (interaction.isButton() && interaction.customId.startsWith('autobuild_editbtn_')) {
            const token = interaction.customId.replace('autobuild_editbtn_', '');
            const { pendingAutobuilds, buildEditModal } = require('../utils/autobuildPipeline');
            const data = pendingAutobuilds.get(token);
            if (!data) {
                return await interaction.reply({ content: '❌ This review has expired. Run `/autobuild` again.', ephemeral: true });
            }
            return await interaction.showModal(buildEditModal(token, data));
        }

        // --- AUTOBUILD: EDIT MODAL SUBMIT --- see the breadcrumb on autobuild_editbtn_ above (isButton()
        // block) for why this is a SEPARATE handler in a SEPARATE block, not a shared one.
        // The type test replaces the `isModalSubmit()` block this used to sit in. The button and the
        // modal submit are the same feature and now share one file, which is exactly the adjacency
        // the comment above warns about -- showModal() is valid as a response to a button and NOT to
        // a modal submit, so the two must never be reachable by the same interaction.
        if (interaction.isModalSubmit() && customId.startsWith('autobuild_editmodal_')) {
            const token = customId.replace('autobuild_editmodal_', '');
            const { applyEditSubmission } = require('../utils/autobuildPipeline');
            return await applyEditSubmission(interaction, token);
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handleAutobuildInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleAutobuildInteraction, OWNED_PREFIXES };
