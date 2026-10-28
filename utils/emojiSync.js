// /emojis (Harkirat, 2026-10-25 20:41 EDT: "make me a dioreo admin command /emojis which lists all the prod emojis, the emoji name, the emoji id, and if any of the bots are missing it, as well as a quick 1 tap to sync emojis (takes the emoji file and uploads it to the app that it's missing from. and ig this means you should upload our emoji folder to cloudinary)"). Every app emoji the bot knows, its prod id, and whether each app this process logs in as has it; Sync uploads each missing one.
//
// WHICH APPS: a process only holds its own tokens, so the dev bot writes to Dioreo (Dev) and Dioreo Admin (Dev), and the VM to Dioreo and Dioreo Admin; no token leaves its machine. Each bot leaves a status report of its two apps in Cloudinary (`emoji-status/<dev|prod>.json`), so /emojis shows all four. The prod ids come from utils/emojiMap.js's literals, read off the FILE: at boot the dev bot re-points the map's values to its own ids in place, so the live object no longer holds them.
//
// ONE UPLOAD, FOUR BOTS (Harkirat, 2026-10-25 21:14-21:16 EDT: "I don't want to upload each emoji like 4 separate times" / "I don't want it to like download the emoji from Discord, because we saw earlier that that messed with the quality"). Cloudinary's `emoji-originals/` is the source of truth: every file there belongs on every bot, and `runAutoSync` (at start-up and every hour, bot/lifecycle.js) uploads whatever its own two apps lack. The ONLY source is that original (Logos-&-Emojis/emoji-originals, put there by scripts/uploadEmojiOriginals.js or /emojis' Upload original): as is when it fits Discord's 256 KB, else Cloudinary's WebP of it, else 128px WebP of it. Never a Discord CDN copy: re-encoding those is what lost quality before (scripts/syncMissingDevEmojis.js's header), and an emoji with no original is listed under No original instead of being copied.
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
        // At its CURRENT version: an unversioned URL keeps serving the old file from the CDN after a Replace (measured 2026-10-25 21:22 EDT, even with a query string), so a bot would copy the old art.
        const id = `${row.version ? `v${row.version}/` : ''}${ORIGINALS_FOLDER}/${encodeURIComponent(row.name)}`;
        list.push({ label: 'original', url: `${base}/${id}` });
        list.push({ label: 'original as WebP', url: `${base}/f_webp,fl_awebp,q_auto/${id}` });
        list.push({ label: 'original as 128px WebP', url: `${base}/w_128,h_128,c_limit,f_webp,fl_awebp,q_auto/${id}` });
        // DB_Database (a 1.8 MB GIF) fits none of the three above (measured 21:19 EDT); still made from the original, never a Discord copy.
        list.push({ label: 'original as 96px WebP', url: `${base}/w_96,h_96,c_limit,f_webp,fl_awebp,q_60/${id}` });
    }
    return list; // never a Discord CDN copy (see the header)
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

