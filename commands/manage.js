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
const { formatAdminDate, formatReleaseDateTime } = require('../utils/adminParser');
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
// ⚠️ Built per-render by buildManagePage(), NOT a module-level `const PAGES = {...}` -- that's what it
// used to be, and it silently broke EVERY emoji on EVERY /manage page on the dev bot (found
// 2026-07-26 15:52 EDT). refreshEmojiIds() rewrites emojiMap's values at boot, long after this file is
// require()d; the ~30 `${emojis.x}` interpolations below evaluate at table-build time and JS strings
// copy by value, so building the table at require() time froze the pre-sync PROD ids permanently.
// Rebuilding it per render costs ~30 template strings against a network round trip -- not worth
// memoizing, and a cache would just reintroduce a subtler version of the same staleness bug.
function buildPagesTable() {
  return {
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
            },
            // Bulk Format Guide -- last section on every page that has one (2026-07-31 17:20 EDT,
            // direct correction: was mid-page, wrong). Ordering convention across every page now:
            // single-item management > bulk management > purge > export > guide.
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.guide} Bulk Format Guide\n-# Forget the paste format? Get a rich, structured reference + example.`, button: { id: 'formatguide', label: 'Guide', style: 2 } }
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
                // Page Banners folded in as a 4th button here (2026-07-31 17:20 EDT, direct
                // correction -- it was its own separate inline group before, which put it visually
                // out of step with the Guide button's inline placement for no real reason). One
                // modal, 3 independently-clearable fields (same shape as Season Titles & Deadlines'
                // 3-related-lines-one-modal pattern) -- each page's banner is still independently
                // settable/clearable, just reached from this group instead of its own.
                blocks: [
                    `### ${emojis.mngBulkAdd} Add Multiple Events\n-# Add multiple events at once. Additive — doesn't affect existing events.`,
                    `### ${emojis.mngBulkReplace} Replace Multiple Events\n-# Updates existing events by matching title, or adds them if they don't exist yet. Events not included in the paste are left untouched — use Purge below for a full wipe.`,
                    `### ${emojis.mngBulkDelete} Delete Multiple Events\n-# Remove multiple events at once by pasting their titles. Only removes what's matched by search.`,
                    `### ${emojis.mngUrls} Page Banners\n-# Set a banner image for the Draws, Events, and Playlists pages independently. Leave a field blank to show nothing for that page.`
                ],
                buttons: [
                    { id: 'addmultiple', label: 'Add', style: 3 },
                    { id: 'replacemultiple', label: 'Replace', style: 1 },
                    { id: 'deletemultiple', label: 'Delete', style: 4 },
                    { id: 'banners', label: 'Banners', style: 1 }
                ]
            },
            // Purge, then Export, then Guide -- ordering convention across every page now: single-item
            // management > bulk management > purge > export > guide (2026-07-31 17:20 EDT, direct
            // correction -- Export used to sit above Purge here).
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.mngPurge} Purge All Events\n-# Permanently erase all calendar events to start fresh for a new season.`, button: { id: 'purge', label: 'Purge', style: 4 } }
                ]
            },
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.mngExport} Export All Events\n-# Extract the events info, formatted for an easy re-import.`, button: { id: 'export', label: 'Export', style: 2 } }
                ]
            },
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.guide} Bulk Format Guide\n-# Forget the paste format? Get a rich, structured reference + example.`, button: { id: 'formatguide', label: 'Guide', style: 2 } }
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
                heading: 'Current Season',
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
            // "Add New Season" (2026-07-24) -- previously the biggest gap in this page: there was no
            // way to START a new season's patch notes at all, only edit whichever entry already
            // happened to be "current." Pushes a new patchNotes[] entry, which becomes Current Season
            // and demotes the old one to Past Seasons -- see index.js's modal_patch_addseason handler.
            {
                blocks: [`### ${emojis.mngAdd} Add New Season\n-# Add release notes for a new season. After saving, this data becomes the Current Season and the previous data moves to Past Seasons.`],
                buttons: [{ id: 'addseason', label: 'Add New Season', style: 3 }]
            },
            // "Past Seasons" (2026-07-24) -- a select menu (not a search modal like Edit/Delete
            // elsewhere on this panel) since the full list of past seasons is short enough to just
            // pick from directly. Options are built dynamically from the DB at render time (see
            // buildManagePage's `dynamicData` param) rather than baked into this static PAGES entry,
            // since they change every time a season is added.
            {
                style: 'select',
                blocks: [`### ${emojis.mngEdit} Past Seasons\n-# Select a past season to view or edit its release date, additional info, and URLs.`],
                selectId: 'mng_patchseason_pick',
                placeholder: 'Select a past season...',
                optionsKey: 'pastSeasons'
            },
            {
                blocks: [`### ${emojis.mngPurge} Purge All Patch Notes\n-# Permanently erase the release date, additional info, and URL history to start fresh for a new season.`],
                buttons: [{ id: 'purge', label: 'Purge', style: 4 }]
            },
            // Guide (added 2026-07-31 17:20 EDT) -- this page has no bulk PASTE format, but the
            // Release Date / URLs / Additional Info fields have real syntax rules admins get
            // confused by (a real submission mistake on Additional Info's auto-formatting is what
            // prompted this whole guide rewrite) -- worth its own reference just like every other page.
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.guide} Field Format Guide\n-# Release date, URLs, and Additional Info -- what's literal vs. auto-formatted.`, button: { id: 'formatguide', label: 'Guide', style: 2 } }
                ]
            }
        ]
    },
    // "Next Season Draft" (added 2026-07-30 22:24 EDT) -- a staging area for preparing an entire
    // upcoming season (title/deadlines/draws/calendar) WITHOUT any of it going live, since
    // SeasonalData is a single global document and editing newDraws/calendar/bpEnd directly during
    // the overlap window between "current season not over" and "new season announced" immediately
    // overwrites what's still publicly live. "Promote to Live" swaps the whole staged draft in at
    // once; the draft-only fields live under `seasonalDoc.draft` (see models/SeasonalData.js).
    // Deliberately bulk-only for draws/calendar (no single add/edit/delete against the draft) --
    // the real use case is "type up the whole next season once, then promote," and a typo is fixed
    // by just re-running the bulk modal (same replace-not-append convention every other bulk action
    // on this panel already uses), not by building a second parallel single-item CRUD surface.
    seasondraft: {
        label: 'Next Season Draft',
        icon: emojis.calendar,
        headerLabel: 'Next Season Draft',
        groups: [
            { style: 'status', dynamicKey: 'draftStatus' },
            {
                heading: 'Prepare',
                blocks: [
                    `### ${emojis.mngEdit} Titles & Deadlines\n-# Stage the next season's title and Battle Pass/Ranked/DMZ titles + end dates. Doesn't touch what's currently live.`,
                    `### ${emojis.mngBulkAdd} New + Returning Draws\n-# Stage the next season's full New/Returning draws list. Replaces the whole staged list each submit — doesn't touch what's currently live.`,
                    `### ${emojis.mngBulkAdd} Calendar\n-# Stage the next season's full calendar. Replaces the whole staged list each submit — doesn't touch what's currently live.`
                ],
                buttons: [
                    { id: 'settitles', label: 'Titles & Deadlines', style: 1 },
                    { id: 'bulkdraws', label: 'Draws', style: 1 },
                    { id: 'bulkcalendar', label: 'Calendar', style: 1 }
                ]
            },
            {
                heading: 'Go Live',
                blocks: [
                    `### ${emojis.mngAdd} Promote to Live\n-# Swaps the staged draft in as the live season — title, deadlines, draws, and calendar all switch over together. The draft is cleared after.`,
                    `### ${emojis.mngPurge} Discard Draft\n-# Erase the staged draft without touching what's live.`
                ],
                buttons: [
                    { id: 'promote', label: 'Promote to Live', style: 3 },
                    { id: 'discard', label: 'Discard Draft', style: 4 }
                ]
            },
            // Guide (added 2026-07-31 17:20 EDT) -- same paste formats as the live Draws/Calendar
            // pages, plus the TBD-deadline convention; worth its own quick pointer rather than
            // assuming that carries over obviously.
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.guide} Bulk Format Guide\n-# Same formats as the live pages -- get a rich, structured reference.`, button: { id: 'formatguide', label: 'Guide', style: 2 } }
                ]
            }
        ]
    }
  };
}

