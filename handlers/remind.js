// ==========================================
// REMINDERS — INTERACTION HANDLER
// ==========================================
// Every `remind_` id: the bell on a command's header and the DM's Manage reminders button (`remind_open`), the panel's category toggles, its two one-thing dropdowns, Search, Stop all, and Turn back on. Built 2026-10-23 from the agreed design (docs/superpowers/specs/2026-10-23-notifications-design.md); the logic lives in utils/reminders.js and the command in commands/remind.js.
//
// A PUBLIC PANEL IS LOCKED TO ITS OWNER (his round-4 Q1, 21:04 EDT): every panel id ends in the owner's user id, and anyone else pressing it gets a private "Open your own reminders" button instead of changing theirs. `remind_open` carries no owner: it always opens the presser's own panel, privately (his round-3 Q1 and Q5).
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S (.claude/rules/interaction-router.md): no try/catch that swallows, no listeners, every error reply awaited. And this module serves buttons, a select and a modal submit, so every branch type-tests the interaction (the set_page_2 bug of 2026-08-13).

const { sendV2Payload } = require('../utils/sendV2Payload');
const emojis = require('../utils/emojiMap');
const R = require('../utils/reminders');

const OWNED_PREFIXES = ['remind_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function loadState(userId) {
    const ReminderSubscription = require('../models/ReminderSubscription');
    const SeasonalData = require('../models/SeasonalData');
    const [sub, doc] = await Promise.all([ReminderSubscription.findOne({ discordId: userId }).lean(), SeasonalData.findOne({ docType: 'global' }).lean()]);
    return { sub, doc };
}

function accent() {
    try { return require('../commands/calendar').PRESET_ACCENT; } catch { return undefined; }
}

// Writes the record, creating it on first use; a record left with nothing followed is deleted, so Stop all and turning the last thing off leave no data behind (PRIVACY.md).
async function saveSub(userId, update) {
    const ReminderSubscription = require('../models/ReminderSubscription');
    const sub = await ReminderSubscription.findOneAndUpdate({ discordId: userId }, update, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }).lean();
    if (!sub.categories?.length && !sub.follows?.length && !sub.pausedAt) {
        await ReminderSubscription.deleteOne({ _id: sub._id });
        return null;
    }
    return sub;
}

// The panel, privately, as a new message: the bell, the DM's button, and the confirm's "Open reminders".
async function openOwnPanel(interaction) {
    await interaction.deferReply({ flags: 64 });
    const { sub, doc } = await loadState(interaction.user.id);
    return await sendV2Payload(interaction, R.buildPanel(sub, doc || {}, { ownerId: interaction.user.id, accentColor: accent() }));
}

// Re-renders the panel the click came from.
async function rerender(interaction, sub, { confirmStop = false } = {}) {
    const SeasonalData = require('../models/SeasonalData');
    const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
    return await sendV2Payload(interaction, R.buildPanel(sub, doc || {}, { ownerId: interaction.user.id, accentColor: accent(), confirmStop }));
}

async function notYours(interaction) {
    try {
        await interaction.reply({ content: `${emojis.remind} This is someone else's reminders panel.`, components: [{ type: 1, components: [{ type: 2, style: 2, label: 'Open your own reminders', custom_id: 'remind_open', emoji: emojis.parseEmoji(emojis.remind) }] }], flags: 64 });
    } catch (error) {
        console.error('Failed to answer a click on someone else\'s reminders panel:', error?.message);
    }
}

