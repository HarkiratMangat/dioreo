// utils/colorPalette.js -- backs /settings' "View Colors" panel. Separate concern from
// utils/accentColor.js (which resolves ONE hex per command render): this computes/caches the FULL
// 6-swatch breakdown per source for a dedicated browsing UI, not something every command needs on
// every render.
const { getColorPalette } = require('./colorExtract');
const { fetchProfileExtras, resolveGuildNameColors } = require('./accentColor');
const { extractStillFrame } = require('./stillFrame');
const { readGuildProfile, hasAnyGuildOverride } = require('./guildProfile');

// Per-source color counts (2026-07-14, Harkirat's request) -- avatar/banner are richer, more
// complex images that support more genuinely distinct clusters; nameplate/decoration are smaller,
// simpler assets (confirmed empirically earlier this session: nameplate/decoration extractions
// regularly produced fewer real distinct clusters even at K=8), so they ask for fewer up front
// instead of padding out to a count the source doesn't actually support.
const PALETTE_COUNTS = { avatar: 8, banner: 8, nameplate: 4, decoration: 4 };

// Every image-backed source's URL + the asset-hash identity it should be cached against. Mirrors
// exactly what utils/accentColor.js already resolves for the single-hex accent system -- avatar's
// hash/URL come straight off interaction.user (free, no fetch), banner/decoration/nameplate need a
// live fetch (force-fetched User object for banner, one combined raw REST call for the other two).
async function getSourceImageInfo(interaction, useGuild = false) {
    // Per-server overrides (2026-08-09 13:50 EDT). Resolved PER SOURCE, not all-or-nothing: someone
    // with a server avatar but no server banner sees their server avatar and their ordinary banner,
    // which is what Discord itself shows in that server. A source with no override simply falls
    // through to the global block below, so `useGuild` never produces an empty page.
    const guildProfile = useGuild ? readGuildProfile(interaction) : null;

    const avatar = guildProfile?.avatarHash
        ? {
            url: guildProfile.avatarUrl,
            fullUrl: guildProfile.avatarFullUrl,
            source: guildProfile.avatarHash
          }
        : {
            url: interaction.user.displayAvatarURL({ extension: 'png', size: 256 }),
            // Full-res (2026-07-18, v2 quick-wins batch) -- backs the panel's own Download Avatar
            // button, same 4096px size /settings' existing download link already uses.
            fullUrl: interaction.user.displayAvatarURL({ size: 4096 }),
            source: interaction.user.avatar || 'default'
          };

    // The global fetches are skipped entirely when the guild profile already answers every source --
    // the payload carries all of them, so a fully-overridden server profile costs ZERO network calls
    // where the global path costs two (a forced user fetch plus a raw REST call).
    // ⚠️ displayNameColors belongs in this condition and it is easy to leave out. It is the one
    // source the payload does NOT carry in a guild the bot has joined, so without it a fully-
    // overridden profile there would skip the global fetch and then find no name colours to fall
    // back to -- a page that silently goes blank for someone who does have a global name style.
    const needsGlobal = !guildProfile
        || !guildProfile.bannerHash || !guildProfile.decorationAsset
        || !guildProfile.nameplateAsset || !guildProfile.displayNameColors;
    const [userFetch, extras] = needsGlobal
        ? await Promise.all([
            interaction.client.users.fetch(interaction.user.id, { force: true }),
            fetchProfileExtras(interaction.client, interaction.user.id)
          ])
        : [{ banner: null }, { decorationUrl: null, nameplateUrl: null, displayNameColors: null }];

    // DECOUPLED display vs extraction resolution (2026-07-14): `url` is the FULL-size 512px banner
    // shown in the panel's Media Gallery preview (restoring the size it displayed at before the CPU
    // pass -- dropping it to 256 shrank the visible preview, a real regression). `extractUrl` is a
    // small 256px copy used ONLY for color extraction, which halves the pixels Jimp has to decode
    // synchronously on Render's free-tier CPU (k-means only samples ~2500 pixels regardless of source
    // resolution, so 256 is quality-equivalent for clustering -- it just isn't big enough to DISPLAY).
    const banner = guildProfile?.bannerHash
        ? {
            url: guildProfile.bannerUrl,
            extractUrl: guildProfile.bannerExtractUrl,
            fullUrl: guildProfile.bannerFullUrl,
            source: guildProfile.bannerHash
          }
        : userFetch.banner
        ? {
            url: userFetch.bannerURL({ extension: 'png', size: 512 }),
            extractUrl: userFetch.bannerURL({ extension: 'png', size: 256 }),
            // Full-res (2026-07-18, v2 quick-wins batch) -- backs the panel's own Download Banner
            // button, same 4096px size /settings' existing download link already uses.
            fullUrl: userFetch.bannerURL({ size: 4096 }),
            source: userFetch.banner
          }
        : null;
    // needsStillFrame: decorations are commonly served as animated PNG -- see utils/stillFrame.js.
    // Nameplate's `static.png` (built in fetchProfileExtras) is already guaranteed a real static
    // image, so it doesn't need this extra ffmpeg step.
    const decoration = guildProfile?.decorationAsset
        ? { url: guildProfile.decorationUrl, source: guildProfile.decorationAsset, needsStillFrame: true }
        : extras.decorationUrl
        ? { url: extras.decorationUrl, source: extras.decorationAsset, needsStillFrame: true }
        : null;
    const nameplate = guildProfile?.nameplateAsset
        ? { url: guildProfile.nameplateUrl, source: guildProfile.nameplateAsset }
        : extras.nameplateUrl
        ? { url: extras.nameplateUrl, source: extras.nameplateAsset }
        : null;

    // Name colours are the one source with two possible origins in a guild -- free from the payload
    // where the bot isn't a member, one REST call where it is (discord.js drops the field there).
    // resolveGuildNameColors handles both and returns null when there is no server style at all.
    const displayNameColors = (useGuild
        ? await resolveGuildNameColors(interaction, guildProfile, interaction.isChatInputCommand?.() ?? false)
        : null) || extras.displayNameColors;

    return { avatar, banner, decoration, nameplate, displayNameColors };
}

