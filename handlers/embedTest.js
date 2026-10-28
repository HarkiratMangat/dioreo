// ==========================================
// EMBED TESTER — INTERACTION HANDLER (owner only, Dioreo Admin)
// ==========================================
// Two branches for /embed (commands/embed.js): the modal its no-option form opens, and the dummy buttons and selects every render carries. Added 2026-10-17 11:05 EDT.
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
    // THE PASTE BOX -- `embedtest_modal`, opened by /embed with no options.
    if (interaction.isModalSubmit() && (interaction.customId === 'embedtest_modal' || interaction.customId === 'embedtest_modal:clean')) {
        const command = interaction.client.commands.get('embed');
        if (!command || !command.isAllowed(interaction)) {
            try {
                await interaction.reply({ content: '🔒 `/embed` is a tool for the owner.', flags: 64 });
            } catch (notifyError) {
                console.error('embedtest: could not refuse a modal submit (interaction likely expired):', notifyError);
            }
            return;
        }
        return await command.renderPayload(interaction, interaction.fields.getTextInputValue(command.MODAL_FIELD), null, { clean: interaction.customId.endsWith(':clean') });
    }

    // EDIT JSON -- `embedtest_edit`, the one real button under every render (2026-10-17 16:35 EDT). Opens the box on the JSON that drew this message; its submit, `embedtest_editmodal`, redraws the same message.
    if ((interaction.isButton() && interaction.customId === 'embedtest_edit') || (interaction.isModalSubmit() && interaction.customId === 'embedtest_editmodal')) {
        const command = interaction.client.commands.get('embed');
        if (!command || !command.isAllowed(interaction)) {
            try { await interaction.reply({ content: '🔒 `/embed` is a tool for the owner.', flags: 64 }); }
            catch (notifyError) { console.error('embedtest: could not refuse an edit (interaction likely expired):', notifyError); }
            return;
        }
        if (interaction.isModalSubmit()) return await command.renderPayload(interaction, interaction.fields.getTextInputValue(command.MODAL_FIELD), null, { edit: true });
        const text = command.editTextFor(interaction.message);
        if (!text) {
            try { await interaction.reply({ content: 'This JSON is longer than the 4,000 characters an edit box holds. Send the changed version with `/embed file:` instead.', flags: 64 }); }
            catch (notifyError) { console.error('embedtest: could not explain a too-long edit (interaction likely expired):', notifyError); }
            return;
        }
        return await interaction.showModal(command.buildEditModal(text));
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
