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

    // size 256, not 512 (2026-07-14, event-loop fix) -- halves the pixels Jimp has to decode+unfilter
    // synchronously on Render's free-tier CPU, which was blocking the event loop long enough to make
    // unrelated interactions (deferReply on a totally different command) miss Discord's 3s ACK window.
    // 256px is still plenty of resolution for k-means color clustering, which only ever samples ~2500
    // pixels out of the image anyway -- this isn't a visible-quality loss, just less decode work.
    const banner = userFetch.banner
        ? { url: userFetch.bannerURL({ extension: 'png', size: 256 }), source: userFetch.banner }
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
async function getPalettePanelData(interaction, prefs, activeSource, forceRefresh = false) {
    const info = await getSourceImageInfo(interaction);
    const results = { displayNameColors: info.displayNameColors };
    const sources = { avatar: info.avatar, banner: info.banner, decoration: info.decoration, nameplate: info.nameplate };

    // Availability keys + preview URLs for EVERY equipped source, WITHOUT extracting. getAvailableSources()
    // keys off KEY PRESENCE (not value), and the previews off the URL, so all nav buttons + the current
    // preview render even for sources not yet extracted. Non-active sources surface whatever's already
    // cached (possibly null, possibly stale vs the live asset -- harmless, since only the ACTIVE source's
    // swatches are ever rendered, and getCachedPalette re-validates the source hash if/when that source
    // later becomes active).
    for (const [kind, srcInfo] of Object.entries(sources)) {
        if (!srcInfo) continue; // user doesn't have this source equipped
        if (kind !== 'avatar') results[`${kind}Url`] = srcInfo.url; // avatar's thumbnail is passed separately, no gallery url
        results[kind] = prefs[`${kind}Palette`] || null;
    }

    // Extract ONLY the active source. Skipped for 'name' (Display Name Colors are exact user-picked
    // values already surfaced above via displayNameColors -- nothing to extract/cluster) and for any
    // source the user doesn't have. getCachedPalette handles the cache-hit / stale-hash / forceRefresh
    // decision internally and writes the fresh result back to `prefs`.
    if (activeSource !== 'name' && sources[activeSource]) {
        results[activeSource] = await getCachedPalette(prefs, activeSource, sources[activeSource], forceRefresh);
    }

    return results;
}

module.exports = { getSourceImageInfo, getCachedPalette, getPalettePanelData };
