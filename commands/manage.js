// ==========================================
// COMMAND: ADVANCED DATABASE MANAGER
// ==========================================
// Single admin command covering everything the bot's data needs — individual add/edit/delete for draws, calendar events, patch notes, and MP/DMZ loadouts, additive/replace bulk import, bulk remove for the same, season title/deadline management, per-entity data Purge (except Loadouts — see PAGES.loadouts note below), and file-attachment export. Used to be split across this command and a separate /update dropdown-driven gateway; consolidated into one command (Harkirat's request — "don't want a long list of slash commands"), then redesigned three times more the same week: first collapsed from a subcommand-group tree into ONE flat command that opens a Components V2 panel, then added Purge/a page-select dropdown/folded a briefly-standalone /export command back in, then (2026-07-12) rebuilt again per 4 hand-drawn mockup JSONs Harkirat put together himself while working around a usage-limit outage — new title/section layout, a real Add-Multiple (additive) vs Replace-Multiple (destructive) distinction for draws/calendar, export folded INTO each entity's own page instead of a separate Export page, Loadouts losing its Export page in favor of a 3-way in-page export, and Patch Notes rebuilt around a single "current entry" model (Date/Info + URLs 1 + URLs 2) instead of add-a-new-entry-by-hand. `/manage` (optionally with a `section` option to jump straight to a section, and a `hidden` option to make the panel public) replies with a Container showing the current section's actions — clicking a button either opens its modal directly, replies with a file (Export actions), shows a Confirm/Cancel prompt (Purge), or, for Edit/Delete-by-search (which need a specific item picked first, and buttons can't autocomplete), opens a small "search by name" modal first — see handlers/manage/shared.js's `mng_search_`/`mng_pick_` handlers for the resolve-then-chain-a-second-modal logic. This file only builds the modal SHAPES and the page/button layout; handlers/manage/ owns all the routing and DB-mutating submit logic.
//
// NOTE on the deferred "search + multi-select" flow: the mockups describe "Delete Multiple" (all entities) and Loadouts' "Replace Multiple" as searching first, then picking which matches to act on from a list — a new interaction, different from today's paste-a-list-of-names bulk-remove. Per Harkirat's explicit direction, that real search+multi-select rebuild is intentionally NOT part of this pass — it's large enough on its own that bundling it here risked a usage-limit interruption mid-build. This pass keeps those specific actions on today's paste-based modals (renamed/re-styled to match the new buttons) as a deliberate placeholder, not an oversight.

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, LabelBuilder, StringSelectMenuBuilder } = require('discord.js');
const { formatAdminDate, formatReleaseDateTime } = require('../utils/adminParser');
const { sendV2Payload } = require('../utils/sendV2Payload');
const emojis = require('../utils/emojiMap');
const { mentionCommand } = require('../utils/commandMentions');
const { buttonFor } = require('../utils/manageActions'); // the /manage action registry (2026-08-14)

// Moved to utils/owner.js (2026-08-20, portal core Task 0b) -- utils/adminAccess.js used to reach into this file just for this constant, which transitively pulled discord.js/jimp into any process that needed permission checks. Re-exported here so nothing outside this task's file list breaks.
const { ALLOWED_ADMIN_ID } = require('../utils/owner');

// Per-page "Purge" wording — each page's Purge button nukes ONLY that page's own data (distinct from Season's existing "Start New Season" (formerly "Wipe Season"), which resets draws+calendar together as part of starting a new season but deliberately preserves patch notes history forever). Loadouts has NO Purge entry at all — deliberate, per Harkirat's explicit call (2026-07-12): loadout data is meant to persist long-term, unlike draws/calendar/patch-notes which are seasonal and benefit from a quick manual reset. Don't add one back in without him asking again.
//
// Draws gained 3 granular purge SCOPES (2026-07-12, was one "purge everything" button) — `all`, `new`, `returning` — since a Purge that only affects one of the two draw categories didn't exist before. Every other group only has one scope ('all'), but is still keyed the same way so handlers/manage/index.js's confirm/cancel handlers can treat every group identically (`PURGE_LABELS[group].all` vs `PURGE_LABELS[group][scope]`).
const PURGE_LABELS = {
    draws: { all: 'ALL New and Returning draws', new: 'ALL New draws only', returning: 'ALL Returning draws only' },
    calendar: { all: 'ALL calendar events' },
    patchnotes: { all: 'the ENTIRE patch notes history' }
};

