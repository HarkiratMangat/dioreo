// utils/colorPalette.js -- backs /settings' "View Colors" panel. Separate concern from
// utils/accentColor.js (which resolves ONE hex per command render): this computes/caches the FULL
// 6-swatch breakdown per source for a dedicated browsing UI, not something every command needs on
// every render.
const {
    getColorPalette, composeNameplatePalette, PALETTE_COUNTS, NAMEPLATE_OVERASK
} = require('./colorExtract');
const { fetchProfileExtras, resolveGuildNameColors } = require('./accentColor');
const { extractFrameMontage } = require('./stillFrame');
const { readGuildProfile, hasAnyGuildOverride, isAnimatedHash } = require('./guildProfile');
const { nameplatePaletteHex, nameplatePaletteLabel } = require('./nameplatePalettes');
const { renderNameplateArtMontage } = require('./nameplateBedImage');
const { resolveNameplateWebp } = require('./nameplateWebpCache');
const { resolveDecorationWebp } = require('./decorationWebpCache');

// PALETTE_COUNTS moved to utils/colorExtract.js 2026-08-11 10:25 EDT -- the nameplate/decoration WebP
// caches extract palettes too and must use the same counts, and this module requires those caches, so
// colorExtract (which requires neither) is the only home that all three can import from without a
// cycle. See its own comment for the three-copies hazard that motivated the move.

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
            source: guildProfile.avatarHash,
            montageUrl: guildProfile.avatarAnimatedUrl
          }
        : {
            url: interaction.user.displayAvatarURL({ extension: 'png', size: 256 }),
            // Full-res (2026-07-18, v2 quick-wins batch) -- backs the panel's own Download Avatar
            // button, same 4096px size /settings' existing download link already uses.
            fullUrl: interaction.user.displayAvatarURL({ size: 4096 }),
            source: interaction.user.avatar || 'default',
            // An animated avatar must be sampled across the animation, not from its first frame --
            // see the montage note in getCachedPalette below. Null for a static avatar, which keeps
            // the (much cheaper) direct-url path for the overwhelmingly common case.
            montageUrl: isAnimatedHash(interaction.user.avatar)
                ? interaction.user.displayAvatarURL({ extension: 'gif', size: 256 })
                : null
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
            source: userFetch.banner,
            // Animated banners are where the single-frame bug hurt most (measured: 83% of peak chroma
            // lost on a real 85-frame banner). Extraction samples this; DISPLAY still uses the static
            // `url` above, which is deliberate -- the media gallery has always shown a still.
            montageUrl: isAnimatedHash(userFetch.banner)
                ? userFetch.bannerURL({ extension: 'gif', size: 256 })
                : null
          }
        : null;
    // needsStillFrame: decorations are commonly served as animated PNG -- see utils/stillFrame.js.
    // Nameplate's `static.png` (built in fetchProfileExtras) is already guaranteed a real static
    // image, so it doesn't need this extra ffmpeg step.
    const decoration = guildProfile?.decorationAsset
        ? { url: guildProfile.decorationUrl, source: guildProfile.decorationAsset, skuId: guildProfile.decorationSkuId, needsStillFrame: true }
        : extras.decorationUrl
        ? { url: extras.decorationUrl, source: extras.decorationAsset, skuId: extras.decorationSkuId, needsStillFrame: true }
        : null;
    // ⚠️ `paletteCacheKey` is SEPARATE from `source` on purpose, and the two must not be merged.
    // `source` is the bare asset hash and is what feeds resolveNameplateWebp -> publicIdFor(), i.e. the
    // Cloudinary public id of every cached render; folding the palette name into it would orphan all of
    // them. But a nameplate's extracted PALETTE now depends on the bed colour (see
    // renderNameplateExtractionMontage), so the extraction cache keys on (asset, palette name) while
    // the render cache still keys on the asset. ⚠️ Since a nameplate's art and bed are a LINKED design
    // -- one palette per design, not a free pairing -- this is insurance rather than a fixed bug: the
    // asset hash would in practice already imply the palette. Discord carries the palette as its own
    // field though, so keying on both costs nothing and stays correct if that ever varies.
    const nameplate = guildProfile?.nameplateAsset
        ? { url: guildProfile.nameplateUrl, videoUrl: guildProfile.nameplateVideoUrl, source: guildProfile.nameplateAsset, paletteCacheKey: `${guildProfile.nameplateAsset}|${guildProfile.nameplatePalette || 'none'}`, palette: guildProfile.nameplatePalette, skuId: guildProfile.nameplateSkuId, name: guildProfile.nameplateName }
        : extras.nameplateUrl
        ? { url: extras.nameplateUrl, videoUrl: extras.nameplateVideoUrl, source: extras.nameplateAsset, paletteCacheKey: `${extras.nameplateAsset}|${extras.nameplatePalette || 'none'}`, palette: extras.nameplatePalette, skuId: extras.nameplateSkuId, name: extras.nameplateName }
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

