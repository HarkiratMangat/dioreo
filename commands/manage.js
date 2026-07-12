// ==========================================
// COMMAND: ADVANCED DATABASE MANAGER
// ==========================================
// Single admin command covering everything the bot's data needs -- individual add/edit/delete
// for draws, calendar events, patch notes, and MP/DMZ loadouts, additive/replace bulk import,
// bulk remove for the same, season title/deadline management, per-entity data Purge (except
// Loadouts -- see PAGES.loadouts note below), and file-attachment export. Used to be split across
// this command and a separate /update dropdown-driven gateway; consolidated into one command
// (Harkirat's request -- "don't want a long list of slash commands"), then redesigned three times
// more the same week: first collapsed from a subcommand-group tree into ONE flat command that opens
// a Components V2 panel, then added Purge/a page-select dropdown/folded a briefly-standalone
// /export command back in, then (2026-07-12) rebuilt again per 4 hand-drawn mockup JSONs Harkirat
// put together himself while working around a usage-limit outage -- new title/section layout, a
// real Add-Multiple (additive) vs Replace-Multiple (destructive) distinction for draws/calendar,
// export folded INTO each entity's own page instead of a separate Export page, Loadouts losing its
// Export page in favor of a 3-way in-page export, and Patch Notes rebuilt around a single
// "current entry" model (Date/Info + URLs 1 + URLs 2) instead of add-a-new-entry-by-hand.
// `/manage` (optionally with a `page` option to jump straight to a section, and a `private` option
// to make the panel public) replies with a Container showing the current section's actions --
// clicking a button either opens its modal directly, replies with a file (Export actions), shows a
// Confirm/Cancel prompt (Purge), or, for Edit/Delete-by-search (which need a specific item picked
// first, and buttons can't autocomplete), opens a small "search by name" modal first -- see
// index.js's `mng_search_`/`mng_pick_` handlers for the resolve-then-chain-a-second-modal logic.
// This file only builds the modal SHAPES and the page/button layout; index.js owns all the routing
// and DB-mutating submit logic.
//
// NOTE on the deferred "search + multi-select" flow: the mockups describe "Delete Multiple" (all
// entities) and Loadouts' "Replace Multiple" as searching first, then picking which matches to act
// on from a list -- a new interaction, different from today's paste-a-list-of-names bulk-remove.
// Per Harkirat's explicit direction, that real search+multi-select rebuild is intentionally NOT part
// of this pass -- it's large enough on its own that bundling it here risked a usage-limit
// interruption mid-build. This pass keeps those specific actions on today's paste-based modals
// (renamed/re-styled to match the new buttons) as a deliberate placeholder, not an oversight.

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { formatAdminDate } = require('../utils/adminParser');
const { sendV2Payload } = require('../utils/sendV2Payload');
const emojis = require('../utils/emojiMap');

const ALLOWED_ADMIN_ID = '1139845545754632283'; // Your exact Discord ID

// Per-page "Purge" wording -- each page's Purge button nukes ONLY that page's own data (distinct
// from Season's existing "Wipe Season", which resets draws+calendar together as part of starting a
// new season but deliberately preserves patch notes history forever). Loadouts has NO Purge entry
// at all -- deliberate, per Harkirat's explicit call (2026-07-12): loadout data is meant to persist
// long-term, unlike draws/calendar/patch-notes which are seasonal and benefit from a quick manual
// reset. Don't add one back in without him asking again.
const PURGE_LABELS = {
    draws: 'ALL New and Returning draws',
    calendar: 'ALL calendar events',
    patchnotes: 'the ENTIRE patch notes history'
};

