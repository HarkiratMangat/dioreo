// ==========================================
// COMMAND: BALANCE PATCH NOTES CAROUSEL
// ==========================================
// ARCHITECTURE: Subcommands (/patch notes). Leverages Discord's native V2 Media Carousel Component (Type 12) to create swipable image galleries.

const { SlashCommandBuilder } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
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

// Resolves a patch entry's actual displayed title -- `titleOverride` (2026-07-24, /manage "Add New Season"/"Past Seasons") wins when set (an admin-typed placeholder, e.g. patch notes released before the new season's real name is announced), otherwise falls back to the auto-synced `title`. Every display site (here, handlers/router.js's autocomplete, the manage-panel dropdown) should call this instead of reading `patch.title` directly, so the override can never be silently ignored somewhere.
function displayTitle(patch) {
    return cleanPatchTitle(patch.titleOverride || patch.title);
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

function buildContainer(seasonalDoc, patchId = null, accentColor = PRESET_ACCENT, isEphemeral = false) {
    // Array Trimming: Prevent dropdown menu overload by grabbing only the 5 most recent records
    const recentPatches = seasonalDoc.patchNotes.slice(-5).reverse();

    // Determine target state: Either the user-requested ID or the latest default entry
    const activePatch = patchId
        ? seasonalDoc.patchNotes.find(p => p._id.toString() === patchId)
        : recentPatches[0];

    const releaseUnix = Math.floor(new Date(activePatch.releaseDate).getTime() / 1000);

    // Map raw Cloudinary Strings into the Type 12 Media Array standard
    const carouselItems = activePatch.images.map(imgUrl => ({ media: { url: imgUrl } }));

    // NOTE (redesigned during review): activePatch.title now holds just the season # & name (e.g. "Season 6: Take Your Heart") rather than a full "Balance Changes for..." string. Two-line title (season/patch name on top, command header below) — shared pattern, matches the calendar_update_ui.json redesign; see utils/titleBlock.js. Older entries that still have the full legacy sentence stored get it stripped by cleanPatchTitle() rather than rendering "Balance Changes — Balance Changes for...".
    const cleanTitle = displayTitle(activePatch);
    // Layout reordered per the notes file (2026-07-31 12:10 EDT): the release-timestamp line moved from right under the title to right under the images (same "section" as the carousel now), and a permanent "subject to change" disclaimer was added to the Additional Info section. Dividing up JUST that disclaimer alone when nothing else was typed felt wrong (Harkirat's own call), so the divider before Additional Info is conditional on real typed info existing -- with none, the disclaimer rides directly under the title with no divider of its own.
    const SUBJECT_TO_CHANGE_DISCLAIMER = '-# NOTE: Final patch notes are subject to change';
    const hasInfo = activePatch.description && activePatch.description.trim().length > 0;

    const components = [
        // headingLevel 2 (`## `, was `# `) for design consistency with /draw prices' own drop -- 2026-07-12, Harkirat's request to keep all seasonal command titles at the same size.
        buildTitleBlock(cleanTitle, emojis.patchNotes, 'Balance Changes', 2)
    ];

    if (hasInfo) {
        components.push(
            { type: 14, spacing: 2, divider: true },
            { type: 10, content: `${formatAdditionalInfo(activePatch.description)}\n${SUBJECT_TO_CHANGE_DISCLAIMER}` }
        );
    } else {
        components.push({ type: 10, content: SUBJECT_TO_CHANGE_DISCLAIMER });
    }

    components.push(
        { type: 14, spacing: 2, divider: true },
        { type: 12, items: carouselItems }, // NATIVE MEDIA CAROUSEL INJECTION
        { type: 10, content: `-# Patch notes released on <t:${releaseUnix}:f>` },
        { type: 14, spacing: 2, divider: true },
        { type: 10, content: `-# Select from the list below to view **previous balance changes**` }
    );

    const containerPayload = {
        type: 17,
        accent_color: accentColor,
        components: components
    };

    // Build historical dropdown options
    const historyOptions = recentPatches.map((patch, index) => ({
        label: displayTitle(patch),
        value: `patch_${patch._id}`,
        default: activePatch._id.toString() === patch._id.toString() // Pre-select current view
    }));

    // NOTE (added during review): a select menu (type 3) must still be wrapped in an Action Row (type 1), even inside a V2 Container (type 17) — pushing it directly into the container's components array is the same bug we already fixed once in drawprices.js. It crept back in here during the Gemini session.
    containerPayload.components.push({
        type: 1,
        components: [{
            type: 3, custom_id: "select_patch_history", placeholder: "View Previous Seasons...", options: historyOptions
        }]
    });

    const globalNavigationRow = buildGlobalNavRow('nav_patchnotes');

    return withShareButton([containerPayload, globalNavigationRow], isEphemeral);
}

module.exports = {
    cleanPatchTitle,
    displayTitle,
    formatAdditionalInfo,

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
            return interaction.followUp({ content: '❌ No patch notes have been logged in the database yet.' });
        }

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(seasonalDoc, targetPatchId, accentColor, isEphemeral);

        return await sendV2Payload(interaction, components);
    }
};