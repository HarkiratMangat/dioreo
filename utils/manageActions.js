// ==========================================
// /manage — THE ACTION REGISTRY
// ==========================================
// One table describing every action reachable from a /manage page button. Added 2026-08-14 as stage 1 of the decomposition designed in docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md.
//
// ⚠️ WHY THIS EXISTS — the action list used to be implied in TWO independent places that had to be kept in step by hand: the `buttons: [{ id, label, style }]` arrays inside commands/manage.js's buildPagesTable(), and a 220-line if/else sub-dispatcher inside handlers/manage.js's `mng_act_` branch. Nothing checked that they matched, so a button could render with no handler behind it (a dead button, indistinguishable from a bug in the handler) or a handler could outlive the button that reached it. Adding the upcoming `action:` slash option on top of that would have made a THIRD copy. Both of those call sites now read from here instead, and scripts/manageActions.test.js asserts conservation in both directions.
//
// ⚠️ `kind` IS LOAD-BEARING, NOT DECORATION. Discord requires showModal() to be an interaction's FIRST response — it cannot follow deferReply() (commands/manage.js's execute() already special-cases season_titlesdeadlines for exactly this). Declaring the response mode per action means a caller can decide whether it may defer BEFORE it does, instead of every new action rediscovering the rule the hard way:
//     'modal'   -> run() calls showModal(). Caller must NOT have deferred or replied.
//     'file'    -> run() replies with an attachment. Caller must not have deferred (uses reply()).
//     'confirm' -> run() renders a Confirm/Cancel prompt. The real work happens in the mng_*confirm_
//                  handler, never here.
//     'view'    -> run() defers and renders a read-only panel.
//
// ⚠️ `slash` IS WRITTEN OUT PER ENTRY ON PURPOSE, never derived from `kind`. It marks whether the action may be opened directly by the (stage 3) `action:` slash option, and the standing rule is that destructive actions stay panel-only so reaching one always costs a deliberate navigation. That rule happens to be "every kind:'confirm'" today — but deriving the flag from the kind would make the test that enforces it vacuously true, which is worse than no test at all. Two fields that must agree, with a check that they do, is the whole point.
//
// NOT IN THIS TABLE, deliberately: the two Season pseudo-pages ('season_titlesdeadlines', 'season_wipe'). They are flat entries on the page-nav dropdown, not page buttons — they never carry an `mng_act_` custom_id and never pass through this resolver. Same for the per-row buttons on Manage Admins and Announcement (`mng_admin_*`, `mng_announce_*`), whose ids embed a Mongo _id that parseMngId's group/action split cannot represent.

// Loadouts MP and DMZ are the same page with a different collection slice. Derived from the page key rather than stored per entry, so the two pages cannot drift apart.
function loadoutModeFor(page) {
    return page === 'loadouts_mp' ? 'MP' : page === 'loadouts_dmz' ? 'DMZ' : null;
}

// ── Shared run() implementations ─────────────────────────────────────────── Edit/Delete can't autocomplete the way a slash option could, so they collect a search query through a one-field modal first; handlers/manage.js's `mng_search_` submit handler fuzzy-matches it. This is why 'delete' is safely slash-exposed: the button opens a SEARCH box, it deletes nothing on its own.
const openSearchModal = (searchAction) => async ({ interaction, page, manageCommand }) =>
    await interaction.showModal(manageCommand.buildSearchModal(page, searchAction));

// The Bulk Format Guide — a structured reference, not a DB action. Deferred + sendV2Payload, the same path every other V2 render in this bot uses (discord.js's high-level reply() can't reliably serialize raw V2 JSON — see .claude/rules/rendering-and-ui.md).
const openFormatGuide = async ({ interaction, page }) => {
    const { resolveGuideTopic, buildGuideContainer } = require('./manageGuides');
    const { sendV2Payload } = require('./sendV2Payload');
    await interaction.deferReply({ ephemeral: true });
    return await sendV2Payload(interaction, buildGuideContainer(resolveGuideTopic(page)));
};

