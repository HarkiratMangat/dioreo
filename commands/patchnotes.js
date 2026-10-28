// ==========================================
// COMMAND: BALANCE PATCH NOTES CAROUSEL
// ==========================================
// ARCHITECTURE: Subcommands (/patch notes). Leverages Discord's native V2 Media Carousel Component (Type 12) to create swipable image galleries.

const BOT_EMOJI = require('../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { SlashCommandBuilder } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { splitSeasonEmoji, seasonEmojiFor, withCaptionEmoji } = require('../utils/seasonEmoji');
const { fuzzyMatch } = require('../utils/search');
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Repalette (2026-07-12, Section 5 of the batch) -- see calendar.js's matching comment for the full nav-row hue-spread reasoning. Pulled directly from the "Leakers on Duty" reference graphic Harkirat pointed at (the community's own patch-notes-reveal image format) rather than invented from scratch -- its headline text uses this exact gold.
const PRESET_ACCENT = 15909424; // Patch Gold (#F2C230) — 4th nav button (Patch Notes)

// Entries created before the "Balance Changes — " prefix was moved into the heading (see below) still have the full old sentence baked into their stored title. Strip it back off at display time so both the heading and the history dropdown always show just the bare season name, regardless of which format a given entry happens to have been saved with.
function cleanPatchTitle(title) {
    return title.replace(/^balance changes for\s*/i, '').trim();
}

// Resolves a patch entry's actual displayed title -- `titleOverride` (2026-07-24, /manage "Add New Season"/"Past Seasons") wins when set (an admin-typed placeholder, e.g. patch notes released before the new season's real name is announced), otherwise falls back to the auto-synced `title`. Every display site (here, handlers/router.js's autocomplete, the manage-panel dropdown) should call this instead of reading `patch.title` directly, so the override can never be silently ignored somewhere. An emoji typed in front of a patch entry's own title is left out of the title (2026-10-19 09:30 EDT): a select option's label is plain text and would show its raw <a:name:id>. seasonEmoji() below picks it up instead.
function displayTitle(patch) {
    return cleanPatchTitle(splitSeasonEmoji(patch.titleOverride || patch.title).title);
}

// Buff/nerf/fix shorthand for the additional-info field (2026-07-30 22:24 EDT, per Harkirat's request; "f:" fix alias added 2026-08-08 00:22 EDT) -- typing a standalone "b:"/"n:"/"f:" token gets swapped for the buff/nerf/fix emoji. Read INSIDE this function (render time), not captured into a module-level string -- emojiMap's ids get rewritten in place by refreshEmojiIds() on the dev bot, and anything that reads emojis.x at require time freezes the pre-sync prod id (see rendering-and-ui.md's emoji-capture rule). Word-boundary guarded (start-of-line/whitespace before, nothing glued on after the colon) so this only fires on the alias itself, not on a URL or some other "b:"/"n:"/"f:" substring inside real prose.
function applyInfoAliases(text) {
    return text
        .replace(/(^|[\s\n])b:/gi, (_, pre) => `${pre}${emojis.buff}`)
        .replace(/(^|[\s\n])n:/gi, (_, pre) => `${pre}${emojis.nerf}`)
        .replace(/(^|[\s\n])f:/gi, (_, pre) => `${pre}${emojis.fix}`);
}

