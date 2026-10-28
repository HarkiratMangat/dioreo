// handlers/textCommands.js -- the two buttons a text command's reply can carry (text commands, PR 1, 2026-10-28 17:24 EDT):
//   txtpriv_<command>  "Open privately", on the card shown where the server's /admin rule makes Dioreo's answers private. Opens the command HIDDEN for whoever clicks: their own view, so it needs no lock.
//   txtrun_<command>   a "Did you mean…" pick after `@Dioreo` and a near-miss word. Runs the command publicly, the way the member meant to.
// A two-word command travels as `patch.notes` (utils/textCommands/commands.js toIdPart).
const { buildSyntheticInteraction } = require('../utils/interactionContext');
const { findTextCommand, fromIdPart } = require('../utils/textCommands/commands');
const { buildOptions } = require('../utils/textCommands/adapter');

const OWNED_PREFIXES = ['txtpriv_', 'txtrun_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function handleTextCommandsInteraction(interaction) {
    if (!interaction.isButton?.() || !ownsCustomId(interaction.customId)) return false;
    const isPrivate = interaction.customId.startsWith('txtpriv_');
    const isRun = interaction.customId.startsWith('txtrun_');
    if (!isPrivate && !isRun) return false;
    const textCommand = findTextCommand(fromIdPart(interaction.customId.slice(isPrivate ? 'txtpriv_'.length : 'txtrun_'.length)));
    const command = textCommand && interaction.client.commands.get(textCommand.slash);
    if (!command) {
        try { await interaction.reply({ content: 'That command is no longer available.', ephemeral: true }); } catch (err) { console.error('Text command button: could not answer a stale click:', err); }
        return true;
    }
    // Acknowledged HERE, before the synthetic copy is made: buildSyntheticInteraction copies `deferred` as a value, so a copy made first would still read false and sendV2Payload would try a second acknowledgement. Hidden for Open privately; public for a Did you mean pick.
    await interaction.deferReply({ flags: isPrivate ? 64 : 0 });
    const synthetic = buildSyntheticInteraction(interaction, {
        commandName: textCommand.slash,
        options: buildOptions({ sub: textCommand.sub }),
        isChatInputCommand: () => true,
        isButton: () => false,
        isMessageComponent: () => false,
        customId: undefined,
        deferReply: async () => {},
    });
    await command.execute(synthetic);
    return true;
}

module.exports = { handleTextCommandsInteraction, OWNED_PREFIXES };