// One entry per "page". Each page has a title icon/label and an ordered list of `groups` — a group is an optional `## ` heading (Loadouts/Calendar only — Draws/Patch Notes render flat, no group headings, matching the mockups exactly) plus one or more `blocks` (each becomes its own Text Display — most groups have one block per action, but Draws' Bulk-Delete+Purge group combines two `### ` headers into a single block, matching its mockup's exact component layout) and a `buttons` row (chunked into rows of 5 if it ever needs to grow past Discord's per-row cap). ⚠️ Built per-render by buildManagePage(), NOT a module-level `const PAGES = {...}` -- that's what it used to be, and it silently broke EVERY emoji on EVERY /manage page on the dev bot (found 2026-07-26 15:52 EDT). refreshEmojiIds() rewrites emojiMap's values at boot, long after this file is require()d; the ~30 `${emojis.x}` interpolations below evaluate at table-build time and JS strings copy by value, so building the table at require() time froze the pre-sync PROD ids permanently. Rebuilding it per render costs ~30 template strings against a network round trip -- not worth memoizing, and a cache would just reintroduce a subtler version of the same staleness bug.
function buildPagesTable(client) {
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
                // Not shown in Harkirat's mockup (the single-item section there has no button row at all) — added to match the same convention every other page's single-item section uses, since Add/Edit/Delete need to actually be reachable somehow.
                buttons: ['addnew', 'addreturning', 'edit', 'delete']
            },
            {
                // Bulk section grouped together like the single-item section above (2026-07-12, Harkirat's correction) — one shared button row under all 3 bulk blocks, instead of each bulk action being its own group with its own divider. New/Returning/Either buttons were ALSO condensed to ONE button each (same pass) — Either/Both already covers the single-category cases by leaving one field blank, so the 3-way split was pure redundancy. Replace's semantics changed too: was a wholesale wipe-then- replace of the whole array; now upserts by fuzzy-matched title (update in place if found, insert if not) — Purge already covers full wipes, so Replace doesn't need to double as one anymore.
                blocks: [
                    `### ${emojis.mngBulkAdd} Add Multiple Draws\n-# Add multiple new and/or returning draws at once (leave a field blank to skip it). Additive — doesn't affect existing draws.`,
                    `### ${emojis.mngBulkReplace} Replace Multiple Draws\n-# Updates existing draws by matching title, or adds them if they don't exist yet. Draws not included in the paste are left untouched — use Purge below for a full wipe.`,
                    `### ${emojis.mngBulkDelete} Delete Multiple Draws\n-# Remove multiple draws at once by pasting their titles. Only removes what's matched by search — everything else is left untouched.`
                ],
                buttons: ['bulkadd', 'bulkreplace', 'bulkdelete']
            },
            {
                // Purge moved into its own fully separate section (2026-07-12, was folded into the Bulk Delete block above) and expanded from one "wipe everything" button to 3 granular scopes, since only being able to wipe New+Returning together was a real gap once you just wanted to reset one of the two.
                blocks: [`### ${emojis.mngPurge} Purge Draws Data\n-# Permanently erase draws to start fresh for a new season. Choose a scope below.`],
                buttons: ['purgenew', 'purgereturning', 'purgeall']
            },
            {
                blocks: [`### ${emojis.mngExport} Export Draws\n-# Extract the new/returning draws info, formatted for an easy re-import.`],
                buttons: ['exportnew', 'exportreturning']
            },
            // Bulk Format Guide -- last section on every page that has one (2026-07-31 17:20 EDT, direct correction: was mid-page, wrong). Ordering convention across every page now: single-item management > bulk management > purge > export > guide.
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.guide} Bulk Format Guide\n-# Forget the paste format? Get a rich, structured reference + example.`, button: 'formatguide' }
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
                // Group headings dropped (2026-07-12, Harkirat's request) -- the section content already speaks for itself the same way Draws' page never had group headings.
                blocks: [
                    `### ${emojis.mngAdd} Add Single Event\n-# Add one event to the calendar. Additive — doesn't affect existing events.`,
                    `### ${emojis.mngEdit} Edit Single Event\n-# Update an existing event's info. Search by event title.`,
                    `### ${emojis.mngDelete} Delete Single Event\n-# Remove a single event. Search by event title.`
                ],
                buttons: ['add', 'edit', 'delete']
            },
            {
                // Page Banners folded in as a 4th button here (2026-07-31 17:20 EDT, direct correction -- it was its own separate inline group before, which put it visually out of step with the Guide button's inline placement for no real reason). One modal, 3 independently-clearable fields (same shape as Season Titles & Deadlines' 3-related-lines-one-modal pattern) -- each page's banner is still independently settable/clearable, just reached from this group instead of its own.
                blocks: [
                    `### ${emojis.mngBulkAdd} Add Multiple Events\n-# Add multiple events at once. Additive — doesn't affect existing events.`,
                    `### ${emojis.mngBulkReplace} Replace Multiple Events\n-# Updates existing events by matching title, or adds them if they don't exist yet. Events not included in the paste are left untouched — use Purge below for a full wipe.`,
                    `### ${emojis.mngBulkDelete} Delete Multiple Events\n-# Remove multiple events at once by pasting their titles. Only removes what's matched by search.`,
                    `### ${emojis.mngUrls} Page Banners\n-# Set a banner image for the Draws, Events, and Playlists pages independently. Leave a field blank to show nothing for that page.`
                ],
                buttons: ['addmultiple', 'replacemultiple', 'deletemultiple', 'banners']
            },
            // Purge, then Export, then Guide -- ordering convention across every page now: single-item management > bulk management > purge > export > guide (2026-07-31 17:20 EDT, direct correction -- Export used to sit above Purge here).
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.mngPurge} Purge All Events\n-# Permanently erase all calendar events to start fresh for a new season.`, button: 'purge' }
                ]
            },
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.mngExport} Export All Events\n-# Extract the events info, formatted for an easy re-import.`, button: 'export' }
                ]
            },
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.guide} Bulk Format Guide\n-# Forget the paste format? Get a rich, structured reference + example.`, button: 'formatguide' }
                ]
            }
        ]
    },
    // Loadouts (MP + DMZ) — structurally identical pages, differing only in `mode`. DMZ literally reuses this same shape (Harkirat: "just copy that for DMZ loadouts since they're essentially the same thing") via `loadoutsPageDef(mode, ...)` below rather than a second hand-copied entry.
    loadouts_mp: loadoutsPageDef('MP', 'MP Loadouts', emojis.rank, client),
    loadouts_dmz: loadoutsPageDef('DMZ', 'DMZ Loadouts', emojis.dmz, client),
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
                buttons: ['dateinfo', 'urls1', 'urls2']
            },
            // "Add New Season" (2026-07-24) -- previously the biggest gap in this page: there was no way to START a new season's patch notes at all, only edit whichever entry already happened to be "current." Pushes a new patchNotes[] entry, which becomes Current Season and demotes the old one to Past Seasons -- see handlers/manage/patchnotes.js's modal_patch_addseason handler.
            {
                blocks: [`### ${emojis.mngAdd} Add New Season\n-# Add release notes for a new season. After saving, this data becomes the Current Season and the previous data moves to Past Seasons.`],
                buttons: ['addseason']
            },
            // "Past Seasons" (2026-07-24) -- a select menu (not a search modal like Edit/Delete elsewhere on this panel) since the full list of past seasons is short enough to just pick from directly. Options are built dynamically from the DB at render time (see buildManagePage's `dynamicData` param) rather than baked into this static PAGES entry, since they change every time a season is added.
            {
                style: 'select',
                blocks: [`### ${emojis.mngEdit} Past Seasons\n-# Select a past season to view or edit its release date, additional info, and URLs.`],
                selectId: 'mng_patchseason_pick',
                placeholder: 'Select a past season...',
                optionsKey: 'pastSeasons'
            },
            {
                blocks: [`### ${emojis.mngPurge} Purge All Patch Notes\n-# Permanently erase the release date, additional info, and URL history to start fresh for a new season.`],
                buttons: ['purge']
            },
            // Guide (added 2026-07-31 17:20 EDT) -- this page has no bulk PASTE format, but the Release Date / URLs / Additional Info fields have real syntax rules admins get confused by (a real submission mistake on Additional Info's auto-formatting is what prompted this whole guide rewrite) -- worth its own reference just like every other page.
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.guide} Field Format Guide\n-# Release date, URLs, and Additional Info -- what's literal vs. auto-formatted.`, button: 'formatguide' }
                ]
            }
        ]
    },
    // "Next Season Draft" (added 2026-07-30 22:24 EDT) -- a staging area for preparing an entire upcoming season (title/deadlines/draws/calendar) WITHOUT any of it going live, since SeasonalData is a single global document and editing newDraws/calendar/bpEnd directly during the overlap window between "current season not over" and "new season announced" immediately overwrites what's still publicly live. "Promote to Live" swaps the whole staged draft in at once; the draft-only fields live under `seasonalDoc.draft` (see models/SeasonalData.js). Deliberately bulk-only for draws/calendar (no single add/edit/delete against the draft) -- the real use case is "type up the whole next season once, then promote," and a typo is fixed by just re-running the bulk modal (same replace-not-append convention every other bulk action on this panel already uses), not by building a second parallel single-item CRUD surface.
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
                buttons: ['settitles', 'bulkdraws', 'bulkcalendar']
            },
            {
                heading: 'Go Live',
                blocks: [
                    `### ${emojis.mngAdd} Promote to Live\n-# Swaps the staged draft in as the live season — title, deadlines, draws, and calendar all switch over together. The draft is cleared after.`,
                    `### ${emojis.mngPurge} Discard Draft\n-# Erase the staged draft without touching what's live.`
                ],
                buttons: ['promote', 'discard']
            },
            // Guide (added 2026-07-31 17:20 EDT) -- same paste formats as the live Draws/Calendar pages, plus the TBD-deadline convention; worth its own quick pointer rather than assuming that carries over obviously.
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.guide} Bulk Format Guide\n-# Same formats as the live pages -- get a rich, structured reference.`, button: 'formatguide' }
                ]
            }
        ]
    },
    // "Manage Admins" RETIRED 2026-08-16 (observability layer stage 3) -- extracted out of /manage entirely into /bot access (commands/bot.js, handlers/bot.js). It was owner-only visibility here (getManagePages() only ever offered it to the owner); that invariant is unchanged, just enforced directly by /bot access's own isOwner() check instead of by this table. "Announcement" (added 2026-08-13, redesigned same day into a real multi-announcement list -- see models/Announcement.js's header for why). Each active announcement gets its own Edit/Delete pair (buildAnnouncementListBlocks below); posting a new one never touches the others. Every user sees each one they haven't individually seen yet, together in one ephemeral message, on their next command -- see utils/announcement.js.
    announcement: {
        label: 'Announcement',
        icon: emojis.dbAnnouncement, // the page's own main emoji (his, 2026-10-26 12:46 EDT); each announcement's heading keeps `announcements`
        headerLabel: 'Announcement',
        groups: [
            { style: 'raw', dynamicKey: 'announcementBlocks' },
            {
                blocks: [`### ${emojis.mngAdd} Post New Announcement\n-# Write a new announcement (expiry defaults to 60 days, or set your own / "never"). Existing ones above are untouched.`],
                buttons: ['post']
            },
            {
                blocks: [`### ${emojis.guide} Bulk Format Guide\n-# What Post/Edit/Delete actually do, and how expiry works.`],
                buttons: ['formatguide']
            }
        ]
    }
  };
}

// Renders the "Announcement" page's live per-item list -- one Text Display + Action Row (Edit/Delete) PER active announcement, fed through buildManagePage's 'raw' group style above. Only ACTIVE (non-expired) announcements are listed here -- an expired one has already stopped delivering (utils/announcement.js filters the same way), so showing it here would offer to edit/delete something that's already functionally gone.
function buildAnnouncementListBlocks(announcementDocs) {
    if (!announcementDocs || announcementDocs.length === 0) {
        return [{ type: 10, content: `${emojis.mngInfo} **No active announcements.** Use Post New Announcement below to write one.` }];
    }
    const blocks = [];
    announcementDocs.forEach((a, i) => {
        const postedTs = Math.floor(new Date(a.createdAt).getTime() / 1000);
        const expiryText = a.expiresAt ? `expires <t:${Math.floor(new Date(a.expiresAt).getTime() / 1000)}:R>` : 'never expires';
        // 200 chars, matching the delete confirmation's own preview cap (2026-08-13, Harkirat's request) -- one shared "how much text counts as a preview" convention across this page.
        const preview = a.text.length > 200 ? `${a.text.slice(0, 200)}…` : a.text;
        blocks.push({ type: 10, content: `### ${emojis.announcements} Announcement ${i + 1}\n-# Posted <t:${postedTs}:R> — ${expiryText}\n${preview}` });
        blocks.push({
            type: 1, components: [
                { type: 2, style: 1, label: 'Edit', custom_id: `mng_announce_edit_${a._id}` },
                { type: 2, style: 4, label: 'Delete', custom_id: `mng_announce_delete_${a._id}` }
            ]
        });
        if (i < announcementDocs.length - 1) blocks.push({ type: 14, spacing: 1, divider: true });
    });
    return blocks;
}

// buildAdminListBlocks() RETIRED from here 2026-08-16 (observability stage 3) -- moved to commands/bot.js alongside the rest of /bot access, which is what renders the admin allowlist now.

// Renders the "Next Season Draft" page's live status block -- the one dynamic block on this panel (see buildManagePage's 'status' group style, same dynamicData mechanism Patch Notes' "Past Seasons" select already uses). Computed fresh from a live seasonalDoc every render, never cached.
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

