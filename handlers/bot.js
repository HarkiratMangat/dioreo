// ==========================================
// BOT — INTERACTION HANDLER
// ==========================================
// /bot analytics + /bot access. Ownership is decided by custom_id prefix, once: `bot_` — the single prefix everything this command mints uses (buttons, selects, AND modals; unlike /manage there is no second `modal_`-style prefix to reserve, since /bot owns nothing else).
//
// Alerts and Changes branches port the retired handlers/alerts.js's and handlers/audit.js's routing logic verbatim (query/parsing logic unchanged, only the custom_id prefix and the render target changed — they now re-render through commands/bot.js's shared buildAnalyticsPanel() so the page select dropdown and header stay in place across a click, instead of each page owning its own standalone panel). Access ports the retired handlers/manage/admins.js's routing logic verbatim.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleBotInteraction is awaited from inside handlers/router.js's single top-level try/catch — do NOT add one here, do NOT register listeners, and keep every error-branch reply an AWAITED call inside its own small try/catch. See .claude/rules/interaction-router.md.
//
// 🔴 /bot access mutations (grant/edit/revoke, and the modals behind them) re-check isOwner() HERE, independently of the router's coarse `bot_` -> hasCommandAccess(userId,'bot') guard — same defense-in-depth every other owner-gated action in this bot uses (manageadmins did the same before this move). The router's guard only proves "this user has SOME /bot access" (the 'bot' token, grantable to any admin for analytics); it does NOT prove ownership, which every access mutation requires. `/bot access`'s VIEW is also owner-only (checked in commands/bot.js's execute()), so a non-owner never even opens the panel these buttons live on — this is the second, independent layer, not the only one.

