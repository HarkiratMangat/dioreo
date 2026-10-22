// ==========================================
// COMMAND: /gunsmith — mp + dmz (renamed from /gunsmiths 2026-10-19 21:20 EDT; was search + list until 2026-10-19 19:43 EDT; consolidated /all + the 8 per-category MP commands before that)
// ==========================================
// Two subcommands, two doors onto one engine (see utils/loadoutScopes.js's scope descriptor): `mp` and `dmz` each take a weapon, or a browse row (All META builds, All MP / All DMZ builds, each MP class) that opens a whole set. Discord forbids a command from mixing top-level options with subcommands, which is why there is no shared `category:`/`mode:` option anywhere -- every browsable set is one whole named scope token (`gsb~` / `~scope~`) instead, so no invalid combination can ever be assembled. ⚠️ THE NAME IS SINGULAR ON PURPOSE (Harkirat, "let's use gunsmith singular"). It was /gunsmiths, a plural players never write; /loadouts and /builds were weighed against it in a naming pass and he chose /gunsmith. The description carries the word "loadout" so a player who types that into Discord's command picker still finds it. A command's registered name keys anything stored against it -- /admin visibility rules, analytics rows, the permission tables -- so the rename was done before v3 reached prod, while none of that exists yet under the old name.
const BOT_EMOJI = require('../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { SlashCommandBuilder } = require('discord.js');
const { FIXED_SCOPES, formatScopeToken, parseScopeToken, resolveScopeBuilds, flatIndexToPosition } = require('../utils/loadoutScopes');
const { buildLoadoutCard, getMpCategoryAccent, displayCategoryLabel } = require('../utils/loadoutRender');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Two subcommands since 2026-10-19 19:43 EDT (Harkirat: "change /gunsmiths search to /gunsmiths MP, and a new /gunsmiths DMZ ... lets just remove gunsmith list"). Discord requires lower-case names, so they register as `mp` and `dmz`. Each takes a weapon, and its suggestions open with the browse rows (utils/loadoutScopes.js's browseRows) that /gunsmith list used to offer as choices. The standalone /dmz is unchanged.
const visibilityOption = o => o.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.')
    .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' });
const weaponSub = (name, mode, desc) => sub => sub.setName(name).setDescription(desc)
    .addStringOption(o => o.setName('weapon').setDescription(`A ${mode} weapon, or All META / All ${mode} builds to browse them`).setRequired(true).setAutocomplete(true))
    .addIntegerOption(o => o.setName('build').setDescription('Jump to a specific build number').setMinValue(1))
    .addStringOption(visibilityOption);

const data = new SlashCommandBuilder()
    .setName('gunsmith')
    .setDescription('Best MP and DMZ loadouts and gunsmith builds')
    .setIntegrationTypes([0, 1]).setContexts([0, 1, 2])
    .addSubcommand(weaponSub('mp', 'MP', 'Find an MP build or browse the META and more'))
    .addSubcommand(weaponSub('dmz', 'DMZ', 'Find a DMZ build or browse the META and more'));

// Matches a scope descriptor back to its human label -- a FIXED_SCOPES entry's own label for the 4 fixed scopes, or the display-cased category name for one of the 7 category scopes.
function labelForScope(scope) {
    const token = formatScopeToken(scope);
    const fixed = FIXED_SCOPES.find(s => s.value === token);
    if (fixed) return fixed.label;
    return displayCategoryLabel(scope.category);
}

// Shared by execute()'s browse-row branch (`~scope~`), the legacy `~cat~` row, and every gsb~ next/prev/jump click in handlers/loadouts.js -- the single render path for every scoped browse view.
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
            await interaction.followUp({ content: BOT_EMOJI.cross + ' That scope has no builds saved yet.' });
        } catch (notifyError) {
            console.error('Failed to notify user of an empty gunsmith scope (interaction likely expired):', notifyError);
        }
        return;
    }

    const { weaponBuilds, indexWithinWeapon } = flatIndexToPosition(builds, flatIndex);
    const scopeToken = formatScopeToken(scope);
    const scopeLabel = labelForScope(scope);
    require('../utils/userStats').noteBuildOpenedSafely(interaction.user?.id, weaponBuilds[indexWithinWeapon]?._id); // Your Stats: a build this user opened
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