// One entry per "page". Each page has a title icon/label and an ordered list of `groups` -- a group
// is an optional `## ` heading (Loadouts/Calendar only -- Draws/Patch Notes render flat, no group
// headings, matching the mockups exactly) plus one or more `blocks` (each becomes its own Text
// Display -- most groups have one block per action, but Draws' Bulk-Delete+Purge group combines two
// `### ` headers into a single block, matching its mockup's exact component layout) and a `buttons`
// row (chunked into rows of 5 if it ever needs to grow past Discord's per-row cap).
const PAGES = {
    draws: {
        label: 'Draws',
        icon: `${emojis.newDraws}${emojis.returningDraws}`,
        headerLabel: 'New & Returning Draws',
        groups: [
            {
                blocks: [
                    `### ${emojis.mngAdd} Add single draw\n-# add one of either new or returning draw. Does not override data; adds onto it.`,
                    `### ${emojis.mngEdit} edit single draw\n-# updates information for a specific draw. Select either new or returning draw from search of titles.`,
                    `### ${emojis.mngDelete} delete single draw\n-# erase one of either new or returning draw. Does not override data; only removes a single draw from either list. Select either new or returning draw from search of titles.`
                ],
                // Not shown in Harkirat's mockup (the single-item section there has no button row at
                // all) -- added to match the same convention every other page's single-item section
                // uses, since Add/Edit/Delete need to actually be reachable somehow.
                buttons: [
                    { id: 'addnew', label: 'Add New', style: 3 },
                    { id: 'addreturning', label: 'Add Returning', style: 3 },
                    { id: 'edit', label: 'Edit', style: 1 },
                    { id: 'delete', label: 'Delete', style: 4 }
                ]
            },
            {
                blocks: [`### ${emojis.mngBulkAdd} Bulk Add Draws\n- \`add multiple\` - new draws only\n- \`add multiple\` - returning draws only\n- \`add multiple\` - either/both draws\n-# Does not override existing draws data; adds onto it.`],
                buttons: [
                    { id: 'bulkaddnew', label: 'New', style: 3 },
                    { id: 'bulkaddreturning', label: 'Returning', style: 3 },
                    { id: 'bulkaddeither', label: 'Either/Both', style: 3 }
                ]
            },
            {
                blocks: [`### ${emojis.mngBulkReplace} Bulk Replace Draws\n- \`replace multiple\` - new draws only\n- \`replace multiple\` - returning draws only\n- \`replace multiple\` - either/both draws\n-# Will override existing draws data respectively. For either/both, if both category of draws are included in the import, it will override both pages' data. If only new or returning draws are included in the import, will only override data for that respective page.`],
                buttons: [
                    { id: 'bulkreplacenew', label: 'New', style: 1 },
                    { id: 'bulkreplacereturning', label: 'Returning', style: 1 },
                    { id: 'bulkreplaceeither', label: 'Either/Both', style: 1 }
                ]
            },
            {
                blocks: [`### ${emojis.mngBulkDelete} Bulk Delete Draws\n- \`delete multiple\` - new draws only\n- \`delete multiple\`- returning draws only\n- \`delete multiple\` - either/both draws\n-# Doesn't erase all the draws data; only erases draws selected from the search. new draws search will only include titles from new draws list. Similarly for returning draws. either/both search will include draw titles from both categories combined.\n\n### ${emojis.mngPurge} Purge All Draws\n-# Erases all the draws data to start fresh for a new season.`],
                buttons: [
                    { id: 'bulkdeletenew', label: 'New', style: 4 },
                    { id: 'bulkdeletereturning', label: 'Returning', style: 4 },
                    { id: 'bulkdeleteeither', label: 'Either/Both', style: 4 },
                    { id: 'purge', label: 'PURGE', style: 4 }
                ]
            },
            {
                blocks: [`### ${emojis.mngExport} Export Draws\n-# Extract the new/returning draws info, formatted for an easy re-import.`],
                buttons: [
                    { id: 'exportnew', label: 'Export New Draws', style: 2 },
                    { id: 'exportreturning', label: 'Export Returning Draws', style: 2 }
                ]
            }
        ]
    },
    calendar: {
        label: 'Calendar',
        icon: emojis.calendar,
        headerLabel: 'Calendar',
        groups: [
            {
                heading: 'Single Event Data',
                blocks: [
                    `### ${emojis.mngAdd} Add single event\n-# add one event to the calendar. Does not override data; adds onto it.`,
                    `### ${emojis.mngEdit} edit single event\n-# updates information for a specific event. Search by event title.`,
                    `### ${emojis.mngDelete} delete single event\n-# erase a single event. Does not override data; only removes one event from the calendar. Search by event title.`
                ],
                buttons: [
                    { id: 'add', label: 'Add', style: 3 },
                    { id: 'edit', label: 'Edit', style: 1 },
                    { id: 'delete', label: 'Delete', style: 4 }
                ]
            },
            {
                heading: 'Multiple Events Data',
                blocks: [
                    `### ${emojis.mngBulkAdd} Add Multiple events\n-# Add multiple events at once. Does not override events data; adds onto it.`,
                    `### ${emojis.mngBulkReplace} Replace Multiple Events\n-# Will override existing events data. Erases previous data and substitutes it with the new data.`,
                    `### ${emojis.mngBulkDelete} Delete Multiple Events\n-# Doesn't erase all the events data; only erases events selected from the search.`
                ],
                buttons: [
                    { id: 'addmultiple', label: 'Add', style: 3 },
                    { id: 'replacemultiple', label: 'Replace', style: 1 },
                    { id: 'deletemultiple', label: 'Delete', style: 4 }
                ]
            },
            {
                heading: 'Misc.',
                blocks: [
                    `### ${emojis.mngExport} Export All Events\n-# Extract the events info, formatted for an easy re-import.`,
                    `### ${emojis.mngPurge} Purge All Events\n-# Erases all the events data to start fresh for a new season.`
                ],
                buttons: [
                    { id: 'export', label: 'Export', style: 2 },
                    { id: 'purge', label: 'PURGE', style: 4 }
                ]
            }
        ]
    },
    // Loadouts (MP + DMZ) -- structurally identical pages, differing only in `mode`. DMZ literally
    // reuses this same shape (Harkirat: "just copy that for DMZ loadouts since they're essentially
    // the same thing") via `buildLoadoutsPage(mode)` below rather than a second hand-copied entry.
    loadouts_mp: loadoutsPageDef('MP', 'MP Loadouts', emojis.rank),
    loadouts_dmz: loadoutsPageDef('DMZ', 'DMZ Loadouts', emojis.dmz),
    patchnotes: {
        label: 'Patch Notes',
        icon: emojis.patchNotes,
        headerLabel: 'Patch Notes',
        groups: [
            {
                blocks: [
                    `### ${emojis.mngInfo} Release Date & Additional Info\n-# View, edit/replace, or remove the release date and additional info sections of the current balance changes.`,
                    `### ${emojis.mngUrls} URLs\n-# View, edit/replace, or remove the URLs for the balance changes. First 5 URLs only.`,
                    `### ${emojis.mngUrls} URLs (Additional)\n-# View, edit/replace, or remove the URLs for the balance changes. Additional 5 URLs only. *Use when balance changes consists of more than 5 urls.*`
                ],
                buttons: [
                    { id: 'dateinfo', label: 'Date/Info', style: 3 },
                    { id: 'urls1', label: 'URLs 1', style: 1 },
                    { id: 'urls2', label: 'URLs 2', style: 1 }
                ]
            },
            {
                blocks: [`### ${emojis.mngPurge} Purge All Patch Notes\n-# Erases all the release date, additional info, and URLs data to start fresh for a new season.`],
                buttons: [{ id: 'purge', label: 'PURGE', style: 4 }]
            }
        ]
    }
};

