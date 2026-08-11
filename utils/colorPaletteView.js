// utils/colorPaletteView.js -- render logic for /settings' "View Colors" panel and the standalone
// /colors command (utils/colorPalette.js does the data side: fetching+caching each source's color
// breakdown). Kept separate from that file the same way every other command's render logic is split
// from its data-fetching, and from index.js's routing the same way every other panel's render lives
// in utils/ rather than inline.
const namer = require('color-namer');
const { renderSwatchImage } = require('./colorSwatchImage');
const { renderGradientBanner } = require('./colorGradientImage');
const { renderResizedImage } = require('./resizedImage');
const { renderNameplateWithBed } = require('./nameplateBedImage');
const { buildPaginationRow } = require('./paginationRow');
const emojis = require('./emojiMap');

// Fixed page size (2026-07-14, Harkirat's clarification) -- NOT "everything on one page": avatar/
// banner's 8 colors paginate 4-per-page (2 pages), while the naturally-smaller sources (display
// name's 3, nameplate/decoration's 4) fit within one page and never show a pager at all --
// buildPaginationRow already returns null (renders nothing) when totalChunks <= 1, so a single fixed
// page size handles both cases correctly without any per-source special-casing.
const ENTRIES_PER_PAGE = 4;

// heading: the {@user}-suffixed pattern Harkirat asked for ("Colors From Your Avatar {@user}").
// label: the page-switch button text -- "Deco" not "Decoration" per his request.
const SOURCE_META = {
    avatar: { label: 'Avatar', heading: 'Colors From Your Avatar' },
    banner: { label: 'Banner', heading: 'Colors From Your Banner' },
    name: { label: 'Name', heading: 'Colors From Your Display Name' },
    nameplate: { label: 'Nameplate', heading: 'Colors From Your Nameplate' },
    decoration: { label: 'Deco', heading: 'Colors From Your Deco' }
};
const SOURCE_ORDER = ['avatar', 'banner', 'name', 'nameplate', 'decoration'];

function formatHex(hex) {
    return `#${hex.toString(16).padStart(6, '0').toUpperCase()}`;
}

// Plain-English color name via the 'ntc' ("Name that Color") palette from the `color-namer`
// package -- picked over its other bundled palettes (basic/html/x11/roygbiv/pantone) specifically
// because ntc's names come pre-formatted with real spacing/casing ("Royal Blue", "Blue Ribbon")
// where the others return lowercase-concatenated strings ("royalblue") that would need extra
// reformatting. Verified against real hex values from this bot's own palette before committing to
// it -- consistently close nearest-match distances (under ~15 in RGB space for every test case).
function getColorName(hex) {
    return namer(formatHex(hex), { pick: ['ntc'] }).ntc[0].name;
}

function rgbToHslLocal(hex) {
    const r = ((hex >> 16) & 0xff) / 255, g = ((hex >> 8) & 0xff) / 255, b = (hex & 0xff) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: h * 60, s, l };
}

// Circular hue distance (0-180, since hue wraps at 360).
function hueDistance(h1, h2) {
    const d = Math.abs(h1 - h2) % 360;
    return d > 180 ? 360 - d : d;
}
function isWarmHue(h) { return h < 60 || h >= 330; }
function isCoolHue(h) { return h >= 180 && h < 300; }

