// ==========================================
// /manage — ADMIN PANEL DISPATCHER
// ==========================================
// The thin entry point for the /manage subsystem. `require('./manage')` resolves `./manage.js` first and `./manage/index.js` second, so this directory replacing the old handlers/manage.js keeps handlers/router.js's require('./manage') unchanged. Split out of the former 2,416-line handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/ 2026-08-14-manage-slash-decomposition-design.md): OWNED_PREFIXES + ownsCustomId + handleManageInteraction stay here; every truly cross-page helper lives in ./shared, and each page's own DB-mutating logic lives in ./draws, ./calendar, ./loadouts, ./patchnotes, ./season, ./admins, ./announcements. This file's job is customId parsing and delegation, nothing else.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. handleManageInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do NOT add one here, do NOT register listeners, and keep every error-branch reply an AWAITED call inside its own small try/catch. See .claude/rules/interaction-router.md.
//
// ⚠️ THE ADMIN GUARD IS NOT HERE AND MUST NOT BE COPIED HERE. Who may click these lives at ONE choke point in the router, above this dispatch (utils/adminAccess.js). This handler assumes that check already passed.

const {
    parseMngId, prompt,
    pendingManageDeletes, pendingBulkDeletes,
    renderManagePage, renderGuidePick, handlePick, handleSearchSubmit, handleEditButton
} = require('./shared');
const draws = require('./draws');
const calendar = require('./calendar');
const loadouts = require('./loadouts');
const patchnotes = require('./patchnotes');
const season = require('./season');
const announcements = require('./announcements');
const { buildRetryModal } = require('./retry');

