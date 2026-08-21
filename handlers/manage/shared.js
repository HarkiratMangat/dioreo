// ==========================================
// /manage — SHARED HELPERS & CROSS-PAGE STORES
// ==========================================
// Everything the /manage panel's pages have in common: the undo store, the pending-confirmation token maps, the cross-group search/pick resolvers, and the `prompt()` render helper. Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/ 2026-08-14-manage-slash-decomposition-design.md) — see handlers/manage/index.js for the thin dispatcher that reads from here, and the per-page modules for everything that ISN'T shared.
//
// ⚠️ THE STORES BELOW ARE MODULE-LEVEL AND MANAGE-PRIVATE, same as before the split. They rely on Node caching this module so exactly one instance exists -- require it by exactly one path (`./shared` from inside handlers/manage/, never a relative path that resolves differently).

const { randomUUID } = require('crypto');

// ==========================================
// CUSTOM_ID PARSING
// ==========================================
// Splits an `mng_act_`/`mng_search_`/`mng_pick_` custom_id's remainder (after that prefix is stripped) into [group, action] on the LAST underscore, not a naive `.split('_')` -- some group keys contain their own underscore (`loadouts_mp`, `loadouts_dmz`), and every action id is deliberately kept underscore-free (camelCase, e.g. `bulkadd`) specifically so this split stays unambiguous.
function parseMngId(raw) {
    const idx = raw.lastIndexOf('_');
    return [raw.slice(0, idx), raw.slice(idx + 1)];
}

// ==========================================
// PROMPT -- the V2 replacement for raw interaction.update() (added stage 2, 2026-08-14)
// ==========================================
// Every confirm/cancel/undo micro-prompt in this panel used to call discord.js's raw `interaction.update({content, components})` directly -- a legacy, non-V2 shape that never flowed through sendV2Payload, so none of these ~25 call sites got passive-expiry instrumentation (see utils/sendV2Payload.js's former header note, and handlers/router.js's cancel-never-reschedule safety net, both retired in this same change). sendV2Payload's un-acked branch already POSTs a type:7 UPDATE_MESSAGE as the interaction's first response when it hasn't been deferred/replied yet -- exactly what `interaction.update()` does at the Discord API level -- so swapping the call site is a straight behavioral no-op that also gets the message scheduled/rescheduled for free. `text` becomes a single Text Display (type 10); Components V2 doesn't have a plain `content` field.
function prompt(interaction, { text = '', components = [] } = {}) {
    const { sendV2Payload } = require('../../utils/sendV2Payload');
    const body = [];
    if (text) body.push({ type: 10, content: text });
    body.push(...components);
    return sendV2Payload(interaction, body);
}

// ==========================================
// PENDING-CONFIRMATION TOKEN MAPS
// ==========================================
// The old in-memory Undo store (the mng_undo_ button and its supporting functions) lived here until plan 2 Task 7 retired it -- every entity now routes through the operation core, and undo lives permanently on /bot analytics' Changes page instead (core/revert.js). Pending "Start New Season" confirmations (2026-07-12) -- holds the entered title between the modal submit and the Confirm/Cancel click. See season.js's promptWipeSeason/handleWipeButton.
const pendingSeasonWipes = new Map(); // token -> { newTitle }

// Pending single-item Delete confirmations (2026-07-12) -- holds the already-resolved { group, match } between resolveManagePanelAction's confirm prompt and index.js's mng_delconfirm_/mng_delcancel_ dispatch.
const pendingManageDeletes = new Map(); // token -> { group, match }

// Pending single-match Edit confirmations (2026-07-12) -- Discord's API can't respond to a MODAL_SUBMIT interaction with another modal, so a single Edit match needs one intermediate button click (which CAN open a modal) before resolveManagePanelAction's showModal() call is reached. See handleSearchSubmit / handleEditButton below.
const pendingManageEdits = new Map(); // token -> { group, match }

// Pending Bulk Delete confirmations (draws/calendar/loadouts, 2026-07-12) -- holds the DRY-RUN result (what WOULD be removed, computed but not yet saved) plus an `apply()` that performs the actual save and registers its own Undo snapshot, between a page module's modal-submit confirm prompt and index.js's mng_bulkdelconfirm_/mng_bulkdelcancel_ dispatch.
const pendingBulkDeletes = new Map(); // token -> { description, summary, apply: async () => undoToken }

