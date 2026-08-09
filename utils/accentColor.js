// utils/accentColor.js
const { Routes } = require('discord.js');
const { getDominantColor } = require('./colorExtract');
const { extractStillFrame } = require('./stillFrame');
const { readGuildProfile, fetchGuildNameStyles, normalizeNameStyleColors } = require('./guildProfile');

// Shared throttle for anything that needs a LIVE fetch to see fresh data (2026-07-13) -- unlike
// avatar (whose hash arrives fresh on every interaction payload for free, see
// getAccentColorForCommand below), none of banner/Display Name Styles/decoration/nameplate are
// included in that lightweight payload, so there's no free signal to detect a change short of an
// actual live fetch. Force-fetching on every single click reintroduces the same per-click Discord
// round-trip the avatar path was fixed to avoid, so these all instead cache their fetched value
// per-user for RECHECK_WINDOW_MS and reuse it for any button/select re-render inside that window --
// a real change still shows up within one recheck window, but rapid clicks (pagination, toggles)
// skip the network call entirely. A genuine slash-command invocation always bypasses the window and
// fetches fresh (see the isChatInputCommand check in getThrottledFetch below) -- a user who changes
// one of these and immediately runs a brand new command shouldn't see a stale value just because
// some earlier click happened to warm the cache.
const bannerRecheckCache = new Map(); // userId -> { checkedAt, value: userFetch }
const profileExtrasRecheckCache = new Map(); // userId -> { checkedAt, value: fetchProfileExtras() result }
// Guild name styles are the ONE per-server source that cannot be read from the interaction payload
// in a guild the bot has joined (discord.js's GuildMember drops display_name_styles), so they need
// their own throttled REST fetch -- and unlike the two above, this one IS guild-dependent, so its key
// must carry the guild id. Keyed `${userId}:${guildId}`; a plain userId key would serve one server's
// name colors in another server for up to 15 minutes, silently and with no error.
//   ⚠️ The two caches above deliberately stay keyed by userId ALONE and must not be "fixed" to match:
//   both hold GLOBAL profile data (client.users.fetch and GET /users/{id}), which does not vary by
//   guild. Adding a guild id there would fragment a correct cache into one entry per server.
const guildNameStylesRecheckCache = new Map(); // `${userId}:${guildId}` -> { checkedAt, value }
const RECHECK_WINDOW_MS = 15 * 60 * 1000;

async function getThrottledFetch(cache, userId, isChatInputCommand, fetchFn) {
    const now = Date.now();
    const cached = cache.get(userId);
    if (!isChatInputCommand && cached && now - cached.checkedAt < RECHECK_WINDOW_MS) {
        return cached.value;
    }
    const value = await fetchFn();
    cache.set(userId, { checkedAt: now, value });
    return value;
}

// None of display_name_styles/avatar_decoration_data/collectibles.nameplate are parsed by
// discord.js's own User class -- confirmed against the installed v14.26.4, User._patch() has no
// handling for display_name_styles at all (unlike collectibles/primary_guild, which it DOES parse,
// just not the color-relevant nameplate.palette sub-field in a usable form), so even a force-fetched
// client.users.fetch() silently drops the field we actually need. The only way to read it is one raw
// REST call that bypasses the User model entirely (same client.rest object every V2 command already
// uses for rest.patch('@original'), just a GET here instead) -- fetched ONCE and reused for all
// three sources rather than three separate round-trips.
//   - displayNameColors: the user's 2-stop name gradient, or null if not set up.
//   - decorationUrl: CDN URL for the avatar decoration PNG (client.rest.cdn.avatarDecoration, the
//     same helper discord.js's own User#avatarDecorationURL uses), or null if none equipped.
//   - nameplateUrl: CDN URL for the nameplate's static PNG preview. No discord.js CDN helper exists
//     for this newer collectible type, so the URL is built manually -- verified live against
//     Discord's CDN (asset already ends in a trailing slash, `static.png` is the correct static-
//     preview filename; `asset.webm` also exists but is an animated video, not usable by
//     getDominantColor's still-image pixel sampling).
async function fetchProfileExtras(client, userId) {
    const raw = await client.rest.get(Routes.user(userId));
    const colors = raw.display_name_styles?.colors;
    const decorationAsset = raw.avatar_decoration_data?.asset || null;
    const nameplateAsset = raw.collectibles?.nameplate?.asset || null;
    return {
        // A SOLID name style returns a single color, a gradient returns two. This used to demand
        // `colors.length >= 2` and treat one color as "not set up" -- which silently reclassified a
        // deliberate solid choice as absence and fell back to avatar. normalizeNameStyleColors pairs
        // a solid with itself so the blend path returns that exact color unchanged. Found via a real
        // per-server style (2026-08-09 13:10 EDT) that was a single color, but the bug was never
        // guild-specific: a global solid style was mishandled the same way the whole time.
        displayNameColors: normalizeNameStyleColors(colors),
        decorationAsset,
        decorationUrl: decorationAsset ? client.rest.cdn.avatarDecoration(decorationAsset) : null,
        nameplateAsset,
        nameplateUrl: nameplateAsset ? `https://cdn.discordapp.com/assets/collectibles/${nameplateAsset}static.png` : null
    };
}
// Kept as a thin convenience wrapper -- settings.js only ever needs the name-color gradient, not the
// full extras bundle, so it's not worth making every caller destructure the whole object.
async function fetchDisplayNameColors(client, userId) {
    return (await fetchProfileExtras(client, userId)).displayNameColors;
}