// Recomputes+caches one source's 6/8-swatch palette only if its underlying asset actually changed
// (same source-hash invalidation pattern as every other cache in this bot). A transient extraction
// failure returns whatever was already cached (possibly null on a first-ever attempt) rather than
// wiping a previously-good cached palette over a one-off network/decode hiccup. The cache check runs
// BEFORE the still-frame extraction step (not after) specifically so a cache hit never pays for a
// still-unnecessary ffmpeg download+extract -- only a genuinely stale/first-time decoration actually
// re-downloads and re-extracts. `forceRefresh` (2026-07-14, Harkirat's request) skips the cache-hit
// check entirely and always re-extracts -- used by the main "View Colors" button and its explicit
// "Refresh Colors" button, NOT by ordinary page-switch navigation (see index.js's colors_view/
// colors_refresh_ vs colors_page_ handlers) -- still writes the fresh result back to cache
// afterward, so page-switching within the same viewing session stays fast either way.
// Which pair of cache fields a source's palette belongs in. A source is only stored under the
// guild* pair when its image ACTUALLY came from the server profile -- a source with no override
// resolves to the global image even while browsing the server view, and caching that under a guild
// key would extract the same pixels twice and store them under two names.
function paletteFields(kind, isGuild) {
    const name = isGuild ? `guild${kind[0].toUpperCase()}${kind.slice(1)}` : kind;
    return { paletteField: `${name}Palette`, sourceField: `${name}PaletteSource` };
}

async function getCachedPalette(prefs, kind, imageInfo, forceRefresh = false, isGuild = false) {
    const { paletteField, sourceField } = paletteFields(kind, isGuild);

    if (!forceRefresh && prefs[paletteField] && prefs[sourceField] === imageInfo.source) {
        return prefs[paletteField];
    }

    // Prefer a small extraction-only copy when the source provides one (banner does -- see
    // getSourceImageInfo) so we decode fewer pixels; fall back to the display url otherwise.
    let imageSource = imageInfo.extractUrl || imageInfo.url;
    if (imageInfo.needsStillFrame) {
        try {
            imageSource = await extractStillFrame(imageInfo.url);
        } catch (err) {
            console.error(`Still-frame extraction failed for ${kind}:`, err.message);
            return prefs[paletteField] || null;
        }
    }

    let palette;
    try {
        palette = await getColorPalette(imageSource, PALETTE_COUNTS[kind]);
    } catch (err) {
        console.error(`Palette extraction failed for ${kind}:`, err.message);
        return prefs[paletteField] || null;
    }

    prefs[paletteField] = palette;
    prefs[sourceField] = imageInfo.source;
    await prefs.save();
    return palette;
}

