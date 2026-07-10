// ==========================================
// COMMAND: ADVANCED DATABASE MANAGER
// ==========================================
// Single admin command covering everything the bot's data needs -- individual add/edit/delete
// for draws, calendar events, patch notes, and MP/DMZ loadouts, bulk import/remove for the same,
// season title/deadline management, per-entity data Purge, and bulk-import-format Export. Used to
// be split across this command and a separate /update dropdown-driven gateway; consolidated into
// one command (Harkirat's request -- "don't want a long list of slash commands"), then redesigned
// twice more the same day (2026-07-09): first collapsed from a 5-subcommand-group/22-subcommand
// tree into ONE flat command that opens a Components V2 panel (Harkirat's ask: "a single /manage
// command with branches of options... like each sub command has its own page with sections where
// a modal can be triggered from a button" -- the subcommand-group tree still felt like "A LOT of
// commands" even collapsed into one command), then a follow-up pass added Purge, swapped the
// page-nav buttons for a select menu, and folded a briefly-standalone /export command back in as
// another page (all per Harkirat's direct feedback once the panel existed).
// `/manage` (optionally with a `page` option to jump straight to a section) replies with a
// Container showing the current section's available actions as buttons, plus a `mng_pagesel`
// select menu to switch sections -- clicking an action button either opens its modal directly
// (bulk-add/add flows), replies directly with a file (Export actions), shows a Confirm/Cancel
// prompt (Purge), or, for Edit/Delete (which need a specific item picked first, and buttons can't
// autocomplete), opens a small "search by name" modal first -- see index.js's
// `mng_search_`/`mng_pick_` handlers for the resolve-then-chain-a-second-modal logic. This file
// only builds the modal SHAPES (what fields, what's pre-filled) and the page/button layout;
// index.js owns all the routing (which button/modal leads to which shape) and all the actual
// DB-mutating submit logic. /update no longer exists, and there is no subcommand tree at all.

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { formatAdminDate } = require('../utils/adminParser');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Per-page "Purge" wording -- each page's Purge button nukes ONLY that page's own data (distinct
// from Season's existing "Wipe Season", which resets draws+calendar together as part of starting
// a new season but deliberately preserves patch notes history forever). These are independent,
// on-demand, manual nukes Harkirat asked for per entity (2026-07-09) -- Patch Notes' purge in
// particular is a real, intentional exception to "patch notes history is preserved forever"
// elsewhere in this codebase, not an oversight; it only ever fires if this exact button is clicked
// and confirmed twice, never as a side effect of anything else.
const PURGE_LABELS = {
    draws: 'ALL New and Returning draws',
    calendar: 'ALL calendar events',
    loadouts: 'EVERY MP and DMZ loadout',
    patchnotes: 'the ENTIRE patch notes history'
};

const ALLOWED_ADMIN_ID = '1139845545754632283'; // Your exact Discord ID

// One entry per "page" -- label for the heading/nav button, a short description line explaining
// each action button beneath it, and the action buttons themselves (id -> becomes
// `mng_act_{page}_{id}`, style -> Discord's 1-4 button style enum). Order here is both the nav row
// order and the fallback ("no page option given") default (first key, 'draws').
const PAGES = {
    draws: {
        label: 'Draws',
        description: '**Bulk New** -- replace the New Draws list\n**Bulk Returning** -- replace the Returning Draws list\n**Bulk Both** -- replace either/both in one modal\n**Bulk Remove** -- remove multiple draws by title\n**Add New / Add Returning** -- add a single draw\n**Edit** -- search for and update an existing draw\n**Delete** -- search for and remove a draw',
        actions: [
            { id: 'bulknew', label: 'Bulk New', style: 1 },
            { id: 'bulkreturning', label: 'Bulk Returning', style: 1 },
            { id: 'bulkboth', label: 'Bulk Both', style: 1 },
            { id: 'bulkremove', label: 'Bulk Remove', style: 4 },
            { id: 'addnew', label: 'Add New Draw', style: 3 },
            { id: 'addreturning', label: 'Add Returning Draw', style: 3 },
            { id: 'edit', label: 'Edit', style: 2 },
            { id: 'delete', label: 'Delete', style: 4 },
            { id: 'purge', label: '🛑 Purge All Draws', style: 4 }
        ]
    },
    calendar: {
        label: 'Calendar',
        description: '**Bulk Add** -- replace the whole calendar\n**Bulk Remove** -- remove multiple events by title\n**Add** -- add a single event\n**Edit** -- search for and update an existing event\n**Delete** -- search for and remove an event\n**Purge** -- 🛑 wipe the entire calendar',
        actions: [
            { id: 'bulkadd', label: 'Bulk Add', style: 1 },
            { id: 'bulkremove', label: 'Bulk Remove', style: 4 },
            { id: 'add', label: 'Add', style: 3 },
            { id: 'edit', label: 'Edit', style: 2 },
            { id: 'delete', label: 'Delete', style: 4 },
            { id: 'purge', label: '🛑 Purge Calendar', style: 4 }
        ]
    },
    loadouts: {
        label: 'Loadouts',
        description: '**Bulk Add** -- add/update multiple MP or DMZ loadouts at once (upserts by weapon+mode+build, never wipes the collection)\n**Bulk Remove** -- remove multiple loadouts/builds by weapon name\n**Add** -- add a single loadout\n**Edit** -- search for and update an existing loadout\n**Delete** -- search for and remove a loadout\n**Purge** -- 🛑 wipe every MP and DMZ loadout',
        actions: [
            { id: 'bulkadd', label: 'Bulk Add', style: 1 },
            { id: 'bulkremove', label: 'Bulk Remove', style: 4 },
            { id: 'add', label: 'Add', style: 3 },
            { id: 'edit', label: 'Edit', style: 2 },
            { id: 'delete', label: 'Delete', style: 4 },
            { id: 'purge', label: '🛑 Purge All Loadouts', style: 4 }
        ]
    },
    patchnotes: {
        label: 'Patch Notes',
        description: '**Add** -- publish a new patch notes entry\n**Edit** -- search for and update an existing entry (title, additional info, release date, image URLs)\n**Purge** -- 🛑 wipe the entire patch notes history (this is separate from Season\'s Wipe Season, which always keeps patch notes -- this button is the one place that history can actually be cleared)',
        actions: [
            { id: 'add', label: 'Add', style: 3 },
            { id: 'edit', label: 'Edit', style: 2 },
            { id: 'purge', label: '🛑 Purge Patch History', style: 4 }
        ]
    },
    season: {
        label: 'Season',
        description: '**Titles & Deadlines** -- edit the main season title plus Battle Pass/Ranked/DMZ titles and end dates\n**Wipe Season** -- 🛑 start a new season (wipes draws + calendar, keeps patch notes history)',
        actions: [
            { id: 'titlesdeadlines', label: 'Titles & Deadlines', style: 1 },
            { id: 'wipe', label: 'Wipe Season', style: 4 }
        ]
    },
    export: {
        label: 'Export',
        description: '**Export New/Returning Draws, Calendar** -- download the current data in its real bulk-import-compatible text format, ready to paste back into the matching Bulk Add action.\n**Export Patch Notes** -- plain readable dump (title/date/description/URLs per entry); patch notes have no bulk-import format to round-trip into.',
        actions: [
            { id: 'newdraws', label: 'Export New Draws', style: 2 },
            { id: 'returningdraws', label: 'Export Returning Draws', style: 2 },
            { id: 'calendar', label: 'Export Calendar', style: 2 },
            { id: 'patchnotes', label: 'Export Patch Notes', style: 2 }
        ]
    }
};

// Neutral dark panel color -- this is an internal admin tool, not one of the 5 public nav-button
// commands, so it deliberately doesn't draw from the PRESET_ACCENT palette those use (see
// CLAUDE.md's color palette note) -- there's no nav row shared with those commands to stay in sync with.
const PANEL_ACCENT = 0x2b2d31;

function buildManagePage(page) {
    const pageKey = PAGES[page] ? page : 'draws';
    const pageData = PAGES[pageKey];

    const components = [
        { type: 10, content: `# 👑 Advanced Database Manager\n-# ${pageData.label} Section` },
        { type: 14, spacing: 2, divider: true },
        { type: 10, content: pageData.description },
        { type: 14, spacing: 1, divider: true }
    ];

    // Action buttons, chunked into rows of up to 5 (Discord's per-row cap) -- draws has 8 actions,
    // so it needs 2 rows; every other page fits in 1.
    const actionButtons = pageData.actions.map(a => ({
        type: 2, style: a.style, label: a.label, custom_id: `mng_act_${pageKey}_${a.id}`
    }));
    for (let i = 0; i < actionButtons.length; i += 5) {
        components.push({ type: 1, components: actionButtons.slice(i, i + 5) });
    }

    // Page nav dropdown -- was a row of nav buttons, but that caps out at 5 sections (Discord's
    // per-row button limit); switched to a select menu (up to 25 options) so adding more sections
    // later isn't constrained the same way. `default: true` on the current page marks it pre-selected
    // in the dropdown, mirroring the disabled/highlighted-button convention the button version used.
    const pageOptions = Object.entries(PAGES).map(([key, data]) => ({
        label: data.label,
        value: key,
        default: key === pageKey
    }));
    components.push({ type: 14, spacing: 2, divider: true });
    components.push({ type: 1, components: [{ type: 3, custom_id: 'mng_pagesel', placeholder: 'Jump to a section...', options: pageOptions }] });

    return [{ type: 17, accent_color: PANEL_ACCENT, components }];
}

// --- Generic one-field "search by name" modal, shown when Edit/Delete is clicked -- buttons can't
// autocomplete like a slash command option could, so this collects a query text first. index.js's
// `mng_search_` submit handler fuzzy-matches it against the target collection and either chains
// straight into the real edit modal (single match), shows a disambiguation dropdown (multiple
// matches), or reports no matches found.
const ENTITY_LABELS = { draws: 'Draw', calendar: 'Calendar Event', loadouts: 'Loadout', patchnotes: 'Patch Notes Entry' };
function buildSearchModal(group, action) {
    const entityLabel = ENTITY_LABELS[group];
    const modal = new ModalBuilder().setCustomId(`mng_search_${group}_${action}`).setTitle(`${action === 'edit' ? 'Search: Edit' : 'Search: Delete'} ${entityLabel}`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('query').setLabel(`${entityLabel} name to search for`).setStyle(TextInputStyle.Short).setRequired(true))
    );
    return modal;
}