// Renders the "Next Season Draft" page's live status block -- the one dynamic block on this panel
// (see buildManagePage's 'status' group style, same dynamicData mechanism Patch Notes' "Past
// Seasons" select already uses). Computed fresh from a live seasonalDoc every render, never cached.
function buildDraftStatusText(seasonalDoc) {
    const draft = seasonalDoc?.draft;
    if (!draft || !draft.active) {
        return `${emojis.mngInfo} **No draft in progress.** Use the actions below to start staging next season's data — none of it goes live until you press **Promote to Live**.`;
    }
    const deadline = (title, date) => `${title || '*(untitled)*'}${date ? `, ends ${formatAdminDate(date)}` : ' *(no end date staged)*'}`;
    return [
        `${emojis.mngInfo} **Draft in progress** — nothing below is live yet.`,
        `**Title:** ${draft.currentSeasonTitle || '*(not set)*'}`,
        `**Battle Pass:** ${deadline(draft.bpTitle, draft.bpEnd)}`,
        `**Ranked:** ${deadline(draft.rankTitle, draft.rankEnd)}`,
        `**DMZ:** ${deadline(draft.dmzTitle, draft.dmzEnd)}`,
        `**Draws:** ${draft.newDraws?.length || 0} New, ${draft.returningDraws?.length || 0} Returning`,
        `**Calendar:** ${draft.calendar?.length || 0} event(s)`
    ].join('\n');
}

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
                // P1 roadmap item (2026-07-18): loadout image handling was a genuine mystery, even to
                // Harkirat -- he had to rename a screenshot locally + re-upload before FSS Hurricane
                // rendered, and noticed some Secondaries files never got renamed at all. Confirmed the
                // REAL workflow live against the actual Cloudinary account before writing this (not
                // guessed): every loadout image sits in one flat "gun-builds" folder (organizational
                // only in Cloudinary's UI -- it's NOT part of the delivery URL, see buildImageUrl() in
                // utils/loadoutRender.js, which has no folder segment at all), and Cloudinary assigns
                // the Public ID from the uploaded file's own name unless it's renamed -- which is
                // exactly why some assets are clean (`BAL-27-1`, `DMZ-AK117-1`) and others are raw
                // camera filenames (`IMG_5630`, etc.) that were never renamed. `buttons: []` here is
                // deliberate -- this is a pure info block, not an action -- buildManagePage's
                // `group.buttons.map(...)` on an empty array just produces zero button rows.
                blocks: [
                    `### ${emojis.mngInfo} How Images Work\n-# **Fastest path: \`/autobuild\`** — hand it a Gunsmith screenshot (or an image URL) and it uploads the image to Cloudinary AND creates the loadout for you, no image key to type. Use the manual entry below when you already have the image hosted or want fine control.\n-# **Manual entry (this panel):** upload the screenshot to Cloudinary yourself first (its dashboard, or ask Claude to). Cloudinary assigns a **Public ID** — by default your file's original name (e.g. \`IMG_5630\`) unless you rename it — and you type that Public ID EXACTLY into "Cloudinary Image Key" below. The bot builds the card's image straight from that key with no check that it's real, so a mismatch just shows a broken image until it's fixed. Rename to \`WeaponKey-BuildNum\` (e.g. \`BAL-27-1\`, \`FSS-HURRICANE-1\`) to match the rest of the collection. (\`/autobuild\` already names it this way automatically.)`
                ],
                buttons: []
            },
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
            },
            // Guide -- last section, matching every other page's convention (2026-07-31 17:20 EDT).
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.guide} Bulk Format Guide\n-# Forget the paste format? Get a rich, structured reference + example.`, button: { id: 'formatguide', label: 'Guide', style: 2 } }
                ]
            }
        ]
    };
}

