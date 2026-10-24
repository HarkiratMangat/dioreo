// ==========================================
// COMMAND: REMIND
// ==========================================
// Reminders by DM, the design Harkirat agreed on 2026-10-23 19:47–21:11 EDT (docs/superpowers/specs/2026-10-23-notifications-design.md). Two ways in, his round-2 Q1:
//   - `/remind set:<thing> toggle:<on|off>`: `set` autocompletes with the categories pinned first, then this season's entries; the reply is a private confirmation with a button that opens the full panel privately.
//   - `/remind` alone: the panel, public by default (unless the server's rules make it private) with a `visibility:` option, locked to its owner (handlers/remind.js).
// The bell on /today, /calendar, /draws, /season end and /patch notes opens the same panel privately. Logic: utils/reminders.js.

const { SlashCommandBuilder } = require('discord.js');
const emojis = require('../utils/emojiMap');
const { sendV2Payload } = require('../utils/sendV2Payload');
const R = require('../utils/reminders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('DM reminders for draws, events and seasons')
        .addStringOption(option => option.setName('set').setDescription('What to be reminded about (start typing to search)').setAutocomplete(true))
        .addStringOption(option => option.setName('toggle').setDescription('Turn this reminder on or off').addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' }))
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts, like every public command

    async autocomplete(interaction) {
        const SeasonalData = require('../models/SeasonalData');
        const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
        return await interaction.respond(R.autocompleteChoices(interaction.options.getFocused(), doc || {}));
    },

    async execute(interaction) {
        const SeasonalData = require('../models/SeasonalData');
        const ReminderSubscription = require('../models/ReminderSubscription');
        const userId = interaction.user.id;
        const set = interaction.isChatInputCommand() ? interaction.options.getString('set') : null;

        // Set directly: always a private confirmation (his round-3 Q5).
        if (set) {
            await interaction.deferReply({ flags: 64 });
            const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
            const target = R.resolveSetValue(set, doc || {});
            if (!target) {
                return await interaction.editReply({ content: `${emojis.cross} Nothing matches **${set.slice(0, 80)}**. Pick a suggestion, or open the panel with \`/remind\`.` });
            }
            const on = (interaction.options.getString('toggle') || 'on') === 'on';
            const current = await ReminderSubscription.findOne({ discordId: userId }).lean();
            let update;
            if (target.type === 'category') update = on ? { $addToSet: { categories: target.key } } : { $pull: { categories: target.key } };
            else {
                const follows = (current?.follows || []).filter(f => !(f.kind === target.kind && f.title === target.title));
                update = { $set: { follows: on ? [...follows, { kind: target.kind, title: target.title }] : follows } };
            }
            const sub = await ReminderSubscription.findOneAndUpdate({ discordId: userId }, update, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }).lean();
            if (!sub.categories?.length && !sub.follows?.length && !sub.pausedAt) await ReminderSubscription.deleteOne({ _id: sub._id });
            const what = target.type === 'category' ? `**${target.label}**` : `**${target.title}** ${target.kind === 'release' ? 'releases' : 'is leaving'}`;
            const content = on
                ? `${emojis.checkmark} ${target.type === 'category' ? `You'll get a DM for ${what}` : `You'll get a DM when ${what}`}, at the daily update (00:01 UTC).`
                : `${emojis.checkmark} Reminder off: ${what}.`;
            return await interaction.editReply({ content, components: [{ type: 1, components: [{ type: 2, style: 2, label: 'Open reminders', custom_id: 'remind_open', emoji: emojis.parseEmoji(emojis.notification) }] }] });
        }

        // The panel: public unless hidden here or forced private by the server's rules (attachGuildPolicy clamps the defer).
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const isEphemeral = visibilityChoice === 'hidden';
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        const [sub, doc] = await Promise.all([ReminderSubscription.findOne({ discordId: userId }).lean(), SeasonalData.findOne({ docType: 'global' }).lean()]);
        const { PRESET_ACCENT } = require('./calendar');
        return await sendV2Payload(interaction, R.buildPanel(sub, doc || {}, { ownerId: userId, accentColor: PRESET_ACCENT }));
    },
};