// --- DRAWS modal builders ---
function buildBulkDrawsModal(isNew) {
    const modal = new ModalBuilder()
        .setCustomId(isNew ? 'modal_draws_bulk_new' : 'modal_draws_bulk_returning')
        .setTitle(isNew ? 'Bulk Import New Draws' : 'Bulk Import Returning Draws');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bulk_text').setLabel('Comma-Separated Data').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Title, m Item 1, e Item 2, july 10, url.jpg\nTitle 2, l Item, aug 5, url.jpg").setRequired(true))
    );
    return modal;
}

function buildBulkBothDrawsModal() {
    const modal = new ModalBuilder().setCustomId('modal_draws_bulk_both').setTitle('Bulk Import New + Returning Draws');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_text').setLabel('New Draws (leave blank to skip)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Title, m Item 1, july 10, url.jpg").setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('returning_text').setLabel('Returning Draws (leave blank to skip)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Title, l Item, aug 5, url.jpg").setRequired(false))
    );
    return modal;
}

function buildBulkRemoveDrawsModal() {
    const modal = new ModalBuilder().setCustomId('modal_draws_bulk_remove').setTitle('Bulk Remove Draws');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_titles').setLabel('Remove from New (titles, one per line)').setStyle(TextInputStyle.Paragraph).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('returning_titles').setLabel('Remove from Returning (one per line)').setStyle(TextInputStyle.Paragraph).setRequired(false))
    );
    return modal;
}

