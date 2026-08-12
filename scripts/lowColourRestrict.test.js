// scripts/lowColourRestrict.test.js
// Regression test for the LOW-COLOUR SOFT RESTRICT in utils/colorExtract.js -- the gate that decides
// a near-colourless image should show 4 swatches instead of 8, and the rule that decides WHICH 4.
// Added 2026-08-12 14:59 EDT. Run: `node scripts/lowColourRestrict.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS. Every failure mode here is SILENT, and worse, every one of them produces output
// that looks entirely reasonable on its own:
//   · Gate too EAGER and a real palette is truncated. The user sees four swatches and no error; the
//     colours that were thrown away are simply absent, and nothing anywhere records that they existed.
//     This is the bug the rebuild fixed -- a sepia avatar whose black and two dark browns were found
//     correctly by the extractor and then discarded for having no saturation.
//   · Gate too SHY and a greyscale ramp pads out to eight near-identical greys, which is the
//     behaviour the restrict was requested to prevent in the first place.
//   · Gate COUNT-DEPENDENT and the same image returns a different number of colours depending on the
//     pagination target it was asked for -- a hard flip on a continuous quantity, and the original
//     symptom that put this on the tracker.
//   · Selection too GREEDY and the restricted palette shows a colour the unrestricted palette would
//     never have shown. A soft restrict must be a SUBSET; showing fewer colours cannot mean showing
//     different ones. This one was a real defect in the first draft of the fix, caught by diffing the
//     two outputs rather than by reading the code.
// All four are asserted below. A test that only checked "four came back" would pass under three.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
    getColorPalette, spanLightness, LOW_COLOUR_CHROMA, LOW_COLOUR_COUNT, PALETTE_COUNTS
} = require('../utils/colorExtract');

let failed = 0;
let passed = 0;
const pending = [];
// Counted, never hardcoded -- a literal total in the summary is a copy of state that rots the moment
// a case is added.
function t(name, fn) {
    pending.push(async () => {
        try {
            await fn();
            passed++;
            console.log(`  PASS  ${name}`);
        } catch (err) {
            failed++;
            console.log(`  FAIL  ${name}\n        ${err.message}`);
        }
    });
}

// --- Synthetic images. getColorPalette duck-types an already-decoded image on `.bitmap.data`, so a
// plain object is enough and no file, network or ffmpeg is involved -- the test stays fast and has no
// dependency on any particular picture existing.
function image(pixels) {
    const data = Buffer.alloc(pixels.length * 4);
    pixels.forEach(([r, g, b], i) => { data.writeUInt8(r, i * 4); data.writeUInt8(g, i * 4 + 1); data.writeUInt8(b, i * 4 + 2); data.writeUInt8(255, i * 4 + 3); });
    return { bitmap: { width: pixels.length, height: 1, data } };
}
// A pure greyscale ramp: eight genuinely distinct lightnesses, zero chroma anywhere. This is exactly
// what the restrict exists for -- eight swatches here would be eight shades of nothing.
const GREY_STEPS = [0, 32, 64, 96, 140, 180, 214, 255];
const greyscale = () => image(Array.from({ length: 800 }, (_, i) => { const v = GREY_STEPS[i % GREY_STEPS.length]; return [v, v, v]; }));
// The same structure, tinted brown. ⚠️ THE TINT IS CALIBRATED, NOT EYEBALLED: its most chromatic
// pixels measure 0.037, which lands it inside the band the real corpus's misjudged images occupy
// (0.0213 to 0.0395) -- below CHROMA_FLOOR (0.04), so the old gate called it colourless, and well
// above LOW_COLOUR_CHROMA (0.01), so the new one does not. A stronger tint was tried first and was
// USELESS as a fixture: at +18/-14 it cleared 0.04 outright, so the case passed under the old gate
// too and proved nothing. Anything that changes these numbers should re-check that band.
const sepia = () => image(Array.from({ length: 800 }, (_, i) => { const v = GREY_STEPS[i % GREY_STEPS.length]; return [Math.min(255, v + 10), v, Math.max(0, v - 8)]; }));

console.log('\nlow-colour soft restrict — the gate, and which swatches survive it\n');

// --- Direction 1: the gate fires when it should, and only then.
t('a pure greyscale ramp is restricted', async () => {
    const p = await getColorPalette(greyscale(), 8);
    assert.strictEqual(p.length, LOW_COLOUR_COUNT, `expected ${LOW_COLOUR_COUNT} swatches, got ${p.length}`);
});

t('a MUTED but genuinely tinted image is NOT restricted', async () => {
    // The whole point of giving the gate its own floor. Every centroid here is under CHROMA_FLOOR, so
    // the old candidate-chroma test called this colourless and threw away most of the palette.
    const p = await getColorPalette(sepia(), 8);
    assert.ok(p.length > LOW_COLOUR_COUNT, `a tinted image was restricted to ${p.length} swatches`);
});

t('the gate floor is well below the accent pool floor', () => {
    // If someone "tidies" these back into one constant, the sepia case above regresses and the only
    // symptom is a shorter palette. Naming the relationship is what makes that a test failure.
    const { CHROMA_FLOOR } = { CHROMA_FLOOR: 0.04 };
    assert.ok(LOW_COLOUR_CHROMA < CHROMA_FLOOR / 2, `LOW_COLOUR_CHROMA ${LOW_COLOUR_CHROMA} is not meaningfully below the accent floor ${CHROMA_FLOOR}`);
});