// Loadouts page definition factory — MP and DMZ render from the exact same shape, just with a different `mode` baked into every action id (so the handlers in handlers/manage/loadouts.js know which collection slice to touch) and a different header icon/label.
function loadoutsPageDef(mode, headerLabel, icon, client) {
    return {
        label: headerLabel,
        icon,
        headerLabel,
        mode,
        groups: [
            {
                // P1 roadmap item (2026-07-18): loadout image handling was a genuine mystery, even to Harkirat -- he had to rename a screenshot locally + re-upload before FSS Hurricane rendered, and noticed some Secondaries files never got renamed at all. Confirmed the REAL workflow live against the actual Cloudinary account before writing this (not guessed): every loadout image sits in one flat "gun-builds" folder (organizational only in Cloudinary's UI -- it's NOT part of the delivery URL, see buildImageUrl() in utils/loadoutRender.js, which has no folder segment at all), and Cloudinary assigns the Public ID from the uploaded file's own name unless it's renamed -- which is exactly why some assets are clean (`BAL-27-1`, `DMZ-AK117-1`) and others are raw camera filenames (`IMG_5630`, etc.) that were never renamed. `buttons: []` here is deliberate -- this is a pure info block, not an action -- buildManagePage's `group.buttons.map(...)` on an empty array just produces zero button rows.
                blocks: [
                    `### ${emojis.mngInfo} How Images Work\n-# **Fastest path: ${mentionCommand(client, '/autobuild')}** — hand it a Gunsmith screenshot and it reads the build, uploads the picture and saves the loadout.\n-# **Add and Edit:** attach a screenshot or paste an image URL; the bot files it on Cloudinary under the build's gunsmith code (\`WEAPON-CODE\`, e.g. \`BAL-27-1C2B4A8B9A\`), so a picture always belongs to its code. DMZ builds have no code and use \`DMZ-WEAPON-N\`.\n-# **A new code, same attachments:** the picture moves to the new key. **New attachments, no new picture:** you're asked to keep the old picture, upload a new one, or save without one.`
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
                buttons: ['add', 'edit', 'delete']
            },
            {
                heading: 'Manage Multiple Loadouts',
                blocks: [
                    `### ${emojis.mngBulkAdd} Add Multiple Loadouts\n-# Add multiple new loadouts at once. Image is pulled from Cloudinary automatically once uploaded there.`,
                    `### ${emojis.mngBulkReplace} Replace Multiple Loadouts\n-# Update existing loadouts by weapon/build match, or add them if they don't exist yet. Image data is kept based on the Cloudinary key.`,
                    `### ${emojis.mngBulkDelete} Delete Multiple Loadouts\n-# Remove multiple loadouts at once by pasting their weapon (and optionally build) names. The image stays on Cloudinary.`
                ],
                buttons: ['bulkadd', 'bulkreplace', 'bulkdelete']
            },
            {
                heading: 'Export Loadouts',
                blocks: [
                    `### ${emojis.mngExport} Export Up To 5 Loadouts\n-# Extract up to 5 loadouts by weapon name, formatted for an easy re-import.`,
                    `### ${emojis.mngExport} Export A Category\n-# Extract every loadout in one weapon category, formatted for an easy re-import.`,
                    `### ${emojis.mngExport} Export All Loadouts\n-# Extract every loadout in the database, formatted for an easy re-import.`
                ],
                buttons: ['exportupto5', 'exportcategory', 'exportall']
                // No Purge here — see PURGE_LABELS comment above.
            },
            // Guide -- last section, matching every other page's convention (2026-07-31 17:20 EDT).
            {
                style: 'inline',
                items: [
                    { text: `### ${emojis.guide} Bulk Format Guide\n-# Forget the paste format? Get a rich, structured reference + example.`, button: 'formatguide' }
                ]
            }
        ]
    };
}

// Neutral dark panel color — used only as the fallback for a page with no accent of its own.
const PANEL_ACCENT = 0x2b2d31;

// Per-page accent colors (2026-07-20) — each page reuses its matching command's own identity color instead of the flat neutral panel color every page used before. Draws/Calendar/Patch Notes mirror their own command's `PRESET_ACCENT` exactly (values copied rather than required in, to avoid coupling manage.js's load to those 3 command modules for one constant each — keep these in sync by hand if any of those 3 PRESET_ACCENT values are ever re-picked). Loadouts MP/DMZ don't have an existing command-level PRESET_ACCENT to borrow (loadout cards use per-category/ per-mode colors, not one fixed identity color) — their accents were instead sampled directly off the actual emoji assets already used as each page's icon (`utils/colorExtract.js`'s `getDominantColor()`, the bot's own extraction algorithm, run once against the Discord CDN emoji PNGs rather than a guessed hex): MP red from `:Rank_7Legendary_CODM:` → #FF3430, DMZ blue from `:DMZ_CODM:` → #337BA6. Season has no page in `PAGES` at all (see the dropdown note below), so it needs no entry here.
const PAGE_ACCENT = {
    draws: 7032445,       // Plum Fortune #6B4E7D — mirrors commands/draws.js's PRESET_ACCENT
    calendar: 3821672,     // Slate Harbor #3A5068 — mirrors commands/calendar.js's PRESET_ACCENT
    patchnotes: 15909424,  // Patch Gold #F2C230 — mirrors commands/patchnotes.js's PRESET_ACCENT
    loadouts_mp: 16725040, // #FF3430 — sampled from the :Rank_7Legendary_CODM: emoji
    loadouts_dmz: 3373990, // #337BA6 — sampled from the :DMZ_CODM: emoji
    seasondraft: 15898954  // Neon Amber #F2994A — mirrors commands/seasonend.js's PRESET_ACCENT (same
                            // season-lifecycle theme; this page has no public-facing command of its own)
};

// Builds Patch Notes' "Past Seasons" select-menu options from a live seasonalDoc (2026-07-24) -- shared by both call sites that render the patchnotes page (manage.js's own execute() and handlers/manage/shared.js's mng_pagesel handler) so there's exactly one definition of "which entries count as past, in what order." Excludes the current (last) entry -- only PAST seasons belong here -- most-recent-first, capped at Discord's 25-option select-menu limit.
function buildPastSeasonsOptions(seasonalDoc) {
    const { displayTitle } = require('./patchnotes');
    const entries = seasonalDoc?.patchNotes || [];
    return entries.slice(0, -1).reverse().slice(0, 25).map(p => ({
        label: displayTitle(p).slice(0, 100),
        value: p._id.toString()
    }));
}

// `allowedPages` (added 2026-08-13, per-page /manage permissions) -- an array of PAGES keys (+ the 'season' pseudo-key) to limit the dropdown to, or `null` for every page. ⚠️ Every caller passes null since the permission restructure (2026-10-19 19:25 EDT): any admin browses every page and a button checks its own tier on the press (his decision, 2026-10-19 18:17 EDT). The parameter is kept so a future view-limited caller does not have to re-thread it. Turns a registry action id into the rendered panel button. Label and style come from utils/manageActions.js (2026-08-14) rather than being written inline in buildPagesTable above -- that table now names only WHICH actions a group offers, and the registry owns what each one looks like and what it does. buttonFor() throws on an unregistered id, so a button that no handler can serve fails loudly at render instead of shipping as a dead button.
function actionButton(pageKey, id) {
    const b = buttonFor(pageKey, id);
    return { type: 2, style: b.style, label: b.label, custom_id: `mng_act_${pageKey}_${b.id}` };
}

// THE PAGE DROPDOWN (mng_pagesel), shared by every /manage page and by the emoji panel, which draws it outside its own container so a click on it swaps the whole /manage message (2026-10-28 12:11 EDT, Harkirat). `showEmojis` adds the Emojis entry: owner only, so the callers pass isOwnerId() of whoever is looking.
function pageSelectRow(PAGES, pageKey, allowedPages, showEmojis) {
    // Page nav dropdown — Season has NO page of its own at all (per Harkirat's request: "let that selection open the editing modal right away instead of a dedicated management page"). Rather than one "Season" option leading to an intermediate page with 2 buttons (Titles & Deadlines / Wipe Season), both of Season's actions get their own flat dropdown entries — picking either opens its modal directly with nothing in between, see handlers/manage/shared.js's `mng_pagesel` handler.
    const showSeasonFlat = !allowedPages || allowedPages.includes('season');
    const canReach = key => !allowedPages || allowedPages.includes(key);
    // ⚠️ ORDER (reworked 2026-08-15 13:27 EDT, Harkirat's direct request) is now explicit rather than "whatever order Object.entries(PAGES) happens to iterate, then both flat Season entries dumped at the end" -- that's what disagreed with the `content` slash option's own order above (which grouped the Season entries mid-list) and read as scattered. Same shared grouping here: everyday content pages, then season-lifecycle actions in the order you'd actually touch them, then the two admin-surface pages. `pushPage` is a real PAGES key; the two literal pushes below it are Season's flat (non-PAGES) entries.
    const pageOptions = [];
    const pushPage = key => { if (PAGES[key] && canReach(key)) pageOptions.push({ label: PAGES[key].label, value: key, default: key === pageKey }); };
    pushPage('draws');
    pushPage('calendar');
    pushPage('patchnotes');
    pushPage('loadouts_mp');
    pushPage('loadouts_dmz');
    if (showSeasonFlat) pageOptions.push({ label: 'Season: Titles & Deadlines', value: 'season_titlesdeadlines', default: false });
    pushPage('seasondraft');
    if (showSeasonFlat) {
        // Renamed from "Season: Wipe Season" (2026-07-12, Harkirat's request) — the OLD name read as a low-stakes settings toggle; the option's own `description` (rendered as a smaller gray line under the label in Discord's select menu) now spells out exactly what it does, specifically so it isn't mistakenly clicked. Also gained the same 2-step Confirm/Cancel flow as Purge (see handlers/manage/season.js's modal_wipe_season handler) — selecting this used to wipe draws/calendar the INSTANT the title modal was submitted, no confirmation at all.
        pageOptions.push({ label: 'Start New Season', value: 'season_wipe', default: false, description: '⚠️ Wipes all draws & calendar data. Cannot be undone.' });
    }
    pushPage('announcement');
    if (showEmojis) pageOptions.push({ label: 'Emojis', value: 'emojis', default: pageKey === 'emojis', description: "Every bot's emojis, with sync and upload" });
    return { type: 1, components: [{ type: 3, custom_id: 'mng_pagesel', placeholder: 'Jump to a section...', options: pageOptions }] };
}

function buildManagePage(page, dynamicData = {}, client, allowedPages = null, { showEmojis = false } = {}) {
    // Built here, per render, so emoji ids are read AFTER refreshEmojiIds() has run (see buildPagesTable).
    const PAGES = buildPagesTable(client);
    const visibleKeys = allowedPages ? Object.keys(PAGES).filter(k => allowedPages.includes(k)) : Object.keys(PAGES);
    const fallbackKey = visibleKeys.includes('draws') ? 'draws' : visibleKeys[0];
    const pageKey = (PAGES[page] && visibleKeys.includes(page)) ? page : fallbackKey;
    const pageData = PAGES[pageKey];
    // Guarded (v3-pre-release review, finding #17) -- 'season' was a grant token (retired with the flat token list 2026-10-19 19:38 EDT; the scope is now `manage.season`) but a PSEUDO-page: it is not a key in the PAGES table above. Unreachable while every caller passes `allowedPages = null`, and kept for the future view-limited caller that parameter exists for. An admin scoped to EXACTLY 'season' (no other page) made visibleKeys=['season'], fallbackKey=undefined, pageData=undefined -- and the render threw on an already-deferred interaction, leaving a dead panel with no message. Fall back to the same "nothing to show" state a genuinely empty allowedPages would produce, rather than crashing.
    if (!pageData) {
        return {
            components: [{ type: 10, content: `# ${emojis.database} Database Management\n${emojis.warn} You have access to Season settings only, which isn't a standalone page here — use \`/manage season\` instead.` }],
            flags: 32768,
        };
    }
    const accentColor = PAGE_ACCENT[pageKey] ?? PANEL_ACCENT;

    const components = [
        { type: 10, content: `# ${emojis.database} Database Management\n## ${pageData.icon} ${pageData.headerLabel}` },
        { type: 14, spacing: 2, divider: true }
    ];

    // Large divider spacing (2026-07-12, matches drawprices.js's spacing:2 change) — applied to EVERY divider on this panel now, including the one right after the title (that exception was dropped the same day it was introduced, per Harkirat's explicit "large spacing across the board" follow-up).
    pageData.groups.forEach(group => {
        if (group.heading) components.push({ type: 10, content: `## ${group.heading}` });
        if (group.style === 'inline') {
            // Section + button-accessory (2026-07-12, Calendar's Export/Purge groups) -- same pattern /settings' visibility toggles use, instead of a block-list-then-shared-row.
            group.items.forEach(item => {
                components.push({
                    type: 9,
                    components: [{ type: 10, content: item.text }],
                    accessory: actionButton(pageKey, item.button)
                });
            });
        } else if (group.style === 'select') {
            // Section + select menu (2026-07-24, Patch Notes' "Past Seasons") -- options come from `dynamicData[group.optionsKey]` rather than this static PAGES table, since they're built fresh from the DB every render (see handlers/manage/shared.js's mng_pagesel/manage.js's execute() call sites). Discord requires at least 1 option and rejects an empty array outright, so an empty result falls back to one disabled placeholder option instead of omitting the row -- same "always render the row, just inert" approach as Loadouts' empty-state info block above, rather than a conditional layout the rest of this file doesn't otherwise do.
            group.blocks.forEach(content => components.push({ type: 10, content }));
            const dynamicOptions = dynamicData[group.optionsKey];
            const hasOptions = Array.isArray(dynamicOptions) && dynamicOptions.length > 0;
            const options = hasOptions ? dynamicOptions : [{ label: 'No past seasons yet', value: 'none', default: true }];
            components.push({
                type: 1,
                components: [{ type: 3, custom_id: group.selectId, placeholder: group.placeholder || 'Select...', options, disabled: !hasOptions }]
            });
        } else if (group.style === 'status') {
            // Live-computed text block (2026-07-24 pattern extended 2026-07-30 22:24 EDT) -- same dynamicData mechanism as the 'select' branch above, just rendered as a Text Display instead of a select menu. `dynamicData[group.dynamicKey]` is built fresh per render by whichever call site is rendering this page (see manage.js's execute()/handlers/manage/shared.js's mng_pagesel), never baked into the static PAGES table.
            components.push({ type: 10, content: dynamicData[group.dynamicKey] || 'Loading…' });
        } else if (group.style === 'raw') {
            // Pre-built raw Discord components, spliced in verbatim (2026-08-13, Announcement's per-item Edit/Delete list) -- for a page whose group shape is genuinely dynamic (one Text Display + Action Row PER live DB row, not a fixed number of buttons), unlike 'status' above which is still exactly one static block. Built by whichever call site is rendering this page (manage.js's execute()/handlers/manage/shared.js's mng_pagesel), same as every other dynamicData-fed style.
            (dynamicData[group.dynamicKey] || []).forEach(component => components.push(component));
        } else {
            group.blocks.forEach(content => components.push({ type: 10, content }));
            const buttons = group.buttons.map(id => actionButton(pageKey, id));
            for (let i = 0; i < buttons.length; i += 5) components.push({ type: 1, components: buttons.slice(i, i + 5) });
        }
        components.push({ type: 14, spacing: 2, divider: true });
    });

    components.push({ type: 10, content: '-# Select from the list below to manage a different command\'s data.' });

    components.push(pageSelectRow(PAGES, pageKey, allowedPages, showEmojis));

    return [{ type: 17, accent_color: accentColor, components }];
}

// --- Generic one-field "search by name" modal, shown when Edit/Delete is clicked — buttons can't autocomplete like a slash command option could, so this collects a query text first. handlers/manage/shared.js's `mng_search_` submit handler fuzzy-matches it against the target collection and either chains straight into the real edit modal (single match), shows a disambiguation dropdown (multiple matches), or reports no matches found.
const ENTITY_LABELS = { draws: 'Draw', calendar: 'Calendar Event', loadouts_mp: 'MP Loadout', loadouts_dmz: 'DMZ Loadout', patchnotes: 'Patch Notes Entry' };
function buildSearchModal(group, action) {
    const entityLabel = ENTITY_LABELS[group] || 'Item';
    const modal = new ModalBuilder().setCustomId(`mng_search_${group}_${action}`).setTitle(`${action === 'edit' ? 'Search: Edit' : 'Search: Delete'} ${entityLabel}`);
    modal.addComponents(
        // A loadout search can name one build (`BAL-27 2`, `BAL-27 Ranked`) and skip the picker (utils/loadoutForm.js pickBuild, 2026-10-26 12:24 EDT), so the box says so.
        new ActionRowBuilder().addComponents((() => {
            const input = new TextInputBuilder().setCustomId('query').setLabel(`${entityLabel} name to search for`).setStyle(TextInputStyle.Short).setRequired(true);
            return group.startsWith('loadouts_') ? input.setPlaceholder('BAL-27 · or BAL-27 2 / BAL-27 Ranked for one build') : input;
        })())
    );
    return modal;
}

// --- DRAWS modal builders --- NOTE: the old per-category buildBulkDrawsModal(isNew, mode) — one modal for New-only, another for Returning-only — was removed 2026-07-12 when the New/Returning/Either button triplet got condensed to a single button per bulk section (see PAGES.draws above). buildBulkBothDrawsModal below (previously the "Either/Both" option only) is now the ONLY draws bulk add/replace modal — its two independently-optional fields already cover the single-category case by leaving one field blank, so there was nothing the per-category modal did that this one couldn't.
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
    // drawType: 'new' | 'returning' | 'either' — either/both shows both fields, new/returning shows only the one relevant field (the other stays blank/unused for that submit).
    const modal = new ModalBuilder().setCustomId(`modal_draws_bulk_remove_${drawType}`).setTitle('Bulk Delete Draws');
    const rows = [];
    if (drawType !== 'returning') rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_titles').setLabel('Remove from New (titles, one per line)').setStyle(TextInputStyle.Paragraph).setRequired(drawType === 'new')));
    if (drawType !== 'new') rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('returning_titles').setLabel('Remove from Returning (one per line)').setStyle(TextInputStyle.Paragraph).setRequired(drawType === 'returning')));
    modal.addComponents(...rows);
    return modal;
}