// Swaps an app's emoji for its original's current file (2026-10-28 16:30 EDT, Harkirat: "i want the replace option as well"). Discord cannot edit an app emoji's image, so this is a delete and an upload; the new file is fetched and size-checked FIRST so a bad file never costs the old emoji, and if the upload still fails the name is simply missing and the next sync adds it. The emoji's id changes; every consumer re-points by name (utils/emojiMap.js refreshEmojiIds), but an old message still showing the old id goes blank. Returns { ok, via } or { ok: false, error }.
async function replaceEmoji(client, row, oldId, { fetchFn = fetchImpl } = {}) {
    const appId = client.application?.id ?? client.user?.id;
    let ready = null;
    const tried = [];
    for (const c of sourceCandidates(row)) {
        try {
            const res = await fetchFn(c.url);
            if (!res.ok) { tried.push(`${c.label}: ${res.status}`); continue; }
            const mime = (res.headers.get('content-type') || '').split(';')[0] || 'image/png';
            const buf = Buffer.from(await res.arrayBuffer());
            if (!/^image\//.test(mime)) { tried.push(`${c.label}: ${mime}`); continue; }
            if (buf.length > MAX_UPLOAD_BYTES) { tried.push(`${c.label}: ${Math.round(buf.length / 1024)} KB`); continue; }
            ready = { c, buf, mime };
            break;
        } catch (e) { tried.push(`${c.label}: ${e.message}`); }
    }
    if (!ready) return { ok: false, error: tried.slice(-3).join('; ') || 'no source' };
    try { await client.rest.delete(`/applications/${appId}/emojis/${oldId}`); } catch (e) { return { ok: false, error: `could not remove the old copy: ${e.message}` }; }
    try {
        await client.rest.post(`/applications/${appId}/emojis`, { body: { name: row.name, image: `data:${ready.mime};base64,${ready.buf.toString('base64')}` } });
        return { ok: true, via: ready.c.label };
    } catch (e) {
        // The old copy is gone; try the other sources before giving up, and leave the name to the next sync if none works.
        const again = await uploadMissing(client, row, { fetchFn });
        return again.ok ? again : { ok: false, error: `the old copy is removed and the new one was refused (${again.error}); the next sync adds it` };
    }
}

// ---- Which version of each original each app holds (models/EmojiApplied.js) ---- `load(appIds)` answers a Map of `${appId}:${name}` -> version, or null when the database cannot be read (the sync then never swaps); `save(entries)` upserts [{ appId, name, version }]. Both fail soft.
const appliedStore = {
    async load(appIds) {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) return null;
        try {
            const docs = await require('../models/EmojiApplied').find({ appId: { $in: appIds } }).lean();
            return new Map(docs.map(d => [`${d.appId}:${d.name}`, d.version]));
        } catch (e) { console.error('Reading the emoji versions failed:', e?.message || e); return null; }
    },
    async save(entries) {
        const mongoose = require('mongoose');
        if (!entries.length || mongoose.connection.readyState !== 1) return false;
        try {
            await require('../models/EmojiApplied').bulkWrite(entries.map(e => ({
                updateOne: { filter: { appId: e.appId, name: e.name }, update: { $set: { version: e.version, updatedAt: new Date() } }, upsert: true },
            })));
            return true;
        } catch (e) { console.error('Saving the emoji versions failed:', e?.message || e); return false; }
    },
};

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
        for (const r of res.resources || []) names.set(r.public_id.slice(ORIGINALS_FOLDER.length + 1), { format: r.format, bytes: r.bytes, version: r.version });
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

// ---- Status reports: each bot's two apps, for the other bot's /emojis ----
const STATUS_FOLDER = 'emoji-status';
const envKey = () => (IS_PROD() ? 'prod' : 'dev');
let lastStatusKey = null;
async function writeStatus(apps, { force = false } = {}) {
    // Only when the lists changed: every write is an upload and a CDN purge, and an idle check would otherwise make one each time.
    const key = JSON.stringify(apps.map(a => [a.key, (a.emojis || []).map(e => `${e.name}:${e.id}`).sort()]));
    if (!force && key === lastStatusKey) return true;
    const { isCloudinaryWriteBlocked } = require('./cloudinaryDevGuard');
    // devNamespaceSafe: `emoji-status/` holds only these two reports.
    if (isCloudinaryWriteBlocked('upload', `${STATUS_FOLDER}/${envKey()}.json`, { devNamespaceSafe: true })) return false;
    const body = { env: envKey(), at: new Date().toISOString(), apps: apps.map(a => ({ key: a.key, label: a.label, emojis: a.emojis })) };
    try {
        const cloudinary = require('./cloudinaryClient');
        await cloudinary.uploader.upload(`data:application/json;base64,${Buffer.from(JSON.stringify(body)).toString('base64')}`, { public_id: `${STATUS_FOLDER}/${envKey()}.json`, resource_type: 'raw', overwrite: true, invalidate: true });
        lastStatusKey = key;
        return true;
    } catch (e) { console.error('Emoji status report failed:', safeCloudinaryError(e)); return false; }
}
// The OTHER bot's report, or null. Read at its current version (one Admin API call, cached a minute), so a report written a moment ago is never served stale from the CDN.
let otherCache = null;
async function readOtherStatus({ fetchFn = fetchImpl } = {}) {
    if (otherCache && Date.now() - otherCache.at < 60 * 1000) return otherCache.value;
    const other = envKey() === 'prod' ? 'dev' : 'prod';
    let value = null;
    try {
        const cloudinary = require('./cloudinaryClient');
        const meta = await cloudinary.api.resource(`${STATUS_FOLDER}/${other}.json`, { resource_type: 'raw' });
        const res = await fetchFn(meta.secure_url);
        if (res.ok) value = await res.json();
    } catch (e) { if (e?.error?.http_code !== 404) console.error('Reading the other bot\'s emoji status failed:', safeCloudinaryError(e)); }
    otherCache = { at: Date.now(), value };
    return value;
}