// --- Direction 2: the decision does not depend on how many colours were asked for.
t('the restrict decision is identical at every requested count', async () => {
    // The boundary flip this replaced: the old gate read the EXTRACTED centroids, which change with
    // `count`, so one image could be colourful at 6 and colourless at 8. The new gate reads the pixel
    // tail, which does not.
    //
    // ⚠️ Read off the counts ABOVE LOW_COLOUR_COUNT only. At count === LOW_COLOUR_COUNT the restrict
    // is a no-op by construction (Math.min), so "did the length drop?" answers a different question
    // there and reports a flip that did not happen -- which is exactly what the first draft of this
    // assertion did.
    for (const [label, img] of [['greyscale', greyscale], ['sepia', sepia]]) {
        const lengths = [];
        for (const count of [6, 8]) lengths.push((await getColorPalette(img(), count)).length);
        const restricted = lengths.map(n => n === LOW_COLOUR_COUNT);
        assert.ok(restricted[0] === restricted[1], `${label}: restrict decision flipped between targets 6 and 8 (lengths ${lengths.join(',')})`);
    }
});

t('nameplate/decoration counts are never RAISED by the restrict', async () => {
    // Math.min in the restrict is what guarantees this; the sources that already ask for 4 must not
    // come back with more just because they happen to be colourful.
    const p = await getColorPalette(sepia(), PALETTE_COUNTS.nameplate);
    assert.ok(p.length <= PALETTE_COUNTS.nameplate, `asked for ${PALETTE_COUNTS.nameplate}, got ${p.length}`);
});

// --- Direction 3: a restricted palette is a SUBSET of the unrestricted one.
//
// The property has two halves and they are checked in the two different places they can break.
// `spanLightness` can only ever hand back things it was given, so the selection itself is safe by
// construction and asserted as such. What is NOT safe by construction is the SIZE OF THE POOL it is
// handed: clustering over-asks by 50%, so `ordered` normally runs longer than `count`, and passing it
// whole lets a colour the full palette would never show appear in the restricted one. That was a real
// defect in the first draft, and it is invisible from the outside -- the palette simply contains a
// plausible extra grey. Pinned by reading the call site, because there is no output to read it from.
t('spanLightness can only return entries it was given', () => {
    const entries = [0.1, 0.4, 0.9, 0.6].map((L, i) => ({ L, tag: i }));
    for (const e of spanLightness(entries, 3)) {
        assert.ok(entries.includes(e), 'spanLightness returned an object that was not in its input');
    }
});

t('the restrict selects from a pool bounded by `count`, never from the over-clustered surplus', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'utils', 'colorExtract.js'), 'utf8');
    assert.ok(
        src.includes('spanLightness(ordered.slice(0, count), limit)'),
        'the low-colour restrict no longer bounds spanLightness by `count` -- a restricted palette can now show a colour the full palette would not'
    );
});

// --- Direction 4: the selection rule itself.
t('spanLightness keeps index 0 and returns input order', () => {
    const entries = [0.5, 0.1, 0.9, 0.3, 0.7].map((L, i) => ({ L, tag: i }));
    const out = spanLightness(entries, 3);
    assert.strictEqual(out.length, 3);
    assert.strictEqual(out[0].tag, 0, 'index 0 is a contract and must survive');
    const tags = out.map(e => e.tag);
    assert.deepStrictEqual(tags, [...tags].sort((a, b) => a - b), 'output must stay in input (salience) order, not pick order');
});

t('spanLightness spans the axis instead of taking the head', () => {
    // A ramp whose first four entries are all bunched together: a plain slice returns four neighbours,
    // which is exactly the failure this replaces. The extremes must come back instead.
    const entries = [0.50, 0.52, 0.54, 0.56, 0.00, 1.00].map((L, i) => ({ L, tag: i }));
    const out = spanLightness(entries, 3).map(e => e.tag);
    assert.ok(out.includes(4) && out.includes(5), `expected both extremes, got tags ${out.join(',')}`);
});

t('spanLightness returns everything when asked for more than it has', () => {
    const entries = [0.2, 0.8].map(L => ({ L }));
    assert.strictEqual(spanLightness(entries, 5).length, 2);
    assert.strictEqual(spanLightness([], 4).length, 0);
});

t('spanLightness is deterministic, including on ties', () => {
    // Determinism is the Refresh Colors button's contract -- without it that button reports "found new
    // colors" on every click. Equidistant candidates must resolve the same way every time.
    const entries = [0.5, 0.0, 1.0, 0.25, 0.75].map((L, i) => ({ L, tag: i }));
    const first = JSON.stringify(spanLightness(entries, 3));
    for (let i = 0; i < 5; i++) assert.strictEqual(JSON.stringify(spanLightness(entries, 3)), first);
});

t('a restricted greyscale palette actually spans lightness', async () => {
    // The end-to-end version of the two cases above: the shipped path, on the image the restrict is
    // for, must not come back as four neighbouring greys.
    const p = await getColorPalette(greyscale(), 8);
    const lum = p.map(e => (((e.hex >> 16) & 0xff) + ((e.hex >> 8) & 0xff) + (e.hex & 0xff)) / 3);
    assert.ok(Math.max(...lum) - Math.min(...lum) > 128, `restricted greyscale spans only ${(Math.max(...lum) - Math.min(...lum)).toFixed(0)}/255 of the lightness range`);
});

(async () => {
    for (const run of pending) await run();
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    process.exit(failed ? 1 : 0);
})();
