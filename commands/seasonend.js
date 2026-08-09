// ==========================================
// COMMAND: SEASON END DEADLINES
// ==========================================
// ARCHITECTURE: Uses Subcommands (/season end) to bypass Discord's space restrictions.
// Features dynamic, editable titles fetched from the MongoDB global document.

const { SlashCommandBuilder } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Repalette (2026-07-12, Section 5 of the batch) -- see calendar.js's matching comment for the
// full nav-row hue-spread reasoning. A warm sunset amber -- fitting for "a season ending" -- that
// also pairs as an analogous warm neighbor to Patch Notes' gold one slot over, closing out the
// nav row's cool-to-warm progression.
const PRESET_ACCENT = 15898954; // Neon Amber (#F2994A) — 5th nav button (Season End)

module.exports = {
    // COMMAND DEFINITION: Base command 'season' with subcommand 'end'
    data: new SlashCommandBuilder()
        .setName('season')
        .setDescription('Seasonal countdowns and details')
        .addSubcommand(sub => sub
            .setName('end')
            // Trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) -- was truncating on mobile.
            .setDescription('Check countdowns for when this season ends')
            .addStringOption(option =>
                option.setName('visibility')
                    .setDescription('Show this response only to you, or publicly to everyone in the chat.')
                    .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    async execute(interaction) {
        const userId = interaction.user.id;

        // 1. VISIBILITY RESOLUTION: Check for local command override first, fallback to DB preference
        // NOTE (added during review): the countdown doc is kicked off alongside `prefs` instead of
        // after it -- doesn't depend on prefs at all, so it resolves concurrently with the
        // deferReply() ack below rather than only starting once that's done. Only `prefs` is
        // actually awaited before deferReply (keeps the 3-second ack window fast). .lean() since
        // this doc is only ever read here, never saved.
        const prefsPromise = UserPreference.findOne({ discordId: userId });
        const seasonalDocPromise = SeasonalData.findOne({ docType: 'global' }).lean();
        const prefs = await prefsPromise;
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
        // NOTE: switched from the old per-command `seasonendVisibility` field to the shared
        // `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in
        // /settings (Option A — one switch controls Season End/Draws/Patch Notes/Calendar/Draw
        // Prices together, per user's decision).
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });

        // 2. MODERN DEFERRAL: Use bitwise flag 64 for ephemeral, 0 for public
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        // 3. DATABASE FETCH: Retrieve the global countdown dates
        const seasonalDoc = await seasonalDocPromise;

        // Helper function to safely convert JS Dates to Discord UNIX seconds
        const getUnix = (dateObj) => dateObj ? Math.floor(new Date(dateObj).getTime() / 1000) : null;

        const bpUnix = getUnix(seasonalDoc?.bpEnd);
        const rankUnix = getUnix(seasonalDoc?.rankEnd);
        const dmzUnix = getUnix(seasonalDoc?.dmzEnd);

        // 4. PAYLOAD CONSTRUCTION: Utilizing Section Containers (Type 17)
        // Uses fallback strings ('Battle Pass', 'Ranked Series') if custom titles haven't been set yet.
        // NOTE (redesigned during review): removed the "Exact Time... <t:X:T>" line and prefixed
        // the remaining two timestamp lines with "✦ " per the new design. Also — the DMZ end time
        // showing 1 hour off from the others was traced to adminParser.js's parseAdminDate relying
        // on the host machine's local timezone during parsing; fixed there so all three deadlines
        // are now parsed the same UTC-anchored way regardless of the bot's local system settings.
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);

        // NOTE (redesigned during review): headers used to be H2 (##) with emoji + season title +
        // " ends..." all on one line — on narrow (mobile) widths that combined string routinely
        // wrapped onto a second line, which looked broken given the whole point of a countdown
        // header is to read at a glance. Previously fixed by dropping to H3 (###), but that made the
        // titles feel smaller than the rest of the bot's uniform heading sizes. Real fix: move
        // "ends..."/"that's..." OFF the heading line entirely and onto the timestamp lines below it
        // ("✦ **Ends...** <timestamp>" / "✦ **That's...** <relative>") — the heading is now just
        // "{emoji} **{title}**", short enough to stay on one line even on mobile, which means it's
        // safe to go back to the bigger H2 (##) size.
        // isTBD (added 2026-07-31 14:00 EDT) -- distinct from "not set yet": TBD means the admin
        // explicitly typed "TBD" for this deadline (adminParser's applyLine, index.js), so it gets
        // its own honest message instead of reading as simply forgotten/unconfigured.
        const buildEndBlock = (emoji, title, unix, isTBD) => {
            let body;
            if (isTBD) body = '*TBD — date not yet announced.*';
            else if (unix) body = `✦ **Ends...** <t:${unix}:F>\n✦ **That's...** <t:${unix}:R>`;
            else body = '*Date has not been set yet.*';
            return { type: 10, content: `## ${emoji} **${title}**\n${body}` };
        };

        const containerPayload = {
            type: 17,
            accent_color: accentColor,
            components: [
                buildEndBlock(emojis.bp1, seasonalDoc?.bpTitle || 'Battle Pass', bpUnix, seasonalDoc?.bpEndTBD),
                { type: 14, spacing: 2, divider: true }, // Structural Separator

                buildEndBlock(emojis.rank || '🏆', seasonalDoc?.rankTitle || 'Ranked Series', rankUnix, seasonalDoc?.rankEndTBD),
                { type: 14, spacing: 2, divider: true },

                buildEndBlock(emojis.dmz || '💀', seasonalDoc?.dmzTitle || 'DMZ Season', dmzUnix, seasonalDoc?.dmzEndTBD)
            ]
        };

        // 5. GLOBAL NAVIGATION: Ordered alphabetically by your request. 'Season End' is locked to Danger (Style 4).
        const globalNavigationRow = buildGlobalNavRow('nav_seasonend');

        // 6. REST BYPASS: Pushes the V2 components natively to Discord
        return await sendV2Payload(interaction, withShareButton([containerPayload, globalNavigationRow], isEphemeral));
    }
};