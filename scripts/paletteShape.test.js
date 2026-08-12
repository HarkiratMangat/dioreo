// scripts/paletteShape.test.js
// Regression tests for PALETTE SHAPE in utils/colorExtract.js -- how many swatches come back, and
// which ones. Two mechanisms decide that and they are tested together because they are one concern:
//   · the LOW-COLOUR SOFT RESTRICT -- the gate that drops a near-colourless image to 4, and the rule
//     that decides which 4 survive;
//   · the PAGE LADDER -- which moves an off-rung count to 1/2/4/6/8 so a second page is never a stub,
//     by looking harder first and manufacturing at most one swatch.
// Added 2026-08-12 14:59 EDT (restrict), extended 2026-08-12 18:43 EDT (ladder).
// Run: `node scripts/paletteShape.test.js` (also via `npm test`).
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
    getColorPalette, spanLightness, LOW_COLOUR_CHROMA, LOW_COLOUR_COUNT, PALETTE_COUNTS,
    fillLightnessGap, applyLadder, PALETTE_RUNGS
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

// ============================================================================================
// THE PAGE LADDER — a palette may only be 1, 2, 4, 6 or 8 long, so a second page is never a stub.
//
// ⚠️ Same silent-failure argument as above, with one addition specific to this half: a palette that
// has been laddered looks EXACTLY like one that came out that length naturally. A broken rung map, a
// derived swatch that duplicates a real one, or a ladder that wrongly fires on a nameplate all produce
// output that is completely unremarkable to look at.
const RUNGS = [...PALETTE_RUNGS];
const entriesAt = (...Ls) => Ls.map((L, i) => ({ L, a: 0.05, b: 0.02, share: 0.1, origin: 'structure', tag: i }));

t('every rung length is left alone', () => {
    for (const n of RUNGS) {
        const e = entriesAt(...Array.from({ length: n }, (_, i) => i / n));
        assert.strictEqual(applyLadder(e).length, n, `a ${n}-entry palette was changed`);
    }
});

t('off-rung lengths move to the agreed rung', () => {
    // 3 -> 4, 5 -> 4, 7 -> 8. Hardcoded on purpose: this is the agreed mapping, and a test that
    // recomputed it from LADDER would pass no matter what LADDER said.
    for (const [from, to] of [[3, 4], [5, 4], [7, 8]]) {
        const e = entriesAt(...Array.from({ length: from }, (_, i) => 0.1 + i * 0.11));
        assert.strictEqual(applyLadder(e).length, to, `${from} entries did not become ${to}`);
    }
});

t('going DOWN keeps salience order and drops the tail', () => {
    // ⚠️ REGRESSION TEST. The first version used spanLightness here and it silently discarded small
    // vivid accents: measured 2026-08-12 18:40 EDT, a 2% pure red on a beige/brown ground was dropped
    // outright for sitting near the browns in LIGHTNESS -- the exact colour the accent pool exists to
    // surface. Lightness coverage is right for a colourless image and wrong for a colourful one, and
    // a colourless image never reaches the ladder (the restrict has already put it on a rung).
    const e = entriesAt(0.50, 0.52, 0.54, 0.00, 1.00);
    const out = applyLadder(e).map(x => x.tag);
    assert.deepStrictEqual(out, [0, 1, 2, 3], 'the down-step must keep the first `target` entries in salience order');
});

t('a small vivid accent survives the ladder down-step', async () => {
    // The end-to-end form of the case above, on real pixels rather than synthetic entries.
    const px = [];
    [[[219, 201, 202], 500], [[193, 181, 174], 220], [[143, 124, 116], 160], [[87, 70, 61], 100], [[220, 20, 30], 20]]
        .forEach(([c, n]) => { for (let k = 0; k < n; k++) px.push(c); });
    const p = await getColorPalette(image(px), 8);
    const red = p.find(e => ((e.hex >> 16) & 0xff) > 150 && (e.hex & 0xff) < 100 && ((e.hex >> 8) & 0xff) < 100);
    assert.ok(red, `the 2% vivid accent did not survive: ${p.map(e => '#' + e.hex.toString(16).padStart(6, '0')).join(' ')}`);
});

t('going UP appends exactly one derived entry, never at index 0', () => {
    const e = entriesAt(0.10, 0.20, 0.30);
    const out = applyLadder(e);
    assert.strictEqual(out.length, 4);
    assert.strictEqual(out[0].tag, 0, 'index 0 is a contract and must not be displaced');
    const made = out[out.length - 1];
    assert.strictEqual(made.origin, 'derived');
    assert.strictEqual(made.share, 0, 'a manufactured colour covers none of the image');
});

t('the derived entry lands in the widest lightness gap', () => {
    // Everything is bunched dark, so the gap to white is by far the widest and is where it must go.
    const e = entriesAt(0.05, 0.10, 0.15);
    const made = fillLightnessGap(e);
    assert.ok(made.L > 0.5, `expected the derived entry up in the empty range, got L ${made.L}`);
});

t('the derived entry is never a near-duplicate of a real one', () => {
    // A palette already spanning the axis evenly has no gap wide enough to hold a distinguishable
    // colour. Returning null -- three honest swatches -- beats returning a fourth that is a twin.
    const dense = Array.from({ length: 30 }, (_, i) => ({ L: i / 29, a: 0, b: 0, share: 0.03, origin: 'structure' }));
    assert.strictEqual(fillLightnessGap(dense), null, 'a near-duplicate was manufactured');
    // And the ladder must degrade to "leave it short" rather than crash or pad with a twin.
    assert.strictEqual(applyLadder(dense.slice(0, 3)).length >= 3, true);
});

t('fillLightnessGap borrows hue and chroma, inventing only lightness', () => {
    const e = entriesAt(0.05, 0.10, 0.15);
    const made = fillLightnessGap(e);
    assert.strictEqual(made.a, 0.05);
    assert.strictEqual(made.b, 0.02);
});

t('the ladder is deterministic', () => {
    // Refresh Colors compares before and after; a ladder that picked differently between runs would
    // report "found new colors" on every click.
    const e = entriesAt(0.1, 0.4, 0.9, 0.5, 0.2);
    const first = JSON.stringify(applyLadder(e));
    for (let i = 0; i < 5; i++) assert.strictEqual(JSON.stringify(applyLadder(e)), first);
});

t('nameplate and decoration are a CEILING, never laddered', async () => {
    // Harkirat 2026-08-12 17:38 EDT: those palettes are a deterministic composition (1 bed + 3 art)
    // and padding one would invent a colour for a design that simply has fewer. The gate is
    // count === KMEANS_COUNT, so a 4-asking caller must come back untouched.
    const p = await getColorPalette(sepia(), PALETTE_COUNTS.nameplate);
    assert.ok(p.length <= PALETTE_COUNTS.nameplate);
    assert.ok(!p.some(e => e.origin === 'derived'), 'a nameplate palette was padded with a derived swatch');
});

t('an avatar palette always lands on a rung', async () => {
    for (const img of [greyscale, sepia]) {
        const p = await getColorPalette(img(), 8);
        assert.ok(PALETTE_RUNGS.has(p.length), `got ${p.length} swatches, which is not a rung`);
    }
});

(async () => {
    for (const run of pending) await run();
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    process.exit(failed ? 1 : 0);
})();
