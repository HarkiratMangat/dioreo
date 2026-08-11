// utils/nameplatePalettes.js -- the nameplate background colours (2026-08-09 19:15 EDT)
//
// WHY THIS FILE EXISTS: a nameplate's purple/red/green bed is NOT in any asset Discord serves.
// Measured 2026-08-09 18:05 EDT against a real equipped nameplate (`cat_beans`):
//   - `static.png`  -- non-transparent pixels occupy only x 493-671 of 672. The left 73% is empty.
//                      The file is the foreground art alone.
//   - `asset.webm`  -- `pix_fmt=yuv420p`, NO alpha channel; 83.9% of the frame is #080808.
//   - the `media/v1/collectibles-shop/{sku_id}/static|video` endpoint serves BYTE-IDENTICAL files
//     (6331b / 43737b), so it is the same asset by another name.
// The bed is drawn by Discord's own client as a CSS gradient over the art, using a colour looked up
// from the nameplate's `palette` field -- which the API gives us and we had been ignoring.
//
// ⚠️ DO NOT try to derive the bed from the artwork. It was tested and it fails: for `cat_beans` the
// bed (hue 273 deg) sits 7 deg from the art's majority colour, which looks like a rule -- but that
// same art's other extracted colours are at 32, 21 and 358 deg. It only "works" when the art happens
// to share the bed's hue, and would be badly wrong on any nameplate with warm art on a cool bed.
//
// ⚠️ DO NOT re-probe Discord's API for this. `/collectibles-shop` returns 403 `20001`
// ("Bots cannot use this endpoint") with a bot token and 401 unauthenticated; `/store/skus/{id}`
// returns 403. There is no route. The values below came from the web client's own bundle.
//
// PROVENANCE -- this is a transcription, not a derivation, and it is independently confirmed:
// lifted from Discord's web client (`/assets/web.*.js`, module 641886, the `darkBackground` /
// `lightBackground` table keyed by the palette enum in module 88686). `violet.darkBackground`
// here is `#730BC8`, which is EXACTLY the value Harkirat read out of his own browser's dev tools
// from the live nameplate element -- two independent sources agreeing on the same colour is why
// this table is trusted rather than assumed.
//
// ⚠️ The client bundle hash changes on every Discord deploy, so the URL these came from is already
// stale and is deliberately not recorded as a live reference. Re-derive by fetching
// https://discord.com/app, collecting its <script src> chunks, and grepping for the string
// `bubble_gum` -- it appeared in exactly ONE of 203 chunks, next to this table.

// Discord renders a DIFFERENT bed per client theme. `dark` is what the overwhelming majority of
// users see; `light` is kept because the pair is what the source defines, and picking one silently
// would make this table a lossy copy of it.
const NAMEPLATE_PALETTES = {
    crimson:    { dark: '#900007', light: '#E7040F' },
    berry:      { dark: '#893A99', light: '#B11FCF' },
    sky:        { dark: '#0080B7', light: '#56CCFF' },
    teal:       { dark: '#086460', light: '#7DEED7' },
    forest:     { dark: '#2D5401', light: '#6AA624' },
    bubble_gum: { dark: '#DC3E97', light: '#F957B3' },
    violet:     { dark: '#730BC8', light: '#972FED' },
    cobalt:     { dark: '#0131C2', light: '#4278FF' },
    clover:     { dark: '#047B20', light: '#63CD5A' },
    lemon:      { dark: '#F6CD12', light: '#FED400' },
    white:      { dark: '#FFFFFF', light: '#FFFFFF' },
    black:      { dark: '#000000', light: '#000000' }
};

// The gradient Discord composites the bed with, read from the live element:
//   linear-gradient(90deg, transparent 0%, rgba(C,0.08) 20%, rgba(C,0.08) 50%, rgba(C,0.5) 100%)
// One colour, varying alpha -- so a single hex fully describes a palette. Exported so a renderer
// reproduces Discord's own look rather than inventing a flat fill.
const NAMEPLATE_GRADIENT_STOPS = [
    { at: 0.0, alpha: 0 },
    { at: 0.2, alpha: 0.08 },
    { at: 0.5, alpha: 0.08 },
    { at: 1.0, alpha: 0.5 }
];

// ⚠️ Returns null for an unknown palette rather than guessing a colour. Discord's own enum carries
// `none` (and the published docs omit `none`/`black` entirely -- the bundle is the fuller list), and
// new palettes can ship at any time. A null here must degrade to "show no bed", never to a
// fabricated swatch: a wrong colour presented as the user's own is worse than an absent one.
function nameplatePaletteHex(paletteName, theme = 'dark') {
    if (!paletteName) return null;
    const key = String(paletteName).toLowerCase();
    // `none` is a real member of Discord's enum meaning "no bed", not an unrecognized value -- it
    // must return null SILENTLY, or every user without a nameplate palette logs a warning telling
    // us to add a colour that deliberately has none.
    if (key === 'none') return null;
    const entry = NAMEPLATE_PALETTES[key];
    if (!entry) {
        // Logged, not swallowed -- an unrecognized palette is how we learn Discord shipped a new
        // one, and the fix is a one-line addition to the table above.
        console.warn(`Unknown nameplate palette "${paletteName}" -- no background colour available. Add it to utils/nameplatePalettes.js.`);
        return null;
    }
    return theme === 'light' ? entry.light : entry.dark;
}