// Neutral dark panel color — used only as the fallback for a page with no accent of its own.
const PANEL_ACCENT = 0x2b2d31;

// Per-page accent colors (2026-07-20) — each page reuses its matching command's own identity
// color instead of the flat neutral panel color every page used before. Draws/Calendar/Patch
// Notes mirror their own command's `PRESET_ACCENT` exactly (values copied rather than required
// in, to avoid coupling manage.js's load to those 3 command modules for one constant each — keep
// these in sync by hand if any of those 3 PRESET_ACCENT values are ever re-picked). Loadouts MP/DMZ
// don't have an existing command-level PRESET_ACCENT to borrow (loadout cards use per-category/
// per-mode colors, not one fixed identity color) — their accents were instead sampled directly off
// the actual emoji assets already used as each page's icon (`utils/colorExtract.js`'s
// `getDominantColor()`, the bot's own extraction algorithm, run once against the Discord CDN emoji
// PNGs rather than a guessed hex): MP red from `:Rank_7Legendary_CODM:` → #FF3430, DMZ blue from
// `:DMZ_CODM:` → #337BA6. Season has no page in `PAGES` at all (see the dropdown note below), so it
// needs no entry here.
const PAGE_ACCENT = {
    draws: 7032445,       // Plum Fortune #6B4E7D — mirrors commands/draws.js's PRESET_ACCENT
    calendar: 3821672,     // Slate Harbor #3A5068 — mirrors commands/calendar.js's PRESET_ACCENT
    patchnotes: 15909424,  // Patch Gold #F2C230 — mirrors commands/patchnotes.js's PRESET_ACCENT
    loadouts_mp: 16725040, // #FF3430 — sampled from the :Rank_7Legendary_CODM: emoji
    loadouts_dmz: 3373990, // #337BA6 — sampled from the :DMZ_CODM: emoji
    seasondraft: 15898954  // Neon Amber #F2994A — mirrors commands/seasonend.js's PRESET_ACCENT (same
                            // season-lifecycle theme; this page has no public-facing command of its own)
};

