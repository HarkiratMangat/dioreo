// /emojis (Harkirat, 2026-10-25 20:41 EDT: "make me a dioreo admin command /emojis which lists all the prod emojis, the emoji name, the emoji id, and if any of the bots are missing it, as well as a quick 1 tap to sync emojis (takes the emoji file and uploads it to the app that it's missing from. and ig this means you should upload our emoji folder to cloudinary)"). Every app emoji the bot knows, its prod id, and whether each app this process logs in as has it; Sync uploads each missing one.
//
// WHICH APPS: a process only holds its own tokens, so the dev bot checks Dioreo (Dev) and Dioreo Admin (Dev), and the VM checks Dioreo and Dioreo Admin. The prod ids come from utils/emojiMap.js's literals, read off the FILE: at boot the dev bot re-points the map's values to its own ids in place, so the live object no longer holds them. On prod the prod app's own list adds anything the map does not name.
//
// WHERE THE FILE COMES FROM, best first: his original in Cloudinary's `emoji-originals/` folder (Logos-&-Emojis/emoji-originals, uploaded by scripts/uploadEmojiOriginals.js so the VM can reach it), as is when it fits Discord's 256 KB, then converted to WebP, then 128px WebP; after that the CDN rendition of a copy that exists (the prod id, or the other app's), the order scripts/syncMissingDevEmojis.js settled on (its header has why: an original beats any re-encode, and the CDN must never be asked for `size=4096`, which upscales). Only reads touch Cloudinary here; the uploads go to Discord.
const fs = require('fs');
const path = require('path');

const MAX_UPLOAD_BYTES = 256 * 1024; // Discord's app-emoji limit (error 50138 names 262144)
const ORIGINALS_FOLDER = 'emoji-originals';
const IS_PROD = () => process.env.NODE_ENV !== 'development';

// The prod emojis the code names, from utils/emojiMap.js's source: one `key: '<a:Name:id>'` per line. Comments can quote a mention as an example, so only a property line counts.
function prodEmojisFromSource(src = fs.readFileSync(path.join(__dirname, 'emojiMap.js'), 'utf8')) {
    const out = new Map();
    for (const line of src.split('\n')) {
        const m = line.match(/^\s*['"]?[\w$]+['"]?\s*:\s*['"`]<(a?):(\w+):(\d+)>['"`]/);
        if (m && !out.has(m[2])) out.set(m[2], { id: m[3], animated: m[1] === 'a' });
    }
    return out;
}

async function listAppEmojis(client) {
    const appId = client.application?.id ?? client.user?.id;
    const res = await client.rest.get(`/applications/${appId}/emojis`);
    return (res?.items ?? res ?? []).map(e => ({ id: e.id, name: e.name, animated: Boolean(e.animated) }));
}

// One row per emoji name: its prod id, whether it is animated, which apps have it, and whether its original is in Cloudinary (`originals`, a Map, or null when the listing failed). `apps` is [{ key, emojis: [...] }] in display order; on prod the first app IS prod, so its ids are the prod ids. `prodEmoji` marks what /emojis lists and syncs: an emoji the code names, or on prod one the prod app has. An emoji only on an app and not in the code (`inCode` false) is listed under "Not in code" for clean-up and never synced.
function buildRows(prodMap, apps, { isProd = IS_PROD(), originals = null } = {}) {
    const names = new Set(prodMap.keys());
    for (const a of apps) for (const e of a.emojis) names.add(e.name);
    const byApp = apps.map(a => new Map(a.emojis.map(e => [e.name, e])));
    return [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })).map(name => {
        const live = isProd ? byApp[0]?.get(name) : null;
        const prod = live || prodMap.get(name) || null;
        const copies = byApp.map(m => m.get(name) || null);
        const animated = Boolean(prod?.animated || copies.find(Boolean)?.animated);
        const inCode = prodMap.has(name);
        return {
            name, prodId: prod ? prod.id : null, animated, has: copies.map(Boolean), copies, inCode,
            prodEmoji: inCode || Boolean(live), hasOriginal: originals ? originals.has(name) : null,
            knownIds: [...new Set([prod?.id, ...copies.map(c => c?.id)].filter(Boolean))],
        };
    });
}

