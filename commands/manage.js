// ==========================================
// COMMAND: ADVANCED DATABASE MANAGER
// ==========================================
// Single admin command covering everything the bot's data needs — individual add/edit/delete
// for draws, calendar events, patch notes, and MP/DMZ loadouts, additive/replace bulk import,
// bulk remove for the same, season title/deadline management, per-entity data Purge (except
// Loadouts — see PAGES.loadouts note below), and file-attachment export. Used to be split across
// this command and a separate /update dropdown-driven gateway; consolidated into one command
// (Harkirat's request — "don't want a long list of slash commands"), then redesigned three times
// more the same week: first collapsed from a subcommand-group tree into ONE flat command that opens
// a Components V2 panel, then added Purge/a page-select dropdown/folded a briefly-standalone
// /export command back in, then (2026-07-12) rebuilt again per 4 hand-drawn mockup JSONs Harkirat
// put together himself while working around a usage-limit outage — new title/section layout, a
// real Add-Multiple (additive) vs Replace-Multiple (destructive) distinction for draws/calendar,
// export folded INTO each entity's own page instead of a separate Export page, Loadouts losing its
// Export page in favor of a 3-way in-page export, and Patch Notes rebuilt around a single
// "current entry" model (Date/Info + URLs 1 + URLs 2) instead of add-a-new-entry-by-hand.
// `/manage` (optionally with a `section` option to jump straight to a section, and a `hidden` option
// to make the panel public) replies with a Container showing the current section's actions —
// clicking a button either opens its modal directly, replies with a file (Export actions), shows a
// Confirm/Cancel prompt (Purge), or, for Edit/Delete-by-search (which need a specific item picked
// first, and buttons can't autocomplete), opens a small "search by name" modal first — see
// index.js's `mng_search_`/`mng_pick_` handlers for the resolve-then-chain-a-second-modal logic.
// This file only builds the modal SHAPES and the page/button layout; index.js owns all the routing
// and DB-mutating submit logic.
//
// NOTE on the deferred "search + multi-select" flow: the mockups describe "Delete Multiple" (all
// entities) and Loadouts' "Replace Multiple" as searching first, then picking which matches to act
// on from a list — a new interaction, different from today's paste-a-list-of-names bulk-remove.
// Per Harkirat's explicit direction, that real search+multi-select rebuild is intentionally NOT part
// of this pass — it's large enough on its own that bundling it here risked a usage-limit
// interruption mid-build. This pass keeps those specific actions on today's paste-based modals
// (renamed/re-styled to match the new buttons) as a deliberate placeholder, not an oversight.

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { formatAdminDate } = require('../utils/adminParser');
const { sendV2Payload } = require('../utils/sendV2Payload');
const emojis = require('../utils/emojiMap');

const ALLOWED_ADMIN_ID = '1139845545754632283'; // Your exact Discord ID

// Per-page "Purge" wording — each page's Purge button nukes ONLY that page's own data (distinct
// from Season's existing "Start New Season" (formerly "Wipe Season"), which resets draws+calendar
// together as part of starting a new season but deliberately preserves patch notes history
// forever). Loadouts has NO Purge entry at all — deliberate, per Harkirat's explicit call
// (2026-07-12): loadout data is meant to persist long-term, unlike draws/calendar/patch-notes which
// are seasonal and benefit from a quick manual reset. Don't add one back in without him asking again.
//
// Draws gained 3 granular purge SCOPES (2026-07-12, was one "purge everything" button) — `all`,
// `new`, `returning` — since a Purge that only affects one of the two draw categories didn't exist
// before. Every other group only has one scope ('all'), but is still keyed the same way so
// index.js's confirm/cancel handlers can treat every group identically (`PURGE_LABELS[group].all`
// vs `PURGE_LABELS[group][scope]`).
const PURGE_LABELS = {
    draws: { all: 'ALL New and Returning draws', new: 'ALL New draws only', returning: 'ALL Returning draws only' },
    calendar: { all: 'ALL calendar events' },
    patchnotes: { all: 'the ENTIRE patch notes history' }
};