// Loadouts page definition factory -- MP and DMZ render from the exact same shape, just with a
// different `mode` baked into every action id (so index.js's handlers know which collection slice
// to touch) and a different header icon/label.
function loadoutsPageDef(mode, headerLabel, icon) {
    return {
        label: headerLabel,
        icon,
        headerLabel,
        mode,
        groups: [
            {
                heading: 'Manage a Single Loadout',
                blocks: [
                    `### ${emojis.mngAdd} Add single Loadout\n-# add one loadout. Does not override data; adds onto it.`,
                    `### ${emojis.mngEdit} edit single loadout\n-# updates information for a specific loadout. Select a ${mode} loadout by searching by weapon name.`,
                    `### ${emojis.mngDelete} delete single loadout\n-# Remove a loadout. Does not override all data; only removes a single loadout from the database. Select a ${mode} loadout by searching by weapon name.`
                ],
                buttons: [
                    { id: 'add', label: 'Add', style: 3 },
                    { id: 'edit', label: 'Edit', style: 1 },
                    { id: 'delete', label: 'Delete', style: 4 }
                ]
            },
            {
                heading: 'Manage Multiple Loadouts',
                blocks: [
                    `### ${emojis.mngBulkAdd} Add Multiple Loadouts\n-# Add multiple new loadouts to the database. Image automatically parsed from Cloudinary (use Claude to upload image to Cloudinary).`,
                    `### ${emojis.mngBulkReplace} Replace Multiple Loadouts\n-# Replace multiple loadouts at once by searching and selecting from a list. Overrides previous data for the selected loadout. Image data is retained based on weapon/file name on Cloudinary.`,
                    `### ${emojis.mngBulkDelete} Delete Multiple Loadouts\n-# Remove multiple loadouts by searching and selecting from a list. Permanently erases the loadout data. Keeps the image stored on Cloudinary.`
                ],
                buttons: [
                    { id: 'bulkadd', label: 'Add', style: 3 },
                    { id: 'bulkreplace', label: 'Replace', style: 1 },
                    { id: 'bulkdelete', label: 'Delete', style: 4 }
                ]
            },
            {
                heading: 'Export Loadouts',
                blocks: [
                    `### ${emojis.mngExport} Export Up To 5 Loadouts\n-# Extract up to 5 loadouts by searching from the list, formatted for an easy re-import.`,
                    `### ${emojis.mngExport} Export A Category\n-# Extract all the loadouts of a specific category of weapons, formatted for an easy re-import.`,
                    `### ${emojis.mngExport} Export All Loadouts\n-# Extract all the loadouts stored in the database, formatted for an easy re-import.`
                ],
                buttons: [
                    { id: 'exportupto5', label: 'Up To 5', style: 2 },
                    { id: 'exportcategory', label: 'Category', style: 2 },
                    { id: 'exportall', label: 'All', style: 2 }
                ]
                // No Purge here -- see PURGE_LABELS comment above.
            }
        ]
    };
}