// Derives a human-readable nameplate DESIGN name from Discord's own accessibility label field
// (e.g. "COLLECTIBLES_NAMEPLATES_TWILIGHT_A11Y" -> "Twilight") -- added 2026-08-10 12:58 EDT.
// Confirmed live against Harkirat's own equipped nameplate: the parsed result ("Twilight") matched
// Discord's own shop UI title for that exact nameplate, AND is genuinely distinct from `palette`
// (his equipped palette was "cobalt" while the label parsed to "Twilight" -- the design name and the
// currently-selected color theme are two separate things, confirmed by them differing on a real
// account). Discord's docs call `label` "currently unused" by their own client, but it IS a real,
// structured, bot-accessible string on the User object's Nameplate structure -- this is the one
// confirmed way to get a nameplate's real design name without reverse-engineering Discord's web
// client bundle (which was tried and is a dead end here: the full item catalog is fetched live at
// runtime, not baked into the static JS the way the palette-color table above was).
// Returns null if the label doesn't match the expected shape (a different/future naming convention,
// or no label at all) -- never guesses or fabricates a name.
function deriveNameplateName(label) {
    if (!label) return null;
    const match = String(label).match(/^COLLECTIBLES_NAMEPLATES_(.+)_A11Y$/);
    if (!match) return null;
    return match[1]
        .toLowerCase()
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

// Fallback design name derived from the ASSET PATH when no label is available (2026-08-11 09:56 EDT).
// `nameplates/nameplates/twilight/` -> "Twilight". This exists because `label` is NOT guaranteed to
// reach us on every path: discord.js's GuildMember carries it, but a nameplate whose label field is
// absent (or a future payload that trims it) would otherwise head its PERMANENT cache-channel entry
// as the generic "Nameplate" forever -- a wrong value written into a cache that is never revisited.
//
// Confirmed against the two real assets this bot has seen, the same two `deriveNameplateName` itself
// was verified on: `nameplates/nameplates/twilight/` -> "Twilight" (matches Discord's own shop title)
// and the `cat_beans` asset -> "Cat Beans". Two independent agreements is the same bar the palette
// table above was held to.
//
// ⚠️ Deliberately the FALLBACK, never the primary. `label` is Discord's own accessibility string and
// is authoritative; an asset path is a storage detail that Discord is free to make less readable at
// any time. Returns null rather than guessing whenever the path doesn't yield a clean segment.
function nameplateNameFromAsset(asset) {
    if (!asset) return null;
    const segments = String(asset).split('/').filter(Boolean);
    // The real shape is `nameplates/nameplates/<slug>/` -- demand the full depth rather than just
    // taking the last segment. Without this, a truncated `nameplates/` path yields the container word
    // itself and a nameplate gets confidently named "Nameplates".
    if (segments.length < 3) return null;
    const slug = segments[segments.length - 1];
    if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(slug)) return null;
    // ⚠️ A hex ASSET HASH passes the slug test -- caught by this function's own test rather than in
    // review, where `a0ff7f9be49be57356dd3cf0d9c02605` became the name "A0ff7f9be49be57356dd3cf0d9c02605".
    // Discord uses hash-shaped assets elsewhere (decorations are exactly that), so a nameplate path
    // could plausibly carry one. A fabricated name is worse than the generic heading, because it reads
    // as real and gets written into a permanent cache.
    if (slug.length >= 16 && /^[0-9a-f]+$/.test(slug)) return null;
    return slug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Discord's OWN word for a bed colour, formatted for display: `bubble_gum` -> "Bubble Gum".
// Returns null for `none`/unknown, which is the signal to fall back to the generic colour-naming
// library instead -- a design with no palette has no Discord-supplied name to prefer (Harkirat
// 2026-08-11 08:07 EDT). Deliberately derived from the KEYS of the table above rather than a second
// hand-maintained list, so a palette can never exist here without a name or vice versa.
function nameplatePaletteLabel(paletteName) {
    if (!paletteName || !NAMEPLATE_PALETTES[paletteName]) return null;
    return paletteName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

module.exports = { NAMEPLATE_PALETTES, NAMEPLATE_GRADIENT_STOPS, nameplatePaletteHex, deriveNameplateName, nameplateNameFromAsset, nameplatePaletteLabel };