// One entry per "page". Each page has a title icon/label and an ordered list of `groups` — a group
// is an optional `## ` heading (Loadouts/Calendar only — Draws/Patch Notes render flat, no group
// headings, matching the mockups exactly) plus one or more `blocks` (each becomes its own Text
// Display — most groups have one block per action, but Draws' Bulk-Delete+Purge group combines two
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
                    `### ${emojis.mngAdd} Add Single Draw\n-# Add one new or returning draw. Additive — doesn't affect existing draws.`,
                    `### ${emojis.mngEdit} Edit Single Draw\n-# Update an existing draw's info. Search by title to pick a new or returning draw.`,
                    `### ${emojis.mngDelete} Delete Single Draw\n-# Remove a single draw. Search by title to pick a new or returning draw.`
                ],
                // Not shown in Harkirat's mockup (the single-item section there has no button row at
                // all) — added to match the same convention every other page's single-item section
                // uses, since Add/Edit/Delete need to actually be reachable somehow.
                buttons: [
                    { id: 'addnew', label: 'Add New', style: 3 },
                    { id: 'addreturning', label: 'Add Returning', style: 3 },
                    { id: 'edit', label: 'Edit', style: 1 },
                    { id: 'delete', label: 'Delete', style: 4 }
                ]
            },
            {
                // Bulk section grouped together like the single-item section above (2026-07-12,
                // Harkirat's correction) — one shared button row under all 3 bulk blocks, instead of
                // each bulk action being its own group with its own divider. New/Returning/Either
                // buttons were ALSO condensed to ONE button each (same pass) — Either/Both already
                // covers the single-category cases by leaving one field blank, so the 3-way split
                // was pure redundancy. Replace's semantics changed too: was a wholesale wipe-then-
                // replace of the whole array; now upserts by fuzzy-matched title (update in place if
                // found, insert if not) — Purge already covers full wipes, so Replace doesn't need to
                // double as one anymore.
                blocks: [
                    `### ${emojis.mngBulkAdd} Add Multiple Draws\n-# Add multiple new and/or returning draws at once (leave a field blank to skip it). Additive — doesn't affect existing draws.`,
                    `### ${emojis.mngBulkReplace} Replace Multiple Draws\n-# Updates existing draws by matching title, or adds them if they don't exist yet. Draws not included in the paste are left untouched — use Purge below for a full wipe.`,
                    `### ${emojis.mngBulkDelete} Delete Multiple Draws\n-# Remove multiple draws at once by pasting their titles. Only removes what's matched by search — everything else is left untouched.`
                ],
                buttons: [
                    { id: 'bulkadd', label: 'Add Multiple', style: 3 },
                    { id: 'bulkreplace', label: 'Replace Multiple', style: 1 },
                    { id: 'bulkdelete', label: 'Delete Multiple', style: 4 }
                ]
            },
            {
                // Purge moved into its own fully separate section (2026-07-12, was folded into the
                // Bulk Delete block above) and expanded from one "wipe everything" button to 3
                // granular scopes, since only being able to wipe New+Returning together was a real
                // gap once you just wanted to reset one of the two.
                blocks: [`### ${emojis.mngPurge} Purge Draws Data\n-# Permanently erase draws to start fresh for a new season. Choose a scope below.`],
                buttons: [
                    { id: 'purgenew', label: 'Purge New Draws Only', style: 4 },
                    { id: 'purgereturning', label: 'Purge Returning Draws Only', style: 4 },
                    { id: 'purgeall', label: 'Purge All Draws Data', style: 4 }
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
                // Group headings dropped (2026-07-12, Harkirat's request) -- the section content
                // already speaks for itself the same way Draws' page never had group headings.
                blocks: [
                    `### ${emojis.mngAdd} Add Single Event\n-# Add one event to the calendar. Additive — doesn't affect existing events.`,
                    `### ${emojis.mngEdit} Edit Single Event\n-# Update an existing event's info. Search by event title.`,
                    `### ${emojis.mngDelete} Delete Single Event\n-# Remove a single event. Search by event title.`
                ],
                buttons: [
                    { id: 'add', label: 'Add', style: 3 },
                    { id: 'edit', label: 'Edit', style: 1 },
                    { id: 'delete', label: 'Delete', style: 4 }
                ]
            },
            {
                blocks: [
                    `### ${emojis.mngBulkAdd} Add Multiple Events\n-# Add multiple events at once. Additive — doesn't affect existing events.`,
                    `### ${emojis.mngBulkReplace} Replace Multiple Events\n-# Updates existing events by matching title, or adds them if they don't exist yet. Events not included in the paste are left untouched — use Purge below for a full wipe.`,
                    `### ${emojis.mngBulkDelete} Delete Multiple Events\n-# Remove multiple events at once by pasting their titles. Only removes what's matched by search.`
                ],
                buttons: [
                    { id: 'addmultiple', label: 'Add', style: 3 },
                    { id: 'replacemultiple', label: 'Replace', style: 1 },
                    { id: 'deletemultiple', label: 'Delete', style: 4 }
                ]
            },
            // Export and Purge split into their own separate groups (2026-07-12, Harkirat's
            // request) -- buildManagePage already puts a divider BETWEEN every group, so this alone
            // gives them the requested separator. Each renders as a `style: 'inline'` group --
            // a Section with the button as a side accessory (same pattern /settings' visibility
            // toggles use) instead of the block-list-then-shared-button-row layout every other
            // group on this page uses.
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.mngExport} Export All Events\n-# Extract the events info, formatted for an easy re-import.`, button: { id: 'export', label: 'Export', style: 2 } }
                ]
            },
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.mngPurge} Purge All Events\n-# Permanently erase all calendar events to start fresh for a new season.`, button: { id: 'purge', label: 'Purge', style: 4 } }
                ]
            }
        ]
    },
    // Loadouts (MP + DMZ) — structurally identical pages, differing only in `mode`. DMZ literally
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
                    `### ${emojis.mngInfo} Release Date & Additional Info\n-# View, edit, or clear the release date and additional info for the current balance changes.`,
                    `### ${emojis.mngUrls} URLs\n-# View, edit, or clear the URLs for the current balance changes. First 5 only.`,
                    `### ${emojis.mngUrls} URLs (Additional)\n-# View, edit, or clear the URLs for the current balance changes. *Use this when there are more than 5 URLs.*`
                ],
                buttons: [
                    { id: 'dateinfo', label: 'Date/Info', style: 3 },
                    { id: 'urls1', label: 'URLs 1', style: 1 },
                    { id: 'urls2', label: 'URLs 2', style: 1 }
                ]
            },
            {
                blocks: [`### ${emojis.mngPurge} Purge All Patch Notes\n-# Permanently erase the release date, additional info, and URL history to start fresh for a new season.`],
                buttons: [{ id: 'purge', label: 'Purge', style: 4 }]
            }
        ]
    }
};