// Builds Patch Notes' "Past Seasons" select-menu options from a live seasonalDoc (2026-07-24) --
// shared by both call sites that render the patchnotes page (manage.js's own execute() and index.js's
// mng_pagesel handler) so there's exactly one definition of "which entries count as past, in what
// order." Excludes the current (last) entry -- only PAST seasons belong here -- most-recent-first,
// capped at Discord's 25-option select-menu limit.
function buildPastSeasonsOptions(seasonalDoc) {
    const { displayTitle } = require('./patchnotes');
    const entries = seasonalDoc?.patchNotes || [];
    return entries.slice(0, -1).reverse().slice(0, 25).map(p => ({
        label: displayTitle(p).slice(0, 100),
        value: p._id.toString()
    }));
}

function buildManagePage(page, dynamicData = {}) {
    // Built here, per render, so emoji ids are read AFTER refreshEmojiIds() has run (see buildPagesTable).
    const PAGES = buildPagesTable();
    const pageKey = PAGES[page] ? page : 'draws';
    const pageData = PAGES[pageKey];
    const accentColor = PAGE_ACCENT[pageKey] ?? PANEL_ACCENT;

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
        } else if (group.style === 'select') {
            // Section + select menu (2026-07-24, Patch Notes' "Past Seasons") -- options come from
            // `dynamicData[group.optionsKey]` rather than this static PAGES table, since they're
            // built fresh from the DB every render (see index.js's mng_pagesel/manage.js's execute()
            // call sites). Discord requires at least 1 option and rejects an empty array outright, so
            // an empty result falls back to one disabled placeholder option instead of omitting the
            // row -- same "always render the row, just inert" approach as Loadouts' empty-state info
            // block above, rather than a conditional layout the rest of this file doesn't otherwise do.
            group.blocks.forEach(content => components.push({ type: 10, content }));
            const dynamicOptions = dynamicData[group.optionsKey];
            const hasOptions = Array.isArray(dynamicOptions) && dynamicOptions.length > 0;
            const options = hasOptions ? dynamicOptions : [{ label: 'No past seasons yet', value: 'none', default: true }];
            components.push({
                type: 1,
                components: [{ type: 3, custom_id: group.selectId, placeholder: group.placeholder || 'Select...', options, disabled: !hasOptions }]
            });
        } else if (group.style === 'status') {
            // Live-computed text block (2026-07-24 pattern extended 2026-07-30 22:24 EDT) -- same
            // dynamicData mechanism as the 'select' branch above, just rendered as a Text Display
            // instead of a select menu. `dynamicData[group.dynamicKey]` is built fresh per render by
            // whichever call site is rendering this page (see manage.js's execute()/index.js's
            // mng_pagesel), never baked into the static PAGES table.
            components.push({ type: 10, content: dynamicData[group.dynamicKey] || 'Loading…' });
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

    return [{ type: 17, accent_color: accentColor, components }];
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
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('items').setLabel('Items (Shorthand)').setStyle(TextInputStyle.Paragraph).setPlaceholder("m Character Name\nl Gun Name\ne Emote Name\n-# Optional note").setRequired(false)),
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
    // 'comment' items (2026-07-30 22:24 EDT, "-# note" lines) reconstruct as "-# text", not their
    // first-letter shorthand -- charAt(0) would produce "c", which round-trips through parseItemLine
    // as an unrecognized tier instead of a comment.
    const itemsText = targetDraw.items.map(i => `${i.tier === 'comment' ? '-#' : i.tier.charAt(0).toLowerCase()} ${i.name}`).join('\n');
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
        // Optional d•/p•/e• prefix (draw/playlist/event) added for the 3-section calendar redesign
        // (2026-07-31 12:10/12:40 EDT) — matches Harkirat's own calendar_bulk.txt convention. No
        // prefix auto-detects from the title's own wording (adminParser.js's
        // guessCalendarCategory) -- only needed to override an ambiguous title (e.g. a bare map
        // name with no "mode"/"playlist" in it).
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bulk_text').setLabel('Bulleted List (UTC-0 dates)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("7/2 - 8/5 | Throwable Frenzy MP Mode\n7/6 - 7/19 | Nuketown Dedicated Playlist\n7/10 - All Season | Shadow and Shade Mythic Drop\np• 8/6 - 8/19 | Krai BR (prefix to override the guess)").setRequired(true))
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
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('end_date').setLabel('End Date (blank = All Season)').setStyle(TextInputStyle.Short).setPlaceholder('e.g. August 5').setRequired(false)),
        // Added for the 3-section calendar redesign (2026-07-31 12:10 EDT) -- blank auto-detects
        // from the title's own wording (adminParser.js's guessCalendarCategory), same as an
        // un-prefixed bulk-import line.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('category').setLabel('Section (draw / event / playlist)').setStyle(TextInputStyle.Short).setPlaceholder('blank = auto-detect from title').setRequired(false))
    );
    return modal;
}