// Blends the user's two chosen Display Name Styles gradient stops into one representative hex,
// since a Components V2 Container's accent_color can only ever be a single flat color, not a
// gradient. A simple midpoint average is appropriate here -- unlike the flat pixel-average approach
// rejected for avatar/banner extraction (see colorExtract.js's revision history) -- because these
// are exactly TWO deliberate, user-picked anchor colors straight from Discord, not thousands of
// noisy image pixels; averaging them fairly represents both ends without arbitrarily favoring one.
function blendGradientColors([first, second]) {
    const r1 = (first >> 16) & 0xff, g1 = (first >> 8) & 0xff, b1 = first & 0xff;
    const r2 = (second >> 16) & 0xff, g2 = (second >> 8) & 0xff, b2 = second & 0xff;
    return (Math.round((r1 + r2) / 2) << 16) | (Math.round((g1 + g2) / 2) << 8) | Math.round((b1 + b2) / 2);
}

// Per-command containers ship their own fixed brand color (Police Blue, Chinese Violet, etc. —
// see the palette in CLAUDE.md). This resolver lets a user override that on a per-preference
// basis via /settings' "Accent Color Style" option:
//   - 'preset'         : each command keeps its own preset color, EXCEPT /settings itself (which has
//                         no fixed brand color of its own) falls back to the user's avatar color
//                         instead. Callers signal this via `defaultBehavior: 'avatar'`. ("Pre-
//                         Designed Palette" in the /settings UI.) 'default' is the old value name for
//                         this same option — treated identically for pre-existing saved docs.
//   - 'avatar'         : every container uses a color extracted from the user's avatar. The real
//                         default (UserPreference.js's schema default), not 'preset'.
//   - 'banner'         : every container uses a color extracted from the user's banner. Falls back to
//                         avatar if the user has no banner set at all.
//   - 'displayName'    : every container uses a color blended from the user's Nitro Display Name
//                         Styles gradient. Falls back to avatar if not set up.
//   - 'dynamicProfile' : NOT a single deterministic style like the others — see
//                         resolveDynamicProfileColor below, which randomly picks between every
//                         source the user has available on each new slash-command launch and holds
//                         that pick steady across re-renders of that message. Routed around this
//                         resolver entirely by getAccentColorForCommand/settings.js, since it needs
//                         `interaction` (for message-based pick caching) rather than just a
//                         pre-resolved `userFetch`.
// Only the currently-needed source is fetched+extracted on any given call — every source is cached
// independently on UserPreference so switching styles back and forth doesn't re-hit the Discord
// CDN/API or re-run pixel averaging/blending unless the underlying source actually changed.
async function resolveAccentColor({ prefs, userFetch, presetHex, defaultBehavior = 'preset', displayNameColors = null, guildProfile = null, isGuildNameStyle = false }) {
    const rawStyle = prefs.accentColorStyle || 'preset';
    const effectiveStyle = (rawStyle === 'default' || rawStyle === 'preset') ? defaultBehavior : rawStyle;

    if (effectiveStyle === 'preset') return presetHex;

    // "Banner" style with no banner uploaded has nothing to extract from — fall back to avatar.
    // A server-specific banner counts: someone with no global banner but one set in this guild has a
    // real banner to extract from, so checking only userFetch.banner would wrongly send them to the
    // avatar fallback.
    if (effectiveStyle === 'banner' && !userFetch.banner && !guildProfile?.bannerHash) {
        return getCachedColor(prefs, 'avatar', userFetch, presetHex, guildProfile);
    }

    // "Display Name Colors" style with no Nitro name style set up has nothing to blend — fall back
    // to avatar. The one-time "hey, set this up" notice lives in index.js's set_accent_style
    // handler (fires right when the user picks this option), not here — this resolver just needs to
    // always return SOME usable color, silently, on every future render.
    if (effectiveStyle === 'displayName') {
        if (!displayNameColors) return getCachedColor(prefs, 'avatar', userFetch, presetHex, guildProfile);
        return getCachedDisplayNameColor(prefs, displayNameColors, isGuildNameStyle);
    }

    return getCachedColor(prefs, effectiveStyle, userFetch, presetHex, guildProfile);
}

