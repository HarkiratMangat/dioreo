// ==========================================
// COMMAND: /gunsmiths — mp + dmz (was search + list until 2026-10-19 19:43 EDT; consolidated /all + the 8 per-category MP commands before that)
// ==========================================
// Two subcommands, two doors onto one engine (see utils/loadoutScopes.js's scope descriptor): `search` is "I know the weapon" (MP-only — DMZ stays reachable via `list scope:DMZ` and the standalone /dmz), `list` is "show me a set" (11 named scopes: 7 categories + All MP + Meta MP + Meta DMZ + DMZ). Discord forbids a command from mixing top-level options with subcommands, which is why there is no shared `category:`/`mode:` option anywhere -- every browsable set is one whole named `scope:` choice instead, so no invalid combination can ever be assembled.
const { SlashCommandBuilder } = require('discord.js');
const { FIXED_SCOPES, formatScopeToken, parseScopeToken, resolveScopeBuilds, flatIndexToPosition } = require('../utils/loadoutScopes');
const { buildLoadoutCard, getMpCategoryAccent, displayCategoryLabel } = require('../utils/loadoutRender');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Two subcommands since 2026-10-19 19:43 EDT (Harkirat: "change /gunsmiths search to /gunsmiths MP, and a new /gunsmiths DMZ ... lets just remove gunsmith list"). Discord requires lower-case names, so they register as `mp` and `dmz`. Each takes a weapon, and its suggestions open with the browse rows (utils/loadoutScopes.js's browseRows) that /gunsmiths list used to offer as choices. The standalone /dmz is unchanged.
const visibilityOption = o => o.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.')
    .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' });
const weaponSub = (name, mode, desc) => sub => sub.setName(name).setDescription(desc)
    .addStringOption(o => o.setName('weapon').setDescription(`A ${mode} weapon, or All META / All ${mode} builds to browse them`).setRequired(true).setAutocomplete(true))
    .addIntegerOption(o => o.setName('build').setDescription('Jump to a specific build number').setMinValue(1))
    .addStringOption(visibilityOption);

const data = new SlashCommandBuilder()
    .setName('gunsmiths')
    .setDescription('Look up or browse MP and DMZ weapon loadouts')
    .setIntegrationTypes([0, 1]).setContexts([0, 1, 2])
    .addSubcommand(weaponSub('mp', 'MP', 'Find an MP weapon\'s loadout, or browse a whole class, Meta or every MP build'))
    .addSubcommand(weaponSub('dmz', 'DMZ', 'Find a DMZ weapon\'s loadout, or browse Meta or every DMZ build'));

// Matches a scope descriptor back to its human label -- a FIXED_SCOPES entry's own label for the 4 fixed scopes, or the display-cased category name for one of the 7 category scopes.
function labelForScope(scope) {
    const token = formatScopeToken(scope);
    const fixed = FIXED_SCOPES.find(s => s.value === token);
    if (fixed) return fixed.label;
    return displayCategoryLabel(scope.category);
}

// Shared by execute()'s `list` branch, a `~cat~` search row, and every gsb~ next/prev/jump click in handlers/loadouts.js -- the single render path for every scoped browse view.
async function renderScopeBrowse(interaction, scope, flatIndex, { isUpdate = false } = {}) {
    let isEphemeral;
    if (isUpdate) {
        // No execute() to re-resolve from on a gsb~ click -- read it off the message being edited, exactly like the existing mp/dmz pagination handler does. Getting this wrong makes the Share button silently disappear after the first click (see .claude/rules/rendering-and-ui.md).
        isEphemeral = Boolean(interaction.message.flags?.bitfield & 64);
        await interaction.deferUpdate();
    } else {
        const UserPreference = require('../models/UserPreference');
        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        // isChatInputCommand() guard added, matching every sibling command (v3-pre-release review, finding #68) -- unreachable today since this else-branch is only entered from execute(), but the function is exported and already called from handlers/loadouts.js.
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
        isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'loadoutVisibility' });
        await interaction.deferReply({ ephemeral: isEphemeral });
    }

    const builds = await resolveScopeBuilds(scope);
    if (!builds.length) {
        try {
            await interaction.followUp({ content: '❌ That scope has no builds saved yet.' });
        } catch (notifyError) {
            console.error('Failed to notify user of an empty gunsmiths scope (interaction likely expired):', notifyError);
        }
        return;
    }

    const { weaponKey, weaponBuilds, indexWithinWeapon } = flatIndexToPosition(builds, flatIndex);
    const scopeToken = formatScopeToken(scope);
    const scopeLabel = labelForScope(scope);
    const cardPayload = buildLoadoutCard(weaponBuilds, indexWithinWeapon, {
        color: getMpCategoryAccent(weaponBuilds[indexWithinWeapon].category),
        idPrefix: scope.mode === 'DMZ' ? 'dmz' : 'mp',
        isEphemeral,
        categoryBuilds: builds,
        hideBadges: scope.metaOnly,
        browse: { scopeToken, flatIndex, flatTotal: builds.length, scopeLabel },
    });
    await sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
}

async function execute(interaction) {
    const mode = interaction.options.getSubcommand() === 'dmz' ? 'DMZ' : 'MP';
    const raw = interaction.options.getString('weapon');
    // A browse row from the suggestions carries `~scope~<token>`; `~` can never appear in a weaponKey. `build:` is ignored on one: it means "build N of this weapon", and a browse has no single weapon.
    if (raw.startsWith('~scope~')) {
        const scope = parseScopeToken(raw.slice(7));
        if (scope.mode === 'MP' || scope.mode === 'DMZ') return renderScopeBrowse(interaction, scope, 0);
    }
    // The old `~cat~<CATEGORY>` rows (removed 2026-10-19 18:57 EDT) still resolve, for a suggestion list a client kept open.
    if (raw.startsWith('~cat~')) return renderScopeBrowse(interaction, { mode: 'MP', category: raw.slice(5), metaOnly: false }, 0);
    const { lookupAndRenderWeapon } = require('../utils/loadoutLookup');
    return lookupAndRenderWeapon(interaction, {
        mode,
        rawQuery: raw,
        requestedBuild: interaction.options.getInteger('build'),
        visibilityChoice: interaction.options.getString('visibility'),
    });
}

module.exports = { data, execute, renderScopeBrowse };
