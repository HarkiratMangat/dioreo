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
const { deriveNameplateName, nameplateNameFromAsset } = require('./nameplatePalettes');

// A null hash means "no override in this guild" -- NOT "no avatar". Discord only populates these
// when the user has actually set a server-specific one, so null is the signal to fall through to the
// global profile. (This is why an early reading of `collectibles: null` was misread as "nameplates
// cannot be per-server" -- it only meant none was set at the time.)
// Discord marks an animated avatar/banner/decoration by prefixing its asset hash with `a_`. That one
// prefix is the ONLY signal available before fetching anything, and it decides whether colour
// extraction has to sample the whole animation (see utils/stillFrame.js) or can take the cheap direct
// path. Shared rather than duplicated because colorPalette.js needs exactly the same test for the
// global (non-guild) sources.
function isAnimatedHash(hash) {
    return typeof hash === 'string' && hash.startsWith('a_');
}

function readGuildProfile(interaction) {
    // ⚠️ There is deliberately NO stored preference gating this (a `profileSource` field was built
    // and removed 2026-08-09 17:12 EDT). Which profile applies is decided by WHERE the command was
    // run: no guild context means no server profile, full stop. A saved setting would only restate
    // that. The single override is /colors' `from:` option, which passes a variant explicitly.
    const member = interaction.member;
    if (!member || !interaction.guildId) return null;

    // ⚠️ `member` always describes whoever CLICKED, while `.user` is whose data we are rendering --
    // and those diverge on the admin-override path, where utils/interactionContext.js's resolvePanelActor builds a
    // synthetic interaction with `.user` swapped to the panel's owner but `.member` left as the
    // admin's. Reading the guild profile there would paint the admin's own server avatar onto
    // someone else's panel: no error, just quietly the wrong person's colors. Bail to the global
    // profile whenever the two disagree. (GuildMember exposes `.id`; the raw payload nests `.user`.)
    const memberUserId = member.id ?? member.user?.id ?? null;
    if (memberUserId && memberUserId !== interaction.user.id) return null;

    // camelCase first (GuildMember), snake_case second (raw payload). Reading both is what lets one
    // code path serve both shapes without ever branching on which one it got.
    //
    // ⚠️ THE RENAME IS PER-FIELD, NOT PER-OBJECT -- fixed 2026-08-11 09:57 EDT, and the version of
    // this block that shipped before it got this exactly backwards on the id fields. discord.js does
    // not hand back the raw sub-object under a camelCase name; it REBUILDS it and renames the keys
    // inside (`GuildMember._patch`'s avatar_decoration_data block, and Transformers.js's
    // `_transformCollectibles`), so on a GuildMember it is `skuId`, never `sku_id`:
    //
    //     avatarDecorationData = { asset, skuId }              <- sku_id is GONE at this level
    //     collectibles.nameplate = { skuId, asset, label, palette }
    //
    // The old `member.avatarDecorationData?.sku_id ?? member.avatar_decoration_data?.sku_id` therefore
    // read the snake_case name under BOTH branches and resolved to null in every guild the bot has
    // JOINED -- it only ever looked dual-shape. `asset`/`label`/`palette` keep their names through the
    // transform, which is why those four came through fine and masked the two that didn't.
    const decorationAsset = member.avatarDecorationData?.asset ?? member.avatar_decoration_data?.asset ?? null;
    const decorationSkuId = member.avatarDecorationData?.skuId ?? member.avatar_decoration_data?.sku_id ?? null;

    // One local for the whole nameplate object -- the shape difference is inside it, not around it.
    const nameplate = member.collectibles?.nameplate ?? null;
    const nameplateAsset = nameplate?.asset ?? null;
    // Palette ENUM NAME, mirroring accentColor.js's fetchProfileExtras -- turned into a hex only by
    // utils/nameplatePalettes.js's nameplatePaletteHex(), never guessed here.
    const nameplatePalette = nameplate?.palette ?? null;
    const nameplateSkuId = nameplate?.skuId ?? nameplate?.sku_id ?? null;
    // Design name, mirroring accentColor.js's fetchProfileExtras. The asset-path fallback covers a
    // payload that carries no `label` at all -- without it the design heads its PERMANENT
    // cache-channel entry as the generic "Nameplate", which is a wrong value written into a cache
    // nothing revisits. See nameplatePalettes.js for why the label stays primary.
    const nameplateName = deriveNameplateName(nameplate?.label) ?? nameplateNameFromAsset(nameplateAsset);
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
        // works identically whether or not a GuildMember exists to call .avatarURL() on.
        // ⚠️ CORRECTED 2026-08-11 01:55 EDT. This comment used to say an animated (a_ prefix) hash
        // "still yields a static first frame at extension:'png', which is what the pixel-sampling
        // extractor needs." The first half is true; the second half was wrong and was costing real
        // colour. One frame is not a fair sample of an animation -- measured on a real animated banner
        // whose pale opening blooms into crimson flowers only after frame ~34, the first frame loses
        // 83% of the image's peak chroma. `*AnimatedUrl` below is the source the extractor should
        // sample across; `*Url` stays the static one, which is still correct for DISPLAY.
        avatarUrl: member.avatar
            ? cdn.guildMemberAvatar(guildId, userId, member.avatar, { extension: 'png', size: 256 })
            : null,
        avatarAnimatedUrl: isAnimatedHash(member.avatar)
            ? cdn.guildMemberAvatar(guildId, userId, member.avatar, { extension: 'gif', size: 256 })
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
        bannerAnimatedUrl: isAnimatedHash(member.banner)
            ? cdn.guildMemberBanner(guildId, userId, member.banner, { extension: 'gif', size: 256 })
            : null,
        bannerFullUrl: member.banner
            ? cdn.guildMemberBanner(guildId, userId, member.banner, { size: 4096 })
            : null,

        decorationAsset,
        // ⚠️ RETURNED, not just computed -- added 2026-08-11 09:58 EDT. `decorationSkuId`,
        // `nameplateSkuId` and `nameplateName` were all derived at the top of this function and then
        // silently dropped on the floor: the returned object never carried them, so
        // `utils/colorPalette.js`'s `guildProfile.nameplateSkuId`/`.nameplateName` reads were
        // `undefined` for every server profile. That is what headed a server-equipped nameplate as the
        // generic "Nameplate" with no SKU line in the permanent cache channel, while a global one
        // (which goes through accentColor.js's fetchProfileExtras, whose return DOES include them)
        // rendered correctly. A computed-but-unreturned local is invisible to every caller and to any
        // search for the field name, which is why this survived a review that read the derivation and
        // assumed the plumbing.
        decorationSkuId,
        decorationUrl: decorationAsset ? cdn.avatarDecoration(decorationAsset) : null,

        nameplateAsset,
        nameplateSkuId,
        nameplateName,
        // Same manual construction the global path uses -- no discord.js CDN helper exists for this
        // newer collectible type. The asset already ends in a trailing slash.
        nameplateUrl: nameplateAsset
            ? `https://cdn.discordapp.com/assets/collectibles/${nameplateAsset}static.png`
            : null,
        // Mirrors accentColor.js's fetchProfileExtras -- the SKU-addressed `/animated` endpoint, not the
        // asset path (pivoted 2026-08-15 09:30 EDT from the old `asset.webm` route once a real APNG
        // variant was confirmed for nameplates too, matching decorations). The cache below keys on the
        // asset+palette pair, not on guild vs global, so a server-equipped nameplate transparently
        // reuses the same cached render as the global one.
        nameplateAnimatedUrl: nameplateSkuId
            ? `https://cdn.discordapp.com/media/v1/collectibles-shop/${nameplateSkuId}/animated`
            : null,
        nameplatePalette,

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

module.exports = { readGuildProfile, fetchGuildNameStyles, hasAnyGuildOverride, normalizeNameStyleColors, isAnimatedHash };
