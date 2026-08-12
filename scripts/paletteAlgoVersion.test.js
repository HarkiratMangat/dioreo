// scripts/paletteAlgoVersion.test.js
// Regression test for the palette cache key -- utils/algoFingerprint.js and the PALETTE_ALGO_VERSION /
// paletteContextFields / readPaletteContext trio in utils/colorExtract.js. Added 2026-08-11 15:47 EDT.
// Run: `node scripts/paletteAlgoVersion.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS. Every failure mode of this key is SILENT, in both directions, and neither shows
// up as an error anywhere:
//   · Too STICKY (the key fails to move when the algorithm does) and every cached palette stays on a
//     superseded value forever, behind a marker asserting it is current. Nothing logs; the colours are
//     simply wrong, and they look exactly as plausible as correct ones. This is the failure the
//     hand-written release tag had, which is why it was replaced.
//   · Too TWITCHY (the key moves when the algorithm did not) and every cached design pays an ffmpeg
//     pass and a re-extraction to arrive at byte-identical output. Nothing breaks; a cost just appears
//     and never announces itself. The specific hazard here is this codebase's comment density --
//     comments in these files are edited constantly, so hashing them would invalidate the world every
//     time someone clarified a sentence.
// Both directions are asserted below, on purpose. A test that only checked "the hash is a string"
// would pass under either failure.
const assert = require('assert');
const { fingerprint } = require('../utils/algoFingerprint');
const {
    PALETTE_ALGO_VERSION, paletteContextFields, readPaletteContext
} = require('../utils/colorExtract');
const { MONTAGE_FINGERPRINT } = require('../utils/animatedMediaPipeline');