// THE DRAW TYPE DROPDOWN, shared by Add and Edit Draw (2026-10-18 11:09 EDT, Harkirat: "a single dropdown for the collective 'draw type' selection and include the armory types within it"). /draw prices' own list in page order (utils/drawTypes.js); the stored type is preselected, and picking nothing leaves it unset. An armory's item count is read off the Items field, so there is no count to pick. A select lives in a modal only inside a Label, which is why both draw forms are built from Labels. REQUIRED, with Unsure / Unknown first (2026-10-18 11:37 EDT, Harkirat: "make it a required field and add the option for 'unsure/unknown' at the top of the list"), on Add and Edit alike so an untyped draw can only come from a bulk paste without a tag. Unknown is a stored flag the portal can list for fixing later.
function drawTypeLabel(current = '') {
    const { drawTypeChoices } = require('../utils/drawTypes');
    return new LabelBuilder().setLabel('Draw Type').setDescription('How /draw prices and the calculator price this draw').setStringSelectMenuComponent(
        new StringSelectMenuBuilder().setCustomId('price_type').setPlaceholder('Pick its Draw Type').setRequired(true).setMinValues(1).setMaxValues(1)
            .addOptions(drawTypeChoices().map(o => ({ label: o.name, value: o.key, description: o.tier ? `Bulk tag: type: ${o.code}` : 'Flags it to set later. Bulk tag: type: unknown', emoji: o.tier ? emojis.parseEmoji(emojis[o.tier]) : { name: '❓' }, default: o.key === current })))
    );
}
// A Label holding a text input. interaction.fields.getTextInputValue() reads it exactly as it read an action row's.
const drawTextLabel = (id, label, input) => new LabelBuilder().setLabel(label).setTextInputComponent(input.setCustomId(id));

// `prefill` (added 2026-10-19 11:16 EDT, the Add to Draws right-click): title, date and url come from the post. A box gets a value only when there is one, so the blank box /manage opens keeps its exact shape.
function buildAddDrawModal(drawType, prefill = {}) {
    const withValue = (input, value) => (value ? input.setValue(value) : input);
    const modal = new ModalBuilder().setCustomId(`add_draw_${drawType}`).setTitle(`Add ${drawType === 'new' ? 'New' : 'Returning'} Draw`);
    // The 5th field was "Or Paste As One Line" (2026-07-12) until 2026-10-18 11:09 EDT: Discord caps a modal at five, and the Draw Type dropdown took its place at Harkirat's pick ("B sounds fine"). A whole draw pasted as one line still goes in through Add Multiple, whose format carries the same `type:` tag. With it gone, Title, Items and Release Date are required again: they were optional only so a one-line paste could submit alone.
    modal.addLabelComponents(
        drawTextLabel('title', 'Draw Title', withValue(new TextInputBuilder().setStyle(TextInputStyle.Short), prefill.title)),
        drawTextLabel('items', 'Items (Shorthand)', new TextInputBuilder().setStyle(TextInputStyle.Paragraph).setPlaceholder("m Character Name\nl Gun Name\ne Emote Name\n-# Optional note")),
        drawTextLabel('date', 'Release Date', withValue(new TextInputBuilder().setStyle(TextInputStyle.Short).setPlaceholder("e.g. July 15"), prefill.date)),
        // Optional (2026-07-12, Cloudinary-cache feature): blank reuses whatever's already cached for this exact draw title (utils/cloudinaryCache.js).
        drawTextLabel('url', 'Thumbnail URL (blank = reuse cached image)', withValue(new TextInputBuilder().setStyle(TextInputStyle.Short).setRequired(false), prefill.url)),
        drawTypeLabel()
    );
    return modal;
}

