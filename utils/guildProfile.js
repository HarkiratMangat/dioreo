// utils/guildProfile.js -- reading a user's PER-SERVER profile overrides (2026-08-09 13:22 EDT)
//
// Discord's Server Profiles feature lets someone override their avatar, banner, avatar decoration,
// nameplate and Display Name Styles separately in each guild. The invoker's overrides ride along in
// the `member` object of every interaction raised inside a guild, so reading them costs nothing --
// but `interaction.member` comes back in THREE different shapes, and the difference is not cosmetic:
//
//   1. Guild the bot has JOINED     -> a discord.js `GuildMember` (camelCase, real methods).
//   2. Guild the bot has NOT joined -> the RAW API payload, a plain object (snake_case, NO methods).
//      BaseInteraction.js:69 is `this.guild?.members._add(data.member) ?? data.member` -- with no
//      cached guild there is nothing to construct a GuildMember against, so the raw JSON is handed
//      back as-is. Calling member.displayAvatarURL() here throws "not a function".
//   3. DM / no guild context        -> null.
//
// Case 2 is the COMMON one, not an edge case: the bot is user-installable, so most guild invocations
// come from servers it has never joined. All measurements below were taken live on 2026-08-09
// against a real user-installed app in a guild with `guild_count: 0` for that guild.
//
// ⚠️ THE ONE ASYMMETRY, and it is backwards from intuition. Every source except name styles is
// readable for free in BOTH guild cases. `display_name_styles` is present in the raw payload (case 2)
// but discord.js's GuildMember._patch does not model the field at all, so it is DISCARDED in case 1 --
// the case where the bot has MORE access. Recovering it there needs a REST member fetch, which is
// exactly the call that returns 404 Unknown Guild in case 2. The two paths are complementary:
// whichever case you are in, one of them works. See fetchGuildNameStyles below.
//
// Verified 2026-08-09 13:10-13:19 EDT against three real contexts (a joined guild, a non-joined
// guild, and DMs), with genuinely different overrides set in each.

const { Routes } = require('discord.js');