// Purge needs a second confirmation before it deletes anything — one misclick shouldn't wipe a collection. This first step only shows the prompt; mng_purgeconfirm_ does the work. The custom_id always encodes BOTH page and scope so the confirm/cancel handlers have one shape to parse.
const confirmPurge = (scope) => async ({ interaction, page, manageCommand }) => {
    const label = manageCommand.PURGE_LABELS[page][scope];
    return await interaction.reply({
        content: `⚠️ **Are you sure?** This will permanently delete ${label}. This cannot be undone.`,
        components: [{
            type: 1, components: [
                { type: 2, style: 4, label: 'Yes, Purge', custom_id: `mng_purgeconfirm_${page}_${scope}` },
                { type: 2, style: 2, label: 'Cancel', custom_id: `mng_purgecancel_${page}_${scope}` }
            ]
        }],
        ephemeral: true
    });
};

// Export replies directly with the file — no modal, nothing to submit.
const exportFile = (buildExport) => async (ctx) => {
    const { content, name, text } = await buildExport(ctx);
    return await ctx.interaction.reply({
        content,
        files: [{ attachment: Buffer.from(text, 'utf-8'), name }],
        ephemeral: true
    });
};

async function loadSeasonalDoc() {
    const SeasonalData = require('../models/SeasonalData');
    return await SeasonalData.findOne({ docType: 'global' }).lean(); // read-only on every path here
}

// ── The table ────────────────────────────────────────────────────────────── Every entry: { page, id, label, style, kind, slash, run } (+ optional ownerOnly). `label` and `style` are what the panel button renders with — commands/manage.js reads them from here, so a label change lands in one place.

const DRAWS_ACTIONS = [
    { id: 'addnew', label: 'Add New', style: 3, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildAddDrawModal('new')) },
    { id: 'addreturning', label: 'Add Returning', style: 3, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildAddDrawModal('returning')) },
    { id: 'edit', label: 'Edit', style: 1, kind: 'modal', slash: true, run: openSearchModal('edit') },
    { id: 'delete', label: 'Delete', style: 4, kind: 'modal', slash: true, run: openSearchModal('delete') },
    { id: 'bulkadd', label: 'Add Multiple', style: 3, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildBulkBothDrawsModal('add')) },
    { id: 'bulkreplace', label: 'Replace Multiple', style: 1, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildBulkBothDrawsModal('replace')) },
    { id: 'bulkdelete', label: 'Delete Multiple', style: 4, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildBulkRemoveDrawsModal('either')) },
    { id: 'purgenew', label: 'Purge New Draws Only', style: 4, kind: 'confirm', slash: false, run: confirmPurge('new') },
    { id: 'purgereturning', label: 'Purge Returning Draws Only', style: 4, kind: 'confirm', slash: false, run: confirmPurge('returning') },
    { id: 'purgeall', label: 'Purge All Draws Data', style: 4, kind: 'confirm', slash: false, run: confirmPurge('all') },
    { id: 'exportnew', label: 'Export New Draws', style: 2, kind: 'file', slash: true,
      run: exportFile(async () => {
          const { formatDrawsAsBulkText } = require('./adminParser');
          const doc = await loadSeasonalDoc();
          return {
              content: '📤 **Exported New Draws** in Bulk Add format. Paste this back into the matching Bulk action.',
              name: 'new_draws_bulk.txt',
              text: formatDrawsAsBulkText(doc?.newDraws || []) || '(no New Draws currently saved)'
          };
      }) },
    { id: 'exportreturning', label: 'Export Returning Draws', style: 2, kind: 'file', slash: true,
      run: exportFile(async () => {
          const { formatDrawsAsBulkText } = require('./adminParser');
          const doc = await loadSeasonalDoc();
          return {
              content: '📤 **Exported Returning Draws** in Bulk Add format. Paste this back into the matching Bulk action.',
              name: 'returning_draws_bulk.txt',
              text: formatDrawsAsBulkText(doc?.returningDraws || []) || '(no Returning Draws currently saved)'
          };
      }) },
    { id: 'formatguide', label: 'Guide', style: 2, kind: 'view', slash: true, run: openFormatGuide }
];