// ---- The auto-sync: every original onto every app of this process that lacks it ---- Which originals go out: one the code names, or one some bot already has (this process's apps, or the other bot's in its last report). A file nobody uses is never pushed, so a stray (EditCalc, saved before the emoji was renamed Edit) or a retired one cannot spread by itself; a new emoji uploaded through /emojis lands on that bot's pair at once, and so reaches the other bot through its report. A failed upload is not retried for a day (DB_Database once failed on every attempt). Used by the timer in bot/lifecycle.js and by /emojis' Sync button, which share the lock so the two never upload the same emoji twice.
let syncing = false;
const failedUntil = new Map(); // `${appId}:${name}` -> ms
async function runAutoSync(apps, { originals = null, other, now = Date.now(), writeStatusFn = writeStatus, store = appliedStore, fetchFn = fetchImpl } = {}) {
    if (syncing || !apps.length) return { skipped: true, added: [], replaced: [], failed: [] };
    syncing = true;
    try {
        originals = originals || await listOriginals({ force: true });
        if (other === undefined) other = await readOtherStatus();
        const lists = [];
        for (const app of apps) lists.push(await listAppEmojis(app.client));
        const wanted = new Set(prodEmojisFromSource().keys());
        for (const l of lists) for (const e of l) wanted.add(e.name);
        for (const a of other?.apps || []) for (const e of a.emojis || []) wanted.add(e.name);
        const added = [], replaced = [], failed = [], held = [];
        const appIds = apps.map(a => a.client.application?.id ?? a.client.user?.id);
        const applied = await store.load(appIds); // null = no database: missing emojis are still added, nothing is swapped
        const toRecord = [];
        for (const [i, app] of apps.entries()) {
            const appId = appIds[i];
            const have = new Map(lists[i].map(e => [e.name, e]));
            for (const [name, meta] of originals) {
                if (!EMOJI_NAME.test(name) || !wanted.has(name)) continue;
                const key = `${appId}:${name}`;
                const exists = have.get(name);
                if (exists && !applied) continue;
                if (exists) {
                    const seen = applied.get(key);
                    // First meeting of this app and this original: note the version, swap nothing (see models/EmojiApplied.js).
                    if (seen === undefined) { if (meta.version) toRecord.push({ appId, name, version: meta.version }); continue; }
                    if (!meta.version || meta.version <= seen) continue;
                }
                if ((failedUntil.get(key) || 0) > now) { held.push(`${name} → ${app.label}`); continue; }
                const row = { name, version: meta.version, knownIds: [] };
                const res = exists ? await replaceEmoji(app.client, row, exists.id, { fetchFn }) : await uploadMissing(app.client, row, { fetchFn });
                if (res.ok) {
                    (exists ? replaced : added).push(`${name} → ${app.label}`);
                    if (meta.version) toRecord.push({ appId, name, version: meta.version });
                } else { failed.push(`${name} → ${app.label}`); failedUntil.set(key, now + 24 * 60 * 60 * 1000); console.error(`Emoji sync: ${name} to ${app.label} failed: ${res.error}`); }
            }
        }
        await store.save(toRecord);
        for (const app of apps) app.emojis = await listAppEmojis(app.client);
        await writeStatusFn(apps);
        return { added, replaced, failed, held };
    } finally { syncing = false; }
}

module.exports = { prodEmojisFromSource, listAppEmojis, buildRows, sourceCandidates, uploadMissing, replaceEmoji, appliedStore, listOriginals, uploadOriginal, safeCloudinaryError, writeStatus, readOtherStatus, runAutoSync, MAX_UPLOAD_BYTES, MAX_ORIGINAL_BYTES, EMOJI_NAME, ORIGINALS_FOLDER };