// Neutral dark panel color -- this is an internal admin tool, not one of the 5 public nav-button
// commands, so it deliberately doesn't draw from the PRESET_ACCENT palette those use.
const PANEL_ACCENT = 0x2b2d31;

function buildManagePage(page) {
    const pageKey = PAGES[page] ? page : 'draws';
    const pageData = PAGES[pageKey];

    const components = [
        { type: 10, content: `# ${emojis.database} Database Management\n## ${pageData.icon} ${pageData.headerLabel}` },
        { type: 14, spacing: 1, divider: true }
    ];

    pageData.groups.forEach(group => {
        if (group.heading) components.push({ type: 10, content: `## ${group.heading}` });
        group.blocks.forEach(content => components.push({ type: 10, content }));
        const buttons = group.buttons.map(a => ({ type: 2, style: a.style, label: a.label, custom_id: `mng_act_${pageKey}_${a.id}` }));
        for (let i = 0; i < buttons.length; i += 5) components.push({ type: 1, components: buttons.slice(i, i + 5) });
        components.push({ type: 14, spacing: 1, divider: true });
    });

    components.push({ type: 10, content: '-# Select from the list below to manage a different command\'s data.' });

    // Page nav dropdown -- Season has NO page of its own at all (per Harkirat's request: "let that
    // selection open the editing modal right away instead of a dedicated management page"). Rather
    // than one "Season" option leading to an intermediate page with 2 buttons (Titles & Deadlines /
    // Wipe Season), both of Season's actions get their own flat dropdown entries -- picking either
    // opens its modal directly with nothing in between, see index.js's `mng_pagesel` handler.
    const pageOptions = [
        ...Object.entries(PAGES).map(([key, data]) => ({ label: data.label, value: key, default: key === pageKey })),
        { label: 'Season: Titles & Deadlines', value: 'season_titlesdeadlines', default: false },
        { label: 'Season: Wipe Season', value: 'season_wipe', default: false }
    ];
    components.push({ type: 1, components: [{ type: 3, custom_id: 'mng_pagesel', placeholder: 'Jump to a section...', options: pageOptions }] });

    return [{ type: 17, accent_color: PANEL_ACCENT, components }];
}