const CALENDAR_ACTIONS = [
    { id: 'add', label: 'Add', style: 3, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildCalendarAddModal()) },
    { id: 'edit', label: 'Edit', style: 1, kind: 'modal', slash: true, run: openSearchModal('edit') },
    { id: 'delete', label: 'Delete', style: 4, kind: 'modal', slash: true, run: openSearchModal('delete') },
    { id: 'addmultiple', label: 'Add', style: 3, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildCalendarBulkModal('add')) },
    { id: 'replacemultiple', label: 'Replace', style: 1, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildCalendarBulkModal('replace')) },
    { id: 'deletemultiple', label: 'Delete', style: 4, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildCalendarBulkRemoveModal()) },
    // Opens pre-filled with whatever's currently saved, so clearing one field doesn't require retyping the other two.
    { id: 'banners', label: 'Banners', style: 1, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildCalendarBannersModal(await loadSeasonalDoc())) },
    { id: 'purge', label: 'Purge', style: 4, kind: 'confirm', slash: false, run: confirmPurge('all') },
    { id: 'export', label: 'Export', style: 2, kind: 'file', slash: true,
      run: exportFile(async () => {
          const { formatCalendarAsBulkText } = require('./adminParser');
          const doc = await loadSeasonalDoc();
          return {
              content: '📤 **Exported Calendar** in Bulk Add format. Paste this back into the Replace action.',
              name: 'calendar_bulk.txt',
              text: formatCalendarAsBulkText(doc?.calendar || []) || '(no calendar events currently saved)'
          };
      }) },
    { id: 'formatguide', label: 'Guide', style: 2, kind: 'view', slash: true, run: openFormatGuide }
];

// MP and DMZ generate from one factory for the same reason commands/manage.js's loadoutsPageDef() does — they are the same page with a different `mode`, and a hand-copied second set would drift.
const loadoutsActions = () => [
    { id: 'add', label: 'Add', style: 3, kind: 'modal', slash: true,
      run: async ({ interaction, page, manageCommand }) => await interaction.showModal(manageCommand.buildAddLoadoutModal(loadoutModeFor(page))) },
    { id: 'edit', label: 'Edit', style: 1, kind: 'modal', slash: true, run: openSearchModal('edit') },
    { id: 'delete', label: 'Delete', style: 4, kind: 'modal', slash: true, run: openSearchModal('delete') },
    { id: 'bulkadd', label: 'Add', style: 3, kind: 'modal', slash: true,
      run: async ({ interaction, page, manageCommand }) => await interaction.showModal(manageCommand.buildLoadoutsBulkAddModal(loadoutModeFor(page))) },
    // "Replace Multiple" deliberately reuses Add Multiple's modal: the upsert-by-name behaviour behind it (update in place if that build exists, insert if not) already covers replace semantics for anything pasted back in. The real search-then-pick interaction is deferred work.
    { id: 'bulkreplace', label: 'Replace', style: 1, kind: 'modal', slash: true,
      run: async ({ interaction, page, manageCommand }) => await interaction.showModal(manageCommand.buildLoadoutsBulkAddModal(loadoutModeFor(page))) },
    { id: 'bulkdelete', label: 'Delete', style: 4, kind: 'modal', slash: true,
      run: async ({ interaction, page, manageCommand }) => await interaction.showModal(manageCommand.buildLoadoutsBulkRemoveModal(loadoutModeFor(page))) },
    { id: 'exportupto5', label: 'Up To 5', style: 2, kind: 'modal', slash: true,
      run: async ({ interaction, page, manageCommand }) => await interaction.showModal(manageCommand.buildLoadoutsExportUpTo5Modal(loadoutModeFor(page))) },
    { id: 'exportcategory', label: 'Category', style: 2, kind: 'modal', slash: true,
      run: async ({ interaction, page, manageCommand }) => await interaction.showModal(manageCommand.buildLoadoutsExportCategoryModal(loadoutModeFor(page))) },
    { id: 'exportall', label: 'All', style: 2, kind: 'file', slash: true,
      run: exportFile(async ({ page }) => {
          const Loadout = require('../models/Loadout');
          const { formatLoadoutsAsBulkText } = require('./adminParser');
          const mode = loadoutModeFor(page);
          const loadouts = await Loadout.find({ mode }).lean();
          return {
              content: `📤 **Exported all ${mode} loadouts** in Bulk Add format. Paste this back into the Bulk Add action.`,
              name: `${mode.toLowerCase()}_loadouts_bulk.txt`,
              text: formatLoadoutsAsBulkText(loadouts) || `(no ${mode} loadouts currently saved)`
          };
      }) },
    { id: 'formatguide', label: 'Guide', style: 2, kind: 'view', slash: true, run: openFormatGuide }
    // No purge on either Loadouts page — see commands/manage.js's PURGE_LABELS.
];