function buildAddDrawModal(drawType) {
    const modal = new ModalBuilder().setCustomId(`add_draw_${drawType}`).setTitle(`Add ${drawType === 'new' ? 'New' : 'Returning'} Draw`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Draw Title').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('items').setLabel('Items (Shorthand)').setStyle(TextInputStyle.Paragraph).setPlaceholder("m Character Name\nl Gun Name\ne Emote Name").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel('Release Date').setStyle(TextInputStyle.Short).setPlaceholder("e.g. July 15").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('url').setLabel('Thumbnail Image URL').setStyle(TextInputStyle.Short).setRequired(true))
    );
    return modal;
}

function buildEditDrawModal(targetDraw, targetId, drawType) {
    const itemsText = targetDraw.items.map(i => `${i.tier.charAt(0).toLowerCase()} ${i.name}`).join('\n');
    const modal = new ModalBuilder().setCustomId(`edit_draw_${targetId}_${drawType}`).setTitle('Edit Lucky Draw');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Draw Title').setStyle(TextInputStyle.Short).setValue(targetDraw.title)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('items').setLabel('Items (Shorthand)').setStyle(TextInputStyle.Paragraph).setValue(itemsText)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel('Release Date').setStyle(TextInputStyle.Short).setValue(new Date(targetDraw.date).toISOString().split('T')[0])),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('url').setLabel('Thumbnail URL').setStyle(TextInputStyle.Short).setValue(targetDraw.thumbnailUrl))
    );
    return modal;
}