// --- Generic one-field "search by name" modal, shown when Edit/Delete is clicked -- buttons can't
// autocomplete like a slash command option could, so this collects a query text first. index.js's
// `mng_search_` submit handler fuzzy-matches it against the target collection and either chains
// straight into the real edit modal (single match), shows a disambiguation dropdown (multiple
// matches), or reports no matches found.
const ENTITY_LABELS = { draws: 'Draw', calendar: 'Calendar Event', loadouts_mp: 'MP Loadout', loadouts_dmz: 'DMZ Loadout', patchnotes: 'Patch Notes Entry' };
function buildSearchModal(group, action) {
    const entityLabel = ENTITY_LABELS[group] || 'Item';
    const modal = new ModalBuilder().setCustomId(`mng_search_${group}_${action}`).setTitle(`${action === 'edit' ? 'Search: Edit' : 'Search: Delete'} ${entityLabel}`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('query').setLabel(`${entityLabel} name to search for`).setStyle(TextInputStyle.Short).setRequired(true))
    );
    return modal;
}

// --- DRAWS modal builders ---
function buildBulkDrawsModal(isNew, mode) {
    // `mode` distinguishes an ADDITIVE bulk-add (appends onto the existing array) from the
    // pre-existing REPLACE behavior (wholesale-overwrites it) -- same parser either way
    // (parseBulkDrawList), the only difference is what index.js's submit handler does with the
    // parsed result. custom_id carries `mode` through so the submit handler doesn't need to guess.
    const modal = new ModalBuilder()
        .setCustomId(`modal_draws_bulk_${mode}_${isNew ? 'new' : 'returning'}`)
        .setTitle(`${mode === 'add' ? 'Bulk Add' : 'Bulk Replace'} ${isNew ? 'New' : 'Returning'} Draws`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bulk_text').setLabel('Comma-Separated Data').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Title, m Item 1, e Item 2, july 10, url.jpg\nTitle 2, l Item, aug 5, url.jpg").setRequired(true))
    );
    return modal;
}

function buildBulkBothDrawsModal(mode) {
    const modal = new ModalBuilder().setCustomId(`modal_draws_bulk_${mode}_both`).setTitle(`${mode === 'add' ? 'Bulk Add' : 'Bulk Replace'} New + Returning Draws`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_text').setLabel('New Draws (leave blank to skip)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Title, m Item 1, july 10, url.jpg").setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('returning_text').setLabel('Returning Draws (leave blank to skip)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Title, l Item, aug 5, url.jpg").setRequired(false))
    );
    return modal;
}

function buildBulkRemoveDrawsModal(drawType) {
    // drawType: 'new' | 'returning' | 'either' -- either/both shows both fields, new/returning
    // shows only the one relevant field (the other stays blank/unused for that submit).
    const modal = new ModalBuilder().setCustomId(`modal_draws_bulk_remove_${drawType}`).setTitle('Bulk Delete Draws');
    const rows = [];
    if (drawType !== 'returning') rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_titles').setLabel('Remove from New (titles, one per line)').setStyle(TextInputStyle.Paragraph).setRequired(drawType === 'new')));
    if (drawType !== 'new') rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('returning_titles').setLabel('Remove from Returning (one per line)').setStyle(TextInputStyle.Paragraph).setRequired(drawType === 'returning')));
    modal.addComponents(...rows);
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
function buildCalendarBulkModal(mode) {
    // mode: 'add' (additive -- NEW, appends) | 'replace' (existing wholesale-replace behavior)
    const modal = new ModalBuilder().setCustomId(`modal_calendar_bulk_${mode}`).setTitle(mode === 'add' ? 'Add Multiple Calendar Events' : 'Replace Calendar Events');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bulk_text').setLabel('Bulleted Event List (UTC-0 dates)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("• 7/2 - 8/5 | Throwable Frenzy MP Mode • 7/10 - All Season | Shadow and Shade Mythic Drop").setRequired(true))
    );
    return modal;
}