// Shared caching primitive: a hex value cached against a source identifier (image hash, asset hash,
// or a joined color pair — whatever uniquely identifies "has this actually changed"), recomputed via
// getDominantColor only when that identifier changes. avatar/banner/decoration/nameplate all funnel
// through this; displayName doesn't (it blends two known colors directly, no image download needed
// at all — see getCachedDisplayNameColor below).
async function getCachedColorFromUrl(prefs, hexField, sourceField, url, sourceHash, fallbackHex, label) {
    if (prefs[hexField] != null && prefs[sourceField] === sourceHash) {
        return prefs[hexField];
    }
    let hex;
    try {
        hex = await getDominantColor(url);
    } catch (err) {
        // Wording deliberately doesn't assume "falling back to preset" -- fallbackHex is `null` when
        // called from the Dynamic Profile Colors pool (that source gets excluded, not substituted;
        // see buildDynamicColorPool's own comment), and only actually IS the preset when called from
        // a deterministic single-style resolver like getCachedColor.
        console.error(`Accent color extraction failed for ${label} (falling back to ${fallbackHex != null ? 'preset' : 'exclusion from pool'}):`, err.message);
        return fallbackHex;
    }
    prefs[hexField] = hex;
    prefs[sourceField] = sourceHash;
    await prefs.save();
    return hex;
}

async function getCachedColor(prefs, kind, userFetch, fallbackHex, guildProfile = null) {
    const isAvatar = kind === 'avatar';

    // A per-server override wins over the global profile for this source. A null hash means the user
    // set no override in this guild -- NOT that they have no image -- so it falls through below.
    // Cached under its own guild* field pair so the two contexts coexist instead of evicting each
    // other; still keyed on the image hash, which is what makes the same server profile reused
    // across several guilds a cache HIT rather than a recompute.
    const guildHash = guildProfile && (isAvatar ? guildProfile.avatarHash : guildProfile.bannerHash);
    if (guildHash) {
        return getCachedColorFromUrl(prefs,
            isAvatar ? 'guildAvatarColorHex' : 'guildBannerColorHex',
            isAvatar ? 'guildAvatarColorSource' : 'guildBannerColorSource',
            isAvatar ? guildProfile.avatarUrl : guildProfile.bannerUrl,
            guildHash, fallbackHex, `guild ${kind}`);
    }

    // ⚠️ `|| 'default'` is correct ONLY because userFetch is always a User here, never a GuildMember.
    // A User with no avatar gets Discord's generated default, whose URL derives from the account id
    // and never changes, so a single shared 'default' bucket can never go stale. A GuildMember would
    // break exactly that: its .avatar is the GUILD avatar and is null whenever there is no override,
    // while displayAvatarURL() still returns the real, changeable GLOBAL image -- so every
    // override-less member would collide in one bucket and stop invalidating when their global
    // avatar changed. Per-server sources are routed through guildProfile above so a GuildMember
    // never reaches this line.
    const sourceHash = isAvatar ? (userFetch.avatar || 'default') : userFetch.banner;
    const url = isAvatar
        ? userFetch.displayAvatarURL({ extension: 'png', size: 256 })
        : userFetch.bannerURL({ extension: 'png', size: 512 });
    return getCachedColorFromUrl(prefs, isAvatar ? 'avatarColorHex' : 'bannerColorHex',
        isAvatar ? 'avatarColorSource' : 'bannerColorSource', url, sourceHash, fallbackHex, kind);
}