// A null hash means "no override in this guild" -- NOT "no avatar". Discord only populates these
// when the user has actually set a server-specific one, so null is the signal to fall through to the
// global profile. (This is why an early reading of `collectibles: null` was misread as "nameplates
// cannot be per-server" -- it only meant none was set at the time.)
function readGuildProfile(interaction, prefs = null) {
    // The user's own opt-out (UserPreference.profileSource). 'global' means never read the server
    // profile even where one exists; 'auto' (the default, and what an absent prefs doc implies) uses
    // it wherever it is set. Gated HERE rather than at each call site so a future caller cannot
    // forget it and silently ignore the preference.
    if (prefs?.profileSource === 'global') return null;

    const member = interaction.member;
    if (!member || !interaction.guildId) return null;

    // ⚠️ `member` always describes whoever CLICKED, while `.user` is whose data we are rendering --
    // and those diverge on the admin-override path, where index.js's resolvePanelActor builds a
    // synthetic interaction with `.user` swapped to the panel's owner but `.member` left as the
    // admin's. Reading the guild profile there would paint the admin's own server avatar onto
    // someone else's panel: no error, just quietly the wrong person's colors. Bail to the global
    // profile whenever the two disagree. (GuildMember exposes `.id`; the raw payload nests `.user`.)
    const memberUserId = member.id ?? member.user?.id ?? null;
    if (memberUserId && memberUserId !== interaction.user.id) return null;

    // camelCase first (GuildMember), snake_case second (raw payload). Reading both is what lets one
    // code path serve both shapes without ever branching on which one it got.
    const decorationAsset = member.avatarDecorationData?.asset ?? member.avatar_decoration_data?.asset ?? null;
    const nameplateAsset = member.collectibles?.nameplate?.asset ?? null;
    const rawColors = member.display_name_styles?.colors ?? null;

    const { guildId } = interaction;
    const userId = interaction.user.id;
    const cdn = interaction.client.rest.cdn;

    return {
        guildId,
        // `true` only for case 1 above. Determines whether the REST name-style fallback is even
        // worth attempting -- it 404s otherwise.
        botIsMember: Boolean(interaction.guild),

        avatarHash: member.avatar ?? null,
        // Built from the raw hash through discord.js's own CDN helpers rather than by hand, so this
        // works identically whether or not a GuildMember exists to call .avatarURL() on. An animated
        // hash (a_ prefix) still yields a static first frame at extension:'png', which is what the
        // pixel-sampling extractor needs.
        avatarUrl: member.avatar
            ? cdn.guildMemberAvatar(guildId, userId, member.avatar, { extension: 'png', size: 256 })
            : null,
        avatarFullUrl: member.avatar
            ? cdn.guildMemberAvatar(guildId, userId, member.avatar, { size: 4096 })
            : null,

        bannerHash: member.banner ?? null,
        // 512 for display, 256 for extraction -- the same split getSourceImageInfo already makes for
        // the global banner, and for the same reason (k-means samples ~2500 pixels regardless of
        // resolution, so a bigger fetch buys nothing but decode time).
        bannerUrl: member.banner
            ? cdn.guildMemberBanner(guildId, userId, member.banner, { extension: 'png', size: 512 })
            : null,
        bannerExtractUrl: member.banner
            ? cdn.guildMemberBanner(guildId, userId, member.banner, { extension: 'png', size: 256 })
            : null,
        bannerFullUrl: member.banner
            ? cdn.guildMemberBanner(guildId, userId, member.banner, { size: 4096 })
            : null,

        decorationAsset,
        decorationUrl: decorationAsset ? cdn.avatarDecoration(decorationAsset) : null,

        nameplateAsset,
        // Same manual construction the global path uses -- no discord.js CDN helper exists for this
        // newer collectible type. The asset already ends in a trailing slash.
        nameplateUrl: nameplateAsset
            ? `https://cdn.discordapp.com/assets/collectibles/${nameplateAsset}static.png`
            : null,

        // null here does NOT prove there is no server name style -- in a joined guild discord.js has
        // already thrown the field away by this point. Callers that care must go through
        // fetchGuildNameStyles, which handles that case.
        displayNameColors: normalizeNameStyleColors(rawColors)
    };
}

// Discord returns ONE colour for a solid name style and TWO for a gradient. The global path has
// always required >= 2 and treated anything else as "not set up" -- which silently misclassifies a
// deliberate solid colour as absence. Measured live: a real guild name style came back as the single
// value [2972011] while the same user's global style was the pair [7183099, 6082490].
// Normalizing a solid to a matching pair lets every downstream blend/cache path stay unchanged --
// blending a colour with itself returns that colour.
function normalizeNameStyleColors(colors) {
    if (!Array.isArray(colors) || colors.length === 0) return null;
    if (colors.length === 1) return [colors[0], colors[0]];
    return colors.slice(0, 2);
}

// The recovery path for case 1 only. `GET /guilds/{id}/members/{user}` DOES return
// display_name_styles (verified live, HTTP 200 in a joined guild), and returns 404 Unknown Guild in
// a guild the bot has not joined -- so this is only ever attempted when botIsMember is true, and a
// failure degrades to the global name style rather than surfacing an error.
async function fetchGuildNameStyles(interaction) {
    if (!interaction.guildId || !interaction.guild) return null;
    try {
        const raw = await interaction.client.rest.get(
            Routes.guildMember(interaction.guildId, interaction.user.id)
        );
        return normalizeNameStyleColors(raw.display_name_styles?.colors);
    } catch (err) {
        console.error('Guild name-style fetch failed (falling back to global):', err.message);
        return null;
    }
}

// True when the user has ANY server-specific override in this guild. Drives whether a global/server
// switch is worth offering at all -- with nothing overridden the two views would be identical.
function hasAnyGuildOverride(profile) {
    if (!profile) return false;
    return Boolean(
        profile.avatarHash || profile.bannerHash ||
        profile.decorationAsset || profile.nameplateAsset ||
        profile.displayNameColors
    );
}

module.exports = { readGuildProfile, fetchGuildNameStyles, hasAnyGuildOverride, normalizeNameStyleColors };
