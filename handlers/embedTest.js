// ==========================================
// EMBED TESTER — INTERACTION HANDLER (dev bot only)
// ==========================================
// Two branches for /embedtest (commands/embedtest.js): the modal its no-option form opens, and the dummy buttons and selects every render carries. Added 2026-10-17 11:05 EDT.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleEmbedTestInteraction is awaited inside handlers/router.js's single top-level try/catch -- no try/catch here that swallows, no listeners, and every error-branch reply awaited in its own small try/catch. See .claude/rules/interaction-router.md.
//
// ⚠️ MIXED TYPES, SO EVERY BRANCH TYPE-TESTS. The modal branch is a modal submit and the dummy branch is a button or a select; a prefix alone does not say which (the `set_page_` bug in that rule file).
//
// The prefixes exist on prod too, harmlessly: the command is never registered there, so nothing ever mints them.

const OWNED_PREFIXES = ['embedtest_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
    // THE PASTE BOX -- `embedtest_modal`, opened by /embedtest with no options.
    if (interaction.isModalSubmit() && interaction.customId === 'embedtest_modal') {
        const command = interaction.client.commands.get('embedtest');
        if (!command || !command.isAllowed(interaction)) {
            try {
                await interaction.reply({ content: '🔒 `/embedtest` is a dev-bot tool for the owner.', flags: 64 });
            } catch (notifyError) {
                console.error('embedtest: could not refuse a modal submit (interaction likely expired):', notifyError);
            }
            return;
        }
        return await command.renderPayload(interaction, interaction.fields.getTextInputValue(command.MODAL_FIELD));
    }

    // A DUMMY CONTROL -- `embedtest_dummy:N`. Acknowledged with no change, so the click neither does anything nor shows "This interaction failed".
    if ((interaction.isButton() || interaction.isAnySelectMenu()) && interaction.customId.startsWith('embedtest_dummy:')) {
        await interaction.deferUpdate().catch(() => {});
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleEmbedTestInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleEmbedTestInteraction, OWNED_PREFIXES };