// Resolves the guild name-style gradient, which is the one per-server source with two possible
// origins. In a guild the bot has NOT joined it arrives free in the interaction payload; in a guild
// it HAS joined discord.js has already discarded it, so it needs a throttled REST member fetch (the
// same call that 404s in the other case). Returns null when there is no server-specific style, which
// callers read as "use the global one".
async function resolveGuildNameColors(interaction, guildProfile, isChatInputCommand) {
    if (!guildProfile) return null;
    if (guildProfile.displayNameColors) return guildProfile.displayNameColors;
    if (!guildProfile.botIsMember) return null;
    return getThrottledFetch(
        guildNameStylesRecheckCache,
        `${interaction.user.id}:${guildProfile.guildId}`,
        isChatInputCommand,
        () => fetchGuildNameStyles(interaction)
    );
}

// Decorations are commonly served as animated PNG -- see utils/stillFrame.js. Cache-hit check runs
// first (mirroring getCachedColorFromUrl's own check) so a hit never pays for a still-unnecessary
// ffmpeg download+extract.
async function getCachedDecorationColor(prefs, url, asset, fallbackHex, isGuild = false) {
    const hexField = isGuild ? 'guildDecorationColorHex' : 'decorationColorHex';
    const sourceField = isGuild ? 'guildDecorationColorSource' : 'decorationColorSource';
    if (prefs[hexField] != null && prefs[sourceField] === asset) {
        return prefs[hexField];
    }
    let stillFrame;
    try {
        stillFrame = await extractStillFrame(url);
    } catch (err) {
        console.error('Still-frame extraction failed for decoration:', err.message);
        return fallbackHex;
    }
    return getCachedColorFromUrl(prefs, hexField, sourceField, stillFrame, asset, fallbackHex,
        isGuild ? 'guild decoration' : 'decoration');
}

function getCachedNameplateColor(prefs, url, asset, fallbackHex, isGuild = false) {
    return getCachedColorFromUrl(prefs,
        isGuild ? 'guildNameplateColorHex' : 'nameplateColorHex',
        isGuild ? 'guildNameplateColorSource' : 'nameplateColorSource',
        url, asset, fallbackHex, isGuild ? 'guild nameplate' : 'nameplate');
}

// displayNameColorSource stores the raw two-color pair joined by a comma -- there's no single
// "image hash" to key off of here like avatar/banner, so a cache invalidates only when the user's
// actual chosen colors change, not on every render.
async function getCachedDisplayNameColor(prefs, colors, isGuild = false) {
    // Guild name styles cache under their own field pair for the same reason avatar/banner do -- a
    // user with both a global and a server style would otherwise evict one with the other on every
    // context switch. The joined color pair remains the identity either way.
    const hexField = isGuild ? 'guildDisplayNameColorHex' : 'displayNameColorHex';
    const sourceField = isGuild ? 'guildDisplayNameColorSource' : 'displayNameColorSource';
    const sourceHash = colors.join(',');
    if (prefs[hexField] != null && prefs[sourceField] === sourceHash) {
        return prefs[hexField];
    }
    const hex = blendGradientColors(colors);
    prefs[hexField] = hex;
    prefs[sourceField] = sourceHash;
    await prefs.save();
    return hex;
}

// DYNAMIC PROFILE COLORS (2026-07-13) -- the one style that's genuinely randomized rather than a
// single deterministic pick. On every genuine NEW slash-command launch, gathers every color source
// the user actually has available (avatar always; banner/displayName/decoration/nameplate only if
// set) and picks one at random. Button/select re-renders of that SAME message must NOT re-roll --
// they reuse whatever was picked when the message was first created.
//
// The re-render side is easy: a button/select interaction already carries `interaction.message.id`
// for free (no extra fetch), so it's used directly as the cache key. The INITIAL command side is the
// hard part -- at the point this runs, the command has only deferReply()'d, so no message exists yet
// to key off of. Rather than invent custom_id plumbing across every pagination/toggle button in 5+
// command files just to carry a seed forward, this pays ONE extra `interaction.fetchReply()` call
// (fetches the placeholder message deferReply() already created) to learn the real message id right
// after picking -- but only once per genuine command launch under this specific opt-in style, never
// on a per-click hot path. dynamicColorCache entries expire after DYNAMIC_COLOR_TTL_MS purely to
// bound memory on a long-running process (interaction tokens on button clicks stay valid far longer
// than that) -- a click on a message old enough to have aged out just gracefully re-rolls a fresh
// pick rather than erroring, since a picked-but-now-forgotten color is a cosmetic inconsistency, not
// a functional break.
const dynamicColorCache = new Map(); // messageId -> chosen hex
const DYNAMIC_COLOR_TTL_MS = 24 * 60 * 60 * 1000;

