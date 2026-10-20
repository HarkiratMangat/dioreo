// ==========================================
// AUTOBUILD — INTERACTION HANDLER
// ==========================================
// /autobuild review card + its edit modal. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `autobuild_`. Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so deciding ownership up front cannot change which handler wins, and every branch below keeps the exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleAutobuildInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare `return interaction.reply(...)` can reject after the try has exited and escape the net. See .claude/rules/interaction-router.md.

// (no shared interaction helpers needed here -- these branches never build a synthetic interaction or resolve a panel owner. See utils/interactionContext.js if that changes.)

const OWNED_PREFIXES = ["autobuild_"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

// --- AUTOBUILD: OPEN LOADOUT --- answers THIS button's own interaction with a brand-new PUBLIC message (not an edit of the ephemeral confirmation), same shape /dmz's execute() uses for its own initial send. See the design spec's "Open Loadout" section. Shared by the single review's Open Loadout button and the bulk summary's Open a saved loadout menu (2026-10-20 10:36 EDT).
async function openLoadout(interaction, loadoutId) {
    const Loadout = require('../models/Loadout');
    const { buildLoadoutCard, getMpCategoryAccent } = require('../utils/loadoutRender');
    const doc = await Loadout.findById(loadoutId).lean();
    if (!doc) {
        return interaction.reply({ content: '❌ That loadout no longer exists.', ephemeral: true });
    }
    // Render the weapon's FULL build set (not just this one doc) so the Prev/Next pagination and the correct "Build N of M" footer render, opening ON the just-created build. The PoC passed [doc] alone (found in live testing 2026-07-20): builds.length === 1, so buildPaginationRow returned null and the footer wrongly read "Build 1 of 1" even for a weapon that has several builds. Same weaponKey scope /gunsmith mp's own lookup uses. openIndex falls back to 0 if the doc somehow isn't in its own result set. Mode-aware since 2026-10-19 17:54 EDT, when /autobuild began writing DMZ builds: the same scopes /dmz uses (utils/loadoutLookup.js) -- the weapon's DMZ builds, every DMZ build for the browse dropdown, and the `dmz` id prefix so its pagination routes to the DMZ handler.
    const mode = doc.mode === 'DMZ' ? 'DMZ' : 'MP';
    const builds = await Loadout.find({ weaponKey: doc.weaponKey, mode }).lean();
    const openIndex = Math.max(0, builds.findIndex(b => String(b._id) === String(doc._id)));
    const categoryBuilds = mode === 'DMZ'
        ? await Loadout.find({ mode: 'DMZ' }).lean()
        : await Loadout.find({ category: doc.category, mode: 'MP' }).lean();
    const accentColor = getMpCategoryAccent(doc.category);
    const cardPayload = buildLoadoutCard(builds, openIndex, { color: accentColor, idPrefix: mode === 'DMZ' ? 'dmz' : 'mp', isEphemeral: false, categoryBuilds });
    await interaction.deferReply({ ephemeral: false });
    const { sendV2Payload } = require('../utils/sendV2Payload');
    return await sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
}

async function route(interaction) {
    const { customId } = interaction;
        // --- AUTOBUILD LOADOUT: WHICH SCREENSHOTS --- the right-click's picker when a message has several images (2026-10-19 11:16 EDT). Since 2026-10-20 10:36 EDT (bulk /autobuild) it takes several picks: one pick is today's single review, several go to utils/autobuildBulk.js, and Read all (a button, below) reads the first ten. The images are held by commands/autobuildLoadout.js; after a restart or 30 minutes they are gone and the click says so.
        if ((interaction.isStringSelectMenu() && interaction.customId.startsWith('autobuild_pick|'))
            || (interaction.isButton() && interaction.customId.startsWith('autobuild_pickall|'))) {
            const key = interaction.customId.split('|')[1];
            const source = interaction.client.commands.get('Autobuild Loadout')?.heldFor(key);
            if (!source) {
                try {
                    await interaction.reply({ content: "These images aren't held any more (the bot restarted, or 30 minutes passed). Right-click the message again.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Autobuild Loadout: could not explain an expired picker (interaction likely expired):', notifyError);
                }
                return;
            }
            await interaction.deferUpdate();
            // Every pick from this picker goes through the batch, even one, so Add more can bring in the message's other screenshots afterwards (Harkirat, 2026-10-20 12:10 EDT: "what if i change my mind and want to select the remaining ones as well?").
            const indices = interaction.isButton()
                ? source.images.map((_, i) => i)
                : interaction.values.map(Number).sort((a, b) => a - b);
            const { runBulk } = require('../utils/autobuildBulk');
            return await runBulk(interaction, indices.map(i => source.images[i]), { source: { key, indices } });
        }

        // --- BULK AUTOBUILD: EDIT BUTTON --- a button, so it may answer with showModal(); its modal submit is the separate isModalSubmit() branch below, never this one (the same placement rule as autobuild_editbtn_).
        if (interaction.isButton() && interaction.customId.startsWith('autobuild_b|edit|')) {
            const { showBatchEditModal } = require('../utils/autobuildBulk');
            return await showBatchEditModal(interaction);
        }

        // --- BULK AUTOBUILD: EDIT MODAL SUBMIT ---
        if (interaction.isModalSubmit() && customId.startsWith('autobuild_b|editmodal|')) {
            const { applyBatchEdit } = require('../utils/autobuildBulk');
            return await applyBatchEdit(interaction);
        }

        // --- BULK AUTOBUILD: OPEN A SAVED LOADOUT --- the summary's menu, opened with the single review's own code.
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('autobuild_b|open|')) {
            return await openLoadout(interaction, interaction.values[0]);
        }

        // --- BULK AUTOBUILD: ADD MORE / UNDO A DISCARD --- more of the right-click message's screenshots read into the same batch, or a discarded build brought back as it was read.
        if (interaction.isStringSelectMenu() && (interaction.customId.startsWith('autobuild_b|more|') || interaction.customId.startsWith('autobuild_b|undo|'))) {
            const { handleBatchComponent } = require('../utils/autobuildBulk');
            return await handleBatchComponent(interaction);
        }

        // --- BULK AUTOBUILD: PAGER, CONFIRM, CANCEL, CONFIRM ALL, CANCEL ALL --- utils/autobuildBulk.js checks the Confirm tier itself, like the single Confirm below.
        if (interaction.isButton() && interaction.customId.startsWith('autobuild_b|')) {
            const { handleBatchComponent } = require('../utils/autobuildBulk');
            return await handleBatchComponent(interaction);
        }

        // --- AUTOBUILD: CONFIRM ---
        if (interaction.isButton() && interaction.customId.startsWith('autobuild_confirm_')) {
            const token = interaction.customId.replace('autobuild_confirm_', '');
            // Confirm writes a Loadout straight to Mongo (doc.save(), not core/changeset.js's commitSet), so its tier is checked here: Create on /autobuild. The router's autobuild_ guard asks the same question today; this names the button's own rule so the two cannot drift apart unnoticed.
            const { canDo, denyDo } = require('../utils/adminAccess');
            if (!(await canDo(interaction.user.id, 'autobuild.confirm'))) {
                return await interaction.reply({ content: denyDo('autobuild.confirm'), ephemeral: true });
            }
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

        // --- AUTOBUILD: OPEN LOADOUT --- see openLoadout above.
        if (interaction.isButton() && interaction.customId.startsWith('autobuild_openloadout_')) {
            return await openLoadout(interaction, interaction.customId.replace('autobuild_openloadout_', ''));
        }

        // --- AUTOBUILD: EDIT BUTTON --- MUST stay in isButton(), never moved next to autobuild_editmodal_'s branch -- see this feature's "Critical placement rule" (same class of bug CLAUDE.md documents already happening once for /manage's mng_editbtn_/mng_search_ pair). showModal() is valid as a response to a button click; it is NOT valid as a response to a modal submit.
        if (interaction.isButton() && interaction.customId.startsWith('autobuild_editbtn_')) {
            const token = interaction.customId.replace('autobuild_editbtn_', '');
            const { pendingAutobuilds, buildEditModal } = require('../utils/autobuildPipeline');
            const data = pendingAutobuilds.get(token);
            if (!data) {
                return await interaction.reply({ content: '❌ This review has expired. Run `/autobuild` again.', ephemeral: true });
            }
            return await interaction.showModal(buildEditModal(token, data));
        }

        // --- AUTOBUILD: EDIT MODAL SUBMIT --- see the breadcrumb on autobuild_editbtn_ above (isButton() block) for why this is a SEPARATE handler in a SEPARATE block, not a shared one. The type test replaces the `isModalSubmit()` block this used to sit in. The button and the modal submit are the same feature and now share one file, which is exactly the adjacency the comment above warns about -- showModal() is valid as a response to a button and NOT to a modal submit, so the two must never be reachable by the same interaction.
        if (interaction.isModalSubmit() && customId.startsWith('autobuild_editmodal_')) {
            const token = customId.replace('autobuild_editmodal_', '');
            const { applyEditSubmission } = require('../utils/autobuildPipeline');
            return await applyEditSubmission(interaction, token);
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleAutobuildInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleAutobuildInteraction, OWNED_PREFIXES };
