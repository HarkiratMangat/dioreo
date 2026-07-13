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

module.exports = { extractStillFrame };