async function buildDynamicColorPool(interaction, prefs, presetHex) {
    const isChatInputCommand = interaction.isChatInputCommand();
    const pool = [];

    // Every source below is pushed with `null` as its fallback (NOT presetHex) -- an extraction
    // failure here should EXCLUDE that source from the pool, not silently substitute the command's
    // generic brand color as if it were one of the user's own profile colors. Decoration used to
    // ALWAYS fail this way (Discord serves avatar decorations as animated PNG, which Jimp can't
    // decode directly) until getCachedDecorationColor started routing through utils/stillFrame.js's
    // ffmpeg-based single-frame extraction -- decoration is now a real, usually-succeeding pool
    // source, not a guaranteed exclusion. This null-fallback pattern stays regardless, as a safety
    // net for any OTHER genuine failure (network hiccup, ffmpeg unavailable in some environment,
    // etc.) -- still correct to exclude rather than substitute in those cases too. The final
    // `.filter(hex => hex != null)` below drops every excluded source; resolveDynamicProfileColor's
    // own presetHex fallback only ever kicks in if EVERY source fails (pool ends up empty).

    // Each source independently prefers this guild's override and falls back to the global profile,
    // so the pool reflects the profile the user actually presents in the place they ran the command
    // -- mixing, say, a server avatar with a global nameplate when only the avatar is overridden.
    const guildProfile = readGuildProfile(interaction);

    // Avatar -- always available, free (interaction.user already has the current hash).
    pool.push(await getCachedColor(prefs, 'avatar', interaction.user, null, guildProfile));

    // Banner -- only if the user actually has one set. A server banner is already in hand, so the
    // global force-fetch is skipped when one exists.
    let userFetch = interaction.user;
    if (!guildProfile?.bannerHash) {
        userFetch = await getThrottledFetch(bannerRecheckCache, interaction.user.id, isChatInputCommand,
            () => interaction.client.users.fetch(interaction.user.id, { force: true }));
    }
    if (guildProfile?.bannerHash || userFetch.banner) {
        pool.push(await getCachedColor(prefs, 'banner', userFetch, null, guildProfile));
    }

    // Display Name Colors / Avatar Decoration / Nameplate -- one combined raw REST call covers all
    // three GLOBAL values instead of three separate round-trips. The guild equivalents came free
    // with the interaction, so each is preferred over its global counterpart below.
    const extras = await getThrottledFetch(profileExtrasRecheckCache, interaction.user.id, isChatInputCommand,
        () => fetchProfileExtras(interaction.client, interaction.user.id));

    const guildNameColors = await resolveGuildNameColors(interaction, guildProfile, isChatInputCommand);
    if (guildNameColors) pool.push(await getCachedDisplayNameColor(prefs, guildNameColors, true));
    else if (extras.displayNameColors) pool.push(await getCachedDisplayNameColor(prefs, extras.displayNameColors));

    if (guildProfile?.decorationUrl) {
        pool.push(await getCachedDecorationColor(prefs, guildProfile.decorationUrl, guildProfile.decorationAsset, null, true));
    } else if (extras.decorationUrl) {
        pool.push(await getCachedDecorationColor(prefs, extras.decorationUrl, extras.decorationAsset, null));
    }

    if (guildProfile?.nameplateUrl) {
        pool.push(await getCachedNameplateColor(prefs, guildProfile.nameplateUrl, guildProfile.nameplateAsset, null, true));
    } else if (extras.nameplateUrl) {
        pool.push(await getCachedNameplateColor(prefs, extras.nameplateUrl, extras.nameplateAsset, null));
    }

    return pool.filter((hex) => hex != null);
}