// Loadouts page definition factory — MP and DMZ render from the exact same shape, just with a
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
                    `### ${emojis.mngAdd} Add Single Loadout\n-# Add one loadout. Additive — doesn't affect existing loadouts.`,
                    `### ${emojis.mngEdit} Edit Single Loadout\n-# Update an existing loadout's info. Search by weapon name to pick a ${mode} loadout.`,
                    `### ${emojis.mngDelete} Delete Single Loadout\n-# Remove a single loadout from the database. Search by weapon name to pick a ${mode} loadout.`
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
                    `### ${emojis.mngBulkAdd} Add Multiple Loadouts\n-# Add multiple new loadouts at once. Image is pulled from Cloudinary automatically once uploaded there.`,
                    `### ${emojis.mngBulkReplace} Replace Multiple Loadouts\n-# Update existing loadouts by weapon/build match, or add them if they don't exist yet. Image data is kept based on the Cloudinary key.`,
                    `### ${emojis.mngBulkDelete} Delete Multiple Loadouts\n-# Remove multiple loadouts at once by pasting their weapon (and optionally build) names. The image stays on Cloudinary.`
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
                    `### ${emojis.mngExport} Export Up To 5 Loadouts\n-# Extract up to 5 loadouts by weapon name, formatted for an easy re-import.`,
                    `### ${emojis.mngExport} Export A Category\n-# Extract every loadout in one weapon category, formatted for an easy re-import.`,
                    `### ${emojis.mngExport} Export All Loadouts\n-# Extract every loadout in the database, formatted for an easy re-import.`
                ],
                buttons: [
                    { id: 'exportupto5', label: 'Up To 5', style: 2 },
                    { id: 'exportcategory', label: 'Category', style: 2 },
                    { id: 'exportall', label: 'All', style: 2 }
                ]
                // No Purge here — see PURGE_LABELS comment above.
            }
        ]
    };
}

