// Shared weapon-lookup + render path for /dmz and /gunsmiths search -- previously duplicated as
// commands/dmz.js's execute() and handlers/router.js's ~110-line MP fallback (the dynamically
// generated /all + /<category> commands had no 'data'+'execute' module in commands/, so
// interaction.client.commands.get() always missed and control fell through to that block). Both
// copies are gone; this is the one path both callers now share, differing only by `mode`.
const Loadout = require('../models/Loadout');
const UserPreference = require('../models/UserPreference');
const { buildLoadoutCard, getMpCategoryAccent } = require('./loadoutRender');
const { resolveEphemeral } = require('./ephemeral');
const { sendV2Payload } = require('./sendV2Payload');

async function lookupAndRenderWeapon(interaction, { mode, rawQuery, requestedBuild, visibilityChoice }) {
    const idPrefix = mode === 'DMZ' ? 'dmz' : 'mp';
    // Normalized the same way autocomplete's own weaponKey values already are -- harmless for a
    // picked suggestion (already normalized), but lets a free-typed exact name with different
    // casing/spacing still hit exactly.
    const weaponKey = rawQuery.toLowerCase().replace(/\s+/g, '');

    // Same "Weapon Builds" toggle every loadout lookup shares (Option A pattern, matches
    // `seasonalVisibility`). The builds query doesn't depend on prefs at all, so it's kicked off
    // alongside prefs instead of after -- only `prefs` is actually awaited before deferReply, to
    // keep the 3-second ack window fast. .lean() since these builds are only ever read here, never
    // saved.
    const prefsPromise = UserPreference.findOne({ discordId: interaction.user.id });
    const buildsPromise = Loadout.find({ weaponKey, mode }).lean();

    const prefs = await prefsPromise;
    const argPrivate = visibilityChoice === null || visibilityChoice === undefined ? null : visibilityChoice === 'hidden';
    const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'loadoutVisibility' });
    await interaction.deferReply({ ephemeral: isEphemeral });

    let builds = await buildsPromise;

    // Short/partial-query fallback (2026-07-18, v2 quick-wins batch) -- the exact weaponKey lookup
    // above only reliably matches when the option came from an actual autocomplete pick, so a
    // short/partial free-typed query (e.g. "loc") used to just fail with no explanation. Fuzzy-
    // match the raw query against every candidate weapon's real name in this mode before giving
    // up -- an unambiguous single match auto-resolves, 2+ matches asks the user to pick one
    // instead of silently guessing which they meant.
    if (!builds || builds.length === 0) {
        const { findWeaponMatches } = require('./search');
        const allCandidates = await Loadout.find({ mode }).select('weaponKey weaponName').lean();
        const uniqueCandidates = Array.from(new Map(allCandidates.map(w => [w.weaponKey, w])).values());
        const fuzzyMatches = findWeaponMatches(rawQuery, uniqueCandidates);

        if (fuzzyMatches.length === 1) {
            builds = await Loadout.find({ weaponKey: fuzzyMatches[0].weaponKey, mode }).lean();
        } else if (fuzzyMatches.length > 1) {
            const names = fuzzyMatches.slice(0, 10).map(w => w.weaponName).join(', ');
            try {
                await interaction.followUp({ content: `❌ That's not specific enough — did you mean one of these? **${names}**\nPick a suggestion from the dropdown as you type instead of typing the full name.` });
            } catch (notifyError) {
                console.error(`Failed to notify user of ambiguous ${mode} weapon match (interaction likely expired):`, notifyError);
            }
            return;
        }
    }

    if (!builds || builds.length === 0) {
        // NOTE: awaited + wrapped in its own try/catch -- an unawaited `return interaction.
        // followUp(...)` inside a try block can reject AFTER the block has already exited, which
        // can crash the whole process. See CLAUDE.md's crash-resilience notes.
        const hint = rawQuery.length < 3
            ? ' Try typing a bit more of the weapon\'s name, or pick a suggestion from the dropdown as you type.'
            : ' Double-check the spelling, or pick a suggestion from the dropdown as you type.';
        const noneLabel = mode === 'DMZ' ? 'specialized DMZ builds' : 'MP builds';
        try {
            await interaction.followUp({ content: `❌ No ${noneLabel} were found for that weapon.${hint}` });
        } catch (notifyError) {
            console.error(`Failed to notify user of missing ${mode} builds (interaction likely expired):`, notifyError);
        }
        return;
    }

    // `build` lets a user jump straight to a specific build number (1-based, matching the
    // "Build N of M" footer text) instead of always landing on the first. Clamped into range
    // rather than rejected outright if it's out of bounds.
    const buildIndex = requestedBuild ? Math.min(Math.max(requestedBuild - 1, 0), builds.length - 1) : 0;

    // Category-wide build list for the "Browse other builds" dropdown. MP scopes to the found
    // weapon's own category (matches every /<category> command's old per-category scope); DMZ has
    // no per-category split (models/Loadout.js -- categoryRank is never set for DMZ builds), so
    // its dropdown scope is every DMZ build, same as /dmz always did.
    const categoryBuilds = mode === 'DMZ'
        ? await Loadout.find({ mode: 'DMZ' }).lean()
        : await Loadout.find({ category: builds[0].category, mode: 'MP' }).lean();
    const accentColor = getMpCategoryAccent(builds[0].category);
    const cardPayload = buildLoadoutCard(builds, buildIndex, { color: accentColor, idPrefix, isEphemeral, categoryBuilds });
    await sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
}

module.exports = { lookupAndRenderWeapon };