// Page Banners (added 2026-07-31 17:20 EDT) -- one modal, 3 independently-clearable Short URL
// fields. Pre-filled from whatever's currently saved so re-submitting to change just one field
// doesn't blank out the other two.
function buildCalendarBannersModal(seasonalDoc) {
    const modal = new ModalBuilder().setCustomId('modal_calendar_banners').setTitle('Calendar: Page Banners');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('draws_banner').setLabel('Draws Page Banner URL (blank = none)').setStyle(TextInputStyle.Short).setValue(seasonalDoc?.drawsBannerUrl || '').setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('events_banner').setLabel('Events Page Banner URL (blank = none)').setStyle(TextInputStyle.Short).setValue(seasonalDoc?.eventsBannerUrl || '').setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('playlists_banner').setLabel('Playlists Page Banner URL (blank = none)').setStyle(TextInputStyle.Short).setValue(seasonalDoc?.playlistsBannerUrl || '').setRequired(false))
    );
    return modal;
}

function buildEditCalendarModal(targetEvent, targetId) {
    const modal = new ModalBuilder().setCustomId(`edit_calendar_${targetId}`).setTitle('Edit Calendar Event');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Event Title').setStyle(TextInputStyle.Short).setValue(targetEvent.title)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('start_date').setLabel('Start Date').setStyle(TextInputStyle.Short).setValue(formatAdminDate(targetEvent.date))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('end_date').setLabel('End Date (blank = All Season)').setStyle(TextInputStyle.Short).setValue(targetEvent.isOngoing ? '' : formatAdminDate(targetEvent.endDate)).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('category').setLabel('Section (draw / event / playlist)').setStyle(TextInputStyle.Short).setValue(targetEvent.category || 'event').setRequired(false))
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
        // Placeholder added (2026-07-18, /manage loadout UX overhaul) -- this field had none at all
        // before; matches the real one-attachment-per-line convention already shown in the Bulk Add
        // modal's own placeholder below, so both modals model the same expected shape.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (One per line)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Gauge-9 Mono\nCrown-H3 Barrel\nOWC Skeleton Stock').setRequired(true)),
        // Label + placeholder rewritten (2026-07-18) -- the old placeholder (`bp50_flex_v1`) wasn't
        // even the convention actually used anywhere in the live collection (real Cloudinary keys are
        // `WeaponKey-BuildNum`, all-caps-with-hyphens, e.g. `BAL-27-1`/`FSS-HURRICANE-1` -- confirmed
        // by querying the live Cloudinary account, not guessed). This is the ONE field in this modal
        // that depends on a step happening OUTSIDE the bot first -- see the "How Images Work" info
        // block on the page itself for the full explanation of why.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('Cloudinary Image Key (Public ID)').setStyle(TextInputStyle.Short).setPlaceholder('e.g. BP50-1 -- must match Cloudinary exactly').setRequired(true)),
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
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (One per line)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Gauge-9 Mono\nCrown-H3 Barrel\nOWC Skeleton Stock').setValue(targetLoadout.attachments.join('\n'))),
        // Same undefined-to-setValue() guard as buildEditDrawModal's thumbnailUrl fix above. Label +
        // placeholder matched to Add Loadout's 2026-07-18 rewording -- see that modal's comment for
        // why (the real Cloudinary Public ID convention, confirmed against the live account).
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('Cloudinary Image Key (Public ID)').setStyle(TextInputStyle.Short).setPlaceholder('e.g. BP50-1 -- must match Cloudinary exactly').setValue(targetLoadout.imageKey || '')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('meta').setLabel('Category | Badges').setStyle(TextInputStyle.Short).setValue(`${targetLoadout.category} | ${existingBadges}`))
    );
    return modal;
}