// Neutral dark panel color — this is an internal admin tool, not one of the 5 public nav-button
// commands, so it deliberately doesn't draw from the PRESET_ACCENT palette those use.
const PANEL_ACCENT = 0x2b2d31;

function buildManagePage(page) {
    const pageKey = PAGES[page] ? page : 'draws';
    const pageData = PAGES[pageKey];

    const components = [
        { type: 10, content: `# ${emojis.database} Database Management\n## ${pageData.icon} ${pageData.headerLabel}` },
        { type: 14, spacing: 2, divider: true }
    ];

    // Large divider spacing (2026-07-12, matches drawprices.js's spacing:2 change) — applied to
    // EVERY divider on this panel now, including the one right after the title (that exception was
    // dropped the same day it was introduced, per Harkirat's explicit "large spacing across the
    // board" follow-up).
    pageData.groups.forEach(group => {
        if (group.heading) components.push({ type: 10, content: `## ${group.heading}` });
        if (group.style === 'inline') {
            // Section + button-accessory (2026-07-12, Calendar's Export/Purge groups) -- same
            // pattern /settings' visibility toggles use, instead of a block-list-then-shared-row.
            group.items.forEach(item => {
                components.push({
                    type: 9,
                    components: [{ type: 10, content: item.text }],
                    accessory: { type: 2, style: item.button.style, label: item.button.label, custom_id: `mng_act_${pageKey}_${item.button.id}` }
                });
            });
        } else {
            group.blocks.forEach(content => components.push({ type: 10, content }));
            const buttons = group.buttons.map(a => ({ type: 2, style: a.style, label: a.label, custom_id: `mng_act_${pageKey}_${a.id}` }));
            for (let i = 0; i < buttons.length; i += 5) components.push({ type: 1, components: buttons.slice(i, i + 5) });
        }
        components.push({ type: 14, spacing: 2, divider: true });
    });

    components.push({ type: 10, content: '-# Select from the list below to manage a different command\'s data.' });

    // Page nav dropdown — Season has NO page of its own at all (per Harkirat's request: "let that
    // selection open the editing modal right away instead of a dedicated management page"). Rather
    // than one "Season" option leading to an intermediate page with 2 buttons (Titles & Deadlines /
    // Wipe Season), both of Season's actions get their own flat dropdown entries — picking either
    // opens its modal directly with nothing in between, see index.js's `mng_pagesel` handler.
    const pageOptions = [
        ...Object.entries(PAGES).map(([key, data]) => ({ label: data.label, value: key, default: key === pageKey })),
        { label: 'Season: Titles & Deadlines', value: 'season_titlesdeadlines', default: false },
        // Renamed from "Season: Wipe Season" (2026-07-12, Harkirat's request) — the OLD name read
        // as a low-stakes settings toggle; the option's own `description` (rendered as a smaller
        // gray line under the label in Discord's select menu) now spells out exactly what it does,
        // specifically so it isn't mistakenly clicked. Also gained the same 2-step Confirm/Cancel
        // flow as Purge (see index.js's modal_wipe_season handler) — selecting this used to wipe
        // draws/calendar the INSTANT the title modal was submitted, no confirmation at all.
        { label: 'Start New Season', value: 'season_wipe', default: false, description: '⚠️ Wipes all draws & calendar data. Cannot be undone.' }
    ];
    components.push({ type: 1, components: [{ type: 3, custom_id: 'mng_pagesel', placeholder: 'Jump to a section...', options: pageOptions }] });

    return [{ type: 17, accent_color: PANEL_ACCENT, components }];
}

