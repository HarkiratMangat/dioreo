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
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

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

module.exports = { extractAlphaFrames, encodeWebpFromFrames };
