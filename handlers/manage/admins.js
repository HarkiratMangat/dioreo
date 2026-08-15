// ==========================================
// /manage — MANAGE ADMINS PAGE
// ==========================================
// Grant/revoke/edit-permissions for the bot's admin allowlist. Owner-only at every layer (the page
// itself is owner-only visibility via getManagePages(), and every branch here re-checks isOwner()
// anyway, matching the defense-in-depth every other owner-gated action on this panel uses). Split
// out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/
// 2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and
// .claude/rules/interaction-router.md.

const { recordChange } = require('../../utils/changeStore');
const { prompt } = require('./shared');

// --- GRANT --- custom_id: modal_admin_grant
async function grantAdmin(interaction) {
    const { isOwner, invalidateAdminCache, parsePermissionsInput, formatPermissions } = require('../../utils/adminAccess');
    if (!isOwner(interaction.user.id)) {
        return interaction.reply({ content: "🔒 **Only the bot owner can manage the admin list.**", ephemeral: true });
    }
    const rawId = interaction.fields.getTextInputValue('discord_id').trim();
    const note = interaction.fields.getTextInputValue('note')?.trim() || '';
    // Strips <@123>/<@!123>/@ mention wrapping down to a bare id -- same tolerant parsing shape as a
    // plain-typed id, since Discord doesn't resolve a modal text field as a real mention the way a
    // slash-command user option would.
    const discordId = rawId.replace(/[<@!>]/g, '');
    if (!/^\d{17,20}$/.test(discordId)) {
        return interaction.reply({ content: `❌ "${rawId}" doesn't look like a valid Discord user ID or mention.`, ephemeral: true });
    }
    const rawPermissions = interaction.fields.getTextInputValue('permissions');
    const permissions = parsePermissionsInput(rawPermissions);
    if (!permissions) {
        return interaction.reply({ content: `❌ Couldn't understand "${rawPermissions}". Use \`all\`, \`manage\`, \`alerts\`, \`autobuild\`, or specific pages like \`manage.calendar, manage.draws\` (comma-separated).`, ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const AdminUser = require('../../models/AdminUser');
    await AdminUser.findOneAndUpdate(
        { discordId },
        { $set: { discordId, grantedBy: interaction.user.id, grantedAt: new Date(), note, permissions } },
        { upsert: true }
    );
    invalidateAdminCache();
    recordChange({ actorId: interaction.user.id, page: 'manageadmins', action: 'grant', model: 'AdminUser', target: discordId, summary: `Granted admin access to <@${discordId}> — ${formatPermissions(permissions)}` });
    return interaction.followUp({ content: `✅ Granted admin access to <@${discordId}> — ${formatPermissions(permissions)}.${note ? ` (${note})` : ''}` });
}

// --- EDIT PERMISSIONS --- custom_id: modal_admin_editperms_{discordId}
// Updates ONE existing admin's permissions array in place -- superseded the old typed-id "Revoke
// Admin" modal entirely; revoke is now a direct per-card button (see handleButton below).
async function editAdminPermissions(interaction) {
    const { isOwner, invalidateAdminCache, parsePermissionsInput, formatPermissions } = require('../../utils/adminAccess');
    if (!isOwner(interaction.user.id)) {
        return interaction.reply({ content: "🔒 **Only the bot owner can manage the admin list.**", ephemeral: true });
    }
    const discordId = interaction.customId.replace('modal_admin_editperms_', '');
    const rawPermissions = interaction.fields.getTextInputValue('permissions');
    const permissions = parsePermissionsInput(rawPermissions);
    if (!permissions) {
        return interaction.reply({ content: `❌ Couldn't understand "${rawPermissions}". Use \`all\`, \`manage\`, \`alerts\`, \`autobuild\`, or specific pages like \`manage.calendar, manage.draws\` (comma-separated).`, ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const AdminUser = require('../../models/AdminUser');
    const updated = await AdminUser.findOneAndUpdate({ discordId }, { $set: { permissions } }, { new: true });
    if (!updated) {
        return interaction.followUp({ content: '❌ That admin no longer exists (they may have just been revoked).' });
    }
    invalidateAdminCache();
    recordChange({ actorId: interaction.user.id, page: 'manageadmins', action: 'edit', model: 'AdminUser', target: discordId, summary: `Updated <@${discordId}>'s permissions — ${formatPermissions(permissions)}` });
    return interaction.followUp({ content: `✅ Updated <@${discordId}>'s permissions — ${formatPermissions(permissions)}.` });
}

// --- BUTTONS: editperms_ / revoke_ / revokeconfirm_ / revokecancel_ --- all embed the target
// admin's own Discord id, which parseMngId's group/action split can't handle, so they're matched by
// exact prefix here rather than going through the registry.
async function handleButton(interaction) {
    const customId = interaction.customId;

    if (customId.startsWith('mng_admin_editperms_')) {
        const { isOwner } = require('../../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: "🔒 **Only the bot owner can manage the admin list.**", ephemeral: true });
        }
        const discordId = customId.replace('mng_admin_editperms_', '');
        const AdminUser = require('../../models/AdminUser');
        const doc = await AdminUser.findOne({ discordId }).lean();
        if (!doc) {
            return interaction.reply({ content: '❌ That admin no longer exists (they may have just been revoked).', ephemeral: true });
        }
        const manageCommand = interaction.client.commands.get('manage');
        return await interaction.showModal(manageCommand.buildAdminEditPermissionsModal(doc));
    }

    if (customId.startsWith('mng_admin_revoke_') && !customId.startsWith('mng_admin_revokeconfirm_') && !customId.startsWith('mng_admin_revokecancel_')) {
        const { isOwner } = require('../../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: "🔒 **Only the bot owner can manage the admin list.**", ephemeral: true });
        }
        const discordId = customId.replace('mng_admin_revoke_', '');
        return interaction.reply({
            content: `⚠️ **Revoke admin access from <@${discordId}>?** This cannot be undone (they can always be re-granted).`,
            components: [{
                type: 1, components: [
                    { type: 2, style: 4, label: 'Yes, Revoke', custom_id: `mng_admin_revokeconfirm_${discordId}` },
                    { type: 2, style: 2, label: 'Cancel', custom_id: `mng_admin_revokecancel_${discordId}` }
                ]
            }],
            ephemeral: true
        });
    }

    // Second step -- owner re-checked again here (third check total, alongside the button above and
    // index.js's mng_act_ dispatch) since this is the actual delete -- cheap insurance against a
    // stale/shared confirm prompt somehow being clicked by someone else.
    if (customId.startsWith('mng_admin_revokeconfirm_')) {
        const { isOwner, invalidateAdminCache } = require('../../utils/adminAccess');
        const discordId = customId.replace('mng_admin_revokeconfirm_', '');
        if (!isOwner(interaction.user.id)) {
            try { await prompt(interaction, { text: "🔒 **Only the bot owner can manage the admin list.**" }); }
            catch (notifyError) { console.error('Failed to notify non-owner admin-revoke attempt:', notifyError); }
            return;
        }
        const AdminUser = require('../../models/AdminUser');
        await AdminUser.deleteOne({ discordId });
        invalidateAdminCache();
        recordChange({ actorId: interaction.user.id, page: 'manageadmins', action: 'revoke', model: 'AdminUser', target: discordId, summary: `Revoked admin access from <@${discordId}>` });
        try {
            await prompt(interaction, { text: `✅ Revoked admin access from <@${discordId}>.` });
        } catch (notifyError) {
            console.error('Failed to confirm manage-panel admin revoke (interaction likely expired):', notifyError);
        }
        return;
    }

    if (customId.startsWith('mng_admin_revokecancel_')) {
        try {
            await prompt(interaction, { text: '❎ Revoke cancelled -- nothing was changed.' });
        } catch (notifyError) {
            console.error('Failed to confirm manage-panel admin-revoke cancellation (interaction likely expired):', notifyError);
        }
        return;
    }
}

module.exports = { grantAdmin, editAdminPermissions, handleButton };