function buildEditDrawModal(targetDraw, targetId, drawType) {
    // 'comment' items (2026-07-30 22:24 EDT, "-# note" lines) reconstruct as "-# text", not their first-letter shorthand -- charAt(0) would produce "c", which round-trips through parseItemLine as an unrecognized tier instead of a comment.
    const itemsText = targetDraw.items.map(i => `${i.tier === 'comment' ? '-#' : i.tier.charAt(0).toLowerCase()} ${i.name}`).join('\n');
    const modal = new ModalBuilder().setCustomId(`edit_draw_${targetId}_${drawType}`).setTitle('Edit Lucky Draw');
    // LABELS (2026-10-18 11:06 EDT): every field is a Label so the Draw Type dropdown can sit beside them (see drawTypeLabel above).
    const text = drawTextLabel;
    modal.addLabelComponents(
        text('title', 'Draw Title', new TextInputBuilder().setStyle(TextInputStyle.Short).setValue(targetDraw.title)),
        text('items', 'Items (Shorthand)', new TextInputBuilder().setStyle(TextInputStyle.Paragraph).setValue(itemsText)),
        text('date', 'Release Date', new TextInputBuilder().setStyle(TextInputStyle.Short).setValue(new Date(targetDraw.date).toISOString().split('T')[0])),
        // Pre-filled with the CURRENT thumbnail (already a Cloudinary URL if this draw was ever cached) — optional so clearing it and resubmitting re-resolves via the cache lookup instead of requiring a re-typed URL just to leave the image unchanged. BUG FIX (2026-07-12): setValue() throws a synchronous validation error if given `undefined`/non-string — discord.js requires a real string, even for an optional field. Any draw doc missing thumbnailUrl (legacy entries from before the Cloudinary-cache feature, or any doc that somehow saved without one) made this throw INSIDE resolveManagePanelAction's showModal() call, before the interaction was ever acknowledged — which is exactly what surfaced as Discord's generic "Something went wrong. Try again." toast on Edit Draws. Fall back to '' like every other optional field already does.
        text('url', 'Thumbnail URL (blank = reuse cached image)', new TextInputBuilder().setStyle(TextInputStyle.Short).setValue(targetDraw.thumbnailUrl || '').setRequired(false)),
        drawTypeLabel(targetDraw.priceType || '')
    );
    return modal;
}

// --- CALENDAR modal builders ---
function buildCalendarBulkModal(mode) {
    // mode: 'add' (additive — NEW, appends) | 'replace' (existing wholesale-replace behavior)
    const modal = new ModalBuilder().setCustomId(`modal_calendar_bulk_${mode}`).setTitle(mode === 'add' ? 'Add Multiple Calendar Events' : 'Replace Calendar Events');
    modal.addComponents(
        // Optional d•/p•/e• prefix (draw/playlist/event) added for the 3-section calendar redesign (2026-07-31 12:10/12:40 EDT) — matches Harkirat's own calendar_bulk.txt convention. No prefix auto-detects from the title's own wording (adminParser.js's guessCalendarCategory) -- only needed to override an ambiguous title (e.g. a bare map name with no "mode"/"playlist" in it). Fixed 2026-08-07 15:41 EDT: this placeholder was 181 chars against Discord's HARD 100-char cap on modal TextInput placeholders (djs throws ExpectedConstraintError, not a soft truncation) -- buildCalendarBulkModal() crashed before showModal() ever ran, so BOTH bulk add/replace buttons appeared totally dead in prod ("didn't respond in time") even after the real deferReply() fix landed same-day, because the crash happens one step earlier at modal- build time. The dev bot never caught this because dev testing that session never actually clicked these two buttons post-fix (see DEVLOG "Wrong database, wrong script..." entry).
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bulk_text').setLabel('Bulleted List (UTC-0 dates)').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("7/2 - 8/5 | Throwable Frenzy MP Mode\n7/6 - 7/19 | Nuketown Playlist\np• 8/6-8/19 | Krai BR (prefix)").setRequired(true))
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

// `prefill` (added 2026-10-19 11:16 EDT, the Add to Calendar right-click): title, startDate and endDate come from the post. Same set-only-when-present rule as the Add Draw box.
function buildCalendarAddModal(prefill = {}) {
    const withValue = (input, value) => (value ? input.setValue(value) : input);
    const modal = new ModalBuilder().setCustomId('modal_calendar_add').setTitle('Add Calendar Event');
    modal.addComponents(
        new ActionRowBuilder().addComponents(withValue(new TextInputBuilder().setCustomId('title').setLabel('Event Title').setStyle(TextInputStyle.Short), prefill.title).setRequired(true)),
        new ActionRowBuilder().addComponents(withValue(new TextInputBuilder().setCustomId('start_date').setLabel('Start Date').setStyle(TextInputStyle.Short).setPlaceholder('e.g. July 2'), prefill.startDate).setRequired(true)),
        new ActionRowBuilder().addComponents(withValue(new TextInputBuilder().setCustomId('end_date').setLabel('End Date (blank = All Season)').setStyle(TextInputStyle.Short).setPlaceholder('e.g. August 5'), prefill.endDate).setRequired(false)),
        // Added for the 3-section calendar redesign (2026-07-31 12:10 EDT) -- blank auto-detects from the title's own wording (adminParser.js's guessCalendarCategory), same as an un-prefixed bulk-import line.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('category').setLabel('Section (draw / event / playlist)').setStyle(TextInputStyle.Short).setPlaceholder('blank = auto-detect from title').setRequired(false)),
        // Double CP event flag (added 2026-08-15 for /draw calculator) -- a plain Y/N text field rather than a real checkbox (Discord modals have none). Blank/anything not starting with Y is treated as No, matching the lenient parsing handlers/manage/calendar.js already uses.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('double_cp').setLabel('Double CP Event? (Y/N)').setStyle(TextInputStyle.Short).setPlaceholder('blank = No').setRequired(false))
    );
    return modal;
}

// Page Banners (added 2026-07-31 17:20 EDT) -- one modal, 3 independently-clearable Short URL fields. Pre-filled from whatever's currently saved so re-submitting to change just one field doesn't blank out the other two.
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
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('category').setLabel('Section (draw / event / playlist)').setStyle(TextInputStyle.Short).setValue(targetEvent.category || 'event').setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('double_cp').setLabel('Double CP Event? (Y/N)').setStyle(TextInputStyle.Short).setValue(targetEvent.isDoubleCP ? 'Yes' : 'No').setRequired(false))
    );
    return modal;
}