// The token-mint -> pendingBulkDeletes.set -> 10-min unref'd expiry -> Confirm/Cancel reply shape every bulk-delete modal-submit branch repeated verbatim (v3-pre-release review, finding #37) -- draws.js/calendar.js/loadouts.js, ~22 lines each, differing only in `description`. Returns the same reply the three callers used to build by hand, so `return registerBulkDelete(interaction, {...})` is a drop-in replacement for their old trailing block.
function registerBulkDelete(interaction, { description, summary, apply }) {
    const token = randomUUID().slice(0, 8);
    pendingBulkDeletes.set(token, { description, summary, apply });
    setTimeout(() => pendingBulkDeletes.delete(token), 10 * 60 * 1000).unref();
    return interaction.reply({
        content: `⚠️ **Confirm Bulk Delete?**\n${summary.join('\n')}`,
        components: [{
            type: 1, components: [
                { type: 2, style: 4, label: 'Yes, Delete', custom_id: `mng_bulkdelconfirm_${token}` },
                { type: 2, style: 2, label: 'Cancel', custom_id: `mng_bulkdelcancel_${token}` }
            ]
        }],
        ephemeral: true
    });
}

// ==========================================
// DRAW THUMBNAIL RESOLUTION (2026-07-12)
// ==========================================
// Shared by every bulk draw-save route (single add/edit uses resolveThumbnail directly, since there's only ever one draw to resolve). Runs every parsed draw's thumbnailUrl through resolveThumbnail() concurrently -- a draw with no provided URL AND no existing cache hit has nothing to show and is dropped from the batch entirely (reported back as "skipped", not silently discarded) rather than saved with a broken/undefined image field.
function thumbnailNote(thumbResult) {
    if (thumbResult.error) return `⚠️ Cloudinary caching failed, kept the original URL instead: ${thumbResult.error}`;
    if (thumbResult.reused && thumbResult.matchedTitle) return `ℹ️ Thumbnail reused from a similarly-named cached draw: "${thumbResult.matchedTitle}"`;
    return null;
}

// Moved to utils/bulkMerge.js (2026-08-20 23:42 EDT, portal core Task 6) so core/ops/draws.js can share the SAME real merge semantics instead of a divergent copy -- re-exported here so no existing call site in this directory needs to change. See that file's header for the story. (upsertDrawsByTitle/upsertEventsByTitle -- dead aliases nothing called by those names -- removed 2026-08-21.)
const { resolveThumbnailsForDraws, upsertByTitle } = require('../../utils/bulkMerge');

// Subtractive counterpart to upsertByTitle -- fuzzy-matches each pasted title against `array`, removing the first match and reporting anything not found. (v3-pre-release review, finding #40 -- was copy-pasted twice, once as a local closure in draws.js and once inline in calendar.js.)
function removeByTitle(array, titlesRaw) {
    const { fuzzyMatch } = require('../../utils/search');
    const requested = titlesRaw.split('\n').map(t => t.trim()).filter(Boolean);
    const removed = [];
    const ids = [];
    const notFound = [];
    let remaining = array;
    for (const title of requested) {
        const match = remaining.find(item => fuzzyMatch(title, item.title));
        if (match) {
            removed.push(match.title);
            ids.push(String(match._id));
            remaining = remaining.filter(item => item !== match);
        } else {
            notFound.push(title);
        }
    }
    return { removed, ids, notFound };
}

// The `result.failures?.[0]?.errors?.join(' ') || result.error` shape was duplicated ~31x across every entity handler in this directory -- one place to read a commitSet failure's human-readable reason.
function extractCommitError(result) {
    return result.failures?.[0]?.errors?.join(' ') || result.error;
}

// ==========================================
// SHARED SEASONAL-DATA FETCH
// ==========================================
// Every draws/calendar/patchnotes/season branch operates on the one global SeasonalData doc. Creates an unsaved in-memory doc on a fresh install (no doc yet) rather than throwing -- the branch that calls this always populates and .save()s it. Loadouts never calls this (Loadout is its own top-level collection, not a field on SeasonalData).
async function loadOrCreateSeasonalDoc() {
    const SeasonalData = require('../../models/SeasonalData');
    let seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
    if (!seasonalDoc) seasonalDoc = new SeasonalData({ docType: 'global' });
    return seasonalDoc;
}

