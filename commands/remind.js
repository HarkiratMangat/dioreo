// ==========================================
// COMMAND: REMIND
// ==========================================
// Reminders by DM, the design Harkirat agreed on 2026-10-23 19:47–21:11 EDT (docs/superpowers/specs/2026-10-23-notifications-design.md). Two ways in, his round-2 Q1:
//   - `/remind releases:<thing>` or `/remind leaving:<thing>` (2026-10-25 22:41 EDT, his 21:56 EDT intake; `set` + `toggle` until then): each autocompletes with that side's categories pinned first, then this season's entries, and each pick FLIPS that reminder (on if it was off, off if it was on). The reply is a private confirmation with a button that opens the full panel privately.
//   - `/remind` alone: the panel, public by default (unless the server's rules make it private) with a `visibility:` option, locked to its owner (handlers/remind.js).
// The bell on /today, /calendar, /draws, /season end and /patch notes opens the same panel privately. Logic: utils/reminders.js.

const { SlashCommandBuilder } = require('discord.js');
const emojis = require('../utils/emojiMap');
const { sendV2Payload } = require('../utils/sendV2Payload');
const R = require('../utils/reminders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set and manage your reminders')
        .addStringOption(option => option.setName('releases').setDescription('Turn a reminder on or off for when something goes live (start typing)').setAutocomplete(true))
        .addStringOption(option => option.setName('leaving').setDescription('Turn a reminder on or off for when something is leaving (start typing)').setAutocomplete(true))
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts, like every public command

    async autocomplete(interaction) {
        const SeasonalData = require('../models/SeasonalData');
        const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
        const focused = interaction.options.getFocused(true);
        return await interaction.respond(R.autocompleteChoices(focused.value, doc || {}, Date.now(), focused.name === 'leaving' ? 'leaving' : 'releases'));
    },

    async execute(interaction) {
        const SeasonalData = require('../models/SeasonalData');
        const ReminderSubscription = require('../models/ReminderSubscription');
        const userId = interaction.user.id;
        const picks = interaction.isChatInputCommand()
            ? ['releases', 'leaving'].map(side => [side, interaction.options.getString(side)]).filter(([, v]) => v)
            : [];

        // A pick: always a private confirmation (his round-3 Q5). Each pick flips that reminder, so running the same one again turns it off.
        if (picks.length) {
            await interaction.deferReply({ flags: 64 });
            const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
            const lines = [];
            for (const [side, value] of picks) {
                const target = R.resolveSetValue(value, doc || {}, Date.now(), side);
                if (!target) { lines.push(`${emojis.cross} Nothing matches **${value.slice(0, 80)}**. Pick a suggestion, or open the panel with \`/remind\`.`); continue; }
                const current = await ReminderSubscription.findOne({ discordId: userId }).lean();
                const isOn = target.type === 'category'
                    ? (current?.categories || []).includes(target.key)
                    : (current?.follows || []).some(f => f.kind === target.kind && f.title === target.title);
                const on = !isOn;
                let update;
                if (target.type === 'category') update = on ? { $addToSet: { categories: target.key } } : { $pull: { categories: target.key } };
                else {
                    const follows = (current?.follows || []).filter(f => !(f.kind === target.kind && f.title === target.title));
                    update = { $set: { follows: on ? [...follows, { kind: target.kind, title: target.title }] : follows } };
                }
                const sub = await ReminderSubscription.findOneAndUpdate({ discordId: userId }, update, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }).lean();
                if (!sub.categories?.length && !sub.follows?.length && !sub.pausedAt) await ReminderSubscription.deleteOne({ _id: sub._id });
                else await R.clearTurnedOff(sub);
                const what = target.type === 'category' ? `**${target.label}**` : `**${target.title}** ${target.kind === 'release' ? 'releases' : 'is leaving'}`;
                lines.push(on
                    ? `${emojis.reminderEnabled} ${target.type === 'category' ? `You'll get a DM for ${what}` : `You'll get a DM when ${what}`}, at the daily update (00:01 UTC). Run it again to turn it off.`
                    : `${emojis.disableReminder} Reminder off: ${what}.`);
            }
            return await interaction.editReply({ content: lines.join('\n'), components: [{ type: 1, components: [{ type: 2, style: 2, label: 'Open reminders', custom_id: 'remind_open', emoji: emojis.parseEmoji(emojis.remind) }] }] });
        }

        // The panel: public unless hidden here or forced private by the server's rules (attachGuildPolicy clamps the defer).
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const isEphemeral = visibilityChoice === 'hidden';
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        const UserPreference = require('../models/UserPreference');
        const [sub, doc, prefs] = await Promise.all([ReminderSubscription.findOne({ discordId: userId }).lean(), SeasonalData.findOne({ docType: 'global' }).lean(), UserPreference.findOne({ discordId: userId }, { timezone: 1, timezoneSetAt: 1, announcementsOff: 1 }).lean()]);
        const { PRESET_ACCENT } = require('./calendar');
        // The dropdowns write their times in the reader's chosen zone, UTC until they pick one (utils/reminders.js optionTime, models/UserPreference.js timezoneSetAt).
        return await sendV2Payload(interaction, R.buildPanel(sub, doc || {}, { ownerId: userId, accentColor: PRESET_ACCENT, timeZone: prefs?.timezoneSetAt && prefs.timezone ? prefs.timezone : null, announcementsOff: Boolean(prefs?.announcementsOff) }));
    },
};
