// ==========================================
// BOT — INTERACTION HANDLER
// ==========================================
// /bot analytics + /bot access. Ownership is decided by custom_id prefix, once: `bot_` — the single
// prefix everything this command mints uses (buttons, selects, AND modals; unlike /manage there is
// no second `modal_`-style prefix to reserve, since /bot owns nothing else).
//
// Alerts and Changes branches port the retired handlers/alerts.js's and handlers/audit.js's routing
// logic verbatim (query/parsing logic unchanged, only the custom_id prefix and the render target
// changed — they now re-render through commands/bot.js's shared buildAnalyticsPanel() so the page
// select dropdown and header stay in place across a click, instead of each page owning its own
// standalone panel). Access ports the retired handlers/manage/admins.js's routing logic verbatim.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleBotInteraction is awaited from inside
// handlers/router.js's single top-level try/catch — do NOT add one here, do NOT register listeners,
// and keep every error-branch reply an AWAITED call inside its own small try/catch. See
// .claude/rules/interaction-router.md.
//
// 🔴 /bot access mutations (grant/edit/revoke, and the modals behind them) re-check isOwner() HERE,
// independently of the router's coarse `bot_` -> hasCommandAccess(userId,'bot') guard — same
// defense-in-depth every other owner-gated action in this bot uses (manageadmins did the same
// before this move). The router's guard only proves "this user has SOME /bot access" (the 'bot'
// token, grantable to any admin for analytics); it does NOT prove ownership, which every access
// mutation requires. `/bot access`'s VIEW is also owner-only (checked in commands/bot.js's
// execute()), so a non-owner never even opens the panel these buttons live on — this is the second,
// independent layer, not the only one.