// ==========================================
// SEARCH RESOLUTION (Edit/Delete) -- 2026-07-09 button/modal redesign
// ==========================================
// Edit/Delete on the /manage panel can't autocomplete like a slash-command option could (they're plain buttons), so they collect a search query through a one-field modal instead and resolve it here via the same fuzzyMatch() convention every other admin-search route in the bot uses. Returns up to 25 `{ id, label, doc, type? }` matches -- `type` ('new'/'returning') only applies to draws, since those live in two separate arrays on one document.
async function resolveManagePanelMatches(group, rawQuery) {
    const { fuzzyMatch } = require('../../utils/search');
    const query = rawQuery.trim();

    if (group === 'draws') {
        const SeasonalData = require('../../models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        if (!seasonalDoc) return [];
        const tagged = [
            ...seasonalDoc.newDraws.map(doc => ({ doc, type: 'new' })),
            ...seasonalDoc.returningDraws.map(doc => ({ doc, type: 'returning' }))
        ];
        // Matches against the draw's TITLE or any of its item names (weapons/characters/emotes) -- searching "fss hurricane" or "charioteer" should find the draw those items are actually IN, not just a draw literally titled that.
        return tagged.filter(t => fuzzyMatch(query, t.doc.title) || t.doc.items.some(item => fuzzyMatch(query, item.name)))
            .slice(0, 25).map(t => ({
                id: t.doc._id.toString(), type: t.type, doc: t.doc,
                label: `${t.doc.title} (${t.type === 'new' ? 'New' : 'Returning'})`
            }));
    }

    if (group === 'calendar') {
        const SeasonalData = require('../../models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        if (!seasonalDoc) return [];
        return seasonalDoc.calendar.filter(e => fuzzyMatch(query, e.title)).slice(0, 25)
            .map(e => ({ id: e._id.toString(), doc: e, label: e.title }));
    }

    // Loadouts is two separate panel pages (MP/DMZ) instead of one combined group -- scope the search to whichever mode the page/group encodes rather than searching both.
    if (group === 'loadouts_mp' || group === 'loadouts_dmz') {
        // loadoutModeFor, not a re-derived ternary (v3-pre-release review, finding #41).
        const { loadoutModeFor } = require('../../utils/manageActions');
        const mode = loadoutModeFor(group);
        const Loadout = require('../../models/Loadout');
        const modeLoadouts = await Loadout.find({ mode }).lean();
        return modeLoadouts.filter(l => fuzzyMatch(query, l.weaponName) || fuzzyMatch(query, l.buildName)).slice(0, 25)
            .map(l => ({ id: l._id.toString(), doc: l, label: `${l.weaponName} - ${l.buildName}` }));
    }

    // Patch Notes has no search-based edit/delete flow -- it operates on a single "current entry" instead (see patchnotes.js), so this group is intentionally absent here.
    return [];
}

// Given one resolved match (single fuzzy hit, or a disambiguation-select pick), either chains straight into the real edit modal -- `showModal` is valid as the FIRST response to a modal-submit or select-menu interaction too, not just a button -- or performs the delete directly and confirms. Shared by the single-match fast path in handleSearchSubmit and the mng_pick_ disambiguation-select handler (handlePick), both below.
async function resolveManagePanelAction(interaction, group, action, match) {
    const manageCommand = interaction.client.commands.get('manage');

    if (action === 'edit') {
        if (group === 'draws') return interaction.showModal(manageCommand.buildEditDrawModal(match.doc, match.id, match.type));
        if (group === 'calendar') return interaction.showModal(manageCommand.buildEditCalendarModal(match.doc, match.id));
        if (group === 'loadouts_mp' || group === 'loadouts_dmz') return interaction.showModal(manageCommand.buildEditLoadoutModal(match.doc, match.id));
    }

    if (action === 'delete') {
        // 2-step confirm -- stashes the resolved match in pendingManageDeletes and shows the same Confirm/Cancel pattern Purge already uses -- the actual delete only happens from index.js's mng_delconfirm_ dispatch. Both a modal-submit interaction and a select-menu interaction (mng_pick_ never deferUpdate()s before reaching here) can answer with a plain reply -- neither has been acknowledged yet at this point.
        const token = randomUUID().slice(0, 8);
        pendingManageDeletes.set(token, { group, match });
        setTimeout(() => pendingManageDeletes.delete(token), 10 * 60 * 1000).unref();

        return interaction.reply({
            content: `⚠️ **Are you sure you want to delete ${match.label}?** You'll get an Undo button right after, in case you change your mind.`,
            components: [{
                type: 1, components: [
                    { type: 2, style: 4, label: 'Yes, Delete', custom_id: `mng_delconfirm_${token}` },
                    { type: 2, style: 2, label: 'Cancel', custom_id: `mng_delcancel_${token}` }
                ]
            }],
            ephemeral: true
        });
    }
}

// ==========================================
// GENERIC PANEL RENDER (mng_pagesel)
// ==========================================
// Page switching itself is a select menu, not a row of nav buttons, since a button row caps out at 5 and this panel has more sections than that. Selecting Season doesn't render a page at all -- Season has no key in PAGES (see commands/manage.js); its two actions each open their modal directly on selection instead.
async function renderManagePage(interaction) {
    const targetPage = interaction.values[0];
    const manageCommand = interaction.client.commands.get('manage');

    // Re-checked here even though the dropdown itself only ever OFFERS pages this user is allowed on, for the same defense-in-depth reasoning as every other re-check in this handler: a stale panel message from before a permission change could still carry an option no longer theirs.
    const { getManagePages } = require('../../utils/adminAccess');
    const allowedPages = await getManagePages(interaction.user.id);
    // DENIAL_MESSAGE.denied, not a restated copy (v3-pre-release review, finding #43) -- three variants of this one string existed; a scoped admin got different guidance depending on which of the three paths denied them for the identical reason.
    const { DENIAL_MESSAGE } = require('../../utils/manageActions');
    const deniedReply = { content: DENIAL_MESSAGE.denied, ephemeral: true };

    if (targetPage === 'season_titlesdeadlines') {
        if (!allowedPages.includes('season')) return interaction.reply(deniedReply);
        const SeasonalData = require('../../models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        return await interaction.showModal(manageCommand.buildSeasonTitlesDeadlinesModal(seasonalDoc));
    }
    if (targetPage === 'season_wipe') {
        if (!allowedPages.includes('season')) return interaction.reply(deniedReply);
        return await interaction.showModal(manageCommand.buildWipeSeasonModal());
    }
    if (targetPage !== 'guide' && !allowedPages.includes(targetPage)) {
        return interaction.reply(deniedReply);
    }

    await interaction.deferUpdate();
    const { sendV2Payload } = require('../../utils/sendV2Payload');

    // manageCommand.buildDynamicData(), not a hand-rolled table (v3-pre-release review, finding #44) -- see commands/manage.js's own comment on this function for why the duplication mattered.
    const dynamicData = await manageCommand.buildDynamicData(targetPage);
    return sendV2Payload(interaction, manageCommand.buildManagePage(targetPage, dynamicData, interaction.client, allowedPages));
}

// Bulk Format Guide's own topic-switcher dropdown (utils/manageGuides.js) -- re-renders the SAME guide message in place, same deferUpdate + sendV2Payload shape as renderManagePage above, just editing a standalone guide message instead of the panel.
async function renderGuidePick(interaction) {
    const { buildGuideContainer } = require('../../utils/manageGuides');
    await interaction.deferUpdate();
    const { sendV2Payload } = require('../../utils/sendV2Payload');
    return sendV2Payload(interaction, buildGuideContainer(interaction.values[0]));
}

// ==========================================
// DISAMBIGUATION SELECT (mng_pick_)
// ==========================================
// Shown by handleSearchSubmit when a search query matched more than one item. Looks the pick up directly by _id (encoded in the option value, `|type` appended for draws since those need to know which of the two arrays they came from) rather than re-running the fuzzy search, then hands off to resolveManagePanelAction above -- same shape as resolveManagePanelMatches, spanning all groups in one function since the lookup-by-id is the same shape across draws/calendar/loadouts.
async function handlePick(interaction) {
    const [group, action] = parseMngId(interaction.customId.replace('mng_pick_', ''));
    const [id, type] = interaction.values[0].split('|');

    let match = null;
    if (group === 'draws') {
        const SeasonalData = require('../../models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        const doc = type === 'new'
            ? seasonalDoc.newDraws.find(d => d._id.toString() === id)
            : seasonalDoc.returningDraws.find(d => d._id.toString() === id);
        if (doc) match = { id, type, doc, label: `${doc.title} (${type === 'new' ? 'New' : 'Returning'})` };
    } else if (group === 'calendar') {
        const SeasonalData = require('../../models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        const doc = seasonalDoc.calendar.find(e => e._id.toString() === id);
        if (doc) match = { id, doc, label: doc.title };
    } else if (group === 'loadouts_mp' || group === 'loadouts_dmz') {
        const Loadout = require('../../models/Loadout');
        const doc = await Loadout.findById(id).lean();
        if (doc) match = { id, doc, label: `${doc.weaponName} - ${doc.buildName}` };
    }

    if (!match) {
        try {
            await prompt(interaction, { text: '❌ That item no longer exists -- it may have been changed or removed since you searched.' });
        } catch (notifyError) {
            console.error('Failed to notify user of stale manage-panel pick (interaction likely expired):', notifyError);
        }
        return;
    }

    return await resolveManagePanelAction(interaction, group, action, match);
}

// ==========================================
// SEARCH MODAL SUBMIT (mng_search_)
// ==========================================
async function handleSearchSubmit(interaction) {
    const [group, action] = parseMngId(interaction.customId.replace('mng_search_', ''));
    const query = interaction.fields.getTextInputValue('query');
    const matches = await resolveManagePanelMatches(group, query);

    // "Search Again" button -- re-opens the same search modal from THIS reply, so a second search doesn't require scrolling back up to the original panel message.
    const searchAgainRow = { type: 1, components: [{ type: 2, style: 2, label: 'Search Again', custom_id: `mng_act_${group}_${action}` }] };

    if (matches.length === 0) {
        return interaction.reply({ content: `❌ No matches found for "${query}".`, components: [searchAgainRow], ephemeral: true });
    }

    // Discord's API does not allow responding to a MODAL_SUBMIT interaction with another modal at all (`ModalSubmitInteraction.prototype.showModal` is `undefined` in discord.js v14.26.4, unlike Button/StringSelectMenu interactions). So a single match resolved straight from THIS search modal can never chain into resolveManagePanelAction's showModal() call for Edit -- it needs one extra click through a button first, stashed in pendingManageEdits. Delete is unaffected -- it replies with a plain Confirm/Cancel message, which modal-submit interactions CAN do.
    if (matches.length === 1) {
        if (action !== 'edit') {
            return await resolveManagePanelAction(interaction, group, action, matches[0]);
        }
        const token = randomUUID().slice(0, 8);
        pendingManageEdits.set(token, { group, match: matches[0] });
        setTimeout(() => pendingManageEdits.delete(token), 10 * 60 * 1000).unref();
        return interaction.reply({
            content: `🔎 Found **${matches[0].label}** -- click below to edit:`,
            // Edit + Search Again share ONE action row -- only valid for this single-match case: the multi-match case below can't inline them because a select menu must occupy its own row.
            components: [
                { type: 1, components: [
                    { type: 2, style: 1, label: 'Edit', custom_id: `mng_editbtn_${token}` },
                    ...searchAgainRow.components
                ] }
            ],
            ephemeral: true
        });
    }

    // Multiple matches -- disambiguate via a select menu rather than guessing which one was meant. A select-menu interaction DOES support showModal() directly (unlike modal-submit, above), so Edit's mng_pick_ handler doesn't need the same button detour -- only the single-match-straight- from-a-modal-submit case does.
    const options = matches.map(m => ({
        label: m.label.slice(0, 100),
        value: group === 'draws' ? `${m.id}|${m.type}` : m.id
    }));
    return interaction.reply({
        content: `🔎 Found **${matches.length}** matches for "${query}" -- pick one:`,
        components: [
            { type: 1, components: [{ type: 3, custom_id: `mng_pick_${group}_${action}`, placeholder: 'Select one...', options }] },
            searchAgainRow
        ],
        ephemeral: true
    });
}

// ==========================================
// EDIT CONFIRM BUTTON (mng_editbtn_)
// ==========================================
// The intermediate "Edit: {label}" click. A single Edit search match can't open the edit modal straight from the search MODAL-SUBMIT interaction (see handleSearchSubmit's comment on why), so the search reply hands out this button, and THIS button click (which CAN showModal()) opens it.
async function handleEditButton(interaction) {
    const token = interaction.customId.replace('mng_editbtn_', '');
    const pending = pendingManageEdits.get(token);
    pendingManageEdits.delete(token);
    if (!pending) {
        await interaction.reply({ content: '❌ This has expired -- please search again.', ephemeral: true });
        return;
    }
    return await resolveManagePanelAction(interaction, pending.group, 'edit', pending.match);
}

module.exports = {
    parseMngId,
    prompt,
    pendingSeasonWipes,
    pendingManageDeletes,
    pendingManageEdits,
    pendingBulkDeletes,
    registerBulkDelete,
    loadOrCreateSeasonalDoc,
    thumbnailNote,
    resolveThumbnailsForDraws,
    removeByTitle,
    extractCommitError,
    resolveManagePanelMatches,
    resolveManagePanelAction,
    renderManagePage,
    renderGuidePick,
    handlePick,
    handleSearchSubmit,
    handleEditButton
};
