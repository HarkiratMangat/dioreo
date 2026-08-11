// utils/animatedMediaPipeline.js -- shared ffmpeg/img2webp-based plumbing behind the nameplate/
// decoration animated WebP cache (utils/nameplateWebpCache.js, utils/decorationWebpCache.js).
// Originally built 2026-08-10 08:48 EDT as a GIF pipeline (see git history / docs/superpowers/specs/
// 2026-08-09-nameplate-decoration-animated-gif-caching-design.md for that design), then pivoted the
// same day (2026-08-10 11:01 EDT) once a live Discord test (desktop + mobile) confirmed the client renders animated WebP
// inline exactly like GIF -- WebP has real 8-bit alpha (no binary on/off threshold, no dithering, no
// solid-bed compromise needed), so it strictly dominates GIF for this use case. Two capabilities:
//   1. extractAlphaFrames -- pulls every frame of an animated source out as real RGBA PNG buffers.
//   2. encodeWebpFromFrames -- assembles a frame sequence into one lossless animated WebP via
//      img2webp (libwebp's own CLI -- NOT part of ffmpeg; confirmed neither the local dev machine's
//      nor, per the VM/systemd deploy notes, necessarily the VM's ffmpeg build has libwebp encoding
//      compiled in, whereas img2webp is a small standalone binary, brew-installed locally as `webp`).
//      Lossless was measured, not assumed, to win here: a same-source ezgif.com lossy conversion (2.6MB)
//      came out over 2.5x LARGER than this pipeline's lossless output (898KB) on Harkirat's own equipped
//      decoration -- confirmed via webpmux -info that both encoded the identical 60 frames/dimensions/
//      crop-boxes, so the only real difference was lossy's per-frame VP8+alpha overhead losing to
//      lossless's whole-image compression on this kind of flat-region/soft-gradient graphic content
//      (the opposite of the usual lossy-wins-on-photos case). -exact preserves RGB under fully
//      transparent pixels too (avoids fringing if a viewer ever samples "invisible" pixels).
// Uses real temp files (ffmpeg's frame-sequence I/O needs a %03d-pattern directory, and img2webp reads
// real files, not stdin), cleaned up in a `finally` the same way stillFrame.js's two functions already do.
//
// ⚠️ "WHY NOT ONE TOOL THAT GOES APNG -> ANIMATED WEBP DIRECTLY?" -- asked and MEASURED 2026-08-11
// 02:25 EDT, answer is no, don't re-investigate:
//   · ffmpeg has NO webp encoder here (`ffmpeg -encoders | rg webp` is empty) and this is NOT a quirk
//     of one machine -- Homebrew's CORE ffmpeg formula does not depend on webp at all. Getting it
//     means the homebrew-ffmpeg tap built from source with `--with-webp`.
//   · ImageMagick's APNG support is a DELEGATE to that same ffmpeg, so `magick apng:in.png out.webp`
//     dies with "Unknown encoder 'webp'". It is not an independent path.
//   · libwebp's own CLI set ships no APNG reader at all: img2webp assembles PNGs, gif2webp is GIF-only,
//     cwebp is single-image, webpmux only muxes.
//   · npm's `apng2webp` (the obvious next thing to try, and the only package of that name anywhere --
//     not in Homebrew, not on PyPI) is BROWSER-ONLY and cannot run server-side. Its own README says
//     "This package relies on browser canvas WebP encoder"; it calls document.createElement('canvas'),
//     Blob and URL.createObjectURL, exposes `bin: null` so there is no CLI, and was last published in
//     2022. Installed briefly to verify all of the above, then removed; it was never a project
//     dependency and must not become one -- it can never execute in this runtime.
// So the two-step is not clumsiness, it is the only path these tools allow -- and switching to
// ffmpeg-with-libwebp would make the dependency WORSE, not better: img2webp is a small standalone
// binary you install explicitly (`apt install webp`), whereas requiring libwebp *inside* ffmpeg means
// depending on how whoever packaged that distro's ffmpeg configured it. This machine is the proof
// that assumption breaks. It also cannot help nameplate under any circumstances, because the gradient
// bed has to be composited BETWEEN decode and encode and a single-step converter offers no such hook.
//
// ⚠️ AND THE OBVIOUS SHORTCUT SILENTLY LIES. `magick in.png out.webp` on a 60-frame APNG "succeeds" in
// 44ms producing a 22KB file -- 12x faster and 50x smaller than this pipeline, and completely wrong:
// it read ONE frame. `magick identify -format '%n'` reports `1`, and `webpmux -info` shows
// "Features present: transparency" with no `animation`. This is the SAME silent-single-frame trap as
// ffmpeg without `-f apng` (see extractAlphaFrames' preInputArgs note below), and it is why every
// change here must assert the FRAME COUNT rather than that a file was produced.
const { spawn } = require('child_process');
const { Jimp } = require('jimp');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const { fingerprint } = require('./algoFingerprint');

