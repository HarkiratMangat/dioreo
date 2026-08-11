// scripts/animatedMediaPipeline.test.js
// Pins two invariants in utils/animatedMediaPipeline.js that were, until 2026-08-11 17:34 EDT, only
// WRITTEN DOWN. Run: `node scripts/animatedMediaPipeline.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS, and it is the more useful half of the story. Both invariants were first handled
// by describing them in a comment and a rules file, on the reasoning that "no automated check in this
// repo can see them". That reasoning was wrong in the way that matters: they could not be OBSERVED by
// an existing check, but each could be MADE checkable by changing the code so the invariant is
// enforced rather than assumed. Documenting a gap is not closing it — the note goes stale, the reader
// skims it, and the failure it warned about ships anyway. See `feedback_not_checkable_is_usually_unexamined`.
const assert = require('assert');
const { Jimp } = require('jimp');
const { poolFramesIntoMontage, FRAME_FILE_RE } = require('../utils/animatedMediaPipeline');

let failed = 0, passed = 0;
async function t(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  PASS  ${name}`);
    } catch (err) {
        failed++;
        console.log(`  FAIL  ${name}\n        ${err.message}`);
    }
}

const png = (w, h) => new Jimp({ width: w, height: h, color: 0xff0000ff }).getBuffer('image/png');

(async () => {
    console.log('\nanimated media pipeline — invariants that used to be comments\n');

    // --- The frames directory is shared with the encoder's output now, so "which files are frames"
    // has to be exact rather than a prefix that happens not to collide.
    await t('the frame pattern matches ffmpeg\'s numbered output', () => {
        for (const n of ['frame_0001.png', 'frame_0.png', 'frame_123456.png']) {
            assert.ok(FRAME_FILE_RE.test(n), `${n} should be a frame`);
        }
    });

    await t('the frame pattern rejects the encoder\'s own output, including a hostile rename', () => {
        // out.webp is the live case. The rest are the ones a prefix test would have wrongly accepted,
        // which is exactly how this stops being a latent trap.
        for (const n of ['out.webp', 'frame_out.webp', 'frame_.png', 'frame_x.png', 'frame_1.png.bak', 'input.webm']) {
            assert.ok(!FRAME_FILE_RE.test(n), `${n} should NOT be read as a frame`);
        }
    });

    // --- The montage must never silently switch colour arithmetic. It used to fall back to Jimp's
    // composite(), which re-introduces the ±1 rounding the row-copy exists to remove -- and a cache key
    // derived from source text cannot tell two runtime branches apart, so both would be stamped alike.
    await t('a non-uniform frame set THROWS rather than silently compositing', async () => {
        const frames = [await png(64, 64), await png(48, 64)];
        await assert.rejects(() => poolFramesIntoMontage(frames), /not uniform/i);
    });

    await t('a uniform frame set still pools normally', async () => {
        const frames = [await png(64, 64), await png(64, 64), await png(64, 64)];
        const sheet = await poolFramesIntoMontage(frames);
        // Returns a decoded Jimp image, not a PNG buffer -- itself a contract getColorPalette relies on.
        assert.ok(sheet?.bitmap?.data, 'should return a decoded image');
        assert.ok(sheet.bitmap.width >= 64 && sheet.bitmap.height >= 64);
    });

    await t('a single frame is still rejected as "not an animation"', async () => {
        const one = [await png(64, 64)];
        await assert.rejects(() => poolFramesIntoMontage(one), /expected an animation/i);
    });

    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    process.exit(failed ? 1 : 0);
})();
