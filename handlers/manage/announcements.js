// ==========================================
// /manage — ANNOUNCEMENT PAGE
// ==========================================
// Post/edit/delete for the multi-announcement system (models/Announcement.js). Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/ 2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and .claude/rules/interaction-router.md.
//
// ⚠️ MUTATIONS ROUTE THROUGH THE OPERATION CORE (core/changeset.js's commitSet), as of plan 2 Task 6 (2026-08-21 13:12 EDT). core/ops/announcements.js's validatePost() reproduces utils/announcement.js's computeExpiresAt() contract exactly (blank/60-day default, a day count, or "never") -- this handler just relays the raw `expiry` string. The pre-core handler's try/catch hardening around a stale-index create failure (2026-08-13 incident) is now redundant: commitSet's own transaction wraps every apply() in a try/catch and reports any thrown error through `result.error`, so any future create failure surfaces the same way instead of leaving the interaction deferred forever. Undo now lives on /bot analytics' Changes page (core/revert.js).

const { commitSet } = require('../../core/changeset');
const { prompt, extractCommitError } = require('./shared');

// --- POST NEW --- custom_id: modal_announce_post Creates an independent doc rather than overwriting anything -- see models/Announcement.js's header for why the old singleton design was replaced.
async function postAnnouncement(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const text = interaction.fields.getTextInputValue('text').trim();
    const expiry = interaction.fields.getTextInputValue('expiry');
    // Blank means "show now" -- omitting the key lets core/ops/announcements.js's `payload?.startsAt ?? null` default apply, rather than sending an empty string through as a literal (unparseable) date value.
    const startsAtRaw = interaction.fields.getTextInputValue('starts_at')?.trim();

    const result = await commitSet([{ type: 'announcement.post', payload: { text, expiry, ...(startsAtRaw ? { startsAt: startsAtRaw } : {}) } }], { actorId: interaction.user.id });
    if (!result.ok) {
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { expiresAt, startsAt } = result.results[0].applied;
    // Surfaced in the confirmation, not left to be discovered on /calendar-adjacent surfaces later (same reasoning as the Double CP callout on calendar bulk imports, 2026-08-22 20:11 EDT) -- posting with a future startsAt is easy to misread as "live now" if the confirmation doesn't say otherwise.
    const startsLine = startsAt ? ` **Scheduled to start** <t:${Math.floor(new Date(startsAt).getTime() / 1000)}:R> -- won't show to anyone before then.` : ' Anyone who hasn\'t seen it yet will, on their next command.';
    return interaction.followUp({ content: `✅ Posted a new announcement${expiresAt ? ` (expires <t:${Math.floor(expiresAt.getTime() / 1000)}:R>)` : ' (never expires)'}.${startsLine}` });
}

// --- EDIT --- custom_id: modal_announce_edit_{id} Updates ONE existing doc in place by its own _id -- never touches any other announcement, and never resets who's already seen this one (an edit is a correction, not a new notice).
async function editAnnouncement(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.customId.replace('modal_announce_edit_', '');
    const text = interaction.fields.getTextInputValue('text').trim();
    const expiry = interaction.fields.getTextInputValue('expiry');
    // Same overwrite-on-every-submit convention as `expiry` -- blank explicitly clears back to "show now", it is not a "leave whatever was there" no-op (the modal always re-submits every field in full).
    const startsAtRaw = interaction.fields.getTextInputValue('starts_at')?.trim();

    const result = await commitSet(
        [{ type: 'announcement.edit', target: { id }, payload: { text, expiry, startsAt: startsAtRaw || null } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        if (result.failedAt?.reason === 'missing') {
            return await interaction.followUp({ content: '❌ That announcement no longer exists (it may have just been deleted or expired).' });
        }
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { expiresAt, startsAt, prior } = result.results[0].applied;
    // Same reasoning as postAnnouncement's confirmation -- state the scheduled start plainly. Also flags a START-DATE CHANGE specifically (added vs cleared vs moved) since editing an announcement for an unrelated reason (a typo in the text) could otherwise silently reschedule -- or un-schedule -- it with nothing in the confirmation to catch that before it's live.
    const startsLine = startsAt ? ` **Scheduled to start** <t:${Math.floor(new Date(startsAt).getTime() / 1000)}:R>.` : '';
    const priorStarts = prior?.startsAt ? new Date(prior.startsAt).getTime() : null;
    const nowStarts = startsAt ? new Date(startsAt).getTime() : null;
    let startChangeNote = '';
    if (priorStarts !== nowStarts) {
        if (nowStarts && !priorStarts) startChangeNote = ' ⚠️ A start date was ADDED -- this announcement is no longer immediately visible.';
        else if (!nowStarts && priorStarts) startChangeNote = ' ⚠️ The start date was REMOVED -- this announcement is now immediately visible.';
        else if (nowStarts && priorStarts) startChangeNote = ' ⚠️ The start date CHANGED.';
    }
    return interaction.followUp({ content: `✅ Updated the announcement${expiresAt ? ` (now expires <t:${Math.floor(expiresAt.getTime() / 1000)}:R>)` : ' (never expires)'}.${startsLine}${startChangeNote}` });
}

// --- BUTTONS: edit_ / delete_ / delconfirm_ / delcancel_ --- all embed the target announcement's own Mongo _id, matched by exact prefix here rather than going through the registry.
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
        // Shows WHICH announcement, not just "an announcement" -- the per-item list on the page already has a preview, but this confirm prompt used to repeat none of it.
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
        const result = await commitSet([{ type: 'announcement.delete', target: { id } }], { actorId: interaction.user.id });
        try {
            if (!result.ok) {
                const why = result.failedAt?.reason === 'missing'
                    ? 'That announcement no longer exists (it may have just been deleted or expired).'
                    : (extractCommitError(result));
                await prompt(interaction, { text: `❌ ${why}` });
                return;
            }
            const removedText = result.results[0].applied.removed.text;
            const preview = removedText.length > 200 ? `${removedText.slice(0, 200)}…` : removedText;
            await prompt(interaction, { text: `✅ Deleted:\n> ${preview.replace(/\n/g, '\n> ')}` });
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