// Patch Notes operates on a single "current" entry (the last item in patchNotes[]). If none exists yet the modals open blank; the submit handler creates the first entry.
const currentPatchEntry = (doc) => doc?.patchNotes?.length ? doc.patchNotes[doc.patchNotes.length - 1] : null;

const PATCHNOTES_ACTIONS = [
    { id: 'dateinfo', label: 'Date/Info', style: 3, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => {
          const UserPreference = require('../models/UserPreference');
          const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
          return await interaction.showModal(manageCommand.buildPatchDateInfoModal(currentPatchEntry(await loadSeasonalDoc()), prefs?.timezone));
      } },
    { id: 'urls1', label: 'URLs 1', style: 1, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildPatchUrlsModal(1, currentPatchEntry(await loadSeasonalDoc()))) },
    { id: 'urls2', label: 'URLs 2', style: 1, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildPatchUrlsModal(2, currentPatchEntry(await loadSeasonalDoc()))) },
    // Always opens blank, unlike the three above — submitting it PUSHES a new entry.
    { id: 'addseason', label: 'Add New Season', style: 3, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildPatchAddSeasonModal()) },
    { id: 'purge', label: 'Purge', style: 4, kind: 'confirm', slash: false, run: confirmPurge('all') },
    { id: 'formatguide', label: 'Guide', style: 2, kind: 'view', slash: true, run: openFormatGuide }
];

// A staged next season. The three Prepare modals open pre-filled from the CURRENT draft so re-running one to fix a typo doesn't start from blank; Promote/Discard get the same two-step confirmation every other irreversible action on this panel uses.
const draftGuard = (verb) => async (interaction) => {
    const doc = await loadSeasonalDoc();
    if (!doc?.draft?.active) {
        await interaction.reply({ content: `❌ No draft in progress — nothing to ${verb}.`, ephemeral: true });
        return null;
    }
    return doc;
};

const SEASONDRAFT_ACTIONS = [
    { id: 'settitles', label: 'Titles & Deadlines', style: 1, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildDraftTitlesDatesModal(await loadSeasonalDoc())) },
    { id: 'bulkdraws', label: 'Draws', style: 1, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildDraftBulkDrawsModal(await loadSeasonalDoc())) },
    { id: 'bulkcalendar', label: 'Calendar', style: 1, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildDraftBulkCalendarModal(await loadSeasonalDoc())) },
    { id: 'promote', label: 'Promote to Live', style: 3, kind: 'confirm', slash: false,
      run: async ({ interaction }) => {
          const doc = await draftGuard('promote')(interaction);
          if (!doc) return;
          const d = doc.draft;
          return await interaction.reply({
              content: `⚠️ **Promote the staged draft to live?** This swaps in the draft's title, deadlines, ${d.newDraws?.length || 0} New draw(s), ${d.returningDraws?.length || 0} Returning draw(s), and ${d.calendar?.length || 0} calendar event(s) as what's live RIGHT NOW, and clears the draft. Undo is available after.`,
              components: [{
                  type: 1, components: [
                      { type: 2, style: 3, label: 'Yes, Promote', custom_id: 'mng_draftpromoteconfirm' },
                      { type: 2, style: 2, label: 'Cancel', custom_id: 'mng_draftpromotecancel' }
                  ]
              }],
              ephemeral: true
          });
      } },
    { id: 'discard', label: 'Discard Draft', style: 4, kind: 'confirm', slash: false,
      run: async ({ interaction }) => {
          const doc = await draftGuard('discard')(interaction);
          if (!doc) return;
          return await interaction.reply({
              content: '⚠️ **Discard the staged draft?** This erases everything staged for next season. What\'s currently live is untouched. Cannot be undone.',
              components: [{
                  type: 1, components: [
                      { type: 2, style: 4, label: 'Yes, Discard', custom_id: 'mng_draftdiscardconfirm' },
                      { type: 2, style: 2, label: 'Cancel', custom_id: 'mng_draftdiscardcancel' }
                  ]
              }],
              ephemeral: true
          });
      } },
    { id: 'formatguide', label: 'Guide', style: 2, kind: 'view', slash: true, run: openFormatGuide }
];