async function resolveDynamicProfileColor(interaction, prefs, presetHex) {
    const isChatInputCommand = interaction.isChatInputCommand();

    if (!isChatInputCommand && interaction.message?.id) {
        const cached = dynamicColorCache.get(interaction.message.id);
        if (cached != null) return cached;
        // Cache miss on a re-render (TTL expired, or the bot restarted since this message's
        // original command launch, since this cache is in-memory only) -- falls through to a fresh
        // pick below rather than erroring. This is the one edge case where a button click CAN end up
        // changing the color, deliberately accepted as better than a broken render.
    }

    const pool = await buildDynamicColorPool(interaction, prefs, presetHex);
    const chosen = pool.length ? pool[Math.floor(Math.random() * pool.length)] : presetHex;

    if (isChatInputCommand) {
        try {
            const reply = await interaction.fetchReply();
            dynamicColorCache.set(reply.id, chosen);
            setTimeout(() => dynamicColorCache.delete(reply.id), DYNAMIC_COLOR_TTL_MS).unref();
        } catch (err) {
            console.error('Failed to cache Dynamic Profile Colors pick (interaction likely expired):', err.message);
        }
    }
    return chosen;
}

// Convenience wrapper for the preset-brand-color commands (calendar/draws/patchnotes/drawprices/
// seasonend). Pre-Designed Palette is the real default again (flipped back 2026-08-08 00:25 EDT,
// see resolveAccentColor above), so most users hit the cheap presetHex return below without ever
// needing avatar color resolved+cached -- that path is now the minority, for whoever's explicitly
// picked "Avatar Color" in /settings.
async function getAccentColorForCommand(interaction, prefs, presetHex) {
    const UserPreference = require('../models/UserPreference');

    // A user's very first interaction with the bot (any command, not just /settings) has no saved
    // prefs doc yet at all -- create one now so the accentColorStyle schema default ('preset') can
    // actually be read AND its computed color cached. Without this, `prefs` would just be null and
    // the whole accent-color system would silently never engage until the user happened to run
    // /settings first (the only command that used to create this doc).
    if (!prefs) {
        prefs = new UserPreference({ discordId: interaction.user.id });
        await prefs.save();
    }

    if (prefs.accentColorStyle === 'default' || prefs.accentColorStyle === 'preset') {
        return presetHex;
    }

    if (prefs.accentColorStyle === 'dynamicProfile') {
        return resolveDynamicProfileColor(interaction, prefs, presetHex);
    }

    // Only 'banner'/'displayName' actually need a fresh API call -- neither is included in the
    // partial user object Discord sends with an interaction, so those are the cases that have to
    // bypass discord.js's own cache to see them. 'avatar' (the default) doesn't: interaction.user
    // already carries the current avatar hash, and getCachedColor only needs that hash plus
    // displayAvatarURL(), both of which interaction.user already has. This used to force-fetch
    // unconditionally on every call for banner -- a real Discord REST round-trip on every single
    // pagination/button click regardless of whether the color cache was about to hit -- which showed
    // up as a noticeable hesitation between a button's defer-ack and its actual content update.
    const rawStyle = prefs.accentColorStyle || 'preset';
    let userFetch = interaction.user;
    let displayNameColors = null;
    let isGuildNameStyle = false;
    const isChatInputCommand = interaction.isChatInputCommand();
    // Free: the invoker's server-profile overrides are already in the interaction payload, in every
    // guild -- including guilds the bot has never joined. Null in DMs.
    const guildProfile = readGuildProfile(interaction);

    if (rawStyle === 'banner') {
        // A server banner is already in hand, and it outranks the global one, so the force-fetch
        // (a genuine Discord REST round-trip on the click path this whole function was once
        // optimized to avoid) is skipped entirely rather than fetched and then discarded.
        if (!guildProfile?.bannerHash) {
            userFetch = await getThrottledFetch(bannerRecheckCache, interaction.user.id, isChatInputCommand,
                () => interaction.client.users.fetch(interaction.user.id, { force: true }));
        }
    } else if (rawStyle === 'displayName') {
        displayNameColors = await resolveGuildNameColors(interaction, guildProfile, isChatInputCommand);
        isGuildNameStyle = Boolean(displayNameColors);
        if (!displayNameColors) {
            displayNameColors = await getThrottledFetch(profileExtrasRecheckCache, interaction.user.id, isChatInputCommand,
                () => fetchProfileExtras(interaction.client, interaction.user.id)).then(extras => extras.displayNameColors);
        }
    }
    return resolveAccentColor({ prefs, userFetch, presetHex, defaultBehavior: 'preset', displayNameColors, guildProfile, isGuildNameStyle });
}

module.exports = {
    resolveAccentColor,
    getAccentColorForCommand,
    fetchDisplayNameColors,
    fetchProfileExtras,
    resolveDynamicProfileColor,
    resolveGuildNameColors
};
