// utils/colorCache.js
//
// The anonymous colour cache behind the View Colors right-click (added 2026-10-19 11:28 EDT; models/ColorCache.js says why it holds no user id). Pure functions, so scripts/rightClickCommands.test.js can pin them without a database.
//
// The colours panel caches on a UserPreference document: a palette field (`avatarPalette`) beside its source (`avatarPaletteSource`, Discord's asset hash), and the accent pair (`avatarColorHex` / `avatarColorSource`). For a non-user that document is never saved; instead each image's fields are written here under a key made from its source hash, and read back the next time that image is seen.
const crypto = require('crypto');

const SOURCE_SUFFIX = /(Palette|Color)Source$/;

// A source of 'default' means "no custom image": every such user shares it, so it can never identify one image's colours and is never cached.
function cacheKey(stem, sourceHash) {
    return crypto.createHash('sha256').update(`${stem}|${sourceHash}`).digest('hex');
}

// Splits the fields a render changed into one entry per image: each `*Source` field names its image, and every changed field sharing its stem (`avatarPalette`, `avatarPaletteSource`, ...) travels with it.
function entriesToCache(doc, changedFields) {
    const fields = [...new Set(changedFields.filter(f => !f.includes('.')))];
    const entries = [];
    for (const f of fields) {
        if (!SOURCE_SUFFIX.test(f)) continue;
        const source = doc[f];
        if (typeof source !== 'string' || !source || source === 'default') continue;
        const stem = f.replace(/Source$/, '');
        const data = {};
        for (const g of fields) if (g.startsWith(stem)) data[g] = doc[g];
        entries.push({ key: cacheKey(stem, source), data });
    }
    return entries;
}

// Every key the avatar page could read back for this person: their main and server avatars, each under the palette and accent stems that use it.
function candidateKeys({ avatar, guildAvatar }) {
    const keys = [];
    if (avatar) for (const stem of ['avatarPalette', 'avatarColor']) keys.push(cacheKey(stem, avatar));
    if (guildAvatar) for (const stem of ['guildAvatarPalette', 'guildAvatarColor']) keys.push(cacheKey(stem, guildAvatar));
    return keys;
}

module.exports = { cacheKey, entriesToCache, candidateKeys };
