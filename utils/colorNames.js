// utils/colorNames.js -- turns a hex into a name a human would actually use.
//
// WHY THIS EXISTS (2026-08-11 08:34 EDT, Harkirat: the old names "try too hard to be unique such as
// 'rajah' or 'robins egg blue'"). REWRITTEN 2026-08-11 13:20 EDT after a full investigation; the
// previous two-tier xkcd->ntc lookup and both of its selection rules were replaced. What changed and
// why is below, because every part of it was measured and the wrong lesson is easy to re-derive.
//
// ── THE VOCABULARY ────────────────────────────────────────────────────────────────────────────────
// Three lists, in preference order: WIKIPEDIA (812 names, vendored) -> XKCD (908, vendored) -> ntc
// (1,566, via color-namer). Wikipedia leads because it holds the register Harkirat asked for --
// "Mellow Apricot", "French Violet", "Terra Cotta", "Bright Lilac" -- which the other two simply do
// not contain.
//
// 🚫 DO NOT "just swap to one big list". MEASURED against 54 real names sampled from a reference app
// (Sip) and against a 20-image / 135-swatch corpus:
//   · `color-name-list` at 31,914 entries reproduced 3 of 54 -- WORSE than a list 35x smaller. At that
//     density the crowd-sourced novelty names ("Crown Chakra", "Fake Love", "Azuremyst Isle") sit
//     nearer to any given colour than the established ones, so the good names are unreachable.
//     Its 4,959 and 3,082-entry cuts scored 0 of 54.
//   · CSS `html`/`x11` (148) and `pantone` (120) are too coarse -- they collapse eight shades of one
//     image into repeats.
//   · Wikipedia alone was best of any SINGLE list (13-14 of 54) but is small enough to get stretched:
//     4 swatches in the corpus landed on a visibly wrong name.
// Bigger is NOT better; established-and-curated is. The union of all 46 vocabularies available on npm
// tops out at 15 of 54, so the reference app's exact list is not obtainable and was not chased.
//
// ── HOW A NAME IS CHOSEN (three rules, each fixing a measured defect) ──────────────────────────────
// 1. DISTANCE IS PERCEPTUAL (OKLab), not RGB. The previous version matched in RGB while the whole V3
//    extractor had moved to OKLab -- the naming layer never got the memo. Switching cut mean error
//    across the corpus by 32% and worst-case by half, with no vocabulary change at all.
// 2. PREFERRED-UNLESS-MEANINGFULLY-BEATEN (`MARGIN`). Wikipedia's name wins unless another list is
//    closer by more than a perceptually real amount. An absolute gate was tried first and is WRONG:
//    at a 0.03 cutoff, #730BC8 fell through to ntc's "Purple Heart" (0.040) over Wikipedia's "French
//    Violet" (0.044) -- a 0.004 accuracy gain, invisible to the eye, paid for with the register.
// 3. BASE-WORD DEDUPE. A palette of "Persian Blue / Tufts Blue / Clear Blue / Royal Blue" has four
//    distinct names and is still unreadable. Reusing a colour's BASE word (its last word) within one
//    palette is therefore avoided, not just reusing the whole name. This took the corpus from 83% to
//    99% of swatches carrying a distinct base word.
//
// ⚠️ THE OLD "SIMPLEST NAME WINS" TIEBREAK IS GONE, DELIBERATELY. It scored candidates by
// `words * 1000 + length` and so preferred the shorter of two near-ties. Measured: #FDBE74's best
// match IS "Apricot" (ΔE 0.030) and it lost to "Peach" (0.039) on a two-character difference. The rule
// was added for one case (#FEFEFE picking "Pale Grey" over "White") that no longer exists. Do not
// reintroduce it -- it is a blandness filter wearing a correctness costume.
//
// ⚠️ "BASICALLY WHITE" / "BASICALLY BLACK" ARE ALSO GONE (Harkirat 2026-08-11 13:20 EDT). They existed
// because the old 908-name vocabulary had nothing between "White" and a grey, so a near-white had to
// be qualified by hand. With Wikipedia in the pool there are real names there ("Baby Powder",
// "Cultured Pearl", "Eerie Black"), so the qualifier is solving a problem that no longer exists.
//
// ⚠️ NOT MEASURABLE FROM HERE, AND THE REASON THIS FILE CARRIES SO MANY NOTES: ΔE cannot tell
// "Mellow Apricot" from "Macaroni and Cheese" -- both score ~0.02 against #FDBE74. Any future tuning
// that optimises distance alone will happily make the names worse. A scoring pass that rewarded
// "self-describing" names was built and REJECTED for exactly this reason: it won its own metric 93%
// vs 47% and produced "Texas Rose" and "Fire Bush".
//
// ⚠️ BOTH VENDORED LISTS ARE DATA, NOT DEPENDENCIES. `color-name-lists` ships all 36 vocabularies in
// one 2.05 MB JSON retaining 6.90 MB of heap, with 8 transitive dependencies, for the ~1,700 names
// actually used here (43 KB on disk). See NOTICE for the Wikipedia list's CC BY-SA attribution.
const namer = require('color-namer');
const XKCD_NAMES = require('./data/xkcdColorNames.json');
const WIKIPEDIA_NAMES = require('./data/wikipediaColorNames.json');