// --- CALENDAR modal builders ---
function buildCalendarBulkAddModal() {
    const modal = new ModalBuilder().setCustomId('modal_calendar_bulk').setTitle('Bulk Import Calendar Events');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bulk_text').setLabel('Bulleted Event List (UTC-0 dates)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("• 7/2 - 8/5 | Throwable Frenzy MP Mode • 7/10 - All Season | Shadow and Shade Mythic Drop").setRequired(true))
    );
    return modal;
}

function buildCalendarBulkRemoveModal() {
    const modal = new ModalBuilder().setCustomId('modal_calendar_bulk_remove').setTitle('Bulk Remove Calendar Events');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('titles').setLabel('Event Titles (one per line)').setStyle(TextInputStyle.Paragraph).setRequired(true))
    );
    return modal;
}

function buildCalendarAddModal() {
    const modal = new ModalBuilder().setCustomId('modal_calendar_add').setTitle('Add Calendar Event');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Event Title').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('start_date').setLabel('Start Date').setStyle(TextInputStyle.Short).setPlaceholder('e.g. July 2').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('end_date').setLabel('End Date (blank = All Season)').setStyle(TextInputStyle.Short).setPlaceholder('e.g. August 5').setRequired(false))
    );
    return modal;
}

function buildEditCalendarModal(targetEvent, targetId) {
    const modal = new ModalBuilder().setCustomId(`edit_calendar_${targetId}`).setTitle('Edit Calendar Event');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Event Title').setStyle(TextInputStyle.Short).setValue(targetEvent.title)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('start_date').setLabel('Start Date').setStyle(TextInputStyle.Short).setValue(formatAdminDate(targetEvent.date))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('end_date').setLabel('End Date (blank = All Season)').setStyle(TextInputStyle.Short).setValue(targetEvent.isOngoing ? '' : formatAdminDate(targetEvent.endDate)).setRequired(false))
    );
    return modal;
}

// --- LOADOUTS modal builders ---
function buildLoadoutsBulkAddModal() {
    const modal = new ModalBuilder().setCustomId('modal_loadouts_bulk_add').setTitle('Bulk Add Loadouts (MP or DMZ)');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bulk_text').setLabel('Weapon | Category | Mode | Build | Image | Code | Badges').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("BAL-27 | AR | MP | Build 1 | BAL-27-1 | 1I2C6B8A9D | meta,best\nGauge-9 Mono\nCrown-H3 Barrel\n\nFENNEC | SMG | DMZ\nMonolithic Suppressor\nRTC Steady Stock")
            .setRequired(true))
    );
    return modal;
}

