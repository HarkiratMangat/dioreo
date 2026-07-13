// utils/colorPalette.js -- backs /settings' "View Colors" panel. Separate concern from
// utils/accentColor.js (which resolves ONE hex per command render): this computes/caches the FULL
// 6-swatch breakdown per source for a dedicated browsing UI, not something every command needs on
// every render.
const { getColorPalette } = require('./colorExtract');
const { fetchProfileExtras } = require('./accentColor');
const { extractStillFrame } = require('./stillFrame');

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
async function getSourceImageInfo(interaction) {
    const avatar = {
        url: interaction.user.displayAvatarURL({ extension: 'png', size: 256 }),
        source: interaction.user.avatar || 'default'
    };

    const [userFetch, extras] = await Promise.all([
        interaction.client.users.fetch(interaction.user.id, { force: true }),
        fetchProfileExtras(interaction.client, interaction.user.id)
    ]);

    const banner = userFetch.banner
        ? { url: userFetch.bannerURL({ extension: 'png', size: 512 }), source: userFetch.banner }
        : null;
    // needsStillFrame: decorations are commonly served as animated PNG -- see utils/stillFrame.js.
    // Nameplate's `static.png` (built in fetchProfileExtras) is already guaranteed a real static
    // image, so it doesn't need this extra ffmpeg step.
    const decoration = extras.decorationUrl
        ? { url: extras.decorationUrl, source: extras.decorationAsset, needsStillFrame: true }
        : null;
    const nameplate = extras.nameplateUrl
        ? { url: extras.nameplateUrl, source: extras.nameplateAsset }
        : null;

    return { avatar, banner, decoration, nameplate, displayNameColors: extras.displayNameColors };
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
async function getCachedPalette(prefs, kind, imageInfo, forceRefresh = false) {
    const paletteField = `${kind}Palette`;
    const sourceField = `${kind}PaletteSource`;

    if (!forceRefresh && prefs[paletteField] && prefs[sourceField] === imageInfo.source) {
        return prefs[paletteField];
    }

    let imageSource = imageInfo.url;
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

// Refreshes every available source's palette in one pass -- called both by /settings' fire-and-
// forget soft refresh (see settings.js) and by the View Colors panel itself as a lazy fallback for
// whichever source the user actually navigates to, in case the soft refresh hasn't finished yet.
// Also surfaces each source's raw DISPLAY url (banner/nameplateUrl/decorationUrl) alongside its
// extracted palette -- utils/colorPaletteView.js uses these for the Media Gallery preview on those
// pages. Deliberately the ORIGINAL url, not whatever getCachedPalette internally still-frame-extracts
// for decoration's color analysis: Discord's own client renders animated PNG/decoration previews
// fine on its own (the Jimp/getDominantColor limitation is specific to OUR pixel-sampling code, not
// to Discord's rendering), so the deco page can show the real animated decoration even though color
// extraction under the hood only ever sees one still frame of it.
async function refreshAllPalettes(interaction, prefs, forceRefresh = false) {
    const info = await getSourceImageInfo(interaction);
    const results = { displayNameColors: info.displayNameColors };

    results.avatar = await getCachedPalette(prefs, 'avatar', info.avatar, forceRefresh);
    if (info.banner) {
        results.banner = await getCachedPalette(prefs, 'banner', info.banner, forceRefresh);
        results.bannerUrl = info.banner.url;
    }
    if (info.decoration) {
        results.decoration = await getCachedPalette(prefs, 'decoration', info.decoration, forceRefresh);
        results.decorationUrl = info.decoration.url;
    }
    if (info.nameplate) {
        results.nameplate = await getCachedPalette(prefs, 'nameplate', info.nameplate, forceRefresh);
        results.nameplateUrl = info.nameplate.url;
    }

    return results;
}

module.exports = { getSourceImageInfo, getCachedPalette, refreshAllPalettes };