// ⚠️ 41 ENTRIES WERE REMOVED FROM THE XKCD SOURCE LIST and must stay removed. That survey was public,
// so it contains crude joke names -- "shit brown", "diarrhea", "piss yellow", "baby poop green" (28 of
// them, all in the olive/mustard band a khaki avatar genuinely reaches), plus 11 with slashes that read
// badly as a label ("purple/blue") and 2 uselessly vague ones ("dark", "pale"). If that list is ever
// regenerated, re-apply the filter -- a crude name surfacing in a public bot is the failure mode this
// guards. The Wikipedia list is encyclopedic and needed no such pass.
//
// ⚠️ A PUBLIC SURVEY SPELLS THINGS HOW PEOPLE TYPED THEM. Applied at load rather than baked into the
// vendored JSON so the corrections stay visible and reviewable in code.
const NAME_FIXES = {
    Liliac: 'Lilac',
    Orangeish: 'Orangish',
    Purpleish: 'Purplish',
    'Purpleish Blue': 'Purplish Blue',
    'Purpleish Pink': 'Purplish Pink',
    Bluegreen: 'Blue Green',
    Bluegrey: 'Blue Grey',
    Greenblue: 'Green Blue',
    Greyblue: 'Grey Blue',
    Yellowgreen: 'Yellow Green',
    Orangered: 'Orange Red'
};
// Non-English entries the survey collected. Dropped rather than translated because the English
// equivalents are already in the list at nearly the same hex, so nothing becomes unreachable.
const DROPPED_NAMES = new Set(['Azul', 'Rosa']);

// How much closer another list must be before it outranks the preferred one. 0.02 in OKLab is a real
// perceptual step; below it the two names describe the same colour to the eye, so the tie should be
// settled on register rather than on a decimal. Tuned against the corpus: 0 gives pure best-fit (and
// hands 56% of names to ntc), 0.05 pushes everything to Wikipedia and reintroduces 3 poor matches.
const MARGIN = 0.02;
// A name is only allowed to answer at all within this distance -- past it the name is describing a
// visibly different colour and the next list should try instead.
const MAX_MATCH_DISTANCE = 0.10;