const OWNED_PREFIXES = ['bot_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

// Mirrors handlers/manage/shared.js's prompt() shape (a plain Text Display + optional components, through sendV2Payload's own dual-mode ack) without importing a /manage-specific module for one trivial wrapper /bot has no other reason to depend on.
function respondText(interaction, text, components = []) {
    const { sendV2Payload } = require('../utils/sendV2Payload');
    const body = [];
    if (text) body.push({ type: 10, content: text });
    body.push(...components);
    return sendV2Payload(interaction, body);
}

async function renderAnalyticsPage(interaction, page, subState = {}) {
    await interaction.deferUpdate();
    const { buildAnalyticsPanel } = require('../commands/bot');
    const { sendV2Payload } = require('../utils/sendV2Payload');
    const components = await buildAnalyticsPanel({ page, client: interaction.client, ...subState });
    return sendV2Payload(interaction, components);
}

async function route(interaction) {
    const customId = interaction.customId;

    // --- HOTPATCH PANEL BUTTONS --- 🔴 Owner re-check, independent of the router's coarse `bot_` -> hasCommandAccess(userId,'bot') guard, exactly as every /bot access mutation does. That guard proves "has SOME /bot access", not ownership -- and this button restarts production.
    if (interaction.isButton() && customId === 'bot_hp_restart') {
        const { isOwner } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) return await respondText(interaction, '🔒 Owner only.');
        await interaction.deferUpdate();
        await respondText(interaction, '♻️ **Restarting.** Back in ~15s — watch for the “Bot online” alert.');
        // NO sudo. Write the marker deploy.sh writes, then SIGTERM ourselves; systemd's Restart=always brings the unit back and bot/lifecycle.js's readRestartReason() labels the alert "Manual restart". Handing a Discord button passwordless sudo would be a real privilege grant for no gain.
        const fs = require('fs'); const path = require('path');
        try { fs.writeFileSync(path.join(__dirname, '..', '.restart-reason'), `manual ${Math.floor(Date.now() / 1000)}`); } catch { /* labelling only */ }
        // 🔴 SIGTERM, never process.exit(). utils/instanceLock.js's releaseLock and bot/lifecycle.js's installShutdownFlush are both registered on SIGINT/SIGTERM -- they exist (v3 review findings #12 and #56) precisely so a restart does not strand the instance lock or discard the buffered analytics. A bare exit() runs NEITHER. No .unref() either: this timer must fire.
        setTimeout(() => process.kill(process.pid, 'SIGTERM'), 500);   // let the reply reach Discord first
        return true;
    }
    if (interaction.isButton() && customId === 'bot_hp_cancel') {
        await interaction.deferUpdate();
        await respondText(interaction, '👍 **Cancelled.** Nothing was changed.');
        return true;
    }

    // --- PAGE SWITCHER ---
    if (interaction.isStringSelectMenu() && customId === 'bot_pagesel') {
        return await renderAnalyticsPage(interaction, interaction.values[0]);
    }

    // --- ALERTS PAGE (ported from the retired handlers/alerts.js) --- the pager and Export moved to the portal (bot analytics redesign, 2026-08-23 00:40 EDT); bot_alerts_export/bot_alerts_page_ branches deleted, not just their buttons. buildUsageExport/buildTimingExport stay in commands/bot.js -- portal/api/analytics.js still calls them -- only their Discord buttons (and these bot_usage_export/bot_timing_export branches) are gone.
    if (interaction.isButton() && (customId === 'bot_alerts_explain' || customId === 'bot_alerts_back')) {
        return await renderAnalyticsPage(interaction, 'alerts', { alertsState: { view: customId === 'bot_alerts_explain' ? 'explain' : 'main' } });
    }

    // --- EDIT THE RECORD, from the change-detail panel --- Harkirat, 2026-08-23 10:12 EDT: the detail view should carry "a revert or edit or delete buttons", not just read-only facts. Revert undoes the CHANGE; this opens the section's own edit flow for the RECORD, which is a different action and worth being able to reach from the same place. 🔴 NO deferReply() ANYWHERE ON THIS PATH. Every `edit` entry in the registry is kind:'modal', and its run() calls showModal(), which Discord requires to be the interaction's FIRST response -- deferring first throws. This mirrors commands/manage.js's own slash `action:` dispatch exactly, including running BEFORE any acknowledgement, and resolveAction() re-checks the per-page permission itself so a 'bot'-token admin cannot reach a section they hold no scope for.
    if (interaction.isButton() && customId.startsWith('bot_changeedit_')) {
        const page = customId.replace('bot_changeedit_', '');
        const { resolveAction, DENIAL_MESSAGE } = require('../utils/manageActions');
        const resolved = await resolveAction(page, 'edit', interaction.user.id);
        if (!resolved.ok || !resolved.entry.slash) {
            return await interaction.reply({ content: DENIAL_MESSAGE[resolved.reason] || DENIAL_MESSAGE.denied, ephemeral: true });
        }
        return await resolved.entry.run({ interaction, page, manageCommand: interaction.client.commands.get('manage') });
    }

    // --- CHANGE DETAIL --- read-only, but gated with the SAME per-page check the revert itself uses: the panel states which record a change touched and what its inverse holds, which is exactly the information the 'bot' token alone does not entitle an admin to see about a /manage page they hold no scope for.
    if (interaction.isButton() && customId.startsWith('bot_changedetail_')) {
        const changeId = customId.replace('bot_changedetail_', '');
        const { getChange } = require('../utils/changeStore');
        const { hasManagePageAccess } = require('../utils/adminAccess');
        const row = await getChange(changeId);
        if (!row || !(await hasManagePageAccess(interaction.user.id, row.page))) {
            return await interaction.reply({ content: "🔒 You don't have access to the section that change belongs to.", ephemeral: true });
        }
        // A SEPARATE ephemeral message, never a re-render of the panel -- the analytics page stays put behind it, so reading one row's detail does not cost you the glance you were looking at.
        await interaction.deferReply({ flags: 64 });
        const { buildChangeDetailBody } = require('../commands/bot');
        const { sendV2Payload } = require('../utils/sendV2Payload');
        return sendV2Payload(interaction, [{ type: 17, accent_color: 0x6C5DD3, components: await buildChangeDetailBody(changeId) }]);
    }

    // --- CHANGES PAGE (ported from the retired handlers/audit.js) --- the pager, page/actor filters and export moved to the portal (bot analytics redesign, 2026-08-23 00:32 EDT); their branches (bot_changes_export~, bot_changes_page_, bot_changes_filterpage~, bot_changes_filteractor~/filteractormodal~, bot_changes_clearfilters) are deleted, not just their buttons -- an unreachable branch reads as live code. Revert stays; it's the one control that never left Discord. 🔴 THE ROUTER'S bot_ -> hasCommandAccess(userId,'bot') GUARD IS NOT SUFFICIENT HERE. It proves only "this user has SOME /bot access" -- the 'bot' token is grantable to any admin purely for analytics. It does NOT prove they may mutate the /manage page the change belongs to. Without this independent re-check, an admin granted 'bot' to read analytics could revert changes on pages they hold no scope for -- a privilege escalation in the one control that writes to live data from a read-only surface. Same shape /bot access and bot_hp_restart already use.
    if (interaction.isButton() && customId.startsWith('bot_revert_')) {
        const changeId = customId.replace('bot_revert_', '');
        const { getChange } = require('../utils/changeStore');
        const { hasManagePageAccess } = require('../utils/adminAccess');
        const row = await getChange(changeId);
        if (!row || !(await hasManagePageAccess(interaction.user.id, row.page))) {
            return await interaction.reply({ content: "🔒 You don't have access to the section that change belongs to.", ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        const { revertChange } = require('../core/revert');
        const result = await revertChange(changeId, { actorId: interaction.user.id });
        if (!result.ok) {
            return await interaction.followUp({ content: `❌ ${result.reason}` });
        }
        // Matches handleUndo's own pattern (handlers/manage/shared.js) -- a plain confirmation followUp, no re-render. The interaction is already acknowledged via deferReply/followUp above; deferUpdate() (what renderAnalyticsPage needs to refresh the panel in place) cannot be called on an interaction a second time. Re-opening the Changes page shows the update.
        return await interaction.followUp({ content: `↩️ **Reverted** \`${changeId}\`.` });
    }

    // --- ACCESS PAGE (ported from the retired handlers/manage/admins.js) ---
    if (interaction.isButton() && customId === 'bot_admin_grant') {
        const { isOwner } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: '🔒 **Only the bot owner can manage the admin list.**', ephemeral: true });
        }
        const { buildAdminGrantModal } = require('../commands/bot');
        return interaction.showModal(buildAdminGrantModal());
    }

    if (interaction.isButton() && customId.startsWith('bot_admin_editperms_')) {
        const { isOwner } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: '🔒 **Only the bot owner can manage the admin list.**', ephemeral: true });
        }
        const discordId = customId.replace('bot_admin_editperms_', '');
        const AdminUser = require('../models/AdminUser');
        const doc = await AdminUser.findOne({ discordId }).lean();
        if (!doc) {
            return interaction.reply({ content: '❌ That admin no longer exists (they may have just been revoked).', ephemeral: true });
        }
        const { buildAdminEditPermissionsModal } = require('../commands/bot');
        return interaction.showModal(buildAdminEditPermissionsModal(doc));
    }

    if (interaction.isButton() && customId.startsWith('bot_admin_revoke_')
        && !customId.startsWith('bot_admin_revokeconfirm_') && !customId.startsWith('bot_admin_revokecancel_')) {
        const { isOwner } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: '🔒 **Only the bot owner can manage the admin list.**', ephemeral: true });
        }
        const discordId = customId.replace('bot_admin_revoke_', '');
        return interaction.reply({
            content: `⚠️ **Revoke admin access from <@${discordId}>?** This cannot be undone (they can always be re-granted).`,
            components: [{
                type: 1, components: [
                    { type: 2, style: 4, label: 'Yes, Revoke', custom_id: `bot_admin_revokeconfirm_${discordId}` },
                    { type: 2, style: 2, label: 'Cancel', custom_id: `bot_admin_revokecancel_${discordId}` },
                ],
            }],
            ephemeral: true,
        });
    }

    // Second step -- owner re-checked again here (third check total, alongside the button above and the router's coarse `bot_` guard) since this is the actual delete, matching the exact defense-in-depth the retired manageadmins revoke flow used.
    if (interaction.isButton() && customId.startsWith('bot_admin_revokeconfirm_')) {
        const { isOwner, invalidateAdminCache } = require('../utils/adminAccess');
        const discordId = customId.replace('bot_admin_revokeconfirm_', '');
        if (!isOwner(interaction.user.id)) {
            try { await respondText(interaction, '🔒 **Only the bot owner can manage the admin list.**'); }
            catch (notifyError) { console.error('Failed to notify non-owner bot-access revoke attempt:', notifyError); }
            return;
        }
        const AdminUser = require('../models/AdminUser');
        const { recordChange } = require('../utils/changeStore');
        await AdminUser.deleteOne({ discordId });
        invalidateAdminCache();
        recordChange({ actorId: interaction.user.id, page: 'access', action: 'revoke', model: 'AdminUser', target: discordId, summary: `Revoked admin access from <@${discordId}>` });
        try {
            await respondText(interaction, `✅ Revoked admin access from <@${discordId}>.`);
        } catch (notifyError) {
            console.error('Failed to confirm bot-access revoke (interaction likely expired):', notifyError);
        }
        return;
    }

    if (interaction.isButton() && customId.startsWith('bot_admin_revokecancel_')) {
        try {
            await respondText(interaction, '❎ Revoke cancelled — nothing was changed.');
        } catch (notifyError) {
            console.error('Failed to confirm bot-access revoke cancellation (interaction likely expired):', notifyError);
        }
        return;
    }

    if (interaction.isButton() && customId === 'bot_admin_guide') {
        await interaction.deferReply({ flags: 64 });
        const { buildGuideContainer } = require('../utils/manageGuides');
        const { sendV2Payload } = require('../utils/sendV2Payload');
        return sendV2Payload(interaction, buildGuideContainer('admins'));
    }

    if (interaction.isModalSubmit() && customId === 'bot_adminmodal_grant') {
        const { isOwner, invalidateAdminCache, parsePermissionsInput, formatPermissions } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: '🔒 **Only the bot owner can manage the admin list.**', ephemeral: true });
        }
        const rawId = interaction.fields.getTextInputValue('discord_id').trim();
        const note = interaction.fields.getTextInputValue('note')?.trim() || '';
        const discordId = rawId.replace(/[<@!>]/g, '');
        if (!/^\d{17,20}$/.test(discordId)) {
            return interaction.reply({ content: `❌ "${rawId}" doesn't look like a valid Discord user ID or mention.`, ephemeral: true });
        }
        const rawPermissions = interaction.fields.getTextInputValue('permissions');
        const permissions = parsePermissionsInput(rawPermissions);
        if (!permissions) {
            return interaction.reply({ content: `❌ Couldn't understand "${rawPermissions}". Use \`all\`, \`manage\`, \`bot\`, \`autobuild\`, or specific pages like \`manage.calendar, manage.draws\` (comma-separated).`, ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        const AdminUser = require('../models/AdminUser');
        const { recordChange } = require('../utils/changeStore');
        await AdminUser.findOneAndUpdate(
            { discordId },
            { $set: { discordId, grantedBy: interaction.user.id, grantedAt: new Date(), note, permissions } },
            { upsert: true },
        );
        invalidateAdminCache();
        recordChange({ actorId: interaction.user.id, page: 'access', action: 'grant', model: 'AdminUser', target: discordId, summary: `Granted admin access to <@${discordId}> — ${formatPermissions(permissions)}` });
        // editReply, not followUp (v3-pre-release review, finding #7) -- followUp posts a NEW message (leaving the deferReply({ephemeral:true}) placeholder hanging forever) and, with no ephemeral flag of its own, lands publicly -- disclosing who holds bot admin and at what scope to the whole channel.
        return interaction.editReply({ content: `✅ Granted admin access to <@${discordId}> — ${formatPermissions(permissions)}.${note ? ` (${note})` : ''}` });
    }

    if (interaction.isModalSubmit() && customId.startsWith('bot_adminmodal_editperms_')) {
        const { isOwner, invalidateAdminCache, parsePermissionsInput, formatPermissions } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: '🔒 **Only the bot owner can manage the admin list.**', ephemeral: true });
        }
        const discordId = customId.replace('bot_adminmodal_editperms_', '');
        const rawPermissions = interaction.fields.getTextInputValue('permissions');
        const permissions = parsePermissionsInput(rawPermissions);
        if (!permissions) {
            return interaction.reply({ content: `❌ Couldn't understand "${rawPermissions}". Use \`all\`, \`manage\`, \`bot\`, \`autobuild\`, or specific pages like \`manage.calendar, manage.draws\` (comma-separated).`, ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        const AdminUser = require('../models/AdminUser');
        const { recordChange } = require('../utils/changeStore');
        const updated = await AdminUser.findOneAndUpdate({ discordId }, { $set: { permissions } }, { new: true });
        if (!updated) {
            return interaction.editReply({ content: '❌ That admin no longer exists (they may have just been revoked).' });
        }
        invalidateAdminCache();
        recordChange({ actorId: interaction.user.id, page: 'access', action: 'edit', model: 'AdminUser', target: discordId, summary: `Updated <@${discordId}>'s permissions — ${formatPermissions(permissions)}` });
        return interaction.editReply({ content: `✅ Updated <@${discordId}>'s permissions — ${formatPermissions(permissions)}.` });
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleBotInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleBotInteraction, OWNED_PREFIXES };