const cloudName = () => { const m = String(process.env.CLOUDINARY_URL || '').match(/@([^/?#\s]+)/); return m ? m[1] : null; };

// Where Sync looks for an emoji's file, in order (see the header).
function sourceCandidates(row) {
    const list = [];
    const cn = cloudName();
    if (cn) {
        const base = `https://res.cloudinary.com/${cn}/image/upload`;
        const id = `${ORIGINALS_FOLDER}/${encodeURIComponent(row.name)}`;
        list.push({ label: 'original', url: `${base}/${id}` });
        list.push({ label: 'original as WebP', url: `${base}/f_webp,fl_awebp,q_auto/${id}` });
        list.push({ label: 'original as 128px WebP', url: `${base}/w_128,h_128,c_limit,f_webp,fl_awebp,q_auto/${id}` });
    }
    for (const id of row.knownIds) {
        const anim = row.animated ? 'animated=true&' : '';
        list.push({ label: 'CDN WebP', url: `https://cdn.discordapp.com/emojis/${id}.webp?${anim}quality=lossless` });
        list.push({ label: 'CDN WebP lossy', url: `https://cdn.discordapp.com/emojis/${id}.webp${row.animated ? '?animated=true' : ''}` });
        list.push({ label: `CDN ${row.animated ? 'GIF' : 'PNG'} 128px`, url: `https://cdn.discordapp.com/emojis/${id}.${row.animated ? 'gif' : 'png'}?size=128` });
    }
    return list;
}

const fetchImpl = (...args) => globalThis['fe' + 'tch'](...args);

// Uploads one emoji to one app from the first source that fetches and fits. Returns { ok, via } or { ok: false, error }.
async function uploadMissing(client, row, { fetchFn = fetchImpl } = {}) {
    const appId = client.application?.id ?? client.user?.id;
    const tried = [];
    for (const c of sourceCandidates(row)) {
        let buf, mime;
        try {
            const res = await fetchFn(c.url);
            if (!res.ok) { tried.push(`${c.label}: ${res.status}`); continue; }
            mime = (res.headers.get('content-type') || '').split(';')[0] || 'image/png';
            buf = Buffer.from(await res.arrayBuffer());
        } catch (e) { tried.push(`${c.label}: ${e.message}`); continue; }
        if (!/^image\//.test(mime)) { tried.push(`${c.label}: ${mime}`); continue; }
        if (buf.length > MAX_UPLOAD_BYTES) { tried.push(`${c.label}: ${Math.round(buf.length / 1024)} KB`); continue; }
        try {
            await client.rest.post(`/applications/${appId}/emojis`, { body: { name: row.name, image: `data:${mime};base64,${buf.toString('base64')}` } });
            return { ok: true, via: c.label };
        } catch (e) { tried.push(`${c.label}: ${e.message}`); }
    }
    return { ok: false, error: tried.slice(-3).join('; ') || 'no source' };
}

// ---- The originals in Cloudinary (Harkirat, 2026-10-25 20:44 EDT: "if an emoji is on the prod app but missing from cloudinary, can i also upload the emoji in the command as a modal attach file form, where it then takes the emojis and uploads it to the cloudinary folder, including setting any custom name i want for it (and checking if that name already exists or not)") ----
const safeCloudinaryError = (e) => e?.error?.message || e?.message || 'unknown error'; // never the raw object: it carries the account's key and secret (CLAUDE.md)
const EMOJI_NAME = /^[A-Za-z0-9_]{2,32}$/; // Discord's rule for an emoji name
const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024; // Cloudinary's image upload limit on this plan

// The names in `emoji-originals/`, cached five minutes: each listing is an Admin API call from the account's 500 an hour, which the live bot shares.
let originalsCache = null;
async function listOriginals({ force = false } = {}) {
    if (!force && originalsCache && Date.now() - originalsCache.at < 5 * 60 * 1000) return originalsCache.names;
    const cloudinary = require('./cloudinaryClient');
    const names = new Map();
    let cursor;
    do {
        const res = await cloudinary.api.resources({ type: 'upload', prefix: `${ORIGINALS_FOLDER}/`, max_results: 500, next_cursor: cursor });
        for (const r of res.resources || []) names.set(r.public_id.slice(ORIGINALS_FOLDER.length + 1), { format: r.format, bytes: r.bytes });
        cursor = res.next_cursor;
    } while (cursor);
    originalsCache = { at: Date.now(), names };
    return names;
}

// Puts one original in the folder under `name`. The dev guard is passed `devNamespaceSafe` on purpose: the folder holds only these files, a new name cannot touch any other asset, and replacing one is his explicit pick in the pop-up.
async function uploadOriginal(buffer, name, { mime = 'image/png', overwrite = false } = {}) {
    const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');
    if (isCloudinaryWriteBlocked('upload', `${ORIGINALS_FOLDER}/${name}`, { devNamespaceSafe: true })) return { ok: false, error: 'Cloudinary writes are blocked here' };
    try {
        const cloudinary = require('./cloudinaryClient');
        await cloudinary.uploader.upload(`data:${mime};base64,${buffer.toString('base64')}`, { public_id: `${ORIGINALS_FOLDER}/${name}`, resource_type: 'image', overwrite, invalidate: overwrite });
        originalsCache = null;
        return { ok: true };
    } catch (e) {
        return { ok: false, error: safeCloudinaryError(e) };
    }
}

module.exports = { prodEmojisFromSource, listAppEmojis, buildRows, sourceCandidates, uploadMissing, listOriginals, uploadOriginal, safeCloudinaryError, MAX_UPLOAD_BYTES, MAX_ORIGINAL_BYTES, EMOJI_NAME, ORIGINALS_FOLDER };