// Dynamic, RELATIVE labels for the k-means color entries (2026-07-14, Harkirat's follow-up after
// disliking both the earlier synthetic Vibrant/Muted categories AND the "Covers ~X% of the image"
// captions) -- "majority color", "vibrant accent", "dark undertones" etc, computed from how each
// color relates to the OTHERS actually extracted from THIS source, not a fixed category a color is
// forced into or a raw statistic. Greedy priority assignment: each rule claims the best-matching
// UNCLAIMED entry in turn, so no two entries on the same page ever get the same label, and a label
// only gets assigned when the entry genuinely earns it (thresholds below) rather than being forced.
//
// 14 real categories total (Majority + 13 more) -- deliberately more than the largest page (8
// entries, avatar/banner) will ever need, specifically so every entry gets a genuine, distinct,
// relationship-based label instead of falling back to something generic. Harkirat's explicit
// feedback after the first version (5 categories, rest fell back to numbered "Accent Color N"):
// "the whole point of my request was to keep them unique yet relevant" -- a numbered fallback is
// neither.
function assignDynamicLabels(entries, kind) {
    const hsl = entries.map(e => rgbToHslLocal(e.hex));
    const claimed = new Set();
    const labels = new Array(entries.length).fill(null);
    const unclaimed = () => entries.map((_, i) => i).filter(i => !claimed.has(i));
    const claim = (idx, label) => { labels[idx] = label; claimed.add(idx); };
    // Claims the FIRST (best-sorted) candidate from a pre-filtered, pre-sorted list, if any exists.
    const tryClaim = (candidates, label) => {
        if (candidates.length === 0) return false;
        claim(candidates[0], label);
        return true;
    };

    if (entries.length === 0) return labels;

    // 1. Majority Color -- the single highest-prevalence entry (entries already arrive sorted by
    // percent descending from getColorPalette, so index 0 is always the winner).
    // ⚠️ NAMEPLATE leads with its BED, not a majority (Harkirat 2026-08-11 07:55 EDT). A nameplate gets
    // only 4 swatches and its background is a design fact rather than a statistic, so "Majority Color"
    // does not fit there -- entry 0 IS the bed (prepended exactly, never extracted) and entries 1-3 come
    // from the upper art layer. See utils/colorPalette.js's nameplate branch for how that is composed.
    claim(0, kind === 'nameplate' ? 'Nameplate Background' : 'Majority Color');
    const maj = hsl[0];

    // 2. Vibrant Accent -- highest saturation among what's left, only if genuinely saturated.
    tryClaim(unclaimed().filter(i => hsl[i].s > 0.25).sort((a, b) => hsl[b].s - hsl[a].s), 'Vibrant Accent');
    // 3. Dark Undertone -- lowest lightness among what's left, only if genuinely dark.
    tryClaim(unclaimed().filter(i => hsl[i].l < 0.35).sort((a, b) => hsl[a].l - hsl[b].l), 'Dark Undertone');
    // 4. Light Highlight -- highest lightness among what's left, only if genuinely light.
    tryClaim(unclaimed().filter(i => hsl[i].l > 0.7).sort((a, b) => hsl[b].l - hsl[a].l), 'Light Highlight');
    // 5. Neutral Tone -- lowest saturation among what's left, only if genuinely muted/gray.
    tryClaim(unclaimed().filter(i => hsl[i].s < 0.15).sort((a, b) => hsl[a].s - hsl[b].s), 'Neutral Tone');
    // 6. Secondary Color -- the next-most-common color, only if it covers a real share of the image
    // (not a negligible sliver that happens to rank 2nd purely because everything else is tiny too).
    tryClaim(unclaimed().filter(i => entries[i].percent >= 10).sort((a, b) => entries[b].percent - entries[a].percent), 'Secondary Color');
    // 7/8. Warm Contrast / Cool Contrast -- a genuine temperature contrast against the majority color
    // specifically (only fires if the majority ISN'T already that temperature, so this means "stands
    // out from the dominant tone", not just "happens to be warm/cool").
    if (!isWarmHue(maj.h)) {
        tryClaim(unclaimed().filter(i => isWarmHue(hsl[i].h)).sort((a, b) => hueDistance(hsl[b].h, maj.h) - hueDistance(hsl[a].h, maj.h)), 'Warm Contrast');
    }
    if (!isCoolHue(maj.h)) {
        tryClaim(unclaimed().filter(i => isCoolHue(hsl[i].h)).sort((a, b) => hueDistance(hsl[b].h, maj.h) - hueDistance(hsl[a].h, maj.h)), 'Cool Contrast');
    }
    // 9. Complementary Tone -- the most hue-distant entry from the majority overall, if that distance
    // is large enough to read as a genuinely different hue family rather than a close variant.
    tryClaim(unclaimed().filter(i => hueDistance(hsl[i].h, maj.h) > 60).sort((a, b) => hueDistance(hsl[b].h, maj.h) - hueDistance(hsl[a].h, maj.h)), 'Complementary Tone');
    // 10/11. Deep Shade / Soft Tint -- notably darker/lighter than the MAJORITY specifically (not the
    // absolute darkest/lightest overall, which rules 3/4 already claimed) -- "a deeper/lighter variant
    // of the dominant tone" is still a real, distinct relationship worth naming.
    tryClaim(unclaimed().filter(i => hsl[i].l < maj.l - 0.15).sort((a, b) => hsl[a].l - hsl[b].l), 'Deep Shade');
    tryClaim(unclaimed().filter(i => hsl[i].l > maj.l + 0.15).sort((a, b) => hsl[b].l - hsl[a].l), 'Soft Tint');
    // 12/13. Rich Tone / Muted Accent -- notably more/less saturated than the majority specifically.
    tryClaim(unclaimed().filter(i => hsl[i].s > maj.s + 0.15).sort((a, b) => hsl[b].s - hsl[a].s), 'Rich Tone');
    tryClaim(unclaimed().filter(i => hsl[i].s < maj.s - 0.1).sort((a, b) => hsl[a].s - hsl[b].s), 'Muted Accent');
    // 14. Balanced Tone -- whatever's left that most closely echoes the majority color overall
    // (smallest combined hue/saturation/lightness difference) -- a real, if unremarkable, relationship
    // ("this closely matches your dominant tone"), not a manufactured category.
    if (unclaimed().length > 0) {
        const closest = [...unclaimed()].sort((a, b) => {
            const da = Math.abs(hsl[a].l - maj.l) + Math.abs(hsl[a].s - maj.s) + hueDistance(hsl[a].h, maj.h) / 360;
            const db = Math.abs(hsl[b].l - maj.l) + Math.abs(hsl[b].s - maj.s) + hueDistance(hsl[b].h, maj.h) / 360;
            return da - db;
        });
        tryClaim(closest, 'Balanced Tone');
    }

    // Safety net only -- with 13 real non-majority categories above covering a max of 7 non-majority
    // entries per page (avatar/banner's largest, 8 total), this should never actually be reached.
    // Kept non-numbered even here so a truly pathological edge case still doesn't regress into
    // "Accent Color N".
    const fallbackPool = ['Supporting Color', 'Complementary Shade', 'Balancing Note', 'Distinct Tone'];
    let fi = 0;
    for (const i of unclaimed()) {
        labels[i] = fallbackPool[fi % fallbackPool.length];
        fi++;
    }
    return labels;
}

