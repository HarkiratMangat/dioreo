// handlers/textCommands.js -- the buttons a text command's reply can carry (text commands, PR 1, 2026-10-28 17:24 EDT; values and the timestamp pop-up added by B2, 2026-10-29):
//   txtpriv_<command>[~payload]  "Open privately", on the card shown where the server's /admin rule makes Dioreo's answers private. Opens the command HIDDEN for whoever clicks: their own view, so it needs no lock.
//   txtrun_<command>[~payload]   a "Did you mean…" pick after `@Dioreo` (a command name, or a weapon / season with its value), and the needs-a-date card's button (`txtrun_timestamp~open`), which opens the timestamp pop-up; its answer comes back as the modal `txtrun_timestamp~submit`. Runs the command publicly, the way the member meant to.
// The payload (utils/textCommands/adapter.js readRunCustomId) carries the options, or the message / person a reply form acts on. A two-word command travels as `patch.notes` (utils/textCommands/commands.js toIdPart).
const { buildSyntheticInteraction } = require('../utils/interactionContext');
const { moduleFor } = require('../utils/textCommands/commands');
const { buildOptions, readRunCustomId, runCustomId } = require('../utils/textCommands/adapter');

const OWNED_PREFIXES = ['txtpriv_', 'txtrun_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

// The pop-up `d timestamp` alone points at: the slash command's date and time zone, nothing else (style and view are panel-only, his trim).
function timestampModal(textCommand) {
    return {
        title: 'Timestamp',
        custom_id: runCustomId('txtrun_', textCommand, 'submit'),
        components: [
            { type: 1, components: [{ type: 4, custom_id: 'datetime', label: 'Date and time', style: 1, required: true, max_length: 100, placeholder: 'e.g. tomorrow 8pm, sun 4:30pm, 19:30' }] },
            { type: 1, components: [{ type: 4, custom_id: 'timezone', label: 'Time zone (blank = your /settings one)', style: 1, required: false, max_length: 60, placeholder: 'e.g. Toronto, Tokyo, EST' }] },
        ],
    };
}

async function privately(interaction, content) {
    try { await interaction.reply({ content, ephemeral: true }); } catch (err) { console.error('Text command button: could not answer a click:', err); }
}

// The message or person a reply form's button points at, read again with the bot token. Null when it is gone.
async function readTargets(interaction, run) {
    if (run.targetMessageId) {
        const channel = interaction.channel || await interaction.client.channels.fetch(interaction.channelId).catch(() => null);
        const targetMessage = await channel?.messages?.fetch?.(run.targetMessageId).catch(() => null);
        return targetMessage ? { targetMessage } : null;
    }
    if (run.targetUserId) {
        const targetUser = await interaction.client.users.fetch(run.targetUserId).catch(() => null);
        if (!targetUser) return null;
        const targetMember = interaction.guild?.members?.fetch ? await interaction.guild.members.fetch(run.targetUserId).catch(() => null) : null;
        return { targetUser, targetMember };
    }
    return {};
}

async function handleTextCommandsInteraction(interaction) {
    if (!(interaction.isButton?.() || interaction.isModalSubmit?.()) || !ownsCustomId(interaction.customId)) return false;
    const isPrivate = interaction.customId.startsWith('txtpriv_');
    const isRun = interaction.customId.startsWith('txtrun_');
    if (!isPrivate && !isRun) return false;
    const run = readRunCustomId(interaction.customId.slice(isPrivate ? 'txtpriv_'.length : 'txtrun_'.length));
    if (run.expired) {
        await privately(interaction, 'That button has expired. Run it again.');
        return true;
    }
    const textCommand = run.textCommand;
    const form = run.targetMessageId ? 'convertTimes' : run.targetUserId ? 'viewColors' : null;
    const { name: moduleName, command } = textCommand ? moduleFor(interaction.client, textCommand, form) : { command: null };
    if (!command) {
        await privately(interaction, 'That command is no longer available.');
        return true;
    }
    // The server's Integrations switches for the command it runs, as for a typed text command (utils/textCommands/permissions.js).
    const { textCommandAllowed } = require('../utils/textCommands/permissions');
    if (!(await textCommandAllowed({ client: interaction.client, guildId: interaction.guildId, member: interaction.member, userId: interaction.user.id, channel: interaction.channel }, moduleName))) {
        await privately(interaction, "This server has turned that command off for you here.");
        return true;
    }
    // The pop-up opens BEFORE anything is acknowledged: Discord opens a modal only as the first answer to a click.
    if (run.open) {
        await interaction.showModal(timestampModal(textCommand));
        return true;
    }
    const values = run.submit && interaction.isModalSubmit?.()
        ? { datetime: interaction.fields.getTextInputValue('datetime'), timezone: interaction.fields.getTextInputValue('timezone') || null }
        : run.values;
    const targets = await readTargets(interaction, run);
    if (!targets) {
        await privately(interaction, 'That message or person is no longer available.');
        return true;
    }
    const options = buildOptions({ sub: form ? null : textCommand.sub, values });
    // A Did you mean pick must obey the server's /admin rule for the command it RUNS (security review, 2026-10-28 17:29 EDT): the router resolved the policy for a button, which has no commandName, so the command tier was skipped. Re-resolved here with the target command's name and subcommand; a rule that makes it private makes this answer private too.
    let hidden = isPrivate;
    let policy = interaction.dioreoPolicy || null;
    if (interaction.guildId) {
        const probe = buildSyntheticInteraction(interaction, { commandName: moduleName, options });
        policy = (await require('../utils/guildPolicy').attachGuildPolicy(probe)) || policy;
        if (policy?.visibility === 'ephemeral') hidden = true;
    }
    // Acknowledged HERE, before the synthetic copy is made: buildSyntheticInteraction copies `deferred` as a value, so a copy made first would still read false and sendV2Payload would try a second acknowledgement. Hidden for Open privately, or where the server's rule says so; public for a Did you mean pick otherwise.
    await interaction.deferReply({ flags: hidden ? 64 : 0 });
    const synthetic = buildSyntheticInteraction(interaction, {
        commandName: moduleName,
        options,
        ...targets,
        isChatInputCommand: () => true,
        isButton: () => false,
        isModalSubmit: () => false,
        isMessageComponent: () => false,
        customId: undefined,
        deferReply: async () => {},
        // Convert Times answers with reply(); this interaction is already deferred, so its answer goes to the deferred message.
        reply: opts => interaction.editReply(opts),
        // The command-tier policy travels with the run, so sendV2Payload strips Show Everyone where the server's rule makes this command private (security review, 2026-10-28 17:31 EDT): otherwise a hidden answer would carry a one-click way to post it publicly.
        dioreoPolicy: policy,
    });
    await command.execute(synthetic);
    return true;
}

module.exports = { handleTextCommandsInteraction, OWNED_PREFIXES };