// --- PATCH NOTES modal builders --- (all 3 operate on the single "current" entry — the last item
// in patchNotes[], the one whose title stays synced to currentSeasonTitle — rather than a
// search-and-pick flow. If none exists yet, Date/Info's submit creates the first one.)
function buildPatchDateInfoModal(currentEntry, userTimezone) {
    const modal = new ModalBuilder().setCustomId('modal_patch_dateinfo').setTitle('Patch Notes: Date & Info');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('release_date').setLabel('Release Date').setStyle(TextInputStyle.Short).setPlaceholder('e.g. July 15, or July 15 7:20 AM (your local time)').setValue(currentEntry ? formatReleaseDateTime(currentEntry.releaseDate, userTimezone) : '').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Additional Info (optional)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Per-line: # Weapon, Attachment, b: text, n: text...\nb:/n: = buff/nerf emojis (See Guide button)').setValue(currentEntry?.description || '').setRequired(false)),
        // Manual title override (2026-07-24) -- for when patch notes release before the new season's
        // real title is finalized/announced. Blank reverts to the auto-synced title (currentSeasonTitle,
        // via the Season Titles/Dates modal) -- see index.js's modal_patch_dateinfo submit handler.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('season_title').setLabel('Season Title Override (blank = auto)').setStyle(TextInputStyle.Short).setValue(currentEntry?.titleOverride || '').setRequired(false))
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

// "Add New Season" (2026-07-24) -- pushes a brand-new entry onto patchNotes[], which becomes the new
// "current" entry (the old current entry automatically becomes a past season -- it's simply no
// longer the last item in the array, nothing else needs to change about it). Unlike Date/Info's 2
// fields, this needs all 5 of a modal's field slots at once since there's no existing entry yet to
// spread the URLs input across separate dateinfo/urls1/urls2 actions -- so URLs 1/2 are collected
// here as multi-line paragraph fields (one URL per line) instead of 5 individually-addressable Short
// fields each, same shape Harkirat's own mockup called for.
function buildPatchAddSeasonModal() {
    const modal = new ModalBuilder().setCustomId('modal_patch_addseason').setTitle('Add New Season');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('season_title').setLabel('Season Title (blank = use current)').setStyle(TextInputStyle.Short).setPlaceholder('Leave blank to use the Season Titles/Dates title').setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('release_date').setLabel('Release Date').setStyle(TextInputStyle.Short).setPlaceholder('e.g. July 15, or July 15 7:20 AM (your local time)').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Additional Info (optional)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Per-line: # Weapon, Attachment, b: text, n: text...\nb:/n: = buff/nerf emojis (See Guide button)').setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urls1').setLabel('URLs 1 (one per line, up to 5)').setStyle(TextInputStyle.Paragraph).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urls2').setLabel('URLs 2 (one per line, up to 5 more)').setStyle(TextInputStyle.Paragraph).setRequired(false))
    );
    return modal;
}

