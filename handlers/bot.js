const BOT_EMOJI = require('../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
// ==========================================
// BOT — INTERACTION HANDLER
// ==========================================
// /bot analytics + /bot access, /bot servers, and since B7 /bot penalties and /bot freeze. Ownership is decided by custom_id prefix, once: `bot_` — the single prefix everything this command mints uses (buttons, selects, AND modals; unlike /manage there is no second `modal_`-style prefix to reserve, since /bot owns nothing else).
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

// Each /bot page is its own permission scope since the permission restructure (2026-10-19 19:28 EDT): the router's `bot_` guard proves only that this person holds SOME /bot page, so the page itself is re-checked here, on every click, against the pages they hold.
async function renderAnalyticsPage(interaction, page, subState = {}) {
    const { getBotPages } = require('../utils/adminAccess');
    const pages = await getBotPages(interaction.user.id);
    if (!pages.includes(page)) {
        return await interaction.reply({ content: "🔒 **You don't have permission for that page.** Ask the bot owner to grant it if you need it.", ephemeral: true });
    }
    await interaction.deferUpdate();
    const { buildAnalyticsPanel } = require('../commands/bot');
    const { sendV2Payload } = require('../utils/sendV2Payload');
    const components = await buildAnalyticsPanel({ page, client: interaction.client, pages, ...subState });
    return sendV2Payload(interaction, components);
}

async function route(interaction) {
    const customId = interaction.customId;

    // /bot servers' "Enter an ID" pop-up.
    if (interaction.isModalSubmit() && customId === 'bot_srvmodal') {
        const { isOwner } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return await interaction.reply({ content: "🔒 **Only the bot owner can change another server's settings.**", ephemeral: true });
        }
        const guildId = (interaction.fields.getTextInputValue('id') || '').trim();
        if (!/^\d{15,22}$/.test(guildId)) {
            return await interaction.reply({ content: `${BOT_EMOJI.cross} That is not a server ID: 17–20 digits, from the server's right-click menu with Developer Mode on.`, ephemeral: true });
        }
        await interaction.deferUpdate();
        const { buildServersPanel } = require('../commands/bot');
        const { sendV2Payload } = require('../utils/sendV2Payload');
        return sendV2Payload(interaction, await buildServersPanel(interaction.client, guildId), { allowedMentions: { parse: [] } });
    }

    // --- /bot servers (the owner's override for one server's /admin rules) --- 🔴 Owner re-check here too: the router's `bot_` guard only proves SOME /bot access, and the 'bot' token is grantable to any admin.
    if (interaction.isButton() && customId.startsWith('bot_srv_')) {
        const { isOwner } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return await interaction.reply({ content: "🔒 **Only the bot owner can change another server's settings.**", ephemeral: true });
        }
        const [verb, guildId] = customId.slice('bot_srv_'.length).split('|');
        // "Enter an ID": a one-box pop-up; its submit is bot_srvmodal below.
        if (verb === 'ask') {
            return await interaction.showModal({
                title: "A server's /admin rules",
                custom_id: 'bot_srvmodal',
                components: [{ type: 1, components: [{ type: 4, custom_id: 'id', label: 'Server ID', style: 1, min_length: 15, max_length: 22, required: true, placeholder: '17–20 digits' }] }],
            });
        }
        if (!/^\d{15,22}$/.test(guildId || '')) return;
        // Reply Limits is a pop-up, so it opens before the acknowledgement (B7).
        if (verb === 'limits') return await interaction.showModal(require('../commands/bot').replyLimitsModal(guildId));
        await interaction.deferUpdate();
        const { buildServersPanel } = require('../commands/bot');
        const { sendV2Payload } = require('../utils/sendV2Payload');
        const NO_PINGS = { allowedMentions: { parse: [] } };
        if (verb === 'resetarm' || verb === 'delarm' || verb === 'leavearm' || verb === 'blockarm') {
            const armed = { resetarm: 'reset', delarm: 'delete', leavearm: 'leave', blockarm: 'block' }[verb];
            return sendV2Payload(interaction, await buildServersPanel(interaction.client, guildId, { armed }), NO_PINGS);
        }
        // Leave, Block and Unblock (B7, his "ok", 2026-10-30 13:09 EDT): Dioreo can leave a server with no permission at all; a blocked server is left again whenever it is re-added (bot/lifecycle.js). Each is two presses and lands on /bot analytics' Changes page.
        if (verb === 'leave' || verb === 'block' || verb === 'unblock') {
            const controls = require('../utils/botControls');
            const guild = require('../bot/clients').publicClient(interaction.client)?.guilds?.cache?.get(guildId);
            const name = guild?.name || guildId;
            let note;
            try {
                if (verb !== 'leave') await controls.setFlag('blockedGuilds', guildId, verb === 'block');
                if (verb !== 'unblock' && guild) {
                    controls.markLeaving(guildId);
                    await guild.leave();
                }
                note = `-# ${BOT_EMOJI.checkmark} ${verb === 'unblock' ? 'Unblocked: it can add Dioreo again.' : `${guild ? 'Left' : 'Not in it'}${verb === 'block' ? ', and blocked: Dioreo leaves again if it is re-added' : ''}.`}`;
            } catch (err) {
                console.error(`/bot servers: ${verb} failed for ${guildId}:`, err?.message || err);
                note = `-# ${BOT_EMOJI.cross} That did not finish: ${String(err?.message || err).slice(0, 120)}`;
            }
            require('../utils/changeStore').recordChange({ actorId: interaction.user.id, page: 'access', action: { leave: 'serverLeave', block: 'serverBlock', unblock: 'serverUnblock' }[verb], model: 'BotControls', target: guildId, summary: `${{ leave: 'Left', block: 'Left and blocked', unblock: 'Unblocked' }[verb]} ${name}` });
            return sendV2Payload(interaction, await buildServersPanel(interaction.client, guildId, { note }), NO_PINGS);
        }
        if (verb === 'reset' || verb === 'del') {
            const { getGuildSettings, updateGuildSettings, invalidateGuildPolicy } = require('../utils/guildPolicy');
            const { rulesText } = require('../commands/admin');
            const GuildSettings = require('../models/GuildSettings');
            const before = await getGuildSettings(guildId);
            // Written down before the change: the summary must show the rules as they were.
            const beforeText = before ? rulesText(before).replace(/\n/g, ' · ') : '';
            if (before) {
                if (verb === 'reset') {
                    // source 'owner' marks the server's own change log row as Dioreo's owner, not one of its admins.
                    await updateGuildSettings(guildId, interaction.user.id, doc => {
                        doc.channelRules = [];
                        doc.roleRules = [];
                        doc.ephemeralCommands = [];
                        doc.commandSettings = [];
                        doc.defaultVisibility = 'public';
                        // The text-command switch and prefix too (B7 think-pass, 2026-10-30): the owner's reset is for a hijacked server, and a hijacker who turned text commands off or set a prefix must not survive it.
                        doc.textRules = undefined;
                        doc.textPrefixes = undefined;
                    }, { source: 'owner' });
                } else {
                    await GuildSettings.deleteOne({ guildId });
                    invalidateGuildPolicy(guildId);
                    // The settings go; the change log stays, so the server's admins can still see what was there and who removed it.
                    require('../utils/guildPolicy').logGuildChange(guildId, interaction.user.id, ['Settings record deleted by Dioreo\'s owner on request; every rule removed, default Public'], 'owner');
                }
                const name = interaction.client.guilds?.cache?.get(guildId)?.name;
                const { recordChange } = require('../utils/changeStore');
                // The rules as they were go in the summary: neither action has an Undo, so this is what lets a server's setup be rebuilt by hand.
                recordChange({ actorId: interaction.user.id, page: 'access', action: verb === 'reset' ? 'serverReset' : 'serverDelete', model: 'GuildSettings', target: guildId, summary: `${verb === 'reset' ? 'Reset' : 'Deleted'} /admin settings for ${name || guildId}. Before: ${beforeText}` });
            }
            const note = verb === 'reset' ? `-# ${BOT_EMOJI.checkmark} Every slash and text rule cleared, the prefix back to the default, and the default set to Public.` : `-# ${BOT_EMOJI.checkmark} Record deleted. The server behaves as if /admin was never used.`;
            return sendV2Payload(interaction, await buildServersPanel(interaction.client, guildId, { note }), NO_PINGS);
        }
        return sendV2Payload(interaction, await buildServersPanel(interaction.client, guildId), NO_PINGS);
    }

    // --- THE OWNER'S TEXT-COMMAND TOOLS (B7): /bot penalties and /bot freeze --- 🔴 Owner re-check on every click and pop-up, as /bot servers does: the router's `bot_` guard proves only SOME /bot access. A save that fails says so on the panel; memory keeps the change until a restart.
    if ((interaction.isButton() || interaction.isModalSubmit()) && (customId.startsWith('bot_pen') || customId.startsWith('bot_frz'))) {
        const { isOwner } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return await interaction.reply({ content: '🔒 **Only the bot owner can use this.**', ephemeral: true });
        }
        const bot = require('../commands/bot');
        const controls = require('../utils/botControls');
        const spam = require('../utils/textCommands/spamLadder');
        const { sendV2Payload } = require('../utils/sendV2Payload');
        const NO_PINGS = { allowedMentions: { parse: [] } };
        const saved = async (fn, done) => {
            try { await fn(); return `-# ${BOT_EMOJI.checkmark} ${done}`; } catch (err) {
                console.error('Bot controls: could not save:', err?.message || err);
                return `-# ${BOT_EMOJI.cross} Done for now, but it could not be saved, so a restart undoes it.`;
            }
        };
        const [verb, arg] = customId.replace(/^bot_(penm|pen|frzm|frz)_/, '').split('|');
        const kind = customId.match(/^bot_(penm|pen|frzm|frz)_/)?.[1];

        // Pop-ups open before any acknowledgement.
        if (kind === 'pen' && verb === 'ask') return await interaction.showModal(bot.penaltyLookupModal());
        if (kind === 'pen' && verb === 'tune') return await interaction.showModal(bot.ladderTuneModal());
        if (kind === 'pen' && verb === 'extend') return await interaction.showModal(bot.penaltyExtendModal(arg));
        if (kind === 'frz' && (verb === 'all' || verb === 'some')) return await interaction.showModal(bot.freezeModal(verb === 'all'));

        if (kind === 'frz' || kind === 'frzm') {
            let note = null;
            if (kind === 'frzm' && verb === 'some') {
                const asked = (interaction.fields.getTextInputValue('commands') || '').toLowerCase().split(/[\s,/]+/).filter(Boolean);
                const known = new Set([...(interaction.client.commands?.keys?.() || [])].filter(n => n !== 'bot'));
                const unknown = asked.filter(n => !known.has(n));
                if (!asked.length || unknown.length) {
                    return await interaction.reply({ content: `${BOT_EMOJI.cross} ${unknown.length ? `Not a command: ${unknown.map(n => `\`${n}\``).join(', ')}.` : 'Name at least one command.'} Use slash names, e.g. \`gunsmith, draws\`.`, ephemeral: true });
                }
                note = await saved(() => controls.setFreeze({ commands: asked, reason: interaction.fields.getTextInputValue('reason') }), `Frozen: ${asked.map(n => `/${n}`).join(', ')}.`);
            } else if (kind === 'frzm' && verb === 'all') {
                note = await saved(() => controls.setFreeze({ all: true, reason: interaction.fields.getTextInputValue('reason') }), 'Everything is frozen.');
            } else if (kind === 'frz' && verb === 'off') {
                note = await saved(() => controls.clearFreeze(), 'Unfrozen. Dioreo answers again.');
            }
            await interaction.deferUpdate();
            return sendV2Payload(interaction, bot.buildFreezePanel({ note }), NO_PINGS);
        }

        if (kind === 'penm' && verb === 'ask') {
            const userId = (interaction.fields.getTextInputValue('id') || '').replace(/[<@!>]/g, '').trim();
            if (!/^\d{15,22}$/.test(userId)) {
                return await interaction.reply({ content: `${BOT_EMOJI.cross} That is not a user ID: 17–20 digits, from their profile's right-click menu with Developer Mode on.`, ephemeral: true });
            }
            await interaction.deferUpdate();
            return sendV2Payload(interaction, bot.buildPenaltyUserPanel(interaction.client, userId), NO_PINGS);
        }
        if (kind === 'penm' && verb === 'tune') {
            const parsed = controls.parseSpam({ points: interaction.fields.getTextInputValue('points'), threshold: interaction.fields.getTextInputValue('threshold'), rungs: interaction.fields.getTextInputValue('rungs') });
            if (parsed.error) return await interaction.reply({ content: `${BOT_EMOJI.cross} ${parsed.error}`, ephemeral: true });
            const note = await saved(() => controls.setSpam(parsed.spam), 'Ladder saved. It applies from the next message; running penalties keep their end time.');
            await interaction.deferUpdate();
            return sendV2Payload(interaction, bot.buildPenaltiesPanel(interaction.client, { note }), NO_PINGS);
        }
        if (kind === 'penm' && verb === 'extend') {
            const text = (interaction.fields.getTextInputValue('minutes') || '').trim();
            const minutes = text ? Number(text) : null;
            if (text && !(Number.isInteger(minutes) && minutes >= 1 && minutes <= 7 * 24 * 60)) {
                return await interaction.reply({ content: `${BOT_EMOJI.cross} Minutes: a whole number from 1 to ${7 * 24 * 60} (a week), or blank for the next rung.`, ephemeral: true });
            }
            await interaction.deferUpdate();
            const entry = await spam.extendPenalty(arg, { ms: minutes == null ? null : minutes * 60000, client: require('../bot/clients').publicClient(interaction.client) });
            const note = entry ? `-# ${BOT_EMOJI.checkmark} Extended: now ends <t:${Math.ceil(entry.until / 1000)}:R>.` : `-# ${BOT_EMOJI.cross} Their penalty already ended.`;
            return sendV2Payload(interaction, bot.buildPenaltyUserPanel(interaction.client, arg, { note }), NO_PINGS);
        }

        await interaction.deferUpdate();
        if (verb === 'list') return sendV2Payload(interaction, bot.buildPenaltiesPanel(interaction.client), NO_PINGS);
        if (verb === 'liftallarm') return sendV2Payload(interaction, bot.buildPenaltiesPanel(interaction.client, { armed: 'liftall' }), NO_PINGS);
        if (verb === 'liftall') {
            const n = await spam.liftAll({ client: require('../bot/clients').publicClient(interaction.client) });
            return sendV2Payload(interaction, bot.buildPenaltiesPanel(interaction.client, { note: `-# ${BOT_EMOJI.checkmark} Lifted ${n}, and today's rungs forgotten.` }), NO_PINGS);
        }
        if (!/^\d{15,22}$/.test(arg || '')) return;
        if (verb === 'user') return sendV2Payload(interaction, bot.buildPenaltyUserPanel(interaction.client, arg), NO_PINGS);
        if (verb === 'blockarm') return sendV2Payload(interaction, bot.buildPenaltyUserPanel(interaction.client, arg, { armed: 'block' }), NO_PINGS);
        // The owner is never a target, whatever a crafted id says.
        if (isOwner(arg)) return sendV2Payload(interaction, bot.buildPenaltyUserPanel(interaction.client, arg), NO_PINGS);
        const pub = require('../bot/clients').publicClient(interaction.client);
        let note = null;
        if (verb === 'lift') {
            const had = await spam.liftPenalty(arg, { client: pub });
            note = `-# ${BOT_EMOJI.checkmark} ${had ? 'Lifted, its note deleted,' : 'Nothing running;'} and today's rung forgotten.`;
        } else if (verb === 'exempt' || verb === 'unexempt') {
            // Exempting lifts a running penalty too: the point of it is that they are never silenced.
            if (verb === 'exempt') await spam.liftPenalty(arg, { client: pub });
            note = await saved(() => controls.setFlag('exemptUsers', arg, verb === 'exempt'), verb === 'exempt' ? 'Exempt: never scored or penalised.' : 'No longer exempt.');
        } else if (verb === 'block' || verb === 'unblock') {
            if (verb === 'block') await spam.liftPenalty(arg, { client: pub });
            note = await saved(() => controls.setFlag('blockedUsers', arg, verb === 'block'), verb === 'block' ? 'Blocked: Dioreo ignores their typed commands and answers their slash commands with one private line.' : 'Unblocked.');
        }
        return sendV2Payload(interaction, bot.buildPenaltyUserPanel(interaction.client, arg, { note }), NO_PINGS);
    }

    // /bot servers' Reply Limits pop-up.
    if (interaction.isModalSubmit() && customId.startsWith('bot_srvlim|')) {
        const { isOwner } = require('../utils/adminAccess');
        if (!isOwner(interaction.user.id)) {
            return await interaction.reply({ content: "🔒 **Only the bot owner can change another server's settings.**", ephemeral: true });
        }
        const guildId = customId.split('|')[1];
        if (!/^\d{15,22}$/.test(guildId || '')) return;
        const controls = require('../utils/botControls');
        const parsed = controls.parseLimits({ perChannel: interaction.fields.getTextInputValue('perChannel'), perServer: interaction.fields.getTextInputValue('perServer') });
        if (parsed.error) return await interaction.reply({ content: `${BOT_EMOJI.cross} ${parsed.error}`, ephemeral: true });
        let note;
        try {
            await controls.setLimits(guildId, parsed.limits);
            note = `-# ${BOT_EMOJI.checkmark} Reply limits saved.`;
        } catch (err) {
            console.error('Bot controls: could not save:', err?.message || err);
            note = `-# ${BOT_EMOJI.cross} Applied for now, but it could not be saved, so a restart undoes it.`;
        }
        await interaction.deferUpdate();
        const { buildServersPanel } = require('../commands/bot');
        const { sendV2Payload } = require('../utils/sendV2Payload');
        return sendV2Payload(interaction, await buildServersPanel(interaction.client, guildId, { note }), { allowedMentions: { parse: [] } });
    }

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
        const { hasManagePageAccess, can } = require('../utils/adminAccess');
        const row = await getChange(changeId);
        // Any tier on the change's page opens its detail, and the Changes page itself must be held too: the detail panel is part of that page.
        if (!row || !(await can(interaction.user.id, 'bot.changes')) || !(await hasManagePageAccess(interaction.user.id, row.page))) {
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
        const { checkRevert, can } = require('../utils/adminAccess');
        const row = await getChange(changeId);
        if (!row) return await interaction.reply({ content: BOT_EMOJI.cross + ' That change no longer exists.', ephemeral: true });
        // Revert needs the Undo tier (core/permissions.js's UNDO_TIER, Destructive) on the change's OWN page, plus the Changes page the button sits on. core/changeset.js's commitSet re-runs the same checkRevert, so this early check only exists to answer before deferring.
        const gate = await checkRevert(interaction.user.id, row);
        if (!gate.ok || !(await can(interaction.user.id, 'bot.changes'))) {
            return await interaction.reply({ content: gate.ok ? "🔒 **You don't have permission for the Changes page.**" : gate.reason, ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        const { revertChange } = require('../core/revert');
        const result = await revertChange(changeId, { actorId: interaction.user.id });
        if (!result.ok) {
            return await interaction.followUp({ content: `${BOT_EMOJI.cross} ${result.reason}` });
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
            return interaction.reply({ content: BOT_EMOJI.cross + ' That admin no longer exists (they may have just been revoked).', ephemeral: true });
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
            content: `${BOT_EMOJI.warn} **Revoke admin access from <@${discordId}>?** This cannot be undone (they can always be re-granted).`,
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
            await respondText(interaction, `${BOT_EMOJI.checkmark} Revoked admin access from <@${discordId}>.`);
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
        const { isOwner, invalidateAdminCache } = require('../utils/adminAccess');
        const { parseGrantsInput, formatGrants } = require('../core/permissions');
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: '🔒 **Only the bot owner can manage the admin list.**', ephemeral: true });
        }
        const rawId = interaction.fields.getTextInputValue('discord_id').trim();
        // ⚠️ THIS WRITES `note` AND NOT `title`, AND THAT IS CORRECT RATHER THAN A GAP. The portal split the single free-text label into a public `title` (what its Access grid prints) and a private `note` on 2026-09-11; every reader falls back to `title || note`, so an admin granted from here shows their note on the grid until somebody gives them a title in the portal's Edit drawer. Adding a second modal field to this panel is a separate decision about a surface that was not in scope.
        const note = interaction.fields.getTextInputValue('note')?.trim() || '';
        const discordId = rawId.replace(/[<@!>]/g, '');
        if (!/^\d{17,20}$/.test(discordId)) {
            return interaction.reply({ content: `${BOT_EMOJI.cross} "${rawId}" doesn't look like a valid Discord user ID or mention.`, ephemeral: true });
        }
        const parsed = parseGrantsInput(interaction.fields.getTextInputValue('permissions'));
        if (!parsed.ok) {
            return interaction.reply({ content: `${BOT_EMOJI.cross} ${parsed.error}`, ephemeral: true });
        }
        const { grants } = parsed;
        await interaction.deferReply({ ephemeral: true });
        const AdminUser = require('../models/AdminUser');
        const { recordChange } = require('../utils/changeStore');
        // `permissions: []` clears any legacy token list on a re-grant, so the row reads by its grants alone (utils/adminAccess.js only falls back to `permissions` when `grants` is empty).
        await AdminUser.findOneAndUpdate(
            { discordId },
            { $set: { discordId, grantedBy: interaction.user.id, grantedAt: new Date(), note, grants, permissions: [] } },
            { upsert: true },
        );
        invalidateAdminCache();
        recordChange({ actorId: interaction.user.id, page: 'access', action: 'grant', model: 'AdminUser', target: discordId, summary: `Granted admin access to <@${discordId}> — ${formatGrants(grants)}` });
        // editReply, not followUp (v3-pre-release review, finding #7) -- followUp posts a NEW message (leaving the deferReply({ephemeral:true}) placeholder hanging forever) and, with no ephemeral flag of its own, lands publicly -- disclosing who holds bot admin and at what scope to the whole channel.
        return interaction.editReply({ content: `${BOT_EMOJI.checkmark} Granted admin access to <@${discordId}> — ${formatGrants(grants)}.${note ? ` (${note})` : ''}`, allowedMentions: { parse: [] } });
    }

    if (interaction.isModalSubmit() && customId.startsWith('bot_adminmodal_editperms_')) {
        const { isOwner, invalidateAdminCache } = require('../utils/adminAccess');
        const { parseGrantsInput, formatGrants } = require('../core/permissions');
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: '🔒 **Only the bot owner can manage the admin list.**', ephemeral: true });
        }
        const discordId = customId.replace('bot_adminmodal_editperms_', '');
        const parsed = parseGrantsInput(interaction.fields.getTextInputValue('permissions'));
        if (!parsed.ok) {
            return interaction.reply({ content: `${BOT_EMOJI.cross} ${parsed.error}`, ephemeral: true });
        }
        const { grants } = parsed;
        await interaction.deferReply({ ephemeral: true });
        const AdminUser = require('../models/AdminUser');
        const { recordChange } = require('../utils/changeStore');
        const updated = await AdminUser.findOneAndUpdate({ discordId }, { $set: { grants, permissions: [] } }, { new: true });
        if (!updated) {
            return interaction.editReply({ content: BOT_EMOJI.cross + ' That admin no longer exists (they may have just been revoked).' });
        }
        invalidateAdminCache();
        recordChange({ actorId: interaction.user.id, page: 'access', action: 'edit', model: 'AdminUser', target: discordId, summary: `Updated <@${discordId}>'s permissions — ${formatGrants(grants)}` });
        return interaction.editReply({ content: `${BOT_EMOJI.checkmark} Updated <@${discordId}>'s permissions — ${formatGrants(grants)}.`, allowedMentions: { parse: [] } });
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleBotInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleBotInteraction, OWNED_PREFIXES };