// --- LOADOUTS modal builders --- (shared by MP + DMZ, `mode` param picks which)
function buildLoadoutsBulkAddModal(mode) {
    // FORMAT REDESIGNED 2026-08-22 -- see utils/adminParser.js's parseBulkLoadoutList docblock for the shape and the reasoning. The label states the whole principle in one line, because the complaint that drove this was that the old format had no statable principle at all: identity on line one, one optional field per line, everything else is an attachment. NO Mode field any more, and it is not an omission: the old format REQUIRED Mode as pipe-segment 3 while the save path overwrote it with this page's `mode` regardless -- so a DMZ block pasted here saved as MP with no warning. The page has always been what decides; the format now matches.
    const modal = new ModalBuilder().setCustomId(`modal_loadouts_bulk_add_${mode}`).setTitle(`Bulk Add ${mode} Loadouts`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bulk_text').setLabel('Weapon | Category, then one field per line').setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(`BAL-27 | AR\nBuild: Flex\nImage: BAL-27-1\nCode: 1I2C6B8A9D\nBadges: meta\n- Gauge-9 Mono`)
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

// "Up To 5" and "Category" export are collected via a small modal first (a real live search+select list is the deferred future work — see this file's top-of-file note); "All" needs no modal at all and replies with the file directly from the mng_act_ handler.
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

// The Add and Edit Loadout pop-up, five fields (Harkirat, 2026-10-25 21:48 EDT): weapon name and label · category, build # and gunsmith code · attachments and badges · an image URL · a screenshot upload. Raw API JSON, not the builder classes, because a file upload (type 19) sits inside a Label (type 18), which the builders do not make (/emojis' upload pop-up is built the same way). Discord caps a modal at 5, which is why the badges ride in the attachments box as a `Badges:` line and the label rides behind the weapon name. Read back by handlers/manage/loadouts.js through utils/loadoutForm.js.
//
// 🔴 THE IMAGE IS NEVER A TYPED KEY ANY MORE. MP picture keys are minted from the weapon and the gunsmith code (`WEAPON-CODE`, utils/loadoutImageCache.js codeImageKey), so the old "Cloudinary Image Key, or an Image URL" box is gone: a key typed by hand is how a picture ended up under the wrong build. DMZ, which has no code, still mints `DMZ-WEAPON-N`.
const loadoutLabel = (text, description, component) => ({ type: 18, label: text, ...(description ? { description } : {}), component });
function loadoutModal({ customId, title, mode, values = {}, isEdit }) {
    const input = (custom_id, style, required, max_length, placeholder) => ({
        type: 4, custom_id, style, required, max_length, placeholder,
        ...(values[custom_id] ? { value: String(values[custom_id]).slice(0, max_length) } : {}),
    });
    const dmz = mode === 'DMZ';
    const modal = {
        custom_id: customId, title,
        components: [
            loadoutLabel('Weapon name, label', 'The label is optional and only shown here, e.g. BAL-27, Ranked', input('weapon', 1, true, 80, 'BAL-27, Ranked')),
            loadoutLabel(dmz ? 'Category, build #' : 'Category, build #, gunsmith code',
                dmz ? 'A build # another build has swaps the two; blank is the next number' : 'The code is required; a build # another build has swaps the two',
                input('build', 1, true, 60, dmz ? 'AR, 2' : 'AR, 2, 1C2B4A8B9A')),
            loadoutLabel('Attachments and badges', 'One attachment per line, then a Badges: line', input('attachments', 2, true, 1000, 'Gauge-9 Mono\nCrown-H3 Barrel\nBadges: meta, top3')),
            loadoutLabel(isEdit ? 'Replace image (URL)' : 'Image (URL)', 'Optional. Use this or the screenshot, not both', input('image_url', 1, false, 500, 'https://...')),
            loadoutLabel(isEdit ? 'Replace image (screenshot)' : 'Image (screenshot)', 'Optional. A Gunsmith screenshot of this build', { type: 19, custom_id: 'image_file', min_values: 0, max_values: 1, required: false }),
        ],
    };
    // toJSON() like a ModalBuilder's, so every caller that serializes a modal (the retry refill, the snapshot tests, discord.js itself) treats both alike. Non-enumerable, so the copy it returns carries no function.
    Object.defineProperty(modal, 'toJSON', { value() { return structuredClone(this); } });
    return modal;
}

function buildAddLoadoutModal(mode) {
    return loadoutModal({ customId: `add_loadout_${mode}`, title: `Create New ${mode} Loadout`, mode, isEdit: false });
}

// `siblings` are the weapon's builds in this mode, the target included; they give a legacy build (one with its label as its name) its build #. Callers without them still get a working box, with the # blank.
function buildEditLoadoutModal(targetLoadout, targetId, siblings = null) {
    const { editValues } = require('../utils/loadoutForm');
    const tokens = require('../utils/adminParser').loadoutBadgeTokens(targetLoadout);
    const values = targetLoadout.weaponName ? editValues(targetLoadout, siblings || [targetLoadout], tokens) : {};
    return loadoutModal({ customId: `edit_loadout_${targetId}`, title: 'Edit Loadout', mode: targetLoadout.mode || 'MP', values, isEdit: true });
}

// --- PATCH NOTES modal builders --- (all 3 operate on the single "current" entry — the last item in patchNotes[], the one whose title stays synced to currentSeasonTitle — rather than a search-and-pick flow. If none exists yet, Date/Info's submit creates the first one.)
function buildPatchDateInfoModal(currentEntry, userTimezone) {
    const modal = new ModalBuilder().setCustomId('modal_patch_dateinfo').setTitle('Patch Notes: Date & Info');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('release_date').setLabel('Release Date').setStyle(TextInputStyle.Short).setPlaceholder('e.g. July 15, or July 15 7:20 AM (your local time)').setValue(currentEntry ? formatReleaseDateTime(currentEntry.releaseDate, userTimezone) : '').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Additional Info (optional)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Per-line: # Weapon, Attachment, b:/n:/f: text...\nb/n/f: = buff/nerf/fix emojis (See Guide button)').setValue(currentEntry?.description || '').setRequired(false)),
        // Manual title override (2026-07-24) -- for when patch notes release before the new season's real title is finalized/announced. Blank reverts to the auto-synced title (currentSeasonTitle, via the Season Titles/Dates modal) -- see handlers/manage/patchnotes.js's modal_patch_dateinfo submit handler.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('season_title').setLabel('Season Title Override (blank = auto)').setStyle(TextInputStyle.Short).setValue(currentEntry?.titleOverride || '').setRequired(false))
    );
    return modal;
}

function buildPatchUrlsModal(slot, currentEntry) {
    // slot: 1 -> images[0..4], 2 -> images[5..9]. Each of the 5 URLs now gets its OWN Short field (2026-07-12, Harkirat's request) -- a modal has exactly 5 field slots and this used to put all 5 URLs into ONE Paragraph field (newline-joined), which is exactly why the URLs were split into two "URLs 1"/"URLs 2" modals in the first place; now that split pays off further, with each field independently addressable/clearable.
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

// "Add New Season" (2026-07-24) -- pushes a brand-new entry onto patchNotes[], which becomes the new "current" entry (the old current entry automatically becomes a past season -- it's simply no longer the last item in the array, nothing else needs to change about it). Unlike Date/Info's 2 fields, this needs all 5 of a modal's field slots at once since there's no existing entry yet to spread the URLs input across separate dateinfo/urls1/urls2 actions -- so URLs 1/2 are collected here as multi-line paragraph fields (one URL per line) instead of 5 individually-addressable Short fields each, same shape Harkirat's own mockup called for. `prefill` (added 2026-10-19 10:22 EDT, Add to Patch Notes): the right-click flow opens this same box with the post's date, extra text and images already in it. With no argument the box is blank, as /manage opens it.
function buildPatchAddSeasonModal(prefill = {}) {
    // A box gets a value only when there is one, so the blank box /manage opens keeps exactly its old shape (scripts/patchnotesHandlerSnapshot.test.js pins it).
    const withValue = (input, value) => (value ? input.setValue(value) : input);
    const modal = new ModalBuilder().setCustomId('modal_patch_addseason').setTitle('Add New Season');
    const images = prefill.images || [];
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('season_title').setLabel('Season Title (blank = use current)').setStyle(TextInputStyle.Short).setPlaceholder('Leave blank to use the Season Titles/Dates title').setRequired(false)),
        new ActionRowBuilder().addComponents(withValue(new TextInputBuilder().setCustomId('release_date').setLabel('Release Date').setStyle(TextInputStyle.Short).setPlaceholder('e.g. July 15, or July 15 7:20 AM (your local time)'), prefill.releaseDate).setRequired(true)),
        new ActionRowBuilder().addComponents(withValue(new TextInputBuilder().setCustomId('description').setLabel('Additional Info (optional)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Per-line: # Weapon, Attachment, b:/n:/f: text...\nb/n/f: = buff/nerf/fix emojis (See Guide button)'), prefill.description).setRequired(false)),
        new ActionRowBuilder().addComponents(withValue(new TextInputBuilder().setCustomId('urls1').setLabel('URLs 1 (one per line, up to 5)').setStyle(TextInputStyle.Paragraph), images.slice(0, 5).join('\n')).setRequired(false)),
        new ActionRowBuilder().addComponents(withValue(new TextInputBuilder().setCustomId('urls2').setLabel('URLs 2 (one per line, up to 5 more)').setStyle(TextInputStyle.Paragraph), images.slice(5, 10).join('\n')).setRequired(false))
    );
    return modal;
}

// "Past Seasons" edit (2026-07-24) -- same 5-field shape as Add New Season above, but pre-filled from and submitted back onto ONE SPECIFIC existing entry (picked via the page's `mng_patchseason_pick` select menu), addressed by its own `_id` in the custom_id -- never touches which entry is "current." `images` slices the same 0-4/5-9 way urls1/urls2 already do for the current entry. `prefill` (added 2026-10-19 10:22 EDT, Add to Patch Notes): `images` and `description` replace the entry's own in the box, `releaseDateIfBlank` fills the date only when the entry has none, and `modalTitle` names what the right-click is doing. The submit is the same edit either way.
function buildPatchEditSeasonModal(entry, userTimezone, prefill = {}) {
    const images = prefill.images || entry.images || [];
    const description = prefill.description ?? entry.description ?? '';
    const releaseDate = formatReleaseDateTime(entry.releaseDate, userTimezone) || prefill.releaseDateIfBlank || '';
    const modal = new ModalBuilder().setCustomId(`modal_patch_editseason_${entry._id}`).setTitle(prefill.modalTitle || 'Edit Past Season');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('season_title').setLabel('Season Title (blank = use current)').setStyle(TextInputStyle.Short).setValue(entry.titleOverride || '').setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('release_date').setLabel('Release Date').setStyle(TextInputStyle.Short).setValue(releaseDate).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Additional Info (optional)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Per-line: # Weapon, Attachment, b:/n:/f: text...\nb/n/f: = buff/nerf/fix emojis (See Guide button)').setValue(description).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urls1').setLabel('URLs 1 (one per line, up to 5)').setStyle(TextInputStyle.Paragraph).setValue(images.slice(0, 5).join('\n')).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('urls2').setLabel('URLs 2 (one per line, up to 5 more)').setStyle(TextInputStyle.Paragraph).setValue(images.slice(5, 10).join('\n')).setRequired(false))
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

// The season title box shows the season's emoji in front of its title (2026-10-19 09:30 EDT), so deleting it from the box clears it -- core/ops/season.js splits it back off on submit.
function withEmoji(emoji, title) {
    return [emoji, title].filter(Boolean).join(' ');
}

// A season line's date part: "start - end" when a start is stored (2026-10-21 10:17 EDT, /season end's progress bar), else the end alone, and "TBD" for a TBD end. core/ops/season.js reads either back.
function seasonDates(start, end, endTBD) {
    const endText = endTBD ? 'TBD' : formatAdminDate(end);
    return start && endText ? `${formatAdminDate(start)} - ${endText}` : endText;
}

function buildSeasonTitlesDeadlinesModal(seasonalDoc) {
    // Each deadline field combines its title and end date on one line ("Battle Pass, August 28") — pre-filled so re-submitting without touching a field preserves it — see adminParser.js's splitTitleDate() for how handlers/manage/season.js (via core/ops/season.js) parses these back apart.
    const bpLine = [seasonalDoc?.bpTitle || 'Battle Pass', seasonDates(seasonalDoc?.bpStart, seasonalDoc?.bpEnd, seasonalDoc?.bpEndTBD)].filter(Boolean).join(', ');
    const rankLine = [seasonalDoc?.rankTitle || 'Ranked Series', seasonDates(seasonalDoc?.rankStart, seasonalDoc?.rankEnd, seasonalDoc?.rankEndTBD)].filter(Boolean).join(', ');
    const dmzLine = [seasonalDoc?.dmzTitle || 'DMZ Season', seasonDates(seasonalDoc?.dmzStart, seasonalDoc?.dmzEnd, seasonalDoc?.dmzEndTBD)].filter(Boolean).join(', ');

    const modal = new ModalBuilder().setCustomId('modal_season_titles_deadlines').setTitle('Edit Season Titles & Deadlines');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('main_title').setLabel('Main Season Title').setStyle(TextInputStyle.Short).setValue(withEmoji(seasonalDoc?.currentSeasonEmoji, seasonalDoc?.currentSeasonTitle))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bp_line').setLabel('Battle Pass: Title, Start - End').setStyle(TextInputStyle.Short).setValue(bpLine)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rank_line').setLabel('Ranked Series: Title, Start - End').setStyle(TextInputStyle.Short).setValue(rankLine)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('dmz_line').setLabel('DMZ Season: Title, Start - End').setStyle(TextInputStyle.Short).setValue(dmzLine))
    );
    return modal;
}