const ANNOUNCEMENT_ACTIONS = [
    // Always opens BLANK — each announcement is its own doc, never a single one being overwritten.
    { id: 'post', label: 'Post New Announcement', style: 3, kind: 'modal', slash: true,
      run: async ({ interaction, manageCommand }) => await interaction.showModal(manageCommand.buildAnnouncementModal(null)) },
    { id: 'formatguide', label: 'Guide', style: 2, kind: 'view', slash: true, run: openFormatGuide }
];

const ACTIONS_BY_PAGE = {
    draws: DRAWS_ACTIONS,
    calendar: CALENDAR_ACTIONS,
    loadouts_mp: loadoutsActions(),
    loadouts_dmz: loadoutsActions(),
    patchnotes: PATCHNOTES_ACTIONS,
    seasondraft: SEASONDRAFT_ACTIONS,
    announcement: ANNOUNCEMENT_ACTIONS
};

// Flat `page:id` index, built once — the entries carry no emoji interpolation, so unlike buildPagesTable() this is safe to freeze at require() time.
const ACTION_INDEX = new Map();
for (const [page, list] of Object.entries(ACTIONS_BY_PAGE)) {
    for (const entry of list) {
        entry.page = page;
        ACTION_INDEX.set(`${page}:${entry.id}`, entry);
    }
}

// ── Lookup + authorization ─────────────────────────────────────────────────

function getAction(page, actionId) {
    return ACTION_INDEX.get(`${page}:${actionId}`) || null;
}

function listActions(page) {
    return ACTIONS_BY_PAGE[page] || [];
}

// Actions the (stage 3) `action:` slash option may open directly.
function listSlashActions(page) {
    return listActions(page).filter(a => a.slash);
}

// ⚠️ THE ONE CHOKE POINT. Both the panel's `mng_act_` dispatch and the slash path resolve through here, which is what makes per-page permissions hold PER CLICK rather than only at page-view time — the gap filed 2026-08-13 and closed by this registry. Returns a discriminated result instead of throwing so both callers handle "no such action" and "not allowed" the same way.
async function resolveAction(page, actionId, userId) {
    const entry = getAction(page, actionId);
    if (!entry) return { ok: false, reason: 'unknown' };

    const { getManagePages, isOwner } = require('./adminAccess');
    if (entry.ownerOnly && !isOwner(userId)) return { ok: false, reason: 'owner', entry };

    const allowedPages = await getManagePages(userId);
    if (!allowedPages.includes(entry.page)) return { ok: false, reason: 'denied', entry };

    return { ok: true, entry };
}

const DENIAL_MESSAGE = {
    unknown: "❌ **That action doesn't exist.** It may have been renamed or removed — reopen the panel to see what's available.",
    owner: '🔒 **Only the bot owner can manage the admin list.**',
    denied: "🔒 **You don't have access to that section.**"
};

// ── Panel button construction ────────────────────────────────────────────── commands/manage.js's buildPagesTable() calls these instead of writing `{ id, label, style }` literals, so a button and the handler behind it cannot exist without each other.

function buttonFor(page, id) {
    const entry = getAction(page, id);
    if (!entry) throw new Error(`/manage: no registered action "${id}" on page "${page}"`);
    return { id: entry.id, label: entry.label, style: entry.style };
}

function buttonsFor(page, ...ids) {
    return ids.map(id => buttonFor(page, id));
}

module.exports = {
    ACTIONS_BY_PAGE,
    getAction,
    listActions,
    listSlashActions,
    resolveAction,
    DENIAL_MESSAGE,
    buttonFor,
    buttonsFor,
    loadoutModeFor
};