// Additional Info auto-formatting (added 2026-07-31 17:20 EDT, the notes file's ∴ follow-up reply; PARSER REWRITTEN same day, direct correction) -- renders into Harkirat's decided output structure (his own reference screenshot, `local/Screenshots/CleanShot 2026-07-31 at 11.38.34@2x.png`): a `### ADDITIONAL CHANGES` heading (all-caps, added 2026-08-08 00:23 EDT per Harkirat's request), `__**Weapon**__` per weapon, its attachment name(s) as plain lines, and each change as `> {buff/nerf/fix emoji} details`.
//
// The FIRST version of this parser required every weapon/attachment/change on its OWN physical line -- which directly caused a real submission mistake (a comma-separated one-liner got read as a single giant weapon name). Harkirat's direct correction: match the SAME comma-delimited mental model draws/calendar bulk imports already use -- one weapon's ENTIRE block is one line, comma- separated; only a NEW weapon needs its own line.
//
// OPT-IN, not a format change to every entry -- only triggers when the admin actually uses the new `# Weapon Name` line marker. With no `#` line anywhere, this is a no-op beyond the existing b:/n:/f: alias, so every pre-existing free-typed entry (most of them are just a one-line blurb) keeps rendering exactly as it always has.
//
// Grammar, once at least one `#` line is present:
//   `# Weapon, Attachment, n:/b:/f: text, n:/b:/f: text2, Attachment2, n:/b:/f: text3` -- ONE line,
//   comma-separated. First segment (after `#`) is the weapon name. Every segment after that is
//   EITHER a new attachment name, or -- if it starts with `b:`/`n:`/`f:` -- a change line under
//   whichever attachment came most recently in THIS line. A new plain (non-b:/n:/f:) segment always
//   starts a new attachment, so any number of attachments/changes can ride on one weapon's line.
//   A plain NEWLINE (a new `# ` line) starts the next weapon -- weapons are never comma-joined with
//   each other. Lines typed BEFORE the first `#` marker are kept as free prose above the structured
//   block, not discarded.
function formatAdditionalInfo(text) {
    const raw = (text || '').trim();
    if (!raw) return '';
    const lines = raw.split('\n');
    const hasWeaponMarker = lines.some(l => /^#\s*\S/.test(l.trim()));
    if (!hasWeaponMarker) return applyInfoAliases(raw);

    const preambleLines = [];
    const weaponBlocks = [];
    let seenWeapon = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const weaponMatch = line.match(/^#\s*(.+)$/);
        if (!weaponMatch) {
            if (!seenWeapon) { preambleLines.push(line); continue; }
            // A stray non-`#` line after weapons have already started -- graceful degradation (kept verbatim, alias-applied) rather than dropped or crashed on.
            weaponBlocks.push(applyInfoAliases(line));
            continue;
        }
        seenWeapon = true;

        const segments = weaponMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        const weaponName = segments.shift();
        const attachments = []; // { name, changes: [] }
        let currentAttachment = null;
        for (const seg of segments) {
            const changeMatch = seg.match(/^(b|n|f):\s*(.+)$/i);
            if (changeMatch && currentAttachment) {
                const prefix = changeMatch[1].toLowerCase();
                const emoji = prefix === 'b' ? emojis.buff : prefix === 'n' ? emojis.nerf : emojis.fix;
                currentAttachment.changes.push(`> ${emoji} ${changeMatch[2].trim()}`);
                continue;
            }
            // Anything else (including a stray b:/n: segment with no attachment yet -- graceful degradation, not a crash: it just becomes an oddly-named attachment the admin will immediately notice and fix) starts a new attachment under this weapon.
            currentAttachment = { name: seg, changes: [] };
            attachments.push(currentAttachment);
        }

        const attachmentLines = attachments.map(a => [a.name, ...a.changes].join('\n')).join('\n');
        weaponBlocks.push(`__**${weaponName}**__\n${attachmentLines}`);
    }

    const parts = [];
    if (preambleLines.length) parts.push(applyInfoAliases(preambleLines.join('\n')));
    parts.push(`### ADDITIONAL CHANGES\n${weaponBlocks.join('\n')}`);
    return parts.join('\n\n');
}

// A season's own emoji (2026-10-19 00:30 EDT, Harkirat), picked by the season number in its title; a title with no number, or a season with no emoji yet, gets none. The emoji synced onto the entry from /manage's season title wins, then one typed in front of the entry's own title (2026-10-19 09:30 EDT); utils/seasonEmoji.js holds the rule.
function seasonEmoji(patch) {
    const typed = splitSeasonEmoji(patch.titleOverride || patch.title).emoji;
    return seasonEmojiFor(displayTitle(patch), patch.emoji || typed);
}

// The Leakers on Duty Discord, as their own watermark gives it (2026-10-19 09:36 EDT).
const LEAKERS_ON_DUTY_URL = 'https://discord.gg/nicecat';

// EVERY SEASON IS KEPT (2026-10-19 00:30 EDT, Harkirat, superseding "only the previous 5"): the dropdown lists the 12 newest, and Search Older Seasons (a pop-up, past 12) finds any other. A select holds 25 options, so 12 leaves room for the open season when it is older.
const HISTORY_SHOWN = 12;

// The newest season whose title matches what was typed: a bare number matches "Season N" exactly, anything else the same fuzzy match as the slash command's season search.
function findPatchByQuery(patchNotes, query) {
    const q = String(query || '').trim();
    if (!q) return null;
    const newest = (patchNotes || []).slice().reverse();
    const num = /^\D*?(\d+)\D*$/.exec(q);
    if (num) {
        const hit = newest.find(p => new RegExp(`season\\s*${num[1]}\\b`, 'i').test(displayTitle(p)));
        if (hit) return hit;
    }
    return newest.find(p => fuzzyMatch(q, displayTitle(p))) || null;
}

function buildSearchModal() {
    return {
        custom_id: 'patch_search_submit', title: 'Search Seasons',
        components: [{ type: 18, label: 'Season Name or Number', component: { type: 4, custom_id: 'q', style: 1, required: true, max_length: 60, placeholder: 'e.g. 7 or Terminated' } }]
    };
}

// Discord holds one message's Text Displays to 4,000 characters in total (COMPONENT_DISPLAYABLE_TEXT_SIZE_EXCEEDED -- .claude/rules/draw-prices.md). The Additional Info box has no length limit and its b:/n: shorthand expands into ~35-character emojis, so a long one could stop /patch rendering that season at all (2026-10-20, v3 sweep). It is cut at a line break inside this budget, which leaves the rest of the 4,000 for the title, disclaimer and source lines.
const INFO_TEXT_BUDGET = 3400;
function clampInfoText(text) {
    if (text.length <= INFO_TEXT_BUDGET) return text;
    const NOTE = '\n-# …the rest of these notes is too long to show here.';
    const room = INFO_TEXT_BUDGET - NOTE.length;
    const cut = text.lastIndexOf('\n', room);
    return text.slice(0, cut > 0 ? cut : room) + NOTE;
}

function buildContainer(seasonalDoc, patchId = null, accentColor = PRESET_ACCENT, isEphemeral = false) {
    const newestFirst = seasonalDoc.patchNotes.slice().reverse();
    const recentPatches = newestFirst.slice(0, HISTORY_SHOWN);

    // Determine target state: the requested entry, else the newest (also when the requested one is gone).
    const activePatch = (patchId && seasonalDoc.patchNotes.find(p => p._id.toString() === patchId)) || newestFirst[0];

    const releaseUnix = Math.floor(new Date(activePatch.releaseDate).getTime() / 1000);

    // Map raw Cloudinary Strings into the Type 12 Media Array standard. Blank entries are skipped and a season with no images gets no gallery (2026-10-19 10:32 EDT): Discord rejects a gallery item without a URL, and a gallery with no items, so either one failed the whole command. Found click-testing Add to Patch Notes, after a dev-bot save had stored nulls.
    const carouselItems = (activePatch.images || []).filter(Boolean).map(imgUrl => ({ media: { url: imgUrl } }));

    // NOTE (redesigned during review): activePatch.title now holds just the season # & name (e.g. "Season 6: Take Your Heart") rather than a full "Balance Changes for..." string. Two-line title (season/patch name on top, command header below) — shared pattern, matches the calendar_update_ui.json redesign; see utils/titleBlock.js. Older entries that still have the full legacy sentence stored get it stripped by cleanPatchTitle() rather than rendering "Balance Changes — Balance Changes for...".
    const cleanTitle = displayTitle(activePatch);
    // Layout reordered per the notes file (2026-07-31 12:10 EDT): the release-timestamp line moved from right under the title to right under the images (same "section" as the carousel now), and a permanent "subject to change" disclaimer was added to the Additional Info section. Dividing up JUST that disclaimer alone when nothing else was typed felt wrong (Harkirat's own call), so the divider before Additional Info is conditional on real typed info existing -- with none, the disclaimer rides directly under the title with no divider of its own.
    const SUBJECT_TO_CHANGE_DISCLAIMER = '-# NOTE: Final patch notes are subject to change';
    const hasInfo = activePatch.description && activePatch.description.trim().length > 0;

    const components = [
        // headingLevel 2 (`## `, was `# `) for design consistency with /draw prices' own drop -- 2026-07-12, Harkirat's request to keep all seasonal command titles at the same size.
        buildTitleBlock(cleanTitle, emojis.patchNotes, 'Balance Changes', 2)
    ];
    // The season's emoji sits in front of its name, outside the bold-italic lettering (which would mangle an emoji).
    withCaptionEmoji(components[0], seasonEmoji(activePatch));
    // The reminders bell on the title (utils/reminders.js withBell), added after the caption emoji, which edits the text in place.
    components.splice(0, 1, ...require('../utils/reminders').withBell(components[0]));

    if (hasInfo) {
        components.push(
            { type: 14, spacing: 2, divider: true },
            { type: 10, content: `${clampInfoText(formatAdditionalInfo(activePatch.description))}\n${SUBJECT_TO_CHANGE_DISCLAIMER}` }
        );
    } else {
        components.push({ type: 10, content: SUBJECT_TO_CHANGE_DISCLAIMER });
    }

    components.push(
        { type: 14, spacing: 2, divider: true },
        ...(carouselItems.length ? [{ type: 12, items: carouselItems }] : []), // NATIVE MEDIA CAROUSEL INJECTION
        // Credit where the content is shown (2026-10-19 09:39 EDT, Harkirat: "let's just do it for good faith"): Leakers on Duty publish under CC BY, which asks for attribution in the medium, and their watermark does not come along when the content is retyped. NOTICE §4A.4 carries the full credit.
        //
        // The release DATE only, `:D` ("September 23, 2026"), in each reader's own locale; the time of day was dropped (2026-10-19 15:27 EDT, Harkirat: "lets remove the time from the patch notes 'released' timestamp"). It rides at the end of the credit line, with no "Patch notes released on" line of its own (2026-10-21 11:39 EDT, Harkirat: "remove patch note's \"Patch notes released on\" and just put the date after the \"Source: Leakers on Duty <timestamp>\""), with a ` · ` between them (2026-10-21 11:50 EDT, his "dot is fine, use it" after a mock-up).
        { type: 10, content: `-# Source: [Leakers on Duty](${LEAKERS_ON_DUTY_URL}) · <t:${releaseUnix}:D>` },
        { type: 14, spacing: 2, divider: true },
        { type: 10, content: `-# View **previous balance changes**` }
    );

    const containerPayload = {
        type: 17,
        accent_color: accentColor,
        components: components
    };

    // Build historical dropdown options A season opened from search that is older than the 12 shown joins the list, so the dropdown still shows it picked.
    const listed = recentPatches.some(p => p._id.toString() === activePatch._id.toString()) ? recentPatches : [...recentPatches, activePatch];
    // Each season's dates as its description (2026-10-25 14:45-15:09 EDT, Harkirat's review): the newest reads "Current Season" (his pick B); an older one runs from its own release date to the next season's ("Aug 25 – Sep 23, 2026"), the only dates a past season has.
    const shortDate = (d, withYear) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' });
    const seasonRange = (patch) => {
        const at = newestFirst.findIndex(p => p._id.toString() === patch._id.toString());
        if (at === 0) return 'Current Season';
        const start = patch.releaseDate, end = newestFirst[at - 1]?.releaseDate;
        if (!start || !end) return null;
        const sameYear = new Date(start).getUTCFullYear() === new Date(end).getUTCFullYear();
        return `${shortDate(start, !sameYear)} – ${shortDate(end, true)}`;
    };
    const historyOptions = listed.map(patch => ({
        label: displayTitle(patch),
        value: `patch_${patch._id}`,
        ...(seasonRange(patch) ? { description: seasonRange(patch) } : {}),
        ...(seasonEmoji(patch) ? { emoji: emojis.parseEmoji(seasonEmoji(patch)) } : {}),
        default: activePatch._id.toString() === patch._id.toString() // Pre-select current view
    }));

    // NOTE (added during review): a select menu (type 3) must still be wrapped in an Action Row (type 1), even inside a V2 Container (type 17) — pushing it directly into the container's components array is the same bug we already fixed once in drawprices.js. It crept back in here during the Gemini session.
    containerPayload.components.push({
        type: 1,
        components: [{
            type: 3, custom_id: "select_patch_history", placeholder: "View Previous Seasons...", options: historyOptions
        }]
    });
    if (seasonalDoc.patchNotes.length > HISTORY_SHOWN) {
        containerPayload.components.push({ type: 1, components: [{ type: 2, style: 2, label: 'Search Older Seasons', custom_id: 'patch_search_open' }] });
    }

    const globalNavigationRow = buildGlobalNavRow('nav_patchnotes');

    return withShareButton([containerPayload, globalNavigationRow], isEphemeral);
}

module.exports = {
    cleanPatchTitle,
    displayTitle,
    formatAdditionalInfo,
    clampInfoText,
    INFO_TEXT_BUDGET,
    seasonEmoji,
    findPatchByQuery,
    buildSearchModal,
    HISTORY_SHOWN,

    // COMMAND DEFINITION: Base 'patch', Subcommand 'notes'
    data: new SlashCommandBuilder()
        .setName('patch')
        .setDescription('Balance adjustments and updates')
        .addSubcommand(sub => sub
            .setName('notes')
            .setDescription('View the latest weapon balance changes')
            .addStringOption(option => option.setName('season').setDescription('Search for a specific previous season').setAutocomplete(true))
            .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    buildContainer,

    async execute(interaction, internalPatchId = null) {
        const userId = interaction.user.id;
        // NOTE (added during review): kicked off alongside `prefs` instead of after it -- doesn't depend on prefs at all, so it resolves concurrently with the deferReply() ack below rather than only starting once that's done. Only `prefs` is actually awaited before deferReply (keeps the 3-second ack window fast). .lean() since this doc is only ever read here, never saved.
        const prefsPromise = UserPreference.findOne({ discordId: userId });
        const seasonalDocPromise = SeasonalData.findOne({ docType: 'global' }).lean();
        const prefs = await prefsPromise;

        let argPrivate = null;
        let targetPatchId = internalPatchId;

        // Extract autocomplete values
        if (interaction.isChatInputCommand()) {
            const visibilityChoice = interaction.options.getString('visibility');
            argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
            const searchId = interaction.options.getString('season');
            if (searchId) targetPatchId = searchId;
        }

        // NOTE: switched from the old per-command `patchnotesVisibility` field to the shared `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in /settings (Option A).
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const seasonalDoc = await seasonalDocPromise;

        if (!seasonalDoc || !seasonalDoc.patchNotes || seasonalDoc.patchNotes.length === 0) {
            return require('../utils/ephemeral').privateNotice(interaction, BOT_EMOJI.cross + ' No patch notes have been logged in the database yet.');
        }

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(seasonalDoc, targetPatchId, accentColor, isEphemeral);

        return await sendV2Payload(interaction, components);
    }
};