// buildAdminGrantModal()/buildAdminEditPermissionsModal() RETIRED from here 2026-08-16 (observability stage 3) -- moved to commands/bot.js, custom_ids renamed modal_admin_* -> bot_adminmodal_* to match /bot's single owned prefix.

// --- ANNOUNCEMENT modal builder (2026-08-13, redesigned same day for multi-announcement + expiry) Shared by both Post New (announcementDoc = null) and Edit (prefilled from the existing doc) -- same field shape either way, just a different custom_id/title/prefill so handlers/manage/announcements.js's two separate submit handlers (create vs. update-in-place) can tell them apart.
function buildAnnouncementModal(announcementDoc) {
    const { expiryToInputValue } = require('../utils/announcement');
    const isEdit = Boolean(announcementDoc);
    const modal = new ModalBuilder()
        .setCustomId(isEdit ? `modal_announce_edit_${announcementDoc._id}` : 'modal_announce_post')
        .setTitle(isEdit ? 'Edit Announcement' : 'Post New Announcement');
    modal.addComponents(
        // No separate title field (considered, then removed 2026-08-13 -- Harkirat's call: it's plain markdown, a custom title can just be typed into the text itself, e.g. "# My Title"). The box stops at utils/announcement.js's ANNOUNCEMENT_TEXT_MAX (3,900 since 2026-10-26 23:44 EDT), because a Components V2 message holds 4,000 characters of text and the delivery adds a Posted line; Discord's own Paragraph cap is 4,000.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('Announcement Text').setStyle(TextInputStyle.Paragraph).setMaxLength(require('../utils/announcement').ANNOUNCEMENT_TEXT_MAX).setValue(announcementDoc?.text || '').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('expiry').setLabel('Expires In (days, or "never")').setStyle(TextInputStyle.Short).setPlaceholder('Blank = 60 days').setValue(isEdit ? expiryToInputValue(announcementDoc.expiresAt) : '').setRequired(false)),
        // Added 2026-08-22 19:40 EDT (click-test fix) -- core/ops/announcements.js has validated/applied a real `startsAt` since the portal work landed, and utils/announcement.js's display query already withholds an unstarted announcement; only this modal never had a field to set one. Blank means "show now" on both Post and Edit -- same overwrite-not-merge convention `expiry` already uses, not a "leave unchanged" no-op.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('starts_at').setLabel('Starts On (blank = show now)').setStyle(TextInputStyle.Short).setPlaceholder('e.g. July 15').setValue(isEdit && announcementDoc.startsAt ? formatAdminDate(announcementDoc.startsAt) : '').setRequired(false))
    );
    return modal;
}