const OWNED_PREFIXES = ['bot_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

// Mirrors handlers/manage/shared.js's prompt() shape (a plain Text Display + optional components,
// through sendV2Payload's own dual-mode ack) without importing a /manage-specific module for one
// trivial wrapper /bot has no other reason to depend on.
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

    // --- PAGE SWITCHER ---
    if (interaction.isStringSelectMenu() && customId === 'bot_pagesel') {
        return await renderAnalyticsPage(interaction, interaction.values[0]);
    }

    // --- ALERTS PAGE (ported from the retired handlers/alerts.js) ---
    if (interaction.isButton() && customId === 'bot_alerts_export') {
        await interaction.deferReply({ flags: 64 });
        const { buildAlertExport } = require('../utils/alertStore');
        const text = await buildAlertExport();
        const stamp = new Date().toISOString().slice(0, 10);
        return interaction.editReply({ content: '📄 Alert log export:', files: [{ attachment: Buffer.from(text, 'utf-8'), name: `dior-alerts-${stamp}.txt` }] });
    }
    if (interaction.isButton() && (customId === 'bot_alerts_explain' || customId === 'bot_alerts_back')) {
        return await renderAnalyticsPage(interaction, 'alerts', { alertsState: { view: customId === 'bot_alerts_explain' ? 'explain' : 'main' } });
    }
    if (interaction.isButton() && customId.startsWith('bot_alerts_page_')) {
        const page = parseInt(customId.replace('bot_alerts_page_', ''), 10) || 0;
        return await renderAnalyticsPage(interaction, 'alerts', { alertsState: { page, view: 'main' } });
    }

    // --- USAGE / TIMING PAGE EXPORTS (stage 4) ---
    if (interaction.isButton() && customId === 'bot_usage_export') {
        await interaction.deferReply({ flags: 64 });
        const { buildUsageExport } = require('../commands/bot');
        const text = await buildUsageExport();
        const stamp = new Date().toISOString().slice(0, 10);
        return interaction.editReply({ content: '📄 Usage export:', files: [{ attachment: Buffer.from(text, 'utf-8'), name: `dior-usage-${stamp}.txt` }] });
    }
    if (interaction.isButton() && customId === 'bot_timing_export') {
        await interaction.deferReply({ flags: 64 });
        const { buildTimingExport } = require('../commands/bot');
        const text = await buildTimingExport();
        const stamp = new Date().toISOString().slice(0, 10);
        return interaction.editReply({ content: '📄 Timing export:', files: [{ attachment: Buffer.from(text, 'utf-8'), name: `dior-timing-${stamp}.txt` }] });
    }

    // --- CHANGES PAGE (ported from the retired handlers/audit.js) ---
    if (interaction.isButton() && customId.startsWith('bot_changes_export~')) {
        await interaction.deferReply({ flags: 64 });
        const { buildChangeExport } = require('../utils/changeStore');
        const { decodeState } = require('../commands/bot');
        const { filterPage, filterActor } = decodeState(customId.replace('bot_changes_export~', ''));
        const text = await buildChangeExport({ filterPage, filterActor });
        const stamp = new Date().toISOString().slice(0, 10);
        return interaction.editReply({ content: '📄 Change log export:', files: [{ attachment: Buffer.from(text, 'utf-8'), name: `dior-changes-${stamp}.txt` }] });
    }
    if (interaction.isButton() && customId.startsWith('bot_changes_page_')) {
        const rest = customId.replace('bot_changes_page_', '');
        const sep = rest.indexOf('~');
        const pageStr = sep === -1 ? rest : rest.slice(0, sep);
        const tail = sep === -1 ? '' : rest.slice(sep + 1);
        const { decodeState } = require('../commands/bot');
        const { filterPage, filterActor } = decodeState(tail);
        return await renderAnalyticsPage(interaction, 'changes', { changesState: { page: parseInt(pageStr, 10) || 0, filterPage, filterActor } });
    }
    if (interaction.isStringSelectMenu() && customId.startsWith('bot_changes_filterpage~')) {
        const filterActor = customId.replace('bot_changes_filterpage~', '') || null;
        const picked = interaction.values[0];
        const filterPage = picked === '__all__' ? null : picked;
        return await renderAnalyticsPage(interaction, 'changes', { changesState: { page: 0, filterPage, filterActor } });
    }
    if (interaction.isButton() && customId.startsWith('bot_changes_filteractor~')) {
        const filterPage = customId.replace('bot_changes_filteractor~', '') || '';
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder()
            .setCustomId(`bot_changes_filteractormodal~${filterPage}`)
            .setTitle('Filter by Actor')
            .addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('actor_id').setLabel('Discord user ID (blank clears the filter)').setStyle(TextInputStyle.Short).setRequired(false),
            ));
        return interaction.showModal(modal);
    }
    if (interaction.isModalSubmit() && customId.startsWith('bot_changes_filteractormodal~')) {
        const filterPage = customId.replace('bot_changes_filteractormodal~', '') || null;
        const rawId = interaction.fields.getTextInputValue('actor_id').trim().replace(/[<@!>]/g, '');
        const filterActor = /^\d{17,20}$/.test(rawId) ? rawId : null;
        return await renderAnalyticsPage(interaction, 'changes', { changesState: { page: 0, filterPage, filterActor } });
    }
    if (interaction.isButton() && customId === 'bot_changes_clearfilters') {
        return await renderAnalyticsPage(interaction, 'changes', { changesState: { page: 0 } });
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

    // Second step -- owner re-checked again here (third check total, alongside the button above and
    // the router's coarse `bot_` guard) since this is the actual delete, matching the exact
    // defense-in-depth the retired manageadmins revoke flow used.
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
        return interaction.followUp({ content: `✅ Granted admin access to <@${discordId}> — ${formatPermissions(permissions)}.${note ? ` (${note})` : ''}` });
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
            return interaction.followUp({ content: '❌ That admin no longer exists (they may have just been revoked).' });
        }
        invalidateAdminCache();
        recordChange({ actorId: interaction.user.id, page: 'access', action: 'edit', model: 'AdminUser', target: discordId, summary: `Updated <@${discordId}>'s permissions — ${formatPermissions(permissions)}` });
        return interaction.followUp({ content: `✅ Updated <@${discordId}>'s permissions — ${formatPermissions(permissions)}.` });
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handleBotInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleBotInteraction, OWNED_PREFIXES };