// --- Generic one-field "search by name" modal, shown when Edit/Delete is clicked — buttons can't
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
// NOTE: the old per-category buildBulkDrawsModal(isNew, mode) — one modal for New-only, another
// for Returning-only — was removed 2026-07-12 when the New/Returning/Either button triplet got
// condensed to a single button per bulk section (see PAGES.draws above). buildBulkBothDrawsModal
// below (previously the "Either/Both" option only) is now the ONLY draws bulk add/replace modal —
// its two independently-optional fields already cover the single-category case by leaving one
// field blank, so there was nothing the per-category modal did that this one couldn't.
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
    // drawType: 'new' | 'returning' | 'either' — either/both shows both fields, new/returning
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
        // All 4 of these are now setRequired(false) (2026-07-12) — see the 5th field below. Discord
        // validates required fields BEFORE the modal-submit handler ever runs, so if these stayed
        // required, submitting with only the combined-line field filled would get rejected by
        // Discord itself before index.js's handler got a chance to fall back to it.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Draw Title').setStyle(TextInputStyle.Short).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('items').setLabel('Items (Shorthand)').setStyle(TextInputStyle.Paragraph).setPlaceholder("m Character Name\nl Gun Name\ne Emote Name").setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel('Release Date').setStyle(TextInputStyle.Short).setPlaceholder("e.g. July 15").setRequired(false)),
        // Optional (2026-07-12, Cloudinary-cache feature) — leaving this blank reuses whatever's
        // already cached for this exact draw title (utils/cloudinaryCache.js). Only fails if nothing
        // has ever been cached for this title yet — index.js's handler surfaces that as a clear
        // error rather than silently saving a draw with no thumbnail at all.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('url').setLabel('Thumbnail URL (blank = reuse cached image)').setStyle(TextInputStyle.Short).setRequired(false)),
        // 5th field (2026-07-12) — alternative to filling in the 4 fields above separately: paste
        // the whole draw as one bulk-style line (same format as Bulk Add/Export:
        // `Title, m Item 1, l Item 2, Date, URL`). index.js's handler runs this through the same
        // parseBulkDrawList() parser used everywhere else if it's non-empty, otherwise falls back to
        // the 4 separate fields — so exactly one of "fill in the 4 fields" or "paste one line" needs
        // to actually be used, not both.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('combined').setLabel('Or Paste As One Line (overrides fields above)').setStyle(TextInputStyle.Paragraph).setPlaceholder("Title, m Item 1, l Item 2, July 15, url.jpg").setRequired(false))
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
        // Pre-filled with the CURRENT thumbnail (already a Cloudinary URL if this draw was ever
        // cached) — optional so clearing it and resubmitting re-resolves via the cache lookup
        // instead of requiring a re-typed URL just to leave the image unchanged.
        // BUG FIX (2026-07-12): setValue() throws a synchronous validation error if given
        // `undefined`/non-string — discord.js requires a real string, even for an optional field.
        // Any draw doc missing thumbnailUrl (legacy entries from before the Cloudinary-cache
        // feature, or any doc that somehow saved without one) made this throw INSIDE
        // resolveManagePanelAction's showModal() call, before the interaction was ever acknowledged
        // — which is exactly what surfaced as Discord's generic "Something went wrong. Try again."
        // toast on Edit Draws. Fall back to '' like every other optional field already does.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('url').setLabel('Thumbnail URL (blank = reuse cached image)').setStyle(TextInputStyle.Short).setValue(targetDraw.thumbnailUrl || '').setRequired(false))
    );
    return modal;
}