// --- NEXT SEASON DRAFT modal builders (2026-07-30 22:24 EDT) --- Same field shapes/parsers as their live equivalents above (splitTitleDate/parseAdminDate for titles+dates, parseBulkDrawList/parseBulkEvents for the bulk pastes) so handlers/manage/season.js's submit handlers can reuse the exact same parsing logic, just writing into `seasonalDoc.draft.*` instead of the top-level fields.
function buildDraftTitlesDatesModal(seasonalDoc) {
    const draft = seasonalDoc?.draft || {};
    const bpLine = [draft.bpTitle || 'Battle Pass', seasonDates(draft.bpStart, draft.bpEnd, draft.bpEndTBD)].filter(Boolean).join(', ');
    const rankLine = [draft.rankTitle || 'Ranked Series', seasonDates(draft.rankStart, draft.rankEnd, draft.rankEndTBD)].filter(Boolean).join(', ');
    const dmzLine = [draft.dmzTitle || 'DMZ Season', seasonDates(draft.dmzStart, draft.dmzEnd, draft.dmzEndTBD)].filter(Boolean).join(', ');

    const modal = new ModalBuilder().setCustomId('modal_draft_titles_dates').setTitle('Draft: Season Titles & Deadlines');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('main_title').setLabel('Main Season Title').setStyle(TextInputStyle.Short).setValue(withEmoji(draft.currentSeasonEmoji, draft.currentSeasonTitle)).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bp_line').setLabel('Battle Pass: Title, Start - End').setStyle(TextInputStyle.Short).setValue(bpLine).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('rank_line').setLabel('Ranked Series: Title, Start - End').setStyle(TextInputStyle.Short).setValue(rankLine).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('dmz_line').setLabel('DMZ Season: Title, Start - End').setStyle(TextInputStyle.Short).setValue(dmzLine).setRequired(false))
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

// The per-page dynamicData table, defined ONCE (v3-pre-release review, finding #44) -- the dropdown entry point (handlers/manage/shared.js's mng_pagesel handler, via the manageCommand module reference it's passed) and this file's own slash-option entry point below used to each hand-roll this same three-branch table. A page that gained a dynamic block and was added to only one copy rendered correctly from one entry point and empty from the other.
async function buildDynamicData(page) {
    const { loadSeasonalDoc } = require('../utils/manageActions');
    if (page === 'patchnotes') {
        return { pastSeasons: buildPastSeasonsOptions(await loadSeasonalDoc()) };
    }
    if (page === 'seasondraft') {
        return { draftStatus: buildDraftStatusText(await loadSeasonalDoc()) };
    }
    if (page === 'announcement') {
        const { getActiveAnnouncements } = require('../utils/announcement');
        return { announcementBlocks: buildAnnouncementListBlocks(await getActiveAnnouncements()) };
    }
    return {};
}

// Fills a modal's text inputs from typed values, by input id: how /manage's catalogue warning reopens the box someone just submitted (Back to edit) with everything they typed. A blank or missing value leaves the input as built.
function prefillModal(modal, values) {
    for (const row of modal.components || []) {
        // A raw Label (type 18) holds one input in `component`; the loadout pop-up is built that way (loadoutModal above). A file upload cannot be refilled, so the admin attaches it again.
        if (row.type === 18) {
            const input = row.component;
            const v = values?.[input?.custom_id];
            if (input?.type === 4 && typeof v === 'string' && v.length) input.value = v.slice(0, input.max_length || 4000);
            continue;
        }
        for (const input of row.components || []) {
            const id = input.data?.custom_id;
            const v = values?.[id];
            if (typeof v === 'string' && v.length) input.setValue(v.slice(0, input.data.max_length || 4000));
        }
    }
    return modal;
}

// ==========================================
// THE SLASH COMMAND: ONE SUBCOMMAND PER SECTION (2026-10-28 12:11 EDT, Harkirat: "give the other /manage panels their own subcommands: /manage draws, /manage gunsmiths mp, /manage gunsmiths dmz, etc.")
// ==========================================
// It was one command with a `content` choice option and an `action` autocomplete scoped by it (renamed `page` -> `section` -> `data_for` -> `content` over 2026-07-12 to 2026-08-15, each time because the name did not say what was being picked). A subcommand says it in the command itself, and the scoped autocomplete no longer needs a sibling option to know the section: the subcommand IS the section (SECTION_OF_SUBCOMMAND below; handlers/router.js's autocomplete reads it through sectionOf()).
//
// Each data section keeps `action` (autocomplete, opens one of that section's own actions straight away; stage 3 of the /manage decomposition, 2026-08-14) and `visibility` LAST (Hidden by default, as this panel always was). Season: Titles & Deadlines opens its pop-up and so takes no options; Guide and Emojis take only visibility. "Start New Season" still has NO subcommand on purpose: it is destructive enough that the extra step through the panel dropdown, with its warning description, is intended. The gunsmith group is spelled `gunsmiths` as he wrote it, unlike the public /gunsmith.
const SECTION_OF_SUBCOMMAND = {
    'draws': 'draws',
    'calendar': 'calendar',
    'patch-notes': 'patchnotes',
    'gunsmiths mp': 'loadouts_mp',
    'gunsmiths dmz': 'loadouts_dmz',
    'season titles': 'season_titlesdeadlines',
    'season draft': 'seasondraft',
    'announcement': 'announcement',
    'guide': 'guide',
    'emojis': 'emojis',
};

// The section a /manage invocation (or its autocomplete) is for, from its subcommand; null when it names none this table knows.
function sectionOf(interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand(false);
    if (!sub) return null;
    return SECTION_OF_SUBCOMMAND[group ? `${group} ${sub}` : sub] || null;
}

function buildManageCommandData() {
    const action = option => option.setName('action').setDescription("Jump straight to one of this section's own actions").setAutocomplete(true);
    const visibility = option => option.setName('visibility').setDescription('Show this panel only to you, or publicly to everyone in the chat. (Defaults to only you.)').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' });
    const section = (name, description, { withAction = true } = {}) => sub => {
        sub.setName(name).setDescription(description);
        if (withAction) sub.addStringOption(action);
        return sub.addStringOption(visibility);
    };
    return new SlashCommandBuilder()
        .setName('manage')
        // Trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) -- the old 68-char version truncated on Discord mobile's command picker row.
        .setDescription('Manage gunsmith builds and seasonal bot data')
        .setDefaultMemberPermissions(0)
        // ADMIN-ONLY: stays user-install [1] deliberately -- the 10 public commands moved to [0, 1] (guild install) for v3, but an admin command advertised in every server's command list is noise plus needless surface. Harkirat still reaches it anywhere via his own user install.
        .setIntegrationTypes([1]).setContexts([0, 1, 2])
        .addSubcommand(section('draws', 'New and returning draws'))
        .addSubcommand(section('calendar', 'Calendar events'))
        .addSubcommand(section('patch-notes', 'Season patch notes'))
        .addSubcommandGroup(group => group.setName('gunsmiths').setDescription('Gunsmith builds')
            .addSubcommand(section('mp', 'Multiplayer builds'))
            .addSubcommand(section('dmz', 'DMZ builds')))
        .addSubcommandGroup(group => group.setName('season').setDescription('Season settings')
            .addSubcommand(sub => sub.setName('titles').setDescription('Season titles and deadlines'))
            .addSubcommand(section('draft', 'Stage the next season')))
        .addSubcommand(section('announcement', 'Announcements'))
        // Jumps straight to the rich Bulk Format Guide (utils/manageGuides.js) instead of a normal data-entry page (2026-07-31 17:20 EDT, Harkirat). Not a key in PAGES (same reason Season's entries are not), so execute() special-cases it.
        .addSubcommand(section('guide', 'The bulk format guides', { withAction: false }))
        // The emoji panel (utils/emojiPanel.js), owner only: this was the /emojis command until 2026-10-28.
        .addSubcommand(section('emojis', 'Every bot\'s emojis (owner only)', { withAction: false }));
}

module.exports = {
    prefillModal,
    ALLOWED_ADMIN_ID, // Re-exported from utils/owner.js; nothing reads it off this module now (the panel-interaction guard in handlers/router.js gates through hasCommandAccess), so it is kept only as a harmless alias.
    data: buildManageCommandData(),

    // Getter, not a value: the table must be built per access so emoji ids are read after refreshEmojiIds() has run (see buildPagesTable). Don't destructure this at module load.
    get PAGES() { return buildPagesTable(); },
    PURGE_LABELS,
    buildManagePage,
    buildPastSeasonsOptions, buildDynamicData,
    buildSearchModal,
    buildBulkBothDrawsModal, buildBulkRemoveDrawsModal, buildAddDrawModal, buildEditDrawModal,
    buildCalendarBulkModal, buildCalendarBulkRemoveModal, buildCalendarAddModal, buildEditCalendarModal, buildCalendarBannersModal,
    buildLoadoutsBulkAddModal, buildLoadoutsBulkRemoveModal, buildAddLoadoutModal, buildEditLoadoutModal,
    buildLoadoutsExportUpTo5Modal, buildLoadoutsExportCategoryModal,
    sectionOf, SECTION_OF_SUBCOMMAND,
    // The dropdown alone, for the emoji panel (utils/emojiPanel.js), which sits outside the page table.
    buildPageSelectRow: (pageKey, { showEmojis = false, allowedPages = null } = {}) => pageSelectRow(buildPagesTable(), pageKey, allowedPages, showEmojis),
    buildPatchDateInfoModal, buildPatchUrlsModal, buildPatchAddSeasonModal, buildPatchEditSeasonModal,
    buildWipeSeasonModal, buildSeasonTitlesDeadlinesModal,
    buildDraftTitlesDatesModal, buildDraftBulkDrawsModal, buildDraftBulkCalendarModal, buildDraftStatusText,
    buildAnnouncementModal, buildAnnouncementListBlocks,

    async execute(interaction) {
        const { hasCommandAccess } = require('../utils/adminAccess');
        if (!(await hasCommandAccess(interaction.user.id, 'manage'))) {
            // Reworded 2026-07-18 (v2 quick-wins batch) -- matches the identical reword of handlers/router.js's centralized button/select/modal guard for this same panel (see interactionCreate).
            return interaction.reply({ content: "🔒 **This one's admin-only.** These buttons run Dioreo's database directly — try any of the bot's public commands instead!", ephemeral: true });
        }
        // Every admin may open every section (the permission restructure, 2026-10-19 19:25 EDT); what they may DO there is checked per button by resolveAction's tier check, and again by core/changeset.js's commitSet on the write.
        const section = sectionOf(interaction) || 'draws';

        // The emoji panel (utils/emojiPanel.js), private or public like this command (2026-10-28 12:11 EDT). It answers its own deferral, so it runs before the deferReply() below. Owner only, checked inside.
        if (section === 'emojis') {
            const visibilityChoice = interaction.options.getString('visibility');
            return require('../utils/emojiPanel').openEmojiPanel(interaction, { ephemeral: visibilityChoice !== 'public' });
        }

        // Season: Titles & Deadlines is reachable directly from this option now (2026-07-12) — skips rendering the panel entirely, same as picking it from the in-panel mng_pagesel dropdown does. showModal() must be the FIRST response to the interaction (can't follow a deferReply()), so this has to branch before the deferReply() below runs at all.
        if (section === 'season_titlesdeadlines') {
            // Opens its pop-up straight away, so it is gated like the button it is (create on Season).
            const { resolvePopupEntry } = require('../utils/manageActions');
            const gate = await resolvePopupEntry(section, interaction.user.id);
            if (!gate.ok) return interaction.reply({ content: gate.message, ephemeral: true });
            // Shared lookup, not a hand-rolled one (v3-pre-release review, finding #38).
            const { loadSeasonalDoc } = require('../utils/manageActions');
            const seasonalDoc = await loadSeasonalDoc();
            return interaction.showModal(buildSeasonTitlesDeadlinesModal(seasonalDoc));
        }

        // Stage 3 (2026-08-14 18:04 EDT) -- action: opens one of the section's own actions directly. Must run BEFORE deferReply(): a kind:'modal' entry's run() calls showModal(), which has to be the interaction's FIRST response (same constraint season_titlesdeadlines works around above). Mirrors handlers/manage/index.js's mng_act_ button dispatch exactly -- resolveAction() is the one choke point (it also re-checks the per-page permission just verified above, so a scoped admin can't reach another section's action by typing its id directly) and run() is trusted to manage its OWN response completely: kind:'file' calls reply(), kind:'view' defers itself, kind:'modal' shows a modal. Do NOT deferReply() before calling it -- a kind:'file' entry's run() calls interaction.reply(), which throws if this has already acknowledged.
        let actionFallbackNote = '';
        const actionId = interaction.options.getString('action');
        if (actionId) {
            const { resolveAction, DENIAL_MESSAGE } = require('../utils/manageActions');
            const resolved = await resolveAction(section, actionId, interaction.user.id);
            // resolveAction() only checks ownership/page-scope permission -- it does NOT check `slash`, because the button dispatch (handlers/manage/index.js) never needed to: a button's custom_id can only ever be one a page actually rendered. This IS the slash path, so it is the one caller that must enforce `slash` itself -- without this, Discord's autocomplete never SUGGESTING a confirm-kind id (purge/wipe/promote/discard) is not the same as REJECTING one a user types directly; autocomplete suggestions are not server-enforced. Treated as 'unknown' below so this never confirms a hidden action exists, matching the registry's "destructive actions stay panel-only" rule.
            if (resolved.ok && resolved.entry.slash) {
                return await resolved.entry.run({
                    interaction,
                    page: section,
                    manageCommand: interaction.client.commands.get('manage')
                });
            }
            if (resolved.ok && !resolved.entry.slash) resolved.reason = 'unknown';
            // An unknown/unpermitted action falls through to the normal page render below with a short note instead of erroring out the whole invocation -- a typo shouldn't cost the page the user actually asked for. (guide/season_titlesdeadlines have no registry entries at all, so a stray action there also resolves 'unknown' and is silently dropped on the guide/modal branches below -- not worth threading the note through two more send sites for an edge case autocomplete never suggests in the first place.)
            actionFallbackNote = `${resolved.message || DENIAL_MESSAGE[resolved.reason]}\n\n`;
        }

        // Default ephemeral (true) unless explicitly set to public — matches the "default private" convention Harkirat asked for on this specific command (most commands default public; this one is the admin panel, so it flips the default, as /help, /bot and /autobuild also do).
        const visibilityChoice = interaction.options.getString('visibility');
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
        await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        // Bulk Format Guide, reached directly (2026-07-31 17:20 EDT) -- sends the SAME rich guide panel the in-page "Guide" buttons open (utils/manageGuides.js), skipping the normal page-panel render entirely. Defaults to the Draws topic (first in the dropdown) -- there's no page context to infer a topic from when jumping straight here via the slash option. Read-only reference material, not data-mutating -- available to any admin (guaranteed by the hasCommandAccess check above), not gated per-page like the real data pages below.
        if (section === 'guide') {
            const { buildGuideContainer } = require('../utils/manageGuides');
            return sendV2Payload(interaction, buildGuideContainer('draws'));
        }

        // buildDynamicData(), not a hand-rolled table (v3-pre-release review, finding #44) -- only fetched when actually landing on a page that needs it; every other page renders from PAGES alone.
        const dynamicData = await buildDynamicData(section);
        return sendV2Payload(interaction, buildManagePage(section, dynamicData, interaction.client, null, { showEmojis: require('../utils/owner').isOwnerId(interaction.user.id) }), { content: actionFallbackNote });
    }
};