function buildCalendarBulkRemoveModal() {
    const modal = new ModalBuilder().setCustomId('modal_calendar_bulk_remove').setTitle('Delete Multiple Calendar Events');
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

// --- LOADOUTS modal builders --- (shared by MP + DMZ, `mode` param picks which)
function buildLoadoutsBulkAddModal(mode) {
    // Header line still carries Mode as its 3rd field to match parseBulkLoadoutList()'s existing
    // format unchanged (no parser risk) -- index.js's submit handler force-overrides every parsed
    // entry's mode to match whichever page (MP/DMZ) this modal was opened from regardless of what's
    // typed here, since the page itself already scopes it; the field just avoids touching the shared
    // parser.
    const modal = new ModalBuilder().setCustomId(`modal_loadouts_bulk_add_${mode}`).setTitle(`Bulk Add ${mode} Loadouts`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bulk_text').setLabel('Weapon | Category | Mode | Build | etc').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(`BAL-27 | AR | ${mode} | Build 1 | BAL-27-1 | 1I2C6B8A9D | meta,best\nGauge-9 Mono\nCrown-H3 Barrel`)
            .setRequired(true))
    );
    return modal;
}

function buildLoadoutsBulkRemoveModal(mode) {
    const modal = new ModalBuilder().setCustomId(`modal_loadouts_bulk_remove_${mode}`).setTitle(`Delete Multiple ${mode} Loadouts`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('lines').setLabel('Weapon | [Build Name]').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("BAL-27  (removes ALL builds of this weapon)\nBAL-27 | Build 2  (removes just this one build)")
            .setRequired(true))
    );
    return modal;
}

// "Up To 5" and "Category" export are collected via a small modal first (a real live search+select
// list is the deferred future work -- see this file's top-of-file note); "All" needs no modal at
// all and replies with the file directly from the mng_act_ handler.
function buildLoadoutsExportUpTo5Modal(mode) {
    const modal = new ModalBuilder().setCustomId(`modal_loadouts_export5_${mode}`).setTitle(`Export Up To 5 ${mode} Loadouts`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('weapons').setLabel('Weapon Names (up to 5, one per line)').setStyle(TextInputStyle.Paragraph).setRequired(true))
    );
    return modal;
}

function buildLoadoutsExportCategoryModal(mode) {
    const modal = new ModalBuilder().setCustomId(`modal_loadouts_exportcategory_${mode}`).setTitle(`Export a ${mode} Category`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('category').setLabel('Category').setStyle(TextInputStyle.Short).setPlaceholder('e.g. AR').setRequired(true))
    );
    return modal;
}

function buildAddLoadoutModal(mode) {
    const modal = new ModalBuilder().setCustomId(`add_loadout_${mode}`).setTitle(`Create New ${mode} Loadout`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('weapon').setLabel('Weapon Name').setStyle(TextInputStyle.Short).setPlaceholder('e.g. BP50').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('build').setLabel('Build Name / Share Code').setStyle(TextInputStyle.Short).setPlaceholder('e.g. Aggressive Flex').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (One per line)').setStyle(TextInputStyle.Paragraph).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('Cloudinary Image Key').setStyle(TextInputStyle.Short).setPlaceholder('e.g. bp50_flex_v1').setRequired(true)),
        // NOTE: Discord modals cap at 5 fields, and this one already used all 5 -- so Category and
        // the Meta/Best/Top-N/DMZ-range "badges" ride along as pipe-delimited segments here rather
        // than getting their own fields. Mode itself no longer needs a slot (it's baked into which
        // button/page you clicked), unlike the pre-2026-07-12 single-modal-for-both-modes version.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('meta').setLabel('Category | Badges').setStyle(TextInputStyle.Short).setPlaceholder('AR | meta,best,toxic  (or top3/top5/etc.)').setRequired(true))
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
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('meta').setLabel('Category | Badges').setStyle(TextInputStyle.Short).setValue(`${targetLoadout.category} | ${existingBadges}`))
    );
    return modal;
}

