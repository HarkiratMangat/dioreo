// utils/visionReads.js -- the vision read records (models/VisionRead.js): writing one per read, finding a read to reuse by the screenshot's exact bytes, and noting what later happened to its build (Harkirat's /autobuild tracking asks, 2026-10-25 13:31-13:50 EDT).
//
// ⚠️ NEVER LET A RECORD BREAK A READ. Every function here swallows its own failure and logs it: the read, the review and the save carry on whether or not the database answered. With no connection at all (a script, a test) nothing is attempted, so Mongoose's ten-second command buffer never stalls a read.
const crypto = require('crypto');

const connected = () => {
    try { return require('mongoose').connection.readyState === 1; } catch { return false; }
};
const model = () => require('../models/VisionRead');

function fileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

// The same attachment name in two slots of one answer, compared without case or spacing.
function repeatedAttachments(parsed) {
    const seen = new Map();
    for (const item of Array.isArray(parsed?.attachments) ? parsed.attachments : []) {
        const name = typeof item === 'string' ? item : item?.name;
        if (!name || !String(name).trim()) continue;
        const key = String(name).toLowerCase().replace(/\s+/g, '');
        // The first spelling read is the one reported.
        seen.set(key, { name: seen.get(key)?.name || String(name).trim(), n: (seen.get(key)?.n || 0) + 1 });
    }
    return [...seen.values()].filter(v => v.n > 1).map(v => v.name);
}

// The newest earlier read of these exact bytes, or null. Counts the reuse.
async function findReuse(hash) {
    if (!hash || !connected()) return null;
    try {
        const read = await model().findOne({ fileHash: hash, raw: { $ne: null } }).sort({ createdAt: -1 }).lean();
        if (read) model().updateOne({ _id: read._id }, { $inc: { reusedCount: 1 }, $set: { lastReusedAt: new Date() } }).catch(() => {});
        return read;
    } catch (err) {
        console.error('Vision read lookup failed (reading the screenshot instead):', err.message);
        return null;
    }
}

async function recordRead(fields) {
    if (!connected()) return null;
    try {
        const doc = await model().create(fields);
        return doc._id;
    } catch (err) {
        console.error('Vision read record failed (the read itself is fine):', err.message);
        return null;
    }
}

async function noteOutcome(readId, outcome, loadoutId = null) {
    if (!readId || !connected()) return;
    try { await model().updateOne({ _id: readId }, { $set: { outcome, ...(loadoutId ? { loadoutId } : {}) } }); } catch (err) { console.error('Vision read outcome not recorded:', err.message); }
}

// The fields Adjust can change, compared before and after; only real changes are kept.
const TRACKED = ['weaponName', 'gunsmithCode', 'attachments', 'category', 'mode', 'badgesRaw', 'buildLabel'];
function adjustmentsBetween(before, after, at = new Date()) {
    const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    return TRACKED.filter(f => !same(before?.[f], after?.[f])).map(field => ({ at, field, from: before?.[field] ?? null, to: after?.[field] ?? null }));
}

async function noteAdjustment(readId, before, after) {
    const changes = adjustmentsBetween(before, after);
    if (!readId || !changes.length || !connected()) return;
    try { await model().updateOne({ _id: readId }, { $push: { adjustments: { $each: changes } } }); } catch (err) { console.error('Vision read adjustment not recorded:', err.message); }
}

module.exports = { fileHash, repeatedAttachments, findReuse, recordRead, noteOutcome, noteAdjustment, adjustmentsBetween };