// Simple RGB-space blend toward white/black -- good enough for "a related lighter/darker variant of
// this color" without needing full HSL rigor, since these are cosmetic derived options on the
// Display Name page (see buildDisplayNameEntries below), not a color-science-accurate palette.
function blend(hexA, hexB) {
    const r1 = (hexA >> 16) & 0xff, g1 = (hexA >> 8) & 0xff, b1 = hexA & 0xff;
    const r2 = (hexB >> 16) & 0xff, g2 = (hexB >> 8) & 0xff, b2 = hexB & 0xff;
    return (Math.round((r1 + r2) / 2) << 16) | (Math.round((g1 + g2) / 2) << 8) | Math.round((b1 + b2) / 2);
}

// tint/shade: same-hue derived companions for a SOLID display name color (see buildDisplayNameEntries
// below). tint mixes each channel toward white by a fixed fraction (preserves hue, drops saturation --
// the standard design-tool definition of a tint); shade scales each channel toward black by the same
// fraction (preserves both hue AND saturation exactly, since uniform scaling is a pure lightness
// change). Both are pure functions of the one input hex, so Refresh Colors' before/after
// change-detection still holds.
const DERIVED_AMOUNT = 0.35;
function tint(hex, amount = DERIVED_AMOUNT) {
    const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
    const mix = (c) => Math.round(c + (255 - c) * amount);
    return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}
