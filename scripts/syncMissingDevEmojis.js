// scripts/syncMissingDevEmojis.js — copy, check and repair the app emojis of a NON-prod application: the dev bot (`Dioreo (Dev)`) or Dioreo Admin (2026-10-19 13:45 EDT, rebuilt for the second app).
//
// Application emojis render only for the app that owns them, so every app needs its own copy of every emoji in utils/emojiMap.js, under the same NAME (refreshEmojiIds() re-points by name at boot). The SOURCE is always prod: emojiMap.js's mention strings carry prod's ids, and Discord's emoji CDN is public, so no prod credential is needed to read them.
//
//   node scripts/syncMissingDevEmojis.js                 # dev bot app: upload what is missing, then check every copy
//   node scripts/syncMissingDevEmojis.js --app admin     # same, for the dev Dioreo Admin app (ADMIN_BOT_TOKEN)
//   node scripts/syncMissingDevEmojis.js --check         # compare only, change nothing
//   node scripts/syncMissingDevEmojis.js --replace-broken  # delete and re-upload every copy the check flags
//   node scripts/syncMissingDevEmojis.js --replace Name1,Name2
//   node scripts/syncMissingDevEmojis.js --replace-all   # re-upload every copy from prod
//   node scripts/syncMissingDevEmojis.js --app admin --file 10CP=local/emoji-originals/cp-coin-10cp-128.avif
//       # upload YOUR ORIGINAL file under that name (replacing any copy), then check it. The way around Discord's re-compression
//       # of a heavy emoji: a file already under 256 KB goes up untouched (Harkirat, 2026-10-19 14:01 EDT: "what if you try uploading the original version").
//
// WHY THE REBUILD (Harkirat, 2026-10-19 13:26 EDT: "the earlier dev bot script kind of bugged out a few of the emojis during the transfer"). The first version downloaded every animated emoji as `.gif` and every static one as `.png`. A GIF has one bit of transparency, so a soft or glowing edge comes back hard, and the CDN's GIF is a conversion rather than the uploaded file. This version downloads WebP at the emoji's NATIVE size (animated when the emoji is), lossless when that fits, and falls back to default-quality WebP and then GIF/PNG only when a candidate is over Discord's limit or refused. Then it CHECKS: each copy is fetched back the same way as its prod original and compared on what can actually differ after Discord re-encodes an upload (animated or not, width, height, frame count, and a file that shrank a lot), so a bad copy is named by measurement instead of noticed in a panel.
//
// ⚠️ Measured 2026-10-19 13:47 EDT on the first run of this rebuild: never ask the CDN for `size=4096`. It UPSCALES (a 128px emoji came back at ~400KB), and Discord then refuses the upload ("Failed to resize asset below the maximum size: 262144", or over 2048 KB). An app emoji upload must be at most 256 KB. ⚠️ And measured at 13:51 EDT: several prod emojis are LARGE at their native size (DeleteAll is 4,130 KB as lossless WebP, 1,107 KB as GIF), so no native rendition fits. For those the CDN is asked to scale DOWN (`size=128`, then 96, then 64; Discord shows an emoji at 48px at most), still WebP, still animated. A copy made that way is smaller than prod by design, so the check compares its frames and shape, not its pixel size.
//
// ⚠️ Tokens are read from `.env.dev` OFF DISK, never from process.env: dotenv backfills a key `.env.dev` omits from prod's `.env` (CLAUDE.md, the local dev bot), so trusting process.env could hand this script a PROD token. It also refuses a token equal to one in `.env`, the same backstop scripts/devCommands.js uses. This script never writes to a prod application; the prod Dioreo Admin copy waits for Harkirat's word at deploy.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const emojis = require('../utils/emojiMap');

const REPO_ROOT = path.join(__dirname, '..');
const API = 'https://discord.com/api/v10';

function readEnvFile(file) {
    let raw;
    try { raw = fs.readFileSync(file, 'utf8'); } catch { return {}; }
    const out = {};
    for (const line of raw.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        const key = t.slice(0, eq).replace(/^export\s+/, '').trim();
        let value = t.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
        out[key] = value;
    }
    return out;
}