function buildLoadoutsBulkRemoveModal() {
    const modal = new ModalBuilder().setCustomId('modal_loadouts_bulk_remove').setTitle('Bulk Remove Loadouts');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('lines').setLabel('Weapon | Mode | [Build Name]').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("BAL-27 | MP  (removes ALL builds of this weapon+mode)\nBAL-27 | MP | Build 2  (removes just this one build)\nFENNEC | DMZ")
            .setRequired(true))
    );
    return modal;
}

function buildAddLoadoutModal() {
    const modal = new ModalBuilder().setCustomId('add_loadout').setTitle('Create New Loadout');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('weapon').setLabel('Weapon Name').setStyle(TextInputStyle.Short).setPlaceholder('e.g. BP50').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('build').setLabel('Build Name / Share Code').setStyle(TextInputStyle.Short).setPlaceholder('e.g. Aggressive Flex').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (One per line)').setStyle(TextInputStyle.Paragraph).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('Cloudinary Image Key').setStyle(TextInputStyle.Short).setPlaceholder('e.g. bp50_flex_v1').setRequired(true)),
        // NOTE (extended during review): Discord modals cap at 5 fields, and this one already used
        // all 5 -- so the Meta/Best/Top-N/DMZ-range "badges" ride along as a 3rd pipe-delimited
        // segment here rather than getting their own field. See adminParser.js's parseLoadoutBadges().
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('meta').setLabel('Category | Mode | Badges').setStyle(TextInputStyle.Short).setPlaceholder('AR | MP | meta,best,toxic  (or top3/top5/etc.)').setRequired(true))
    );
    return modal;
}

function buildEditLoadoutModal(targetLoadout, targetId) {
    const modal = new ModalBuilder().setCustomId(`edit_loadout_${targetId}`).setTitle('Edit Loadout');

    // Reconstruct the badges token list from what's currently saved, so re-opening this modal to
    // tweak something else doesn't silently clear existing badges. `dmzRangeRank` is stored
    // hyphenated ("best-close") but the parser's token format has no hyphen ("bestclose") -- strip
    // it back out for reconstruction.
    const existingBadges = [
        targetLoadout.isMeta ? 'meta' : null,
        targetLoadout.categoryRank,
        targetLoadout.dmzRangeRank ? targetLoadout.dmzRangeRank.replace('-', '') : null,
        targetLoadout.isToxic ? 'toxic' : null
    ].filter(Boolean).join(',');

    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('weapon').setLabel('Weapon Name').setStyle(TextInputStyle.Short).setValue(targetLoadout.weaponName)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('build').setLabel('Build Name / Code').setStyle(TextInputStyle.Short).setValue(targetLoadout.buildName)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (One per line)').setStyle(TextInputStyle.Paragraph).setValue(targetLoadout.attachments.join('\n'))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('Cloudinary Image Key').setStyle(TextInputStyle.Short).setValue(targetLoadout.imageKey)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('meta').setLabel('Category | Mode | Badges').setStyle(TextInputStyle.Short).setValue(`${targetLoadout.category} | ${targetLoadout.mode} | ${existingBadges}`))
    );
    return modal;
}

// --- PATCH NOTES modal builders ---
function buildAddPatchNotesModal() {
    const modal = new ModalBuilder().setCustomId('modal_add_patchnotes').setTitle('Add Patch Notes');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('patch_title').setLabel('Season # & Name').setStyle(TextInputStyle.Short).setPlaceholder('e.g. Season 6: Take Your Heart').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('patch_description').setLabel('Additional Info (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('patch_urls').setLabel('Cloudinary Image URLs (One per line)').setStyle(TextInputStyle.Paragraph).setRequired(true))
    );
    return modal;
}

function buildEditPatchNotesModal(targetPatch, targetId) {
    // NOTE: releaseDate used to be hardcoded to `new Date()` at creation and never editable
    // afterward -- this is the first time it can be corrected post-hoc.
    const modal = new ModalBuilder().setCustomId(`edit_patchnotes_${targetId}`).setTitle('Edit Patch Notes');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('patch_title').setLabel('Season # & Name').setStyle(TextInputStyle.Short).setValue(targetPatch.title)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('patch_description').setLabel('Additional Info (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(targetPatch.description || '')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('patch_release_date').setLabel('Release Date').setStyle(TextInputStyle.Short).setValue(formatAdminDate(targetPatch.releaseDate))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('patch_urls').setLabel('Cloudinary Image URLs (One per line)').setStyle(TextInputStyle.Paragraph).setValue(targetPatch.images.join('\n')))
    );
    return modal;
}