// Builds the render data for ONE page of the View Colors panel, extracting the color palette for
// ONLY the `activeSource` actually being displayed -- NOT all four sources.
//
// EFFICIENCY REWRITE (2026-07-14): this used to be `refreshAllPalettes`, eagerly extracting
// avatar+banner+decoration+nameplate on every single call -- each a synchronous Jimp decode + k-means
// pass, and decoration additionally spawning an `ffmpeg` subprocess for its still frame. But
// utils/colorPaletteView.js's buildColorPalettePanel only ever renders ONE source's swatches at a
// time (`data[effectiveSource]`); the other three extractions were pure waste on every render. On
// Render's free-tier shared CPU that 4x-oversized burst blocked Node's single event loop long enough
// that UNRELATED interactions (a different command's deferReply) missed Discord's 3-second ACK window
// and died with 10062 "Unknown interaction" -- found live in production.
//
// Now: every source the user actually HAS still gets its availability key + preview URL surfaced
// (cheap -- these come from getSourceImageInfo's network calls, no pixel work at all), so
// getAvailableSources() renders the full set of nav buttons and the current page's Media Gallery
// preview correctly. But only the active source pays extraction cost. The other sources are extracted
// LAZILY the moment the user navigates to them -- each page/subpage switch calls this again with that
// source as `activeSource` (see index.js's colors_page_/colors_subpage_ handlers). Decoration's
// ffmpeg subprocess in particular now never runs unless the user actually opens the Deco page.
//
// The preview URLs are deliberately each source's raw DISPLAY url, NOT whatever getCachedPalette
// internally still-frame-extracts for decoration's color analysis: Discord's own client renders
// animated PNG/decoration previews fine (the Jimp limitation is specific to OUR pixel-sampling code),
// so the Deco page shows the real animated decoration even though extraction only ever sees one frame.
async function getPalettePanelData(interaction, prefs, activeSource, forceRefresh = false, variant = 'global') {
    const useGuild = variant === 'server';
    const info = await getSourceImageInfo(interaction, useGuild);
    const results = { displayNameColors: info.displayNameColors, variant };
    const sources = { avatar: info.avatar, banner: info.banner, decoration: info.decoration, nameplate: info.nameplate };

    // Does a server view exist to switch TO? Read from the interaction payload, so it costs nothing
    // and is honest about the CURRENT server rather than "has a server profile somewhere". The view
    // uses this to decide whether to render the global/server switch at all -- with no override the
    // two views would be identical and the button would do visibly nothing.
    const guildProfile = readGuildProfile(interaction);
    results.hasServerProfile = hasAnyGuildOverride(guildProfile);
    results.inGuild = Boolean(guildProfile);

    // Whether a given source's resolved image actually came from the server profile. Compared by
    // hash rather than assumed from `useGuild`, because a source with no override falls through to
    // the global image even in the server view -- and it must then cache under the GLOBAL fields.
    const guildHash = {
        avatar: guildProfile?.avatarHash, banner: guildProfile?.bannerHash,
        decoration: guildProfile?.decorationAsset, nameplate: guildProfile?.nameplateAsset
    };
    const isGuildSource = (kind) => Boolean(useGuild && guildHash[kind] && sources[kind]?.source === guildHash[kind]);

    // Availability keys + preview URLs for EVERY equipped source, WITHOUT extracting. getAvailableSources()
    // keys off KEY PRESENCE (not value), and the previews off the URL, so all nav buttons + the current
    // preview render even for sources not yet extracted. Non-active sources surface whatever's already
    // cached (possibly null, possibly stale vs the live asset -- harmless, since only the ACTIVE source's
    // swatches are ever rendered, and getCachedPalette re-validates the source hash if/when that source
    // later becomes active).
    for (const [kind, srcInfo] of Object.entries(sources)) {
        if (!srcInfo) continue; // user doesn't have this source equipped
        if (kind !== 'avatar') results[`${kind}Url`] = srcInfo.url; // avatar's thumbnail is passed separately, no gallery url
        results[kind] = prefs[paletteFields(kind, isGuildSource(kind)).paletteField] || null;
    }
    // The avatar thumbnail the panel draws beside its heading. Global-view callers pass their own,
    // but the server view has to override it or the page would show the server's swatches next to
    // the user's ordinary face.
    results.avatarThumbnailUrl = info.avatar.url;
    // Full-res download URLs (2026-07-18, v2 quick-wins batch) -- surfaced unconditionally for
    // avatar (every user has one) and only when present for banner, same availability rule the
    // rest of this function already follows. Cheap: these are just CDN URL strings already
    // computed above by getSourceImageInfo, no extra network call.
    results.avatarFullUrl = info.avatar.fullUrl;
    if (info.banner) results.bannerFullUrl = info.banner.fullUrl;

    // Extract ONLY the active source. Skipped for 'name' (Display Name Colors are exact user-picked
    // values already surfaced above via displayNameColors -- nothing to extract/cluster) and for any
    // source the user doesn't have. getCachedPalette handles the cache-hit / stale-hash / forceRefresh
    // decision internally and writes the fresh result back to `prefs`.
    if (activeSource !== 'name' && sources[activeSource]) {
        results[activeSource] = await getCachedPalette(
            prefs, activeSource, sources[activeSource], forceRefresh, isGuildSource(activeSource)
        );
    }

    return results;
}

module.exports = { getSourceImageInfo, getCachedPalette, getPalettePanelData, paletteFields };