function parseArgs(argv) {
    const args = { app: 'public', check: false, replaceBroken: false, replaceAll: false, replace: [], files: [] };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--app') args.app = argv[++i];
        else if (a === '--check') args.check = true;
        else if (a === '--replace-broken') args.replaceBroken = true;
        else if (a === '--replace-all') args.replaceAll = true;
        else if (a === '--file') args.files = String(argv[++i] || '').split(',').map(pair => { const eq = pair.indexOf('='); return { name: pair.slice(0, eq).trim(), file: pair.slice(eq + 1).trim() }; }).filter(f => f.name && f.file);
        else if (a === '--replace') args.replace = String(argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean);
        else throw new Error(`Unknown argument: ${a}`);
    }
    if (!['public', 'admin'].includes(args.app)) throw new Error('--app must be public or admin');
    return args;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// One Discord call, waiting out a 429 rather than failing the run (uploading ~80 emojis trips the rate limit).
async function discord(token, method, route, body) {
    for (let attempt = 0; attempt < 5; attempt++) {
        const res = await fetch(`${API}${route}`, {
            method,
            headers: { Authorization: `Bot ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (res.status === 429) {
            const wait = Number((await res.json().catch(() => ({}))).retry_after || 1) * 1000;
            await sleep(wait + 250);
            continue;
        }
        const text = await res.text();
        return { ok: res.ok, status: res.status, json: text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null };
    }
    return { ok: false, status: 429, json: 'rate limited five times in a row' };
}

const MAX_UPLOAD_BYTES = 256 * 1024;   // Discord's app-emoji limit (error 50138 names 262144)

// An emoji's rendition at its NATIVE size (no `size`: see the header), animated when the emoji is. Fetched the same way for the prod original and for the copy, so any difference is in what was uploaded, not in how it was fetched.
async function fetchRendition(id, animated, { lossless = true, ext = 'webp', size = null } = {}) {
    const q = [size ? `size=${size}` : null, ext === 'webp' && lossless ? 'quality=lossless' : null, animated && ext === 'webp' ? 'animated=true' : null].filter(Boolean).join('&');
    const url = `https://cdn.discordapp.com/emojis/${id}.${ext}${q ? `?${q}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CDN ${res.status} for ${id}`);
    return Buffer.from(await res.arrayBuffer());
}

// Width, height and frame count, measured by ffprobe (a system dependency already, utils/stillFrame.js uses ffmpeg). null when ffprobe cannot read it.
function probe(buffer) {
    const file = path.join(os.tmpdir(), `emoji-${crypto.randomBytes(6).toString('hex')}.webp`);
    fs.writeFileSync(file, buffer);
    try {
        const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,nb_read_frames', '-of', 'json', file], { encoding: 'utf8', timeout: 20000 });
        const s = JSON.parse(out).streams?.[0] || {};
        return { width: Number(s.width) || null, height: Number(s.height) || null, frames: Number(s.nb_read_frames) || null };
    } catch {
        return null;
    } finally {
        fs.rmSync(file, { force: true });
    }
}

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 12);

// What differs between a prod original and its copy, as short phrases; empty when they match. Bytes are never compared for equality: Discord re-encodes every upload, so a perfect copy still differs by a few bytes. A copy under 80% of the original's size is reported, since that is what a lossy fallback or a dropped frame looks like.
async function compare(source, copy) {
    const problems = [];
    if (Boolean(source.animated) !== Boolean(copy.animated)) problems.push(`animated ${source.animated} → ${copy.animated}`);
    const [a, b] = await Promise.all([fetchRendition(source.id, source.animated), fetchRendition(copy.id, copy.animated)]);
    if (sha(a) === sha(b)) return problems;
    const pa = probe(a), pb = probe(b);
    if (!pa || !pb) return [...problems, 'ffprobe could not read one of them'];
    if (pa.frames !== pb.frames) problems.push(`frames ${pa.frames} → ${pb.frames}`);
    const sameSize = pa.width === pb.width && pa.height === pb.height;
    // A smaller copy is expected when prod's original was too big to upload (see the header); only its SHAPE has to match then.
    if (!sameSize && Math.abs(pa.width / pa.height - pb.width / pb.height) > 0.02) problems.push(`shape ${pa.width}×${pa.height} → ${pb.width}×${pb.height}`);
    if (sameSize && b.length < a.length * 0.8) problems.push(`file shrank ${a.length} → ${b.length} bytes`);
    return problems;
}

// Uploads the prod original under its name, best candidate first: lossless WebP, default-quality WebP, then the CDN's GIF/PNG. A candidate over the 256 KB limit is skipped without a request.
async function upload(token, appId, source) {
    const fallbackExt = source.animated ? 'gif' : 'png';
    const candidates = [];
    for (const size of [null, 128, 96, 64]) {
        const at = size ? ` ${size}px` : '';
        candidates.push({ label: `webp lossless${at}`, get: () => fetchRendition(source.id, source.animated, { lossless: true, size }), mime: 'image/webp' });
        candidates.push({ label: `webp${at}`, get: () => fetchRendition(source.id, source.animated, { lossless: false, size }), mime: 'image/webp' });
    }
    candidates.push({ label: fallbackExt, get: () => fetchRendition(source.id, source.animated, { ext: fallbackExt, size: 128 }), mime: `image/${fallbackExt}` });
    const tried = [];
    for (const c of candidates) {
        let buf;
        try { buf = await c.get(); } catch (err) { tried.push(`${c.label}: ${err.message}`); continue; }
        if (buf.length > MAX_UPLOAD_BYTES) { tried.push(`${c.label}: ${Math.round(buf.length / 1024)} KB, over 256`); continue; }
        const res = await discord(token, 'POST', `/applications/${appId}/emojis`, { name: source.name, image: `data:${c.mime};base64,${buf.toString('base64')}` });
        if (res.ok) return { emoji: res.json, mime: c.label };
        tried.push(`${c.label}: ${res.status} ${typeof res.json === 'string' ? res.json : res.json?.message}`);
    }
    throw new Error(`no candidate accepted (${tried.join(' · ')})`);
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const dev = readEnvFile(path.join(REPO_ROOT, '.env.dev'));
    const prod = readEnvFile(path.join(REPO_ROOT, '.env'));
    const key = args.app === 'admin' ? 'ADMIN_BOT_TOKEN' : 'BOT_TOKEN';
    const token = dev[key];
    if (!token) throw new Error(`${key} is not set in .env.dev`);
    if ([prod.BOT_TOKEN, prod.ADMIN_BOT_TOKEN].filter(Boolean).includes(token)) throw new Error(`Refusing: .env.dev's ${key} equals a token in .env (prod). This script only touches non-prod apps.`);

    const me = await discord(token, 'GET', '/oauth2/applications/@me');
    if (!me.ok) throw new Error(`Could not resolve the application: ${me.status}`);
    const appId = me.json.id;
    console.log(`🤖 ${me.json.name} (${appId})`);

    const sources = new Map();
    for (const [k, v] of Object.entries(emojis)) {
        const p = typeof v === 'string' ? emojis.parseEmoji(v) : null;
        if (p && !sources.has(p.name)) sources.set(p.name, { ...p, key: k });
    }

    // Emojis looked up BY NAME at render time are not in emojiMap, so the loop above never saw them, and Dioreo Admin never got a copy: found 2026-10-20 14:20 EDT when the Adjust modal's Rank Mode options showed no icons (Harkirat: "rank mode icons not included?"). Their source is the dev bot's own app, which holds them. RANK_MODE_EMOJI is the list today; add any new by-name family here.
    const byName = Object.values(require('../utils/rankModes').RANK_MODE_EMOJI).filter(n => !sources.has(n));
    if (byName.length && dev.BOT_TOKEN && dev.BOT_TOKEN !== token) {
        const pub = await discord(dev.BOT_TOKEN, 'GET', '/oauth2/applications/@me');
        const res = pub.ok ? await discord(dev.BOT_TOKEN, 'GET', `/applications/${pub.json.id}/emojis`) : null;
        const have = new Map(((res && res.ok && (res.json.items || res.json)) || []).map(e => [e.name, e]));
        for (const n of byName) {
            const e = have.get(n);
            if (e) sources.set(n, { name: n, id: e.id, animated: !!e.animated, key: `byName:${n}` });
            else console.error(`   ❌ :${n}: is looked up by name but the dev bot's app has no copy to take it from`);
        }
    }

    const list = async () => {
        const res = await discord(token, 'GET', `/applications/${appId}/emojis`);
        if (!res.ok) throw new Error(`Could not list emojis: ${res.status}`);
        return new Map((res.json.items || res.json || []).map(e => [e.name, e]));
    };
    let existing = await list();

    if (args.files.length) {
        const MIME = { '.avif': 'image/avif', '.webp': 'image/webp', '.gif': 'image/gif', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
        for (const { name, file } of args.files) {
            const s = sources.get(name);
            const mime = MIME[path.extname(file).toLowerCase()];
            if (!s) { console.error(`   ❌ :${name}: not in utils/emojiMap.js`); continue; }
            if (!mime) { console.error(`   ❌ :${name}: unknown file type ${file}`); continue; }
            const buf = fs.readFileSync(path.resolve(REPO_ROOT, file));
            if (buf.length > MAX_UPLOAD_BYTES) { console.error(`   ❌ :${name}: ${Math.round(buf.length / 1024)} KB, over 256`); continue; }
            const old = existing.get(name);
            if (old) {
                const del = await discord(token, 'DELETE', `/applications/${appId}/emojis/${old.id}`);
                if (!del.ok) { console.error(`   ❌ :${name}: delete failed ${del.status}`); continue; }
            }
            const res = await discord(token, 'POST', `/applications/${appId}/emojis`, { name, image: `data:${mime};base64,${buf.toString('base64')}` });
            if (!res.ok) { console.error(`   ❌ :${name}: ${res.status} ${typeof res.json === 'string' ? res.json : JSON.stringify(res.json)}`); continue; }
            const problems = await compare(s, res.json).catch(err => [`could not compare: ${err.message}`]);
            console.log(problems.length ? `   ⚠️  :${name}: uploaded from ${path.basename(file)}, differs from prod: ${problems.join(', ')}` : `   ✅ :${name}: uploaded from ${path.basename(file)}, matches prod`);
        }
        return;
    }

    if (!args.check) {
        const missing = [...sources.values()].filter(s => !existing.has(s.name));
        console.log(missing.length ? `⬆️  Uploading ${missing.length} missing` : '✅ Nothing missing');
        for (const s of missing) {
            try { const { mime } = await upload(token, appId, s); console.log(`   ✅ :${s.name}: (${mime})`); }
            catch (err) { console.error(`   ❌ :${s.name}: ${err.message}`); }
        }
        if (missing.length) existing = await list();
    }

    console.log(`🔎 Checking ${sources.size} copies against prod`);
    const broken = [];
    for (const s of sources.values()) {
        const copy = existing.get(s.name);
        if (!copy) { broken.push({ s, problems: ['missing'] }); continue; }
        try {
            const problems = await compare(s, copy);
            if (problems.length) broken.push({ s, copy, problems });
        } catch (err) {
            broken.push({ s, copy, problems: [`could not compare: ${err.message}`] });
        }
    }
    if (!broken.length) console.log('✅ Every copy matches its prod original');
    for (const b of broken) console.log(`   ⚠️  :${b.s.name}: ${b.problems.join(', ')}`);

    const toReplace = args.replaceAll ? [...sources.keys()].filter(n => existing.has(n))
        : args.replaceBroken ? broken.filter(b => b.copy).map(b => b.s.name) : args.replace;
    if (!toReplace.length || args.check) return;
    console.log(`♻️  Replacing ${toReplace.length}`);
    for (const name of toReplace) {
        const s = sources.get(name);
        const copy = existing.get(name);
        if (!s) { console.error(`   ❌ :${name}: not in utils/emojiMap.js`); continue; }
        if (copy) {
            const del = await discord(token, 'DELETE', `/applications/${appId}/emojis/${copy.id}`);
            if (!del.ok) { console.error(`   ❌ :${name}: delete failed ${del.status}`); continue; }
        }
        try {
            const { emoji, mime } = await upload(token, appId, s);
            const problems = await compare(s, emoji);
            console.log(problems.length ? `   ⚠️  :${name}: re-uploaded (${mime}) but still ${problems.join(', ')}` : `   ✅ :${name}: re-uploaded (${mime}), now matches`);
        } catch (err) {
            console.error(`   ❌ :${name}: ${err.message}`);
        }
    }
}

if (require.main === module) {
    main().catch(err => { console.error('❌ Failed:', err?.message || err); process.exit(1); });
}

module.exports = { parseArgs, readEnvFile };
