// ==========================================
// COMMAND: STANDALONE DMZ LOADOUT LOOKUP
// ==========================================
// This handles dedicated DMZ weapon configurations, restricting lookups strictly
// to DMZ variants allowing up to 9 attachments per weapon schema layout.
const { SlashCommandBuilder } = require('discord.js');
const Loadout = require('../models/Loadout');
const UserPreference = require('../models/UserPreference');
const { buildLoadoutCard, getMpCategoryAccent } = require('../utils/loadoutRender');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dmz')
        .setDescription('Search through all DMZ specific gunsmiths')
        .addStringOption(option =>
            option.setName('weapon')
                .setDescription('The name of the weapon you want a DMZ build for')
                .setRequired(true)
                .setAutocomplete(true)) // Autocomplete hooked dynamically in index.js
        .addIntegerOption(option =>
            option.setName('build')
                .setDescription('Jump directly to a specific build number, if this weapon has more than one')
                .setMinValue(1))
        .addBooleanOption(option => option.setName('hidden').setDescription('True = only you can see this response. False = everyone in the chat can see it.'))
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
        // NOTE (added during review): kicked off alongside `prefs` instead of after it -- the
        // builds query doesn't depend on prefs at all, so starting it here lets it resolve
        // concurrently with the deferReply() ack below instead of only starting once that's done.
        // Only `prefs` is actually awaited before deferReply (keeps the 3-second ack window fast);
        // `buildsPromise` is awaited further down, by which point it's had a head start. .lean()
        // since these builds are only ever read here, never saved.
        const prefsPromise = UserPreference.findOne({ discordId: userId });
        const buildsPromise = Loadout.find({ weaponKey: weaponInput, mode: 'DMZ' }).lean();

        const prefs = await prefsPromise;
        // NOTE (added during review): explicit `private` option now overrides the saved preference,
        // same explicit-option > saved-preference > default priority every other command uses --
        // added specifically so a user can invoke the command already-public in one shot instead of
        // relying on the "Share Publicly" button to flip it after the fact.
        const argPrivate = interaction.options.getBoolean('hidden');
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'loadoutVisibility' });

        await interaction.deferReply({ ephemeral: isEphemeral });

        // 2. Query MongoDB for the exact weapon matching the key and restricted to DMZ mode
        const builds = await buildsPromise;

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
        //
        // Repalette (2026-07-12, Section 5 of the batch): switched from a fixed identity color
        // (#1c1c1c) to the SAME per-weapon-category palette MP loadouts already use
        // (MP_CATEGORY_ACCENT in utils/loadoutRender.js) -- a DMZ result's embed color now depends
        // on the weapon's category the same way /all's does, instead of every DMZ build looking
        // identical regardless of weapon type. Deliberately still NOT part of the avatar/banner
        // accent-color system (same as MP loadouts) -- category identity, not personalization.
        // Category-wide build list for the "Browse other builds" dropdown -- /dmz has no
        // per-category commands the way MP does, so its dropdown scope is every DMZ build, not
        // just this weapon's own category.
        const categoryBuilds = await Loadout.find({ mode: 'DMZ' }).lean();
        const accentColor = getMpCategoryAccent(builds[0].category);
        const cardPayload = buildLoadoutCard(builds, buildIndex, { color: accentColor, idPrefix: 'dmz', isEphemeral, categoryBuilds });
        return sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
    }
};