function shade(hex, amount = DERIVED_AMOUNT) {
    const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
    const mix = (c) => Math.round(c * (1 - amount));
    return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

// Each entry renders as a Section with a generated solid-color thumbnail accessory (utils/
// colorSwatchImage.js) instead of plain text, so a listed hex actually SHOWS its color rather than
// just being typed out -- sent as message attachments referenced via `attachment://`, generated
// fresh per render (no external hosting needed, these are tiny/cheap to generate). Content format:
// the plain-English color NAME as the bold heading line, hex plainly below it, and the dynamic
// relative label (Majority Color/Vibrant Accent/etc, or the Display Name page's own Gradient Start/
// End/Blend labels) as a small quoted caption. Returns both the component rows AND the raw file
// buffers the caller needs to attach alongside them.
async function buildEntryRows(entries) {
    const rows = [];
    const files = [];
    let i = 0;
    for (const { label, hex } of entries) {
        if (hex == null) continue;
        const filename = `swatch_${i}.png`;
        files.push({ name: filename, data: await renderSwatchImage(hex) });
        rows.push({
            type: 9,
            components: [{ type: 10, content: `**${getColorName(hex)}**\nHex: \`${formatHex(hex)}\`\n> ${label}` }],
            accessory: { type: 11, media: { url: `attachment://${filename}` } }
        });
        i++;
    }
    return { rows, files };
}

// `palette` is whatever utils/colorExtract.js's getColorPalette() returned -- an array of
// `{ hex, percent }` sorted by prevalence (see that file's own revision-history comment for the full
// story of what this replaced). Labels come from assignDynamicLabels above, not the raw percent.
function buildSwatchEntries(palette, kind) {
    const entries = palette || [];
    const labels = assignDynamicLabels(entries, kind);
    return entries.map((e, i) => ({ label: labels[i], hex: e.hex }));
}

// Display Name Colors are 2 EXACT user-picked colors, not an extracted palette -- there's nothing to
// run getColorPalette against. Reduced to 3 entries (2026-07-14, Harkirat: "display name is fine
// with the current 3") -- the 2 real endpoints plus their midpoint blend (the same value actually
// used as the single accent-color hex elsewhere in the bot, see accentColor.js's
// blendGradientColors); dropped the earlier light/dark derived variants of the blend.
//
// A SOLID name style gives Discord a single color, and normalizeNameStyleColors (guildProfile.js)
// pairs it with itself so `start === end` here -- Gradient Start/End/Blend would then all render the
// exact same hex three times (real case, live: #2D596B x3), which reads as broken. Agreed shape
// (2026-08-09, Harkirat left the choice open and accepted this): show the real color once as
// "Display Name Color", plus two clearly-derived companions at the same hue so it's obvious they're
// not three independent extracted values.
function buildDisplayNameEntries([start, end]) {
    if (start === end) {
        return [
            { label: 'Display Name Color', hex: start },
            { label: 'Lighter Tint', hex: tint(start) },
            { label: 'Darker Shade', hex: shade(start) }
        ];
    }
    return [
        { label: 'Gradient Start', hex: start },
        { label: 'Gradient End', hex: end },
        { label: 'Gradient Blend', hex: blend(start, end) }
    ];
}

function getAvailableSources(data) {
    return SOURCE_ORDER.filter(key => {
        if (key === 'avatar') return true;
        if (key === 'name') return data.displayNameColors != null;
        return key in data;
    });
}

// `data` is whatever utils/colorPalette.js's getPalettePanelData() returned. Banner/decoration/
// nameplate are only present as KEYS at all when the user actually has that source equipped
// (colorPalette.js only sets them inside an `if (info.X)` guard) -- so key PRESENCE means "has it",
// while the palette VALUE can still be `null` if extraction genuinely failed on a source they do
// have. These two states stay distinguishable: "doesn't have a banner" (hide the button) is
// different from "has a banner, couldn't extract colors from it" (keep the button, show a failure
// message).
// `variant` is 'global' | 'server' and rides in every custom_id as a single letter (g/s) so a
// page/subpage/refresh click stays in whichever view the user is looking at. It is a THIRD pipe
// segment rather than another `_` token on purpose: the source/subpage parsers already split on `_`,
// so adding one there would have silently changed how existing ids parse.
async function buildColorPalettePanel({ source, data, targetUserId, avatarThumbnailUrl, subpage = 0, variant = 'global' }) {
    const v = variant === 'server' ? 's' : 'g';
    const availableSources = getAvailableSources(data);
    const effectiveSource = availableSources.includes(source) ? source : 'avatar';
    const meta = SOURCE_META[effectiveSource] || SOURCE_META.avatar;
    const containerComponents = [];
    let files = [];

    // Banner/Nameplate keep a full-width Media Gallery preview at the top (Harkirat confirmed the
    // nameplate treatment specifically -- "great job" -- so left both matching that pattern). Deco
    // switched to a Section+thumbnail instead (Harkirat: the full-width version "gets too large and
    // looks odd") -- same treatment Avatar's own header already uses, just with the real decoration
    // image instead of the avatar. Name gets a GENERATED gradient banner (see below) since it has no
    // real image of its own at all. **Nameplate and Deco both now use a real animated WebP** (see
    // utils/nameplateWebpCache.js/utils/decorationWebpCache.js) instead of the static preview this
    // comment used to describe -- that static-only era predates even the animated-GIF version this
    // pivoted from, both fully superseded 2026-08-10 11:42 EDT.
    // Banner preview: the display url is already the 512px size (see getSourceImageInfo), so a plain
    // Media Gallery URL reference is enough -- Discord's avatar/banner CDN honors the size we request.
    if (effectiveSource === 'banner' && data.bannerUrl) {
        containerComponents.push({ type: 12, items: [{ media: { url: data.bannerUrl } }] });
    }
    // Nameplate preview: capped at 512px wide (2026-07-14, Harkirat's request). Discord's COLLECTIBLES
    // CDN ignores `?size=` entirely (confirmed live -- a 672x126 nameplate stays 672x126 with
    // `?size=512`), unlike the avatar/banner CDN, so the only way to cap its width is to fetch+resize
    // it ourselves (utils/resizedImage.js) and attach the result. Falls back to the raw (native-width)
    // url if the resize fails for any reason, so the nameplate still shows rather than vanishing.
    else if (effectiveSource === 'nameplate' && data.nameplateUrl) {
        // Animated WebP preview -- resolved upstream in colorPalette.js via utils/nameplateWebpCache.js,
        // already a fully-rendered, LOSSLESS Cloudinary url (real fade-gradient bed + real animation,
        // real alpha throughout -- no GIF-era solid-card compromise). A Components V2 media-gallery URL
        // reference to an EXTERNAL host (Cloudinary) gets proxied through Discord's own
        // images-ext-N.discordapp.net and RE-ENCODED to lossy before any client sees it -- confirmed
        // live 2026-08-10 11:38 EDT (2.2MB/lossy vs the 898KB/lossless upload). Discord's OWN
        // cdn.discordapp.com is never proxied this way, so `data.nameplateWebp.discordCdnUrl` (set once
        // by utils/nameplateWebpCache.js's storage-channel upload) is preferred when present -- a
        // plain, fast, cacheable URL reference, no per-render work at all. Only when that isn't
        // available yet does this fall back to fetching+re-attaching the Cloudinary bytes directly
        // (still lossless, just costs a fetch+upload on every render instead of being instant -- this
        // was the ORIGINAL fix before the storage-channel optimization, kept as the fallback for
        // exactly the case it was built for). `nameplateWebp` is only ever set when a real bed color
        // exists (see resolveNameplateWebp), so this can't fire for the "no recognized palette" case
        // the static branch below still needs.
        if (data.nameplateWebp?.discordCdnUrl) {
            containerComponents.push({ type: 12, items: [{ media: { url: data.nameplateWebp.discordCdnUrl } }] });
        } else if (data.nameplateWebp?.cloudinaryUrl) {
            try {
                const res = await fetch(data.nameplateWebp.cloudinaryUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const webpBuffer = Buffer.from(await res.arrayBuffer());
                files.push({ name: 'nameplate_animated.webp', data: webpBuffer });
                containerComponents.push({ type: 12, items: [{ media: { url: 'attachment://nameplate_animated.webp' } }] });
            } catch (err) {
                console.error('Nameplate WebP re-fetch for direct attachment failed, falling back to proxied url reference:', err.message);
                containerComponents.push({ type: 12, items: [{ media: { url: data.nameplateWebp.cloudinaryUrl } }] });
            }
        } else {
            try {
                // Bed color resolved upstream in colorPalette.js (getPalettePanelData) -- null there means
                // either no recognized palette or a genuine "none" bed, and both degrade to the plain
                // resize path rather than compositing a fabricated color.
                const npBuffer = data.nameplateBedHex != null
                    ? await renderNameplateWithBed(data.nameplateUrl, data.nameplateBedHex, 512)
                    : await renderResizedImage(data.nameplateUrl, 512);
                files.push({ name: 'nameplate_resized.png', data: npBuffer });
                containerComponents.push({ type: 12, items: [{ media: { url: 'attachment://nameplate_resized.png' } }] });
            } catch (err) {
                console.error('Nameplate resize failed, falling back to native-size url:', err.message);
                containerComponents.push({ type: 12, items: [{ media: { url: data.nameplateUrl } }] });
            }
        }
    }
    if (effectiveSource === 'name' && data.displayNameColors) {
        const [start, end] = data.displayNameColors;
        // NOT a render of the user's actual styled display name -- Discord's per-style fonts aren't
        // publicly accessible at all (see utils/colorGradientImage.js's own comment). This is the
        // explicitly-requested fallback: a flat left-to-right gradient banner at the same aspect
        // ratio as a real nameplate asset (Harkirat: "i like the dimensions of the nameplate
        // banner").
        const bannerBuffer = await renderGradientBanner(start, end);
        files.push({ name: 'gradient_banner.png', data: bannerBuffer });
        containerComponents.push({ type: 12, items: [{ media: { url: 'attachment://gradient_banner.png' } }] });
    }

    // Header: Avatar and Deco keep a Section+thumbnail (their own image, small); Banner/Nameplate
    // already showed their real media above so the heading here is plain text with no thumbnail;
    // Name has no image of its own besides the generated banner above, also plain text.
    // Source label (2026-08-09, Harkirat's request after live-testing per-server colors): colors now
    // resolve CONTEXTUALLY (server profile where the user has one, global otherwise) with no stored
    // preference, so the panel itself has to say which one it's showing -- otherwise "it auto
    // selected my server colors" is invisible until you go looking for the switch button.
    const sourceLabel = variant === 'server' ? 'Server Profile' : 'Global Profile';
    const headingContent = `## ${meta.heading} ${`<@${targetUserId}>`}\n> Extracted from: **\`${sourceLabel}\`**`;
    // Deco's thumbnail prefers the cached animated WebP (resolved upstream in colorPalette.js via
    // utils/decorationWebpCache.js's lossless pipeline, real alpha, zero dithering) over the raw APNG --
    // WebP autoplays inline in a Section thumbnail the way Discord never lets APNG/webm do (see
    // .claude/rules/accent-and-colors.md's "Deco" layout note for the manual-tap limitation this
    // replaces). Falls back to the real decoration url exactly as before whenever the WebP isn't ready
    // yet (render failure, dev-bot write block, or genuinely still rendering for the first time).
    //
    // Prefers `data.decorationWebp.discordCdnUrl` (Discord's own CDN, never proxied, set once by
    // utils/decorationWebpCache.js's storage-channel upload) when present -- a plain, fast, cacheable
    // URL reference, no per-render work. Only falls back to fetching+re-attaching the Cloudinary bytes
    // directly when that isn't available yet, same reasoning as the Nameplate branch above (a plain
    // URL reference to the Cloudinary host gets proxied+re-encoded to lossy by Discord, confirmed live
    // 2026-08-10 11:38 EDT). Only the decoration case needs any of this; `avatarThumbnailUrl` is
    // Discord's own avatar CDN, not an external reference, so it's never subject to this proxy at all.
    let headerThumbnailUrl = effectiveSource === 'avatar' ? avatarThumbnailUrl
        : effectiveSource === 'decoration' ? (data.decorationWebp?.discordCdnUrl || data.decorationWebp?.cloudinaryUrl || data.decorationUrl)
        : null;
    if (effectiveSource === 'decoration' && !data.decorationWebp?.discordCdnUrl && data.decorationWebp?.cloudinaryUrl) {
        try {
            const res = await fetch(data.decorationWebp.cloudinaryUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const webpBuffer = Buffer.from(await res.arrayBuffer());
            files.push({ name: 'decoration_animated.webp', data: webpBuffer });
            headerThumbnailUrl = 'attachment://decoration_animated.webp';
        } catch (err) {
            console.error('Decoration WebP re-fetch for direct attachment failed, falling back to proxied url reference:', err.message);
        }
    }
    if (headerThumbnailUrl) {
        // Tried a leading blank-emoji line to nudge the heading down toward vertical-center against
        // the thumbnail (2026-07-14) -- reverted same day after Harkirat checked it on mobile and it
        // didn't look right there. Discord has no native vertical-align control for a Section's text
        // relative to its accessory either, so this stays as a known, currently-unsolved cosmetic gap
        // rather than a forced workaround that broke on a real device.
        containerComponents.push({
            type: 9,
            components: [{ type: 10, content: headingContent }],
            accessory: { type: 11, media: { url: headerThumbnailUrl } }
        });
    } else {
        containerComponents.push({ type: 10, content: headingContent });
    }
    // spacing: 2 (2026-07-14, Harkirat's request) -- "large" divider spacing, matching the convention
    // every other command in this bot settled on (calendar/draws/drawprices/manage/etc all use 2).
    containerComponents.push({ type: 14, spacing: 2, divider: true });
    // Copy hint (moved here 2026-08-09, top of the main palette section it actually describes --
    // used to be a second line folded into the heading above, cosmetic-only move).
    containerComponents.push({ type: 10, content: "-# Tap on the `#HEX` color code to copy it." });

    // Labels are computed against the FULL entry set BEFORE paginating (buildSwatchEntries already
    // does this) -- assigning "Majority Color"/"Vibrant Accent"/etc per-PAGE instead would produce
    // inconsistent results depending on which page a given color happened to land on (e.g. the real
    // Vibrant Accent could end up on page 2, leaving page 1 with no Vibrant Accent label at all).
    const allEntries = effectiveSource === 'name'
        ? buildDisplayNameEntries(data.displayNameColors)
        : buildSwatchEntries(data[effectiveSource], effectiveSource);
    // ⚠️ The bed used to be APPENDED here as a fifth entry (2026-08-09). It is now the FIRST entry of
    // the palette itself -- utils/colorPalette.js prepends it and assignDynamicLabels labels index 0
    // "Nameplate Background" for this source. Appending it as well produced the colour TWICE and, with
    // ENTRIES_PER_PAGE = 4, tipped the nameplate page into a needless "1 / 2" pagination; caught only
    // because Harkirat sent a screenshot of the rendered panel, which a database read of the stored
    // palette could not have shown. Harkirat's spec 2026-08-11 07:55 EDT is four swatches total: the
    // bed plus three art colours, so the bed has to be IN the four, not a fifth beside them.
    const totalPages = Math.max(1, Math.ceil(allEntries.length / ENTRIES_PER_PAGE));
    const effectiveSubpage = Math.min(Math.max(subpage, 0), totalPages - 1);
    const pageEntries = allEntries.slice(effectiveSubpage * ENTRIES_PER_PAGE, (effectiveSubpage + 1) * ENTRIES_PER_PAGE);

    if (pageEntries.length === 0) {
        // Reachable only for a genuine extraction failure on a source the user DOES have equipped
        // (network hiccup, ffmpeg unavailable, etc.) -- decoration's animated-PNG case is handled by
        // utils/stillFrame.js before this point, so it usually won't hit this path anymore, but the
        // message stays generic rather than assuming "it's animated" as the cause.
        containerComponents.push({ type: 10, content: "*Couldn't extract solid colors from this right now — try again in a moment.*" });
    } else {
        const { rows, files: entryFiles } = await buildEntryRows(pageEntries);
        containerComponents.push(...rows);
        files = files.concat(entryFiles);
    }

    // Prev/Next WITHIN the current source (avatar/banner's 8 colors need this at 4-per-page; display
    // name/nameplate/decoration's smaller counts fit on one page, so buildPaginationRow's own
    // totalChunks<=1 check hides this row for them automatically -- no per-source special-casing
    // needed). Same shared helper /calendar and /draws already use for their own sub-page nav.
    const subpageRow = buildPaginationRow({
        totalChunks: totalPages, currentPage: effectiveSubpage,
        makeCustomId: (p) => `colors_subpage_${effectiveSource}_${p}|${targetUserId}|${v}`,
        indicatorCustomId: 'colors_subpage_indicator'
    });
    if (subpageRow) containerComponents.push(subpageRow);

    containerComponents.push({ type: 14, spacing: 2, divider: true });
    // Hint line (2026-07-14, Harkirat's request) above the source-switch row -- short, tells a user
    // who's never clicked the other page buttons that they exist, plus a nudge toward Refresh Colors
    // for the (real, and otherwise easy to miss) case where they've since updated their avatar/
    // banner/etc and the panel is still showing the old cached extraction.
    containerComponents.push({ type: 10, content: "-# Switch below to see colors from your other profile elements.\n-# (Tip: Updated your profile? `Refresh Colors`)" });
    containerComponents.push({
        type: 1,
        components: availableSources.map(key => ({
            type: 2,
            style: key === effectiveSource ? 4 : 2,
            label: SOURCE_META[key].label,
            custom_id: `colors_page_${key}|${targetUserId}|${v}`,
            disabled: key === effectiveSource
        }))
    });

    // No accent_color at all (Harkirat's explicit request) -- omitting the field entirely gives
    // Discord's default "no accent" look, unlike every other command's container which always sets
    // one.
    const containerPayload = { type: 17, components: containerComponents };

    // "Refresh Colors" -- moved OUTSIDE the container as its own top-level sibling row (Harkirat:
    // "move the refresh button outside of the embed container"), same convention the global nav row
    // and Share Publicly button already use elsewhere in this bot (a new top-level row, never packed
    // into the container). Style 1 (blurple) + the eyedropper emoji to match the "View Colors"
    // button itself. Encodes the current subpage so a refresh doesn't bounce back to page 1. Forces
    // a real re-extraction, bypassing the cache -- see index.js's colors_refresh_ handler (10s
    // cooldown + change-detection message) and utils/colorPalette.js's forceRefresh param. Every
    // other button/select re-render in this bot deliberately does NOT re-run extraction (that's the
    // whole point of the cache), so this is a specific, deliberate exception for exactly this one
    // explicit user action.
    const refreshRowComponents = [{
        type: 2, style: 1, label: 'Refresh Colors',
        custom_id: `colors_refresh_${effectiveSource}_${effectiveSubpage}|${targetUserId}|${v}`,
        emoji: emojis.parseEmoji(emojis.eyedropper)
    }];

    // GLOBAL / SERVER switch (2026-08-09 17:05 EDT). Shown ONLY when the user actually has a server
    // profile in THIS guild -- with no override the two views resolve to identical images, so the
    // button would visibly do nothing, which reads as broken. Harkirat's spec: "only if both
    // options/values exist, otherwise just dont show the button and display global colors."
    // data.hasServerProfile is read from the interaction payload, so this costs no network call and
    // is honest about the current server rather than "has a server profile somewhere".
    if (data.hasServerProfile) {
        const goingTo = v === 's' ? 'g' : 's';
        refreshRowComponents.push({
            type: 2, style: 2,
            label: v === 's' ? 'Show Global Colors' : 'Show Server Colors',
            custom_id: `colors_variant_${goingTo}_${effectiveSource}_${effectiveSubpage}|${targetUserId}`
        });
    }
    // Download Avatar/Banner (2026-07-18, v2 quick-wins batch) -- full-res, bottom, outside the
    // container, beside Refresh, matching /settings' existing avatar/banner download buttons
    // (same style-5 Link button pointed straight at the 4096px CDN url -- Discord renders a Link
    // button in grey same as a plain Secondary button, it just needs `url` instead of `custom_id`
    // since it's not an interaction at all, only a direct CDN link). Only shown on that source's
    // OWN page (Harkirat's spec: "on their respective color-menu pages"), not on every page --
    // Name/Nameplate/Deco have no equivalent full-res original worth downloading here.
    if (effectiveSource === 'avatar' && data.avatarFullUrl) {
        refreshRowComponents.push({ type: 2, style: 5, label: 'Download Avatar', url: data.avatarFullUrl });
    }
    if (effectiveSource === 'banner' && data.bannerFullUrl) {
        refreshRowComponents.push({ type: 2, style: 5, label: 'Download Banner', url: data.bannerFullUrl });
    }
    const refreshRow = { type: 1, components: refreshRowComponents };

    return { components: [containerPayload, refreshRow], files };
}

module.exports = { buildColorPalettePanel, SOURCE_ORDER, SOURCE_META, getAvailableSources };
