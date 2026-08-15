// utils/colorPaletteView.js -- render logic for /settings' "View Colors" panel and the standalone
// /colors command (utils/colorPalette.js does the data side: fetching+caching each source's color
// breakdown). Kept separate from that file the same way every other command's render logic is split
// from its data-fetching, and from handlers/router.js's routing the same way every other panel's render lives
// in utils/ rather than inline.
const namer = require('color-namer');
const { assignColorNames } = require('./colorNames');
const { chromaOfHex } = require('./colorExtract');
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

// heading: the possessive pattern ("{@user}'s Avatar Colors") -- reworded 2026-08-15 from the older
// "Colors From Your Avatar {@user}" phrasing, which read oddly once a mention followed "Your" directly
// (whose profile is it, "your" or the mentioned user's?). label: the page-switch button text --
// "Deco" not "Decoration" per Harkirat's request.
const SOURCE_META = {
    avatar: { label: 'Avatar', heading: 'Avatar' },
    banner: { label: 'Banner', heading: 'Banner' },
    name: { label: 'Name', heading: 'Display Name' },
    nameplate: { label: 'Nameplate', heading: 'Nameplate' },
    decoration: { label: 'Deco', heading: 'Decoration' }
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

// REDESIGNED 2026-08-11 13:45 EDT. Harkirat rejected the previous set outright -- "improvement doesn't
// mean slap on more words... the way it classifies, the way it phrases, the words it uses, the
// intuitiveness, the uniqueness, the expansiveness, the relevance" -- and a first attempt that only
// renamed them was rejected again. Three things were actually wrong, and only the third is wording:
//
// 1. HALF THE LABELS RESTATED THE ROW'S OWN POSITION. "Most Common" means *it is first in the list*;
//    "Second Most Common" means *it is second*. The reader is looking at the order. Those carried zero
//    information and could not be fixed by renaming -- they had to be replaced with something that
//    says what the colour DOES. Rank is no longer a label rule at all.
// 2. THE EXTRACTOR KNEW SOMETHING THE LABELS THREW AWAY. getColorPalette runs two pools, and an
//    ACCENT-pool colour is by construction a small, highly chromatic feature -- the cat's red eyes, a
//    gold sparkle. That is real semantic knowledge about what a colour IS, and the old rules ignored it
//    and re-derived weaker facts from HSL statistics instead. `origin` now reaches this function.
// 3. IT CLASSIFIED BY STATISTIC, NOT BY ROLE. Coverage and saturation ranks are properties of numbers.
//    A reader wants to know what the colour is doing in the picture: is it the ground everything sits
//    on, the thing that catches your eye, the shadow, the edge?
//
// So the rules below run in ROLE order -- what KIND of thing is this (from pool + coverage), then how
// it relates to the dominant colour -- and each label states the role rather than the measurement.
// Greedy: a rule claims the best-matching UNCLAIMED entry, and only when the entry genuinely earns the
// threshold, so no two entries on a page share a label and nothing is forced.
//
// 4. REWORDED 2026-08-12 00:45 EDT -- THE RULES ABOVE WERE RIGHT AND THE PHRASING WAS STILL WRONG.
//    Harkirat, on the shipped set: "cools it down", "cuts against it", "warms it up", "sets the tone",
//    "fills the space", "backs it up", "adds depth", "holds the middle", "opens it up" -- "what is
//    'IT'???" Every one of those is a verb phrase whose object is an antecedent the caption never
//    supplies, which is the SAME defect as the "Lighter Version"/"Same Family" rejection one round
//    earlier, wearing a verb instead of an adjective. The ones he kept -- catches the eye, brightest
//    light, quiet echo, edge detail, pop of color, quiet neutral -- are NOUN PHRASES that name the
//    thing outright ("Catches the Eye" survives because "the eye" is the reader's own, not a swatch).
//    So every label here is now a self-contained noun phrase, and the classification below did not
//    change: this was a naming pass over rules that measure the right things.
//    ⚠️ THE TEST FOR A NEW LABEL: read it alone, with no other swatch visible. If it makes you ask
//    "than what?" or "of what?", it is the rejected pattern again regardless of how it is worded.
//
// ⚠️ `origin` is absent for a palette restored from an older Cloudinary cache entry (the wire format
// gained its accent flag later). Missing is treated as `structure`, which costs at most one label
// nuance and never breaks -- do not make any rule REQUIRE it.
function assignDynamicLabels(entries, kind) {
    const hsl = entries.map(e => rgbToHslLocal(e.hex));
    // ⚠️ COLOURFULNESS IS JUDGED IN CHROMA, NOT HSL SATURATION. HSL's `s` blows up at the lightness
    // extremes -- `#FDFEFE` reports 0.333 and `#020311` reports 0.789 -- so every saturation threshold
    // in the previous version of this function was meaningless for near-whites and near-blacks, which
    // are two of the commonest swatches there are. Chroma (OKLab) behaves the same at every lightness.
    // Its range is ~0-0.37, NOT 0-1: do not paste an old `s` threshold in here without rescaling.
    const chroma = entries.map(e => chromaOfHex(e.hex));
    const claimed = new Set();
    const usedLabels = new Set();
    const labels = new Array(entries.length).fill(null);
    const unclaimed = () => entries.map((_, i) => i).filter(i => !claimed.has(i));
    const claim = (idx, label) => { labels[idx] = label; claimed.add(idx); usedLabels.add(label); };
    // Claims the FIRST (best-sorted) candidate from a pre-filtered, pre-sorted list, if any exists.
    // ⚠️ It also refuses a label already used on this page. Two rules may legitimately want the SAME
    // caption -- "Catches the Eye" is the honest thing to say about both a small accent feature and
    // the one vivid colour in a picture whose ground has none -- and whichever fires first should own
    // it, rather than the set needing a second, weaker synonym invented for the loser.
    const tryClaim = (candidates, label) => {
        if (candidates.length === 0 || usedLabels.has(label)) return false;
        claim(candidates[0], label);
        return true;
    };
    // Same, but the rule offers VARIANTS and the winning swatch picks which one describes it -- the
    // first `[test, label]` pair whose test passes and whose label is still free.
    //
    // 📐 THIS IS THE SHAPE HARKIRAT ASKED FOR, 2026-08-12 11:08 EDT, and it is why the vocabulary is
    // bigger than the rule count. Reviewing the second round of candidates he kept picking TWO per
    // rule and explaining when each applies -- on soft vs muted: "soft implies lighter, gentle, whites,
    // greys, baby pink, powder blue... muted implies matte, sophisticated, darker, slate blue, dusty
    // rose. While yes they're kind of the same thing, they also have situations where 1 is better than
    // the other." Same for Quiet Hint vs Hint of Color ("if it's more punchy yk?") and Stray Shade vs
    // Stray Color ("shade and color kind of are different things"). So a rule answers WHICH ROLE this
    // swatch plays and the variant answers WHAT THE SWATCH IS LIKE. One caption, two facts.
    const claimBest = (candidates, variants) => {
        if (candidates.length === 0) return false;
        const i = candidates[0];
        for (const [test, label] of variants) {
            if (test(i) && !usedLabels.has(label)) { claim(i, label); return true; }
        }
        return false;
    };
    // Shared thresholds for the variant tests, named rather than inlined so the whole vocabulary reads
    // off ONE set of boundaries. ⚠️ Chroma range is ~0-0.37 (see above), so these are not HSL numbers.
    const PUNCHY = 0.12;   // unmistakably a colour: Wild Card, Hint of Color, Vibrant/Loud Accent
    const COLOURED = 0.07; // has a colour rather than a cast: Warm Accent over Warm Trace
    const FAINT = 0.045;   // barely a colour at all: Undertone over Deep Tone, Stray Shade over Color
    const LIGHT_L = 0.6;   // pastel/airy rather than dusty: Soft Accent over Muted Accent
    // ⚠️ THE ONE NON-CHROMA THRESHOLD, and it is a ceiling as well as a floor. At or above this share
    // a colour is GROUND, not a feature -- so it earns "Prominent", and the feature captions must step
    // aside. Measured on the 246-image corpus: 15 swatches covering 22-46% were captioned "Pop of
    // Color" or "Catches the Eye", one of them 46% of the image. Both come from the ACCENT pool, which
    // clusters the most chromatic pixels and therefore returns a large region whenever a picture is
    // mostly one vivid colour -- pool membership says a colour is chromatic, never that it is small.
    const LARGE_AREA = 22;
    // ⚠️ `percent` IS NOT A SHARE OF THE IMAGE, and every area rule below would inherit the error if it
    // used the raw number. `getColorPalette` runs two pools and the ACCENT pool is a SUBSET of the
    // structure pool's pixels, so a colour clustered in both has its two shares summed when they merge.
    // Measured on the 246-image corpus: 92 palettes sum above 100%, the worst to 155%, and two single
    // entries report over 100% on their own -- a share of the image that cannot exist.
    // ✅ FIXED AT THE SOURCE the same day (2026-08-12 13:26 EDT): getColorPalette now re-assigns every
    // sampled pixel to its nearest final centroid, so a fresh palette sums to 100 and this rescale is a
    // no-op for it. ⚠️ KEEP IT ANYWAY -- it is the compatibility path for a palette restored from a
    // Cloudinary entry written BEFORE that fix, whose stored percents are still inflated and which the
    // per-user caches will keep serving until the underlying image changes (they key on the image hash,
    // not on the algorithm). Rescaling to the palette's own total makes these PROPORTIONS, which is all
    // any rule here needs: "is this a region or a sliver".
    const totalPercent = entries.reduce((n, e) => n + (e.percent || 0), 0);
    const areaScale = totalPercent > 100 ? 100 / totalPercent : 1;
    const area = i => (entries[i].percent || 0) * areaScale;

    if (entries.length === 0) return labels;

    // ── SLOT 0: what the source reads as ─────────────────────────────────────────────────────────
    // ⚠️ NAMEPLATE leads with its BED, not a measurement (Harkirat 2026-08-11 07:55 EDT). A nameplate
    // gets only 4 swatches and its background is a design fact, so entry 0 IS the bed (prepended
    // exactly, never extracted) and entries 1-3 come from the upper art layer.
    // For everything else: "First Impression" -- the colour you register before any other, which is
    // what dominating an image actually DOES to a viewer. This slot has now burned through four
    // wordings and each rejection taught something different: "Most Common" restated the row's own
    // position, "Sets the Tone" left "the tone" of an unnamed thing hanging, and "Base Color" was
    // rejected on sight as lazy and generic (Harkirat 2026-08-12 00:50 EDT) -- the same objection that
    // killed "Majority Color" and "Secondary Color" before it. A category word plus "Color" is not a
    // label here; it is the absence of one.
    claim(0, kind === 'nameplate' ? 'Nameplate Background' : 'First Impression');

    // ── DERIVED: not a colour from the picture at all, and it must say so BEFORE anything else ─────
    // `getColorPalette` appends one manufactured swatch when the page ladder needs a count it could not
    // find honestly (3 -> 4, 7 -> 8, only after a retry with more seeds has failed). It is placed in
    // the palette's emptiest lightness gap and borrows hue and chroma from its nearest neighbour.
    //
    // ⚠️ THIS RULE FIRES FIRST BECAUSE EVERY OTHER CAPTION HERE IS A CLAIM ABOUT THE IMAGE, AND FOR
    // THIS SWATCH EVERY SUCH CLAIM IS FALSE. Measured before the rule existed, the 22 derived swatches
    // across the corpus drew "Edge Detail" (asserts a small feature at an edge), "Deepest Shadow"
    // (asserts the darkest region), "Highlight", "Palest Tone", "Warm Accent" -- all describing parts
    // of a picture that do not contain this colour. `percent` is 0 on a derived entry, which is what
    // funnels it into the small-area rules specifically.
    //
    // The variants key off the swatch's own lightness, the same measurable-property discipline the rest
    // of the vocabulary uses -- a variant that answers to nothing is noise. They are deliberately NOT
    // comparatives: "Lighter Tint" asks "than what?" and is the rejected pattern (the Display Name
    // page's own "Lighter Tint"/"Darker Shade" predate this vocabulary and sit beside an explicitly
    // labelled base, which is why they read cleanly there and would not here).
    // Only ever one derived entry per palette (the ladder fills by at most one), so no sort is needed
    // to pick "the best" candidate -- but the filter still runs through `unclaimed` so that a future
    // change adding a second one cannot silently overwrite a claim.
    const derived = unclaimed().filter(i => entries[i].origin === 'derived');
    claimBest(derived, [
        [i => hsl[i].l >= 0.6, 'Synthetic Tint'],
        [i => hsl[i].l <= 0.35, 'Synthetic Shade'],
        [() => true, 'Synthetic Tone']
    ]);

    const maj = hsl[0];
    const isAccent = i => entries[i].origin === 'accent';
    const chromaRank = i => chroma[i];
    // ⚠️ Whether the DOMINANT colour has any colour of its own decides which rules can speak at all --
    // see the saturation guard further down, and the vivid rule immediately below.
    const MAJ_HAS_COLOUR = chroma[0] >= 0.045;

    // ── KIND: what sort of thing is this colour, before any relationship to the dominant one ─────
    // The accent pool exists because a region covering ~1% can never win a slot on prevalence. Such a
    // colour is a FEATURE, and saying so is the single most useful thing a label here can do -- it is
    // also the only fact in this whole function that statistics cannot recover.
    //
    // ⚠️ POOL MEMBERSHIP ALONE IS NOT ENOUGH, and the first version of this shipped that mistake into a
    // test run: the accent pool is the most chromatic tail OF THIS IMAGE, so on a sepia photo it
    // returns beige and on a near-greyscale avatar it returns grey-blue. Labelling those "Catches the
    // Eye" and "Pop of Color" promises a vividness the colour plainly does not have. Both rules
    // therefore also require the colour to stand out against THIS palette (above its median
    // saturation) and to clear an absolute floor, so the claim is true in the picture and on its own.
    const sats = [...chroma].sort((a, b) => a - b);
    const medianSat = sats.length ? sats[Math.floor(sats.length / 2)] : 0;
    const standsOut = (i, margin) => chroma[i] >= medianSat + margin;
    // When the ground itself has no colour, the vivid swatch IS the thing your eye goes to, so it takes
    // that caption first and the accent rule below settles for "Pop of Color". This used to be a
    // separate late rule needing a caption of its own, and every candidate was either a uniqueness
    // claim that a later "Pop of Color" on the same page contradicted (real case: cinnasip.png) or a
    // near-synonym of it. Reusing the true caption beats inventing a weaker one.
    // ⚠️ EVERY FEATURE CAPTION IS CAPPED AT LARGE_AREA -- see that constant. A colour covering half the
    // picture is what the picture IS, so it belongs to "Prominent" below, whatever pool it came from.
    tryClaim(
        unclaimed().filter(i => !MAJ_HAS_COLOUR && chroma[i] > 0.12 && area(i) < LARGE_AREA)
            .sort((a, b) => chromaRank(b) - chromaRank(a)),
        'Catches the Eye'
    );
    tryClaim(
        unclaimed().filter(i => isAccent(i) && area(i) <= 12 && chroma[i] > 0.11 && standsOut(i, 0.035))
            .sort((a, b) => chromaRank(b) - chromaRank(a)),
        'Catches the Eye'
    );
    tryClaim(
        unclaimed().filter(i => isAccent(i) && chroma[i] > 0.07 && standsOut(i, 0.02) && area(i) < LARGE_AREA)
            .sort((a, b) => chromaRank(b) - chromaRank(a)),
        'Pop of Color'
    );
    // A second colour covering a really large share isn't "second place", it is co-ground: the thing
    // the subject sits on. Threshold is deliberately high so this means area, not rank. The variant
    // asks whether that area comes FORWARD or sits BEHIND: a big block of real colour is prominent, a
    // big block of near-neutral is the thing everything else is placed against.
    claimBest(
        unclaimed().filter(i => area(i) >= LARGE_AREA).sort((a, b) => area(b) - area(a)),
        [[i => chroma[i] >= COLOURED, 'Prominent'], [() => true, 'Backdrop']]
    );
    // A tiny, low-chroma sliver is edging/antialiasing -- real, and worth naming honestly rather than
    // dressing up as a design decision.
    tryClaim(
        unclaimed().filter(i => area(i) <= 3 && chroma[i] <= 0.09).sort((a, b) => area(a) - area(b)),
        'Edge Detail'
    );

    // ── EXTREMES: true of the whole palette, not of a pairwise comparison ────────────────────────
    tryClaim(unclaimed().filter(i => hsl[i].l < 0.3).sort((a, b) => hsl[a].l - hsl[b].l), 'Deepest Shadow');
    // ⚠️ "Brightest Light" is GONE (Harkirat 2026-08-12 11:27 EDT). Two things were wrong with it: it
    // says the same word twice, and it collided with "Highlight" below -- the palette's lightest swatch
    // and a swatch merely lighter than the ground could sit two rows apart making what reads as one
    // claim. His replacement is situational, and the three adjectives are three genuinely different
    // states rather than synonyms: LIGHTEST when there is no colour there to describe (near-white),
    // PALEST when there is colour but it is washed out, BRIGHTEST when the colour is really present.
    // 🚫 He floated a full "Lightest/Palest/Brightest" x "Note/Shade/Tone/Point" matrix; only the
    // adjectives were kept as variants. Twelve cells would need twelve distinguishable states and
    // there are three -- the extra nouns would be picked at random, which is precisely the defect the
    // fallback pool below was rewritten to remove. A variant must answer to a property or it is noise.
    claimBest(unclaimed().filter(i => hsl[i].l > 0.72).sort((a, b) => hsl[b].l - hsl[a].l), [
        [i => chroma[i] >= PUNCHY, 'Brightest Point'],
        [i => chroma[i] >= FAINT, 'Palest Tone'],
        [() => true, 'Lightest']
    ]);
    tryClaim(unclaimed().filter(i => chroma[i] < 0.035).sort((a, b) => chroma[a] - chroma[b]), 'Quiet Neutral');

    // ── RELATIONSHIP to the dominant colour ─────────────────────────────────────────────────────
    // ⚠️ These rules MEASURE a relationship but must never NAME one -- that is the whole 2026-08-12
    // 00:45 EDT rewording. The comparison to the dominant colour decides WHICH entry qualifies; the caption then
    // states a property the swatch has on its own ("Warm Streak", not "Warms It Up").
    //
    // ⚠️ A HUE CLAIM NEEDS A COLOUR TO MAKE IT ABOUT -- the same trap the MAJ_HAS_COLOUR guard below
    // catches for saturation, found again here on 2026-08-12 00:52 EDT while reading the reworded
    // corpus. Hue is meaningless at near-zero chroma (two greys that differ by a rounding step can sit
    // 130° apart), so the old rules called `#BABCB0` "Cuts Against It" against a `#9CA6AC` dominant --
    // two greys, one of them accused of clashing. The reworded label made the same defect louder
    // ("Odd One Out" is a stronger claim than the vague verb was), which is how it got noticed.
    // Measured across the corpus, the split is unambiguous: every near-neutral claimant sat at chroma
    // 0.016-0.033 and every genuine one at 0.054+, so the floor sits between them and just above what
    // "Quiet Neutral" itself calls neutral (0.035). Below it these three rules simply don't apply, and
    // the entry falls through to the lightness and "Close Harmony" rules, which say something true of a grey.
    const HUE_MEANINGFUL = 0.04;
    const hasHue = i => chroma[i] >= HUE_MEANINGFUL;
    // Temperature only counts as a contrast when the dominant colour ISN'T already that temperature --
    // otherwise "Warm" describes the whole picture rather than this swatch.
    const byHueDistance = (a, b) => hueDistance(hsl[b].h, maj.h) - hueDistance(hsl[a].h, maj.h);
    // 🤝 COMPLEMENTS RUN BEFORE TEMPERATURE, and the order is the entire point. At 150-210 degrees with
    // real colour on both sides this is not an oddity, it is a COMPLEMENTARY PAIR -- the one
    // relationship in colour theory where two hues actively reinforce each other -- so "Synergetic"
    // (Harkirat's word, 2026-08-12 12:04 EDT) is the truest thing available to say about it.
    // ⚠️ IT MUST OUTRANK Warm/Cool Accent OR IT NEVER SPEAKS. A complement is almost always the
    // opposite TEMPERATURE too, so the temperature rule was claiming these swatches one step earlier
    // and the tier fired exactly ONCE in 889 swatches. ⚠️ And note how that was nearly missed: a
    // pre-check counted complements present in each PALETTE (10 across 7 images) rather than ones still
    // unclaimed when the rule runs, which is a different number entirely -- in a greedy claim pipeline,
    // eligibility is never a property of the palette alone. "Cool Accent" was not wrong on those
    // swatches, only vaguer: both are true, and the more specific true thing wins.
    // Hue or Shade follows the swatch, since "Shade" on a pale complement reads wrong in the ordinary
    // sense of the word.
    const isComplement = i => hasHue(i) && chroma[i] >= COLOURED && chroma[0] >= COLOURED && hueDistance(hsl[i].h, maj.h) >= 150;
    claimBest(unclaimed().filter(isComplement).sort(byHueDistance), [
        [i => hsl[i].l < 0.45, 'Synergetic Shade'],
        [() => true, 'Synergetic Hue']
    ]);
    // Accent vs Trace is a question of how much colour is actually there: an unmistakable warm hue is a
    // Warm Accent, a faint warmth over a cool picture is a Warm Trace.
    if (!isWarmHue(maj.h)) {
        claimBest(unclaimed().filter(i => hasHue(i) && isWarmHue(hsl[i].h)).sort(byHueDistance),
            [[i => chroma[i] >= COLOURED, 'Warm Accent'], [() => true, 'Warm Trace']]);
    }
    if (!isCoolHue(maj.h)) {
        claimBest(unclaimed().filter(i => hasHue(i) && isCoolHue(hsl[i].h)).sort(byHueDistance),
            [[i => chroma[i] >= COLOURED, 'Cool Accent'], [() => true, 'Cool Trace']]);
    }
    // The hue unlike everything else on the page -- a comparison the reader CAN make, unlike the
    // rejected "Cuts Against It"/"Across the Wheel". A vivid one is a Wild Card (it reads as a
    // deliberate surprise); a muted one is just an Outlier.
    // (A true complement was already taken above; what reaches here is distant WITHOUT that pairing.)
    claimBest(unclaimed().filter(i => hasHue(i) && hueDistance(hsl[i].h, maj.h) > 60).sort(byHueDistance),
        [[i => chroma[i] >= PUNCHY, 'Wild Card'], [() => true, 'Outlier']]);
    // Darker than the dominant. "Undertone" when it is barely a colour -- the shadow sitting under
    // everything -- and "Deep Tone" when it is a rich dark colour in its own right. ⚠️ Both are BARE:
    // "Deeper Shade"/"Lighter Tint" were rejected on sight (Harkirat 2026-08-12 11:08 EDT: "*deeper/
    // lighter* than *what*?"), which is the dangling-referent test catching a comparative adjective
    // rather than a pronoun. A comparative IS a comparison, however colour-flavoured the noun is.
    claimBest(unclaimed().filter(i => hsl[i].l < maj.l - 0.15).sort((a, b) => hsl[a].l - hsl[b].l),
        [[i => chroma[i] < FAINT, 'Undertone'], [() => true, 'Deep Tone']]);
    tryClaim(unclaimed().filter(i => hsl[i].l > maj.l + 0.15).sort((a, b) => hsl[b].l - hsl[a].l), 'Highlight');
    // ⚠️ SATURATION COMPARISONS NEED A COLOURED REFERENCE, and without this guard they produce
    // nonsense on the commonest palette shape there is. When the dominant colour is near-white or grey
    // (chroma ~ 0), EVERY other swatch is more colourful than it, so a pale pink on a white avatar
    // was labelled the boldest colour in the picture -- true by arithmetic, absurd to read. Below this threshold the
    // dominant has no colour to turn up or tone down, and these two rules simply don't apply. (The
    // colourless-ground case is handled at the top, where the vivid swatch takes "Catches the Eye".)
    // The bolder-than-the-ground rule runs on two different tests and Harkirat asked for a different
    // word on each (2026-08-12 11:08 EDT, "split them"): against a coloured dominant this is the swatch
    // that shouts over it -- a LOUD ACCENT -- while against a black/white/grey ground it is simply the
    // one that has colour at all, a VIBRANT ACCENT. They can never both fire on one page, so the split
    // costs nothing and says something truer than one word covering both would. The second branch also
    // stops a genuinely vivid colour on a near-black avatar (real case: Cornflower Blue) falling all
    // the way through to "Quiet Echo".
    claimBest(
        unclaimed().filter(i => MAJ_HAS_COLOUR ? chroma[i] > chroma[0] + 0.045 : chroma[i] > PUNCHY)
            .sort((a, b) => chroma[b] - chroma[a]),
        [[() => MAJ_HAS_COLOUR, 'Loud Accent'], [() => true, 'Vibrant Accent']]
    );
    // Softer than the ground, and here the variant carries a real distinction Harkirat drew: SOFT is
    // light and gentle (powder blue, baby pink, off-white), MUTED is dusty and matte (slate blue, dusty
    // rose). Same rule, different swatch, genuinely different word.
    if (MAJ_HAS_COLOUR) {
        claimBest(unclaimed().filter(i => chroma[i] < chroma[0] - 0.03).sort((a, b) => chroma[a] - chroma[b]),
            [[i => hsl[i].l >= LIGHT_L, 'Soft Accent'], [() => true, 'Muted Accent']]);
    }
    // A colour in the dominant's own hue family that is neither lighter, darker, bolder nor softer
    // enough to have been claimed above. Without this, a palette of four close cyans runs out of real
    // categories and drops into the fallback pool -- which is exactly what the swirl deco did.
    // "Harmonic" for a hue that is essentially the same note, "Neighboring Shade" for one a step along.
    // Both are whole ideas on their own; the rejected "Backs It Up" and "Same Family" made the reader
    // supply the thing being backed up or matched.
    // ⚠️ THE TWO GREY TIERS COME FIRST, and they exist because the 889-swatch corpus caught this rule
    // claiming harmony for swatches that have no hue to harmonise WITH -- 7 near-greys at chroma
    // 0.01-0.04, e.g. "Spanish Gray -> Harmonic". This rule deliberately has no hue floor (it is where
    // neutrals land after the floored rules pass them over), so the honesty has to live in the wording:
    // a swatch with a trace of colour is a Muted Harmony, one with none at all is just a Neutral Shade.
    claimBest(unclaimed().filter(i => hueDistance(hsl[i].h, maj.h) <= 30).sort((a, b) => hueDistance(hsl[a].h, maj.h) - hueDistance(hsl[b].h, maj.h)), [
        [i => chroma[i] < 0.02, 'Neutral Shade'],
        [i => chroma[i] < FAINT, 'Muted Harmony'],
        [i => hueDistance(hsl[i].h, maj.h) <= 15, 'Harmonic'],
        [() => true, 'Neighboring Shade']
    ]);
    // Whatever is left that most closely echoes the dominant colour. "Quiet Echo" is honest about being
    // unremarkable -- the older "Similar To Main" said the same thing in system-speak.
    // ⚠️ "QUIET" IS A CLAIM ABOUT THE SWATCH, and the 889-swatch corpus caught it being false 6 times,
    // worst of them an Orange-Red at chroma 0.19 on `neon red.png` captioned "Quiet Echo". The echo is
    // real -- the rule finds the entry closest to the dominant in lightness, chroma and hue -- so what
    // needed fixing was the adjective, not the rule. Harkirat 2026-08-12 11:59 EDT: "Vivid Echo and
    // just Echo sound good and honestly i feel like they can be used for different circumstances."
    // Bare "Echo" carries the middle, where the swatch is neither quiet nor loud enough to say so.
    if (unclaimed().length > 0) {
        const closest = [...unclaimed()].sort((a, b) => {
            const da = Math.abs(hsl[a].l - maj.l) + Math.abs(chroma[a] - chroma[0]) + hueDistance(hsl[a].h, maj.h) / 360;
            const db = Math.abs(hsl[b].l - maj.l) + Math.abs(chroma[b] - chroma[0]) + hueDistance(hsl[b].h, maj.h) / 360;
            return da - db;
        });
        claimBest(closest, [
            [i => chroma[i] >= PUNCHY, 'Vivid Echo'],
            [i => chroma[i] >= COLOURED, 'Echo'],
            [() => true, 'Quiet Echo']
        ]);
    }

    // Safety net only. Kept non-numbered so even a pathological case doesn't regress into "Accent
    // Color N", which is what the very first version of this did and Harkirat rejected -- and kept in
    // the same noun-phrase register as the real labels, because a fallback that IS reached (measured:
    // one swatch in a 133-swatch corpus, so "should never be reached" was optimistic) is read by a
    // user exactly like any other caption. The previous pool -- "Holds the Middle", "Sits Back",
    // "Breaks the Pattern", "Fills a Gap" -- was four more dangling referents waiting to surface.
    // ⚠️ IT IS NOT A ROTATING LIST ANY MORE. A rotation hands out whichever word is next, so a punchy
    // magenta could draw "Quiet Hint" purely because the counter was at 0 -- the pool would be the one
    // place in the function where the caption is unrelated to the swatch. Harkirat specified the
    // distinctions himself (2026-08-12 11:08 EDT): "Quiet Hint if it's a softer color or very minimal
    // and Hint of Color if it's more punchy", and Stray Shade vs Stray Color "because shade and color
    // kind of are different things". So the pool is ordered by what the swatch IS, and "Side Note"
    // catches whatever matches nothing.
    const fallbackVariants = [
        [i => chroma[i] >= PUNCHY, 'Hint of Color'],
        [i => chroma[i] >= COLOURED, 'Trace of Color'],
        // ⚠️ DARK BEFORE FAINT-COLOUR, and the order is the whole distinction. Harkirat's own reading
        // is that "shade and color kind of are different things" -- shade is the dark word. Testing
        // `Stray Color` first handed it to dark swatches at chroma 0.05 (measured: 3 in the 889-swatch
        // corpus, e.g. a near-black "Coffee"), which calls a shadow a colour.
        [i => hsl[i].l < 0.5, 'Stray Shade'],
        [i => chroma[i] >= FAINT, 'Stray Color'],
        [() => true, 'Quiet Hint'],
        [() => true, 'Side Note']
    ];
    for (const i of unclaimed()) {
        const pick = fallbackVariants.find(([test, label]) => test(i) && !usedLabels.has(label));
        // Every real path is covered above; the numbered tail exists only so a pathological palette
        // still renders a caption rather than `null`, and is why the pool is ordered widest-last.
        claim(i, pick ? pick[1] : `Side Note ${i + 1}`);
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
// relative label ("First Impression"/"Catches the Eye"/etc, or the Display Name page's own Gradient Start/
// End/Blend labels) as a small quoted caption. Returns both the component rows AND the raw file
// buffers the caller needs to attach alongside them.
async function buildEntryRows(entries) {
    const rows = [];
    const files = [];
    let i = 0;
    // `name` overrides the color-namer lookup when we know a BETTER name than a nearest-match guess.
    // The nameplate bed is the case that motivated it (Harkirat 2026-08-11 08:07 EDT): Discord itself
    // calls that colour "Violet"/"Cobalt", so showing its own word beats color-namer's nearest ntc
    // match ("Purple Heart", "Persian Blue") -- the palette name is the authoritative label, not an
    // approximation of one. Everything else still falls through to getColorName.
    for (const { label, hex, name } of entries) {
        if (hex == null) continue;
        const filename = `swatch_${i}.png`;
        files.push({ name: filename, data: await renderSwatchImage(hex) });
        rows.push({
            type: 9,
            components: [{ type: 10, content: `**${name || getColorName(hex)}**\nHex: \`${formatHex(hex)}\`\n> ${label}` }],
            accessory: { type: 11, media: { url: `attachment://${filename}` } }
        });
        i++;
    }
    return { rows, files };
}

// `palette` is whatever utils/colorExtract.js's getColorPalette() returned -- an array of
// `{ hex, percent }` sorted by prevalence (see that file's own revision-history comment for the full
// story of what this replaced). Labels come from assignDynamicLabels above, not the raw percent.
function buildSwatchEntries(palette, kind, bedName) {
    const entries = palette || [];
    const labels = assignDynamicLabels(entries, kind);
    const withAuthoritativeNames = entries.map((e, i) => ({
        label: labels[i],
        hex: e.hex,
        // Entry 0 of a nameplate IS the bed, so when Discord named that palette we show its word
        // rather than a nearest-match guess. Everything else, including every nameplate whose palette
        // is `none`, leaves this undefined and gets named by assignColorNames below.
        name: (kind === 'nameplate' && i === 0 && bedName) ? bedName : undefined
    }));
    // Resolved across the FULL entry set here, BEFORE pagination -- the same reason labels are: a name
    // claimed by a swatch on page 1 must not be handed to a different swatch on page 2.
    const names = assignColorNames(withAuthoritativeNames);
    return withAuthoritativeNames.map((e, i) => ({ ...e, name: names[i] }));
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
    const sourceLabel = variant === 'server' ? 'Server Profile' : 'Main Profile';
    const headingContent = `## <@${targetUserId}>'s ${meta.heading} Colors\n> Extracted from: **\`${sourceLabel}\`**`;
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
    // ⚠️ DOWNLOAD AVATAR/BANNER WAS BRIEFLY MOVED ONTO THIS LINE as a Section button accessory
    // (2026-08-12 22:15 EDT) and REVERTED at 23:41 the same evening on Harkirat's call after seeing it
    // rendered. Kept as a note rather than deleted because the constraint found on the way is real and
    // someone will propose the move again: a Section carries exactly ONE accessory, a thumbnail OR a
    // button, so the button can never join the avatar/decoration heading — that slot holds the source's
    // own thumbnail. The buttons live in the bottom action row instead; see their block further down.
    containerComponents.push({ type: 10, content: "-# Tap on the `#HEX` color code to copy it." });

    // Labels are computed against the FULL entry set BEFORE paginating (buildSwatchEntries already
    // does this) -- assigning "First Impression"/"Catches the Eye"/etc per-PAGE instead would produce
    // inconsistent results depending on which page a given color happened to land on (e.g. the real
    // eye-catching accent could end up on page 2, leaving page 1 with no "Catches the Eye" at all).
    const allEntries = effectiveSource === 'name'
        ? buildDisplayNameEntries(data.displayNameColors)
        : buildSwatchEntries(data[effectiveSource], effectiveSource, data.nameplateBedName);
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
    containerComponents.push({ type: 10, content: "-# Tap a button below to view colors from a different part of your profile.\n-# (Tip: Updated your profile? `Refresh Colors`)" });
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
    // a real re-extraction, bypassing the cache -- see handlers/colors.js's colors_refresh_ handler (10s
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
            label: v === 's' ? 'Show Main Colors' : 'Show Server Colors',
            custom_id: `colors_variant_${goingTo}_${effectiveSource}_${effectiveSubpage}|${targetUserId}`,
            // ⚠️ STYLE 2 (grey) IS DELIBERATE, not an unmade decision (Harkirat was 50/50 on it
            // 2026-08-12 22:11 EDT). Refresh Colors beside it is the row's one PRIMARY action; a second
            // blurple button gives the row two of them and neither reads as the main thing. This one is
            // lateral navigation -- it changes which colours you are looking at, it does not do work --
            // and the animated icon added the same day is what gives it identity, so it does not need
            // colour to do that job as well.
            emoji: emojis.parseEmoji(emojis.showColors)
        });
    }
    // Download Avatar/Banner (2026-07-18, v2 quick-wins batch) -- full-res, bottom, outside the
    // container, beside Refresh, matching /settings' existing avatar/banner download buttons
    // (same style-5 Link button pointed straight at the 4096px CDN url -- Discord renders a Link
    // button in grey same as a plain Secondary button, it just needs `url` instead of `custom_id`
    // since it's not an interaction at all, only a direct CDN link). Only shown on that source's
    // OWN page (Harkirat's spec: "on their respective color-menu pages"), not on every page --
    // Name/Nameplate/Deco have no equivalent full-res original worth downloading here.
    //
    // ⚠️ THEY WERE MOVED INSIDE THE CONTAINER FOR ONE EVENING (2026-08-12 22:15 EDT) AND REVERTED HERE
    // AT 23:41, on Harkirat's call after seeing it rendered. Kept as a note because the finding on the
    // way is real and the move will be proposed again: a Section carries exactly ONE accessory, a
    // thumbnail OR a button, so these can never sit in the avatar/decoration heading -- that slot holds
    // the source's own thumbnail, which is the subject of the page.
    if (effectiveSource === 'avatar' && data.avatarFullUrl) {
        refreshRowComponents.push({ type: 2, style: 5, label: 'Download Avatar', url: data.avatarFullUrl });
    }
    if (effectiveSource === 'banner' && data.bannerFullUrl) {
        refreshRowComponents.push({ type: 2, style: 5, label: 'Download Banner', url: data.bannerFullUrl });
    }
    const refreshRow = { type: 1, components: refreshRowComponents };

    return { components: [containerPayload, refreshRow], files };
}

