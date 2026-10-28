// Shared weapon-lookup + render path for /dmz and /gunsmith mp -- previously duplicated as commands/dmz.js's execute() and handlers/router.js's ~110-line MP fallback (the dynamically generated /all + /<category> commands had no 'data'+'execute' module in commands/, so interaction.client.commands.get() always missed and control fell through to that block). Both copies are gone; this is the one path both callers now share, differing only by `mode`. The card's own Search (handlers/loadouts.js, `gsb~find~`) resolves through the same resolveWeapon below, so a name typed there finds exactly what the slash command would.
const BOT_EMOJI = require('./emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const Loadout = require('../models/Loadout');
const UserPreference = require('../models/UserPreference');
const { buildLoadoutCard, buildMissingWeaponCard, getMpCategoryAccent, isPlaceholderBuild } = require('./loadoutRender');
const { resolveEphemeral } = require('./ephemeral');
const { sendV2Payload } = require('./sendV2Payload');

// The weapon a typed name means, as one of: { builds } (real builds, placeholders dropped), { missing: { weaponName, category } } (a weapon the game has that Dioreo has no build for yet, from a "Coming Soon" placeholder or the CODM catalogue), { ambiguous: [names] }, or { none: true }.
async function resolveWeapon(mode, rawQuery) {
    // Normalized the same way autocomplete's own weaponKey values already are -- harmless for a picked suggestion (already normalized), but lets a free-typed exact name with different casing/spacing still hit exactly.
    const weaponKey = rawQuery.toLowerCase().replace(/\s+/g, '');
    let builds = await Loadout.find({ weaponKey, mode }).lean();

    // An EXACT catalogue name beats a partial match (found click-testing 2026-10-25 19:34 EDT: Search "m4" opened the XM4, because M4 has no build and "m4" is inside "XM4"). So a name the CODM catalogue knows exactly is that weapon: its builds under any spacing of the key, or its no-build card. MP only, as below.
    if (!builds.length && mode === 'MP') {
        const { normKey } = require('./catalogue');
        const key = normKey(rawQuery);
        const CatalogueItem = require('../models/CatalogueItem');
        const weapon = key ? await CatalogueItem.findOne({ kind: 'weapon', key, dmzOnly: { $ne: true } }).lean() : null;
        if (weapon) {
            const named = (await Loadout.find({ mode }).lean()).filter(b => normKey(b.weaponName) === key);
            if (!named.length) return { missing: { weaponName: weapon.name.toUpperCase(), category: weapon.category } };
            builds = named;
        }
    }

    // Short/partial-query fallback (2026-07-18, v2 quick-wins batch) -- the exact weaponKey lookup above only reliably matches when the option came from an actual autocomplete pick, so a short/partial free-typed query (e.g. "loc") used to just fail with no explanation. Fuzzy- match the raw query against every candidate weapon's real name in this mode before giving up -- an unambiguous single match auto-resolves, 2+ matches asks the user to pick one instead of silently guessing which they meant.
    if (!builds.length) {
        const { findWeaponMatches } = require('./search');
        const allCandidates = await Loadout.find({ mode }).select('weaponKey weaponName category').lean();
        const uniqueCandidates = Array.from(new Map(allCandidates.map(w => [w.weaponKey, w])).values());
        const fuzzyMatches = findWeaponMatches(rawQuery, uniqueCandidates);
        if (fuzzyMatches.length === 1) builds = await Loadout.find({ weaponKey: fuzzyMatches[0].weaponKey, mode }).lean();
        else if (fuzzyMatches.length > 1) return { ambiguous: fuzzyMatches.slice(0, 10).map(w => w.weaponName) };
    }

    // In build-number order (utils/loadoutForm.js compareBuilds, 2026-10-26 01:19 EDT), so "Build N of M" is the build # the Edit pop-up shows and a swap there swaps the cards. It was Mongo's natural order, about _id order, before.
    const real = builds.filter(b => !isPlaceholderBuild(b)).sort(require('./loadoutForm').compareBuilds);
    if (real.length) return { builds: real };
    // Only a "Coming Soon" placeholder: the weapon is known, its build is not (Harkirat, 2026-10-24 09:45 EDT: "design the panel in case a weapon is missing").
    if (builds.length) return { missing: { weaponName: builds[0].weaponName, category: builds[0].category } };

    // No build at all: a weapon the game has (the CODM catalogue, utils/catalogue.js) still gets the missing panel rather than "not found". MP only: the catalogue is the general weapon table, and DMZ has its own short list.
    if (mode === 'MP') {
        const { normKey } = require('./catalogue');
        const CatalogueItem = require('../models/CatalogueItem');
        const key = normKey(rawQuery);
        const weapon = key ? await CatalogueItem.findOne({ kind: 'weapon', key, dmzOnly: { $ne: true } }).lean() : null;
        if (weapon) return { missing: { weaponName: weapon.name.toUpperCase(), category: weapon.category } };
    }
    return { none: true };
}

// A class's weapons in the CODM catalogue with no real build (Harkirat, 2026-10-25 16:12-16:21 EDT: "implement the weapons into the command that currently dont have builds"), A-Z, for the weapon dropdown's "N more with no build yet..." and the no-build pager. Matched by the catalogue's own key (utils/catalogue.js normKey) on the weapon NAME: a weaponKey is spaced differently and missed 8 Assault Rifles that have builds.
async function missingWeapons(category) {
    if (!category) return [];
    const { normKey } = require('./catalogue');
    const CatalogueItem = require('../models/CatalogueItem');
    const built = new Set((await Loadout.find({ mode: 'MP', category }).select('weaponName attachments').lean()).filter(b => !isPlaceholderBuild(b)).map(b => normKey(b.weaponName)));
    return (await CatalogueItem.find({ kind: 'weapon', category, dmzOnly: { $ne: true } }).lean())
        .filter(w => !built.has(w.key || normKey(w.name)))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(w => ({ name: w.name.toUpperCase(), key: w.key || normKey(w.name), category }));
}

// Every MP weapon the CODM catalogue has with no real build, all classes: the list beside /manage's Export All (ROADMAP "Export of every loadout, and a list of weapons that have none", folded into the loadout-keys work 2026-10-26 11:16 EDT). MP only: the catalogue is the general weapon table, and DMZ has no list of its own to check against.
async function missingWeaponsAll() {
    const { normKey } = require('./catalogue');
    const CatalogueItem = require('../models/CatalogueItem');
    const built = new Set((await Loadout.find({ mode: 'MP' }).select('weaponName attachments').lean()).filter(b => !isPlaceholderBuild(b)).map(b => normKey(b.weaponName)));
    return (await CatalogueItem.find({ kind: 'weapon', dmzOnly: { $ne: true } }).lean())
        .filter(w => !built.has(w.key || normKey(w.name)))
        .map(w => ({ name: w.name.toUpperCase(), category: w.category || '?' }))
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

// The no-build list as a text file: the count first, so it can be checked at a glance, then the weapons by class.
function formatMissingWeapons(missing) {
    const lines = [`${missing.length} MP weapon${missing.length === 1 ? '' : 's'} in the CODM catalogue with no build in Dioreo`];
    let cat = null;
    for (const w of missing) {
        if (w.category !== cat) { cat = w.category; lines.push('', `${cat} (${missing.filter(m => m.category === cat).length})`); }
        lines.push(`- ${w.name}`);
    }
    return lines.join('\n');
}

// Draws what resolveWeapon found onto the interaction's message, which the caller has already deferred (a reply for the slash command, an update for the card's Search).
async function renderResolved(interaction, mode, found, { isEphemeral, buildIndex = 0 }) {
    const idPrefix = mode === 'DMZ' ? 'dmz' : 'mp';
    if (found.missing) {
        const { weaponName, category } = found.missing;
        const categoryBuilds = mode === 'DMZ' ? await Loadout.find({ mode: 'DMZ' }).lean() : await Loadout.find({ category, mode: 'MP' }).lean();
        const payload = buildMissingWeaponCard({ weaponName, category, mode, isEphemeral, categoryBuilds, missing: mode === 'MP' ? await missingWeapons(category) : [] });
        return await sendV2Payload(interaction, payload.components, { flags: payload.flags });
    }
    // Drawn inside the weapon's class, so the arrows walk its class (Harkirat, 2026-10-25 19:02 EDT); DMZ has no classes and walks every DMZ build. renderScopeBrowse notes the opened build for Your Stats.
    const { builds } = found;
    const { renderScopeBrowse } = require('../commands/gunsmith');
    return await renderScopeBrowse(interaction, { mode, category: mode === 'DMZ' ? null : undefined, metaOnly: false }, 0, { deferred: true, isEphemeral, weaponKey: builds[0].weaponKey, buildIndex });
}

// The words for a name that found no single weapon, shared by the slash command and the card's Search.
function notFoundText(mode, rawQuery, found) {
    if (found.ambiguous) return `${BOT_EMOJI.cross} That's not specific enough — did you mean one of these? **${found.ambiguous.join(', ')}**\nType a little more of the name.`;
    const hint = rawQuery.length < 3
        ? ' Try typing a bit more of the weapon\'s name, or pick a suggestion from the dropdown as you type.'
        : ' Double-check the spelling, or pick a suggestion from the dropdown as you type.';
    return `${BOT_EMOJI.cross} No ${mode === 'DMZ' ? 'specialized DMZ builds' : 'MP builds'} were found for that weapon.${hint}`;
}

async function lookupAndRenderWeapon(interaction, { mode, rawQuery, requestedBuild, visibilityChoice }) {
    // Same "Weapon Builds" toggle every loadout lookup shares (Option A pattern, matches `seasonalVisibility`). The lookup doesn't depend on prefs at all, so it's kicked off alongside prefs instead of after -- only `prefs` is actually awaited before deferReply, to keep the 3-second ack window fast.
    const prefsPromise = UserPreference.findOne({ discordId: interaction.user.id });
    const foundPromise = resolveWeapon(mode, rawQuery);

    const prefs = await prefsPromise;
    const argPrivate = visibilityChoice === null || visibilityChoice === undefined ? null : visibilityChoice === 'hidden';
    const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'loadoutVisibility' });
    await interaction.deferReply({ ephemeral: isEphemeral });

    const found = await foundPromise;
    if (found.ambiguous || found.none) {
        // NOTE: awaited + wrapped in its own try/catch -- an unawaited `return interaction. followUp(...)` inside a try block can reject AFTER the block has already exited, which can crash the whole process. See CLAUDE.md's crash-resilience notes. Only the person who typed it sees the miss (utils/ephemeral.js privateNotice; Harkirat, 2026-10-27 23:40 EDT).
        try {
            await require('./ephemeral').privateNotice(interaction, notFoundText(mode, rawQuery, found), { ephemeral: isEphemeral });
        } catch (notifyError) {
            console.error(`Failed to notify user of an unmatched ${mode} weapon (interaction likely expired):`, notifyError);
        }
        return;
    }

    // `build` lets a user jump straight to a specific build number (1-based, matching the "Build N of M" pager) instead of always landing on the first. Clamped into range rather than rejected outright if it's out of bounds.
    await renderResolved(interaction, mode, found, { isEphemeral, buildIndex: requestedBuild ? requestedBuild - 1 : 0 });
}

// The one-box search pop-up (Harkirat, 2026-10-24 09:45 EDT: "can we make the flow of searching for another weapon or build much more fluid?"), opened by a card's Search..., its dropdown's search option, and since 2026-10-25 23:12 EDT by /gunsmith's own "▸ Type a name to search all N weapons" suggestion (his ask: open the search pop-up instead of the browse's first weapon). A select menu cannot autocomplete, so the box takes a typed name and resolves it the way /gunsmith does (resolveWeapon). `visibility` is the slash command's choice, carried in the id because the pop-up's answer has no options of its own.
function searchModal(mode, visibility = null) {
    return {
        title: `Search ${mode} weapons`, custom_id: `gsb~find~${mode}${visibility ? `~v${visibility}` : ''}`,
        components: [{ type: 1, components: [{ type: 4, custom_id: 'q', label: 'Weapon name', style: 1, required: true, max_length: 60, placeholder: mode === 'DMZ' ? 'Fennec, AS VAL…' : 'AK117, Locus, BP50…' }] }],
    };
}

module.exports = { lookupAndRenderWeapon, resolveWeapon, renderResolved, notFoundText, missingWeapons, missingWeaponsAll, formatMissingWeapons, searchModal };
