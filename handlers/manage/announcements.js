// ==========================================
// /manage — ANNOUNCEMENT PAGE
// ==========================================
// Post/edit/delete for the multi-announcement system (models/Announcement.js). Split out of the
// former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/
// 2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and
// .claude/rules/interaction-router.md.

const { recordChange } = require('../../utils/changeStore');
const { prompt } = require('./shared');

// --- POST NEW --- custom_id: modal_announce_post
// Creates an independent doc rather than overwriting anything -- see models/Announcement.js's
// header for why the old singleton design was replaced.
async function postAnnouncement(interaction) {
    const text = interaction.fields.getTextInputValue('text').trim();
    const rawExpiry = interaction.fields.getTextInputValue('expiry');
    const { computeExpiresAt, generateAccentColor } = require('../../utils/announcement');
    const expiresAt = computeExpiresAt(rawExpiry);
    if (expiresAt === undefined) {
        return interaction.reply({ content: `❌ "${rawExpiry}" wasn't understood -- leave it blank for the 60-day default, type a whole number of days, or type "never".`, ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const Announcement = require('../../models/Announcement');
    try {
        // Color is generated ONCE here, at creation -- never on edit.
        await Announcement.create({ text, createdBy: interaction.user.id, expiresAt, color: generateAccentColor() });
    } catch (createError) {
        // Hardened after a real bug (2026-08-13): a stale MongoDB unique index (`docType_1`)
        // survived the singleton->collection redesign, so every SECOND announcement collided on
        // `docType: null` and threw here, AFTER deferReply() had already acknowledged the
        // interaction -- with nothing wrapping this call, that exception fell all the way to the
        // outer crash-safety catch, leaving the interaction deferred FOREVER (Discord's
        // "thinking..." spinner). The stale index itself is fixed (dropped from the dev DB); this
        // try/catch is the hardening so ANY future failure here surfaces a real error instead of
        // silently hanging again.
        console.error('Failed to create announcement:', createError);
        return interaction.followUp({ content: `❌ Something went wrong saving that announcement: ${createError.message}` });
    }
    recordChange({ actorId: interaction.user.id, page: 'announcement', action: 'add', model: 'Announcement', target: text.length > 60 ? `${text.slice(0, 57)}...` : text, summary: 'Posted a new announcement' });
    return interaction.followUp({ content: `✅ Posted a new announcement${expiresAt ? ` (expires <t:${Math.floor(expiresAt.getTime() / 1000)}:R>)` : ' (never expires)'}. Anyone who hasn't seen it yet will, on their next command.` });
}

// --- EDIT --- custom_id: modal_announce_edit_{id}
// Updates ONE existing doc in place by its own _id -- never touches any other announcement, and
// never resets who's already seen this one (an edit is a correction, not a new notice).
async function editAnnouncement(interaction) {
    const id = interaction.customId.replace('modal_announce_edit_', '');
    const text = interaction.fields.getTextInputValue('text').trim();
    const rawExpiry = interaction.fields.getTextInputValue('expiry');
    const { computeExpiresAt } = require('../../utils/announcement');
    const expiresAt = computeExpiresAt(rawExpiry);
    if (expiresAt === undefined) {
        return interaction.reply({ content: `❌ "${rawExpiry}" wasn't understood -- leave it blank for the 60-day default, type a whole number of days, or type "never".`, ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const Announcement = require('../../models/Announcement');
    let updated;
    try {
        updated = await Announcement.findByIdAndUpdate(id, { $set: { text, expiresAt } }, { new: true });
    } catch (updateError) {
        console.error('Failed to update announcement:', updateError);
        return interaction.followUp({ content: `❌ Something went wrong updating that announcement: ${updateError.message}` });
    }
    if (!updated) {
        return interaction.followUp({ content: '❌ That announcement no longer exists (it may have just been deleted or expired).' });
    }
    recordChange({ actorId: interaction.user.id, page: 'announcement', action: 'edit', model: 'Announcement', target: text.length > 60 ? `${text.slice(0, 57)}...` : text, summary: 'Edited an announcement' });
    return interaction.followUp({ content: `✅ Updated the announcement${expiresAt ? ` (now expires <t:${Math.floor(expiresAt.getTime() / 1000)}:R>)` : ' (never expires)'}.` });
}

// --- BUTTONS: edit_ / delete_ / delconfirm_ / delcancel_ --- all embed the target announcement's
// own Mongo _id, matched by exact prefix here rather than going through the registry.
async function handleButton(interaction) {
    const customId = interaction.customId;
    const Announcement = require('../../models/Announcement');

    if (customId.startsWith('mng_announce_edit_')) {
        const id = customId.replace('mng_announce_edit_', '');
        const doc = await Announcement.findById(id).lean();
        if (!doc) {
            return interaction.reply({ content: '❌ That announcement no longer exists (it may have just been deleted or expired).', ephemeral: true });
        }
        const manageCommand = interaction.client.commands.get('manage');
        return await interaction.showModal(manageCommand.buildAnnouncementModal(doc));
    }

    if (customId.startsWith('mng_announce_delete_')) {
        const id = customId.replace('mng_announce_delete_', '');
        // Shows WHICH announcement, not just "an announcement" -- the per-item list on the page
        // already has a preview, but this confirm prompt used to repeat none of it.
        const doc = await Announcement.findById(id).lean();
        const preview = doc ? (doc.text.length > 200 ? `${doc.text.slice(0, 200)}…` : doc.text) : '*(already gone)*';
        return interaction.reply({
            content: `⚠️ **Delete this announcement?** Anyone who hasn't seen it yet never will. This cannot be undone.\n\n> ${preview.replace(/\n/g, '\n> ')}`,
            components: [{
                type: 1, components: [
                    { type: 2, style: 4, label: 'Yes, Delete', custom_id: `mng_announce_delconfirm_${id}` },
                    { type: 2, style: 2, label: 'Cancel', custom_id: `mng_announce_delcancel_${id}` }
                ]
            }],
            ephemeral: true
        });
    }

    if (customId.startsWith('mng_announce_delconfirm_')) {
        const id = customId.replace('mng_announce_delconfirm_', '');
        // Fetched BEFORE deleting so the success message can still show what was removed.
        const doc = await Announcement.findById(id).lean();
        const preview = doc ? (doc.text.length > 200 ? `${doc.text.slice(0, 200)}…` : doc.text) : null;
        await Announcement.deleteOne({ _id: id });
        recordChange({ actorId: interaction.user.id, page: 'announcement', action: 'delete', model: 'Announcement', target: preview || id, summary: 'Deleted an announcement' });
        try {
            await prompt(interaction, { text: preview ? `✅ Deleted:\n> ${preview.replace(/\n/g, '\n> ')}` : '✅ Announcement deleted.' });
        } catch (notifyError) {
            console.error('Failed to confirm manage-panel announcement delete (interaction likely expired):', notifyError);
        }
        return;
    }

    if (customId.startsWith('mng_announce_delcancel_')) {
        try {
            await prompt(interaction, { text: '❎ Delete cancelled -- nothing was changed.' });
        } catch (notifyError) {
            console.error('Failed to confirm manage-panel announcement-delete cancellation (interaction likely expired):', notifyError);
        }
        return;
    }
}

module.exports = { postAnnouncement, editAnnouncement, handleButton };