function runCommand(cmd, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args);
        let stderr = '';
        proc.stderr.on('data', d => { stderr += d; });
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-500)}`)));
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
// against a real equipped nameplate).
// `fps`: passed to a `fps=` filter, so it both caps AND (for a slower source) upsamples to a fixed
// output rate -- callers don't need to know the source's native frame rate.
async function extractAlphaFrames(sourceBuffer, { inputExt, preInputArgs = [], fps }) {
    const id = crypto.randomUUID();
    const dir = path.join(os.tmpdir(), `dior_mediaframes_${id}`);
    await fs.mkdir(dir, { recursive: true });
    const inputPath = path.join(dir, `input${inputExt}`);
    const outputPattern = path.join(dir, 'frame_%04d.png');
    await fs.writeFile(inputPath, sourceBuffer);

    try {
        await runCommand('ffmpeg', [
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

// frameBuffers: already-composited RGBA PNGs, in playback order -- this function does ZERO pixel work
// of its own, purely the img2webp assembly step. `fps` sets each frame's duration uniformly
// (1000/fps ms) -- every caller here uses a fixed source rate, so no per-frame timing list is needed.
// Always lossless (see module header for why that's not just "the safe choice" but the measured-smaller
// one for this content) -- no lossy code path exists here because nothing in this bot has needed it yet.
//
// `-m 0` (compression method 0 of 0-6, the FASTEST, not the default 4) -- measured live
// 2026-08-10 12:31 EDT at real nameplate scale (43 frames, 512px, full gradient bed composited):
// -m 4 took 2252ms for 1,358,310 bytes; -m 0 took 158ms (14x faster) for 1,552,058 bytes (+14%). The
// `-m` value is PURELY an encoder-effort knob -- every setting here is still `-lossless`, so this is
// zero quality difference, only a byte-efficiency tradeoff. -m 6 was tested and is WORSE on both axes
// (6616ms AND bigger than -m 4) -- higher method numbers trade time for ratio on typical content, but
// this gradient-bed content doesn't reward the extra effort at all. The 14% size cost is real but
// one-time: since utils/discordCdnStorage.js's storage-channel upload means these bytes transfer
// exactly ONCE per (design, palette)/decoration-asset combo ever (not on every view -- see
// utils/nameplateWebpCache.js's/utils/decorationWebpCache.js's own headers), a bigger file no longer
// costs anything on repeat views the way it would have before that optimization existed. This single
// change cuts the dominant cost in the cold-render pipeline (encoding was ~59% of total render time
// before this) by roughly 90%.
async function encodeWebpFromFrames(frameBuffers, { fps }) {
    const id = crypto.randomUUID();
    const dir = path.join(os.tmpdir(), `dior_webpencode_${id}`);
    await fs.mkdir(dir, { recursive: true });
    const outPath = path.join(dir, 'out.webp');
    const frameDelayMs = Math.round(1000 / fps);

    try {
        const framePaths = await Promise.all(frameBuffers.map(async (buf, i) => {
            const p = path.join(dir, `frame_${String(i).padStart(4, '0')}.png`);
            await fs.writeFile(p, buf);
            return p;
        }));

        const args = ['-loop', '0'];
        for (const p of framePaths) {
            args.push('-d', String(frameDelayMs), '-lossless', '-m', '0', '-exact', p);
        }
        args.push('-o', outPath);
        await runCommand('img2webp', args);

        return await fs.readFile(outPath);
    } finally {
        await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    }
}

// Pools evenly-spaced frames into ONE tiled still, so colour extraction sees the whole animation's
// range instead of whichever moment frame 0 happened to catch. Moved here from
// utils/nameplateBedImage.js 2026-08-11 10:06 EDT when the decoration cache needed it too -- it is
// generic frame plumbing, and leaving it in a nameplate-specific module would have made decoration
// import "nameplateBedImage" to process a decoration.
//
// Why a montage at all: measured on a real 60-frame decoration, the single frame the old code took
// yielded four greys (max saturation 0.26) and missed the animation's gold sparkle entirely; pooling
// recovers it as #AD904C. Harkirat spotted the missing colour in the live panel before it was measured.
//
// ⚠️ ASSERTS THE FRAME COUNT rather than trusting that bytes came back -- see the silent-single-frame
// trap documented at the top of this file. A one-frame result would look like a working extraction
// while quietly reproducing the exact bug this exists to replace.
//
// Tiles are capped at 256px wide because a grid multiplies the source resolution by its tile count,
// and k-means samples ~2500 pixels regardless of resolution -- the same scale discipline
// utils/stillFrame.js's montage needs, and for the same reason (a 3x3 grid of an un-capped source is
// how a synchronous Jimp decode grows big enough to blow an unrelated interaction's 3s ACK window).
const POOL_FRAMES = 9;
const POOL_TILE_WIDTH = 256;

async function poolFramesIntoMontage(raw, { frames = POOL_FRAMES, targetWidth = POOL_TILE_WIDTH } = {}) {
    if (raw.length < 2) throw new Error(`animated source yielded ${raw.length} frame(s) -- expected an animation`);

    const take = Math.min(frames, raw.length);
    const picked = Array.from({ length: take }, (_, i) => raw[Math.round(i * (raw.length - 1) / (take - 1))]);

    const tiles = [];
    for (const frame of picked) {
        const img = await Jimp.read(frame);
        if (img.bitmap.width > targetWidth) img.resize({ w: targetWidth });
        tiles.push(img);
        // Same yield discipline as the WebP cache's per-frame loop -- synchronous Jimp work is exactly
        // what blocked unrelated interactions' 3s ACK window before the CPU fix.
        await new Promise(setImmediate);
    }

    const cols = Math.ceil(Math.sqrt(tiles.length));
    const rows = Math.ceil(tiles.length / cols);
    // Transparent background, so fully-transparent pixels stay alpha 0 and getColorPalette skips them
    // rather than counting a fabricated backdrop as one of the extracted colours.
    const sheet = new Jimp({
        width: tiles[0].bitmap.width * cols,
        height: tiles[0].bitmap.height * rows,
        color: 0x00000000
    });
    // ⚠️ DIRECT ROW COPY, NOT `sheet.composite()` (2026-08-11 15:17 EDT) -- and this is the ACCURATE
    // option as well as the fast one, which is the opposite of how a hand-rolled blit usually reads.
    // Compositing "source OVER a fully transparent destination" is mathematically the source itself,
    // so nothing here needs blending at all; Jimp's blend runs the full over-operator anyway and its
    // integer rounding hands back source ±1 on every partially-transparent pixel. Measured on the real
    // twilight nameplate, 13,134 sheet bytes came back altered by that rounding alone, and on a real
    // 60-frame decoration the error was large enough to move an extracted swatch (#117AF1 -> #127BF2 --
    // the copy's value is the correct one). Tiles are laid out on an exact grid with no overlap, so a
    // per-row `Buffer.copy` reproduces the intended result exactly: measured 83-98ms -> 0.5ms.
    //
    // Falls back to composite() if a tile is ever a different size than the first -- the grid's
    // geometry is derived from tiles[0], so mismatched tiles would write rows at the wrong offsets.
    // Every frame of a single animation has identical dimensions, so this is a guard, not a live path.
    const tw = tiles[0].bitmap.width, th = tiles[0].bitmap.height;
    const uniform = tiles.every(t => t.bitmap.width === tw && t.bitmap.height === th);
    for (let i = 0; i < tiles.length; i++) {
        const ox = (i % cols) * tw, oy = Math.floor(i / cols) * th;
        if (!uniform) { sheet.composite(tiles[i], ox, oy); continue; }
        const src = tiles[i].bitmap;
        for (let y = 0; y < th; y++) {
            src.data.copy(sheet.bitmap.data, ((oy + y) * sheet.bitmap.width + ox) * 4, y * tw * 4, (y + 1) * tw * 4);
        }
    }
    // ⚠️ RETURNS A DECODED JIMP IMAGE, NOT A PNG BUFFER (2026-08-11 14:55 EDT). Every consumer feeds
    // this montage straight to colorExtract.js's getColorPalette, which used to `Jimp.read` it back --
    // so the sheet was being PNG-encoded here purely to be decoded again one function call later.
    // Measured 2026-08-11 14:57 EDT on three real assets, that round trip cost 28ms (43-frame
    // nameplate), 56ms and 101ms (60-frame decorations) for ZERO pixel change -- palettes verified
    // byte-identical before and after by local/colors-investigation/pipeline-parity.js. If a caller
    // ever genuinely needs bytes it can call `.getBuffer('image/png')` itself -- but prefer passing
    // the image, since encoding a montage nobody stores is pure waste.
    return sheet;
}

// Reads a PNG's dimensions from its IHDR header instead of decoding the whole image. ffmpeg's
// extracted frames are plain PNGs whose first chunk is always IHDR (width/height are big-endian at
// byte 16 and 20, right after the 8-byte signature, the 4-byte length and the "IHDR" tag), so the
// callers that need only "how big is this frame" -- utils/decorationWebpCache.js decides whether a
// resize is needed at all -- can skip a full Jimp decode of a 288x288 frame for four bytes of header.
// Falls back to a real decode on anything that isn't a PNG, so this can never be the reason a render
// fails; the fast path is an optimisation, not a new format assumption.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
async function readImageSize(buffer) {
    if (Buffer.isBuffer(buffer) && buffer.length >= 24
        && buffer.subarray(0, 8).equals(PNG_SIGNATURE)
        && buffer.subarray(12, 16).toString('latin1') === 'IHDR') {
        return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    const { width, height } = (await Jimp.read(buffer)).bitmap;
    return { width, height };
}

// This module's contribution to the palette cache key -- see utils/algoFingerprint.js. The montage is
// upstream of every stored nameplate/decoration palette (both go through poolFramesIntoMontage), so a
// change to which frames are picked, how they are scaled, or how they are laid onto the sheet changes
// the extracted colours just as surely as a change to the clustering does. Hashing the extractor alone
// would have missed the tile-copy fix in this very file, which altered a swatch while touching nothing
// in colorExtract.js.
const MONTAGE_FINGERPRINT = fingerprint(poolFramesIntoMontage, { POOL_FRAMES, POOL_TILE_WIDTH });

module.exports = {
    extractAlphaFrames, encodeWebpFromFrames, poolFramesIntoMontage, readImageSize, MONTAGE_FINGERPRINT
};