// --- SEASON modal builders ---
function buildWipeSeasonModal() {
    const modal = new ModalBuilder().setCustomId('modal_wipe_season').setTitle('Initialize New Season');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('season_title').setLabel('New Season Title').setStyle(TextInputStyle.Short).setPlaceholder('e.g. Season 7: Ghost in the Shell').setRequired(true))
    );
    return modal;
}

function buildSeasonTitlesDeadlinesModal(seasonalDoc) {
    // Each deadline field combines its title and end date on one line ("Battle Pass, August 28") --
    // merges what used to be two separate flows (/manage season titles' 4-title modal and
    // /update's 3-date "Edit Season Deadlines" modal) into one action, since editing a season's
    // title and its end date are really the same mental task. Pre-filled so re-submitting without
    // touching a field preserves it -- see adminParser.js's splitTitleDate() for how index.js
    // parses these back apart.
    const bpLine = [seasonalDoc?.bpTitle || 'Battle Pass', formatAdminDate(seasonalDoc?.bpEnd)].filter(Boolean).join(', ');
    const rankLine = [seasonalDoc?.rankTitle || 'Ranked Series', formatAdminDate(seasonalDoc?.rankEnd)].filter(Boolean).join(', ');
    const dmzLine = [seasonalDoc?.dmzTitle || 'DMZ Season', formatAdminDate(seasonalDoc?.dmzEnd)].filter(Boolean).join(', ');

    const modal = new ModalBuilder().setCustomId('modal_season_titles_deadlines').setTitle('Edit Season Titles & Deadlines');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('main_title').setLabel('Main Season Title').setStyle(TextInputStyle.Short).setValue(seasonalDoc?.currentSeasonTitle || '')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bp_line').setLabel('Battle Pass: Title, End Date').setStyle(TextInputStyle.Short).setValue(bpLine)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rank_line').setLabel('Ranked Series: Title, End Date').setStyle(TextInputStyle.Short).setValue(rankLine)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('dmz_line').setLabel('DMZ Season: Title, End Date').setStyle(TextInputStyle.Short).setValue(dmzLine))
    );
    return modal;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manage')
        .setDescription('👑 Advanced Database Manager')
        .setDefaultMemberPermissions(0)
        .addStringOption(option => option.setName('page').setDescription('Jump directly to a section').addChoices(
            { name: 'Draws', value: 'draws' },
            { name: 'Calendar', value: 'calendar' },
            { name: 'Loadouts', value: 'loadouts' },
            { name: 'Patch Notes', value: 'patchnotes' },
            { name: 'Season', value: 'season' },
            { name: 'Export', value: 'export' }
        )),

    PURGE_LABELS,
    buildManagePage,
    buildSearchModal,
    buildBulkDrawsModal, buildBulkBothDrawsModal, buildBulkRemoveDrawsModal, buildAddDrawModal, buildEditDrawModal,
    buildCalendarBulkAddModal, buildCalendarBulkRemoveModal, buildCalendarAddModal, buildEditCalendarModal,
    buildLoadoutsBulkAddModal, buildLoadoutsBulkRemoveModal, buildAddLoadoutModal, buildEditLoadoutModal,
    buildAddPatchNotesModal, buildEditPatchNotesModal,
    buildWipeSeasonModal, buildSeasonTitlesDeadlinesModal,

    async execute(interaction) {
        if (interaction.user.id !== ALLOWED_ADMIN_ID) {
            return interaction.reply({ content: '❌ Access Denied. You lack administrative database privileges.', ephemeral: true });
        }

        const page = interaction.options.getString('page') || 'draws';
        await interaction.deferReply({ flags: 64 });
        return sendV2Payload(interaction, buildManagePage(page));
    }
};