// --- CALENDAR modal builders ---
function buildCalendarBulkModal(mode) {
    // mode: 'add' (additive — NEW, appends) | 'replace' (existing wholesale-replace behavior)
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
    // format unchanged (no parser risk) — index.js's submit handler force-overrides every parsed
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
// list is the deferred future work — see this file's top-of-file note); "All" needs no modal at
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
        // NOTE: Discord modals cap at 5 fields, and this one already used all 5 — so Category and
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
    // hyphenated ("best-close") but the parser's token format has no hyphen ("bestclose") — strip
    // it back out for reconstruction.
    const existingBadges = [
        targetLoadout.isMeta ? 'meta' : null,
        targetLoadout.categoryRank,
        targetLoadout.dmzRangeRank ? targetLoadout.dmzRangeRank.replace('-', '') : null,
        targetLoadout.isToxic ? 'toxic' : null
    ].filter(Boolean).join(',');

    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('weapon').setLabel('Weapon Name').setStyle(TextInputStyle.Short).setValue(targetLoadout.weaponName)),
        // Label matches Add Loadout's field (2026-07-12 wording overpass) — was shortened to
        // "Build Name / Code" here, inconsistent with the Add modal's "Build Name / Share Code" for
        // the same field.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('build').setLabel('Build Name / Share Code').setStyle(TextInputStyle.Short).setValue(targetLoadout.buildName)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (One per line)').setStyle(TextInputStyle.Paragraph).setValue(targetLoadout.attachments.join('\n'))),
        // Same undefined-to-setValue() guard as buildEditDrawModal's thumbnailUrl fix above.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('Cloudinary Image Key').setStyle(TextInputStyle.Short).setValue(targetLoadout.imageKey || '')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('meta').setLabel('Category | Badges').setStyle(TextInputStyle.Short).setValue(`${targetLoadout.category} | ${existingBadges}`))
    );
    return modal;
}

// --- PATCH NOTES modal builders --- (all 3 operate on the single "current" entry — the last item
// in patchNotes[], the one whose title stays synced to currentSeasonTitle — rather than a
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
    // slot: 1 -> images[0..4], 2 -> images[5..9]. Each of the 5 URLs now gets its OWN Short field
    // (2026-07-12, Harkirat's request) -- a modal has exactly 5 field slots and this used to put
    // all 5 URLs into ONE Paragraph field (newline-joined), which is exactly why the URLs were
    // split into two "URLs 1"/"URLs 2" modals in the first place; now that split pays off further,
    // with each field independently addressable/clearable.
    const images = currentEntry?.images || [];
    const slice = slot === 1 ? images.slice(0, 5) : images.slice(5, 10);
    const baseIndex = slot === 1 ? 1 : 6;
    const modal = new ModalBuilder().setCustomId(`modal_patch_urls_${slot}`).setTitle(`Patch Notes: URLs ${slot}`);
    modal.addComponents(
        ...[0, 1, 2, 3, 4].map(i => new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId(`url${i}`).setLabel(`Image URL ${baseIndex + i}`).setStyle(TextInputStyle.Short).setValue(slice[i] || '').setRequired(false)
        ))
    );
    return modal;
}

// --- SEASON modal builders ---
function buildWipeSeasonModal() {
    const modal = new ModalBuilder().setCustomId('modal_wipe_season').setTitle('Start New Season');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('season_title').setLabel('New Season Title').setStyle(TextInputStyle.Short).setPlaceholder('e.g. Season 7: Ghost in the Shell').setRequired(true))
    );
    return modal;
}

