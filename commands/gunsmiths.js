// ==========================================
// COMMAND: /gunsmiths — search + list (consolidates /all + the 8 per-category MP commands)
// ==========================================
// Two subcommands, two doors onto one engine (see utils/loadoutScopes.js's scope descriptor): `search` is "I know the weapon" (MP-only — DMZ stays reachable via `list scope:DMZ` and the standalone /dmz), `list` is "show me a set" (11 named scopes: 7 categories + All MP + Meta MP + Meta DMZ + DMZ). Discord forbids a command from mixing top-level options with subcommands, which is why there is no shared `category:`/`mode:` option anywhere -- every browsable set is one whole named `scope:` choice instead, so no invalid combination can ever be assembled.
const { SlashCommandBuilder } = require('discord.js');
const { FIXED_SCOPES, formatScopeToken, parseScopeToken, resolveScopeBuilds, flatIndexToPosition } = require('../utils/loadoutScopes');
const { buildLoadoutCard, getMpCategoryAccent, displayCategoryLabel } = require('../utils/loadoutRender');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Static default so `data.toJSON()` is a valid, fully-shaped command at require time (no DB round trip needed to import this module, or to run scripts/gunsmithsCommandShape.test.js standalone). bot/registry.js's applyGunsmithsScopeChoices() overwrites these with the live DB-derived list post-ClientReady, the same 7 categories today per the spec's measured facts -- this list only matters as a fallback/default and to keep this module deterministically testable.
const DEFAULT_CATEGORIES = ['AR', 'LMG', 'MARKSMAN', 'SECONDARIES', 'SHOTGUN', 'SMG', 'SNIPER'];
const DEFAULT_SCOPE_CHOICES = [
    ...DEFAULT_CATEGORIES.map(c => ({ name: c, value: `MP.${c}.std` })),
    ...FIXED_SCOPES.map(s => ({ name: s.label, value: s.value })),
];

const data = new SlashCommandBuilder()
    .setName('gunsmiths')
    .setDescription('Look up or browse MP weapon loadouts')
    .setIntegrationTypes([0, 1]).setContexts([0, 1, 2])
    .addSubcommand(sub => sub.setName('search').setDescription('Find a specific MP weapon\'s loadout')
        .addStringOption(o => o.setName('weapon').setDescription('The MP weapon you want a build for').setRequired(true).setAutocomplete(true))
        .addIntegerOption(o => o.setName('build').setDescription('Jump to a specific build number').setMinValue(1))
        .addStringOption(o => o.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.')
            .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })))
    .addSubcommand(sub => sub.setName('list').setDescription('Browse a set of builds — a category, meta, or all of DMZ')
        .addStringOption(o => o.setName('scope').setDescription('Which set of builds to browse').setRequired(true).addChoices(...DEFAULT_SCOPE_CHOICES))
        .addStringOption(o => o.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.')
            .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })));

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
    const sub = interaction.options.getSubcommand();
    if (sub === 'search') {
        const raw = interaction.options.getString('weapon');
        // A `~cat~<CATEGORY>` value comes from a category row in the autocomplete list; `~` can never appear in a weaponKey (checked against all 70), so this cannot collide.
        if (raw.startsWith('~cat~')) {
            // `build:` is deliberately IGNORED on a category row -- it means "build N of this weapon", and a scope browse has no single weapon. Silently starting at flat index N-1 would be a different, surprising meaning.
            return renderScopeBrowse(interaction, { mode: 'MP', category: raw.slice(5), metaOnly: false }, 0);
        }
        const { lookupAndRenderWeapon } = require('../utils/loadoutLookup');
        return lookupAndRenderWeapon(interaction, {
            mode: 'MP',
            rawQuery: raw,
            requestedBuild: interaction.options.getInteger('build'),
            visibilityChoice: interaction.options.getString('visibility'),
        });
    }
    return renderScopeBrowse(interaction, parseScopeToken(interaction.options.getString('scope')), 0);
}

module.exports = { data, execute, renderScopeBrowse };