async function getCachedPalette(prefs, kind, imageInfo, forceRefresh = false, isGuild = false, sharedPalette = null) {
    const { paletteField, sourceField } = paletteFields(kind, isGuild);

    // Nameplate keys on (asset, palette name); everything else on the bare asset hash. See the note on
    // `paletteCacheKey` in getSourceImageInfo for why these are deliberately different keys.
    const cacheIdentity = imageInfo.paletteCacheKey || imageInfo.source;

    // The GLOBAL, permanent palette for a nameplate/decoration design, computed once ever inside the
    // WebP render and read back from its Cloudinary `context` metadata (2026-08-11 10:07 EDT,
    // Harkirat's design). A nameplate palette is a pure function of (asset, palette) and a decoration
    // palette of (asset) -- identical for every user who equips that design, forever -- so re-deriving
    // it per user was work with a known answer.
    //
    // ⚠️ It DELIBERATELY OUTRANKS the per-user cache, checked before the hit below rather than after.
    // Two reasons: a per-user value may predate an extraction change (decoration's frame source moved
    // to the render's alpha-correct frames) and would otherwise persist forever, since its asset hash
    // never changes to invalidate it; and it is already in hand, so preferring it costs nothing. This
    // also makes `forceRefresh` honest -- Refresh Colors re-resolves the shared palette rather than
    // re-deriving a value that cannot differ.
    if (sharedPalette) {
        if (prefs[paletteField] !== sharedPalette || prefs[sourceField] !== cacheIdentity) {
            prefs[paletteField] = sharedPalette;
            prefs[sourceField] = cacheIdentity;
            await prefs.save();
        }
        return sharedPalette;
    }

    if (!forceRefresh && prefs[paletteField] && prefs[sourceField] === cacheIdentity) {
        return prefs[paletteField];
    }

    // Prefer a small extraction-only copy when the source provides one (banner does -- see
    // getSourceImageInfo) so we decode fewer pixels; fall back to the display url otherwise.
    let imageSource = imageInfo.extractUrl || imageInfo.url;
    // A MONTAGE of evenly-spaced frames, not one frame (2026-08-09 18:15 EDT). Measured on a real
    // 60-frame decoration: the single frame we used to take yielded four greys (max saturation 0.26)
    // and missed the animation's gold sparkle entirely; the montage recovers it as #AD904C at hue 42°.
    // Harkirat spotted the missing colour in the live panel first -- "the frame it sampled simply
    // lacked that color and thus it missed out."
    //
    // EXTENDED TO ANIMATED AVATARS AND BANNERS (2026-08-11 01:55 EDT). Until now `needsStillFrame` was
    // set ONLY on decoration, so every animated avatar and banner still extracted from a single static
    // CDN frame -- the exact defect the montage exists to fix, left live on two of the four sources.
    // Measured on a real 85-frame banner whose pale sky blooms into crimson flowers after frame ~34:
    // the single frame loses 83% of peak chroma and never sees the red at all. Harkirat predicted this
    // from the source GIF before it was measured.
    // `montageUrl` is null for static sources, so the common case still takes the cheap direct path.
    // NAMEPLATE is the one source whose extraction image has to be BUILT rather than fetched, because
    // no URL Discord serves actually contains what the user sees. `static.png` and `asset.webm` carry
    // ONLY the upper art layer (measured: 0.0% opaque) -- the bed is a CSS gradient the client draws
    // from the design's palette metadata -- so extraction was reading translucent art with nothing
    // behind it. See renderNameplateExtractionMontage for the measurement and for why the art and its
    // bed are a LINKED design rather than an independent pairing.
    // Degrades deliberately: an unknown/`none` palette yields no bed hex, and we fall through to the
    // old static.png path rather than inventing a colour (same rule nameplatePaletteHex itself follows).
    // A nameplate's four swatches are ONE "Nameplate Background" plus THREE from the upper art layer
    // (Harkirat 2026-08-11 07:55 EDT). The bed is NOT extracted -- its hex is already known exactly from
    // the design's palette metadata, so pulling it out of pixels could only approximate a value we have.
    // What IS extracted is the art, pooled across the whole animation so a colour that only appears
    // part-way through still counts.
    // Designs with palette `none` have their background baked into the art, so they get no prepended
    // bed and simply take all four from the pooled art.
    let nameplateBedHex = null;
    if (kind === 'nameplate' && imageInfo.videoUrl) {
        const nameplateBedString = nameplatePaletteHex(imageInfo.palette, 'dark');
        nameplateBedHex = nameplateBedString ? parseInt(nameplateBedString.slice(1), 16) : null;
        try {
            const res = await fetch(imageInfo.videoUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${imageInfo.videoUrl}`);
            imageSource = await renderNameplateArtMontage(Buffer.from(await res.arrayBuffer()));
        } catch (err) {
            // Falls back to the static.png url already in `imageSource` -- one frame and no bed, but a
            // stale-or-null return would blank the panel outright.
            console.error('Nameplate art montage failed, falling back to static frame:', err.message);
            nameplateBedHex = null;
        }
    }
    const montageSource = imageInfo.montageUrl || (imageInfo.needsStillFrame ? imageInfo.url : null);
    if (montageSource) {
        try {
            imageSource = await extractFrameMontage(montageSource);
        } catch (err) {
            console.error(`Frame-montage extraction failed for ${kind}:`, err.message);
            return prefs[paletteField] || null;
        }
    }

    const wanted = PALETTE_COUNTS[kind];
    let palette;
    try {
        // With a bed to prepend we only need three art colours, but we ASK for extra: an art colour
        // that renders as a near-duplicate of the bed gets dropped below, and without headroom that
        // would hand back a short palette. Same reason the extractor itself over-clusters before
        // merging.
        palette = await getColorPalette(imageSource, nameplateBedHex != null ? wanted + NAMEPLATE_OVERASK : wanted);
        if (kind === 'nameplate') {
            // Shared with utils/nameplateWebpCache.js's own extraction so the fallback path and the
            // permanent cache can never compose the four swatches differently -- see
            // composeNameplatePalette for the bed/art rule itself.
            palette = composeNameplatePalette(palette, nameplateBedHex, wanted);
        }
    } catch (err) {
        console.error(`Palette extraction failed for ${kind}:`, err.message);
        return prefs[paletteField] || null;
    }

    prefs[paletteField] = palette;
    prefs[sourceField] = cacheIdentity;
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
async function getPalettePanelData(interaction, prefs, activeSource, forceRefresh = false, variant = 'global', refreshStale = false) {
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
    // Nameplate bed color (2026-08-09) -- resolved here, not in the view, so the view never has to
    // know about Discord's palette enum at all. `nameplatePaletteHex` returns null for `none`/unknown
    // palettes, which is exactly "no bed" (never a fabricated color -- see nameplatePalettes.js).
    // Fixed 'dark' theme: the bot has no way to know which client theme the viewer is using, and dark
    // is what the overwhelming majority see (same call already made in nameplatePalettes.js's docs).
    if (sources.nameplate) {
        const bedHexString = nameplatePaletteHex(sources.nameplate.palette, 'dark');
        results.nameplateBedHex = bedHexString ? parseInt(bedHexString.slice(1), 16) : null;
        // Discord's own word for that bed ("Violet", "Cobalt"), so the panel can show the
        // authoritative name instead of a nearest-match guess from the colour-naming library. Null for
        // a `none`/unknown palette, which is the view's signal to fall back to the generic lookup.
        results.nameplateBedName = nameplatePaletteLabel(sources.nameplate.palette);
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

    // Animated WebP preview, same lazy-per-active-source discipline as the palette extraction below --
    // a Cloudinary cache hit is cheap (one Admin API lookup), but a genuine cold render has a real
    // cost, so this must never run for a source the user isn't currently looking at.
    // `resolveNameplateWebp`/`resolveDecorationWebp` never throw -- null here just means
    // utils/colorPaletteView.js falls back to its existing static preview, exactly like a failed
    // palette extraction already falls back to a cached-or-null value. Non-null resolves to
    // { cloudinaryUrl, discordCdnUrl, palette } -- discordCdnUrl may itself be null (storage channel
    // not configured, or that one-time upload failed), which the view layer must handle separately.
    //
    // ⚠️ THIS NOW RUNS BEFORE EXTRACTION, and the order is load-bearing (2026-08-11 10:07 EDT). These
    // resolvers own the permanent per-DESIGN palette, so their result is what the extraction below
    // prefers. The previous order was the other way round for a reason that no longer exists: the
    // render needed an `accentHex` passed in from an already-extracted palette, which made the render
    // depend on an extraction over the very frames the render itself had in hand. The render now
    // computes its own palette from those frames, so that parameter is gone and the circularity with
    // it. ⚠️ Do not "tidy" this back into source order -- extraction first would re-derive per user
    // exactly the value these resolvers hold.
    let sharedPalette = null;
    if (activeSource === 'nameplate' && sources.nameplate) {
        results.nameplateWebp = await resolveNameplateWebp({
            nameplateAsset: sources.nameplate.source,
            paletteName: sources.nameplate.palette,
            webmUrl: sources.nameplate.videoUrl,
            bedHex: results.nameplateBedHex,
            skuId: sources.nameplate.skuId,
            nameplateName: sources.nameplate.name
        });
        sharedPalette = results.nameplateWebp?.palette ?? null;
    }
    if (activeSource === 'decoration' && sources.decoration) {
        results.decorationWebp = await resolveDecorationWebp({
            decorationAsset: sources.decoration.source,
            decorationUrl: sources.decoration.url,
            skuId: sources.decoration.skuId
        });
        sharedPalette = results.decorationWebp?.palette ?? null;
    }

    // Extract ONLY the active source. Skipped for 'name' (Display Name Colors are exact user-picked
    // values already surfaced above via displayNameColors -- nothing to extract/cluster) and for any
    // source the user doesn't have. getCachedPalette handles the shared-palette / cache-hit /
    // stale-hash / forceRefresh decision internally and writes the result back to `prefs`.
    // `sharedPalette` is null for avatar/banner and for any nameplate/decoration whose WebP could not
    // be resolved (a `none`-palette nameplate resolves to null by design), so those fall through to
    // the ordinary per-user extraction unchanged.
    if (activeSource !== 'name' && sources[activeSource]) {
        results[activeSource] = await getCachedPalette(
            prefs, activeSource, sources[activeSource], forceRefresh, isGuildSource(activeSource), sharedPalette
        );
    }

    // `refreshStale` (2026-08-11 18:44 EDT, Harkirat's design for the Refresh Colors button): ALSO
    // recompute any OTHER equipped source whose image has actually changed since it was cached, and
    // leave the rest alone. His framing: a user who changed only their banner should pay for the
    // banner; a user who changed avatar, banner and nameplate should get all three, without the two
    // they left alone being re-extracted for nothing.
    //
    // ⚠️ This is NOT a return to the pre-2026-07-13 "extract everything on every render" behaviour
    // that caused the bot-wide `10062` interaction timeouts. Three things keep it bounded: it runs
    // ONLY on an explicit button press (never on a page turn or a panel open), it extracts only
    // sources whose stored hash genuinely differs from the live one (usually none), and that button
    // already carries its own 10-second cooldown. The staleness test itself is free -- every hash is
    // already in hand from getSourceImageInfo above, which the panel calls regardless to build its
    // nav buttons.
    //
    // ⚠️ `forceRefresh` is deliberately NOT passed here. The active source is force-re-extracted
    // because that is what the button targets and what makes its "did anything change?" message
    // honest; the others are refreshed only if their image really moved, so an unchanged source costs
    // one string comparison. Nameplate/decoration additionally short-circuit on their shared
    // per-design palette, so a "stale" one of those is a metadata read rather than an extraction.
    const refreshed = [];
    if (refreshStale) {
        for (const [kind, srcInfo] of Object.entries(sources)) {
            if (!srcInfo || kind === activeSource) continue;
            const isGuild = isGuildSource(kind);
            const { paletteField, sourceField } = paletteFields(kind, isGuild);
            const identity = srcInfo.paletteCacheKey || srcInfo.source;
            if (prefs[paletteField] && prefs[sourceField] === identity) continue; // image unchanged
            try {
                results[kind] = await getCachedPalette(prefs, kind, srcInfo, false, isGuild, null);
                refreshed.push(kind);
            } catch (err) {
                // One stale source failing must not sink the refresh the user actually asked for.
                console.error(`Stale-source refresh failed for ${kind}:`, err.message);
            }
        }
    }
    results.refreshedSources = refreshed;

    return results;
}

module.exports = { getSourceImageInfo, getCachedPalette, getPalettePanelData, paletteFields };
