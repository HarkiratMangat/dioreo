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
    // The server's Integrations switches for the command it runs, as for a typed text command (utils/textCommands/permissions.js).
    const { textCommandAllowed } = require('../utils/textCommands/permissions');
    if (!(await textCommandAllowed({ client: interaction.client, guildId: interaction.guildId, member: interaction.member, userId: interaction.user.id, channel: interaction.channel }, textCommand.slash))) {
        try { await interaction.reply({ content: "This server has turned that command off for you here.", ephemeral: true }); } catch (err) { console.error('Text command button: could not answer a denied click:', err); }
        return true;
    }
    // A Did you mean pick must obey the server's /admin rule for the command it RUNS (security review, 2026-10-28 17:29 EDT): the router resolved the policy for a button, which has no commandName, so the command tier was skipped. Re-resolved here with the target command's name and subcommand; a rule that makes it private makes this answer private too.
    let hidden = isPrivate;
    let policy = interaction.dioreoPolicy || null;
    if (interaction.guildId) {
        const probe = buildSyntheticInteraction(interaction, { commandName: textCommand.slash, options: buildOptions({ sub: textCommand.sub }) });
        policy = (await require('../utils/guildPolicy').attachGuildPolicy(probe)) || policy;
        if (policy?.visibility === 'ephemeral') hidden = true;
    }
    // Acknowledged HERE, before the synthetic copy is made: buildSyntheticInteraction copies `deferred` as a value, so a copy made first would still read false and sendV2Payload would try a second acknowledgement. Hidden for Open privately, or where the server's rule says so; public for a Did you mean pick otherwise.
    await interaction.deferReply({ flags: hidden ? 64 : 0 });
    const synthetic = buildSyntheticInteraction(interaction, {
        commandName: textCommand.slash,
        options: buildOptions({ sub: textCommand.sub }),
        isChatInputCommand: () => true,
        isButton: () => false,
        isMessageComponent: () => false,
        customId: undefined,
        deferReply: async () => {},
        // The command-tier policy travels with the run, so sendV2Payload strips Show Everyone where the server's rule makes this command private (security review, 2026-10-28 17:31 EDT): otherwise a hidden answer would carry a one-click way to post it publicly.
        dioreoPolicy: policy,
    });
    await command.execute(synthetic);
    return true;
}

module.exports = { handleTextCommandsInteraction, OWNED_PREFIXES };
