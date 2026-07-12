// ==========================================
// COMMAND: BALANCE PATCH NOTES CAROUSEL
// ==========================================
// ARCHITECTURE: Subcommands (/patch notes). Leverages Discord's native V2 Media Carousel 
// Component (Type 12) to create swipable image galleries.

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

// Repalette (2026-07-12, Section 5 of the batch) -- see calendar.js's matching comment for the
// full nav-row hue-spread reasoning. Pulled directly from the "Leakers on Duty" reference graphic
// Harkirat pointed at (the community's own patch-notes-reveal image format) rather than invented
// from scratch -- its headline text uses this exact gold.
const PRESET_ACCENT = 15909424; // Patch Gold (#F2C230) — 4th nav button (Patch Notes)

// Entries created before the "Balance Changes — " prefix was moved into the heading (see below)
// still have the full old sentence baked into their stored title. Strip it back off at display
// time so both the heading and the history dropdown always show just the bare season name,
// regardless of which format a given entry happens to have been saved with.
function cleanPatchTitle(title) {
    return title.replace(/^balance changes for\s*/i, '').trim();
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

    // NOTE (redesigned during review): activePatch.title now holds just the season # & name
    // (e.g. "Season 6: Take Your Heart") rather than a full "Balance Changes for..." string.
    // Two-line title (season/patch name on top, command header below) — shared pattern, matches
    // the calendar_update_ui.json redesign; see utils/titleBlock.js. Older entries that still have
    // the full legacy sentence stored get it stripped by cleanPatchTitle() rather than rendering
    // "Balance Changes — Balance Changes for...".
    const cleanTitle = cleanPatchTitle(activePatch.title);
    const components = [
        // headingLevel 2 (`## `, was `# `) for design consistency with /draw prices' own drop --
        // 2026-07-12, Harkirat's request to keep all seasonal command titles at the same size.
        buildTitleBlock(cleanTitle, emojis.patchNotes, 'Balance Changes', 2),
        { type: 10, content: `-# Patch notes released on <t:${releaseUnix}:f>` }
    ];

    // Optional additional info section — completely omitted (no placeholder text) when blank
    if (activePatch.description && activePatch.description.trim().length > 0) {
        components.push({ type: 10, content: activePatch.description });
    }

    components.push(
        { type: 14, spacing: 2, divider: true },
        { type: 12, items: carouselItems }, // NATIVE MEDIA CAROUSEL INJECTION
        { type: 14, spacing: 2, divider: true },
        { type: 10, content: `-# Select from the list below to view previous balance changes` }
    );

    const containerPayload = {
        type: 17,
        accent_color: accentColor,
        components: components
    };

    // Build historical dropdown options
    const historyOptions = recentPatches.map((patch, index) => ({
        label: cleanPatchTitle(patch.title),
        value: `patch_${patch._id}`,
        default: activePatch._id.toString() === patch._id.toString() // Pre-select current view
    }));

    // NOTE (added during review): a select menu (type 3) must still be wrapped in an Action Row
    // (type 1), even inside a V2 Container (type 17) — pushing it directly into the container's
    // components array is the same bug we already fixed once in drawprices.js. It crept back in
    // here during the Gemini session.
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

    // COMMAND DEFINITION: Base 'patch', Subcommand 'notes'
    data: new SlashCommandBuilder()
        .setName('patch')
        .setDescription('Balance adjustments and updates')
        .addSubcommand(sub => sub
            .setName('notes')
            .setDescription('View the latest weapon balance changes!')
            .addStringOption(option => option.setName('version').setDescription('Search for specific previous patch notes').setAutocomplete(true))
            .addBooleanOption(option => option.setName('private').setDescription('Hide this response so only you can see it')))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    buildContainer,

    async execute(interaction, internalPatchId = null) {
        const userId = interaction.user.id;
        // NOTE (added during review): kicked off alongside `prefs` instead of after it -- doesn't
        // depend on prefs at all, so it resolves concurrently with the deferReply() ack below
        // rather than only starting once that's done. Only `prefs` is actually awaited before
        // deferReply (keeps the 3-second ack window fast). .lean() since this doc is only ever
        // read here, never saved.
        const prefsPromise = UserPreference.findOne({ discordId: userId });
        const seasonalDocPromise = SeasonalData.findOne({ docType: 'global' }).lean();
        const prefs = await prefsPromise;

        let argPrivate = null;
        let targetPatchId = internalPatchId;

        // Extract autocomplete values
        if (interaction.isChatInputCommand()) {
            argPrivate = interaction.options.getBoolean('private');
            const searchId = interaction.options.getString('version');
            if (searchId) targetPatchId = searchId;
        }

        // NOTE: switched from the old per-command `patchnotesVisibility` field to the shared
        // `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in
        // /settings (Option A).
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