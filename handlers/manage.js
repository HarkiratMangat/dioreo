// ==========================================
// /manage — ADMIN PANEL INTERACTION HANDLER
// ==========================================
// Every branch the /manage panel generates: its page select, its action buttons and confirmations,
// and every modal submit it opens. Lifted out of handlers/router.js on 2026-08-13 17:40 EDT as the
// second subsystem slice (docs/ROADMAP.md). At ~2,300 lines it was 56% of the router on its own.
//
// ⚠️ DISPATCHED BY PREFIX, NOT BY FALLING THROUGH BRANCH BY BRANCH. Every custom_id this panel mints
// carries one of OWNED_PREFIXES, and those prefixes are matched by NO other branch in the router
// (checked against all 93 before the move). So handleManageInteraction decides ownership ONCE, from
// the id alone, and every branch below keeps its original `return` exactly as written. That is
// deliberate: rewriting ~100 return statements to fit a boolean contract is precisely how a move
// this size introduces a bug that only shows up on one rarely-clicked confirmation button.
//
// ⚠️ THE CRASH NET IS STILL THE ROUTER'S. handleManageInteraction is awaited from inside
// handlers/router.js's single top-level try/catch -- do NOT add one here, do NOT register listeners,
// and keep every error-branch reply an AWAITED call inside its own small try/catch. A bare
// `return interaction.reply(...)` can reject after the try has exited and escape the net entirely.
// See .claude/rules/interaction-router.md.
//
// ⚠️ THE ADMIN GUARD IS NOT HERE AND MUST NOT BE COPIED HERE. Who may click these lives at ONE choke
// point in the router, above this dispatch, and enforces PER-COMMAND and per-page permissions
// (utils/adminAccess.js). This handler assumes that check already passed. Adding a second copy is
// how the panel ended up with ~25 handlers that each forgot it in the first place.
//
// ⚠️ THE STORES BELOW ARE MODULE-LEVEL AND MANAGE-PRIVATE. All 14 were checked against every use
// site before the move: not one is touched by a non-manage branch. They rely on Node caching this
// module so exactly one instance exists -- require it by exactly one path.

// randomUUID is required further down, inside the stores block it belongs to (moved verbatim).
const { resolveThumbnail } = require('../utils/cloudinaryCache');

// ==========================================
// MANAGE-PRIVATE HELPERS & SHORT-LIVED STORES
// ==========================================
// Splits an `mng_act_`/`mng_search_`/`mng_pick_` custom_id's remainder (after that prefix is
// stripped) into [group, action] on the LAST underscore, not a naive `.split('_')` -- some group
// keys now contain their own underscore (`loadouts_mp`, `loadouts_dmz`, added 2026-07-12 once MP
// and DMZ Loadouts became separate panel pages), and every action id is deliberately kept
// underscore-free (camelCase, e.g. `bulkaddnew`) specifically so this split stays unambiguous.
function parseMngId(raw) {
    const idx = raw.lastIndexOf('_');
    return [raw.slice(0, idx), raw.slice(idx + 1)];
}

// --- MANAGE PANEL UNDO STORE (2026-07-12) --- in-memory, short-lived snapshot cache for the
// "Undo" button attached to destructive /manage confirmations (Purge, single Delete, Bulk Delete,
// Bulk Replace). Deliberately NOT persisted to Mongo -- these are meant to reverse a mistake made
// seconds ago in the same session, not act as a real audit log/version history. A token expires
// (and its snapshot is dropped) after 10 minutes so this can't grow unbounded across a long-running
// process; only ALLOWED_ADMIN_ID can ever trigger one of these anyway (see manage.js's own guard),
// so there's no need for anything fancier than a plain Map keyed by a short random token.
const { randomUUID } = require('crypto');
const manageUndoStore = new Map(); // token -> { description, restore: async () => {} }
function registerUndo(description, restore) {
    const token = randomUUID().slice(0, 8);
    manageUndoStore.set(token, { description, restore });
    setTimeout(() => manageUndoStore.delete(token), 10 * 60 * 1000).unref();
    return token;
}
function undoButtonRow(token) {
    return { type: 1, components: [{ type: 2, style: 2, label: 'Undo', custom_id: `mng_undo_${token}` }] };
}

// Pending "Start New Season" confirmations (2026-07-12) -- same short-lived-token pattern as
// manageUndoStore above, just holding the entered title between the modal submit and the
// Confirm/Cancel click instead of a post-action snapshot. See the modal_wipe_season handler and
// the mng_wipeconfirm_/mng_wipecancel_ button handlers.
const pendingSeasonWipes = new Map(); // token -> { newTitle }

// Pending single-item Delete confirmations (2026-07-12) -- same short-lived-token pattern, holding
// the already-resolved { group, match } between resolveManagePanelAction's confirm prompt and the
// mng_delconfirm_/mng_delcancel_ button click.
const pendingManageDeletes = new Map(); // token -> { group, match }

// Pending single-match Edit confirmations (2026-07-12) -- see the mng_search_ handler's bug-fix
// comment for why this exists: Discord's API can't respond to a MODAL_SUBMIT interaction with
// another modal, so a single Edit match needs one intermediate button click (which CAN open a
// modal) before resolveManagePanelAction's showModal() call is reached.
const pendingManageEdits = new Map(); // token -> { group, match }

// Pending Bulk Delete confirmations (draws/calendar/loadouts, 2026-07-12) -- holds the DRY-RUN
// result (what WOULD be removed, computed but not yet saved) plus an `apply()` that performs the
// actual save and registers its own Undo snapshot, between the modal-submit's confirm prompt and
// the mng_bulkdelconfirm_/mng_bulkdelcancel_ button click.
const pendingBulkDeletes = new Map(); // token -> { description, summary, apply: async () => undoToken }
// --- DRAW THUMBNAIL CLOUDINARY CACHE (2026-07-12) --- shared by every bulk draw-save route (single
// add/edit uses resolveThumbnail directly, since there's only ever one draw to resolve). Runs every
// parsed draw's thumbnailUrl through resolveThumbnail() concurrently -- draws.js's media gallery
// needs a real URL on every entry, so a draw with no provided URL AND no existing cache hit has
// nothing to show and is dropped from the batch entirely (reported back as "skipped", not silently
// discarded) rather than saved with a broken/undefined image field.
// Shared by every single-item add/edit draw confirmation (bulk has its own `warnings` array style
// above) -- one line describing anything notable about how the thumbnail was resolved: a real
// Cloudinary failure (kept the raw URL), a fuzzy-matched reuse (2026-07-31 17:20 EDT, so a
// typo'd/reworded title reusing a DIFFERENT cached draw's image is visible, not silent), or nothing
// at all for the common exact-match/fresh-upload case.
function thumbnailNote(thumbResult) {
    if (thumbResult.error) return `⚠️ Cloudinary caching failed, kept the original URL instead: ${thumbResult.error}`;
    if (thumbResult.reused && thumbResult.matchedTitle) return `ℹ️ Thumbnail reused from a similarly-named cached draw: "${thumbResult.matchedTitle}"`;
    return null;
}

async function resolveThumbnailsForDraws(draws) {
    const results = await Promise.all(draws.map(d => resolveThumbnail(d.title, d.thumbnailUrl)));
    const validDraws = [];
    const skipped = [];
    const warnings = [];
    draws.forEach((draw, i) => {
        const result = results[i];
        if (!result.url) {
            skipped.push(draw.title);
            return;
        }
        draw.thumbnailUrl = result.url;
        validDraws.push(draw);
        if (result.error) warnings.push(`${draw.title} (${result.error})`);
        // Fuzzy cache reuse (2026-07-31 17:20 EDT) -- surface it when the match wasn't an exact
        // title hit, so a typo/rewording reusing a DIFFERENT draw's thumbnail is visible, not silent.
        else if (result.reused && result.matchedTitle) warnings.push(`${draw.title} (thumbnail reused from a similarly-named cached draw: "${result.matchedTitle}")`);
    });
    return { validDraws, skipped, warnings };
}

// --- BULK REPLACE DRAWS: UPSERT BY TITLE (2026-07-12) --- "Replace Multiple" used to wholesale-
// overwrite the whole array with exactly what was pasted (anything not mentioned got deleted) --
// Harkirat wants it to instead fuzzy-match each pasted draw's title against the array being
// replaced: update the existing draw in place (same _id) on a match, insert as new otherwise, and
// never touch anything not mentioned in the paste (Purge already covers a full wipe). Mirrors the
// same upsert convention loadouts' bulk-add already uses (matched there by weaponKey+mode+
// buildName; here by fuzzy title match). Returns the same array reference mutated in place (plus
// counts for the confirmation message) rather than a fresh one, so this stays consistent with how
// every other draws-array mutation in this file works directly against the Mongoose subdocument array.
function upsertDrawsByTitle(existingArray, parsedDraws) {
    const { fuzzyMatch } = require('../utils/search');
    let updatedCount = 0;
    let insertedCount = 0;
    const finalArray = [...existingArray];

    for (const parsed of parsedDraws) {
        const matchIndex = finalArray.findIndex(d => fuzzyMatch(parsed.title, d.title));
        if (matchIndex > -1) {
            // Update in place -- keep the existing _id, overwrite the rest of its fields.
            finalArray[matchIndex] = Object.assign(finalArray[matchIndex], parsed);
            updatedCount++;
        } else {
            finalArray.push(parsed);
            insertedCount++;
        }
    }

    return { finalArray, updatedCount, insertedCount };
}

// --- BULK REPLACE CALENDAR: UPSERT BY TITLE (2026-07-12) --- same upsert convention as
// upsertDrawsByTitle above -- Harkirat wants Calendar's Replace Multiple to behave identically:
// fuzzy-match each pasted event's title against the existing calendar, update in place on a match,
// insert otherwise, never touch anything not mentioned in the paste (Purge already covers a full
// wipe). Takes/returns plain `{title, date, endDate, isOngoing}` event objects, same shape
// `modal_calendar_bulk_add`/`_replace` already builds.
function upsertEventsByTitle(existingArray, parsedEvents) {
    const { fuzzyMatch } = require('../utils/search');
    let updatedCount = 0;
    let insertedCount = 0;
    const finalArray = [...existingArray];

    for (const parsed of parsedEvents) {
        const matchIndex = finalArray.findIndex(e => fuzzyMatch(parsed.title, e.title));
        if (matchIndex > -1) {
            finalArray[matchIndex] = Object.assign(finalArray[matchIndex], parsed);
            updatedCount++;
        } else {
            finalArray.push(parsed);
            insertedCount++;
        }
    }

    return { finalArray, updatedCount, insertedCount };
}