// The same prefix set the router's admin guard keys its per-command permission map on. Kept as one list so the two can be compared by eye; if a new manage prefix is ever added, it belongs in BOTH.
const OWNED_PREFIXES = ['mng_', 'modal_', 'add_loadout_', 'edit_loadout_', 'edit_calendar_', 'edit_draw_', 'add_draw_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

// Which page module's purge()/deleteItem() a group's mng_purgeconfirm_/mng_delconfirm_ dispatches to. Loadouts has no purge (no Purge button on either page -- see .claude/rules/manage-panel.md). actorId threaded through every wrapper (v3-pre-release review, finding #25) -- every one of these six page-module functions declares an actorId parameter, but these arrow wrappers dropped it, so every purge and delete wrote its ChangeLog row with actorId: undefined -- /bot analytics -> Changes showed every add/edit/bulk correctly attributed and every purge/delete attributed to nobody, permanently, for the seven most destructive operations in the panel.
const PURGE_HANDLERS = {
    draws: (scope, actorId) => draws.purgeDraws(scope, actorId),
    calendar: (scope, actorId) => calendar.purge(actorId),
    patchnotes: (scope, actorId) => patchnotes.purge(actorId)
};
const DELETE_HANDLERS = {
    draws: (match, actorId) => draws.deleteDraw(match, actorId),
    calendar: (match, actorId) => calendar.deleteItem(match, actorId),
    loadouts_mp: (match, actorId) => loadouts.deleteItem(match, actorId),
    loadouts_dmz: (match, actorId) => loadouts.deleteItem(match, actorId)
};

async function routeManage(interaction) {
    if (interaction.isStringSelectMenu()) {
        // MANAGE PANEL PAGE SELECT -- a select menu (not a row of nav buttons) since the panel has more sections than a button row's 5-cap allows.
        if (interaction.customId === 'mng_pagesel') return await renderManagePage(interaction);

        // Bulk Format Guide's own topic-switcher dropdown.
        if (interaction.customId === 'mng_guide_pick') return await renderGuidePick(interaction);

        // MANAGE PANEL DISAMBIGUATION SELECT -- shown by handleSearchSubmit when a search query matched more than one item.
        if (interaction.customId.startsWith('mng_pick_')) return await handlePick(interaction);

        // Patch Notes' own "Past Seasons" select -- its options ARE the full list already, so picking one goes straight to its edit modal, no search step.
        if (interaction.customId === 'mng_patchseason_pick') return await patchnotes.handlePatchSeasonPick(interaction);
    }

    if (interaction.isButton()) {
        const customId = interaction.customId;

        // MANAGE PANEL -- action buttons, resolved through the registry (utils/manageActions.js). resolveAction() is also where per-page permissions are enforced PER CLICK -- see that module's header comment. router.js's prefix guard still runs first and independently -- that one answers "may this user touch /manage at all", this one answers "may they touch THIS page". Keep both.
        if (customId.startsWith('mng_act_')) {
            const [group, action] = parseMngId(customId.replace('mng_act_', ''));
            const { resolveAction, DENIAL_MESSAGE } = require('../../utils/manageActions');
            const resolved = await resolveAction(group, action, interaction.user.id);
            if (!resolved.ok) {
                require('../../utils/eventStore').markOutcome('rejected_admin');
                return await interaction.reply({ content: DENIAL_MESSAGE[resolved.reason], ephemeral: true });
            }
            // Every action decides its own response mode (see the registry's `kind` note) -- nothing is deferred here, because a modal-opening action needs showModal() to be the FIRST response and cannot follow a deferReply().
            return await resolved.entry.run({
                interaction,
                page: group,
                manageCommand: interaction.client.commands.get('manage')
            });
        }

        // PURGE CONFIRM / CANCEL -- the second step of the two-tap confirmation the registry's 'confirm' kind opens. Each group purges only its OWN data.
        if (customId.startsWith('mng_purgeconfirm_')) {
            const [group, scope] = parseMngId(customId.replace('mng_purgeconfirm_', ''));
            // Per-page permission re-check (v3-pre-release review, finding #8) -- resolveAction (the registry's documented "ONE choke point") only guards the FIRST click, the mng_act_ that opened this confirmation. Up to 10 minutes can pass before this second click, and an owner narrowing a scoped admin's grant in that window went unnoticed: the purge still ran against a page the admin no longer has, because nothing past the first click re-checked utils/adminAccess.js's getManagePages().
            const { getManagePages } = require('../../utils/adminAccess');
            const allowedPages = await getManagePages(interaction.user.id);
            if (!allowedPages.includes(group)) {
                require('../../utils/eventStore').markOutcome('rejected_admin');
                try {
                    await prompt(interaction, { text: "🔒 **You don't have access to that section anymore.** Nothing was deleted." });
                } catch (notifyError) {
                    console.error('Failed to notify user of a revoked manage-panel purge (interaction likely expired):', notifyError);
                }
                return;
            }
            const handler = PURGE_HANDLERS[group];
            // Loud on a missing handler, not a silent empty purge (v3-pre-release review, finding #27) -- an unmapped group used to yield confirmMsg:'', which prompt() drops as empty text, sending an empty V2 body Discord rejects -- the admin saw a dead "Yes, Purge" button with no statement either way.
            if (!handler) throw new Error(`No PURGE_HANDLERS entry registered for group "${group}"`);
            const result = await handler(scope, interaction.user.id);
            try {
                await prompt(interaction, { text: result.confirmMsg });
            } catch (notifyError) {
                console.error(`Failed to confirm manage-panel purge for ${group} (interaction likely expired):`, notifyError);
            }
            return;
        }
        if (customId.startsWith('mng_purgecancel_')) {
            try {
                await prompt(interaction, { text: '❎ Purge cancelled -- nothing was deleted.' });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel purge cancellation (interaction likely expired):', notifyError);
            }
            return;
        }

        // ANNOUNCEMENT: per-item buttons (embed a Mongo _id, so they live outside mng_act_).
        if (customId.startsWith('mng_announce_')) return await announcements.handleButton(interaction);

        // NEXT SEASON DRAFT: Promote / Discard confirm-cancel.
        if (customId === 'mng_draftpromoteconfirm' || customId === 'mng_draftpromotecancel'
            || customId === 'mng_draftdiscardconfirm' || customId === 'mng_draftdiscardcancel') {
            return await season.handleDraftButton(interaction);
        }

        // START NEW SEASON: confirm-cancel for the Season dropdown's "Wipe Season" entry.
        if (customId.startsWith('mng_wipeconfirm_') || customId.startsWith('mng_wipecancel_')) {
            return await season.handleWipeButton(interaction);
        }

        // UNDO -- retired in plan 2 Task 7. Every entity routes through the operation core now; reverting a change permanently lives on /bot analytics' Changes page (core/revert.js) instead of a short-lived in-memory Undo button on the confirmation message itself.

        // SINGLE-ITEM DELETE CONFIRM / CANCEL -- second step of resolveManagePanelAction's delete branch (shared.js). Performs the actual deletion only from here, snapshotting the removed doc first so it can be undone.
        if (customId.startsWith('mng_delconfirm_')) {
            const token = customId.replace('mng_delconfirm_', '');
            const pending = pendingManageDeletes.get(token);
            pendingManageDeletes.delete(token);
            if (!pending) {
                try {
                    await prompt(interaction, { text: '❌ This confirmation has expired -- please search again.' });
                } catch (notifyError) {
                    console.error('Failed to notify user of expired delete confirmation:', notifyError);
                }
                return;
            }
            const { group, match } = pending;
            // Per-page permission re-check (v3-pre-release review, finding #8) -- same reasoning as the purge branch above: this is the second, destructive step of a two-tap confirmation, and the grant could have narrowed in the (up to 10-minute) window since the first tap opened it.
            const { getManagePages } = require('../../utils/adminAccess');
            const allowedPages = await getManagePages(interaction.user.id);
            if (!allowedPages.includes(group)) {
                require('../../utils/eventStore').markOutcome('rejected_admin');
                try {
                    await prompt(interaction, { text: "🔒 **You don't have access to that section anymore.** Nothing was deleted." });
                } catch (notifyError) {
                    console.error('Failed to notify user of a revoked manage-panel delete (interaction likely expired):', notifyError);
                }
                return;
            }
            const handler = DELETE_HANDLERS[group];
            // Loud on a missing handler, not a false "Deleted" (v3-pre-release review, finding #27) -- the moment a page gains a delete action without a map entry, the admin was told the record was deleted while it was untouched.
            if (!handler) throw new Error(`No DELETE_HANDLERS entry registered for group "${group}"`);
            await handler(match, interaction.user.id);
            try {
                await prompt(interaction, { text: `🗑️ **Deleted:** ${match.label}` });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel delete (interaction likely expired):', notifyError);
            }
            return;
        }
        if (customId.startsWith('mng_delcancel_')) {
            const token = customId.replace('mng_delcancel_', '');
            pendingManageDeletes.delete(token);
            try {
                await prompt(interaction, { text: '❎ Cancelled -- nothing was deleted.' });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel delete cancellation (interaction likely expired):', notifyError);
            }
            return;
        }

        // BULK DELETE CONFIRM / CANCEL -- fully generic: the modal-submit handler in each page module only computed WHAT would be removed (dry run); the actual save/delete calls happen here via the pending entry's own apply(), which also registers its own Undo snapshot.
        if (customId.startsWith('mng_bulkdelconfirm_')) {
            const token = customId.replace('mng_bulkdelconfirm_', '');
            const pending = pendingBulkDeletes.get(token);
            pendingBulkDeletes.delete(token);
            if (!pending) {
                try {
                    await prompt(interaction, { text: '❌ This confirmation has expired -- please submit the bulk delete again.' });
                } catch (notifyError) {
                    console.error('Failed to notify user of expired bulk-delete confirmation:', notifyError);
                }
                return;
            }
            try {
                await pending.apply();
                await prompt(interaction, {
                    text: `🗑️ **${pending.description} Complete!**\n${pending.summary.join('\n')}`
                });
            } catch (applyError) {
                console.error(`Failed to apply bulk delete (${pending.description}):`, applyError);
                try {
                    await prompt(interaction, { text: '❌ Something went wrong while deleting -- check the data manually.' });
                } catch (notifyError) {
                    console.error('Failed to notify user of bulk-delete apply failure:', notifyError);
                }
            }
            return;
        }
        if (customId.startsWith('mng_bulkdelcancel_')) {
            const token = customId.replace('mng_bulkdelcancel_', '');
            pendingBulkDeletes.delete(token);
            try {
                await prompt(interaction, { text: '❎ Cancelled -- nothing was deleted.' });
            } catch (notifyError) {
                console.error('Failed to confirm bulk-delete cancellation (interaction likely expired):', notifyError);
            }
            return;
        }

        // EDIT CONFIRM BUTTON (the intermediate "Edit: {label}" click) -- see shared.js's handleEditButton for why this extra click exists. Try Again on a failed modal submit (2026-08-22) -- see handlers/manage/retry.js. showModal() MUST be this button's first response, so nothing above may defer it, which is why this sits with the other modal-opening branches rather than after the deferring ones.
        if (customId.startsWith('mng_retry_')) {
            const modalJson = buildRetryModal(customId.replace('mng_retry_', ''));
            if (!modalJson) {
                return await interaction.reply({ content: '⌛ That retry expired (they last 10 minutes). Reopen the action from the `/manage` panel — the text in the message above is still copy-pasteable.', ephemeral: true });
            }
            return await interaction.showModal(modalJson);
        }
        if (customId.startsWith('mng_editbtn_')) return await handleEditButton(interaction);
    }

    if (interaction.isModalSubmit()) {
        const customId = interaction.customId;

        // MANAGE PANEL: SEARCH RESOLVER (Edit/Delete).
        if (customId.startsWith('mng_search_')) return await handleSearchSubmit(interaction);

        // SEASON (pseudo-page) + SEASON DRAFT
        if (customId === 'modal_wipe_season') return await season.promptWipeSeason(interaction);
        if (customId === 'modal_season_titles_deadlines') return await season.setTitlesDeadlines(interaction);
        if (customId === 'modal_draft_titles_dates') return await season.setDraftTitlesDeadlines(interaction);
        if (customId === 'modal_draft_bulk_draws') return await season.bulkDraftDraws(interaction);
        if (customId === 'modal_draft_bulk_calendar') return await season.bulkDraftCalendar(interaction);

        // ANNOUNCEMENT
        if (customId === 'modal_announce_post') return await announcements.postAnnouncement(interaction);
        if (customId.startsWith('modal_announce_edit_')) return await announcements.editAnnouncement(interaction);

        // DRAWS
        if (customId === 'modal_draws_bulk_add_both' || customId === 'modal_draws_bulk_replace_both') return await draws.bulkAddOrReplaceDraws(interaction);
        if (customId.startsWith('modal_draws_bulk_remove_')) return await draws.bulkDeleteDraws(interaction);
        if (customId.startsWith('edit_draw_')) return await draws.editDraw(interaction);
        if (customId === 'add_draw_new' || customId === 'add_draw_returning') return await draws.addDraw(interaction);

        // CALENDAR
        if (customId === 'modal_calendar_bulk_add' || customId === 'modal_calendar_bulk_replace') return await calendar.bulkAddOrReplaceCalendar(interaction);
        if (customId === 'modal_calendar_bulk_remove') return await calendar.bulkDeleteCalendar(interaction);
        if (customId === 'modal_calendar_add') return await calendar.addCalendarEvent(interaction);
        if (customId === 'modal_calendar_banners') return await calendar.setBanners(interaction);
        if (customId.startsWith('edit_calendar_')) return await calendar.editCalendarEvent(interaction);

        // PATCH NOTES
        if (customId === 'modal_patch_dateinfo') return await patchnotes.setDateInfo(interaction);
        if (customId === 'modal_patch_urls_1' || customId === 'modal_patch_urls_2') return await patchnotes.setUrls(interaction);
        if (customId === 'modal_patch_addseason') return await patchnotes.addSeason(interaction);
        if (customId.startsWith('modal_patch_editseason_')) return await patchnotes.editSeason(interaction);

        // LOADOUTS (MP + DMZ)
        if (customId.startsWith('edit_loadout_')) return await loadouts.editLoadout(interaction);
        if (customId.startsWith('add_loadout_')) return await loadouts.addLoadout(interaction);
        if (customId.startsWith('modal_loadouts_bulk_add_')) return await loadouts.bulkAddLoadouts(interaction);
        if (customId.startsWith('modal_loadouts_bulk_remove_')) return await loadouts.bulkDeleteLoadouts(interaction);
        if (customId.startsWith('modal_loadouts_export5_')) return await loadouts.exportUpTo5(interaction);
        if (customId.startsWith('modal_loadouts_exportcategory_')) return await loadouts.exportCategory(interaction);
    }
}

// Returns TRUE when this panel owns the interaction (and has now handled it), FALSE when it does not -- the same contract every handlers/*.js module follows, so the router dispatches them uniformly.
async function handleManageInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await routeManage(interaction);
    return true;
}

module.exports = { handleManageInteraction, OWNED_PREFIXES };