// ── OKLab, matching utils/colorExtract.js exactly ─────────────────────────────────────────────────
// Duplicated rather than imported: colorExtract requires nothing from here and this file is loaded by
// the view layer, so keeping them independent avoids a cycle for ~15 lines of pure maths.
function srgbToLinear(v) {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function rgbToOklab(r, g, b) {
    const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    return {
        L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    };
}
const labOfHex = hex => rgbToOklab((hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff);
const deltaE = (A, B) => Math.hypot(A.L - B.L, A.a - B.a, A.b - B.b);

// A name's BASE is its last word -- "Bright Lilac" -> "lilac". That is the word a reader actually
// keys on, which is why the dedupe below works on it rather than on the whole string.
const baseWordOf = name => name.toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/).pop();

// Precomputed once at load so a render never re-parses a list or recomputes a conversion.
function prepare(entries) {
    return entries.map(([name, hex]) => {
        const value = parseInt(hex.slice(1), 16);
        return { name, lab: labOfHex(value) };
    });
}
const WIKIPEDIA = prepare(WIKIPEDIA_NAMES);
const XKCD = prepare(
    XKCD_NAMES
        .filter(([name]) => !DROPPED_NAMES.has(name))
        .map(([name, hex]) => [NAME_FIXES[name] || name, hex])
);

// ntc stays a live lookup through color-namer rather than being vendored -- it is the last resort and
// answers ~6% of swatches, so precomputing 1,566 more Lab conversions at boot buys nothing.
const formatHex = hex => `#${hex.toString(16).padStart(6, '0').toUpperCase()}`;
function nearestNtc(hex) {
    const match = namer(formatHex(hex), { pick: ['ntc'] }).ntc[0];
    return { name: match.name, distance: deltaE(labOfHex(hex), labOfHex(parseInt(match.hex.replace('#', ''), 16))) };
}

// Best free candidate in one list: nearest by ΔE whose name and base word are both still unclaimed.
// Falls back to allowing a repeated base word (but never a repeated NAME) rather than returning
// nothing -- on a monochrome source every candidate legitimately shares a base.
function bestFrom(list, lab, usedNames, usedBases) {
    let best = null, bestSharing = null;
    for (const entry of list) {
        const d = deltaE(lab, entry.lab);
        if (usedNames.has(entry.name.toLowerCase())) continue;
        if (!usedBases.has(baseWordOf(entry.name))) {
            if (!best || d < best.distance) best = { name: entry.name, distance: d };
        } else if (!bestSharing || d < bestSharing.distance) {
            bestSharing = { name: entry.name, distance: d };
        }
    }
    return best || bestSharing;
}

// Names ONE hex, given what the rest of the palette has already claimed.
function pickName(hex, usedNames, usedBases) {
    const lab = labOfHex(hex);
    const wiki = bestFrom(WIKIPEDIA, lab, usedNames, usedBases);
    const xkcd = bestFrom(XKCD, lab, usedNames, usedBases);
    const ntc = nearestNtc(hex);

    // Wikipedia leads unless it is out of range entirely, or another list is meaningfully closer.
    const challengers = [xkcd, ntc].filter(Boolean);
    if (wiki && wiki.distance <= MAX_MATCH_DISTANCE) {
        const better = challengers
            .filter(c => c.distance < wiki.distance - MARGIN)
            .sort((a, b) => a.distance - b.distance)[0];
        return better || wiki;
    }
    return [wiki, ...challengers].filter(Boolean).sort((a, b) => a.distance - b.distance)[0];
}

// Names a WHOLE entry list at once, because a name claimed by one swatch must not be reused by
// another on the same page.
// ⚠️ Iteration order is load-bearing: an entry carrying an authoritative `name` (the nameplate bed,
// named by Discord itself) claims its word BEFORE any extracted colour can take it. Harkirat caught
// the collision this prevents -- a Violet bed beside an art colour whose nearest name is also
// "violet" printed "Violet" twice. The bed also claims its BASE word, so the art cannot come back as
// a second kind of violet either.
function assignColorNames(entries) {
    const usedNames = new Set();
    const usedBases = new Set();
    return entries.map(entry => {
        if (entry.name) {
            usedNames.add(entry.name.toLowerCase());
            usedBases.add(baseWordOf(entry.name));
            return entry.name;
        }
        const picked = pickName(entry.hex, usedNames, usedBases);
        usedNames.add(picked.name.toLowerCase());
        usedBases.add(baseWordOf(picked.name));
        return picked.name;
    });
}

module.exports = { assignColorNames, pickName, baseWordOf, MARGIN, MAX_MATCH_DISTANCE };