// `buildSwatchEntries` is exported for verification only -- it is the unit that turns extracted
// colours into the name+label pair a reader actually sees, and the label rules above are judged on
// real palettes rather than on the thresholds in isolation. Nothing in the bot calls it from outside
// this file.
// The ephemeral follow-up the "Refresh Colors" button sends. Lives here rather than inline in
// handlers/colors.js because it is presentation, and because every one of its branches is INVISIBLE until
// somebody presses the button on exactly the right combination of state -- three verdicts, two
// per-view lists and a trailing line that is mutually exclusive with them. That is untestable inline
// and trivially testable as a function of its inputs.
//
// ⚠️ THE COPY IS HARKIRAT'S, SPECIFIED TO THE CHARACTER 2026-08-12 23:41 EDT. Do not "tidy" the
// wording, the emoji choice or the line breaks, and do not restore either earlier version: the menu
// shape from 21:44 the same evening (a per-source verdict plus two dim rows) is superseded, and the
// two-long-sentences version before that is superseded twice over. Three states:
//   · anything refreshed -> Eyedropper, "New colors found!", then a "Refreshed Main Profile:" and/or
//     "Refreshed Server Profile:" row, each naming its sources on the FOLLOWING line as bold-wrapped
//     code spans, then "Everything else is already up-to-date."
//   · nothing refreshed but the accent cache was cleared -> Eyedropper, the per-source accent line.
//   · nothing at all -> Swatches, "All colors are already up-to-date!" plus the determinism note.
//
// ⚠️ THE HEADLINE IS ABOUT THE PRESS, NOT ABOUT ONE SOURCE, and that is the substantive change from
// the 21:44 version. A sweep that refreshed the banner while the avatar on screen was unchanged is
// still "new colors found" -- reporting it per-source is exactly what made the old message insist
// nothing had happened while it had quietly updated three other pages.
//
// ⚠️ "Everything else is already up-to-date." is UNCONDITIONAL in that state, per the spec as written.
// It is the reassurance the whole rework exists to give -- the doubt that started this was "did it do
// the others?" -- so it answers that even when the two rows happen to cover every equipped source.
function buildRefreshNotice({ source, activeIsGuild = false, changed, accentCleared, refreshed = [] }) {
    const label = kind => SOURCE_META[kind]?.label || kind;

    // The source that was PRESSED belongs in whichever profile it actually resolved from -- which is
    // not the view the panel is in. A source with no server override resolves to the global image even
    // in the server view, so `activeIsGuild` is computed by the extractor from hashes and passed in.
    // It is listed only when it genuinely changed; the swept sources are in `refreshed` by definition.
    const mainProfile = [
        ...(changed && !activeIsGuild ? [label(source)] : []),
        ...refreshed.filter(r => !r.isGuild).map(r => label(r.kind))
    ];
    const serverProfile = [
        ...(changed && activeIsGuild ? [label(source)] : []),
        ...refreshed.filter(r => r.isGuild).map(r => label(r.kind))
    ];
    const row = (title, names) => names.length
        ? `\n-# Refreshed ${title}:\n**\`${names.join('` · `')}\`**`
        : '';

    // ⚠️ The headline is about the PRESS, not about one source, and that is the change from the first
    // version. A sweep that refreshed the banner while the avatar on screen was unchanged is still
    // "new colors found" -- reporting it per-source is what made the old message insist nothing had
    // happened while quietly updating three other pages.
    // Formatting reworked 2026-08-15 (Harkirat): a real ### heading instead of an inline bolded emoji
    // line, and the closing hint switched from "-#" small-text to italics -- the old hint used the SAME
    // "-#" style as the "Refreshed X:" row labels just above it, so the two blurred together visually.
    // Italics is now the one distinct "this is a hint, not a list label" signal.
    if (mainProfile.length || serverProfile.length) {
        return `### ${emojis.eyedropper} **New colors found!**`
            + row('Main Profile', mainProfile)
            + row('Server Profile', serverProfile)
            + '\n*Everything else is already up-to-date.*';
    }

    // Palette bytes matched, but that is not "nothing happened" when the accent cache was cleared: a
    // forced palette refresh may already have picked the change up on open, so this click's comparison
    // sees no delta even though its accent invalidation is the real, visible fix -- embeds tinted by
    // this source were stale until this exact press.
    if (accentCleared) {
        return `### ${emojis.eyedropper} **Accent refreshed**\n**${label(source)}** — palette matched, but its accent color was stale and is now refreshed.`;
    }

    return `### ${emojis.swatches} **All colors are already up-to-date!**`
        + '\n*The same image always gives the same colors — refresh after you change it.*';
}

module.exports = { buildColorPalettePanel, SOURCE_ORDER, SOURCE_META, getAvailableSources, buildSwatchEntries, buildRefreshNotice };