// "Past Seasons" edit (2026-07-24) -- same 5-field shape as Add New Season above, but pre-filled from
// and submitted back onto ONE SPECIFIC existing entry (picked via the page's `mng_patchseason_pick`
// select menu), addressed by its own `_id` in the custom_id -- never touches which entry is
// "current." `images` slices the same 0-4/5-9 way urls1/urls2 already do for the current entry.
function buildPatchEditSeasonModal(entry, userTimezone) {
    const modal = new ModalBuilder().setCustomId(`modal_patch_editseason_${entry._id}`).setTitle('Edit Past Season');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('season_title').setLabel('Season Title (blank = use current)').setStyle(TextInputStyle.Short).setValue(entry.titleOverride || '').setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('release_date').setLabel('Release Date').setStyle(TextInputStyle.Short).setValue(formatReleaseDateTime(entry.releaseDate, userTimezone)).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Additional Info (optional)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Per-line: # Weapon, Attachment, b: text, n: text...\nb:/n: = buff/nerf emojis (See Guide button)').setValue(entry.description || '').setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urls1').setLabel('URLs 1 (one per line, up to 5)').setStyle(TextInputStyle.Paragraph).setValue((entry.images || []).slice(0, 5).join('\n')).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urls2').setLabel('URLs 2 (one per line, up to 5 more)').setStyle(TextInputStyle.Paragraph).setValue((entry.images || []).slice(5, 10).join('\n')).setRequired(false))
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

// --- NEXT SEASON DRAFT modal builders (2026-07-30 22:24 EDT) ---
// Same field shapes/parsers as their live equivalents above (splitTitleDate/parseAdminDate for
// titles+dates, parseBulkDrawList/parseBulkEvents for the bulk pastes) so index.js's submit
// handlers can reuse the exact same parsing logic, just writing into `seasonalDoc.draft.*` instead
// of the top-level fields.
function buildDraftTitlesDatesModal(seasonalDoc) {
    const draft = seasonalDoc?.draft || {};
    const bpLine = [draft.bpTitle || 'Battle Pass', draft.bpEnd ? formatAdminDate(draft.bpEnd) : ''].filter(Boolean).join(', ');
    const rankLine = [draft.rankTitle || 'Ranked Series', draft.rankEnd ? formatAdminDate(draft.rankEnd) : ''].filter(Boolean).join(', ');
    const dmzLine = [draft.dmzTitle || 'DMZ Season', draft.dmzEnd ? formatAdminDate(draft.dmzEnd) : ''].filter(Boolean).join(', ');

    const modal = new ModalBuilder().setCustomId('modal_draft_titles_dates').setTitle('Draft: Season Titles & Deadlines');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('main_title').setLabel('Main Season Title').setStyle(TextInputStyle.Short).setValue(draft.currentSeasonTitle || '').setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bp_line').setLabel('Battle Pass: Title, End Date').setStyle(TextInputStyle.Short).setValue(bpLine).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rank_line').setLabel('Ranked Series: Title, End Date').setStyle(TextInputStyle.Short).setValue(rankLine).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('dmz_line').setLabel('DMZ Season: Title, End Date').setStyle(TextInputStyle.Short).setValue(dmzLine).setRequired(false))
    );
    return modal;
}

function buildDraftBulkDrawsModal(seasonalDoc) {
    const draft = seasonalDoc?.draft || {};
    const { formatDrawsAsBulkText } = require('../utils/adminParser');
    const modal = new ModalBuilder().setCustomId('modal_draft_bulk_draws').setTitle('Draft: New + Returning Draws');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_text').setLabel('New Draws (leave blank to skip)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Title, m Item 1, july 10, url.jpg").setValue(formatDrawsAsBulkText(draft.newDraws || [])).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('returning_text').setLabel('Returning Draws (leave blank to skip)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Title, l Item, aug 5, url.jpg").setValue(formatDrawsAsBulkText(draft.returningDraws || [])).setRequired(false))
    );
    return modal;
}

