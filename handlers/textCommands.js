// handlers/textCommands.js -- the buttons a text command's reply can carry (text commands, PR 1, 2026-10-28 17:24 EDT; values and the timestamp pop-up added by B2, 2026-10-29):
//   txtpriv_<command>[~payload]  opens the command HIDDEN for whoever clicks: their own view, so it needs no lock. Only the help card's icon carries it since B7 retired the Open privately card (2026-10-30).
//   txtrun_<command>[~payload]   a "Did you mean…" pick after `@Dioreo` (a command name, or a weapon / season with its value), and the needs-a-date card's button (`txtrun_timestamp~open`), which opens the timestamp pop-up; its answer comes back as the modal `txtrun_timestamp~submit`. Runs the command publicly, the way the member meant to.
// The payload (utils/textCommands/adapter.js readRunCustomId) carries the options, or the message / person a reply form acts on. A two-word command travels as `patch.notes` (utils/textCommands/commands.js toIdPart).
const { buildSyntheticInteraction } = require('../utils/interactionContext');
const { moduleFor, textPathOf } = require('../utils/textCommands/commands');
const { buildOptions, readRunCustomId, runCustomId } = require('../utils/textCommands/adapter');

const OWNED_PREFIXES = ['txtpriv_', 'txtrun_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

// The pop-up `d timestamp` alone points at. Date and time zone first; then three optional dropdowns (Harkirat, 2026-10-29 11:07 EDT: "give the 'quick pick' list for timezones as well? and another one for the format ... + the view option as well as a dropdown. all optional"), which un-trims the spec's "style and view are panel-only". Five, Discord's most for a pop-up. The quick-pick zones are /settings' own (utils/timezoneData.js quickZoneOptions) and the formats /timestamp's own `style` choices, so neither list can drift. A typed time zone wins over a picked one. The zone fields say what a zone DOES (his ask, 2026-10-29 11:10 EDT: picking UK with "tomorrow 8pm" gives 8pm tomorrow in the UK); Discord caps a field's description at 100 characters. Reworded 2026-10-29 11:49 EDT: "+ UK = 8pm tomorrow, UK time" read to him as "8pm from my current time, but for UK people"; the zone is whose clock the typed time is on.
const fieldLabel = (label, description, component) => ({ type: 18, label, ...(description ? { description } : {}), component });
function timestampModal(textCommand) {
    const styles = require('../commands/timestamp').data.toJSON().options.find(o => o.name === 'style').choices;
    const select = (custom_id, placeholder, options) => ({ type: 3, custom_id, placeholder, required: false, options });
    return {
        title: 'Timestamp',
        custom_id: runCustomId('txtrun_', textCommand, 'submit'),
        components: [
            // His wording (B6, 2026-10-29 14:57 EDT).
            fieldLabel('Date or time', null, { type: 4, custom_id: 'datetime', style: 1, required: true, max_length: 100, placeholder: 'e.g. in 2 days · fri 6pm · dec 25' }),
            fieldLabel('Time zone', 'Whose clock your time is on: “8pm” + UK = 8pm in the UK. Everyone sees it in their own time.', { type: 4, custom_id: 'timezone', style: 1, required: false, max_length: 60, placeholder: 'e.g. Toronto, Tokyo, EST' }),
            fieldLabel('Or pick a time zone', 'Used if none is typed above. Blank = your /settings zone.', select('timezone_pick', 'Quick pick…', require('../utils/timezoneData').quickZoneOptions().slice(0, 25))),
            fieldLabel('Format', 'Blank = your /settings format', select('style', 'Pick a format…', styles.slice(0, 25).map(c => ({ label: c.name.slice(0, 100), value: c.value })))),
            fieldLabel('View', 'Blank = Embed', select('view', 'Embed or Text…', [{ label: 'Embed (Styled Panel)', value: 'embed' }, { label: 'Text (Plain, Copyable)', value: 'text' }])),
        ],
    };
}

// One optional dropdown's pick from the submitted pop-up, or null.
function picked(interaction, id) {
    try { return interaction.fields.getStringSelectValues(id)[0] ?? null; } catch { return null; }
}

// The private notes a press can get (his wording and icons, B6, 2026-10-29 16:07 EDT).
const NOTES = {
    expired: ['pending', 'This button expired. Type the command again.'],
    gone: ['warn', "That command isn't available anymore."],
    off: ['Locked', 'This server turned that command off for you here.'],
    missing: ['warn', "That message or person isn't there anymore."],
};
const note = key => `${require('../utils/emojiMap')[NOTES[key][0]] || ''} ${NOTES[key][1]}`.trim();

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
    // Any press stops a card deleting itself (B6, his yes 2026-10-29 14:54 EDT; utils/textCommands/cardTimers.js).
    const cardTimers = require('../utils/textCommands/cardTimers');
    const cardId = interaction.message?.id || null;
    cardTimers.cancel(cardId);
    if (run.expired) {
        await privately(interaction, note('expired'));
        return true;
    }
    const textCommand = run.textCommand;
    const form = run.targetMessageId ? 'convertTimes' : run.targetUserId ? 'viewColors' : null;
    const { name: moduleName, command } = textCommand ? moduleFor(interaction.client, textCommand, form) : { command: null };
    if (!command) {
        await privately(interaction, note('gone'));
        return true;
    }
    // The server's Integrations switches for the command it runs, as for a typed text command (utils/textCommands/permissions.js).
    const { textCommandAllowed } = require('../utils/textCommands/permissions');
    if (!(await textCommandAllowed({ client: interaction.client, guildId: interaction.guildId, member: interaction.member, userId: interaction.user.id, channel: interaction.channel }, moduleName))) {
        await privately(interaction, note('off'));
        return true;
    }
    // The server's text-command switch for the command it runs (B7): a card posted before an admin turned it off must not run it after.
    if (interaction.guildId && !(await require('../utils/guildPolicy').textCommandOnHere(interaction, textPathOf(textCommand)).catch(() => true))) {
        await privately(interaction, note('off'));
        return true;
    }
    // A press during a penalty of 5 minutes or more gets a private line; during the 1-minute rung presses work (his call, 2026-10-29 15:34 EDT: "only if penalty is 5min or longer").
    const spam = require('../utils/textCommands/spamLadder');
    const penalty = isRun ? spam.penaltyFor(interaction.user.id) : null;
    if (penalty && spam.blocksPresses(penalty)) {
        await privately(interaction, spam.pressNote(penalty));
        return true;
    }
    // The pop-up opens BEFORE anything is acknowledged: Discord opens a modal only as the first answer to a click.
    if (run.open) {
        await interaction.showModal(timestampModal(textCommand));
        // Discord says nothing when a pop-up is closed unsent, so the card gives it 5 minutes, then goes.
        if (cardId) {
            const { Routes } = require('discord.js');
            cardTimers.schedule(cardId, 5 * 60_000, () => interaction.client.rest.delete(Routes.channelMessage(interaction.channelId, cardId)).catch(() => {}));
        }
        return true;
    }
    const values = run.submit && interaction.isModalSubmit?.()
        ? { datetime: interaction.fields.getTextInputValue('datetime'), timezone: interaction.fields.getTextInputValue('timezone') || picked(interaction, 'timezone_pick'), style: picked(interaction, 'style'), view: picked(interaction, 'view') }
        : run.values;
    const targets = await readTargets(interaction, run);
    if (!targets) {
        await privately(interaction, note('missing'));
        return true;
    }
    const options = buildOptions({ sub: form ? null : textCommand.sub, values });
    // Only the help icon's press is private. A Did you mean pick used to re-resolve the server's visibility rule for the command it runs (security review, 2026-10-28 17:29 EDT); since B7 those rules are for slash commands only, and the text-command switch above is what decides a typed command's pick.
    const hidden = isPrivate;
    const policy = { visibility: hidden ? 'ephemeral' : 'public', allowShare: false };
    // Acknowledged HERE, before the synthetic copy is made: buildSyntheticInteraction copies `deferred` as a value, so a copy made first would still read false and sendV2Payload would try a second acknowledgement. Hidden for the help icon's press. A public pick from one of the listener's cards (Did you mean, the timestamp card and its pop-up) EDITS that card into the answer, so nothing is left over (B6, his yes 2026-10-29 14:54 EDT); a plain-text timestamp cannot replace a card's layout, so it comes as a new message and the card goes.
    const textView = run.submit && values?.view === 'text';
    const intoCard = isRun && !hidden && Boolean(cardId) && !textView;
    if (intoCard) await interaction.deferUpdate();
    else await interaction.deferReply({ flags: hidden ? 64 : 0 });
    if (isRun && !hidden && cardId && textView) {
        const { Routes } = require('discord.js');
        interaction.client.rest.delete(Routes.channelMessage(interaction.channelId, cardId)).catch(() => {});
    }
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
        // Show Everyone stays off a typed command's answer (sendV2Payload reads allowShare).
        dioreoPolicy: policy,
    });
    await command.execute(synthetic);
    return true;
}

module.exports = { handleTextCommandsInteraction, OWNED_PREFIXES };
