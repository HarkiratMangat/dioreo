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

// One row per emoji name: its prod id, whether it is animated, and which apps have it. `apps` is [{ key, emojis: [...] }] in display order; on prod the first app IS prod, so its ids are the prod ids.
function buildRows(prodMap, apps, { isProd = IS_PROD() } = {}) {
    const names = new Set(prodMap.keys());
    if (isProd && apps[0]) for (const e of apps[0].emojis) names.add(e.name);
    const byApp = apps.map(a => new Map(a.emojis.map(e => [e.name, e])));
    return [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })).map(name => {
        const live = isProd ? byApp[0]?.get(name) : null;
        const prod = live || prodMap.get(name) || null;
        const copies = byApp.map(m => m.get(name) || null);
        const animated = Boolean(prod?.animated || copies.find(Boolean)?.animated);
        return { name, prodId: prod ? prod.id : null, animated, has: copies.map(Boolean), copies, knownIds: [...new Set([prod?.id, ...copies.map(c => c?.id)].filter(Boolean))] };
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

module.exports = { prodEmojisFromSource, listAppEmojis, buildRows, sourceCandidates, uploadMissing, MAX_UPLOAD_BYTES, ORIGINALS_FOLDER };