function buildDraftBulkCalendarModal(seasonalDoc) {
    const draft = seasonalDoc?.draft || {};
    const { formatCalendarAsBulkText } = require('../utils/adminParser');
    const modal = new ModalBuilder().setCustomId('modal_draft_bulk_calendar').setTitle('Draft: Calendar');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bulk_text').setLabel('Events (replaces the whole staged list)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("7/15 - 8/1 | Event Title\n7/20 - All Season | Other Event").setValue(formatCalendarAsBulkText(draft.calendar || [])).setRequired(true))
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
        // Trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) -- the old 68-char version
        // truncated on Discord mobile's command picker row.
        .setDescription('Manage gunsmiths and seasonal bot data')
        .setDefaultMemberPermissions(0)
        .setIntegrationTypes([1]).setContexts([0, 1, 2]) // User-install app + DM support
        // Renamed from `page` to `section` (2026-07-12), then `section` to `data for` (2026-07-18,
        // v2 quick-wins batch) — "section" still didn't describe what's actually being picked (a
        // data ENTITY: Draws/Calendar/Loadouts/Patch Notes/Season), not a page or a section of one.
        // "Season: Titles & Deadlines" also gained a direct entry here (previously only reachable
        // via the in-panel mng_pagesel dropdown) — picking it skips the panel entirely and opens
        // that modal as the initial response, same as the dropdown's own flat entry does. "Start New
        // Season" deliberately has NO direct slash-option entry — it's destructive enough that
        // requiring the extra step through the panel dropdown (with its own warning description) is
        // intentional, not an oversight.
        // NOTE: Discord option names can't contain spaces (lowercase alphanumeric/underscore/hyphen
        // only) -- `data_for` is the closest valid spelling of "data for"; Discord still displays
        // underscores as literal underscores when typing the command, same as every option below.
        .addStringOption(option => option.setName('data_for').setDescription('Jump directly to a data section').addChoices(
            { name: 'Draws', value: 'draws' },
            { name: 'Calendar', value: 'calendar' },
            { name: 'MP Loadouts', value: 'loadouts_mp' },
            { name: 'DMZ Loadouts', value: 'loadouts_dmz' },
            { name: 'Patch Notes', value: 'patchnotes' },
            { name: 'Season: Titles & Deadlines', value: 'season_titlesdeadlines' },
            { name: 'Season: Next Season Draft', value: 'seasondraft' },
            // Jumps straight to the rich Bulk Format Guide (utils/manageGuides.js) instead of a
            // normal data-entry page -- added 2026-07-31 17:20 EDT, Harkirat's direct request. Not a
            // key in PAGES (same reason Season's two entries above aren't), so it's special-cased in
            // execute() below the same way those are.
            { name: 'Bulk Format Guide', value: 'guide' }
        ))
        .addBooleanOption(option => option.setName('hidden').setDescription('True = only you can see this panel. False = everyone in the chat can see it. (default: True)')),

    // Getter, not a value: the table must be built per access so emoji ids are read after
    // refreshEmojiIds() has run (see buildPagesTable). Don't destructure this at module load.
    get PAGES() { return buildPagesTable(); },
    PURGE_LABELS,
    buildManagePage,
    buildPastSeasonsOptions,
    buildSearchModal,
    buildBulkBothDrawsModal, buildBulkRemoveDrawsModal, buildAddDrawModal, buildEditDrawModal,
    buildCalendarBulkModal, buildCalendarBulkRemoveModal, buildCalendarAddModal, buildEditCalendarModal, buildCalendarBannersModal,
    buildLoadoutsBulkAddModal, buildLoadoutsBulkRemoveModal, buildAddLoadoutModal, buildEditLoadoutModal,
    buildLoadoutsExportUpTo5Modal, buildLoadoutsExportCategoryModal,
    buildPatchDateInfoModal, buildPatchUrlsModal, buildPatchAddSeasonModal, buildPatchEditSeasonModal,
    buildWipeSeasonModal, buildSeasonTitlesDeadlinesModal,
    buildDraftTitlesDatesModal, buildDraftBulkDrawsModal, buildDraftBulkCalendarModal, buildDraftStatusText,

    async execute(interaction) {
        if (interaction.user.id !== ALLOWED_ADMIN_ID) {
            // Reworded 2026-07-18 (v2 quick-wins batch) -- matches the identical reword of index.js's
            // centralized button/select/modal guard for this same panel (see interactionCreate).
            return interaction.reply({ content: "🔒 **This one's admin-only.** These buttons run Dioreo's database directly — try any of the bot's public commands instead!", ephemeral: true });
        }

        const section = interaction.options.getString('data_for') || 'draws';

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

        // Bulk Format Guide, reached directly (2026-07-31 17:20 EDT) -- sends the SAME rich guide
        // panel the in-page "Guide" buttons open (utils/manageGuides.js), skipping the normal
        // page-panel render entirely. Defaults to the Draws topic (first in the dropdown) -- there's
        // no page context to infer a topic from when jumping straight here via the slash option.
        if (section === 'guide') {
            const { buildGuideContainer } = require('../utils/manageGuides');
            return sendV2Payload(interaction, buildGuideContainer('draws'));
        }

        // Patch Notes' "Past Seasons" dropdown needs a live DB read to build its options -- every
        // other page renders from PAGES alone. Only fetched when actually landing on that page.
        let dynamicData = {};
        if (section === 'patchnotes') {
            const SeasonalData = require('../models/SeasonalData');
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
            dynamicData = { pastSeasons: buildPastSeasonsOptions(seasonalDoc) };
        } else if (section === 'seasondraft') {
            const SeasonalData = require('../models/SeasonalData');
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
            dynamicData = { draftStatus: buildDraftStatusText(seasonalDoc) };
        }
        return sendV2Payload(interaction, buildManagePage(section, dynamicData));
    }
};
