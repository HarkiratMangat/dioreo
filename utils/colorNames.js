// utils/colorNames.js -- turns a hex into a name a human would actually use.
//
// WHY THIS EXISTS (2026-08-11 08:34 EDT, Harkirat: the old names "try too hard to be unique such as
// 'rajah' or 'robins egg blue'"). Naming is a two-tier lookup:
//   1. the XKCD colour-survey vocabulary -- crowdsourced from what ordinary people call colours, so it
//      says "Almost Black", "Dark Peach", "Yellowish Orange", "Metallic Blue";
//   2. `color-namer`'s ntc list as a fallback, used only when no xkcd name is close enough or the good
//      one is already taken elsewhere in the same palette.
//
// 🚫 DO NOT "just swap the library" -- surveyed and MEASURED across 146 real swatches, and the obvious
// candidates are all worse:
//   · color-namer's `basic`/`roygbiv` are WRONG, not merely coarse (a dodger blue named "violet").
//   · The CSS vocabularies (`html`/`x11`/`windows`, ~148 names) COLLAPSE a palette: 13-19 duplicate
//     name pairs across 10-12 of 22 images, one avatar reading "black" three times in eight slots,
//     against ntc's 3. Size is the reason -- 148 names cannot separate eight shades of one image.
//   · `color-name-list`'s 31,914 / 4,959 / 3,082-entry lists go the WRONG WAY: "Eigengrau", "Dream
//     Vapour", "Bacon Strips", "20000 Leagues Under the Sea".
// xkcd at 908 names beat the incumbent on BOTH axes -- plainer AND fewer collisions (2 pairs vs 3).
//
// ⚠️ THE LIST IS VENDORED, NOT A DEPENDENCY, and that was a measurement too. `color-name-lists` (MIT)
// ships all 36 vocabularies in one 2.05 MB JSON that retains **6.90 MB of heap** -- for the 908 names
// we actually use, which serialise to 22.5 KB. A 300x cost for frozen reference data on an e2-micro
// host was not worth a dependency. The XKCD survey results are public domain (Randall Munroe released
// them as such); `scripts/` has no generator because this is a one-time extraction, documented here.
//
// ⚠️ 41 ENTRIES WERE REMOVED FROM THE SOURCE LIST and must stay removed. The survey was public, so it
// contains crude joke names -- "shit brown", "diarrhea", "piss yellow", "baby poop green" (28 of them,
// all in the olive/mustard band a khaki avatar genuinely reaches), plus 11 with slashes that read
// badly as a label ("purple/blue") and 2 uselessly vague ones ("dark", "pale"). If this list is ever
// regenerated, re-apply that filter -- a crude name surfacing in a public bot is the failure mode.
const namer = require('color-namer');
const XKCD_NAMES = require('./data/xkcdColorNames.json');

// ⚠️ A PUBLIC SURVEY SPELLS THINGS HOW PEOPLE TYPED THEM. Applied at load rather than baked into the
// vendored JSON so the corrections stay visible and reviewable in code. Found by scanning the whole
// list for `-eish` forms, jammed compounds and non-English words -- not by patching whatever happened
// to surface, which is how the first three of these were noticed.
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

// Nearest-match runs in RGB rather than OKLab deliberately: the thresholds below were measured in RGB,
// and at ~900 points the vocabulary is dense enough that the metric barely changes which name wins.
// Precomputed once at load so a render never re-parses the list.
const XKCD_RGB = XKCD_NAMES
    .filter(([name]) => !DROPPED_NAMES.has(name))
    .map(([name, hex]) => ({
        name: NAME_FIXES[name] || name,
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    }));

// ⚠️ NEAREST ALONE PICKS BADLY ON NEAR-TIES. #FEFEFE is visually white, but "Pale Grey" (#FDFDFE) sits
// 0.3 RGB closer than "White" (#FFFFFF) and won -- a technically-correct answer that reads as wrong.
// So candidates within this margin of the best match are treated as equally correct, and the SIMPLEST
// name wins: fewest words first, then shortest.
const TIE_MARGIN = 2.5;

// Beyond this RGB distance the nearest xkcd name is describing a different colour than the one on
// screen, so ntc's far larger vocabulary gets a turn instead. Measured: at 26 the hybrid names 92% of
// real swatches from xkcd with a single duplicate pair across the whole corpus.
const MAX_MATCH_DISTANCE = 26;

const simplicity = name => {
    const words = name.split(' ').length;
    return words * 1000 + name.length; // fewer words dominates; shorter breaks the remaining tie
};

function nearestXkcd(hex) {
    const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
    let bestDist = Infinity;
    for (const c of XKCD_RGB) {
        const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
        if (d < bestDist) bestDist = d;
    }
    const cutoff = (Math.sqrt(bestDist) + TIE_MARGIN) ** 2;
    let best = null;
    for (const c of XKCD_RGB) {
        const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
        if (d <= cutoff && (!best || simplicity(c.name) < simplicity(best.name))) best = c;
    }
    return { name: best.name, distance: Math.sqrt(bestDist) };
}

const formatHex = hex => `#${hex.toString(16).padStart(6, '0').toUpperCase()}`;

// "White" and "Black" are the two names people read as EXACT rather than approximate -- a swatch
// labelled White that is actually #FEFEFE looks like the panel rounded off, and a near-black is even
// more common because extraction averages a dark region. So those two words are reserved for the true
// values and everything close gets an honest qualifier instead (Harkirat 2026-08-11 08:45 EDT).
// Only ever applied to names WE looked up -- an authoritative Discord palette name is returned as-is.
const EXACT_ONLY_NAMES = { White: 0xFFFFFF, Black: 0x000000 };
function qualifyExactness(name, hex) {
    const exact = EXACT_ONLY_NAMES[name];
    return exact !== undefined && hex !== exact ? `Basically ${name}` : name;
}

// Names a WHOLE entry list at once, because a name claimed by one swatch must not be reused by
// another on the same page.
// ⚠️ Iteration order is load-bearing: an entry carrying an authoritative `name` (the nameplate bed,
// named by Discord itself) claims its word BEFORE any extracted colour can take it. Harkirat caught
// the collision this prevents -- a Violet bed beside an art colour whose nearest name is also
// "violet" printed "Violet" twice.
function assignColorNames(entries) {
    const used = new Set();
    return entries.map(entry => {
        if (entry.name) { used.add(entry.name); return entry.name; }
        // Qualified BEFORE the collision check on purpose: "White" and "Basically White" are different
        // labels, so a palette holding both an exact and a near white keeps them as two readable names
        // instead of pushing the second into an unrelated fallback.
        const plain = nearestXkcd(entry.hex);
        const plainName = qualifyExactness(plain.name, entry.hex);
        if (plain.distance <= MAX_MATCH_DISTANCE && !used.has(plainName)) {
            used.add(plainName);
            return plainName;
        }
        const distinctive = qualifyExactness(namer(formatHex(entry.hex), { pick: ['ntc'] }).ntc[0].name, entry.hex);
        used.add(distinctive);
        return distinctive;
    });
}

module.exports = { assignColorNames, nearestXkcd, MAX_MATCH_DISTANCE };