// Counted, never hardcoded -- a literal total in the summary is a copy of state that rots the moment
// a case is added, and it rotted within minutes of this file being written.
let failed = 0;
let passed = 0;
function t(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  PASS  ${name}`);
    } catch (err) {
        failed++;
        console.log(`  FAIL  ${name}\n        ${err.message}`);
    }
}

console.log('\npalette cache key — the fingerprint must move exactly when the algorithm does\n');

// --- Direction 1: it must NOT move for changes that cannot affect output.
t('the same function fingerprints identically twice', () => {
    const f = x => x * 2;
    assert.strictEqual(fingerprint(f), fingerprint(f));
});

t('a comment-only edit does NOT change the fingerprint', () => {
    const before = function scale(x) { /* doubles it */ return x * 2; };
    const after = function scale(x) {
        // Doubles it. Rewritten comment, at length, mentioning a URL like
        // https://example.test/whatever -- exactly the kind of edit these files get constantly.
        return x * 2;
    };
    assert.strictEqual(fingerprint(before), fingerprint(after));
});

t('reindenting does NOT change the fingerprint', () => {
    const tight = function f(a, b) { return a + b; };
    const loose = function f(a, b) {
        return a
            + b;
    };
    assert.strictEqual(fingerprint(tight), fingerprint(loose));
});

// --- Direction 2: it MUST move for anything that can affect output.
t('a changed function body DOES change the fingerprint', () => {
    assert.notStrictEqual(fingerprint(x => x * 2), fingerprint(x => x * 3));
});

t('a changed constant DOES change the fingerprint', () => {
    assert.notStrictEqual(fingerprint({ CHROMA_FLOOR: 0.04 }), fingerprint({ CHROMA_FLOOR: 0.05 }));
});

t('order of the inputs is part of the identity', () => {
    const a = x => x, b = x => -x;
    assert.notStrictEqual(fingerprint(a, b), fingerprint(b, a));
});

// --- The montage is part of the algorithm, not a neighbour of it. This is the case the first design
// missed: the tile-copy fix altered a swatch while touching nothing in colorExtract.js.
t('the montage fingerprint is a real input to the palette key', () => {
    assert.match(MONTAGE_FINGERPRINT, /^[0-9a-f]{12}$/);
    const withMontage = fingerprint('extractor-stub', MONTAGE_FINGERPRINT);
    const withOther = fingerprint('extractor-stub', 'ffffffffffff');
    assert.notStrictEqual(withMontage, withOther);
});

t('PALETTE_ALGO_VERSION is a 12-char hex digest, not a release string', () => {
    assert.match(PALETTE_ALGO_VERSION, /^[0-9a-f]{12}$/);
    // Guards the specific regression Harkirat rejected: a key that tracks the release number would
    // re-derive every cached palette on an ordinary version bump.
    assert.ok(!PALETTE_ALGO_VERSION.includes('.'), 'must not look like a semver string');
});

// --- The round trip the caches actually depend on.
const SAMPLE = [
    { hex: 0x3de7e9, percent: 31 },
    { hex: 0x127bf2, percent: 10, origin: 'accent' }
];

t('a palette written by the current algorithm reads back intact', () => {
    const fields = paletteContextFields(SAMPLE);
    assert.strictEqual(fields.palette_version, PALETTE_ALGO_VERSION);
    assert.deepStrictEqual(readPaletteContext(fields), SAMPLE);
});

t('a palette tagged by a DIFFERENT algorithm reads back as absent', () => {
    const fields = { ...paletteContextFields(SAMPLE), palette_version: 'deadbeefcafe' };
    assert.strictEqual(readPaletteContext(fields), null);
});

t('a palette with NO version marker reads back as absent', () => {
    // Every entry written before this mechanism existed is in exactly this shape, and every one of
    // them predates the rounding fix -- so "absent" is the correct reading, not a lenient fallback.
    const { palette } = paletteContextFields(SAMPLE);
    assert.strictEqual(readPaletteContext({ palette }), null);
});

t('a malformed palette reads as absent even under a correct version', () => {
    assert.strictEqual(
        readPaletteContext({ palette: 'not-a-palette', palette_version: PALETTE_ALGO_VERSION }),
        null
    );
});

// --- The `extra` channel: a caller folding its own output-affecting inputs into the key. Both halves
// must be given the same ones, and the asymmetric case is the one that would rot silently -- a palette
// written with extras and read without them would look permanently stale and re-derive on every view.
const NAMEPLATE_OPTS = { inputExt: '.webm', preInputArgs: ['-c:v', 'libvpx-vp9'], fps: 12 };
const DECORATION_OPTS = { inputExt: '.png', preInputArgs: ['-f', 'apng'], fps: 12 };

t('a palette written with extras reads back with the same extras', () => {
    const fields = paletteContextFields(SAMPLE, NAMEPLATE_OPTS);
    assert.notStrictEqual(fields.palette_version, PALETTE_ALGO_VERSION, 'extras must change the key');
    assert.deepStrictEqual(readPaletteContext(fields, NAMEPLATE_OPTS), SAMPLE);
});

t('reading WITHOUT the extras it was written with returns absent', () => {
    const fields = paletteContextFields(SAMPLE, NAMEPLATE_OPTS);
    assert.strictEqual(readPaletteContext(fields), null);
});

t('different extraction options produce different keys', () => {
    // Guards against a nameplate and a decoration agreeing on a key despite decoding differently --
    // `-f apng` vs `-c:v libvpx-vp9` is the difference between real alpha and none.
    assert.notStrictEqual(
        paletteContextFields(SAMPLE, NAMEPLATE_OPTS).palette_version,
        paletteContextFields(SAMPLE, DECORATION_OPTS).palette_version
    );
});

t('a changed fps DOES change the key', () => {
    assert.notStrictEqual(
        paletteContextFields(SAMPLE, NAMEPLATE_OPTS).palette_version,
        paletteContextFields(SAMPLE, { ...NAMEPLATE_OPTS, fps: 24 }).palette_version
    );
});

t('an empty palette produces no context fields at all', () => {
    // Must not write a version marker with nothing under it -- that would read as a valid current
    // palette of length zero on the next hit.
    assert.deepStrictEqual(paletteContextFields([]), {});
    assert.deepStrictEqual(paletteContextFields(null), {});
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
