// utils/stillFrame.js
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

// Some Discord image sources are animated -- avatar decorations are commonly served as animated PNG
// (APNG), which Jimp (this bot's whole color-extraction engine, utils/colorExtract.js) cannot decode
// at all (confirmed live against a real equipped decoration: "Mime type image/apng does not support
// decoding"). This downloads the source and extracts exactly ONE still frame via ffmpeg (already a
// system dependency on this bot's host, confirmed present), returning it as a plain PNG Buffer that
// Jimp reads exactly like any other still image (Jimp.read() accepts a Buffer directly, same as a
// URL). Deliberately general-purpose, not decoration-specific -- reuse this for any other animated
// source this bot ever needs a representative color from, rather than duplicating the ffmpeg
// plumbing at each call site.
async function extractStillFrame(sourceUrl) {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`Failed to download ${sourceUrl}: HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const id = crypto.randomUUID();
    const inputPath = path.join(os.tmpdir(), `dior_still_in_${id}.png`);
    const outputPath = path.join(os.tmpdir(), `dior_still_out_${id}.png`);
    await fs.writeFile(inputPath, buffer);

    try {
        await new Promise((resolve, reject) => {
            // -update 1 (rather than the default image2-sequence-pattern behavior) is what makes
            // ffmpeg write a single plain PNG file instead of warning about a missing %d sequence
            // pattern -- confirmed needed live, ffmpeg still produced a valid single frame without it
            // but printed a pattern-mismatch warning on every call.
            const proc = spawn('ffmpeg', ['-y', '-i', inputPath, '-vframes', '1', '-update', '1', outputPath]);
            let stderr = '';
            proc.stderr.on('data', d => { stderr += d; });
            proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-300)}`)));
            proc.on('error', reject);
        });
        return await fs.readFile(outputPath);
    } finally {
        // Best-effort cleanup -- a failed unlink (e.g. process already gone) shouldn't mask the
        // real result/error from the try block above.
        await fs.unlink(inputPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});
    }
}

// ONE frame is not a fair sample of an animation (2026-08-09 18:15 EDT). Measured against a real
// equipped decoration with 60 frames: frame 1 -- the one extractStillFrame takes -- peaked at
// #0e1217 with a vividness of 0.035, while frame 11 peaked at #ff9708 (a gold sparkle) at 0.969.
// 33 of the 60 frames peak in the orange/gold band and 27 in blue-grey, so which frame you land on
// decides the entire result. Harkirat spotted the missing sparkle in the live panel before any of
// this was measured.
//
// This tiles EVENLY-SPACED frames into one montage image, so the existing k-means sees the whole
// animation's colour range as a single still. Deterministic by construction -- the frame count and
// spacing are fixed, never sampled at random -- which the "Refresh Colors" change-detection depends
// on (see .claude/rules/accent-and-colors.md).
//
// ⚠️ APNG needs `-f apng` NAMED EXPLICITLY as the demuxer. Without it ffmpeg reads a Discord
// decoration as a single still and writes exactly one output file, silently -- it does not error,
// so a multi-frame extraction quietly degrades to the single-frame behaviour this exists to replace.
// Verified: `-f apng` produced 60 frames where the bare form produced 0 usable ones.
const MONTAGE_FRAMES = 9; // 3x3 grid -- enough to cover a full animation cycle without a big decode

async function extractFrameMontage(sourceUrl, frames = MONTAGE_FRAMES) {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`Failed to download ${sourceUrl}: HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const id = crypto.randomUUID();
    const inputPath = path.join(os.tmpdir(), `dior_montage_in_${id}.png`);
    const outputPath = path.join(os.tmpdir(), `dior_montage_out_${id}.png`);
    await fs.writeFile(inputPath, buffer);

    try {
        await new Promise((resolve, reject) => {
            const cols = Math.ceil(Math.sqrt(frames));
            const rows = Math.ceil(frames / cols);
            const proc = spawn('ffmpeg', [
                '-y', '-f', 'apng', '-i', inputPath,
                // select every Nth frame so the sample spans the whole cycle rather than clustering
                // at the start, then tile what survives. `tile` pads a short grid automatically.
                '-vf', `select='not(mod(n\\,3))',tile=${cols}x${rows}`,
                '-frames:v', '1', '-update', '1', outputPath
            ]);
            let stderr = '';
            proc.stderr.on('data', d => { stderr += d; });
            proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-300)}`)));
            proc.on('error', reject);
        });
        return await fs.readFile(outputPath);
    } finally {
        await fs.unlink(inputPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});
    }
}

module.exports = { extractStillFrame, extractFrameMontage };
