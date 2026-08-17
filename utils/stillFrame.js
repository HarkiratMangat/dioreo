// utils/stillFrame.js
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

// Some Discord image sources are animated -- avatar decorations are commonly served as animated PNG (APNG), which Jimp (this bot's whole color-extraction engine, utils/colorExtract.js) cannot decode at all (confirmed live against a real equipped decoration: "Mime type image/apng does not support decoding"). This downloads the source and extracts exactly ONE still frame via ffmpeg (already a system dependency on this bot's host, confirmed present), returning it as a plain PNG Buffer that Jimp reads exactly like any other still image (Jimp.read() accepts a Buffer directly, same as a URL). Deliberately general-purpose, not decoration-specific -- reuse this for any other animated source this bot ever needs a representative color from, rather than duplicating the ffmpeg plumbing at each call site.
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
            // -update 1 (rather than the default image2-sequence-pattern behavior) is what makes ffmpeg write a single plain PNG file instead of warning about a missing %d sequence pattern -- confirmed needed live, ffmpeg still produced a valid single frame without it but printed a pattern-mismatch warning on every call.
            const proc = spawn('ffmpeg', ['-y', '-i', inputPath, '-vframes', '1', '-update', '1', outputPath]);
            let stderr = '';
            proc.stderr.on('data', d => { stderr += d; });
            proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-300)}`)));
            proc.on('error', reject);
        });
        return await fs.readFile(outputPath);
    } finally {
        // Best-effort cleanup -- a failed unlink (e.g. process already gone) shouldn't mask the real result/error from the try block above.
        await fs.unlink(inputPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});
    }
}

// ONE frame is not a fair sample of an animation (2026-08-09 18:15 EDT). Measured against a real equipped decoration with 60 frames: frame 1 -- the one extractStillFrame takes -- peaked at #0e1217 with a vividness of 0.035, while frame 11 peaked at #ff9708 (a gold sparkle) at 0.969. 33 of the 60 frames peak in the orange/gold band and 27 in blue-grey, so which frame you land on decides the entire result. Harkirat spotted the missing sparkle in the live panel before any of this was measured.
//
// This tiles EVENLY-SPACED frames into one montage image, so the existing k-means sees the whole animation's colour range as a single still. Deterministic by construction -- the frame count and spacing are fixed, never sampled at random -- which the "Refresh Colors" change-detection depends on (see .claude/rules/accent-and-colors.md).
//
// ⚠️ APNG needs `-f apng` NAMED EXPLICITLY as the demuxer. Without it ffmpeg reads a Discord decoration as a single still and writes exactly one output file, silently -- it does not error, so a multi-frame extraction quietly degrades to the single-frame behaviour this exists to replace. Verified: `-f apng` produced 60 frames where the bare form produced 0 usable ones.
const MONTAGE_FRAMES = 9; // 3x3 grid -- enough to cover a full animation cycle without a big decode

// Discord serves animated assets in two different containers and ffmpeg needs to be TOLD which one for APNG (see the `-f apng` note above), while it auto-detects GIF correctly. Hardcoding `-f apng` therefore breaks a GIF source outright, which is why this sniffs the real bytes instead: APNG is a PNG signature plus an `acTL` chunk (always before the first IDAT, so a bounded search is enough), GIF is its own magic. Anything else returns null and ffmpeg is left to work it out itself.
function sniffAnimatedFormat(buffer) {
    if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'GIF8') return 'gif';
    const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG';
    if (isPng && buffer.subarray(0, 65536).includes('acTL')) return 'apng';
    return null;
}

// How many frames does this animation actually have? Needed because the frame STRIDE has to be derived from the real length -- see the span bug fixed below. Returns null (rather than throwing) if ffprobe is unavailable or the input is a single still, so the caller degrades to stride 1 instead of failing the whole extraction.
function countFrames(inputPath, format) {
    return new Promise(resolve => {
        const args = [];
        if (format) args.push('-f', format);
        args.push('-v', 'error', '-count_frames', '-select_streams', 'v:0',
            '-show_entries', 'stream=nb_read_frames', '-of', 'default=nk=1:nw=1', inputPath);
        const proc = spawn('ffprobe', args);
        let out = '';
        proc.stdout.on('data', d => { out += d; });
        proc.on('close', code => {
            const n = parseInt(out.trim(), 10);
            resolve(code === 0 && Number.isFinite(n) && n > 0 ? n : null);
        });
        proc.on('error', () => resolve(null));
    });
}

// ⚠️ SPAN BUG FIXED (2026-08-11 01:45 EDT). The stride here used to be the literal constant 3 with a 9-tile grid, so this only ever sampled frames 0,3,...,24 -- the first 25 frames, no matter how long the animation was. The comment claimed it "spans the whole cycle"; that was only true for animations of 27 frames or fewer, and it silently shortchanged everything longer INCLUDING the 60-frame decoration this function was written for. Measured on a real 85-frame banner whose pale sky blooms into crimson flowers only after frame ~34: a single frame lost 83% of the image's peak chroma and THIS FUNCTION lost 84% -- i.e. the montage was no better than the single frame it replaced. Deriving the stride from the real frame count recovers the crimson (#A90824). Harkirat predicted this failure from the source GIF before it was measured, exactly as he did for the decoration's gold sparkle. Still deterministic: the frame count, stride and grid are all fixed functions of the input, with no sampling or randomness anywhere -- which "Refresh Colors" change-detection depends on.
async function extractFrameMontage(sourceUrl, frames = MONTAGE_FRAMES) {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`Failed to download ${sourceUrl}: HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const id = crypto.randomUUID();
    const inputPath = path.join(os.tmpdir(), `dior_montage_in_${id}.png`);
    const outputPath = path.join(os.tmpdir(), `dior_montage_out_${id}.png`);
    await fs.writeFile(inputPath, buffer);

    try {
        const format = sniffAnimatedFormat(buffer);
        const total = await countFrames(inputPath, format);
        // ceil (not floor) so the selection reaches the END of the animation: 85 frames over 9 tiles gives stride 10 -> frames 0,10,...,80, covering 94% of the cycle. floor would give stride 9 and stop at 81 having emitted 10 candidates for 9 tiles, wasting one.
        const stride = total && total > frames ? Math.ceil(total / frames) : 1;
        await new Promise((resolve, reject) => {
            const cols = Math.ceil(Math.sqrt(frames));
            const rows = Math.ceil(frames / cols);
            const args = ['-y'];
            if (format === 'apng') args.push('-f', 'apng');
            args.push('-i', inputPath,
                // select every Nth frame so the sample spans the whole cycle rather than clustering at the start, then tile what survives. `tile` pads a short grid automatically.
                //
                // ⚠️ SCALE BEFORE TILING, always. A 3x3 grid multiplies the source's own resolution NINEFOLD: measured 2026-08-11 01:50 EDT, a 999x427 animated banner tiled out to 2997x1281 = 3.8M pixels for Jimp to decode SYNCHRONOUSLY -- precisely the event-loop stall that produced the bot-wide 10062 "Unknown interaction" wave (see .claude/rules/accent-and-colors.md). This never bit before because the only caller was decoration, whose assets are ~160px square; it becomes a real hazard the moment banners go through here. k-means samples ~2500 pixels regardless of resolution, so capping each tile at 160px wide costs nothing in quality. `min` is escaped because an unescaped comma would be read as a filter separator, silently breaking the chain.
                '-vf', `select='not(mod(n\\,${stride}))',scale=w='min(160\\,iw)':h=-1,tile=${cols}x${rows}`,
                '-frames:v', '1', '-update', '1', outputPath);
            const proc = spawn('ffmpeg', args);
            let stderr = '';
            proc.stderr.on('data', d => { stderr += d; });
            proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-300)}`)));
            proc.on('error', reject);
        });
        return await fs.readFile(outputPath);
    } finally {
        // Best-effort cleanup -- a failed unlink shouldn't mask the real result/error from the try.
        await fs.unlink(inputPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});
    }
}

module.exports = { extractStillFrame, extractFrameMontage };
