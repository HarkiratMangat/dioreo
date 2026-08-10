// utils/animatedGifPipeline.js -- shared ffmpeg-based plumbing behind the nameplate/decoration
// animated GIF cache (utils/nameplateGifCache.js, utils/decorationGifCache.js), added 2026-08-10 08:48 EDT for
// the feature designed in docs/superpowers/specs/2026-08-09-nameplate-decoration-animated-gif-
// caching-design.md. Two independent capabilities, both wrapping the same system ffmpeg dependency
// utils/stillFrame.js already relies on (confirmed present on the VM):
//   1. extractAlphaFrames -- pulls every frame of an animated source out as real RGBA PNG buffers.
//   2. encodeGifFromFrames -- re-assembles a frame sequence into one animated GIF via ffmpeg's own
//      two-pass palette workflow (palettegen + paletteuse), so no extra system binary (e.g. gifski)
//      needs to exist on the VM beyond what's already there.
// Both use real temp files (ffmpeg's frame-sequence I/O needs a %03d-pattern directory, not stdin/
// stdout streaming), cleaned up in a `finally` the same way stillFrame.js's two functions already do.
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', args);
        let stderr = '';
        proc.stderr.on('data', d => { stderr += d; });
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`)));
        proc.on('error', reject);
    });
}

// sourceBuffer: already-downloaded bytes (the caller fetches -- this module has no network concerns
// of its own, same separation stillFrame.js keeps). `inputExt` picks the temp file's extension (does
// NOT gate what ffmpeg decodes it as -- `preInputArgs` does that).
// `preInputArgs`: anything that must appear BEFORE `-i` -- a demuxer override (`-f apng`, needed for
// decoration: without it ffmpeg silently reads an animated PNG as ONE still frame, see
// utils/stillFrame.js's extractFrameMontage comment for the measured 60-frames-vs-0 proof) and/or a
// decoder override (`-c:v libvpx-vp9`, needed for nameplate: ffmpeg's DEFAULT vp9 decoder silently
// drops the WebM alpha side-data block and hands back an opaque yuv420p frame -- confirmed live
// 2026-08-10 08:48 EDT against a real equipped nameplate, matching the design spec's Finding 1 exactly).
// `fps`: passed to a `fps=` filter, so it both caps AND (for a slower source) upsamples to a fixed
// output rate -- callers don't need to know the source's native frame rate.
async function extractAlphaFrames(sourceBuffer, { inputExt, preInputArgs = [], fps }) {
    const id = crypto.randomUUID();
    const dir = path.join(os.tmpdir(), `dior_gifframes_${id}`);
    await fs.mkdir(dir, { recursive: true });
    const inputPath = path.join(dir, `input${inputExt}`);
    const outputPattern = path.join(dir, 'frame_%04d.png');
    await fs.writeFile(inputPath, sourceBuffer);

    try {
        await runFfmpeg([
            '-y', ...preInputArgs, '-i', inputPath,
            '-vf', `fps=${fps}`, '-pix_fmt', 'rgba', outputPattern
        ]);
        const names = (await fs.readdir(dir)).filter(n => n.startsWith('frame_')).sort();
        if (names.length === 0) throw new Error('ffmpeg produced zero frames');
        return await Promise.all(names.map(n => fs.readFile(path.join(dir, n))));
    } finally {
        await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    }
}

// frameBuffers: already-composited/dithered RGBA PNGs, in playback order -- this function does ZERO
// pixel work of its own, purely the ffmpeg palette-quantize-and-mux step. `alphaThreshold` (1-255)
// decides the opaque/transparent cutoff GIF's binary alpha ultimately uses; a caller that's already
// pre-dithered its alpha channel to exactly 0/255 (utils/decorationGifCache.js) wants this at 1 so
// paletteuse's own threshold never second-guesses the dither pattern -- see ditherAlphaBayer below.
async function encodeGifFromFrames(frameBuffers, { fps, alphaThreshold = 128 }) {
    const id = crypto.randomUUID();
    const dir = path.join(os.tmpdir(), `dior_gifencode_${id}`);
    await fs.mkdir(dir, { recursive: true });
    const framePattern = path.join(dir, 'frame_%04d.png');
    const palettePath = path.join(dir, 'palette.png');
    const outPath = path.join(dir, 'out.gif');

    try {
        await Promise.all(frameBuffers.map((buf, i) =>
            fs.writeFile(path.join(dir, `frame_${String(i + 1).padStart(4, '0')}.png`), buf)
        ));
        // reserve_transparent=1 costs one of GIF's 256 palette slots but is required whenever any
        // frame actually uses transparency -- harmless to always pass (nameplate's solid-bed frames
        // are opaque except a few antialiased corner pixels, decoration's are meaningfully transparent).
        await runFfmpeg([
            '-y', '-framerate', String(fps), '-i', framePattern,
            '-vf', 'palettegen=reserve_transparent=1', '-update', '1', palettePath
        ]);
        await runFfmpeg([
            '-y', '-framerate', String(fps), '-i', framePattern, '-i', palettePath,
            '-lavfi', `paletteuse=alpha_threshold=${alphaThreshold}`, '-loop', '0', outPath
        ]);
        return await fs.readFile(outPath);
    } finally {
        await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    }
}

// 4x4 Bayer ordered-dither threshold matrix, normalized so each cell sits at the center of its 1/16
// band (avoids ties landing all-on-one-side at exact multiples of 1/16). Deliberately ORDERED, not
// error-diffusion (Floyd-Steinberg): verified live 2026-08-10 08:48 EDT against a synthetic radial-glow test
// image that FS-style diffusion is the wrong tool for a multi-FRAME source specifically -- it
// propagates error row-by-row from whatever's in THAT frame, so the same underlying alpha value can
// dither to a different pixel pattern on two consecutive frames as the source content shifts
// slightly, reading as crawling noise once animated. A fixed per-pixel threshold keyed only on
// (x mod 4, y mod 4) reproduces the SAME dot pattern every frame -- only which dots cross the
// threshold changes as alpha itself changes, which is stable, not noisy. Same principle old
// hardware "screen-door transparency" dithering used, for the same reason (rendering many frames of
// the same static threshold pattern, not one still image).
const BAYER_4X4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
].map(row => row.map(v => (v + 0.5) / 16));

// Mutates `jimpImage`'s alpha channel in place, collapsing every pixel to fully opaque or fully
// transparent via the Bayer threshold at that pixel's position -- the pre-pass that makes GIF's
// binary alpha limitation degrade to a visible stipple/halftone instead of erasing a soft gradient
// entirely (this is the fix for Finding 2 in the design spec: a naive uniform 50% threshold collapses
// a real decoration's soft glow core to nothing but opaque streaks). Verified end-to-end 2026-08-10 08:48 EDT:
// round-tripped a dithered synthetic glow through this exact ffmpeg encode/decode pipeline and
// confirmed the halftone pattern survives GIF's real palette quantization, not just as a PNG mockup.
// Returns the same image for chaining; still explicitly LOSSY (GIF has no partial-alpha format-level
// escape at all) -- this narrows the gap, it does not close it.
function ditherAlphaBayer(jimpImage) {
    const { width, height, data } = jimpImage.bitmap;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const a = data[idx + 3] / 255;
            const t = BAYER_4X4[y % 4][x % 4];
            data[idx + 3] = a >= t ? 255 : 0;
        }
    }
    return jimpImage;
}

module.exports = { extractAlphaFrames, encodeGifFromFrames, ditherAlphaBayer };