async function route(interaction) {
    const id = interaction.customId;

    if (interaction.isButton() && interaction.customId === 'remind_open') return await openOwnPanel(interaction);

    const [, a, b] = id.split(':');
    const owner = b ?? a;
    if (owner !== interaction.user.id) return await notYours(interaction);

    if (interaction.isButton() && interaction.customId.startsWith('remind_cat:')) {
        await interaction.deferUpdate();
        const ReminderSubscription = require('../models/ReminderSubscription');
        const current = await ReminderSubscription.findOne({ discordId: owner }).lean();
        const on = (current?.categories || []).includes(a);
        const sub = await saveSub(owner, on ? { $pull: { categories: a } } : { $addToSet: { categories: a } });
        return await rerender(interaction, sub);
    }

    if (interaction.isStringSelectMenu() && (interaction.customId.startsWith('remind_rel:') || interaction.customId.startsWith('remind_lv:'))) {
        await interaction.deferUpdate();
        const kind = interaction.customId.startsWith('remind_rel:') ? 'release' : 'leaving';
        const { sub: current, doc } = await loadState(owner);
        const { releases, leaving } = R.followable(doc || {});
        const listed = (kind === 'release' ? releases : leaving).slice(0, R.MAX_OPTIONS).map(e => e.title);
        const follows = R.mergeFollows(current?.follows || [], kind, listed, interaction.values);
        const sub = await saveSub(owner, { $set: { follows } });
        return await rerender(interaction, sub);
    }

    if (interaction.isButton() && interaction.customId.startsWith('remind_search:')) {
        return await interaction.showModal({
            title: 'Find a draw, event or playlist', custom_id: `remind_searchsub:${owner}`,
            components: [{ type: 1, components: [{ type: 4, custom_id: 'q', label: 'Its name', style: 1, required: true, max_length: 100, placeholder: 'Black Hole Draw' }] }],
        });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('remind_searchsub:')) {
        const SeasonalData = require('../models/SeasonalData');
        const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
        const found = R.resolveSetValue(interaction.fields.getTextInputValue('q'), doc || {});
        if (!found) {
            try {
                await interaction.reply({ content: `${emojis.cross} Nothing this season matches that name. It has to be a draw, event or playlist that hasn't released yet, or one that's live with an end date.`, flags: 64 });
            } catch (error) {
                console.error('Failed to answer a reminders search:', error?.message);
            }
            return;
        }
        await interaction.deferUpdate();
        const ReminderSubscription = require('../models/ReminderSubscription');
        const current = await ReminderSubscription.findOne({ discordId: owner }).lean();
        const follows = (current?.follows || []).filter(f => !(f.kind === found.kind && f.title === found.title));
        const sub = await saveSub(owner, { $set: { follows: [...follows, { kind: found.kind, title: found.title }] } });
        return await rerender(interaction, sub);
    }

    // Send a test: one DM now, so a person can check their reminders will reach them; a refusal names both fixes (DMs off, or the app removed, give the same error).
    if (interaction.isButton() && interaction.customId.startsWith('remind_test:')) {
        await interaction.deferReply({ flags: 64 });
        const { Routes } = require('discord.js');
        try {
            const dm = await interaction.client.users.createDM(owner);
            await interaction.client.rest.post(Routes.channelMessages(dm.id), { body: { flags: 32768, allowed_mentions: { parse: [] }, components: [{ type: 17, accent_color: accent(), components: [{ type: 10, content: `### ${emojis.remind} Test reminder\n-# Your reminders will arrive here, one DM a day at the daily update.` }] }] } });
            return await interaction.editReply({ content: `${emojis.checkmark} Sent. Check your DMs from Dioreo.` });
        } catch (err) {
            if (!R.isRefusal(err)) throw err;
            return await interaction.editReply({ content: `${emojis.cross} Discord wouldn't let Dioreo DM you. Turn on DMs from a server you share with Dioreo, or add Dioreo to your account, then try again.` });
        }
    }

    if (interaction.isButton() && (interaction.customId.startsWith('remind_stop:') || interaction.customId.startsWith('remind_stopno:'))) {
        await interaction.deferUpdate();
        const { sub } = await loadState(owner);
        return await rerender(interaction, sub, { confirmStop: interaction.customId.startsWith('remind_stop:') });
    }

    if (interaction.isButton() && interaction.customId.startsWith('remind_stopyes:')) {
        await interaction.deferUpdate();
        const ReminderSubscription = require('../models/ReminderSubscription');
        await ReminderSubscription.deleteOne({ discordId: owner });
        R.pendingNotice.delete(owner);
        return await rerender(interaction, null);
    }

    if (interaction.isButton() && interaction.customId.startsWith('remind_resume:')) {
        const ReminderSubscription = require('../models/ReminderSubscription');
        const sub = await ReminderSubscription.findOneAndUpdate({ discordId: owner }, { $set: { pausedAt: null, pauseNoteShown: false, failingSince: null, noteDue: false, noteShownAt: null } }, { returnDocument: 'after' }).lean();
        R.pendingNotice.delete(owner);
        // From the panel it redraws the panel; from the note on a command it answers privately.
        if (interaction.message?.flags?.has?.(32768)) {
            await interaction.deferUpdate();
            return await rerender(interaction, sub);
        }
        try {
            await interaction.reply({ content: `${emojis.reminderEnabled} Reminders are back on. The next one comes at the daily update.`, flags: 64 });
        } catch (error) {
            console.error('Failed to confirm reminders resumed:', error?.message);
        }
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the contract every handlers/*.js module follows.
async function handleRemindInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleRemindInteraction, OWNED_PREFIXES };