// --- PATCH NOTES modal builders --- (all 3 operate on the single "current" entry -- the last item
// in patchNotes[], the one whose title stays synced to currentSeasonTitle -- rather than a
// search-and-pick flow. If none exists yet, Date/Info's submit creates the first one.)
function buildPatchDateInfoModal(currentEntry) {
    const modal = new ModalBuilder().setCustomId('modal_patch_dateinfo').setTitle('Patch Notes: Date & Info');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('release_date').setLabel('Release Date').setStyle(TextInputStyle.Short).setPlaceholder('e.g. July 15').setValue(currentEntry ? formatAdminDate(currentEntry.releaseDate) : '').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Additional Info (optional)').setStyle(TextInputStyle.Paragraph).setValue(currentEntry?.description || '').setRequired(false))
    );
    return modal;
}

function buildPatchUrlsModal(slot, currentEntry) {
    // slot: 1 -> images[0..4], 2 -> images[5..9]
    const images = currentEntry?.images || [];
    const slice = slot === 1 ? images.slice(0, 5) : images.slice(5, 10);
    const modal = new ModalBuilder().setCustomId(`modal_patch_urls_${slot}`).setTitle(`Patch Notes: URLs ${slot}`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urls').setLabel(`Image URLs ${slot === 1 ? '1-5' : '6-10'} (one per line)`).setStyle(TextInputStyle.Paragraph).setValue(slice.join('\n')).setRequired(false))
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
    // pre-filled so re-submitting without touching a field preserves it -- see adminParser.js's
    // splitTitleDate() for how index.js parses these back apart.
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
        .setIntegrationTypes([1]).setContexts([0, 1, 2]) // User-install app + DM support
        .addStringOption(option => option.setName('page').setDescription('Jump directly to a section').addChoices(
            { name: 'Draws', value: 'draws' },
            { name: 'Calendar', value: 'calendar' },
            { name: 'MP Loadouts', value: 'loadouts_mp' },
            { name: 'DMZ Loadouts', value: 'loadouts_dmz' },
            { name: 'Patch Notes', value: 'patchnotes' }
        ))
        .addBooleanOption(option => option.setName('private').setDescription('Hide this panel so only you can see it (default: yes)')),

    PAGES,
    PURGE_LABELS,
    buildManagePage,
    buildSearchModal,
    buildBulkDrawsModal, buildBulkBothDrawsModal, buildBulkRemoveDrawsModal, buildAddDrawModal, buildEditDrawModal,
    buildCalendarBulkModal, buildCalendarBulkRemoveModal, buildCalendarAddModal, buildEditCalendarModal,
    buildLoadoutsBulkAddModal, buildLoadoutsBulkRemoveModal, buildAddLoadoutModal, buildEditLoadoutModal,
    buildLoadoutsExportUpTo5Modal, buildLoadoutsExportCategoryModal,
    buildPatchDateInfoModal, buildPatchUrlsModal,
    buildWipeSeasonModal, buildSeasonTitlesDeadlinesModal,

    async execute(interaction) {
        if (interaction.user.id !== ALLOWED_ADMIN_ID) {
            return interaction.reply({ content: '❌ Access Denied. You lack administrative database privileges.', ephemeral: true });
        }

        const page = interaction.options.getString('page') || 'draws';
        // Default ephemeral (true) unless explicitly set to public -- matches the "default private"
        // convention Harkirat asked for on this specific command (every OTHER command defaults
        // public; this one is the admin panel, so it flips the default).
        const argPrivate = interaction.options.getBoolean('private');
        const isEphemeral = argPrivate === null ? true : argPrivate;
        await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        return sendV2Payload(interaction, buildManagePage(page));
    }
};