// --- MANAGE PANEL SEARCH RESOLUTION (2026-07-09 button/modal redesign) ---
// Edit/Delete on the /manage panel can't autocomplete like a slash-command option could (they're
// plain buttons), so they collect a search query through a one-field modal instead (see manage.js's
// buildSearchModal) and resolve it here via the same fuzzyMatch() convention every other
// admin-search route in the bot already uses. Returns up to 25 `{ id, label, doc, type? }` matches
// -- `type` ('new'/'returning') only applies to draws, since those live in two separate arrays on
// one document; every other group's docs are independently addressable by _id alone.
async function resolveManagePanelMatches(group, rawQuery) {
    const { fuzzyMatch } = require('../utils/search');
    const query = rawQuery.trim();

    if (group === 'draws') {
        const SeasonalData = require('../models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        if (!seasonalDoc) return [];
        const tagged = [
            ...seasonalDoc.newDraws.map(doc => ({ doc, type: 'new' })),
            ...seasonalDoc.returningDraws.map(doc => ({ doc, type: 'returning' }))
        ];
        // Matches against the draw's TITLE or any of its item names (weapons/characters/emotes) --
        // 2026-07-12, Harkirat's request: searching "fss hurricane" or "charioteer" should find the
        // draw those items are actually IN, not just a draw literally titled that.
        return tagged.filter(t => fuzzyMatch(query, t.doc.title) || t.doc.items.some(item => fuzzyMatch(query, item.name)))
            .slice(0, 25).map(t => ({
                id: t.doc._id.toString(), type: t.type, doc: t.doc,
                label: `${t.doc.title} (${t.type === 'new' ? 'New' : 'Returning'})`
            }));
    }

    if (group === 'calendar') {
        const SeasonalData = require('../models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        if (!seasonalDoc) return [];
        return seasonalDoc.calendar.filter(e => fuzzyMatch(query, e.title)).slice(0, 25)
            .map(e => ({ id: e._id.toString(), doc: e, label: e.title }));
    }

    // Loadouts is now two separate panel pages (MP/DMZ, 2026-07-12) instead of one combined group --
    // scope the search to whichever mode the page/group encodes rather than searching both.
    if (group === 'loadouts_mp' || group === 'loadouts_dmz') {
        const mode = group === 'loadouts_mp' ? 'MP' : 'DMZ';
        const Loadout = require('../models/Loadout');
        const modeLoadouts = await Loadout.find({ mode }).lean();
        return modeLoadouts.filter(l => fuzzyMatch(query, l.weaponName) || fuzzyMatch(query, l.buildName)).slice(0, 25)
            .map(l => ({ id: l._id.toString(), doc: l, label: `${l.weaponName} - ${l.buildName}` }));
    }

    // Patch Notes no longer has a search-based edit/delete flow (2026-07-12 redesign moved it to a
    // single "current entry" model -- see manage.js's buildPatchDateInfoModal/buildPatchUrlsModal),
    // so this group is intentionally absent here now.

    return [];
}

// Given one resolved match (single fuzzy hit, or a disambiguation-select pick), either chains
// straight into the real edit modal -- `showModal` is valid as the FIRST response to a modal-submit
// or select-menu interaction too, not just a button, same as any other interaction that hasn't
// been acknowledged yet -- or performs the delete directly and confirms. Shared by both the
// single-match fast path in the `mng_search_` modal-submit handler and the `mng_pick_`
// disambiguation-select handler below.
async function resolveManagePanelAction(interaction, group, action, match) {
    const manageCommand = interaction.client.commands.get('manage');

    if (action === 'edit') {
        if (group === 'draws') return interaction.showModal(manageCommand.buildEditDrawModal(match.doc, match.id, match.type));
        if (group === 'calendar') return interaction.showModal(manageCommand.buildEditCalendarModal(match.doc, match.id));
        if (group === 'loadouts_mp' || group === 'loadouts_dmz') return interaction.showModal(manageCommand.buildEditLoadoutModal(match.doc, match.id));
    }

    if (action === 'delete') {
        // 2-step confirm added 2026-07-12 -- this used to delete the instant a single match was
        // resolved, no confirmation at all. Stashes the resolved match in `pendingManageDeletes`
        // (declared near the other manage-panel module-scope stores) and shows the same
        // Confirm/Cancel pattern Purge already uses -- the actual delete only happens from
        // `mng_delconfirm_` below. Both a modal-submit interaction and a select-menu interaction
        // (mng_pick_ never deferUpdate()s before reaching here) can answer with a plain reply --
        // neither has been acknowledged yet at this point.
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
// OWNERSHIP
// ==========================================
// The same prefix set the router's admin guard keys its per-command permission map on. Kept as one
// list so the two can be compared by eye; if a new manage prefix is ever added, it belongs in BOTH.
const OWNED_PREFIXES = ['mng_', 'modal_', 'add_loadout_', 'edit_loadout_', 'edit_calendar_', 'edit_draw_', 'add_draw_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

// ==========================================
// ROUTING
// ==========================================
// Branch bodies are verbatim from the router; their return values are discarded here exactly as they
// were there (the interactionCreate listener never read them either).
async function routeManage(interaction) {
    if (interaction.isStringSelectMenu()) {
        // MANAGE PANEL PAGE SELECT -- a select menu (not a row of nav buttons) since the panel
        // has more sections than a button row's 5-cap allows. Season has NO page of its own at all
        // (not a key in manage.js's PAGES) -- both its actions are flat dropdown entries that open
        // their modal directly instead of rendering anything, per Harkirat's request ("let that
        // selection open the editing modal right away instead of a dedicated management page").
        // `showModal` is valid as the first response to a select-menu interaction, same as it is for
        // a button or modal-submit.
        if (interaction.customId === 'mng_pagesel') {
            const targetPage = interaction.values[0];
            const manageCommand = interaction.client.commands.get('manage');

            // Per-page scoping (2026-08-13) -- re-checked here even though the dropdown itself only
            // ever OFFERS pages this user is allowed on (buildManagePage's allowedPages filter), for
            // the same defense-in-depth reasoning as every other re-check in this handler: a stale
            // panel message from before a permission change could still carry an option no longer
            // theirs.
            const { getManagePages } = require('../utils/adminAccess');
            const allowedPages = await getManagePages(interaction.user.id);
            const deniedReply = { content: "🔒 **You don't have access to that section.** Ask the bot owner to grant it if you need it.", ephemeral: true };

            if (targetPage === 'season_titlesdeadlines') {
                if (!allowedPages.includes('season')) return interaction.reply(deniedReply);
                const SeasonalData = require('../models/SeasonalData');
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
            const { sendV2Payload } = require('../utils/sendV2Payload');

            // Patch Notes' "Past Seasons" dropdown needs a live DB read for its options -- see
            // manage.js's buildPastSeasonsOptions()/execute() for the matching initial-render path.
            let dynamicData = {};
            if (targetPage === 'patchnotes') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                dynamicData = { pastSeasons: manageCommand.buildPastSeasonsOptions(seasonalDoc) };
            } else if (targetPage === 'seasondraft') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                dynamicData = { draftStatus: manageCommand.buildDraftStatusText(seasonalDoc) };
            } else if (targetPage === 'manageadmins') {
                const AdminUser = require('../models/AdminUser');
                const adminDocs = await AdminUser.find({}).sort({ grantedAt: 1 }).lean();
                dynamicData = { adminListBlocks: await manageCommand.buildAdminListBlocks(adminDocs, interaction.client) };
            } else if (targetPage === 'announcement') {
                const { getActiveAnnouncements } = require('../utils/announcement');
                const announcementDocs = await getActiveAnnouncements();
                dynamicData = { announcementBlocks: manageCommand.buildAnnouncementListBlocks(announcementDocs) };
            }
            return sendV2Payload(interaction, manageCommand.buildManagePage(targetPage, dynamicData, interaction.client, allowedPages));
        }

        // Bulk Format Guide's own topic-switcher dropdown (utils/manageGuides.js, added 2026-07-31
        // 17:20 EDT) -- re-renders the SAME guide message in place, same deferUpdate + sendV2Payload
        // shape as mng_pagesel above, just editing a standalone guide message instead of the panel.
        if (interaction.customId === 'mng_guide_pick') {
            const { buildGuideContainer } = require('../utils/manageGuides');
            await interaction.deferUpdate();
            const { sendV2Payload } = require('../utils/sendV2Payload');
            return sendV2Payload(interaction, buildGuideContainer(interaction.values[0]));
        }

        // MANAGE PANEL DISAMBIGUATION SELECT -- shown by the `mng_search_` modal-submit handler
        // (below) when a search query matched more than one item. Looks the pick up directly by
        // _id (encoded in the option value, `|type` appended for draws since those need to know
        // which of the two arrays they came from) rather than re-running the fuzzy search, then
        // hands off to the same resolveManagePanelAction() the single-match fast path uses.
        if (interaction.customId.startsWith('mng_pick_')) {
            const [group, action] = parseMngId(interaction.customId.replace('mng_pick_', ''));
            const [id, type] = interaction.values[0].split('|');

            let match = null;
            if (group === 'draws') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                const doc = type === 'new'
                    ? seasonalDoc.newDraws.find(d => d._id.toString() === id)
                    : seasonalDoc.returningDraws.find(d => d._id.toString() === id);
                if (doc) match = { id, type, doc, label: `${doc.title} (${type === 'new' ? 'New' : 'Returning'})` };
            } else if (group === 'calendar') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                const doc = seasonalDoc.calendar.find(e => e._id.toString() === id);
                if (doc) match = { id, doc, label: doc.title };
            } else if (group === 'loadouts_mp' || group === 'loadouts_dmz') {
                const Loadout = require('../models/Loadout');
                const doc = await Loadout.findById(id).lean();
                if (doc) match = { id, doc, label: `${doc.weaponName} - ${doc.buildName}` };
            }

            if (!match) {
                // Awaited + wrapped in its own try/catch -- see the matching note elsewhere in this
                // handler. Shouldn't normally happen (the pick came from a list built moments ago),
                // but the underlying doc could've been deleted/edited away in between.
                try {
                    await interaction.update({ content: '❌ That item no longer exists -- it may have been changed or removed since you searched.', components: [] });
                } catch (notifyError) {
                    console.error('Failed to notify user of stale manage-panel pick (interaction likely expired):', notifyError);
                }
                return;
            }

            return await resolveManagePanelAction(interaction, group, action, match);
        }

        // MANAGE PANEL: PATCH NOTES "PAST SEASONS" PICK (2026-07-24) -- Patch Notes' own select
        // menu, separate from the generic mng_pick_ disambiguation above (that one only exists
        // because a search-modal query can match multiple items; this one's options ARE the full
        // list already, so picking one goes straight to its edit modal, no search step at all).
        if (interaction.customId === 'mng_patchseason_pick') {
            const pickedId = interaction.values[0];
            if (pickedId === 'none') return await interaction.deferUpdate(); // the disabled placeholder option -- shouldn't normally fire, but no-op if it somehow does
            const SeasonalData = require('../models/SeasonalData');
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
            const entry = seasonalDoc?.patchNotes?.find(p => p._id.toString() === pickedId);
            if (!entry) {
                try {
                    await interaction.update({ content: '❌ That season no longer exists -- it may have been changed or removed since this panel loaded.', components: [] });
                } catch (notifyError) {
                    console.error('Failed to notify user of stale patch-season pick (interaction likely expired):', notifyError);
                }
                return;
            }
            const manageCommand = interaction.client.commands.get('manage');
            const PatchEditUserPreference = require('../models/UserPreference');
            const patchEditAdminPrefs = await PatchEditUserPreference.findOne({ discordId: interaction.user.id });
            return await interaction.showModal(manageCommand.buildPatchEditSeasonModal(entry, patchEditAdminPrefs?.timezone));
        }
    }

    if (interaction.isButton()) {
        // MANAGE PANEL -- action buttons (2026-07-09 redesign, rebuilt again 2026-07-12 per the
        // 4 mockup JSONs -- see manage.js's buildManagePage/build*Modal helpers). /manage opens one
        // ephemeral panel message, and every data-entry action is reached by clicking a button on
        // it instead of picking a subcommand. Page switching itself is a select menu (`mng_pagesel`,
        // handled in the isStringSelectMenu() block above) rather than a row of nav buttons, since a
        // button row caps out at 5 sections and this panel has more than that.
        if (interaction.customId.startsWith('mng_act_')) {
            const [group, action] = parseMngId(interaction.customId.replace('mng_act_', ''));
            const manageCommand = interaction.client.commands.get('manage');
            const isLoadoutsGroup = group === 'loadouts_mp' || group === 'loadouts_dmz';
            const loadoutMode = group === 'loadouts_mp' ? 'MP' : 'DMZ';

            // Edit/Delete need a specific item picked first -- a button can't autocomplete the way
            // a slash-command option could, so these open a one-field "search by name" modal
            // instead of the real edit/delete modal directly. Resolved in this file's
            // `mng_search_` modal-submit handler further down. (Patch Notes has no edit/delete
            // button anymore -- see its dateinfo/urls1/urls2 branch below.)
            if (action === 'edit' || action === 'delete') {
                return await interaction.showModal(manageCommand.buildSearchModal(group, action));
            }

            // Bulk Format Guide (rebuilt into a rich Components V2 view 2026-07-31 17:20 EDT, same-
            // day follow-up -- was a plain-text reply, the notes file) -- a real structured reference, not a
            // modal/DB action, so it's handled here before any of the group-specific branches. Opens
            // pre-selected to the page that was clicked; utils/manageGuides.js's select-menu row
            // lets switching to any other topic without leaving the guide (mng_guide_pick handler,
            // isStringSelectMenu() block below). Deferred + sendV2Payload, same pattern every other
            // V2 render in this bot uses -- discord.js's high-level reply() can't reliably serialize
            // raw V2 JSON (see rendering-and-ui.md).
            if (action === 'formatguide') {
                const { resolveGuideTopic, buildGuideContainer } = require('../utils/manageGuides');
                await interaction.deferReply({ ephemeral: true });
                const { sendV2Payload } = require('../utils/sendV2Payload');
                return await sendV2Payload(interaction, buildGuideContainer(resolveGuideTopic(group)));
            }

            // "Purge" (draws/calendar/patchnotes only -- Loadouts deliberately has none, see
            // manage.js's PURGE_LABELS note) needs a second confirmation before it actually deletes
            // anything -- a single misclick on a destructive button shouldn't be enough to wipe a
            // whole collection. This first click just shows a Confirm/Cancel prompt; the actual
            // deletion only happens from `mng_purgeconfirm_` below.
            // Draws gained 3 granular scopes (2026-07-12: purgenew/purgereturning/purgeall) instead
            // of one generic 'purge' action -- every other group still only has 'purge' (scope
            // 'all'). custom_id always encodes BOTH group and scope now (`mng_purgeconfirm_{group}_
            // {scope}`) so the confirm/cancel handlers below have one consistent shape to parse
            // regardless of which group triggered it.
            if (action === 'purge' || action === 'purgenew' || action === 'purgereturning' || action === 'purgeall') {
                const scope = action === 'purgenew' ? 'new' : action === 'purgereturning' ? 'returning' : 'all';
                const label = manageCommand.PURGE_LABELS[group][scope];
                return interaction.reply({
                    content: `⚠️ **Are you sure?** This will permanently delete ${label}. This cannot be undone.`,
                    components: [{
                        type: 1, components: [
                            { type: 2, style: 4, label: 'Yes, Purge', custom_id: `mng_purgeconfirm_${group}_${scope}` },
                            { type: 2, style: 2, label: 'Cancel', custom_id: `mng_purgecancel_${group}_${scope}` }
                        ]
                    }],
                    ephemeral: true
                });
            }

            if (group === 'draws') {
                if (action === 'addnew') return await interaction.showModal(manageCommand.buildAddDrawModal('new'));
                if (action === 'addreturning') return await interaction.showModal(manageCommand.buildAddDrawModal('returning'));
                // New/Returning/Either triplets condensed to ONE button each (2026-07-12) --
                // Either/Both's modal already covers the single-category case by leaving one field
                // blank, so the 3-way split was pure redundancy. `bulkadd`/`bulkreplace`/`bulkdelete`
                // are now the only 3 draws bulk action ids that exist.
                if (action === 'bulkadd') return await interaction.showModal(manageCommand.buildBulkBothDrawsModal('add'));
                if (action === 'bulkreplace') return await interaction.showModal(manageCommand.buildBulkBothDrawsModal('replace'));
                if (action === 'bulkdelete') return await interaction.showModal(manageCommand.buildBulkRemoveDrawsModal('either'));

                // Export -- replies directly with the exported file, no modal, nothing to submit.
                // Now lives INSIDE the Draws page itself (2026-07-12) rather than a separate Export
                // page, reusing the same bulk-import-compatible formatter as before.
                if (action === 'exportnew' || action === 'exportreturning') {
                    const SeasonalData = require('../models/SeasonalData');
                    const { formatDrawsAsBulkText } = require('../utils/adminParser');
                    const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                    const isNew = action === 'exportnew';
                    const text = formatDrawsAsBulkText(isNew ? seasonalDoc?.newDraws || [] : seasonalDoc?.returningDraws || []) || `(no ${isNew ? 'New' : 'Returning'} Draws currently saved)`;
                    return interaction.reply({
                        content: `📤 **Exported ${isNew ? 'New' : 'Returning'} Draws** in Bulk Add format. Paste this back into the matching Bulk action.`,
                        files: [{ attachment: Buffer.from(text, 'utf-8'), name: `${isNew ? 'new' : 'returning'}_draws_bulk.txt` }],
                        ephemeral: true
                    });
                }
            }

            if (group === 'calendar') {
                if (action === 'add') return await interaction.showModal(manageCommand.buildCalendarAddModal());
                if (action === 'addmultiple') return await interaction.showModal(manageCommand.buildCalendarBulkModal('add'));
                if (action === 'replacemultiple') return await interaction.showModal(manageCommand.buildCalendarBulkModal('replace'));
                if (action === 'deletemultiple') return await interaction.showModal(manageCommand.buildCalendarBulkRemoveModal());
                if (action === 'export') {
                    const SeasonalData = require('../models/SeasonalData');
                    const { formatCalendarAsBulkText } = require('../utils/adminParser');
                    const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                    const text = formatCalendarAsBulkText(seasonalDoc?.calendar || []) || '(no calendar events currently saved)';
                    return interaction.reply({
                        content: `📤 **Exported Calendar** in Bulk Add format. Paste this back into the Replace action.`,
                        files: [{ attachment: Buffer.from(text, 'utf-8'), name: 'calendar_bulk.txt' }],
                        ephemeral: true
                    });
                }
                // Page Banners (2026-07-31 17:20 EDT) -- opens pre-filled with whatever's currently saved.
                if (action === 'banners') {
                    const SeasonalData = require('../models/SeasonalData');
                    const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                    return await interaction.showModal(manageCommand.buildCalendarBannersModal(seasonalDoc));
                }
            }

            if (isLoadoutsGroup) {
                if (action === 'add') return await interaction.showModal(manageCommand.buildAddLoadoutModal(loadoutMode));
                if (action === 'bulkadd') return await interaction.showModal(manageCommand.buildLoadoutsBulkAddModal(loadoutMode));
                // "Replace Multiple" reuses the exact same upsert-by-name modal as "Add Multiple" for
                // now -- the upsert behavior (update in place if that build already exists, insert
                // if not) already covers "replace" semantics for anything you paste back in. The
                // real search-then-pick-from-a-list interaction described in the mockup is the
                // deferred future work (see this file's top-of-file note) -- Harkirat's explicit
                // call was to hold that off until the rest of this panel redesign lands cleanly.
                if (action === 'bulkreplace') return await interaction.showModal(manageCommand.buildLoadoutsBulkAddModal(loadoutMode));
                if (action === 'bulkdelete') return await interaction.showModal(manageCommand.buildLoadoutsBulkRemoveModal(loadoutMode));
                if (action === 'exportupto5') return await interaction.showModal(manageCommand.buildLoadoutsExportUpTo5Modal(loadoutMode));
                if (action === 'exportcategory') return await interaction.showModal(manageCommand.buildLoadoutsExportCategoryModal(loadoutMode));
                if (action === 'exportall') {
                    const Loadout = require('../models/Loadout');
                    const { formatLoadoutsAsBulkText } = require('../utils/adminParser');
                    const loadouts = await Loadout.find({ mode: loadoutMode }).lean();
                    const text = formatLoadoutsAsBulkText(loadouts) || `(no ${loadoutMode} loadouts currently saved)`;
                    return interaction.reply({
                        content: `📤 **Exported all ${loadoutMode} loadouts** in Bulk Add format. Paste this back into the Bulk Add action.`,
                        files: [{ attachment: Buffer.from(text, 'utf-8'), name: `${loadoutMode.toLowerCase()}_loadouts_bulk.txt` }],
                        ephemeral: true
                    });
                }
            }

            // Patch Notes now operates on a single "current" entry (the last item in patchNotes[],
            // the one whose title stays synced to currentSeasonTitle) rather than add-a-new-entry or
            // search-and-edit -- see manage.js's buildPatchDateInfoModal/buildPatchUrlsModal. If no
            // entry exists yet at all, these modals just open blank/empty; the submit handler below
            // creates the first entry the first time any of the three is actually submitted.
            if (group === 'patchnotes') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                const currentEntry = seasonalDoc?.patchNotes?.length ? seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1] : null;
                if (action === 'dateinfo') {
                    const PatchDateInfoUserPreference = require('../models/UserPreference');
                    const patchDateInfoAdminPrefs = await PatchDateInfoUserPreference.findOne({ discordId: interaction.user.id });
                    return await interaction.showModal(manageCommand.buildPatchDateInfoModal(currentEntry, patchDateInfoAdminPrefs?.timezone));
                }
                if (action === 'urls1') return await interaction.showModal(manageCommand.buildPatchUrlsModal(1, currentEntry));
                if (action === 'urls2') return await interaction.showModal(manageCommand.buildPatchUrlsModal(2, currentEntry));
                // "Add New Season" (2026-07-24) -- always opens blank, unlike dateinfo/urls1/urls2
                // which reuse/prefill the existing current entry. Submitting it always PUSHES a new
                // entry -- see modal_patch_addseason below.
                if (action === 'addseason') return await interaction.showModal(manageCommand.buildPatchAddSeasonModal());
            }

            // "Next Season Draft" (2026-07-30 22:24 EDT) -- settitles/bulkdraws/bulkcalendar open
            // their modal pre-filled from the CURRENT draft (so re-running one to fix a typo doesn't
            // start from blank); promote/discard are destructive-ish enough to need the same
            // 2-step Confirm/Cancel every other irreversible action on this panel already uses.
            if (group === 'seasondraft') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                if (action === 'settitles') return await interaction.showModal(manageCommand.buildDraftTitlesDatesModal(seasonalDoc));
                if (action === 'bulkdraws') return await interaction.showModal(manageCommand.buildDraftBulkDrawsModal(seasonalDoc));
                if (action === 'bulkcalendar') return await interaction.showModal(manageCommand.buildDraftBulkCalendarModal(seasonalDoc));
                if (action === 'promote') {
                    if (!seasonalDoc.draft?.active) {
                        return interaction.reply({ content: '❌ No draft in progress — nothing to promote.', ephemeral: true });
                    }
                    return interaction.reply({
                        content: `⚠️ **Promote the staged draft to live?** This swaps in the draft's title, deadlines, ${seasonalDoc.draft.newDraws?.length || 0} New draw(s), ${seasonalDoc.draft.returningDraws?.length || 0} Returning draw(s), and ${seasonalDoc.draft.calendar?.length || 0} calendar event(s) as what's live RIGHT NOW, and clears the draft. Undo is available after.`,
                        components: [{
                            type: 1, components: [
                                { type: 2, style: 3, label: 'Yes, Promote', custom_id: 'mng_draftpromoteconfirm' },
                                { type: 2, style: 2, label: 'Cancel', custom_id: 'mng_draftpromotecancel' }
                            ]
                        }],
                        ephemeral: true
                    });
                }
                if (action === 'discard') {
                    if (!seasonalDoc.draft?.active) {
                        return interaction.reply({ content: '❌ No draft in progress — nothing to discard.', ephemeral: true });
                    }
                    return interaction.reply({
                        content: `⚠️ **Discard the staged draft?** This erases everything staged for next season. What's currently live is untouched. Cannot be undone.`,
                        components: [{
                            type: 1, components: [
                                { type: 2, style: 4, label: 'Yes, Discard', custom_id: 'mng_draftdiscardconfirm' },
                                { type: 2, style: 2, label: 'Cancel', custom_id: 'mng_draftdiscardcancel' }
                            ]
                        }],
                        ephemeral: true
                    });
                }
            }

            // "Manage Admins" (2026-08-13) -- the page itself is owner-only VISIBILITY (never
            // offered to a non-owner admin at all, see utils/adminAccess.js's getManagePages), so
            // reaching this branch at all already implies the owner -- re-checked anyway, matching
            // every other owner-gated action's defense-in-depth. Per-admin Edit Permissions/Revoke
            // now live directly on each card (mng_admin_editperms_*/mng_admin_revoke_* below), not
            // routed through here.
            if (group === 'manageadmins') {
                const { isOwner } = require('../utils/adminAccess');
                if (!isOwner(interaction.user.id)) {
                    return interaction.reply({ content: "🔒 **Only the bot owner can manage the admin list.**", ephemeral: true });
                }
                if (action === 'grant') return await interaction.showModal(manageCommand.buildAdminGrantModal());
            }

            // "Announcement" (2026-08-13) -- reachable by any admin (posting one isn't the
            // owner-only privilege-boundary grant/revoke is; see the manageadmins branch above).
            // Post New always opens BLANK (announcementDoc = null) -- each announcement is its own
            // independent doc now, not a single one being overwritten. Per-item Edit/Delete live in
            // their own top-level `mng_announce_*` handlers below (their custom_ids embed a Mongo
            // _id, which parseMngId's group/action split can't handle -- same reasoning as the
            // mng_admin_revoke*/mng_purge* handlers already living outside mng_act_).
            if (group === 'announcement' && action === 'post') {
                return await interaction.showModal(manageCommand.buildAnnouncementModal(null));
            }
        }

        // MANAGE PANEL: PURGE CONFIRM / CANCEL -- the second step of the two-tap confirmation
        // above. Each group purges only its OWN data, independent of Season's "Wipe Season" (which
        // resets draws+calendar together as part of starting a new season but deliberately keeps
        // patch notes forever) -- Patch Notes' purge in particular is the one place that history can
        // actually be cleared, and only ever fires from this exact confirmed click.
        if (interaction.customId.startsWith('mng_purgeconfirm_')) {
            const [group, scope] = parseMngId(interaction.customId.replace('mng_purgeconfirm_', ''));
            let confirmMsg = '';
            let undoToken = null;

            if (group === 'draws') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
                // Snapshot whatever's about to be wiped so "Undo" can restore it exactly.
                const prevNew = seasonalDoc.newDraws;
                const prevReturning = seasonalDoc.returningDraws;
                if (scope === 'new' || scope === 'all') seasonalDoc.newDraws = [];
                if (scope === 'returning' || scope === 'all') seasonalDoc.returningDraws = [];
                await seasonalDoc.save();
                const removedCounts = [];
                if (scope === 'new' || scope === 'all') removedCounts.push(`${prevNew.length} New`);
                if (scope === 'returning' || scope === 'all') removedCounts.push(`${prevReturning.length} Returning`);
                confirmMsg = `✅ Purged ${scope === 'all' ? 'all New and Returning draws' : `all ${scope} draws`} (${removedCounts.join(', ')} removed).`;
                undoToken = registerUndo(`Purge (${scope} draws)`, async () => {
                    const doc = await SeasonalData.findOne({ docType: 'global' });
                    if (scope === 'new' || scope === 'all') doc.newDraws = prevNew;
                    if (scope === 'returning' || scope === 'all') doc.returningDraws = prevReturning;
                    await doc.save();
                });
            } else if (group === 'calendar') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
                const prevCalendar = seasonalDoc.calendar;
                seasonalDoc.calendar = [];
                await seasonalDoc.save();
                confirmMsg = `✅ Purged the calendar (${prevCalendar.length} event(s) removed).`;
                undoToken = registerUndo('Purge (calendar)', async () => {
                    const doc = await SeasonalData.findOne({ docType: 'global' });
                    doc.calendar = prevCalendar;
                    await doc.save();
                });
            } else if (group === 'patchnotes') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
                const prevPatchNotes = seasonalDoc.patchNotes;
                seasonalDoc.patchNotes = [];
                await seasonalDoc.save();
                confirmMsg = `✅ Purged the patch notes history (${prevPatchNotes.length} entrie(s) removed).`;
                undoToken = registerUndo('Purge (patch notes history)', async () => {
                    const doc = await SeasonalData.findOne({ docType: 'global' });
                    doc.patchNotes = prevPatchNotes;
                    await doc.save();
                });
            }

            // Awaited + wrapped in its own try/catch -- see the matching note elsewhere in this
            // handler for why a bare `return interaction.update(...)` isn't safe here.
            try {
                await interaction.update({ content: confirmMsg, components: undoToken ? [undoButtonRow(undoToken)] : [] });
            } catch (notifyError) {
                console.error(`Failed to confirm manage-panel purge for ${group} (interaction likely expired):`, notifyError);
            }
            return;
        }

        if (interaction.customId.startsWith('mng_purgecancel_')) {
            try {
                await interaction.update({ content: '❎ Purge cancelled -- nothing was deleted.', components: [] });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel purge cancellation (interaction likely expired):', notifyError);
            }
            return;
        }

        // MANAGE ADMINS: per-card EDIT PERMISSIONS / REVOKE buttons (2026-08-13) -- live outside
        // mng_act_/parseMngId (same reasoning as every other id-embedding custom_id in this file)
        // since their custom_id is the admin's own Discord id, which parseMngId's group/action
        // split can't handle. Both owner-gated -- the page itself is owner-only visibility, so
        // reaching either of these already implies the owner, but re-checked anyway.
        if (interaction.customId.startsWith('mng_admin_editperms_')) {
            const { isOwner } = require('../utils/adminAccess');
            if (!isOwner(interaction.user.id)) {
                return interaction.reply({ content: "🔒 **Only the bot owner can manage the admin list.**", ephemeral: true });
            }
            const discordId = interaction.customId.replace('mng_admin_editperms_', '');
            const AdminUser = require('../models/AdminUser');
            const doc = await AdminUser.findOne({ discordId }).lean();
            if (!doc) {
                return interaction.reply({ content: '❌ That admin no longer exists (they may have just been revoked).', ephemeral: true });
            }
            const manageCommand = interaction.client.commands.get('manage');
            return await interaction.showModal(manageCommand.buildAdminEditPermissionsModal(doc));
        }

        if (interaction.customId.startsWith('mng_admin_revoke_') && !interaction.customId.startsWith('mng_admin_revokeconfirm_') && !interaction.customId.startsWith('mng_admin_revokecancel_')) {
            const { isOwner } = require('../utils/adminAccess');
            if (!isOwner(interaction.user.id)) {
                return interaction.reply({ content: "🔒 **Only the bot owner can manage the admin list.**", ephemeral: true });
            }
            const discordId = interaction.customId.replace('mng_admin_revoke_', '');
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

        // MANAGE ADMINS: REVOKE CONFIRM / CANCEL -- second step of the prompt above. Owner
        // re-checked again here (third check total, alongside the button above and the mng_act_
        // branch) since this is the actual delete -- cheap insurance against a stale/shared confirm
        // prompt somehow being clicked by someone else.
        if (interaction.customId.startsWith('mng_admin_revokeconfirm_')) {
            const { isOwner, invalidateAdminCache } = require('../utils/adminAccess');
            const discordId = interaction.customId.replace('mng_admin_revokeconfirm_', '');
            if (!isOwner(interaction.user.id)) {
                try { await interaction.update({ content: "🔒 **Only the bot owner can manage the admin list.**", components: [] }); }
                catch (notifyError) { console.error('Failed to notify non-owner admin-revoke attempt:', notifyError); }
                return;
            }
            const AdminUser = require('../models/AdminUser');
            await AdminUser.deleteOne({ discordId });
            invalidateAdminCache();
            try {
                await interaction.update({ content: `✅ Revoked admin access from <@${discordId}>.`, components: [] });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel admin revoke (interaction likely expired):', notifyError);
            }
            return;
        }

        if (interaction.customId.startsWith('mng_admin_revokecancel_')) {
            try {
                await interaction.update({ content: '❎ Revoke cancelled -- nothing was changed.', components: [] });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel admin-revoke cancellation (interaction likely expired):', notifyError);
            }
            return;
        }

        // ANNOUNCEMENT: per-item EDIT / DELETE buttons (2026-08-13) -- these live outside
        // mng_act_/parseMngId (same reasoning as the admin-revoke handlers above) since their
        // custom_id embeds a Mongo _id, which parseMngId's group/action split can't handle.
        if (interaction.customId.startsWith('mng_announce_edit_')) {
            const id = interaction.customId.replace('mng_announce_edit_', '');
            const Announcement = require('../models/Announcement');
            const doc = await Announcement.findById(id).lean();
            if (!doc) {
                return interaction.reply({ content: '❌ That announcement no longer exists (it may have just been deleted or expired).', ephemeral: true });
            }
            // ⚠️ REAL BUG (found 2026-08-13, Harkirat: "I can't edit the announcement") -- this used
            // to reference the OUTER mng_act_ block's `manageCommand` const, which is scoped to that
            // block only; this handler is a SIBLING if-block (same reasoning as the admin-revoke/
            // purge handlers around it living outside mng_act_/parseMngId), so it was a
            // ReferenceError swallowed by the outer try/catch -- the interaction got NO response at
            // all, which is exactly what "can't edit" looks like from the Discord client. Declared
            // locally here now, same as every other sibling handler that needs it.
            const manageCommand = interaction.client.commands.get('manage');
            return await interaction.showModal(manageCommand.buildAnnouncementModal(doc));
        }

        if (interaction.customId.startsWith('mng_announce_delete_')) {
            const id = interaction.customId.replace('mng_announce_delete_', '');
            // Shows WHICH announcement, not just "an announcement" (2026-08-13, Harkirat: "the
            // deletion confirmation needs more detail... I don't even remember which announcement I
            // deleted") -- the per-item list on the page already has a preview, but this confirm
            // prompt used to repeat none of it, so a misclick (or delaying between click and
            // confirm) had nothing to double-check against.
            const Announcement = require('../models/Announcement');
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

        if (interaction.customId.startsWith('mng_announce_delconfirm_')) {
            const id = interaction.customId.replace('mng_announce_delconfirm_', '');
            const Announcement = require('../models/Announcement');
            // Fetched BEFORE deleting so the success message can still show what was removed --
            // same reasoning as the confirm prompt above, and this is the message that's left
            // sitting on screen afterward, so it's the more important of the two to get right.
            const doc = await Announcement.findById(id).lean();
            const preview = doc ? (doc.text.length > 200 ? `${doc.text.slice(0, 200)}…` : doc.text) : null;
            await Announcement.deleteOne({ _id: id });
            try {
                await interaction.update({
                    content: preview ? `✅ Deleted:\n> ${preview.replace(/\n/g, '\n> ')}` : '✅ Announcement deleted.',
                    components: []
                });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel announcement delete (interaction likely expired):', notifyError);
            }
            return;
        }

        if (interaction.customId.startsWith('mng_announce_delcancel_')) {
            try {
                await interaction.update({ content: '❎ Delete cancelled -- nothing was changed.', components: [] });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel announcement-delete cancellation (interaction likely expired):', notifyError);
            }
            return;
        }

        // MANAGE PANEL: NEXT SEASON DRAFT -- PROMOTE / DISCARD CONFIRM-CANCEL (2026-07-30 22:24
        // EDT). Promote snapshots the pre-swap LIVE values (not the draft) so Undo restores exactly
        // what was live before -- the draft itself is simply cleared, not restorable via Undo (it's
        // reachable again the normal way: just re-stage it).
        if (interaction.customId === 'mng_draftpromoteconfirm') {
            const SeasonalData = require('../models/SeasonalData');
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
            const draft = seasonalDoc.draft || {};
            if (!draft.active) {
                try { await interaction.update({ content: '❌ No draft in progress -- nothing to promote.', components: [] }); }
                catch (notifyError) { console.error('Failed to notify empty-draft promote attempt:', notifyError); }
                return;
            }
            const prevLive = {
                currentSeasonTitle: seasonalDoc.currentSeasonTitle, bpTitle: seasonalDoc.bpTitle,
                rankTitle: seasonalDoc.rankTitle, dmzTitle: seasonalDoc.dmzTitle,
                bpEnd: seasonalDoc.bpEnd, rankEnd: seasonalDoc.rankEnd, dmzEnd: seasonalDoc.dmzEnd,
                bpEndTBD: seasonalDoc.bpEndTBD, rankEndTBD: seasonalDoc.rankEndTBD, dmzEndTBD: seasonalDoc.dmzEndTBD,
                newDraws: seasonalDoc.newDraws, returningDraws: seasonalDoc.returningDraws, calendar: seasonalDoc.calendar,
                drawsBannerUrl: seasonalDoc.drawsBannerUrl, eventsBannerUrl: seasonalDoc.eventsBannerUrl, playlistsBannerUrl: seasonalDoc.playlistsBannerUrl
            };
            if (draft.currentSeasonTitle) seasonalDoc.currentSeasonTitle = draft.currentSeasonTitle;
            if (draft.bpTitle) seasonalDoc.bpTitle = draft.bpTitle;
            if (draft.rankTitle) seasonalDoc.rankTitle = draft.rankTitle;
            if (draft.dmzTitle) seasonalDoc.dmzTitle = draft.dmzTitle;
            // A `if (draft.bpEnd)` truthy check alone would silently skip promoting a TBD deadline --
            // TBD leaves draft.bpEnd explicitly null, so the TBD flag has to be checked FIRST (2026-07-31 14:00 EDT).
            if (draft.bpEndTBD) { seasonalDoc.bpEnd = null; seasonalDoc.bpEndTBD = true; }
            else if (draft.bpEnd) { seasonalDoc.bpEnd = draft.bpEnd; seasonalDoc.bpEndTBD = false; }
            if (draft.rankEndTBD) { seasonalDoc.rankEnd = null; seasonalDoc.rankEndTBD = true; }
            else if (draft.rankEnd) { seasonalDoc.rankEnd = draft.rankEnd; seasonalDoc.rankEndTBD = false; }
            if (draft.dmzEndTBD) { seasonalDoc.dmzEnd = null; seasonalDoc.dmzEndTBD = true; }
            else if (draft.dmzEnd) { seasonalDoc.dmzEnd = draft.dmzEnd; seasonalDoc.dmzEndTBD = false; }
            seasonalDoc.newDraws = draft.newDraws || [];
            seasonalDoc.returningDraws = draft.returningDraws || [];
            seasonalDoc.calendar = draft.calendar || [];
            // No staging UI exists for draft banners yet (schema-only forward compat, filed
            // 2026-07-31 17:20 EDT) -- these are no-ops today, but copy the same "truthy draft value
            // wins, blank leaves live untouched" convention titles use above, so a future staging
            // modal doesn't ALSO need this promote logic added separately.
            if (draft.drawsBannerUrl) seasonalDoc.drawsBannerUrl = draft.drawsBannerUrl;
            if (draft.eventsBannerUrl) seasonalDoc.eventsBannerUrl = draft.eventsBannerUrl;
            if (draft.playlistsBannerUrl) seasonalDoc.playlistsBannerUrl = draft.playlistsBannerUrl;
            // Most-recent patchNotes[] entry stays synced to the live title, same as the manual
            // Season Titles & Deadlines flow above.
            if (draft.currentSeasonTitle && seasonalDoc.patchNotes.length > 0) {
                seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1].title = seasonalDoc.currentSeasonTitle;
            }
            seasonalDoc.draft = { active: false, newDraws: [], returningDraws: [], calendar: [] };
            seasonalDoc.markModified('draft');
            await seasonalDoc.save();
            const undoToken = registerUndo('Promote Draft to Live', async () => {
                const doc = await SeasonalData.findOne({ docType: 'global' });
                Object.assign(doc, prevLive);
                await doc.save();
            });
            try {
                await interaction.update({
                    content: `✅ **Draft promoted to live!** "${seasonalDoc.currentSeasonTitle}" is now the live season (${seasonalDoc.newDraws.length} New, ${seasonalDoc.returningDraws.length} Returning, ${seasonalDoc.calendar.length} calendar event(s)). The draft has been cleared.`,
                    components: [undoButtonRow(undoToken)]
                });
            } catch (notifyError) {
                console.error('Failed to confirm draft promote (interaction likely expired):', notifyError);
            }
            return;
        }

        if (interaction.customId === 'mng_draftpromotecancel') {
            try { await interaction.update({ content: '❎ Promote cancelled -- the draft is untouched.', components: [] }); }
            catch (notifyError) { console.error('Failed to confirm draft promote cancellation (interaction likely expired):', notifyError); }
            return;
        }

        if (interaction.customId === 'mng_draftdiscardconfirm') {
            const SeasonalData = require('../models/SeasonalData');
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
            seasonalDoc.draft = { active: false, newDraws: [], returningDraws: [], calendar: [] };
            seasonalDoc.markModified('draft');
            await seasonalDoc.save();
            try { await interaction.update({ content: '✅ Draft discarded. What\'s live is untouched.', components: [] }); }
            catch (notifyError) { console.error('Failed to confirm draft discard (interaction likely expired):', notifyError); }
            return;
        }

        if (interaction.customId === 'mng_draftdiscardcancel') {
            try { await interaction.update({ content: '❎ Discard cancelled -- the draft is untouched.', components: [] }); }
            catch (notifyError) { console.error('Failed to confirm draft discard cancellation (interaction likely expired):', notifyError); }
            return;
        }

        // MANAGE PANEL: "START NEW SEASON" CONFIRM / CANCEL -- second step added 2026-07-12 (see
        // the modal_wipe_season handler for why). Snapshots the pre-wipe state so this can be
        // undone, same as Purge -- a season reset is at least as destructive as any single Purge and
        // deserves the same safety net.
        if (interaction.customId.startsWith('mng_wipeconfirm_')) {
            const token = interaction.customId.replace('mng_wipeconfirm_', '');
            const pending = pendingSeasonWipes.get(token);
            pendingSeasonWipes.delete(token);
            if (!pending) {
                try {
                    await interaction.update({ content: '❌ This confirmation has expired -- please start over from the Season dropdown.', components: [] });
                } catch (notifyError) {
                    console.error('Failed to notify user of expired season-wipe confirmation:', notifyError);
                }
                return;
            }

            const SeasonalData = require('../models/SeasonalData');
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
            const prevTitle = seasonalDoc.currentSeasonTitle;
            const prevNew = seasonalDoc.newDraws;
            const prevReturning = seasonalDoc.returningDraws;
            const prevCalendar = seasonalDoc.calendar;

            seasonalDoc.currentSeasonTitle = pending.newTitle;
            seasonalDoc.newDraws = [];
            seasonalDoc.returningDraws = [];
            seasonalDoc.calendar = [];
            // Note: patch notes history is deliberately preserved for the dropdown archive.
            await seasonalDoc.save();

            const undoToken = registerUndo(`Start New Season ("${pending.newTitle}")`, async () => {
                const doc = await SeasonalData.findOne({ docType: 'global' });
                doc.currentSeasonTitle = prevTitle;
                doc.newDraws = prevNew;
                doc.returningDraws = prevReturning;
                doc.calendar = prevCalendar;
                await doc.save();
            });

            try {
                await interaction.update({
                    content: `✅ **Success:** Renamed the season to **${pending.newTitle}** and wiped Draws (${prevNew.length + prevReturning.length} entries) + Calendar (${prevCalendar.length} events). Patch Notes history was kept.`,
                    components: [undoButtonRow(undoToken)]
                });
            } catch (notifyError) {
                console.error('Failed to confirm season wipe (interaction likely expired):', notifyError);
            }
            return;
        }

        if (interaction.customId.startsWith('mng_wipecancel_')) {
            const token = interaction.customId.replace('mng_wipecancel_', '');
            pendingSeasonWipes.delete(token);
            try {
                await interaction.update({ content: '❎ Cancelled -- nothing was changed.', components: [] });
            } catch (notifyError) {
                console.error('Failed to confirm season-wipe cancellation (interaction likely expired):', notifyError);
            }
            return;
        }

        // MANAGE PANEL: UNDO -- reverses a snapshot registered via registerUndo() (Purge, Start
        // New Season, and the delete/replace confirmations added below). Tokens expire after 10
        // minutes (see registerUndo) -- this is a same-session mistake-reversal tool, not a real
        // audit log.
        if (interaction.customId.startsWith('mng_undo_')) {
            const token = interaction.customId.replace('mng_undo_', '');
            const entry = manageUndoStore.get(token);
            if (!entry) {
                try {
                    await interaction.reply({ content: '❌ This undo has expired or was already used.', ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of expired undo (interaction likely expired):', notifyError);
                }
                return;
            }
            manageUndoStore.delete(token);
            try {
                await interaction.deferReply({ ephemeral: true });
                await entry.restore();
                await interaction.followUp({ content: `↩️ **Undone:** ${entry.description}` });
            } catch (undoError) {
                console.error('Failed to apply manage-panel undo:', undoError);
                try {
                    await interaction.followUp({ content: '❌ Something went wrong while undoing that -- check the data manually.' });
                } catch (notifyError) {
                    console.error('Failed to notify user of undo failure:', notifyError);
                }
            }
            return;
        }

        // MANAGE PANEL: SINGLE-ITEM DELETE CONFIRM / CANCEL -- second step of the confirmation
        // added to resolveManagePanelAction's delete branch above (2026-07-12). Performs the actual
        // deletion only from here, snapshotting the removed doc first so it can be undone.
        if (interaction.customId.startsWith('mng_delconfirm_')) {
            const token = interaction.customId.replace('mng_delconfirm_', '');
            const pending = pendingManageDeletes.get(token);
            pendingManageDeletes.delete(token);
            if (!pending) {
                try {
                    await interaction.update({ content: '❌ This confirmation has expired -- please search again.', components: [] });
                } catch (notifyError) {
                    console.error('Failed to notify user of expired delete confirmation:', notifyError);
                }
                return;
            }

            const { group, match } = pending;
            let undoToken = null;

            if (group === 'draws') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
                const removedDoc = match.doc;
                if (match.type === 'new') seasonalDoc.newDraws = seasonalDoc.newDraws.filter(d => d._id.toString() !== match.id);
                else seasonalDoc.returningDraws = seasonalDoc.returningDraws.filter(d => d._id.toString() !== match.id);
                await seasonalDoc.save();
                undoToken = registerUndo(`Delete draw "${match.label}"`, async () => {
                    const doc = await SeasonalData.findOne({ docType: 'global' });
                    if (match.type === 'new') doc.newDraws.push(removedDoc); else doc.returningDraws.push(removedDoc);
                    await doc.save();
                });
            } else if (group === 'calendar') {
                const SeasonalData = require('../models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
                const removedDoc = match.doc;
                seasonalDoc.calendar = seasonalDoc.calendar.filter(e => e._id.toString() !== match.id);
                await seasonalDoc.save();
                undoToken = registerUndo(`Delete calendar event "${match.label}"`, async () => {
                    const doc = await SeasonalData.findOne({ docType: 'global' });
                    doc.calendar.push(removedDoc);
                    await doc.save();
                });
            } else if (group === 'loadouts_mp' || group === 'loadouts_dmz') {
                const Loadout = require('../models/Loadout');
                const removedDoc = match.doc;
                await Loadout.findByIdAndDelete(match.id);
                undoToken = registerUndo(`Delete loadout "${match.label}"`, async () => {
                    const restoreDoc = { ...removedDoc };
                    delete restoreDoc._id; // let Mongo assign a fresh _id on re-insert
                    await Loadout.create(restoreDoc);
                });
            }

            try {
                await interaction.update({
                    content: `🗑️ **Deleted:** ${match.label}`,
                    components: undoToken ? [undoButtonRow(undoToken)] : []
                });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel delete (interaction likely expired):', notifyError);
            }
            return;
        }

        if (interaction.customId.startsWith('mng_delcancel_')) {
            const token = interaction.customId.replace('mng_delcancel_', '');
            pendingManageDeletes.delete(token);
            try {
                await interaction.update({ content: '❎ Cancelled -- nothing was deleted.', components: [] });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel delete cancellation (interaction likely expired):', notifyError);
            }
            return;
        }

        // MANAGE PANEL: BULK DELETE CONFIRM / CANCEL -- second step for draws/calendar/loadouts
        // Bulk Delete (2026-07-12). The modal-submit handlers above only computed WHAT would be
        // removed (dry run); the actual save/delete calls happen here via the pending entry's own
        // apply(), which also registers its own Undo snapshot.
        if (interaction.customId.startsWith('mng_bulkdelconfirm_')) {
            const token = interaction.customId.replace('mng_bulkdelconfirm_', '');
            const pending = pendingBulkDeletes.get(token);
            pendingBulkDeletes.delete(token);
            if (!pending) {
                try {
                    await interaction.update({ content: '❌ This confirmation has expired -- please submit the bulk delete again.', components: [] });
                } catch (notifyError) {
                    console.error('Failed to notify user of expired bulk-delete confirmation:', notifyError);
                }
                return;
            }
            try {
                const undoToken = await pending.apply();
                await interaction.update({
                    content: `🗑️ **${pending.description} Complete!**\n${pending.summary.join('\n')}`,
                    components: undoToken ? [undoButtonRow(undoToken)] : []
                });
            } catch (applyError) {
                console.error(`Failed to apply bulk delete (${pending.description}):`, applyError);
                try {
                    await interaction.update({ content: '❌ Something went wrong while deleting -- check the data manually.', components: [] });
                } catch (notifyError) {
                    console.error('Failed to notify user of bulk-delete apply failure:', notifyError);
                }
            }
            return;
        }

        if (interaction.customId.startsWith('mng_bulkdelcancel_')) {
            const token = interaction.customId.replace('mng_bulkdelcancel_', '');
            pendingBulkDeletes.delete(token);
            try {
                await interaction.update({ content: '❎ Cancelled -- nothing was deleted.', components: [] });
            } catch (notifyError) {
                console.error('Failed to confirm bulk-delete cancellation (interaction likely expired):', notifyError);
            }
            return;
        }

        // MANAGE PANEL: EDIT CONFIRM BUTTON (the intermediate "Edit: {label}" click).
        // CRITICAL PLACEMENT NOTE: this MUST live in the isButton() block, NOT next to its sibling
        // `mng_search_` modal-submit handler further down -- `mng_editbtn_` is a BUTTON custom_id, and
        // a button click never enters the isModalSubmit block, so a copy placed there is dead code and
        // the click silently times out ("Dioreo didn't respond in time"). That is exactly the
        // bug this handler HAD from 2026-07-12 (added but never live-clicked until 2026-07-17) -- same
        // wrong-isX()-branch class of bug as the loadout browse dropdown before it (see
        // feedback_verify_fix_actually_works). Why the extra button exists at all: a single Edit
        // search match can't open the edit modal straight from the search MODAL-SUBMIT interaction,
        // because Discord/discord.js don't allow showModal() as a response to a modal submit -- so the
        // search reply hands out this button, and THIS button click (which CAN showModal()) opens it.
        if (interaction.customId.startsWith('mng_editbtn_')) {
            const token = interaction.customId.replace('mng_editbtn_', '');
            const pending = pendingManageEdits.get(token);
            pendingManageEdits.delete(token);
            if (!pending) {
                // Early-return error branch -- awaited (not a bare `return interaction.reply(...)`)
                // per this file's documented rule about unawaited reply promises escaping the try.
                await interaction.reply({ content: '❌ This has expired -- please search again.', ephemeral: true });
                return;
            }
            return await resolveManagePanelAction(interaction, pending.group, 'edit', pending.match);
        }
    }

    if (interaction.isModalSubmit()) {
        const { customId } = interaction;
        const SeasonalData = require('../models/SeasonalData');
        const Loadout = require('../models/Loadout');
        // Hoisted once here instead of being re-required with a different destructured subset in
        // nearly every branch below (all inside the same already-required module scope).
        const { parseAdminDate, parseReleaseDateTime, toTitleCase, resolveTier, parseItemLine, parseBulkDrawList, parseBulkEvents, parseLoadoutBadges, parseBulkLoadoutList, splitTitleDate, formatAdminDate, normalizeCalendarCategory } = require('../utils/adminParser');
        const { fuzzyMatch } = require('../utils/search');
        // checkImageExists() (2026-07-18, /manage loadout UX overhaul) -- real Cloudinary existence
        // check used by add_loadout_/edit_loadout_/modal_loadouts_bulk_add_ below.
        const { checkImageExists } = require('../utils/loadoutRender');
        // --- MANAGE PANEL: SEARCH RESOLVER (Edit/Delete) ---
        // Handles its own per-group fetching via resolveManagePanelMatches (defined above, near
        // buildSyntheticInteraction) rather than the shared seasonalDoc gate below, and always
        // returns before reaching it -- see manage.js's buildSearchModal for where this modal comes
        // from (opened when Edit/Delete is clicked on the panel, since a button can't autocomplete
        // like a slash option could).
        if (customId.startsWith('mng_search_')) {
            const [group, action] = parseMngId(customId.replace('mng_search_', ''));
            const query = interaction.fields.getTextInputValue('query');
            const matches = await resolveManagePanelMatches(group, query);

            // "Search Again" button (2026-07-12) -- re-opens the same search modal from THIS reply,
            // so a second search doesn't require scrolling back up to the original panel message.
            const searchAgainRow = { type: 1, components: [{ type: 2, style: 2, label: 'Search Again', custom_id: `mng_act_${group}_${action}` }] };

            if (matches.length === 0) {
                return interaction.reply({ content: `❌ No matches found for "${query}".`, components: [searchAgainRow], ephemeral: true });
            }

            // BUG FIX (2026-07-12, found live -- "ffar"/"dlq"/"shadow" all failed with "Something
            // went wrong. Try again."): Discord's API does not allow responding to a MODAL_SUBMIT
            // interaction with another modal at all -- confirmed directly against the installed
            // discord.js v14.26.4: `ModalSubmitInteraction.prototype.showModal` is `undefined`,
            // unlike Button/StringSelectMenu interactions, which both implement it. So a single
            // match resolved straight from THIS search modal can never chain into
            // resolveManagePanelAction's showModal() call for Edit -- it always threw before the
            // interaction was ever acknowledged, which is exactly what surfaced as Discord's
            // generic client-side failure toast. (Delete was never affected -- it replies with a
            // plain Confirm/Cancel message, which modal-submit interactions CAN do.) Only a
            // BUTTON or SELECT MENU click can open a modal, so a single Edit match now needs one
            // extra click through a button first, stashed in `pendingManageEdits` the same way the
            // other pending-action Maps in this file work.
            if (matches.length === 1) {
                if (action !== 'edit') {
                    return await resolveManagePanelAction(interaction, group, action, matches[0]);
                }
                const token = randomUUID().slice(0, 8);
                pendingManageEdits.set(token, { group, match: matches[0] });
                setTimeout(() => pendingManageEdits.delete(token), 10 * 60 * 1000).unref();
                return interaction.reply({
                    content: `🔎 Found **${matches[0].label}** -- click below to edit:`,
                    // Edit + Search Again share ONE action row (2026-07-17, Harkirat's request) instead of
                    // stacking as two rows. Only valid for this single-match case: the multi-match case
                    // below can't inline them because a select menu (type 3) must occupy its own row and
                    // can't sit beside a button.
                    components: [
                        { type: 1, components: [
                            { type: 2, style: 1, label: 'Edit', custom_id: `mng_editbtn_${token}` },
                            ...searchAgainRow.components
                        ] }
                    ],
                    ephemeral: true
                });
            }

            // Multiple matches -- disambiguate via a select menu rather than guessing which one was
            // meant. NOTE (Components V2 lesson, see CLAUDE.md): a select menu (type 3) still needs
            // an Action Row (type 1) wrapper, even though this particular reply isn't a V2 container.
            // A select-menu interaction DOES support showModal() directly (unlike modal-submit, see
            // above), so Edit's `mng_pick_` handler further down doesn't need the same button
            // detour -- only the single-match-straight-from-a-modal-submit case does.
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

        // NOTE: the `mng_editbtn_` handler used to sit HERE, but that was a real bug -- it's a BUTTON
        // custom_id and this is the isModalSubmit() block, so a button click never reached it and the
        // Edit-loadout flow silently timed out. Moved to the isButton() block (search for
        // `mng_editbtn_` up there). Left this breadcrumb so it doesn't get "helpfully" re-added next
        // to its `mng_search_` sibling above -- they look adjacent conceptually but are different
        // interaction TYPES.
        // NOTE (fixed during review): this used to fetch unconditionally before branching on
        // customId, but the loadout-only routes below never touch seasonalDoc at all -- every
        // loadout modal submit was paying for a wasted findOne (and a throwaway `new
        // SeasonalData()` construction on a fresh install). Only fetch it for the branches that
        // actually use it. Loadout custom_ids all carry a mode suffix now (`add_loadout_MP`,
        // `modal_loadouts_bulk_add_DMZ`, etc. -- 2026-07-12 MP/DMZ page split), so this checks
        // prefixes rather than an exact-match list.
        const isLoadoutOnlyRoute = customId.startsWith('edit_loadout_') || customId.startsWith('add_loadout_')
            || customId.startsWith('modal_loadouts_bulk_add_') || customId.startsWith('modal_loadouts_bulk_remove_')
            || customId.startsWith('modal_loadouts_export5_') || customId.startsWith('modal_loadouts_exportcategory_');
        let seasonalDoc = null;
        if (!isLoadoutOnlyRoute) {
            seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
            if (!seasonalDoc) seasonalDoc = new SeasonalData({ docType: 'global' });
        }

        // --- START NEW SEASON (renamed from "Wipe Season", 2026-07-12) ---
        // Used to wipe draws+calendar the INSTANT this modal was submitted -- no confirmation at
        // all, unlike every other destructive action in this panel. Now just stashes the entered
        // title in `pendingSeasonWipes` (declared near the other manage-panel module-scope stores,
        // see parseMngId's block) and shows the same Confirm/Cancel step Purge uses -- the actual
        // wipe only happens from `mng_wipeconfirm_` below.
        if (customId === 'modal_wipe_season') {
            const newTitle = interaction.fields.getTextInputValue('season_title').trim();
            const token = randomUUID().slice(0, 8);
            pendingSeasonWipes.set(token, { newTitle });
            setTimeout(() => pendingSeasonWipes.delete(token), 10 * 60 * 1000).unref();

            return interaction.reply({
                content: `⚠️ **Are you sure?** This will rename the current season to **${newTitle}** and permanently wipe all Draws and Calendar data (Patch Notes history is kept). This cannot be undone.`,
                components: [{
                    type: 1, components: [
                        { type: 2, style: 4, label: 'Yes, Start New Season', custom_id: `mng_wipeconfirm_${token}` },
                        { type: 2, style: 2, label: 'Cancel', custom_id: `mng_wipecancel_${token}` }
                    ]
                }],
                ephemeral: true
            });
        }

        // --- MANAGE ADMINS: GRANT (2026-08-13, expanded same day for per-page permissions) ---
        // owner-only re-checked here even though the button that opens this modal already
        // re-checks (see the mng_act_ manageadmins branch) -- defense in depth, same reasoning as
        // the mng_ prefix guard existing alongside per-command admin checks elsewhere in this bot.
        if (customId === 'modal_admin_grant') {
            const { isOwner, invalidateAdminCache, parsePermissionsInput } = require('../utils/adminAccess');
            if (!isOwner(interaction.user.id)) {
                return interaction.reply({ content: "🔒 **Only the bot owner can manage the admin list.**", ephemeral: true });
            }
            const rawId = interaction.fields.getTextInputValue('discord_id').trim();
            const note = interaction.fields.getTextInputValue('note')?.trim() || '';
            // Strips <@123>/<@!123>/@ mention wrapping down to a bare id -- same tolerant parsing
            // shape as a plain-typed id, since Discord doesn't resolve a modal text field as a real
            // mention the way a slash-command user option would.
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
            const AdminUser = require('../models/AdminUser');
            await AdminUser.findOneAndUpdate(
                { discordId },
                { $set: { discordId, grantedBy: interaction.user.id, grantedAt: new Date(), note, permissions } },
                { upsert: true }
            );
            invalidateAdminCache();
            const { formatPermissions } = require('../utils/adminAccess');
            return interaction.followUp({ content: `✅ Granted admin access to <@${discordId}> — ${formatPermissions(permissions)}.${note ? ` (${note})` : ''}` });
        }

        // --- MANAGE ADMINS: EDIT PERMISSIONS (2026-08-13) --- updates ONE existing admin's
        // permissions array in place, by their Discord id (embedded in the customId from
        // mng_admin_editperms_<id>'s modal) -- this is how add/remove access actually happens now
        // (Harkirat's question: "what if I want to add more access or remove certain access" --
        // this button, prefilled with their current list, is the answer). Superseded the old
        // typed-id "Revoke Admin" modal entirely -- revoke is now a direct per-card button.
        if (customId.startsWith('modal_admin_editperms_')) {
            const { isOwner, invalidateAdminCache, parsePermissionsInput, formatPermissions } = require('../utils/adminAccess');
            if (!isOwner(interaction.user.id)) {
                return interaction.reply({ content: "🔒 **Only the bot owner can manage the admin list.**", ephemeral: true });
            }
            const discordId = customId.replace('modal_admin_editperms_', '');
            const rawPermissions = interaction.fields.getTextInputValue('permissions');
            const permissions = parsePermissionsInput(rawPermissions);
            if (!permissions) {
                return interaction.reply({ content: `❌ Couldn't understand "${rawPermissions}". Use \`all\`, \`manage\`, \`alerts\`, \`autobuild\`, or specific pages like \`manage.calendar, manage.draws\` (comma-separated).`, ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: true });
            const AdminUser = require('../models/AdminUser');
            const updated = await AdminUser.findOneAndUpdate({ discordId }, { $set: { permissions } }, { new: true });
            if (!updated) {
                return interaction.followUp({ content: '❌ That admin no longer exists (they may have just been revoked).' });
            }
            invalidateAdminCache();
            return interaction.followUp({ content: `✅ Updated <@${discordId}>'s permissions — ${formatPermissions(permissions)}.` });
        }

        // --- ANNOUNCEMENT: POST NEW (2026-08-13, redesigned same day) --- creates an independent
        // doc rather than overwriting anything -- see models/Announcement.js's header for why the
        // old singleton design was replaced.
        if (customId === 'modal_announce_post') {
            const text = interaction.fields.getTextInputValue('text').trim();
            const rawExpiry = interaction.fields.getTextInputValue('expiry');
            const { computeExpiresAt, generateAccentColor } = require('../utils/announcement');
            const expiresAt = computeExpiresAt(rawExpiry);
            if (expiresAt === undefined) {
                return interaction.reply({ content: `❌ "${rawExpiry}" wasn't understood -- leave it blank for the 60-day default, type a whole number of days, or type "never".`, ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: true });
            const Announcement = require('../models/Announcement');
            try {
                // Color is generated ONCE here, at creation -- never on edit (see
                // generateAccentColor's header in utils/announcement.js).
                await Announcement.create({ text, createdBy: interaction.user.id, expiresAt, color: generateAccentColor() });
            } catch (createError) {
                // REAL BUG found and fixed 2026-08-13 (Harkirat: "isn't creating... it's stuck") --
                // a stale MongoDB unique index (`docType_1`) survived the singleton->collection
                // redesign (Mongoose never drops indexes for fields removed from the schema), so
                // every SECOND announcement collided on `docType: null` and threw here, AFTER
                // deferReply() had already acknowledged the interaction -- with nothing wrapping
                // this call, that exception fell all the way to the outer crash-safety catch, which
                // just logs it, leaving the interaction deferred FOREVER (Discord's "thinking..."
                // spinner, indistinguishable from a hang). The stale index itself is fixed (dropped
                // from the dev DB); this try/catch is the hardening so ANY future failure here
                // surfaces a real error to the admin instead of silently hanging again.
                console.error('Failed to create announcement:', createError);
                return interaction.followUp({ content: `❌ Something went wrong saving that announcement: ${createError.message}` });
            }
            return interaction.followUp({ content: `✅ Posted a new announcement${expiresAt ? ` (expires <t:${Math.floor(expiresAt.getTime() / 1000)}:R>)` : ' (never expires)'}. Anyone who hasn't seen it yet will, on their next command.` });
        }

        // --- ANNOUNCEMENT: EDIT (2026-08-13) --- updates ONE existing doc in place by its own _id
        // (from mng_announce_edit_<id>'s modal) -- never touches any other announcement, and never
        // resets who's already seen this one (an edit is a correction, e.g. fixing a date, not a
        // new notice that should re-ping everyone who already read it).
        if (customId.startsWith('modal_announce_edit_')) {
            const id = customId.replace('modal_announce_edit_', '');
            const text = interaction.fields.getTextInputValue('text').trim();
            const rawExpiry = interaction.fields.getTextInputValue('expiry');
            const { computeExpiresAt } = require('../utils/announcement');
            const expiresAt = computeExpiresAt(rawExpiry);
            if (expiresAt === undefined) {
                return interaction.reply({ content: `❌ "${rawExpiry}" wasn't understood -- leave it blank for the 60-day default, type a whole number of days, or type "never".`, ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: true });
            const Announcement = require('../models/Announcement');
            let updated;
            try {
                updated = await Announcement.findByIdAndUpdate(id, { $set: { text, expiresAt } }, { new: true });
            } catch (updateError) {
                // Same hardening as modal_announce_post above -- never let a DB failure here fall
                // through to the outer catch and leave the interaction deferred forever.
                console.error('Failed to update announcement:', updateError);
                return interaction.followUp({ content: `❌ Something went wrong updating that announcement: ${updateError.message}` });
            }
            if (!updated) {
                return interaction.followUp({ content: '❌ That announcement no longer exists (it may have just been deleted or expired).' });
            }
            return interaction.followUp({ content: `✅ Updated the announcement${expiresAt ? ` (now expires <t:${Math.floor(expiresAt.getTime() / 1000)}:R>)` : ' (never expires)'}.` });
        }

        // --- BULK ADD/REPLACE BOTH DRAW CATEGORIES AT ONCE ---
        // custom_id is `modal_draws_bulk_{add|replace}_both`. One modal, two independently-optional
        // fields -- only whichever field was actually filled in gets touched. This is now the ONLY
        // draws bulk add/replace route (2026-07-12) -- the old per-category New-only/Returning-only
        // modals were removed once the button triplet condensed to one button per section; leaving
        // a field blank here already covers the single-category case.
        //
        // Replace's semantics changed 2026-07-12: used to wholesale-overwrite the whole array with
        // exactly what's pasted (anything not mentioned got deleted). Now upserts by fuzzy-matched
        // title -- a match updates that existing draw IN PLACE (keeps its _id), no match inserts it
        // as new, and anything NOT mentioned in the paste is left untouched (Purge already covers a
        // full wipe, so Replace doesn't need to double as one). `upsertDrawsByTitle` implements this;
        // Add still just appends everything parsed, same as before.
        if (customId === 'modal_draws_bulk_add_both' || customId === 'modal_draws_bulk_replace_both') {
            await interaction.deferReply({ ephemeral: true });
            const mode = customId === 'modal_draws_bulk_add_both' ? 'add' : 'replace';
            const newText = interaction.fields.getTextInputValue('new_text')?.trim();
            const returningText = interaction.fields.getTextInputValue('returning_text')?.trim();

            const updated = [];
            const allSkipped = [];
            const allWarnings = [];
            // Snapshot BEFORE mutating either array, so Undo can restore exactly what was there.
            const prevNew = seasonalDoc.newDraws;
            const prevReturning = seasonalDoc.returningDraws;

            if (newText) {
                const { validDraws, skipped, warnings } = await resolveThumbnailsForDraws(parseBulkDrawList(newText));
                const { finalArray, updatedCount, insertedCount } = mode === 'add'
                    ? { finalArray: [...seasonalDoc.newDraws, ...validDraws], updatedCount: 0, insertedCount: validDraws.length }
                    : upsertDrawsByTitle(seasonalDoc.newDraws, validDraws);
                finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
                seasonalDoc.newDraws = finalArray;
                // Actual titles, not just counts (the notes file, 2026-07-31 12:10 EDT) -- "added 2" told
                // you nothing about WHICH 2 without opening the page and checking yourself.
                const newTitleList = validDraws.map(d => `"${d.title}"`).join(', ');
                updated.push((mode === 'add'
                    ? `**New Draws:** added ${insertedCount} (now ${finalArray.length} total)`
                    : `**New Draws:** updated ${updatedCount}, added ${insertedCount} (now ${finalArray.length} total)`)
                    + (newTitleList ? `\n-# ${newTitleList}` : ''));
                allSkipped.push(...skipped);
                allWarnings.push(...warnings);
            }
            if (returningText) {
                const { validDraws, skipped, warnings } = await resolveThumbnailsForDraws(parseBulkDrawList(returningText));
                const { finalArray, updatedCount, insertedCount } = mode === 'add'
                    ? { finalArray: [...seasonalDoc.returningDraws, ...validDraws], updatedCount: 0, insertedCount: validDraws.length }
                    : upsertDrawsByTitle(seasonalDoc.returningDraws, validDraws);
                finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
                seasonalDoc.returningDraws = finalArray;
                const returningTitleList = validDraws.map(d => `"${d.title}"`).join(', ');
                updated.push((mode === 'add'
                    ? `**Returning Draws:** added ${insertedCount} (now ${finalArray.length} total)`
                    : `**Returning Draws:** updated ${updatedCount}, added ${insertedCount} (now ${finalArray.length} total)`)
                    + (returningTitleList ? `\n-# ${returningTitleList}` : ''));
                allSkipped.push(...skipped);
                allWarnings.push(...warnings);
            }

            if (updated.length === 0) {
                return interaction.followUp({ content: '❌ Both fields were left blank -- nothing was changed.' });
            }

            await seasonalDoc.save();
            const undoToken = registerUndo(`Bulk ${mode === 'add' ? 'Add' : 'Replace'} Draws`, async () => {
                const doc = await SeasonalData.findOne({ docType: 'global' });
                if (newText) doc.newDraws = prevNew;
                if (returningText) doc.returningDraws = prevReturning;
                await doc.save();
            });

            let confirmation = `✅ **Bulk ${mode === 'add' ? 'Add' : 'Replace'} Complete!**\n${updated.join('\n')}`;
            if (allSkipped.length) confirmation += `\n⚠️ Skipped (no URL given and nothing cached yet): ${allSkipped.join(', ')}`;
            if (allWarnings.length) confirmation += `\n⚠️ Cloudinary caching failed, kept the original URL instead: ${allWarnings.join('; ')}`;
            return interaction.followUp({ content: confirmation, components: [undoButtonRow(undoToken)] });
        }

        // --- BULK DELETE DRAWS ---
        // custom_id is `modal_draws_bulk_remove_{new|returning|either}` -- only the field(s) that
        // variant's modal actually included exist on `interaction.fields`, so this reads the type
        // from the custom_id rather than blindly calling getTextInputValue on both (which throws for
        // a field that isn't on the modal). Fuzzy-matches each pasted title (utils/search.js's
        // fuzzyMatch, same punctuation-insensitive matching used everywhere else in the bot) against
        // the target array and removes hits -- reports both what was removed and what didn't match
        // anything, so a typo'd title doesn't just silently do nothing.
        // 2-step confirm added 2026-07-12 -- this used to delete the instant the modal was
        // submitted, no confirmation at all. Runs the fuzzy-match removal as a DRY RUN first (no
        // save), shows what it found via the same Confirm/Cancel pattern as Purge/single-Delete, and
        // only actually saves from `mng_bulkdelconfirm_` below.
        if (customId.startsWith('modal_draws_bulk_remove_')) {
            const drawType = customId.replace('modal_draws_bulk_remove_', ''); // 'new' | 'returning' | 'either'
            const newTitlesRaw = drawType !== 'returning' ? interaction.fields.getTextInputValue('new_titles')?.trim() : '';
            const returningTitlesRaw = drawType !== 'new' ? interaction.fields.getTextInputValue('returning_titles')?.trim() : '';

            const removeFrom = (array, titlesRaw) => {
                const requested = titlesRaw.split('\n').map(t => t.trim()).filter(Boolean);
                const removed = [];
                const notFound = [];
                let remaining = array;
                for (const title of requested) {
                    const match = remaining.find(d => fuzzyMatch(title, d.title));
                    if (match) {
                        removed.push(match.title);
                        remaining = remaining.filter(d => d !== match);
                    } else {
                        notFound.push(title);
                    }
                }
                return { remaining, removed, notFound };
            };

            const summary = [];
            let newRemaining = null, returningRemaining = null;
            let anyRemoved = false;
            if (newTitlesRaw) {
                const { remaining, removed, notFound } = removeFrom(seasonalDoc.newDraws, newTitlesRaw);
                newRemaining = remaining;
                if (removed.length) { summary.push(`Removed from New: ${removed.join(', ')}`); anyRemoved = true; }
                if (notFound.length) summary.push(`⚠️ Not found in New: ${notFound.join(', ')}`);
            }
            if (returningTitlesRaw) {
                const { remaining, removed, notFound } = removeFrom(seasonalDoc.returningDraws, returningTitlesRaw);
                returningRemaining = remaining;
                if (removed.length) { summary.push(`Removed from Returning: ${removed.join(', ')}`); anyRemoved = true; }
                if (notFound.length) summary.push(`⚠️ Not found in Returning: ${notFound.join(', ')}`);
            }

            if (!anyRemoved) {
                return interaction.reply({ content: `❌ Nothing matched -- nothing to delete.\n${summary.join('\n')}`, ephemeral: true });
            }

            const token = randomUUID().slice(0, 8);
            pendingBulkDeletes.set(token, {
                description: 'Bulk Delete Draws',
                summary,
                apply: async () => {
                    const doc = await SeasonalData.findOne({ docType: 'global' });
                    const prevNew = doc.newDraws, prevReturning = doc.returningDraws;
                    if (newRemaining !== null) doc.newDraws = newRemaining;
                    if (returningRemaining !== null) doc.returningDraws = returningRemaining;
                    await doc.save();
                    return registerUndo('Bulk Delete Draws', async () => {
                        const d = await SeasonalData.findOne({ docType: 'global' });
                        if (newRemaining !== null) d.newDraws = prevNew;
                        if (returningRemaining !== null) d.returningDraws = prevReturning;
                        await d.save();
                    });
                }
            });
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

        // --- BULK ADD/REPLACE CALENDAR EVENTS ---
        // custom_id is `modal_calendar_bulk_{add|replace}` -- `add` (new 2026-07-12, "Add Multiple")
        // appends onto the existing calendar; `replace`'s semantics changed the same day Draws'
        // did -- was a wholesale wipe-then-replace of the whole array, now upserts by fuzzy-matched
        // title via upsertEventsByTitle (update in place if found, insert if not) -- Purge already
        // covers a full wipe, so Replace doesn't need to double as one anymore. Parses a bulk
        // bullet-separated paste — "M/D - M/D | Title" or "M/D - All Season | Title" — into
        // { title, startDate, endDate, isOngoing } objects via parseBulkEvents either way.
        if (customId === 'modal_calendar_bulk_add' || customId === 'modal_calendar_bulk_replace') {
            // Fixed 2026-08-07 12:24 EDT: this branch did the seasonalDoc fetch (shared, above) + parse
            // + fuzzy-match (replace mode) + save() entirely inside Discord's 3-second interaction-ack
            // window with no deferReply -- the sibling "BULK ADD/REPLACE BOTH DRAW CATEGORIES" branch a
            // few lines up (line ~2785) already defers first for exactly this reason. Once the window
            // was blown, `interaction.reply()` below would fail on a dead token (Discord shows "didn't
            // respond in time") even though `seasonalDoc.save()` had already succeeded -- so the data
            // WAS saved, just with no visible confirmation, which is the trap that made this look broken.
            await interaction.deferReply({ ephemeral: true });
            const mode = customId === 'modal_calendar_bulk_add' ? 'add' : 'replace';
            const bulkText = interaction.fields.getTextInputValue('bulk_text');
            const parsedEvents = parseBulkEvents(bulkText);

            const newEventDocs = parsedEvents.map(e => ({
                title: e.title,
                date: e.startDate,
                endDate: e.isOngoing ? null : e.endDate,
                isOngoing: e.isOngoing,
                category: e.category
            }));

            const prevCalendar = seasonalDoc.calendar;
            let finalArray, updatedCount = 0, insertedCount = newEventDocs.length;
            if (mode === 'add') {
                finalArray = [...seasonalDoc.calendar, ...newEventDocs];
            } else {
                ({ finalArray, updatedCount, insertedCount } = upsertEventsByTitle(seasonalDoc.calendar, newEventDocs));
            }

            // AUTO-SORT: Keep the timeline in chronological order
            finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
            seasonalDoc.calendar = finalArray;
            await seasonalDoc.save();

            const undoToken = registerUndo(`Bulk ${mode === 'add' ? 'Add' : 'Replace'} Calendar`, async () => {
                const doc = await SeasonalData.findOne({ docType: 'global' });
                doc.calendar = prevCalendar;
                await doc.save();
            });

            const summary = mode === 'add'
                ? `Added ${insertedCount} event(s) (now **${finalArray.length}** total).`
                : `Updated ${updatedCount}, added ${insertedCount} (now **${finalArray.length}** total).`;
            // Per-category breakdown of THIS submission's own titles (added 2026-08-07 21:06 EDT,
            // Harkirat's direct request after a mis-typed source paste silently landed 7 "MP
            // Mode"/"BR" titles in Events -- the classifier itself was correct, but the confirmation
            // message gave no way to catch a bad source paste without opening /calendar and
            // cross-checking by eye). Grouped from `newEventDocs` (not the full `finalArray`) so a
            // Replace submission only reports what THIS paste actually classified, not the whole
            // season's calendar. Capped so one giant bulk paste can't blow Discord's 2000-char content
            // limit on the reply itself.
            const CATEGORY_LABELS = { draw: 'Draws', event: 'Events', playlist: 'Playlists' };
            const byCategory = { draw: [], event: [], playlist: [] };
            for (const e of newEventDocs) (byCategory[e.category] || byCategory.event).push(e.title);
            const breakdownLines = ['draw', 'event', 'playlist']
                .filter(cat => byCategory[cat].length > 0)
                .map(cat => {
                    const titles = byCategory[cat];
                    const joined = titles.join(', ');
                    const line = `**${CATEGORY_LABELS[cat]} (${titles.length}):** ${joined}`;
                    return line.length > 400 ? `${line.slice(0, 397)}...` : line;
                });
            return interaction.editReply({
                content: `✅ **Bulk Calendar ${mode === 'add' ? 'Add' : 'Replace'} Complete!**\n${summary} Sorted chronologically.\n${breakdownLines.join('\n')}`,
                components: [undoButtonRow(undoToken)]
            });
        }

        // --- BULK REMOVE CALENDAR EVENTS ---
        // Same fuzzy-match-and-report convention as the draws bulk-remove route above, and the same
        // 2-step confirm (2026-07-12) -- dry-run first, actual save only on mng_bulkdelconfirm_.
        if (customId === 'modal_calendar_bulk_remove') {
            const requested = interaction.fields.getTextInputValue('titles').split('\n').map(t => t.trim()).filter(Boolean);

            const removed = [];
            const notFound = [];
            let remaining = seasonalDoc.calendar;
            for (const title of requested) {
                const match = remaining.find(e => fuzzyMatch(title, e.title));
                if (match) {
                    removed.push(match.title);
                    remaining = remaining.filter(e => e !== match);
                } else {
                    notFound.push(title);
                }
            }

            if (removed.length === 0) {
                return interaction.reply({ content: `❌ Nothing matched -- nothing to delete.${notFound.length ? `\n⚠️ Not found: ${notFound.join(', ')}` : ''}`, ephemeral: true });
            }

            const summary = [`Removed: ${removed.join(', ')}`];
            if (notFound.length) summary.push(`⚠️ Not found: ${notFound.join(', ')}`);

            const token = randomUUID().slice(0, 8);
            pendingBulkDeletes.set(token, {
                description: 'Bulk Delete Calendar Events',
                summary,
                apply: async () => {
                    const doc = await SeasonalData.findOne({ docType: 'global' });
                    const prevCalendar = doc.calendar;
                    doc.calendar = remaining;
                    await doc.save();
                    return registerUndo('Bulk Delete Calendar Events', async () => {
                        const d = await SeasonalData.findOne({ docType: 'global' });
                        d.calendar = prevCalendar;
                        await d.save();
                    });
                }
            });
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

        // --- ADD SINGLE CALENDAR EVENT ---
        // A blank End Date means the event runs until the Battle Pass ends (isOngoing), same
        // semantics as the bulk parser's "All Season" handling -- see parseBulkEvents.
        if (customId === 'modal_calendar_add') {
            await interaction.deferReply({ ephemeral: true });
            const title = interaction.fields.getTextInputValue('title').trim();
            const startDateStr = interaction.fields.getTextInputValue('start_date');
            const startDate = parseAdminDate(startDateStr);
            if (!startDate) return interaction.followUp({ content: `❌ Start date "${startDateStr}" wasn't understood -- nothing was saved.` });
            const endDateStr = interaction.fields.getTextInputValue('end_date')?.trim();
            const isOngoing = !endDateStr;
            const endDate = isOngoing ? null : parseAdminDate(endDateStr);
            if (!isOngoing && !endDate) return interaction.followUp({ content: `❌ End date "${endDateStr}" wasn't understood -- nothing was saved.` });
            const category = normalizeCalendarCategory(interaction.fields.getTextInputValue('category'), title);

            seasonalDoc.calendar.push({ title, date: startDate, endDate, isOngoing, category });
            seasonalDoc.calendar.sort((a, b) => new Date(a.date) - new Date(b.date));
            await seasonalDoc.save();

            // Real Discord timestamps instead of plain toDateString() text (the notes file, 2026-07-31
            // 12:10 EDT) -- renders in the viewer's own local time/format instead of a fixed string.
            return interaction.followUp({ content: `✅ **Event Added:** "${title}" (<t:${Math.floor(startDate.getTime() / 1000)}:D> -- ${isOngoing ? 'All Season' : `<t:${Math.floor(endDate.getTime() / 1000)}:D>`}).` });
        }

        // --- PAGE BANNERS (2026-07-31 17:20 EDT) ---
        // 3 independently-clearable fields in one modal -- each is handled on its own: a filled
        // field re-hosts through calendarBannerCache (falls back to the raw URL on a Cloudinary
        // hiccup, never blocks the save); a blank field that previously had a value clears it (best-
        // effort Cloudinary delete + resets the DB field to ''); a blank field that was already
        // empty is a no-op, not reported as a change.
        if (customId === 'modal_calendar_banners') {
            await interaction.deferReply({ ephemeral: true });
            const { cacheBannerImage, clearBannerImage } = require('../utils/calendarBannerCache');
            const fieldMap = [
                { field: 'draws_banner', urlKey: 'drawsBannerUrl', page: 'draws', label: 'Draws' },
                { field: 'events_banner', urlKey: 'eventsBannerUrl', page: 'events', label: 'Events' },
                { field: 'playlists_banner', urlKey: 'playlistsBannerUrl', page: 'playlists', label: 'Playlists' }
            ];
            const changes = [];
            for (const { field, urlKey, page, label } of fieldMap) {
                const raw = interaction.fields.getTextInputValue(field)?.trim();
                if (!raw) {
                    if (seasonalDoc[urlKey]) {
                        await clearBannerImage(page);
                        seasonalDoc[urlKey] = '';
                        changes.push(`${label}: cleared`);
                    }
                    continue;
                }
                const result = await cacheBannerImage(page, raw);
                seasonalDoc[urlKey] = result.url || '';
                changes.push(`${label}: banner set${result.cached ? '' : ' (not re-hosted -- Cloudinary hiccup, using the raw URL)'}`);
            }
            await seasonalDoc.save();
            return interaction.followUp({
                content: changes.length
                    ? `✅ **Calendar Banners Updated!**\n${changes.map(c => `-# ${c}`).join('\n')}`
                    : 'ℹ️ No changes made.'
            });
        }

        // --- SAVE EDITED CALENDAR EVENT ---
        if (customId.startsWith('edit_calendar_')) {
            await interaction.deferReply({ ephemeral: true });
            const targetId = customId.replace('edit_calendar_', '');
            const targetEvent = seasonalDoc.calendar.find(e => e._id.toString() === targetId);

            if (targetEvent) {
                const startDateStr = interaction.fields.getTextInputValue('start_date');
                const parsedStart = parseAdminDate(startDateStr);
                if (!parsedStart) return interaction.followUp({ content: `❌ Start date "${startDateStr}" wasn't understood -- nothing was saved.` });
                const endDateStr = interaction.fields.getTextInputValue('end_date')?.trim();
                const isOngoing = !endDateStr;
                const parsedEnd = isOngoing ? null : parseAdminDate(endDateStr);
                if (!isOngoing && !parsedEnd) return interaction.followUp({ content: `❌ End date "${endDateStr}" wasn't understood -- nothing was saved.` });

                targetEvent.title = interaction.fields.getTextInputValue('title').trim();
                targetEvent.date = parsedStart;
                targetEvent.isOngoing = isOngoing;
                targetEvent.endDate = parsedEnd;
                targetEvent.category = normalizeCalendarCategory(interaction.fields.getTextInputValue('category'), targetEvent.title);

                seasonalDoc.calendar.sort((a, b) => new Date(a.date) - new Date(b.date));
                await seasonalDoc.save();
                return interaction.followUp({ content: `✅ **Event Updated:** "${targetEvent.title}" (<t:${Math.floor(new Date(targetEvent.date).getTime() / 1000)}:D> -- ${targetEvent.isOngoing ? 'All Season' : `<t:${Math.floor(new Date(targetEvent.endDate).getTime() / 1000)}:D>`}).` });
            }
        }

        // --- PATCH NOTES (single "current entry" model, 2026-07-12 redesign) ---
        // All 3 actions operate on the LAST item in patchNotes[] -- the one whose title stays synced
        // to currentSeasonTitle (see the Season Titles+Deadlines handler below) -- rather than a
        // search-and-pick flow. If none exists yet at all (fresh install, or right after a Wipe
        // Season), whichever of these 3 is submitted first creates it.
        const getOrCreateCurrentPatch = () => {
            if (seasonalDoc.patchNotes.length === 0) {
                seasonalDoc.patchNotes.push({ title: seasonalDoc.currentSeasonTitle || 'Untitled Season', description: '', releaseDate: new Date(), images: [] });
            }
            return seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1];
        };

        if (customId === 'modal_patch_dateinfo') {
            await interaction.deferReply({ ephemeral: true });
            const current = getOrCreateCurrentPatch();
            // parseReleaseDateTime (not the plain parseAdminDate every other admin date field uses)
            // -- patch notes release times are typed in Harkirat's own local clock whenever a time is
            // included at all; see the function's own comment in adminParser.js for why this field
            // alone gets that treatment.
            const UserPreference = require('../models/UserPreference');
            const adminPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
            current.releaseDate = parseReleaseDateTime(interaction.fields.getTextInputValue('release_date'), adminPrefs?.timezone);
            current.description = interaction.fields.getTextInputValue('description')?.trim() || '';
            // Manual title override (2026-07-24) -- blank clears it, which reverts the effective
            // display title back to the auto-synced `title` (currentSeasonTitle) -- see the schema
            // comment on titleOverride + patchnotes.js's displayTitle().
            current.titleOverride = interaction.fields.getTextInputValue('season_title')?.trim() || '';
            await seasonalDoc.save();
            // Keep this patch's cached images' Cloudinary metadata (release date/season) in sync
            // (2026-07-21) -- the release date just changed and applies to every image of this entry.
            const { syncPatchEntryMetadata } = require('../utils/patchNotesCache');
            const { displayTitle } = require('../commands/patchnotes');
            const effectiveTitle = displayTitle(current);
            await syncPatchEntryMetadata(current, effectiveTitle);
            return interaction.followUp({ content: `✅ **Patch Notes Date/Info Updated!** ${effectiveTitle}` });
        }

        if (customId === 'modal_patch_urls_1' || customId === 'modal_patch_urls_2') {
            await interaction.deferReply({ ephemeral: true });
            const slot = customId === 'modal_patch_urls_1' ? 1 : 2;
            const current = getOrCreateCurrentPatch();
            // Each of the 5 URLs is now its own field (2026-07-12) -- a blank field means "no image
            // in this slot", so the slice can have gaps skipped rather than needing every field filled.
            const rawUrls = [0, 1, 2, 3, 4]
                .map(i => interaction.fields.getTextInputValue(`url${i}`)?.trim())
                .filter(url => url && url.startsWith('http'));

            // Re-host each submitted URL into this season's own Cloudinary folder (2026-07-13, see
            // utils/patchNotesCache.js) keyed by this patch note's own `_id` -- NOT the season
            // title, since a title can be renamed later via `modal_season_titles_deadlines` without
            // touching this doc's `_id`. `slotOffset` maps each field to its ABSOLUTE position in
            // images[] (URLs 1 = 0-4, URLs 2 = 5-9) so re-submitting a slot overwrites the same
            // cached asset in place rather than accumulating duplicates. A Cloudinary hiccup must
            // never block the save -- cachePatchImage() falls back to the raw URL on failure, same
            // philosophy as resolveThumbnail() for draw thumbnails.
            const { cachePatchImage } = require('../utils/patchNotesCache');
            const { displayTitle } = require('../commands/patchnotes');
            const patchId = current._id.toString();
            const slotOffset = slot === 1 ? 0 : 5;
            // Structured metadata (2026-07-21) -- each cached image carries its season, order, and
            // release date. displayTitle() prefers a manual titleOverride (2026-07-24) and strips any
            // legacy "Balance Changes for..." prefix, so Patch_Season always matches what's shown.
            const patchMeta = { season: displayTitle(current), releaseDate: current.releaseDate };
            const newSlice = [];
            for (let i = 0; i < rawUrls.length; i++) {
                const result = await cachePatchImage(patchId, slotOffset + i, rawUrls[i], patchMeta);
                newSlice.push(result.url);
            }

            // URLs 1 owns images[0..4], URLs 2 owns images[5..9] -- each submit only replaces its own
            // half, preserving whatever the other slot has saved.
            const otherSlice = slot === 1 ? current.images.slice(5, 10) : current.images.slice(0, 5);
            current.images = slot === 1 ? [...newSlice, ...otherSlice] : [...otherSlice, ...newSlice];

            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Patch Notes URLs ${slot} Updated!** ${displayTitle(current)} now has ${current.images.length} image(s) total.` });
        }

        // "Add New Season" (2026-07-24) -- always PUSHES a brand-new patchNotes[] entry, becoming the
        // new "current" entry (the old current entry automatically becomes a past season -- it's
        // simply no longer the last item in the array). URLs come in as two multi-line fields (one
        // URL per line) instead of 5 individually-addressable Short fields, since there's no existing
        // entry to spread this across separate dateinfo/urls1/urls2 actions the way the current-entry
        // flow does -- matches Harkirat's own mockup shape.
        if (customId === 'modal_patch_addseason') {
            await interaction.deferReply({ ephemeral: true });
            const parseUrlLines = text => (text || '').split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http')).slice(0, 5);
            const urlList = [...parseUrlLines(interaction.fields.getTextInputValue('urls1')), ...parseUrlLines(interaction.fields.getTextInputValue('urls2'))];

            // See modal_patch_dateinfo above -- patch notes release times are local-clock, not UTC-0,
            // whenever a time is actually typed alongside the date.
            const AddSeasonUserPreference = require('../models/UserPreference');
            const addSeasonAdminPrefs = await AddSeasonUserPreference.findOne({ discordId: interaction.user.id });
            seasonalDoc.patchNotes.push({
                title: seasonalDoc.currentSeasonTitle || 'Untitled Season',
                titleOverride: interaction.fields.getTextInputValue('season_title')?.trim() || '',
                description: interaction.fields.getTextInputValue('description')?.trim() || '',
                releaseDate: parseReleaseDateTime(interaction.fields.getTextInputValue('release_date'), addSeasonAdminPrefs?.timezone),
                images: []
            });
            const newEntry = seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1];

            // Re-host each submitted URL into this new entry's own Cloudinary folder, same pipeline
            // urls1/urls2 use for the current entry (see the comment on that handler above).
            const { cachePatchImage } = require('../utils/patchNotesCache');
            const { displayTitle } = require('../commands/patchnotes');
            const patchId = newEntry._id.toString();
            const patchMeta = { season: displayTitle(newEntry), releaseDate: newEntry.releaseDate };
            const cachedUrls = [];
            for (let i = 0; i < urlList.length; i++) {
                const result = await cachePatchImage(patchId, i, urlList[i], patchMeta);
                cachedUrls.push(result.url);
            }
            newEntry.images = cachedUrls;

            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **New Season Added!** "${displayTitle(newEntry)}" is now the Current Season (${cachedUrls.length} image(s)). The previous entry has moved to Past Seasons.` });
        }

        // "Past Seasons" edit (2026-07-24) -- same field shape as Add New Season above, but updates
        // ONE SPECIFIC existing entry in place (picked via the page's mng_patchseason_pick select
        // menu, addressed here by its own `_id` baked into the custom_id) -- never touches which
        // entry is "current." `.id()` is Mongoose's built-in DocumentArray subdocument lookup.
        if (customId.startsWith('modal_patch_editseason_')) {
            await interaction.deferReply({ ephemeral: true });
            const entryId = customId.replace('modal_patch_editseason_', '');
            const entry = seasonalDoc.patchNotes.id(entryId);
            if (!entry) return await interaction.followUp({ content: '❌ That season no longer exists -- it may have been changed or removed since this modal opened.' });

            entry.titleOverride = interaction.fields.getTextInputValue('season_title')?.trim() || '';
            // See modal_patch_dateinfo above -- local-clock, not UTC-0, whenever a time is typed.
            const EditSeasonUserPreference = require('../models/UserPreference');
            const editSeasonAdminPrefs = await EditSeasonUserPreference.findOne({ discordId: interaction.user.id });
            entry.releaseDate = parseReleaseDateTime(interaction.fields.getTextInputValue('release_date'), editSeasonAdminPrefs?.timezone);
            entry.description = interaction.fields.getTextInputValue('description')?.trim() || '';

            const parseUrlLines = text => (text || '').split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http')).slice(0, 5);
            const urlList = [...parseUrlLines(interaction.fields.getTextInputValue('urls1')), ...parseUrlLines(interaction.fields.getTextInputValue('urls2'))];

            const { cachePatchImage } = require('../utils/patchNotesCache');
            const { displayTitle } = require('../commands/patchnotes');
            const patchId = entry._id.toString();
            const patchMeta = { season: displayTitle(entry), releaseDate: entry.releaseDate };
            const cachedUrls = [];
            for (let i = 0; i < urlList.length; i++) {
                const result = await cachePatchImage(patchId, i, urlList[i], patchMeta);
                cachedUrls.push(result.url);
            }
            entry.images = cachedUrls;

            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Past Season Updated!** "${displayTitle(entry)}" now has ${cachedUrls.length} image(s).` });
        }

        // --- SEASON TITLES + DEADLINES (merged) ---
        // Replaces the old separate "/manage season titles" (4-title modal) and "Edit Season
        // Deadlines" (3-date modal) with one action -- each of the 3 deadline fields carries both a
        // title and an end date on one line ("Battle Pass, August 28"), split apart via
        // adminParser.js's splitTitleDate(). A blank line leaves that title+date pair untouched
        // (same partial-update convention the old deadlines modal already used).
        if (customId === 'modal_season_titles_deadlines') {
            await interaction.deferReply({ ephemeral: true });

            seasonalDoc.currentSeasonTitle = interaction.fields.getTextInputValue('main_title').trim();

            // Unrecognized date text (e.g. a "TDB" typo for "TBD") used to silently fall back to the
            // literal current instant via parseAdminDate -- see that function's header. Now it
            // returns null instead, so an unparseable date is treated the same as a blank one (field
            // left untouched) rather than corrupted, and the admin gets told which line was skipped.
            const skippedDates = [];
            // Typing the literal word "TBD" (case-insensitive) is now a real, explicit directive --
            // added 2026-07-31 14:00 EDT -- rather than unparseable text that gets skipped. Clears
            // the Date field and sets its matching `${dateField}TBD` flag; seasonend.js/calendar.js
            // both read that flag to show "TBD" and treat the deadline as indefinitely running.
            const applyLine = (line, titleField, dateField, label) => {
                const { title, dateStr } = splitTitleDate(line);
                if (title) seasonalDoc[titleField] = title;
                if (dateStr) {
                    if (dateStr.trim().toLowerCase() === 'tbd') {
                        seasonalDoc[dateField] = null;
                        seasonalDoc[`${dateField}TBD`] = true;
                    } else {
                        const parsed = parseAdminDate(dateStr);
                        if (parsed) {
                            seasonalDoc[dateField] = parsed;
                            seasonalDoc[`${dateField}TBD`] = false;
                        } else {
                            skippedDates.push(`${label} ("${dateStr}")`);
                        }
                    }
                }
            };
            applyLine(interaction.fields.getTextInputValue('bp_line'), 'bpTitle', 'bpEnd', 'Battle Pass');
            applyLine(interaction.fields.getTextInputValue('rank_line'), 'rankTitle', 'rankEnd', 'Ranked');
            applyLine(interaction.fields.getTextInputValue('dmz_line'), 'dmzTitle', 'dmzEnd', 'DMZ');

            // patchNotes[].title is captured independently at "Add Patch Notes" time (so older,
            // past-season entries keep their own historical title forever) -- but the MOST RECENT
            // entry always represents the season that's currently live, so keep it in sync here.
            // Without this, renaming a typo'd season title silently left the current patch notes
            // entry (and therefore the default /patch notes view) showing the old name.
            if (seasonalDoc.patchNotes.length > 0) {
                seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1].title = seasonalDoc.currentSeasonTitle;
            }

            await seasonalDoc.save();
            // The most-recent patch's season title just changed -- re-sync its cached images'
            // Patch_Season metadata to match (2026-07-21). Best-effort; keyed by the patch _id, which
            // the rename never touches.
            if (seasonalDoc.patchNotes.length > 0) {
                const { syncPatchEntryMetadata } = require('../utils/patchNotesCache');
                const { cleanPatchTitle: cleanTitleForMeta } = require('../commands/patchnotes');
                const latestPatch = seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1];
                await syncPatchEntryMetadata(latestPatch, cleanTitleForMeta(latestPatch.title));
            }
            let confirmation = `✅ **Season Titles & Deadlines Updated!** The \`/season end\` module has been synced.`;
            if (skippedDates.length > 0) confirmation += `\n⚠️ Date not understood, left unchanged: ${skippedDates.join(', ')}.`;
            return interaction.followUp({ content: confirmation });
        }

        // --- NEXT SEASON DRAFT: submit handlers (2026-07-30 22:24 EDT) ---
        // Same parsing as their live equivalents above (splitTitleDate/parseAdminDate,
        // parseBulkDrawList, parseBulkEvents), writing into `seasonalDoc.draft.*` instead of the
        // top-level fields -- none of this touches what's currently live.
        if (customId === 'modal_draft_titles_dates') {
            await interaction.deferReply({ ephemeral: true });
            if (!seasonalDoc.draft) seasonalDoc.draft = {};
            const mainTitle = interaction.fields.getTextInputValue('main_title').trim();
            if (mainTitle) seasonalDoc.draft.currentSeasonTitle = mainTitle;

            const skippedDraftDates = [];
            const applyDraftLine = (line, titleField, dateField, label) => {
                const { title, dateStr } = splitTitleDate(line);
                if (title) seasonalDoc.draft[titleField] = title;
                if (dateStr) {
                    if (dateStr.trim().toLowerCase() === 'tbd') {
                        seasonalDoc.draft[dateField] = null;
                        seasonalDoc.draft[`${dateField}TBD`] = true;
                    } else {
                        const parsed = parseAdminDate(dateStr);
                        if (parsed) {
                            seasonalDoc.draft[dateField] = parsed;
                            seasonalDoc.draft[`${dateField}TBD`] = false;
                        } else {
                            skippedDraftDates.push(`${label} ("${dateStr}")`);
                        }
                    }
                }
            };
            applyDraftLine(interaction.fields.getTextInputValue('bp_line'), 'bpTitle', 'bpEnd', 'Battle Pass');
            applyDraftLine(interaction.fields.getTextInputValue('rank_line'), 'rankTitle', 'rankEnd', 'Ranked');
            applyDraftLine(interaction.fields.getTextInputValue('dmz_line'), 'dmzTitle', 'dmzEnd', 'DMZ');
            seasonalDoc.draft.active = true;
            seasonalDoc.markModified('draft');
            await seasonalDoc.save();
            let draftConfirmation = '✅ **Draft Titles & Deadlines Staged!** Nothing is live yet — use Promote to Live when ready.';
            if (skippedDraftDates.length > 0) draftConfirmation += `\n⚠️ Date not understood, left unchanged: ${skippedDraftDates.join(', ')}.`;
            return interaction.followUp({ content: draftConfirmation });
        }

        if (customId === 'modal_draft_bulk_draws') {
            await interaction.deferReply({ ephemeral: true });
            const newText = interaction.fields.getTextInputValue('new_text')?.trim();
            const returningText = interaction.fields.getTextInputValue('returning_text')?.trim();
            if (!newText && !returningText) {
                return interaction.followUp({ content: '❌ Both fields were left blank -- nothing was changed.' });
            }
            if (!seasonalDoc.draft) seasonalDoc.draft = {};
            const summary = [];
            if (newText) {
                const { validDraws } = await resolveThumbnailsForDraws(parseBulkDrawList(newText));
                validDraws.sort((a, b) => new Date(a.date) - new Date(b.date));
                seasonalDoc.draft.newDraws = validDraws;
                summary.push(`New Draws: staged ${validDraws.length}`);
            }
            if (returningText) {
                const { validDraws } = await resolveThumbnailsForDraws(parseBulkDrawList(returningText));
                validDraws.sort((a, b) => new Date(a.date) - new Date(b.date));
                seasonalDoc.draft.returningDraws = validDraws;
                summary.push(`Returning Draws: staged ${validDraws.length}`);
            }
            seasonalDoc.draft.active = true;
            seasonalDoc.markModified('draft');
            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Draft Draws Staged!**\n${summary.join('\n')}\nNothing is live yet — use Promote to Live when ready.` });
        }

        if (customId === 'modal_draft_bulk_calendar') {
            await interaction.deferReply({ ephemeral: true });
            const bulkText = interaction.fields.getTextInputValue('bulk_text');
            const parsedEvents = parseBulkEvents(bulkText);
            const eventDocs = parsedEvents.map(e => ({
                title: e.title, date: e.startDate, endDate: e.isOngoing ? null : e.endDate, isOngoing: e.isOngoing, category: e.category
            })).sort((a, b) => new Date(a.date) - new Date(b.date));
            if (!seasonalDoc.draft) seasonalDoc.draft = {};
            seasonalDoc.draft.calendar = eventDocs;
            seasonalDoc.draft.active = true;
            seasonalDoc.markModified('draft');
            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Draft Calendar Staged!** ${eventDocs.length} event(s). Nothing is live yet — use Promote to Live when ready.` });
        }

        // --- SAVE EDITED DRAW ---
        if (customId.startsWith('edit_draw_')) {
            await interaction.deferReply({ ephemeral: true });
            const [_, __, targetId, drawType] = customId.split('_');

            // Find and update the exact object in the array
            const arrayTarget = drawType === 'new' ? seasonalDoc.newDraws : seasonalDoc.returningDraws;
            const drawIndex = arrayTarget.findIndex(d => d._id.toString() === targetId);

            if (drawIndex > -1) {
                const drawDateStr = interaction.fields.getTextInputValue('date');
                const parsedDrawDate = parseAdminDate(drawDateStr);
                if (!parsedDrawDate) return interaction.followUp({ content: `❌ Date "${drawDateStr}" wasn't understood -- nothing was saved.` });
                const newTitle = toTitleCase(interaction.fields.getTextInputValue('title'));
                arrayTarget[drawIndex].title = newTitle;
                arrayTarget[drawIndex].date = parsedDrawDate;

                // URL field is now optional (2026-07-12) -- blank reuses whatever's cached in
                // Cloudinary for this draw's (possibly just-renamed) title; see
                // utils/cloudinaryCache.js. A blank field with no cache hit at all is a real
                // validation error -- the draw needs SOME thumbnail, so this rejects the edit
                // rather than saving with a broken image field.
                const rawUrl = interaction.fields.getTextInputValue('url');
                const thumbResult = await resolveThumbnail(newTitle, rawUrl);
                if (!thumbResult.url) {
                    return interaction.followUp({ content: `❌ No URL provided and no cached image found for "${newTitle}" -- provide a thumbnail URL.` });
                }
                arrayTarget[drawIndex].thumbnailUrl = thumbResult.url;

                // Re-parse the text area items back into objects
                const rawItems = interaction.fields.getTextInputValue('items');
                arrayTarget[drawIndex].items = rawItems.split('\n').filter(l => l.trim().length > 0).map(parseItemLine);

                // Auto-sort to maintain order after edit
                arrayTarget.sort((a, b) => new Date(a.date) - new Date(b.date));
                await seasonalDoc.save();
                let confirmation = `✅ **Draw Updated:** "${newTitle}" (${drawType === 'new' ? 'New' : 'Returning'}, ${arrayTarget[drawIndex].items.length} item(s), releases <t:${Math.floor(new Date(arrayTarget[drawIndex].date).getTime() / 1000)}:D>).`;
                const editThumbNote = thumbnailNote(thumbResult);
                if (editThumbNote) confirmation += `\n${editThumbNote}`;
                return interaction.followUp({ content: confirmation });
            }
        }

        // --- SAVE EDITED LOADOUT ---
        if (customId.startsWith('edit_loadout_')) {
            await interaction.deferReply({ ephemeral: true });
            const targetId = customId.replace('edit_loadout_', '');
            const Loadout = require('../models/Loadout');

            // Field is now "Category | Badges" (2 segments, not 3) -- Mode is no longer editable
            // through this modal at all (2026-07-12: MP/DMZ became separate panel pages, so there's
            // no "move a loadout to the other mode" action anymore) -- it's read straight off the
            // existing document instead. See manage.js's buildEditLoadoutModal + parseLoadoutBadges.
            const existingLoadout = await Loadout.findById(targetId).lean();
            const metaParts = interaction.fields.getTextInputValue('meta').split('|').map(s => s.trim());
            const attachmentsArray = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);
            let { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized } = parseLoadoutBadges(metaParts[1]);

            // Slot labels (Muzzle/Barrel/...) only ever come from /autobuild's vision extraction, so this
            // plain-text modal can't supply new ones -- the best it can do is KEEP the existing mapping,
            // and only when it's still valid. Same convention as utils/autobuildPipeline.js's
            // applyEditSubmission: valid only if the attachment list is byte-for-byte unchanged (same
            // length + same names in the same order); any real content/order change invalidates slot
            // identity, so it's cleared rather than carried forward misaligned onto the wrong attachment.
            // This is what lets syncLoadoutMetadata below re-sync per-slot Cloudinary fields on the common
            // "just fixing a typo/badge" edit (2026-07-24 18:07 EDT, closes the former "accepted gap" in
            // loadout-images-and-metadata.md) instead of always skipping them.
            const existingAttachments = existingLoadout?.attachments || [];
            const attachmentsUnchanged = attachmentsArray.length === existingAttachments.length
                && attachmentsArray.every((a, i) => a === existingAttachments[i]);
            const attachmentSlots = attachmentsUnchanged ? (existingLoadout?.attachmentSlots || []) : [];

            const weaponName = interaction.fields.getTextInputValue('weapon');
            const weaponKey = weaponName.toLowerCase().replace(/\s+/g, '');
            const buildName = interaction.fields.getTextInputValue('build');
            const mode = existingLoadout?.mode || 'MP';

            // DMZ never uses the per-category Best/TopN system -- a bare "best"/"topN" token (no
            // -close/-midlong suffix) still parses into categoryRank since the parser doesn't know
            // the mode, so move it over to dmzRangeRank here instead (see buildBadgesLine()).
            if (mode === 'DMZ' && categoryRank && !dmzRangeRank) {
                dmzRangeRank = categoryRank;
                categoryRank = null;
            }

            const imageKey = interaction.fields.getTextInputValue('image');

            await Loadout.findByIdAndUpdate(targetId, {
                weaponName,
                weaponKey,
                buildName,
                attachments: attachmentsArray,
                attachmentSlots,
                imageKey,
                category: metaParts[0]?.toUpperCase() || 'AR',
                mode,
                isMeta,
                categoryRank,
                dmzRangeRank,
                isToxic
            });

            // NOTE (fixed during review): badges describe the WEAPON, not one specific build
            // variant -- setting "Meta" while editing Build 1 used to leave Build 2/3/etc. of the
            // same weapon showing no badge at all, which read as broken/inconsistent. Propagate the
            // same isMeta/categoryRank/dmzRangeRank/isToxic to every other build sharing this
            // weaponKey+mode. Only done on edit (not on creating a brand-new build) -- the
            // add-loadout modal has no badges pre-filled, so propagating from there would silently
            // wipe existing siblings' badges any time a new build is added without retyping them.
            const propagateResult = await Loadout.updateMany(
                { weaponKey, mode, _id: { $ne: targetId } },
                { isMeta, categoryRank, dmzRangeRank, isToxic }
            );

            // Keep Cloudinary structured metadata in sync (2026-07-21) -- re-sync this build AND every
            // sibling, since badges are weapon-level and may have just propagated (and weaponName/
            // category/attachments/code may have changed on this build). Best-effort, never throws.
            // Each sibling (including the just-edited build, refetched fresh above) now carries its OWN
            // persisted attachmentSlots -- pass it through so per-slot fields actually re-sync when valid
            // (see the attachmentsUnchanged logic above), instead of unconditionally skipping them.
            const { syncLoadoutMetadata } = require('../utils/loadoutImageCache');
            for (const sib of await Loadout.find({ weaponKey, mode })) await syncLoadoutMetadata(sib, sib.attachmentSlots);

            let confirmation = `✅ **Loadout Updated Successfully!** ${weaponName} (${buildName})`;
            if (propagateResult.modifiedCount > 0) {
                confirmation += `\n-# Badges also synced to ${propagateResult.modifiedCount} other build(s) of this weapon.`;
            }
            if (unrecognized.length > 0) {
                confirmation += `\n⚠️ Badge input not recognized and ignored: \`${unrecognized.join(', ')}\`. Valid options: \`meta\`, \`best\`, \`toxic\`, \`topN\` (e.g. \`top3\`), or a DMZ range badge (\`bestclose\`, \`bestmidlong\`, \`top3close\`, \`top5midlong\`).`;
            }
            // Real Cloudinary existence check (2026-07-18, /manage loadout UX overhaul) -- this is
            // the exact silent-failure mode Harkirat hit with FSS Hurricane: a mismatched key saves
            // fine and only shows up as a broken card image later. Advisory only (see
            // checkImageExists()'s own comment) -- never blocks the save, which already happened above.
            if (!(await checkImageExists(imageKey))) {
                confirmation += `\n⚠️ **Heads up:** no image found on Cloudinary at key \`${imageKey}\` -- the card will show broken until an image with that exact Public ID is uploaded there.`;
            }

            return interaction.followUp({ content: confirmation });
        }

        // --- SAVE NEW SINGLE DRAW ---
        if (customId === 'add_draw_new' || customId === 'add_draw_returning') {
            await interaction.deferReply({ ephemeral: true });
            const drawType = customId.replace('add_draw_', '');

            // 5th field (2026-07-12): an alternative to filling in the 4 separate fields below --
            // paste the whole draw as one bulk-style line and it's run through the SAME parser bulk
            // import uses. All 5 fields are `setRequired(false)` now (see manage.js's
            // buildAddDrawModal), so Discord itself won't block a submit with only this one filled.
            const combinedLine = interaction.fields.getTextInputValue('combined')?.trim();

            let newDrawObj;
            let cloudinaryWarning = null;

            if (combinedLine) {
                const [parsed] = parseBulkDrawList(combinedLine);
                if (!parsed) {
                    return interaction.followUp({ content: '❌ Could not parse that line -- expected format: `Title, m Item 1, l Item 2, Date, URL` (URL optional).' });
                }
                const thumbResult = await resolveThumbnail(parsed.title, parsed.thumbnailUrl);
                if (!thumbResult.url) {
                    return interaction.followUp({ content: `❌ No URL provided and no cached image found for "${parsed.title}" -- provide a thumbnail URL.` });
                }
                cloudinaryWarning = thumbnailNote(thumbResult);
                newDrawObj = { title: parsed.title, items: parsed.items, date: parsed.date, thumbnailUrl: thumbResult.url };
            } else {
                const title = toTitleCase(interaction.fields.getTextInputValue('title'));
                const dateStr = interaction.fields.getTextInputValue('date');
                const rawUrl = interaction.fields.getTextInputValue('url');
                const rawItems = interaction.fields.getTextInputValue('items');

                if (!title || !dateStr || !rawItems) {
                    return interaction.followUp({ content: '❌ Fill in Title, Items, and Release Date, or use the "Or Paste As One Line" field instead.' });
                }
                const parsedSingleDate = parseAdminDate(dateStr);
                if (!parsedSingleDate) {
                    return interaction.followUp({ content: `❌ Date "${dateStr}" wasn't understood -- nothing was saved.` });
                }

                // URL is optional (2026-07-12) -- blank reuses a Cloudinary cache hit for this exact
                // title if one exists (see utils/cloudinaryCache.js); no URL AND no cache hit is a
                // real validation error since the draw needs some thumbnail to render.
                const thumbResult = await resolveThumbnail(title, rawUrl);
                if (!thumbResult.url) {
                    return interaction.followUp({ content: `❌ No URL provided and no cached image found for "${title}" -- provide a thumbnail URL.` });
                }
                cloudinaryWarning = thumbnailNote(thumbResult);

                const parsedItems = rawItems.split('\n').filter(l => l.trim().length > 0).map(parseItemLine);
                newDrawObj = { title, items: parsedItems, date: parsedSingleDate, thumbnailUrl: thumbResult.url };
            }

            const arrayTarget = drawType === 'new' ? seasonalDoc.newDraws : seasonalDoc.returningDraws;
            arrayTarget.push(newDrawObj);

            // Auto-sort to maintain chronological order
            arrayTarget.sort((a, b) => new Date(a.date) - new Date(b.date));
            await seasonalDoc.save();

            let confirmation = `✅ **Draw Added:** "${newDrawObj.title}" (${drawType === 'new' ? 'New' : 'Returning'}, ${newDrawObj.items.length} item(s), releases <t:${Math.floor(new Date(newDrawObj.date).getTime() / 1000)}:D>).`;
            if (cloudinaryWarning) confirmation += `\n${cloudinaryWarning}`;
            return interaction.followUp({ content: confirmation });
        }

        // --- SAVE NEW SINGLE LOADOUT --- custom_id: add_loadout_{MP|DMZ}
        if (customId.startsWith('add_loadout_')) {
            await interaction.deferReply({ ephemeral: true });
            const pageMode = customId.replace('add_loadout_', '');

            // Field is now "Category | Badges" (2 segments, not 3) -- Mode no longer has its own
            // modal field since the Add button itself is already MP/DMZ-scoped by which page it's on.
            const metaParts = interaction.fields.getTextInputValue('meta').split('|').map(s => s.trim());
            const attachmentsArray = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);
            // NOTE: unlike edit_loadout_ above, this does NOT propagate badges to sibling builds of
            // the same weapon -- this modal has nothing pre-filled, so a blank badges field here
            // (the common case when just adding another build variant) would silently wipe any
            // badges already set on the weapon's existing builds. Re-editing an existing build is
            // the supported way to (re)sync badges across all of a weapon's builds.
            let { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized } = parseLoadoutBadges(metaParts[1]);
            // DMZ never uses the per-category Best/TopN system -- see the matching note in
            // edit_loadout_ above.
            if (pageMode === 'DMZ' && categoryRank && !dmzRangeRank) {
                dmzRangeRank = categoryRank;
                categoryRank = null;
            }

            const imageKey = interaction.fields.getTextInputValue('image');

            const newLoadout = new Loadout({
                weaponName: interaction.fields.getTextInputValue('weapon'),
                weaponKey: interaction.fields.getTextInputValue('weapon').toLowerCase().replace(/\s+/g, ''),
                buildName: interaction.fields.getTextInputValue('build'),
                attachments: attachmentsArray,
                imageKey,
                category: metaParts[0]?.toUpperCase() || 'AR',
                mode: pageMode,
                isMeta,
                categoryRank,
                dmzRangeRank,
                isToxic
            });

            await newLoadout.save();
            // Sync Cloudinary structured metadata for the new build (2026-07-21). Best-effort: if the
            // admin hasn't uploaded the image to that key yet, the asset doesn't exist and this is a
            // silent no-op (the metadata gets set on the next edit once the image is there). No slot
            // data (only /autobuild has it). No badge propagation on ADD (see the note above), so only
            // this one build is synced.
            await require('../utils/loadoutImageCache').syncLoadoutMetadata(newLoadout);
            let confirmation = `✅ **Successfully saved Loadout: ${newLoadout.weaponName} (${newLoadout.buildName}, ${newLoadout.mode})!**`;
            if (unrecognized.length > 0) {
                confirmation += `\n⚠️ Badge input not recognized and ignored: \`${unrecognized.join(', ')}\`. Valid options: \`meta\`, \`best\`, \`toxic\`, \`topN\` (e.g. \`top3\`), or a DMZ range badge (\`bestclose\`, \`bestmidlong\`, \`top3close\`, \`top5midlong\`).`;
            }
            // Real Cloudinary existence check (2026-07-18, /manage loadout UX overhaul) -- see
            // edit_loadout_'s matching check above for the full reasoning.
            if (!(await checkImageExists(imageKey))) {
                confirmation += `\n⚠️ **Heads up:** no image found on Cloudinary at key \`${imageKey}\` -- the card will show broken until an image with that exact Public ID is uploaded there.`;
            }
            return interaction.followUp({ content: confirmation });
        }

        // --- BULK ADD/REPLACE LOADOUTS (upsert, never wholesale-replaces) ---
        // custom_id: modal_loadouts_bulk_add_{MP|DMZ} -- "Replace Multiple" also routes into this
        // exact same modal/handler for now (see the mng_act_ handler's comment on why), so this one
        // handler covers both buttons. Unlike the draws/calendar bulk routes above, this NEVER
        // wholesale-replaces the Loadout collection -- that would wipe every loadout in the database.
        // Each parsed block upserts by {weaponKey, mode, buildName}: updates in place if that exact
        // build already exists, inserts if not. `pageMode` (from the custom_id, i.e. which page this
        // modal was opened from) force-overrides every parsed entry's mode regardless of what's typed
        // in the pasted text's Mode field -- the page already scopes it, this just guards against a
        // stray mismatched Mode value silently filing a loadout under the wrong page. Badge
        // propagation afterward matches the single edit-loadout handler's convention (badges describe
        // the weapon, not one build variant). See adminParser.js's parseBulkLoadoutList() for the
        // text format.
        if (customId.startsWith('modal_loadouts_bulk_add_')) {
            await interaction.deferReply({ ephemeral: true });
            const pageMode = customId.replace('modal_loadouts_bulk_add_', '');
            const bulkText = interaction.fields.getTextInputValue('bulk_text');
            const { parsed, errors } = parseBulkLoadoutList(bulkText);

            let created = 0;
            let updated = 0;
            const missingImages = []; // { label, imageKey } -- see checkImageExists() below
            const touchedKeys = new Set(); // weaponKeys to re-sync Cloudinary metadata for after the loop
            for (const rawEntry of parsed) {
                const entry = { ...rawEntry, mode: pageMode };
                const { weaponKey, mode, buildName, imageKey } = entry;
                touchedKeys.add(weaponKey);
                const existing = await Loadout.findOne({ weaponKey, mode, buildName });
                if (existing) {
                    await Loadout.updateOne({ _id: existing._id }, entry);
                    updated++;
                } else {
                    await new Loadout(entry).save();
                    created++;
                }
                // Weapon-level badges sync across every other build sharing this weaponKey+mode --
                // same reasoning as the edit_loadout_ handler in this file.
                await Loadout.updateMany(
                    { weaponKey, mode, buildName: { $ne: buildName } },
                    { isMeta: entry.isMeta, categoryRank: entry.categoryRank, dmzRangeRank: entry.dmzRangeRank, isToxic: entry.isToxic }
                );
                // Real Cloudinary existence check (2026-07-18, /manage loadout UX overhaul) -- same
                // reasoning as the single add/edit handlers, just batched across the whole paste
                // instead of a single field, since a bulk import is exactly where a copy-paste typo
                // in one block's Image Key is easiest to miss among many.
                if (!(await checkImageExists(imageKey))) missingImages.push({ label: `${entry.weaponName} (${buildName})`, imageKey });
            }

            // Keep Cloudinary structured metadata in sync for every touched weapon (2026-07-21). Synced
            // once per weaponKey after the loop (not per-block) so a paste with several builds of one
            // weapon doesn't re-sync the same siblings repeatedly. Best-effort, never throws.
            const { syncLoadoutMetadata } = require('../utils/loadoutImageCache');
            for (const wk of touchedKeys) {
                for (const b of await Loadout.find({ weaponKey: wk, mode: pageMode })) await syncLoadoutMetadata(b);
            }

            let confirmation = `✅ **Bulk Loadout Import Complete!**\n${created} new build(s) added, ${updated} existing build(s) updated.`;
            if (errors.length > 0) {
                confirmation += `\n⚠️ ${errors.length} block(s) skipped:\n${errors.map(e => `- ${e}`).join('\n')}`;
            }
            if (missingImages.length > 0) {
                confirmation += `\n⚠️ No Cloudinary image found for ${missingImages.length} build(s) -- these will show broken until uploaded there with the exact Public ID typed:\n${missingImages.map(m => `- ${m.label}: \`${m.imageKey}\``).join('\n')}`;
            }
            return interaction.followUp({ content: confirmation });
        }

        // --- BULK DELETE LOADOUTS --- custom_id: modal_loadouts_bulk_remove_{MP|DMZ}
        // Lines are "Weapon" (removes every build of that weapon) or "Weapon | Build Name" (removes
        // just that one build) -- mode no longer needs its own line segment since it's fixed by which
        // page this modal was opened from. Fuzzy-matches the weapon name (utils/search.js's
        // fuzzyMatch) scoped to that mode, same matching convention as the draws/calendar bulk-remove
        // routes above.
        // 2-step confirm added 2026-07-12 -- this used to delete straight out of the loop as it
        // matched each line, no confirmation at all. Now only IDENTIFIES which docs would be
        // deleted (a dry run against a .lean() snapshot -- nothing is mutated here), and the actual
        // deleteOne/deleteMany calls only happen from mng_bulkdelconfirm_ below.
        if (customId.startsWith('modal_loadouts_bulk_remove_')) {
            const mode = customId.replace('modal_loadouts_bulk_remove_', '');
            const lines = interaction.fields.getTextInputValue('lines').split('\n').map(l => l.trim()).filter(Boolean);

            const toDelete = []; // { weaponKey, buildName?, label, docs (for undo) }
            const notFound = [];
            const candidates = await Loadout.find({ mode }).lean();
            for (const line of lines) {
                const [weaponPart, buildPart] = line.split('|').map(p => p?.trim());
                if (!weaponPart) {
                    notFound.push(`"${line}" (need at least a weapon name)`);
                    continue;
                }
                const match = candidates.find(l => fuzzyMatch(weaponPart, l.weaponName));
                if (!match) {
                    notFound.push(`${weaponPart} (${mode})`);
                    continue;
                }

                if (buildPart) {
                    const buildDoc = candidates.find(l => l.weaponKey === match.weaponKey && l.mode === mode && l.buildName === buildPart);
                    if (buildDoc) toDelete.push({ weaponKey: match.weaponKey, buildName: buildPart, label: `${match.weaponName} (${buildPart})`, docs: [buildDoc] });
                    else notFound.push(`${weaponPart} | ${mode} | ${buildPart}`);
                } else {
                    const docs = candidates.filter(l => l.weaponKey === match.weaponKey && l.mode === mode);
                    toDelete.push({ weaponKey: match.weaponKey, buildName: null, label: `${match.weaponName} (all ${docs.length} build(s))`, docs });
                }
            }

            if (toDelete.length === 0) {
                return interaction.reply({ content: `❌ Nothing matched -- nothing to delete.${notFound.length ? `\n⚠️ Not found: ${notFound.join(', ')}` : ''}`, ephemeral: true });
            }

            const summary = [`Removed: ${toDelete.map(t => t.label).join(', ')}`];
            if (notFound.length) summary.push(`⚠️ Not found: ${notFound.join(', ')}`);

            const token = randomUUID().slice(0, 8);
            pendingBulkDeletes.set(token, {
                description: `Bulk Delete ${mode} Loadouts`,
                summary,
                apply: async () => {
                    for (const entry of toDelete) {
                        if (entry.buildName) await Loadout.deleteOne({ weaponKey: entry.weaponKey, mode, buildName: entry.buildName });
                        else await Loadout.deleteMany({ weaponKey: entry.weaponKey, mode });
                    }
                    return registerUndo(`Bulk Delete ${mode} Loadouts`, async () => {
                        const restoreDocs = toDelete.flatMap(t => t.docs).map(d => { const c = { ...d }; delete c._id; return c; });
                        if (restoreDocs.length) await Loadout.insertMany(restoreDocs);
                    });
                }
            });
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

        // --- EXPORT UP TO 5 LOADOUTS --- custom_id: modal_loadouts_export5_{MP|DMZ}
        // Fuzzy-matches each pasted weapon name (up to 5) against that mode's collection -- the real
        // search+multi-select-from-a-list version this mockup describes is the deferred future work
        // (see this file's top-of-file note); this is a working placeholder for the same outcome.
        if (customId.startsWith('modal_loadouts_export5_')) {
            await interaction.deferReply({ ephemeral: true });
            const mode = customId.replace('modal_loadouts_export5_', '');
            const { formatLoadoutsAsBulkText } = require('../utils/adminParser');
            const requested = interaction.fields.getTextInputValue('weapons').split('\n').map(w => w.trim()).filter(Boolean).slice(0, 5);
            const candidates = await Loadout.find({ mode }).lean();

            const matched = [];
            const notFound = [];
            for (const weapon of requested) {
                const hits = candidates.filter(l => fuzzyMatch(weapon, l.weaponName));
                if (hits.length > 0) matched.push(...hits);
                else notFound.push(weapon);
            }

            if (matched.length === 0) {
                return interaction.followUp({ content: `❌ No matches found for: ${requested.join(', ')}` });
            }

            const text = formatLoadoutsAsBulkText(matched);
            let content = `📤 **Exported ${matched.length} ${mode} loadout(s)** in Bulk Add format. Paste this back into the Bulk Add action.`;
            if (notFound.length) content += `\n⚠️ Not found: ${notFound.join(', ')}`;
            return interaction.followUp({ content, files: [{ attachment: Buffer.from(text, 'utf-8'), name: `${mode.toLowerCase()}_loadouts_export.txt` }] });
        }

        // --- EXPORT A LOADOUT CATEGORY --- custom_id: modal_loadouts_exportcategory_{MP|DMZ}
        if (customId.startsWith('modal_loadouts_exportcategory_')) {
            await interaction.deferReply({ ephemeral: true });
            const mode = customId.replace('modal_loadouts_exportcategory_', '');
            const { formatLoadoutsAsBulkText } = require('../utils/adminParser');
            const category = interaction.fields.getTextInputValue('category').trim().toUpperCase();
            const loadouts = await Loadout.find({ mode, category }).lean();

            if (loadouts.length === 0) {
                return interaction.followUp({ content: `❌ No ${mode} loadouts found in category "${category}".` });
            }

            const text = formatLoadoutsAsBulkText(loadouts);
            return interaction.followUp({
                content: `📤 **Exported ${loadouts.length} ${mode} ${category} loadout(s)** in Bulk Add format. Paste this back into the Bulk Add action.`,
                files: [{ attachment: Buffer.from(text, 'utf-8'), name: `${mode.toLowerCase()}_${category.toLowerCase()}_loadouts_export.txt` }]
            });
        }
    }
}

// Returns TRUE when this panel owns the interaction (and has now handled it), FALSE when it does not
// -- the same contract every handlers/*.js module follows, so the router dispatches them uniformly.
async function handleManageInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await routeManage(interaction);
    return true;
}

module.exports = { handleManageInteraction, OWNED_PREFIXES };