function buildSeasonTitlesDeadlinesModal(seasonalDoc) {
    // Each deadline field combines its title and end date on one line ("Battle Pass, August 28") —
    // pre-filled so re-submitting without touching a field preserves it — see adminParser.js's
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
    ALLOWED_ADMIN_ID, // Exposed so index.js's centralized panel-interaction guard (button/select/
                      // modal-submit) can check against the same single source of truth instead of
                      // a second hardcoded literal drifting out of sync — see the guard right after
                      // the anti-spam block in interactionCreate.
    data: new SlashCommandBuilder()
        .setName('manage')
        .setDescription('Database manager for gunsmiths and seasonal data — Add/Edit/Delete')
        .setDefaultMemberPermissions(0)
        .setIntegrationTypes([1]).setContexts([0, 1, 2]) // User-install app + DM support
        // Renamed from `page` to `section` (2026-07-12) — each option is a distinct data section
        // (Draws/Calendar/Loadouts/Patch Notes/Season), not literally a "page" of anything.
        // "Season: Titles & Deadlines" also gained a direct entry here (previously only reachable
        // via the in-panel mng_pagesel dropdown) — picking it skips the panel entirely and opens
        // that modal as the initial response, same as the dropdown's own flat entry does. "Start New
        // Season" deliberately has NO direct slash-option entry — it's destructive enough that
        // requiring the extra step through the panel dropdown (with its own warning description) is
        // intentional, not an oversight.
        .addStringOption(option => option.setName('section').setDescription('Jump directly to a section').addChoices(
            { name: 'Draws', value: 'draws' },
            { name: 'Calendar', value: 'calendar' },
            { name: 'MP Loadouts', value: 'loadouts_mp' },
            { name: 'DMZ Loadouts', value: 'loadouts_dmz' },
            { name: 'Patch Notes', value: 'patchnotes' },
            { name: 'Season: Titles & Deadlines', value: 'season_titlesdeadlines' }
        ))
        .addBooleanOption(option => option.setName('hidden').setDescription('True = only you can see this panel. False = everyone in the chat can see it. (default: True)')),

    PAGES,
    PURGE_LABELS,
    buildManagePage,
    buildSearchModal,
    buildBulkBothDrawsModal, buildBulkRemoveDrawsModal, buildAddDrawModal, buildEditDrawModal,
    buildCalendarBulkModal, buildCalendarBulkRemoveModal, buildCalendarAddModal, buildEditCalendarModal,
    buildLoadoutsBulkAddModal, buildLoadoutsBulkRemoveModal, buildAddLoadoutModal, buildEditLoadoutModal,
    buildLoadoutsExportUpTo5Modal, buildLoadoutsExportCategoryModal,
    buildPatchDateInfoModal, buildPatchUrlsModal,
    buildWipeSeasonModal, buildSeasonTitlesDeadlinesModal,

    async execute(interaction) {
        if (interaction.user.id !== ALLOWED_ADMIN_ID) {
            return interaction.reply({ content: '❌ Access Denied. You lack administrative database privileges.', ephemeral: true });
        }

        const section = interaction.options.getString('section') || 'draws';

        // Season: Titles & Deadlines is reachable directly from this option now (2026-07-12) —
        // skips rendering the panel entirely, same as picking it from the in-panel mng_pagesel
        // dropdown does. showModal() must be the FIRST response to the interaction (can't follow a
        // deferReply()), so this has to branch before the deferReply() below runs at all.
        if (section === 'season_titlesdeadlines') {
            const SeasonalData = require('../models/SeasonalData');
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
            return interaction.showModal(buildSeasonTitlesDeadlinesModal(seasonalDoc));
        }

        // Default ephemeral (true) unless explicitly set to public — matches the "default private"
        // convention Harkirat asked for on this specific command (every OTHER command defaults
        // public; this one is the admin panel, so it flips the default).
        const argPrivate = interaction.options.getBoolean('hidden');
        const isEphemeral = argPrivate === null ? true : argPrivate;
        await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        return sendV2Payload(interaction, buildManagePage(section));
    }
};
