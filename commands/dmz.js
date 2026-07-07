// ==========================================
// COMMAND: STANDALONE DMZ LOADOUT LOOKUP
// ==========================================
// This handles dedicated DMZ weapon configurations, restricting lookups strictly
// to DMZ variants allowing up to 9 attachments per weapon schema layout.
const { SlashCommandBuilder, Routes } = require('discord.js');
const Loadout = require('../models/Loadout');
const UserPreference = require('../models/UserPreference');
const { buildLoadoutCard } = require('../utils/loadoutRender');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dmz')
        .setDescription('🔍 Look up a high-tier DMZ build with up to 9 attachment slots!')
        .addStringOption(option =>
            option.setName('weapon')
                .setDescription('The name of the weapon you want a DMZ build for')
                .setRequired(true)
                .setAutocomplete(true)) // Autocomplete hooked dynamically in index.js
        .addIntegerOption(option =>
            option.setName('build')
                .setDescription('Jump directly to a specific build number, if this weapon has more than one')
                .setMinValue(1))
        .addBooleanOption(option => option.setName('private').setDescription('Hide this response so only you can see it'))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

    async execute(interaction) {
        const userId = interaction.user.id;
        const weaponInput = interaction.options.getString('weapon').toLowerCase().replace(/\s+/g, '');

        // 1. Resolve user visibility preference configurations
        // NOTE (fixed during review): this checked `prefs.dmzVisibility`, a field that was never
        // actually exposed anywhere in /settings — the UI only ever shows a single "Weapon Builds"
        // toggle, which writes to `prefs.loadoutVisibility`. So toggling it in /settings had zero
        // effect on /dmz; the dead `dmzVisibility` field just silently sat at its schema default
        // forever. Now reads the same field the visible toggle actually writes to, shared with the
        // MP loadout commands below (one "Weapon Builds" toggle covers all loadout lookups).
        const prefs = await UserPreference.findOne({ discordId: userId });
        // NOTE (added during review): explicit `private` option now overrides the saved preference,
        // same explicit-option > saved-preference > default priority every other command uses --
        // added specifically so a user can invoke the command already-public in one shot instead of
        // relying on the "Share Publicly" button to flip it after the fact.
        const argPrivate = interaction.options.getBoolean('private');
        const isEphemeral = argPrivate !== null ? argPrivate : (prefs ? prefs.loadoutVisibility === 'ephemeral' : false);

        await interaction.deferReply({ ephemeral: isEphemeral });

        // 2. Query MongoDB for the exact weapon matching the key and restricted to DMZ mode
        const builds = await Loadout.find({ weaponKey: weaponInput, mode: 'DMZ' });

        if (!builds || builds.length === 0) {
            return interaction.followUp({ content: '❌ No specialized DMZ builds were found for that weapon key.' });
        }

        // NOTE (added during review): `build` lets a user jump straight to a specific build number
        // (1-based, matching the "Build N of M" footer text) instead of always landing on the
        // first and having to click Next repeatedly. Clamped into range rather than rejected
        // outright if it's out of bounds (e.g. `build:5` on a weapon with only 2 builds).
        const requestedBuild = interaction.options.getInteger('build');
        const buildIndex = requestedBuild ? Math.min(Math.max(requestedBuild - 1, 0), builds.length - 1) : 0;

        // 3. Build the card (shared with the MP category commands — see utils/loadoutRender.js).
        // Components V2 accent_color needs a decimal, not a hex string like EmbedBuilder took.
        // LIBRARY SERIALIZATION BYPASS: raw rest.patch instead of interaction.followUp(), same
        // reasoning as every other Components V2 command — discord.js's high-level methods don't
        // reliably handle raw V2 JSON (no builder class exists for Container/type 17).
        const cardPayload = buildLoadoutCard(builds, buildIndex, { color: 1842204, idPrefix: 'dmz', isEphemeral }); // #1c1c1c
        return interaction.client.rest.patch(
            Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
            { body: { content: '', components: cardPayload.components, flags: cardPayload.flags } }
        );
    }
};