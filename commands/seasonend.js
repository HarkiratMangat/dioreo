// ==========================================
// COMMAND: SEASON END DEADLINES
// ==========================================
// ARCHITECTURE: Uses Subcommands (/season end) to bypass Discord's space restrictions.
// Features dynamic, editable titles fetched from the MongoDB global document.

const { SlashCommandBuilder, Routes } = require('discord.js');
const SeasonalData = require('../models/SeasonalData');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { withShareButton } = require('../utils/shareButton');

// NOTE (corrected during review — see calendar.js for the full explanation): fixed to match the
// intended nav-button-order palette assignment. Season End is the 5th nav button, so Tumbleweed.
const PRESET_ACCENT = 15379595; // Tumbleweed (#EAAC8B) — 5th nav button (Season End)

module.exports = {
    // COMMAND DEFINITION: Base command 'season' with subcommand 'end'
    data: new SlashCommandBuilder()
        .setName('season')
        .setDescription('Seasonal countdowns and details')
        .addSubcommand(sub => sub
            .setName('end')
            .setDescription('Check the exact dates and countdowns for when the current seasons end!')
            .addBooleanOption(option =>
                option.setName('private')
                    .setDescription('Hide this response so only you can see it')))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    async execute(interaction) {
        const userId = interaction.user.id;

        // 1. VISIBILITY RESOLUTION: Check for local command override first, fallback to DB preference
        const prefs = await UserPreference.findOne({ discordId: userId });
        const argPrivate = interaction.isChatInputCommand() ? interaction.options.getBoolean('private') : null;
        // NOTE: switched from the old per-command `seasonendVisibility` field to the shared
        // `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in
        // /settings (Option A — one switch controls Season End/Draws/Patch Notes/Calendar/Draw
        // Prices together, per user's decision).
        const isEphemeral = argPrivate !== null ? argPrivate : (prefs ? prefs.seasonalVisibility === 'ephemeral' : false);

        // 2. MODERN DEFERRAL: Use bitwise flag 64 for ephemeral, 0 for public
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        // 3. DATABASE FETCH: Retrieve the global countdown dates
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });

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

        // NOTE (fixed during review): headers were H2 (##) with emoji + season title + " ends..." —
        // on narrow (mobile) widths that combined string routinely wrapped onto a second line, which
        // looked broken given the whole point of a countdown header is to read at a glance. Dropped
        // to H3 (###) rather than removing "ends..." entirely — keeps the wording (removing it would
        // make "Battle Pass" alone read ambiguously, not obviously a countdown) while buying back
        // enough width that it fits on one line for the season titles Harkirat actually uses.
        const containerPayload = {
            type: 17,
            accent_color: accentColor,
            components: [
                { type: 10, content: `### <:BP_CODM1:1523190109065707560> **${seasonalDoc?.bpTitle || 'Battle Pass'} ends...**\n${bpUnix ? `✦ <t:${bpUnix}:F>\n✦ <t:${bpUnix}:R>` : '*Date has not been set yet.*'}` },
                { type: 14, spacing: 2, divider: true }, // Structural Separator

                { type: 10, content: `### ${emojis.rank || '🏆'} **${seasonalDoc?.rankTitle || 'Ranked Series'} ends...**\n${rankUnix ? `✦ <t:${rankUnix}:F>\n✦ <t:${rankUnix}:R>` : '*Date has not been set yet.*'}` },
                { type: 14, spacing: 2, divider: true },

                { type: 10, content: `### ${emojis.dmz || '💀'} **${seasonalDoc?.dmzTitle || 'DMZ Season'} ends...**\n${dmzUnix ? `✦ <t:${dmzUnix}:F>\n✦ <t:${dmzUnix}:R>` : '*Date has not been set yet.*'}` }
            ]
        };

        // 5. GLOBAL NAVIGATION: Ordered alphabetically by your request. 'Season End' is locked to Danger (Style 4).
        const globalNavigationRow = {
            type: 1,
            components: [
                { type: 2, style: 2, label: "Calendar", custom_id: "nav_calendar" },
                { type: 2, style: 2, label: "Draws", custom_id: "nav_draws" },
                { type: 2, style: 2, label: "Draw Prices", custom_id: "nav_prices" },
                { type: 2, style: 2, label: "Patch Notes", custom_id: "nav_patchnotes" },
                { type: 2, style: 4, label: "Season End", custom_id: "nav_seasonend", disabled: true }
            ]
        };

        // 6. REST BYPASS: Pushes the V2 components natively to Discord
        return await interaction.client.rest.patch(
            Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
            { body: { content: "", components: withShareButton([containerPayload, globalNavigationRow], isEphemeral), flags: 32768 } }
        );
    }
};